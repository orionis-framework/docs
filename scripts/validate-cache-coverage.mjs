import fs from 'node:fs/promises';
import path from 'node:path';
import { root, contentPath, headingIds } from './documentation-lib.mjs';
import { sitePages, navigationSections } from '../src/utils/documentation-menu.mjs';

const inventory = JSON.parse(await fs.readFile(path.join(root, 'public/downloads/cache-api-inventory.json'), 'utf8'));
const expectedPages = ['cache-overview', 'cache-stores-and-locks', 'cache-configuration', 'cache-caching-values', 'cache-locks', 'cache-source-artifacts', 'cache-manager-and-injection', 'cache-api-reference'];
const cache = navigationSections.find((section) => section.id === 'cache');
if (JSON.stringify(cache?.pageIds) !== JSON.stringify(expectedPages) || cache?.groups?.length !== 3) throw new Error('Cache must retain its eight guides in three ordered subgroups.');
if (!inventory.entries?.length || !inventory.hashes || inventory.entries.filter((entry) => entry.kind === 'alias').length !== 4) throw new Error('Incomplete Cache API inventory.');
const symbols = new Set(), documents = new Map();
for (const entry of inventory.entries) {
  const identity = `${entry.source}:${entry.symbol}`;
  if (symbols.has(identity) || !entry.signature || !Number.isInteger(entry.line) || entry.line < 1) throw new Error(`Invalid or duplicate Cache declaration: ${identity}`);
  if (!/^[a-f0-9]{64}$/.test(inventory.hashes[entry.source] || '')) throw new Error(`Missing source checksum: ${identity}`);
  symbols.add(identity);
  const [destination, anchor] = entry.reference.split('#');
  for (const locale of ['es', 'en']) {
    const slug = `/${locale}${destination}`;
    if (!sitePages.some((page) => page.slug[locale] === slug) || !anchor) throw new Error(`Unknown Cache destination: ${slug}`);
    if (!documents.has(slug)) documents.set(slug, headingIds(await fs.readFile(contentPath(slug), 'utf8')));
    if (!documents.get(slug).has(anchor)) throw new Error(`Missing Cache API anchor: ${slug}#${anchor} (${entry.symbol})`);
  }
}
console.log(`Cache coverage valid: ${inventory.entries.length} own public declarations, ${Object.keys(inventory.hashes).length} source files and 8 guides per locale.`);
