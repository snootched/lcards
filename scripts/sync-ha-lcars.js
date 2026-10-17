#!/usr/bin/env node
/**
 * sync-ha-lcars.js - snapshot what the HA-LCARS theme defines, for the user skill
 * (scripts/build-user-skill.js) and the config checker (scripts/lib/registries.js).
 *
 *   scripts/data/ha-lcars/snapshot.json   source commit, palette, role variables with their
 *                                         defaults and descriptions, themes, every --lcars-*
 *                                         name, the helper entities
 *   scripts/data/ha-lcars/guide.md        the README from installation to known issues
 *                                         (classes, tips), images and layout tables removed
 *
 * Reads a local ha-lcars checkout (default ../ha-lcars, or --repo=<dir>); with --remote, or
 * when there is no checkout, fetches the same files from GitHub (master). Both outputs are
 * committed so builds and tests stay offline and deterministic; run this after HA-LCARS
 * changes (`npm run sync:ha-lcars`). `--check` exits 1 when the committed snapshot differs
 * from the source instead of writing.
 *
 * HA-LCARS: https://github.com/th3jesta/ha-lcars (MIT, Jesse Wisener).
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'scripts/data/ha-lcars');
export const HA_LCARS_REPO_URL = 'https://github.com/th3jesta/ha-lcars';
const RAW = 'https://raw.githubusercontent.com/th3jesta/ha-lcars/refs/heads/master';
const API = 'https://api.github.com/repos/th3jesta/ha-lcars';

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const repoArg = args.find(a => a.startsWith('--repo='))?.slice(7);
const localRepo = resolve(ROOT, repoArg ?? '../ha-lcars');

/** A source: read(path) -> text, list(dir) -> file names, commit -> {sha, date}. */
async function openSource() {
  if (!flag('remote') && existsSync(join(localRepo, 'src/preamble.yaml'))) {
    const git = (...a) => execFileSync('git', ['-C', localRepo, ...a], { encoding: 'utf8' }).trim();
    const [sha, date] = git('log', '-1', '--format=%H %cs').split(' ');
    return {
      where: localRepo,
      commit: { sha, date },
      read: async (p) => readFileSync(join(localRepo, p), 'utf8'),
      list: async (d) => readdirSync(join(localRepo, d)).sort(),
    };
  }
  const get = async (url, json = false) => {
    const res = await fetch(url, { headers: { 'User-Agent': 'lcards-sync-ha-lcars' } });
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    return json ? res.json() : res.text();
  };
  const head = await get(`${API}/commits/master`, true);
  return {
    where: HA_LCARS_REPO_URL,
    commit: { sha: head.sha, date: head.commit.committer.date.slice(0, 10) },
    read: (p) => get(`${RAW}/${p}`),
    list: async (d) => (await get(`${API}/contents/${d}`, true)).map(e => e.name).sort(),
  };
}

const VAR_LINE = /^(\s*)([a-z][a-z0-9-]*)\s*:\s*(.*?)\s*$/;

/** Strip a trailing `# comment` outside quotes; returns [value, comment]. */
function splitComment(raw) {
  let quote = null;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (quote) { if (c === quote) quote = null; continue; }
    if (c === '"' || c === "'") quote = c;
    else if (c === '#' && (i === 0 || /\s/.test(raw[i - 1]))) {
      return [raw.slice(0, i).trim(), raw.slice(i).replace(/^#+\s*/, '').trim()];
    }
  }
  return [raw.trim(), ''];
}
const unquote = (v) => v.replace(/^(["'])(.*)\1$/, '$2');
/** Upstream prose for LCARdS output: LCARdS text carries no em dashes. */
const plain = (t) => t.replace(/\s*\u2014\s*/g, ': ');

/**
 * The `&lcars-variables` block of preamble.yaml: every palette entry with the comment
 * header it sits under (`# LCARS Picard S1 Colors`, `# Shapes`, ...).
 */
export function parsePalette(preamble) {
  const lines = preamble.split('\n');
  const start = lines.findIndex(l => l.includes('&lcars-variables'));
  if (start < 0) throw new Error('preamble.yaml: no &lcars-variables block');
  const out = [];
  let group = 'LCARS colours';
  let pendingComment = [];
  for (const line of lines.slice(start + 1)) {
    if (/^\S/.test(line)) break; // next top-level block
    const comment = line.match(/^\s+#\s?(.*)$/);
    if (comment) { pendingComment.push(comment[1].trim()); continue; }
    if (!line.trim()) { pendingComment = []; continue; }
    const m = line.match(VAR_LINE);
    if (!m || m[1].length !== 2) continue;
    // A comment run directly above an entry names a new group when it is a short title.
    if (pendingComment.length === 1 && pendingComment[0].length <= 40) group = pendingComment[0].replace(/:$/, '');
    else if (pendingComment.length > 1) group = pendingComment[0].replace(/[.:]$/, '');
    pendingComment = [];
    const [value, note] = splitComment(m[3]);
    out.push({ name: m[2], value: unquote(value), group, ...(note && !/^lcars-c\d+$/.test(note) ? { note: plain(note) } : {}) });
  }
  return out;
}

/**
 * defaults.yaml: the role variables every theme gets, each with the comment above it
 * (what the variable colours) and its `# Section` header.
 */
export function parseDefaults(text) {
  const out = [];
  const modes = {};
  let section = '';
  let comment = [];
  let mode = null;
  let blankBefore = true;
  for (const line of text.split('\n')) {
    if (!line.trim()) { comment = []; blankBefore = true; continue; }
    if (/^modes:/.test(line)) { mode = ''; continue; }
    if (mode !== null) {
      const mm = line.match(/^ {2}(light|dark):/);
      if (mm) { mode = mm[1]; modes[mode] = {}; continue; }
      const v = line.match(/^ {4}([a-z][a-z0-9-]*):\s*(.*)$/);
      if (v && mode) modes[mode][v[1]] = unquote(splitComment(v[2])[0]);
      continue;
    }
    const c = line.match(/^#\s?(.*)$/);
    if (c) {
      // A one-line comment after a blank line, followed by more comments or a key, is a
      // section header when the next line is another comment; resolved at the key below.
      comment.push({ text: c[1].trim(), blankBefore });
      blankBefore = false;
      continue;
    }
    blankBefore = false;
    const m = line.match(VAR_LINE);
    if (!m || m[1].length) continue;
    // `# Section` then `# description` above the first key of a section.
    if (comment.length >= 2 && comment[0].blankBefore && comment[0].text.length <= 30) {
      section = comment[0].text;
      comment = comment.slice(1);
    } else if (comment.length === 1 && comment[0].blankBefore && /^[A-Z][\w /]*$/.test(comment[0].text) && comment[0].text.length <= 30) {
      section = comment[0].text;
      comment = [];
    }
    const [value] = splitComment(m[3]);
    out.push({ name: m[2], default: unquote(value), section, ...(comment.length ? { description: plain(comment.map(c => c.text).join(' ')) } : {}) });
    comment = [];
  }
  return { roles: out, modes };
}

/** One theme file: its display name, the variables it sets and its light/dark overrides. */
export function parseTheme(file, text) {
  const doc = YAML.parse(text) ?? {};
  const vars = {};
  for (const [k, v] of Object.entries(doc)) if (k !== 'name' && k !== 'modes' && typeof v !== 'object') vars[k] = String(v);
  const modes = {};
  for (const [m, set] of Object.entries(doc.modes ?? {})) modes[m] = Object.fromEntries(Object.entries(set ?? {}).map(([k, v]) => [k, String(v)]));
  return { name: doc.name ?? file.replace(/\.yaml$/, ''), file, vars, ...(Object.keys(modes).length ? { modes } : {}) };
}

/**
 * Every `--lcars-*` name the generated theme file defines: theme keys (any indent, so
 * light/dark `modes:` entries count) and the `--lcars-*:` declarations in its CSS
 * (helper-driven ones such as `--lcars-sound`).
 */
export function parseVarNames(lcarsYaml) {
  const keys = [...lcarsYaml.matchAll(/^\s+(lcars-[a-z0-9-]+)\s*:/gm)].map(m => m[1]);
  const css = [...lcarsYaml.matchAll(/--(lcars-[a-z0-9-]+)\s*:/g)].map(m => m[1]);
  return [...new Set([...keys, ...css])].sort();
}

/** The helper entities from the README's "Create the helper entities" list. */
export function parseHelpers(readme) {
  const out = [];
  const start = readme.indexOf('Create the helper entities');
  if (start < 0) return out;
  const block = readme.slice(start, readme.indexOf('\n#', start + 30));
  let cur = null;
  for (const line of block.split('\n')) {
    const h = line.match(/^- (Optional: )?(.+?) \(entity id should be `([a-z_]+\.[a-z0-9_]+)`\)/);
    if (h) { cur = { entity_id: h[3], name: h[2], optional: !!h[1], notes: [] }; out.push(cur); continue; }
    const n = line.match(/^ {2,}- (.+)$/);
    if (n && cur) cur.notes.push(plain(n[1].trim()));
  }
  return out;
}

/**
 * The README from "Installation instructions" up to the acknowledgements, as plain
 * markdown: images, the two-column YAML/Result tables, anchors and badges removed.
 */
export function readmeGuide(readme) {
  const from = readme.indexOf('## Installation instructions');
  const to = readme.indexOf('## Acknowledgements');
  if (from < 0) throw new Error('README: no "## Installation instructions" heading');
  let md = readme.slice(from, to < 0 ? undefined : to);
  md = plain(md)
    .replace(/<img\b[^>]*>/gi, '')
    .replace(/<a id="[^"]*"><\/a>/gi, '')
    .replace(/<summary>\s*(.*?)\s*<\/summary>/gis, (_, s) => `\n${s.replace(/<\/?b>/g, '**').replace(/\s*\(click to expand\)/i, '')}\n`)
    .replace(/<\/?(details|table|tr|tbody|thead)\b[^>]*>/gi, '')
    .replace(/<td>\s*YAML\s*<\/td>\s*<td>\s*Result\s*<\/td>/gi, '')
    .replace(/<\/?td\b[^>]*>/gi, '')
    .replace(/\[\^\d+\]/g, '') // footnotes live after the cut
    .replace(/\s*—\s*/g, ': ') // LCARdS text carries no em dashes
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n');
  // Indented fences left over from table cells.
  md = md.replace(/^ {4}(```)/gm, '$1');
  return md.trim() + '\n';
}

export async function buildSnapshot(source) {
  const [preamble, defaults, lcarsYaml, readme, themeFiles] = await Promise.all([
    source.read('src/preamble.yaml'),
    source.read('src/defaults.yaml'),
    source.read('themes/lcars.yaml'),
    source.read('README.md'),
    source.list('src/themes'),
  ]);
  const themes = [];
  for (const f of themeFiles.filter(f => f.endsWith('.yaml'))) themes.push(parseTheme(f, await source.read(`src/themes/${f}`)));
  themes.sort((a, b) => a.name.localeCompare(b.name));
  const { roles, modes } = parseDefaults(defaults);
  const snapshot = {
    $comment: 'Generated by scripts/sync-ha-lcars.js from HA-LCARS; do not hand-edit. Run npm run sync:ha-lcars after HA-LCARS changes.',
    source: { repo: HA_LCARS_REPO_URL, commit: source.commit.sha, date: source.commit.date, license: 'MIT (c) Jesse Wisener' },
    palette: parsePalette(preamble),
    roles,
    mode_defaults: modes,
    themes,
    vars: parseVarNames(lcarsYaml),
    helpers: parseHelpers(readme),
  };
  return { snapshot, guide: readmeGuide(readme) };
}

async function main() {
  const source = await openSource();
  const { snapshot, guide } = await buildSnapshot(source);
  const files = {
    'snapshot.json': JSON.stringify(snapshot, null, 1) + '\n',
    'guide.md': guide,
  };
  if (flag('check')) {
    // The commit and date always move; compare content only.
    const strip = (t) => t.replace(/"commit": "[^"]*"|"date": "[^"]*"/g, '');
    const stale = Object.entries(files).filter(([name, text]) => {
      const p = join(OUT_DIR, name);
      return !existsSync(p) || strip(readFileSync(p, 'utf8')) !== strip(text);
    }).map(([n]) => n);
    if (stale.length) {
      console.error(`❌ HA-LCARS snapshot is stale (${stale.join(', ')}) against ${source.where}. Run npm run sync:ha-lcars.`);
      process.exit(1);
    }
    console.log(`✅ HA-LCARS snapshot matches ${source.where}`);
    return;
  }
  mkdirSync(OUT_DIR, { recursive: true });
  for (const [name, text] of Object.entries(files)) writeFileSync(join(OUT_DIR, name), text);
  console.log(`✅ HA-LCARS ${source.commit.sha.slice(0, 7)} (${source.commit.date}) from ${source.where}: ` +
    `${snapshot.palette.length} palette, ${snapshot.roles.length} role vars, ${snapshot.themes.length} themes, ` +
    `${snapshot.vars.length} --lcars-* names, ${snapshot.helpers.length} helpers`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
