# 🔐 Self-Signed Certificate Guide for Windows

## ✅ Certificate Successfully Generated

A self-signed certificate has been created to sign Apuntador's Windows applications. This will significantly reduce Windows Defender warnings.

### 📁 Generated Files

```
certificates/
├── apuntador-codesigning.pfx    # Certificate in PFX format
└── certificate-base64.txt       # Base64 encoded certificate for GitHub
```

### 🔑 Certificate Information

- **Name**: Apuntador Code Signing
- **Password**: `apuntador2024!`
- **Validity**: 3 years from creation date
- **Algorithm**: RSA 2048 bits

## 🚀 GitHub Actions Configuration

### 1. Add Secrets in GitHub

Go to your repository → **Settings** → **Secrets and variables** → **Actions** and add:

```
WINDOWS_CERTIFICATE: [complete content of certificate-base64.txt]
WINDOWS_CERTIFICATE_PASSWORD: apuntador2024!
```

### 2. Verify the Workflow

The `.github/workflows/build-windows-desktop.yml` file is already configured to use these secrets:

```yaml
env:
  WINDOWS_CERTIFICATE: ${{ secrets.WINDOWS_CERTIFICATE }}
  WINDOWS_CERTIFICATE_PASSWORD: ${{ secrets.WINDOWS_CERTIFICATE_PASSWORD }}
```

## 🛡️ Self-Signed Certificate Benefits

### ✅ Advantages

- ✅ Reduces Windows Defender warnings
- ✅ Improves user trust
- ✅ Cleaner installation process
- ✅ Free (no commercial CA required)
- ✅ Valid for 3 years

### ⚠️ Limitations

- ⚠️ Not a recognized commercial CA certificate
- ⚠️ Users may see warnings the first time
- ⚠️ Does not completely eliminate all security warnings

## 🔄 Regenerate Certificate

If you need to regenerate the certificate (for example, if it expires), run:

```powershell
.\scripts\create-self-signed-cert.ps1 -CertName "Apuntador Code Signing"
```

## 📝 Next Steps

1. **Copy the content** of `certificates/certificate-base64.txt`
2. **Go to GitHub** → Settings → Secrets and variables → Actions
3. **Add the secrets** mentioned above
4. **Run a build** to test that the certificate works
5. **Download and install** the generated MSI to verify fewer warnings

## 🔒 Security

### ⚠️ IMPORTANT

- **DO NOT upload** files from `certificates/` to GitHub
- **Keep secure** the certificate password
- **Use only** in the official Apuntador repository
- **Regenerate** if you suspect it's compromised

### 📋 .gitignore

Make sure the `certificates/` directory is in your `.gitignore`:

```gitignore
# Code signing certificates
certificates/
*.pfx
*.p12
```

## 🏆 Expected Result

After configuring the certificate:

1. **Automatic builds** signed in GitHub Actions
2. **MSI installers** with fewer Windows warnings
3. **Better experience** for end users
4. **Professional distribution** process

Your Apuntador application is now ready for distribution with code signing certificate! 🎉
