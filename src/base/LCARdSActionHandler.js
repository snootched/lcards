/**
 * LCARdS Action Handler
 *
 * Unified action handler with full animation support, late-binding, and shadow DOM awareness.
 * Handles all Home Assistant action types plus animation triggers.
 *
 * Features:
 * - TriggerManager integration for animations
 * - Late-binding support for AnimationManager
 * - Shadow DOM event handling
 * - All action types: tap, hold, double-tap, hover, leave
 * - Action execution: toggle, more-info, call-service, navigate, url
 *
 * Used by both LCARdS card and MSD card systems.
 */

import { lcardsLog } from '../utils/lcards-logging.js';
import { TriggerManager } from '../core/animation/TriggerManager.js';

/**
 * Action handler for LCARdS cards
 *
 * Provides unified action handling across all card types:
 * - tap_action, hold_action, double_tap_action
 * - Animation triggers: on_tap, on_hold, on_double_tap, on_hover, on_leave
 * - Shadow DOM support
 * - Late-binding for AnimationManager
 */
export class LCARdSActionHandler {

    constructor() {
        this._registeredElements = new WeakMap();
        this._activeHandlers = new Set();
    }

    /**
     * Setup action handlers on element with full animation support
     *
     * Modern implementation that supports:
     * - Shadow DOM elements
     * - Animation triggers via TriggerManager
     * - Late-binding for AnimationManager
     * - All event types: tap, hold, double-tap, hover, leave
     *
     * @param {HTMLElement} element - Target element (can be in shadow DOM)
     * @param {Object} actions - Action configurations (tap_action, hold_action, double_tap_action)
     * @param {Object} hass - Home Assistant instance
     * @param {object} [options] - Additional options
     * @param {Object} options.animationManager - AnimationManager instance for triggering animations
     * @param {string} options.elementId - Element ID for animation targeting
     * @param {Array} options.animations - Animation configurations for late-binding
     * @param {Function} options.getAnimationSetup - Callback to get animation setup (overlayId, elementSelector)
     * @param {Function} [options.getAnimationManager] - Getter for AnimationManager (late-binding)
     * @param {Object} options.shadowRoot - Shadow root for element queries
     * @param {string} options.entity - Default entity ID for actions (fallback if action.entity not specified)
     * @param {Object} [options.soundOverride] - Per-event sound override config
     * @returns {Function} Cleanup function
     */
    setupActions(element, actions = {}, hass, options = /** @type {any} */ ({})) {
        if (!element) {
            return () => {};
        }

        const cleanupFunctions = [];
        const hasActions = actions.tap_action || actions.hold_action || actions.double_tap_action;
        const animationManager = options.animationManager;
        const elementId = options.elementId || element.id || element.getAttribute('data-overlay-id');
        const defaultEntity = options.entity; // Fallback entity for actions

        lcardsLog.debug(`[LCARdSActionHandler] Setting up actions:`, {
            elementId,
            hasActions,
            hasAnimationManager: !!animationManager,
            defaultEntity,
            actionTypes: Object.keys(actions).filter(k => k.endsWith('_action') && actions[k])
        });

        // Create TriggerManager for animation handling (even if no actions)
        // Uses late-binding pattern: if AnimationManager isn't ready, store for later
        let triggerManager = null;
        let pendingAnimationSetup = null;

        // ALWAYS register animation scope (even without animations) for rule-based targeting
        if (elementId && animationManager) {
            const animationSetup = options.getAnimationSetup?.() || {};
            const overlayId = animationSetup.overlayId || elementId;
            const shadowRoot = options.shadowRoot;
            const targetElement = shadowRoot?.querySelector(animationSetup.elementSelector || '[data-overlay-id]') || element;

            // Register overlay scope with AnimationManager (creates empty scope for rule-based animations)
            if (animationManager.onOverlayRendered) {
                animationManager.onOverlayRendered(overlayId, targetElement, { animations: options.animations || [] });
                lcardsLog.debug(`[LCARdSActionHandler] Registered animation scope: ${overlayId} (${options.animations?.length || 0} animations)`);
            }

            // Only create TriggerManager if animations are defined
            if (options.animations && options.animations.length > 0) {
                const animations = options.animations;

                lcardsLog.debug(`[LCARdSActionHandler] Creating TriggerManager for ${overlayId}:`, {
                    animationCount: animations.length,
                    triggers: animations.map(a => a.trigger || 'on_tap')
                });

                // Create TriggerManager instance
                triggerManager = new TriggerManager(overlayId, targetElement, animationManager);

                // Register each animation with TriggerManager
                animations.forEach(animConfig => {
                    const trigger = animConfig.trigger || 'on_tap';
                    triggerManager.register(trigger, animConfig);
                });

                lcardsLog.debug(`[LCARdSActionHandler] ✅ TriggerManager created with ${animations.length} animations`);

                // Add cleanup for TriggerManager
                cleanupFunctions.push(() => {
                    triggerManager.destroy();
                    lcardsLog.debug(`[LCARdSActionHandler] TriggerManager destroyed for ${overlayId}`);
                });
            }
        } else if (elementId && options.animations && !animationManager) {
            // AnimationManager not ready - store for late binding
            const animationSetup = options.getAnimationSetup?.() || {};
            const overlayId = animationSetup.overlayId || elementId;

            lcardsLog.debug(`[LCARdSActionHandler] AnimationManager not ready, storing for late binding:`, {
                overlayId,
                animationCount: options.animations.length
            });

            pendingAnimationSetup = {
                overlayId,
                animations: options.animations,
                elementSelector: animationSetup.elementSelector || '[data-overlay-id]',
                element,
                shadowRoot: options.shadowRoot
            };
        }

        // Helper to ensure animations are registered (late-binding)
        const ensureAnimationsRegistered = async () => {
            if (!pendingAnimationSetup) {
                return; // Already registered or no animations
            }

            // Try to get AnimationManager via:
            // 1. Provided getter function (preferred)
            // 2. Core singleton as fallback
            let currentAnimationManager = options.getAnimationManager?.();
            if (!currentAnimationManager) {
                const core = window.lcards?.core;
                currentAnimationManager = core?.getAnimationManager?.();
            }

            if (!currentAnimationManager) {
                lcardsLog.warn(`[LCARdSActionHandler] AnimationManager still not available for late binding`);
                return;
            }

            const { overlayId, animations, elementSelector, shadowRoot } = pendingAnimationSetup;

            lcardsLog.debug(`[LCARdSActionHandler] 🎬 Late-binding animation registration for ${overlayId}:`, {
                animationCount: animations.length,
                triggers: animations.map(a => a.trigger || 'on_tap')
            });

            // Find the target element
            const targetElement = shadowRoot?.querySelector(elementSelector) || element;

            if (!targetElement) {
                lcardsLog.warn(`[LCARdSActionHandler] Target element not found for late binding: ${elementSelector}`);
                return;
            }

            // Create anime.js scope for this overlay
            const scope = currentAnimationManager.createScopeForOverlay(overlayId, targetElement);

            // Create TriggerManager
            triggerManager = new TriggerManager(overlayId, targetElement, currentAnimationManager);

            // Store scope data in AnimationManager
            currentAnimationManager.scopes.set(overlayId, {
                scope: scope,
                overlay: { animations },
                element: targetElement,
                activeAnimations: new Set(),
                triggerManager: triggerManager,
                runningInstances: new Map()
            });

            lcardsLog.debug(`[LCARdSActionHandler] Created scope for overlay: ${overlayId}`);

            // Register each animation using AnimationManager.registerAnimation()
            for (const animConfig of animations) {
                await currentAnimationManager.registerAnimation(overlayId, animConfig);
            }

            lcardsLog.debug(`[LCARdSActionHandler] ✅ TriggerManager created (late-binding) with ${animations.length} animations`);

            // Clear pending setup
            pendingAnimationSetup = null;
        };

        // Set cursor styling for actionable elements
        if (hasActions) {
            element.style.cursor = 'pointer';
            cleanupFunctions.push(() => {
                element.style.cursor = '';
            });
        }

        // Sound playback helper — respects card-level sound_override config
        // options.soundOverride = { tap: 'assetKey', hold: null, ... }
        // null = silence that event; undefined key = use scheme default
        const playSound = (eventType) => {
            const sm = window.lcards?.core?.soundManager;
            if (!sm) return;
            const override = options.soundOverride || {};
            if (eventType in override) {
                sm.play(eventType, { cardOverride: override[eventType] });
            } else {
                sm.play(eventType);
            }
        };

        // Track action state to prevent conflicts
        let holdTimer = null;
        let lastTapTime = 0;
        let tapCount = 0;
        let isHolding = false;

        // Tap action handler with double-tap coordination
        if (actions.tap_action || actions.double_tap_action) {
            const tapHandler = async (event) => {
                // Check if click target is a segment element (Phase 2 multi-action regions)
                // Walk up the DOM tree to check for data-lcards-segment attribute
                let targetElement = event.target;
                while (targetElement && targetElement !== element) {
                    if (targetElement.hasAttribute && targetElement.hasAttribute('data-lcards-segment')) {
                        lcardsLog.trace(`[LCARdSActionHandler] Skipping tap - clicked on segment "${targetElement.getAttribute('data-lcards-segment')}"`);
                        return; // Let segment handler deal with it
                    }
                    targetElement = targetElement.parentElement;
                }

                // Now safe to stop propagation - we know we're handling this
                event.stopPropagation();
                event.preventDefault();

                // Skip if we were holding
                if (isHolding) {
                    lcardsLog.debug(`[LCARdSActionHandler] Skipping tap - hold completed`);
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
                            if (tapCount === 1 && actions.tap_action) {
                                // Single tap confirmed
                                lcardsLog.debug(`[LCARdSActionHandler] 🎯 Single tap action triggered`);

                                // Ensure animations are registered (late-binding if needed)
                                await ensureAnimationsRegistered();

                                // Trigger animation if registration completed
                                const currentAnimationManager = options.getAnimationManager?.() || window.lcards?.core?.getAnimationManager?.();
                                if (currentAnimationManager && elementId) {
                                    currentAnimationManager.triggerAnimations(elementId, 'on_tap');
                                }

                                playSound('card_tap');
                                this._executeAction(actions.tap_action, hass, element, defaultEntity);
                            }
                            tapCount = 0;
                        }, 300);
                    } else if (tapCount === 2) {
                        // Double tap detected - execute immediately (dblclick is unreliable on touch devices)
                        lcardsLog.debug(`[LCARdSActionHandler] 🎯 Double-tap action triggered`);
                        tapCount = 0;

                        // Ensure animations are registered (late-binding if needed)
                        await ensureAnimationsRegistered();

                        // Trigger animation if registration completed
                        const dtAnimationManager = options.getAnimationManager?.() || window.lcards?.core?.getAnimationManager?.();
                        if (dtAnimationManager && elementId) {
                            dtAnimationManager.triggerAnimations(elementId, 'on_double_tap');
                        }

                        playSound('card_double_tap');
                        this._executeAction(actions.double_tap_action, hass, element, defaultEntity);
                    }
                } else {
                    // No double-tap action configured, execute immediately
                    lcardsLog.debug(`[LCARdSActionHandler] 🎯 Tap action triggered (immediate)`);

                    // Ensure animations are registered (late-binding if needed)
                    await ensureAnimationsRegistered();

                    // Trigger animation if registration completed
                    const currentAnimationManager = options.getAnimationManager?.() || window.lcards?.core?.getAnimationManager?.();
                    if (currentAnimationManager && elementId) {
                        currentAnimationManager.triggerAnimations(elementId, 'on_tap');
                    }

                    playSound('card_tap');
                    this._executeAction(actions.tap_action, hass, element, defaultEntity);
                }
            };

            // SVG elements in shadow DOM - use capture phase like MSD
            element.addEventListener('click', tapHandler, { capture: true });
            cleanupFunctions.push(() => element.removeEventListener('click', tapHandler, { capture: true }));
        }

        // Hold action handler
        if (actions.hold_action) {
            const holdStart = (event) => {
                event.stopPropagation();
                event.preventDefault(); // Prevent click from firing
                isHolding = false;

                lcardsLog.debug(`[LCARdSActionHandler] 🔲 Hold timer started`);

                holdTimer = setTimeout(async () => {
                    isHolding = true;
                    lcardsLog.debug(`[LCARdSActionHandler] 🎯 Hold action triggered`);

                    // Ensure animations are registered (late-binding if needed)
                    await ensureAnimationsRegistered();

                    // Trigger animation if registration completed
                    const currentAnimationManager = options.getAnimationManager?.() || window.lcards?.core?.getAnimationManager?.();
                    if (currentAnimationManager && elementId) {
                        currentAnimationManager.triggerAnimations(elementId, 'on_hold');
                    }

                    playSound('card_hold');
                    this._executeAction(actions.hold_action, hass, element, defaultEntity);
                }, 500);
            };

            const holdEnd = (event) => {
                if (holdTimer) {
                    clearTimeout(holdTimer);
                    holdTimer = null;
                    lcardsLog.debug(`[LCARdSActionHandler] 🔲 Hold timer cleared (cancelled)`);
                } else if (isHolding) {
                    // Hold completed - prevent click event from firing
                    event.preventDefault();
                    event.stopPropagation();
                    lcardsLog.debug(`[LCARdSActionHandler] 🔲 Hold completed, preventing click`);
                    // Reset flag after a short delay to ensure click is blocked
                    setTimeout(() => {
                        isHolding = false;
                    }, 100);
                }
            };

            element.addEventListener('pointerdown', holdStart, { capture: true });
            element.addEventListener('pointerup', holdEnd, { capture: true });
            element.addEventListener('pointercancel', holdEnd, { capture: true });
            element.addEventListener('pointerleave', holdEnd, { capture: true });

            cleanupFunctions.push(() => {
                element.removeEventListener('pointerdown', holdStart, { capture: true });
                element.removeEventListener('pointerup', holdEnd, { capture: true });
                element.removeEventListener('pointercancel', holdEnd, { capture: true });
                element.removeEventListener('pointerleave', holdEnd, { capture: true });
                if (holdTimer) clearTimeout(holdTimer);
            });
        }

        // Note: double_tap_action is handled directly inside the click handler above
        // (dblclick event is not used - it fires after tapCount is already reset, and
        //  doesn't work on touch devices at all)

        // Hover animation support (desktop only)
        if (elementId) {
            const isDesktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

            if (isDesktop) {
                const hoverHandler = async () => {
                    lcardsLog.trace(`[LCARdSActionHandler] Mouseenter event on ${elementId}`);

                    // Ensure animations are registered (late-binding if needed)
                    await ensureAnimationsRegistered();

                    // Trigger animation via AnimationManager
                    const currentAnimationManager = options.getAnimationManager?.() || window.lcards?.core?.getAnimationManager?.();
                    if (currentAnimationManager && elementId) {
                        lcardsLog.trace(`[LCARdSActionHandler] Hover animation triggered on ${elementId}`);
                        currentAnimationManager.triggerAnimations(elementId, 'on_hover');
                    }

                    playSound('card_hover');
                };

                const leaveHandler = async () => {
                    // Ensure animations are registered (late-binding if needed)
                    await ensureAnimationsRegistered();

                    // Trigger animation via AnimationManager
                    const currentAnimationManager = options.getAnimationManager?.() || window.lcards?.core?.getAnimationManager?.();
                    if (currentAnimationManager && elementId) {
                        lcardsLog.trace(`[LCARdSActionHandler] Leave animation triggered on ${elementId}`);
                        // Stop looping hover animations and trigger leave animations
                        currentAnimationManager.stopAnimations?.(elementId, 'on_hover');
                        currentAnimationManager.triggerAnimations(elementId, 'on_leave');
                    }
                };

                element.addEventListener('mouseenter', hoverHandler, { capture: true });
                element.addEventListener('mouseleave', leaveHandler, { capture: true });

                cleanupFunctions.push(() => {
                    element.removeEventListener('mouseenter', hoverHandler, { capture: true });
                    element.removeEventListener('mouseleave', leaveHandler, { capture: true });
                });

                lcardsLog.trace(`[LCARdSActionHandler] Hover/leave handlers attached for ${elementId}`);
            }
        }

        // Add visual indicator that handlers are attached
        element.setAttribute('data-lcards-actions-attached', 'true');
        element.setAttribute('data-lcards-handler-count', String(cleanupFunctions.length));

        lcardsLog.trace(`[LCARdSActionHandler] ✅ Actions setup complete - ${cleanupFunctions.length} handlers attached to ${element.tagName} element`, {
            elementId,
            elementSelector: element.getAttribute('data-button-id') || element.getAttribute('data-overlay-id') || element.id,
            hasPointerEvents: window.getComputedStyle(element).pointerEvents,
            boundingBox: element.getBoundingClientRect()
        });

        return () => {
            lcardsLog.debug(`[LCARdSActionHandler] 🧹 Cleaning up ${cleanupFunctions.length} action listeners`);
            element.removeAttribute('data-lcards-actions-attached');
            element.removeAttribute('data-lcards-handler-count');
            cleanupFunctions.forEach(cleanup => cleanup());
        };
    }

    /**
     * Execute action configuration
     * @private
     */
    _executeAction(actionConfig, hass, element, defaultEntity = null) {
        if (!actionConfig || !hass) {
            return;
        }

        const action = actionConfig.action;
        // Use entity from action config, or fall back to defaultEntity, or element data attribute
        const entityId = actionConfig.entity || defaultEntity || element?.dataset?.entity;

        switch (action) {
            case 'toggle':
                this._handleToggle(hass, entityId);
                break;
            case 'more-info':
                this._handleMoreInfo(hass, entityId, element);
                break;
            case 'call-service':
            case 'perform-action':  // New HA alias for call-service
                this._handleCallService(hass, actionConfig);
                break;
            case 'navigate':
                this._handleNavigate(actionConfig);
                break;
            case 'url':
                this._handleUrl(actionConfig);
                break;
            case 'assist':
                this._handleAssist(hass, actionConfig, element);
                break;
            case 'none':
                // Do nothing
                break;
            default:
                lcardsLog.warn(`[LCARdSActionHandler] Unknown action: ${action}`);
        }
    }

    // ============================================================================
    // LEGACY API - For backwards compatibility with MSD ActionHelpers
    // ============================================================================

    /**
     * Handle an action event (legacy API)
     * @deprecated Use setupActions() instead for new code
     * @param {Object} element - Source element
     * @param {Object} hass - Home Assistant object
     * @param {Object} actionConfig - Action configuration
     * @param {string} actionName - Action name (tap, hold, double_tap)
     */
    handleAction(element, hass, actionConfig, actionName = 'tap') {
        lcardsLog.debug(`[LCARdSActionHandler] handleAction (legacy) called:`, {
            element: element?.tagName,
            hass: !!hass,
            actionConfig,
            actionName
        });

        if (!element || !hass || !actionConfig) {
            lcardsLog.warn(`[LCARdSActionHandler] Missing params: element=${!!element}, hass=${!!hass}, actionConfig=${!!actionConfig}`);
            return;
        }

        try {
            // Validate action config
            if (!this._validateActionConfig(actionConfig)) {
                lcardsLog.warn(`[LCARdSActionHandler] Invalid action config:`, actionConfig);
                return;
            }

            lcardsLog.debug(`[LCARdSActionHandler] Handling ${actionName} action:`, actionConfig);

            // Execute action directly
            this._executeAction(actionConfig, hass, element);

        } catch (error) {
            lcardsLog.error('[LCARdSActionHandler] Action handling error:', error);
        }
    }

    /**
     * Check if an action configuration is actionable
     * @param {Object} actionConfig - Action configuration
     * @returns {boolean} True if actionable
     */
    hasAction(actionConfig) {
        if (!actionConfig || typeof actionConfig !== 'object') return false;

        const action = actionConfig.action;
        if (!action || action === 'none') return false;

        // Check if we support this action type
        const supportedActions = [
            'toggle', 'turn_on', 'turn_off', 'more-info',
            'call-service', 'perform-action', 'navigate', 'url', 'assist'
        ];

        return supportedActions.includes(action);
    }

    /**
     * Create action configuration from various input formats
     * @param {Object|string} input - Action input
     * @returns {Object} Normalized action config
     */
    normalizeActionConfig(input) {
        if (!input) return { action: 'none' };

        // If already an object, validate and return
        if (typeof input === 'object') {
            return {
                action: input.action || 'none',
                ...input
            };
        }

        // If string, create basic action
        if (typeof input === 'string') {
            // Handle entity toggles
            if (input.startsWith('entity:')) {
                return {
                    action: 'toggle',
                    entity: input.replace('entity:', '')
                };
            }

            // Handle service calls
            if (input.includes('.')) {
                return {
                    action: 'call-service',
                    service: input
                };
            }

            // Default to navigation
            return {
                action: 'navigate',
                navigation_path: input
            };
        }

        return { action: 'none' };
    }

    // ============================================================================
    // Private Action Handlers
    // ============================================================================

    /**
     * Validate action configuration
     * @private
     */
    _validateActionConfig(actionConfig) {
        if (!actionConfig || typeof actionConfig !== 'object') {
            return false;
        }

        // Must have an action type
        if (!actionConfig.action) {
            return false;
        }

        // Validate specific action types
        switch (actionConfig.action) {
            case 'call-service':
            case 'perform-action':
                return !!actionConfig.service || !!actionConfig.perform_action;

            case 'navigate':
                return !!actionConfig.navigation_path;

            case 'url':
                return !!actionConfig.url_path;

            case 'assist':
                // Optional pipeline_id and start_listening
                return true;

            case 'toggle':
            case 'more-info':
                // Entity can come from action config or element data attribute
                return true;

            case 'none':
                return true;

            default:
                // Allow other action types
                return true;
        }
    }

    /**
     * Handle assist action
     * @private
     */
    _handleAssist(hass, actionConfig, element) {
        lcardsLog.debug(`[LCARdSActionHandler] Opening Assist dialog`);

        // Dispatch assist event - HA will handle loading the dialog
        const event = new CustomEvent('show-dialog', {
            detail: {
                dialogTag: 'ha-voice-command-dialog',
                dialogParams: {
                    pipeline_id: actionConfig.pipeline_id || 'preferred',
                    start_listening: actionConfig.start_listening ?? true
                }
            },
            bubbles: true,
            composed: true
        });

        // Dispatch from the element to ensure proper bubbling through shadow DOM
        if (element) {
            element.dispatchEvent(event);
        } else {
            // Fallback to document if element not available
            document.dispatchEvent(event);
        }
    }

    /**
     * Handle toggle action
     * @private
     */
    _handleToggle(hass, entityId) {
        if (!entityId) {
            lcardsLog.warn(`[LCARdSActionHandler] Toggle action requires entity`);
            return;
        }

        const domain = entityId.split('.')[0];
        lcardsLog.debug(`[LCARdSActionHandler] Toggling ${entityId}`);
        hass.callService(domain, 'toggle', { entity_id: entityId });
    }

    /**
     * Handle more-info action
     * @private
     */
    _handleMoreInfo(hass, entityId, element) {
        if (!entityId) {
            lcardsLog.warn(`[LCARdSActionHandler] More info action requires entity`);
            return;
        }

        lcardsLog.debug(`[LCARdSActionHandler] Opening more info for ${entityId}`);

        const event = new CustomEvent('hass-more-info', {
            detail: { entityId },
            bubbles: true,
            composed: true
        });

        // Dispatch from the element to ensure proper bubbling through shadow DOM
        if (element) {
            element.dispatchEvent(event);
        } else {
            // Fallback to document if element not available
            document.dispatchEvent(event);
        }
    }

    /**
     * Handle call-service / perform-action
     * @private
     */
    _handleCallService(hass, actionConfig) {
        // Support both 'service' (legacy) and 'perform_action' (new HA naming)
        const service = actionConfig.service || actionConfig.perform_action;
        if (!service) {
            lcardsLog.warn(`[LCARdSActionHandler] Call service action requires service or perform_action`);
            return;
        }

        const [domain, serviceAction] = service.split('.');
        // Support both service_data and data
        const serviceData = actionConfig.service_data || actionConfig.data || {};
        const target = actionConfig.target || {};

        // Merge target into serviceData if provided
        const finalData = { ...serviceData, ...target };

        lcardsLog.debug(`[LCARdSActionHandler] Calling service ${service} with data:`, finalData);
        hass.callService(domain, serviceAction, finalData);
    }

    /**
     * Handle navigate action
     * @private
     */
    _handleNavigate(actionConfig) {
        const navigationPath = actionConfig.navigation_path;
        if (!navigationPath) {
            lcardsLog.warn(`[LCARdSActionHandler] Navigate action requires navigation_path`);
            return;
        }

        lcardsLog.debug(`[LCARdSActionHandler] Navigating to ${navigationPath}`);

        window.history.pushState(null, '', navigationPath);
        window.dispatchEvent(new CustomEvent('location-changed', {
            detail: { replace: false },
            bubbles: true,
            composed: true
        }));
    }

    /**
     * Get debug information about the action handler state
     * @returns {Object} Debug information
     */
    getDebugInfo() {
        return {
            type: 'LCARdSActionHandler',
            activeHandlers: this._activeHandlers?.size || 0,
            initialized: true
        };
    }

    /**
     * Handle URL action
     * @private
     */
    _handleUrl(actionConfig) {
        const url = actionConfig.url_path;
        if (!url) {
            lcardsLog.warn(`[LCARdSActionHandler] URL action requires url_path`);
            return;
        }

        lcardsLog.debug(`[LCARdSActionHandler] Opening URL ${url}`);
        window.open(url, '_blank');
    }
}
