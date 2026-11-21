/**
 * Playground help for the chart and data grid docs: the quick controls each
 * playground shows and how they read and write the YAML.
 *
 * Writes go through the `yaml` package's Document API, so comments and the
 * rest of the user's formatting survive. Labels, choices and ranges come from
 * the card schema where the spec doesn't give them. No Vue here, so node:test
 * can run applyControl().
 */
import { parseDocument } from 'yaml';
import { countTracks, expandTracks, joinTracks } from '../../../src/data-grid/data-grid-model.js';
import { LCARS_DEMO_VARS, SAMPLE_ENTITIES } from './chart-demo-data.js';
import { DEMO_ENTITIES } from './card-demo-starters.js';

const STRINGIFY = { flowCollectionPadding: false };

/** LCARS colour choices for colour controls. */
export const COLOR_CHOICES = Object.keys(LCARS_DEMO_VARS)
  .filter(name => !/text-(dark|light)/.test(name))
  .map(name => ({ value: `var(${name})`, label: name.replace('--lcars-', '').replace(/-/g, ' ') }));

const cascadeIndex = (cfg) => (Array.isArray(cfg?.animations) ? cfg.animations.findIndex(a => a?.preset === 'cascade-color') : -1);
const isDecorative = (cfg) => cfg?.data_mode !== 'data' && !(cfg?.data_mode === undefined && Array.isArray(cfg?.rows) && cfg.rows.length);

/**
 * Track-count control for decorative grid size: resizes the template's track
 * list, keeping its track sizes.
 */
function tracksControl(key, label, fallback) {
  return {
    label,
    kind: 'number',
    min: 1,
    max: 30,
    show: isDecorative,
    get: (cfg) => countTracks(cfg?.grid?.[key]) || (key.endsWith('rows') ? 8 : 12),
    set: (doc, n, cfg) => {
      const tracks = expandTracks(cfg?.grid?.[key] || '') || [];
      const count = Math.max(1, Math.min(30, Number(n) || 1));
      while (tracks.length < count) tracks.push(tracks[tracks.length - 1] || fallback);
      tracks.length = count;
      doc.setIn(['grid', key], joinTracks(tracks));
    }
  };
}

/**
 * @typedef {Object} QuickControl
 * @property {string} label
 * @property {'select'|'text'|'number'|'range'|'checkbox'|'entity'|'color'} kind
 * @property {Array<string|number>} [path] - config path (generic get/set)
 * @property {Array} [options] - select choices (default: schema enum)
 * @property {boolean} [optional] - select gets a "(not set)" choice that removes the key
 * @property {Array<string|number>} [clearPath] - path removed when cleared (default: path)
 * @property {number} [min] @property {number} [max] @property {number} [step]
 * @property {(cfg: Object) => boolean} [show]
 * @property {(cfg: Object) => *} [get]
 * @property {(doc: import('yaml').Document, value: *, cfg: Object) => void} [set]
 */

/** @type {Record<string, { controls: QuickControl[] }>} */
export const PLAYGROUNDS = {
  'lcards-chart': {
    controls: [
      { label: 'Chart type', kind: 'select', path: ['chart_type'], optional: true },
      { label: 'Time span', kind: 'select', path: ['graph_span'], optional: true, options: ['1h', '6h', '12h', '24h', '2d', '7d', '30d'] },
      { label: 'Series 1 entity', kind: 'entity', path: ['sources', 0, 'entity'] },
      { label: 'Series 1 name', kind: 'text', path: ['sources', 0, 'name'] },
      { label: 'Series 1 colour', kind: 'color', path: ['sources', 0, 'color'] },
      { label: 'Series 2 entity', kind: 'entity', path: ['sources', 1, 'entity'], clearPath: ['sources', 1] },
      { label: 'Legend', kind: 'checkbox', path: ['style', 'legend', 'show'] }
    ]
  },

  // Real-card playgrounds (CardDemo.vue). Select options come from each card schema.
  'lcards-button': {
    controls: [
      { label: 'Preset', kind: 'select', path: ['preset'], optional: true },
      { label: 'Entity', kind: 'entity', path: ['entity'] },
      { label: 'Label', kind: 'text', path: ['text', 'label', 'content'] },
      { label: 'Show label', kind: 'checkbox', path: ['text', 'label', 'show'] },
      { label: 'Background', kind: 'color', path: ['style', 'card', 'color', 'background', 'default'] },
      { label: 'Background when on', kind: 'color', path: ['style', 'card', 'color', 'background', 'active'] },
      { label: 'Tap action', kind: 'select', path: ['tap_action', 'action'], optional: true, options: ['toggle', 'more-info', 'navigate', 'none'] }
    ]
  },

  'lcards-slider': {
    controls: [
      { label: 'Preset', kind: 'select', path: ['preset'], optional: true },
      { label: 'Entity', kind: 'entity', path: ['entity'] },
      { label: 'Orientation', kind: 'select', path: ['style', 'track', 'orientation'], optional: true },
      { label: 'Min', kind: 'number', path: ['control', 'min'], min: -100, max: 1000, step: 1 },
      { label: 'Max', kind: 'number', path: ['control', 'max'], min: -100, max: 1000, step: 1 }
    ]
  },

  'lcards-elbow': {
    controls: [
      { label: 'Elbow type', kind: 'select', path: ['elbow', 'type'] },
      { label: 'Bar width', kind: 'number', path: ['elbow', 'segment', 'bar_width'], min: 10, max: 300, step: 5 },
      { label: 'Bar height', kind: 'number', path: ['elbow', 'segment', 'bar_height'], min: 4, max: 120, step: 2 },
      { label: 'Colour', kind: 'color', path: ['elbow', 'segment', 'color'] },
      { label: 'Label', kind: 'text', path: ['text', 'label', 'content'] }
    ]
  },

  'lcards-select-menu': {
    controls: [
      { label: 'Entity', kind: 'entity', path: ['entity'] },
      { label: 'Preset', kind: 'select', path: ['preset'], optional: true },
      { label: 'Columns', kind: 'number', path: ['grid', 'columns'], min: 1, max: 8, step: 1 },
      { label: 'Gap', kind: 'text', path: ['grid', 'gap'] }
    ]
  },

  'lcards-data-grid': {
    controls: [
      { label: 'Mode', kind: 'select', path: ['data_mode'] },
      { label: 'Format', kind: 'select', path: ['format'], show: isDecorative },
      tracksControl('grid-template-rows', 'Rows', 'auto'),
      tracksControl('grid-template-columns', 'Columns', '1fr'),
      { label: 'Refresh (ms)', kind: 'number', path: ['refresh_interval'], min: 0, max: 10000, step: 250, show: isDecorative },
      { label: 'Cells per refresh', kind: 'range', path: ['refresh_cells'], min: 0.05, max: 1, step: 0.05, show: isDecorative },
      { label: 'Font size', kind: 'text', path: ['style', 'font_size'] },
      { label: 'Text colour', kind: 'color', path: ['style', 'color'] },
      {
        label: 'Cascade',
        kind: 'checkbox',
        get: (cfg) => cascadeIndex(cfg) >= 0,
        set: (doc, on, cfg) => {
          const i = cascadeIndex(cfg);
          if (on && i < 0) {
            const list = Array.isArray(cfg?.animations) ? cfg.animations.length : 0;
            doc.setIn(['animations', list], doc.createNode({ trigger: 'on_load', preset: 'cascade-color' }));
          } else if (!on && i >= 0) {
            doc.deleteIn(['animations', i]);
            if (cfg.animations.length === 1) doc.deleteIn(['animations']);
          }
        }
      },
      {
        label: 'Cascade pattern',
        kind: 'select',
        optional: true,
        options: ['default', 'niagara', 'fast', 'custom'],
        show: (cfg) => cascadeIndex(cfg) >= 0,
        get: (cfg) => cfg.animations[cascadeIndex(cfg)]?.params?.pattern,
        set: (doc, value, cfg) => {
          const path = ['animations', cascadeIndex(cfg), 'params', 'pattern'];
          if (value === undefined) doc.deleteIn(path); else doc.setIn(path, value);
        }
      },
      {
        label: 'Highlight changes',
        kind: 'checkbox',
        get: (cfg) => !!cfg?.highlight_changes,
        set: (doc, on) => (on ? doc.setIn(['highlight_changes'], true) : doc.deleteIn(['highlight_changes']))
      }
    ]
  }
};

/** Docs links are shared with the card editor's YAML tab. */
export { docsFor } from '../../../src/editor/utils/yaml-docs-links.js';

/**
 * Current value of a control.
 * @param {QuickControl} control
 * @param {Object} cfg - parsed config
 */
export function controlValue(control, cfg) {
  if (control.get) return control.get(cfg);
  let v = cfg;
  for (const seg of control.path) v = v?.[seg];
  return v;
}

/**
 * Apply a control change to YAML text, keeping comments and formatting.
 * Empty values ('', null, undefined, false for optional checkboxes are kept)
 * remove the key (or `clearPath`).
 *
 * @param {string} text
 * @param {QuickControl} control
 * @param {*} value
 * @returns {string} new YAML text (unchanged text if it doesn't parse)
 */
export function applyControl(text, control, value) {
  const doc = parseDocument(text);
  if (doc.errors.length) return text;
  const cfg = doc.toJS() || {};
  if (control.set) {
    control.set(doc, value, cfg);
  } else if (value === '' || value === null || value === undefined) {
    doc.deleteIn(control.clearPath || control.path);
  } else {
    doc.setIn(control.path, value);
  }
  return doc.toString(STRINGIFY);
}

/** Sample entities as `{ id, name }` for pickers and completion. */
export const SAMPLE_ENTITY_OPTIONS = [...SAMPLE_ENTITIES, ...DEMO_ENTITIES].map(id => ({ id, name: id.split('.')[1].replace(/^demo_/, '').replace(/_/g, ' ') }));
