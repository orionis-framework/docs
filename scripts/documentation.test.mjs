import test from 'node:test';
import assert from 'node:assert/strict';
import remarkMermaid from '../src/plugins/remark-mermaid.mjs';
import path from 'node:path';
import { root, validateCatalog, within, stripFrontmatter, markdownLinks, headingIds, parser } from './documentation-lib.mjs';
import { createSidebar, documentationCatalog, documentationNavigation, navigationSections, resolveNavigation, sitePages, documentationPages, getPageBySlug, getTranslations } from '../src/utils/documentation-menu.mjs';

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
test('navigation exposes all chapters in two levels and keeps API/contribution resources', () => {
  const sidebar = createSidebar();
  assert.ok(sidebar.every((item) => !item.items?.some((child) => child.items)));
  const links = sidebar.flatMap((item) => item.items || [item]);
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
    [(copy) => { copy.sections[0].pageIds.shift(); }, /Pages without navigation/],
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
test('regrouping navigation preserves page IDs, page records, and both locale routes', () => {
  const copy = structuredClone(documentationNavigation);
  copy.sections[0].pageIds.reverse();
  const resolved = resolveNavigation(copy);
  assert.deepEqual(resolved[0].pages.map((page) => page.id), copy.sections[0].pageIds);
  assert.deepEqual(resolved.flatMap((section) => section.pages).sort((a, b) => a.id.localeCompare(b.id)), [...sitePages].sort((a, b) => a.id.localeCompare(b.id)));
  for (const section of resolved) for (const page of section.pages) {
    for (const locale of documentationCatalog.locales) assert.equal(getPageBySlug(page.slug[locale]).id, page.id);
  }
});
test('the menu makes realtime, MCP, and application services distinct visible capabilities', () => {
  assert.deepEqual(navigationSections.slice(0, 4).map((section) => section.id), ['getting-started', 'http', 'realtime', 'mcp']);
  assert.deepEqual(navigationSections[0].pageIds, ['foundation-overview', 'foundation-installation', 'foundation-getting-started', 'foundation-architecture-and-lifecycle', 'http-overview']);
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
