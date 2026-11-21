/**
 * MSD Studio line and shape forms keep the keys they don't manage (tags,
 * style.marker_mid, anything set in YAML) when saving; keys
 * they manage and leave out are removed. Before 2026-11-20 _saveLine and
 * _saveShape built a fresh overlay and dropped everything else. Also: the fill
 * picker's (None) row ('') saves no fill instead of an invalid `fill: ''`.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

let merge, Studio, restore;

before(async () => {
    const env = installJsdom();
    restore = env.restore;
    for (const key of ['Document', 'ShadowRoot', 'Element', 'Node', 'CSSStyleSheet', 'MutationObserver', 'DocumentFragment', 'Event', 'CustomEvent']) {
        if (globalThis[key] === undefined && env.dom.window[key] !== undefined) globalThis[key] = env.dom.window[key];
    }
    const mod = await import('../../src/editor/dialogs/lcards-msd-studio-dialog.js');
    merge = mod.mergeFormOverlay;
    Studio = mod.LCARdSMSDStudioDialog;
});
after(() => restore?.());

function fakeStudio(overlays, formProp, formData, editingProp) {
    const studio = Object.create(Studio.prototype);
    for (const [k, v] of Object.entries({
        _workingConfig: { msd: { overlays } },
        [formProp]: formData,
        [editingProp]: formData.id,
        _closeShapeForm() {}, _closeLineForm() {}, _schedulePreviewUpdate() {},
    })) Object.defineProperty(studio, k, { value: v, writable: true });
    return studio;
}

test('saving a shape keeps tags and an unmanaged style key; a cleared managed key goes', () => {
    const existing = {
        type: 'shape', id: 's', kind: 'rect', position: [0, 0], size: [10, 10], obstacle: true, tags: ['hull'],
        entity: 'binary_sensor.door', style: { color: 'var(--lcars-blue)', marker_mid: { type: 'dot' }, fill_opacity: 0.5 },
    };
    const studio = fakeStudio([existing], '_shapeFormData',
        { id: 's', kind: 'rect', position: [5, 5], size: [10, 10], style: { color: 'var(--lcars-orange)', fill: '' } }, '_editingShapeId');
    studio._saveShape();
    const saved = studio._workingConfig.msd.overlays[0];
    assert.equal(saved.obstacle, undefined, 'obstacle is a form key now (its toggle was off in this form)');
    assert.deepEqual(saved.tags, ['hull']);
    assert.deepEqual(saved.position, [5, 5]);
    assert.equal(saved.entity, undefined, 'entity cleared in the form');
    assert.equal(saved.style.color, 'var(--lcars-orange)');
    assert.deepEqual(saved.style.marker_mid, { type: 'dot' });
    assert.equal(saved.style.fill_opacity, undefined, 'fill_opacity is a form key, left at its default');
    assert.equal('fill' in saved.style, false, "the (None) row ('') saves no fill");
});

test('saving a line keeps tags and marker_mid', () => {
    const existing = { type: 'line', id: 'l', anchor: 'a', attach_to: 'b', route: 'auto', tags: ['power'], style: { width: 4, marker_mid: { type: 'dot' } } };
    const studio = fakeStudio([existing], '_lineFormData', { id: 'l', anchor: 'a', attach_to: 'c', route: 'auto', style: { width: 6 } }, '_editingLineId');
    studio._saveLine();
    const saved = studio._workingConfig.msd.overlays[0];
    assert.deepEqual(saved.tags, ['power']);
    assert.equal(saved.attach_to, 'c');
    assert.deepEqual(saved.style, { marker_mid: { type: 'dot' }, width: 6 });
});

test('a new overlay is just what the form built', () => {
    assert.deepEqual(merge(null, { id: 'x' }, new Set(['id']), new Set()), { id: 'x' });
});

test("a rect's obstacle toggle saves obstacle: true; a polyline never gets one", () => {
    let studio = fakeStudio([{ type: 'shape', id: 'r', kind: 'rect' }], '_shapeFormData',
        { id: 'r', kind: 'rect', position: [0, 0], size: [10, 10], obstacle: true, style: {} }, '_editingShapeId');
    studio._saveShape();
    assert.equal(studio._workingConfig.msd.overlays[0].obstacle, true);
    studio = fakeStudio([{ type: 'shape', id: 'p', kind: 'polyline', obstacle: true }], '_shapeFormData',
        { id: 'p', kind: 'polyline', points: [[0, 0], [5, 5]], obstacle: true, style: {} }, '_editingShapeId');
    studio._saveShape();
    assert.equal(studio._workingConfig.msd.overlays[0].obstacle, undefined);
});

test('smoothing iterations of 1 (the router default with a smoothing mode) are left out; 3 is saved', () => {
    const fields = (n) => Studio.prototype._buildShapeStyleFields.call({}, { kind: 'polyline', smoothing_mode: 'chaikin', smoothing_iterations: n, style: {} });
    assert.equal(fields(1).smoothing_iterations, undefined);
    assert.equal(fields(3).smoothing_iterations, 3);
});
