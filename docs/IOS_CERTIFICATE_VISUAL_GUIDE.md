# iOS Certificate Creation: Step-by-Step Visual Guide

**Quick help for creating iOS Distribution certificates in Apple Developer Portal.**

---

## 🔍 What You're Looking For

When you go to Apple Developer Portal, you need to find the **iOS Distribution** certificate. It might be called:

### ✅ **Correct Certificate Types** (choose ANY of these):
- **"Apple Distribution"** 
- **"iOS Distribution (App Store and Ad Hoc)"**
- **"Distribution (App Store and Ad Hoc)"**

### ❌ **Wrong Certificate Types** (don't use these):
- **"Apple Development"** (for development only)
- **"iOS Development"** (for development only)  
- **"Mac Distribution"** (for macOS apps)
- **"Developer ID Application"** (for direct distribution)

---

## 📱 Apple Developer Portal Navigation

### Step 1: Access Certificates
1. **Go to**: [developer.apple.com/account](https://developer.apple.com/account)
2. **Sign in** with your Apple ID (must have paid Developer Program)
3. **Click**: **"Certificates, Identifiers & Profiles"** (left sidebar)
4. **Click**: **"Certificates"** (under iOS, tvOS, watchOS section)

### Step 2: Create New Certificate  
1. **Click**: **"+"** button (top right, next to "Certificates")
2. **Look for**: One of the distribution certificate types listed above
3. **If you don't see them**: Your account might not have the right permissions

---

## 🛠️ Before You Start: Create CSR

**You MUST create a Certificate Signing Request first:**

### On your Mac:
1. **Open**: Keychain Access (Applications → Utilities)
2. **Menu**: Keychain Access → Certificate Assistant → Request a Certificate...
3. **Fill**:
   - Email: Your Apple ID email
   - Common Name: Your name
   - Request is: **Saved to disk** ✅
4. **Save**: Keep the `.certSigningRequest` file

---

## 🔧 Troubleshooting

### "I don't see any Distribution options"

**Possible causes:**
- ❌ **Not enrolled** in Apple Developer Program ($99/year)
- ❌ **Wrong account type** (free account only shows Development)
- ❌ **Insufficient permissions** (not Admin/App Manager role)

**Solutions:**
1. **Verify enrollment**: Check if you have paid Developer Program
2. **Check role**: Account holder should grant you proper access
3. **Try again**: Sometimes portal takes time to update permissions

### "Certificate creation fails"

**Common issues:**
- ❌ **No CSR uploaded**: You must upload the `.certSigningRequest` file first
- ❌ **Wrong CSR**: CSR must be created on the Mac you'll use for signing
- ❌ **Expired CSR**: Create a new CSR if yours is old

### "I see 'Pending' certificates"

- ⏳ **Normal**: New certificates may show "Pending" briefly
- 🔄 **Refresh**: Wait 1-2 minutes and refresh the page
- 📧 **Check email**: Apple sends confirmation when ready

---

## ✅ Success Indicators

You've successfully created the certificate when:

1. ✅ **Certificate shows** "Active" status in portal
2. ✅ **Downloaded** the `.cer` file  
3. ✅ **Installed** in Keychain (double-click `.cer`)
4. ✅ **Exported** as `.p12` from Keychain (right-click → Export)
5. ✅ **Set password** when exporting .p12

---

## 🚀 Next Steps

After creating the distribution certificate:

1. **Create App Store Provisioning Profile** (links to your certificate)
2. **Convert to Base64** for GitHub Secrets
3. **Test signing** locally before automating

**📖 Full Guide**: [IOS_GITHUB_ACTIONS.md](./IOS_GITHUB_ACTIONS.md)

---

## 🆘 Still Need Help?

If you're still having issues:

1. **Screenshot**: Take a screenshot of what you see in the portal
2. **Account type**: Verify you have a paid Apple Developer Program membership
3. **Try different browser**: Sometimes Safari works better than Chrome
4. **Contact Apple**: Developer Support can verify your account status

**Remember**: You NEED a paid Apple Developer Program ($99/year) to create distribution certificates!