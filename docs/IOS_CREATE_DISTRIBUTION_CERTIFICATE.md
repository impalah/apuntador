# Crear Certificado iOS Distribution - Guía Paso a Paso

**Para usuario con cuenta pagada que tiene "Distribution Managed" pero necesita "Distribution" estándar**

---

## 🎯 **Tu Situación Actual**

Tienes:
- ✅ **Cuenta pagada** Apple Developer Program  
- ✅ **Development certificate** (para desarrollo local)
- ❌ **Distribution Managed** (solo funciona con Xcode Cloud, NO con GitHub Actions)

**Necesitas**: Certificado **"Distribution"** estándar para GitHub Actions

---

## 📋 **Paso 1: Crear Certificate Signing Request (CSR)**

### En tu Mac:

1. **Abre Keychain Access**:
   ```bash
   # Desde terminal
   open "/Applications/Utilities/Keychain Access.app"
   ```

2. **Crear CSR**:
   - **Menú**: Keychain Access → Certificate Assistant → **"Request a Certificate From a Certificate Authority..."**
   
3. **Llenar formulario**:
   ```
   User Email Address: impalah@gmail.com
   Common Name: Lino Figueroa
   CA Email Address: [DEJAR VACÍO]
   Request is: ☑️ Saved to disk
   Let me specify key pair information: [DEJAR SIN MARCAR]
   ```
   
   **📍 Datos de ubicación** (si te pregunta):
   ```
   Country: ES (España)
   State/Province: Leon
   City: Leon
   Organization: Lino Figueroa
   ```

4. **Guardar**:
   - Nombre: `ApuntadorDistribution.certSigningRequest`
   - Ubicación: Escritorio (fácil de encontrar)

---

## 📋 **Paso 2: Crear Certificado en Apple Developer Portal**

### En el portal:

1. **Ve a**: [developer.apple.com/account](https://developer.apple.com/account)

2. **Navega**:
   ```
   Certificates, Identifiers & Profiles → Certificates → [+]
   ```

3. **Selecciona tipo**:
   - Busca: **"iOS Distribution (App Store and Ad Hoc)"**
   - O: **"Apple Distribution"**
   - **NO selecciones**: "Distribution Managed"

4. **Sube CSR**:
   - Click "Choose File"
   - Selecciona `ApuntadorDistribution.certSigningRequest`
   - Click "Continue"

5. **Descargar**:
   - Click "Download"  
   - Archivo: `distribution.cer` (o similar)

---

## 📋 **Paso 3: Instalar y Exportar Certificado**

### Instalar en Keychain:

1. **Instalar**:
   ```bash
   # Doble-click en el archivo .cer descargado
   # O desde terminal:
   open distribution.cer
   ```

2. **Verificar instalación**:
   - Abre Keychain Access
   - Busca: "Apple Distribution: Lino Figueroa"
   - Debe mostrar: 🔑 con llave privada

### Exportar como P12:

1. **En Keychain Access**:
   - Encuentra: "Apple Distribution: Lino Figueroa"
   - **Right-click** → "Export..."

2. **Configurar exportación**:
   ```
   File Format: Personal Information Exchange (.p12)
   Nombre: ApuntadorDistribution.p12
   Ubicación: Escritorio
   ```

3. **Establecer contraseña**:
   ```
   Password: [crear contraseña segura]
   Verify: [repetir contraseña]
   ```
   **⚠️ IMPORTANTE**: Guarda esta contraseña, la necesitarás para GitHub Secrets

---

## 📋 **Paso 4: Verificar que Funciona**

### Comando de verificación:

```bash
# Ver certificados en tu keychain
security find-identity -v -p codesigning

# Deberías ver algo como:
# 1) ABC123DEF... "Apple Distribution: Lino Figueroa (TEAM_ID)"
```

---

## 🎯 **Qué vas a tener después**

### Archivos creados:
- ✅ `ApuntadorDistribution.certSigningRequest` (CSR usado)
- ✅ `distribution.cer` (certificado descargado)
- ✅ `ApuntadorDistribution.p12` (certificado + clave privada)

### En Keychain:
- ✅ **Apple Distribution: Lino Figueroa** con 🔑 (clave privada)

### En Apple Developer Portal:
- ✅ **Nuevo certificado "Distribution"** (activo)
- ✅ **Total 3 certificados**: Development + Distribution Managed + Distribution

---

## 🚀 **Siguiente Paso**

Una vez que tengas el archivo `.p12`:

1. **Crear Provisioning Profile** que use este nuevo certificado
2. **Convertir a Base64** para GitHub Secrets
3. **Configurar automatización**

**¿Quieres que te guíe con el siguiente paso una vez que tengas el certificado .p12 creado?**

---

## 🆘 **Posibles Problemas**

### "No veo la opción Distribution"
- Verifica que estés en la sección correcta: iOS, tvOS, watchOS (no macOS)
- Refresh la página del portal
- Prueba con Safari en lugar de Chrome

### "CSR inválido"  
- Asegúrate de crearlo en el mismo Mac que usarás
- No marques "Let me specify key pair information"
- El CSR debe ser reciente (no más de 1 semana)

### "Certificate creation failed"
- Verifica que tu membresía esté activa
- Contacta Apple Developer Support si persiste

---

**📞 ¿Necesitas ayuda con algún paso específico?**