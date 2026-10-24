/**
 * Background animation editor fields built from the params schemas
 * (BACKGROUND_ANIMATION_PARAMS_SCHEMAS), for the presets and key groups the
 * editor has no hand-written section for: the WebGL presets, the grid view
 * and camera keys, nebula's `volumetric`. Pure, so it is tested in node.
 *
 * @module editor/components/background-animation-fields
 */
import { BACKGROUND_ANIMATION_PARAMS_SCHEMAS } from '../../cards/schemas/background-animation-params-schemas.js';

/**
 * @typedef {{ key: string, label: string, type: 'number' | 'select' | 'boolean' | 'color',
 *   min?: number, max?: number, step?: number, options?: string[], default?: any, helper?: string }} EditorField
 */

/** Keys of the grid presets' view, camera and scan group */
export const GRID_VIEW_KEYS = ['view', 'camera_tilt', 'camera_yaw', 'camera_distance', 'fov', 'scan_period', 'scan_color'];

/**
 * Sections for presets the editor builds from the schema: header, icon, keys.
 * `colors` (a list) is edited with the colour list, outside these.
 * @type {Record<string, Array<{ header: string, icon: string, keys: string[] }>>}
 */
export const SCHEMA_SECTIONS = {
  'warp-starfield': [
    { header: 'Stars', icon: 'mdi:star-shooting', keys: ['seed', 'count', 'min_radius', 'max_radius', 'streak', 'opacity'] },
    { header: 'Camera', icon: 'mdi:axis-arrow', keys: ['camera_tilt', 'camera_yaw', 'fov'] }
  ],
  'holo-sphere': [
    { header: 'Sphere', icon: 'mdi:earth', keys: ['size', 'position_x', 'position_y', 'tilt', 'rotate_speed', 'latitude_lines', 'longitude_lines', 'line_width', 'back_opacity', 'opacity'] },
    { header: 'Scan band', icon: 'mdi:radar', keys: ['scan_period'] },
    { header: 'Colours', icon: 'mdi:palette', keys: ['color', 'scan_color'] }
  ]
};

/** Grid presets: the view and camera group appended to their sections */
export const GRID_PRESETS = ['grid', 'grid-diagonal', 'grid-hexagonal'];

/**
 * `camera_tilt` -> `Camera tilt` (sentence case)
 * @param {string} key
 */
const labelFor = (key) => {
  const words = key.replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/**
 * The first sentence of a schema description, for the field helper.
 * @param {string | undefined} text
 */
const firstSentence = (text) => (text ? text.split(/(?<=\.)\s/)[0] : undefined);

/**
 * One editor field from a schema property.
 * @param {string} key
 * @param {any} prop - schema property
 * @returns {EditorField}
 */
export function schemaField(key, prop) {
  const base = { key, label: labelFor(key), default: prop.default, helper: firstSentence(prop.description) };
  if (prop['x-ui-hints']?.widget === 'lcards-color-picker') return { ...base, type: 'color' };
  if (prop.type === 'boolean') return { ...base, type: 'boolean' };
  if (Array.isArray(prop.enum)) return { ...base, type: 'select', options: prop.enum };
  const hint = prop['x-ui-hints']?.selector?.number ?? {};
  const integer = prop.type === 'integer';
  return {
    ...base,
    type: 'number',
    min: hint.min ?? prop.minimum ?? 0,
    max: hint.max ?? prop.maximum ?? 100,
    step: hint.step ?? (integer ? 1 : 0.1)
  };
}

/**
 * Editor fields for `keys` of `preset`, in that order (keys the schema does
 * not declare are skipped).
 * @param {string} preset
 * @param {string[]} keys
 * @returns {EditorField[]}
 */
export function schemaFields(preset, keys) {
  const props = /** @type {any} */ (BACKGROUND_ANIMATION_PARAMS_SCHEMAS)[preset]?.properties ?? {};
  return keys.filter((key) => props[key]).map((key) => schemaField(key, props[key]));
}

/**
 * View-dependent defaults of the grid view group (the schema leaves them
 * unset because they follow `view`).
 * @param {EditorField} field
 * @param {Record<string, any>} config
 * @returns {EditorField}
 */
export function withViewDefault(field, config) {
  const floor = config.view === 'floor';
  if (field.key === 'camera_tilt') return { ...field, default: floor ? 10 : 90 };
  if (field.key === 'scan_period') return { ...field, default: floor ? 7 : 0 };
  return field;
}
