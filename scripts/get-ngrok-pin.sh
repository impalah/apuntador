#!/bin/bash

#
# Script para obtener el certificate pin SHA-256 de ngrok
#
# Este script obtiene el certificado de ngrok y calcula
# el hash SHA-256 necesario para certificate pinning.
#
# Uso:
#   ./get-ngrok-pin.sh
#
# Requiere que ngrok esté corriendo con el dominio apuntador.ngrok.app
#

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

NGROK_DOMAIN="apuntador.ngrok.app"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  ngrok Certificate Pin Extractor${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}ngrok Domain:${NC} $NGROK_DOMAIN"
echo ""

# Verificar que ngrok está corriendo
echo -e "${BLUE}Verificando que ngrok está corriendo...${NC}"
if ! curl -s -f "https://$NGROK_DOMAIN" > /dev/null 2>&1; then
    echo -e "${RED}[ERROR] Error: No se puede conectar a $NGROK_DOMAIN${NC}"
    echo -e "${YELLOW}   Asegúrate de que ngrok está corriendo:${NC}"
    echo -e "${YELLOW}   ngrok http 8000 --domain=$NGROK_DOMAIN${NC}"
    exit 1
fi

echo -e "${GREEN}ngrok está corriendo${NC}"
echo ""

# Obtener el pin SHA-256
echo -e "${BLUE}Obteniendo certificado de ngrok...${NC}"
PIN=$(echo | openssl s_client -servername $NGROK_DOMAIN -connect $NGROK_DOMAIN:443 2>/dev/null | openssl x509 -pubkey -noout | openssl pkey -pubin -outform DER | openssl dgst -sha256 -binary | base64)

if [ -z "$PIN" ]; then
    echo -e "${RED}[ERROR] Error: No se pudo obtener el pin del certificado${NC}"
    exit 1
fi

echo -e "${GREEN}Pin obtenido exitosamente${NC}"
echo ""

# Mostrar resultado
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Certificate Pin SHA-256 (Base64)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}$PIN${NC}"
echo ""

# Instrucciones para Android
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Configuración para Android${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Archivo:${NC} android/app/src/main/res/xml/network_security_config.xml"
echo ""
echo "Reemplazar:"
echo ""
echo -e "${RED}    <pin digest=\"SHA-256\">YOUR_NGROK_CERT_SHA256_PIN_HERE</pin>${NC}"
echo ""
echo "Con:"
echo ""
echo -e "${GREEN}    <pin digest=\"SHA-256\">$PIN</pin>${NC}"
echo ""

# Instrucciones para iOS
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Configuración para iOS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Archivo:${NC} ios/App/Plugins/MTLSHTTPClient.swift"
echo ""
echo "Reemplazar:"
echo ""
echo -e "${RED}    \"YOUR_NGROK_CERT_SHA256_PIN_HERE\",${NC}"
echo ""
echo "Con:"
echo ""
echo -e "${GREEN}    \"$PIN\",${NC}"
echo ""

# Nota importante
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Nota Importante${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}[WARNING]  Con ngrok Pro y dominio fijo, el certificado debería ser estable.${NC}"
echo ""
echo "Pero si ngrok rota el certificado:"
echo "1. Ejecuta este script de nuevo"
echo "2. Actualiza el pin en Android e iOS"
echo "3. Reconstruye las apps"
echo ""
echo -e "${YELLOW}Para producción (API Gateway con custom domain):${NC}"
echo "Ejecuta: ./scripts/get-certificate-pins.sh https://api.apuntador.io"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
