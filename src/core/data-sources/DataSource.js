import { lcardsLog } from '../../utils/lcards-logging.js';
import { haFormatNumber } from '../../utils/ha-entity-display.js';

/**
 * [DataSource] Data source implementation - provides real-time Home Assistant entity subscriptions
 * 📈 Features emit throttling (min_emit_ms / coalesce_ms / max_delay_ms), history preload, rolling buffer management, and unified processing pipeline
 */

import { RollingBuffer } from './RollingBuffer.js';
import { fetchDataSourceHistory, historySettings } from './history-fetch.js';
import { ProcessorManager } from './ProcessorManager.js';
import { toNumericValue, normalizeAttribute } from './ha-history-utils.js';

/**
 * Parse a time window string to milliseconds: "60s", "5m", "2h", "1d".
 * @param {string} windowStr
 * @returns {number} Milliseconds, or NaN if invalid
 */
export function parseTimeWindowMs(windowStr) {
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
 * Rolling window and main buffer capacity of a data source, from `window_seconds`
 * (seconds or a string like "5m"; default 60 s): about 10 points per second of
 * window, at least 60 (RollingBuffer caps it at 1000). The processor preview uses
 * the same size so window-based processors see what a live data source would.
 * @param {Object} cfg - Data source config
 * @returns {{windowSeconds: number, capacity: number}}
 */
export function dataSourceBufferSize(cfg = {}) {
  const windowCfg = cfg.window_seconds ?? cfg.windowSeconds;
  let windowSeconds = 60;
  if (typeof windowCfg === 'number' && isFinite(windowCfg)) {
    windowSeconds = Math.max(1, windowCfg);
  } else if (typeof windowCfg === 'string') {
    const ms = parseTimeWindowMs(windowCfg);
    if (Number.isFinite(ms)) windowSeconds = Math.max(1, Math.floor(ms / 1000));
  }
  return { windowSeconds, capacity: Math.max(60, Math.floor(windowSeconds * 10)) };
}

export class DataSource {
  /**
   * Create a new DataSource for a Home Assistant entity
   * @param {object} cfg - DataSource configuration
   * @param {string} cfg.entity - Entity ID to monitor
   * @param {number|string} [cfg.window_seconds=60] - Rolling window size in seconds (or '5m', '1h')
   * @param {number} [cfg.min_emit_ms=100] - Minimum time between emits
   * @param {number} [cfg.coalesce_ms] - Coalescing window for rapid updates
   * @param {number} [cfg.max_delay_ms] - Maximum delay before forced emit
   * @param {boolean} [cfg.emit_on_same_value=true] - Emit even when value unchanged
   *   The older camelCase spellings (windowSeconds, minEmitMs, sampleMs,
   *   coalesceMs, maxDelayMs, emitOnSameValue) are still read; snake_case wins.
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

    // `attribute: 'state'` (written by older editors) means the entity state,
    // not an attribute named "state". Normalise once so every read site agrees.
    const attribute = normalizeAttribute(this.cfg.attribute);
    if (attribute) {
      this.cfg.attribute = attribute;
    } else {
      delete this.cfg.attribute;
    }

    // This allows expressions to access entity attributes
    this._lastOriginalState = null;

    // Timing keys are snake_case; the older camelCase spellings still work.
    const pick = (...keys) => keys.map(k => cfg[k]).find(v => v !== undefined && v !== null);

    // Buffer sizing from the window (shared with the processor preview)
    const { windowSeconds, capacity } = dataSourceBufferSize(cfg);
    /** Resolved rolling window in seconds */
    this.windowSeconds = windowSeconds;
    this.buffer = new RollingBuffer(capacity);

    // PORT: Complete timing configuration from original - MADE MORE AGGRESSIVE
    const minEmitCfg = pick('min_emit_ms', 'minEmitMs', 'sampleMs');
    const minEmitMs = Number.isFinite(minEmitCfg) ? minEmitCfg : 100;

    this.minEmitMs = Math.max(10, minEmitMs);

    // MORE AGGRESSIVE coalescing by default
    const coalesceCfg = pick('coalesce_ms', 'coalesceMs');
    this.coalesceMs = Number.isFinite(coalesceCfg)
      ? Math.max(20, coalesceCfg)  // Reduced from 30 to 20
      : Math.max(20, Math.round(this.minEmitMs * 0.4));  // Reduced from 0.6 to 0.4

    const maxDelayCfg = pick('max_delay_ms', 'maxDelayMs');
    this.maxDelayMs = Number.isFinite(maxDelayCfg)
      ? Math.max(this.minEmitMs, maxDelayCfg)
      : Math.max(this.minEmitMs, this.coalesceMs * 3);  // Reduced from 4 to 3

    this.emitOnSameValue = pick('emit_on_same_value', 'emitOnSameValue') !== false; // Default true

    // Subscription management
    this.subscribers = new Set();
    this.haUnsubscribe = null;

    // REFACTORED: Unified processor manager (replaces transformations/aggregations split)
    this.processorManager = null; // Will be initialized in _initializeProcessors()

    // Emit throttle state (see _queueEmit)
    this._lastEmitTime = 0;
    /** @type {number|null} */
    this._lastEmittedValue = null;
    /** @type {ReturnType<typeof setTimeout>|null} Trailing emit timer */
    this._emitTimer = null;
    /** @type {{t: number, v: number}|null} Latest value waiting for the trailing emit */
    this._pendingPoint = null;
    this._pending = false;
    this._pendingFirstTs = 0;

    // Performance statistics
    /** @type {Record<string, any>} */
    this._stats = {
      emits: 0,
      coalesced: 0,
      skipsSameValue: 0,
      received: 0,
      invalid: 0,
      historyLoaded: 0,
      updates: 0,
      lastUpdate: null
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

      // STEP 2: Initialize with current HASS state if available. This is the
      // source's first value: the manager does not replay it again.
      const currentState = this.hass.states?.[this.cfg.entity];
      if (currentState) {
        this._extractMetadata(currentState);
        this._lastOriginalState = currentState;
        if (currentState.attributes?.unit_of_measurement) {
          this.cfg.unit_of_measurement = currentState.attributes.unit_of_measurement;
        }

        lcardsLog.trace(`[DataSource] 🔄 Loading initial state for ${this.cfg.entity}:`, currentState.state);
        const currentTimestamp = Date.now();
        const value = this._toNumber(this._readRawValue(currentState));
        if (value !== null) {
          this.buffer.push(currentTimestamp, value);
          this._stats.currentValue = value;
          this._processValue(currentTimestamp, value);
          // Subscribers get this value at once (initial emission / hydration), so
          // emit_on_same_value compares the first live update against it.
          this._lastEmittedValue = value;
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
        this._notify({ ...this._buildEmitData({ t: timestamp, v: lastValue }), isPeriodicUpdate: true });
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
    if (this.subscribers.size === 0) return;
    const lastPoint = this.buffer.last();
    lcardsLog.trace(`[DataSource] 📤 Emitting initial data for ${this.cfg.entity} to ${this.subscribers.size} subscribers`);
    // Even with no buffered point, subscribers get the structure (t and v null).
    this._notify({ ...this._buildEmitData(lastPoint ?? { t: null, v: null }), isInitialEmission: true });
  }

  /**
   * Preload history: the same points the editor's processor preview fetches
   * (history-fetch.js: hourly statistics, else state history, else REST).
   * @private
   */
  async _preloadHistory() {
    if (!this.hass?.connection || !this.cfg.entity) {
      lcardsLog.warn('[DataSource] ⚠️ No HASS connection or entity for history preload');
      return;
    }
    if (!historySettings(this.cfg).enabled) return;

    lcardsLog.trace(`[DataSource] 🔄 Preloading history for ${this.cfg.entity}`);
    const { points, method } = await fetchDataSourceHistory(this.hass, this.cfg);
    this._loadHistoryPoints(points);
    lcardsLog.trace(`[DataSource] ✅ Loaded ${points.length} history points (${method})`);
  }

  /**
   * Push preloaded history points into the buffer and processors.
   * @private
   * @param {Array<{t: number, v: number}>} points
   */
  _loadHistoryPoints(points) {
    for (const { t, v } of points) {
      this.buffer.push(t, v);
      this._processValue(t, v);
      this._stats.historyLoaded++;
    }
  }

  /**
   * Handle a state change from Home Assistant. Every accepted value goes into the
   * buffer and the processors; subscribers are notified through the emit throttle
   * (_queueEmit).
   * @private
   * @param {Object} eventData - State change event data
   */
  _handleStateChange(eventData) {
    if (!eventData?.new_state || this._destroyed) {
      return;
    }

    // Safety check: ensure buffer exists and has required methods
    if (!this.buffer || typeof this.buffer.push !== 'function') {
      lcardsLog.error('[DataSource] ❌ Buffer not properly initialized for', this.cfg.entity);
      return;
    }

    this._extractMetadata(eventData.new_state);

    // Store the original state object before any conversion
    this._lastOriginalState = eventData.new_state;

    if (eventData.new_state.attributes?.unit_of_measurement) {
      this.cfg.unit_of_measurement = eventData.new_state.attributes.unit_of_measurement;
    }

    // Arrival time, not the state's last_changed (attribute updates keep that)
    const timestamp = Date.now();
    const rawValue = this._readRawValue(eventData.new_state);
    const value = this._toNumber(rawValue);
    this._stats.received++;

    if (value === null) {
      this._stats.invalid++;
      lcardsLog.debug(`[DataSource] ⚠️ Skipping state change - invalid value:`, { rawValue, entity: this.cfg.entity });
      return;
    }

    this.buffer.push(timestamp, value);
    this._processValue(timestamp, value);
    this._stats.updates++;
    this._stats.lastUpdate = timestamp;

    this._queueEmit(timestamp, value);
  }

  /**
   * Raw value for this source from a state object: `attribute_path` (nested),
   * `attribute`, or the entity state.
   * @private
   * @param {Object} stateObj - Home Assistant state object
   * @returns {*}
   */
  _readRawValue(stateObj) {
    if (this.cfg.attribute_path) {
      const value = this._extractNestedAttribute(stateObj.attributes, this.cfg.attribute_path);
      if (value === null && this.cfg.debug) {
        lcardsLog.debug(
          `[DataSource] ${this.cfg.entity}: Nested attribute path "${this.cfg.attribute_path}" returned null`
        );
      }
      return value;
    }
    if (this.cfg.attribute) {
      return stateObj.attributes?.[this.cfg.attribute];
    }
    return stateObj.state;
  }

  /**
   * Emit throttle. A value arriving at least `min_emit_ms` after the last emit (and
   * with no trailing emit pending) goes out at once, so sparse updates have no added
   * delay. Otherwise it waits: the trailing emit fires `coalesce_ms` after the latest
   * value (each new value restarts that wait), never sooner than `min_emit_ms` after
   * the last emit and never later than `max_delay_ms` after the first waiting value.
   * Only the latest waiting value is sent.
   * @private
   * @param {number} t - Timestamp (ms)
   * @param {number} v - Value
   */
  _queueEmit(t, v) {
    const now = Date.now();
    if (!this._pending && now - this._lastEmitTime >= this.minEmitMs) {
      this._pendingPoint = { t, v };
      this._flushEmit();
      return;
    }

    if (this._pending) {
      this._stats.coalesced++;
    } else {
      this._pending = true;
      this._pendingFirstTs = now;
    }
    this._pendingPoint = { t, v };

    const due = Math.min(
      Math.max(this._lastEmitTime + this.minEmitMs, now + this.coalesceMs),
      this._pendingFirstTs + this.maxDelayMs
    );
    if (this._emitTimer) clearTimeout(this._emitTimer);
    this._emitTimer = setTimeout(() => {
      this._emitTimer = null;
      this._flushEmit();
    }, Math.max(0, due - now));
  }

  /**
   * Send the waiting value to subscribers, unless `emit_on_same_value: false` and
   * it equals the last value sent.
   * @private
   */
  _flushEmit() {
    const point = this._pendingPoint;
    this._pendingPoint = null;
    this._pending = false;
    if (!point || this._destroyed) return;

    if (!this.emitOnSameValue && point.v === this._lastEmittedValue) {
      this._stats.skipsSameValue++;
      return;
    }

    this._lastEmitTime = Date.now();
    this._lastEmittedValue = point.v;
    this._stats.emits++;
    lcardsLog.trace(`[DataSource] 📤 Emitting to subscribers:`, point.v);
    this._notify(this._buildEmitData(point));
  }

  /**
   * The data object subscribers receive (same shape for live, initial and
   * periodic emits; the latter two add a flag).
   * @private
   * @param {{t: number|null, v: number|null}} point
   * @returns {Object}
   */
  _buildEmitData(point) {
    return {
      t: point.t,
      v: point.v,
      buffer: this.buffer,
      stats: { ...this._stats },
      processing: this._getProcessingData(),
      entity: this.cfg.entity,
      unit_of_measurement: this.cfg.unit_of_measurement,
      historyReady: this._stats.historyLoaded > 0
    };
  }

  /**
   * Call every subscriber with `data`; a failing callback does not stop the rest.
   * @private
   * @param {Object} data
   */
  _notify(data) {
    this.subscribers.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        lcardsLog.error(`[DataSource] ❌ Subscriber callback failed for ${this.cfg.entity}:`, error);
      }
    });
  }

  /**
   * Run a value through the processor pipeline
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

  /** @returns {Map} Configured processors (empty when none). */
  _processors() {
    return this.processorManager ? this.processorManager.processors : new Map();
  }

  /**
   * Enhanced debug method to show processor data
   * @returns {Object} Debug information including processor outputs
   */
  getDebugInfo() {
    const currentData = this.getCurrentData();

    return {
      entity: this.cfg.entity,
      currentValue: currentData.v,
      timestamp: currentData.t ? new Date(currentData.t).toISOString() : null,
      bufferSize: this.buffer.size(),
      processors: {
        count: this._processors().size,
        keys: Array.from(this._processors().keys()),
        results: currentData.processing
      },
      stats: currentData.stats
    };
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
        const currentData = this._buildEmitData(lastPoint);

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
    const value = toNumericValue(raw, this.cfg.enum_mapping);
    if (value === null && typeof raw === 'string' && (this.cfg.debug || this.cfg.enum_mapping_debug)) {
      lcardsLog.debug(
        `[DataSource] ${this.cfg.entity}: non-numeric value "${raw}" skipped (consider enum_mapping)`
      );
    }
    return value;
  }

  /**
   * Parse time window string to milliseconds
   * Supports formats: "60s", "5m", "2h", "1d"
   * @private
   * @param {string} windowStr - Time window string to parse
   * @returns {number} Milliseconds or NaN if invalid
   */
  _parseTimeWindowMs(windowStr) {
    return parseTimeWindowMs(windowStr);
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
        windowSeconds: this.windowSeconds,
        minEmitMs: this.minEmitMs,
        coalesceMs: this.coalesceMs,
        maxDelayMs: this.maxDelayMs
      },
      buffer: this.buffer.getStats(),
      subscribers: this.subscribers.size,
      processors: {
        size: this._processors().size,
        keys: Array.from(this._processors().keys())
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
      // Use narrow no-break space (U+202F) before unit, matching HA's own formatEntityState output.
      ? `${formatted}\u202F${this.metadata.unit_of_measurement}`
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

    if (this._emitTimer) {
      clearTimeout(this._emitTimer);
      this._emitTimer = null;
    }

    this._pending = false;
    this._pendingPoint = null;
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
    /** @type {Record<string, boolean>} */
    const overrides = {};
    this._metadataOverrides = overrides;

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
        overrides[prop] = true; // Mark as user-overridden
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
