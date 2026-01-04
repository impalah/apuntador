# Security Guidelines for Android Development

## [WARNING] Critical Security Files

The following files contain sensitive information and must **NEVER** be committed to version control:

### [KEY] Keystore Files

- `*.keystore` - Contains private keys for APK signing
- `*.jks` - Java KeyStore files
- Location: `android/app/apuntador-release-key.keystore`

### Configuration Files

- `android/key.properties` - Contains keystore passwords
- `keystore-base64.txt` - Temporary Base64 encoded keystore
- `keystore.txt` - Any temporary keystore exports

## Safe Development Practices

### 1. Using Templates

```bash
# Copy the template to create your configuration
cp android/key.properties.template android/key.properties

# Edit with your actual values
nano android/key.properties
```

### 2. Template Content

```properties
storePassword=YOUR_ACTUAL_PASSWORD
keyPassword=YOUR_ACTUAL_PASSWORD
keyAlias=apuntador
storeFile=apuntador-release-key.keystore
```

### 3. Git Configuration

The `.gitignore` file is configured to automatically exclude:

```gitignore
# Android Security Files
*.keystore
*.jks
android/app/*.keystore
android/app/*.jks
android/key.properties
keystore-base64.txt
keystore.txt
```

## 🚫 What NOT to Do

- [ERROR] Never commit `*.keystore` files
- [ERROR] Never commit `key.properties` with real passwords
- [ERROR] Never share keystore passwords in chat/email
- [ERROR] Never include keystore in Docker images
- [ERROR] Never push temporary keystore files

## What TO Do

- Use `key.properties.template` as a reference
- Store keystore files in secure, backed-up locations
- Use different passwords for development vs production
- Generate Base64 for CI/CD using provided scripts
- Delete temporary files after CI/CD setup

## CI/CD Security

For GitHub Actions, use encrypted secrets:

- `ANDROID_KEYSTORE_BASE64` - Base64 encoded keystore
- `ANDROID_KEYSTORE_PASSWORD` - Keystore password
- `ANDROID_KEY_PASSWORD` - Key password
- `ANDROID_KEY_ALIAS` - Key alias (usually "apuntador")

See [GITHUB_SECRETS.md](./GITHUB_SECRETS.md) for setup instructions.

## 🆘 If You Accidentally Commit Sensitive Files

### 1. Remove from Git History

```bash
# Remove file from git tracking but keep local copy
git rm --cached android/key.properties

# Remove from entire git history (if already committed)
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch android/key.properties' \
  --prune-empty --tag-name-filter cat -- --all

# Force push ([WARNING] WARNING: Only do this on development repos)
git push --force-with-lease --all
```

### 2. Regenerate Compromised Keys

- Create new keystore with different passwords
- Update GitHub secrets with new values
- Distribute new APKs with new signatures

### 3. Audit Repository

```bash
# Search for any sensitive content in git history
git log --patch --all -S "password" -- "*.properties" "*.keystore"
```

## Security Checklist

Before committing:

- [ ] Check `git status` for any `.keystore` files
- [ ] Verify `key.properties` is not in staging area
- [ ] Confirm temporary keystore files are deleted
- [ ] Review `.gitignore` covers all sensitive patterns
- [ ] Test that ignored files stay ignored: `git status --ignored`

## Verification Commands

```bash
# Check what files are tracked
git ls-files | grep -E "\.(keystore|properties)$"

# Check what files are ignored
git status --ignored | grep -E "\.(keystore|properties)$"

# Verify no sensitive content in recent commits
git log --oneline -n 10 --name-only | grep -E "\.(keystore|properties)$"
```

Remember: **Security is everyone's responsibility!** [SHIELD]
