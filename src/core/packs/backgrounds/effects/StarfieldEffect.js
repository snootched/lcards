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
   * @param {Object} config - Effect configuration
   *
   * Star generation:
   * @param {number} [config.seed=1] - Random seed for reproducible patterns
   * @param {number} [config.count=150] - Total number of stars to generate
   * @param {number} [config.minRadius=0.5] - Minimum star radius in pixels
   * @param {number} [config.maxRadius=2] - Maximum star radius in pixels
   * @param {number} [config.minOpacity=0.3] - Minimum star opacity (0-1)
   * @param {number} [config.maxOpacity=1.0] - Maximum star opacity (0-1)
   * @param {string} [config.color='#ffffff'] - Star color
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
    super(config);

    // Star generation config
    this.seed = config.seed ?? 1;
    this.count = config.count ?? 150;
    this.minRadius = config.minRadius ?? 0.5;
    this.maxRadius = config.maxRadius ?? 2;
    this.minOpacity = config.minOpacity ?? 0.3;
    this.maxOpacity = config.maxOpacity ?? 1.0;
    this.color = ColorUtils.resolveCssVariable(config.color ?? '#ffffff');

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
        this.stars.push({
          // Random position in normalized 0-1 space (scaled during draw)
          x: this._rng(),
          y: this._rng(),

          // Random size and opacity
          radius: this.minRadius + this._rng() * (this.maxRadius - this.minRadius),
          opacity: this.minOpacity + this._rng() * (this.maxOpacity - this.minOpacity),

          // Layer for parallax
          layer: layer,
          speedMultiplier: speedMultiplier
        });
      }
    }

    lcardsLog.info(`[StarfieldEffect] Generated ${this.stars.length} stars across ${this.parallaxLayers} layers`);
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

    // Set fill color
    ctx.fillStyle = this.color;

    // Draw each star, scaling from normalized 0-1 space to canvas pixels
    for (const star of this.stars) {
      const x = star.x * canvasWidth;
      const y = star.y * canvasHeight;

      // Apply opacity
      ctx.globalAlpha = star.opacity * this.opacity;

      // Draw star as a filled circle
      ctx.beginPath();
      ctx.arc(x, y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Reset alpha
    ctx.globalAlpha = 1.0;

    // Log first draw for debugging
    if (!this._hasLoggedFirstDraw) {
      lcardsLog.info(`[StarfieldEffect] First draw: ${this.stars.length} stars`, {
        canvasSize: `${canvasWidth}x${canvasHeight}`,
        color: this.color,
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
