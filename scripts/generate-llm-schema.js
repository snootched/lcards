#!/usr/bin/env node
/**
 * @fileoverview Generate a single JSON Schema bundle for LCARdS's standard
 * cards, for pasting into an LLM's context so it stops inventing config keys.
 *
 * Pulls the real JSON Schema factories from `src/cards/schemas/*.js` — the
 * same functions `scripts/validate-doc-examples.js` already imports in Node
 * to validate doc examples — so this bundle can never drift from what the
 * app actually validates against.
 *
 * MSD (`lcards-msd`) is intentionally excluded: its schema is unusually deep
 * (routing/overlays/filters) and not yet in scope for this bundle.
 *
 * Usage:
 *   node scripts/generate-llm-schema.js
 *
 * Output: doc/public/lcards-schema.json (served by VitePress at the site
 * root, e.g. https://lcards.unimatrix01.ca/lcards-schema.json).
 */

import { getButtonSchema }       from '../src/cards/schemas/button-schema.js';
import { getSliderSchema }       from '../src/cards/schemas/slider-schema.js';
import { getElbowSchema }        from '../src/cards/schemas/elbow-schema.js';
import { getChartSchema }        from '../src/cards/schemas/chart-schema.js';
import { dataGridSchema }        from '../src/cards/schemas/data-grid-schema.js';
import { getAlertOverlaySchema } from '../src/cards/schemas/lcards-alert-overlay-schema.js';
import { getSelectMenuSchema }   from '../src/cards/schemas/select-menu-schema.js';
import { layoutCardSchema }      from '../src/cards/schemas/layout-card-schema.js';
import * as commonSchemas        from '../src/cards/schemas/common-schemas.js';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const REPO_ROOT  = path.resolve(__dirname, '..');
const OUT_PATH   = path.join(REPO_ROOT, 'doc', 'public', 'lcards-schema.json');

const pkg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'));

const cardsRaw = {
  'lcards-button':        getButtonSchema({}),
  'lcards-slider':        getSliderSchema({}),
  'lcards-elbow':         getElbowSchema({}),
  'lcards-chart':         getChartSchema({}),
  'lcards-data-grid':     dataGridSchema,
  'lcards-alert-overlay': getAlertOverlaySchema(),
  'lcards-select-menu':   getSelectMenuSchema({}),
  'lcards-layout-card':   layoutCardSchema,
};

// ── Dedup via JSON Schema $defs/$ref ──────────────────────────────────────
//
// Card schemas assemble shared building blocks (animationSchema,
// backgroundAnimationSchema, etc.) from common-schemas.js by importing the
// same object reference and reusing it at multiple property paths, both
// within one card and across cards. A naive JSON.stringify of the raw
// schemas therefore duplicates those (sometimes 100+ KB) objects every place
// they're used, ballooning a ~1.5MB bundle to 4MB+. Since every usage is the
// *same* object reference (not a structurally-equal copy), we can dedup by
// identity: any shared-schema export from common-schemas.js that appears
// more than once across the whole bundle gets hoisted into a top-level
// `$defs` entry and replaced everywhere with `{ "$ref": "#/$defs/<name>" }`.
const registry = new Map(); // object reference -> export name
for (const [name, value] of Object.entries(commonSchemas)) {
  if (value && typeof value === 'object') registry.set(value, name);
}

function countRefs(node, counts) {
  if (!node || typeof node !== 'object') return;
  const name = registry.get(node);
  if (name) counts.set(name, (counts.get(name) || 0) + 1);
  const children = Array.isArray(node) ? node : Object.values(node);
  for (const child of children) countRefs(child, counts);
}

function dedupe(node, dupeNames, defs) {
  if (!node || typeof node !== 'object') return node;
  const name = registry.get(node);
  if (name && dupeNames.has(name)) {
    if (!defs.has(name)) {
      defs.set(name, undefined); // placeholder in case of self-reference
      defs.set(name, dedupeChildren(node, dupeNames, defs));
    }
    return { $ref: `#/$defs/${name}` };
  }
  return dedupeChildren(node, dupeNames, defs);
}

function dedupeChildren(node, dupeNames, defs) {
  if (Array.isArray(node)) return node.map((v) => dedupe(v, dupeNames, defs));
  const out = {};
  for (const [k, v] of Object.entries(node)) out[k] = dedupe(v, dupeNames, defs);
  return out;
}

const counts = new Map();
for (const schema of Object.values(cardsRaw)) countRefs(schema, counts);
const dupeNames = new Set([...counts.entries()].filter(([, c]) => c > 1).map(([n]) => n));

const defs = new Map();
const cards = {};
for (const [key, schema] of Object.entries(cardsRaw)) cards[key] = dedupe(schema, dupeNames, defs);

const bundle = {
  $comment: 'Auto-generated from src/cards/schemas/*.js by scripts/generate-llm-schema.js — do not hand-edit.',
  lcards_version: pkg.version,
  generated_at: new Date().toISOString(),
  usage: 'Each key under "cards" is a complete JSON Schema (draft-07) for one LCARdS custom card type. ' +
    'Shared building blocks used by multiple cards are hoisted into "$defs" and referenced via ' +
    '{"$ref": "#/$defs/<name>"} to keep this file a reasonable size. ' +
    'When generating LCARdS YAML, only use properties that appear in the relevant card\'s schema (resolving ' +
    'any $ref against $defs) — do not invent keys. MSD (custom:lcards-msd) is not included here; see the MSD docs instead.',
  $defs: Object.fromEntries(defs),
  cards,
};

// Compact (no indentation): this file is for LLMs to ingest, not humans to
// read — pretty-printing roughly triples its size (and token cost) for no
// benefit here. Regenerate + use `jq` if you need to inspect it by hand.
fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, JSON.stringify(bundle) + '\n');

const cardCount = Object.keys(bundle.cards).length;
const defCount = defs.size;
const sizeKb = (fs.statSync(OUT_PATH).size / 1024).toFixed(1);
console.log(`✅ Wrote ${cardCount} card schemas + ${defCount} shared $defs (${sizeKb} KB) to ${path.relative(REPO_ROOT, OUT_PATH)}`);
