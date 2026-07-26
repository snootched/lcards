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
   * Padding (in buffer-cell units) added around the visible canvas in the
   * cached bake buffer. The field is static-and-panning, not continuously
   * changing: steady-state panning is handled by _topUpBake() (shift the
   * cache + fill in only the newly exposed sliver, cost proportional to how
   * far the field moved that frame), so this margin only needs to absorb one
   * frame's worth of shift plus slack for an occasional slow frame — NOT a
   * whole "how long between full rebakes" window, since full rebakes are now
   * just the rare fallback for an abnormally large single-frame jump (e.g. the
   * tab was backgrounded and just resumed with a huge deltaTime). 32 cells is
   * generous even at unusually fast configured scroll speeds (tens of px/s).
   */
  static BAKE_PAD_CELLS = 32;

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

    // Reusable scratch object for _colorAtBand()'s blend path — avoids a
    // heap allocation per sampled cell (hundreds of thousands per bake at
    // cell_size:1); safe because the caller only reads it synchronously
    // within the same loop iteration it's produced in.
    this._landScratch = { r: 0, g: 0, b: 0, a: 0 };
    // Second scratch object for _sampleColorAt()'s composited output — kept
    // separate from _landScratch since a single call reads both at once.
    this._pixelScratch = { r: 0, g: 0, b: 0, a: 0 };

    // Bake-buffer state: the noise field is rendered once into an offscreen
    // canvas padded BAKE_PAD_CELLS beyond the viewport, then panned via cheap
    // drawImage() blits in draw(). See _bake()/draw() below.
    this._bakeDirty = true;      // forces a bake on the first draw()
    this._visibleCellW = 0;      // last-seen canvas size (cells) — detects resize
    this._visibleCellH = 0;
    this._bakeOriginPanX = 0;    // pan (cells) at the time of the last bake
    this._bakeOriginPanY = 0;

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
    const out = this._landScratch;
    out.r = a.r + (b.r - a.r) * frac;
    out.g = a.g + (b.g - a.g) * frac;
    out.b = a.b + (b.b - a.b) * frac;
    out.a = a.a + (b.a - a.a) * frac;
    return out;
  }

  /**
   * Compute the final (banded + fill-level composited) colour at an absolute
   * sample-space coordinate, writing into a shared scratch object to avoid a
   * per-pixel allocation. Shared by _fillRegion() so a full bake and an
   * incremental top-up strip (see _topUpBake()) always agree bit-for-bit at
   * any given world coordinate.
   * @private
   */
  _sampleColorAt(sampleX, sampleY) {
    const octaves = this.numOctaves;
    const bands = this.numBands;
    const fillLevel = this.fillLevel;
    const fillColor = this._fillColor;
    const bandWidth = 1 / bands;

    const raw = _fbm(sampleX, sampleY, octaves);
    // _fbm's actual output range exceeds the nominal [-1,1] (observed ~[-1.7, 1.8]
    // since _hash() itself isn't bounded to [-1,1]), so clamp after normalizing
    // or band indices can go negative/overflow and index outside `stops`.
    const n = Math.min(1, Math.max(0, (raw + 1) * 0.5));
    const bandIdx = Math.max(0, Math.min(bands - 1, Math.floor(n * bands)));
    const bandValue = bandIdx / (bands - 1);
    const land = this._colorAtBand(bandValue);

    const out = this._pixelScratch;
    // Fill level: a fixed waterline over the SAME full-range terrain (not a
    // rescale of it) — raising/lowering fillLevel floods/drains bands without
    // touching the colour ramp. blendColors controls whether the shoreline is
    // a soft blend (over one band's width, matching the band-to-band blend
    // scale above) or a hard cutoff at the exact threshold — same rationale as
    // the inter-band blending: hard contour lines are inherently discrete.
    if (fillLevel <= 0) {
      out.r = land.r; out.g = land.g; out.b = land.b; out.a = land.a;
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

      out.r = underR + (land.r - underR) * t;
      out.g = underG + (land.g - underG) * t;
      out.b = underB + (land.b - underB) * t;
      out.a = underA + (land.a - underA) * t;
    }
    return out;
  }

  /**
   * Fill a `w x h` rectangle of `imgData` (which may be the full bake buffer
   * or a small incremental strip — see _bake()/_topUpBake()) whose top-left
   * corner sits at bake-buffer coordinate `(destX, destY)`. Every pixel is
   * sampled from its absolute world-cell coordinate —
   * `(destX + lx - PAD) - originPanX` — which is exactly the coordinate the
   * original (pre-bake) per-frame code would have used for that same world
   * position. Because that's a pure function of the world coordinate alone,
   * filling the same world position at a different time (a fresh full bake,
   * or a top-up strip) reproduces bit-identical values: there's no seam to
   * hide, since nothing is tiled/cut/rejoined — it's the same infinite
   * continuous field, just sampled where/when needed. This is what makes
   * panning seamless across both a full rebake and a top-up (see draw()).
   * @private
   */
  _fillRegion(imgData, destX, destY, w, h, originPanX, originPanY) {
    const PAD = ContourFieldEffect.BAKE_PAD_CELLS;
    const freq = this.noiseScale * this.cellSize;
    const data = imgData.data;

    for (let ly = 0; ly < h; ly++) {
      const worldY = ((destY + ly - PAD) - originPanY) * freq;
      for (let lx = 0; lx < w; lx++) {
        const worldX = ((destX + lx - PAD) - originPanX) * freq;
        const c = this._sampleColorAt(worldX, worldY);

        // Opacity/globalAlpha are deliberately NOT baked in here — they're
        // applied live at blit time in draw() so an opacity animation on this
        // effect keeps tracking in real time instead of freezing until the
        // next bake/top-up.
        const i = (ly * w + lx) << 2;
        data[i    ] = (c.r + 0.5) | 0;
        data[i + 1] = (c.g + 0.5) | 0;
        data[i + 2] = (c.b + 0.5) | 0;
        data[i + 3] = (c.a * 255 + 0.5) | 0;
      }
    }
  }

  /**
   * Full bake: (re)computes the entire padded buffer from scratch. Used for
   * the first-ever draw, a canvas resize, a bake-affecting config change, and
   * as the fallback if a single frame drifts further than the top-up margin
   * can absorb (e.g. the tab was backgrounded and just resumed with a huge
   * deltaTime) — everywhere else, _topUpBake() below handles panning far more
   * cheaply.
   * @private
   */
  _bake(bw, bh, originPanX, originPanY) {
    const PAD = ContourFieldEffect.BAKE_PAD_CELLS;
    const bakeW = bw + PAD * 2;
    const bakeH = bh + PAD * 2;
    this._ensureBuffer(bakeW, bakeH);

    this._fillRegion(this._imgData, 0, 0, bakeW, bakeH, originPanX, originPanY);
    this._offCtx.putImageData(this._imgData, 0, 0);

    lcardsLog.debug('[ContourFieldEffect] Full bake', { bakeW, bakeH, originPanX, originPanY });
  }

  /**
   * Incremental top-up: shifts the cached bake by however many whole cells
   * the pan has moved since the last frame (a single native drawImage copy —
   * cheap regardless of shift size) and fills in only the newly exposed
   * sliver(s) at the leading edge(s) with fresh samples. Cost is proportional
   * to how far the field actually moved this frame (typically 1-3 cells at
   * any real scroll speed, since that's bounded by rAF's own frame interval),
   * not to the size of the buffer — this is what keeps panning cheap even at
   * high configured scroll speeds, where a periodic full rebake would
   * otherwise recur every couple of seconds at a fixed, non-amortized cost.
   * @private
   */
  _topUpBake(bw, bh, panX, panY) {
    const PAD = ContourFieldEffect.BAKE_PAD_CELLS;
    const bakeW = bw + PAD * 2;
    const bakeH = bh + PAD * 2;

    // Whole-cell shift only; the leftover fractional remainder is absorbed by
    // draw()'s fractional blit offset and naturally carries forward to
    // accumulate into future frames' shifts (self-correcting regardless of
    // direction changes — no separate running remainder to track).
    const shiftX = Math.trunc(panX - this._bakeOriginPanX);
    const shiftY = Math.trunc(panY - this._bakeOriginPanY);
    if (shiftX === 0 && shiftY === 0) return;

    // True pixel-copy shift (not alpha-composited) so existing content —
    // including any fully transparent "underwater" pixels — moves intact
    // rather than blending with whatever was previously at the destination.
    // new(bcx,bcy) must become old(bcx - shiftX, bcy - shiftY) — the value
    // that will satisfy _fillRegion()'s world-coordinate contract at bcx once
    // the origin below advances by (shiftX, shiftY) is the value that used to
    // sit at bcx-shiftX under the OLD origin. drawImage(source, dx, dy) maps
    // dest(x,y) = source(x-dx, y-dy), so dx/dy must be +shiftX/+shiftY (NOT
    // negated) to realize that.
    this._offCtx.globalCompositeOperation = 'copy';
    this._offCtx.drawImage(this._offCanvas, shiftX, shiftY);
    this._offCtx.globalCompositeOperation = 'source-over';

    this._bakeOriginPanX += shiftX;
    this._bakeOriginPanY += shiftY;

    // Fill the newly exposed strip(s) — the region 'copy' just cleared to
    // transparent because it fell outside the shifted source image. With
    // dx=shiftX, the drawn (valid) destination range is [shiftX, bakeW) for
    // shiftX>0 (content shifted toward higher indices), so the vacated range
    // is [0, shiftX) — i.e. the strip sits on the OPPOSITE edge from the
    // shift's own sign. Filling x then y (rather than solving the exact
    // L-shaped exposed region) double-fills one small corner when both axes
    // shifted in the same frame — harmless, since _fillRegion() is a pure
    // function of world coordinate and just recomputes the same correct value
    // there.
    if (shiftX !== 0) {
      const stripW = Math.min(bakeW, Math.abs(shiftX));
      const stripX = shiftX > 0 ? 0 : bakeW - stripW;
      const strip = this._offCtx.createImageData(stripW, bakeH);
      this._fillRegion(strip, stripX, 0, stripW, bakeH, this._bakeOriginPanX, this._bakeOriginPanY);
      this._offCtx.putImageData(strip, stripX, 0);
    }
    if (shiftY !== 0) {
      const stripH = Math.min(bakeH, Math.abs(shiftY));
      const stripY = shiftY > 0 ? 0 : bakeH - stripH;
      const strip = this._offCtx.createImageData(bakeW, stripH);
      this._fillRegion(strip, 0, stripY, bakeW, stripH, this._bakeOriginPanX, this._bakeOriginPanY);
      this._offCtx.putImageData(strip, 0, stripY);
    }
  }

  draw(ctx, canvasWidth, canvasHeight) {
    const w = canvasWidth | 0;
    const h = canvasHeight | 0;
    if (w < 1 || h < 1) return;

    const cell = this.cellSize;
    const bw = Math.max(1, Math.ceil(w / cell));
    const bh = Math.max(1, Math.ceil(h / cell));
    const PAD = ContourFieldEffect.BAKE_PAD_CELLS;

    // Current scroll position in buffer-cell units (1 cell = `cell` raw scroll px).
    const panX = this._scrollOffsetX / cell;
    const panY = this._scrollOffsetY / cell;

    const sizeChanged = bw !== this._visibleCellW || bh !== this._visibleCellH;

    if (this._bakeDirty || sizeChanged || !this._offCanvas) {
      this._visibleCellW = bw;
      this._visibleCellH = bh;
      this._bakeOriginPanX = panX;
      this._bakeOriginPanY = panY;
      this._bake(bw, bh, panX, panY);
      this._bakeDirty = false;
    } else if (Math.abs(panX - this._bakeOriginPanX) > PAD - 1 || Math.abs(panY - this._bakeOriginPanY) > PAD - 1) {
      // Pan jumped further in one frame than the margin can absorb (e.g. a
      // huge deltaTime spike from unrelated main-thread jank) — the top-up's
      // whole-cell shift would read outside the buffer, so fall back to a
      // full rebake for this one frame only.
      this._bakeOriginPanX = panX;
      this._bakeOriginPanY = panY;
      this._bake(bw, bh, panX, panY);
    } else {
      this._topUpBake(bw, bh, panX, panY);
    }

    // Fractional (sub-cell) source offset into the cached bake — NOT rounded
    // to an integer cell — so panning stays continuous frame-to-frame instead
    // of visibly snapping by up to one cell.
    const srcX = PAD - (panX - this._bakeOriginPanX);
    const srcY = PAD - (panY - this._bakeOriginPanY);

    const priorAlpha = ctx.globalAlpha;
    ctx.globalAlpha = priorAlpha * this.opacity;
    ctx.drawImage(this._offCanvas, srcX, srcY, bw, bh, 0, 0, w, h);
    ctx.globalAlpha = priorAlpha;
  }

  updateConfig(cfg) {
    // Fields that change the BAKED appearance require a re-bake to take
    // effect immediately (e.g. a template-driven param pushed via
    // BackgroundAnimationRenderer.updateHass()) rather than waiting for the
    // next scroll-drift-triggered bake. scrollSpeedX/Y and opacity don't —
    // scroll speed only changes how fast we pan through the same continuous
    // field, and opacity is applied live at blit time (see draw()/_bake()).
    let bakeAffected = false;
    if (cfg.noiseScale    !== undefined) { this.noiseScale = cfg.noiseScale; bakeAffected = true; }
    if (cfg.numOctaves    !== undefined) { this.numOctaves = cfg.numOctaves; bakeAffected = true; }
    if (cfg.numBands      !== undefined) { this.numBands = Math.max(2, Math.min(64, cfg.numBands)); bakeAffected = true; }
    if (cfg.cellSize      !== undefined) { this.cellSize = Math.max(1, Math.min(16, cfg.cellSize)); bakeAffected = true; }
    if (cfg.scrollSpeedX  !== undefined) this.scrollSpeedX = cfg.scrollSpeedX;
    if (cfg.scrollSpeedY  !== undefined) this.scrollSpeedY = cfg.scrollSpeedY;
    if (cfg.opacity       !== undefined) this.opacity = cfg.opacity;
    if (cfg.fillLevel     !== undefined) { this.fillLevel = Math.max(0, Math.min(0.95, cfg.fillLevel)); bakeAffected = true; }
    if (cfg.blendColors   !== undefined) { this.blendColors = cfg.blendColors; bakeAffected = true; }
    if (bakeAffected) this._bakeDirty = true;
  }

  destroy() {
    this._offCanvas = null;
    this._offCtx = null;
    this._imgData = null;
    super.destroy();
  }
}
