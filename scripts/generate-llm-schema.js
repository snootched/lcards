#!/usr/bin/env node
/**
 * @fileoverview Generate a single JSON Schema bundle for LCARdS's standard
 * cards, for pasting into an LLM's context so it stops inventing config keys.
 *
 * Pulls the real JSON Schemas from `scripts/lib/card-schemas.js`, the same
 * list `scripts/validate-doc-examples.js` validates doc examples against, so
 * this bundle can never drift from what the app actually validates against.
 * Cards go under `cards`, the layout view under `views`, the shell dashboard
 * strategy under `strategies`.
 *
 * MSD (`lcards-msd-card`) is left out for now: its schema is about 600 KB raw
 * and would more than double the bundle. It joins once the bundle is split
 * into per-card files (reports/ai-readiness-plan.md, step 2).
 *
 * Usage:
 *   node scripts/generate-llm-schema.js
 *   node scripts/generate-llm-schema.js --out=<file>   # write elsewhere (tests)
 *
 * Output: doc/public/lcards-schema.json (served by VitePress at the site
 * root, e.g. https://lcards.unimatrix01.ca/lcards-schema.json).
 */

import { getSchemaEntries }      from './lib/card-schemas.js';
import * as commonSchemas        from '../src/cards/schemas/common-schemas.js';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const REPO_ROOT  = path.resolve(__dirname, '..');
const outArg     = process.argv.slice(2).find(a => a.startsWith('--out='));
const OUT_PATH   = outArg ? path.resolve(outArg.slice('--out='.length)) : path.join(REPO_ROOT, 'doc', 'public', 'lcards-schema.json');

const pkg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'));

// Not in the bundle yet (see the header comment).
const BUNDLE_EXCLUDE = new Set(['lcards-msd-card']);
const SECTION = { card: 'cards', view: 'views', strategy: 'strategies' };

const entries = getSchemaEntries().filter(e => !BUNDLE_EXCLUDE.has(e.tag));

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
      if (k === 'x-ui-hints' || k === 'x-replacement') continue;
      // Deprecated keys still validate for old configs, but an LLM should only
      // ever write the current form.
      if (k === 'properties' && v && typeof v === 'object' && !Array.isArray(v)) {
        out[k] = Object.fromEntries(
          Object.entries(v)
            .filter(([, prop]) => !prop?.deprecated)
            .map(([name, prop]) => [name, stripForLLM(prop)])
        );
        continue;
      }
      if ((k === 'anyOf' || k === 'oneOf') && Array.isArray(v)) {
        const current = v.filter(branch => !branch?.deprecated);
        out[k] = (current.length ? current : v).map(stripForLLM);
        continue;
      }
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

const stripped = entries.map(e => ({ ...e, schema: stripForLLM(e.schema) }));

function countRefs(node, counts) {
  if (!node || typeof node !== 'object') return;
  counts.set(node, (counts.get(node) || 0) + 1);
  const children = Array.isArray(node) ? node : Object.values(node);
  for (const child of children) countRefs(child, counts);
}
const counts = new Map();
for (const { schema } of stripped) countRefs(schema, counts);

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
const sections = { cards: {}, views: {}, strategies: {} };
for (const { kind, tag, schema } of stripped) sections[SECTION[kind]][tag] = dedupe(schema, defs);

const bundle = {
  $comment: 'Auto-generated from src/cards/schemas/*.js by scripts/generate-llm-schema.js; do not hand-edit.',
  lcards_version: pkg.version,
  generated_at: new Date().toISOString(),
  usage: 'Each key under "cards" is a JSON Schema (draft-07) for one LCARdS custom card type (type: custom:<key>), ' +
    'stripped of editor-only metadata. "views" holds the view types (a dashboard views[] entry, type: custom:<key>) ' +
    'and "strategies" the dashboard strategies (a dashboard strategy: block, type: custom:<key>). Shared building ' +
    'blocks are hoisted into "$defs" and referenced via {"$ref": "#/$defs/<name>"} to keep this file a reasonable size. ' +
    'When generating LCARdS YAML, only use properties that appear in the relevant schema (resolving ' +
    'any $ref against $defs); do not invent keys. MSD (custom:lcards-msd-card) is not included here; see the MSD docs instead.',
  $defs: Object.fromEntries(defs),
  ...sections,
};

// Compact (no indentation): this file is for LLMs to ingest, not humans to
// read — pretty-printing roughly triples its size (and token cost) for no
// benefit here. Regenerate + use `jq` if you need to inspect it by hand.
fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, JSON.stringify(bundle) + '\n');

const counts_ = Object.entries(sections).map(([name, s]) => `${Object.keys(s).length} ${name}`).join(', ');
const defCount = defs.size;
const sizeKb = (fs.statSync(OUT_PATH).size / 1024).toFixed(1);
console.log(`✅ Wrote ${counts_} + ${defCount} shared $defs (${sizeKb} KB) to ${path.relative(REPO_ROOT, OUT_PATH)}`);
