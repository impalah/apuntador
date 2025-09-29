@echo off
echo Building Android APK using Android Studio...
echo.
echo Step 1: Make sure Android Studio is open with the project
echo Step 2: In Android Studio menu: Build → Build Bundle(s) / APK(s) → Build APK(s)
echo Step 3: Wait for build to complete
echo Step 4: APK will be generated at:
echo         android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo To install on device:
echo 1. Enable "Developer Options" and "USB Debugging" on your Android device
echo 2. Connect device via USB
echo 3. Transfer the APK file to your device
echo 4. Install the APK (you may need to allow "Install from unknown sources")
echo.
echo Alternative: Use adb install command if you have ADB configured
echo adb install android\app\build\outputs\apk\debug\app-debug.apk
pause
