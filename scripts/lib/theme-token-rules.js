/**
 * @fileoverview What counts as a valid `theme:<path>` reference, shared by
 * scripts/validate-css-vars.js (source code) and scripts/lib/config-validator.js
 * (user and doc YAML).
 */

/** Leaf paths of a nested token object, e.g. 'colors.ui.primary'. */
export function flattenKeys(obj, prefix = '') {
  const result = new Set();
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      for (const sub of flattenKeys(v, path)) result.add(sub);
    } else {
      result.add(path);
    }
  }
  return result;
}

/**
 * theme: path prefixes that are component-internal or user-space namespaces.
 * Paths starting with any of these strings are always allowed.
 */
export const THEME_PATH_ALLOWED_PREFIXES = [
  'components.',       // component pack internal defaults
  'colors.grid.',      // data-grid pack colour namespace
  'colors.lcars.',     // card-specific lcars colour overrides
  'palette.',          // example pack / user palette overrides
  'colors.ui.',        // UI state colour namespace (active/inactive/default/unavailable)
];

/**
 * theme: paths that are colour-function calls or documentation placeholders,
 * never actual token lookups (matched on the first segment).
 */
export const THEME_PATH_EXEMPTIONS = new Set([
  'lighten',    // theme:lighten(path, amount) colour function
  'darken',     // theme:darken(path, amount) colour function
  'alpha',      // theme:alpha(path, amount) colour function
  'mix',        // theme:mix(path1, path2, ratio)
  'base',       // theme:base(path): resolve to the pre-alert-mutation baseline value
  'token',      // theme:token.path documentation placeholder
]);

/** @returns {'exempt'|'open'|'known'|'unknown'} how a theme: path resolves */
export function classifyThemePath(path, tokenPaths) {
  if (THEME_PATH_EXEMPTIONS.has(path.split('.')[0].split('(')[0])) return 'exempt';
  if (THEME_PATH_ALLOWED_PREFIXES.some(prefix => path.startsWith(prefix))) return 'open';
  return tokenPaths.has(path) ? 'known' : 'unknown';
}
