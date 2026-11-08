/**
 * @fileoverview PulseTextureEffect - Canvas breathing radial glow
 *
 * A radial glow centred on the shape that shrinks and fades, then grows back,
 * in a loop: an attention or alert indicator. (The Canvas2D form of the SVG
 * `pulse` texture the Canvas2D migration dropped.)
 *
 * @module core/packs/textures/effects/PulseTextureEffect
 */

import { BaseTextureEffect } from './BaseTextureEffect.js';
import { configProp } from '../../backgrounds/effects/animatable-props.js';
import { parseColorToRgba } from './noise-helpers.js';
import { resolveColor } from '../../../themes/resolve-color.js';

const DEFAULT_COLOR = 'rgba(255,80,0,0.8)';

/** @param {number} v @param {number} lo @param {number} hi */
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/**
 * The glow's size and strength at a point in its cycle.
 * @param {number} cycles - Cycles elapsed (any real number; whole numbers are full size)
 * @param {number} minSize - Smallest radius as a fraction of the largest (0-0.99)
 * @returns {{ size: number, alpha: number }} size: fraction of the largest radius; alpha: 0.3-1
 */
export function pulseAt(cycles, minSize) {
    const k = (1 + Math.cos(cycles * 2 * Math.PI)) / 2; // 1 at the start of a cycle, 0 halfway
    return { size: minSize + (1 - minSize) * k, alpha: 0.3 + 0.7 * k };
}

/**
 * PulseTextureEffect - Breathing radial glow
 *
 * @extends BaseTextureEffect
 */
export class PulseTextureEffect extends BaseTextureEffect {
    static animatableProps = {
        ...BaseTextureEffect.animatableProps,
        radius: configProp('radius', '_radius'),
        min_size: configProp('min_size', '_minSize'),
    };

    /**
     * @param {object} config
     * @param {string} [config.color='rgba(255,80,0,0.8)'] - Glow colour
     * @param {number} [config.speed=1.2]   - Pulses per second
     * @param {number} [config.radius=0.7]  - Largest radius as a fraction of half the shape's diagonal (0.1-1)
     * @param {number} [config.min_size=0.15] - Smallest radius as a fraction of the largest (0-0.99)
     * @param {number} [config.opacity=1]   - Opacity (0-1)
     */
    constructor(config = {}) {
        super(/** @type {any} */ (config));
        this._setColor(config.color);
        this._radius  = clamp(config.radius ?? 0.7, 0.1, 1);
        this._minSize = clamp(config.min_size ?? 0.15, 0, 0.99);
    }

    /** @param {any} color */
    _setColor(color) {
        const concrete = resolveColor(color ?? DEFAULT_COLOR, { concrete: true, fallback: DEFAULT_COLOR });
        this._color = concrete;
        const { r, g, b } = parseColorToRgba(concrete, DEFAULT_COLOR);
        this._clear = `rgba(${r},${g},${b},0)`;
    }

    _draw(ctx, w, h) {
        // _elapsedTime is in ms scaled by `speed` (pulses per second)
        const { size, alpha } = pulseAt(this._elapsedTime / 1000, this._minSize);
        const r = (Math.sqrt(w * w + h * h) / 2) * this._radius * size;
        if (!(r > 0.5)) return;
        const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, r);
        grad.addColorStop(0, this._color);
        grad.addColorStop(1, this._clear);
        ctx.globalAlpha *= alpha;
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
    }

    updateConfig(cfg) {
        super.updateConfig(cfg);
        if (cfg.color    !== undefined) this._setColor(cfg.color);
        if (cfg.radius   !== undefined) this._radius  = clamp(cfg.radius, 0.1, 1);
        if (cfg.min_size !== undefined) this._minSize = clamp(cfg.min_size, 0, 0.99);
    }
}
