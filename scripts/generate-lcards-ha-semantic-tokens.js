#!/usr/bin/env node
/**
 * @fileoverview LCARdS HA Semantic Token Generator
 *
 * Derives the `--ha-color-{on,fill,border,surface}-*` and the missing
 * `--ha-color-form-background-{hover,disabled}` values for both HA-LCARS
 * Picard theme profiles.
 *
 * Neither profile currently sets any of these — HA computes them from its
 * own baked-in tone-index convention (e.g. light-mode `on-primary-normal`
 * always points at `primary-40`), which silently assumes a lightness
 * relationship within the palette ramp that isn't guaranteed once a theme
 * substitutes its own hues. This generator:
 *
 *   1. Applies HA's own tone-index convention verbatim (read directly from
 *      frontend/src/resources/theme/color/semantic.globals.ts, both the
 *      light and dark `html { ... }` blocks) — "Phase 1: mechanical default".
 *   2. Resolves each value through the *actual* profile's 11-stop LCARdS
 *      palette (paletteInjector.js `GREEN_ALERT_PALETTE`, as repointed in
 *      Step 2) and WCAG-contrast-checks every (fill, on) tier pairing.
 *      Where the mechanical default fails 4.5:1, substitutes whichever of
 *      white/black gives the better contrast — "Phase 2: validate contrast,
 *      don't trust". This is what catches the reported red-profile
 *      unreadable-button-text bug: HA's convention assumes any hue survives
 *      at tone-40/50, which orange does not.
 *
 * Two known upstream quirks in HA's own source are intentionally NOT
 * reproduced verbatim (documented inline at each occurrence):
 *   - `--ha-color-neutral-00` (dark fill-neutral-quiet-active) references a
 *     tone that doesn't exist in HA's 05-95 scale — substituted with 05.
 *   - `--ha-color-surface-lower-inverted: var(--ha-color-90)` (dark) is a
 *     dangling reference (missing palette-family segment) — substituted
 *     with the evidently-intended `neutral-90`.
 *
 * Usage:
 *   node scripts/generate-lcards-ha-semantic-tokens.js            dry-run,
 *                                                                  prints
 *                                                                  YAML +
 *                                                                  contrast
 *                                                                  report
 *   node scripts/generate-lcards-ha-semantic-tokens.js --write     also
 *                                                                  patches
 *                                                                  both
 *                                                                  profile
 *                                                                  YAML files
 *
 * @module scripts/generate-lcards-ha-semantic-tokens
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  SEMANTIC_ROLES, BORDER_ROLES, SEMANTIC_TIERS, SURFACE, TONE_SUFFIX, ROLE_TO_SLOT,
  resolveOnEntry, resolveFillEntry, resolveBorderEntry, resolveSurfaceEntry, resolveFormBackgroundEntry,
} from '../src/core/themes/themeGeneratorCore.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const INJECTOR_PATH = join(ROOT, 'src/core/themes/paletteInjector.js');
const HA_LCARS_ROOT = join(ROOT, '..', 'ha-lcars');

const ARGS = new Set(process.argv.slice(2));
const WRITE = ARGS.has('--write');

// ─── Parse the full LCARdS palette (all 11 tones + moonlight) ─────────────

function parsePalette(source) {
  const palette = {};
  const re = /^\s*['"]([a-z]+(?:-[a-z0-9-]+)?)['"]\s*:\s*['"](#[0-9a-fA-F]{6})['"]/gm;
  for (const m of source.matchAll(re)) {
    palette[m[1]] = m[2];
  }
  return palette;
}

const injectorSource = readFileSync(INJECTOR_PATH, 'utf-8');
const PALETTE = parsePalette(injectorSource);

function toneKey(family, tone) {
  const suffix = TONE_SUFFIX[tone];
  return suffix ? `${family}-${suffix}` : family;
}

function toneVar(family, tone) {
  return `var(--lcards-${toneKey(family, tone)})`;
}

function toneHex(family, tone) {
  const key = toneKey(family, tone);
  const hex = PALETTE[key];
  if (!hex) throw new Error(`No palette value for ${key}`);
  return hex;
}

// ─── Profile → LCARdS family mapping (matches Step 2's ramp repoint) ──────

const PROFILES = {
  red: { primary: 'orange', neutral: 'gray', orange: 'yellow', red: 'orange', green: 'green' },
  blue: { primary: 'blue', neutral: 'gray', orange: 'yellow', red: 'orange', green: 'green' },
};

const WHITE = '#ffffff';
const BLACK = '#000000';

function familyFor(profile, role) {
  return PROFILES[profile][ROLE_TO_SLOT[role]];
}

// ─── HA's own tone-index convention ───────────────────────────────────────
// Transcribed verbatim from frontend/src/resources/theme/color/semantic.globals.ts
// (light block: lines 9-179, dark block: lines 182-333) — now lives in
// themeGeneratorCore.js (BORDER/ON/FILL/SURFACE/FORM_BACKGROUND_TONES),
// shared with the in-app Theme Generator UI. This script supplies the
// family-lookup + var()/hex resolution it's parameterized on.

const AA_THRESHOLD = 4.5;
const report = [];

function resolveEndpoint(profile, role, spec) {
  if (spec === 'WHITE') return { var: `var(--white-color)`, hex: WHITE };
  if (spec === 'BLACK') return { var: `var(--black-color)`, hex: BLACK };
  const family = familyFor(profile, role);
  return { var: toneVar(family, spec), hex: toneHex(family, spec) };
}

/** Builds the `resolveTone(role, spec)` callback themeGeneratorCore's resolvers expect, closed over one profile. */
function makeResolveTone(profile) {
  return (role, spec) => resolveEndpoint(profile, role, spec);
}

/** Builds the `resolveFillResting(role, tier)` callback resolveOnEntry needs, closed over one (profile, mode). */
function makeResolveFillResting(resolveTone, profile, mode) {
  return (role, tier) => resolveFillEntry(resolveTone, role, mode, tier, 'resting');
}

const onCache = new Map();

function resolveOnValue(profile, role, mode, tier) {
  const key = `${profile}:${role}:${mode}:${tier}`;
  if (onCache.has(key)) return onCache.get(key);

  const resolveTone = makeResolveTone(profile);
  const resolveFillResting = makeResolveFillResting(resolveTone, profile, mode);
  // card-background-color is role:'neutral',tone:20 (see LEGACY_FIELD_DEFS in the in-app
  // generator) — the real backdrop "Normal" text sits against on Plain/Outlined ha-button
  // appearances, which share that text token with Filled but render with no fill behind them.
  const ambientBgHex = resolveTone('neutral', 20).hex;
  const { var: varName, hex, corrected, mechanicalRatio, finalRatio } = resolveOnEntry(resolveTone, resolveFillResting, role, mode, tier, ambientBgHex);

  const note = corrected
    ? `${mechanicalRatio.toFixed(2)}:1 FAIL → substituted ${hex} (${finalRatio.toFixed(2)}:1)`
    : `${finalRatio.toFixed(2)}:1 OK`;
  report.push({ profile, mode, group: 'on', role, tier, note });

  onCache.set(key, varName);
  return varName;
}

function resolveFillValue(profile, role, mode, tier, state) {
  return resolveFillEntry(makeResolveTone(profile), role, mode, tier, state).var;
}

function resolveBorderValue(profile, role, mode, tier) {
  return resolveBorderEntry(makeResolveTone(profile), role, mode, tier).var;
}

function resolveSurfaceValue(profile, mode, key) {
  return resolveSurfaceEntry(makeResolveTone(profile), mode, key).var;
}

// ─── Numeric palette-stop block (top-level, not mode-scoped) ──────────────
// The four LCARdS-specific stops per family (-10/-50/-60/-95) aren't part of
// ha-lcars's own shared &lcars-variables — they're declared directly in each
// profile file so the profile stays a self-contained drop-in with zero
// shared ha-lcars source changes. Literal hex (not var() references), since
// these ARE the source values — PALETTE already holds them, parsed from
// paletteInjector.js.
const NUMERIC_FAMILIES = ['orange', 'gray', 'blue', 'green', 'yellow'];
const NUMERIC_STOPS = [10, 50, 60, 95];

function buildPaletteStopsBlock() {
  const lines = [];
  for (const family of NUMERIC_FAMILIES) {
    for (const stop of NUMERIC_STOPS) {
      const key = `${family}-${stop}`;
      const hex = PALETTE[key];
      if (!hex) throw new Error(`No palette value for ${key}`);
      lines.push(`lcards-${key}: "${hex}"`);
    }
  }
  return lines.join('\n');
}

// ─── Build YAML block per profile per mode ────────────────────────────────
// Role/tier rosters (SEMANTIC_ROLES, BORDER_ROLES, SEMANTIC_TIERS) imported
// from themeGeneratorCore.js.

function buildModeBlock(profile, mode) {
  const lines = [];
  lines.push(`    # HA semantic tokens — on-* (text/icon-on-fill contrast)`);
  for (const role of SEMANTIC_ROLES) {
    for (const tier of SEMANTIC_TIERS) {
      lines.push(`    ha-color-on-${role}-${tier}: ${resolveOnValue(profile, role, mode, tier)}`);
    }
  }
  lines.push(`    # HA semantic tokens — fill-*`);
  for (const role of SEMANTIC_ROLES) {
    for (const tier of SEMANTIC_TIERS) {
      const states = role === 'disabled' ? ['resting', 'hover'] : ['resting', 'hover', 'active'];
      for (const state of states) {
        lines.push(`    ha-color-fill-${role}-${tier}-${state}: ${resolveFillValue(profile, role, mode, tier, state)}`);
      }
    }
  }
  lines.push(`    # HA semantic tokens — border-*`);
  for (const role of BORDER_ROLES) {
    for (const tier of SEMANTIC_TIERS) {
      lines.push(`    ha-color-border-${role}-${tier}: ${resolveBorderValue(profile, role, mode, tier)}`);
    }
  }
  lines.push(`    # HA semantic tokens — surface-*`);
  // Note: 'on-surface-default' maps to --ha-color-on-surface-default, not
  // --ha-color-surface-on-surface-default — handled explicitly below.
  for (const key of Object.keys(SURFACE[mode])) {
    const varName = key === 'on-surface-default' ? 'ha-color-on-surface-default' : `ha-color-surface-${key}`;
    lines.push(`    ${varName}: ${resolveSurfaceValue(profile, mode, key)}`);
  }
  lines.push(`    # HA semantic tokens — form-background (hover/disabled; base form-background already set)`);
  lines.push(`    ha-color-form-background-hover: ${resolveFormBackgroundEntry(makeResolveTone(profile), mode, 'hover').var}`);
  lines.push(`    ha-color-form-background-disabled: ${resolveFormBackgroundEntry(makeResolveTone(profile), mode, 'disabled').var}`);
  return lines.join('\n');
}

// ─── Main ───────────────────────────────────────────────────────────────

for (const profile of Object.keys(PROFILES)) {
  console.log(`\n${'='.repeat(70)}\n${profile.toUpperCase()} PROFILE\n${'='.repeat(70)}`);
  for (const mode of ['light', 'dark']) {
    console.log(`\n  --- ${mode} ---`);
    console.log(buildModeBlock(profile, mode));
  }
}

console.log(`\n${'='.repeat(70)}\nPhase 2 contrast report (on-* vs paired fill-*-resting, AA 4.5:1)\n${'='.repeat(70)}`);
const fails = report.filter(r => r.note.includes('FAIL'));
for (const r of report) {
  if (r.note.includes('FAIL')) console.log(`  [${r.profile}/${r.mode}] on-${r.role}-${r.tier}: ${r.note}`);
}
console.log(`\n${report.length} pairs checked, ${fails.length} substituted.`);

const BLOCK_START = '    # HA semantic tokens — on-* (text/icon-on-fill contrast)';
const BLOCK_END_PREFIX = '    ha-color-form-background-disabled:';

const STOPS_BLOCK_START = '# LCARdS 11-stop palette — numeric stops not already covered';
const STOPS_ANCHOR = 'lcars-settings-card-color:';
const STOPS_END_PREFIX = '# HA Core tonal palette';

if (WRITE) {
  for (const profile of Object.keys(PROFILES)) {
    const filePath = join(HA_LCARS_ROOT, 'src/themes', `lcards_picard_${profile}.yaml`);
    let content = readFileSync(filePath, 'utf-8');

    // Numeric palette-stop block: insert/replace right after the
    // lcars-settings-card-color line, before "# HA Core tonal palette".
    const stopsAnchorIdx = content.indexOf(STOPS_ANCHOR);
    if (stopsAnchorIdx === -1) {
      console.error(`Could not find "${STOPS_ANCHOR}" in ${filePath}`);
      process.exit(1);
    }
    const afterStopsAnchorLine = content.indexOf('\n', stopsAnchorIdx) + 1;
    const afterBlankLine = content.indexOf('\n', afterStopsAnchorLine) + 1; // skip the blank separator line
    const insertionPoint = content.startsWith('\n', afterStopsAnchorLine) ? afterBlankLine : afterStopsAnchorLine;

    if (content.startsWith(STOPS_BLOCK_START, insertionPoint)) {
      const endLineStart = content.indexOf(STOPS_END_PREFIX, insertionPoint);
      content = content.slice(0, insertionPoint) + content.slice(endLineStart);
    }

    const stopsComment = [
      '# LCARdS 11-stop palette — numeric stops not already covered by the',
      '# semantic-named --lcards-<family>-{darkest,dark,...,lightest} keys (defined',
      '# in ha-lcars\'s own &lcars-variables, shared across all themes). These four',
      '# per family (-10/-50/-60/-95) are LCARdS-specific extensions used only by',
      '# this profile\'s 1:1 ha-color-*-{05..95} ramp below and its semantic tokens.',
      '# Declared here (not in shared ha-lcars source) so this profile is fully',
      '# self-contained — keep in sync with lcards/src/core/themes/paletteInjector.js',
      '# GREEN_ALERT_PALETTE via lcards/scripts/generate-lcards-palette-scale.js.',
    ].join('\n');
    const stopsBlock = `${stopsComment}\n${buildPaletteStopsBlock()}\n\n`;
    content = content.slice(0, insertionPoint) + stopsBlock + content.slice(insertionPoint);

    for (const mode of ['light', 'dark']) {
      const block = buildModeBlock(profile, mode);
      const marker = `  ${mode}:`;
      const idx = content.indexOf(marker);
      if (idx === -1) {
        console.error(`Could not find "${marker}" section in ${filePath}`);
        process.exit(1);
      }
      const afterMarkerLine = content.indexOf('\n', idx) + 1;

      // Idempotency: strip any previously-inserted block (from a prior
      // --write run) before splicing the fresh one in, so re-running this
      // script is safe rather than accumulating duplicate/stale blocks.
      if (content.startsWith(BLOCK_START, afterMarkerLine)) {
        const endLineStart = content.indexOf(BLOCK_END_PREFIX, afterMarkerLine);
        const endLineEnd = content.indexOf('\n', endLineStart) + 1;
        content = content.slice(0, afterMarkerLine) + content.slice(endLineEnd);
      }

      content = content.slice(0, afterMarkerLine) + block + '\n' + content.slice(afterMarkerLine);
    }
    writeFileSync(filePath, content, 'utf-8');
    console.log(`\nPatched ${filePath}`);
  }
} else {
  console.log('\nDry run only — no files modified. Re-run with --write to apply.');
}
