# Script para obtener SHA-1 fingerprint de keystores Android en Windows
# Usado para configurar cliente OAuth Android en Google Cloud Console

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Obtener SHA-1 Fingerprint para Google OAuth" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

function Get-SHA1Fingerprint {
    param(
        [string]$KeystorePath,
        [string]$Alias,
        [string]$StorePass,
        [string]$KeyPass
    )
    
    Write-Host "Intentando obtener SHA-1 de: $KeystorePath" -ForegroundColor Yellow
    
    if (-not (Test-Path $KeystorePath)) {
        Write-Host "Error: Keystore no encontrado en $KeystorePath" -ForegroundColor Red
        return $false
    }
    
    try {
        $output = & keytool -list -v -keystore $KeystorePath `
            -alias $Alias `
            -storepass $StorePass `
            -keypass $KeyPass 2>&1
        
        $sha1Line = $output | Select-String "SHA1:"
        if ($sha1Line) {
            $sha1 = ($sha1Line -split ":")[1].Trim()
            
            Write-Host "✓ SHA-1 obtenido exitosamente" -ForegroundColor Green
            Write-Host ""
            Write-Host "==================================================" -ForegroundColor Cyan
            Write-Host "SHA-1 Fingerprint:" -ForegroundColor Green
            Write-Host ""
            Write-Host "    $sha1" -ForegroundColor White
            Write-Host ""
            Write-Host "==================================================" -ForegroundColor Cyan
            Write-Host ""
            return $true
        } else {
            Write-Host "Error: No se pudo obtener SHA-1" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "Error al ejecutar keytool: $_" -ForegroundColor Red
        return $false
    }
}

Write-Host "Selecciona el tipo de keystore:" -ForegroundColor White
Write-Host ""
Write-Host "  1) Debug (desarrollo local)"
Write-Host "  2) Release (producción - Google Play)"
Write-Host "  3) Ambos"
Write-Host ""

$option = Read-Host "Opción [1-3]"

switch ($option) {
    {$_ -in "1", "3"} {
        Write-Host ""
        Write-Host "--- DEBUG KEYSTORE ---" -ForegroundColor Cyan
        Write-Host ""
        
        $debugKeystore = "$env:USERPROFILE\.android\debug.keystore"
        
        if (Test-Path $debugKeystore) {
            $result = Get-SHA1Fingerprint `
                -KeystorePath $debugKeystore `
                -Alias "androiddebugkey" `
                -StorePass "android" `
                -KeyPass "android"
            
            if ($result) {
                Write-Host "Copia este SHA-1 y agrégalo en Google Cloud Console:" -ForegroundColor Yellow
                Write-Host "   → Tipo de aplicación: Android"
                Write-Host "   → Nombre del paquete: io.apuntador.app"
                Write-Host "   → SHA-1: (el valor de arriba)"
                Write-Host ""
            }
        } else {
            Write-Host "Debug keystore no encontrado en ubicación por defecto" -ForegroundColor Yellow
            Write-Host "Ubicación esperada: $debugKeystore"
            Write-Host ""
            Write-Host "Para generar el debug keystore, ejecuta:"
            Write-Host "  cd android"
            Write-Host "  .\gradlew assembleDebug"
            Write-Host ""
            
            if ($option -eq "1") {
                exit 1
            }
        }
        
        if ($option -eq "1") {
            exit 0
        }
    }
}

switch ($option) {
    {$_ -in "2", "3"} {
        Write-Host ""
        Write-Host "--- RELEASE KEYSTORE ---" -ForegroundColor Cyan
        Write-Host ""
        
        # Buscar release keystore en ubicaciones comunes
        $releaseKeystore = $null
        $locations = @(
            "android\app\release.keystore",
            "android\release.keystore",
            "$env:USERPROFILE\.android\release.keystore"
        )
        
        foreach ($loc in $locations) {
            if (Test-Path $loc) {
                $releaseKeystore = $loc
                break
            }
        }
        
        if (-not $releaseKeystore) {
            Write-Host "Release keystore no encontrado automáticamente" -ForegroundColor Yellow
            Write-Host ""
            $releaseKeystore = Read-Host "Ingresa la ruta completa al release keystore"
        }
        
        if (-not (Test-Path $releaseKeystore)) {
            Write-Host "Error: Keystore no encontrado" -ForegroundColor Red
            exit 1
        }
        
        Write-Host ""
        $alias = Read-Host "Ingresa el alias del keystore"
        $storepass = Read-Host "Ingresa el storepass" -AsSecureString
        $storepassPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($storepass)
        )
        
        $keypass = Read-Host "Ingresa el keypass (Enter si es igual al storepass)" -AsSecureString
        $keypassPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($keypass)
        )
        
        if ([string]::IsNullOrEmpty($keypassPlain)) {
            $keypassPlain = $storepassPlain
        }
        
        $result = Get-SHA1Fingerprint `
            -KeystorePath $releaseKeystore `
            -Alias $alias `
            -StorePass $storepassPlain `
            -KeyPass $keypassPlain
        
        if ($result) {
            Write-Host "Copia este SHA-1 y agrégalo en Google Cloud Console:" -ForegroundColor Yellow
            Write-Host "   → Ve al cliente Android que creaste"
            Write-Host "   → Click en 'Agregar huella digital'"
            Write-Host "   → Pega el SHA-1 de arriba"
            Write-Host "   → Click en 'Guardar'"
            Write-Host ""
        }
    }
}

Write-Host ""
Write-Host "✓ Proceso completado" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Yellow
Write-Host "  1. Ve a: https://console.cloud.google.com/apis/credentials"
Write-Host "  2. Selecciona tu proyecto Apuntador"
Write-Host "  3. Crea un cliente OAuth tipo 'Android'"
Write-Host "  4. Package name: io.apuntador.app"
Write-Host "  5. Pega el/los SHA-1 obtenido(s) arriba"
Write-Host "  6. Copia el Client ID generado"
Write-Host "  7. Agrégalo a tu .env como VITE_GOOGLE_DRIVE_CLIENT_ID"
Write-Host ""
