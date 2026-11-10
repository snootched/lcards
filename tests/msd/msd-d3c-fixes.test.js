/**
 * MSD bugs found by the D3 architecture docs check (D3c):
 *  - M1: a disabled pipeline's errors never reached the card's error panel
 *    (card read `issues`, pipeline returned `errors`/`warnings`; anchor errors
 *    carried their text in `msg`, the panel printed `message`)
 *  - M2: a <g id> anchor had a null position, so a control on it was skipped
 *  - M3: the pipeline API's listEntities()/getEntity() threw; rulesEngine was always undefined
 *  - M5: the coordinator called controlsRenderer.destroy(), the method is cleanup()
 *  - M7: _onAlertModeChanged fell back to coordinator.hass (does not exist)
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installJsdom } from '../helpers/jsdom-env.js';

const env = installJsdom();
for (const key of Object.getOwnPropertyNames(env.dom.window)) {
    if (/^[A-Z]/.test(key) && !(key in globalThis)) /** @type {any} */ (globalThis)[key] = /** @type {any} */ (env.dom.window)[key];
}
after(() => env.restore());

const { render } = await import('lit');
const { initMsdPipeline } = await import('../../src/msd/pipeline/PipelineCore.js');
const { LCARdSMSDCard, msdIssueText } = await import('../../src/cards/lcards-msd.js');
const { findSvgAnchors } = await import('../../src/utils/lcards-anchor-helpers.js');
const { MsdCardCoordinator } = await import('../../src/msd/pipeline/MsdCardCoordinator.js');

function stubConfigManager() {
    const prev = /** @type {any} */ (globalThis).lcards;
    /** @type {any} */ (globalThis).lcards = {
        ...(prev || {}),
        core: {
            ...(prev?.core || {}),
            configManager: {
                initialized: true,
                async processConfig(config) {
                    return { mergedConfig: config, provenance: { merge_order: [], field_sources: {} }, errors: [], warnings: [] };
                },
            },
        },
    };
    return () => { /** @type {any} */ (globalThis).lcards = prev; };
}

test('M1: a missing anchor disables the pipeline with its real error, and the card panel shows it', async () => {
    const restore = stubConfigManager();
    let result;
    try {
        result = /** @type {any} */ (await initMsdPipeline({
            type: 'custom:lcards-msd-card',
            msd: {
                base_svg: { source: 'none' },
                view_box: [0, 0, 200, 100],
                overlays: [{ id: 'b', type: 'line', anchor: 'ghost', attach_to: 'b' }],
            },
        }, null, document.createElement('div'), null, 'm1-guid'));
    } finally {
        restore();
    }
    assert.equal(result.enabled, false);
    const texts = result.issues.errors.map(msdIssueText);
    assert.ok(texts.some(t => t.includes("missing anchor 'ghost'")), texts.join(' | '));
    assert.ok(texts.some(t => t.includes('cannot reference itself')), texts.join(' | '));

    // The card's error panel prints those texts
    const card = /** @type {any} */ (Object.create(LCARdSMSDCard.prototype));
    card._configIssues = result.issues;
    const host = document.createElement('div');
    render(card._renderValidationErrors(), host);
    assert.match(host.textContent ?? '', /references missing anchor 'ghost'/);
    assert.doesNotMatch(host.textContent ?? '', /\[object Object\]/);
});

test('M1: the card builds its issues from errors/warnings when a result has no issues object', () => {
    const src = readFileSync(new URL('../../src/cards/lcards-msd.js', import.meta.url), 'utf8');
    assert.match(src, /pipelineResult\?\.errors\?\.length/);
    assert.equal(msdIssueText({ msg: 'old' }), 'old');
    assert.equal(msdIssueText({ message: 'new' }), 'new');
    assert.equal(msdIssueText('plain'), 'plain');
});

test('M2: a <g id> anchor gets a position (bounding box centre; inner anchors where there is no layout)', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <g id="panel"><circle id="c1" cx="10" cy="20" r="2"/><rect id="r1" x="30" y="40" width="10" height="20"/></g>
        <g id="empty"></g>
    </svg>`;
    // jsdom has no getBBox: centre of the inner anchors
    const anchors = findSvgAnchors(svg);
    assert.deepEqual(anchors.panel, [(10 + 35) / 2, (20 + 50) / 2]);
    assert.equal('empty' in anchors, false, 'a group with no geometry is left out (reported as a missing anchor)');

    // With a layout engine: getBBox() centre
    const proto = /** @type {any} */ (globalThis).SVGElement.prototype;
    proto.getBBox = function () {
        return this.id === 'panel' ? { x: 0, y: 0, width: 50, height: 80 } : { x: 0, y: 0, width: 0, height: 0 };
    };
    try {
        assert.deepEqual(findSvgAnchors(svg).panel, [25, 40]);
    } finally {
        delete proto.getBBox;
    }
});

test('M3: the pipeline API no longer has the throwing listEntities()/getEntity() or the empty rulesEngine', () => {
    const src = readFileSync(new URL('../../src/msd/pipeline/PipelineCore.js', import.meta.url), 'utf8');
    assert.doesNotMatch(src, /entityRuntime/);
    assert.doesNotMatch(src, /rulesEngine:\s*coordinator\.rulesEngine/);
    assert.doesNotMatch(src, /listEntities:/);
});

test('M5: coordinator.destroy() runs the controls renderer cleanup()', async () => {
    const coordinator = /** @type {any} */ (new MsdCardCoordinator());
    let cleaned = 0;
    coordinator.controlsRenderer = { cleanup() { cleaned++; } };
    await coordinator.destroy();
    assert.equal(cleaned, 1);
    assert.equal(coordinator.controlsRenderer, null);
});

test('M7: an alert mode change re-colours lines with the coordinator HASS when the card has none', () => {
    const hass = { states: {} };
    /** @type {any[]} */
    const calls = [];
    const card = /** @type {any} */ (Object.create(LCARdSMSDCard.prototype));
    Object.defineProperty(card, 'hass', { value: undefined, writable: true });
    card._refreshBackgroundAnimationColors = () => {};
    card._msdPipeline = { coordinator: { getHass: () => hass, renderer: { updateLineEntityColors: (...args) => calls.push(args) } } };
    card._onAlertModeChanged('red');
    assert.equal(calls.length, 1);
    assert.equal(calls[0][0], hass);
    assert.deepEqual(calls[0][1], { all: true });
});
