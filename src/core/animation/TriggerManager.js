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

    // Tracks looping animations with a 'while' condition that are currently playing
    this._whileActiveAnims = new Set(); // Set<animDef references>

    /** @type {boolean} Set by AnimationManager when recreating a scope that had active while-animations */
    this._isRecreation = false;

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

    const systemsManager = this.animationManager?.systemsManager;
    if (!systemsManager) {
      lcardsLog.warn('[TriggerManager] Cannot setup entity change listeners - no SystemsManager');
      return;
    }

    if (!this._entitySubscriptions) {
      this._entitySubscriptions = [];
    }

    const subscribedEntities = new Set();

    animations.forEach(animDef => {
      const entityId = animDef.entity;
      if (!entityId) {
        lcardsLog.warn(`[TriggerManager] on_entity_change animation missing 'entity' for overlay: ${this.overlayId}`);
        return;
      }
      if (subscribedEntities.has(entityId)) return;
      subscribedEntities.add(entityId);

      const unsubscribe = systemsManager.subscribeToEntity(entityId, (changedEntityId, newState, oldState) => {
        lcardsLog.trace(`[TriggerManager] Entity change: ${changedEntityId} (overlay: ${this.overlayId})`);

        animations.forEach(anim => {
          if (anim.entity !== changedEntityId) return;

          const newValue = this._resolveEntityValue(anim, newState);
          const oldValue = this._resolveEntityValue(anim, oldState);

          // --- While-lifecycle path ---
          // When 'while' is present it always gates the animation — the while-block
          // always returns so the fire-and-forget path below is never reached.
          if (anim.while) {
            const condMet    = this._evaluateWhileCondition(anim, newValue);
            const isActive   = this._whileActiveAnims.has(anim);
            // loop may be at top level (canonical) or legacy params.loop
            const effectiveLoop = anim.loop ?? anim.params?.loop;

            if (effectiveLoop === true) {
              // Full lifecycle: play while condition met, stop when it clears
              if (condMet) {
                if (!isActive) {
                  // oldState === null means this is the very first ingestHass on page
                  // load: HA reports every entity as "changed" from nothing.  We
                  // always suppress the direct subscription path here — the
                  // check_on_load block below is the proper gate for initial-load
                  // evaluation.  Default is to check on load (check_on_load: true);
                  // set check_on_load: false to suppress animation until the next
                  // real state transition.
                  if (oldState === null) {
                    lcardsLog.debug(`[TriggerManager] while-start suppressed on initial load for ${changedEntityId} — handled by check_on_load block`);
                    return;
                  }
                  // Respect from_state/to_state fire gates when starting for the first time
                  const fromOk = anim.from_state === undefined || String(oldValue) === String(anim.from_state);
                  const toOk   = anim.to_state   === undefined || String(newValue) === String(anim.to_state);
                  if (fromOk && toOk) {
                    this._whileActiveAnims.add(anim);
                    lcardsLog.debug(`[TriggerManager] 🎬 while-start: ${this.overlayId}, entity: ${changedEntityId}`);
                    this.animationManager.playAnimation(this.overlayId, anim);
                  }
                }
                // Already active → loop continues, nothing to do
              } else if (isActive) {
                this._whileActiveAnims.delete(anim);
                lcardsLog.debug(`[TriggerManager] ⏹️ while-stop: ${this.overlayId}, entity: ${changedEntityId}`);
                this.animationManager.stopAnimations(this.overlayId, 'on_entity_change');
              }
            } else {
              // while without loop: still gate on the condition, but no stop tracking.
              // Fire only on the rising edge (condition newly true).
              lcardsLog.warn(`[TriggerManager] 'while' works best with 'loop: true' — no auto-stop tracking for overlay: ${this.overlayId}`);
              const wasCondMet = oldState ? this._evaluateWhileCondition(anim, oldValue) : false;
              if (condMet && !wasCondMet) {
                lcardsLog.debug(`[TriggerManager] 🎬 while-start (no-loop): ${this.overlayId}, entity: ${changedEntityId}`);
                this.animationManager.playAnimation(this.overlayId, anim);
              }
            }
            return; // while-path fully handled — never fall through to fire-and-forget
          }

          // --- Fire-and-forget path ---
          if (anim.from_state !== undefined) {
            if (!oldState || String(oldValue) !== String(anim.from_state)) {
              lcardsLog.trace(`[TriggerManager] from_state mismatch: expected ${anim.from_state}, got ${oldValue ?? 'unavailable'}`);
              return;
            }
          }
          if (anim.to_state !== undefined && String(newValue) !== String(anim.to_state)) {
            lcardsLog.trace(`[TriggerManager] to_state mismatch: expected ${anim.to_state}, got ${newValue ?? 'unavailable'}`);
            return;
          }

          lcardsLog.debug(`[TriggerManager] 🎬 Triggering animation for ${this.overlayId} on entity change: ${changedEntityId}`);
          this.animationManager.playAnimation(this.overlayId, anim);
        });
      });

      this._entitySubscriptions.push(unsubscribe);
      lcardsLog.debug(`[TriggerManager] ✅ Subscribed to entity: ${entityId} for overlay: ${this.overlayId}`);
    });

    // check_on_load: evaluate against current state immediately
    // Recreation re-seed: when the scope is being recreated (e.g. SVG re-rendered
    // due to entity-state-driven style change), unconditionally restore any
    // while+loop animation that was running before the old scope was torn down.
    // This is intentionally separate from — and not gated by — check_on_load.
    if (this._isRecreation) {
      animations.forEach(anim => {
        if (!anim.while) return;
        const effectiveLoop = anim.loop ?? anim.params?.loop;
        if (effectiveLoop !== true) return;
        const entityId = anim.entity;
        if (!entityId) return;
        const currentState = systemsManager.getEntityState?.(entityId);
        if (!currentState) return;
        const currentValue = this._resolveEntityValue(anim, currentState);
        const condMet = this._evaluateWhileCondition(anim, currentValue);
        if (condMet && !this._whileActiveAnims.has(anim)) {
          this._whileActiveAnims.add(anim);
          lcardsLog.debug(`[TriggerManager] 🔄 Recreation re-seed: while condition met for ${entityId}, restarting animation`);
          this.animationManager.playAnimation(this.overlayId, anim);
        } else {
          lcardsLog.debug(`[TriggerManager] 🔄 Recreation re-seed: while condition NOT met for ${entityId} — not starting`);
        }
      });
    }

    animations.forEach(anim => {
      // Default is to check on load (check_on_load defaults to true).
      // Only skip when the user has explicitly opted out with check_on_load: false.
      if (anim.check_on_load === false) return;

      const entityId = anim.entity;
      if (!entityId) return;

      const currentState = systemsManager.getEntityState?.(entityId);
      if (!currentState) {
        lcardsLog.debug(`[TriggerManager] check_on_load: no current state for ${entityId}`);
        return;
      }

      const currentValue = this._resolveEntityValue(anim, currentState);
      lcardsLog.debug(`[TriggerManager] check_on_load: entity=${entityId} value=${currentValue} (attribute: ${anim.attribute ?? 'state'})`);

      // While condition: evaluate immediately — gate applies regardless of loop setting
      if (anim.while) {
        const condMet = this._evaluateWhileCondition(anim, currentValue);
        // loop may be at top level (canonical) or legacy params.loop
        const effectiveLoop = anim.loop ?? anim.params?.loop;
        if (condMet) {
          if (effectiveLoop === true) {
            if (!this._whileActiveAnims.has(anim)) {
              this._whileActiveAnims.add(anim);
              lcardsLog.debug(`[TriggerManager] 🎬 check_on_load while-start: ${entityId} condition already met`);
              this.animationManager.playAnimation(this.overlayId, anim);
            }
          } else {
            lcardsLog.debug(`[TriggerManager] 🎬 check_on_load while-start (no-loop): ${entityId} condition already met`);
            this.animationManager.playAnimation(this.overlayId, anim);
          }
        } else {
          lcardsLog.debug(`[TriggerManager] check_on_load while: condition NOT met for ${entityId} — not starting`);
        }
        return;
      }

      // Fire-and-forget: from_state not applicable on load (no prior state)
      if (anim.to_state !== undefined && String(currentValue) !== String(anim.to_state)) {
        lcardsLog.debug(`[TriggerManager] check_on_load: to_state mismatch for ${entityId} \u2014 expected ${anim.to_state}, got ${currentValue}`);
        return;
      }

      lcardsLog.debug(`[TriggerManager] 🎬 check_on_load: triggering for ${this.overlayId} \u2014 ${entityId}=${currentValue}`);
      this.animationManager.playAnimation(this.overlayId, anim);
    });
  }

  /**
   * Resolve the value to compare for an animation, respecting the top-level
   * 'attribute' field and the virtual 'brightness_pct' attribute.
   *
   * @param {Object} anim      - Animation definition (may have .attribute)
   * @param {Object} stateObj  - HA entity state object { state, attributes }
   * @returns {string|number|undefined}
   */
  _resolveEntityValue(anim, stateObj) {
    if (!stateObj) return undefined;
    const attr = anim.attribute;
    if (!attr) return stateObj.state;
    if (attr === 'brightness_pct') {
      const b = stateObj.attributes?.brightness;
      return b !== undefined ? Math.round(b / 2.55) : undefined;
    }
    return stateObj.attributes?.[attr];
  }

  /**
   * Evaluate a 'while' condition block against a resolved entity value.
   *
   * Supported keys (use exactly one):
   *   state     {string}  — value equals this
   *   not_state {string}  — value does not equal this
   *   above     {number}  — numeric value > threshold
   *   below     {number}  — numeric value < threshold
   *
   * @param {Object} anim         - Animation definition containing .while
   * @param {*}      currentValue - Resolved entity value (string or number)
   * @returns {boolean|null} true/false if condition evaluated, null if no usable condition
   */
  _evaluateWhileCondition(anim, currentValue) {
    const w = anim.while;
    if (!w || typeof w !== 'object') return null;
    if (w.state     !== undefined) return String(currentValue) === String(w.state);
    if (w.not_state !== undefined) return String(currentValue) !== String(w.not_state);
    const numVal = Number(currentValue);
    if (w.above !== undefined) return Number.isFinite(numVal) && numVal > Number(w.above);
    if (w.below !== undefined) return Number.isFinite(numVal) && numVal < Number(w.below);
    lcardsLog.warn(`[TriggerManager] 'while' has no recognised key (state/not_state/above/below) for overlay: ${this.overlayId}`);
    return null;
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

    // Clear while-condition tracking set
    this._whileActiveAnims.clear();

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
