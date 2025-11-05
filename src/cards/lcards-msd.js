/**
 * LCARdS MSD Card - Native Implementation
 * 
 * Master Systems Display card implementation using native LCARdS architecture.
 * Replaces the button-card-based wrapper with direct LitElement implementation
 * while preserving all existing MSD functionality and template patterns.
 */

import { html, css, unsafeCSS } from 'lit';
import { LCARdSNativeCard } from '../base/LCARdSNativeCard.js';
import { lcardsLog } from '../utils/lcards-logging.js';
import { buildMsdPipeline } from '../msd/index.js';

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
            _renderContent: { type: String, state: true }
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
        this._msdConfig = null;
        this._msdPipeline = null;
        this._svgKey = null;
        this._renderContent = '';
        this._msdInitialized = false;
        this._blockUpdates = false;
    }

    // ============================================================================
    // Configuration and Lifecycle
    // ============================================================================

    /**
     * Set card configuration
     * @protected
     */
    _onConfigSet(config) {
        lcardsLog.trace('[LCARdSMSDCard] Config set:', config);

        // Extract MSD configuration
        this._msdConfig = config.msd;
        
        if (!this._msdConfig) {
            throw new Error('MSD configuration is required');
        }

        // Handle SVG loading
        this._handleSvgLoading(this._msdConfig);

        // Prepare for MSD pipeline initialization
        this._prepareMsdPipeline();
    }

    /**
     * Called when HASS changes
     * @protected
     */
    _onHassChanged(newHass, oldHass) {
        lcardsLog.trace('[LCARdSMSDCard] HASS changed');

        // Update MSD pipeline with new HASS
        if (this._msdPipeline && this._msdPipeline.systemsManager) {
            this._msdPipeline.systemsManager.setHass?.(newHass);
            
            // Update controls renderer immediately
            if (this._msdPipeline.systemsManager.controlsRenderer) {
                this._msdPipeline.systemsManager.controlsRenderer.setHass(newHass);
            }
        }
    }

    /**
     * Called on first update
     * @protected
     */
    _onFirstUpdated(changedProperties) {
        lcardsLog.debug('[LCARdSMSDCard] First updated, initializing MSD pipeline');
        this._initializeMsdPipeline();
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

        // Re-render MSD if config or HASS changed
        if (changedProperties.has('_msdConfig') || changedProperties.has('hass')) {
            this._updateMsdRendering();
        }
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
        if (!this._msdConfig) {
            return html`
                <div class="lcards-msd-loading">
                    No MSD configuration provided
                </div>
            `;
        }

        if (!this._msdInitialized) {
            return html`
                <div class="lcards-msd-loading">
                    Initializing MSD pipeline...
                </div>
            `;
        }

        return html`
            <div class="lcards-msd-container">
                ${this._renderMsdContent()}
            </div>
        `;
    }

    /**
     * Render MSD content
     * @private
     */
    _renderMsdContent() {
        if (!this._renderContent) {
            return html`
                <div class="lcards-msd-loading">
                    Loading MSD display...
                </div>
            `;
        }

        // Render the HTML content from MSD pipeline
        return html`${unsafeCSS(this._renderContent)}`;
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

        if (msdConfig.base_svg.source.startsWith('builtin:')) {
            // Built-in SVG
            svgKey = msdConfig.base_svg.source.replace('builtin:', '');
            this._svgKey = svgKey;
            lcardsLog.debug('[LCARdSMSDCard] Using builtin SVG:', svgKey);
            
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
            }
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
     * Initialize MSD pipeline
     * @private
     */
    async _initializeMsdPipeline() {
        if (this._msdInitialized || !this._msdConfig || !this.hass) {
            return;
        }

        try {
            this._blockUpdates = true;
            lcardsLog.debug('[LCARdSMSDCard] Initializing MSD pipeline');

            // Initialize the MSD pipeline
            if (window.lcards?.debug?.msd?.initMsdPipeline) {
                this._msdPipeline = await window.lcards.debug.msd.initMsdPipeline(
                    this._msdConfig,
                    this.getMountElement(),
                    this.hass
                );

                if (this._msdPipeline) {
                    // Set up pipeline callbacks
                    this._setupPipelineCallbacks();
                    
                    // Initial render
                    await this._updateMsdRendering();
                    
                    this._msdInitialized = true;
                    lcardsLog.debug('[LCARdSMSDCard] MSD pipeline initialized successfully');
                }
            } else {
                lcardsLog.error('[LCARdSMSDCard] MSD pipeline initialization method not available');
            }

        } catch (error) {
            lcardsLog.error('[LCARdSMSDCard] Failed to initialize MSD pipeline:', error);
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
     * Update MSD rendering
     * @private
     */
    async _updateMsdRendering() {
        if (!this._msdPipeline || !this._msdInitialized) {
            return;
        }

        try {
            // Get rendered content from MSD pipeline
            if (this._msdPipeline.systemsManager && this._msdPipeline.systemsManager.render) {
                const renderResult = await this._msdPipeline.systemsManager.render();
                if (renderResult && renderResult.html) {
                    this._renderContent = renderResult.html;
                    this.requestUpdate();
                }
            }
        } catch (error) {
            lcardsLog.error('[LCARdSMSDCard] Failed to update MSD rendering:', error);
        }
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
}

// Register the card
customElements.define('lcards-msd-card', LCARdSMSDCard);