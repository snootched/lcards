/**
 * @fileoverview SolidEffect — flat single-colour fill across the full background
 * canvas. Renders behind base_svg (background_animation is z-index -1, base_svg
 * is z-index 0), letting a color tint show through base_svg's transparent
 * regions without tinting base_svg's own artwork.
 *
 * @module core/packs/backgrounds/effects/SolidEffect
 */

import { BaseEffect } from './BaseEffect.js';
import { ColorUtils } from '../../../themes/ColorUtils.js';
import { lcardsLog } from '../../../../utils/lcards-logging.js';

/**
 * Draws a single flat-colour rectangle across the full background canvas.
 *
 * No animation state of its own — BaseEffect.update()'s default (elapsed-time
 * bookkeeping only) is already correct for static content.
 *
 * @extends BaseEffect
 */
export class SolidEffect extends BaseEffect {
  /**
   * @param {Object} config
   * @param {string} [config.color='rgba(0, 0, 0, 0.4)'] - Fill colour. Accepts
   *   concrete colours, var() references, and theme:/computed tokens
   *   (alpha/darken/lighten) — resolved via the two-step Canvas2D colour
   *   pattern (see GridEffect.js).
   * @param {number} [config.opacity=1] - BaseEffect-managed opacity multiplier
   *   (animatable via anime.js targeting `effect.opacity`); multiplies with any
   *   alpha already baked into `color`.
   */
  constructor(config = {}) {
    super(config);

    // Two-step colour resolution — mandatory for Canvas2D fillStyle since raw
    // config values may be theme: tokens, var() refs, or computed expressions
    // like alpha(var(--x), 0.N).
    const _resolver = window.lcards?.core?.themeManager?.resolver;
    const _resolve = (c) => ColorUtils.resolveCssVariable(
        (_resolver ? _resolver.resolve(c, c) : c), c);

    this.color = _resolve(config.color ?? 'rgba(0, 0, 0, 0.4)');

    lcardsLog.debug('[SolidEffect] Created solid fill effect', {
      color: this.color,
      opacity: this.opacity
    });
  }

  /**
   * Draw the flat fill. Canvas2DRenderer does not save/restore or set globalAlpha
   * for us — each effect isolates its own ctx state.
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} canvasWidth
   * @param {number} canvasHeight
   */
  draw(ctx, canvasWidth, canvasHeight) {
    ctx.save();
    this.applyTransforms(ctx);
    ctx.fillStyle = this.color;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.restore();
  }
}
