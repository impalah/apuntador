# Configuración nativa en macOS (sin devcontainer)

Guía paso a paso para compilar Apuntador para **Android** e **iOS** directamente en macOS, sin usar el devcontainer (Docker/Colima). Para el flujo con devcontainer, ver `.devcontainer/MACOS_SETUP.md` y `.devcontainer/PLATFORM_NOTES.md`.

Comprobado y ejecutado en este equipo el 2026-07-24. Arquitectura: Apple Silicon (`arm64`), Homebrew en `/opt/homebrew`.

## Resumen de requisitos

| Herramienta                 | Para qué                                | Versión usada por el proyecto                                                                    |
| --------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Node.js                     | Todo (web/Android/iOS)                  | `>=22` (`package.json` → `engines`)                                                              |
| Homebrew                    | Instalar el resto                       | —                                                                                                |
| JDK 17                      | Compilar Android (Gradle)               | Fijado en `npm run android:release` (`JAVA_HOME=/opt/homebrew/opt/openjdk@17`)                   |
| Android SDK (cmdline-tools) | Compilar Android                        | `compileSdkVersion 36`, `targetSdkVersion 35`, `build-tools;35.0.0` (`android/variables.gradle`) |
| Gradle                      | Compilar Android                        | `8.13` — se descarga solo vía `android/gradlew`, no hace falta instalarlo aparte                 |
| Xcode + Command Line Tools  | Compilar iOS                            | Requiere macOS nativo, Xcode no funciona en Linux/devcontainer                                   |
| Ruby ≥ 3.0 (vía rbenv)      | Requisito de CocoaPods                  | El Ruby del sistema en macOS es `2.6.10`, insuficiente                                           |
| CocoaPods (`pod`)           | Dependencias nativas de iOS (Capacitor) | —                                                                                                |

---

## 1. Homebrew

Si no lo tienes:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew --version
```

## 2. JDK 17 (para Android)

```bash
brew install openjdk@17
```

`openjdk@17` es "keg-only" (no se enlaza automáticamente en `/opt/homebrew`) porque puede convivir con otras versiones de Java. Lo apuntamos directamente por ruta en las variables de entorno (paso 5), no hace falta el symlink de `sudo` que sugiere Homebrew.

## 3. Android SDK (command line tools)

Instalación ligera, sin Android Studio:

```bash
brew install --cask android-commandlinetools
```

Esto instala el SDK en `/opt/homebrew/share/android-commandlinetools` y enlaza binarios (`sdkmanager`, `adb` vendrá con `platform-tools`) en `/opt/homebrew/bin`.

Acepta las licencias (necesita el JDK del paso 2 en el `PATH`):

```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@17
export PATH="$JAVA_HOME/bin:$PATH"
export ANDROID_HOME=/opt/homebrew/share/android-commandlinetools

yes | sdkmanager --sdk_root="$ANDROID_HOME" --licenses
```

Instala los paquetes que usa el proyecto (`android/variables.gradle`):

```bash
sdkmanager --sdk_root="$ANDROID_HOME" \
  "platform-tools" \
  "platforms;android-36" \
  "build-tools;35.0.0"
```

> Si en el futuro el proyecto sube `compileSdkVersion`/`targetSdkVersion` en `android/variables.gradle`, instala el `platforms;android-XX` correspondiente con el mismo comando.

**Nota**: no hace falta instalar Gradle con Homebrew. El proyecto usa el wrapper `android/gradlew`, que descarga automáticamente la versión fijada en `android/gradle/wrapper/gradle-wrapper.properties` (actualmente `8.13`) la primera vez que se ejecuta.

## 4. Variables de entorno permanentes

Añade esto a `~/.zshrc` (shell por defecto en macOS):

```bash
# --- Apuntador: Android/iOS native build tooling ---
export JAVA_HOME="/opt/homebrew/opt/openjdk@17"
export ANDROID_HOME="/opt/homebrew/share/android-commandlinetools"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
# --- end Apuntador ---
```

Aplica los cambios:

```bash
source ~/.zshrc
```

Verifica:

```bash
java -version      # openjdk 17.x
adb --version       # Android Debug Bridge 1.0.x
echo $ANDROID_HOME  # /opt/homebrew/share/android-commandlinetools
```

## 5. Xcode (para iOS)

Solo funciona en macOS nativo — instálalo desde la App Store (no vía Homebrew, salvo Command Line Tools).

```bash
# Command Line Tools (si Xcode completo no está instalado aún)
xcode-select --install

# Verificar
xcode-select -p
xcodebuild -version
```

Si tienes Xcode completo desde la App Store, acepta la licencia una vez:

```bash
sudo xcodebuild -license accept
```

## 6. Ruby 3.x vía rbenv (requisito de CocoaPods)

**Importante**: no uses `brew install ruby` — puede instalar una versión 4.x inestable. Usa `rbenv` para fijar una versión estable 3.x, como recomienda `.devcontainer/MACOS_SETUP.md`.

```bash
brew install rbenv ruby-build
```

Añade rbenv a `~/.zshrc`:

```bash
# --- Apuntador: rbenv (Ruby version manager, needed for CocoaPods) ---
eval "$(rbenv init - zsh)"
# --- end Apuntador rbenv ---
```

```bash
source ~/.zshrc

rbenv install 3.3.6
rbenv global 3.3.6
rbenv rehash

ruby --version   # ruby 3.3.6 ...
which ruby       # ~/.rbenv/shims/ruby
```

## 7. CocoaPods

Con Ruby 3.3.6 ya activo (`rbenv global 3.3.6`):

```bash
gem install cocoapods
rbenv rehash

pod --version    # 1.17.0 (o superior)
which pod         # ~/.rbenv/shims/pod
```

---

## Verificación completa

Con una terminal nueva (para que `~/.zshrc` se cargue), ejecuta:

```bash
java -version
adb --version
sdkmanager --sdk_root="$ANDROID_HOME" --list_installed
ruby --version
pod --version
xcodebuild -version
```

Y contra el proyecto real:

```bash
cd /Users/linus/Projects/apuntador/android
./gradlew --version   # Debe mostrar Gradle 8.13, Launcher JVM 17.x
```

---

## Compilar el proyecto

### Android

```bash
# Sincronizar cambios web -> Android
npm run android:build      # build web + cap copy + cap sync

# APK debug
cd android && ./gradlew assembleDebug

# APK/AAB release (requiere keystore configurado, ver dev_docs/SCRIPTS_REFERENCE.md)
npm run android:release
```

### iOS

Antes de la primera compilación, instala los pods del proyecto:

```bash
npm run ios:build          # build web + cap copy + cap sync (incluye pod install)
npx cap open ios           # abre en Xcode para compilar/firmar
```

Si necesitas instalar/actualizar pods manualmente:

```bash
cd ios/App
pod install
```

---

## Notas y limitaciones

- **iOS solo se puede compilar en macOS nativo** — Xcode no funciona en Linux ni en el devcontainer. Esto ya lo cubre este setup, al no usar devcontainer.
- Los scripts `scripts/setup-ios.sh` y `.devcontainer/MACOS_SETUP.md` asumen un flujo híbrido (devcontainer + macOS nativo para iOS); esta guía cubre el caso de trabajar **100% nativo**, tanto para Android como para iOS.
- Si `android/variables.gradle` cambia sus versiones de SDK/build-tools en el futuro, vuelve a ejecutar `sdkmanager` con los nuevos valores (paso 3).
- No se ha instalado Rust/Cargo en esta guía porque no se pidió compilar el target de escritorio (Tauri). Si lo necesitas, instala vía `rustup` (`https://rustup.rs`).
