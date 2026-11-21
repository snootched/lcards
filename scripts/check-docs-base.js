#!/usr/bin/env node
/**
 * check-docs-base.js - fail when a docs build for /dev/ or /v/<version>/ links
 * outside its own folder.
 *
 * Each docs channel is built with its own `base` (DOCS_BASE, see
 * doc/.vitepress/config.mts). VitePress rewrites its own links, but a hardcoded
 * root-absolute path ("/credits", "/releases/x.webp", "/lcards/lcards.js") would
 * silently load the stable root's copy instead of the channel's. This scans the
 * built HTML for root-absolute src/href/poster/action values that don't start
 * with the base. A root build (base "/") has nothing to check.
 *
 *   DOCS_BASE=/dev/ node scripts/check-docs-base.js [--dist=doc/.vitepress/dist]
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * @param {string} html
 * @param {string} base - e.g. '/dev/'
 * @returns {string[]} root-absolute URLs outside the base
 */
export function escapes(html, base) {
  if (base === '/') return [];
  const out = [];
  for (const m of html.matchAll(/\b(?:src|href|poster|action)=["'](\/(?!\/)[^"']*)["']/g)) {
    if (!m[1].startsWith(base)) out.push(m[1]);
  }
  return out;
}

function htmlFiles(dir, out = []) {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) htmlFiles(p, out);
    else if (ent.name.endsWith('.html')) out.push(p);
  }
  return out;
}

function main() {
  const base = process.env.DOCS_BASE ?? '/';
  const distArg = process.argv.slice(2).find(a => a.startsWith('--dist='));
  const dist = distArg ? resolve(distArg.slice('--dist='.length)) : join(ROOT, 'doc/.vitepress/dist');
  if (base === '/') {
    console.log('Docs base OK: root build, nothing to check.');
    return;
  }
  const problems = [];
  const files = htmlFiles(dist);
  for (const file of files) {
    for (const url of new Set(escapes(readFileSync(file, 'utf8'), base))) problems.push(`${relative(ROOT, file)}: ${url}`);
  }
  if (problems.length) {
    console.error(`${problems.length} link(s) escape the docs base ${base}:`);
    for (const p of problems.slice(0, 50)) console.error(`  ${p}`);
    if (problems.length > 50) console.error(`  ... and ${problems.length - 50} more`);
    console.error('\nUse withBase() in components, or a relative/markdown link in pages.');
    process.exit(1);
  }
  console.log(`Docs base OK: ${files.length} pages, every root-absolute link stays under ${base}.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
