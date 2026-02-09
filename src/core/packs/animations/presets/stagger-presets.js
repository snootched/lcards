/**
 * Stagger Animation Presets
 *
 * Staggered animations using anime.js v4 stagger() helper.
 * These presets animate multiple elements with progressive delays.
 *
 * Stagger presets are ideal for:
 * - Grid animations (alert bars, data grids)
 * - List reveals
 * - Ripple effects
 * - Coordinated multi-element transitions
 *
 * @module core/packs/animations/presets/stagger-presets
 */

import { lcardsLog } from '../../../../utils/lcards-logging.js';

/**
 * Stagger animation presets
 * Each preset returns a stagger configuration that AnimationManager will execute
 */
export const STAGGER_PRESETS = {
  /**
   * Stagger Grid - Grid-based stagger with from parameter
   * 
   * Staggers animation across elements arranged in a grid pattern.
   * Supports directional wave from center, edges, or specific corners.
   *
   * Parameters:
   * - grid (required) - Grid dimensions [cols, rows] (e.g., [6, 1] for alert bars)
   * - from (default: 'start') - Start position:
   *   - 'start' - Top-left to bottom-right
   *   - 'end' - Bottom-right to top-left
   *   - 'center' - Center outward
   *   - 'edges' - Edges inward
   *   - [x, y] - Custom grid position (0-indexed)
   * - delay (default: 100) - Delay between elements in ms
   * - property (default: 'scale') - Property to animate
   * - from_value (default: 0.8) - Starting value
   * - to_value (default: 1) - Ending value
   * - duration (default: 600)
   * - easing (default: 'easeOutQuad')
   * - loop (default: false)
   *
   * Example (Alert bars):
   * {
   *   preset: 'stagger-grid',
   *   targets: "[id^='bar-top-'], [id^='bar-bottom-']",
   *   params: { grid: [6, 2], from: 'center', delay: 50 }
   * }
   */
  'stagger-grid': (def) => {
    const p = def.params || def;
    const grid = p.grid || [1, 1];
    const from = p.from || 'start';
    const delay = p.delay !== undefined ? p.delay : 100;
    const property = p.property || 'scale';
    const fromValue = p.from_value !== undefined ? p.from_value : 0.8;
    const toValue = p.to_value !== undefined ? p.to_value : 1;
    const duration = p.duration || 600;
    const easing = p.easing || 'easeOutQuad';
    const loop = p.loop !== undefined ? p.loop : false;

    if (!Array.isArray(grid) || grid.length !== 2) {
      lcardsLog.warn('[stagger-grid preset] Invalid grid parameter, expected [cols, rows]');
      return { anime: {}, styles: {} };
    }

    return {
      anime: {
        [property]: [fromValue, toValue],
        duration,
        easing,
        loop,
        delay: {
          _stagger: true,
          value: delay,
          grid,
          from
        }
      },
      styles: {
        transformOrigin: 'center',
        transformBox: 'fill-box'
      }
    };
  },

  /**
   * Stagger Wave - Wave effect across elements
   * 
   * Creates a wave-like animation across a linear sequence of elements.
   * Perfect for horizontal/vertical lists or rows.
   *
   * Parameters:
   * - delay (default: 100) - Delay between elements in ms
   * - direction (default: 'normal') - Wave direction ('normal' or 'reverse')
   * - property (default: 'translateY') - Property to animate
   * - amplitude (default: -20) - Wave amplitude (distance)
   * - duration (default: 800)
   * - easing (default: 'easeOutElastic')
   * - loop (default: false)
   * - alternate (default: true)
   *
   * Example:
   * {
   *   preset: 'stagger-wave',
   *   targets: '.list-item',
   *   params: { delay: 80, amplitude: -30, direction: 'normal' }
   * }
   */
  'stagger-wave': (def) => {
    const p = def.params || def;
    const delay = p.delay !== undefined ? p.delay : 100;
    const direction = p.direction || 'normal';
    const property = p.property || 'translateY';
    const amplitude = p.amplitude !== undefined ? p.amplitude : -20;
    const duration = p.duration || 800;
    const easing = p.easing || 'easeOutElastic';
    const loop = p.loop !== undefined ? p.loop : false;
    const alternate = p.alternate !== undefined ? p.alternate : false;

    return {
      anime: {
        [property]: [0, amplitude, 0],
        duration,
        easing,
        loop,
        alternate,
        delay: {
          _stagger: true,
          value: delay,
          direction: direction === 'reverse' ? 'reverse' : 'normal'
        }
      },
      styles: {}
    };
  },

  /**
   * Stagger Radial - Radial stagger from center/custom point
   * 
   * Staggers animation in a radial pattern outward from a center point.
   * Useful for ripple effects and circular layouts.
   *
   * Parameters:
   * - from (default: 'center') - Start position:
   *   - 'center' - Center of bounding box
   *   - [x, y] - Custom position in pixels
   * - delay (default: 50) - Base delay between rings in ms
   * - property (default: 'scale') - Property to animate
   * - from_value (default: 0) - Starting value
   * - to_value (default: 1) - Ending value
   * - duration (default: 800)
   * - easing (default: 'easeOutExpo')
   * - loop (default: false)
   *
   * Example:
   * {
   *   preset: 'stagger-radial',
   *   targets: '.dot',
   *   params: { from: 'center', delay: 40, property: 'opacity' }
   * }
   */
  'stagger-radial': (def) => {
    const p = def.params || def;
    const from = p.from || 'center';
    const delay = p.delay !== undefined ? p.delay : 50;
    const property = p.property || 'scale';
    const fromValue = p.from_value !== undefined ? p.from_value : 0;
    const toValue = p.to_value !== undefined ? p.to_value : 1;
    const duration = p.duration || 800;
    const easing = p.easing || 'easeOutExpo';
    const loop = p.loop !== undefined ? p.loop : false;

    return {
      anime: {
        [property]: [fromValue, toValue],
        duration,
        easing,
        loop,
        delay: {
          _stagger: true,
          _radial: true,
          value: delay,
          from
        }
      },
      styles: {
        transformOrigin: 'center',
        transformBox: 'fill-box'
      }
    };
  }
};
