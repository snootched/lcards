/**
 * @fileoverview HA-LCARS Theme Variable Allowlist (Dynamic)
 *
 * Fetches the live HA-LCARS theme YAML from GitHub and parses all
 * `lcars-*` variable names from it. Also supports reading from a local
 * workspace copy of ha-lcars when available (e.g. during active PR work).
 *
 * In the card-mod theme YAML the variables are defined WITHOUT the `--` prefix
 * (e.g. `lcars-green: "#33cc99"`). Home Assistant prepends `--` when it injects
 * them into the document, so `lcars-green` → `--lcars-green`.
 *
 * This module extracts the bare names (no `--`), matching exactly what you'd
 * write as `--lcars-<name>` in LCARdS source code.
 *
 * HA-LCARS GitHub: https://github.com/th3jesta/ha-lcars
 *
 * @module scripts/ha-lcars-theme-vars
 */

import { readFileSync } from 'fs';

export const HA_LCARS_THEME_URL =
  'https://raw.githubusercontent.com/th3jesta/ha-lcars/refs/heads/master/themes/lcars.yaml';

/**
 * Conventional relative path (from the lcards repo root) to a local ha-lcars
 * workspace clone. Used when the repo is checked out alongside lcards, e.g.
 * during active PR work before changes are merged upstream.
 */
export const LOCAL_HA_LCARS_THEME_PATH = '../ha-lcars/themes/lcars.yaml';

/**
 * Read the HA-LCARS theme YAML from a local file and return the set of all
 * valid `--lcars-*` CSS custom property names (without the `--` prefix).
 *
 * @param {string} filePath — absolute path to the lcars.yaml file
 * @returns {Set<string>} e.g. Set { 'lcars-green', 'lcars-alert-red', … }
 * @throws {Error} if the file cannot be read or no variables are found
 */
export function readLocalHaLcarsVars(filePath) {
  const text = readFileSync(filePath, 'utf-8');
  const vars = new Set();
  const RE_VAR_LINE = /^  (lcars-[a-z0-9-]+)\s*:/gm;
  for (const m of text.matchAll(RE_VAR_LINE)) {
    vars.add(m[1]);
  }
  if (vars.size === 0) {
    throw new Error(`No lcars-* variables found in local file ${filePath}`);
  }
  return vars;
}

/**
 * Fetch the HA-LCARS theme YAML from GitHub and return the set of all valid
 * `--lcars-*` CSS custom property names (without the `--` prefix).
 *
 * The YAML uses a card-mod anchor block where variables are 2-space-indented
 * keys starting with `lcars-`:
 *   lcars-green: "#33cc99"
 *   lcars-orange: "#ff7700"
 *
 * @returns {Promise<Set<string>>} e.g. Set { 'lcars-green', 'lcars-alert-red', … }
 * @throws {Error} if the fetch fails or no variables are found
 */
export async function fetchHaLcarsVars() {
  let text;
  try {
    const res = await fetch(HA_LCARS_THEME_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    text = await res.text();
  } catch (e) {
    throw new Error(`Failed to fetch HA-LCARS theme from ${HA_LCARS_THEME_URL}: ${e.message}`);
  }

  const vars = new Set();
  // Match lines that are exactly 2-space-indented lcars-* keys in the YAML.
  // Format: `  lcars-<name>: <value>`
  const RE_VAR_LINE = /^  (lcars-[a-z0-9-]+)\s*:/gm;
  for (const m of text.matchAll(RE_VAR_LINE)) {
    vars.add(m[1]);
  }

  if (vars.size === 0) {
    throw new Error(
      `No lcars-* variables found in fetched HA-LCARS theme YAML. ` +
      `The file format may have changed — check ${HA_LCARS_THEME_URL}`
    );
  }

  return vars;
}

// ---------------------------------------------------------------------------
// Legacy static fallback — kept so the validator can run offline.
// This list is intentionally kept minimal; the dynamic fetch is authoritative.
// ---------------------------------------------------------------------------

/**
 * Minimal static fallback set used when the network fetch fails.
 * Contains only vars that LCARdS actively references — NOT the full theme list.
 * @type {Set<string>}
 */
const STATIC_FALLBACK_VARS = new Set([
  // ── Named color palette ───────────────────────────────────────────────────
  'lcars-space-white',
  'lcars-violet-creme',
  'lcars-green',
  'lcars-magenta',
  'lcars-blue',
  'lcars-yellow',
  'lcars-violet',
  'lcars-orange',
  'lcars-african-violet',
  'lcars-text-purple',
  'lcars-red',
  'lcars-almond',
  'lcars-almond-creme',
  'lcars-sunflower',
  'lcars-bluey',
  'lcars-gray',
  'lcars-sky',
  'lcars-ice',
  'lcars-gold',
  'lcars-mars',
  'lcars-peach',
  'lcars-butterscotch',
  'lcars-tomato',
  'lcars-lilac',
  'lcars-evening',
  'lcars-midnight',
  'lcars-ghost',
  'lcars-wheat',
  'lcars-roseblush',
  'lcars-honey',
  'lcars-cardinal',
  'lcars-pumpkinshade',
  'lcars-darkpumpkin',
  'lcars-tangerine',
  'lcars-martian',
  'lcars-text-blue',
  'lcars-moonbeam',
  'lcars-cool',
  'lcars-galaxy',
  'lcars-moonshine',
  'lcars-october-sunset',
  'lcars-harvestgold',
  'lcars-butter',
  'lcars-steel-blue',
  'lcars-aqua',
  'lcars-deep-navy',
  'lcars-slate',
  'lcars-periwinkle',
  'lcars-sky-blue',
  'lcars-powder-blue',
  'lcars-vermilion',
  'lcars-plum',
  'lcars-eggplant',
  'lcars-mauve',
  'lcars-orchid',
  'lcars-lavender-rose',
  'lcars-yam',
  'lcars-taupe',
  'lcars-periwinkle-light',
  'lcars-sage',
  'lcars-emerald',
  'lcars-lime',
  'lcars-mint',
  'lcars-peach-light',
  'lcars-lilac-light',
  'lcars-lavender-mist',
  'lcars-plum-medium',
  'lcars-orchid-light',
  'lcars-scarlet',
  'lcars-crimson',
  'lcars-ruby',
  'lcars-silver',
  'lcars-pearl',
  'lcars-modern-light-gray',
  'lcars-navy-gray',
  'lcars-slate-gray',
  'lcars-teal',
  'lcars-coral',
  'lcars-charcoal',
  'lcars-olive',
  'lcars-sand',
  'lcars-lemon',
  'lcars-cornflower',
  'lcars-khaki-dark',
  'lcars-dunkelgrau',
  'lcars-mittelgrau',
  'lcars-hellgrau',
  'lcars-feuerrot',
  'lcars-mango',
  'lcars-turquoise',
  'lcars-beige',
  'lcars-cerulean',
  'lcars-midnight-blue',
  'lcars-seafoam',
  'lcars-apricot',
  'lcars-lavender',
  'lcars-cyan',
  'lcars-alt-orange',
  'lcars-light-orange',
  'lcars-pale-orange',
  'lcars-alt-blue',
  'lcars-medium-dark-blue',
  'lcars-dark-blue',
  'lcars-alt-green',
  'lcars-black-cherry',

  // ── Text colors ───────────────────────────────────────────────────────────
  'lcars-text-gray',
  'lcars-text-dark',
  'lcars-text-light',
  'lcars-font-color',

  // ── Gray scale aliases ────────────────────────────────────────────────────
  'lcars-medium-gray',
  'lcars-dark-gray',
  'lcars-khaki',
  'lcars-error',
  'lcars-alt-dark-gray',
  'lcars-medium-dark-gray',
  'lcars-primary-gray',
  'lcars-light-gray',
  'lcars-ghost-gray',
  'lcars-starlight',

  // ── Green palette aliases ─────────────────────────────────────────────────
  'lcars-cardassia-maroon',
  'lcars-dark-red',
  'lcars-green-primary',
  'lcars-green-secondary',
  'lcars-green-tertiary',
  'lcars-green-middle',
  'lcars-green-footer',

  // ── Alert colors ──────────────────────────────────────────────────────────
  'lcars-alert-red',
  'lcars-alert-yellow',
  'lcars-alert-blue',
  'lcars-alert-white',
  'lcars-alert-uv',
  'lcars-alert-uvc',

  // ── UI semantic aliases (set by theme, referenced by components) ──────────
  'lcars-ui-primary',
  'lcars-ui-secondary',
  'lcars-ui-tertiary',
  'lcars-ui-quaternary',

  // ── Card component colors ─────────────────────────────────────────────────
  'lcars-card-button',
  'lcars-card-button-off',
  'lcars-card-button-unavailable',
  'lcars-card-top-color',
  'lcars-card-bottom-color',
  'lcars-card-mid-left-color',

  // ── Typography ────────────────────────────────────────────────────────────
  'lcars-font',
  'lcars-fallback-font',

  // ── Layout / sizing ───────────────────────────────────────────────────────
  'lcars-background-color',
  'lcars-vertical-border',
  'lcars-horizontal-border',
  'lcars-outer-radius',
  'lcars-inner-radius',
  'lcars-middle-vertical-border',

  // ── Misc ──────────────────────────────────────────────────────────────────
  'lcars-sound',
]);

export { STATIC_FALLBACK_VARS };
