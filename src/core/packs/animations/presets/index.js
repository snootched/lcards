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
 * - easing (default: 'easeInOutSine')
 * - loop (default: true) - Can be true, false, or a number (e.g., 3 for 3 iterations)
 * - alternate (default: true)
 */
registerAnimationPreset('pulse', (def) => {
  const p = def.params || def;
  const maxScale = p.max_scale !== undefined ? p.max_scale : (p.scale !== undefined ? p.scale : 1.15);
  const maxBrightness = p.max_brightness !== undefined ? p.max_brightness : 1.4;
  const duration = p.duration || 1200;
  const easing = p.easing || 'easeInOutSine';
  const loop = p.loop !== undefined ? p.loop : true;
  const alternate = p.alternate !== undefined ? p.alternate : true;

  return {
    anime: {
      scale: [1, maxScale],
      filter: [`brightness(1)`, `brightness(${maxBrightness})`],
      duration,
      easing,
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
 * - easing (default: 'linear')
 * - loop (default: false) - Can be true, false, or a number (e.g., 3 for 3 iterations)
 * - alternate (default: false)
 */
registerAnimationPreset('fade', (def) => {
  const p = def.params || def;
  const from = p.from !== undefined ? p.from : 1;
  const to = p.to !== undefined ? p.to : 0.3;
  const duration = p.duration || 1000;
  const easing = p.easing || 'linear';
  const loop = p.loop !== undefined ? p.loop : false;
  const alternate = p.alternate || false;

  return {
    anime: {
      opacity: [from, to],
      duration,
      easing,
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
 * - easing (default: 'easeInOutSine')
 * - loop (default: true) - Can be true, false, or a number (e.g., 3 for 3 iterations)
 * - alternate (default: true)
 */
registerAnimationPreset('glow', (def) => {
  const p = def.params || def;
  const color = p.color || p.glow_color || 'var(--lcars-blue, #66ccff)';
  const blurMin = p.blur_min !== undefined ? p.blur_min : 0;
  const blurMax = p.blur_max !== undefined ? p.blur_max : 10;
  const duration = p.duration || 1500;
  const easing = p.easing || 'easeInOutSine';
  const loop = p.loop !== undefined ? p.loop : true;
  const alternate = p.alternate !== undefined ? p.alternate : true;

  return {
    anime: {
      filter: [
        `drop-shadow(0 0 ${blurMin}px ${color})`,
        `drop-shadow(0 0 ${blurMax}px ${color})`
      ],
      duration,
      easing,
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
 * - easing (default: 'easeInOutSine')
 * - reverse (default: false) - If true, draws from end to start
 * - loop (default: false)
 * - alternate (default: false)
 * - draw (default: ['0 0', '0 1']) - Draw values or config object
 */
registerAnimationPreset('draw', (def) => {
  const p = def.params || def;
  const duration = p.duration || 2000;
  const easing = p.easing || 'easeInOutSine';
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
      easing,
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
          console.error('[march preset] Failed to add CSS animation to Shadow DOM:', e);
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
 * - easing (default: 'linear')
 * - loop (default: true)
 * - alternate (default: true)
 */
registerAnimationPreset('blink', (def) => {
  const p = def.params || def;
  const maxOpacity = p.max_opacity !== undefined ? p.max_opacity : 1;
  const minOpacity = p.min_opacity !== undefined ? p.min_opacity : 0.3;
  const duration = p.duration || 1200;
  const easing = p.easing || 'linear';
  const loop = p.loop !== undefined ? p.loop : true;
  const alternate = p.alternate !== undefined ? p.alternate : true;

  return {
    anime: {
      opacity: [maxOpacity, minOpacity],
      duration,
      easing,
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
 * - easing (default: 'easeInOutSine')
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
  const easing = p.easing || 'easeInOutSine';
  const loop = p.loop !== undefined ? p.loop : true;
  const alternate = p.alternate !== undefined ? p.alternate : true;

  // Build animation params
  const animeParams = {
    opacity: [opacityFrom, opacityTo],
    duration,
    easing,
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
 * - easing (default: 'linear')
 * - loop (default: true)
 * - alternate (default: true)
 */
registerAnimationPreset('strobe', (def) => {
  const p = def.params || def;
  const duration = p.duration || 100;
  const maxOpacity = p.max_opacity !== undefined ? p.max_opacity : 1;
  const minOpacity = p.min_opacity !== undefined ? p.min_opacity : 0;
  const easing = p.easing || 'linear';
  const loop = p.loop !== undefined ? p.loop : true;
  const alternate = p.alternate !== undefined ? p.alternate : true;

  return {
    anime: {
      opacity: [maxOpacity, minOpacity],
      duration,
      easing,
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
 * - easing (default: 'linear')
 * - loop (default: true)
 */
registerAnimationPreset('flicker', (def) => {
  const p = def.params || def;
  const maxOpacity = p.max_opacity !== undefined ? p.max_opacity : 1;
  const minOpacity = p.min_opacity !== undefined ? p.min_opacity : 0.3;
  const duration = p.duration || 1000;
  const easing = p.easing || 'linear';
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
      easing,
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
 * - easing (default: 'easeOutExpo')
 * - loop (default: false)
 */
registerAnimationPreset('cascade', (def) => {
  const p = def.params || def;
  const stagger = p.stagger || 100;
  const property = p.property || 'opacity';
  const from = p.from !== undefined ? p.from : 0;
  const to = p.to !== undefined ? p.to : 1;
  const duration = p.duration || 1000;
  const easing = p.easing || 'easeOutExpo';
  const loop = p.loop || false;

  return {
    anime: {
      [property]: [from, to],
      duration,
      easing,
      delay: window.lcards?.anim?.stagger?.(stagger) || ((el, i) => i * stagger),
      loop
    },
    styles: {}
  };
});

/**
 * Cascade Color - Row-by-row color cycling for data grids
 *
 * Animates color property through multiple values with authentic LCARS timing.
 * Replicates legacy CB-LCARS cascade effect with distinct color "snap" behavior.
 *
 * Legacy timing behavior:
 * - 0-75%: Stay at start color (blue)
 * - 80-90%: Snap to text color (dark blue) - creates the "flash" effect
 * - 100%: End at end color (moonlight) - brief appearance
 *
 * Parameters:
 * - colors (required) - Array of 3 colors [start, text, end]
 * - stagger (default: 50) - ms delay between cells within a row
 * - duration (default: 5000) - Duration of full color cycle
 * - easing (default: 'linear')
 * - loop (default: true)
 * - alternate (default: true) - Alternate direction each cycle
 * - property (default: 'color') - CSS property to animate ('color', 'fill', etc.)
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
  const colors = p.colors || ['#0783FF', '#0439A3', '#E7F3F7'];
  const duration = p.duration || 5000;
  const easing = p.easing || 'linear';
  const loop = p.loop !== undefined ? p.loop : true;
  const alternate = p.alternate !== undefined ? p.alternate : true;
  const property = p.property || 'color';

  // Row-level delay from timing pattern (when rows start relative to animation start)
  const rowDelay = p.delay !== undefined ? p.delay : 0;

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

  return {
    anime: {
      keyframes,
      delay: rowDelay,  // All cells in row start together, just delayed by row timing
      loop,
      alternate
    },
    styles: {}
  };
});/**
 * Ripple - Expanding scale + opacity effect
 *
 * Parameters:
 * - scale_max (default: 1.5)
 * - opacity_min (default: 0)
 * - duration (default: 1000)
 * - easing (default: 'easeOutExpo')
 * - loop (default: false)
 * - alternate (default: false)
 */
registerAnimationPreset('ripple', (def) => {
  const p = def.params || def;
  const scaleMax = p.scale_max !== undefined ? p.scale_max : 1.5;
  const opacityMin = p.opacity_min !== undefined ? p.opacity_min : 0;
  const duration = p.duration || 1000;
  const easing = p.easing || 'easeOutExpo';
  const loop = p.loop || false;
  const alternate = p.alternate || false;

  return {
    anime: {
      scale: [1, scaleMax],
      opacity: [1, opacityMin],
      duration,
      easing,
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
 * - easing (default: 'easeOutQuad')
 * - loop (default: false) - Can be true, false, or a number (e.g., 3 for 3 iterations)
 * - alternate (default: false)
 */
registerAnimationPreset('scale', (def) => {
  const p = def.params || def;
  const scale = p.scale !== undefined ? p.scale : 1.1;
  const from = p.from !== undefined ? p.from : 1;
  const duration = p.duration || 200;
  const easing = p.easing || 'easeOutQuad';
  const loop = p.loop !== undefined ? p.loop : false;
  const alternate = p.alternate || false;

  return {
    anime: {
      scale: [from, scale],
      duration,
      easing,
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
 * - easing (default: 'easeOutQuad')
 */
registerAnimationPreset('scale-reset', (def) => {
  const p = def.params || def;
  const duration = p.duration || 200;
  const easing = p.easing || 'easeOutQuad';

  return {
    anime: {
      scale: [null, 1], // null means "from current value"
      duration,
      easing,
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
 * Motionpath - Path following animation (placeholder)
 * TODO: Implement full motionpath support with anime.js v4
 *
 * Parameters:
 * - duration (default: 4000)
 * - easing (default: 'linear')
 * - loop (default: true)
 * - path_selector (required) - CSS selector for path element
 */
registerAnimationPreset('motionpath', (def) => {
  const p = def.params || def;
  const duration = p.duration || 4000;
  const easing = p.easing || 'linear';
  const loop = p.loop !== undefined ? p.loop : true;

  // Placeholder implementation
  // TODO: Add anime.js v4 createMotionPath() support
  lcardsLog.warn('[AnimationPresets] Motionpath preset is a placeholder - full implementation pending');

  return {
    anime: {
      duration,
      easing,
      loop,
      update: p.update
    },
    styles: {},
    postInit(instance, ctx) {
      // Future: attach tracer element along path if p.tracer defined
      void instance;
      void ctx;
    }
  };
});

}
