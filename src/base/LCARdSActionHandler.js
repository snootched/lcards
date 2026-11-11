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
 * States a toggle turns on from (Home Assistant's STATES_OFF, src/common/const.ts
 * in the frontend); any other state turns off.
 */
export const TOGGLE_OFF_STATES = ['closed', 'locked', 'off'];

/**
 * The sound event for a gesture's action: toggle_on / toggle_off for a toggle
 * (by the entity's state, as the toggle itself decides), the gesture's own
 * event otherwise, and null for an action that does nothing.
 * @param {any} actionConfig
 * @param {string|undefined|null} state - the toggled entity's state
 * @param {string} fallback - e.g. card_tap
 * @returns {string|null}
 */
export function actionSoundEvent(actionConfig, state, fallback) {
    if (!actionConfig?.action || actionConfig.action === 'none') return null;
    if (actionConfig.action === 'toggle' && state != null) return TOGGLE_OFF_STATES.includes(state) ? 'toggle_on' : 'toggle_off';
    return fallback;
}

/**
 * Domains whose toggle is not turn_on / turn_off: Home Assistant's
 * SPECIAL_TOGGLE_ACTIONS (src/common/entity/get_toggle_action.ts in the
 * frontend). A domain with only `on` calls it both ways.
 * @type {Record<string, { on: string, off?: string }>}
 */
export const SPECIAL_TOGGLE_ACTIONS = {
    button: { on: 'press' },
    camera: { on: 'turn_on', off: 'turn_off' },
    climate: { on: 'turn_on', off: 'turn_off' },
    cover: { on: 'open_cover', off: 'close_cover' },
    input_button: { on: 'press' },
    lock: { on: 'unlock', off: 'lock' },
    media_player: { on: 'turn_on', off: 'turn_off' },
    scene: { on: 'turn_on' },
    siren: { on: 'turn_on', off: 'turn_off' },
    valve: { on: 'open_valve', off: 'close_valve' }
};

/**
 * The service a toggle calls, as Home Assistant's own toggle picks it: from
 * the entity's state (off, closed, locked: on; else off) and its domain. A
 * group goes through the homeassistant domain. With no known state, the
 * domain's own toggle service.
 * @param {string} entityId
 * @param {string | undefined} state
 * @returns {{ domain: string, service: string }}
 */
export function toggleService(entityId, state) {
    const domain = entityId.split('.')[0];
    if (state === undefined) return { domain, service: 'toggle' };
    const turnOn = TOGGLE_OFF_STATES.includes(state);
    const special = SPECIAL_TOGGLE_ACTIONS[domain];
    const service = special?.[turnOn ? 'on' : 'off'] || special?.on || (turnOn ? 'turn_on' : 'turn_off');
    return { domain: domain === 'group' ? 'homeassistant' : domain, service };
}

/**
 * Action handler for LCARdS cards
 *
 * Provides unified action handling across all card types:
 * - tap_action, hold_action, double_tap_action
 * - Animation triggers: on_tap, on_hold, on_double_tap, on_hover, on_leave
 * - Shadow DOM support
 * - Late-binding for AnimationManager
 */
/**
 * Viewport position of a mouse, pointer or touch event, or null (keyboard activation).
 * @param {any} event
 * @returns {{ clientX: number, clientY: number }|null}
 */
export function pointerOf(event) {
    const point = event?.touches?.[0] ?? event?.changedTouches?.[0] ?? event;
    const { clientX, clientY } = point ?? {};
    if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) return null;
    // A keyboard "click" reports 0,0
    if (clientX === 0 && clientY === 0 && event?.detail === 0) return null;
    return { clientX, clientY };
}

/**
 * One instance per card (LCARdSCard creates `this._actionHandler`); there is no
 * page-wide action handler.
 */
export class LCARdSActionHandler {

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
     * @param {boolean} [options.disableHover] - When true, suppresses pointer cursor and hover/leave animation handlers
     * @param {Function} [options.getHass] - Returns the card's current hass at action time (falls back to `hass`)
     * @param {boolean} [options.segmentsOwnHold] - A hold that starts inside a `[data-lcards-segment]` child is left to that segment's own handler (taps always are)
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
        // The card's hass at action time: a handler set up once (a data grid cell) must not
        // act on the states it was set up with (a toggle would keep sending the same service)
        const liveHass = () => options.getHass?.() ?? hass;

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
            // Prefer the caller's explicit elementId over getAnimationSetup()'s overlayId —
            // getAnimationSetup() always returns a truthy default (e.g. `lcards-card-${guid}`),
            // so callers that register multiple overlays per card instance (e.g. lcards-slider's
            // four border sides) need their distinct elementId to win, or every call collides
            // on the same overlayId and each new call tears down the previous one's scope.
            const overlayId = elementId || animationSetup.overlayId;
            const shadowRoot = options.shadowRoot;
            const targetElement = shadowRoot?.querySelector(animationSetup.elementSelector || '[data-overlay-id]') || element;

            // Register overlay scope with AnimationManager (creates empty scope for rule-based animations)
            if (animationManager.onOverlayRendered) {
                animationManager.onOverlayRendered(overlayId, targetElement, { animations: options.animations || [] });
                lcardsLog.debug(`[LCARdSActionHandler] Registered animation scope: ${overlayId} (${options.animations?.length || 0} animations)`);
            }

        } else if (elementId && options.animations && !animationManager) {
            // AnimationManager not ready - store for late binding
            const animationSetup = options.getAnimationSetup?.() || {};
            const overlayId = elementId || animationSetup.overlayId;

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

            // Set up trigger listeners only after the full batch is registered — see
            // TriggerManager.finalizeRegistrations() docblock (#386).
            triggerManager.finalizeRegistrations();

            lcardsLog.debug(`[LCARdSActionHandler] ✅ TriggerManager created (late-binding) with ${animations.length} animations`);

            // Clear pending setup
            pendingAnimationSetup = null;
        };

        // Set cursor styling for actionable elements
        // Skip when the card is in non-interactive (decorative) mode.
        if (hasActions && !options.disableHover) {
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

        // Plays toggle_on/toggle_off if actionConfig is a toggle and entity state is known.
        // Returns true if a toggle sound was played; caller should skip the generic fallback.
        const playToggleSound = (actionConfig, defaultEntityId) => {
            if (actionConfig?.action !== 'toggle') return false;
            const entityId = actionConfig.entity || defaultEntityId || options.entity;
            const now = liveHass();
            if (!entityId || !now?.states?.[entityId]) return false;
            const state = now.states[entityId].state;
            playSound(TOGGLE_OFF_STATES.includes(state) ? 'toggle_on' : 'toggle_off');
            return true;
        };

        // The sound for a gesture: its toggle sound, else the generic one. Nothing
        // for an action that does nothing (action: none, or none set).
        const playActionSound = (actionConfig, defaultEntityId, eventType) => {
            if (!actionConfig?.action || actionConfig.action === 'none') return;
            if (!playToggleSound(actionConfig, defaultEntityId)) playSound(eventType);
        };

        // Track action state to prevent conflicts
        let holdTimer = null;
        let lastTapTime = 0;
        let tapCount = 0;
        let isHolding = false;

        // Tap action handler with double-tap coordination
        if (actions.tap_action || actions.double_tap_action) {
            const tapHandler = async (event) => {
                // The tap point, for stagger `from: 'pointer'` (tap-ripple)
                const tapContext = { pointer: pointerOf(event) };
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
                                    currentAnimationManager.triggerAnimations(elementId, 'on_tap', tapContext);
                                }

                                playActionSound(actions.tap_action, defaultEntity, 'card_tap');
                                this._executeAction(actions.tap_action, liveHass(), element, defaultEntity);
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
                            dtAnimationManager.triggerAnimations(elementId, 'on_double_tap', tapContext);
                        }

                        playActionSound(actions.double_tap_action, defaultEntity, 'card_double_tap');
                        this._executeAction(actions.double_tap_action, liveHass(), element, defaultEntity);
                    }
                } else {
                    // No double-tap action configured, execute immediately
                    lcardsLog.debug(`[LCARdSActionHandler] 🎯 Tap action triggered (immediate)`);

                    // Ensure animations are registered (late-binding if needed)
                    await ensureAnimationsRegistered();

                    // Trigger animation if registration completed
                    const currentAnimationManager = options.getAnimationManager?.() || window.lcards?.core?.getAnimationManager?.();
                    if (currentAnimationManager && elementId) {
                        currentAnimationManager.triggerAnimations(elementId, 'on_tap', tapContext);
                    }

                    playActionSound(actions.tap_action, defaultEntity, 'card_tap');
                    this._executeAction(actions.tap_action, liveHass(), element, defaultEntity);
                }
            };

            // SVG elements in shadow DOM - use capture phase like MSD
            element.addEventListener('click', tapHandler, { capture: true });
            cleanupFunctions.push(() => element.removeEventListener('click', tapHandler, { capture: true }));
        }

        // Hold action handler
        if (actions.hold_action) {
            /** Is the event target inside a segment with its own handler? */
            const insideSegment = (target) => {
                for (let n = target; n && n !== element; n = n.parentElement) {
                    if (n.hasAttribute?.('data-lcards-segment')) return true;
                }
                return false;
            };
            const holdStart = (event) => {
                if (options.segmentsOwnHold && insideSegment(event.target)) return;
                const holdContext = { pointer: pointerOf(event) };
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
                        currentAnimationManager.triggerAnimations(elementId, 'on_hold', holdContext);
                    }

                    playActionSound(actions.hold_action, defaultEntity, 'card_hold');
                    this._executeAction(actions.hold_action, liveHass(), element, defaultEntity);
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
        // Skipped when disableHover is set (non-interactive / decorative mode).
        if (elementId && !options.disableHover) {
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
     * Run one action now, for things that are not elements with listeners
     * (an astrometrics point picked on a canvas). Same action types as
     * setupActions(); no sounds or animations (the caller plays those).
     * @param {Object} actionConfig - e.g. { action: 'more-info', entity }
     * @param {Object} hass
     * @param {HTMLElement} element - dispatches more-info and assist events
     * @param {string|null} [defaultEntity] - when the action names none
     */
    runAction(actionConfig, hass, element, defaultEntity = null) {
        if (!this._validateActionConfig(actionConfig)) return;
        this._executeAction(actionConfig, hass, element, defaultEntity);
    }

    /**
     * Execute action configuration
     * @private
     * @param {*} [defaultEntity]
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
            case 'fly-to':
                // An astrometrics card's camera, by the card's id
                /** @type {any} */ (window).lcards?.cards?.astrometrics?.flyTo(actionConfig.card, actionConfig.point ? { point: actionConfig.point } : { view: actionConfig.view }, { duration: actionConfig.duration, warp: actionConfig.warp });
                break;
            case 'set-clock':
                // An astrometrics card's scene date and rate, by the card's id
                /** @type {any} */ (window).lcards?.cards?.astrometrics?.setClock(actionConfig.card, { date: actionConfig.date, rate: actionConfig.rate });
                break;
            case 'set-model-scale':
                // An astrometrics card's models at their real size or larger, by the card's id
                /** @type {any} */ (window).lcards?.cards?.astrometrics?.setModelScale(actionConfig.card, actionConfig.model_scale ?? 'toggle');
                break;
            case 'fire-dom-event':
                // As Home Assistant: an ll-custom event with the action config (browser_mod listens for it)
                element?.dispatchEvent(new CustomEvent('ll-custom', { detail: actionConfig, bubbles: true, composed: true }));
                break;
            case 'none':
                // Do nothing
                break;
            default:
                lcardsLog.warn(`[LCARdSActionHandler] Unknown action: ${action}`);
        }
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

            case 'fly-to':
                return typeof actionConfig.card === 'string' && !!(actionConfig.view || actionConfig.point);

            case 'set-clock':
                return typeof actionConfig.card === 'string' && (actionConfig.date !== undefined || actionConfig.rate !== undefined);

            case 'set-model-scale':
                return typeof actionConfig.card === 'string';

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

        const { domain, service } = toggleService(entityId, hass.states?.[entityId]?.state);
        lcardsLog.debug(`[LCARdSActionHandler] Toggling ${entityId}: ${domain}.${service}`);
        hass.callService(domain, service, { entity_id: entityId });
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
        // Home Assistant's names first: perform_action over the older service,
        // data over service_data (as Home Assistant's own handle-action does)
        const service = actionConfig.perform_action ?? actionConfig.service;
        if (!service) {
            lcardsLog.warn(`[LCARdSActionHandler] Call service action requires service or perform_action`);
            return;
        }
        if (actionConfig.action === 'call-service' || actionConfig.service !== undefined || actionConfig.service_data !== undefined) {
            lcardsLog.debug('[LCARdSActionHandler] Older Home Assistant action names (call-service, service, service_data); the current ones are perform-action, perform_action and data', actionConfig);
        }

        const [domain, serviceAction] = service.split('.');
        const serviceData = actionConfig.data ?? actionConfig.service_data ?? {};
        // The target goes separately, as Home Assistant passes it (entity_id, device_id,
        // area_id, ... and exclude since 2026.11), not merged into the data
        const target = actionConfig.target;

        lcardsLog.debug(`[LCARdSActionHandler] Calling service ${service}`, { data: serviceData, target });
        hass.callService(domain, serviceAction, serviceData, target);
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
