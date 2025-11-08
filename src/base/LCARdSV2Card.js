/**
 * LCARdS V2 Card Foundation
 *
 * Lightweight base class for V2 cards that leverage the singleton architecture.
 * V2 cards are purpose-built, lightweight components that use shared systems
 * without the complexity of full MSD pipeline.
 *
 * Architecture:
 * - ✅ Direct singleton access (RulesEngine, ThemeManager, etc.)
 * - ✅ Rules-responsive overlays
 * - ✅ Automatic theme inheritance
 * - ✅ Simple rendering pipeline
 * - ❌ No routing, no local systems, no complex configuration
 */

import { html, css, LitElement } from 'lit';
import { lcardsLog } from '../utils/lcards-logging.js';
import { lcardsCore } from '../core/lcards-core.js';
import { V2CardSystemsManager } from './V2CardSystemsManager.js';

/**
 * Base class for V2 Cards using singleton architecture
 *
 * Features:
 * - Singleton system integration
 * - Rule-based overlay updates
 * - Theme-aware styling
 * - Animation support
 * - Minimal configuration schema
 */
export class LCARdSV2Card extends LitElement {

    static get properties() {
        return {
            // Home Assistant integration
            hass: { type: Object },
            config: { type: Object },

            // V2 Card state
            _overlayTargets: { type: Object, state: true },
            _ruleResults: { type: Object, state: true },
            _themeVariables: { type: Object, state: true },
            _cardId: { type: String, state: true },
            _initialized: { type: Boolean, state: true }
        };
    }

    static get styles() {
        return css`
            :host {
                display: block;
                width: 100%;
                height: 100%;

                /* Theme variable inheritance */
                color: var(--primary-text-color);
                background: var(--card-background-color, transparent);

                /* LCARdS theme variables will be injected here */
            }

            .v2-card-container {
                width: 100%;
                height: 100%;
                position: relative;
                overflow: hidden;
            }

            .v2-card-loading {
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100px;
                font-size: 14px;
                color: var(--primary-text-color);
                opacity: 0.7;
            }

            .v2-card-error {
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100px;
                font-size: 14px;
                color: var(--error-color, #f44336);
                background: var(--error-background-color, rgba(244, 67, 54, 0.1));
                border: 1px solid var(--error-color, #f44336);
                border-radius: 4px;
                padding: 16px;
            }
        `;
    }

    constructor() {
        super();

        // Initialize V2 Card state
        this.hass = null;
        this.config = null;
        this._overlayTargets = {};
        this._ruleResults = {};
        this._themeVariables = {};
        this._cardId = this._generateCardId();
        this._initialized = false;
        this._callbackIndex = -1;

        // V2 Systems Manager (replaces direct singleton references)
        this.systemsManager = null;

        // Legacy singleton references (for compatibility)
        this.rulesEngine = null;
        this.themeManager = null;
        this.animationManager = null;
        this.dataSourceManager = null;

        lcardsLog.debug(`[LCARdSV2Card] Constructor called for ${this._cardId}`);
    }

    /**
     * Generate unique card ID for tracking
     */
    _generateCardId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `v2card_${timestamp}_${random}`;
    }

    /**
     * Initialize singleton connections
     */
    async _initializeSingletons() {
        if (this._initialized) {
            return;
        }

        try {
            // Wait for lcardsCore to be ready
            if (!lcardsCore || !lcardsCore.rulesManager) {
                lcardsLog.warn(`[LCARdSV2Card] lcardsCore not ready, waiting... (${this._cardId})`);
                // Retry after a short delay
                setTimeout(() => this._initializeSingletons(), 100);
                return;
            }

            // Create and initialize V2 Systems Manager
            this.systemsManager = new V2CardSystemsManager(this);
            await this.systemsManager.initialize();

            // Set up legacy singleton references for compatibility
            this.rulesEngine = this.systemsManager.rulesEngine;
            this.themeManager = this.systemsManager.themeManager;
            this.animationManager = this.systemsManager.animationManager;
            this.dataSourceManager = this.systemsManager.dataSourceManager;

            lcardsLog.debug(`[LCARdSV2Card] V2 Systems Manager initialized (${this._cardId})`);

            // Register with RulesEngine for rule updates
            this._registerWithRulesEngine();

            // Load theme variables
            this._loadThemeVariables();

            this._initialized = true;

            lcardsLog.debug(`[LCARdSV2Card] Initialization complete (${this._cardId})`);

        } catch (error) {
            lcardsLog.error(`[LCARdSV2Card] Singleton initialization failed (${this._cardId}):`, error);
        }
    }

    /**
     * Register card with RulesEngine for rule updates
     */
    _registerWithRulesEngine() {
        if (!this.rulesEngine) {
            lcardsLog.warn(`[LCARdSV2Card] No RulesEngine available for callback registration (${this._cardId})`);
            return;
        }

        // Register callback for rule updates
        this._callbackIndex = this.rulesEngine.setReEvaluationCallback(() => {
            this._handleRuleUpdate();
        });

        lcardsLog.debug(`[LCARdSV2Card] Registered rule callback (index: ${this._callbackIndex}, cardId: ${this._cardId})`);
    }

    /**
     * Handle rule updates from shared RulesEngine
     */
    _handleRuleUpdate() {
        if (!this.rulesEngine || !this.hass) {
            return;
        }

        try {
            // Get rule evaluation results
            const ruleResults = this.rulesEngine.evaluateDirty(this.hass);

            lcardsLog.trace(`[LCARdSV2Card] Rule update received (${this._cardId}):`, {
                hasBaseSvgUpdate: !!ruleResults.baseSvgUpdate,
                overlayPatches: ruleResults.overlayPatches?.length || 0
            });

            // Store rule results for processing
            this._ruleResults = ruleResults;

            // Apply rule results to card overlays
            this._applyRuleResults(ruleResults);

        } catch (error) {
            lcardsLog.error(`[LCARdSV2Card] Rule update processing failed (${this._cardId}):`, error);
        }
    }

    /**
     * Apply rule results to card overlays
     * Override in subclasses for specific overlay handling
     */
    _applyRuleResults(ruleResults) {
        if (!ruleResults.overlayPatches) {
            return;
        }

        // Process overlay patches that target this card's overlays
        ruleResults.overlayPatches.forEach(patch => {
            this._applyOverlayPatch(patch);
        });

        // Trigger re-render if patches were applied
        this.requestUpdate();
    }

    /**
     * Apply individual overlay patch
     * Override in subclasses for specific overlay types
     */
    _applyOverlayPatch(patch) {
        lcardsLog.trace(`[LCARdSV2Card] Processing overlay patch (${this._cardId}):`, {
            selector: patch.selector,
            hasStylePatch: !!patch.style
        });

        // Default implementation - subclasses should override
        // for specific overlay handling
    }

    /**
     * Load theme variables from ThemeManager
     */
    _loadThemeVariables() {
        if (!this.themeManager) {
            return;
        }

        try {
            const theme = this.themeManager.getActiveTheme();
            this._themeVariables = theme?.cssVariables || {};

            lcardsLog.trace(`[LCARdSV2Card] Theme variables loaded (${this._cardId}):`, {
                themeId: theme?.id,
                variableCount: Object.keys(this._themeVariables).length
            });

        } catch (error) {
            lcardsLog.error(`[LCARdSV2Card] Theme loading failed (${this._cardId}):`, error);
        }
    }

    /**
     * Register overlay targets with RulesEngine
     * Call this from subclasses to make overlays rule-responsive
     */
    _registerOverlayTarget(overlayId, overlayElement) {
        this._overlayTargets[overlayId] = overlayElement;

        lcardsLog.trace(`[LCARdSV2Card] Overlay target registered (${this._cardId}):`, {
            overlayId,
            hasElement: !!overlayElement
        });
    }

    /**
     * Component lifecycle: connected
     */
    connectedCallback() {
        super.connectedCallback();
        lcardsLog.debug(`[LCARdSV2Card] Connected (${this._cardId})`);

        // Initialize singletons when connected
        this._initializeSingletons();
    }

    /**
     * Component lifecycle: disconnected
     */
    async disconnectedCallback() {
        super.disconnectedCallback();

        // Clean up rule callback
        if (this.rulesEngine && this._callbackIndex >= 0) {
            this.rulesEngine.removeReEvaluationCallback(this._callbackIndex);
            lcardsLog.debug(`[LCARdSV2Card] Rule callback removed (${this._cardId})`);
        }

        // Clean up systems manager
        if (this.systemsManager) {
            await this.systemsManager.destroy();
            this.systemsManager = null;
            lcardsLog.debug(`[LCARdSV2Card] Systems manager destroyed (${this._cardId})`);
        }

        lcardsLog.debug(`[LCARdSV2Card] Disconnected (${this._cardId})`);
    }

    /**
     * Set card configuration
     */
    setConfig(config) {
        this.config = config;

        lcardsLog.debug(`[LCARdSV2Card] Config set (${this._cardId}):`, {
            type: config.type,
            hasConfig: !!config
        });

        this.requestUpdate();
    }

    // ============================================================================
    // Template Processing API
    // ============================================================================

    /**
     * Process a template with the current card context
     * @param {any} template - Template to process
     * @param {Object} additionalContext - Additional context for template
     * @returns {Promise<any>} Processed result
     */
    async processTemplate(template, additionalContext = {}) {
        if (!this.systemsManager) {
            lcardsLog.warn(`[LCARdSV2Card] Systems manager not ready, returning template as-is (${this._cardId})`);
            return template;
        }

        // Create enriched context
        const context = {
            ...additionalContext,
            entity: this.hass?.states[this.config?.entity],
            config: this.config,
            hass: this.hass,
            card: this
        };

        return this.systemsManager.processTemplate(template, context);
    }

    /**
     * Resolve styles using theme tokens and overrides
     * @param {Object} baseStyle - Base style object
     * @param {Array<string>} themeTokens - Array of theme token paths
     * @param {Object} stateOverrides - State-based style overrides
     * @returns {Object} Resolved style object
     */
    resolveStyle(baseStyle = {}, themeTokens = [], stateOverrides = {}) {
        if (!this.systemsManager) {
            return { ...baseStyle, ...stateOverrides };
        }

        // Include rule-based overrides if available
        const ruleOverrides = this._getRuleBasedStyleOverrides();

        return this.systemsManager.resolveStyle(baseStyle, themeTokens, stateOverrides, ruleOverrides);
    }

    /**
     * Get theme token value
     * @param {string} tokenPath - Dot-notation path to token
     * @param {any} fallback - Fallback value if token not found
     * @returns {any} Token value or fallback
     */
    getThemeToken(tokenPath, fallback = null) {
        if (!this.systemsManager) {
            return fallback;
        }

        return this.systemsManager.getThemeToken(tokenPath, fallback);
    }

    /**
     * Subscribe to a data source
     * @param {Object} dsConfig - DataSource configuration
     * @param {Function} callback - Update callback
     * @returns {Promise<string>} Subscription ID
     */
    async subscribeToDataSource(dsConfig, callback) {
        if (!this.systemsManager) {
            throw new Error('Systems manager not available');
        }

        return this.systemsManager.subscribeToDataSource(dsConfig, callback);
    }

    /**
     * Unsubscribe from a data source
     * @param {string} subscriptionId - Subscription ID to cancel
     */
    async unsubscribeFromDataSource(subscriptionId) {
        if (this.systemsManager) {
            await this.systemsManager.unsubscribeFromDataSource(subscriptionId);
        }
    }

    /**
     * Register overlay target for rule-based updates
     * @param {string} overlayId - Overlay ID
     * @param {Element} targetElement - Target DOM element
     */
    _registerOverlayTarget(overlayId, targetElement) {
        this._overlayTargets[overlayId] = targetElement;
        lcardsLog.debug(`[LCARdSV2Card] Overlay target registered (${this._cardId}): ${overlayId}`);
    }

    /**
     * Get rule-based style overrides for current card state
     * @private
     */
    _getRuleBasedStyleOverrides() {
        // Extract style overrides from current rule results
        // This allows rules to dynamically modify card styling
        const overrides = {};

        if (this._ruleResults?.overlayPatches) {
            this._ruleResults.overlayPatches.forEach(patch => {
                if (patch.selector === this._cardId || patch.selector === 'self') {
                    Object.assign(overrides, patch.style || {});
                }
            });
        }

        return overrides;
    }

    // ============================================================================
    // Lifecycle and Rendering
    // ============================================================================

    /**
     * Render the card
     * Override in subclasses for specific card rendering
     */
    render() {
        if (!this.config) {
            return html`
                <div class="v2-card-container">
                    <div class="v2-card-loading">
                        Loading V2 Card...
                    </div>
                </div>
            `;
        }

        if (!this._initialized) {
            return html`
                <div class="v2-card-container">
                    <div class="v2-card-loading">
                        Initializing singletons...
                    </div>
                </div>
            `;
        }

        // Default render - subclasses should override
        return html`
            <div class="v2-card-container">
                <div class="v2-card-loading">
                    V2 Card Base - Override render() method
                </div>
            </div>
        `;
    }

    /**
     * Get card size for Home Assistant
     */
    getCardSize() {
        return 3; // Default size, override in subclasses
    }
}