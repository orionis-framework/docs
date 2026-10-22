import fs from 'node:fs/promises';
import path from 'node:path';
import { root, contentPath, headingIds } from './documentation-lib.mjs';
import { sitePages, navigationSections } from '../src/utils/documentation-menu.mjs';

const inventory = JSON.parse(await fs.readFile(path.join(root, 'public/downloads/storage-api-inventory.json'), 'utf8'));
const expectedPages = ['storage-overview', 'storage-disks-and-drivers', 'storage-configuration', 'storage-files-and-directories', 'storage-streaming-and-uploads', 'storage-temporary-files-and-contexts', 'storage-manager-and-injection', 'storage-api-reference'];
const storage = navigationSections.find((section) => section.id === 'storage');
if (JSON.stringify(storage?.pageIds) !== JSON.stringify(expectedPages) || storage?.groups?.length !== 3) throw new Error('Storage must retain its eight guides in three ordered subgroups.');
if (!inventory.entries?.length || !inventory.hashes || inventory.compatibilityAliases?.length !== 7) throw new Error('Incomplete Storage API inventory.');
const symbols = new Set(), documents = new Map();
for (const entry of inventory.entries) {
  const identity = `${entry.source}:${entry.symbol}`;
  if (symbols.has(identity) || !entry.signature || !Number.isInteger(entry.line) || entry.line < 1) throw new Error(`Invalid or duplicate Storage declaration: ${identity}`);
  if (!/^[a-f0-9]{64}$/.test(inventory.hashes[entry.source] || '')) throw new Error(`Missing source checksum: ${identity}`);
  symbols.add(identity);
}
for (const entry of [...inventory.entries, ...inventory.compatibilityAliases]) {
  const [destination, anchor] = entry.reference.split('#');
  for (const locale of ['es', 'en']) {
    const slug = `/${locale}${destination}`;
    if (!sitePages.some((page) => page.slug[locale] === slug) || !anchor) throw new Error(`Unknown Storage destination: ${slug}`);
    if (!documents.has(slug)) documents.set(slug, headingIds(await fs.readFile(contentPath(slug), 'utf8')));
    if (!documents.get(slug).has(anchor)) throw new Error(`Missing Storage API anchor: ${slug}#${anchor} (${entry.symbol || entry.alias})`);
  }
}
console.log(`Storage coverage valid: ${inventory.entries.length} own public declarations, ${inventory.compatibilityAliases.length} compatibility aliases, ${Object.keys(inventory.hashes).length} source files and 8 guides per locale.`);
