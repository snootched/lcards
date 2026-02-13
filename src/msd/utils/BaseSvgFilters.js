/**
 * Base SVG Filter Utilities
 * Provides CSS filter application and transition support for base SVG layers
 */

import { lcardsLog } from '../../utils/lcards-logging.js';

// Counter for unique filter IDs
let filterIdCounter = 0;

/**
 * Generate SVG filter primitive element from filter config
 * @param {Object} filter - Filter configuration {mode, type, value}
 * @param {string} inputSource - Input for this primitive (e.g., 'SourceGraphic', 'result1')
 * @param {string} resultName - Result name for this primitive's output
 * @returns {SVGElement|null} SVG filter primitive element (DOM node)
 * @private
 */
function generateSvgFilterPrimitive(filter, inputSource, resultName) {
  const { type, value } = filter;
  const v = value || {};

  const SVG_NS = 'http://www.w3.org/2000/svg';
  let element = null;

  switch (type) {
    case 'feGaussianBlur':
      element = document.createElementNS(SVG_NS, 'feGaussianBlur');
      element.setAttribute('in', inputSource);
      element.setAttribute('stdDeviation', v.stdDeviation ?? 0);
      if (resultName) element.setAttribute('result', resultName);
      break;

    case 'feColorMatrix':
      element = document.createElementNS(SVG_NS, 'feColorMatrix');
      element.setAttribute('in', inputSource);
      if (v.type === 'matrix') {
        element.setAttribute('type', 'matrix');
        const matrixValues = Array.isArray(v.values) ? v.values.join(' ') : v.values;
        element.setAttribute('values', matrixValues);
      } else if (v.type === 'hueRotate') {
        element.setAttribute('type', 'hueRotate');
        element.setAttribute('values', v.values ?? 0);
      } else if (v.type === 'saturate') {
        element.setAttribute('type', 'saturate');
        element.setAttribute('values', v.values ?? 1);
      } else if (v.type === 'luminanceToAlpha') {
        element.setAttribute('type', 'luminanceToAlpha');
      } else {
        // Default to saturate
        element.setAttribute('type', 'saturate');
        element.setAttribute('values', v.values ?? 1);
      }
      if (resultName) element.setAttribute('result', resultName);
      break;

    case 'feOffset':
      element = document.createElementNS(SVG_NS, 'feOffset');
      element.setAttribute('in', inputSource);
      element.setAttribute('dx', v.dx ?? 0);
      element.setAttribute('dy', v.dy ?? 0);
      if (resultName) element.setAttribute('result', resultName);
      break;

    case 'feBlend':
      element = document.createElementNS(SVG_NS, 'feBlend');
      element.setAttribute('mode', v.mode || 'normal');
      // feBlend needs two inputs - use previous result and SourceGraphic
      element.setAttribute('in', inputSource);
      element.setAttribute('in2', v.in2 || 'SourceGraphic');
      if (resultName) element.setAttribute('result', resultName);
      break;

    case 'feComposite':
      element = document.createElementNS(SVG_NS, 'feComposite');
      element.setAttribute('in', inputSource);
      element.setAttribute('in2', v.in2 || 'SourceGraphic');
      if (v.operator === 'arithmetic') {
        element.setAttribute('operator', 'arithmetic');
        element.setAttribute('k1', v.k1 ?? 0);
        element.setAttribute('k2', v.k2 ?? 0);
        element.setAttribute('k3', v.k3 ?? 0);
        element.setAttribute('k4', v.k4 ?? 0);
      } else {
        element.setAttribute('operator', v.operator || 'over');
      }
      if (resultName) element.setAttribute('result', resultName);
      break;

    case 'feMorphology':
      element = document.createElementNS(SVG_NS, 'feMorphology');
      element.setAttribute('in', inputSource);
      element.setAttribute('operator', v.operator || 'erode');
      element.setAttribute('radius', v.radius ?? 1);
      if (resultName) element.setAttribute('result', resultName);
      break;

    case 'feTurbulence':
      element = document.createElementNS(SVG_NS, 'feTurbulence');
      // feTurbulence generates new content, doesn't use input
      element.setAttribute('type', v.type || 'turbulence');
      element.setAttribute('baseFrequency', v.baseFrequency ?? 0.05);
      element.setAttribute('numOctaves', v.numOctaves ?? 1);
      element.setAttribute('seed', v.seed ?? 0);
      if (resultName) element.setAttribute('result', resultName);
      break;

    case 'feDisplacementMap':
      element = document.createElementNS(SVG_NS, 'feDisplacementMap');
      element.setAttribute('scale', v.scale ?? 10);
      element.setAttribute('xChannelSelector', v.xChannelSelector || 'R');
      element.setAttribute('yChannelSelector', v.yChannelSelector || 'G');
      // feDisplacementMap needs two inputs
      element.setAttribute('in', v.in || inputSource);
      element.setAttribute('in2', v.in2 || 'SourceGraphic');
      if (resultName) element.setAttribute('result', resultName);
      break;

    default:
      lcardsLog.warn('[BaseSvgFilters] Unknown SVG filter primitive:', type);
      return null;
  }

  return element;
}

/**
 * Generate CSS filter string from filter array or object (legacy)
 * @param {Array|Object} filters - Filter array [{mode, type, value}] or legacy object {opacity, blur, etc.}
 * @param {boolean} normalize - If true, include all filter properties with defaults for smooth transitions
 * @returns {string} CSS filter string
 */
export function generateFilterString(filters, normalize = false) {
  if (!filters) {
    return normalize ? generateFilterString({}, true) : '';
  }

  // Handle array format (new stackable filters)
  if (Array.isArray(filters)) {
    return filters
      .filter(f => f.mode === 'css' || !f.mode) // Only CSS filters for now (SVG filters come later)
      .map(filter => {
        const { type, value } = filter;

        // Convert filter to CSS function string
        if (type === 'blur') {
          return `blur(${value})`;
        } else if (type === 'brightness') {
          return `brightness(${value})`;
        } else if (type === 'contrast') {
          return `contrast(${value})`;
        } else if (type === 'saturate') {
          return `saturate(${value})`;
        } else if (type === 'hue-rotate') {
          const hueValue = String(value).endsWith('deg') ? value : `${value}deg`;
          return `hue-rotate(${hueValue})`;
        } else if (type === 'grayscale') {
          return `grayscale(${value})`;
        } else if (type === 'sepia') {
          return `sepia(${value})`;
        } else if (type === 'invert') {
          return `invert(${value})`;
        } else if (type === 'opacity') {
          return `opacity(${value})`;
        } else if (type === 'drop-shadow') {
          // value is object: {x, y, blur, color}
          if (typeof value === 'object' && value !== null) {
            return `drop-shadow(${value.x || '0px'} ${value.y || '0px'} ${value.blur || '0px'} ${value.color || '#000'})`;
          }
          return `drop-shadow(${value || '0px 0px 0px #000'})`;
        }

        lcardsLog.warn('[BaseSvgFilters] Unknown filter type:', type);
        return '';
      })
      .filter(s => s) // Remove empty strings
      .join(' ');
  }

  // Handle legacy object format for backwards compatibility
  if (typeof filters !== 'object') {
    return normalize ? generateFilterString({}, true) : '';
  }

  // For smooth transitions, we need ALL filter properties present with their default values
  // This way CSS can interpolate between states properly
  const normalized = normalize ? {
    opacity: filters.opacity ?? 1,
    blur: filters.blur ?? '0px',
    brightness: filters.brightness ?? 1,
    contrast: filters.contrast ?? 1,
    saturate: filters.saturate ?? 1,
    hue_rotate: filters.hue_rotate ?? '0deg',
    grayscale: filters.grayscale ?? 0,
    sepia: filters.sepia ?? 0,
    invert: filters.invert ?? 0
  } : filters;

  const parts = [];

  // Order matters for visual quality - apply in logical sequence
  if (normalized.opacity !== undefined) {
    parts.push(`opacity(${normalized.opacity})`);
  }
  if (normalized.blur !== undefined) {
    parts.push(`blur(${normalized.blur})`);
  }
  if (normalized.brightness !== undefined) {
    parts.push(`brightness(${normalized.brightness})`);
  }
  if (normalized.contrast !== undefined) {
    parts.push(`contrast(${normalized.contrast})`);
  }
  if (normalized.saturate !== undefined) {
    parts.push(`saturate(${normalized.saturate})`);
  }
  if (normalized.hue_rotate !== undefined) {
    const hueValue = String(normalized.hue_rotate).endsWith('deg')
      ? normalized.hue_rotate
      : `${normalized.hue_rotate}deg`;
    parts.push(`hue-rotate(${hueValue})`);
  }
  if (normalized.grayscale !== undefined) {
    parts.push(`grayscale(${normalized.grayscale})`);
  }
  if (normalized.sepia !== undefined) {
    parts.push(`sepia(${normalized.sepia})`);
  }
  if (normalized.invert !== undefined) {
    parts.push(`invert(${normalized.invert})`);
  }

  return parts.join(' ');
}

/**
 * Apply filters to a base SVG element (typically #msd-base-content group)
 * Handles both CSS filters and SVG filter primitives
 * @param {HTMLElement} svgElement - The SVG element/group to apply filters to
 * @param {Array|Object} filters - Filter array [{mode, type, value}] or legacy object {opacity, blur, etc.}
 * @param {number} [transition] - Transition duration in milliseconds (optional)
 */
export function applyBaseSvgFilters(svgElement, filters, transition) {
  if (!svgElement) {
    lcardsLog.warn('[BaseSvgFilters] No SVG element provided');
    return;
  }

  lcardsLog.trace('[BaseSvgFilters] 🎨 Applying filters to base content:', {
    element: svgElement.tagName,
    elementId: svgElement.id,
    filters,
    transition
  });

  // Separate CSS and SVG filters
  let cssFilters = [];
  let svgFilters = [];

  if (Array.isArray(filters)) {
    cssFilters = filters.filter(f => f.mode === 'css' || !f.mode);
    svgFilters = filters.filter(f => f.mode === 'svg');
  } else if (filters && typeof filters === 'object') {
    // Legacy object format - all CSS
    cssFilters = [filters];
  }

  // Generate CSS filter string
  const useNormalized = transition && transition > 0;
  const cssFilterString = cssFilters.length > 0 ? generateFilterString(cssFilters, useNormalized) : '';

  // Handle SVG filters
  let svgFilterId = null;
  if (svgFilters.length > 0) {
    // Generate unique filter ID
    svgFilterId = `lcards-filter-${filterIdCounter++}`;

    // Find or create <defs> in parent SVG
    const parentSvg = svgElement.closest('svg');
    if (!parentSvg) {
      lcardsLog.warn('[BaseSvgFilters] Cannot apply SVG filters - no parent SVG found');
    } else {
      let defs = parentSvg.querySelector('defs');
      if (!defs) {
        defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        parentSvg.insertBefore(defs, parentSvg.firstChild);
      }

      // Remove old filter definitions (cleanup)
      const oldFilters = defs.querySelectorAll('filter[id^="lcards-filter-"]');
      oldFilters.forEach(f => {
        // Only remove if not currently in use
        const inUse = parentSvg.querySelector(`[filter="url(#${f.id})"]`);
        if (!inUse || f.id === svgFilterId) {
          f.remove();
        }
      });

      // Generate and inject new filter definition
      const filterElement = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
      filterElement.id = svgFilterId;
      filterElement.setAttribute('x', '-50%');
      filterElement.setAttribute('y', '-50%');
      filterElement.setAttribute('width', '200%');
      filterElement.setAttribute('height', '200%');

      // Add each primitive as a child element with auto-chaining
      // Each primitive uses the output of the previous one
      let currentInput = 'SourceGraphic';
      svgFilters.forEach((filter, index) => {
        const isLast = index === svgFilters.length - 1;
        const resultName = isLast ? null : `effect${index}`;

        const primitiveElement = generateSvgFilterPrimitive(filter, currentInput, resultName);
        if (primitiveElement) {
          filterElement.appendChild(primitiveElement);

          // Next primitive uses this one's output
          if (resultName) {
            currentInput = resultName;
          }
        }
      });

      defs.appendChild(filterElement);

      lcardsLog.trace('[BaseSvgFilters] Created SVG filter definition:', svgFilterId, 'with', svgFilters.length, 'chained primitives');
    }
  }

  // Combine CSS filter string and SVG filter reference
  let finalFilterValue = '';
  if (cssFilterString && svgFilterId) {
    // Both CSS and SVG filters
    finalFilterValue = `${cssFilterString} url(#${svgFilterId})`;
  } else if (cssFilterString) {
    // CSS only
    finalFilterValue = cssFilterString;
  } else if (svgFilterId) {
    // SVG only
    finalFilterValue = `url(#${svgFilterId})`;
  }

  lcardsLog.trace('[BaseSvgFilters] 🎨 Generated filter value:', finalFilterValue, useNormalized ? '(normalized for transition)' : '');

  // Apply transition if specified - MUST be set BEFORE changing the filter
  if (transition && transition > 0) {
    // Force a reflow to ensure transition is set before filter changes
    svgElement.style.transition = '';
    void svgElement.offsetHeight; // Force reflow

    svgElement.style.transition = `filter ${transition}ms ease-in-out`;

    // Use requestAnimationFrame to ensure transition is applied before filter change
    requestAnimationFrame(() => {
      // Apply the filter after transition is set
      if (svgFilterId) {
        svgElement.setAttribute('filter', `url(#${svgFilterId})`);
      }
      if (finalFilterValue) {
        svgElement.style.filter = finalFilterValue;
      }

      lcardsLog.trace('[BaseSvgFilters] ✅ Filter applied with transition to #' + (svgElement.id || 'element') + '. Current style.filter:', svgElement.style.filter);

      // Remove transition after it completes to avoid interfering with other updates
      setTimeout(() => {
        svgElement.style.transition = '';
      }, transition);
    });
  } else {
    // No transition - apply immediately
    if (svgFilterId) {
      svgElement.setAttribute('filter', `url(#${svgFilterId})`);
    } else {
      svgElement.removeAttribute('filter');
    }

    if (finalFilterValue) {
      svgElement.style.filter = finalFilterValue;
    } else {
      svgElement.style.filter = '';
    }

    lcardsLog.trace('[BaseSvgFilters] ✅ Filter applied instantly to #' + (svgElement.id || 'element') + '. Current style.filter:', svgElement.style.filter);
  }
}

/**
 * Transition from current filters to new filters
 * @param {HTMLElement} svgElement - The SVG element
 * @param {Array|Object} newFilters - New filter array or legacy object
 * @param {number} [duration=1000] - Transition duration in milliseconds
 * @returns {Promise} Resolves when transition completes
 */
export function transitionBaseSvgFilters(svgElement, newFilters, duration = 1000) {
  return new Promise((resolve) => {
    if (!svgElement) {
      lcardsLog.warn('[BaseSvgFilters] No SVG element provided');
      resolve();
      return;
    }

    lcardsLog.trace('[BaseSvgFilters] Starting transition to new filters:', { duration, filters: newFilters });

    // Apply transition with the specified duration
    applyBaseSvgFilters(svgElement, newFilters, duration);

    // Resolve after transition completes
    setTimeout(() => {
      lcardsLog.trace('[BaseSvgFilters] Transition complete');
      resolve();
    }, duration);
  });
}

/**
 * Clear all filters from a base SVG element
 * @param {HTMLElement} svgElement - The SVG element
 * @param {number} [transition] - Optional transition duration in milliseconds
 */
export function clearBaseSvgFilters(svgElement, transition) {
  if (!svgElement) {
    return;
  }

  lcardsLog.trace('[BaseSvgFilters] Clearing filters', { hasTransition: !!transition, transition });

  if (transition && transition > 0) {
    // Use normalized default filters for smooth transition to "no effect"
    const defaultFilters = generateFilterString({}, true);

    svgElement.style.transition = `filter ${transition}ms ease-in-out`;

    requestAnimationFrame(() => {
      svgElement.style.filter = defaultFilters;

      lcardsLog.trace('[BaseSvgFilters] Cleared to default filters with transition');

      setTimeout(() => {
        svgElement.style.transition = '';
        // After transition, can optionally clear to empty string
        // But keeping normalized defaults is actually safer
      }, transition);
    });
  } else {
    svgElement.style.filter = '';
    lcardsLog.trace('[BaseSvgFilters] Cleared filters instantly');
  }
}

/**
 * Get current computed filter values from an element
 * This is useful for debugging and state inspection
 * @param {HTMLElement} svgElement - The SVG element
 * @returns {string} Current filter string
 */
export function getCurrentFilters(svgElement) {
  if (!svgElement) {
    return '';
  }
  return svgElement.style.filter || '';
}

/**
 * Merge filter objects (useful for combining presets with overrides)
 * @param {Object} baseFilters - Base filter object
 * @param {Object} overrideFilters - Override filter object
 * @returns {Object} Merged filter object
 */
export function mergeFilters(baseFilters, overrideFilters) {
  return {
    ...baseFilters,
    ...overrideFilters
  };
}
