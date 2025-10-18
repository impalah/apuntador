#!/bin/bash

# Test script para verificar la nueva pestaña About
# Ejecutar desde la raíz del proyecto

echo "🚀 Verificando implementación de la pestaña About..."
echo ""

# Verificar que existen todos los archivos modificados
echo "📁 Verificando archivos creados/modificados:"

if [ -f "src/utils/version.ts" ]; then
    echo "✅ src/utils/version.ts - Creado correctamente"
else
    echo "❌ src/utils/version.ts - Falta"
fi

# Verificar traducciones en todos los idiomas
languages=("en-US" "es-ES" "ca-ES" "gl-ES" "pt-BR" "pt-PT" "fr-FR" "de-DE" "it-IT")

echo ""
echo "🌍 Verificando traducciones en ${#languages[@]} idiomas:"

for lang in "${languages[@]}"; do
    file="src/locales/${lang}.json"
    if [ -f "$file" ]; then
        # Verificar que contiene las nuevas claves
        if grep -q '"about":' "$file" && grep -q '"subtitle":' "$file" && grep -q '"version":' "$file" && grep -q '"copyright":' "$file"; then
            echo "✅ $lang - Todas las claves agregadas"
        else
            echo "❌ $lang - Faltan claves"
        fi
    else
        echo "❌ $lang - Archivo no existe"
    fi
done

# Verificar que el componente SettingsDialog fue modificado
echo ""
echo "🔧 Verificando componente SettingsDialog:"

if grep -q 'value="about"' "src/components/SettingsDialog.vue"; then
    echo "✅ Tab 'about' agregado correctamente"
else
    echo "❌ Falta tab 'about'"
fi

if grep -q 'versionInfo' "src/components/SettingsDialog.vue"; then
    echo "✅ Información de versión integrada"
else
    echo "❌ Falta información de versión"
fi

if grep -q 'getVersionInfo' "src/components/SettingsDialog.vue"; then
    echo "✅ Import de getVersionInfo agregado"
else
    echo "❌ Falta import de getVersionInfo"
fi

echo ""
echo "📋 Funcionalidades implementadas:"
echo "   📌 Pestaña About tras la pestaña Data"
echo "   📌 Título: Apuntador - [Subtítulo traducido]"
echo "   📌 Versión actual mostrada"
echo "   📌 Copyright con enlace a GitHub"
echo "   📌 Traducciones completas en 9 idiomas"
echo ""
echo "🎯 Para probar:"
echo "   1. npm run dev"
echo "   2. Abrir http://localhost:3000"
echo "   3. Abrir configuración (icono de engranaje)"
echo "   4. Ir a la pestaña 'About' (última pestaña)"
echo "   5. Verificar que se muestra la información correcta"
echo "   6. Cambiar idioma y verificar traducciones"
echo ""
echo "📝 Versión actual: $(grep 'APP_VERSION' src/utils/version.ts | cut -d"'" -f2)"
echo "📝 Versión package.json: $(grep '"version"' package.json | cut -d'"' -f4)"
echo ""
echo "✨ ¡Implementación completada!"