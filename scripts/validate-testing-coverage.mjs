import fs from 'node:fs/promises';
import path from 'node:path';
import { root, contentPath, headingIds } from './documentation-lib.mjs';
import { navigationSections, sitePages } from '../src/utils/documentation-menu.mjs';

const ids = ['test-overview', 'test-writing-and-running-tests', 'test-cases-and-decorators', 'test-dependency-injection', 'test-results-and-reference'];
const section = navigationSections.find((item) => item.id === 'testing');
if (section?.title.es !== 'Pruebas' || section.title.en !== 'Testing'
  || JSON.stringify(section.pageIds) !== JSON.stringify(ids)
  || JSON.stringify(section.groups?.map((group) => group.id)) !== JSON.stringify(['testing-writing', 'testing-application-and-results'])) {
  throw new Error('Testing requires five guides in its own localized two-group category.');
}
if (!navigationSections.find((entry) => entry.id === 'mcp')?.pageIds.includes('test-mcp-testing')) throw new Error('The MCP testing guide must retain its MCP navigation home.');
const manifest = JSON.parse(await fs.readFile(path.join(root, 'public/downloads/testing-api-inventory.json'), 'utf8'));
if (!manifest.entries?.length || !manifest.hashes || !manifest.inheritedApi) throw new Error('Incomplete testing source inventory.');
const documents = new Map(), identities = new Set();
for (const [source, hash] of Object.entries(manifest.hashes)) {
  if (!source || !/^[a-f0-9]{64}$/.test(hash)) throw new Error(`Invalid testing checksum: ${source}`);
}
for (const entry of manifest.entries) {
  const identity = `${entry.source}:${entry.symbol}`;
  if (identities.has(identity) || !entry.signature || !entry.kind || !manifest.hashes[entry.source]
    || !Number.isInteger(entry.line) || entry.line < 1) throw new Error(`Invalid testing declaration: ${identity}`);
  identities.add(identity);
}
for (const entry of [...manifest.entries, ...manifest.integrations, manifest.inheritedApi]) {
  const [destination, anchor] = entry.reference.split('#');
  for (const locale of ['es', 'en']) {
    const slug = `/${locale}${destination}`;
    if (!sitePages.some((page) => [...ids, 'test-mcp-testing'].includes(page.id) && page.slug[locale] === slug)) throw new Error(`Unknown testing source destination: ${slug}`);
    if (!documents.has(slug)) documents.set(slug, await fs.readFile(contentPath(slug), 'utf8'));
    if (anchor && !headingIds(documents.get(slug)).has(anchor)) throw new Error(`Missing testing source anchor: ${slug}#${anchor}`);
  }
}
for (const locale of ['es', 'en']) {
  const cases = documents.get(`/${locale}/testing/cases-and-decorators`);
  for (const name of [...manifest.inheritedApi.lifecycle, ...manifest.inheritedApi.cleanup, ...manifest.inheritedApi.decorators.map((name) => name.split('.').at(-1))]) {
    if (!cases.includes(name)) throw new Error(`Missing inherited testing feature: ${locale}/${name}`);
  }
}
console.log(`Testing coverage valid: ${manifest.entries.length} mapped public declarations, ${Object.keys(manifest.hashes).length} source files and five guides per locale; inherited unittest API is tracked separately.`);
