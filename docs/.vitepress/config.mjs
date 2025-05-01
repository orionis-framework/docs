import { defineConfig } from 'vitepress'
import { app } from './app'
import { header } from './header'
import { footer } from './footer'
import { links } from './links'
import { docs } from './docs'
import { menu } from './menu'
import { nav } from './nav'

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