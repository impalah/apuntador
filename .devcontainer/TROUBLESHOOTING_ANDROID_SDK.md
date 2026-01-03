# [BUG] Troubleshooting: Android SDK Installation Failures

## Error: "Could not open '/lib64/ld-linux-x86-64.so.2'" al ejecutar `adb`

### Síntoma

```bash
$ adb devices
qemu-x86_64: Could not open '/lib64/ld-linux-x86-64.so.2': No such file or directory
```

### Causa

El devcontainer está corriendo en arquitectura **ARM64** pero Android SDK solo proporciona binarios compilados para **x86-64**. El sistema necesita bibliotecas de compatibilidad para ejecutar binarios x86-64 mediante emulación QEMU.

### Solución Automática (Ya Implementada)

**Desde la versión actual**, el script `on-create.sh` detecta automáticamente si el contenedor está en ARM64 e instala las bibliotecas necesarias:

```bash
# El script detecta:
- Arquitectura ARM64
- Habilita soporte multi-arch (amd64)
- Instala libc6:amd64, libstdc++6:amd64, zlib1g:amd64
```

Si tienes un contenedor viejo (creado antes de este fix), reconstruye:

```bash
# En VS Code:
# Cmd+Shift+P → "Dev Containers: Rebuild Container"
```

### Solución Manual (Si el automático falla)

```bash
# Dentro del devcontainer:
sudo dpkg --add-architecture amd64
sudo apt-get update
sudo apt-get install -y libc6:amd64 libstdc++6:amd64 zlib1g:amd64

# Verifica que funcione:
adb --version
```

---

## Error: "Connection refused" durante instalación de Android SDK

### Síntoma

```
Warning: An error occurred while preparing SDK package Android SDK Build-Tools 34: Connection refused.
onCreateCommand from devcontainer.json failed with exit code 1.
```

---

## Soluciones

### Solución 1: Reintentar la Construcción del Container

El error puede ser temporal debido a problemas de red o timeouts.

```bash
# En VS Code:
# Cmd+Shift+P → "Dev Containers: Rebuild Container"
```

El script actualizado ahora:

- [OK] Reintenta la descarga hasta 3 veces
- [OK] Espera 5 segundos entre reintentos
- [OK] Continúa aunque falle algún componente

---

### Solución 2: Saltar la Instalación de Android SDK

Si el problema persiste, puedes crear el container **sin** Android SDK y añadirlo después:

**Opción A: Variable de entorno temporal**

1. Editar [.devcontainer/devcontainer.json](.devcontainer/devcontainer.json)
2. Añadir temporalmente:

```json
{
  "containerEnv": {
    "SKIP_ANDROID": "true"
  }
}
```

3. Rebuild container: Cmd+Shift+P → "Dev Containers: Rebuild Container"

4. Una vez dentro del container, instalar Android SDK manualmente:

```bash
# Dentro del container
bash .devcontainer/scripts/install-android-sdk.sh
```

**Opción B: Comentar la sección de Android en on-create.sh**

1. Editar [.devcontainer/scripts/on-create.sh](.devcontainer/scripts/on-create.sh)
2. Comentar la sección de Android SDK (líneas ~30-90)
3. Rebuild container

---

### Solución 3: Verificar Conectividad de Red

El problema puede ser de conectividad entre el container y los servidores de Google.

**Diagnóstico**:

```bash
# En tu Mac (fuera del container)
# Verificar que Colima tiene acceso a internet
docker run --rm alpine ping -c 3 google.com

# Si falla, reiniciar Colima
colima stop
colima start --cpu 8 --memory 16 --disk 100
```

**Posibles causas**:

- Firewall bloqueando el container
- VPN interfiriendo con Docker
- Proxy corporativo

---

### Solución 4: Usar Docker Desktop en lugar de Colima

Si Colima tiene problemas de red persistentes:

```bash
# Detener Colima
colima stop

# Instalar Docker Desktop
brew install --cask docker

# Abrir Docker Desktop y dejarlo correr
# Luego rebuild el container en VS Code
```

---

### Solución 5: Instalar Android SDK Después Manualmente

Si ninguna solución funciona, puedes desarrollar sin Android inicialmente:

**Desarrollo sin Android SDK**:

- [OK] Desarrollo web (Vue/Vite)
- [OK] Desarrollo Tauri (Rust)
- [WARNING] Sin builds Android (puedes añadirlo después)

**Instalar Android SDK después** (dentro del container):

```bash
# Conectar al container en ejecución
# Desde terminal de VS Code (dentro del container):

# 1. Descargar Android Command Line Tools
ANDROID_SDK_ROOT=/home/node/Android/Sdk
mkdir -p ${ANDROID_SDK_ROOT}/cmdline-tools
wget https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O /tmp/cmdline-tools.zip

# 2. Extraer
unzip /tmp/cmdline-tools.zip -d /tmp/cmdline-tools
mv /tmp/cmdline-tools/cmdline-tools ${ANDROID_SDK_ROOT}/cmdline-tools/latest

# 3. Añadir al PATH
export PATH=${ANDROID_SDK_ROOT}/cmdline-tools/latest/bin:${ANDROID_SDK_ROOT}/platform-tools:$PATH

# 4. Aceptar licencias
yes | sdkmanager --licenses

# 5. Instalar componentes
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
```

---

## Verificación

Después de cualquier solución, verifica:

```bash
# Dentro del container
echo $ANDROID_SDK_ROOT
# Debe mostrar: /home/node/Android/Sdk

ls -la $ANDROID_SDK_ROOT
# Debe mostrar: cmdline-tools, platform-tools, platforms, build-tools

adb --version
# Debe mostrar la versión de ADB
```

---

## Prevención Futura

### Script de Instalación Manual

He actualizado el script on-create.sh para que:

1. [OK] Verifique conectividad antes de descargar
2. [OK] Reintente hasta 3 veces cada componente
3. [OK] Continúe aunque falle (no bloquee la creación del container)
4. [OK] Soporte la variable `SKIP_ANDROID=true`

### Alternativa: Desarrollo Web Primero

Si no necesitas Android inmediatamente:

1. Crear container sin Android (con `SKIP_ANDROID=true`)
2. Desarrollar la parte web/Tauri
3. Cuando necesites Android, instalarlo manualmente o rebuild sin `SKIP_ANDROID`

---

## Logs Detallados

Para ver exactamente qué falla:

```bash
# En VS Code, después de que falle:
# 1. Ver → Output
# 2. Seleccionar "Dev Containers" en el dropdown
# 3. Buscar la línea con el error específico

# O revisar logs de Docker:
docker logs <container_id>
```

---

## Contacto y Ayuda

Si ninguna solución funciona:

1. **Revisar logs completos**: VS Code → Output → Dev Containers
2. **Verificar versión de Docker**: `docker --version`
3. **Verificar versión de Colima**: `colima version`
4. **Reportar el error específico** con:
   - Mensaje de error completo
   - Sistema operativo y versión
   - Docker runtime (Colima vs Docker Desktop)
   - Si estás detrás de proxy/VPN

---

## Enlaces Útiles

- [Android SDK Command Line Tools](https://developer.android.com/studio/command-line)
- [Colima Networking](https://github.com/abiosoft/colima/blob/main/docs/networking.md)
- [VS Code Dev Containers Troubleshooting](https://code.visualstudio.com/docs/devcontainers/troubleshooting)
