# Guía para Publicar Apuntador en Winget

Esta guía explica cómo publicar y actualizar Apuntador en el repositorio oficial de Winget ([microsoft/winget-pkgs](https://github.com/microsoft/winget-pkgs)).

## [LIST] Tabla de Contenidos

1. [Prerequisitos](#prerequisitos)
2. [Primera Publicación](#primera-publicación)
3. [Actualizar Versión Existente](#actualizar-versión-existente)
4. [Automatización con el Workflow](#automatización-con-el-workflow)
5. [Solución de Problemas](#solución-de-problemas)
6. [Verificación Post-Publicación](#verificación-post-publicación)

---

## Prerequisitos

### Cuenta de GitHub
- [OK] Cuenta de GitHub activa
- [OK] Two-factor authentication (2FA) habilitada

### Herramientas Locales (Opcional)
```powershell
# Instalar wingetcreate (automatiza el proceso)
winget install Microsoft.WingetCreate
```

### Información Necesaria
Los manifests se generan automáticamente por el workflow `build-windows-desktop.yml`, pero necesitas:
- [OK] Versión del release (ej: `1.1.76`)
- [OK] URL pública del MSI (ej: `https://apuntador.io/downloads/apuntador-1.1.76-windows-x64-installer.msi`)

---

## Primera Publicación

### Paso 1: Ejecutar Build de Windows

1. Ve a **Actions** → **Build Windows Desktop**
2. Haz clic en **Run workflow**
3. Configura:
   ```
   release_tag: 1.1.76
   buildType: release
   generateInstallers: true
   environment: pro  ← Importante: usar 'pro' para Winget
   ```
4. Espera a que termine el workflow (~15-20 minutos)

### Paso 2: Descargar Manifests de Winget

1. En el workflow completado, ve a **Artifacts**
2. Descarga: `winget-manifests-1.1.76.zip`
3. Extrae el ZIP - contiene 3 archivos:
   ```
   Apuntador.Apuntador.yaml
   Apuntador.Apuntador.installer.yaml
   Apuntador.Apuntador.locale.en-US.yaml
   ```

### Paso 3: Fork del Repositorio Winget

1. Ve a [microsoft/winget-pkgs](https://github.com/microsoft/winget-pkgs)
2. Haz clic en **Fork** (esquina superior derecha)
3. Espera a que se complete el fork (~1 minuto)

### Paso 4: Crear la Estructura de Carpetas

En tu fork, navega a la carpeta `manifests/` y crea:

```
manifests/
  a/                          ← Primera letra del publisher
    Apuntador/                ← Nombre del publisher
      Apuntador/              ← Nombre del paquete
        1.1.76/               ← Versión específica
```

**Importante:** La estructura es sensible a mayúsculas/minúsculas.

#### Opción A: Vía Web (GitHub.com)

1. En tu fork, navega a `manifests/`
2. Haz clic en **Add file** → **Create new file**
3. Escribe la ruta completa:
   ```
   a/Apuntador/Apuntador/1.1.76/Apuntador.Apuntador.yaml
   ```
4. GitHub creará automáticamente las carpetas
5. Pega el contenido del archivo `Apuntador.Apuntador.yaml`
6. Haz clic en **Commit new file**
7. Repite para los otros 2 archivos:
   - `a/Apuntador/Apuntador/1.1.76/Apuntador.Apuntador.installer.yaml`
   - `a/Apuntador/Apuntador/1.1.76/Apuntador.Apuntador.locale.en-US.yaml`

#### Opción B: Vía Git Local

```bash
# Clonar tu fork
git clone https://github.com/TU-USUARIO/winget-pkgs.git
cd winget-pkgs

# Crear estructura de carpetas
mkdir -p manifests/a/Apuntador/Apuntador/1.1.76

# Copiar los 3 archivos descargados
cp ~/Downloads/winget-manifests-1.1.76/*.yaml manifests/a/Apuntador/Apuntador/1.1.76/

# Verificar que los archivos están correctos
ls -la manifests/a/Apuntador/Apuntador/1.1.76/

# Deberías ver:
# Apuntador.Apuntador.yaml
# Apuntador.Apuntador.installer.yaml
# Apuntador.Apuntador.locale.en-US.yaml

# Commit y push
git add manifests/a/Apuntador/Apuntador/1.1.76/
git commit -m "New package: Apuntador.Apuntador version 1.1.76"
git push origin main
```

### Paso 5: Crear Pull Request

1. Ve a tu fork en GitHub
2. Verás un banner: **"This branch is 1 commit ahead of microsoft:main"**
3. Haz clic en **Contribute** → **Open pull request**
4. Título del PR:
   ```
   New package: Apuntador.Apuntador version 1.1.76
   ```
5. Descripción:
   ```markdown
   ## Apuntador - Professional Teleprompter
   
   First submission of Apuntador to Winget.
   
   - Open source teleprompter application
   - Built with Tauri v2
   - MIT License
   - Homepage: https://apuntador.io
   - GitHub: https://github.com/impalah/apuntador
   
   ---
   
   **Checklist:**
   - [x] CLA signed at https://cla.opensource.microsoft.com/microsoft/winget-pkgs
   - [x] No linked issue (new package submission)
   - [x] No other open PRs for this package (verified)
   - [x] Only modifies one manifest (Apuntador.Apuntador v1.1.76)
   - [x] Manifests generated from official Tauri build
   - [x] Conforms to schema 1.6.0
   ```
6. Haz clic en **Create pull request**

### Paso 5.1: Firmar el CLA (Solo Primera Vez)

Cuando crees el PR, un bot te pedirá firmar el **Contributor License Agreement (CLA)**:

1. El bot comentará en tu PR con un enlace
2. Haz clic en el enlace: https://cla.opensource.microsoft.com/microsoft/winget-pkgs
3. Firma con tu cuenta de GitHub
4. El bot actualizará el PR automáticamente como "[OK] CLA signed"

**Importante:** Solo necesitas hacer esto **una vez**. Futuras contribuciones no requerirán firmar de nuevo.

### Paso 6: Esperar Validación Automática

Microsoft tiene bots que validan automáticamente:

**Validaciones que se ejecutan (~2-5 minutos):**
- [OK] Formato YAML correcto
- [OK] SHA256 del MSI coincide
- [OK] URL del instalador es accesible
- [OK] ProductCode es válido
- [OK] Versión sigue formato semántico

**Posibles resultados:**

#### [OK] Success (Todo OK)
```
✓ Azure Pipelines — All checks passed
✓ Validation - PASS
```
→ El PR será **aprobado y mergeado automáticamente** en 24-48h

#### [ERROR] Failure (Hay errores)
```
✗ Azure Pipelines — Checks failed
✗ Validation - FAILED
```
→ Revisa los logs de error y corrige

**Errores comunes:**
- **SHA256 mismatch**: El hash no coincide → Regenera manifests
- **URL not accessible**: El MSI no está público → Verifica permisos S3
- **Invalid YAML**: Formato incorrecto → Revisa indentación

### Paso 7: Aprobación y Merge

- **Automático**: Si todas las validaciones pasan, Microsoft merge automáticamente en 24-48h
- **Manual**: Algunos PRs requieren revisión humana (primera vez puede tardar 2-3 días)

**Notificación:**
Recibirás un email cuando el PR sea mergeado:
```
[OK] Your pull request has been merged!
   Apuntador.Apuntador is now available in Winget.
```

### Paso 8: Verificar que Funciona

Una vez mergeado (puede tardar hasta 1 hora en propagarse):

```powershell
# Buscar el paquete
winget search Apuntador

# Resultado esperado:
# Name       Id                  Publisher  Version
# --------------------------------------------------------
# Apuntador  Apuntador.Apuntador Apuntador  1.1.76

# Probar instalación
winget install Apuntador.Apuntador

# Ver información del paquete
winget show Apuntador.Apuntador
```

---

## Actualizar Versión Existente

Una vez publicado, actualizar es **mucho más simple**.

### Paso 1: Ejecutar Build de Nueva Versión

1. **Actions** → **Build Windows Desktop**
2. Configura nueva versión:
   ```
   release_tag: 1.1.77
   buildType: release
   generateInstallers: true
   environment: pro
   ```
3. Descarga el artefacto: `winget-manifests-1.1.77.zip`

### Paso 2: Crear Nueva Carpeta de Versión

En tu fork (o crear nuevo fork si lo borraste):

```bash
# Actualizar fork (importante: sincronizar con upstream)
git clone https://github.com/TU-USUARIO/winget-pkgs.git
cd winget-pkgs

# Sincronizar con microsoft/winget-pkgs
git remote add upstream https://github.com/microsoft/winget-pkgs.git
git fetch upstream
git merge upstream/main

# Crear nueva carpeta de versión
mkdir -p manifests/a/Apuntador/Apuntador/1.1.77

# Copiar los nuevos manifests
cp ~/Downloads/winget-manifests-1.1.77/*.yaml manifests/a/Apuntador/Apuntador/1.1.77/

# Commit y push
git add manifests/a/Apuntador/Apuntador/1.1.77/
git commit -m "Update: Apuntador.Apuntador version 1.1.77"
git push origin main
```

### Paso 3: Crear Pull Request de Actualización

1. **Contribute** → **Open pull request**
2. Título:
   ```
   Update: Apuntador.Apuntador version 1.1.77
   ```
3. **Create pull request**

### Paso 4: Aprobación (Más Rápida)

Las actualizaciones suelen ser **auto-aprobadas en pocas horas** si:
- [OK] Las validaciones pasan
- [OK] Solo cambia la versión
- [OK] El publisher es el mismo

---

## Automatización con el Workflow

El workflow `build-windows-desktop.yml` **genera automáticamente** los manifests con:
- [OK] SHA256 calculado del MSI real
- [OK] ProductCode extraído del MSI
- [OK] URLs correctas según el environment
- [OK] Versión desde el `release_tag`

### Qué hace automáticamente:

```yaml
Generate Winget Manifests:
  - Calcula SHA256 del MSI generado
  - Extrae ProductCode del MSI con WindowsInstaller COM
  - Genera 3 archivos YAML con datos correctos
  - Sube como artefacto de GitHub Actions (90 días de retención)
```

### Qué debes hacer manualmente:

1. ⏬ Descargar artefacto `winget-manifests-X.X.X`
2. 📤 Subirlo al repositorio microsoft/winget-pkgs
3. [REFRESH] Crear Pull Request

**Tiempo total:** ~5 minutos por release

---

## Solución de Problemas

### Error: "SHA256 hash mismatch"

**Causa:** El hash en el manifest no coincide con el MSI descargado.

**Solución:**
```powershell
# Descargar el MSI público
Invoke-WebRequest -Uri "https://apuntador.io/downloads/apuntador-1.1.76-windows-x64-installer.msi" -OutFile "temp.msi"

# Calcular hash real
Get-FileHash -Path "temp.msi" -Algorithm SHA256

# Actualizar en Apuntador.Apuntador.installer.yaml:
InstallerSha256: <NUEVO_HASH>
```

### Error: "URL not accessible"

**Causa:** El MSI no es público o la URL es incorrecta.

**Solución:**
1. Verifica que el archivo existe:
   ```
   https://apuntador.io/downloads/apuntador-1.1.76-windows-x64-installer.msi
   ```
2. Prueba descargarlo en navegador
3. Verifica permisos S3 (debe ser `public-read`)

### Error: "Invalid ProductCode"

**Causa:** El GUID no tiene el formato correcto.

**Formato válido:**
```yaml
ProductCode: '{12345678-1234-1234-1234-123456789012}'
```

**Solución:**
```powershell
# Extraer ProductCode correcto del MSI
$installer = New-Object -ComObject WindowsInstaller.Installer
$database = $installer.GetType().InvokeMember("OpenDatabase", "InvokeMethod", $null, $installer, @("path\to\file.msi", 0))
$view = $database.GetType().InvokeMember("OpenView", "InvokeMethod", $null, $database, ("SELECT Value FROM Property WHERE Property='ProductCode'"))
$view.GetType().InvokeMember("Execute", "InvokeMethod", $null, $view, $null)
$record = $view.GetType().InvokeMember("Fetch", "InvokeMethod", $null, $view, $null)
$productCode = $record.GetType().InvokeMember("StringData", "GetProperty", $null, $record, 1)
Write-Host $productCode
```

### Error: "YAML format error"

**Causa:** Indentación o sintaxis incorrecta.

**Solución:**
- Usar **espacios**, NO tabs
- Verificar indentación (2 espacios por nivel)
- Validar en: https://www.yamllint.com/

### PR Rechazado por Revisión Manual

**Causas comunes:**
- 🚫 Primera publicación de publisher desconocido
- 🚫 URL sospechosa o dominio nuevo
- 🚫 Licencia no clara

**Solución:**
- Responde en el PR con información adicional
- Enlace al repositorio GitHub
- Verificación de identidad del publisher

---

## Verificación Post-Publicación

### Probar Instalación

```powershell
# Buscar
winget search Apuntador

# Instalar
winget install Apuntador.Apuntador

# Verificar información
winget show Apuntador.Apuntador

# Desinstalar (prueba)
winget uninstall Apuntador.Apuntador
```

### Verificar Web Install

```html
<!-- Añadir a apuntador.io -->
<a href="ms-appinstaller:?source=winget&package=Apuntador.Apuntador">
  [LAUNCH] Instalar Apuntador con un clic
</a>
```

Prueba el botón en Windows 10/11.

### Actualizar Documentación

Actualiza `README.md` y la web con:

```markdown
## Instalación en Windows

### Opción 1: Winget (Recomendado)
```powershell
winget install Apuntador.Apuntador
```

### Opción 2: Instalación con un clic
[[LAUNCH] Instalar Apuntador](ms-appinstaller:?source=winget&package=Apuntador.Apuntador)

### Opción 3: Descarga Manual
[[PACKAGE] Descargar MSI](https://apuntador.io/downloads/apuntador-1.1.76-windows-x64-installer.msi)
```

---

## Checklist de Publicación

### Primera Vez
- [ ] Ejecutar workflow `build-windows-desktop.yml` con `environment: pro`
- [ ] Descargar artefacto `winget-manifests-X.X.X.zip`
- [ ] Hacer fork de `microsoft/winget-pkgs`
- [ ] Crear estructura: `manifests/a/Apuntador/Apuntador/X.X.X/`
- [ ] Copiar los 3 archivos YAML
- [ ] **IMPORTANTE: Firmar CLA de Microsoft** (https://cla.opensource.microsoft.com/microsoft/winget-pkgs)
- [ ] Crear Pull Request con título: "New package: Apuntador.Apuntador version X.X.X"
- [ ] Marcar checklist en descripción del PR
- [ ] Esperar validaciones automáticas (~5 min)
- [ ] Responder al bot de CLA si es necesario
- [ ] Esperar aprobación (~24-48h primera vez)
- [ ] Verificar con `winget search Apuntador`
- [ ] Actualizar web con botón ms-appinstaller://

### Actualizaciones
- [ ] Ejecutar workflow con nueva versión
- [ ] Descargar artefacto de manifests
- [ ] Sincronizar fork con upstream
- [ ] Crear carpeta nueva versión
- [ ] Copiar archivos YAML
- [ ] PR con título: "Update: Apuntador.Apuntador version X.X.X"
- [ ] Marcar checklist en descripción del PR
- [ ] Esperar auto-aprobación (~pocas horas)

---

## Referencias

- [Winget Package Repository](https://github.com/microsoft/winget-pkgs)
- [Winget Manifest Schema](https://github.com/microsoft/winget-pkgs/tree/master/doc/manifest)
- [wingetcreate Documentation](https://github.com/microsoft/winget-create)
- [Contribution Guidelines](https://github.com/microsoft/winget-pkgs/blob/master/CONTRIBUTING.md)

---

## Contacto y Soporte

**Problemas con Winget:**
- GitHub Issues: https://github.com/microsoft/winget-pkgs/issues
- Discussions: https://github.com/microsoft/winget-cli/discussions

**Problemas con Apuntador:**
- GitHub Issues: https://github.com/impalah/apuntador/issues
