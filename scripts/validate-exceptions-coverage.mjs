import fs from 'node:fs/promises';
import path from 'node:path';
import { root, contentPath, headingIds } from './documentation-lib.mjs';
import { navigationSections, sitePages } from '../src/utils/documentation-menu.mjs';

const inventory = JSON.parse(await fs.readFile(path.join(root, 'public/downloads/exceptions-api-inventory.json'), 'utf8'));
const pageIds = ['failure-overview', 'failure-handling-exceptions', 'failure-contexts-and-transports', 'failure-policies-and-reference'];
const section = navigationSections.find((entry) => entry.id === 'exceptions');
if (JSON.stringify(section?.pageIds) !== JSON.stringify(pageIds)
  || JSON.stringify(section?.groups?.map((group) => group.id)) !== JSON.stringify(['exceptions-application', 'exceptions-contexts'])) {
  throw new Error('Exceptions must retain four guides in its independent two-group category.');
}
if (navigationSections.some((entry) => entry.id !== 'exceptions' && entry.pageIds.some((id) => id.startsWith('failure-')))) {
  throw new Error('General exception guides must occur only in Exceptions.');
}
if (!navigationSections.find((entry) => entry.id === 'http')?.pageIds.includes('http-exceptions')) {
  throw new Error('The HTTP exception guide must retain its HTTP-specific navigation home.');
}
if (!inventory.entries?.length || inventory.sourceRoot !== 'orionis/failure' || !inventory.hashes) {
  throw new Error('Incomplete Exceptions API inventory.');
}
for (const [source, hash] of Object.entries(inventory.hashes)) {
  if (!source || !/^[a-f0-9]{64}$/.test(hash)) throw new Error(`Invalid Exceptions source checksum: ${source}`);
}
const symbols = new Set(), documents = new Map();
for (const integration of inventory.integrations || []) {
  if (!inventory.hashes[integration.source] || !integration.reference?.startsWith('/architecture/exception-handling/contexts-and-transports#context-')) {
    throw new Error(`Invalid Exceptions transport integration: ${integration.source}`);
  }
  const [destination, anchor] = integration.reference.split('#');
  for (const locale of ['es', 'en']) {
    const slug = `/${locale}${destination}`;
    if (!documents.has(slug)) documents.set(slug, headingIds(await fs.readFile(contentPath(slug), 'utf8')));
    if (!anchor || !documents.get(slug).has(anchor)) throw new Error(`Missing Exceptions transport anchor: ${slug}#${anchor}`);
  }
}
for (const entry of inventory.entries) {
  const identity = `${entry.source}:${entry.symbol}`;
  if (symbols.has(identity) || !entry.source || !entry.symbol || !entry.kind || !entry.signature?.trim()
    || !Number.isInteger(entry.line) || entry.line < 1 || !inventory.hashes[entry.source]) {
    throw new Error(`Invalid or duplicate Exceptions declaration: ${identity}`);
  }
  symbols.add(identity);
  if (typeof entry.reference !== 'string') throw new Error(`Missing Exceptions reference: ${identity}`);
  const parts = entry.reference.split('#');
  const [destination, anchor] = parts;
  if (parts.length !== 2 || !anchor) throw new Error(`Exceptions reference requires one anchor: ${identity}`);
  for (const locale of ['es', 'en']) {
    const slug = `/${locale}${destination}`;
    if (!sitePages.some((page) => page.kind === 'doc' && page.slug[locale] === slug && pageIds.includes(page.id))) {
      throw new Error(`Unknown Exceptions destination: ${slug} (${identity})`);
    }
    if (!documents.has(slug)) documents.set(slug, headingIds(await fs.readFile(contentPath(slug), 'utf8')));
    if (!documents.get(slug).has(anchor)) throw new Error(`Missing Exceptions anchor: ${slug}#${anchor} (${identity})`);
  }
}
console.log(`Exceptions coverage valid: ${inventory.entries.length} public declarations, ${inventory.integrations?.length || 0} integration references, ${Object.keys(inventory.hashes).length} source files and four guides per locale.`);
