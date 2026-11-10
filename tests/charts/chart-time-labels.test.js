/**
 * Chart axis labels and tooltip times follow Home Assistant's time zone and
 * 12/24 hour setting, so labels agree with the window (chart-span-locale).
 *
 * ApexCharts 7 only picks calendar ticks itself when xaxis.labels.formatter is
 * unset, and it reads them in UTC or the browser's zone. So the options builder
 * moves time-axis values to the zone's wall clock (as if it were UTC) and sets
 * datetimeUTC: ApexCharts then places and names ticks in the zone. Assertions
 * use fixed UTC instants; run under TZ=UTC and TZ=Asia/Tokyo.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

globalThis.document ??= { documentElement: {} };
globalThis.getComputedStyle ??= () => ({ getPropertyValue: () => '' });
const { buildChartOptions } = await import('../../src/charts/chart-options-builder.js');
const { toWallClock, useAmPm } = await import('../../src/charts/chart-time-labels.js');

const utc = (iso) => Date.parse(iso);
const H = 3_600_000;
const hassFor = (locale = {}, zone = 'America/New_York') => ({
    config: { time_zone: zone },
    locale: { language: 'en', time_zone: 'server', time_format: '24', first_weekday: 'monday', ...locale }
});

// 22:30 on Tuesday 3 Nov 2026 in New York (UTC-5).
const T = utc('2026-11-04T03:30:00Z');
const span = { start: utc('2026-11-03T05:00:00Z'), end: utc('2026-11-04T05:00:00Z') };
const series = [{ name: 'A' }];
const points = [[{ t: T - H, v: 1 }, { t: T, v: 2 }]];
const build = (extra = {}) => buildChartOptions({ config: { chart_type: 'line' }, style: {}, series, points, span, ...extra });

test('useAmPm: 12, 24, language', () => {
    assert.equal(useAmPm(hassFor({ time_format: '12' })), true);
    assert.equal(useAmPm(hassFor({ time_format: '24' })), false);
    assert.equal(useAmPm(hassFor({ time_format: 'language', language: 'en' })), true);
    assert.equal(useAmPm(hassFor({ time_format: 'language', language: 'de' })), false);
    assert.equal(useAmPm(undefined), false);
});

test('toWallClock: the zone wall clock as a UTC instant', () => {
    assert.equal(toWallClock(T, 'America/New_York'), utc('2026-11-03T22:30:00Z'));
    assert.equal(toWallClock(T, 'Asia/Kolkata'), utc('2026-11-04T09:00:00Z'));
    assert.equal(toWallClock(T, 'UTC'), T);
});

test('with hass: data, window and ticks are on the Home Assistant wall clock', () => {
    const opts = build({ hass: hassFor() });
    assert.equal(opts.xaxis.labels.datetimeUTC, true);
    assert.equal(opts.xaxis.min, utc('2026-11-03T00:00:00Z'));
    assert.equal(opts.xaxis.max, utc('2026-11-04T00:00:00Z'));
    assert.deepEqual(opts.series[0].data.map(p => p.x), [utc('2026-11-03T21:30:00Z'), utc('2026-11-03T22:30:00Z')]);
    assert.equal(opts.xaxis.labels.datetimeFormatter.hour, 'HH:mm');
});

test('12 hour clock: tick formats and tooltip time', () => {
    const opts = build({ hass: hassFor({ time_format: '12' }) });
    assert.equal(opts.xaxis.labels.datetimeFormatter.hour, 'h:mm TT');
    assert.equal(opts.xaxis.labels.datetimeFormatter.minute, 'h:mm TT');
    const tip = opts.tooltip.x.formatter(opts.series[0].data[1].x);
    assert.match(tip, /Nov 3/);
    assert.match(tip, /10:30\s?PM/);
    const tip24 = build({ hass: hassFor() }).tooltip.x.formatter(opts.series[0].data[1].x);
    assert.match(tip24, /22:30/);
});

test('profile set to local: the browser zone, still with the hass clock format', () => {
    const opts = build({ hass: hassFor({ time_zone: 'local' }) });
    const browser = Intl.DateTimeFormat().resolvedOptions().timeZone;
    assert.equal(opts.series[0].data[1].x, toWallClock(T, browser));
    assert.equal(opts.xaxis.labels.datetimeUTC, true);
});

test('without hass: ApexCharts defaults, values untouched (docs demos)', () => {
    const opts = build();
    assert.equal(opts.xaxis.labels.datetimeUTC, undefined);
    assert.equal(opts.xaxis.labels.datetimeFormatter, undefined);
    assert.equal(opts.tooltip.x, undefined);
    assert.equal(opts.xaxis.min, span.start);
    assert.equal(opts.series[0].data[1].x, T);
});

test('user formats still win, and read the wall clock', () => {
    const label = build({ hass: hassFor(), style: { formatters: { xaxis_label: 'HH:mm' } } });
    assert.equal(label.xaxis.labels.formatter(label.series[0].data[1].x), '22:30');
    const custom = build({ hass: hassFor(), style: { chart_options: { xaxis: { labels: { datetimeFormatter: { hour: 'HH' } } }, tooltip: { x: { format: 'HH:mm' } } } } });
    assert.equal(custom.xaxis.labels.datetimeFormatter.hour, 'HH');
    assert.equal(custom.tooltip.x.format, 'HH:mm');
    const tip = build({ hass: hassFor(), style: { formatters: { tooltip: '{x|HH:mm} {y}' } } });
    const html = tip.tooltip.custom({ series: [[1, 2]], seriesIndex: 0, dataPointIndex: 1, w: { globals: { seriesX: [tip.series[0].data.map(p => p.x)], seriesNames: ['A'] } } });
    assert.match(html, />22:30 2</);
});

test('DST fall-back: the repeated hour never runs backwards', () => {
    // 1 Nov 2026: 01:30 EDT (05:30Z) then 01:30 EST (06:30Z), then 02:30 EST.
    const dst = [[{ t: utc('2026-11-01T05:30:00Z'), v: 1 }, { t: utc('2026-11-01T06:30:00Z'), v: 2 }, { t: utc('2026-11-01T07:30:00Z'), v: 3 }]];
    const opts = buildChartOptions({ config: { chart_type: 'line' }, style: {}, series, points: dst, hass: hassFor() });
    const xs = opts.series[0].data.map(p => p.x);
    assert.ok(xs[0] <= xs[1] && xs[1] <= xs[2], `not monotonic: ${xs}`);
    assert.equal(xs[2], utc('2026-11-01T02:30:00Z'));
});

test('horizontal bars: time labels on the category axis in the zone', () => {
    const opts = buildChartOptions({ config: { chart_type: 'bar' }, style: {}, series, points, span, hass: hassFor() });
    assert.equal(opts.series[0].data[1].x, T);
    assert.equal(opts.yaxis.labels.formatter(T), '22:30');
});

test('timeAxisData: the card live-update path gets the same wall-clock values', async () => {
    const { timeAxisData } = await import('../../src/charts/chart-options-builder.js');
    const full = build({ hass: hassFor() });
    const live = timeAxisData({ config: { chart_type: 'line' }, span, points, hass: hassFor() });
    assert.deepEqual(live.axis, { min: full.xaxis.min, max: full.xaxis.max });
    assert.deepEqual(live.points[0].map(p => p.t), full.series[0].data.map(p => p.x));
    const none = timeAxisData({ config: { chart_type: 'line' }, span, points });
    assert.deepEqual(none.axis, { min: span.start, max: span.end });
    assert.equal(none.points, points);
});
