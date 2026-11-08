/**
 * Select menu card fixes from the D2 docs audit (2026-11-07): the pure parts. The
 * rendering side of each is in tests/browser/select-menu-fixes.spec.js.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getSelectMenuSchema } from '../../src/cards/schemas/select-menu-schema.js';
import {
    columnCount, explicitRows, gridGaps, gridLayout, mergeStyleLayers, naturalHeightPx,
    optionCardKeys, optionOpacity, rowCount, splitTracks,
} from '../../src/cards/select-menu-config.js';

test('column count: repeat(N, ...) and grid-template-columns count (fit split repeat(3, 1fr) into 2)', () => {
    assert.equal(columnCount({ columns: 3 }), 3);
    assert.equal(columnCount({ columns: 'repeat(3, 1fr)' }), 3);
    assert.equal(columnCount({ columns: '100px 1fr 2fr' }), 3);
    assert.equal(columnCount({ columns: 'minmax(80px, 1fr) 2fr' }), 2);
    assert.equal(columnCount({ columns: 'repeat(2, 1fr 2fr)' }), 4);
    assert.equal(columnCount({ columns: 1, 'grid-template-columns': 'repeat(4, 1fr)' }), 4);
    assert.equal(columnCount({}), 1);
    assert.deepEqual(splitTracks('repeat(2, minmax(40px, 1fr)) 30px'), ['minmax(40px, 1fr)', 'minmax(40px, 1fr)', '30px']);
});

test('grid.rows: a number repeats the row height, a string is grid-template-rows; rows count both', () => {
    assert.deepEqual(explicitRows({ rows: 3, 'grid-auto-rows': '40px' }), { template: 'repeat(3, 40px)', tracks: ['40px', '40px', '40px'] });
    assert.deepEqual(explicitRows({ rows: '30px 50px' }).tracks, ['30px', '50px']);
    assert.equal(explicitRows({}).template, null);
    // row flow: the explicit rows, or more when the options need them
    assert.equal(rowCount({ columns: 2, rows: 3 }, 4), 3);
    assert.equal(rowCount({ columns: 2, rows: 1 }, 4), 2);
    assert.equal(rowCount({ columns: 2 }, 5), 3);
    // column flow: options add columns, so the rows are the explicit ones (one without)
    assert.equal(rowCount({ rows: 2, 'grid-auto-flow': 'column' }, 6), 2);
    assert.equal(rowCount({ 'grid-auto-flow': 'column' }, 6), 1);
});

test('natural height: rows x row height + gaps, explicit pixel tracks counted as given', () => {
    assert.equal(naturalHeightPx({}, 4), 4 * 56 + 3 * 4);
    assert.equal(naturalHeightPx({ columns: 'repeat(4, 1fr)', 'grid-auto-rows': '40px' }, 4), 40);
    assert.equal(naturalHeightPx({ columns: 2, rows: 3, 'grid-auto-rows': '40px' }, 4), 3 * 40 + 2 * 4);
    assert.equal(naturalHeightPx({ columns: 1, rows: '30px 50px', 'grid-auto-rows': 'minmax(20px, 40px)', gap: '0px' }, 4), 30 + 50 + 40 + 40);
});

test('gaps: row_gap and column_gap are aliases of row-gap and column-gap (the dashed key wins)', () => {
    assert.deepEqual(gridGaps({ gap: '2px', row_gap: '6px', column_gap: '8px' }), { rowGap: '6px', columnGap: '8px' });
    assert.deepEqual(gridGaps({ row_gap: '6px', 'row-gap': '10px' }), { rowGap: '10px', columnGap: '4px' });
});

test('grid CSS: rows, justify-items and align-items reach the grid; fit counts columns; 100% shares rows', () => {
    const { style } = gridLayout({ columns: 2, rows: 3, 'grid-auto-rows': '40px', 'justify-items': 'center', 'align-items': 'start' }, 4);
    assert.match(style, /grid-template-rows: repeat\(3, 40px\)/);
    assert.match(style, /justify-items: center/);
    assert.match(style, /align-items: start/);
    assert.doesNotMatch(gridLayout({ columns: 2 }, 4).style, /grid-template-rows|justify-items|align-items/);
    // fit: repeat(4, 1fr) is 4 columns, one 40px row
    assert.equal(gridLayout({ columns: 'repeat(4, 1fr)', 'grid-auto-rows': '40px', height: 'fit' }, 4).hostHeight, 40);
    assert.equal(gridLayout({ 'grid-template-columns': 'repeat(2, 1fr)', 'grid-auto-rows': '40px', height: 'fit' }, 4).hostHeight, 84);
    // 100%: 4 options in 2 columns are 2 rows of a 300px container: (300 - 4) / 2 = 148, capped at 120
    assert.match(gridLayout({ columns: 2, 'grid-auto-rows': 'minmax(40px, 120px)', height: '100%' }, 4, 300).style, /grid-auto-rows: 120px/);
    assert.match(gridLayout({ columns: 2, 'grid-auto-rows': 'minmax(40px, 200px)', height: '100%' }, 4, 300).style, /grid-auto-rows: 148px/);
    // explicit rows take the shared height too
    assert.match(gridLayout({ columns: 2, rows: 3, 'grid-auto-rows': 'minmax(40px, 200px)', height: '100%' }, 4, 300).style, /grid-template-rows: repeat\(3, 97px\)/);
});

test('style layers merge key by key (a later group no longer replaces the whole earlier one)', () => {
    const merged = mergeStyleLayers([
        { card: { color: { background: { inactive: 'blue' } } }, border: { width: 1 } },
        { card: { color: { background: { active: 'orange' } } } },
        { border: { width: { left: 4 } } },
        undefined,
    ]);
    assert.deepEqual(merged?.card, { color: { background: { inactive: 'blue', active: 'orange' } } });
    // a per-side border keeps the lower layer's single width on the other sides
    assert.deepEqual(merged?.border.width, { top: 1, right: 1, bottom: 1, left: 4 });
    assert.equal(mergeStyleLayers([undefined, {}, null]), undefined);
    // rule patches (last) win
    assert.equal(mergeStyleLayers([{ card: { color: { background: 'a' } } }, { card: { color: { background: 'red' } } }])?.card.color.background, 'red');
});

test('opacity: every option but the selected one; unset is 1 (what the card always drew)', () => {
    assert.equal(optionOpacity({ opacity: 0.5 }, true), 0.5);
    assert.equal(optionOpacity({ opacity: 0.5 }, false), 1);
    assert.equal(optionOpacity({}, true), 1);
    assert.equal(optionOpacity(undefined, true), 1);
    assert.equal(optionOpacity({ opacity: 3 }, true), 1);
});

test('an option\'s card-level keys over the template\'s', () => {
    const out = optionCardKeys(
        { variables: { a: 1, b: 2 }, rules: [{ id: 't' }], zones: { z: { x: 0 } } },
        { variables: { b: 3 }, rules: [{ id: 'o' }], debug_zones: true },
    );
    assert.deepEqual(out, { variables: { a: 1, b: 3 }, rules: [{ id: 't' }, { id: 'o' }], debug_zones: true });
    assert.deepEqual(optionCardKeys({ variables: { a: 1 } }, {}), {});
});

test('schema: row_gap and column_gap are declared aliases; opacity says default 1', () => {
    const grid = getSelectMenuSchema().properties.grid.properties;
    assert.equal(grid.row_gap.type, 'string');
    assert.equal(grid.column_gap.type, 'string');
    assert.match(grid.row_gap.description, /Alias of row-gap/);
    assert.match(getSelectMenuSchema().properties.style.properties.opacity.description, /Default 1/);
});
