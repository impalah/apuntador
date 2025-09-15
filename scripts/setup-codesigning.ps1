#!/usr/bin/env pwsh

# Script de configuración completa para certificados auto-firmados
# Uso: .\scripts\setup-codesigning.ps1

Write-Host "🔐 Configuración completa de certificados para Apuntador" -ForegroundColor Green
Write-Host ""

# Verificar si estamos en PowerShell 5.1+ 
if ($PSVersionTable.PSVersion.Major -lt 5) {
    Write-Host "❌ Se requiere PowerShell 5.1 o superior" -ForegroundColor Red
    exit 1
}

# Verificar si tenemos permisos de administrador para algunas operaciones
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠️  Ejecutando sin permisos de administrador" -ForegroundColor Yellow
    Write-Host "   Algunas funciones pueden requerir elevación" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "📋 PASOS DE CONFIGURACIÓN:" -ForegroundColor Blue
Write-Host "1. Generar certificado auto-firmado" -ForegroundColor White
Write-Host "2. Configurar GitHub Actions (opcional)" -ForegroundColor White
Write-Host "3. Probar compilación local" -ForegroundColor White
Write-Host ""

# Paso 1: Generar certificado
Write-Host "🔑 Paso 1: Generando certificado..." -ForegroundColor Cyan
$createScript = ".\scripts\create-self-signed-cert.ps1"

if (Test-Path $createScript) {
    & $createScript
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Certificado generado exitosamente" -ForegroundColor Green
    } else {
        Write-Host "❌ Error generando certificado" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ Script no encontrado: $createScript" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Paso 2: Instrucciones para GitHub
Write-Host "🐙 Paso 2: Configuración de GitHub Actions" -ForegroundColor Cyan
Write-Host ""

$base64File = "certificates\certificate-base64.txt"
if (Test-Path $base64File) {
    Write-Host "Para configurar GitHub Actions:" -ForegroundColor Yellow
    Write-Host "1. Ve a tu repositorio en GitHub" -ForegroundColor White
    Write-Host "2. Settings → Secrets and variables → Actions" -ForegroundColor White
    Write-Host "3. Agregar estos secrets:" -ForegroundColor White
    Write-Host ""
    Write-Host "   WINDOWS_CERTIFICATE:" -ForegroundColor Green
    Write-Host "   (copiar contenido de: $base64File)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   WINDOWS_CERTIFICATE_PASSWORD:" -ForegroundColor Green
    Write-Host "   apuntador2024!" -ForegroundColor Gray
    Write-Host ""
    
    # Mostrar preview del contenido Base64
    $base64Content = Get-Content $base64File -Raw
    $preview = $base64Content.Substring(0, [Math]::Min(50, $base64Content.Length))
    Write-Host "   Preview del certificado: $preview..." -ForegroundColor Gray
    Write-Host ""
    
    $response = Read-Host "¿Quieres abrir el archivo Base64 ahora? (y/n)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        Start-Process notepad.exe -ArgumentList $base64File
    }
} else {
    Write-Host "❌ Archivo Base64 no encontrado: $base64File" -ForegroundColor Red
}

Write-Host ""

# Paso 3: Probar compilación
Write-Host "🔧 Paso 3: Probar compilación local" -ForegroundColor Cyan
$response = Read-Host "¿Quieres probar la compilación con firma ahora? (y/n)"

if ($response -eq 'y' -or $response -eq 'Y') {
    Write-Host ""
    Write-Host "🚀 Iniciando compilación de prueba..." -ForegroundColor Yellow
    
    $buildScript = ".\scripts\build-windows-signed.ps1"
    if (Test-Path $buildScript) {
        & $buildScript -BuildType debug
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "🎉 ¡Compilación de prueba exitosa!" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "❌ Error en la compilación de prueba" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Script no encontrado: $buildScript" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "✅ CONFIGURACIÓN COMPLETADA" -ForegroundColor Green
Write-Host ""
Write-Host "📝 PRÓXIMOS PASOS:" -ForegroundColor Blue
Write-Host "1. Configurar secrets en GitHub (si no lo hiciste)" -ForegroundColor White
Write-Host "2. Hacer commit de los cambios en tauri.conf.json" -ForegroundColor White
Write-Host "3. Probar el workflow de GitHub Actions" -ForegroundColor White
Write-Host "4. Distribuir aplicaciones firmadas" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentación completa: .\docs\SELF-SIGNED-CERTIFICATE.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎯 ¡Listo para distribución con certificado auto-firmado!" -ForegroundColor Green