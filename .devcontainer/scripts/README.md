# DevContainer Setup Scripts

This directory contains automated setup scripts for the Apuntador devcontainer.

## Scripts

### on-create.sh

**When it runs**: Automatically when the container is first created.

**What it does**:

- Sets up directory permissions
- Installs Android SDK (Platform 34, Build Tools, NDK 26)
- Configures Android environment variables
- Installs Tauri CLI
- Installs Ionic and Capacitor CLI globally
- Accepts Android licenses
- Configures bash and zsh shells

**Duration**: ~5-7 minutes (downloads ~2GB of Android SDK)

**Note**: This only runs once during container creation. If you rebuild the container, it will run again.

---

### post-create.sh

**When it runs**: After `on-create.sh` completes.

**What it does**:

- Runs `npm install` to install Node.js dependencies
- Runs `cargo fetch` to pre-download Rust dependencies
- Syncs Capacitor (if configured)
- Displays helpful commands for getting started

**Duration**: ~2-3 minutes (depends on network speed)

**Note**: This runs every time the container is created or rebuilt.

---

### verify-setup.sh

**When it runs**: Manually, when you want to verify the setup.

**What it does**:

- Checks that all required tools are installed and accessible:
  - Node.js, npm, npx
  - Rust, Cargo, Rustup
  - Android SDK, ADB, SDK Manager
  - Java, Gradle
  - Ionic CLI, Capacitor CLI
  - Git, Make, cURL, wget
- Verifies project directories (node_modules, target)
- Displays a summary report with pass/fail counts

**How to run**:

```bash
# Inside the devcontainer
./.devcontainer/scripts/verify-setup.sh

# Or from any directory
bash /workspaces/apuntador/.devcontainer/scripts/verify-setup.sh
```

**Duration**: ~5 seconds

**Use case**:

- After first container creation to verify everything installed correctly
- After making changes to the devcontainer configuration
- When troubleshooting issues

---

## Execution Order

When you open the project in the devcontainer for the first time:

1. **Container Creation** - Docker builds/pulls the base image
2. **on-create.sh** - Sets up Android SDK, Tauri, etc. (runs once)
3. **post-create.sh** - Installs npm and Rust dependencies (runs every rebuild)
4. **Ready** - Container is ready for development

Total time (first time): ~10-15 minutes  
Total time (rebuild): ~2-3 minutes (skips on-create.sh if unchanged)

---

## Customization

### Adding Android SDK Packages

Edit `on-create.sh` and add to the `sdkmanager` command:

```bash
${ANDROID_SDK_ROOT}/cmdline-tools/latest/bin/sdkmanager \
    "platform-tools" \
    "platforms;android-34" \
    "platforms;android-33" \    # Add more platforms
    "build-tools;34.0.0" \
    "ndk;26.1.10909125" \
    "emulator" \                # Add emulator
    "system-images;android-34;google_apis;x86_64"  # Add system image
```

### Installing Additional Global npm Packages

Edit `on-create.sh` and add after the Ionic/Capacitor installation:

```bash
npm install -g @angular/cli    # Example: Angular CLI
npm install -g typescript      # Example: TypeScript
```

### Pre-installing Rust Tools

Edit `on-create.sh` and add after Tauri CLI installation:

```bash
cargo install cargo-watch      # Auto-rebuild on file changes
cargo install cargo-edit       # Manage Cargo.toml dependencies
```

---

## Troubleshooting

### on-create.sh fails with Android SDK errors

**Problem**: Download timeout or disk space issues.

**Solution**:

```bash
# Increase disk space allocated to Colima/Docker
colima stop
colima start --cpu 8 --memory 16 --disk 120

# Rebuild container
# Cmd+Shift+P → "Dev Containers: Rebuild Container"
```

### post-create.sh fails with npm install errors

**Problem**: Network issues or corrupted cache.

**Solution**:

```bash
# Inside container
rm -rf node_modules
npm cache clean --force
npm install
```

### verify-setup.sh shows failures

**Problem**: Some tools not found in PATH.

**Solution**:

```bash
# Reload shell configuration
source ~/.bashrc
# or
source ~/.zshrc

# Run verify again
./.devcontainer/scripts/verify-setup.sh
```

### Scripts don't run automatically

**Problem**: Scripts may not have execute permissions.

**Solution**:

```bash
# From host (macOS)
chmod +x .devcontainer/scripts/*.sh

# Rebuild container
# Cmd+Shift+P → "Dev Containers: Rebuild Container"
```

---

## Manual Execution

If you need to run the scripts manually:

```bash
# Inside the devcontainer

# Run on-create (be careful, may reinstall everything)
bash /workspaces/apuntador/.devcontainer/scripts/on-create.sh

# Run post-create
bash /workspaces/apuntador/.devcontainer/scripts/post-create.sh

# Run verification
bash /workspaces/apuntador/.devcontainer/scripts/verify-setup.sh
```

---

## Logs

Script output is visible in the VS Code terminal during container creation.

To see logs later:

- **Docker logs**: `docker logs <container_id>`
- **Colima logs**: `colima logs`
- **Container terminal**: Open terminal in VS Code after creation completes

---

## Best Practices

### When to Rebuild

Rebuild the container if you:

- Change `devcontainer.json` (features, mounts, settings)
- Change `on-create.sh` or `post-create.sh`
- Want to start with a clean slate
- Android SDK gets corrupted

**How**: Cmd+Shift+P → "Dev Containers: Rebuild Container"

### When NOT to Rebuild

Don't rebuild if you only:

- Changed source code
- Installed npm packages (use `npm install` instead)
- Installed Rust crates (use `cargo add` instead)

Rebuilding recreates the entire container, which takes ~10 minutes.

### Saving Time

To speed up rebuilds:

- Keep volumes persistent (default configuration)
- Use Docker layer caching (automatic)
- Don't change on-create.sh unless necessary

---

## See Also

- [../QUICKSTART.md](../QUICKSTART.md) - Quick start guide
- [../MACOS_SETUP.md](../MACOS_SETUP.md) - macOS installation instructions
- [../README.md](../README.md) - Complete devcontainer documentation
