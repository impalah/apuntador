#!/bin/bash

# Script de verificación de configuración para firma de código macOS
# Este script ayuda a verificar que tienes todo listo antes de configurar GitHub Actions

set -e

echo "[SEARCH] Verificación de Configuración para Firma de Código macOS"
echo "============================================================"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para mostrar OK
ok() {
    echo -e "${GREEN}[OK] $1${NC}"
}

# Función para mostrar ERROR
error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

# Función para mostrar WARNING
warn() {
    echo -e "${YELLOW}[WARNING]  $1${NC}"
}

# 1. Verificar que estamos en macOS
echo "1️⃣  Verificando sistema operativo..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    ok "Ejecutando en macOS"
else
    error "Este script debe ejecutarse en macOS"
    exit 1
fi
echo ""

# 2. Verificar Xcode Command Line Tools
echo "2️⃣  Verificando Xcode Command Line Tools..."
if xcode-select -p &> /dev/null; then
    XCODE_PATH=$(xcode-select -p)
    ok "Xcode Command Line Tools instalado en: $XCODE_PATH"
else
    error "Xcode Command Line Tools no instalado"
    echo "   Instala con: xcode-select --install"
    exit 1
fi
echo ""

# 3. Verificar certificado Developer ID
echo "3️⃣  Buscando certificado Developer ID Application..."
CERT_COUNT=$(security find-identity -v -p codesigning | grep "Developer ID Application" | wc -l | tr -d ' ')

if [ "$CERT_COUNT" -eq "0" ]; then
    error "No se encontró certificado 'Developer ID Application'"
    echo "   Sigue la guía en docs/MACOS_CODE_SIGNING.md para obtener uno"
    CERT_OK=false
elif [ "$CERT_COUNT" -eq "1" ]; then
    CERT_INFO=$(security find-identity -v -p codesigning | grep "Developer ID Application")
    ok "Certificado encontrado:"
    echo "   $CERT_INFO"
    CERT_OK=true
else
    warn "Se encontraron múltiples certificados ($CERT_COUNT)"
    security find-identity -v -p codesigning | grep "Developer ID Application"
    echo ""
    echo "   El workflow usará el primero encontrado"
    CERT_OK=true
fi
echo ""

# 4. Extraer Team ID del certificado
if [ "$CERT_OK" = true ]; then
    echo "4️⃣  Extrayendo Team ID..."
    TEAM_ID=$(security find-identity -v -p codesigning | grep "Developer ID Application" | head -1 | sed -n 's/.*(\([^)]*\)).*/\1/p')
    if [ -n "$TEAM_ID" ]; then
        ok "Team ID encontrado: $TEAM_ID"
        echo ""
        echo "   [LIST] Copia este valor para el secret APPLE_TEAM_ID en GitHub:"
        echo "   $TEAM_ID"
    else
        warn "No se pudo extraer el Team ID automáticamente"
        echo "   Búscalo manualmente en developer.apple.com/account"
    fi
    echo ""
fi

# 5. Verificar que existe el archivo entitlements.plist
echo "5️⃣  Verificando archivo entitlements.plist..."
if [ -f "src-tauri/entitlements.plist" ]; then
    ok "Archivo entitlements.plist existe"
else
    error "Archivo entitlements.plist no encontrado"
    echo "   Se necesita para la firma con hardened runtime"
    exit 1
fi
echo ""

# 6. Instrucciones para exportar certificado
echo "6️⃣  Pasos para exportar el certificado..."
echo ""
echo "   Para usar en GitHub Actions, necesitas exportar el certificado:"
echo ""
echo "   1. Abre 'Acceso a llaveros' (Keychain Access)"
echo "   2. Busca tu certificado 'Developer ID Application'"
echo "   3. Clic derecho → 'Exportar...'"
echo "   4. Formato: Personal Information Exchange (.p12)"
echo "   5. Guarda como: DeveloperID.p12"
echo "   6. Crea una contraseña segura (¡guárdala!)"
echo ""
echo "   Luego, convierte a base64:"
echo "   $ base64 -i DeveloperID.p12 -o DeveloperID-base64.txt"
echo ""
warn "IMPORTANTE: Guarda DeveloperID-base64.txt en un lugar seguro"
warn "           NO lo subas a Git ni lo compartas públicamente"
echo ""

# 7. Verificar Apple ID
echo "7️⃣  Información necesaria para GitHub Secrets..."
echo ""
echo "   Necesitarás configurar estos 5 secrets en GitHub:"
echo ""
echo "   1. APPLE_CERTIFICATE_BASE64"
echo "      → Contenido de DeveloperID-base64.txt"
echo ""
echo "   2. APPLE_CERTIFICATE_PASSWORD"
echo "      → La contraseña que usaste al exportar el .p12"
echo ""
echo "   3. APPLE_ID"
echo "      → Tu email de Apple Developer"
echo "      Ejemplo: tu@email.com"
echo ""
echo "   4. APPLE_APP_SPECIFIC_PASSWORD"
echo "      → Genera en: appleid.apple.com → Seguridad → Contraseñas de app"
echo "      → Dale un nombre: 'Apuntador Notarization'"
echo "      → Formato: xxxx-xxxx-xxxx-xxxx"
echo ""
echo "   5. APPLE_TEAM_ID"
if [ -n "$TEAM_ID" ]; then
    echo "      → Usa: $TEAM_ID"
else
    echo "      → Encuéntralo en: developer.apple.com/account"
fi
echo ""

# 8. Resumen
echo "============================================================"
echo "[STATS] Resumen de Verificación"
echo "============================================================"
echo ""

if [ "$CERT_OK" = true ]; then
    ok "Certificado Developer ID: Encontrado"
else
    error "Certificado Developer ID: No encontrado"
fi

if [ -f "src-tauri/entitlements.plist" ]; then
    ok "Archivo entitlements.plist: Existe"
else
    error "Archivo entitlements.plist: No encontrado"
fi

if [ -n "$TEAM_ID" ]; then
    ok "Team ID: $TEAM_ID"
else
    warn "Team ID: Verificar manualmente"
fi

echo ""
echo "============================================================"
echo "📖 Siguiente paso:"
echo "   Lee la guía completa en: docs/MACOS_CODE_SIGNING.md"
echo "============================================================"
