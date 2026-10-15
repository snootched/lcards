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
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, relative, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DOC = join(ROOT, 'doc');
const SITE_ROOT = 'https://lcards.unimatrix01.ca';

/** Docs sections in reading order: [folder, heading, in llms-full.txt?]. */
export const SECTIONS = [
  ['getting-started', 'Getting started', true],
  ['configuration', 'Configuration', true],
  ['cards', 'Cards', true],
  ['core', 'Core features', true],
  ['architecture', 'Architecture', false],
  ['development', 'Development', false],
];

function mdFiles(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const ent of readdirSync(dir, { withFileTypes: true }).sort((a, b) => sortKey(a.name).localeCompare(sortKey(b.name)))) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) mdFiles(p, out);
    else if (ent.name.endsWith('.md')) out.push(p);
  }
  return out;
}
// index.md first within a folder.
const sortKey = (name) => (name === 'index.md' ? '' : name);

/** Site URL of a docs page, e.g. cards/button/index.md -> <site>/<base>cards/button/ */
export function pageUrl(rel, base = '/') {
  const path = rel.replace(/\\/g, '/').replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '.html');
  return `${SITE_ROOT}${base}${path}`;
}

/** Strip frontmatter, Vue components and heading anchors; keep the markdown. */
export function cleanMarkdown(text) {
  return text
    .replace(/^---\n[\s\S]*?\n---\n/, '')
    // VitePress file includes (<<< @/path) become the file's content.
    .replace(/^<<< @\/(\S+)[ \t]*$/gm, (line, rel) => {
      const file = join(DOC, rel);
      if (!existsSync(file)) return line;
      const lang = rel.split('.').pop() === 'yml' ? 'yaml' : rel.split('.').pop();
      return '```' + lang + '\n' + readFileSync(file, 'utf8').trimEnd() + '\n```';
    })
    .replace(/^[ \t]*<[A-Z][A-Za-z]+\b[^>]*\/>[ \t]*$/gm, '')
    .replace(/^(#{1,6} .*?)[ \t]*\{#[^}]+\}[ \t]*$/gm, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Title (first # heading) and a one-line summary (first plain paragraph). */
export function pageInfo(text) {
  const body = cleanMarkdown(text);
  const fm = /^---\n([\s\S]*?)\n---/.exec(text)?.[1] ?? '';
  const fmDescription = /^description:\s*["']?(.+?)["']?\s*$/m.exec(fm)?.[1];
  const title = /^# (.+)$/m.exec(body)?.[1]?.replace(/`/g, '').trim() ?? 'Untitled';
  const afterTitle = body.slice(body.search(/^# .+$/m) + 1).split('\n').slice(1).join('\n')
    // Callout boxes (::: tip ... :::) are asides, not the page's summary.
    .replace(/^:::[^\n]*\n[\s\S]*?^:::\s*$/gm, '');
  let summary = fmDescription;
  if (!summary) {
    for (const block of afterTitle.split(/\n\s*\n/)) {
      const b = block.trim();
      if (!b || /^(#|:::|```|!\[|\||<|-{3}|\* |- |\d+\. )/.test(b)) continue;
      // A bare type name (`custom:lcards-button`) or a short label isn't a summary.
      if (/^`[^`]+`$/.test(b) || b.replace(/[*_`[\]()]/g, '').length < 30) continue;
      summary = b.replace(/^>\s*/gm, '');
      break;
    }
  }
  summary = (summary ?? '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (summary.length > 200) summary = summary.slice(0, 197).replace(/\s+\S*$/, '') + '...';
  return { title, summary };
}

export function buildLlmsTxt({ base = '/', version }) {
  const lines = [
    '# LCARdS',
    '',
    '> LCARdS is a Star Trek LCARS-style card system for Home Assistant: custom Lovelace cards (button, elbow, slider, chart, data grid, select menu, layout card, alert overlay, MSD ship displays), a layout view and a shell dashboard strategy, configured in YAML, with themes, rules, data sources, animations, sounds and an alert mode.',
    '',
    `These docs describe LCARdS ${version}. When writing LCARdS YAML, use only keys from the JSON Schemas below (do not invent keys), then check the result with the config checker. Every LCARdS card type is written as \`type: custom:<name>\` (for example \`custom:lcards-button\`).`,
    '',
    '## Machine-readable',
    '',
    `- [Schema index](${SITE_ROOT}${base}schema/index.json): one JSON Schema per card, view and strategy, the shared files each uses, and their sizes; load only the card you need`,
    `- [Full schema bundle](${SITE_ROOT}${base}lcards-schema.json): every schema in one file (about 470 KB)`,
    `- [Built-in names](${SITE_ROOT}${base}schema/registries.json): presets, components, animation and background presets, filters, sound assets, MSD backgrounds and theme tokens that values must match`,
    `- [Config checker](${SITE_ROOT}${base}tools/lcards-validate.mjs): \`node lcards-validate.mjs dashboard.yaml\` checks a card, view or whole dashboard (Node 20+, one file)`,
    `- [All user docs in one file](${SITE_ROOT}${base}llms-full.txt): getting started, configuration, cards and core as markdown`,
    `- [Getting AI help](${pageUrl('cards/ai-assistance.md', base)}): what to attach and a prompt template`,
    '',
  ];
  const optional = [];
  for (const [folder, heading, inFull] of SECTIONS) {
    const pages = mdFiles(join(DOC, folder)).map(file => {
      const rel = relative(DOC, file);
      const { title, summary } = pageInfo(readFileSync(file, 'utf8'));
      return `- [${title}](${pageUrl(rel, base)})${summary ? `: ${summary}` : ''}`;
    });
    if (!pages.length) continue;
    if (inFull) lines.push(`## ${heading}`, '', ...pages, '');
    else optional.push(...pages);
  }
  if (optional.length) lines.push('## Optional', '', ...optional, '');
  return lines.join('\n');
}

export function buildLlmsFull({ base = '/', version }) {
  const parts = [`# LCARdS ${version} documentation`, '', `Source: ${SITE_ROOT}${base}. JSON Schemas: ${SITE_ROOT}${base}schema/index.json`, ''];
  for (const [folder, , inFull] of SECTIONS) {
    if (!inFull) continue;
    for (const file of mdFiles(join(DOC, folder))) {
      const rel = relative(DOC, file);
      parts.push('---', '', `<!-- ${pageUrl(rel, base)} -->`, '', cleanMarkdown(readFileSync(file, 'utf8')), '');
    }
  }
  return parts.join('\n');
}

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
