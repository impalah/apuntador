# Apuntador Roadmap

This document outlines the current features and planned development roadmap for **Apuntador**, the professional mobile-first teleprompter application.

## Version Overview

| Version | Status      | Release Date | Focus                             |
| ------- | ----------- | ------------ | --------------------------------- |
| **1.0** | Released    | Q3 2025      | Core Features & Multi-Platform    |
| **1.1** | In Progress | Q4 2025      | Multilanguage & Basic Integration |
| **1.2** | Planned     | Q1 2026      | Cloud Sync & Content Management   |
| **1.3** | Planned     | Q2 2026      | Professional Features & Analytics |

---

## Version 1.0 - Core Features (Released)

**Status**: **Released** - October 2025

### Core Teleprompter Features

- **Auto-scrolling** with adjustable speed (10-200 px/sec)
- **Smooth 60fps scrolling** using `requestAnimationFrame`
- **Highlight band** to focus on current reading position
  - Configurable height (1-2 lines)
  - Adjustable vertical position
  - Customizable dimming intensity
- **Professional mirror modes** for beam-splitter setups
  - Horizontal mirror (left-to-right)
  - Vertical mirror (top-to-bottom)
  - Combined mirroring (180° rotation)

### Multi-Platform Support

- **Web Application** - Static hosting compatible
  - Vercel, Netlify, GitHub Pages, Firebase
  - Docker deployment support
  - Progressive Web App features
- **Android Mobile App** (Capacitor)
  - Automated APK builds via GitHub Actions
  - Google Play Store bundle optimization
  - Edge-to-edge immersive mode
  - Hardware back button handling
- **Desktop Application** (Tauri)
  - Windows, macOS, Linux support
  - Native window controls
  - Code signing for Windows
  - Fullscreen mode with native APIs
- **iOS Mobile App** (Capacitor)
  - Automated package builds via GitHub Actions
  - Apple App Store bundle optimization

### User Interface & Experience

- **Mobile-first responsive design** with Vuetify 3
- **Touch-optimized controls**
  - Single tap to show/hide toolbar
  - Swipe gestures for navigation
  - Press and hold for quick access
- **Comprehensive keyboard shortcuts**
  - Space (play/pause), arrows (navigation)
  - Speed and font size controls
  - Mirror mode toggles
- **Floating toolbar with auto-hide**
  - Minimal mode for small screens
  - Context-aware button placement
  - Professional fullscreen experience

### Content Management

- **Markdown support** with rich formatting
  - `markdown-it` with plugins
  - Anchor links, superscript/subscript
  - Mark highlighting, footnotes
- **Multiple import methods**
  - File picker (.md/.txt files)
  - Drag and drop interface
  - Built-in markdown editor with live preview
- **Sample content** included for quick testing

### Customization & Settings

- **Comprehensive appearance settings**
  - Font family selection
  - Font size (16-200px range)
  - Line height adjustment (1.0-3.0x)
  - Custom colors (text/background)
- **Performance optimization**
  - Scroll speed limits and presets
  - Memory-efficient rendering
  - Battery-optimized animations
- **Local data persistence**
  - Settings stored in browser storage
  - Content auto-save
  - Privacy-focused (no external servers)

### Technical Excellence

- **Modern tech stack**
  - Vue 3.4+ with Composition API
  - TypeScript 5.0+ for type safety
  - Vite 5.0+ for fast development
  - Pinia 2.1+ for state management
- **Comprehensive testing**
  - 100% unit test coverage (25/25 tests)
  - Cross-browser E2E testing (54/54 tests)
  - Performance monitoring
  - Accessibility compliance (WCAG 2.1 AA)
- **Developer experience**
  - Complete TypeScript definitions
  - ESLint + Prettier configuration
  - API documentation generation
  - Cross-platform build scripts

### Performance Metrics (v1.0)

- **Bundle Size**: ~200KB gzipped
- **First Contentful Paint**: <1.5s
- **Time to Interactive**: <2.0s
- **Memory Usage**: <50MB sustained
- **Browser Support**: Chrome 90+, Safari 14+, Firefox 88+, Edge 90+

---

## Version 1.1 - Multilanguage & Basic Integration (Q4 2025)

**Status**: **In Progress** _(v1.1.23 - Multilanguage completed, cloud integration implemented, one drive pending, file formats pending)_

### Multilanguage Support

- **Complete multilanguage implementation** **COMPLETED**
  - **New languages implemented**: Català (ca-ES), Galego (gl-ES), Português Brasil (pt-BR), Português Portugal (pt-PT), Français (fr-FR), Deutsch (de-DE), Italiano (it-IT)
  - **Automatic browser detection** for all supported languages
  - **Fallback system** with Spanish as default
  - **Dynamic language switching** with persistence
  - [ ] **RTL support** for Hebrew, Arabic, and other RTL languages _(moved to v1.2)_

### Integration Capabilities

- **Basic third-party integrations** **COMPLETED**
  - Google Drive, Dropbox for script files
  - **Technical requirements**: File API integration, cloud storage SDKs
- [ ] **Extended third-party integrations** **IN PROGRESS**
  - OneDrive sync for script files
  - Import/export compatibility with common formats
  - **Technical requirements**: File API integration, cloud storage SDKs

---

## Version 1.2 - Cloud Sync & Enhanced Content Management (Q1 2026)

**Status**: **Planned**

### Cloud Sync & Storage

- [ ] **Optional cloud storage integration**
  - Sync scripts across devices
  - Backup and restore functionality
  - Offline-first with sync when available
  - **Technical requirements**: Cloud storage APIs, sync algorithms

### Enhanced Multilanguage Features

- [ ] **RTL language support**
  - Hebrew, Arabic, Persian, Urdu support
  - Automatic text direction detection
  - **Technical requirements**: RTL CSS implementation, text direction management

### Content Management & Organization

- [ ] **Script templates library**
  - Pre-built templates for different use cases
  - Custom template creation and sharing
  - Template categories (news, presentations, etc.)
- [ ] **Advanced file organization**
  - Folder structure for scripts
  - Tagging and search functionality
  - Favorites and recent scripts
  - **Technical requirements**: Metadata management, search indexing

### Multi-device Continuity

- [ ] **Basic device synchronization**
  - Resume reading position across devices
  - Synchronized settings and preferences
  - Real-time sync indicators
  - **Technical requirements**: Simple cloud sync, no real-time collaboration

---

## 🎬 Version 1.3 - Professional Features & Analytics (Q2 2026)

**Status**: **Planned**  
_Introduces professional-grade features while maintaining client-only architecture_

### Professional Analytics (Local Storage)

- [ ] **Reading performance analytics** _(Single device, local storage)_
  - Words per minute tracking and trends
  - Reading session statistics and history
  - Performance coaching insights
  - **Technical requirements**: Local analytics engine, session management

### Enhanced Script Features

- [ ] **Advanced script formatting** _(Preparation for timing features)_
  - Paragraph markers and section breaks
  - Reading time estimates per section
  - Enhanced markdown extensions
  - **Technical requirements**: Extended markdown parser, content analysis

### Basic Professional Tools

- [ ] **Presentation enhancements**
  - Multiple cue modes (practice, live, recording)
  - Basic timing indicators
  - Session type management
  - **Technical requirements**: Session state management, timing utilities

### Collaboration Features (Basic)

- [ ] **Multi-user script editing** _(Simple sharing)_
  - Real-time collaborative editing
  - Comment and suggestion system
  - Version history and rollback
  - **Technical requirements**: Operational transforms, conflict resolution

---

## 🏭 Version 1.4 - Advanced Professional Studio Features (Q3 2026)

**Status**: **Future Planning**  
_Requires major architectural changes and backend infrastructure_

### Session Management & Coordination

- [ ] **Professional session system**
  - Session types: rehearsal, live broadcast, recording
  - Multi-user session coordination
  - **Technical requirements**: Backend services, user authentication, real-time sync
- [ ] **Advanced script formats**
  - LYR-format compatibility for timed scripts
  - Industry-standard teleprompter formats
  - **Technical requirements**: New parser engines, format conversion tools

### Multi-Device Synchronization

- [ ] **Producer/Presenter mode**
  - Dual-screen professional setup
  - Real-time timing cues and control
  - **Technical requirements**: WebRTC infrastructure, device pairing protocols
- [ ] **Advanced scheduling with timing**
  - Automatic speed adjustments based on schedule
  - Live broadcast timing integration
  - **Technical requirements**: Timing engine, external system APIs

### Studio Integration

- [ ] **Broadcasting system compatibility**
  - OBS Studio integration
  - Professional teleprompter hardware support
  - **Technical requirements**: Native plugins, hardware SDKs

---

## Future Considerations (v1.5+)

### Advanced Analytics

- [ ] **AI-powered reading insights**
  - Optimal reading speed suggestions
  - Difficulty assessment
  - Audience engagement predictions
- [ ] **Performance coaching**
  - Reading pattern analysis
  - Improvement recommendations
  - Practice session guidance

### Integration Capabilities

- [ ] **Third-party integrations**
  - Google Drive, Dropbox sync
  - CMS and documentation systems
  - Video production workflows
- [ ] **API for developers**
  - RESTful API for external tools
  - Webhook notifications
  - Custom integration possibilities

### AI-Powered Features

- [ ] **Script optimization suggestions**
  - Reading difficulty analysis
  - Pacing recommendations
  - Content structure improvements
- [ ] **Intelligent auto-formatting**
  - Automatic paragraph breaks
  - Emphasis detection and highlighting
  - Speaking cue insertion

### Voice Control Integration

- [ ] **Hands-free operation**
  - Voice commands for play/pause
  - Speed adjustment by voice
  - Navigation commands
- [ ] **Speech recognition**
  - Real-time speech-to-text
  - Live script following
  - Pronunciation guidance

### Advanced Hardware Support

- [ ] **External controller integration**
  - Foot pedals for hands-free control
  - Wireless presenter remotes
  - Custom hardware solutions
- [ ] **Professional display support**
  - Multiple monitor configurations
  - Teleprompter hardware compatibility
  - High-resolution display optimization

### Broadcasting & Streaming

- [ ] **Live streaming integration**
  - OBS Studio plugin
  - Stream overlay compatibility
  - Real-time audience interaction
- [ ] **Professional studio features**
  - Dual-monitor presenter mode
  - Producer control interfaces
  - Broadcast-quality rendering

### Enterprise Features

- [ ] **Enterprise deployment**
  - On-premise hosting options
  - SSO and authentication systems
  - Advanced security features
- [ ] **Organization management**
  - Multi-tenant architecture
  - Usage analytics and reporting
  - Custom branding options

### Multilanguage integration

- [ ] **Support for multilanguage**
  - Increase the list of available languages.
  - RTL, LTR support.

---

## Architectural Evolution & Technical Requirements

### Current Architecture (v1.0-1.3)

- **Client-only application**: No backend services required
- **Local storage**: Browser-based persistence only
- **Single device**: Independent operation per device
- **Static deployment**: Can be hosted as static files

### Required Changes for Advanced Features (v1.4+)

#### Backend Infrastructure Requirements

- [ ] **Real-time synchronization services**
  - WebSocket/WebRTC infrastructure for multi-device sync
  - User authentication and session management
  - **Impact**: Requires backend services, hosting costs, complexity increase

- [ ] **Data persistence layer**
  - Cloud database for cross-device session data
  - Analytics storage and processing
  - **Impact**: Database design, data privacy considerations, GDPR compliance

#### Format & Protocol Extensions

- [ ] **Enhanced script formats**
  - LYR format parser for timed scripts
  - Industry teleprompter format compatibility
  - **Impact**: New parsing engines, backward compatibility challenges

- [ ] **Device communication protocols**
  - Producer-presenter device pairing
  - Real-time control message passing
  - **Impact**: Network protocols, security considerations, connection management

#### UI/UX Architectural Changes

- [ ] **Multi-mode interfaces**
  - Producer control panel vs presenter view
  - Session management interfaces
  - **Impact**: Complete UI restructuring, user experience complexity

### Migration Strategy

1. **v1.1-1.2**: Keep current simple, client-only architecture
2. **v1.3**: Professional features with local storage (no backend required)
3. **v1.4**: Introduce optional backend services for advanced features
4. **v1.5+**: Full professional studio integration with real-time sync

---

## Development Metrics & Goals

### Quality Standards (All Versions)

- **Test Coverage**: ≥85% for all components
- **Performance**: Core Web Vitals >90
- **Accessibility**: WCAG 2.1 AA compliance
- **Security**: Regular dependency audits
- **Documentation**: 100% API coverage

### Platform Targets

- **Web**: Universal browser support
- **Mobile**: iOS 14+, Android API 28+
- **Desktop**: Windows 10+, macOS 11+, Linux (major distros)

### Community Goals

- **GitHub Stars**: Target 1,000+ by v1.2
- **Contributors**: Active contributor community
- **Documentation**: Comprehensive guides and tutorials
- **Ecosystem**: Plugin and extension support

---

## Contributing to the Roadmap

We welcome community input on our roadmap! Here's how you can contribute:

### Feature Requests

- **[Open a Feature Request](https://github.com/impalah/apuntador/issues/new?template=feature_request.md)**
- **[Vote on Existing Proposals](https://github.com/impalah/apuntador/discussions/categories/ideas)**
- **[Join Roadmap Discussions](https://github.com/impalah/apuntador/discussions/categories/roadmap)**

### Development Participation

- **[Check "Help Wanted" Issues](https://github.com/impalah/apuntador/labels/help%20wanted)**
- **[Pick "Good First Issue" Tasks](https://github.com/impalah/apuntador/labels/good%20first%20issue)**
- **[Read Contributing Guidelines](./CONTRIBUTING.md)**

### Community Feedback

- **User Research**: Participate in usability studies
- **Beta Testing**: Help test new features before release
- **Documentation**: Improve guides and tutorials

---

## Release Schedule

### Regular Release Cycle

- **Major Versions**: Quarterly (Q1, Q2, Q3, Q4)
- **Minor Updates**: Monthly feature additions
- **Patch Releases**: As needed for bug fixes
- **Security Updates**: Immediate as required

### Version Numbering

- **Major**: Significant new features and capabilities
- **Minor**: New features, improvements, non-breaking changes
- **Patch**: Bug fixes, security updates, minor improvements

### Communication Channels

- **[Release Notes](https://github.com/impalah/apuntador/releases)** - Detailed change logs
- **[Twitter Updates](https://twitter.com/apuntador)** - Quick announcements
- **Newsletter** - Monthly development updates
- **[Discord Community](https://discord.gg/apuntador)** - Real-time discussions

---

<div align="center">

**The roadmap is a living document that evolves with our community's needs**

[Star the Project](https://github.com/impalah/apuntador) • [Join Discussions](https://github.com/impalah/apuntador/discussions) • [Report Issues](https://github.com/impalah/apuntador/issues)

</div>
