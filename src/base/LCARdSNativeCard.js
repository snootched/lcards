/**
 * LCARdS Native Card Base Class
 *
 * Native LitElement-based card implementation that replaces the custom-button-card dependency.
 * Provides all the infrastructure needed for LCARdS cards while maintaining compatibility
 * with existing template patterns and MSD initialization flows.
 */

import { LitElement, html, css, unsafeCSS } from 'lit';
import { lcardsLog } from '../utils/lcards-logging.js';

/**
 * Base class for all LCARdS native cards
 *
 * Features:
 * - Native LitElement architecture (no button-card dependency)
 * - Home Assistant card interface compliance
 * - Template pattern support (GUID, preview mode, mount resolution)
 * - Integrated action handling via custom-card-helpers
 * - MSD initialization flow compatibility
 * - Error handling and validation
 * - Font loading and resource management
 */
export class LCARdSNativeCard extends LitElement {

    static get properties() {
        return {
            // NOTE: hass is NOT declared here because we have custom setter/getter
            // If you declare a property AND have a custom setter, Lit's reactive system conflicts
            config: { type: Object },
            _isPreviewMode: { type: Boolean, state: true },
            _mountResolved: { type: Boolean, state: true },
            _cardGuid: { type: String, state: true },
            _errorState: { type: Object, state: true }
        };
    }

    static get styles() {
        return css`
            :host {
                display: block;
                position: relative;
            }

            .lcards-card {
                width: 100%;
                height: 100%;
                position: relative;
                font-family: 'Antonio', 'Roboto', sans-serif;
            }

            .lcards-error {
                background: #ff4444;
                color: white;
                padding: 16px;
                border-radius: 8px;
                font-family: monospace;
                white-space: pre-wrap;
            }

            .lcards-loading {
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 64px;
                color: var(--primary-text-color, var(--lcards-moonlight, #d3d3d3));
            }

            /* LCARS font loading */
            @font-face {
                font-family: 'lcards_jeffries';
                src: url('/hacsfiles/lcards/fonts/jeffries.woff2') format('woff2'),
                     url('/hacsfiles/lcards/fonts/jeffries.woff') format('woff');
            }

            @font-face {
                font-family: 'lcards_microgramma';
                src: url('/hacsfiles/lcards/fonts/microgramma.woff2') format('woff2'),
                     url('/hacsfiles/lcards/fonts/microgramma.woff') format('woff');
            }
        `;
    }

    constructor() {
        super();
        this.hass = null;
        this.config = {};
        this._isPreviewMode = false;
        this._mountResolved = false;
        this._cardGuid = this._generateGuid();
        this._errorState = null;

        lcardsLog.debug(`[LCARdSNativeCard] Created card with GUID: ${this._cardGuid}`);
    }

    // ============================================================================
    // Home Assistant Card Interface
    // ============================================================================

    /**
     * Set the card configuration
     * @param {Object} config - Card configuration
     */
    setConfig(config) {
        if (!config) {
            throw new Error('Invalid configuration');
        }

        try {
            // Deep clone config to prevent mutations from affecting HA's copy
            this.config = JSON.parse(JSON.stringify(config));
            this._errorState = null;

            // Detect preview mode
            this._isPreviewMode = this._detectPreviewMode();

            // Validate configuration
            this._validateConfig(config);

            lcardsLog.debug(`[LCARdSNativeCard] Config set for ${this._cardGuid}`, config);

            // Notify subclasses
            this._onConfigSet(config);

        } catch (error) {
            this._errorState = {
                message: `Configuration Error: ${error.message}`,
                stack: error.stack
            };
            lcardsLog.error(`[LCARdSNativeCard] Config error in ${this._cardGuid}:`, error);
        }
    }

    /**
     * Set Home Assistant object
     * @param {Object} hass - Home Assistant object
     */
    set hass(hass) {
        const oldHass = this._hass;
        this._hass = hass;

        // Log every hass update to see if it's even being called
        lcardsLog.trace(`[LCARdSNativeCard] HASS setter called for ${this._cardGuid}`, {
            hassChanged: oldHass !== hass,
            sameObject: oldHass === hass
        });

        if (hass && oldHass !== hass) {
            lcardsLog.debug(`[LCARdSNativeCard] HASS object changed for ${this._cardGuid} - calling _onHassChanged`);

            // Propagate HASS to HelperManager (ensures auto-switch works on any page with cards)
            if (window.lcards?.core?.helperManager) {
                window.lcards.core.helperManager.ingestHass(hass);
            }

            // Determine if this HASS change is relevant to this card
            const shouldUpdate = this._shouldUpdateOnHassChange(hass, oldHass);

            // Always call _onHassChanged (for monitoring, core updates, etc.)
            this._onHassChanged(hass, oldHass);

            // Only trigger re-render if relevant entities changed
            if (shouldUpdate) {
                lcardsLog.trace(`[LCARdSNativeCard] Requesting re-render for ${this._cardGuid} due to relevant entity changes`);
                this.requestUpdate();
            } else {
                lcardsLog.trace(`[LCARdSNativeCard] Skipping re-render for ${this._cardGuid} - no relevant entity changes`);
            }
        } else if (hass && oldHass === hass) {
            // This is normal - HA often mutates the HASS object in place
            lcardsLog.trace(`[LCARdSNativeCard] HASS object mutated in place for ${this._cardGuid}`);
        }
    }

    get hass() {
        return this._hass;
    }

    /**
     * Get card size for layout
     * @returns {number} Card height in rows
     */
    getCardSize() {
        return this._getCardSize();
    }

    /**
     * Get layout options for the card
     * @returns {Object} Layout options
     */
    getLayoutOptions() {
        return this._getLayoutOptions();
    }

    // ============================================================================
    // LitElement Lifecycle
    // ============================================================================

    connectedCallback() {
        super.connectedCallback();

        lcardsLog.debug(`[LCARdSNativeCard] Connected: ${this._cardGuid}`);

        // Load fonts if needed
        this._loadFonts();

        // Resolve mount element
        this._resolveMountElement();

        // Notify subclasses
        this._onConnected();
    }

    disconnectedCallback() {
        super.disconnectedCallback();

        lcardsLog.debug(`[LCARdSNativeCard] Disconnected: ${this._cardGuid}`);

        // Cleanup
        this._cleanup();

        // Notify subclasses
        this._onDisconnected();
    }

    firstUpdated(changedProperties) {
        super.firstUpdated(changedProperties);

        lcardsLog.debug(`[LCARdSNativeCard] First updated: ${this._cardGuid}`);

        // Mark mount as resolved
        this._mountResolved = true;

        // Notify subclasses
        this._onFirstUpdated(changedProperties);
    }

    updated(changedProperties) {
        super.updated(changedProperties);

        if (changedProperties.has('config') || changedProperties.has('hass')) {
            this._onUpdated(changedProperties);
        }
    }

    render() {
        if (this._errorState) {
            return html`
                <div class="lcards-error">
                    <strong>LCARdS Error</strong><br>
                    ${this._errorState.message}
                </div>
            `;
        }

        if (!this._mountResolved) {
            return html`
                <div class="lcards-loading">
                    Loading LCARdS...
                </div>
            `;
        }

        return html`
            <div class="lcards-card">
                ${this._renderCard()}
            </div>
        `;
    }

    // ============================================================================
    // Protected Methods for Subclasses
    // ============================================================================

    /**
     * Determine if the card should re-render based on HASS changes
     * Checks if the card's entity or any tracked entities changed
     * @param {Object} newHass - New HASS object
     * @param {Object} oldHass - Previous HASS object
     * @returns {boolean} True if re-render needed
     * @private
     */
    _shouldUpdateOnHassChange(newHass, oldHass) {
        // First HASS update - always render
        if (!oldHass) {
            return true;
        }

        // Check if card's configured entity changed
        if (this.config?.entity) {
            const oldState = oldHass?.states?.[this.config.entity];
            const newState = newHass?.states?.[this.config.entity];
            if (oldState !== newState) {
                return true;
            }
        }

        // Check if any tracked entities changed (from templates)
        if (this._trackedEntities && this._trackedEntities.length > 0) {
            const hasTrackedChanges = this._trackedEntities.some(entityId => {
                const oldState = oldHass?.states?.[entityId];
                const newState = newHass?.states?.[entityId];
                return oldState !== newState;
            });
            if (hasTrackedChanges) {
                return true;
            }
        }

        // No relevant changes - skip re-render
        return false;
    }

    /**
     * Called when config is set - override in subclasses
     * @protected
     */
    _onConfigSet(config) {
        // Override in subclasses
    }

    /**
     * Called when HASS changes - override in subclasses
     * @protected
     */
    _onHassChanged(newHass, oldHass) {
        // Override in subclasses
    }

    /**
     * Called when connected to DOM - override in subclasses
     * @protected
     */
    _onConnected() {
        // Override in subclasses
    }

    /**
     * Called when disconnected from DOM - override in subclasses
     * @protected
     */
    _onDisconnected() {
        // Override in subclasses
    }

    /**
     * Called on first update - override in subclasses
     * @protected
     */
    _onFirstUpdated(changedProperties) {
        // Override in subclasses
    }

    /**
     * Called on updates - override in subclasses
     * @protected
     */
    _onUpdated(changedProperties) {
        // Override in subclasses
    }

    /**
     * Render the card content - MUST be overridden in subclasses
     * @protected
     */
    _renderCard() {
        return html`<div>Override _renderCard() in subclass</div>`;
    }

    /**
     * Get card size - override in subclasses
     * @protected
     */
    _getCardSize() {
        return 1;
    }

    /**
     * Get layout options - override in subclasses
     * @protected
     */
    _getLayoutOptions() {
        return {};
    }

    /**
     * Validate configuration - override in subclasses
     * @protected
     */
    _validateConfig(config) {
        // Basic validation - override for specific requirements
        if (!config.type) {
            throw new Error('Card type is required');
        }
    }

    // ============================================================================
    // Template Pattern Support
    // ============================================================================

    /**
     * Get card GUID for template compatibility
     */
    getCardGuid() {
        return this._cardGuid;
    }

    /**
     * Check if in preview mode
     */
    isPreviewMode() {
        return this._isPreviewMode;
    }

    /**
     * Check if mount is resolved
     */
    isMountResolved() {
        return this._mountResolved;
    }

    /**
     * Get the mount element (shadowRoot)
     */
    getMountElement() {
        return this.shadowRoot;
    }

    // ============================================================================
    // Private Implementation
    // ============================================================================

    /**
     * Generate unique GUID for card instance
     * @private
     */
    _generateGuid() {
        return 'lcards-' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Detect if running in preview mode
     * @private
     */
    _detectPreviewMode() {
        // Heuristics for preview mode detection
        const parentElement = this.parentElement;
        if (!parentElement) {
            lcardsLog.debug(`[LCARdSNativeCard] Preview detection: no parent element`);
            return false;
        }

        // Check for dashboard edit mode
        const dashboardEl = parentElement.closest('hui-root, ha-panel-lovelace');
        if (dashboardEl && dashboardEl.editMode) {
            lcardsLog.debug(`[LCARdSNativeCard] Preview detection: dashboard edit mode detected`);
            return true;
        }

        // Check for card picker
        const cardPickerEl = parentElement.closest('hui-card-picker, hui-card-preview');
        if (cardPickerEl) {
            lcardsLog.debug(`[LCARdSNativeCard] Preview detection: card picker detected`, {
                cardPickerTag: cardPickerEl.tagName,
                parentTag: parentElement.tagName,
                parentClass: parentElement.className
            });
            return true;
        }

        // Check URL for edit mode
        if (window.location.href.includes('edit=1')) {
            lcardsLog.debug(`[LCARdSNativeCard] Preview detection: URL edit mode detected`);
            return true;
        }

        lcardsLog.debug(`[LCARdSNativeCard] Preview detection: not in preview mode`, {
            parentTag: parentElement.tagName,
            parentClass: parentElement.className,
            url: window.location.href
        });
        return false;
    }

    /**
     * Load LCARS fonts
     * Registers a one-shot 'loadingdone' listener on the browser FontFaceSet so
     * that any card re-renders once all fonts (loaded on-demand via AssetManager)
     * are fully available.  This prevents text being measured / rendered with the
     * fallback font on first paint.
     * @private
     */
    _loadFonts() {
        if (!document.fonts) return;

        // Scan the card's own config for every font-family value that starts with
        // 'lcards_' and load each one.  This covers any custom font the user may have
        // referenced (not just the built-in two), and window.lcards.loadFont() is
        // idempotent so calling it multiple times is safe.
        const fontsToLoad = new Set();
        const _scanForFonts = (obj) => {
            if (!obj || typeof obj !== 'object') return;
            const ff = obj.font_family;
            if (typeof ff === 'string') {
                ff.split(',').forEach(part => {
                    const name = part.trim().replace(/^['"]|['"]$/g, '');
                    if (name.startsWith('lcards_')) fontsToLoad.add(name);
                });
            }
            for (const v of Object.values(obj)) {
                if (v && typeof v === 'object') _scanForFonts(v);
            }
        };
        _scanForFonts(this.config);
        fontsToLoad.forEach(f => window.lcards?.loadFont?.(f));

        // Bind handler with reference so we can remove it in _cleanup()
        this._fontLoadingDoneHandler = () => {
            lcardsLog.debug(`[LCARdSNativeCard] Fonts loaded, triggering re-render: ${this._cardGuid}`);

            // Invalidate text measurement cache so sizes are re-measured with real fonts
            if (window.lcards?._textMeasureCache) {
                window.lcards._textMeasureCache.clear();
            }

            this.requestUpdate();
        };

        document.fonts.addEventListener('loadingdone', this._fontLoadingDoneHandler);

        // Backup: document.fonts.ready resolves when currently-loading fonts finish.
        // Handles the race where loadingdone already fired before our listener registered.
        document.fonts.ready.then(() => {
            if (window.lcards?._textMeasureCache) {
                window.lcards._textMeasureCache.clear();
            }
            this.requestUpdate();
        });

        lcardsLog.trace(`[LCARdSNativeCard] Font loading initialized: ${this._cardGuid}`);
    }

    /**
     * Resolve mount element
     * @private
     */
    _resolveMountElement() {
        // For native LitElement, mount is shadowRoot
        // This ensures compatibility with existing template patterns
        setTimeout(() => {
            this._mountResolved = true;
            this.requestUpdate();
        }, 0);
    }

    /**
     * Cleanup resources
     * @private
     */
    _cleanup() {
        // Remove font loading listener
        if (this._fontLoadingDoneHandler && document.fonts) {
            document.fonts.removeEventListener('loadingdone', this._fontLoadingDoneHandler);
            this._fontLoadingDoneHandler = null;
        }

        // Subclasses can override to add cleanup logic
    }
}
