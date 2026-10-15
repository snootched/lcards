#!/usr/bin/env node
/**
 * lcards-validate - check LCARdS YAML before it goes on a dashboard.
 *
 * Give it a card, a view, a whole dashboard (raw configuration YAML, or HA's
 * .storage/lovelace* JSON); it finds every LCARdS card, layout view and shell
 * strategy at any depth and checks each against the real schemas and the
 * built-in names (scripts/lib/config-validator.js, the same checker that
 * validates the docs' examples).
 *
 *   Errors    the config is wrong: invalid values, keys LCARdS doesn't have, an
 *             MSD with nothing to draw on.
 *   Warnings  probably wrong: names that aren't built in (a preset, animation,
 *             sound, theme token...; a user pack may add them) and the legacy
 *             chart / data grid format (still works).
 *
 * In this repo:   npm run validate:config -- <file.yaml> [...]
 * Standalone:     node lcards-validate.mjs <file.yaml> [...]   (attached to each
 *                 release, and served at /tools/lcards-validate.mjs on the docs site;
 *                 built by scripts/build-validator.js, needs only Node 20+)
 *
 * Options:
 *   -              read YAML from stdin
 *   --strict       warnings fail too (exit 1)
 *   --json         machine-readable output: [{ file, path, tag, severity, code, message }]
 *   --quiet        only print problems
 *   --version      print the LCARdS version the schemas come from
 *
 * Exit code: 0 clean (or warnings only), 1 problems, 2 usage / unreadable input.
 */
import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { getSchemaEntries } from './lib/card-schemas.js';
import { createConfigValidator } from './lib/config-validator.js';

// The standalone bundle carries the registries and version (scripts/build-validator.js);
// in the repo they come from the source.
/* global __LCARDS_REGISTRIES__, __LCARDS_VALIDATOR_VERSION__ */
const BUNDLED_REGISTRIES = typeof __LCARDS_REGISTRIES__ !== 'undefined' ? __LCARDS_REGISTRIES__ : null;
const BUNDLED_VERSION = typeof __LCARDS_VALIDATOR_VERSION__ !== 'undefined' ? __LCARDS_VALIDATOR_VERSION__ : null;

/** HA YAML tags (!include, !secret, ...) load as placeholder strings; their content isn't LCARdS config. */
const HA_TAGS = ['!include', '!include_dir_list', '!include_dir_named', '!include_dir_merge_list', '!include_dir_merge_named', '!secret', '!env_var', '!input'];
const HA_SCHEMA = yaml.DEFAULT_SCHEMA.extend(HA_TAGS.flatMap(tag => ['scalar', 'sequence', 'mapping'].map(kind =>
  new yaml.Type(tag, { kind, construct: (data) => `${tag} ${typeof data === 'string' ? data : JSON.stringify(data)}` }))));

const isHaTagValue = (v) => typeof v === 'string' && HA_TAGS.some(tag => v.startsWith(`${tag} `));

/** The value at an issue path such as `views[0].cards[2].text`. */
function valueAt(root, path) {
  let v = root;
  for (const part of path.match(/[^.[\]]+/g) ?? []) {
    if (v == null || typeof v !== 'object') return undefined;
    v = v[/^\d+$/.test(part) ? Number(part) : part];
  }
  return v;
}

export function parseConfig(text) {
  return yaml.load(text, { schema: HA_SCHEMA });
}

async function loadRegistries() {
  if (BUNDLED_REGISTRIES) return BUNDLED_REGISTRIES;
  const { buildRegistries } = await import('./lib/registries.js');
  return buildRegistries();
}

async function version() {
  if (BUNDLED_VERSION) return BUNDLED_VERSION;
  return JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;
}

/**
 * Validate named YAML texts.
 * @param {{name: string, text: string}[]} inputs
 * @returns {Promise<Array<{file: string, path: string, tag: string, severity: string, code: string, message: string}>>}
 */
export async function validateTexts(inputs) {
  const checker = createConfigValidator({ entries: getSchemaEntries(), registries: await loadRegistries() });
  const out = [];
  for (const { name, text } of inputs) {
    let config;
    try {
      config = parseConfig(text);
    } catch (e) {
      out.push({ file: name, path: '(file)', tag: '', severity: 'error', code: 'yaml', message: `YAML does not parse: ${e.message.split('\n')[0]}` });
      continue;
    }
    for (const issue of checker.validateConfig(config)) {
      // A value from !secret / !include is HA's to resolve; don't judge the placeholder.
      if (isHaTagValue(valueAt(config, issue.path))) continue;
      out.push({ file: name, ...issue });
    }
  }
  return out;
}

async function main(argv) {
  const flags = new Set(argv.filter(a => a.startsWith('--')));
  const files = argv.filter(a => !a.startsWith('--'));
  if (flags.has('--version')) {
    console.log(await version());
    return 0;
  }
  if (!files.length || flags.has('--help')) {
    console.error('Usage: lcards-validate [--strict] [--json] [--quiet] <file.yaml | -> [...]');
    return 2;
  }
  const inputs = [];
  for (const f of files) {
    try {
      inputs.push({ name: f === '-' ? '(stdin)' : f, text: readFileSync(f === '-' ? 0 : f, 'utf8') });
    } catch (e) {
      console.error(`Cannot read ${f}: ${e.message}`);
      return 2;
    }
  }
  const issues = await validateTexts(inputs);
  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');
  const failed = errors.length > 0 || (flags.has('--strict') && warnings.length > 0);

  if (flags.has('--json')) {
    console.log(JSON.stringify(issues, null, 2));
    return failed ? 1 : 0;
  }
  for (const i of issues) {
    const where = [i.file, i.path].join(': ');
    const tag = i.tag ? ` [${i.tag}]` : '';
    console.log(`${i.severity === 'error' ? 'error  ' : 'warning'} ${where}${tag} ${i.message}`);
  }
  if (!flags.has('--quiet') || issues.length) {
    const v = await version();
    const summary = `${errors.length} error(s), ${warnings.length} warning(s) in ${inputs.length} file(s) (LCARdS ${v} schemas)`;
    console.log(issues.length ? `\n${summary}` : `OK: ${summary}`);
  }
  return failed ? 1 : 0;
}

// Run as a command (not when imported by tests).
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(await main(process.argv.slice(2)));
}
