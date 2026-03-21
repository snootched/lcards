/**
 * @fileoverview noise-helpers - Shared fBm value-noise and color utilities
 *
 * Used by FluidTextureEffect and PlasmaTextureEffect (and any future pixel-level
 * texture effects that need per-pixel noise and RGBA math).
 *
 * @module core/packs/textures/effects/noise-helpers
 */

import { ColorUtils } from '../../../themes/ColorUtils.js';

// ---------------------------------------------------------------------------
// fBm value-noise (hash-based, no look-up table required)
// ---------------------------------------------------------------------------

/** Pseudo-random hash in [−1, 1] for integer lattice point (ix, iy). */
export function _hash(ix, iy) {
    return (Math.sin(ix * 127.1 + iy * 311.7) * 43758.5453) % 1 * 2;
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

/** fBm: sum of `octaves` octaves of smoothNoise, output in [−1, 1]. */
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
 * concrete value with ColorUtils._parseColor.  Returns the fallback color on
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
    const resolved = ColorUtils.resolveCssVariable(str ?? defaultColor, defaultColor);
    const rgb = /** @type {any} */ (ColorUtils)._parseColor(resolved);
    if (!rgb) {
        // Parse the default directly so callers don't need a separate fallback value
        const defRgb = /** @type {any} */ (ColorUtils)._parseColor(defaultColor);
        if (defRgb) {
            const am = defaultColor.match(/rgba?\([^,]+,[^,]+,[^,]+,\s*([\d.]+)/);
            return { r: defRgb[0], g: defRgb[1], b: defRgb[2], a: am ? +am[1] : 1 };
        }
        return { r: 0, g: 0, b: 0, a: 1 };
    }
    const am = resolved.match(/rgba?\([^,]+,[^,]+,[^,]+,\s*([\d.]+)/);
    return { r: rgb[0], g: rgb[1], b: rgb[2], a: am ? +am[1] : 1 };
}
