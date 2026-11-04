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
 * @typedef {'boolean' | 'enum' | 'number' | 'range' | 'textDefault' | 'rate' | 'date' | 'shape' | 'color' | 'colorList' | 'font' | 'text' | 'asset' | 'strings' | 'tuple' | 'numbers'
 *   | 'pointRef' | 'numberOrTuple' | 'boolOrObject' | 'valueOrObject' | 'boolOrNumber' | 'boolOrList' | 'choice' | 'object' | 'objectList' | 'pointList' | 'yaml'} FieldKind
 */

const isObj = (/** @type {any} */ v) => !!v && typeof v === 'object' && !Array.isArray(v);

/** @param {any} s */
const isPlainColor = (s) => !!s && (s === simpleColorSchema || (Array.isArray(s.allOf) && s.allOf.includes(simpleColorSchema)));

/** A colour, or one that can also follow an entity (astrometrics objectColor) @param {any} s */
const isColor = (s) => isPlainColor(s)
  || (Array.isArray(s?.anyOf) && s.anyOf.some(isPlainColor) && s.anyOf.every((/** @type {any} */ b) => isPlainColor(b) || isBindingSchema(b)));

/** A list of colours @param {any} s */
const isColorArray = (s) => hasType(s, 'array') && isColor(s.items);

/**
 * A property's `x-ui-hints` (label, selector, widget, group), or {}.
 * @param {any} s
 * @returns {Record<string, any>}
 */
export const uiHints = (s) => (isObj(s?.['x-ui-hints']) ? s['x-ui-hints'] : {});

/** @param {any} s @param {string} t */
const hasType = (s, t) => s?.type === t || (Array.isArray(s?.type) && s.type.includes(t));

/** @param {any} s */
const isNumberSchema = (s) => hasType(s, 'number') || hasType(s, 'integer');

/** @param {any} s */
/** an array of numbers; its items may be settings (a number that can follow an entity: a pair's sides) */
const isNumberArray = (s) => hasType(s, 'array') && (isNumberSchema(s.items) || !!settingNumber(s.items));

/** A fixed-length number array (2 to 4): [x, y, z], [from, to] @param {any} s */
const isTuple = (s) => isNumberArray(s) && s.minItems !== undefined && s.minItems === s.maxItems && s.minItems >= 2 && s.minItems <= 4;

/**
 * [low, high] of a bounded number (a brightness range, 0 to 1): two sliders.
 * Its items may be settings (a nebula's).
 * @param {any} s
 */
const isRange = (s) => {
  if (!hasType(s, 'array') || s.minItems !== 2 || s.maxItems !== 2) return false;
  const item = settingNumber(s.items) ?? s.items;
  return isNumberSchema(item) && Number.isFinite(item.minimum) && Number.isFinite(item.maximum);
};

/** The number schema of a range's items @param {any} s */
export const rangeItem = (s) => settingNumber(s?.items) ?? s?.items ?? {};

/** A point id or [x, y, z] @param {any} s */
const isPointRef = (s) => Array.isArray(s?.oneOf) && s.oneOf.length === 2
  && s.oneOf.some((/** @type {any} */ b) => hasType(b, 'string') && !b.enum) && s.oneOf.some((/** @type {any} */ b) => isTuple(b) && b.minItems === 3);

/** The `{ entity, ... }` branch of a bindable setting (R4b) @param {any} b */
const isBindingSchema = (b) => hasType(b, 'object') && !!b?.properties?.entity && Array.isArray(b?.required) && b.required.includes('entity');

/** A template-only string branch (a pattern, no enum) @param {any} b */
const isTemplateSchema = (b) => hasType(b, 'string') && !b.enum && typeof b.pattern === 'string';

/**
 * A schema with an `{ entity, ... }` branch: a bindable setting (astrometrics
 * `setting()` / `settingOrPair()`).
 * @param {any} s
 */
export const isBindable = (s) => Array.isArray(s?.anyOf) && s.anyOf.some(isBindingSchema);

/**
 * The number branch of a bindable setting, or null.
 * @param {any} s
 * @returns {any}
 */
export function settingNumber(s) {
  const alts = s?.anyOf;
  if (!Array.isArray(alts) || !alts.some(isBindingSchema)) return null;
  const rest = alts.filter((b) => !isBindingSchema(b) && !isTemplateSchema(b));
  return rest.length === 1 && isNumberSchema(rest[0]) ? rest[0] : null;
}

/** A setting value that follows an entity (`{ entity }`) @param {any} v */
export const isBoundValue = (v) => isObj(v) && typeof v.entity === 'string';

/**
 * The `{ entity, ... }` branch of a bindable property (its keys say which
 * binding fields apply: a look takes entity and attribute, a number range and to too).
 * @param {any} s
 * @returns {any}
 */
export const bindingBranch = (s) => (s?.oneOf ?? s?.anyOf ?? []).find(isBindingSchema) ?? null;

/**
 * A pair setting whose sides can each follow an entity ([inner, outer] with a
 * binding on either): the array branch's item schema, else null.
 * @param {any} s
 */
export function pairItemSchema(s) {
  const arr = (s?.oneOf ?? s?.anyOf ?? []).find((/** @type {any} */ b) => b?.type === 'array');
  return arr?.items && bindingBranch(arr.items) ? arr.items : null;
}

/** Whether a property takes a template string @param {any} s */
export const takesTemplate = (s) => (s?.oneOf ?? s?.anyOf ?? []).some(isTemplateSchema);

/** A template value (JavaScript, Jinja2 or a token) @param {any} v */
export const isTemplateValue = (v) => typeof v === 'string' && /\[\[\[|\{\{|\{[A-Za-z_]/.test(v);

/** A guided tour (camera.view: { entity, views }) @param {any} s */
export const isTour = (s) => !!bindingBranch(s)?.properties?.views;

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
  const widget = uiHints(s).widget;
  if (widget === 'font' || s.format === 'font-family') return 'font';
  // the scene clock's rate and date (clock-fields.js)
  if (widget === 'rate') return 'rate';
  if (widget === 'date') return 'date';
  // a grid's, volume's or image's shape: a picture picker
  if (widget === 'shape' && Array.isArray(s.enum)) return 'shape';
  // generated labels' text (ring_labels.text: only default): the card editors' text controls
  if (widget === 'textDefault') return 'textDefault';
  if (isRange(s)) return 'range';
  if (isColorArray(s)) return 'colorList';
  if (isPointRef(s)) return 'pointRef';
  // a number that can follow an entity or a template (R4b): a number field with a bind button
  if (settingNumber(s)) return 'number';
  const all = s.oneOf ?? s.anyOf;
  if (Array.isArray(all)) {
    // a view name, or a guided tour ({ entity, views }): text; a tour is edited as YAML
    if (all.length === 2 && all.some((b) => hasType(b, 'string') && !b.enum) && all.some(isBindingSchema)) return 'text';
    // a binding or template branch does not change the field (a bind button is added)
    const alts = all.filter((b) => !isBindingSchema(b) && !isTemplateSchema(b));
    // true / false, or an entity it follows (warp): a checkbox, the entity form as YAML
    if (alts.length === 1 && hasType(alts[0], 'boolean')) return 'boolean';
    if (alts.length === 2) {
      // one colour or a list of them (a nebula's or a fill's colours)
      if (alts.some(isColor) && alts.some(isColorArray)) return 'colorList';
      // one number, or a pair / triple of numbers ([w, d], [a, b], [w, h, d])
      if (alts.some(isNumberSchema) && alts.some(isTuple)) return 'numberOrTuple';
      // true, or an object to choose (stars, buttons, pulse)
      if (alts.some((b) => hasType(b, 'boolean')) && alts.some(isWalkable)) return 'boolOrObject';
      // true, or a factor (a line's glow)
      if (alts.some((b) => hasType(b, 'boolean')) && alts.some(isNumberSchema)) return 'boolOrNumber';
      // true, or a list of names (hide_in_systems: true, or the systems to hide in)
      if (alts.some((b) => hasType(b, 'boolean')) && alts.some((b) => hasType(b, 'array') && hasType(b.items, 'string'))) return 'boolOrList';
      // a short value, or the part's settings (a sphere's image: the map, or { src, opacity }; dash: [on, off], or { pattern, speed })
      if (alts.some(isWalkable) && alts.some((b) => !isWalkable(b) && !hasType(b, 'boolean'))) return 'valueOrObject';
    }
    // words, plus true / false or any number (a clock rate: live or days per second; the time slider: true or a mode)
    if (choiceOptions(s)) return 'choice';
    return 'yaml';
  }
  if (s.const !== undefined) return 'yaml';
  if (Array.isArray(s.enum) && s.enum.every((/** @type {any} */ v) => typeof v === 'string')) return 'enum';
  if (hasType(s, 'boolean') && !Array.isArray(s.type)) return 'boolean';
  if (isNumberSchema(s) && !Array.isArray(s.type)) return 'number';
  // a file (assetSource: 'model' | 'image'): library, path or media picker
  if (hasType(s, 'string') && (s.assetSource === 'model' || s.assetSource === 'image')) return 'asset';
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
 * A `choice` property's menu: the words of its string enum, true and false
 * when a branch is boolean, and whether a typed number is allowed. Null
 * when the alternatives are anything else.
 * @param {any} s
 * @returns {{ words: string[], bool: boolean, number: boolean } | null}
 */
export function choiceOptions(s) {
  const all = s?.oneOf ?? s?.anyOf;
  if (!Array.isArray(all)) return null;
  // a binding or template branch (R4b) does not change the menu
  const alts = all.filter((b) => !isBindingSchema(b) && !isTemplateSchema(b));
  const words = alts.filter((b) => hasType(b, 'string') && Array.isArray(b.enum));
  const bool = alts.some((b) => hasType(b, 'boolean'));
  const number = alts.some(isNumberSchema);
  if (!words.length || words.length + (bool ? 1 : 0) + (number ? 1 : 0) !== alts.length) return null;
  return { words: words.flatMap((b) => b.enum), bool, number };
}

/**
 * A choice field's text back to its value: true / false, a number when
 * numbers are allowed, else the word.
 * @param {any} v
 * @param {{ bool: boolean, number: boolean }} opts
 */
export function choiceValue(v, { bool, number }) {
  if (v === '' || v === undefined || v === null) return undefined;
  if (bool && (v === 'true' || v === true)) return true;
  if (bool && (v === 'false' || v === false)) return false;
  const n = Number(v);
  if (number && String(v).trim() !== '' && Number.isFinite(n)) return n;
  return String(v);
}

/**
 * The ha-selector for a number field: the `x-ui-hints` selector when there
 * is one, a slider (with its box) when the schema bounds both ends, else a box.
 * @param {any} s
 * @returns {{ number: Record<string, any> }}
 */
export function numberSelector(s) {
  const hint = uiHints(s).selector;
  if (hint?.number) return hint;
  const n = settingNumber(s) ?? s;
  const whole = hasType(n, 'integer');
  const { minimum: min, maximum: max } = n ?? {};
  if (Number.isFinite(min) && Number.isFinite(max)) return { number: { mode: 'slider', min, max, step: whole ? 1 : 'any' } };
  return { number: { mode: 'box', min, max, step: whole ? 1 : 'any' } };
}

/**
 * A label with the open scope's units when the key is in scene units
 * ("Radius (ly)"); as it is when the scene names no units.
 * @param {string} label
 * @param {string | undefined} description
 * @param {string | undefined} units
 */
export function unitsLabel(label, description, units) {
  return units && /scene units/.test(String(description ?? '')) ? `${label} (${units})` : label;
}

/**
 * The object form's groups, in order: the type's own shape and size keys
 * (no header), then sections by what a key does.
 */
export const OBJECT_GROUPS = [
  { id: 'main', header: '', icon: '' },
  { id: 'appearance', header: 'Appearance', icon: 'mdi:palette-outline' },
  { id: 'position', header: 'Position and motion', icon: 'mdi:axis-arrow' },
  { id: 'visibility', header: 'Visibility and distance', icon: 'mdi:map-marker-distance' },
  { id: 'actions', header: 'Actions and tags', icon: 'mdi:gesture-tap' },
  { id: 'advanced', header: 'Advanced', icon: 'mdi:tune-variant' }
];

/** The keys every object shares, by group */
export const COMMON_GROUPS = {
  appearance: ['opacity'],
  position: ['at', 'rotation', 'face', 'spin'],
  visibility: ['visible', 'min_distance', 'max_distance', 'fade', 'hide_in_systems', 'look'],
  actions: ['tags', 'tap_action', 'hold_action', 'view']
};

/** A type's own keys that are about how it looks (colours, opacity, line widths, effects) */
const APPEARANCE_KEY = /(^|_)(colou?rs?|opacity|glow|dash|blend|material|scanlines|edges)$|^(colou?r_|line_width|width|image|scan|fill$|style|falloff|pulse$)/;

/** A type's own keys few need: limits and drawing order */
const ADVANCED_KEYS = new Set(['occlude']);

/**
 * Which object-form group a key sits in: its `x-ui-hints.group`, the shared
 * keys' table, else by name (colours and opacity to Appearance), else the
 * type's own block.
 * @param {string} key
 * @param {any} [s]
 * @returns {string}
 */
export function groupOf(key, s) {
  const hint = uiHints(s).group;
  if (typeof hint === 'string') return hint;
  for (const [group, keys] of Object.entries(COMMON_GROUPS)) if (keys.includes(key)) return group;
  if (ADVANCED_KEYS.has(key)) return 'advanced';
  if (APPEARANCE_KEY.test(key)) return 'appearance';
  return 'main';
}

/** Section icons by key (a nested object or list); else by kind */
const SECTION_ICONS = {
  backdrop: 'mdi:weather-night', stars: 'mdi:star-four-points-outline', dust: 'mdi:blur', labels: 'mdi:label-outline',
  clock: 'mdi:clock-outline', buttons: 'mdi:gesture-tap-button', limits: 'mdi:arrow-expand-all', target: 'mdi:crosshairs',
  fill: 'mdi:texture-box', effect: 'mdi:texture-box', deform: 'mdi:waves', cells: 'mdi:grid', ring_labels: 'mdi:label-multiple-outline',
  axis_labels: 'mdi:label-multiple-outline', pulse: 'mdi:pulse', clouds: 'mdi:weather-cloudy', text: 'mdi:format-text',
  default: 'mdi:format-text', styles: 'mdi:format-list-text', outline: 'mdi:vector-polygon', animation: 'mdi:animation-play',
  sky: 'mdi:weather-sunset', body: 'mdi:earth', orbit: 'mdi:orbit', well: 'mdi:chart-bell-curve', edges: 'mdi:vector-square',
  major: 'mdi:grid-large', scan: 'mdi:radar', band: 'mdi:ring', faces: 'mdi:cube-outline', rim: 'mdi:circle-outline', core: 'mdi:circle-slice-8',
  nucleus: 'mdi:circle-small', coma: 'mdi:blur-radial', tail: 'mdi:arrow-right-thin', ion_tail: 'mdi:arrow-right-thin', dust_tail: 'mdi:weather-windy',
  activity: 'mdi:sun-thermometer-outline', arms: 'mdi:rotate-orbit', bar: 'mdi:minus', spectrum: 'mdi:looks', glow: 'mdi:brightness-7'
};

/**
 * The icon of a section for a key: its own, else one for its kind.
 * @param {string} key
 * @param {string} kind - a FieldKind, or 'item' for one entry of a list
 */
export function sectionIcon(key, kind) {
  const own = /** @type {Record<string, string>} */ (SECTION_ICONS)[key];
  if (own) return own;
  if (kind === 'objectList') return 'mdi:format-list-bulleted';
  if (kind === 'item') return 'mdi:circle-medium';
  if (kind === 'yaml') return 'mdi:code-braces';
  return 'mdi:tune-variant';
}

/**
 * The object branch of a boolOrObject property.
 * @param {any} s
 */
export const objectAlternative = (s) => (s?.oneOf ?? s?.anyOf ?? []).find(isWalkable) ?? null;

/**
 * A `valueOrObject` property's short form: the key of its object form that
 * takes the short value (the same schema: a sphere image's `src`, a dash's
 * `pattern`), else the first key.
 * @param {any} s
 * @returns {string | null}
 */
export function shorthandKey(s) {
  const alt = objectAlternative(s);
  if (!alt) return null;
  const short = (s.oneOf ?? s.anyOf).find((/** @type {any} */ b) => b !== alt);
  const keys = Object.keys(alt.properties);
  return keys.find((k) => alt.properties[k] === short) ?? keys[0] ?? null;
}

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
export const tupleSize = (s) => (isTuple(s) ? s.minItems : ((s?.oneOf ?? s?.anyOf)?.find(isTuple)?.minItems ?? 0));

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
  // a scope key with no value and no default (fill.effect type): show everything
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
 * A short summary of an object for its list row (after its type): one key
 * value (its shape, look or size, where it stands, or its route's ends),
 * then whether it is hidden or follows an entity.
 * @param {any} obj
 */
export function objectSummary(obj) {
  if (!isObj(obj)) return '';
  const bits = [obj.shape ?? obj.material ?? obj.sky].filter(Boolean).map(String);
  const sz = obj.radius ?? obj.size;
  // a side of a pair that follows an entity or a template reads as such
  if (typeof sz === 'number' || Array.isArray(sz)) bits.push(Array.isArray(sz) ? sz.map((v) => (isBoundValue(v) ? 'entity' : isTemplateValue(v) ? 'template' : v)).join(' x ') : String(sz));
  if (obj.type === 'system' && obj.units) bits.push(`in ${obj.units}`);
  if (typeof obj.at === 'string') bits.push(`at ${obj.at}`);
  // a route only when nothing above says what it is
  if (!bits.length && typeof obj.from === 'string' && typeof obj.to === 'string') bits.push(`${obj.from} to ${obj.to}`);
  if (!bits.length && obj.type === 'path' && Array.isArray(obj.points)) bits.push(`${obj.points.length} points`);
  if (!bits.length && typeof obj.point === 'string') bits.push(`behind ${obj.point}`);
  if (obj.visible === false) bits.push('hidden');
  const follows = boundIn(obj);
  if (follows.length) bits.push(`follows ${follows.join(', ')}`);
  return bits.join(' · ');
}

/** Keys whose values are text or actions, never settings: their templates are not bindings */
const NOT_SETTINGS = new Set(['label', 'text', 'tap_action', 'hold_action', 'card']);

/**
 * What a value follows (R4b): the entities of its `{ entity }` settings and
 * `template` for a templated one, at any depth (deform steps, fill effects).
 * @param {any} value
 * @returns {string[]}
 */
export function boundIn(value) {
  /** @type {Set<string>} */
  const out = new Set();
  /** @param {any} v */
  const walk = (v) => {
    if (isBoundValue(v)) { out.add(v.entity ? String(v.entity) : 'an entity'); return; }
    if (typeof v === 'string') { if (/\[\[\[|\{\{|\{[A-Za-z_]/.test(v)) out.add('a template'); return; }
    if (Array.isArray(v)) { v.forEach(walk); return; }
    if (isObj(v)) for (const [k, x] of Object.entries(v)) if (!NOT_SETTINGS.has(k)) walk(x);
  };
  walk(value);
  return [...out];
}

/**
 * Whether any of these keys of an object follows an entity or a template
 * (its section opens and says so).
 * @param {any} obj
 * @param {string[]} keys
 */
export const keysBound = (obj, keys) => keys.some((k) => boundIn(obj?.[k]).length > 0);

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
 * Each type's size keys at `k` times the size it draws at with none set
 * (the builders' defaults, made for a scene about 100 units across).
 * @type {Record<string, (k: number) => Record<string, any>>}
 */
const SIZES = {
  grid: (k) => ({ size: 200 * k, line_spacing: 10 * k }),
  volume: (k) => ({ radius: [50 * k, 100 * k], height: [0, 10 * k] }),
  sphere: (k) => ({ radius: 10 * k }),
  image: (k) => ({ size: 200 * k }),
  glow: (k) => ({ size: 60 * k }),
  nebula: (k) => ({ radius: 100 * k }),
  model: (k) => ({ size: 50 * k }),
  belt: (k) => ({ radius: [80 * k, 100 * k], size: [0.4 * k, 1.6 * k] }),
  asteroid: (k) => ({ size: 4 * k }),
  comet: (k) => ({ nucleus: { size: 2 * k }, coma: { size: 10 * k }, tail: { length: 60 * k } }),
  cube: (k) => ({ size: 20 * k })
};

/** Types placed by their ends or a point, not by `at` */
const UNPLACED = new Set(['path', 'beam', 'trail']);

/**
 * How much larger than the builders' defaults a new object should be to fill
 * the view from `distance` (a default-sized scene is framed from about 280):
 * 1 unless the defaults would be lost in the view or fill it (more than 3
 * times off), else a round 1, 2 or 5 times a power of ten.
 * @param {number} distance - the camera's distance, in the units the object goes in
 */
export function viewScale(distance) {
  if (!(distance > 0) || !Number.isFinite(distance)) return 1;
  const raw = distance / 280;
  if (raw >= 1 / 3 && raw <= 3) return 1;
  const exp = Math.floor(Math.log10(raw));
  const base = raw / 10 ** exp;
  const step = base < 1.5 ? 1 : base < 3.5 ? 2 : base < 7.5 ? 5 : 10;
  return Number((step * 10 ** exp).toPrecision(1));
}

/**
 * A new object of a type, with what it needs to show at once: sized `scale`
 * times the default and placed `at` (a point id or a position), so it shows
 * where the camera looks. With `real` (the scope has units) a model has no
 * size: it is drawn at its real size.
 * @param {string} type
 * @param {string[]} objectIds
 * @param {string[]} pointIds
 * @param {{ scale?: number, at?: string | number[], real?: boolean }} [place]
 * @returns {Record<string, any>}
 */
export function newObject(type, objectIds, pointIds, place = {}) {
  /** @type {Record<string, any>} */
  const obj = { type, id: freshId(type, objectIds) };
  const k = place.scale ?? 1;
  const at = place.at;
  // ends round a position (a point's spot is not known here)
  const c = Array.isArray(at) ? at : [0, 0, 0];
  /** @param {number} x */
  const end = (x) => [c[0] + x * k, c[1], c[2]].map(round);
  if (at !== undefined && !UNPLACED.has(type)) obj.at = at;
  const [a, b] = pointIds;
  switch (type) {
    case 'model': obj.src = 'builtin:constitution'; break;
    case 'ring': obj.radius = round(50 * k); break;
    case 'path':
      if (a && b) obj.points = [a, b]; else obj.points = [end(-50), end(50)];
      break;
    case 'beam':
      obj.from = a ?? end(-50);
      obj.to = b ?? end(50);
      break;
    case 'trail':
      if (a) obj.point = a;
      break;
    // a galaxy at the scale of a scene built to fit (the schema default is 50,000 ly)
    case 'galaxy': obj.radius = round(100 * k); break;
    default: break;
  }
  if (k !== 1 && SIZES[type] && !(type === 'model' && place.real)) {
    /** @param {any} v @returns {any} */
    const scaled = (v) => (Array.isArray(v) ? v.map(round) : isObj(v) ? Object.fromEntries(Object.entries(v).map(([kk, vv]) => [kk, scaled(vv)])) : round(v));
    for (const [key, v] of Object.entries(SIZES[type](k))) obj[key] = scaled(v);
  }
  return obj;
}

/**
 * An object given a new `shape`, its size carried across when the new shape
 * reads another key (a plane's `size` is a disc's `radius`, a sector's
 * `radius` a box's `size`), so a scaled object keeps its scale.
 * @param {Record<string, any>} obj - before
 * @param {Record<string, any>} next - with the new shape
 * @returns {Record<string, any>}
 */
export function reshape(obj, next) {
  if (!obj || next.shape === obj.shape) return next;
  const out = { ...next };
  /** @param {any} v */
  const outer = (v) => (Array.isArray(v) ? Number(v[1] ?? v[0]) : Number(v));
  /** @param {any} v */
  const widest = (v) => (Array.isArray(v) ? Math.max(...v.map(Number)) : Number(v));
  if (obj.type === 'grid') {
    const toPlane = (next.shape ?? 'plane') === 'plane';
    if (toPlane && out.size === undefined && obj.radius !== undefined) out.size = round(outer(obj.radius) * 2);
    if (!toPlane && out.radius === undefined && obj.size !== undefined) out.radius = round(widest(obj.size) / 2);
  } else if (obj.type === 'volume') {
    if (next.shape === 'box' && out.size === undefined && obj.radius !== undefined) out.size = round(outer(obj.radius));
    if ((next.shape ?? 'sector') === 'sector' && out.radius === undefined && obj.size !== undefined) {
      const s = widest(obj.size);
      out.radius = [round(s / 2), round(s)];
    }
  }
  return out;
}

/** A length to 3 significant figures (a converted size reads cleanly) @param {number} v */
function round(v) {
  return Number.isFinite(v) && v !== 0 ? Number(v.toPrecision(3)) : v;
}
