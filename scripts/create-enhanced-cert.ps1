param(
    [string]$CertName = "Apuntador Code Signing",
    [string]$OutputDir = "certificates",
    [SecureString]$CertPassword,
    [switch]$Interactive,
    [switch]$Verbose
)

if ($Verbose) { $VerbosePreference = "Continue" }

Write-Host "[SECURE] Creating certificate for code signing..." -ForegroundColor Green

# Validate and handle password securely
if ($Interactive) {
    Write-Host "Enter certificate password (minimum 8 characters):" -ForegroundColor Yellow
    do {
        $CertPassword = Read-Host -AsSecureString
        $testPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR([Runtime.InteropServices.Marshal]::SecureStringToBSTR($CertPassword))
        if ($testPassword.Length -lt 8) {
            Write-Host "Password too short. Please enter at least 8 characters:" -ForegroundColor Red
        }
    } while ($testPassword.Length -lt 8)
    $passwordDisplay = "***HIDDEN*** (length: $($testPassword.Length))"
    # Clear the test password from memory
    $testPassword = $null
} elseif (-not $CertPassword) {
    $CertPassword = ConvertTo-SecureString -String "apuntador2024!" -Force -AsPlainText
    $passwordDisplay = "apuntador2024! (default)"
    Write-Verbose "Using default password"
} else {
    $passwordDisplay = "***PROVIDED***"
    Write-Verbose "Using provided SecureString password"
}

# Create output directory
if (!(Test-Path $OutputDir)) {
    Write-Verbose "Creating output directory: $OutputDir"
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
    Write-Host "📁 Created directory: $OutputDir" -ForegroundColor Cyan
}

# Certificate parameters
$CertParams = @{
    Subject = "CN=$CertName"
    CertStoreLocation = "Cert:\CurrentUser\My"
    KeyAlgorithm = "RSA"
    KeyLength = 2048
    KeyExportPolicy = "Exportable"
    KeyUsage = "DigitalSignature"
    Type = "CodeSigningCert"
    NotAfter = (Get-Date).AddYears(3)
}

Write-Verbose "Certificate parameters: $(ConvertTo-Json $CertParams -Compress)"

try {
    Write-Host "[KEY] Generating certificate..." -ForegroundColor Yellow
    Write-Verbose "Executing New-SelfSignedCertificate"
    
    $cert = New-SelfSignedCertificate @CertParams
    
    if ($cert) {
        Write-Host "[OK] Certificate created successfully" -ForegroundColor Green
        Write-Host "   Thumbprint: $($cert.Thumbprint)" -ForegroundColor White
        Write-Host "   Subject: $($cert.Subject)" -ForegroundColor White
        Write-Host "   Valid Until: $($cert.NotAfter)" -ForegroundColor White
        Write-Verbose "Certificate details: Subject=$($cert.Subject), Thumbprint=$($cert.Thumbprint)"
        
        $pfxPath = Join-Path $OutputDir "apuntador-codesigning.pfx"
        Write-Verbose "Exporting to PFX: $pfxPath"
        
        Write-Host "📤 Exporting PFX certificate..." -ForegroundColor Yellow
        Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $CertPassword | Out-Null
        
        if (Test-Path $pfxPath) {
            $fileSize = (Get-Item $pfxPath).Length
            Write-Host "[OK] PFX exported: $pfxPath" -ForegroundColor Green
            Write-Host "   Size: $([math]::Round($fileSize / 1KB, 2)) KB" -ForegroundColor White
            Write-Verbose "PFX file size: $fileSize bytes"
            
            Write-Host "[REFRESH] Generating Base64 for GitHub Actions..." -ForegroundColor Yellow
            $base64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($pfxPath))
            $base64Path = Join-Path $OutputDir "certificate-base64.txt"
            $base64 | Out-File -FilePath $base64Path -Encoding UTF8
            
            Write-Host "[OK] Base64 generated: $base64Path" -ForegroundColor Green
            Write-Host "   Password: $passwordDisplay" -ForegroundColor White
            Write-Verbose "Base64 length: $($base64.Length) characters"
            
            # Create info file
            $infoContent = @"
Apuntador Code Signing Certificate Information
============================================

Generated: $(Get-Date)
Certificate Name: $CertName
Thumbprint: $($cert.Thumbprint)
Valid Until: $($cert.NotAfter)
Algorithm: RSA 2048

Files:
- PFX Certificate: $pfxPath
- Base64 for GitHub: $base64Path

GitHub Secrets Required:
- WINDOWS_CERTIFICATE: [content of certificate-base64.txt]
- WINDOWS_CERTIFICATE_PASSWORD: [the password used]

Usage Examples:
# Default password
.\scripts\create-self-signed-cert.ps1

# Interactive mode
.\scripts\create-self-signed-cert.ps1 -Interactive

# Custom password
`$pass = ConvertTo-SecureString "MyPass123!" -AsPlainText -Force
.\scripts\create-self-signed-cert.ps1 -CertPassword `$pass
"@
            
            $infoPath = Join-Path $OutputDir "certificate-info.txt"
            $infoContent | Out-File -FilePath $infoPath -Encoding UTF8
            Write-Host "[LIST] Info saved: $infoPath" -ForegroundColor Cyan
            
            Write-Host ""
            Write-Host "[SUCCESS] SUCCESS: Certificate ready for code signing!" -ForegroundColor Green
            Write-Host ""
            Write-Host "[NOTE] Next Steps:" -ForegroundColor Blue
            Write-Host "1. Copy content of certificate-base64.txt to GitHub secret WINDOWS_CERTIFICATE" -ForegroundColor White
            Write-Host "2. Add password to GitHub secret WINDOWS_CERTIFICATE_PASSWORD" -ForegroundColor White
            Write-Host "3. Run a build to test code signing" -ForegroundColor White
            
        } else {
            throw "Failed to export PFX certificate"
        }
        
    } else {
        throw "Failed to generate certificate"
    }
    
} catch {
    Write-Host "[ERROR] Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "[TIP] Troubleshooting:" -ForegroundColor Yellow
    Write-Host "   - Make sure PowerShell is running as Administrator" -ForegroundColor White
    Write-Host "   - Check if certificate store is accessible" -ForegroundColor White
    Write-Host "   - Verify output directory permissions" -ForegroundColor White
    Write-Verbose "Full error: $($_.Exception)"
    exit 1
}

Write-Host ""
Write-Host "🔒 Self-signed certificate ready for Tauri!" -ForegroundColor Green