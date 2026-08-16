#!/usr/bin/env node
/**
 * @fileoverview Vendored HA-LCARS Full Theme Library Exporter
 *
 * Unlike `export-vendored-ha-lcars-theme.js` (which extracts just the two
 * LCARdS Picard theme blocks for copy-pasting after an existing HA-LCARS
 * install), this vendors the *entire* already-generated
 * `ha-lcars/themes/lcars.yaml` verbatim into `yaml/theme/ha-lcars-all-
 * themes.yaml` — anchor definitions (`&lcars-variables`/`&base`/`&card-mod-
 * css`) included. That file is genuinely self-contained: those anchors are
 * defined earlier in the same document, so a normal YAML parse (js-yaml's
 * default schema resolves `<<:` merge keys natively) fully resolves every
 * one of its ~24 shipped themes with no external dependency.
 *
 * This is what the in-app Theme Generator's "Load from ha-lcars library"
 * picker bundles at build time (via a Vite `?raw` import) — letting any user
 * start a new custom profile from any theme ha-lcars ships, not just the two
 * LCARdS Picard ones, without the LCARdS build depending on a sibling
 * `ha-lcars` checkout being present on every contributor's machine.
 *
 * Usage:
 *   node scripts/export-vendored-ha-lcars-all-themes.js           dry-run
 *   node scripts/export-vendored-ha-lcars-all-themes.js --write    writes
 *                                                             yaml/theme/ha-lcars-all-themes.yaml
 *
 * @module scripts/export-vendored-ha-lcars-all-themes
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const GENERATED_LCARS_YAML = join(ROOT, '..', 'ha-lcars', 'themes', 'lcars.yaml');
const OUTPUT_PATH = join(ROOT, 'yaml/theme/ha-lcars-all-themes.yaml');

const ARGS = new Set(process.argv.slice(2));
const WRITE = ARGS.has('--write');

const source = readFileSync(GENERATED_LCARS_YAML, 'utf-8');
const header = [
  '# Vendored, verbatim copy of ha-lcars/themes/lcars.yaml — every theme',
  '# ha-lcars ships, self-contained (its &lcars-variables/&base/&card-mod-css',
  '# anchors are defined earlier in this same file). Regenerate with',
  '# `npm run lcars:export-all-themes` after `npm run lcars:generate-themes`.',
  '# Consumed by src/editor/components/theme-browser/lcards-theme-generator-view.js',
  '# via a build-time Vite `?raw` import — do not hand-edit.',
  '',
].join('\n');

const finalContent = header + source;

if (WRITE) {
  writeFileSync(OUTPUT_PATH, finalContent, 'utf-8');
  console.log(`Wrote ${OUTPUT_PATH} (${finalContent.split('\n').length} lines)`);
} else {
  const existing = (() => { try { return readFileSync(OUTPUT_PATH, 'utf-8'); } catch { return ''; } })();
  console.log(existing === finalContent ? 'No changes — vendored file already in sync.' : 'Vendored file is OUT OF SYNC — re-run with --write to update.');
  console.log(`(new content: ${finalContent.split('\n').length} lines, existing: ${existing.split('\n').length} lines)`);
}
