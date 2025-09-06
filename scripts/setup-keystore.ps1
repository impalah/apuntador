# ====================================================================
# 🔐 Android Keystore Setup Script
# ====================================================================
# 
# Purpose: Configure Android keystore for release builds
# Usage: .\setup-keystore.ps1
#
# This script will:
# 1. Generate a new keystore if needed
# 2. Create key.properties file
# 3. Set up environment variables
# ====================================================================

param(
    [Parameter(Mandatory=$false)]
    [string]$KeystorePath = "android\app\apuntador-release-key.keystore",
    
    [Parameter(Mandatory=$false)]
    [string]$Alias = "apuntador",
    
    [Parameter(Mandatory=$false)]
    [switch]$Help
)

if ($Help) {
    Write-Host "🔐 Android Keystore Setup Script" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\setup-keystore.ps1 [-KeystorePath path] [-Alias alias]" -ForegroundColor White
    Write-Host ""
    Write-Host "Parameters:" -ForegroundColor Yellow
    Write-Host "  KeystorePath : Path to keystore file (default: android\app\apuntador-release-key.keystore)" -ForegroundColor White
    Write-Host "  Alias        : Key alias (default: apuntador)" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\setup-keystore.ps1" -ForegroundColor Green
    Write-Host "  .\setup-keystore.ps1 -KeystorePath my-app.keystore -Alias myapp" -ForegroundColor Green
    exit 0
}

Write-Host "🔐 Setting up Android Keystore for Release Builds" -ForegroundColor Cyan
Write-Host ""

# Check if keystore already exists
if (Test-Path $KeystorePath) {
    Write-Host "⚠️  Keystore already exists: $KeystorePath" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/N)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "❌ Cancelled by user" -ForegroundColor Red
        exit 0
    }
}

# Get keystore information
Write-Host "📝 Please provide the following information:" -ForegroundColor Yellow
Write-Host ""

$storePassword = Read-Host "Keystore password" -AsSecureString
$keyPassword = Read-Host "Key password" -AsSecureString
$firstName = Read-Host "First name"
$lastName = Read-Host "Last name"
$organizationUnit = Read-Host "Organization unit (e.g., IT Department)"
$organization = Read-Host "Organization (e.g., Your Company)"
$city = Read-Host "City"
$state = Read-Host "State/Province"
$country = Read-Host "Country code (e.g., US, ES)"

# Convert SecureString to plain text for keytool
$storePasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($storePassword))
$keyPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($keyPassword))

# Create android/app directory if it doesn't exist
$keystoreDir = Split-Path $KeystorePath -Parent
if (-not (Test-Path $keystoreDir)) {
    New-Item -ItemType Directory -Path $keystoreDir -Force | Out-Null
    Write-Host "✅ Created directory: $keystoreDir" -ForegroundColor Green
}

# Generate keystore
Write-Host ""
Write-Host "🔧 Generating keystore..." -ForegroundColor Magenta

$dname = "CN=$firstName $lastName, OU=$organizationUnit, O=$organization, L=$city, ST=$state, C=$country"

try {
    $keytoolArgs = @(
        "-genkeypair"
        "-v"
        "-keystore", $KeystorePath
        "-alias", $Alias
        "-keyalg", "RSA"
        "-keysize", "2048"
        "-validity", "10000"
        "-storepass", $storePasswordPlain
        "-keypass", $keyPasswordPlain
        "-dname", $dname
    )
    
    & keytool @keytoolArgs
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Keystore generated successfully" -ForegroundColor Green
    } else {
        throw "Keytool failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Host "❌ Failed to generate keystore: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Make sure you have Java JDK installed and keytool is in your PATH" -ForegroundColor Yellow
    exit 1
}

# Create key.properties file
Write-Host ""
Write-Host "📄 Creating key.properties file..." -ForegroundColor Magenta

$keyPropertiesPath = "android\key.properties"
$keystoreFileName = Split-Path $KeystorePath -Leaf

$keyPropertiesContent = @"
storePassword=$storePasswordPlain
keyPassword=$keyPasswordPlain
keyAlias=$Alias
storeFile=$keystoreFileName
"@

$keyPropertiesContent | Out-File -FilePath $keyPropertiesPath -Encoding UTF8

Write-Host "✅ Created: $keyPropertiesPath" -ForegroundColor Green

# Set environment variables
Write-Host ""
Write-Host "🌍 Setting up environment variables..." -ForegroundColor Magenta

[Environment]::SetEnvironmentVariable("ANDROID_KEYSTORE_PASSWORD", $storePasswordPlain, "User")
[Environment]::SetEnvironmentVariable("ANDROID_KEY_PASSWORD", $keyPasswordPlain, "User")
[Environment]::SetEnvironmentVariable("ANDROID_KEY_ALIAS", $Alias, "User")
[Environment]::SetEnvironmentVariable("ANDROID_KEYSTORE_FILE", $keystoreFileName, "User")

Write-Host "✅ Environment variables set" -ForegroundColor Green

# Show summary
Write-Host ""
Write-Host "🎉 Keystore setup completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Yellow
Write-Host "  Keystore file: $KeystorePath" -ForegroundColor White
Write-Host "  Key alias: $Alias" -ForegroundColor White
Write-Host "  Properties file: $keyPropertiesPath" -ForegroundColor White
Write-Host ""
Write-Host "🔒 Security Notes:" -ForegroundColor Yellow
Write-Host "  • Keep your keystore file secure and backed up" -ForegroundColor White
Write-Host "  • Never commit key.properties to version control" -ForegroundColor White
Write-Host "  • Store passwords securely (consider using a password manager)" -ForegroundColor White
Write-Host ""
Write-Host "🚀 You can now build release APKs and Bundles!" -ForegroundColor Green

# Clean up sensitive variables
$storePasswordPlain = $null
$keyPasswordPlain = $null
