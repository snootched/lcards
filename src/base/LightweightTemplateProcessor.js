/**
 * Lightweight Template Processor for V2 Cards
 *
 * Provides template processing capabilities similar to button-card but optimized
 * for V2 cards. Supports:
 * - JavaScript templates ([[[code]]])
 * - Token replacement ({{token}})
 * - Simple string interpolation
 * - Context-aware evaluation
 * - Caching for performance
 */

import { lcardsLog } from '../utils/lcards-logging.js';

export class LightweightTemplateProcessor {
    constructor(systemsManager) {
        this.systems = systemsManager;
        this.cache = new Map();
        this.initialized = false;

        // Template evaluation context
        this.globalContext = {};

        lcardsLog.debug(`[LightweightTemplateProcessor] Created for card ${this.systems.cardId}`);
    }

    /**
     * Initialize the template processor
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.initialized) {
            return;
        }

        try {
            // Set up global context with common utilities
            this.globalContext = {
                // Math utilities
                Math,

                // String utilities
                String,

                // Date utilities
                Date,

                // Array utilities
                Array,

                // Helper functions
                helpers: {
                    formatNumber: this._formatNumber.bind(this),
                    formatDate: this._formatDate.bind(this),
                    capitalize: this._capitalize.bind(this),
                    pluralize: this._pluralize.bind(this),
                    parseJson: this._safeJsonParse.bind(this)
                }
            };

            this.initialized = true;
            lcardsLog.debug(`[LightweightTemplateProcessor] ✅ Initialized for card ${this.systems.cardId}`);

        } catch (error) {
            lcardsLog.error(`[LightweightTemplateProcessor] ❌ Initialization failed for card ${this.systems.cardId}:`, error);
            throw error;
        }
    }

    /**
     * Process a template with the given context
     * @param {any} template - Template to process
     * @param {Object} context - Template evaluation context
     * @returns {Promise<any>} Processed result
     */
    async process(template, context = {}) {
        if (!this.initialized) {
            lcardsLog.warn(`[LightweightTemplateProcessor] Not initialized, processing without templates (${this.systems.cardId})`);
            return template;
        }

        try {
            // Handle different template types
            if (typeof template === 'string') {
                return await this._processStringTemplate(template, context);
            }

            if (typeof template === 'function') {
                return await this._processFunctionTemplate(template, context);
            }

            if (Array.isArray(template)) {
                return await this._processArrayTemplate(template, context);
            }

            if (template && typeof template === 'object') {
                return await this._processObjectTemplate(template, context);
            }

            // Return as-is for primitive values
            return template;

        } catch (error) {
            lcardsLog.error(`[LightweightTemplateProcessor] Template processing failed (${this.systems.cardId}):`, error);
            return template; // Return original template on error
        }
    }

    /**
     * Process string templates
     * @private
     */
    async _processStringTemplate(template, context) {
        // Check cache first
        const cacheKey = `${template}:${JSON.stringify(context)}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        let result = template;

        // Handle JavaScript templates [[[code]]]
        if (template.includes('[[[') && template.includes(']]]')) {
            result = await this._processJavaScriptTemplate(template, context);
        }
        // Handle token replacement {{token}}
        else if (template.includes('{{') && template.includes('}}')) {
            result = await this._processTokenTemplate(template, context);
        }
        // Handle simple string interpolation ${var}
        else if (template.includes('${') && template.includes('}')) {
            result = await this._processInterpolationTemplate(template, context);
        }

        // Cache the result (limit cache size)
        if (this.cache.size > 1000) {
            this.cache.clear();
        }
        this.cache.set(cacheKey, result);

        return result;
    }

    /**
     * Process JavaScript templates (button-card style)
     * @private
     */
    async _processJavaScriptTemplate(template, context) {
        const jsPattern = /\[\[\[([\s\S]*?)\]\]\]/g;

        return template.replace(jsPattern, (match, code) => {
            try {
                // Create evaluation context
                const evalContext = this._createEvaluationContext(context);

                // Create function with context variables in scope
                const contextKeys = Object.keys(evalContext);
                const contextValues = Object.values(evalContext);

                const func = new Function(...contextKeys, `return ${code}`);
                const result = func(...contextValues);

                return result !== null && result !== undefined ? String(result) : '';

            } catch (error) {
                lcardsLog.warn(`[LightweightTemplateProcessor] JavaScript template evaluation failed (${this.systems.cardId}):`, error);
                return match; // Return original on error
            }
        });
    }

    /**
     * Process token templates ({{token}})
     * @private
     */
    async _processTokenTemplate(template, context) {
        const tokenPattern = /\{\{([^}]+)\}\}/g;

        return template.replace(tokenPattern, (match, tokenPath) => {
            try {
                const value = this._resolveTokenPath(tokenPath.trim(), context);
                return value !== null && value !== undefined ? String(value) : '';
            } catch (error) {
                lcardsLog.warn(`[LightweightTemplateProcessor] Token resolution failed (${this.systems.cardId}):`, error);
                return match; // Return original on error
            }
        });
    }

    /**
     * Process string interpolation templates (${var})
     * @private
     */
    async _processInterpolationTemplate(template, context) {
        const evalContext = this._createEvaluationContext(context);

        try {
            // Use template literal evaluation
            const func = new Function(...Object.keys(evalContext), `return \`${template}\``);
            return func(...Object.values(evalContext));
        } catch (error) {
            lcardsLog.warn(`[LightweightTemplateProcessor] String interpolation failed (${this.systems.cardId}):`, error);
            return template; // Return original on error
        }
    }

    /**
     * Process function templates
     * @private
     */
    async _processFunctionTemplate(template, context) {
        try {
            const evalContext = this._createEvaluationContext(context);
            return await template(evalContext);
        } catch (error) {
            lcardsLog.warn(`[LightweightTemplateProcessor] Function template execution failed (${this.systems.cardId}):`, error);
            return null;
        }
    }

    /**
     * Process array templates (process each element)
     * @private
     */
    async _processArrayTemplate(template, context) {
        const results = [];
        for (const item of template) {
            results.push(await this.process(item, context));
        }
        return results;
    }

    /**
     * Process object templates (process each property)
     * @private
     */
    async _processObjectTemplate(template, context) {
        const result = {};
        for (const [key, value] of Object.entries(template)) {
            result[key] = await this.process(value, context);
        }
        return result;
    }

    /**
     * Create evaluation context for templates
     * @private
     */
    _createEvaluationContext(context) {
        return {
            // Template context
            ...context,

            // Global context
            ...this.globalContext,

            // Card-specific context
            card: this.systems.card,
            config: context.config || this.systems.card.config,
            hass: context.hass || this.systems.card.hass,

            // Entity shorthand
            entity: context.entity || (context.config?.entity ?
                (context.hass || this.systems.card.hass)?.states[context.config.entity] :
                null),

            // Theme access
            theme: this.systems.getActiveTheme(),
            getThemeToken: this.systems.getThemeToken.bind(this.systems),

            // State utilities
            states: (context.hass || this.systems.card.hass)?.states || {},

            // Validation helpers
            isDefined: (value) => value !== null && value !== undefined,
            isEmpty: (value) => !value || (Array.isArray(value) && value.length === 0),

            // Logging (for template debugging)
            console: {
                log: (...args) => lcardsLog.debug(`[Template:${this.systems.cardId}]`, ...args),
                warn: (...args) => lcardsLog.warn(`[Template:${this.systems.cardId}]`, ...args),
                error: (...args) => lcardsLog.error(`[Template:${this.systems.cardId}]`, ...args)
            }
        };
    }

    /**
     * Resolve dot-notation token path
     * @private
     */
    _resolveTokenPath(path, context) {
        const evalContext = this._createEvaluationContext(context);
        const parts = path.split('.');

        let current = evalContext;
        for (const part of parts) {
            if (current === null || current === undefined) {
                return null;
            }
            current = current[part];
        }

        return current;
    }

    /**
     * Helper: Format number
     * @private
     */
    _formatNumber(value, decimals = 1) {
        const num = parseFloat(value);
        if (isNaN(num)) return value;
        return num.toFixed(decimals);
    }

    /**
     * Helper: Format date
     * @private
     */
    _formatDate(date, format = 'short') {
        if (!date) return '';

        const d = new Date(date);
        if (isNaN(d.getTime())) return date;

        switch (format) {
            case 'short': return d.toLocaleDateString();
            case 'long': return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
            case 'time': return d.toLocaleTimeString();
            case 'iso': return d.toISOString();
            default: return d.toLocaleDateString();
        }
    }

    /**
     * Helper: Capitalize string
     * @private
     */
    _capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Helper: Pluralize
     * @private
     */
    _pluralize(count, singular, plural = null) {
        const num = parseInt(count);
        if (num === 1) return singular;
        return plural || (singular + 's');
    }

    /**
     * Helper: Safe JSON parse
     * @private
     */
    _safeJsonParse(str, fallback = null) {
        try {
            return JSON.parse(str);
        } catch {
            return fallback;
        }
    }

    /**
     * Clear template cache
     */
    clearCache() {
        this.cache.clear();
        lcardsLog.debug(`[LightweightTemplateProcessor] Cache cleared (${this.systems.cardId})`);
    }

    /**
     * Get debug information
     * @returns {Object} Debug info
     */
    getDebugInfo() {
        return {
            initialized: this.initialized,
            cacheSize: this.cache.size,
            contextKeys: Object.keys(this.globalContext)
        };
    }

    /**
     * Clean up resources
     */
    async destroy() {
        this.cache.clear();
        this.globalContext = {};
        this.initialized = false;

        lcardsLog.debug(`[LightweightTemplateProcessor] ✅ Destroyed for card ${this.systems.cardId}`);
    }
}