# Configuración de Google Drive para Apuntador

Esta guía te ayudará a configurar la integración de Google Drive en Apuntador para poder abrir y guardar archivos markdown directamente en la nube.

## Requisitos Previos

- Cuenta de Google (Gmail)
- Acceso a [Google Cloud Console](https://console.cloud.google.com/)
- Proyecto Apuntador clonado localmente

## Paso 1: Crear Proyecto en Google Cloud Console

### 1.1 Acceder a Google Cloud Console

1. Ve a https://console.cloud.google.com/
2. Inicia sesión con tu cuenta de Google
3. Si es tu primera vez, acepta los Términos de Servicio

### 1.2 Crear Nuevo Proyecto

1. Click en el **selector de proyectos** (esquina superior izquierda, junto al logo de Google Cloud)
2. En el diálogo que aparece, click en **"Nuevo proyecto"** (esquina superior derecha)
3. Completa la información:
   - **Nombre del proyecto**: `Apuntador` (o el nombre que prefieras)
   - **Organización**: Déjalo como está (Sin organización)
   - **Ubicación**: Déjalo como está
4. Click en **"Crear"**
5. Espera unos segundos mientras se crea el proyecto
6. Asegúrate de que el nuevo proyecto esté seleccionado en el selector de proyectos

## Paso 2: Habilitar Google Drive API

### 2.1 Acceder a la Biblioteca de APIs

1. En el menú de navegación lateral (☰), ve a:
   - **"APIs y servicios"** → **"Biblioteca"**
2. O usa el buscador superior y escribe "API Library"

### 2.2 Habilitar Drive API

1. En el buscador de la biblioteca, escribe: `Google Drive API`
2. Click en **"Google Drive API"** en los resultados
3. Click en el botón azul **"Habilitar"**
4. Espera unos segundos mientras se habilita la API
5. Serás redirigido a la página de información de la API

## Paso 3: Configurar Pantalla de Consentimiento OAuth

La pantalla de consentimiento es lo que los usuarios verán cuando autoricen a Apuntador.

### 3.1 Acceder a Configuración OAuth

1. En el menú lateral, ve a:
   - **"APIs y servicios"** → **"Pantalla de consentimiento de OAuth"**

### 3.2 Seleccionar Tipo de Usuario

1. Selecciona **"Externo"** (permite que cualquier usuario con cuenta de Google use la app)
   - Si tienes Google Workspace, puedes elegir "Interno" para restringir solo a tu organización
2. Click en **"Crear"**

### 3.3 Configurar Información de la Aplicación

**Página 1: Información de la aplicación OAuth**

Completa los siguientes campos:

- **Nombre de la aplicación**: `Apuntador`
- **Correo electrónico de asistencia al usuario**: Tu email de Google
- **Logo de la aplicación** (opcional): Puedes omitirlo o subir un logo cuadrado (120x120 px mínimo)
- **Dominios de la aplicación** (opcional):
  - Página principal de la aplicación: `https://apuntador.io` (o tu dominio)
  - Política de privacidad: Déjalo vacío por ahora
  - Condiciones del servicio: Déjalo vacío por ahora
- **Dominios autorizados**: 
  - Agrega `apuntador.io` (o tu dominio de producción)
  - Agrega `localhost` (para desarrollo)
- **Información de contacto del desarrollador**: Tu email

Click en **"Guardar y continuar"**

**Página 2: Ámbitos (Scopes)**

1. Click en **"Agregar o quitar ámbitos"**
2. En el buscador de ámbitos, busca: `drive.file`
3. Selecciona estas dos opciones:
   ```
   .../auth/drive.file
   Ver, editar, crear y borrar solo los archivos de Google Drive 
   específicos que uses con esta aplicación
   
   .../auth/drive.appdata
   Ver y administrar los datos de configuración propios de la aplicación 
   en tu Google Drive
   ```
4. Click en **"Actualizar"** (abajo)
5. Verifica que los ámbitos aparezcan en la lista
6. Click en **"Guardar y continuar"**

**Página 3: Usuarios de prueba** (solo si elegiste "Externo")

1. Click en **"+ Agregar usuarios"**
2. Agrega los emails que usarás para probar:
   - Tu email principal
   - Otros emails de prueba si necesitas
3. Click en **"Agregar"**
4. Click en **"Guardar y continuar"**

**Página 4: Resumen**

1. Revisa toda la información
2. Click en **"Volver al panel"**

> **Nota**: Tu aplicación quedará en estado "En producción - Testing" que permite hasta 100 usuarios de prueba. Para publicarla completamente necesitarás verificación de Google.

## Paso 4: Crear Credenciales OAuth 2.0

### 4.1 Acceder a Credenciales

1. En el menú lateral, ve a:
   - **"APIs y servicios"** → **"Credenciales"**

### 4.2 Crear ID de Cliente OAuth

1. Click en **"+ Crear credenciales"** (parte superior)
2. Selecciona **"ID de cliente de OAuth"**

### 4.3 Configurar Cliente Web

1. **Tipo de aplicación**: Selecciona **"Aplicación web"**
2. **Nombre**: `Apuntador Web Client` (o el nombre que prefieras)

### 4.4 Configurar URIs de Redirección

**⚠️ IMPORTANTE**: Estas URIs deben coincidir exactamente con lo que usa la aplicación.

En la sección **"URIs de redireccionamiento autorizados"**:

1. Click en **"+ Agregar URI"**
2. Agrega **cada una de estas URIs** (una por vez):

```
http://localhost:3000/oauth-callback
```
(Para desarrollo local)

```
https://app.apuntador.io/oauth-callback
```
(Para producción web - ajusta el dominio si usas otro)

```
apuntador://oauth-callback
```
(Para aplicación nativa Android/iOS con deep linking)

3. Verifica que las 3 URIs estén agregadas
4. Click en **"Crear"**

### 4.5 Guardar Client ID

1. Aparecerá un diálogo con tus credenciales
2. **Copia el "ID de cliente"** - se ve así:
   ```
   123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
   ```
3. **Guárdalo en un lugar seguro** (lo necesitarás en el siguiente paso)
4. **NO compartas el Client ID públicamente** aunque no es tan sensible como una API key
5. Click en **"Aceptar"**

> **Nota**: No necesitas el "Client Secret" ya que usamos PKCE (Proof Key for Code Exchange) para mayor seguridad en aplicaciones públicas.

## Paso 5: Configurar Apuntador

### 5.1 Crear Archivo de Variables de Entorno

En la raíz del proyecto Apuntador:

```bash
# Copia el archivo de ejemplo
cp .env.example .env
```

### 5.2 Editar .env

Abre el archivo `.env` con tu editor favorito y agrega tu Client ID:

```env
# Google Drive API Configuration
VITE_GOOGLE_DRIVE_CLIENT_ID=TU-CLIENT-ID-AQUI.apps.googleusercontent.com
```

**Ejemplo real**:
```env
VITE_GOOGLE_DRIVE_CLIENT_ID=123456789012-abc123def456ghi789jkl012mno345pq.apps.googleusercontent.com
```

> **⚠️ Importante**: 
> - El nombre de la variable DEBE empezar con `VITE_` para que Vite la incluya en el build
> - Reemplaza `TU-CLIENT-ID-AQUI` con tu Client ID real
> - No uses comillas alrededor del valor

### 5.3 Reiniciar Servidor de Desarrollo

Si ya tenías el servidor corriendo, reinícialo para que cargue la nueva variable:

```bash
# Detén el servidor actual (Ctrl+C)
# Luego inicia de nuevo
npm run dev
```

## Paso 6: Probar la Integración

### 6.1 Abrir Apuntador

1. Abre tu navegador y ve a: http://localhost:3000
2. Deberías ver la interfaz de Apuntador

### 6.2 Ir a Configuración Cloud

1. Click en el **icono de configuración** (⚙️ esquina superior derecha)
2. Selecciona la pestaña **"Cloud"**
3. Deberías ver dos tarjetas:
   - **Dropbox** (con icono de Dropbox)
   - **Google Drive** (con icono de Google Drive)

### 6.3 Conectar Google Drive

1. En la tarjeta de **Google Drive**, click en el botón **"Conectar"**
2. Se abrirá una nueva ventana/pestaña con la página de Google
3. **Selecciona tu cuenta de Google** (debe estar en la lista de usuarios de prueba)
4. **Revisa los permisos** que solicita la app:
   - Ver y administrar archivos de Google Drive creados por esta app
   - Ver y administrar datos de configuración de la app
5. Click en **"Permitir"**
6. Serás redirigido de vuelta a Apuntador

### 6.4 Verificar Conexión

1. Deberías volver automáticamente a la página de Settings → Cloud
2. La tarjeta de **Google Drive** ahora debe mostrar:
   - Estado: **"Conectado"** con check verde ✓
   - Tu nombre y email de Google
   - Botón **"Proveedor activo"** o **"Establecer como activo"**

### 6.5 Probar Explorador de Archivos

1. Ve al **Editor** (icono de lápiz ✏️)
2. Click en el botón **"Abrir"** (📁)
3. Selecciona la pestaña **"Cloud"**
4. Deberías ver el explorador de archivos de Google Drive
5. Inicialmente estará vacío (mostrará "No hay archivos en esta carpeta")

### 6.6 Subir un Archivo de Prueba

1. En el editor, escribe algo de contenido markdown
2. Click en el botón **"Guardar"** (💾)
3. Selecciona la pestaña **"Cloud"**
4. Escribe un nombre de archivo: `prueba.md`
5. Click en **"Guardar"**
6. Ve a tu Google Drive en el navegador
7. Deberías ver el archivo `prueba.md` en la carpeta raíz

## Solución de Problemas

### Error: "redirect_uri_mismatch"

**Síntoma**: Aparece un error de Google diciendo que la URI de redirección no coincide.

**Solución**:
1. Ve a Google Cloud Console → Credenciales
2. Edita tu ID de cliente OAuth
3. Verifica que las URIs de redirección sean **exactamente**:
   ```
   http://localhost:3000/oauth-callback
   https://app.apuntador.io/oauth-callback
   apuntador://oauth-callback
   ```
4. Asegúrate de NO tener espacios extra o barras adicionales al final
5. Guarda los cambios
6. **Espera 5 minutos** antes de volver a probar (los cambios tardan en propagarse)

### Error: "Access blocked: This app's request is invalid"

**Síntoma**: Google bloquea el acceso diciendo que la solicitud es inválida.

**Solución**:
1. Verifica que hayas completado la **Pantalla de Consentimiento OAuth**
2. Asegúrate de haber agregado los **scopes correctos**:
   - `.../auth/drive.file`
   - `.../auth/drive.appdata`
3. Si elegiste "Externo", verifica que tu email esté en **Usuarios de prueba**

### No aparece el botón de Google Drive

**Síntoma**: Solo aparece Dropbox en la configuración Cloud.

**Solución**:
1. Verifica que el archivo `.env` esté en la **raíz del proyecto**
2. Abre `.env` y verifica que la línea sea:
   ```env
   VITE_GOOGLE_DRIVE_CLIENT_ID=tu-client-id-aqui
   ```
3. Verifica que NO tenga comillas
4. Verifica que empiece con `VITE_` (en mayúsculas)
5. **Reinicia el servidor de desarrollo**:
   ```bash
   # Ctrl+C para detener
   npm run dev
   ```
6. Refresca el navegador (F5)

### Error al listar archivos: "No se encontraron archivos"

**Síntoma**: El explorador de Google Drive está vacío y no muestra archivos existentes.

**Explicación**: Por seguridad, Apuntador solo puede ver archivos que **ella misma ha creado**. Esto es por el scope `drive.file` que limita el acceso.

**Solución**:
- Usa Apuntador para **crear nuevos archivos** o **subir archivos**
- Los archivos creados desde Google Drive normal NO aparecerán
- Esto es **por diseño de seguridad** y es lo correcto

### Error: "Client ID is invalid"

**Síntoma**: Google dice que el Client ID no es válido.

**Solución**:
1. Verifica que hayas copiado el Client ID **completo**
2. Debe terminar en `.apps.googleusercontent.com`
3. No debe tener espacios extra al inicio o final
4. Copia nuevamente desde Google Cloud Console → Credenciales

### La aplicación se queda cargando después de autorizar

**Síntoma**: Después de dar permiso en Google, la página se queda en blanco o cargando.

**Solución**:
1. Abre las **DevTools del navegador** (F12)
2. Ve a la pestaña **Console**
3. Busca errores en rojo
4. Si ves errores de CORS, verifica las URIs de redirección
5. Si ves errores de "token exchange", verifica que el Client ID sea correcto

## Información Técnica

### Scopes Utilizados

Apuntador solicita estos permisos mínimos:

- **`https://www.googleapis.com/auth/drive.file`**
  - Ver, editar, crear y eliminar solo archivos creados por Apuntador
  - **NO** da acceso a otros archivos de tu Drive
  - Más seguro que `drive` completo

- **`https://www.googleapis.com/auth/drive.appdata`**
  - Almacenar datos de configuración de la app
  - Carpeta oculta especial para settings
  - **NO** visible en el Drive normal del usuario

### Flujo OAuth 2.0 + PKCE

Apuntador usa **OAuth 2.0 con PKCE** (Proof Key for Code Exchange):

1. Genera un `code_verifier` aleatorio
2. Calcula `code_challenge` usando SHA-256
3. Redirige a Google con el challenge
4. Google redirige de vuelta con un `code`
5. Intercambia el code por un `access_token` usando el verifier
6. **No usa Client Secret** (más seguro para apps públicas)

### Almacenamiento de Tokens

- Los tokens se guardan en **localStorage** del navegador
- Clave: `googledrive_access_token`
- También se guarda `googledrive_refresh_token` si está disponible
- **NO se envían a servidores externos**
- Todo el procesamiento es local

### Arquitectura Multi-Proveedor

Apuntador usa un store unificado (`useCloudStore`) que soporta múltiples proveedores:

- **Un solo proveedor activo a la vez**: Dropbox O Google Drive
- El proveedor activo se guarda en `localStorage`
- Puedes cambiar entre proveedores sin perder datos
- El explorador de archivos es genérico y funciona con ambos

## Límites y Cuotas

### Modo Testing (Externo sin verificar)

- **Usuarios**: Máximo 100 usuarios de prueba
- **Duración**: Indefinida mientras no publiques
- **Restricciones**: Solo emails agregados a "Usuarios de prueba"

### Para Producción (Aplicación Verificada)

Si necesitas más de 100 usuarios o uso público:

1. Completa el proceso de **verificación de Google**
2. Requiere:
   - Política de privacidad pública
   - Términos de servicio
   - Video demostrando el uso de la app
   - Revisión de seguridad (puede tardar semanas)

### Cuotas de API

Google Drive API tiene estos límites gratuitos:

- **1,000,000,000 queries** por día
- **1,000 queries** por usuario por 100 segundos
- Más que suficiente para uso normal de Apuntador

## Recursos Adicionales

- [Google Drive API Documentation](https://developers.google.com/drive/api/v3/about-sdk)
- [OAuth 2.0 Scopes for Google APIs](https://developers.google.com/identity/protocols/oauth2/scopes#drive)
- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth 2.0 for Mobile & Desktop Apps](https://developers.google.com/identity/protocols/oauth2/native-app)

## Seguridad y Privacidad

- ✅ Solo accede a archivos creados por Apuntador
- ✅ No lee ni modifica otros archivos de tu Drive
- ✅ Usa OAuth 2.0 + PKCE (sin client secret)
- ✅ Tokens almacenados solo localmente
- ✅ No se envían datos a servidores externos
- ✅ Código fuente abierto y auditable

## Soporte

Si tienes problemas con la configuración:

1. Revisa la sección "Solución de Problemas" arriba
2. Verifica los logs en DevTools del navegador (F12 → Console)
3. Abre un issue en el repositorio de GitHub
4. Contacta al equipo de desarrollo

---

**Última actualización**: Octubre 2025
**Versión de Apuntador**: 1.1.11+
