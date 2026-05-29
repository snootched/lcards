/**
 * State-Based Color Resolution Utility
 *
 * Provides consistent logic for resolving state-based colors across all cards.
 * Checks actual entity state first (e.g., "heat", "cool", "playing") before
 * falling back to mapped/classified states (e.g., "active", "inactive").
 *
 * @module utils/state-color-resolver
 */

/**
 * Evaluate numeric range-keyed color conditions, picking the most specific match.
 *
 * Supported key formats:
 *   above:N      → value > N  (strictly greater)
 *   below:N      → value < N  (strictly less)
 *   between:N:M  → N <= value <= M  (inclusive both ends)
 *
 * Specificity order for overlapping matches:
 *   1. between — sorted by range width ascending  (narrowest wins)
 *   2. above   — sorted by threshold descending   (highest threshold wins)
 *   3. below   — sorted by threshold ascending    (lowest threshold wins)
 *
 * @param {number} value - The numeric entity state value
 * @param {Object} colorConfig - The color config object containing possible range keys
 * @returns {string|undefined} Matched color value, or undefined if no range matches
 */
function _resolveRangeColor(value, colorConfig) {
    const candidates = [];

    for (const key of Object.keys(colorConfig)) {
        if (key.startsWith('above:')) {
            const threshold = parseFloat(key.slice(6));
            if (!isNaN(threshold) && value > threshold) {
                candidates.push({ type: 'above', threshold, key });
            }
        } else if (key.startsWith('below:')) {
            const threshold = parseFloat(key.slice(6));
            if (!isNaN(threshold) && value < threshold) {
                candidates.push({ type: 'below', threshold, key });
            }
        } else {
            const m = key.match(/^between:(-?[\d.]+):(-?[\d.]+)$/);
            if (m) {
                const lo = parseFloat(m[1]), hi = parseFloat(m[2]);
                if (!isNaN(lo) && !isNaN(hi) && value >= lo && value <= hi) {
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
        if (a.type === 'between') return a.width - b.width;
        if (a.type === 'above')   return b.threshold - a.threshold;
        if (a.type === 'below')   return a.threshold - b.threshold;
        return 0;
    });

    return colorConfig[candidates[0].key];
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
export function resolveStateColor({ actualState, classifiedState, colorConfig, fallback = null, numericState = undefined, attributeState = undefined }) {
    // If colorConfig is null/undefined, return fallback
    if (!colorConfig) {
        return fallback;
    }

    // If colorConfig is a plain string (not state-based), return it directly
    if (typeof colorConfig !== 'object') {
        return colorConfig;
    }

    // State-based color object - check in priority order:
    // 0. Attribute state — String(entity.attributes[state_attribute]) — highest priority
    //    (only when attributeState !== undefined, set via config.state_attribute)
    // 1. Actual entity state (e.g., "heat", "cool", "playing")
    // 2. "zero" — exact numeric zero match (value === 0); treated like an exact-match key
    // 3. Range conditions (above:N, below:N, between:N:M) — most-specific numeric match wins
    // 4. "non_zero" — catch-all for any non-zero number (only when no range matched)
    // 5. Classified state (e.g., "active", "inactive", "unavailable")
    // 6. Default state / fallback parameter
    //
    // "zero" comes before ranges because it is an exact condition (value === 0), not a range.
    // "non_zero" comes after ranges because it is a catch-all fallback.
    //
    // NOTE: Use !== undefined throughout to avoid silently skipping falsy color
    // values (e.g., an empty string reset or a future numeric token).
    //
    // numericState: optional override for the numeric value used in steps 2-4.
    // When provided, it replaces parseFloat(actualState) for range/zero/non_zero
    // evaluation. This allows callers to use entity attributes (e.g. brightness_pct)
    // for range conditions while keeping actualState for exact-string matching.
    //
    // attributeState: optional String(entity.attributes[state_attribute]) override.
    // When provided, it is checked before actualState for exact-key matching, allowing
    // boolean (true→"true") and discrete string (e.g. "fade") attributes to drive colors.
    let resolved;

    // Pre-compute numeric value once: use explicit numericState when provided,
    // otherwise parse actualState string (works for numeric sensor entities).
    const numericVal = numericState !== undefined ? numericState : parseFloat(actualState);
    const numericValValid = !isNaN(numericVal);

    // 0. Attribute state match — String(entity.attributes[state_attribute])
    // Checked before actualState so boolean/discrete attributes take precedence.
    if (attributeState !== undefined && colorConfig[attributeState] !== undefined) {
        resolved = colorConfig[attributeState];
    }

    // 1. Exact raw state match (always uses actualState string, never the numeric override)
    if (resolved === undefined && actualState != null && colorConfig[actualState] !== undefined) {
        resolved = colorConfig[actualState];
    }

    // 2. "zero" — exact numeric zero (higher specificity than any range)
    if (resolved === undefined) {
        if (numericValValid && numericVal === 0 && colorConfig.zero !== undefined) {
            resolved = colorConfig.zero;
        }
    }

    // 3. Range conditions (above:N, below:N, between:N:M) — most-specific match wins
    if (resolved === undefined) {
        if (numericValValid) {
            resolved = _resolveRangeColor(numericVal, colorConfig);
        }
    }

    // 4. "non_zero" — catch-all for any non-zero number (no range matched)
    if (resolved === undefined) {
        if (numericValValid && numericVal !== 0 && colorConfig.non_zero !== undefined) {
            resolved = colorConfig.non_zero;
        }
    }

    // 4. Classified state (active / inactive / unavailable / default)
    if (resolved === undefined && classifiedState != null && colorConfig[classifiedState] !== undefined) {
        resolved = colorConfig[classifiedState];
    }

    // 5. Default / fallback
    if (resolved === undefined) {
        resolved = colorConfig.default !== undefined ? colorConfig.default : fallback;
    }

    // Resolve computed tokens (e.g., "darken(var(--lcards-orange), 0.2)") via ThemeTokenResolver.
    // Skip match-light/match-brightness tokens — these are per-card runtime placeholders that
    // must not be evaluated here; _resolveMatchLightColor() handles them at render time.
    if (resolved && window.lcards?.core?.themeManager?.resolver &&
        !String(resolved).includes('match-light') && !String(resolved).includes('match-brightness')) {
        resolved = window.lcards.core.themeManager.resolver.resolve(resolved, resolved);
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
