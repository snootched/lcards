/**
 * @fileoverview Animation helper utilities for LCARdS cards.
 *
 * Wrappers and utilities for anime.js v4 (via `window.lcards.anim`): target
 * resolution, preset application, timeline building, easing resolution, and
 * CSS variable interpolation.
 *
 * @module utils/lcards-anim-helpers
 */

import { lcardsLog } from './lcards-logging.js';
import { getAnimationPreset } from '../core/animation/presets.js';
import { ColorUtils } from '../core/themes/ColorUtils.js';

/**
 * LCARdS-internal animation meta-params that must NOT be passed to anime.animate().
 * These are consumed by the preset builder or AnimationManager, not by anime.js itself.
 * Passing them to anime.js causes it to attempt to tween non-existent element properties.
 */
const _LCARDS_META_PARAMS = new Set([
  'from_value',   // Preset: start color/value used to build the tween property array
  'to_value',     // Preset: end color/value used to build the tween property array
  'property',     // Preset: which SVG/CSS property to animate (used to build [property]:[] entry)
  'from',         // Stagger: position param consumed by stagger() — not an anime.js anim param
  'grid',         // Stagger: grid dimensions consumed by stagger() — not an anime.js anim param
  'trigger',      // AnimationManager: when to fire (on_load, on_tap…) — not anime.js
  'easing',       // v3 alias: anime.js v4 uses 'ease' not 'easing'
  'amplitude',    // stagger-wave preset meta-param (converted to property value by preset)
  // stagger-flash meta-params — consumed by preset / WAAPI setup, not anime.js
  'lead_color',
  'trail_color',
  'lead_pct',
  'with_opacity',
  'trail_opacity',
]);

/**
 * Strip LCARdS-internal meta-params from an anime.js parameter object.
 * Call this immediately before passing params to anime.animate() / window.lcards.anim.anime().
 *
 * @param {Object} params - Raw animation parameters (may include LCARdS meta-params)
 * @returns {Object} Cleaned parameters safe for anime.js
 */
function _cleanAnimeParams(params) {
  const cleaned = {};
  for (const [key, val] of Object.entries(params)) {
    if (!_LCARDS_META_PARAMS.has(key) && val !== undefined) {
      cleaned[key] = val;
    }
  }
  return cleaned;
}

/**
 * Resolve CSS variables in animation parameters
 * Converts var(--lcards-*) to computed color values that anime.js can interpolate
 *
 * @param {Object} params - Animation parameters (may contain CSS variables)
 * @returns {Object} Parameters with CSS variables resolved to actual colors
 *
 * @example
 * // Before: { fill: ['var(--lcards-blue-light)', 'var(--lcards-gray-dark)'] }
 * // After:  { fill: ['#6688cc', '#445566'] }
 */
function resolveAnimationCssVariables(params) {
  if (!params || typeof params !== 'object') {
    return params;
  }

  const resolved = { ...params };

  // Properties that commonly contain color values for anime.js
  const colorProperties = ['fill', 'stroke', 'background', 'backgroundColor', 'color', 'borderColor'];

  // Helper: resolve a single color string.
  // Delegates the full chain (theme: token → computed expression with var()/theme: args → CSS var)
  // to ThemeTokenResolver via the themeManager singleton — the canonical resolution path.
  const resolveColorValue = (value) => {
    if (typeof value !== 'string') return value;
    const resolver = window.lcards?.core?.themeManager?.resolver;
    if (resolver) {
      const out = resolver.resolve(value, value);
      // resolver.resolve returns the input unchanged for plain var() strings
      // (those aren't token/computed expressions), so fall through to resolveCssVariable.
      if (out !== value) return out;
    }
    // Plain CSS variable — resolve via getComputedStyle
    if (value.includes('var(')) {
      return ColorUtils.resolveCssVariable(value);
    }
    return value;
  };

  colorProperties.forEach(prop => {
    if (resolved[prop]) {
      // Handle arrays (e.g., fill: [from, to])
      if (Array.isArray(resolved[prop])) {
        resolved[prop] = resolved[prop].map(value => {
          const out = resolveColorValue(value);
          if (out !== value) lcardsLog.trace(`[resolveAnimationCssVariables] ${prop}[]: ${value} → ${out}`);
          return out;
        });
      }
      // Handle single values
      else if (typeof resolved[prop] === 'string') {
        const original = resolved[prop];
        resolved[prop] = resolveColorValue(original);
        if (resolved[prop] !== original) lcardsLog.trace(`[resolveAnimationCssVariables] ${prop}: ${original} → ${resolved[prop]}`);
      }
    }
  });

  // Recurse into keyframes array so presets like stagger-flash (which embed colors
  // directly in per-keyframe objects) also have their theme: tokens and CSS vars resolved.
  if (Array.isArray(resolved.keyframes)) {
    resolved.keyframes = resolved.keyframes.map(kf => {
      if (!kf || typeof kf !== 'object') return kf;
      const resolvedKf = { ...kf };
      colorProperties.forEach(prop => {
        if (resolvedKf[prop] !== undefined) {
          if (Array.isArray(resolvedKf[prop])) {
            resolvedKf[prop] = resolvedKf[prop].map(v => resolveColorValue(v));
          } else if (typeof resolvedKf[prop] === 'string') {
            resolvedKf[prop] = resolveColorValue(resolvedKf[prop]);
          }
        }
      });
      return resolvedKf;
    });
  }

  return resolved;
}

/**
 * Resolve easing configuration to anime.js easing value
 *
 * Supports multiple input formats:
 * - String: 'inOutQuad', 'linear', etc. (passed through as-is)
 * - Object with type and params: { type: 'inBack', params: { overshoot: 2.0 } }
 * - Advanced easing objects for cubicBezier, spring, steps, linear, irregular
 *
 * @param {string|Object} easingConfig - Easing configuration from animation definition
 * @returns {string|Function} - anime.js easing (string or function)
 *
 * @example
 * // Simple string
 * resolveEasing('inOutQuad')  // → 'inOutQuad'
 *
 * // Parametric Back with custom overshoot
 * resolveEasing({ type: 'inBack', params: { overshoot: 2.5 } })  // → inBack(2.5) function
 *
 * // Spring physics
 * resolveEasing({ type: 'spring', params: { stiffness: 150, damping: 15 } })  // → createSpring() function
 */
export function resolveEasing(easingConfig) {
  // Simple string - use as-is (default case)
  if (typeof easingConfig === 'string' || !easingConfig) {
    return easingConfig || 'linear';
  }

  // Object configuration
  if (typeof easingConfig === 'object' && easingConfig.type) {
    const type = easingConfig.type;
    const params = easingConfig.params || {};
    const anim = window.lcards?.anim;

    if (!anim) {
      lcardsLog.warn('[resolveEasing] Animation namespace not available, falling back to string');
      return type; // Fallback to string (may still work if it's a built-in name)
    }

    try {
      switch (type) {
        // Parametric Power easings (default power = 1.675)
        case 'in':
        case 'powerIn':
          return anim.eases.in(params.power ?? 1.675);
        case 'out':
        case 'powerOut':
          return anim.eases.out(params.power ?? 1.675);
        case 'inOut':
        case 'powerInOut':
          return anim.eases.inOut(params.power ?? 1.675);
        case 'outIn':
        case 'powerOutIn':
          return anim.eases.outIn(params.power ?? 1.675);

        // Parametric Back easings (default overshoot = 1.70158)
        case 'inBack':
          return anim.eases.inBack(params.overshoot ?? 1.70158);
        case 'outBack':
          return anim.eases.outBack(params.overshoot ?? 1.70158);
        case 'inOutBack':
          return anim.eases.inOutBack(params.overshoot ?? 1.70158);
        case 'outInBack':
          return anim.eases.outInBack(params.overshoot ?? 1.70158);

        // Parametric Elastic easings (default amplitude = 1, period = 0.3)
        case 'inElastic':
          return anim.eases.inElastic(params.amplitude ?? 1, params.period ?? 0.3);
        case 'outElastic':
          return anim.eases.outElastic(params.amplitude ?? 1, params.period ?? 0.3);
        case 'inOutElastic':
          return anim.eases.inOutElastic(params.amplitude ?? 1, params.period ?? 0.3);
        case 'outInElastic':
          return anim.eases.outInElastic(params.amplitude ?? 1, params.period ?? 0.3);

        // Advanced easings (cubicBezier, steps, linear, irregular are on anime.eases)
        // Note: spring is the ONLY one that's a top-level function (anime.createSpring)
        case 'cubicBezier':
          return anim.eases.cubicBezier(
            params.x1 ?? 0.25,
            params.y1 ?? 0.1,
            params.x2 ?? 0.25,
            params.y2 ?? 1
          );

        case 'spring':
          // spring is a top-level function (anime.createSpring), not on eases object
          // Returns an easing function that generates spring physics-based curves
          return anim.spring({
            mass: params.mass ?? 1,
            stiffness: params.stiffness ?? 100,
            damping: params.damping ?? 10,
            velocity: params.velocity ?? 0
          });

        case 'steps':
          return anim.eases.steps(params.steps ?? 10, params.fromStart ?? false);

        case 'linear':
          // Expects array of value points (or value/percentage string pairs)
          return anim.eases.linear(...(params.points ?? [0, 1]));

        case 'irregular':
          // Expects steps and randomness parameters
          return anim.eases.irregular(params.steps ?? 10, params.randomness ?? 1);

        case 'custom':
          // Parse and evaluate custom anime.js easing string
          if (params.customString) {
            try {
              // Create a safe evaluation context with anime.js functions
              const evalContext = {
                spring: anim.spring,
                cubicBezier: anim.eases.cubicBezier,
                steps: anim.eases.steps,
                linear: anim.eases.linear,
                irregular: anim.eases.irregular
              };

              const customStr = params.customString.trim();

              // If not already wrapped in quotes, wrap it
              let wrappedString = customStr;
              if (!((customStr.startsWith("'") && customStr.endsWith("'")) ||
                    (customStr.startsWith('"') && customStr.endsWith('"')))) {
                wrappedString = `'${customStr}'`;
              }

              // Replace function calls in the string with context calls
              // e.g., "spring({ bounce: 0.4 })" -> "evalContext.spring({ bounce: 0.4 })"
              wrappedString = wrappedString.replace(
                /\b(spring|cubicBezier|steps|linear|irregular)\s*\(/g,
                'evalContext.$1('
              );

              // Safely evaluate the string
              const evalFunc = new Function('evalContext', `return ${wrappedString}`);
              return evalFunc(evalContext);
            } catch (error) {
              lcardsLog.error(`[resolveEasing] Failed to parse custom easing string:`, error);
              return 'linear'; // Safe fallback
            }
          }
          lcardsLog.warn(`[resolveEasing] Custom easing specified but no customString provided`);
          return 'linear';

        default:
          lcardsLog.warn(`[resolveEasing] Unknown easing type: ${type}, using as string`);
          return type; // Fallback to string
      }
    } catch (error) {
      lcardsLog.error(`[resolveEasing] Failed to create easing function:`, error);
      return 'linear'; // Safe fallback
    }
  }

  // Fallback for unexpected input
  lcardsLog.warn('[resolveEasing] Invalid easing config, using linear', easingConfig);
  return 'linear';
}

/**
 * Waits for an element to be present in the DOM.
 * @param {string} selector - The CSS selector for the element.
 * @param {Element|Document} root - The root element to search within.
 * @param {number} timeout - The maximum time to wait in milliseconds.
 * @returns {Promise<Element>}
 */
export function waitForElement(selector, root = document, timeout = 2000) {
  return new Promise((resolve, reject) => {
    const found = root.querySelector(selector);
    if (found) return resolve(found);

    const observer = new MutationObserver(() => {
      const el = root.querySelector(selector);
      if (el) {
        try { observer.disconnect(); } catch(_) {}
        clearTimeout(to);
        resolve(el);
      }
    });
    observer.observe(root, { childList: true, subtree: true });

    const to = setTimeout(() => {
      try { observer.disconnect(); } catch(_) {}
      reject(new Error(`[LCARdS] Timeout waiting for element: ${selector}`));
    }, timeout);
  });
}

/**
 * Resolves one or many targets into an array of Elements.
 * Enhancements:
 * - Supports comma-separated selector strings: "#a, .b, svg path"
 * - Expands NodeList/HTMLCollection into elements
 * - For selector strings, resolves first match by waiting, and also includes any currently matching additional elements
 * @param {string|Element|Array<string|Element>|NodeList|HTMLCollection} targets
 * @param {Element|Document} root
 * @param {number} timeout
 * @returns {Promise<Element[]>}
 */
export async function waitForElements(targets, root = document, timeout = 2000) {
  const toArray = (v) => Array.isArray(v)
    ? v
    : (v && typeof v.length === 'number' && typeof v.item === 'function')
      ? Array.from(v) // NodeList/HTMLCollection
      : [v];

  const items = toArray(targets).filter(Boolean);
  const results = [];

  for (const item of items) {
    try {
      if (item instanceof Element) {
        results.push(item);
        continue;
      }

      if (typeof item === 'string') {
        // Split comma-separated selector lists
        const selectors = item.split(',').map(s => s.trim()).filter(Boolean);
        for (const sel of selectors) {
          // Wait for first appearance of this selector
          const first = await waitForElement(sel, root, timeout);
          if (first) results.push(first);
          // Also include any additional matches that are already present
          const allNow = root.querySelectorAll(sel);
          for (const el of Array.from(allNow)) {
            if (!results.includes(el)) results.push(el);
          }
        }
        continue;
      }

      lcardsLog.warn('[waitForElements] Unsupported target type, skipping.', { item });
    } catch (e) {
      lcardsLog.error('[waitForElements] Failed to resolve target:', { item, error: e });
    }
  }
  return results;
}

/**
 * A generic wrapper for anime.js that resolves targets within a given root element.
 * If scopeId is provided, add the animation to the scope.
 * @param {object} options - The anime.js animation options.
 * @param {string|Element|Array} options.targets - Selector(s) or element(s).
 * @param {Element} [options.root=document] - The root element for the selector query.
 * @param {string} [options.scopeId] - The scope ID to use.
 */
export async function animateWithRoot(options) {
  const { targets, root = document, scopeId, ...animOptions } = options;
  if (!targets) {
    lcardsLog.warn('[animateWithRoot] Animation missing targets.', { options });
    return;
  }
  try {
    const elements = await waitForElements(targets, root);
    if (elements.length === 0) {
      lcardsLog.warn('[animateWithRoot] No targets resolved.', { targets });
      return;
    }

    for (const element of elements) {
      try {
        let animation;
        if (scopeId && window.lcards.anim.scopes.has(scopeId)) {
          const scopeObj = window.lcards.anim.scopes.get(scopeId);
          animation = window.lcards.anime(element, { ...animOptions, scope: scopeObj.scope });
          scopeObj.addAnimation(animation);
        } else {
          animation = window.lcards.anime(element, animOptions);
        }
      } catch (e) {
        lcardsLog.error('[animateWithRoot] Failed to animate a resolved element.', { element: element?.id, error: e });
      }
    }
  } catch (error) {
    lcardsLog.error('[animateWithRoot] Failed to animate element(s):', { targets, error });
  }
}

/**
 * Process special animation markers (_timeline, _stagger, _radial)
 * These are inserted by presets to signal special handling
 *
 * Marker Types:
 *
 * 1. _timeline: true
 *    - Creates an anime.js timeline instead of a single animation
 *    - Input: { _timeline: true, steps: [{targets, params, offset}], loop, ... }
 *    - Output: Timeline instance that can have multiple steps added
 *    - Example: timeline-cascade preset creates sequential reveals
 *
 * 2. _stagger: true (in delay object)
 *    - Converts delay config object to anime.js stagger() function
 *    - Input: delay: { _stagger: true, value: 100, grid: [6,2], from: 'center' }
 *    - Output: delay: stagger(100, { grid: [6,2], from: 'center' })
 *    - Example: stagger-grid preset animates grid elements with progressive delay
 *
 * 3. _radial: true (in delay object)
 *    - Creates radial stagger pattern from center point outward
 *    - Input: delay: { _radial: true, value: 50, from: 'center' }
 *    - Output: delay: stagger(50, { from: 'center' })
 *    - Example: stagger-radial preset creates ripple effects
 *
 * @param {Object} params - Animation parameters from preset
 * @param {Element} element - Target element for animation
 * @param {Object} scope - Scope object with scope.scope property
 * @returns {Object} { isTimeline: boolean, timelineInstance: object|null, processedParams: object }
 * @private
 */
function _processAnimationMarkers(params, element, scope) {
  // 1. Handle _timeline marker - create timeline instead of single animation
  if (params._timeline === true) {
    lcardsLog.debug('[animateElement] Processing _timeline marker');

    const { _timeline, steps, ...timelineGlobals } = params;

    if (!window.lcards?.anim?.animejs?.createTimeline) {
      lcardsLog.error('[animateElement] createTimeline not available for _timeline marker');
      return { isTimeline: false, timelineInstance: null, processedParams: params };
    }

    const timeline = window.lcards.anim.animejs.createTimeline({
      scope: scope?.scope,
      ...timelineGlobals
    });

    // Add each step to timeline
    if (Array.isArray(steps)) {
      steps.forEach(step => {
        const { targets, offset, params: stepParams, ...stepAnimationProps } = step;

        // If step has targets, resolve them; otherwise use element
        const stepTargets = targets || element;

        // Merge step params if provided
        const finalStepProps = stepParams ? { ...stepAnimationProps, ...stepParams } : stepAnimationProps;

        timeline.add(stepTargets, finalStepProps, offset);
      });
    }

    return {
      isTimeline: true,
      timelineInstance: timeline,
      processedParams: params
    };
  }

  // Make a copy to avoid mutating original
  const processedParams = { ...params };

  // 2. Handle _stagger marker - convert to stagger function
  if (processedParams.delay?._stagger === true) {
    lcardsLog.debug('[animateElement] Processing _stagger marker');

    const staggerConfig = processedParams.delay;

    if (!window.lcards?.anim?.animejs?.stagger) {
      lcardsLog.warn('[animateElement] stagger() not available for _stagger marker');
    } else {
      // Build stagger options
      const staggerOptions = {};

      if (staggerConfig.from !== undefined) {
        staggerOptions.from = staggerConfig.from;
      }
      if (staggerConfig.grid !== undefined) {
        staggerOptions.grid = staggerConfig.grid;
      }
      if (staggerConfig.axis !== undefined) {
        staggerOptions.axis = staggerConfig.axis;
      }
      if (staggerConfig.ease !== undefined) {
        staggerOptions.ease = staggerConfig.ease;
      }
      if (staggerConfig.direction !== undefined) {
        staggerOptions.direction = staggerConfig.direction;
      }

      processedParams.delay = window.lcards.anim.animejs.stagger(
        staggerConfig.value || 100,
        staggerOptions
      );

      lcardsLog.debug('[animateElement] Converted _stagger to stagger function', {
        value: staggerConfig.value,
        options: staggerOptions
      });
    }
  }

  // 3. Handle _radial marker - calculate radial stagger positions
  if (processedParams.delay?._radial === true) {
    lcardsLog.debug('[animateElement] Processing _radial marker');

    const radialConfig = processedParams.delay;

    if (!window.lcards?.anim?.animejs?.stagger) {
      lcardsLog.warn('[animateElement] stagger() not available for _radial marker');
    } else {
      // Use anime.js stagger with 'center' from option
      // This creates a radial effect from the center point
      processedParams.delay = window.lcards.anim.animejs.stagger(
        radialConfig.value || 50,
        {
          from: radialConfig.from || 'center',
          grid: radialConfig.grid,
          axis: radialConfig.axis
        }
      );

      lcardsLog.debug('[animateElement] Converted _radial to radial stagger', {
        value: radialConfig.value,
        from: radialConfig.from || 'center'
      });
    }
  }

  return {
    isTimeline: false,
    timelineInstance: null,
    processedParams
  };
}

/**
 * Animates element(s) using anime.js with special handling for SVG animations.
 * Unchanged behavior, v4-native through window.lcards.anim.anime
 */
export async function animateElement(scope, options, hass = null, onInstanceCreated = null) {
  const { type, targets, root = document, ...animOptions } = options;
  if (!type || !targets || !scope) {
    lcardsLog.warn('[animateElement] Animation missing type, targets, or scope.', { options, scope });
    return;
  }
  lcardsLog.debug('[animateElement] Received options:', { options });

  scope.scope.add(async () => {
    try {
      const elements = await waitForElements(targets, root);
      if (!elements || elements.length === 0) {
        lcardsLog.error('[animateElement] Target element(s) not found:', { targets });
        return;
      }

      lcardsLog.debug('[animateElement] Elements resolved:', {
        selector: targets,
        elementsFound: elements.length,
        elementDetails: elements.map(el => ({
          tag: el.tagName,
          id: el.id,
          classes: el.className
        }))
      });

      // Log cascade animation targeting for debugging
      if (type === 'cascade-color') {
        lcardsLog.debug('[animateElement] Cascade-color targeting:', {
          selector: targets,
          elementsFound: elements.length,
          elementTags: elements.map(el => `${el.tagName}[data-row=${/** @type {any} */ (el).dataset.row},data-col=${/** @type {any} */ (el).dataset.col}]`)
        });
      }

      // ── Stagger-batch short-circuit ──────────────────────────────────────────
      // Stagger presets (stagger-grid, stagger-wave, stagger-radial) require a
      // SINGLE anime() call across ALL elements so that the stagger delay
      // function receives the correct per-element index.  Calling anime() once
      // per element (as the loop below does) gives every element index 0.
      // Detect this case by pre-running the preset and checking delay._stagger.
      if (elements.length > 1 && !Array.isArray(type)) {
        const _batchPresetFn = getAnimationPreset(String(type).toLowerCase());
        if (_batchPresetFn) {
          try {
            const _batchProbeParams = { duration: 1000, ease: 'inOutQuad', ...animOptions };
            if (_batchProbeParams.ease) _batchProbeParams.ease = resolveEasing(_batchProbeParams.ease);
            const _batchProbeResult = _batchPresetFn({ params: { ..._batchProbeParams }, ...options });

            if (_batchProbeResult?.anime?.delay?._stagger === true) {
              // Build final batch params by merging preset anime output.
              // Start from probe params then let the preset output overwrite — this
              // ensures the preset's [property]:[from,to] tween wins over anything
              // the probe params might have for the same key.
              const _batchParams = { ..._batchProbeParams };
              Object.assign(_batchParams, _batchProbeResult.anime);

              // Apply per-element CSS styles from preset
              if (_batchProbeResult.styles) {
                elements.forEach(el => Object.assign(/** @type {any} */ (el).style, _batchProbeResult.styles));
              }
              // Run preset setup callbacks
              if (_batchProbeResult.setup) {
                elements.forEach(el => { try { _batchProbeResult.setup(el); } catch (_se) {} });
              }

              // Convert _stagger / _radial marker to anime.js stagger() function
              const _batchMarkerResult = _processAnimationMarkers(_batchParams, elements[0], scope);
              if (!_batchMarkerResult.isTimeline) {
                // Resolve CSS variables (var(--...)) in color properties so anime.js
                // can interpolate them correctly (it can't parse var() references).
                const _batchResolvedParams = resolveAnimationCssVariables(_batchMarkerResult.processedParams);

                // Strip LCARdS-internal meta-params that must not be passed to anime.js.
                // e.g. 'from', 'grid', 'property', 'from_value', 'to_value', 'trigger'
                // are consumed by the preset/AnimationManager and are not valid anime.js params.
                const _batchFinalParams = _cleanAnimeParams(_batchResolvedParams);
                const _batchInstance = window.lcards.anim.anime(elements, _batchFinalParams);
                if (onInstanceCreated) onInstanceCreated(_batchInstance);
              }
              return; // bypass per-element loop
            }
          } catch (_batchErr) {
            lcardsLog.warn('[animateElement] ⚠️ Stagger-batch probe failed — falling back to per-element loop', {
              error: _batchErr?.message,
              type,
              stack: _batchErr?.stack?.split('\n')[1]
            });
          }
        }
      }

      for (const element of elements) {
        const params = {
          duration: 1000,
          ease: 'inOutQuad',  // Default to v4 naming
          ...animOptions,
        };

        // ✨ Resolve ease configuration (string or parametric object)
        if (params.ease) {
          params.ease = resolveEasing(params.ease);
        }

        // state_resolver hook (left as-is)
        if (options.state_resolver && options.entity && window.lcards.styleHelpers?.resolveStateStyles) {
          const resolvedStyles = window.lcards.styleHelpers.resolveStateStyles(
            options.state_resolver,
            hass,
            options.entity
          );
          Object.assign(params, resolvedStyles);
        }

        // Apply preset(s)
        if (Array.isArray(type)) {
          applyPresets(type, params, element, options);
        } else {
          // Try new MSD preset system first
          const msdPresetFn = getAnimationPreset(String(type).toLowerCase());

          if (msdPresetFn) {
            // Use new MSD preset system
            lcardsLog.debug(`[animateElement] Using MSD preset: ${type}`);

            try {
              const presetResult = msdPresetFn({ params: params, ...options });

              // Apply anime.js parameters
              if (presetResult.anime) {
                Object.assign(params, presetResult.anime);
              }

              // Resolve CSS variables in animation params (for theme reactivity)
              const resolvedParams = resolveAnimationCssVariables(params);
              Object.assign(params, resolvedParams);

              // Call setup function if provided (for CSS keyframe injection, etc.)
              if (presetResult.setup && typeof presetResult.setup === 'function') {
                presetResult.setup(element);
              }

              // Apply CSS styles to target element
              if (presetResult.styles && element) {
                Object.assign(/** @type {HTMLElement} */ (element).style, presetResult.styles);
              }
            } catch (error) {
              lcardsLog.error(`[animateElement] Error applying MSD preset ${type}:`, error);
            }
          }

          // Handle morph animation (special case)
          if (String(type).toLowerCase() === 'morph') {
            if (!options.morph_to_selector) {
              lcardsLog.error('[animateElement] morph animation requires a `morph_to_selector`.', { options });
              continue;
            }
            const morphTarget = await waitForElement(options.morph_to_selector, root);
            if (!morphTarget) {
              lcardsLog.error(`[animateElement] morph could not find target shape for selector: ${options.morph_to_selector}`);
              continue;
            }
            const precision = options.precision ? parseInt(options.precision, 10) : undefined;
            Object.assign(params, { d: window.lcards.animejs.svg.morphTo(morphTarget, precision) });
          }
        }

        // Skip if preset handled via CSS or nulled targets
        if (params._cssAnimation || params.targets === null) {
          continue;
        }

        // Process special animation markers (_timeline, _stagger, _radial)
        const markerResult = _processAnimationMarkers(params, element, scope);

        // If timeline marker was processed, track the timeline instance and skip anime() call
        if (markerResult.isTimeline && markerResult.timelineInstance) {
          lcardsLog.debug(`[animateElement] Timeline created for ${type}`, {
            scopeId: scope.id || 'no-id',
            element: element.id || element.tagName
          });

          // Call callback with the timeline instance (for tracking)
          if (onInstanceCreated && typeof onInstanceCreated === 'function') {
            onInstanceCreated(markerResult.timelineInstance);
          }

          continue; // Skip anime() call for timelines
        }

        // Use processed params (with stagger/radial converted if needed)
        const processedParams = markerResult.processedParams;

        // Check if preset created a drawable (for draw animations)
        // or overrode the target element
        let targetElement = element;
        let animeParams = { ...processedParams };

        if (/** @type {any} */ (element)._drawable) {
          // Use drawable created by preset setup (e.g., draw animation)
          targetElement = /** @type {any} */ (element)._drawable;
          lcardsLog.debug(`[animateElement] Using drawable for ${type}`, { element: element.tagName });
        } else if (processedParams.targets && processedParams.targets instanceof Element) {
          // Preset wants to animate a different element (e.g., text child of group)
          targetElement = processedParams.targets;
          // Remove targets from params since it's passed as first argument
          const { targets: _, ...rest } = processedParams;
          animeParams = rest;
        } else if (/** @type {any} */ (element)._animTargets !== undefined) {
          // Text/split animations: setup() stored per-character targets on the element.
          // null signals that setup() self-managed the animation entirely (e.g. scramble).
          const animTargets = /** @type {any} */ (element)._animTargets;
          delete /** @type {any} */ (element)._animTargets;
          if (animTargets === null) {
            lcardsLog.debug(`[animateElement] Preset setup() self-managed animation for ${type}, skipping main anime call`);
            continue;
          }
          targetElement = animTargets;
          // Strip the CSS-selector placeholder 'targets' from params (no longer needed)
          const { targets: _, ...rest } = animeParams;
          animeParams = rest;
        }

        // Strip LCARdS-internal meta-params before calling anime.animate()
        const cleanedAnimeParams = _cleanAnimeParams(animeParams);

        const animeInstance = window.lcards.anim.anime(targetElement, cleanedAnimeParams);
        lcardsLog.debug(`[animateElement] Animation instance created:`, {
          scopeId: scope.id || 'no-id',
          element: element.id || element.tagName,
          targetElement: targetElement?.id || targetElement?.tagName || typeof targetElement,
          animeInstance: !!animeInstance,
          params: cleanedAnimeParams
        });

        // Call callback with the created instance (for tracking)
        if (onInstanceCreated && typeof onInstanceCreated === 'function') {
          onInstanceCreated(animeInstance);
        }
      }
    } catch (error) {
      lcardsLog.error('[animateElement] Failed to animate element(s):', { targets, type, error });
    }
  });
}


/**
 * v4: Create a single timeline from an array of steps.
 * Uses createTimeline consistently and add(targets, vars, offset).
 * @param {Array} timelineConfig - [{ targets, ...vars, offset? }]
 * @param {string} scopeId
 * @param {Element|Document} root
 */
export async function createTimeline(timelineConfig, scopeId, root = document) {
  const scopeObj = window.lcards.anim.scopes.get(scopeId);
  const timeline = window.lcards.anim.animejs.createTimeline({ scope: scopeObj?.scope });

  if (!Array.isArray(timelineConfig)) return timeline;

  for (const step of timelineConfig) {
    const { targets, offset, ...vars } = step || {};
    if (!targets) continue;
    const element = await window.lcards.anim.waitForElement(targets, root);
    if (!element) continue;
    timeline.add(element, vars, offset);
  }
  if (scopeObj) scopeObj.addAnimation?.(timeline);
  return timeline;
}

/**
 * Creates multiple anime.js timelines from a config object, supporting global params and step merging.
 * Enhancements:
 * - Supports step.state_resolver using variables.msd.presets (stylePresets).
 * - Only strips 'direction' (v4 removed); keeps 'alternate' and 'loop'.
 * - Respects autoplay: does not force timeline.play() when autoplay === false.
 * - Marks preset calls with __timeline for timeline-friendly behavior.
 *
 * @param {object} timelinesConfig
 * @param {string} scopeId
 * @param {Element|Document} root
 * @param {object} overlayConfigs
 * @param {object|null} hass
 * @param {object} stylePresets - variables.msd.presets
 * @returns {Promise<object>} timelines by name
 */
export async function createTimelines(
  timelinesConfig,
  scopeId,
  root = document,
  overlayConfigs = {},
  hass = null,
  stylePresets = {}
) {
  const scopeObj = window.lcards.anim.scopes.get(scopeId);
  if (!scopeObj) {
    lcardsLog.error('[createTimelines] Scope not found:', scopeId);
    return {};
  }
  const timelines = {};
  const resolveAll = window.lcards.styleHelpers?.resolveAllDynamicValues;

  for (const [timelineName, timelineConfig] of Object.entries(timelinesConfig || {})) {
    const { steps, ...timelineGlobals } = timelineConfig || {};
    const resolvedGlobals = resolveAll ? resolveAll(timelineGlobals, hass) : timelineGlobals;

    const timeline = window.lcards.anim.animejs.createTimeline({
      scope: scopeObj.scope,
      ...resolvedGlobals
    });

    if (!steps || !Array.isArray(steps)) {
      lcardsLog.warn(`[createTimelines] Timeline "${timelineName}" has no steps array.`);
      timelines[timelineName] = timeline;
      continue;
    }

    for (const step of steps) {
      let elements = [];
      try {
        elements = await waitForElements(step.targets, root);
      } catch (error) {
        lcardsLog.error(`[createTimelines] Failed to find target(s) for "${timelineName}":`, { targets: step.targets, error });
        continue;
      }
      if (!elements || elements.length === 0) {
        lcardsLog.warn(`[createTimelines] No elements found for timeline "${timelineName}" step:`, { targets: step.targets });
        continue;
      }

      for (const element of elements) {
        const elementAnim = overlayConfigs?.[element.id]?.animation || {};
        let mergedParams = { ...elementAnim, ...resolvedGlobals, ...step };

        // State resolver on steps
        if (step?.state_resolver && window.lcards.styleHelpers?.resolveStatePreset) {
          try {
            const overrides = window.lcards.styleHelpers.resolveStatePreset(
              { state_resolver: step.state_resolver, entity: step.entity, attribute: step.attribute },
              stylePresets,
              hass
            );
            if (overrides && typeof overrides === 'object') {
              if (overrides.animation && typeof overrides.animation === 'object') {
                mergedParams = { ...mergedParams, ...overrides.animation };
              } else {
                mergedParams = { ...mergedParams, ...overrides };
              }
            }
          } catch (e) {
            lcardsLog.warn('[createTimelines] step.state_resolver failed', { timelineName, step, error: e });
          }
        }

        // Resolve dynamic values
        mergedParams = resolveAll ? resolveAll(mergedParams, hass) : mergedParams;

        // Defaults for text transforms in some presets
        if (
          (mergedParams.type === 'pulse' || mergedParams.type === 'glow') &&
          (element.tagName === 'text' || element.tagName === 'TEXT')
        ) {
          /** @type {any} */ (element).style.transformOrigin = 'center';
          /** @type {any} */ (element).style.transformBox = 'fill-box';
        }

        // Legacy preset application removed - all presets now from packs

        // Strip non-anime keys
        const {
          targets, offset, direction,
          state_resolver, preset, entity, attribute, __timeline,
          // NEW: strip these flags from anime params
          deep, descendants, apply_to,
          ...animeParams
        } = mergedParams;

        // Determine whether to apply immediate props to descendants
        const applyToDescendants =
          mergedParams.descendants === true ||
          mergedParams.deep === true ||
          mergedParams.apply_to === 'descendants';

        // Ensure non-animated properties are applied at the step start
        const immediateKeys = ['fill', 'stroke', 'stroke-width', 'filter', 'color', 'opacity'];
        const immediateSet = {};
        for (const k of immediateKeys) {
          if (animeParams[k] !== undefined && !Array.isArray(animeParams[k]) && typeof animeParams[k] !== 'object') {
            immediateSet[k] = animeParams[k];
          }
        }
        if (Object.keys(immediateSet).length) {
          const userOnBegin = animeParams.onBegin;
          animeParams.onBegin = () => {
            try {
              const nodes = applyToDescendants ? element.querySelectorAll('*') : [element];
              if (window.lcards?.anim?.utils?.set) {
                nodes.forEach((n) => window.lcards.anim.utils.set(n, immediateSet));
              } else {
                nodes.forEach((n) => {
                  for (const [prop, val] of Object.entries(immediateSet)) {
                    if (prop in n.style) n.style[prop] = val;
                    else n.setAttribute(prop, val);
                  }
                });
              }
            } catch (_) {}
            if (typeof userOnBegin === 'function') userOnBegin();
          };
        }

        // v4 add(targets, vars, offset)
        timeline.add(element, animeParams, offset);
      }
    }

    if (typeof scopeObj.addAnimation === 'function') {
      scopeObj.addAnimation(timeline);
    }
    timelines[timelineName] = timeline;

    if (resolvedGlobals?.autoplay === false) {
      lcardsLog.info(`[createTimelines] Timeline "${timelineName}" created with autoplay: false.`);
    }
  }
  return timelines;
}

/**
 * Applies one or more animation presets to the anime.js params object.
 * @deprecated All presets now come from the pack system. Use {@link getAnimationPreset} instead.
 */
export function applyPresets(types, params, element, options) {
  lcardsLog.warn('[applyPresets] Legacy function called - use pack-based presets instead');
}


