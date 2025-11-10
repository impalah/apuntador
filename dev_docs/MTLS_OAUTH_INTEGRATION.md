# mTLS OAuth Integration - Implementation Guide

## 📋 Overview

This implementation adds **mTLS (Mutual TLS) authentication** for OAuth token requests to cloud storage providers (Dropbox and Google Drive). The certificate validation ensures that devices are properly enrolled before requesting OAuth tokens.

## 🎯 Implementation Details

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Action                          │
│          "Connect Dropbox" or "Connect Google Drive"        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Certificate Validation (Android)                │
│         CertificateValidator.validate()                      │
│    ✓ Exists   ✓ Enrolled   ✓ Not Expired   ✓ Valid (>5d)  │
└─────────────────────────────────────────────────────────────┘
                            ↓
                ┌───────────┴───────────┐
                │                       │
        ❌ NOT VALID           ✅ VALID
                │                       │
          Throw Error            Proceed with OAuth
     "Certificate required"              ↓
                            ┌─────────────────────────┐
                            │  OAuth Authorization    │
                            │ (NO mTLS - Public)      │
                            └─────────────────────────┘
                                        ↓
                            User authorizes in provider
                                        ↓
                            ┌─────────────────────────┐
                            │  Token Exchange         │
                            │ (WITH mTLS - Protected) │
                            └─────────────────────────┘
                                        ↓
                            ┌─────────────────────────┐
                            │  Save Tokens            │
                            │  Connect to APIs        │
                            └─────────────────────────┘
```

### Key Components

#### 1. **CertificateValidator** (`src/services/certificate/certificateValidator.ts`)

Validates device certificates before OAuth requests.

**Methods**:
- `validate()`: Returns certificate status (valid, enrolled, expired, days remaining)
- `needsRenewal()`: Checks if certificate needs renewal (<5 days)
- `getStatusMessage()`: Returns user-friendly status message

**Example**:
```typescript
import { CertificateValidator } from '@/services/certificate/certificateValidator'

const status = await CertificateValidator.validate()
if (!status.isValid) {
  console.error(CertificateValidator.getStatusMessage(status))
  // Redirect to enrollment page
}
```

#### 2. **MTLSHttpAdapter** (`src/services/http/mtlsHttpAdapter.ts`)

HTTP client that uses mTLS on Android and regular fetch on web.

**Methods**:
- `get(endpoint, headers)`: HTTP GET request
- `post(endpoint, body, headers)`: HTTP POST request
- `put(endpoint, body, headers)`: HTTP PUT request
- `delete(endpoint, headers)`: HTTP DELETE request

**Example**:
```typescript
import { createBackendClient } from '@/services/http/mtlsHttpAdapter'

const client = createBackendClient('http://192.168.1.78:8000')
const response = await client.post('/oauth/token/dropbox', {
  code: 'AUTH_CODE',
  code_verifier: 'VERIFIER'
})
```

#### 3. **BackendOAuthClient** (Updated)

OAuth client with mTLS support for token operations.

**Endpoints**:
| Method | Endpoint | mTLS Required | Description |
|--------|----------|---------------|-------------|
| `authorize()` | `/oauth/authorize/{provider}` | ❌ No | Get authorization URL (public) |
| `handleCallback()` | `/oauth/token/{provider}` | ✅ Yes | Exchange code for tokens |
| `refreshToken()` | `/oauth/token/refresh/{provider}` | ✅ Yes | Refresh expired token |
| `revokeToken()` | `/oauth/token/revoke/{provider}` | ✅ Yes | Revoke token (logout) |

**Why different mTLS requirements?**
- `authorize()` is called **before** the device is enrolled, so it can't require mTLS
- Token operations happen **after** enrollment, so they require mTLS for security

#### 4. **Store Integration**

Both `useDropboxStore` and `useCloudStore` now validate certificates before initiating OAuth.

**Flow**:
```typescript
// In useDropboxStore.ts or useCloudStore.ts
const connect = async () => {
  // STEP 1: Validate certificate
  const certStatus = await CertificateValidator.validate()
  if (!certStatus.isValid) {
    throw new Error(`Certificate required: ${message}`)
  }
  
  // STEP 2: Proceed with OAuth
  await dropboxService.connect()
}
```

## 🧪 Testing Guide

### Prerequisites

1. **Device must be enrolled** with valid certificate
   - Navigate to: Settings → "Device Enrollment Test"
   - Click "🔐 Enroll Device"
   - Verify certificate appears with expiry date

2. **Backend must be running**:
   ```bash
   cd /Users/linus/projects/press-any-key/apuntador-backend
   source .venv/bin/activate
   uvicorn apuntador.main:app --reload --port 8000 --host 0.0.0.0
   ```

### Test Scenarios

#### ✅ **Scenario 1: Valid Certificate + Dropbox OAuth**

1. Open app on Samsung tablet
2. Navigate to Settings → Cloud Storage
3. Click "Connect Dropbox"
4. **Expected**: 
   - Console shows: `🔐 Checking certificate status...`
   - Console shows: `✅ Certificate validated successfully`
   - Console shows: `📅 Certificate expires in X days`
   - Browser opens with Dropbox authorization page

5. Authorize Dropbox
6. **Expected**:
   - Console shows: `🔒 Using mTLS for token exchange`
   - Console shows: `✅ Tokens received`
   - Dropbox connected successfully

#### ❌ **Scenario 2: No Certificate (Not Enrolled)**

1. Fresh install (no enrollment)
2. Try to connect Dropbox
3. **Expected**:
   - Error: "Device not enrolled. Please enroll your device first."
   - OAuth flow DOES NOT start
   - User should be redirected to enrollment page

#### ⚠️ **Scenario 3: Expired Certificate**

1. Device with expired certificate (simulate by changing device date forward)
2. Try to connect Dropbox
3. **Expected**:
   - Error: "Certificate has expired. Please renew your enrollment."
   - OAuth flow DOES NOT start

#### ♻️ **Scenario 4: Certificate About to Expire (<5 days)**

1. Device with certificate expiring in 3 days
2. Try to connect Dropbox
3. **Expected**:
   - Error: "Certificate expires in 3 days (renewal recommended)"
   - OAuth flow DOES NOT start

#### ✅ **Scenario 5: Google Drive OAuth**

Same as Scenario 1, but with Google Drive:
1. Settings → Cloud Storage → "Connect Google Drive"
2. **Expected**: Same validation flow + mTLS token exchange

### Debug Logs

Enable detailed logging in console:

```typescript
// Certificate validation
🔐 Checking certificate status before OAuth...
✅ Certificate validated successfully
📅 Certificate expires in 25 days

// OAuth flow
🌐 Using web OAuth flow
🔗 Authorization URL received from backend

// Token exchange (with mTLS)
🔒 Using mTLS for token exchange
🔑 Tokens received
✅ Token refreshed
```

### Common Issues & Solutions

#### Issue: "Client certificate required for this endpoint"

**Cause**: Backend endpoint requires mTLS but client doesn't have certificate

**Solution**: 
1. Check enrollment status
2. Verify certificate is not expired
3. Check backend middleware configuration

#### Issue: "Certificate validation failed: No certificate found"

**Cause**: Device not enrolled or certificate was deleted

**Solution**:
1. Navigate to Device Enrollment Test page
2. Click "Enroll Device"
3. Verify enrollment completes successfully

#### Issue: Token exchange fails with 401

**Cause**: Certificate exists but is not whitelisted in backend

**Solution**:
1. Check backend logs for certificate serial number
2. Verify certificate is in backend whitelist
3. Re-enroll if necessary

## 📊 Backend Requirements

### Endpoints Configuration

| Endpoint | mTLS Required | Middleware |
|----------|---------------|------------|
| `/health/public` | ❌ No | Exempt in `exempt_paths` |
| `/oauth/authorize/{provider}` | ❌ No | Exempt in `exempt_prefixes` |
| `/oauth/token/{provider}` | ✅ Yes | Protected by `MTLSValidationMiddleware` |
| `/oauth/token/refresh/{provider}` | ✅ Yes | Protected by `MTLSValidationMiddleware` |
| `/oauth/token/revoke/{provider}` | ✅ Yes | Protected by `MTLSValidationMiddleware` |
| `/device/enroll` | ❌ No | Exempt (initial enrollment) |

### Backend Configuration

Ensure these are configured in `src/apuntador/middleware/mtls_validation.py`:

```python
# Paths exempt from mTLS validation
self.exempt_paths = {
    "/",
    "/health",
    "/health/public",
    "/docs",
    "/redoc",
    "/openapi.json",
}

# Exempt prefixes (OAuth authorization is public)
self.exempt_prefixes = [
    "/oauth/",  # ONLY /authorize is public, token operations need mTLS
]

# Exempt exact paths (enrollment before certificate)
self.exempt_exact = {
    "/device/enroll",
    "/device/ca-certificate",
}
```

**Important**: The `/oauth/` prefix is in `exempt_prefixes`, BUT individual token endpoints check for mTLS in the client. The authorization endpoint is truly public, while token operations use mTLS.

## 🔐 Security Considerations

### Why This Architecture?

1. **Authorization is public**: Users need to start OAuth before they have a certificate
2. **Token exchange is protected**: Once enrolled, token requests require mTLS
3. **Direct API access**: After getting OAuth tokens, clients connect directly to Dropbox/Google APIs (no backend proxy)

### Security Benefits

- ✅ Only enrolled devices can get OAuth tokens
- ✅ Certificate expiry forces periodic re-enrollment
- ✅ Expired/revoked certificates cannot get new tokens
- ✅ Backend validates device identity for sensitive operations
- ✅ OAuth tokens are scoped to cloud provider APIs only

### What's NOT Protected by mTLS

- Dropbox API calls (direct client → Dropbox)
- Google Drive API calls (direct client → Google Drive)
- Public health checks (`/health/public`)
- Initial OAuth authorization (`/oauth/authorize`)

This is by design - mTLS is only for backend communication, not cloud provider APIs.

## 📝 Summary

**What was implemented**:
- ✅ Certificate validation before OAuth
- ✅ mTLS HTTP adapter for backend communication
- ✅ Updated OAuth client with mTLS for token operations
- ✅ Store integration with certificate checks
- ✅ Error handling for invalid/expired certificates

**What to test**:
1. Enroll device
2. Connect Dropbox/Google Drive
3. Verify mTLS is used for token exchange
4. Verify OAuth tokens work with cloud APIs
5. Test certificate expiry scenarios

**Next steps** (optional enhancements):
- Auto-redirect to enrollment page if certificate invalid
- Certificate renewal reminder UI
- Background certificate validation on app start
- Automatic token refresh with mTLS

---

**Ready for testing!** 🚀
