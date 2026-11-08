/**
 * The card-level keys every card takes (rules, sounds, variables, zones,
 * debug_zones) belong on the data grid itself: they were spread into the cell
 * style schema, so `variables` on the card was an unknown key and `style.rules`
 * was accepted.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dataGridSchema, dataGridCellStyleSchema } from '../../src/cards/schemas/data-grid-schema.js';

test('rules, sounds, variables and zones are card keys, not cell style keys', () => {
    for (const key of ['rules', 'sounds', 'variables', 'zones', 'debug_zones']) {
        assert.ok(dataGridSchema.properties[key], `card: ${key}`);
        assert.equal(dataGridCellStyleSchema.properties[key], undefined, `cell style: ${key}`);
    }
});

test('the schema takes what the card applies: any CSS key in a style, every grid key, state_classification', async () => {
    const { GRID_KEYS } = await import('../../src/data-grid/data-grid-model.js');
    const grid = dataGridSchema.properties.grid.properties;
    assert.ok(GRID_KEYS.length > 10);
    assert.deepEqual(GRID_KEYS.filter((key) => !grid[key]), []);
    assert.ok(dataGridCellStyleSchema.additionalProperties, 'style: any CSS property');
    assert.ok(dataGridSchema.properties.state_classification);
});
