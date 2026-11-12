/**
 * Docs card demos (doc/.vitepress/theme/card-demo-runtime.js): the height a demo
 * gets, and the caption hint saying what a reader can do with it.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sizeMount, mountWidth, demoHint, lightReads } from '../../doc/.vitepress/theme/card-demo-runtime.js';

const card = (rows) => ({ getGridOptions: () => ({ rows }) });

test('explicit grid_options.rows wins', () => {
    assert.equal(sizeMount({ type: 'custom:lcards-slider', component: 'picard', grid_options: { rows: 3 } }, card(1)), '184px');
});

test('button components take the rows they report (dpad 5, alert 4), as in Home Assistant', () => {
    assert.equal(sizeMount({ type: 'custom:lcards-button', component: 'dpad' }, card(5)), '312px');
    assert.equal(sizeMount({ type: 'custom:lcards-button', component: 'alert' }, card(4)), '248px');
    // the docs no longer add rows of their own: a component reporting 1 gets 1
    assert.equal(sizeMount({ type: 'custom:lcards-button', component: 'dpad' }, card(1)), '56px');
});

test('sliders take the rows they report (Picard 7, upright 4), as in Home Assistant', () => {
    assert.equal(sizeMount({ type: 'custom:lcards-slider', preset: 'picard-gauge-vertical' }, card(7)), '440px');
    assert.equal(sizeMount({ type: 'custom:lcards-slider', preset: 'shaped-vertical' }, card(4)), '248px');
    assert.equal(sizeMount({ type: 'custom:lcards-slider', preset: 'shaped-horizontal' }, card(1)), '56px');
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

test('a light gets brightness and colour controls only when the example reads them', () => {
    // switched only (the LCARS patterns): the on/off toggle alone
    assert.deepEqual(lightReads('entity: light.demo\npreset: toggle-tab\nstyle:\n  card:\n    color:\n      active: theme:colors.ui.primary'),
        { brightness: false, colour: false });
    // a slider drives brightness; ranges on brightness_pct read it
    assert.equal(lightReads('type: custom:lcards-slider\nentity: light.bedroom').brightness, true);
    assert.equal(lightReads('entity: light.tv\nranges_attribute: brightness_pct').brightness, true);
    // the light's own colour
    assert.equal(lightReads('color: match-light').colour, true);
    assert.equal(lightReads("content: '{{ state_attr(\"light.tv\", \"rgb_color\") }}'").colour, true);
    assert.equal(lightReads('entity: light.tv\nranges_attribute: brightness_pct').colour, false);
});

