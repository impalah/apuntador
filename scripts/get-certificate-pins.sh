#!/bin/bash

#
# Script para obtener los certificate pins SHA-256 del backend
#
# Este script descarga el certificado CA del backend y calcula
# los hashes SHA-256 necesarios para certificate pinning.
#
# Uso:
#   ./get-certificate-pins.sh [BACKEND_URL]
#
# Ejemplo:
#   ./get-certificate-pins.sh https://api.apuntador.io
#
# El script mostrará:
# - Hash SHA-256 en Base64 (para iOS y Android)
# - Hash SHA-256 en Hexadecimal
# - El certificado PEM completo
#

set -e

# Color codes para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default backend URL
BACKEND_URL="${1:-https://api.apuntador.io}"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Certificate Pinning - Pin Extractor${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Backend URL:${NC} $BACKEND_URL"
echo ""

# Verificar que curl está instalado
if ! command -v curl &> /dev/null; then
    echo -e "${RED}[ERROR] Error: curl no está instalado${NC}"
    exit 1
fi

# Verificar que jq está instalado
if ! command -v jq &> /dev/null; then
    echo -e "${RED}[ERROR] Error: jq no está instalado${NC}"
    echo -e "${YELLOW}   Instalar con: brew install jq${NC}"
    exit 1
fi

# Crear directorio temporal
TMP_DIR=$(mktemp -d)
trap "rm -rf $TMP_DIR" EXIT

echo -e "${BLUE}[SIGNAL] Descargando pins del certificado desde el backend...${NC}"
echo ""

# Descargar pins desde el endpoint del backend
RESPONSE=$(curl -s -f "$BACKEND_URL/device/ca-certificate-pin" || echo "")

if [ -z "$RESPONSE" ]; then
    echo -e "${RED}[ERROR] Error: No se pudo conectar con el backend${NC}"
    echo -e "${YELLOW}   Verifica que el backend esté corriendo en: $BACKEND_URL${NC}"
    exit 1
fi

# Extraer datos del JSON
SHA256_BASE64=$(echo "$RESPONSE" | jq -r '.sha256_base64')
SHA256_HEX=$(echo "$RESPONSE" | jq -r '.sha256_hex')
ALGORITHM=$(echo "$RESPONSE" | jq -r '.algorithm')
USAGE=$(echo "$RESPONSE" | jq -r '.usage')

if [ "$SHA256_BASE64" == "null" ] || [ -z "$SHA256_BASE64" ]; then
    echo -e "${RED}[ERROR] Error: Respuesta inválida del backend${NC}"
    echo -e "${YELLOW}   Respuesta recibida:${NC}"
    echo "$RESPONSE" | jq .
    exit 1
fi

# Mostrar resultados
echo -e "${GREEN}[OK] Certificate pins obtenidos exitosamente${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Pins SHA-256 del Certificado CA${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Algoritmo:${NC} $ALGORITHM"
echo ""
echo -e "${YELLOW}SHA-256 (Base64):${NC}"
echo -e "${GREEN}$SHA256_BASE64${NC}"
echo ""
echo -e "${YELLOW}SHA-256 (Hexadecimal):${NC}"
echo -e "${GREEN}$SHA256_HEX${NC}"
echo ""

# Instrucciones para Android
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Configuración para Android${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Archivo:${NC} android/app/src/main/res/xml/network_security_config.xml"
echo ""
echo "Reemplazar las líneas:"
echo ""
echo -e "${RED}    <pin digest=\"SHA-256\">YOUR_CA_CERT_SHA256_PIN_HERE</pin>${NC}"
echo ""
echo "Con:"
echo ""
echo -e "${GREEN}    <pin digest=\"SHA-256\">$SHA256_BASE64</pin>${NC}"
echo ""

# Instrucciones para iOS
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Configuración para iOS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Archivo:${NC} ios/App/Plugins/MTLSHTTPClient.swift"
echo ""
echo "Reemplazar la línea:"
echo ""
echo -e "${RED}    \"YOUR_CA_CERT_SHA256_PIN_HERE\",${NC}"
echo ""
echo "Con:"
echo ""
echo -e "${GREEN}    \"$SHA256_BASE64\",${NC}"
echo ""

# Nota sobre backup pins
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Nota sobre Backup Pins${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}[WARNING]  Importante:${NC} Debes mantener un backup pin para rotación de certificados."
echo ""
echo "Cuando rotes el certificado del CA:"
echo "1. Genera el nuevo certificado en el backend"
echo "2. Obtén el nuevo pin ejecutando este script"
echo "3. Añade el nuevo pin como BACKUP antes de rotar"
echo "4. Despliega la app con ambos pins (viejo + nuevo)"
echo "5. Después de N días, rota el certificado en el backend"
echo "6. La app seguirá funcionando con el nuevo pin"
echo "7. En la siguiente actualización, elimina el pin viejo"
echo ""
echo -e "${YELLOW}$USAGE${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
