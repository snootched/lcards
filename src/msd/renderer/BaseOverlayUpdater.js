/**
 * [BaseOverlayUpdater] Base overlay update system - unified interface for dynamic overlay updates
 * 🔄 Provides consistent template processing and DataSource integration across all overlay types
 *
 * @module BaseOverlayUpdater
 * @requires lcards-logging
 * @requires MSDContentResolver
 * @requires TemplateEntityExtractor
 */

import { lcardsLog } from '../../utils/lcards-logging.js';
import { MSDContentResolver } from './MSDContentResolver.js';
import { TemplateEntityExtractor } from '../templates/TemplateEntityExtractor.js';
import { TemplateProcessor } from '../utils/TemplateProcessor.js';

export class BaseOverlayUpdater {
  /**
   * Create a new BaseOverlayUpdater instance
   * @param {Object} systemsManager - Reference to SystemsManager for accessing subsystems
   */
  constructor(systemsManager) {
    this.systemsManager = systemsManager;
    this.overlayUpdaters = new Map();

    // Register overlay-specific updaters
    this._registerUpdaters();
  }

  /**
   * Register overlay-specific update handlers
   * Each updater provides:
   * - needsUpdate: function to determine if overlay needs updating
   * - update: function to perform the update
   * - hasTemplates: function to check if overlay uses templates
   * @private
   */
  _registerUpdaters() {
    // Generic updater for card and line overlays
    // Cards (control type) and lines use template processing for dynamic content
    this.overlayUpdaters.set('default', {
      needsUpdate: (overlay, sourceData) => this._hasTemplateContent(overlay),
      update: (overlayId, overlay, sourceData) => this._updateGenericOverlay(overlayId, overlay, sourceData),
      hasTemplates: (overlay) => this._hasTemplateContent(overlay)
    });

    // Note: Removed overlay types (v1.16.22+)
    // - text: Use custom:lcards-simple-button or HA cards instead
    // - status_grid: Use type: grid (HA card) instead
    // - button: Use custom:lcards-simple-button instead
    // - apexchart: Use custom:lcards-simple-chart instead
  }

  /**
   * Main entry point for updating overlays when DataSource changes
   * @param {Array<string>} changedIds - Entity IDs that changed
   * @public
   */
  updateOverlaysForDataSourceChanges(changedIds) {
    lcardsLog.debug(`[BaseOverlayUpdater] 🔄 Checking overlays for DataSource/HA changes: ${changedIds.join(', ')}`);

    const resolvedModel = this.systemsManager.modelBuilder?.getResolvedModel?.();
    if (!resolvedModel?.overlays) {
      lcardsLog.warn('[BaseOverlayUpdater] ⚠️ No resolved model or overlays found');
      return;
    }

    resolvedModel.overlays.forEach(overlay => {
      const updater = this.overlayUpdaters.get(overlay.type) || this.overlayUpdaters.get('default');
      if (!updater.hasTemplates(overlay)) return;

      // Detect if this overlay references changed DataSources OR HA entities
      const dsChanged = this._overlayReferencesChangedDataSources(overlay, changedIds);
      const haChanged = this._overlayReferencesChangedEntities(overlay, changedIds);

      if (dsChanged || haChanged) {
        let currentData = null;

        // ENHANCED: Try to provide DataSource data when applicable
        const dsId = this._findDataSourceForEntity(changedIds[0]);
        if (dsId) {
          const ds = this.systemsManager.dataSourceManager.getSource(dsId);
          currentData = ds?.getCurrentData?.() || null;

          lcardsLog.debug(`[BaseOverlayUpdater] 📊 DataSource ${dsId} data for overlay ${overlay.id}:`, {
            hasCurrentData: !!currentData,
            entityState: currentData?.entity?.state,
            entityId: currentData?.entity?.entity_id,
            timestamp: currentData?.timestamp,
            changedEntity: changedIds[0]
          });
        }

        lcardsLog.debug(`[BaseOverlayUpdater] 🔄 Updating ${overlay.type} overlay ${overlay.id} (dsChanged=${dsChanged}, haChanged=${haChanged})`);

        updater.update(overlay.id, overlay, currentData);
      }
    });
  }

  /**
   * Check if overlay references any of the changed DataSources
   * @private
   * @param {Object} overlay - Overlay configuration
   * @param {Array<string>} changedIds - Array of changed entity IDs
   * @returns {boolean} True if overlay references changed DataSource
   */
  _overlayReferencesChangedDataSources(overlay, changedIds) {
    const mainContent = overlay._raw?.content || overlay.content || overlay.text || '';
    let hasReference = false;

    // Check main content for template references
    if (mainContent && this._contentReferencesChangedDataSources(mainContent, changedIds)) {
      hasReference = true;
    }

    // For history bars, check if source directly matches a changed DataSource
    if (overlay.type === 'history_bar' && overlay.source) {
      const sourceMatches = this._dataSourceMatchesChangedEntities(overlay.source, changedIds);
      if (sourceMatches) {
        hasReference = true;
      }
    }

    // For status grids, check EACH CELL INDIVIDUALLY
    if (overlay.type === 'status_grid') {
      const cellsConfig = overlay.cells || overlay._raw?.cells || overlay.raw?.cells;
      if (cellsConfig && Array.isArray(cellsConfig)) {
        cellsConfig.forEach(cell => {
          const cellContent = cell.content || cell.label || cell.value_format || '';
          const cellReferencesChanged = this._contentReferencesChangedDataSources(cellContent, changedIds);

          if (cellReferencesChanged) {
            hasReference = true;
          }
        });
      }
    }

    // For ApexCharts, check if source matches changed DataSource
    if (overlay.type === 'apexchart') {
      const sourceRef = overlay.source || overlay.data_source || overlay.sources;
      const sources = Array.isArray(sourceRef) ? sourceRef : [sourceRef];

      sources.forEach(source => {
        if (this._dataSourceMatchesChangedEntities(source, changedIds)) {
          hasReference = true;
        }
      });
    }

    return hasReference;
  }

  /**
   * Check if overlay references any of the changed entities (using TemplateEntityExtractor)
   * @private
   * @param {Object} overlay - Overlay configuration
   * @param {Array<string>} changedIds - Array of changed entity IDs
   * @returns {boolean} True if overlay references changed entity
   */
  _overlayReferencesChangedEntities(overlay, changedIds) {
    try {
      // Use TemplateEntityExtractor to get all entity references in this overlay
      const overlayEntities = TemplateEntityExtractor.extractFromOverlay(overlay);

      // Check if any overlay entities match changed entities
      for (const overlayEntity of overlayEntities) {
        if (changedIds.includes(overlayEntity)) {
          lcardsLog.debug(`[BaseOverlayUpdater] 🎯 Overlay ${overlay.id} references changed entity: ${overlayEntity}`);
          return true;
        }
      }

      return false;
    } catch (error) {
      lcardsLog.error(`[BaseOverlayUpdater] Error checking entity references for overlay ${overlay.id}:`, error);
      return false;
    }
  }

  /**
   * Check if overlay content contains template references
   * @private
   * @param {Object} overlay - Overlay configuration
   * @returns {boolean} True if overlay uses templates
   */
  _hasTemplateContent(overlay) {
    try {
      // Use TemplateEntityExtractor to detect any entity references
      const entities = TemplateEntityExtractor.extractFromOverlay(overlay);
      return entities.size > 0;
    } catch (error) {
      lcardsLog.error(`[BaseOverlayUpdater] Error checking template content for overlay ${overlay.id}:`, error);

      // Fallback to original detection method
      const mainContent = overlay._raw?.content || overlay.content || overlay.text ||
                          overlay._raw?.value_format || overlay.value_format || '';
      if (mainContent && typeof mainContent === 'string' && this._hasAnyTemplateMarkers(mainContent)) {
        return true;
      }

      // For status grids, check cell configurations
      if (overlay.type === 'status_grid') {
        const cellsConfig = overlay.cells || overlay._raw?.cells || overlay.raw?.cells;
        if (cellsConfig && Array.isArray(cellsConfig)) {
          return cellsConfig.some(cell => {
            const cellContent = cell.content || cell.label || cell.value_format || '';
            return cellContent && typeof cellContent === 'string' && this._hasAnyTemplateMarkers(cellContent);
          });
        }
      }
      return false;
    }
  }

  /**
   * Detect any template markers (MSD {} or HA {{}})
   * @private
   * @param {string} content - Content string to check
   * @returns {boolean} True if content contains template markers
   *
   * PHASE 2: Delegated to TemplateProcessor for unified detection
   */
  _hasAnyTemplateMarkers(content) {
    return TemplateProcessor.hasTemplates(content);
  }

  /**
   * Check if content string references any of the changed DataSources
   * @private
   * @param {string} content - Content string to check
   * @param {Array<string>} changedIds - Array of changed entity IDs
   * @returns {boolean} True if content references changed DataSource
   */
  _contentReferencesChangedDataSources(content, changedIds) {
    if (!content || typeof content !== 'string') return false;

    // Extract all entity references from the content
    const templateRegex = /\{([^}]+)\}/g;
    let match;
    const referencedEntities = new Set();

    while ((match = templateRegex.exec(content)) !== null) {
      const expression = match[1].trim();

      // Extract entity names from the expression
      const entityRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)\b/g;
      let entityMatch;

      while ((entityMatch = entityRegex.exec(expression)) !== null) {
        const entityName = entityMatch[1];

        // Skip JavaScript keywords
        if (!['true', 'false', 'null', 'undefined', 'if', 'else', 'return', 'var', 'let', 'const'].includes(entityName)) {
          referencedEntities.add(entityName);
        }
      }
    }

    // Check if referenced entities match changed data sources
    for (const entityName of referencedEntities) {
      // Check if entity name directly matches a changed DataSource
      if (this.systemsManager.dataSourceManager) {
        const dataSource = this.systemsManager.dataSourceManager.getSource(entityName);
        if (dataSource && changedIds.includes(dataSource.cfg?.entity)) {
          lcardsLog.debug(`[BaseOverlayUpdater] 🔗 Content references changed DataSource: ${entityName}`);
          return true;
        }

        // Check for dot notation references (e.g., temperature_enhanced.transformations.celsius)
        if (entityName.includes('.')) {
          const baseSourceName = entityName.split('.')[0];
          const baseDataSource = this.systemsManager.dataSourceManager.getSource(baseSourceName);
          if (baseDataSource && changedIds.includes(baseDataSource.cfg?.entity)) {
            lcardsLog.debug(`[BaseOverlayUpdater] 🔗 Content references changed DataSource via dot notation: ${entityName} -> ${baseSourceName}`);
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Check if a DataSource ID matches any of the changed entities
   * @private
   * @param {string} dataSourceId - DataSource identifier
   * @param {Array<string>} changedIds - Array of changed entity IDs
   * @returns {boolean} True if DataSource matches changed entity
   */
  _dataSourceMatchesChangedEntities(dataSourceId, changedIds) {
    if (!dataSourceId || !this.systemsManager.dataSourceManager) return false;

    const dataSource = this.systemsManager.dataSourceManager.getSource(dataSourceId);
    if (!dataSource) return false;

    const entityId = dataSource.cfg?.entity;
    if (!entityId) return false;

    return changedIds.includes(entityId);
  }

  /**
   * Generic overlay update logic
   * @private
   * @param {string} overlayId - Overlay identifier
   * @param {Object} overlay - Overlay configuration
   * @param {Object} sourceData - Updated source data
   */
  _updateGenericOverlay(overlayId, overlay, sourceData) {
    lcardsLog.debug(`[BaseOverlayUpdater] Generic update for ${overlay.type} overlay ${overlayId}`);
    // Could implement generic template processing here
  }

  /**
   * Helper methods for determining update needs
   */

  /**
   * Find DataSource ID for given entity ID
   * @private
   * @param {string} entityId - Entity identifier
   * @returns {string|null} DataSource ID or null if not found
   */
  _findDataSourceForEntity(entityId) {
    if (this.systemsManager.dataSourceManager) {
      for (const [sourceId, source] of this.systemsManager.dataSourceManager.sources || new Map()) {
        if (source.cfg && source.cfg.entity === entityId) {
          return sourceId;
        }
      }
    }
    return null;
  }
}