@echo off
rem Configurar entorno MSVC y ejecutar Tauri

echo Configurando entorno MSVC...
call "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat"

echo Probando link.exe...
link.exe >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: link.exe no encontrado
    pause
    exit /b 1
)

echo link.exe encontrado correctamente!
echo Ejecutando Tauri...
npm run tauri:dev