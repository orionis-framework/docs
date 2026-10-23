import fs from 'node:fs/promises';
import path from 'node:path';
import { root, contentPath, headingIds } from './documentation-lib.mjs';
import { navigationSections, sitePages } from '../src/utils/documentation-menu.mjs';

const inventory = JSON.parse(await fs.readFile(path.join(root, 'public/downloads/logging-api-inventory.json'), 'utf8'));
const pageIds = ['logging-overview', 'logging-configuration', 'logging-writing-logs', 'logging-rotation-and-lifecycle'];
const section = navigationSections.find((entry) => entry.id === 'logging');
if (JSON.stringify(section?.pageIds) !== JSON.stringify(pageIds)
  || JSON.stringify(section?.groups?.map((group) => group.id)) !== JSON.stringify(['logging-start', 'logging-operation'])) {
  throw new Error('Logs must retain an independent four-guide, two-group menu.');
}
if (navigationSections.some((entry) => entry.id !== 'logging' && entry.pageIds.some((id) => id.startsWith('logging-')))) {
  throw new Error('Logging guides must not remain in Deployment or another category.');
}
const deployment = navigationSections.find((entry) => entry.id === 'deployment');
if (!deployment || deployment.pageIds.some((id) => id.startsWith('logging-'))) {
  throw new Error('Deployment must not duplicate the independent Logs guides.');
}
if (!inventory.entries?.length || !inventory.hashes
  || !['orionis/logging', 'orionis/foundation/config/logging'].every((sourceRoot) => inventory.sourceRoots?.includes(sourceRoot))) {
  throw new Error('Incomplete Logging source inventory.');
}
for (const [source, hash] of Object.entries(inventory.hashes)) {
  if (!source || !/^[a-f0-9]{64}$/.test(hash)) throw new Error(`Invalid Logging source checksum: ${source}`);
}
const symbols = new Set(), documents = new Map();
for (const entry of inventory.entries) {
  const identity = `${entry.source}:${entry.symbol}`;
  if (symbols.has(identity) || !entry.source || !entry.symbol || !entry.kind || !entry.signature?.trim()
    || !Number.isInteger(entry.line) || entry.line < 1 || !inventory.hashes[entry.source]) {
    throw new Error(`Invalid or duplicate Logging declaration: ${identity}`);
  }
  symbols.add(identity);
  if (typeof entry.reference !== 'string' || !entry.reference.startsWith('/services/logging')) {
    throw new Error(`Invalid Logging reference: ${identity}`);
  }
  const parts = entry.reference.split('#');
  const [destination, anchor] = parts;
  if (parts.length !== 2 || !anchor) throw new Error(`Logging reference needs one anchor: ${identity}`);
  for (const locale of ['es', 'en']) {
    const slug = `/${locale}${destination}`;
    if (!sitePages.some((page) => page.kind === 'doc' && page.slug[locale] === slug && pageIds.includes(page.id))) {
      throw new Error(`Unknown Logging destination: ${slug} (${identity})`);
    }
    if (!documents.has(slug)) documents.set(slug, headingIds(await fs.readFile(contentPath(slug), 'utf8')));
    if (!documents.get(slug).has(anchor)) throw new Error(`Missing Logging anchor: ${slug}#${anchor} (${identity})`);
  }
}
console.log(`Logging coverage valid: ${inventory.entries.length} public declarations, ${Object.keys(inventory.hashes).length} source files and four guides per locale.`);
