# Apuntador DevContainer

This devcontainer provides a **complete and isolated development environment** for the Apuntador project, supporting **multi-platform development** for Web, Android, iOS, and Desktop (Tauri).

## Quick Start

**First time? Start here**: [QUICKSTART.md](QUICKSTART.md) - Get up and running in 5 minutes!

## Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - 5-minute setup guide [FAST]
- **[FIX_COCOAPODS.md](FIX_COCOAPODS.md)** - Fix Ruby/CocoaPods installation issues [CONFIG]
- **[TROUBLESHOOTING_ANDROID_SDK.md](TROUBLESHOOTING_ANDROID_SDK.md)** - Fix Android SDK installation failures [MOBILE]
- **[SETUP_SUMMARY.md](SETUP_SUMMARY.md)** - Executive summary of the configuration
- **[MACOS_SETUP.md](MACOS_SETUP.md)** - What to install on your Mac
- **[VOLUME_MANAGEMENT.md](VOLUME_MANAGEMENT.md)** - Managing Docker volumes and external drives
- **[PLATFORM_NOTES.md](PLATFORM_NOTES.md)** - Detailed capabilities per platform (Web/Android/iOS/Tauri)

## �Features

### Development Stack

- **Node.js 20** - Latest LTS version
- **Rust** - Latest stable with Cargo
- **Java 17** - For Android development with Gradle
- **Android SDK & NDK** - Platform 34, Build Tools, NDK 26
- **Tauri CLI** - Desktop app development (macOS, Windows, Linux)
- **Ionic CLI & Capacitor** - Mobile app development
- **CocoaPods** - iOS dependency management

### Pre-installed Extensions (IN THE CONTAINER)

- Vue Language Features (Volar) - Vue language server
- TypeScript Vue Plugin - TypeScript support for Vue
- ESLint - Real-time linting
- Prettier - Automatic formatting
- Playwright Test - E2E testing
- i18n Ally - Translation management
- Rust Analyzer - Rust language server
- Even Better TOML - TOML file support
- Crates - Rust dependency management
- Ionic - Ionic framework support

**Note**: These extensions run **inside the container**, not on your host. They have full access to node_modules, project code, and can execute npm commands. VS Code uses a client-server architecture to connect your UI (local) with the development environment (container).

### Automatic Configuration

- Format on save enabled
- ESLint auto-fix activated
- Prettier as default formatter for JS/TS/Vue
- Rust Analyzer for Rust code
- Clippy for Rust linting

### Exposed Ports

- **3000**: Vite dev server (main)
- **5173**: Vite preview
- **1420**: Tauri dev server

### Volume Mapping (Performance Optimization)

- `node_modules` → Docker volume (faster access)
- `src-tauri/target` → Docker volume (saves disk space, allows external mapping)

### Automatic Setup

- Automatic installation of all dependencies (npm, Cargo, Android SDK)
- Pre-configured Android environment
- Capacitor sync

## Prerequisites

1. **Docker Runtime** - Choose one option:

   ### Option A: Colima (Lightweight, recommended for Mac/Linux)

   ```bash
   # Install with Homebrew (macOS)
   brew install colima docker docker-compose

   # Start with recommended resources
   colima start --cpu 4 --memory 8 --disk 60

   # Check status
   colima status
   ```

   **⚙️ Recommended Resources for Colima (Full Stack Development)**:
   - **CPUs**: Minimum 6, recommended 8+ (for Rust compilation, Android builds, Tauri)
   - **Memory**: Minimum 12GB, recommended 16GB (Android SDK + Gradle + Rust)
   - **Disk**: At least 80GB (Android SDK ~30GB, Rust cache, npm packages)

   To adjust resources later:

   ```bash
   # Stop Colima
   colima stop

   # Restart with new resources
   colima start --cpu 6 --memory 10 --disk 60
   ```

   ### Option B: Docker Desktop
   - [Download for Mac](https://www.docker.com/products/docker-desktop)
   - [Download for Windows](https://www.docker.com/products/docker-desktop)
   - [Download for Linux](https://docs.docker.com/desktop/install/linux-install/)

   To adjust: Docker Desktop → Preferences/Settings → Resources

2. **Visual Studio Code** with the **Dev Containers** extension
   - Install from: [Dev Containers Extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

## 🏃 How to Use the DevContainer

### Option 1: Open in Container (Recommended)

1. Open VS Code
2. **Open ONLY the Apuntador project folder** (`File > Open Folder...`)
3. VS Code will automatically detect the devcontainer and show a notification
4. Click **"Reopen in Container"**
5. **If asked about configuration**: Select **"Add configuration to workspace"** (this ensures the config is shared with the team)
6. Wait for the container to build and configure (first time ~2-5 minutes)
7. Done! The development server will start automatically at http://localhost:3000

### Option 2: Command Palette

1. Open VS Code with **only the Apuntador folder**
2. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
3. Type and select: **"Dev Containers: Reopen in Container"**
4. Wait for the container to configure
5. Done!

### Option 3: From Scratch

If you don't have the project cloned:

1. Press `Cmd+Shift+P` / `Ctrl+Shift+P`
2. Select **"Dev Containers: Clone Repository in Container Volume"**
3. Enter the repository URL
4. Wait for it to clone and configure everything

## [FILES] Multiple Projects in a Workspace

If you have multiple projects, each with its own devcontainer, you have several options:

### Strategy 1: Open Folders Individually (Recommended)

The simplest way is to open each project in its own VS Code window:

```bash
# Open only the Apuntador project
code /Users/linus/projects/apuntador
```

Then use "Reopen in Container" normally. Each project will have its own window and container.

**Advantages**:

- Simple and straightforward
- Each project completely isolated
- No confusion about which devcontainer to use

### Strategy 2: Multi-Root Workspace

If you need to work with multiple projects simultaneously:

1. **Create a workspace file** (`.code-workspace`):

```json
{
  "folders": [
    {
      "path": "apuntador"
    },
    {
      "path": "other-project"
    }
  ],
  "settings": {}
}
```

2. **To open a specific project in a container**:
   - `Cmd+Shift+P` → **"Dev Containers: Open Folder in Container..."**
   - Select the specific folder (e.g., `apuntador`)
   - VS Code will open **only that folder** in the container

3. **Alternative - Open entire workspace** (advanced):
   - `Cmd+Shift+P` → **"Dev Containers: Open Workspace in Container..."**
   - VS Code will try to detect devcontainers in subfolders
   - Select which devcontainer to use

### Strategy 3: Monorepo with Global Devcontainer

If you have a monorepo (e.g., `/projects/` with `apuntador/`, `project2/`, etc.):

1. **Option A**: Create a `.devcontainer` at the monorepo root that includes all dependencies
2. **Option B**: Use devcontainers in subfolders and open each project individually

### Practical Example

```
/Users/linus/projects/
├── apuntador/                    # Project 1
│   └── .devcontainer/
│       └── devcontainer.json
├── backend-project/             # Project 2
│   └── .devcontainer/
│       └── devcontainer.json
└── my-workspace.code-workspace  # Optional workspace
```

**To work on Apuntador**:

```bash
# Option 1: Open only Apuntador
code /Users/linus/projects/apuntador
# Then "Reopen in Container"

# Option 2: From command palette
# Cmd+Shift+P → "Dev Containers: Open Folder in Container..."
# Select /Users/linus/projects/apuntador
```

**To work on multiple projects at once**:

- Open each project in a separate VS Code window
- Each will have its own running container
- Containers are independent and don't affect each other

### [WARNING] Important

- **VS Code looks for `.devcontainer/` in the root of the folder you open**
- If you open a parent folder containing subfolders with devcontainers, VS Code may not detect them automatically
- **Solution**: Always open the specific project folder (e.g., `apuntador/` not `projects/`)

## Available Commands

Once inside the container, all development commands work:

### Web Development

```bash
npm run dev              # Vite dev server (port 3000)
npm run build            # Production build
npm run preview          # Preview the build
npm test                 # Unit tests
npm run test:e2e         # E2E tests with Playwright
npm run lint             # Linting
npm run format           # Code formatting
```

### Tauri Desktop Development

````bash
npm run tauri dev        # Start Tauri desktop app
npm run tauri build      # Build desktop app (Linux in container)
cargVolume Persistence

The devcontainer uses Docker volumes for heavy build artifacts:

**`node_modules` volume**:
- Faster installation
- Better performance on Mac/Windows
- [WARNING] Not visible on host system (this is intentional)

**`src-tauri/target` volume**:
- Saves disk space (Rust builds can be 5-10GB+)
- Faster incremental builds
- Can be mapped to external drive if needed
- [WARNING] Not visible on host system

To map volumes to specific locations (e.g., external drive):
```bash
# List current volumes
docker volume ls

# Inspect volume location
docker volume inspect apuntador-rust-target

# To use a bind mount instead (edit devcontainer.json):
# "source=/path/to/external/drive/rust-target,target=/workspaces/apuntador/src-tauri/target,type=bind"
````

```bash
npm run android:dev      # Start Android development
npx cap sync android     # Sync Capacitor to Android
npx cap open android     # Open Android Studio (requires X11 forwarding)
ionic capacitor build android  # Build Android app
```

### iOS Development (Limited in Linux Container)

```bash
npx cap sync ios         # Sync Capacitor to iOS
# Note: Actual iOS builds require macOS host with Xcode
```

**iOS Development Simplified**:

With bind mounts (shared directories), `node_modules` is automatically available on both the container and your Mac. Xcode can access it directly!

```bash
# Just build and sync (in container or on Mac - same result):
npm run build && npx cap sync ios

# Then open Xcode on Mac:
open ios/App/App.xcworkspace
# No additional npm install needed! [OK]
```

See [VOLUME_MANAGEMENT.md](VOLUME_MANAGEMENT.md) for details about the bind mounts configuration.

### Ionic Development

```bash
ionic serve              # Start Ionic dev server
ionic build              # Build Ionic app
ionic capacitor sync     # Sync to all platforms
```

## Important NotFull Stack: Vue + TypeScript + Rust + Android):

| Task                                   | Recommended CPUs | Recommended Memory |
| -------------------------------------- | ---------------- | ------------------ |
| Web only (Vue/Vite)                    | 4                | 8 GB               |
| Web + Tauri development                | 6                | 12 GB              |
| **Full stack (Web + Tauri + Android)** | **8+**           | **16 GB**          |
| With E2E tests + Android builds        | 8-12             | 20 GB              |

**Why more resources?**:

- Rust compilation is CPU-intensive
- Android Gradle builds need significant memory
- Running multiple dev servers simultaneously (Vite + Tauri + Android emulator)
- [WARNING] `node_modules` are not visible on your host system (this is intentional)

### Ports

- Port **3000** is automatically exposed
- You can access the application at http://localhost:3000
- VS Code will notify you when the server is ready

### Rebuild Container

If you need to rebuild the container (e.g., after changing configuration):

1. `Cmd+Shift+P` / `Ctrl+Shift+P`
2. **"Dev Containers: Rebuild Container"**

### Exit Container

To return to working locally:

1. `Cmd+Shift+P` / `Ctrl+Shift+P`
2. **"Dev Containers: Reopen Folder Locally"**

## [DESKTOP] Resources and Performance

### What Uses Docker Resources?

**Inside the Container** (limited by your Docker allocation):

- Node.js and npm
- Vite dev server (hot reload, compilation)
- Production builds (`npm run build`)
- Tests (Vitest, Playwright)
- ESLint, Prettier, TypeScript compiler
- VS Code extensions running in the container (Volar, etc.)

**On the Host** (unlimited resources from your machine):

- VS Code window and interface
- UI extensions (themes, icons)
- Web browser to view the application

### Resource Recommendations

For **Apuntador** (Vue 3 + TypeScript + Vite project):

| Task                        | Recommended CPUs | Recommended Memory |
| --------------------------- | ---------------- | ------------------ |
| Basic development           | 2-4              | 4-6 GB             |
| **Optimal development**     | **4-6**          | **8-10 GB**        |
| With E2E tests (Playwright) | 6-8              | 10-12 GB           |

**Example: 4 CPUs / 8GB**: Sufficient for normal development, can be adjusted if running E2E tests frequently.

### How to Adjust Resources

**Colima**:

```bash
# View current configuration
colima status

# Stop Colima
colima stop

# Restart with new resources (example: 6 CPUs, 10GB RAM)
colima start --cpu 6 --memory 10 --disk 60

# Or edit ~/.colima/default/colima.yaml and restart
```

**Docker Desktop** (macOS / Windows):

1. Docker Desktop → ⚙️ Settings/Preferences
2. Resources → Advanced
3. Adjust CPUs and Memory
4. Apply & Restart

**Note**: Allocating more resources speeds up:

- `npm install` (dependency installation)
- Hot reload and Vite compilation
- Test execution
- Production builds

## Troubleshooting

### Container Won't Start

**VS Code asks about configuration location**:

- Select **"Add configuration to workspace"** to share the config with your team
- This creates/updates `.vscode/settings.json` in the project
- Alternative: "Add configuration to user data folder" (personal config only)

**With Colima**:

1. Check that Colima is running: `colima status`
2. If stopped, start it: `colima start`
3. Verify Docker connection: `docker ps`
4. Check disk space: `df -h`

**With Docker Desktop**:

1. Verify Docker Desktop is running
2. Check that you have sufficient disk space

**Both**: 3. Try: `Cmd+Shift+P` → "Dev Containers: Rebuild Container"

### Development is Slow

1. Check resources allocated to Docker (see "Resources and Performance" section)
2. Increase CPUs or memory if possible
3. Close other containers you're not using: `docker ps` to see active ones

### Changes Not Reflected

Vite hot-reload should work automatically. If not:

1. Verify the development server is running
2. Restart the server: press `Ctrl+C` in the terminal and run `npm run dev`

### Permission Issues

The container runs as user `node` (not root) for security. If you have problems:

1. Ensure files have proper permissions
2. On Linux, you may need to adjust file ownership

### High Resource Usage

If Docker is consuming too many resources:

1. Stop containers you're not using: `docker stop $(docker ps -q)`
2. Clean old images: `docker system prune -a`
3. **With Colima**: Reduce resources on restart: `colima start --cpu 4 --memory 6`
4. **With Docker Desktop**: Reduce resources in Settings → Resources

### Colima-Specific Issues

**"Cannot connect to the Docker daemon"**:

```bash
# Check Docker context
docker context ls

# Make sure to use Colima context
docker context use colima

# Restart Colima if needed
colima restart
```

**Slow Performance**:

- Colima uses QEMU instead of VirtualBox/HyperKit
- For better performance on Apple Silicon (M1/M2): `colima start --vm-type vz --vz-rosetta`

## DevContainer Benefits

- Consistent environment across developers
- Doesn't pollute your local system with dependencies
- Automatic tool configuration
- Easy to share and replicate
- Complete project isolation
- Compatible with GitHub Codespaces
- **Multi-architecture support** (ARM64 and x86-64)

## Multi-Architecture Support

The devcontainer **automatically detects** the host architecture and configures itself accordingly:

### ARM64 (Apple Silicon, AWS Graviton, etc.)

When running on ARM64 systems, the container:

- Automatically enables **amd64 multi-arch support**
- Installs x86-64 compatibility libraries (`libc6:amd64`, `libstdc++6:amd64`, `zlib1g:amd64`)
- Allows running Android SDK tools (which are x86-64 only) via QEMU emulation

**Why is this needed?**

- Android SDK Platform Tools (`adb`, `fastboot`) are only distributed as x86-64 binaries
- On ARM64 systems, these binaries need compatibility libraries to run via QEMU

**What you get:**

```bash
# Works seamlessly on both ARM64 and x86-64:
adb devices          # Android debugging
adb install app.apk  # Install apps
./gradlew build      # Android builds
```

### x86-64 (Intel/AMD processors)

On x86-64 systems, everything runs natively without emulation or special configuration.

### Verification

To check your current architecture:

```bash
# Inside the container
dpkg --print-architecture        # Shows: arm64 or amd64
uname -m                         # Shows: aarch64 or x86_64
adb --version                    # Should work on both architectures
```

### Troubleshooting

If `adb` fails with "Could not open '/lib64/ld-linux-x86-64.so.2'":

1. Your container was likely built **before** this multi-arch support was added
2. **Solution**: Rebuild the container: `Cmd+Shift+P` → "Dev Containers: Rebuild Container"
3. The updated `on-create.sh` script will install the necessary libraries automatically

See [TROUBLESHOOTING_ANDROID_SDK.md](TROUBLESHOOTING_ANDROID_SDK.md) for more details.

## [PLUGIN] Extensions: Container vs Host

### Where Do Extensions Run?

**Extensions in the CONTAINER** (defined in devcontainer.json):

- Automatically installed when creating the container
- Run inside the containerized environment
- Have access to node_modules, project files, and npm commands
- Examples: Volar, ESLint, Prettier, Playwright

**Extensions on the HOST** (manually installed):

- UI/theme extensions you already have installed
- Don't need access to project code
- Examples: color themes, file icons

### VS Code + Container Architecture

```
┌──────────────────────────────────┐
│    VS Code (Local/Host)          │
│  - Graphical interface           │
│  - UI/theme extensions           │
└────────────┬─────────────────────┘
             │
             │ Remote communication
             │ (VS Code protocol)
             ▼
┌──────────────────────────────────┐
│    Container (Isolated)          │
│  - Node.js + dependencies        │
│  - Project code                  │
│  - Development extensions        │
│  - Language servers (LSP)        │
│  - Linters, formatters, tests    │
└──────────────────────────────────┘
```

### Adding More Extensions

If you want to add additional extensions:

**Option 1: Temporary (this session only)**

- Install the extension normally from the marketplace
- VS Code will ask if you want to install it in the container

**Option 2: Permanent (for the whole team)**

- Edit `.devcontainer/devcontainer.json`
- Add the extension ID to `customizations.vscode.extensions`
- Rebuild the container: `Cmd+Shift+P` → "Dev Containers: Rebuild Container"
