# Makefile for Apuntador development

.PHONY: install dev build preview lint format stylelint typecheck test test-e2e coverage clean docs docs-api docs-dev docs-build docs-serve android-setup android-build android-release android-apk android-debug android-clean android-keystore-base64 tauri-dev tauri-build tauri-build-win tauri-build-release

install:
	npm install

dev:
	npm run dev

build:
	npm run build

preview:
	npm run preview

lint:
	npm run lint

format:
	npm run format

stylelint:
	npm run stylelint

typecheck:
	npm run typecheck

test:
	npm run test

test-e2e:
	npm run test:e2e

coverage:
	npm run coverage

# Documentation targets
docs-api:
	npm run docs:api

docs-dev:
	npm run docs:dev

docs-build:
	npm run docs:build

docs-serve:
	npm run docs:serve

docs: docs-api docs-build

# Android targets
android-setup:
	@echo "🤖 Setting up Android environment..."
	npx cap add android
	npx cap copy android
	npx cap sync android

android-build: build
	@echo "📱 Building Android project..."
	npx cap copy android
	npx cap sync android

android-release: android-build
	@echo "🔐 Building signed release APK..."
	cd android && ./gradlew assembleRelease
	@echo "✅ APK built: android/app/build/outputs/apk/release/apuntador.apk"

android-apk: android-build
	@echo "📱 Building APK with custom name..."
ifeq ($(OS),Windows_NT)
	powershell -ExecutionPolicy Bypass -File build-android-apk.ps1
else
	./build-android-apk.sh
endif

android-debug: android-build
	@echo "🐛 Building debug APK..."
	cd android && ./gradlew assembleDebug
	@echo "✅ Debug APK built: android/app/build/outputs/apk/debug/app-debug.apk"

android-clean:
	@echo "🧹 Cleaning Android build..."
	cd android && ./gradlew clean

android-keystore-base64:
	@echo "🔐 Generating Base64 for GitHub Secrets..."
ifeq ($(OS),Windows_NT)
	powershell -ExecutionPolicy Bypass -File "Generate-Keystore-Base64.ps1"
else
	@if [ -f "android/app/apuntador-release-key.keystore" ]; then \
		./generate-keystore-base64.sh; \
	else \
		echo "❌ Keystore not found. Run 'make android-release' first."; \
	fi
endif

clean:
	rm -rf node_modules dist coverage test-results playwright-report .nyc_output docs/api docs/.vitepress/dist
	npm cache clean --force

clean-all: clean android-clean
	rm -f package-lock.json
	
clean-generated:
	rm -rf dist coverage test-results playwright-report docs/api docs/.vitepress/dist
	
clean-deps:
	rm -rf node_modules package-lock.json
	npm cache clean --force

# Tauri desktop targets
tauri-dev:
	@echo "🖥️  Starting Tauri development server..."
	npm run tauri:dev

tauri-build:
	@echo "🏗️  Building Tauri application..."
	npm run tauri:build

tauri-build-win:
	@echo "🖥️  Building Tauri for Windows..."
	npm run tauri:build:win

tauri-build-release:
	@echo "🚀 Building Apuntador Windows Release..."
ifeq ($(OS),Windows_NT)
	powershell -ExecutionPolicy Bypass -File "build-windows-release.ps1"
else
	@echo "❌ Windows build only supported on Windows"
endif
