import { lcardsLog } from '../../utils/lcards-logging.js';

/**
 * [DataSourceManager] Data source manager - manages multiple data sources and overlay subscriptions
 * 📊 Provides multi-source lifecycle management, overlay subscription system, and EntityRuntime API compatibility
 */

import { DataSource } from './DataSource.js';
import { BaseService } from '../../core/BaseService.js';

/**
 * How long a card-created source keeps running after its last card leaves, so a
 * card that is removed and added again (edit mode, view switches, a card rebuilt by
 * HA) picks up the same source, history included, instead of a fresh one.
 */
export const SOURCE_RELEASE_DELAY_MS = 30000;

export class DataSourceManager extends BaseService {
  constructor(hass) {
    super();
    this.hass = hass;
    this.sources = new Map();

    // NEW: Entity runtime compatibility
    this.entityIndex = new Map(); // entityId -> dataSource
    this.globalEntityChangeListeners = new Set();

    // NEW: Card-level dependency tracking
    this._sourceToCards = new Map(); // sourceId -> Set<cardId>

    /** @type {Map<string, ReturnType<typeof setTimeout>>} sourceId -> pending release (see removeCardFromSource) */
    this._releaseTimers = new Map();
    /** @type {Map<string, Function>} sourceId -> the manager's own entity-forwarding subscriber */
    this._forwarders = new Map();
    /** @type {Set<string>} Sources asked for without a card (MSD/global config): never released */
    this._configSources = new Set();

    // Performance statistics
    this._stats = {
      sourcesCreated: 0,
      subscriptionsActive: 0,
      dataUpdates: 0,
      errors: 0
    };

    // Lifecycle state
    this._destroyed = false;
  }

  /**
   * Initialize data sources from configuration with history preloading
   * @param {Object} dataSourceConfigs - Configuration for data sources
   * @returns {Promise<number>} Number of sources created
   */
  async initializeFromConfig(dataSourceConfigs) {
    if (this._destroyed) {
      throw new Error('DataSourceManager has been destroyed');
    }

    lcardsLog.debug(`[DataSourceManager] 🚀 Initializing ${Object.keys(dataSourceConfigs || {}).length} data sources`);

    // Create all data sources from config
    const promises = Object.entries(dataSourceConfigs || {}).map(async ([name, config]) => {
      try {
        const source = await this.createDataSource(name, config);
        this._stats.sourcesCreated++;
        return source;
      } catch (error) {
        lcardsLog.warn(`[DataSourceManager] ⚠️ Failed to create source ${name}:`, error);
        this._stats.errors++;
        throw error;
      }
    });

    await Promise.all(promises);

    // NEW: Wait for history preloading to complete
    if (this.sources.size > 0) {
      await this._waitForHistoryPreloading();
    }

    const successful = this.sources.size;
    const failed = Object.keys(dataSourceConfigs || {}).length - successful;
    lcardsLog.debug(`[DataSourceManager] ✅ Initialization complete: ${successful} successful, ${failed} failed`);

    return successful;
  }

  /**
   * Create or retrieve a datasource and track card usage
   * @param {string} name - Datasource identifier
   * @param {Object} config - Datasource configuration
   * @param {string|null} [cardId] - Card identifier (e.g., this._cardGuid from LCARdSCard)
   * @param {boolean} [autoCreated=false] - Whether auto-created vs. explicitly configured
   * @returns {Promise<DataSource>}
   */
  async createDataSource(name, config, cardId = null, autoCreated = false) {
    if (!cardId) this._configSources.add(name);

    // Core starts with a stub HASS (no connection) until a card or the page feeds the
    // real one, and HA configures a card before giving it HASS. A source built on the
    // stub skips its history preload and fails to subscribe, so wait for the real one.
    if (!this.sources.has(name) && !this.hass?.connection) {
      await this._whenConnected();
    }

    // If datasource already exists, add cardId to tracking
    if (this.sources.has(name)) {
      const existing = this.sources.get(name);
      this._cancelRelease(name);

      if (cardId) {
        if (!this._sourceToCards.has(name)) {
          this._sourceToCards.set(name, new Set());
        }
        this._sourceToCards.get(name).add(cardId);

        lcardsLog.debug(`[DataSourceManager] Card ${cardId} now uses datasource ${name} (${this._sourceToCards.get(name).size} total cards)`);
      }

      return existing;
    }

    // Enrich config with metadata for runtime tracking, stats, and editor display
    const enrichedConfig = {
      ...config,
      _autoCreated: autoCreated,
      _sourceCard: cardId
    };

    const source = new DataSource(enrichedConfig, this.hass);
    this.sources.set(name, source);

    // Track card usage
    if (cardId) {
      if (!this._sourceToCards.has(name)) {
        this._sourceToCards.set(name, new Set());
      }
      this._sourceToCards.get(name).add(cardId);
    }

    // NEW: Index by entity for global lookups
    if (enrichedConfig.entity) {
      this.entityIndex.set(enrichedConfig.entity, source);

      // Forward entity changes to global listeners AND update hass object
      const forward = () => {
        // Keep our own view of hass current with the new state. Copy, never write
        // into the snapshot: it is the hass object cards hold as their previous
        // state, and a card that finds the new state already there sees no change
        // and keeps its old text.
        if (this.hass && this.hass.states && source._lastOriginalState) {
          this.hass = { ...this.hass, states: { ...this.hass.states, [enrichedConfig.entity]: source._lastOriginalState } };
          lcardsLog.debug(`[DataSourceManager] 🔄 Updated hass.states['${enrichedConfig.entity}'] to: ${source._lastOriginalState.state}`);
        }

        this._notifyGlobalEntityChangeListeners([enrichedConfig.entity]);
      };
      this._forwarders.set(name, forward);
      source.subscribe(forward);
    }

    try {
      // start() loads the entity's current state (once) and subscribes to changes
      await source.start();
    } catch (error) {
      lcardsLog.warn(`[DataSourceManager] ⚠️ Failed to start source ${name}:`, error);
      this.sources.delete(name);
      this._forwarders.delete(name);
      this.entityIndex.delete(enrichedConfig.entity);
      if (cardId) {
        this.removeCardFromSource(name, cardId);
      }
      this._stats.errors++;
      throw error;
    }

    lcardsLog.debug(`[DataSourceManager] Created datasource ${name}`, {
      entity: enrichedConfig.entity,
      autoCreated,
      sourceCard: cardId,
      usedByCards: this._sourceToCards.get(name)?.size || 0
    });

    return source;
  }

  /**
   * Resolves once HASS has a websocket connection (see ingestHass).
   * @private
   * @returns {Promise<void>}
   */
  _whenConnected() {
    if (this.hass?.connection) return Promise.resolve();
    const waiters = (this._connectedWaiters ??= []);
    return new Promise(resolve => waiters.push(resolve));
  }

  /**
   * NEW: Wait for all sources to complete their history loading
   * @private
   * @param {number} maxWaitMs - Maximum wait time in milliseconds
   */
  async _waitForHistoryPreloading(maxWaitMs = 10000) {
    const startTime = Date.now();
    const checkInterval = 100;

    lcardsLog.debug(`[DataSourceManager] ⏳ Waiting for history preloading...`);

    while (Date.now() - startTime < maxWaitMs) {
      let allReady = true;
      let totalSources = 0;
      let readySources = 0;

      for (const [name, source] of this.sources) {
        totalSources++;
        const stats = source.getStats();
        if (stats.historyLoaded > 0 || !source.cfg.history?.enabled) {
          readySources++;
        } else {
          allReady = false;
        }
      }

      if (readySources > 0) {
        lcardsLog.debug(`[DataSourceManager] History loading progress: ${readySources}/${totalSources} sources ready`);
      }

      if (allReady || totalSources === 0) {
        lcardsLog.debug(`[DataSourceManager] ✅ History preloading complete in ${Date.now() - startTime}ms`);
        break;
      }

      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
  }

  /**
   * Entity-like view of a data source (EntityRuntime compatibility; the rules
   * engine's last-resort lookup and the MSD debug API use it).
   *
   * - `name`: the source's current value
   * - `name.processing.<key>` (or any other dotted path into getCurrentData()):
   *   that value, or null when the path does not resolve
   * - an entity id a source tracks: that source's value
   * - otherwise the HASS state, or null
   * @param {string} entityId
   * @returns {Object|null}
   */
  getEntity(entityId) {
    const direct = this.sources.get(entityId);
    if (direct) return this._sourceEntity(direct, entityId, 'datasource');

    if (entityId.includes('.')) {
      const [sourceId, ...pathParts] = entityId.split('.');
      const source = this.sources.get(sourceId);
      if (source) {
        let value = /** @type {any} */ (source.getCurrentData());
        for (const part of pathParts) {
          value = value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, part) ? value[part] : undefined;
        }
        if (value === undefined || value === null) return null;
        return {
          state: String(value),
          attributes: { data_path: pathParts.join('.'), source_type: 'datasource', entity_id: sourceId }
        };
      }
    }

    const entitySource = this.entityIndex.get(entityId);
    if (entitySource) return this._sourceEntity(entitySource, entityId, 'entity_datasource');

    return this.hass?.states?.[entityId] ?? null;
  }

  /**
   * @private
   * @param {DataSource} source
   * @param {string} id
   * @param {string} sourceType
   */
  _sourceEntity(source, id, sourceType) {
    const currentData = source.getCurrentData();
    return {
      state: currentData.v?.toString() || 'unavailable',
      attributes: { timestamp: currentData.t, source_type: sourceType, entity_id: id },
      getHistoricalData: (count) => source.getRecent(count || 100),
      subscribe: (callback) => source.subscribe(callback)
    };
  }

  listIds() {
    return Array.from(this.entityIndex.keys());
  }

  // NEW: Add global entity change listener for rules engine
  addEntityChangeListener(callback) {
    this.globalEntityChangeListeners.add(callback);
    return () => this.globalEntityChangeListeners.delete(callback);
  }

  _notifyGlobalEntityChangeListeners(changedEntityIds) {
    if (this.globalEntityChangeListeners.size === 0) return;

    this.globalEntityChangeListeners.forEach(callback => {
      try {
        callback(changedEntityIds);
      } catch (error) {
        lcardsLog.warn('[DataSourceManager] ⚠️ Global entity listener error:', error);
      }
    });
  }

  getSource(name) {
    return this.sources.get(name);
  }

  getAllSources() {
    return Array.from(this.sources.values());
  }

  /**
   * Get list of cards using a datasource
   * @param {string} sourceName - Datasource identifier
   * @returns {Array<string>} Array of card IDs
   */
  getSourceDependents(sourceName) {
    return Array.from(this._sourceToCards.get(sourceName) || []);
  }

  /**
   * Remove card from datasource tracking.
   * Used when a card disconnects or a source is removed from its config. When the
   * last card leaves a source that a card created, the source is stopped and
   * removed after SOURCE_RELEASE_DELAY_MS, unless a card takes it again first or
   * something else (a chart, an animation, an MSD overlay) still subscribes to it.
   * Sources from MSD/global config (created without a card) are never released here.
   * @param {string} sourceName - Datasource identifier
   * @param {string} cardId - Card ID to remove
   */
  removeCardFromSource(sourceName, cardId) {
    const cards = this._sourceToCards.get(sourceName);
    if (!cards) return;
    cards.delete(cardId);

    lcardsLog.debug(`[DataSourceManager] Removed card ${cardId} from datasource ${sourceName} (${cards.size} cards remaining)`);

    if (cards.size === 0) {
      this._sourceToCards.delete(sourceName);
      this._scheduleRelease(sourceName);
    }
  }

  /**
   * @private
   * @param {string} name
   */
  _scheduleRelease(name) {
    const source = this.sources.get(name);
    if (!source || this._configSources.has(name) || source.cfg?._autoCreated) return;
    this._cancelRelease(name);
    lcardsLog.debug(`[DataSourceManager] No cards using datasource ${name}; releasing in ${SOURCE_RELEASE_DELAY_MS} ms`);
    this._releaseTimers.set(name, setTimeout(() => {
      this._releaseTimers.delete(name);
      this._releaseSource(name);
    }, SOURCE_RELEASE_DELAY_MS));
  }

  /**
   * @private
   * @param {string} name
   */
  _cancelRelease(name) {
    const timer = this._releaseTimers.get(name);
    if (timer) {
      clearTimeout(timer);
      this._releaseTimers.delete(name);
    }
  }

  /**
   * Stop and remove a source no card uses. Kept when a card came back or when it
   * has subscribers besides the manager's own entity forwarder.
   * @private
   * @param {string} name
   */
  _releaseSource(name) {
    const source = this.sources.get(name);
    if (!source || this._sourceToCards.get(name)?.size) return;
    const own = this._forwarders.get(name);
    const others = [...source.subscribers].filter(cb => cb !== own).length;
    if (others > 0) {
      lcardsLog.debug(`[DataSourceManager] Keeping datasource ${name}: ${others} subscriber(s) outside cards`);
      return;
    }
    this.sources.delete(name);
    this._forwarders.delete(name);
    if (this.entityIndex.get(source.cfg.entity) === source) {
      this.entityIndex.delete(source.cfg.entity);
      const other = [...this.sources.values()].find(s => s.cfg.entity === source.cfg.entity);
      if (other) this.entityIndex.set(source.cfg.entity, other);
    }
    source.destroy();
    lcardsLog.debug(`[DataSourceManager] Released datasource ${name} (no cards left)`);
  }

  getStats() {
    const sourceStats = {};
    for (const [name, source] of this.sources) {
      const baseStats = source.getStats ? source.getStats() : { error: 'No stats available' };
      const dependents = this.getSourceDependents(name);
      sourceStats[name] = {
        ...baseStats,
        usedByCards: dependents,
        cardCount: dependents.length,
        autoCreated: source.cfg?._autoCreated || false,
        sourceCard: source.cfg?._sourceCard || null
      };
    }

    return {
      manager: this._stats,
      sources: sourceStats,
      summary: {
        totalSources: this.sources.size,
        entityCount: this.entityIndex.size,
        destroyed: this._destroyed,
        cardDependencies: this._sourceToCards.size
      }
    };
  }

  // ADDED: Basic subscriber information methods
  getSourceSubscribers(sourceName) {
    const source = this.sources.get(sourceName);
    return source?.getSubscriberInfo?.() || [];
  }

  getAllSubscribers() {
    const result = {};
    this.sources.forEach((source, name) => {
      result[name] = source.getSubscriberInfo?.() || [];
    });
    return result;
  }

  /**
   * Enhanced debugging method for transformation and aggregation inspection
   * @returns {Object} Comprehensive debug information
   */
  getDebugInfo() {
    const debugInfo = {
      sources: this.sources.size,
      entityIndex: this.entityIndex.size,
      enhanced_sources: /** @type {any[]} */ ([]),
      dot_notation_test: {}
    };

    // Get debug info from all sources
    this.sources.forEach((source, id) => {
      if (typeof source.getDebugInfo === 'function') {
        debugInfo.enhanced_sources.push({
          id,
          ...source.getDebugInfo()
        });
      }
    });

    // Dot-notation lookups for every processor output
    this.sources.forEach((source, id) => {
      const processing = source.getCurrentData().processing || {};
      Object.keys(processing).forEach(key => {
        const dotPath = `${id}.processing.${key}`;
        const resolved = this.getEntity(dotPath);
        debugInfo.dot_notation_test[dotPath] = resolved ? resolved.state : 'null';
      });
    });

    return debugInfo;
  }

  async destroy() {
    if (this._destroyed) return;
    this._destroyed = true;

    this._releaseTimers.forEach(timer => clearTimeout(timer));
    this._releaseTimers.clear();

    // Stop all data sources
    const stopPromises = [];
    for (const [name, source] of this.sources) {
      try {
        if (source.stop) {
          stopPromises.push(source.stop());
        } else if (source.destroy) {
          stopPromises.push(source.destroy());
        }
      } catch (error) {
        lcardsLog.warn(`[DataSourceManager] ⚠️ Error stopping source ${name}:`, error);
      }
    }

    await Promise.all(stopPromises);

    this.sources.clear();
    this._forwarders.clear();
    this._configSources.clear();
    this.entityIndex.clear();
    this.globalEntityChangeListeners.clear();
  }

  // Debug and introspection methods
  debugDump() {
    return {
      sources: Array.from(this.sources.keys()),
      entities: Array.from(this.entityIndex.keys()),
      stats: this.getStats()
    };
  }

  /**
   * Store fresh HASS and report which tracked entities changed. Data sources get
   * their values from their own `state_changed` subscriptions, not from here
   * (feeding HASS snapshots in as well would record every change twice). This
   * keeps `this.hass` current for getEntity() and the hass forwarding, and
   * releases createDataSource() calls waiting for a connection.
   * @param {Object} hass - Home Assistant state object
   * @returns {{hasChanges: boolean, changedCount: number, totalCount: number}}
   */
  ingestHass(hass) {
    if (!hass || !hass.states) {
      lcardsLog.warn('[DataSourceManager] ingestHass: Invalid HASS provided');
      return { hasChanges: false, changedCount: 0, totalCount: 0 };
    }

    const previousStates = this.hass?.states;
    this.hass = hass;

    // Release data sources waiting for a connected HASS (createDataSource)
    if (hass.connection && this._connectedWaiters?.length) {
      const waiters = this._connectedWaiters;
      this._connectedWaiters = [];
      waiters.forEach(resolve => resolve());
    }

    let changedCount = 0;
    let totalCount = 0;
    for (const entityId of this.entityIndex.keys()) {
      const current = hass.states[entityId];
      if (!current) continue;
      totalCount++;
      const previous = previousStates?.[entityId];
      if (!previous ||
          current.state !== previous.state ||
          current.last_changed !== previous.last_changed ||
          JSON.stringify(current.attributes) !== JSON.stringify(previous.attributes)) {
        changedCount++;
      }
    }

    lcardsLog.trace(`[DataSourceManager] ingestHass: ${changedCount}/${totalCount} tracked entities changed`);
    return { hasChanges: !previousStates || changedCount > 0, changedCount, totalCount };
  }

  /**
   * Override BaseService updateHass to forward to ingestHass
   * Core calls updateHass(), but DataSourceManager implements ingestHass()
   *
   * @param {Object} hass - Home Assistant instance
   */
  updateHass(hass) {
    return this.ingestHass(hass);
  }
}
