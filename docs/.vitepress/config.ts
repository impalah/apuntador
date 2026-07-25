import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Apuntador Documentation',
  description: 'Mobile-first teleprompter built with Vue 3 + TypeScript',

  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/' },
      { text: 'Architecture', link: '/architecture/' },
      { text: 'Deployment', link: '/deployment/' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Configuration', link: '/guide/configuration' },
          ],
        },
        {
          text: 'User Guide',
          items: [
            { text: 'Basic Usage', link: '/guide/basic-usage' },
            { text: 'Keyboard Shortcuts', link: '/guide/keyboard-shortcuts' },
            { text: 'Touch Gestures', link: '/guide/touch-gestures' },
            { text: 'File Import', link: '/guide/file-import' },
            { text: 'Settings', link: '/guide/settings' },
          ],
        },
        {
          text: 'Advanced',
          items: [
            { text: 'Mirror Modes', link: '/guide/mirror-modes' },
            { text: 'Highlight Band', link: '/guide/highlight-band' },
            { text: 'Customization', link: '/guide/customization' },
          ],
        },
      ],
      '/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/' },
            { text: 'Stores', link: '/stores' },
            { text: 'Components', link: '/components' },
            { text: 'Utils', link: '/utils' },
            { text: 'Types', link: '/types' },
          ],
        },
      ],
      '/architecture/': [
        {
          text: 'Architecture',
          items: [
            { text: 'Overview', link: '/architecture/' },
            { text: 'Tech Stack', link: '/architecture/tech-stack' },
            { text: 'Project Structure', link: '/architecture/project-structure' },
            { text: 'Data Flow', link: '/architecture/data-flow' },
            { text: 'Component Design', link: '/architecture/component-design' },
          ],
        },
      ],
      '/deployment/': [
        {
          text: 'Deployment',
          items: [
            { text: 'Overview', link: '/deployment/' },
            { text: 'Build Process', link: '/deployment/build-process' },
            { text: 'Static Hosting', link: '/deployment/static-hosting' },
            { text: 'Docker', link: '/deployment/docker' },
            { text: 'CI/CD', link: '/deployment/ci-cd' },
          ],
        },
      ],
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/yourusername/apuntador' }],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025 Apuntador Team',
    },

    search: {
      provider: 'local',
    },
  },

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#3c82f6' }],
  ],

  markdown: {
    lineNumbers: true,
    config: (_md) => {
      // Add any markdown-it plugins here if needed
    },
  },
})
