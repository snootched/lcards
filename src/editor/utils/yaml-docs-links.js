/**
 * Docs pages for card options, used by the "Options here" panel in the card
 * editor's YAML tab and in the docs playgrounds. Pure, no imports.
 *
 * Paths are site-relative docs links (as written in the docs). Use docsUrl()
 * for an absolute link to the published site.
 *
 * @module editor/utils/yaml-docs-links
 */

export const DOCS_SITE = 'https://lcards.unimatrix01.ca';

const SIZING = '/cards/common#sizing-height-width-min_height-min_width-max_height-max_width';

/** Detailed maps: dotted key path (list indices dropped) to docs link. */
const DETAILED = {
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
  datasource: {
    '': '/core/datasources/'
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
  'layout-card': '/cards/layout-view/'
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
  grid_options: '/cards/common#ha-grid-sizing-grid_options'
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
 * @param {string} cardType
 * @param {Array<string|number>} path
 * @returns {string|undefined} site-relative link
 */
export function docsFor(cardType, path) {
  const type = normalizeCardType(cardType);
  const map = DETAILED[type] || {};
  const keys = path.filter(seg => typeof seg === 'string');
  for (let n = keys.length; n >= 1; n--) {
    const prefix = keys.slice(0, n).join('.');
    if (map[prefix]) return map[prefix];
    if (n === 1 && COMMON[prefix]) return COMMON[prefix];
  }
  return map[''] || CARD_PAGES[type];
}

/**
 * Absolute URL on the published docs site (pages are .html files there).
 * @param {string} link - site-relative link from docsFor()
 */
export function docsUrl(link) {
  return DOCS_SITE + link.replace(/^([^#]*[^/#])(#|$)/, '$1.html$2');
}
