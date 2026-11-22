/**
 * Chart sources from a Home Assistant target (reports/ha-labels-plan.md phase 3):
 * one series per entity of a label, area or device, kept through migration.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeChartSources } from '../../src/charts/chart-sources.js';
import { migrateChartConfig, isTargetSource } from '../../src/charts/chart-config-migration.js';

const config = {
    type: 'custom:lcards-chart',
    sources: [
        { entity: 'sensor.outside', name: 'Outside' },
        { target: { label_id: 'room_temperatures' }, name: 'ignored', color: 'red', stroke_width: 3, max_items: 5, sort: 'state' },
    ],
};

test('a target source is canonical: migration keeps it as written', () => {
    const { config: out, changed } = migrateChartConfig(config);
    assert.equal(changed, false);
    assert.equal(out, config, 'fast path, same object');
    assert.equal(isTargetSource(config.sources[1]), true);
    assert.equal(isTargetSource({ entity: 'sensor.x', target: { label_id: 'a' } }), false, 'an entity wins');
    assert.equal(isTargetSource({ target: [] }), false);
});

test('a target source expands to one series per entity, with its other keys but no name or single colour', () => {
    const seen = [];
    const series = normalizeChartSources(config, (item) => { seen.push(item); return ['sensor.kitchen', 'sensor.lounge']; });
    assert.equal(seen.length, 1);
    assert.deepEqual(seen[0].target, { label_id: 'room_temperatures' }, 'the expander gets the whole item (sort, max_items)');
    assert.deepEqual(series.map(s => s.entity), ['sensor.outside', 'sensor.kitchen', 'sensor.lounge']);
    const kitchen = series[1];
    assert.equal(kitchen.kind, 'history');
    assert.equal(kitchen.stroke_width, 3);
    assert.equal(kitchen.fromTarget, true);
    for (const k of ['name', 'color', 'target', 'sort', 'max_items']) assert.equal(k in kitchen, false, k);
});

test('statistics and state colour maps carry to every series; no expander, no series', () => {
    const cfg = {
        chart_type: 'rangeBar',
        sources: [{ target: { area_id: 'bridge' }, statistics: { type: 'max' }, color: { heat: 'red', default: 'grey' } }],
    };
    const series = normalizeChartSources(cfg, () => ['climate.a', 'climate.b']);
    assert.equal(series.length, 2);
    for (const s of series) {
        assert.equal(s.kind, 'statistics');
        assert.deepEqual(s.statistics, { type: 'max', period: 'hour' });
        assert.deepEqual(s.color, { heat: 'red', default: 'grey' });
    }
    assert.deepEqual(normalizeChartSources(cfg), []);
    assert.deepEqual(normalizeChartSources(cfg, () => []), []);
});
