/**
 * The LCARdS docs site: its address for this build's channel, docsUrl() for an
 * absolute link, and DOCS, the named links the UI uses outside the card editors
 * (studios, panels, the card picker). Small and pure, so the main bundle can use it;
 * the card editors' option and tab maps are in editor/utils/yaml-docs-links.js.
 * tests/docs/docs-links.test.js checks every link against the built site.
 *
 * @module utils/docs-url
 */

export const DOCS_SITE = 'https://lcards.unimatrix01.ca';

/**
 * The docs channel for this build: a -dev build links to the dev docs (/dev),
 * a stable build to the stable docs at the root (channels: doc/.vitepress/theme/docs-versions.js).
 * @param {string} [version] - LCARdS version (default: this build's)
 */
export function docsBase(version = typeof __LCARDS_VERSION__ !== 'undefined' ? __LCARDS_VERSION__ : '') {
  return /-dev\b/.test(String(version)) ? `${DOCS_SITE}/dev` : DOCS_SITE;
}

/**
 * Absolute URL on the published docs site, in this build's channel (pages are
 * .html files there).
 * @param {string} link - site-relative link, e.g. '/cards/button/#presets'
 * @param {string} [version] - LCARdS version (default: this build's)
 */
export function docsUrl(link, version) {
  return docsBase(version) + link.replace(/^([^#]*[^/#])(#|$)/, '$1.html$2');
}

/** Named docs links for the UI outside the card editors. */
export const DOCS = Object.freeze({
  home: '/',
  gettingHelp: '/getting-started/getting-help',
  credits: '/credits',
  layoutView: '/cards/layout-view/',
  sizingInLayoutCard: '/cards/common#sizing-inside-custom-layout-card',
  templates: '/core/templates/',
  rules: '/core/rules/',
  themes: '/core/themes/',
  datasources: '/core/datasources/',
  processors: '/core/datasources/processor-reference',
  animationPresets: '/core/animations/preset-reference',
  backgroundPresets: '/core/effects/background-animations/preset-reference',
  filterTypes: '/cards/msd/base-svg-filters',
  msd: '/cards/msd/',
  msdRouting: '/cards/msd/routing',
  msdRoutingConcepts: '/cards/msd/routing-concepts',
  soundAutoplay: '/configuration/sounds#browser-audio-policy',
  buildingAnEditor: '/development/building-an-editor',
  // Card picker (lcards-main.js): one page per card.
  button: '/cards/button/',
  elbow: '/cards/elbow/',
  chart: '/cards/chart/',
  slider: '/cards/slider-card/',
  dataGrid: '/cards/data-grid/',
  selectMenu: '/cards/select-menu/',
  alertOverlay: '/cards/alert-overlay/',
  layoutCard: '/cards/layout-card/',
});

/** Docs page per LCARdS config panel tab, by tab index (lcards-config-panel.js). */
export const PANEL_TAB_DOCS = Object.freeze([
  '/configuration/#welcome',
  '/configuration/persistent-helpers',
  '/configuration/#theme-studio',
  '/configuration/connectivity',
  '/configuration/sounds',
  '/configuration/users-devices',
  '/configuration/#pack-explorer',
  '/configuration/#storage-advanced',
]);
