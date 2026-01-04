#!/usr/bin/env pwsh

# Script para crear certificado auto-firmado para Tauri
# Uso: .\scripts\create-cert-clean.ps1

param(
    [string]$CertName = "Apuntador Code Signing",
    [string]$CompanyName = "Apuntador",
    [string]$OutputDir = "certificates"
)

Write-Host "Generando certificado auto-firmado para Tauri..." -ForegroundColor Green
Write-Host ""

# Crear directorio para certificados si no existe
if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
    Write-Host "📁 Directorio '$OutputDir' creado" -ForegroundColor Cyan
}

# Configuración del certificado
$CertParams = @{
    Subject = "CN=$CertName, O=$CompanyName"
    CertStoreLocation = "Cert:\CurrentUser\My"
    KeyAlgorithm = "RSA"
    KeyLength = 2048
    Provider = "Microsoft Enhanced RSA and AES Cryptographic Provider"
    KeyExportPolicy = "Exportable"
    KeyUsage = "DigitalSignature"
    Type = "CodeSigningCert"
    NotAfter = (Get-Date).AddYears(3)
}

try {
    # Generar el certificado
    Write-Host "[KEY] Generando certificado..." -ForegroundColor Yellow
    $cert = New-SelfSignedCertificate @CertParams
    
    if ($cert) {
        Write-Host "Certificado generado exitosamente" -ForegroundColor Green
        Write-Host "   Thumbprint: $($cert.Thumbprint)" -ForegroundColor White
        Write-Host "   Subject: $($cert.Subject)" -ForegroundColor White
        Write-Host "   Valid Until: $($cert.NotAfter)" -ForegroundColor White
        Write-Host ""
        
        # Exportar certificado como PFX
        $pfxPath = Join-Path $OutputDir "apuntador-codesigning.pfx"
        $password = ConvertTo-SecureString -String "apuntador2024!" -Force -AsPlainText
        
        Write-Host "📤 Exportando certificado PFX..." -ForegroundColor Yellow
        Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $password | Out-Null
        
        if (Test-Path $pfxPath) {
            Write-Host "Certificado PFX exportado: $pfxPath" -ForegroundColor Green
            
            # Mostrar el tamaño del archivo
            $fileSize = (Get-Item $pfxPath).Length
            Write-Host "   Tamaño: $([math]::Round($fileSize / 1KB, 2)) KB" -ForegroundColor White
            Write-Host ""
            
            # Generar Base64 para GitHub Actions
            Write-Host "Generando Base64 para GitHub Actions..." -ForegroundColor Yellow
            $base64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($pfxPath))
            $base64Path = Join-Path $OutputDir "certificate-base64.txt"
            $base64 | Out-File -FilePath $base64Path -Encoding UTF8
            Write-Host "Base64 generado: $base64Path" -ForegroundColor Green
            Write-Host ""
            
            # Crear archivo con información del certificado
            $certInfo = @"
# Certificado Auto-firmado para Apuntador
Archivo PFX: $pfxPath
Password: apuntador2024!
Thumbprint: $($cert.Thumbprint)
Válido hasta: $($cert.NotAfter)
Generado: $(Get-Date)

## Para usar en GitHub Actions:
1. Agregar secrets en GitHub:
   - WINDOWS_CERTIFICATE: (contenido de certificate-base64.txt)
   - WINDOWS_CERTIFICATE_PASSWORD: apuntador2024!
"@
            
            $infoPath = Join-Path $OutputDir "certificate-info.txt"
            $certInfo | Out-File -FilePath $infoPath -Encoding UTF8
            Write-Host "Información guardada en: $infoPath" -ForegroundColor Cyan
            
            Write-Host "[SUCCESS] CERTIFICADO CREADO EXITOSAMENTE!" -ForegroundColor Green
            Write-Host ""
            Write-Host "PRÓXIMOS PASOS:" -ForegroundColor Blue
            Write-Host "1. Copia el contenido de '$base64Path'" -ForegroundColor White
            Write-Host "2. Ve a GitHub → Settings → Secrets and variables → Actions" -ForegroundColor White
            Write-Host "3. Agrega estos secrets:" -ForegroundColor White
            Write-Host "   - WINDOWS_CERTIFICATE: (pega el contenido de certificate-base64.txt)" -ForegroundColor White
            Write-Host "   - WINDOWS_CERTIFICATE_PASSWORD: apuntador2024!" -ForegroundColor White
            Write-Host ""
            Write-Host "[WARNING]  IMPORTANTE: Mantén estos archivos seguros y NO los subas a GitHub" -ForegroundColor Red
            
        } else {
            Write-Host "[ERROR] Error al exportar certificado PFX" -ForegroundColor Red
            exit 1
        }
        
    } else {
        Write-Host "[ERROR] Error al generar certificado" -ForegroundColor Red
        exit 1
    }
    
} catch {
    Write-Host "[ERROR] Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "[WARNING]  Asegúrate de ejecutar PowerShell como Administrador" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Certificado auto-firmado listo para usar con Tauri" -ForegroundColor Green