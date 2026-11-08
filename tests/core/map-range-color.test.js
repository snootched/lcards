/**
 * map_range with colour output: both ends take every colour form LCARdS
 * accepts (var(), theme: tokens, alpha() and the other computed functions,
 * named colours, rgb()/hsl(), any hex length), blended in RGBA. Runs the real
 * core under jsdom, as resolve-color.test.js does, through each map_range
 * path: animation params (and so rules), background animations and the
 * button's shape_texture.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { createFakeHass } from '../helpers/fake-hass.js';
import { installJsdom } from '../helpers/jsdom-env.js';
import { interpolateColor } from '../../src/core/themes/resolve-color.js';
import { mapRangeOutput } from '../../src/utils/linearMap.js';
import { resolveAnimParam } from '../../src/core/animation/resolveAnimParams.js';

const { dom } = installJsdom();
// The button card module (Lit) also wants the DOM constructors installJsdom leaves out
for (const key of Object.getOwnPropertyNames(dom.window)) {
    if (/^[A-Z]/.test(key) && !(key in globalThis)) globalThis[key] = dom.window[key];
}
globalThis.lcards = { core: {} }; // normally created by src/lcards-main.js
const { lcardsCore } = await import('../../src/core/lcards-core.js');
await lcardsCore.initialize(createFakeHass());
globalThis.lcards.core = lcardsCore; // as src/lcards-main.js does
after(() => clearInterval(lcardsCore._globalHassTimer));

const root = document.documentElement;
root.style.setProperty('--lcars-orange', '#ff9900');
root.style.setProperty('--lcars-ui-primary', '#336699');

// [from, to, colour at t = 0.5]
const CASES = [
    ['#000000', '#ffffff', '#808080'],
    ['#000', '#fff', '#808080'],                                   // 3-digit hex
    ['#ff000080', '#ff0000ff', 'rgba(255, 0, 0, 0.751)'],           // 8-digit hex, alpha blends
    ['black', 'white', '#808080'],                                 // named
    ['var(--lcars-orange)', '#000000', '#804d00'],                 // CSS variable
    ['theme:colors.ui.primary', '#000000', '#1a334d'],             // theme token
    ['alpha(#ff9900, 0.5)', '#ff9900', 'rgba(255, 153, 0, 0.75)'],  // computed function
    ['rgb(255 0 0)', 'hsl(240, 100%, 50%)', '#800080'],
    ['transparent', '#ff0000', 'rgba(255, 0, 0, 0.5)'],             // premultiplied: no grey
];

test('interpolateColor blends every colour form at the ends and middle', () => {
    for (const [from, to, mid] of CASES) {
        assert.equal(interpolateColor(from, to, 0.5), mid, `${from} → ${to}`);
    }
    assert.equal(interpolateColor('var(--lcars-orange)', 'black', 0), '#ff9900');
    assert.equal(interpolateColor('var(--lcars-orange)', 'black', 1), '#000000');
    assert.equal(interpolateColor('#000', '#fff', 7), '#ffffff', 'held to the ends');
    assert.equal(interpolateColor('not-a-colour', '#fff', 0.5), null);
});

test('mapRangeOutput maps numbers linearly and colours through interpolateColor', () => {
    assert.equal(mapRangeOutput(50, 0, 100, [0, 10], true), 5);
    assert.equal(mapRangeOutput(200, 0, 100, [0, 10], false), 20);
    assert.equal(mapRangeOutput(50, 0, 100, ['var(--lcars-orange)', 'black'], true), '#804d00');
    assert.equal(mapRangeOutput(200, 0, 100, ['#000', '#fff'], false), '#ffffff', 'colours hold at the ends');
    assert.equal(mapRangeOutput(50, 0, 100, [0, '#fff'], true), undefined);
});

const hass = { states: { 'sensor.level': { state: '50', attributes: {} } } };
const descriptor = (output) => ({ map_range: { entity: 'sensor.level', input: [0, 100], output } });

test('animation params (and rules): map_range colour output takes every colour form', () => {
    for (const [from, to, mid] of CASES) {
        assert.equal(resolveAnimParam(descriptor([from, to]), hass), mid, `${from} → ${to}`);
    }
});

test('background animations: map_range colour output takes every colour form', async () => {
    const { BackgroundAnimationRenderer } = await import('../../src/core/packs/backgrounds/BackgroundAnimationRenderer.js');
    const resolve = BackgroundAnimationRenderer.prototype._resolveMapRange;
    for (const [from, to, mid] of CASES) {
        assert.equal(resolve.call({ cardInstance: null }, descriptor([from, to]), hass, null, {}), mid, `${from} → ${to}`);
    }
    assert.equal(resolve.call({ cardInstance: null }, descriptor([-200, 200]), hass, null, {}), 0);
});

test('button shape_texture: map_range colour output takes every colour form', async () => {
    const { LCARdSButton } = await import('../../src/cards/lcards-button.js');
    for (const [from, to, mid] of CASES) {
        // a connected element, as the card is, so CSS variables read through it
        const card = Object.assign(document.body.appendChild(document.createElement('div')), {
            config: { entity: 'sensor.level', shape_texture: { preset: 'grid', config: { color: descriptor([from, to]) } } },
            hass,
            _entity: hass.states['sensor.level'],
            _supportsShapeTexture: () => true,
            _classifyEntityState: () => 'active',
            _resolveColorValue: (value) => value,
            _resolveStateValue: ({ fallback }) => fallback,
        });
        // jsdom does not inherit custom properties, so the card holds them itself
        card.style.setProperty('--lcars-orange', '#ff9900');
        card.style.setProperty('--lcars-ui-primary', '#336699');
        const resolved = LCARdSButton.prototype._resolveShapeTextureConfig.call(card);
        assert.equal(resolved.resolvedConfig.color, mid, `${from} → ${to}`);
        card.remove();
    }
});
