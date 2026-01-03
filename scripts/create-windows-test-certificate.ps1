# Script para crear un certificado de prueba para firma de código Windows
# NOTA: Este certificado es SOLO para pruebas. Los usuarios verán advertencias.
# Para producción, necesitas un certificado comercial de DigiCert, Sectigo, etc.

# Configuración
$certName = "Apuntador Test Certificate"
$certPassword = "Test123!@#"
$pfxPath = "$PSScriptRoot\..\certificates\windows-test-cert.pfx"
$cerPath = "$PSScriptRoot\..\certificates\windows-test-cert.cer"

# Crear directorio si no existe
New-Item -ItemType Directory -Force -Path "$PSScriptRoot\..\certificates" | Out-Null

# Crear certificado auto-firmado
Write-Host "Creando certificado auto-firmado para pruebas..." -ForegroundColor Cyan
$cert = New-SelfSignedCertificate `
    -Type CodeSigningCert `
    -Subject "CN=$certName" `
    -KeyUsage DigitalSignature `
    -FriendlyName "$certName" `
    -CertStoreLocation "Cert:\CurrentUser\My" `
    -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.3", "2.5.29.19={text}") `
    -NotAfter (Get-Date).AddYears(3)

# Exportar certificado como PFX (con clave privada)
Write-Host "Exportando certificado PFX..." -ForegroundColor Cyan
$securePassword = ConvertTo-SecureString -String $certPassword -Force -AsPlainText
Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $securePassword | Out-Null

# Exportar certificado público (CER)
Write-Host "Exportando certificado público..." -ForegroundColor Cyan
Export-Certificate -Cert $cert -FilePath $cerPath | Out-Null

# Mostrar información
Write-Host "`n✓ Certificado creado exitosamente!" -ForegroundColor Green
Write-Host "  Thumbprint: $($cert.Thumbprint)" -ForegroundColor Yellow
Write-Host "  PFX: $pfxPath" -ForegroundColor Yellow
Write-Host "  CER: $cerPath" -ForegroundColor Yellow
Write-Host "  Password: $certPassword" -ForegroundColor Yellow

Write-Host "`nPróximos pasos:" -ForegroundColor Cyan
Write-Host "1. Configura las variables de entorno en GitHub Secrets:"
Write-Host "   WINDOWS_CERTIFICATE_BASE64: (ejecuta el comando de abajo)"
Write-Host "   WINDOWS_CERTIFICATE_PASSWORD: $certPassword"
Write-Host "`n2. Para convertir el PFX a Base64, ejecuta:"
Write-Host "   [Convert]::ToBase64String([IO.File]::ReadAllBytes('$pfxPath'))" -ForegroundColor Green
Write-Host "`n3. Para instalar el certificado en tu máquina local (testing):"
Write-Host "   Import-PfxCertificate -FilePath '$pfxPath' -CertStoreLocation Cert:\CurrentUser\My -Password (ConvertTo-SecureString -String '$certPassword' -AsPlainText -Force)" -ForegroundColor Green
Write-Host "`n[WARNING]  IMPORTANTE: Este es un certificado de PRUEBA." -ForegroundColor Red
Write-Host "   Windows mostrará advertencias a usuarios finales." -ForegroundColor Red
Write-Host "   Para producción, compra un certificado de DigiCert, Sectigo, etc." -ForegroundColor Red
