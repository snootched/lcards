/**
 * LCARdS Action Handler
 *
 * Native action handler that wraps custom-card-helpers for seamless integration
 * with Home Assistant's action system. Replaces the button-card action bridge
 * with direct integration.
 */

import { handleAction, hasAction } from 'custom-card-helpers';
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
        if (!element || !hass || !actionConfig) {
            lcardsLog.warn('[LCARdSActionHandler] Missing parameters for action handling');
            return;
        }

        try {
            // Validate action config
            if (!this._validateActionConfig(actionConfig)) {
                lcardsLog.warn('[LCARdSActionHandler] Invalid action config:', actionConfig);
                return;
            }

            lcardsLog.debug(`[LCARdSActionHandler] Handling ${actionName} action:`, actionConfig);

            // Use custom-card-helpers to handle the action
            handleAction(
                element,
                hass,
                actionConfig,
                actionName
            );

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
        if (!actionConfig) return false;
        return hasAction(actionConfig);
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
}