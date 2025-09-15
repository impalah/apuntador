param(
    [string]$CertName = "Apuntador Code Signing",
    [string]$OutputDir = "certificates",
    [SecureString]$CertPassword,
    [switch]$Interactive
)

Write-Host "Creating certificate..." -ForegroundColor Green

# Handle password securely
if ($Interactive) {
    Write-Host "Enter certificate password (minimum 8 characters):" -ForegroundColor Yellow
    do {
        $CertPassword = Read-Host -AsSecureString
        # Convert to check length, then clear
        $testPass = [Runtime.InteropServices.Marshal]::PtrToStringBSTR([Runtime.InteropServices.Marshal]::SecureStringToBSTR($CertPassword))
        $passLength = $testPass.Length
        $testPass = $null  # Clear from memory
        if ($passLength -lt 8) {
            Write-Host "Password too short. Please enter at least 8 characters:" -ForegroundColor Red
        }
    } while ($passLength -lt 8)
    $passwordDisplay = "***HIDDEN***"
} elseif (-not $CertPassword) {
    $CertPassword = ConvertTo-SecureString -String "apuntador2024!" -Force -AsPlainText
    $passwordDisplay = "apuntador2024! (default)"
} else {
    $passwordDisplay = "***PROVIDED***"
}

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
        Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $CertPassword | Out-Null
        
        if (Test-Path $pfxPath) {
            Write-Host "PFX exported: $pfxPath" -ForegroundColor Green
            
            $base64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($pfxPath))
            $base64Path = Join-Path $OutputDir "certificate-base64.txt"
            $base64 | Out-File -FilePath $base64Path -Encoding UTF8
            
            Write-Host "Base64 generated: $base64Path" -ForegroundColor Green
            Write-Host "Password: $passwordDisplay"
            
            Write-Host ""
            Write-Host "SUCCESS: Certificate ready for code signing!" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Run PowerShell as Administrator" -ForegroundColor Yellow
}