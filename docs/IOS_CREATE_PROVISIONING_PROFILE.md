# Crear Provisioning Profile para App Store - Guía Paso a Paso

**Para: Lino Figueroa con certificado de distribución ya creado**

---

## 🎯 **¿Qué es un Provisioning Profile?**

Un **Provisioning Profile** conecta:
- ✅ **Tu certificado** de distribución (que ya tienes)
- ✅ **Tu App ID** (`io.apuntador.app`)
- ✅ **Tipo de distribución** (App Store)

**Sin él, no puedes firmar la app para el App Store.**

---

## 📋 **Paso 1: Verificar tu App ID**

Primero, vamos a confirmar que tu App ID existe:

### En Apple Developer Portal:

1. **Ve a**: [developer.apple.com/account](https://developer.apple.com/account)
2. **Navega**: **Certificates, Identifiers & Profiles** → **Identifiers**
3. **Busca**: `io.apuntador.app`

### ¿Qué deberías ver?
```
Bundle ID: io.apuntador.app
Description: Apuntador (o similar)
Platform: iOS
```

### ❓ **Si NO existe el App ID**:
1. **Click** **"+"** (crear nuevo)
2. **Select**: **"App IDs"** → Continue
3. **Fill**:
   ```
   Description: Apuntador
   Bundle ID: Explicit → io.apuntador.app
   ```
4. **Capabilities**: Dejar por defecto
5. **Register**

---

## 📋 **Paso 2: Crear App Store Provisioning Profile**

### En Apple Developer Portal:

1. **Navega**: **Certificates, Identifiers & Profiles** → **Profiles** → **"+"**

2. **Selecciona tipo**:
   - **Distribution** → **"App Store"** ✅
   - **NO selecciones**: "Ad Hoc", "Development", o "In House"

3. **Selecciona App ID**:
   - Busca y selecciona: **`io.apuntador.app`** ✅

4. **Selecciona certificado**:
   - Busca: **"Apple Distribution: Lino Figueroa"** ✅
   - **Debe ser el que acabas de crear** (fecha reciente)

5. **Nombrar el profile**:
   ```
   Profile Name: Apuntador App Store Distribution
   ```

6. **Generate** → **Download**

---

## 📋 **Paso 3: Verificar archivos descargados**

Después de descargar, deberías tener:

### Archivos en tu Mac:
```
✅ distribution.cer (certificado - ya lo tienes)
✅ ApuntadorDistribution.p12 (certificado exportado - ya lo tienes)  
✅ Apuntador_App_Store_Distribution.mobileprovision (nuevo)
```

---

## 📋 **Paso 4: Instalar Provisioning Profile**

### Opción 1 - Automático (recomendado):
```bash
# Desde tu carpeta de descargas
open ~/Downloads/Apuntador_App_Store_Distribution.mobileprovision
```

### Opción 2 - Manual:
1. **Xcode** → **Preferences** → **Accounts**
2. **Selecciona tu Apple ID** → **Download Manual Profiles**

### Verificar instalación:
```bash
# Ver profiles instalados
ls ~/Library/MobileDevice/Provisioning\ Profiles/
```

---

## 📋 **Paso 5: Convertir a Base64 (para GitHub Actions)**

Una vez que tengas el archivo `.mobileprovision`:

```bash
# Ir a la carpeta de descargas
cd ~/Downloads

# Convertir a Base64 
base64 -i Apuntador_App_Store_Distribution.mobileprovision | pbcopy

# El resultado está en tu clipboard, listo para GitHub Secrets
```

---

## 🎯 **Resumen de lo que necesitas**

### Para crear el Provisioning Profile necesitas:
1. ✅ **App ID**: `io.apuntador.app` (verificar que existe)
2. ✅ **Certificado**: Apple Distribution: Lino Figueroa (ya lo tienes)
3. ✅ **Tipo**: App Store Distribution (no Ad Hoc)

### Archivos finales para GitHub Actions:
1. ✅ **ApuntadorDistribution.p12** (certificado + clave privada)
2. ✅ **Contraseña del .p12** (la que pusiste al exportar)
3. 🔄 **Apuntador_App_Store_Distribution.mobileprovision** (nuevo)

---

## 🆘 **Posibles problemas**

### "No veo mi certificado en la lista"
- **Causa**: El certificado no está instalado correctamente
- **Solución**: Doble-click en el `.cer` otra vez

### "App ID no aparece"  
- **Causa**: App ID no existe o no coincide el Bundle ID
- **Solución**: Verificar que sea exactamente `io.apuntador.app`

### "Profile creation failed"
- **Causa**: Certificado expirado o App ID inválido
- **Solución**: Verificar fechas y Bundle ID

---

## 🚀 **Siguiente paso**

Una vez que tengas el **Provisioning Profile creado y descargado**:

1. **Convertir a Base64** (comando de arriba)
2. **Configurar GitHub Secrets**
3. **Probar la automatización**

**¿Estás listo para ir al Apple Developer Portal a crear el Provisioning Profile?**

---

**📞 Avísame cuando llegues a cualquier paso y te ayudo con los detalles específicos.**