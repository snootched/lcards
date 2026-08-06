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

    /** @type {boolean} Track if auto-switch has been initialized */
    this._autoSwitchInitialized = false;

    /**
     * True until the "apply current alert mode on load" check has either
     * succeeded or become moot (auto-switch disabled, or a real alert_mode
     * change already fired via the regular subscription). While true,
     * _updateValueCache() re-checks on every subsequent HASS update — not
     * just the fixed-delay timed retries — so a slow HA startup (input_select
     * restoring its persisted value later than expected) still recovers
     * instead of being stuck on the wrong/default alert-mode CSS wash.
     * @type {boolean}
     */
    this._initialAlertModePending = false;

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
    this.hass = hass;

    // Only setup auto-switch once when HASS is available
    if (hass && !this._autoSwitchInitialized) {
      lcardsLog.debug('[HelperManager] HASS instance set, manager ready');
      this._setupStateListeners();
      this._setupAlertModeAutoSwitch();
      this._autoSwitchInitialized = true;
    } else if (hass) {
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

    // Fallback for the initial "apply current alert mode on load" check — the
    // fixed-delay retry loop in _setupAlertModeAutoSwitch() may give up before
    // HA has finished restoring input_select.lcards_alert_mode's real value
    // (observed to take longer than its ~3.3s budget on instances with many
    // integrations/custom cards). Re-check on every subsequent HASS update
    // instead: unbounded, but self-terminating and naturally rate-limited by
    // how often HA actually pushes updates.
    if (this._initialAlertModePending) {
      this._checkAndApplyInitialAlertMode();
    }
  }

  /**
   * Setup automatic alert mode switching based on helper values
   * Monitors alert_mode_auto_switch and alert_mode helpers
   * @private
   */
  _setupAlertModeAutoSwitch() {
    lcardsLog.debug('[HelperManager] Setting up alert mode auto-switch');

    // Subscribe to alert mode changes — always apply theme when the input_select changes.
    // auto_switch toggle no longer gates this; it is reserved for future HA automation use.
    this.subscribeToHelper('alert_mode', (newMode, oldMode) => {
      lcardsLog.info(`[HelperManager] Alert mode changed to: ${newMode}`);

      // A real change event means the entity has already settled — the
      // initial-load check (timed retries + per-HASS-update fallback) is moot.
      this._initialAlertModePending = false;

      // Guard: if ThemeManager already applied this mode it means window.lcards.setAlertMode
      // fired first and synced the helper itself — don't run the transition a second time.
      const alreadyApplied = window.lcards?.core?.themeManager?.getAlertMode?.() === newMode;
      if (alreadyApplied) {
        lcardsLog.debug('[HelperManager] Alert mode already applied by ThemeManager — skipping duplicate call');
        return;
      }

      // Ensure HASS is available (critical for green_alert)
      if (this.hass && window.lcards?.core) {
        window.lcards.core.ingestHass(this.hass);
      }

      if (window.lcards?.setAlertMode) {
        window.lcards.setAlertMode(newMode).catch(error => {
          lcardsLog.error('[HelperManager] Failed to apply alert mode:', error);
        });
      } else {
        lcardsLog.warn('[HelperManager] window.lcards.setAlertMode not available');
      }
    });

    // Also subscribe to auto_switch toggle to apply current mode when enabled
    this.subscribeToHelper('alert_mode_auto_switch', (newValue, oldValue) => {
      if ((newValue === 'on' || newValue === true) && (oldValue === 'off' || oldValue === false)) {
        // Auto-switch just got enabled - apply current alert mode
        const currentMode = this.getHelperValue('alert_mode');
        lcardsLog.info(`[HelperManager] Auto-switch enabled, applying current mode: ${currentMode}`);

        // Ensure HASS is available (critical for green_alert)
        if (this.hass && window.lcards?.core) {
          window.lcards.core.ingestHass(this.hass);
        }

        if (window.lcards?.setAlertMode) {
          window.lcards.setAlertMode(currentMode).catch(error => {
            lcardsLog.error('[HelperManager] Failed to apply current alert mode:', error);
          });
        }
      }
    });

    // Initial check: If auto-switch is already enabled on startup, apply current mode.
    //
    // HA input_select entities can briefly report a transient/non-LCARdS state (e.g. 'off')
    // during early boot before the persisted value is loaded.  We use a timed retry loop
    // with increasing delays (100 ms → 750 ms → 2 500 ms) to catch the common case quickly,
    // backstopped by _checkAndApplyInitialAlertMode() also being called from
    // _updateValueCache() on every subsequent HASS update (see _initialAlertModePending)
    // in case HA takes longer than that to settle.
    this._initialAlertModePending = true;

    const _RETRY_DELAYS = [100, 750, 2500];
    const _tryApplyInitialAlertMode = (attempt = 0) => {
      setTimeout(() => {
        if (!this._initialAlertModePending) return; // already handled elsewhere
        lcardsLog.debug(`[HelperManager] Checking initial alert mode state (timed attempt ${attempt + 1}/${_RETRY_DELAYS.length})...`);
        this._checkAndApplyInitialAlertMode();
        if (this._initialAlertModePending && attempt + 1 < _RETRY_DELAYS.length) {
          _tryApplyInitialAlertMode(attempt + 1);
        }
      }, _RETRY_DELAYS[attempt]);
    };

    _tryApplyInitialAlertMode(0);
  }

  /**
   * Check whether auto-switch is enabled and the current alert mode is a
   * recognised value; if so, apply it (skipping the transition, since
   * there's nothing on screen yet to transition from) and clear
   * _initialAlertModePending. No-ops if the check has already succeeded or
   * become moot. Called by the timed retry loop in _setupAlertModeAutoSwitch()
   * and, as a backstop, from _updateValueCache() on every subsequent HASS
   * update — so a slow HA startup still recovers even after the timed
   * retries are exhausted.
   * @private
   */
  _checkAndApplyInitialAlertMode() {
    if (!this._initialAlertModePending) return;

    // Read directly from HASS state (cached values may not be populated yet)
    const autoSwitchEntity = this.hass?.states['input_boolean.lcards_alert_mode_auto_switch'];
    const modeEntity       = this.hass?.states['input_select.lcards_alert_mode'];

    const autoSwitchEnabled = autoSwitchEntity?.state;
    const currentMode       = modeEntity?.state;

    if (!(autoSwitchEnabled === 'on' || autoSwitchEnabled === true)) {
      lcardsLog.debug('[HelperManager] Auto-switch not enabled — skipping initial alert mode application');
      this._initialAlertModePending = false;
      return;
    }

    if (!currentMode) {
      lcardsLog.debug('[HelperManager] No current mode set yet — will keep checking');
      return;
    }

    const _VALID_ALERT_MODES = ['green_alert', 'red_alert', 'yellow_alert', 'blue_alert', 'gray_alert', 'black_alert'];
    if (!_VALID_ALERT_MODES.includes(currentMode)) {
      lcardsLog.debug(`[HelperManager] Initial alert mode '${currentMode}' is not yet a recognised LCARdS mode (transient HA state?) — will keep checking`);
      return;
    }

    this._initialAlertModePending = false;
    lcardsLog.info(`[HelperManager] ✓ Auto-switch enabled on initial load, applying mode: ${currentMode}`);

    // Ensure HASS is available (critical for green_alert)
    if (this.hass && window.lcards?.core) {
      window.lcards.core.ingestHass(this.hass);
    }

    if (window.lcards?.setAlertMode) {
      lcardsLog.info(`[HelperManager] Calling setAlertMode('${currentMode}') on initial load (no transition)`);
      // Skip transition on initial load — there is nothing visible to transition from.
      window.lcards.setAlertMode(currentMode, { skipTransition: true }).catch(error => {
        lcardsLog.error('[HelperManager] Failed to apply initial alert mode:', error);
      });
    } else {
      lcardsLog.warn('[HelperManager] window.lcards.setAlertMode not yet available on initial load');
    }
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

    // Verify API availability first
    const { verifyHelperAPIAvailable } = await import('./lcards-helper-api.js');
    const apiAvailable = await verifyHelperAPIAvailable(this.hass);

    if (!apiAvailable) {
      lcardsLog.warn('[HelperManager] Helper API may not be available, attempting anyway...');
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
        // Delegate to this.ensureHelper so default values are set on creation
        const result = await this.ensureHelper(helper.key);

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

    // Helpers with ws_create_params === null cannot be created via the API
    // (e.g. template sensors — must be configured manually in configuration.yaml)
    if (definition.ws_create_params === null) {
      lcardsLog.debug(`[HelperManager] Skipping non-creatable helper: ${key} (${definition.entity_id})`);
      return {
        exists: apiHelperExists(this.hass, definition.entity_id),
        created: false,
        skipped: true,
        entity_id: definition.entity_id
      };
    }

    const result = await ensureHelper(this.hass, definition);

    // Set the registry default_value whenever a helper is freshly created
    if (result.created && definition.default_value !== undefined && definition.default_value !== null) {
      try {
        // Small delay to let HA register the entity before we write to it
        await new Promise(resolve => setTimeout(resolve, 300));
        await apiSetHelperValue(this.hass, definition.entity_id, definition.default_value);
        lcardsLog.info(`[HelperManager] Set default value for new helper ${key}: ${definition.default_value}`);
      } catch (error) {
        lcardsLog.warn(`[HelperManager] Could not set default value for ${key}:`, error);
      }
    }

    return result;
  }

  /**
   * Reset all helpers in a category (or all helpers) to their registry default values.
   * Only affects helpers that already exist in Home Assistant.
   *
   * @param {string|null} category - Category name, or null to reset all
   * @returns {Promise<{success: number, failed: number, skipped: number}>}
   */
  async resetCategoryToDefaults(category = null) {
    if (!this.hass) {
      throw new Error('[HelperManager] Cannot reset helpers - HASS not available');
    }

    const helpers = category ? getHelpersByCategory(category) : getAllHelpers();
    const results = { success: 0, failed: 0, skipped: 0 };

    for (const helper of helpers) {
      // Skip helpers that don't exist yet
      if (!apiHelperExists(this.hass, helper.entity_id)) {
        results.skipped++;
        continue;
      }

      // Skip helpers with no defined default
      if (helper.default_value === undefined || helper.default_value === null) {
        results.skipped++;
        continue;
      }

      // Skip helpers opted out of bulk category resets (e.g. the active sound
      // scheme selection, which shouldn't be muted as a side effect of
      // resetting volume/toggles in the same category)
      if (helper.excludeFromBulkReset) {
        results.skipped++;
        continue;
      }

      try {
        await apiSetHelperValue(this.hass, helper.entity_id, helper.default_value);
        this._valueCache.set(helper.key, helper.default_value);
        lcardsLog.debug(`[HelperManager] Reset ${helper.key} -> ${helper.default_value}`);
        results.success++;
      } catch (error) {
        lcardsLog.error(`[HelperManager] Failed to reset ${helper.key}:`, error);
        results.failed++;
      }
    }

    lcardsLog.info(`[HelperManager] Reset complete: ${results.success} reset, ${results.skipped} skipped, ${results.failed} failed`);
    return results;
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

    // Try cache first (populated by state-change events and explicit setHelperValue calls)
    if (this._valueCache.has(key)) {
      return this._valueCache.get(key);
    }

    // Not yet in cache — read live from hass.states without caching.
    // Caching a fallback read would store default_value (boolean) when the entity doesn't
    // exist yet, and that stale boolean then persists past the first state-change event.
    if (this.hass) {
      return apiGetHelperValue(this.hass, definition.entity_id, definition.default_value);
    }

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

    // Update cache immediately (will be confirmed by state change event).
    // Normalize input_boolean values to entity state strings so cache is consistent
    // with what _handleStateChange stores — avoids !== 'off' checks returning wrong result.
    const cacheVal = definition.domain === 'input_boolean'
        ? ((value === true || value === 'on' || value === 1) ? 'on' : 'off')
        : value;
    this._valueCache.set(key, cacheVal);
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
   * Update the options list of an input_select helper.
   * Used by SoundManager to sync sound scheme options after packs load.
   * Non-fatal if helper doesn't exist yet.
   *
   * Uses the documented `input_select.set_options` HA service rather than
   * the undocumented WebSocket API for reliability across HA versions.
   *
   * HA's set_options resets the current value to the first option, so we
   * restore it afterwards if it's present in the new options list.
   *
   * @param {string} key - Helper registry key (e.g., 'sound_scheme')
   * @param {string[]} options - New options list
   * @param {string} [preferredValue] - Value to restore/ensure selected after
   *   the options update, if present in `options`. Defaults to the entity's
   *   current live value. Pass this explicitly when the caller may sync in
   *   multiple waves with an initially-incomplete `options` list (e.g. a
   *   scheme registered after an earlier wave's set_options call has already
   *   reset the live value to options[0]) — the live value can no longer be
   *   trusted as "what the user actually selected" once that's happened.
   * @returns {Promise<{optionsUpdated: boolean, restored: boolean}>}
   *   `restored` is false if a restore was needed but every retry failed —
   *   callers should not treat that as "fully synced" (the entity is left at
   *   options[0], not the intended value) and should try again later.
   */
  async updateSelectOptions(key, options, preferredValue) {
    if (!this.hass) return { optionsUpdated: false, restored: false };

    const definition = getHelperDefinition(key);
    if (!definition || definition.domain !== 'input_select') {
      lcardsLog.warn(`[HelperManager] updateSelectOptions: ${key} is not an input_select`);
      return { optionsUpdated: false, restored: false };
    }

    if (!this.helperExists(key)) {
      lcardsLog.debug(`[HelperManager] updateSelectOptions: helper ${key} does not exist yet`);
      return { optionsUpdated: false, restored: false };
    }

    // Snapshot the hass reference and current value before any async work.
    // this.hass can be replaced by a HASS update between the two callService awaits,
    // so we pin both once and use the snapshot throughout.
    const hass = this.hass;
    const entityState = hass.states?.[definition.entity_id];
    const currentValue = entityState?.state;
    const currentOptions = entityState?.attributes?.options;
    const restoreTarget = preferredValue ?? currentValue;

    // Skip the options update if the list is already correct — but still check
    // whether the live value needs restoring, in case an earlier sync wave's
    // restore attempt couldn't find `restoreTarget` in an incomplete options
    // list at the time and it's only just become valid.
    const alreadyMatches = Array.isArray(currentOptions) &&
      currentOptions.length === options.length &&
      options.every((o, i) => currentOptions[i] === o);
    if (alreadyMatches) {
      let restored = true;
      if (restoreTarget && restoreTarget !== currentValue && options.includes(restoreTarget)) {
        restored = await this._selectOptionWithRetry(hass, definition.entity_id, restoreTarget, key);
      }
      lcardsLog.debug(`[HelperManager] ${key} options already match — skipping options update`);
      return { optionsUpdated: true, restored };
    }

    try {
      await hass.callService('input_select', 'set_options', {
        entity_id: definition.entity_id,
        options: options
      });
      lcardsLog.debug(`[HelperManager] Updated ${key} options:`, options);

      // Restore the target selection if it's a valid option
      let restored = true;
      if (restoreTarget && options.includes(restoreTarget)) {
        restored = await this._selectOptionWithRetry(hass, definition.entity_id, restoreTarget, key);
      }

      return { optionsUpdated: true, restored };
    } catch (e) {
      lcardsLog.warn(`[HelperManager] Failed to update ${key} options:`, e.message);
      return { optionsUpdated: false, restored: false };
    }
  }

  /**
   * Select an input_select option, retrying on transient failures instead of
   * giving up after one try. `set_options` (the caller's usual preceding step)
   * always resets the entity's value to its first option, so a failed restore
   * here — e.g. a brief WS hiccup — would otherwise leave the entity silently
   * stuck at that first option indefinitely, with no automatic recovery.
   * @param {Object} hass
   * @param {string} entityId
   * @param {string} option
   * @param {string} logKey - Helper registry key, for log messages only
   * @returns {Promise<boolean>} True if the option was successfully selected
   * @private
   */
  async _selectOptionWithRetry(hass, entityId, option, logKey) {
    const RETRY_DELAYS = [0, 400, 1200];
    for (let attempt = 0; attempt < RETRY_DELAYS.length; attempt++) {
      if (RETRY_DELAYS[attempt] > 0) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt]));
      }
      try {
        await hass.callService('input_select', 'select_option', {
          entity_id: entityId,
          option
        });
        lcardsLog.debug(`[HelperManager] Restored ${logKey} selection: ${option}`);
        return true;
      } catch (restoreErr) {
        lcardsLog.warn(`[HelperManager] Failed to restore ${logKey} selection (attempt ${attempt + 1}/${RETRY_DELAYS.length}):`, restoreErr.message);
      }
    }
    return false;
  }

  /**
   * Get debug information about the helper manager state
   * @returns {Object} Debug information
   */
  getDebugInfo() {
    return {
      type: 'HelperManager',
      subscriptionsCount: this._subscriptions?.size || 0,
      stateListeners: this._stateUnsubscribers?.size || 0,
      cachedValues: this._valueCache?.size || 0,
      autoSwitchInitialized: this._autoSwitchInitialized || false
    };
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
