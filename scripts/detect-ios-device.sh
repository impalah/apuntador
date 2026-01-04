#!/bin/bash

# iOS Device Registration Helper
# Automatically detects connected iPhone and provides UDID for registration

set -e

echo "Detecting connected iOS devices..."

# Check if xctrace is available (preferred method for real UDID)
if command -v xcrun xctrace >/dev/null 2>&1; then
    # Get real UDID using xctrace (most reliable method)
    DEVICE_LIST=$(xcrun xctrace list devices 2>/dev/null | grep -E "iPhone|iPad" | grep -v Simulator || echo "")
    
    if [ -n "$DEVICE_LIST" ]; then
        echo "Found iOS devices:"
        echo "$DEVICE_LIST"
        
        # Extract first real UDID (format: 00008XXX-XXXXXXXXXXXX)
        UDID=$(echo "$DEVICE_LIST" | head -1 | grep -oE '\([0-9A-F]{8}-[0-9A-F]{12}\)' | tr -d '()')
        
        if [ -n "$UDID" ]; then
            echo ""
            echo "Real device UDID: $UDID"
            echo ""
            echo "Copy this UDID and register it at:"
            echo "https://developer.apple.com/account/resources/devices/add/"
            echo ""
            echo "After registration, go back to Xcode:"
            echo "   Preferences → Accounts → [Your Apple ID] → Download Manual Profiles"
        fi
    else
        echo "[ERROR] No iOS devices detected via xctrace"
    fi
elif command -v xcrun devicectl >/dev/null 2>&1; then
    # Fallback to devicectl (may show internal ID, not real UDID)
    echo "[WARNING]  Using devicectl (may show internal ID, not real UDID)"
    DEVICE_LIST=$(xcrun devicectl list devices 2>/dev/null || echo "")
    
    if echo "$DEVICE_LIST" | grep -q "iPhone\|iPad"; then
        echo "Found iOS devices:"
        echo "$DEVICE_LIST" | grep -E "iPhone|iPad" | head -5
        
        echo ""
        echo "[WARNING]  Note: devicectl may show internal IDs, not real UDIDs"
        echo "For real UDID, try: xcrun xctrace list devices"
        echo "Or use: Xcode → Window → Devices and Simulators"
    else
        echo "[ERROR] No iOS devices detected via devicectl"
    fi
else
    echo "[WARNING]  devicectl not available, trying legacy method..."
    
    # Fallback to instruments (older method)
    if command -v instruments >/dev/null 2>&1; then
        DEVICE_LIST=$(instruments -s devices 2>/dev/null | grep -v "Simulator" || echo "")
        
        if echo "$DEVICE_LIST" | grep -q "iPhone\|iPad"; then
            echo "Found iOS devices:"
            echo "$DEVICE_LIST" | grep -E "iPhone|iPad"
            
            UDID=$(echo "$DEVICE_LIST" | grep -E "iPhone|iPad" | head -1 | grep -oE '\[[A-F0-9-]{36}\]' | tr -d '[]')
            
            if [ -n "$UDID" ]; then
                echo ""
                echo "First device UDID: $UDID"
                echo ""
                echo "Copy this UDID and register it at:"
                echo "https://developer.apple.com/account/resources/devices/add/"
            fi
        else
            echo "[ERROR] No iOS devices detected via instruments"
        fi
    fi
fi

# If no devices found, provide manual instructions
if [ -z "$UDID" ]; then
    echo ""
    echo "[PLUGIN] No iOS devices detected. To fix:"
    echo ""
    echo "1. Connect your iPhone/iPad via USB cable"
    echo "2. Unlock device and trust this computer when prompted"
    echo "3. Run this script again"
    echo ""
    echo "Alternative: Open Xcode → Window → Devices and Simulators"
    echo "   Your device should appear there with its UDID"
    echo ""
    echo "Manual registration:"
    echo "   https://developer.apple.com/account/resources/devices/list"
fi

echo ""
echo "For complete troubleshooting guide:"
echo "   docs/IOS_SIGNING_ERRORS.md"