# Configurar GitHub Secrets para iOS - Paso Final

**Status**: ✅ Certificados y Provisioning Profile creados  
**Siguiente**: Configurar automatización GitHub Actions

---

## 🎯 **Archivos que tienes**

Verificamos que tengas estos archivos:
- ✅ **ApuntadorDistribution.p12** (certificado + clave privada)
- ✅ **Contraseña del .p12** (la que pusiste al exportar)
- ✅ **[nombre].mobileprovision** (provisioning profile descargado)

---

## 📋 **Paso 1: Convertir archivos a Base64**

### A. Convertir certificado P12 a Base64:

```bash
# Desde tu carpeta del proyecto
base64 -i ApuntadorDistribution.p12 | pbcopy
```
**📋 Resultado copiado al clipboard** - Guárdalo como `CERTIFICATE_BASE64`

### B. Convertir Provisioning Profile a Base64:

```bash
# Ir a descargas (donde descargaste el .mobileprovision)
cd ~/Downloads

# Convertir el provisioning profile (cambia el nombre si es diferente)
base64 -i Apuntador_App_Store_Distribution.mobileprovision | pbcopy
```
**📋 Resultado copiado al clipboard** - Guárdalo como `PROFILE_BASE64`

---

## 📋 **Paso 2: Obtener Team ID**

```bash
# Ver tu Team ID desde el certificado
security find-identity -v -p codesigning | grep "Apple Distribution"
```

Busca algo como: `"Apple Distribution: Lino Figueroa (ABC123DEF)"`  
**Tu Team ID es**: `ABC123DEF` (los caracteres entre paréntesis)

---

## 📋 **Paso 3: Crear GitHub Secrets**

Ve a tu repositorio GitHub:
**GitHub.com** → **tu-repo** → **Settings** → **Secrets and variables** → **Actions**

### Secrets requeridos:

| Secret Name | Valor | Descripción |
|-------------|-------|-------------|
| `IOS_CERTIFICATE_BASE64` | [Resultado Paso 1A] | Certificado P12 en base64 |
| `IOS_CERTIFICATE_PASSWORD` | [Tu contraseña P12] | Contraseña del certificado |
| `IOS_PROVISIONING_PROFILE_BASE64` | [Resultado Paso 1B] | Profile en base64 |
| `IOS_TEAM_ID` | [Resultado Paso 2] | Team ID de Apple Developer |
| `KEYCHAIN_PASSWORD` | `build123!` | Contraseña temporal (cualquiera) |

### Secrets opcionales (para TestFlight automático):

| Secret Name | Valor | Descripción |
|-------------|-------|-------------|
| `APP_STORE_CONNECT_API_KEY_ID` | [8 caracteres] | API Key ID |
| `APP_STORE_CONNECT_API_ISSUER_ID` | [UUID] | Issuer ID |
| `APP_STORE_CONNECT_API_KEY_BASE64` | [P8 en base64] | API Key file |

---

## 📋 **Paso 4: Probar la configuración**

Una vez configurados los secrets, puedes probar:

```bash
# Probar GitHub Actions workflow
npm run ios:testflight
```

O manualmente en GitHub:
1. **Actions** → **Build iOS App Store Package**
2. **Run workflow** con parámetros de prueba

---

## 🚀 **Comandos para ejecutar ahora**

Ejecuta estos comandos uno por uno:

### 1. Convertir certificado:
```bash
base64 -i ApuntadorDistribution.p12 | pbcopy
echo "✅ Certificado P12 copiado al clipboard"
```

### 2. Convertir provisioning profile:
```bash
cd ~/Downloads
ls -la *.mobileprovision
# Nota el nombre exacto del archivo, luego:
base64 -i [NOMBRE_EXACTO].mobileprovision | pbcopy
echo "✅ Provisioning Profile copiado al clipboard"
```

### 3. Obtener Team ID:
```bash
security find-identity -v -p codesigning | grep "Apple Distribution"
```

**¿Quieres que ejecutemos el primer comando para convertir el certificado P12?**