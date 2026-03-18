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
import { resolveEasing } from '../../../../utils/lcards-anim-helpers.js';

/**
 * Helper function to resolve easing configuration
 */
function getResolvedEasing(params) {
  if (params.ease_params) {
    return resolveEasing({ type: params.ease, params: params.ease_params });
  }
  return params.ease;
}

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
   * - ease (default: 'easeOutQuad')
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
    const ease = getResolvedEasing(p) || 'outQuad';   // v4 easing name (was 'easeOutQuad')
    const loop = p.loop !== undefined ? p.loop : false;
    const alternate = p.alternate !== undefined ? p.alternate : false;

    if (!Array.isArray(grid) || grid.length !== 2) {
      lcardsLog.warn('[stagger-grid preset] Invalid grid parameter, expected [cols, rows]');
      return { anime: {}, styles: {} };
    }

    return {
      anime: {
        [property]: [fromValue, toValue],
        duration,
        ease,
        loop,
        alternate,
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
   * - ease (default: 'easeOutElastic')
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
    const ease = getResolvedEasing(p) || 'easeOutElastic';
    const loop = p.loop !== undefined ? p.loop : false;
    const alternate = p.alternate !== undefined ? p.alternate : false;

    return {
      anime: {
        [property]: [0, amplitude, 0],
        duration,
        ease,
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
   * - ease (default: 'easeOutExpo')
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
    const ease = getResolvedEasing(p) || 'easeOutExpo';
    const loop = p.loop !== undefined ? p.loop : false;

    return {
      anime: {
        [property]: [fromValue, toValue],
        duration,
        ease,
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
  },

  /**
   * Stagger Flash - Chasing "flash bar" effect (LCARS alert style)
   *
   * Replicates the legacy CB-LCARS alert bar animation: a bright "lead" color
   * chases across elements, followed by a slow fade to the dim "trail" color.
   *
   * Directly mirrors the legacy @keyframes flashLine CSS animation:
   *   0%        → lead_color,  opacity 1           (snap)
   *   lead_pct% → trail_color, opacity 1           (ease-in-out)
   *   100%      → trail_color, opacity trail_opacity (ease-in-out, stays dim)
   *
   * KEY DESIGN: uses the Web Animations API (element.animate()) inside setup()
   * instead of anime.js for the actual looping. WAAPI loops each element
   * independently — exactly like CSS animation-iteration-count:infinite — so
   * there is NO group-restart synchronisation point and NO periodic jerk.
   *
   * The anime: block carries delay._stagger:true so animateElement routes
   * through the stagger-batch path (calling setup() once per element from a
   * single shared preset invocation). Anime.js runs as a harmless 1ms no-op.
   *
   * Parameters:
   * - lead_color   (default: 'var(--primary-color)') - Bright flash color (0%)
   * - trail_color  (default: '#444444')               - Dim trailing color (20%–100%)
   * - lead_pct     (default: 20)     - % of cycle spent snapping to trail (1–50)
   * - delay        (default: duration/12) - Stagger step between elements in ms
   * - grid         (optional)        - Grid dimensions [cols, rows] for position
   * - from         (default: 'first')- Stagger origin: 'first', 'last', 'center'
   * - property     (default: 'stroke')- CSS/SVG property to animate
   * - with_opacity (default: true)   - Also fade opacity to trail_opacity
   * - trail_opacity(default: 0.25)   - Opacity at 100% of cycle
   * - duration     (default: 2000)   - Total cycle duration in ms
   * - loop         (default: true)
   */
  'stagger-flash': (def) => {
    const p = def.params || def;
    const leadColor    = p.lead_color  || 'var(--primary-color)';
    const trailColor   = p.trail_color || '#444444';
    const leadPct      = Math.min(50, Math.max(1, p.lead_pct !== undefined ? p.lead_pct : 20));
    const duration     = p.duration || 2000;
    // Stagger step = duration/12, matching legacy flashLine delay formula:
    //   delays[i] = i * (animation_duration / 12)
    const step         = p.delay !== undefined ? p.delay : Math.round(duration / 12);
    const from         = p.from || 'first';
    const property     = p.property || 'stroke';
    const withOpacity  = p.with_opacity !== undefined ? p.with_opacity : true;
    const trailOpacity = p.trail_opacity !== undefined ? p.trail_opacity : 0.25;
    const loop         = p.loop !== undefined ? p.loop : true;

    // Resolve theme: tokens, computed colour expressions (including those with var() args),
    // and plain CSS variables at registration time so WAAPI gets concrete hex/rgb values.
    // Delegates to ThemeTokenResolver (the canonical resolution path) which handles
    // theme: tokens and computed expressions; falls back to resolveCssVariable for plain var().
    const resolveColor = (c) => {
      if (typeof c !== 'string') return c;
      const resolver = window.lcards?.core?.themeManager?.resolver;
      if (resolver) {
        const out = resolver.resolve(c, c);
        if (out !== c) return out;
      }
      // Plain CSS variable (resolver doesn't handle bare var() strings)
      if (c.includes('var(')) {
        return window.lcards?.utils?.ColorUtils?.resolveCssVariable?.(c) ?? c;
      }
      return c;
    };

    const rLead  = resolveColor(leadColor);
    const rTrail = resolveColor(trailColor);

    // WAAPI keyframes — per-keyframe easing matches CSS animation-timing-function
    // applying to each keyframe-to-keyframe segment (0→lead_pct and lead_pct→100).
    const wapiKeyframes = [
      { [property]: rLead,  ...(withOpacity ? { opacity: 1            } : {}), offset: 0,            easing: 'ease-in-out' },
      { [property]: rTrail, ...(withOpacity ? { opacity: 1            } : {}), offset: leadPct / 100, easing: 'ease-in-out' },
      { [property]: rTrail, ...(withOpacity ? { opacity: trailOpacity } : {}), offset: 1 }
    ];

    // Collect elements synchronously, then apply WAAPI after all setup() calls
    // complete (deferred so we know N for 'from:last'/'center' reversal).
    const _pending = [];
    let _timer = null;

    const _applyWapi = () => {
      const N = _pending.length;
      _pending.splice(0).forEach((el, i) => {
        let idx;
        if      (from === 'last')   idx = N - 1 - i;
        else if (from === 'center') idx = Math.abs(i - Math.floor((N - 1) / 2));
        else                        idx = i; // 'first' or default
        el.animate(wapiKeyframes, {
          duration,
          delay:      idx * step,
          iterations: loop ? Infinity : 1,
          fill:       'both',
          easing:     'linear'  // overall composite; per-keyframe easing handles the shape
        });
      });
    };

    return {
      // Trigger stagger-batch path so setup() is called once per element from a
      // single shared invocation (correct _pending closure). duration:1 + loop:false
      // makes the anime.js call a harmless 1ms no-op; WAAPI does all visual work.
      anime: {
        delay: { _stagger: true, value: step, from, ...(Array.isArray(p.grid) ? { grid: p.grid } : {}) },
        duration: 1,
        loop: false
      },
      // Called per-element (DOM order) by the stagger-batch path.
      setup: (element) => {
        _pending.push(element);
        clearTimeout(_timer);
        _timer = setTimeout(_applyWapi, 0);
      },
      styles: {}
    };
  }
};
