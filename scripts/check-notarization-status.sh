#!/bin/bash

# Script para verificar el estado de la notarización de Apple
# y opcionalmente grapar (staple) el ticket una vez aprobado

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "Verificador de Estado de Notarización de Apple"
echo "=================================================="
echo ""

# Función para mostrar uso
usage() {
    echo "Uso: $0 <submission-id> [--staple /path/to/Apuntador.app]"
    echo ""
    echo "Argumentos:"
    echo "  submission-id    ID de la submission de notarización"
    echo "  --staple PATH    (Opcional) Grapar el ticket al .app si está aprobado"
    echo ""
    echo "Variables de entorno requeridas:"
    echo "  APPLE_ID                      Tu Apple ID"
    echo "  APPLE_APP_SPECIFIC_PASSWORD   Contraseña de app"
    echo "  APPLE_TEAM_ID                 Tu Team ID"
    echo ""
    echo "Ejemplo:"
    echo "  $0 9c7a7366-1e3c-45dc-b499-4a1bdc93b2cf"
    echo "  $0 9c7a7366-1e3c-45dc-b499-4a1bdc93b2cf --staple /Applications/Apuntador.app"
    exit 1
}

# Verificar argumentos
if [ -z "$1" ]; then
    echo -e "${RED}[ERROR] Error: Se requiere el submission ID${NC}"
    echo ""
    usage
fi

SUBMISSION_ID="$1"
SHOULD_STAPLE=false
APP_PATH=""

# Verificar si se pasó --staple
if [ "$2" = "--staple" ]; then
    if [ -z "$3" ]; then
        echo -e "${RED}[ERROR] Error: Se requiere la ruta al .app con --staple${NC}"
        usage
    fi
    SHOULD_STAPLE=true
    APP_PATH="$3"
    
    if [ ! -d "$APP_PATH" ]; then
        echo -e "${RED}[ERROR] Error: No se encontró la aplicación en: $APP_PATH${NC}"
        exit 1
    fi
fi

# Verificar variables de entorno
if [ -z "$APPLE_ID" ] || [ -z "$APPLE_APP_SPECIFIC_PASSWORD" ] || [ -z "$APPLE_TEAM_ID" ]; then
    echo -e "${RED}[ERROR] Error: Faltan variables de entorno${NC}"
    echo ""
    echo "Configura las siguientes variables:"
    echo "  export APPLE_ID='tu@email.com'"
    echo "  export APPLE_APP_SPECIFIC_PASSWORD='xxxx-xxxx-xxxx-xxxx'"
    echo "  export APPLE_TEAM_ID='B9VZ5U9FAZ'"
    echo ""
    exit 1
fi

echo -e "${BLUE}Submission ID:${NC} $SUBMISSION_ID"
echo -e "${BLUE}🆔 Apple ID:${NC} $APPLE_ID"
echo -e "${BLUE}👥 Team ID:${NC} $APPLE_TEAM_ID"
echo ""

# Consultar el estado
echo -e "${YELLOW}⏳ Consultando estado con Apple...${NC}"
echo ""

OUTPUT=$(xcrun notarytool info "$SUBMISSION_ID" \
    --apple-id "$APPLE_ID" \
    --password "$APPLE_APP_SPECIFIC_PASSWORD" \
    --team-id "$APPLE_TEAM_ID" \
    2>&1)

echo "$OUTPUT"
echo ""

# Extraer el estado
STATUS=$(echo "$OUTPUT" | grep "status:" | awk '{print $2}')

echo "════════════════════════════════════════════════════════════════"

case "$STATUS" in
    "Accepted")
        echo -e "${GREEN}NOTARIZACIÓN APROBADA${NC}"
        echo "════════════════════════════════════════════════════════════════"
        echo ""
        
        if [ "$SHOULD_STAPLE" = true ]; then
            echo -e "${YELLOW}[PIN] Grapando (stapling) el ticket a la aplicación...${NC}"
            xcrun stapler staple "$APP_PATH"
            
            echo ""
            echo -e "${YELLOW}Verificando ticket grapado...${NC}"
            xcrun stapler validate "$APP_PATH"
            
            echo ""
            echo -e "${GREEN}Proceso completado exitosamente!${NC}"
            echo ""
            echo "La aplicación ahora está firmada, notarizada y con ticket grapado."
            echo "Los usuarios NO verán advertencias de seguridad al instalarla."
        else
            echo -e "${BLUE} La notarización está aprobada${NC}"
            echo ""
            echo "Para grapar el ticket a tu aplicación, ejecuta:"
            echo -e "${BLUE}  xcrun stapler staple /path/to/Apuntador.app${NC}"
            echo ""
            echo "O vuelve a ejecutar este script con:"
            echo -e "${BLUE}  $0 $SUBMISSION_ID --staple /path/to/Apuntador.app${NC}"
        fi
        ;;
        
    "In Progress")
        echo -e "${YELLOW}⏳ NOTARIZACIÓN EN PROGRESO${NC}"
        echo "════════════════════════════════════════════════════════════════"
        echo ""
        echo "Apple todavía está procesando la aplicación."
        echo "Esto puede tardar de 10 a 90+ minutos."
        echo ""
        echo "Vuelve a ejecutar este script más tarde:"
        echo -e "${BLUE}  $0 $SUBMISSION_ID${NC}"
        ;;
        
    "Invalid")
        echo -e "${RED}[ERROR] NOTARIZACIÓN RECHAZADA${NC}"
        echo "════════════════════════════════════════════════════════════════"
        echo ""
        echo "Apple rechazó la notarización. Revisa los logs para ver el motivo:"
        echo ""
        echo -e "${BLUE}  xcrun notarytool log $SUBMISSION_ID \\${NC}"
        echo -e "${BLUE}    --apple-id $APPLE_ID \\${NC}"
        echo -e "${BLUE}    --password \$APPLE_APP_SPECIFIC_PASSWORD \\${NC}"
        echo -e "${BLUE}    --team-id $APPLE_TEAM_ID${NC}"
        echo ""
        exit 1
        ;;
        
    *)
        echo -e "${YELLOW}[WARNING]  ESTADO DESCONOCIDO: $STATUS${NC}"
        echo "════════════════════════════════════════════════════════════════"
        echo ""
        echo "Revisa los logs completos arriba."
        ;;
esac

echo "════════════════════════════════════════════════════════════════"
