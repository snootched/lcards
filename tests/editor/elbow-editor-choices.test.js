/**
 * Elbow editor: Elbow Position, Elbow Style and Entity render through FormField
 * (reports/d3d-bugs.md E3) and keep their side effects: a type without
 * segmented support resets the style to simple, a style change rebuilds the
 * elbow block, and clearing the entity removes the key.
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
    ({ LCARdSElbowEditor: Editor } = await import('../../src/editor/cards/lcards-elbow-editor.js'));
});
after(() => restore?.());

/** Fire the template's value-changed listener (FormField's) with `value`. */
function choose(template, value) {
    const listener = template.values.find(v => typeof v === 'function');
    assert.ok(listener, 'FormField template has a change listener');
    listener({ stopPropagation() {}, detail: { value }, target: {} });
}

function fakeEditor(config) {
    const writes = [];
    const editor = Object.create(Editor.prototype);
    for (const [k, v] of Object.entries({
        hass: {}, config,
        _getSchemaForPath: (p) => ({ type: 'string', enum: [], description: p }),
        _getConfigValue: () => undefined,
        _setConfigValue: (p, v) => { writes.push([p, v]); },
        _getElbowComponent: () => ({ features: ['simple'] }),
        _getElbowStyle: () => config.elbow?.style ?? 'simple',
        dispatchEvent: () => true, requestUpdate() {},
    })) Object.defineProperty(editor, k, { value: v, writable: true, configurable: true, enumerable: true });
    return { editor, writes };
}

test('Elbow Position renders an ha-selector through FormField with the given value', () => {
    const { editor } = fakeEditor({ elbow: { type: 'header-left' } });
    const options = [{ value: 'header-left', label: 'Header left' }];
    const t = editor._renderFieldWithHandler('elbow.type', {
        label: 'Elbow Position', value: 'header-left', selectorOverride: { select: { mode: 'dropdown', options } },
    }, () => {});
    assert.match(t.strings.join(''), /<ha-selector/);
    assert.ok(t.values.includes('header-left'));
    assert.ok(t.values.some(v => v?.select?.options === options));
});

test('a type without segmented support resets a segmented style', () => {
    const { editor, writes } = fakeEditor({ elbow: { type: 'header-left', style: 'segmented' } });
    choose(editor._renderFieldWithHandler('elbow.type', { value: 'header-left' }, (v) => editor._handleElbowTypeChange(v)), 'bar-left');
    assert.deepEqual(writes, [['elbow.type', 'bar-left'], ['elbow.style', 'simple']]);
});

test('a style change rebuilds the elbow block', () => {
    const { editor, writes } = fakeEditor({ elbow: { type: 'header-right', style: 'simple' } });
    choose(editor._renderFieldWithHandler('elbow.style', { value: 'simple' }, (v) => editor._handleStyleChange(v)), 'segmented');
    assert.equal(writes.length, 1);
    const [path, elbow] = writes[0];
    assert.equal(path, 'elbow');
    assert.equal(elbow.type, 'header-right');
    assert.equal(elbow.style, 'segmented');
    assert.ok(elbow.segments && !elbow.segment);
});

test('clearing the entity removes the key', () => {
    const { editor, writes } = fakeEditor({ entity: 'light.x' });
    const removed = [];
    Object.defineProperty(editor, '_removeConfigPath', { value: (p) => removed.push(p) });
    const render = () => editor._renderFieldWithHandler('entity', { value: 'light.x', selectorOverride: { entity: {} } }, (v) => {
        if (v) editor._setConfigValue('entity', v);
        else   editor._removeConfigPath('entity');
    });
    choose(render(), 'light.y');
    choose(render(), '');
    assert.deepEqual(writes, [['entity', 'light.y']]);
    assert.deepEqual(removed, ['entity']);
});

/** Every template value, nested templates and arrays included. */
function allValues(t, out = []) {
    for (const v of t?.values ?? []) {
        out.push(v);
        if (Array.isArray(v)) v.forEach(x => allValues(x, out));
        else if (v?.strings) allValues(v, out);
    }
    return out;
}

function frameEditor(frame) {
    const { editor, writes } = fakeEditor({ elbow: { type: 'frame', frame } });
    const get = (p) => p.split('.').reduce((o, k) => o?.[k], editor.config);
    Object.defineProperty(editor, '_getConfigValue', { value: get });
    Object.defineProperty(editor, '_getSchemaForPath', { value: (p) => ({ type: p.endsWith('.enabled') ? 'boolean' : 'number', description: p }) });
    Object.defineProperty(editor, '_renderShapeTextureSection', { value: () => '' });
    return { editor, writes };
}

test('frame tab: every field renders through FormField (no bare ha-selector in the method)', () => {
    const src = Editor.prototype._renderFrameDesign.toString();
    assert.doesNotMatch(src, /<ha-selector/);
    const { editor } = frameEditor({ bar_width: 40 });
    const selectors = allValues(editor._renderFrameDesign()).filter(v => v?.number || v?.boolean);
    assert.ok(selectors.length >= 15, `frame number/boolean selectors rendered (${selectors.length})`);
});

test('frame tab: a CSS length from YAML shows as text, blanking it writes the number default back', () => {
    const { editor, writes } = frameEditor({ bar_width: 40, left: { bar_width: 'clamp(20px, 3vw, 40px)' } });
    const values = allValues(editor._renderFrameDesign());
    assert.ok(values.includes('clamp(20px, 3vw, 40px)'), 'the CSS value is shown');
    const t = editor._renderCssField('Thickness (px)', 'clamp(20px, 3vw, 40px)', 'elbow.frame.left.bar_width', 40);
    choose(t, '  ');
    assert.deepEqual(writes, [['elbow.frame.left.bar_width', 40]]);
});
