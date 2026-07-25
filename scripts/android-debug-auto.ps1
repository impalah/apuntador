# Android Debug Script for Apuntador - Auto-configure SDK
# PowerShell version with automatic SDK detection

Write-Host "==========================================="
Write-Host "   ANDROID DEBUG SCRIPT - APUNTADOR"
Write-Host "==========================================="
Write-Host ""

# Auto-configure Android SDK PATH
$androidSdkPaths = @(
    "$env:USERPROFILE\AppData\Local\Android\Sdk",
    "C:\Android\Sdk",
    "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"
)

$sdkFound = $false
foreach ($sdkPath in $androidSdkPaths) {
    if (Test-Path "$sdkPath\platform-tools\adb.exe") {
        Write-Host "Android SDK found at: $sdkPath" -ForegroundColor Green
        $env:PATH += ";$sdkPath\platform-tools;$sdkPath\emulator"
        $env:ANDROID_HOME = $sdkPath
        $sdkFound = $true
        break
    }
}

if (-not $sdkFound) {
    Write-Host "[ERROR] Android SDK not found. Please install Android Studio." -ForegroundColor Red
    Write-Host "Download from: https://developer.android.com/studio"
    Read-Host "Press Enter to exit"
    exit 1
}

function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

function Write-Status($message, $type = "INFO") {
    switch ($type) {
        "OK" { Write-Host "$message" -ForegroundColor Green }
        "ERROR" { Write-Host "[ERROR] $message" -ForegroundColor Red }
        "WARN" { Write-Host "[WARN] $message" -ForegroundColor Yellow }
        default { Write-Host "$message" -ForegroundColor Cyan }
    }
}

# Verify tools are now available
if (-not (Test-Command "adb")) {
    Write-Status "adb still not found after SDK configuration" "ERROR"
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Status "adb is available" "OK"

if (-not (Test-Command "emulator")) {
    Write-Status "emulator still not found after SDK configuration" "ERROR"
    Read-Host "Press Enter to exit" 
    exit 1
}
Write-Status "emulator is available" "OK"

# Check for running devices first
Write-Host ""
Write-Status "Checking for connected devices/emulators:"
try {
    $devices = & adb devices
    Write-Host $devices -ForegroundColor Gray
    
    # Check if any device is connected
    $deviceLines = $devices -split "`n" | Where-Object { $_ -match "\t(device|emulator)" }
    $connectedDevices = $deviceLines.Count
    
    if ($connectedDevices -gt 0) {
        Write-Status "$connectedDevices device(s) connected and ready" "OK"
    } else {
        Write-Status "No devices connected. You'll need to start an emulator or connect a physical device." "WARN"
    }
} catch {
    Write-Status "Could not check devices: $_" "ERROR"
}

# List available AVDs
Write-Host ""
Write-Status "Available Android Virtual Devices:"
try {
    $avds = & emulator -list-avds
    if ($avds) {
        foreach ($avd in $avds) {
            Write-Host "  - $avd" -ForegroundColor Yellow
        }
    } else {
        Write-Status "No AVDs found. Please create one in Android Studio." "WARN"
    }
} catch {
    Write-Status "Could not list AVDs: $_" "ERROR"
}

Write-Host ""

# Build and sync
Write-Status "Building and syncing Capacitor project..."
try {
    Write-Status "Running npm run build..."
    & npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Status "Build failed with exit code $LASTEXITCODE" "ERROR"
        Read-Host "Press Enter to continue anyway? (y/N)"
        if ($response -ne "y") { exit 1 }
    } else {
        Write-Status "Build completed successfully" "OK"
    }

    Write-Status "Running npx cap sync android..."
    & npx cap sync android
    if ($LASTEXITCODE -ne 0) {
        Write-Status "Sync failed with exit code $LASTEXITCODE" "ERROR"
        Read-Host "Press Enter to continue anyway? (y/N)"
        if ($response -ne "y") { exit 1 }
    } else {
        Write-Status "Sync completed successfully" "OK"
    }
} catch {
    Write-Status "Build/sync failed: $_" "ERROR"
    $response = Read-Host "Continue anyway? (y/N)"
    if ($response -ne "y") { exit 1 }
}

Write-Host ""
Write-Host "==========================================="
Write-Host "Setup completed!"
Write-Host "==========================================="
Write-Host ""

# Enhanced menu with quick options
do {
    Write-Host "Quick Actions:"
    Write-Host "1. Deploy to device/emulator (recommended if device connected)"
    Write-Host "2. Start Samsung Galaxy S22 emulator and deploy"
    Write-Host "3. [COMPUTER]  Open Android Studio for manual control"
    Write-Host "4. Open debug panel in browser"
    Write-Host "5. Monitor Android logs (logcat)"
    Write-Host "6. Advanced options..."
    Write-Host "7. [ERROR] Exit"
    Write-Host ""
    
    $choice = Read-Host "Enter your choice (1-7)"
    
    switch ($choice) {
        "1" {
            Write-Status "Deploying to connected device/emulator..."
            Write-Status "This will install and launch the app with debug logs enabled"
            & npx cap run android
            
            Write-Host ""
            Write-Status "App deployed! To see debug logs, choose option 5 or check browser console" "OK"
            Write-Status "Look for '[ANDROID DEBUG]' messages in the logs" "INFO"
            break
        }
        "2" {
            Write-Status "Starting Samsung Galaxy S22 emulator..."
            $emulatorPath = "$env:ANDROID_HOME\emulator\emulator.exe"
            Start-Process -FilePath $emulatorPath -ArgumentList "-avd", "Samsung_Galaxy_S22"
            
            Write-Status "Waiting for emulator to boot..." "INFO"
            Write-Host "This may take 1-2 minutes. Emulator will appear in a new window."
            
            # Wait for device to be ready
            $timeout = 120 # 2 minutes
            $elapsed = 0
            do {
                Start-Sleep -Seconds 5
                $elapsed += 5
                $devices = & adb devices
                $ready = $devices -match "emulator.*device"
                Write-Host "." -NoNewline
            } while (-not $ready -and $elapsed -lt $timeout)
            
            Write-Host ""
            if ($ready) {
                Write-Status "Emulator is ready! Deploying app..." "OK"
                & npx cap run android
                Write-Status "App deployed to emulator!" "OK"
            } else {
                Write-Status "Emulator is taking longer than expected. Try option 1 in a few minutes." "WARN"
            }
            break
        }
        "3" {
            Write-Status "Opening Android Studio..."
            & npx cap open android
            Write-Status "Use Android Studio to manually deploy and debug" "INFO"
            break
        }
        "4" {
            Write-Status "Opening debug panel in browser..."
            Start-Process "http://localhost:3000/android-debug.html"
            Write-Host ""
            Write-Status "Starting development server for web testing..."
            & npm run dev
            break
        }
        "5" {
            Write-Status "Starting logcat to monitor Android logs..." "INFO"
            Write-Status "Looking for '[ANDROID DEBUG]' messages and JavaScript console logs" "INFO"
            Write-Status "Press Ctrl+C to stop monitoring" "WARN"
            Write-Host ""
            
            # Filter for relevant logs
            & adb logcat -s "Capacitor:*" "chromium:*" "Console:*" "WebView:*" | ForEach-Object {
                if ($_ -match "ANDROID DEBUG") {
                    Write-Host $_ -ForegroundColor Green
                } elseif ($_ -match "ERROR") {
                    Write-Host $_ -ForegroundColor Red
                } elseif ($_ -match "WARN") {
                    Write-Host $_ -ForegroundColor Yellow
                } else {
                    Write-Host $_ -ForegroundColor Gray
                }
            }
        }
        "6" {
            Write-Host ""
            Write-Host "Advanced Options:"
            Write-Host "a. List all devices"
            Write-Host "b. Start specific emulator"
            Write-Host "c. Install APK manually"
            Write-Host "d. Clear app data"
            Write-Host "e. Back to main menu"
            
            $advanced = Read-Host "Choose advanced option (a-e)"
            switch ($advanced) {
                "a" { 
                    & adb devices -l
                }
                "b" {
                    Write-Host "Available AVDs:"
                    & emulator -list-avds
                    $avdName = Read-Host "Enter AVD name"
                    if ($avdName) {
                        Start-Process -FilePath "$env:ANDROID_HOME\emulator\emulator.exe" -ArgumentList "-avd", $avdName
                    }
                }
                "c" {
                    Write-Status "Building APK..."
                    & ./scripts/build-android-apk.ps1
                }
                "d" {
                    & adb shell pm clear com.apuntador.app
                    Write-Status "App data cleared" "OK"
                }
            }
        }
        "7" {
            break
        }
        default {
            Write-Status "Invalid choice. Please try again." "WARN"
        }
    }
} while ($choice -ne "7")

Write-Host ""
Write-Status "Debug session completed. Check logs for [ANDROID DEBUG] messages." "INFO"
Read-Host "Press Enter to exit"