/**
 * V2 Style Resolver
 *
 * Lightweight style resolution system for V2 cards that combines:
 * - Theme token values
 * - Base component styles
 * - State-based overrides
 * - Rule-based dynamic styling
 * - CSS custom property generation
 */

import { lcardsLog } from '../utils/lcards-logging.js';

export class V2StyleResolver {
    constructor(systemsManager) {
        this.systems = systemsManager;
        this.initialized = false;

        // Style resolution cache
        this.styleCache = new Map();

        // CSS property mappings
        this.cssPropertyMap = new Map([
            // Common mappings
            ['backgroundColor', 'background-color'],
            ['borderRadius', 'border-radius'],
            ['borderColor', 'border-color'],
            ['borderWidth', 'border-width'],
            ['fontSize', 'font-size'],
            ['fontWeight', 'font-weight'],
            ['fontFamily', 'font-family'],
            ['textAlign', 'text-align'],
            ['lineHeight', 'line-height'],
            ['marginTop', 'margin-top'],
            ['marginRight', 'margin-right'],
            ['marginBottom', 'margin-bottom'],
            ['marginLeft', 'margin-left'],
            ['paddingTop', 'padding-top'],
            ['paddingRight', 'padding-right'],
            ['paddingBottom', 'padding-bottom'],
            ['paddingLeft', 'padding-left']
        ]);

        lcardsLog.debug(`[V2StyleResolver] Created for card ${this.systems.cardId}`);
    }

    /**
     * Initialize the style resolver
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.initialized) {
            return;
        }

        try {
            this.initialized = true;
            lcardsLog.debug(`[V2StyleResolver] ✅ Initialized for card ${this.systems.cardId}`);

        } catch (error) {
            lcardsLog.error(`[V2StyleResolver] ❌ Initialization failed for card ${this.systems.cardId}:`, error);
            throw error;
        }
    }

    /**
     * Resolve styles by combining multiple sources
     * @param {Object} baseStyle - Base style object
     * @param {Array<string>} themeTokens - Array of theme token paths
     * @param {Object} stateOverrides - State-based style overrides
     * @param {Object} ruleOverrides - Rule-based style overrides
     * @returns {Object} Resolved style object
     */
    resolveStyle(baseStyle = {}, themeTokens = [], stateOverrides = {}, ruleOverrides = {}) {
        try {
            // Create cache key for this resolution
            const cacheKey = this._createCacheKey(baseStyle, themeTokens, stateOverrides, ruleOverrides);

            // Check cache first
            if (this.styleCache.has(cacheKey)) {
                return this.styleCache.get(cacheKey);
            }

            // Start with base style
            let resolved = { ...baseStyle };

            // Apply theme token values
            if (themeTokens.length > 0) {
                const themeStyles = this._resolveThemeTokens(themeTokens);
                resolved = { ...resolved, ...themeStyles };
            }

            // Apply state-based overrides
            resolved = { ...resolved, ...stateOverrides };

            // Apply rule-based overrides (highest priority)
            resolved = { ...resolved, ...ruleOverrides };

            // Normalize CSS properties
            resolved = this._normalizeCssProperties(resolved);

            // Cache the result (limit cache size)
            if (this.styleCache.size > 500) {
                this.styleCache.clear();
            }
            this.styleCache.set(cacheKey, resolved);

            return resolved;

        } catch (error) {
            lcardsLog.error(`[V2StyleResolver] Style resolution failed (${this.systems.cardId}):`, error);
            return { ...baseStyle, ...stateOverrides, ...ruleOverrides };
        }
    }

    /**
     * Resolve theme tokens to style values
     * @private
     */
    _resolveThemeTokens(themeTokens) {
        const resolved = {};

        for (const tokenPath of themeTokens) {
            try {
                const tokenValue = this.systems.getThemeToken(tokenPath);

                if (tokenValue && typeof tokenValue === 'object') {
                    // Token returned an object - merge its properties
                    Object.assign(resolved, tokenValue);
                } else if (tokenValue !== null && tokenValue !== undefined) {
                    // Token returned a single value - use token path as property name
                    const propertyName = this._tokenPathToProperty(tokenPath);
                    resolved[propertyName] = tokenValue;
                }
            } catch (error) {
                lcardsLog.warn(`[V2StyleResolver] Theme token resolution failed (${this.systems.cardId}): ${tokenPath}`, error);
            }
        }

        return resolved;
    }

    /**
     * Convert token path to CSS property name
     * @private
     */
    _tokenPathToProperty(tokenPath) {
        // Extract last segment of path and convert to camelCase
        const segments = tokenPath.split('.');
        const lastSegment = segments[segments.length - 1];

        // Convert kebab-case or snake_case to camelCase
        return lastSegment.replace(/[-_]([a-z])/g, (match, letter) => letter.toUpperCase());
    }

    /**
     * Normalize CSS properties (convert camelCase to kebab-case)
     * @private
     */
    _normalizeCssProperties(style) {
        const normalized = {};

        for (const [property, value] of Object.entries(style)) {
            // Check if we have a direct mapping
            const cssProperty = this.cssPropertyMap.get(property) ||
                               this._camelToKebab(property);

            normalized[cssProperty] = value;
        }

        return normalized;
    }

    /**
     * Convert camelCase to kebab-case
     * @private
     */
    _camelToKebab(str) {
        return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    }

    /**
     * Create cache key for style resolution
     * @private
     */
    _createCacheKey(baseStyle, themeTokens, stateOverrides, ruleOverrides) {
        const parts = [
            JSON.stringify(baseStyle),
            JSON.stringify(themeTokens),
            JSON.stringify(stateOverrides),
            JSON.stringify(ruleOverrides)
        ];
        return parts.join('|');
    }

    /**
     * Generate CSS custom properties from style object
     * @param {Object} style - Style object
     * @param {string} prefix - CSS custom property prefix
     * @returns {Object} CSS custom properties object
     */
    generateCustomProperties(style, prefix = '--lcards-v2') {
        const customProperties = {};

        for (const [property, value] of Object.entries(style)) {
            const cssProperty = this._normalizeCssProperties({ [property]: value });
            const cssPropertyName = Object.keys(cssProperty)[0];
            const customPropertyName = `${prefix}-${cssPropertyName}`;

            customProperties[customPropertyName] = value;
        }

        return customProperties;
    }

    /**
     * Convert style object to CSS string
     * @param {Object} style - Style object
     * @returns {string} CSS string
     */
    styleToCssString(style) {
        const normalized = this._normalizeCssProperties(style);

        return Object.entries(normalized)
            .map(([property, value]) => `${property}: ${value}`)
            .join('; ');
    }

    /**
     * Merge multiple style objects with precedence
     * @param {...Object} styles - Style objects (later ones take precedence)
     * @returns {Object} Merged style object
     */
    mergeStyles(...styles) {
        return styles.reduce((merged, style) => {
            return { ...merged, ...style };
        }, {});
    }

    /**
     * Apply responsive styles based on container size
     * @param {Object} baseStyle - Base style object
     * @param {Object} responsiveRules - Responsive style rules
     * @param {number} containerWidth - Container width in pixels
     * @returns {Object} Style with responsive overrides applied
     */
    applyResponsiveStyles(baseStyle, responsiveRules, containerWidth) {
        let result = { ...baseStyle };

        // Apply responsive rules in order of specificity
        const sortedBreakpoints = Object.keys(responsiveRules)
            .map(bp => ({ breakpoint: bp, value: parseInt(bp) }))
            .sort((a, b) => a.value - b.value);

        for (const { breakpoint } of sortedBreakpoints) {
            const breakpointValue = parseInt(breakpoint);
            if (containerWidth >= breakpointValue) {
                result = { ...result, ...responsiveRules[breakpoint] };
            }
        }

        return result;
    }

    /**
     * Get state-aware styles
     * @param {Object} baseStyles - Base styles for different states
     * @param {string} currentState - Current component state
     * @param {Object} fallbackStyle - Fallback style if state not found
     * @returns {Object} Style for current state
     */
    getStateStyle(baseStyles, currentState, fallbackStyle = {}) {
        return baseStyles[currentState] || baseStyles.default || fallbackStyle;
    }

    /**
     * Apply theme-aware color transformations
     * @param {string} color - Base color
     * @param {number} opacity - Opacity (0-1)
     * @param {number} lighten - Lighten amount (-1 to 1)
     * @returns {string} Transformed color
     */
    transformColor(color, opacity = null, lighten = null) {
        try {
            // This is a simplified version - could be enhanced with full color manipulation
            if (opacity !== null) {
                // Convert to rgba if opacity specified
                return `rgba(${color}, ${opacity})`;
            }

            if (lighten !== null) {
                // Basic lightening/darkening - could use more sophisticated color library
                return `color-mix(in srgb, ${color} ${(1 - Math.abs(lighten)) * 100}%, ${lighten > 0 ? 'white' : 'black'})`;
            }

            return color;

        } catch (error) {
            lcardsLog.warn(`[V2StyleResolver] Color transformation failed (${this.systems.cardId}):`, error);
            return color;
        }
    }

    /**
     * Clear style cache
     */
    clearCache() {
        this.styleCache.clear();
        lcardsLog.debug(`[V2StyleResolver] Style cache cleared (${this.systems.cardId})`);
    }

    /**
     * Get debug information
     * @returns {Object} Debug info
     */
    getDebugInfo() {
        return {
            initialized: this.initialized,
            cacheSize: this.styleCache.size,
            cssPropertyMappings: this.cssPropertyMap.size
        };
    }

    /**
     * Clean up resources
     */
    async destroy() {
        this.styleCache.clear();
        this.cssPropertyMap.clear();
        this.initialized = false;

        lcardsLog.debug(`[V2StyleResolver] ✅ Destroyed for card ${this.systems.cardId}`);
    }
}