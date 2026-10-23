import { lcardsLog } from '../../../../utils/lcards-logging.js';
import { numProp } from './animatable-props.js';

/**
 * BaseEffect - Abstract base class for all background animation effects
 *
 * Provides lifecycle management, animatable properties, and Canvas2D integration.
 * All effects should extend this class and implement the draw() method.
 *
 * What anime.js and entity bindings may change on a live effect is declared
 * in `static animatableProps` (keyed by YAML config key, see
 * animatable-props.js); the effect adapter (../effect-adapter.js) reads it.
 * Every effect has `opacity` and `speed` (a time multiplier every effect
 * honours); `x`, `y`, `scale`, `rotate` are applied by Canvas2DRenderer
 * around the effect's draw (see EffectHandle), not by the effect.
 *
 * `position`, `rotation` and `scale` below are older per-effect transforms
 * that only GridEffect and SolidEffect apply (applyTransforms()).
 *
 * @class BaseEffect
 */
export class BaseEffect {
  /** @type {Record<string, import('./animatable-props.js').AnimatableProp>} */
  static animatableProps = {
    opacity: numProp('opacity', { min: 0, max: 1 }),
    speed: numProp('speed', { min: 0 })
  };

  /**
   * @param {Object} config - Effect configuration
   * @param {number} [config.opacity=1] - Initial opacity (0-1)
   * @param {number} [config.speed=1] - Initial speed multiplier
   * @param {Object} [config.position] - Initial position { x, y }
   * @param {number} [config.rotation=0] - Initial rotation in radians
   * @param {number} [config.scale=1] - Initial scale multiplier
   */
  constructor(config = {}) {
    this.config = config;

    // Animatable properties
    this.opacity = config.opacity ?? 1;
    this.speed = config.speed ?? 1;
    this.position = config.position ?? { x: 0, y: 0 };
    this.rotation = config.rotation ?? 0;
    this.scale = config.scale ?? 1;

    // Internal state
    this._isActive = true;
    this._elapsedTime = 0;

    lcardsLog.debug(`[BaseEffect] Created ${this.constructor.name}`, {
      opacity: this.opacity,
      speed: this.speed,
      position: this.position
    });
  }

  /**
   * Update effect state (called every frame)
   * Override this method to implement custom animation logic. The elapsed
   * clock runs at `speed`; subclasses that move by deltaTime multiply by
   * `this.speed` themselves.
   *
   * @param {number} deltaTime - Time since last update in milliseconds
   * @param {number} canvasWidth - Canvas width in pixels
   * @param {number} canvasHeight - Canvas height in pixels
   */
  update(deltaTime, canvasWidth, canvasHeight) {
    this._elapsedTime += deltaTime * this.speed;
    // Subclasses override to implement custom update logic
  }

  /**
   * Draw effect to canvas (MUST be implemented by subclasses)
   *
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D rendering context
   * @param {number} canvasWidth - Canvas width in pixels
   * @param {number} canvasHeight - Canvas height in pixels
   */
  draw(ctx, canvasWidth, canvasHeight) {
    throw new Error('BaseEffect.draw() must be implemented by subclass');
  }

  /**
   * Apply common transforms (position, rotation, scale, opacity)
   * Call this at the start of draw() to apply base transforms
   *
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D rendering context
   */
  applyTransforms(ctx) {
    ctx.globalAlpha = this.opacity;

    if (this.position.x !== 0 || this.position.y !== 0) {
      ctx.translate(this.position.x, this.position.y);
    }

    if (this.rotation !== 0) {
      ctx.rotate(this.rotation);
    }

    if (this.scale !== 1) {
      ctx.scale(this.scale, this.scale);
    }
  }

  /**
   * Check if effect is still active
   * @returns {boolean}
   */
  isActive() {
    return this._isActive;
  }

  /**
   * Deactivate effect (will be removed on next frame)
   */
  deactivate() {
    this._isActive = false;
    lcardsLog.debug(`[BaseEffect] Deactivated ${this.constructor.name}`);
  }

  /**
   * Cleanup resources (called when effect is removed)
   * Override this to cleanup custom resources
   */
  destroy() {
    this._isActive = false;
    lcardsLog.debug(`[BaseEffect] Destroyed ${this.constructor.name}`);
  }

  /**
   * Get elapsed time since effect creation
   * @returns {number} Elapsed time in milliseconds
   */
  getElapsedTime() {
    return this._elapsedTime;
  }
}
