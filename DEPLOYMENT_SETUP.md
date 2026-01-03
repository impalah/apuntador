# Configuración de Despliegue Automático a Apuntador.io

Este documento describe cómo configurar los workflows de GitHub Actions para que automáticamente suban los paquetes construidos al bucket S3 de apuntador.io y actualicen el archivo `versions.json`.

## [TARGET] Objetivo

Cuando se ejecuta un workflow de build (Android APK, Windows MSI, macOS DMG, o Linux DEB/RPM/AppImage), el sistema debe:

1. **Construir** el paquete con nombre versionado (ej: `apuntador-1.0.0.apk`)
2. **Subir** el paquete al bucket S3 de apuntador.io en `/downloads/`
3. **Actualizar** `versions.json` con el nombre del nuevo archivo
4. **Publicar** para que los botones de descarga en el sitio web apunten automáticamente a la nueva versión

## [LIST] Requisitos Previos

### 1. Bucket S3 para Apuntador.io

Necesitas un bucket S3 configurado para hosting web estático. Ejemplo:
- **Nombre del bucket**: `apuntador.io` o `apuntador-io-prod`
- **Región**: `us-east-1` (o la que prefieras)
- **Configuración**: Static website hosting habilitado
- **Permisos**: Escritura para las credenciales AWS, lectura pública para archivos

### 2. Usuario IAM con Permisos

Crea un usuario IAM con permisos para:
- `s3:PutObject` en `arn:aws:s3:::TU-BUCKET/downloads/*`
- `s3:GetObject` en `arn:aws:s3:::TU-BUCKET/downloads/*`
- `s3:PutObjectAcl` para hacer los archivos públicos

Ejemplo de política IAM:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::apuntador.io/downloads/*"
    }
  ]
}
```

## [SECURE] Secrets de GitHub

Ve a tu repositorio → Settings → Secrets and variables → Actions → New repository secret

Crea los siguientes **Secrets**:

| Nombre | Descripción | Ejemplo |
|--------|-------------|---------|
| `APUNTADOR_IO_AWS_ACCESS_KEY_ID` | Access Key ID del usuario IAM | `AKIAIOSFODNN7EXAMPLE` |
| `APUNTADOR_IO_AWS_SECRET_ACCESS_KEY` | Secret Access Key del usuario IAM | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |

## [STATS] Variables de GitHub

Ve a tu repositorio → Settings → Secrets and variables → Actions → Variables → New repository variable

Crea las siguientes **Variables**:

| Nombre | Descripción | Ejemplo |
|--------|-------------|---------|
| `APUNTADOR_IO_AWS_REGION` | Región del bucket S3 | `us-east-1` |
| `APUNTADOR_IO_S3_BUCKET` | Nombre del bucket S3 | `apuntador.io` |

## [CONFIG] Workflows Modificados

Los siguientes workflows han sido actualizados para incluir la subida automática:

### 1. Android APK (`build-android-apk.yml`)
- **Condición**: Solo builds de tipo `release`
- **Archivo subido**: `apuntador-{VERSION}.apk`
- **Key en versions.json**: `android-apk`

### 2. Windows Desktop (`build-windows-desktop.yml`)
- **Condición**: Solo builds `release` con `generateInstallers=true`
- **Archivo subido**: `apuntador-{VERSION}-windows-x64-installer.msi`
- **Key en versions.json**: `windows-msi`

### 3. macOS Desktop (`build-macos-desktop.yml`)
- **Condición**: Solo builds `release` con `buildTarget=universal` y `generateInstallers=true`
- **Archivo subido**: `Apuntador-{VERSION}-macos-universal.dmg`
- **Key en versions.json**: `macos-dmg`

### 4. Linux Desktop (`build-linux-desktop.yml`)
- **Condición**: Solo builds `release` con `buildTarget=x86_64-unknown-linux-gnu` y `generatePackages=true`
- **Archivos subidos**:
  - `Apuntador_{VERSION}_amd64.deb`
  - `Apuntador-{VERSION}-1.x86_64.rpm`
  - `Apuntador_{VERSION}_amd64.AppImage`
- **Keys en versions.json**: `linux-deb`, `linux-rpm`, `linux-appimage`

## [LAUNCH] Proceso de Build

### Prerequisito: Release debe existir

**IMPORTANTE**: Antes de ejecutar cualquier workflow de build, debes haber creado un release con el workflow `inspect-build-release.yml`. Este workflow genera el ZIP con el frontend construido que los workflows de build descargarán.

### Paso 1: Ejecutar Workflow de Build

Para cada plataforma, ejecuta el workflow manualmente desde GitHub Actions con los parámetros apropiados:

**Ejemplo para Android:**
```
Inputs:
- release_tag: 1.0.0
- versionCode: 100
- buildType: release
```

**Ejemplo para Windows:**
```
Inputs:
- release_tag: 1.0.0
- buildType: release
- generateInstallers: true
```

**Ejemplo para macOS:**
```
Inputs:
- release_tag: 1.0.0
- buildType: release
- buildTarget: universal
- generateInstallers: true
```

**Ejemplo para Linux:**
```
Inputs:
- release_tag: 1.0.0
- buildType: release
- buildTarget: x86_64-unknown-linux-gnu
- generatePackages: true
```

### Paso 2: Verificación Automática

El workflow automáticamente:

1. [OK] Construye el paquete con el nombre versionado
2. [OK] Configura credenciales AWS
3. [OK] Sube el archivo a `s3://TU-BUCKET/downloads/`
4. [OK] Descarga `versions.json` actual (o crea uno nuevo si no existe)
5. [OK] Actualiza la key correspondiente con el nuevo nombre de archivo
6. [OK] Sube el `versions.json` modificado de vuelta a S3

### Paso 3: Verificación Manual

Puedes verificar que funcionó visitando:

```
https://TU-BUCKET.s3.amazonaws.com/downloads/versions.json
```

Deberías ver algo como:

```json
{
  "android-apk": "apuntador-1.0.0.apk",
  "windows-msi": "apuntador-1.0.0-windows-x64-installer.msi",
  "macos-dmg": "Apuntador-1.0.0-macos-universal.dmg",
  "linux-deb": "Apuntador_1.0.0_amd64.deb",
  "linux-rpm": "Apuntador-1.0.0-1.x86_64.rpm",
  "linux-appimage": "Apuntador_1.0.0_amd64.AppImage"
}
```

## [WEB] Integración con el Sitio Web

El sitio web de apuntador.io ya está configurado para leer `versions.json` automáticamente:

1. **download-links.js** descarga `versions.json` cuando se carga la página
2. Actualiza todos los botones con `data-download-type` para que apunten a los archivos correctos
3. Los usuarios siempre descargan la última versión sin necesidad de editar manualmente el sitio

## [BUG] Troubleshooting

### Error: "Context access might be invalid"

Esto es un warning de linter - los secrets y variables no existen hasta que los crees. Ignora estos warnings hasta configurar los secrets/variables.

### Error: "Access Denied" al subir a S3

Verifica:
- Las credenciales AWS son correctas
- El usuario IAM tiene permisos `s3:PutObject` y `s3:PutObjectAcl`
- El nombre del bucket en la variable `APUNTADOR_IO_S3_BUCKET` es correcto

### Error: "versions.json not found" pero el workflow continúa

Esto es normal la primera vez. El workflow crea un `versions.json` nuevo si no existe.

### Los botones de descarga no se actualizan

Verifica:
1. `versions.json` está en `s3://TU-BUCKET/downloads/versions.json`
2. El archivo tiene permisos de lectura pública (`--acl public-read`)
3. El sitio web está leyendo desde la URL correcta (revisa console en DevTools)

## [NOTE] Notas Adicionales

### Seguridad

- **Nunca** expongas las credenciales AWS en logs o código
- Usa secrets de GitHub para almacenar credenciales
- Restringe permisos IAM solo a lo necesario
- Considera rotar credenciales periódicamente

### Performance

- Los archivos se suben con `--acl public-read` para acceso directo
- CloudFront (si está configurado) puede cachear los archivos
- `versions.json` es pequeño (~500 bytes) y se actualiza rápidamente

### Versionado

- Usa **Semantic Versioning** (MAJOR.MINOR.PATCH)
- Ejemplos: `1.0.0`, `1.2.3`, `2.0.0-beta.1`
- El mismo número de versión debe usarse consistentemente en todos los workflows

## [OK] Checklist de Configuración

- [ ] Bucket S3 creado y configurado para hosting
- [ ] Usuario IAM creado con permisos correctos
- [ ] Secret `APUNTADOR_IO_AWS_ACCESS_KEY_ID` creado en GitHub
- [ ] Secret `APUNTADOR_IO_AWS_SECRET_ACCESS_KEY` creado en GitHub
- [ ] Variable `APUNTADOR_IO_AWS_REGION` creada en GitHub
- [ ] Variable `APUNTADOR_IO_S3_BUCKET` creada en GitHub
- [ ] Primer build de prueba ejecutado exitosamente
- [ ] `versions.json` verificado en S3
- [ ] Sitio web actualiza links correctamente

---

**¡Listo!** Una vez configurado, cada build automáticamente actualiza los links de descarga en el sitio web. [SUCCESS]
