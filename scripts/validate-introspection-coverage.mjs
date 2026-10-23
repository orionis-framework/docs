import fs from 'node:fs/promises';
import path from 'node:path';
import { root, contentPath, parser, walk, headingIds } from './documentation-lib.mjs';
import { navigationSections, sitePages } from '../src/utils/documentation-menu.mjs';

// Independent of the inventory: a missing guide cannot silently shrink scope.
const pages = [
  ['introspection-overview', '/utilities/introspection'],
  ['introspection-reflection', '/utilities/introspection/reflection'],
  ['introspection-callables', '/utilities/introspection/callables'],
  ['introspection-abstract-classes', '/utilities/introspection/abstract-classes'],
  ['introspection-concrete-classes', '/utilities/introspection/concrete-classes'],
  ['introspection-instances', '/utilities/introspection/instances'],
  ['introspection-dependencies-and-discovery', '/utilities/introspection/dependencies-and-discovery'],
  ['introspection-modules', '/utilities/introspection/modules'],
  ['introspection-module-discovery', '/utilities/introspection/module-discovery'],
];
const classMethods = {
  Reflection: 31, ReflectionCallable: 15, ReflectionAbstract: 66,
  ReflectionConcrete: 69, ReflectionInstance: 71, ReflectDependencies: 4,
  Signature: 13, Argument: 1, ReflectionModule: 33, ModuleInspector: 4,
};
const methodKinds = new Set(['method', 'special-method', 'constructor']);
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const sorted = (items) => [...items].sort();
const fail = (message) => { throw new Error(message); };
const expectedIds = pages.map(([id]) => id);
const section = navigationSections.find((item) => item.id === 'utilities');
const group = section?.groups?.find((item) => item.id === 'utilities-introspection');
if (!section || !same(group?.pageIds, expectedIds)
  || !same(sorted(sitePages.filter((page) => page.id.startsWith('introspection-')).map((page) => page.id)), sorted(expectedIds))) {
  fail('Introspection requires nine dedicated guides, in order, in the utilities-introspection navigation group.');
}
for (const id of expectedIds) {
  if (section.pageIds.filter((item) => item === id).length !== 1
    || navigationSections.filter((item) => item.pageIds.includes(id)).length !== 1) {
    fail(`Introspection guide requires exactly one utilities navigation home: ${id}`);
  }
}

const manifest = JSON.parse(await fs.readFile(path.join(root, 'public/downloads/introspection-api-inventory.json'), 'utf8'));
if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.entries)
  || !Array.isArray(manifest.nativeSources) || manifest.nativeSources.length !== 30
  || new Set(manifest.nativeSources).size !== 30
  || manifest.nativeSources.some((source) => !source.startsWith('orionis/introspection/') || !source.endsWith('.py'))
  || !manifest.hashes || !manifest.contracts || !manifest.exports
  || !manifest.excludedDeclarations || !manifest.inheritedApi || !manifest.generatedApi
  || !manifest.packagePlumbing || !manifest.integrations) {
  fail('Incomplete introspection inventory or incorrect native package scope.');
}
for (const [source, hash] of Object.entries(manifest.hashes)) {
  if (!source || !/^[a-f0-9]{64}$/.test(hash)) fail(`Invalid introspection checksum: ${source}`);
}
if (manifest.nativeSources.some((source) => !manifest.hashes[source])) {
  fail('Every native introspection Python source must be hashed, including package initializers and contracts.');
}

const documents = new Map();
for (const [id, destination] of pages) {
  const page = sitePages.find((item) => item.id === id);
  if (!page || page.kind !== 'doc') fail(`Missing dedicated introspection page: ${id}`);
  const anchorSets = [];
  for (const locale of ['es', 'en']) {
    const slug = `/${locale}${destination}`;
    if (page.slug[locale] !== slug) fail(`Incorrect introspection catalog slug: ${id}/${locale}`);
    const bytes = await fs.readFile(contentPath(slug));
    const text = bytes.toString('utf8');
    if (bytes.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf]))
      || text.includes('\r') || !text.endsWith('\n') || text.endsWith('\n\n')) {
      fail(`Introspection guides require UTF-8 without BOM, LF and one final newline: ${slug}`);
    }
    if (!text.startsWith(`---\ntitle: "${page.title[locale]}"\n`)
      || !text.includes('\neditUrl: true\n') || !text.includes('\nlastUpdated: false\n')) {
      fail(`Introspection frontmatter must match its localized catalog title: ${slug}`);
    }
    const anchors = [...text.matchAll(/<a\s+id=["']([^"']+)["']\s*><\/a>/g)]
      .map((match) => ({ id: match[1], start: match.index, end: match.index + match[0].length }));
    if (new Set(anchors.map((item) => item.id)).size !== anchors.length) fail(`Duplicate explicit introspection anchor: ${slug}`);
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
  if (!same(anchorSets[0], anchorSets[1])) fail(`Introspection explicit anchors differ between locales: ${id}`);
}

function verifyReference(reference, expectedPageId) {
  if (typeof reference !== 'string') fail('Missing introspection documentation reference.');
  const [destination, anchor, extra] = reference.split('#');
  if (extra !== undefined) fail(`Malformed introspection reference: ${reference}`);
  const expected = pages.find(([id, slug]) => slug === destination && (!expectedPageId || id === expectedPageId));
  if (!expected) fail(`Introspection declaration maps outside its dedicated guide: ${reference}`);
  for (const locale of ['es', 'en']) {
    const slug = `/${locale}${destination}`;
    const doc = documents.get(slug);
    if (!doc || (anchor && !doc.anchors.some((item) => item.id === anchor))) {
      fail(`Missing explicit introspection source anchor: ${slug}#${anchor ?? ''}`);
    }
  }
}

const identities = new Set();
for (const item of [...manifest.entries, ...manifest.contracts]) {
  const identity = `${item.source}:${item.symbol}`;
  if (identities.has(identity) || !item.signature || !item.kind
    || !manifest.hashes[item.source] || !Number.isInteger(item.line) || item.line < 1) {
    fail(`Invalid or duplicate introspection declaration: ${identity}`);
  }
  identities.add(identity);
  if (!manifest.nativeSources.includes(item.source)) fail(`Auxiliary declaration counted as native introspection API: ${identity}`);
  if ((methodKinds.has(item.kind) || item.kind === 'contract-method' || item.kind === 'field')
    && !item.reference.includes('#')) fail(`Functional introspection declaration needs an explicit anchor: ${identity}`);
  verifyReference(item.reference, item.pageId);
}
for (const item of manifest.integrations) {
  if (!manifest.hashes[item.source] || !item.purpose || !item.references?.length
    || !Array.isArray(item.reviewedSymbols)) fail(`Incomplete reviewed introspection integration: ${item.source}`);
  for (const reference of item.references) verifyReference(reference);
}
for (const item of [...manifest.inheritedApi, ...manifest.generatedApi]) {
  if (!item.owner || !item.methods?.length || !item.note) fail('Incomplete generated/inherited introspection API mapping.');
  verifyReference(item.reference);
}
for (const item of manifest.excludedDeclarations) {
  if (!manifest.hashes[item.source] || !item.reason || !item.signature
    || !item.symbol.split('.').at(-1).startsWith('_')) {
    fail(`Missing explicit private introspection exclusion: ${item.source}:${item.symbol}`);
  }
}
for (const item of manifest.packagePlumbing) {
  if (!manifest.hashes[item.source] || !item.reason || !item.signature
    || !['__getattr__', '__dir__'].includes(item.symbol)) fail('Unreviewed introspection export plumbing.');
  verifyReference(item.reference);
}
for (const [source, item] of Object.entries(manifest.exports)) {
  if (!manifest.hashes[source] || !Array.isArray(item.names)
    || !same(sorted(item.names), sorted(Object.keys(item.destinations)))) {
    fail(`Invalid reviewed introspection package exports: ${source}`);
  }
}

const methods = manifest.entries.filter((item) => methodKinds.has(item.kind));
const countKind = (kind) => manifest.entries.filter((item) => item.kind === kind).length;
const expectedCounts = {
  mappedNativeDeclarations: manifest.entries.length,
  publicClasses: countKind('class'), ownMethods: methods.length,
  publicMethods: countKind('method'), implementedDunders: countKind('special-method') + countKind('constructor'),
  entityFields: countKind('field'), nativePythonSources: manifest.nativeSources.length,
  contractClasses: manifest.contracts.filter((item) => item.kind === 'contract-class').length,
  contractMethods: manifest.contracts.filter((item) => item.kind === 'contract-method').length,
  privateDeclarationsExcluded: manifest.excludedDeclarations.length,
  packageHooksSeparate: manifest.packagePlumbing.length,
  nativeTestFiles: manifest.nativeTests?.files?.length,
  declaredNativeTestMethods: manifest.nativeTests?.files?.reduce((total, item) => total + item.declaredTestMethods, 0),
};
if (!same(manifest.counts, expectedCounts)
  || expectedCounts.publicClasses !== 10 || expectedCounts.ownMethods !== 307
  || expectedCounts.entityFields !== 12 || expectedCounts.contractClasses !== 6
  || expectedCounts.contractMethods !== 231 || expectedCounts.nativeTestFiles !== 17
  || expectedCounts.declaredNativeTestMethods !== 1022
  || !same(sorted(Object.keys(manifest.perClass)), sorted(Object.keys(classMethods)))) {
  fail('Introspection snapshot counts do not match the reviewed native package, contracts or exact test scope.');
}
for (const [owner, expected] of Object.entries(classMethods)) {
  const declared = methods.filter((method) => method.symbol.startsWith(`${owner}.`));
  const item = manifest.perClass[owner];
  if (declared.length !== expected || declared.length !== item.totalOwnMethods
    || declared.filter((method) => method.kind === 'method').length !== item.publicMethods
    || declared.filter((method) => method.kind !== 'method').length !== item.implementedDunders) {
    fail(`Introspection per-class method count drift: ${owner}`);
  }
}
for (const item of manifest.nativeTests.files) {
  if (!manifest.hashes[item.source] || !item.source.startsWith('tests/introspection/')
    || !Number.isInteger(item.declaredTestMethods) || item.declaredTestMethods < 1) {
    fail(`Invalid exact native introspection test source: ${item.source}`);
  }
}

function demonstrates(value, owner, name) {
  const code = value.replace(/^\s*#.*$/gm, '');
  if (!name.startsWith('__')) return new RegExp(`\\.\\s*${name}\\s*\\(`).test(code);
  if (name === '__init__' || name === '__post_init__') return new RegExp(`\\b${owner}\\s*\\(`).test(code);
  const protocols = {
    __getitem__: /\b\w+\s*\[[^\]\n]+\]/,
    __setitem__: /\b\w+\s*\[[^\]\n]+\]\s*=(?!=)/,
    __delitem__: /\bdel\s+\w+\s*\[/,
    __contains__: /\bin\s+\w+/,
  };
  return protocols[name]?.test(code) ?? false;
}

// Neighboring entries may share a complete example, but it must call the actual
// method/protocol. Signature-only Python stubs do not satisfy this requirement.
let demonstratedMethods = 0;
for (const item of methods) {
  const [owner, name] = item.symbol.split('.');
  const [destination, anchorId] = item.reference.split('#');
  for (const locale of ['es', 'en']) {
    const slug = `/${locale}${destination}`;
    const doc = documents.get(slug);
    const target = doc.anchors.find((candidate) => candidate.id === anchorId);
    const block = doc.code.find((candidate) => {
      if (candidate.start < target.end || candidate.end - target.start > 8000) return false;
      const intervening = doc.anchors.filter((anchor) => anchor.start > target.start && anchor.start < candidate.start).length;
      const crossedSection = doc.majorHeadings.some((offset) => offset > target.end && offset < candidate.start);
      return intervening <= 40 && !crossedSection && demonstrates(candidate.value, owner, name);
    });
    if (!block) fail(`Missing bounded Python example calling ${item.symbol}: ${slug}#${anchorId}`);
  }
  demonstratedMethods += 1;
}
console.log(
  `Introspection coverage valid: ${methods.length} own methods (${expectedCounts.publicMethods} public + `
  + `${expectedCounts.implementedDunders} dunders), ${expectedCounts.entityFields} fields, `
  + `${expectedCounts.publicClasses} classes and ${expectedCounts.contractMethods} separate contract methods; `
  + `${demonstratedMethods} method/protocol examples in both locales. `
  + `Nine guides, ${manifest.nativeSources.length} native modules and ${Object.keys(manifest.hashes).length} checksums verified.`,
);
