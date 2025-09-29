# Setup MSVC environment for Tauri
$vsPath = "C:\Program Files\Microsoft Visual Studio\2022\Community"
$vcToolsPath = "$vsPath\VC\Tools\MSVC\14.42.34433"
$sdkPath = "$vsPath\SDK\ScopeCppSDK\vc15\SDK"

Write-Host "Using SDK path: $sdkPath"

# Add MSVC tools to PATH
$env:PATH = "$vcToolsPath\bin\Hostx64\x64;$env:PATH"

# Set required environment variables
$env:VCINSTALLDIR = "$vsPath\VC\"
$env:VCToolsInstallDir = "$vcToolsPath\"

# Set LIB and INCLUDE paths using the SDK available
$env:LIB = "$vcToolsPath\lib\x64;$sdkPath\lib"
$env:INCLUDE = "$vcToolsPath\include;$sdkPath\include"

Write-Host "MSVC environment configured"
Write-Host "LIB path: $env:LIB"
Write-Host "Testing link.exe..."
try {
    link.exe 2>&1 | Out-Null
    Write-Host "link.exe found successfully!" -ForegroundColor Green
} catch {
    Write-Host "link.exe still not found" -ForegroundColor Red
}

# Test if kernel32.lib can be found
$kernel32Path = "$sdkPath\lib\kernel32.lib"
if (Test-Path $kernel32Path) {
    Write-Host "kernel32.lib found at: $kernel32Path" -ForegroundColor Green
} else {
    Write-Host "kernel32.lib NOT found at: $kernel32Path" -ForegroundColor Red
}