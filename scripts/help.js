#!/usr/bin/env node
/**
 * @fileoverview npm script reference — prints every package.json script grouped by purpose, with a
 * one-line description and when to run it. Source of truth for descriptions lives in this file
 * (CATEGORIES below); package.json's own `scripts` object is the source of truth for what actually
 * runs — this cross-checks the two and flags anything undocumented instead of silently omitting it.
 *
 * Usage: node scripts/help.js   (or npm run help)
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const BOLD = s => `\x1b[1m${s}\x1b[0m`;
const DIM = s => `\x1b[2m${s}\x1b[0m`;
const CYAN = s => `\x1b[36m${s}\x1b[0m`;
const YELLOW = s => `\x1b[33m${s}\x1b[0m`;

const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));

/**
 * Category print order below. `when` is a short, consistent tag:
 *   'every build' — runs automatically inside `npm run build`
 *   'CI/release'  — only invoked by CI or the Release GitHub Action, not for local dev
 *   'as needed'   — manual, run whenever its specific trigger applies (see description)
 *   'dev tool'    — one-off scaffolding/local-dev convenience, run on demand
 */
const CATEGORIES = [
  {
    name: 'Build',
    scripts: {
      build: { when: 'every build', desc: 'Full validated build — doc/CSS-var validation, version sync, Vite integration build, asset copy. Use for ALL dev/test builds.' },
      'build:integration': { when: 'CI/release', desc: 'Vite build + asset copy only, skips validation/version-sync. CI/release only — never for dev.' },
      typecheck: { when: 'as needed', desc: 'TypeScript checks across the whole src/ tree.' },
    },
  },
  {
    name: 'Validation',
    scripts: {
      'validate:css-vars': { when: 'every build', desc: 'Lints every --lcars-*/--lcards-*/theme: reference against the registered var lists. Also runs inside `build`.' },
      'validate:css-vars:verbose': { when: 'as needed', desc: 'Same, with full per-file detail — use when the plain summary doesn\'t pinpoint a violation.' },
      'validate:doc-examples': { when: 'as needed', desc: 'Validates YAML code examples embedded in doc/ against the real config schema.' },
      'validate:doc-examples:strict': { when: 'every build', desc: 'Same, but fails on any violation. Runs inside `build`.' },
    },
  },
  {
    name: 'Versioning',
    scripts: {
      'set-version': { when: 'every build', desc: 'Propagates package.json\'s version into manifest.json/const.py. Runs inside `build`; rarely needed standalone.' },
      'bump-version': { when: 'as needed', desc: 'Promote a -dev.N build to stable, or advance SEQ (resets on month rollover). Run when cutting a release.' },
      'bump-version:dev': { when: 'as needed', desc: 'Increment -dev.N, or start -dev.1 on the next base. Run while iterating on the dev branch.' },
    },
  },
  {
    name: 'HA Impact Analysis',
    scripts: {
      'check:ha-impact': { when: 'as needed', desc: 'Diffs local frontend/homeassistant-core checkouts, hands the diff to Claude Code CLI for a HIGH/MEDIUM/LOW report. Run periodically, or after pulling those repos.' },
      'check:ha-impact:quick': { when: 'as needed', desc: 'Same diff, no Claude Code hand-off — fast, free, deterministic file/CSS-var list only.' },
    },
  },
  {
    name: 'Testing',
    scripts: {
      'test:routing': { when: 'as needed', desc: 'Runs the MSD routing test suite. The only automated tests in this repo — everything else is manual in HA Lovelace.' },
    },
  },
  {
    name: 'Docs (VitePress)',
    scripts: {
      'docs:build': { when: 'as needed', desc: 'Builds the VitePress documentation site.' },
      'docs:serve': { when: 'as needed', desc: 'Local VitePress dev server with hot reload.' },
      'docs:serve:network': { when: 'as needed', desc: 'Same, bound to 0.0.0.0 — for viewing docs from another device on the LAN.' },
      'docs:preview': { when: 'as needed', desc: 'Serves the already-built doc/ output, to sanity-check a production doc build locally.' },
      'docs:routing-diagrams': { when: 'as needed', desc: 'Regenerates the routing scenario diagrams embedded in the routing docs.' },
    },
  },
  {
    name: 'HA-LCARS Theme Maintenance',
    scripts: {
      'lcars:palette-scale': { when: 'as needed', desc: 'Dry-run: interpolates the 7-stop canon palette to HA\'s 11-stop tone grid (OKLCH), writes an HTML review to reports/. Run when the canon palette (paletteInjector.js) changes.' },
      'lcars:palette-scale:write': { when: 'as needed', desc: 'Same, but patches the new stops into paletteInjector.js and publishes the review to doc/public/reports/.' },
      'lcars:semantic-tokens': { when: 'as needed', desc: 'Dry-run: computes ha-color-{on,fill,border,surface,form-background}-* for both Picard profiles, prints YAML + a WCAG contrast report.' },
      'lcars:semantic-tokens:write': { when: 'as needed', desc: 'Same, but patches ../ha-lcars/src/themes/lcards_picard_{red,blue}.yaml directly. Run after any change to themeGeneratorCore.js\'s resolveOnEntry/FILL/ON/BORDER tables.' },
      'lcars:generate-themes': { when: 'as needed', desc: '(Runs in the sibling ha-lcars repo.) Compiles ha-lcars/src/themes/*.yaml + preamble/defaults into ha-lcars/themes/lcars.yaml. Prerequisite for the two export-vendored scripts below.' },
      'lcars:export-vendored': { when: 'as needed', desc: 'Extracts the two Picard theme blocks from ha-lcars/themes/lcars.yaml into yaml/theme/ha-lcars-lcards-themes.yaml (the copy-paste snippet for non-HACS users).' },
      'lcars:export-all-themes': { when: 'as needed', desc: 'Vendors the entire ha-lcars/themes/lcars.yaml (~24 themes) into yaml/theme/ha-lcars-all-themes.yaml — bundled into the in-app Theme Generator\'s theme library at build time.' },
      'lcars:regenerate': { when: 'as needed', desc: 'Runs the full chain above in order. Run whenever ha-lcars\'s upstream source, or LCARdS\'s own palette/semantic-token math, changes and the bundled theme library needs to catch up.' },
    },
  },
  {
    name: 'Dev Tools',
    scripts: {
      'create-editor': { when: 'dev tool', desc: 'Scaffolds a new card editor file from the standard template.' },
      'generate-brand-icon': { when: 'dev tool', desc: 'Regenerates the HA brand/integration icon assets.' },
      help: { when: 'dev tool', desc: 'This screen.' },
    },
  },
];

const documented = new Set(CATEGORIES.flatMap(c => Object.keys(c.scripts)));
const undocumented = Object.keys(pkg.scripts).filter(name => !documented.has(name));

console.log(BOLD('\n📜 LCARdS npm scripts\n'));

for (const category of CATEGORIES) {
  const entries = Object.entries(category.scripts).filter(([name]) => name in pkg.scripts);
  if (!entries.length) continue;
  console.log(BOLD(CYAN(category.name)));
  const cmdWidth = Math.max(...entries.map(([name]) => name.length)) + 8; // 'npm run '.length
  const whenWidth = Math.max(...entries.map(([, info]) => info.when.length));
  for (const [name, info] of entries) {
    const cmd = `npm run ${name}`.padEnd(cmdWidth);
    const when = DIM(info.when.padEnd(whenWidth));
    console.log(`  ${cmd}  ${when}  ${info.desc}`);
  }
  console.log('');
}

if (undocumented.length) {
  console.log(YELLOW(BOLD('⚠ Undocumented scripts (add them to scripts/help.js\'s CATEGORIES):')));
  for (const name of undocumented) console.log(YELLOW(`  - ${name}`));
  console.log('');
}
