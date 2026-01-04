#!/bin/bash
# Script para crear splash screens personalizados para iOS con logo redimensionado

echo "[STYLE] Creating custom iOS splash screens with resized logo..."

# Crear directorio temporal
mkdir -p temp_splash

# Crear splash screen con logo al 25% del tamaño (683px en canvas de 2732px)
echo "Creating splash screen with logo at 25% size..."
sips -z 683 683 --padToHeightWidth 2732 2732 --padColor 000000 public/logo.png --out temp_splash/splash_25percent.png

# Verificar que se creó correctamente
if [ -f "temp_splash/splash_25percent.png" ]; then
    echo "Custom splash screen created: temp_splash/splash_25percent.png"
    
    # Reemplazar todos los splash screens de iOS
    echo "Replacing iOS splash screen assets..."
    cp temp_splash/splash_25percent.png ios/App/App/Assets.xcassets/Splash.imageset/Default@1x~universal~anyany.png
    cp temp_splash/splash_25percent.png ios/App/App/Assets.xcassets/Splash.imageset/Default@2x~universal~anyany.png
    cp temp_splash/splash_25percent.png ios/App/App/Assets.xcassets/Splash.imageset/Default@3x~universal~anyany.png
    
    # Reemplazar también las versiones dark mode
    echo "🌙 Updating dark mode splash screens..."
    cp temp_splash/splash_25percent.png ios/App/App/Assets.xcassets/Splash.imageset/Default@1x~universal~anyany-dark.png
    cp temp_splash/splash_25percent.png ios/App/App/Assets.xcassets/Splash.imageset/Default@2x~universal~anyany-dark.png
    cp temp_splash/splash_25percent.png ios/App/App/Assets.xcassets/Splash.imageset/Default@3x~universal~anyany-dark.png
    
    echo "iOS splash screens updated with resized logo (25% of screen size)"
    echo "Run 'npx cap sync ios' to apply changes"
    
    # Limpiar archivos temporales
    rm -rf temp_splash
    
else
    echo "[ERROR] Error: Could not create custom splash screen"
    exit 1
fi