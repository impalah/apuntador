#!/bin/bash

# Script para obtener SHA-1 fingerprint de keystores Android
# Usado para configurar cliente OAuth Android en Google Cloud Console

set -e

echo "=================================================="
echo "  Obtener SHA-1 Fingerprint para Google OAuth"
echo "=================================================="
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para extraer SHA-1
extract_sha1() {
    local keystore_path=$1
    local alias=$2
    local storepass=$3
    local keypass=$4
    
    echo -e "${YELLOW}Intentando obtener SHA-1 de: $keystore_path${NC}"
    
    if [ ! -f "$keystore_path" ]; then
        echo -e "${RED}Error: Keystore no encontrado en $keystore_path${NC}"
        return 1
    fi
    
    # Ejecutar keytool y capturar salida
    sha1=$(keytool -list -v -keystore "$keystore_path" \
        -alias "$alias" \
        -storepass "$storepass" \
        -keypass "$keypass" 2>&1 | grep "SHA1:" | cut -d: -f2- | tr -d ' ')
    
    if [ -z "$sha1" ]; then
        echo -e "${RED}Error: No se pudo obtener SHA-1${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✓ SHA-1 obtenido exitosamente${NC}"
    echo ""
    echo "=================================================="
    echo -e "${GREEN}SHA-1 Fingerprint:${NC}"
    echo ""
    echo "    $sha1"
    echo ""
    echo "=================================================="
    echo ""
    return 0
}

echo "Selecciona el tipo de keystore:"
echo ""
echo "  1) Debug (desarrollo local)"
echo "  2) Release (producción - Google Play)"
echo "  3) Ambos"
echo ""
read -p "Opción [1-3]: " option

case $option in
    1|3)
        echo ""
        echo "--- DEBUG KEYSTORE ---"
        echo ""
        
        # Determinar ubicación del debug keystore
        if [ -f "$HOME/.android/debug.keystore" ]; then
            DEBUG_KEYSTORE="$HOME/.android/debug.keystore"
        else
            echo -e "${YELLOW}Debug keystore no encontrado en ubicación por defecto${NC}"
            echo "Ubicación esperada: $HOME/.android/debug.keystore"
            echo ""
            echo "Para generar el debug keystore, ejecuta:"
            echo "  cd android && ./gradlew assembleDebug"
            echo ""
            
            if [ "$option" = "1" ]; then
                exit 1
            fi
        fi
        
        if [ -n "$DEBUG_KEYSTORE" ]; then
            extract_sha1 "$DEBUG_KEYSTORE" "androiddebugkey" "android" "android"
            
            echo "[LIST] Copia este SHA-1 y agrégalo en Google Cloud Console:"
            echo "   → Tipo de aplicación: Android"
            echo "   → Nombre del paquete: io.apuntador.app"
            echo "   → SHA-1: (el valor de arriba)"
            echo ""
        fi
        
        if [ "$option" = "1" ]; then
            exit 0
        fi
        ;;
esac

case $option in
    2|3)
        echo ""
        echo "--- RELEASE KEYSTORE ---"
        echo ""
        
        # Intentar encontrar release keystore
        RELEASE_KEYSTORE=""
        
        # Buscar en ubicaciones comunes
        if [ -f "android/app/release.keystore" ]; then
            RELEASE_KEYSTORE="android/app/release.keystore"
        elif [ -f "android/release.keystore" ]; then
            RELEASE_KEYSTORE="android/release.keystore"
        elif [ -f "$HOME/.android/release.keystore" ]; then
            RELEASE_KEYSTORE="$HOME/.android/release.keystore"
        fi
        
        if [ -z "$RELEASE_KEYSTORE" ]; then
            echo -e "${YELLOW}Release keystore no encontrado automáticamente${NC}"
            echo ""
            read -p "Ingresa la ruta completa al release keystore: " RELEASE_KEYSTORE
        fi
        
        if [ ! -f "$RELEASE_KEYSTORE" ]; then
            echo -e "${RED}Error: Keystore no encontrado${NC}"
            exit 1
        fi
        
        echo ""
        read -p "Ingresa el alias del keystore [$RELEASE_KEYSTORE]: " RELEASE_ALIAS
        read -sp "Ingresa el storepass: " RELEASE_STOREPASS
        echo ""
        read -sp "Ingresa el keypass (Enter si es igual al storepass): " RELEASE_KEYPASS
        echo ""
        
        if [ -z "$RELEASE_KEYPASS" ]; then
            RELEASE_KEYPASS="$RELEASE_STOREPASS"
        fi
        
        extract_sha1 "$RELEASE_KEYSTORE" "$RELEASE_ALIAS" "$RELEASE_STOREPASS" "$RELEASE_KEYPASS"
        
        echo "[LIST] Copia este SHA-1 y agrégalo en Google Cloud Console:"
        echo "   → Ve al cliente Android que creaste"
        echo "   → Click en 'Agregar huella digital'"
        echo "   → Pega el SHA-1 de arriba"
        echo "   → Click en 'Guardar'"
        echo ""
        ;;
esac

echo ""
echo -e "${GREEN}✓ Proceso completado${NC}"
echo ""
echo "Próximos pasos:"
echo "  1. Ve a: https://console.cloud.google.com/apis/credentials"
echo "  2. Selecciona tu proyecto Apuntador"
echo "  3. Crea un cliente OAuth tipo 'Android'"
echo "  4. Package name: io.apuntador.app"
echo "  5. Pega el/los SHA-1 obtenido(s) arriba"
echo "  6. Copia el Client ID generado"
echo "  7. Agrégalo a tu .env como VITE_GOOGLE_DRIVE_CLIENT_ID"
echo ""
