/**
 * resolveStateColor: precedence chain, numeric range specificity, token hand-off.
 *
 * Precedence: attributeState > actualState > zero > ranges > non_zero
 *             > classifiedState > default > fallback.
 */
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { resolveStateColor, resolveNestedStateColor } from '../../src/utils/state-color-resolver.js';

const resolve = (actualState, colorConfig, extra = {}) =>
    resolveStateColor({ actualState, classifiedState: 'active', colorConfig, ...extra });

afterEach(() => { delete globalThis.lcards; });

test('non-object configs: missing returns fallback, string returns itself', () => {
    assert.equal(resolveStateColor({ actualState: 'on', colorConfig: null, fallback: 'fb' }), 'fb');
    assert.equal(resolveStateColor({ actualState: 'on', colorConfig: undefined }), null);
    assert.equal(resolveStateColor({ actualState: 'on', colorConfig: '#f90' }), '#f90');
});

test('precedence: each level wins over every level below it', () => {
    const full = {
        fade: 'attr',
        '0': 'exact',
        zero: 'zero',
        'between:-1:1': 'range',
        non_zero: 'nonzero',
        active: 'classified',
        default: 'default',
    };
    const drop = (...keys) => Object.fromEntries(Object.entries(full).filter(([k]) => !keys.includes(k)));
    const opts = { classifiedState: 'active', attributeState: 'fade' };

    assert.equal(resolveStateColor({ actualState: '0', colorConfig: full, ...opts }), 'attr');
    assert.equal(resolveStateColor({ actualState: '0', colorConfig: drop('fade'), ...opts }), 'exact');
    assert.equal(resolveStateColor({ actualState: '0', colorConfig: drop('fade', '0'), ...opts }), 'zero');
    assert.equal(resolveStateColor({ actualState: '0', colorConfig: drop('fade', '0', 'zero'), ...opts }), 'range');
    // non_zero only applies to a non-zero value with no range match.
    assert.equal(resolveStateColor({ actualState: '5', colorConfig: drop('fade'), ...opts }), 'nonzero');
    assert.equal(resolveStateColor({ actualState: '0', colorConfig: drop('fade', '0', 'zero', 'between:-1:1'), ...opts }), 'classified');
    assert.equal(resolveStateColor({ actualState: 'x', colorConfig: { default: 'default' }, ...opts }), 'default');
    assert.equal(resolveStateColor({ actualState: 'x', colorConfig: {}, fallback: 'fb' }), 'fb');
});

test('falsy colour values still count as a match (uses !== undefined)', () => {
    assert.equal(resolve('on', { on: '', default: 'd' }), '');
    assert.equal(resolve('on', { on: 0, default: 'd' }), 0);
});

test('ranges: every operator, inclusive and exclusive edges', () => {
    const cases = [
        // key, value, matches
        ['above:10', 10, false], ['above:10', 10.01, true],
        ['at_least:10', 10, true], ['at_least:10', 9.99, false],
        ['below:10', 10, false], ['below:10', 9.99, true],
        ['at_most:10', 10, true], ['at_most:10', 10.01, false],
        ['between:10:20', 10, true], ['between:10:20', 20, true], ['between:10:20', 20.5, false],
        ['between_exclusive:10:20', 10, false], ['between_exclusive:10:20', 15, true], ['between_exclusive:10:20', 20, false],
        ['between:-20:-10', -15, true], ['below:-5', -6, true], ['above:-5', -4, true],
    ];
    for (const [key, value, matches] of cases) {
        assert.equal(resolve(String(value), { [key]: 'hit', default: 'miss' }), matches ? 'hit' : 'miss', `${key} @ ${value}`);
    }
});

test('ranges: specificity picks narrowest between, then highest above, then lowest below', () => {
    assert.equal(resolve('15', { 'between:0:100': 'wide', 'between:10:20': 'narrow' }), 'narrow');
    // A matching between beats any above/below, regardless of tightness.
    assert.equal(resolve('15', { 'above:14': 'above', 'between:0:100': 'between' }), 'between');
    assert.equal(resolve('50', { 'above:10': 'a10', 'at_least:40': 'a40', 'above:30': 'a30' }), 'a40');
    assert.equal(resolve('5', { 'below:100': 'b100', 'at_most:20': 'b20', 'below:50': 'b50' }), 'b20');
    // above family outranks below family.
    assert.equal(resolve('5', { 'below:6': 'below', 'above:4': 'above' }), 'above');
});

test('ranges: malformed keys are ignored', () => {
    assert.equal(resolve('5', { 'above:abc': 'bad', 'between:1': 'bad', 'between:a:b': 'bad', default: 'd' }), 'd');
});

test('numericState overrides the parsed state for zero/range/non_zero only', () => {
    const cfg = { on: 'exact', 'above:50': 'bright', non_zero: 'dim', zero: 'off' };
    assert.equal(resolve('on', cfg, { numericState: 80 }), 'exact'); // exact string still first
    const noExact = { 'above:50': 'bright', non_zero: 'dim', zero: 'off' };
    assert.equal(resolve('on', noExact, { numericState: 80 }), 'bright');
    assert.equal(resolve('on', noExact, { numericState: 20 }), 'dim');
    assert.equal(resolve('on', noExact, { numericState: 0 }), 'off');
});

test('numeric parsing uses parseFloat, so a leading number counts (current behaviour)', () => {
    assert.equal(resolve('12.5 kWh', { 'above:10': 'hi', default: 'd' }), 'hi');
    assert.equal(resolve('unavailable', { 'above:10': 'hi', non_zero: 'nz', default: 'd' }), 'd');
});

test('resolved values go through the theme resolver, theme: prefix stripped', () => {
    const seen = [];
    globalThis.lcards = { core: { themeManager: { resolver: { resolve: (path, fb) => { seen.push(path); return `R(${path})`; } } } } };
    assert.equal(resolve('on', { on: 'theme:colors.ui.primary' }), 'R(colors.ui.primary)');
    assert.equal(resolve('on', { on: 'darken(var(--x), 0.2)' }), 'R(darken(var(--x), 0.2))');
    // match-light / match-brightness placeholders are left for the card.
    assert.equal(resolve('on', { on: 'match-light' }), 'match-light');
    assert.equal(resolve('on', { on: 'match-brightness' }), 'match-brightness');
    assert.deepEqual(seen, ['colors.ui.primary', 'darken(var(--x), 0.2)']);
});

test('resolveNestedStateColor passes through to resolveStateColor', () => {
    assert.equal(resolveNestedStateColor({
        actualState: 'heat', classifiedState: 'inactive',
        configPath: { inactive: '#666', default: '#999' }, fallback: 'fb',
    }), '#666');
    assert.equal(resolveNestedStateColor({ actualState: 'heat', classifiedState: 'x', configPath: undefined, fallback: 'fb' }), 'fb');
});

test('stateKeyFor: names the key resolveStateColor picks, in the same order', async () => {
    const { stateKeyFor } = await import('../../src/utils/state-color-resolver.js');
    const config = { default: 'D', active: 'A', inactive: 'I', heat: 'H', zero: 'Z', non_zero: 'NZ', 'above:50': 'HI', 'between:10:20': 'MID', bright: 'ATTR' };
    const cases = [
        [{ actualState: 'heat', classifiedState: 'active' }, 'heat'],
        [{ actualState: 'on', classifiedState: 'active', attributeState: 'bright' }, 'bright'],
        [{ actualState: '0', classifiedState: 'inactive' }, 'zero'],
        [{ actualState: '60', classifiedState: 'active' }, 'above:50'],
        [{ actualState: '15', classifiedState: 'active' }, 'between:10:20'],
        [{ actualState: '5', classifiedState: 'active' }, 'non_zero'],
        [{ actualState: 'off', classifiedState: 'inactive' }, 'inactive'],
        [{ actualState: 'weird', classifiedState: 'unknown' }, 'default'],
    ];
    for (const [opts, key] of cases) {
        assert.equal(stateKeyFor({ ...opts, colorConfig: config }), key, JSON.stringify(opts));
        assert.equal(resolveStateColor({ ...opts, colorConfig: config }), config[key], JSON.stringify(opts));
    }
    assert.equal(stateKeyFor({ actualState: 'x', classifiedState: 'y', colorConfig: { active: 'A' } }), null);
    assert.equal(stateKeyFor({ actualState: 'x', colorConfig: 'red' }), null);
});
