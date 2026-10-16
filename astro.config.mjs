// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';
import { createSidebar, createRedirects } from './src/utils/documentation-menu.mjs';

const redirects = createRedirects();
export default defineConfig({
  site: 'https://docs.orionis-framework.com',
  trailingSlash: 'never',
  redirects,
  integrations: [
    sitemap({ filter: (url) => !Object.hasOwn(redirects, new URL(url).pathname) }),
    starlight({
      title: 'Orionis Framework',
      description: 'Documentation for Orionis: installation, application development, services, and API reference.',
      logo: { src: './public/favicon.svg' },
      favicon: '/favicon.svg',
      defaultLocale: 'en',
      editLink: { baseUrl: 'https://github.com/orionis-framework/docs/edit/master/' },
      customCss: ['./src/styles/custom.css'],
      expressiveCode: {
        styleOverrides: { codeFontFamily: "'JetBrains Mono', 'Cascadia Code', Consolas, monospace" },
      },
      components: {
        Head: './src/components/Head.astro',
        LanguageSelect: './src/components/LanguageSelect.astro',
        Sidebar: './src/components/Sidebar.astro',
        MobileMenuToggle: './src/components/MobileMenuToggle.astro',
        PageTitle: './src/components/PageTitle.astro',
      },
      locales: {
        en: { label: 'English', lang: 'en' },
        es: { label: 'Español', lang: 'es' },
      },
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/orionis-framework' }],
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
      sidebar: createSidebar(),
    }),
  ],
});
