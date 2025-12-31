/**
 * LCARdS Data Grid Configuration Studio
 * 
 * Full-screen immersive editor for data-grid card configuration.
 * Features visual mode selection, grid designer, contextual config panels,
 * unified styling/animation, and live preview.
 * 
 * @element lcards-data-grid-studio-dialog
 * @fires config-changed - When configuration is saved (detail: { config })
 * @fires closed - When dialog is closed
 * 
 * @property {Object} hass - Home Assistant instance
 * @property {Object} config - Initial card configuration
 */

import { LitElement, html, css } from 'lit';
import { lcardsLog } from '../../utils/lcards-logging.js';
import '../components/shared/lcards-dialog.js';
import '../components/shared/lcards-form-section.js';
import '../components/shared/lcards-message.js';
import '../components/editors/lcards-visual-grid-designer.js';
import '../components/editors/lcards-color-section.js';
import '../components/lcards-data-grid-live-preview.js';
import './lcards-template-editor-dialog.js';
import './lcards-datasource-picker-dialog.js';
import './lcards-spreadsheet-editor-dialog.js';

export class LCARdSDataGridStudioDialog extends LitElement {
    static properties = {
        hass: { type: Object },
        config: { type: Object },
        _workingConfig: { type: Object, state: true },
        _previewUpdateKey: { type: Number, state: true },
        _validationErrors: { type: Array, state: true }
    };

    constructor() {
        super();
        this.hass = null;
        this.config = null;
        this._workingConfig = {};
        this._previewUpdateKey = 0;
        this._validationErrors = [];
    }

    connectedCallback() {
        super.connectedCallback();
        // Deep clone initial config
        this._workingConfig = JSON.parse(JSON.stringify(this.config || {}));
        
        // Ensure data_mode is set
        if (!this._workingConfig.data_mode) {
            this._workingConfig.data_mode = 'random';
        }
        
        // Ensure grid defaults
        if (!this._workingConfig.grid) {
            this._workingConfig.grid = {
                rows: 8,
                columns: 12,
                gap: 8
            };
        }
        
        lcardsLog.debug('[DataGridStudio] Opened with config:', this._workingConfig);
    }

    static get styles() {
        return css`
            :host {
                display: block;
            }

            lcards-dialog {
                --mdc-dialog-min-width: 95vw;
                --mdc-dialog-min-height: 90vh;
                --mdc-dialog-max-width: 95vw;
                --mdc-dialog-max-height: 90vh;
            }

            .dialog-content {
                display: grid;
                grid-template-columns: 60% 40%;
                gap: 16px;
                height: calc(90vh - 100px);
                overflow: hidden;
            }

            @media (max-width: 1024px) {
                .dialog-content {
                    grid-template-columns: 1fr;
                    grid-template-rows: auto 1fr;
                }
            }

            /* Left Panel - Configuration */
            .config-panel {
                display: flex;
                flex-direction: column;
                gap: 16px;
                overflow-y: auto;
                padding-right: 8px;
            }

            /* Right Panel - Preview */
            .preview-panel {
                position: sticky;
                top: 0;
                height: fit-content;
                max-height: calc(90vh - 120px);
            }

            @media (max-width: 1024px) {
                .preview-panel {
                    position: relative;
                    max-height: 400px;
                }
            }

            /* Mode Selector */
            .mode-selector {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 12px;
                margin-bottom: 16px;
            }

            @media (max-width: 768px) {
                .mode-selector {
                    grid-template-columns: 1fr;
                }
            }

            .mode-card {
                padding: 24px;
                border: 2px solid var(--divider-color, #e0e0e0);
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
                background: var(--card-background-color, white);
                text-align: center;
            }

            .mode-card:hover {
                background: var(--secondary-background-color, #fafafa);
                border-color: var(--primary-color);
            }

            .mode-card.active {
                border-color: var(--primary-color);
                background: var(--primary-color);
                background: linear-gradient(
                    135deg,
                    rgba(var(--rgb-primary-color), 0.1) 0%,
                    transparent 100%
                );
            }

            .mode-icon {
                font-size: 48px;
                margin-bottom: 12px;
                color: var(--primary-color);
            }

            .mode-card.active .mode-icon {
                color: var(--primary-color);
            }

            .mode-title {
                font-size: 18px;
                font-weight: 600;
                margin-bottom: 8px;
                color: var(--primary-text-color);
            }

            .mode-description {
                font-size: 13px;
                color: var(--secondary-text-color);
                line-height: 1.4;
            }

            /* Config Summary */
            .config-summary {
                padding: 12px;
                background: var(--secondary-background-color, #fafafa);
                border-radius: 4px;
                margin-top: 8px;
                font-size: 13px;
                color: var(--secondary-text-color);
            }

            /* Preset Buttons */
            .preset-buttons {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
                gap: 8px;
            }

            /* Validation Errors */
            .validation-errors {
                padding: 12px;
                background: var(--error-color, #f44336);
                color: white;
                border-radius: 4px;
                margin-bottom: 16px;
            }

            .validation-errors ul {
                margin: 8px 0 0 20px;
                padding: 0;
            }

            /* Dialog Actions */
            .dialog-actions {
                display: flex;
                justify-content: flex-end;
                gap: 8px;
                padding-top: 16px;
            }
        `;
    }

    render() {
        return html`
            <lcards-dialog
                .open=${true}
                .heading=${'Configuration Studio'}
                @closed=${this._handleCancel}>
                
                <div class="dialog-content">
                    <!-- Left Panel: Configuration -->
                    <div class="config-panel">
                        ${this._validationErrors.length > 0 ? html`
                            <div class="validation-errors">
                                <strong>Validation Errors:</strong>
                                <ul>
                                    ${this._validationErrors.map(err => html`<li>${err}</li>`)}
                                </ul>
                            </div>
                        ` : ''}

                        ${this._renderModeSelector()}
                        ${this._renderGridDesigner()}
                        ${this._renderModeSpecificConfig()}
                        ${this._renderStylingSection()}
                        ${this._renderAnimationSection()}
                    </div>

                    <!-- Right Panel: Live Preview -->
                    <div class="preview-panel">
                        ${this._renderLivePreview()}
                    </div>
                </div>

                <div slot="primaryAction">
                    <ha-button @click=${this._handleSave}>
                        <ha-icon icon="mdi:check" slot="icon"></ha-icon>
                        Save
                    </ha-button>
                </div>

                <div slot="secondaryAction">
                    <ha-button @click=${this._handleCancel}>
                        Cancel
                    </ha-button>
                </div>
            </lcards-dialog>
        `;
    }

    _renderModeSelector() {
        const modes = [
            {
                id: 'random',
                icon: 'mdi:dice-multiple',
                title: 'Random Data',
                description: 'Decorative LCARS-style grid with auto-generated data'
            },
            {
                id: 'template',
                icon: 'mdi:table-edit',
                title: 'Template Grid',
                description: 'Manual grid with Home Assistant templates'
            },
            {
                id: 'datasource',
                icon: 'mdi:database',
                title: 'Live Data',
                description: 'Real-time data from sensors or DataSources'
            }
        ];

        return html`
            <lcards-form-section
                header="Data Mode"
                ?expanded=${true}
                ?noCollapse=${true}>
                <div class="mode-selector">
                    ${modes.map(mode => html`
                        <div
                            class="mode-card ${this._workingConfig.data_mode === mode.id ? 'active' : ''}"
                            @click=${() => this._handleModeChange(mode.id)}>
                            <ha-icon class="mode-icon" icon="${mode.icon}"></ha-icon>
                            <div class="mode-title">${mode.title}</div>
                            <div class="mode-description">${mode.description}</div>
                        </div>
                    `)}
                </div>
            </lcards-form-section>
        `;
    }

    _renderGridDesigner() {
        return html`
            <lcards-form-section
                header="Grid Layout"
                description="Configure the grid dimensions and spacing"
                ?expanded=${true}>
                <lcards-visual-grid-designer
                    .rows=${this._workingConfig.grid?.rows || 8}
                    .columns=${this._workingConfig.grid?.columns || 12}
                    .gap=${this._workingConfig.grid?.gap || 8}
                    .mode=${'visual'}
                    .cssGrid=${this._workingConfig.grid || {}}
                    @grid-changed=${this._handleGridChanged}>
                </lcards-visual-grid-designer>
            </lcards-form-section>
        `;
    }

    _renderModeSpecificConfig() {
        const mode = this._workingConfig.data_mode;

        if (mode === 'random') {
            return this._renderRandomModeConfig();
        } else if (mode === 'template') {
            return this._renderTemplateModeConfig();
        } else if (mode === 'datasource') {
            return this._renderDataSourceModeConfig();
        }

        return '';
    }

    _renderRandomModeConfig() {
        return html`
            <lcards-form-section
                header="Random Data Settings"
                ?expanded=${true}>
                <ha-select
                    label="Data Format"
                    .value=${this._workingConfig.format || 'mixed'}
                    @selected=${(e) => this._updateConfig('format', e.target.value)}>
                    <mwc-list-item value="digit">Digit (0042)</mwc-list-item>
                    <mwc-list-item value="float">Float (42.17)</mwc-list-item>
                    <mwc-list-item value="alpha">Alpha (AB)</mwc-list-item>
                    <mwc-list-item value="hex">Hex (A3F1)</mwc-list-item>
                    <mwc-list-item value="mixed">Mixed</mwc-list-item>
                </ha-select>

                <ha-textfield
                    type="number"
                    label="Refresh Interval (ms)"
                    .value=${this._workingConfig.refresh_interval || 0}
                    @input=${(e) => this._updateConfig('refresh_interval', parseInt(e.target.value))}
                    helper-text="Auto-refresh interval (0 = disabled)">
                </ha-textfield>
            </lcards-form-section>
        `;
    }

    _renderTemplateModeConfig() {
        return html`
            <lcards-form-section
                header="Template Configuration"
                ?expanded=${true}>
                <lcards-message
                    type="info"
                    message="Configure rows with Home Assistant templates for dynamic content.">
                </lcards-message>

                <ha-button
                    @click=${this._openTemplateEditorDialog}>
                    <ha-icon icon="mdi:table-edit" slot="icon"></ha-icon>
                    Edit Template Rows
                </ha-button>

                ${this._workingConfig.rows?.length ? html`
                    <div class="config-summary">
                        <span>${this._workingConfig.rows.length} rows configured</span>
                    </div>
                ` : html`
                    <lcards-message
                        type="warning"
                        message="No template rows configured yet.">
                    </lcards-message>
                `}
            </lcards-form-section>
        `;
    }

    _renderDataSourceModeConfig() {
        const layout = this._workingConfig.layout;

        return html`
            <lcards-form-section
                header="DataSource Configuration"
                ?expanded=${true}>
                <ha-select
                    label="Layout Type"
                    .value=${layout || 'timeline'}
                    @selected=${(e) => this._updateConfig('layout', e.target.value)}>
                    <mwc-list-item value="timeline">Timeline (flowing data)</mwc-list-item>
                    <mwc-list-item value="spreadsheet">Spreadsheet (structured grid)</mwc-list-item>
                </ha-select>

                ${layout === 'timeline' ? html`
                    <ha-button
                        @click=${this._openDataSourcePickerDialog}>
                        <ha-icon icon="mdi:database-search" slot="icon"></ha-icon>
                        Select Data Source
                    </ha-button>

                    ${this._workingConfig.source ? html`
                        <div class="config-summary">
                            <span>Source: ${this._workingConfig.source}</span>
                        </div>
                    ` : ''}

                    <ha-textfield
                        type="number"
                        label="History Hours"
                        .value=${this._workingConfig.history_hours || 1}
                        @input=${(e) => this._updateConfig('history_hours', parseInt(e.target.value))}>
                    </ha-textfield>
                ` : html`
                    <ha-button
                        @click=${this._openSpreadsheetEditorDialog}>
                        <ha-icon icon="mdi:table-large" slot="icon"></ha-icon>
                        Configure Spreadsheet
                    </ha-button>

                    ${this._workingConfig.columns?.length ? html`
                        <div class="config-summary">
                            <span>${this._workingConfig.columns.length} columns, ${this._workingConfig.rows?.length || 0} rows</span>
                        </div>
                    ` : ''}
                `}
            </lcards-form-section>
        `;
    }

    _renderStylingSection() {
        return html`
            <lcards-form-section
                header="Style Presets"
                description="Apply predefined style configurations"
                ?expanded=${false}>
                <div class="preset-buttons">
                    <ha-button @click=${() => this._applyStylePreset('classic-lcars')}>
                        Classic LCARS
                    </ha-button>
                    <ha-button @click=${() => this._applyStylePreset('picard')}>
                        Picard Era
                    </ha-button>
                    <ha-button @click=${() => this._applyStylePreset('minimal')}>
                        Minimal
                    </ha-button>
                </div>
            </lcards-form-section>

            <lcards-color-section
                .editor=${this}
                header="Colors"
                description="Text and background colors"
                .colorPaths=${[
                    { path: 'style.color', label: 'Text Color', helper: 'Cell text color' },
                    { path: 'style.background', label: 'Background', helper: 'Cell background' }
                ]}
                ?expanded=${false}
                ?useColorPicker=${true}>
            </lcards-color-section>

            <lcards-form-section
                header="Typography"
                ?expanded=${false}>
                <ha-textfield
                    type="number"
                    label="Font Size"
                    .value=${this._workingConfig.style?.font_size || 18}
                    @input=${(e) => this._updateNestedConfig('style.font_size', parseInt(e.target.value))}>
                </ha-textfield>

                <ha-select
                    label="Text Alignment"
                    .value=${this._workingConfig.style?.align || 'right'}
                    @selected=${(e) => this._updateNestedConfig('style.align', e.target.value)}>
                    <mwc-list-item value="left">Left</mwc-list-item>
                    <mwc-list-item value="center">Center</mwc-list-item>
                    <mwc-list-item value="right">Right</mwc-list-item>
                </ha-select>
            </lcards-form-section>
        `;
    }

    _renderAnimationSection() {
        const animationType = this._workingConfig.animation?.type || 'none';
        const highlightChanges = this._workingConfig.animation?.highlight_changes || false;

        return html`
            <lcards-form-section
                header="Cascade Animation"
                ?expanded=${false}>
                <ha-select
                    label="Animation Type"
                    .value=${animationType}
                    @selected=${(e) => this._updateNestedConfig('animation.type', e.target.value)}>
                    <mwc-list-item value="none">None</mwc-list-item>
                    <mwc-list-item value="cascade">Cascade</mwc-list-item>
                </ha-select>

                ${animationType === 'cascade' ? html`
                    <ha-select
                        label="Pattern"
                        .value=${this._workingConfig.animation?.pattern || 'default'}
                        @selected=${(e) => this._updateNestedConfig('animation.pattern', e.target.value)}>
                        <mwc-list-item value="default">Default</mwc-list-item>
                        <mwc-list-item value="niagara">Niagara (smooth)</mwc-list-item>
                        <mwc-list-item value="fast">Fast</mwc-list-item>
                        <mwc-list-item value="custom">Custom</mwc-list-item>
                    </ha-select>

                    <lcards-color-section
                        .editor=${this}
                        header="Cascade Colors"
                        .colorPaths=${[
                            { path: 'animation.colors.start', label: 'Start Color' },
                            { path: 'animation.colors.text', label: 'Text Color' },
                            { path: 'animation.colors.end', label: 'End Color' }
                        ]}
                        ?expanded=${true}
                        ?useColorPicker=${true}>
                    </lcards-color-section>
                ` : ''}
            </lcards-form-section>

            <lcards-form-section
                header="Change Detection"
                ?expanded=${false}>
                <ha-formfield label="Highlight Changes">
                    <ha-switch
                        .checked=${highlightChanges}
                        @change=${(e) => this._updateNestedConfig('animation.highlight_changes', e.target.checked)}>
                    </ha-switch>
                </ha-formfield>

                ${highlightChanges ? html`
                    <ha-select
                        label="Animation Preset"
                        .value=${this._workingConfig.animation?.change_preset || 'pulse'}
                        @selected=${(e) => this._updateNestedConfig('animation.change_preset', e.target.value)}>
                        <mwc-list-item value="pulse">Pulse</mwc-list-item>
                        <mwc-list-item value="glow">Glow</mwc-list-item>
                        <mwc-list-item value="flash">Flash</mwc-list-item>
                    </ha-select>
                ` : ''}
            </lcards-form-section>
        `;
    }

    _renderLivePreview() {
        return html`
            <lcards-data-grid-live-preview
                .hass=${this.hass}
                .config=${this._workingConfig}
                .showRefreshButton=${true}
                .key=${this._previewUpdateKey}>
            </lcards-data-grid-live-preview>
        `;
    }

    // ========================================
    // Event Handlers
    // ========================================

    _handleModeChange(newMode) {
        lcardsLog.debug('[DataGridStudio] Mode changed to:', newMode);
        this._workingConfig.data_mode = newMode;
        this._triggerPreviewUpdate();
        this.requestUpdate();
    }

    _handleGridChanged(e) {
        lcardsLog.debug('[DataGridStudio] Grid changed:', e.detail);
        
        const { rows, columns, gap, cssGrid } = e.detail;
        
        if (!this._workingConfig.grid) {
            this._workingConfig.grid = {};
        }
        
        this._workingConfig.grid.rows = rows;
        this._workingConfig.grid.columns = columns;
        this._workingConfig.grid.gap = gap;
        
        // Merge any additional CSS grid properties
        if (cssGrid) {
            this._workingConfig.grid = { ...this._workingConfig.grid, ...cssGrid };
        }
        
        this._triggerPreviewUpdate();
        this.requestUpdate();
    }

    // ========================================
    // Dialog Launchers
    // ========================================

    async _openTemplateEditorDialog() {
        lcardsLog.debug('[DataGridStudio] Opening template editor dialog');
        
        const dialog = document.createElement('lcards-template-editor-dialog');
        dialog.hass = this.hass;
        dialog.rows = this._workingConfig.rows || [];

        dialog.addEventListener('rows-changed', (e) => {
            this._workingConfig.rows = e.detail.rows;
            this._triggerPreviewUpdate();
            this.requestUpdate();
        });

        dialog.addEventListener('closed', () => {
            dialog.remove();
        });

        document.body.appendChild(dialog);
    }

    async _openDataSourcePickerDialog() {
        lcardsLog.debug('[DataGridStudio] Opening datasource picker dialog');
        
        const dialog = document.createElement('lcards-datasource-picker-dialog');
        dialog.hass = this.hass;
        dialog.currentSource = this._workingConfig.source || '';
        dialog.open = true;

        dialog.addEventListener('source-selected', (e) => {
            this._workingConfig.source = e.detail.source;
            this._triggerPreviewUpdate();
            this.requestUpdate();
        });

        dialog.addEventListener('closed', () => {
            dialog.remove();
        });

        document.body.appendChild(dialog);
    }

    async _openSpreadsheetEditorDialog() {
        lcardsLog.debug('[DataGridStudio] Opening spreadsheet editor dialog');
        
        const dialog = document.createElement('lcards-spreadsheet-editor-dialog');
        dialog.hass = this.hass;
        dialog.columns = this._workingConfig.columns || [];
        dialog.rows = this._workingConfig.rows || [];

        dialog.addEventListener('config-changed', (e) => {
            this._workingConfig.columns = e.detail.columns;
            this._workingConfig.rows = e.detail.rows;
            if (e.detail.data_sources) {
                this._workingConfig.data_sources = e.detail.data_sources;
            }
            this._triggerPreviewUpdate();
            this.requestUpdate();
        });

        dialog.addEventListener('closed', () => {
            dialog.remove();
        });

        document.body.appendChild(dialog);
    }

    // ========================================
    // Config Update Methods
    // ========================================

    _updateConfig(path, value) {
        lcardsLog.debug('[DataGridStudio] Update config:', path, value);
        this._workingConfig[path] = value;
        this._triggerPreviewUpdate();
        this.requestUpdate();
    }

    _updateNestedConfig(path, value) {
        lcardsLog.debug('[DataGridStudio] Update nested config:', path, value);
        
        const keys = path.split('.');
        let obj = this._workingConfig;
        
        // Navigate to parent object
        for (let i = 0; i < keys.length - 1; i++) {
            if (!obj[keys[i]]) {
                obj[keys[i]] = {};
            }
            obj = obj[keys[i]];
        }
        
        // Set value
        obj[keys[keys.length - 1]] = value;
        
        this._triggerPreviewUpdate();
        this.requestUpdate();
    }

    _triggerPreviewUpdate() {
        this._previewUpdateKey++;
    }

    // ========================================
    // Style Presets
    // ========================================

    _applyStylePreset(presetName) {
        lcardsLog.info('[DataGridStudio] Applying style preset:', presetName);
        
        const presets = {
            'classic-lcars': {
                style: {
                    color: '{theme:colors.lcars.blue}',
                    background: 'transparent',
                    font_size: 18
                },
                animation: {
                    type: 'cascade',
                    pattern: 'default',
                    colors: {
                        start: '{theme:colors.lcars.blue}',
                        text: '{theme:colors.lcars.dark-blue}',
                        end: '{theme:colors.lcars.moonlight}'
                    }
                }
            },
            'picard': {
                style: {
                    color: '{theme:colors.text.primary}',
                    background: '{theme:alpha(colors.grid.cellBackground, 0.05)}',
                    font_size: 16
                },
                animation: {
                    type: 'cascade',
                    pattern: 'niagara',
                    colors: {
                        start: '{theme:colors.lcars.orange}',
                        text: '{theme:colors.lcars.yellow}',
                        end: '{theme:colors.lcars.orange}'
                    }
                }
            },
            'minimal': {
                style: {
                    color: '{theme:colors.text.primary}',
                    background: 'transparent',
                    font_size: 14
                },
                animation: {
                    type: 'none'
                }
            }
        };

        const preset = presets[presetName];
        if (preset) {
            this._workingConfig.style = { ...this._workingConfig.style, ...preset.style };
            this._workingConfig.animation = { ...this._workingConfig.animation, ...preset.animation };
            this._triggerPreviewUpdate();
            this.requestUpdate();
        }
    }

    // ========================================
    // Validation & Save/Cancel
    // ========================================

    _validateConfig() {
        this._validationErrors = [];
        
        // Basic validation
        if (!this._workingConfig.data_mode) {
            this._validationErrors.push('Data mode is required');
        }
        
        if (this._workingConfig.data_mode === 'template' && !this._workingConfig.rows?.length) {
            this._validationErrors.push('Template mode requires at least one row');
        }
        
        if (this._workingConfig.data_mode === 'datasource') {
            if (!this._workingConfig.layout) {
                this._validationErrors.push('DataSource mode requires layout selection');
            }
            if (this._workingConfig.layout === 'timeline' && !this._workingConfig.source) {
                this._validationErrors.push('Timeline layout requires a data source');
            }
            if (this._workingConfig.layout === 'spreadsheet' && !this._workingConfig.columns?.length) {
                this._validationErrors.push('Spreadsheet layout requires at least one column');
            }
        }
        
        return this._validationErrors.length === 0;
    }

    _handleSave() {
        if (!this._validateConfig()) {
            lcardsLog.warn('[DataGridStudio] Validation failed:', this._validationErrors);
            this.requestUpdate(); // Force re-render to show errors
            return;
        }
        
        lcardsLog.info('[DataGridStudio] Saving config:', this._workingConfig);
        
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this._workingConfig },
            bubbles: true,
            composed: true
        }));
        
        this._handleClose();
    }

    _handleCancel() {
        lcardsLog.debug('[DataGridStudio] Cancelled, discarding changes');
        this._handleClose();
    }

    _handleClose() {
        this.dispatchEvent(new CustomEvent('closed', {
            bubbles: true,
            composed: true
        }));
    }

    // ========================================
    // Helper Methods for lcards-color-section
    // ========================================

    // The lcards-color-section component expects these on the editor object
    get config() {
        return this._workingConfig;
    }

    _updateConfigValue(path, value) {
        this._updateNestedConfig(path, value);
    }
}

customElements.define('lcards-data-grid-studio-dialog', LCARdSDataGridStudioDialog);
