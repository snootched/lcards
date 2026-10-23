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
import { resolvePresetParams, getResolvedEasing } from '../../../../utils/lcards-anim-helpers.js';
import { resolveColor as resolveConfiguredColor } from '../../../themes/resolve-color.js';
import { prefersReducedMotion } from '../../../../utils/reduced-motion.js';

/**
 * Tracks the currently-active WAAPI Animation created by 'stagger-flash' for
 * each element, keyed by element so a later re-registration (e.g. a preset
 * switch that re-runs setup() on the SAME still-attached elements, before a
 * fresh SVG render replaces them) can cancel the previous animation instead
 * of leaving two Animations racing on the same property. AnimationManager
 * tracks each animation through a staggerFlashHandle (stop, reduced motion,
 * re-renders); this map is the safety net for a re-registration the manager
 * did not stop, such as a re-render replaying the animation on the same element.
 * @type {WeakMap<Element, Animation>}
 */
const _activeStaggerFlashAnimations = new WeakMap();

/**
 * A handle AnimationManager can track for one element's stagger-flash WAAPI
 * animation (see _reportPresetInstances in lcards-anim-helpers.js). setup() returns
 * it at once; the real Animation attaches a tick later, when _applyWapi knows every
 * element. A stop or a reduced-motion settle that comes first cancels it before it
 * starts. revert()/cancel() remove the animation's effect (fill: both), restoring the
 * element; targets lets a card re-render keep it running when the element survives.
 * @param {Element} element
 * @param {boolean} loop
 */
function staggerFlashHandle(element, loop) {
  return {
    targets: [element],
    /** @type {Animation|null} */
    animation: null,
    cancelled: false,
    completed: false,
    iterationCount: loop ? Infinity : 1,
    get currentTime() { return Number(this.animation?.currentTime) || 0; },
    get speed() { return this.animation?.playbackRate ?? 1; },
    set speed(v) { if (this.animation) this.animation.playbackRate = v; },
    seek(time) { if (this.animation) this.animation.currentTime = time; return this; },
    pause() { this.animation?.pause(); return this; },
    complete() { this.animation?.finish(); this.cancelled = true; this.completed = true; return this; },
    cancel() { this.animation?.cancel(); this.cancelled = true; this.completed = true; return this; },
    revert() { return this.cancel(); },
  };
}

/**
 * The optional anime.js v4 stagger extras a preset passes through to its marker:
 * reversed order, random jitter (ms, or a [start, end] ramp) and a seed that makes
 * jitter and from: 'random' the same on every load.
 * @param {Record<string, any>} p - resolved preset params
 */
function staggerExtras(p) {
  /** @type {Record<string, any>} */
  const extras = {};
  if (p.reversed === true) extras.reversed = true;
  if (p.jitter !== undefined) extras.jitter = p.jitter;
  if (p.seed !== undefined) extras.seed = p.seed;
  return extras;
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
   * - from (default: 'first') - Start position:
   *   - 'first' (alias 'start') - Top-left to bottom-right
   *   - 'last' (alias 'end') - Bottom-right to top-left
   *   - 'center' - Center outward
   *   - 'edges' - Edges inward
   *   - 'random' - Random order (reproducible with seed)
   *   - [col, row] - A grid cell (0-indexed)
   * - axis (optional) - 'x' / 'row' or 'y' / 'column': stagger along one axis only
   * - reversed, jitter, seed (optional) - see staggerExtras()
   * - delay (default: 100) - Delay between elements in ms
   * - property (default: 'scale') - Property to animate
   * - from_value (default: 0.8) - Starting value
   * - to_value (default: 1) - Ending value
   * - duration (default: 600)
   * - ease (default: 'outQuad')
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
    const p = resolvePresetParams(def);
    const grid = p.grid || [1, 1];
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
    // anime.js reads an array `from` as 0 to 1 fractions of the grid; this preset
    // documents a 0-indexed [col, row] cell
    const from = Array.isArray(p.from)
      ? p.from.map((cell, i) => (grid[i] > 1 ? cell / (grid[i] - 1) : 0))
      : (p.from || 'first');

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
          from,
          ...(p.axis !== undefined ? { axis: p.axis } : {}),
          ...staggerExtras(p)
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
   * - reversed (default: false) - Run the wave from the last element
   * - direction (legacy) - 'reverse' is the same as reversed: true
   * - jitter, seed (optional) - see staggerExtras()
   * - property (default: 'translateY') - Property to animate
   * - amplitude (default: -20) - Wave amplitude (distance)
   * - duration (default: 800)
   * - ease (default: 'outElastic')
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
    const p = resolvePresetParams(def);
    const delay = p.delay !== undefined ? p.delay : 100;
    const property = p.property || 'translateY';
    const amplitude = p.amplitude !== undefined ? p.amplitude : -20;
    const duration = p.duration || 800;
    const ease = getResolvedEasing(p) || 'outElastic'; // v4 easing name (was 'easeOutElastic')
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
          ...staggerExtras({ ...p, reversed: p.reversed === true || p.direction === 'reverse' })
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
   * - from (default: 'center') - Start position, measured on the targets' layout
   *   positions (stagger grid: true):
   *   - 'center' - Center of the group
   *   - 'first' / 'last' / 'random'
   *   - [x, y] - A point as fractions of the group (0 to 1, [0, 0] = top-left)
   * - reversed, jitter, seed (optional) - see staggerExtras()
   * - delay (default: 50) - Base delay between rings in ms
   * - property (default: 'scale') - Property to animate
   * - from_value (default: 0) - Starting value
   * - to_value (default: 1) - Ending value
   * - duration (default: 800)
   * - ease (default: 'outExpo')
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
    const p = resolvePresetParams(def);
    const from = p.from || 'center';
    const delay = p.delay !== undefined ? p.delay : 50;
    const property = p.property || 'scale';
    const fromValue = p.from_value !== undefined ? p.from_value : 0;
    const toValue = p.to_value !== undefined ? p.to_value : 1;
    const duration = p.duration || 800;
    const ease = getResolvedEasing(p) || 'outExpo'; // v4 easing name (was 'easeOutExpo')
    const loop = p.loop !== undefined ? p.loop : false;

    return {
      anime: {
        [property]: [fromValue, toValue],
        duration,
        ease,
        loop,
        delay: {
          _stagger: true,
          value: delay,
          grid: true,  // distances from the targets' real positions
          from,
          ...staggerExtras(p)
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
    const p = resolvePresetParams(def);
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

    // WAAPI keyframes need concrete colours (theme: tokens, computed
    // expressions and CSS variables all resolved at registration time).
    const resolveColor = (c) => resolveConfiguredColor(c, { concrete: true });

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
      // AnimationManager settles the handles under reduced motion (they arrive
      // cancelled); this also covers callers outside the manager
      if (prefersReducedMotion()) {
        _pending.length = 0;
        return;
      }
      const N = _pending.length;
      _pending.splice(0).forEach(({ el, handle }, i) => {
        if (handle.cancelled) return; // stopped before it started
        let idx;
        if      (from === 'last')   idx = N - 1 - i;
        else if (from === 'center') idx = Math.abs(i - Math.floor((N - 1) / 2));
        else                        idx = i; // 'first' or default

        // Cancel any previous stagger-flash animation still running on this
        // element (e.g. a preset switch re-registered before a fresh SVG
        // render replaced the element) — otherwise both Animations keep
        // compositing on the same property and whichever's internal frame
        // callback last touches the element (wall-clock, not registration
        // order) wins, leaving stale colors from an earlier mode/preset.
        _activeStaggerFlashAnimations.get(el)?.cancel();

        const animation = el.animate(wapiKeyframes, {
          duration,
          delay:      idx * step,
          iterations: loop ? Infinity : 1,
          fill:       'both',
          easing:     'linear'  // overall composite; per-keyframe easing handles the shape
        });
        _activeStaggerFlashAnimations.set(el, animation);
        handle.animation = animation;
        animation.addEventListener('finish', () => { handle.completed = true; });
        animation.addEventListener('cancel', () => {
          // Don't clobber a newer animation's entry if this cancel fired
          // asynchronously after another setup() already replaced it.
          if (_activeStaggerFlashAnimations.get(el) === animation) {
            _activeStaggerFlashAnimations.delete(el);
          }
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
        const handle = staggerFlashHandle(element, !!loop);
        _pending.push({ el: element, handle });
        // Tracked by AnimationManager: stop, reduced motion and re-renders reach it
        /** @type {any} */ (element)._presetInstances = [handle];
        clearTimeout(_timer);
        _timer = setTimeout(_applyWapi, 0);
      },
      styles: {}
    };
  }
};
