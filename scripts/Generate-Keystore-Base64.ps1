# Script to generate Base64 of keystore for GitHub Secrets
# Generate-Keystore-Base64.ps1

Write-Host "🔐 Android Keystore Base64 Generator" -ForegroundColor Cyan
Write-Host "=" * 50

# Verify that keystore exists
$keystorePath = "android\app\apuntador-release-key.keystore"

if (-not (Test-Path $keystorePath)) {
    Write-Host "❌ ERROR: Keystore file not found at: $keystorePath" -ForegroundColor Red
    Write-Host "   Make sure the keystore is in the correct location." -ForegroundColor Yellow
    Write-Host "   If you don't have a keystore, run first: build-signed-apk.bat" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Keystore found: $keystorePath" -ForegroundColor Green

# Generate Base64
try {
    Write-Host "🔄 Generating Base64..." -ForegroundColor Yellow
    
    $base64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($keystorePath))
    
    # Save to file
    $outputFile = "keystore-base64.txt"
    $base64 | Out-File -Encoding ascii $outputFile
    
    Write-Host "✅ Base64 generated successfully!" -ForegroundColor Green
    Write-Host "📁 File saved to: $outputFile" -ForegroundColor Cyan
    
    # Show information
    Write-Host "`n📋 INFORMATION FOR GITHUB SECRETS:" -ForegroundColor Magenta
    Write-Host "=" * 40
    Write-Host "ANDROID_KEYSTORE_BASE64:" -ForegroundColor White
    Write-Host "  -> Copy the complete content of $outputFile" -ForegroundColor Gray
    Write-Host "`nANDROID_KEYSTORE_PASSWORD:" -ForegroundColor White
    Write-Host "  -> apuntador123" -ForegroundColor Gray
    Write-Host "`nANDROID_KEY_ALIAS:" -ForegroundColor White
    Write-Host "  -> apuntador" -ForegroundColor Gray
    Write-Host "`nANDROID_KEY_PASSWORD:" -ForegroundColor White
    Write-Host "  -> apuntador123" -ForegroundColor Gray
    
    Write-Host "`n🌐 GITHUB CONFIGURATION:" -ForegroundColor Magenta
    Write-Host "1. Go to your repository on GitHub" -ForegroundColor White
    Write-Host "2. Settings -> Secrets and variables -> Actions" -ForegroundColor White
    Write-Host "3. New repository secret" -ForegroundColor White
    Write-Host "4. Add the 4 secrets shown above" -ForegroundColor White
    
    Write-Host "`n⚠️  IMPORTANT:" -ForegroundColor Yellow
    Write-Host "   - Do not share these values publicly" -ForegroundColor Red
    Write-Host "   - Delete $outputFile after configuring GitHub" -ForegroundColor Red
    Write-Host "   - Secrets are case-sensitive" -ForegroundColor Yellow
    
    Write-Host "`n🚀 Once the secrets are configured, the workflow" -ForegroundColor Green
    Write-Host "   build-android-apk.yml will work automatically!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ ERROR generating Base64: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n✨ Process completed!" -ForegroundColor Cyan
