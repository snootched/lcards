/**
 * Visibility-driven track collapse (resolveVisibilityTracks), shared by the layout
 * view and the layout card (reports/shell-collapse-plan.md).
 *
 * The view and the card don't parse Visibility conditions: they read hui-card's own
 * `hidden` verdict. These tests pin the rule applied to that verdict: a row (column)
 * with a conditional card collapses to 0px when every card that sits in it alone is
 * hidden; a card without a condition holds its track open; a spanning card doesn't; a shown card's definite height sizes
 * its row; edit mode opens everything. Only tracks change: CSS shares the space.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveVisibilityTracks } from '../../src/views/layout-grid-utils.js';

// The `collapse` view of the real Home Assistant check (tests/ha/collapse.spec.js)
const GRID = {
    rows: ['60px', '1fr', 'auto'],
    columns: ['120px', '1fr', 'minmax(0, auto)'],
    areas: [['top', 'top', 'top'], ['nav', 'main', 'side'], ['foot', 'foot', 'foot']],
};
const resolve = (cards, edit = false) => resolveVisibilityTracks(GRID, cards, edit);
const card = (area, hidden, targetHeight = null) => ({ area, hidden, targetHeight, conditional: true });
const plain = (area) => ({ area, hidden: false, conditional: false });

test('nothing hidden: the tracks stay as configured', () => {
    assert.deepEqual(resolve([card('top', false), card('nav', false), card('side', false), card('foot', false)]),
        { rows: ['60px', '1fr', 'auto'], columns: ['120px', '1fr', 'minmax(0, auto)'] });
});

test('a hidden card collapses its row: fixed and auto alike', () => {
    assert.deepEqual(resolve([card('top', true)]).rows, ['0px', '1fr', 'auto']);
    assert.deepEqual(resolve([card('foot', true)]).rows, ['60px', '1fr', '0px']);
});

test('a hidden card collapses its column: a fixed nav column (#400) and an auto side column', () => {
    assert.deepEqual(resolve([card('nav', true)]).columns, ['0px', '1fr', 'minmax(0, auto)']);
    assert.deepEqual(resolve([card('side', true)]).columns, ['120px', '1fr', '0px']);
});

test('a card spanning several columns does not hold one open: a shown top bar and a hidden nav', () => {
    const out = resolve([card('top', false), card('nav', true), plain('main'), card('foot', false)]);
    assert.deepEqual(out.columns, ['0px', '1fr', 'minmax(0, auto)']);
    assert.deepEqual(out.rows, ['60px', '1fr', 'auto'], 'the top and foot rows stay open');
});

test('a card spanning several rows does not hold one open', () => {
    const grid = { rows: ['40px', '40px'], columns: ['100px', '1fr'], areas: [['side', 'a'], ['side', 'b']] };
    const out = resolveVisibilityTracks(grid, [card('side', false), card('a', true), plain('b')], false);
    assert.deepEqual(out.rows, ['0px', '40px'], 'row 0 collapses: only a sits in it alone');
    assert.deepEqual(out.columns, ['100px', '1fr'], 'the side column stays (side shown), column 1 too (b has no condition)');
});

test('a shared track stays open while any of its cards is shown, in any order', () => {
    const grid = { rows: ['50px'], columns: ['1fr', '1fr'], areas: [['a', 'b']] };
    for (const cards of [[card('a', true), card('b', false)], [card('b', false), card('a', true)]]) {
        assert.deepEqual(resolveVisibilityTracks(grid, cards, false).rows, ['50px']);
    }
    assert.deepEqual(resolveVisibilityTracks(grid, [card('a', true), card('b', true)], false).rows, ['0px']);
});

test("a shown card's definite height sizes its row; hidden still collapses", () => {
    assert.deepEqual(resolve([card('top', false, '10vh')]).rows, ['10vh', '1fr', 'auto']);
    assert.deepEqual(resolve([card('top', true, '10vh')]).rows, ['0px', '1fr', 'auto']);
});

test('edit mode opens every track at its configured size', () => {
    const all = [card('top', true, '10vh'), card('nav', true), card('side', true), card('foot', true)];
    assert.deepEqual(resolve(all, true), { rows: ['60px', '1fr', 'auto'], columns: ['120px', '1fr', 'minmax(0, auto)'] });
});

test('a card without a condition keeps its track open; a track with none never collapses', () => {
    // Hiding the nav must not collapse the row the main card sits in (#400)
    assert.deepEqual(resolve([card('nav', true), plain('main')]).rows, ['60px', '1fr', 'auto']);
    assert.deepEqual(resolve([plain('main'), plain('nav')]), { rows: GRID.rows, columns: GRID.columns });
});

test('cards in no known area change nothing; the input is not mutated', () => {
    const before = JSON.stringify(GRID);
    assert.deepEqual(resolve([card('nowhere', true), card('', true)]), { rows: GRID.rows, columns: GRID.columns });
    assert.equal(JSON.stringify(GRID), before);
});

test('the LCARS shell: top bar row and right sidebar column (strategy output)', () => {
    const areas = [
        Array(8).fill('header-border'),
        ['border-left', 'header-left', '.', 'header', 'header', 'header', 'header', 'sidebar-right'],
        ['sidebar-left', 'sidebar-left', '.', 'content-panel', 'content-panel', 'content-panel', '.', 'sidebar-right'],
    ];
    const grid = { rows: ['minmax(0,auto)', '45px', '1fr'], columns: ['45px', '168px', '5px', '40px', '1fr', '40px', '5px', 'minmax(0, auto)'], areas };
    const out = resolveVisibilityTracks(grid, [card('header-border', true, '10vh'), card('sidebar-right', true)], false);
    assert.deepEqual(out.rows, ['0px', '45px', '1fr']);
    assert.equal(out.columns[7], '0px');
    const shown = resolveVisibilityTracks(grid, [card('header-border', false, '10vh'), card('sidebar-right', false)], false);
    assert.deepEqual(shown.rows, ['10vh', '45px', '1fr']);
    assert.equal(shown.columns[7], 'minmax(0, auto)');
});
