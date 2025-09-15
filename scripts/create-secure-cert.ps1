param(
    [string]$CertName = "Apuntador Code Signing",
    [string]$OutputDir = "certificates",
    [SecureString]$CertPassword,
    [switch]$Interactive
)

Write-Host "🔐 Creating certificate for code signing..." -ForegroundColor Green

# Manejar la password de forma segura
if ($Interactive) {
    Write-Host "Enter password for certificate (minimum 8 characters):" -ForegroundColor Yellow
    $CertPassword = Read-Host -AsSecureString
    $passwordText = "***HIDDEN***"
} elseif (-not $CertPassword) {
    $CertPassword = ConvertTo-SecureString -String "apuntador2024!" -Force -AsPlainText
    $passwordText = "apuntador2024! (default)"
} else {
    $passwordText = "***PROVIDED***"
}

if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
    Write-Host "📁 Created directory: $OutputDir" -ForegroundColor Cyan
}

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

try {
    Write-Host "🔑 Generating certificate..." -ForegroundColor Yellow
    $cert = New-SelfSignedCertificate @CertParams
    
    if ($cert) {
        Write-Host "✅ Certificate created successfully" -ForegroundColor Green
        Write-Host "   Thumbprint: $($cert.Thumbprint)" -ForegroundColor White
        Write-Host "   Subject: $($cert.Subject)" -ForegroundColor White
        Write-Host "   Valid Until: $($cert.NotAfter)" -ForegroundColor White
        Write-Host ""
        
        $pfxPath = Join-Path $OutputDir "apuntador-codesigning.pfx"
        
        Write-Host "📤 Exporting PFX certificate..." -ForegroundColor Yellow
        Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $CertPassword | Out-Null
        
        if (Test-Path $pfxPath) {
            Write-Host "✅ PFX exported: $pfxPath" -ForegroundColor Green
            
            $fileSize = (Get-Item $pfxPath).Length
            Write-Host "   Size: $([math]::Round($fileSize / 1KB, 2)) KB" -ForegroundColor White
            Write-Host ""
            
            Write-Host "🔄 Generating Base64 for GitHub Actions..." -ForegroundColor Yellow
            $base64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($pfxPath))
            $base64Path = Join-Path $OutputDir "certificate-base64.txt"
            $base64 | Out-File -FilePath $base64Path -Encoding UTF8
            
            Write-Host "✅ Base64 generated: $base64Path" -ForegroundColor Green
            Write-Host "   Password: $passwordText" -ForegroundColor White
            Write-Host ""
            
            # Crear archivo de información
            $certInfo = @"
# Apuntador Code Signing Certificate
Generated: $(Get-Date)
Thumbprint: $($cert.Thumbprint)
Valid Until: $($cert.NotAfter)
PFX File: $pfxPath
Base64 File: $base64Path

## GitHub Secrets Required:
WINDOWS_CERTIFICATE: [content of certificate-base64.txt]
WINDOWS_CERTIFICATE_PASSWORD: [the password used]

## Security Notes:
- Keep PFX file secure and do not commit to Git
- Store password safely
- Certificate is valid for 3 years
"@
            
            $infoPath = Join-Path $OutputDir "certificate-info.txt"
            $certInfo | Out-File -FilePath $infoPath -Encoding UTF8
            Write-Host "📋 Certificate info saved: $infoPath" -ForegroundColor Cyan
            
            Write-Host ""
            Write-Host "🎉 CERTIFICATE CREATED SUCCESSFULLY!" -ForegroundColor Green
            Write-Host ""
            Write-Host "📝 Next Steps:" -ForegroundColor Blue
            Write-Host "1. Copy content of '$base64Path'" -ForegroundColor White
            Write-Host "2. Go to GitHub → Settings → Secrets → Actions" -ForegroundColor White
            Write-Host "3. Add these secrets:" -ForegroundColor White
            Write-Host "   - WINDOWS_CERTIFICATE: [paste certificate-base64.txt content]" -ForegroundColor White
            Write-Host "   - WINDOWS_CERTIFICATE_PASSWORD: [the password]" -ForegroundColor White
            Write-Host ""
            Write-Host "⚠️  IMPORTANT: Keep certificate files secure!" -ForegroundColor Red
            
        } else {
            Write-Host "❌ Failed to export PFX certificate" -ForegroundColor Red
            exit 1
        }
        
    } else {
        Write-Host "❌ Failed to generate certificate" -ForegroundColor Red
        exit 1
    }
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "⚠️  Make sure to run PowerShell as Administrator" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🔒 Self-signed certificate ready for Tauri code signing!" -ForegroundColor Green