/**
 * Alert band geometry (alert overlay `display: band`): dashes run outward from the
 * centre around the emblem gap, the band stays on screen, and per-condition
 * settings merge over the card's.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bandDashes, bandCentreY, resolveBandConfig, BAND_DEFAULTS } from '../../src/cards/alert-band-layout.js';

test('dashes fill the width on both sides of the emblem gap, symmetric about the centre', () => {
    const dashes = bandDashes(1000, { dashWidth: 8, dashGap: 12, centreGap: 200 });
    assert.ok(dashes.length > 30);
    // Nothing inside the gap.
    assert.equal(dashes.filter(d => d.x + 8 > 400 && d.x < 600).length, 0);
    // Step 0 sits right next to the gap on each side.
    const first = dashes.filter(d => d.step === 0).map(d => d.x).sort((a, b) => a - b);
    assert.deepEqual(first, [392, 600]);
    // Mirror image: the same number of dashes each side.
    assert.equal(dashes.filter(d => d.x < 500).length, dashes.filter(d => d.x >= 500).length);
    // Sorted left to right, every dash at least partly on screen.
    assert.deepEqual(dashes.map(d => d.x), [...dashes.map(d => d.x)].sort((a, b) => a - b));
    assert.ok(dashes.every(d => d.x + 8 > 0 && d.x < 1000));
});

test('without an emblem the dashes start at the centre', () => {
    const dashes = bandDashes(100, { dashWidth: 4, dashGap: 6 });
    assert.deepEqual(dashes.filter(d => d.step === 0).map(d => d.x).sort((a, b) => a - b), [43, 53]);
    assert.deepEqual(bandDashes(0, { dashWidth: 4, dashGap: 6 }), []);
    assert.deepEqual(bandDashes(100, { dashWidth: 0, dashGap: 6 }), []);
});

test('band position: centre by default, edges keep the emblem on screen, percentages clamp', () => {
    assert.equal(bandCentreY('center', 800, 64), 400);
    assert.equal(bandCentreY(undefined, 800, 64), 400);
    assert.equal(bandCentreY('top', 800, 64), 80);
    assert.equal(bandCentreY('bottom', 800, 64), 720);
    assert.equal(bandCentreY('75%', 800, 64), 600);
    assert.equal(bandCentreY('99%', 800, 64), 736);
});

test('per-condition band settings merge over the card band and the defaults', () => {
    const config = { band: { position: 'bottom', dash_width: 6 }, conditions: { yellow_alert: { band: { animation: 'flash' } } } };
    const yellow = resolveBandConfig(config, 'yellow_alert');
    assert.equal(yellow.position, 'bottom');
    assert.equal(yellow.dash_width, 6);
    assert.equal(yellow.animation, 'flash');
    assert.equal(yellow.dash_gap, BAND_DEFAULTS.dash_gap);
    assert.equal(resolveBandConfig(config, 'red_alert').animation, 'sweep');
    assert.deepEqual(resolveBandConfig({}, 'red_alert'), { ...BAND_DEFAULTS });
});

test('dash corner radius: px capped at half the dash, pill rounds fully', async () => {
    const { dashRadius } = await import('../../src/cards/alert-band-layout.js');
    assert.equal(dashRadius(undefined, 8, 40), 0);
    assert.equal(dashRadius(2, 8, 40), 2);
    assert.equal(dashRadius(20, 8, 40), 4);
    assert.equal(dashRadius('pill', 8, 40), 4);
    assert.equal(dashRadius('pill', 30, 10), 5);
});

test('sweep delays: outward starts at the symbol, inward at the edges; speed is clamped', async () => {
    const { sweepDelay, bandSpeed } = await import('../../src/cards/alert-band-layout.js');
    assert.equal(sweepDelay(0, 10, 'outward', 1000), 0);
    assert.equal(sweepDelay(10, 10, 'outward', 1000), 600);
    assert.equal(sweepDelay(10, 10, 'inward', 1000), 0);
    assert.equal(sweepDelay(0, 10, 'inward', 1000), 600);
    assert.equal(bandSpeed(undefined), 1);
    assert.equal(bandSpeed(2), 2);
    assert.equal(bandSpeed(100), 4);
    assert.equal(bandSpeed(0.01), 0.25);
    assert.equal(bandSpeed(-1), 1);
});

test('phase: the band starts its peak that many degrees into the symbol cycle', async () => {
    const { phasedStartTime, BAND_CYCLE_MS, EMBLEM_SWEEP_MS } = await import('../../src/cards/alert-band-layout.js');
    // Same period as the symbol, or the phase would drift.
    assert.equal(BAND_CYCLE_MS, EMBLEM_SWEEP_MS);
    // 180 degrees of a 2000 ms cycle, minus the sweep peak's 8% keyframe offset.
    assert.equal(phasedStartTime(1000, 180, 2000, 'sweep'), 1000 + 1000 - 160);
    assert.equal(phasedStartTime(1000, 180, 2000, 'flash'), 2000);
    assert.equal(phasedStartTime(1000, 540, 2000, 'flash'), 2000);
    assert.equal(phasedStartTime(1000, 0, 2000, 'flash'), 1000);
});
