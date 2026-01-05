/**
 * LCARdS MSD Card - Native Implementation
 *
 * Master Systems Display card implementation using native LCARdS architecture.
 * Replaces the button-card-based wrapper with direct LitElement implementation
 * while preserving all existing MSD functionality and template patterns.
 */

import { html, css } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { LCARdSNativeCard } from '../base/LCARdSNativeCard.js';
import { lcardsLog } from '../utils/lcards-logging.js';
import { initMsdPipeline } from '../msd/index.js';

/**
 * Native MSD Card implementation
 *
 * Key features:
 * - Direct LitElement inheritance (no button-card dependency)
 * - Full MSD pipeline integration
 * - Template pattern compatibility
 * - SVG loading and caching
 * - Controls and overlay rendering
 * - HASS update management
 */
export class LCARdSMSDCard extends LCARdSNativeCard {

    static get properties() {
        return {
            ...super.properties,
            _msdConfig: { type: Object, state: true },
            _msdPipeline: { type: Object, state: true },
            _svgKey: { type: String, state: true },
            _renderContent: { type: String, state: true },
            _msdInstanceGuid: { type: String, state: true },
            _msdInitialized: { type: Boolean, state: true },
            _blockUpdates: { type: Boolean, state: true },
            _viewBox: { type: Array, state: true },
            _anchors: { type: Object, state: true }
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
        // Initialize MSD state
        this._msdConfig = null;
        this._msdPipeline = null;
        this._svgKey = null;
        this._renderContent = '';
        this._msdInstanceGuid = null;
        this._msdInitialized = false;
        this._blockUpdates = false;
        this._viewBox = null;
        this._anchors = null;
        this._anchorsReady = false;
        this._componentReady = false;
        this._initRetryCount = 0;
        this._maxInitRetries = 5; // Reduced to 5 retries (500ms max) to avoid log spam
    }

    // ============================================================================
    // Configuration and Lifecycle
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
            this._onHassChanged(hass, oldHass);

            // DON'T call this.requestUpdate() like the base class does
            // MSD system handles its own updates internally
        }
    }

    get hass() {
        return this._hass;
    }

    /**
     * Set card configuration
     * @protected
     */
    _onConfigSet(config) {
        lcardsLog.trace('[LCARdSMSDCard] Config set:', {
            configType: config.type,
            hasExistingConfig: !!this.config,
            timestamp: new Date().toISOString()
        });

        // Store full config for MSD pipeline (includes rules, data_sources, etc. at root level)
        // Exclude Home Assistant metadata (type, grid_options)
        this._fullConfig = {
            ...config,
            // Remove HA card infrastructure metadata
            type: undefined,
            grid_options: undefined
        };

        // Also extract MSD configuration for backward compatibility
        this._msdConfig = config.msd;

        // Skip MSD processing for card picker context
        const configKeys = Object.keys(config || {});
        const isCardPicker = configKeys.length === 1 && configKeys[0] === 'type' && config.type === 'custom:lcards-msd-card';

        if (isCardPicker) {
            lcardsLog.debug('[LCARdSMSDCard] Card picker context detected in _onConfigSet - skipping MSD initialization');
            return;
        }

        if (!this._msdConfig) {
            throw new Error('MSD configuration is required');
        }

        // Always reinitialize when config changes - simpler and more reliable
        // This ensures clean state whether user cancels or saves edit mode
        lcardsLog.debug('[LCARdSMSDCard] Config changed, reinitializing. Resize detection:', {
          hasWidthVars: !!(config.variables?.card?.width),
          hasHeightVars: !!(config.variables?.card?.height),
          cardWidth: config.variables?.card?.width,
          cardHeight: config.variables?.card?.height,
          isResizeTriggered: !!(config.variables?.card?.width && config.variables?.card?.height)
        });
        this._resetInitializationState();

        // Handle SVG loading
        this._handleSvgLoading(this._msdConfig);

        // Prepare for MSD pipeline initialization
        this._prepareMsdPipeline();
    }

    /**
     * Reset initialization state for fresh start
     * @private
     */
    _resetInitializationState() {
        lcardsLog.debug('[LCARdSMSDCard] Resetting initialization state');
        this._msdInitialized = false;
        this._initRetryCount = 0;

        // Clean up existing pipeline if any
        if (this._msdPipeline) {
            this._msdPipeline = null;
        }

        // If component was previously ready, keep it ready for re-initialization
        // This handles the case where we're resetting after edit mode exit
        if (this._componentReady) {
            lcardsLog.debug('[LCARdSMSDCard] Component was ready, will attempt immediate re-initialization');
            // Use a small delay to ensure DOM has been updated after config change
            setTimeout(() => {
                this._tryInitializePipeline();
            }, 50);
        }
    }

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
     * Called when HASS changes
     * @protected
     */
    _onHassChanged(newHass, oldHass) {
        lcardsLog.trace('[LCARdSMSDCard] HASS changed, forwarding to MSD pipeline');

        // CRITICAL: ALWAYS update SystemsManager with the FRESHEST HASS immediately
        // This ensures _originalHass is never stale (like legacy card)
        if (this._msdPipeline && this._msdPipeline.systemsManager) {
            lcardsLog.info('[LCARdSMSDCard] Immediately updating SystemsManager with fresh HASS');

            // This bypasses the entity change detection delay
            if (this._msdPipeline.systemsManager.controlsRenderer) {
                lcardsLog.info('[LCARdSMSDCard] Immediately forwarding fresh HASS to controls');
                this._msdPipeline.systemsManager.controlsRenderer.setHass(newHass);
            }

            // Forward HASS to the MSD system directly (primary method)
            if (typeof this._msdPipeline.systemsManager.ingestHass === 'function') {
                lcardsLog.info('[LCARdSMSDCard] Forwarding HASS to SystemsManager via ingestHass');
                this._msdPipeline.systemsManager.ingestHass(newHass);
            }

            // Also update via setHass for controls renderer
            this._msdPipeline.systemsManager.setHass?.(newHass);
        }

        lcardsLog.trace('[LCARdSMSDCard] HASS forwarding completed - SystemsManager should now have fresh HASS');
    }

    /**
     * Called on first update
     * @protected
     */
    _onFirstUpdated(changedProperties) {
        lcardsLog.debug('[LCARdSMSDCard] First updated, marking component ready');
        this._componentReady = true;
        this._tryInitializePipeline();
    }

    /**
     * Called on updates
     * @protected
     */
    _onUpdated(changedProperties) {
        // Prevent updates during MSD initialization to avoid render loops
        if (this._blockUpdates) {
            return;
        }

        // Only re-render MSD if config changed (not HASS)
        // HASS changes are handled internally by MSD pipeline
        if (changedProperties.has('_msdConfig')) {
            this._updateMsdRendering();
        }
    }

    /**
     * Try to initialize the pipeline if both component and anchors are ready
     * @private
     */
    _tryInitializePipeline() {
        if (this._componentReady && this._anchorsReady && !this._msdInitialized) {
            lcardsLog.debug('[LCARdSMSDCard] Both component and anchors ready, waiting for DOM render...');

            // Wait for the next frame to ensure DOM is fully rendered
            requestAnimationFrame(() => {
                // Double-check that SVG element exists before initializing pipeline
                const svg = this.shadowRoot?.querySelector('svg');
                if (svg) {
                    lcardsLog.debug('[LCARdSMSDCard] SVG element found, initializing MSD pipeline');
                    this._initRetryCount = 0; // Reset retry count on success
                    this._initializeMsdPipeline();
                } else {
                    this._initRetryCount++;
                    if (this._initRetryCount >= this._maxInitRetries) {
                        lcardsLog.error(`[LCARdSMSDCard] SVG element not found after ${this._maxInitRetries} retries, giving up.`);
                        this._errorState = 'SVG element not found after initialization retries. Try refreshing the page.';
                        return;
                    }
                    lcardsLog.warn(`[LCARdSMSDCard] SVG element not found, retrying in 100ms (attempt ${this._initRetryCount}/${this._maxInitRetries})`);
                    setTimeout(() => this._tryInitializePipeline(), 100);
                }
            });
        } else {
            lcardsLog.debug('[LCARdSMSDCard] Pipeline initialization delayed:', {
                componentReady: this._componentReady,
                anchorsReady: this._anchorsReady,
                msdInitialized: this._msdInitialized
            });
        }
    }

    /**
     * Override LitElement updated to prevent HASS-triggered re-renders
     * @protected
     */
    updated(changedProperties) {
        // Block HASS-triggered updates like legacy card
        if (changedProperties.has('hass') || changedProperties.has('_hass')) {
            const isControlTriggered = this._isControlTriggeredUpdate();

            if (isControlTriggered) {
                lcardsLog.trace('[LCARdSMSDCard] Blocking update for control-triggered HASS change');
                return; // Don't call super.updated() for control-triggered changes
            } else {
                lcardsLog.trace('[LCARdSMSDCard] Allowing update for non-control HASS change');
            }
        }

        // Allow other updates (config, etc.)
        super.updated(changedProperties);
    }

    /**
     * Check if this update was triggered by MSD control actions
     * @private
     */
    _isControlTriggeredUpdate() {
        try {
            // Method 1: Check stack trace for control action patterns
            const stackTrace = new Error().stack;
            if (!stackTrace) return false;

            const controlPatterns = [
                '_handleAction',
                'executeActionViaButtonCardBridge',
                'callService',
                'fireEvent',
                'moreInfo',
                'toggle',
                'navigate'
            ];

            const isStackTriggered = controlPatterns.some(pattern => stackTrace.includes(pattern));

            // Method 2: Check MSD system's entity change analysis (like legacy card)
            if (window.lcards?.debug?.msd?.systemsManager) {
                const lastAnalysis = window.lcards.debug.msd.systemsManager._lastEntityAnalysis;
                if (lastAnalysis && lastAnalysis.isControlTriggered) {
                    const timeSinceAnalysis = Date.now() - lastAnalysis.timestamp;
                    // If analysis was recent (within 100ms), consider this a control-triggered update
                    if (timeSinceAnalysis < 100) {
                        return true;
                    }
                }
            }

            return isStackTriggered;
        } catch (error) {
            lcardsLog.warn('[LCARdSMSDCard] Error checking control trigger:', error);
            return false;
        }
    }

    /**
     * Override requestUpdate to block HASS and action-triggered updates
     * @protected
     */
    requestUpdate(name, oldValue, options) {
        lcardsLog.trace('[LCARdSMSDCard] requestUpdate called:', {
            timestamp: new Date().toISOString(),
            name,
            hasOldValue: oldValue !== undefined,
            cardGuid: this._cardGuid,
            stackTrace: new Error().stack.split('\n').slice(1, 4).map(line => line.trim()).join(' → ')
        });

        // Block ALL HASS-related updates for MSD cards to prevent re-renders
        if (name === 'hass' || name === '_hass') {
            lcardsLog.trace('[LCARdSMSDCard] BLOCKED requestUpdate for HASS change:', name);
            return Promise.resolve(); // Block the MSD card from re-rendering
        }

        // Block _config updates that come from action bridge execution
        if (name === 'config' || name === '_config') {
            const stackTrace = new Error().stack;
            const isActionTriggered = stackTrace.includes('_handleAction') ||
                                    stackTrace.includes('executeActionViaButtonCardBridge');

            if (isActionTriggered) {
                lcardsLog.trace('[LCARdSMSDCard] BLOCKED requestUpdate for action-triggered config change');
                return Promise.resolve(); // Block action-triggered config changes
            }
        }

        lcardsLog.trace('[LCARdSMSDCard] Allowing requestUpdate for:', name);
        return super.requestUpdate(name, oldValue, options);
    }

    /**
     * Called when disconnected
     * @protected
     */
    _onDisconnected() {
        this._cleanupMsdPipeline();
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

        if (!config.msd.version) {
            throw new Error('MSD version is required');
        }

        if (config.msd.version !== 1) {
            throw new Error('Only MSD version 1 is supported');
        }
    }

    // ============================================================================
    // Rendering
    // ============================================================================

    /**
     * Render the card content
     * @protected
     */
    _renderCard() {
        // Check for preview mode first (editor or card picker) - before any config checks
        const mount = this.getMountElement();
        const isPreview = this._isPreviewMode || window.lcards?.debug?.msd?.MsdInstanceManager?.detectPreviewMode?.(mount);

        // Additional check for card picker context based on config
        const configKeys = Object.keys(this.config || {});
        const isCardPicker = configKeys.length === 1 && configKeys[0] === 'type' && this.config.type === 'custom:lcards-msd-card';

        if (isPreview || isCardPicker) {
            lcardsLog.debug('[LCARdSMSDCard] 🔍 Preview mode detected - showing preview content');
            return this._renderPreviewContent();
        }

        if (!this._msdConfig) {
            return html`
                <div class="lcards-msd-loading">
                    No MSD configuration provided
                </div>
            `;
        }

        if (!this._anchorsReady) {
            return html`
                <div class="lcards-msd-loading">
                    Loading SVG and anchors...
                </div>
            `;
        }

        return html`
            ${this._renderSvgContainer()}
        `;
    }

    /**
     * Render preview content for editor and card picker
     * @private
     */
    _renderPreviewContent() {
        // Check for card picker context first - before MsdInstanceManager
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

        // For editor mode, try MsdInstanceManager preview first
        try {
            const mount = this.getMountElement();
            const previewResult = window.lcards?.debug?.msd?.MsdInstanceManager?._createPreviewContent?.(this._msdConfig, mount);

            if (previewResult?.html) {
                return html`${unsafeHTML(previewResult.html)}`;
            }
        } catch (error) {
            lcardsLog.warn('[LCARdSMSDCard] Failed to create preview content:', error);
        }

        // Fallback preview content if MsdInstanceManager method not available
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
        const viewBox = this._viewBox || [0, 0, 1920, 1200];
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
     * @private
     */
    _getSvgContentForRender() {
        const source = this._msdConfig?.base_svg?.source;
        if (!source || source === 'none') {
            return '';
        }

        let svgContent = '';

        if (source.startsWith('builtin:')) {
            const svgKey = source.replace('builtin:', '');
            svgContent = window.lcards?.assets?.svg_templates?.[svgKey] || '';
        } else if (source.startsWith('/local/')) {
            const svgKey = source.split('/').pop().replace('.svg', '');
            svgContent = window.lcards?.getSVGFromCache?.(svgKey) || '';
        }

        if (!svgContent) {
            return '';
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
                svgContent = tempDiv.innerHTML;

                lcardsLog.debug('[LCARdSMSDCard] 🎨 Wrapped base SVG content in #__msd-base-content for filter isolation');
            }
        } catch (error) {
            lcardsLog.warn('[LCARdSMSDCard] Failed to wrap SVG content in base group:', error);
        }

        return svgContent;
    }

    // ============================================================================
    // MSD Pipeline Integration
    // ============================================================================

    /**
     * Handle SVG loading
     * @private
     */
    _handleSvgLoading(msdConfig) {
        if (!msdConfig.base_svg?.source) {
            return;
        }

        lcardsLog.trace('[LCARdSMSDCard] Handling SVG loading:', msdConfig.base_svg.source);

        let svgKey = null;
        let svgUrl = null;

        if (msdConfig.base_svg.source === 'none') {
            // No SVG source - process anchors immediately for overlay-only mode
            lcardsLog.debug('[LCARdSMSDCard] Using "none" source - processing anchors immediately');
            this._processAnchors(msdConfig);
        } else if (msdConfig.base_svg.source.startsWith('builtin:')) {
            // Built-in SVG
            svgKey = msdConfig.base_svg.source.replace('builtin:', '');
            this._svgKey = svgKey;
            lcardsLog.debug('[LCARdSMSDCard] Using builtin SVG:', svgKey);

            // Wait for builtin SVG to be loaded before processing anchors
            this._waitForBuiltinSvg(svgKey, msdConfig);

        } else if (msdConfig.base_svg.source.startsWith('/local/')) {
            // User SVG
            svgKey = msdConfig.base_svg.source.split('/').pop().replace('.svg', '');
            svgUrl = msdConfig.base_svg.source;
            this._svgKey = svgKey;

            // Load user SVG if not cached
            if (window.lcards?.getSVGFromCache && !window.lcards.getSVGFromCache(svgKey)) {
                lcardsLog.debug('[LCARdSMSDCard] Loading user SVG:', svgUrl);

                if (window.lcards?.loadUserSVG) {
                    window.lcards.loadUserSVG(svgKey, svgUrl)
                        .then(() => {
                            lcardsLog.debug('[LCARdSMSDCard] SVG loaded successfully');

                            // Process anchors after SVG loads
                            this._processAnchors(msdConfig);

                            setTimeout(() => {
                                if (!this._blockUpdates) {
                                    this.requestUpdate();
                                }
                            }, 100);
                        })
                        .catch((error) => {
                            lcardsLog.error('[LCARdSMSDCard] Failed to load SVG:', error);
                        });
                }
            } else {
                // SVG already cached, process anchors immediately
                this._processAnchors(msdConfig);
            }
        }
    }

    /**
     * Wait for builtin SVG to be loaded before processing anchors
     * @private
     */
    async _waitForBuiltinSvg(svgKey, msdConfig) {
        const checkSvgLoaded = () => {
            return window.lcards?.assets?.svg_templates?.[svgKey];
        };

        if (checkSvgLoaded()) {
            // SVG already loaded, process immediately
            lcardsLog.debug('[LCARdSMSDCard] Builtin SVG already loaded:', svgKey);
            this._processAnchors(msdConfig);
            return;
        }

        // SVG not loaded yet, wait for it
        lcardsLog.debug('[LCARdSMSDCard] Waiting for builtin SVG to load:', svgKey);

        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max wait

        const waitForSvg = () => {
            attempts++;

            if (checkSvgLoaded()) {
                lcardsLog.debug('[LCARdSMSDCard] Builtin SVG loaded after', attempts * 100, 'ms:', svgKey);
                this._processAnchors(msdConfig);

                // Trigger update after anchors are processed
                setTimeout(() => {
                    if (!this._blockUpdates) {
                        this.requestUpdate();
                    }
                }, 50);
                return;
            }

            if (attempts < maxAttempts) {
                setTimeout(waitForSvg, 100);
            } else {
                lcardsLog.warn('[LCARdSMSDCard] Timeout waiting for builtin SVG:', svgKey);
                // Process anchors anyway with empty content
                this._processAnchors(msdConfig);
            }
        };

        setTimeout(waitForSvg, 100);
    }

    /**
     * Process anchors from SVG and user configuration
     * @private
     */
    _processAnchors(msdConfig) {
        try {
            lcardsLog.debug('[LCARdSMSDCard] Processing anchors for MSD config');

            const source = msdConfig.base_svg?.source;
            let svgContent = null;
            let viewBox = null;

            // Get SVG content and viewBox
            if (source === 'none') {
                // Use explicit view_box from config
                viewBox = msdConfig.view_box;
                svgContent = '';
                lcardsLog.debug('[LCARdSMSDCard] Using explicit viewBox for "none" source:', viewBox);
            } else {
                // Get SVG content from cache
                lcardsLog.debug('[LCARdSMSDCard] Getting SVG content for:', source);
                lcardsLog.debug('[LCARdSMSDCard] getSvgContent available:', !!window.lcards?.getSvgContent);
                lcardsLog.debug('[LCARdSMSDCard] assets available:', !!window.lcards?.assets);
                lcardsLog.debug('[LCARdSMSDCard] svg_templates available:', !!window.lcards?.assets?.svg_templates);

                if (window.lcards?.getSvgContent) {
                    svgContent = window.lcards.getSvgContent(source);
                    lcardsLog.debug('[LCARdSMSDCard] SVG content retrieved:', !!svgContent, svgContent ? svgContent.length + ' chars' : 'null');
                }

                if (svgContent && window.lcards?.getSvgViewBox) {
                    viewBox = window.lcards.getSvgViewBox(svgContent);
                    lcardsLog.debug('[LCARdSMSDCard] Extracted viewBox from SVG:', viewBox);
                }
            }

            if (!viewBox) {
                lcardsLog.warn('[LCARdSMSDCard] No viewBox available, using fallback');
                viewBox = [0, 0, 1920, 1080]; // Default fallback
            }

            // Extract SVG anchors
            lcardsLog.debug('[LCARdSMSDCard] Extracting SVG anchors, source:', source, 'svgContent length:', svgContent?.length);
            lcardsLog.debug('[LCARdSMSDCard] findSvgAnchors available:', !!window.lcards?.findSvgAnchors);

            const svgAnchors = (source === 'none' || !svgContent) ? {} :
                               (window.lcards?.findSvgAnchors?.(svgContent) || {});

            lcardsLog.debug('[LCARdSMSDCard] SVG anchors found:', Object.keys(svgAnchors), svgAnchors);

            // Get user-defined anchors
            const userAnchors = msdConfig.anchors || {};

            // Resolve all anchors
            const resolvedAnchors = {};
            const [minX, minY, vw, vh] = viewBox;

            // Add SVG anchors
            for (const [name, pos] of Object.entries(svgAnchors)) {
                resolvedAnchors[name] = pos;
            }

            // Add user anchors with percentage resolution
            for (const [name, pos] of Object.entries(userAnchors)) {
                if (Array.isArray(pos) && pos.length === 2) {
                    let [x, y] = pos;
                    if (typeof x === 'string' && x.endsWith('%')) {
                        x = minX + (parseFloat(x) / 100) * vw;
                    }
                    if (typeof y === 'string' && y.endsWith('%')) {
                        y = minY + (parseFloat(y) / 100) * vh;
                    }
                    resolvedAnchors[name] = [Number(x), Number(y)];
                } else {
                    resolvedAnchors[name] = pos;
                }
            }

            // Store anchors (like YAML template did)
            this._viewBox = viewBox;
            this._anchors = resolvedAnchors;

            lcardsLog.debug('[LCARdSMSDCard] Anchors processed:', {
                svgAnchorCount: Object.keys(svgAnchors).length,
                userAnchorCount: Object.keys(userAnchors).length,
                totalAnchors: Object.keys(resolvedAnchors).length,
                viewBox,
                anchors: resolvedAnchors
            });

            // Mark anchors as ready and try to initialize pipeline
            this._anchorsReady = true;
            this._tryInitializePipeline();

        } catch (error) {
            lcardsLog.error('[LCARdSMSDCard] Failed to process anchors:', error);
        }
    }

    /**
     * Prepare MSD pipeline
     * @private
     */
    _prepareMsdPipeline() {
        // Store configuration for pipeline initialization
        // This will be used when the element is mounted
        lcardsLog.debug('[LCARdSMSDCard] MSD pipeline prepared for initialization');
    }

    /**
     * Initialize MSD pipeline using MsdInstanceManager
     * @private
     */
    async _initializeMsdPipeline() {
        if (this._msdInitialized || !this._msdConfig || !this.hass) {
            return;
        }

        try {
            this._blockUpdates = true;
            lcardsLog.debug('[LCARdSMSDCard] Initializing MSD pipeline via MsdInstanceManager');

            // Check if MSD system is fully loaded
            if (!window.lcards?.debug?.msd?.MsdInstanceManager) {
                lcardsLog.error('[LCARdSMSDCard] MsdInstanceManager not available');
                this._renderContent = this._createErrorDisplay(
                    'MSD System Not Loaded',
                    'MsdInstanceManager is not available. Check browser console for details.',
                    'This usually means the lcards.js bundle did not load correctly.'
                );
                this.requestUpdate();
                return;
            }

            // Generate instance GUID if not already assigned
            if (!this._msdInstanceGuid) {
                this._msdInstanceGuid = window.lcards.debug.msd.MsdInstanceManager._generateGuid();
                lcardsLog.debug('[LCARdSMSDCard] Generated instance GUID:', this._msdInstanceGuid);
            }

            // Set global card instance reference for debug HUD
            if (window.lcards.debug.msd) {
                window.lcards.debug.msd.cardInstance = this;
            }

            const mount = this.getMountElement();
            const isPreview = window.lcards.debug.msd.MsdInstanceManager.detectPreviewMode(mount);

            lcardsLog.debug('[LCARdSMSDCard] Requesting MSD instance:', {
                guid: this._msdInstanceGuid,
                isPreview,
                hasMount: !!mount,
                hasAnchors: !!this._anchors,
                anchorCount: this._anchors ? Object.keys(this._anchors).length : 0
            });

            // Enhance config with processed anchors (like YAML template did)
            // Merge root-level properties (rules, data_sources) with msd section
            const enhancedConfig = {
                ...this._msdConfig,  // Start with msd section (overlays, base_svg, etc.)
                ...(this._fullConfig.rules ? { rules: this._fullConfig.rules } : {}),  // Add rules from root
                ...(this._fullConfig.data_sources ? { data_sources: this._fullConfig.data_sources } : {}),  // Add data_sources from root
                // Add processed anchors if available
                ...(this._anchors && Object.keys(this._anchors).length > 0 ? { anchors: this._anchors } : {})
            };

            lcardsLog.debug('[LCARdSMSDCard] Enhanced config structure:', {
                hasRules: !!enhancedConfig.rules,
                rulesCount: enhancedConfig.rules?.length || 0,
                hasDataSources: !!enhancedConfig.data_sources,
                hasOverlays: !!enhancedConfig.overlays,
                overlaysCount: enhancedConfig.overlays?.length || 0,
                hasBaseSvg: !!enhancedConfig.base_svg,
                hasAnchors: !!enhancedConfig.anchors,
                anchorCount: enhancedConfig.anchors ? Object.keys(enhancedConfig.anchors).length : 0
            });

            // ADDED: Cache raw overlays for control recovery (replaces YAML template JavaScript processing)
            if (this._msdConfig.overlays && Array.isArray(this._msdConfig.overlays)) {
                window._msdRawOverlays = this._msdConfig.overlays.map(o => JSON.parse(JSON.stringify(o)));
                const controlOverlays = window._msdRawOverlays.filter(o => o.type === 'control');
                lcardsLog.debug('[LCARdSMSDCard] Cached raw overlays for controls recovery:', {
                    totalOverlays: window._msdRawOverlays.length,
                    controlOverlays: controlOverlays.length,
                    controlIds: controlOverlays.map(o => o.id)
                });
            }

            // Use MsdInstanceManager.requestInstance like the YAML template
            const pipelineResult = await window.lcards.debug.msd.MsdInstanceManager.requestInstance(
                enhancedConfig,
                mount,
                this.hass,
                isPreview
            );

            if (pipelineResult.preview) {
                lcardsLog.debug('[LCARdSMSDCard] Preview mode detected - showing preview content');
                this._renderContent = pipelineResult.html;
                this._msdInitialized = true;
                this.requestUpdate();
                return;
            }

            if (!pipelineResult.enabled) {
                if (pipelineResult.blocked) {
                    lcardsLog.warn('[LCARdSMSDCard] MSD instance blocked:', pipelineResult.reason);
                    this._renderContent = pipelineResult.html;
                } else if (pipelineResult.html) {
                    lcardsLog.warn('[LCARdSMSDCard] MSD validation failed');
                    this._renderContent = pipelineResult.html;
                } else {
                    lcardsLog.error('[LCARdSMSDCard] MSD initialization failed');
                    this._renderContent = this._createErrorDisplay(
                        'MSD Initialization Failed',
                        'Pipeline initialization failed without error message.',
                        'Check your MSD configuration and browser console.'
                    );
                }
                this.requestUpdate();
                return;
            }

            // Normal pipeline initialization completed
            this._msdPipeline = pipelineResult;
            lcardsLog.debug('[LCARdSMSDCard] Pipeline initialized successfully via MsdInstanceManager');

            // Set up pipeline callbacks
            this._setupPipelineCallbacks();

            // Set card instance via pipeline API for consistency
            if (this._msdPipeline.setCardInstance && typeof this._msdPipeline.setCardInstance === 'function') {
                this._msdPipeline.setCardInstance(this);
                lcardsLog.debug('[LCARdSMSDCard] Card instance set via pipeline API');
            }

            // ✅ ADDED: Set card GUID in SystemsManager for HUD registration
            if (this._msdPipeline.systemsManager && this._msdInstanceGuid) {
                this._msdPipeline.systemsManager.setCardGuid(this._msdInstanceGuid);
                lcardsLog.debug('[LCARdSMSDCard] Card GUID set in SystemsManager for HUD registration');
            }

            // Initialize HASS state
            if (this._msdPipeline.systemsManager) {
                this._msdPipeline.systemsManager.ingestHass(this.hass);
            }

            // Initial render
            await this._updateMsdRendering();

            this._msdInitialized = true;
            lcardsLog.debug('[LCARdSMSDCard] MSD pipeline initialized successfully');

        } catch (error) {
            lcardsLog.error('[LCARdSMSDCard] Failed to initialize MSD pipeline:', error);
            this._renderContent = this._createErrorDisplay(
                'MSD Pipeline Error',
                error.message || 'Unknown error occurred during initialization.',
                'Check browser console for details.'
            );
            this.requestUpdate();
        } finally {
            this._blockUpdates = false;
            this.requestUpdate();
        }
    }

    /**
     * Set up pipeline callbacks
     * @private
     */
    _setupPipelineCallbacks() {
        if (!this._msdPipeline) return;

        // Set up re-render callback
        if (this._msdPipeline.systemsManager && this._msdPipeline.systemsManager.setReRenderCallback) {
            this._msdPipeline.systemsManager.setReRenderCallback(() => {
                if (!this._blockUpdates) {
                    this._updateMsdRendering();
                }
            });
        }
    }

    /**
     * Update MSD rendering after rule changes
     * Selectively updates affected overlays without full re-render
     * @private
     */
    async _updateMsdRendering() {
        if (!this._msdPipeline || !this._msdInitialized) {
            lcardsLog.debug('[LCARdSMSDCard] Cannot update rendering - pipeline not initialized');
            return;
        }

        try {
            // For rule-based style changes, the SystemsManager has already:
            // 1. Merged patches into overlay.finalStyle
            // 2. Triggered animations if needed
            //
            // For line overlays and other static overlays, we need to update their DOM elements
            // For card overlays, they self-update via Lit reactivity

            if (this._msdPipeline.systemsManager?.renderer) {
                const renderer = this._msdPipeline.systemsManager.renderer;
                const resolvedModel = this._msdPipeline.systemsManager.getResolvedModel();

                if (!resolvedModel) {
                    lcardsLog.warn('[LCARdSMSDCard] No resolved model available for update');
                    return;
                }

                lcardsLog.debug('[LCARdSMSDCard] 🔄 Selectively updating overlays after rule change');

                // Find overlays that need visual updates (lines, shapes, etc - not cards)
                const staticOverlays = resolvedModel.overlays.filter(o =>
                    o.type === 'line' || o.type === 'shape' || o.type === 'text'
                );

                // Update each static overlay's DOM element
                for (const overlay of staticOverlays) {
                    if (overlay.finalStyle) {
                        // Get the overlay container element
                        let element = renderer.overlayElementCache?.get(overlay.id);

                        // Fallback to DOM query if not in cache
                        if (!element || !element.isConnected) {
                            const overlayGroup = this.shadowRoot?.querySelector('#msd-overlay-container');
                            if (overlayGroup) {
                                element = overlayGroup.querySelector(`[data-overlay-id="${overlay.id}"]`);
                            }
                        }

                        if (element) {
                            // For line overlays, we need to update the <path> element inside the <g>
                            let targetElement = element;
                            if (overlay.type === 'line') {
                                const pathElement = element.querySelector('path');
                                if (pathElement) {
                                    targetElement = pathElement;
                                }
                            }

                            // Update stroke/fill attributes directly
                            if (overlay.finalStyle.stroke) {
                                targetElement.setAttribute('stroke', overlay.finalStyle.stroke);
                            }
                            if (overlay.finalStyle.fill) {
                                targetElement.setAttribute('fill', overlay.finalStyle.fill);
                            }
                            if (overlay.finalStyle.color) {
                                // color can be used for both stroke and fill
                                targetElement.setAttribute('stroke', overlay.finalStyle.color);
                            }
                            if (overlay.finalStyle.opacity !== undefined) {
                                targetElement.setAttribute('opacity', overlay.finalStyle.opacity);
                            }
                            if (overlay.finalStyle.stroke_width || overlay.finalStyle.strokeWidth) {
                                targetElement.setAttribute('stroke-width', overlay.finalStyle.stroke_width || overlay.finalStyle.strokeWidth);
                            }

                            lcardsLog.trace(`[LCARdSMSDCard] ✅ Updated ${overlay.type} overlay ${overlay.id} style directly`, {
                                hasElement: !!element,
                                hasPath: overlay.type === 'line' && !!targetElement,
                                updatedAttrs: Object.keys(overlay.finalStyle)
                            });
                        } else {
                            lcardsLog.warn(`[LCARdSMSDCard] ⚠️ Could not find element for overlay ${overlay.id}`);
                        }
                    }
                }

                lcardsLog.debug(`[LCARdSMSDCard] ✅ Selective update complete for ${staticOverlays.length} static overlays`);
            }
        } catch (error) {
            lcardsLog.error('[LCARdSMSDCard] Failed to update MSD rendering:', error);
        }
    }

    /**
     * Create error display HTML
     * @private
     */
    _createErrorDisplay(title, message, suggestion) {
        return `
            <div style="
                color: #ff6666;
                padding: 20px;
                text-align: center;
                border: 2px solid #ff6666;
                border-radius: 8px;
                background: rgba(255, 102, 102, 0.1);
                font-family: monospace;
                margin: 10px;
            ">
                <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">
                    ❌ ${title}
                </div>
                <div style="font-size: 14px; margin-bottom: 8px; color: #ffcccc;">
                    ${message}
                </div>
                <div style="font-size: 12px; opacity: 0.7;">
                    ${suggestion}
                </div>
            </div>
        `;
    }

    /**
     * Cleanup MSD pipeline
     * @private
     */
    _cleanupMsdPipeline() {
        if (this._msdPipeline) {
            try {
                // Cleanup pipeline resources
                if (this._msdPipeline.cleanup) {
                    this._msdPipeline.cleanup();
                }

                this._msdPipeline = null;
                this._msdInitialized = false;

                lcardsLog.debug('[LCARdSMSDCard] MSD pipeline cleaned up');
            } catch (error) {
                lcardsLog.error('[LCARdSMSDCard] Error during MSD pipeline cleanup:', error);
            }
        }
    }

    /**
     * Cleanup on disconnect
     */
    disconnectedCallback() {
        super.disconnectedCallback();

        // Unregister from global HUD
        if (this._msdInstanceGuid && window.lcards?.core?.hudManager) {
            window.lcards.core.hudManager.unregisterCard(this._msdInstanceGuid);
            lcardsLog.debug('[LCARdSMSDCard] Unregistered from global HUD:', this._msdInstanceGuid);
        }

        lcardsLog.debug('[LCARdSMSDCard] Disconnected');
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

        // Register MSD card schema for validation
        // Note: MSD has minimal card-level schema since most validation happens at overlay level
        configManager.registerCardSchema('msd', {
        type: 'object',
        required: ['type'],
        properties: {
            type: {
                type: 'string',
                enum: ['custom:lcards-msd', 'custom:lcards-msd-card', 'custom:cb-lcars-card'],
                description: 'Card type identifier'
            },
            data_sources: {
                type: 'object',
                description: 'Named data source definitions for overlays',
                additionalProperties: {
                    type: 'object',
                    properties: {
                        entity: {
                            type: 'string',
                            format: 'entity',
                            description: 'Entity ID to fetch data from'
                        },
                        windowSeconds: {
                            type: 'number',
                            minimum: 1,
                            description: 'Time window in seconds for historical data'
                        }
                    },
                    required: ['entity']
                }
            },
            base_svg: {
                type: 'string',
                description: 'Path to base SVG file'
            },
            msd: {
                type: 'object',
                description: 'MSD configuration section',
                properties: {
                    overlays: {
                        type: 'array',
                        description: 'Array of overlay configurations (validated separately via CoreValidationService)'
                    },
                    anchors: {
                        type: 'object',
                        description: 'Named anchor points for overlay positioning'
                    },
                    routing: {
                        type: 'object',
                        description: 'Screen routing configuration'
                    },
                    rules: {
                        type: 'array',
                        description: 'Dynamic styling rules'
                    },
                    packs: {
                        type: 'array',
                        description: 'Configuration packs to merge'
                    }
                }
            },
            overlays: {
                type: 'array',
                description: 'Array of overlay configurations (validated separately via CoreValidationService)'
            },
            anchors: {
                type: 'object',
                description: 'Named anchor points for overlay positioning'
            },
            routing: {
                type: 'object',
                description: 'Screen routing configuration'
            },
            rules: {
                type: 'array',
                description: 'Dynamic styling rules'
            },
            packs: {
                type: 'array',
                description: 'Configuration packs to merge'
            },
            debug: {
                type: 'object',
                description: 'Debug configuration'
            }
        }
    });

        lcardsLog.debug('[LCARdSMSDCard] Schema registered with CoreConfigManager');
    }
}