/**
 * @fileoverview ContourFieldEffect - Banded fBm noise field (topographic "contour map" look)
 *
 * Samples the shared fBm value-noise helper (noise-helpers.js, also used by
 * PlasmaTextureEffect/FluidTextureEffect) and quantizes the result into a small
 * number of discrete colour bands, producing a stepped topographic-contour
 * appearance rather than a smooth gradient/cloud blend.
 *
 * Renders into a downsampled offscreen ImageData buffer (one sample per
 * `cellSize` px) which is then scaled up via drawImage — the same
 * offscreen-buffer technique PlasmaTextureEffect uses, sized down further so
 * per-pixel banding stays well within frame budget.
 *
 * @module core/packs/backgrounds/effects/ContourFieldEffect
 */

import { BaseEffect } from './BaseEffect.js';
import { _fbm, parseColorToRgba } from '../../textures/effects/noise-helpers.js';
import { lcardsLog } from '../../../../utils/lcards-logging.js';

/**
 * ContourFieldEffect - Topographic-style banded noise field
 *
 * @extends BaseEffect
 */
export class ContourFieldEffect extends BaseEffect {
  /**
   * @param {object} [config={}]
   * @param {number} [config.seed=1] - Random seed (offsets the sample space so different seeds don't repeat the same field)
   * @param {number} [config.noiseScale=0.01] - Noise frequency (smaller = larger features)
   * @param {number} [config.numOctaves=4] - fBm octave count
   * @param {number} [config.numBands=8] - Number of discrete colour bands (low = strong contour banding, high = smooth gradient)
   * @param {number} [config.cellSize=3] - Sample tile size in px (perf/quality knob, like FluidTextureEffect's CELL)
   * @param {number} [config.scrollSpeedX=3] - Horizontal drift speed (px/s)
   * @param {number} [config.scrollSpeedY=3] - Vertical drift speed (px/s)
   * @param {string|Array<string>} [config.colors] - Gradient colour stops across the FULL
   *   elevation range (peaks and valleys alike) — the "land" contour rings.
   * @param {string} [config.color] - Alias for colors (single colour string)
   * @param {boolean} [config.blendColors=true] - true = smoothly blend colour AND opacity
   *   between adjacent bands, and at the fill edge (soft gradient look). false = snap each
   *   band to its nearest colour stop with flat, uniform opacity, and a hard cutoff at the
   *   fill edge — no blending anywhere (matches the reference site's hard-cutoff alpha tiers
   *   and real topographic contour lines, which are inherently discrete).
   * @param {number} [config.fillLevel=0] - 0-0.95. Elevation threshold below which pixels are
   *   "underwater" and rendered as `fillColor` instead of their land-band colour, regardless of
   *   how `colors`/`numBands` are configured — like draining/flooding a fixed terrain rather
   *   than rescaling the colour ramp. 0 = no water, full terrain visible.
   * @param {string} [config.fillColor] - Colour used below `fillLevel`, composited OVER the
   *   land colour at each pixel (so a translucent fillColor tints the terrain it covers,
   *   rather than exposing whatever is behind the whole canvas). Omit (default) for literal
   *   transparency instead, revealing whatever is behind the canvas as empty "space".
   */
  constructor(config = {}) {
    super(/** @type {any} */ (config));

    this.seed = config.seed ?? 1;
    this.noiseScale = config.noiseScale ?? 0.01;
    this.numOctaves = Math.max(1, Math.min(8, config.numOctaves ?? 4));
    this.numBands = Math.max(2, Math.min(64, config.numBands ?? 8));
    this.cellSize = Math.max(1, Math.min(16, config.cellSize ?? 3));
    this.scrollSpeedX = config.scrollSpeedX ?? 3;
    this.scrollSpeedY = config.scrollSpeedY ?? 3;
    this.fillLevel = Math.max(0, Math.min(0.95, config.fillLevel ?? 0));
    this.blendColors = config.blendColors ?? true;

    const DEFAULT_COLORS = ['#1a0033', '#4b0082', '#8a2be2', '#da70d6'];
    const colorInput = (config.colors && config.colors.length) ? config.colors : (config.color ? [config.color] : DEFAULT_COLORS);
    const colors = Array.isArray(colorInput) ? colorInput : [colorInput];

    // Two-step colour resolution for Canvas2D: theme token resolver, then CSS-var/format parsing
    const resolver = window.lcards?.core?.themeManager?.resolver;
    const resolveColor = (c) => (resolver ? resolver.resolve(c, c) : c);
    this._stops = colors.map((c) => parseColorToRgba(resolveColor(c), c));
    if (this._stops.length === 1) this._stops.push(this._stops[0]);

    // null = literal transparency below fillLevel (default); set only when the
    // user explicitly configures a fillColor, so we never coerce an unparseable
    // value (e.g. the CSS keyword 'transparent', which parseColorToRgba can't
    // read) into opaque black.
    this._fillColor = config.fillColor ? parseColorToRgba(resolveColor(config.fillColor), config.fillColor) : null;

    // Seed a starting sample offset (the shared _fbm hash itself isn't seeded)
    let s = (this.seed >>> 0) || 1;
    const rng = () => {
      s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    this._scrollOffsetX = rng() * 10000;
    this._scrollOffsetY = rng() * 10000;

    lcardsLog.debug('[ContourFieldEffect] Created', {
      seed: this.seed,
      numBands: this.numBands,
      cellSize: this.cellSize,
      colorCount: this._stops.length
    });
  }

  update(deltaTime, canvasWidth, canvasHeight) {
    super.update(deltaTime, canvasWidth, canvasHeight);
    const dt = deltaTime / 1000;
    this._scrollOffsetX += this.scrollSpeedX * dt;
    this._scrollOffsetY += this.scrollSpeedY * dt;
  }

  /**
   * Ensure the offscreen canvas/ImageData buffer matches the current (downsampled) size.
   * @private
   */
  _ensureBuffer(bw, bh) {
    if (this._bufW === bw && this._bufH === bh) return;
    this._bufW = bw;
    this._bufH = bh;
    this._offCanvas = document.createElement('canvas');
    this._offCanvas.width = bw;
    this._offCanvas.height = bh;
    this._offCtx = this._offCanvas.getContext('2d');
    this._imgData = this._offCtx.createImageData(bw, bh);
  }

  /**
   * Resolve the configured colour stops at a quantized band position — either
   * smoothly blended between adjacent stops, or snapped to the nearest stop
   * with no blending (flat solid bands).
   * @private
   * @param {number} bandValue - 0-1, already quantized to a discrete band
   */
  _colorAtBand(bandValue) {
    const stops = this._stops;
    const p = bandValue * (stops.length - 1);

    if (!this.blendColors) {
      const idx = Math.max(0, Math.min(stops.length - 1, Math.round(p)));
      return stops[idx];
    }

    const idx = Math.min(stops.length - 2, Math.floor(p));
    const frac = p - idx;
    const a = stops[idx];
    const b = stops[idx + 1];
    return {
      r: a.r + (b.r - a.r) * frac,
      g: a.g + (b.g - a.g) * frac,
      b: a.b + (b.b - a.b) * frac,
      a: a.a + (b.a - a.a) * frac
    };
  }

  draw(ctx, canvasWidth, canvasHeight) {
    const w = canvasWidth | 0;
    const h = canvasHeight | 0;
    if (w < 1 || h < 1) return;

    const cell = this.cellSize;
    const bw = Math.max(1, Math.ceil(w / cell));
    const bh = Math.max(1, Math.ceil(h / cell));
    this._ensureBuffer(bw, bh);

    const data = this._imgData.data;
    const freq = this.noiseScale * cell; // sample step in buffer-cell space, scaled to pixel-equivalent frequency
    const ox = -this._scrollOffsetX * this.noiseScale;
    const oy = -this._scrollOffsetY * this.noiseScale;
    const bands = this.numBands;
    const octaves = this.numOctaves;
    const fillLevel = this.fillLevel;
    const fillColor = this._fillColor;
    const bandWidth = 1 / bands;
    const baseAlpha = this.opacity * ctx.globalAlpha;

    for (let cy = 0; cy < bh; cy++) {
      const noiseY = cy * freq + oy;
      for (let cx = 0; cx < bw; cx++) {
        const raw = _fbm(cx * freq + ox, noiseY, octaves);
        // _fbm's actual output range exceeds the nominal [-1,1] (observed ~[-1.7, 1.8]
        // since _hash() itself isn't bounded to [-1,1]), so clamp after normalizing
        // or band indices can go negative/overflow and index outside `stops`.
        const n = Math.min(1, Math.max(0, (raw + 1) * 0.5));
        const bandIdx = Math.max(0, Math.min(bands - 1, Math.floor(n * bands)));
        const bandValue = bandIdx / (bands - 1);
        const land = this._colorAtBand(bandValue);

        // Fill level: a fixed waterline over the SAME full-range terrain (not a
        // rescale of it) — raising/lowering fillLevel floods/drains bands without
        // touching the colour ramp. blendColors controls whether the shoreline is
        // a soft blend (over one band's width, matching the band-to-band blend
        // scale above) or a hard cutoff at the exact threshold — same rationale as
        // the inter-band blending: hard contour lines are inherently discrete.
        let r, g, b, a;
        if (fillLevel <= 0) {
          r = land.r; g = land.g; b = land.b; a = land.a;
        } else {
          const t = this.blendColors
            ? Math.max(0, Math.min(1, (n - fillLevel) / bandWidth))
            : (n >= fillLevel ? 1 : 0);

          // "Underwater" colour: fillColor composited OVER the land colour at this
          // pixel (water tints the terrain it covers), not over whatever's behind
          // the whole canvas — otherwise a translucent fillColor would reveal the
          // card/page background instead of the terrain it's supposed to be
          // flooding, and read as solid black on a typical dark LCARS background.
          // Final alpha stays at the land's own opacity: the terrain is still
          // "there", just tinted, so water never makes a pixel more transparent
          // than the land underneath it. No fillColor = literal transparency
          // (alpha → 0), the one case where the canvas-behind should show through.
          const underR = fillColor ? fillColor.r * fillColor.a + land.r * (1 - fillColor.a) : land.r;
          const underG = fillColor ? fillColor.g * fillColor.a + land.g * (1 - fillColor.a) : land.g;
          const underB = fillColor ? fillColor.b * fillColor.a + land.b * (1 - fillColor.a) : land.b;
          const underA = fillColor ? land.a : 0;

          r = underR + (land.r - underR) * t;
          g = underG + (land.g - underG) * t;
          b = underB + (land.b - underB) * t;
          a = underA + (land.a - underA) * t;
        }

        const i = (cy * bw + cx) << 2;
        data[i    ] = (r + 0.5) | 0;
        data[i + 1] = (g + 0.5) | 0;
        data[i + 2] = (b + 0.5) | 0;
        data[i + 3] = (a * baseAlpha * 255 + 0.5) | 0;
      }
    }

    this._offCtx.putImageData(this._imgData, 0, 0);
    ctx.drawImage(this._offCanvas, 0, 0, bw, bh, 0, 0, w, h);
  }

  updateConfig(cfg) {
    if (cfg.noiseScale    !== undefined) this.noiseScale = cfg.noiseScale;
    if (cfg.numOctaves    !== undefined) this.numOctaves = cfg.numOctaves;
    if (cfg.numBands      !== undefined) this.numBands = Math.max(2, Math.min(64, cfg.numBands));
    if (cfg.cellSize      !== undefined) this.cellSize = Math.max(1, Math.min(16, cfg.cellSize));
    if (cfg.scrollSpeedX  !== undefined) this.scrollSpeedX = cfg.scrollSpeedX;
    if (cfg.scrollSpeedY  !== undefined) this.scrollSpeedY = cfg.scrollSpeedY;
    if (cfg.opacity       !== undefined) this.opacity = cfg.opacity;
    if (cfg.fillLevel     !== undefined) this.fillLevel = Math.max(0, Math.min(0.95, cfg.fillLevel));
    if (cfg.blendColors   !== undefined) this.blendColors = cfg.blendColors;
  }

  destroy() {
    this._offCanvas = null;
    this._offCtx = null;
    this._imgData = null;
    super.destroy();
  }
}
