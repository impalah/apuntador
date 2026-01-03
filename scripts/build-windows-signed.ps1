#!/usr/bin/env pwsh

# Script para compilar Tauri con certificado auto-firmado localmente
# Uso: .\scripts\build-windows-signed.ps1

param(
    [string]$BuildType = "release",
    [string]$CertificatePath = "certificates\apuntador-codesigning.pfx",
    [string]$CertificatePassword = "apuntador2024!"
)

Write-Host "[CONFIG] Compilando Apuntador para Windows con firma de código..." -ForegroundColor Green
Write-Host ""

# Verificar que existe el certificado
if (!(Test-Path $CertificatePath)) {
    Write-Host "[ERROR] Certificado no encontrado: $CertificatePath" -ForegroundColor Red
    Write-Host "Ejecuta primero: .\scripts\create-self-signed-cert.ps1" -ForegroundColor Yellow
    exit 1
}

try {
    # Importar el certificado temporalmente
    Write-Host "[SECURE] Importando certificado para firma..." -ForegroundColor Yellow
    $securePassword = ConvertTo-SecureString -String $CertificatePassword -Force -AsPlainText
    $cert = Import-PfxCertificate -FilePath $CertificatePath -CertStoreLocation "Cert:\CurrentUser\My" -Password $securePassword -ErrorAction Stop
    
    if ($cert) {
        Write-Host "[OK] Certificado importado: $($cert.Thumbprint)" -ForegroundColor Green
        
        # Configurar variables de entorno para Tauri
        $env:WINDOWS_CODESIGN_CERT_THUMBPRINT = $cert.Thumbprint
        
        # Compilar el frontend
        Write-Host "[WEB] Compilando frontend..." -ForegroundColor Yellow
        npm run build
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[ERROR] Error compilando frontend" -ForegroundColor Red
            exit 1
        }
        
        # Compilar Tauri
        Write-Host "🦀 Compilando aplicación Tauri..." -ForegroundColor Yellow
        
        if ($BuildType -eq "debug") {
            npm run tauri:build -- --debug
        } else {
            npm run tauri:build:win
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "[SUCCESS] ¡Compilación exitosa!" -ForegroundColor Green
            Write-Host ""
            
            # Mostrar archivos generados
            $bundlePath = "src-tauri\target\x86_64-pc-windows-msvc\$BuildType\bundle"
            if (Test-Path $bundlePath) {
                Write-Host "[PACKAGE] Archivos generados:" -ForegroundColor Cyan
                Get-ChildItem $bundlePath -Recurse -File | Where-Object { $_.Extension -in @('.msi', '.exe') } | ForEach-Object {
                    $sizeMB = [math]::Round($_.Length / 1MB, 2)
                    Write-Host "  [OK] $($_.Name) ($sizeMB MB)" -ForegroundColor White
                    Write-Host "     📁 $($_.FullName)" -ForegroundColor Gray
                }
            }
            
            Write-Host ""
            Write-Host "[SECURE] Aplicación firmada con certificado auto-firmado" -ForegroundColor Green
            Write-Host "[WARNING]  Los usuarios verán un aviso de seguridad pero será menos severo" -ForegroundColor Yellow
            
        } else {
            Write-Host "[ERROR] Error en la compilación de Tauri" -ForegroundColor Red
            exit 1
        }
        
    } else {
        Write-Host "[ERROR] Error al importar certificado" -ForegroundColor Red
        exit 1
    }
    
} catch {
    Write-Host "[ERROR] Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    # Limpiar variables de entorno
    $env:WINDOWS_CODESIGN_CERT_THUMBPRINT = $null
}

Write-Host ""
Write-Host "[LAUNCH] Proceso completado" -ForegroundColor Green