import fs from 'node:fs/promises';
import path from 'node:path';
import { root, contentPath, headingIds } from './documentation-lib.mjs';
import { sitePages, navigationSections } from '../src/utils/documentation-menu.mjs';

const inventory = JSON.parse(await fs.readFile(path.join(root, 'public/downloads/console-api-inventory.json'), 'utf8'));
const expectedPages = [
  'console-overview', 'console-creating-commands', 'console-commands-and-arguments', 'console-command-routing',
  'console-console-output', 'console-interactive-input', 'console-progress-and-debugging',
  'console-output-and-programmatic-execution', 'console-command-cache', 'console-api-reference',
  'console-task-scheduling', 'console-scheduler-configuration', 'console-scheduler-frequencies', 'console-scheduler-listeners', 'console-scheduler-execution',
  'console-built-in-commands', 'console-built-in-generators', 'console-built-in-application', 'console-built-in-database', 'console-built-in-workers', 'console-built-in-bootstrap',
];
const section = navigationSections.find((entry) => entry.id === 'console');
if (JSON.stringify(section?.pageIds) !== JSON.stringify(expectedPages) || section?.groups?.length !== 5) throw new Error('Console must retain 21 guides in five ordered groups, including task scheduling.');
if (!inventory.entries?.length || !inventory.exclusions?.length || inventory.commands?.length !== 67 || !inventory.hashes) throw new Error('Incomplete Console API, editorial exclusions or command inventory.');
const symbols = new Set(), documents = new Map();
async function checkReference(reference, identity) {
  const [destination, anchor] = reference.split('#');
  for (const locale of ['es', 'en']) {
    const slug = `/${locale}${destination}`;
    if (!anchor || !sitePages.some((page) => page.slug[locale] === slug)) throw new Error(`Unknown Console destination: ${slug} (${identity})`);
    if (!documents.has(slug)) documents.set(slug, headingIds(await fs.readFile(contentPath(slug), 'utf8')));
    if (!documents.get(slug).has(anchor)) throw new Error(`Missing Console anchor: ${slug}#${anchor} (${identity})`);
  }
}
for (const entry of inventory.entries) {
  const identity = `${entry.source}:${entry.symbol}`;
  if (symbols.has(identity) || !entry.signature || !Number.isInteger(entry.line) || entry.line < 1) throw new Error(`Invalid or duplicate Console declaration: ${identity}`);
  if (!/^[a-f0-9]{64}$/.test(inventory.hashes[entry.source] || '')) throw new Error(`Missing Console source checksum: ${identity}`);
  symbols.add(identity);
  await checkReference(entry.reference, identity);
}
const omittedClasses = new Set(['VarDumper', 'IVarDumper', 'Dumper', 'IDumper', 'HTTPRequestPrinter', 'IHTTPRequestPrinter']);
for (const entry of inventory.exclusions) {
  const identity = `${entry.source}:${entry.symbol}`;
  const owner = entry.symbol.split('.')[0];
  const requestedOmission = omittedClasses.has(owner) || ['Argument.addToParser', 'Argument.extra', 'Console.dump', 'IConsole.dump'].includes(entry.symbol);
  if (symbols.has(identity) || !requestedOmission || !entry.reason || !entry.signature || entry.reference || !Number.isInteger(entry.line) || entry.line < 1) throw new Error(`Invalid Console editorial exclusion: ${identity}`);
  if (!/^[a-f0-9]{64}$/.test(inventory.hashes[entry.source] || '')) throw new Error(`Missing excluded Console source checksum: ${identity}`);
  symbols.add(identity);
}
const commands = new Set();
for (const command of inventory.commands) {
  if (commands.has(command.signature) || !command.class || !Array.isArray(command.arguments)) throw new Error(`Invalid command declaration: ${command.signature}`);
  commands.add(command.signature);
  for (const arg of command.arguments) if (!Array.isArray(arg.name_or_flags?.tuple) || !arg.name_or_flags.tuple.length) throw new Error(`Incomplete command arguments: ${command.signature}`);
  await checkReference(command.reference, command.signature);
}
console.log(`Console coverage valid: ${inventory.entries.length} documented declarations, ${inventory.exclusions.length} intentional omissions, ${inventory.commands.length} native commands, ${Object.keys(inventory.hashes).length} source files and 21 guides per locale.`);
