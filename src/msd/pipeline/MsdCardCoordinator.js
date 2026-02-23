import { AdvancedRenderer } from '../renderer/AdvancedRenderer.js';
import { MsdControlsRenderer } from '../controls/MsdControlsRenderer.js';
import { DataSourceManager } from '../../core/data-sources/DataSourceManager.js';
import { RouterCore } from '../routing/RouterCore.js';
import { lcardsLog } from '../../utils/lcards-logging.js';
import { lcardsCore } from '../../core/lcards-core.js';
import { deepMerge } from '../../core/config-manager/merge-helpers.js';
import { DebugManager } from '../debug/DebugManager.js';

// Import animation system components
// AnimationManager now imported as shared singleton from lcardsCore
import { processAnimationConfig } from '../../core/animation/AnimationConfigProcessor.js';

import { BaseService } from '../../core/BaseService.js';

export class MsdCardCoordinator extends BaseService {
  constructor() {
    super();
    // Initialize core managers
    this.themeManager = null; // Will be set to shared core ThemeManager in initializeSystemsWithPacksFirst

    this.stylePresetManager = null; // Will be set to shared core StylePresetManager

    this.dataSourceManager = null;
    this.renderer = null;
    this.controlsRenderer = null;
    this.router = null;
    this.animRegistry = null; // Will be set to shared core AnimationRegistry
    this.animationManager = null; // Animation system
    this.debugManager = new DebugManager();
    this._renderTimeout = null;
    this._reRenderCallback = null;
    this._queuedReRender = false; // ADDED: Flag for queued renders
    this._debugControlsRendering = false;
    this.mergedConfig = null; // Store for entity change handler

    // PHASE 1: Single source of truth for HASS (old properties removed in Step 3C)
    this._hass = null;

    this.styleResolver = null;

    // ADDED: Render progress tracking with automatic queue execution
    this._internalRenderInProgress = false;
    Object.defineProperty(this, '_renderInProgress', {
      get() {
        return this._internalRenderInProgress;
      },
      set(value) {
        const oldValue = this._internalRenderInProgress;
        this._internalRenderInProgress = value;

        // CRITICAL FIX: Execute queued render when render completes (true → false)
        if (oldValue === true && value === false && this._queuedReRender) {
          lcardsLog.trace('[MsdCardCoordinator] 🔄 Executing queued re-render (render completed)');
          this._queuedReRender = false;

          setTimeout(() => {
            if (!this._internalRenderInProgress && this._reRenderCallback) {
              lcardsLog.trace('[MsdCardCoordinator] 🚀 Executing queued re-render callback');
              try {
                this._reRenderCallback();
              } catch (error) {
                lcardsLog.error('[MsdCardCoordinator] ❌ Queued re-render failed:', error);
              }
            }
          }, 50);
        }
      }
    });

    // DEPRECATED: Overlay renderer registry removed (v1.16.22+)
    // Old pattern: Custom overlay renderer classes (ButtonOverlay, ApexChartsOverlayRenderer, etc.)
    // New pattern: Unified card overlays (LCARdS cards, HA cards) handle their own lifecycle
    // No registry needed - all overlays use MsdControlsRenderer for embedding
  }

  /**
   * Initialize systems with pack defaults loading FIRST
   * This ensures defaults are available before any overlay processing
   *
   * Now uses global core managers (no local pack loading)
   */
  async initializeSystemsWithPacksFirst(mergedConfig, mountEl, hass) {
    lcardsLog.trace('[MsdCardCoordinator] 🚀 Enhanced initialization: using global core managers');

    // Store config and HASS context immediately
    this.mergedConfig = mergedConfig;
    this._hass = hass; // PHASE 1: Use single source

    // Use shared core ThemeManager singleton (real MSD class)
    lcardsLog.trace('[MsdCardCoordinator] 🔗 Using shared core ThemeManager singleton');
    if (!lcardsCore.themeManager) {
      throw new Error('lcardsCore.themeManager is null - core not initialized?');
    }
    this.themeManager = lcardsCore.themeManager;

    // PHASE 1: Theme system already initialized by core - just verify
    lcardsLog.trace('[MsdCardCoordinator] 🎨 Initializing theme system');

    const activeTheme = this.themeManager.getActiveTheme();
    if (!activeTheme) {
      lcardsLog.warn('[MsdCardCoordinator] ⚠️ No active theme - theme system may not be ready');
    }

    // Log theme provenance
    lcardsLog.debug('[MsdCardCoordinator] ✅ Theme system ready');

    // Store in global namespace for access by overlays
    if (typeof window !== 'undefined') {
      window.lcards = window.lcards || {};
      // Compatibility shim — renderers that predate core.themeManager read from here. Remove when all callers migrated.
      window.lcards.theme = this.themeManager;
      window.lcards.debug.msd.themeProvenance = mergedConfig.__provenance?.theme;
    }

    // PHASE 2: Initialize other critical systems that overlays might need
    lcardsLog.trace('[MsdCardCoordinator] ⚙️ Initializing per-card systems');

    // Initialize debug manager early with config
    const debugConfig = mergedConfig.debug || {};
    this.debugManager.init(debugConfig);
    lcardsLog.trace('[MsdCardCoordinator] DebugManager initialized with config:', debugConfig);

    // Initialize data source manager FIRST (overlays may reference it)
    await this._initializeDataSources(hass, mergedConfig);

    // Use shared StylePresetManager singleton from lcardsCore (already initialized by core)
    if (!lcardsCore.stylePresetManager) {
      throw new Error('lcardsCore.stylePresetManager is null - core not initialized?');
    }
    this.stylePresetManager = lcardsCore.stylePresetManager;

    // Verify it's initialized (should already be done by core)
    if (!this.stylePresetManager.initialized) {
      lcardsLog.warn('[MsdCardCoordinator] ⚠️ StylePresetManager not initialized - this should not happen');
    }

    lcardsLog.trace('[MsdCardCoordinator] ✅ Connected to core singletons', {
      theme: !!this.themeManager,
      stylePresets: !!this.stylePresetManager,
      dataSourceManager: !!this.dataSourceManager
    });

    lcardsLog.trace('[MsdCardCoordinator] ✅ Critical systems ready for overlay processing');
  }

  /**
   * Complete systems initialization after card model is built
   * This is the second phase that happens after overlays can safely be processed
   */
  async completeSystems(mergedConfig, cardModel, mountEl, hass) {
    lcardsLog.trace('[MsdCardCoordinator] 🔧 Completing systems initialization');

    // REMOVED: RulesEngine setup - now handled by card via _registerOverlayForRules()
    // The MSD card registers its overlays with the core rulesManager singleton,
    // which evaluates rules globally and notifies cards via callbacks.
    // This matches the pattern used by all other LCARdS cards (button, slider, etc.)

    // REMOVED: RulesEngine callback setup - now handled by core rulesManager singleton
    // MSD card registers overlays via _registerOverlayForRules() and receives callbacks

    // Initialize rendering systems
    // Pass channels from msd.channels into routing config for RouterCore
    const routingConfig = {
      ...mergedConfig.routing,
      channels: mergedConfig.channels  // Add channels from msd root level
    };
    this.router = new RouterCore(routingConfig, cardModel.anchors, cardModel.viewBox);
    this.renderer = new AdvancedRenderer(mountEl, this.router, this); // Pass 'this' as systemsManager
    this.controlsRenderer = new MsdControlsRenderer(this.renderer);

    // ADDED: Set HASS context on controls renderer immediately if available
    if (this._hass && this.controlsRenderer) {
      lcardsLog.trace('[MsdCardCoordinator] Setting initial HASS context on controls renderer');
      this.controlsRenderer.setHass(this._hass);
    }

    // Mark router as ready for debug system
    this.debugManager.markRouterReady();

    // Use shared AnimationRegistry and AnimationManager from lcardsCore
    if (!lcardsCore.animationRegistry) {
      throw new Error('lcardsCore.animationRegistry is null - core not initialized?');
    }
    this.animRegistry = lcardsCore.animationRegistry;

    if (!lcardsCore.animationManager) {
      throw new Error('lcardsCore.animationManager is null - core not initialized?');
    }
    this.animationManager = lcardsCore.animationManager;

    // Register MSD panels with global HUD if card GUID is available
    if (this._cardGuid) {
      this._registerMsdPanelsWithHud(this._cardGuid);
    }

    lcardsLog.debug('[MsdCardCoordinator] ✅ All systems initialization complete');
  }

  setReRenderCallback(callback) {
    this._reRenderCallback = callback;
  }

  // ============================================================================
  // REMOVED METHOD: _createEntityChangeHandler() - 293 lines removed
  // ============================================================================
  // This complex handler was removed in Phase 1 Step 3B of the architecture refactor.
  //
  // What it did:
  // - Created a closure that handled entity changes with setTimeout delays (10ms, 25ms)
  // - Manually managed _originalHass and _currentHass state copies
  // - Applied template conversions and rule evaluations with multiple phases
  // - Used setTimeout hacks to sequence operations
  //
  // Replaced by:
  // - ingestHassV2() for full HASS updates
  // - DataSource subscriptions for real-time entity updates (primary path)
  // - RulesEngine.ingestHass() for rule evaluation
  //
  // Benefits of new architecture:
  // - Single source of truth (_hass)
  // - No setTimeout delays
  // - Cleaner separation of concerns
  // - Real-time subscriptions remain the primary update mechanism
  // ============================================================================


  // ============================================================================
  // REMOVED METHODS: setOriginalHass(), getCurrentHass(), getOriginalHass()
  // ============================================================================
  // These methods were removed in Phase 1 Step 3B of the architecture refactor.
  //
  // setOriginalHass(hass) - Set original HASS copy
  // getCurrentHass() - Get working HASS copy
  // getOriginalHass() - Get pristine HASS copy
  //
  // Replaced by:
  // - ingestHassV2(hass) - Single entry point for HASS updates
  // - getHassV2() - Single source getter
  //
  // Reason for removal: Multiple HASS copies caused state synchronization issues
  // ============================================================================
  // REMOVED: _instrumentRulesEngine - RulesEngine now managed by core singleton
  // Performance tracking should be added to core rulesManager if needed globally

  async _initializeDataSources(hass, mergedConfig) {
    this.dataSourceManager = null;

    // ENHANCED: Better logging and error handling
    if (!hass) {
      lcardsLog.warn('[MsdCardCoordinator] No HASS provided - DataSourceManager will not be initialized');
      return;
    }

    // PHASE 1: Pre-register entity change listener BEFORE creating data sources
    // This ensures the listener is ready when data source subscriptions are set up
    this._entityChangeListenerRegistered = false;

    // Use configured data sources
    const configuredDataSources = mergedConfig.data_sources || {};

    // Controls use direct HASS - no data sources needed
    const controlEntities = this._extractControlEntities(mergedConfig);

    // Use configured data sources
    const allDataSources = { ...configuredDataSources };

    // Only log if data sources actually configured (avoid noise for common case)
    if (Object.keys(configuredDataSources).length > 0 || controlEntities.length > 0) {
      lcardsLog.trace('[MsdCardCoordinator] 📊 Data sources configured', {
        configured: Object.keys(configuredDataSources).length,
        controls: controlEntities.length,
        total: Object.keys(allDataSources).length
      });
    }

    if (Object.keys(allDataSources).length === 0) {
      lcardsLog.trace('[MsdCardCoordinator] No data sources configured or auto-created - DataSourceManager will not be initialized');
      return;
    }

    lcardsLog.trace('[MsdCardCoordinator] Initializing DataSourceManager with', Object.keys(allDataSources).length, 'data sources');

    try {
      // ✅ Use shared core DataSourceManager singleton (real MSD class)
      lcardsLog.trace('[MsdCardCoordinator] 🔗 Using shared core DataSourceManager singleton');
      if (!lcardsCore.dataSourceManager) {
        throw new Error('lcardsCore.dataSourceManager is null - core not initialized?');
      }
      this.dataSourceManager = lcardsCore.dataSourceManager;

      // PHASE 1: Register entity change listener BEFORE initializing data sources
      // This ensures subscriptions created during initialization can trigger the listener
      this.dataSourceManager.addEntityChangeListener((changedIds) => {
        // CRITICAL: Sync our HASS with DataSourceManager's updated HASS
        // Real-time entity updates come via DataSource subscriptions, which update
        // DataSourceManager.hass but NOT SystemsManager._hass. We need to sync them!
        if (this.dataSourceManager && this.dataSourceManager.hass) {
          this._hass = this.dataSourceManager.hass;
        }

        // REMOVED: RulesEngine dirty marking - now handled by core rulesManager singleton
        // Core rulesManager receives entity changes via BaseService and evaluates globally
      });

      lcardsLog.trace('[MsdCardCoordinator] ✅ Entity change listener configured for rule evaluation (BEFORE data source init)');
      this._entityChangeListenerRegistered = true;

      const sourceCount = await this.dataSourceManager.initializeFromConfig(allDataSources);
      lcardsLog.trace('[MsdCardCoordinator] ✅ DataSourceManager initialized -', sourceCount, 'sources started');

      // ADDED: Verify entities are available
      const entityIds = this.dataSourceManager.listIds();
      lcardsLog.trace('[MsdCardCoordinator] ✅ DataSourceManager entities available:', entityIds);

    } catch (error) {
      lcardsLog.error('[MsdCardCoordinator] ❌ DataSourceManager initialization failed:', error);
      lcardsLog.error('[MsdCardCoordinator] Error details:', error.stack);
      this.dataSourceManager = null;
    }
  }

  /**
   * Extract entity IDs from control overlays for auto data source creation
   */
  _extractControlEntities(mergedConfig) {
    const entities = new Set();

    // Extract from overlays
    const overlays = mergedConfig.overlays || [];
    overlays.forEach(overlay => {
      if (overlay.type === 'control' && overlay.card) {
        // Check multiple possible entity locations
        const entity = overlay.card.config?.entity ||
                      overlay.card.config?.variables?.entity ||
                      overlay.card.entity;

        if (entity) {
          entities.add(entity);
        }
      }
    });

    // Extract from any other control configurations
    // (Add more extraction logic here as needed)

    return Array.from(entities);
  }


  async destroy() {



    // Stop all subscriptions and clean up resources
    this.dataSourceManager?.destroy();
    this.animRegistry?.clear();
    if (this.controlsRenderer && typeof this.controlsRenderer.destroy === 'function') {
      this.controlsRenderer.destroy();
    }
    if (this.renderer && typeof this.renderer.destroy === 'function') {
      this.renderer.destroy();
    }

    if (this.styleResolver) {
      try {
        this.styleResolver.invalidateCache('overlay');
        lcardsLog.trace('[MsdCardCoordinator] StyleResolver overlay cache invalidated');
      } catch (error) {
        lcardsLog.error('[MsdCardCoordinator] StyleResolver cleanup error:', error);
      }
    }

    // Clear timeouts and callbacks
    if (this._renderTimeout) {
      clearTimeout(this._renderTimeout);
      this._renderTimeout = null;
    }
    this._reRenderCallback = null;

    // Clear per-card references only
    this.mountElement = null;
    this.cardModel = null;
    this.styleResolver = null;
    this.renderer = null;
    this.controlsRenderer = null;
    this.router = null;
    this.debugManager = null;

    // DO NOT null singleton references - they are shared across all cards!
    // These remain accessible from window.lcards.core for other cards:
    // - this.dataSourceManager
    // - this.rulesEngine
    // - this.themeManager
    // - this.animationManager
    // - this.stylePresetManager
    // - this.animRegistry

    // Remove global references
    if (typeof window !== 'undefined' && window.lcards.debug.msd) {
      delete window.lcards.debug.msd.pipelineInstance;
      delete window.lcards.debug.msd.systemsManager;
    }
  }

  /**
   * Render debug overlays and controls using DebugManager with basic performance tracking
   * @param {Object} resolvedModel - The resolved model
   * @param {Element} mountEl - The shadowRoot/mount element
   */
  async renderDebugAndControls(resolvedModel, mountEl = null) {
    // ADDED: Early exit if already rendering
    if (this._debugControlsRendering) {
      lcardsLog.debug('[MsdCardCoordinator] renderDebugAndControls already in progress, skipping');
      return;
    }

    this._debugControlsRendering = true;

    try {
      const debugState = this.debugManager.getSnapshot();

      lcardsLog.debug('[MsdCardCoordinator] renderDebugAndControls called:', {
        anyEnabled: this.debugManager.isAnyEnabled(),
        controlOverlays: resolvedModel.overlays.filter(o => o.type === 'control').length,
        hasHass: !!this._hass,
        hasResolvedModel: !!resolvedModel,
        hasOverlays: !!resolvedModel?.overlays
      });

      // ADDED: Validate resolved model
      if (!resolvedModel || !resolvedModel.overlays) {
        lcardsLog.warn('[MsdCardCoordinator] Invalid resolved model for renderDebugAndControls');
        return;
      }

      // Render debug visualizations with error boundary
      if (this.debugManager.isAnyEnabled()) {
        try {
          // ✅ FIX: Resolve anchor names to coordinates for debug renderer
          // Debug renderer expects position: [x, y] but overlays have position: 'anchor_name'
          const resolvedOverlays = resolvedModel.overlays.map(overlay => {
            if (overlay.position && typeof overlay.position === 'string') {
              // Position is anchor name - resolve to coordinates
              const coords = resolvedModel.anchors[overlay.position];
              if (coords) {
                return { ...overlay, position: coords };
              }
            }
            return overlay;
          });

          const debugOptions = {
            anchors: resolvedModel.anchors || {},
            overlays: resolvedOverlays,  // Use resolved overlays
            router: this.router,  // Pass router for routing debug visualization
            showAnchors: debugState.anchors,
            showBoundingBoxes: debugState.bounding_boxes,
            showRouting: this.debugManager.canRenderRouting(),
            showPerformance: debugState.performance,
            scale: debugState.scale
          };

          lcardsLog.debug('[MsdCardCoordinator] 🔍 DEBUG - Debug options:', {
            overlayCount: debugOptions.overlays.length,
            hasRouter: !!debugOptions.router,
            routerHasOverlays: !!this.router?.overlays,
            routerHasInspect: typeof this.router?.inspect === 'function',
            canRenderRouting: this.debugManager.canRenderRouting(),
            flags: {
              anchors: debugState.anchors,
              boundingBoxes: debugState.bounding_boxes,
              routing: debugState.routing,
              performance: debugState.performance
            }
          });

          // REMOVED: Debug rendering now handled by Studio dialog overlays
          // MsdDebugRenderer.js has been deleted - all debug visualization
          // is done via HTML overlays in lcards-msd-studio-dialog.js
          lcardsLog.debug('[MsdCardCoordinator] ✅ Debug state updated (rendering in Studio)');
        } catch (error) {
          lcardsLog.error('[MsdCardCoordinator] ❌ Debug state update failed:', error);
          // Continue execution - don't fail the entire render
        }
      }

      // FIXED: Render control overlays with comprehensive error handling
      // NOTE: Control overlays are now rendered by AdvancedRenderer during Phase 2a
      // This prevents duplicate rendering. We only keep debug visualization here.
      const controlOverlays = resolvedModel.overlays.filter(o => o.type === 'control');
      if (controlOverlays.length > 0) {
        lcardsLog.debug('[MsdCardCoordinator] Control overlays detected (rendered by AdvancedRenderer):', controlOverlays.map(c => c.id));

        // The code below is disabled to prevent duplicate foreignObjects in SVG
        /*
        try {
          if (!this.controlsRenderer) {
            lcardsLog.error('[MsdCardCoordinator] No controls renderer available');
            return;
          }

          if (this._hass && this.controlsRenderer) {
            this.controlsRenderer.setHass(this._hass);
            lcardsLog.debug('[MsdCardCoordinator] HASS context applied to controls renderer');
          } else {
            lcardsLog.warn('[MsdCardCoordinator] No HASS context available for controls');
          }

          await this.controlsRenderer.renderControls(controlOverlays, resolvedModel);
          lcardsLog.info('[MsdCardCoordinator] ✅ Controls rendered successfully');

        } catch (error) {
          lcardsLog.error('[MsdCardCoordinator] ❌ Controls rendering failed:', error);
          lcardsLog.error('[MsdCardCoordinator] Error details:', error.stack);
        }
        */
      }

    } catch (error) {
      lcardsLog.error('[MsdCardCoordinator] renderDebugAndControls failed completely:', error);
      lcardsLog.error('[MsdCardCoordinator] Error stack:', error.stack);
    } finally {
      this._debugControlsRendering = false;
    }
  }

  /**
   * Check if debug should be rendered based on config
   * @param {Object} debugConfig - Debug configuration
   * @returns {boolean} Whether debug should be rendered
   */
  _shouldRenderDebugFromConfig(debugConfig) {
    if (!debugConfig || !debugConfig.overlays) return false;

    return debugConfig.overlays.anchors ||
          debugConfig.overlays.bounding_boxes ||
          debugConfig.overlays.routing ||
          debugConfig.overlays.performance;
  }

  /**
   * Legacy debug flag support (for backward compatibility)
   * @returns {Object} Debug flags
   */
  _getDebugFlags() {
    return window.lcards?._debugFlags || {};
  }

  /**
   * Legacy debug check (for backward compatibility)
   * @param {Object} debugFlags - Debug flags
   * @returns {boolean} Whether debug should be rendered
   */
  _shouldRenderDebug(debugFlags) {
    return debugFlags && (debugFlags.overlay || debugFlags.connectors || debugFlags.geometry);
  }

  // Public API methods - now exclusively using DataSourceManager
  ingestHass(hass) {
    lcardsLog.debug('[MsdCardCoordinator] ingestHass called with:', {
      hasHass: !!hass,
      hasStates: !!hass?.states,
      entityCount: hass?.states ? Object.keys(hass.states).length : 0,
      hasLightDesk: !!hass?.states?.['light.desk'],
      lightDeskState: hass?.states?.['light.desk']?.state,
      timestamp: new Date().toISOString(),
      manualHassForwarding: this.controlsRenderer?._manualHassForwarding
    });

    if (!hass || !hass.states) {
      lcardsLog.warn('[MsdCardCoordinator] ingestHass called without valid hass.states');
      return;
    }

    // PHASE 1: Update single source of truth
    this._hass = hass;

    lcardsLog.debug('[MsdCardCoordinator] Updated _hass with fresh data');

    // ⚠️ FEATURE FLAG: Manual HASS Forwarding
    // Pass HASS to controls renderer - behavior depends on feature flag
    if (this.controlsRenderer) {
      const mode = this.controlsRenderer._manualHassForwarding ? 'MANUAL' : 'AUTOMATIC';
      lcardsLog.info(`[MsdCardCoordinator] 📡 HASS propagation mode: ${mode}`);
      lcardsLog.debug('[MsdCardCoordinator] Calling controlsRenderer.setHass() - see MsdControlsRenderer logs for distribution details');
      this.controlsRenderer.setHass(hass);
    } else {
      lcardsLog.warn('[MsdCardCoordinator] No controls renderer available for HASS update');
    }

    // DataSources handle HASS updates automatically via their subscriptions
    // No manual ingestion needed - handled by individual data sources
    lcardsLog.debug('[MsdCardCoordinator] HASS ingestion complete - data sources handle updates via subscriptions');
  }

  updateEntities(map) {
    if (!map || typeof map !== 'object') return;

    lcardsLog.debug('[MsdCardCoordinator] Manual entity updates not supported in DataSources system');
    lcardsLog.warn('[MsdCardCoordinator] Use direct HASS state updates instead of manual entity updates');
  }

  // Entity API methods using DataSourceManager
  listEntities() {
    return this.dataSourceManager ? this.dataSourceManager.listIds() : [];
  }

  getEntity(id) {
    return this.dataSourceManager ? this.dataSourceManager.getEntity(id) : null;
  }

  // ============================================================================
  // REMOVED METHOD: setupDirectHassSubscription() - ~200 lines removed
  // ============================================================================
  // This method was removed in Phase 1 Step 3B of the architecture refactor.
  //
  // What it did:
  // - Set up WebSocket subscription to state_changed events
  // - Manually updated _originalHass and _currentHass on every entity change
  // - Forwarded HASS to controls for control entities
  // - Created duplicate update path alongside DataSource subscriptions
  //
  // Replaced by:
  // - DataSource subscriptions handle real-time entity updates (primary path)
  // - ingestHass() handles full HASS refreshes (initialization, reconnection)
  // - Single source of truth in _hass property
  //
  // Reason for removal: Duplicate update path, manual HASS management, state sync issues
  // ============================================================================

  /**
   * Set up global HUD interface (placeholder for future implementation)
   * @private
   */
  // Rules are now evaluated by core rulesManager singleton
  // MSD card receives callbacks via _onRulePatchesChanged() when rules affect it
  // Entity change tracking and dirty marking handled by core RulesEngine._handleRuleEntityChange()

  // ============================================================================
  // INCREMENTAL UPDATE SYSTEM (Phase 1)
  // ============================================================================



  /**
   * Find overlay configuration by ID
   * @private
   * @param {string} overlayId - Overlay ID
   * @returns {Object|null} Overlay config or null
   */
  _findOverlayById(overlayId) {
    const resolvedModel = this.modelBuilder?.getResolvedModel?.();
    if (!resolvedModel?.overlays) return null;

    return resolvedModel.overlays.find(o => o.id === overlayId) || null;
  }

  /**
   * Apply base_svg filter update from rule
   * @param {Object} baseSvgConfig - base_svg configuration from rule.apply.base_svg
   * @private
   */
  async _applyBaseSvgUpdate(baseSvgConfig) {
    if (!baseSvgConfig) return;

    try {
      // Find the base SVG content group (not the root SVG element)
      const mountEl = this.renderer?.mountEl;

      lcardsLog.debug('[MsdCardCoordinator] 🔍 Searching for base content group:', {
        hasMountEl: !!mountEl,
        mountElTag: mountEl?.tagName,
        svgExists: !!mountEl?.querySelector('svg'),
        allSvgGroups: Array.from(mountEl?.querySelectorAll('svg g') || []).map(g => g.id).filter(id => id)
      });

      const baseSvgElement = mountEl?.querySelector('#__msd-base-content');

      if (!baseSvgElement) {
        lcardsLog.warn('[MsdCardCoordinator] Cannot update base SVG filters - base content group not found');
        lcardsLog.debug('[MsdCardCoordinator] Available groups in SVG:',
          Array.from(mountEl?.querySelectorAll('svg g') || []).map(g => ({
            id: g.id,
            tagName: g.tagName
          }))
        );
        return;
      }

      lcardsLog.debug('[MsdCardCoordinator] ✅ Found base content group:', {
        id: baseSvgElement.id,
        tagName: baseSvgElement.tagName
      });

      // Resolve filters (preset or explicit)
      let filters = null;

      if (baseSvgConfig.filter_preset) {
        const preset = this.themeManager?.getFilterPreset(baseSvgConfig.filter_preset);
        if (preset) {
          filters = { ...preset };
          lcardsLog.debug(`[MsdCardCoordinator] Resolved filter preset '${baseSvgConfig.filter_preset}':`, filters);
        } else {
          lcardsLog.warn(`[MsdCardCoordinator] Unknown filter preset: ${baseSvgConfig.filter_preset}`);
          return;
        }
      }

      // Merge explicit filters
      if (baseSvgConfig.filters) {
        // If filters is an array (new format), use it directly
        if (Array.isArray(baseSvgConfig.filters)) {
          filters = baseSvgConfig.filters;
          lcardsLog.debug('[MsdCardCoordinator] Using array-based filters:', filters);
        } else {
          // Legacy object format - merge with preset
          filters = filters ? { ...filters, ...baseSvgConfig.filters } : { ...baseSvgConfig.filters };
        }
      }

      // Check if this is a clear/remove operation (preset: "none" or empty filters)
      const isClearOperation = baseSvgConfig.filter_preset === 'none' ||
                               (filters && (
                                 (Array.isArray(filters) && filters.length === 0) ||
                                 (!Array.isArray(filters) && Object.keys(filters).length === 0)
                               ));

      const transition = baseSvgConfig.transition || 1000; // Default 1s transition

      if (isClearOperation || !filters) {
        // Clear filters (remove all filtering)
        const { clearBaseSvgFilters } = await import('../utils/BaseSvgFilters.js');
        clearBaseSvgFilters(baseSvgElement, transition);
        lcardsLog.debug(`[MsdCardCoordinator] ✅ Cleared base SVG filters`);
        return;
      }

      // Apply the filters with transition
      const { transitionBaseSvgFilters } = await import('../utils/BaseSvgFilters.js');
      await transitionBaseSvgFilters(baseSvgElement, filters, transition);

      lcardsLog.debug(`[MsdCardCoordinator] ✅ Applied base SVG filters:`, filters);
    } catch (error) {
      lcardsLog.error('[MsdCardCoordinator] Failed to apply base SVG filter update:', error);
    }
  }

  /**
   * Schedule a full re-render with proper queuing
   * @private
   */
  _scheduleFullReRender() {
    lcardsLog.info('[MsdCardCoordinator] 📅 SCHEDULED full re-render (100ms delay)');

    if (this._renderTimeout) {
      lcardsLog.debug('[MsdCardCoordinator] ⏰ Clearing existing render timeout');
      clearTimeout(this._renderTimeout);
    }

    // Safe re-render for data source changes
    this._renderTimeout = setTimeout(() => {
      if (this._reRenderCallback && !this._renderInProgress) {
        try {
          this._renderInProgress = true;
          lcardsLog.info('[MsdCardCoordinator] 🚀 EXECUTING full re-render from rule change timeout');
          this._reRenderCallback();
        } catch (error) {
          lcardsLog.error('[MsdCardCoordinator] ❌ Re-render FAILED in entity change handler:', error);
        } finally {
          this._renderInProgress = false;
        }
      } else {
        lcardsLog.warn('[MsdCardCoordinator] ⚠️ Re-render NOT triggered:', {
          hasCallback: !!this._reRenderCallback,
          renderInProgress: this._renderInProgress
        });
      }
      this._renderTimeout = null;
    }, 100);
  }

  /**
   * Update text overlays when DataSource entities change
   * @param {Array} changedIds - Entity IDs that changed
   * @private
   */

  // REMOVED METHOD: _updateTextOverlaysForDataSourceChanges
  // This method was deprecated and is no longer needed since text overlays
  // have been replaced by LCARdS cards.
  // Deleted in Phase 0 of architecture refactor.

  // REMOVED METHOD: _findDataSourceForEntity
  // This was only used by _updateTextOverlaysForDataSourceChanges.
  // Deleted in Phase 0 of architecture refactor.

  // ============================================================================
  // PHASE 1: HASS Management Methods (Completed - Phase 3D renamed V2 methods)
  // ============================================================================

  /**
   * Ingest fresh HASS and propagate to all systems in correct order
   * Single source of truth for HASS (renamed from ingestHassV2 in Phase 3D)
   * @param {Object} hass - Home Assistant state object
   */
  ingestHass(hass) {
    if (!hass || !hass.states) {
      lcardsLog.warn('[MsdCardCoordinator] ingestHass: Invalid HASS provided');
      return;
    }

    lcardsLog.debug('[MsdCardCoordinator] 📥 ingestHass: Ingesting fresh HASS:', {
      entityCount: Object.keys(hass.states).length,
      timestamp: new Date().toISOString()
    });

    // Store in single source of truth
    this._hass = hass;

    // Propagate to subsystems in correct order
    this._propagateHassToSystems(hass);
  }

  /**
   * Propagate HASS to subsystems in correct order
   * ORDER MATTERS: DataSourceManager → RulesEngine → Controls
   * (renamed from _propagateHassToSystemsV2 in Phase 3D)
   * @private
   */
  _propagateHassToSystems(hass) {
    lcardsLog.debug('[MsdCardCoordinator] 🔄 _propagateHassToSystems: Starting ordered propagation');

    // 1. DataSourceManager first (provides entity values)
    let dataSourceResult = { hasChanges: true, changedCount: 0, totalCount: 0 };
    if (this.dataSourceManager && typeof this.dataSourceManager.ingestHass === 'function') {
      lcardsLog.debug('[MsdCardCoordinator] 📊 Propagating to DataSourceManager');
      dataSourceResult = this.dataSourceManager.ingestHass(hass) || { hasChanges: true, changedCount: 0, totalCount: 0 };
    } else {
      lcardsLog.debug('[MsdCardCoordinator] ⏭️ DataSourceManager not ready or no ingestHass method');
    }


    // The core rulesManager receives HASS updates automatically and evaluates rules globally
    // MSD overlays are registered via _registerOverlayForRules() and receive callbacks

    // 3. Controls third (direct HASS access)
    if (this.controlsRenderer) {
      lcardsLog.debug('[MsdCardCoordinator] 🎮 Propagating to Controls');
      this.controlsRenderer.setHass(hass);
    } else {
      lcardsLog.debug('[MsdCardCoordinator] ⏭️ Controls not ready');
    }

    // 4. Overlays update automatically via DataSource subscriptions
    lcardsLog.debug('[MsdCardCoordinator] ✅ _propagateHassToSystems: Propagation complete');
  }

  /**
   * Get current HASS (single source of truth)
   * (renamed from getHassV2 in Phase 3D)
   * @returns {Object} Current Home Assistant state
   */
  getHass() {
    return this._hass;
  }

  /**
   * Get the resolved model from ModelBuilder
   * @returns {Object} Resolved model with overlays
   */
  getResolvedModel() {
    return this.modelBuilder?.getResolvedModel();
  }
}

// CLEANUP NOTE: Text overlays have been removed and replaced by LCARdS cards
// All overlay-specific update logic has been removed as LCARdS cards handle
// their own lifecycle and updates.

