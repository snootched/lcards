/**
 * Core SystemsManager - Extracted Entity Tracking and State Management
 *
 * This is the extracted, simplified version of the MSD SystemsManager that focuses
 * on the core functionality needed for global card coordination:
 * - Entity state tracking and caching
 * - HASS subscription management
 * - Multi-card entity change notifications
 * - Lifecycle management
 *
 * Removed MSD-specific functionality:
 * - Rendering systems (AdvancedRenderer, MsdDebugRenderer, etc.)
 * - MSD-specific managers (HudManager, RouterCore, etc.)
 * - Overlay registries and updaters
 * - Theme and style management (moved to StyleLibrary)
 *
 * @module core/systems-manager
 */

import { lcardsLog } from '../../utils/lcards-logging.js';

/**
 * Core SystemsManager for global entity state management
 *
 * Provides entity tracking, caching, and subscription services for all LCARdS cards.
 * This is the foundation that enables multiple cards to share entity state efficiently.
 */
export class CoreSystemsManager {
  constructor() {
    // Core HASS state management
    this._hass = null;
    this._entityStates = new Map(); // entityId -> state object
    this._entitySubscriptions = new Map(); // entityId -> Set<callback>

    // Card registration
    this._registeredCards = new Map(); // cardId -> { card, callbacks }
    this._cardCounter = 0;

    // Change notification system
    this._entityChangeListeners = new Set(); // Set<callback>
    this._pendingChanges = new Set(); // entityId
    this._changeNotificationTimeout = null;

    // Lifecycle state
    this._initialized = false;
    this._destroyed = false;

    lcardsLog.debug('[CoreSystemsManager] 🚀 Initialized');
  }

  /**
   * Initialize the systems manager with HASS instance
   *
   * @param {Object} hass - Home Assistant instance
   */
  initialize(hass) {
    if (this._initialized) {
      lcardsLog.debug('[CoreSystemsManager] Already initialized, updating HASS reference');
      this.updateHass(hass);
      return;
    }

    this._hass = hass;
    this._initialized = true;

    // Initialize entity state cache from current HASS state
    if (hass && hass.states) {
      Object.entries(hass.states).forEach(([entityId, state]) => {
        this._entityStates.set(entityId, state);
      });
      lcardsLog.debug(`[CoreSystemsManager] ✅ Initialized with ${this._entityStates.size} entity states`);
    }

    lcardsLog.info('[CoreSystemsManager] ✅ Core systems initialized');
  }

  /**
   * Update HASS instance (called when HASS updates)
   *
   * @param {Object} hass - Updated Home Assistant instance
   */
  updateHass(hass) {
    if (!hass) {
      lcardsLog.warn('[CoreSystemsManager] Received null HASS update');
      return;
    }

    const oldHass = this._hass;
    this._hass = hass;

    // Detect entity state changes
    const changedEntities = new Set();

    if (hass.states) {
      Object.entries(hass.states).forEach(([entityId, newState]) => {
        const oldState = this._entityStates.get(entityId);

        if (!oldState || oldState.state !== newState.state ||
            oldState.last_changed !== newState.last_changed) {
          changedEntities.add(entityId);
          this._entityStates.set(entityId, newState);
        }
      });
    }

    // Notify subscribers of changes
    if (changedEntities.size > 0) {
      this._notifyEntityChanges(Array.from(changedEntities));
    }

    lcardsLog.debug(`[CoreSystemsManager] HASS updated, ${changedEntities.size} entities changed`);
  }

  /**
   * Register a card with the systems manager
   *
   * @param {string} cardId - Unique card identifier
   * @param {Object} card - Card instance
   * @param {Object} config - Card configuration
   * @returns {Object} Card context with utilities
   */
  registerCard(cardId, card, config = {}) {
    if (this._registeredCards.has(cardId)) {
      lcardsLog.warn(`[CoreSystemsManager] Card ${cardId} already registered, replacing`);
    }

    const cardContext = {
      cardId,
      card,
      config,
      entitySubscriptions: new Set(), // Track subscribed entities
      registeredAt: Date.now(),

      // Utilities for the card
      getEntityState: (entityId) => this.getEntityState(entityId),
      subscribeToEntity: (entityId, callback) => this.subscribeToEntity(entityId, callback),
      unsubscribeFromEntity: (entityId, callback) => this.unsubscribeFromEntity(entityId, callback),
      getAllEntityStates: () => this.getAllEntityStates()
    };

    this._registeredCards.set(cardId, cardContext);
    lcardsLog.debug(`[CoreSystemsManager] ✅ Registered card: ${cardId}`);

    return cardContext;
  }

  /**
   * Unregister a card and clean up its subscriptions
   *
   * @param {string} cardId - Card to unregister
   */
  unregisterCard(cardId) {
    const cardContext = this._registeredCards.get(cardId);
    if (!cardContext) {
      lcardsLog.warn(`[CoreSystemsManager] Cannot unregister unknown card: ${cardId}`);
      return;
    }

    // Clean up entity subscriptions for this card
    cardContext.entitySubscriptions.forEach(entityId => {
      // Remove all callbacks for this card (would need callback tracking to be more precise)
      // For now, we'll just note the cleanup needed
      lcardsLog.debug(`[CoreSystemsManager] Cleaning up subscription for ${entityId} from card ${cardId}`);
    });

    this._registeredCards.delete(cardId);
    lcardsLog.debug(`[CoreSystemsManager] ✅ Unregistered card: ${cardId}`);
  }

  /**
   * Get current state for an entity
   *
   * @param {string} entityId - Entity to get state for
   * @returns {Object|null} Entity state or null if not found
   */
  getEntityState(entityId) {
    if (!entityId) return null;

    // Try cache first
    const cached = this._entityStates.get(entityId);
    if (cached) return cached;

    // Try HASS if available
    if (this._hass && this._hass.states && this._hass.states[entityId]) {
      const state = this._hass.states[entityId];
      this._entityStates.set(entityId, state);
      return state;
    }

    return null;
  }

  /**
   * Get all entity states
   *
   * @returns {Map} Map of entityId -> state
   */
  getAllEntityStates() {
    // Merge cache with live HASS state
    const allStates = new Map(this._entityStates);

    if (this._hass && this._hass.states) {
      Object.entries(this._hass.states).forEach(([entityId, state]) => {
        allStates.set(entityId, state);
      });
    }

    return allStates;
  }

  /**
   * Subscribe to entity state changes
   *
   * @param {string} entityId - Entity to monitor
   * @param {Function} callback - Called when entity changes: callback(entityId, newState, oldState)
   * @returns {Function} Unsubscribe function
   */
  subscribeToEntity(entityId, callback) {
    if (!entityId || typeof callback !== 'function') {
      throw new Error('Invalid entityId or callback for subscription');
    }

    if (!this._entitySubscriptions.has(entityId)) {
      this._entitySubscriptions.set(entityId, new Set());
    }

    this._entitySubscriptions.get(entityId).add(callback);

    lcardsLog.debug(`[CoreSystemsManager] ✅ Subscribed to entity: ${entityId}`);

    // Return unsubscribe function
    return () => this.unsubscribeFromEntity(entityId, callback);
  }

  /**
   * Unsubscribe from entity state changes
   *
   * @param {string} entityId - Entity to stop monitoring
   * @param {Function} callback - Callback to remove
   */
  unsubscribeFromEntity(entityId, callback) {
    const subscribers = this._entitySubscriptions.get(entityId);
    if (subscribers) {
      subscribers.delete(callback);

      // Clean up empty subscription sets
      if (subscribers.size === 0) {
        this._entitySubscriptions.delete(entityId);
      }

      lcardsLog.debug(`[CoreSystemsManager] ✅ Unsubscribed from entity: ${entityId}`);
    }
  }

  /**
   * Add a global entity change listener
   *
   * @param {Function} listener - Called with array of changed entity IDs
   */
  addEntityChangeListener(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Entity change listener must be a function');
    }

    this._entityChangeListeners.add(listener);
    lcardsLog.debug('[CoreSystemsManager] ✅ Added entity change listener');
  }

  /**
   * Remove a global entity change listener
   *
   * @param {Function} listener - Listener to remove
   */
  removeEntityChangeListener(listener) {
    this._entityChangeListeners.delete(listener);
    lcardsLog.debug('[CoreSystemsManager] ✅ Removed entity change listener');
  }

  /**
   * Notify all subscribers of entity changes
   *
   * @param {Array<string>} entityIds - Changed entity IDs
   * @private
   */
  _notifyEntityChanges(entityIds) {
    if (entityIds.length === 0) return;

    // Notify individual entity subscribers
    entityIds.forEach(entityId => {
      const subscribers = this._entitySubscriptions.get(entityId);
      if (subscribers && subscribers.size > 0) {
        const newState = this.getEntityState(entityId);
        subscribers.forEach(callback => {
          try {
            callback(entityId, newState, null); // TODO: Track old state
          } catch (error) {
            lcardsLog.error(`[CoreSystemsManager] Error in entity subscription callback for ${entityId}:`, error);
          }
        });
      }
    });

    // Notify global change listeners
    this._entityChangeListeners.forEach(listener => {
      try {
        listener(entityIds);
      } catch (error) {
        lcardsLog.error('[CoreSystemsManager] Error in entity change listener:', error);
      }
    });

    lcardsLog.debug(`[CoreSystemsManager] ✅ Notified ${entityIds.length} entity changes`);
  }

  /**
   * Get debug information about the systems manager
   *
   * @returns {Object} Debug information
   */
  getDebugInfo() {
    return {
      initialized: this._initialized,
      destroyed: this._destroyed,
      registeredCards: Array.from(this._registeredCards.keys()),
      totalCards: this._registeredCards.size, // Add totalCards for validation
      entityStateCount: this._entityStates.size,
      entitySubscriptionCount: this._entitySubscriptions.size,
      globalChangeListeners: this._entityChangeListeners.size,
      hasHass: !!this._hass
    };
  }

  /**
   * Destroy the systems manager and clean up resources
   */
  destroy() {
    if (this._destroyed) return;

    // Clear all subscriptions
    this._entitySubscriptions.clear();
    this._entityChangeListeners.clear();

    // Clear registered cards
    this._registeredCards.clear();

    // Clear state cache
    this._entityStates.clear();

    // Clear pending operations
    if (this._changeNotificationTimeout) {
      clearTimeout(this._changeNotificationTimeout);
      this._changeNotificationTimeout = null;
    }

    this._destroyed = true;
    this._initialized = false;
    this._hass = null;

    lcardsLog.info('[CoreSystemsManager] ✅ Destroyed');
  }
}