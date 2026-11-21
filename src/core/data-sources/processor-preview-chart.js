/**
 * @fileoverview ApexCharts options for a processor preview (runProcessorPreview
 * series): the raw values dashed and muted, each processor's output in colour,
 * a second y axis for series on a different scale, and the selected processor
 * drawn heavier. Used by the editor's processor preview and the docs processor lab.
 *
 * @module core/data-sources/processor-preview-chart
 */

/** Series colours when the caller has none (LCARS palette). */
export const PREVIEW_COLORS = ['#ff9966', '#99ccff', '#ffcc66', '#cc99ff', '#66cc99', '#ff6666', '#9999ff', '#ffaacc'];

/** Compact axis labels: whole numbers from 100, one decimal from 1, else two significant digits. */
export function formatAxisValue(v) {
  if (!Number.isFinite(v)) return '';
  const a = Math.abs(v);
  return a >= 100 ? v.toFixed(0) : a >= 1 ? v.toFixed(1) : a === 0 ? '0' : v.toPrecision(2);
}

/** The processor key a series belongs to ("stats.min" and "warm (min)" belong to stats and warm). */
export function seriesProcessorKey(name) {
  return String(name).replace(/ \(min\)$/, '').replace(/\.[a-z_]+$/, '');
}

/**
 * @param {Array<{name: string, points: Array<{t: number, v: number}>, axis: number, raw?: boolean}>} series
 * @param {Object} [options]
 * @param {string[]} [options.colors] - Processor series colours
 * @param {string} [options.rawColor] - Raw series colour
 * @param {string} [options.textColor] - Axis and legend text
 * @param {string} [options.gridColor]
 * @param {string|null} [options.selected] - Processor key to emphasise
 * @param {number} [options.height]
 * @param {'dark'|'light'} [options.mode] - Tooltip and theme mode
 * @returns {Object} ApexCharts options
 */
export function processorPreviewChartOptions(series, {
  colors = PREVIEW_COLORS,
  rawColor = '#8a8a99',
  textColor = '#cfcfd8',
  gridColor = '#333',
  selected = null,
  height = 260,
  mode = 'dark',
} = {}) {
  const list = series.length ? series : [{ name: 'raw', points: [], axis: 0, raw: true }];
  const named = list.map((s, i) => ({ ...s, color: s.raw ? rawColor : colors[(i - 1) % colors.length] }));
  const second = named.find(s => s.axis === 1)?.name;
  const isSelected = (s) => !s.raw && selected && seriesProcessorKey(s.name) === selected;
  const width = (s) => (s.raw ? 1.5 : isSelected(s) ? 3.5 : selected ? 1.5 : 2.5);
  return {
    chart: {
      type: 'line', height, background: 'transparent', foreColor: textColor,
      animations: { enabled: false }, toolbar: { show: false }, zoom: { enabled: false },
    },
    theme: { mode },
    series: named.map(s => ({ name: s.name, data: s.points.map(p => [p.t, p.v]) })),
    colors: named.map(s => s.color),
    stroke: { width: named.map(width), curve: 'straight', dashArray: named.map(s => (s.raw ? 3 : 0)) },
    xaxis: { type: 'datetime', labels: { datetimeUTC: false } },
    yaxis: named.map((s, i) => ({
      seriesName: s.axis === 1 ? second : 'raw',
      opposite: s.axis === 1,
      show: i === 0 || s.name === second,
      labels: { formatter: formatAxisValue },
    })),
    legend: { show: true, position: 'top', horizontalAlign: 'left' },
    grid: { borderColor: gridColor },
    tooltip: { theme: mode, x: { format: 'HH:mm' } },
  };
}
