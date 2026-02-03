/**
 * LCARdS DataSource Studio Dialog
 *
 * Modern tabbed dialog for creating/editing DataSource configurations.
 * Replaces old lcards-datasource-dialog with modern patterns.
 *
 * @element lcards-datasource-studio-dialog
 * @fires save - When datasource is saved (detail: {name, config})
 * @fires cancel - When dialog is cancelled
 *
 * @property {Object} hass - Home Assistant instance
 * @property {string} mode - 'add' | 'edit'
 * @property {string} sourceName - Existing name (edit mode only)
 * @property {Object} sourceConfig - Existing config (edit mode only)
 * @property {boolean} open - Dialog open state
 */

import { LitElement, html, css } from 'lit';
import { fireEvent } from 'custom-card-helpers';
import { lcardsLog } from '../../utils/lcards-logging.js';
import { editorStyles } from '../base/editor-styles.js';
import '../components/shared/lcards-message.js';
import '../components/datasources/lcards-transformation-list-editor.js';
import '../components/datasources/lcards-aggregation-list-editor.js';

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
            _validationErrors: { type: Array, state: true }
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
    }

    static get styles() {
        return [
            editorStyles,
            css`
                :host {
                    display: block;
                }

                ha-dialog {
                    --mdc-dialog-min-width: 700px;
                    --mdc-dialog-max-width: 900px;
                    --mdc-dialog-min-height: 600px;
                    --mdc-dialog-max-height: 80vh;
                }

                ha-dialog::part(dialog) {
                    display: flex;
                    flex-direction: column;
                }

                ha-dialog::part(content) {
                    flex: 1;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }

                .dialog-content {
                    display: flex;
                    flex-direction: column;
                    min-height: 500px;
                    max-height: calc(80vh - 120px);
                    overflow: hidden;
                }

                ha-tab-group {
                    display: block;
                    border-bottom: 1px solid var(--divider-color);
                }

                .tab-content {
                    flex: 1;
                    overflow-y: auto;
                    overflow-x: hidden;
                    padding: 20px;
                    min-height: 0;
                }

                .grid-2col {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                    margin-top: 12px;
                }

                @media (max-width: 600px) {
                    .grid-2col {
                        grid-template-columns: 1fr;
                    }

                    ha-dialog {
                        --mdc-dialog-min-width: 95vw;
                        --mdc-dialog-max-width: 95vw;
                    }
                }

                /* Validation Errors */
                .validation-errors {
                    margin: 0 20px 12px 20px;
                }

                .error-item {
                    padding: 8px 12px;
                    background: var(--error-color);
                    color: white;
                    border-radius: 4px;
                    margin-bottom: 8px;
                    font-size: 13px;
                }

                /* Section spacing */
                .form-section {
                    margin-bottom: 24px;
                }

                .form-section:last-child {
                    margin-bottom: 0;
                }

                .section-header {
                    font-size: 16px;
                    font-weight: 600;
                    margin-bottom: 16px;
                    color: var(--primary-text-color);
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .section-header ha-icon {
                    --mdc-icon-size: 20px;
                    color: var(--primary-color);
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

        return html`
            <ha-dialog
                open
                @closed=${this._handleDialogClosed}
                .heading=${this.mode === 'add' ? 'Add DataSource' : `Edit DataSource: ${this.sourceName}`}>

                <div class="dialog-content">
                    <!-- Validation Errors -->
                    ${this._validationErrors.length > 0 ? html`
                        <div class="validation-errors">
                            ${this._validationErrors.map(error => html`
                                <lcards-message type="error" .message=${error}></lcards-message>
                            `)}
                        </div>
                    ` : ''}

                    <!-- Tab Navigation -->
                    <ha-tab-group @wa-tab-show=${this._handleTabChange}>
                        <ha-tab-group-tab value="basic" ?active=${this._activeTab === 'basic'}>
                            Basic
                        </ha-tab-group-tab>
                        <ha-tab-group-tab value="timing" ?active=${this._activeTab === 'timing'}>
                            Timing & History
                        </ha-tab-group-tab>
                        <ha-tab-group-tab value="transform" ?active=${this._activeTab === 'transform'}>
                            Transform
                        </ha-tab-group-tab>
                        <ha-tab-group-tab value="aggregate" ?active=${this._activeTab === 'aggregate'}>
                            Aggregate
                        </ha-tab-group-tab>
                        <ha-tab-group-tab value="advanced" ?active=${this._activeTab === 'advanced'}>
                            Advanced
                        </ha-tab-group-tab>

                        <!-- Tab Panels -->
                        <ha-tab-panel value="basic" ?hidden=${this._activeTab !== 'basic'}>
                            ${this._activeTab === 'basic' ? this._renderBasicTab() : ''}
                        </ha-tab-panel>
                        <ha-tab-panel value="timing" ?hidden=${this._activeTab !== 'timing'}>
                            ${this._activeTab === 'timing' ? this._renderTimingTab() : ''}
                        </ha-tab-panel>
                        <ha-tab-panel value="transform" ?hidden=${this._activeTab !== 'transform'}>
                            ${this._activeTab === 'transform' ? this._renderTransformTab() : ''}
                        </ha-tab-panel>
                        <ha-tab-panel value="aggregate" ?hidden=${this._activeTab !== 'aggregate'}>
                            ${this._activeTab === 'aggregate' ? this._renderAggregateTab() : ''}
                        </ha-tab-panel>
                        <ha-tab-panel value="advanced" ?hidden=${this._activeTab !== 'advanced'}>
                            ${this._activeTab === 'advanced' ? this._renderAdvancedTab() : ''}
                        </ha-tab-panel>
                    </ha-tab-group>
                </div>

                <!-- Dialog Actions -->
                <ha-button
                    slot="primaryAction"
                    variant="brand"
                    @click=${this._handleSave}
                    .disabled=${!this._isValid()}>
                    <ha-icon icon="mdi:${this.mode === 'add' ? 'plus' : 'check'}" slot="icon"></ha-icon>
                    ${this.mode === 'add' ? 'Create' : 'Save'}
                </ha-button>

                <ha-button
                    slot="secondaryAction"
                    appearance="plain"
                    @click=${this._handleCancel}>
                    Cancel
                </ha-button>
            </ha-dialog>
        `;
    }

    /**
     * Render Basic tab (Name, Entity, Core Settings)
     */
    _renderBasicTab() {
        return html`
            <div class="tab-content" @click=${this._handleContentClick}>
                <div class="form-section">
                    <div class="section-header">
                        <ha-icon icon="mdi:tag"></ha-icon>
                        Identification
                    </div>

                    <!-- Name Field -->
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{ text: { } }}
                        .value=${this._name}
                        .label=${'DataSource Name'}
                        .helper=${'Unique identifier (e.g., temperature, humidity)'}
                        .disabled=${this.mode === 'edit'}
                        .required=${true}
                        @value-changed=${(e) => {
                            this._name = e.detail.value;
                            this._validate();
                        }}>
                    </ha-selector>
                </div>

                <div class="form-section">
                    <div class="section-header">
                        <ha-icon icon="mdi:database"></ha-icon>
                        Data Source
                    </div>

                    <!-- Entity Picker -->
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{ entity: {} }}
                        .value=${this._workingConfig.entity || ''}
                        .label=${'Entity'}
                        .helper=${'Home Assistant entity to track'}
                        .required=${true}
                        @value-changed=${(e) => this._updateConfig('entity', e.detail.value)}>
                    </ha-selector>

                    <!-- Attribute Selector (conditional on entity) -->
                    ${this._workingConfig.entity ? html`
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{
                                select: {
                                    mode: 'dropdown',
                                    options: this._getAttributeOptions(this._workingConfig.entity)
                                }
                            }}
                            .value=${this._workingConfig.attribute || '__state__'}
                            .label=${'Attribute'}
                            .helper=${'Entity attribute to track'}
                            @value-changed=${(e) => this._updateConfig('attribute', e.detail.value)}>
                        </ha-selector>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Render Timing & History tab
     */
    _renderTimingTab() {
        return html`
            <div class="tab-content" @click=${this._handleContentClick}>
                <lcards-message type="info">
                    <strong>Understanding DataSource Timing</strong><br/>
                    DataSources buffer incoming entity updates in memory and emit them to cards.
                    These settings control how much data is kept and how frequently updates are sent.<br/><br/>

                    • <strong>Window</strong>: How many seconds of data to keep in memory (the "rolling buffer").
                      Longer windows support longer chart displays but use more memory.<br/>
                    • <strong>Update Rate</strong>: How often to send data to subscribed cards.
                      Home Assistant sends entity changes as they happen (typically 1-60 seconds for sensors).
                      This throttles updates to prevent overwhelming your browser.<br/>
                    • <strong>History Preload</strong>: Fetches past data from HA's database on startup.
                      Useful for charts that need context immediately.
                </lcards-message>

                <div class="form-section">
                    <div class="section-header">
                        <ha-icon icon="mdi:timer-outline"></ha-icon>
                        Buffer & Update Settings
                    </div>

                    <div class="grid-2col">
                        <!-- Window Seconds -->
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{ number: { min: 1, max: 3600, mode: 'box', unit_of_measurement: 's' } }}
                            .value=${this._workingConfig.window_seconds || 60}
                            .label=${'Data Window'}
                            .helper=${'Memory buffer size. Examples: 60s = 1 minute, 300s = 5 minutes, 3600s = 1 hour'}
                            @value-changed=${(e) => this._updateConfig('window_seconds', e.detail.value)}>
                        </ha-selector>

                        <!-- Min Emit (ms) -->
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{ number: { min: 10, max: 5000, mode: 'box', unit_of_measurement: 'ms' } }}
                            .value=${this._workingConfig.min_emit_ms || 100}
                            .label=${'Update Rate'}
                            .helper=${'Throttle: minimum ms between card updates. Lower = more responsive, higher CPU. Typical: 100-500ms'}
                            @value-changed=${(e) => this._updateConfig('min_emit_ms', e.detail.value)}>
                        </ha-selector>
                    </div>
                </div>

                <div class="form-section">
                    <div class="section-header">
                        <ha-icon icon="mdi:history"></ha-icon>
                        History Preload
                    </div>

                    <!-- Preload Toggle -->
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{ boolean: {} }}
                        .value=${this._workingConfig.history?.preload || false}
                        .label=${'Enable History Preload'}
                        .helper=${'Automatically load historical data when DataSource starts'}
                        @value-changed=${(e) => this._updateConfig('history.preload', e.detail.value)}>
                    </ha-selector>

                    <!-- Hours (conditional) -->
                    ${this._workingConfig.history?.preload ? html`
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{ number: { min: 1, max: 720, mode: 'box', unit_of_measurement: 'h' } }}
                            .value=${this._workingConfig.history?.hours || 24}
                            .label=${'History Duration (hours)'}
                            .helper=${'How many hours of past data to load (24h = 1 day, 168h = 1 week, 720h = 30 days)'}
                            @value-changed=${(e) => this._updateConfig('history.hours', e.detail.value)}>
                        </ha-selector>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Render Transform tab
     */
    _renderTransformTab() {
        return html`
            <div class="tab-content" @click=${this._handleContentClick}>
                <lcards-message type="info">
                    <ha-icon icon="mdi:information" slot="icon"></ha-icon>
                    Transformations process incoming data before it's emitted. Apply filters,
                    moving averages, unit conversions, and more.
                </lcards-message>

                <lcards-transformation-list-editor
                    .transformations=${this._workingConfig.transformations || {}}
                    .hass=${this.hass}
                    @transformations-changed=${this._handleTransformationsChange}>
                </lcards-transformation-list-editor>
            </div>
        `;
    }

    /**
     * Render Aggregate tab
     */
    _renderAggregateTab() {
        return html`
            <div class="tab-content" @click=${this._handleContentClick}>
                <lcards-message type="info">
                    <ha-icon icon="mdi:information" slot="icon"></ha-icon>
                    Aggregations compute derived values (min, max, average, sum) from the data buffer.
                    Useful for statistics and summary metrics.
                </lcards-message>

                <div class="form-section">
                    <lcards-aggregation-list-editor
                        .aggregations=${this._workingConfig.aggregations || {}}
                        .hass=${this.hass}
                        @aggregations-changed=${this._handleAggregationsChange}>
                    </lcards-aggregation-list-editor>
                </div>
            </div>
        `;
    }

    /**
     * Render Advanced tab
     */
    _renderAdvancedTab() {
        return html`
            <div class="tab-content" @click=${this._handleContentClick}>
                <lcards-message type="info">
                    <strong>Rate Control - Advanced Throttling</strong><br/>
                    These settings provide fine-grained control over update batching and timing.<br/><br/>

                    • <strong>Coalesce</strong>: Groups rapid updates into batches to reduce CPU load.
                      When Home Assistant sends many quick updates (e.g., rapidly changing sensor),
                      coalescing waits and sends only the latest value instead of every single change.<br/><br/>

                    • <strong>Max Delay</strong>: Sets a time limit on coalescing to ensure freshness.
                      Even if coalescing, the DataSource will force an update after this delay
                      so data doesn't get "stuck" waiting.<br/><br/>

                    <em>Most users don't need to adjust these - the defaults work well.
                    Use if you have very high-frequency sensors (updating &lt;100ms) or need to tune performance.</em>
                </lcards-message>

                <div class="form-section">
                    <div class="section-header">
                        <ha-icon icon="mdi:timer-sand"></ha-icon>
                        Rate Control
                    </div>

                    <div class="grid-2col">
                        <!-- Coalesce -->
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{ number: { min: 0, max: 1000, mode: 'box', unit_of_measurement: 'ms' } }}
                            .value=${this._workingConfig.coalesce_ms || 0}
                            .label=${'Coalesce (ms)'}
                            .helper=${'Combine multiple updates within this time into one. Reduces CPU for rapidly changing entities. 0 = disabled'}
                            @value-changed=${(e) => this._updateConfig('coalesce_ms', e.detail.value)}>
                        </ha-selector>

                        <!-- Max Delay -->
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{ number: { min: 0, max: 10000, mode: 'box', unit_of_measurement: 'ms' } }}
                            .value=${this._workingConfig.max_delay_ms || 0}
                            .label=${'Max Delay (ms)'}
                            .helper=${'Force update after this delay even if coalescing. Ensures data freshness. 0 = no limit'}
                            @value-changed=${(e) => this._updateConfig('max_delay_ms', e.detail.value)}>
                        </ha-selector>
                    </div>
                </div>

                <div class="form-section">
                    <div class="section-header">
                        <ha-icon icon="mdi:cog"></ha-icon>
                        Behavior
                    </div>

                    <!-- Emit on Same Value -->
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{ boolean: {} }}
                        .value=${this._workingConfig.emit_on_same_value ?? true}
                        .label=${'Emit on Same Value'}
                        .helper=${'Emit updates even when value unchanged'}
                        @value-changed=${(e) => this._updateConfig('emit_on_same_value', e.detail.value)}>
                    </ha-selector>
                </div>
            </div>
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
     * Handle dialog closed event
     * Only respond to actual dialog closure, not child component events
     */
    _handleDialogClosed(event) {
        // Check if this is from the ha-dialog itself, not a child component
        if (event.target.tagName === 'HA-DIALOG') {
            this.open = false;
            this.dispatchEvent(new CustomEvent('cancel', {
                bubbles: true,
                composed: true
            }));
        } else {
            // From child component (like ha-select) - stop it
            event.stopPropagation();
        }
    }

    /**
     * Reset form to initial state
     */
    _resetForm() {
        this._activeTab = 'basic';
        this._name = this.sourceName || '';
        this._validationErrors = [];

        // Deep copy sourceConfig or create default
        if (this.sourceConfig) {
            this._workingConfig = JSON.parse(JSON.stringify(this.sourceConfig));
        } else {
            this._workingConfig = {
                entity: '',
                attribute: '__state__',
                window_seconds: 60,
                min_emit_ms: 100,
                emit_on_same_value: true,
                coalesce_ms: 0,
                max_delay_ms: 0,
                history: {
                    preload: false,
                    hours: 24
                }
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
        this._validate();

        lcardsLog.debug('[DataSourceStudio] Config updated:', { path, value });
    }

    /**
     * Handle transformations change
     */
    _handleTransformationsChange(event) {
        const transformations = event.detail.value;
        const newConfig = JSON.parse(JSON.stringify(this._workingConfig));

        if (Object.keys(transformations).length === 0) {
            delete newConfig.transformations;
        } else {
            newConfig.transformations = transformations;
        }

        this._workingConfig = newConfig;
    }

    /**
     * Handle aggregations change
     */
    _handleAggregationsChange(event) {
        const aggregations = event.detail.value;
        const newConfig = JSON.parse(JSON.stringify(this._workingConfig));

        if (Object.keys(aggregations).length === 0) {
            delete newConfig.aggregations;
        } else {
            newConfig.aggregations = aggregations;
        }

        this._workingConfig = newConfig;
    }

    /**
     * Validate form
     */
    _validate() {
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

        this._validationErrors = errors;
        return errors.length === 0;
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
        return this._validate();
    }

    /**
     * Handle save button
     */
    _handleSave() {
        if (!this._isValid()) {
            lcardsLog.warn('[DataSourceStudio] Validation failed:', this._validationErrors);
            return;
        }

        // Clean config
        const cleanConfig = JSON.parse(JSON.stringify(this._workingConfig));

        // Remove attribute if default
        if (!cleanConfig.attribute || cleanConfig.attribute === '__state__') {
            delete cleanConfig.attribute;
        }

        // Remove history if not enabled, and clean up days field (deprecated)
        if (!cleanConfig.history?.preload) {
            delete cleanConfig.history;
        } else if (cleanConfig.history) {
            // Remove days field - we only use hours now
            delete cleanConfig.history.days;
        }

        // Remove zero values
        if (cleanConfig.coalesce_ms === 0) {
            delete cleanConfig.coalesce_ms;
        }
        if (cleanConfig.max_delay_ms === 0) {
            delete cleanConfig.max_delay_ms;
        }

        // Remove empty objects
        if (cleanConfig.transformations && Object.keys(cleanConfig.transformations).length === 0) {
            delete cleanConfig.transformations;
        }
        if (cleanConfig.aggregations && Object.keys(cleanConfig.aggregations).length === 0) {
            delete cleanConfig.aggregations;
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

customElements.define('lcards-datasource-studio-dialog', LCARdSDataSourceStudioDialog);
