import { lcardsLog } from '../../utils/lcards-logging.js';

/**
 * [DataSourceManager] Data source manager - manages multiple data sources and overlay subscriptions
 * 📊 Provides multi-source lifecycle management, overlay subscription system, and EntityRuntime API compatibility
 */

import { DataSource } from './DataSource.js';
import { BaseService } from '../../core/BaseService.js';

export class DataSourceManager extends BaseService {
  constructor(hass) {
    super();
    this.hass = hass;
    this.sources = new Map();
    this.overlaySubscriptions = new Map();

    // NEW: Entity runtime compatibility
    this.entityIndex = new Map(); // entityId -> dataSource
    this.globalEntityChangeListeners = new Set();

    // NEW: Card-level dependency tracking
    this._sourceToCards = new Map(); // sourceId -> Set<cardId>

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
   * @param {string} [cardId] - Card identifier (e.g., this._cardGuid from LCARdSCard)
   * @param {boolean} [autoCreated=false] - Whether auto-created vs. explicitly configured
   * @returns {Promise<DataSource>}
   */
  async createDataSource(name, config, cardId = null, autoCreated = false) {
    // If datasource already exists, add cardId to tracking
    if (this.sources.has(name)) {
      const existing = this.sources.get(name);

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
      source.subscribe((data) => {
        // CRITICAL: Update our hass object with the new state from the DataSource
        if (this.hass && this.hass.states && source._lastOriginalState) {
          this.hass.states[enrichedConfig.entity] = source._lastOriginalState;
          lcardsLog.debug(`[DataSourceManager] 🔄 Updated hass.states['${enrichedConfig.entity}'] to: ${source._lastOriginalState.state}`);
        }

        this._notifyGlobalEntityChangeListeners([enrichedConfig.entity]);
      });
    }

    try {
      await source.start();

      // NEW: Preload initial state from HASS if available
      if (enrichedConfig.entity && this.hass.states && this.hass.states[enrichedConfig.entity]) {
        const hassState = this.hass.states[enrichedConfig.entity];

        // Simulate initial state change to populate the data source
        source._handleStateChange({
          entity_id: enrichedConfig.entity,
          new_state: hassState,
          old_state: null
        });
      }

    } catch (error) {
      lcardsLog.warn(`[DataSourceManager] ⚠️ Failed to start source ${name}:`, error);
      this.sources.delete(name);
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

  // NEW: EntityRuntime compatibility methods
  getEntity(entityId) {
    // Handle dot notation for datasource references
    if (entityId.includes('.')) {
      const [sourceId, ...pathParts] = entityId.split('.');
      const source = this.sources.get(sourceId);

      if (source) {
        const currentData = source.getCurrentData();
        const path = pathParts.join('.');

        // Handle transformation paths
        if (path.startsWith('transformations.')) {
          return this._resolveDataPath(currentData, path, source, 'transformations');
        }

        // Handle aggregation paths
        if (path.startsWith('aggregations.')) {
          return this._resolveDataPath(currentData, path, source, 'aggregations');
        }

        // Default: return raw datasource data
        return {
          state: currentData.v?.toString() || 'unavailable',
          attributes: {
            timestamp: currentData.t,
            source_type: 'datasource',
            entity_id: sourceId,
            ...currentData.stats
          },
          // Provide methods for overlay access
          getHistoricalData: (count) => {
            try {
              return source.buffer.getRecent(count || 100);
            } catch (error) {
              lcardsLog.warn(`[DataSourceManager] Error getting historical data for ${sourceId}:`, error);
              return [];
            }
          },
          getTransformedHistory: (transformKey, count) => {
            try {
              return source.getTransformedHistory(transformKey, count || 100);
            } catch (error) {
              lcardsLog.warn(`[DataSourceManager] ⚠️ Error getting transformed history for ${sourceId}.${transformKey}:`, error);
              return [];
            }
          }
        };
      }
    }

    // Check if it's a simple datasource reference
    const source = this.sources.get(entityId);
    if (source) {
      const currentData = source.getCurrentData();
      const entityResult = {
        state: currentData.v?.toString() || 'unavailable',
        attributes: {
          timestamp: currentData.t,
          source_type: 'datasource',
          entity_id: entityId
        },
        getHistoricalData: (count) => {
          try {
            return source.buffer.getRecent(count || 100);
          } catch (error) {
            lcardsLog.warn(`[DataSourceManager] ⚠️ Error getting historical data for ${entityId}:`, error);
            return [];
          }
        },
        getTransformedHistory: (transformKey, count) => {
          try {
            return source.getTransformedHistory(transformKey, count || 100);
          } catch (error) {
            lcardsLog.warn(`[DataSourceManager] ⚠️ Error getting transformed history for ${entityId}.${transformKey}:`, error);
            return [];
          }
        },
        // NEW: Add subscription capability for real-time updates
        subscribe: (callback) => {
          return source.subscribe(callback);
        }
      };

      return entityResult;
    }

    // Check entity index for basic entity sources
    const entitySource = this.entityIndex.get(entityId);
    if (entitySource) {
      const currentData = entitySource.getCurrentData();
      return {
        state: currentData.v?.toString() || 'unavailable',
        attributes: {
          timestamp: currentData.t,
          source_type: 'entity_datasource'
        }
      };
    }

    // Final fallback to HASS states
    if (this.hass?.states?.[entityId]) {
      return this.hass.states[entityId];
    }

    return null;
  }

  /**
   * Resolve nested data paths for transformations and aggregations
   * @private
   * @param {Object} currentData - Current data from datasource
   * @param {string} path - Full dot notation path
   * @param {Object} source - Source object for historical data access
   * @param {string} dataType - 'transformations' or 'aggregations'
   * @returns {Object|null} Resolved entity-like object
   */
  _resolveDataPath(currentData, path, source, dataType) {
    const pathParts = path.split('.');
    let current = currentData;

    // Navigate through the path
    for (const part of pathParts) {
      if (current && typeof current === 'object' && current.hasOwnProperty(part)) {
        current = current[part];
      } else {
        return null;
      }
    }

    // If we found a value, create entity-like object
    if (current !== undefined && current !== null) {
      const entityResult = {
        state: current.toString(),
        attributes: {
          data_path: path,
          data_type: dataType,
          source_id: source.entity || 'unknown'
        },
        // NEW: Add subscription capability for dot notation entities
        subscribe: (callback) => {
          // Subscribe to the underlying source and filter for our specific transformation/aggregation
          return source.subscribe((data) => {
            const pathParts = path.split('.');
            let current = data;

            for (const part of pathParts) {
              if (current && typeof current === 'object' && current.hasOwnProperty(part)) {
                current = current[part];
              } else {
                current = null;
                break;
              }
            }

            if (current !== undefined && current !== null) {
              // Create entity-like data for the callback
              callback({
                state: current.toString(),
                attributes: {
                  data_path: path,
                  data_type: dataType,
                  source_id: source.entity || 'unknown'
                }
              });
            }
          });
        }
      };

      // For transformations, provide historical data access
      if (dataType === 'transformations') {
        const transformKey = pathParts[1]; // e.g., "celsius" from "transformations.celsius"
        entityResult.getHistoricalData = (count) => {
          try {
            return source.getTransformedHistory(transformKey, count || 100);
          } catch (error) {
            lcardsLog.warn(`[DataSourceManager] ⚠️ Error getting transformed history for ${transformKey}:`, error);
            return [];
          }
        };
      }

      return entityResult;
    }    return null;
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

  /**
   * Subscribe an overlay to data source updates
   * Enhanced for sparkline real-time updates
   * @param {Object} overlay - Overlay configuration with source property
   * @param {Function} callback - Callback function for updates
   */
  subscribeOverlay(overlay, callback) {
    if (!overlay.source) {
      lcardsLog.warn('[DataSourceManager] ⚠️ subscribeOverlay: No source specified for overlay', overlay.id);
      return;
    }

    const source = this.sources.get(overlay.source);
    if (!source) {
      lcardsLog.warn('[DataSourceManager] ⚠️ subscribeOverlay: Source not found:', overlay.source);
      return;
    }

    lcardsLog.debug(`[DataSourceManager] 🔗 Setting up subscription for ${overlay.id} to ${overlay.source}`);

    // Subscribe to the data source with enhanced data for sparklines
    const unsubscribe = source.subscribeWithMetadata?.((data) => {
      // Enhanced callback data for sparklines
      const enhancedData = {
        ...data,
        sourceId: overlay.source,
        overlayId: overlay.id,
        overlayType: overlay.type,
        // Include buffer reference for sparklines
        buffer: overlay.type === 'sparkline' ? data.buffer : undefined,
        // Include historical data if available
        historicalData: overlay.type === 'sparkline' && data.buffer ?
          data.buffer.getAll().map(point => ({ timestamp: point.t, value: point.v })) : undefined
      };

      // Reduced debug logging for callback data

      // Call the callback with overlay and enhanced update data
      callback(overlay, enhancedData);
    }, {
      // ADDED: Pass overlay metadata to the subscription
      overlayId: overlay.id,
      overlayType: overlay.type,
      component: 'OverlayManager'
    }) || source.subscribe((data) => {
      // Fallback if subscribeWithMetadata not available
      const enhancedData = {
        ...data,
        sourceId: overlay.source,
        overlayId: overlay.id,
        overlayType: overlay.type,
        buffer: overlay.type === 'sparkline' ? data.buffer : undefined,
        historicalData: overlay.type === 'sparkline' && data.buffer ?
          data.buffer.getAll().map(point => ({ timestamp: point.t, value: point.v })) : undefined
      };

      callback(overlay, enhancedData);
    });

    // CRITICAL: Provide immediate callback if data already exists
    // This fixes the timing issue where overlays subscribe after data is ready
    const currentData = source.getCurrentData();
    if (currentData && (currentData.buffer?.size?.() > 0 || currentData.v !== undefined)) {
      lcardsLog.debug(`[DataSourceManager] 🔄 Providing immediate data for ${overlay.id}`);

      const immediateData = {
        ...currentData,
        sourceId: overlay.source,
        overlayId: overlay.id,
        overlayType: overlay.type,
        buffer: overlay.type === 'sparkline' ? currentData.buffer : undefined,
        historicalData: overlay.type === 'sparkline' && currentData.buffer ?
          currentData.buffer.getAll().map(point => ({ timestamp: point.t, value: point.v })) : undefined
      };

      // Use setTimeout to avoid blocking the subscription setup
      setTimeout(() => {
        callback(overlay, immediateData);
      }, 0);
    }



    // Store the unsubscribe function
    if (!this.overlaySubscriptions.has(overlay.id)) {
      this.overlaySubscriptions.set(overlay.id, []);
    }
    this.overlaySubscriptions.get(overlay.id).push(unsubscribe);
    this._stats.subscriptionsActive++;

    lcardsLog.debug(`[DataSourceManager] ✅ Subscribed ${overlay.type} overlay ${overlay.id} to source ${overlay.source} (${source.subscribers?.size || 0} total subscribers)`);

    return unsubscribe;
  }

  unsubscribeOverlay(overlayId) {
    const subscriptions = this.overlaySubscriptions.get(overlayId);
    if (subscriptions) {
      subscriptions.forEach(unsubscribe => {
        try {
          unsubscribe();
        } catch (error) {
          lcardsLog.warn(`[DataSourceManager] ⚠️ Error unsubscribing overlay ${overlayId}:`, error);
          this._stats.errors++;
        }
      });
      this.overlaySubscriptions.delete(overlayId);
      this._stats.subscriptionsActive--;
    }
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
   * Remove card from datasource tracking
   * Used when card is destroyed or datasource removed from config
   * @param {string} sourceName - Datasource identifier
   * @param {string} cardId - Card ID to remove
   */
  removeCardFromSource(sourceName, cardId) {
    const cards = this._sourceToCards.get(sourceName);
    if (cards) {
      cards.delete(cardId);

      lcardsLog.debug(`[DataSourceManager] Removed card ${cardId} from datasource ${sourceName} (${cards.size} cards remaining)`);

      // Cleanup if no cards left
      if (cards.size === 0) {
        this._sourceToCards.delete(sourceName);
        lcardsLog.debug(`[DataSourceManager] No cards using datasource ${sourceName}, eligible for cleanup`);
      }
    }
  }

  /**
   * Get a specific data source by ID
   * @param {string} id - Data source ID
   * @returns {DataSource|null} The data source or null if not found
   */
  getDataSource(id) {
    return this._dataSources.get(id) || null;
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
        activeSubscriptions: this.overlaySubscriptions.size,
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
      enhanced_sources: [],
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

    // Test dot notation access for enhanced sources
    this.sources.forEach((source, id) => {
      const currentData = source.getCurrentData();
      if (currentData.transformations && Object.keys(currentData.transformations).length > 0) {
        Object.keys(currentData.transformations).forEach(transformKey => {
          const dotPath = `${id}.transformations.${transformKey}`;
          const resolved = this.getEntity(dotPath);
          debugInfo.dot_notation_test[dotPath] = resolved ? resolved.state : 'null';
        });
      }

      if (currentData.aggregations && Object.keys(currentData.aggregations).length > 0) {
        Object.keys(currentData.aggregations).forEach(aggKey => {
          const dotPath = `${id}.aggregations.${aggKey}`;
          const resolved = this.getEntity(dotPath);
          debugInfo.dot_notation_test[dotPath] = resolved ? resolved.state : 'null';
        });
      }
    });

    return debugInfo;
  }

  async destroy() {
    if (this._destroyed) return;
    this._destroyed = true;

    // Unsubscribe all overlays
    for (const overlayId of this.overlaySubscriptions.keys()) {
      this.unsubscribeOverlay(overlayId);
    }

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
    this.overlaySubscriptions.clear();
    this.entityIndex.clear();
    this.globalEntityChangeListeners.clear();
  }

  // Debug and introspection methods
  debugDump() {
    return {
      sources: Array.from(this.sources.keys()),
      subscriptions: Array.from(this.overlaySubscriptions.keys()),
      entities: Array.from(this.entityIndex.keys()),
      stats: this.getStats()
    };
  }

  // ============================================================================
  // PHASE 1: New HASS Ingestion Method (Step 1 - Add alongside existing)
  // ============================================================================

  /**
   * NEW: Ingest fresh HASS and update tracked entities
   * This supplements the real-time subscription mechanism (which remains primary)
   * Used for: initialization, reconnection, manual refresh
   * @param {Object} hass - Home Assistant state object
   */
  ingestHass(hass) {
    if (!hass || !hass.states) {
      lcardsLog.warn('[DataSourceManager] ingestHass: Invalid HASS provided');
      return { hasChanges: false, changedCount: 0, totalCount: 0 };
    }

    const previousHass = this.hass;
    const hassPrevious = !!previousHass?.states;

    lcardsLog.debug('[DataSourceManager] 📥 ingestHass: Updating tracked entities', {
      entityCount: Object.keys(hass.states).length,
      trackedCount: this.entityIndex.size,
      hasPrevious: hassPrevious
    });

    // Update HASS reference for lookups
    this.hass = hass;

    // If we have previous HASS, only update changed entities
    if (hassPrevious) {
      let changedCount = 0;
      let processedCount = 0;

      for (const [entityId, dataSource] of this.entityIndex.entries()) {
        const currentState = hass.states[entityId];
        const previousState = previousHass.states[entityId];

        if (currentState) {
          processedCount++;

          // Check if the entity state actually changed
          const hasChanged = !previousState ||
                           currentState.state !== previousState.state ||
                           currentState.last_changed !== previousState.last_changed ||
                           JSON.stringify(currentState.attributes) !== JSON.stringify(previousState.attributes);

          if (hasChanged) {
            changedCount++;
            lcardsLog.debug(`[DataSourceManager] 🔄 Refreshing changed entity: ${entityId}`);

            // Notify the data source of the fresh state
            if (dataSource && typeof dataSource.updateFromEntityState === 'function') {
              dataSource.updateFromEntityState(entityId, currentState);
            }
          }
        }
      }

      lcardsLog.debug(`[DataSourceManager] ✅ ingestHass: Complete - ${changedCount}/${processedCount} entities changed`);
      return { hasChanges: changedCount > 0, changedCount, totalCount: processedCount };
    } else {
      // First run or no previous HASS - update all tracked entities
      let totalCount = 0;
      for (const [entityId, dataSource] of this.entityIndex.entries()) {
        if (hass.states[entityId]) {
          totalCount++;
          const freshState = hass.states[entityId];
          lcardsLog.debug(`[DataSourceManager] 🔄 Refreshing entity: ${entityId}`);

          // Notify the data source of the fresh state
          if (dataSource && typeof dataSource.updateFromEntityState === 'function') {
            dataSource.updateFromEntityState(entityId, freshState);
          }
        }
      }

      lcardsLog.debug('[DataSourceManager] ✅ ingestHass: Complete - full refresh');
      return { hasChanges: true, changedCount: totalCount, totalCount };
    }
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
