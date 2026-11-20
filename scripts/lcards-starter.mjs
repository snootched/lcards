#!/usr/bin/env node
/**
 * lcards-starter - astrometrics starters (whole scenes and parts) as card YAML, with
 * the same settings the Astrometrics Studio's Starters tab offers. Shipped in the
 * user-facing skill (bundled by scripts/build-validator.js --entry=...), so an
 * assistant can give a user any starter, a setting linked to their entity included.
 *
 *   lcards-starter list [--json]                       every starter: id, scene or part, title, summary
 *   lcards-starter show <id> [--json]                  its settings, defaults and notes
 *   lcards-starter build <id> [key=value ...] [--into card.yaml] [--merge]
 *
 * build prints the card YAML. A value is read as YAML: `size=120`, `centre=[0, 0, 0]`,
 * `power=light.floor_lamp` (a setting following an entity),
 * `power='{entity: light.floor_lamp, attribute: brightness_pct}'`,
 * `power='{entity: media_player.tv, playing: 100, paused: 40, default: 0}'` (by state).
 * With --into, a part is added to that card (its ids get the `prefix` setting); a
 * scene replaces the card's scene unless --merge. Without --into, a new card.
 */
import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { STARTERS, applyStarter } from '../src/core/astrometrics/starters/index.js';
import { starterYaml } from '../src/core/astrometrics/starters/yaml.js';

const TYPE = 'custom:lcards-astrometrics-card';

/** @param {any} s */
const summary = (s) => ({ id: s.id, kind: s.kind, title: s.title, summary: s.summary ?? '' });

/** @param {any} p */
const param = (p) => ({
  key: p.key,
  label: p.label,
  type: p.type,
  default: p.default,
  ...(p.options ? { options: p.options.map((/** @type {any} */ o) => o.value) } : {}),
  ...(p.helper ? { notes: p.helper } : {}),
});

/** A value from the command line, read as YAML (a number, a list, an entity id, a binding). */
function value(text) {
  try {
    const v = yaml.load(text);
    return v === undefined || v === null ? text : v;
  } catch {
    return text;
  }
}

/**
 * The card YAML for a starter.
 * @param {string} id
 * @param {Record<string, any>} params
 * @param {{ into?: Record<string, any>, merge?: boolean }} [opts]
 * @returns {{ yaml: string } | { error: string }}
 */
export function buildStarterYaml(id, params, { into, merge = false } = {}) {
  const starter = STARTERS.find((s) => s.id === id);
  if (!starter) return { error: `no starter "${id}" (lcards-starter list shows them)` };
  const known = new Set(starter.params.map((/** @type {any} */ p) => p.key));
  const unknown = Object.keys(params).filter((k) => !known.has(k));
  if (unknown.length) return { error: `${id} has no setting ${unknown.join(', ')} (lcards-starter show ${id} lists them)` };
  // a setting follows an entity: a bare id or { entity, ... } must look like one
  for (const p of starter.params.filter((/** @type {any} */ x) => x.type === 'setting' && x.key in params)) {
    const v = params[p.key];
    const entity = typeof v === 'string' ? v : v && typeof v === 'object' ? v.entity : undefined;
    if (entity !== undefined && !/^[a-z_]+\.[a-z0-9_]+$/.test(String(entity))) {
      return { error: `${p.key}: "${entity}" is not an entity id (domain.object_id, such as light.floor_lamp)` };
    }
  }
  const base = into ?? { type: TYPE, height: 400 };
  const out = applyStarter(base, starter, params, starter.kind === 'scene' && merge ? { mode: 'merge' } : {});
  if (out.error) return { error: out.error };
  return { yaml: starterYaml(out.config) };
}

function main(argv) {
  const [cmd, id, ...rest] = argv;
  const json = rest.includes('--json') || id === '--json';
  if (cmd === 'list') {
    const list = STARTERS.map(summary);
    if (json) console.log(JSON.stringify(list, null, 2));
    else for (const s of list) console.log(`${s.id.padEnd(26)} ${s.kind.padEnd(6)} ${s.title}${s.summary ? `: ${s.summary}` : ''}`);
    return 0;
  }
  if (cmd === 'show' && id) {
    const starter = STARTERS.find((s) => s.id === id);
    if (!starter) { console.error(`no starter "${id}"`); return 2; }
    const info = { ...summary(starter), description: starter.description ?? '', settings: starter.params.map(param) };
    if (json) console.log(JSON.stringify(info, null, 2));
    else {
      console.log(`${info.title} (${info.kind}, ${info.id})\n${info.description}\n\nSettings (key=value; values are YAML):`);
      for (const p of info.settings) {
        console.log(`  ${p.key} (${p.type}${p.options ? `: ${p.options.join(' | ')}` : ''}, default ${JSON.stringify(p.default)}): ${p.label}${p.notes ? `. ${p.notes}` : ''}`);
      }
    }
    return 0;
  }
  if (cmd === 'build' && id) {
    /** @type {Record<string, any>} */
    const params = {};
    let into;
    for (let i = 0; i < rest.length; i++) {
      const a = rest[i];
      if (a === '--into') { into = yaml.load(readFileSync(rest[++i], 'utf8')); continue; }
      if (a.startsWith('--into=')) { into = yaml.load(readFileSync(a.slice(7), 'utf8')); continue; }
      if (a.startsWith('--')) continue;
      const eq = a.indexOf('=');
      if (eq < 1) { console.error(`expected key=value, got "${a}"`); return 2; }
      params[a.slice(0, eq)] = value(a.slice(eq + 1));
    }
    const r = buildStarterYaml(id, params, { into: /** @type {any} */ (into), merge: rest.includes('--merge') });
    if ('error' in r) { console.error(r.error); return 1; }
    process.stdout.write(r.yaml);
    return 0;
  }
  console.error('Usage: lcards-starter list [--json] | show <id> [--json] | build <id> [key=value ...] [--into card.yaml] [--merge]');
  return 2;
}

const self = fileURLToPath(import.meta.url);
let invoked = false;
try { invoked = !!process.argv[1] && realpathSync(process.argv[1]) === realpathSync(self); } catch { /* not run directly */ }
if (invoked) process.exitCode = main(process.argv.slice(2));
