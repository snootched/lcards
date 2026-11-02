/**
 * One vocabulary across the card schemas (the user, 2026-11-01): the same
 * idea gets the same key names on every card. Mapping an entity's value onto
 * a setting is `entity`, `attribute`, `input`, `output` (and `clamp`) as in
 * map_range (animations, background animations), the rules' map_range_cond
 * and astrometrics settings; R4b had shipped `range` / `to` for the same thing
 * before this test. A new key should be checked against the other cards'
 * schemas first (the lcards-card-option skill, step 1).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getSchemaEntries } from '../../scripts/lib/card-schemas.js';

/** Names that mean input / output (or entity) elsewhere, in an object that takes an entity */
const SYNONYMS = { range: 'input', to: 'output', map_to: 'output', map_from: 'input', from_range: 'input', to_range: 'output', entity_id: 'entity' };

/**
 * Every object schema (properties) under a node, with its path.
 * @param {any} node @param {string} path @param {(props: Record<string, any>, path: string) => void} found @param {Set<any>} seen
 */
function walk(node, path, found, seen = new Set()) {
  if (!node || typeof node !== 'object' || seen.has(node)) return;
  seen.add(node);
  if (node.properties && typeof node.properties === 'object') found(node.properties, path);
  for (const [k, v] of Object.entries(node)) walk(v, `${path}/${k}`, found, seen);
}

/**
 * Keys in a schema that name a mapping differently from map_range.
 * @param {any} schema @param {string} name
 * @returns {string[]}
 */
function synonymIssues(schema, name) {
  /** @type {string[]} */
  const bad = [];
  walk(schema, name, (props, path) => {
    const keys = Object.keys(props);
    // a mapping: an entity with a [low, high] pair beside it
    const pairs = keys.filter((k) => props[k]?.type === 'array' && props[k]?.minItems === 2 && props[k]?.maxItems === 2);
    if (!keys.includes('entity') || !pairs.length) return;
    for (const k of keys) if (/** @type {any} */ (SYNONYMS)[k]) bad.push(`${path}: ${k} (say ${/** @type {any} */ (SYNONYMS)[k]})`);
  });
  return bad;
}

test('an object that maps an entity onto a setting uses map_range\'s words (input, output, entity), on every card', () => {
  // the check finds the R4b shape (so it would have caught it)
  const pair = { type: 'array', items: { type: 'number' }, minItems: 2, maxItems: 2 };
  assert.equal(synonymIssues({ properties: { size: { anyOf: [{ type: 'number' }, { type: 'object', properties: { entity: { type: 'string' }, range: pair, to: pair } }] } } }, 'r4b').length, 2);
  assert.deepEqual(getSchemaEntries().flatMap((e) => synonymIssues(e.schema, e.name ?? e.type ?? '?')), []);
});

test('the astrometrics setting binding is the map_range shape', () => {
  const entries = getSchemaEntries();
  const astro = entries.find((e) => JSON.stringify(e.schema).includes('"title":"belt"'));
  assert.ok(astro, 'the astrometrics schema is registered');
  let binding = null;
  walk(astro.schema, '', (props) => { if (props.entity && props.input && props.output && props.smooth) binding = props; });
  assert.ok(binding, 'a binding with entity, input, output (and smooth)');
  assert.deepEqual(Object.keys(/** @type {any} */ (binding)).sort(), ['attribute', 'clamp', 'entity', 'input', 'output', 'smooth']);
});
