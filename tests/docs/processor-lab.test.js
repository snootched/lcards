/**
 * Every processor lab (```yaml lab) on the processor reference page runs cleanly
 * with the real processors (doc/.vitepress/theme/processor-lab-core.js): no errors
 * or schema warnings, a value for each processor, and a chart series for each one
 * with a numeric output.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';
import { runLab, labEntry } from '../../doc/.vitepress/theme/processor-lab-core.js';
import { CoreValidationService } from '../../src/core/validation-service/index.js';
import { dataSourcesSchema } from '../../src/cards/schemas/common-schemas.js';

const PAGE = 'doc/core/datasources/processor-reference.md';
const LABS = [...readFileSync(PAGE, 'utf8').matchAll(/^```ya?ml lab\n([\s\S]*?)^```/gm)].map(m => m[1]);
const NOW = Date.UTC(2026, 9, 10, 12);
const opts = () => ({ now: NOW, validator: new CoreValidationService({ cacheResults: false }), schema: dataSourcesSchema.additionalProperties });

test('the reference page has a lab per processor type, plus chaining', () => {
    const types = new Set(LABS.flatMap(text => Object.values(labEntry(yaml.load(text)).entry.processing).map(p => p.type)));
    for (const type of ['convert_unit', 'scale', 'smooth', 'expression', 'statistics', 'rate', 'trend', 'duration', 'threshold', 'clamp', 'round', 'delta']) {
        assert.ok(types.has(type), `no lab uses ${type}`);
    }
    assert.ok(LABS.some(text => /^data_sources:/m.test(text)), 'chaining lab');
});

for (const [i, text] of LABS.entries()) {
    const keys = Object.keys(labEntry(yaml.load(text)).entry.processing);
    test(`lab ${i + 1} (${keys.join(', ')}) runs cleanly`, () => {
        const r = runLab(yaml.load(text), opts());
        assert.deepEqual(r.messages, []);
        assert.deepEqual([...r.order].sort(), [...keys].sort());
        assert.ok(r.series[0].raw && r.series[0].points.length > 200, 'raw sample history');
        for (const row of r.latest) {
            assert.notEqual(row.value, '-', `${row.key} has a value`);
            const charted = r.series.some(s => s.name === row.key || s.name.startsWith(`${row.key}.`) || s.name.startsWith(`${row.key} (`));
            if (row.type !== 'trend') assert.ok(charted, `${row.key} is charted`);
        }
    });
}

test('lab input problems come back as messages', () => {
    const msgs = (config) => runLab(config, opts()).messages.map(m => `${m.level}: ${m.text}`).join(' | ');
    assert.match(msgs(null), /^error: Write a data source/);
    assert.match(msgs({ processing: { a: { type: 'round' } } }), /info: No entity: running on sensor\.demo_temperature/);
    assert.match(msgs({ entity: 'sensor.demo_power', processing: { a: { type: 'nope' } } }), /error: Unknown processor type: nope/);
    assert.match(msgs({ entity: 'sensor.demo_power', processing: { a: { type: 'smooth', from: 'b' } } }), /Use input_source/);
    // A bad processor setting is the processor's own error (the validator doesn't check
    // map values such as processing.<name> yet: see the handoff backlog).
    assert.match(msgs({ entity: 'sensor.demo_power', processing: { a: { type: 'scale', input_range: [0, 1], output_range: [0, 1], curve: 'wiggly' } } }), /error: Unknown curve type: wiggly/);
    // Schema warnings for the data source's own keys
    assert.match(msgs({ entity: 'sensor.demo_power', update_interval: 'fast', processing: {} }), /warning: .*update_interval/);
});

test('rate of an energy meter per hour lands on the second axis (kW vs kWh)', () => {
    const r = runLab({ entity: 'sensor.demo_energy', processing: { kw: { type: 'rate', unit: 'per_hour' } } }, opts());
    assert.equal(r.series.find(s => s.name === 'kw').axis, 1);
});

// "Use it in a chart": the chart config each lab offers is a valid lcards-chart
// config whose series all point at buffers of its data source.
import { labChartConfig, labChartYaml } from '../../doc/.vitepress/theme/processor-lab-core.js';
import { getChartSchema } from '../../src/cards/schemas/chart-schema.js';

for (const [i, text] of LABS.entries()) {
    test(`lab ${i + 1}: its chart config is a valid lcards-chart config`, () => {
        const config = yaml.load(text);
        const r = runLab(config, opts());
        const { chart, helpers } = labChartConfig(config, r);
        const v = new CoreValidationService({ cacheResults: false }).validate(chart, getChartSchema());
        assert.deepEqual([...v.errors, ...v.warnings].map(e => `${e.field}: ${e.message}`), []);
        const [name, ds] = Object.entries(chart.data_sources)[0];
        assert.equal(chart.sources.length, r.series.length);
        for (const s of chart.sources) {
            assert.equal(s.datasource, name);
            if (s.buffer) assert.ok(ds.processing[s.buffer], `buffer ${s.buffer} exists`);
        }
        // Helpers make object outputs plottable; the chart's own processing still runs cleanly.
        for (const h of helpers) assert.equal(ds.processing[h].type, 'expression');
        const rerun = runLab({ data_sources: { [name]: ds } }, opts());
        assert.deepEqual(rerun.messages, []);
        for (const s of chart.sources.filter(x => x.buffer)) {
            assert.ok(rerun.series.some(x => x.name === s.buffer), `${s.buffer} produces numbers`);
        }
        assert.match(labChartYaml(config, r), /^(# Added for the chart.*\n)?type: custom:lcards-chart/);
    });
}

test('no chart config while the lab has an error', () => {
    const config = { entity: 'sensor.demo_power', processing: { a: { type: 'nope' } } };
    assert.equal(labChartConfig(config, runLab(config, opts())), null);
    assert.equal(labChartYaml(config, runLab(config, opts())), '');
});
