/**
 * @fileoverview Static catalog of known HA-LCARS / LCARdS / HA theme variable
 * names, for use where a live `getComputedStyle()` scan can't find them (the
 * page hasn't got HA-LCARS installed/active — exactly the situation someone
 * building a *new* theme is in) and for the Theme Generator's raw-override
 * autocomplete.
 *
 * This is a name catalog, not a value source — entries carry no default hex;
 * callers merge this with whatever a live scan resolves, and render
 * catalog-only entries as "not currently resolvable" rather than faking a
 * preview color. Compiled from `ha-lcars/src/preamble.yaml`'s `&lcars-
 * variables` anchor, `ha-lcars/src/defaults.yaml`'s semantic layer, and
 * `doc/development/ha-css-vars.md`'s HA variable reference — see that doc
 * for the authoritative description of each HA layer.
 *
 * @module core/themes/knownThemeVariables
 */

import { TONE_ORDER, SEMANTIC_ROLES, BORDER_ROLES, SEMANTIC_TIERS } from './themeGeneratorCore.js';

/** ha-lcars's raw named Star-Trek palette (`&lcars-variables` in preamble.yaml) — ~180 hand-named colors. */
export const LCARS_NAMED_PALETTE = [
  'lcars-african-violet', 'lcars-alert-blue', 'lcars-alert-red', 'lcars-alert-uv', 'lcars-alert-uvc',
  'lcars-alert-white', 'lcars-alert-yellow', 'lcars-almond', 'lcars-almond-creme', 'lcars-alt-blue',
  'lcars-alt-dark-gray', 'lcars-alt-green', 'lcars-alt-orange', 'lcars-amber', 'lcars-antique-gold',
  'lcars-apricot', 'lcars-aqua', 'lcars-beige', 'lcars-black', 'lcars-black-cherry', 'lcars-blue',
  'lcars-bluey', 'lcars-brick-red', 'lcars-butter', 'lcars-butterscotch', 'lcars-cardassia-maroon',
  'lcars-cardinal', 'lcars-cerulean', 'lcars-charcoal', 'lcars-cool', 'lcars-coral', 'lcars-cornflower',
  'lcars-crimson', 'lcars-cyan', 'lcars-dark-blue', 'lcars-dark-gray', 'lcars-darkpumpkin',
  'lcars-dark-red', 'lcars-deep-maroon', 'lcars-deep-navy', 'lcars-dunkelgrau', 'lcars-eggplant',
  'lcars-emerald', 'lcars-error', 'lcars-evening', 'lcars-feuerrot', 'lcars-galaxy', 'lcars-ghost',
  'lcars-ghost-gray', 'lcars-gold', 'lcars-graphite', 'lcars-gray', 'lcars-green', 'lcars-green-footer',
  'lcars-green-middle', 'lcars-green-primary', 'lcars-green-secondary', 'lcars-green-tertiary',
  'lcars-harvestgold', 'lcars-hellgrau', 'lcars-honey', 'lcars-ice', 'lcars-khaki', 'lcars-khaki-dark',
  'lcars-khaki-light', 'lcars-lavender', 'lcars-lavender-mist', 'lcars-lavender-rose', 'lcars-lemon',
  'lcars-light-gray', 'lcars-light-orange', 'lcars-lilac', 'lcars-lilac-light', 'lcars-lime',
  'lcars-magenta', 'lcars-mahogany', 'lcars-mango', 'lcars-maroon', 'lcars-mars', 'lcars-martian',
  'lcars-mauve', 'lcars-medium-dark-blue', 'lcars-medium-dark-gray', 'lcars-medium-gray',
  'lcars-midnight', 'lcars-midnight-blue', 'lcars-mint', 'lcars-mittelgrau', 'lcars-modern-light-gray',
  'lcars-moonbeam', 'lcars-moonshine', 'lcars-muted-coral', 'lcars-navy-gray', 'lcars-october-sunset',
  'lcars-olive', 'lcars-orange', 'lcars-orchid', 'lcars-orchid-light', 'lcars-pale-orange',
  'lcars-peach', 'lcars-peach-cream', 'lcars-peach-light', 'lcars-pearl', 'lcars-periwinkle',
  'lcars-periwinkle-light', 'lcars-plum', 'lcars-plum-medium', 'lcars-powder-blue', 'lcars-primary-gray',
  'lcars-pumpkinshade', 'lcars-red', 'lcars-roseblush', 'lcars-ruby', 'lcars-sage', 'lcars-sand',
  'lcars-scarlet', 'lcars-seafoam', 'lcars-sienna', 'lcars-silver', 'lcars-sky', 'lcars-sky-blue',
  'lcars-slate', 'lcars-slate-gray', 'lcars-space-white', 'lcars-starlight', 'lcars-steel-blue',
  'lcars-sunflower', 'lcars-tan', 'lcars-tangerine', 'lcars-taupe', 'lcars-teal', 'lcars-text-blue',
  'lcars-text-coal', 'lcars-text-dark', 'lcars-text-gray', 'lcars-text-light', 'lcars-text-mist',
  'lcars-text-purple', 'lcars-text-smoke', 'lcars-text-stone', 'lcars-tomato', 'lcars-turquoise',
  'lcars-vanilla', 'lcars-vermilion', 'lcars-violet', 'lcars-violet-creme', 'lcars-vivid-crimson',
  'lcars-warm-gold', 'lcars-wheat', 'lcars-wheat-light', 'lcars-yam', 'lcars-yellow',
];

/** LCARdS's own canon palette (paletteInjector.js `GREEN_ALERT_PALETTE`) — 5 families x 12 stops + moonlight. */
export const LCARDS_PALETTE_FAMILIES = ['orange', 'gray', 'blue', 'green', 'yellow'];
const LCARDS_ANCHOR_SUFFIXES = ['darkest', 'dark', 'medium-dark', '', 'medium', 'medium-light', 'light', 'lightest'];
const LCARDS_COMPUTED_SUFFIXES = ['10', '50', '60', '95'];
export const LCARDS_PALETTE = [
  ...LCARDS_PALETTE_FAMILIES.flatMap(family => [...LCARDS_ANCHOR_SUFFIXES, ...LCARDS_COMPUTED_SUFFIXES]
    .map(suffix => `lcards-${suffix ? `${family}-${suffix}` : family}`)),
  'lcards-moonlight',
];

/** ha-lcars's structural/layout vars, not colors — kept separate since a color picker shouldn't offer these. */
export const LCARS_STRUCTURAL_VARS = [
  'lcars-vertical-border', 'lcars-horizontal-border', 'lcars-middle-vertical-border',
  'lcars-inner-radius', 'lcars-outer-radius', 'lcars-font', 'lcars-fallback-font',
];

/** Master Situation Display accent colors (`msd-*`, ha-lcars). */
export const MSD_VARS = ['msd-bright', 'msd-dark', 'msd-medium', 'msd-normal', 'msd-ra-bright', 'msd-ra-dark', 'msd-ra-medium', 'msd-ra-normal'];

/** ha-lcars's `lcars-ui-*` + card/sidebar/header/tooltip/ripple/backlight semantic layer (`defaults.yaml`, theme-author-overridable). */
export const LCARS_SEMANTIC_VARS = [
  'lcars-background-color', 'lcars-background-text',
  'lcars-backlight-center', 'lcars-backlight-middle', 'lcars-backlight-middle-location', 'lcars-backlight-outer',
  'lcars-card-top-color', 'lcars-card-top-text', 'lcars-card-mid-color', 'lcars-card-mid-left-color', 'lcars-card-mid-text',
  'lcars-card-button-color', 'lcars-card-button', 'lcars-card-button-off', 'lcars-card-button-text', 'lcars-card-bottom-color', 'lcars-card-bottom-text',
  'lcars-ripple-color', 'lcars-ripple-hover-opacity', 'lcars-ripple-pressed-opacity',
  'lcars-settings-card-color', 'lcars-settings-card-text',
  'lcars-sidebar-background', 'lcars-sidebar-icon-background', 'lcars-sidebar-icon-color',
  'lcars-sidebar-item-color', 'lcars-sidebar-notification-color', 'lcars-sidebar-selected-color', 'lcars-sidebar-text',
  'lcars-tooltip-background', 'lcars-tooltip-text',
  'lcars-ui-accent-color', 'lcars-ui-accent-text',
  'lcars-ui-app-header-background-color', 'lcars-ui-app-header-clock', 'lcars-ui-app-header-text-color',
  'lcars-ui-config-button', 'lcars-ui-config-icon', 'lcars-ui-mix-color',
  'lcars-ui-primary', 'lcars-ui-primary-text', 'lcars-ui-secondary', 'lcars-ui-secondary-text',
  'lcars-ui-tertiary', 'lcars-ui-tertiary-text', 'lcars-ui-quaternary', 'lcars-ui-quaternary-text',
  'lcars-ui-text-heading', 'lcars-font-color',
  'lcars-alert-color', // legacy alias, still whitelisted by ha-lcars's generate_themes.py validator
];

/** HA's Layer-1 palette atoms — 5 families x 11-stop tone grid (05-95). */
export const HA_PALETTE_FAMILIES = ['primary', 'neutral', 'orange', 'red', 'green'];
export const HA_COLOR_PALETTE_VARS = HA_PALETTE_FAMILIES.flatMap(
  family => TONE_ORDER.map(tone => `ha-color-${family}-${tone}`)
);

/** HA's Layer-2 semantic tokens (on-, fill-, border-, surface-, form-background), generated (not hand-listed) to stay in sync with themeGeneratorCore's role/tier rosters. */
export const HA_SEMANTIC_TOKEN_VARS = [
  ...SEMANTIC_ROLES.flatMap(role => SEMANTIC_TIERS.map(tier => `ha-color-on-${role}-${tier}`)),
  ...SEMANTIC_ROLES.flatMap(role => SEMANTIC_TIERS.flatMap(tier =>
    (role === 'disabled' ? ['resting', 'hover'] : ['resting', 'hover', 'active']).map(state => `ha-color-fill-${role}-${tier}-${state}`)
  )),
  ...BORDER_ROLES.flatMap(role => SEMANTIC_TIERS.map(tier => `ha-color-border-${role}-${tier}`)),
  'ha-color-surface-default', 'ha-color-surface-low', 'ha-color-surface-lower',
  'ha-color-surface-default-inverted', 'ha-color-surface-low-inverted', 'ha-color-surface-lower-inverted',
  'ha-color-on-surface-default',
  'ha-color-form-background', 'ha-color-form-background-hover', 'ha-color-form-background-disabled',
];

/** HA's Layer-3 legacy semantic vars — theme-author-overridable, feed both legacy and new components. */
export const HA_LEGACY_VARS = [
  'primary-color', 'dark-primary-color', 'light-primary-color', 'accent-color',
  'primary-text-color', 'secondary-text-color', 'text-primary-color', 'disabled-text-color',
  'primary-background-color', 'secondary-background-color', 'card-background-color', 'clear-background-color',
  'divider-color',
  'error-color', 'warning-color', 'success-color', 'info-color',
  'state-active-color', 'state-inactive-color', 'state-unavailable-color', 'state-icon-color', 'state-icon-error-color',
];

/** Common domains + their well-known states, for the Domain & State Colors section — see themeGeneratorCore.js DOMAIN_STATES for the same roster used by the rule engine. */
export { DOMAIN_STATES } from './themeGeneratorCore.js';

/** All catalog entries flattened to bare var-name strings (no `--` prefix), tagged by category, for search/autocomplete UIs. */
export function getKnownVariableCatalog() {
  const categories = [
    { category: 'lcards-palette', names: LCARDS_PALETTE },
    { category: 'lcars-semantic', names: LCARS_SEMANTIC_VARS },
    { category: 'lcars-named', names: LCARS_NAMED_PALETTE },
    { category: 'lcars-structural', names: LCARS_STRUCTURAL_VARS },
    { category: 'msd', names: MSD_VARS },
    { category: 'ha-palette', names: HA_COLOR_PALETTE_VARS },
    { category: 'ha-semantic', names: HA_SEMANTIC_TOKEN_VARS },
    { category: 'ha-legacy', names: HA_LEGACY_VARS },
  ];
  return categories.flatMap(({ category, names }) => names.map(name => ({ name, category })));
}
