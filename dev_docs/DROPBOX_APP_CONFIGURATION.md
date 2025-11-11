# 📱 Dropbox App Configuration for Android

## 🔧 Required Dropbox App Settings

### App Information
- **App Name**: Apuntador (or "Apuntador - Teleprompter")
- **App Type**: App with limited users (during development) → Full Dropbox App (for production)
- **Permission Type**: Full Dropbox (recommended for file access)

### OAuth Configuration

#### Redirect URIs (ALL must be added)

**Production:**
```
https://app.apuntador.io/oauth-callback
apuntador://oauth/dropbox
```

**Development:**
```
http://localhost:3000/oauth-callback
```

**Note**: All three URIs should be configured in the Dropbox app to support web (production), web (development), and mobile (Android/iOS) platforms.

### Permissions & Scopes

**Required Scopes:**
- `files.metadata.read` - List and browse user files
- `files.content.read` - Read file contents for teleprompter
- `files.content.write` - Save and update script files

**Folder Access:**
- App folder access (recommended) OR
- Full Dropbox access (if user needs broader file access)

### App Status Progression

#### Development Phase
1. **Development Status**: App with limited users
2. **Test Users**: Add development team emails
3. **Redirect URIs**: Include localhost for testing

#### Production Phase
1. **Apply for Production**: Submit app review to Dropbox
2. **App Review Information**:
   - **App Description**: "Professional teleprompter app that allows users to save and sync their scripts via Dropbox"
   - **Use Case**: Content creators and speakers need cloud storage for their teleprompter scripts
   - **Data Usage**: Only accesses user-selected script files, no automatic data collection
   - **Screenshots**: Include screenshots showing Dropbox integration

3. **App Icon**: Upload app icon (512x512 minimum)

### App Review Submission Details

**App Description for Dropbox Review:**
```
Apuntador is a professional teleprompter application for content creators, speakers, and presenters. 

The Dropbox integration allows users to:
- Save their teleprompter scripts to their personal Dropbox account
- Access scripts across multiple devices
- Sync script changes automatically
- Organize scripts in folders for different projects

The app only accesses files that users explicitly select through our file browser interface. Users maintain full control over their data and can disconnect the integration at any time.

File types handled: .md (Markdown), .txt (Plain text)
Target users: Content creators, public speakers, teachers, presenters
```

**Screenshots to Include:**
1. Main teleprompter interface
2. Dropbox connection dialog
3. File browser showing Dropbox files
4. Save dialog with Dropbox option
5. Settings screen with cloud integration options

### Technical Implementation Details

**OAuth 2.0 with PKCE:**
- Code challenge method: S256 (SHA256)
- Response type: code
- Client type: Public (mobile app)

**Platform-Specific Handling:**
- **Web**: Standard OAuth redirect to callback URL
- **Android**: Custom URL scheme redirect (`apuntador://oauth/dropbox`)
- **iOS**: Universal Links or custom URL scheme

### Security Considerations

1. **Token Storage**: 
   - Access tokens stored securely on device
   - Refresh tokens handled automatically
   - No server-side token storage

2. **Data Access**:
   - Only reads/writes user-selected files
   - No automatic file scanning or indexing
   - Respects Dropbox rate limits

3. **Privacy**:
   - No data sharing with third parties
   - Files processed locally on user device
   - No analytics or tracking of file contents

### Rate Limiting

**API Usage Patterns:**
- File listing: When user browses folders
- File downloads: When user opens a script
- File uploads: When user saves a script
- Typical usage: 10-50 API calls per session

**Expected Volume:**
- Small app with limited user base initially
- Files are typically small (1-50KB text files)
- Batch operations not used (single file operations)

### Support Information

**Developer Contact:**
- Email: support@apuntador.io
- Website: https://app.apuntador.io

**App Privacy Policy:**
- URL: https://app.apuntador.io/privacy-policy
- Includes specific section on Dropbox data usage

**User Support:**
- In-app help documentation
- Email support for integration issues
- Clear instructions for connecting/disconnecting Dropbox

---

## 📋 Pre-Launch Checklist

### Dropbox App Configuration
- [ ] All redirect URIs added (web + mobile)
- [ ] Correct scopes configured
- [ ] App icon uploaded
- [ ] App description completed
- [ ] Privacy policy URL provided

### Testing
- [ ] OAuth flow works in web browser
- [ ] Android deep link redirects correctly
- [ ] File operations (save/load) functional
- [ ] Error handling works (network issues, auth failures)
- [ ] Rate limiting handled gracefully

### Documentation
- [ ] User documentation for Dropbox setup
- [ ] Developer documentation for maintenance
- [ ] Privacy policy includes Dropbox integration details
- [ ] Support documentation for troubleshooting

### Production Readiness
- [ ] Dropbox app approved for production (if required)
- [ ] All test accounts removed
- [ ] Production redirect URIs verified
- [ ] Performance testing completed

---

**Last Updated**: October 2025  
**Dropbox API Version**: v2  
**OAuth Version**: 2.0 with PKCE