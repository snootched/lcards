/**
 * themeGeneratorCore: palette scale generation, var naming, on-colour contrast picking.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../../src/core/themes/themeGeneratorCore.js';
import { GREEN_ALERT_PALETTE } from '../../src/core/themes/paletteInjector.js';

/** Canon anchors for a palette family, keyed by HA tone slot. */
const anchorsFor = (family) => Object.fromEntries(
    Object.entries(G.ANCHOR_SUFFIX_TO_TONE).map(([suffix, tone]) => [tone, GREEN_ALERT_PALETTE[suffix ? `${family}-${suffix}` : family]])
);
const lightness = (hex) => G.rgbToOklch(...G.hexToRgb(hex))[0];

test('computeFullScale: anchors kept, gaps interpolated, 95 extrapolated', () => {
    const anchors = anchorsFor('orange');
    const { scale, meta } = G.computeFullScale(anchors);
    assert.deepEqual(Object.keys(scale).sort(), [...G.TONE_ORDER].sort());
    for (const tone of Object.keys(anchors)) {
        assert.equal(scale[tone], anchors[tone]);
        assert.equal(meta[tone], 'anchor');
    }
    assert.deepEqual([meta['10'], meta['50'], meta['60'], meta['95']], ['interpolated', 'interpolated', 'interpolated', 'extrapolated']);
});

test('computeFullScale: generated tones sit between their anchors; 95 is lighter than 90', () => {
    // Canon anchors are hand-picked and not always monotonic (blue-light is
    // lighter than blue-lightest, yellow-light darker than yellow-medium-light),
    // so this checks only what the generator itself produces.
    for (const family of ['orange', 'gray', 'blue', 'green', 'yellow']) {
        const { scale } = G.computeFullScale(anchorsFor(family));
        const L = (t) => lightness(scale[t]);
        const between = (t, lo, hi) => assert.ok(
            L(t) >= Math.min(L(lo), L(hi)) - 1e-6 && L(t) <= Math.max(L(lo), L(hi)) + 1e-6,
            `${family} ${t} outside ${lo}..${hi}`);
        between('10', '05', '20');
        between('50', '40', '70');
        between('60', '40', '70');
        assert.ok(L('50') <= L('60'), `${family} 50 > 60`);
        assert.ok(L('95') > L('90'), `${family} 95 <= 90`);
    }
});

test('computeFullScale: orange scale (reviewed values)', () => {
    const { scale, fadeToWhite95 } = G.computeFullScale(anchorsFor('orange'));
    assert.deepEqual(Object.fromEntries(G.TONE_ORDER.map(t => [t, scale[t]])), {
        '05': '#d91604', '10': '#e01808', '20': '#ef1d10', '30': '#e7442a', '40': '#ff6753',
        '50': '#ff715d', '60': '#ff7b66', '70': '#ff8470', '80': '#ff977b', '90': '#ffb399', '95': '#ffceb3',
    });
    // Neon 95 keeps more chroma than the fade-to-white comparison.
    assert.equal(fadeToWhite95, '#ffd9cc');
    assert.ok(G.rgbToOklch(...G.hexToRgb(scale['95']))[1] > G.rgbToOklch(...G.hexToRgb(fadeToWhite95))[1]);
});

test('computeHaDefaultScale: seed at 40, darker below, lighter above', () => {
    const scale = G.computeHaDefaultScale('#ff9900');
    assert.equal(scale['40'], '#ff9900');
    assert.ok(lightness(scale['05']) < lightness(scale['40']));
    assert.ok(lightness(scale['95']) > lightness(scale['40']));
});

test('toneKey / lcardsToneVarName', () => {
    assert.equal(G.toneKey('orange', 5), 'orange-darkest');
    assert.equal(G.toneKey('orange', '05'), 'orange-darkest');
    assert.equal(G.toneKey('orange', 40), 'orange');
    assert.equal(G.toneKey('blue', 95), 'blue-95');
    assert.equal(G.lcardsToneVarName('orange', 90), '--lcards-orange-lightest');
});

test('oklch helpers round trip and wcagContrast', () => {
    assert.equal(G.rgbToHex(...G.oklchToRgb(...G.rgbToOklch(255, 153, 0))), '#ff9900');
    assert.equal(G.wcagContrast('#ffffff', '#000000'), 21);
    assert.equal(G.lerpOklch('#ff0000', '#0000ff', 0), '#ff0000');
    assert.equal(G.lerpOklch('#ff0000', '#0000ff', 1), '#0000ff');
});

// ── resolveOnEntry: picks readable on-colours ─────────────────────────

/** Grey ramp tone resolver; `overrides` replaces individual tones. */
function greyRamp(overrides = {}) {
    const scale = {
        5: '#111111', 10: '#222222', 20: '#333333', 30: '#444444', 40: '#555555', 50: '#666666',
        60: '#999999', 70: '#888888', 80: '#aaaaaa', 90: '#cccccc', 95: '#eeeeee', ...overrides,
    };
    return (role, spec, mode) => {
        if (spec === 'WHITE') return { var: 'var(--white-color)', hex: '#ffffff' };
        if (spec === 'BLACK') return { var: 'var(--black-color)', hex: '#000000' };
        return { var: `var(--${role}-${spec})`, hex: scale[Number(spec)] };
    };
}

test('resolveOnEntry: mechanical tone kept when it passes AA', () => {
    // danger/dark/normal is tone 60.
    const r = G.resolveOnEntry(greyRamp(), () => ({ hex: '#000000' }), 'danger', 'dark', 'normal', '#000000');
    assert.equal(r.corrected, false);
    assert.equal(r.usedTone, '60');
    assert.ok(r.finalRatio >= G.AA_THRESHOLD);
});

test('resolveOnEntry: falls back to the first passing on-brand tone, not straight to white', () => {
    const r = G.resolveOnEntry(greyRamp({ 60: '#333333' }), () => ({ hex: '#000000' }), 'danger', 'dark', 'normal', '#000000');
    assert.equal(r.corrected, true);
    // #777777 would be the first grey to pass against black; the ramp's first passing tone is 70 (#888888).
    assert.equal(r.usedTone, '70');
    assert.equal(r.hex, '#888888');
});

test('resolveOnEntry: quiet tier ignores the fill and judges the ambient background only', () => {
    const fillSpy = () => { throw new Error('fill must not be read for quiet'); };
    // danger/dark/quiet is tone 70 (#888888), readable on black.
    const r = G.resolveOnEntry(greyRamp(), fillSpy, 'danger', 'dark', 'quiet', '#000000');
    assert.equal(r.corrected, false);
    assert.equal(r.usedTone, '70');
});

test('resolveOnEntry: loud tier only considers mechanical, white and black', () => {
    // danger/light/loud is WHITE; on a white fill that fails, and black is next.
    const r = G.resolveOnEntry(greyRamp(), () => ({ hex: '#ffffff' }), 'danger', 'light', 'loud', '#ffffff');
    assert.equal(r.hex, '#000000');
    assert.equal(r.usedTone, null);
});

test('resolveSurfaceEntry handles WHITE/BLACK sentinels', () => {
    for (const mode of ['light', 'dark']) {
        for (const key of Object.keys(G.SURFACE[mode])) {
            const entry = G.resolveSurfaceEntry(greyRamp(), mode, key);
            assert.match(entry.hex, /^#[0-9a-f]{6}$/, `${mode}.${key}`);
        }
    }
});

test('formatThemeYaml: name, card-mod-theme first, merge keys', () => {
    const yaml = G.formatThemeYaml({ name: 'My Theme', mergeKeys: ['base'], flat: { 'primary-color': '#ff9900' }, modes: {} });
    const lines = yaml.split('\n');
    assert.match(lines[0], /^"?My Theme"?:$/);
    assert.match(lines[1], /card-mod-theme:/);
    assert.equal(lines[2], '  <<: *base');
    assert.ok(yaml.includes('primary-color'));
});
