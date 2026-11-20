/**
 * Editor controls added in the 2026-11-20 audit (group B, button and elbow):
 * the text field's Fit control writes `fit: true` or an object of limits, and
 * folds back to `true` when every limit is cleared; the elbow editor treats the
 * bar types (bar-slant-*, bar-parallelogram) as a slant, not an L.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

let TextField, Elbow, restore;

before(async () => {
    const env = installJsdom();
    restore = env.restore;
    for (const key of ['Document', 'ShadowRoot', 'Element', 'Node', 'CSSStyleSheet', 'MutationObserver', 'DocumentFragment', 'Event', 'CustomEvent']) {
        if (globalThis[key] === undefined && env.dom.window[key] !== undefined) globalThis[key] = env.dom.window[key];
    }
    ({ LCARdSTextFieldEditor: TextField } = await import('../../src/editor/components/editors/lcards-text-field-editor.js'));
    ({ LCARdSElbowEditor: Elbow } = await import('../../src/editor/cards/lcards-elbow-editor.js'));
});
after(() => restore?.());

function textField(fit) {
    const writes = [];
    const el = Object.create(TextField.prototype);
    const editor = { _getConfigValue: () => fit, _setConfigValue: (p, v) => writes.push([p, v]) };
    for (const [k, v] of Object.entries({ editor, basePath: 'text.label', omit: [] })) Object.defineProperty(el, k, { value: v, writable: true });
    return { el, writes };
}

test('fit: a limit turns true into an object; clearing the last limit folds back to true', () => {
    let { el, writes } = textField(true);
    el._setFitOption('max_lines', 1);
    assert.deepEqual(writes.at(-1), ['text.label.fit', { max_lines: 1 }]);
    ({ el, writes } = textField({ max_lines: 1 }));
    el._setFitOption('max_lines', '');
    assert.deepEqual(writes.at(-1), ['text.label.fit', true]);
    ({ el, writes } = textField({ max_lines: 1 }));
    el._setFitOption('overflow', 'clip');
    assert.deepEqual(writes.at(-1), ['text.label.fit', { max_lines: 1, overflow: 'clip' }]);
});

test('elbow editor: the bar types are bars, the L types are not', () => {
    const is = (type) => {
        const el = Object.create(Elbow.prototype);
        Object.defineProperty(el, 'config', { value: { elbow: { type } } });
        return el._isBarType();
    };
    assert.deepEqual(['bar-slant-right', 'bar-slant-left', 'bar-parallelogram'].map(is), [true, true, true]);
    assert.deepEqual(['header-left', 'diagonal-cap-left', 'frame'].map(is), [false, false, false]);
});
