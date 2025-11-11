#!/bin/bash

# Script para configurar el secret ENV_FILE en GitHub
# Uso: ./scripts/setup-github-env-secret.sh

set -e

echo "🔧 Setup GitHub ENV_FILE Secret"
echo "================================"
echo ""

# Verificar que existe .env
if [ ! -f ".env" ]; then
    echo "❌ Error: No se encontró el archivo .env"
    echo ""
    echo "📋 Pasos para crear el .env:"
    echo "   1. cp .env.example .env"
    echo "   2. Edita .env con tus credenciales reales"
    echo "   3. Ejecuta este script nuevamente"
    echo ""
    exit 1
fi

# Verificar que existe GitHub CLI
if ! command -v gh &> /dev/null; then
    echo "❌ Error: GitHub CLI (gh) no está instalado"
    echo ""
    echo "📥 Instalar GitHub CLI:"
    echo "   macOS:   brew install gh"
    echo "   Windows: scoop install gh"
    echo "   Linux:   https://github.com/cli/cli/blob/trunk/docs/install_linux.md"
    echo ""
    exit 1
fi

# Verificar autenticación
if ! gh auth status &> /dev/null; then
    echo "🔐 No estás autenticado en GitHub CLI"
    echo "Ejecutando: gh auth login"
    echo ""
    gh auth login
fi

echo "📋 Variables encontradas en .env:"
grep -E '^[^#]' .env | cut -d'=' -f1 | sed 's/^/   ✓ /' || echo "   (ninguna)"
echo ""

# Confirmación
read -p "¿Crear/actualizar el secret ENV_FILE con este contenido? (s/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[SsYy]$ ]]; then
    echo "❌ Operación cancelada"
    exit 1
fi

# Crear el secret
echo ""
echo "📤 Creando secret ENV_FILE..."

if gh secret set ENV_FILE < .env; then
    echo "✅ Secret ENV_FILE creado/actualizado correctamente"
    echo ""
    echo "📋 Verificación:"
    gh secret list | grep ENV_FILE || echo "   ⚠️  No se pudo verificar (puede ser normal)"
    echo ""
    echo "🎉 ¡Listo! Ahora los workflows de GitHub Actions podrán usar las variables de entorno."
    echo ""
    echo "🔍 Para verificar:"
    echo "   1. Haz un commit y push"
    echo "   2. Ve a la pestaña Actions en GitHub"
    echo "   3. Observa el step 'Create .env file' en los logs"
else
    echo "❌ Error al crear el secret"
    echo ""
    echo "🔍 Posibles causas:"
    echo "   - No tienes permisos de escritura en el repositorio"
    echo "   - El repositorio es un fork"
    echo "   - Problema de conectividad"
    echo ""
    echo "💡 Alternativa: Configura el secret manualmente en:"
    echo "   https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/settings/secrets/actions"
    exit 1
fi
