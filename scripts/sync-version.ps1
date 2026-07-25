# ====================================================================
# Version Sync Script
# ====================================================================
# 
# Purpose: Sync version from package.json to Android build.gradle and
#          iOS project.pbxproj (MARKETING_VERSION/CURRENT_PROJECT_VERSION)
# Usage: .\sync-version.ps1
# ====================================================================

param(
    [Parameter(Mandatory=$false)]
    [switch]$Help
)

if ($Help) {
    Write-Host "Version Sync Script" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Purpose: Synchronize version from package.json to Android build.gradle" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\sync-version.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "This script will:" -ForegroundColor Yellow
    Write-Host "  1. Read version from package.json" -ForegroundColor White
    Write-Host "  2. Calculate appropriate versionCode" -ForegroundColor White
    Write-Host "  3. Update android/app/build.gradle" -ForegroundColor White
    Write-Host "  4. Update ios/App/App.xcodeproj/project.pbxproj (MARKETING_VERSION, CURRENT_PROJECT_VERSION)" -ForegroundColor White
    exit 0
}

Write-Host "Synchronizing version from package.json to Android..." -ForegroundColor Cyan

# Check if files exist
if (-not (Test-Path "package.json")) {
    Write-Host "Error: package.json not found" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "android/app/build.gradle")) {
    Write-Host "Error: android/app/build.gradle not found" -ForegroundColor Red
    exit 1
}

try {
    # Read version from package.json
    $packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
    $version = $packageJson.version
    
    Write-Host "Found version in package.json: $version" -ForegroundColor Green
    
    # Parse semantic version (major.minor.patch)
    if ($version -match '^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$') {
        $major = [int]$matches[1]
        $minor = [int]$matches[2]
        $patch = [int]$matches[3]
        
        # Calculate versionCode (major * 10000 + minor * 100 + patch)
        $versionCode = $major * 10000 + $minor * 100 + $patch
        
        # For pre-1.0 versions, use simpler calculation
        if ($major -eq 0) {
            $versionCode = $minor * 10 + $patch
        }
        
        Write-Host "Calculated versionCode: $versionCode" -ForegroundColor Green
        
        # Read current build.gradle
        $buildGradle = Get-Content "android/app/build.gradle" -Raw
        
        # Update versionCode
        $buildGradle = $buildGradle -replace 'versionCode \d+', "versionCode $versionCode"
        
        # Update versionName
        $buildGradle = $buildGradle -replace 'versionName "[^"]*"', "versionName `"$version`""
        
        # Write back to file
        $buildGradle | Out-File "android/app/build.gradle" -Encoding UTF8
        
        Write-Host "Updated android/app/build.gradle:" -ForegroundColor Green
        Write-Host "   versionCode: $versionCode" -ForegroundColor White
        Write-Host "   versionName: `"$version`"" -ForegroundColor White

        # Update iOS project.pbxproj (MARKETING_VERSION, CURRENT_PROJECT_VERSION)
        $pbxprojPath = "ios/App/App.xcodeproj/project.pbxproj"

        if (Test-Path $pbxprojPath) {
            $pbxproj = Get-Content $pbxprojPath -Raw

            $pbxproj = $pbxproj -replace 'MARKETING_VERSION = [0-9][^;]*;', "MARKETING_VERSION = $version;"
            $pbxproj = $pbxproj -replace 'CURRENT_PROJECT_VERSION = \d+;', "CURRENT_PROJECT_VERSION = $versionCode;"

            $pbxproj | Out-File $pbxprojPath -Encoding UTF8 -NoNewline

            Write-Host "Updated ios/App/App.xcodeproj/project.pbxproj:" -ForegroundColor Green
            Write-Host "   MARKETING_VERSION: $version" -ForegroundColor White
            Write-Host "   CURRENT_PROJECT_VERSION: $versionCode" -ForegroundColor White
        } else {
            Write-Host "Warning: ios/App/App.xcodeproj/project.pbxproj not found, skipping iOS sync" -ForegroundColor Yellow
        }

    } else {
        Write-Host "Error: Invalid version format in package.json: $version" -ForegroundColor Red
        Write-Host "Expected format: major.minor.patch (e.g., 1.2.3)" -ForegroundColor Yellow
        exit 1
    }
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Version synchronization completed!" -ForegroundColor Green
Write-Host "Remember to rebuild your Android and iOS apps to see the new version." -ForegroundColor Yellow
