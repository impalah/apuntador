# Build Scripts Reference

This document provides a reference for all build scripts available in both Windows and Linux/Unix environments.

## Android APK Build Scripts

### Windows PowerShell (.ps1) and Batch (.bat) Files

| Script                         | Purpose                                        | Usage                            |
| ------------------------------ | ---------------------------------------------- | -------------------------------- |
| `Generate-Keystore-Base64.ps1` | Generate Base64 of keystore for GitHub Secrets | `.\Generate-Keystore-Base64.ps1` |
| `build-signed-apk.bat`         | Build signed release APK locally               | `.\build-signed-apk.bat`         |
| `build-apk.bat`                | Instructions for Android Studio APK build      | `.\build-apk.bat`                |

### Linux/Unix Shell Scripts (.sh)

| Script                        | Purpose                                        | Usage                           |
| ----------------------------- | ---------------------------------------------- | ------------------------------- |
| `generate-keystore-base64.sh` | Generate Base64 of keystore for GitHub Secrets | `./generate-keystore-base64.sh` |
| `build-signed-apk.sh`         | Build signed release APK locally               | `./build-signed-apk.sh`         |
| `build-apk.sh`                | Instructions for Android Studio APK build      | `./build-apk.sh`                |

## Makefile Targets

Cross-platform build targets available via `make`:

| Target                         | Description                                          |
| ------------------------------ | ---------------------------------------------------- |
| `make android-setup`           | Setup Android project with Capacitor                 |
| `make android-build`           | Build web app and sync to Android                    |
| `make android-release`         | Build signed release APK                             |
| `make android-debug`           | Build debug APK                                      |
| `make android-clean`           | Clean Android build files                            |
| `make android-keystore-base64` | Generate Base64 for GitHub Secrets (auto-detects OS) |

## GitHub Actions Workflow

The automated build process is handled by:

- `.github/workflows/build-android-apk.yml` - Automated Android APK builds on GitHub

## Prerequisites

### Windows

- Node.js 20+
- PowerShell 5.1+
- Android SDK
- Java 17

### Linux/Unix

- Node.js 20+
- Bash shell
- Android SDK
- Java 17
- `base64` utility

## Quick Start

### Windows

```powershell
# Generate keystore Base64 for GitHub Secrets
.\Generate-Keystore-Base64.ps1

# Build signed APK locally
.\build-signed-apk.bat
```

### Linux/Unix

```bash
# Make scripts executable (first time only)
chmod +x *.sh

# Generate keystore Base64 for GitHub Secrets
./generate-keystore-base64.sh

# Build signed APK locally
./build-signed-apk.sh
```

### Cross-platform (Makefile)

```bash
# Generate keystore Base64 for GitHub Secrets
make android-keystore-base64

# Build signed APK locally
make android-release
```

## Security Notes

- Scripts automatically handle keystore location detection
- Base64 generation scripts include security warnings
- GitHub Secrets configuration is documented in `GITHUB_SECRETS.md`
- Temporary files are created and should be deleted after use

## Troubleshooting

### Script Permissions (Linux/Unix)

If you get permission denied errors:

```bash
chmod +x *.sh
```

### PowerShell Execution Policy (Windows)

If PowerShell blocks script execution:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Missing Dependencies

- Ensure Node.js, Android SDK, and Java 17 are installed
- For Linux: Install `base64` utility if not available
- Run `npm install` before building APKs
