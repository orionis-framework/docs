import fs from 'node:fs/promises';
import path from 'node:path';
import { root, contentPath, headingIds } from './documentation-lib.mjs';
import { sitePages, navigationSections } from '../src/utils/documentation-menu.mjs';

const inventory = JSON.parse(await fs.readFile(path.join(root, 'public/downloads/queues-api-inventory.json'), 'utf8'));
const expectedPages = [
  'queues-overview', 'queues-drivers-and-configuration', 'queues-configuration',
  'queues-jobs-and-dispatch', 'queues-execution-modes', 'queues-workers-and-failures', 'queues-failures-and-retries',
  'queues-manager-and-injection', 'queues-api-reference',
  'background-overview', 'background-response-tasks', 'console-task-scheduling',
];
const queues = navigationSections.find((section) => section.id === 'queues');
if (JSON.stringify(queues?.pageIds) !== JSON.stringify(expectedPages) || queues?.groups?.length !== 4) throw new Error('Queues must retain nine queue guides and three related guides in four ordered subgroups.');
if (!inventory.entries?.length || !inventory.hashes || inventory.entries.filter((entry) => entry.kind === 'type-alias').length !== 3 || !inventory.entries.some((entry) => entry.symbol === 'PendingDispatch.__await__')) throw new Error('Incomplete Queues API inventory.');
const symbols = new Set(), documents = new Map();
for (const entry of inventory.entries) {
  const identity = `${entry.source}:${entry.symbol}`;
  if (symbols.has(identity) || !entry.signature || !Number.isInteger(entry.line) || entry.line < 1) throw new Error(`Invalid or duplicate Queues declaration: ${identity}`);
  if (!/^[a-f0-9]{64}$/.test(inventory.hashes[entry.source] || '')) throw new Error(`Missing source checksum: ${identity}`);
  symbols.add(identity);
  const [destination, anchor] = entry.reference.split('#');
  for (const locale of ['es', 'en']) {
    const slug = `/${locale}${destination}`;
    if (!sitePages.some((page) => page.slug[locale] === slug) || !anchor) throw new Error(`Unknown Queues destination: ${slug}`);
    if (!documents.has(slug)) documents.set(slug, headingIds(await fs.readFile(contentPath(slug), 'utf8')));
    if (!documents.get(slug).has(anchor)) throw new Error(`Missing Queues API anchor: ${slug}#${anchor} (${entry.symbol})`);
  }
}
console.log(`Queues coverage valid: ${inventory.entries.length} own public declarations, ${Object.keys(inventory.hashes).length} source files and 9 queue guides per locale.`);
