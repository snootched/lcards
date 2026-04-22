#!/usr/bin/env node
/**
 * @fileoverview CSS Variable Allowlist Validator
 *
 * Validates all CSS variable references in src/ against known-good allowlists:
 *
 *   Pass 1  --lcars-*   → HA-LCARS theme vars (scripts/ha-lcars-theme-vars.js)
 *   Pass 2  --lcards-*  → LCARdS palette vars (src/core/themes/paletteInjector.js)
 *   Pass 3  theme:*     → Token paths in lcardsDefaultTokens.js (best-effort)
 *   Pass 4  animation   → theme: must NOT appear in animation param values
 *
 * Exit 0 = clean, Exit 1 = violations found.
 *
 * Usage:
 *   node scripts/validate-css-vars.js
 *   node scripts/validate-css-vars.js --verbose   (show all valid refs too)
 *   node scripts/validate-css-vars.js -v
 *   node scripts/validate-css-vars.js --fix        (future: auto-fix stubs)
 *
 * @module scripts/validate-css-vars
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC  = join(ROOT, 'src');

// ─── CLI args ─────────────────────────────────────────────────────────────────
const ARGS    = new Set(process.argv.slice(2));
const VERBOSE = ARGS.has('--verbose') || ARGS.has('-v');

// ─── ANSI colour helpers ──────────────────────────────────────────────────────
const RED    = s => `\x1b[31m${s}\x1b[0m`;
const YELLOW = s => `\x1b[33m${s}\x1b[0m`;
const GREEN  = s => `\x1b[32m${s}\x1b[0m`;
const BOLD   = s => `\x1b[1m${s}\x1b[0m`;
const DIM    = s => `\x1b[2m${s}\x1b[0m`;

// ─── Load allowlists ──────────────────────────────────────────────────────────

/** @type {Set<string>} */
let VALID_LCARS_VARS;
try {
  const { fetchHaLcarsVars, STATIC_FALLBACK_VARS, HA_LCARS_THEME_URL } =
    await import('./ha-lcars-theme-vars.js');

  try {
    process.stdout.write('  Fetching HA-LCARS theme vars from GitHub… ');
    VALID_LCARS_VARS = await fetchHaLcarsVars();
    console.log(`✓ (${VALID_LCARS_VARS.size} vars)`);
  } catch (fetchErr) {
    console.warn(`\n${YELLOW('⚠  Network fetch failed:')} ${fetchErr.message}`);
    console.warn(YELLOW(`   Falling back to static list (${STATIC_FALLBACK_VARS.size} vars).`));
    console.warn(YELLOW(`   Re-run with network access for a full check.\n`));
    VALID_LCARS_VARS = STATIC_FALLBACK_VARS;
  }
} catch (e) {
  console.error(RED('✗ Cannot load scripts/ha-lcars-theme-vars.js:'), e.message);
  process.exit(2);
}

/**
 * Build the --lcards-* allowlist by regex-parsing paletteInjector.js.
 * Avoids dynamic import (which fails due to Vite-replaced __LCARDS_VERSION__).
 * Extracts all string keys from the GREEN_ALERT_PALETTE object literal.
 * @returns {Set<string>}
 */
function buildLcardsAllowlist() {
  const injectorPath = join(SRC, 'core/themes/paletteInjector.js');
  try {
    const src = readFileSync(injectorPath, 'utf-8');
    // Match all 'key': or "key": entries inside GREEN_ALERT_PALETTE
    const keys = new Set();
    // Capture lines of the form  'orange-dark': '#...',
    const re = /^\s+['"]([-a-z0-9]+)['"]\s*:/gm;
    for (const m of src.matchAll(re)) {
      keys.add(`lcards-${m[1]}`);
    }
    if (keys.size === 0) throw new Error('No keys found — regex may need updating');
    return keys;
  } catch (e) {
    console.warn(YELLOW(`⚠  Could not parse paletteInjector.js (${e.message}).`));
    console.warn(YELLOW('   Pass 2 (--lcards-* check) will be SKIPPED.'));
    return null;   // null = skip this pass
  }
}

/**
 * Flatten a nested object to dot-path keys (e.g. { a: { b: 1 } } → ['a.b']).
 * @param {object} obj
 * @param {string} [prefix='']
 * @returns {Set<string>}
 */
function flattenKeys(obj, prefix = '') {
  const result = new Set();
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      for (const sub of flattenKeys(v, path)) result.add(sub);
    } else {
      result.add(path);
    }
  }
  return result;
}

/**
 * Build the theme: token path allowlist from lcardsDefaultTokens.js.
 * @returns {Set<string>|null}
 */
async function buildTokenAllowlist() {
  // Try to find the default tokens file
  const candidates = [
    join(SRC, 'core/packs/themes/tokens/lcardsDefaultTokens.js'),
  ];
  for (const candidate of candidates) {
    try {
      const mod = await import(pathToFileURL(candidate).href);
      // The module may export { lcardsDefaultTokens } or { default }
      const tokens = mod.lcardsDefaultTokens ?? mod.default ?? mod;
      if (tokens && typeof tokens === 'object') {
        return flattenKeys(tokens);
      }
    } catch {
      // try next
    }
  }
  console.warn(YELLOW('⚠  Could not import lcardsDefaultTokens.js. Pass 3 (theme: paths) will be SKIPPED.'));
  return null;
}

// ─── File scanning utilities ──────────────────────────────────────────────────

/** Recursively list all .js files under a directory. */
function jsFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...jsFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      results.push(full);
    }
  }
  return results;
}

/** Split text into line objects with 1-based numbers. */
function lines(text) {
  return text.split('\n').map((content, idx) => ({ no: idx + 1, content }));
}

// ── Allowlist extensions ──────────────────────────────────────────────────────

/**
 * --lcars-* vars that do NOT appear in the HA-LCARS theme YAML but are
 * intentional user-convention variables that cards document as overridable.
 * (e.g. `var(--lcars-text-size)` shown in a schema description field means
 *  "the user can inject this from their theme YAML if they want")
 */
const LCARS_USER_CONVENTION_VARS = new Set([
  'lcars-text-size',    // user-injectable font size override convention
  'lcars-divider',      // user-injectable grid divider color
  'lcars-highlight',    // user-injectable row highlight color
  'lcars-alert-color',  // theme-browser dynamic resolved color display
]);

/**
 * --lcards-* var names (without prefix) that are intentional component layout
 * or editor spacing vars defined outside the GREEN_ALERT_PALETTE.
 */
const LCARDS_COMPONENT_VARS = new Set([
  'lcards-button-min-height',
  'lcards-button-min-width',
  'lcards-section-spacing',   // editor layout spacing token
  'lcards-icon-spacing',      // editor icon spacing token
]);

/**
 * theme: path prefixes that are component-internal or user-space namespaces.
 * Paths starting with any of these strings are silently allowed.
 */
const THEME_PATH_ALLOWED_PREFIXES = [
  'components.',       // component pack internal defaults
  'colors.grid.',      // data-grid pack colour namespace
  'colors.lcars.',     // card-specific lcars colour overrides
  'palette.',          // example pack / user palette overrides
  'colors.ui.',     // planned UI state colour namespace (active/inactive/default/unavailable)
];

/**
 * theme: paths that are colour-function calls or documentation placeholders —
 * never actual token lookups.
 */
const THEME_PATH_EXEMPTIONS = new Set([
  'lighten',    // theme:lighten(path, amount) colour function
  'darken',     // theme:darken(path, amount) colour function
  'alpha',      // theme:alpha(path, amount) colour function
  'mix',        // theme:mix(path1, path2, ratio)
  'token',      // theme:token.path documentation placeholder
]);



// Matches --lcars-<name> (capture group 1 = just the name incl. prefix)
const RE_LCARS  = /--lcars-([a-z0-9-]+)/g;
// Matches --lcards-<name>
const RE_LCARDS = /--lcards-([a-z0-9-]+)/g;
// Matches theme:<path> — path must start with a letter to avoid `theme:.` false positives
const RE_THEME  = /theme:([a-zA-Z][a-zA-Z0-9._-]*)/g;
// Animation param keys that must NOT hold theme: values
const ANIM_PARAM_KEYS = ['lead_color', 'trail_color'];
const RE_ANIM_PARAM_WITH_THEME = new RegExp(
  `(?:${ANIM_PARAM_KEYS.join('|')})\\s*:\\s*['"\`]theme:`, 'g'
);

// ─── Collectors ──────────────────────────────────────────────────────────────

class Violations {
  constructor() { this._map = new Map(); }

  add(file, lineNo, msg) {
    const rel = relative(ROOT, file);
    if (!this._map.has(rel)) this._map.set(rel, []);
    this._map.get(rel).push({ lineNo, msg });
  }

  get count() {
    let n = 0;
    for (const v of this._map.values()) n += v.length;
    return n;
  }

  print() {
    for (const [file, issues] of this._map.entries()) {
      console.log(`\n  ${BOLD(file)}`);
      for (const { lineNo, msg } of issues) {
        console.log(`    ${DIM(`L${lineNo}`)}  ${RED('✗')} ${msg}`);
      }
    }
  }
}

/**
 * Tracks all successfully validated references for --verbose output.
 * Each hit is { lineNo, ref, pass } where pass is a short label.
 */
class Hits {
  constructor() { this._map = new Map(); }  // rel-path → [{lineNo, ref, pass}]

  add(file, lineNo, ref, pass) {
    const rel = relative(ROOT, file);
    if (!this._map.has(rel)) this._map.set(rel, []);
    this._map.get(rel).push({ lineNo, ref, pass });
  }

  get count() {
    let n = 0;
    for (const v of this._map.values()) n += v.length;
    return n;
  }

  /**
   * Print a combined pass/fail report, interleaved by file then line number.
   * @param {Violations} violations
   */
  printVerbose(violations) {
    // Merge all files from both collectors
    const allFiles = new Set([
      ...this._map.keys(),
      ...violations._map.keys()
    ]);

    for (const file of [...allFiles].sort()) {
      const hits  = this._map.get(file) ?? [];
      const fails = violations._map.get(file) ?? [];
      if (hits.length === 0 && fails.length === 0) continue;

      console.log(`\n  ${BOLD(file)}`);

      // Merge & sort by line number
      const entries = [
        ...hits.map(h  => ({ lineNo: h.lineNo, ok: true,  text: `${DIM(h.pass.padEnd(8))} ${GREEN(h.ref)}` })),
        ...fails.map(f => ({ lineNo: f.lineNo, ok: false, text: f.msg })),
      ].sort((a, b) => a.lineNo - b.lineNo);

      for (const { lineNo, ok, text } of entries) {
        const mark = ok ? GREEN('✓') : RED('✗');
        console.log(`    ${DIM(`L${lineNo}`)}  ${mark} ${text}`);
      }
    }
  }
}

// ─── Pass implementations ─────────────────────────────────────────────────────

/**
 * Pass 1: --lcars-* references must be in VALID_LCARS_VARS or user convention set.
 */
function pass1_lcarsVars(file, fileLines, violations, hits) {
  for (const { no, content } of fileLines) {
    if (content.trimStart().startsWith('//') || content.trimStart().startsWith('*')) continue;

    for (const m of content.matchAll(RE_LCARS)) {
      const varName = `lcars-${m[1]}`; // e.g. lcars-alert-red
      if (!VALID_LCARS_VARS.has(varName) && !LCARS_USER_CONVENTION_VARS.has(varName)) {
        violations.add(file, no, `Unknown --lcars var: ${YELLOW(`--${varName}`)}`);
      } else if (hits) {
        hits.add(file, no, `--${varName}`, 'lcars');
      }
    }
  }
}

/**
 * Pass 2: --lcards-* references must be in palette keys or the component vars set.
 * Names ending in '-' are dynamic template-literal patterns — skip them.
 */
function pass2_lcardsVars(file, fileLines, validLcards, violations, hits) {
  for (const { no, content } of fileLines) {
    if (content.trimStart().startsWith('//') || content.trimStart().startsWith('*')) continue;

    for (const m of content.matchAll(RE_LCARDS)) {
      const varName = `lcards-${m[1]}`; // e.g. lcards-orange-dark
      // Skip dynamic patterns: regex match ends mid-name (trailing '-' means template literal)
      if (varName.endsWith('-')) continue;
      if (validLcards.has(varName) || LCARDS_COMPONENT_VARS.has(varName)) {
        if (hits) hits.add(file, no, `--${varName}`, 'lcards');
      } else {
        violations.add(file, no, `Unknown --lcards var: ${YELLOW(`--${varName}`)}`);
      }
    }
  }
}

/**
 * Pass 3: theme:<path> references must resolve to a known token path.
 * Paths in THEME_PATH_ALLOWED_PREFIXES or THEME_PATH_EXEMPTIONS are
 * component-internal or documentation — always allowed.
 */
function pass3_themePaths(file, fileLines, tokenPaths, violations, hits) {
  for (const { no, content } of fileLines) {
    if (content.trimStart().startsWith('//') || content.trimStart().startsWith('*')) continue;

    for (const m of content.matchAll(RE_THEME)) {
      const path = m[1];
      // Skip colour functions (theme:lighten, theme:darken, etc.)
      // and documentation placeholder paths
      if (THEME_PATH_EXEMPTIONS.has(path.split('.')[0].split('(')[0])) continue;
      // Allow component-internal and documentation namespaces
      if (THEME_PATH_ALLOWED_PREFIXES.some(prefix => path.startsWith(prefix))) {
        if (hits) hits.add(file, no, `theme:${path}`, 'theme~');
        continue;
      }
      if (tokenPaths.has(path)) {
        if (hits) hits.add(file, no, `theme:${path}`, 'theme');
      } else {
        violations.add(file, no, `Unknown theme: path: ${YELLOW(`theme:${path}`)}`);
      }
    }
  }
}

/**
 * Pass 4: theme: values must NOT appear in animation param keys
 * (lead_color, trail_color) because WAAPI does not run ThemeTokenResolver.
 */
function pass4_animationParams(file, fileLines, violations) {
  for (const { no, content } of fileLines) {
    if (content.trimStart().startsWith('//') || content.trimStart().startsWith('*')) continue;

    if (RE_ANIM_PARAM_WITH_THEME.test(content)) {
      violations.add(
        file, no,
        `theme: token in animation param — use a concrete CSS var() instead. ` +
        `(theme: tokens are NOT evaluated by WAAPI keyframe engine)`
      );
    }
    RE_ANIM_PARAM_WITH_THEME.lastIndex = 0;  // reset stateful regex
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(BOLD('\n🔍 LCARdS CSS Variable Validator'));
  console.log(DIM(`   src: ${SRC}`));
  if (VERBOSE) console.log(DIM('   mode: verbose (showing all validated references)'));
  console.log();

  // Build allowlists
  const validLcards = buildLcardsAllowlist();
  const tokenPaths  = await buildTokenAllowlist();

  const files = jsFiles(SRC);
  const violations = new Violations();
  const hits = VERBOSE ? new Hits() : null;

  let p1 = 0, p2 = 0, p3 = 0, p4 = 0;
  let h1 = 0, h2 = 0, h3 = 0;

  for (const file of files) {
    const text = readFileSync(file, 'utf-8');
    const fileLines = lines(text);

    const before = violations.count;
    const hitsBefore = hits ? hits.count : 0;

    pass1_lcarsVars(file, fileLines, violations, hits);
    const afterP1 = violations.count;
    const hitsAfterP1 = hits ? hits.count : 0;

    if (validLcards) pass2_lcardsVars(file, fileLines, validLcards, violations, hits);
    const afterP2 = violations.count;
    const hitsAfterP2 = hits ? hits.count : 0;

    if (tokenPaths) pass3_themePaths(file, fileLines, tokenPaths, violations, hits);
    const afterP3 = violations.count;
    const hitsAfterP3 = hits ? hits.count : 0;

    pass4_animationParams(file, fileLines, violations);
    const afterP4 = violations.count;

    p1 += afterP1 - before;
    p2 += afterP2 - afterP1;
    p3 += afterP3 - afterP2;
    p4 += afterP4 - afterP3;
    if (hits) {
      h1 += hitsAfterP1 - hitsBefore;
      h2 += hitsAfterP2 - hitsAfterP1;
      h3 += hitsAfterP3 - hitsAfterP2;
    }
  }

  // ── Report ─────────────────────────────────────────────────────────────────
  const total = violations.count;

  if (VERBOSE) {
    // Verbose: print full interleaved pass/fail report first
    console.log(BOLD('📋 Full reference audit:'));
    hits.printVerbose(violations);
    console.log();
  }

  if (total === 0) {
    console.log(GREEN(`✅ All CSS variable references are valid! (${files.length} files checked)`));
    if (VERBOSE && hits) {
      console.log(DIM(`   ${hits.count} reference(s) validated:`));
      if (h1) console.log(DIM(`     --lcars-*   ${h1}  ✓`));
      if (h2) console.log(DIM(`     --lcards-*  ${h2}  ✓`));
      if (h3) console.log(DIM(`     theme:      ${h3}  ✓`));
    }
    console.log();

    const skipped = [];
    if (!validLcards) skipped.push('Pass 2 (--lcards-*)');
    if (!tokenPaths)  skipped.push('Pass 3 (theme: paths)');
    if (skipped.length) {
      console.log(YELLOW(`   Note: ${skipped.join(', ')} were skipped (import failed).\n`));
    }
    process.exit(0);
  }

  if (!VERBOSE) {
    // Non-verbose: print violations grouped by file (verbose already printed above)
    console.log(RED(`\n✗ ${total} violation(s) found in ${files.length} files:\n`));
    violations.print();
  } else {
    console.log(RED(`✗ ${total} violation(s) found in ${files.length} files`));
  }

  // Summary by pass
  const totalValid = hits ? hits.count : null;
  console.log(`\n  ${BOLD('Summary by pass:')}`);
  if (totalValid !== null) {
    if (h1 || p1) console.log(`    Pass 1 (--lcars-*  allowlist):        ${GREEN(h1)} valid  ${p1 ? RED(`${p1} violation(s)`) : ''}`);
    if (h2 || p2) console.log(`    Pass 2 (--lcards-* allowlist):        ${GREEN(h2)} valid  ${p2 ? RED(`${p2} violation(s)`) : ''}`);
    if (h3 || p3) console.log(`    Pass 3 (theme: token paths):          ${GREEN(h3)} valid  ${p3 ? RED(`${p3} violation(s)`) : ''}`);
    if (p4)       console.log(`    Pass 4 (theme: in animation params):  ${RED(`${p4} violation(s)`)}`);
  } else {
    if (p1) console.log(`    Pass 1 (--lcars-*  allowlist):        ${RED(p1)}`);
    if (p2) console.log(`    Pass 2 (--lcards-* allowlist):        ${RED(p2)}`);
    if (p3) console.log(`    Pass 3 (theme: token paths):          ${RED(p3)}`);
    if (p4) console.log(`    Pass 4 (theme: in animation params):  ${RED(p4)}`);
  }

  const skipped = [];
  if (!validLcards) skipped.push('Pass 2 (--lcards-*)');
  if (!tokenPaths)  skipped.push('Pass 3 (theme: paths)');
  if (skipped.length) {
    console.log(YELLOW(`\n   Note: ${skipped.join(', ')} were skipped (import failed).`));
  }

  console.log(`\n  Tip: all --lcars-* names must be in ${BOLD('scripts/ha-lcars-theme-vars.js')}`);
  console.log(`       all --lcards-* names must be in ${BOLD('src/core/themes/paletteInjector.js')}`);
  console.log(`       all theme: paths must exist in  ${BOLD('src/core/packs/themes/tokens/lcardsDefaultTokens.js')}\n`);

  process.exit(1);
}

main().catch(e => {
  console.error(RED('\n✗ Validator crashed:'), e);
  process.exit(2);
});
