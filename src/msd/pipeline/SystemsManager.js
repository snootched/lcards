import { AdvancedRenderer } from '../renderer/AdvancedRenderer.js';
import { MsdDebugRenderer } from '../debug/MsdDebugRenderer.js';
import { MsdControlsRenderer } from '../controls/MsdControlsRenderer.js';
import { MsdHudManager } from '../hud/MsdHudManager.js';
import { DataSourceManager } from '../../core/data-sources/DataSourceManager.js';
import { RouterCore } from '../routing/RouterCore.js';
import { lcardsLog } from '../../utils/lcards-logging.js';
import { lcardsCore } from '../../core/lcards-core.js';
import { AnimationRegistry } from '../../core/animation/AnimationRegistry.js';
import { ThemeManager } from '../../core/themes/ThemeManager.js';
import { RulesEngine } from '../../core/rules/RulesEngine.js';
import { DebugManager } from '../debug/DebugManager.js';

import { StylePresetManager } from '../../core/presets/StylePresetManager.js';

// ✅ ADDED: Import theme system initialization
import { initializeThemeSystem } from '../../core/themes/initializeThemeSystem.js';

// ✨ ADDED: Import animation system components
// AnimationManager now imported as shared singleton from lcardsCore
import { processAnimationConfig } from '../../core/animation/AnimationConfigProcessor.js';

import { BaseService } from '../../core/BaseService.js';

export class SystemsManager extends BaseService {
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
    this.animationManager = null; // ✨ NEW: Phase 5 - Animation system
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
          lcardsLog.debug('[SystemsManager] 🔄 Executing queued re-render (render completed)');
          this._queuedReRender = false;

          setTimeout(() => {
            if (!this._internalRenderInProgress && this._reRenderCallback) {
              lcardsLog.debug('[SystemsManager] 🚀 Executing queued re-render callback');
              try {
                this._reRenderCallback();
              } catch (error) {
                lcardsLog.error('[SystemsManager] ❌ Queued re-render failed:', error);
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
   * ENHANCED: Initialize systems with pack defaults loading FIRST
   * This ensures defaults are available before any overlay processing
   */
  async initializeSystemsWithPacksFirst(mergedConfig, mountEl, hass) {
    lcardsLog.debug('[SystemsManager] 🚀 Enhanced initialization: packs and defaults first');

    // Store config and HASS context immediately
    this.mergedConfig = mergedConfig;
    this._hass = hass; // PHASE 1: Use single source

    // ✅ PHASE 1A: Use shared core ThemeManager singleton (real MSD class)
    lcardsLog.debug('[SystemsManager] 🔗 Using shared core ThemeManager singleton');
    if (!lcardsCore.themeManager) {
      throw new Error('lcardsCore.themeManager is null - core not initialized?');
    }
    this.themeManager = lcardsCore.themeManager;

    // PHASE 1: Initialize theme system FIRST (provides all component defaults)
    lcardsLog.debug('[SystemsManager] 🎨 Phase 1: Initializing theme system');


    let packs;

    // Load pack defaults from merged config provenance
    if (mergedConfig && mergedConfig.__provenance && mergedConfig.__provenance.merge_order) {
      const packLayers = mergedConfig.__provenance.merge_order.filter(layer => layer.type === 'builtin');
      if (packLayers.length > 0) {
        lcardsLog.debug('[SystemsManager] 📦 Loading packs from merged config provenance');

        const { loadBuiltinPacks } = await import('../../core/packs/loadBuiltinPacks.js');
        const packNames = packLayers.map(layer => layer.pack);

        // Ensure 'core' and 'builtin_themes' packs are always loaded
        if (!packNames.includes('core')) {
          packNames.unshift('core');
        }
        if (!packNames.includes('builtin_themes')) {
          packNames.push('builtin_themes');
        }

        try {
          const packLoadPromise = Promise.resolve(loadBuiltinPacks(packNames));
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Pack loading timeout')), 10000)
          );
          packs = await Promise.race([packLoadPromise, timeoutPromise]);

          if (!packs || !Array.isArray(packs)) {
            throw new Error('Invalid pack loading result');
          }
        } catch (error) {
          lcardsLog.error('[SystemsManager] ❌ Pack loading failed:', error);
          throw new Error(`Pack loading failed: ${error.message}`);
        }
      }
    } else {
      // Fallback: Load core and builtin_themes packs
      lcardsLog.debug('[SystemsManager] 📦 No pack provenance, loading core + builtin_themes');
      try {
        const { loadBuiltinPacks } = await import('../../core/packs/loadBuiltinPacks.js');
        packs = loadBuiltinPacks(['core', 'builtin_themes']);
        lcardsLog.debug('[SystemsManager] ✅ Loaded fallback packs');
      } catch (error) {
        lcardsLog.error('[SystemsManager] ❌ Fallback pack loading failed:', error);
        throw new Error(`Pack loading failed: ${error.message}`);
      }
    }

    // Initialize theme system with loaded packs
    const requestedTheme = mergedConfig?.theme || 'lcars-classic';
    await this.themeManager.initialize(packs, requestedTheme, mountEl);
    const activeTheme = this.themeManager.getActiveTheme();

    // ✅ ENHANCED: Log theme provenance
    lcardsLog.info('[SystemsManager] 🎨 Theme system initialized:', {
      requested: requestedTheme,
      active: activeTheme?.name,
      activeId: activeTheme?.id,
      themeCount: this.themeManager.listThemes().length,
      provenance: mergedConfig.__provenance?.theme  // ← Log theme provenance
    });

    // Store in global namespace for access by overlays
    if (typeof window !== 'undefined') {
      window.lcards = window.lcards || {};
      window.lcards.theme = this.themeManager;
      window.lcards.debug.msd.themeProvenance = mergedConfig.__provenance?.theme;
      lcardsLog.debug('[SystemsManager] 🔧 ThemeManager globally accessible via window.lcards.theme');
    }

    // Acquire StyleResolverService reference
    if (typeof window !== 'undefined' && window.lcards?.styleResolver) {
      this.styleResolver = window.lcards.styleResolver;
      lcardsLog.debug('[SystemsManager] ✅ StyleResolverService reference acquired');
    } else {
      lcardsLog.warn('[SystemsManager] ⚠️ StyleResolverService not found - renderers will use fallback');
    }

    // PHASE 2: Initialize other critical systems that overlays might need
    lcardsLog.debug('[SystemsManager] ⚙️ Phase 2: Initializing critical systems');

    // Initialize debug manager early with config
    const debugConfig = mergedConfig.debug || {};
    this.debugManager.init(debugConfig);
    lcardsLog.debug('[SystemsManager] DebugManager initialized with config:', debugConfig);

    // Initialize data source manager FIRST (overlays may reference it)
    await this._initializeDataSources(hass, mergedConfig);

    // ✅ Use shared StylePresetManager singleton from lcardsCore and initialize with packs
    lcardsLog.debug('[SystemsManager] 🎨 Using shared StylePresetManager from lcardsCore');
    if (!lcardsCore.stylePresetManager) {
      throw new Error('lcardsCore.stylePresetManager is null - core not initialized?');
    }
    this.stylePresetManager = lcardsCore.stylePresetManager;

    // Initialize with packs if not already initialized
    if (!this.stylePresetManager.initialized) {
      lcardsLog.debug('[SystemsManager] Initializing shared StylePresetManager with packs:', packs.map(p => ({ id: p.id, hasStylePresets: !!p.style_presets })));
      await this.stylePresetManager.initialize(packs);
      lcardsLog.debug('[SystemsManager] ✅ Shared StylePresetManager initialized');
    } else {
      lcardsLog.debug('[SystemsManager] ✅ Shared StylePresetManager already initialized');
    }

    lcardsLog.debug('[SystemsManager] ✅ Critical systems ready for overlay processing');
  }

  /**
   * Complete systems initialization after card model is built
   * This is the second phase that happens after overlays can safely be processed
   */
  async completeSystems(mergedConfig, cardModel, mountEl, hass) {
    lcardsLog.debug('[SystemsManager] 🔧 Completing systems initialization');

    // ✅ Use shared RulesEngine singleton from lcardsCore and add this MSD's rules
    lcardsLog.debug('[SystemsManager] 🧠 Using shared RulesEngine from lcardsCore');
    if (!lcardsCore.rulesManager) {
      throw new Error('lcardsCore.rulesManager is null - core not initialized?');
    }
    this.rulesEngine = lcardsCore.rulesManager;

    // CRITICAL: Add this MSD's rules to the shared RulesEngine
    if (mergedConfig.rules && mergedConfig.rules.length > 0) {
      lcardsLog.debug(`[SystemsManager] 📋 Adding ${mergedConfig.rules.length} rules from this MSD to shared RulesEngine`);

      // Add rules to the shared engine's rules array
      mergedConfig.rules.forEach(rule => {
        if (rule.id) {
          // Check if rule already exists to avoid duplicates
          if (!this.rulesEngine.rulesById.has(rule.id)) {
            this.rulesEngine.rules.push(rule);
            lcardsLog.debug(`[SystemsManager] ➕ Added rule: ${rule.id}`);
          } else {
            lcardsLog.warn(`[SystemsManager] ⚠️ Rule ${rule.id} already exists in shared RulesEngine, skipping`);
          }
        }
      });

      // Rebuild the rules index and dependencies
      this.rulesEngine.buildRulesIndex();
      this.rulesEngine.buildDependencyIndex();
      this.rulesEngine._compileRules();  // ✨ ADDED: Compile newly added rules
      lcardsLog.debug(`[SystemsManager] ✅ Rules added. Total rules in shared engine: ${this.rulesEngine.rules.length}`);
    } else {
      lcardsLog.debug('[SystemsManager] ℹ️ No rules to add from this MSD');
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
      this.rulesEngine.setReEvaluationCallback(async () => {  // ✨ CHANGED: async
        lcardsLog.debug('[SystemsManager] 🔄 RulesEngine re-evaluation callback triggered');

        if (!this._hass) {
          lcardsLog.warn('[SystemsManager] Cannot evaluate rules - no HASS available');
          return;
        }

        // Evaluate dirty rules (now async for Jinja2 conditions)
        const ruleResults = await this.rulesEngine.evaluateDirty(this._hass);  // ✨ CHANGED: await

        lcardsLog.debug(`[SystemsManager] 🔍 DIRTY RULES RESULT:`, {
          hasBaseSvgUpdate: !!ruleResults.baseSvgUpdate,
          baseSvgUpdate: ruleResults.baseSvgUpdate,
          patchCount: ruleResults.overlayPatches?.length || 0
        });

        if (ruleResults.overlayPatches && ruleResults.overlayPatches.length > 0) {
          lcardsLog.debug(`[SystemsManager] 🎨 Rules produced ${ruleResults.overlayPatches.length} patch(es) - triggering selective re-render`);

          // Build failed overlay list for selective re-render
          // Process animations and style merging before re-rendering
          const overlaysToReRender = ruleResults.overlayPatches.map(patch => {
            const overlay = this._findOverlayById(patch.id);
            if (!overlay) {
              lcardsLog.warn(`[SystemsManager] ⚠️ Overlay not found: ${patch.id}`);
              return { id: patch.id, reason: 'Overlay config not found', patch };
            }

            // Merge patch style into finalStyle
            if (patch.style && Object.keys(patch.style).length > 0) {
              overlay.finalStyle = {
                ...(overlay.finalStyle || overlay.style || {}),
                ...patch.style
              };
            }

            // Process animations from rule patches
            if (patch.animations && Array.isArray(patch.animations) && patch.animations.length > 0) {
              lcardsLog.debug(`[SystemsManager] 🎬 Triggering ${patch.animations.length} animation(s) for ${patch.id}`);
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

        // ✅ NEW: Apply base_svg filter updates from rules
        if (ruleResults.baseSvgUpdate) {
          lcardsLog.debug(`[SystemsManager] � Rules produced base_svg update`);
          this._applyBaseSvgUpdate(ruleResults.baseSvgUpdate);
        }
      });

      lcardsLog.debug('[SystemsManager] Rules Engine HASS monitoring configured');
    }

    // Initialize rendering systems
    this.router = new RouterCore(mergedConfig.routing, cardModel.anchors, cardModel.viewBox);
    this.renderer = new AdvancedRenderer(mountEl, this.router, this); // Pass 'this' as systemsManager
    this.debugRenderer = new MsdDebugRenderer();
    this.controlsRenderer = new MsdControlsRenderer(this.renderer);

    // ADDED: Set HASS context on controls renderer immediately if available
    if (this._hass && this.controlsRenderer) {
      lcardsLog.debug('[SystemsManager] Setting initial HASS context on controls renderer');
      this.controlsRenderer.setHass(this._hass);
    }

    // REPLACED: Initialize unified HUD manager with document.body mounting
    this.hudManager = new MsdHudManager();
    this.hudManager.init(mountEl); // Pass mount element for pipeline context, but HUD uses document.body

    // ADDED: Integrate HUD into global debug interface immediately
    this._setupGlobalHudInterface();

    // Initialize debug renderer with systems manager reference
    this.debugRenderer.init(this);

    // Mark router as ready for debug system
    this.debugManager.markRouterReady();
    lcardsLog.debug('[SystemsManager] RouterCore marked ready for debug system');

    // ✅ Use shared AnimationRegistry singleton from lcardsCore
    lcardsLog.debug('[SystemsManager] 🎭 Using shared AnimationRegistry from lcardsCore');
    if (!lcardsCore.animationRegistry) {
      throw new Error('lcardsCore.animationRegistry is null - core not initialized?');
    }
    this.animRegistry = lcardsCore.animationRegistry;

    // ✨ NEW: Phase 5 - Use shared AnimationManager from lcardsCore
    lcardsLog.debug('[SystemsManager] 🎬 Phase 5: Using shared AnimationManager from lcardsCore');
    if (!lcardsCore.animationManager) {
      throw new Error('lcardsCore.animationManager is null - core not initialized?');
    }
    this.animationManager = lcardsCore.animationManager;

    lcardsLog.debug('[SystemsManager] ✅ Shared AnimationManager connected');

    lcardsLog.debug('[SystemsManager] ✅ All systems initialization complete', {
      hasThemeManager: !!this.themeManager,
      hasStyleResolver: !!this.styleResolver,  // ✅ NEW: Phase 6
      hasDataSourceManager: !!this.dataSourceManager,
      hasRouter: !!this.router,
      hasRenderer: !!this.renderer,
      hasRulesEngine: !!this.rulesEngine,
      hasAnimRegistry: !!this.animRegistry,
      hasAnimationManager: !!this.animationManager,  // ✨ NEW
      hasDebugManager: !!this.debugManager,
      hasControlsRenderer: !!this.controlsRenderer,
      hasDebugRenderer: !!this.debugRenderer
    });
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
      lcardsLog.warn('[SystemsManager][rules instrumentation] failed', e);
    }
  }

  async _initializeDataSources(hass, mergedConfig) {
    this.dataSourceManager = null;

    // ENHANCED: Better logging and error handling
    if (!hass) {
      lcardsLog.warn('[SystemsManager] No HASS provided - DataSourceManager will not be initialized');
      return;
    }

    // PHASE 1: Pre-register entity change listener BEFORE creating data sources
    // This ensures the listener is ready when data source subscriptions are set up
    this._entityChangeListenerRegistered = false;

    // Use configured data sources
    const configuredDataSources = mergedConfig.data_sources || {};

    lcardsLog.debug('[SystemsManager] 🔍 Using configured data sources mode');
    lcardsLog.debug('[SystemsManager] 🔍 Configured data sources:', Object.keys(configuredDataSources));

    // Controls use direct HASS - no data sources needed
    const controlEntities = this._extractControlEntities(mergedConfig);
    lcardsLog.debug('[SystemsManager] 🔍 Control entities (using direct HASS):', controlEntities);

    // Use configured data sources
    const allDataSources = { ...configuredDataSources };

    lcardsLog.debug('[SystemsManager] 📊 Data source summary:', {
      configured: Object.keys(configuredDataSources).length,
      total: Object.keys(allDataSources).length,
      allDataSourceIds: Object.keys(allDataSources)
    });

    if (Object.keys(allDataSources).length === 0) {
      lcardsLog.debug('[SystemsManager] No data sources configured or auto-created - DataSourceManager will not be initialized');
      lcardsLog.debug('[SystemsManager] Note: Control overlays will use direct HASS (no data sources needed)');
      return;
    }

    lcardsLog.debug('[SystemsManager] Initializing DataSourceManager with', Object.keys(allDataSources).length, 'data sources');

    try {
      // ✅ Use shared core DataSourceManager singleton (real MSD class)
      lcardsLog.debug('[SystemsManager] 🔗 Using shared core DataSourceManager singleton');
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
                  lcardsLog.debug(`[SystemsManager] Mapped entity "${entityId}" to DataSource "${sourceId}"`);
                }
              }
            }
          });

          const finalEntityList = Array.from(entitiesToMarkDirty);
          this.rulesEngine.markEntitiesDirty(finalEntityList);

          // Evaluate rules to check if patches need to be applied
          const ruleResults = this.rulesEngine.evaluateDirty(this._hass);

          lcardsLog.debug('[SystemsManager] 🔍 RULE EVALUATION RESULT:', {
            patchCount: ruleResults.overlayPatches?.length || 0,
            patches: ruleResults.overlayPatches?.map(p => ({
              overlayId: p.id,
              cellTarget: p.cell_target || p.cellTarget || null,
              styleKeys: Object.keys(p.style || {})
            }))
          });

          if (ruleResults.overlayPatches && ruleResults.overlayPatches.length > 0) {
            lcardsLog.debug(`[SystemsManager] 🎨 Rules produced ${ruleResults.overlayPatches.length} patch(es) - applying to model and triggering re-render`);

            // Apply patches to overlays in the model
            ruleResults.overlayPatches.forEach(patch => {
              const overlay = this._findOverlayById(patch.id);
              if (!overlay) {
                lcardsLog.warn(`[SystemsManager] ⚠️ Overlay not found: ${patch.id}`);
                return;
              }

              // Merge patch style into finalStyle
              if (patch.style && Object.keys(patch.style).length > 0) {
                overlay.finalStyle = {
                  ...(overlay.finalStyle || overlay.style || {}),
                  ...patch.style
                };
              }

              // Process animations from rule patches
              if (patch.animations && Array.isArray(patch.animations) && patch.animations.length > 0) {
                lcardsLog.debug(`[SystemsManager] 🎬 Triggering ${patch.animations.length} animation(s) for ${patch.id}`);
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
            lcardsLog.debug('[SystemsManager] ℹ️ No rule patches needed');
          }

          // ✅ NEW: Apply base_svg filter updates from rules
          if (ruleResults.baseSvgUpdate) {
            lcardsLog.debug(`[SystemsManager] � Rules produced base_svg update`);
            this._applyBaseSvgUpdate(ruleResults.baseSvgUpdate);
          }
        }
      });

      lcardsLog.debug('[SystemsManager] ✅ Entity change listener configured for rule evaluation (BEFORE data source init)');
      this._entityChangeListenerRegistered = true;

      const sourceCount = await this.dataSourceManager.initializeFromConfig(allDataSources);
      lcardsLog.debug('[SystemsManager] ✅ DataSourceManager initialized -', sourceCount, 'sources started');

      // ADDED: Verify entities are available
      const entityIds = this.dataSourceManager.listIds();
      lcardsLog.debug('[SystemsManager] ✅ DataSourceManager entities available:', entityIds);

    } catch (error) {
      lcardsLog.error('[SystemsManager] ❌ DataSourceManager initialization failed:', error);
      lcardsLog.error('[SystemsManager] Error details:', error.stack);
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
    // DEPRECATED: ApexChartsOverlayRenderer.cleanupAll() removed (v1.16.22+)
    // SimpleChart instances are cleaned up by their own lifecycle

    // Clean up rules engine first
    if (this.rulesEngine) {
      await this.rulesEngine.destroy();
    }

    // Stop all subscriptions and clean up resources
    this.dataSourceManager?.destroy();
    this.animRegistry?.clear();
    this.debugRenderer?.destroy();
    this.controlsRenderer?.destroy();
    this.renderer?.destroy();
    this.rulesEngine?.destroy();

    if (this.styleResolver) {
      try {
        this.styleResolver.invalidateCache('overlay');
        lcardsLog.debug('[SystemsManager] StyleResolver overlay cache invalidated');
      } catch (error) {
        lcardsLog.error('[SystemsManager] StyleResolver cleanup error:', error);
      }
    }

    // Clear timeouts and callbacks
    if (this._renderTimeout) {
      clearTimeout(this._renderTimeout);
      this._renderTimeout = null;
    }
    this._reRenderCallback = null;

    this.styleResolver = null;

    //*** clean up other systems */

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
      lcardsLog.debug('[SystemsManager] renderDebugAndControls already in progress, skipping');
      return;
    }

    this._debugControlsRendering = true;

    try {
      const debugState = this.debugManager.getSnapshot();

      lcardsLog.debug('[SystemsManager] renderDebugAndControls called:', {
        anyEnabled: this.debugManager.isAnyEnabled(),
        controlOverlays: resolvedModel.overlays.filter(o => o.type === 'control').length,
        hasHass: !!this._hass,
        hasResolvedModel: !!resolvedModel,
        hasOverlays: !!resolvedModel?.overlays
      });

      // ADDED: Validate resolved model
      if (!resolvedModel || !resolvedModel.overlays) {
        lcardsLog.warn('[SystemsManager] Invalid resolved model for renderDebugAndControls');
        return;
      }

      // Render debug visualizations with error boundary
      if (this.debugManager.isAnyEnabled()) {
        try {
          const debugOptions = {
            anchors: resolvedModel.anchors || {},
            overlays: resolvedModel.overlays || [],
            router: this.router,  // ✅ FIXED: Pass router for routing debug visualization
            showAnchors: debugState.anchors,
            showBoundingBoxes: debugState.bounding_boxes,
            showRouting: this.debugManager.canRenderRouting(),
            showPerformance: debugState.performance,
            scale: debugState.scale
          };

          this.debugRenderer.render(mountEl || this.renderer?.mountEl, resolvedModel.viewBox, debugOptions);
          lcardsLog.debug('[SystemsManager] ✅ Debug renderer completed');
        } catch (error) {
          lcardsLog.error('[SystemsManager] ❌ Debug renderer failed:', error);
          // Continue execution - don't fail the entire render
        }
      }

      // FIXED: Render control overlays with comprehensive error handling
      const controlOverlays = resolvedModel.overlays.filter(o => o.type === 'control');
      if (controlOverlays.length > 0) {
        lcardsLog.debug('[SystemsManager] Rendering control overlays:', controlOverlays.map(c => c.id));

        try {
          // ADDED: Validate controls renderer exists
          if (!this.controlsRenderer) {
            lcardsLog.error('[SystemsManager] No controls renderer available');
            return;
          }

          // Ensure controls renderer has current HASS context
          if (this._hass && this.controlsRenderer) {
            this.controlsRenderer.setHass(this._hass);
            lcardsLog.debug('[SystemsManager] HASS context applied to controls renderer');
          } else {
            lcardsLog.warn('[SystemsManager] No HASS context available for controls');
          }

          // REMOVED: Defensive container creation - not needed with SVG foreignObject approach
          // The renderControls() method handles all necessary container creation internally

          // ADDED: Defensive controls rendering with timeout
          const renderPromise = this.controlsRenderer.renderControls(controlOverlays, resolvedModel);
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Controls render timeout')), 5000)
          );

          await Promise.race([renderPromise, timeoutPromise]);
          lcardsLog.debug('[SystemsManager] ✅ Controls rendered successfully');

        } catch (error) {
          lcardsLog.error('[SystemsManager] ❌ Controls rendering failed:', error);
          lcardsLog.error('[SystemsManager] Error stack:', error.stack);
        }
      }

    } catch (error) {
      lcardsLog.error('[SystemsManager] renderDebugAndControls failed completely:', error);
      lcardsLog.error('[SystemsManager] Error stack:', error.stack);
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
    lcardsLog.debug('[SystemsManager] ingestHass called with:', {
      hasHass: !!hass,
      hasStates: !!hass?.states,
      entityCount: hass?.states ? Object.keys(hass.states).length : 0,
      hasLightDesk: !!hass?.states?.['light.desk'],
      lightDeskState: hass?.states?.['light.desk']?.state,
      timestamp: new Date().toISOString()
    });

    if (!hass || !hass.states) {
      lcardsLog.warn('[SystemsManager] ingestHass called without valid hass.states');
      return;
    }

    // PHASE 1: Update single source of truth
    this._hass = hass;

    lcardsLog.debug('[SystemsManager] Updated _hass with fresh data');

    // ENHANCED: Pass HASS to controls renderer EVERY time to ensure cards get updates
    if (this.controlsRenderer) {
      lcardsLog.debug('[SystemsManager] Updating HASS context in controls renderer immediately');
      this.controlsRenderer.setHass(hass);
    } else {
      lcardsLog.warn('[SystemsManager] No controls renderer available for HASS update');
    }

    // DataSources handle HASS updates automatically via their subscriptions
    // No manual ingestion needed - handled by individual data sources
    lcardsLog.debug('[SystemsManager] HASS ingestion handled by individual data sources');
  }

  updateEntities(map) {
    if (!map || typeof map !== 'object') return;

    lcardsLog.debug('[SystemsManager] Manual entity updates not supported in DataSources system');
    lcardsLog.warn('[SystemsManager] Use direct HASS state updates instead of manual entity updates');
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
  _setupGlobalHudInterface() {
    lcardsLog.debug('[SystemsManager] Global HUD interface setup completed');
    // This method is called during initialization
    // Future HUD interface setup will go here
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
      lcardsLog.debug('[SystemsManager] 🎯 DataSource entities affected by changes:', affectedDataSources);

      // ADVANCED: Check if the specific rule thresholds might be crossed
      // This is where we could add more sophisticated logic to detect actual rule changes
      const mightCrossThresholds = this._checkThresholdCrossing(changedIds);

      lcardsLog.debug('[SystemsManager] 🌡️ Threshold crossing check:', mightCrossThresholds);
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
            lcardsLog.debug('[SystemsManager] 🎯 Rule condition potentially affected:', {
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

              lcardsLog.debug('[SystemsManager] 🌡️ Detailed threshold analysis:', {
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

              lcardsLog.debug('[SystemsManager] 📊 Rule state comparison:', {
                ruleKey,
                previouslyMatched,
                currentlyMatches,
                stateChanged: previouslyMatched !== currentlyMatches
              });

              // Update the stored state
              this._previousRuleStates.set(ruleKey, currentlyMatches);

              // Only trigger re-render if the rule state actually changed
              if (previouslyMatched !== undefined && previouslyMatched !== currentlyMatches) {
                lcardsLog.debug('[SystemsManager] 🔄 Rule state CHANGED - threshold crossing detected!');
                return true;
              } else if (previouslyMatched === undefined) {
                lcardsLog.debug('[SystemsManager] 🆕 First rule evaluation - storing state');
                // First time seeing this rule, don't trigger re-render
                return false;
              } else {
                lcardsLog.debug('[SystemsManager] 📌 Rule state UNCHANGED - no threshold crossing');
                return false;
              }
            }
          }
        }
      }
    }

    lcardsLog.debug('[SystemsManager] 📊 No threshold crossings detected');
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

      lcardsLog.debug('[SystemsManager] 🔍 Searching for base content group:', {
        hasMountEl: !!mountEl,
        mountElTag: mountEl?.tagName,
        svgExists: !!mountEl?.querySelector('svg'),
        allSvgGroups: Array.from(mountEl?.querySelectorAll('svg g') || []).map(g => g.id).filter(id => id)
      });

      const baseSvgElement = mountEl?.querySelector('#__msd-base-content');

      if (!baseSvgElement) {
        lcardsLog.warn('[SystemsManager] Cannot update base SVG filters - base content group not found');
        lcardsLog.debug('[SystemsManager] Available groups in SVG:',
          Array.from(mountEl?.querySelectorAll('svg g') || []).map(g => ({
            id: g.id,
            tagName: g.tagName
          }))
        );
        return;
      }

      lcardsLog.debug('[SystemsManager] ✅ Found base content group:', {
        id: baseSvgElement.id,
        tagName: baseSvgElement.tagName
      });

      // Resolve filters (preset or explicit)
      let filters = null;

      if (baseSvgConfig.filter_preset) {
        const preset = this.themeManager?.getFilterPreset(baseSvgConfig.filter_preset);
        if (preset) {
          filters = { ...preset };
          lcardsLog.debug(`[SystemsManager] Resolved filter preset '${baseSvgConfig.filter_preset}':`, filters);
        } else {
          lcardsLog.warn(`[SystemsManager] Unknown filter preset: ${baseSvgConfig.filter_preset}`);
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
        lcardsLog.debug(`[SystemsManager] ✅ Cleared base SVG filters`);
        return;
      }

      // Apply the filters with transition
      const { transitionBaseSvgFilters } = await import('../utils/BaseSvgFilters.js');
      await transitionBaseSvgFilters(baseSvgElement, filters, transition);

      lcardsLog.debug(`[SystemsManager] ✅ Applied base SVG filters:`, filters);
    } catch (error) {
      lcardsLog.error('[SystemsManager] Failed to apply base SVG filter update:', error);
    }
  }

  /**
   * Schedule a full re-render with proper queuing
   * @private
   */
  _scheduleFullReRender() {
    lcardsLog.info('[SystemsManager] 📅 SCHEDULED full re-render (100ms delay)');

    if (this._renderTimeout) {
      lcardsLog.debug('[SystemsManager] ⏰ Clearing existing render timeout');
      clearTimeout(this._renderTimeout);
    }

    // Safe re-render for data source changes
    this._renderTimeout = setTimeout(() => {
      if (this._reRenderCallback && !this._renderInProgress) {
        try {
          this._renderInProgress = true;
          lcardsLog.info('[SystemsManager] 🚀 EXECUTING full re-render from rule change timeout');
          this._reRenderCallback();
        } catch (error) {
          lcardsLog.error('[SystemsManager] ❌ Re-render FAILED in entity change handler:', error);
        } finally {
          this._renderInProgress = false;
        }
      } else {
        lcardsLog.warn('[SystemsManager] ⚠️ Re-render NOT triggered:', {
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
      lcardsLog.warn('[SystemsManager] ingestHass: Invalid HASS provided');
      return;
    }

    lcardsLog.debug('[SystemsManager] 📥 ingestHass: Ingesting fresh HASS:', {
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
    lcardsLog.debug('[SystemsManager] 🔄 _propagateHassToSystems: Starting ordered propagation');

    // 1. DataSourceManager first (provides entity values)
    let dataSourceResult = { hasChanges: true, changedCount: 0, totalCount: 0 };
    if (this.dataSourceManager && typeof this.dataSourceManager.ingestHass === 'function') {
      lcardsLog.debug('[SystemsManager] 📊 Propagating to DataSourceManager');
      dataSourceResult = this.dataSourceManager.ingestHass(hass) || { hasChanges: true, changedCount: 0, totalCount: 0 };
    } else {
      lcardsLog.debug('[SystemsManager] ⏭️ DataSourceManager not ready or no ingestHass method');
    }

    // 2. RulesEngine second (evaluates conditions with fresh data) - ONLY if data changed
    if (dataSourceResult.hasChanges) {
      if (this.rulesEngine && typeof this.rulesEngine.ingestHass === 'function') {
        lcardsLog.debug('[SystemsManager] 📏 Propagating to RulesEngine - entities changed', {
          hasRulesEngine: !!this.rulesEngine,
          hasMethod: typeof this.rulesEngine.ingestHass === 'function',
          changedEntities: dataSourceResult.changedCount
        });
        this.rulesEngine.ingestHass(hass);
        lcardsLog.info('[SystemsManager] ✅ RulesEngine.ingestHass() completed');
      } else {
        lcardsLog.warn('[SystemsManager] ⚠️ RulesEngine not ready or no ingestHass method', {
          hasRulesEngine: !!this.rulesEngine,
          hasMethod: this.rulesEngine ? typeof this.rulesEngine.ingestHass : 'no rulesEngine'
        });
      }
    } else {
      lcardsLog.debug('[SystemsManager] ⏭️ Skipping RulesEngine - no entity changes detected', {
        totalEntities: dataSourceResult.totalCount,
        changedEntities: dataSourceResult.changedCount
      });
    }

    // 3. Controls third (direct HASS access)
    if (this.controlsRenderer) {
      lcardsLog.debug('[SystemsManager] 🎮 Propagating to Controls');
      this.controlsRenderer.setHass(hass);
    } else {
      lcardsLog.debug('[SystemsManager] ⏭️ Controls not ready');
    }

    // 4. Overlays update automatically via DataSource subscriptions
    lcardsLog.debug('[SystemsManager] ✅ _propagateHassToSystems: Propagation complete');
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

