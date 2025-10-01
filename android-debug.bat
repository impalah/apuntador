@echo off
echo ===========================================
echo    ANDROID DEBUG SCRIPT - APUNTADOR
echo ===========================================
echo.

echo Checking Android SDK and emulator setup...
echo.

REM Check if adb is available
where adb >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] adb not found in PATH. Please install Android SDK platform-tools.
    pause
    exit /b 1
)

echo [OK] adb found

REM Check if emulator is available
where emulator >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] emulator not found in PATH. Please install Android SDK emulator.
    pause
    exit /b 1
)

echo [OK] emulator found

REM List available AVDs
echo.
echo Available Android Virtual Devices:
emulator -list-avds
echo.

REM Check for running devices
echo Checking for connected devices/emulators:
adb devices
echo.

REM Build and sync the project
echo Building and syncing Capacitor project...
cd /d "%~dp0"
call npm run build
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Build failed
    pause
    exit /b 1
)

call npx cap sync android
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Sync failed
    pause
    exit /b 1
)

echo.
echo ===========================================
echo Build and sync completed successfully!
echo ===========================================
echo.
echo Options:
echo 1. Open Android Studio (manual deployment)
echo 2. Deploy to connected device/emulator
echo 3. Start an emulator first
echo 4. Open debug panel in browser
echo 5. Exit
echo.

:menu
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" (
    echo Opening Android Studio...
    npx cap open android
    goto end
)

if "%choice%"=="2" (
    echo Deploying to connected device/emulator...
    npx cap run android
    goto end
)

if "%choice%"=="3" (
    echo.
    echo To start an emulator, use:
    echo emulator -avd [AVD_NAME]
    echo.
    echo Available AVDs:
    emulator -list-avds
    echo.
    echo After starting the emulator, re-run this script and choose option 2.
    pause
    goto end
)

if "%choice%"=="4" (
    echo Opening debug panel in browser...
    start http://localhost:3000/android-debug.html
    echo.
    echo Starting development server...
    npm run dev
    goto end
)

if "%choice%"=="5" (
    goto end
)

echo Invalid choice. Please try again.
goto menu

:end
echo.
echo Script finished.
pause