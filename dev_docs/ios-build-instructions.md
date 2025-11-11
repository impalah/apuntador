# 📱 Instrucciones para Build y Distribución iOS

## ✅ **Estado Actual**
- ✅ Proyecto web construido (`npm run build`)
- ✅ Sincronización con Capacitor completada (`npx cap sync ios`)
- ✅ Xcode abierto (`npx cap open ios`)
- ✅ Certificado de Development disponible
- ✅ Provisioning Profile instalado

## 🔧 **Próximos Pasos en Xcode**

### 1. **Configurar Signing & Capabilities**
   - Selecciona el proyecto **"App"** en el navegador izquierdo
   - Ve a la pestaña **"Signing & Capabilities"**
   - Asegúrate que **Team** esté seleccionado: **"Lino Figueroa (B9VZ5U9FAZ)"**
   - En **Provisioning Profile**: Selecciona **"Apuntador App Store Distribution"**

### 2. **Actualizar Versión y Build**
   - En **General** → **Identity**:
   - **Version**: `1.0.28` (o la versión actual que quieras)
   - **Build**: `106` (debe ser mayor que la última subida)

### 3. **Configurar para Archive**
   - Selecciona **"Any iOS Device (arm64)"** como destino (arriba izquierda)
   - Ve a **Product** → **Archive**
   - Xcode creará el archivo `.xcarchive`

### 4. **Distribución a App Store**
   Una vez completado el Archive:
   - Se abrirá **Organizer**
   - Selecciona **"Distribute App"**
   - Elige **"App Store Connect"**
   - Selecciona **"Upload"**
   - Sigue el proceso de distribución

## 🔐 **Certificados y Firmas**
- **Bundle ID**: `io.apuntador.app`
- **Team ID**: `B9VZ5U9FAZ`
- **Provisioning Profile**: `Apuntador App Store Distribution`
- **Certificado**: Apple Development (disponible) o Apple Distribution (si lo instalas)

## 🚀 **Automatización con Script (Opcional)**

Si quieres automatizar parte del proceso, puedes usar:

```bash
# Actualizar versión en Info.plist
/usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString 1.0.28" ios/App/App/Info.plist
/usr/libexec/PlistBuddy -c "Set :CFBundleVersion 106" ios/App/App/Info.plist

# Archive desde línea de comandos
xcodebuild archive \
  -workspace ios/App/App.xcworkspace \
  -scheme App \
  -configuration Release \
  -archivePath ~/Desktop/Apuntador.xcarchive

# Upload a App Store Connect (necesita API key)
xcrun altool --upload-app \
  --type ios \
  --file "Apuntador.ipa" \
  --apiKey "TU_API_KEY" \
  --apiIssuer "TU_ISSUER_ID"
```

## 📋 **Checklist Final**
- [ ] Versión actualizada en Xcode
- [ ] Build number incrementado
- [ ] Signing configurado correctamente
- [ ] Archive creado exitosamente
- [ ] Upload a App Store Connect
- [ ] Verificar en App Store Connect que la build aparece
- [ ] Configurar metadata si es necesario
- [ ] Enviar para revisión de Apple

## 🔗 **Enlaces Útiles**
- [App Store Connect](https://appstoreconnect.apple.com)
- [Xcode Organizer](xcode://organizer)
- [TestFlight](https://testflight.apple.com)