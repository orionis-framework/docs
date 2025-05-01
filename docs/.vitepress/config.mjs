import { defineConfig } from 'vitepress'
import { app } from '../../config/app'
import { docs } from '../../config/docs'
import { footer } from '../../config/footer'
import { nav } from '../../config/nav'
import { menu } from '../../config/menu'
import { links } from '../../config/links'
import { header } from '../../config/header'

export default defineConfig({
  title: app.name,
  description: app.description,
  lang: app.lang,
  lastUpdated: docs.lastUpdated,
  base: app.base,
  themeConfig: {
    logo: app.logo,
    nav: nav,
    sidebar: menu,
    footer: footer,
    editLink: {
      pattern: docs.editLink.pattern
    },
    socialLinks: links,
    search: {
      provider: 'local'
    }
  },
  head: header
})