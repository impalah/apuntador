# 🔐 Certificado Auto-firmado para Apuntador

Este documento explica cómo configurar y usar certificados auto-firmados para firmar las aplicaciones de Windows de Apuntador.

## 📋 ¿Qué es un Certificado Auto-firmado?

Un certificado auto-firmado es un certificado digital que:

- ✅ **Firma digitalmente** la aplicación
- ✅ **Reduce avisos** de Windows Defender
- ✅ **Muestra información** del desarrollador
- ⚠️ **Sigue mostrando** un aviso de seguridad (menos severo)
- 💰 **Es gratuito** (vs $200+ anuales de certificados comerciales)

## 🚀 Guía para Desarrolladores

### 1. Generar Certificado

```powershell
# Ejecutar en PowerShell como administrador
.\scripts\create-self-signed-cert.ps1
```

Esto creará:

- `certificates/apuntador-codesigning.pfx` - Certificado para firma
- `certificates/certificate-base64.txt` - Para GitHub Actions
- `certificates/certificate-info.txt` - Información del certificado

### 2. Configurar GitHub Actions

Agregar estos secrets en GitHub:

1. Ve a: **GitHub Repository → Settings → Secrets and variables → Actions**
2. Agregar secrets:
   - `WINDOWS_CERTIFICATE`: Contenido de `certificate-base64.txt`
   - `WINDOWS_CERTIFICATE_PASSWORD`: `apuntador2024!`

### 3. Compilar Localmente

```powershell
# Compilación release con firma
.\scripts\build-windows-signed.ps1

# Compilación debug con firma
.\scripts\build-windows-signed.ps1 -BuildType debug
```

## 👥 Guía para Usuarios Finales

### ¿Por qué aparece el aviso de Windows?

Windows muestra avisos de seguridad para aplicaciones que:

- No están firmadas por un certificado comercial reconocido
- Son de desarrolladores no verificados por Microsoft

**Esto es NORMAL y no significa que la aplicación sea insegura.**

### Cómo Instalar Apuntador

#### Opción 1: Instalación Estándar (Recomendada)

1. **Descargar** el archivo `.msi` desde las releases
2. **Hacer doble clic** en el archivo descargado
3. **Si aparece Windows Defender SmartScreen**:
   - Hacer clic en **"More info"**
   - Hacer clic en **"Run anyway"**
4. **Seguir el asistente** de instalación

#### Opción 2: Instalación Avanzada

Si tienes conocimientos técnicos, puedes:

1. **Verificar la firma digital**:

   ```powershell
   Get-AuthenticodeSignature "apuntador-0.1.32-windows-x64-installer.msi"
   ```

2. **Instalar el certificado** (opcional):
   - Clic derecho en el archivo `.msi`
   - "Properties" → "Digital Signatures" → "Details"
   - "View Certificate" → "Install Certificate"

### ¿Es seguro instalar Apuntador?

✅ **SÍ, es completamente seguro** porque:

- **Código abierto**: Todo el código está disponible en GitHub
- **Firmado digitalmente**: La aplicación está firmada (aunque auto-firmada)
- **Sin malware**: Puedes verificar el código fuente
- **Comunidad activa**: Desarrollado transparentemente

### Mensajes de Windows que Verás

#### Windows Defender SmartScreen

```
Windows protected your PC
Microsoft Defender SmartScreen prevented an unrecognized app from starting.
Running this app might put your PC at risk.

App: apuntador-0.1.32-windows-x64-installer.msi
Publisher: Unknown publisher
```

**Solución**: Clic en "More info" → "Run anyway"

#### User Account Control (UAC)

```
Do you want to allow this app to make changes to your device?
apuntador-0.1.32-windows-x64-installer.msi
Publisher: Apuntador (Not verified)
```

**Solución**: Clic en "Yes"

## 🔧 Información Técnica

### Configuración del Certificado

- **Algoritmo**: RSA 2048 bits
- **Válido por**: 3 años
- **Tipo**: Code Signing Certificate
- **Emisor**: Auto-firmado
- **Sujeto**: CN=Apuntador Code Signing, O=Apuntador

### Variables de Entorno (GitHub Actions)

- `WINDOWS_CERTIFICATE`: Certificado en formato Base64
- `WINDOWS_CERTIFICATE_PASSWORD`: Contraseña del certificado
- `WINDOWS_CODESIGN_CERT_THUMBPRINT`: Thumbprint automático

## 🛡️ Seguridad

### Para Desarrolladores

- ⚠️ **NUNCA** subir archivos `.pfx` a GitHub
- ⚠️ **NUNCA** hardcodear contraseñas en el código
- ✅ **Usar** GitHub Secrets para información sensible
- ✅ **Rotar** certificados cada 1-3 años

### Para Usuarios

- ✅ **Descargar SOLO** desde releases oficiales de GitHub
- ✅ **Verificar** la URL: `github.com/impalah/apuntador`
- ✅ **Revisar** la firma digital antes de instalar
- ⚠️ **NO instalar** desde fuentes no oficiales

## 📞 Soporte

Si tienes problemas con la instalación:

1. **Revisa** esta documentación
2. **Busca** en los issues de GitHub
3. **Abre** un nuevo issue con detalles específicos

---

**Desarrollado con ❤️ por la comunidad de Apuntador**
