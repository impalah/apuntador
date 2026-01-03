#!/bin/bash
set -e

echo "[BUILD]  Construyendo Apuntador para macOS..."

# 1. Limpiar builds anteriores
echo "[CLEANUP] Limpiando builds anteriores..."
rm -rf /tmp/Apuntador.app
killall apuntador 2>/dev/null || true

# 2. Construir frontend
echo "[STYLE] Construyendo frontend..."
cd /Users/linus/projects/press-any-key/apuntador
npm run build

# 3. Construir backend Rust
echo "🦀 Construyendo backend Rust..."
cargo build --manifest-path src-tauri/Cargo.toml --release

# 4. Crear estructura de app
echo "[PACKAGE] Creando estructura de aplicación..."
mkdir -p "/tmp/Apuntador.app/Contents/MacOS"
mkdir -p "/tmp/Apuntador.app/Contents/Resources"

# 5. Copiar binario
echo "[SAVE] Copiando ejecutable..."
cp src-tauri/target/release/apuntador "/tmp/Apuntador.app/Contents/MacOS/"

# 6. Copiar recursos web
echo "[WEB] Copiando recursos web..."
cp -R dist/* "/tmp/Apuntador.app/Contents/Resources/"

# 7. Crear Info.plist
echo "[FILE] Creando Info.plist..."
cat > "/tmp/Apuntador.app/Contents/Info.plist" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CFBundleExecutable</key>
	<string>apuntador</string>
	<key>CFBundleIdentifier</key>
	<string>com.apuntador.teleprompter</string>
	<key>CFBundleName</key>
	<string>Apuntador</string>
	<key>CFBundleDisplayName</key>
	<string>Apuntador</string>
	<key>CFBundleVersion</key>
	<string>0.1.24</string>
	<key>CFBundleShortVersionString</key>
	<string>0.1.24</string>
	<key>CFBundlePackageType</key>
	<string>APPL</string>
	<key>CFBundleSignature</key>
	<string>????</string>
	<key>LSMinimumSystemVersion</key>
	<string>10.13</string>
	<key>NSHighResolutionCapable</key>
	<true/>
	<key>NSSupportsAutomaticGraphicsSwitching</key>
	<true/>
	<key>NSAppTransportSecurity</key>
	<dict>
		<key>NSAllowsArbitraryLoads</key>
		<true/>
	</dict>
</dict>
</plist>
EOF

# 8. Firmar aplicación
echo "[SIGN]  Firmando aplicación..."
codesign --force --deep --sign - "/tmp/Apuntador.app"

# 9. Instalar
echo "[INSTALL] Instalando aplicación..."
rm -rf "/Applications/Apuntador.app"
cp -R "/tmp/Apuntador.app" "/Applications/"

echo "[OK] ¡Apuntador construido e instalado exitosamente!"
echo "[LAUNCH] Abriendo aplicación..."
open "/Applications/Apuntador.app"