import test from 'node:test';
import assert from 'node:assert/strict';
import remarkMermaid from '../src/plugins/remark-mermaid.mjs';
import path from 'node:path';
import { root, validateCatalog, within, stripFrontmatter, markdownLinks, headingIds, parser } from './documentation-lib.mjs';
import { createSidebar, flattenSidebar, documentationCatalog, documentationNavigation, navigationSections, resolveNavigation, sitePages, documentationPages, getPageBySlug, getTranslations } from '../src/utils/documentation-menu.mjs';

const groupedBuildSections = ['getting-started', 'http', 'realtime', 'mcp', 'views', 'localization', 'authentication', 'sessions', 'cryptography', 'validation'];
const groupedSections = new Set([...groupedBuildSections, 'database', 'orm', 'faker']);
const flatSections = ['storage', 'cache', 'mail', 'queues', 'console', 'application', 'deployment', 'testing', 'utilities', 'contribute'];
const buildPageIds = {
  'getting-started': ['foundation-overview', 'foundation-installation', 'foundation-getting-started', 'foundation-architecture-and-lifecycle'],
  http: ['http-overview', 'http-routing', 'http-middleware-and-security', 'http-request-lifecycle', 'http-requests-and-validation', 'http-forms-and-uploads', 'http-responses', 'http-exceptions'],
  realtime: ['realtime-overview', 'realtime-routing-and-lifecycle', 'realtime-hubs-and-methods', 'realtime-javascript-client', 'realtime-chat', 'realtime-protocol-and-streaming', 'realtime-groups-and-deployment', 'http-websockets', 'http-streaming-and-sse'],
  mcp: ['mcp-overview', 'mcp-servers-and-tools', 'mcp-tools', 'mcp-resources-and-prompts', 'mcp-prompts', 'mcp-responses-and-content', 'mcp-http-and-clients', 'mcp-transports-and-configuration', 'mcp-advanced-workflows', 'test-mcp-testing'],
  views: ['view-overview', 'view-rendering-templates', 'view-template-language', 'view-filters', 'view-globals', 'view-configuration-and-extensions', 'view-providers-and-extensions'],
  localization: ['localization-overview', 'localization-messages-and-locales', 'localization-translating-content', 'localization-application-and-views'],
  authentication: ['auth-overview', 'auth-configuration-and-guards', 'auth-identity-and-session', 'auth-personal-access-tokens', 'auth-middleware', 'auth-authorization', 'auth-policies', 'auth-account-recovery'],
  sessions: ['session-overview', 'session-state-and-flash', 'session-stores-and-concurrency', 'session-configuration-and-security'],
  cryptography: ['hashing-overview', 'hashing-password-storage', 'encrypter-overview', 'encrypter-encrypting-values'],
  validation: ['schemas-overview', 'schemas-declaring-schemas', 'schemas-integrations', 'schemas-constraints-and-reference', 'schemas-application-rules', 'schemas-validation-and-errors', 'schemas-controllers-and-http'],
};
const sectionSidebar = (sidebar, id) => sidebar.find((item) => item.items && flattenSidebar(item.items).some((child) => child.attrs?.['data-nav-group'] === id));

test('local catalog rejects collisions, unsupported pages, and incomplete translations', () => {
  assert.deepEqual(validateCatalog(documentationCatalog), sitePages);
  const cases = [
    [(copy) => { copy.pages[1].id = copy.pages[0].id; }, /Invalid or duplicate page ID/],
    [(copy) => { copy.pages[0].id = ''; }, /Invalid or duplicate page ID/],
    [(copy) => { copy.pages[1].slug.en = copy.pages[0].slug.en; }, /Invalid or duplicate slug/],
    [(copy) => { copy.pages[0].slug.es = '/es/../outside'; }, /Invalid or duplicate slug/],
    [(copy) => { copy.pages[0].slug.es = '/es/different-page'; }, /Different localized paths/],
    [(copy) => { copy.pages[0].kind = 'section'; }, /Invalid page kind/],
    [(copy) => { copy.pages[0].title.es = ' '; }, /Missing es title/],
    [(copy) => { copy.pages[0].label = { en: 'Start' }; }, /Missing es navigation label/],
    [(copy) => { copy.locales = ['en', 'es', 'en']; }, /Expected the en\/es locales/],
    [(copy) => { copy.pages = []; }, /Expected a nonempty local page catalog/],
  ];
  for (const [mutate, expectedError] of cases) {
    const copy = structuredClone(documentationCatalog);
    mutate(copy);
    assert.throws(() => validateCatalog(copy), expectedError);
  }
});
test('managed paths cannot escape their workspace directory', () => {
  assert.throws(() => within(root, '../framework/source.py'));
  assert.throws(() => within(root, root));
  assert.equal(within(root, 'src/content/docs/en/getting-started.md'), path.join(root, 'src/content/docs/en/getting-started.md'));
});
test('Markdown parsing preserves examples and ignores links inside code', () => {
  const example = '---\ntitle: Guide\n---\n\n## Requirements\n\n[Next](next.md)\n\n```python\n# keep this heading\nvalue = "[not a link](missing.md)"\n```\n';
  const body = stripFrontmatter(example).trimStart();
  assert.ok(body.startsWith('## Requirements'));
  assert.ok(body.includes('# keep this heading'));
  assert.equal(markdownLinks(body).length, 1);
  assert.equal(markdownLinks(body)[0].url, 'next.md');
  assert.ok(headingIds(body).has('requirements'));
});
test('repeated headings have distinct fragment IDs', () => {
  assert.deepEqual([...headingIds('## Same\n\n## Same\n')], ['_top', 'same', 'same-1']);
});

test('diagram fallback keeps markup inert and leaves ordinary code fences intact', () => {
  const tree = parser.parse('```mermaid\nflowchart TD\n  accTitle: A "quoted" diagram\n  A["</pre><script>alert(1)</script>"]\n```\n\n```python\nprint("<script>")\n```');
  const ordinaryCode = structuredClone(tree.children[1]);
  remarkMermaid()(tree);
  assert.equal(tree.children[0].type, 'html');
  assert.ok(tree.children[0].value.includes('aria-label="A &quot;quoted&quot; diagram"'));
  assert.ok(tree.children[0].value.includes('&lt;/pre&gt;&lt;script&gt;'));
  assert.ok(!tree.children[0].value.includes('<script>'));
  assert.deepEqual(tree.children[1], ordinaryCode);
});
test('navigation groups all ten build capabilities and data guides while keeping other categories flat', () => {
  const sidebar = createSidebar();
  assert.deepEqual(navigationSections.filter((section) => section.band === 'build').map((section) => section.id), groupedBuildSections);
  assert.deepEqual(navigationSections.filter((section) => section.groups).map((section) => section.id), [...groupedSections]);
  assert.deepEqual(navigationSections.filter((section) => !section.groups).map((section) => section.id), flatSections);
  for (const section of navigationSections) {
    if (buildPageIds[section.id]) assert.deepEqual(section.pageIds, buildPageIds[section.id], section.id);
    const item = sectionSidebar(sidebar, section.id);
    assert.ok(item, section.id);
    if (groupedSections.has(section.id)) {
      assert.ok(item.items.length > 0 && item.items.every((child) => child.items?.length > 0), section.id);
      assert.ok(item.items.every((child) => child.items.every((leaf) => !leaf.items)), section.id);
    } else assert.ok(item.items.every((child) => !child.items), section.id);
  }
  const links = flattenSidebar(sidebar);
  const primaryLinks = links.filter((item) => item.attrs?.['data-page-id']);
  assert.deepEqual(primaryLinks.map((item) => item.attrs['data-page-id']), navigationSections.flatMap((section) => section.pageIds));
  assert.equal(new Set(primaryLinks.map((item) => item.attrs['data-page-id'])).size, sitePages.length);
  assert.deepEqual(primaryLinks.map((item) => item.attrs['data-page-id']).sort(), sitePages.map((page) => page.id).sort());
  for (const page of documentationPages) assert.ok(links.some((item) => item.slug === page.slug.en.slice(4)), page.id);
  assert.ok(links.some((item) => item.link === 'https://api.orionis-framework.com/'));
  assert.ok(links.some((item) => item.slug === 'contribute/guide'));
  assert.ok(links.some((item) => item.link === '/contribute/contributors'));
});
test('capability navigation rejects unknown, duplicate, or omitted pages and invalid bands', () => {
  const cases = [
    [(copy) => { copy.sections[0].pageIds[0] = 'missing-page'; }, /Unknown navigation page/],
    [(copy) => { copy.sections[1].pageIds.push(copy.sections[0].pageIds[0]); }, /Duplicate navigation page/],
    [(copy) => { copy.sections.find((section) => section.id === 'storage').pageIds.shift(); }, /Pages without navigation/],
    [(copy) => { copy.sections[0].band = 'missing-band'; }, /Invalid navigation band\/order/],
    [(copy) => { copy.bands.push(structuredClone(copy.bands[0])); }, /Duplicate navigation band/],
    [(copy) => { copy.sections[0].band = copy.bands[1].id; }, /Invalid navigation band\/order/],
  ];
  for (const [mutate, expectedError] of cases) {
    const copy = structuredClone(documentationNavigation);
    mutate(copy);
    assert.throws(() => resolveNavigation(copy), expectedError);
  }
});

test('navigation subgroups preserve localized metadata, exact page order, and canonical destinations', () => {
  const sidebar = createSidebar();
  for (const section of navigationSections) {
    const item = sectionSidebar(sidebar, section.id);
    if (!groupedSections.has(section.id)) {
      assert.equal(section.groups, undefined, section.id);
      for (const link of item.items) assert.equal(link.attrs?.['data-nav-subgroup'], undefined, section.id);
      continue;
    }
    assert.ok(section.groups?.length > 0, section.id);
    assert.deepEqual(section.groups.flatMap((group) => group.pageIds), section.pageIds, section.id);
    assert.equal(item.items.length, section.groups.length, section.id);
    for (const [index, group] of section.groups.entries()) {
      const subgroup = item.items[index];
      assert.ok(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(group.id), group.id);
      assert.deepEqual(group.pages.map((page) => page.id), group.pageIds, group.id);
      assert.deepEqual(subgroup.items.map((link) => link.attrs['data-page-id']), group.pageIds, group.id);
      assert.equal(subgroup.label, group.title[documentationCatalog.defaultLocale], group.id);
      for (const locale of documentationCatalog.locales) {
        assert.ok(typeof group.title[locale] === 'string' && group.title[locale].trim(), `${group.id}/${locale}`);
        assert.equal(subgroup.translations[locale], group.title[locale], `${group.id}/${locale}`);
      }
      for (const link of subgroup.items) {
        const page = sitePages.find((entry) => entry.id === link.attrs['data-page-id']);
        assert.equal(link.attrs['data-nav-group'], section.id, page.id);
        assert.equal(link.attrs['data-nav-subgroup'], group.id, page.id);
        assert.equal(link.attrs.class, 'module-peer', page.id);
        assert.equal(page.kind === 'astro' ? link.link : link.slug, page.kind === 'astro' ? page.slug.en.slice(3) : page.slug.en.slice(4), page.id);
      }
    }
  }
});

test('navigation rejects malformed, duplicated, missing, reordered, and unsupported subgroups', () => {
  const database = (copy) => copy.sections.find((section) => section.id === 'database');
  const groupError = /navigation subgroup|navigation groups/i;
  const cases = [
    [(copy) => { const section = copy.sections.find((entry) => entry.id === 'storage'); section.groups = [{ id: 'unsupported', title: { en: 'Unsupported', es: 'No permitido' }, pageIds: [...section.pageIds] }]; }, groupError],
    [(copy) => { database(copy).groups = []; }, groupError],
    [(copy) => { delete database(copy).groups; }, groupError],
    [(copy) => { database(copy).groups[0].id = ''; }, groupError],
    [(copy) => { database(copy).groups[0].id = 'Invalid ID'; }, groupError],
    [(copy) => { database(copy).groups[1].id = database(copy).groups[0].id; }, groupError],
    [(copy) => { delete database(copy).groups[0].title.es; }, groupError],
    [(copy) => { database(copy).groups[0].title.en = ' '; }, groupError],
    [(copy) => { database(copy).groups[0].pageIds = []; }, groupError],
    [(copy) => { database(copy).groups[0].pageIds = 'database-overview'; }, groupError],
    [(copy) => { database(copy).groups[0].groups = []; }, groupError],
    [(copy) => { database(copy).groups[0].items = []; }, groupError],
    [(copy) => { database(copy).groups[0].pageIds[0] = 'missing-page'; }, groupError],
    [(copy) => { database(copy).groups[0].pageIds[0] = 'foundation-overview'; }, groupError],
    [(copy) => { database(copy).groups[0].pageIds[0] = 'missing-page'; database(copy).pageIds[0] = 'missing-page'; }, /Unknown navigation page|navigation subgroup|navigation groups/i],
    [(copy) => { database(copy).groups[0].pageIds.push(database(copy).groups[0].pageIds[0]); }, groupError],
    [(copy) => { const section = database(copy); section.groups[0].pageIds.push(section.groups[0].pageIds[0]); section.pageIds = section.groups.flatMap((group) => group.pageIds); }, /Duplicate navigation page|navigation subgroup|navigation groups/i],
    [(copy) => { database(copy).groups[0].pageIds.pop(); }, groupError],
    [(copy) => { database(copy).groups[0].pageIds.reverse(); }, groupError],
    [(copy) => { database(copy).groups.reverse(); }, groupError],
    [(copy) => { const section = database(copy); section.groups[0].pageIds.shift(); section.pageIds = section.groups.flatMap((group) => group.pageIds); }, /Pages without navigation/],
  ];
  for (const [mutate, expectedError] of cases) {
    const copy = structuredClone(documentationNavigation);
    mutate(copy);
    assert.throws(() => resolveNavigation(copy), expectedError);
  }
});
test('regrouping navigation preserves page IDs, page records, and both locale routes', () => {
  const copy = structuredClone(documentationNavigation);
  const index = copy.sections.findIndex((section) => section.id === 'storage');
  copy.sections[index].pageIds.reverse();
  const resolved = resolveNavigation(copy);
  assert.deepEqual(resolved[index].pages.map((page) => page.id), copy.sections[index].pageIds);
  assert.deepEqual(resolved.flatMap((section) => section.pages).sort((a, b) => a.id.localeCompare(b.id)), [...sitePages].sort((a, b) => a.id.localeCompare(b.id)));
  for (const section of resolved) for (const page of section.pages) {
    for (const locale of documentationCatalog.locales) assert.equal(getPageBySlug(page.slug[locale]).id, page.id);
  }
});
test('the menu makes realtime, MCP, and application services distinct visible capabilities', () => {
  assert.deepEqual(navigationSections.slice(0, 4).map((section) => section.id), ['getting-started', 'http', 'realtime', 'mcp']);
  assert.deepEqual(navigationSections[0].pageIds, ['foundation-overview', 'foundation-installation', 'foundation-getting-started', 'foundation-architecture-and-lifecycle']);
  const sectionFor = (pageId) => navigationSections.find((section) => section.pageIds.includes(pageId));
  for (const id of ['realtime-overview', 'realtime-protocol-and-streaming', 'http-websockets', 'http-streaming-and-sse']) assert.equal(sectionFor(id).id, 'realtime');
  for (const id of ['mcp-overview', 'mcp-transports-and-configuration', 'test-mcp-testing']) assert.equal(sectionFor(id).id, 'mcp');
  for (const [pageId, sectionId] of [['storage-overview', 'storage'], ['cache-overview', 'cache'], ['mail-overview', 'mail'], ['queues-overview', 'queues'], ['auth-overview', 'authentication'], ['view-overview', 'views']]) assert.equal(sectionFor(pageId).id, sectionId);
  for (const section of navigationSections) for (const locale of documentationCatalog.locales) assert.ok(section.title[locale]);
});
test('retained contribution pages switch languages through their stable IDs', () => {
  const page = getPageBySlug('/es/contribute/contributors');
  assert.equal(page.id, 'community-contributors');
  assert.deepEqual(getTranslations(page.id).map((item) => item.slug), ['/en/contribute/contributors', '/es/contribute/contributors']);
});

test('Database, ORM, and Faker have independent trees in data order with stable page IDs', () => {
  const sections = new Map(navigationSections.map((section) => [section.id, section]));
  assert.ok(!sections.has('database-and-orm'));
  const database = sections.get('database'), orm = sections.get('orm'), faker = sections.get('faker');
  assert.ok(database && orm && faker && database !== orm && orm !== faker);
  assert.equal(database.band, 'data');
  assert.equal(orm.band, 'data');
  assert.equal(faker.band, 'data');
  const index = navigationSections.findIndex((section) => section.id === 'database');
  assert.deepEqual(navigationSections.slice(index, index + 3).map((section) => section.id), ['database', 'orm', 'faker']);
  for (const id of ['database-overview', 'database-commands', 'database-db-facade', 'database-transactions', 'database-column-types', 'database-seeders']) assert.ok(database.pageIds.includes(id), id);
  for (const id of ['orm-overview', 'orm-model-api', 'orm-relationships', 'orm-eager-loading', 'orm-soft-deletes', 'orm-scopes', 'orm-events', 'orm-factories-and-testing']) assert.ok(orm.pageIds.includes(id), id);
  assert.deepEqual(faker.pageIds, ['orm-faker', 'orm-faker-reference-a-d', 'orm-faker-reference-e-h', 'orm-faker-reference-i-l', 'orm-faker-reference-m-p', 'orm-faker-reference-q-t', 'orm-faker-reference-u-z']);
  assert.ok(orm.pageIds.every((id) => !faker.pageIds.includes(id)));
  assert.ok(database.pages.every((page) => !page.slug.en.includes('/database/orm')));
  assert.ok(orm.pages.every((page) => page.slug.en.startsWith('/en/database/orm')));
  assert.ok(faker.pages.every((page) => page.slug.en.startsWith('/en/database/orm/faker')));
  const sidebar = createSidebar();
  for (const id of ['database', 'orm', 'faker']) {
    const group = sectionSidebar(sidebar, id);
    assert.ok(group);
    for (const item of flattenSidebar(group.items)) assert.equal(item.attrs.class, 'module-peer');
    for (const locale of documentationCatalog.locales) assert.notEqual(group.translations[locale], group.items[0].translations[locale]);
  }
});

test('MCP component guides remain peers within the MCP subgroups', () => {
  const group = sectionSidebar(createSidebar(), 'mcp');
  assert.ok(group);
  const links = flattenSidebar(group.items);
  for (const item of links) assert.equal(item.attrs.class, 'module-peer');
  for (const id of ['mcp-tools', 'mcp-resources-and-prompts', 'mcp-prompts', 'mcp-http-and-clients']) {
    assert.ok(links.some((item) => item.attrs['data-page-id'] === id), id);
  }
  for (const locale of documentationCatalog.locales) {
    assert.notEqual(group.translations[locale], group.items[0].translations[locale]);
  }
});

test('view guides are peers and translations have their own category', () => {
  const sidebar = createSidebar();
  const views = sectionSidebar(sidebar, 'views');
  const localization = sectionSidebar(sidebar, 'localization');
  assert.ok(views && localization && views !== localization);
  for (const group of [views, localization]) {
    for (const item of flattenSidebar(group.items)) assert.equal(item.attrs.class, 'module-peer');
    for (const locale of documentationCatalog.locales) assert.notEqual(group.translations[locale], group.items[0].translations[locale]);
  }
  for (const id of ['view-filters', 'view-globals', 'view-providers-and-extensions']) {
    assert.ok(flattenSidebar(views.items).some((item) => item.attrs['data-page-id'] === id), id);
  }
  assert.deepEqual(flattenSidebar(localization.items).map((item) => item.attrs['data-page-id']), [
    'localization-overview', 'localization-messages-and-locales',
    'localization-translating-content', 'localization-application-and-views',
  ]);
});

test('authentication guides are peers with sessions and cryptography in separate categories', () => {
  const sidebar = createSidebar();
  const group = (id) => sectionSidebar(sidebar, id);
  const authentication = group('authentication');
  const sessions = group('sessions');
  const cryptography = group('cryptography');
  assert.ok(authentication && sessions && cryptography);
  assert.deepEqual(flattenSidebar(authentication.items).map((item) => item.attrs['data-page-id']), [
    'auth-overview', 'auth-configuration-and-guards', 'auth-identity-and-session',
    'auth-personal-access-tokens', 'auth-middleware', 'auth-authorization',
    'auth-policies', 'auth-account-recovery',
  ]);
  assert.deepEqual(flattenSidebar(sessions.items).map((item) => item.attrs['data-page-id']), [
    'session-overview', 'session-state-and-flash',
    'session-stores-and-concurrency', 'session-configuration-and-security',
  ]);
  assert.deepEqual(flattenSidebar(cryptography.items).map((item) => item.attrs['data-page-id']), [
    'hashing-overview', 'hashing-password-storage',
    'encrypter-overview', 'encrypter-encrypting-values',
  ]);
  for (const section of [authentication, sessions, cryptography]) {
    for (const item of flattenSidebar(section.items)) assert.equal(item.attrs.class, 'module-peer');
  }
  for (const locale of documentationCatalog.locales) {
    assert.notEqual(authentication.translations[locale], authentication.items[0].translations[locale]);
    assert.notEqual(sessions.translations[locale], sessions.items[0].translations[locale]);
  }
});
