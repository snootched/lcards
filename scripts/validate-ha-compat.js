#!/usr/bin/env node
/**
 * @fileoverview HA Compatibility Deny-list Validator
 *
 * Fails the build on HA frontend/core APIs that are known to be removed, dead,
 * or misused in the minimum supported Home Assistant (see hacs.json). Each of
 * these broke LCARdS silently at least once — an unregistered element renders
 * as an empty unknown tag, a dead CSS hook simply stops applying, and none of
 * them throw.
 *
 * Scans src/**\/*.js and custom_components/**\/*.py. Suppress a deliberate hit
 * with `ha-compat-ignore` anywhere on the same line.
 *
 * Exit 0 = clean, Exit 1 = violations found.
 *
 * Usage:
 *   node scripts/validate-ha-compat.js
 *
 * Complements scripts/check-ha-impact.js, which detects *new* breakage against
 * an upstream frontend checkout; this file encodes the breakage we already know.
 *
 * @module scripts/validate-ha-compat
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

/**
 * @typedef {Object} CompatRule
 * @property {string} id
 * @property {'js'|'py'} kind     - file kind the rule applies to
 * @property {RegExp} pattern     - global regex; may span lines
 * @property {string} reason
 * @property {string} fix
 */

/** @type {CompatRule[]} */
export const RULES = [
  // ── Removed / unregistered elements ──────────────────────────────────────
  { id: 'mwc-element', kind: 'js', pattern: /<mwc-[a-z-]+/g,
    reason: 'MWC elements are no longer registered by HA (mwc-icon-button removed in 2026.3) — renders as an empty unknown tag',
    fix: 'use the ha-* equivalent, e.g. <ha-icon-button .label=…><ha-icon icon="mdi:…"></ha-icon></ha-icon-button>' },
  { id: 'ha-textfield', kind: 'js', pattern: /<ha-textfield\b/g,
    reason: 'deprecated MDC component, renders at 0px height',
    fix: 'use <ha-input> or ha-selector { text: {} }' },
  { id: 'ha-circular-progress', kind: 'js', pattern: /<ha-circular-progress\b/g,
    reason: 'removed from HA — silently renders 0×0',
    fix: 'use <ha-spinner size="small">' },
  { id: 'ha-formfield', kind: 'js', pattern: /<ha-formfield\b/g,
    reason: 'MWC-based, only lazily registered by HA',
    fix: 'put the label in the control\'s default slot: <ha-switch>Label</ha-switch>' },
  { id: 'paper-element', kind: 'js', pattern: /<paper-[a-z-]+/g,
    reason: 'Polymer paper-* elements are not registered by HA',
    fix: 'use the ha-* equivalent' },

  // ── Element API misuse ───────────────────────────────────────────────────
  { id: 'ha-icon-button-icon-attr', kind: 'js', pattern: /<ha-icon-button\b[^>]*?\sicon=/g,
    reason: 'ha-icon-button has no `icon` property — the button renders without an icon',
    fix: 'pass .path=${mdiX} or an <ha-icon icon="mdi:…"> child, plus .label' },
  { id: 'ha-input-helper', kind: 'js', pattern: /<ha-input\b(?:=>|[^>])*?\s[.?]?helper=/g,
    reason: 'ha-input (WebAwesome) has no `helper` property, so the helper text never renders',
    fix: 'use hint="…" (or .hint=${…})' },
  { id: 'ha-button-raised', kind: 'js', pattern: /<ha-button\b(?:=>|[^>])*?\s\??raised\b/g,
    reason: '`raised` is an MWC attribute; WebAwesome ha-button ignores it, so selected/primary styling never shows',
    fix: 'use appearance="accent|filled|outlined|plain" (or variant="brand")' },
  { id: 'dialog-on-body', kind: 'js', pattern: /document\.body\.(?:appendChild|append)\(\s*[\w.]*(?:dialog|Dialog|portal|Portal)\w*\s*\)/g,
    reason: 'outside <home-assistant>: HA components inside get no Lit contexts (ha-dialog, ha-entity-picker render broken/empty since HA 2026.7) and hass-action/more-info events never reach HA',
    fix: 'mountDialogNearHomeAssistant(el) from src/utils/lcards-shared-helpers.js' },

  // ── Dead CSS hooks (nothing in HA reads them any more) ──────────────────
  { id: 'mdc-theme-primary', kind: 'js', pattern: /--mdc-theme-primary\b/g,
    reason: 'dead since HA 2026.6 (ha-button is WebAwesome)',
    fix: 'use <ha-button variant="brand|danger|warning">' },
  { id: 'mdc-icon-button-size', kind: 'js', pattern: /--mdc-icon-button-size\b/g,
    reason: 'dead — ha-icon-button is WebAwesome',
    fix: 'use --ha-icon-button-size' },
  { id: 'md-icon-button-vars', kind: 'js', pattern: /--md-icon-button-[a-z-]+/g,
    reason: 'dead — ha-icon-button is WebAwesome',
    fix: 'set `color:` on the ha-icon-button (icon uses currentColor)' },
  { id: 'md-chip-spacing', kind: 'js', pattern: /--md-(?:filter|assist|input)-chip-[a-z-]*space\b/g,
    reason: 'dead since HA 2026.10 (chips are WebAwesome)',
    fix: 'chips pad symmetrically by default; remove the override' },
  { id: 'chip-sizing', kind: 'js', pattern: /--md-assist-chip-label-text-font-size\b|--ha-assist-chip-container-height\b|--md-sys-color-primary\b/g,
    reason: 'not read by HA chips (dead since HA 2026.10, some never worked)',
    fix: 'chip height: --ha-button-height; label size: --ha-chip-label-size; label colour: --md-assist-chip-label-text-color' },
  { id: 'mdc-dialog-vars', kind: 'js', pattern: /--mdc-dialog-[a-z-]+|(?<![\w-])--dialog-max-width\b/g,
    reason: 'dead — ha-dialog is WebAwesome',
    fix: 'use --ha-dialog-max-width / --ha-dialog-min-height / --ha-dialog-width-{sm,md,lg}' },

  // ── Backend ──────────────────────────────────────────────────────────────
  { id: 'voluptuous-import', kind: 'py', pattern: /^\s*(?:import voluptuous|from voluptuous\b)/gm,
    reason: 'HA core migrated to probatio (2026.10); voluptuous only exists via HA\'s compat shim',
    fix: 'import probatio as vol' },
];

const SUPPRESS = 'ha-compat-ignore';

/**
 * Scan one file's text against the rules for its kind.
 * @param {string} text
 * @param {'js'|'py'} kind
 * @returns {{rule: CompatRule, line: number, match: string}[]}
 */
export function scanText(text, kind) {
  const lines = text.split('\n');
  /** @type {{rule: CompatRule, line: number, match: string}[]} */
  const hits = [];
  for (const rule of RULES) {
    if (rule.kind !== kind) continue;
    rule.pattern.lastIndex = 0;
    for (const m of text.matchAll(rule.pattern)) {
      const line = text.slice(0, m.index).split('\n').length;
      if (lines[line - 1]?.includes(SUPPRESS)) continue;
      hits.push({ rule, line, match: m[0].split('\n')[0] });
    }
  }
  return hits.sort((a, b) => a.line - b.line);
}

/** Recursively collect files under dir with the given extension. */
function walk(dir, ext) {
  let out = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out = out.concat(walk(full, ext));
    else if (full.endsWith(ext)) out.push(full);
  }
  return out;
}

function main() {
  const RED = s => `\x1b[31m${s}\x1b[0m`;
  const GREEN = s => `\x1b[32m${s}\x1b[0m`;
  const BOLD = s => `\x1b[1m${s}\x1b[0m`;
  const DIM = s => `\x1b[2m${s}\x1b[0m`;

  const files = [
    ...walk(join(ROOT, 'src'), '.js').map(f => ({ f, kind: /** @type {'js'} */ ('js') })),
    ...walk(join(ROOT, 'custom_components'), '.py').map(f => ({ f, kind: /** @type {'py'} */ ('py') })),
  ];

  let total = 0;
  for (const { f, kind } of files) {
    for (const { rule, line, match } of scanText(readFileSync(f, 'utf-8'), kind)) {
      total++;
      console.log(`${RED('✖')} ${relative(ROOT, f)}:${line}  ${BOLD(rule.id)}  ${DIM(match.trim())}`);
      console.log(`    ${rule.reason}`);
      console.log(`    ${GREEN('fix:')} ${rule.fix}`);
    }
  }

  if (total) {
    console.log(RED(`\n❌ ${total} HA compatibility violation(s). Add "${SUPPRESS}" on the line to suppress a deliberate use.`));
    process.exit(1);
  }
  console.log(GREEN(`✅ No known-dead HA elements, hooks or imports (${files.length} files checked)`));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main();
