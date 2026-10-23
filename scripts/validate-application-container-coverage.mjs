import fs from 'node:fs/promises';
import path from 'node:path';
import { root, contentPath, headingIds } from './documentation-lib.mjs';
import { navigationSections, sitePages } from '../src/utils/documentation-menu.mjs';

const inventory = JSON.parse(await fs.readFile(path.join(root, 'public/downloads/application-container-api-inventory.json'), 'utf8'));
const pageIds = [
  'foundation-application-overview', 'foundation-application-lifecycle', 'foundation-server-entrypoints', 'foundation-application-api',
  'foundation-bootstrap-options', 'foundation-configuration', 'foundation-paths-and-caching',
  'container-overview', 'container-bindings-and-invocation', 'container-scopes-and-concurrency',
  'container-providers-and-facades', 'container-facades',
  'aio-async-execution',
];
const groupIds = ['application-lifecycle', 'application-bootstrap', 'application-container', 'application-services', 'application-async'];
const section = navigationSections.find((entry) => entry.id === 'application');
if (JSON.stringify(section?.pageIds) !== JSON.stringify(pageIds)
  || JSON.stringify(section?.groups?.map((group) => group.id)) !== JSON.stringify(groupIds)
  || JSON.stringify(section.groups.flatMap((group) => group.pageIds)) !== JSON.stringify(pageIds)) {
  throw new Error('Application and Container must retain 13 guides in five ordered groups.');
}
if (navigationSections.some((entry) => entry.id !== 'application' && entry.pageIds.some((id) => pageIds.includes(id)))) {
  throw new Error('Application and Container guides must occur only in their own category.');
}
const environment = navigationSections.find((entry) => entry.id === 'environment');
if (!environment?.pageIds.length || section.pageIds.some((id) => id.startsWith('environment-'))
  || navigationSections.some((entry) => entry.id !== 'environment' && entry.pageIds.some((id) => environment.pageIds.includes(id)))) {
  throw new Error('Environment must remain an independent category without duplicated guides.');
}
if (!Array.isArray(inventory.sourceRoots)
  || !['orionis/container', 'orionis/foundation'].every((sourceRoot) => inventory.sourceRoots.includes(sourceRoot))
  || !inventory.entries?.length || !Array.isArray(inventory.configurationReferences)
  || !inventory.hashes || !Object.keys(inventory.hashes).length) {
  throw new Error('Incomplete Application and Container source, API or configuration-reference inventory.');
}
for (const [source, hash] of Object.entries(inventory.hashes)) {
  if (!source || !/^[a-f0-9]{64}$/.test(hash)) throw new Error(`Invalid Application and Container source checksum: ${source}`);
}

const documents = new Map();
async function checkReference(reference, identity, detailed) {
  if (typeof reference !== 'string' || !reference.startsWith('/') || /^\/(?:es|en)(?:\/|$)/.test(reference)) {
    throw new Error(`Application and Container reference must be a locale-independent path: ${identity}`);
  }
  const parts = reference.split('#');
  const [destination, anchor] = parts;
  if (parts.length > 2 || (parts.length === 2 && !anchor) || (detailed && !anchor)) {
    throw new Error(`Invalid Application and Container reference: ${reference} (${identity})`);
  }
  for (const locale of ['es', 'en']) {
    const slug = `/${locale}${destination}`;
    const page = sitePages.find((entry) => entry.slug[locale] === slug);
    if (!page || page.kind !== 'doc' || (detailed && !pageIds.includes(page.id))) {
      throw new Error(`Unknown ${detailed ? 'detailed API' : 'configuration cross-reference'} destination: ${slug} (${identity})`);
    }
    if (!documents.has(slug)) documents.set(slug, headingIds(await fs.readFile(contentPath(slug), 'utf8')));
    if (anchor && !documents.get(slug).has(anchor)) throw new Error(`Missing Application and Container anchor: ${slug}#${anchor} (${identity})`);
  }
}

async function checkDeclarations(entries, detailed) {
  const symbols = new Set();
  for (const entry of entries) {
    const identity = `${entry.source}:${entry.symbol}`;
    if (symbols.has(identity) || typeof entry.source !== 'string' || !entry.source
      || typeof entry.symbol !== 'string' || !entry.symbol || typeof entry.kind !== 'string' || !entry.kind
      || typeof entry.signature !== 'string' || !entry.signature.trim()
      || !Number.isInteger(entry.line) || entry.line < 1
      || !/^[a-f0-9]{64}$/.test(inventory.hashes[entry.source] || '')) {
      throw new Error(`Invalid or duplicate Application and Container ${detailed ? 'declaration' : 'configuration cross-reference'}: ${identity}`);
    }
    symbols.add(identity);
    await checkReference(entry.reference, identity, detailed);
  }
}

await checkDeclarations(inventory.entries, true);
await checkDeclarations(inventory.configurationReferences, false);
console.log(`Application and Container coverage valid: ${inventory.entries.length} detailed API declarations, ${inventory.configurationReferences.length} separate configuration cross-references, ${Object.keys(inventory.hashes).length} source files and 13 guides per locale.`);
