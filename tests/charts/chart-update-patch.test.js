// An updateOptions() patch never carries undefined keys: ApexCharts merges
// `plotOptions: undefined` over its own plotOptions, and every later update of
// that chart threw "Cannot read properties of undefined (reading 'radar')". A
// line chart has no plotOptions of ours, so its first resize (entering edit mode)
// broke it (found by tests/ha/issues.spec.js on the dev Home Assistant).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { definedOptions } from '../../src/cards/lcards-chart.js';

test('definedOptions drops undefined keys and keeps the rest', () => {
    const grid = { show: false };
    assert.deepEqual(definedOptions({ chart: { width: 10 }, plotOptions: undefined, grid, legend: null, x: 0 }),
        { chart: { width: 10 }, grid, legend: null, x: 0 });
});

test('every updateOptions() patch in the chart card goes through definedOptions', () => {
    const source = readFileSync(new URL('../../src/cards/lcards-chart.js', import.meta.url), 'utf8');
    const raw = [...source.matchAll(/\.updateOptions\(\s*\{/g)].map((m) => source.slice(0, m.index).split('\n').length);
    assert.deepEqual(raw, [], `updateOptions({ ... }) without definedOptions at lines ${raw.join(', ')}`);
});
