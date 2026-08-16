#!/usr/bin/env node
/**
 * @fileoverview LCARdS 11-Stop Palette Scale Generator
 *
 * LCARdS's canon Picard-screen palette (paletteInjector.js `GREEN_ALERT_PALETTE`)
 * defines 7 hand-picked hex stops per hue family (darkest/dark/medium-dark/
 * medium/medium-light/light/lightest). Home Assistant's own tonal palette
 * system (`--ha-color-<family>-<tone>`) uses an 11-stop grid: 05/10/20/30/40/
 * 50/60/70/80/90/95. The two HA-LCARS Picard theme profiles currently collapse
 * the 7 LCARdS stops across all 11 HA slots by duplicating neighbors (e.g.
 * both `-05` and `-10` point at `darkest`), which loses exactly the tonal
 * resolution HA relies on for contrast decisions.
 *
 * This script computes the 4 missing interim stops (10, 50, 60, 95) per
 * family, anchored to the 7 existing canon values (which are NEVER altered —
 * they're canon Picard-screen colors). Interpolation happens in OKLCH
 * (perceptually-uniform lightness/chroma/hue), matching the space HA-LCARS's
 * own `&base` block already uses to approximate HA's real OKLCH ramp
 * generation (`color-mix(in oklch, ...)` in ha-lcars/src/preamble.yaml).
 *
 * Anchors -> HA tone slots:
 *   darkest -> 05   dark -> 20   medium-dark -> 30   medium(base) -> 40
 *   medium-light -> 70   light -> 80   lightest -> 90
 *
 * Computed gap slots:
 *   10  — interpolated between darkest(05) and dark(20)
 *   50  — interpolated between medium(40) and medium-light(70)
 *   60  — interpolated between medium(40) and medium-light(70)
 *   95  — EXTRAPOLATED beyond lightest(90) toward white (no real anchor on
 *         either side — the single highest-subjectivity value in this whole
 *         scale; review the HTML artifact carefully, fall back to aliasing
 *         95 straight to the 90/lightest value if it looks off-palette)
 *
 * Usage:
 *   node scripts/generate-lcards-palette-scale.js           dry-run: prints
 *                                                            diff-ready keys,
 *                                                            writes HTML review
 *                                                            artifact to reports/
 *   node scripts/generate-lcards-palette-scale.js --write    also patches the
 *                                                            new keys into
 *                                                            paletteInjector.js
 *
 * @module scripts/generate-lcards-palette-scale
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  hexToRgb, rgbToOklch, lerpOklch, wcagContrast,
  ANCHOR_SUFFIX_TO_TONE, TONE_ORDER,
  extrapolate95FadeToWhite, computeFullScale,
  HA_DEFAULT_MIX, computeHaDefaultScale,
} from '../src/core/themes/themeGeneratorCore.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const INJECTOR_PATH = join(ROOT, 'src/core/themes/paletteInjector.js');
const REPORT_PATH = join(ROOT, 'reports', 'palette-scale-review.html');

const ARGS = new Set(process.argv.slice(2));
const WRITE = ARGS.has('--write');

// ─── Parse canon anchors from paletteInjector.js ───────────────────────────

const FAMILIES = ['orange', 'gray', 'blue', 'green', 'yellow'];

function parseAnchors(source) {
  const anchors = {}; // { orange: { '05': '#..', '20': '#..', ... } }
  for (const family of FAMILIES) anchors[family] = {};

  // Match lines like:  'orange-darkest': '#d91604',   or   'orange': '#ff6753',
  const re = /^\s*['"]([a-z]+)(?:-([a-z-]+))?['"]\s*:\s*['"](#[0-9a-fA-F]{6})['"]/gm;
  for (const m of source.matchAll(re)) {
    const [, family, suffix = '', hex] = m;
    if (!FAMILIES.includes(family)) continue;
    if (suffix === 'medium') continue; // alias of the bare family key, skip
    if (!(suffix in ANCHOR_SUFFIX_TO_TONE)) continue;
    anchors[family][ANCHOR_SUFFIX_TO_TONE[suffix]] = hex;
  }
  return anchors;
}

// ─── Main ───────────────────────────────────────────────────────────────────
// OKLCH interpolation/extrapolation (computeFullScale et al.) now lives in
// src/core/themes/themeGeneratorCore.js, shared with the in-app Theme
// Generator UI — see that module's header for why it can't just import
// ColorUtils.js instead.

const source = readFileSync(INJECTOR_PATH, 'utf-8');
const anchors = parseAnchors(source);

const results = {}; // family -> { scale, meta }
for (const family of FAMILIES) {
  const a = anchors[family];
  const missing = Object.values(ANCHOR_SUFFIX_TO_TONE).filter(tone => !a[tone]);
  if (missing.length) {
    console.error(`Missing anchor(s) for family "${family}": tones ${missing.join(', ')} — check paletteInjector.js`);
    process.exit(1);
  }
  results[family] = computeFullScale(a);
}

// ── Print diff-ready snippet ──
console.log('// New 11-stop tone keys for GREEN_ALERT_PALETTE (paletteInjector.js)');
console.log('// Anchored tones are unchanged existing values; only 10/50/60/95 are new math.\n');
for (const family of FAMILIES) {
  const { scale, meta } = results[family];
  console.log(`  // ${family[0].toUpperCase() + family.slice(1)} — HA 11-step tone scale`);
  for (const tone of TONE_ORDER) {
    const tag = meta[tone] === 'anchor' ? '' : `  // ${meta[tone]}`;
    console.log(`  '${family}-${tone}': '${scale[tone]}',${tag}`);
  }
  console.log('');
}

// ── HA's own default generation, as a reference row ─────────────────────
// Mirrors ha-lcars/src/preamble.yaml's &base block exactly: every non-LCARdS
// theme gets this formula applied to its lcars-ui-tertiary color. Rendering
// it here (seeded from each family's own -40/base value) shows what HA would
// have generated on its own, alongside what our canon anchors actually are —
// the gap between the two rows is precisely what makes LCARdS's palette
// diverge from a "generic" ha-lcars theme.
// ── var name per tone (what actually gets referenced downstream) ────────
const TONE_TO_VARNAME = {};
for (const [suffix, tone] of Object.entries(ANCHOR_SUFFIX_TO_TONE)) TONE_TO_VARNAME[tone] = suffix || '(base)';
for (const tone of ['10', '50', '60', '95']) TONE_TO_VARNAME[tone] = tone;

// ── Button mockups: hand-built approximations of HA's <wa-button> styling ──
// (rounded pill, solid-fill "loud" variant, outlined "normal" variant), using
// HA's own real tone-index convention (frontend/.../semantic.globals.ts) for
// which fill/text tone pairs a button actually uses — see
// generate-lcards-ha-semantic-tokens.js, which this intentionally duplicates
// a small slice of so this report stays a standalone, independently-runnable
// script. wa-button itself isn't renderable outside a live HA page; this is
// a static approximation for a quick gut-check, not a pixel-perfect preview.
const MOCKUP_PROFILE_FAMILIES = {
  red: { primary: 'orange', danger: 'orange', warning: 'yellow', success: 'green' },
  blue: { primary: 'blue', danger: 'orange', warning: 'yellow', success: 'green' },
};
const MOCKUP_TONES = {
  primary: {
    light: { loud: { fill: 40, on: 'WHITE' }, normal: { fill: 90, on: 40 } },
    dark: { loud: { fill: 40, on: 'WHITE' }, normal: { fill: 10, on: 60 } },
  },
  danger: {
    light: { loud: { fill: 50, on: 'WHITE' }, normal: { fill: 90, on: 40 } },
    dark: { loud: { fill: 40, on: 'WHITE' }, normal: { fill: 10, on: 60 } },
  },
  warning: { // HA's own orange exception: light-loud fill tone is 70, not 40/50
    light: { loud: { fill: 70, on: 'WHITE' }, normal: { fill: 90, on: 40 } },
    dark: { loud: { fill: 40, on: 'WHITE' }, normal: { fill: 10, on: 60 } },
  },
  success: {
    light: { loud: { fill: 50, on: 'WHITE' }, normal: { fill: 90, on: 40 } },
    dark: { loud: { fill: 40, on: 'WHITE' }, normal: { fill: 10, on: 60 } },
  },
};

/** Looks up a resolved tone hex from the already-computed 11-stop scale (results). */
function toneHex(family, toneNum) {
  const key = String(toneNum).padStart(2, '0');
  return results[family].scale[key];
}

function pickOnColor(fillHex, mechanicalHex) {
  const ratio = wcagContrast(mechanicalHex, fillHex);
  if (ratio >= 4.5) return { hex: mechanicalHex, corrected: false, ratio };
  const whiteRatio = wcagContrast('#ffffff', fillHex);
  const blackRatio = wcagContrast('#000000', fillHex);
  const hex = whiteRatio >= blackRatio ? '#ffffff' : '#000000';
  return { hex, corrected: true, ratio: Math.max(whiteRatio, blackRatio) };
}

function mockupButton(label, profile, role, mode, tier, familyOverride) {
  const family = familyOverride ?? MOCKUP_PROFILE_FAMILIES[profile][role];
  const spec = MOCKUP_TONES[role][mode][tier];
  const fillHex = toneHex(family, spec.fill);
  const mechanicalOnHex = spec.on === 'WHITE' ? '#ffffff' : toneHex(family, spec.on);
  const on = pickOnColor(fillHex, mechanicalOnHex);
  // Both "loud" and "normal" are solid fills in HA's real token system — they
  // differ only in which (fill tone, on tone) pair they use, not in whether
  // the button is filled vs. outlined. An earlier version of this mockup
  // rendered "normal" as transparent-background + fill-tone-colored text,
  // which is not how WA buttons actually work and produced misleadingly
  // unreadable previews (dark fill tone as text with no background under it).
  const style = `background:${fillHex};color:${on.hex};border:2px solid ${fillHex}`;
  const badge = on.corrected ? ' <span class="corrected-badge">corrected</span>' : '';
  return `<button class="mock-btn" style="${style}">${label}${badge}</button>
    <div class="mock-caption">${on.ratio.toFixed(2)}:1</div>`;
}

// ── HTML review artifact ──
function swatchCell(hex, tone, varSuffix, tag) {
  const textColor = wcagContrast(hex, '#000000') >= wcagContrast(hex, '#ffffff') ? '#000' : '#fff';
  const border = tag === 'anchor' ? '6px solid #444'
    : tag === 'extrapolated' ? '6px dashed #f00'
    : tag === 'not-shipped' ? '6px dashed #666'
    : tag === 'ha-default' ? '6px solid #39f'
    : '6px dotted #999';
  const varLabel = varSuffix !== undefined
    ? `<div class="varname">${varSuffix === '(base)' ? '(bare key)' : '-' + varSuffix}</div>`
    : '';
  return `<div class="swatch" style="background:${hex};color:${textColor};border:${border}">
    <div class="tone">${tone}</div>
    ${varLabel}
    <div class="hex">${hex}</div>
    <div class="tag">${tag}</div>
  </div>`;
}

let html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>LCARdS 11-Stop Palette Scale Review</title>
<style>
  body { font-family: system-ui, sans-serif; background: #111; color: #eee; padding: 24px; }
  h1 { font-size: 20px; } h2 { font-size: 16px; margin-top: 32px; }
  h3 { font-size: 12px; font-weight: normal; opacity: 0.7; margin: 4px 0; }
  .row { display: flex; gap: 4px; margin-bottom: 8px; }
  .swatch { flex: 1; min-height: 84px; display: flex; flex-direction: column; justify-content: center; align-items: center; border-radius: 4px; font-size: 11px; text-align: center; }
  .tone { font-weight: bold; font-size: 14px; }
  .varname { font-family: monospace; opacity: 0.9; font-size: 10px; }
  .hex { opacity: 0.85; }
  .tag { font-size: 9px; opacity: 0.7; text-transform: uppercase; }
  .legend { font-size: 12px; opacity: 0.8; margin-bottom: 16px; }
  .legend span { margin-right: 16px; }
  .mini-row { display: flex; gap: 16px; margin-bottom: 24px; align-items: flex-start; }
  .mini-row .swatch { flex: 0 0 160px; min-height: 100px; }
  .btn-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px 20px; margin-bottom: 16px; }
  .btn-cell { background: #1a1a1a; border-radius: 6px; padding: 12px; text-align: center; }
  .mock-btn { font-family: inherit; font-size: 13px; font-weight: 500; padding: 8px 20px; border-radius: 999px; cursor: default; }
  .mock-caption { font-size: 10px; opacity: 0.6; margin-top: 4px; }
  .corrected-badge { font-size: 8px; background: #ffd60a; color: #000; border-radius: 3px; padding: 1px 4px; vertical-align: middle; }
  .mode-label { font-size: 11px; opacity: 0.6; text-transform: uppercase; margin: 12px 0 4px; }
</style></head><body>
<h1>LCARdS 11-Stop Palette Scale — Review</h1>
<div class="legend">
  <span>solid dark border = canon anchor (unchanged)</span>
  <span>dotted gray border = interpolated (new)</span>
  <span style="color:#f00">dashed red border = shipped slot-95 value (neon/electric extrapolation)</span>
  <span style="color:#666">dashed gray border = fade-to-white alternative (not shipped, comparison only)</span>
  <span style="color:#39f">solid blue border = ha-lcars's generic &amp;base formula (reference only — see note below)</span>
</div>
<p>Var name shown is the <code>--lcards-&lt;family&gt;-&lt;suffix&gt;</code> suffix actually referenced by the theme YAML
(e.g. <code>-darkest</code> for the canon anchors, <code>-10</code>/<code>-50</code>/<code>-60</code>/<code>-95</code> for the new computed stops).</p>
<p><b>About the blue-bordered row:</b> this is <i>not</i> vanilla Home Assistant and not any currently-running theme.
It's ha-lcars's own generic fallback mechanism (the <code>&amp;base</code> block in <code>ha-lcars/src/preamble.yaml</code>,
shared by every non-LCARdS theme in that repo) — <code>color-mix(in oklch, seed N%, black/white)</code> at fixed
percentages, seeded from <i>our own</i> family's <code>-40</code>/base canon color. It answers: "if we'd only defined the
base color and let ha-lcars generate the rest automatically like every other theme does, what would we have gotten?"
— useful as a neutral baseline to see how far our hand-picked canon anchors diverge from an automatic ramp.</p>`;

for (const family of FAMILIES) {
  const { scale, meta, fadeToWhite95 } = results[family];
  const haDefault = computeHaDefaultScale(scale['40']);
  html += `<h2>${family[0].toUpperCase() + family.slice(1)}</h2>`;
  html += `<h3>LCARdS (canon anchors + computed stops)</h3><div class="row">`;
  for (const tone of TONE_ORDER) {
    html += swatchCell(scale[tone], tone, TONE_TO_VARNAME[tone], meta[tone]);
  }
  html += '</div>';
  html += `<h3>ha-lcars generic &amp;base formula, seeded from this family's -40 (reference only, not shipped)</h3><div class="row">`;
  for (const tone of TONE_ORDER) {
    html += swatchCell(haDefault[tone], tone, undefined, 'ha-default');
  }
  html += '</div>';
  html += `<h3>Slot 95 — shipped (neon/electric) vs. fade-to-white alternative (not shipped)</h3><div class="mini-row">`;
  html += swatchCell(scale['95'], '95', '95', 'extrapolated');
  html += swatchCell(fadeToWhite95, '95', '95', 'not-shipped');
  html += '</div>';
}

html += `<h2>HA Component Mockups</h2>
<p>Hand-built approximations of <code>&lt;wa-button variant="brand/danger/warning/success"&gt;</code> styling — solid
("loud" fill + on-loud text) and outlined ("normal" tier) — using the actual resolved colors from both profiles'
generated <code>ha-color-fill-*</code>/<code>ha-color-on-*</code> tokens. A yellow "corrected" badge means Phase-2
contrast validation overrode HA's mechanical tone-index default (typically white text) with black or white,
whichever actually passes against that background.</p>`;

for (const profile of Object.keys(MOCKUP_PROFILE_FAMILIES)) {
  html += `<h3>${profile[0].toUpperCase() + profile.slice(1)} profile</h3>`;
  for (const mode of ['light', 'dark']) {
    html += `<div class="mode-label">${mode}</div><div class="btn-grid">`;
    for (const role of ['primary', 'danger', 'warning', 'success']) {
      for (const tier of ['loud', 'normal']) {
        html += `<div class="btn-cell">${mockupButton(`${role} / ${tier}`, profile, role, mode, tier)}</div>`;
      }
    }
    html += '</div>';
  }
}

html += '</body></html>';

if (!existsSync(dirname(REPORT_PATH))) mkdirSync(dirname(REPORT_PATH), { recursive: true });
writeFileSync(REPORT_PATH, html, 'utf-8');
console.log(`\nReview artifact written to ${REPORT_PATH}`);

// ── --write mode: patch new keys into paletteInjector.js ──
if (WRITE) {
  let patched = source;
  for (const family of FAMILIES) {
    // Idempotency guard: skip if this family was already patched (re-running
    // --write would otherwise insert a duplicate block and re-break syntax).
    if (new RegExp(`'${family}-50':`).test(patched)) {
      console.log(`Skipping "${family}" — already patched (found '${family}-50').`);
      continue;
    }

    const { scale, meta } = results[family];
    const newLines = TONE_ORDER
      .filter(tone => meta[tone] !== 'anchor')
      .map(tone => `  '${family}-${tone}': '${scale[tone]}',  // ${meta[tone]}`)
      .join('\n');
    const block = `\n  // ${family[0].toUpperCase() + family.slice(1)} — HA 11-step tone scale (10/50/60/95 computed, see scripts/generate-lcards-palette-scale.js)\n${newLines}\n`;

    // Insert right after the family's last existing entry (its lightest line).
    // That line may or may not already end with a trailing comma (it's the
    // final entry in the object for at least one family) — normalize to
    // always have one before splicing the new block in after it.
    const familyBlockEnd = new RegExp(`('${family}-lightest':\\s*'#[0-9a-fA-F]{6}')(,)?([^\\n]*\\n)`);
    if (!familyBlockEnd.test(patched)) {
      console.error(`Could not find insertion point for family "${family}" — aborting write.`);
      process.exit(1);
    }
    patched = patched.replace(familyBlockEnd, `$1,$3${block}`);
  }
  writeFileSync(INJECTOR_PATH, patched, 'utf-8');
  console.log(`Patched new tone keys into ${INJECTOR_PATH}`);
} else {
  console.log('\nDry run only — no files modified. Review the HTML artifact, then re-run with --write to apply.');
}
