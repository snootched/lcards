/**
 * @fileoverview Data source studio: create or edit a data source, with a live
 * preview of its history and processors beside every tab.
 *
 * Built on the studio shell (studio-dialog-styles.js): tabs on the left, the
 * preview on the right, Cancel / Save in the footer.
 *
 * @element lcards-datasource-studio-dialog
 * @fires save - When the data source is saved (detail: {name, config})
 * @fires cancel - When the dialog is cancelled
 *
 * @property {Object} hass - Home Assistant instance
 * @property {string} mode - 'add' | 'edit'
 * @property {string} sourceName - Existing name (edit mode only)
 * @property {Object} sourceConfig - Existing config (edit mode only)
 * @property {Object} cardConfig - The card's config (to spot name clashes)
 * @property {boolean} open - Dialog open state
 */

import { LitElement, html, css, nothing } from 'lit';
import { lcardsLog } from '../../utils/lcards-logging.js';
import { editorStyles } from '../base/editor-styles.js';
import { studioDialogStyles } from './studio-dialog-styles.js';
import { messageStyles } from '../base/surface-styles.js';
import '../components/shared/lcards-message.js';
import '../components/shared/lcards-form-section.js';
import '../components/datasources/lcards-processor-tree-editor.js';
import '../components/datasources/lcards-processor-preview.js';
import '../components/yaml/lcards-studio-yaml-tab.js';
import { dataSourcesSchema } from '../../cards/schemas/common-schemas.js';
import { historySettings, withHistorySettings, HISTORY_DEFAULT_HOURS } from '../../core/data-sources/history-fetch.js';
import { dataSourceBufferSize } from '../../core/data-sources/DataSource.js';
import { processorChartYaml } from '../../core/data-sources/processor-chart-config.js';
import { copyTextToClipboard } from '../../utils/clipboard-utils.js';

const DOCS = 'https://lcards.unimatrix01.ca/core/datasources/';

const TABS = [
    { id: 'basic', icon: 'mdi:database', label: 'Source' },
    { id: 'timing', icon: 'mdi:history', label: 'History & Timing' },
    { id: 'transform', icon: 'mdi:function-variant', label: 'Processing' },
    { id: 'advanced', icon: 'mdi:cog', label: 'Advanced' },
    { id: 'yaml', icon: 'mdi:code-braces', label: 'YAML' },
];

export class LCARdSDataSourceStudioDialog extends LitElement {
    static get properties() {
        return {
            hass: { type: Object },
            mode: { type: String },        // 'add' | 'edit'
            sourceName: { type: String },
            sourceConfig: { type: Object },
            cardConfig: { type: Object },  // Card config to check existing datasources
            open: { type: Boolean },
            _activeTab: { type: String, state: true },
            _name: { type: String, state: true },
            _workingConfig: { type: Object, state: true },
            _validationErrors: { type: Array, state: true },
            _showErrors: { type: Boolean, state: true },
            _selectedProcessor: { type: String, state: true },
            _preview: { state: true },
            _copied: { type: Boolean, state: true }
        };
    }

    constructor() {
        super();
        this.hass = null;
        this.mode = 'add';
        this.sourceName = '';
        this.sourceConfig = null;
        this.cardConfig = null;
        this.open = false;
        this._activeTab = 'basic';
        this._name = '';
        this._workingConfig = {};
        this._validationErrors = [];
        // Errors show once the user has changed something or tried to save.
        this._showErrors = false;
        this._selectedProcessor = '';
        /** @type {any} The preview's latest runProcessorPreview result */
        this._preview = null;
        this._copied = false;
    }

    static get styles() {
        return [
            editorStyles,
            studioDialogStyles,
            messageStyles,
            css`
                :host {
                    display: block;
                }

                /* Config | preview, as in the chart studio */
                .studio-layout {
                    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
                }

                .validation-errors {
                    display: grid;
                    gap: var(--ha-space-1);
                    padding: var(--ha-space-3) var(--ha-space-4) 0;
                }

                .tab-content lcards-form-section {
                    display: block;
                    margin-bottom: var(--ha-space-4);
                }

                .grid-2col {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: var(--ha-space-3);
                }

                @media (max-width: 600px) {
                    .grid-2col {
                        grid-template-columns: 1fr;
                    }
                }

                ha-selector {
                    display: block;
                    margin-bottom: var(--ha-space-3);
                }

                .tab-hint {
                    margin: 0 0 var(--ha-space-3);
                }

                .tab-hint a,
                .hint a {
                    color: var(--primary-color);
                }

                /* Preview pane */
                .preview-panel {
                    overflow-y: auto;
                    padding: var(--ha-space-4);
                    gap: var(--ha-space-4);
                }

                .chart-yaml summary {
                    cursor: pointer;
                    font-weight: 600;
                    color: var(--primary-text-color);
                }

                .chart-yaml-body {
                    display: grid;
                    gap: var(--ha-space-2);
                    margin-top: var(--ha-space-2);
                }

                .chart-yaml-actions {
                    display: flex;
                    align-items: center;
                    gap: var(--ha-space-2);
                }

                ha-code-editor.chart-yaml-code {
                    display: block;
                    border: var(--ha-border-width-sm) solid var(--divider-color);
                    border-radius: var(--ha-border-radius-md);
                    overflow: hidden;
                    max-height: 320px;
                    overflow-y: auto;
                }
            `
        ];
    }

    willUpdate(changedProps) {
        if (changedProps.has('open') && this.open) {
            this._resetForm();
        }
    }

    render() {
        if (!this.open) return html``;
        const errors = this._showErrors ? this._validationErrors : [];
        return html`
            <ha-dialog
                open
                flexcontent
                @closed=${this._handleDialogClosed}
                header-title=${this.mode === 'add' ? 'Add Data Source' : `Edit Data Source: ${this.sourceName}`}>

                <div class="dialog-content">
                    <div class="studio-layout">
                        <div class="config-panel">
                            <ha-tab-group @wa-tab-show=${this._handleTabChange}>
                                ${TABS.map(tab => html`
                                    <ha-tab-group-tab value=${tab.id} ?active=${this._activeTab === tab.id}>
                                        <ha-icon icon=${tab.icon}></ha-icon>
                                        ${tab.label}
                                    </ha-tab-group-tab>
                                `)}
                            </ha-tab-group>

                            ${errors.length ? html`
                                <div class="validation-errors">
                                    ${errors.map(error => html`<lcards-message type="error" .message=${error}></lcards-message>`)}
                                </div>
                            ` : nothing}

                            <div class="tab-content" @click=${this._handleContentClick}>
                                ${this._renderTab()}
                            </div>
                        </div>

                        <div class="preview-panel">
                            ${this._renderPreview()}
                        </div>
                    </div>
                </div>

                <div slot="footer">
                    <ha-button appearance="plain" @click=${this._handleCancel}>Cancel</ha-button>
                    <ha-button variant="brand" @click=${this._handleSave} .disabled=${!this._isValid()}>
                        <ha-icon icon="mdi:check" slot="start"></ha-icon>
                        ${this.mode === 'add' ? 'Create' : 'Save'}
                    </ha-button>
                </div>
            </ha-dialog>
        `;
    }

    _renderTab() {
        switch (this._activeTab) {
            case 'timing': return this._renderTimingTab();
            case 'transform': return this._renderTransformTab();
            case 'advanced': return this._renderAdvancedTab();
            case 'yaml': return html`
                <lcards-studio-yaml-tab
                    .hass=${this.hass}
                    .config=${this._workingConfig}
                    .schema=${dataSourcesSchema.additionalProperties}
                    cardType="datasource"
                    note="This data source as YAML (its name is on the Source tab)."
                    @yaml-config-changed=${(e) => { this._workingConfig = e.detail.config; this._validate(); }}>
                </lcards-studio-yaml-tab>
            `;
            default: return this._renderBasicTab();
        }
    }

    /** The preview, always beside the tabs, and the chart config it stands for. */
    _renderPreview() {
        const chartYaml = this._preview?.series?.length && !this._preview.errors?.length
            ? processorChartYaml(this._workingConfig, this._preview.series, { name: this._name || undefined, hours: this._preview.hours })
            : '';
        return html`
            <lcards-processor-preview
                .hass=${this.hass}
                .entry=${this._workingConfig}
                .selectedKey=${this._activeTab === 'transform' ? this._selectedProcessor : ''}
                .showErrors=${this._activeTab !== 'transform'}
                @preview-result=${(e) => { e.stopPropagation(); this._preview = e.detail; }}>
            </lcards-processor-preview>

            ${chartYaml ? html`
                <details class="chart-yaml">
                    <summary>Use in a chart</summary>
                    <div class="chart-yaml-body">
                        <div class="hint">An lcards-chart card that plots this data source the way the preview does.</div>
                        <div class="chart-yaml-actions">
                            <ha-button size="small" @click=${() => this._copyChart(chartYaml)}>
                                <ha-icon icon=${this._copied ? 'mdi:check' : 'mdi:content-copy'} slot="start"></ha-icon>
                                ${this._copied ? 'Copied' : 'Copy chart YAML'}
                            </ha-button>
                        </div>
                        <ha-code-editor class="chart-yaml-code" mode="yaml" read-only .value=${chartYaml}></ha-code-editor>
                    </div>
                </details>
            ` : nothing}
        `;
    }

    async _copyChart(text) {
        await copyTextToClipboard(text);
        this._copied = true;
        setTimeout(() => { this._copied = false; }, 1500);
    }

    _renderBasicTab() {
        return html`
            <lcards-form-section header="Source" icon="mdi:database" ?expanded=${true} noCollapse
                description="What to track. The name is how cards and templates refer to it, e.g. {ds:name}.">
                <ha-selector
                    .hass=${this.hass}
                    .selector=${{ text: {} }}
                    .value=${this._name}
                    .label=${'Name'}
                    .helper=${'Lowercase letters, digits and underscores, e.g. living_room_temp'}
                    .disabled=${this.mode === 'edit'}
                    .required=${true}
                    @value-changed=${(e) => {
                        this._name = e.detail.value;
                        this._showErrors = true;
                        this._validate();
                    }}>
                </ha-selector>

                <ha-selector
                    .hass=${this.hass}
                    .selector=${{ entity: {} }}
                    .value=${this._workingConfig.entity || ''}
                    .label=${'Entity'}
                    .required=${true}
                    @value-changed=${(e) => this._updateConfig('entity', e.detail.value)}>
                </ha-selector>

                ${this._workingConfig.entity ? html`
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{ select: { mode: 'dropdown', options: this._getAttributeOptions(this._workingConfig.entity) } }}
                        .value=${this._workingConfig.attribute || '__state__'}
                        .label=${'Attribute'}
                        .helper=${'Track the state, or one of its attributes'}
                        .required=${false}
                        @value-changed=${(e) => this._setAttribute(e.detail.value)}>
                    </ha-selector>
                ` : nothing}
            </lcards-form-section>
        `;
    }

    _renderTimingTab() {
        const history = historySettings(this._workingConfig);
        return html`
            <lcards-form-section header="History" icon="mdi:history" ?expanded=${true} noCollapse
                description="Recent history loaded from Home Assistant when the data source starts, so charts aren't empty.">
                <ha-selector
                    .hass=${this.hass}
                    .selector=${{ boolean: {} }}
                    .value=${history.enabled}
                    .label=${'Preload history'}
                    @value-changed=${(e) => this._setHistory({ enabled: e.detail.value })}>
                </ha-selector>
                ${history.enabled ? html`
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{ number: { min: 1, max: 168, mode: 'box', unit_of_measurement: 'h' } }}
                        .value=${history.hours}
                        .label=${'Hours to load'}
                        .helper=${`1 to 168 (default ${HISTORY_DEFAULT_HOURS}). Every recorded change; hourly statistics fill in when none are recorded.`}
                        @value-changed=${(e) => this._setHistory({ hours: e.detail.value })}>
                    </ha-selector>
                ` : nothing}
            </lcards-form-section>

            <lcards-form-section header="Buffer and updates" icon="mdi:timer-outline" ?expanded=${true} noCollapse
                description="How many points the data source keeps, and how often it updates cards.">
                <div class="grid-2col">
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{ number: { min: 1, max: 3600, mode: 'box', unit_of_measurement: 's' } }}
                        .value=${this._workingConfig.window_seconds || 60}
                        .label=${'Window'}
                        .helper=${`Keeps about 10 points per second of window (now ${dataSourceBufferSize(this._workingConfig).capacity}). Charts and window-based processors see only these.`}
                        @value-changed=${(e) => this._updateConfig('window_seconds', e.detail.value)}>
                    </ha-selector>
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{ number: { min: 10, max: 5000, mode: 'box', unit_of_measurement: 'ms' } }}
                        .value=${this._workingConfig.min_emit_ms || 100}
                        .label=${'Update rate'}
                        .helper=${'Minimum time between card updates'}
                        @value-changed=${(e) => this._updateConfig('min_emit_ms', e.detail.value)}>
                    </ha-selector>
                </div>
            </lcards-form-section>
        `;
    }

    _renderTransformTab() {
        return html`
            <p class="hint tab-hint">
                Smooth, convert or analyse the values. Chain processors by picking another one as a processor's Input.
                <a href="${DOCS}processor-reference.html" target="_blank" rel="noreferrer">Processor reference</a>
            </p>
            <lcards-processor-tree-editor
                .value=${this._workingConfig.processing || {}}
                .hass=${this.hass}
                .previewResult=${this._preview}
                @change=${this._handleProcessingChange}
                @processor-selected=${(e) => { this._selectedProcessor = e.detail.key; }}
                label="Processors">
            </lcards-processor-tree-editor>
        `;
    }

    _renderAdvancedTab() {
        return html`
            <lcards-form-section header="Rate control" icon="mdi:timer-sand" ?expanded=${true} noCollapse
                description="Merge rapid changes into fewer updates. The defaults suit most sensors.">
                <div class="grid-2col">
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{ number: { min: 0, max: 1000, mode: 'box', unit_of_measurement: 'ms' } }}
                        .value=${this._workingConfig.coalesce_ms || 0}
                        .label=${'Coalesce'}
                        .helper=${'Merge changes within this time (0: off)'}
                        @value-changed=${(e) => this._updateConfig('coalesce_ms', e.detail.value)}>
                    </ha-selector>
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{ number: { min: 0, max: 10000, mode: 'box', unit_of_measurement: 'ms' } }}
                        .value=${this._workingConfig.max_delay_ms || 0}
                        .label=${'Max delay'}
                        .helper=${'Longest a merged update may wait (0: no limit)'}
                        @value-changed=${(e) => this._updateConfig('max_delay_ms', e.detail.value)}>
                    </ha-selector>
                </div>
            </lcards-form-section>

            <lcards-form-section header="Behaviour" icon="mdi:cog" ?expanded=${true} noCollapse>
                <ha-selector
                    .hass=${this.hass}
                    .selector=${{ boolean: {} }}
                    .value=${this._workingConfig.emit_on_same_value ?? true}
                    .label=${'Update when the value is unchanged'}
                    @value-changed=${(e) => this._updateConfig('emit_on_same_value', e.detail.value)}>
                </ha-selector>
            </lcards-form-section>
        `;
    }

    /**
     * Handle tab change
     */
    _handleTabChange(event) {
        event.stopPropagation();
        const tab = event.target.activeTab?.getAttribute('value');
        if (tab) {
            this._activeTab = tab;
        }
    }

    /**
     * Handle content clicks to prevent event bubbling
     * CRITICAL: Prevents ha-selector dropdown close events from closing dialog
     */
    _handleContentClick(event) {
        // Stop propagation of 'closed' events from ha-select/ha-selector
        if (event.type === 'closed') {
            event.stopPropagation();
        }
    }

    /**
     * Handle dialog closed event.
     * Always stop propagation so the event doesn't bubble into ancestor editors.
     * Only dispatch 'cancel' when the ha-dialog itself closed (not a child component).
     */
    _handleDialogClosed(event) {
        // Always stop the closed event from bubbling into parent editors/dialogs.
        event.stopPropagation();

        // Only react when ha-dialog itself closed (not a child like ha-select).
        if (event.target.tagName === 'HA-DIALOG') {
            this.open = false;
            this.dispatchEvent(new CustomEvent('cancel', {
                bubbles: true,
                composed: true
            }));
        }
    }

    /**
     * Reset form to initial state
     */
    _resetForm() {
        this._activeTab = 'basic';
        this._name = this.sourceName || '';
        this._validationErrors = [];
        this._showErrors = false;

        // Deep copy sourceConfig or create default
        if (this.sourceConfig) {
            this._workingConfig = JSON.parse(JSON.stringify(this.sourceConfig));
        } else {
            this._workingConfig = {
                entity: '',
                window_seconds: 60,
                min_emit_ms: 100,
                emit_on_same_value: true,
                coalesce_ms: 0,
                max_delay_ms: 0
            };
        }

        lcardsLog.debug('[DataSourceStudio] Form reset:', {
            mode: this.mode,
            name: this._name,
            config: this._workingConfig
        });
    }

    /**
     * Update config value at path
     */
    _updateConfig(path, value) {
        const parts = path.split('.');
        const newConfig = JSON.parse(JSON.stringify(this._workingConfig));

        let target = newConfig;
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!target[part]) target[part] = {};
            target = target[part];
        }

        target[parts[parts.length - 1]] = value;
        this._workingConfig = newConfig;
        this._showErrors = true;
        this._validate();

        lcardsLog.debug('[DataSourceStudio] Config updated:', { path, value });
    }

    /**
     * Set the tracked attribute. "__state__" is only the dropdown's value for
     * "State": the config has no attribute then (the preview and the data source
     * would otherwise look for an attribute by that name).
     */
    _setAttribute(value) {
        /** @type {Record<string, any>} */
        const next = { ...this._workingConfig };
        if (!value || value === '__state__') delete next.attribute;
        else next.attribute = value;
        this._workingConfig = next;
        this._showErrors = true;
        this._validate();
    }

    /** Switch history preload on/off or set its span. */
    _setHistory(change) {
        this._workingConfig = withHistorySettings(this._workingConfig, change);
        this._showErrors = true;
        this._validate();
    }

    /**
     * Handle processing change (unified transformations + aggregations)
     */
    _handleProcessingChange(event) {
        const processing = event.detail.value;
        const newConfig = JSON.parse(JSON.stringify(this._workingConfig));

        if (Object.keys(processing).length === 0) {
            delete newConfig.processing;
        } else {
            newConfig.processing = processing;
        }

        this._workingConfig = newConfig;
    }

    /**
     * Validate form
     */
    _validate() {
        this._validationErrors = this._errors();
        return this._validationErrors.length === 0;
    }

    /** Problems that block saving (no side effects). */
    _errors() {
        const errors = [];

        // Name validation
        if (!this._name || this._name.trim() === '') {
            errors.push('DataSource name is required');
        } else if (!/^[a-z_][a-z0-9_]*$/.test(this._name)) {
            errors.push('Name must start with lowercase letter or underscore, and contain only lowercase letters, numbers, and underscores');
        } else if (this.mode === 'add' && this._isNameAlreadyDefined(this._name)) {
            errors.push(`DataSource "${this._name}" already exists. Choose a different name.`);
        }

        // Entity validation
        if (!this._workingConfig.entity || this._workingConfig.entity.trim() === '') {
            errors.push('Entity is required');
        }

        return errors;
    }

    /**
     * Check if datasource name already exists
     */
    _isNameAlreadyDefined(name) {
        // Check in card config
        if (this.cardConfig?.data_sources && this.cardConfig.data_sources[name]) {
            return true;
        }

        // Check in global DataSource manager
        const dsManager = window.lcards?.core?.dataSourceManager;
        if (dsManager?.sources?.has(name)) {
            return true;
        }

        return false;
    }

    /**
     * Check if form is valid
     */
    _isValid() {
        return this._errors().length === 0;
    }

    /**
     * Handle save button
     */
    _handleSave() {
        this._showErrors = true;
        if (!this._validate()) {
            lcardsLog.warn('[DataSourceStudio] Validation failed:', this._validationErrors);
            return;
        }

        // Clean config
        const cleanConfig = JSON.parse(JSON.stringify(this._workingConfig));

        // Remove attribute if default
        if (!cleanConfig.attribute || cleanConfig.attribute === '__state__') {
            delete cleanConfig.attribute;
        }

        // History in the current form (history.enabled, hours; no preload/days)
        const { history } = withHistorySettings(cleanConfig, {});
        if (history) cleanConfig.history = history;
        else delete cleanConfig.history;

        // Remove zero values
        if (cleanConfig.coalesce_ms === 0) {
            delete cleanConfig.coalesce_ms;
        }
        if (cleanConfig.max_delay_ms === 0) {
            delete cleanConfig.max_delay_ms;
        }

        // Remove empty objects
        // Remove empty processing
        if (cleanConfig.processing && Object.keys(cleanConfig.processing).length === 0) {
            delete cleanConfig.processing;
        }

        lcardsLog.info('[DataSourceStudio] Saving DataSource:', {
            name: this._name,
            config: cleanConfig
        });

        this.dispatchEvent(new CustomEvent('save', {
            detail: {
                name: this._name,
                config: cleanConfig
            },
            bubbles: true,
            composed: true
        }));

        this.open = false;
    }

    /**
     * Handle cancel button
     */
    _handleCancel() {
        this.open = false;
        this.dispatchEvent(new CustomEvent('cancel', {
            bubbles: true,
            composed: true
        }));
    }

    /**
     * Get attribute options for entity (for ha-selector select)
     */
    _getAttributeOptions(entityId) {
        if (!entityId || !this.hass) {
            return [{ value: '__state__', label: 'State' }];
        }

        const entity = this.hass.states[entityId];
        if (!entity) {
            return [{ value: '__state__', label: 'State' }];
        }

        const options = [{ value: '__state__', label: 'State' }];

        if (entity.attributes) {
            Object.keys(entity.attributes).forEach(attr => {
                options.push({
                    value: attr,
                    label: attr.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                });
            });
        }

        return options;
    }
}

if (!customElements.get('lcards-datasource-studio-dialog')) customElements.define('lcards-datasource-studio-dialog', LCARdSDataSourceStudioDialog);
