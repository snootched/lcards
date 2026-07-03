#!/usr/bin/env node
/**
 * @fileoverview Vendored HA-LCARS Theme Exporter
 *
 * `yaml/theme/ha-lcars-lcards-themes.yaml` is a copy-paste-able mirror of the
 * two LCARdS Picard theme profiles, for users who paste it directly at the
 * end of their own HA-LCARS `themes.yaml` rather than depending on the
 * ha-lcars HACS release cycle. It relies on the `<<: *lcars-variables`,
 * `<<: *base`, `<<: *card-mod-css` YAML anchor merges already being present
 * earlier in that same file (from the user's own HA-LCARS install) — it is
 * NOT a fully standalone theme. It additionally inlines the full
 * `--lcards-*` hex palette directly (rather than relying solely on the
 * `&lcars-variables` anchor or LCARdS's own JS injection), because LCARdS's
 * JS palette injection doesn't reach iframe-embedded dashboards.
 *
 * This script keeps that vendored file in sync with the authoritative
 * source: it extracts the two Picard theme blocks verbatim from the already-
 * generated `ha-lcars/themes/lcars.yaml` (run `python3 py/generate_themes.py`
 * in the ha-lcars repo first) and splices the inlined palette (read from
 * LCARdS's own `paletteInjector.js`, single source of truth) in after each
 * theme's `card-mod-theme:` line.
 *
 * Usage:
 *   node scripts/export-vendored-ha-lcars-theme.js           dry-run, prints
 *                                                             a diff summary
 *   node scripts/export-vendored-ha-lcars-theme.js --write     writes
 *                                                             yaml/theme/ha-lcars-lcards-themes.yaml
 *
 * @module scripts/export-vendored-ha-lcars-theme
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const INJECTOR_PATH = join(ROOT, 'src/core/themes/paletteInjector.js');
const GENERATED_LCARS_YAML = join(ROOT, '..', 'ha-lcars', 'themes', 'lcars.yaml');
const OUTPUT_PATH = join(ROOT, 'yaml/theme/ha-lcars-lcards-themes.yaml');

const ARGS = new Set(process.argv.slice(2));
const WRITE = ARGS.has('--write');

const THEME_NAMES = [
  'LCARS Picard [LCARdS Red Accent]',
  'LCARS Picard [LCARdS Blue Accent]',
];

// ─── Extract a top-level theme block verbatim from the generated file ─────
function extractThemeBlock(source, themeName) {
  const startMarker = `${themeName}:\n`;
  const startIdx = source.indexOf(startMarker);
  if (startIdx === -1) {
    throw new Error(`Theme "${themeName}" not found in ${GENERATED_LCARS_YAML}`);
  }
  // Next top-level key starts at column 0 (no leading whitespace) and isn't blank.
  const afterStart = startIdx + startMarker.length;
  const nextTopLevelMatch = source.slice(afterStart).match(/\n(?=[^\s#\n])/);
  const endIdx = nextTopLevelMatch ? afterStart + nextTopLevelMatch.index + 1 : source.length;
  return source.slice(startIdx, endIdx).replace(/\n+$/, '\n');
}

// ─── Read the full --lcards-* palette (all 5 families, 11 stops + moonlight) ─
function buildInlinePaletteBlock(injectorSource) {
  const FAMILIES = ['orange', 'gray', 'blue', 'green', 'yellow'];
  const re = /^\s*['"]([a-z]+(?:-[a-z0-9-]+)?)['"]\s*:\s*['"](#[0-9a-fA-F]{6})['"]/gm;
  const byFamily = { orange: [], gray: [], blue: [], green: [], yellow: [] };
  let moonlight = null;
  for (const m of injectorSource.matchAll(re)) {
    const [, key, hex] = m;
    if (key === 'moonlight') { moonlight = hex; continue; }
    const family = FAMILIES.find(f => key === f || key.startsWith(f + '-'));
    if (family) byFamily[family].push([key, hex]);
  }

  const lines = [
    '  # ===================================================================== #',
    '  #                   LCARdS PALETTE VARS                                 #',
    '  # (JS-injected on main document; defined here for iframe compatibility) #',
    '  # ===================================================================== #',
  ];
  for (const family of FAMILIES) {
    lines.push(`  # ── ${family[0].toUpperCase() + family.slice(1)} ${'─'.repeat(70)}`);
    for (const [key, hex] of byFamily[family]) {
      lines.push(`  lcards-${key}: "${hex}"`);
    }
    if (family === 'gray' && moonlight) {
      lines.push(`  lcards-moonlight: "${moonlight}"`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

// ─── Splice the inline palette in right after `card-mod-theme:` ───────────
function spliceInPalette(themeBlock, paletteBlock) {
  const marker = /card-mod-theme:[^\n]*\n/;
  const m = themeBlock.match(marker);
  if (!m) throw new Error('Could not find card-mod-theme: line to splice palette after');
  const idx = m.index + m[0].length;
  return themeBlock.slice(0, idx) + '\n' + paletteBlock + '\n' + themeBlock.slice(idx);
}

// ─── Main ───────────────────────────────────────────────────────────────

const generatedSource = readFileSync(GENERATED_LCARS_YAML, 'utf-8');
const injectorSource = readFileSync(INJECTOR_PATH, 'utf-8');
const paletteBlock = buildInlinePaletteBlock(injectorSource);

const output = [
  '# ================ Paste your themes here =============== |',
  '#                                                         V',
  '',
];

for (const themeName of THEME_NAMES) {
  const block = extractThemeBlock(generatedSource, themeName);
  output.push(spliceInPalette(block, paletteBlock));
}

const finalContent = output.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';

if (WRITE) {
  writeFileSync(OUTPUT_PATH, finalContent, 'utf-8');
  console.log(`Wrote ${OUTPUT_PATH} (${finalContent.split('\n').length} lines)`);
} else {
  const existing = (() => { try { return readFileSync(OUTPUT_PATH, 'utf-8'); } catch { return ''; } })();
  console.log(existing === finalContent ? 'No changes — vendored file already in sync.' : 'Vendored file is OUT OF SYNC — re-run with --write to update.');
  console.log(`(new content: ${finalContent.split('\n').length} lines, existing: ${existing.split('\n').length} lines)`);
}
