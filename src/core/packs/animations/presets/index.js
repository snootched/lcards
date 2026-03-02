/**
 * Builtin Animation Presets
 *
 * All builtin animation presets for LCARdS cards.
 * These presets are registered during pack loading.
 *
 * Ported from legacy lcards-anim-presets.js with modernizations:
 * - No direct DOM manipulation (handled by AnimationManager target resolution)
 * - Clean separation of anime.js params and element styles
 * - Support for multi-target animations via AnimationManager
 * - Simplified configuration with smart defaults
 *
 * Each preset returns:
 * {
 *   anime: { ...anime.js parameters },
 *   styles: { ...CSS properties to set on target(s) }
 * }
 *
 * @module core/packs/animations/presets
 */

import { registerAnimationPreset } from '../../../animation/presets.js';
import { lcardsLog } from '../../../../utils/lcards-logging.js';
import { resolveEasing } from '../../../../utils/lcards-anim-helpers.js';
import { TIMELINE_PRESETS } from './timeline-presets.js';
import { STAGGER_PRESETS } from './stagger-presets.js';
import { TEXT_PRESETS } from './text-presets.js';

/**
 * Helper function to resolve easing configuration
 * Handles both string easings and object-based parametric easings
 * @param {string|object} easeConfig - Either a string like 'spring' or an object with { ease, ease_params }
 * @param {object} params - Full params object containing ease and ease_params
 * @returns {string|function} Resolved easing value for anime.js
 */
function getResolvedEasing(params) {
  // If ease_params is present, create config object for resolveEasing
  if (params.ease_params) {
    return resolveEasing({
      type: params.ease,
      params: params.ease_params
    });
  }
  // Otherwise just return the ease string
  return params.ease;
}

/**
 * Register all builtin animation presets
 * Called during pack loading to populate the animation preset registry
 */
export function registerBuiltinAnimationPresets() {
// ==============================================================================
// CORE ANIMATION PRESETS
// ==============================================================================

/**
 * Pulse - Breathing effect with scale and brightness
 *
 * Pulses FROM normal state TO emphasized state, then back.
 * Uses brightness filter to make element glow brighter (not dimmer).
 *
 * Smart behaviors handled by AnimationManager target resolution:
 * - Text overlays: Animate text element (not wrapper)
 * - Button overlays: Animate entire button (default) or specific text elements
 *
 * Parameters:
 * - max_scale (default: 1.15) or scale - How much to grow
 * - max_brightness (default: 1.4) - How much to brighten (1.0 = normal)
 * - duration (default: 1200)
 * - ease (default: 'easeInOutSine')
 * - loop (default: true) - Can be true, false, or a number (e.g., 3 for 3 iterations)
 * - alternate (default: true)
 */
registerAnimationPreset('pulse', (def) => {
  const p = def.params || def;
  const maxScale = p.max_scale !== undefined ? p.max_scale : (p.scale !== undefined ? p.scale : 1.15);
  const maxBrightness = p.max_brightness !== undefined ? p.max_brightness : 1.4;
  const duration = p.duration || 1200;
  const ease = getResolvedEasing(p) || 'easeInOutSine';
  const loop = p.loop !== undefined ? p.loop : true;
  const alternate = p.alternate !== undefined ? p.alternate : true;

  return {
    anime: {
      scale: [1, maxScale],
      filter: [`brightness(1)`, `brightness(${maxBrightness})`],
      duration,
      ease,
      loop,
      alternate,
      complete: (anim) => {
        // Ensure final values after animation completes
        if (anim && anim.animatables && anim.animatables.length > 0) {
          const target = anim.animatables[0].target;
          if (target) {
            // Force remove anime-applied inline styles to return to original CSS
            target.style.removeProperty('filter');
            target.style.removeProperty('transform');
          }
        }
      }
    },
    styles: {
      transformOrigin: 'center',
      transformBox: 'fill-box'
    }
  };
});

/**
 * Fade - Simple opacity transition
 *
 * For change detection (with loop:1, alternate:true), this will:
 * 1. Fade to target opacity (forward)
 * 2. Return to full opacity (alternate/reverse)
 *
 * Parameters:
 * - from (default: 1) - Starting opacity
 * - to (default: 0.3) - Target opacity
 * - duration (default: 1000)
 * - ease (default: 'linear')
 * - loop (default: false) - Can be true, false, or a number (e.g., 3 for 3 iterations)
 * - alternate (default: false)
 */
registerAnimationPreset('fade', (def) => {
  const p = def.params || def;
  const from = p.from !== undefined ? p.from : 1;
  const to = p.to !== undefined ? p.to : 0.3;
  const duration = p.duration || 1000;
  const ease = getResolvedEasing(p) || 'linear';
  const loop = p.loop !== undefined ? p.loop : false;
  const alternate = p.alternate || false;

  return {
    anime: {
      opacity: [from, to],
      duration,
      ease,
      loop,
      alternate,
      complete: alternate ? (anim) => {
        // Ensure element returns to starting opacity after alternate completes
        if (anim.animatables && anim.animatables[0] && anim.animatables[0].target) {
          anim.animatables[0].target.style.opacity = from;
        }
      } : undefined
    },
    styles: {}
  };
});

/**
 * Glow - Animated drop-shadow effect
 *
 * Parameters:
 * - color (default: 'var(--lcars-blue)' or '#66ccff')
 * - glow_color (alias for color)
 * - blur_min (default: 0)
 * - blur_max (default: 10)
 * - duration (default: 1500)
 * - ease (default: 'easeInOutSine')
 * - loop (default: true) - Can be true, false, or a number (e.g., 3 for 3 iterations)
 * - alternate (default: true)
 */
registerAnimationPreset('glow', (def) => {
  const p = def.params || def;
  const color = p.color || p.glow_color || 'var(--lcars-blue, #66ccff)';
  const blurMin = p.blur_min !== undefined ? p.blur_min : 0;
  const blurMax = p.blur_max !== undefined ? p.blur_max : 10;
  const duration = p.duration || 1500;
  const ease = getResolvedEasing(p) || 'easeInOutSine';
  const loop = p.loop !== undefined ? p.loop : true;
  const alternate = p.alternate !== undefined ? p.alternate : true;

  return {
    anime: {
      filter: [
        `drop-shadow(0 0 ${blurMin}px ${color})`,
        `drop-shadow(0 0 ${blurMax}px ${color})`
      ],
      duration,
      ease,
      loop,
      alternate
    },
    styles: {}
  };
});

/**
 * Draw - SVG path drawing animation
 * Uses anime.js v4 createDrawable for robust path animation
 *
 * Parameters:
 * - duration (default: 2000)
 * - ease (default: 'easeInOutSine')
 * - reverse (default: false) - If true, draws from end to start
 * - loop (default: false)
 * - alternate (default: false)
 * - draw (default: ['0 0', '0 1']) - Draw values or config object
 */
registerAnimationPreset('draw', (def) => {
  const p = def.params || def;
  const duration = p.duration || 2000;
  const ease = getResolvedEasing(p) || 'easeInOutSine';
  const reverse = p.reverse || false;
  const loop = p.loop || false;
  const alternate = p.alternate || false;

  // Draw-specific config
  const drawCfg = p.draw || {};
  let drawValues;
  if (Array.isArray(drawCfg)) {
    drawValues = drawCfg;
  } else if (drawCfg && Array.isArray(drawCfg.values)) {
    drawValues = drawCfg.values;
  } else {
    // Default: draw from 0% to 100%
    drawValues = reverse ? ['0 1', '0 0'] : ['0 0', '0 1'];
  }

  return {
    anime: {
      duration,
      ease,
      loop,
      alternate,
      draw: drawValues
    },
    styles: {},
    // Setup function to create drawable target
    setup: (element) => {
      if (!element) return;

      // Use anime.js v4 createDrawable to prepare the path for animation
      if (window.lcards?.animejs?.svg?.createDrawable) {
        const [drawable] = window.lcards.animejs.svg.createDrawable(element);

        // Store drawable reference for animateElement to use
        element._drawable = drawable;
      }
    }
  };
});

/**
 * March - CSS-based marching dashed line animation
 * More performant than anime.js for continuous animations
 *
 * Parameters:
 * - dash_length (optional) - Length of each dash (auto-detected from element's stroke-dasharray if not provided)
 * - gap_length (optional) - Length of each gap (auto-detected from element's stroke-dasharray if not provided)
 * - speed (default: 2) - seconds per cycle (takes precedence)
 * - duration (default: 2000) - milliseconds per cycle (used if speed not provided)
 * - direction (default: 'forward') - 'forward' or 'reverse'
 * - loop (default: true) - true = infinite, false = 1, number = specific count
 *
 * Note: The setup function will auto-detect dash values from the element's stroke-dasharray attribute
 */
registerAnimationPreset('march', (def) => {
  const p = def.params || def;

  // Support both 'speed' (in seconds) and 'duration' (in ms) params
  let speed;
  if (p.speed !== undefined) {
    speed = p.speed; // seconds
  } else if (p.duration !== undefined) {
    speed = p.duration / 1000; // convert ms to seconds
  } else {
    speed = 2; // default 2 seconds
  }

  const direction = p.direction || 'forward';

  // Handle loop parameter (like anime.js)
  let loopValue = p.loop ?? true;
  const iterationCount = loopValue === true ? 'infinite' :
                        (loopValue === false || loopValue === 0) ? '1' :
                        typeof loopValue === 'number' ? Math.max(1, loopValue) : 'infinite';

  // Generate unique animation name (will be used in setup)
  const animId = `march_${Math.random().toString(36).substring(2, 9)}`;
  const animationName = `march_${animId}`;

  // Return CSS animation config with setup function
  return {
    anime: {
      // Special marker for CSS animation
      _cssAnimation: true,
      animationName,
      duration: speed * 1000
    },
    styles: {
      // Note: stroke-dasharray will be preserved from element if already set
      // Animation property will be set in setup after detecting dash values
    },
    // Setup function to inject keyframes into the DOM
    setup: (element) => {
      if (!element) return;

      // Auto-detect dash values from element's stroke-dasharray attribute if not explicitly provided
      let dashLength = p.dash_length;
      let gapLength = p.gap_length;

      if (!dashLength || !gapLength) {
        // Try getAttribute first (SVG attribute)
        let existingDashArray = element.getAttribute('stroke-dasharray');

        // If not found, try computed style
        if (!existingDashArray) {
          const computedStyle = window.getComputedStyle(element);
          existingDashArray = computedStyle.strokeDasharray;
        }

        if (existingDashArray && existingDashArray !== 'none') {
          const parts = existingDashArray.split(/[,\s]+/).map(v => parseFloat(v)).filter(v => !isNaN(v));
          if (parts.length >= 2) {
            dashLength = dashLength || parts[0];
            gapLength = gapLength || parts[1];
          }
        }
      }

      // Fallback to defaults if still not set
      dashLength = dashLength || 10;
      gapLength = gapLength || 5;

      const totalLength = dashLength + gapLength;

      // For seamless infinite loop, animate the full pattern length
      // Start at totalLength and animate to 0 (forward) or start at 0 and animate to totalLength (reverse)
      const keyframesStr = direction === 'reverse'
        ? `@keyframes ${animationName} { from { stroke-dashoffset: 0; } to { stroke-dashoffset: ${totalLength}; } }`
        : `@keyframes ${animationName} { from { stroke-dashoffset: ${totalLength}; } to { stroke-dashoffset: 0; } }`;

      // Set the stroke-dasharray if not already set
      if (!element.getAttribute('stroke-dasharray')) {
        element.style.strokeDasharray = `${dashLength} ${gapLength}`;
      }

      // Apply the animation (starting offset will be set by keyframe 'from')
      element.style.animation = `${animationName} ${speed}s linear ${iterationCount}`;

      // Find the appropriate document to inject styles into
      const targetDoc = element.getRootNode();
      const isInShadowDOM = targetDoc !== document;

      // Inject keyframes
      if (isInShadowDOM && targetDoc.adoptedStyleSheets) {
        // Modern Shadow DOM with Constructable Stylesheets
        try {
          let styleSheet = Array.from(targetDoc.adoptedStyleSheets)
            .find(sheet => sheet.marchAnimations);

          if (!styleSheet) {
            styleSheet = new CSSStyleSheet();
            styleSheet.marchAnimations = true;
            targetDoc.adoptedStyleSheets = [...targetDoc.adoptedStyleSheets, styleSheet];
          }

          styleSheet.insertRule(keyframesStr, styleSheet.cssRules.length);
        } catch (e) {
          lcardsLog.error('[march preset] ❌ Failed to add CSS animation to Shadow DOM:', e);
          fallbackStyleInjection();
        }
      } else {
        // Fallback: add <style> element to document/shadowRoot
        fallbackStyleInjection();
      }

      function fallbackStyleInjection() {
        const styleId = 'march-animations';
        let styleEl = targetDoc.getElementById ? targetDoc.getElementById(styleId) : null;

        if (!styleEl) {
          styleEl = document.createElement('style');
          styleEl.id = styleId;
          const target = isInShadowDOM ? targetDoc : document.head;
          target.appendChild(styleEl);
        }

        if (!styleEl.textContent.includes(animationName)) {
          styleEl.textContent += keyframesStr;
        }
      }
    }
  };
});

// ==============================================================================
// VISUAL EFFECT PRESETS
// ==============================================================================

/**
 * Blink - Rapid opacity toggle
 *
 * Parameters:
 * - max_opacity (default: 1)
 * - min_opacity (default: 0.3)
 * - duration (default: 1200)
 * - ease (default: 'linear')
 * - loop (default: true)
 * - alternate (default: true)
 */
registerAnimationPreset('blink', (def) => {
  const p = def.params || def;
  const maxOpacity = p.max_opacity !== undefined ? p.max_opacity : 1;
  const minOpacity = p.min_opacity !== undefined ? p.min_opacity : 0.3;
  const duration = p.duration || 1200;
  const ease = getResolvedEasing(p) || 'linear';
  const loop = p.loop !== undefined ? p.loop : true;
  const alternate = p.alternate !== undefined ? p.alternate : true;

  return {
    anime: {
      opacity: [maxOpacity, minOpacity],
      duration,
      ease,
      loop,
      alternate
    },
    styles: {}
  };
});

/**
 * Shimmer - Color + opacity animation (works on HTML text elements)
 *
 * Note: For color animation to work, you must provide explicit color values.
 * The 'currentColor' keyword doesn't interpolate well in anime.js.
 *
 * Parameters:
 * - color_from (optional) - Starting color (e.g., '#99ccff'). If omitted, only opacity animates.
 * - color_to (optional) or shimmer_color - Target color (e.g., '#ffffff'). If omitted, only opacity animates.
 * - opacity_from (default: 1)
 * - opacity_to (default: 0.5)
 * - duration (default: 1500)
 * - ease (default: 'easeInOutSine')
 * - loop (default: true)
 * - alternate (default: true)
 */
registerAnimationPreset('shimmer', (def) => {
  const p = def.params || def;
  const colorFrom = p.color_from;
  const colorTo = p.color_to || p.shimmer_color;
  const opacityFrom = p.opacity_from !== undefined ? p.opacity_from : 1;
  const opacityTo = p.opacity_to !== undefined ? p.opacity_to : 0.5;
  const duration = p.duration || 1500;
  const ease = getResolvedEasing(p) || 'easeInOutSine';
  const loop = p.loop !== undefined ? p.loop : true;
  const alternate = p.alternate !== undefined ? p.alternate : true;

  // Build animation params
  const animeParams = {
    opacity: [opacityFrom, opacityTo],
    duration,
    ease,
    loop,
    alternate
  };

  // Only add color animation if both from and to are provided
  if (colorFrom && colorTo) {
    animeParams.color = [colorFrom, colorTo];
  }

  return {
    anime: animeParams,
    styles: {}
  };
});

/**
 * Strobe - Fast opacity strobe effect
 *
 * Parameters:
 * - duration (default: 100)
 * - max_opacity (default: 1)
 * - min_opacity (default: 0)
 * - ease (default: 'linear')
 * - loop (default: true)
 * - alternate (default: true)
 */
registerAnimationPreset('strobe', (def) => {
  const p = def.params || def;
  const duration = p.duration || 100;
  const maxOpacity = p.max_opacity !== undefined ? p.max_opacity : 1;
  const minOpacity = p.min_opacity !== undefined ? p.min_opacity : 0;
  const ease = getResolvedEasing(p) || 'linear';
  const loop = p.loop !== undefined ? p.loop : true;
  const alternate = p.alternate !== undefined ? p.alternate : true;

  return {
    anime: {
      opacity: [maxOpacity, minOpacity],
      duration,
      ease,
      loop,
      alternate
    },
    styles: {}
  };
});

/**
 * Flicker - Randomized opacity animation
 *
 * Parameters:
 * - max_opacity (default: 1)
 * - min_opacity (default: 0.3)
 * - duration (default: 1000)
 * - ease (default: 'linear')
 * - loop (default: true)
 */
registerAnimationPreset('flicker', (def) => {
  const p = def.params || def;
  const maxOpacity = p.max_opacity !== undefined ? p.max_opacity : 1;
  const minOpacity = p.min_opacity !== undefined ? p.min_opacity : 0.3;
  const duration = p.duration || 1000;
  const ease = getResolvedEasing(p) || 'linear';
  const loop = p.loop !== undefined ? p.loop : true;

  // Generate random opacity keyframes
  const keyframes = [];
  const steps = 10;
  for (let i = 0; i <= steps; i++) {
    const randomOpacity = minOpacity + Math.random() * (maxOpacity - minOpacity);
    keyframes.push({ opacity: randomOpacity });
  }

  // Always end at max opacity to return to normal when used with alternate
  keyframes.push({ opacity: maxOpacity });

  return {
    anime: {
      keyframes,
      duration,
      ease,
      loop
    },
    styles: {}
  };
});

/**
 * Cascade - Staggered animation for multiple targets
 *
 * Parameters:
 * - stagger (default: 100) - ms delay between elements
 * - property (default: 'opacity')
 * - from (default: 0)
 * - to (default: 1)
 * - duration (default: 1000)
 * - ease (default: 'easeOutExpo')
 * - loop (default: false)
 */
registerAnimationPreset('cascade', (def) => {
  const p = def.params || def;
  const stagger = p.stagger || 100;
  const property = p.property || 'opacity';
  const from = p.from !== undefined ? p.from : 0;
  const to = p.to !== undefined ? p.to : 1;
  const duration = p.duration || 1000;
  const ease = getResolvedEasing(p) || 'easeOutExpo';
  const loop = p.loop || false;

  return {
    anime: {
      [property]: [from, to],
      duration,
      ease,
      delay: window.lcards?.animejs?.stagger?.(stagger) || ((el, i) => i * stagger),
      loop
    },
    styles: {}
  };
});

/**
 * Cascade Color - Row-by-row color cycling for data grids (ENHANCED)
 *
 * Animates color property through multiple values with authentic LCARS timing.
 * Replicates legacy CB-LCARS cascade effect with distinct color "snap" behavior.
 *
 * Modes:
 * - 'css' (default) - Lightweight CSS keyframes for simple cycling
 * - 'animejs' - Advanced features: custom stagger, interactivity, complex ease
 *
 * Legacy timing behavior:
 * - 0-75%: Stay at start color (blue)
 * - 80-90%: Snap to text color (dark blue) - creates the "flash" effect
 * - 100%: End at end color (moonlight) - brief appearance
 *
 * Parameters:
 * - mode (default: 'css') - 'css' or 'animejs'
 * - colors (required) - Array of 3 colors [start, text, end]
 * - duration (default: 5000) - Duration of full color cycle
 * - ease (default: 'linear')
 * - loop (default: true)
 * - alternate (default: true) - Alternate direction each cycle
 * - property (default: 'color') - CSS property to animate ('color', 'fill', etc.)
 * - delay (default: 0) - Row-level delay for when animation starts (used in timing patterns)
 * - interactive (default: false) - Pause on hover (requires animejs mode)
 * - stagger_from (default: 'first') - 'first', 'last', 'center', 'random' (animejs only)
 * - stagger_delay (default: 100) - Delay between elements in ms (animejs only)
 * - axis (default: 'row') - 'row' or 'column' for stagger direction (animejs only)
 *
 * Note: If interactive, stagger_from, or custom axis is specified, mode is forced to 'animejs'
 *
 * Usage Pattern:
 * Each row should be animated independently with its own duration and delay.
 * Use multiple animation instances (one per row) for authentic LCARS cascade effect.
 *
 * @example Per-Row Animation (Recommended)
 * ```javascript
 * // Row 0: Fast cycle
 * registerAnimation(overlayId, {
 *   preset: 'cascade-color',
 *   targets: '.grid-cell[data-row="0"]',
 *   params: { colors: [...], duration: 2000, delay: 100 }
 * });
 *
 * // Row 1: Slower cycle
 * registerAnimation(overlayId, {
 *   preset: 'cascade-color',
 *   targets: '.grid-cell[data-row="1"]',
 *   params: { colors: [...], duration: 4000, delay: 200 }
 * });
 * ```
 *
 * @example User Config (data-grid)
 * ```yaml
 * type: custom:lcards-data-grid
 * animation:
 *   type: cascade
 *   pattern: default  # Applies timing pattern to rows automatically
 *   colors:
 *     start: colors.lcars.blue
 *     text: colors.lcars.dark-blue
 *     end: colors.lcars.moonlight
 * ```
 */
registerAnimationPreset('cascade-color', (def) => {
  const p = def.params || def;
  const colors = p.colors || ['var(--lcars-blue, #2266ff)', 'var(--lcards-blue-darkest, #112244)', 'var(--lcars-moonlight, #e7f3f7)'];
  const duration = p.duration || 5000;
  const ease = getResolvedEasing(p) || 'linear';
  const loop = p.loop !== undefined ? p.loop : true;
  const alternate = p.alternate !== undefined ? p.alternate : true;
  const property = p.property || 'color';

  // Row-level delay from timing pattern (when rows start relative to animation start)
  const rowDelay = p.delay !== undefined ? p.delay : 0;

  // Mode selection
  const interactive = p.interactive !== undefined ? p.interactive : false;
  const staggerFrom = p.stagger_from;
  const staggerDelay = p.stagger_delay !== undefined ? p.stagger_delay : 100;
  const axis = p.axis || 'row';

  // Force anime.js mode if advanced features requested
  const mode = p.mode || (interactive || staggerFrom || (axis && axis !== 'row') ? 'animejs' : 'css');
  const useAnimejs = mode === 'animejs';

  if (!Array.isArray(colors) || colors.length < 3) {
    lcardsLog.warn('[AnimationPresets] cascade-color requires 3 colors [start, text, end]');
    return { anime: {}, styles: {} };
  }

  // Use keyframes to replicate authentic LCARS timing:
  // Legacy CSS percentages:
  // 0-75%: start color (blue) - long dwell
  // 80-90%: text color (dark blue) - snap/flash
  // 95-100%: end color (moonlight) - hold briefly before loop
  //
  // For anime.js keyframes with duration-based progression:
  // We need: blue(75%) → gap(5%) → dark-blue(10%) → transition(5%) → moonlight-hold(5%)
  const keyframes = [
    { [property]: colors[0], duration: 0 },                          // 0% - Start immediately at blue
    { [property]: colors[0], duration: duration * 0.75 },            // 0-75% - Hold blue (long dwell)
    { [property]: colors[1], duration: duration * 0.05 },            // 75-80% - Transition gap to dark-blue
    { [property]: colors[1], duration: duration * 0.10 },            // 80-90% - Hold dark-blue (snap)
    { [property]: colors[2], duration: duration * 0.05 },            // 90-95% - Transition to moonlight
    { [property]: colors[2], duration: duration * 0.05 }             // 95-100% - Hold moonlight before loop
  ];

  // CSS mode (default) - lightweight
  if (!useAnimejs) {
    return {
      anime: {
        keyframes,
        delay: rowDelay,  // All cells in row start together, just delayed by row timing
        loop,
        alternate
      },
      styles: {}
    };
  }

  // Anime.js mode - advanced features
  const animeParams = {
    keyframes,
    loop,
    alternate
  };

  // Add stagger if specified
  if (staggerFrom) {
    animeParams.delay = window.lcards?.animejs?.stagger?.(staggerDelay, {
      from: staggerFrom,
      axis: axis
    }) || ((el, i) => i * staggerDelay);
  } else {
    animeParams.delay = rowDelay;
  }

  const result = {
    anime: animeParams,
    styles: {}
  };

  // Add interactive controls if requested
  if (interactive) {
    result.setup = (element, animeInstance) => {
      if (!element || !animeInstance) return;

      const handleMouseEnter = () => {
        if (animeInstance.pause) animeInstance.pause();
      };

      const handleMouseLeave = () => {
        if (animeInstance.play) animeInstance.play();
      };

      element.addEventListener('mouseenter', handleMouseEnter);
      element.addEventListener('mouseleave', handleMouseLeave);

      // Store cleanup function
      if (!element._cleanupFns) element._cleanupFns = [];
      element._cleanupFns.push(() => {
        element.removeEventListener('mouseenter', handleMouseEnter);
        element.removeEventListener('mouseleave', handleMouseLeave);
      });
    };
  }

  return result;
});

/**
 * Ripple - Expanding scale + opacity effect
 *
 * Parameters:
 * - scale_max (default: 1.5)
 * - opacity_min (default: 0)
 * - duration (default: 1000)
 * - ease (default: 'easeOutExpo')
 * - loop (default: false)
 * - alternate (default: false)
 */
registerAnimationPreset('ripple', (def) => {
  const p = def.params || def;
  const scaleMax = p.scale_max !== undefined ? p.scale_max : 1.5;
  const opacityMin = p.opacity_min !== undefined ? p.opacity_min : 0;
  const duration = p.duration || 1000;
  const ease = getResolvedEasing(p) || 'easeOutExpo';
  const loop = p.loop || false;
  const alternate = p.alternate || false;

  return {
    anime: {
      scale: [1, scaleMax],
      opacity: [1, opacityMin],
      duration,
      ease,
      loop,
      alternate
    },
    styles: {
      transformOrigin: 'center',
      transformBox: 'fill-box'
    }
  };
});

/**
 * Scale - Simple scale transform animation
 * Ideal for button press feedback or hover effects
 *
 * Parameters:
 * - scale (default: 1.1) - Target scale factor
 * - from (default: 1) - Starting scale
 * - duration (default: 200)
 * - ease (default: 'easeOutQuad')
 * - loop (default: false) - Can be true, false, or a number (e.g., 3 for 3 iterations)
 * - alternate (default: false)
 */
registerAnimationPreset('scale', (def) => {
  const p = def.params || def;
  const scale = p.scale !== undefined ? p.scale : 1.1;
  const from = p.from !== undefined ? p.from : 1;
  const duration = p.duration || 200;
  const ease = getResolvedEasing(p) || 'easeOutQuad';
  const loop = p.loop !== undefined ? p.loop : false;
  const alternate = p.alternate || false;

  return {
    anime: {
      scale: [from, scale],
      duration,
      ease,
      loop,
      alternate
    },
    styles: {
      transformOrigin: 'center',
      transformBox: 'fill-box'
    }
  };
});

/**
 * Scale Reset - Return element to original scale
 * Use with on_leave trigger to reset hover scale animations
 *
 * Parameters:
 * - duration (default: 200)
 * - ease (default: 'easeOutQuad')
 */
registerAnimationPreset('scale-reset', (def) => {
  const p = def.params || def;
  const duration = p.duration || 200;
  const ease = getResolvedEasing(p) || 'easeOutQuad';

  return {
    anime: {
      scale: [null, 1], // null means "from current value"
      duration,
      ease,
      loop: false,
      alternate: false
    },
    styles: {
      transformOrigin: 'center',
      transformBox: 'fill-box'
    }
  };
});

// ==============================================================================
// MOTION PRESETS
// ==============================================================================

/**
 * Slide - Translate/position animation for enter/exit effects
 *
 * Parameters:
 * - direction (default: 'up') - 'up', 'down', 'left', 'right'
 * - distance (default: 100) - Distance to slide in pixels
 * - duration (default: 600)
 * - ease (default: 'easeOutQuad')
 * - loop (default: false)
 * - alternate (default: false)
 */
registerAnimationPreset('slide', (def) => {
  const p = def.params || def;
  // Support both 'from' (editor) and 'direction' (legacy) parameters
  const from = p.from || p.direction || 'right';
  const distance = p.distance !== undefined ? p.distance : 100;
  const duration = p.duration || 600;
  const ease = getResolvedEasing(p) || 'easeOutQuad';
  const loop = p.loop !== undefined ? p.loop : false;
  const alternate = p.alternate !== undefined ? p.alternate : false;

  // Determine if distance is percentage or pixels
  const isPercentage = typeof distance === 'string' && distance.includes('%');
  const distanceValue = isPercentage ? distance : `${distance}px`;

  // Map direction to translateX/Y
  // "from right" means element starts at right (positive X) and slides to 0
  // "from left" means element starts at left (negative X) and slides to 0
  // "from top" means element starts at top (negative Y) and slides to 0
  // "from bottom" means element starts at bottom (positive Y) and slides to 0
  let translateProp;
  let translateValue;

  switch (from) {
    case 'right':
      translateProp = 'translateX';
      translateValue = [distanceValue, 0];
      break;
    case 'left':
      translateProp = 'translateX';
      translateValue = [isPercentage ? `-${distance}` : `-${distance}px`, 0];
      break;
    case 'top':
      translateProp = 'translateY';
      translateValue = [isPercentage ? `-${distance}` : `-${distance}px`, 0];
      break;
    case 'bottom':
      translateProp = 'translateY';
      translateValue = [distanceValue, 0];
      break;
    // Legacy 'direction' parameter support
    case 'up':
      translateProp = 'translateY';
      translateValue = [distanceValue, 0];
      break;
    case 'down':
      translateProp = 'translateY';
      translateValue = [isPercentage ? `-${distance}` : `-${distance}px`, 0];
      break;
    default:
      lcardsLog.warn(`[AnimationPresets] slide: unknown from/direction '${from}', using 'right'`);
      translateProp = 'translateX';
      translateValue = [distanceValue, 0];
  }

  return {
    anime: {
      [translateProp]: translateValue,
      duration,
      ease,
      loop,
      alternate
    },
    styles: {}
  };
});

/**
 * Rotate - Rotation animation
 *
 * Parameters:
 * - from (default: 0) - Starting rotation in degrees
 * - to (default: 360) - Ending rotation in degrees
 * - duration (default: 1000)
 * - ease (default: 'linear')
 * - loop (default: false)
 * - alternate (default: false)
 */
registerAnimationPreset('rotate', (def) => {
  const p = def.params || def;

  // Support direction shorthand or explicit from/to
  let from, to;
  if (p.direction) {
    if (p.direction === 'clockwise') {
      from = 0;
      to = 360;
    } else if (p.direction === 'counterclockwise') {
      from = 0;
      to = -360;
    } else {
      lcardsLog.warn(`[AnimationPresets] rotate: unknown direction '${p.direction}', using clockwise`);
      from = 0;
      to = 360;
    }
  } else {
    from = p.from !== undefined ? p.from : 0;
    to = p.to !== undefined ? p.to : 360;
  }

  const duration = p.duration || 1000;
  const ease = getResolvedEasing(p) || 'linear';
  const loop = p.loop !== undefined ? p.loop : false;
  const alternate = p.alternate !== undefined ? p.alternate : false;

  return {
    anime: {
      rotate: [from, to],
      duration,
      ease,
      loop,
      alternate
    },
    styles: {
      transformOrigin: 'center',
      transformBox: 'fill-box'
    }
  };
});

/**
 * Shake - Horizontal shake/vibrate effect
 *
 * Parameters:
 * - intensity (default: 10) - Shake distance in pixels
 * - duration (default: 500)
 * - frequency (default: 4) - Number of shakes
 * - ease (default: 'easeInOutSine')
 * - loop (default: false)
 */
registerAnimationPreset('shake', (def) => {
  const p = def.params || def;
  const intensity = p.intensity !== undefined ? p.intensity : 10;
  const duration = p.duration || 500;
  const frequency = p.frequency !== undefined ? p.frequency : 4;
  const ease = getResolvedEasing(p) || 'easeInOutSine';
  const loop = p.loop !== undefined ? p.loop : false;

  // Generate keyframes for shake effect
  // Create back-and-forth motion based on frequency
  const keyframes = [];
  for (let i = 0; i <= frequency; i++) {
    // Alternate between positive and negative
    const direction = i % 2 === 0 ? 1 : -1;
    keyframes.push({ translateX: direction * intensity });
  }
  // End at 0
  keyframes.push({ translateX: 0 });

  return {
    anime: {
      keyframes,
      duration,
      ease,
      loop
    },
    styles: {}
  };
});

/**
 * Bounce - Bouncing scale effect with elastic ease
 *
 * Parameters:
 * - scale_max (default: 1.2) - Maximum scale factor
 * - duration (default: 800)
 * - bounces (default: 3) - Number of bounces
 * - ease (default: 'easeOutElastic')
 * - loop (default: false)
 * - alternate (default: false)
 */
registerAnimationPreset('bounce', (def) => {
  const p = def.params || def;
  const scaleMax = p.scale_max !== undefined ? p.scale_max : 1.2;
  const duration = p.duration || 800;
  const bounces = p.bounces !== undefined ? p.bounces : 3;
  const ease = getResolvedEasing(p) || 'easeOutElastic';
  const loop = p.loop !== undefined ? p.loop : false;
  const alternate = p.alternate !== undefined ? p.alternate : false;

  // If multiple bounces requested, generate keyframes
  if (bounces > 1) {
    const keyframes = [];
    for (let i = 0; i < bounces; i++) {
      // Each bounce goes from 1 to scaleMax and back
      // Decrease intensity with each bounce for natural effect
      const intensity = scaleMax - (scaleMax - 1) * (i / bounces) * 0.5;
      keyframes.push({ scale: intensity });
      keyframes.push({ scale: 1 });
    }

    return {
      anime: {
        keyframes,
        duration: duration * bounces,
        ease: 'easeOutQuad', // Use simpler easing for keyframes
        loop,
        alternate
      },
      styles: {
        transformOrigin: 'center',
        transformBox: 'fill-box'
      }
    };
  }

  // Single bounce with elastic ease
  return {
    anime: {
      scale: [1, scaleMax],
      duration,
      ease,
      loop,
      alternate
    },
    styles: {
      transformOrigin: 'center',
      transformBox: 'fill-box'
    }
  };
});

/**
 * Color Shift - Pure color animation
 *
 * Parameters:
 * - color_from (required) - Starting color
 * - color_to (required) - Ending color
 * - property (default: 'color') - CSS property to animate ('color', 'fill', 'stroke', 'background-color', etc.)
 * - duration (default: 1000)
 * - ease (default: 'easeInOutQuad')
 * - loop (default: false)
 * - alternate (default: false)
 */
registerAnimationPreset('color-shift', (def) => {
  const p = def.params || def;
  const colorFrom = p.color_from;
  const colorTo = p.color_to;
  const property = p.property || 'color';
  const duration = p.duration || 1000;
  const ease = getResolvedEasing(p) || 'easeInOutQuad';
  const loop = p.loop !== undefined ? p.loop : false;
  const alternate = p.alternate !== undefined ? p.alternate : false;

  // Validate required parameters
  if (!colorFrom || !colorTo) {
    lcardsLog.warn('[AnimationPresets] color-shift requires color_from and color_to parameters');
    return { anime: {}, styles: {} };
  }

  return {
    anime: {
      [property]: [colorFrom, colorTo],
      duration,
      ease,
      loop,
      alternate
    },
    styles: {}
  };
});

/**
 * Border Pulse - Animate border properties
 *
 * Parameters:
 * - color_from (optional) - Starting border color
 * - color_to (optional) - Ending border color
 * - width_from (optional) - Starting border width
 * - width_to (optional) - Ending border width
 * - duration (default: 1000)
 * - ease (default: 'easeInOutSine')
 * - loop (default: true)
 * - alternate (default: true)
 */
registerAnimationPreset('border-pulse', (def) => {
  const p = def.params || def;
  const colorFrom = p.color_from;
  const colorTo = p.color_to;
  const widthFrom = p.width_from;
  const widthTo = p.width_to;
  const duration = p.duration || 1000;
  const ease = getResolvedEasing(p) || 'easeInOutSine';
  const loop = p.loop !== undefined ? p.loop : true;
  const alternate = p.alternate !== undefined ? p.alternate : true;

  // Build animation object based on what properties are specified
  const animeParams = {
    duration,
    ease,
    loop,
    alternate
  };

  // Add border-color animation if colors specified
  if (colorFrom && colorTo) {
    animeParams['border-color'] = [colorFrom, colorTo];
  } else if (colorFrom || colorTo) {
    lcardsLog.warn('[AnimationPresets] border-pulse: both color_from and color_to must be specified for color animation');
  }

  // Add border-width animation if widths specified
  if (widthFrom !== undefined && widthTo !== undefined) {
    animeParams['border-width'] = [widthFrom, widthTo];
  } else if (widthFrom !== undefined || widthTo !== undefined) {
    lcardsLog.warn('[AnimationPresets] border-pulse: both width_from and width_to must be specified for width animation');
  }

  // Check if any animation was configured
  if (!animeParams['border-color'] && !animeParams['border-width']) {
    lcardsLog.warn('[AnimationPresets] border-pulse: no valid animation parameters (specify color_from/color_to or width_from/width_to)');
    return { anime: {}, styles: {} };
  }

  return {
    anime: animeParams,
    styles: {}
  };
});

/**
 * Skew - Skew/slant transformation
 *
 * Parameters:
 * - skewX (default: 0) - Horizontal skew in degrees
 * - skewY (default: 0) - Vertical skew in degrees
 * - from_skewX (default: 0) - Starting horizontal skew
 * - from_skewY (default: 0) - Starting vertical skew
 * - duration (default: 600)
 * - ease (default: 'easeInOutQuad')
 * - loop (default: false)
 * - alternate (default: false)
 */
registerAnimationPreset('skew', (def) => {
  const p = def.params || def;
  const duration = p.duration || 600;
  const ease = getResolvedEasing(p) || 'easeInOutQuad';
  const loop = p.loop !== undefined ? p.loop : false;
  const alternate = p.alternate !== undefined ? p.alternate : false;

  // Support both from/to syntax and direct target values
  let skewXValue, skewYValue;

  if (p.from_skewX !== undefined || p.from_skewY !== undefined) {
    // Use from/to syntax
    const fromX = p.from_skewX !== undefined ? p.from_skewX : 0;
    const toX = p.skewX !== undefined ? p.skewX : 0;
    const fromY = p.from_skewY !== undefined ? p.from_skewY : 0;
    const toY = p.skewY !== undefined ? p.skewY : 0;

    skewXValue = [fromX, toX];
    skewYValue = [fromY, toY];
  } else {
    // Use direct target values (from current to target)
    const targetX = p.skewX !== undefined ? p.skewX : 0;
    const targetY = p.skewY !== undefined ? p.skewY : 0;

    skewXValue = [0, targetX];
    skewYValue = [0, targetY];
  }

  return {
    anime: {
      skewX: skewXValue,
      skewY: skewYValue,
      duration,
      ease,
      loop,
      alternate
    },
    styles: {
      transformOrigin: 'center',
      transformBox: 'fill-box'
    }
  };
});

/**
 * Scan Line - Moving gradient/line across element
 *
 * Parameters:
 * - direction (default: 'horizontal') - 'horizontal' or 'vertical'
 * - color (default: 'rgba(255,255,255,0.3)') - Scan line color
 * - duration (default: 2000)
 * - ease (default: 'linear')
 * - loop (default: true)
 */
registerAnimationPreset('scan-line', (def) => {
  const p = def.params || def;
  const direction = p.direction || 'horizontal';
  const color = p.color || 'rgba(255,255,255,0.3)';
  const duration = p.duration || 2000;
  const ease = getResolvedEasing(p) || 'linear';
  const loop = p.loop !== undefined ? p.loop : true;

  // Use background-position animation for gradient movement
  // Create a linear gradient that will be animated
  const isHorizontal = direction === 'horizontal';

  // Set up the gradient and animate background-position
  const gradientAngle = isHorizontal ? '90deg' : '0deg';
  const positionProp = isHorizontal ? 'background-position-x' : 'background-position-y';

  return {
    anime: {
      [positionProp]: isHorizontal ? ['0%', '100%'] : ['0%', '100%'],
      duration,
      ease,
      loop
    },
    styles: {
      backgroundImage: `linear-gradient(${gradientAngle}, transparent 0%, transparent 40%, ${color} 50%, transparent 60%, transparent 100%)`,
      backgroundSize: isHorizontal ? '200% 100%' : '100% 200%',
      backgroundRepeat: 'no-repeat'
    }
  };
});

/**
 * Glitch - Random position/color shifts for malfunction effects
 *
 * Parameters:
 * - intensity (default: 5) - Maximum pixel displacement
 * - frequency (default: 10) - Number of glitch steps
 * - duration (default: 1000)
 * - loop (default: false)
 */
registerAnimationPreset('glitch', (def) => {
  const p = def.params || def;
  const intensity = p.intensity !== undefined ? p.intensity : 5;
  const frequency = p.frequency !== undefined ? p.frequency : 10;
  const duration = p.duration || 1000;
  const loop = p.loop !== undefined ? p.loop : false;

  // Generate random keyframes for glitch effect
  const keyframes = [];
  for (let i = 0; i < frequency; i++) {
    // Random position shifts
    const randomX = (Math.random() - 0.5) * 2 * intensity;
    const randomY = (Math.random() - 0.5) * 2 * intensity;

    keyframes.push({
      translateX: randomX,
      translateY: randomY,
      // Optional: add filter effects for more intense glitch
      filter: Math.random() > 0.7 ? `hue-rotate(${Math.random() * 360}deg)` : 'hue-rotate(0deg)'
    });
  }

  // Return to normal at the end
  keyframes.push({
    translateX: 0,
    translateY: 0,
    filter: 'hue-rotate(0deg)'
  });

  return {
    anime: {
      keyframes,
      duration,
      ease: 'linear', // Use linear for chaotic glitch effect
      loop
    },
    styles: {}
  };
});

// ==============================================================================
// UTILITY PRESETS
// ==============================================================================

/**
 * Set - Immediately set properties without animation
 *
 * Parameters:
 * - properties (object) - CSS properties to set
 *
 * Example:
 *   { preset: 'set', properties: { opacity: 0.5, fill: 'red' } }
 */
registerAnimationPreset('set', (def) => {
  const p = def.params || def;
  const properties = p.properties || {};

  return {
    anime: {
      // Duration 0 = immediate
      duration: 0,
      ...properties
    },
    styles: {}
  };
});

/**
 * Motionpath - Follow SVG path animation
 * Uses anime.js v4 createMotionPath() for smooth path following
 *
 * Parameters:
 * - path (required) - CSS selector for path element or path string
 * - duration (default: 4000)
 * - ease (default: 'linear')
 * - loop (default: false)
 * - alternate (default: false)
 * - rotate (default: true) - Auto-rotate element along path
 * - anchor (default: '50% 50%') - Transform origin for rotation
 *
 * Example:
 * {
 *   preset: 'motionpath',
 *   targets: '.follower',
 *   params: { path: '#circuit-path', duration: 3000, rotate: true }
 * }
 */
registerAnimationPreset('motionpath', (def) => {
  const p = def.params || def;
  const path = p.path; // Required
  const duration = p.duration || 4000;
  const ease = getResolvedEasing(p) || 'linear';
  const loop = p.loop !== undefined ? p.loop : false;
  const alternate = p.alternate || false;
  const rotate = p.rotate !== undefined ? p.rotate : true;
  const anchor = p.anchor || '50% 50%';

  if (!path) {
    lcardsLog.warn('[motionpath preset] Missing required "path" parameter');
    return { anime: {}, styles: {} };
  }

  return {
    anime: {
      duration,
      ease,
      loop,
      alternate,
      // AnimationManager will transform this using createMotionPath()
      motionPath: {
        path,
        rotate
      }
    },
    styles: {
      transformOrigin: anchor
    },
    setup: (element) => {
      if (!element || !path) return;

      // Resolve path element or string
      let pathElement = path;
      if (typeof path === 'string' && path.startsWith('#') || path.startsWith('.')) {
        // Try to find path in same root
        const root = element.getRootNode();
        pathElement = root.querySelector(path);
        if (!pathElement) {
          lcardsLog.warn(`[motionpath preset] Path element not found: ${path}`);
          return;
        }
      }

      // Use anime.js v4 createMotionPath
      if (window.lcards?.animejs?.svg?.createMotionPath) {
        try {
          const motionPath = window.lcards.animejs.svg.createMotionPath(pathElement);
          element._motionPath = motionPath;
        } catch (e) {
          lcardsLog.error('[motionpath preset] Failed to create motion path:', e);
        }
      } else {
        lcardsLog.warn('[motionpath preset] createMotionPath not available - anime.js v4 SVG features required');
      }
    }
  };
});

// ==============================================================================
// ADVANCED PRESETS
// ==============================================================================

/**
 * Sequence - Multi-step coordinated animation using anime.js timeline
 *
 * Creates complex multi-step animations where each step can have independent
 * timing, ease, and properties. Uses anime.js v4 timeline for precise control.
 *
 * Parameters:
 * - steps (array, required) - Array of animation step configs
 *   Each step: { ...animeParams, at: position }
 *   'at' can be:
 *     - absolute time in ms (e.g., 500)
 *     - relative offset (e.g., '+=500')
 *     - '<' for previous step start time
 * - duration (default: 2000) - Not used if steps have individual durations
 * - loop (default: false) - Loop entire sequence
 * - ease (default: 'easeOutQuad') - Default easing for steps without ease
 *
 * Example:
 * {
 *   preset: 'sequence',
 *   params: {
 *     steps: [
 *       { opacity: [0, 1], duration: 500, at: 0 },
 *       { scale: [1, 1.2], duration: 300, at: 500 },
 *       { rotate: [0, 360], duration: 1000, at: '<' }
 *     ]
 *   }
 * }
 */
registerAnimationPreset('sequence', (def) => {
  const p = def.params || def;
  const steps = p.steps;
  const defaultDuration = p.duration || 2000;
  const loop = p.loop !== undefined ? p.loop : false;
  const defaultEasing = p.ease || 'easeOutQuad';

  if (!Array.isArray(steps) || steps.length === 0) {
    lcardsLog.warn('[AnimationPresets] sequence requires steps array with at least one step');
    return { anime: {}, styles: {} };
  }

  // Mark this as a timeline animation for AnimationManager
  // AnimationManager will use window.lcards.animejs.createTimeline() instead of animate()
  return {
    _timeline: true,
    anime: {
      loop,
      defaultEasing,
      steps: steps.map(step => ({
        ...step,
        duration: step.duration || defaultDuration,
        ease: step.ease || defaultEasing
      }))
    },
    styles: {}
  };
});

/**
 * Grid Stagger - Staggered animation based on grid position
 *
 * Animates elements in a grid pattern with staggered delays based on position.
 * Creates wave-like effects emanating from a chosen origin point.
 *
 * Parameters:
 * - grid (default: [10, 10]) - Grid dimensions [cols, rows]
 * - from (default: 'center') - Origin point:
 *   - 'center': Wave from center
 *   - 'first': Wave from top-left
 *   - 'last': Wave from bottom-right
 *   - 'random': Random order
 *   - [x, y]: Custom grid position (0-based)
 * - property (default: 'scale') - Property to animate
 * - from_value (default: 1) - Starting value
 * - to_value (default: 1.5) - Ending value
 * - stagger_duration (default: 50) - Delay between each element (ms)
 * - wave_duration (default: 1000) - Duration of individual element animation
 * - ease (default: 'easeInOutQuad')
 * - loop (default: false)
 * - alternate (default: true)
 */
registerAnimationPreset('grid-stagger', (def) => {
  const p = def.params || def;
  const grid = p.grid || [10, 10];
  const from = p.from || 'center';
  const property = p.property || 'scale';
  const fromValue = p.from_value !== undefined ? p.from_value : 1;
  const toValue = p.to_value !== undefined ? p.to_value : 1.5;
  const staggerDuration = p.stagger_duration !== undefined ? p.stagger_duration : 50;
  const waveDuration = p.wave_duration || 1000;
  const ease = getResolvedEasing(p) || 'easeInOutQuad';
  const loop = p.loop !== undefined ? p.loop : false;
  const alternate = p.alternate !== undefined ? p.alternate : true;

  return {
    anime: {
      [property]: [fromValue, toValue],
      duration: waveDuration,
      ease,
      // Use anime.js v4 stagger with grid positioning
      delay: window.lcards?.animejs?.stagger?.(staggerDuration, {
        grid: grid,
        from: from
      }) || ((el, i) => i * staggerDuration),
      loop,
      alternate
    },
    styles: {
      transformOrigin: 'center',
      transformBox: 'fill-box'
    }
  };
});

/**
 * Chaos - Randomized multi-property animation for glitch/malfunction effects
 *
 * Creates unpredictable, chaotic motion by randomizing multiple properties
 * simultaneously. Perfect for error states, alerts, or sci-fi malfunction effects.
 *
 * Parameters:
 * - properties (default: ['x', 'y', 'rotate']) - Properties to randomize
 * - range (default: { x: [-50, 50], y: [-50, 50], rotate: [-15, 15] }) - Min/max for each property
 * - duration_min (default: 200) - Minimum animation duration
 * - duration_max (default: 800) - Maximum animation duration
 * - ease (default: 'easeInOutQuad')
 * - loop (default: true)
 * - composition (default: 'blend') - 'blend' or 'replace'
 */
registerAnimationPreset('chaos', (def) => {
  const p = def.params || def;
  const properties = p.properties || ['x', 'y', 'rotate'];
  const defaultRange = { x: [-50, 50], y: [-50, 50], rotate: [-15, 15] };
  const range = { ...defaultRange, ...(p.range || {}) };
  const durationMin = p.duration_min !== undefined ? p.duration_min : 200;
  const durationMax = p.duration_max !== undefined ? p.duration_max : 800;
  const ease = getResolvedEasing(p) || 'easeInOutQuad';
  const loop = p.loop !== undefined ? p.loop : true;
  const composition = p.composition || 'blend';

  // Build animation parameters with function-based random values
  const animeParams = {
    ease,
    loop,
    composition,
    // Randomize duration for each element
    duration: () => durationMin + Math.random() * (durationMax - durationMin)
  };

  // Add randomized properties
  properties.forEach(prop => {
    const propRange = range[prop];
    if (propRange && Array.isArray(propRange) && propRange.length === 2) {
      // Map property names (x/y shorthand to translateX/translateY)
      const animeProp = prop === 'x' ? 'translateX' : prop === 'y' ? 'translateY' : prop;

      // Use function to generate random value for each element
      animeParams[animeProp] = () => {
        return propRange[0] + Math.random() * (propRange[1] - propRange[0]);
      };
    }
  });

  return {
    anime: animeParams,
    styles: {
      transformOrigin: 'center',
      transformBox: 'fill-box'
    }
  };
});

/**
 * Physics Spring - Spring-physics based animation using anime.js v4 springs
 *
 * Creates natural, physics-based motion using spring dynamics. Provides more
 * organic movement than traditional easing functions.
 *
 * Parameters:
 * - property (default: 'scale') - Property to animate
 * - from (required) - Starting value
 * - to (required) - Target value
 * - stiffness (default: 100) - Spring stiffness (higher = snappier)
 * - damping (default: 10) - Spring damping (higher = less bounce)
 * - mass (default: 1) - Spring mass (higher = slower)
 * - velocity (default: 0) - Initial velocity
 * - loop (default: false)
 */
registerAnimationPreset('physics-spring', (def) => {
  const p = def.params || def;
  const property = p.property || 'scale';
  const from = p.from;
  const to = p.to;
  const stiffness = p.stiffness !== undefined ? p.stiffness : 100;
  const damping = p.damping !== undefined ? p.damping : 10;
  const mass = p.mass !== undefined ? p.mass : 1;
  const velocity = p.velocity !== undefined ? p.velocity : 0;
  const loop = p.loop !== undefined ? p.loop : false;

  if (from === undefined || to === undefined) {
    lcardsLog.warn('[AnimationPresets] physics-spring requires from and to parameters');
    return { anime: {}, styles: {} };
  }

  // Use anime.js v4 spring as easing function
  const springEasing = window.lcards?.animejs?.spring?.({
    stiffness,
    damping,
    mass,
    velocity
  }) || 'easeOutElastic';

  return {
    anime: {
      [property]: [from, to],
      ease: springEasing,
      loop
    },
    styles: {
      transformOrigin: 'center',
      transformBox: 'fill-box'
    }
  };
});

// ==============================================================================
// TIMELINE PRESETS
// ==============================================================================

Object.entries(TIMELINE_PRESETS).forEach(([name, factory]) => {
  registerAnimationPreset(name, factory);
});

// ==============================================================================
// STAGGER PRESETS
// ==============================================================================

Object.entries(STAGGER_PRESETS).forEach(([name, factory]) => {
  registerAnimationPreset(name, factory);
});

// ==============================================================================
// TEXT ANIMATION PRESETS
// ==============================================================================

Object.entries(TEXT_PRESETS).forEach(([name, factory]) => {
  registerAnimationPreset(name, factory);
});

}
