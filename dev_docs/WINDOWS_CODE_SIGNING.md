# Firma de Código para Windows - Guía Completa

Esta guía explica cómo firmar las aplicaciones de Windows de Apuntador para eliminar las advertencias de seguridad de Windows Defender SmartScreen.

## Tabla de Contenidos

1. [¿Por qué firmar?](#por-qué-firmar)
2. [Opciones de Certificados](#opciones-de-certificados)
3. [Certificado Comercial (Producción)](#certificado-comercial-producción)
4. [Certificado de Prueba (Testing)](#certificado-de-prueba-testing)
5. [Configuración en GitHub Actions](#configuración-en-github-actions)
6. [Verificación Local](#verificación-local)
7. [Solución de Problemas](#solución-de-problemas)

## ¿Por qué firmar?

Sin firma de código, Windows muestra advertencias al instalar la aplicación:
- ❌ "Windows protected your PC - Unknown publisher"
- ❌ "This app can't be verified"
- ❌ Los usuarios deben hacer clic en "More info" → "Run anyway"

Con firma de código:
- ✅ Windows reconoce al publisher
- ✅ No muestra advertencias de seguridad
- ✅ Instalación sin fricción para usuarios
- ✅ Mayor confianza y profesionalismo

## Opciones de Certificados

### Certificado Comercial (Recomendado para Producción)

**Ventajas:**
- ✅ Confianza inmediata de Windows
- ✅ No muestra advertencias a usuarios
- ✅ Incluye información verificada de la empresa/desarrollador
- ✅ Compatible con SmartScreen Application Reputation

**Desventajas:**
- ❌ Costo: $100-400 USD/año
- ❌ Proceso de validación (1-7 días)

**Proveedores recomendados:**

| Proveedor | Tipo | Precio/año | Validación | Hardware Token |
|-----------|------|------------|------------|----------------|
| **DigiCert** | OV | ~$474 | Organización | No |
| **DigiCert** | EV | ~$595 | Extendida | Sí (USB) |
| **Sectigo** | OV | ~$179 | Organización | No |
| **SSL.com** | OV | ~$199 | Organización | No |
| **SSL.com** | EV | ~$299 | Extendida | Sí (USB/Cloud) |
| **GlobalSign** | OV | ~$249 | Organización | No |

**Recomendación:** Para Apuntador (proyecto open-source), un certificado **OV (Organization Validation)** de Sectigo o SSL.com es suficiente y más económico.

### Certificado Auto-firmado (Solo Testing)

**Ventajas:**
- ✅ Gratis
- ✅ Generación inmediata
- ✅ Útil para pruebas internas

**Desventajas:**
- ❌ Windows sigue mostrando advertencias
- ❌ No apto para distribución pública
- ❌ Usuarios deben instalar certificado raíz manualmente

## Certificado Comercial (Producción)

### Paso 1: Comprar Certificado

1. **Elige un proveedor** (recomendado: Sectigo para OV, DigiCert para EV)

2. **Tipo de certificado:**
   - **Individual**: Si eres desarrollador independiente
   - **Organization Validation (OV)**: Si tienes empresa registrada
   - **Extended Validation (EV)**: Máxima confianza (requiere token USB físico)

3. **Proceso de compra:**
   - Visita el sitio del proveedor (ejemplo: sectigo.com)
   - Selecciona "Code Signing Certificate"
   - Completa el formulario con tus datos

### Paso 2: Validación

El proveedor verificará:
- **Para OV/EV**: Documentos de la empresa (registro mercantil, NIF/CIF)
- **Para Individual**: Identificación personal (DNI/NIE/Pasaporte)
- **Verificación telefónica o email** de contacto empresarial

**Tiempo estimado:** 1-7 días laborables

### Paso 3: Recibir Certificado

Una vez aprobado:
- **OV**: Recibes un archivo `.pfx` o `.p12` con clave privada
- **EV**: Recibes un token USB físico (YubiKey, SafeNet) con el certificado

**Guarda el certificado de forma segura** - contiene tu clave privada.

### Paso 4: Convertir a Base64 para GitHub Actions

**En Windows (PowerShell):**
```powershell
# Si tienes archivo PFX
$pfxPath = "C:\path\to\your-certificate.pfx"
$base64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($pfxPath))
$base64 | Set-Clipboard
Write-Host "✓ Base64 copiado al portapapeles"
```

**En macOS/Linux:**
```bash
# Si tienes archivo PFX
base64 -i your-certificate.pfx | pbcopy  # macOS
base64 -i your-certificate.pfx | xclip   # Linux
```

### Paso 5: Configurar GitHub Secrets

1. Ve a tu repositorio en GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. **Environments** → Selecciona `dev`, `pre`, o `pro`
4. Añade los siguientes secrets:

| Secret | Valor | Descripción |
|--------|-------|-------------|
| `WINDOWS_CERTIFICATE_BASE64` | (pegar Base64) | Certificado PFX codificado en Base64 |
| `WINDOWS_CERTIFICATE_PASSWORD` | (tu password) | Contraseña del certificado PFX |

**Importante:** Añade estos secrets en **cada environment** (dev, pre, pro) si usas diferentes certificados por ambiente.

## Certificado de Prueba (Testing)

Para probar el proceso de firma sin comprar un certificado:

### Paso 1: Generar Certificado de Prueba

**En Windows (PowerShell como Administrador):**

```powershell
# Ejecutar el script incluido
.\scripts\create-windows-test-certificate.ps1
```

Este script:
- ✅ Crea un certificado auto-firmado
- ✅ Lo exporta como PFX en `certificates/windows-test-cert.pfx`
- ✅ Muestra el comando para convertirlo a Base64

### Paso 2: Convertir a Base64

```powershell
$pfxPath = ".\certificates\windows-test-cert.pfx"
[Convert]::ToBase64String([IO.File]::ReadAllBytes($pfxPath))
```

Copia la salida.

### Paso 3: Configurar GitHub Secrets (Testing)

1. Ve a **Settings** → **Secrets** → **Actions**
2. Selecciona environment `dev`
3. Añade:
   - `WINDOWS_CERTIFICATE_BASE64`: (pegar Base64)
   - `WINDOWS_CERTIFICATE_PASSWORD`: `Test123!@#`

### Paso 4: Instalar Certificado Raíz (Solo para testing local)

Para que Windows confíe en el certificado auto-firmado en tu máquina:

```powershell
# Importar certificado público como raíz de confianza
Import-Certificate -FilePath ".\certificates\windows-test-cert.cer" -CertStoreLocation Cert:\CurrentUser\Root

# Importar certificado con clave privada
$password = ConvertTo-SecureString -String "Test123!@#" -AsPlainText -Force
Import-PfxCertificate -FilePath ".\certificates\windows-test-cert.pfx" -CertStoreLocation Cert:\CurrentUser\My -Password $password
```

**⚠️ Advertencia:** Esto solo funciona en TU máquina. Otros usuarios seguirán viendo advertencias.

## Configuración en GitHub Actions

El workflow `build-windows-desktop.yml` ya está configurado para firmar automáticamente si los secrets están presentes.

### Verificar Configuración Actual

Revisa el workflow en `.github/workflows/build-windows-desktop.yml`:

```yaml
- name: Import Windows Code Signing Certificate
  if: env.WINDOWS_CERTIFICATE_BASE64 != ''
  shell: pwsh
  run: |
    # Decodificar certificado
    $certBytes = [Convert]::FromBase64String("$env:WINDOWS_CERTIFICATE_BASE64")
    $certPath = "$env:TEMP\cert.pfx"
    [IO.File]::WriteAllBytes($certPath, $certBytes)
    
    # Importar al almacén de certificados
    $password = ConvertTo-SecureString -String "$env:WINDOWS_CERTIFICATE_PASSWORD" -AsPlainText -Force
    Import-PfxCertificate -FilePath $certPath -CertStoreLocation Cert:\CurrentUser\My -Password $password
    
    # Limpiar archivo temporal
    Remove-Item $certPath
  env:
    WINDOWS_CERTIFICATE_BASE64: ${{ secrets.WINDOWS_CERTIFICATE_BASE64 }}
    WINDOWS_CERTIFICATE_PASSWORD: ${{ secrets.WINDOWS_CERTIFICATE_PASSWORD }}
```

### Configurar Tauri para Firma Automática

El archivo `src-tauri/tauri.conf.json` ya incluye la configuración:

```json
{
  "bundle": {
    "windows": {
      "certificateThumbprint": null,
      "digestAlgorithm": "sha256",
      "timestampUrl": "http://timestamp.digicert.com"
    }
  }
}
```

**Nota:** `certificateThumbprint: null` hace que Tauri busque automáticamente el certificado en el almacén de Windows.

## Verificación Local

### Verificar Firma del Ejecutable

Después de construir localmente con firma:

```powershell
# Ver información de firma digital
Get-AuthenticodeSignature "src-tauri\target\release\apuntador.exe"

# Detalles completos
Get-AuthenticodeSignature "src-tauri\target\release\apuntador.exe" | Format-List *
```

**Resultado esperado (certificado comercial):**
```
Status        : Valid
StatusMessage : Signature verified.
SignerCertificate : [Subject]
                      CN=Your Company Name
                    [Issuer]
                      CN=DigiCert Trusted G4 Code Signing RSA4096 SHA384 2021 CA1
```

**Resultado esperado (certificado auto-firmado):**
```
Status        : UnknownError (en otras máquinas)
Status        : Valid (en tu máquina si instalaste el certificado raíz)
```

### Verificar MSI

```powershell
# Ver firma del instalador MSI
Get-AuthenticodeSignature "src-tauri\target\release\bundle\msi\Apuntador_1.1.76_x64_en-US.msi"
```

### Probar Instalación

1. **Doble clic en el MSI**
2. **Con certificado comercial válido:**
   - ✅ No aparece advertencia de Windows Defender SmartScreen
   - ✅ Muestra "Verified publisher: [Tu Nombre/Empresa]"
3. **Con certificado auto-firmado:**
   - ⚠️ Muestra "Unknown publisher" (igual que sin firma)

## Solución de Problemas

### Problema: "Certificate not found" en GitHub Actions

**Causa:** Los secrets no están configurados o el certificado no se importó correctamente.

**Solución:**
1. Verifica que los secrets existen en el environment correcto
2. Revisa los logs del workflow en el paso "Import Windows Code Signing Certificate"
3. Asegúrate de que el Base64 está completo (sin saltos de línea)

### Problema: "Invalid password" al importar certificado

**Causa:** La contraseña del certificado es incorrecta.

**Solución:**
1. Verifica el secret `WINDOWS_CERTIFICATE_PASSWORD`
2. Si creaste el certificado con el script, la password por defecto es `Test123!@#`
3. Si compraste el certificado, usa la password que estableciste al crearlo

### Problema: Windows sigue mostrando advertencias con certificado auto-firmado

**Causa:** Los certificados auto-firmados no son confiables para otros usuarios.

**Solución:**
- **Para testing personal:** Instala el certificado raíz en tu máquina (ver sección anterior)
- **Para producción:** Compra un certificado comercial de DigiCert, Sectigo, etc.

### Problema: "Timestamp server not responding"

**Causa:** El servidor de timestamp (timestamping) no responde.

**Solución:**
1. Tauri usa `http://timestamp.digicert.com` por defecto
2. Si falla, prueba servidores alternativos en `tauri.conf.json`:
   ```json
   "timestampUrl": "http://timestamp.comodoca.com"
   ```
   Otras opciones:
   - `http://timestamp.sectigo.com`
   - `http://timestamp.globalsign.com`
   - `http://timestamp.entrust.net`

### Problema: Firma exitosa pero Windows sigue mostrando advertencia

**Causa:** SmartScreen Application Reputation - el ejecutable es nuevo.

**Solución:**
- **A corto plazo:** Firma válida + tiempo + descargas = reputación mejora
- **A largo plazo:** Considera certificado EV (Extended Validation) para reputación inmediata
- **Workaround:** Distribuye también vía Microsoft Store (Microsoft firma y distribuye)

## Recomendaciones

### Para Desarrollo/Testing
- ✅ Usa certificado auto-firmado
- ✅ Solo para ambiente `dev`
- ✅ Instala certificado raíz en tu máquina de desarrollo

### Para Pre-Producción
- ✅ Usa certificado comercial OV de bajo costo
- ✅ Ambiente `pre` para QA/testing
- ✅ Verifica que no aparecen advertencias

### Para Producción
- ✅ Usa certificado comercial OV o EV
- ✅ Ambiente `pro` con certificado válido
- ✅ Timestamp habilitado (garantiza validez después de expiración del cert)
- ✅ Renueva certificado antes de expiración (típicamente 1-3 años)

## Costos Estimados

| Escenario | Certificado | Costo anual | Mejor para |
|-----------|-------------|-------------|------------|
| **Testing** | Auto-firmado | $0 | Desarrollo interno |
| **Startup/Indie** | Sectigo OV | ~$179 | Proyectos pequeños |
| **Empresa** | DigiCert OV | ~$474 | Empresas establecidas |
| **Máxima confianza** | DigiCert EV | ~$595 | Software empresarial crítico |

## Próximos Pasos

1. **Decide tu estrategia:**
   - Testing: Genera certificado auto-firmado con el script
   - Producción: Compra certificado comercial

2. **Configura GitHub Secrets** en los environments correspondientes

3. **Ejecuta el workflow** `build-windows-desktop.yml`

4. **Verifica la firma** descargando el MSI y comprobando:
   ```powershell
   Get-AuthenticodeSignature .\Apuntador_*.msi
   ```

5. **Distribuye** con confianza - los usuarios verán el publisher verificado

## Referencias

- [Tauri Code Signing Documentation](https://tauri.app/v1/guides/distribution/sign-windows)
- [DigiCert Code Signing](https://www.digicert.com/signing/code-signing-certificates)
- [Sectigo Code Signing](https://sectigo.com/ssl-certificates-tls/code-signing)
- [Microsoft Authenticode](https://docs.microsoft.com/en-us/windows-hardware/drivers/install/authenticode)
