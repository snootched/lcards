import { lcardsLog } from '../../../../utils/lcards-logging.js';

/**
 * Canvas2DRenderer - Manages multiple Canvas2D effects with additive composition
 *
 * Coordinates multiple effects rendered to a single canvas with one animation loop.
 * Effects are rendered in order (first added = bottom layer, last added = top layer).
 *
 * @class Canvas2DRenderer
 */
export class Canvas2DRenderer {
  /**
   * @param {HTMLCanvasElement} canvas - Canvas element to render to
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.effects = []; // Array of BaseEffect instances
    this._animationId = null;
    this._lastFrameTime = performance.now();
    this._isRunning = false;
    this._shouldReduceEffects = false;
    this._frameSkipCounter = 0;
    this._perfCheckHandler = null;

    lcardsLog.info('[Canvas2DRenderer] Initialized', {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height
    });
  }

  /**
   * Add an effect to the renderer
   * Effects are rendered in the order they are added (first = bottom layer)
   *
   * @param {BaseEffect} effect - Effect instance to add
   */
  addEffect(effect) {
    this.effects.push(effect);

    lcardsLog.debug('[Canvas2DRenderer] Added effect', {
      effectType: effect.constructor.name,
      totalEffects: this.effects.length
    });
  }

  /**
   * Remove an effect from the renderer
   *
   * @param {BaseEffect} effect - Effect instance to remove
   */
  removeEffect(effect) {
    const index = this.effects.indexOf(effect);
    if (index !== -1) {
      this.effects.splice(index, 1);
      effect.destroy();
      lcardsLog.debug('[Canvas2DRenderer] Removed effect', {
        effectType: effect.constructor.name,
        totalEffects: this.effects.length
      });
    }
  }

  /**
   * Remove all effects and stop animation
   */
  clear() {
    lcardsLog.debug('[Canvas2DRenderer] Clearing all effects');
    this.effects.forEach(effect => effect.destroy());
    this.effects = [];
    this.stop();
  }

  /**
   * Start animation loop
   */
  start() {
    if (this._isRunning) {
      lcardsLog.warn('[Canvas2DRenderer] Already running, ignoring start()');
      return;
    }

    this._isRunning = true;
    this._lastFrameTime = performance.now();

    // Wire up PerformanceMonitor for adaptive quality
    if (window.lcards?.core?.performanceMonitor) {
      window.lcards.core.performanceMonitor.start();
      this._perfCheckHandler = (e) => this._onPerfCheck(e.detail);
      window.addEventListener('lcards:performance-check', this._perfCheckHandler);
    }

    this._animate();

    lcardsLog.info('[Canvas2DRenderer] Animation started', {
      effectCount: this.effects.length
    });
  }

  /**
   * Stop animation loop
   */
  stop() {
    if (!this._isRunning) {
      return;
    }

    this._isRunning = false;
    if (this._animationId) {
      cancelAnimationFrame(this._animationId);
      this._animationId = null;
    }

    // Clean up PerformanceMonitor listener
    if (this._perfCheckHandler) {
      window.removeEventListener('lcards:performance-check', this._perfCheckHandler);
      this._perfCheckHandler = null;
    }
    if (window.lcards?.core?.performanceMonitor) {
      window.lcards.core.performanceMonitor.stop();
    }

    lcardsLog.info('[Canvas2DRenderer] Animation stopped');
  }

  /**
   * Handle performance check events from PerformanceMonitor
   * Adapts rendering quality based on measured FPS
   * @private
   */
  _onPerfCheck({ fps, shouldDisable3D, shouldReduceEffects }) {
    this._shouldReduceEffects = shouldReduceEffects;

    if (shouldDisable3D && this._isRunning) {
      lcardsLog.warn(`[Canvas2DRenderer] FPS too low (${fps.toFixed(1)}fps), pausing animation`);
      this.stop();
    } else if (shouldReduceEffects) {
      lcardsLog.debug(`[Canvas2DRenderer] Reduced quality mode (${fps.toFixed(1)}fps)`);
    }
  }

  /**
   * Animation loop - updates and renders all effects
   * @private
   */
  _animate() {
    if (!this._isRunning) {
      return;
    }

    // Adaptive quality: skip every other frame when FPS is low
    if (this._shouldReduceEffects) {
      this._frameSkipCounter++;
      if (this._frameSkipCounter % 2 === 0) {
        this._animationId = requestAnimationFrame(() => this._animate());
        return;
      }
    }

    const currentTime = performance.now();
    const deltaTime = currentTime - this._lastFrameTime;
    this._lastFrameTime = currentTime;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Update and draw each effect
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const effect = this.effects[i];

      // Remove inactive effects
      if (!effect.isActive()) {
        this.removeEffect(effect);
        continue;
      }

      // Update effect state
      effect.update(deltaTime, this.canvas.width, this.canvas.height);

      // Draw effect
      effect.draw(this.ctx, this.canvas.width, this.canvas.height);
    }

    // Request next frame
    this._animationId = requestAnimationFrame(() => this._animate());
  }

  /**
   * Resize canvas (call when container size changes)
   *
   * @param {number} width - New canvas width
   * @param {number} height - New canvas height
   */
  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;

    lcardsLog.debug('[Canvas2DRenderer] Resized canvas', {
      width,
      height
    });
  }

  /**
   * Cleanup renderer and all effects
   */
  destroy() {
    lcardsLog.info('[Canvas2DRenderer] Destroying renderer');
    this.clear();
  }
}
