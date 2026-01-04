# GitHub Secrets Configuration for Android APK

This document explains how to configure GitHub secrets needed for automatic signed APK builds.

## Required Secrets

For the `build-android-apk.yml` workflow to work correctly, you need to configure the following secrets in your GitHub repository:

### 1. ANDROID_KEYSTORE_BASE64

The keystore file encoded in Base64.

**How to obtain it:**

```bash
# From the project root directory
base64 -w 0 android/app/apuntador-release-key.keystore > keystore.txt
```

In Windows PowerShell:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("android\app\apuntador-release-key.keystore")) | Out-File -Encoding ascii keystore.txt
```

Copy the content of the generated `keystore.txt` file.

### 2. ANDROID_KEYSTORE_PASSWORD

The keystore password you set when creating the keystore.

**Value:** `apuntador123` (or the password you configured)

### 3. ANDROID_KEY_ALIAS

The key alias within the keystore.

**Value:** `apuntador`

### 4. ANDROID_KEY_PASSWORD

The password for the specific key within the keystore.

**Value:** `apuntador123` (or the password you configured)

## How to Configure Secrets

1. Go to your repository on GitHub
2. Click on **Settings**
3. In the sidebar, click on **Secrets and variables** → **Actions**
4. Click on **New repository secret**
5. Add each of the secrets mentioned above

### Screenshot of the process:

```
Repository → Settings → Secrets and variables → Actions → New repository secret
```

## Configuration Verification

Once all secrets are configured, the workflow should:

1. Activate automatically on push to `main` or on tags `v*`
2. Set up Android environment with Java 17
3. Decode and create keystore temporarily
4. Build signed APK
5. Upload APK as artifact
6. Create automatic release for tags
7. Clean up keystore at the end

## Manual Workflow Usage

You can also run the workflow manually:

1. Go to **Actions** in your repository
2. Select **Build Android APK**
3. Click on **Run workflow**
4. Select build type (release/debug)
5. Click on **Run workflow**

## Creating Releases

To create an automatic release with APK:

1. Create and push a tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

2. The workflow will activate automatically and:
   - Build the signed APK
   - Create a release on GitHub
   - Upload the APK to the release

## Security

- Secrets are encrypted and only accessible during execution
- Keystore is automatically deleted when workflow finishes
- Keys never appear in logs
- Only collaborators with permissions can modify secrets

## Troubleshooting

### Error: "keystore not found"

- Verify that `ANDROID_KEYSTORE_BASE64` is correctly encoded
- Make sure there are no additional spaces or line breaks

### Error: "wrong password"

- Verify that `ANDROID_KEYSTORE_PASSWORD` and `ANDROID_KEY_PASSWORD` are correct
- Remember they are case-sensitive

### Error: "key alias not found"

- Verify that `ANDROID_KEY_ALIAS` is exactly `apuntador`

### Java/Gradle Error

- The workflow uses Java 17 automatically
- If there are problems, verify that `android/build.gradle` has the correct configuration
