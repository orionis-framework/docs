import catalog from '../../config/documentation-menu.json' with { type: 'json' };
import navigation from '../../config/documentation-navigation.json' with { type: 'json' };

export const documentationCatalog = catalog;
export const sitePages = catalog.pages;
export const supplementalPages = sitePages.filter((page) => ['contribution-guide', 'community-contributors'].includes(page.id));
export const documentationPages = sitePages.filter((page) => !supplementalPages.includes(page));
export const documentationNavigation = navigation;
const groupedSections = new Set([
  'getting-started', 'http', 'realtime', 'mcp', 'views', 'localization',
  'authentication', 'sessions', 'cryptography', 'validation',
  'database', 'orm', 'faker', 'storage', 'cache', 'mail', 'queues', 'console', 'environment', 'application', 'logging', 'exceptions', 'deployment', 'testing', 'utilities',
]);
const navigationId = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function localizedNames(values, locales, context) {
  for (const locale of locales) {
    const name = values?.[locale];
    if (typeof name !== 'string' || !name || name !== name.trim()) throw new Error(`Invalid localized navigation name: ${context}/${locale}`);
  }
}

function distinctNames(items, locales, context, names = (item) => item.title) {
  for (const locale of locales) {
    const seen = new Set();
    for (const item of items) {
      localizedNames(names(item), locales, `${context}/${item.id}`);
      const name = names(item)[locale].normalize('NFC').toLocaleLowerCase(locale);
      if (seen.has(name)) throw new Error(`Duplicate sibling navigation label: ${context}/${locale}/${name}`);
      seen.add(name);
    }
  }
}

// Keep the editable catalog, physical Markdown routes, and visible menu in one order.
export function validateRouteOrganization(catalogConfig = catalog, navigationConfig = navigation) {
  const locales = catalogConfig.locales;
  const pages = new Map(catalogConfig.pages.map((page) => [page.id, page]));
  const orderedIds = navigationConfig.sections.flatMap((section) => section.pageIds);
  if (JSON.stringify(catalogConfig.pages.map((page) => page.id)) !== JSON.stringify(orderedIds)) throw new Error('Catalog page order must match the flattened navigation order.');
  distinctNames(navigationConfig.bands, locales, 'bands');
  distinctNames([...navigationConfig.sections, ...(navigationConfig.externalLinks || [])], locales, 'sections');
  for (const section of navigationConfig.sections) {
    if (!navigationId.test(section.id)) throw new Error(`Invalid navigation section ID: ${section.id}`);
    for (const id of section.pageIds) {
      const page = pages.get(id);
      if (!page) throw new Error(`Unknown navigation page: ${id}`);
      localizedNames(page.title, locales, `page/${id}`);
      if (page.label !== undefined) localizedNames(page.label, locales, `page-label/${id}`);
      for (const locale of locales) {
        const prefix = `/${locale}/${section.id}`;
        if (page.slug?.[locale] !== prefix && !page.slug?.[locale]?.startsWith(`${prefix}/`)) throw new Error(`Canonical route must belong to navigation section ${section.id}: ${page.slug?.[locale]}`);
      }
    }
    const pageNames = (page) => page.label || page.title;
    if (section.groups) {
      distinctNames(section.groups, locales, `groups/${section.id}`);
      for (const group of section.groups) distinctNames(group.pageIds.map((id) => pages.get(id)), locales, `pages/${group.id}`, pageNames);
    } else distinctNames(section.pageIds.map((id) => pages.get(id)), locales, `pages/${section.id}`, pageNames);
  }
  return catalogConfig.pages;
}

// Flatten configured sidebar groups without changing their leaf order.
export function flattenSidebar(items) {
  return items.flatMap((item) => item.items ? flattenSidebar(item.items) : [item]);
}

// Every published page has exactly one primary home in the capability menu.
export function resolveNavigation(config = navigation) {
  const pages = new Map(sitePages.map((page) => [page.id, page]));
  const bands = new Map(config.bands.map((band) => [band.id, band]));
  if (bands.size !== config.bands.length) throw new Error('Duplicate navigation band.');
  const seen = new Set(), sectionIds = new Set(), subgroupIds = new Set();
  let previousBand = -1;
  const sections = config.sections.map((section) => {
    if (sectionIds.has(section.id)) throw new Error(`Duplicate navigation section: ${section.id}`);
    sectionIds.add(section.id);
    const bandIndex = config.bands.findIndex((band) => band.id === section.band);
    if (bandIndex < previousBand || !bands.has(section.band)) throw new Error(`Invalid navigation band/order: ${section.id}`);
    previousBand = bandIndex;
    if (!section.pageIds.length || !section.icon || catalog.locales.some((locale) => !section.title[locale])) throw new Error(`Incomplete navigation section: ${section.id}`);
    const resolvedPages = section.pageIds.map((id) => {
      if (!pages.has(id)) throw new Error(`Unknown navigation page: ${id}`);
      if (seen.has(id)) throw new Error(`Duplicate navigation page: ${id}`);
      seen.add(id);
      return pages.get(id);
    });
    if (section.groups !== undefined && !groupedSections.has(section.id)) throw new Error(`Unexpected navigation groups: ${section.id}`);
    let resolvedGroups;
    if (groupedSections.has(section.id)) {
      if (!Array.isArray(section.groups) || !section.groups.length) throw new Error(`Missing navigation groups: ${section.id}`);
      const groupPages = [];
      resolvedGroups = section.groups.map((group) => {
        if (!group || typeof group.id !== 'string' || !navigationId.test(group.id) || subgroupIds.has(group.id)) throw new Error(`Invalid or duplicate navigation subgroup: ${group?.id}`);
        subgroupIds.add(group.id);
        if (group.groups !== undefined || group.items !== undefined || !Array.isArray(group.pageIds) || !group.pageIds.length ||
            catalog.locales.some((locale) => typeof group.title?.[locale] !== 'string' || !group.title[locale].trim())) throw new Error(`Incomplete or nested navigation subgroup: ${group.id}`);
        const groupResolved = group.pageIds.map((id) => {
          if (!section.pageIds.includes(id)) throw new Error(`Unknown navigation subgroup page: ${group.id}/${id}`);
          groupPages.push(id);
          return pages.get(id);
        });
        return { ...group, pages: groupResolved };
      });
      if (JSON.stringify(groupPages) !== JSON.stringify(section.pageIds)) throw new Error(`Navigation subgroup pages must match navigation groups order and coverage: ${section.id}`);
    }
    return { ...section, pages: resolvedPages, ...(resolvedGroups ? { groups: resolvedGroups } : {}) };
  });
  const missing = [...pages.keys()].filter((id) => !seen.has(id));
  if (missing.length) throw new Error(`Pages without navigation: ${missing.join(', ')}`);
  for (const band of config.bands) {
    if (!sections.some((section) => section.band === band.id) || catalog.locales.some((locale) => !band.title[locale])) throw new Error(`Incomplete navigation band: ${band.id}`);
  }
  validateRouteOrganization(catalog, config);
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

// Completed application and data guides use one collapsible subgroup level;
// the remaining capabilities retain their existing layout.
export function createSidebar() {
  function link(page, section, index, subgroup) {
    const titles = page.label || page.title;
    // These guides share one level instead of overview/chapter styling.
    const itemClass = groupedSections.has(section.id) ? 'module-peer' :
      (index === 0 || page.id.endsWith('-overview') ? 'module-overview' : 'module-chapter');
    const attrs = { class: itemClass, 'data-page-id': page.id, 'data-nav-group': section.id };
    if (subgroup) attrs['data-nav-subgroup'] = subgroup.id;
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
      items: section.groups ? section.groups.map((group) => ({
        label: group.title[catalog.defaultLocale],
        translations: group.title,
        collapsed: true,
        items: group.pages.map((page, index) => link(page, section, index, group)),
      })) : section.pages.map((page, index) => link(page, section, index)),
    };
  });
  return [...sections, ...navigation.externalLinks.map((resource) => ({
    label: resource.title.en, translations: resource.title, link: resource.url,
    attrs: { class: 'api-reference-link', target: '_blank', rel: 'noopener noreferrer' },
  }))];
}
