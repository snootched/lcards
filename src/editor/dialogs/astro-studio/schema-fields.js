/**
 * @fileoverview How the Astrometrics Studio shows a schema property as a form
 * field (pure, no DOM; tests/editor/astro-studio-fields.test.js).
 *
 * The forms come from the card schema (src/cards/schemas/astrometrics-schema.js),
 * so a new object type or key needs no Studio work: `fieldKind()` maps every
 * property shape the schema uses to a field, and anything else falls back to
 * a YAML editor for that key. `appliesTo()` hides keys whose description says
 * they belong to another shape ("plane: ...", "disc, dome: ...").
 *
 * @module editor/dialogs/astro-studio/schema-fields
 */

import { simpleColorSchema } from '../../../cards/schemas/common-schemas.js';

/**
 * @typedef {'boolean' | 'enum' | 'number' | 'color' | 'text' | 'strings' | 'tuple' | 'numbers'
 *   | 'pointRef' | 'numberOrTuple' | 'boolOrObject' | 'boolOrNumber' | 'object' | 'objectList' | 'pointList' | 'yaml'} FieldKind
 */

const isObj = (/** @type {any} */ v) => !!v && typeof v === 'object' && !Array.isArray(v);

/** @param {any} s */
const isColor = (s) => !!s && (s === simpleColorSchema || (Array.isArray(s.allOf) && s.allOf.includes(simpleColorSchema)));

/** @param {any} s @param {string} t */
const hasType = (s, t) => s?.type === t || (Array.isArray(s?.type) && s.type.includes(t));

/** @param {any} s */
const isNumberSchema = (s) => hasType(s, 'number') || hasType(s, 'integer');

/** @param {any} s */
const isNumberArray = (s) => hasType(s, 'array') && isNumberSchema(s.items);

/** A fixed-length number array (2 to 4): [x, y, z], [from, to] @param {any} s */
const isTuple = (s) => isNumberArray(s) && s.minItems !== undefined && s.minItems === s.maxItems && s.minItems >= 2 && s.minItems <= 4;

/** A point id or [x, y, z] @param {any} s */
const isPointRef = (s) => Array.isArray(s?.oneOf) && s.oneOf.length === 2
  && s.oneOf.some((/** @type {any} */ b) => hasType(b, 'string') && !b.enum) && s.oneOf.some((/** @type {any} */ b) => isTuple(b) && b.minItems === 3);

/** An object schema the form can walk (its own keys, no free map) @param {any} s */
const isWalkable = (s) => hasType(s, 'object') && isObj(s.properties) && !s.additionalProperties;

/** Keys that stay YAML whatever their shape: actions (any card action, with completion) */
const YAML_KEYS = new Set(['tap_action', 'hold_action']);

/**
 * The field for a schema property.
 * @param {any} s
 * @param {string} [key] - the property name (actions stay YAML)
 * @returns {FieldKind}
 */
export function fieldKind(s, key) {
  if (!isObj(s) || (key && YAML_KEYS.has(key))) return 'yaml';
  if (isColor(s)) return 'color';
  if (isPointRef(s)) return 'pointRef';
  const alts = s.oneOf ?? s.anyOf;
  if (Array.isArray(alts)) {
    if (alts.length === 2) {
      // one number, or a pair / triple of numbers ([w, d], [a, b], [w, h, d])
      if (alts.some(isNumberSchema) && alts.some(isTuple)) return 'numberOrTuple';
      // true, or an object to choose (stars, buttons, pulse)
      if (alts.some((b) => hasType(b, 'boolean')) && alts.some(isWalkable)) return 'boolOrObject';
      // true, or a factor (a line's glow)
      if (alts.some((b) => hasType(b, 'boolean')) && alts.some(isNumberSchema)) return 'boolOrNumber';
    }
    return 'yaml';
  }
  if (s.const !== undefined) return 'yaml';
  if (Array.isArray(s.enum) && s.enum.every((/** @type {any} */ v) => typeof v === 'string')) return 'enum';
  if (hasType(s, 'boolean') && !Array.isArray(s.type)) return 'boolean';
  if (isNumberSchema(s) && !Array.isArray(s.type)) return 'number';
  if (hasType(s, 'string') && !Array.isArray(s.type)) return 'text';
  if (Array.isArray(s.type) && s.type.every((/** @type {string} */ t) => ['string', 'number', 'integer'].includes(t))) return 'text';
  if (hasType(s, 'array')) {
    if (isTuple(s)) return 'tuple';
    if (isNumberArray(s)) return 'numbers';
    if (hasType(s.items, 'string') && !s.items.enum) return 'strings';
    if (isPointRef(s.items)) return 'pointList';
    if (isObj(s.items?.properties)) return 'objectList';
    return 'yaml';
  }
  if (isWalkable(s)) return 'object';
  return 'yaml';
}

/**
 * The object branch of a boolOrObject property.
 * @param {any} s
 */
export const objectAlternative = (s) => (s?.oneOf ?? s?.anyOf ?? []).find(isWalkable) ?? null;

/**
 * Names for a tuple's (or pair's) boxes from the description's first
 * bracket ("[r0, r1]", "[x, y, z]", "[w, d]"), else 1, 2, 3.
 * @param {string | undefined} description
 * @param {number} n
 * @returns {string[]}
 */
export function tupleLabels(description, n) {
  for (const m of String(description ?? '').matchAll(/\[([^\]]+)\]/g)) {
    const parts = m[1].split(',').map((p) => p.trim());
    if (parts.length === n && parts.every((p) => p && p.length <= 16 && !/^-?\d/.test(p))) return parts;
  }
  return Array.from({ length: n }, (_, i) => String(i + 1));
}

/** Tuple length of a numberOrTuple / tuple property @param {any} s */
export const tupleSize = (s) => (isTuple(s) ? s.minItems : (s?.oneOf?.find(isTuple)?.minItems ?? 0));

/**
 * A field label from its key: line_width_major is "Line width major".
 * @param {string} key
 */
export function labelFor(key) {
  const words = String(key).replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Helper text: the description's first sentence, plus its "Default ..."
 * sentence when that comes later.
 * @param {string | undefined} description
 */
export function helperText(description) {
  const text = String(description ?? '').trim();
  if (!text) return '';
  const sentences = text.split(/(?<=[.!?])\s+/).map((t) => t.trim()).filter(Boolean);
  const first = sentences[0];
  const def = sentences.slice(1).find((t) => /^Default\b/.test(t));
  return def ? `${first} ${def}` : first;
}

/**
 * Which sibling values a description's prefix limits a key to: "plane: ..."
 * (shape plane), "disc, dome, sphere (its rim): ..." (several), "pattern
 * hexagonal: ..." (named key), "sky: ..." (only while the key sky is set).
 * @param {string | undefined} description
 * @param {Record<string, any>} siblings - the properties of the same object
 * @returns {{ key: string, values: string[] | null } | null} values null: the key only has to be set
 */
export function scopeOf(description, siblings) {
  // "disc: ...; dome, sphere, cylinder, well: ..." scopes to every segment's names
  const segments = String(description ?? '').split(/;\s+/).map((seg) => scopeOfSegment(seg, siblings));
  const first = segments[0];
  if (!first || first.values === null) return first;
  const values = new Set(first.values);
  for (const seg of segments.slice(1)) if (seg && seg.key === first.key && seg.values) seg.values.forEach((v) => values.add(v));
  return { key: first.key, values: [...values] };
}

/**
 * @param {string} text
 * @param {Record<string, any>} siblings
 * @returns {{ key: string, values: string[] | null } | null}
 */
function scopeOfSegment(text, siblings) {
  const m = /^([a-z_]+(?: [a-z_]+)?(?:(?:, | or | and )[a-z_]+)*)(?: \([^)]*\))?:\s/.exec(text);
  if (!m) return null;
  const head = m[1];
  // "pattern hexagonal": key then value
  const named = /^([a-z_]+) ([a-z_]+)$/.exec(head);
  if (named && Array.isArray(siblings[named[1]]?.enum) && siblings[named[1]].enum.includes(named[2])) {
    return { key: named[1], values: [named[2]] };
  }
  const tokens = head.split(/, | or | and /).map((t) => t.trim());
  if (tokens.some((t) => t.includes(' '))) return null;
  for (const [key, prop] of Object.entries(siblings)) {
    const values = Array.isArray(prop?.enum) ? prop.enum : null;
    if (values && tokens.every((t) => values.includes(t))) return { key, values: tokens };
  }
  if (tokens.length === 1 && siblings[tokens[0]] !== undefined) return { key: tokens[0], values: null };
  return null;
}

/**
 * Whether a key belongs on the form for this value: always when it is set,
 * else when its scope (if any) matches the sibling's value or default.
 * @param {string} key
 * @param {Record<string, any>} properties
 * @param {Record<string, any>} value
 */
export function appliesTo(key, properties, value) {
  if (value?.[key] !== undefined) return true;
  const scope = scopeOf(properties[key]?.description, properties);
  if (!scope || scope.key === key) return true;
  const current = value?.[scope.key] ?? properties[scope.key]?.default;
  if (scope.values === null) return current !== undefined;
  // a scope key with no value and no default (fill_effect type): show everything
  if (current === undefined) return true;
  return scope.values.includes(current);
}

/**
 * One object type's form schema: its branch's properties with the common
 * keys (allOf) merged under them (a branch's own key wins: a glow's opacity).
 * @param {any} objectSchema - the schema's `objectSchema` (oneOf by type)
 * @param {string} type
 * @returns {{ branch: any, own: Record<string, any>, common: Record<string, any> } | null}
 */
export function objectBranch(objectSchema, type) {
  const branch = (objectSchema?.oneOf ?? []).find((/** @type {any} */ b) => b?.properties?.type?.const === type);
  if (!branch) return null;
  /** @type {Record<string, any>} */
  const common = {};
  for (const part of branch.allOf ?? []) Object.assign(common, part?.properties ?? {});
  const own = { ...branch.properties };
  delete own.type;
  for (const k of Object.keys(own)) delete common[k];
  return { branch, own, common };
}

/** Common object keys by group, in form order */
export const COMMON_GROUPS = {
  placement: ['at', 'rotation', 'spin', 'visible', 'opacity'],
  actions: ['tags', 'tap_action', 'hold_action', 'view']
};

/**
 * The empty values a form writes as "not set": the key is removed.
 * @param {any} v
 */
export const isUnset = (v) => v === undefined || v === null || v === '' || (typeof v === 'number' && Number.isNaN(v))
  || (Array.isArray(v) && v.length === 0) || (isObj(v) && Object.keys(v).length === 0);

/**
 * `obj` with `key` set to `value` (removed when unset). A new object.
 * @param {Record<string, any>} obj
 * @param {string} key
 * @param {any} value
 */
export function withKey(obj, key, value) {
  const next = { ...(obj ?? {}) };
  if (isUnset(value)) delete next[key];
  else next[key] = value;
  return next;
}

/**
 * Parse "1, 0.4, 0.2" into numbers (blank entries dropped), or undefined.
 * @param {string} text
 * @returns {number[] | undefined}
 */
export function parseNumbers(text) {
  const out = String(text ?? '').split(/[\s,]+/).filter(Boolean).map(Number).filter((n) => Number.isFinite(n));
  return out.length ? out : undefined;
}

/**
 * A short summary of an object for its list row: type plus the main sizes.
 * @param {any} obj
 */
export function objectSummary(obj) {
  if (!isObj(obj)) return '';
  const bits = [obj.shape ?? obj.material ?? obj.sky].filter(Boolean).map(String);
  const sz = obj.radius ?? obj.size;
  if (sz !== undefined) bits.push(Array.isArray(sz) ? sz.join(' x ') : String(sz));
  if (typeof obj.at === 'string') bits.push(`at ${obj.at}`);
  if (obj.from !== undefined && obj.to !== undefined && typeof obj.from === 'string' && typeof obj.to === 'string') bits.push(`${obj.from} to ${obj.to}`);
  if (Array.isArray(obj.points)) bits.push(`${obj.points.length} points`);
  if (obj.visible === false) bits.push('hidden');
  return bits.join(' · ');
}

/**
 * A fresh id not in `taken`: base1, base2, ...
 * @param {string} base
 * @param {Iterable<string>} taken
 */
export function freshId(base, taken) {
  const ids = new Set([...taken].map(String));
  let n = 1;
  while (ids.has(`${base}${n}`)) n++;
  return `${base}${n}`;
}

/**
 * A new object of a type, with what it needs to show at once.
 * @param {string} type
 * @param {string[]} objectIds
 * @param {string[]} pointIds
 * @returns {Record<string, any>}
 */
export function newObject(type, objectIds, pointIds) {
  /** @type {Record<string, any>} */
  const obj = { type, id: freshId(type, objectIds) };
  const [a, b] = pointIds;
  switch (type) {
    case 'model': obj.src = 'builtin:constitution'; break;
    case 'ring': obj.radius = 50; break;
    case 'path':
      if (a && b) obj.points = [a, b]; else obj.points = [[-50, 0, 0], [50, 0, 0]];
      break;
    case 'beam':
      obj.from = a ?? [-50, 0, 0];
      obj.to = b ?? [50, 0, 0];
      break;
    default: break;
  }
  return obj;
}
