/**
 * Configuration Merger Utilities
 * 
 * Deep merge utilities for editor configuration updates.
 */

/**
 * Deep merge two objects
 * @param {Object} target - Target object
 * @param {Object} source - Source object to merge
 * @returns {Object} Merged object
 */
export function deepMerge(target, source) {
    if (!source || typeof source !== 'object') {
        return target;
    }
    
    if (!target || typeof target !== 'object') {
        return source;
    }
    
    const result = { ...target };
    
    for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            const sourceValue = source[key];
            const targetValue = result[key];
            
            // Handle null/undefined explicitly
            if (sourceValue === null || sourceValue === undefined) {
                result[key] = sourceValue;
            }
            // Arrays are replaced, not merged
            else if (Array.isArray(sourceValue)) {
                result[key] = [...sourceValue];
            }
            // Objects are recursively merged
            else if (typeof sourceValue === 'object' && sourceValue.constructor === Object) {
                result[key] = deepMerge(targetValue, sourceValue);
            }
            // Primitives are replaced
            else {
                result[key] = sourceValue;
            }
        }
    }
    
    return result;
}

/**
 * Create a deep clone of an object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    
    if (Array.isArray(obj)) {
        return obj.map(item => deepClone(item));
    }
    
    const cloned = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            cloned[key] = deepClone(obj[key]);
        }
    }
    
    return cloned;
}
