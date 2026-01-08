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
     * Handle HASS updates - forward to MSD coordinator
     * @param {Object} newHass - New HASS object
     * @param {Object} oldHass - Old HASS object
     * @protected
     *
     * NOTE: We don't call super._handleHassUpdate() because MSD has its own
     * sophisticated SystemsManager that handles entity monitoring, rule evaluation,
     * and template updates internally. The MSD pipeline manages all HASS distribution
     * to its subsystems (coordinator, renderer, controls) directly.
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
        // Check for preview mode (editor or card picker)
        const configKeys = Object.keys(this.config || {});
        const isCardPicker = configKeys.length === 1 && configKeys[0] === 'type';

        if (this._isPreviewMode || isCardPicker) {
            return this._renderPreviewContent();
        }

        // Check for validation errors
        if (this._configIssues?.errors?.length > 0) {
            return this._renderValidationErrors();
        }

        // Show loading state while pipeline initializes
        if (!this._msdPipeline || !this._msdInitialized) {
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

        // Forward HASS to MSD pipeline but don't trigger card re-renders
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

            // Get mount element
            const mount = this.renderRoot;
            if (!mount) {
                lcardsLog.error('[LCARdSMSDCard] Mount element not found');
                return;
            }

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

            // Mark as initialized
            this._msdInitialized = true;

            lcardsLog.info('[LCARdSMSDCard] ✅ MSD pipeline initialized successfully');

        } catch (error) {
            lcardsLog.error('[LCARdSMSDCard] Pipeline initialization error:', error);
            this._configIssues = {
                errors: [{ message: `Pipeline initialization failed: ${error.message}` }]
            };
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
     * Detect if running in preview mode
     * Override to handle card editor vs dashboard edit mode distinction
     * @private
     */
    _detectPreviewMode() {
        const parentElement = this.parentElement;
        lcardsLog.debug('[LCARdSMSDCard] Preview mode detection debug:', {
            hasParent: !!parentElement,
            parentTag: parentElement?.tagName,
            parentClass: parentElement?.className,
            isConnected: this.isConnected
        });

        if (!parentElement) {
            lcardsLog.debug('[LCARdSMSDCard] No parent element - deferring preview mode detection');
            // If we don't have a parent yet, we can't determine preview mode
            // This will be re-evaluated when the card is actually mounted
            return false;
        }

        // Check for card editor dialog (this is true preview mode)
        const cardEditorDialog = parentElement.closest('hui-dialog-edit-card, hui-card-preview, hui-card-picker');
        if (cardEditorDialog) {
            lcardsLog.debug('[LCARdSMSDCard] In card editor dialog - true preview mode:', {
                dialogTag: cardEditorDialog.tagName
            });
            return true;
        }

        // Check for card picker
        const cardPickerEl = parentElement.closest('hui-card-picker');
        if (cardPickerEl) {
            lcardsLog.debug('[LCARdSMSDCard] In card picker - preview mode');
            return true;
        }

        // If we're in dashboard edit mode but NOT in a dialog, we're on the actual dashboard
        const dashboardEl = parentElement.closest('hui-root, ha-panel-lovelace');
        if (dashboardEl && dashboardEl.editMode) {
            lcardsLog.debug('[LCARdSMSDCard] Dashboard edit mode but not in dialog - normal mode');
            return false;
        }

        lcardsLog.debug('[LCARdSMSDCard] Using parent class preview detection');
        // Fall back to parent detection for other cases
        return super._detectPreviewMode();
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
     * Render preview content for editor and card picker
     * @private
     */
    _renderPreviewContent() {
        // Check for card picker context first
        const configKeys = Object.keys(this.config || {});
        const isCardPicker = configKeys.length === 1 && configKeys[0] === 'type';

        if (isCardPicker) {
            lcardsLog.debug('[LCARdSMSDCard] Rendering card picker SVG placeholder');
            return html`
                <div style="
                    width: 100%;
                    height: 300px;
                    background: linear-gradient(135deg, #001122 0%, #000611 100%);
                    border: 1px solid var(--lcars-cyan, #00ffff);
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    overflow: hidden;
                ">
                    <svg viewBox="0 0 400 200" style="width: 80%; height: 80%; max-width: 320px;">
                        <!-- LCARS-style interface mockup -->
                        <defs>
                            <linearGradient id="lcarsGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" style="stop-color:#00ffff;stop-opacity:0.3" />
                                <stop offset="50%" style="stop-color:#00ffff;stop-opacity:0.8" />
                                <stop offset="100%" style="stop-color:#00ffff;stop-opacity:0.3" />
                            </linearGradient>
                        </defs>

                        <!-- Main panel -->
                        <rect x="20" y="20" width="360" height="160" rx="8" fill="#000611" stroke="var(--lcars-cyan, #00ffff)" stroke-width="1" opacity="0.7"/>

                        <!-- LCARS-style bars -->
                        <rect x="30" y="30" width="80" height="12" rx="6" fill="var(--lcars-orange, #ff9900)" opacity="0.8"/>
                        <rect x="30" y="50" width="120" height="12" rx="6" fill="var(--lcars-cyan, #00ffff)" opacity="0.6"/>
                        <rect x="30" y="70" width="60" height="12" rx="6" fill="var(--lcars-blue, #0099ff)" opacity="0.8"/>

                        <!-- Right side bars -->
                        <rect x="290" y="30" width="80" height="12" rx="6" fill="var(--lcars-red, #ff6600)" opacity="0.6"/>
                        <rect x="270" y="50" width="100" height="12" rx="6" fill="var(--lcars-cyan, #00ffff)" opacity="0.8"/>
                        <rect x="310" y="70" width="60" height="12" rx="6" fill="var(--lcars-orange, #ff9900)" opacity="0.6"/>

                        <!-- Center display area -->
                        <rect x="60" y="100" width="280" height="60" rx="4" fill="none" stroke="var(--lcars-cyan, #00ffff)" stroke-width="1" opacity="0.4"/>

                        <!-- Text -->
                        <text x="200" y="125" text-anchor="middle" fill="var(--lcars-cyan, #00ffff)"
                              font-family="Antonio, monospace" font-size="14" opacity="0.8">
                            LCARdS MSD
                        </text>
                        <text x="200" y="145" text-anchor="middle" fill="var(--lcars-orange, #ff9900)"
                              font-family="Antonio, monospace" font-size="10" opacity="0.6">
                            Master Systems Display
                        </text>
                    </svg>
                </div>
            `;
        }

        // Generate preview content for editor mode
        try {
            const mount = this.getMountElement();
            // Preview content will be generated by the fallback below
        } catch (error) {
            lcardsLog.warn('[LCARdSMSDCard] Failed to prepare preview:', error);
        }

        // Preview content for editor mode
        const hasConfig = this._msdConfig && Object.keys(this._msdConfig).length > 0;
        const baseSvgSource = this._msdConfig?.base_svg?.source || 'Not configured';

        // For editor with actual config, show detailed info
        return html`
            <div style="
                width: 100%;
                height: 400px;
                background: linear-gradient(135deg, #001122 0%, #000611 100%);
                border: 2px solid var(--lcars-cyan, #00ffff);
                border-radius: 8px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                color: var(--lcars-cyan, #00ffff);
                font-family: 'Antonio', monospace;
                position: relative;
                overflow: hidden;
            ">
                <div style="font-size: 24px; font-weight: bold; margin-bottom: 16px; color: var(--lcars-orange, #ff9900);">
                    LCARdS MSD Card
                </div>
                <div style="font-size: 14px; margin-bottom: 8px;">
                    Master Systems Display
                </div>
                ${hasConfig ? html`
                    <div style="font-size: 12px; opacity: 0.7; margin-bottom: 4px;">
                        Base SVG: ${baseSvgSource}
                    </div>
                    <div style="font-size: 12px; opacity: 0.7;">
                        Overlays: ${this._msdConfig?.overlays ? Object.keys(this._msdConfig.overlays).length : 0}
                    </div>
                ` : html`
                    <div style="font-size: 12px; opacity: 0.7; margin-bottom: 8px;">
                        Configuration will appear after setup
                    </div>
                    <div style="font-size: 10px; opacity: 0.5; text-align: center; max-width: 300px;">
                        Add MSD configuration with base_svg, overlays, data_sources, and rules to create your custom LCARS display
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
        // Get viewBox from config (will be extracted by pipeline)
        const viewBox = this._msdConfig?.view_box || [0, 0, 1920, 1200];
        const [vbX, vbY, vbW, vbH] = viewBox;
        const aspect = vbW && vbH ? (vbW / vbH) : 2;
        const source = this._msdConfig?.base_svg?.source;

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
