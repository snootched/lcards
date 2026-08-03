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
import { resolveEffectiveViewBox } from '../utils/lcards-anchor-helpers.js';
import { BackgroundAnimationRenderer } from '../core/packs/backgrounds/BackgroundAnimationRenderer.js';

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

                /* Static "bar-label-lozenge"-styled splash shown while the SVG
                   container is mounted-but-hidden, waiting for the pipeline to
                   finish (see _msdRevealed). Deliberately plain CSS with no
                   animation: a spinner here visibly stutters, since this window
                   overlaps the pipeline's own heavy synchronous render work,
                   which starves the main thread of paint time. A static shape
                   only needs to paint once, so it has nothing to stutter.
                   --msd-splash-bar-color is set inline by _renderCard() via the
                   theme resolver (same components.button.background.active
                   token the real bar-label-lozenge preset uses), so this
                   matches whatever HA-LCARS theme is active — the var()
                   fallback here only covers the resolver-unavailable case. */
                .lcards-msd-loading-splash {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: var(--ha-space-6, 24px);
                }

                .lcards-msd-loading-bar {
                    display: flex;
                    align-items: stretch;
                    width: 100%;
                    max-width: 440px;
                    height: var(--msd-splash-bar-height, 40px);
                    gap: var(--ha-space-1, 4px);
                }

                .lcards-msd-loading-bar-segment {
                    flex: 1 1 auto;
                    min-width: 20px;
                    background: var(--msd-splash-bar-color, var(--lcars-ui-tertiary, var(--lcards-gray-medium-light)));
                }

                .lcards-msd-loading-bar-segment--start {
                    border-radius: var(--ha-border-radius-pill) 0 0 var(--ha-border-radius-pill);
                }

                .lcards-msd-loading-bar-segment--end {
                    border-radius: 0 var(--ha-border-radius-pill) var(--ha-border-radius-pill) 0;
                }

                .lcards-msd-loading-label {
                    flex: 0 1 auto;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: black;
                    color: var(--lcars-yellow, var(--lcards-yellow-medium, #ffcc99));
                    font-family: var(--lcars-font), var(--lcars-fallback-font), 'Antonio', 'Segoe UI Variable Static Text', 'Segoe UI', sans-serif;
                    font-weight: 100;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    /* The real button preset's cap_height_ratio: 0.86 math
                       (font-size = zoneHeight / 0.86) is tuned for SVG <text>
                       baseline positioning, not a CSS line box — at that ratio
                       here the line box exceeds the bar height and overflows.
                       0.85x keeps caps close to full bar height while the line
                       box (line-height: 1) still comfortably fits inside it. */
                    font-size: calc(var(--msd-splash-bar-height, 40px) * 0.85);
                    line-height: 1;
                    padding: 0 var(--ha-space-3, 12px);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
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
        // Holds the in-flight _loadAndInitializeMsdCore() promise while one is
        // running — _loadAndInitializeMsd() is a dedup wrapper around it, since
        // _onFirstUpdated() and _onConnected() are two independent, unawaited
        // async lifecycle entry points that can both end up calling it during
        // the same first-mount window (see _onConnected()'s reconnect-guard
        // comment). Without this, both calls run the full SVG-fetch/pipeline-
        // init/background-animation sequence concurrently and redundantly.
        this._msdLoadInFlight = null;
        // Set by _onRulePatchesChanged() when it triggers a re-render (fire-and-
        // forget for its other, post-reveal callers) — _initializeMsdPipeline()
        // awaits this once, right after the initial rules registration, so the
        // reveal doesn't fire until this pass (if any) has actually finished too.
        this._pendingRulesReRender = null;
        // True once the pipeline (routing, controls, on_load animations, and
        // background_animation if configured) has actually finished, not just
        // DOM-mounted — gates the SVG container's visual reveal, see
        // _renderSvgContainer()/_renderCard(). Kept separate from
        // _msdInitialized, which must flip early for the pipeline's own DOM
        // measurements to work.
        this._msdRevealed = false;
        this._configIssues = null;
        this._backgroundRenderer = null;
        // True once _detectPreviewMode() has confirmed this instance is
        // rendering inside the MSD Studio editor dialog (#387) — forwarded
        // into the pipeline so MsdControlsRenderer's hui-card-wrapped
        // controls keep Studio's "always show" preview behavior instead of
        // honoring `visibility:` at design time.
        this._isStudioPreview = false;
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

            // Live (non-remount) config update to an ALREADY-initialized pipeline: re-resolve
            // view_box and push it into RouterCore/cardModel so routed lines/attachment points
            // re-pan/re-size along with the base SVG. No-op on first mount - _initializeMsdPipeline()
            // resolves view_box correctly via ConfigProcessor on that path already.
            this._reconcileViewBoxIfChanged();
        }
    }

    /**
     * Re-resolve view_box against the latest raw config and push the RESOLVED
     * value into the already-initialized pipeline's RouterCore + cardModel.
     *
     * _onConfigUpdated() only ever sees the RAW `view_box` from config (e.g.
     * undefined in "Auto" mode) - the actually-rendered, resolved value
     * (explicit config > SVG-native > last-resort default) is computed inside
     * ConfigProcessor.processAndValidateConfig(), which only runs once, during
     * _initializeMsdPipeline(). A live setConfig() on an already-mounted card
     * (e.g. HA pushing a dashboard/YAML edit without remounting the element -
     * unlike the MSD Studio dialog's live preview, which always destroys and
     * recreates the card) would otherwise leave RouterCore's grid sizing/origin
     * math pinned to whatever view_box was in effect at first mount, even
     * though _wrapSvgContentForRender() correctly re-pans the visible base SVG
     * on every render from the fresh raw config.
     *
     * Mirrors the existing "lightweight reconcile" pattern in
     * _onRulePatchesChanged(): reach into the coordinator's already-built
     * cardModel/router and update them directly, then request a re-render,
     * rather than tearing down and re-running the full pipeline init.
     * @private
     */
    _reconcileViewBoxIfChanged() {
        // Guard against a real race in _initializeMsdPipeline(): it flips
        // _msdInitialized = true BEFORE this._msdPipeline is assigned (to unblock
        // the loading-spinner->SVG-container render switch), so checking
        // _msdInitialized alone isn't sufficient - coordinator/router/cardModel may
        // still be null/stale mid-first-init. On first mount this is also correctly
        // a no-op: the normal init path resolves view_box itself already.
        if (!this._msdInitialized) return;
        const coordinator = this._msdPipeline?.coordinator;
        const cardModel = coordinator?.modelBuilder?.cardModel;
        if (!coordinator?.router || !cardModel) return;

        // Same resolution ConfigProcessor uses on first mount: explicit config >
        // SVG-native > last-resort default. this._svgContent is preserved across
        // reconnects/live-updates (see _loadAndInitializeMsd), so it's safe to reuse
        // here even though this path never re-loads the SVG itself.
        const resolved = resolveEffectiveViewBox(this._msdConfig?.view_box, this._svgContent);

        const prev = coordinator.router.viewBox;
        const unchanged = Array.isArray(prev) && prev.length === 4 &&
            prev[0] === resolved[0] && prev[1] === resolved[1] &&
            prev[2] === resolved[2] && prev[3] === resolved[3];
        if (unchanged) return;

        lcardsLog.debug('[LCARdSMSDCard] view_box changed on live config update - reconciling router/cardModel', {
            from: prev, to: resolved
        });

        // ModelBuilder.computeResolvedModel() reads cardModel.viewBox fresh on every
        // reRender() call, so updating it here is sufficient for AdvancedRenderer/
        // attachment points to pick it up on the re-render triggered below.
        cardModel.viewBox = resolved;
        // RouterCore keeps its own copy captured at construction time and never
        // re-reads cardModel.viewBox afterward - must be told explicitly.
        coordinator.router.setViewBox(resolved);

        if (coordinator._reRenderCallback) {
            coordinator._reRenderCallback();
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
     *
     * Dedup wrapper: _onFirstUpdated() and _onConnected() are two independent,
     * unawaited async lifecycle entry points (connectedCallback() and Lit's
     * firstUpdated() respectively) that can both end up calling this during the
     * same first-mount window — _onConnected()'s "is this a reconnect" guard
     * checks _initialized (set synchronously early in the base class's own
     * _onFirstUpdated) against _msdInitialized (which only flips much later,
     * deep inside this function), so it can misfire as "reconnect" while the
     * very first call is still mid-flight. Without this wrapper, both calls
     * would run their own full SVG-fetch/pipeline-init/background-animation
     * sequence concurrently and redundantly (confirmed via trace log: doubled
     * SVG loads, doubled background-animation init/rebuild). A losing call now
     * just awaits the same in-flight promise instead.
     * @private
     */
    async _loadAndInitializeMsd() {
        if (this._msdLoadInFlight) {
            lcardsLog.trace('[LCARdSMSDCard] _loadAndInitializeMsd already in flight - awaiting existing call');
            return this._msdLoadInFlight;
        }

        const loadPromise = this._loadAndInitializeMsdCore();
        this._msdLoadInFlight = loadPromise;
        try {
            await loadPromise;
        } finally {
            // Compare-and-clear: guards against a stale/orphaned call's finally
            // block clobbering a newer cycle's in-flight reference (e.g. a fast
            // disconnect/reconnect happening while an old call is still winding down).
            if (this._msdLoadInFlight === loadPromise) {
                this._msdLoadInFlight = null;
            }
        }
    }

    /**
     * @private
     */
    async _loadAndInitializeMsdCore() {
        lcardsLog.trace('[LCARdSMSDCard] _loadAndInitializeMsdCore called');

        // Tier 2/3 (editor stats display, card-picker placeholder) never show the
        // real SVG/overlays — _renderEditorStats()/_renderCardPickerPlaceholder()
        // only need this.config/this._msdConfig, both already populated by
        // _onConfigUpdated() independent of the pipeline. Skip pipeline init
        // entirely here: both placeholder templates contain their own decorative
        // <svg> for visual branding, and the renderer's mount-point resolution
        // does a bare `mountEl.querySelector('svg')` — with no real SVG container
        // in the DOM (Tier 1's #msd-v1-comprehensive-wrapper was never rendered),
        // it would find that decorative SVG instead and mount real overlay content
        // straight into it, showing the actual config's lines/controls on top of
        // the placeholder graphic.
        if (this._isPreviewMode === 'picker' || this._isPreviewMode === 'editor') {
            lcardsLog.debug('[LCARdSMSDCard] Skipping pipeline init - Tier 2/3 placeholder mode', {
                isPreviewMode: this._isPreviewMode
            });
            return;
        }

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

        // Must come after pipeline init: _msdInitialized only flips to true (and the
        // SVG container, i.e. #msd-v1-comprehensive-wrapper, only actually mounts)
        // partway through _initializeMsdPipeline(), not at the updateComplete above.
        // Skipped entirely in MSD Studio's live preview (_isStudioPreview) — that
        // card instance is fully destroyed and rebuilt on every edit/hass-tick (see
        // lcards-msd-live-preview.js), so a Canvas2D background animation there
        // never gets to run for more than a moment before being torn down again;
        // starting one is pure wasted work (and was itself a source of visible
        // main-thread jank while editing, since every fresh instance pays a full
        // bake with no chance to reach cheap steady-state panning).
        if (this._msdInitialized && this._msdConfig?.background_animation) {
            if (!this._isStudioPreview) {
                this._initializeBackgroundAnimation();
            } else {
                lcardsLog.trace('[LCARdSMSDCard] Skipping background_animation init — Studio preview');
            }
        }

        // Pipeline (and background_animation, if any) are now fully ready —
        // reveal the SVG container. Only fires on success: failure paths above
        // already reset _msdInitialized to false, so this naturally no-ops and
        // the error-box render branch takes over instead.
        if (this._msdInitialized) {
            this._msdRevealed = true;
            this.requestUpdate();
        }
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
            // Request MSD pipeline to re-render with updated config.
            // Stash the promise (harmless no-op for callers that don't check it,
            // e.g. live post-reveal rule updates) so _initializeMsdPipeline() can
            // await this specific pass when it's the one triggered during initial
            // load — see _pendingRulesReRender.
            lcardsLog.debug('[LCARdSMSDCard] Triggering MSD re-render after rule patches applied');
            this._pendingRulesReRender = this._msdPipeline.coordinator._reRenderCallback();
        } else {
            lcardsLog.warn('[LCARdSMSDCard] No re-render callback available on coordinator');
        }

        // Request Lit update to re-render card
        this.requestUpdate();
    }

    /**
     * Pre-evaluate Jinja2/JS templates in MSD overlay config (e.g. a line's
     * `style.color`) so `_resolveTemplateValue()` can substitute results
     * during LineOverlay's synchronous color resolution.
     *
     * Deliberately does NOT call the pipeline's `reRender()` (a full
     * `AdvancedRenderer.render()` pass) to pick up the fresh cache — that
     * destroys and rebuilds every overlay's DOM (`AdvancedRenderer.render()`
     * clears `overlayElementCache` and empties the overlay group), which kills
     * running animations on completely unrelated overlays and can refire
     * `on_load` triggers unexpectedly. Instead, re-ingest hass through the
     * normal coordinator path: `MsdCardCoordinator.ingestHass()` already calls
     * `AdvancedRenderer.updateLineEntityColors()` every tick, which (as of
     * Phase 8) surgically DOM-patches template-literal line colors the same
     * way it already patches `entity`-bound ones — no full re-render needed.
     * @protected
     * @override
     */
    async _processCustomTemplates() {
        if (!this.config?.msd?.overlays) return;

        const hasChanges = await this._preEvaluateStyleTemplates(this.config.msd.overlays);

        if (hasChanges && this.hass && this._msdPipeline?.coordinator) {
            this._msdPipeline.coordinator.ingestHass(this.hass);
        }
    }

    /**
     * Handle HASS updates - forward to MSD coordinator
     * @param {Object} newHass - New HASS object
     * @param {Object} oldHass - Old HASS object
     * @protected
     *
     * NOTE: We don't call super._handleHassUpdate() because MSD has its own
     * coordinator that handles HASS distribution to subsystems (renderer, controls).
     *
     * CORRECTED: this used to assume "the core rulesManager receives HASS
     * automatically via BaseService.updateHass()" — that was only ever true by
     * accident, when some *other* card on the same dashboard happened to call
     * window.lcards.core.ingestHass() and trigger the global cascade to every
     * BaseService singleton (rulesManager, animationManager, etc.), since MSD's
     * own hass setter (above) never calls the base class's _onHassChanged(),
     * which is the only other place that forwarding happens. Confirmed via a
     * live map_range animation-speed test (Phase 10) that never live-updated
     * with only the MSD card on the page. Now forwarded explicitly below.
     */
    _handleHassUpdate(newHass, oldHass) {
        lcardsLog.trace('[LCARdSMSDCard] _handleHassUpdate called');

        // Forward HASS to MSD coordinator
        // Note: coordinator is the MsdCardCoordinator instance from pipeline
        if (this._msdPipeline?.coordinator) {
            this._msdPipeline.coordinator.ingestHass(newHass);
        }

        // Always forward to the global core singleton on the very first tick
        // (oldHass is null) — mirrors the base LCARdSCard.set hass()'s own
        // "!oldHass" fallback, which this override bypasses entirely (see the
        // class-level note above). Without this, a card with no tracked
        // entities below (no Jinja2/map_range refs — e.g. a plain base_svg-
        // only config) never reaches the ingest call at all, so
        // window.lcards.core.assetManager (and every other core singleton)
        // never receives HASS unless some *other* LCARdS card on the same
        // dashboard happens to trigger the global cascade first. Confirmed
        // via a cold-load base_svg media-source:// load that hung
        // indefinitely waiting on AssetManager._hass with no other LCARdS
        // card present to trigger it — not a brief startup race, the
        // tracked-entity-gated call below simply never fired.
        if (!oldHass && window.lcards?.core) {
            window.lcards.core.ingestHass(newHass);
        }

        // Re-evaluate Jinja2/JS templates (e.g. a line's style.color) whenever an
        // entity referenced by one of them changes, and forward to the global
        // core singleton so every other BaseService (rulesManager,
        // animationManager, etc.) sees the change too — _trackedEntities is
        // populated by the base class's _updateTrackedEntities() (auto-scans
        // config for Jinja2 entity refs and, as of Phase 10, map_range.entity
        // refs too), and window.lcards.core.ingestHass() dedupes multiple calls
        // per tick, so calling it here is safe even if another card also does.
        if (this._trackedEntities?.length > 0) {
            const entityChanged = this._trackedEntities.some(entityId =>
                oldHass?.states?.[entityId] !== newHass?.states?.[entityId]
            );
            if (entityChanged) {
                this._processCustomTemplates();
                if (window.lcards?.core) {
                    window.lcards.core.ingestHass(newHass);
                }
            }
        }

        // MSD has no single bound entity (unlike button/elbow) — background effects
        // needing live entity state use map_range's own explicit entity_id instead.
        if (this._backgroundRenderer) {
            this._backgroundRenderer.updateHass(newHass, null, this._fullConfig);
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
                    <ha-spinner size="small"></ha-spinner>
                    <p>Initializing MSD...</p>
                </div>
            `;
        }

        // Render SVG container for MSD mounting. The container itself is
        // opacity-gated on _msdRevealed (see _renderSvgContainer()) so the
        // pipeline can still measure it in the live DOM while hidden; overlay
        // the same loading splash on top until the reveal fires, so loading
        // feedback is continuous instead of a blank gap between "Initializing
        // MSD..." and the final reveal.
        return html`
            <div style="position: relative; width: 100%; height: 100%;">
                ${this._renderSvgContainer()}
                ${(!this._msdRevealed && !this._isStudioPreview) ? this._renderMsdLoadingSplash() : ''}
            </div>
        `;
    }

    /**
     * Static "bar-label-lozenge"-styled loading splash shown while the SVG
     * container is mounted-but-hidden (see _renderCard()). The bar color is
     * resolved through the theme token system — the same
     * components.button.background.active token the real bar-label-lozenge
     * button preset uses — so it matches whatever HA-LCARS theme is active,
     * rather than a hardcoded color.
     * @returns {import('lit').TemplateResult}
     * @private
     */
    _renderMsdLoadingSplash() {
        const resolver = window.lcards?.core?.themeManager?.resolver;
        const fallback = 'var(--lcars-ui-tertiary, var(--lcards-gray-medium-light))';
        const barColor = resolver ? resolver.resolve('components.button.background.active', fallback) : fallback;

        return html`
            <div class="lcards-msd-loading-splash" style="--msd-splash-bar-color: ${barColor};">
                <div class="lcards-msd-loading-bar">
                    <span class="lcards-msd-loading-bar-segment lcards-msd-loading-bar-segment--start"></span>
                    <span class="lcards-msd-loading-label">Initializing MSD</span>
                    <span class="lcards-msd-loading-bar-segment lcards-msd-loading-bar-segment--end"></span>
                </div>
            </div>
        `;
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

        // Parse source to extract asset key
        // Source format: "builtin:ncc-1701-a-blue" → asset key: "ncc-1701-a-blue"
        // media-source://… items are registered/fetched under the content ID
        // itself (see AssetManager.loadSvgFromMediaSource), so assetKey stays
        // equal to svgSource for those — just here for the logging below.
        let assetKey = svgSource;
        if (svgSource?. startsWith('builtin:')) {
            assetKey = svgSource.replace('builtin:', '');
        }

        lcardsLog.debug('[LCARdSMSDCard] Resolved asset key:', assetKey);

        if (svgSource?.startsWith('media-source://')) {
            // HA media library item — needs an async resolve step before it's
            // fetchable, unlike builtin:/plain-path sources below.
            this._svgContent = await assetManager.loadSvgFromMediaSource(svgSource);
        } else {
            // ✅ FIX: Use get() method, not loadSvg()
            this._svgContent = await assetManager.get('svg', assetKey);
        }

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
                this._msdInstanceGuid,
                this._isStudioPreview
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

            // _registerOverlaysWithRulesEngine() synchronously triggers rule
            // evaluation, which — if this card has any overlay rules — calls
            // _onRulePatchesChanged() -> coordinator._reRenderCallback(), a full
            // second AdvancedRenderer.render() pass (routing + controls +
            // on_load animations, all over again) that was previously fire-
            // and-forget. Wait for it here so the reveal below (in
            // _loadAndInitializeMsd()) doesn't fire after only the FIRST pass
            // while this second one is still rebuilding everything in the background.
            if (this._pendingRulesReRender) {
                await this._pendingRulesReRender;
                this._pendingRulesReRender = null;
            }

            // Ensure any Jinja2/JS template literals in overlay styles (e.g. a line's
            // style.color) are evaluated and re-rendered at least once now that the
            // pipeline (and hass) are available — the generic hass-change-triggered
            // path in _processCustomTemplates() may race with this initialization on
            // first load, since MSD's own reRender() isn't ready until this point.
            await this._processCustomTemplates();

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
     * Initialize the optional animated/image background layer (msd.background_animation).
     * Lives in its own DOM subtree behind the SVG (z-index: -1), independent of
     * base_svg.render_visual — same reuse of BackgroundAnimationRenderer as
     * lcards-button.js/_initializeBackgroundAnimation().
     * @private
     */
    _initializeBackgroundAnimation() {
        // Guard against double-init (e.g. overlapping first-mount/reconnect timing) —
        // always tear down any existing instance before creating a new one.
        if (this._backgroundRenderer) {
            this._backgroundRenderer.destroy();
            this._backgroundRenderer = null;
        }

        const wrapper = this.shadowRoot?.querySelector('#msd-v1-comprehensive-wrapper');
        if (!wrapper) {
            lcardsLog.warn('[LCARdSMSDCard] Cannot initialize background - wrapper not found');
            return;
        }

        // BackgroundAnimationRenderer.destroy() only removes the canvas it created,
        // not this wrapper div — and Lit may reuse the same #msd-v1-comprehensive-wrapper
        // element across reconnects rather than recreating it, so a prior cycle's now-empty
        // layer div can be left behind. Remove any stragglers before adding a fresh one.
        wrapper.querySelectorAll(':scope > [data-msd-background-layer]').forEach(el => el.remove());

        const backgroundLayer = document.createElement('div');
        backgroundLayer.setAttribute('data-msd-background-layer', '');
        backgroundLayer.style.position = 'absolute';
        backgroundLayer.style.top = '0';
        backgroundLayer.style.left = '0';
        backgroundLayer.style.width = '100%';
        backgroundLayer.style.height = '100%';
        backgroundLayer.style.zIndex = '-1';
        backgroundLayer.style.pointerEvents = 'none';

        wrapper.insertBefore(backgroundLayer, wrapper.firstChild);

        this._backgroundRenderer = new BackgroundAnimationRenderer(
            backgroundLayer,
            this._msdConfig.background_animation,
            this
        );

        const success = this._backgroundRenderer.init();
        if (success) {
            lcardsLog.debug('[LCARdSMSDCard] Background animation initialized');
        } else {
            lcardsLog.error('[LCARdSMSDCard] Background animation initialization failed');
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
        this._msdRevealed = false;
        this._pendingRulesReRender = null;
        if (this._backgroundRenderer) {
            this._backgroundRenderer.destroy();
            this._backgroundRenderer = null;
        }
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
        this._isStudioPreview = isInStudioDialog; // see #387: forwarded to MsdControlsRenderer's edit-mode signal
        if (isInStudioDialog) {
            lcardsLog.debug('[LCARdSMSDCard] Studio dialog detected - Tier 1: live preview mode');
            return false; // NOT preview - allow full render
        }

        // Dashboard (edit mode or view mode) - always allow full render.
        // Checked BEFORE the .preview/.editMode check below: hui-view's own
        // card-creation path sets `.preview = this.lovelace.editMode` on EVERY
        // card on the dashboard (not just ones inside the edit-card dialog), so
        // `.preview`/`.editMode` alone can't distinguish "dashboard is being
        // rearranged" from "this card is open in the edit-card dialog" — only
        // ancestry can. Checking dashboard ancestry first keeps dashboard
        // rearrange mode on full render, matching pre-existing behavior.
        // Must pierce shadow DOM boundaries: a card sits several shadow roots
        // deep below hui-root/ha-panel-lovelace (hui-card -> hui-view's own
        // shadow root -> ... -> hui-root), so plain `.closest()` never actually
        // found it here — it silently returned null and this branch was
        // effectively dead, only "working" because every other fallback path
        // below also returns `false` (full render). That equivalence broke once
        // the .preview/.editMode check below started intercepting first.
        // Note: Do NOT call super._detectPreviewMode() as base class blocks dashboard edit mode
        const isOnDashboard = this._checkForAncestor(['hui-root', 'ha-panel-lovelace']);
        if (isOnDashboard) {
            lcardsLog.debug('[LCARdSMSDCard] On dashboard - Tier 1: full render');
            return false;
        }

        // Tier 2: Card editor dialog (block with stats display).
        // `hui-card` (HA's wrapper for a card rendered inside hui-dialog-edit-card/
        // hui-suggestion-card/hui-dialog-delete-card) sets `.preview`/`.editMode`
        // directly as properties on the card element it wraps — a signal from HA
        // itself, checked first since it's more reliable than DOM-ancestor sniffing,
        // and safe here since the dashboard case (the other place these properties
        // get set) was already ruled out above. The ancestor check here used to
        // also match a `hui-card-preview` tag, which no longer exists in current HA
        // (that wrapper is now plain `<hui-card preview>` — an attribute on
        // `hui-card`, not a distinct element) — kept `hui-dialog-edit-card` as a
        // fallback in case a future HA version wraps a card some other way without
        // setting these properties.
        const isInEditDialog = /** @type {any} */ (this).preview === true ||
            /** @type {any} */ (this).editMode === true ||
            this._checkForAncestor(['hui-dialog-edit-card']);
        if (isInEditDialog) {
            lcardsLog.debug('[LCARdSMSDCard] Card editor dialog detected - Tier 2: stats display mode');
            return 'editor';
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
        const go = this.config.grid_options || {};
        return {
            columns: go.columns ?? 4,
            rows: go.rows ?? 8,
            min_columns: 2,
            min_rows: 4,
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
        const viewBox = resolveEffectiveViewBox(this._msdConfig?.view_box, null);

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

        const source = this._msdConfig?.base_svg?.source;

        // For "none" source, create empty SVG container
        if (source === 'none') {
            const viewBox = resolveEffectiveViewBox(this._msdConfig?.view_box, null);
            const [vbX, vbY, vbW, vbH] = viewBox;
            const aspect = vbW && vbH ? (vbW / vbH) : 2;

            lcardsLog.debug('[LCARdSMSDCard] Rendering SVG container:', {
                source,
                viewBox,
                aspect,
                hasSvgContent: !!this._svgContent
            });

            return html`
                <div id="msd-v1-comprehensive-wrapper" style="
                    width: 100%;
                    height: 100%;
                    position: relative;
                    aspect-ratio: ${aspect};
                    pointer-events: none;
                    opacity: ${(this._msdRevealed || this._isStudioPreview) ? 1 : 0};
                    transition: opacity var(--ha-animation-duration-normal, .25s) ease;
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

        // For builtin/user SVGs: fetch the raw content first so the viewBox can be
        // resolved once here and shared between the wrapper's aspect-ratio and the
        // inner SVG's own viewBox attribute — previously these were resolved
        // independently in two places and could disagree.
        const rawSvgContent = this._fetchRawSvgContent();
        const viewBox = resolveEffectiveViewBox(this._msdConfig?.view_box, rawSvgContent || null);
        const [vbX, vbY, vbW, vbH] = viewBox;
        const aspect = vbW && vbH ? (vbW / vbH) : 2;
        const svgContent = rawSvgContent ? this._wrapSvgContentForRender(rawSvgContent, viewBox) : '';

        lcardsLog.debug('[LCARdSMSDCard] Rendering SVG container:', {
            source,
            viewBox,
            aspect,
            hasSvgContent: !!this._svgContent
        });

        return html`
            <div id="msd-v1-comprehensive-wrapper" style="
                width: 100%;
                height: 100%;
                position: relative;
                aspect-ratio: ${aspect};
                pointer-events: none;
                opacity: ${(this._msdRevealed || this._isStudioPreview) ? 1 : 0};
                transition: opacity var(--ha-animation-duration-normal, .25s) ease;
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
     * Resolve and fetch the raw SVG content for the current base_svg source.
     * Triggers an async load (and a re-render on completion) if not yet cached.
     * Uses AssetManager for asset retrieval.
     * @returns {string} Raw SVG text, or '' if unavailable/still loading.
     * @private
     */
    _fetchRawSvgContent() {
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
        } else if (source.startsWith('media-source://')) {
            // Content ID itself as the key (no filename to reliably derive).
            // Resolving the real URL needs its own async media_source/resolve_media
            // round-trip before anything can be registered — unlike the /local/
            // branch above, which can register synchronously since it already
            // has a fetchable URL. Kick off that resolve+register+fetch chain via
            // loadSvgFromMediaSource() and bail out now; the generic
            // "not yet loaded" fallback below would only log a spurious warning
            // since nothing is registered yet at this exact synchronous point.
            svgKey = source;
            if (!assetManager.getRegistry('svg').has(svgKey)) {
                assetManager.loadSvgFromMediaSource(svgKey).then(loadedContent => {
                    if (loadedContent) {
                        lcardsLog.debug('[LCARdSMSDCard] SVG loaded from media source, triggering re-render:', svgKey);
                        this.requestUpdate();
                    }
                });
                return '';
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

        return svgContent;
    }

    /**
     * Wrap raw SVG content in a #__msd-base-content group (like YAML template did)
     * and apply the given viewBox to the outer wrapper for correct scaling.
     * @param {string} svgContent - Raw SVG text, as returned by _fetchRawSvgContent()
     * @param {number[]} viewBox - Resolved [minX, minY, width, height] to apply
     * @returns {string} Wrapped SVG markup, or the original content on failure
     * @private
     */
    _wrapSvgContentForRender(svgContent, viewBox) {
        try {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = svgContent;
            const svgEl = tempDiv.querySelector('svg');

            if (svgEl) {
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

                // NOTE: transform-attribute normalization for animation targets was
                // tried here (unconditionally, on every element in the SVG) and
                // caused a static-rendering regression (base SVG no longer centered
                // even with zero animations) — reverted. Moved to a per-element,
                // just-in-time migration inside animateElement() (lcards-anim-helpers.js)
                // instead, scoped to only the specific element(s) an animation is
                // about to touch, so the vast majority of the SVG is never modified.

                // Get all child nodes
                const children = Array.from(svgEl.childNodes);

                // Create wrapper group with __ prefix to indicate internal/reserved ID
                // (prevents anchor extraction from treating this as an anchor)
                const wrapperGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                wrapperGroup.setAttribute('id', '__msd-base-content');

                // render_visual: false suppresses the base SVG's own visual paint while it's
                // still parsed for anchors as always (AnchorProcessor reads the raw SVG text,
                // independent of this DOM) — lets a background_animation layer (or nothing)
                // serve as the actual visible background instead of a full SVG blueprint.
                if (this._msdConfig?.base_svg?.render_visual === false) {
                    wrapperGroup.style.display = 'none';
                }

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
            } else if (overlayType === 'shape') {
                this._applyShapeStyleToDOM(/** @type {SVGElement} */ (overlayEl), patch.style);
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
            dasharray: 'stroke-dasharray',
            line_cap: 'stroke-linecap',
            fill: 'fill'
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
     * Apply shape style patch to SVG element. Mirrors _applyLineStyleToDOM exactly
     * (same style-key mapping, same "resolve then materialize var()" pipeline) —
     * the only difference is the child-element selector, since shape's rect/circle
     * kinds render native <rect>/<ellipse> elements, not <path>/<line>/<polyline>.
     * @param {SVGElement} shapeEl - SVG group, path, rect, or ellipse element
     * @param {Object} style - Style properties to apply
     * @private
     */
    _applyShapeStyleToDOM(shapeEl, style) {
        let targetElements = /** @type {SVGElement[]} */ ([shapeEl]);
        if (shapeEl.tagName.toLowerCase() === 'g') {
            const children = shapeEl.querySelectorAll('path, rect, ellipse');
            if (children.length > 0) {
                targetElements = /** @type {SVGElement[]} */ (Array.from(children));
            }
        }

        const styleMapping = {
            color: 'stroke',
            stroke: 'stroke',
            width: 'stroke-width',
            opacity: 'opacity',
            dash_array: 'stroke-dasharray',
            dasharray: 'stroke-dasharray',
            line_cap: 'stroke-linecap',
            fill: 'fill'
        };

        for (const [configKey, value] of Object.entries(style)) {
            const svgAttr = styleMapping[configKey];

            if (svgAttr && value !== null && value !== undefined) {
                const _res = window.lcards?.core?.themeManager?.resolver;
                const afterResolver = (typeof value === 'string' && _res) ? _res.resolve(value, value) : value;
                const resolvedValue = ColorUtils.resolveCssVariable(afterResolver);

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
