import { processAndValidateConfig } from './ConfigProcessor.js';
import { SystemsManager } from './SystemsManager.js';
import { ModelBuilder } from './ModelBuilder.js';
import { setupDebugInterface } from '../debug/DebugInterface.js';
import { buildCardModel } from '../model/CardModel.js';
import { LCARdSUnifiedAPI } from '../../api/LCARdSUnifiedAPI.js';
import { perfGetAll } from '../../utils/performance.js';
import { lcardsLog } from '../../utils/lcards-logging.js';
import { StyleResolverService } from '../styles/StyleResolverService.js';
// ✅ CONSOLIDATED: Use Core ValidationService singleton instead of MSD-specific ValidationService
import { applyBaseSvgFilters } from '../utils/BaseSvgFilters.js';
import { lcardsCore } from '../../core/lcards-core.js';

/**
 * Initialize the MSD processing/rendering pipeline.
 * ENHANCED: Ensures pack loading and defaults management complete before overlay processing
 * ✅ ENHANCED: Phase 6 - Now includes StyleResolverService initialization
 * ✅ ENHANCED: Phase 7 - Now includes ValidationService initialization and pre-render validation
 *
 * @param {Object} userMsdConfig - User supplied MSD config.
 * @param {HTMLElement|ShadowRoot} mountEl - Mount/root element (may be a shadowRoot).
 * @param {Object|null} hass - Home Assistant instance (if available).
 * @returns {Promise<Object>} Pipeline API
 */
export async function initMsdPipeline(userMsdConfig, mountEl, hass = null) {
  lcardsLog.debug('[PipelineCore] 🚀 Starting MSD pipeline initialization with enhanced sequencing');

  // PHASE 1: Configuration processing and pack merging
  lcardsLog.debug('[PipelineCore] 📋 Phase 1: Processing and validating configuration');
  const { mergedConfig, issues, provenance } = await processAndValidateConfig(userMsdConfig);

  // Handle validation errors early
  if (issues.errors.length) {
    lcardsLog.error('[PipelineCore] Validation errors – pipeline disabled', issues.errors);
    return createDisabledPipeline(mergedConfig, issues, provenance);
  }

  // PHASE 2: Initialize SystemsManager with theme loading BEFORE any overlay processing
  lcardsLog.trace('[PipelineCore] 🔧 Phase 2: Initializing SystemsManager and loading pack defaults');
  const systemsManager = new SystemsManager();

  // ✅ MOVED: Phase 2.5 - Initialize StyleResolverService BEFORE SystemsManager initialization
  // This ensures StyleResolver is available when SystemsManager checks for it
  lcardsLog.trace('[PipelineCore] 🎨 Phase 2.5: Initializing StyleResolverService (before SystemsManager)');

  let styleResolver = null;
  try {
    // Get preset configuration from merged config
    const presets = mergedConfig?.presets || {};

    // Create StyleResolverService instance
    styleResolver = new StyleResolverService(null, {  // ← ThemeManager not available yet
      presets,
      cacheEnabled: true,
      maxCacheSize: 1000,
      debug: mergedConfig?.debug?.styleResolver || false
    });

    // Store in global namespace for access by renderers
    if (typeof window !== 'undefined') {
      if (!window.lcards) window.lcards = {};
      window.lcards.styleResolver = styleResolver;
    }

    // Store in SystemsManager
    systemsManager.styleResolver = styleResolver;

    lcardsLog.debug('[PipelineCore] ✅ StyleResolverService initialized (before SystemsManager)');
  } catch (error) {
    lcardsLog.warn('[PipelineCore] ⚠️ StyleResolverService initialization failed:', error);
    lcardsLog.warn('[PipelineCore] ⚠️ Continuing without StyleResolverService - renderers will use fallback resolution');
    // Don't fail the pipeline - renderers will gracefully fall back to manual resolution
  }

  // ✅ FIXED: Phase 1.5 - Use LCARdS Core Infrastructure (Singleton Architecture)
  lcardsLog.debug('[PipelineCore] 🚀 Phase 1.5: Connecting to LCARdS Core Infrastructure');
  try {
    // Core is already initialized on module load - just update HASS if needed
    if (hass && lcardsCore._coreInitialized) {
      lcardsCore.updateHass(hass);
    }
    lcardsLog.debug('[PipelineCore] ✅ LCARdS Core Infrastructure connected');
  } catch (error) {
    lcardsLog.warn('[PipelineCore] ⚠️ Core Infrastructure connection failed:', error);
    lcardsLog.warn('[PipelineCore] ⚠️ Continuing with local systems only');
  }

  // CRITICAL: Initialize systems with pack defaults loading before overlay processing
  try {
    await systemsManager.initializeSystemsWithPacksFirst(mergedConfig, mountEl, hass);

    // ✅ NEW: Update StyleResolver with ThemeManager after SystemsManager initializes it
    if (styleResolver && systemsManager.themeManager) {
      lcardsLog.debug('[PipelineCore] 🔗 Connecting StyleResolver to ThemeManager');
      styleResolver.themeManager = systemsManager.themeManager;

      // Re-initialize token resolver with actual theme manager
      styleResolver.tokenResolver.themeManager = systemsManager.themeManager;

      lcardsLog.debug('[PipelineCore] ✅ StyleResolver connected to ThemeManager');
    }

    // ✅ CONSOLIDATED: Use Core ValidationService singleton instead of creating MSD-specific instance
    lcardsLog.debug('[PipelineCore] ✅ Phase 2.2: Configuring Core ValidationService');
    let validationService = null;

    try {
      // Get the core validation service singleton
      validationService = lcardsCore.validationService;

      if (validationService) {
        // Configure for MSD-specific needs
        validationService.config.strict = mergedConfig?.debug?.strictValidation || false;
        validationService.config.stopOnError = false;
        validationService.config.validateTokens = true;
        validationService.config.validateDataSources = true;
        validationService.config.debug = mergedConfig?.debug?.validation || false;

        // Initialize overlay validation subsystem (only happens once - has internal guard)
        // This also registers all MSD overlay schemas
        validationService.initializeOverlayValidation();

        const overlayRegistry = validationService.getOverlaySchemaRegistry();
        lcardsLog.debug('[PipelineCore] 📋 Core ValidationService configured:', {
          schemaCount: overlayRegistry?.getSchemaCount() || 0,
          types: overlayRegistry?.getRegisteredTypes() || []
        });

        // Connect ValidationService to ThemeManager and DataSourceManager
        if (systemsManager.themeManager) {
          validationService.setThemeManager(systemsManager.themeManager);
          lcardsLog.debug('[PipelineCore] 🔗 ValidationService connected to ThemeManager');
        }

        if (systemsManager.dataSourceManager) {
          validationService.setDataSourceManager(systemsManager.dataSourceManager);
          lcardsLog.debug('[PipelineCore] 🔗 ValidationService connected to DataSourceManager');
        }

        // Make ValidationService globally accessible (reference to core singleton)
        if (typeof window !== 'undefined') {
          if (!window.lcards) window.lcards = {};
          window.lcards.validationService = validationService;
          lcardsLog.debug('[PipelineCore] ✅ ValidationService available at window.lcards.validationService');
        }

        // Store in SystemsManager (reference to core singleton)
        systemsManager.validationService = validationService;

        lcardsLog.debug('[PipelineCore] ✅ Core ValidationService configured for MSD');
      } else {
        lcardsLog.warn('[PipelineCore] ⚠️ Core ValidationService not available - overlays will not be pre-validated');
      }

    } catch (validationInitError) {
      lcardsLog.warn('[PipelineCore] ⚠️ ValidationService configuration failed:', validationInitError);
      lcardsLog.warn('[PipelineCore] ⚠️ Continuing without ValidationService - overlays will not be pre-validated');
      // Don't fail the pipeline - validation is helpful but not critical
    }

  } catch (error) {
    lcardsLog.error('[PipelineCore] ❌ SystemsManager initialization failed:', error);
    throw new Error(`SystemsManager initialization failed: ${error.message}`);
  }

  // Verify theme manager is ready with enhanced validation
  if (!systemsManager.themeManager) {
    throw new Error('ThemeManager initialization failed - cannot proceed with overlay rendering');
  }

  // Validate theme is loaded
  const activeTheme = systemsManager.themeManager.getActiveTheme();

  lcardsLog.debug('[PipelineCore] 🔍 Theme validation:', {
    activeTheme: activeTheme?.name || 'none',
    themeId: activeTheme?.id || 'none',
    availableThemes: systemsManager.themeManager.listThemes(),
    initialized: systemsManager.themeManager.initialized
  });

  if (!activeTheme) {
    lcardsLog.warn('[PipelineCore] ⚠️ No theme active - some features may not work properly');
  } else {
    lcardsLog.debug('[PipelineCore] ✅ Theme validated:', {
      name: activeTheme.name,
      id: activeTheme.id,
      packId: activeTheme.packId
    });
  }

  lcardsLog.debug('[PipelineCore] ✅ Theme system loaded and ready:', {
    hasThemeManager: !!systemsManager.themeManager,
    activeTheme: activeTheme?.name,
    themeCount: systemsManager.themeManager.listThemes().length
  });

  // ✅ NEW: Phase 7 - Phase 2.3: Pre-render validation of overlays
  if (systemsManager.validationService && mergedConfig.overlays && mergedConfig.overlays.length > 0) {
    lcardsLog.debug('[PipelineCore] 🔍 Phase 2.3: Validating overlays before rendering');

    const validation = systemsManager.validationService.validateAll(mergedConfig.overlays, {
      viewBox: mergedConfig.view_box || [0, 0, 800, 600],
      anchors: mergedConfig.anchors || {},
      dataSourceManager: systemsManager.dataSourceManager
    });

    if (!validation.valid) {
      lcardsLog.warn('[PipelineCore] ⚠️ Overlay validation found issues:', {
        total: validation.summary.total,
        invalid: validation.summary.invalid,
        errors: validation.summary.errors,
        warnings: validation.summary.warnings
      });

      // Log detailed validation errors in debug mode
      if (mergedConfig?.debug?.validation) {
        const formattedErrors = systemsManager.validationService.formatErrors(validation);
        lcardsLog.debug('[PipelineCore] Validation details:\n' + formattedErrors);
      }

      // In strict mode, filter out invalid overlays
      if (mergedConfig?.debug?.strictValidation) {
        const validOverlayIds = validation.results
          .filter(r => r.valid)
          .map(r => r.overlayId);

        const originalCount = mergedConfig.overlays.length;
        mergedConfig.overlays = mergedConfig.overlays.filter(o =>
          validOverlayIds.includes(o.id)
        );

        lcardsLog.info('[PipelineCore] 🚮 Filtered out invalid overlays in strict mode:', {
          removed: originalCount - mergedConfig.overlays.length,
          remaining: mergedConfig.overlays.length
        });
      }
    } else {
      lcardsLog.debug('[PipelineCore] ✅ All overlays passed validation');
    }

    // Store validation results in config for debugging
    mergedConfig.__validation = {
      timestamp: Date.now(),
      summary: validation.summary,
      results: validation.results
    };
  } else if (!systemsManager.validationService) {
    lcardsLog.debug('[PipelineCore] ⏭️ Skipping overlay validation (ValidationService not available)');
  }

  // PHASE 3: Build card model (now safe to process overlays)
  lcardsLog.debug('[PipelineCore] 🏗️ Phase 3: Building card model');
  const cardModel = await buildCardModel(mergedConfig);

  // Ensure anchors are available
  if (!cardModel.anchors) cardModel.anchors = {};
  if (!Object.keys(cardModel.anchors).length) {
    if (mergedConfig.anchors && Object.keys(mergedConfig.anchors).length) {
      cardModel.anchors = { ...mergedConfig.anchors };
      lcardsLog.debug('[PipelineCore] Adopted user anchors');
    }
  }

  // PHASE 4: Complete systems initialization with card model
  lcardsLog.debug('[PipelineCore] ⚙️ Phase 4: Completing systems initialization');
  try {
    await systemsManager.completeSystems(mergedConfig, cardModel, mountEl, hass);
  } catch (error) {
    lcardsLog.error('[PipelineCore] ❌ Systems completion failed:', error);
    throw new Error(`Systems completion failed: ${error.message}`);
  }

  // Initialize HASS state
  if (hass) {
    lcardsLog.debug('[PipelineCore] 📥 Initializing HASS via ingestHass');
    systemsManager.ingestHass(hass);
  }

  // PHASE 5: Early debug and routing setup
  lcardsLog.debug('[PipelineCore] 🔍 Phase 5: Setting up debug infrastructure');
  if (typeof window !== 'undefined') {
    window.lcards = window.lcards || {};
    window.lcards.debug = window.lcards.debug || {};
    window.lcards.debug.msd = window.lcards.debug.msd || {};

    // ✅ PHASE 4: Deprecated - use pipelineInstance._internal.debugManager
    window.lcards.debug.msd.debugManager = systemsManager.debugManager;
    window.lcards.debug.msd.routing = systemsManager.router;

    // Make core systems available BEFORE any overlay rendering
    window.lcards.debug.msd.pipelineInstance = {
      systemsManager: systemsManager,
      dataSourceManager: systemsManager.dataSourceManager,
      config: mergedConfig,
      themeManager: systemsManager.themeManager,
      styleResolver: styleResolver,  // ✅ NEW: Phase 6 - Add StyleResolver to debug
      validationService: systemsManager.validationService,

      // ✅ PHASE 4: Internal subsystems namespace (non-public API)
      _internal: {
        debugManager: systemsManager.debugManager,
        router: systemsManager.router
      }
    };

    lcardsLog.debug('[PipelineCore] Essential subsystems ready for overlay rendering:', {
      hasSystemsManager: !!systemsManager,
      hasDataSourceManager: !!systemsManager.dataSourceManager,
      hasThemeManager: !!systemsManager.themeManager,
      hasStyleResolver: !!styleResolver,  // ✅ NEW: Phase 6
      hasValidationService: !!systemsManager.validationService,
      hasRouter: !!systemsManager.router,
      dataSourceCount: systemsManager.dataSourceManager?.listIds?.()?.length || 0
    });

    // Dispatch routing ready event
    try {
      window.dispatchEvent(new CustomEvent('msd-routing-ready'));
    } catch (e) {
      // Non-fatal; older browsers or sandbox contexts might block custom events.
    }
  }

  // PHASE 6: Initialize model builder (now everything is ready)
  lcardsLog.debug('[PipelineCore] 🏭 Phase 6: Initializing model builder');
  const modelBuilder = new ModelBuilder(mergedConfig, cardModel, systemsManager);

  // Store ModelBuilder reference in SystemsManager for accessibility
  systemsManager.modelBuilder = modelBuilder;

  /**
   * Internal re-render function that recomputes the model
   * and triggers the AdvancedRenderer + debug visualization pipeline.
   * @returns {Object|undefined} Renderer result object
   */
  async function reRender() {
    lcardsLog.info('[PipelineCore] 🔄 reRender() ENTRY - FULL RE-RENDER TRIGGERED', {
      timestamp: new Date().toISOString(),
      renderInProgress: systemsManager._renderInProgress,
      rulePatches: systemsManager.rulesEngine?.getLastEvaluationResult?.()?.overlayPatches?.length || 'N/A'
    });

    if (!systemsManager.themeManager) {
      lcardsLog.error('[PipelineCore] ❌ ThemeManager not available during re-render - aborting');
      return { success: false, error: 'ThemeManager not available' };
    }

    // IMPROVED: Queue renders instead of blocking them
    if (systemsManager._renderInProgress) {
      lcardsLog.debug('[PipelineCore] 🕐 Render in progress, queueing re-render');
      systemsManager._queuedReRender = true;
      return { success: false, reason: 'render_in_progress', queued: true };
    }

    systemsManager._renderInProgress = true;
    systemsManager._queuedReRender = false;

    try {
      lcardsLog.debug('[PipelineCore] 📊 Computing resolved model...');
      const startTime = performance.now();
      const resolvedModel = await modelBuilder.computeResolvedModel();

      lcardsLog.debug('[PipelineCore] ✅ Resolved model computed:', {
        overlayCount: resolvedModel.overlays.length,
        controlOverlays: resolvedModel.overlays.filter(o => o.type === 'control').length,
        hasAnchors: !!resolvedModel.anchors,
        hasViewBox: !!resolvedModel.viewBox
      });

      lcardsLog.debug(`[PipelineCore] 🎨 Starting AdvancedRenderer.render() - overlays: ${resolvedModel.overlays.length}`);

      // ADDED: Defensive rendering with error boundary
      let renderResult;
      try {
        renderResult = systemsManager.renderer.render(resolvedModel);
        lcardsLog.debug('[PipelineCore] ✅ AdvancedRenderer.render() completed successfully:', renderResult);
      } catch (renderError) {
        lcardsLog.error('[PipelineCore] ❌ AdvancedRenderer.render() FAILED:', renderError);
        lcardsLog.error('[PipelineCore] ❌ Render error stack:', renderError.stack);
        return { success: false, error: renderError.message, phase: 'advanced_renderer' };
      }

      // ANIMATION INTEGRATION: Notify AnimationManager about rendered overlays
      if (systemsManager.animationManager) {
        lcardsLog.debug('[PipelineCore] 🎬 Notifying AnimationManager about rendered overlays...');

        // Track text overlays for re-initialization after font stabilization
        const textOverlays = [];

        for (const overlay of resolvedModel.overlays) {
          // Check if AnimationManager has animations registered for this overlay
          const hasAnimations = systemsManager.animationManager.registeredAnimations.has(overlay.id);
          if (hasAnimations) {
            // Find the rendered element
            const element = mountEl.querySelector(`[data-overlay-id="${overlay.id}"]`);
            if (element) {
              try {
                await systemsManager.animationManager.onOverlayRendered(overlay.id, element, overlay);
                lcardsLog.debug(`[PipelineCore] ✅ Initialized animations for overlay: ${overlay.id}`);

                // Track text overlays for re-initialization after font stabilization
                if (overlay.type === 'text') {
                  textOverlays.push({ id: overlay.id, overlay });
                }
              } catch (animError) {
                lcardsLog.error(`[PipelineCore] ❌ Failed to initialize animations for ${overlay.id}:`, animError);
              }
            } else {
              lcardsLog.warn(`[PipelineCore] ⚠️ Could not find element for animated overlay: ${overlay.id}`);
            }
          }
        }

        // Re-initialize text overlay animations after font stabilization completes
        // Font stabilization happens async and re-renders text elements
        if (textOverlays.length > 0) {
          setTimeout(async () => {
            lcardsLog.debug('[PipelineCore] 🔄 Re-initializing animations after font stabilization...', {
              overlays: textOverlays.map(t => t.id)
            });

            for (const { id, overlay } of textOverlays) {
              const element = mountEl.querySelector(`[data-overlay-id="${id}"]`);
              if (element) {
                try {
                  await systemsManager.animationManager.onOverlayRendered(id, element, overlay);
                  lcardsLog.debug(`[PipelineCore] ✅ Re-initialized animations for text overlay: ${id}`);
                } catch (animError) {
                  lcardsLog.error(`[PipelineCore] ❌ Failed to re-initialize animations for ${id}:`, animError);
                }
              }
            }
          }, 1000); // Wait for font stabilization to complete (typically 3-10 passes)
        }

        lcardsLog.debug('[PipelineCore] ✅ AnimationManager notified about all rendered overlays');
      }

      lcardsLog.debug('[PipelineCore] 🎮 Starting renderDebugAndControls()...');
      // CHANGED: Make debug and controls rendering more defensive
      try {
        await systemsManager.renderDebugAndControls(resolvedModel, mountEl);
        lcardsLog.debug('[PipelineCore] ✅ renderDebugAndControls() completed successfully');
      } catch (debugControlsError) {
        lcardsLog.error('[PipelineCore] ❌ renderDebugAndControls() FAILED:', debugControlsError);
        lcardsLog.error('[PipelineCore] ❌ Debug/Controls error stack:', debugControlsError.stack);
        // Don't fail the entire render - just log the error
        lcardsLog.warn('[PipelineCore] ⚠️ Continuing without debug/controls rendering due to error');
      }

      const renderTime = performance.now() - startTime;
      lcardsLog.debug(`[PipelineCore] ✅ reRender() COMPLETED in ${renderTime.toFixed(2)}ms`);

      return renderResult || { success: true };

    } catch (error) {
      lcardsLog.error('[PipelineCore] ❌ reRender() COMPLETELY FAILED:', error);
      lcardsLog.error('[PipelineCore] ❌ Complete failure stack:', error.stack);
      return { success: false, error: error.message };
    } finally {
      systemsManager._renderInProgress = false;
      lcardsLog.debug('[PipelineCore] 🏁 reRender() FINALLY block - _renderInProgress reset to false');

      // IMPROVED: Execute queued re-render if one was requested
      if (systemsManager._queuedReRender) {
        lcardsLog.debug('[PipelineCore] 🔄 Executing queued re-render');
        systemsManager._queuedReRender = false;
        // Use setTimeout to avoid immediate recursion and allow stack to clear
        setTimeout(() => reRender(), 50);
      }
    }
  }

  // Connect reRender callback to systems
  systemsManager.setReRenderCallback(reRender);

  // PHASE 7: Initial render - now everything is properly sequenced
  lcardsLog.debug('[PipelineCore] 🎬 Phase 7: Performing initial render');
  lcardsLog.debug('[PipelineCore] DataSourceManager status:', {
    sourcesCount: systemsManager.dataSourceManager?.getAllSources?.()?.length || 0,
    entityCount: systemsManager.dataSourceManager?.listIds?.()?.length || 0
  });

  const initialRenderResult = await reRender();

  lcardsLog.debug('[PipelineCore] Initial render completed:', {
    overlayCount: initialRenderResult?.overlayCount || 0,
    errors: initialRenderResult?.errors || 0
  });

  // ✅ NEW: Apply base SVG filters after initial render
  if (cardModel.baseSvg?.filters) {
    lcardsLog.debug('[PipelineCore] 🎨 Applying initial base SVG filters:', cardModel.baseSvg.filters);
    try {
      // Target the base content group (__ prefix = internal/reserved ID, not an anchor)
      const baseContentGroup = mountEl?.querySelector('#__msd-base-content');

      lcardsLog.debug('[PipelineCore] 🔍 Filter application details:', {
        hasMountEl: !!mountEl,
        mountElTag: mountEl?.tagName,
        baseContentGroup: !!baseContentGroup,
        baseContentId: baseContentGroup?.id,
        currentFilter: baseContentGroup?.style?.filter,
        filtersToApply: cardModel.baseSvg.filters
      });

      if (baseContentGroup) {
        lcardsLog.debug('[PipelineCore] 🎨 Applying base SVG filters during initialization:', {
          elementId: baseContentGroup.id,
          elementTag: baseContentGroup.tagName,
          currentFilter: baseContentGroup.style.filter,
          filtersToApply: cardModel.baseSvg.filters,
          hasFiltersToApply: !!(cardModel.baseSvg.filters && Object.keys(cardModel.baseSvg.filters).length),
          elementConnected: baseContentGroup.isConnected,
          elementParent: baseContentGroup.parentElement?.tagName
        });

        applyBaseSvgFilters(baseContentGroup, cardModel.baseSvg.filters);

        // Verify filters were applied with delay to catch async issues
        setTimeout(() => {
          lcardsLog.debug('[PipelineCore] ✅ Base SVG filters verification after 50ms:', {
            appliedFilter: baseContentGroup.style.filter,
            elementId: baseContentGroup.id,
            elementTag: baseContentGroup.tagName,
            isStillConnected: baseContentGroup.isConnected
          });
        }, 50);
      } else {
        lcardsLog.warn('[PipelineCore] ⚠️ #__msd-base-content group not found, cannot apply filters (overlays will not be affected)');
      }
    } catch (filterError) {
      lcardsLog.error('[PipelineCore] ❌ Failed to apply base SVG filters:', filterError);
    }
  }

  // PHASE 8: Create pipeline API and finalize
  lcardsLog.debug('[PipelineCore] 🔌 Phase 8: Creating pipeline API');
  const pipelineApi = createPipelineApi(
    mergedConfig, cardModel, systemsManager, modelBuilder, reRender
  );

  // Setup debug interface with DebugManager integration
  setupDebugInterface(pipelineApi, mergedConfig, provenance, systemsManager, modelBuilder);

  // Initialize HUD service with mount element
  if (typeof window !== 'undefined' && window.lcards.debug.msd?.hud?.setMountElement) {
    window.lcards.debug.msd.hud.setMountElement(mountEl);
  }

  // ✅ PHASE 4: Attach unified API AFTER DebugInterface setup
  // This ensures modern namespaces overwrite legacy properties
  lcardsLog.debug('[PipelineCore] Attaching unified API after DebugInterface setup');
  LCARdSUnifiedAPI.attach();

  // Augment debug tracking (now that pipelineApi exists)
  if (typeof window !== 'undefined') {
    window.lcards = window.lcards || {};
    window.lcards.debug = window.lcards.debug || {};
    window.lcards.debug.msd = window.lcards.debug.msd || {};
    window.lcards.debug.msd.validation = { issues: () => mergedConfig.__issues };
    window.lcards.debug.msd.pipelineInstance = pipelineApi;
    window.lcards.debug.msd._provenance = provenance;

    // Ensure routing reference is consistent (in case late changes happened)
    if (!window.lcards.debug.msd.routing) {
      window.lcards.debug.msd.routing = systemsManager.router;
      try {
        window.dispatchEvent(new CustomEvent('msd-routing-ready'));
      } catch(_) {}
    }
  }

  // ✅ NEW: Register the MSD card with LCARdS Core Infrastructure
  try {
    // Generate unique card ID based on config or element
    const cardId = `msd_${mergedConfig.id || Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    lcardsLog.debug('[PipelineCore] 🏷️ Registering MSD card with core:', cardId);

    await lcardsCore.registerCard(cardId, {
      type: 'msd',
      mountEl,
      pipelineApi
    }, mergedConfig);

    lcardsLog.debug('[PipelineCore] ✅ MSD card registered with LCARdS Core Infrastructure');
  } catch (error) {
    lcardsLog.warn('[PipelineCore] ⚠️ Failed to register MSD card with core:', error);
  }

  lcardsLog.debug('[PipelineCore] ✅ Pipeline initialization complete with enhanced sequencing');
  return pipelineApi;
}

function createDisabledPipeline(mergedConfig, issues, provenance) {
  // Create styled error content
  const errorHtml = createValidationErrorDisplay(issues, mergedConfig);

  const disabledPipeline = {
    enabled: false,
    errors: issues.errors,
    warnings: issues.warnings,
    html: errorHtml, // ADDED: HTML content for rendering
    getResolvedModel: () => null,
    ingestHass: () => {},
    updateEntities: () => {},
    listEntities: () => [],
    getEntity: () => null,
    getActiveProfiles: () => [],
    getAnchors: () => (mergedConfig.anchors || {}),
    repairAnchorsFromMerged: () => false,
    getPerf: () => ({})
  };

  if (typeof window !== 'undefined') {
    window.lcards = window.lcards || {};
    window.lcards.debug = window.lcards.debug || {};
    window.lcards.debug.msd = window.lcards.debug.msd || {};
    window.lcards.debug.msd.validation = { issues: () => mergedConfig.__issues };
    window.lcards.debug.msd.pipelineInstance = disabledPipeline;
    window.lcards.debug.msd._provenance = provenance;
  }
  return disabledPipeline;
}

/**
 * Create styled error display for validation failures
 * @private
 */
function createValidationErrorDisplay(issues, mergedConfig) {
  const errorCount = issues.errors.length;
  const warningCount = issues.warnings.length;

  // Group errors by type for better display
  const groupedErrors = {};
  issues.errors.forEach(error => {
    const category = error.code?.split('.')[0] || 'general';
    if (!groupedErrors[category]) groupedErrors[category] = [];
    groupedErrors[category].push(error);
  });

  let errorsHtml = '';
  Object.entries(groupedErrors).forEach(([category, categoryErrors]) => {
    errorsHtml += `
      <div style="margin-bottom: 16px;">
        <h4 style="
          color: #ff6666;
          font-size: 16px;
          margin: 0 0 8px 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        ">${category} (${categoryErrors.length})</h4>
        ${categoryErrors.slice(0, 5).map(error => `
          <div style="
            margin: 6px 0;
            padding: 8px;
            background: rgba(255, 102, 102, 0.1);
            border-left: 3px solid #ff6666;
            border-radius: 0 4px 4px 0;
          ">
            <div style="font-weight: bold; font-size: 14px; color: #ffcccc;">
              ${error.code || 'VALIDATION_ERROR'}
            </div>
            <div style="font-size: 13px; margin-top: 2px; line-height: 1.3;">
              ${error.message || error.msg || 'Unknown validation error'}
            </div>
            ${error.overlay ? `<div style="font-size: 12px; opacity: 0.8; margin-top: 2px;">Overlay: ${error.overlay}</div>` : ''}
            ${error.anchor ? `<div style="font-size: 12px; opacity: 0.8; margin-top: 2px;">Anchor: ${error.anchor}</div>` : ''}
          </div>
        `).join('')}
        ${categoryErrors.length > 5 ? `
          <div style="font-size: 12px; opacity: 0.6; text-align: center; margin-top: 4px;">
            ... ${categoryErrors.length - 5} more ${category} errors
          </div>
        ` : ''}
      </div>
    `;
  });

  // Show some warnings if we have space
  let warningsHtml = '';
  if (warningCount > 0 && errorCount < 10) {
    warningsHtml = `
      <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #444;">
        <h4 style="
          color: #ffaa00;
          font-size: 14px;
          margin: 0 0 8px 0;
          text-transform: uppercase;
        ">Warnings (${warningCount})</h4>
        ${issues.warnings.slice(0, 3).map(warning => `
          <div style="
            margin: 4px 0;
            padding: 6px;
            background: rgba(255, 170, 0, 0.1);
            border-left: 2px solid #ffaa00;
            border-radius: 0 3px 3px 0;
            font-size: 12px;
          ">
            ${warning.message || warning.msg || 'Unknown warning'}
          </div>
        `).join('')}
        ${warningCount > 3 ? `
          <div style="font-size: 12px; opacity: 0.6; text-align: center;">
            ... ${warningCount - 3} more warnings
          </div>
        ` : ''}
      </div>
    `;
  }

  return `
    <div style="
      width: 99%;
      height: 400px;
      background: linear-gradient(135deg, #220011 0%, #110006 100%);
      border: 2px solid #ff6666;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      color: #ff6666;
      font-family: 'Antonio', monospace;
      position: relative;
      overflow: hidden;
    ">
      <!-- Background pattern -->
      <div style="
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image:
          radial-gradient(circle at 20% 20%, rgba(255,102,102,0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(255,170,0,0.1) 0%, transparent 50%);
        z-index: 0;
      "></div>

      <!-- Header -->
      <div style="
        z-index: 1;
        text-align: center;
        padding: 20px 20px 16px 20px;
        border-bottom: 1px solid #444;
      ">
        <div style="font-size: 24px; font-weight: bold; margin-bottom: 8px;">
          ❌ MSD Configuration Error
        </div>
        <div style="font-size: 14px; color: #ffcccc;">
          ${errorCount} validation ${errorCount === 1 ? 'error' : 'errors'} must be fixed
        </div>
        ${warningCount > 0 ? `
          <div style="font-size: 13px; color: #ffcc99; margin-top: 4px;">
            ${warningCount} ${warningCount === 1 ? 'warning' : 'warnings'} detected
          </div>
        ` : ''}
      </div>

      <!-- Content -->
      <div style="
        z-index: 1;
        flex: 1;
        padding: 16px 20px;
        overflow-y: auto;
        max-height: calc(100% - 120px);
      ">
        ${errorsHtml}
        ${warningsHtml}
      </div>

      <!-- Footer -->
      <div style="
        z-index: 1;
        text-align: center;
        padding: 12px;
        border-top: 1px solid #444;
        background: rgba(0,0,0,0.3);
      ">
        <div style="font-size: 12px; opacity: 0.8;">
          Fix configuration errors to enable MSD rendering
        </div>
      </div>

      <!-- Corner accents -->
      <div style="
        position: absolute;
        top: 10px;
        right: 10px;
        width: 30px;
        height: 30px;
        border-top: 2px solid #ff6666;
        border-right: 2px solid #ff6666;
        border-radius: 0 6px 0 0;
        z-index: 1;
      "></div>
      <div style="
        position: absolute;
        bottom: 10px;
        left: 10px;
        width: 30px;
        height: 30px;
        border-bottom: 2px solid #ff6666;
        border-left: 2px solid #ff6666;
        border-radius: 0 0 0 6px;
        z-index: 1;
      "></div>
    </div>
  `;
}

/**
 * Creates and returns the MSD pipeline external API.
 * @param {Object} mergedConfig
 * @param {Object} cardModel
 * @param {SystemsManager} systemsManager
 * @param {ModelBuilder} modelBuilder
 * @param {Function} reRender
 * @returns {Object} API
 */
function createPipelineApi(mergedConfig, cardModel, systemsManager, modelBuilder, reRender) {
  const api = {
    enabled: true,
    version: mergedConfig.version || 1,
    config: mergedConfig,

    // Core systems
    systemsManager,
    dataSourceManager: systemsManager.dataSourceManager,
    rulesEngine: systemsManager.rulesEngine,
    renderer: systemsManager.renderer,
    router: systemsManager.router,
    validationService: systemsManager.validationService,

    /**
     * Inspect routing for a given overlay id and compute path data.
     * @param {string} id
     * @returns {Object|null}
     */
    routingInspect: (id) => {
      const resolvedModel = modelBuilder.getResolvedModel();
      const ov = (resolvedModel?.overlays || []).find(o => o.id === id);
      if (!ov) return null;
      const raw = ov._raw || ov.raw || {};
      const a1 = cardModel.anchors[raw.anchor];
      const a2 = cardModel.anchors[raw.attach_to] || cardModel.anchors[raw.attachTo];
      if (!a1 || !a2) return null;
      const req = systemsManager.router.buildRouteRequest(ov, a1, a2);
      return systemsManager.router.computePath(req);
    },

    getResolvedModel: () => modelBuilder.getResolvedModel(),

    /**
     * Force a manual re-render.
     */
    reRender: () => {
      try {
        lcardsLog.debug('[PipelineCore] Manual re-render triggered');
        return reRender();
      } catch (error) {
        lcardsLog.error('[PipelineCore] Manual re-render failed:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Set or update an anchor point.
     * @param {string} id
     * @param {Array<number>} pt
     * @returns {boolean}
     */
    setAnchor(id, pt) {
      if (!id || !Array.isArray(pt) || pt.length !== 2) return false;
      if (!cardModel.anchors) cardModel.anchors = {};
      cardModel.anchors[id] = [Number(pt[0]), Number(pt[1])];
      const resolvedModel = modelBuilder.getResolvedModel();
      if (resolvedModel?.anchors) resolvedModel.anchors[id] = cardModel.anchors[id];
      systemsManager.router.invalidate && systemsManager.router.invalidate('*');
      try {
        if (systemsManager.renderer && resolvedModel) {
          systemsManager.renderer._routerOverlaySync = false;
          systemsManager.renderer.render(resolvedModel);
        }
      } catch(_) {}
      return true;
    },

    async ingestHass(hass) {
      // Distribute HASS to SystemsManager (which will handle Rules Engine)
      if (this.systemsManager) {
        this.systemsManager.ingestHass(hass);
      }
    },

    updateEntities: (map) => systemsManager.updateEntities(map),
    listEntities: () => systemsManager.entityRuntime.listIds(),
    getEntity: (id) => systemsManager.entityRuntime.getEntity(id),
    getActiveProfiles: () => [],
    getAnchors: () => ({ ...cardModel.anchors }),
    getPerf: () => perfGetAll(),

    // Add debug API powered by DebugManager
    debug: {
      enable: (feature) => systemsManager.debugManager.enable(feature),
      disable: (feature) => systemsManager.debugManager.disable(feature),
      toggle: (feature) => systemsManager.debugManager.toggle(feature),
      setScale: (scale) => systemsManager.debugManager.setScale(scale),
      status: () => systemsManager.debugManager.getSnapshot(),
      onChange: (callback) => systemsManager.debugManager.onChange(callback)
    },

    getDataSourceManager: () => systemsManager.dataSourceManager,
    _reRenderCallback: reRender,

    // Action system methods
    setCardInstance: (cardInstance) => {
      lcardsLog.debug('[PipelineCore] Setting card instance:', {
        hasCardInstance: !!cardInstance,
        cardType: cardInstance?.tagName,
        hasHandleAction: typeof cardInstance?._handleAction,
        hasHass: !!cardInstance?.hass
      });
      // Store in SystemsManager for broader access
      systemsManager.cardInstance = cardInstance;
      lcardsLog.debug('[PipelineCore] Card instance set via API for action system');
    }
  };

  return api;
}

