param(
    [string]$CertName = "Apuntador Code Signing",
    [string]$OutputDir = "certificates"
)

Write-Host "Creating certificate..." -ForegroundColor Green

if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
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
    $cert = New-SelfSignedCertificate @CertParams
    
    if ($cert) {
        Write-Host "Certificate created successfully" -ForegroundColor Green
        Write-Host "Thumbprint: $($cert.Thumbprint)"
        
        $pfxPath = Join-Path $OutputDir "apuntador-codesigning.pfx"
        $password = ConvertTo-SecureString -String "apuntador2024!" -Force -AsPlainText
        
        Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $password | Out-Null
        
        if (Test-Path $pfxPath) {
            Write-Host "PFX exported: $pfxPath" -ForegroundColor Green
            
            $base64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($pfxPath))
            $base64Path = Join-Path $OutputDir "certificate-base64.txt"
            $base64 | Out-File -FilePath $base64Path -Encoding UTF8
            
            Write-Host "Base64 generated: $base64Path" -ForegroundColor Green
            Write-Host "Password: apuntador2024!"
        }
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Run PowerShell as Administrator" -ForegroundColor Yellow
}