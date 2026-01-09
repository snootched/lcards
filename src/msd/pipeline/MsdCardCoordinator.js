import { AdvancedRenderer } from '../renderer/AdvancedRenderer.js';
import { MsdDebugRenderer } from '../debug/MsdDebugRenderer.js';
import { MsdControlsRenderer } from '../controls/MsdControlsRenderer.js';
// REMOVED: MsdHudManager - now using global HudManager from core
import { DataSourceManager } from '../../core/data-sources/DataSourceManager.js';
import { RouterCore } from '../routing/RouterCore.js';
import { lcardsLog } from '../../utils/lcards-logging.js';
import { lcardsCore } from '../../core/lcards-core.js';
import { AnimationRegistry } from '../../core/animation/AnimationRegistry.js';
import { ThemeManager } from '../../core/themes/ThemeManager.js';
import { deepMerge } from '../../core/config-manager/merge-helpers.js';
import { RulesEngine } from '../../core/rules/RulesEngine.js';
import { DebugManager } from '../debug/DebugManager.js';

import { StylePresetManager } from '../../core/presets/StylePresetManager.js';

// Import MSD-specific HUD panels
import { RoutingPanel } from '../hud/panels/RoutingPanel.js';
import { OverlaysPanel } from '../hud/panels/OverlaysPanel.js';
import { ChannelTrendPanel } from '../hud/panels/ChannelTrendPanel.js';

// Import theme system initialization
import { initializeThemeSystem } from '../../core/themes/initializeThemeSystem.js';

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
    this.debugRenderer = null;
    this.controlsRenderer = null;
    this.hudManager = null;
    this.router = null;
    this.animRegistry = null; // Will be set to shared core AnimationRegistry
    this.animationManager = null; // Animation system
    this.rulesEngine = null;
    this.debugManager = new DebugManager();
    this._renderTimeout = null;
    this._reRenderCallback = null;
    this._queuedReRender = false; // ADDED: Flag for queued renders
    this._debugControlsRendering = false;
    this.mergedConfig = null; // Store for entity change handler

    // PHASE 1: Single source of truth for HASS (old properties removed in Step 3C)
    this._hass = null;

    // Keep _previousRuleStates for threshold crossing detection
    this._previousRuleStates = new Map();

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
          lcardsLog.debug('[MsdCardCoordinator] 🔄 Executing queued re-render (render completed)');
          this._queuedReRender = false;

          setTimeout(() => {
            if (!this._internalRenderInProgress && this._reRenderCallback) {
              lcardsLog.debug('[MsdCardCoordinator] 🚀 Executing queued re-render callback');
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
    lcardsLog.debug('[MsdCardCoordinator] 🚀 Enhanced initialization: using global core managers');

    // Store config and HASS context immediately
    this.mergedConfig = mergedConfig;
    this._hass = hass; // PHASE 1: Use single source

    // Use shared core ThemeManager singleton (real MSD class)
    lcardsLog.debug('[MsdCardCoordinator] 🔗 Using shared core ThemeManager singleton');
    if (!lcardsCore.themeManager) {
      throw new Error('lcardsCore.themeManager is null - core not initialized?');
    }
    this.themeManager = lcardsCore.themeManager;

    // PHASE 1: Theme system already initialized by core - just verify
    lcardsLog.debug('[MsdCardCoordinator] 🎨 Initializing theme system');

    const activeTheme = this.themeManager.getActiveTheme();
    if (!activeTheme) {
      lcardsLog.warn('[MsdCardCoordinator] ⚠️ No active theme - theme system may not be ready');
    }

    // Log theme provenance
    lcardsLog.debug('[MsdCardCoordinator] 🎨 Initializing theme system');
    lcardsLog.debug('[MsdCardCoordinator] ✅ Theme system ready', {
      active: this.themeManager.getActiveTheme()?.name || 'none',
      themeCount: this.themeManager.listThemes().length
    });

    // Store in global namespace for access by overlays
    if (typeof window !== 'undefined') {
      window.lcards = window.lcards || {};
      window.lcards.theme = this.themeManager;
      window.lcards.debug.msd.themeProvenance = mergedConfig.__provenance?.theme;
    }

    // PHASE 2: Initialize other critical systems that overlays might need
    lcardsLog.debug('[MsdCardCoordinator] ⚙️ Initializing per-card systems');

    // Initialize debug manager early with config
    const debugConfig = mergedConfig.debug || {};
    this.debugManager.init(debugConfig);
    lcardsLog.debug('[MsdCardCoordinator] DebugManager initialized with config:', debugConfig);

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

    lcardsLog.debug('[MsdCardCoordinator] ✅ Connected to core singletons', {
      theme: !!this.themeManager,
      stylePresets: !!this.stylePresetManager,
      dataSourceManager: !!this.dataSourceManager
    });

    lcardsLog.debug('[MsdCardCoordinator] ✅ Critical systems ready for overlay processing');
  }

  /**
   * Complete systems initialization after card model is built
   * This is the second phase that happens after overlays can safely be processed
   */
  async completeSystems(mergedConfig, cardModel, mountEl, hass) {
    lcardsLog.debug('[MsdCardCoordinator] 🔧 Completing systems initialization');

    // Use shared RulesEngine singleton from lcardsCore and add this MSD's rules
    if (!lcardsCore.rulesManager) {
      throw new Error('lcardsCore.rulesManager is null - core not initialized?');
    }
    this.rulesEngine = lcardsCore.rulesManager;

    // CRITICAL: Add this MSD's rules to the shared RulesEngine
    if (mergedConfig.rules && mergedConfig.rules.length > 0) {
      lcardsLog.debug(`[MsdCardCoordinator] 📋 Adding ${mergedConfig.rules.length} rules from this MSD to shared RulesEngine`);

      // Get card ID for source tracking
      const sourceCardId = this._cardGuid || mergedConfig.id || 'unknown-msd';

      // Add rules to the shared engine's rules array
      mergedConfig.rules.forEach(rule => {
        if (rule.id) {
          // Check if rule already exists to avoid duplicates
          if (!this.rulesEngine.rulesById.has(rule.id)) {
            // Add metadata for tracking which card registered this rule
            rule._sourceCardId = sourceCardId;
            rule._sourceCardType = 'msd';

            this.rulesEngine.rules.push(rule);
            lcardsLog.debug(`[MsdCardCoordinator] ➕ Added rule: ${rule.id} (from ${sourceCardId})`);
          } else {
            lcardsLog.warn(`[MsdCardCoordinator] ⚠️ Rule ${rule.id} already exists in shared RulesEngine, skipping`);
          }
        }
      });

      // Rebuild the rules index and dependencies
      this.rulesEngine.buildRulesIndex();
      this.rulesEngine.buildDependencyIndex();
      this.rulesEngine._compileRules();  // Compile newly added rules
      lcardsLog.debug(`[MsdCardCoordinator] ✅ Rules added. Total rules in shared engine: ${this.rulesEngine.rules.length}`);
    } else {
      lcardsLog.debug('[MsdCardCoordinator] ℹ️ No rules to add from this MSD');
    }

    // ADDED: Give RulesEngine access to SystemsManager for HASS state lookup
    this.rulesEngine.systemsManager = this;

    this.rulesEngine.markAllDirty();
    this._instrumentRulesEngine(mergedConfig);

    // NEW: Set up rules engine HASS monitoring
    if (hass) {
      await this.rulesEngine.setupHassMonitoring(hass);

      // Connect re-evaluation to render pipeline
      // When rules are marked dirty (entity changes), evaluate and apply patches
      this.rulesEngine.setReEvaluationCallback(async () => {  // async for Jinja2
        lcardsLog.debug('[MsdCardCoordinator] 🔄 RulesEngine re-evaluation callback triggered');

        if (!this._hass) {
          lcardsLog.warn('[MsdCardCoordinator] Cannot evaluate rules - no HASS available');
          return;
        }

        // Evaluate dirty rules (now async for Jinja2 conditions)
        const ruleResults = await this.rulesEngine.evaluateDirty(this._hass);  // await

        lcardsLog.debug(`[MsdCardCoordinator] 🔍 DIRTY RULES RESULT:`, {
          hasBaseSvgUpdate: !!ruleResults.baseSvgUpdate,
          baseSvgUpdate: ruleResults.baseSvgUpdate,
          patchCount: ruleResults.overlayPatches?.length || 0
        });

        if (ruleResults.overlayPatches && ruleResults.overlayPatches.length > 0) {
          lcardsLog.debug(`[MsdCardCoordinator] 🎨 Rules produced ${ruleResults.overlayPatches.length} patch(es) - triggering selective re-render`);

          // Build failed overlay list for selective re-render
          // Process animations and config merging before re-rendering
          const overlaysToReRender = ruleResults.overlayPatches.map(patch => {
            const overlay = this._findOverlayById(patch.id);
            if (!overlay) {
              lcardsLog.warn(`[MsdCardCoordinator] ⚠️ Overlay not found: ${patch.id}`);
              return { id: patch.id, reason: 'Overlay config not found', patch };
            }

            // Deep merge entire patch into overlay config (not just style)
            // This allows rules to patch text, dpad, icon, and other properties
            deepMerge(overlay, patch);

            // Also update finalStyle if style property exists in patch
            if (patch.style && Object.keys(patch.style).length > 0) {
              overlay.finalStyle = {
                ...(overlay.finalStyle || overlay.style || {}),
                ...patch.style
              };
            }

            // Process animations from rule patches
            if (patch.animations && Array.isArray(patch.animations) && patch.animations.length > 0) {
              lcardsLog.debug(`[MsdCardCoordinator] 🎬 Triggering ${patch.animations.length} animation(s) for ${patch.id}`);
              if (this.animationManager) {
                patch.animations.forEach(animDef => {
                  this.animationManager.playAnimation(patch.id, animDef);
                });
              }
            }
          });

          // Trigger full re-render when rules update overlays
          // (Cards self-update via Lit lifecycle; lines are cheap to redraw entirely)
          this._scheduleFullReRender();
        }

        // Apply base_svg filter updates from rules
        if (ruleResults.baseSvgUpdate) {
          lcardsLog.debug(`[MsdCardCoordinator] � Rules produced base_svg update`);
          this._applyBaseSvgUpdate(ruleResults.baseSvgUpdate);
        }
      });

      lcardsLog.debug('[MsdCardCoordinator] Rules Engine HASS monitoring configured');
    }

    // Initialize rendering systems
    this.router = new RouterCore(mergedConfig.routing, cardModel.anchors, cardModel.viewBox);
    this.renderer = new AdvancedRenderer(mountEl, this.router, this); // Pass 'this' as systemsManager
    this.debugRenderer = new MsdDebugRenderer();
    this.controlsRenderer = new MsdControlsRenderer(this.renderer);

    // ADDED: Set HASS context on controls renderer immediately if available
    if (this._hass && this.controlsRenderer) {
      lcardsLog.debug('[MsdCardCoordinator] Setting initial HASS context on controls renderer');
      this.controlsRenderer.setHass(this._hass);
    }

    // REMOVED: MsdHudManager - now using global HudManager from core
    // MSD-specific panels will be registered by the card via lcardsCore.hudManager
    this.hudManager = null; // Deprecated - use window.lcards.core.hudManager

    // Initialize debug renderer with systems manager reference
    this.debugRenderer.init(this);

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

    lcardsLog.debug('[MsdCardCoordinator] ✅ All systems initialization complete', {
      hasThemeManager: !!this.themeManager,
      hasStyleResolver: !!this.styleResolver,
      hasDataSourceManager: !!this.dataSourceManager,
      hasRouter: !!this.router,
      hasRenderer: !!this.renderer,
      hasRulesEngine: !!this.rulesEngine,
      hasAnimRegistry: !!this.animRegistry,
      hasAnimationManager: !!this.animationManager,
      hasDebugManager: !!this.debugManager,
      hasControlsRenderer: !!this.controlsRenderer,
      hasDebugRenderer: !!this.debugRenderer
    });
  }

  setReRenderCallback(callback) {
    this._reRenderCallback = callback;
  }

  /**
   * Set card GUID for HUD registration
   * @param {string} guid - Card GUID
   */
  setCardGuid(guid) {
    this._cardGuid = guid;
    lcardsLog.debug('[MsdCardCoordinator] Card GUID set:', guid);

    // Register with HUD if systems are already initialized
    if (this.renderer && lcardsCore?.hudManager) {
      this._registerMsdPanelsWithHud(guid);
    }
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
  _instrumentRulesEngine(mergedConfig) {
    // Skip performance instrumentation unless explicitly enabled
    if (!mergedConfig?.debug?.performance) {
      return;
    }

    try {
      const depIndex = new Map();
      (mergedConfig.rules||[]).forEach(r=>{
        const condBlocks = (r.when && (r.when.all || r.when.any)) || [];
        condBlocks.forEach(c=>{
          const ent = c?.entity;
            if (ent) {
              if (!depIndex.has(ent)) depIndex.set(ent, new Set());
              depIndex.get(ent).add(r.id);
            }
        });
      });
      this.rulesEngine.__hudDeps = depIndex;

      const W = typeof window!=='undefined'?window:{};
      W.__msdDebug = W.__msdDebug || {};
      const perfStore = W.__msdDebug.__perfStore = W.__msdDebug.__perfStore || { counters:{}, timings:{} };
      function perfCount(k,inc=1){ perfStore.counters[k]=(perfStore.counters[k]||0)+inc; }

      if (!this.rulesEngine.__perfWrapped && typeof this.rulesEngine.evaluateDirty === 'function'){
        const orig = this.rulesEngine.evaluateDirty;
        this.rulesEngine.evaluateDirty = function(){
          const ruleCount = (mergedConfig.rules||[]).length;
          perfCount('rules.eval.count', ruleCount||0);
          const res = orig.apply(this, arguments);
          try {
            const trace = (this.getTrace && this.getTrace()) || [];
            const matched = Array.isArray(trace) ? trace.filter(t=>t && t.matched).length : 0;
            perfCount('rules.match.count', matched);
          } catch { /* ignore */ }
          return res;
        };
        this.rulesEngine.__perfWrapped = true;
      }
    } catch(e){
      lcardsLog.warn('[MsdCardCoordinator][rules instrumentation] failed', e);
    }
  }

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
      lcardsLog.debug('[MsdCardCoordinator] 📊 Data sources configured', {
        configured: Object.keys(configuredDataSources).length,
        controls: controlEntities.length,
        total: Object.keys(allDataSources).length
      });
    }

    if (Object.keys(allDataSources).length === 0) {
      lcardsLog.debug('[MsdCardCoordinator] No data sources configured or auto-created - DataSourceManager will not be initialized');
      return;
    }

    lcardsLog.debug('[MsdCardCoordinator] Initializing DataSourceManager with', Object.keys(allDataSources).length, 'data sources');

    try {
      // ✅ Use shared core DataSourceManager singleton (real MSD class)
      lcardsLog.debug('[MsdCardCoordinator] 🔗 Using shared core DataSourceManager singleton');
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

        // Mark rules dirty for changed entities
        if (this.rulesEngine && changedIds.length > 0) {
          // Map entity IDs to DataSource IDs for rules
          const entitiesToMarkDirty = new Set();

          changedIds.forEach(entityId => {
            entitiesToMarkDirty.add(entityId);

            // Check if this entity corresponds to any DataSources used in rules
            if (this.dataSourceManager) {
              for (const [sourceId, source] of this.dataSourceManager.sources) {
                if (source.cfg && source.cfg.entity === entityId) {
                  entitiesToMarkDirty.add(sourceId);
                  lcardsLog.debug(`[MsdCardCoordinator] Mapped entity "${entityId}" to DataSource "${sourceId}"`);
                }
              }
            }
          });

          const finalEntityList = Array.from(entitiesToMarkDirty);
          this.rulesEngine.markEntitiesDirty(finalEntityList);

          // Evaluate rules to check if patches need to be applied
          const ruleResults = this.rulesEngine.evaluateDirty(this._hass);

          lcardsLog.debug('[MsdCardCoordinator] 🔍 RULE EVALUATION RESULT:', {
            patchCount: ruleResults.overlayPatches?.length || 0,
            patches: ruleResults.overlayPatches?.map(p => ({
              overlayId: p.id,
              cellTarget: p.cell_target || p.cellTarget || null,
              styleKeys: Object.keys(p.style || {})
            }))
          });

          if (ruleResults.overlayPatches && ruleResults.overlayPatches.length > 0) {
            lcardsLog.debug(`[MsdCardCoordinator] 🎨 Rules produced ${ruleResults.overlayPatches.length} patch(es) - applying to model and triggering re-render`);

            // Apply patches to overlays in the model
            ruleResults.overlayPatches.forEach(patch => {
              const overlay = this._findOverlayById(patch.id);
              if (!overlay) {
                lcardsLog.warn(`[MsdCardCoordinator] ⚠️ Overlay not found: ${patch.id}`);
                return;
              }

              // Deep merge entire patch into overlay config (not just style)
              // This allows rules to patch text, dpad, icon, and other properties
              deepMerge(overlay, patch);

              // Also update finalStyle if style property exists in patch
              if (patch.style && Object.keys(patch.style).length > 0) {
                overlay.finalStyle = {
                  ...(overlay.finalStyle || overlay.style || {}),
                  ...patch.style
                };
              }

              // Process animations from rule patches
              if (patch.animations && Array.isArray(patch.animations) && patch.animations.length > 0) {
                lcardsLog.debug(`[MsdCardCoordinator] 🎬 Triggering ${patch.animations.length} animation(s) for ${patch.id}`);
                if (this.animationManager) {
                  patch.animations.forEach(animDef => {
                    this.animationManager.playAnimation(patch.id, animDef);
                  });
                }
              }
            });

            // Trigger full re-render when rules update overlays
            // (Cards self-update via Lit lifecycle; lines are cheap to redraw entirely)
            this._scheduleFullReRender();
          } else {
            lcardsLog.debug('[MsdCardCoordinator] ℹ️ No rule patches needed');
          }

          // Apply base_svg filter updates from rules
          if (ruleResults.baseSvgUpdate) {
            lcardsLog.debug(`[MsdCardCoordinator] � Rules produced base_svg update`);
            this._applyBaseSvgUpdate(ruleResults.baseSvgUpdate);
          }
        }
      });

      lcardsLog.debug('[MsdCardCoordinator] ✅ Entity change listener configured for rule evaluation (BEFORE data source init)');
      this._entityChangeListenerRegistered = true;

      const sourceCount = await this.dataSourceManager.initializeFromConfig(allDataSources);
      lcardsLog.debug('[MsdCardCoordinator] ✅ DataSourceManager initialized -', sourceCount, 'sources started');

      // ADDED: Verify entities are available
      const entityIds = this.dataSourceManager.listIds();
      lcardsLog.debug('[MsdCardCoordinator] ✅ DataSourceManager entities available:', entityIds);

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

    // Clean up rules engine first
    if (this.rulesEngine) {
      await this.rulesEngine.destroy();
    }

    // Stop all subscriptions and clean up resources
    this.dataSourceManager?.destroy();
    this.animRegistry?.clear();
    this.debugRenderer?.destroy();
    if (this.controlsRenderer && typeof this.controlsRenderer.destroy === 'function') {
      this.controlsRenderer.destroy();
    }
    if (this.renderer && typeof this.renderer.destroy === 'function') {
      this.renderer.destroy();
    }

    if (this.styleResolver) {
      try {
        this.styleResolver.invalidateCache('overlay');
        lcardsLog.debug('[MsdCardCoordinator] StyleResolver overlay cache invalidated');
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
    this.debugRenderer = null;
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
          const debugOptions = {
            anchors: resolvedModel.anchors || {},
            overlays: resolvedModel.overlays || [],
            router: this.router,  // Pass router for routing debug visualization
            showAnchors: debugState.anchors,
            showBoundingBoxes: debugState.bounding_boxes,
            showRouting: this.debugManager.canRenderRouting(),
            showPerformance: debugState.performance,
            scale: debugState.scale
          };

          this.debugRenderer.render(mountEl || this.renderer?.mountEl, resolvedModel.viewBox, debugOptions);
          lcardsLog.debug('[MsdCardCoordinator] ✅ Debug renderer completed');
        } catch (error) {
          lcardsLog.error('[MsdCardCoordinator] ❌ Debug renderer failed:', error);
          // Continue execution - don't fail the entire render
        }
      }

      // FIXED: Render control overlays with comprehensive error handling
      // NOTE: Control overlays are now rendered by AdvancedRenderer during Phase 2a
      // This prevents duplicate rendering. We only keep debug visualization here.
      const controlOverlays = resolvedModel.overlays.filter(o => o.type === 'control');
      if (controlOverlays.length > 0) {
        lcardsLog.debug('[MsdCardCoordinator] Control overlays detected (rendered by AdvancedRenderer):', controlOverlays.map(c => c.id));
        // REMOVED: Duplicate rendering - AdvancedRenderer handles this in Phase 2a
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
  /**
   * Register MSD-specific panels with global HUD Manager
   * Called during MSD initialization to add card-specific debug panels
   * @private
   */
  _registerMsdPanelsWithHud(cardGuid) {
    if (!lcardsCore?.hudManager) {
      lcardsLog.warn('[MsdCardCoordinator] HUD Manager not available, skipping panel registration');
      return;
    }

    try {
      // Create MSD-specific panels
      const msdPanels = new Map([
        ['routing', new RoutingPanel()],
        ['overlays', new OverlaysPanel()],
        ['channel-trend', new ChannelTrendPanel()]
      ]);

      // Register card with HUD
      const cardContext = {
        guid: cardGuid,
        type: 'msd',
        instance: null, // Will be set by card
        panels: msdPanels,
        systemsManager: this,
        router: this.router,
        renderer: this.renderer,
        pipeline: null // Will be set by card
      };

      lcardsCore.hudManager.registerCard(cardGuid, cardContext);
      lcardsLog.debug('[MsdCardCoordinator] ✅ Registered MSD card with global HUD:', cardGuid);
    } catch (error) {
      lcardsLog.error('[MsdCardCoordinator] ❌ Failed to register MSD panels with HUD:', error);
    }
  }

  /**
   * Deprecated - replaced by global HUD Manager
   * @deprecated Use window.lcards.core.hudManager instead
   * @private
   */
  _setupGlobalHudInterface() {
    lcardsLog.debug('[MsdCardCoordinator] _setupGlobalHudInterface deprecated - using global HUD Manager');
  }

  /**
   * Check if entity changes might affect rule conditions (requiring full re-render)
   * @param {Array} changedIds - Entity IDs that changed
   * @returns {boolean} True if rules might need re-evaluation
   * @private
   */
  _checkIfRulesNeedReRender(changedIds) {
    if (!this.rulesEngine || !this.mergedConfig?.rules) {
      return false; // No rules to evaluate
    }

    // For now, be conservative and assume any DataSource change might affect rules
    // TODO: In the future, we could be more sophisticated and check specific rule conditions
    const affectedDataSources = changedIds.filter(id => {
      // Check if this entity maps to a DataSource used in rules
      return this.dataSourceManager?.getEntity(id) ||
             changedIds.some(entityId => this.dataSourceManager?.getSource(entityId));
    });

    if (affectedDataSources.length > 0) {
      lcardsLog.debug('[MsdCardCoordinator] 🎯 DataSource entities affected by changes:', affectedDataSources);

      // ADVANCED: Check if the specific rule thresholds might be crossed
      // This is where we could add more sophisticated logic to detect actual rule changes
      const mightCrossThresholds = this._checkThresholdCrossing(changedIds);

      lcardsLog.debug('[MsdCardCoordinator] 🌡️ Threshold crossing check:', mightCrossThresholds);
      return mightCrossThresholds;
    }

    return false;
  }

  /**
   * Check if entity changes might cross rule thresholds
   * @param {Array} changedIds - Entity IDs that changed
   * @returns {boolean} True if thresholds might be crossed
   * @private
   */
  _checkThresholdCrossing(changedIds) {
    // For temperature example: check if we're crossing the 70°F threshold
    const rules = this.mergedConfig.rules || [];

    for (const rule of rules) {
      const conditions = rule.when?.any || rule.when?.all || [];

      for (const condition of conditions) {
        if (condition.entity && (condition.above !== undefined || condition.below !== undefined)) {
          // Check if this entity or its DataSource is in changedIds
          const entityInRule = condition.entity;
          const isDataSourceAffected = changedIds.some(id => {
            // Check if changed entity maps to the DataSource used in the rule
            const dataSourceId = entityInRule.split('.')[0]; // e.g., "temperature_enhanced"
            const source = this.dataSourceManager?.getSource(dataSourceId);
            return source && source.cfg?.entity === id;
          });

          if (isDataSourceAffected) {
            lcardsLog.debug('[MsdCardCoordinator] 🎯 Rule condition potentially affected:', {
              rule: rule.id,
              entity: entityInRule,
              threshold: condition.above || condition.below,
              operator: condition.above ? 'above' : 'below'
            });

            // IMPROVED: Check actual threshold crossing instead of always returning true
            const currentEntity = this.dataSourceManager?.getEntity(entityInRule);
            if (currentEntity && currentEntity.state !== undefined) {
              const currentValue = parseFloat(currentEntity.state);
              const threshold = condition.above || condition.below;
              const isAboveThreshold = currentValue > threshold;
              const isBelowThreshold = currentValue < threshold;

              // Check if current value satisfies the condition
              const currentlyMatches = condition.above ? isAboveThreshold : isBelowThreshold;

              lcardsLog.debug('[MsdCardCoordinator] 🌡️ Detailed threshold analysis:', {
                currentValue,
                threshold,
                operator: condition.above ? 'above' : 'below',
                isAboveThreshold,
                isBelowThreshold,
                currentlyMatches,
                ruleId: rule.id
              });

              // Store the current rule state for next comparison
              if (!this._previousRuleStates) {
                this._previousRuleStates = new Map();
              }

              const ruleKey = `${rule.id}_${condition.entity}`;
              const previouslyMatched = this._previousRuleStates.get(ruleKey);

              lcardsLog.debug('[MsdCardCoordinator] 📊 Rule state comparison:', {
                ruleKey,
                previouslyMatched,
                currentlyMatches,
                stateChanged: previouslyMatched !== currentlyMatches
              });

              // Update the stored state
              this._previousRuleStates.set(ruleKey, currentlyMatches);

              // Only trigger re-render if the rule state actually changed
              if (previouslyMatched !== undefined && previouslyMatched !== currentlyMatches) {
                lcardsLog.debug('[MsdCardCoordinator] 🔄 Rule state CHANGED - threshold crossing detected!');
                return true;
              } else if (previouslyMatched === undefined) {
                lcardsLog.debug('[MsdCardCoordinator] 🆕 First rule evaluation - storing state');
                // First time seeing this rule, don't trigger re-render
                return false;
              } else {
                lcardsLog.debug('[MsdCardCoordinator] 📌 Rule state UNCHANGED - no threshold crossing');
                return false;
              }
            }
          }
        }
      }
    }

    lcardsLog.debug('[MsdCardCoordinator] 📊 No threshold crossings detected');
    return false;
  }

  // ============================================================================
  // INCREMENTAL UPDATE SYSTEM (Phase 1)
  // ============================================================================

  // DEPRECATED: _getRendererForType removed (v1.16.22+)
  // Old pattern: Custom overlay renderer registry for incremental updates
  // New pattern: All overlays use unified card pattern, no custom renderers needed

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

      // Merge explicit filters (they override preset values)
      if (baseSvgConfig.filters) {
        filters = filters ? { ...filters, ...baseSvgConfig.filters } : { ...baseSvgConfig.filters };
      }

      // Check if this is a clear/remove operation (preset: "none" or empty filters object)
      const isClearOperation = baseSvgConfig.filter_preset === 'none' ||
                               (filters && Object.keys(filters).length === 0);

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

    // 2. RulesEngine second (evaluates conditions with fresh data) - ONLY if data changed
    if (dataSourceResult.hasChanges) {
      if (this.rulesEngine && typeof this.rulesEngine.ingestHass === 'function') {
        lcardsLog.debug('[MsdCardCoordinator] 📏 Propagating to RulesEngine - entities changed', {
          hasRulesEngine: !!this.rulesEngine,
          hasMethod: typeof this.rulesEngine.ingestHass === 'function',
          changedEntities: dataSourceResult.changedCount
        });
        this.rulesEngine.ingestHass(hass);
        lcardsLog.info('[MsdCardCoordinator] ✅ RulesEngine.ingestHass() completed');
      } else {
        lcardsLog.warn('[MsdCardCoordinator] ⚠️ RulesEngine not ready or no ingestHass method', {
          hasRulesEngine: !!this.rulesEngine,
          hasMethod: this.rulesEngine ? typeof this.rulesEngine.ingestHass : 'no rulesEngine'
        });
      }
    } else {
      lcardsLog.debug('[MsdCardCoordinator] ⏭️ Skipping RulesEngine - no entity changes detected', {
        totalEntities: dataSourceResult.totalCount,
        changedEntities: dataSourceResult.changedCount
      });
    }

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

