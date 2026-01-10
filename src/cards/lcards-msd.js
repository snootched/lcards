/**
 * LCARdS MSD Card - Native Implementation
 *
 * Master Systems Display card implementation using native LCARdS architecture.
 * Replaces the button-card-based wrapper with direct LitElement implementation
 * while preserving all existing MSD functionality and template patterns.
 */

import { html, css } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { LCARdSCard } from '../base/LCARdSCard.js';
import { lcardsLog } from '../utils/lcards-logging.js';
import { initMsdPipeline } from '../msd/index.js';
import { getMsdSchema } from './schemas/msd-schema.js';

// Import editor component for getConfigElement()
import '../editor/cards/lcards-msd-editor.js';

/**
 * Native MSD Card implementation
 *
 * Key features:
 * - Extends LCARdSCard for unified architecture (v1.17.0+)
 * - Full MSD pipeline integration
 * - Template pattern compatibility
 * - SVG loading and caching
 * - Controls and overlay rendering
 * - HASS update management
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
            lcardsLog.debug(`[LCARdSMSDCard] Applied config ID to element: ${this.id}`);
        }

        // Re-detect preview mode now that we're in the DOM
        // setConfig() is called before element is mounted, so parentElement was null
        const newPreviewMode = this._detectPreviewMode();
        if (newPreviewMode !== this._isPreviewMode) {
            lcardsLog.debug('[LCARdSMSDCard] Preview mode re-detected after mount:', {
                before: this._isPreviewMode,
                after: newPreviewMode
            });
            this._isPreviewMode = newPreviewMode;
            this.requestUpdate(); // Trigger re-render with correct mode
        }
    }

    /**
     * Get card type for CoreConfigManager
     * @returns {string} Card type identifier
     */
    getCardType() {
        return this.constructor.CARD_TYPE;
    }

    /**
     * Called when config is updated by CoreConfigManager
     * Extract MSD configuration from processed config
     * @protected
     */
    _onConfigUpdated() {
        lcardsLog.debug('[LCARdSMSDCard] _onConfigUpdated called');

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
     * Called on first update after DOM is ready
     * Initialize MSD pipeline
     * @param {Map} changedProperties - Changed properties
     * @protected
     */
    async _onFirstUpdated(changedProperties) {
        lcardsLog.debug('[LCARdSMSDCard] _onFirstUpdated called');

        // Call parent first
        await super._onFirstUpdated(changedProperties);

        // ✅ FIX: Wait for async config processing to complete
        // LCARdSCard.setConfig() starts _processConfigAsync() in background.
        // We must wait for it before accessing this.config or derived properties.
        if (this._configProcessingPromise) {
            lcardsLog.debug('[LCARdSMSDCard] Waiting for config processing...');
            try {
                await this._configProcessingPromise;
                lcardsLog.debug('[LCARdSMSDCard] Config processing complete');
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

        // NOW _msdConfig is guaranteed to be set by _onConfigUpdated()
        // Load SVG now that config is processed
        if (this._msdConfig?.base_svg && !this._svgContent) {
            lcardsLog.debug('[LCARdSMSDCard] Loading base SVG:', this._msdConfig.base_svg.source);
            await this._loadBaseSvg(this._msdConfig.base_svg);

            if (!this._svgContent) {
                lcardsLog.error('[LCARdSMSDCard] Failed to load SVG');
                this._configIssues = { errors: ['Failed to load base SVG'] };
                this.requestUpdate();
                return;
            }

            lcardsLog.debug('[LCARdSMSDCard] SVG loaded:', this._svgContent.length, 'bytes');
        }

        // Generate instance GUID
        if (!this._msdInstanceGuid) {
            if (this.config.id) {
                this._msdInstanceGuid = `msd-${this.config.id}`;
                lcardsLog.debug('[LCARdSMSDCard] Using config.id as GUID:', this._msdInstanceGuid);
            } else {
                this._msdInstanceGuid = `msd-${this._cardGuid}`;
                lcardsLog.debug('[LCARdSMSDCard] Generated GUID:', this._msdInstanceGuid);
            }
        }

        // ✅ FIX: Wait for Lit's render to complete before initializing pipeline
        // This ensures the SVG container from _renderSvgContainer() is mounted to DOM
        // before MsdControlsRenderer tries to find it with getSvgControlsContainer()
        lcardsLog.debug('[LCARdSMSDCard] Waiting for Lit render to complete...');
        await this.updateComplete;
        lcardsLog.debug('[LCARdSMSDCard] Lit render complete');

        // Initialize MSD pipeline (now with config guaranteed ready)
        lcardsLog.debug('[LCARdSMSDCard] Initializing pipeline:', {
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
        lcardsLog.debug('[LCARdSMSDCard] Registering MSD overlays with rules engine');

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
            lcardsLog.debug(`[LCARdSMSDCard] Found ${this._msdConfig.overlays.length} overlays to register`);

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
                        lcardsLog.debug(`[LCARdSMSDCard] ✅ Registered overlay: ${overlay.id} (${overlay.type})`);
                    } else {
                        lcardsLog.debug(`[LCARdSMSDCard] Skipping registration for LCARdS control: ${overlay.id} (will self-register)`);
                    }
                }
            });
        } else {
            lcardsLog.warn('[LCARdSMSDCard] No overlays found in _msdConfig');
        }

        // Restore HASS
        this.hass = savedHass;

        lcardsLog.debug('[LCARdSMSDCard] ✅ MSD card and overlays registered with core rulesManager');

        // NOW trigger rule evaluation with all overlays registered
        if (this.hass && this._singletons?.rulesEngine) {
            lcardsLog.debug('[LCARdSMSDCard] Triggering initial rule evaluation with all overlays registered');
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
            lcardsLog.info('[LCARdSMSDCard] ✅ Rendering TIER 3: Card picker placeholder');
            return this._renderCardPickerPlaceholder();
        }

        // Tier 2: Editor stats display (editor dialog context)
        if (this._isPreviewMode === 'editor') {
            lcardsLog.info('[LCARdSMSDCard] ✅ Rendering TIER 2: Editor stats display');
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
     * NOTE: With automatic HASS propagation (v1.17.0+), embedded control cards
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
            callerStack: new Error().stack.split('\n').slice(1, 4).map(line => line.trim()).join(' → ')
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
            lcardsLog.info('[LCARdSMSDCard] 🚀 Initializing MSD pipeline');

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
            const mount = this.renderRoot;
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

            lcardsLog.info('[LCARdSMSDCard] ✅ MSD pipeline initialized successfully with SVG container mounted');

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
        let current = this;
        const maxLevels = 20;

        for (let i = 0; i < maxLevels && current; i++) {
            for (const selector of selectors) {
                if (current.tagName?.toLowerCase() === selector.toLowerCase()) {
                    return true;
                }
            }
            // Traverse shadow DOM boundaries: try parentElement, then host
            current = current.parentElement || current.parentNode?.host || current.getRootNode()?.host;
        }

        return false;
    }

    /**
     * Detect if running in preview mode with tiered strategy
     * Returns: false (full render), 'picker' (Tier 3), 'editor' (Tier 2)
     * @private
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
                editMode: dashboardEl.editMode
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
     * @protected
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
        return 4; // MSD cards are typically larger
    }

    /**
     * Get layout options
     * @protected
     */
    _getLayoutOptions() {
        return {
            grid_rows: 4,
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

        // Version field is no longer required (deprecated in v1.22+)
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
                height: 56px;
                background: linear-gradient(180deg, #000611 0%, #0252a2 100%);
                border: 2px solid #9999ff;
                border-radius: 20px;
                display: flex;
                align-items: center;
                position: relative;
                overflow: hidden;
                box-shadow: inset 0 0 20px rgba(153, 153, 255, 0.1);
            ">
                <!-- Left LCARS cap -->
                <div style="
                    width: 52px;
                    height: 100%;
                    background: linear-gradient(90deg, #ff9933 0%, #ffaa55 100%);
                    border-radius: 20px 0 0 20px;
                    margin-right: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: Antonio, monospace;
                    font-size: 18px;
                    color: #000;
                    font-weight: bold;
                    letter-spacing: 0.5px;
                    box-shadow: 0 0 10px rgba(255, 153, 51, 0.4);
                ">
                    MSD
                </div>

                <!-- Mock system lines -->
                <div style="flex: 1; display: flex; align-items: center; gap: 6px; padding: 0 8px;">
                    <div style="width: 60px; height: 10px; background: linear-gradient(90deg, #9999ff 0%, #7777dd 100%); border-radius: 5px; box-shadow: 0 0 4px rgba(153, 153, 255, 0.5);"></div>
                    <div style="width: 40px; height: 10px; background: linear-gradient(90deg, #66ccff 0%, #4499dd 100%); border-radius: 5px; box-shadow: 0 0 4px rgba(102, 204, 255, 0.5);"></div>
                    <div style="width: 30px; height: 10px; background: linear-gradient(90deg, #ff9933 0%, #dd7722 100%); border-radius: 5px; box-shadow: 0 0 4px rgba(255, 153, 51, 0.5);"></div>
                    <div style="width: 45px; height: 10px; background: linear-gradient(90deg, #66ff66 0%, #44dd44 100%); border-radius: 5px; box-shadow: 0 0 4px rgba(102, 255, 102, 0.5);"></div>
                    <div style="width: 35px; height: 10px; background: linear-gradient(90deg, #ff6666 0%, #dd4444 100%); border-radius: 5px; box-shadow: 0 0 4px rgba(255, 102, 102, 0.5);"></div>
                </div>

                <!-- Right info badge -->
                <div style="
                    min-width: 40px;
                    height: 100%;
                    background: linear-gradient(180deg, #9999ff 0%, #7777dd 100%);
                    border-radius: 0 20px 20px 0;
                    margin-left: 8px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    font-family: Antonio, monospace;
                    color: #000;
                    font-weight: bold;
                    box-shadow: 0 0 10px rgba(153, 153, 255, 0.4);
                ">
                    <div style="font-size: 14px; line-height: 1;">⬢</div>
                    <div style="font-size: 6px; letter-spacing: 0.5px; margin-top: 2px;">LCARS</div>
                </div>
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
                height: 450px;
                background: linear-gradient(180deg, #000611 0%, #001a33 100%);
                border: 3px solid #9999ff;
                border-radius: 24px;
                display: flex;
                flex-direction: column;
                font-family: 'Antonio', monospace;
                position: relative;
                overflow: hidden;
                box-shadow: inset 0 0 40px rgba(153, 153, 255, 0.1);
            ">
                <!-- Header bar -->
                <div style="
                    display: flex;
                    align-items: center;
                    padding: 16px 20px;
                    background: linear-gradient(90deg, #ff9933 0%, #ffaa55 50%, #ff9933 100%);
                    border-radius: 20px 20px 0 0;
                    gap: 12px;
                    box-shadow: 0 2px 10px rgba(255, 153, 51, 0.3);
                ">
                    <div style="font-size: 20px; font-weight: bold; color: #000; letter-spacing: 1px;">⬢</div>
                    <div style="flex: 1;">
                        <div style="font-size: 18px; font-weight: bold; color: #000; letter-spacing: 1px;">MASTER SYSTEMS DISPLAY</div>
                        <div style="font-size: 11px; color: #000; opacity: 0.7; letter-spacing: 0.5px;">LCARdS Configuration Editor</div>
                    </div>
                    <div style="font-size: 24px; color: #000;">●</div>
                </div>

                ${hasConfig ? html`
                    <!-- Configuration details -->
                    <div style="flex: 1; padding: 24px; display: flex; flex-direction: column; gap: 16px;">
                        <!-- Status row -->
                        <div style="display: flex; gap: 12px;">
                            <div style="
                                flex: 1;
                                background: linear-gradient(135deg, rgba(153, 153, 255, 0.15) 0%, rgba(102, 102, 204, 0.1) 100%);
                                border: 2px solid #9999ff;
                                border-radius: 12px;
                                padding: 12px;
                                box-shadow: 0 0 10px rgba(153, 153, 255, 0.2);
                            ">
                                <div style="font-size: 10px; color: #9999ff; opacity: 0.7; letter-spacing: 1px; margin-bottom: 4px;">STATUS</div>
                                <div style="font-size: 16px; color: #66ff66; font-weight: bold;">● CONFIGURED</div>
                            </div>
                            <div style="
                                flex: 1;
                                background: linear-gradient(135deg, rgba(102, 204, 255, 0.15) 0%, rgba(68, 153, 221, 0.1) 100%);
                                border: 2px solid #66ccff;
                                border-radius: 12px;
                                padding: 12px;
                                box-shadow: 0 0 10px rgba(102, 204, 255, 0.2);
                            ">
                                <div style="font-size: 10px; color: #66ccff; opacity: 0.7; letter-spacing: 1px; margin-bottom: 4px;">VIEWBOX</div>
                                <div style="font-size: 13px; color: #66ccff; font-weight: bold;">${viewBox[2]} × ${viewBox[3]}</div>
                            </div>
                        </div>

                        <!-- SVG Source -->
                        <div style="
                            background: linear-gradient(135deg, rgba(255, 153, 51, 0.15) 0%, rgba(221, 119, 34, 0.1) 100%);
                            border: 2px solid #ff9933;
                            border-radius: 12px;
                            padding: 12px;
                            box-shadow: 0 0 10px rgba(255, 153, 51, 0.2);
                        ">
                            <div style="font-size: 10px; color: #ff9933; opacity: 0.7; letter-spacing: 1px; margin-bottom: 4px;">BASE SVG SOURCE</div>
                            <div style="font-size: 13px; color: #ff9933; font-weight: bold; word-break: break-all;">${baseSvgSource}</div>
                        </div>

                        <!-- Stats grid -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
                            <div style="
                                background: linear-gradient(135deg, rgba(153, 153, 255, 0.15) 0%, rgba(102, 102, 204, 0.1) 100%);
                                border: 2px solid #9999ff;
                                border-radius: 12px;
                                padding: 12px;
                                text-align: center;
                                box-shadow: 0 0 10px rgba(153, 153, 255, 0.2);
                            ">
                                <div style="font-size: 24px; color: #9999ff; font-weight: bold;">${overlayCount}</div>
                                <div style="font-size: 9px; color: #9999ff; opacity: 0.7; letter-spacing: 0.5px; margin-top: 2px;">OVERLAYS</div>
                            </div>
                            <div style="
                                background: linear-gradient(135deg, rgba(102, 204, 255, 0.15) 0%, rgba(68, 153, 221, 0.1) 100%);
                                border: 2px solid #66ccff;
                                border-radius: 12px;
                                padding: 12px;
                                text-align: center;
                                box-shadow: 0 0 10px rgba(102, 204, 255, 0.2);
                            ">
                                <div style="font-size: 24px; color: #66ccff; font-weight: bold;">${dataSourceCount}</div>
                                <div style="font-size: 9px; color: #66ccff; opacity: 0.7; letter-spacing: 0.5px; margin-top: 2px;">DATA SOURCES</div>
                            </div>
                            <div style="
                                background: linear-gradient(135deg, rgba(255, 102, 102, 0.15) 0%, rgba(221, 68, 68, 0.1) 100%);
                                border: 2px solid #ff6666;
                                border-radius: 12px;
                                padding: 12px;
                                text-align: center;
                                box-shadow: 0 0 10px rgba(255, 102, 102, 0.2);
                            ">
                                <div style="font-size: 24px; color: #ff6666; font-weight: bold;">${rulesCount}</div>
                                <div style="font-size: 9px; color: #ff6666; opacity: 0.7; letter-spacing: 0.5px; margin-top: 2px;">RULES</div>
                            </div>
                        </div>

                        <!-- Info message -->
                        <div style="
                            margin-top: auto;
                            padding: 8px 12px;
                            background: rgba(153, 153, 255, 0.1);
                            border-left: 3px solid #9999ff;
                            border-radius: 4px;
                        ">
                            <div style="font-size: 10px; color: #9999ff; opacity: 0.8; line-height: 1.4;">
                                ⓘ Full MSD preview available on dashboard. Use YAML editor to modify configuration.
                            </div>
                        </div>
                    </div>
                ` : html`
                    <!-- No configuration -->
                    <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px;">
                        <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;">⬢</div>
                        <div style="font-size: 16px; color: #9999ff; margin-bottom: 8px; font-weight: bold;">NO CONFIGURATION</div>
                        <div style="font-size: 11px; color: #66ccff; opacity: 0.7; text-align: center; max-width: 300px; line-height: 1.6;">
                            Add MSD configuration with base_svg, overlays, data_sources, and rules to create your custom LCARS display
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
        try {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = svgContent;
            const svgEl = tempDiv.querySelector('svg');

            if (svgEl) {
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

                lcardsLog.debug('[LCARdSMSDCard] 🎨 Wrapped base SVG content in #__msd-base-content for filter isolation');

                return wrappedContent;
            }
        } catch (error) {
            lcardsLog.warn('[LCARdSMSDCard] Failed to wrap SVG content in base group:', error);
        }

        return svgContent;
    }

    // ============================================================================
    // Card Utilities
    // ============================================================================

    /**
     * Get mount element for MSD pipeline
     * @returns {HTMLElement|ShadowRoot} Mount element
     * @protected
     */
    getMountElement() {
        return this.renderRoot || this.shadowRoot;
    }

    /**
     * Get config element (editor)
     * @returns {HTMLElement} Editor element
     */
    static getConfigElement() {
        return document.createElement('lcards-msd-editor');
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
        configManager.registerCardSchema('msd', msdSchema, { version: '1.22.0' });

        lcardsLog.debug('[LCARdSMSDCard] Registered with CoreConfigManager (v1.22.0)');
    }
}

// NOTE: Card registration (customElements.define and window.customCards) handled in src/lcards.js
// This ensures all core singletons are initialized before cards can be instantiated
