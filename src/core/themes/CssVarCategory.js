/**
 * @fileoverview CssVarCategory - Classifies CSS custom property names into
 * source categories (theme system, HA design tokens, material, etc.),
 * independent of value. Also provides shared color-value detection.
 *
 * Extracted from the theme browser's scanning logic so the in-editor color
 * picker can reuse the same categorization instead of re-deriving it
 * (issue #372 follow-up — opt-in broader var access in the picker).
 *
 * @module core/themes/CssVarCategory
 */

/** Category ids, in the theme browser's existing display order. */
export const CSS_VAR_CATEGORIES = [
  'ha-legacy', 'ha-color', 'ha-space', 'ha-shape', 'ha-motion', 'ha-type',
  'ha-elevation', 'ha-system', 'material', 'wa', 'states', 'card-mod',
  'lcars', 'lcards', 'app', 'other'
];

/**
 * Categorize a CSS custom property name by prefix. Order matters — more
 * specific prefixes must be checked before their broader parents
 * (e.g. --ha-color- before --ha-).
 * @param {string} propName e.g. '--lcars-tomato'
 * @returns {string} one of CSS_VAR_CATEGORIES
 */
export function getCssVarCategory(propName) {
  if (propName.startsWith('--card-mod-')) return 'card-mod';
  if (propName.startsWith('--lcars-')) return 'lcars';
  if (propName.startsWith('--lcards-')) return 'lcards';
  // Legacy card-mod LCARS theme prefix, conceptually part of the HA-LCARS family.
  if (propName.startsWith('--cblcars-')) return 'lcars';
  if (propName.startsWith('--mdc-') || propName.startsWith('--md-')) return 'material';
  if (propName.startsWith('--wa-')) return 'wa';
  if (propName.startsWith('--ha-color-')) return 'ha-color';
  if (propName.startsWith('--ha-space-')) return 'ha-space';
  if (propName.startsWith('--ha-border-radius-') || propName.startsWith('--ha-border-width-')) return 'ha-shape';
  if (propName.startsWith('--ha-animation-')) return 'ha-motion';
  if (propName.startsWith('--ha-font-') || propName.startsWith('--ha-line-height-')) return 'ha-type';
  if (propName.startsWith('--ha-box-shadow-')) return 'ha-elevation';
  if (propName.startsWith('--ha-')) return 'ha-system';
  if (propName.startsWith('--state-')) return 'states';
  if (propName.startsWith('--primary-') || propName.startsWith('--secondary-') ||
      propName.startsWith('--accent-') || propName.startsWith('--card-') ||
      propName.startsWith('--divider-') || propName.startsWith('--text-') ||
      propName.startsWith('--disabled-') || propName.startsWith('--sidebar-')) return 'ha-legacy';
  if (propName.startsWith('--app-')) return 'app';
  return 'other';
}

/** Comprehensive CSS named-color list, used by isColorValue() below. */
const CSS_COLOR_NAMES = new Set([
  'aliceblue', 'antiquewhite', 'aqua', 'aquamarine', 'azure', 'beige', 'bisque', 'black',
  'blanchedalmond', 'blue', 'blueviolet', 'brown', 'burlywood', 'cadetblue', 'chartreuse',
  'chocolate', 'coral', 'cornflowerblue', 'cornsilk', 'crimson', 'cyan', 'darkblue',
  'darkcyan', 'darkgoldenrod', 'darkgray', 'darkgrey', 'darkgreen', 'darkkhaki',
  'darkmagenta', 'darkolivegreen', 'darkorange', 'darkorchid', 'darkred', 'darksalmon',
  'darkseagreen', 'darkslateblue', 'darkslategray', 'darkslategrey', 'darkturquoise',
  'darkviolet', 'deeppink', 'deepskyblue', 'dimgray', 'dimgrey', 'dodgerblue',
  'firebrick', 'floralwhite', 'forestgreen', 'fuchsia', 'gainsboro', 'ghostwhite',
  'gold', 'goldenrod', 'gray', 'grey', 'green', 'greenyellow', 'honeydew', 'hotpink',
  'indianred', 'indigo', 'ivory', 'khaki', 'lavender', 'lavenderblush', 'lawngreen',
  'lemonchiffon', 'lightblue', 'lightcoral', 'lightcyan', 'lightgoldenrodyellow',
  'lightgray', 'lightgrey', 'lightgreen', 'lightpink', 'lightsalmon', 'lightseagreen',
  'lightskyblue', 'lightslategray', 'lightslategrey', 'lightsteelblue', 'lightyellow',
  'lime', 'limegreen', 'linen', 'magenta', 'maroon', 'mediumaquamarine', 'mediumblue',
  'mediumorchid', 'mediumpurple', 'mediumseagreen', 'mediumslateblue', 'mediumspringgreen',
  'mediumturquoise', 'mediumvioletred', 'midnightblue', 'mintcream', 'mistyrose',
  'moccasin', 'navajowhite', 'navy', 'oldlace', 'olive', 'olivedrab', 'orange',
  'orangered', 'orchid', 'palegoldenrod', 'palegreen', 'paleturquoise', 'palevioletred',
  'papayawhip', 'peachpuff', 'peru', 'pink', 'plum', 'powderblue', 'purple', 'red',
  'rosybrown', 'royalblue', 'saddlebrown', 'salmon', 'sandybrown', 'seagreen', 'seashell',
  'sienna', 'silver', 'skyblue', 'slateblue', 'slategray', 'slategrey', 'snow',
  'springgreen', 'steelblue', 'tan', 'teal', 'thistle', 'tomato', 'turquoise', 'violet',
  'wheat', 'white', 'whitesmoke', 'yellow', 'yellowgreen', 'transparent', 'currentcolor'
]);

/**
 * Check if a CSS value looks like a color (var() ref, hex, rgb/hsl,
 * modern color functions, or a CSS named color).
 * @param {string} value
 * @returns {boolean}
 */
export function isColorValue(value) {
  if (typeof value !== 'string') return false;
  if (/^var\(/.test(value)) return true;
  if (/^#[0-9A-Fa-f]{3,8}$/.test(value)) return true;
  if (/^rgba?\(/.test(value)) return true;
  if (/^hsla?\(/.test(value)) return true;
  if (/^(color-mix|color|lab|lch|oklab|oklch)\(/.test(value)) return true;
  return CSS_COLOR_NAMES.has(value.toLowerCase());
}
