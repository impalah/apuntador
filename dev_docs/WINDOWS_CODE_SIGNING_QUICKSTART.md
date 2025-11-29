# ⚡ Guía Rápida: Firma de Código para Windows

## 📋 Resumen

Las aplicaciones Windows de Apuntador pueden mostrando advertencias de seguridad porque no están firmadas digitalmente. Esta guía te ayudará a configurar la firma de código en **10 minutos** para testing, o **1-2 días** para producción (con certificado comercial).

---

## 🎯 Opciones Rápidas

### Opción A: Testing Inmediato (5-10 minutos) ⚡
**Usa un certificado auto-firmado** - Gratis, pero los usuarios seguirán viendo advertencias.

**Paso a paso:**

1. **Genera el certificado** (PowerShell como Administrador):
   ```powershell
   .\scripts\create-windows-test-certificate.ps1
   ```

2. **Convierte a Base64**:
   ```powershell
   [Convert]::ToBase64String([IO.File]::ReadAllBytes(".\certificates\windows-test-cert.pfx"))
   ```
   Copia la salida completa.

3. **Configura GitHub Secrets**:
   - Ve a: `Settings` → `Secrets and variables` → `Actions` → `Environments` → `dev`
   - Añade:
     - `WINDOWS_CERTIFICATE_BASE64`: (pega el Base64)
     - `WINDOWS_CERTIFICATE_PASSWORD`: `Test123!@#`

4. **Ejecuta el workflow**:
   - Actions → `Build Windows Desktop`
   - Selecciona `environment: dev`
   - Run workflow

5. **Verifica la firma**:
   ```powershell
   Get-AuthenticodeSignature .\Apuntador_*.msi
   ```

✅ **Listo** - Tu aplicación está firmada (aunque Windows seguirá mostrando advertencias a otros usuarios).

---

### Opción B: Producción (1-7 días) 🏆
**Compra un certificado comercial** - Sin advertencias para usuarios finales.

**Paso a paso:**

1. **Compra el certificado** (recomendaciones ordenadas por precio):

   | Proveedor | Tipo | Precio/año | Link |
   |-----------|------|------------|------|
   | **Sectigo** | OV | ~$179 USD | [sectigo.com](https://sectigo.com/ssl-certificates-tls/code-signing) |
   | **SSL.com** | OV | ~$199 USD | [ssl.com](https://www.ssl.com/code-signing/) |
   | **GlobalSign** | OV | ~$249 USD | [globalsign.com](https://www.globalsign.com/en/code-signing-certificate) |
   | **DigiCert** | OV | ~$474 USD | [digicert.com](https://www.digicert.com/signing/code-signing-certificates) |

   **Recomendación**: Sectigo OV (mejor relación calidad-precio para proyectos indie/startup)

2. **Proceso de validación** (1-7 días):
   - Completa el formulario del proveedor
   - Envía documentos de identidad/empresa
   - Espera verificación telefónica/email

3. **Descarga el certificado**:
   - Recibes un archivo `.pfx` o `.p12`
   - **Guárdalo de forma segura** (contiene tu clave privada)

4. **Convierte a Base64**:

   **Windows:**
   ```powershell
   $pfxPath = "C:\ruta\a\tu-certificado.pfx"
   [Convert]::ToBase64String([IO.File]::ReadAllBytes($pfxPath)) | Set-Clipboard
   Write-Host "✓ Base64 copiado al portapapeles"
   ```

   **macOS/Linux:**
   ```bash
   base64 -i tu-certificado.pfx | pbcopy  # macOS
   base64 -i tu-certificado.pfx | xclip   # Linux
   ```

5. **Configura GitHub Secrets** en **cada environment** (dev, pre, pro):
   - Ve a: `Settings` → `Secrets` → `Actions` → `Environments` → `pro`
   - Añade:
     - `WINDOWS_CERTIFICATE_BASE64`: (pega el Base64)
     - `WINDOWS_CERTIFICATE_PASSWORD`: (tu contraseña del certificado)

6. **Ejecuta el workflow**:
   - Actions → `Build Windows Desktop`
   - Selecciona `environment: pro`
   - Run workflow

7. **Verifica** (descarga el MSI y ejecuta):
   ```powershell
   Get-AuthenticodeSignature .\Apuntador_*.msi
   ```

   Deberías ver:
   ```
   Status        : Valid
   StatusMessage : Signature verified.
   SignerCertificate : CN=Tu Nombre/Empresa
   ```

8. **Prueba instalación**:
   - Doble clic en el MSI
   - ✅ **No debería mostrar advertencias**
   - ✅ Verás "Verified publisher: [Tu Nombre]"

---

## 🚨 Solución de Problemas Rápida

### ❌ "Certificate not found" en GitHub Actions
**Solución**: Verifica que los secrets estén en el **environment correcto** (dev/pre/pro), no en "Repository secrets".

### ❌ "Invalid password"
**Solución**: 
- Certificado auto-firmado: password es `Test123!@#`
- Certificado comercial: verifica que usaste la password correcta al exportar el PFX

### ❌ Windows sigue mostrando advertencias (certificado auto-firmado)
**Esto es normal** - Los certificados auto-firmados no eliminan advertencias para otros usuarios.
**Solución**: Compra un certificado comercial.

### ❌ Windows sigue mostrando advertencias (certificado comercial)
**Causa**: SmartScreen Application Reputation - tu ejecutable es nuevo.
**Solución**: 
- La reputación mejora con el tiempo y número de descargas
- Considera certificado EV para reputación inmediata
- O distribuye vía Microsoft Store

---

## 📚 Más Información

- **Guía completa**: `docs/WINDOWS_CODE_SIGNING.md`
- **Tauri Docs**: [tauri.app/v1/guides/distribution/sign-windows](https://tauri.app/v1/guides/distribution/sign-windows)
- **Microsoft Authenticode**: [docs.microsoft.com/windows-hardware/drivers/install/authenticode](https://docs.microsoft.com/en-us/windows-hardware/drivers/install/authenticode)

---

## 💡 Recomendación

**Para proyectos open-source/indie como Apuntador:**

1. **Fase 1 (Testing)**: Usa certificado auto-firmado en `dev` environment
2. **Fase 2 (Pre-producción)**: Compra Sectigo OV (~$179/año) para `pre` y `pro`
3. **Fase 3 (Escala)**: Si creces, considera DigiCert EV para máxima confianza

**Costo total estimado primer año**: ~$179 USD
**Beneficio**: Eliminación completa de advertencias de Windows + confianza de usuarios

---

## ✅ Checklist

- [ ] Decidir entre certificado auto-firmado (testing) o comercial (producción)
- [ ] Generar/comprar certificado
- [ ] Convertir certificado a Base64
- [ ] Configurar `WINDOWS_CERTIFICATE_BASE64` en GitHub Secrets
- [ ] Configurar `WINDOWS_CERTIFICATE_PASSWORD` en GitHub Secrets
- [ ] Ejecutar workflow `Build Windows Desktop`
- [ ] Descargar MSI y verificar firma con `Get-AuthenticodeSignature`
- [ ] Probar instalación (doble clic en MSI)
- [ ] Confirmar que no aparecen advertencias (solo con certificado comercial)

---

**¿Preguntas?** Consulta la guía completa en `docs/WINDOWS_CODE_SIGNING.md`
