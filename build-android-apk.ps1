#!/usr/bin/env pwsh

# Build Android APK with custom name
# Usage: .\build-android-apk.ps1

Write-Host "Building Apuntador Android APK..." -ForegroundColor Green

# Build the web app and sync with Android
Write-Host "Building web app and syncing with Android..." -ForegroundColor Yellow
npm run android:build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

# Navigate to Android directory and build APK
Write-Host "Building Android APK..." -ForegroundColor Yellow
Set-Location android

# Build release APK
./gradlew assembleRelease

if ($LASTEXITCODE -ne 0) {
    Write-Host "APK build failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# Go back to root directory
Set-Location ..

# Check if APK was generated
$apkPath = "android/app/build/outputs/apk/release/apuntador.apk"
if (Test-Path $apkPath) {
    Write-Host "APK generated successfully: $apkPath" -ForegroundColor Green
    
    # Copy to root directory for easy access
    Copy-Item $apkPath "apuntador.apk" -Force
    Write-Host "APK copied to root directory as 'apuntador.apk'" -ForegroundColor Green
    
    # Show file size
    $fileSize = (Get-Item "apuntador.apk").Length / 1MB
    Write-Host "APK size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Cyan
} else {
    Write-Host "APK not found at expected location!" -ForegroundColor Red
    Write-Host "Looking for APK files..." -ForegroundColor Yellow
    Get-ChildItem -Path "android/app/build/outputs/apk" -Recurse -Filter "*.apk" | ForEach-Object {
        Write-Host "Found: $($_.FullName)" -ForegroundColor White
    }
    exit 1
}

Write-Host "Android APK build completed successfully!" -ForegroundColor Green
Write-Host "APK location: apuntador.apk" -ForegroundColor Cyan
