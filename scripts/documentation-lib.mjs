import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import GithubSlugger from 'github-slugger';
import { toString } from 'mdast-util-to-string';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const parser = unified().use(remarkParse).use(remarkGfm);
// Text checksums stay stable across Windows and Linux line endings.
export const sha256 = (text) => createHash('sha256').update(typeof text === 'string' ? text.replaceAll('\r\n', '\n') : text).digest('hex');
export const slash = (value) => value.replaceAll('\\', '/');
export function walk(node, visit) {
  visit(node);
  for (const child of node.children || []) walk(child, visit);
}
export function within(base, relative) {
  const target = path.resolve(base, relative);
  const part = path.relative(base, target);
  if (part.startsWith('..') || path.isAbsolute(part) || !part) throw new Error(`Path outside allowed base: ${relative}`);
  return target;
}
export function validateCatalog(catalog) {
  if (catalog?.defaultLocale !== 'en' || !Array.isArray(catalog.locales) ||
      JSON.stringify([...catalog.locales].sort()) !== JSON.stringify(['en', 'es'])) {
    throw new Error('Expected the en/es locales with en as default.');
  }
  if (!Array.isArray(catalog.pages) || !catalog.pages.length) throw new Error('Expected a nonempty local page catalog.');
  const ids = new Set(), slugs = new Set();
  for (const page of catalog.pages) {
    if (!page || typeof page.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(page.id) || ids.has(page.id)) {
      throw new Error(`Invalid or duplicate page ID: ${page?.id}`);
    }
    ids.add(page.id);
    if (!['doc', 'astro'].includes(page.kind)) throw new Error(`Invalid page kind: ${page.id}`);
    for (const locale of catalog.locales) {
      if (typeof page.title?.[locale] !== 'string' || !page.title[locale].trim()) throw new Error(`Missing ${locale} title: ${page.id}`);
      if (page.label !== undefined && (typeof page.label?.[locale] !== 'string' || !page.label[locale].trim())) {
        throw new Error(`Missing ${locale} navigation label: ${page.id}`);
      }
      const slug = page.slug?.[locale];
      if (typeof slug !== 'string' || !new RegExp(`^/${locale}/[a-z0-9-]+(?:/[a-z0-9-]+)*$`).test(slug) || slugs.has(slug)) {
        throw new Error(`Invalid or duplicate slug: ${slug}`);
      }
      slugs.add(slug);
    }
    // Starlight's native internal sidebar slugs share a path across locales.
    if (page.slug.en.slice(3) !== page.slug.es.slice(3)) throw new Error(`Different localized paths require a sidebar adapter: ${page.id}`);
  }
  return catalog.pages;
}
export function contentPath(slug) {
  return within(path.join(root, 'src/content/docs'), `${slug.slice(1)}.md`);
}
export function stripFrontmatter(text) {
  return text.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, '');
}
export function headingIds(text) {
  const slugger = new GithubSlugger(), ids = new Set(['_top']);
  walk(parser.parse(stripFrontmatter(text)), (node) => {
    if (node.type === 'heading') ids.add(slugger.slug(toString(node)));
    if (node.type === 'html') for (const match of node.value.matchAll(/\bid=["']([^"']+)["']/g)) ids.add(match[1]);
  });
  return ids;
}
export function markdownLinks(text) {
  const nodes = [];
  walk(parser.parse(text), (node) => {
    if (['link', 'image', 'definition'].includes(node.type)) nodes.push(node);
  });
  return nodes;
}
export async function filesUnder(directory) {
  let entries;
  try { entries = await fs.readdir(directory, { withFileTypes: true }); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
  const files = [];
  for (const entry of entries) {
    if (entry.isSymbolicLink()) throw new Error(`Symbolic link in managed directory: ${entry.name}`);
    const full = within(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesUnder(full));
    else files.push(full);
  }
  return files;
}
