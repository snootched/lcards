/**
 * @fileoverview noise-helpers - Shared fBm value-noise and color utilities
 *
 * Used by FluidTextureEffect and PlasmaTextureEffect (and any future pixel-level
 * texture effects that need per-pixel noise and RGBA math).
 *
 * @module core/packs/textures/effects/noise-helpers
 */

import { ColorUtils } from '../../../themes/ColorUtils.js';
import { parseColor } from '../../../themes/color-syntax.js';

// ---------------------------------------------------------------------------
// fBm value-noise (hash-based, no look-up table required)
// ---------------------------------------------------------------------------

/**
 * Lattice hash constants, shared with the GLSL port (webgl/scenes/noise-glsl.js)
 * so both tiers sample the same field. Integer math only: a `sin()` hash
 * breaks down in float32 shaders as coordinates grow.
 */
export const NOISE_HASH = { X: 0x8da6b343, Y: 0xd8163841, S: 0x9e3779b9, M1: 0x7feb352d, M2: 0x846ca68b };

/**
 * Pseudo-random hash in [−2, 2) for integer lattice point (ix, iy), uniform.
 * (The range is wider than [−1, 1] for historical reasons: the effects'
 * normalisation is tuned to it.)
 */
export function _hash(ix, iy) {
    let h = (((Math.imul(ix | 0, NOISE_HASH.X) ^ Math.imul(iy | 0, NOISE_HASH.Y)) >>> 0) + NOISE_HASH.S) >>> 0;
    h ^= h >>> 16;
    h = Math.imul(h, NOISE_HASH.M1) >>> 0;
    h ^= h >>> 15;
    h = Math.imul(h, NOISE_HASH.M2) >>> 0;
    h ^= h >>> 16;
    return (h >>> 0) / 1073741824 - 2;
}

/** Smooth value-noise at continuous (x, y) via bilinear interpolation + smoothstep fade. */
export function _smoothNoise(x, y) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx);
    const uy = fy * fy * (3 - 2 * fy);
    const a  = _hash(ix,     iy);
    const b  = _hash(ix + 1, iy);
    const c  = _hash(ix,     iy + 1);
    const d  = _hash(ix + 1, iy + 1);
    return a + (b - a) * ux + (c - a) * uy + (a + d - b - c) * ux * uy;
}

/** fBm: sum of `octaves` octaves of smoothNoise (about [−2, 2), mostly within [−1.7, 1.8]). */
export function _fbm(x, y, octaves) {
    let value = 0;
    let amplitude = 0.5;
    let frequency = 1;
    for (let i = 0; i < octaves; i++) {
        value     += amplitude * _smoothNoise(x * frequency, y * frequency);
        amplitude *= 0.5;
        frequency *= 2;
    }
    return value;
}

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

/**
 * Resolve any color expression (CSS var, hex, rgb, rgba, named) to {r,g,b,a}.
 *
 * Expands `var(--token)` via ColorUtils.resolveCssVariable, then parses the
 * concrete value with color-syntax parseColor().  Returns the fallback color on
 * any parse failure.
 *
 * Used by pixel-level effects (Fluid, Plasma) that write raw RGBA bytes into
 * ImageData — these effects cannot use fillStyle strings and need a numeric
 * {r, g, b, a} representation.
 *
 * @param {string} str           - Color value (any CSS format or var(--x))
 * @param {string} defaultColor  - Fallback rgba string if resolution fails
 * @returns {{ r: number, g: number, b: number, a: number }}
 */
export function parseColorToRgba(str, defaultColor) {
    const toRgba = (value) => {
        const parsed = parseColor(value);
        if (parsed) return parsed;
        // Colours only the browser can normalise (lab(), color(), concrete color-mix())
        const rgb = /** @type {any} */ (ColorUtils)._parseColor(value);
        return rgb ? { r: rgb[0], g: rgb[1], b: rgb[2], a: 1 } : null;
    };
    const resolved = ColorUtils.resolveCssVariable(str ?? defaultColor, defaultColor);
    return toRgba(resolved) ?? toRgba(defaultColor) ?? { r: 0, g: 0, b: 0, a: 1 };
}
