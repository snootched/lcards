/**
 * rangeBar timeline (E1.2): Home Assistant's state colours and active split
 * (utils/ha-state-color.js), state runs (charts/chart-state-runs.js), the
 * timeline series (charts/chart-timeline.js), history kept as text and the
 * rangeBar source checks.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
    stateActive, stateClass, stateColorProperties, createTimelineColorer, slugify,
    STATE_COLORED_DOMAIN, TIMESTAMP_STATE_DOMAINS, FIXED_DOMAIN_STATES
} from '../../src/utils/ha-state-color.js';
import { stateRuns, mergeShortRuns, stateMatches, visibleRuns } from '../../src/charts/chart-state-runs.js';
import { buildTimelineSeries, buildBandAnnotations, defaultTimelineContext, timelineColor, formatRunDuration, STATE_BAND_OPACITY } from '../../src/charts/chart-timeline.js';
import { historyStatesToPoints } from '../../src/core/data-sources/ha-history-utils.js';
import { normalizeChartSources, normalizeStateBands, arrayChartProblem } from '../../src/charts/chart-sources.js';
import { windowPoints } from '../../src/charts/chart-series-fetcher.js';

// CSS variables resolve to their fallback in node (as chart-options-builder.test.js)
globalThis.document ??= /** @type {any} */ ({ documentElement: {} });
globalThis.getComputedStyle ??= /** @type {any} */ (() => ({ getPropertyValue: () => '' }));
const { buildChartOptions } = await import('../../src/charts/chart-options-builder.js');

const climate = { entity_id: 'climate.hall', state: 'heat', attributes: {} };
const pts = (...pairs) => pairs.map(([t, v]) => ({ t, v }));

// ── Home Assistant port ──────────────────────────────────────────────────────

test('stateActive: Home Assistant\'s split, per domain', () => {
    assert.equal(stateActive(climate, 'heat'), true);
    assert.equal(stateActive(climate, 'off'), false);
    assert.equal(stateActive(climate, 'unavailable'), false);
    assert.equal(stateActive({ entity_id: 'lock.door' }, 'locked'), false);
    assert.equal(stateActive({ entity_id: 'lock.door' }, 'unlocked'), true);
    assert.equal(stateActive({ entity_id: 'alert.x' }, 'off'), true, 'an acknowledged alert is still active');
    assert.equal(stateActive({ entity_id: 'vacuum.v' }, 'docked'), false);
    assert.equal(stateActive({ entity_id: 'person.p' }, 'not_home'), false);
    assert.equal(stateActive({ entity_id: 'scene.s' }, '2026-11-13T10:00:00'), true, 'timestamp domains: active unless unavailable');
    assert.equal(stateActive({ entity_id: 'sensor.t' }, '21.5'), true);
});

test('stateClass: unknown counts as unavailable, as LCARdS state colours do', () => {
    assert.equal(stateClass(climate, 'heat'), 'active');
    assert.equal(stateClass(climate, 'off'), 'inactive');
    assert.equal(stateClass(climate, 'unknown'), 'unavailable');
    assert.equal(stateClass(null, 'on'), 'active');
});

test('stateColorProperties: device class, state, domain active/inactive, global', () => {
    assert.deepEqual(stateColorProperties(climate, 'heat_cool'), [
        '--state-climate-heat_cool-color', '--state-climate-active-color', '--state-active-color'
    ]);
    assert.deepEqual(stateColorProperties({ entity_id: 'binary_sensor.d', attributes: { device_class: 'door' } }, 'on'), [
        '--state-binary_sensor-door-on-color', '--state-binary_sensor-on-color', '--state-binary_sensor-active-color', '--state-active-color'
    ]);
    assert.deepEqual(stateColorProperties({ entity_id: 'sensor.b', attributes: { device_class: 'battery' } }, '45'), ['--state-sensor-battery-medium-color']);
    assert.equal(stateColorProperties({ entity_id: 'sensor.t', attributes: {} }, '21'), undefined, 'sensors are not state coloured');
    // A group of lights colours as lights
    assert.deepEqual(stateColorProperties({ entity_id: 'group.g', attributes: { entity_id: ['light.a', 'light.b'] } }, 'on')?.[0], '--state-light-on-color');
    assert.equal(slugify('Clear Night'), 'clear_night');
});

test('timeline colourer: Home Assistant\'s chain, palette indexes kept per state', () => {
    const vars = {
        '--history-unavailable-color': 'transparent',
        '--history-unknown-color': '#666',
        '--state-climate-heat-color': '#f90',
        '--state-active-color': '#fc0',
        '--state-inactive-color': '#444',
        '--graph-color-1': '#111', '--graph-color-2': '#222', '--graph-color-3': '#333',
        '--color-5': '#555'
    };
    let colour = createTimelineColorer((name) => vars[name] ?? '');
    assert.equal(colour('unavailable', climate), 'transparent');
    assert.equal(colour('unknown', climate), '#666');
    assert.equal(colour('heat', climate), '#f90', 'the theme\'s own state colour');
    assert.equal(colour('cool', climate), '#fc0', 'no --state-climate-cool-color: the global active colour');
    assert.equal(colour('off', climate), '#444');
    // input_select: by the option's place in the list
    const mode = { entity_id: 'input_select.mode', attributes: { options: ['alpha', 'beta', 'gamma'] } };
    assert.equal(colour('gamma', mode), '#333');
    // free text: the next graph colour per new state, stable
    const text = { entity_id: 'sensor.status', attributes: {} };
    assert.equal(colour('idle', text), '#111');
    assert.equal(colour('busy', text), '#222');
    assert.equal(colour('idle', text), '#111');
    // past the graph colours: Home Assistant's --color-N palette
    colour = createTimelineColorer((name) => vars[name] ?? '');
    for (const s of ['a', 'b', 'c', 'd']) colour(s, text);
    assert.equal(colour('e', text), '#555');
    // no entity: unavailable
    assert.equal(colour('on', null), 'transparent');
});

const frontend = fileURLToPath(new URL('../../../frontend/src/', import.meta.url));
test('parity with the frontend checkout: state-coloured domains, timestamp domains, fixed states', { skip: !existsSync(frontend) && 'no ../frontend checkout' }, () => {
    const read = (f) => readFileSync(frontend + f, 'utf8');
    const strings = (text) => [...text.matchAll(/"([a-z_-]+)"/g)].map((m) => m[1]);
    const between = (text, from, to) => text.slice(text.indexOf(from), text.indexOf(to, text.indexOf(from)));
    assert.deepEqual(new Set(strings(between(read('common/entity/state_color.ts'), 'STATE_COLORED_DOMAIN', ']);'))), STATE_COLORED_DOMAIN);
    assert.deepEqual(new Set(strings(between(read('common/const.ts'), 'TIMESTAMP_STATE_DOMAINS_LIST', '] as const'))), TIMESTAMP_STATE_DOMAINS);
    const fixed = between(read('common/entity/get_states.ts'), 'FIXED_DOMAIN_STATES', '} as const');
    for (const [domain, states] of Object.entries(FIXED_DOMAIN_STATES)) {
        const block = fixed.match(new RegExp(`\\b${domain}: \\[([^\\]]*)\\]`))?.[1];
        assert.ok(block !== undefined, `${domain} missing upstream`);
        assert.deepEqual(strings(block), states, domain);
    }
    assert.equal([...fixed.matchAll(/^ {2}([a-z_]+): \[/gm)].length, Object.keys(FIXED_DOMAIN_STATES).length, 'upstream has domains we lack');
});

// ── State runs ───────────────────────────────────────────────────────────────

test('stateRuns: consecutive states join; each run ends where the next starts', () => {
    assert.deepEqual(stateRuns(pts([0, 'off'], [10, 'heat'], [20, 'heat'], [30, 'off'], [40, 'off'])), [
        { state: 'off', start: 0, end: 10 },
        { state: 'heat', start: 10, end: 30 },
        { state: 'off', start: 30, end: 40 }
    ]);
    // a change at the very last point has no length yet
    assert.deepEqual(stateRuns(pts([0, 'off'], [10, 'heat'])), [{ state: 'off', start: 0, end: 10 }]);
    assert.deepEqual(stateRuns([]), []);
});

test('mergeShortRuns: short runs join the run before (the first joins the next), neighbours rejoin', () => {
    const runs = [
        { state: 'off', start: 0, end: 100 },
        { state: 'heat', start: 100, end: 105 },
        { state: 'off', start: 105, end: 200 },
        { state: 'heat', start: 200, end: 300 }
    ];
    assert.deepEqual(mergeShortRuns(runs, 10), [
        { state: 'off', start: 0, end: 200 },
        { state: 'heat', start: 200, end: 300 }
    ]);
    // a short first run joins the one after it
    assert.deepEqual(mergeShortRuns([{ state: 'a', start: 0, end: 2 }, { state: 'b', start: 2, end: 50 }], 10), [{ state: 'b', start: 0, end: 50 }]);
    assert.equal(mergeShortRuns(runs, 0), runs);
});

test('stateMatches / visibleRuns: exact states and class words, merge then filter', () => {
    assert.equal(stateMatches('heat', ['active'], climate), true);
    assert.equal(stateMatches('off', ['active'], climate), false);
    assert.equal(stateMatches('off', ['heat', 'inactive'], climate), true);
    assert.equal(stateMatches('unknown', ['unavailable'], climate), true);
    assert.equal(stateMatches('cool', ['heat'], climate), false);
    assert.equal(stateMatches('cool', undefined, climate), true);
    const points = pts([0, 'off'], [60_000, 'heat'], [65_000, 'off'], [120_000, 'cool'], [300_000, 'cool']);
    assert.deepEqual(visibleRuns(points, { states: ['active'], min_duration: '30s' }, climate), [{ state: 'cool', start: 120_000, end: 300_000 }]);
    assert.deepEqual(visibleRuns(points, { states: ['active'] }, climate).map((r) => r.state), ['heat', 'cool']);
});

// ── Timeline series ──────────────────────────────────────────────────────────

test('timelineColor: one colour, a state map (exact, class, default), else Home Assistant\'s', () => {
    const ctx = defaultTimelineContext({ readVar: (name) => ({ '--state-active-color': '#fc0', '--state-inactive-color': '#444' })[name] ?? '', resolve: (v) => `resolved(${v})` });
    assert.equal(timelineColor({ color: 'red' }, 'heat', climate, ctx), 'resolved(red)');
    const map = { color: { heat: 'orange', inactive: 'grey' } };
    assert.equal(timelineColor(map, 'heat', climate, ctx), 'resolved(orange)');
    assert.equal(timelineColor(map, 'off', climate, ctx), 'resolved(grey)');
    assert.equal(timelineColor(map, 'cool', climate, ctx), '#fc0', 'a state the map leaves out: the theme\'s state colour');
    assert.equal(timelineColor({ color: { default: 'blue' } }, 'cool', climate, ctx), 'resolved(blue)');
});

test('buildTimelineSeries: a row per source, a bar per run with state, label and colour', () => {
    const ctx = defaultTimelineContext({
        readVar: (name) => ({ '--state-climate-heat-color': '#f90', '--state-inactive-color': '#444' })[name] ?? '',
        stateObjFor: (id) => (id === 'climate.hall' ? climate : null),
        formatState: (_o, s) => s.toUpperCase()
    });
    const [row] = buildTimelineSeries({
        series: [{ name: 'Hall', entity: 'climate.hall' }],
        points: [pts([0, 'off'], [10, 'heat'], [20, 'heat'])],
        ctx
    });
    assert.equal(row.name, 'Hall');
    assert.deepEqual(row.data, [
        { x: 'Hall', y: [0, 10], fillColor: '#444', strokeColor: '#444', state: 'off', label: 'OFF' },
        { x: 'Hall', y: [10, 20], fillColor: '#f90', strokeColor: '#f90', state: 'heat', label: 'HEAT' }
    ]);
});

test('formatRunDuration: largest units first', () => {
    assert.equal(formatRunDuration(45_000), '45 s');
    assert.equal(formatRunDuration(125 * 60_000), '2 h 5 min');
    assert.equal(formatRunDuration(26 * 3_600_000), '1 d 2 h');
    assert.equal(formatRunDuration(0), '0 s');
});

test('buildChartOptions rangeBar: timeline series, state labels on the bars, timeline tooltip', () => {
    const options = buildChartOptions({
        config: { chart_type: 'rangeBar' },
        style: {},
        series: [{ name: 'Hall', entity: 'climate.hall' }],
        points: [pts([0, 'off'], [3_600_000, 'heat'], [7_200_000, 'heat'])],
        span: { start: 0, end: 7_200_000 },
        timeline: defaultTimelineContext({ readVar: () => '#444', stateObjFor: () => climate })
    });
    assert.equal(options.chart.type, 'rangeBar');
    assert.equal(options.series[0].data.length, 2);
    const opts = { seriesIndex: 0, dataPointIndex: 1, w: { config: { series: options.series } } };
    assert.equal(options.dataLabels.formatter(null, opts), 'heat');
    const tip = options.tooltip.custom(opts);
    assert.match(tip, /Hall/);
    assert.match(tip, /heat/);
    assert.match(tip, /1 h/);
    assert.equal(options.plotOptions.bar.dataLabels.hideOverflowingLabels, true);
});

// ── Data path ────────────────────────────────────────────────────────────────

test('history keepState: states kept as text (unavailable too), not numbers', () => {
    const rows = [{ s: 'heat', lu: 1 }, { s: 'off', lu: 2 }, { s: 'unavailable', lu: 3 }, { s: '21.5', lu: 4 }];
    assert.deepEqual(historyStatesToPoints(rows, { keepState: true }).map((p) => p.v), ['heat', 'off', 'unavailable', '21.5']);
    assert.deepEqual(historyStatesToPoints(rows).map((p) => p.v), [0, 21.5], 'numeric charts unchanged');
    // an attribute as text
    const attrRows = [{ s: 'on', a: { hvac_action: 'heating' }, lu: 1 }];
    assert.deepEqual(historyStatesToPoints(attrRows, { keepState: true, attribute: 'hvac_action' }).map((p) => p.v), ['heating']);
});

test('rangeBar sources: history kept as text; statistics, data sources and group_by explain themselves', () => {
    const [series] = normalizeChartSources({ chart_type: 'rangeBar', sources: [{ entity: 'climate.hall' }] });
    assert.equal(series.keepState, true);
    assert.equal(normalizeChartSources({ chart_type: 'line', sources: [{ entity: 'climate.hall' }] })[0].keepState, undefined);
    assert.equal(arrayChartProblem(series, 'rangeBar'), null);
    assert.match(arrayChartProblem({ kind: 'statistics' }, 'rangeBar'), /history/);
    assert.match(arrayChartProblem({ kind: 'datasource' }, 'rangeBar'), /history/);
    assert.match(arrayChartProblem({ kind: 'history', group_by: { duration: '1h' } }, 'rangeBar'), /group_by/);
    // the open run reaches now; group_by never averages text
    const points = windowPoints({ kind: 'history', keepState: true, group_by: { duration: '1h' } }, pts([0, 'off'], [500, 'heat']), { start: 100, end: 2000 }, 1000);
    assert.deepEqual(points, pts([100, 'off'], [500, 'heat'], [1000, 'heat']));
});

// ── State bands (E1.1) ───────────────────────────────────────────────────────

test('normalizeStateBands: history kept as text, active by default, only on time charts', () => {
    const config = { chart_type: 'line', state_bands: [{ entity: 'climate.hall' }, { entity: 'climate.attic', states: ['heat'] }, { states: ['on'] }] };
    const bands = normalizeStateBands(config);
    assert.equal(bands.length, 2, 'a band without an entity is dropped');
    assert.deepEqual(bands.map((b) => [b.kind, b.keepState, b.band, b.states]), [
        ['history', true, true, ['active']],
        ['history', true, true, ['heat']]
    ]);
    assert.equal(normalizeStateBands({ ...config, chart_type: 'pie' }).length, 0);
    assert.equal(normalizeStateBands({ ...config, chart_type: 'bar' }).length, 0, 'horizontal bars put time on the other axis');
    assert.equal(normalizeStateBands({ chart_type: 'line' }).length, 0);
});

test('buildBandAnnotations: active runs as x ranges in their colours; labels; transparent states skipped', () => {
    const vars = { '--state-climate-heat-color': '#f90', '--state-climate-cool-color': '#45f', '--state-inactive-color': '#444', '--history-unavailable-color': 'transparent' };
    const ctx = defaultTimelineContext({ readVar: (n) => vars[n] ?? '', stateObjFor: (id) => (id === 'climate.hall' ? climate : null), formatState: (_o, st) => st.toUpperCase() });
    const points = [pts([0, 'off'], [10, 'heat'], [20, 'cool'], [30, 'off'], [40, 'unavailable'], [50, 'unavailable'])];
    const [band] = normalizeStateBands({ state_bands: [{ entity: 'climate.hall' }] });
    const plain = buildBandAnnotations({ bands: [band], points, ctx });
    assert.deepEqual(plain.map((a) => [a.x, a.x2, a.fillColor, a.opacity]), [[10, 20, '#f90', STATE_BAND_OPACITY], [20, 30, '#45f', STATE_BAND_OPACITY]]);
    assert.equal(plain[0].label.text, '', 'no label unless asked');
    assert.equal(plain[0].borderColor, 'transparent');
    // every state, labelled, own opacity: the unavailable run is transparent and draws nothing
    const all = buildBandAnnotations({ bands: [{ ...band, states: ['active', 'inactive', 'unavailable'], label: true, opacity: 0.5 }], points, ctx });
    assert.deepEqual(all.map((a) => a.label.text), ['OFF', 'HEAT', 'COOL', 'OFF']);
    assert.equal(all[0].opacity, 0.5);
    assert.equal(all[1].label.style.background, '#f90');
    assert.equal(all[1].label.style.color, '#000000', 'dark label text, concrete');
});

test('buildChartOptions: state bands join the threshold annotations behind a line', () => {
    const options = buildChartOptions({
        config: { chart_type: 'line' },
        style: { thresholds: [{ value: 20 }] },
        series: [{ name: 'Temp' }],
        points: [pts([0, 19], [7_200_000, 21])],
        span: { start: 0, end: 7_200_000 },
        timeline: defaultTimelineContext({ readVar: (n) => (n === '--state-climate-heat-color' ? '#f90' : ''), stateObjFor: () => climate }),
        bands: normalizeStateBands({ state_bands: [{ entity: 'climate.hall' }] }),
        bandPoints: [pts([0, 'off'], [3_600_000, 'heat'], [7_200_000, 'heat'])]
    });
    assert.equal(options.annotations.yaxis.length, 1, 'the threshold stays');
    assert.deepEqual(options.annotations.xaxis.map((a) => [a.x, a.x2, a.fillColor]), [[3_600_000, 7_200_000, '#f90']]);
    assert.equal(options.series.length, 1, 'bands are not series');
});
