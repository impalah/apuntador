# Guía completa: Crear aplicación Dropbox para Apuntador

Esta guía te llevará paso a paso para crear una aplicación Dropbox y obtener las credenciales necesarias para integrar Dropbox con Apuntador.

## 📋 Requisitos previos

- **Cuenta Dropbox**: Personal o Business (gratuita válida)
- **Acceso a internet** para configurar la aplicación
- **10 minutos** de tu tiempo

---

## 🎯 Paso 1: Acceder al Dropbox App Console

1. **Abrir navegador** y ir a: https://www.dropbox.com/developers/apps
2. **Iniciar sesión** con tu cuenta Dropbox
3. Hacer clic en **"Create app"** (botón azul en la esquina superior derecha)

![Dropbox Console](../docs/images/dropbox-console.png) <!-- Placeholder -->

---

## ⚙️ Paso 2: Configurar la aplicación

### 2.1 Seleccionar API
- **Opción recomendada**: `Dropbox API`
- **NO seleccionar**: Dropbox Business API (más restrictiva)

### 2.2 Configurar permisos de acceso
- **Opción recomendada**: `App folder`
  - ✅ **Ventaja**: Solo accede a `/Apps/Apuntador/`
  - ✅ **Seguridad**: No puede ver otros archivos del usuario
  - ✅ **Aprobación**: Más fácil para stores (Play/App Store)

- **Alternativa**: `Full Dropbox` 
  - ⚠️ **Cuidado**: Acceso total a Dropbox del usuario
  - ⚠️ **Revisión**: Requiere justificación en stores

### 2.3 Nombrar la aplicación
- **Nombre sugerido**: `Apuntador` o `Apuntador Teleprompter`
- **Restricción**: El nombre debe ser único globalmente
- **Consejo**: Si está ocupado, prueba: `Apuntador-[tunombre]`

### 2.4 Finalizar creación
- Hacer clic en **"Create app"**
- ✅ **Éxito**: Serás redirigido a la configuración de la app

---

## 🔑 Paso 3: Obtener credenciales

### 3.1 Localizar App key (Client ID)
```
📍 Ubicación: Settings > Basic information > App key
📋 Formato: Texto alfanumérico (ej: abc123xyz789)
🎯 Uso: Client ID para OAuth en Apuntador
```

**Copiar y guardar este valor** - lo necesitarás para la configuración.

### 3.2 App secret (NO necesario para SPA)
- **⚠️ IMPORTANTE**: NO uses App secret en aplicaciones web/móviles
- **Razón**: Se expone en el código cliente (inseguro)
- **Solución**: Usaremos OAuth 2.0 + PKCE (más seguro)

---

## 🌐 Paso 4: Configurar URLs de redirección

### 4.1 Para desarrollo web local
```
Redirect URIs:
- http://localhost:3000/oauth-callback
- http://127.0.0.1:3000/oauth-callback
```

### 4.2 Para producción web
```
Redirect URIs:
- https://app.apuntador.io/oauth-callback
- https://tu-dominio.com/oauth-callback (otros dominios si necesario)
```

### 4.3 Para aplicaciones móviles (Capacitor)
```
Redirect URIs:
- apuntador://oauth-callback
- com.tuapp.apuntador://oauth-callback
```

### 4.4 Cómo añadir URLs de redirección
1. Ir a **Settings > OAuth 2**
2. En **Redirect URIs**, hacer clic en **"Add"**
3. Introducir cada URL **una por línea**
4. Hacer clic en **"Add"** para cada una
5. **Guardar cambios** al final

![Redirect URIs](../docs/images/dropbox-redirect-uris.png) <!-- Placeholder -->

---

## 🔧 Paso 5: Configurar permisos detallados

### 5.1 Scopes necesarios para Apuntador
En **Settings > Permissions**, habilitar:

- ✅ `files.metadata.write` - Leer metadatos de archivos
- ✅ `files.metadata.read` - Escribir metadatos de archivos  
- ✅ `files.content.write` - Escribir contenido de archivos
- ✅ `files.content.read` - Leer contenido de archivos

### 5.2 Permisos opcionales (según necesidades futuras)
- `account_info.read` - Info básica de cuenta (nombre, email)
- `sharing.read` - Leer enlaces compartidos (si planeas compartir scripts)

### 5.3 ⚠️ Importante después de cambios
- **Guardar**: Hacer clic en **"Submit"** 
- **Regenerar tokens**: Los cambios pueden invalidar tokens existentes

---

## 📱 Paso 6: Configuración específica para móviles

### 6.1 Para Android (Play Store)
1. En **Settings > Branding**, añadir:
   - **App icon**: Logo de Apuntador (PNG 256x256)
   - **Description**: Descripción clara del uso de Dropbox
   
2. **Texto sugerido para descripción**:
```
Apuntador es un teleprompter que permite a los usuarios 
abrir y guardar sus scripts directamente desde Dropbox 
para sincronizar entre dispositivos.
```

### 6.2 Para iOS (App Store)
- **Misma configuración** que Android
- **Adicional**: Apple puede solicitar **justificación por escrito** del uso de Dropbox

---

## 📋 Paso 7: Información para desarrollo

### 7.1 Datos que necesitas para Apuntador
```typescript
// Configuración para desarrollo
const DROPBOX_CONFIG = {
  clientId: 'qej36t232go21e8',        // Tu App ID de Dropbox
  redirectUri: 'http://localhost:3000/oauth-callback', // Del paso 4.1
  scope: 'files.metadata.read files.content.read files.content.write'
}
```

### 7.2 Datos que necesitas para producción
```typescript
// Configuración para producción
const DROPBOX_CONFIG = {
  clientId: 'qej36t232go21e8',        // El mismo App key
  redirectUri: 'https://app.apuntador.io/oauth-callback', // Tu dominio real
  scope: 'files.metadata.read files.content.read files.content.write'
}
```

---

## ✅ Verificación final

### Checklist antes de continuar:
- [ ] App creada en Dropbox Console
- [ ] App key copiado y guardado
- [ ] URLs de redirección configuradas para desarrollo
- [ ] URLs de redirección configuradas para producción  
- [ ] URLs de redirección configuradas para móvil
- [ ] Permisos necesarios habilitados
- [ ] Descripción y branding completados (para móvil)

### 🎯 Siguientes pasos
Con esta configuración completada, estarás listo para:
1. **Fase 2**: Implementar la integración en Apuntador
2. **Fase 3**: Probar en versión web
3. **Fase 4-5**: Desplegar en móviles

---

## 🆘 Troubleshooting común

### "App name already exists"
- **Solución**: Añadir sufijo único: `Apuntador-[inicialestuyas]`
- **Ejemplo**: `Apuntador-JD`, `Apuntador-Dev2024`

### "Invalid redirect URI"
- **Verificar**: URLs exactas (incluyendo protocolo http/https)
- **Comprobar**: No hay espacios extras o saltos de línea
- **Confirmar**: Hacer clic en "Add" después de cada URL

### "Permission denied" durante OAuth
- **Causa**: Permisos no configurados en step 5.1
- **Solución**: Revisar y habilitar scopes necesarios
- **Importante**: Guardar cambios con "Submit"

### OAuth funciona en desarrollo pero falla en producción
- **Causa común**: URLs de producción no configuradas
- **Solución**: Añadir URLs de producción en paso 4.2
- **Verificar**: SSL habilitado (https://) en producción

---

## 📞 Soporte adicional

- **Documentación oficial**: https://developers.dropbox.com/
- **Dropbox API Explorer**: https://dropbox.github.io/dropbox-api-v2-explorer/
- **Comunidad**: https://www.dropboxforum.com/

---

*Creado para Apuntador v1.1.3 - Actualizado: Octubre 2025*