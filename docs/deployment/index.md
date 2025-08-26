# Deployment Guide

This guide covers various deployment options for Apuntador, from simple static hosting to containerized deployments.

## Quick Deployment

### Static Hosting (Recommended)

Apuntador is a static single-page application (SPA) that can be deployed to any static hosting service.

```bash
# Build for production
npm run build

# The dist/ folder contains your deployable app
# Upload dist/ contents to your static host
```

## Hosting Platforms

### 1. Vercel (Recommended)

**Zero-config deployment with automatic HTTPS:**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# For custom domain
vercel --prod
```

**Or connect your GitHub repository at [vercel.com](https://vercel.com)**

### 2. Netlify

**Deploy via drag-and-drop or Git integration:**

```bash
# Build first
npm run build

# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

**Netlify configuration file (`netlify.toml`):**

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "20"
```

### 3. GitHub Pages

**Free hosting for public repositories:**

```bash
# Install gh-pages
npm install --save-dev gh-pages

# Add to package.json scripts:
# "deploy": "gh-pages -d dist"

# Build and deploy
npm run build
npm run deploy
```

### 4. Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Initialize Firebase
firebase init hosting

# Build and deploy
npm run build
firebase deploy
```

**Firebase configuration (`firebase.json`):**

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

## Docker Deployment

### Dockerfile

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built app
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Configuration

Create `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    sendfile on;
    keepalive_timeout 65;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Handle client-side routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    }
}
```

### Docker Commands

```bash
# Build image
docker build -t apuntador .

# Run container
docker run -p 80:80 apuntador

# Or with docker-compose
docker-compose up -d
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  apuntador:
    build: .
    ports:
      - '80:80'
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
```

## CI/CD Pipelines

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run type check
        run: npm run typecheck

      - name: Run linting
        run: npm run lint

      - name: Run tests
        run: npm run test

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Generate coverage
        run: npm run coverage

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy to Vercel
        uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
```

### GitLab CI

Create `.gitlab-ci.yml`:

```yaml
stages:
  - test
  - build
  - deploy

variables:
  NODE_VERSION: '20'

cache:
  paths:
    - node_modules/

test:
  stage: test
  image: node:$NODE_VERSION
  script:
    - npm ci
    - npm run typecheck
    - npm run lint
    - npm run test
    - npm run test:e2e
  artifacts:
    reports:
      coverage: coverage/
    expire_in: 1 week

build:
  stage: build
  image: node:$NODE_VERSION
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 week
  only:
    - main

deploy:
  stage: deploy
  image: node:$NODE_VERSION
  script:
    - npm install -g vercel
    - vercel --token $VERCEL_TOKEN --prod
  only:
    - main
  environment:
    name: production
    url: https://your-app.vercel.app
```

## Environment Variables

### Build-time Variables

Create `.env.production`:

```bash
# App configuration
VITE_APP_TITLE=Apuntador
VITE_APP_VERSION=${npm_package_version}
VITE_APP_BUILD_DATE=${date}

# Analytics (optional)
VITE_GA_ID=your-ga-id

# API endpoints (if needed)
VITE_API_BASE_URL=https://api.yourapp.com
```

### Deployment Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "deploy:vercel": "vercel --prod",
    "deploy:netlify": "netlify deploy --prod --dir=dist",
    "deploy:firebase": "firebase deploy",
    "deploy:github": "gh-pages -d dist",
    "predeploy": "npm run build"
  }
}
```

## Performance Optimization

### Build Optimization

```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          ui: ['vuetify'],
          utils: ['markdown-it', 'localforage'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})
```

### CDN Configuration

For better global performance, use a CDN:

```html
<!-- In index.html -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://cdn.jsdelivr.net" />
```

## Domain Configuration

### Custom Domain Setup

1. **Point your domain** to your hosting provider
2. **Configure HTTPS** (usually automatic)
3. **Set up redirects** (www to non-www or vice versa)

### SSL/TLS Certificates

Most modern hosting platforms provide automatic HTTPS:

- **Vercel**: Automatic Let's Encrypt certificates
- **Netlify**: Automatic SSL with custom domains
- **Firebase**: Free SSL certificates
- **GitHub Pages**: Automatic HTTPS for github.io domains

## Monitoring & Analytics

### Error Tracking

Consider adding error tracking:

```bash
# Sentry for error monitoring
npm install @sentry/vue

# Configure in main.ts
import * as Sentry from "@sentry/vue"

Sentry.init({
  app,
  dsn: "your-sentry-dsn"
})
```

### Performance Monitoring

```javascript
// Web Vitals tracking
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

getCLS(console.log)
getFID(console.log)
getFCP(console.log)
getLCP(console.log)
getTTFB(console.log)
```

## Troubleshooting

### Common Issues

1. **Blank page after deployment**
   - Check browser console for errors
   - Verify base URL configuration
   - Ensure all assets are loading correctly

2. **Routing issues (404s)**
   - Configure server redirects to index.html
   - Check router history mode configuration

3. **Large bundle size**
   - Enable code splitting
   - Analyze bundle with `npm run build -- --analyze`
   - Optimize imports and dependencies

### Health Checks

Create a simple health check endpoint:

```javascript
// In your app
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
  })
})
```
