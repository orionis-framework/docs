// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';
import { createSidebar } from './src/utils/documentation-menu.mjs';
import remarkMermaid from './src/plugins/remark-mermaid.mjs';
import rehypeResponsiveTables from './src/plugins/rehype-responsive-tables.mjs';

const entryRedirects = {
  '/': '/en/getting-started',
  '/en': '/en/getting-started',
  '/es': '/es/getting-started',
};
export default defineConfig({
  site: 'https://docs.orionis-framework.com',
  trailingSlash: 'never',
  redirects: entryRedirects,
  markdown: {
    remarkPlugins: [remarkMermaid],
    rehypePlugins: [rehypeResponsiveTables],
  },
  integrations: [
    sitemap({ filter: (url) => !Object.hasOwn(entryRedirects, new URL(url).pathname.replace(/\/+$/, '') || '/') }),
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
