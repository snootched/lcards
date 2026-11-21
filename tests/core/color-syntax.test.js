/**
 * color-syntax.js: the single colour grammar (validation pattern, detection,
 * parsing) and guards that keep other modules from growing their own copies.
 *
 * Regression: a new slider reported 18 "Format validation failed" warnings
 * because the schema pattern rejected `black` and `color-mix(...)` (what the
 * default theme resolves to), and `mix()`, a documented and implemented
 * computed function, never validated.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    COLOR_VALUE_PATTERN, COMPUTED_COLOR_FUNCTIONS, CSS_COLOR_FUNCTIONS, CSS_NAMED_COLORS,
    isColorValue, isCssColor, isComputedColor, parseColor,
} from '../../src/core/themes/color-syntax.js';
import { findInSource } from '../helpers/source-scan.js';

const pattern = new RegExp(COLOR_VALUE_PATTERN);

const VALID = [
    '#f90', '#f90c', '#FF9900', '#FF990080', 'black', 'rebeccapurple', 'currentColor', 'transparent', 'match-light',
    'theme:colors.ui.primary', 'theme:alpha(colors.ui.primary, 0.5)', 'var(--lcars-orange)',
    'rgb(1, 2, 3)', 'rgba(1,2,3,0.5)', 'rgb(1 2 3 / 50%)', 'hsl(1 2% 3%)', 'hsla(1,2%,3%,0.4)', 'hwb(1 2% 3%)',
    'lab(50% 40 59)', 'lch(52% 72 50)', 'oklab(0.7 0.1 0.1)', 'oklch(0.7 0.1 50)', 'color(display-p3 1 0 0)',
    'color-mix(in srgb, var(--lcars-card-button-color, var(--lcards-gray-medium)) 90%, white 10%)',
    'alpha(var(--lcards-orange), 0.08)', 'darken(theme:colors.ui.primary, 0.2)', 'lighten(#FF9900, 0.15)',
    'saturate(var(--lcars-blue), 0.3)', 'desaturate(#f00, 0.5)', 'mix(#ff0000, #0000ff, 0.25)',
    'base(colors.ui.primary)', 'alpha(base(colors.ui.primary), 0.5)', 'alpha(match-light, match-brightness)',
];
const INVALID = ['#ff99zz', '#12', '#12345', 'red blue', 'orang', '12px', 'colors.ui.primary', 'orange;', 'url(x)', '', 'shade(#f00, 0.2)'];

test('pattern and isColorValue accept the same values', () => {
    for (const value of VALID) {
        assert.ok(pattern.test(value), `pattern rejects ${value}`);
        assert.ok(isColorValue(value), `isColorValue rejects ${value}`);
    }
    for (const value of INVALID) {
        assert.ok(!pattern.test(value), `pattern accepts ${value}`);
        assert.ok(!isColorValue(value), `isColorValue accepts ${value}`);
    }
});

test('the schema pattern compiles in unicode mode (schema tooling uses the u flag)', () => {
    assert.doesNotThrow(() => new RegExp(COLOR_VALUE_PATTERN, 'u'));
});

test('every named colour and function is in the schema pattern', () => {
    for (const name of Object.keys(CSS_NAMED_COLORS)) assert.ok(pattern.test(name), name);
    for (const fn of [...CSS_COLOR_FUNCTIONS, ...COMPUTED_COLOR_FUNCTIONS]) assert.ok(pattern.test(`${fn}(x)`), fn);
});

test('isCssColor is browser syntax only; isComputedColor is LCARdS functions only', () => {
    for (const v of ['#fff', 'Black', 'var(--x)', 'color-mix(in srgb, red, blue)', 'hsl(1 2% 3%)']) assert.ok(isCssColor(v), v);
    for (const v of ['theme:colors.x', 'alpha(#fff, 0.5)', 'match-light', 'colors.ui.primary']) assert.ok(!isCssColor(v), v);
    for (const v of COMPUTED_COLOR_FUNCTIONS.map(fn => `${fn}(#fff, 0.5)`)) assert.ok(isComputedColor(v), v);
    for (const v of ['color-mix(in srgb, red, blue)', 'theme:alpha(#fff, 0.5)', '#fff']) assert.ok(!isComputedColor(v), v);
});

test('parseColor: every concrete syntax, without a DOM', () => {
    const cases = [
        ['#f90', { r: 255, g: 153, b: 0, a: 1 }],
        ['#f908', { r: 255, g: 153, b: 0, a: 0.533 }],
        ['#FF9900', { r: 255, g: 153, b: 0, a: 1 }],
        ['#ff990080', { r: 255, g: 153, b: 0, a: 0.502 }],
        ['black', { r: 0, g: 0, b: 0, a: 1 }],
        ['RebeccaPurple', { r: 102, g: 51, b: 153, a: 1 }],
        ['transparent', { r: 0, g: 0, b: 0, a: 0 }],
        ['rgb(255, 153, 0)', { r: 255, g: 153, b: 0, a: 1 }],
        ['rgba(255,153,0,0.5)', { r: 255, g: 153, b: 0, a: 0.5 }],
        ['rgb(255 153 0 / 50%)', { r: 255, g: 153, b: 0, a: 0.5 }],
        ['rgb(100% 60% 0%)', { r: 255, g: 153, b: 0, a: 1 }],
        ['hsl(36, 100%, 50%)', { r: 255, g: 153, b: 0, a: 1 }],
        ['hsla(120 100% 25% / 0.25)', { r: 0, g: 128, b: 0, a: 0.25 }],
        ['oklch(0.75 0.17 60)', { r: 250, g: 143, b: 25, a: 1 }],
        ['oklch(75% 0.17 60deg / 0.5)', { r: 250, g: 143, b: 25, a: 0.5 }],
        ['color(srgb 1 0.6 0 / 0.5)', { r: 255, g: 153, b: 0, a: 0.5 }],
        // color-mix(in srgb): CSS Color 5 normalisation, premultiplied alpha, nesting
        ['color-mix(in srgb, red, blue)', { r: 128, g: 0, b: 128, a: 1 }],
        ['color-mix(in srgb, #ff0000 25%, #0000ff)', { r: 64, g: 0, b: 191, a: 1 }],
        ['color-mix(in srgb, #ff9900 50%, transparent)', { r: 255, g: 153, b: 0, a: 0.5 }],
        ['color-mix(in srgb, red 30%, blue 20%)', { r: 153, g: 0, b: 102, a: 0.5 }],
        ['color-mix(in srgb, color-mix(in srgb, #ff9900 80%, black 20%) 50%, transparent)', { r: 204, g: 122, b: 0, a: 0.5 }],
    ];
    for (const [input, expected] of cases) assert.deepEqual(parseColor(input), expected, input);
    for (const input of ['var(--x)', 'color-mix(in oklch, red, blue)', 'color-mix(in srgb, var(--x), red)', 'lab(50% 40 59)', 'color(display-p3 1 0 0)', 'garbage', 'rgb(1, 2)', '', null])
        assert.equal(parseColor(input), null, String(input));
});

// ── Guards ─────────────────────────────────────────────────────────────

test('no schema declares its own colour pattern', () => {
    const strays = findInSource(/pattern:\s*['"`].*rgba?\\\\\(/);
    assert.deepEqual(strays, [], 'use COLOR_VALUE_PATTERN from core/themes/color-syntax.js');
});

test('no module keeps its own list, regex or evaluator of computed colour functions', () => {
    // The Borg worker runs from a Blob URL and cannot import modules.
    const strays = findInSource(
        // A function-name list (CSS blend modes share darken/lighten, so key on
        // saturate/desaturate), an evaluator (only one calls saturate/desaturate),
        // or an alternation regex
        /['"]saturate['"]\s*,\s*['"]desaturate['"]|ColorUtils\.(de)?saturate\(|\((alpha|darken|lighten)\|(alpha|darken|lighten)\|/,
        { allow: ['color-syntax.js', 'ThemeTokenResolver.js', 'ColorUtils.js', 'BorgAssimilationWorker.js'] },
    );
    assert.deepEqual(strays, [], 'use isComputedColor (color-syntax.js) and evaluate through ThemeTokenResolver');
});

test('no module parses hex or rgb() strings by hand', () => {
    const strays = findInSource(
        /match\(\/\^?#\(?\[0-9a-f|match\(\/\^?rgba\?|\/\^#\[0-9a-f\]\{3,8\}\$\/|rgba\?\\\(\\s\*\(\\d/i,
        { allow: ['color-syntax.js', 'BorgAssimilationWorker.js', 'yaml-schema-assist.js'] },
    );
    assert.deepEqual(strays, [], 'use parseColor from core/themes/color-syntax.js');
});
