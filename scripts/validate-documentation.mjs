import fs from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'parse5';
import { root, within, validateCatalog, contentPath, filesUnder, sha256, stripFrontmatter, markdownLinks, headingIds, parser, walk } from './documentation-lib.mjs';
import { createSidebar, createRedirects, getTranslations, supplementalPages, documentationPages, sitePages, documentationCatalog, documentationNavigation, navigationSections } from '../src/utils/documentation-menu.mjs';

const catalog = documentationCatalog;
const pages = validateCatalog(catalog);
const site = 'https://docs.orionis-framework.com';
const fontAssets = JSON.parse(await fs.readFile(path.join(root, 'config/font-assets.json'), 'utf8'));
const errors = [], routeMap = new Map();
const normalize = (pathname) => decodeURI(pathname).replace(/\/+$/, '') || '/';
function check(condition, message) { if (!condition) errors.push(message); }

const robots = (await fs.readFile(path.join(root, 'public/robots.txt'), 'utf8')).replaceAll('\r\n', '\n');
const robotsGroups = robots.trim().split(/\n\s*\n/);
for (const agent of ['*', 'OAI-SearchBot', 'GPTBot', 'ChatGPT-User']) {
  const groups = robotsGroups.filter((group) => group.startsWith(`User-agent: ${agent}\n`));
  check(groups.length === 1 && groups[0] === `User-agent: ${agent}\nAllow: /`, `Expected one unrestricted robots.txt group for ${agent}.`);
}
check(robotsGroups.includes(`Sitemap: ${site}/sitemap-index.xml`), 'robots.txt must advertise the canonical sitemap index.');

async function validateFontAssets(directory) {
  for (const asset of [...fontAssets.files, fontAssets.license]) {
    const file = within(directory, asset.path.slice(1));
    try {
      const bytes = await fs.readFile(file);
      check(sha256(bytes) === asset.sha256, `Local font/license differs from official asset: ${file}`);
      if (asset.path.endsWith('.woff2')) {
        check(bytes.subarray(0, 4).toString('ascii') === 'wOF2' && bytes.length === asset.bytes, `Invalid local WOFF2 font: ${file}`);
      }
    } catch (error) { errors.push(`Missing local font/license: ${file} (${error.message})`); }
  }
}
check(fontAssets.family === 'JetBrains Mono' && fontAssets.files.length === 6, 'Expected local JetBrains Mono regular, semibold, and bold fonts with italics.');
await validateFontAssets(path.join(root, 'public'));

const expected = new Set();
for (const page of pages) for (const locale of catalog.locales) {
  const file = page.kind === 'doc' ? contentPath(page.slug[locale]) : within(root, `src/pages${page.slug[locale]}.astro`);
  try {
    const text = (await fs.readFile(file, 'utf8')).replaceAll('\r\n', '\n');
    if (page.kind === 'doc') {
      expected.add(file);
      const title = /^title:\s*(.+)$/m.exec(text)?.[1];
      const parsedTitle = title?.startsWith('"') ? JSON.parse(title) : title;
      check(parsedTitle === page.title[locale], `Incorrect frontmatter title: ${page.slug[locale]}`);
      check(/^editUrl: true$/m.test(text), `Edit link must point to the local document: ${page.slug[locale]}`);
      const body = stripFrontmatter(text);
      check(body.trim().length > 100, `Empty or incomplete page: ${page.slug[locale]}`);
      let h1 = 0;
      walk(parser.parse(body), (node) => { if (node.type === 'heading' && node.depth === 1) h1++; });
      check(h1 === 0, `Duplicate H1 below Starlight title: ${page.slug[locale]}`);
      routeMap.set(page.slug[locale], { page, locale, body, ids: headingIds(body) });
    } else {
      routeMap.set(page.slug[locale], { page, locale, body: '', ids: new Set() });
    }
  } catch (error) { errors.push(`Invalid or missing page: ${page.slug[locale]} (${error.message})`); }
}
for (const file of await filesUnder(path.join(root, 'src/content/docs'))) check(expected.has(file), `Content outside catalog: ${path.relative(root, file)}`);

const sidebar = createSidebar();
const menuLinks = sidebar.flatMap((group) => group.items || [group]).filter((item) => item.attrs?.['data-page-id']);
const menuIds = menuLinks.map((item) => item.attrs['data-page-id']);
const expectedMenuIds = navigationSections.flatMap((section) => section.pageIds);
const pageSections = new Map(navigationSections.flatMap((section) => section.pageIds.map((id) => [id, section])));
check(JSON.stringify(menuIds) === JSON.stringify(expectedMenuIds), 'Sidebar misses pages or changes the capability navigation order.');
check(menuIds.length === sitePages.length && new Set(menuIds).size === sitePages.length && sitePages.every((page) => menuIds.includes(page.id)), 'Every published page must occur exactly once in primary navigation.');
for (const section of navigationSections) {
  const group = sidebar.find((item) => item.items?.some((child) => child.attrs?.['data-nav-group'] === section.id));
  check(group?.label === section.title.en && catalog.locales.every((locale) => group?.translations?.[locale] === section.title[locale]), `Incorrect navigation category titles: ${section.id}`);
  check(group?.items.every((item) => item.attrs?.['data-nav-group'] === section.id), `Mixed navigation groups: ${section.id}`);
  for (const page of section.pages) {
    const item = group?.items.find((child) => child.attrs?.['data-page-id'] === page.id);
    check(page.kind === 'astro' ? item?.link === page.slug.en.slice(3) : item?.slug === page.slug.en.slice(4), `Navigation changes the canonical route: ${page.id}`);
  }
}
check(!sidebar.some((group) => group.items?.some((item) => item.items)), 'Sidebar exceeds two navigation levels.');
check(sidebar.some((item) => item.link === 'https://api.orionis-framework.com/'), 'External API reference is missing.');
check(sidebar.some((group) => group.items?.some((item) => item.link === '/contribute/contributors')), 'Contributor navigation is missing.');
check(pageSections.get('mcp-overview')?.id === 'mcp' && pageSections.get('test-mcp-testing')?.id === 'mcp', 'MCP must have its own category, including protocol testing.');
check(pageSections.get('realtime-overview')?.id === 'realtime' && pageSections.get('realtime-protocol-and-streaming')?.id === 'realtime', 'Realtime and its protocol must have their own category.');
for (const page of sitePages) check(getTranslations(page.id).length === catalog.locales.length, `Missing translations: ${page.id}`);

let internalLinks = 0, implementationLinks = 0;
for (const [slug, data] of routeMap) for (const node of markdownLinks(data.body)) {
  const href = node.url;
  if (/^https:\/\/github\.com\/orionis-framework\/framework\/blob\//.test(href)) implementationLinks++;
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href)) continue;
  check(href.startsWith('/') || href.startsWith('#'), `Unresolved relative link: ${slug} -> ${href}`);
  const url = new URL(href, `https://docs.orionis-framework.com${slug}`), target = normalize(url.pathname);
  if (routeMap.has(target)) {
    internalLinks++;
    if (url.hash && routeMap.get(target).page.kind !== 'astro') check(routeMap.get(target).ids.has(decodeURIComponent(url.hash.slice(1))), `Broken Markdown fragment: ${slug} -> ${href}`);
  } else {
    try { await fs.access(path.join(root, 'public', target.slice(1))); }
    catch { errors.push(`Broken local link: ${slug} -> ${href}`); }
  }
}

const redirects = createRedirects();
check(Object.values(redirects).every((slug) => routeMap.has(slug)), 'Redirect without canonical page.');
check(Object.keys(redirects).every((slug) => !routeMap.has(slug)), 'Redirect shadows a canonical page.');

if (process.argv.includes('--built')) {
  const output = path.join(root, 'dist');
  const builtRobots = (await fs.readFile(path.join(output, 'robots.txt'), 'utf8')).replaceAll('\r\n', '\n');
  check(builtRobots === robots, 'Published robots.txt must preserve the crawler permissions and sitemap.');
  await validateFontAssets(output);
  const fontCSS = (await Promise.all((await filesUnder(output)).filter((file) => file.endsWith('.css')).map((file) => fs.readFile(file, 'utf8')))).join('\n');
  check(/--sl-font-mono\s*:[^;}]*JetBrains Mono/.test(fontCSS), 'Inline code must use JetBrains Mono.');
  check(/--ec-codeFontFml\s*:[^;}]*JetBrains Mono/.test(fontCSS) && /font-family\s*:\s*var\(--ec-codeFontFml\)/.test(fontCSS), 'Rendered code blocks must use JetBrains Mono.');
  const fontFaces = fontCSS.match(/@font-face\s*\{[^}]+\}/g) || [];
  for (const font of fontAssets.files) check(fontFaces.some((face) => face.includes('JetBrains Mono') && face.includes(font.path)), `Missing bundled JetBrains Mono font face: ${font.path}`);
  check(fontFaces.every((face) => !/url\(\s*['"]?(?:https?:)?\/\//.test(face)), 'Font faces must load locally, without a CDN.');
  check(!/@import\s+(?:url\(\s*)?['"]?(?:https?:)?\/\//.test(fontCSS), 'Stylesheets must not import remote font declarations.');
  check(!fontCSS.includes('Fira Code'), 'Old Fira Code declarations must not override the requested code font.');
  const htmlPages = new Map();
  function elements(node, visit) {
    if (node.tagName) visit(node, Object.fromEntries((node.attrs || []).map((attr) => [attr.name, attr.value])));
    for (const child of node.childNodes || []) elements(child, visit);
  }
  function textContent(node) {
    return (node.nodeName === '#text' ? node.value : (node.childNodes || []).map(textContent).join('')).replace(/\s+/g, ' ').trim();
  }
  async function htmlAt(slug) {
    for (const candidate of [path.join(output, slug.slice(1), 'index.html'), path.join(output, `${slug.slice(1)}.html`)]) {
      try { return await fs.readFile(candidate, 'utf8'); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
    throw new Error(`Missing built URL: ${slug}`);
  }
  for (const [slug, { page, locale }] of routeMap) {
    let html;
    try { html = await htmlAt(slug); }
    catch (error) { errors.push(error.message); continue; }
    const data = { ids: new Set(), links: [], alternates: [], languages: [], canonicals: [], descriptions: [], sidebarSections: [], sidebarBands: [], capabilities: [], sidebarPersistence: false, apiLink: false, h1: 0, searchable: false };
    elements(parse(html), (node, attrs) => {
      if (attrs.id) data.ids.add(attrs.id);
      if (node.tagName === 'h1') data.h1++;
      if ('data-pagefind-body' in attrs) {
        data.searchable = true;
        check(textContent(node).length > 100, `Page content must be available in static HTML without JavaScript: ${slug}`);
      }
      if (node.tagName === 'a' && attrs.href) data.links.push(attrs.href);
      if (node.tagName === 'link' && attrs.rel === 'canonical') data.canonicals.push(attrs.href);
      if (node.tagName === 'link' && attrs.rel === 'alternate' && attrs.hreflang) data.alternates.push(attrs);
      if (node.tagName === 'meta' && attrs.name === 'description') data.descriptions.push(attrs.content);
      if (node.tagName === 'meta' && /^(?:robots|oai-searchbot|gptbot|chatgpt-user)$/i.test(attrs.name || '')) {
        check(!/(?:^|[\s,;])(?:noindex|nofollow|none)(?:$|[\s,;])/i.test(attrs.content || ''), `Crawler-blocking meta directive: ${slug}`);
      }
      if (node.tagName === 'option' && /\/(en|es)\//.test(attrs.value || '')) data.languages.push(attrs.value);
      if (node.tagName === 'link' && attrs.as === 'font') check(attrs.href?.startsWith('/') && !attrs.href.startsWith('//'), `Font preload must use a local asset: ${slug}`);
      if (node.tagName === 'sl-sidebar-state-persist') data.sidebarPersistence = true;
      if (node.tagName === 'a' && attrs.href === 'https://api.orionis-framework.com/' && attrs.target === '_blank') data.apiLink = true;
      if (node.tagName === 'p' && (attrs.class || '').split(/\s+/).includes('sidebar-band')) data.sidebarBands.push({ id: attrs['data-band-id'], title: textContent(node) });
      if (node.tagName === 'a' && (attrs.class || '').split(/\s+/).includes('capability-card')) data.capabilities.push(attrs.href);
      if (node.tagName === 'details' && (attrs.class || '').split(/\s+/).includes('sidebar-section')) {
        const section = { id: attrs['data-section-id'], title: '', open: 'open' in attrs, current: false, icon: false, pages: [] };
        elements(node, (child, childAttrs) => {
          if (child.tagName === 'a' && childAttrs['aria-current'] === 'page') section.current = true;
          if (child.tagName === 'a' && childAttrs['data-page-id']) section.pages.push({ id: childAttrs['data-page-id'], group: childAttrs['data-nav-group'], href: childAttrs.href });
        });
        const summary = node.childNodes.find((child) => child.tagName === 'summary');
        if (summary) elements(summary, (child, childAttrs) => {
          if (child.tagName === 'svg' && childAttrs['aria-hidden'] === 'true') section.icon = true;
          if ((childAttrs.class || '').split(/\s+/).includes('section-label')) section.title = textContent(child);
        });
        data.sidebarSections.push(section);
      }
    });
    check(data.h1 === 1, `Expected one H1: ${slug}, found ${data.h1}`);
    check(data.descriptions.length === 1, `Expected one meta description: ${slug}`);
    check(data.canonicals.length === 1 && normalize(new URL(data.canonicals[0] || site).pathname) === slug, `Invalid/duplicate canonical: ${slug}`);
    check(data.searchable, `Missing search content marker: ${slug}`);
    if (page.kind === 'doc') {
      const editUrl = `https://github.com/orionis-framework/docs/edit/master/src/content/docs${slug}.md`;
      check(data.links.includes(editUrl), `Edit link must target the canonical Markdown file: ${slug}`);
    }
    check(data.sidebarSections.length === navigationSections.length && data.sidebarSections.every((section) => section.id && section.icon), `Sidebar section/icon coverage is incomplete: ${slug}`);
    check(JSON.stringify(data.sidebarSections.map((section) => section.id)) === JSON.stringify(navigationSections.map((section) => section.id)), `Rendered sidebar changes capability order: ${slug}`);
    check(JSON.stringify(data.sidebarBands) === JSON.stringify(documentationNavigation.bands.map((band) => ({ id: band.id, title: band.title[locale] }))), `Rendered navigation bands are missing, duplicated, or out of order: ${slug}`);
    for (const section of data.sidebarSections) {
      const expectedSection = navigationSections.find((entry) => entry.id === section.id);
      check(expectedSection && section.title === expectedSection.title[locale], `Incorrect rendered category title: ${slug}/${section.id}`);
      check(JSON.stringify(section.pages.map((item) => item.id)) === JSON.stringify(expectedSection?.pageIds), `Rendered category loses, duplicates, or reorders pages: ${slug}/${section.id}`);
      for (const item of section.pages) {
        const expectedPage = sitePages.find((entry) => entry.id === item.id);
        check(item.group === section.id && item.href === expectedPage?.slug[locale], `Incorrect rendered navigation destination/group: ${slug}/${item.id}`);
      }
    }
    check(data.sidebarSections.filter((section) => section.open).length === 1 && data.sidebarSections.every((section) => section.open === section.current), `Only the current sidebar section should start open: ${slug}`);
    check(data.sidebarSections.find((section) => section.current)?.id === pageSections.get(page.id)?.id, `Current page opens the wrong capability category: ${slug}`);
    check(!data.sidebarPersistence, `Old expanded sidebar state must not override current-route defaults: ${slug}`);
    check(data.apiLink && supplementalPages.every((resource) => data.links.includes(resource.slug[locale])), `Permanent API/contribution links missing from rendered navigation: ${slug}`);
    if (page.id === 'foundation-overview') {
      const capabilityIds = ['http-routing', 'realtime-overview', 'mcp-overview', 'orm-overview', 'auth-overview', 'queues-overview', 'storage-overview', 'view-overview'];
      const capabilitySlugs = capabilityIds.map((id) => sitePages.find((entry) => entry.id === id).slug[locale]);
      check(data.capabilities.length === capabilitySlugs.length && new Set(data.capabilities).size === capabilitySlugs.length && capabilitySlugs.every((href) => data.capabilities.includes(href)), `Landing capability cards must expose all eight guides in the current locale: ${slug}`);
    } else check(data.capabilities.length === 0, `Landing capability cards appear on an unrelated chapter: ${slug}`);
    for (const translation of getTranslations(page.id)) {
      check(data.alternates.some((attrs) => attrs.hreflang === translation.locale && normalize(new URL(attrs.href).pathname) === translation.slug), `Missing hreflang ${translation.locale}: ${slug}`);
      check(data.languages.includes(translation.slug), `Language selector missing ${translation.locale}: ${slug}`);
    }
    check(data.alternates.some((attrs) => attrs.hreflang === 'x-default' && normalize(new URL(attrs.href).pathname) === page.slug.en), `Missing x-default: ${slug}`);
    htmlPages.set(slug, data);
  }
  for (const [slug, data] of htmlPages) for (const href of data.links) {
    let url;
    try { url = new URL(href, site + slug); } catch { errors.push(`Invalid built href: ${slug}: ${href}`); continue; }
    if (url.origin !== site) continue;
    const target = normalize(url.pathname);
    if (htmlPages.has(target)) {
      if (url.hash) check(htmlPages.get(target).ids.has(decodeURIComponent(url.hash.slice(1))), `Broken rendered fragment: ${slug} -> ${href}`);
    } else {
      try { await fs.access(path.join(output, target.slice(1))); }
      catch { errors.push(`Broken rendered link: ${slug} -> ${href}`); }
    }
  }
  for (const [from, to] of Object.entries(redirects)) {
    try {
      const html = await htmlAt(from);
      check(html.includes(to), `Incorrect redirect output: ${from}`);
    } catch (error) { errors.push(error.message); }
  }
  const sitemapFiles = (await filesUnder(output)).filter((file) => /sitemap-\d+\.xml$/.test(file));
  const sitemapIndex = await fs.readFile(path.join(output, 'sitemap-index.xml'), 'utf8');
  const sitemapURLs = [...sitemapIndex.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  const expectedSitemapURLs = sitemapFiles.map((file) => new URL(path.basename(file), site).href);
  check(sitemapURLs.length > 0 && sitemapURLs.length === expectedSitemapURLs.length && new Set(sitemapURLs).size === sitemapURLs.length && expectedSitemapURLs.every((url) => sitemapURLs.includes(url)), 'Sitemap index must reference every published sitemap on the canonical domain.');
  const sitemap = (await Promise.all(sitemapFiles.map((file) => fs.readFile(file, 'utf8')))).join('');
  const sitemapPageURLs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]));
  check(sitemapPageURLs.every((url) => url.origin === site), 'Sitemap pages must use the canonical domain.');
  const sitemapRoutes = sitemapPageURLs.map((url) => normalize(url.pathname));
  const sitemapSet = new Set(sitemapRoutes);
  check(sitemapRoutes.length === sitemapSet.size && sitemapSet.size === routeMap.size && [...routeMap.keys()].every((slug) => sitemapSet.has(slug)), `Sitemap must contain exactly ${routeMap.size} unique canonical documents, found ${sitemapRoutes.length}`);
  const allowed = new Set([...routeMap.keys(), ...Object.keys(redirects).map(normalize), '/404']);
  for (const file of (await filesUnder(output)).filter((file) => file.endsWith('.html'))) {
    const slug = normalize('/' + path.relative(output, file).replaceAll('\\', '/').replace(/(?:\/index)?\.html$/, '').replace(/^index$/, ''));
    check(allowed.has(slug), `Unexpected published HTML page: ${slug}`);
  }
  check((await filesUnder(path.join(output, 'pagefind'))).length > 0, 'Search index was not generated.');
  console.log(`Verified ${htmlPages.size} rendered pages, crawler permissions, indexable static content, local links/fragments, translations, redirects, sitemap, and search output.`);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Documentation valid: ${navigationSections.length} capability categories in ${documentationNavigation.bands.length} navigation bands, ${documentationPages.length} manual pages per locale, ${supplementalPages.length} contribution resources per locale, ${internalLinks} internal links, ${implementationLinks} implementation permalinks.`);
}
