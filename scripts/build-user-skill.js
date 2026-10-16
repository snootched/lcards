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
 *   lcards/scripts/lcards-validate.mjs    the standalone config checker
 *
 *   node scripts/build-user-skill.js [--out=<file.zip>]   (default doc/public/tools/lcards-skill.zip)
 *
 * Published on the docs site (docs:build) and attached to each GitHub release.
 * Zipped with Python's zipfile module (no zip binary needed).
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, readFileSync, readdirSync, copyFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { getSchemaEntries } from './lib/card-schemas.js';
import { buildSchemaSet } from './lib/schema-publish.js';
import { buildRegistries } from './lib/registries.js';
import { SECTIONS, cleanMarkdown, isRedirectStub } from './generate-llms-txt.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outArg = process.argv.slice(2).find(a => a.startsWith('--out='));
const OUT = outArg ? resolve(outArg.slice('--out='.length)) : join(ROOT, 'doc/public/tools/lcards-skill.zip');
const { version } = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));

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

// The checker.
mkdirSync(join(skill, 'scripts'), { recursive: true });
execFileSync(process.execPath, [join(ROOT, 'scripts/build-validator.js'), `--out=${join(skill, 'scripts/lcards-validate.mjs')}`], { stdio: 'ignore' });

mkdirSync(dirname(OUT), { recursive: true });
rmSync(OUT, { force: true });
execFileSync('python3', ['-m', 'zipfile', '-c', OUT, 'lcards'], { cwd: work });
rmSync(work, { recursive: true, force: true });
console.log(`✅ Wrote ${OUT.startsWith(ROOT) ? relative(ROOT, OUT) : OUT} (${(statSync(OUT).size / 1024).toFixed(0)} KB: ${files.size} schema files, ${pages} docs pages, LCARdS ${version})`);
