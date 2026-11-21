/**
 * Data grid studio: a decorative grid's row styles (rows: [{ style }], 98a554c2)
 * survive opening and saving. Before 2026-11-20 the studio opened any grid with
 * rows in data mode, dropped style-only rows and deleted `rows` on a decorative
 * save. The card and the studio now share one mode test (dataGridMode).
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

let Studio, compact, dataGridMode, restore;

before(async () => {
    const env = installJsdom();
    restore = env.restore;
    for (const key of ['Document', 'ShadowRoot', 'Element', 'Node', 'CSSStyleSheet', 'MutationObserver', 'DocumentFragment', 'Event', 'CustomEvent']) {
        if (globalThis[key] === undefined && env.dom.window[key] !== undefined) globalThis[key] = env.dom.window[key];
    }
    const mod = await import('../../src/editor/dialogs/lcards-data-grid-studio-dialog.js');
    Studio = mod.LCARdSDataGridStudioDialogV4;
    compact = mod.compactDataGridConfig;
    ({ dataGridMode } = await import('../../src/data-grid/data-grid-model.js'));
});
after(() => restore?.());

const normalize = (cfg) => Studio.prototype._normalize.call({ _sampleRows: () => [{ values: [{ value: 'x' }] }] }, cfg, { sample: false });

const blue = { background: 'var(--lcars-blue)' };
const orange = { background: 'var(--lcars-orange)' };
const decorative = { type: 'custom:lcards-data-grid', rows: [{ style: blue }, { style: orange }] };

test('style-only rows open as decorative, the same as the card decides', () => {
    assert.equal(dataGridMode(decorative), 'decorative');
    assert.equal(normalize(decorative).data_mode, 'decorative');
    assert.equal(dataGridMode({ rows: [['a', 'b']] }), 'data');
    assert.equal(dataGridMode({ rows: [{ values: ['a'] }] }), 'data');
});

test('open and save keeps the row styles, without data_mode tricks', () => {
    const saved = compact(normalize(decorative));
    assert.deepEqual(saved.rows, [{ style: blue }, { style: orange }]);
    assert.equal(dataGridMode(saved), 'decorative');
});

test('an unstyled row between styled ones keeps its place; trailing empty rows go', () => {
    const saved = compact(normalize({ ...decorative, rows: [{ style: blue }, {}, { style: orange }, {}] }));
    assert.deepEqual(saved.rows, [{ style: blue }, {}, { style: orange }]);
    assert.equal(compact(normalize({ type: 'custom:lcards-data-grid', rows: [{}, {}] })).rows, undefined);
});

test('switching modes carries the row styles across', () => {
    const fake = { _workingConfig: normalize(decorative), _sampleRows: () => [{ values: [{ value: 'a' }] }, { values: [{ value: 'b' }] }], _closeEditors() {}, _changed() {} };
    Studio.prototype._setMode.call(fake, 'data');
    assert.deepEqual(fake._workingConfig.rows.map(r => r.style), [blue, orange]);
    assert.ok(fake._workingConfig.rows.every(r => r.values.length));
    Studio.prototype._setMode.call(fake, 'decorative');
    assert.deepEqual(compact(fake._workingConfig).rows, [{ style: blue }, { style: orange }]);
});
