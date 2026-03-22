/**
 * @fileoverview LCARdS Master Systems Display (MSD) Card.
 *
 * Full-canvas SVG overlay card using the LCARdS MSD pipeline. Supports
 * arbitrary overlays (buttons, sliders, charts, elbows, HA cards) anchored
 * to SVG coordinate points, with routing lines, animation timelines,
 * DataSource bindings, and a visual drag-drop editor (MSD Studio).
 *
 * Extends {@link LCARdSCard} for singleton access, template evaluation,
 * rules-engine integration, and provenance tracking.
 */

import { html, css } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { LCARdSCard } from '../base/LCARdSCard.js';
import { lcardsLog } from '../utils/lcards-logging.js';
import { ColorUtils } from '../core/themes/ColorUtils.js';
import { initMsdPipeline } from '../msd/index.js';
import { getMsdSchema } from './schemas/msd-schema.js';

// Import editor component for getConfigElement()
import '../editor/cards/lcards-msd-editor.js';

/**
 * LCARdS MSD Card
 *
 * Key features:
 * - Full MSD pipeline integration (pipeline, routing, rendering)
 * - SVG-anchored overlay system with drag-drop studio editor
 * - Template pattern compatibility
 * - HASS update management with selective re-render
 * - Provenance tracking via inherited _provenanceTracker
 * - Theme token resolution via inherited helpers
 */
export class LCARdSMSDCard extends LCARdSCard {

    /** Card type identifier for CoreConfigManager */
    static CARD_TYPE = 'msd';

    /**
     * Get config element (editor) for Home Assistant GUI
     * @static
     * @returns {HTMLElement} Editor element
     */
    static getConfigElement() {
        // Static import - editor bundled with card (webpack config doesn't support splitting)
        return document.createElement('lcards-msd-editor');
    }

    static get properties() {
        return {
            ...super.properties,
            // MSD-specific state
            _msdPipeline: { type: Object, state: true },
            _msdConfig: { type: Object, state: true },
            _fullConfig: { type: Object, state: true },
            _svgContent: { type: String, state: true },
            _msdInstanceGuid: { type: String, state: true },
            _msdInitialized: { type: Boolean, state: true },
            _configIssues: { type: Object, state: true }
        };
    }

    static get styles() {
        return [
            super.styles,
            css`
                .lcards-msd-container {
                    width: 100%;
                    height: 100%;
                    position: relative;
                    overflow: hidden;
                }

                .lcards-msd-svg {
                    width: 100%;
                    height: 100%;
                    display: block;
                }

                .lcards-msd-overlays {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                }

                .lcards-msd-overlay {
                    position: absolute;
                    pointer-events: auto;
                }

                .lcards-msd-loading {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 200px;
                    font-size: 14px;
                    color: var(--primary-text-color);
                }
            `
        ];
    }

    constructor() {
        super();
        // MSD-specific state
        this._msdPipeline = null;
        this._msdConfig = null;
        this._fullConfig = null;
        this._svgContent = null;
        this._msdInstanceGuid = null;
        this._msdInitialized = false;
        this._configIssues = null;
    }

    // ============================================================================
    // LCARdSCard Lifecycle Implementation
    // ============================================================================

    /**
     * Called when element is inserted into DOM
     * Apply config ID to element if present
     */
    connectedCallback() {
        super.connectedCallback();

        // Apply config ID to element if present and element doesn't already have one
        if (this.config?.id && !this.id) {
            this.id = this.config.id;
            lcardsLog.trace(`[LCARdSMSDCard] Applied config ID to element: ${this.id}`);
        }

        // Re-detect preview mode now that we're in the DOM
        // setConfig() is called before element is mounted, so parentElement was null
        const newPreviewMode = this._detectPreviewMode();
        if (newPreviewMode !== this._isPreviewMode) {
            lcardsLog.debug('[LCARdSMSDCard] Preview mode re-detected after mount:', {
                before: this._isPreviewMode,
                after: newPreviewMode
            });
            this._isPreviewMode = /** @type {any} */ (newPreviewMode);
            this.requestUpdate(); // Trigger re-render with correct mode
        }
    }

    /**
     * Get card type for CoreConfigManager
     * @returns {string} Card type identifier
     */
    getCardType() {
        return /** @type {any} */ (this.constructor).CARD_TYPE;
    }

    /**
     * Called when config is updated by CoreConfigManager
     * Extract MSD configuration from processed config
     * @protected
     */
    _onConfigUpdated() {
        lcardsLog.trace('[LCARdSMSDCard] _onConfigUpdated called');

        // Extract MSD config from processed config
        // Config is ALREADY processed by parent's _processConfigAsync() with provenance
        // After CoreConfigManager processing, config structure is: { type, msd: {...}, __provenance }
        if (this.config?.msd) {
            this._msdConfig = this.config.msd;  // ✅ Now has processed config with tokens resolved
            this._fullConfig = this.config;     // ✅ Now has __provenance attached

            lcardsLog.debug('[LCARdSMSDCard] Extracted MSD config:', {
                hasBaseSvg: !!this._msdConfig.base_svg,
                hasViewBox: !!this._msdConfig.view_box,
                hasOverlays: !!this._msdConfig.overlays,
                overlayCount: this._msdConfig.overlays?.length || 0,
                hasProvenance: !!this._fullConfig.__provenance  // ✅ Should now be true
            });

            // DON'T load SVG here - singletons may not be initialized yet
            // SVG loading will happen in _onFirstUpdated() when AssetManager is guaranteed available
        }
    }

    /**
     * Called on first update after DOM is ready.
     * Delegates to _loadAndInitializeMsd() — shared with reconnect path.
     * @param {Map} changedProperties - Changed properties
     * @protected
     */
    async _onFirstUpdated(changedProperties) {
        lcardsLog.trace('[LCARdSMSDCard] _onFirstUpdated called');
        await super._onFirstUpdated(changedProperties);
        await this._loadAndInitializeMsd();
    }

    /**
     * Core MSD initialization logic: waits for config, loads SVG, generates GUID,
     * and initializes the pipeline.
     *
     * Extracted so it can be called from both _onFirstUpdated (first mount) and
     * _onConnected (reconnect after edit-mode toggle or view navigation), since
     * Lit's firstUpdated only fires once per element lifetime.
     * @private
     */
    async _loadAndInitializeMsd() {
        lcardsLog.trace('[LCARdSMSDCard] _loadAndInitializeMsd called');

        // Wait for async config processing to complete.
        // LCARdSCard.setConfig() starts _processConfigAsync() in background.
        // We must wait for it before accessing this.config or derived properties.
        if (this._configProcessingPromise) {
            lcardsLog.trace('[LCARdSMSDCard] Waiting for config processing...');
            try {
                await this._configProcessingPromise;
                lcardsLog.trace('[LCARdSMSDCard] Config processing complete');
            } catch (error) {
                lcardsLog.error('[LCARdSMSDCard] Config processing failed:', error);
                this._configIssues = { errors: [`Config processing failed: ${error.message}`] };
                this.requestUpdate();
                return;
            }
        }

        // Check for validation errors
        if (this._configIssues?.errors?.length > 0) {
            lcardsLog.error('[LCARdSMSDCard] Validation errors present, skipping initialization');
            return;
        }

        // Load SVG if not already loaded.
        // _svgContent is intentionally preserved across reconnects so we don't re-fetch.
        if (this._msdConfig?.base_svg && !this._svgContent) {
            const svgSource = this._msdConfig.base_svg.source;

            if (svgSource === 'none') {
                lcardsLog.trace('[LCARdSMSDCard] Skipping SVG load - source is "none" (viewBox-only mode)');
            } else {
                lcardsLog.trace('[LCARdSMSDCard] Loading base SVG:', svgSource);
                await this._loadBaseSvg(this._msdConfig.base_svg);

                if (!this._svgContent) {
                    lcardsLog.error('[LCARdSMSDCard] Failed to load SVG');
                    this._configIssues = { errors: ['Failed to load base SVG'] };
                    this.requestUpdate();
                    return;
                }

                lcardsLog.trace('[LCARdSMSDCard] SVG loaded:', this._svgContent.length, 'bytes');
            }
        }

        // Generate instance GUID (preserved across reconnects — do not regenerate).
        if (!this._msdInstanceGuid) {
            if (this.config.id) {
                this._msdInstanceGuid = `msd-${this.config.id}`;
                lcardsLog.trace('[LCARdSMSDCard] Using config.id as GUID:', this._msdInstanceGuid);
            } else {
                this._msdInstanceGuid = `msd-${this._cardGuid}`;
                lcardsLog.trace('[LCARdSMSDCard] Generated GUID:', this._msdInstanceGuid);
            }
        }

        // Wait for Lit's render cycle so the SVG container is actually mounted to DOM
        // before MsdControlsRenderer tries to find it with getSvgControlsContainer().
        lcardsLog.trace('[LCARdSMSDCard] Waiting for Lit render to complete...');
        await this.updateComplete;
        lcardsLog.trace('[LCARdSMSDCard] Lit render complete');

        // Initialize MSD pipeline (config and SVG are now guaranteed ready).
        lcardsLog.trace('[LCARdSMSDCard] Initializing pipeline:', {
            hasConfig: !!this._msdConfig,
            hasSvg: !!this._svgContent,
            hasHass: !!this.hass,
            svgLength: this._svgContent?.length,
            guid: this._msdInstanceGuid
        });

        await this._initializeMsdPipeline();
    }

    /**
     * Register MSD overlays with core rulesManager
     * Called after pipeline initialization when overlays are available
     * @private
     */
    _registerOverlaysWithRulesEngine() {
        lcardsLog.trace('[LCARdSMSDCard] Registering MSD overlays with rules engine');

        // CRITICAL: Temporarily save and clear HASS to prevent auto-evaluation during registration
        // Each call to _registerOverlayForRules() triggers rule evaluation if HASS exists
        // We want to register ALL overlays first, THEN trigger evaluation once at the end
        const savedHass = this.hass;
        this.hass = null;

        // Register MSD card itself with core rulesManager (uses _registerOverlayForRules for callback)
        this._registerOverlayForRules(this._cardGuid, ['msd-card']);

        // Register each overlay as a first-class citizen for rule targeting
        // NOTE: _registerOverlayForRules() can only be called ONCE per card (sets this._overlayRegistered = true)
        // For additional overlays, we must register directly with SystemsManager
        if (this._msdConfig?.overlays) {
            lcardsLog.trace(`[LCARdSMSDCard] Found ${this._msdConfig.overlays.length} overlays to register`);

            this._msdConfig.overlays.forEach(overlay => {
                if (overlay.id) {
                    // Check if this is a control overlay with an LCARdS card
                    const isLCARdSControl = overlay.type === 'control' &&
                                          overlay.card?.type?.startsWith('custom:lcards-');

                    if (!isLCARdSControl) {
                        // Register non-card overlays (lines, labels, etc.) or non-LCARdS controls
                        // LCARdS cards will register themselves when created
                        // Register directly with SystemsManager (can't use _registerOverlayForRules - already used!)
                        this._singletons.systemsManager.registerOverlay(overlay.id, {
                            id: overlay.id,
                            tags: ['msd-overlay', overlay.type],
                            sourceCardId: this._cardGuid
                        });
                        lcardsLog.trace(`[LCARdSMSDCard] ✅ Registered overlay: ${overlay.id} (${overlay.type})`);
                    } else {
                        lcardsLog.trace(`[LCARdSMSDCard] Skipping registration for LCARdS control: ${overlay.id} (will self-register)`);
                    }
                }
            });
        } else {
            lcardsLog.warn('[LCARdSMSDCard] No overlays found in _msdConfig');
        }

        // Restore HASS
        this.hass = savedHass;

        lcardsLog.trace('[LCARdSMSDCard] ✅ MSD card and overlays registered with core rulesManager');

        // NOW trigger rule evaluation with all overlays registered
        if (this.hass && this._singletons?.rulesEngine) {
            lcardsLog.trace('[LCARdSMSDCard] Triggering initial rule evaluation with all overlays registered');
            this._singletons.rulesEngine.markAllDirty();

            // Trigger the callback for this card (which evaluates rules for all registered overlays)
            if (this._rulesCallbackIndex >= 0) {
                const callbacks = this._singletons.rulesEngine._reEvaluationCallbacks || [];
                if (callbacks[this._rulesCallbackIndex]) {
                    callbacks[this._rulesCallbackIndex]();
                }
            }
        }
    }

    /**
     * Override base _applyRulePatches to handle MSD overlay patches
     * Base class filters for this._overlayId, but we need patches for ALL MSD overlays
     * @param {Array} overlayPatches - Array of patches from RulesEngine
     * @protected
     */
    _applyRulePatches(overlayPatches) {
        lcardsLog.debug('[LCARdSMSDCard] _applyRulePatches called', {
            patchesProvided: Array.isArray(overlayPatches) ? overlayPatches.length : 0,
            patchIds: overlayPatches?.map(p => p.id) || []
        });

        if (!overlayPatches || overlayPatches.length === 0) {
            // No patches - clear if we had any
            if (this._lastRulePatches) {
                this._lastRulePatches = null;
                this._onRulePatchesChanged();
            }
            return;
        }

        // Convert array of patches to map: { overlayId: patch }
        const patchMap = {};
        for (const patch of overlayPatches) {
            if (patch.id) {
                patchMap[patch.id] = patch;
            }
        }

        // Check if patches changed
        const patchesChanged = JSON.stringify(this._lastRulePatches) !== JSON.stringify(patchMap);
        if (!patchesChanged) {
            lcardsLog.trace('[LCARdSMSDCard] Rule patches unchanged');
            return;
        }

        // Store patches
        this._lastRulePatches = patchMap;

        lcardsLog.debug('[LCARdSMSDCard] Stored rule patches:', {
            overlayCount: Object.keys(patchMap).length,
            overlayIds: Object.keys(patchMap)
        });

        // Apply patches to overlay configs
        this._onRulePatchesChanged();
    }

    /**
     * Handle rule patches changed callback
     * Called by core rulesManager when rules affecting this MSD are re-evaluated
     * @protected
     */
    _onRulePatchesChanged() {
        lcardsLog.debug('[LCARdSMSDCard] _onRulePatchesChanged - rules updated for MSD card');

        // Apply rule patches to overlay configs before re-rendering
        // this._lastRulePatches is inherited from LCARdSCard base class
        // Structure: { overlayId: { style: {...}, ... }, ... }
        // ✨ Templates are now evaluated by RulesEngine before patches reach the card
        if (this._lastRulePatches && this._msdConfig?.overlays) {
            const patchKeys = Object.keys(this._lastRulePatches);
            lcardsLog.debug('[LCARdSMSDCard] Applying rule patches to overlays:', {
                patchCount: patchKeys.length,
                overlayCount: this._msdConfig.overlays.length,
                patchedOverlays: patchKeys
            });

            // Check if patches are style-only (can be applied via DOM without full re-render)
            const isStyleOnlyPatch = this._isStyleOnlyPatch(this._lastRulePatches);

            if (isStyleOnlyPatch) {
                lcardsLog.debug('[LCARdSMSDCard] ✨ Style-only patch detected - applying directly to DOM (no animation reset)');
                this._applyStylePatchesToDOM(this._lastRulePatches);
                return; // Skip full re-render
            }

            // For non-style patches, proceed with full update
            lcardsLog.debug('[LCARdSMSDCard] Non-style patch detected - full re-render required');

            // CRITICAL: Overlay objects are frozen - we must create NEW overlay objects, not mutate
            this._msdConfig.overlays = this._msdConfig.overlays.map(overlay => {
                const overlayId = overlay.id;
                if (overlayId && this._lastRulePatches[overlayId]) {
                    const patch = this._lastRulePatches[overlayId];

                    // Create new overlay object with patches applied
                    const patchedOverlay = { ...overlay };

                    // Merge style properties
                    if (patch.style) {
                        patchedOverlay.style = { ...overlay.style, ...patch.style };
                        lcardsLog.debug(`[LCARdSMSDCard] Applied style patch to overlay ${overlayId}:`, patch.style);
                    }

                    // Apply any other top-level properties from patch
                    for (const key of Object.keys(patch)) {
                        if (key !== 'style' && key !== 'id' && key !== 'ruleId' && key !== 'ruleCondition') {
                            patchedOverlay[key] = patch[key];
                            lcardsLog.debug(`[LCARdSMSDCard] Applied ${key} patch to overlay ${overlayId}`);
                        }
                    }

                    return patchedOverlay;
                }
                return overlay;
            });

            // CRITICAL: Update the merged config in the pipeline so ModelBuilder picks up changes
            // ModelBuilder reads from coordinator.mergedConfig.overlays, not from this._msdConfig
            if (this._msdPipeline?.coordinator?.mergedConfig) {
                this._msdPipeline.coordinator.mergedConfig.overlays = this._msdConfig.overlays;
                lcardsLog.debug('[LCARdSMSDCard] Updated coordinator mergedConfig.overlays with patched overlays');
            }

            // CRITICAL: Also update cardModel.overlaysBase which is what ModelBuilder._assembleBaseOverlays() uses
            // Access through coordinator.modelBuilder.cardModel
            if (this._msdPipeline?.coordinator?.modelBuilder?.cardModel?.overlaysBase) {
                // IMPORTANT: overlaysBase entries are frozen - create NEW array with NEW objects
                // Must preserve CardModel-processed properties (position, anchor, etc.) while updating styles
                const existingOverlaysBase = this._msdPipeline.coordinator.modelBuilder.cardModel.overlaysBase;

                this._msdPipeline.coordinator.modelBuilder.cardModel.overlaysBase = existingOverlaysBase.map(baseOverlay => {
                    // Find matching patched overlay by ID
                    const patchedOverlay = this._msdConfig.overlays.find(o => o.id === baseOverlay.id);
                    if (patchedOverlay && patchedOverlay.style) {
                        // Create NEW overlay object with merged styles (immutable-safe)
                        const updatedOverlay = {
                            ...baseOverlay,  // Preserve all CardModel properties (position, anchor, etc.)
                            style: { ...baseOverlay.style, ...patchedOverlay.style },  // Merge style changes
                            raw: {
                                ...(baseOverlay.raw || {}),
                                style: { ...(baseOverlay.raw?.style || {}), ...patchedOverlay.style }
                            }
                        };

                        lcardsLog.debug(`[LCARdSMSDCard] Created new overlaysBase entry for ${baseOverlay.id} with merged styles:`, patchedOverlay.style);
                        return updatedOverlay;
                    }
                    return baseOverlay;  // No changes for this overlay
                });

                lcardsLog.debug('[LCARdSMSDCard] Updated cardModel.overlaysBase with patched styles (preserved positions)');
            } else {
                lcardsLog.warn('[LCARdSMSDCard] Could not access cardModel.overlaysBase for update', {
                    hasCoordinator: !!this._msdPipeline?.coordinator,
                    hasModelBuilder: !!this._msdPipeline?.coordinator?.modelBuilder,
                    hasCardModel: !!this._msdPipeline?.coordinator?.modelBuilder?.cardModel,
                    hasOverlaysBase: !!this._msdPipeline?.coordinator?.modelBuilder?.cardModel?.overlaysBase
                });
            }
        }

        // Check if any patches affect base SVG or overlays that require re-render
        if (this._msdPipeline?.coordinator?._reRenderCallback) {
            // Request MSD pipeline to re-render with updated config
            lcardsLog.debug('[LCARdSMSDCard] Triggering MSD re-render after rule patches applied');
            this._msdPipeline.coordinator._reRenderCallback();
        } else {
            lcardsLog.warn('[LCARdSMSDCard] No re-render callback available on coordinator');
        }

        // Request Lit update to re-render card
        this.requestUpdate();
    }

    /**
     * Handle HASS updates - forward to MSD coordinator
     * @param {Object} newHass - New HASS object
     * @param {Object} oldHass - Old HASS object
     * @protected
     *
     * NOTE: We don't call super._handleHassUpdate() because MSD has its own
     * coordinator that handles HASS distribution to subsystems (renderer, controls).
     * The core rulesManager receives HASS automatically via BaseService.updateHass().
     */
    _handleHassUpdate(newHass, oldHass) {
        lcardsLog.trace('[LCARdSMSDCard] _handleHassUpdate called');

        // Forward HASS to MSD coordinator
        // Note: coordinator is the MsdCardCoordinator instance from pipeline
        if (this._msdPipeline?.coordinator) {
            this._msdPipeline.coordinator.ingestHass(newHass);
        }

        // Don't call super - MSD manages its own updates via MsdCardCoordinator
    }

    /**
     * Render the MSD card
     * @returns {import('lit').TemplateResult} Card HTML
     * @protected
     */
    _renderCard() {
        const configKeys = Object.keys(this.config || {});
        const isStubConfig = configKeys.length === 1 && configKeys[0] === 'type';

        lcardsLog.debug('[LCARdSMSDCard] _renderCard called - TIER DECISION:', {
            isPreviewMode: this._isPreviewMode,
            isPreviewModeType: typeof this._isPreviewMode,
            configKeys: configKeys,
            isStubConfig: isStubConfig,
            hasConfigIssues: !!this._configIssues?.errors?.length,
            msdInitialized: this._msdInitialized,
            hasPipeline: !!this._msdPipeline
        });

        // Tiered render strategy based on context

        // Tier 3: Card picker placeholder (stub config or picker context)
        if (this._isPreviewMode === 'picker' || isStubConfig) {
            lcardsLog.debug('[LCARdSMSDCard] ✅ Rendering TIER 3: Card picker placeholder');
            return this._renderCardPickerPlaceholder();
        }

        // Tier 2: Editor stats display (editor dialog context)
        if (this._isPreviewMode === 'editor') {
            lcardsLog.debug('[LCARdSMSDCard] ✅ Rendering TIER 2: Editor stats display');
            return this._renderEditorStats();
        }

        // Tier 1: Full render (studio dialog, dashboard, or _isPreviewMode === false)
        // Note: Legacy boolean true also falls through to maintain compatibility
        if (this._isPreviewMode === true) {
            // Legacy preview mode (shouldn't happen with new detection, but handle gracefully)
            return this._renderEditorStats();
        }

        // Check for validation errors
        if (this._configIssues?.errors?.length > 0) {
            return this._renderValidationErrors();
        }

        // Show loading state while pipeline initializes
        // NOTE: We only check _msdInitialized, not _msdPipeline, because during initialization
        // we set _msdInitialized=true first to trigger SVG rendering, then initialize the pipeline
        if (!this._msdInitialized) {
            return html`
                <div class="lcards-msd-loading">
                    <ha-circular-progress active></ha-circular-progress>
                    <p>Initializing MSD...</p>
                </div>
            `;
        }

        // Render SVG container for MSD mounting
        return this._renderSvgContainer();
    }

    /**
     * Re-initialize pipeline after reconnect (edit mode toggle, view navigation, etc.).
     * Lit's firstUpdated only fires once per element lifetime, so reconnects must
     * trigger pipeline initialization here instead.
     * @protected
     */
    async _onConnected() {
        await super._onConnected();

        // _initialized is set by LCARdSCard._onFirstUpdated — if it's true here, this is
        // a reconnect (not the first mount), and the pipeline was torn down by disconnectedCallback.
        if (this._initialized && !this._msdInitialized) {
            lcardsLog.debug('[LCARdSMSDCard] Re-initializing MSD pipeline after reconnect');
            await this._loadAndInitializeMsd();
        }
    }

    /**
     * Cleanup when card is removed from DOM
     */
    disconnectedCallback() {
        this._cleanupMsdPipeline();
        super.disconnectedCallback();
    }

    // ============================================================================
    // Configuration and Lifecycle (Legacy Support)
    // ============================================================================

    /**
     * Override HASS setter to prevent automatic re-renders
     * MSD system manages its own HASS updates internally
     *
     * NOTE: With automatic HASS propagation, embedded control cards
     * receive HASS updates via Home Assistant's component tree:
     * - LCARdS cards: Via their own hass setters + singleton integration
     * - Standard HA cards (hui-*): Via HA's automatic parent-child propagation
     * - Third-party cards: Via their base class implementations
     *
     * Manual HASS forwarding is only needed if the feature flag is enabled in
     * MsdControlsRenderer._manualHassForwarding = true
     */
    set hass(hass) {
        lcardsLog.trace('[LCARdSMSDCard] HASS setter called:', {
            timestamp: new Date().toISOString(),
            hasHass: !!hass,
            cardGuid: this._cardGuid,
            callerStack: new Error().stack.split('').slice(1, 4).map(line => line.trim()).join(' → ')
        });

        const oldHass = this._hass;
        this._hass = hass;

        // Forward HASS to MSD pipeline (which may forward to controls based on feature flag)
        if (hass && oldHass !== hass) {
            lcardsLog.debug(`[LCARdSMSDCard] HASS updated for ${this._cardGuid}, forwarding to MSD pipeline`);

            // Call the unified handler directly
            this._handleHassUpdate(hass, oldHass);

            // DON'T call this.requestUpdate() - MSD handles its own updates
        }
    }

    get hass() {
        return this._hass;
    }

    // ============================================================================
    // MSD Pipeline Integration
    // ============================================================================

    /**
     * Load base SVG content from config
     * Delegates to AssetManager for all loading logic
     * @param {Object} baseSvgConfig - base_svg configuration
     * @private
     */
    async _loadBaseSvg(baseSvgConfig) {
        lcardsLog.debug('[LCARdSMSDCard] _loadBaseSvg called:', {
            hasConfig: !!baseSvgConfig,
            configType: typeof baseSvgConfig,
            source: baseSvgConfig?.source,
            isObject: baseSvgConfig && typeof baseSvgConfig === 'object'
        });

        // Get AssetManager from singletons or global core
        const assetManager = this._singletons?. assetManager || window.lcards?. core?.assetManager;
        if (!assetManager) {
            lcardsLog.warn('[LCARdSMSDCard] AssetManager not available (neither from singletons nor global core)');
            return;
        }

        const svgSource = baseSvgConfig?.source;
        lcardsLog.debug('[LCARdSMSDCard] Loading SVG from source:', svgSource);

        // ✅ FIX: Parse source to extract asset key
        // Source format: "builtin:ncc-1701-a-blue" → asset key: "ncc-1701-a-blue"
        let assetKey = svgSource;
        if (svgSource?. startsWith('builtin:')) {
            assetKey = svgSource.replace('builtin:', '');
        }

        lcardsLog.debug('[LCARdSMSDCard] Resolved asset key:', assetKey);

        // ✅ FIX: Use get() method, not loadSvg()
        this._svgContent = await assetManager.get('svg', assetKey);

        if (this._svgContent) {
            lcardsLog.debug('[LCARdSMSDCard] SVG loaded successfully:', {
                source: svgSource,
                assetKey: assetKey,
                contentLength: this._svgContent?. length || 0
            });
        } else {
            lcardsLog.warn('[LCARdSMSDCard] SVG load returned null/undefined for:', {
                source: svgSource,
                assetKey: assetKey
            });
        }
    }
    /**
     * Initialize MSD pipeline using initMsdPipeline from pipeline core
     * @private
     */
    async _initializeMsdPipeline() {
        if (this._msdInitialized || !this._msdConfig || !this.hass) {
            lcardsLog.debug('[LCARdSMSDCard] Skipping pipeline init:', {
                initialized: this._msdInitialized,
                hasConfig: !!this._msdConfig,
                hasHass: !!this.hass
            });
            return;
        }

        try {
            lcardsLog.debug('[LCARdSMSDCard] 🚀 Initializing MSD pipeline');

            // ✅ CRITICAL FIX: Mark as initialized BEFORE pipeline init
            // This allows _renderCard() to render the SVG container
            this._msdInitialized = true;

            // ✅ CRITICAL FIX: Request update to trigger re-render with SVG container
            // This ensures _renderCard() switches from loading spinner to _renderSvgContainer()
            this.requestUpdate();

            // ✅ CRITICAL FIX: Wait for the new render cycle to complete
            // This ensures the SVG container is actually mounted in the DOM
            // before the renderer tries to access it
            await this.updateComplete;

            lcardsLog.debug('[LCARdSMSDCard] SVG container rendered and mounted to DOM');

            // Get mount element
            const mount = /** @type {HTMLElement | ShadowRoot} */ (this.renderRoot);
            if (!mount) {
                lcardsLog.error('[LCARdSMSDCard] Mount element not found');
                this._msdInitialized = false;  // Reset on failure
                return;
            }

            // Verify SVG is actually in the DOM before proceeding
            const svg = mount.querySelector('svg');
            if (!svg) {
                lcardsLog.error('[LCARdSMSDCard] SVG element not found in render root after update');
                this._msdInitialized = false;  // Reset on failure
                return;
            }

            lcardsLog.debug('[LCARdSMSDCard] Confirmed SVG element exists in DOM');

            // Pass the full config (with nested structure) to pipeline
            // The pipeline expects: { type, msd: {...}, rules?, data_sources? }
            lcardsLog.debug('[LCARdSMSDCard] Calling initMsdPipeline with config:', {
                hasRules: !!this._fullConfig?.rules,
                hasDataSources: !!this._fullConfig?.data_sources,
                hasOverlays: !!this._msdConfig?.overlays,
                hasSvgContent: !!this._svgContent
            });

            // Initialize MSD pipeline with full config structure
            const pipelineResult = await initMsdPipeline(
                this._fullConfig,  // Pass full config with nested msd property
                this._svgContent,
                mount,
                this.hass,
                this._msdInstanceGuid
            );

            if (!pipelineResult || !pipelineResult.enabled) {
                lcardsLog.error('[LCARdSMSDCard] Pipeline initialization failed or disabled');
                this._configIssues = pipelineResult?.issues || { errors: ['Pipeline initialization failed'] };
                this._msdInitialized = false;  // Reset on failure
                this.requestUpdate();
                return;
            }

            // Store pipeline reference
            this._msdPipeline = pipelineResult;

            // Provenance already tracked in _processConfig() - no need to track again

            // Set card instance for actions
            if (this._msdPipeline.setCardInstance) {
                this._msdPipeline.setCardInstance(this);
            }

            // Register overlays with core rulesManager NOW that config is fully processed
            this._registerOverlaysWithRulesEngine();

            lcardsLog.debug('[LCARdSMSDCard] ✅ MSD pipeline initialized successfully with SVG container mounted');

        } catch (error) {
            lcardsLog.error('[LCARdSMSDCard] Pipeline initialization error:', error);
            this._configIssues = {
                errors: [{ message: `Pipeline initialization failed: ${error.message}` }]
            };
            this._msdInitialized = false;  // Reset on failure
            this.requestUpdate();
        }
    }

    /**
     * Cleanup MSD pipeline
     * @private
     */
    _cleanupMsdPipeline() {
        if (this._msdPipeline?.coordinator?.destroy) {
            this._msdPipeline.coordinator.destroy();
        }
        this._msdPipeline = null;
        this._msdInitialized = false;
        lcardsLog.debug('[LCARdSMSDCard] Pipeline cleaned up');
    }

    // ============================================================================
    // Rendering Helpers
    // ============================================================================

    /**
     * Render validation errors
     * @private
     */
    _renderValidationErrors() {
        if (!this._configIssues) {
            return html`<div class="lcards-msd-loading">No validation errors</div>`;
        }

        const errors = this._configIssues.errors || [];
        const warnings = this._configIssues.warnings || [];

        return html`
            <div style="
                padding: 20px;
                background: var(--error-background-color, rgba(244, 67, 54, 0.1));
                border: 2px solid var(--error-color, #f44336);
                border-radius: 8px;
            ">
                <h3 style="margin-top: 0; color: var(--error-color, #f44336);">
                    MSD Configuration Errors
                </h3>
                ${errors.length > 0 ? html`
                    <div style="margin-bottom: 16px;">
                        <h4 style="margin: 8px 0; color: var(--error-color, #f44336);">Errors:</h4>
                        <ul style="margin: 4px 0; padding-left: 20px;">
                            ${errors.map(err => html`
                                <li style="color: var(--primary-text-color); margin: 4px 0;">
                                    ${err.message || err}
                                </li>
                            `)}
                        </ul>
                    </div>
                ` : ''}
                ${warnings.length > 0 ? html`
                    <div>
                        <h4 style="margin: 8px 0; color: var(--warning-color, #ff9800);">Warnings:</h4>
                        <ul style="margin: 4px 0; padding-left: 20px;">
                            ${warnings.map(warn => html`
                                <li style="color: var(--primary-text-color); margin: 4px 0;">
                                    ${warn.message || warn}
                                </li>
                            `)}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // ============================================================================
    // Legacy Support Methods (for compatibility)
    // ============================================================================

    /**
     * Check for ancestor element, traversing shadow DOM boundaries
     * Required for detecting studio dialogs which may be in shadow DOM
     * @private
     */
    _checkForAncestor(selectors) {
        let current = /** @type {Element | null} */ (this);
        const maxLevels = 20;

        for (let i = 0; i < maxLevels && current; i++) {
            for (const selector of selectors) {
                if (current.tagName?.toLowerCase() === selector.toLowerCase()) {
                    return true;
                }
            }
            // Traverse shadow DOM boundaries: try parentElement, then host
            current = current.parentElement || /** @type {ShadowRoot} */ (current.parentNode)?.host || /** @type {ShadowRoot} */ (current.getRootNode())?.host;
        }

        return false;
    }

    /**
     * Detect if running in preview mode with tiered strategy
     * Returns: false (full render), 'picker' (Tier 3), 'editor' (Tier 2)
     * @returns {false|'picker'|'editor'}
     * @protected
     */
    _detectPreviewMode() {
        if (!this.parentElement) {
            lcardsLog.debug('[LCARdSMSDCard] No parent element - deferring preview mode detection');
            return false;
        }

        // Tier 3: Card picker (always block with placeholder)
        const isInCardPicker = this._checkForAncestor(['hui-card-picker']);
        if (isInCardPicker) {
            lcardsLog.debug('[LCARdSMSDCard] Card picker detected - Tier 3: placeholder mode');
            return 'picker';
        }

        // Tier 1: Studio editor (always allow full render for live preview)
        const isInStudioDialog = this._checkForAncestor(['lcards-msd-studio-dialog']);
        if (isInStudioDialog) {
            lcardsLog.debug('[LCARdSMSDCard] Studio dialog detected - Tier 1: live preview mode');
            return false; // NOT preview - allow full render
        }

        // Tier 2: Card editor dialog (block with stats display)
        const isInEditDialog = this._checkForAncestor(['hui-dialog-edit-card', 'hui-card-preview']);
        if (isInEditDialog) {
            lcardsLog.debug('[LCARdSMSDCard] Card editor dialog detected - Tier 2: stats display mode');
            return 'editor';
        }

        // Dashboard (edit mode or view mode) - always allow full render
        // Note: Do NOT call super._detectPreviewMode() as base class blocks dashboard edit mode
        const dashboardEl = this.parentElement.closest('hui-root, ha-panel-lovelace');
        if (dashboardEl) {
            lcardsLog.debug('[LCARdSMSDCard] On dashboard - Tier 1: full render', {
                editMode: /** @type {any} */ (dashboardEl).editMode
            });
            return false;
        }

        // Fallback: not in any recognized context, allow full render
        lcardsLog.debug('[LCARdSMSDCard] No recognized context - defaulting to Tier 1: full render');
        return false;
    }

    /**
     * Override requestUpdate to block HASS-triggered updates
     * MSD manages its own updates internally
     * @public
     */
    requestUpdate(name, oldValue, options) {
        // Block HASS-related updates to prevent re-renders
        if (name === 'hass' || name === '_hass') {
            lcardsLog.trace('[LCARdSMSDCard] Blocked requestUpdate for HASS change');
            return Promise.resolve();
        }

        return super.requestUpdate(name, oldValue, options);
    }

    // ============================================================================
    // Card Interface
    // ============================================================================

    /**
     * Get card size for layout
     * @protected
     */
    _getCardSize() {
        const px = this._configPx(this.config?.height);
        if (px !== null) return Math.ceil(px / 50);
        return 4; // MSD cards are typically larger
    }

    /**
     * Get layout options
     * @protected
     */
    _getGridOptions() {
        return {
            grid_rows: 8,
            grid_columns: 4
        };
    }

    /**
     * Validate MSD configuration
     * @protected
     */
    _validateConfig(config) {
        super._validateConfig(config);

        // Debug preview mode detection
        lcardsLog.debug('[LCARdSMSDCard] _validateConfig called:', {
            isPreviewMode: this._isPreviewMode,
            cardGuid: this._cardGuid,
            hasConfig: !!config,
            configKeys: config ? Object.keys(config) : [],
            configType: config?.type,
            parentElement: this.parentElement?.tagName,
            parentClasses: this.parentElement?.className,
            isConnected: this.isConnected,
        });

        // Skip MSD validation in preview mode (card picker, editor)
        if (this._isPreviewMode) {
            lcardsLog.debug('[LCARdSMSDCard] Skipping MSD validation in preview mode');
            return;
        }

        // Additional heuristic: Card picker typically only passes { type: "custom:lcards-msd-card" }
        // If config only has 'type' field and no 'msd' field, likely from card picker
        const configKeys = Object.keys(config || {});
        if (configKeys.length === 1 && configKeys[0] === 'type' && config.type === 'custom:lcards-msd-card') {
            lcardsLog.debug('[LCARdSMSDCard] Detected card picker context - config only contains type field');
            return;
        }

        // Perform the actual MSD validation
        this._performMsdValidation(config);
    }

    /**
     * Perform the actual MSD configuration validation
     * @private
     */
    _performMsdValidation(config) {
        if (!config.msd) {
            throw new Error('MSD configuration is required');
        }

        // Version field is no longer required
        // If present, it will generate a warning via ValidationService
    }

    // ============================================================================
    // Rendering
    // ============================================================================

    /**
     * Render placeholder for card picker (Tier 3)
     * Shows LCARS-styled SVG graphic for visual recognition
     * @private
     */
    _renderCardPickerPlaceholder() {
        lcardsLog.debug('[LCARdSMSDCard] Rendering Tier 3: card picker placeholder');
        return html`
            <div style="
                width: 100%;
                height: 120px;
                background: linear-gradient(180deg, #000611 0%, #001a33 100%);
                border: 2px solid #9999ff;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                overflow: visible;
                box-shadow: inset 0 0 30px rgba(153, 153, 255, 0.1);
            ">
                <!-- Central MSD label -->
                <div style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-family: Antonio, monospace;
                    font-size: 16px;
                    color: #9999ff;
                    font-weight: bold;
                    letter-spacing: 2px;
                    z-index: 10;
                    padding: 4px 12px;
                    background: rgba(0, 6, 17, 0.9);
                    border: 1px solid #9999ff;
                    border-radius: 4px;
                ">MSD</div>

                <!-- Manhattan routing lines (SVG) -->
                <svg width="100%" height="100%" style="position: absolute; top: 0; left: 0;">
                    <!-- Top-left to center (blue) -->
                    <path d="M 10,20 L 40,20 Q 50,20 50,30 L 50,50 Q 50,55 55,55 L 80,55"
                        stroke="#9999ff" stroke-width="2" fill="none" opacity="0.8"
                        stroke-linecap="round"/>

                    <!-- Top-right to center (cyan) -->
                    <path d="M 250,25 L 220,25 Q 210,25 210,35 L 210,50 Q 210,55 205,55 L 180,55"
                        stroke="#66ccff" stroke-width="2" fill="none" opacity="0.8"
                        stroke-linecap="round"/>

                    <!-- Bottom-left to center (orange) -->
                    <path d="M 10,100 L 45,100 Q 55,100 55,90 L 55,70 Q 55,65 60,65 L 85,65"
                        stroke="#ff9933" stroke-width="2" fill="none" opacity="0.8"
                        stroke-linecap="round"/>

                    <!-- Bottom-right to center (green) -->
                    <path d="M 250,95 L 215,95 Q 205,95 205,85 L 205,70 Q 205,65 200,65 L 175,65"
                        stroke="#66ff66" stroke-width="2" fill="none" opacity="0.8"
                        stroke-linecap="round"/>

                    <!-- Center-left to center-right (red) -->
                    <path d="M 10,60 L 75,60"
                        stroke="#ff6666" stroke-width="2" fill="none" opacity="0.6"
                        stroke-linecap="round"/>
                    <path d="M 185,60 L 250,60"
                        stroke="#ff6666" stroke-width="2" fill="none" opacity="0.6"
                        stroke-linecap="round"/>

                    <!-- Connection nodes (dots) -->
                    <circle cx="40" cy="20" r="3" fill="#9999ff" opacity="0.8"/>
                    <circle cx="220" cy="25" r="3" fill="#66ccff" opacity="0.8"/>
                    <circle cx="45" cy="100" r="3" fill="#ff9933" opacity="0.8"/>
                    <circle cx="215" cy="95" r="3" fill="#66ff66" opacity="0.8"/>
                    <circle cx="75" cy="60" r="3" fill="#ff6666" opacity="0.8"/>
                    <circle cx="185" cy="60" r="3" fill="#ff6666" opacity="0.8"/>
                </svg>
            </div>
        `;
    }

    /**
     * Render stats display for editor dialog (Tier 2)
     * Shows configuration summary for YAML editing context
     * @private
     */
    _renderEditorStats() {
        lcardsLog.debug('[LCARdSMSDCard] Rendering Tier 2: editor stats display');
        const hasConfig = this._msdConfig && Object.keys(this._msdConfig).length > 0;
        const baseSvgSource = this._msdConfig?.base_svg?.source || 'Not configured';
        const overlayCount = this._msdConfig?.overlays ? Object.keys(this._msdConfig.overlays).length : 0;
        const dataSourceCount = this._fullConfig?.data_sources ? Object.keys(this._fullConfig.data_sources).length : 0;
        const rulesCount = this._fullConfig?.rules ? this._fullConfig.rules.length : 0;
        const viewBox = this._msdConfig?.view_box || [0, 0, 1920, 1200];

        return html`
            <div style="
                width: 100%;
                height: 280px;
                background: linear-gradient(180deg, #000611 0%, #001a33 100%);
                border: 2px solid #9999ff;
                border-radius: 12px;
                display: flex;
                flex-direction: column;
                font-family: 'Antonio', monospace;
                position: relative;
                overflow: hidden;
                box-shadow: inset 0 0 30px rgba(153, 153, 255, 0.1);
            ">
                ${hasConfig ? html`
                    <!-- Configuration with blueprint design -->
                    <div style="flex: 1; padding: 20px; display: flex; flex-direction: column; gap: 12px; position: relative;">
                        <!-- Central MSD label -->
                        <div style="
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            font-size: 28px;
                            color: #9999ff;
                            font-weight: bold;
                            letter-spacing: 3px;
                            z-index: 10;
                            padding: 8px 20px;
                            background: rgba(0, 6, 17, 0.95);
                            border: 2px solid #9999ff;
                            border-radius: 6px;
                            box-shadow: 0 0 20px rgba(153, 153, 255, 0.3);
                        ">MASTER SYSTEMS DISPLAY</div>

                        <!-- Manhattan routing lines (SVG) -->
                        <svg width="100%" height="100%" style="position: absolute; top: 0; left: 0;">
                            <!-- Top-left corner routing (blue) -->
                            <path d="M 20,30 L 60,30 Q 70,30 70,40 L 70,100 Q 70,110 80,110 L 140,110"
                                stroke="#9999ff" stroke-width="2" fill="none" opacity="0.7"
                                stroke-linecap="round"/>

                            <!-- Top-right corner routing (cyan) -->
                            <path d="M 480,35 L 440,35 Q 430,35 430,45 L 430,100 Q 430,110 420,110 L 360,110"
                                stroke="#66ccff" stroke-width="2" fill="none" opacity="0.7"
                                stroke-linecap="round"/>

                            <!-- Bottom-left routing (orange) -->
                            <path d="M 20,230 L 65,230 Q 75,230 75,220 L 75,160 Q 75,150 85,150 L 145,150"
                                stroke="#ff9933" stroke-width="2" fill="none" opacity="0.7"
                                stroke-linecap="round"/>

                            <!-- Bottom-right routing (green) -->
                            <path d="M 480,225 L 435,225 Q 425,225 425,215 L 425,160 Q 425,150 415,150 L 355,150"
                                stroke="#66ff66" stroke-width="2" fill="none" opacity="0.7"
                                stroke-linecap="round"/>

                            <!-- Horizontal center lines (red) -->
                            <path d="M 20,130 L 135,130"
                                stroke="#ff6666" stroke-width="2" fill="none" opacity="0.6"
                                stroke-linecap="round"/>
                            <path d="M 365,130 L 480,130"
                                stroke="#ff6666" stroke-width="2" fill="none" opacity="0.6"
                                stroke-linecap="round"/>

                            <!-- Connection nodes -->
                            <circle cx="60" cy="30" r="3" fill="#9999ff" opacity="0.8"/>
                            <circle cx="440" cy="35" r="3" fill="#66ccff" opacity="0.8"/>
                            <circle cx="65" cy="230" r="3" fill="#ff9933" opacity="0.8"/>
                            <circle cx="435" cy="225" r="3" fill="#66ff66" opacity="0.8"/>
                            <circle cx="135" cy="130" r="3" fill="#ff6666" opacity="0.8"/>
                            <circle cx="365" cy="130" r="3" fill="#ff6666" opacity="0.8"/>

                            <!-- Additional detail nodes -->
                            <circle cx="70" cy="100" r="2" fill="#9999ff" opacity="0.6"/>
                            <circle cx="430" cy="100" r="2" fill="#66ccff" opacity="0.6"/>
                            <circle cx="75" cy="160" r="2" fill="#ff9933" opacity="0.6"/>
                            <circle cx="425" cy="160" r="2" fill="#66ff66" opacity="0.6"/>
                        </svg>

                        <!-- Info panels at corners -->
                        <div style="
                            position: absolute;
                            top: 8px;
                            left: 8px;
                            font-size: 9px;
                            color: #9999ff;
                            opacity: 0.7;
                            letter-spacing: 0.5px;
                            padding: 4px 8px;
                            background: rgba(0, 6, 17, 0.8);
                            border: 1px solid #9999ff;
                            border-radius: 3px;
                        ">VIEWBOX: ${viewBox[2]} × ${viewBox[3]}</div>

                        <div style="
                            position: absolute;
                            bottom: 8px;
                            right: 8px;
                            font-size: 9px;
                            color: #66ff66;
                            opacity: 0.7;
                            letter-spacing: 0.5px;
                            padding: 4px 8px;
                            background: rgba(0, 6, 17, 0.8);
                            border: 1px solid #66ff66;
                            border-radius: 3px;
                        ">● CONFIGURED</div>
                    </div>
                ` : html`
                    <!-- No configuration -->
                    <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px;">
                        <div style="font-size: 40px; margin-bottom: 12px; opacity: 0.3;">⬢</div>
                        <div style="font-size: 14px; color: #9999ff; margin-bottom: 6px; font-weight: bold;">NO CONFIGURATION</div>
                        <div style="font-size: 10px; color: #66ccff; opacity: 0.7; text-align: center; max-width: 280px; line-height: 1.5;">
                            Add MSD configuration with base_svg, overlays, data_sources, and rules
                        </div>
                    </div>
                `}
            </div>
        `;
    }

    /**
     * Render SVG container with proper structure for MSD mounting
     * Replicates the YAML template's SVG container setup
     * @private
     */
    _renderSvgContainer() {
        lcardsLog.trace('[LCARdSMSDCard] _renderSvgContainer called');

        // Get viewBox from config (will be extracted by pipeline)
        const viewBox = this._msdConfig?.view_box || [0, 0, 1920, 1200];
        const [vbX, vbY, vbW, vbH] = viewBox;
        const aspect = vbW && vbH ? (vbW / vbH) : 2;
        const source = this._msdConfig?.base_svg?.source;

        lcardsLog.debug('[LCARdSMSDCard] Rendering SVG container:', {
            source,
            viewBox,
            aspect,
            hasSvgContent: !!this._svgContent
        });

        // For "none" source, create empty SVG container
        if (source === 'none') {
            return html`
                <div id="msd-v1-comprehensive-wrapper" style="
                    width: 100%;
                    height: 100%;
                    position: relative;
                    aspect-ratio: ${aspect};
                    pointer-events: none;
                ">
                    <div style="
                        position: absolute;
                        top: 0; left: 0;
                        width: 100%; height: 100%;
                        z-index: 0;
                        pointer-events: auto;
                    ">
                        <svg xmlns="http://www.w3.org/2000/svg"
                             viewBox="${vbX} ${vbY} ${vbW} ${vbH}"
                             width="100%"
                             height="100%"
                             style="display: block;">
                            <!-- Empty base SVG - overlays will be mounted here -->
                        </svg>
                    </div>
                </div>
            `;
        }

        // For builtin/user SVGs, get the SVG content
        const svgContent = this._getSvgContentForRender();

        return html`
            <div id="msd-v1-comprehensive-wrapper" style="
                width: 100%;
                height: 100%;
                position: relative;
                aspect-ratio: ${aspect};
                pointer-events: none;
            ">
                <div style="
                    position: absolute;
                    top: 0; left: 0;
                    width: 100%; height: 100%;
                    z-index: 0;
                    pointer-events: auto;
                ">
                    ${svgContent ? unsafeHTML(svgContent) : html`
                        <div class="lcards-msd-loading">Loading SVG...</div>
                    `}
                </div>
            </div>
        `;
    }

    /**
     * Get SVG content for rendering with proper base content wrapping
     * Uses AssetManager for asset retrieval
     * @private
     */
    _getSvgContentForRender() {
        const source = this._msdConfig?.base_svg?.source;
        if (!source || source === 'none') {
            return '';
        }

        // Direct core access pattern (see _handleSvgLoading for design rationale)
        const assetManager = window.lcards?.core?.getAssetManager?.();
        if (!assetManager) {
            lcardsLog.error('[LCARdSMSDCard] AssetManager not available');
            return '';
        }

        let svgKey = null;

        if (source.startsWith('builtin:')) {
            svgKey = source.replace('builtin:', '');
        } else if (source.startsWith('/local/')) {
            svgKey = source.split('/').pop().replace('.svg', '');

            // Register external SVG if not already registered
            if (!assetManager.getRegistry('svg').has(svgKey)) {
                assetManager.register('svg', svgKey, null, {
                    url: source,
                    source: 'user'
                });
            }
        }

        if (!svgKey) {
            lcardsLog.warn('[LCARdSMSDCard] Could not determine SVG key from source:', source);
            return '';
        }

        // Get SVG content (synchronous if cached, async if needs loading)
        const svgContent = assetManager.getRegistry('svg').get(svgKey);

        if (!svgContent) {
            // Trigger async load
            assetManager.get('svg', svgKey).then(loadedContent => {
                if (loadedContent) {
                    lcardsLog.debug('[LCARdSMSDCard] SVG loaded, triggering re-render:', svgKey);
                    this.requestUpdate();
                }
            });
            return ''; // Return empty until loaded
        }

        // Wrap SVG content in #__msd-base-content group (like YAML template did)
        // AND apply proper viewBox to outer wrapper for correct scaling
        try {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = svgContent;
            const svgEl = tempDiv.querySelector('svg');

            if (svgEl) {
                // Get viewBox from config (CardModel extracts this from SVG or uses default)
                const viewBox = this._msdConfig?.view_box || [0, 0, 1920, 1200];
                const [vbX, vbY, vbW, vbH] = viewBox;

                // Apply viewBox to outer SVG element for proper coordinate system
                svgEl.setAttribute('viewBox', `${vbX} ${vbY} ${vbW} ${vbH}`);
                svgEl.setAttribute('width', '100%');
                svgEl.setAttribute('height', '100%');
                svgEl.setAttribute('style', 'display: block;');

                // Remove width/height from any nested SVG elements to avoid conflicts
                // The outer viewBox defines the coordinate system, nested SVGs should inherit it
                const nestedSvgs = svgEl.querySelectorAll('svg');
                nestedSvgs.forEach(nestedSvg => {
                    nestedSvg.removeAttribute('width');
                    nestedSvg.removeAttribute('height');
                });

                // Get all child nodes
                const children = Array.from(svgEl.childNodes);

                // Create wrapper group with __ prefix to indicate internal/reserved ID
                // (prevents anchor extraction from treating this as an anchor)
                const wrapperGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                wrapperGroup.setAttribute('id', '__msd-base-content');

                // Move all children into the wrapper
                children.forEach(child => wrapperGroup.appendChild(child));

                // Clear SVG and add wrapped content
                svgEl.innerHTML = '';
                svgEl.appendChild(wrapperGroup);

                // Serialize back to string
                const wrappedContent = tempDiv.innerHTML;

                lcardsLog.debug('[LCARdSMSDCard] 🎨 Wrapped base SVG with viewBox [%d, %d, %d, %d] for proper scaling', vbX, vbY, vbW, vbH);

                return wrappedContent;
            }
        } catch (error) {
            lcardsLog.warn('[LCARdSMSDCard] Failed to wrap SVG content in base group:', error);
        }

        return svgContent;
    }

    // ============================================================================
    // Selective DOM Patching (Avoid Full Re-render)
    // ============================================================================

    /**
     * Check if rule patches only contain style changes (no structural changes)
     * @param {Object} patches - Rule patches by overlay ID
     * @returns {boolean} True if only style properties are patched
     * @private
     */
    _isStyleOnlyPatch(patches) {
        for (const overlayId in patches) {
            const patch = patches[overlayId];
            const keys = Object.keys(patch);

            // Check if patch contains non-style properties
            for (const key of keys) {
                if (key !== 'style' && key !== 'id' && key !== 'ruleId' && key !== 'ruleCondition') {
                    lcardsLog.debug(`[LCARdSMSDCard] Non-style property detected: ${key} - full re-render required`);
                    return false; // Structural change requires full re-render
                }
            }
        }

        return true; // All patches are style-only
    }

    /**
     * Apply style patches directly to DOM elements without full re-render
     * This preserves animation state and avoids expensive pipeline reinit
     * @param {Object} patches - Rule patches by overlay ID
     * @private
     */
    _applyStylePatchesToDOM(patches) {
        const mountEl = this.getMountElement();
        if (!mountEl) {
            lcardsLog.warn('[LCARdSMSDCard] Cannot apply DOM patches - no mount element');
            return;
        }

        let patchCount = 0;

        for (const overlayId in patches) {
            const patch = patches[overlayId];
            if (!patch.style) continue;

            // Find overlay element in DOM
            const overlayEl = mountEl.querySelector(`#${overlayId}`);
            if (!overlayEl) {
                lcardsLog.debug(`[LCARdSMSDCard] Overlay element not found: ${overlayId}`);
                continue;
            }

            // Get overlay type to determine how to apply style
            const overlay = this._msdConfig?.overlays?.find(o => o.id === overlayId);
            const overlayType = overlay?.type;

            // Apply style properties based on overlay type
            if (overlayType === 'line') {
                this._applyLineStyleToDOM(/** @type {SVGElement} */ (overlayEl), patch.style);
            } else if (overlayType === 'control') {
                this._applyControlStyleToDOM(/** @type {HTMLElement} */ (overlayEl), patch.style);
            } else {
                lcardsLog.warn(`[LCARdSMSDCard] Unknown overlay type for DOM patching: ${overlayType}`);            }

            patchCount++;
        }

        lcardsLog.debug(`[LCARdSMSDCard] ✅ Applied ${patchCount} style patches directly to DOM (animations preserved)`);    }

    /**
     * Apply line style patch to SVG path element
     * @param {SVGElement} lineEl - SVG path or group element
     * @param {Object} style - Style properties to apply
     * @private
     */
    _applyLineStyleToDOM(lineEl, style) {
        // If element is a group, find child path/line elements
        let targetElements = /** @type {SVGElement[]} */ ([lineEl]);
        if (lineEl.tagName.toLowerCase() === 'g') {
            const children = lineEl.querySelectorAll('path, line, polyline, polygon');
            if (children.length > 0) {
                targetElements = /** @type {SVGElement[]} */ (Array.from(children));
            }
        }

        // Map line style properties to SVG attributes
        const styleMapping = {
            color: 'stroke',           // line.style.color → SVG stroke
            stroke: 'stroke',          // also accept direct stroke
            width: 'stroke-width',
            opacity: 'opacity',
            dash_array: 'stroke-dasharray',
            dasharray: 'stroke-dasharray'
        };

        for (const [configKey, value] of Object.entries(style)) {
            const svgAttr = styleMapping[configKey];

            if (svgAttr && value !== null && value !== undefined) {
                // Resolve computed expressions and CSS variables.
                // SVG setAttribute does not support var() natively — materialise to concrete value.
                const _res = window.lcards?.core?.themeManager?.resolver;
                const afterResolver = (typeof value === 'string' && _res) ? _res.resolve(value, value) : value;
                const resolvedValue = ColorUtils.resolveCssVariable(afterResolver);

                // Apply to all target elements (group children or the element itself)
                targetElements.forEach(el => {
                    el.setAttribute(svgAttr, resolvedValue);
                });
            }
        }
    }

    /**
     * Apply control overlay style patch to container element
     * @param {HTMLElement} controlEl - Control overlay container
     * @param {Object} style - Style properties to apply
     * @private
     */
    _applyControlStyleToDOM(controlEl, style) {
        // Apply style properties to control container
        const _resMSD = window.lcards?.core?.themeManager?.resolver;
        for (const [key, value] of Object.entries(style)) {
            if (value !== null && value !== undefined) {
                const afterResolver = (typeof value === 'string' && _resMSD) ? _resMSD.resolve(value, value) : value;
                const resolvedValue = ColorUtils.resolveCssVariable(afterResolver);
                controlEl.style[key] = resolvedValue;
                lcardsLog.trace(`[LCARdSMSDCard]   Set style.${key}=${resolvedValue}`);            }
        }
    }

    // ============================================================================
    // Card Utilities
    // ============================================================================

    /**
     * Get mount element for MSD pipeline
     * @returns {ShadowRoot} Mount element
     * @public
     */
    getMountElement() {
        return /** @type {ShadowRoot} */ (this.renderRoot || this.shadowRoot);
    }

    /**
     * Get stub config for card picker
     * @returns {Object} Stub configuration
     */
    static getStubConfig() {
        return {
            type: 'custom:lcards-msd-card',
            msd: {
                base_svg: {
                    source: 'none'
                },
                view_box: [0, 0, 1920, 1080],
                overlays: []
            }
        };
    }

    /**
     * Register schema with CoreConfigManager
     * Called by lcards.js after core initialization
     * @static
     */
    static registerSchema() {
        const configManager = window.lcards?.core?.configManager;

        if (!configManager) {
            lcardsLog.error('[LCARdSMSDCard] CoreConfigManager not available for schema registration');
            return;
        }

        // Register behavioral defaults
        configManager.registerCardDefaults('msd', {
            // MSD defaults if any
        });

        // Build MSD schema
        const msdSchema = getMsdSchema();

        // Register JSON schema for validation
        configManager.registerCardSchema('msd', msdSchema, { version: __LCARDS_VERSION__ });

        lcardsLog.debug('[LCARdSMSDCard] Registered with CoreConfigManager');
    }
}

// NOTE: Card registration (customElements.define and window.customCards) handled in src/lcards.js
// This ensures all core singletons are initialized before cards can be instantiated
