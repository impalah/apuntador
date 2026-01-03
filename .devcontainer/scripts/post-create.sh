#!/bin/bash
set -e

echo "[PACKAGE] Installing project dependencies..."

# Install Node.js dependencies
npm install

# Install Rust dependencies (build cache for faster subsequent builds)
echo "🦀 Pre-building Rust dependencies..."
cd src-tauri
cargo fetch
cd ..

# Sync Capacitor
echo "[FAST] Syncing Capacitor..."
npx cap sync || echo "[WARNING]  Capacitor sync failed (expected if not yet configured)"

echo "[OK] Post-create setup completed!"
echo ""
echo "[LAUNCH] Development environment ready!"
echo ""
echo "Available commands:"
echo "  npm run dev              - Start Vite dev server"
echo "  npm run tauri dev        - Start Tauri desktop app"
echo "  npm run android:dev      - Start Android development"
echo "  ionic serve              - Start Ionic dev server"
echo "  npx cap open android     - Open Android Studio"
echo "  cargo build              - Build Rust code"
echo ""
