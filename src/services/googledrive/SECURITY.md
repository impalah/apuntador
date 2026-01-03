# Google Drive OAuth Security Considerations

## TL;DR

Google OAuth requiere `client_secret` para aplicaciones web/desktop, pero este secret **no se puede proteger completamente** en aplicaciones distribuidas. Esto es una **limitación conocida de Google OAuth** y una práctica ampliamente aceptada en la industria, mitigada por OAuth 2.0 + PKCE.

## El Problema

### Configuración Actual

Apuntador usa:
- **Tipo de cliente**: "Aplicación de escritorio" en Google Cloud Console
- **Flujo OAuth**: Authorization Code Flow + PKCE
- **Client Secret**: Almacenado en variables de entorno (`.env` local, GitHub Secrets para CI/CD)

### ¿Por Qué No Se Puede Proteger el Secret?

En aplicaciones distribuidas (SPA, móvil, desktop):

1. **Web (SPA)**:
   - El código JavaScript es público
   - Variables de entorno se compilan en el bundle
   - DevTools puede interceptar todas las requests
   - Cualquier usuario puede inspeccionar el código fuente

2. **Mobile (Capacitor)**:
   - APK/IPA pueden ser desensamblados
   - Herramientas como `apktool`, `jadx` extraen código
   - Variables de entorno compiladas son legibles

3. **Desktop (Tauri)**:
   - Binarios pueden ser desensamblados
   - Debuggers pueden inspeccionar memoria
   - Archivos de configuración son accesibles

### ¿Por Qué Google Lo Requiere Entonces?

Esta es una **inconsistencia en la implementación de Google OAuth**:

- La [documentación oficial](https://developers.google.com/identity/protocols/oauth2/native-app) dice:
  > `client_secret`: **Opcional**... no se aplica a Android, iOS o Chrome

- Pero en la **práctica** (2025), Google API rechaza requests sin `client_secret` para tipo "Aplicación de escritorio" con error:
  ```
  {
    "error": "invalid_client",
    "error_description": "The OAuth client was not found."
  }
  ```

## ¿Es Esto Seguro?

### Mitigaciones Implementadas

A pesar de la limitación, el riesgo es **aceptable** por:

1. **OAuth 2.0 + PKCE**:
   - Protege contra intercepción de authorization code
   - Code verifier/challenge único por sesión
   - Imposible reutilizar códigos interceptados

2. **Tokens Efímeros**:
   - Access tokens expiran en ~1 hora
   - Refresh tokens vinculados al usuario específico
   - No se pueden transferir entre usuarios

3. **Scopes Limitados**:
   - Solo acceso a Google Drive
   - Usuario debe autorizar explícitamente
   - Usuario puede revocar en cualquier momento

4. **Cuotas de API**:
   - Google limita requests por proyecto
   - Previene uso abusivo masivo
   - Monitoreo de anomalías

5. **Sin Backend Persistente**:
   - Tokens solo en localStorage del usuario
   - No hay base de datos central para hackear
   - Cada usuario gestiona sus propios tokens

### Nivel de Riesgo Real

**Riesgo Bajo** porque:

[ERROR] **Atacante NO puede**:
- Acceder a cuentas de otros usuarios sin su consentimiento
- Reutilizar authorization codes interceptados (PKCE lo previene)
- Escalar más allá de las cuotas de API de Google
- Obtener datos sin autorización explícita del usuario

[OK] **Atacante PUEDE** (pero con impacto limitado):
- Extraer el `client_secret` del código
- Hacer requests a Google Drive API bajo tu proyecto
- Consumir tu cuota de API (hasta límites de Google)

**Impacto**: Si el secret es comprometido, el atacante podría:
- Hacer spam de requests OAuth (limitado por cuotas)
- Consumir tu quota de API gratuita
- **NO** puede acceder a datos de usuarios sin su autorización

## Alternativas Más Seguras

### Opción 1: Backend OAuth Proxy (Recomendado para Producción)

**Arquitectura**:
```
Usuario → Apuntador (SPA) → Backend Proxy → Google OAuth
                              └─ client_secret aquí (seguro)
```

**Ventajas**:
- [OK] `client_secret` protegido servidor-side
- [OK] Control total sobre el flujo OAuth
- [OK] Posibilidad de agregar rate limiting adicional
- [OK] Auditoría centralizada de accesos

**Desventajas**:
- [ERROR] Requiere infraestructura de servidor
- [ERROR] Costos de hosting y mantenimiento
- [ERROR] Complejidad adicional en deployment
- [ERROR] Punto único de fallo

**Implementación**:
```typescript
// Backend (Node.js/Express)
app.post('/oauth/token', async (req, res) => {
  const { code, code_verifier } = req.body
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET, // Seguro aquí
      code,
      code_verifier,
      grant_type: 'authorization_code',
      redirect_uri: 'https://app.apuntador.io/oauth-callback'
    })
  })
  
  res.json(await response.json())
})
```

### Opción 2: Google Sign-In SDK

**Usar**: [Sign In With Google](https://developers.google.com/identity/gsi/web/guides/overview)

**Ventajas**:
- [OK] No requiere `client_secret`
- [OK] Flujo simplificado y optimizado
- [OK] Mejor UX con UI de Google
- [OK] Mantenido oficialmente por Google

**Desventajas**:
- [ERROR] Menos control sobre el flujo OAuth
- [ERROR] Limitado a web (no funciona en Capacitor/Tauri sin adaptación)
- [ERROR] Requiere reescribir la integración actual

### Opción 3: Clientes Nativos (Android/iOS)

**Crear clientes específicos** tipo "Android" / "iOS" en Google Cloud Console.

**Ventajas**:
- [OK] **NO requieren** `client_secret` (confirmado por docs oficiales)
- [OK] Más seguro para apps nativas
- [OK] Validación de firma de app

**Desventajas**:
- [ERROR] No funciona para web (SPA)
- [ERROR] Requiere configuraciones separadas por plataforma
- [ERROR] Package name / Bundle ID deben coincidir exactamente

## Recomendación Final

### Para Desarrollo y Uso Personal
[OK] **Configuración actual es suficiente**:
- Client secret en `.env` local
- OAuth 2.0 + PKCE
- Riesgo bajo y mitigado

### Para Distribución Pública Limitada (< 100 usuarios)
[OK] **Configuración actual con monitoreo**:
- Client secret en GitHub Secrets para builds automatizados
- Monitorear cuotas en Google Cloud Console
- Documentar limitaciones claramente

### Para Producción/Distribución Masiva
[WARNING] **Considerar implementar Backend OAuth Proxy**:
- Protección completa del client_secret
- Control y auditoría centralizados
- Mejor experiencia de usuario (sin rate limits visibles)

## Monitoreo y Detección

### Google Cloud Console

Monitorea el uso de tu proyecto:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto Apuntador
3. **APIs y servicios** → **Panel de control**
4. Revisa:
   - Requests por día
   - Errores
   - Cuotas consumidas

### Alertas Recomendadas

Configura alertas si:
- Requests exceden 10,000/día (uso anormal)
- Tasa de errores > 5%
- Cuota alcanza 80% del límite

### En Caso de Compromiso

Si sospechas que el secret fue comprometido:

1. **Rotar credenciales**:
   - Crear nuevo cliente OAuth en Google Cloud Console
   - Actualizar `VITE_GOOGLE_DRIVE_CLIENT_ID` y `_CLIENT_SECRET`
   - Invalidar cliente anterior

2. **Revocar tokens existentes**:
   - Los usuarios deberán re-autorizar
   - Tokens antiguos dejarán de funcionar

3. **Investigar**:
   - Revisar logs de Google Cloud Console
   - Identificar patrones de uso anormal

## Referencias

- [OAuth 2.0 for Mobile & Desktop Apps - Google](https://developers.google.com/identity/protocols/oauth2/native-app)
- [OAuth 2.0 RFC 8252 - Best Practices for Native Apps](https://tools.ietf.org/html/rfc8252)
- [OAuth 2.0 PKCE RFC 7636](https://tools.ietf.org/html/rfc7636)
- [OAuth 2.0 Security Best Current Practice](https://tools.ietf.org/html/draft-ietf-oauth-security-topics)

## Conclusión

El uso de `client_secret` en aplicaciones públicas es una **limitación conocida** pero **práctica ampliamente aceptada** en la industria cuando:

1. Se usa con OAuth 2.0 + PKCE
2. Los scopes son limitados
3. Los tokens son efímeros
4. El riesgo se entiende y monitorea

Para Apuntador, la configuración actual ofrece un **balance razonable entre seguridad, simplicidad y costo** para uso personal y distribución limitada. Para producción masiva, considera implementar un backend OAuth proxy.

---

**Última actualización**: Octubre 2025
**Autor**: Equipo Apuntador
**Licencia**: Ver LICENSE en raíz del proyecto
