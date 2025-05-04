import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Orionis Framework',
  description: 'Unleash the power and excitement of Python with the Orionis Framework.',
  lang: 'en-US',
  lastUpdated: true,
  base: '/',
  themeConfig: {
    logo: 'img/min_logo.png',
    nav: [
      {
        text: 'Home',
        link: '/'
      },
      {
        text: 'Versions',
        items: [
          { text: 'v1.x', link: '/1.x/prologue' },
          { text: 'v2.x', link: '/2.x/prologue' }
        ]
      }
    ],
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
      },
      {
        text: 'Testing',
        collapsed: true,
        collapsible: true,
        items: [
          { text: 'Getting Started', link: '/1.x/testing/getting-started' },
          { text: 'Mandatory Syntax', link: '/1.x/testing/required-syntax' },
          { text: 'Custom Suite', link: '/1.x/testing/custom-suite' },
          { text: 'Methods', link: '/1.x/testing/methods' },
          { text: 'Printing Output', link: '/1.x/testing/printing-output' },
          { text: 'Types', link: '/1.x/testing/types' },
        ]
      }
    ],
    footer: {
      message: 'Built with passion and dedication. Released under the MIT License.',
      copyright: `© 2023 - ${new Date().getFullYear()} | Raúl Mauricio Uñate and the Orionis Framework Team.`,
    },
    editLink: {
      pattern: 'https://github.com/orionis-framework/docs/edit/master/docs/:path'
    },
    socialLinks: [
      { icon: 'github', url: 'https://github.com/orionis-framework' }
    ],
    search: {
      provider: 'local'
    }
  },
  head: [
    ['link', { rel: 'stylesheet', href: '/css/style.css', type: 'text/css' }],
    ['link', { rel: 'icon', href: '/favicon.ico', type: 'image/x-icon' }],
    ['meta', { property: 'og:image', content: '/og/image.png' }],
    ['meta', { property: 'og:image:secure_url', content: '/og/image.png' }],
    ['meta', { property: 'og:image:width', content: '600' }],
    ['meta', { property: 'og:image:height', content: '400' }],
    ['meta', { property: 'og:title', content: 'Orionis Framework' }],
    ['meta', { property: 'og:description', content: 'Unleash the power and excitement of Python with the Orionis Framework.' }],
    ['meta', { property: 'og:url', content: 'https://orionis-framework.com/' }],
    ['meta', { property: 'og:type', content: 'website' }]
  ]
})
