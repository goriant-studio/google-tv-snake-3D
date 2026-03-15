#!/bin/bash
# ============================================
# Snake 3D — Android TV Build Script
# ============================================
# Usage:
#   ./build.sh          # Build debug APK
#   ./build.sh release  # Build release APK
#   ./build.sh install  # Build + install on connected device
#   ./build.sh sync     # Sync web assets from root to android/assets/www

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ASSETS_DIR="$SCRIPT_DIR/app/src/main/assets/www"

# ============================================
# Sync web game assets
# ============================================
sync_assets() {
    echo "📦 Syncing web game assets..."
    rm -rf "$ASSETS_DIR"
    mkdir -p "$ASSETS_DIR"
    
    # Copy game files (exclude sender and android-specific files)
    cp "$REPO_ROOT/index.html" "$ASSETS_DIR/"
    cp -r "$REPO_ROOT/css" "$ASSETS_DIR/"
    cp -r "$REPO_ROOT/js" "$ASSETS_DIR/"
    
    # Remove sender files (not needed in Android app)
    rm -f "$ASSETS_DIR/js/sender.js"
    
    echo "✅ Assets synced!"
}

# ============================================
# Build
# ============================================
case "${1:-debug}" in
    "sync")
        sync_assets
        ;;
    "debug")
        sync_assets
        echo "🔨 Building debug APK..."
        cd "$SCRIPT_DIR"
        ./gradlew assembleDebug
        echo ""
        echo "✅ Debug APK: app/build/outputs/apk/debug/app-debug.apk"
        ;;
    "release")
        sync_assets
        echo "🔨 Building release APK..."
        cd "$SCRIPT_DIR"
        ./gradlew assembleRelease
        echo ""
        echo "✅ Release APK: app/build/outputs/apk/release/app-release.apk"
        ;;
    "install")
        sync_assets
        echo "🔨 Building and installing..."
        cd "$SCRIPT_DIR"
        ./gradlew installDebug
        echo ""
        echo "✅ Installed on device!"
        echo "🎮 Launching Snake 3D..."
        adb shell am start -n com.goriant.snake3d/.MainActivity
        ;;
    *)
        echo "Usage: ./build.sh [debug|release|install|sync]"
        ;;
esac
