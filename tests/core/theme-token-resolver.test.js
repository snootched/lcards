/**
 * ThemeTokenResolver: token paths, references, computed tokens, caching,
 * overrides, responsive tokens.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ThemeTokenResolver, initializeTokenResolver, getTokenResolver } from '../../src/core/themes/ThemeTokenResolver.js';

const tokens = () => ({
    colors: {
        accent: { primary: '#ff9900', secondary: 'colors.accent.primary' },
        ui: { primary: 'var(--lcards-orange)', dim: 'darken(colors.accent.primary, 0.2)' },
        loop: { a: 'colors.loop.b', b: 'colors.loop.a' },
        nested: { deep: { deeper: '#123456' } },
    },
    typography: { size: { body: 14 } },
    components: { button: { radius: 'colors.accent.primary', text: '#000' } },
    spacing: { gap: { small: 4, medium: 8, large: 16 } },
});

test('resolve: plain paths, nested paths, missing paths use the fallback', () => {
    const r = new ThemeTokenResolver(tokens());
    assert.equal(r.resolve('colors.accent.primary'), '#ff9900');
    assert.equal(r.resolve('colors.nested.deep.deeper'), '#123456');
    assert.equal(r.resolve('typography.size.body'), 14);
    assert.equal(r.resolve('colors.nope', 'fb'), 'fb');
    assert.equal(r.resolve('colors.nope'), null);
    assert.equal(r.resolve(''), null);
});

test('resolve: direct values pass straight through', () => {
    const r = new ThemeTokenResolver(tokens());
    for (const v of ['#abc', 'rgb(1,2,3)', 'rgba(1,2,3,.5)', 'var(--x)', '42']) assert.equal(r.resolve(v), v);
    assert.equal(r.resolve(7), 7);
});

test('resolve: token references chain; var() values are kept', () => {
    const r = new ThemeTokenResolver(tokens());
    assert.equal(r.resolve('colors.accent.secondary'), '#ff9900');
    assert.equal(r.resolve('components.button.radius'), '#ff9900');
    assert.equal(r.resolve('colors.ui.primary'), 'var(--lcards-orange)');
});

test('resolve: circular references stop and return the unresolved path', () => {
    const r = new ThemeTokenResolver(tokens());
    assert.equal(r.resolve('colors.loop.a', 'fb'), 'colors.loop.a');
});

test('computed tokens: functions over token paths and literals', () => {
    const r = new ThemeTokenResolver(tokens());
    assert.equal(r.resolve('colors.ui.dim'), '#cc7a00');
    assert.equal(r.resolve('darken(colors.accent.primary, 0.2)'), '#cc7a00');
    assert.equal(r.resolve('darken(#ff9900, 20%)'), '#cc7a00'); // percent args become fractions
    assert.equal(r.resolve('lighten(#336699, 0.2)'), '#5b84ad');
    assert.equal(r.resolve('alpha(colors.accent.primary, 0.5)'), 'rgba(255, 153, 0, 0.5)');
    assert.equal(r.resolve('mix(#000, #fff, 0.25)'), '#bfbfbf');
    assert.equal(r.resolve('saturate(#996633, 0.2)'), '#ad661f');
    assert.equal(r.resolve('desaturate(#ff0000, 1)'), '#808080');
    // Nested computed arguments are not evaluated (current behaviour): the inner
    // call reaches ColorUtils as a string and passes through unchanged.
    assert.equal(r.resolve('darken(lighten(#ff0000, 0.2), 0.1)'), 'lighten(#ff0000, 0.2)');
});

test('_parseComputedArgs splits on top-level commas only', () => {
    const r = new ThemeTokenResolver({});
    assert.deepEqual(r._parseComputedArgs('rgb(1, 2, 3), 0.5'), ['rgb(1, 2, 3)', '0.5']);
    assert.deepEqual(r._parseComputedArgs('a, mix(b, c), 1'), ['a', 'mix(b, c)', '1']);
});

test('caching: concrete computed results are cached, var() ones are not', () => {
    const r = new ThemeTokenResolver(tokens());
    r.resolve('darken(#ff9900, 0.2)');
    assert.equal(r.computedCache.has('darken(#ff9900, 0.2)'), true);
    // Without a DOM the var() argument cannot be materialised, but it must never be cached.
    r.resolve('darken(var(--lcards-orange), 0.2)');
    assert.equal(r.computedCache.has('darken(var(--lcards-orange), 0.2)'), false);
    // An element context also disables caching.
    r.resolve('lighten(#000000, 0.5)', null, { element: {} });
    assert.equal(r.computedCache.has('lighten(#000000, 0.5)'), false);
});

test('caching: path results are cached until clearCache()', () => {
    const t = tokens();
    const r = new ThemeTokenResolver(t);
    assert.equal(r.resolve('colors.accent.primary'), '#ff9900');
    t.colors.accent.primary = '#00ff00';
    assert.equal(r.resolve('colors.accent.primary'), '#ff9900');
    r.clearCache();
    assert.equal(r.resolve('colors.accent.primary'), '#00ff00');
});

test('overrides beat the token tree and the cache; clearing restores', () => {
    const r = new ThemeTokenResolver(tokens());
    assert.equal(r.resolve('colors.accent.primary'), '#ff9900');
    r.setOverrides({ 'colors.accent.primary': '#00ff00' });
    assert.equal(r.resolve('colors.accent.primary'), '#00ff00');
    // References resolve through the override too.
    assert.equal(r.resolve('colors.accent.secondary'), '#00ff00');
    r.setOverrides(new Map([['colors.accent.primary', '#0000ff']]));
    assert.equal(r.resolve('colors.accent.primary'), '#0000ff');
    r.clearOverrides();
    assert.equal(r.resolve('colors.accent.primary'), '#ff9900');
    r.setOverrides(null);
    assert.equal(r._overrides, null);
});

test('responsive tokens pick by viewBox width with fallbacks', () => {
    const r = new ThemeTokenResolver(tokens());
    const at = (w) => r.resolve('spacing.gap', null, { viewBox: [0, 0, w, 100] });
    assert.equal(at(300), 4);
    assert.equal(at(399), 4);
    assert.equal(at(400), 8);
    assert.equal(at(800), 16);
    // Without a viewBox the whole object comes back.
    assert.deepEqual(r.resolve('spacing.gap'), { small: 4, medium: 8, large: 16 });
    // Missing size falls back to medium, then base, then the first value.
    assert.equal(r._resolveResponsiveToken({ medium: 'm', base: 'b' }, { viewBox: [0, 0, 100, 1] }), 'm');
    assert.equal(r._resolveResponsiveToken({ base: 'b' }, { viewBox: [0, 0, 100, 1] }), 'b');
    assert.equal(r._resolveResponsiveToken({ huge: 'h' }, { viewBox: [0, 0, 100, 1] }), 'h');
});

test('forComponent prefixes relative paths only', () => {
    const r = new ThemeTokenResolver(tokens());
    const button = r.forComponent('button');
    assert.equal(button('text'), '#000');
    assert.equal(button('colors.accent.primary'), '#ff9900');
    assert.equal(button('components.button.text'), '#000');
});

test('module singleton: initializeTokenResolver feeds getTokenResolver', () => {
    initializeTokenResolver({ colors: { x: '#111' } });
    assert.equal(getTokenResolver().resolve('colors.x'), '#111');
});
