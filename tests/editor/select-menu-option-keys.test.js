/**
 * Select menu editor: editing an option keeps the per-option keys the editor has
 * no field for (style, rules, sounds, variables, zones). Before 2026-11-20 every
 * option edit rebuilt the options from value, label, icon and actions only, so a
 * per-option style vanished on the next label change.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

let Editor, restore;

before(async () => {
    const env = installJsdom();
    restore = env.restore;
    for (const key of ['Document', 'ShadowRoot', 'Element', 'Node', 'CSSStyleSheet', 'MutationObserver', 'DocumentFragment', 'Event', 'CustomEvent']) {
        if (globalThis[key] === undefined && env.dom.window[key] !== undefined) globalThis[key] = env.dom.window[key];
    }
    ({ LCARdSSelectMenuEditor: Editor } = await import('../../src/editor/cards/lcards-select-menu-editor.js'));
});
after(() => restore?.());

function fakeEditor(config, entityOptions = []) {
    const writes = [];
    const editor = Object.create(Editor.prototype);
    for (const [k, v] of Object.entries({
        config,
        hass: { states: { 'input_select.mode': { attributes: { options: entityOptions } } } },
        _updateConfig: (partial) => writes.push(partial),
        requestUpdate() {},
    })) Object.defineProperty(editor, k, { value: v, writable: true });
    return { editor, writes };
}

const styled = {
    value: 'alpha', label: 'Alpha',
    style: { card: { color: { background: { default: 'var(--lcars-blue)' } } } },
    rules: [{ id: 'r' }], variables: { x: 1 },
};

test('label, move, add and remove keep a per-option style, rules and variables', () => {
    const base = { type: 'custom:lcards-select-menu', entity: 'input_select.mode', options: [styled, { value: 'beta' }] };
    const cases = [
        (e) => e._setOptionField(0, 'label', 'First'),
        (e) => e._moveOption(0, 1),
        (e) => e._addManualOption('gamma'),
        (e) => e._removeOption(1),
        (e) => e._setOptionValueKey(0, 'alpha2'),
    ];
    for (const run of cases) {
        const { editor, writes } = fakeEditor(structuredClone(base));
        run(editor);
        const kept = writes.at(-1).options.find(o => o.style);
        assert.ok(kept, `style survives ${run}`);
        assert.deepEqual(kept.style, styled.style);
        assert.deepEqual(kept.rules, styled.rules);
        assert.deepEqual(kept.variables, styled.variables);
    }
});

test('sync from the entity keeps the extra keys of options it still has', () => {
    const { editor, writes } = fakeEditor({ entity: 'input_select.mode', options: [styled] }, ['alpha', 'beta']);
    editor._syncFromEntity();
    assert.deepEqual(writes[0].options, [{ value: 'alpha', label: 'Alpha', style: styled.style, rules: styled.rules, variables: styled.variables }, { value: 'beta' }]);
});

test('a map of options (keyed by the entity option) keeps its extra keys too', () => {
    const { editor, writes } = fakeEditor({ entity: 'input_select.mode', options: { alpha: { icon: 'mdi:a', style: styled.style } } }, ['alpha']);
    editor._setOptionField(0, 'label', 'A');
    assert.deepEqual(writes[0].options, [{ value: 'alpha', label: 'A', icon: 'mdi:a', style: styled.style }]);
});
