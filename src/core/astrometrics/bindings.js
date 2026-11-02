/**
 * Settings from entities (R4b): any numeric key on a point or object, and
 * the card's `time_scale`, `warp_factor`, `clock.rate` and `clock.date`, can follow an
 * entity instead of holding a number:
 *
 *   opacity: { entity: input_number.shields, output: [0, 0.6] }        the mapping form
 *   radius: { entity: sensor.x, attribute: level, input: [0, 10], output: [5, 40], smooth: 1000 }
 *   spin: "[[[ return states['input_number.power'].state / 10 ]]]"  a template
 *
 * The mapping speaks the `map_range` vocabulary used across LCARdS
 * (animations, background animations, the rules' `map_range_cond`): `input`
 * [low, high] of the entity, `output` [low, high] of the setting. `input`
 * defaults to the entity's `min` / `max` attributes, else 0 to 100; without
 * `output` the value is the entity's number as it is. Values outside `input`
 * hold at the ends of `output` unless `clamp: false`. A missing or
 * non-numeric value leaves the key at its default.
 *
 * `camera.view` can follow an entity too (a guided tour): a number picks
 * `views[n]` (from 0), a text state names a view; a stop may also set the
 * clock (`{ view, date, rate }`).
 *
 * Positions (`xyz`, `polar`, `latlon`, `altaz` with `entity`) are the older
 * position bindings (point-data.js), not these.
 *
 * Pure (no three.js, no Lit): the card collects and resolves, the scene
 * applies (live keys ease in place, others rebuild their object).
 *
 * @module core/astrometrics/bindings
 */
import { TemplateDetector } from '../templates/TemplateDetector.js';
import { templateRefs } from '../templates/template-refs.js';
import { BINDABLE_FORMS } from './placements.js';
import { WHOLE_NUMBER_KEYS } from './names.js';

/** How long a live key eases to a new value, ms (`smooth` on the binding) */
export const DEFAULT_SMOOTH_MS = 600;

/**
 * Object keys the scene changes in place (no rebuild), easing: `opacity`
 * scales the whole object, `radius` / `size` scale its node, `spin` turns it.
 */
export const LIVE_OBJECT_KEYS = /** @type {const} */ (['opacity', 'radius', 'size', 'spin']);

/** Keys never walked for bindings: text, actions, references and what is not a setting */
const SKIP = new Set([
  'id', 'type', 'tags', 'label', 'text', 'tap_action', 'hold_action', 'card', 'entity', 'src', 'image', 'at', 'object',
  'part', 'cell', 'sky', 'body', 'center', 'orbit', 'points', 'from', 'to', 'point', 'color', 'colors', 'fill_color',
  'color_to', 'scan_color', 'image_color', 'marker', 'style', 'shape', 'pattern', 'preset', 'axis_labels', 'material'
]);

/**
 * @typedef {Object} SettingBinding
 * @property {'point' | 'object' | 'card'} scope
 * @property {string} id - the point or object id ('' for the card)
 * @property {(string | number)[]} path - from the point or object (or the card) down to the key
 * @property {Record<string, any> | null} spec - the mapping form, or null for a template
 * @property {string | null} template - the template text
 * @property {string[]} entities - what it reads (the mapping's entity; a template's references)
 * @property {boolean} live - the scene changes it in place and eases (else the object rebuilds)
 * @property {number} smooth - ease time, ms (0: step)
 * @property {'number' | 'whole' | 'date'} kind - clock.date resolves to a date, a whole-number key (WHOLE_NUMBER_KEYS) to a
 *   whole number, everything else to a number
 */

/** @param {any} v */
export const isBinding = (v) => !!v && typeof v === 'object' && !Array.isArray(v) && typeof v.entity === 'string' && v.entity !== '';

/** @param {any} v */
export const isTemplateValue = (v) => typeof v === 'string' && TemplateDetector.hasTemplates(v);

/**
 * @param {SettingBinding['scope']} scope
 * @param {string} id
 * @param {(string | number)[]} path
 * @param {any} v
 * @param {SettingBinding['kind']} [kind]
 * @returns {SettingBinding | null}
 */
function makeBinding(scope, id, path, v, kind = 'number') {
  const key = path[path.length - 1];
  if (kind === 'number' && scope !== 'card' && WHOLE_NUMBER_KEYS.includes(/** @type {any} */ (key))) kind = 'whole';
  const live = (scope === 'object' && path.length === 1 && LIVE_OBJECT_KEYS.includes(/** @type {any} */ (key)))
    || (scope === 'card' && (path.join('.') === 'time_scale' || path.join('.') === 'clock.rate'));
  if (isBinding(v)) {
    const smooth = Number(v.smooth);
    return { scope, id, path, spec: v, template: null, entities: [v.entity], live, smooth: Number.isFinite(smooth) && smooth >= 0 ? smooth : DEFAULT_SMOOTH_MS, kind };
  }
  if (isTemplateValue(v)) {
    return { scope, id, path, spec: null, template: v, entities: [...templateRefs(v).entities], live, smooth: DEFAULT_SMOOTH_MS, kind };
  }
  return null;
}

/**
 * Bindings inside a point or object config, at any depth (deform steps,
 * fill_effect, pulse), skipping text, actions and references.
 * @param {any} node
 * @param {(string | number)[]} path
 * @param {(path: (string | number)[], v: any) => void} found
 * @param {boolean} isPoint
 */
function walk(node, path, found, isPoint) {
  if (Array.isArray(node)) {
    node.forEach((v, i) => {
      if (isBinding(v) || isTemplateValue(v)) found([...path, i], v);
      else if (v && typeof v === 'object') walk(v, [...path, i], found, isPoint);
    });
    return;
  }
  for (const [k, v] of Object.entries(node ?? {})) {
    if (SKIP.has(k)) continue;
    // a point's position from an entity is the older position binding
    if (isPoint && path.length === 0 && BINDABLE_FORMS.includes(/** @type {any} */ (k))) continue;
    if (isBinding(v) || isTemplateValue(v)) found([...path, k], v);
    else if (v && typeof v === 'object') walk(v, [...path, k], found, isPoint);
  }
}

/**
 * Every setting binding in a (flattened) card config.
 * @param {any} config
 * @returns {SettingBinding[]}
 */
export function collectBindings(config) {
  /** @type {SettingBinding[]} */
  const out = [];
  const add = (/** @type {SettingBinding | null} */ b) => { if (b) out.push(b); };
  for (const p of Array.isArray(config?.points) ? config.points : []) {
    if (!p || typeof p !== 'object' || p.id === undefined) continue;
    walk(p, [], (path, v) => add(makeBinding('point', String(p.id), path, v)), true);
  }
  for (const o of Array.isArray(config?.objects) ? config.objects : []) {
    if (!o || typeof o !== 'object' || o.id === undefined || o.type === 'system') continue;
    walk(o, [], (path, v) => add(makeBinding('object', String(o.id), path, v)), false);
  }
  add(makeBinding('card', '', ['time_scale'], config?.time_scale));
  add(makeBinding('card', '', ['warp_factor'], config?.warp_factor));
  add(makeBinding('card', '', ['clock', 'rate'], config?.clock?.rate));
  add(makeBinding('card', '', ['clock', 'date'], config?.clock?.date, 'date'));
  return out;
}

/**
 * A bound value as its key takes it: a whole-number key's rounded (so an
 * entity moving within one step does not rebuild the object), else as it is.
 * @param {SettingBinding} b
 * @param {any} value
 */
export function roundedSetting(b, value) {
  return b.kind === 'whole' && typeof value === 'number' ? Math.round(value) : value;
}

/** A binding's key, unique in a card: `object:ring1:deform.0.amplitude` @param {SettingBinding} b */
export const bindingKey = (b) => `${b.scope}:${b.id}:${b.path.join('.')}`;

/**
 * The number a mapping gives for an entity now: the state (or `attribute`),
 * mapped from `range` to `to` and clamped; null when it is missing or not a
 * number.
 * @param {Record<string, any>} spec
 * @param {any} entity - a Home Assistant state object
 * @returns {number | null}
 */
export function mapEntity(spec, entity) {
  if (!entity) return null;
  const raw = typeof spec.attribute === 'string' && spec.attribute ? entity.attributes?.[spec.attribute] : entity.state;
  return mapNumber(spec, raw, entity.attributes);
}

/**
 * A raw value through a mapping (a template's result too).
 * @param {Record<string, any> | null} spec
 * @param {any} raw
 * @param {Record<string, any>} [attributes] - for the input default (min / max)
 * @returns {number | null}
 */
export function mapNumber(spec, raw, attributes = {}) {
  if (raw === null || raw === undefined || raw === '' || typeof raw === 'boolean') return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  const output = pairOf(spec?.output);
  if (!output) return n;
  const input = pairOf(spec?.input) ?? (Number.isFinite(Number(attributes?.min)) && Number.isFinite(Number(attributes?.max)) && Number(attributes.max) !== Number(attributes.min)
    ? [Number(attributes.min), Number(attributes.max)] : [0, 100]);
  const span = input[1] - input[0];
  const t0 = span === 0 ? 0 : (n - input[0]) / span;
  const t = spec?.clamp === false ? t0 : Math.min(1, Math.max(0, t0));
  return output[0] + t * (output[1] - output[0]);
}

/** @param {any} v @returns {[number, number] | null} */
function pairOf(v) {
  if (!Array.isArray(v) || v.length < 2) return null;
  const a = Number(v[0]), b = Number(v[1]);
  return Number.isFinite(a) && Number.isFinite(b) ? [a, b] : null;
}

/**
 * The date a binding gives (clock.date): an entity's state or attribute
 * (an `input_datetime`, a sensor with a timestamp), or a template's text,
 * as given; the clock parses it. null when there is none.
 * @param {Record<string, any> | null} spec
 * @param {any} raw - a template's result, or the entity's state object
 */
export function dateValue(spec, raw) {
  if (spec) {
    if (!raw) return null;
    const v = typeof spec.attribute === 'string' && spec.attribute ? raw.attributes?.[spec.attribute] : raw.state;
    return v === undefined || v === null || v === '' || v === 'unknown' || v === 'unavailable' ? null : String(v);
  }
  return raw === undefined || raw === null || raw === '' ? null : String(raw);
}

/**
 * A config with values set at paths (a copy along each path; the rest
 * shared). null removes the key, so the key's default applies.
 * @param {any} obj
 * @param {Iterable<[(string | number)[], any]>} entries
 */
export function withValues(obj, entries) {
  let out = obj;
  for (const [path, value] of entries) out = setAt(out, path, value);
  return out;
}

/**
 * @param {any} node
 * @param {(string | number)[]} path
 * @param {any} value
 * @returns {any}
 */
function setAt(node, path, value) {
  if (!path.length) return value;
  const [k, ...rest] = path;
  const copy = Array.isArray(node) ? [...node] : { ...(node ?? {}) };
  if (rest.length) copy[/** @type {any} */ (k)] = setAt(copy[/** @type {any} */ (k)], rest, value);
  else if (value === null || value === undefined) {
    if (Array.isArray(copy)) copy[/** @type {number} */ (k)] = undefined;
    else delete copy[/** @type {string} */ (k)];
  } else copy[/** @type {any} */ (k)] = value;
  return copy;
}

/**
 * `camera.view` bound to an entity (a guided tour): `{ entity, attribute?, views? }`.
 * @param {any} view
 */
export const isTourView = (view) => isBinding(view);

/**
 * Where a tour goes for an entity's value: a number picks `views[n]` (from
 * 0, rounded, clamped); text names a view (or matches a stop's `view`). A
 * stop is a view name or `{ view, date?, rate? }`.
 * @param {Record<string, any>} tour - the camera.view binding
 * @param {any} entity
 * @returns {{ view: string, date?: any, rate?: any } | null}
 */
export function tourStop(tour, entity) {
  if (!entity) return null;
  const raw = typeof tour.attribute === 'string' && tour.attribute ? entity.attributes?.[tour.attribute] : entity.state;
  if (raw === undefined || raw === null || raw === '' || raw === 'unknown' || raw === 'unavailable') return null;
  const stops = Array.isArray(tour.views) ? tour.views : [];
  const asStop = (/** @type {any} */ s) => (typeof s === 'string' ? { view: s } : s && typeof s === 'object' && typeof s.view === 'string' ? s : null);
  const n = Number(raw);
  if (stops.length && Number.isFinite(n)) return asStop(stops[Math.min(stops.length - 1, Math.max(0, Math.round(n)))]);
  const name = String(raw);
  return stops.map(asStop).find((s) => s?.view === name) ?? { view: name };
}

/**
 * One ease step: where a live value is at `now` between `from` and `to`
 * (smoothstep over `ms`).
 * @param {number} from
 * @param {number} to
 * @param {number} start - when it began, ms
 * @param {number} ms
 * @param {number} now
 * @returns {{ value: number, done: boolean }}
 */
export function easeStep(from, to, start, ms, now) {
  if (!(ms > 0) || now >= start + ms) return { value: to, done: true };
  const t = Math.max(0, (now - start) / ms);
  const s = t * t * (3 - 2 * t);
  return { value: from + (to - from) * s, done: false };
}

/**
 * A config with every setting binding replaced by its value now (the card's
 * values, by bindingKey; none yet: the key's default). A live opacity builds
 * at 1 (the scene multiplies the value in); the card's time_scale and clock
 * keys are left out (the scene gets them through setLive and setClock).
 * @param {Record<string, any>} config
 * @param {SettingBinding[]} settings
 * @param {Map<string, any>} values
 */
export function settingConfig(config, settings, values) {
  if (!settings.length) return config;
  /** @type {Map<string, [(string | number)[], any][]>} */
  const byItem = new Map();
  /** @type {[(string | number)[], any][]} */
  const card = [];
  for (const b of settings) {
    if (b.scope === 'card') {
      card.push([b.path, null]);
      continue;
    }
    const v = b.live && b.path[0] === 'opacity' ? 1 : (values.get(bindingKey(b)) ?? null);
    const k = `${b.scope}:${b.id}`;
    if (!byItem.has(k)) byItem.set(k, []);
    /** @type {any[]} */ (byItem.get(k)).push([b.path, v]);
  }
  const map = (/** @type {any[] | undefined} */ list, /** @type {string} */ scope) => list?.map((item) => {
    const entries = item && item.id !== undefined ? byItem.get(`${scope}:${String(item.id)}`) : undefined;
    return entries ? withValues(item, entries) : item;
  });
  return withValues({
    ...config,
    ...(Array.isArray(config.points) ? { points: map(config.points, 'point') } : {}),
    ...(Array.isArray(config.objects) ? { objects: map(config.objects, 'object') } : {})
  }, card);
}
