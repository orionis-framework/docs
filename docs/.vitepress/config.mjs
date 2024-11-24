import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Flaskavel Framework",
  description: "Python isn't just powerful; it’s thrilling.",
  lang: 'en-US',
  lastUpdated: true,
  base: '/',
  themeConfig: {
    // Configuración del pie de página
    footer: {
      message: 'This project is proudly released under the MIT License.',
      copyright: '© 2024 Raul Mauricio Uñate and the Flaskavel Team. All rights reserved.'
    },
    // Configuración del enlace de edición
    editLink: {
      pattern: 'https://github.com/flaskavel/docs/tree/master/docs/:path'
    },
    // Configuración del logo
    logo: 'img/favicon.svg',
    // Configuración de la barra de navegación
    nav: [
      { text: 'Home', link: '/' },
      {
        text: 'Versions',
        items: [
          { text: 'v1.x', link: '/1.x/prologue' }
        ]
      }
    ],
    // Configuración de la barra lateral
    sidebar: [
      {
        text: 'Prologue',
        link: '/1.x/prologue'
      },
      {
        text: 'Getting Started',
        collapsed: true,
        collapsible: true,
        items: [
          { text: 'Installation', link: '/1.x/getting-started/installation' },
          { text: 'Configuration', link: '/1.x/getting-started/configuration' },
          { text: 'Directory Structure', link: '/1.x/getting-started/directory-structure' },
          { text: 'Versions', link: '/1.x/getting-started/versions' },
          { text: 'Deployments', link: '/1.x/getting-started/deployments' },
        ]
      },
      {
        text: 'Core Concepts',
        collapsed: true,
        collapsible: true,
        items: [
          { text: 'Bootstrapping', link: '/1.x/concepts/bootstrapping' },
          { text: 'CLI Request Lifecycle', link: '/1.x/concepts/cli-lifecycle' },
          { text: 'HTTP Request Lifecycle', link: '/1.x/concepts/http-lifecycle' },
        ]
      },
      {
        text: 'HTTP Lab',
        collapsed: true,
        collapsible: true,
        items: [
          { text: 'Routing', link: '/1.x/http/routing' },
          { text: 'Middlewares', link: '/1.x/http/middlewares' },
          { text: 'Controllers', link: '/1.x/http/controllers' },
          { text: 'Requests', link: '/1.x/http/requests' },
          { text: 'Responses', link: '/1.x/http/responses' },
        ]
      },
      {
        text: 'CLI Lab',
        collapsed: true,
        collapsible: true,
        items: [
          { text: 'Native Commands', link: '/1.x/cli/native-commands' },
          { text: 'Application Commands', link: '/1.x/cli/application-commands' },
          { text: 'Loops', link: '/1.x/cli/loops' },
          { text: 'Schedules', link: '/1.x/cli/schedules' },
          { text: 'Console Outputs', link: '/1.x/cli/console-outputs' },
          { text: '"Reactor" - The CLI Interpreter', link: '/1.x/cli/reactor' },
        ]
      },
      {
        text: 'Configuration',
        collapsed: true,
        collapsible: true,
        items: [
          { text: 'Environment', link: '/1.x/configuration/environment' },
          { text: 'Configuration Files', link: '/1.x/configuration/config-files' },
          { text: 'Logs', link: '/1.x/configuration/logs' },
          { text: 'Cache', link: '/1.x/configuration/cache' },
        ]
      },
      {
        text: 'Debugger',
        collapsed: true,
        collapsible: true,
        items: [
          { text: 'Runtime Debugging', link: '/1.x/debugging/runtime' },
          { text: 'Using VSCode', link: '/1.x/debugging/vscode' },
        ]
      },
      {
        text: 'Community',
        collapsed: true,
        collapsible: true,
        items: [
          { text: 'Discord', link: '/1.x/community/discord' },
          { text: 'Collaboration Guide', link: '/1.x/community/collaboration-guide' },
          { text: 'Next Steps', link: '/1.x/community/next-steps' },
        ]
      }
    ],
    // Enlaces sociales
    socialLinks: [
      { icon: 'github', link: 'https://github.com/flaskavel' }
    ],
    // Configuración de búsqueda
    search: {
      provider: 'local'
    }
  },
  // Configuración de la cabecera
  head: [
    ['link', { rel: 'stylesheet', href: '/css/style.css' }],
    ['link', { rel: 'icon', href: 'img/favicon.svg', type: 'image/svg' }],
    ['meta', { property: 'og:image', content: 'og/og_image.jpg' }],
    ['meta', { property: 'og:image:secure_url', content: 'og/og_image.jpg' }],
    ['meta', { property: 'og:image:width', content: '600' }],
    ['meta', { property: 'og:image:height', content: '400' }],
    ['meta', { property: 'og:title', content: 'Flaskavel Framework' }],
    ['meta', { property: 'og:description', content: "Python isn't just powerful; it’s thrilling!" }],
    ['meta', { property: 'og:url', content: 'https://flaskavel.com' }],
    ['meta', { property: 'og:type', content: 'website' }]
  ],
})