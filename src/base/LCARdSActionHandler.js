/**
 * LCARdS Action Handler
 *
 * Native action handler for direct integration with Home Assistant's action system.
 * Handles all major Home Assistant action types without external dependencies.
 */

import { lcardsLog } from '../utils/lcards-logging.js';

/**
 * Action handler for LCARdS cards
 *
 * Provides unified action handling across all card types:
 * - tap_action
 * - hold_action
 * - double_tap_action
 * - Custom actions for MSD overlays
 */
export class LCARdSActionHandler {

    constructor() {
        this._registeredElements = new WeakMap();
        this._activeHandlers = new Set();
    }

    /**
     * Handle an action event
     * @param {Object} element - Source element
     * @param {Object} hass - Home Assistant object
     * @param {Object} actionConfig - Action configuration
     * @param {string} actionName - Action name (tap, hold, double_tap)
     */
    handleAction(element, hass, actionConfig, actionName = 'tap') {
        lcardsLog.debug(`[LCARdSActionHandler] handleAction called:`, {
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

            // Handle actions directly instead of using custom-card-helpers
            this._handleActionDirectly(element, hass, actionConfig, actionName);

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
            'call-service', 'navigate', 'url'
        ];

        return supportedActions.includes(action);
    }

    /**
     * Register action handlers for an element
     * @param {HTMLElement} element - Target element
     * @param {Object} actionConfigs - Action configurations
     */
    registerElement(element, actionConfigs) {
        if (!element || !actionConfigs) return;

        try {
            // Store action configs for this element
            this._registeredElements.set(element, actionConfigs);

            // Add event listeners
            this._addEventListeners(element, actionConfigs);

            lcardsLog.debug('[LCARdSActionHandler] Registered element with actions:', actionConfigs);

        } catch (error) {
            lcardsLog.error('[LCARdSActionHandler] Element registration error:', error);
        }
    }

    /**
     * Unregister action handlers for an element
     * @param {HTMLElement} element - Target element
     */
    unregisterElement(element) {
        if (!element) return;

        try {
            // Remove event listeners
            this._removeEventListeners(element);

            // Clear stored configs
            this._registeredElements.delete(element);

            lcardsLog.debug('[LCARdSActionHandler] Unregistered element');

        } catch (error) {
            lcardsLog.error('[LCARdSActionHandler] Element unregistration error:', error);
        }
    }

    /**
     * Create action handlers for MSD overlays
     * @param {Object} overlay - Overlay configuration
     * @param {Object} hass - Home Assistant object
     * @returns {Object} Handler functions
     */
    createMsdOverlayHandlers(overlay, hass) {
        if (!overlay || !hass) return {};

        const handlers = {};

        // Create handlers for different action types
        ['tap_action', 'hold_action', 'double_tap_action'].forEach(actionType => {
            const actionConfig = overlay[actionType];
            if (actionConfig && this.hasAction(actionConfig)) {
                handlers[actionType] = (event) => {
                    event.stopPropagation();
                    this.handleAction(event.target, hass, actionConfig, actionType.replace('_action', ''));
                };
            }
        });

        // Create custom action handler for MSD-specific actions
        if (overlay.actions && Array.isArray(overlay.actions)) {
            handlers.customActions = overlay.actions.map(action => ({
                id: action.id,
                handler: (event) => {
                    event.stopPropagation();
                    this.handleAction(event.target, hass, action, 'custom');
                }
            }));
        }

        return handlers;
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

    /**
     * Cleanup all registered handlers
     */
    cleanup() {
        try {
            // Clear all active handlers
            this._activeHandlers.clear();

            lcardsLog.debug('[LCARdSActionHandler] Cleanup completed');

        } catch (error) {
            lcardsLog.error('[LCARdSActionHandler] Cleanup error:', error);
        }
    }

    // ============================================================================
    // Private Implementation
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
                return !!actionConfig.service;

            case 'navigate':
                return !!actionConfig.navigation_path;

            case 'url':
                return !!actionConfig.url_path;

            case 'toggle':
            case 'more-info':
                return !!actionConfig.entity;

            case 'none':
                return true;

            default:
                // Allow other action types (fire-dom-event, etc.)
                return true;
        }
    }

    /**
     * Add event listeners to element
     * @private
     */
    _addEventListeners(element, actionConfigs) {
        const handlers = {
            tap: actionConfigs.tap_action,
            hold: actionConfigs.hold_action,
            double_tap: actionConfigs.double_tap_action
        };

        // Add click handler for tap actions
        if (handlers.tap && this.hasAction(handlers.tap)) {
            const tapHandler = (event) => {
                this.handleAction(element, element.hass, handlers.tap, 'tap');
            };
            element.addEventListener('click', tapHandler);
            this._activeHandlers.add({ element, type: 'click', handler: tapHandler });
        }

        // Add touch handlers for hold/double-tap if needed
        if (handlers.hold && this.hasAction(handlers.hold)) {
            this._addHoldHandler(element, handlers.hold);
        }

        if (handlers.double_tap && this.hasAction(handlers.double_tap)) {
            this._addDoubleTapHandler(element, handlers.double_tap);
        }
    }

    /**
     * Remove event listeners from element
     * @private
     */
    _removeEventListeners(element) {
        // Remove all handlers for this element
        this._activeHandlers.forEach(handlerInfo => {
            if (handlerInfo.element === element) {
                element.removeEventListener(handlerInfo.type, handlerInfo.handler);
                this._activeHandlers.delete(handlerInfo);
            }
        });
    }

    /**
     * Add hold action handler
     * @private
     */
    _addHoldHandler(element, holdConfig) {
        let holdTimer = null;
        const holdDelay = 500; // ms

        const startHold = (event) => {
            holdTimer = setTimeout(() => {
                this.handleAction(element, element.hass, holdConfig, 'hold');
            }, holdDelay);
        };

        const cancelHold = () => {
            if (holdTimer) {
                clearTimeout(holdTimer);
                holdTimer = null;
            }
        };

        element.addEventListener('mousedown', startHold);
        element.addEventListener('mouseup', cancelHold);
        element.addEventListener('mouseleave', cancelHold);
        element.addEventListener('touchstart', startHold);
        element.addEventListener('touchend', cancelHold);

        // Store handlers for cleanup
        this._activeHandlers.add({ element, type: 'mousedown', handler: startHold });
        this._activeHandlers.add({ element, type: 'mouseup', handler: cancelHold });
        this._activeHandlers.add({ element, type: 'mouseleave', handler: cancelHold });
        this._activeHandlers.add({ element, type: 'touchstart', handler: startHold });
        this._activeHandlers.add({ element, type: 'touchend', handler: cancelHold });
    }

    /**
     * Add double-tap action handler
     * @private
     */
    _addDoubleTapHandler(element, doubleTapConfig) {
        let tapCount = 0;
        let tapTimer = null;
        const doubleTapDelay = 300; // ms

        const handleTap = (event) => {
            tapCount++;

            if (tapCount === 1) {
                tapTimer = setTimeout(() => {
                    tapCount = 0;
                }, doubleTapDelay);
            } else if (tapCount === 2) {
                clearTimeout(tapTimer);
                tapCount = 0;
                event.preventDefault();
                this.handleAction(element, element.hass, doubleTapConfig, 'double_tap');
            }
        };

        element.addEventListener('click', handleTap);
        this._activeHandlers.add({ element, type: 'click', handler: handleTap });
    }

    /**
     * Handle action directly using Home Assistant service calls
     * @param {HTMLElement} element - Source element
     * @param {Object} hass - Home Assistant object
     * @param {Object} actionConfig - Action configuration
     * @param {string} actionName - Action name (tap, hold, double_tap)
     * @private
     */
    _handleActionDirectly(element, hass, actionConfig, actionName) {
        const action = actionConfig.action;
        const entityId = actionConfig.entity;

        lcardsLog.debug(`[LCARdSActionHandler] Direct action handling: ${action} on ${entityId}`);

        switch (action) {
            case 'toggle':
                this._handleToggle(hass, entityId);
                break;

            case 'turn_on':
                this._handleTurnOn(hass, entityId);
                break;

            case 'turn_off':
                this._handleTurnOff(hass, entityId);
                break;

            case 'more-info':
                this._handleMoreInfo(hass, entityId);
                break;

            case 'call-service':
                this._handleCallService(hass, actionConfig);
                break;

            case 'navigate':
                this._handleNavigate(actionConfig);
                break;

            case 'url':
                this._handleUrl(actionConfig);
                break;

            case 'none':
                lcardsLog.debug(`[LCARdSActionHandler] No action specified`);
                break;

            default:
                lcardsLog.warn(`[LCARdSActionHandler] Unknown action type: ${action}. Supported actions: toggle, turn_on, turn_off, more-info, call-service, navigate, url, none`);
                break;
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
        const currentState = hass.states[entityId];
        const isOn = currentState && currentState.state === 'on';

        lcardsLog.debug(`[LCARdSActionHandler] Toggling ${entityId}: ${currentState?.state} -> ${isOn ? 'off' : 'on'}`);

        hass.callService(domain, isOn ? 'turn_off' : 'turn_on', { entity_id: entityId });
    }

    /**
     * Handle turn_on action
     * @private
     */
    _handleTurnOn(hass, entityId) {
        if (!entityId) {
            lcardsLog.warn(`[LCARdSActionHandler] Turn on action requires entity`);
            return;
        }

        const domain = entityId.split('.')[0];
        lcardsLog.debug(`[LCARdSActionHandler] Turning on ${entityId}`);
        hass.callService(domain, 'turn_on', { entity_id: entityId });
    }

    /**
     * Handle turn_off action
     * @private
     */
    _handleTurnOff(hass, entityId) {
        if (!entityId) {
            lcardsLog.warn(`[LCARdSActionHandler] Turn off action requires entity`);
            return;
        }

        const domain = entityId.split('.')[0];
        lcardsLog.debug(`[LCARdSActionHandler] Turning off ${entityId}`);
        hass.callService(domain, 'turn_off', { entity_id: entityId });
    }

    /**
     * Handle more-info action
     * @private
     */
    _handleMoreInfo(hass, entityId) {
        if (!entityId) {
            lcardsLog.warn(`[LCARdSActionHandler] More info action requires entity`);
            return;
        }

        lcardsLog.debug(`[LCARdSActionHandler] Opening more info for ${entityId}`);

        // Dispatch Home Assistant event to open more info dialog
        const event = new CustomEvent('hass-more-info', {
            detail: { entityId },
            bubbles: true,
            composed: true
        });
        document.dispatchEvent(event);
    }

    /**
     * Handle call-service action
     * @private
     */
    _handleCallService(hass, actionConfig) {
        const service = actionConfig.service;
        if (!service) {
            lcardsLog.warn(`[LCARdSActionHandler] Call service action requires service`);
            return;
        }

        const [domain, serviceAction] = service.split('.');
        const serviceData = actionConfig.service_data || {};

        lcardsLog.debug(`[LCARdSActionHandler] Calling service ${service} with data:`, serviceData);
        hass.callService(domain, serviceAction, serviceData);
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

        // Use Home Assistant's navigation
        const event = new CustomEvent('location-changed', {
            detail: { replace: false },
            bubbles: true,
            composed: true
        });

        window.history.pushState(null, '', navigationPath);
        window.dispatchEvent(event);
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