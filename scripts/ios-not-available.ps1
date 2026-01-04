# iOS Development Warning for Windows
# This script informs Windows users that iOS development requires macOS

Write-Host "iOS Development Requirements" -ForegroundColor Blue
Write-Host "================================" -ForegroundColor Blue
Write-Host ""
Write-Host "[ERROR] iOS development is only available on macOS" -ForegroundColor Red
Write-Host ""
Write-Host "Requirements for iOS development:" -ForegroundColor Yellow
Write-Host "  • macOS operating system" -ForegroundColor White
Write-Host "  • Xcode (from Mac App Store)" -ForegroundColor White
Write-Host "  • CocoaPods" -ForegroundColor White
Write-Host "  • iOS Simulator or physical device" -ForegroundColor White
Write-Host ""
Write-Host "Alternative options for Windows:" -ForegroundColor Green
Write-Host "  • Use Android development (supported on Windows)" -ForegroundColor White
Write-Host "  • Use Tauri for desktop applications" -ForegroundColor White
Write-Host "  • Run web version for cross-platform compatibility" -ForegroundColor White
Write-Host ""
Write-Host "Available commands:" -ForegroundColor Cyan
Write-Host "  npm run android:dev    - Android development" -ForegroundColor White
Write-Host "  npm run tauri:dev      - Desktop application" -ForegroundColor White
Write-Host "  npm run dev            - Web development" -ForegroundColor White
Write-Host ""

# Exit with non-zero code to indicate iOS is not available
exit 1