export const menu = [
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
  ]