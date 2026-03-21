import { lcardsLog } from '../../../../utils/lcards-logging.js';

/**
 * ZoomEffect - Layered scaling effect wrapper for pseudo-3D depth illusion
 *
 * Wraps another effect (like GridEffect) and creates multiple scaled layers
 * with opacity fade-in/out to simulate infinite zoom/depth.
 *
 * Based on legacy CB-LCARS zoom effect implementation.
 *
 * Note: This is a wrapper/compositor, not a BaseEffect extension.
 * It implements the same interface (update, draw, isActive, destroy) for compatibility
 * with Canvas2DRenderer.
 *
 * @class ZoomEffect
 */
export class ZoomEffect {
  /**
   * @param {object} config - Zoom effect configuration
   * @param {Object} [config.baseEffect] - The effect to apply zoom to
   * @param {number} [config.layers=3] - Number of zoom layers to render (can be 1 if using multiple ZoomEffect instances)
   * @param {number} [config.layerIndex] - Index of this layer in multi-instance setup (for timing offset)
   * @param {number} [config.totalLayers] - Total number of layers in multi-instance setup
   * @param {number} [config.scaleFrom=1] - Initial scale (1 = normal size)
   * @param {number} [config.scaleTo=2] - Final scale before fade out
   * @param {number} [config.duration=10] - Duration for full zoom cycle (seconds)
   * @param {number} [config.opacityFadeIn=10] - Opacity fade-in percentage (0-100)
   * @param {number} [config.opacityFadeOut=80] - Opacity fade-out start percentage (0-100)
   */
  constructor(config = {}) {
    this.baseEffect = config.baseEffect;
    if (!this.baseEffect) {
      throw new Error('[ZoomEffect] baseEffect is required');
    }

    this.layers = config.layers ?? 3;
    this.layerIndex = config.layerIndex ?? null; // For multi-instance setup
    this.totalLayers = config.totalLayers ?? this.layers;
    this.scaleFrom = config.scaleFrom ?? 1;
    this.scaleTo = config.scaleTo ?? 2;
    this.duration = config.duration ?? 10; // seconds
    this.opacityFadeIn = config.opacityFadeIn ?? 10; // percentage
    this.opacityFadeOut = config.opacityFadeOut ?? 80; // percentage

    // Track time for animation
    this._elapsedTime = 0;
    this._isActive = true;

    // Off-screen frame buffer: base effect is rendered here once per frame,
    // then stamped N times (once per zoom layer) via drawImage instead of
    // re-executing the full baseEffect.draw() for every layer.
    this._frameCanvas = null;
    this._frameCtx = null;

    lcardsLog.debug('[ZoomEffect] Created zoom effect wrapper', {
      layers: this.layers,
      layerIndex: this.layerIndex,
      totalLayers: this.totalLayers,
      scaleRange: [this.scaleFrom, this.scaleTo],
      duration: this.duration,
      fadeIn: this.opacityFadeIn,
      fadeOut: this.opacityFadeOut
    });
  }

  /**
   * Check if effect is still active
   * @returns {boolean}
   */
  isActive() {
    return this._isActive;
  }

  /**
   * Update zoom animation state
   *
   * @param {number} deltaTime - Time since last update in milliseconds
   * @param {number} canvasWidth - Canvas width in pixels
   * @param {number} canvasHeight - Canvas height in pixels
   */
  update(deltaTime, canvasWidth, canvasHeight) {
    // Update elapsed time
    this._elapsedTime += deltaTime / 1000; // Convert to seconds

    // Update the base effect
    if (this.baseEffect.update) {
      this.baseEffect.update(deltaTime, canvasWidth, canvasHeight);
    }
  }

  /**
   * Draw layered zoom effect
   *
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D rendering context
   * @param {number} canvasWidth - Canvas width in pixels
   * @param {number} canvasHeight - Canvas height in pixels
   */
  draw(ctx, canvasWidth, canvasHeight) {
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    // --- Frame buffer: render base effect ONCE per frame ----------------------
    // Allocate or resize the off-screen buffer to match the current canvas size.
    if (!this._frameCanvas) {
      this._frameCanvas = document.createElement('canvas');
      this._frameCanvas.width  = canvasWidth;
      this._frameCanvas.height = canvasHeight;
      this._frameCtx = this._frameCanvas.getContext('2d');
    } else if (this._frameCanvas.width !== canvasWidth || this._frameCanvas.height !== canvasHeight) {
      this._frameCanvas.width  = canvasWidth;
      this._frameCanvas.height = canvasHeight;
    }

    // Draw the base effect into the buffer at full opacity.
    // Each zoom layer will stamp this buffer at its own scale / opacity via
    // drawImage — a single GPU blit instead of re-executing the full draw path.
    this._frameCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    if (this.baseEffect.draw) {
      this._frameCtx.globalAlpha = 1.0;
      this.baseEffect.draw(this._frameCtx, canvasWidth, canvasHeight);
    }
    // --------------------------------------------------------------------------

    // Calculate current progress in animation cycle (0-1)
    const cycleProgress = (this._elapsedTime % this.duration) / this.duration;

    // Draw layers from back to front (smallest to largest scale)
    for (let i = 0; i < this.layers; i++) {
      // Stagger each layer's timing
      // If layerIndex is set, use it for offset (multi-instance mode)
      // Otherwise use loop index (single-instance multi-layer mode)
      const layerOffset = this.layerIndex !== null
        ? this.layerIndex / this.totalLayers
        : i / this.layers;
      const layerProgress = (cycleProgress + layerOffset) % 1.0;

      // Calculate scale for this layer
      const scale = this.scaleFrom + (this.scaleTo - this.scaleFrom) * layerProgress;

      // Calculate opacity with fade-in and fade-out
      let opacity = 1.0;
      const fadeInThreshold = this.opacityFadeIn / 100;
      const fadeOutThreshold = this.opacityFadeOut / 100;

      if (layerProgress < fadeInThreshold) {
        // Fade in
        opacity = layerProgress / fadeInThreshold;
      } else if (layerProgress > fadeOutThreshold) {
        // Fade out
        opacity = 1.0 - ((layerProgress - fadeOutThreshold) / (1.0 - fadeOutThreshold));
      }

      // Skip fully transparent layers
      if (opacity <= 0) continue;

      ctx.save();

      // Apply layer transform (scale from center)
      ctx.translate(centerX, centerY);
      ctx.scale(scale, scale);
      ctx.translate(-centerX, -centerY);

      // Apply layer opacity and stamp the pre-rendered frame buffer.
      // drawImage is a single GPU blit — far cheaper than re-running the
      // full baseEffect draw path for each layer.
      ctx.globalAlpha = opacity;
      ctx.drawImage(this._frameCanvas, 0, 0);

      ctx.restore();
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.baseEffect && this.baseEffect.destroy) {
      this.baseEffect.destroy();
    }
    this._frameCanvas = null;
    this._frameCtx = null;
  }
}
