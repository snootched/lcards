/**
 * Docs card demos (doc/.vitepress/theme/card-demo-runtime.js): the height a demo
 * gets, and the caption hint saying what a reader can do with it.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sizeMount, mountWidth, demoHint } from '../../doc/.vitepress/theme/card-demo-runtime.js';

const card = (rows) => ({ getGridOptions: () => ({ rows }) });

test('explicit grid_options.rows wins', () => {
    assert.equal(sizeMount({ type: 'custom:lcards-slider', component: 'picard', grid_options: { rows: 3 } }, card(1)), '184px');
});

test('cards drawn to their cell height get rows even though they report 1 (or none)', () => {
    assert.equal(sizeMount({ type: 'custom:lcards-button', component: 'dpad' }, card(1)), '312px');
    assert.equal(sizeMount({ type: 'custom:lcards-button', component: 'alert' }, card(1)), '248px');
    assert.equal(sizeMount({ type: 'custom:lcards-slider', component: 'shaped' }, card(1)), '248px');
    assert.equal(sizeMount({ type: 'custom:lcards-slider', component: 'picard', preset: 'picard-gauge-vertical' }, card(undefined)), '440px');
    assert.equal(sizeMount({ type: 'custom:lcards-slider', preset: 'shaped-vertical' }, card(undefined)), '312px');
});

test('other cards take the rows they ask for; elbows at least 3', () => {
    assert.equal(sizeMount({ type: 'custom:lcards-button', preset: 'lozenge' }, card(1)), '56px');
    assert.equal(sizeMount({ type: 'custom:lcards-elbow' }, card(2)), '184px');
    assert.equal(sizeMount({ type: 'custom:lcards-slider', preset: 'pills-basic' }, card(1)), '56px');
});

test('hints match what the demo can do', () => {
    assert.match(demoHint({ type: 'custom:lcards-slider', entity: 'sensor.temperature' }), /Read-only/);
    assert.match(demoHint({ type: 'custom:lcards-slider', entity: 'light.bedroom' }), /Drag to set light\.bedroom/);
    assert.match(demoHint({ type: 'custom:lcards-button', entity: 'light.demo', tap_action: { action: 'toggle' } }), /toggle/);
    assert.equal(demoHint({ type: 'custom:lcards-button', preset: 'bar-label-left' }), '');
    assert.match(demoHint({ type: 'custom:lcards-select-menu', entity: 'input_select.demo_mode' }), /Tap an option/);
});

test('grid_options.columns narrows the demo like an HA section column span', () => {
    assert.equal(mountWidth({ grid_options: { columns: 6 } }), '244px');
    assert.equal(mountWidth({ grid_options: { columns: 12 } }), '');
    assert.equal(mountWidth({}), '');
});
