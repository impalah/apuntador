# 🔐 Self-Signed Certificate for Apuntador

This document explains how to configure and use self-signed certificates to sign Apuntador's Windows applications.

## 📋 What is a Self-Signed Certificate?

A self-signed certificate is a digital certificate that:

- ✅ **Digitally signs** the application
- ✅ **Reduces warnings** from Windows Defender
- ✅ **Shows developer** information
- ⚠️ **Still shows** a security warning (less severe)
- 💰 **Is free** (vs $200+ annually for commercial certificates)

## 🚀 Developer Guide

### 1. Generate Certificate

```powershell
# Run in PowerShell as administrator
.\scripts\create-self-signed-cert.ps1
```

This will create:

- `certificates/apuntador-codesigning.pfx` - Certificate for signing
- `certificates/certificate-base64.txt` - For GitHub Actions
- `certificates/certificate-info.txt` - Certificate information

### 2. Configure GitHub Actions

Add these secrets in GitHub:

1. Go to: **GitHub Repository → Settings → Secrets and variables → Actions**
2. Add secrets:
   - `WINDOWS_CERTIFICATE`: Content of `certificate-base64.txt`
   - `WINDOWS_CERTIFICATE_PASSWORD`: `apuntador2024!`

### 3. Build Locally

```powershell
# Release build with signing
.\scripts\build-windows-signed.ps1

# Debug build with signing
.\scripts\build-windows-signed.ps1 -BuildType debug
```

## 👥 End User Guide

### Why does Windows show a warning?

Windows shows security warnings for applications that:

- Are not signed by a recognized commercial certificate
- Are from developers not verified by Microsoft

**This is NORMAL and does not mean the application is unsafe.**

### How to Install Apuntador

#### Option 1: Standard Installation (Recommended)

1. **Download** the `.msi` file from releases
2. **Double-click** on the downloaded file
3. **If Windows Defender SmartScreen appears**:
   - Click on **"More info"**
   - Click on **"Run anyway"**
4. **Follow the installation** wizard

#### Option 2: Advanced Installation

If you have technical knowledge, you can:

1. **Verify the digital signature**:

   ```powershell
   Get-AuthenticodeSignature "apuntador-0.1.32-windows-x64-installer.msi"
   ```

2. **Install the certificate** (optional):
   - Right-click on the `.msi` file
   - "Properties" → "Digital Signatures" → "Details"
   - "View Certificate" → "Install Certificate"

### Is it safe to install Apuntador?

✅ **YES, it is completely safe** because:

- **Open source**: All code is available on GitHub
- **Digitally signed**: The application is signed (although self-signed)
- **No malware**: You can verify the source code
- **Active community**: Developed transparently

### Windows Messages You'll See

#### Windows Defender SmartScreen

```
Windows protected your PC
Microsoft Defender SmartScreen prevented an unrecognized app from starting.
Running this app might put your PC at risk.

App: apuntador-0.1.32-windows-x64-installer.msi
Publisher: Unknown publisher
```

**Solution**: Click on "More info" → "Run anyway"

#### User Account Control (UAC)

```
Do you want to allow this app to make changes to your device?
apuntador-0.1.32-windows-x64-installer.msi
Publisher: Apuntador (Not verified)
```

**Solution**: Click on "Yes"

## 🔧 Technical Information

### Certificate Configuration

- **Algorithm**: RSA 2048 bits
- **Valid for**: 3 years
- **Type**: Code Signing Certificate
- **Issuer**: Self-signed
- **Subject**: CN=Apuntador Code Signing, O=Apuntador

### Environment Variables (GitHub Actions)

- `WINDOWS_CERTIFICATE`: Certificate in Base64 format
- `WINDOWS_CERTIFICATE_PASSWORD`: Certificate password
- `WINDOWS_CODESIGN_CERT_THUMBPRINT`: Automatic thumbprint

## 🛡️ Security

### For Developers

- ⚠️ **NEVER** upload `.pfx` files to GitHub
- ⚠️ **NEVER** hardcode passwords in code
- ✅ **USE** GitHub Secrets for sensitive information
- ✅ **ROTATE** certificates every 1-3 years

### For Users

- ✅ **DOWNLOAD ONLY** from official GitHub releases
- ✅ **VERIFY** the URL: `github.com/impalah/apuntador`
- ✅ **CHECK** the digital signature before installing
- ⚠️ **DO NOT install** from unofficial sources

## 📞 Support

If you have installation problems:

1. **Review** this documentation
2. **Search** in GitHub issues
3. **Open** a new issue with specific details

---

**Developed with ❤️ by the Apuntador community**
