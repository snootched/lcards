/**
 * Live data on points, for the card: positions from entities (bindings),
 * and the label fields that need the card (templates, state colour maps),
 * with what each depends on so a change re-evaluates only what it touches.
 *
 * Free of three.js; the card reaches it through the runtime chunk.
 *
 * @module core/astrometrics/point-data
 */
import { TemplateDetector } from '../templates/TemplateDetector.js';
import { templateRefs } from '../templates/template-refs.js';
import { pointBinding } from './placements.js';
import { resolveLabel } from './label-text.js';

/** Attribute names per bindable form, by default (`state` reads the entity's state) */
export const BINDING_DEFAULTS = /** @type {const} */ ({
  latlon: { keys: ['latitude', 'longitude'], defaults: ['latitude', 'longitude'] },
  altaz: { keys: ['azimuth', 'altitude'], defaults: ['azimuth', 'elevation'] },
  xyz: { keys: null, defaults: ['x', 'y', 'z'] },
  polar: { keys: null, defaults: ['distance', 'bearing'] }
});

/**
 * The entity a point's binding reads: its own `entity`, else the point's.
 * @param {any} point
 * @returns {string | null}
 */
export function bindingEntity(point) {
  const b = pointBinding(point);
  if (!b) return null;
  const id = b.binding.entity ?? point?.entity;
  return typeof id === 'string' && id ? id : null;
}

/**
 * The attribute names a binding reads, in tuple order.
 * @param {'xyz' | 'polar' | 'latlon' | 'altaz'} form
 * @param {Record<string, any>} binding
 * @returns {string[]}
 */
export function bindingAttributes(form, binding) {
  const d = BINDING_DEFAULTS[form];
  if (d.keys) return d.keys.map((k, i) => (typeof binding?.[k] === 'string' && binding[k] ? binding[k] : d.defaults[i]));
  const list = Array.isArray(binding?.attributes) ? binding.attributes : [];
  return d.defaults.map((def, i) => (typeof list[i] === 'string' && list[i] ? list[i] : def));
}

/**
 * The numbers a binding gives for an entity now, or null when one is
 * missing or not a number (the point then has no position).
 * @param {any} point
 * @param {any} entity - a Home Assistant state object
 * @returns {{ form: 'xyz' | 'polar' | 'latlon' | 'altaz', value: number[] | null } | null} null: the point has no binding
 */
export function bindingValue(point, entity) {
  const b = pointBinding(point);
  if (!b) return null;
  if (!entity) return { form: b.form, value: null };
  const nums = bindingAttributes(b.form, b.binding).map((a) => {
    const raw = a === 'state' ? entity.state : entity.attributes?.[a];
    const n = typeof raw === 'number' ? raw : typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : NaN;
    return n;
  });
  return { form: b.form, value: nums.every(Number.isFinite) ? nums : null };
}

/** @param {unknown} v */
const isMap = (v) => !!v && typeof v === 'object' && !Array.isArray(v);

/**
 * What a label field depends on.
 * @typedef {Object} FieldDeps
 * @property {Set<string>} entities - by id (the point's entity when the template reads `entity`)
 * @property {boolean} js - a JavaScript template (may read any state: re-run on every tracked change)
 * @property {boolean} sky - reads sky
 * @property {boolean} ds - reads a data source
 */

/**
 * @typedef {Object} LabelSourceField
 * @property {string} name
 * @property {string} content
 * @property {boolean} templated - content needs evaluating
 * @property {string} [displayFormat]
 * @property {any} color - a state map (resolved by the card), else null
 * @property {any} background - a state map, else null
 * @property {FieldDeps} deps
 */

/**
 * @typedef {Object} LabelSource
 * @property {string} id
 * @property {any} point
 * @property {string | null} entityId
 * @property {any} color - the point's colour when a state map, else null
 * @property {LabelSourceField[]} fields
 */

/**
 * The points whose labels the card must resolve: templates in content,
 * state colour maps (on the point, a field's colour or background). Others
 * the runtime draws on its own.
 * @param {any[]} points
 * @param {any} labelsCfg
 * @returns {LabelSource[]}
 */
export function labelSources(points, labelsCfg) {
  /** @type {LabelSource[]} */
  const out = [];
  for (const point of Array.isArray(points) ? points : []) {
    if (!point || typeof point !== 'object' || point.id === undefined) continue;
    const entityId = typeof point.entity === 'string' && point.entity ? point.entity : null;
    const spec = resolveLabel(point, labelsCfg);
    /** @type {LabelSourceField[]} */
    const fields = [];
    for (const f of spec.fields) {
      const templated = f.template && TemplateDetector.hasTemplates(f.content);
      const color = isMap(f.color) ? f.color : null;
      const background = isMap(f.background) ? f.background : null;
      if (!templated && !color && !background) continue;
      /** @type {FieldDeps} */
      const deps = { entities: new Set(), js: false, sky: false, ds: false };
      if (templated) {
        const refs = templateRefs(f.content, { entityId: entityId ?? undefined });
        refs.entities.forEach((e) => deps.entities.add(e));
        deps.js = f.content.includes('[[[');
        deps.sky = /\bsky\./.test(f.content);
        deps.ds = refs.datasources.length > 0;
      }
      // A state map follows the point's entity
      if ((color || background) && entityId) deps.entities.add(entityId);
      fields.push({ name: f.name, content: f.content, templated, ...(f.display_format !== undefined ? { displayFormat: f.display_format } : {}), color, background, deps });
    }
    const color = isMap(point.color) ? point.color : null;
    if (!fields.length && !color) continue;
    out.push({ id: String(point.id), point, entityId, color, fields });
  }
  return out;
}

/**
 * Whether a field must be re-evaluated for a change.
 * @param {FieldDeps} deps
 * @param {{ all?: boolean, entities?: Set<string>, sky?: boolean, ds?: boolean }} change
 */
export function fieldNeedsUpdate(deps, change) {
  if (change.all) return true;
  if (change.sky && deps.sky) return true;
  if (change.ds && deps.ds) return true;
  if (change.entities?.size) {
    if (deps.js) return true;
    for (const e of deps.entities) if (change.entities.has(e)) return true;
  }
  return false;
}
