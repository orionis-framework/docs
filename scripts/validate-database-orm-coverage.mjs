import fs from 'node:fs/promises';
import path from 'node:path';
import { root, headingIds } from './documentation-lib.mjs';

// The published inventory is also the artifact users can download from the
// reference guide. Ordinary builds never require the framework checkout.
const file = path.join(root, 'public/downloads/database-orm-api-inventory.json');
const inventory = JSON.parse(await fs.readFile(file, 'utf8'));
const errors = [], cache = new Map(), seen = new Set();
const mapped = inventory.declarations.filter((entry) => !entry.mapping.startsWith('excluded-'));
const excluded = inventory.declarations.filter((entry) => entry.mapping.startsWith('excluded-'));
const declarationKeys = new Set(inventory.declarations.map((entry) => `${entry.source}:${entry.symbol}`));
for (const entry of inventory.supplemental) if (declarationKeys.has(`${entry.source}:${entry.symbol}`)) errors.push(`Supplement duplicates a source declaration: ${entry.source}:${entry.symbol}`);
if (inventory.schemaVersion !== 1 || !mapped.length || inventory.pending.length) errors.push('Incomplete API inventory.');
for (const entry of excluded) if (!entry.reason) errors.push(`Unjustified exclusion: ${entry.source}:${entry.symbol}`);

for (const [scope, entries] of [['declaration', mapped], ['supplement', inventory.supplemental], ['provider', inventory.fakerProviders]]) {
  for (const entry of entries) {
    const key = `${scope}:${entry.source}:${entry.symbol || entry.name}`;
    if (seen.has(key)) errors.push(`Duplicate inventory entry: ${key}`);
    seen.add(key);
    for (const locale of ['es', 'en']) {
      const url = entry.docs?.[locale];
      if (typeof url !== 'string' || !url.startsWith(`/${locale}/`)) { errors.push(`Missing localized reference: ${key}:${locale}`); continue; }
      const [route, anchor] = url.split('#');
      const relative = `${route.slice(1)}.md`;
      if (!/^(es|en)\/(?:database|orm|faker)(?:\/[a-z0-9-]+)*\.md$/.test(relative) || !anchor) { errors.push(`Invalid documentation destination: ${url}`); continue; }
      if (!cache.has(relative)) {
        try { cache.set(relative, headingIds(await fs.readFile(path.join(root, 'src/content/docs', relative), 'utf8'))); }
        catch (error) { errors.push(`Missing documentation file: ${relative}`); cache.set(relative, new Set()); }
      }
      if (!cache.get(relative).has(anchor)) errors.push(`Missing documentation anchor: ${key} -> ${url}`);
    }
  }
}
const typed = inventory.fakerProviders.filter((entry) => entry.kind === 'provider method');
const cli = inventory.supplemental.filter((entry) => entry.kind === 'CLI command');
const expectedCommands = ['db:seed', 'db:show', 'db:table', 'db:wipe', 'make:database-migration', 'make:database-schema', 'make:database-seeder', 'make:factory', 'migrate', 'migrate:fresh', 'migrate:refresh', 'migrate:reset', 'migrate:rollback', 'migrate:status'];
if (JSON.stringify(cli.map((entry) => entry.symbol).sort()) !== JSON.stringify(expectedCommands.sort()) || cli.length !== inventory.statistics.databaseCliCommands) errors.push('The Database CLI reference must cover all 14 audited commands.');
if (typed.length !== inventory.statistics.typedFakerProviders) errors.push('Provider count differs from the audited source.');
if (inventory.declarations.length !== inventory.statistics.lexicalDeclarations || mapped.length !== inventory.statistics.mappedDeclarations) errors.push('Declaration counts differ from the inventory.');
if (inventory.statistics.additionalApiEntries !== inventory.supplemental.length ||
    inventory.statistics.justifiedInternalExclusions !== excluded.length ||
    inventory.statistics.dynamicFakerHelpers !== inventory.fakerProviders.length - typed.length ||
    inventory.statistics.auditedSourceFiles !== Object.keys(inventory.sourceFiles).length) errors.push('Supplement, exclusion, helper or source-file counts differ from the inventory.');
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log(`Database/ORM coverage valid: ${mapped.length} mapped source declarations, ${excluded.length} justified internal exclusions, ${inventory.supplemental.length} additional API/configuration entries, ${typed.length} typed Faker providers and ${inventory.fakerProviders.length - typed.length} runtime helpers; ${cache.size} localized reference pages.`);
