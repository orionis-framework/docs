import catalog from '../../config/documentation-menu.json' with { type: 'json' };
import legacyRedirects from '../../config/legacy-redirects.json' with { type: 'json' };
import navigation from '../../config/documentation-navigation.json' with { type: 'json' };

export const documentationCatalog = catalog;
export const sitePages = catalog.pages;
export const supplementalPages = sitePages.filter((page) => ['contribution-guide', 'community-contributors'].includes(page.id));
export const documentationPages = sitePages.filter((page) => !supplementalPages.includes(page));
export const documentationNavigation = navigation;

// Every published page has exactly one primary home in the capability menu.
export function resolveNavigation(config = navigation) {
  const pages = new Map(sitePages.map((page) => [page.id, page]));
  const bands = new Map(config.bands.map((band) => [band.id, band]));
  if (bands.size !== config.bands.length) throw new Error('Duplicate navigation band.');
  const seen = new Set(), sectionIds = new Set();
  let previousBand = -1;
  const sections = config.sections.map((section) => {
    if (sectionIds.has(section.id)) throw new Error(`Duplicate navigation section: ${section.id}`);
    sectionIds.add(section.id);
    const bandIndex = config.bands.findIndex((band) => band.id === section.band);
    if (bandIndex < previousBand || !bands.has(section.band)) throw new Error(`Invalid navigation band/order: ${section.id}`);
    previousBand = bandIndex;
    if (!section.pageIds.length || !section.icon || catalog.locales.some((locale) => !section.title[locale])) throw new Error(`Incomplete navigation section: ${section.id}`);
    return { ...section, pages: section.pageIds.map((id) => {
      if (!pages.has(id)) throw new Error(`Unknown navigation page: ${id}`);
      if (seen.has(id)) throw new Error(`Duplicate navigation page: ${id}`);
      seen.add(id);
      return pages.get(id);
    }) };
  });
  const missing = [...pages.keys()].filter((id) => !seen.has(id));
  if (missing.length) throw new Error(`Pages without navigation: ${missing.join(', ')}`);
  for (const band of config.bands) {
    if (!sections.some((section) => section.band === band.id) || catalog.locales.some((locale) => !band.title[locale])) throw new Error(`Incomplete navigation band: ${band.id}`);
  }
  return sections;
}
export const navigationSections = resolveNavigation();
export function getPageBySlug(pathname) {
  const slug = decodeURI(pathname).replace(/\/+$/, '');
  return sitePages.find((page) => Object.values(page.slug).includes(slug));
}
export function getTranslations(pageId) {
  const page = sitePages.find((entry) => entry.id === pageId);
  return page ? catalog.locales.map((locale) => ({ locale, title: page.title[locale], slug: page.slug[locale] })) : [];
}

// Category titles stay visible when collapsed. Noninteractive band labels in
// Sidebar.astro aid scanning without adding another level of nested menus.
export function createSidebar() {
  function link(page, section, index) {
    const titles = page.label || page.title;
    // These guides share one level instead of overview/chapter styling.
    const itemClass = ['getting-started', 'http', 'realtime', 'mcp', 'views', 'localization', 'authentication', 'sessions', 'cryptography', 'database', 'orm'].includes(section.id) ? 'module-peer' :
      (index === 0 || page.id.endsWith('-overview') ? 'module-overview' : 'module-chapter');
    const attrs = { class: itemClass, 'data-page-id': page.id, 'data-nav-group': section.id };
    const item = {
      label: titles[catalog.defaultLocale],
      translations: titles,
      attrs,
    };
    return page.kind === 'astro' ? { ...item, link: page.slug.en.slice(3) } : {
      ...item, slug: page.slug[catalog.defaultLocale].split('/').slice(2).join('/'),
    };
  }
  const sections = navigationSections.map((section) => {
    const titles = section.title;
    return {
      label: titles[catalog.defaultLocale],
      translations: titles,
      collapsed: true,
      items: section.pages.map((page, index) => link(page, section, index)),
    };
  });
  return [...sections, ...navigation.externalLinks.map((resource) => ({
    label: resource.title.en, translations: resource.title, link: resource.url,
    attrs: { class: 'api-reference-link', target: '_blank', rel: 'noopener noreferrer' },
  }))];
}

export function createRedirects() {
  const redirects = { '/': '/en/getting-started', '/en/': '/en/getting-started', '/es/': '/es/getting-started' };
  const slugs = new Set(documentationPages.flatMap((page) => Object.values(page.slug)));
  for (const locale of catalog.locales) for (const [oldPath, newPath] of Object.entries(legacyRedirects)) {
    const source = `/${locale}/${oldPath}`, destination = `/${locale}/${newPath}`;
    if (!slugs.has(destination)) throw new Error(`Invalid legacy redirect target: ${destination}`);
    if (!slugs.has(source)) redirects[source] = destination;
  }
  return redirects;
}
