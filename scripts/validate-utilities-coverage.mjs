import fs from 'node:fs/promises';
import path from 'node:path';
import { root, contentPath, parser, walk, headingIds } from './documentation-lib.mjs';
import { navigationSections, sitePages } from '../src/utils/documentation-menu.mjs';

// This list is deliberately independent of the source snapshot and navigation.
const pages = [
  ['helper-collection', 'Collection', '/utilities/helpers/collection'],
  ['helper-dot-dict', 'DotDict', '/utilities/helpers/dot-dict'],
  ['helper-sentinel', 'Sentinel', '/utilities/helpers/sentinel'],
  ['helper-std-class', 'StdClass', '/utilities/helpers/std-class'],
  ['helper-stringable', 'Stringable', '/utilities/helpers/stringable'],
  ['helper-workers', 'Workers', '/utilities/helpers/workers'],
  ['helper-freeze-thaw', 'FreezeThaw', '/utilities/helpers/freeze-thaw'],
  ['helper-performance-counter', 'PerformanceCounter', '/utilities/helpers/performance-counter'],
  ['metadata-overview', 'Metadata', '/utilities/metadata'],
];
const nativeSources = [
  'orionis/support/types/collection.py', 'orionis/support/types/stringable.py',
  'orionis/support/types/dot_dict.py', 'orionis/support/types/std.py',
  'orionis/support/types/sentinel.py', 'orionis/support/system/workers.py',
  'orionis/support/structures/freezer.py', 'orionis/support/performance/counter.py',
  'orionis/metadata/framework.py',
];
const methodKinds = new Set(['method', 'special-method', 'constructor']);
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const sorted = (items) => [...items].sort();
const helperIds = pages.slice(0, 8).map(([id]) => id);
const utilityIds = pages.map(([id]) => id);
const fail = (message) => { throw new Error(message); };
const section = navigationSections.find((item) => item.id === 'utilities');
const helperGroup = section?.groups?.find((item) => item.id === 'utilities-helpers');
const metadataGroup = section?.groups?.find((item) => item.id === 'utilities-metadata');
if (!section || !same(helperGroup?.pageIds, helperIds)
  || !same(metadataGroup?.pageIds, ['metadata-overview'])
  || helperGroup.title?.en !== 'Helpers' || helperGroup.title?.es !== 'Helpers'
  || metadataGroup.title?.en !== 'Metadata' || metadataGroup.title?.es !== 'Metadata'
  || !same(sorted(sitePages.filter((page) => page.id.startsWith('helper-')).map((page) => page.id)), sorted(helperIds))) {
  fail('Utilities requires exactly eight dedicated Helpers guides and one separate Metadata guide in both locales.');
}
for (const id of utilityIds) {
  if (section.pageIds.filter((item) => item === id).length !== 1
    || navigationSections.filter((item) => item.pageIds.includes(id)).length !== 1) {
    fail(`Utility guide must have exactly one utilities navigation home: ${id}`);
  }
}

const manifest = JSON.parse(await fs.readFile(path.join(root, 'public/downloads/utilities-api-inventory.json'), 'utf8'));
if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.entries)
  || !same(sorted(manifest.nativeSources ?? []), sorted(nativeSources))
  || !manifest.hashes || !manifest.contracts || !manifest.exports
  || !manifest.excludedDeclarations || !manifest.inheritedApi || !manifest.integrations) {
  fail('Incomplete utilities source inventory or incorrect nine-file native scope.');
}
for (const [source, hash] of Object.entries(manifest.hashes)) {
  if (!source || !/^[a-f0-9]{64}$/.test(hash)) fail(`Invalid utilities checksum: ${source}`);
}
const documents = new Map();
for (const [id, title, destination] of pages) {
  const page = sitePages.find((item) => item.id === id);
  if (!page || page.kind !== 'doc') fail(`Missing dedicated utility page: ${id}`);
  const anchorSets = [];
  for (const locale of ['es', 'en']) {
    const slug = `/${locale}${destination}`;
    if (page.slug[locale] !== slug || page.title[locale] !== title
      || page.label?.[locale] !== title) fail(`Incorrect utility catalog title, label or slug: ${id}/${locale}`);
    const bytes = await fs.readFile(contentPath(slug));
    const text = bytes.toString('utf8');
    if (bytes.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf]))
      || text.includes('\r') || !text.endsWith('\n') || text.endsWith('\n\n')) {
      fail(`Utility pages require UTF-8 without BOM, LF and one final newline: ${slug}`);
    }
    if (!text.startsWith(`---\ntitle: "${title}"\n`)
      || !text.includes('\neditUrl: true\n') || !text.includes('\nlastUpdated: false\n')) {
      fail(`Missing utility title/frontmatter: ${slug}`);
    }
    const anchors = [...text.matchAll(/<a\s+id=["']([^"']+)["']\s*><\/a>/g)]
      .map((match) => ({ id: match[1], start: match.index, end: match.index + match[0].length }));
    if (new Set(anchors.map((item) => item.id)).size !== anchors.length) fail(`Duplicate explicit utility anchor: ${slug}`);
    const code = [], majorHeadings = [];
    walk(parser.parse(text), (node) => {
      if (node.type === 'code' && node.lang === 'python') code.push({
        value: node.value, start: node.position.start.offset, end: node.position.end.offset,
      });
      if (node.type === 'heading' && node.depth <= 2) majorHeadings.push(node.position.start.offset);
    });
    documents.set(slug, { text, anchors, code, majorHeadings, ids: headingIds(text) });
    anchorSets.push(sorted(anchors.map((item) => item.id)));
  }
  if (!same(anchorSets[0], anchorSets[1])) fail(`Utility explicit anchors differ between locales: ${id}`);
}

function verifyReference(reference, expectedPageId) {
  if (typeof reference !== 'string') fail('Missing utilities documentation reference.');
  const [destination, anchor, extra] = reference.split('#');
  if (extra !== undefined) fail(`Malformed utilities reference: ${reference}`);
  const expected = pages.find(([id, , slug]) => slug === destination && (!expectedPageId || id === expectedPageId));
  if (!expected) fail(`Utility declaration maps outside its dedicated guide: ${reference}`);
  for (const locale of ['es', 'en']) {
    const slug = `/${locale}${destination}`;
    const doc = documents.get(slug);
    if (!doc || (anchor && !doc.anchors.some((item) => item.id === anchor))) {
      fail(`Missing explicit utilities source anchor: ${slug}#${anchor ?? ''}`);
    }
  }
}

const identities = new Set();
for (const item of [...manifest.entries, ...manifest.contracts]) {
  const identity = `${item.source}:${item.symbol}`;
  if (identities.has(identity) || !item.signature || !item.kind
    || !manifest.hashes[item.source] || !Number.isInteger(item.line) || item.line < 1) {
    fail(`Invalid or duplicate utilities declaration: ${identity}`);
  }
  identities.add(identity);
  if (manifest.entries.includes(item) && !nativeSources.includes(item.source)) {
    fail(`Auxiliary declaration counted as native utility API: ${identity}`);
  }
  if ((methodKinds.has(item.kind) || item.kind === 'contract-method'
    || item.kind === 'class-attribute' || item.kind === 'exported-marker'
    || item.kind === 'metadata-constant') && !item.reference.includes('#')) {
    fail(`Utility functional declaration needs an explicit anchor: ${identity}`);
  }
  verifyReference(item.reference, item.pageId);
}
for (const item of manifest.integrations) {
  if (!manifest.hashes[item.source] || !item.purpose || !item.references?.length) {
    fail(`Incomplete reviewed utilities integration: ${item.source}`);
  }
  for (const reference of item.references) verifyReference(reference);
}
for (const item of manifest.inheritedApi) {
  verifyReference(item.reference);
  if (item.copyAndSerializationReference) verifyReference(item.copyAndSerializationReference);
}
for (const item of manifest.excludedDeclarations) {
  if (!manifest.hashes[item.source] || !item.reason || !item.signature
    || !item.symbol.split('.').at(-1).startsWith('_')) {
    fail(`Missing explicit private helper exclusion: ${item.source}:${item.symbol}`);
  }
}
for (const [source, item] of Object.entries(manifest.exports)) {
  if (!manifest.hashes[source] || !Array.isArray(item.names)
    || !same(sorted(item.names), sorted(Object.keys(item.destinations)))) {
    fail(`Invalid reviewed curated exports: ${source}`);
  }
}

const methods = manifest.entries.filter((item) => methodKinds.has(item.kind));
const publicMethods = methods.filter((item) => item.kind === 'method');
const dunders = methods.filter((item) => item.kind !== 'method');
const countKind = (kind) => manifest.entries.filter((item) => item.kind === kind).length;
const expectedCounts = {
  mappedNativeDeclarations: manifest.entries.length,
  publicClasses: countKind('class'), sentinelImplementationClasses: countKind('implementation-class'),
  ownMethods: methods.length, publicMethods: publicMethods.length, implementedDunders: dunders.length,
  publicClassAttributes: countKind('class-attribute'), exportedMarkers: countKind('exported-marker'),
  metadataConstants: countKind('metadata-constant'), contractDeclarations: manifest.contracts.length,
  privateHelpersExcluded: manifest.excludedDeclarations.length,
  nativeTestFiles: manifest.nativeTests?.files?.length,
  declaredNativeTestMethods: manifest.nativeTests?.files?.reduce((total, item) => total + item.declaredTestMethods, 0),
};
if (!same(manifest.counts, expectedCounts) || expectedCounts.publicClasses !== 7
  || expectedCounts.sentinelImplementationClasses !== 1 || expectedCounts.metadataConstants !== 10
  || expectedCounts.exportedMarkers !== 1 || expectedCounts.publicClassAttributes !== 1) {
  fail('Utilities snapshot counts do not match its native declarations, contracts or native test scope.');
}
for (const [owner, item] of Object.entries(manifest.perClass ?? {})) {
  const declared = methods.filter((method) => method.symbol.startsWith(`${owner}.`));
  if (declared.length !== item.totalOwnMethods
    || declared.filter((method) => method.kind === 'method').length !== item.publicMethods
    || declared.filter((method) => method.kind !== 'method').length !== item.implementedDunders) {
    fail(`Utilities per-class method count drift: ${owner}`);
  }
}
for (const item of manifest.nativeTests.files) {
  if (!manifest.hashes[item.source] || !Number.isInteger(item.declaredTestMethods)
    || item.declaredTestMethods < 1) fail(`Invalid exact native test source: ${item.source}`);
}

// Collection shares bounded blocks across adjacent related entries. Stringable
// has one block per entry. Bounds include the complete example, not only its start.
const exampleLimits = {
  Collection: { anchors: 6, chars: 3000 },
  Stringable: { anchors: 0, chars: 1500 },
};
function demonstrates(code, owner, name) {
  const text = code.replace(/^\s*#.*$/gm, '');
  if (!new RegExp(`\\b${owner}\\b`).test(text)) return false;
  if (!name.startsWith('__')) return new RegExp(`\\.\\s*${name}\\s*\\(`).test(text);
  const protocols = {
    __init__: /\bCollection\s*\(/,
    __hash__: /\bhash\s*\(/,
    __iter__: /\b(?:iter|list)\s*\(/,
    __len__: /\blen\s*\(/,
    __getitem__: /\b\w+\s*\[[^\]\n]+\]/,
    __setitem__: /\b\w+\s*\[[^\]\n]+\]\s*=(?!=)/,
    __delitem__: /\bdel\s+\w+\s*\[/,
    __eq__: /==/, __ne__: /!=/, __lt__: /<(?![=>])/, __le__: /<=/,
    __gt__: />(?!=)/, __ge__: />=/, __str__: /\bstr\s*\(/,
  };
  return protocols[name]?.test(text) ?? false;
}
let demonstratedMethods = 0;
for (const item of methods) {
  const [owner, name] = item.symbol.split('.');
  const limit = exampleLimits[owner];
  if (!limit) continue;
  const [destination, anchorId] = item.reference.split('#');
  for (const locale of ['es', 'en']) {
    const slug = `/${locale}${destination}`;
    const doc = documents.get(slug);
    const anchor = doc.anchors.find((candidate) => candidate.id === anchorId);
    const block = doc.code.find((candidate) => candidate.start >= anchor.end);
    const intervening = block ? doc.anchors.filter((candidate) => candidate.id.startsWith(`${owner.toLowerCase()}-method-`)
      && candidate.start > anchor.start && candidate.start < block.start).length : Infinity;
    const crossedSection = block && doc.majorHeadings.some((offset) => offset > anchor.end && offset < block.start);
    if (!block || block.end - anchor.start > limit.chars || intervening > limit.anchors
      || crossedSection || !demonstrates(block.value, owner, name)) {
      fail(`Missing bounded Python example demonstrating ${item.symbol}: ${slug}#${anchorId}`);
    }
  }
  demonstratedMethods += 1;
}
console.log(
  `Utilities coverage valid: ${methods.length} own methods (${publicMethods.length} public + ${dunders.length} dunders), `
  + `${expectedCounts.metadataConstants} metadata constants, ${Object.keys(manifest.hashes).length} hashed sources; `
  + `${demonstratedMethods} Collection/Stringable methods have bounded Python examples in both locales. `
  + 'Eight Helpers guides and one Metadata guide verified; contracts and inherited stdlib API count separately.',
);
