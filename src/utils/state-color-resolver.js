/**
 * State-Based Color Resolution Utility
 *
 * Provides consistent logic for resolving state-based colors across all cards.
 * Checks actual entity state first (e.g., "heat", "cool", "playing") before
 * falling back to mapped/classified states (e.g., "active", "inactive").
 *
 * @module utils/state-color-resolver
 */

import { compareThreshold, compareBetween } from './comparison-utils.js';

/**
 * Evaluate numeric range-keyed color conditions, picking the most specific match.
 *
 * Supported key formats:
 *   above:N              → value > N   (strictly greater)
 *   at_least:N           → value >= N  (inclusive)
 *   below:N              → value < N   (strictly less)
 *   at_most:N            → value <= N  (inclusive)
 *   between:N:M          → N <= value <= M  (inclusive both ends)
 *   between_exclusive:N:M → N < value < M   (exclusive both ends)
 *
 * Specificity order for overlapping matches (at_least/at_most join the same
 * family as above/below; between_exclusive joins the same family as between):
 *   1. between/between_exclusive — sorted by range width ascending (narrowest wins)
 *   2. above/at_least             — sorted by threshold descending (highest threshold wins)
 *   3. below/at_most              — sorted by threshold ascending  (lowest threshold wins)
 *
 * @param {number} value - The numeric entity state value
 * @param {Object} colorConfig - The color config object containing possible range keys
 * @returns {string|undefined} Matched color value, or undefined if no range matches
 */
function _rangeKey(value, colorConfig) {
    /** @type {Array<{type: string, key: string, threshold?: number, lo?: number, hi?: number, width?: number}>} */
    const candidates = [];

    for (const key of Object.keys(colorConfig)) {
        if (key.startsWith('above:')) {
            const threshold = parseFloat(key.slice(6));
            if (!isNaN(threshold) && compareThreshold(value, 'above', threshold)) {
                candidates.push({ type: 'above', threshold, key });
            }
        } else if (key.startsWith('at_least:')) {
            const threshold = parseFloat(key.slice(9));
            if (!isNaN(threshold) && compareThreshold(value, 'at_least', threshold)) {
                candidates.push({ type: 'above', threshold, key });
            }
        } else if (key.startsWith('below:')) {
            const threshold = parseFloat(key.slice(6));
            if (!isNaN(threshold) && compareThreshold(value, 'below', threshold)) {
                candidates.push({ type: 'below', threshold, key });
            }
        } else if (key.startsWith('at_most:')) {
            const threshold = parseFloat(key.slice(8));
            if (!isNaN(threshold) && compareThreshold(value, 'at_most', threshold)) {
                candidates.push({ type: 'below', threshold, key });
            }
        } else if (key.startsWith('between_exclusive:')) {
            const m = key.match(/^between_exclusive:(-?[\d.]+):(-?[\d.]+)$/);
            if (m) {
                const lo = parseFloat(m[1]), hi = parseFloat(m[2]);
                if (!isNaN(lo) && !isNaN(hi) && compareBetween(value, lo, hi, true)) {
                    candidates.push({ type: 'between', lo, hi, width: hi - lo, key });
                }
            }
        } else {
            const m = key.match(/^between:(-?[\d.]+):(-?[\d.]+)$/);
            if (m) {
                const lo = parseFloat(m[1]), hi = parseFloat(m[2]);
                if (!isNaN(lo) && !isNaN(hi) && compareBetween(value, lo, hi, false)) {
                    candidates.push({ type: 'between', lo, hi, width: hi - lo, key });
                }
            }
        }
    }

    if (candidates.length === 0) return undefined;

    // Sort by specificity: between (narrowest first) > above (highest threshold first) > below (lowest threshold first)
    const typePriority = { between: 0, above: 1, below: 2 };
    candidates.sort((a, b) => {
        if (typePriority[a.type] !== typePriority[b.type]) {
            return typePriority[a.type] - typePriority[b.type];
        }
        // Each type always carries its own fields (width for between, threshold otherwise).
        if (a.type === 'between') return /** @type {number} */ (a.width) - /** @type {number} */ (b.width);
        if (a.type === 'above')   return /** @type {number} */ (b.threshold) - /** @type {number} */ (a.threshold);
        if (a.type === 'below')   return /** @type {number} */ (a.threshold) - /** @type {number} */ (b.threshold);
        return 0;
    });

    return candidates[0].key;
}

/**
 * Which key of a state-keyed config applies: the same precedence as
 * resolveStateColor (attributeState > actualState > zero > ranges > non_zero >
 * classifiedState > default). For provenance ("the active branch").
 *
 * @param {Object} options - As for resolveStateColor (fallback ignored)
 * @returns {string|null} The key, or null when none applies (or the config isn't an object)
 */
export function stateKeyFor({ actualState, classifiedState, colorConfig, numericState = undefined, attributeState = undefined }) {
    if (!colorConfig || typeof colorConfig !== 'object') return null;
    const has = (key) => key != null && colorConfig[key] !== undefined;
    const numericVal = numericState !== undefined ? numericState : parseFloat(actualState);
    const numericValValid = !isNaN(numericVal);

    if (attributeState !== undefined && has(attributeState)) return String(attributeState);
    if (actualState != null && has(actualState)) return String(actualState);
    if (numericValValid && numericVal === 0 && has('zero')) return 'zero';
    if (numericValValid) {
        const range = _rangeKey(numericVal, colorConfig);
        if (range !== undefined) return range;
    }
    if (numericValValid && numericVal !== 0 && has('non_zero')) return 'non_zero';
    if (has(classifiedState)) return String(classifiedState);
    if (has('default')) return 'default';
    return null;
}

/**
 * Resolve a state-based color value
 *
 * Automatically resolves computed color tokens (e.g., "darken(var(--lcards-orange), 0.2)")
 * via the ThemeTokenResolver singleton, making computed tokens work seamlessly across all cards.
 *
 * @param {Object} options - Resolution options
 * @param {string|null} options.actualState - The actual entity state (e.g., "heat", "cool", "playing")
 * @param {string} options.classifiedState - The classified/mapped state (e.g., "active", "inactive", "unavailable")
 * @param {Object|string} options.colorConfig - The color configuration (can be object with state keys or string)
 * @param {string|number|null} [options.fallback] - Optional fallback value
 * @param {number} [options.numericState] - Value for zero/range/non_zero keys (from ranges_attribute)
 * @param {*} [options.attributeState] - Exact-match key source (from state_attribute)
 * @param {boolean} [options.resolveTokens=true] - Run the selected value through the theme
 *   resolver (CSS target). False returns it as configured, for callers that resolve it
 *   themselves (LCARdSCard._resolveColorValue's concrete path).
 * @returns {string|number|null} The resolved color value or null if not found
 *
 * @example
 * // With actual state "heat" that exists in config
 * resolveStateColor({
 *   actualState: 'heat',
 *   classifiedState: 'inactive',
 *   colorConfig: { heat: '#FF6600', inactive: '#666666', default: '#999999' }
 * });
 * // Returns: '#FF6600'
 *
 * @example
 * // With computed color token
 * resolveStateColor({
 *   actualState: 'on',
 *   classifiedState: 'active',
 *   colorConfig: { active: 'darken(var(--lcards-orange), 0.2)' }
 * });
 * // Returns: 'rgb(204, 102, 0)' (computed color)
 *
 * @example
 * // With actual state "heat" that doesn't exist in config
 * resolveStateColor({
 *   actualState: 'heat',
 *   classifiedState: 'inactive',
 *   colorConfig: { inactive: '#666666', default: '#999999' }
 * });
 * // Returns: '#666666' (falls back to classified state)
 *
 * @example
 * // With plain string config (no state-based colors)
 * resolveStateColor({
 *   actualState: 'heat',
 *   classifiedState: 'inactive',
 *   colorConfig: '#FF9900'
 * });
 * // Returns: '#FF9900'
 */
export function resolveStateColor({ actualState, classifiedState, colorConfig, fallback = null, numericState = undefined, attributeState = undefined, resolveTokens = true }) {
    // A plain value, a state map's selected value and the fallback all resolve
    // the same way, so `color: 'alpha(#f90, 0.5)'` works with or without a state map.
    let resolved;
    if (!colorConfig) {
        resolved = fallback;
    } else if (typeof colorConfig !== 'object') {
        resolved = colorConfig;
    } else {
        const key = stateKeyFor({ actualState, classifiedState, colorConfig, numericState, attributeState });
        resolved = key !== null ? colorConfig[key] : fallback;
    }

    // Theme tokens and computed functions; match-light/match-brightness are
    // per-card and substituted later by LCARdSCard._resolveMatchLightColor().
    const resolver = window.lcards?.core?.themeManager?.resolver;
    if (resolveTokens && typeof resolved === 'string' && resolver &&
        !resolved.includes('match-light') && !resolved.includes('match-brightness')) {
        resolved = resolver.resolve(resolved, resolved);
    }

    return resolved;
}

/**
 * Resolve a nested state-based color value (handles deep paths like border.color)
 *
 * @param {Object} options - Resolution options
 * @param {string|null} options.actualState - The actual entity state
 * @param {string} options.classifiedState - The classified/mapped state
 * @param {Object} options.configPath - The config object to navigate (e.g., border.color)
 * @param {string|number|null} [options.fallback] - Optional fallback value
 * @param {number} [options.numericState] - Numeric entity state, for numeric state-colour keys
 * @param {string} [options.attributeState] - Attribute value, when the colour follows an attribute
 * @returns {string|number|null} The resolved color value or null if not found
 *
 * @example
 * // Resolve border.color with actual state
 * resolveNestedStateColor({
 *   actualState: 'heat',
 *   classifiedState: 'inactive',
 *   configPath: buttonStyle.border.color,
 *   fallback: 'var(--lcars-color-secondary)'
 * });
 */
export function resolveNestedStateColor({ actualState, classifiedState, configPath, fallback = null, numericState = undefined, attributeState = undefined }) {
    return resolveStateColor({
        actualState,
        classifiedState,
        colorConfig: configPath,
        fallback,
        numericState,
        attributeState
    });
}
