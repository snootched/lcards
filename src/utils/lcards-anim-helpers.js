import { lcardsLog } from './lcards-logging.js';
import { getAnimationPreset } from '../core/animation/presets.js';

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
      if (staggerConfig.easing !== undefined) {
        staggerOptions.easing = staggerConfig.easing;
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

      // Log cascade animation targeting for debugging
      if (type === 'cascade-color') {
        lcardsLog.debug('[animateElement] Cascade-color targeting:', {
          selector: targets,
          elementsFound: elements.length,
          elementTags: elements.map(el => `${el.tagName}[data-row=${el.dataset.row},data-col=${el.dataset.col}]`)
        });
      }

      for (const element of elements) {
        const params = {
          duration: 1000,
          easing: 'easeInOutQuad',
          ...animOptions,
        };

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

              // Call setup function if provided (for CSS keyframe injection, etc.)
              if (presetResult.setup && typeof presetResult.setup === 'function') {
                presetResult.setup(element);
              }

              // Apply CSS styles to target element
              if (presetResult.styles && element) {
                Object.assign(element.style, presetResult.styles);
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

        // ✨ NEW: Process special animation markers (_timeline, _stagger, _radial)
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

        if (element._drawable) {
          // Use drawable created by preset setup (e.g., draw animation)
          targetElement = element._drawable;
          lcardsLog.debug(`[animateElement] Using drawable for ${type}`, { element: element.tagName });
        } else if (processedParams.targets && processedParams.targets instanceof Element) {
          // Preset wants to animate a different element (e.g., text child of group)
          targetElement = processedParams.targets;
          // Remove targets from params since it's passed as first argument
          const { targets: _, ...rest } = processedParams;
          animeParams = rest;
        }

        const animeInstance = window.lcards.anim.anime(targetElement, animeParams);
        lcardsLog.debug(`[animateElement] Animation instance created:`, {
          scopeId: scope.id || 'no-id',
          element: element.id || element.tagName,
          targetElement: targetElement?.id || targetElement?.tagName || typeof targetElement,
          animeInstance: !!animeInstance,
          params: animeParams
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
          element.style.transformOrigin = 'center';
          element.style.transformBox = 'fill-box';
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
 * DEPRECATED: Legacy function - all presets now from pack system
 */
export function applyPresets(types, params, element, options) {
  lcardsLog.warn('[applyPresets] Legacy function called - use pack-based presets instead');
}


