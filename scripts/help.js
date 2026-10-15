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
      build: { when: 'every build', desc: 'Full validated build: doc examples (strict), schema descriptions, docs em-dash check, CSS vars, HA compat, version sync, Vite integration build (minified, .br/.gz), asset copy. Use for ALL dev/test builds.' },
      'build:integration': { when: 'CI/release', desc: 'Vite build + asset copy only, skips validation/version-sync. CI/release only — never for dev.' },
      typecheck: { when: 'as needed', desc: 'TypeScript checks across the whole src/ tree (full sorted list).' },
      'typecheck:check': { when: 'CI/release', desc: 'Fails only on TypeScript errors not in scripts/tsc-baseline.txt (the CI gate). After fixing baseline errors: node scripts/check-typecheck-baseline.js --update.' },
      'generate:llm-schema': { when: 'as needed', desc: 'Regenerates the published JSON Schemas (gitignored): doc/public/lcards-schema.json (everything) and doc/public/schema/ (index, per-card files, shared/). Runs inside docs:build and docs:serve.' },
    },
  },
  {
    name: 'Validation',
    scripts: {
      'validate:css-vars': { when: 'every build', desc: 'Lints every --lcars-*/--lcards-*/theme: reference against the registered var lists. Also runs inside `build`.' },
      'validate:css-vars:verbose': { when: 'as needed', desc: 'Same, with full per-file detail — use when the plain summary doesn\'t pinpoint a violation.' },
      'validate:ha-compat': { when: 'every build', desc: 'Fails on HA elements/attributes/CSS hooks/imports known to be removed or dead in the minimum supported HA (mwc-*, ha-formfield, ha-icon-button icon=, --mdc-theme-primary, voluptuous, …). Runs inside `build`.' },
      'validate:doc-examples': { when: 'as needed', desc: 'Validates YAML code examples embedded in doc/ against the real config schema.' },
      'validate:doc-examples:strict': { when: 'every build', desc: 'Same, but fails on any violation. Runs inside `build`.' },
      'validate:schema-descriptions': { when: 'every build', desc: 'Fails on schema properties added without a description (backlog: scripts/schema-description-baseline.txt). Runs inside `build`.' },
      'validate:schema-descriptions:update': { when: 'as needed', desc: 'Rewrites the description baseline after you fill gaps (or after an intentional undescribed key).' },
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
      'check:ha-impact:quick': { when: 'as needed', desc: 'Same diff, no Claude Code hand-off — fast, free, deterministic file/CSS-var list plus element-existence and dead-CSS-hook scans. Add --ref=<tag> to analyze an upstream release tag without checking it out.' },
    },
  },
  {
    name: 'Testing',
    scripts: {
      'test': { when: 'before commit', desc: 'Runs every node:test suite under tests/ (routing, layout-view row logic, HA compat lint rules). Card rendering is still tested manually in HA Lovelace.' },
      'test:routing': { when: 'as needed', desc: 'Runs only the MSD routing test suite.' },
      'test:data-grid': { when: 'as needed', desc: 'Runs only the data grid test suite.' },
      'test:browser': { when: 'before commit', desc: 'Layer A (Playwright, CI): cards from tests/browser/fixtures/*.yaml on the built bundle against a fake hass. Run npm run build first.' },
      'test:visual': { when: 'as needed', desc: 'Layer B (local only): screenshot baselines. Add -- --update-snapshots after an intended visual change.' },
      'test:ha': { when: 'as needed', desc: 'Layer C (local only): smoke tests against the dev HA. Needs a token in $HA_TOKEN or .ha-token, and npm run build first.' },
      'test:docs': { when: 'CI/release', desc: 'Docs site tests: live card demos, galleries, playgrounds and processor labs on the built site and the dev server. Run npm run docs:build first.' },
    },
  },
  {
    name: 'Docs (VitePress)',
    scripts: {
      'docs:build': { when: 'as needed', desc: 'Builds the docs site: LLM schema, production bundle copy for live demos, VitePress (fails on dead links), then the #anchor check.' },
      'docs:bundle': { when: 'as needed', desc: 'Builds the card bundle and copies it into doc/public/lcards/ for the live demos. Runs inside docs:build.' },
      'docs:check-anchors': { when: 'as needed', desc: 'Fails on any docs link to a missing #anchor (needs a built site). Runs inside docs:build.' },
      'docs:check-base': { when: 'as needed', desc: 'Fails when a /dev/ or /v/<version>/ docs build (DOCS_BASE) links outside its base. Runs inside docs:build.' },
      'docs:serve': { when: 'as needed', desc: 'Regenerates the published schemas, then the local VitePress dev server with hot reload.' },
      'docs:serve:network': { when: 'as needed', desc: 'Same, bound to 0.0.0.0 — for viewing docs from another device on the LAN.' },
      'docs:preview': { when: 'as needed', desc: 'Serves the already-built doc/ output, to sanity-check a production doc build locally.' },
      'docs:routing-diagrams': { when: 'as needed', desc: 'Regenerates the routing scenario diagrams embedded in the routing docs.' },
    },
  },
  {
    name: 'Releases',
    scripts: {
      'release:commits': { when: 'as needed', desc: 'Commits the release notes do not cover yet (from the in-testing page\'s notes_through, or the last release), with messages and areas. Input for drafting doc/releases/<version>.md.' },
      'release:check': { when: 'as needed', desc: 'Checks every release page: frontmatter, images exist and are used, nothing that cannot export to GitHub. Also runs in npm test.' },
      'release:notes': { when: 'CI/release', desc: 'Prints the GitHub release body for a version (npm run release:notes -- 2026.11.0). The Release workflow runs it with --out.' },
      'release:shots': { when: 'as needed', desc: 'Captures release pictures from the dev HA per doc/releases/shots/<version>.yaml (npm run release:shots -- <version> [name ...] [--gif]).' },
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
      'generate-brand-icon': { when: 'dev tool', desc: 'Regenerates the HA brand/integration icon assets. BROKEN: scripts/generate-brand-icon.js does not exist.' },
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
