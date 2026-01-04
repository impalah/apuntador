#!/bin/bash

# Script específico para obtener SHA-1 del release keystore de Apuntador

echo "=================================================="
echo "  SHA-1 de apuntador-release-key.keystore"
echo "=================================================="
echo ""

KEYSTORE_PATH="android/apuntador-release-key.keystore"
ALIAS="apuntador"

# Verificar que existe el keystore
if [ ! -f "$KEYSTORE_PATH" ]; then
    echo "[ERROR] Error: No se encontró el keystore en $KEYSTORE_PATH"
    exit 1
fi

# Verificar que existe key.properties
if [ ! -f "android/key.properties" ]; then
    echo "[ERROR] Error: No se encontró android/key.properties"
    echo "Crea el archivo basándote en key.properties.template"
    exit 1
fi

# Leer contraseña desde key.properties
STORE_PASS=$(grep "storePassword=" android/key.properties | cut -d= -f2)
KEY_PASS=$(grep "keyPassword=" android/key.properties | cut -d= -f2)

if [ -z "$STORE_PASS" ]; then
    echo "[ERROR] Error: No se pudo leer storePassword de key.properties"
    exit 1
fi

echo "Obteniendo SHA-1..."
echo ""

# Ejecutar keytool
SHA1=$(keytool -list -v -keystore "$KEYSTORE_PATH" \
    -alias "$ALIAS" \
    -storepass "$STORE_PASS" \
    -keypass "$KEY_PASS" 2>&1 | grep "SHA1:" | cut -d: -f2- | tr -d ' ')

if [ -z "$SHA1" ]; then
    echo "[ERROR] Error: No se pudo obtener el SHA-1"
    echo "Verifica que el alias y las contraseñas sean correctos"
    exit 1
fi

echo "=================================================="
echo "SHA-1 Fingerprint (Release):"
echo ""
echo "    $SHA1"
echo ""
echo "=================================================="
echo ""
echo "Próximos pasos:"
echo ""
echo "1. Ve a: https://console.cloud.google.com/apis/credentials"
echo "2. Selecciona tu proyecto Apuntador"
echo "3. Crea un cliente OAuth tipo 'Android' o edita el existente"
echo "4. Package name: io.apuntador.app"
echo "5. Pega el SHA-1 de arriba"
echo "6. Guarda los cambios"
echo ""
echo "[WARNING]  Recuerda también agregar el SHA-1 del debug keystore"
echo "    para que funcione en desarrollo:"
echo ""
echo "    keytool -list -v -keystore ~/.android/debug.keystore \\"
echo "      -alias androiddebugkey -storepass android -keypass android"
echo ""
