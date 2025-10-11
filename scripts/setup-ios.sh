#!/bin/bash

# Script para configurar iOS en Apuntador
# Este script prepara todo lo necesario para desarrollo iOS

set -e

echo "🍎 Configurando Apuntador para iOS..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes con color
print_status() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar que estamos en macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    print_error "Este script solo funciona en macOS"
    exit 1
fi

# Verificar que Xcode está instalado
if ! xcode-select -p &> /dev/null; then
    print_error "Xcode no está instalado. Instala Xcode desde el App Store."
    print_warning "También ejecuta: sudo xcode-select --install"
    exit 1
fi

# Verificar que CocoaPods está instalado
if ! command -v pod &> /dev/null; then
    print_warning "CocoaPods no está instalado. Instalando..."
    sudo gem install cocoapods
    print_success "CocoaPods instalado"
fi

# Verificar que las dependencias están instaladas
print_status "Verificando dependencias de npm..."
if [ ! -d "node_modules" ]; then
    print_warning "Instalando dependencias de npm..."
    npm install
fi

# Verificar que @capacitor/ios está instalado
if ! npm list @capacitor/ios &> /dev/null; then
    print_warning "Instalando @capacitor/ios..."
    npm install @capacitor/ios
fi

# Construir la aplicación web
print_status "Construyendo aplicación web..."
npm run build

# Generar iconos y splash screens
print_status "Generando iconos y splash screens para iOS..."
if npm list @capacitor/assets &> /dev/null; then
    npx capacitor-assets generate --ios || print_warning "Error generando assets, continuando..."
else
    print_warning "@capacitor/assets no está instalado. Instálalo con: npm install -D @capacitor/assets"
fi

# Sincronizar con iOS
print_status "Sincronizando proyecto iOS..."
npx cap sync ios

# Instalar pods si iOS existe
if [ -d "ios" ]; then
    print_status "Instalando CocoaPods para iOS..."
    cd ios/App
    pod install --repo-update
    cd ../..
    print_success "CocoaPods instalado correctamente"
fi

print_success "🎉 Configuración de iOS completada!"
print_status ""
print_status "Comandos disponibles:"
print_status "  npm run ios:dev              - Abrir proyecto en Xcode"
print_status "  npm run ios:run              - Ejecutar en simulador por defecto"
print_status "  npm run ios:run:iphone       - Ejecutar en iPhone 15"
print_status "  npm run ios:run:iphone-pro   - Ejecutar en iPhone 15 Pro"
print_status "  npm run ios:run:ipad          - Ejecutar en iPad"
print_status "  npm run ios:run:ipad-pro     - Ejecutar en iPad Pro"
print_status "  npm run ios:list-simulators  - Listar simuladores disponibles"
print_status ""
print_warning "Nota: Asegúrate de tener simuladores de iOS instalados en Xcode"