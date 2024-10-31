import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Flaskavel Framework",
  description: "Python isn't just powerful; it’s thrilling.",
  lang: 'en-US',
  lastUpdated: true,
  base: '/',
  themeConfig: {
    footer: {
      message: 'This project is proudly released under the MIT License.',
      copyright: '© 2024 Raul Mauricio Uñate and the Flaskavel Team. All rights reserved.'
    },
    editLink: {
      pattern: 'https://github.com/flaskavel/docs/tree/main/docs/:path'
    },
    logo: 'img/favicon.png',
    nav: [
      { text: 'Home', link: '/' },
      {
        text: 'Versions',
        items: [
          { text: 'v1.x', link: '/1.x/getting-started/install' }
        ]
      }
    ],

    sidebar: [
      { text: 'Prologue', link: '/1.x/prologue' },
      {
        text: 'Getting Started',
        items: [
          { text: 'Install', link: '/1.x/getting-started/install' },
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/flaskavel' }
    ],
    search: {
      provider: 'local'
    }
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
    ['meta', {
        property: 'og:image',
        content: 'og/og_image.jpg'
      }
    ],
    ['meta', {
        property: 'og:image:secure_url',
        content: 'og/og_image.jpg'
      }
    ],
    ['meta', {
          property: 'og:image:width',
          content: '600'
      }
    ],
    ['meta', {
          property: 'og:image:height',
          content: '400'
      }
    ],
    ['meta', {
          property: 'og:title',
          content: 'Flaskavel Framework'
      }
    ],
    ['meta', {
          property: 'og:description',
          content: "Python isn't just powerful; it’s thrilling.!"
      }
    ],
    ['meta', {
          property: 'og:url',
          content: 'https://github.com/flaskavel'
      }
    ],
    ['meta', {
          property: 'og:type',
          content: 'website'
      }
    ]
  ],
})
