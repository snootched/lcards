/**
 * Shimmer speed (the user, 2026-11-08): `speed` was both the sweep rate and the
 * base time multiplier, so 2.5 ran at 6.25 px/s. It is applied once now, and
 * the default is 6 (about the old default look).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

installJsdom();
const { ShimmerTextureEffect } = await import('../../src/core/packs/textures/effects/ShimmerTextureEffect.js');

const sweptIn = (config, ms) => {
    const e = new ShimmerTextureEffect(config);
    e.update(ms, 300, 100);
    return e._sweepOffset;
};

test('speed is applied once: speed 3 sweeps 3 px per second', () => {
    assert.equal(sweptIn({ speed: 3 }, 1000), 3);
    assert.equal(sweptIn({ speed: 12 }, 500), 6);
});

test('the default speed is 6', () => {
    assert.equal(sweptIn({}, 1000), 6);
});
