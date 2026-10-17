/**
 * ColorUtils: colour maths, parsing, conversions, contrast.
 * resolveCssVariable needs a DOM and is covered by browser tests (S3).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ColorUtils as C } from '../../src/core/themes/ColorUtils.js';

const near = (actual, expected, eps, msg) =>
    assert.ok(Math.abs(actual - expected) <= eps, `${msg ?? ''} ${actual} !~ ${expected}`);

test('parseColor: hex, rgb(a), hsl, oklch and names, without a DOM (alpha dropped)', () => {
    const cases = [
        ['#f90', [255, 153, 0]],
        ['#ff9900', [255, 153, 0]],
        ['#FF9900', [255, 153, 0]],
        ['#ff990080', [255, 153, 0]],
        ['rgb(255, 153, 0)', [255, 153, 0]],
        ['rgba(255,153,0,0.5)', [255, 153, 0]],
        ['rgb(255 153 0)', [255, 153, 0]],
        ['oklch(0.75 0.17 60)', [250, 143, 25]],
        ['oklch(75% 0.17 60deg / 0.5)', [250, 143, 25]],
        ['hsl(36, 100%, 50%)', [255, 153, 0]],
        ['red', [255, 0, 0]],
        ['transparent', [0, 0, 0]],
        ['garbage', null],
        [null, null],
    ];
    for (const [input, expected] of cases) assert.deepEqual(C.parseColor(input), expected, String(input));
});

test('_parseColorAlpha reads any alpha channel; opaque is null', () => {
    assert.equal(C._parseColorAlpha('rgba(1,2,3,.5)'), 0.5);
    assert.equal(C._parseColorAlpha('#ff990080'), 0.502);
    assert.equal(C._parseColorAlpha('oklch(0.7 0.1 30 / 50%)'), 0.5);
    assert.equal(C._parseColorAlpha('#ff9900'), null);
});

test('toHex: parsed directly without a DOM', () => {
    assert.equal(C.toHex('rebeccapurple'), '#663399');
    assert.equal(C.toHex('rgba(255, 153, 0, 0.5)', { withAlpha: true }), '#ff990080');
    assert.equal(C.toHex('hsl(36, 100%, 50%)'), '#ff9900');
});

test('darken / lighten', () => {
    assert.equal(C.darken('#ff9900', 0.2), '#cc7a00');
    assert.equal(C.darken('rgb(255,0,0)', 0), '#ff0000');
    assert.equal(C.lighten('#336699', 0.2), '#5c85ad');
    assert.equal(C.lighten('#000', 1), '#ffffff');
    // CSS variables become color-mix(); unparseable input passes through.
    assert.equal(C.darken('var(--x)', 0.2), 'color-mix(in srgb, var(--x) 80%, black 20%)');
    assert.equal(C.darken('nope', 0.2), 'nope');
});

test('alpha', () => {
    assert.equal(C.alpha('#ff9900', 0.5), 'rgba(255, 153, 0, 0.5)');
    assert.equal(C.alpha('rgb(1,2,3)', 0), 'rgba(1, 2, 3, 0)');
    assert.equal(C.alpha('#ff990080', 1), 'rgba(255, 153, 0, 1)');
    assert.equal(C.alpha('var(--x)', 0.5), 'color-mix(in srgb, var(--x) 50%, transparent)');
});

test('saturate / desaturate / mix', () => {
    assert.equal(C.saturate('#996633', 0.2), '#ad661f');
    assert.equal(C.saturate('#808080', 0.5), '#c04141');
    assert.equal(C.desaturate('#ff0000', 1), '#808080');
    assert.equal(C.mix('#ff0000', '#0000ff'), '#800080');
    assert.equal(C.mix('#000', '#fff', 0.25), '#bfbfbf');
});

test('rgb/hex/hsl conversions round trip', () => {
    assert.equal(C.rgbToHex(255, 153, 0), '#ff9900');
    assert.deepEqual(C.rgbToHsl(255, 153, 0), [36, 100, 50]);
    assert.equal(C.hslToRgb(36, 100, 50), '#ff9900');
});

test('oklch round trip within 1 unit per channel', () => {
    for (const rgb of [[255, 153, 0], [0, 0, 0], [255, 255, 255], [51, 102, 153], [204, 102, 153]]) {
        const back = C.oklchToRgb(...C.rgbToOklch(...rgb));
        rgb.forEach((v, i) => near(back[i], v, 1, `${rgb} ch${i}`));
    }
    const [L, chroma, H] = C.rgbToOklch(255, 153, 0);
    near(L, 0.772, 0.001); near(chroma, 0.174, 0.001); near(H, 64.55, 0.01);
});

test('kelvinToRgb: warm to cool', () => {
    assert.deepEqual(C.kelvinToRgb(1000), [255, 68, 0]);
    assert.deepEqual(C.kelvinToRgb(2700), [255, 167, 87]);
    assert.deepEqual(C.kelvinToRgb(6500), [255, 254, 250]);
    assert.deepEqual(C.kelvinToRgb(10000), [202, 218, 255]);
    assert.deepEqual(C.kelvinToRgb(40000), [152, 186, 255]);
});

test('hsToRgb', () => {
    assert.deepEqual(C.hsToRgb(0, 100), [255, 0, 0]);
    assert.deepEqual(C.hsToRgb(120, 50, 128), [64, 128, 64]);
    // A negative hue wraps (it used to fall through every sector and return NaN).
    assert.deepEqual(C.hsToRgb(-330, 100), C.hsToRgb(30, 100));
});

test('luminance, wcagContrast, contrastColor', () => {
    assert.equal(C.luminance('#ffffff'), 1);
    assert.equal(C.luminance('#000'), 0);
    near(C.luminance('#ff9900'), 0.4404, 0.0001);
    assert.equal(C.luminance('not a colour'), 0.5);
    assert.equal(C.wcagContrast('#fff', '#000'), 21);
    near(C.wcagContrast('#ff9900', '#000'), 9.81, 0.01);
    assert.equal(C.contrastColor('#ffffff'), 'black');
    assert.equal(C.contrastColor('#000'), 'white');
    // Current behaviour: cutoff is luminance 0.5, so LCARS orange gets white text
    // (2.1:1) although black would give 9.8:1. The WCAG crossover is ~0.179.
    assert.equal(C.contrastColor('#ff9900'), 'white');
});
