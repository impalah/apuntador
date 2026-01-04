# Gestión de Volúmenes y Bind Mounts

Este documento explica la configuración de almacenamiento del proyecto Apuntador y cómo gestionar `node_modules` y compilaciones de Rust.

## Configuración Actual: Bind Mounts (Compartidos)

**Actualizado**: Desde diciembre 2025, el proyecto usa **bind mounts** en lugar de volúmenes Docker aislados.

### Qué significa esto:

- `node_modules` y `src-tauri/target` están **compartidos** entre el host (tu Mac) y el contenedor
- Un solo directorio, accesible desde ambos lados
- Ahorra 10-20GB de espacio en disco
- Xcode puede acceder directamente a `node_modules` para builds de iOS
- Cambios visibles inmediatamente en host y contenedor

### Ubicación de los Directorios:

```
/Users/yourname/projects/apuntador/
├── node_modules/          # Compartido (host ↔ contenedor)
├── src-tauri/
│   └── target/            # Compartido (host ↔ contenedor)
└── ... otros archivos
```

### Tamaños Aproximados:

- **node_modules**: ~500MB - 1GB
- **src-tauri/target**: 5-10GB (puede crecer hasta 20GB+)

---

## Migración desde Volúmenes Docker Antiguos

Si estás actualizando desde una configuración anterior que usaba volúmenes Docker, ejecuta el script de migración:

```bash
# IMPORTANTE: Ejecuta esto FUERA del devcontainer
# Cierra VS Code devcontainer primero: Cmd+Shift+P → "Reopen Folder Locally"

# En tu Mac, en el directorio del proyecto:
cd /Users/yourname/projects/apuntador

# Ejecuta el script de migración:
bash .devcontainer/scripts/migrate-to-bind-mounts.sh
```

Este script:

1. Copia `node_modules` del volumen Docker al host
2. Copia `src-tauri/target` del volumen Docker al host
3. Opcionalmente elimina los volúmenes viejos para liberar espacio

**Luego reconstruye el contenedor:**

- VS Code: `Cmd+Shift+P` → "Dev Containers: Rebuild Container"

---

## Desarrollo iOS: Ahora Más Simple

Con bind mounts, ya **NO necesitas** instalar `node_modules` por separado en el host.

**Antes (con volúmenes Docker):**

```bash
# Tenías que hacer esto en el host:
npm install  # [ERROR] Ya no es necesario
```

**Ahora (con bind mounts):**

```bash
# El contenedor instala node_modules
# que automáticamente aparece en el host
# Xcode lo ve directamente [OK]
```

**Workflow de iOS:**

```bash
# 1. En el devcontainer (o desde el host, es lo mismo):
npm run build && npx cap sync ios

# 2. En tu Mac:
open ios/App/App.xcworkspace

# 3. Xcode ya puede ver node_modules/@capacitor/ios [OK]
```

---

## Rendimiento: Bind Mounts vs Volúmenes

### Trade-offs:

| Aspecto             | Volúmenes Docker     | Bind Mounts (Actual) |
| ------------------- | -------------------- | -------------------- |
| Velocidad en Linux  | Rápido               | Rápido               |
| Velocidad en macOS  | Rápido               | Un poco más lento 🐌 |
| Espacio en disco    | Doble (2x) [ERROR]   | Simple (1x)          |
| Acceso desde host   | No [ERROR]           | Sí                   |
| iOS development     | Complicado [WARNING] | Simple               |
| Android development | Excelente            | Excelente            |

### Impacto Real:

En macOS, las operaciones de npm/cargo pueden ser **10-20% más lentas** con bind mounts debido a la capa de virtualización de archivos de Docker.

**¿Vale la pena?** Sí, porque:

- Ahorras 10-20GB de espacio
- Desarrollo iOS es mucho más simple
- La diferencia de velocidad es tolerable (~2-3 segundos en `npm install`)

Si el rendimiento es crítico para ti, puedes revertir a volúmenes (ver sección siguiente).

---

## 🔁 Revertir a Volúmenes Docker (Opcional)

Si prefieres la velocidad máxima sobre el ahorro de espacio, puedes volver a usar volúmenes:

**1. Edita `.devcontainer/devcontainer.json`:**

```jsonc
{
  // ...
  "mounts": [
    "source=${localEnv:HOME}${localEnv:USERPROFILE}/.ssh,target=/home/node/.ssh,type=bind,consistency=cached",

    // Descomentar estas líneas:
    "source=apuntador-node-modules,target=/workspaces/apuntador/node_modules,type=volume",
    "source=apuntador-rust-target,target=/workspaces/apuntador/src-tauri/target,type=volume",
  ],
}
```

**2. Reconstruye el contenedor:**

```bash
# Cmd+Shift+P → "Dev Containers: Rebuild Container"
```

**3. Para iOS, instala node_modules en el host:**

```bash
# En tu Mac:
cd /Users/yourname/projects/apuntador
npm install
```

---

## Ver Volúmenes Actuales

```bash
# Listar todos los volúmenes
docker volume ls

# Ver detalles de un volumen específico
docker volume inspect apuntador-node-modules
docker volume inspect apuntador-rust-target

# Ver tamaño de los volúmenes
docker system df -v
```

---

## Limpiar Volúmenes (Liberar Espacio)

### Eliminar volúmenes específicos del proyecto

[WARNING] **Advertencia**: Esto eliminará las dependencias compiladas. Se reinstalarán al reconstruir el container.

```bash
# Detener el container primero
# En VS Code: Cmd+Shift+P → "Dev Containers: Reopen Folder Locally"

# Eliminar volumen de node_modules
docker volume rm apuntador-node-modules

# Eliminar volumen de Rust target
docker volume rm apuntador-rust-target

# O eliminar ambos:
docker volume rm apuntador-node-modules apuntador-rust-target
```

### Limpiar todos los volúmenes no utilizados

```bash
# Esto elimina TODOS los volúmenes no usados por contenedores
docker volume prune

# Con confirmación automática
docker volume prune -f
```

---

## Mapear a Disco Externo

Si quieres usar un disco externo para `src-tauri/target` (ahorra espacio en SSD interno):

**Opción 1: Symlink (Con Bind Mounts)**

```bash
# 1. Mueve target al disco externo
mv src-tauri/target /Volumes/ExternalDrive/apuntador-rust-target

# 2. Crea symlink
ln -s /Volumes/ExternalDrive/apuntador-rust-target src-tauri/target

# 3. Rebuild container
# Cmd+Shift+P → "Dev Containers: Rebuild Container"
```

**Opción 2: Bind Mount Directo (Más control)**

Edita `.devcontainer/devcontainer.json`:

```jsonc
"mounts": [
  "source=${localEnv:HOME}${localEnv:USERPROFILE}/.ssh,target=/home/node/.ssh,type=bind,consistency=cached",
  "source=/Volumes/ExternalDrive/apuntador-rust-target,target=/workspaces/apuntador/src-tauri/target,type=bind,consistency=cached"
]
```

[WARNING] **Nota**: El disco externo debe estar montado antes de iniciar el contenedor.

---

## Recomendaciones

### Para la mayoría de usuarios:

**Usar bind mounts** (configuración actual)

- Ahorro de espacio
- Simplicidad para iOS
- Rendimiento aceptable

### Para usuarios con espacio ilimitado y prioridad en velocidad:

**Usar volúmenes Docker**

- Máximo rendimiento
- Requiere instalación dual de node_modules para iOS

### Para usuarios con SSDs pequeños:

**Bind mounts + disco externo para Rust**

- Mejor de ambos mundos
- `node_modules` en SSD (~1GB)
- `target` en disco externo (~10-20GB)

---

## Referencias

- [Docker Volumes Documentation](https://docs.docker.com/storage/volumes/)
- [Bind Mounts Documentation](https://docs.docker.com/storage/bind-mounts/)
- [Performance in Docker Desktop for Mac](https://docs.docker.com/desktop/mac/#performance)

---

**Última actualización**: Diciembre 31, 2025
