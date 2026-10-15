/**
 * @fileoverview Turn the LCARdS JSON Schemas into the published schema set.
 *
 * Two outputs from the same entries (scripts/lib/card-schemas.js):
 *
 *  - Split files, for loading only what a task needs: one self-contained file per
 *    card / view / strategy, plus `shared/<name>.json` for the big subsystems every
 *    card embeds (rules, animations, background animations, state colours,
 *    filters). A card file references those with `{"$ref": "../shared/<name>.json"}`;
 *    anything else it repeats goes into its own `$defs`.
 *  - One full bundle (`lcards-schema.json`), the same content with every reference
 *    pointing into a single top-level `$defs`.
 *
 * Repeats are found structurally (same JSON), not by object identity: schema
 * factories such as getMsdSchema() build fresh copies of shared pieces on every
 * call, which identity matching can't see.
 */

import * as commonSchemas from '../../src/cards/schemas/common-schemas.js';

/** Subsystems published as their own files: [file name, source schema]. */
export const SHARED_MODULES = [
  ['rules',                commonSchemas.rulesSchema],
  ['animation',            commonSchemas.animationSchema],
  ['background-animation', commonSchemas.backgroundAnimationSchema],
  ['state-color',          commonSchemas.stateColorSchema],
  ['filter',               commonSchemas.filterSchema],
];

/** Repeated sub-schemas smaller than this stay inline (a $ref would save little). */
export const DEDUP_MIN_BYTES = 300;

const SECTION = { card: 'cards', view: 'views', strategy: 'strategies' };

// ── Strip editor-only / low-value-per-byte fields ───────────────────────────
// `x-ui-hints` / `x-ui` drive the editor's form widgets and `validators` are
// functions (they would serialise as null); none of it means anything to a
// reader of the YAML contract. Source `$id`s point at URLs that don't exist and
// would change how the relative shared-file refs resolve; `$schema` is set once
// per published file instead. Deprecated keys still validate for old configs,
// but the published schema teaches only the current form. `examples` keep one
// representative item. `description` is kept in full.
const DROP_KEYS = new Set(['x-ui-hints', 'x-ui', 'x-replacement', 'validators', '$id', '$schema']);

/** @param {any} node @returns {any} a stripped deep copy */
export function stripSchema(node) {
  if (Array.isArray(node)) return node.map(stripSchema);
  if (!node || typeof node !== 'object') return node;
  const out = {};
  for (const [k, v] of Object.entries(node)) {
    if (DROP_KEYS.has(k) || typeof v === 'function') continue;
    // LCARdS-only `additionalProperties: 'warn'` (unknown keys warn at runtime but
    // are accepted) is not JSON Schema; published as an open object.
    if (k === 'additionalProperties' && v === 'warn') continue;
    if (k === 'properties' && v && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = Object.fromEntries(
        Object.entries(v).filter(([, prop]) => !prop?.deprecated).map(([name, prop]) => [name, stripSchema(prop)])
      );
      continue;
    }
    if ((k === 'anyOf' || k === 'oneOf') && Array.isArray(v)) {
      const current = v.filter(branch => !branch?.deprecated);
      out[k] = (current.length ? current : v).map(stripSchema);
      continue;
    }
    if (k === 'examples' && Array.isArray(v)) {
      out[k] = v.slice(0, 1).map(stripSchema);
      continue;
    }
    out[k] = stripSchema(v);
  }
  return out;
}

const keyOf = (node) => JSON.stringify(node);

/** JSON of every stripped common-schemas export, for naming repeats after it. */
function exportNames() {
  const names = new Map();
  for (const [name, value] of Object.entries(commonSchemas)) {
    if (value && typeof value === 'object') {
      const key = keyOf(stripSchema(value));
      if (!names.has(key)) names.set(key, name);
    }
  }
  return names;
}

/** A readable, valid $defs name from a property path. */
function nameFromPath(parts) {
  const name = parts.filter(Boolean).join('_').replace(/[^A-Za-z0-9_]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  return name || 'shared';
}

/**
 * Pack one or more schema roots into a document with local `$defs`.
 * @param {Array<[string, any]>} roots - [key, stripped schema]
 * @param {object} ctx
 * @param {Map<string, string>} ctx.shared - JSON of a shared module -> its name
 * @param {(name: string) => string} ctx.sharedRef - $ref string for a shared module
 * @param {Map<string, string>} ctx.exportNames - JSON -> common-schemas export name
 * @param {Set<string>} [ctx.taken] - $defs names already used in this document
 * @returns {{ roots: Array<[string, any]>, defs: Record<string, any>, usedShared: Set<string> }}
 */
export function pack(roots, ctx) {
  const usedShared = new Set();
  const counts = new Map();
  const firstPath = new Map();

  // Count every sub-schema (not the roots themselves); a shared module is a leaf.
  // Only plain objects are schemas: an array (a oneOf list, an enum) must stay an
  // array, so it is never replaced by a {"$ref"} object.
  const count = (node, pathParts) => {
    if (!node || typeof node !== 'object') return;
    const key = keyOf(node);
    if (!Array.isArray(node) && ctx.shared.has(key)) { usedShared.add(ctx.shared.get(key)); return; }
    if (Array.isArray(node)) { walkChildren(node, pathParts, count); return; }
    counts.set(key, (counts.get(key) || 0) + 1);
    if (!firstPath.has(key)) firstPath.set(key, pathParts);
    walkChildren(node, pathParts, count);
  };
  for (const [rootKey, root] of roots) {
    const rootShared = ctx.shared.get(keyOf(root));
    walkChildren(root, rootShared ? [] : [rootKey], count);
  }

  const taken = ctx.taken ?? new Set();
  const names = new Map();
  for (const [key, n] of counts) {
    if (n < 2 || key.length < DEDUP_MIN_BYTES) continue;
    let base = ctx.exportNames.get(key) ?? nameFromPath(firstPath.get(key));
    let name = base;
    for (let i = 2; taken.has(name); i++) name = `${base}_${i}`;
    taken.add(name);
    names.set(key, name);
  }

  const defs = {};
  const emit = (node, isRoot) => {
    if (!node || typeof node !== 'object') return node;
    const key = keyOf(node);
    if (!isRoot && !Array.isArray(node) && ctx.shared.has(key)) return { $ref: ctx.sharedRef(ctx.shared.get(key)) };
    if (!isRoot && !Array.isArray(node) && names.has(key)) {
      const name = names.get(key);
      if (!(name in defs)) {
        defs[name] = null; // placeholder: reserves the name and guards self-reference
        defs[name] = emitChildren(node);
      }
      return { $ref: `#/$defs/${name}` };
    }
    return emitChildren(node);
  };
  const emitChildren = (node) => Array.isArray(node)
    ? node.map(v => emit(v, false))
    : Object.fromEntries(Object.entries(node).map(([k, v]) => [k, emit(v, false)]));

  return { roots: roots.map(([k, root]) => [k, emit(root, true)]), defs: sortKeys(defs), usedShared };
}

/** Walk child schemas, tracking a property path for names. */
function walkChildren(node, pathParts, visit) {
  if (Array.isArray(node)) {
    node.forEach(v => visit(v, pathParts));
    return;
  }
  for (const [k, v] of Object.entries(node)) {
    if (!v || typeof v !== 'object') continue;
    if (k === 'properties' && !Array.isArray(v)) {
      for (const [name, prop] of Object.entries(v)) visit(prop, [...pathParts, name]);
    } else if (k === 'items' || k === 'additionalProperties') {
      visit(v, [...pathParts, k === 'items' ? 'item' : 'value']);
    } else {
      visit(v, pathParts);
    }
  }
}

function sortKeys(obj) {
  return Object.fromEntries(Object.keys(obj).sort().map(k => [k, obj[k]]));
}

const sizeOf = (doc) => Buffer.byteLength(JSON.stringify(doc));

/**
 * Build the published schema set.
 * @param {Array<{kind: string, tag: string, schema: object}>} entries
 * @param {{ version: string, generatedAt?: string }} meta
 * @returns {{ files: Map<string, object>, bundle: object, index: object }}
 *   `files` maps paths relative to `schema/` (e.g. `cards/lcards-button.json`) to documents.
 */
export function buildSchemaSet(entries, meta) {
  const generatedAt = meta.generatedAt ?? new Date().toISOString();
  const names = exportNames();
  const sharedStripped = SHARED_MODULES.map(([name, schema]) => [name, stripSchema(schema)]);
  const shared = new Map(sharedStripped.map(([name, s]) => [keyOf(s), name]));
  const stripped = entries.map(e => ({ ...e, schema: stripSchema(e.schema) }));
  const header = (title, extra = {}) => ({
    $schema: 'http://json-schema.org/draft-07/schema#',
    $comment: `LCARdS ${meta.version}: generated from src/cards/schemas/ by scripts/generate-llm-schema.js; do not hand-edit.`,
    ...(title ? { title } : {}),
    ...extra,
  });

  // ── Split files ───────────────────────────────────────────────────────────
  const files = new Map();
  const index = {
    $comment: `LCARdS ${meta.version}: index of the published JSON Schemas. Generated; do not hand-edit.`,
    lcards_version: meta.version,
    generated_at: generatedAt,
    usage: 'Load the file for the card, view or strategy you are writing YAML for, plus the shared files it lists ' +
      'under "uses" (it references them as {"$ref": "../shared/<name>.json"}). Only use properties a schema declares; do not invent keys. ' +
      'lcards-schema.json at the site root holds everything in one file. registries.json lists the built-in names ' +
      '(presets, components, animation and background presets, filters, sound assets, MSD backgrounds, theme tokens) a value must match.',
    cards: {}, views: {}, strategies: {}, shared: {},
  };
  for (const { kind, tag, schema } of stripped) {
    const { roots, defs, usedShared } = pack([[tag, schema]], { shared, sharedRef: n => `../shared/${n}.json`, exportNames: names });
    const doc = { ...header(), ...roots[0][1], ...(Object.keys(defs).length ? { $defs: defs } : {}) };
    const rel = `${SECTION[kind]}/${tag}.json`;
    files.set(rel, doc);
    index[SECTION[kind]][tag] = {
      file: rel,
      type: `custom:${tag}`,
      ...(schema.title ? { title: schema.title } : {}),
      ...(schema.description ? { description: schema.description } : {}),
      bytes: sizeOf(doc),
      uses: [...usedShared].sort(),
    };
  }
  for (const [name, schema] of sharedStripped) {
    const { roots, defs, usedShared } = pack([[name, schema]], { shared, sharedRef: n => `${n}.json`, exportNames: names });
    const doc = { ...header(), ...roots[0][1], ...(Object.keys(defs).length ? { $defs: defs } : {}) };
    const rel = `shared/${name}.json`;
    files.set(rel, doc);
    index.shared[name] = {
      file: rel,
      ...(schema.description ? { description: schema.description } : {}),
      bytes: sizeOf(doc),
      uses: [...usedShared].filter(n => n !== name).sort(),
    };
  }

  // ── Full bundle ─────────────────────────────────────────────────────────────
  const taken = new Set(SHARED_MODULES.map(([name]) => name));
  const all = pack(
    [...stripped.map(e => [`${SECTION[e.kind]}/${e.tag}`, e.schema]), ...sharedStripped.map(([n, s]) => [`shared/${n}`, s])],
    { shared, sharedRef: n => `#/$defs/${n}`, exportNames: names, taken }
  );
  const sections = { cards: {}, views: {}, strategies: {} };
  const sharedDefs = {};
  for (const [key, doc] of all.roots) {
    const [section, tag] = key.split('/');
    if (section === 'shared') sharedDefs[tag] = doc;
    else sections[section][tag] = doc;
  }
  const bundle = {
    $comment: `LCARdS ${meta.version}: generated from src/cards/schemas/ by scripts/generate-llm-schema.js; do not hand-edit.`,
    lcards_version: meta.version,
    generated_at: generatedAt,
    usage: 'Each key under "cards" is a JSON Schema (draft-07) for one LCARdS custom card type (type: custom:<key>), ' +
      'stripped of editor-only metadata. "views" holds the view types (a dashboard views[] entry, type: custom:<key>) ' +
      'and "strategies" the dashboard strategies (a dashboard strategy: block, type: custom:<key>). Shared building ' +
      'blocks are in "$defs" and referenced via {"$ref": "#/$defs/<name>"}. When generating LCARdS YAML, only use ' +
      'properties that appear in the relevant schema (resolving any $ref against $defs); do not invent keys. ' +
      'Per-card files that load faster: schema/index.json.',
    $defs: sortKeys({ ...all.defs, ...sharedDefs }),
    ...sections,
  };

  return { files, bundle, index };
}
