/**
 * @fileoverview CascadeEffect - Canvas2D LCARS data-waterfall cascade animation
 *
 * Renders the classic LCARS colour-cycling data waterfall (cascading rows of
 * random data cells) as a composable, stackable background layer.
 *
 * Equivalent in visual design to the legacy CB-LCARS `cb-lcars-animation-cascade`
 * template and the decorative mode of `lcards-data-grid`, but delivered through
 * the `background_animation` layer system so it can be used behind any card.
 *
 * @module core/packs/backgrounds/effects/CascadeEffect
 */

import { BaseEffect } from './BaseEffect.js';
import { ColorUtils } from '../../../themes/ColorUtils.js';
import { lcardsLog } from '../../../../utils/lcards-logging.js';

/**
 * CascadeEffect - LCARS data-waterfall colour-cycling background animation
 *
 * Features:
 * - Per-row colour cycling through configurable [start, text, end] stops
 * - Four timing patterns: default, niagara, fast, custom
 * - Auto-sizing (derive num_rows/num_cols from canvas dimensions + font metrics)
 * - Multiple data formats: hex, digit, float, alpha, mixed
 * - Configurable cell refresh interval
 * - CSS variable resolution via ColorUtils
 * - Stackable with other BaseEffect presets
 *
 * @extends BaseEffect
 */
export class CascadeEffect extends BaseEffect {
  /**
   * Create a new CascadeEffect
   *
   * @param {Object} [config={}] - Configuration object
   *
   * Grid sizing:
   * @param {number|null} [config.numRows=null] - Number of rows (null = auto-size from canvas)
   * @param {number|null} [config.numCols=null] - Number of columns (null = auto-size from canvas)
   *
   * Data format:
   * @param {string} [config.format='hex'] - Cell data format: 'digit'|'float'|'alpha'|'hex'|'mixed'
   * @param {number} [config.refreshInterval=0] - Cell data refresh interval in ms (0 = static)
   *
   * Colour cycling:
   * @param {Object} [config.colors] - Colour configuration
   * @param {string} [config.colors.start='var(--lcars-blue, #2266ff)'] - Animation start colour (bright dominant hold colour)
   * @param {string} [config.colors.text='var(--lcards-blue-darkest, #112244)'] - Mid/text colour (dark snap-to colour)
   * @param {string} [config.colors.end='var(--lcars-moonlight, #e7f3f7)'] - Animation end colour (pale fade-out colour)
   *
   * Timing:
   * @param {string} [config.pattern='default'] - Timing pattern: 'default'|'niagara'|'fast'|'custom'
   * @param {Array<{duration:number,delay:number}>} [config.timing] - Custom per-row timing (used when pattern='custom')
   * @param {number} [config.duration] - Override all row durations in ms (takes precedence over pattern)
   * @param {number} [config.speedMultiplier=1.0] - Speed multiplier (2.0 = twice as fast)
   *
   * Typography:
   * @param {number} [config.fontSize=10] - Font size in pixels
   * @param {string} [config.fontFamily="'Antonio', monospace"] - CSS font-family string
   * @param {number} [config.gap=4] - Gap between cells in pixels
   *
   * Base:
   * @param {number} [config.opacity=1] - Overall opacity (0-1, from BaseEffect)
   */
  constructor(config = {}) {
    super(config);

    // Grid dimensions (null = auto)
    this.numRows = config.numRows ?? null;
    this.numCols = config.numCols ?? null;

    // Data format
    this.format = config.format ?? 'hex';
    this.refreshInterval = config.refreshInterval ?? 0;

    // Colour config (raw values; resolved in draw())
    // Defaults match CB-LCARS cascade: bright blue (hold) → dark navy (snap) → pale moonlight (end)
    this.colorStart = config.colors?.start ?? 'var(--lcars-blue, #2266ff)';
    this.colorText  = config.colors?.text  ?? 'var(--lcards-blue-darkest, #112244)';
    this.colorEnd   = config.colors?.end   ?? 'var(--lcars-moonlight, #e7f3f7)';

    // Timing
    this.pattern         = config.pattern         ?? 'default';
    this.customTiming    = config.timing           ?? null;
    this.durationOverride = config.duration        ?? null;  // ms; null = use pattern
    this.speedMultiplier = config.speedMultiplier  ?? 1.0;

    // Typography
    this.fontSize   = config.fontSize   ?? 10;
    this.fontFamily = config.fontFamily ?? "'Antonio', monospace";
    this.gap        = config.gap        ?? 4;

    // Internal state
    this._cellData        = null;   // 2D array [row][col] of text strings
    this._lastRefreshTime = 0;      // timestamp for refresh tracking

    // Layout cache (invalidated when canvas size or relevant config changes)
    this._lastLayoutKey = '';
    this._computedRows = 0;
    this._computedCols = 0;
    this._cellWidth    = 0;
    this._cellHeight   = 0;

    // Per-row timing arrays (computed lazily)
    this._rowDurations   = null;   // ms per row
    this._rowPhaseOffsets = null;  // ms phase offset per row

    // Resolved colours cache (refreshed each draw frame)
    this._resolvedStart = null;
    this._resolvedText  = null;
    this._resolvedEnd   = null;

    this._hasLoggedFirstDraw = false;

    lcardsLog.debug('[CascadeEffect] Created cascade effect', {
      format: this.format,
      pattern: this.pattern,
      numRows: this.numRows,
      numCols: this.numCols,
      fontSize: this.fontSize,
      speedMultiplier: this.speedMultiplier
    });
  }

  // ============================================================================
  // Data generators (matches lcards-data-grid._generateRandomGrid)
  // ============================================================================

  /**
   * Generate a single cell value according to the configured format.
   * The 'mixed' case inlines all sub-generators to avoid mutating this.format.
   * @private
   * @returns {string}
   */
  _generateCell() {
    switch (this.format) {
      case 'digit':
        return Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      case 'float':
        return (Math.random() * 100).toFixed(2);
      case 'alpha': {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        return chars.charAt(Math.floor(Math.random() * chars.length)) +
               chars.charAt(Math.floor(Math.random() * chars.length));
      }
      case 'hex':
        return Math.floor(Math.random() * 65535).toString(16).toUpperCase().padStart(4, '0');
      case 'mixed': {
        // Inline all sub-cases to avoid mutating this.format (re-entrancy risk)
        const pick = Math.floor(Math.random() * 4);
        if (pick === 0) {
          return Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        } else if (pick === 1) {
          return (Math.random() * 100).toFixed(2);
        } else if (pick === 2) {
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
          return chars.charAt(Math.floor(Math.random() * chars.length)) +
                 chars.charAt(Math.floor(Math.random() * chars.length));
        } else {
          return Math.floor(Math.random() * 65535).toString(16).toUpperCase().padStart(4, '0');
        }
      }
      default:
        return Math.floor(Math.random() * 65535).toString(16).toUpperCase().padStart(4, '0');
    }
  }

  /**
   * Generate (or regenerate) the 2D cell data array
   * @private
   * @param {number} rows
   * @param {number} cols
   */
  _generateCellData(rows, cols) {
    this._cellData = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => this._generateCell())
    );
    lcardsLog.debug(`[CascadeEffect] Generated cell data: ${rows}×${cols}`);
  }

  // ============================================================================
  // Layout computation
  // ============================================================================

  /**
   * Compute (or retrieve cached) grid layout.
   * Cache is keyed on canvas size AND the layout-affecting config properties
   * (numRows, numCols, fontSize, gap) so live editor edits recompute correctly.
   *
   * @private
   * @param {number} canvasW
   * @param {number} canvasH
   */
  _computeLayout(canvasW, canvasH) {
    const layoutKey = `${canvasW}x${canvasH}|r${this.numRows}|c${this.numCols}|f${this.fontSize}|g${this.gap}`;
    if (layoutKey === this._lastLayoutKey && this._cellData !== null) {
      return; // Cache still valid
    }

    this._lastLayoutKey = layoutKey;

    // Cell size derived from font metrics + gap
    // Approximate column width: about 2.5× font size (matches CB-LCARS column_width)
    const cellW = this.fontSize * 2.5 + this.gap;
    const cellH = this.fontSize + this.gap;

    // Auto-size if not specified
    this._computedCols = this.numCols ?? Math.max(1, Math.floor((canvasW + this.gap) / cellW));
    this._computedRows = this.numRows ?? Math.max(1, Math.floor((canvasH + this.gap) / cellH));

    // Actual cell dimensions (distribute canvas space evenly when using auto)
    this._cellWidth  = this.numCols ? cellW : canvasW / this._computedCols;
    this._cellHeight = this.numRows ? cellH : canvasH / this._computedRows;

    // (Re)generate cell data for new dimensions
    this._generateCellData(this._computedRows, this._computedCols);

    // Build per-row timing arrays
    this._buildRowTiming(this._computedRows);

    lcardsLog.debug('[CascadeEffect] Layout computed', {
      rows: this._computedRows,
      cols: this._computedCols,
      cellW: this._cellWidth,
      cellH: this._cellHeight
    });
  }

  // ============================================================================
  // Timing
  // ============================================================================

  /**
   * Return the base timing pattern array.
   * Mirrors lcards-data-grid._getAnimationTiming().
   *
   * @private
   * @returns {Array<{duration:number, delay:number}>} duration in ms, delay in seconds
   */
  _getTimingPattern() {
    const patterns = {
      default: [
        { duration: 3000, delay: 0.1 },
        { duration: 3000, delay: 0.2 },
        { duration: 4000, delay: 0.3 },
        { duration: 4000, delay: 0.4 },
        { duration: 4000, delay: 0.5 },
        { duration: 2000, delay: 0.6 },
        { duration: 2000, delay: 0.7 },
        { duration: 2000, delay: 0.8 }
      ],
      niagara: Array.from({ length: 8 }, (_, i) => ({
        duration: 2000,
        delay: (i + 1) * 0.1
      })),
      fast: Array.from({ length: 8 }, (_, i) => ({
        duration: 1000,
        delay: i * 0.05
      }))
    };

    if (this.pattern === 'custom' && this.customTiming) {
      return this.customTiming;
    }

    return patterns[this.pattern] || patterns.default;
  }

  /**
   * Build per-row duration and phase-offset arrays
   * @private
   * @param {number} numRows
   */
  _buildRowTiming(numRows) {
    const base = this._getTimingPattern();
    const len  = base.length;

    this._rowDurations    = new Float64Array(numRows);
    this._rowPhaseOffsets = new Float64Array(numRows);

    for (let i = 0; i < numRows; i++) {
      const entry = base[i % len];

      // Duration: override > speedMultiplier > pattern
      let dur = entry.duration;
      if (this.durationOverride != null && this.durationOverride > 0) {
        dur = this.durationOverride;
      } else if (this.speedMultiplier !== 1.0) {
        dur = dur / this.speedMultiplier;
      }

      this._rowDurations[i]    = Math.max(100, dur);      // minimum 100 ms
      this._rowPhaseOffsets[i] = entry.delay * 1000;       // convert s → ms
    }
  }

  // ============================================================================
  // Colour interpolation
  // ============================================================================

  /**
   * Parse a hex/rgb/rgba colour string into an [r, g, b] array.
   * Returns null if the string cannot be parsed.
   *
   * @private
   * @param {string} color - CSS colour string (hex or rgb/rgba)
   * @returns {number[]|null}
   */
  _parseColor(color) {
    if (!color) return null;

    // rgba(r, g, b, a) or rgb(r, g, b)
    const rgbMatch = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (rgbMatch) {
      return [parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3])];
    }

    // #rrggbb or #rgb
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      if (hex.length === 3) {
        return [
          parseInt(hex[0] + hex[0], 16),
          parseInt(hex[1] + hex[1], 16),
          parseInt(hex[2] + hex[2], 16)
        ];
      }
      if (hex.length >= 6) {
        return [
          parseInt(hex.slice(0, 2), 16),
          parseInt(hex.slice(2, 4), 16),
          parseInt(hex.slice(4, 6), 16)
        ];
      }
    }

    return null;
  }

  /**
   * Linear interpolation between two scalar values
   * @private
   */
  _lerp(a, b, t) {
    return a + (b - a) * t;
  }

  /**
   * Interpolate between two [r, g, b] tuples
   * @private
   * @param {number[]} c1
   * @param {number[]} c2
   * @param {number} t - 0..1
   * @returns {string} CSS rgb() string
   */
  _lerpColor(c1, c2, t) {
    const r = Math.round(this._lerp(c1[0], c2[0], t));
    const g = Math.round(this._lerp(c1[1], c2[1], t));
    const b = Math.round(this._lerp(c1[2], c2[2], t));
    return `rgb(${r},${g},${b})`;
  }

  /**
   * Compute the current colour for a row at normalised cycle position t (0..1).
   *
   * Keyframe structure (matches CB-LCARS / data-grid cascade):
   *
   *   0%–75%:  colorStart  (hold — the bright dominant LCARS blue)
   *   75%–80%: colorStart → colorText  (fast snap to dark navy)
   *   80%–90%: colorText   (hold — dark navy)
   *   90%–100%: colorText → colorEnd  (fade to pale moonlight, loops back to colorStart)
   *
   * Falls back to returning the start colour string if the colours cannot be
   * parsed (e.g., CSS variable not yet resolved).
   *
   * @private
   * @param {number} t - Normalised cycle position 0..1
   * @returns {string} CSS colour string
   */
  _interpolateColor(t) {
    const cStart = this._parseColor(this._resolvedStart);
    const cText  = this._parseColor(this._resolvedText);
    const cEnd   = this._parseColor(this._resolvedEnd);

    // Fallback: if colours can't be parsed just return start colour string
    if (!cStart || !cText || !cEnd) {
      return this._resolvedStart || '#2266ff';
    }

    if (t < 0.75) {
      // 0%–75%: hold colorStart
      return this._lerpColor(cStart, cStart, 0);
    } else if (t < 0.80) {
      // 75%–80%: colorStart → colorText  (fast transition)
      const localT = (t - 0.75) / 0.05;
      return this._lerpColor(cStart, cText, localT);
    } else if (t < 0.90) {
      // 80%–90%: hold colorText
      return this._lerpColor(cText, cText, 0);
    } else {
      // 90%–100%: colorText → colorEnd
      const localT = (t - 0.90) / 0.10;
      return this._lerpColor(cText, cEnd, localT);
    }
  }

  // ============================================================================
  // BaseEffect lifecycle
  // ============================================================================

  /**
   * Update animation state (called by Canvas2DRenderer each frame)
   *
   * @param {number} deltaTime - ms since last frame
   * @param {number} canvasWidth
   * @param {number} canvasHeight
   */
  update(deltaTime, canvasWidth, canvasHeight) {
    super.update(deltaTime, canvasWidth, canvasHeight);

    // Periodic cell data refresh
    if (this.refreshInterval > 0 && this._cellData !== null) {
      this._lastRefreshTime += deltaTime;
      if (this._lastRefreshTime >= this.refreshInterval) {
        this._lastRefreshTime = 0;
        this._generateCellData(this._computedRows, this._computedCols);
      }
    }
  }

  /**
   * Draw the cascade effect to the canvas (called by Canvas2DRenderer each frame)
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} canvasWidth
   * @param {number} canvasHeight
   */
  draw(ctx, canvasWidth, canvasHeight) {
    if (canvasWidth === 0 || canvasHeight === 0) return;

    // Ensure layout is computed (or updated after canvas resize)
    this._computeLayout(canvasWidth, canvasHeight);

    if (!this._cellData || this._computedRows === 0 || this._computedCols === 0) return;

    // Resolve CSS variables once per frame (ColorUtils caches results)
    this._resolvedStart = ColorUtils.resolveCssVariable(this.colorStart);
    this._resolvedText  = ColorUtils.resolveCssVariable(this.colorText);
    this._resolvedEnd   = ColorUtils.resolveCssVariable(this.colorEnd);

    // Early-exit if colours are not yet parseable (e.g., DOM not ready for CSS var resolution)
    if (!this._parseColor(this._resolvedStart) ||
        !this._parseColor(this._resolvedText)  ||
        !this._parseColor(this._resolvedEnd)) {
      return;
    }

    ctx.save();

    // Apply global opacity from BaseEffect
    ctx.globalAlpha = (ctx.globalAlpha ?? 1) * this.opacity;

    // Text rendering setup
    ctx.font      = `${this.fontSize}px ${this.fontFamily}`;
    ctx.textAlign = 'right';

    const elapsed = this._elapsedTime; // ms since creation

    for (let row = 0; row < this._computedRows; row++) {
      // Compute normalised cycle position for this row
      const dur    = this._rowDurations[row];
      const phase  = this._rowPhaseOffsets[row];
      const rowTime = ((elapsed - phase) % dur + dur) % dur;  // positive modulo; subtract phase so row 0 (smallest delay) leads
      const t      = rowTime / dur;

      // Colour for this row at this moment
      const color = this._interpolateColor(t);
      ctx.fillStyle = color;

      const y = row * this._cellHeight + this.fontSize; // baseline inside cell

      const rowData = this._cellData[row];
      for (let col = 0; col < this._computedCols; col++) {
        // x = right edge of the cell (textAlign='right')
        const x = (col + 1) * this._cellWidth - this.gap / 2;
        ctx.fillText(rowData[col], x, y);
      }
    }

    ctx.restore();

    if (!this._hasLoggedFirstDraw) {
      lcardsLog.info('[CascadeEffect] First draw', {
        rows: this._computedRows,
        cols: this._computedCols,
        canvas: `${canvasWidth}×${canvasHeight}`,
        pattern: this.pattern,
        format: this.format
      });
      this._hasLoggedFirstDraw = true;
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    this._cellData        = null;
    this._rowDurations    = null;
    this._rowPhaseOffsets = null;
    super.destroy();
  }
}
