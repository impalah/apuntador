#!/bin/bash
# Script to test Desktop enrollment on macOS

echo "Testing Desktop mTLS Enrollment"
echo "=================================="
echo ""

# 1. Iniciar backend en segundo plano (si no está corriendo)
echo "Checking if backend is running..."
if ! curl -s http://localhost:8000/health > /dev/null 2>&1; then
    if curl -s https://apuntador.ngrok.app/health > /dev/null 2>&1; then
        echo "Backend is running on ngrok"
        BACKEND_URL="https://apuntador.ngrok.app"
    else
        echo "[ERROR] Backend is not running. Please start it first:"
        echo "   cd ../apuntador-backend"
        echo "   uvicorn apuntador.main:app --reload"
        exit 1
    fi
else
    echo "Backend is running on localhost"
    BACKEND_URL="http://localhost:8000"
fi

echo ""
echo "Device Information:"
ioreg -rd1 -c IOPlatformExpertDevice | grep IOPlatformUUID || echo "Could not get UUID"
sw_vers
echo ""

# 2. Compilar y ejecutar la app Tauri
echo "🔨 Building Tauri app..."
npm run tauri build --debug

echo ""
echo "Launching Tauri app..."
echo "   The app will attempt to enroll automatically"
echo "   Check the console logs for enrollment status"
echo ""

npm run tauri dev
