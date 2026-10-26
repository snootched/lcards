/**
 * Point labels on the LCARdS text system: which text fields a point shows
 * and how each is styled, from the same field keys the other cards take
 * (`content`, `font_size`, `font_family`, `color` state maps, `background`,
 * ...), with `position` meaning where the field sits round the point.
 *
 * Inheritance, lowest first: the built-in style (`title`, `major`, `minor`,
 * `tiny`: size, priority, colour), `labels.default`, `labels.styles[<style>]`,
 * the point's `color`, the point's `text.default`, the field. The point's
 * `label` is shorthand for `text.label.content`.
 *
 * Free of three.js and the DOM: the scene builder, the card (templates, state
 * colours) and node tests all use it.
 *
 * @module core/astrometrics/label-text
 */
import { LABEL_STYLE_NAMES } from './names.js';

/** Built-in label styles: the bottom layer of every label */
export const BUILTIN_LABEL_STYLES = /** @type {Record<string, Record<string, any>>} */ ({
  title: { font_size: 34, letter_spacing: 1, priority: 100, color: 'var(--lcards-moonlight)' },
  major: { font_size: 20, priority: 80, color: 'var(--lcards-moonlight)' },
  minor: { font_size: 13, priority: 40, color: 'theme:colors.text.onDark' },
  tiny: { font_size: 10, priority: 10, color: 'theme:colors.text.onDark' }
});

/** Under every style */
export const LABEL_BASE = /** @type {Record<string, any>} */ ({
  font_family: "var(--lcars-font, 'Antonio'), 'Antonio', sans-serif"
});

/** Colour of the selected point's label and marker, unless a colour map has a `selected` key */
export const SELECTED_COLOR = 'theme:colors.status.error';

/** The nine positions round the point: [row, column], 1-based, the point in the centre */
export const LABEL_POSITIONS = /** @type {Record<string, [number, number]>} */ ({
  'top-left': [1, 1], 'top-center': [1, 2], 'top-right': [1, 3],
  'center-left': [2, 1], center: [2, 2], 'center-right': [2, 3],
  'bottom-left': [3, 1], 'bottom-center': [3, 2], 'bottom-right': [3, 3]
});

/** The text system's position aliases */
const POSITION_ALIASES = /** @type {Record<string, string>} */ ({
  top: 'top-center', bottom: 'bottom-center', left: 'center-left', right: 'center-right',
  'left-center': 'center-left', 'right-center': 'center-right', middle: 'center'
});

/** Every position name a label field takes (for the schema) */
export const LABEL_POSITION_NAMES = [...Object.keys(LABEL_POSITIONS), ...Object.keys(POSITION_ALIASES).filter((k) => k !== 'middle')];

/**
 * Text-field keys a point label takes. The rest of the text system's keys
 * (x, y, zone, anchor, baseline, stretch, ...) place SVG text in card zones
 * and mean nothing here.
 */
export const LABEL_FIELD_KEYS = /** @type {const} */ ([
  'content', 'show', 'template', 'display_format', 'position', 'padding', 'rotation',
  'font_size', 'font_weight', 'font_family', 'text_transform', 'letter_spacing', 'color',
  'background', 'background_padding', 'background_radius', 'background_width', 'background_min_width'
]);

/** Text-system keys left out of point labels (the schema omits them) */
export const LABEL_OMITTED_KEYS = /** @type {const} */ ([
  'x', 'y', 'x_percent', 'y_percent', 'zone', 'anchor', 'baseline', 'stretch', 'font_size_percent', 'cap_height_ratio'
]);

/**
 * @typedef {Object} LabelField
 * @property {string} name
 * @property {string} content - as configured (templates not evaluated)
 * @property {boolean} template - evaluate templates in content
 * @property {string} [display_format]
 * @property {string} position - one of LABEL_POSITIONS
 * @property {any} color - plain colour or state map
 * @property {any} [background] - plain colour or state map
 * @property {Record<string, any>} style - the remaining keys (font_size, padding, ...)
 */

/**
 * @typedef {Object} LabelSpec
 * @property {string} style - the point's style name
 * @property {number} priority
 * @property {any} color - the marker's colour: the point's, else the style's (plain or state map)
 * @property {LabelField[]} fields - in order: label first, then the point's own fields
 * @property {boolean} overlap - never hidden by another label (it still moves to a free side when it can)
 */

/** @param {unknown} v */
const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);

/**
 * Merge layers of text keys, lowest first (undefined does not overwrite;
 * `padding` objects merge per side).
 * @param {...any} layers
 * @returns {Record<string, any>}
 */
function mergeLayers(...layers) {
  /** @type {Record<string, any>} */
  const out = {};
  for (const layer of layers) {
    if (!isObj(layer)) continue;
    for (const [k, v] of Object.entries(layer)) {
      if (v === undefined) continue;
      out[k] = k === 'padding' && isObj(v) && isObj(out[k]) ? { ...out[k], ...v } : v;
    }
  }
  return out;
}

/**
 * A text-system position name as one of the nine (aliases resolved), or null.
 * @param {unknown} p
 * @returns {string | null}
 */
export function normalizePosition(p) {
  if (typeof p !== 'string') return null;
  const k = POSITION_ALIASES[p] ?? p;
  return k in LABEL_POSITIONS ? k : null;
}

/**
 * The style layers for a style name: the built-in (minor for an unknown
 * name) under the user's `labels.styles[name]`.
 * @param {string} name
 * @param {any} labelsCfg - the card's `labels`
 */
function styleLayers(name, labelsCfg) {
  const builtin = BUILTIN_LABEL_STYLES[name] ?? BUILTIN_LABEL_STYLES.minor;
  const user = isObj(labelsCfg?.styles) ? labelsCfg.styles[name] : undefined;
  return [builtin, isObj(labelsCfg?.default) ? labelsCfg.default : undefined, isObj(user) ? user : undefined];
}

/**
 * The fields and look of a point's label.
 * @param {any} point - a point config (`label`, `text`, `style`, `color`, `priority`, `marker`)
 * @param {any} [labelsCfg] - the card's `labels` (`default`, `styles`)
 * @returns {LabelSpec}
 */
export function resolveLabel(point, labelsCfg) {
  const styleName = typeof point?.style === 'string' && point.style ? point.style : 'minor';
  const layers = styleLayers(styleName, labelsCfg);
  const styled = mergeLayers(LABEL_BASE, ...layers);
  const pointColor = point?.color;
  const text = isObj(point?.text) ? point.text : {};
  const hasMarker = typeof point?.marker === 'string' && point.marker !== 'none';

  /** @type {Record<string, any>} */
  const own = {};
  for (const [k, v] of Object.entries(text)) if (k !== 'default' && isObj(v)) own[k] = v;
  // label: shorthand for text.label.content (an explicit content wins)
  if (point?.label !== undefined && point.label !== null && point.label !== '') {
    own.label = { content: String(point.label), ...(own.label ?? {}) };
  }
  // label first, then the point's own fields in config order
  const names = Object.keys(own).sort((a, b) => Number(b === 'label') - Number(a === 'label'));

  /** @type {LabelField[]} */
  const fields = [];
  for (const name of names) {
    const merged = mergeLayers(styled, pointColor !== undefined ? { color: pointColor } : undefined, text.default, own[name]);
    if (merged.show === false) continue;
    const content = merged.content === undefined || merged.content === null ? '' : String(merged.content);
    if (!content) continue;
    const { content: _c, show: _s, template, display_format, position, color, background, priority: _p, overlap: _o, ...style } = merged;
    for (const k of LABEL_OMITTED_KEYS) delete style[k];
    fields.push({
      name,
      content,
      template: template !== false,
      ...(display_format !== undefined ? { display_format } : {}),
      position: normalizePosition(position) ?? (hasMarker ? 'center-right' : 'center'),
      color,
      ...(background !== undefined ? { background } : {}),
      style
    });
  }

  const priority = Number.isFinite(Number(point?.priority)) && point?.priority !== undefined && point?.priority !== null
    ? Number(point.priority)
    : Number(styled.priority ?? BUILTIN_LABEL_STYLES.minor.priority);
  // overlap: the point's, else its style's, else the card's
  const user = isObj(labelsCfg?.styles) && isObj(labelsCfg.styles[styleName]) ? labelsCfg.styles[styleName] : {};
  const overlap = (point?.overlap ?? user.overlap ?? labelsCfg?.overlap) === true;
  // The marker: the point's colour, else its style's (a field's own colour is text only)
  return { style: styleName, priority, color: pointColor ?? styled.color, fields, overlap };
}

/**
 * A colour config at its plain value: a string as is, a state map's
 * `default` (the card resolves full state maps; this is for no entity).
 * @param {any} c
 * @returns {string | undefined}
 */
export function plainColor(c) {
  if (typeof c === 'string') return c;
  if (isObj(c) && typeof c.default === 'string') return c.default;
  return undefined;
}

/**
 * The colour config for the selected state: a map's `selected` key, else SELECTED_COLOR.
 * @param {any} c
 */
export function selectedColor(c) {
  return isObj(c) && typeof c.selected === 'string' ? c.selected : SELECTED_COLOR;
}

/** @param {unknown} v @returns {string} */
const px = (v) => (typeof v === 'number' && Number.isFinite(v) ? `${v}px` : typeof v === 'string' ? v : '');

/**
 * Inline CSS for a field's fixed look (not colour or text: those change at
 * run time). Background box keys apply only with a background.
 * @param {LabelField} f
 * @returns {string}
 */
export function fieldCss(f) {
  const s = f.style;
  /** @type {string[]} */
  const out = [];
  if (s.font_size !== undefined) out.push(`font-size:${px(s.font_size)}`);
  if (s.font_weight !== undefined) out.push(`font-weight:${s.font_weight}`);
  if (s.font_family) out.push(`font-family:${s.font_family}`);
  if (s.text_transform) out.push(`text-transform:${s.text_transform}`);
  if (s.letter_spacing !== undefined && s.letter_spacing !== null) out.push(`letter-spacing:${px(s.letter_spacing)}`);
  if (s.rotation) out.push(`transform:rotate(${Number(s.rotation) || 0}deg)`);
  const pad = s.padding;
  if (typeof pad === 'number') out.push(`margin:${pad}px`);
  else if (isObj(pad)) out.push(`margin:${px(pad.top ?? 0) || 0} ${px(pad.right ?? 0) || 0} ${px(pad.bottom ?? 0) || 0} ${px(pad.left ?? 0) || 0}`);
  if (f.background !== undefined) {
    out.push(`padding:1px ${px(s.background_padding ?? 8)}`);
    out.push(`border-radius:${px(s.background_radius ?? 4)}`);
    if (s.background_width) out.push(`width:${px(s.background_width)};box-sizing:border-box`);
    else if (s.background_min_width) out.push(`min-width:${px(s.background_min_width)};box-sizing:border-box`);
  }
  return out.join(';');
}

export { LABEL_STYLE_NAMES };
