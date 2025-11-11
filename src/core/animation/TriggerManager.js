/**
 * TriggerManager - Handles animation triggers for a single overlay
 *
 * Responsibilities:
 * - Register animations with specific triggers
 * - Handle non-interactive triggers (on_load, on_datasource_change, etc.)
 * - Coordinate with AnimationManager for animation execution
 * - Cleanup resources on destroy
 *
 * NOTE: Interactive triggers (on_tap, on_hold, on_hover, on_double_tap) are now
 * handled by ActionHelpers.js to leverage its proven event handling and button-card
 * bridge pattern. TriggerManager only handles reactive/automatic triggers.
 *
 * Supported Triggers:
 * - on_load: Execute when overlay is first rendered (Phase 1) ✅
 * - on_datasource_change: Execute when datasource value changes (Phase 2) 🔮
 * - on_state_change: Execute when HA entity state changes (Phase 2) 🔮
 * - on_redraw: Execute when overlay re-renders (Future) 🔮
 * - on_exit: Execute when overlay is removed (Future) 🔮
 *
 * Interactive triggers handled by ActionHelpers:
 * - on_tap, on_hold, on_hover, on_double_tap ➡️ See ActionHelpers.js
 */

import { lcardsLog } from '../../utils/lcards-logging.js';

export class TriggerManager {
  constructor(overlayId, element, animationManager) {
    this.overlayId = overlayId;
    this.element = element;
    this.animationManager = animationManager;

    // Maps trigger type to animation definitions
    this.registrations = new Map(); // trigger -> animDef[]

    // Maps trigger type to cleanup function
    this.listeners = new Map(); // trigger -> cleanup function

    lcardsLog.debug(`[TriggerManager] Created for overlay: ${overlayId}`);
  }

  /**
   * Register an animation with a specific trigger
   *
   * @param {string} trigger - Trigger type (on_load, on_tap, etc.)
   * @param {Object} animDef - Animation definition
   */
  register(trigger, animDef) {
    // Initialize registration array for this trigger if needed
    if (!this.registrations.has(trigger)) {
      this.registrations.set(trigger, []);

      // Setup trigger listener (except for on_load which is handled immediately)
      if (trigger !== 'on_load') {
        this.setupTriggerListener(trigger);
      }
    }

    // Add animation definition to this trigger
    this.registrations.get(trigger).push(animDef);

    lcardsLog.debug(`[TriggerManager] Registered animation for ${this.overlayId} on trigger: ${trigger}`);
  }

  /**
   * Setup event listener for a specific trigger type
   *
   * @param {string} trigger - Trigger type
   */
  setupTriggerListener(trigger) {
    // Interactive triggers (tap, hold, hover, leave, double_tap) are handled by ActionHelpers
    const interactiveTriggers = ['on_tap', 'on_hold', 'on_hover', 'on_leave', 'on_double_tap'];
    if (interactiveTriggers.includes(trigger)) {
      lcardsLog.debug(`[TriggerManager] ${trigger} handled by ActionHelpers (skipping)`);
      return;
    }

    switch(trigger) {
      case 'on_datasource_change':
        // Handled by AnimationManager via DataSourceManager subscriptions
        lcardsLog.debug(`[TriggerManager] on_datasource_change will be handled by AnimationManager`);
        break;

      case 'on_state_change':
                // Phase 2: Will be handled by AnimationManager via HA state subscriptions
        lcardsLog.debug(`[TriggerManager] on_state_change will be handled by AnimationManager (Phase 2)`);
        break;

      default:
        lcardsLog.warn(`[TriggerManager] Unknown trigger type: ${trigger}`);
    }
  }

  /**
   * Get all registered triggers for this overlay
   *
   * @returns {Array<string>} Array of trigger names
   */
  getRegisteredTriggers() {
    return Array.from(this.registrations.keys());
  }

  /**
   * Get animation count for a specific trigger
   *
   * @param {string} trigger - Trigger type
   * @returns {number} Number of animations registered
   */
  getAnimationCount(trigger) {
    return (this.registrations.get(trigger) || []).length;
  }

  /**
   * Check if a specific trigger is registered
   *
   * @param {string} trigger - Trigger type
   * @returns {boolean}
   */
  hasTrigger(trigger) {
    return this.registrations.has(trigger);
  }

  /**
   * Cleanup all event listeners and resources
   */
  destroy() {
    lcardsLog.debug(`[TriggerManager] 🗑️ Destroying trigger manager for ${this.overlayId}`);

    // Execute all cleanup functions
    this.listeners.forEach((cleanup, trigger) => {
      try {
        cleanup();
        lcardsLog.debug(`[TriggerManager] Cleaned up listener for trigger: ${trigger}`);
      } catch (error) {
        lcardsLog.error(`[TriggerManager] Failed to cleanup listener for ${trigger}:`, error);
      }
    });

    // Clear all maps
    this.listeners.clear();
    this.registrations.clear();

    // Remove cursor pointer if it was added
    if (this.element && this.element.style) {
      this.element.style.cursor = '';
    }

    lcardsLog.debug(`[TriggerManager] ✅ Trigger manager destroyed for ${this.overlayId}`);
  }
}
