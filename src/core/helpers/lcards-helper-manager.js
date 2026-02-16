/**
 * @fileoverview LCARdS Helper Manager - Core service for helper lifecycle and state management
 *
 * Manages the complete lifecycle of LCARdS input helpers:
 * - Detection of missing helpers
 * - Creation via WebSocket API
 * - State monitoring and subscriptions
 * - Value reading and writing
 *
 * Integrates with:
 * - Helper Registry (schema definitions)
 * - Helper API (WebSocket operations)
 * - Home Assistant state system
 *
 * @module core/helpers/lcards-helper-manager
 */

import { BaseService } from '../BaseService.js';
import { lcardsLog } from '../../utils/lcards-logging.js';
import {
  HELPER_REGISTRY,
  getAllHelpers,
  getHelpersByCategory,
  getHelperDefinition,
  generateHelpersYAML
} from './lcards-helper-registry.js';
import {
  ensureHelper,
  helperExists as apiHelperExists,
  getHelperValue as apiGetHelperValue,
  setHelperValue as apiSetHelperValue
} from './lcards-helper-api.js';

/**
 * LCARdS Helper Manager Service
 *
 * Central service for managing input helper lifecycle and state.
 * Extends BaseService to participate in core HASS distribution.
 */
export class LCARdSHelperManager extends BaseService {
  constructor(hass = null) {
    super();
    
    /** @type {Object|null} Home Assistant instance */
    this.hass = hass;
    
    /** @type {Map<string, Array<Function>>} Subscriptions by helper key */
    this._subscriptions = new Map();
    
    /** @type {Map<string, Function>} Unsubscribe functions for state changes */
    this._stateUnsubscribers = new Map();
    
    /** @type {Map<string, *>} Cached helper values */
    this._valueCache = new Map();
    
    lcardsLog.debug('[HelperManager] Service created');
  }
  
  /**
   * Update HASS instance (BaseService override)
   * Called when HASS is updated
   *
   * @param {Object} hass - New Home Assistant instance
   */
  updateHass(hass) {
    const wasInitialized = !!this.hass;
    this.hass = hass;
    
    if (!wasInitialized) {
      lcardsLog.debug('[HelperManager] HASS instance set, manager ready');
      this._setupStateListeners();
    } else {
      // Update value cache with new state
      this._updateValueCache();
    }
  }
  
  /**
   * Setup state change listeners for all registered helpers
   * @private
   */
  _setupStateListeners() {
    if (!this.hass || !this.hass.connection) {
      lcardsLog.warn('[HelperManager] Cannot setup state listeners - HASS not ready');
      return;
    }
    
    // Subscribe to state changes for all helpers
    getAllHelpers().forEach(helper => {
      this._subscribeToHelperState(helper.key, helper.entity_id);
    });
  }
  
  /**
   * Subscribe to state changes for a specific helper
   * @private
   */
  _subscribeToHelperState(key, entityId) {
    if (!this.hass || !this.hass.connection) {
      return;
    }
    
    // If already subscribed, skip
    if (this._stateUnsubscribers.has(key)) {
      return;
    }
    
    // Subscribe to state changes
    try {
      const unsubscribe = this.hass.connection.subscribeEvents(
        (event) => this._handleStateChange(key, entityId, event),
        'state_changed'
      );
      
      this._stateUnsubscribers.set(key, unsubscribe);
      lcardsLog.debug(`[HelperManager] Subscribed to state changes: ${entityId}`);
    } catch (error) {
      lcardsLog.error(`[HelperManager] Failed to subscribe to ${entityId}:`, error);
    }
  }
  
  /**
   * Handle state change event for a helper
   * @private
   */
  _handleStateChange(key, entityId, event) {
    // Check if this event is for our helper
    if (event.data.entity_id !== entityId) {
      return;
    }
    
    const newState = event.data.new_state;
    const oldState = event.data.old_state;
    
    if (!newState) {
      return;
    }
    
    const newValue = newState.state;
    const oldValue = oldState ? oldState.state : null;
    
    // Update cache
    this._valueCache.set(key, newValue);
    
    // Notify subscribers
    if (this._subscriptions.has(key)) {
      const callbacks = this._subscriptions.get(key);
      callbacks.forEach(callback => {
        try {
          callback(newValue, oldValue);
        } catch (error) {
          lcardsLog.error(`[HelperManager] Subscriber callback error for ${key}:`, error);
        }
      });
    }
    
    lcardsLog.debug(`[HelperManager] State changed: ${entityId} = ${newValue}`);
  }
  
  /**
   * Update value cache from current HASS state
   * @private
   */
  _updateValueCache() {
    if (!this.hass || !this.hass.states) {
      return;
    }
    
    getAllHelpers().forEach(helper => {
      const state = this.hass.states[helper.entity_id];
      if (state) {
        this._valueCache.set(helper.key, state.state);
      }
    });
  }
  
  // ===== PUBLIC API: LIFECYCLE =====
  
  /**
   * Get list of helpers that don't exist in Home Assistant
   *
   * @returns {Array<Object>} Array of helper definitions that are missing
   */
  getMissingHelpers() {
    if (!this.hass) {
      lcardsLog.warn('[HelperManager] Cannot check missing helpers - HASS not available');
      return getAllHelpers();
    }
    
    return getAllHelpers().filter(helper => !apiHelperExists(this.hass, helper.entity_id));
  }
  
  /**
   * Ensure all helpers exist, creating missing ones
   *
   * @returns {Promise<Object>} Results object with created/existing counts
   * @throws {Error} If HASS not available
   */
  async ensureAllHelpers() {
    if (!this.hass) {
      throw new Error('[HelperManager] Cannot ensure helpers - HASS not available');
    }
    
    lcardsLog.info('[HelperManager] Ensuring all helpers exist...');
    
    const results = {
      total: 0,
      existing: 0,
      created: 0,
      failed: 0,
      errors: []
    };
    
    const allHelpers = getAllHelpers();
    results.total = allHelpers.length;
    
    for (const helper of allHelpers) {
      try {
        const result = await ensureHelper(this.hass, helper);
        
        if (result.exists) {
          results.existing++;
        } else if (result.created) {
          results.created++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          helper: helper.key,
          error: error.message
        });
        lcardsLog.error(`[HelperManager] Failed to ensure ${helper.key}:`, error);
      }
    }
    
    lcardsLog.info(`[HelperManager] Ensure complete: ${results.created} created, ${results.existing} existing, ${results.failed} failed`);
    
    return results;
  }
  
  /**
   * Ensure a single helper exists by registry key
   *
   * @param {string} key - Registry key (e.g., 'alert_mode')
   * @returns {Promise<Object>} Result object
   * @throws {Error} If helper not found in registry or HASS not available
   */
  async ensureHelper(key) {
    if (!this.hass) {
      throw new Error('[HelperManager] Cannot ensure helper - HASS not available');
    }
    
    const definition = getHelperDefinition(key);
    if (!definition) {
      throw new Error(`[HelperManager] Helper not found in registry: ${key}`);
    }
    
    return await ensureHelper(this.hass, definition);
  }
  
  // ===== PUBLIC API: STATE ACCESS =====
  
  /**
   * Get current value of a helper
   *
   * @param {string} key - Registry key
   * @returns {*} Current value or default value if helper doesn't exist
   */
  getHelperValue(key) {
    const definition = getHelperDefinition(key);
    if (!definition) {
      lcardsLog.warn(`[HelperManager] Unknown helper key: ${key}`);
      return null;
    }
    
    // Try cache first
    if (this._valueCache.has(key)) {
      return this._valueCache.get(key);
    }
    
    // Fall back to API
    if (this.hass) {
      const value = apiGetHelperValue(this.hass, definition.entity_id, definition.default_value);
      this._valueCache.set(key, value);
      return value;
    }
    
    // Return default if no HASS
    return definition.default_value;
  }
  
  /**
   * Set helper value via service call
   *
   * @param {string} key - Registry key
   * @param {*} value - New value to set
   * @returns {Promise<void>}
   * @throws {Error} If helper not found or HASS not available
   */
  async setHelperValue(key, value) {
    if (!this.hass) {
      throw new Error('[HelperManager] Cannot set helper value - HASS not available');
    }
    
    const definition = getHelperDefinition(key);
    if (!definition) {
      throw new Error(`[HelperManager] Helper not found in registry: ${key}`);
    }
    
    await apiSetHelperValue(this.hass, definition.entity_id, value);
    
    // Update cache immediately (will be confirmed by state change event)
    this._valueCache.set(key, value);
  }
  
  /**
   * Check if a helper exists in Home Assistant
   *
   * @param {string} key - Registry key
   * @returns {boolean} True if helper exists
   */
  helperExists(key) {
    const definition = getHelperDefinition(key);
    if (!definition) {
      return false;
    }
    
    if (!this.hass) {
      return false;
    }
    
    return apiHelperExists(this.hass, definition.entity_id);
  }
  
  // ===== PUBLIC API: REACTIVITY =====
  
  /**
   * Subscribe to helper state changes
   *
   * @param {string} key - Registry key
   * @param {Function} callback - Callback function (newValue, oldValue) => void
   * @returns {Function} Unsubscribe function
   */
  subscribeToHelper(key, callback) {
    if (!this._subscriptions.has(key)) {
      this._subscriptions.set(key, []);
    }
    
    const callbacks = this._subscriptions.get(key);
    callbacks.push(callback);
    
    lcardsLog.debug(`[HelperManager] Subscribed to helper: ${key}`);
    
    // Return unsubscribe function
    return () => {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
      
      // Clean up empty subscription arrays
      if (callbacks.length === 0) {
        this._subscriptions.delete(key);
      }
    };
  }
  
  /**
   * Unsubscribe from helper state changes
   *
   * @param {string} key - Registry key
   */
  unsubscribeFromHelper(key) {
    this._subscriptions.delete(key);
  }
  
  // ===== PUBLIC API: INTEGRATION =====
  
  /**
   * Resolve helper bindings in a config object
   * Future use for card schema integration
   *
   * @param {Object} config - Card configuration
   * @param {Object} bindings - Helper bindings map { configKey: helperKey }
   * @returns {Object} Config with resolved helper values
   */
  resolveHelperBindings(config, bindings) {
    const resolved = { ...config };
    
    for (const [configKey, helperKey] of Object.entries(bindings)) {
      const value = this.getHelperValue(helperKey);
      if (value !== null) {
        resolved[configKey] = value;
      }
    }
    
    return resolved;
  }
  
  // ===== PUBLIC API: EXPORT =====
  
  /**
   * Generate YAML configuration for helpers
   *
   * @param {string} [category=null] - Optional category filter
   * @returns {string} YAML configuration
   */
  generateYAML(category = null) {
    return generateHelpersYAML(category);
  }
  
  /**
   * Get helpers by category
   *
   * @param {string} category - Category name
   * @returns {Array<Object>} Helper definitions
   */
  getHelpersByCategory(category) {
    return getHelpersByCategory(category);
  }
  
  /**
   * Get all helper definitions
   *
   * @returns {Array<Object>} All helper definitions with keys
   */
  getAllHelpers() {
    return getAllHelpers();
  }
  
  /**
   * Cleanup - unsubscribe from all state listeners
   */
  destroy() {
    lcardsLog.debug('[HelperManager] Destroying service, cleaning up subscriptions');
    
    // Unsubscribe from all state listeners
    for (const [key, unsubscribe] of this._stateUnsubscribers.entries()) {
      try {
        unsubscribe();
      } catch (error) {
        lcardsLog.error(`[HelperManager] Error unsubscribing from ${key}:`, error);
      }
    }
    
    this._stateUnsubscribers.clear();
    this._subscriptions.clear();
    this._valueCache.clear();
  }
}
