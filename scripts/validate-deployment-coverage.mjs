import fs from 'node:fs/promises';
import path from 'node:path';
import { root, contentPath, parser, walk } from './documentation-lib.mjs';
import { navigationSections, sitePages } from '../src/utils/documentation-menu.mjs';

const ids = ['foundation-deployment-and-reference', 'deployment-reverse-proxies', 'http-default-responses', 'deployment-windows-server', 'deployment-linux', 'deployment-docker'];
const section = navigationSections.find((entry) => entry.id === 'deployment');
if (JSON.stringify(section?.pageIds) !== JSON.stringify(ids)
  || JSON.stringify(section.groups?.map((group) => group.id)) !== JSON.stringify(['deployment-preparation', 'deployment-platforms'])) {
  throw new Error('Deployment requires an independent category with preparation and platform groups.');
}
const manifest = JSON.parse(await fs.readFile(path.join(root, 'public/downloads/deployment-source-inventory.json'), 'utf8'));
if (manifest.areas?.length !== 16 || !Object.keys(manifest.hashes || {}).length) throw new Error('Incomplete deployment source inventory.');
for (const [source, hash] of Object.entries(manifest.hashes)) {
  if (!source || !/^[a-f0-9]{64}$/.test(hash)) throw new Error(`Invalid deployment checksum: ${source}`);
}
for (const area of manifest.areas) {
  if (!area.area || !area.sources?.length || area.sources.some((source) => !manifest.hashes[source])) throw new Error('Unmapped deployment area.');
  for (const locale of ['es', 'en']) {
    if (!sitePages.some((page) => ids.includes(page.id) && page.slug[locale] === `/${locale}${area.reference}`)) throw new Error(`Missing deployment source destination: ${area.area}`);
  }
}
for (const id of ['deployment-windows-server', 'deployment-linux', 'deployment-docker']) {
  const page = sitePages.find((entry) => entry.id === id);
  const blocks = [];
  for (const locale of ['es', 'en']) {
    const body = await fs.readFile(contentPath(page.slug[locale]), 'utf8');
    const code = [];
    walk(parser.parse(body), (node) => { if (node.type === 'code' && node.lang !== 'mermaid') code.push([node.lang, node.value]); });
    blocks.push(code);
    for (const required of ['bootstrap.app:app', '--interface asgi', 'TRUSTED_PROXIES', 'ALLOWED_HOSTS', 'reverse_proxy', '/up']) {
      if (!body.includes(required) && !(id === 'deployment-linux' && required === 'reverse_proxy' && body.includes('proxy_pass'))) {
        // JSON array commands in Docker keep the same option as distinct arguments.
        if (id === 'deployment-docker' && required === '--interface asgi' && body.includes('"--interface", "asgi"')) continue;
        throw new Error(`Missing deployment integration ${required}: ${page.slug[locale]}`);
      }
    }
  }
  // Shell comments and diagnostic messages may be translated; executable examples are syntax-checked separately.
  if (blocks[0].length !== blocks[1].length) throw new Error(`Different deployment example counts: ${id}`);
}
console.log(`Deployment coverage valid: six guides per locale, three platform scenarios and ${manifest.areas.length} mapped integration areas.`);
