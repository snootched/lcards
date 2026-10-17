#!/usr/bin/env node
/**
 * build-user-skill.js - package the user-facing LCARdS skill (skills/lcards/) as
 * lcards-skill.zip: SKILL.md plus generated references for this LCARdS version.
 *
 *   lcards/SKILL.md                       from skills/lcards/SKILL.md
 *   lcards/references/schema/             index.json, cards/, views/, strategies/, shared/,
 *                                         registries.json (scripts/lib/schema-publish.js,
 *                                         scripts/lib/registries.js)
 *   lcards/references/docs/<section>/     the user docs as markdown (getting-started,
 *                                         configuration, cards, core), cleaned like llms-full.txt
 *   lcards/references/gallery/*.yaml      the dashboard gallery
 *   lcards/references/ha-lcars/           HA-LCARS variables, themes and guide
 *                                         (scripts/data/ha-lcars/, scripts/sync-ha-lcars.js)
 *   lcards/references/uix/                the UIX styling docs pages
 *                                         (scripts/data/uix/, scripts/sync-uix-docs.js)
 *   lcards/scripts/lcards-validate.mjs    the standalone config checker
 *
 * The same tree is also packaged as a Claude Code plugin, with a marketplace file that
 * points at it (install: /plugin marketplace add <site>/marketplace.json, then
 * /plugin install lcards@lcards):
 *
 *   lcards-plugin.zip    .claude-plugin/plugin.json (version = package.json) + skills/lcards/,
 *                        plus hooks/ (run the checker on LCARdS YAML Claude writes) and
 *                        commands/ (/lcards:check, /lcards:dashboard) from skills/lcards/plugin/
 *   marketplace.json     one plugin entry with an `archive` source: <site><DOCS_BASE>tools/lcards-plugin.zip.
 *                        Named per docs channel (DOCS_BASE / -> lcards, /dev/ -> lcards-dev,
 *                        /v/<version>/ -> lcards-<version>), so channels can sit side by side.
 *
 *   node scripts/build-user-skill.js [--out=<file.zip>] [--plugin-out=<file.zip>] [--marketplace-out=<file.json>]
 *     defaults: doc/public/tools/lcards-skill.zip, doc/public/tools/lcards-plugin.zip,
 *               doc/public/marketplace.json
 *
 * Published on the docs site (docs:build) and attached to each GitHub release.
 * Zipped with Python's zipfile module (no zip binary needed).
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, readFileSync, readdirSync, copyFileSync, cpSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { getSchemaEntries } from './lib/card-schemas.js';
import { buildSchemaSet } from './lib/schema-publish.js';
import { buildRegistries } from './lib/registries.js';
import { SECTIONS, cleanMarkdown, isRedirectStub } from './generate-llms-txt.js';
import { SITE_URL } from './release-lib.mjs';
import { loadHaLcars, renderVariables, renderThemes, renderGuide } from './lib/ha-lcars-reference.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (name, fallback) => {
  const a = process.argv.slice(2).find(x => x.startsWith(`--${name}=`));
  return a ? resolve(a.slice(name.length + 3)) : join(ROOT, fallback);
};
const OUT = arg('out', 'doc/public/tools/lcards-skill.zip');
const PLUGIN_OUT = arg('plugin-out', 'doc/public/tools/lcards-plugin.zip');
const MARKETPLACE_OUT = arg('marketplace-out', 'doc/public/marketplace.json');
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const { version } = pkg;

const work = mkdtempSync(join(tmpdir(), 'lcards-skill-'));
const skill = join(work, 'lcards');
const write = (rel, text) => {
  const file = join(skill, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, text);
};

// SKILL.md, stamped with the version it was built for.
const skillMd = readFileSync(join(ROOT, 'skills/lcards/SKILL.md'), 'utf8');
write('SKILL.md', skillMd.replace(/\n# LCARdS\n/, `\n# LCARdS\n\n<!-- Built for LCARdS ${version} -->\n`));

// Schemas and registries.
const { files, index } = buildSchemaSet(getSchemaEntries(), { version });
index.registries = { file: 'registries.json' };
write('references/schema/index.json', JSON.stringify(index, null, 1));
for (const [rel, doc] of files) write(`references/schema/${rel}`, JSON.stringify(doc));
write('references/schema/registries.json', JSON.stringify(await buildRegistries(), null, 1));

// User docs, cleaned (frontmatter, Vue components and anchors removed; file includes inlined).
let pages = 0;
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith('.md') ? [join(dir, e.name)] : []);
for (const [folder, , inFull] of SECTIONS) {
  if (!inFull) continue;
  for (const file of walk(join(ROOT, 'doc', folder))) {
    if (isRedirectStub(readFileSync(file, 'utf8'))) continue;
    write(`references/docs/${relative(join(ROOT, 'doc'), file)}`, cleanMarkdown(readFileSync(file, 'utf8')) + '\n');
    pages++;
  }
}

// Gallery dashboards.
const galleryDir = join(ROOT, 'doc/gallery/dashboards');
for (const name of readdirSync(galleryDir).filter(f => f.endsWith('.yaml'))) {
  write(`references/gallery/${name}`, readFileSync(join(galleryDir, name), 'utf8'));
}

// HA-LCARS: rendered from the committed snapshot.
const haLcars = loadHaLcars();
write('references/ha-lcars/variables.md', renderVariables(haLcars.snapshot));
write('references/ha-lcars/themes.md', renderThemes(haLcars.snapshot));
write('references/ha-lcars/guide.md', renderGuide(haLcars.snapshot, haLcars.guide));

// UIX docs pages, each with the attribution CC BY 4.0 asks for.
const uixDir = join(ROOT, 'scripts/data/uix');
const uix = JSON.parse(readFileSync(join(uixDir, 'meta.json'), 'utf8'));
for (const page of uix.pages) {
  const { site, commit, date, license } = uix.source;
  const url = `${site}${page.replace(/(index)?\.md$/, '')}`;
  write(`references/uix/${page}`, `<!-- From the UIX documentation, ${url} (commit ${commit.slice(0, 7)}, ${date}). ${license}. Reformatted for plain markdown. -->\n\n` +
    readFileSync(join(uixDir, page), 'utf8'));
}

// The checker.
mkdirSync(join(skill, 'scripts'), { recursive: true });
execFileSync(process.execPath, [join(ROOT, 'scripts/build-validator.js'), `--out=${join(skill, 'scripts/lcards-validate.mjs')}`], { stdio: 'ignore' });

const zipDir = (cwd, out, ...entries) => {
  mkdirSync(dirname(out), { recursive: true });
  rmSync(out, { force: true });
  execFileSync('python3', ['-m', 'zipfile', '-c', out, ...entries], { cwd });
};
const shown = (file) => file.startsWith(ROOT) ? relative(ROOT, file) : file;

// The skill zip: lcards/SKILL.md at the top (claude.ai upload, ~/.claude/skills/).
zipDir(work, OUT, 'lcards');

// The Claude Code plugin: plugin root at the top of the zip, the skill under skills/.
const description = 'Writes, fixes and explains LCARdS configuration for Home Assistant: every card option, built-in name and docs page for this LCARdS version, the HA-LCARS theme and UIX references, and the config checker (run automatically on LCARdS YAML Claude writes).';
const plugin = join(work, 'plugin');
mkdirSync(join(plugin, '.claude-plugin'), { recursive: true });
mkdirSync(join(plugin, 'skills'), { recursive: true });
cpSync(skill, join(plugin, 'skills/lcards'), { recursive: true });
// Plugin-only parts: the hook that runs the checker, and the slash commands.
for (const part of ['hooks', 'commands']) cpSync(join(ROOT, 'skills/lcards/plugin', part), join(plugin, part), { recursive: true });
writeFileSync(join(plugin, '.claude-plugin/plugin.json'), JSON.stringify({
  name: 'lcards',
  displayName: 'LCARdS',
  version,
  description,
  author: { name: pkg.author },
  homepage: SITE_URL,
  repository: 'https://github.com/snootched/lcards',
  license: pkg.license,
  keywords: ['home-assistant', 'lcars', 'ha-lcars', 'lovelace', 'dashboard', 'star-trek', 'uix'],
}, null, 2) + '\n');
zipDir(plugin, PLUGIN_OUT, '.claude-plugin', 'skills', 'hooks', 'commands');

// The marketplace for this docs channel, pointing at the channel's own plugin zip.
// No entry version: plugin.json owns it (users update when the LCARdS version changes).
const base = process.env.DOCS_BASE ?? '/';
const channel = base === '/' ? '' : base === '/dev/' ? '-dev' : `-${base.split('/')[2]}`;
mkdirSync(dirname(MARKETPLACE_OUT), { recursive: true });
writeFileSync(MARKETPLACE_OUT, JSON.stringify({
  name: `lcards${channel}`,
  description: `LCARdS for Claude Code${channel ? ` (${channel.slice(1)} channel)` : ''}: the LCARdS skill for writing and checking LCARS-style Home Assistant dashboards.`,
  owner: { name: pkg.author, url: SITE_URL },
  plugins: [{
    name: 'lcards',
    description,
    source: { source: 'archive', url: `${SITE_URL}${base}tools/lcards-plugin.zip` },
  }],
}, null, 2) + '\n');

rmSync(work, { recursive: true, force: true });
console.log(`✅ Wrote ${shown(OUT)} (${(statSync(OUT).size / 1024).toFixed(0)} KB: ${files.size} schema files, ${pages} docs pages, LCARdS ${version})`);
console.log(`✅ Wrote ${shown(PLUGIN_OUT)} and ${shown(MARKETPLACE_OUT)} (marketplace lcards${channel})`);
