/**
 * @fileoverview NebulaEffect - Canvas2D nebula clouds with Perlin noise
 *
 * Creates layered radial gradient "clouds" with organic Perlin noise displacement
 * for a nebula/cosmic gas effect. Much more performant than SVG filters.
 *
 * @module core/packs/backgrounds/effects/NebulaEffect
 */

import { BaseEffect } from './BaseEffect.js';
import { ColorUtils } from '../../../themes/ColorUtils.js';
import { lcardsLog } from '../../../../utils/lcards-logging.js';

/**
 * NebulaEffect - Layered nebula clouds with Perlin noise turbulence
 *
 * Features:
 * - Multiple cloud layers with radial gradients
 * - Perlin noise for organic turbulence
 * - Multi-color support with random color assignment
 * - Animated drift via scrolling and noise offset
 * - Seeded random for reproducible patterns
 *
 * @extends BaseEffect
 */
export class NebulaEffect extends BaseEffect {
  /**
   * Create a new nebula effect
   *
   * @param {object} [config={}] - Configuration object
   *
   * Clouds:
   * @param {number} [config.cloudCount=4] - Number of nebula clouds (1-10)
   * @param {number} [config.minRadius=0.15] - Minimum cloud radius (fraction of canvas size, 0-1)
   * @param {number} [config.maxRadius=0.4] - Maximum cloud radius (fraction of canvas size, 0-1)
   * @param {number} [config.minOpacity=0.3] - Minimum cloud opacity (0-1)
   * @param {number} [config.maxOpacity=0.8] - Maximum cloud opacity (0-1)
   * @param {string|Array<string>} [config.colors] - Single color or array of colors
   * @param {string} [config.color] - Alias for colors (single color string)
   * @param {number} [config.seed=1] - Random seed for cloud generation
   *
   * Turbulence:
   * @param {number} [config.turbulence=0.5] - Turbulence intensity (0-1)
   * @param {number} [config.noiseScale=0.003] - Perlin noise scale (smaller = larger features)
   * @param {number} [config.scrollSpeedX=5] - Horizontal drift speed (pixels/second)
   * @param {number} [config.scrollSpeedY=5] - Vertical drift speed (pixels/second)
   */
  constructor(config = {}) {
    super(/** @type {any} */ (config));

    // Cloud generation config
    this.seed = config.seed ?? 1;
    this.cloudCount = Math.max(1, Math.min(10, config.cloudCount ?? 4));
    this.minRadius = Math.max(0, Math.min(1, config.minRadius ?? 0.15));
    this.maxRadius = Math.max(0, Math.min(1, config.maxRadius ?? 0.4));
    this.minOpacity = Math.max(0, Math.min(1, config.minOpacity ?? 0.3));
    this.maxOpacity = Math.max(0, Math.min(1, config.maxOpacity ?? 0.8));

    // Support both 'color' (single) and 'colors' (array) for consistency
    const colorInput = config.colors ?? config.color ?? '#FF00FF';
    this.colors = Array.isArray(colorInput) ? colorInput : [colorInput];

    // Resolve colour expressions (CSS vars + computed functions like darken/lighten/alpha)
    const _resolver = window.lcards?.core?.themeManager?.resolver;
    const _resolve = (c) => ColorUtils.resolveCssVariable((_resolver ? _resolver.resolve(c, c) : c), c);
    this.resolvedColors = this.colors.map(_resolve);

    // Turbulence config
    this.turbulence = Math.max(0, Math.min(1, config.turbulence ?? 0.5));
    this.noiseScale = config.noiseScale ?? 0.003;
    this.scrollSpeedX = config.scrollSpeedX ?? 5;
    this.scrollSpeedY = config.scrollSpeedY ?? 5;

    // Animation state
    this._scrollOffsetX = 0;
    this._scrollOffsetY = 0;

    // Initialize RNG and generate clouds
    this._initRNG();
    this._generateClouds();
    this._initPerlinNoise();

    lcardsLog.debug('[NebulaEffect] Created nebula effect', {
      cloudCount: this.cloudCount,
      seed: this.seed,
      colorCount: this.resolvedColors.length,
      turbulence: this.turbulence
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
   * Generate nebula clouds with random positions, sizes, and colors
   * @private
   */
  _generateClouds() {
    this.clouds = [];

    for (let i = 0; i < this.cloudCount; i++) {
      // Randomly select a color from the resolved colors array
      const colorIndex = Math.floor(this._rng() * this.resolvedColors.length);
      const cloudColor = this.resolvedColors[colorIndex];

      this.clouds.push({
        // Position in normalized 0-1 space
        x: this._rng(),
        y: this._rng(),

        // Radius as fraction of canvas size
        radius: this.minRadius + this._rng() * (this.maxRadius - this.minRadius),

        // Opacity
        opacity: this.minOpacity + this._rng() * (this.maxOpacity - this.minOpacity),

        // Color (CRITICAL: must be assigned!)
        color: cloudColor,

        // Gradient stops (inner to outer opacity)
        stops: [
          1.0,                                                   // Center: full opacity
          0.6 + this._rng() * 0.3,                              // Mid: 60-90%
          0.1 + this._rng() * 0.2,                              // Outer: 10-30%
          0                                                      // Edge: transparent
        ]
      });
    }

    lcardsLog.debug(`[NebulaEffect] Generated ${this.clouds.length} clouds`);
  }

  /**
   * Initialize Perlin noise permutation table (seeded)
   * @private
   */
  _initPerlinNoise() {
    // Create permutation table based on seed
    this._perm = [];
    for (let i = 0; i < 256; i++) {
      this._perm[i] = i;
    }

    // Fisher-Yates shuffle with seeded random
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(this._rng() * (i + 1));
      [this._perm[i], this._perm[j]] = [this._perm[j], this._perm[i]];
    }

    // Duplicate for wrapping
    this._perm = this._perm.concat(this._perm);
  }

  /**
   * 2D Perlin noise implementation
   * @private
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {number} Noise value (-1 to 1)
   */
  _perlin2D(x, y) {
    // Grid cell coordinates
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;

    // Fractional part of coordinates
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    // Fade curves
    const u = this._fade(xf);
    const v = this._fade(yf);

    // Hash coordinates of 4 corners
    const aa = this._perm[this._perm[xi] + yi];
    const ab = this._perm[this._perm[xi] + yi + 1];
    const ba = this._perm[this._perm[xi + 1] + yi];
    const bb = this._perm[this._perm[xi + 1] + yi + 1];

    // Blend results from 4 corners
    const x1 = this._lerp(this._grad(aa, xf, yf), this._grad(ba, xf - 1, yf), u);
    const x2 = this._lerp(this._grad(ab, xf, yf - 1), this._grad(bb, xf - 1, yf - 1), u);

    return this._lerp(x1, x2, v);
  }

  /**
   * Perlin fade function (6t^5 - 15t^4 + 10t^3)
   * @private
   */
  _fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  /**
   * Linear interpolation
   * @private
   */
  _lerp(a, b, t) {
    return a + t * (b - a);
  }

  /**
   * Gradient function for Perlin noise
   * @private
   */
  _grad(hash, x, y) {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  /**
   * Update animation state
   */
  update(deltaTime, canvasWidth, canvasHeight) {
    super.update(deltaTime, canvasWidth, canvasHeight);

    // Update scroll offsets (deltaTime is in milliseconds)
    const dt = deltaTime / 1000;
    this._scrollOffsetX += this.scrollSpeedX * dt;
    this._scrollOffsetY += this.scrollSpeedY * dt;
  }

  /**
   * Draw nebula clouds
   */
  draw(ctx, canvasWidth, canvasHeight) {
    if (this.clouds.length === 0) {
      lcardsLog.warn('[NebulaEffect] No clouds generated, skipping draw');
      return;
    }

    // Save the current globalAlpha (set by ZoomEffect wrapper)
    const parentAlpha = ctx.globalAlpha;

    // Draw each cloud
    for (const cloud of this.clouds) {
      // Calculate actual position and radius in pixels
      const baseX = cloud.x * canvasWidth;
      const baseY = cloud.y * canvasHeight;
      const radius = cloud.radius * Math.min(canvasWidth, canvasHeight);

      // Apply Perlin noise displacement for turbulence
      const noiseX = (baseX + this._scrollOffsetX) * this.noiseScale;
      const noiseY = (baseY + this._scrollOffsetY) * this.noiseScale;
      const noise = this._perlin2D(noiseX, noiseY);

      // Displace position based on turbulence
      const displacement = noise * this.turbulence * radius * 0.5;
      const x = baseX + displacement * Math.cos(noise * Math.PI);
      const y = baseY + displacement * Math.sin(noise * Math.PI);

      // Create radial gradient
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);

      // Parse color and add alpha to stops
      const baseColor = cloud.color;
      gradient.addColorStop(0, this._colorWithAlpha(baseColor, cloud.stops[0]));
      gradient.addColorStop(0.4, this._colorWithAlpha(baseColor, cloud.stops[1]));
      gradient.addColorStop(0.7, this._colorWithAlpha(baseColor, cloud.stops[2]));
      gradient.addColorStop(1, this._colorWithAlpha(baseColor, cloud.stops[3]));

      // Apply cloud opacity (multiply with parent alpha)
      ctx.globalAlpha = parentAlpha * cloud.opacity * this.opacity;

      // Draw cloud
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    // Restore parent alpha
    ctx.globalAlpha = parentAlpha;
  }

  /**
   * Helper to add alpha to a color
   * @private
   * @param {string} color - Color string (hex, rgb, rgba)
   * @param {number} alpha - Alpha value (0-1)
   * @returns {string} Color with alpha
   */
  _colorWithAlpha(color, alpha) {
    // If already rgba, extract and replace alpha
    if (color.startsWith('rgba')) {
      return color.replace(/[\d.]+\)$/, `${alpha})`);
    }

    // If rgb, convert to rgba
    if (color.startsWith('rgb')) {
      return color.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
    }

    // If hex, convert to rgba
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // Fallback: wrap in rgba (may not work for named colors)
    return `rgba(${color}, ${alpha})`;
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.clouds = [];
    this._perm = null;
    super.destroy();
  }
}
