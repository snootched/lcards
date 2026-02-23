import { processAndValidateConfig } from './ConfigProcessor.js';
import { MsdCardCoordinator } from './MsdCardCoordinator.js';
import { ModelBuilder } from './ModelBuilder.js';
// UnifiedAPI and DebugInterface removed - legacy architecture
// Use DOM queries to access cards: document.querySelector('lcards-msd')
import { buildCardModel } from '../model/CardModel.js';
import { perfGetAll } from '../../utils/performance.js';
import { lcardsLog } from '../../utils/lcards-logging.js';
// ✅ CONSOLIDATED: Use Core ValidationService singleton instead of MSD-specific ValidationService
import { applyBaseSvgFilters } from '../utils/BaseSvgFilters.js';
import { lcardsCore } from '../../core/lcards-core.js';

/**
 * Initialize the MSD processing/rendering pipeline.
 * Ensures pack loading and defaults management complete before overlay processing
 *
 * @param {Object} userMsdConfig - User supplied MSD config.
 * @param {string} svgContent - SVG content string (for anchor extraction)
 * @param {HTMLElement|ShadowRoot} mountEl - Mount/root element (may be a shadowRoot).
 * @param {Object|null} hass - Home Assistant instance (if available).
 * @param {string|null} cardGuid - Card instance GUID for HUD registration
 * @returns {Promise<Object>} Pipeline API
 */
export async function initMsdPipeline(userMsdConfig, svgContent, mountEl, hass = null, cardGuid = null) {
  lcardsLog.info('[PipelineCore] 🚀 Starting MSD pipeline initialization with SVG extraction', {
    hasCardGuid: !!cardGuid,
    cardGuid
  });

  // ✅ NEW: Preserve full config before extraction (deep clone to ensure immutability)
  const fullUserConfig = structuredClone(userMsdConfig);  // Store full config with __provenance

  // Configuration processing and pack merging WITH anchor extraction
  lcardsLog.trace('[PipelineCore] 🔧 Config processing with SVG extraction');
  const { mergedConfig, issues, provenance } = await processAndValidateConfig(userMsdConfig, svgContent);

  lcardsLog.debug('[PipelineCore] Config processed:', {
    hasViewBox: !!mergedConfig.view_box,
    anchorCount: mergedConfig.anchors ? Object.keys(mergedConfig.anchors).length : 0,
    overlayCount: mergedConfig.overlays?.length || 0,
    svgMetadata: mergedConfig._svgMetadata
  });

  // Handle validation errors early
  if (issues.errors.length) {
    lcardsLog.error('[PipelineCore] Validation errors – pipeline disabled', issues.errors);
    return createDisabledPipeline(mergedConfig, issues, provenance, fullUserConfig);
  }

  // Initialize MsdCardCoordinator with theme loading BEFORE any overlay processing
  lcardsLog.trace('[PipelineCore] 🔧 Initializing MsdCardCoordinator and loading pack defaults');
  const coordinator = new MsdCardCoordinator();

  // CRITICAL: Initialize systems with pack defaults loading before overlay processing
  try {
    await coordinator.initializeSystemsWithPacksFirst(mergedConfig, mountEl, hass);

    // Use Core ValidationService singleton instead of creating MSD-specific instance
    lcardsLog.trace('[PipelineCore] Configuring Core ValidationService');
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
        lcardsLog.trace('[PipelineCore] Core ValidationService configured:', {
          schemaCount: overlayRegistry?.getSchemaCount() || 0,
          types: overlayRegistry?.getRegisteredTypes() || []
        });

        // Connect ValidationService to ThemeManager and DataSourceManager
        if (coordinator.themeManager) {
          validationService.setThemeManager(coordinator.themeManager);
          lcardsLog.trace('[PipelineCore] ValidationService connected to ThemeManager');
        }

        if (coordinator.dataSourceManager) {
          validationService.setDataSourceManager(coordinator.dataSourceManager);
          lcardsLog.trace('[PipelineCore] ValidationService connected to DataSourceManager');
        }

        // Make ValidationService globally accessible (reference to core singleton)
        if (typeof window !== 'undefined') {
          if (!window.lcards) window.lcards = {};
          window.lcards.validationService = validationService;
          lcardsLog.trace('[PipelineCore] ValidationService available at window.lcards.validationService');
        }

        // Store in MsdCardCoordinator (reference to core singleton)
        coordinator.validationService = validationService;

        lcardsLog.trace('[PipelineCore] Core ValidationService configured for MSD');
      } else {
        lcardsLog.warn('[PipelineCore] ⚠️ Core ValidationService not available - overlays will not be pre-validated');
      }

    } catch (validationInitError) {
      lcardsLog.warn('[PipelineCore] ⚠️ ValidationService configuration failed:', validationInitError);
      lcardsLog.warn('[PipelineCore] ⚠️ Continuing without ValidationService - overlays will not be pre-validated');
      // Don't fail the pipeline - validation is helpful but not critical
    }

  } catch (error) {
    lcardsLog.error('[PipelineCore] ❌ MsdCardCoordinator initialization failed:', error);
    throw new Error(`MsdCardCoordinator initialization failed: ${error.message}`);
  }

  // Theme manager singleton is always initialized by Core before cards load
  // Coordinator references it directly (no validation needed)
  lcardsLog.trace('[PipelineCore] Theme system ready');

  // ✅ REMOVED: Redundant overlay validation pass
  // Validation already happened in ConfigProcessor via CoreConfigManager.processConfig()
  // Results are in mergedConfig.__issues from the main validation pass
  // No need to validate overlays again here - it's redundant and causes false positives
  // when schemas check for properties that get added during ModelBuilder processing

  // Build card model (now safe to process overlays)
  lcardsLog.trace('[PipelineCore] 🏗️ Building card model');
  const cardModel = await buildCardModel(mergedConfig);

  // Ensure anchors are available
  if (!cardModel.anchors) cardModel.anchors = {};
  if (!Object.keys(cardModel.anchors).length) {
    if (mergedConfig.anchors && Object.keys(mergedConfig.anchors).length) {
      cardModel.anchors = { ...mergedConfig.anchors };
      lcardsLog.trace('[PipelineCore] Adopted user anchors');
    }
  }

  // Complete systems initialization with card model
  lcardsLog.trace('[PipelineCore] Completing systems initialization');
  try {
    await coordinator.completeSystems(mergedConfig, cardModel, mountEl, hass);
  } catch (error) {
    lcardsLog.error('[PipelineCore] ❌ Systems completion failed:', error);
    throw new Error(`Systems completion failed: ${error.message}`);
  }

  // ✅ NEW: Initialize AnimationManager with overlays to register animations
  if (coordinator.animationManager && mergedConfig.overlays) {
    lcardsLog.trace('[PipelineCore] 🎬 Initializing AnimationManager with overlays');
    try {
      // ⚠️ CRITICAL: Set mountEl explicitly so AnimationManager can find overlay elements
      coordinator.animationManager.mountEl = mountEl;

      await coordinator.animationManager.initialize(mergedConfig.overlays, {
        customPresets: mergedConfig.animation_presets || {},
        timelines: mergedConfig.timelines || {},
        suppressMountWarning: true // mountEl already set by core singleton init
      });
      lcardsLog.info('[PipelineCore] ✅ AnimationManager initialized:', {
        overlaysWithAnimations: coordinator.animationManager.registeredAnimations.size,
        overlayIds: Array.from(coordinator.animationManager.registeredAnimations.keys()),
        mountEl: !!coordinator.animationManager.mountEl
      });
    } catch (animError) {
      lcardsLog.error('[PipelineCore] ❌ AnimationManager initialization failed:', animError);
      // Don't fail pipeline - animations are optional
    }
  }

  // Initialize HASS state
  if (hass) {
    lcardsLog.trace('[PipelineCore] 📥 Initializing HASS via ingestHass');
    coordinator.ingestHass(hass);
  }

  // Pipeline initialization logging
  lcardsLog.trace('[PipelineCore] Core systems initialized:', {
    hasCoordinator: !!coordinator,
    hasDataSourceManager: !!coordinator.dataSourceManager,
    hasThemeManager: !!coordinator.themeManager,
    hasValidationService: !!coordinator.validationService,
    hasRouter: !!coordinator.router,
    dataSourceCount: coordinator.dataSourceManager?.listIds?.()?.length || 0
  });

  // Initialize model builder (now everything is ready)
  lcardsLog.trace('[PipelineCore] 🏭 Initializing model builder');
  const modelBuilder = new ModelBuilder(mergedConfig, cardModel, coordinator);

  // Store ModelBuilder reference in MsdCardCoordinator for accessibility
  coordinator.modelBuilder = modelBuilder;

  /**
   * Internal re-render function that recomputes the model
   * and triggers the AdvancedRenderer + debug visualization pipeline.
   * @returns {Object|undefined} Renderer result object
   */
  async function reRender() {
    lcardsLog.info('[PipelineCore] 🔄 reRender() ENTRY - FULL RE-RENDER TRIGGERED', {
      timestamp: new Date().toISOString(),
      renderInProgress: coordinator._renderInProgress,
      rulePatches: coordinator.rulesEngine?.getLastEvaluationResult?.()?.overlayPatches?.length || 'N/A'
    });

    // IMPROVED: Queue renders instead of blocking them
    if (coordinator._renderInProgress) {
      lcardsLog.trace('[PipelineCore] Render in progress, queueing re-render');
      coordinator._queuedReRender = true;
      return { success: false, reason: 'render_in_progress', queued: true };
    }

    coordinator._renderInProgress = true;
    coordinator._queuedReRender = false;

    try {
      lcardsLog.trace('[PipelineCore] 📊 Computing resolved model...');
      const startTime = performance.now();
      const resolvedModel = await modelBuilder.computeResolvedModel();

      lcardsLog.trace('[PipelineCore] Resolved model computed:', {
        overlayCount: resolvedModel.overlays.length,
        controlOverlays: resolvedModel.overlays.filter(o => o.type === 'control').length,
        hasAnchors: !!resolvedModel.anchors,
        hasViewBox: !!resolvedModel.viewBox
      });

      lcardsLog.trace(`[PipelineCore] 🎨 Starting AdvancedRenderer.render() - overlays: ${resolvedModel.overlays.length}`);

      // ADDED: Defensive rendering with error boundary
      let renderResult;
      try {
        renderResult = await coordinator.renderer.render(resolvedModel);
        lcardsLog.trace('[PipelineCore] AdvancedRenderer.render() completed successfully:', renderResult);
      } catch (renderError) {
        lcardsLog.error('[PipelineCore] ❌ AdvancedRenderer.render() FAILED:', renderError);
        lcardsLog.error('[PipelineCore] ❌ Render error stack:', renderError.stack);
        return { success: false, error: renderError.message, phase: 'advanced_renderer' };
      }

      // ANIMATION INTEGRATION: Notify AnimationManager about rendered overlays
      if (coordinator.animationManager) {
        lcardsLog.trace('[PipelineCore] Notifying AnimationManager about rendered overlays...');

        for (const overlay of resolvedModel.overlays) {
          // Check if AnimationManager has animations registered for this overlay
          const hasAnimations = coordinator.animationManager.registeredAnimations.has(overlay.id);
          if (hasAnimations) {
            // Find the rendered element
            const element = mountEl.querySelector(`[data-overlay-id="${overlay.id}"]`);
            if (element) {
              try {
                await coordinator.animationManager.onOverlayRendered(overlay.id, element, overlay, coordinator);
                lcardsLog.trace(`[PipelineCore] Initialized animations for overlay: ${overlay.id}`);
              } catch (animError) {
                lcardsLog.error(`[PipelineCore] ❌ Failed to initialize animations for ${overlay.id}:`, animError);
              }
            } else {
              lcardsLog.warn(`[PipelineCore] ⚠️ Could not find element for animated overlay: ${overlay.id}`);
            }
          }
        }

        lcardsLog.trace('[PipelineCore] AnimationManager notified about all rendered overlays');
      }

      lcardsLog.trace('[PipelineCore] Starting renderDebugAndControls()...');
      // CHANGED: Make debug and controls rendering more defensive
      // NOTE: Controls are now rendered by AdvancedRenderer in Phase 2a
      // This only handles debug visualization overlays (anchors, bounding boxes, etc.)
      try {
        await coordinator.renderDebugAndControls(resolvedModel, mountEl);
        lcardsLog.trace('[PipelineCore] renderDebugAndControls() completed successfully');
      } catch (debugControlsError) {
        lcardsLog.error('[PipelineCore] ❌ renderDebugAndControls() FAILED:', debugControlsError);
        lcardsLog.error('[PipelineCore] ❌ Debug/Controls error stack:', debugControlsError.stack);
        // Don't fail the entire render - just log the error
        lcardsLog.warn('[PipelineCore] ⚠️ Continuing without debug/controls rendering due to error');
      }

      const renderTime = performance.now() - startTime;
      lcardsLog.trace(`[PipelineCore] reRender() COMPLETED in ${renderTime.toFixed(2)}ms`);

      return renderResult || { success: true };

    } catch (error) {
      lcardsLog.error('[PipelineCore] ❌ reRender() COMPLETELY FAILED:', error);
      lcardsLog.error('[PipelineCore] ❌ Complete failure stack:', error.stack);
      return { success: false, error: error.message };
    } finally {
      coordinator._renderInProgress = false;
      lcardsLog.trace('[PipelineCore] reRender() FINALLY block - _renderInProgress reset to false');

      // IMPROVED: Execute queued re-render if one was requested
      if (coordinator._queuedReRender) {
        lcardsLog.trace('[PipelineCore] Executing queued re-render');
        coordinator._queuedReRender = false;
        // Use setTimeout to avoid immediate recursion and allow stack to clear
        setTimeout(() => reRender(), 50);
      }
    }
  }

  // Connect reRender callback to systems
  coordinator.setReRenderCallback(reRender);

  // Initial render - now everything is properly sequenced
  lcardsLog.trace('[PipelineCore] 🎬 Performing initial render');
  lcardsLog.trace('[PipelineCore] DataSourceManager status:', {
    sourcesCount: coordinator.dataSourceManager?.getAllSources?.()?.length || 0,
    entityCount: coordinator.dataSourceManager?.listIds?.()?.length || 0
  });

  const initialRenderResult = await reRender();

  lcardsLog.debug('[PipelineCore] Initial render completed:', {
    overlayCount: initialRenderResult?.overlayCount || 0,
    errors: initialRenderResult?.errors || 0
  });

  // Apply base SVG filters after initial render
  if (cardModel.baseSvg?.filters) {
    lcardsLog.trace('[PipelineCore] 🎨 Applying initial base SVG filters:', cardModel.baseSvg.filters);
    try {
      // Target the base content group (__ prefix = internal/reserved ID, not an anchor)
      const baseContentGroup = mountEl?.querySelector('#__msd-base-content');

      lcardsLog.trace('[PipelineCore] 🔍 Filter application details:', {
        hasMountEl: !!mountEl,
        mountElTag: mountEl?.tagName,
        baseContentGroup: !!baseContentGroup,
        baseContentId: baseContentGroup?.id,
        currentFilter: baseContentGroup?.style?.filter,
        filtersToApply: cardModel.baseSvg.filters
      });

      if (baseContentGroup) {
        lcardsLog.trace('[PipelineCore] 🎨 Applying base SVG filters during initialization:', {
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
          lcardsLog.trace('[PipelineCore] ✅ Base SVG filters verification after 50ms:', {
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

  // Create pipeline API and finalize
  lcardsLog.trace('[PipelineCore] 🔌 Creating pipeline API');
  const pipelineApi = createPipelineApi(
    mergedConfig, cardModel, coordinator, modelBuilder, reRender, fullUserConfig
  );

  // Initialize HUD service with mount element
  if (typeof window !== 'undefined' && window.lcards.debug.msd?.hud?.setMountElement) {
    window.lcards.debug.msd.hud.setMountElement(mountEl);
  }

  // Legacy debug interface removed - use DOM-based card access
  // Example: document.querySelector('lcards-msd')._msdPipeline.coordinator.router
  lcardsLog.trace('[PipelineCore] ✅ Pipeline API created (access via card._msdPipeline)');

  // Provenance tracked in card via _provenanceTracker (PR #165)
  // Access via: card.getProvenance()

  // Augment debug tracking with validation issues helper
  if (typeof window !== 'undefined') {
    window.lcards = window.lcards || {};
    window.lcards.debug = window.lcards.debug || {};
    window.lcards.debug.msd = window.lcards.debug.msd || {};
    window.lcards.debug.msd.validation = { issues: () => mergedConfig.__issues };
  }

  lcardsLog.debug('[PipelineCore] ✅ Pipeline initialization complete');

  return pipelineApi;
}

function createDisabledPipeline(mergedConfig, issues, provenance, fullUserConfig) {
  // Create styled error content
  const errorHtml = createValidationErrorDisplay(issues, mergedConfig);

  const disabledPipeline = {
    enabled: false,
    errors: issues.errors,
    warnings: issues.warnings,
    html: errorHtml, // ADDED: HTML content for rendering

    // ✅ FIX: Return full config with provenance
    config: fullUserConfig,
    msdConfig: mergedConfig,

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
    // Provenance tracked in card via _provenanceTracker (PR #165)
    // Access via: card.getProvenance()
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
 *
 * @param {Object} mergedConfig - Processed MSD config with flat structure: {base_svg, overlays, anchors, ...}
 * @param {Object} cardModel - Built card model
 * @param {MsdCardCoordinator} coordinator - Card coordinator instance
 * @param {ModelBuilder} modelBuilder - Model builder instance
 * @param {Function} reRender - Re-render callback function
 * @param {Object} fullUserConfig - Full card config with nested structure: {type, id, msd: {...}, __provenance}
 * @returns {Object} Pipeline API with config and msdConfig properties
 */
function createPipelineApi(mergedConfig, cardModel, coordinator, modelBuilder, reRender, fullUserConfig) {
  const api = {
    enabled: true,
    version: mergedConfig.version || 1,

    // Full card config with provenance metadata
    config: fullUserConfig,

    // Processed MSD config for backward compatibility
    msdConfig: mergedConfig,

    // Core systems
    coordinator,
    dataSourceManager: coordinator.dataSourceManager,
    rulesEngine: coordinator.rulesEngine,
    renderer: coordinator.renderer,
    router: coordinator.router,
    validationService: coordinator.validationService,

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
      const req = coordinator.router.buildRouteRequest(ov, a1, a2);
      return coordinator.router.computePath(req);
    },

    getResolvedModel: () => modelBuilder.getResolvedModel(),

    /**
     * Force a manual re-render.
     */
    reRender: () => {
      try {
        lcardsLog.trace('[PipelineCore] Manual re-render triggered');
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
      coordinator.router.invalidate && coordinator.router.invalidate('*');
      try {
        if (coordinator.renderer && resolvedModel) {
          coordinator.renderer._routerOverlaySync = false;
          coordinator.renderer.render(resolvedModel);
        }
      } catch(_) {}
      return true;
    },

    async ingestHass(hass) {
      // Distribute HASS to MsdCardCoordinator (which will handle Rules Engine)
      if (this.coordinator) {
        this.coordinator.ingestHass(hass);
      }
    },

    updateEntities: (map) => coordinator.updateEntities(map),
    listEntities: () => coordinator.entityRuntime.listIds(),
    getEntity: (id) => coordinator.entityRuntime.getEntity(id),
    getActiveProfiles: () => [],
    getAnchors: () => ({ ...cardModel.anchors }),
    getPerf: () => perfGetAll(),

    // Add debug API powered by DebugManager
    debug: {
      enable: (feature) => coordinator.debugManager.enable(feature),
      disable: (feature) => coordinator.debugManager.disable(feature),
      toggle: (feature) => coordinator.debugManager.toggle(feature),
      setScale: (scale) => coordinator.debugManager.setScale(scale),
      status: () => coordinator.debugManager.getSnapshot(),
      onChange: (callback) => coordinator.debugManager.onChange(callback)
    },

    getDataSourceManager: () => coordinator.dataSourceManager,
    _reRenderCallback: reRender,

    // Action system methods
    setCardInstance: (cardInstance) => {
      lcardsLog.trace('[PipelineCore] Setting card instance:', {
        hasCardInstance: !!cardInstance,
        cardType: cardInstance?.tagName,
        hasHandleAction: typeof cardInstance?._handleAction,
        hasHass: !!cardInstance?.hass
      });
      // Store in MsdCardCoordinator for broader access
      coordinator.cardInstance = cardInstance;
      lcardsLog.trace('[PipelineCore] Card instance set via API for action system');
    }
  };

  return api;
}

