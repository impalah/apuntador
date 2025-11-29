# Guía de Configuración: Firma y Notarización para macOS

Esta guía explica cómo configurar la firma de código y notarización automática para distribución de Apuntador en macOS.

## 📋 Requisitos Previos

- ✅ Cuenta activa de Apple Developer Program (99 USD/año)
- ✅ Acceso a macOS (para generar el certificado)
- ✅ Xcode Command Line Tools instalado

## 🔑 Paso 1: Obtener el Certificado Developer ID

### 1.1 Crear Certificate Signing Request (CSR)

En tu Mac:

1. Abre **Acceso a llaveros** (Keychain Access)
2. Ve a **Acceso a llaveros** > **Asistente de Certificado** > **Solicitar un certificado de una autoridad de certificación**
3. Rellena el formulario:
   - **Dirección de correo electrónico**: Tu email de Apple Developer
   - **Nombre común**: Tu nombre o nombre de la empresa
   - **Solicitud**: Selecciona "Guardado en disco"
   - Marca: **"Permitirme especificar información de par de claves"**
4. Haz clic en **Continuar**
5. En la siguiente pantalla:
   - **Tamaño de clave**: 2048 bits
   - **Algoritmo**: RSA
6. Guarda el archivo `CertificateSigningRequest.certSigningRequest`

### 1.2 Crear el Certificado en Apple Developer

1. Ve a [Apple Developer Certificates](https://developer.apple.com/account/resources/certificates/list)
2. Haz clic en el botón **"+"** (Create a Certificate)
3. Selecciona **"Developer ID Application"** (para distribuir fuera del Mac App Store)
4. Haz clic en **Continue**
5. Sube el archivo `.certSigningRequest` que creaste en el paso anterior
6. Haz clic en **Continue**
7. Descarga el archivo `.cer` resultante

### 1.3 Instalar el Certificado en tu Mac

1. Haz doble clic en el archivo `.cer` descargado
2. Se abrirá **Acceso a llaveros** y el certificado se instalará automáticamente
3. Verifica que aparezca en **Mis Certificados** con el nombre "Developer ID Application: TU NOMBRE (TEAM_ID)"

### 1.4 Exportar el Certificado para GitHub Actions

1. En **Acceso a llaveros**, busca el certificado "Developer ID Application"
2. Haz clic derecho sobre el certificado → **Exportar...**
3. Configuración:
   - **Nombre**: `DeveloperID.p12`
   - **Formato de archivo**: Personal Information Exchange (.p12)
4. Haz clic en **Guardar**
5. Se te pedirá una **contraseña** → Crea una contraseña segura y **GUÁRDALA** (la necesitarás después)
6. Se te pedirá la contraseña de tu Mac para permitir la exportación

### 1.5 Convertir a Base64

Abre Terminal y ejecuta:

```bash
# Navega al directorio donde guardaste DeveloperID.p12
cd ~/Downloads

# Convierte el archivo a base64
base64 -i DeveloperID.p12 -o DeveloperID-base64.txt

# Copia el contenido al portapapeles (para pegarlo después en GitHub)
cat DeveloperID-base64.txt | pbcopy

# O si prefieres verlo en pantalla:
cat DeveloperID-base64.txt
```

**IMPORTANTE**: Guarda este archivo base64 de forma segura. Lo necesitarás para configurar GitHub.

## 🔐 Paso 2: Crear App-Specific Password

Este password es necesario para que GitHub Actions pueda enviar la app a Apple para notarización.

1. Ve a [appleid.apple.com](https://appleid.apple.com)
2. Inicia sesión con tu Apple ID (el mismo de tu cuenta de Developer)
3. En la sección **Seguridad**, busca **Contraseñas de app**
4. Haz clic en **Generar contraseña...**
5. Dale un nombre: `Apuntador Notarization` (o el nombre que prefieras)
6. **COPIA Y GUARDA** la contraseña generada (formato: `xxxx-xxxx-xxxx-xxxx`)
   - ⚠️ **Solo se muestra una vez, guárdala en un lugar seguro**

## 🆔 Paso 3: Obtener tu Team ID

### Opción 1: Desde Apple Developer Portal

1. Ve a [developer.apple.com/account](https://developer.apple.com/account)
2. Inicia sesión
3. Tu **Team ID** aparece en la parte superior derecha de la página
4. Es un código de **10 caracteres alfanuméricos** (ejemplo: `A1B2C3D4E5`)

### Opción 2: Desde Terminal (si ya tienes certificados instalados)

```bash
security find-identity -v -p codesigning | grep "Developer ID Application"
```

Busca algo como:
```
1) ABC123XYZ "Developer ID Application: Tu Nombre (A1B2C3D4E5)"
```

Los 10 caracteres entre paréntesis (`A1B2C3D4E5`) son tu **TEAM_ID**.

## 🔧 Paso 4: Configurar Secrets en GitHub

Ve a tu repositorio en GitHub:

**Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Crea los siguientes **5 secrets**:

### 1. `APPLE_CERTIFICATE_BASE64`
- **Valor**: Pega el contenido completo del archivo `DeveloperID-base64.txt`
- Este es el certificado Developer ID exportado en formato base64

### 2. `APPLE_CERTIFICATE_PASSWORD`
- **Valor**: La contraseña que usaste al exportar el certificado `.p12`
- Es la contraseña que creaste en el paso 1.4

### 3. `APPLE_ID`
- **Valor**: Tu email de Apple Developer
- Ejemplo: `tu@email.com`
- Debe ser el email asociado a tu cuenta de Apple Developer

### 4. `APPLE_APP_SPECIFIC_PASSWORD`
- **Valor**: La contraseña de app que generaste en el paso 2
- Formato: `xxxx-xxxx-xxxx-xxxx`

### 5. `APPLE_TEAM_ID`
- **Valor**: Tu Team ID de 10 caracteres
- Ejemplo: `A1B2C3D4E5`
- El que obtuviste en el paso 3

## ✅ Verificación de Configuración

Una vez configurados todos los secrets, puedes verificar que estén correctos:

1. Ve a **Settings** → **Secrets and variables** → **Actions**
2. Deberías ver estos 5 secrets listados:
   - `APPLE_CERTIFICATE_BASE64`
   - `APPLE_CERTIFICATE_PASSWORD`
   - `APPLE_ID`
   - `APPLE_APP_SPECIFIC_PASSWORD`
   - `APPLE_TEAM_ID`

## 🚀 Uso del Workflow

Una vez configurados los secrets, el workflow de macOS automáticamente:

1. ✅ Importa el certificado Developer ID
2. ✅ Firma la aplicación con hardened runtime
3. ✅ Crea un ZIP de la aplicación
4. ✅ Envía la aplicación a Apple para notarización
5. ✅ Espera la aprobación (puede tardar 5-30 minutos)
6. ✅ Grapa (staple) el ticket de notarización a la app
7. ✅ Verifica que todo está correcto

El proceso solo se ejecuta para builds de tipo **"release"**.

## 🔍 Verificación Local de la App Notarizada

Después de descargar la app del workflow, puedes verificar que esté correctamente firmada y notarizada:

```bash
# Verificar la firma
codesign -dvv /Applications/Apuntador.app

# Verificar la notarización
spctl -a -vv /Applications/Apuntador.app

# Verificar el ticket grapado
stapler validate /Applications/Apuntador.app
```

Si todo está correcto, deberías ver:
- ✅ Firma válida con tu Developer ID
- ✅ "source=Notarized Developer ID"
- ✅ "The validate action worked!"

## ❓ Troubleshooting

### Error: "Unable to find certificate"
- Verifica que `APPLE_CERTIFICATE_BASE64` esté correctamente copiado (sin saltos de línea extra)
- Asegúrate de que `APPLE_CERTIFICATE_PASSWORD` sea la contraseña correcta del .p12

### Error: "Invalid credentials" durante notarización
- Verifica que `APPLE_ID` sea el email correcto de tu cuenta de Developer
- Asegúrate de que `APPLE_APP_SPECIFIC_PASSWORD` sea una contraseña de app válida (no tu contraseña de iCloud)
- Verifica que `APPLE_TEAM_ID` sea correcto

### Error: "Notarization failed"
- Revisa los logs del workflow para ver el mensaje de error específico de Apple
- Ejecuta `xcrun notarytool log <submission-id>` para ver detalles (el ID aparece en los logs del workflow)

### La app aún muestra advertencia de seguridad
- Asegúrate de que el workflow completó el paso de "stapling" correctamente
- Verifica con `stapler validate` que el ticket esté grapado
- Si descargaste la app antes de que terminara el proceso de notarización, vuelve a descargarla

## ⚡ Nuevo Flujo: Notarización Asíncrona (Recomendado)

Debido a que la notarización de Apple puede tardar **10-90+ minutos** (especialmente en horarios pico), el workflow ahora usa un **proceso asíncrono**:

### Cómo Funciona:

1. **El workflow firma y envía** la app a Apple para notarización
2. **NO espera** la aprobación (evita timeout de GitHub Actions)
3. **Guarda el Submission ID** como artefacto
4. **Continúa** construyendo y subiendo la app firmada

### Verificar Estado Manualmente:

Descarga el archivo `notarization-submission-id-<version>.txt` de los artefactos del workflow y usa el script helper:

```bash
# Configurar variables de entorno
export APPLE_ID='tu@email.com'
export APPLE_APP_SPECIFIC_PASSWORD='xxxx-xxxx-xxxx-xxxx'
export APPLE_TEAM_ID='B9VZ5U9FAZ'

# Leer el submission ID del archivo descargado
SUBMISSION_ID=$(cat notarization-submission-id-*.txt)

# Verificar estado
./scripts/check-notarization-status.sh "$SUBMISSION_ID"
```

### Grapar Ticket Una Vez Aprobado:

Cuando el estado sea "Accepted":

```bash
# Opción 1: Manualmente
xcrun stapler staple /path/to/Apuntador.app
xcrun stapler validate /path/to/Apuntador.app

# Opción 2: Con el script (hace todo automáticamente)
./scripts/check-notarization-status.sh "$SUBMISSION_ID" --staple /path/to/Apuntador.app
```

### Timeline Típico:

- **0-5 min**: Workflow completa (firma + envío + build + upload)
- **5-90 min**: Apple procesa en background (fuera del workflow)
- **Después**: Verificas estado y grapas ticket manualmente

### Ventajas:

- ✅ El workflow NO falla por timeout
- ✅ Más rápido (no espera 90 minutos)
- ✅ Más barato (menos minutos de GitHub Actions)
- ✅ La app FIRMADA está disponible inmediatamente
- ✅ El grapado (stapling) se hace solo cuando Apple aprueba

## 📚 Referencias

- [Apple Developer Documentation - Notarizing macOS Software](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
- [Apple Developer - Code Signing](https://developer.apple.com/support/code-signing/)
- [Tauri Signing Guide](https://tauri.app/v1/guides/distribution/sign-macos)

## 🔒 Seguridad

**IMPORTANTE**:
- ⚠️ Nunca compartas tus secrets de GitHub con nadie
- ⚠️ Nunca subas el archivo `.p12` o el base64 a Git
- ⚠️ Guarda una copia de seguridad del certificado `.p12` en un lugar seguro
- ⚠️ Si comprometes algún secret, revócalo inmediatamente y genera uno nuevo
- ⚠️ El archivo `DeveloperID-base64.txt` debe eliminarse después de copiarlo a GitHub

---

**Última actualización**: Noviembre 2025
