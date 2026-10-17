/**
 * @fileoverview Merge helpers for CoreConfigManager
 *
 * Provides deep merging and provenance tracking utilities
 * for configuration layer merging.
 *
 * @module core/config-manager/merge-helpers
 */

/**
 * Deep merge two objects recursively
 *
 * Rules:
 * - Primitives and arrays in source overwrite target
 * - Objects are merged recursively
 * - null/undefined values are treated as overrides
 *
 * @param {Object} target - Target object (lower priority)
 * @param {Object} source - Source object (higher priority)
 * @returns {Object} Merged object
 *
 * @example
 * const result = deepMerge(
 *   { a: 1, b: { x: 1, y: 2 } },
 *   { b: { y: 3, z: 4 }, c: 5 }
 * );
 * // Result: { a: 1, b: { x: 1, y: 3, z: 4 }, c: 5 }
 */
export function deepMerge(target, source) {
  // Handle null/undefined
  if (!source) return target;
  if (!target) return source;

  // Create result from target
  const result = { ...target };

  // Merge each property from source
  for (const [key, value] of Object.entries(source)) {
    if (value === null || value === undefined) {
      // Explicit null/undefined overrides
      result[key] = value;
    } else if (Array.isArray(value)) {
      // Arrays overwrite (no merge)
      result[key] = [...value];
    } else if (typeof value === 'object' && value.constructor === Object) {
      // Plain objects - recurse
      result[key] = deepMerge(result[key] || {}, value);
    } else {
      // Primitives, functions, class instances - overwrite
      result[key] = value;
    }
  }

  return result;
}

/**
 * Track field sources for provenance with layer-by-layer values
 *
 * Records which layer each field came from AND the value at each layer.
 *
 * @param {Object} fieldSources - Output map of field paths to source info
 * @param {Object} layers - Map of layer name to layer object
 * @param {string} prefix - Current path prefix for recursion
 *
 * @example
 * const sources = {};
 * trackFieldSources(sources, {
 *   card_defaults: { show_label: true, style: { color: 'blue' } },
 *   user_config: { label: 'Test', style: { color: 'red' } }
 * });
 * // sources: {
 * //   'show_label': { layers: { card_defaults: true }, final: 'card_defaults' },
 * //   'label': { layers: { user_config: 'Test' }, final: 'user_config' },
 * //   'style.color': { layers: { card_defaults: 'blue', user_config: 'red' }, final: 'user_config' }
 * // }
 */
export function trackFieldSources(fieldSources, layers, prefix = '') {
  // Get all unique keys across all layers
  const allKeys = new Set();
  for (const layer of Object.values(layers)) {
    if (layer && typeof layer === 'object') {
      Object.keys(layer).forEach(key => allKeys.add(key));
    }
  }

  // For each key, track value at each layer
  for (const key of allKeys) {
    const fieldPath = prefix ? `${prefix}.${key}` : key;
    const layerValues = {};
    let finalSource = null;

    // Check layers in order to collect values
    for (const [layerName, layerData] of Object.entries(layers)) {
      if (layerData && typeof layerData === 'object' && key in layerData) {
        const value = layerData[key];

        // If it's an object, recurse to track nested fields
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          // Build nested layers object for recursion
          const nestedLayers = {};
          for (const [nestedLayerName, nestedLayerData] of Object.entries(layers)) {
            if (nestedLayerData && typeof nestedLayerData === 'object' && key in nestedLayerData) {
              nestedLayers[nestedLayerName] = nestedLayerData[key];
            }
          }
          trackFieldSources(fieldSources, nestedLayers, fieldPath);
        } else {
          // Store the value for this layer
          layerValues[layerName] = value;
          finalSource = layerName; // Last one wins
        }
      }
    }

    // Record source info (only if not an object with children and has values)
    if (Object.keys(layerValues).length > 0 && finalSource) {
      fieldSources[fieldPath] = {
        layers: layerValues,
        final: finalSource
      };
    }
  }
}

/**
 * Check if a key's value is an object with nested properties
 * @private
 */
function _isObjectWithChildren(layers, key) {
  for (const layerData of Object.values(layers)) {
    if (layerData && typeof layerData === 'object' && key in layerData) {
      const value = layerData[key];
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return Object.keys(value).length > 0;
      }
    }
  }
  return false;
}

/**
 * Create a shallow clone of an object
 * @param {Object} obj - Object to clone
 * @returns {Object} Shallow clone
 */
export function shallowClone(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return [...obj];
  return { ...obj };
}

/**
 * Check if value is a plain object (not array, Date, etc.)
 * @param {*} value - Value to check
 * @returns {boolean} True if plain object
 */
export function isPlainObject(value) {
  return value !== null &&
    typeof value === 'object' &&
    value.constructor === Object;
}

/**
 * Get value at nested path in object
 * @param {Object} obj - Object to traverse
 * @param {string} path - Dot-separated path (e.g., 'style.color')
 * @returns {*} Value at path, or undefined if not found
 *
 * @example
 * getNestedValue({ style: { color: 'red' } }, 'style.color')
 * // Returns: 'red'
 */
export function getNestedValue(obj, path) {
  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[part];
  }

  return current;
}

/**
 * Set value at nested path in object
 * @param {Object} obj - Object to modify
 * @param {string} path - Dot-separated path
 * @param {*} value - Value to set
 *
 * @example
 * const obj = {};
 * setNestedValue(obj, 'style.color', 'red');
 * // obj: { style: { color: 'red' } }
 */
export function setNestedValue(obj, path, value) {
  const parts = path.split('.');
  const lastPart = /** @type {string} */ (parts.pop());
  let current = obj;

  // Create nested structure
  for (const part of parts) {
    if (!(part in current) || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part];
  }

  // Set value
  current[lastPart] = value;
}
