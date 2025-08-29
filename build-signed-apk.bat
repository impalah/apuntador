@echo off
echo ====================================
echo   Building Signed Android APK
echo ====================================
echo.

echo Step 1: Building web application...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to build web application
    pause
    exit /b 1
)

echo.
echo Step 2: Copying to Android project...
call npx cap copy android
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to copy to Android
    pause
    exit /b 1
)

echo.
echo Step 3: Syncing Android project...
call npx cap sync android
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to sync Android project
    pause
    exit /b 1
)

echo.
echo Step 4: Building signed APK...
cd android
call gradlew assembleRelease
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to build APK
    cd ..
    pause
    exit /b 1
)

cd ..
echo.
echo ====================================
echo   BUILD SUCCESSFUL!
echo ====================================
echo.
echo Your signed APK is ready at:
echo android\app\build\outputs\apk\release\app-release.apk
echo.
echo File size:
dir android\app\build\outputs\apk\release\app-release.apk
echo.
echo To install on device:
echo 1. Enable USB Debugging on your Android device
echo 2. Connect via USB
echo 3. Run: adb install android\app\build\outputs\apk\release\app-release.apk
echo.
echo Or transfer the APK file to your device and install manually
echo.
pause
