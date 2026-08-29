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

// ── Strip editor-only / low-value-per-byte fields ─────────────────────────
//
// `x-ui-hints` drives the *editor's* form widgets (field ordering, control
// type, collapsed sections, etc.) — it has zero meaning to an LLM writing
// YAML and is pure overhead here. `examples` arrays are trimmed to a single
// representative item; one example conveys the shape just as well as five.
// `description` is kept in full: it's real information (accepted formats,
// units, constraints) an LLM needs to avoid guessing.
//
// The strip is memoized by input object reference so that two properties
// pointing at the *same* source object (see dedup below) still point at the
// same stripped object — required for identity-based dedup to work after
// stripping.
const stripCache = new Map();
function stripForLLM(node) {
  if (!node || typeof node !== 'object') return node;
  if (stripCache.has(node)) return stripCache.get(node);
  const out = Array.isArray(node) ? [] : {};
  stripCache.set(node, out);
  if (Array.isArray(node)) {
    for (const v of node) out.push(stripForLLM(v));
  } else {
    for (const [k, v] of Object.entries(node)) {
      if (k === 'x-ui-hints') continue;
      if (k === 'examples' && Array.isArray(v)) {
        out[k] = v.slice(0, 1).map(stripForLLM);
        continue;
      }
      out[k] = stripForLLM(v);
    }
  }
  return out;
}

// ── Dedup via JSON Schema $defs/$ref ──────────────────────────────────────
//
// Card schemas assemble shared building blocks from common-schemas.js by
// importing the same object reference and reusing it at multiple property
// paths — both across cards (e.g. animationSchema) *and within a single
// schema* (e.g. backgroundAnimationSchema embeds the same module-private
// backgroundAnimationEffectSchema object in two `oneOf` branches). A naive
// JSON.stringify duplicates every one of those objects at every place it's
// used. Since each usage is the *same* object reference (not a
// structurally-equal copy), we dedup by identity: walk the whole stripped
// tree, and any object reachable from more than one place gets hoisted into
// a top-level `$defs` entry and replaced with `{ "$ref": "#/$defs/<name>" }`.
// Named common-schemas.js exports keep their real name; anonymous repeats
// (like backgroundAnimationEffectSchema) get an auto-generated one. A small
// size floor avoids "deduping" trivial nodes where the $ref itself would
// cost more bytes than the duplication it removes.
const DEDUP_MIN_BYTES = 300;

const namedRegistry = new Map(); // stripped shared object -> export name
for (const [name, value] of Object.entries(commonSchemas)) {
  if (value && typeof value === 'object') namedRegistry.set(stripForLLM(value), name);
}

const strippedCards = {};
for (const [key, schema] of Object.entries(cardsRaw)) strippedCards[key] = stripForLLM(schema);

function countRefs(node, counts) {
  if (!node || typeof node !== 'object') return;
  counts.set(node, (counts.get(node) || 0) + 1);
  const children = Array.isArray(node) ? node : Object.values(node);
  for (const child of children) countRefs(child, counts);
}
const counts = new Map();
for (const schema of Object.values(strippedCards)) countRefs(schema, counts);

const names = new Map(); // stripped shared object -> $defs name
let autoIdx = 0;
for (const [node, count] of counts.entries()) {
  if (count <= 1) continue;
  if (JSON.stringify(node).length < DEDUP_MIN_BYTES) continue;
  names.set(node, namedRegistry.get(node) || `sharedSchema${++autoIdx}`);
}

function dedupe(node, defs) {
  if (!node || typeof node !== 'object') return node;
  const name = names.get(node);
  if (name) {
    if (!defs.has(name)) {
      defs.set(name, undefined); // placeholder guards against (unexpected) self-reference
      defs.set(name, dedupeChildren(node, defs));
    }
    return { $ref: `#/$defs/${name}` };
  }
  return dedupeChildren(node, defs);
}

function dedupeChildren(node, defs) {
  if (Array.isArray(node)) return node.map((v) => dedupe(v, defs));
  const out = {};
  for (const [k, v] of Object.entries(node)) out[k] = dedupe(v, defs);
  return out;
}

const defs = new Map();
const cards = {};
for (const [key, schema] of Object.entries(strippedCards)) cards[key] = dedupe(schema, defs);

const bundle = {
  $comment: 'Auto-generated from src/cards/schemas/*.js by scripts/generate-llm-schema.js — do not hand-edit.',
  lcards_version: pkg.version,
  generated_at: new Date().toISOString(),
  usage: 'Each key under "cards" is a JSON Schema (draft-07) for one LCARdS custom card type, stripped of ' +
    'editor-only metadata. Shared building blocks are hoisted into "$defs" and referenced via ' +
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
