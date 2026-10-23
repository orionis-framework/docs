import fs from 'node:fs/promises';
import path from 'node:path';
import { root, contentPath, headingIds } from './documentation-lib.mjs';
import { navigationSections, sitePages } from '../src/utils/documentation-menu.mjs';

const inventory = JSON.parse(await fs.readFile(path.join(root, 'public/downloads/environment-api-inventory.json'), 'utf8'));
const pageIds = ['environment-overview', 'environment-typed-configuration', 'environment-compiled-configuration', 'environment-operations-and-reference'];
const section = navigationSections.find((entry) => entry.id === 'environment');
if (JSON.stringify(section?.pageIds) !== JSON.stringify(pageIds) || section.groups?.length !== 2) throw new Error('Environment must retain its four guides in an independent two-group menu.');
if (navigationSections.some((entry) => entry.id !== 'environment' && entry.pageIds.some((id) => id.startsWith('environment-')))) throw new Error('Environment pages must not be duplicated under Application or another category.');
if (!inventory.entries?.length || !inventory.hashes || inventory.sourceRoot !== 'orionis/environment') throw new Error('Incomplete Environment API inventory.');
const symbols = new Set(), documents = new Map();
for (const entry of inventory.entries) {
  const identity = `${entry.source}:${entry.symbol}`;
  if (symbols.has(identity) || !entry.signature || !Number.isInteger(entry.line) || entry.line < 1 || !/^[a-f0-9]{64}$/.test(inventory.hashes[entry.source] || '')) throw new Error(`Invalid Environment declaration: ${identity}`);
  symbols.add(identity);
  const [destination, anchor] = entry.reference.split('#');
  for (const locale of ['es', 'en']) {
    const slug = `/${locale}${destination}`;
    if (!anchor || !sitePages.some((page) => page.slug[locale] === slug && pageIds.includes(page.id))) throw new Error(`Invalid Environment destination: ${slug} (${identity})`);
    if (!documents.has(slug)) documents.set(slug, headingIds(await fs.readFile(contentPath(slug), 'utf8')));
    if (!documents.get(slug).has(anchor)) throw new Error(`Missing Environment anchor: ${slug}#${anchor} (${identity})`);
  }
}
console.log(`Environment coverage valid: ${inventory.entries.length} public declarations, ${Object.keys(inventory.hashes).length} source files and four guides per locale.`);
