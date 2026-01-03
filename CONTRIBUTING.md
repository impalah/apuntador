# Contributing to Apuntador

Thank you for your interest in contributing to **Apuntador**! This is a modular, multi-platform teleprompter built with Vue 3 + TypeScript, designed for web, Android (Capacitor), and desktop (Tauri) deployments.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing Guidelines](#testing-guidelines)
- [Code Style and Standards](#code-style-and-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Build and Deployment](#build-and-deployment)
- [Internationalization](#internationalization)
- [Getting Help](#getting-help)

## Code of Conduct

This project adheres to a [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

### Prerequisites

- **Node.js** 20+ (LTS recommended)
- **npm** (comes with Node.js)
- **Git**

For platform-specific development:
- **Android**: Android Studio and Java 17+
- **Desktop**: Rust toolchain for Tauri builds

### Quick Start

1. **Fork the repository** on GitHub
2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/apuntador.git
   cd apuntador
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Start development server**:
   ```bash
   npm run dev
   ```
5. **Open** http://localhost:3000 in your browser

## Development Setup

### Environment Setup

```bash
# Install dependencies
npm install

# Run type checking
npm run typecheck

# Run linting
npm run lint

# Run tests
npm test

# Run tests with coverage
npm run coverage
```

### Using Makefile (Optional)

The project includes a Makefile for common tasks:

```bash
make install    # Install dependencies
make dev        # Start dev server
make build      # Production build
make test       # Run tests
make lint       # Run linting
make clean      # Clean build artifacts
```

## Project Structure

```
apuntador/
├── src/
│   ├── components/         # Vue components (modular architecture)
│   ├── coordinators/       # Component orchestration logic
│   ├── adapters/          # Store-to-component bridges
│   ├── stores/            # Pinia state management
│   ├── utils/             # Pure utility functions
│   ├── types/             # TypeScript definitions
│   └── pages/             # Route components
├── tests/
│   ├── unit/              # Unit tests (Vitest)
│   └── e2e/               # End-to-end tests (Playwright)
├── android/               # Capacitor Android configuration
├── src-tauri/             # Tauri desktop configuration
└── docs/                  # Documentation
```

### Key Architectural Patterns

- **Modular Components**: Components communicate via typed interfaces
- **Coordinator Pattern**: Business logic orchestration between components
- **Store Adapters**: Bridge Pinia stores to component interfaces
- **Multi-Platform**: Web, Android (Capacitor), Desktop (Tauri)

## Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/feature-name` - Feature branches
- `bugfix/bug-description` - Bug fix branches
- `hotfix/critical-fix` - Critical production fixes

### Feature Development

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Develop with tests**:
   - Write tests first (TDD encouraged)
   - Ensure ≥80% test coverage for new code
   - Follow existing patterns and architecture

3. **Test thoroughly**:
   ```bash
   npm test           # Unit tests
   npm run test:e2e   # End-to-end tests
   npm run typecheck  # TypeScript validation
   npm run lint       # Code linting
   ```

4. **Commit and push**:
   ```bash
   git add .
   git commit -m "feat: add manual scroll synchronization"
   git push origin feature/your-feature-name
   ```

## Testing Guidelines

### Test Coverage Requirements

- **Overall project**: ≥85% coverage
- **New features**: ≥80% coverage
- **Critical utilities**: ≥90% coverage

### Test Types

1. **Unit Tests** (Vitest + @vue/test-utils):
   ```bash
   npm test                    # Run all unit tests
   npm test -- --watch         # Watch mode
   npm test -- stores/         # Test specific directory
   ```

2. **End-to-End Tests** (Playwright):
   ```bash
   npm run test:e2e           # Run e2e tests
   npm run test:e2e -- --ui   # Interactive mode
   ```

### Writing Tests

- **Stores**: Focus on business logic, state transitions, persistence
- **Components**: Test props, events, user interactions, accessibility
- **Utils**: Test edge cases, error handling, performance

Example test structure:
```typescript
describe('FeatureName', () => {
  describe('Core Functionality', () => {
    it('should handle basic use case', () => {
      // Arrange, Act, Assert
    })
  })
  
  describe('Edge Cases', () => {
    it('should handle error conditions', () => {
      // Test error scenarios
    })
  })
})
```

## Code Style and Standards

### TypeScript

- **Strict mode**: Enabled with strict type checking
- **Interfaces**: Prefer interfaces over types for object shapes
- **Composition API**: Use `<script setup>` for Vue components
- **JSDoc**: Document public functions and complex logic

### Vue Components

- **Single File Components**: Use `.vue` files with `<script setup>`
- **Props**: Use TypeScript interfaces for prop definitions
- **Events**: Define custom events with proper typing
- **Styling**: Scoped styles with SCSS support

### Code Organization

- **Pure functions**: Utilities should be side-effect free
- **Separation of concerns**: Business logic in stores, presentation in components
- **Modular interfaces**: Components communicate via typed contracts

### Linting and Formatting

```bash
npm run lint          # ESLint + Vue linting
npm run format        # Prettier formatting
npm run stylelint     # CSS/SCSS linting
```

Configuration files:
- ESLint: `eslint.config.mjs`
- Prettier: `.prettierrc`
- Stylelint: `stylelint.config.cjs`

## Commit Guidelines

We follow [Conventional Commits](https://conventionalcommits.org/):

### Commit Types

- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes

### Commit Format

```
type(scope): description

[optional body]

[optional footer]
```

### Examples

```bash
feat: add manual scroll synchronization
fix(teleprompter): resolve scroll position reset issue
docs: update contributing guidelines
test: add coverage for scroll sync functionality
```

## Pull Request Process

### Before Submitting

1. **Ensure all tests pass**:
   ```bash
   npm test && npm run test:e2e && npm run typecheck
   ```

2. **Check code coverage**:
   ```bash
   npm run coverage
   ```

3. **Lint and format**:
   ```bash
   npm run lint && npm run format
   ```

4. **Update documentation** if needed

### PR Guidelines

1. **Title**: Use conventional commit format
2. **Description**: 
   - Explain what changes were made and why
   - Reference any related issues
   - Include screenshots for UI changes
   - List breaking changes (if any)

3. **Checklist**:
   - [ ] Tests pass
   - [ ] Code coverage maintained
   - [ ] Documentation updated
   - [ ] No breaking changes (or properly documented)
   - [ ] Follows code style guidelines

### Review Process

- **Automated checks**: CI/CD pipeline runs tests and linting
- **Code review**: At least one maintainer review required
- **Testing**: Reviewers may test functionality locally
- **Approval**: PR approved and merged by maintainer

## Build and Deployment

### Web Build
```bash
npm run build        # Production web build
npm run preview      # Preview production build
```

### Android Build
```bash
npm run android:apk:build    # Build APK (Windows PowerShell)
./build-android-apk.sh       # Build APK (Linux/macOS)
make android-apk             # Cross-platform build
```

### Desktop Build
```bash
npm run tauri:build:win      # Windows MSI
npm run tauri:build:mac      # macOS universal binary
make tauri-build-release     # Platform-specific builds
```

## Internationalization

### Adding Translations

1. **Add keys** to language files:
   ```typescript
   // src/locales/en-US.json
   {
     "feature": {
       "newButton": "New Button"
     }
   }
   
   // src/locales/es-ES.json  
   {
     "feature": {
       "newButton": "Nuevo Botón"
     }
   }
   ```

2. **Use in components**:
   ```vue
   <template>
     <button>{{ $t('feature.newButton') }}</button>
   </template>
   ```

### Translation Guidelines

- **No hardcoded strings**: All user-facing text must be internationalized
- **Descriptive keys**: Use nested, descriptive keys
- **Context**: Provide context for translators when needed
- **Testing**: Test with different languages

## Getting Help

### Resources

- **Documentation**: Check the `docs/` directory
- **Architecture Guide**: `docs/MODULAR_ARCHITECTURE.md`
- **API Reference**: Generated TypeDoc documentation
- **Examples**: Look at existing components and tests

### Communication

- **Issues**: Use GitHub Issues for bug reports and feature requests
- **Discussions**: Use GitHub Discussions for questions and ideas
- **Security**: Report security issues privately to maintainers

### Issue Templates

When creating issues, please use the provided templates:

- **Bug Report**: Include reproduction steps, expected vs actual behavior
- **Feature Request**: Describe the feature, use case, and proposed implementation
- **Documentation**: Specify what documentation needs improvement

## Development Tips

### Performance

- **Bundle Analysis**: Use `npm run build -- --report` to analyze bundle size
- **Testing**: Run tests in watch mode during development
- **Hot Reload**: Development server supports hot module replacement

### Debugging

- **Vue DevTools**: Browser extension for Vue debugging
- **Debug Logs**: Check console for development debug information
- **Test Debugging**: Use `--ui` flag for interactive test debugging

### Platform-Specific Development

- **Android**: Use Android Studio for device testing
- **Desktop**: Test on target platforms (Windows, macOS, Linux)
- **Web**: Test on multiple browsers and screen sizes

---

Thank you for contributing to Apuntador! Your efforts help make this teleprompter solution better for everyone. [TARGET]