/**
 * ApexChartsAdapter: date formatting, option fixes for ApexCharts 7.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

// CSS variables resolve to their fallback: no theme is loaded in node. These
// stubs must exist before the module loads, hence the dynamic import.
globalThis.document ??= { documentElement: {} };
globalThis.getComputedStyle ??= () => ({ getPropertyValue: () => '' });
const { ApexChartsAdapter } = await import('../../src/charts/ApexChartsAdapter.js');

const fmt = (iso, format) => ApexChartsAdapter._formatDate(new Date(iso), format, { locale: { language: 'en' } });

test('_formatDate: month/day names are not re-read as tokens', () => {
    // Each of these used to be corrupted by chained .replace() calls:
    // "May" -> "5ay", "Jan" -> "Jpmn", "March" -> "Marc3", "Aug" -> "PMug".
    assert.equal(fmt('2026-05-04T10:00:00', 'MMM DD'), 'May 04');
    assert.equal(fmt('2026-01-04T10:00:00', 'MMM DD HH:mm'), 'Jan 04 10:00');
    assert.equal(fmt('2026-03-04T15:07:09', 'MMMM D h:mm:ss a'), 'March 4 3:07:09 pm');
    assert.equal(fmt('2026-08-04T10:00:00', 'MMM A'), 'Aug AM');
    assert.equal(fmt('2026-09-29T10:00:00', 'dddd'), 'Tuesday');
});

test('_formatDate: numeric tokens and bracket literals', () => {
    assert.equal(fmt('2026-10-07T09:05:03', 'YYYY-MM-DD HH:mm:ss'), '2026-10-07 09:05:03');
    assert.equal(fmt('2026-10-07T09:05:03', 'YY M/D H:m:s'), '26 10/7 9:5:3');
    assert.equal(fmt('2026-10-07T21:05:00', '[at] hh:mm A'), 'at 09:05 PM');
    assert.equal(ApexChartsAdapter._formatDate('nope', 'HH'), 'nope');
});

const gen = (style) => ApexChartsAdapter.generateOptions(style, [400, 200], {});

test('generateOptions: no invalid grid.opacity, rhombus maps to diamond, labels stay still', () => {
    const o = gen({ chart_type: 'line', grid: { opacity: 0.2 }, markers: { shape: 'rhombus' } });
    assert.equal('opacity' in o.grid, false);
    assert.equal(o.markers.shape, 'diamond');
    assert.deepEqual(o.dataLabels.animate, { enabled: false });
});

test('generateOptions: chart_options cannot switch to an unsupported (e.g. premium) type', () => {
    const o = gen({ chart_type: 'line', chart_options: { chart: { type: 'raincloud' } } });
    assert.equal(o.chart.type, 'line');
    const ok = gen({ chart_type: 'line', chart_options: { chart: { type: 'area' } } });
    assert.equal(ok.chart.type, 'area');
});

test('generateOptions: animation preset comes from the builtin pack with 7.x easing names', () => {
    const o = gen({ chart_type: 'line', animation: { preset: 'lcars_dramatic' } });
    assert.equal(o.chart.animations.easing, 'easeOutCubic');
    assert.equal(o.chart.animations.speed, 1200);
});

test('generateOptions: threshold labels use the chart font, not hardcoded #fff/10px', () => {
    const o = gen({ chart_type: 'line', typography: { font_size: 14 }, thresholds: [{ value: 5, label: 'Hi' }] });
    const label = o.annotations.yaxis[0].label.style;
    assert.notEqual(label.color, '#fff');
    assert.equal(label.fontSize, '12px');
});

test('tooltip formatter returns inner content only', () => {
    const render = ApexChartsAdapter._createTooltipFormatter('{seriesName}: {y}', null);
    const html = render({ series: [[1.25]], seriesIndex: 0, dataPointIndex: 0, w: { globals: { seriesX: [[0]], seriesNames: ['Temp'] } } });
    assert.equal(html.includes('class="apexcharts-tooltip"'), false);
    assert.match(html, /Temp: 1\.3|Temp: 1,3/);
});

test('per-series display fields override style for that series only', () => {
    const o = ApexChartsAdapter.generateOptions(
        { chart_type: 'line', stroke: { width: 2, curve: 'smooth' } },
        [400, 200],
        { series: [{ name: 'A', color: '#ff0000', stroke_width: 4 }, { name: 'B', curve: 'stepline' }] }
    );
    assert.equal(o.colors[0], '#ff0000');
    assert.equal(o.colors.length, 2);
    assert.deepEqual(o.stroke.width, [4, 2]);
    assert.deepEqual(o.stroke.curve, ['smooth', 'stepline']);
});

test('markers (hover dot) follow per-series colours unless marker fill is styled', () => {
    const series = [{ name: 'A', color: '#00ff00' }];
    const o = ApexChartsAdapter.generateOptions({ chart_type: 'line' }, [400, 200], { series });
    assert.equal(o.markers.colors[0], '#00ff00');
    const styled = ApexChartsAdapter.generateOptions(
        { chart_type: 'line', colors: { marker: { fill: '#123456' } } }, [400, 200], { series });
    assert.equal(styled.markers.colors[0], '#123456');
});

test('yaxis[] maps series by yaxis_id (first axis by default) with units', () => {
    const o = ApexChartsAdapter.generateOptions(
        { chart_type: 'line' },
        [400, 200],
        {
            series: [
                { name: 'Temp', unit: '°C' },
                { name: 'Humidity', unit: '%', yaxis_id: 'hum' }
            ],
            yaxis: [{ id: 'temp' }, { id: 'hum', opposite: true, min: 0, max: 100, decimals: 0 }]
        }
    );
    assert.equal(o.yaxis.length, 2);
    assert.deepEqual(o.yaxis[0].seriesName, ['Temp']);
    assert.deepEqual(o.yaxis[1].seriesName, ['Humidity']);
    assert.equal(o.yaxis[1].opposite, true);
    assert.equal(o.yaxis[1].max, 100);
    assert.equal(o.yaxis[1].labels.formatter(42), '42 %');
    assert.equal(o.tooltip.y.formatter(21.456, { seriesIndex: 0 }), '21.46 °C');
});

test('legend and data label font sizes are honoured', () => {
    const o = ApexChartsAdapter.generateOptions(
        { chart_type: 'line', legend: { font_size: 18 }, data_labels: { font_size: 9 } }, [400, 200], {});
    assert.equal(o.legend.fontSize, '18px');
    assert.equal(o.dataLabels.style.fontSize, '9px');
});

test('y-axis labels default to at most 2 decimals (no long float noise)', () => {
    const o = ApexChartsAdapter.generateOptions({ chart_type: 'column' }, [400, 200], {});
    assert.equal(o.yaxis.labels.formatter(800.0000000001), '800');
    assert.equal(o.yaxis.labels.formatter(21.456), '21.46');
    const fixed = ApexChartsAdapter.generateOptions({ chart_type: 'line', yaxis: { decimals: 1 } }, [400, 200], {});
    assert.equal(fixed.yaxis.labels.formatter(3), '3.0');
});

test('rangeArea honours style fill/stroke; radialBar legend defaults on but can be turned off', () => {
    const range = ApexChartsAdapter.generateOptions({ chart_type: 'rangeArea', fill: { opacity: 0.6 } }, [400, 200], {});
    assert.equal(range.fill.opacity, 0.6);
    assert.equal(range.stroke.width, 1); // a thin visible edge, not a 4-entry array with transparent edges
    const gauge = ApexChartsAdapter.generateOptions({ chart_type: 'radialBar' }, [400, 200], {});
    assert.equal(gauge.legend.show, true);
    const off = ApexChartsAdapter.generateOptions({ chart_type: 'radialBar', legend: { show: false } }, [400, 200], {});
    assert.equal(off.legend.show, false);
});

// Chart-type defaults that ApexCharts gets wrong out of the box (2026-10-18).
const genAt = (style, size, series = []) => ApexChartsAdapter.generateOptions(style, size, { series });
const named = (...names) => names.map(name => ({ name }));

test('radar: no cartesian grid; the polygon is fitted to the card and centred', () => {
    const wide = genAt({ chart_type: 'radar' }, [900, 312], named('Toronto', 'Bathroom', 'Bedroom'));
    assert.equal(wide.grid.show, false);
    // ApexCharts alone: 312 / 2.1 minus label room, about 105px.
    assert.ok(wide.plotOptions.radar.size > 150, `size ${wide.plotOptions.radar.size}`);
    // A triangle reaches 1.5 radii down from the top: shift it down by a quarter.
    assert.equal(wide.plotOptions.radar.offsetY, Math.round(wide.plotOptions.radar.size / 4));
    // Four axes are symmetric: no shift. A narrow card is limited by its width.
    assert.equal(genAt({ chart_type: 'radar' }, [900, 312], named('a', 'b', 'c', 'd')).plotOptions.radar.offsetY, 0);
    const narrow = genAt({ chart_type: 'radar' }, [300, 420], named('Toronto', 'Bathroom', 'Bedroom'));
    assert.ok(narrow.plotOptions.radar.size < 100);
    // User chart_options still win.
    const own = genAt({ chart_type: 'radar', chart_options: { plotOptions: { radar: { size: 50 } } } }, [900, 312], named('a', 'b', 'c'));
    assert.equal(own.plotOptions.radar.size, 50);
});

test('radialBar: a half-circle gauge fills a wide card; full circles are left alone', () => {
    const half = genAt({ chart_type: 'radialBar' }, [900, 312], named('a'));
    assert.ok(half.grid.padding.bottom < -100, `padding ${half.grid.padding?.bottom}`);
    const full = genAt({ chart_type: 'radialBar', gauge_start_angle: 0, gauge_end_angle: 360 }, [900, 312], named('a'));
    assert.equal(full.grid.padding?.bottom, undefined);
});

test('pie, donut and polarArea show a legend by default (it names the slices)', () => {
    for (const chart_type of ['pie', 'donut', 'polarArea']) {
        assert.equal(gen({ chart_type }).legend.show, true, chart_type);
        assert.equal(gen({ chart_type, legend: { show: false } }).legend.show, false, chart_type);
    }
    // polarArea tick values sit on the spoke: hidden unless asked for.
    assert.equal(gen({ chart_type: 'polarArea' }).yaxis.show, false);
    assert.equal(gen({ chart_type: 'polarArea', yaxis: { labels: { show: true } } }).yaxis.show, true);
});

test('horizontal bar: time labels on the y axis, values on the x axis', () => {
    const o = ApexChartsAdapter.generateOptions({ chart_type: 'bar' }, [400, 200], { span: { start: 0, end: 86400_000 } });
    const time = new Date('2026-10-18T14:05:00').getTime();
    assert.equal(o.yaxis.labels.formatter(time), '14:05');
    assert.equal(o.xaxis.labels.formatter(1234.567), '1,234.57');
    assert.equal(ApexChartsAdapter._timeLabelFormat({ start: 0, end: 3 * 86400_000 }), 'ddd HH:mm');
    assert.equal(ApexChartsAdapter._timeLabelFormat({ start: 0, end: 30 * 86400_000 }), 'MMM D');
});

test('the chart keeps exactly the measured height (no 15px parent offset)', () => {
    assert.equal(gen({ chart_type: 'line' }).chart.parentHeightOffset, 0);
});

test('candlestick: several series take their own colours (matching the legend); one keeps red/green', () => {
    const colors = { series: ['#ff9900', '#3399ff', '#ffcc66'] };
    const many = genAt({ chart_type: 'candlestick', colors }, [400, 200], named('a', 'b', 'c'));
    assert.deepEqual(many.plotOptions.candlestick.colors.upward, many.colors.slice(0, 3));
    assert.equal(many.plotOptions.candlestick.colors.downward.length, 3);
    assert.notEqual(many.plotOptions.candlestick.colors.downward[0], many.colors[0]);
    const one = genAt({ chart_type: 'candlestick', colors }, [400, 200], named('a'));
    assert.equal(typeof one.plotOptions.candlestick.colors.upward, 'string');
    const own = genAt({ chart_type: 'candlestick', colors, chart_options: { plotOptions: { candlestick: { colors: { upward: '#00ff00', downward: '#ff0000' } } } } }, [400, 200], named('a', 'b'));
    assert.equal(own.plotOptions.candlestick.colors.upward, '#00ff00');
});
