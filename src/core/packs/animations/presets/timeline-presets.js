/**
 * Timeline Animation Presets
 *
 * Coordinated multi-step animations using anime.js v4 timeline system.
 * These presets create sequences of animations that run in a specific order.
 *
 * Timeline presets are ideal for:
 * - Attention-getting effects
 * - Multi-step transitions
 * - Coordinated UI changes
 * - Sequential reveals
 *
 * @module core/packs/animations/presets/timeline-presets
 */

import { lcardsLog } from '../../../../utils/lcards-logging.js';

/**
 * Timeline animation presets
 * Each preset returns a timeline configuration that AnimationManager will execute
 */
export const TIMELINE_PRESETS = {
  /**
   * Timeline Cascade - Sequential coordinated animations
   * 
   * Runs multiple animations in sequence with configurable timing.
   * Useful for revealing multiple elements or creating step-by-step effects.
   *
   * Parameters:
   * - steps (required) - Array of animation steps, each with:
   *   - targets (string) - CSS selector for this step
   *   - params (object) - Animation parameters (scale, opacity, etc.)
   *   - duration (number) - Step duration
   *   - offset (string) - Timeline offset ('+=' for delay, '<' for overlap)
   * - loop (default: false)
   *
   * Example:
   * {
   *   preset: 'timeline-cascade',
   *   params: {
   *     steps: [
   *       { targets: '.step-1', params: { opacity: [0, 1] }, duration: 300, offset: 0 },
   *       { targets: '.step-2', params: { opacity: [0, 1] }, duration: 300, offset: '+=100' },
   *       { targets: '.step-3', params: { opacity: [0, 1] }, duration: 300, offset: '+=100' }
   *     ]
   *   }
   * }
   */
  'timeline-cascade': (def) => {
    const p = def.params || def;
    const steps = p.steps || [];
    const loop = p.loop !== undefined ? p.loop : false;

    if (!steps.length) {
      lcardsLog.warn('[timeline-cascade preset] No steps provided');
      return { anime: {}, styles: {} };
    }

    return {
      anime: {
        _timeline: true,
        steps,
        loop
      },
      styles: {}
    };
  },

  /**
   * Timeline Attention - Attention-getting sequence
   * 
   * Pre-configured sequence: scale up → shake → settle back.
   * Perfect for drawing attention to important elements.
   *
   * Parameters:
   * - scale_max (default: 1.15) - Maximum scale during attention
   * - shake_intensity (default: 5) - Shake distance in pixels
   * - duration_scale (default: 200) - Duration of scale phase
   * - duration_shake (default: 300) - Duration of shake phase
   * - duration_settle (default: 400) - Duration of settle phase
   * - loop (default: false)
   *
   * Example:
   * {
   *   preset: 'timeline-attention',
   *   targets: '.alert-badge',
   *   params: { scale_max: 1.2, shake_intensity: 8 }
   * }
   */
  'timeline-attention': (def) => {
    const p = def.params || def;
    const scaleMax = p.scale_max !== undefined ? p.scale_max : 1.15;
    const shakeIntensity = p.shake_intensity !== undefined ? p.shake_intensity : 5;
    const durationScale = p.duration_scale || 200;
    const durationShake = p.duration_shake || 300;
    const durationSettle = p.duration_settle || 400;
    const loop = p.loop !== undefined ? p.loop : false;

    // Build timeline steps
    const steps = [
      // Step 1: Scale up
      {
        params: {
          scale: [1, scaleMax],
          easing: 'easeOutQuad'
        },
        duration: durationScale,
        offset: 0
      },
      // Step 2: Shake while scaled
      {
        params: {
          translateX: [0, shakeIntensity, -shakeIntensity, shakeIntensity, 0],
          easing: 'easeInOutSine'
        },
        duration: durationShake,
        offset: '<' // Start immediately after previous
      },
      // Step 3: Settle back to normal
      {
        params: {
          scale: [scaleMax, 1],
          easing: 'easeInOutQuad'
        },
        duration: durationSettle,
        offset: '<'
      }
    ];

    return {
      anime: {
        _timeline: true,
        steps,
        loop
      },
      styles: {
        transformOrigin: 'center',
        transformBox: 'fill-box'
      }
    };
  }
};
