#!/usr/bin/env node
/**
 * generate-llms-txt.js - write llms.txt and llms-full.txt into the built docs site.
 *
 * llms.txt (https://llmstxt.org/) is the standard entry point LLM tools look for:
 * a title, a one-paragraph summary, then sections of links with a short note each.
 * Here: the machine-readable files first (schemas, registries, the config checker),
 * then every docs page by section; architecture and development pages go under
 * "Optional" (the convention for links a tool may skip). Release notes are left out.
 *
 * llms-full.txt is the user docs in one file (getting started, configuration,
 * cards, core), as markdown with frontmatter and Vue components removed.
 *
 * URLs carry the channel's base (DOCS_BASE), so /dev/ and /v/<version>/ builds get
 * their own copies pointing at their own pages.
 *
 *   node scripts/generate-llms-txt.js [--dist=doc/.vitepress/dist]   (inside docs:build)
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildLlmsTxt, buildLlmsFull } from './lib/llms-txt.js';

export * from './lib/llms-txt.js';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const DOC = join(ROOT, 'doc');

function main() {
  const distArg = process.argv.slice(2).find(a => a.startsWith('--dist='));
  const dist = distArg ? resolve(distArg.slice('--dist='.length)) : join(DOC, '.vitepress/dist');
  if (!existsSync(join(dist, 'index.html'))) {
    console.error(`${dist} is not a built docs site: run vitepress build first.`);
    process.exit(2);
  }
  const base = process.env.DOCS_BASE ?? '/';
  const { version } = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  const txt = buildLlmsTxt({ base, version });
  const full = buildLlmsFull({ base, version });
  writeFileSync(join(dist, 'llms.txt'), txt + '\n');
  writeFileSync(join(dist, 'llms-full.txt'), full + '\n');
  const kb = (s) => (Buffer.byteLength(s) / 1024).toFixed(0);
  console.log(`✅ Wrote llms.txt (${kb(txt)} KB) and llms-full.txt (${kb(full)} KB) for ${base}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
