/**
 * migrateChartConfig: legacy lcards-chart configs to canonical sources[].
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';
import { migrateChartConfig } from '../../src/charts/chart-config-migration.js';

const T = 'custom:lcards-chart';
const migrate = (config) => migrateChartConfig(config);

test('canonical config is returned unchanged (same object)', () => {
    const config = {
        type: T,
        graph_span: '24h',
        sources: [
            { entity: 'sensor.temp', name: 'Temp' },
            { datasource: 'temp_ds', buffer: 'smoothed' }
        ],
        data_sources: { temp_ds: { entity: 'sensor.temp', processing: { smoothed: { type: 'smooth' } } } }
    };
    const r = migrate(config);
    assert.equal(r.changed, false);
    assert.equal(r.config, config);
});

test('old Chart Studio output: series_N wrappers are inlined', () => {
    const r = migrate({
        type: T,
        chart_type: 'line',
        sources: ['series_1', 'series_2'],
        data_sources: {
            series_1: { entity: 'light.tv', attribute: 'state', history: { preload: true, hours: 72 }, name: 'TV', type: 'line', yaxis: 0 },
            series_2: { entity: 'sensor.temp', attribute: 'temperature', history: { preload: true, hours: 24 } }
        }
    });
    assert.equal(r.changed, true);
    assert.deepEqual(r.config, {
        type: T,
        chart_type: 'line',
        graph_span: '72h',
        sources: [
            { entity: 'light.tv', name: 'TV', type: 'line' },
            { entity: 'sensor.temp', attribute: 'temperature' }
        ]
    });
});

test('named DataSources are never inlined (other cards may reference them)', () => {
    const r = migrate({
        type: T,
        sources: ['my_temp_sensor'],
        data_sources: { my_temp_sensor: { entity: 'sensor.temperature', history: { preload: true, hours: 24 } } }
    });
    assert.deepEqual(r.config.sources, [{ datasource: 'my_temp_sensor' }]);
    assert.deepEqual(r.config.data_sources, { my_temp_sensor: { entity: 'sensor.temperature', history: { preload: true, hours: 24 } } });
});

test('series_N with processing stays a DataSource; display keys move to the series', () => {
    const r = migrate({
        type: T,
        sources: [{ datasource: 'series_1', buffer: 'transformation.smoothed' }],
        data_sources: { series_1: { entity: 'sensor.t', name: 'Smooth', processing: { smoothed: { type: 'smooth' } } } }
    });
    assert.deepEqual(r.config.sources, [{ datasource: 'series_1', buffer: 'smoothed', name: 'Smooth' }]);
    assert.deepEqual(r.config.data_sources.series_1, { entity: 'sensor.t', processing: { smoothed: { type: 'smooth' } } });
});

test('source + root attribute become one entity series', () => {
    const r = migrate({ type: T, source: 'sensor.weather', attribute: 'temperature', history_hours: 12 });
    assert.deepEqual(r.config, { type: T, graph_span: '12h', sources: [{ entity: 'sensor.weather', attribute: 'temperature' }] });
});

test('data_source alias, bare entity strings and series_names', () => {
    const r = migrate({ type: T, data_source: ['sensor.a', 'sensor.b'], series_names: ['A', 'B'] });
    assert.deepEqual(r.config.sources, [{ entity: 'sensor.a', name: 'A' }, { entity: 'sensor.b', name: 'B' }]);
    assert.equal('series_names' in r.config, false);
});

test('legacy object forms: id/name as reference, buffer+key, main buffer, yaxis', () => {
    const r = migrate({
        type: T,
        sources: [
            { id: 'ds_a', key: 'avg' },
            { name: 'ds_b' },
            { datasource: 'ds_c', buffer: 'main', name: 'C', yaxis: 1 },
            { datasource: 'ds_d', buffer: 'transformation', key: 'smooth' }
        ]
    });
    assert.deepEqual(r.config.sources, [
        { datasource: 'ds_a', buffer: 'avg' },
        { datasource: 'ds_b' },
        { datasource: 'ds_c', name: 'C' },
        { datasource: 'ds_d', buffer: 'smooth' }
    ]);
    assert.ok(r.notes.some(n => n.includes('yaxis')));
});

test('placeholders and orphaned series_N are removed; show_legend and max_points', () => {
    const r = migrate({
        type: T,
        sources: ['series_3', 'series_1_placeholder'],
        show_legend: true,
        max_points: 100,
        data_sources: {
            series_1: { entity: 'sensor.old' },
            series_3: { entity: 'sensor.new' },
            series_1_placeholder: { entity: '' }
        }
    });
    assert.deepEqual(r.config, {
        type: T,
        style: { legend: { show: true } },
        sources: [{ entity: 'sensor.new' }]
    });
});

test('a series_N shared by two series is kept as a DataSource', () => {
    const r = migrate({
        type: T,
        sources: ['series_1', { datasource: 'series_1', buffer: 'main', name: 'Again' }],
        data_sources: { series_1: { entity: 'sensor.t' } }
    });
    assert.deepEqual(r.config.sources, [{ datasource: 'series_1' }, { datasource: 'series_1', name: 'Again' }]);
});

test('entity items with attribute "state" are cleaned', () => {
    const r = migrate({ type: T, sources: [{ entity: 'light.tv', attribute: 'state' }] });
    assert.deepEqual(r.config.sources, [{ entity: 'light.tv' }]);
});

test('input is not mutated, and migrating twice equals migrating once', () => {
    const input = {
        type: T,
        source: 'sensor.x',
        sources: undefined,
        data_sources: { series_1: { entity: 'sensor.y', attribute: 'state' } }
    };
    const snapshot = JSON.stringify(input);
    const once = migrate(input);
    assert.equal(JSON.stringify(input), snapshot);
    const twice = migrate(once.config);
    assert.equal(twice.changed, false);
    assert.deepEqual(twice.config, once.config);
});

/** Every chart example in doc/ and yaml/ migrates without throwing, idempotently. */
test('smoke: chart YAML in doc/ and yaml/', () => {
    const files = [];
    const walk = (dir) => {
        for (const name of readdirSync(dir)) {
            const path = join(dir, name);
            if (name === 'node_modules' || name.startsWith('.')) continue;
            if (statSync(path).isDirectory()) walk(path);
            else if (/\.(md|ya?ml)$/.test(name)) files.push(path);
        }
    };
    for (const dir of ['doc', 'yaml']) {
        try { walk(dir); } catch { /* directory may not exist */ }
    }

    const configs = [];
    const collect = (node) => {
        if (Array.isArray(node)) node.forEach(collect);
        else if (node && typeof node === 'object') {
            if (node.type === T) configs.push(node);
            Object.values(node).forEach(collect);
        }
    };
    for (const file of files) {
        const text = readFileSync(file, 'utf-8');
        if (!text.includes(T)) continue;
        const blocks = file.endsWith('.md')
            ? [...text.matchAll(/```ya?ml[^\n]*\n([\s\S]*?)```/g)].map(m => m[1])
            : [text];
        for (const block of blocks) {
            try { collect(yaml.loadAll(block)); } catch { /* not standalone YAML */ }
        }
    }

    assert.ok(configs.length > 0, 'expected some chart examples');
    for (const config of configs) {
        const once = migrateChartConfig(config);
        assert.equal(migrateChartConfig(once.config).changed, false, JSON.stringify(config));
    }
});

test('source wins over sources, as the old card did', () => {
    const r = migrateChartConfig({ type: T, source: 'sensor.a', sources: ['sensor.b'] });
    assert.deepEqual(r.config.sources, [{ entity: 'sensor.a' }]);
});
