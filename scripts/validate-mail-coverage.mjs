import fs from 'node:fs/promises';
import path from 'node:path';
import { root, contentPath, headingIds } from './documentation-lib.mjs';
import { sitePages, navigationSections } from '../src/utils/documentation-menu.mjs';

const inventory = JSON.parse(await fs.readFile(path.join(root, 'public/downloads/mail-api-inventory.json'), 'utf8'));
const expectedPages = ['mail-overview', 'mail-configuration', 'mail-transports-and-extensions', 'mail-composing-mail', 'mail-content-and-views', 'mail-attachments', 'mail-sending-and-results', 'mail-manager-and-injection', 'mail-api-reference'];
const mail = navigationSections.find((section) => section.id === 'mail');
if (JSON.stringify(mail?.pageIds) !== JSON.stringify(expectedPages) || mail?.groups?.length !== 3) throw new Error('Mail must retain its nine guides in three ordered subgroups.');
if (!inventory.entries?.length || !inventory.hashes || inventory.entries.filter((entry) => entry.kind === 'overload').length !== 6 || inventory.entries.filter((entry) => entry.kind === 'type-alias').length !== 5) throw new Error('Incomplete Mail API inventory.');
const symbols = new Set(), documents = new Map();
for (const entry of inventory.entries) {
  const identity = `${entry.source}:${entry.symbol}`;
  if (symbols.has(identity) || !entry.signature || !Number.isInteger(entry.line) || entry.line < 1) throw new Error(`Invalid or duplicate Mail declaration: ${identity}`);
  if (!/^[a-f0-9]{64}$/.test(inventory.hashes[entry.source] || '')) throw new Error(`Missing source checksum: ${identity}`);
  symbols.add(identity);
  const [destination, anchor] = entry.reference.split('#');
  for (const locale of ['es', 'en']) {
    const slug = `/${locale}${destination}`;
    if (!sitePages.some((page) => page.slug[locale] === slug) || !anchor) throw new Error(`Unknown Mail destination: ${slug}`);
    if (!documents.has(slug)) documents.set(slug, headingIds(await fs.readFile(contentPath(slug), 'utf8')));
    if (!documents.get(slug).has(anchor)) throw new Error(`Missing Mail API anchor: ${slug}#${anchor} (${entry.symbol})`);
  }
}
console.log(`Mail coverage valid: ${inventory.entries.length} own public declarations, ${Object.keys(inventory.hashes).length} source files and 9 guides per locale.`);
