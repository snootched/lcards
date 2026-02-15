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
    // Track if this is the first animation for this trigger
    const isFirstForTrigger = !this.registrations.has(trigger);

    // Initialize registration array for this trigger if needed
    if (isFirstForTrigger) {
      this.registrations.set(trigger, []);
    }

    // Add animation definition to this trigger
    this.registrations.get(trigger).push(animDef);

    // Setup trigger listener after adding animation (except for on_load which is handled immediately)
    if (isFirstForTrigger && trigger !== 'on_load') {
      this.setupTriggerListener(trigger);
    }

    lcardsLog.debug(`[TriggerManager] Registered animation for ${this.overlayId} on trigger: ${trigger}`);
  }

  /**
   * Setup event listener for a specific trigger type
   *
   * @param {string} trigger - Trigger type
   */
  setupTriggerListener(trigger) {
    // Interactive triggers (tap, hold, hover, leave, double_tap) are handled by the card
    // For segments, these are triggered directly via playSegmentAnimation from the card's event handlers
    const interactiveTriggers = ['on_tap', 'on_hold', 'on_hover', 'on_leave', 'on_double_tap'];
    if (interactiveTriggers.includes(trigger)) {
      lcardsLog.debug(`[TriggerManager] ${trigger} handled by card event handlers (skipping)`);
      return;
    }

    // Entity state change triggers - setup entity subscription
    if (trigger === 'on_entity_change') {
      this._setupEntityChangeListeners();
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
   * Setup entity change listeners for all on_entity_change animations
   * @private
   */
  _setupEntityChangeListeners() {
    lcardsLog.debug(`[TriggerManager] 🔍 _setupEntityChangeListeners called for overlay: ${this.overlayId}`);

    const animations = this.registrations.get('on_entity_change');
    if (!animations || animations.length === 0) {
      lcardsLog.debug(`[TriggerManager] No on_entity_change animations to setup for: ${this.overlayId}`);
      return;
    }

    lcardsLog.debug(`[TriggerManager] Found ${animations.length} on_entity_change animations for ${this.overlayId}`);

    // Get SystemsManager from AnimationManager
    const systemsManager = this.animationManager?.systemsManager;
    if (!systemsManager) {
      lcardsLog.warn('[TriggerManager] Cannot setup entity change listeners - no SystemsManager');
      return;
    }

    // Track entity subscriptions for cleanup
    if (!this._entitySubscriptions) {
      this._entitySubscriptions = [];
    }

    // Subscribe to each unique entity
    const subscribedEntities = new Set();

    lcardsLog.debug(`[TriggerManager] Processing ${animations.length} animations for subscriptions`);

    animations.forEach(animDef => {
      const entityId = animDef.entity;

      lcardsLog.debug(`[TriggerManager] Animation definition:`, {
        hasEntity: !!entityId,
        entityId: entityId,
        trigger: animDef.trigger,
        preset: animDef.preset
      });

      if (!entityId) {
        lcardsLog.warn(`[TriggerManager] on_entity_change animation missing entity_id for overlay: ${this.overlayId}`);
        return;
      }

      // Only subscribe once per entity
      if (subscribedEntities.has(entityId)) {
        return;
      }
      subscribedEntities.add(entityId);

      // Subscribe to entity state changes
      // SystemsManager callback signature: (entityId, newState, oldState)
      const unsubscribe = systemsManager.subscribeToEntity(entityId, (changedEntityId, newState, oldState) => {
        lcardsLog.trace(`[TriggerManager] Entity change detected: ${changedEntityId} (overlay: ${this.overlayId})`);

        // Filter animations by state transition if specified
        animations.forEach(anim => {
          if (anim.entity !== changedEntityId) {
            return;
          }

          // Check from_state filter
          // Note: If oldState is null/undefined (entity just became available), only match if from_state is not specified
          if (anim.from_state) {
            if (!oldState || oldState.state !== anim.from_state) {
              lcardsLog.trace(`[TriggerManager] Skipping animation - from_state mismatch: expected ${anim.from_state}, got ${oldState?.state || 'unavailable'}`);
              return;
            }
          }

          // Check to_state filter
          if (anim.to_state && newState?.state !== anim.to_state) {
            lcardsLog.trace(`[TriggerManager] Skipping animation - to_state mismatch: expected ${anim.to_state}, got ${newState?.state || 'unavailable'}`);
            return;
          }

          // State transition matches - trigger animation
          lcardsLog.debug(`[TriggerManager] 🎬 Triggering animation for ${this.overlayId} on entity change: ${changedEntityId}`);
          this.animationManager.playAnimation(this.overlayId, anim);
        });
      });

      this._entitySubscriptions.push(unsubscribe);
      lcardsLog.debug(`[TriggerManager] ✅ Subscribed to entity: ${entityId} for overlay: ${this.overlayId}`);
    });
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

    // Cleanup entity subscriptions
    if (this._entitySubscriptions && this._entitySubscriptions.length > 0) {
      this._entitySubscriptions.forEach(unsubscribe => {
        try {
          unsubscribe();
        } catch (error) {
          lcardsLog.error(`[TriggerManager] Failed to cleanup entity subscription:`, error);
        }
      });
      this._entitySubscriptions = [];
      lcardsLog.debug(`[TriggerManager] Cleaned up entity subscriptions`);
    }

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
