/**
 * LCARdS Data Grid Live Preview
 * 
 * Renders a live preview of the data-grid card with current configuration.
 * Updates automatically when config changes (debounced 300ms).
 * 
 * @element lcards-data-grid-live-preview
 * 
 * @property {Object} hass - Home Assistant instance
 * @property {Object} config - Current data-grid card configuration
 * @property {Boolean} showRefreshButton - Show manual refresh button (default: true)
 * 
 * @example
 * <lcards-data-grid-live-preview
 *   .hass=${this.hass}
 *   .config=${this._workingConfig}
 *   .showRefreshButton=${true}>
 * </lcards-data-grid-live-preview>
 */

import { LitElement, html, css } from 'lit';
import { lcardsLog } from '../../utils/lcards-logging.js';
import '../../cards/lcards-data-grid.js';  // Import the card component

export class LCARdSDataGridLivePreview extends LitElement {

    static properties = {
        hass: { type: Object },
        config: { type: Object },
        showRefreshButton: { type: Boolean },
        _renderKey: { type: Number, state: true },
        _debounceTimer: { state: true }
    };

    constructor() {
        super();
        this.hass = null;
        this.config = null;
        this.showRefreshButton = true;
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
                border: 2px solid var(--divider-color, #e0e0e0);
                border-radius: 8px;
                overflow: hidden;
            }

            .preview-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 16px;
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
                overflow: auto;
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            lcards-data-grid {
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
                background: var(--secondary-background-color, #fafafa);
                padding: 8px 12px;
                border-radius: 4px;
                max-width: 100%;
                overflow-x: auto;
            }
        `;
    }

    connectedCallback() {
        super.connectedCallback();
        lcardsLog.debug('[DataGridLivePreview] Component connected');
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        // Clean up debounce timer
        if (this._debounceTimer) {
            clearTimeout(this._debounceTimer);
            this._debounceTimer = null;
        }
        lcardsLog.debug('[DataGridLivePreview] Component disconnected, debounce timer cleaned up');
    }

    updated(changedProps) {
        super.updated(changedProps);

        if (changedProps.has('config') && this.config) {
            // Clear previous debounce timer
            if (this._debounceTimer) {
                clearTimeout(this._debounceTimer);
            }

            // Debounce preview updates (300ms)
            this._debounceTimer = setTimeout(() => {
                lcardsLog.debug('[DataGridLivePreview] Config changed, refreshing preview');
                this._renderKey++;
                this.requestUpdate();
                this._debounceTimer = null;
            }, 300);
        }

        if (changedProps.has('hass') || changedProps.has('_renderKey')) {
            this.requestUpdate();
        }
    }

    /**
     * Add sensible defaults to config for preview
     * @returns {Object|null} Enhanced config or null
     * @private
     */
    _getPreviewConfig() {
        if (!this.config) return null;

        try {
            // Deep clone to avoid modifying original
            const previewConfig = JSON.parse(JSON.stringify(this.config));

            // Add sensible defaults if missing
            if (!previewConfig.grid) {
                previewConfig.grid = {
                    'grid-template-columns': 'repeat(12, 1fr)',
                    'grid-template-rows': 'repeat(8, auto)',
                    'gap': '8px'
                };
            }

            // Ensure data_mode is set
            if (!previewConfig.data_mode) {
                previewConfig.data_mode = 'random';
                previewConfig.format = 'mixed';
            }

            // For random mode, ensure format is set
            if (previewConfig.data_mode === 'random' && !previewConfig.format) {
                previewConfig.format = 'mixed';
            }

            // For template mode, ensure rows exist
            if (previewConfig.data_mode === 'template' && !previewConfig.rows) {
                previewConfig.rows = [
                    ['Sample', 'Preview', 'Data'],
                    ['Row 1', 'Cell 2', 'Cell 3']
                ];
            }

            // For datasource mode, add minimal config if missing
            if (previewConfig.data_mode === 'datasource') {
                if (!previewConfig.layout) {
                    previewConfig.layout = 'timeline';
                }
                if (previewConfig.layout === 'timeline' && !previewConfig.source) {
                    // Use a dummy source for preview - fall back to random mode
                    previewConfig.data_mode = 'random';
                    previewConfig.format = 'digit';
                }
            }

            return previewConfig;
        } catch (error) {
            lcardsLog.error('[DataGridLivePreview] Error cloning config:', error);
            return null;
        }
    }

    /**
     * Handle manual refresh button click
     * @private
     */
    _handleRefresh() {
        lcardsLog.debug('[DataGridLivePreview] Manual refresh triggered');
        this._renderKey++;
        this.requestUpdate();
    }

    /**
     * Render the header with title and refresh button
     * @returns {TemplateResult}
     * @private
     */
    _renderHeader() {
        return html`
            <div class="preview-header">
                <span class="preview-title">
                    <ha-icon icon="mdi:eye" style="--mdc-icon-size: 16px;"></ha-icon>
                    Live Preview
                </span>
                ${this.showRefreshButton ? html`
                    <ha-icon-button
                        icon="mdi:refresh"
                        @click=${this._handleRefresh}
                        title="Refresh preview"
                        aria-label="Refresh preview">
                    </ha-icon-button>
                ` : ''}
            </div>
        `;
    }

    /**
     * Render the preview card in container
     * @returns {TemplateResult}
     * @private
     */
    _renderPreviewCard() {
        const previewConfig = this._getPreviewConfig();
        
        if (!previewConfig) {
            return this._renderEmptyState();
        }

        try {
            return html`
                <div class="preview-card-container" key=${this._renderKey}>
                    <lcards-data-grid
                        .hass=${this.hass}
                        .config=${previewConfig}>
                    </lcards-data-grid>
                </div>
            `;
        } catch (error) {
            lcardsLog.error('[DataGridLivePreview] Error rendering preview card:', error);
            return this._renderErrorState(error);
        }
    }

    /**
     * Render the footer with info message
     * @returns {TemplateResult}
     * @private
     */
    _renderFooter() {
        return html`
            <div class="preview-footer">
                <ha-icon icon="mdi:information-outline" style="--mdc-icon-size: 14px;"></ha-icon>
                <span>Preview updates automatically as you edit</span>
            </div>
        `;
    }

    /**
     * Render empty state when no config/hass
     * @returns {TemplateResult}
     * @private
     */
    _renderEmptyState() {
        return html`
            <div class="preview-empty">
                <ha-icon icon="mdi:eye-off"></ha-icon>
                <p class="empty-message">No preview available</p>
                <p class="empty-helper">Configure your data grid to see a live preview</p>
            </div>
        `;
    }

    /**
     * Render error state when preview fails
     * @param {Error} error - Error that occurred
     * @returns {TemplateResult}
     * @private
     */
    _renderErrorState(error) {
        return html`
            <div class="preview-error">
                <ha-icon icon="mdi:alert-circle"></ha-icon>
                <p class="error-message">Preview Error</p>
                <p class="error-details">${error.message}</p>
            </div>
        `;
    }

    render() {
        if (!this.config || !this.hass) {
            return html`
                <div class="preview-container">
                    ${this._renderEmptyState()}
                </div>
            `;
        }

        return html`
            <div class="preview-container">
                ${this._renderHeader()}
                ${this._renderPreviewCard()}
                ${this._renderFooter()}
            </div>
        `;
    }
}

// Register custom element
customElements.define('lcards-data-grid-live-preview', LCARdSDataGridLivePreview);
