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
      typecheck: { when: 'build, CI', desc: 'TypeScript checks across src/: zero errors or it fails (also checks the generated element map). Runs inside build. Rules: doc/development/typescript.md.' },
      'types:elements': { when: 'as needed', desc: 'Regenerate src/types/elements.generated.d.ts after adding or renaming a custom element.' },
      'build:validator': { when: 'as needed', desc: 'Bundle the config checker into one standalone file (doc/public/tools/lcards-validate.mjs; --out=<file>). Runs inside docs:build; the Release workflow attaches it.' },
      'build:skill': { when: 'as needed', desc: 'Package the user-facing Claude skill (skills/lcards/SKILL.md + schemas, registries, user docs, gallery, HA-LCARS and UIX references, checker; plus the plugin hook and commands from skills/lcards/plugin/) as doc/public/tools/lcards-skill.zip (--out=<file>), the same skill as a Claude Code plugin (lcards-plugin.zip, --plugin-out=) and the channel\'s doc/public/marketplace.json (--marketplace-out=, named from DOCS_BASE). Runs inside docs:build; the Release workflow attaches both zips.' },
      'sync:ha-lcars': { when: 'after HA-LCARS changes', desc: 'Snapshot the HA-LCARS theme (palette, role variables, themes, every --lcars-* name, helpers, README guide) into scripts/data/ha-lcars/ from ../ha-lcars (--repo=<dir>) or GitHub (--remote). Committed; feeds the skill references and the checker\'s --lcars-* warnings. --check fails if stale.' },
      'sync:uix': { when: 'after UIX releases', desc: 'Snapshot the UIX styling docs pages the skill ships into scripts/data/uix/ from ../uix (--repo=<dir>) or a shallow clone. Committed. --check fails if stale.' },
      'eval:skill': { when: 'after skill changes', desc: 'Run the plugin eval suite (skills/lcards/plugin/evals/) with claude plugin eval against a no-plugin baseline: builds the plugin into a temp dir; 2 runs per arm; pass any claude plugin eval option (--case, --runs, --ablation none). Local only: costs tokens (about $2 for the suite at --runs 1).' },
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
      'validate:config': { when: 'as needed', desc: 'Check a card, view or whole dashboard YAML (or HA .storage JSON): schemas, unknown keys, built-in names. npm run validate:config -- <file> [--strict] [--json].' },
      'gallery:shots': { when: 'as needed', desc: 'Record every doc/gallery/dashboards/*.yaml on the dev HA into doc/public/gallery/: a still (.webp, the poster) and a looping video (.webm) of the state changes in doc/gallery/motion/<name>.yaml. Any file: node scripts/dashboard-shots.mjs <file.yaml> --out=<dir> [--keep] [--video] [--motion=<file>] [--action=lcards.red_alert] [--name=<out>]. Needs .ha-token.' },
      'video:showcase': { when: 'as needed', desc: 'Record the showcase video (doc/gallery/showcase/) on the dev HA and cut it: docs hero (doc/public/gallery/showcase.*), a captioned 1080p social cut and a release clip (tmp/marketing/). Re-cut without recording: node scripts/marketing-video.mjs. Needs .ha-token.' },
      'validate:schema-descriptions': { when: 'every build', desc: 'Fails on schema properties added without a description (backlog: scripts/schema-description-baseline.txt). Runs inside `build`.' },
      'validate:schema-descriptions:update': { when: 'as needed', desc: 'Rewrites the description baseline after you fill gaps (or after an intentional undescribed key).' },
    },
  },
  {
    name: 'Versioning',
    scripts: {
      'set-version': { when: 'every build', desc: 'Propagates package.json\'s version into manifest.json/const.py. Runs inside `build`; rarely needed standalone.' },
      'bump-version': { when: 'as needed', desc: 'Promote a -dev.N build to stable, or advance SEQ (resets on month rollover). Changes package.json only: then npm run build (writes const.py/manifest.json) and commit all three. Run when cutting a release.' },
      'bump-version:dev': { when: 'as needed', desc: 'Increment -dev.N, or start -dev.1 on the next base. Changes package.json only: then npm run build (writes const.py; manifest.json only on a new base) and commit them together. Run while iterating on the dev branch.' },
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
      'docs:llms-txt': { when: 'as needed', desc: 'Write llms.txt (links to every page + the schemas and checker) and llms-full.txt (user docs in one file) into the built site, under DOCS_BASE. Runs inside docs:build.' },
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
      'release:shots': { when: 'as needed', desc: 'Captures release pictures from the dev HA per doc/releases/shots/<version>.yaml (npm run release:shots -- <version> [name ...] [--gif]); other shot lists with --list <file> --out <dir> (card overview: doc/cards/shots/cards.yaml).' },
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
