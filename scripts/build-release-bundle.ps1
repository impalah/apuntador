# Script to build optimized release bundle for Google Play Store
# This script enables R8 optimization and generates mapping files for crash analysis

param(
    [switch]$Clean = $false
)

$ErrorActionPreference = "Stop"

Write-Host "Building optimized release bundle for Google Play Store..." -ForegroundColor Green

# Set working directory to project root
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

try {
    # Clean if requested
    if ($Clean) {
        Write-Host "Cleaning previous builds..." -ForegroundColor Yellow
        if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }
        if (Test-Path "android/app/build") { Remove-Item -Recurse -Force "android/app/build" }
    }

    # Build web assets
    Write-Host "Building optimized web assets..." -ForegroundColor Blue
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Web build failed" }

    # Sync with Capacitor
    Write-Host "Syncing with Capacitor..." -ForegroundColor Blue
    npx cap sync android
    if ($LASTEXITCODE -ne 0) { throw "Capacitor sync failed" }

    # Build release bundle
    Write-Host "Building release bundle with R8 optimization..." -ForegroundColor Blue
    Set-Location "android"
    
    # Use gradlew to build release bundle
    ./gradlew bundleRelease
    
    if ($LASTEXITCODE -ne 0) { throw "Android bundle build failed" }

    # Find the generated files
    $bundleFile = Get-ChildItem -Path "app/build/outputs/bundle/release" -Filter "*.aab" | Select-Object -First 1
    $mappingFile = Get-ChildItem -Path "app/build/outputs/mapping/release" -Filter "mapping.txt" | Select-Object -First 1

    if ($bundleFile) {
        Write-Host "Bundle created successfully:" -ForegroundColor Green
        Write-Host "   Bundle: $($bundleFile.FullName)" -ForegroundColor Cyan
        Write-Host "   Size: $([math]::Round($bundleFile.Length / 1MB, 2)) MB" -ForegroundColor Cyan
    } else {
        throw "Bundle file not found!"
    }

    if ($mappingFile) {
        Write-Host "Mapping file created successfully:" -ForegroundColor Green
        Write-Host "   Mapping: $($mappingFile.FullName)" -ForegroundColor Cyan
        Write-Host "   Size: $([math]::Round($mappingFile.Length / 1KB, 2)) KB" -ForegroundColor Cyan
    } else {
        Write-Host "Mapping file not found - this is expected if minification is disabled" -ForegroundColor Yellow
    }

    # Copy to project root for easy access
    $outputDir = "$projectRoot/android-release"
    if (!(Test-Path $outputDir)) { New-Item -ItemType Directory -Path $outputDir }

    if ($bundleFile) {
        Copy-Item $bundleFile.FullName "$outputDir/apuntador-release.aab" -Force
        Write-Host "Bundle copied to: android-release/apuntador-release.aab" -ForegroundColor Green
    }

    if ($mappingFile) {
        Copy-Item $mappingFile.FullName "$outputDir/mapping.txt" -Force
        Write-Host "Mapping file copied to: android-release/mapping.txt" -ForegroundColor Green
    }

    Write-Host ""
    Write-Host "Release bundle build completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "   1. Upload apuntador-release.aab to Google Play Console" -ForegroundColor White
    Write-Host "   2. Upload mapping.txt as the deobfuscation file" -ForegroundColor White
    Write-Host "   3. The mapping.txt file helps Google Play analyze crashes" -ForegroundColor White

} catch {
    Write-Host "Build failed: $_" -ForegroundColor Red
    exit 1
} finally {
    Set-Location $projectRoot
}