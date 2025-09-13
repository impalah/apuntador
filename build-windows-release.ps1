# Build script para Apuntador Windows Release
# Autor: GitHub Copilot & impalah
# Descripcion: Construye el ejecutable final de Apuntador para Windows

Write-Host "Iniciando build de Apuntador Windows Release..." -ForegroundColor Green
Write-Host ""

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "package.json")) {
    Write-Host "Error: Este script debe ejecutarse desde el directorio raiz del proyecto" -ForegroundColor Red
    exit 1
}

# Limpiar builds anteriores
Write-Host "Limpiando builds anteriores..." -ForegroundColor Yellow
if (Test-Path "src-tauri\target") {
    Remove-Item "src-tauri\target" -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path "dist") {
    Remove-Item "dist" -Recurse -Force -ErrorAction SilentlyContinue
}

# Configurar entorno MSVC
Write-Host "Configurando entorno de desarrollo..." -ForegroundColor Yellow
try {
    $vsPath = "${env:ProgramFiles}\Microsoft Visual Studio\2022\Community"
    if (Test-Path "$vsPath\Common7\Tools\Microsoft.VisualStudio.DevShell.dll") {
        Import-Module "$vsPath\Common7\Tools\Microsoft.VisualStudio.DevShell.dll"
        Enter-VsDevShell -VsInstallPath $vsPath -SkipAutomaticLocation
        Write-Host "Entorno MSVC configurado correctamente" -ForegroundColor Green
    } else {
        Write-Host "Visual Studio 2022 no encontrado en la ubicacion esperada" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Error configurando entorno MSVC: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Verificar herramientas
Write-Host "Verificando herramientas necesarias..." -ForegroundColor Yellow

# Verificar link.exe primero (despues de configurar MSVC)
try {
    $linkOutput = link.exe 2>&1
    if ($LASTEXITCODE -eq 1104 -or $LASTEXITCODE -eq 1) {
        Write-Host "  link.exe: Disponible" -ForegroundColor Green
    } else {
        throw "link.exe not available"
    }
} catch {
    Write-Host "  link.exe: NO ENCONTRADO" -ForegroundColor Red
    Write-Host "    Intentando configurar manualmente..." -ForegroundColor Yellow
    
    # Intentar agregar path manualmente
    $msvcPath = "$vsPath\VC\Tools\MSVC"
    if (Test-Path $msvcPath) {
        $latestMSVC = Get-ChildItem $msvcPath | Sort-Object Name -Descending | Select-Object -First 1
        $linkPath = "$($latestMSVC.FullName)\bin\Hostx64\x64"
        if (Test-Path "$linkPath\link.exe") {
            $env:PATH = "$linkPath;$env:PATH"
            Write-Host "    Path MSVC agregado: $linkPath" -ForegroundColor Green
        }
    }
    
    # Verificar de nuevo
    try {
        link.exe 2>&1 | Out-Null
        Write-Host "  link.exe: Disponible despues de configuracion manual" -ForegroundColor Green
    } catch {
        Write-Host "  link.exe: FALLO DEFINITIVO" -ForegroundColor Red
        exit 1
    }
}

$tools = @(
    @{name="node"; param="--version"},
    @{name="npm"; param="--version"},
    @{name="rustc"; param="--version"},
    @{name="cargo"; param="--version"}
)

foreach ($tool in $tools) {
    try {
        $version = & $tool.name $tool.param 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  $($tool.name): $($version.Split([Environment]::NewLine)[0])" -ForegroundColor Green
        } else {
            throw "Command failed"
        }
    } catch {
        Write-Host "  $($tool.name): NO ENCONTRADO" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# Instalar dependencias si es necesario
if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependencias de Node.js..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error instalando dependencias" -ForegroundColor Red
        exit 1
    }
}

# Build frontend
Write-Host "Construyendo frontend..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error en build frontend" -ForegroundColor Red
    exit 1
}

# Build Tauri
Write-Host "Construyendo aplicacion Tauri (esto puede tomar varios minutos)..." -ForegroundColor Yellow
npm run tauri:build:win
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error en build Tauri" -ForegroundColor Red
    exit 1
}

# Mostrar resultados
Write-Host ""
Write-Host "Build completado exitosamente!" -ForegroundColor Green
Write-Host ""

# Buscar archivos generados
$bundlePath = "src-tauri\target\x86_64-pc-windows-msvc\release\bundle"
$exePath = "src-tauri\target\x86_64-pc-windows-msvc\release\apuntador.exe"

if (Test-Path $bundlePath) {
    Write-Host "Archivos de distribucion:" -ForegroundColor Yellow
    Get-ChildItem $bundlePath -Recurse -File | Where-Object { $_.Extension -in @('.exe', '.msi') } | ForEach-Object {
        $sizeMB = [math]::Round($_.Length / 1MB, 2)
        Write-Host "  $($_.Name) ($sizeMB MB)" -ForegroundColor Green
        Write-Host "    Ubicacion: $($_.FullName)" -ForegroundColor Gray
    }
} else {
    Write-Host "Advertencia: No se encontraron archivos de distribucion en $bundlePath" -ForegroundColor Yellow
}

if (Test-Path $exePath) {
    $sizeBytes = (Get-Item $exePath).Length
    $sizeMB = [math]::Round($sizeBytes / 1MB, 2)
    Write-Host ""
    Write-Host "Ejecutable principal:" -ForegroundColor Yellow
    Write-Host "  apuntador.exe ($sizeMB MB)" -ForegroundColor Green
    Write-Host "  Ubicacion: $((Get-Item $exePath).FullName)" -ForegroundColor Gray
    
    # Copiar ejecutable al directorio raiz para facilidad
    Copy-Item $exePath ".\apuntador.exe" -Force
    Write-Host "  Copiado a: .\apuntador.exe" -ForegroundColor Green
} else {
    Write-Host "Advertencia: No se encontro el ejecutable principal en $exePath" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Apuntador esta listo para distribucion!" -ForegroundColor Green