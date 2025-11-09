/**
 * LCARdS Simple Card Foundation
 *
 * Minimal base class for simple, single-purpose cards that leverage
 * singleton architecture without MSD complexity.
 *
 * Philosophy:
 * - Card controls everything explicitly
 * - No auto-subscriptions or magic behavior
 * - Helpers available when needed
 * - Clear, predictable lifecycle
 *
 * Use Cases:
 * - Simple buttons with actions
 * - Status displays
 * - Labels with templates
 * - Single-entity cards
 *
 * NOT for:
 * - Multi-overlay displays (use LCARdSMSDCard)
 * - Complex routing/navigation
 * - Multi-entity grids
 */

import { html, css } from 'lit';
import { lcardsLog } from '../utils/lcards-logging.js';
import { LCARdSNativeCard } from './LCARdSNativeCard.js';

/**
 * Base class for simple LCARdS cards
 *
 * Extends LCARdSNativeCard to inherit all HA integration,
 * adds singleton access and helper methods.
 */
export class LCARdSSimpleCard extends LCARdSNativeCard {

    static get properties() {
        return {
            ...super.properties,

            // Simple card state
            _entity: { type: Object, state: true },
            _singletons: { type: Object, state: true },
            _initialized: { type: Boolean, state: true }
        };
    }

    static get styles() {
        return [
            super.styles,
            css`
                :host {
                    display: block;
                    width: 100%;
                    height: 100%;
                }

                .simple-card-container {
                    width: 100%;
                    height: 100%;
                    position: relative;
                }

                .simple-card-error {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100px;
                    padding: 16px;
                    background: var(--error-background-color, rgba(244, 67, 54, 0.1));
                    border: 1px solid var(--error-color, #f44336);
                    border-radius: 4px;
                    color: var(--error-color, #f44336);
                    font-size: 14px;
                }

                .simple-card-loading {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100px;
                    color: var(--primary-text-color);
                    font-size: 14px;
                    opacity: 0.7;
                }
            `
        ];
    }

    constructor() {
        super();

        // Simple card state
        this._entity = null;
        this._singletons = null;
        this._initialized = false;

        lcardsLog.debug(`[LCARdSSimpleCard] Constructor called for ${this._cardGuid}`);
    }

    /**
     * Called when config is set
     * @protected
     */
    _onConfigSet(config) {
        super._onConfigSet(config);

        // Store entity reference if present
        if (config.entity && this.hass) {
            this._entity = this.hass.states[config.entity];
        }

        lcardsLog.debug(`[LCARdSSimpleCard] Config set for ${this._cardGuid}`, {
            entity: config.entity,
            hasEntity: !!this._entity
        });
    }

    /**
     * Called when HASS changes
     * @protected
     */
    _onHassChanged(newHass, oldHass) {
        super._onHassChanged(newHass, oldHass);

        // Update entity reference
        if (this.config.entity) {
            this._entity = newHass.states[this.config.entity];
        }

        // IMPORTANT: Feed HASS back to singleton system for cross-card coordination
        if (window.lcards?.core) {
            window.lcards.core.ingestHass(newHass);
        }

        // Call card-specific HASS handler
        if (typeof this._handleHassUpdate === 'function') {
            this._handleHassUpdate(newHass, oldHass);
        }
    }

    /**
     * Called when connected to DOM
     * @protected
     */
    _onConnected() {
        super._onConnected();

        // Initialize singleton access
        this._initializeSingletons();

        lcardsLog.debug(`[LCARdSSimpleCard] Connected: ${this._cardGuid}`);
    }

    /**
     * Called on first update
     * @protected
     */
    _onFirstUpdated(changedProperties) {
        super._onFirstUpdated(changedProperties);

        // Mark as initialized
        this._initialized = true;

        // Call card-specific initialization
        if (typeof this._handleFirstUpdate === 'function') {
            this._handleFirstUpdate(changedProperties);
        }

        lcardsLog.debug(`[LCARdSSimpleCard] First updated: ${this._cardGuid}`);
    }

    /**
     * Initialize singleton system access
     * @private
     */
    _initializeSingletons() {
        try {
            // Get core singletons via unified API
            const core = window.lcards?.core;

            if (!core) {
                lcardsLog.warn(`[LCARdSSimpleCard] Core singletons not available`);
                return;
            }

            this._singletons = {
                themeManager: core.getThemeManager(),
                rulesEngine: core.rulesManager,
                animationManager: core.animationManager,
                dataSourceManager: core.dataSourceManager,
                validationService: core.validationService,
                actionHandler: core.actionHandler,
                stylePresetManager: core.getStylePresetManager()
            };

            lcardsLog.debug(`[LCARdSSimpleCard] Singletons initialized for ${this._cardGuid}`, {
                hasTheme: !!this._singletons.themeManager,
                hasRules: !!this._singletons.rulesEngine,
                hasAnimations: !!this._singletons.animationManager,
                hasDataSources: !!this._singletons.dataSourceManager
            });

        } catch (error) {
            lcardsLog.error(`[LCARdSSimpleCard] Singleton initialization failed:`, error);
        }
    }

    // ============================================================================
    // HELPER METHODS - Available to subclasses
    // ============================================================================

    /**
     * Process a template string with current context
     *
     * Supports button-card syntax:
     * - JavaScript: [[[return entity.state === 'on' ? 'Active' : 'Inactive']]]
     * - Tokens: {{entity.attributes.friendly_name}}
     *
     * @param {string} template - Template string to process
     * @returns {string} Processed result
     */
    processTemplate(template) {
        if (!template || typeof template !== 'string') {
            return template;
        }

        // Quick check for templates
        const hasJavaScript = template.includes('[[[') && template.includes(']]]');
        const hasTokens = template.includes('{{') && template.includes('}}');

        if (!hasJavaScript && !hasTokens) {
            return template;
        }

        try {
            // Create evaluation context
            const context = {
                entity: this._entity,
                config: this.config,
                hass: this.hass,
                states: this.hass?.states || {},
                user: this.hass?.user || {},
                // Helper functions
                Math,
                String,
                Number,
                Boolean,
                parseFloat,
                parseInt
            };

            // Process JavaScript templates [[[code]]]
            let result = template;
            if (hasJavaScript) {
                result = result.replace(/\[\[\[([\s\S]*?)\]\]\]/g, (match, code) => {
                    try {
                        const func = new Function(...Object.keys(context), `return ${code}`);
                        const value = func(...Object.values(context));
                        return value !== null && value !== undefined ? String(value) : '';
                    } catch (error) {
                        lcardsLog.warn(`[LCARdSSimpleCard] Template evaluation failed:`, error);
                        return match;
                    }
                });
            }

            // Process token templates {{token}}
            if (hasTokens) {
                result = result.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
                    try {
                        const value = this._resolveTokenPath(path.trim(), context);
                        return value !== null && value !== undefined ? String(value) : '';
                    } catch (error) {
                        lcardsLog.warn(`[LCARdSSimpleCard] Token resolution failed:`, error);
                        return match;
                    }
                });
            }

            return result;

        } catch (error) {
            lcardsLog.error(`[LCARdSSimpleCard] Template processing failed:`, error);
            return template;
        }
    }

    /**
     * Resolve dot-notation token path
     * @private
     */
    _resolveTokenPath(path, context) {
        const parts = path.split('.');
        let current = context;

        for (const part of parts) {
            if (current === null || current === undefined) {
                return null;
            }
            current = current[part];
        }

        return current;
    }

    /**
     * Get theme token value
     *
     * @param {string} tokenPath - Dot-notation path (e.g., 'colors.accent.primary')
     * @param {*} fallback - Fallback value if token not found
     * @returns {*} Token value or fallback
     */
    getThemeToken(tokenPath, fallback = null) {
        if (!this._singletons?.themeManager) {
            return fallback;
        }

        try {
            return this._singletons.themeManager.getToken(tokenPath, fallback);
        } catch (error) {
            lcardsLog.warn(`[LCARdSSimpleCard] Theme token fetch failed:`, error);
            return fallback;
        }
    }

    /**
     * Get style preset configuration
     *
     * @param {string} overlayType - Type of overlay (e.g., 'button', 'text')
     * @param {string} presetName - Name of the preset (e.g., 'lozenge', 'picard')
     * @returns {Object|null} Preset configuration or null
     */
    getStylePreset(overlayType, presetName) {
        if (!this._singletons?.stylePresetManager) {
            return null;
        }

        try {
            return this._singletons.stylePresetManager.getPreset(
                overlayType,
                presetName,
                this._singletons.themeManager
            );
        } catch (error) {
            lcardsLog.warn(`[LCARdSSimpleCard] Preset fetch failed:`, error);
            return null;
        }
    }

    /**
     * Resolve styles with theme tokens and state overrides
     *
     * @param {Object} baseStyle - Base style object
     * @param {Array<string>} themeTokens - Array of theme token paths to apply
     * @param {Object} stateOverrides - State-based style overrides
     * @returns {Object} Resolved style object
     */
    resolveStyle(baseStyle = {}, themeTokens = [], stateOverrides = {}) {
        let resolved = { ...baseStyle };

        // Apply theme tokens
        themeTokens.forEach(tokenPath => {
            const value = this.getThemeToken(tokenPath);
            if (value !== null && value !== undefined) {
                // Extract property name from path (last segment)
                const property = tokenPath.split('.').pop();
                resolved[property] = value;
            }
        });

        // Apply state overrides (highest priority)
        resolved = { ...resolved, ...stateOverrides };

        return resolved;
    }

    /**
     * Get entity state
     *
     * @param {string} entityId - Entity ID (optional, defaults to card's entity)
     * @returns {Object|null} Entity state or null
     */
    getEntityState(entityId = null) {
        const id = entityId || this.config.entity;
        if (!id || !this.hass) {
            return null;
        }

        return this.hass.states[id] || null;
    }

    /**
     * Call Home Assistant service
     *
     * @param {string} domain - Service domain (e.g., 'light')
     * @param {string} service - Service name (e.g., 'turn_on')
     * @param {Object} data - Service data
     * @returns {Promise<void>}
     */
    async callService(domain, service, data = {}) {
        if (!this.hass) {
            lcardsLog.warn(`[LCARdSSimpleCard] Cannot call service - no HASS instance`);
            return;
        }

        try {
            await this.hass.callService(domain, service, data);
            lcardsLog.debug(`[LCARdSSimpleCard] Called service ${domain}.${service}`, data);
        } catch (error) {
            lcardsLog.error(`[LCARdSSimpleCard] Service call failed:`, error);
        }
    }

    /**
     * Setup action handlers on element
     *
     * @param {HTMLElement} element - Target element
     * @param {Object} actions - Action configurations
     * @returns {Function} Cleanup function
     */
    setupActions(element, actions) {
        if (!element || !actions) {
            return () => {};
        }

        const cleanupFunctions = [];

        // Tap action
        if (actions.tap_action) {
            const tapHandler = () => {
                this._executeAction(actions.tap_action);
            };
            element.addEventListener('click', tapHandler);
            cleanupFunctions.push(() => element.removeEventListener('click', tapHandler));
        }

        // Hold action
        if (actions.hold_action) {
            let holdTimer;
            const holdStart = () => {
                holdTimer = setTimeout(() => {
                    this._executeAction(actions.hold_action);
                }, 500);
            };
            const holdEnd = () => {
                if (holdTimer) {
                    clearTimeout(holdTimer);
                    holdTimer = null;
                }
            };

            element.addEventListener('pointerdown', holdStart);
            element.addEventListener('pointerup', holdEnd);
            element.addEventListener('pointercancel', holdEnd);

            cleanupFunctions.push(() => {
                element.removeEventListener('pointerdown', holdStart);
                element.removeEventListener('pointerup', holdEnd);
                element.removeEventListener('pointercancel', holdEnd);
                if (holdTimer) clearTimeout(holdTimer);
            });
        }

        // Double tap action
        if (actions.double_tap_action) {
            let tapCount = 0;
            let tapTimer;
            const handleTap = () => {
                tapCount++;
                if (tapCount === 1) {
                    tapTimer = setTimeout(() => {
                        tapCount = 0;
                    }, 300);
                } else if (tapCount === 2) {
                    clearTimeout(tapTimer);
                    tapCount = 0;
                    this._executeAction(actions.double_tap_action);
                }
            };

            element.addEventListener('click', handleTap);
            cleanupFunctions.push(() => {
                element.removeEventListener('click', handleTap);
                if (tapTimer) clearTimeout(tapTimer);
            });
        }

        return () => {
            cleanupFunctions.forEach(cleanup => cleanup());
        };
    }

    /**
     * Execute action configuration
     * @private
     */
    _executeAction(actionConfig) {
        if (!actionConfig || !this.hass) {
            return;
        }

        const action = actionConfig.action;

        switch (action) {
            case 'toggle':
                this._handleToggle(actionConfig);
                break;
            case 'more-info':
                this._handleMoreInfo(actionConfig);
                break;
            case 'call-service':
                this._handleCallService(actionConfig);
                break;
            case 'navigate':
                this._handleNavigate(actionConfig);
                break;
            case 'url':
                this._handleUrl(actionConfig);
                break;
            case 'none':
                // Do nothing
                break;
            default:
                lcardsLog.warn(`[LCARdSSimpleCard] Unknown action: ${action}`);
        }
    }

    /**
     * Handle toggle action
     * @private
     */
    _handleToggle(actionConfig) {
        const entityId = actionConfig.entity || this.config.entity;
        if (!entityId) return;

        const domain = entityId.split('.')[0];
        this.callService(domain, 'toggle', { entity_id: entityId });
    }

    /**
     * Handle more-info action
     * @private
     */
    _handleMoreInfo(actionConfig) {
        const entityId = actionConfig.entity || this.config.entity;
        if (!entityId) return;

        const event = new CustomEvent('hass-more-info', {
            detail: { entityId },
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(event);
    }

    /**
     * Handle call-service action
     * @private
     */
    _handleCallService(actionConfig) {
        const service = actionConfig.service;
        if (!service) return;

        const [domain, serviceAction] = service.split('.');
        this.callService(domain, serviceAction, actionConfig.service_data || {});
    }

    /**
     * Handle navigate action
     * @private
     */
    _handleNavigate(actionConfig) {
        const path = actionConfig.navigation_path;
        if (!path) return;

        window.history.pushState(null, '', path);
        window.dispatchEvent(new CustomEvent('location-changed', {
            detail: { replace: false },
            bubbles: true,
            composed: true
        }));
    }

    /**
     * Handle URL action
     * @private
     */
    _handleUrl(actionConfig) {
        const url = actionConfig.url_path;
        if (!url) return;

        window.open(url, '_blank');
    }

    // ============================================================================
    // RENDER - Subclasses MUST implement _renderCard()
    // ============================================================================

    /**
     * Render the card content
     * @protected
     */
    _renderCard() {
        if (!this._initialized) {
            return html`
                <div class="simple-card-container">
                    <div class="simple-card-loading">
                        Initializing...
                    </div>
                </div>
            `;
        }

        // Subclasses must implement this
        return html`
            <div class="simple-card-container">
                <div class="simple-card-error">
                    Subclass must implement _renderCard()
                </div>
            </div>
        `;
    }
}