import { lcardsLog } from '../../utils/lcards-logging.js';
import { haFormatNumber } from '../../utils/ha-entity-display.js';

/**
 * [DataSource] Data source implementation - provides real-time Home Assistant entity subscriptions
 * 📈 Features coalescing/throttling, history preload, rolling buffer management, and unified processing pipeline
 */

import { RollingBuffer } from './RollingBuffer.js';
import { ProcessorManager } from './ProcessorManager.js';

// Node.js polyfills for test environment
const isNode = typeof window === 'undefined';
const requestAnimationFrame = isNode
  ? (callback) => setTimeout(callback, 16) // 60fps approximation
  : window.requestAnimationFrame;
const cancelAnimationFrame = isNode
  ? (id) => clearTimeout(id)
  : window.cancelAnimationFrame;

export class DataSource {
  /**
   * Create a new DataSource for a Home Assistant entity
   * @param {object} cfg - DataSource configuration
   * @param {string} cfg.entity - Entity ID to monitor
   * @param {number} [cfg.windowSeconds=60] - Rolling window size in seconds
   * @param {number} [cfg.minEmitMs=100] - Minimum time between emits
   * @param {number} [cfg.sampleMs] - Alias for minEmitMs (legacy)
   * @param {number} [cfg.coalesceMs] - Coalescing window for rapid updates
   * @param {number} [cfg.maxDelayMs] - Maximum delay before forced emit
   * @param {boolean} [cfg.emitOnSameValue=true] - Emit even when value unchanged
   * @param {Object} [cfg.processing] - Processor configuration
   * @param {Object} [cfg.history] - History preload configuration
   * @param {Object} [cfg.metadata] - Metadata overrides
   * @param {Object} hass - Home Assistant connection object
   */
  constructor(cfg, hass) {
    this.cfg = /** @type {any} */ ({ ...cfg });
    this.hass = hass;

    // Validate essential config
    if (!this.cfg.entity) {
      lcardsLog.debug('[DataSource] ⚠️ No entity specified in config');
      this.cfg.entity = '';
    }

    // This allows expressions to access entity attributes
    this._lastOriginalState = null;

    // PORT: Complete buffer sizing logic from original
    let wsSec = 60; // Default window
    if (typeof cfg.windowSeconds === 'number' && isFinite(cfg.windowSeconds)) {
      wsSec = Math.max(1, cfg.windowSeconds);
    } else if (typeof cfg.windowSeconds === 'string') {
      const ms = this._parseTimeWindowMs(cfg.windowSeconds);
      if (Number.isFinite(ms)) {
        wsSec = Math.max(1, Math.floor(ms / 1000));
      }
    }

    // Buffer capacity: aim for ~10 points per second for the window
    const capacity = Math.max(60, Math.floor(wsSec * 10));
    this.buffer = new RollingBuffer(capacity);

    // PORT: Complete timing configuration from original - MADE MORE AGGRESSIVE
    const minEmitMs = Number.isFinite(cfg.minEmitMs) ? cfg.minEmitMs
      : Number.isFinite(cfg.sampleMs) ? cfg.sampleMs : 100;

    this.minEmitMs = Math.max(10, minEmitMs);

    // MORE AGGRESSIVE coalescing by default
    this.coalesceMs = Number.isFinite(cfg.coalesceMs)
      ? Math.max(20, cfg.coalesceMs)  // Reduced from 30 to 20
      : Math.max(20, Math.round(this.minEmitMs * 0.4));  // Reduced from 0.6 to 0.4

    this.maxDelayMs = Number.isFinite(cfg.maxDelayMs)
      ? Math.max(this.minEmitMs, cfg.maxDelayMs)
      : Math.max(this.minEmitMs, this.coalesceMs * 3);  // Reduced from 4 to 3

    this.emitOnSameValue = cfg.emitOnSameValue !== false; // Default true

    // Subscription management
    this.subscribers = new Set();
    this.haUnsubscribe = null;

    // REFACTORED: Unified processor manager (replaces transformations/aggregations split)
    this.processorManager = null; // Will be initialized in _initializeProcessors()

    // PORT: Complete internal timing state from original
    this._lastEmitTime = 0;
    this._lastEmittedValue = null;
    /** @type {any} */
    this._pendingRaf = 0;
    this._pending = false;
    this._pendingFirstTs = 0;
    this._pendingCount = 0;

    // Performance statistics
    this._stats = {
      emits: 0,
      coalesced: 0,
      skipsSameValue: 0,
      received: 0,
      invalid: 0,
      historyLoaded: 0
    };

    // Lifecycle state
    this._started = false;
    this._destroyed = false;

    // ✅ NEW: Periodic update timer for time-based aggregations
    this._periodicUpdateInterval = null;
    this._periodicUpdateEnabled = false;

    // ✅ NEW: Entity metadata storage
    this.metadata = {
      unit_of_measurement: null,
      device_class: null,
      friendly_name: null,
      area: null,
      device_id: null,
      entity_id: this.cfg.entity,
      state_class: null,
      icon: null,
      last_changed: null,
      last_updated: null
    };

    // ✅ NEW: Apply config-level metadata overrides if provided
    if (cfg.metadata) {
      this._applyMetadataOverrides(cfg.metadata);
    }

    // Initialize processors from configuration (including profiles)
    this._initializeProcessors(cfg);
  }

  /**
   * Initialize unified processor pipeline from configuration
   * @private
   * @param {Object} cfg - Data source configuration
   */
  _initializeProcessors(cfg) {
    // BREAKING CHANGE: Reject old transformations/aggregations format
    if (cfg.transformations || cfg.aggregations) {
      const errorMsg = (
        '❌ DataSource config uses deprecated "transformations" or "aggregations" fields. ' +
        'These have been replaced with a unified "processing" field. Migration required:\n' +
        '  OLD: transformations: { ... }, aggregations: { ... }\n' +
        '  NEW: processing: { processor_name: { type: "...", ... } }\n' +
        'See documentation for migration guide.'
      );
      lcardsLog.error(`[DataSource] ${errorMsg}`);
      throw new Error(errorMsg);
    }

    // Initialize ProcessorManager with new processing config
    if (cfg.processing) {
      try {
        this.processorManager = new ProcessorManager(this, cfg.processing);
        this.processorManager.initialize(cfg.processing, this.buffer);
        lcardsLog.debug(
          `[DataSource] ✓ Initialized ProcessorManager with ${Object.keys(cfg.processing).length} processors`
        );
      } catch (error) {
        lcardsLog.error('[DataSource] ❌ Failed to initialize ProcessorManager:', error);
        throw error;
      }
    } else {
      // No processing configured - create empty manager
      this.processorManager = new ProcessorManager(this, {});
      this.processorManager.initialize({}, this.buffer);
      lcardsLog.trace('[DataSource] No processing configured');
    }
  }

  /**
   * Getter for backward compatibility - redirects to ProcessorManager
   * @deprecated Use this.processorManager.processors instead
   */
  get transformations() {
    return this.processorManager ? this.processorManager.processors : new Map();
  }

  /**
   * Getter for backward compatibility - redirects to ProcessorManager
   * @deprecated Use this.processorManager.processors instead
   */
  get aggregations() {
    return this.processorManager ? this.processorManager.processors : new Map();
  }

  /**
   * Getter for backward compatibility - redirects to ProcessorManager
   * Provides unified access to all processors
   */
  get processing() {
    return this.processorManager ? this.processorManager.processors : new Map();
  }

  /**
   * Start the data source with proper initialization sequence
   * @returns {Promise} Resolves when fully initialized
   */
  async start() {
    if (this._started || this._destroyed) return;

    try {
      lcardsLog.trace(`[DataSource] 🚀 Starting initialization for ${this.cfg.entity}`);

      // STEP 1: Preload historical data FIRST
      if (this.hass?.callService) {
        await this._preloadHistory();
      }

      // STEP 2: Initialize with current HASS state if available
      if (this.hass.states && this.hass.states[this.cfg.entity]) {
        const currentState = this.hass.states[this.cfg.entity];

        // ✅ NEW: Extract metadata from initial state
        this._extractMetadata(currentState);

        lcardsLog.trace(`[DataSource] 🔄 Loading initial state for ${this.cfg.entity}:`, currentState.state);

      // ENHANCED: Capture unit_of_measurement from initial state
      if (currentState.attributes?.unit_of_measurement) {
        this.cfg.unit_of_measurement = currentState.attributes.unit_of_measurement;
        lcardsLog.trace(`[DataSource] 📊 Captured initial unit_of_measurement for ${this.cfg.entity}: "${this.cfg.unit_of_measurement}"`);
      }

      // FIXED: Use current timestamp for initial state
      const currentTimestamp = Date.now();
      const rawValue = this.cfg.attribute ? currentState.attributes?.[this.cfg.attribute] : currentState.state;
      const value = this._toNumber(rawValue);

      if (value !== null) {
        lcardsLog.trace(`[DataSource] Adding current state: ${value} at ${currentTimestamp}`);
        this.buffer.push(currentTimestamp, value);
        this._stats.currentValue = value;

        // REFACTORED: Process initial value through unified processor pipeline
        if (this.processorManager) {
          try {
            this.processorManager.process(value, currentTimestamp, this.buffer);
          } catch (error) {
            lcardsLog.warn('[DataSource] Processor pipeline failed for initial state:', error);
          }
        }
      }
    }

      // STEP 3: Setup real-time subscriptions
      this.haUnsubscribe = await this.hass.connection.subscribeEvents((event) => {
        if (event.event_type === 'state_changed' &&
            event.data?.entity_id === this.cfg.entity) {
          lcardsLog.trace(`[DataSource] 📊 HA event received for ${this.cfg.entity}:`, event.data.new_state?.state);
          this._handleStateChange(event.data);
        }
      }, 'state_changed');

      this._started = true;
      lcardsLog.trace(`[DataSource] ✅ Full initialization complete for ${this.cfg.entity} - Buffer: ${this.buffer.size()} points`);

      // Historical data is already processed via _processValue() when buffer was populated

      // STEP 5: Emit initial data to any existing subscribers
      this._emitInitialData();

      // ✅ NEW: STEP 6: Start periodic updates for time-based aggregations
      this._startPeriodicUpdates();

    } catch (error) {
      lcardsLog.error(`[DataSource] ❌ Failed to initialize ${this.cfg.entity}:`, error);
      throw error;
    }
  }

  /**
   * Start periodic updates for time-based aggregations
   * @private
   */
  _startPeriodicUpdates() {
    // Check if we have time-based processors via processorManager
    if (!this.processorManager) {
      return; // No processor manager, skip
    }

    // Check if any processors need periodic updates (e.g., duration processor)
    const hasTimeBased = Array.from(this.processorManager.processors.values()).some(proc =>
      proc.type === 'duration' || proc.config.requires_periodic_update
    );

    if (!hasTimeBased) {
      return; // No time-based processors, don't start timer
    }

    // Determine update interval (default 1 second for smooth time display)
    const updateInterval = this.cfg.periodic_update_interval || 1000;

    lcardsLog.debug(
      `[DataSource] 🕐 Starting periodic updates for ${this.cfg.entity} ` +
      `(interval: ${updateInterval}ms)`
    );

    this._periodicUpdateEnabled = true;
    this._periodicUpdateInterval = setInterval(() => {
      if (!this._periodicUpdateEnabled || this._destroyed) {
        this._stopPeriodicUpdates();
        return;
      }

      // Emit updated data to subscribers
      // Duration and other time-based processors will recalculate on next access
      const timestamp = Date.now();
      const lastValue = this.buffer.last()?.v;

      if (lastValue !== null && lastValue !== undefined) {
        const emitData = {
          t: timestamp,
          v: lastValue,
          buffer: this.buffer,
          stats: { ...this._stats },
          processing: this._getProcessingData(),
          entity: this.cfg.entity,
          unit_of_measurement: this.cfg.unit_of_measurement,
          historyReady: this._stats.historyLoaded > 0,
          isPeriodicUpdate: true
        };

        this.subscribers.forEach((callback) => {
          try {
            callback(emitData);
          } catch (error) {
            lcardsLog.error(`[DataSource] Periodic update callback failed:`, error);
          }
        });
      }
    }, updateInterval);
  }

  /**
   * Stop periodic updates
   * @private
   */
  _stopPeriodicUpdates() {
    if (this._periodicUpdateInterval) {
      clearInterval(this._periodicUpdateInterval);
      this._periodicUpdateInterval = null;
      this._periodicUpdateEnabled = false;
      lcardsLog.debug(`[DataSource] 🕐 Stopped periodic updates for ${this.cfg.entity}`);
    }
  }

  /**
   * NEW: Emit initial data to subscribers after full initialization
   * @private
   */
  _emitInitialData() {
    if (this.subscribers.size > 0) {
      const lastPoint = this.buffer.last();
      if (lastPoint) {
        lcardsLog.trace(`[DataSource] 📤 Emitting initial data for ${this.cfg.entity} to ${this.subscribers.size} subscribers`);
        const emitData = {
          t: lastPoint.t,
          v: lastPoint.v,
          buffer: this.buffer,
          stats: { ...this._stats },
          processing: this._getProcessingData(),  // REFACTORED: Unified processing // Convert Map to Object
          // (removed - now in processing)
          entity: this.cfg.entity,
          unit_of_measurement: this.cfg.unit_of_measurement,
          historyReady: this._stats.historyLoaded > 0,
          isInitialEmission: true // NEW: Flag to indicate this is initial data
        };

        this.subscribers.forEach(callback => {
          try {
            callback(emitData);
          } catch (error) {
            lcardsLog.error(`[DataSource] Initial callback error for ${this.cfg.entity}:`, error);
          }
        });
      } else {
        // Even if no buffer data, emit initial structure for consistency
        lcardsLog.trace(`[DataSource] 📤 Emitting initial empty data structure for ${this.cfg.entity} to ${this.subscribers.size} subscribers`);
        const emitData = {
          t: null,
          v: null,
          buffer: this.buffer,
          stats: { ...this._stats },
          processing: this._getProcessingData(),  // REFACTORED: Unified processing
          // (removed - now in processing)
          entity: this.cfg.entity,
          unit_of_measurement: this.cfg.unit_of_measurement,
          historyReady: this._stats.historyLoaded > 0,
          isInitialEmission: true
        };

        this.subscribers.forEach(callback => {
          try {
            callback(emitData);
          } catch (error) {
            lcardsLog.error(`[DataSource] Initial callback error for ${this.cfg.entity}:`, error);
          }
        });
      }
    }
  }

  /**
   * Preload historical data for the entity
   * Attempts statistics API first (faster), falls back to state history via WebSocket
   * @private
   * @async
   */
  async _preloadHistory() {
    if (!this.hass?.connection || !this.cfg.entity) {
      lcardsLog.warn('[DataSource] ⚠️ No HASS connection or entity for history preload');
      return;
    }

    const hours = Math.max(1, Math.min(168, this.cfg.history?.hours || 6)); // 1-168 hours
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - hours * 3600000);

    lcardsLog.trace(`[DataSource] 🔄 Preloading history for ${this.cfg.entity}`);

    try {
      // Use modern WebSocket call for statistics (preferred)
      const statisticsData = await this.hass.connection.sendMessagePromise({
        type: 'recorder/statistics_during_period',
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        statistic_ids: [this.cfg.entity],
        period: 'hour'
      });

      if (statisticsData && statisticsData[this.cfg.entity]) {
        const statistics = statisticsData[this.cfg.entity];
        lcardsLog.trace(`[DataSource] 📊 Got statistics points`,statistics);

        for (const stat of statistics) {
          const timestamp = new Date(stat.start).getTime();
          const value = this._extractStatisticValue(stat);

          if (value !== null) {
            this.buffer.push(timestamp, value);
            this._processValue(timestamp, value);
            this._stats.historyLoaded++;
          }
        }

        lcardsLog.trace(`[DataSource] ✅ Loaded statistics points`);
        return; // Success with statistics
      }
    } catch (error) {
      lcardsLog.warn('[DataSource] ⚠️ Statistics failed, trying state history:', error.message);
    }

    // Fallback: try state history via WebSocket
    await this._preloadStateHistoryWS(startTime, endTime);
  }

  /**
   * Preload history using WebSocket state_history API
   * @private
   * @async
   * @param {Date} startTime - Start time for history query
   * @param {Date} endTime - End time for history query
   */
  async _preloadStateHistoryWS(startTime, endTime) {
    try {
      lcardsLog.trace(`[DataSource] 📚 Trying WebSocket state history for ${this.cfg.entity}`);

      // Use modern WebSocket call for history
      const historyData = await this.hass.connection.sendMessagePromise({
        type: 'history/history_during_period',
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        entity_ids: [this.cfg.entity],
        minimal_response: true,
        no_attributes: true
      });

      if (historyData && historyData[0]) {
        const states = historyData[0];
        lcardsLog.trace(`[DataSource] 📊 Got history states`);

        for (const state of states) {
          const timestamp = new Date(state.last_changed || state.last_updated).getTime();

          // ✅ ENHANCED: Support nested attribute paths
          let rawValue;
          if (this.cfg.attribute_path) {
            rawValue = this._extractNestedAttribute(state.attributes, this.cfg.attribute_path);
          } else if (this.cfg.attribute) {
            rawValue = state.attributes?.[this.cfg.attribute];
          } else {
            rawValue = state.state;
          }

          const value = this._toNumber(rawValue);

          if (value !== null) {
            this.buffer.push(timestamp, value);
            this._processValue(timestamp, value);
            this._stats.historyLoaded++;
          }
        }

        lcardsLog.trace(`[DataSource] ✅ Loaded history points`);
      } else {
        // Debug only: Entity may not have history yet (new entity, HA just started, or history not enabled)
        lcardsLog.trace('[DataSource] No history data returned from WebSocket call (may be unavailable)');
      }
    } catch (error) {
      lcardsLog.error('[DataSource] ❌ WebSocket state history also failed:', error);

      // Final fallback: try direct REST API if available
      await this._preloadHistoryREST(startTime, endTime);
    }
  }

  /**
   * Preload history using REST API (fallback method)
   * @private
   * @async
   * @param {Date} startTime - Start time for history query
   * @param {Date} endTime - End time for history query
   */
  async _preloadHistoryREST(startTime, endTime) {
    try {
      lcardsLog.debug(`[DataSource] 🌐 Trying REST API history for ${this.cfg.entity}`);

      const startParam = startTime.toISOString();
      const url = `/api/history/period/${startParam}?filter_entity_id=${this.cfg.entity}&minimal_response&no_attributes`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.hass.auth?.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const historyData = await response.json();

      if (historyData && historyData[0]) {
        const states = historyData[0];
        lcardsLog.trace(`[DataSource] 📊 Got history states`);

        for (const state of states) {
          const timestamp = new Date(state.last_changed || state.last_updated).getTime();

          // ✅ ENHANCED: Support nested attribute paths
          let rawValue;
          if (this.cfg.attribute_path) {
            rawValue = this._extractNestedAttribute(state.attributes, this.cfg.attribute_path);
          } else if (this.cfg.attribute) {
            rawValue = state.attributes?.[this.cfg.attribute];
          } else {
            rawValue = state.state;
          }

          const value = this._toNumber(rawValue);

          if (value !== null) {
            this.buffer.push(timestamp, value);
            this._processValue(timestamp, value);
            this._stats.historyLoaded++;
          }
        }

        lcardsLog.trace(`[DataSource] ✅ Loaded history points`);
      }
    } catch (error) {
      lcardsLog.error('[DataSource] ❌ REST history fallback also failed:', error);
    }
  }

  /**
   * Handle state change from Home Assistant
   * @private
   * @param {Object} eventData - State change event data
   */
    // Enhanced _handleStateChange method
  _handleStateChange(eventData) {

    if (!eventData?.new_state || this._destroyed) {
      return;
    }

    // Safety check: ensure buffer exists and has required methods
    if (!this.buffer || typeof this.buffer.push !== 'function') {
      lcardsLog.error('[DataSource] ❌ Buffer not properly initialized for', this.cfg.entity);
      return;
    }

    // ✅ NEW: Update metadata on state changes (before storing original state)
    this._extractMetadata(eventData.new_state);

    // Store the original state object before any conversion
    this._lastOriginalState = eventData.new_state;

    // ENHANCED: Capture and store unit_of_measurement from the entity
    if (eventData.new_state.attributes?.unit_of_measurement) {
      this.cfg.unit_of_measurement = eventData.new_state.attributes.unit_of_measurement;
    }

    // FIXED: Use current timestamp instead of state timestamp
    const timestamp = Date.now();

    let rawValue;

    if (this.cfg.attribute_path) {
      // New nested path syntax
      rawValue = this._extractNestedAttribute(
        eventData.new_state.attributes,
        this.cfg.attribute_path
      );

      if (rawValue === null && this.cfg.debug) {
        lcardsLog.debug(
          `[DataSource] ${this.cfg.entity}: Nested attribute path "${this.cfg.attribute_path}" returned null`
        );
      }
    } else if (this.cfg.attribute) {
      // Legacy single attribute access
      rawValue = eventData.new_state.attributes?.[this.cfg.attribute];
    } else {
      // Entity state
      rawValue = eventData.new_state.state;
    }

    const value = this._toNumber(rawValue);

    if (value !== null) {
    // Store in raw buffer
    this.buffer.push(timestamp, value);

    // REFACTORED: Process through unified processor pipeline
    if (this.processorManager) {
      try {
        this.processorManager.process(value, timestamp, this.buffer);
      } catch (error) {
        lcardsLog.warn('[DataSource] Processor pipeline failed:', error);
      }
    }

    // Update statistics
    this._stats.updates++;
    this._stats.lastUpdate = timestamp;

      // Emit to subscribers
      lcardsLog.trace(`[DataSource] 📤 Emitting to subscribers:`, value);

      const emitData = {
        t: timestamp,
        v: value,
        buffer: this.buffer,
        stats: { ...this._stats },
        processing: this._getProcessingData(),  // REFACTORED: Unified processing
        entity: this.cfg.entity,
        unit_of_measurement: this.cfg.unit_of_measurement, // NEW: Include unit info
        historyReady: this._stats.historyLoaded > 0
      };

      this.subscribers.forEach((callback, index) => {
        try {
          callback(emitData);
        } catch (error) {
          lcardsLog.error(`[DataSource] ❌ Subscriber ${index} callback FAILED for ${this.cfg.entity}:`, error);
        }
      });
    } else {
      lcardsLog.debug(`[DataSource] ⚠️ Skipping state change - invalid value:`, { rawValue, entity: this.cfg.entity });
    }
  }

  /**
   * Update all configured aggregations with new data
   * @private
   * @param {number} timestamp - Current timestamp
   * @param {number} value - Raw value
   * @param {Object} transformedData - Transformed values from this update
   */
  /**
   * REFACTORED: Process value through unified processor pipeline
   * Replaces old _applyTransformations and _updateAggregations
   * @private
   */
  _processValue(timestamp, value) {
    if (this.processorManager) {
      try {
        this.processorManager.process(value, timestamp, this.buffer);
      } catch (error) {
        lcardsLog.warn('[DataSource] Processor pipeline failed:', error);
      }
    }
  }

  /**
   * Get current processing results from all processors
   * @private
   * @returns {Object} Current processing results
   */
  _getProcessingData() {
    if (!this.processorManager) {
      lcardsLog.trace('[DataSource] No processorManager, returning {}');
      return {};
    }

    const results = this.processorManager.getResults();
    lcardsLog.trace(`[DataSource] _getProcessingData() returning:`, results);
    return results;
  }

  /**
   * Enhanced debug method to show transformation and aggregation data
   * @returns {Object} Debug information including transformations and aggregations
   */
  getDebugInfo() {
    const currentData = this.getCurrentData();

    return {
      entity: this.cfg.entity,
      currentValue: currentData.v,
      timestamp: currentData.t ? new Date(currentData.t).toISOString() : null,
      bufferSize: this.buffer.size(),
      transformations: {
        count: this.transformations.size,
        data: currentData.transformations,
        processors: Array.from(this.transformations.keys())
      },
      aggregations: {
        count: this.aggregations.size,
        data: currentData.aggregations,
        processors: Array.from(this.aggregations.keys())
      },
      stats: currentData.stats
    };
  }

  /**
   * Check if we should emit data to subscribers based on timing and value rules
   */
  _shouldEmit(value, timestamp) {
    const now = Date.now();

    // Respect minimum emit interval
    if (this._lastEmitTime && (timestamp - this._lastEmitTime) < this.minEmitMs) {
      this._stats.coalesced++;
      return false;
    }

    // Skip if value hasn't changed (if configured)
    if (!this.emitOnSameValue && value === this._lastEmittedValue) {
      this._stats.skipsSameValue++;
      return false;
    }

    return true;
  }

  /**
   * Emit data to all subscribers
   */
  _emit(data) {
    const now = Date.now();
    this._lastEmitTime = now;
    this._lastEmittedValue = data.v;
    this._stats.emits++;

    lcardsLog.trace(`[DataSource] 📤 Emitting to subscribers:`, data.v);

    // Call all subscribers
    this.subscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        lcardsLog.warn(`[DataSource] ⚠️ Subscriber callback error:`, error);
      }
    });
  }

  /**
   * Subscribe to live state changes from Home Assistant via WebSocket
   * Sets up event subscription for the configured entity
   * @private
   * @async
   */
  async _subscribeLive() {
    if (!this.hass?.connection?.subscribeEvents || !this.cfg.entity) return;

    const entityId = this.cfg.entity;

    try {
      this.haUnsubscribe = await this.hass.connection.subscribeEvents((event) => {
        const newState = event?.data?.new_state;
        if (!newState || newState.entity_id !== entityId) return;

        const timestamp = new Date(newState.last_changed || newState.last_updated || Date.now()).getTime();
        const rawValue = this.cfg.attribute ? newState.attributes?.[this.cfg.attribute] : newState.state;
        const value = this._toNumber(rawValue);

        this._onRawEventValue(timestamp, value);
      }, 'state_changed');

    } catch (error) {
      lcardsLog.warn('[DataSource] ⚠️ Failed to subscribe to HA events:', error.message);
    }
  }

  /**
   * Handle raw event value with coalescing and throttling
   * Implements intelligent value change detection to reduce unnecessary updates
   * @private
   * @param {number} timestamp - Event timestamp in milliseconds
   * @param {number} value - Numeric value to process
   */
  _onRawEventValue(timestamp, value) {
    if (value === null) {
      this._stats.invalid++;
      return;
    }

    // ENHANCED: Check for rapid-fire identical values and skip some
    const now = isNode ? Date.now() : performance.now();

    // Store in buffer - buffer now handles its own coalescing
    this.buffer.push(timestamp, value);
    this._stats.received++;

    // FIXED: More aggressive coalescing logic for stress scenarios
    if (!this._pending) {
      this._pending = true;
      this._pendingFirstTs = now;
      this._pendingCount = 1;

      // For stress tests: delay first emission slightly to allow coalescing
      if (this._stats.received > 10) {
        // High-frequency scenario - be more patient
        setTimeout(() => this._ensureScheduleEmit(), 5);
      } else {
        // Normal scenario - immediate response for first subscription
        if (this.subscribers.size > 0 && this._stats.emits === 0) {
          this._emit();
        } else {
          this._ensureScheduleEmit();
        }
      }
    } else {
      this._pendingCount++;
      const timeSinceFirst = now - this._pendingFirstTs;

      if (timeSinceFirst >= this.coalesceMs) {
        // Coalescing window expired - emit and start new window
        this._emit();

        // Start fresh coalescing window
        this._pending = true;
        this._pendingFirstTs = now;
        this._pendingCount = 1;
        this._ensureScheduleEmit();
      } else {
        // Still within coalescing window - increment coalesced counter
        this._stats.coalesced++;
      }
    }
  }

  /**
   * Ensure an emit is scheduled on the next animation frame
   * Uses requestAnimationFrame for optimal timing
   * @private
   */
  _ensureScheduleEmit() {
    if (this._pendingRaf) return; // Already scheduled

    this._pendingRaf = requestAnimationFrame(() => {
      this._pendingRaf = 0;
      this._frameEmitCheck();
    });
  }

  /**
   * Check if pending data should be emitted based on timing constraints
   * Enforces minEmitMs, coalesceMs, and maxDelayMs policies
   * @private
   */
  _frameEmitCheck() {
    if (!this._pending || this._destroyed) return;

    const now = isNode ? Date.now() : performance.now();
    const timeSinceLastEmit = now - this._lastEmitTime;
    const timeSincePendingStart = now - this._pendingFirstTs;

    // Should we emit now?
    let shouldEmit = false;

    // Check minimum emit interval
    if (timeSinceLastEmit >= this.minEmitMs) {
      // Minimum time passed - check coalescing window
      if (timeSincePendingStart >= this.coalesceMs) {
        shouldEmit = true;
      }
    }

    // Max delay override - always emit if we've been pending too long
    if (timeSincePendingStart >= this.maxDelayMs) {
      shouldEmit = true;
    }

    if (shouldEmit) {
      this._emit();
    } else {
      // IMPROVED: More precise next check timing
      const untilMinEmit = Math.max(0, this.minEmitMs - timeSinceLastEmit);
      const untilCoalesce = Math.max(0, this.coalesceMs - timeSincePendingStart);
      const untilMaxDelay = Math.max(0, this.maxDelayMs - timeSincePendingStart);

      const nextCheck = Math.min(
        untilMinEmit || Infinity,
        untilCoalesce || Infinity,
        untilMaxDelay || Infinity
      );

      if (nextCheck < Infinity && nextCheck > 0) {
        setTimeout(() => {
          this._ensureScheduleEmit();
        }, Math.max(1, Math.min(50, nextCheck)));
      }
    }
  }

  /**
   * Subscribe to data source updates
   * Provides immediate hydration with current data if available
   * @param {Function} callback - Callback function to receive data updates
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    if (typeof callback !== 'function') {
      lcardsLog.warn('[DataSource] Subscribe requires a function callback');
      return () => {};
    }

    this.subscribers.add(callback);

    // Enhanced immediate hydration with current data
    const lastPoint = this.buffer.last();
    if (lastPoint) {
      try {
        const currentData = {
          t: lastPoint.t,
          v: lastPoint.v,
          buffer: this.buffer,
          stats: { ...this._stats },
          processing: this._getProcessingData(),  // REFACTORED: Unified processing // Convert Map to Object
          // (removed - now in processing)
          entity: this.cfg.entity,
          historyReady: this._stats.historyLoaded > 0
        };

        lcardsLog.debug(`[DataSource] Providing immediate hydration for new subscriber:`, {
          entity: this.cfg.entity,
          value: lastPoint.v,
          bufferSize: this.buffer.size(),
          timestamp: new Date(lastPoint.t).toISOString()
        });

        // Use setTimeout to avoid blocking the subscription
        setTimeout(() => {
          callback(currentData);
        }, 0);

      } catch (error) {
        lcardsLog.warn('[DataSource] Initial callback error:', error);
      }
    } else {
      lcardsLog.trace(`[DataSource] No data available for immediate hydration:`, {
        entity: this.cfg.entity,
        bufferSize: this.buffer.size(),
        started: this._started
      });
    }

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Subscribe to data source updates with overlay metadata tracking
   * Stores subscriber metadata for debugging and visualization
   * @param {Function} callback - Callback function to receive data updates
   * @param {Object} [metadata={}] - Optional metadata about the subscriber
   * @param {string} [metadata.overlayId] - ID of the subscribing overlay
   * @param {string} [metadata.overlayType] - Type of the subscribing overlay
   * @param {string} [metadata.component] - Component name of subscriber
   * @returns {Function} Unsubscribe function
   */
  subscribeWithMetadata(callback, metadata = {}) {
    if (typeof callback !== 'function') {
      lcardsLog.warn('[DataSource] Subscribe requires a function callback');
      return () => {};
    }

    // Store metadata on the callback function
    ;(/** @type {any} */ (callback))._subscriberMetadata = {
      overlayId: metadata.overlayId || 'unknown',
      overlayType: metadata.overlayType || 'unknown',
      component: metadata.component || 'unknown',
      subscribedAt: Date.now()
    };

    return this.subscribe(callback);
  }


  /**
   * Convert raw value to number with support for boolean states and enum mapping
   *
   * Handles:
   * - Numeric values and strings
   * - Boolean states (on/off, true/false, etc.)
   * - Enum mapping for categorical states (heating, cooling, etc.)
   * - Unavailable/unknown states
   *
   * @private
   * @param {*} raw - Raw value from HA state
   * @returns {number|null} Converted number or null if invalid
   */
  _toNumber(raw) {
    if (raw === null || raw === undefined) {
      return null;
    }

    // Handle numeric values
    if (typeof raw === 'number') {
      return isNaN(raw) ? null : raw;
    }

    // Handle string values
    if (typeof raw === 'string') {
      // ✅ ENHANCED DEBUG: Log what we're checking
      if (this.cfg.debug || this.cfg.enum_mapping_debug) {
        lcardsLog.debug(
          `[DataSource] ${this.cfg.entity}: _toNumber called with string: "${raw}"\n` +
          `  Has enum_mapping: ${!!this.cfg.enum_mapping}\n` +
          `  Enum mapping keys: ${this.cfg.enum_mapping ? Object.keys(this.cfg.enum_mapping).join(', ') : 'none'}`
        );
      }

      // Check enum_mapping first (before any other conversion)
      if (this.cfg.enum_mapping && typeof this.cfg.enum_mapping === 'object') {
        // ✅ ENHANCED DEBUG: Show the lookup attempt
        if (this.cfg.debug || this.cfg.enum_mapping_debug) {
          lcardsLog.debug(
            `[DataSource] ${this.cfg.entity}: Looking up "${raw}" in enum_mapping\n` +
            `  Found: ${this.cfg.enum_mapping[raw] !== undefined}\n` +
            `  Value: ${this.cfg.enum_mapping[raw]}`
          );
        }

        if (this.cfg.enum_mapping[raw] !== undefined) {
          const mappedValue = this.cfg.enum_mapping[raw];

          // Validate mapped value is numeric

          if (typeof mappedValue === 'number' && isFinite(mappedValue)) {
            lcardsLog.debug(
              `[DataSource] ${this.cfg.entity}: ✅ Enum mapping "${raw}" → ${mappedValue}`
            );
            return mappedValue;
          } else {
            lcardsLog.warn(
              `[DataSource] ${this.cfg.entity}: ❌ Invalid enum mapping value for "${raw}": ${mappedValue} (must be a number)`
            );
          }
        }
      }

      // Try direct numeric conversion
      const num = parseFloat(raw);
      if (!isNaN(num) && isFinite(num)) {
        return num;
      }

      // Handle boolean-like strings
      const lowerRaw = raw.toLowerCase().trim();
      if (lowerRaw === 'on' || lowerRaw === 'true' || lowerRaw === 'active' || lowerRaw === 'open') {
        if (this.cfg.debug || this.cfg.enum_mapping_debug) {
          lcardsLog.debug(`[DataSource] ${this.cfg.entity}: Boolean mapping "${raw}" → 1`);
        }
        return 1;
      }

      if (lowerRaw === 'off' || lowerRaw === 'false' || lowerRaw === 'inactive' || lowerRaw === 'closed') {
        if (this.cfg.debug || this.cfg.enum_mapping_debug) {
          lcardsLog.debug(`[DataSource] ${this.cfg.entity}: Boolean mapping "${raw}" → 0`);
        }
        return 0;
      }

      // Handle unavailable/unknown states
      if (lowerRaw === 'unavailable' || lowerRaw === 'unknown') {
        return null;
      }

      // Log unhandled strings
      if (this.cfg.debug || this.cfg.enum_mapping_debug) {
        lcardsLog.warn(
          `[DataSource] ${this.cfg.entity}: ⚠️ Unhandled string value: "${raw}" ` +
          `(consider adding to enum_mapping)`
        );
      }

      return null;
    }

    // Handle boolean values
    if (typeof raw === 'boolean') {
      return raw ? 1 : 0;
    }

    return null;
  }

  /**
   * Parse time window string to milliseconds
   * Supports formats: "60s", "5m", "2h", "1d"
   * @private
   * @param {string} windowStr - Time window string to parse
   * @returns {number} Milliseconds or NaN if invalid
   */
  _parseTimeWindowMs(windowStr) {
    if (typeof windowStr !== 'string') return NaN;

    const match = windowStr.match(/^(\d+(?:\.\d+)?)\s*(s|sec|m|min|h|hr|d|day)s?$/i);
    if (!match) return NaN;

    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase();

    switch (unit) {
      case 's':
      case 'sec':
        return value * 1000;
      case 'm':
      case 'min':
        return value * 60 * 1000;
      case 'h':
      case 'hr':
        return value * 60 * 60 * 1000;
      case 'd':
      case 'day':
        return value * 24 * 60 * 60 * 1000;
      default:
        return NaN;
    }
  }

  /**
   * Get performance statistics and configuration info
   * @returns {Object} Statistics including emits, coalesced events, config details
   */
  getStats() {
    return {
      ...this._stats,
      config: {
        entity: this.cfg.entity,
        windowSeconds: this.cfg.windowSeconds,
        minEmitMs: this.minEmitMs,
        coalesceMs: this.coalesceMs,
        maxDelayMs: this.maxDelayMs
      },
      buffer: this.buffer.getStats(),
      subscribers: this.subscribers.size,
      transformations: {
        size: this.transformations.size,
        keys: Array.from(this.transformations.keys())
      },
      aggregations: {
        size: this.aggregations.size,
        keys: Array.from(this.aggregations.keys())
      },
      state: {
        started: this._started,
        pending: this._pending,
        destroyed: this._destroyed
      }
    };
  }

  /**
   * Get information about all subscribers with overlay metadata
   * @returns {Array<Object>} Array of subscriber info objects with metadata
   */
  getSubscriberInfo() {
    return Array.from(this.subscribers).map((callback, index) => {
      // Check if callback has stored metadata
      const metadata = callback._subscriberMetadata;

      if (metadata) {
        return {
          id: metadata.overlayId,
          name: `${metadata.overlayType}_${metadata.overlayId}`,
          type: metadata.overlayType,
          component: metadata.component,
          subscribedAt: metadata.subscribedAt,
          index: index
        };
      }

      // Fallback to basic detection for callbacks without metadata
      const name = callback.name || 'anonymous';
      const isWrapped = callback.toString().includes('overlay') || callback.toString().includes('callback');

      return {
        id: `subscriber_${index}`,
        name: name === 'anonymous' && isWrapped ? 'overlay_callback' : name,
        type: 'function',
        component: 'unknown',
        index: index
      };
    });
  }

  /**
   * Get current data with enhanced metadata
   * @returns {Object|null} Current data object or null
   */
  getCurrentData() {
    const lastPoint = this.buffer.last();
    if (!lastPoint) {
      // Return minimal data structure even if no data points exist
      return {
        t: null,
        v: null,
        buffer: this.buffer,
        stats: { ...this._stats },
        processing: this._getProcessingData(),  // REFACTORED: Unified processing
        entity: this.cfg.entity,
        metadata: { ...this.metadata },
        historyReady: this._stats.historyLoaded > 0,
        bufferSize: 0,
        started: this._started
      };
    }

    return {
      t: lastPoint.t,
      v: lastPoint.v,
      buffer: this.buffer,
      stats: { ...this._stats },
      processing: this._getProcessingData(),  // REFACTORED: Unified processing
      entity: this.cfg.entity,
      metadata: { ...this.metadata },
      historyReady: this._stats.historyLoaded > 0,
      bufferSize: this.buffer.size(),
      started: this._started
    };
  }

  /**
   * Get entity metadata
   * @returns {Object} Entity metadata object
   */
  getMetadata() {
    return { ...this.metadata };
  }

  /**
   * Get formatted value with unit
   * @param {number} value - Value to format
   * @param {number} precision - Decimal places
   * @returns {string} Formatted value with unit
   */
  getFormattedValue(value, precision = 1) {
    if (!Number.isFinite(value)) return 'N/A';

    const formatted = haFormatNumber(this.hass, value, {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision
    });
    return this.metadata.unit_of_measurement
      ? `${formatted}${this.metadata.unit_of_measurement}`
      : formatted;
  }

  /**
   * Get display name (friendly_name or entity_id)
   * @returns {string} Display name
   */
  getDisplayName() {
    return this.metadata.friendly_name || this.cfg.entity;
  }

  /**
   * Get current value of a specific processor
   * @param {string} processorName - Name of the processor
   * @returns {*} Current processor value or undefined if not found
   */
  getProcessorData(processorName) {
    if (!this.processorManager) {
      lcardsLog.warn('[DataSource] No processorManager initialized');
      return undefined;
    }

    const results = this.processorManager.getResults();
    return results[processorName];
  }

  /**
   * Get RollingBuffer for a specific processor (for charting/history)
   * @param {string} processorName - Name of the processor
   * @returns {RollingBuffer|null} Processor buffer or null if not found
   */
  getProcessorBuffer(processorName) {
    if (!this.processorManager) {
      lcardsLog.warn('[DataSource] No processorManager initialized');
      return null;
    }

    return this.processorManager.getBuffer(processorName);
  }

  /**
   * Get historical data for a specific processor
   * @param {string} processorName - Name of the processor
   * @param {number} count - Number of recent points to get (default: 100)
   * @returns {Array} Historical processor data [{t, v}, ...] or empty array
   */
  // @ts-ignore - first definition; second definition below overrides at runtime
  getProcessorHistory(processorName, count = 100) {
    const buffer = this.getProcessorBuffer(processorName);
    if (!buffer) {
      lcardsLog.warn(`[DataSource] No buffer found for processor: ${processorName}`);
      return [];
    }

    try {
      return buffer.getRecent(count) || [];
    } catch (error) {
      lcardsLog.error(`[DataSource] Error getting history for processor ${processorName}:`, error);
      return [];
    }
  }

  /**
   * Stop the data source and release resources
   */
  async stop() {
    this._started = false;

    // ✅ NEW: Stop periodic updates
    this._stopPeriodicUpdates();

    if (this.haUnsubscribe) {
      try {
        this.haUnsubscribe();
      } catch (error) {
        lcardsLog.warn('[DataSource] ⚠️ HA unsubscribe error:', error);
      }
      this.haUnsubscribe = null;
    }

    if (this._pendingRaf) {
      cancelAnimationFrame(this._pendingRaf);
      this._pendingRaf = 0;
    }

    this._pending = false;
  }

  /**
   * Destroy the data source and clean up all resources
   * Stops periodic updates, unsubscribes from HA, clears subscribers and buffer
   */
  destroy() {
    this._destroyed = true;
    this._stopPeriodicUpdates();
    this.stop();
    this.subscribers.clear();
    this.buffer.clear();
  }

  /**
   * Extract numeric value from statistics API response
   * Tries various statistics fields (sum, mean, min, max, state)
   * @private
   * @param {Object} stat - Statistics object from HA API
   * @returns {number|null} Extracted numeric value or null
   */
  _extractStatisticValue(stat) {
    // Priority order for statistic values
    if (Number.isFinite(stat.mean)) return stat.mean;
    if (Number.isFinite(stat.state)) return stat.state;
    if (Number.isFinite(stat.sum)) return stat.sum;
    if (Number.isFinite(stat.max)) return stat.max;
    if (Number.isFinite(stat.min)) return stat.min;
    return null;
  }


  /**
   * Extract nested attribute value using dot notation and array indices
   *
   * Supports:
   * - Dot notation: "forecast.temperature"
   * - Array indices: "forecast.0.temperature" or "forecast[0].temperature"
   * - Mixed: "device.config[0].settings.enabled"
   *
   * @private
   * @param {Object} attributes - Entity attributes object
   * @param {string} path - Attribute path (e.g., "forecast.0.temperature")
   * @returns {*} Extracted value or null if not found
   */
  _extractNestedAttribute(attributes, path) {
    if (!attributes || !path) {
      return null;
    }

    try {
      // Normalize path: convert brackets to dots
      // "forecast[0].temperature" → "forecast.0.temperature"
      const normalizedPath = path.replace(/\[(\d+)\]/g, '.$1');

      // Split into path segments
      const segments = normalizedPath.split('.');

      // Traverse the object
      let current = attributes;

      for (const segment of segments) {
        if (current === null || current === undefined) {
          if (this.cfg.debug) {
            lcardsLog.debug(
              `[DataSource] ${this.cfg.entity}: Nested path traversal stopped at null/undefined for segment: ${segment}`
            );
          }
          return null;
        }

        // Check if segment is an array index
        const arrayIndex = parseInt(segment);
        if (!isNaN(arrayIndex)) {
          // Array access
          if (!Array.isArray(current)) {
            if (this.cfg.debug) {
              lcardsLog.debug(
                `[DataSource] ${this.cfg.entity}: Expected array at segment ${segment}, got ${typeof current}`
              );
            }
            return null;
          }

          if (arrayIndex < 0 || arrayIndex >= current.length) {
            if (this.cfg.debug) {
              lcardsLog.debug(
                `[DataSource] ${this.cfg.entity}: Array index ${arrayIndex} out of bounds (length: ${current.length})`
              );
            }
            return null;
          }

          current = current[arrayIndex];
        } else {
          // Object property access
          if (typeof current !== 'object') {
            if (this.cfg.debug) {
              lcardsLog.debug(
                `[DataSource] ${this.cfg.entity}: Expected object at segment ${segment}, got ${typeof current}`
              );
            }
            return null;
          }

          if (!(segment in current)) {
            if (this.cfg.debug) {
              lcardsLog.debug(
                `[DataSource] ${this.cfg.entity}: Property "${segment}" not found in object. Available: ${Object.keys(current).join(', ')}`
              );
            }
            return null;
          }

          current = current[segment];
        }
      }

      if (this.cfg.debug) {
        lcardsLog.debug(
          `[DataSource] ${this.cfg.entity}: Successfully extracted nested attribute "${path}": ${current}`
        );
      }

      return current;

    } catch (error) {
      lcardsLog.warn(
        `[DataSource] ${this.cfg.entity}: Error extracting nested attribute "${path}":`,
        error.message
      );
      return null;
    }
  }


  /**
   * Get recent points from the main buffer (compatibility method)
   * @param {number} count - Number of recent points to return
   * @returns {Array} Array of recent data points
   */
  getRecent(count = 100) {
    try {
      return this.buffer.getRecent(count) || [];
    } catch (error) {
      lcardsLog.warn('[DataSource] getRecent error:', error);
      return [];
    }
  }

  /**
   * Get historical data for a specific processor
   * @param {string} processorName - Name of the processor
   * @param {number} count - Number of recent points to get (default: 100)
   * @returns {Array} Historical processor data [{t, v}, ...] or empty array
   */
  // @ts-ignore - duplicate method; second definition overrides first at runtime
  getProcessorHistory(processorName, count = 100) {
    const buffer = this.getProcessorBuffer(processorName);
    if (!buffer) {
      lcardsLog.warn(`[DataSource] No buffer found for processor: ${processorName}`);
      return [];
    }

    try {
      return buffer.getRecent(count) || [];
    } catch (error) {
      lcardsLog.error(`[DataSource] Error getting history for processor ${processorName}:`, error);
      return [];
    }
  }

  /**
   * Apply user-provided metadata overrides from config
   * @param {Object} metadataConfig - Metadata overrides from datasource config
   */
  _applyMetadataOverrides(metadataConfig) {
    if (!metadataConfig || typeof metadataConfig !== 'object') return;

    // Track which properties have been explicitly set by user
    this._metadataOverrides = {};

    // Apply overrides for supported properties
    const supportedProperties = [
      'unit_of_measurement',
      'device_class',
      'friendly_name',
      'state_class',
      'icon',
      'area',
      'device_id'
    ];

    supportedProperties.forEach(prop => {
      if (metadataConfig.hasOwnProperty(prop)) {
        this.metadata[prop] = metadataConfig[prop];
        this._metadataOverrides[prop] = true; // Mark as user-overridden
        lcardsLog.trace(`[DataSource] Metadata override: ${prop} = ${metadataConfig[prop]}`);
      }
    });

    lcardsLog.debug(`[DataSource] Applied ${Object.keys(this._metadataOverrides).length} metadata overrides`);
  }

  /**
   * Extract metadata from entity state (respects user overrides)
   * @param {Object} entityState - HA entity state object
   */
  _extractMetadata(entityState) {
    if (!entityState) return;

    const attributes = entityState.attributes || {};

    // Core metadata - only extract if not overridden by config
    if (!this._metadataOverrides?.unit_of_measurement) {
      this.metadata.unit_of_measurement = attributes.unit_of_measurement || null;
    }
    if (!this._metadataOverrides?.device_class) {
      this.metadata.device_class = attributes.device_class || null;
    }
    if (!this._metadataOverrides?.friendly_name) {
      this.metadata.friendly_name = attributes.friendly_name || entityState.entity_id;
    }
    if (!this._metadataOverrides?.state_class) {
      this.metadata.state_class = attributes.state_class || null;
    }
    if (!this._metadataOverrides?.icon) {
      this.metadata.icon = attributes.icon || null;
    }

    // Device/area information (often useful for context)
    if (!this._metadataOverrides?.area && attributes.area_id) {
      this.metadata.area = attributes.area_id;
    }
    if (!this._metadataOverrides?.device_id && attributes.device_id) {
      this.metadata.device_id = attributes.device_id;
    }

    lcardsLog.trace(`[DataSource] Extracted metadata:`, {
      unit: this.metadata.unit_of_measurement,
      device_class: this.metadata.device_class,
      friendly_name: this.metadata.friendly_name
    });
  }


}
