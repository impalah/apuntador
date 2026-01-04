# ====================================================================
# Android Bundle Builder Script (PowerShell)
# ====================================================================
# 
# Purpose: Build Android App Bundle (AAB) for Google Play Store
# Usage: .\build-bundle.ps1 [release|debug] [version]
# Example: .\build-bundle.ps1 release 0.1.6
#
# Requirements:
# - Node.js 20+
# - Java JDK 17+
# - Android SDK
# - Capacitor CLI
# ====================================================================

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("release", "debug")]
    [string]$BuildType = "release",
    
    [Parameter(Mandatory=$false)]
    [string]$Version = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$Help
)

# Show help
if ($Help) {
    Write-Host "Android Bundle Builder Script" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\build-bundle.ps1 [BuildType] [Version]" -ForegroundColor White
    Write-Host ""
    Write-Host "Parameters:" -ForegroundColor Yellow
    Write-Host "  BuildType   : release or debug (default: release)" -ForegroundColor White
    Write-Host "  Version     : Version number (optional)" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\build-bundle.ps1 release 0.1.6" -ForegroundColor Green
    Write-Host "  .\build-bundle.ps1 debug" -ForegroundColor Green
    Write-Host "  .\build-bundle.ps1 -Help" -ForegroundColor Green
    exit 0
}

# Colors for output
$ColorInfo = "Cyan"
$ColorSuccess = "Green"
$ColorWarning = "Yellow"
$ColorError = "Red"
$ColorStep = "Magenta"

function Write-Step {
    param([string]$Message)
    Write-Host "Step: $Message" -ForegroundColor $ColorStep
}

function Write-Success {
    param([string]$Message)
    Write-Host "Success: $Message" -ForegroundColor $ColorSuccess
}

function Write-Error {
    param([string]$Message)
    Write-Host "Error: $Message" -ForegroundColor $ColorError
}

function Write-Warning {
    param([string]$Message)
    Write-Host "Warning: $Message" -ForegroundColor $ColorWarning
}

function Write-Info {
    param([string]$Message)
    Write-Host "Info: $Message" -ForegroundColor $ColorInfo
}

# Script start
Write-Host "Starting Android Bundle Build Process" -ForegroundColor $ColorInfo
Write-Host "Build Type: $BuildType" -ForegroundColor $ColorInfo
if ($Version) {
    Write-Host "Version: $Version" -ForegroundColor $ColorInfo
}
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Error "package.json not found. Please run this script from the project root."
    exit 1
}

# Check if android directory exists
if (-not (Test-Path "android")) {
    Write-Error "Android project not found. Please run 'npx cap add android' first."
    exit 1
}

try {
    # Step 1: Install dependencies
    Write-Step "Installing npm dependencies..."
    npm ci
    if ($LASTEXITCODE -ne 0) {
        throw "npm ci failed"
    }
    Write-Success "Dependencies installed"

    # Step 2: Build web project
    Write-Step "Building web project..."
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Web build failed"
    }
    Write-Success "Web build completed"

    # Step 3: Copy web assets to Android
    Write-Step "Copying web assets to Android..."
    npx cap copy android
    if ($LASTEXITCODE -ne 0) {
        throw "Capacitor copy failed"
    }
    Write-Success "Assets copied to Android"

    # Step 4: Sync Capacitor
    Write-Step "Syncing Capacitor plugins..."
    npx cap sync android
    if ($LASTEXITCODE -ne 0) {
        throw "Capacitor sync failed"
    }
    Write-Success "Capacitor sync completed"

    # Step 5: Build Android Bundle
    Write-Step "Building Android Bundle ($BuildType)..."
    
    Push-Location "android"
    try {
        if ($BuildType -eq "release") {
            # Check for keystore configuration
            if (-not (Test-Path "key.properties")) {
                Write-Warning "key.properties not found. Creating from environment variables..."
                
                # Check if environment variables are set
                $keystorePassword = $env:ANDROID_KEYSTORE_PASSWORD
                $keyPassword = $env:ANDROID_KEY_PASSWORD
                $keyAlias = $env:ANDROID_KEY_ALIAS
                $keystoreFile = $env:ANDROID_KEYSTORE_FILE
                
                if (-not $keystorePassword -or -not $keyPassword -or -not $keyAlias) {
                    Write-Error "Missing keystore configuration. Please set environment variables:"
                    Write-Host "  ANDROID_KEYSTORE_PASSWORD" -ForegroundColor Yellow
                    Write-Host "  ANDROID_KEY_PASSWORD" -ForegroundColor Yellow
                    Write-Host "  ANDROID_KEY_ALIAS" -ForegroundColor Yellow
                    Write-Host "  ANDROID_KEYSTORE_FILE (optional)" -ForegroundColor Yellow
                    throw "Keystore configuration missing"
                }
                
                $keystoreFile = if ($keystoreFile) { $keystoreFile } else { "apuntador-release-key.keystore" }
                
                @"
storePassword=$keystorePassword
keyPassword=$keyPassword
keyAlias=$keyAlias
storeFile=$keystoreFile
"@ | Out-File -FilePath "key.properties" -Encoding UTF8
                
                Write-Success "key.properties created"
            }
            
            .\gradlew bundleRelease
        } else {
            .\gradlew bundleDebug
        }
        
        if ($LASTEXITCODE -ne 0) {
            throw "Gradle build failed"
        }
        
        Write-Success "Android Bundle build completed"
    }
    finally {
        Pop-Location
    }

    # Step 6: Verify bundle was created
    $bundlePath = if ($BuildType -eq "release") {
        "android\app\build\outputs\bundle\release\app-release.aab"
    } else {
        "android\app\build\outputs\bundle\debug\app-debug.aab"
    }
    
    if (Test-Path $bundlePath) {
        $bundleInfo = Get-Item $bundlePath
        Write-Success "Bundle created successfully!"
        Write-Info "Location: $($bundleInfo.FullName)"
        Write-Info "Size: $([math]::Round($bundleInfo.Length / 1MB, 2)) MB"
        Write-Info "Created: $($bundleInfo.CreationTime)"
        
        # Copy to project root with version
        $outputName = if ($Version) {
            "apuntador-$Version-$BuildType.aab"
        } else {
            "apuntador-$BuildType.aab"
        }
        
        Copy-Item $bundlePath $outputName -Force
        Write-Success "Bundle copied to: $outputName"
        
        if ($BuildType -eq "release") {
            Write-Host ""
            Write-Host "[SUCCESS] Ready for Google Play Store!" -ForegroundColor Green
            Write-Host "Upload the .aab file to Google Play Console" -ForegroundColor Yellow
        }
    } else {
        Write-Error "Bundle file not found at expected location: $bundlePath"
        Write-Info "Checking build output directories..."
        
        $releaseDir = "android\app\build\outputs\bundle\release"
        $debugDir = "android\app\build\outputs\bundle\debug"
        
        if (Test-Path $releaseDir) {
            Write-Info "Release directory contents:"
            Get-ChildItem $releaseDir | ForEach-Object { Write-Host "  $_" }
        }
        
        if (Test-Path $debugDir) {
            Write-Info "Debug directory contents:"
            Get-ChildItem $debugDir | ForEach-Object { Write-Host "  $_" }
        }
        
        throw "Bundle creation failed"
    }

} catch {
    Write-Error "Build failed: $($_.Exception.Message)"
    Write-Host ""
    Write-Host "Troubleshooting tips:" -ForegroundColor Yellow
    Write-Host "1. Make sure you have Android SDK installed" -ForegroundColor White
    Write-Host "2. Verify Java JDK 17+ is installed" -ForegroundColor White
    Write-Host "3. Check that Capacitor is properly configured" -ForegroundColor White
    Write-Host "4. For release builds, ensure keystore is configured" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Success "Bundle build process completed successfully!"
