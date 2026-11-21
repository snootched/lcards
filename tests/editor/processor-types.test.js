/**
 * Processor types for the data source editor (src/editor/components/datasources/processor-types.js).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PROCESSOR_TYPES, UNIT_GROUPS, unitTargets, renameProcessor, uniqueProcessorKey, processorDocsUrl } from '../../src/editor/components/datasources/processor-types.js';
import { runProcessorPreview } from '../../src/core/data-sources/processor-preview.js';
import { ConvertUnitProcessor } from '../../src/core/data-sources/processors/ConvertUnitProcessor.js';

const pts = Array.from({ length: 30 }, (_, i) => ({ t: i * 60_000, v: 20 + Math.sin(i / 3) * 5 }));

test('every processor type is listed once', () => {
    assert.deepEqual(PROCESSOR_TYPES.map(t => t.type).sort(),
        ['clamp', 'convert_unit', 'delta', 'duration', 'expression', 'rate', 'round', 'scale', 'smooth', 'statistics', 'threshold', 'trend']);
});

for (const t of PROCESSOR_TYPES) {
    test(`a new ${t.type} processor runs cleanly with its defaults`, () => {
        const r = runProcessorPreview({ processing: { p: { type: t.type, ...t.defaults } } }, pts);
        assert.deepEqual(r.errors, []);
        assert.notEqual(r.latest[0].value, '-');
    });
}

test('every listed unit converts to something, and unitTargets only offers working pairs', () => {
    const lonely = UNIT_GROUPS.flatMap(g => g.units.map(([u]) => u)).filter(u => unitTargets(u).length === 0);
    assert.deepEqual(lonely, []);
    assert.ok(unitTargets('c').includes('f') && unitTargets('c').includes('k'));
    for (const to of unitTargets('w')) new ConvertUnitProcessor({ key: 'x', type: 'convert_unit', from: 'w', to });
    assert.ok(!unitTargets('c').includes('kw'));
});

test('rename keeps order and updates input_source and sources', () => {
    const p = { a: { type: 'round' }, b: { type: 'smooth', input_source: 'a' }, c: { type: 'expression', sources: ['a', 'b'], expression: 'v' } };
    const r = renameProcessor(p, 'a', 'base');
    assert.deepEqual(Object.keys(r), ['base', 'b', 'c']);
    assert.equal(r.b.input_source, 'base');
    assert.deepEqual(r.c.sources, ['base', 'b']);
    assert.equal(renameProcessor(p, 'a', 'b'), p); // taken: unchanged
    assert.equal(renameProcessor(p, 'zz', 'y'), p);
});

test('unique keys and docs links', () => {
    assert.equal(uniqueProcessorKey({}, 'smooth'), 'smooth');
    assert.equal(uniqueProcessorKey({ smooth: {}, smooth_2: {} }, 'smooth'), 'smooth_3');
    assert.equal(uniqueProcessorKey({}, 'Convert Unit'), 'convert_unit');
    assert.match(processorDocsUrl('convert_unit'), /processor-reference\.html#convert-unit$/);
});
