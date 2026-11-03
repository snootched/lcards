/**
 * Every link from LCARdS to its docs site: pages for card options (the "Options
 * here" panel in the card editor's YAML tab and the docs playgrounds), a page per
 * editor tab, plus the named links and docsUrl() from utils/docs-url.js. Pure.
 *
 * Paths are site-relative docs links (as written in the docs). tests/docs/docs-links.test.js
 * checks every one against the built site (listDocsLinks()).
 *
 * @module editor/utils/yaml-docs-links
 */

import { DOCS, PANEL_TAB_DOCS } from '../../utils/docs-url.js';
import { PROCESSOR_TYPES } from '../../cards/schemas/common-schemas.js';

export { DOCS_SITE, docsBase, docsUrl, DOCS, PANEL_TAB_DOCS } from '../../utils/docs-url.js';

/** The Astrometrics Studio's info guides (editor/dialogs/astro-studio/studio-guides.js) */
export const ASTRO_STUDIO_DOCS = Object.freeze({
  card: '/cards/astrometrics/',
  studio: '/cards/astrometrics/studio',
  camera: '/cards/astrometrics/#camera-and-views',
  scale: '/cards/astrometrics/scale',
  systems: '/cards/astrometrics/scale#star-systems',
  objectTypes: '/cards/astrometrics/objects#which-type-for-what',
  distance: '/cards/astrometrics/objects#distance',
  points: '/cards/astrometrics/points',
  placement: '/cards/astrometrics/points#placement-forms',
  labels: '/cards/astrometrics/points#labels',
  starters: '/cards/astrometrics/starters'
});

const SIZING = '/cards/common#sizing-height-width-min-height-min-width-max-height-max-width';

// A data source's processing pipeline: processor names are free-form map keys, so
// any path through `processing` links to the processor reference (cards' data_sources,
// the docs processor lab).
const PROCESSORS = DOCS.processors;

/** Detailed maps: dotted key path (list indices dropped) to docs link. */
const DETAILED = {
  // The docs processor lab edits one data source entry.
  'processor-lab': {
    '': '/core/datasources/#top-level-fields',
    processing: PROCESSORS
  },
  chart: {
    '': '/cards/chart/#card-options',
    chart_type: '/cards/chart/#chart-types',
    sources: '/cards/chart/series#series-options',
    'sources.group_by': '/cards/chart/series#grouping',
    'sources.statistics': '/cards/chart/series#long-term-statistics',
    graph_span: '/cards/chart/series#time-window',
    span: '/cards/chart/series#time-window',
    yaxis: '/cards/chart/series#y-axes',
    data_sources: '/core/datasources/',
    style: '/cards/chart/styling',
    'style.thresholds': '/cards/chart/styling#reference-lines',
    'style.colors': '/cards/chart/styling#colours',
    'style.stroke': '/cards/chart/styling#style-stroke',
    'style.fill': '/cards/chart/styling#style-fill',
    'style.markers': '/cards/chart/styling#style-markers',
    'style.grid': '/cards/chart/styling#style-grid',
    'style.legend': '/cards/chart/styling#style-legend',
    'style.data_labels': '/cards/chart/styling#style-data-labels',
    'style.xaxis': '/cards/chart/styling#style-xaxis-and-style-yaxis',
    'style.yaxis': '/cards/chart/styling#style-xaxis-and-style-yaxis',
    'style.display': '/cards/chart/styling#style-display',
    'style.typography': '/cards/chart/styling#style-typography',
    'style.theme': '/cards/chart/styling#style-theme',
    'style.formatters': '/cards/chart/styling#formatters',
    'style.animation': '/cards/chart/styling#animation',
    'style.chart_options': '/cards/chart/styling#raw-apexcharts-options',
    animations: '/core/animations',
    height: SIZING
  },
  'data-grid': {
    '': '/cards/data-grid/#configuration-at-a-glance',
    data_mode: '/cards/data-grid/#which-mode-should-i-use',
    format: '/cards/data-grid/#decorative-mode',
    refresh_interval: '/cards/data-grid/#decorative-mode',
    refresh_cells: '/cards/data-grid/#decorative-mode',
    rows: '/cards/data-grid/data#what-a-cell-can-be',
    'rows.header': '/cards/data-grid/data#header-rows',
    'rows.values': '/cards/data-grid/data#showing-an-attribute',
    'rows.style': '/cards/data-grid/styling#style-layers',
    'rows.values.style': '/cards/data-grid/data#conditional-colours',
    'rows.values.tap_action': '/cards/data-grid/data#tap-actions',
    cell_tap_action: '/cards/data-grid/data#tap-actions',
    data_sources: '/cards/data-grid/data#data-sources',
    grid: '/cards/data-grid/styling#grid-layout',
    style: '/cards/data-grid/styling#style-keys',
    'style.color': '/cards/data-grid/data#conditional-colours',
    'style.background': '/cards/data-grid/data#conditional-colours',
    header_style: '/cards/data-grid/styling#header-rows',
    columns: '/cards/data-grid/styling#style-layers',
    animations: '/cards/data-grid/styling#the-cascade',
    highlight_changes: '/cards/data-grid/styling#highlighting-changes',
    filters: '/cards/data-grid/styling#filters',
    height: SIZING
  },
  button: {
    '': '/cards/button/#card-options',
    preset: '/cards/button/#presets',
    component: '/cards/button/#component-mode-d-pad',
    control: '/cards/button/#control',
    style: '/cards/button/#style-object',
    'style.card': '/cards/button/#style-card',
    'style.border': '/cards/button/#style-border',
    'style.cursor': '/cards/button/#style-cursor',
    icon_style: '/cards/button/#icon-style-object',
    divider: '/cards/button/#divider-object',
    text: '/core/text-fields',
    svg: '/cards/button/#svg-object',
    shape_texture: '/cards/button/#shape-texture',
    ranges: '/cards/button/#ranges-list-state-driven-preset-switching',
    alert: '/cards/button/#alert-object',
    background_animation: '/core/effects/background-animations',
    tap_action: '/core/actions',
    hold_action: '/core/actions',
    double_tap_action: '/core/actions',
    state_attribute: '/core/colours#exact-match-keys-from-an-attribute-state-attribute',
    ranges_attribute: '/core/colours#range-conditions-on-non-numeric-entities-ranges-attribute',
    state_classification: '/core/colours#custom-state-classification-state-classification'
  },
  slider: {
    '': '/cards/slider-card/#card-options',
    preset: '/cards/slider-card/#presets',
    control: '/cards/slider-card/#control-options',
    style: '/cards/slider-card/#style-object',
    'style.track': '/cards/slider-card/#style-track',
    'style.gauge': '/cards/slider-card/#style-gauge',
    'style.ranges': '/cards/slider-card/#ranges',
    'style.border': '/cards/slider-card/#style-border',
    value_tween: '/cards/slider-card/#value-tween',
    text: '/cards/slider-card/#text-labels',
    tap_action: '/core/actions',
    state_attribute: '/core/colours#exact-match-keys-from-an-attribute-state-attribute',
    ranges_attribute: '/core/colours#range-conditions-on-non-numeric-entities-ranges-attribute'
  },
  elbow: {
    '': '/cards/elbow/#card-options',
    elbow: '/cards/elbow/#elbow-types',
    'elbow.style': '/cards/elbow/#elbow-styles',
    'elbow.segment': '/cards/elbow/#segment-options-simple-style',
    'elbow.segments': '/cards/elbow/#segments-options-segmented-style',
    text: '/cards/elbow/#text-labels',
    shape_texture: '/cards/elbow/#shape-texture',
    symbiont: '/cards/elbow/#symbiont',
    background_animation: '/cards/elbow/#background-animation-inset',
    tap_action: '/core/actions',
    state_attribute: '/core/colours#exact-match-keys-from-an-attribute-state-attribute',
    ranges_attribute: '/core/colours#range-conditions-on-non-numeric-entities-ranges-attribute'
  },
  'select-menu': {
    '': '/cards/select-menu/#card-options',
    grid: '/cards/select-menu/#grid-object',
    options: '/cards/select-menu/#options',
    style: '/cards/select-menu/#style-object',
    button_template: '/cards/select-menu/#button-template',
    tap_action: '/cards/select-menu/#actions',
    rules: '/cards/select-menu/#rules-engine'
  },
  datasource: {
    '': '/core/datasources/'
  },
  astrometrics: {
    '': '/cards/astrometrics/#options',
    camera: '/cards/astrometrics/#camera-and-views',
    backdrop: '/cards/astrometrics/#backdrop',
    background_animation: '/cards/astrometrics/#backdrop',
    labels: '/cards/astrometrics/#labels',
    clock: '/cards/astrometrics/scale#the-scene-clock',
    units: '/cards/astrometrics/scale#units',
    'labels.default': '/cards/astrometrics/points#styles-and-defaults',
    'labels.styles': '/cards/astrometrics/points#styles-and-defaults',
    rules: '/cards/astrometrics/data#rules',
    points: '/cards/astrometrics/points',
    'points.label': '/cards/astrometrics/points#labels',
    'points.text': '/cards/astrometrics/points#labels',
    'points.style': '/cards/astrometrics/points#styles-and-defaults',
    'points.priority': '/cards/astrometrics/points#priority-and-placement',
    'points.marker': '/cards/astrometrics/points#markers',
    'points.color': '/cards/astrometrics/points#markers',
    'points.entity': '/cards/astrometrics/data#a-point-s-entity',
    'points.tags': '/cards/astrometrics/data#rules',
    'points.latlon': '/cards/astrometrics/data#positions-from-entities',
    'points.altaz': '/cards/astrometrics/data#positions-from-entities',
    'points.body': '/cards/astrometrics/scale#the-real-solar-system',
    'points.center': '/cards/astrometrics/scale#the-real-solar-system',
    'points.max_distance': '/cards/astrometrics/points#visibility',
    'points.min_distance': '/cards/astrometrics/points#visibility',
    'points.fade': '/cards/astrometrics/points#visibility',
    'points.below_horizon': '/cards/astrometrics/points#visibility',
    'points.tap_action': '/cards/astrometrics/points#actions',
    'points.hold_action': '/cards/astrometrics/points#actions',
    objects: '/cards/astrometrics/objects',
    'objects.axis_labels': '/cards/astrometrics/objects#sector-maps',
    'objects.cells': '/cards/astrometrics/objects#sector-maps',
    'objects.body': '/cards/astrometrics/scale#the-real-solar-system',
    'objects.orbit': '/cards/astrometrics/scale#the-real-solar-system',
    'objects.tap_action': '/cards/astrometrics/points#actions',
    'objects.hold_action': '/cards/astrometrics/points#actions'
  }
};

/** Docs page for cards without a detailed map. */
const CARD_PAGES = {
  button: '/cards/button/',
  elbow: '/cards/elbow/',
  slider: '/cards/slider-card/',
  msd: '/cards/msd/',
  'select-menu': '/cards/select-menu/',
  'alert-overlay': '/cards/alert-overlay/',
  'layout-card': '/cards/layout-card/',
  astrometrics: '/cards/astrometrics/'
};

/** Options shared by every card. */
const COMMON = {
  animations: '/core/animations',
  rules: '/core/rules/',
  data_sources: '/core/datasources/',
  sounds: '/core/sounds',
  filters: '/core/effects/filters',
  height: SIZING,
  width: SIZING,
  grid_options: '/cards/common#home-assistant-grid-sizing-grid-options'
};

/**
 * Normalise a card type: 'custom:lcards-data-grid', 'lcards-data-grid' and
 * 'data-grid' all give 'data-grid'.
 * @param {string} cardType
 */
export function normalizeCardType(cardType = '') {
  return String(cardType).replace(/^custom:/, '').replace(/^lcards-/, '');
}

/**
 * Docs link for an option path: the longest matching key prefix for the card.
 * Inside a processor (`processing.<name>`), with the config: that processor
 * type's section of the processor reference.
 * @param {string} cardType
 * @param {Array<string|number>} path
 * @param {*} [config] - parsed config, for a processor's `type`
 * @returns {string|undefined} site-relative link
 */
export function docsFor(cardType, path, config) {
  const type = normalizeCardType(cardType);
  const map = DETAILED[type] || {};
  const keys = path.filter(seg => typeof seg === 'string');
  const at = path.lastIndexOf('processing');
  if (at >= 0 && at < path.length - 1) return processorDocs(path.slice(0, at + 2), config);
  if (keys[keys.length - 1] === 'processing' && keys.length > 1) return PROCESSORS;
  for (let n = keys.length; n >= 1; n--) {
    const prefix = keys.slice(0, n).join('.');
    if (map[prefix]) return map[prefix];
    if (n === 1 && COMMON[prefix]) return COMMON[prefix];
  }
  return map[''] || CARD_PAGES[type];
}

/**
 * The processor reference, at the section of the processor at `entryPath`
 * when its `type` is one (headings: `convert_unit` is #convert-unit).
 * @param {Array<string|number>} entryPath - path to the `processing.<name>` entry
 * @param {*} [config]
 * @returns {string}
 */
function processorDocs(entryPath, config) {
  let node = config;
  for (const seg of entryPath) node = node && typeof node === 'object' ? node[seg] : undefined;
  const t = node && typeof node === 'object' ? node.type : undefined;
  return typeof t === 'string' && PROCESSOR_TYPES.includes(t) ? `${PROCESSORS}#${t.replace(/_/g, '-')}` : PROCESSORS;
}

// ── Editor tabs ────────────────────────────────────────────────────────────────
/** Docs page per card editor tab: card type (editor cardType) -> tab label -> link. */
const EDITOR_TABS = {
  button: {
    Config: '/cards/button/#card-options',
    'Card & Border': '/cards/button/#style-card',
    Icon: '/cards/button/#icon-style-object',
    Segments: '/cards/button/#component-mode-d-pad',
  },
  elbow: {
    Config: '/cards/elbow/#card-options',
    'Elbow Design': '/cards/elbow/#elbow-types',
    Symbiont: '/cards/elbow/#symbiont',
  },
  slider: {
    Config: '/cards/slider-card/#card-options',
    'Component Options': '/cards/slider-card/#presets',
    'Slider Track': '/cards/slider-card/#style-track',
    Borders: '/cards/slider-card/#style-border',
  },
  'select-menu': {
    Config: '/cards/select-menu/#card-options',
    Grid: '/cards/select-menu/#grid-object',
    Style: '/cards/select-menu/#style-object',
    Options: '/cards/select-menu/#options',
    Actions: '/cards/select-menu/#actions',
  },
  'alert-overlay': {
    Config: '/cards/alert-overlay/#card-options',
    Backdrop: '/cards/alert-overlay/#layers',
    Conditions: '/cards/alert-overlay/#conditions',
  },
  chart: { Configuration: '/cards/chart/' },
  'data-grid': { Configuration: '/cards/data-grid/' },
  msd: { Configuration: '/cards/msd/' },
  'layout-card': { Configuration: '/cards/layout-card/' },
  astrometrics: { Configuration: '/cards/astrometrics/', Points: '/cards/astrometrics/points' },
};

/** Tabs most card editors share. */
const EDITOR_TABS_COMMON = {
  Zones: '/core/text-fields#zones',
  Text: '/core/text-fields',
  'Text Fields': '/core/text-fields',
  Actions: '/core/actions',
  Effects: '/core/animations',
  Sound: '/core/sounds',
  '🖖 Main Engineering': '/cards/main-engineering',
  YAML: '/getting-started/config-checker',
};

/**
 * Docs link for a card editor tab.
 * @param {string} cardType - the editor's cardType ('button', 'msd', ...)
 * @param {string} label - the tab's label
 * @returns {string|undefined} site-relative link
 */
export function editorTabDocs(cardType, label) {
  return EDITOR_TABS[normalizeCardType(cardType)]?.[label] ?? EDITOR_TABS_COMMON[label];
}

/** Every site-relative link the maps above can return (tests check each one exists). */
export function listDocsLinks() {
  return [...new Set([
    ...Object.values(DETAILED).flatMap(map => Object.values(map)),
    ...Object.values(CARD_PAGES),
    ...Object.values(COMMON),
    ...Object.values(EDITOR_TABS).flatMap(map => Object.values(map)),
    ...Object.values(EDITOR_TABS_COMMON),
    ...Object.values(DOCS),
    ...PANEL_TAB_DOCS,
    ...Object.values(ASTRO_STUDIO_DOCS),
    PROCESSORS,
    ...PROCESSOR_TYPES.map(t => processorDocs(['p'], { p: { type: t } })),
  ])];
}
