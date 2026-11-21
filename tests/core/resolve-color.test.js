/**
 * Colour resolution end to end: ThemeTokenResolver + resolveColor() with the
 * real core under jsdom, CSS variables set on the document.
 *
 * Covers every syntax in color-syntax.js, both targets (CSS keeps var() live
 * for alert-mode palette changes; concrete is for Canvas2D/anime.js/SVG
 * attributes), base() during an alert mode, and the mix()/color-mix()
 * equivalence. Every input here must also pass schema validation.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { createFakeHass } from '../helpers/fake-hass.js';
import { installJsdom } from '../helpers/jsdom-env.js';
import { COLOR_VALUE_PATTERN } from '../../src/core/themes/color-syntax.js';
import { resolveColor } from '../../src/core/themes/resolve-color.js';
import { ColorUtils } from '../../src/core/themes/ColorUtils.js';
import { captureOriginalColors, getBaselineColors } from '../../src/core/themes/paletteInjector.js';
import { findInSource } from '../helpers/source-scan.js';

installJsdom();
globalThis.lcards = { core: {} }; // normally created by src/lcards-main.js
const { lcardsCore } = await import('../../src/core/lcards-core.js');
await lcardsCore.initialize(createFakeHass());
globalThis.lcards.core = lcardsCore; // as src/lcards-main.js does
after(() => clearInterval(lcardsCore._globalHassTimer));

const root = document.documentElement;
root.style.setProperty('--lcars-orange', '#ff9900');
root.style.setProperty('--lcars-ui-primary', '#336699');
const resolver = lcardsCore.themeManager.resolver;
const UI_PRIMARY = 'var(--lcars-ui-primary, var(--lcards-gray-medium))'; // colors.ui.primary in the default theme

// [input, CSS-target result, concrete result]
const CASES = [
    ['#ff9900', '#ff9900', '#ff9900'],
    ['#ff990080', '#ff990080', 'rgba(255, 153, 0, 0.502)'],
    ['black', 'black', '#000000'],
    ['hsl(36, 100%, 50%)', 'hsl(36, 100%, 50%)', '#ff9900'],
    ['rgb(255 153 0 / 50%)', 'rgb(255 153 0 / 50%)', 'rgba(255, 153, 0, 0.5)'],
    ['transparent', 'transparent', 'rgba(0, 0, 0, 0)'],
    ['var(--lcars-orange)', 'var(--lcars-orange)', '#ff9900'],
    ['theme:colors.ui.primary', UI_PRIMARY, '#336699'],
    ['alpha(#ff9900, 0.5)', 'rgba(255, 153, 0, 0.5)', 'rgba(255, 153, 0, 0.5)'],
    ['alpha(black, 50%)', 'rgba(0, 0, 0, 0.5)', 'rgba(0, 0, 0, 0.5)'],
    ['darken(rgba(255, 0, 0, 0.5), 0.2)', 'rgba(204, 0, 0, 0.5)', 'rgba(204, 0, 0, 0.5)'],
    // var() stays live for CSS, becomes concrete for Canvas
    ['alpha(var(--lcars-orange), 0.5)', 'color-mix(in srgb, var(--lcars-orange) 50%, transparent)', 'rgba(255, 153, 0, 0.5)'],
    ['lighten(theme:colors.ui.primary, 0.2)', `color-mix(in srgb, ${UI_PRIMARY} 80%, white 20%)`, '#5c85ad'],
    ['theme:darken(colors.ui.primary, 0.2)', `color-mix(in srgb, ${UI_PRIMARY} 80%, black 20%)`, '#29527a'],
    // saturate/desaturate have no color-mix() form, so they always read the current value
    ['saturate(var(--lcars-orange), 0)', '#ff9900', '#ff9900'],
    // nesting
    ['darken(lighten(#ff0000, 0.2), 0.1)', '#e62e2e', '#e62e2e'],
    ['alpha(base(colors.ui.primary), 0.5)', 'rgba(51, 102, 153, 0.5)', 'rgba(51, 102, 153, 0.5)'],
    // mix(a, b, w) = color-mix(in srgb, a w%, b)
    ['mix(#ff0000, #0000ff, 0.25)', '#4000bf', '#4000bf'],
    ['mix(var(--lcars-orange), #0000ff, 0.25)', 'color-mix(in srgb, var(--lcars-orange) 25%, #0000ff 75%)', '#4026bf'],
];

test('every case is valid config', () => {
    const pattern = new RegExp(COLOR_VALUE_PATTERN);
    for (const [input] of CASES) assert.ok(pattern.test(input), input);
});

test('CSS target: tokens and computed functions resolve, var() stays live', () => {
    for (const [input, css] of CASES) assert.equal(resolveColor(input), css, input);
});

test('concrete target: #rrggbb or rgba() only', () => {
    for (const [input, , concrete] of CASES) assert.equal(resolveColor(input, { concrete: true }), concrete, input);
});

test('resolver.resolve accepts the theme: prefix; CSS colours are never replaced by the fallback', () => {
    assert.equal(resolver.resolve('theme:colors.ui.primary', 'FB'), UI_PRIMARY);
    for (const value of ['black', 'hsl(1 2% 3%)', 'color-mix(in srgb, red 50%, blue)', 'transparent'])
        assert.equal(resolver.resolve(value, 'FB'), value);
});

test('component-scoped resolution evaluates expressions instead of treating them as paths', () => {
    const slider = resolver.forComponent('slider');
    assert.equal(slider('darken(colors.ui.primary, 0.2)', 'FB'), `color-mix(in srgb, ${UI_PRIMARY} 80%, black 20%)`);
    assert.equal(slider('black', 'FB'), 'black');
});

test('unknown tokens and unevaluable expressions return the fallback', () => {
    assert.equal(resolveColor('theme:colors.nope', { fallback: '#123456' }), '#123456');
    assert.equal(resolveColor('var(--not-defined)', { concrete: true, fallback: '#123456' }), '#123456');
    assert.equal(resolveColor('', { fallback: 'x' }), 'x');
});

test('mix() matches color-mix(in srgb) channel for channel', () => {
    const colorMix = (a, b, w) => {
        const [p, q] = [ColorUtils.parseColor(a), ColorUtils.parseColor(b)];
        return ColorUtils.rgbToHex(...p.map((v, i) => Math.round(v * w + q[i] * (1 - w))));
    };
    for (const [a, b, w] of [['#ff0000', '#0000ff', 0.25], ['#336699', '#ff9900', 0.5], ['#000', '#fff', 0.9]])
        assert.equal(ColorUtils.mix(a, b, w), colorMix(a, b, w), `${a} ${b} ${w}`);
    assert.equal(ColorUtils.mix('var(--a)', '#fff', 0.3), 'color-mix(in srgb, var(--a) 30%, #fff 70%)');
});

test('base() keeps the pre-alert value while an alert mode rewrites the palette', () => {
    // ha-lcars defines some colours with color-mix() and var() chains; both must be captured
    root.style.setProperty('--lcars-test-plain', '#112233');
    root.style.setProperty('--lcars-test-chain', 'var(--lcars-test-plain)');
    root.style.setProperty('--lcars-test-named', 'rebeccapurple');
    captureOriginalColors(root);
    const baseline = getBaselineColors();
    assert.equal(baseline['--lcars-test-plain'], '#112233');
    assert.equal(baseline['--lcars-test-chain'], '#112233');
    assert.equal(baseline['--lcars-test-named'], 'rebeccapurple');

    root.style.setProperty('--lcars-test-plain', '#ff0000'); // the alert mode shifts the palette
    assert.equal(resolveColor('base(var(--lcars-test-plain))'), '#112233');
    assert.equal(resolveColor('alpha(base(--lcars-test-plain), 0.5)'), 'rgba(17, 34, 51, 0.5)');
    assert.equal(resolveColor('var(--lcars-test-plain)', { concrete: true }), '#ff0000');
});

test('no module hand-rolls resolver + resolveCssVariable (use resolveColor)', () => {
    const strays = findInSource(/resolveCssVariable\(.*\.resolve\(/, {
        allow: ['resolve-color.js', 'ThemeTokenResolver.js'],
    });
    assert.deepEqual(strays, [], 'use resolveColor(value, { concrete: true }) from core/themes/resolve-color.js');
});
