/**
 * LCARdS Data Grid Editor
 *
 * Visual configuration editor for data grid cards with 1-tab structure.
 * Supports 3 data modes: random (decorative), template (manual), datasource (real-time).
 * All configuration is done through the Configuration Studio (full-screen visual editor).
 *
 * @extends {LCARdSBaseEditor}
 */

import { html } from 'lit';
import { lcardsLog } from '../../utils/lcards-logging.js';
import { LCARdSBaseEditor } from '../base/LCARdSBaseEditor.js';
import { fireEvent } from 'custom-card-helpers';
import { configToYaml } from '../utils/yaml-utils.js';

// Import shared form components
import '../components/shared/lcards-message.js';
import '../components/shared/lcards-form-section.js';
import { LCARdSFormFieldHelper as FormField } from '../components/shared/lcards-form-field.js';

// Import specialized editor components
import '../components/editors/lcards-object-editor.js';
import '../components/editors/lcards-grid-layout.js';

// Import dashboard components
import '../components/dashboard/lcards-rules-dashboard.js';

// Import datasource components
import '../components/datasources/lcards-datasource-editor-tab.js';

// Import template components
import '../components/templates/lcards-template-evaluation-tab.js';

// Import theme browser
import '../components/theme-browser/lcards-theme-token-browser-tab.js';

// Import provenance tab
import '../components/provenance/lcards-provenance-tab.js';

// Import template editor dialog
import '../dialogs/lcards-template-editor-dialog.js';

// Import datasource picker dialog
import '../dialogs/lcards-datasource-picker-dialog.js';

// Import spreadsheet editor dialog
import '../dialogs/lcards-spreadsheet-editor-dialog.js';

// Import Configuration Studio dialog (V4 - with WYSIWYG editing)
import '../dialogs/lcards-data-grid-studio-dialog.js';

export class LCARdSDataGridEditor extends LCARdSBaseEditor {

    constructor() {
        super();
        this.cardType = 'data-grid';
        lcardsLog.debug('[LCARdSDataGridEditor] Editor initialized with cardType: data-grid (1 tab: Configuration Studio launcher)');
    }

    /**
     * Get current data mode
     * @returns {'random'|'template'|'datasource'}
     * @private
     */
    _getDataMode() {
        return this._getConfigValue('data_mode') || 'random';
    }

    /**
     * Get current layout (for datasource mode)
     * @returns {'timeline'|'spreadsheet'|undefined}
     * @private
     */
    _getLayout() {
        return this._getConfigValue('layout');
    }

    /**
     * Define editor tabs - 1-tab structure + utility tabs
     * Configuration Studio handles all visual editing
     * @returns {Array} Tab definitions
     * @protected
     */
    _getTabDefinitions() {
        return [
            { label: 'Configuration', content: () => this._renderConfigurationTab() },
            ...this._getUtilityTabs()
        ];
    }

    // ============================================================================
    // TAB 1: CONFIGURATION
    // ============================================================================

    /**
     * Configuration Tab - Studio launcher and quick settings
     * @returns {TemplateResult}
     * @private
     */
    _renderConfigurationTab() {
        return html`
            <!-- Studio Launcher Card (Top Priority) -->
            <div class="info-card">
                <div class="info-card-content">
                    <h3>🎨 Configuration Studio</h3>
                    <p>
                        <strong>Full-screen immersive workspace</strong> with live preview
                        <br />
                        Visual grid designer, contextual controls, and real-time updates
                    </p>
                    <p style="font-size: 13px; color: var(--secondary-text-color);">
                        Build your data grid visually with instant feedback. Perfect for beginners and power users alike.
                    </p>
                </div>
                <div class="info-card-actions">
                    <ha-button
                        raised
                        @click=${this._openConfigurationStudio}>
                        <ha-icon icon="mdi:pencil-ruler" slot="icon"></ha-icon>
                        Open Configuration Studio
                    </ha-button>
                </div>
            </div>

            <!-- Card Metadata -->
            <lcards-form-section
                header="Card Metadata"
                description="Identification for rules engine targeting"
                icon="mdi:tag"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">

                ${FormField.renderField(this, 'id', {
                    label: 'Card ID',
                    helper: 'Unique identifier for rules engine targeting'
                })}

                ${FormField.renderField(this, 'tags', {
                    label: 'Tags',
                    helper: 'Tags for rules engine categorization'
                })}
            </lcards-form-section>

            <!-- Quick Settings (Collapsible) -->
            <details style="margin-top: 16px;">
                <summary style="cursor: pointer; padding: 12px; font-weight: 600; color: var(--primary-text-color);">
                    Quick Settings (Advanced)
                </summary>
                <div style="padding: 12px;">
                    ${this._renderQuickSettings()}
                </div>
            </details>
        `;
    }

    /**
     * Render quick settings section
     * @returns {TemplateResult}
     * @private
     */
    _renderQuickSettings() {
        return html`
            <lcards-form-section
                header="Data Mode"
                description="How the grid receives data"
                ?expanded=${true}>
                ${FormField.renderField(this, 'data_mode', {
                    label: 'Data Mode',
                    helper: 'Random, Template, or DataSource',
                    valueChanged: (e) => this._handleDataModeChange(e)
                })}
            </lcards-form-section>

            <!-- Mode-specific quick fields (simplified) -->
            ${this._renderModeSpecificQuickFields()}
        `;
    }

    /**
     * Render mode-specific quick fields
     * @returns {TemplateResult}
     * @private
     */
    _renderModeSpecificQuickFields() {
        const dataMode = this._getDataMode();

        switch (dataMode) {
            case 'random':
                return html`
                    <lcards-form-section header="Random Data" ?expanded=${false}>
                        ${FormField.renderField(this, 'format')}
                        ${FormField.renderField(this, 'refresh_interval')}
                    </lcards-form-section>
                `;

            case 'template':
                return html`
                    <lcards-form-section header="Template Rows" ?expanded=${false}>
                        <lcards-message
                            type="info"
                            message="Use Configuration Studio for full template editing capabilities.">
                        </lcards-message>
                        <ha-button @click=${this._openConfigurationStudio}>
                            Open Studio to Edit Rows
                        </ha-button>
                    </lcards-form-section>
                `;

            case 'datasource':
                return html`
                    <lcards-form-section header="DataSource" ?expanded=${false}>
                        ${FormField.renderField(this, 'layout')}
                        <lcards-message
                            type="info"
                            message="Use Configuration Studio for full DataSource configuration.">
                        </lcards-message>
                        <ha-button @click=${this._openConfigurationStudio}>
                            Open Studio to Configure
                        </ha-button>
                    </lcards-form-section>
                `;

            default:
                return '';
        }
    }

    /**
     * Open Configuration Studio dialog
     * @private
     */
    async _openConfigurationStudio() {
        lcardsLog.debug('[DataGridEditor] Opening Configuration Studio V4');

        const dialog = document.createElement('lcards-data-grid-studio-dialog-v4');
        dialog.hass = this.hass;

        // Deep clone current config
        dialog.config = JSON.parse(JSON.stringify(this.config || {}));

        // Listen for config changes
        dialog.addEventListener('config-changed', (e) => {
            lcardsLog.debug('[DataGridEditor] Studio config changed:', e.detail.config);

            // CRITICAL: Replace config entirely, don't merge
            // The studio has already cleaned up mode-specific properties
            // If we merge, deleted keys will persist from the old config
            this.config = e.detail.config;

            // Sync to YAML and notify HA
            this._isUpdatingYaml = true;
            this._yamlValue = configToYaml(this.config);
            requestAnimationFrame(() => {
                this._isUpdatingYaml = false;
            });

            fireEvent(this, 'config-changed', { config: this.config });
            this.requestUpdate();
        });

        // Cleanup on close
        dialog.addEventListener('closed', () => {
            dialog.remove();
        });

        // Append to body and show
        document.body.appendChild(dialog);
    }

    /**
     * Data Mode Tab - DEPRECATED - keeping for backward compatibility
     * Use _renderConfigurationTab() instead
     * @returns {TemplateResult}
     * @private
     */
    _renderDataModeTab() {
        // Redirect to new Configuration tab
        return this._renderConfigurationTab();
    }

    /**
     * Render random mode configuration fields
     * @returns {TemplateResult}
     * @private
     */
    _renderRandomModeFields() {
        return html`
            <lcards-form-section
                header="Random Mode Settings"
                description="Decorative random data generation"
                icon="mdi:dice-multiple"
                ?expanded=${true}
                ?outlined=${true}
                headerLevel="4">

                ${FormField.renderField(this, 'format', {
                    label: 'Data Format',
                    helper: 'Format for randomly generated data'
                })}

                ${FormField.renderField(this, 'refresh_interval', {
                    label: 'Refresh Interval',
                    helper: 'Auto-refresh interval in milliseconds (0 = disabled)'
                })}

                <lcards-message
                    type="info"
                    message="Random mode generates decorative data for LCARS-style ambiance. Configure grid size in the Grid Layout tab.">
                </lcards-message>
            </lcards-form-section>
        `;
    }

    /**
     * Render template mode configuration fields
     * @returns {TemplateResult}
     * @private
     */
    _renderTemplateModeFields() {
        return html`
            <lcards-form-section
                header="Template Mode Settings"
                description="Manual grid with Home Assistant templates"
                icon="mdi:code-braces"
                ?expanded=${true}
                ?outlined=${true}
                headerLevel="4">

                <lcards-message
                    type="info"
                    message="Template mode allows you to define grid rows manually using arrays with Home Assistant template syntax.">
                </lcards-message>

                <!-- Template Row Editor Button -->
                <div style="margin: 16px 0;">
                    <mwc-button
                        raised
                        @click=${this._openTemplateEditorDialog}
                        aria-label="Configure template rows">
                        <ha-icon icon="mdi:table-edit" slot="icon"></ha-icon>
                        Configure Template Rows
                    </mwc-button>
                </div>

                ${this._renderTemplateRowsSummary()}
            </lcards-form-section>
        `;
    }

    /**
     * Render summary of configured template rows
     * @returns {TemplateResult}
     * @private
     */
    _renderTemplateRowsSummary() {
        const rows = this._getConfigValue('rows') || [];

        if (rows.length === 0) {
            return html`
                <ha-alert alert-type="info">
                    No template rows configured. Click "Configure Template Rows" to add rows.
                    <br><br>
                    <strong>Quick Start:</strong> Each row contains cells that can have static text
                    or Home Assistant templates like <code>{{states.sensor.temp.state}}</code>
                </ha-alert>
            `;
        }

        const totalCells = rows.reduce((sum, row) => {
            if (Array.isArray(row)) {
                return sum + row.length;
            } else if (row.values) {
                return sum + row.values.length;
            }
            return sum;
        }, 0);

        return html`
            <ha-alert alert-type="success">
                <strong>${rows.length} row(s) configured</strong> with ${totalCells} total cell(s)
                <br><br>
                Click "Configure Template Rows" to edit or view the YAML tab for full configuration.
            </ha-alert>
        `;
    }

    /**
     * Open template editor dialog
     * @private
     */
    async _openTemplateEditorDialog() {
        const rows = this._getConfigValue('rows') || [];

        // Convert simple array rows to full row objects if needed
        const normalizedRows = rows.map(row => {
            if (Array.isArray(row)) {
                // Simple array format - convert to full object
                return {
                    values: row,
                    style: {},
                    cellStyles: []
                };
            } else if (row.values) {
                // Already in object format
                return row;
            } else {
                // Unknown format - treat as empty
                return {
                    values: [],
                    style: {},
                    cellStyles: []
                };
            }
        });

        const dialog = document.createElement('lcards-template-editor-dialog');
        dialog.hass = this.hass;
        dialog.rows = normalizedRows;

        dialog.addEventListener('rows-changed', (e) => {
            // Save the rows back to config
            const savedRows = e.detail.rows;

            // Convert rows back to simple arrays if they have no style overrides
            const finalRows = savedRows.map(row => {
                const hasRowStyle = row.style && Object.keys(row.style).length > 0;
                const hasCellStyles = row.cellStyles && row.cellStyles.length > 0 &&
                    row.cellStyles.some(style => style !== null && style !== undefined);

                // If no styling, return simple array format for cleaner YAML
                if (!hasRowStyle && !hasCellStyles) {
                    return row.values;
                }

                // Otherwise return full object format
                return row;
            });

            this._setConfigValue('rows', finalRows);
            lcardsLog.info('[LCARdSDataGridEditor] Template rows updated', finalRows);
        });

        // Cleanup on close
        dialog.addEventListener('closed', () => {
            dialog.remove();
        });

        document.body.appendChild(dialog);
        lcardsLog.debug('[LCARdSDataGridEditor] Opened template editor dialog');
    }

    /**
     * Open DataSource picker dialog
     * @private
     */
    async _openDataSourcePickerDialog() {
        const dialog = document.createElement('lcards-datasource-picker-dialog');
        dialog.hass = this.hass;
        dialog.currentSource = this._getConfigValue('source') || '';
        dialog.open = true;

        dialog.addEventListener('source-selected', (e) => {
            const selectedSource = e.detail.source;
            this._setConfigValue('source', selectedSource);
            lcardsLog.info('[LCARdSDataGridEditor] DataSource selected:', selectedSource);
        });

        // Cleanup on close
        dialog.addEventListener('closed', () => {
            dialog.remove();
        });

        document.body.appendChild(dialog);
        lcardsLog.debug('[LCARdSDataGridEditor] Opened DataSource picker dialog');
    }

    /**
     * Render summary of selected DataSource
     * @returns {TemplateResult}
     * @private
     */
    _renderDataSourceSummary() {
        const source = this._getConfigValue('source');

        if (!source) {
            return html`
                <ha-alert alert-type="info">
                    No data source selected. Click "Select Data Source" to choose one.
                </ha-alert>
            `;
        }

        // Check if it's a DataSource name or entity ID
        const dsManager = window.lcards?.core?.dataSourceManager;
        const ds = dsManager?.sources?.get(source);

        if (ds) {
            // It's a registered DataSource
            const entity = ds.cfg?.entity || 'N/A';
            const name = ds.cfg?.name || source;

            return html`
                <ha-alert alert-type="success">
                    <strong>DataSource:</strong> ${name}
                    <br>
                    <small>Entity: ${entity}</small>
                </ha-alert>
            `;
        } else if (source.includes('.')) {
            // Looks like an entity ID (will auto-create DataSource)
            return html`
                <ha-alert alert-type="info">
                    <strong>Entity:</strong> ${source}
                    <br>
                    <small>DataSource will be created automatically when the card loads</small>
                </ha-alert>
            `;
        } else {
            // Unknown format
            return html`
                <ha-alert alert-type="warning">
                    <strong>Source:</strong> ${source}
                    <br>
                    <small>This doesn't appear to be a registered DataSource or entity ID</small>
                </ha-alert>
            `;
        }
    }

    /**
     * Render datasource mode configuration fields
     * @returns {TemplateResult}
     * @private
     */
    _renderDataSourceModeFields() {
        const layout = this._getLayout();

        return html`
            <lcards-form-section
                header="DataSource Mode Settings"
                description="Real-time data from DataSource system"
                icon="mdi:database-sync"
                ?expanded=${true}
                ?outlined=${true}
                headerLevel="4">

                ${FormField.renderField(this, 'layout', {
                    label: 'Layout Type',
                    helper: 'Timeline (flowing data) or Spreadsheet (structured grid)'
                })}

                ${layout === 'timeline' ? this._renderTimelineLayoutFields() : ''}
                ${layout === 'spreadsheet' ? this._renderSpreadsheetLayoutFields() : ''}
            </lcards-form-section>
        `;
    }

    /**
     * Render timeline layout fields
     * @returns {TemplateResult}
     * @private
     */
    _renderTimelineLayoutFields() {
        return html`
            <div style="margin-top: 16px;">
                <lcards-message
                    type="info"
                    message="Timeline layout displays flowing data from a single source, filling left-to-right, top-to-bottom.">
                </lcards-message>

                <!-- DataSource Picker Button -->
                <div style="margin: 16px 0;">
                    <mwc-button
                        raised
                        @click=${this._openDataSourcePickerDialog}
                        aria-label="Select data source">
                        <ha-icon icon="mdi:database-search" slot="icon"></ha-icon>
                        Select Data Source
                    </mwc-button>
                </div>

                ${this._renderDataSourceSummary()}

                ${FormField.renderField(this, 'source', {
                    label: 'Data Source',
                    helper: 'Entity ID or DataSource name (filled from picker)'
                })}

                <lcards-grid-layout>
                    ${FormField.renderField(this, 'history_hours', {
                        label: 'History Hours',
                        helper: 'Hours of historical data to preload'
                    })}

                    ${FormField.renderField(this, 'value_template', {
                        label: 'Value Template',
                        helper: 'Format template for displayed values'
                    })}
                </lcards-grid-layout>
            </div>
        `;
    }

    /**
     * Render spreadsheet layout fields
     * @returns {TemplateResult}
     * @private
     */
    _renderSpreadsheetLayoutFields() {
        return html`
            <div style="margin-top: 16px;">
                <lcards-message
                    type="info"
                    message="Spreadsheet layout creates a structured grid with defined columns and rows, each pulling from specific data sources.">
                </lcards-message>

                <!-- Spreadsheet Editor Button -->
                <div style="margin: 16px 0;">
                    <mwc-button
                        raised
                        @click=${this._openSpreadsheetEditorDialog}
                        aria-label="Configure spreadsheet columns and rows">
                        <ha-icon icon="mdi:table-large" slot="icon"></ha-icon>
                        Configure Spreadsheet
                    </mwc-button>
                </div>

                ${this._renderSpreadsheetSummary()}
            </div>
        `;
    }

    /**
     * Render summary of configured spreadsheet
     * @returns {TemplateResult}
     * @private
     */
    _renderSpreadsheetSummary() {
        const columns = this._getConfigValue('columns') || [];
        const rows = this._getConfigValue('rows') || [];

        if (columns.length === 0 || rows.length === 0) {
            return html`
                <ha-alert alert-type="info">
                    No spreadsheet configured. Click "Configure Spreadsheet" to set up columns and rows.
                    <br><br>
                    <strong>Quick Start:</strong> The spreadsheet editor lets you:
                    <ul style="margin: 8px 0 0 20px; line-height: 1.6;">
                        <li>Define columns with headers, widths, and alignment</li>
                        <li>Create rows with static text or dynamic DataSource values</li>
                        <li>Apply hierarchical styling at column, row, and cell levels</li>
                    </ul>
                </ha-alert>
            `;
        }

        return html`
            <ha-alert alert-type="success">
                <strong>${columns.length} column(s) × ${rows.length} row(s) configured</strong>
                <br><br>
                Columns: ${columns.map(c => c.header).join(', ')}
                <br>
                Click "Configure Spreadsheet" to edit or view the YAML tab for full configuration.
            </ha-alert>
        `;
    }

    /**
     * Open spreadsheet editor dialog
     * @private
     */
    async _openSpreadsheetEditorDialog() {
        const columns = this._getConfigValue('columns') || [];
        const rows = this._getConfigValue('rows') || [];

        const dialog = document.createElement('lcards-spreadsheet-editor-dialog');
        dialog.hass = this.hass;
        dialog.columns = columns;
        dialog.rows = rows;

        dialog.addEventListener('config-changed', (e) => {
            // Save the columns and rows back to config
            this._setConfigValue('columns', e.detail.columns);
            this._setConfigValue('rows', e.detail.rows);

            lcardsLog.info('[LCARdSDataGridEditor] Spreadsheet configuration updated', {
                columns: e.detail.columns,
                rows: e.detail.rows
            });
        });

        // Cleanup on close
        dialog.addEventListener('closed', () => {
            dialog.remove();
        });

        document.body.appendChild(dialog);
        lcardsLog.debug('[LCARdSDataGridEditor] Opened spreadsheet editor dialog');
    }

    // ============================================================================
    // TAB 2: ADVANCED (Grid Layout, Styling, Animation moved to Configuration Studio)
}

// Register the custom element
customElements.define('lcards-data-grid-editor', LCARdSDataGridEditor);
