import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Flaskavel Framework",
  description: "Your Laboratory for Elegant Web Development",
  lang: 'en-US',
  lastUpdated: true,
  base: '/',
  themeConfig: {
    footer: {
        message: 'Released under the MIT License.',
        copyright: 'Copyright © 2024 Raul Mauricio Uñate'
    },

    logo: 'img/favicon.png',

    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Examples', link: '/markdown-examples' },
      {
        text: 'Versions',
        items: [
          { text: 'v1.x', link: '/v1.x/' }
        ]
      }
    ],

    sidebar: [
      {
        text: 'Examples',
        items: [
          { text: 'Markdown Examples', link: '/markdown-examples' },
          { text: 'Runtime API Examples', link: '/api-examples' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  },
  head: [
    ['link', {
            rel: 'stylesheet',
            href: '/css/style.css'
        }
    ],
    ['link', {
        rel: 'icon',
        href: 'img/favicon.png',
        type: 'image/png'
    }
  ],
  ],
})
