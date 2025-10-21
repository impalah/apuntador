# Instrucciones para probar Dropbox OAuth en iOS

## ✅ Configuración completada

### 🔧 **Cambios implementados:**

1. **Info.plist configurado** con URL scheme:
   ```xml
   <key>CFBundleURLTypes</key>
   <array>
     <dict>
       <key>CFBundleURLName</key>
       <string>io.apuntador.app.oauth</string>
       <key>CFBundleURLSchemes</key>
       <array>
         <string>apuntador</string>
       </array>
     </dict>
   </array>
   ```

2. **Browser plugin instalado** (`@capacitor/browser@7.0.2`) para abrir URLs externas

3. **DropboxService actualizado** para detectar plataforma iOS:
   - Web: Usa `window.location.href` (redirección directa)
   - iOS/Android: Usa `Browser.open()` (navegador del sistema)

4. **Deep links actualizados** con logs específicos por plataforma (iOS/Android)

### 🚀 **Cómo probar:**

1. **Compilar para iOS:**
   ```bash
   npm run ios:build
   npx cap open ios
   ```

2. **Ejecutar en simulador iOS:**
   ```bash
   npm run ios:run:iphone-pro
   ```

3. **Pasos de prueba:**
   - Abrir la app en el simulador iOS
   - Ir al editor (`/edit`)
   - Hacer clic en el botón de "Abrir desde nube" (icono de nube)
   - Hacer clic en "Conectar con Dropbox"

### 📋 **Flujo esperado:**

1. **App abre Browser del sistema** con la URL de autorización de Dropbox
2. **Usuario se autentica** en Dropbox en Safari
3. **Dropbox redirige** a `apuntador://oauth-callback?code=...`
4. **iOS llama a la app** con el deep link
5. **App procesa el código** y completa la autenticación
6. **Usuario puede explorar** sus archivos de Dropbox

### 🔍 **Logs a revicar:**

- `🔗 [IOS] Deep link received: apuntador://oauth-callback?code=...`
- `🚀 [IOS] Processing Dropbox OAuth deep link`
- `📋 [IOS] OAuth params - code: PRESENT`
- `✅ [IOS] Navigated to OAuth callback page`

### ⚠️ **Diferencias vs Android:**

- **iOS**: Abre Safari para OAuth, regresa a la app via deep link
- **Android**: Puede usar WebView interno o navegador externo
- **Web**: Redirección directa en la misma pestaña

### 🛠️ **Troubleshooting:**

Si no funciona:

1. **Verificar URL scheme** en Info.plist
2. **Revisar logs** en Xcode console
3. **Confirmar Browser plugin** en capacitor.config.json
4. **Probar deep link manualmente** con Safari: `apuntador://oauth-callback?code=test`

### 📱 **Comandos útiles:**

```bash
# Compilar y abrir Xcode
npm run ios:dev

# Ejecutar en simulador específico
npm run ios:run:iphone-pro
npm run ios:run:ipad

# Solo sincronizar cambios
npx cap sync ios

# Ver logs en tiempo real
npx cap run ios --livereload --external
```

---

## ✨ **Estado actual:**

- ✅ **Web**: Dropbox OAuth funcionando
- ✅ **Android**: Dropbox OAuth funcionando  
- 🧪 **iOS**: Configuración completa, listo para pruebas

La implementación debe funcionar de manera similar a Android, usando el navegador del sistema para OAuth y deep links para regresar a la app.