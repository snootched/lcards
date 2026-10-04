/**
 * lcards-layout-view visibility-driven row sizing (resolveVisibilityRowTracks).
 *
 * Since HA 2026.10 the view no longer parses Visibility conditions — it reads
 * hui-card's own `hidden` verdict (any condition type, lovelace `entity` or core
 * `entity_id` shape). These tests pin the open/collapse rule applied to that
 * verdict.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveVisibilityRowTracks } from '../../src/views/layout-grid-utils.js';

const BASE = ['80px', '80px', '80px', '1fr', '60px'];

test('shown card keeps its row at targetHeight', () => {
    const rows = resolveVisibilityRowTracks(BASE, [{ rowIndex: 0, hidden: false, targetHeight: '10vh' }], false);
    assert.deepEqual(rows, ['10vh', '80px', '80px', '1fr', '60px']);
});

test('hidden card collapses its row to 0px', () => {
    const rows = resolveVisibilityRowTracks(BASE, [{ rowIndex: 1, hidden: true, targetHeight: '80px' }], false);
    assert.equal(rows[1], '0px');
});

test('rows without entries keep their base track', () => {
    const rows = resolveVisibilityRowTracks(BASE, [{ rowIndex: 1, hidden: true, targetHeight: '80px' }], false);
    assert.deepEqual([rows[0], rows[2], rows[3], rows[4]], ['80px', '80px', '1fr', '60px']);
});

test('shared row stays open while ANY conditioned card is shown (order-independent)', () => {
    const a = { rowIndex: 2, hidden: true, targetHeight: '80px' };
    const b = { rowIndex: 2, hidden: false, targetHeight: '80px' };
    assert.equal(resolveVisibilityRowTracks(BASE, [a, b], false)[2], '80px');
    assert.equal(resolveVisibilityRowTracks(BASE, [b, a], false)[2], '80px');
});

test('shared row collapses only when ALL conditioned cards are hidden', () => {
    const rows = resolveVisibilityRowTracks(BASE, [
        { rowIndex: 2, hidden: true, targetHeight: '80px' },
        { rowIndex: 2, hidden: true, targetHeight: '80px' },
    ], false);
    assert.equal(rows[2], '0px');
});

test('edit mode expands every visibility-controlled row', () => {
    const rows = resolveVisibilityRowTracks(BASE, [
        { rowIndex: 0, hidden: true, targetHeight: '80px' },
        { rowIndex: 1, hidden: true, targetHeight: '5vh' },
    ], true);
    assert.deepEqual(rows.slice(0, 2), ['80px', '5vh']);
});

test('independent rows resolve independently', () => {
    const rows = resolveVisibilityRowTracks(BASE, [
        { rowIndex: 0, hidden: false, targetHeight: '80px' },
        { rowIndex: 1, hidden: true, targetHeight: '80px' },
    ], false);
    assert.deepEqual(rows.slice(0, 2), ['80px', '0px']);
});

test('baseRows is not mutated', () => {
    const base = [...BASE];
    resolveVisibilityRowTracks(base, [{ rowIndex: 0, hidden: true, targetHeight: '80px' }], false);
    assert.deepEqual(base, BASE);
});
