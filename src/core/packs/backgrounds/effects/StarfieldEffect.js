import { BaseEffect } from './BaseEffect.js';
import { lcardsLog } from '../../../../utils/lcards-logging.js';
import { ColorUtils } from '../../../themes/ColorUtils.js';

/**
 * StarfieldEffect - Scrolling starfield with parallax depth
 *
 * Creates a field of stars with multiple parallax layers for depth illusion.
 * Stars move at different speeds based on their layer (closer = faster).
 * Uses seeded random generation for reproducible patterns.
 *
 * Supports:
 * - Seeded random generation (reproducible patterns)
 * - Parallax layers (depth effect via speed variation)
 * - Configurable star count, size range, opacity range
 * - Independent X/Y scroll speeds
 * - Color customization
 *
 * Animatable properties (via anime.js):
 * - scrollSpeedX, scrollSpeedY: scroll velocity
 * - opacity: overall transparency
 *
 * @class StarfieldEffect
 * @extends BaseEffect
 */
export class StarfieldEffect extends BaseEffect {
  /**
   * @param {object} config - Effect configuration
   *
   * Star generation:
   * @param {number} [config.seed=1] - Random seed for reproducible patterns
   * @param {number} [config.count=150] - Total number of stars to generate
   * @param {number} [config.minRadius=0.5] - Minimum star radius in pixels
   * @param {number} [config.maxRadius=2] - Maximum star radius in pixels
   * @param {number} [config.minOpacity=0.3] - Minimum star opacity (0-1)
   * @param {number} [config.maxOpacity=1.0] - Maximum star opacity (0-1)
   * @param {string|string[]} [config.color='#ffffff'] - Star color (single color or array of colors)
   * @param {string|string[]} [config.colors] - Alias for color (array form)
   *
   * Scrolling:
   * @param {number} [config.scrollSpeedX=30] - Horizontal scroll speed (pixels/second)
   * @param {number} [config.scrollSpeedY=0] - Vertical scroll speed (pixels/second)
   *
   * Parallax:
   * @param {number} [config.parallaxLayers=3] - Number of depth layers (1-5)
   * @param {number} [config.depthFactor=0.5] - Speed multiplier between layers (0-1)
   */
  constructor(config = {}) {
    super(/** @type {any} */ (config));

    // Star generation config
    this.seed = config.seed ?? 1;
    this.count = config.count ?? 150;
    this.minRadius = config.minRadius ?? 0.5;
    this.maxRadius = config.maxRadius ?? 2;
    this.minOpacity = config.minOpacity ?? 0.3;
    this.maxOpacity = config.maxOpacity ?? 1.0;

    // Support both 'color' (single) and 'colors' (array) for legacy compatibility
    const colorInput = config.colors ?? config.color ?? '#ffffff';
    this.colors = Array.isArray(colorInput) ? colorInput : [colorInput];

    // Resolve colour expressions (CSS vars + computed functions like darken/lighten/alpha)
    const _resolver = window.lcards?.core?.themeManager?.resolver;
    const _resolve = (c) => ColorUtils.resolveCssVariable((_resolver ? _resolver.resolve(c, c) : c), c);
    this.resolvedColors = this.colors.map(_resolve);

    // Scrolling
    this.scrollSpeedX = config.scrollSpeedX ?? 30;
    this.scrollSpeedY = config.scrollSpeedY ?? 0;

    // Parallax
    this.parallaxLayers = Math.max(1, Math.min(5, config.parallaxLayers ?? 3));
    this.depthFactor = Math.max(0, Math.min(1, config.depthFactor ?? 0.5));

    // Initialize RNG and generate stars in constructor
    this._initRNG();
    this._generateStars();

    lcardsLog.debug('[StarfieldEffect] Created starfield effect', {
      count: this.count,
      seed: this.seed,
      parallaxLayers: this.parallaxLayers,
      colorCount: this.resolvedColors.length,
      colors: this.resolvedColors,
      scrollSpeeds: { x: this.scrollSpeedX, y: this.scrollSpeedY }
    });
  }

  /**
   * Initialize seeded random number generator
   * Uses mulberry32 algorithm for fast, quality randomness
   * @private
   */
  _initRNG() {
    let seed = this.seed;
    this._rng = () => {
      seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /**
   * Generate stars distributed across parallax layers
   * Stars use normalized 0-1 coordinates (scaled to canvas during draw)
   * @private
   */
  _generateStars() {
    this.stars = [];

    lcardsLog.debug('[StarfieldEffect] Generating stars', {
      count: this.count,
      seed: this.seed,
      parallaxLayers: this.parallaxLayers
    });

    // Generate stars distributed across parallax layers
    const starsPerLayer = Math.floor(this.count / this.parallaxLayers);

    for (let layer = 0; layer < this.parallaxLayers; layer++) {
      const layerCount = layer === this.parallaxLayers - 1
        ? this.count - (starsPerLayer * layer) // Last layer gets remainder
        : starsPerLayer;

      // Layer 0 = farthest (slowest), Layer N-1 = closest (fastest)
      const speedMultiplier = this.depthFactor + (1 - this.depthFactor) * (layer / Math.max(1, this.parallaxLayers - 1));

      for (let i = 0; i < layerCount; i++) {
        // Randomly select a color from the resolved colors array
        const colorIndex = Math.floor(this._rng() * this.resolvedColors.length);
        const starColor = this.resolvedColors[colorIndex];

        this.stars.push({
          // Random position in normalized 0-1 space (scaled during draw)
          x: this._rng(),
          y: this._rng(),

          // Random size and opacity
          radius: this.minRadius + this._rng() * (this.maxRadius - this.minRadius),
          opacity: this.minOpacity + this._rng() * (this.maxOpacity - this.minOpacity),

          // Color from array
          color: starColor,

          // Layer for parallax
          layer: layer,
          speedMultiplier: speedMultiplier
        });
      }
    }

    lcardsLog.debug(`[StarfieldEffect] Generated ${this.stars.length} stars across ${this.parallaxLayers} layers`);

    // Pre-build draw buckets for batched rendering.
    // Stars are grouped by (color, quantized-opacity) so that each bucket can
    // be drawn as a single beginPath → N arcs → fill() call instead of one
    // fill() per star.  Opacity is quantised to 8 levels (steps of 0.125)
    // which is visually imperceptible at typical star sizes (0.5–2 px).
    this._buildDrawBuckets();
  }

  /**
   * Pre-group stars into draw buckets to minimise per-frame GPU state changes.
   *
   * Each bucket shares the same fillStyle and per-bucket opacity so the entire
   * group can be drawn with a single fill() call.
   *
   * Called once after star generation (star color / opacity never change at
   * runtime — only position updates).
   * @private
   */
  _buildDrawBuckets() {
    const OPACITY_LEVELS = 8; // quantise star.opacity to 8 steps
    const bucketMap = new Map();

    for (const star of this.stars) {
      // Round to nearest 1/OPACITY_LEVELS to collapse continuous opacity values
      // into a small set of discrete levels.
      const quantizedOpacity = Math.round(star.opacity * OPACITY_LEVELS) / OPACITY_LEVELS;
      const key = `${star.color}|${quantizedOpacity}`;

      if (!bucketMap.has(key)) {
        bucketMap.set(key, { fillStyle: star.color, baseOpacity: quantizedOpacity, stars: [] });
      }
      bucketMap.get(key).stars.push(star);
    }

    this._drawBuckets = Array.from(bucketMap.values());

    lcardsLog.debug(`[StarfieldEffect] Built ${this._drawBuckets.length} draw buckets from ${this.stars.length} stars`);
  }

  /**
   * Update animation state (called by Canvas2DRenderer)
   */
  update(deltaTime, canvasWidth, canvasHeight) {
    super.update(deltaTime, canvasWidth, canvasHeight);

    if (this.stars.length === 0) {
      return; // Not initialized yet
    }

    // Convert deltaTime to seconds
    const dt = deltaTime / 1000;

    // Update each star position in normalized 0-1 space
    for (const star of this.stars) {
      // Convert pixel speeds to normalized speeds
      const normalizedSpeedX = (this.scrollSpeedX * dt * star.speedMultiplier) / canvasWidth;
      const normalizedSpeedY = (this.scrollSpeedY * dt * star.speedMultiplier) / canvasHeight;

      // Update position
      star.x += normalizedSpeedX;
      star.y += normalizedSpeedY;

      // Wrap in normalized 0-1 space
      star.x = ((star.x % 1) + 1) % 1; // Handle negative wrap
      star.y = ((star.y % 1) + 1) % 1;
    }
  }

  /**
   * Draw stars (called by Canvas2DRenderer)
   */
  draw(ctx, canvasWidth, canvasHeight) {
    if (this.stars.length === 0) {
      lcardsLog.warn('[StarfieldEffect] No stars generated, skipping draw');
      return;
    }

    // Save the current globalAlpha (set by ZoomEffect wrapper)
    const parentAlpha = ctx.globalAlpha;

    // Batched draw: one beginPath → N arcs → fill() per (color, opacity) bucket
    // instead of one fill() per star.  Reduces GPU state changes from
    // O(stars) to O(buckets) — typically from ~150 down to ~8–24 calls.
    for (const bucket of this._drawBuckets) {
      ctx.fillStyle = bucket.fillStyle;
      ctx.globalAlpha = parentAlpha * bucket.baseOpacity * this.opacity;

      ctx.beginPath();
      for (const star of bucket.stars) {
        const x = star.x * canvasWidth;
        const y = star.y * canvasHeight;
        // moveTo before arc prevents the canvas from drawing a line from the
        // previous arc end-point to this arc's start.
        ctx.moveTo(x + star.radius, y);
        ctx.arc(x, y, star.radius, 0, Math.PI * 2);
      }
      ctx.fill();
    }

    // Restore parent alpha
    ctx.globalAlpha = parentAlpha;

    // Log first draw for debugging
    if (!this._hasLoggedFirstDraw) {
      lcardsLog.debug(`[StarfieldEffect] First draw: ${this.stars.length} stars`, {
        canvasSize: `${canvasWidth}x${canvasHeight}`,
        colors: this.resolvedColors,
        scrollSpeed: `${this.scrollSpeedX},${this.scrollSpeedY}`
      });
      this._hasLoggedFirstDraw = true;
    }
  }

  /**
   * Update animation state (called by anime.js or manual updates)
   */
  updateAnimatableProps(props) {
    if (props.scrollSpeedX !== undefined) this.scrollSpeedX = props.scrollSpeedX;
    if (props.scrollSpeedY !== undefined) this.scrollSpeedY = props.scrollSpeedY;
    if (props.opacity !== undefined) this.opacity = props.opacity;
  }

  /**
   * Cleanup
   */
  destroy() {
    this.stars = [];
    this._rng = null;
  }
}
