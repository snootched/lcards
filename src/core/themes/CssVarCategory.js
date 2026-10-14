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
