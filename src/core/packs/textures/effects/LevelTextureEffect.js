/**
 * @fileoverview LevelTextureEffect - Animated fill-bar level indicator
 *
 * Draws a filled region representing a percentage of the shape, with an
 * animated wavy edge, optional two-colour gradient fill, and optional
 * sloshing physics that makes the fluid appear to rock in a vessel.
 *
 * @module core/packs/textures/effects/LevelTextureEffect
 */

import { BaseTextureEffect } from './BaseTextureEffect.js';
import { parseColorToRgba } from './noise-helpers.js';

function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

/**
 * LevelTextureEffect - Animated fluid level indicator with physics
 *
 * @extends BaseTextureEffect
 *
 * Config reference:
 *
 *  Color
 *    color              {string}  Single fill colour (alias for color_a; backwards-compatible)
 *    color_a            {string}  Primary fill colour (bottom/left of gradient)
 *    color_b            {string}  Secondary colour (top/right); enables gradient when set
 *    gradient_crossover {number}  0–100 (default 80) — % of fill height that stays color_a
 *
 *  Fill geometry
 *    fill_pct     {number}  0–100 (default 50)
 *    direction    {string}  'up' | 'right' (default 'up')
 *
 *  Edge glow
 *    edge_glow        {boolean} Enable glow at fill edge (default true)
 *    edge_glow_color  {string}  Glow colour (default 'rgba(255,255,255,0.7)')
 *    edge_glow_width  {number}  Glow spread radius in px — controls multi-pass bloom width (default 6)
 *
 *  Primary wave
 *    wave_height  {number}  Amplitude in px (default 4; 0 = flat)
 *    wave_count   {number}  Sine cycles across width (default 4)
 *    wave_speed   {number}  Phase rate in deg/s (default 20; negative = reverse)
 *
 *  Secondary wave — overlaid on primary for organic multi-harmonic surface
 *    wave2_height {number}  Amplitude of 2nd wave in px (default 0 = disabled)
 *    wave2_count  {number}  Cycle count of 2nd wave (default wave_count + 1)
 *    wave2_speed  {number}  Phase rate in deg/s (default -15)
 *
 *  Sloshing — makes fluid rock back and forth as if in a vessel
 *    slosh_amount {number}  0–1 tilt intensity (default 0 = disabled)
 *    slosh_period {number}  Seconds per slosh cycle (default 3)
 */
export class LevelTextureEffect extends BaseTextureEffect {

    constructor(config = {}) {
        super(config);

        // ── Color ──────────────────────────────────────────────────────────────
        this._colorA    = config.color_a ?? config.color ?? 'rgba(0,200,100,0.7)';
        this._colorB    = config.color_b ?? null;   // null = no gradient
        this._crossover = clamp(config.gradient_crossover ?? 80, 0, 100);

        // ── Fill ───────────────────────────────────────────────────────────────
        this._fillPct   = clamp(config.fill_pct  ?? 50, 0, 100);
        this._direction = config.direction ?? 'up';

        // ── Edge glow ──────────────────────────────────────────────────────────
        this._edgeGlow      = config.edge_glow ?? true;
        this._edgeGlowColor = config.edge_glow_color ?? 'rgba(255,255,255,0.7)';
        this._edgeGlowWidth = config.edge_glow_width ?? 6;

        // ── Primary wave ───────────────────────────────────────────────────────
        this._waveHeight = config.wave_height ?? 4;
        this._waveCount  = config.wave_count  ?? 4;
        this._waveSpeed  = config.wave_speed  ?? 20;
        this._waveOffset = 0;

        // ── Secondary wave ─────────────────────────────────────────────────────
        this._wave2Height = config.wave2_height ?? 0;
        this._wave2Count  = config.wave2_count  ?? (this._waveCount + 1);
        this._wave2Speed  = config.wave2_speed  ?? -15;
        this._wave2Offset = 0;

        // ── Sloshing ───────────────────────────────────────────────────────────
        this._sloshAmount = clamp(config.slosh_amount ?? 0, 0, 1);
        this._sloshPeriod = Math.max(0.5, config.slosh_period ?? 3);
        this._sloshPhase  = 0;
        this._sloshTilt   = 0;   // computed tilt in px, updated each frame
    }

    // ── Per-frame update ───────────────────────────────────────────────────────

    update(dt, w, h) {
        super.update(dt, w, h);
        const dt_s = dt / 1000;
        const s    = this.speed;

        this._waveOffset  += this._waveSpeed  * s * dt_s * (Math.PI / 180);
        this._wave2Offset += this._wave2Speed * s * dt_s * (Math.PI / 180);
        this._sloshPhase  += (2 * Math.PI / this._sloshPeriod) * s * dt_s;

        // Tilt: swing ± wave_height×4 across the full button width.
        // The 4× multiplier lets slosh_amount=0.5 produce clearly visible rocking
        // without requiring extreme wave_height values.
        this._sloshTilt = this._waveHeight * 4 * this._sloshAmount * Math.sin(this._sloshPhase);
    }

    // ── Wave surface ───────────────────────────────────────────────────────────

    /**
     * Composite surface deviation (px) at position `x` along the fill axis.
     * Positive = downward / inward (deeper into the fill region).
     *
     * Combines:
     *  - Primary sine wave
     *  - Optional secondary sine wave (different frequency / speed)
     *  - Sloshing tilt  (left side higher when sloshTilt > 0, right side lower)
     *
     * @param {number} x     Position along the axis (0 → span)
     * @param {number} span  Length of the axis (canvas width for 'up', height for 'right')
     * @returns {number}
     */
    _surfaceY(x, span) {
        const freq1 = (Math.PI * 2 * this._waveCount) / span;
        const y1    = this._waveHeight * Math.sin(freq1 * x + this._waveOffset);

        const y2 = this._wave2Height > 0
            ? this._wave2Height * Math.sin(
                (Math.PI * 2 * this._wave2Count / span) * x + this._wave2Offset)
            : 0;

        // Tilt: x=0 gets +tilt/2 (higher fill), x=span gets −tilt/2 (lower fill).
        const tilt = this._sloshTilt * (0.5 - x / span);

        return y1 + y2 + tilt;
    }

    // ── Fill style ─────────────────────────────────────────────────────────────

    /**
     * Return a fillStyle — plain colour string or a Canvas2D linear gradient.
     *
     * The gradient axis runs from the leading edge (wave top / wave right) to
     * the fill base (bottom / left).  color_b sits at the leading edge;
     * color_a fills the bulk, starting at the gradient_crossover point.
     *
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x0  Leading-edge gradient x
     * @param {number} y0  Leading-edge gradient y
     * @param {number} x1  Fill-base gradient x
     * @param {number} y1  Fill-base gradient y
     */
    _makeFillStyle(ctx, x0, y0, x1, y1) {
        if (!this._colorB) return this._colorA;

        const grad       = ctx.createLinearGradient(x0, y0, x1, y1);
        const blendStart = clamp(this._crossover / 100, 0, 1);
        // 0..blendStart = color_b (leading edge tint)
        // blendStart..1 = color_a (bulk fill)
        grad.addColorStop(0,          this._colorB);
        grad.addColorStop(1 - blendStart, this._colorB);
        grad.addColorStop(1,          this._colorA);
        return grad;
    }

    // ── Draw ───────────────────────────────────────────────────────────────────

    _draw(ctx, w, h) {
        const pct = clamp(this._fillPct, 0, 100) / 100;
        if (this._direction === 'right') {
            this._drawHorizontal(ctx, w, h, pct);
        } else {
            this._drawVertical(ctx, w, h, pct);
        }
    }

    /** Fill from bottom upward. */
    _drawVertical(ctx, w, h, pct) {
        const fillH  = h * pct;
        const fillY  = h - fillH;
        if (fillH <= 0) return;

        const steps    = Math.max(32, w | 0);
        const hasWave  = this._waveHeight > 0 || this._wave2Height > 0
                      || Math.abs(this._sloshTilt) > 0.1;

        // ── Fill path ──────────────────────────────────────────────────────────
        ctx.beginPath();
        if (hasWave && fillH < h) {
            ctx.moveTo(0, h);
            ctx.lineTo(0, fillY + this._surfaceY(0, w));
            for (let i = 1; i <= steps; i++) {
                const x = (i / steps) * w;
                ctx.lineTo(x, fillY + this._surfaceY(x, w));
            }
            ctx.lineTo(w, h);
        } else {
            ctx.rect(0, fillY, w, fillH);
        }
        ctx.closePath();

        // Gradient: top of fill (fillY) → base (h)
        ctx.fillStyle = this._makeFillStyle(ctx, 0, fillY, 0, h);
        ctx.fill();

        // ── Edge glow ──────────────────────────────────────────────────────────
        if (this._edgeGlow && fillH < h) {
            if (hasWave) {
                this._strokeWave(ctx, w, (x) => fillY + this._surfaceY(x, w), steps);
            } else {
                this._strokeFlatLine(ctx, 0, fillY, w, fillY);
            }
        }
    }

    /** Fill from left rightward. */
    _drawHorizontal(ctx, w, h, pct) {
        const fillW   = w * pct;
        if (fillW <= 0) return;

        const steps   = Math.max(32, h | 0);
        const hasWave = this._waveHeight > 0 || this._wave2Height > 0
                     || Math.abs(this._sloshTilt) > 0.1;

        // ── Fill path ──────────────────────────────────────────────────────────
        ctx.beginPath();
        if (hasWave && fillW < w) {
            ctx.moveTo(0, 0);
            ctx.lineTo(fillW + this._surfaceY(0, h), 0);
            for (let i = 1; i <= steps; i++) {
                const y = (i / steps) * h;
                ctx.lineTo(fillW + this._surfaceY(y, h), y);
            }
            ctx.lineTo(0, h);
        } else {
            ctx.rect(0, 0, fillW, h);
        }
        ctx.closePath();

        // Gradient: leading edge (fillW) → base (x=0)
        ctx.fillStyle = this._makeFillStyle(ctx, fillW, 0, 0, 0);
        ctx.fill();

        // ── Edge glow ──────────────────────────────────────────────────────────
        if (this._edgeGlow && fillW < w) {
            if (hasWave) {
                this._strokeWave(ctx, h, (y) => fillW + this._surfaceY(y, h), steps, true);
            } else {
                this._strokeFlatLine(ctx, fillW, 0, fillW, h);
            }
        }
    }

    // ── Edge glow helpers ──────────────────────────────────────────────────────

    /**
     * Stroke a glow line that follows the animated wave path exactly.
     * Canvas2D shadowBlur is used so the glow radiates in all directions
     * from the wave curve rather than being a flat horizontal band.
     *
     * @param {CanvasRenderingContext2D} ctx
     * @param {number}   span     Axis length (w or h)
     * @param {function} waveFn   (pos) → canvas coordinate at that axis position
     * @param {number}   steps    Path resolution
     * @param {boolean}  [horiz]  true = horizontal fill direction (x/y swapped)
     */
    /**
     * Stroke a multi-pass glow line that follows the animated wave path.
     *
     * Canvas2D shadowBlur is silently ignored when ctx.filter is anything other
     * than 'none' (a known Chrome quirk that affects the rendering pipeline used
     * here).  Instead we build the path once as a Path2D and stroke it 4 times
     * with decreasing lineWidth and increasing alpha, topped by a sharp 1.5px
     * centre line — producing a reliable bloom effect in all browsers.
     */
    _strokeWave(ctx, span, waveFn, steps, horiz = false) {
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.lineCap  = 'round';
        ctx.lineJoin = 'round';

        // Build path once as Path2D so it can be stroked multiple times cheaply.
        const path = new Path2D();
        if (horiz) {
            path.moveTo(waveFn(0), 0);
            for (let i = 1; i <= steps; i++) {
                const pos = (i / steps) * span;
                path.lineTo(waveFn(pos), pos);
            }
        } else {
            path.moveTo(0, waveFn(0));
            for (let i = 1; i <= steps; i++) {
                const pos = (i / steps) * span;
                path.lineTo(pos, waveFn(pos));
            }
        }

        this._strokeGlowPath(ctx, path);
        ctx.restore();
    }

    /** Stroke a multi-pass glow line on a straight fill edge. */
    _strokeFlatLine(ctx, x0, y0, x1, y1) {
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.lineCap  = 'round';

        const path = new Path2D();
        path.moveTo(x0, y0);
        path.lineTo(x1, y1);

        this._strokeGlowPath(ctx, path);
        ctx.restore();
    }

    /**
     * Multi-pass glow stroke on a pre-built Path2D.
     * Draws 4 passes from widest+faintest to narrowest+brightest, then the
     * sharp centre line on top.  No shadowBlur — works regardless of ctx.filter.
     * @param {CanvasRenderingContext2D} ctx
     * @param {Path2D} path
     * @private
     */
    _strokeGlowPath(ctx, path) {
        const gc = parseColorToRgba(this._edgeGlowColor, { r: 255, g: 255, b: 255, a: 0.7 });
        const w  = this._edgeGlowWidth;

        // Passes: [widthMultiplier, alphaFraction] — outer→inner
        const passes = [
            [ w * 2.2, 0.12 ],
            [ w * 1.4, 0.25 ],
            [ w * 0.8, 0.45 ],
            [ w * 0.35, 0.70 ],
        ];
        for (const [lw, af] of passes) {
            ctx.lineWidth   = Math.max(1, lw);
            ctx.strokeStyle = `rgba(${gc.r},${gc.g},${gc.b},${(gc.a * af).toFixed(3)})`;
            ctx.stroke(path);
        }

        // Sharp centre line at full glow colour
        ctx.lineWidth   = 1.5;
        ctx.strokeStyle = this._edgeGlowColor;
        ctx.stroke(path);
    }

    // ── Config hot-update ──────────────────────────────────────────────────────

    updateConfig(cfg) {
        super.updateConfig(cfg);

        // Color
        if (cfg.color              !== undefined) this._colorA    = cfg.color;
        if (cfg.color_a            !== undefined) this._colorA    = cfg.color_a;
        if (cfg.color_b            !== undefined) this._colorB    = cfg.color_b;
        if (cfg.gradient_crossover !== undefined) this._crossover = clamp(cfg.gradient_crossover, 0, 100);

        // Fill
        if (cfg.fill_pct  !== undefined) this._fillPct   = clamp(cfg.fill_pct, 0, 100);
        if (cfg.direction !== undefined) this._direction = cfg.direction;

        // Edge glow
        if (cfg.edge_glow       !== undefined) this._edgeGlow      = cfg.edge_glow;
        if (cfg.edge_glow_color !== undefined) this._edgeGlowColor = cfg.edge_glow_color;
        if (cfg.edge_glow_width !== undefined) this._edgeGlowWidth = cfg.edge_glow_width;

        // Primary wave
        if (cfg.wave_height !== undefined) this._waveHeight = cfg.wave_height;
        if (cfg.wave_count  !== undefined) this._waveCount  = cfg.wave_count;
        if (cfg.wave_speed  !== undefined) this._waveSpeed  = cfg.wave_speed;

        // Secondary wave
        if (cfg.wave2_height !== undefined) this._wave2Height = cfg.wave2_height;
        if (cfg.wave2_count  !== undefined) this._wave2Count  = cfg.wave2_count;
        if (cfg.wave2_speed  !== undefined) this._wave2Speed  = cfg.wave2_speed;

        // Sloshing
        if (cfg.slosh_amount !== undefined) this._sloshAmount = clamp(cfg.slosh_amount, 0, 1);
        if (cfg.slosh_period !== undefined) this._sloshPeriod = Math.max(0.5, cfg.slosh_period);
    }
}
