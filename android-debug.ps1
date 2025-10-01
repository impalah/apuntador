# Android Debug Script for Apuntador
# PowerShell version

Write-Host "==========================================="
Write-Host "   ANDROID DEBUG SCRIPT - APUNTADOR"
Write-Host "==========================================="
Write-Host ""

function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

function Write-Status($message, $type = "INFO") {
    switch ($type) {
        "OK" { Write-Host "[OK] $message" -ForegroundColor Green }
        "ERROR" { Write-Host "[ERROR] $message" -ForegroundColor Red }
        "WARN" { Write-Host "[WARN] $message" -ForegroundColor Yellow }
        default { Write-Host "[INFO] $message" -ForegroundColor Cyan }
    }
}

# Check prerequisites
Write-Status "Checking Android SDK and emulator setup..."
Write-Host ""

if (-not (Test-Command "adb")) {
    Write-Status "adb not found in PATH. Please install Android SDK platform-tools." "ERROR"
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Status "adb found" "OK"

if (-not (Test-Command "emulator")) {
    Write-Status "emulator not found in PATH. Please install Android SDK emulator." "ERROR"
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Status "emulator found" "OK"

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

# Check for running devices
Write-Status "Checking for connected devices/emulators:"
try {
    $devices = & adb devices
    Write-Host $devices -ForegroundColor Gray
} catch {
    Write-Status "Could not check devices: $_" "ERROR"
}

Write-Host ""

# Build and sync
Write-Status "Building and syncing Capacitor project..."
try {
    Write-Status "Running npm run build..."
    & npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Status "Build failed with exit code $LASTEXITCODE" "ERROR"
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Status "Build completed" "OK"

    Write-Status "Running npx cap sync android..."
    & npx cap sync android
    if ($LASTEXITCODE -ne 0) {
        Write-Status "Sync failed with exit code $LASTEXITCODE" "ERROR"
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Status "Sync completed" "OK"
} catch {
    Write-Status "Build/sync failed: $_" "ERROR"
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "==========================================="
Write-Host "Build and sync completed successfully!"
Write-Host "==========================================="
Write-Host ""

# Menu
do {
    Write-Host "Options:"
    Write-Host "1. Open Android Studio (manual deployment)"
    Write-Host "2. Deploy to connected device/emulator"
    Write-Host "3. Start an emulator"
    Write-Host "4. Open debug panel in browser"
    Write-Host "5. Check logcat (Android logs)"
    Write-Host "6. Exit"
    Write-Host ""
    
    $choice = Read-Host "Enter your choice (1-6)"
    
    switch ($choice) {
        "1" {
            Write-Status "Opening Android Studio..."
            & npx cap open android
            break
        }
        "2" {
            Write-Status "Deploying to connected device/emulator..."
            Write-Status "This will install and launch the app on the connected device"
            & npx cap run android
            break
        }
        "3" {
            Write-Host ""
            Write-Status "Available AVDs:"
            & emulator -list-avds
            Write-Host ""
            $avdName = Read-Host "Enter AVD name to start (or press Enter to skip)"
            if ($avdName) {
                Write-Status "Starting emulator: $avdName"
                Start-Process -FilePath "emulator" -ArgumentList "-avd", $avdName
                Write-Status "Emulator starting... Wait for it to boot, then choose option 2"
            }
        }
        "4" {
            Write-Status "Opening debug panel in browser..."
            Start-Process "http://localhost:3000/android-debug.html"
            Write-Host ""
            Write-Status "Starting development server..."
            & npm run dev
            break
        }
        "5" {
            Write-Status "Starting logcat to monitor Android logs..."
            Write-Status "Look for '[ANDROID DEBUG]' messages"
            Write-Status "Press Ctrl+C to stop logcat"
            Write-Host ""
            & adb logcat -s "Capacitor", "Chromium", "chromium", "Console"
        }
        "6" {
            break
        }
        default {
            Write-Status "Invalid choice. Please try again." "WARN"
        }
    }
} while ($choice -ne "6")

Write-Host ""
Write-Status "Script finished."
Read-Host "Press Enter to exit"