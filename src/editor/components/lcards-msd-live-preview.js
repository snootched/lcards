/**
 * LCARdS MSD Live Preview
 *
 * Renders a live preview of the MSD card with current configuration.
 * Updates automatically when config changes (debounced 300ms).
 * Integrates with MSD debug system for editor-specific visualizations.
 *
 * @element lcards-msd-live-preview
 *
 * @property {Object} hass - Home Assistant instance
 * @property {Object} config - Current MSD card configuration
 * @property {Object} debugSettings - Debug visualization settings
 * @property {Boolean} showRefreshButton - Show manual refresh button (default: true)
 * @property {Object} zoomTransform - Zoom/pan transform from d3-zoom {x, y, k}
 *
 * @example
 * <lcards-msd-live-preview
 *   .hass=${this.hass}
 *   .config=${this._workingConfig}
 *   .debugSettings=${{ anchors: true, bounding_boxes: true }}
 *   .showRefreshButton=${true}
 *   .zoomTransform=${{ x: 0, y: 0, k: 1 }}>
 * </lcards-msd-live-preview>
 */

import { LitElement, html, css } from 'lit';
import { lcardsLog } from '../../utils/lcards-logging.js';
import '../../cards/lcards-msd.js';  // Import the MSD card component

export class LCARdSMSDLivePreview extends LitElement {

    static properties = {
        hass: { type: Object },
        config: { type: Object },
        debugSettings: { type: Object },
        showRefreshButton: { type: Boolean },
        zoomTransform: { type: Object },
        _renderKey: { type: Number, state: true },
        _debounceTimer: { state: true }
    };

    constructor() {
        super();
        this.hass = null;
        this.config = null;
        this.debugSettings = {};
        this.showRefreshButton = true;
        this.zoomTransform = null;
        this._renderKey = 0;
        this._debounceTimer = null;
    }

    static get styles() {
        return css`
            :host {
                display: block;
                height: 100%;
            }

            .preview-container {
                display: flex;
                flex-direction: column;
                height: 100%;
                background: var(--secondary-background-color, #fafafa);
                border-radius: 8px;
                overflow: hidden;
            }

            .preview-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0px 16px;
                background: var(--card-background-color, white);
                border-bottom: 2px solid var(--divider-color, #e0e0e0);
                font-weight: 600;
                font-size: 14px;
            }

            .preview-title {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .preview-card-container {
                flex: 1;
                padding: 16px;
                overflow: visible;  /* Allow zoomed content to extend beyond bounds */
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
                background: var(--primary-background-color, #fafafa);
            }

            .zoom-wrapper {
                width: 100%;
                height: 100%;
                transform-origin: 0 0;
            }

            lcards-msd-card {
                max-width: 100%;
                max-height: 100%;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                border-radius: 4px;
            }

            .preview-footer {
                padding: 8px 16px;
                background: var(--card-background-color, white);
                border-top: 1px solid var(--divider-color, #e0e0e0);
                font-size: 12px;
                color: var(--secondary-text-color, #727272);
                display: flex;
                align-items: center;
                gap: 4px;
            }

            .preview-empty {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 48px 24px;
                color: var(--disabled-text-color, #9e9e9e);
                text-align: center;
                height: 100%;
            }

            .preview-empty ha-icon {
                --mdc-icon-size: 64px;
                margin-bottom: 16px;
            }

            .empty-message {
                font-size: 16px;
                font-weight: 500;
                margin: 0 0 8px 0;
            }

            .empty-helper {
                font-size: 14px;
                margin: 0;
            }

            .preview-error {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 48px 24px;
                color: var(--error-color, #ff0000);
                text-align: center;
                height: 100%;
            }

            .preview-error ha-icon {
                --mdc-icon-size: 64px;
                margin-bottom: 16px;
            }

            .error-message {
                font-size: 16px;
                font-weight: 500;
                margin: 0 0 8px 0;
            }

            .error-details {
                font-size: 14px;
                margin: 0;
                font-family: monospace;
            }
        `;
    }

    /**
     * Lifecycle: First update
     * Initialize preview card
     */
    firstUpdated() {
        super.firstUpdated();
        // Initial preview render
        this._updatePreviewCard();
    }

    /**
     * Lifecycle: Property changed
     * Schedule preview update on config change
     */
    updated(changedProps) {
        super.updated(changedProps);

        if (changedProps.has('config') || changedProps.has('debugSettings') || changedProps.has('hass')) {
            this._schedulePreviewUpdate();
        }
    }

    /**
     * Schedule debounced preview update (300ms)
     * @private
     */
    _schedulePreviewUpdate() {
        if (this._debounceTimer) {
            clearTimeout(this._debounceTimer);
        }

        this._debounceTimer = setTimeout(() => {
            this._renderKey++;
            this._updatePreviewCard();
            this._debounceTimer = null;
            lcardsLog.debug('[MSDLivePreview] Preview updated (debounced)');
        }, 300);
    }

    /**
     * Force immediate preview refresh
     * @private
     */
    _forceRefresh() {
        if (this._debounceTimer) {
            clearTimeout(this._debounceTimer);
            this._debounceTimer = null;
        }
        this._renderKey++;
        this._updatePreviewCard();
        lcardsLog.debug('[MSDLivePreview] Preview refreshed (manual)');
    }

    /**
     * Update preview card (manual DOM manipulation like chart studio)
     * @private
     */
    _updatePreviewCard() {
        const container = this.shadowRoot?.querySelector('.zoom-wrapper');
        if (!container) {
            lcardsLog.warn('[MSDLivePreview] Zoom wrapper not found');
            return;
        }

        // Clear existing preview
        while (container.firstChild) {
            container.firstChild.remove();
        }

        // Check if we have base SVG configured
        if (!this._hasBaseSvg()) {
            // Render empty state directly in container
            container.innerHTML = `
                <div class="preview-empty">
                    <ha-icon icon="mdi:image-off"></ha-icon>
                    <p class="empty-message">No base SVG configured</p>
                    <p class="empty-helper">
                        Configure a base SVG in the "Base SVG" tab to see the preview
                    </p>
                </div>
            `;
            return;
        }

        // Get preview config
        const previewConfig = this._getPreviewConfig();
        if (!previewConfig) {
            lcardsLog.warn('[MSDLivePreview] No valid config for preview');
            return;
        }

        try {
            // Manually create card element
            const card = document.createElement('lcards-msd-card');

            lcardsLog.debug('[MSDLivePreview] Creating preview card with config:', previewConfig);
            lcardsLog.debug('[MSDLivePreview] HASS object available:', !!this.hass);

            // CRITICAL: Set config and hass BEFORE appending
            // This ensures setConfig() is called before hass is set
            card.setConfig(previewConfig);
            if (this.hass) {
                card.hass = this.hass;
            }

            // NOW append to DOM after card is fully configured
            container.appendChild(card);

            lcardsLog.debug('[MSDLivePreview] Preview card configured and appended');
        } catch (error) {
            lcardsLog.error('[MSDLivePreview] Failed to update preview:', error);
            this._renderErrorInContainer(container, error);
        }
    }

    /**
     * Render error state in container
     * @private
     */
    _renderErrorInContainer(container, error) {
        container.innerHTML = `
            <div class="preview-error">
                <ha-icon icon="mdi:alert-circle"></ha-icon>
                <p class="error-message">Preview Error</p>
                <p class="error-details">${error.message}</p>
            </div>
        `;
    }

    /**
     * Get preview config with debug settings merged
     * @returns {Object} MSD card config with debug overlay
     * @private
     */
    _getPreviewConfig() {
        const previewConfig = JSON.parse(JSON.stringify(this.config || {}));

        // Ensure MSD config structure exists
        if (!previewConfig.msd) {
            previewConfig.msd = {};
        }

        // Merge debug settings into MSD config
        if (this.debugSettings && Object.keys(this.debugSettings).length > 0) {
            if (!previewConfig.msd.debug) {
                previewConfig.msd.debug = {};
            }

            // Merge debug settings
            Object.assign(previewConfig.msd.debug, this.debugSettings);
        }

        return previewConfig;
    }

    /**
     * Check if config has base SVG configured
     * @returns {boolean}
     * @private
     */
    _hasBaseSvg() {
        return !!(this.config?.msd?.base_svg);
    }

    /**
     * Render component
     */
    render() {
        // Calculate CSS transform from zoomTransform
        const transformStyle = this.zoomTransform
            ? `translate(${this.zoomTransform.x}px, ${this.zoomTransform.y}px) scale(${this.zoomTransform.k})`
            : 'none';

        return html`
            <div class="preview-container">
                <!-- Preview Card Container (populated by _updatePreviewCard) -->
                <div class="preview-card-container">
                    <!-- Zoom wrapper applies transform. Content dynamically inserted by _updatePreviewCard() -->
                    <div class="zoom-wrapper" style="transform: ${transformStyle}">
                    </div>
                </div>
            </div>
        `;
    }
}

// Register the custom element
customElements.define('lcards-msd-live-preview', LCARdSMSDLivePreview);
