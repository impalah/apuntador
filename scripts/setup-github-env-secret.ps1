# Script para configurar el secret ENV_FILE en GitHub (Windows PowerShell)
# Uso: .\scripts\setup-github-env-secret.ps1

Write-Host "🔧 Setup GitHub ENV_FILE Secret" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que existe .env
if (-not (Test-Path ".env")) {
    Write-Host "❌ Error: No se encontró el archivo .env" -ForegroundColor Red
    Write-Host ""
    Write-Host "📋 Pasos para crear el .env:" -ForegroundColor Yellow
    Write-Host "   1. Copy-Item .env.example .env"
    Write-Host "   2. Edita .env con tus credenciales reales"
    Write-Host "   3. Ejecuta este script nuevamente"
    Write-Host ""
    exit 1
}

# Verificar que existe GitHub CLI
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: GitHub CLI (gh) no está instalado" -ForegroundColor Red
    Write-Host ""
    Write-Host "📥 Instalar GitHub CLI:" -ForegroundColor Yellow
    Write-Host "   Windows: scoop install gh"
    Write-Host "   O descarga desde: https://cli.github.com"
    Write-Host ""
    exit 1
}

# Verificar autenticación
$authStatus = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "🔐 No estás autenticado en GitHub CLI" -ForegroundColor Yellow
    Write-Host "Ejecutando: gh auth login" -ForegroundColor Yellow
    Write-Host ""
    gh auth login
}

Write-Host "📋 Variables encontradas en .env:" -ForegroundColor Cyan
Get-Content .env | Where-Object { $_ -match '^[^#]' } | ForEach-Object { 
    $varName = ($_ -split '=')[0]
    Write-Host "   ✓ $varName" -ForegroundColor Green
}
Write-Host ""

# Confirmación
$confirmation = Read-Host "¿Crear/actualizar el secret ENV_FILE con este contenido? (s/n)"
if ($confirmation -notmatch '^[SsYy]$') {
    Write-Host "❌ Operación cancelada" -ForegroundColor Red
    exit 1
}

# Crear el secret
Write-Host ""
Write-Host "📤 Creando secret ENV_FILE..." -ForegroundColor Yellow

$envContent = Get-Content .env -Raw
$envContent | gh secret set ENV_FILE

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Secret ENV_FILE creado/actualizado correctamente" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Verificación:" -ForegroundColor Cyan
    gh secret list | Select-String "ENV_FILE"
    Write-Host ""
    Write-Host "🎉 ¡Listo! Ahora los workflows de GitHub Actions podrán usar las variables de entorno." -ForegroundColor Green
    Write-Host ""
    Write-Host "🔍 Para verificar:" -ForegroundColor Cyan
    Write-Host "   1. Haz un commit y push"
    Write-Host "   2. Ve a la pestaña Actions en GitHub"
    Write-Host "   3. Observa el step 'Create .env file' en los logs"
} else {
    Write-Host "❌ Error al crear el secret" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔍 Posibles causas:" -ForegroundColor Yellow
    Write-Host "   - No tienes permisos de escritura en el repositorio"
    Write-Host "   - El repositorio es un fork"
    Write-Host "   - Problema de conectividad"
    Write-Host ""
    Write-Host "💡 Alternativa: Configura el secret manualmente en:" -ForegroundColor Yellow
    $repoInfo = gh repo view --json nameWithOwner | ConvertFrom-Json
    Write-Host "   https://github.com/$($repoInfo.nameWithOwner)/settings/secrets/actions"
    exit 1
}
