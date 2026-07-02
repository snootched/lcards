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

const TONE_SUFFIX = {
  5: 'darkest', 10: '10', 20: 'dark', 30: 'medium-dark', 40: '',
  50: '50', 60: '60', 70: 'medium-light', 80: 'light', 90: 'lightest', 95: '95',
};

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

// HA semantic "role" → HA color-slot key (used to look up the family map)
const ROLE_TO_SLOT = {
  primary: 'primary', neutral: 'neutral', disabled: 'neutral',
  danger: 'red', warning: 'orange', success: 'green',
};

const WHITE = '#ffffff';
const BLACK = '#000000';

function familyFor(profile, role) {
  return PROFILES[profile][ROLE_TO_SLOT[role]];
}

// ─── HA's own tone-index convention, transcribed verbatim from ───────────
// frontend/src/resources/theme/color/semantic.globals.ts
// (light block: lines 9-179, dark block: lines 182-333)

const BORDER = {
  // role: { light: {quiet,normal,loud}, dark: {...} (only overridden keys) }
  primary: { light: { quiet: 90, normal: 70, loud: 40 }, dark: {} },
  neutral: { light: { quiet: 90, normal: 60, loud: 40 }, dark: { quiet: 40, normal: 50, loud: 70 } },
  danger: { light: { quiet: 90, normal: 70, loud: 40 }, dark: { normal: 50, loud: 50 } },
  warning: { light: { quiet: 90, normal: 70, loud: 40 }, dark: { normal: 50, loud: 50 } },
  success: { light: { quiet: 90, normal: 70, loud: 40 }, dark: {} },
};

const ON = {
  // role: { light: {quiet,normal,loud}, dark: {...} }
  // loud entries are the literal string 'WHITE' except on-disabled (tone-based)
  primary: { light: { quiet: 50, normal: 40, loud: 'WHITE' }, dark: { quiet: 70, normal: 60 } },
  neutral: { light: { quiet: 50, normal: 40, loud: 'WHITE' }, dark: { quiet: 70, normal: 60, loud: 'WHITE' } },
  disabled: { light: { quiet: 80, normal: 70, loud: 95 }, dark: { quiet: 40, normal: 50, loud: 50 } },
  danger: { light: { quiet: 50, normal: 40, loud: 'WHITE' }, dark: { quiet: 70, normal: 60, loud: 'WHITE' } },
  warning: { light: { quiet: 50, normal: 40, loud: 'WHITE' }, dark: { quiet: 70, normal: 60, loud: 'WHITE' } },
  success: { light: { quiet: 50, normal: 40, loud: 'WHITE' }, dark: { quiet: 70, normal: 60, loud: 'WHITE' } },
};

const FILL = {
  // role: { light: {quiet:{resting,hover,active?}, normal:{...}, loud:{...}}, dark: {...} }
  primary: {
    light: { quiet: { resting: 95, hover: 90, active: 95 }, normal: { resting: 90, hover: 80, active: 90 }, loud: { resting: 40, hover: 30, active: 40 } },
    dark: { quiet: { resting: 5, hover: 10, active: 5 }, normal: { resting: 10, hover: 20, active: 10 } }, // loud not redefined in dark
  },
  neutral: {
    light: { quiet: { resting: 95, hover: 90, active: 95 }, normal: { resting: 90, hover: 80, active: 90 }, loud: { resting: 40, hover: 30, active: 40 } },
    dark: { quiet: { resting: 5, hover: 10, active: 5 /* HA source: neutral-00, substituted */ }, normal: { resting: 10, hover: 20, active: 10 }, loud: { resting: 60, hover: 70, active: 60 } },
  },
  disabled: {
    light: { quiet: { resting: 95, hover: 90 }, normal: { resting: 95, hover: 90 }, loud: { resting: 80, hover: 70 } },
    dark: { quiet: { resting: 10, hover: 20 }, normal: { resting: 20, hover: 30 }, loud: { resting: 30, hover: 40 } },
  },
  danger: {
    light: { quiet: { resting: 95, hover: 90, active: 95 }, normal: { resting: 90, hover: 80, active: 90 }, loud: { resting: 50, hover: 40, active: 50 } },
    dark: { quiet: { resting: 5, hover: 10, active: 5 }, normal: { resting: 10, hover: 20, active: 10 }, loud: { resting: 40, hover: 30, active: 40 } },
  },
  warning: {
    light: { quiet: { resting: 95, hover: 90, active: 95 }, normal: { resting: 90, hover: 80, active: 90 }, loud: { resting: 70, hover: 50, active: 70 } }, // HA's own orange exception: loud=70 not 40/50
    dark: { quiet: { resting: 5, hover: 10, active: 5 }, normal: { resting: 10, hover: 20, active: 10 }, loud: { resting: 40, hover: 30, active: 40 } },
  },
  success: {
    light: { quiet: { resting: 95, hover: 90, active: 95 }, normal: { resting: 90, hover: 80, active: 90 }, loud: { resting: 50, hover: 40, active: 50 } },
    dark: { quiet: { resting: 5, hover: 10, active: 5 }, normal: { resting: 10, hover: 20, active: 10 }, loud: { resting: 40, hover: 30, active: 40 } },
  },
};

// Surfaces & form-background reference neutral tones or white/black directly.
const SURFACE = {
  light: {
    default: 'WHITE', low: { role: 'neutral', tone: 95 }, lower: { role: 'neutral', tone: 90 },
    'default-inverted': { role: 'neutral', tone: 10 }, 'low-inverted': { role: 'neutral', tone: 5 }, 'lower-inverted': 'BLACK',
    'on-surface-default': { role: 'neutral', tone: 5 },
  },
  dark: {
    default: { role: 'neutral', tone: 10 }, low: { role: 'neutral', tone: 5 }, lower: 'BLACK',
    'default-inverted': 'WHITE', 'low-inverted': { role: 'neutral', tone: 95 },
    'lower-inverted': { role: 'neutral', tone: 90 }, // HA source: --ha-color-90 (dangling), substituted with neutral-90
    'on-surface-default': { role: 'neutral', tone: 95 },
  },
};

const FORM_BACKGROUND_TONES = {
  light: { hover: 90, disabled: 80 },
  dark: { hover: 30, disabled: 20 },
};

// ─── Resolution + Phase 2 WCAG validation ─────────────────────────────────

function wcagContrast(hex1, hex2) {
  const luminance = (hex) => {
    hex = hex.replace('#', '');
    const [r, g, b] = [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const l1 = luminance(hex1), l2 = luminance(hex2);
  const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (lighter + 0.05) / (darker + 0.05);
}

function resolveEndpoint(profile, role, spec) {
  if (spec === 'WHITE') return { var: `var(--white-color)`, hex: WHITE };
  if (spec === 'BLACK') return { var: `var(--black-color)`, hex: BLACK };
  const family = familyFor(profile, role);
  return { var: toneVar(family, spec), hex: toneHex(family, spec) };
}


const AA_THRESHOLD = 4.5;
const report = [];

const fillLookupCache = new Map();

/**
 * Resolves every fill-{tier}-{state} value for one (profile, role, mode)
 * straight from the palette — no correction, just the mechanical lookup.
 */
function getFillLookup(profile, role, mode) {
  const key = `${profile}:${role}:${mode}`;
  if (fillLookupCache.has(key)) return fillLookupCache.get(key);

  const states = role === 'disabled' ? ['resting', 'hover'] : ['resting', 'hover', 'active'];
  const result = {};

  for (const tier of ['loud', 'normal', 'quiet']) {
    const tierData = FILL[role][mode]?.[tier] ?? FILL[role].light[tier];
    result[tier] = {};
    for (const state of states) {
      const spec = tierData[state] !== undefined ? tierData[state] : FILL[role].light[tier][state];
      result[tier][state] = resolveEndpoint(profile, role, spec);
    }
  }

  fillLookupCache.set(key, result);
  return result;
}

const onCache = new Map();

function resolveOnEntry(profile, role, mode, tier) {
  const key = `${profile}:${role}:${mode}:${tier}`;
  if (onCache.has(key)) return onCache.get(key);

  const modeData = ON[role][mode]?.[tier] !== undefined ? ON[role][mode] : ON[role].light;
  const spec = modeData[tier] !== undefined ? modeData[tier] : ON[role].light[tier];
  const mechanical = resolveEndpoint(profile, role === 'disabled' ? 'disabled' : role, spec);

  // Phase 2: validate against the paired fill-*-resting background for this
  // tier. Where the mechanical default fails AA, substitute whichever of
  // white/black gives the better contrast.
  const fillHex = getFillLookup(profile, role, mode)[tier].resting.hex;

  const ratio = wcagContrast(mechanical.hex, fillHex);
  let finalVal = mechanical;
  let note = `${ratio.toFixed(2)}:1 OK`;

  if (ratio < AA_THRESHOLD) {
    const whiteRatio = wcagContrast(WHITE, fillHex);
    const blackRatio = wcagContrast(BLACK, fillHex);
    finalVal = whiteRatio >= blackRatio
      ? { var: `var(--white-color)`, hex: WHITE }
      : { var: `var(--black-color)`, hex: BLACK };
    note = `${ratio.toFixed(2)}:1 FAIL → substituted ${finalVal.hex} (${Math.max(whiteRatio, blackRatio).toFixed(2)}:1)`;
  }

  const result = { var: finalVal.var, hex: finalVal.hex };
  onCache.set(key, result);
  report.push({ profile, mode, group: 'on', role, tier, note });
  return result;
}

function resolveOnValue(profile, role, mode, tier) {
  return resolveOnEntry(profile, role, mode, tier).var;
}

function resolveFillValue(profile, role, mode, tier, state) {
  return getFillLookup(profile, role, mode)[tier][state].var;
}

function resolveBorderValue(profile, role, mode, tier) {
  const spec = BORDER[role][mode]?.[tier] !== undefined ? BORDER[role][mode][tier] : BORDER[role].light[tier];
  return resolveEndpoint(profile, role, spec).var;
}

function resolveSurfaceValue(profile, mode, key) {
  const spec = SURFACE[mode][key];
  if (spec === 'WHITE') return `var(--white-color)`;
  if (spec === 'BLACK') return `var(--black-color)`;
  const family = familyFor(profile, spec.role);
  return toneVar(family, spec.tone);
}

// ─── Build YAML block per profile per mode ────────────────────────────────

const ROLES = ['primary', 'neutral', 'disabled', 'danger', 'warning', 'success'];
const BORDER_ROLES = ['primary', 'neutral', 'danger', 'warning', 'success'];
const TIERS = ['quiet', 'normal', 'loud'];

function buildModeBlock(profile, mode) {
  const lines = [];
  lines.push(`    # HA semantic tokens — on-* (text/icon-on-fill contrast)`);
  for (const role of ROLES) {
    for (const tier of TIERS) {
      lines.push(`    ha-color-on-${role}-${tier}: ${resolveOnValue(profile, role, mode, tier)}`);
    }
  }
  lines.push(`    # HA semantic tokens — fill-*`);
  for (const role of ROLES) {
    for (const tier of TIERS) {
      const states = role === 'disabled' ? ['resting', 'hover'] : ['resting', 'hover', 'active'];
      for (const state of states) {
        lines.push(`    ha-color-fill-${role}-${tier}-${state}: ${resolveFillValue(profile, role, mode, tier, state)}`);
      }
    }
  }
  lines.push(`    # HA semantic tokens — border-*`);
  for (const role of BORDER_ROLES) {
    for (const tier of TIERS) {
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
  lines.push(`    ha-color-form-background-hover: ${resolveEndpoint(profile, 'neutral', FORM_BACKGROUND_TONES[mode].hover).var}`);
  lines.push(`    ha-color-form-background-disabled: ${resolveEndpoint(profile, 'neutral', FORM_BACKGROUND_TONES[mode].disabled).var}`);
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

if (WRITE) {
  for (const profile of Object.keys(PROFILES)) {
    const filePath = join(HA_LCARS_ROOT, 'src/themes', `lcards_picard_${profile}.yaml`);
    let content = readFileSync(filePath, 'utf-8');
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
