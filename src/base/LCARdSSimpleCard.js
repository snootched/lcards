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
import { TriggerManager } from '../core/animation/TriggerManager.js';
import { SimpleCardTemplateEvaluator } from '../core/templates/SimpleCardTemplateEvaluator.js';

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

        // Template processing state
        this._templateUpdateScheduled = false;
        this._processedTexts = {
            label: '',
            content: '',
            texts: []
        };

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

            const animationManager = core.getAnimationManager();
            lcardsLog.debug(`[LCARdSSimpleCard] AnimationManager singleton check for ${this._cardGuid}`, {
                hasGetMethod: typeof core.getAnimationManager === 'function',
                managerResult: !!animationManager,
                managerType: animationManager?.constructor?.name,
                coreAnimMgr: !!core.animationManager,
                directAccess: !!core.animationManager
            });

            this._singletons = {
                systemsManager: core.systemsManager,
                themeManager: core.getThemeManager(),
                rulesEngine: core.rulesManager,
                animationManager: animationManager,
                dataSourceManager: core.dataSourceManager,
                validationService: core.validationService,
                actionHandler: core.actionHandler,
                stylePresetManager: core.getStylePresetManager()
            };

            // Register this card with CoreSystemsManager for entity tracking
            if (this._singletons.systemsManager && this._cardGuid) {
                this._cardContext = this._singletons.systemsManager.registerCard(
                    this._cardGuid,
                    this,
                    this.config
                );
                lcardsLog.debug(`[LCARdSSimpleCard] Registered with CoreSystemsManager: ${this._cardGuid}`);
            }

            lcardsLog.debug(`[LCARdSSimpleCard] Singletons initialized for ${this._cardGuid}`, {
                hasSystemsManager: !!this._singletons.systemsManager,
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

        try {
            // Create evaluation context
            const context = {
                entity: this._entity,
                config: this.config,
                hass: this.hass,
                variables: this.config?.variables || {},
                theme: this._singletons?.themeManager?.getCurrentTheme?.()
            };

            // Use SimpleCardTemplateEvaluator for consistent template processing
            const evaluator = new SimpleCardTemplateEvaluator(context);
            return evaluator.evaluate(template);

        } catch (error) {
            lcardsLog.error(`[LCARdSSimpleCard] Template processing failed:`, error);
            return template;
        }
    }

    /**
     * Schedule template processing to avoid Lit update cycles
     * @protected
     */
    _scheduleTemplateUpdate() {
        if (this._templateUpdateScheduled) return;

        this._templateUpdateScheduled = true;
        requestAnimationFrame(() => {
            this._templateUpdateScheduled = false;

            // Process templates synchronously
            this._processTemplatesSync();

            // Re-render only if we're not in an update cycle
            if (!this.hasUpdated || this.updateComplete === Promise.resolve()) {
                this.requestUpdate();
            } else {
                // Wait for current update to complete
                this.updateComplete.then(() => {
                    this.requestUpdate();
                });
            }
        });
    }

    /**
     * Process templates synchronously to avoid update cycles
     * Subclasses should override to define their text processing
     * @protected
     */
    _processTemplatesSync() {
        // Default implementation processes standard text fields
        this._processStandardTexts();

        // Call subclass-specific template processing hook
        if (typeof this._processCustomTemplates === 'function') {
            this._processCustomTemplates();
        }
    }

    /**
     * Process standard text fields (label, content, texts array)
     * @protected
     */
    _processStandardTexts() {
        // Process label template (with aliases)
        const rawLabel = this.config.label || this.config.text || '';
        const newLabel = this.processTemplate(rawLabel);

        // Process content template (with aliases)
        const rawContent = this.config.content || this.config.value || '';
        const newContent = this.processTemplate(rawContent);

        // Process texts array
        const newTexts = [];
        if (this.config.texts && Array.isArray(this.config.texts)) {
            this.config.texts.forEach((textConfig, index) => {
                if (textConfig && typeof textConfig === 'object') {
                    const processedText = {
                        ...textConfig,
                        text: this.processTemplate(textConfig.text || textConfig.content || '')
                    };
                    newTexts.push(processedText);
                }
            });
        }

        // Only update if values actually changed to avoid unnecessary re-renders
        const labelChanged = this._processedTexts.label !== newLabel;
        const contentChanged = this._processedTexts.content !== newContent;
        const textsChanged = JSON.stringify(this._processedTexts.texts) !== JSON.stringify(newTexts);

        if (labelChanged || contentChanged || textsChanged) {
            this._processedTexts.label = newLabel;
            this._processedTexts.content = newContent;
            this._processedTexts.texts = newTexts;

            lcardsLog.debug(`[LCARdSSimpleCard] Templates processed for ${this._cardGuid}:`, {
                label: this._processedTexts.label,
                content: this._processedTexts.content,
                textsCount: this._processedTexts.texts.length,
                changed: { labelChanged, contentChanged, textsChanged }
            });

            // Call subclass hook for style resolution after template changes
            if (typeof this._onTemplatesChanged === 'function') {
                this._onTemplatesChanged();
            }
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
     * Uses CoreSystemsManager for cached entity access when available,
     * falls back to direct HASS access for backwards compatibility.
     *
     * @param {string} entityId - Entity ID (optional, defaults to card's entity)
     * @returns {Object|null} Entity state or null
     */
    getEntityState(entityId = null) {
        const id = entityId || this.config.entity;
        if (!id) {
            return null;
        }

        // Use CoreSystemsManager for cached access (preferred)
        if (this._singletons?.systemsManager) {
            return this._singletons.systemsManager.getEntityState(id);
        }

        // Fallback to direct HASS access (backwards compatibility)
        if (this.hass) {
            return this.hass.states[id] || null;
        }

        return null;
    }

    /**
     * Subscribe to entity state changes
     *
     * Uses CoreSystemsManager's subscription system for efficient change notifications.
     * Automatically tracks subscriptions for cleanup on card destroy.
     *
     * @param {string} entityId - Entity to monitor
     * @param {Function} callback - Called on change: callback(entityId, newState, oldState)
     * @returns {Function} Unsubscribe function
     *
     * @example
     * // Subscribe to temperature sensor
     * const unsubscribe = this.subscribeToEntity('sensor.temperature', (id, newState, oldState) => {
     *   console.log('Temperature changed from', oldState.state, 'to', newState.state);
     *   this.requestUpdate();
     * });
     *
     * // Later, unsubscribe
     * unsubscribe();
     */
    subscribeToEntity(entityId, callback) {
        if (!entityId || typeof callback !== 'function') {
            lcardsLog.warn('[LCARdSSimpleCard] Invalid entityId or callback for subscription');
            return () => {}; // No-op unsubscribe
        }

        if (!this._singletons?.systemsManager) {
            lcardsLog.warn('[LCARdSSimpleCard] CoreSystemsManager not available for subscription');
            return () => {}; // No-op unsubscribe
        }

        // Initialize subscription tracking if needed
        if (!this._entitySubscriptions) {
            this._entitySubscriptions = new Set();
        }

        // Subscribe via CoreSystemsManager
        const unsubscribe = this._singletons.systemsManager.subscribeToEntity(
            entityId,
            callback
        );

        // Track subscription for automatic cleanup
        this._entitySubscriptions.add(unsubscribe);

        lcardsLog.debug(`[LCARdSSimpleCard] Subscribed to entity: ${entityId} (card: ${this._cardGuid})`);

        // Return unsubscribe function
        return () => {
            this._entitySubscriptions.delete(unsubscribe);
            unsubscribe();
        };
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

    // ============================================================================
    // ANIMATION SYSTEM - Generic animation support for all SimpleCards
    // ============================================================================

    // ============================================================================
    // ANIMATION SYSTEM - Integrated with TriggerManager
    // ============================================================================

    /**
     * Register pending animations with AnimationManager (late-binding helper)
     * Called when animations are triggered but AnimationManager wasn't ready during setup
     * @private
     */
    async _ensureAnimationsRegistered() {
        // Check if we have pending animations and AnimationManager is now available
        if (!this._pendingAnimationSetup) {
            return; // Already registered or no animations
        }

        // Try to get AnimationManager via late binding
        const core = window.lcards?.core;
        const animationManager = core?.getAnimationManager?.();

        if (!animationManager) {
            lcardsLog.warn(`[LCARdSSimpleCard] AnimationManager still not available for late binding`);
            return; // Still not ready
        }

        const { overlayId, animations, elementSelector, element } = this._pendingAnimationSetup;

        lcardsLog.debug(`[LCARdSSimpleCard] 🎬 Late-binding animation registration for ${overlayId}:`, {
            animationCount: animations.length,
            triggers: animations.map(a => a.trigger || 'on_tap')
        });

        // Find the target element
        const targetElement = this.shadowRoot?.querySelector(elementSelector) || element;

        if (!targetElement) {
            lcardsLog.warn(`[LCARdSSimpleCard] Target element not found for late binding: ${elementSelector}`);
            return;
        }

        // Create anime.js scope for this overlay (like AnimationManager.createScopeForOverlay)
        const scope = animationManager.createScopeForOverlay(overlayId, targetElement);

        // Create TriggerManager
        this._triggerManager = new TriggerManager(overlayId, targetElement, animationManager);

        // Store scope data in AnimationManager (like onOverlayRendered does)
        animationManager.scopes.set(overlayId, {
            scope: scope,
            overlay: { animations },
            element: targetElement,
            activeAnimations: new Set(),
            triggerManager: this._triggerManager,
            runningInstances: new Map()
        });

        lcardsLog.debug(`[LCARdSSimpleCard] Created scope for overlay: ${overlayId}`);

        // Register each animation using AnimationManager.registerAnimation()
        // This handles TriggerManager registration AND on_load execution
        for (const animConfig of animations) {
            await animationManager.registerAnimation(overlayId, animConfig);
        }

        lcardsLog.info(`[LCARdSSimpleCard] ✅ TriggerManager created (late-binding) with ${animations.length} animations`);

        // Clear pending setup
        this._pendingAnimationSetup = null;
    }

    /**
     * Hook for subclasses to provide animation-specific setup
     * @returns {Object} Animation setup configuration
     * @protected
     */
    _getAnimationSetup() {
        // Default implementation - subclasses should override
        return {
            overlayId: `simple-card-${this._cardGuid}`,
            elementSelector: '[data-overlay-id]'
        };
    }

    // ============================================================================
    // ACTION SYSTEM - Shadow-DOM-aware action handling
    // ============================================================================

    /**
     * Setup action handlers on element with full animation support
     *
     * Shadow-DOM-aware implementation that replaces ActionHelpers for SimpleCards.
     * Supports all animation triggers: on_tap, on_hold, on_double_tap, on_hover, on_leave.
     *
     * @param {HTMLElement} element - Target element (must be in shadow DOM)
     * @param {Object} actions - Action configurations (tap_action, hold_action, double_tap_action)
     * @param {Object} options - Additional options
     * @param {Object} options.animationManager - AnimationManager instance for triggering animations
     * @param {string} options.elementId - Element ID for animation targeting
     * @returns {Function} Cleanup function
     */
    setupActions(element, actions = {}, options = {}) {
        if (!element) {
            return () => {};
        }

        const cleanupFunctions = [];
        const hasActions = actions.tap_action || actions.hold_action || actions.double_tap_action;
        const animationManager = options.animationManager || this._singletons?.animationManager;
        const elementId = options.elementId || element.id || element.getAttribute('data-overlay-id');

        lcardsLog.debug(`[LCARdSSimpleCard] Setting up actions for ${this._cardGuid}:`, {
            hasActions,
            hasAnimationManager: !!animationManager,
            elementId,
            actionTypes: Object.keys(actions).filter(k => k.endsWith('_action') && actions[k])
        });

        // 🆕 Create TriggerManager for animation handling (even if no actions)
        // Uses late-binding pattern: if AnimationManager isn't ready, store for later
        let triggerManager = null;
        if (elementId && this.config.animations) {
            const animations = this.config.animations;
            const animationSetup = this._getAnimationSetup?.() || {};
            const overlayId = animationSetup.overlayId || `simple-card-${this._cardGuid}`;

            if (animationManager) {
                // AnimationManager is ready - register immediately
                lcardsLog.debug(`[LCARdSSimpleCard] Creating TriggerManager for ${overlayId}:`, {
                    animationCount: animations.length,
                    triggers: animations.map(a => a.trigger || 'on_tap')
                });

                // Get or query for the target element
                const targetElement = this.shadowRoot?.querySelector(animationSetup.elementSelector || '[data-overlay-id]') || element;

                // Create TriggerManager instance
                triggerManager = new TriggerManager(overlayId, targetElement, animationManager);

                // Register overlay scope with AnimationManager first
                if (animationManager.onOverlayRendered) {
                    animationManager.onOverlayRendered(overlayId, targetElement, { animations });
                    lcardsLog.debug(`[LCARdSSimpleCard] Registered overlay scope: ${overlayId}`);
                }

                // Register each animation with TriggerManager
                animations.forEach(animConfig => {
                    const trigger = animConfig.trigger || 'on_tap';
                    triggerManager.register(trigger, animConfig);
                });

                lcardsLog.info(`[LCARdSSimpleCard] ✅ TriggerManager created with ${animations.length} animations`);

                // Add cleanup for TriggerManager
                cleanupFunctions.push(() => {
                    triggerManager.destroy();
                    lcardsLog.debug(`[LCARdSSimpleCard] TriggerManager destroyed for ${overlayId}`);
                });
            } else {
                // AnimationManager not ready - store for late binding
                lcardsLog.debug(`[LCARdSSimpleCard] AnimationManager not ready, storing for late binding:`, {
                    overlayId,
                    animationCount: animations.length
                });

                this._pendingAnimationSetup = {
                    overlayId,
                    animations,
                    elementSelector: animationSetup.elementSelector || '[data-overlay-id]',
                    element
                };
            }
        }

        // Set cursor styling for actionable elements
        if (hasActions) {
            element.style.cursor = 'pointer';
            cleanupFunctions.push(() => {
                element.style.cursor = '';
            });
        }

        // Track action state to prevent conflicts
        let holdTimer = null;
        let lastTapTime = 0;
        let tapCount = 0;
        let isHolding = false;

        // Tap action handler with double-tap coordination
        if (actions.tap_action) {
            const tapHandler = async (event) => {
                event.stopPropagation();
                event.preventDefault();

                // Skip if we were holding
                if (isHolding) {
                    lcardsLog.debug(`[LCARdSSimpleCard] Skipping tap - hold completed`);
                    isHolding = false;
                    return;
                }

                const now = Date.now();

                // Handle double-tap detection if configured
                if (actions.double_tap_action) {
                    tapCount++;

                    if (tapCount === 1) {
                        lastTapTime = now;
                        // Wait for potential second tap
                        setTimeout(async () => {
                            if (tapCount === 1) {
                                // Single tap confirmed
                                lcardsLog.debug(`[LCARdSSimpleCard] 🎯 Single tap action triggered`);

                                // Ensure animations are registered (late-binding if needed)
                                await this._ensureAnimationsRegistered();

                                // Trigger animation if registration completed
                                const currentAnimationManager = window.lcards?.core?.getAnimationManager?.();
                                if (currentAnimationManager && elementId) {
                                    currentAnimationManager.triggerAnimations(elementId, 'on_tap');
                                }

                                this._executeAction(actions.tap_action);
                            }
                            tapCount = 0;
                        }, 300);
                    } else if (tapCount === 2) {
                        // Double tap detected - will be handled by double_tap_action handler
                        lcardsLog.debug(`[LCARdSSimpleCard] Double tap detected, deferring to double_tap_action`);
                        tapCount = 0;
                    }
                } else {
                    // No double-tap action configured, execute immediately
                    lcardsLog.debug(`[LCARdSSimpleCard] 🎯 Tap action triggered (immediate)`);

                    // Ensure animations are registered (late-binding if needed)
                    await this._ensureAnimationsRegistered();

                    // Trigger animation if registration completed
                    const currentAnimationManager = window.lcards?.core?.getAnimationManager?.();
                    if (currentAnimationManager && elementId) {
                        currentAnimationManager.triggerAnimations(elementId, 'on_tap');
                    }

                    this._executeAction(actions.tap_action);
                }
            };

            element.addEventListener('click', tapHandler);
            cleanupFunctions.push(() => element.removeEventListener('click', tapHandler));
        }

        // Hold action handler
        if (actions.hold_action) {
            const holdStart = (event) => {
                event.stopPropagation();
                isHolding = false;

                lcardsLog.debug(`[LCARdSSimpleCard] 🔲 Hold timer started`);

                holdTimer = setTimeout(async () => {
                    isHolding = true;
                    lcardsLog.debug(`[LCARdSSimpleCard] 🎯 Hold action triggered`);

                    // Ensure animations are registered (late-binding if needed)
                    await this._ensureAnimationsRegistered();

                    // Trigger animation if registration completed
                    const currentAnimationManager = window.lcards?.core?.getAnimationManager?.();
                    if (currentAnimationManager && elementId) {
                        currentAnimationManager.triggerAnimations(elementId, 'on_hold');
                    }

                    this._executeAction(actions.hold_action);
                }, 500);
            };

            const holdEnd = () => {
                if (holdTimer) {
                    clearTimeout(holdTimer);
                    holdTimer = null;
                    lcardsLog.debug(`[LCARdSSimpleCard] 🔲 Hold timer cleared`);
                }
            };

            element.addEventListener('pointerdown', holdStart);
            element.addEventListener('pointerup', holdEnd);
            element.addEventListener('pointercancel', holdEnd);
            element.addEventListener('pointerleave', holdEnd);

            cleanupFunctions.push(() => {
                element.removeEventListener('pointerdown', holdStart);
                element.removeEventListener('pointerup', holdEnd);
                element.removeEventListener('pointercancel', holdEnd);
                element.removeEventListener('pointerleave', holdEnd);
                if (holdTimer) clearTimeout(holdTimer);
            });
        }

        // Double tap action handler
        if (actions.double_tap_action) {
            const doubleTapHandler = async (event) => {
                event.stopPropagation();
                event.preventDefault();

                if (tapCount === 2) {
                    lcardsLog.debug(`[LCARdSSimpleCard] 🎯 Double-tap action triggered`);

                    // Ensure animations are registered (late-binding if needed)
                    await this._ensureAnimationsRegistered();

                    // Trigger animation if registration completed
                    const currentAnimationManager = window.lcards?.core?.getAnimationManager?.();
                    if (currentAnimationManager && elementId) {
                        currentAnimationManager.triggerAnimations(elementId, 'on_double_tap');
                    }

                    this._executeAction(actions.double_tap_action);
                    tapCount = 0;
                }
            };

            element.addEventListener('dblclick', doubleTapHandler);
            cleanupFunctions.push(() => {
                element.removeEventListener('dblclick', doubleTapHandler);
            });
        }

        // Hover animation support (desktop only)
        // Attach handlers regardless of AnimationManager state (late-binding will handle registration)
        if (elementId) {
            const isDesktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

            if (isDesktop) {
                const hoverHandler = async () => {
                    // Ensure animations are registered (late-binding if needed)
                    await this._ensureAnimationsRegistered();

                    // Trigger animation via AnimationManager (get fresh reference for late-binding)
                    const currentAnimationManager = window.lcards?.core?.getAnimationManager?.();
                    if (currentAnimationManager && elementId) {
                        lcardsLog.debug(`[LCARdSSimpleCard] 🖱️ Hover animation triggered on ${elementId}`);
                        currentAnimationManager.triggerAnimations(elementId, 'on_hover');
                    }
                };

                const leaveHandler = async () => {
                    // Ensure animations are registered (late-binding if needed)
                    await this._ensureAnimationsRegistered();

                    // Trigger animation via AnimationManager (get fresh reference for late-binding)
                    const currentAnimationManager = window.lcards?.core?.getAnimationManager?.();
                    if (currentAnimationManager && elementId) {
                        lcardsLog.debug(`[LCARdSSimpleCard] 🖱️ Leave animation triggered on ${elementId}`);
                        // Stop looping hover animations and trigger leave animations
                        currentAnimationManager.stopAnimations?.(elementId, 'on_hover');
                        currentAnimationManager.triggerAnimations(elementId, 'on_leave');
                    }
                };

                element.addEventListener('mouseenter', hoverHandler);
                element.addEventListener('mouseleave', leaveHandler);

                cleanupFunctions.push(() => {
                    element.removeEventListener('mouseenter', hoverHandler);
                    element.removeEventListener('mouseleave', leaveHandler);
                });

                lcardsLog.debug(`[LCARdSSimpleCard] ✅ Hover/leave handlers attached for ${elementId}`);
            }
        }

        lcardsLog.debug(`[LCARdSSimpleCard] ✅ Actions setup complete - ${cleanupFunctions.length} handlers attached`);

        return () => {
            lcardsLog.debug(`[LCARdSSimpleCard] 🧹 Cleaning up ${cleanupFunctions.length} action listeners`);
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

    // ============================================================================
    // LIFECYCLE HOOKS
    // ============================================================================

    /**
     * Called when disconnected from DOM
     * @protected
     */
        /**
     * Lifecycle hook - card disconnected from DOM
     * @protected
     */
    _onDisconnected() {
        // Cleanup entity subscriptions
        if (this._entitySubscriptions) {
            this._entitySubscriptions.forEach(unsubscribe => {
                try {
                    unsubscribe();
                } catch (error) {
                    lcardsLog.error('[LCARdSSimpleCard] Error unsubscribing from entity:', error);
                }
            });
            this._entitySubscriptions.clear();
            lcardsLog.debug(`[LCARdSSimpleCard] Cleaned up entity subscriptions for ${this._cardGuid}`);
        }

        // Unregister from CoreSystemsManager
        if (this._singletons?.systemsManager && this._cardGuid) {
            try {
                this._singletons.systemsManager.unregisterCard(this._cardGuid);
                lcardsLog.debug(`[LCARdSSimpleCard] Unregistered from CoreSystemsManager: ${this._cardGuid}`);
            } catch (error) {
                lcardsLog.error('[LCARdSSimpleCard] Error unregistering from CoreSystemsManager:', error);
            }
        }

        // TriggerManager cleanup is handled in setupActions cleanup function
        // Clear any pending animation setup
        this._pendingAnimationSetup = null;

        super._onDisconnected();
    }
}