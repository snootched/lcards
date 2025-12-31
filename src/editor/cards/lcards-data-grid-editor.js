/**
 * LCARdS Data Grid Editor
 *
 * Visual configuration editor for data grid cards with 5-tab structure.
 * Supports 3 data modes: random (decorative), template (manual), datasource (real-time)
 * with full CSS Grid configuration and hierarchical styling.
 *
 * @extends {LCARdSBaseEditor}
 */

import { html } from 'lit';
import { lcardsLog } from '../../utils/lcards-logging.js';
import { LCARdSBaseEditor } from '../base/LCARdSBaseEditor.js';

// Import shared form components
import '../components/shared/lcards-message.js';
import '../components/shared/lcards-form-section.js';
import { LCARdSFormFieldHelper as FormField } from '../components/shared/lcards-form-field.js';

// Import specialized editor components
import '../components/editors/lcards-color-section.js';
import '../components/editors/lcards-border-editor.js';
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

export class LCARdSDataGridEditor extends LCARdSBaseEditor {

    constructor() {
        super();
        this.cardType = 'data-grid';
        lcardsLog.debug('[LCARdSDataGridEditor] Editor initialized with cardType: data-grid (5 tabs)');
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
     * Get current animation type
     * @returns {'cascade'|'none'}
     * @private
     */
    _getAnimationType() {
        return this._getConfigValue('animation.type') || 'none';
    }

    /**
     * Define editor tabs - 5-tab structure + utility tabs
     * @returns {Array} Tab definitions
     * @protected
     */
    _getTabDefinitions() {
        return [
            { label: 'Data Mode', content: () => this._renderDataModeTab() },
            { label: 'Grid Layout', content: () => this._renderGridLayoutTab() },
            { label: 'Styling', content: () => this._renderStylingTab() },
            { label: 'Animation', content: () => this._renderAnimationTab() },
            { label: 'Advanced', content: () => this._renderAdvancedTab() },
            ...this._getUtilityTabs()
        ];
    }

    // ============================================================================
    // TAB 1: DATA MODE
    // ============================================================================

    /**
     * Data Mode Tab - Mode selector and mode-specific configuration
     * @returns {TemplateResult}
     * @private
     */
    _renderDataModeTab() {
        const dataMode = this._getDataMode();
        const layout = this._getLayout();

        return html`
            <lcards-message
                type="info"
                message="Choose how the grid gets its data: Random generates decorative data, Template uses manual arrays with Home Assistant templates, and DataSource pulls from real-time data sources.">
            </lcards-message>

            <!-- Mode Selection -->
            <lcards-form-section
                header="Data Mode"
                description="Choose data input mode"
                icon="mdi:database"
                ?expanded=${true}
                ?outlined=${true}
                headerLevel="4">

                ${FormField.renderField(this, 'data_mode', {
                    label: 'Data Mode',
                    helper: 'How the grid receives data'
                })}
            </lcards-form-section>

            <!-- Random Mode Configuration -->
            ${dataMode === 'random' ? this._renderRandomModeFields() : ''}

            <!-- Template Mode Configuration -->
            ${dataMode === 'template' ? this._renderTemplateModeFields() : ''}

            <!-- DataSource Mode Configuration -->
            ${dataMode === 'datasource' ? this._renderDataSourceModeFields() : ''}
        `;
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

                <!-- Placeholder for Spreadsheet Editor (Future PR) -->
                <div style="margin: 16px 0;">
                    <mwc-button disabled aria-label="Configure spreadsheet - coming in a future update">
                        <ha-icon icon="mdi:table-large" slot="icon"></ha-icon>
                        Configure Spreadsheet (Coming in PR 4)
                    </mwc-button>
                </div>

                <ha-alert alert-type="info">
                    Visual spreadsheet configuration will be available in a future update.
                    For now, use the YAML tab to define columns and rows.
                    <br><br>
                    <strong>Example:</strong>
                    <pre style="margin-top: 8px; font-size: 12px;">columns:
  - header: "Room"
    width: 120
    align: left
  - header: "Temperature"
    width: 100
    align: center
rows:
  - sources:
      - type: static
        column: 0
        value: "Living Room"
      - type: datasource
        column: 1
        source: sensor.living_temp
        format: "{value}°C"</pre>
                </ha-alert>
            </div>
        `;
    }

    // ============================================================================
    // TAB 2: GRID LAYOUT
    // ============================================================================

    /**
     * Grid Layout Tab - CSS Grid configuration
     * @returns {TemplateResult}
     * @private
     */
    _renderGridLayoutTab() {
        const hasLegacyShorthand = this._getConfigValue('grid.rows') !== undefined || 
                                    this._getConfigValue('grid.columns') !== undefined;

        return html`
            <lcards-message
                type="info"
                message="Configure the CSS Grid layout. Use standard CSS Grid properties for full control, or legacy shorthand for simple grids.">
            </lcards-message>

            ${hasLegacyShorthand ? html`
                <ha-alert alert-type="warning">
                    ⚠️ This card uses legacy shorthand properties (grid.rows, grid.columns). 
                    Consider migrating to standard CSS Grid properties (grid-template-rows, grid-template-columns) for better control.
                </ha-alert>
            ` : ''}

            <!-- Track Sizing -->
            <lcards-form-section
                header="Track Sizing"
                description="Define rows and columns"
                icon="mdi:grid"
                ?expanded=${true}
                ?outlined=${true}
                headerLevel="4">

                ${FormField.renderField(this, 'grid.grid-template-columns', {
                    label: 'Grid Template Columns',
                    helper: 'CSS Grid columns (e.g., "repeat(12, 1fr)" or "100px 1fr 2fr")'
                })}

                ${FormField.renderField(this, 'grid.grid-template-rows', {
                    label: 'Grid Template Rows',
                    helper: 'CSS Grid rows (e.g., "repeat(8, auto)" or "50px 100px auto")'
                })}
            </lcards-form-section>

            <!-- Gap Control -->
            <lcards-form-section
                header="Gap Control"
                description="Spacing between cells"
                icon="mdi:arrow-expand-all"
                ?expanded=${true}
                ?outlined=${true}
                headerLevel="4">

                ${FormField.renderField(this, 'grid.gap', {
                    label: 'Gap (Uniform)',
                    helper: 'Uniform spacing (e.g., "8px" or "1rem")'
                })}

                <lcards-message
                    type="info"
                    message="You can also use row-gap and column-gap separately for different vertical and horizontal spacing.">
                </lcards-message>

                <lcards-grid-layout>
                    ${FormField.renderField(this, 'grid.row-gap', {
                        label: 'Row Gap',
                        helper: 'Vertical spacing between rows'
                    })}

                    ${FormField.renderField(this, 'grid.column-gap', {
                        label: 'Column Gap',
                        helper: 'Horizontal spacing between columns'
                    })}
                </lcards-grid-layout>
            </lcards-form-section>

            <!-- Auto-Placement & Alignment -->
            <lcards-form-section
                header="Auto-Placement & Item Alignment"
                description="How cells fill and align within the grid"
                icon="mdi:format-align-middle"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">

                ${FormField.renderField(this, 'grid.grid-auto-flow', {
                    label: 'Auto Flow',
                    helper: 'How cells automatically fill the grid'
                })}

                <lcards-grid-layout>
                    ${FormField.renderField(this, 'grid.justify-items', {
                        label: 'Justify Items',
                        helper: 'Horizontal alignment within grid areas'
                    })}

                    ${FormField.renderField(this, 'grid.align-items', {
                        label: 'Align Items',
                        helper: 'Vertical alignment within grid areas'
                    })}
                </lcards-grid-layout>
            </lcards-form-section>

            <!-- Advanced Grid Properties -->
            <lcards-form-section
                header="Advanced"
                description="Container alignment and implicit grid sizing"
                icon="mdi:cog"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">

                <lcards-grid-layout>
                    ${FormField.renderField(this, 'grid.grid-auto-columns', {
                        label: 'Auto Columns',
                        helper: 'Width of implicit columns (e.g., "100px" or "1fr")'
                    })}

                    ${FormField.renderField(this, 'grid.grid-auto-rows', {
                        label: 'Auto Rows',
                        helper: 'Height of implicit rows (e.g., "50px" or "auto")'
                    })}
                </lcards-grid-layout>

                <lcards-grid-layout>
                    ${FormField.renderField(this, 'grid.justify-content', {
                        label: 'Justify Content',
                        helper: 'Horizontal alignment of grid in card'
                    })}

                    ${FormField.renderField(this, 'grid.align-content', {
                        label: 'Align Content',
                        helper: 'Vertical alignment of grid in card'
                    })}
                </lcards-grid-layout>
            </lcards-form-section>

            <!-- Legacy Shorthand (if present) -->
            ${hasLegacyShorthand ? html`
                <lcards-form-section
                    header="Legacy Shorthand"
                    description="⚠️ Deprecated properties (for backward compatibility)"
                    icon="mdi:alert-circle"
                    ?expanded=${false}
                    ?outlined=${true}
                    headerLevel="4">

                    <ha-alert alert-type="warning">
                        These properties are deprecated. They convert to CSS Grid properties at runtime but may be removed in future versions.
                    </ha-alert>

                    <lcards-grid-layout>
                        ${FormField.renderField(this, 'grid.rows', {
                            label: 'Rows (Legacy)',
                            helper: 'Number of rows (converts to grid-template-rows)'
                        })}

                        ${FormField.renderField(this, 'grid.columns', {
                            label: 'Columns (Legacy)',
                            helper: 'Number of columns (converts to grid-template-columns)'
                        })}
                    </lcards-grid-layout>
                </lcards-form-section>
            ` : ''}
        `;
    }

    // ============================================================================
    // TAB 3: STYLING
    // ============================================================================

    /**
     * Styling Tab - Hierarchical cell styling
     * @returns {TemplateResult}
     * @private
     */
    _renderStylingTab() {
        const dataMode = this._getDataMode();
        const layout = this._getLayout();
        const showHeaderStyle = dataMode === 'datasource' && layout === 'spreadsheet';

        return html`
            <lcards-message
                type="info"
                message="Configure cell appearance with hierarchical styling: Grid-wide defaults → Header → Column → Row → Cell. Lower levels override higher levels.">
            </lcards-message>

            <!-- Grid-Wide Style -->
            <lcards-form-section
                header="Grid-Wide Style"
                description="Default styling for all cells"
                icon="mdi:format-paint"
                ?expanded=${true}
                ?outlined=${true}
                headerLevel="4">

                <!-- Font Configuration -->
                <lcards-grid-layout>
                    ${FormField.renderField(this, 'style.font_size', {
                        label: 'Font Size',
                        helper: 'Font size in px or with unit'
                    })}

                    ${FormField.renderField(this, 'style.font_family', {
                        label: 'Font Family',
                        helper: 'Font family (LCARdS or system fonts)'
                    })}

                    ${FormField.renderField(this, 'style.font_weight', {
                        label: 'Font Weight',
                        helper: 'Font weight (100-900)'
                    })}
                </lcards-grid-layout>

                <!-- Colors -->
                <lcards-color-section
                    .editor=${this}
                    header="Colors"
                    description="Text and background colors"
                    .colorPaths=${[
                        { path: 'style.color', label: 'Text Color', helper: 'Cell text color (supports theme tokens)' },
                        { path: 'style.background', label: 'Background Color', helper: 'Cell background color' }
                    ]}
                    ?expanded=${true}
                    ?useColorPicker=${true}>
                </lcards-color-section>

                <!-- Alignment & Padding -->
                <lcards-grid-layout>
                    ${FormField.renderField(this, 'style.align', {
                        label: 'Text Alignment',
                        helper: 'Horizontal text alignment'
                    })}

                    ${FormField.renderField(this, 'style.padding', {
                        label: 'Padding',
                        helper: 'Cell padding in px or with unit'
                    })}
                </lcards-grid-layout>
            </lcards-form-section>

            <!-- Borders -->
            <lcards-form-section
                header="Borders"
                description="Cell border styling"
                icon="mdi:border-all"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">

                <lcards-grid-layout columns="3">
                    ${FormField.renderField(this, 'style.border_width', {
                        label: 'Border Width',
                        helper: 'Border width in px'
                    })}

                    ${FormField.renderField(this, 'style.border_color', {
                        label: 'Border Color',
                        helper: 'Border color'
                    })}

                    ${FormField.renderField(this, 'style.border_style', {
                        label: 'Border Style',
                        helper: 'Border style (solid, dashed, etc.)'
                    })}
                </lcards-grid-layout>
            </lcards-form-section>

            <!-- Header Style (Spreadsheet mode only) -->
            ${showHeaderStyle ? html`
                <lcards-form-section
                    header="Header Style"
                    description="Styling for header row (spreadsheet mode)"
                    icon="mdi:format-header-1"
                    ?expanded=${false}
                    ?outlined=${true}
                    headerLevel="4">

                    <lcards-grid-layout>
                        ${FormField.renderField(this, 'header_style.font_size', {
                            label: 'Font Size',
                            helper: 'Header font size in px'
                        })}

                        ${FormField.renderField(this, 'header_style.font_weight', {
                            label: 'Font Weight',
                            helper: 'Header font weight (100-900)'
                        })}

                        ${FormField.renderField(this, 'header_style.text_transform', {
                            label: 'Text Transform',
                            helper: 'Text transformation (uppercase, lowercase, etc.)'
                        })}
                    </lcards-grid-layout>

                    <lcards-color-section
                        .editor=${this}
                        header="Header Colors"
                        .colorPaths=${[
                            { path: 'header_style.color', label: 'Text Color', helper: 'Header text color' },
                            { path: 'header_style.background', label: 'Background Color', helper: 'Header background color' }
                        ]}
                        ?expanded=${true}
                        ?useColorPicker=${true}>
                    </lcards-color-section>

                    ${FormField.renderField(this, 'header_style.padding', {
                        label: 'Padding',
                        helper: 'Header padding (e.g., "12px 8px")'
                    })}

                    <lcards-grid-layout columns="3">
                        ${FormField.renderField(this, 'header_style.border_bottom_width', {
                            label: 'Bottom Border Width',
                            helper: 'Border width in px'
                        })}

                        ${FormField.renderField(this, 'header_style.border_bottom_color', {
                            label: 'Bottom Border Color',
                            helper: 'Border color'
                        })}

                        ${FormField.renderField(this, 'header_style.border_bottom_style', {
                            label: 'Bottom Border Style',
                            helper: 'Border style'
                        })}
                    </lcards-grid-layout>
                </lcards-form-section>
            ` : ''}

            <!-- Column & Row Styling Notes -->
            <lcards-form-section
                header="Column & Row Styling"
                description="Per-column and per-row style overrides"
                icon="mdi:table-column"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">

                <ha-alert alert-type="info">
                    <strong>Column-level styling</strong> (spreadsheet mode) and <strong>row-level styling</strong> 
                    allow you to override grid-wide defaults for specific columns or rows.
                    <br><br>
                    These features use the YAML tab for configuration. Visual editors for column and row styling 
                    will be added in future updates.
                    <br><br>
                    <strong>Hierarchy:</strong> Grid-Wide → Header → Column → Row → Cell (lowest priority first)
                </ha-alert>

                <lcards-message
                    type="info"
                    message="See the documentation for examples of column and row styling in YAML format.">
                </lcards-message>
            </lcards-form-section>
        `;
    }

    // ============================================================================
    // TAB 4: ANIMATION
    // ============================================================================

    /**
     * Animation Tab - Cascade and change detection configuration
     * @returns {TemplateResult}
     * @private
     */
    _renderAnimationTab() {
        const animationType = this._getAnimationType();
        const pattern = this._getConfigValue('animation.pattern');
        const highlightChanges = this._getConfigValue('animation.highlight_changes') || false;
        const changePreset = this._getConfigValue('animation.change_preset') || 'pulse';

        return html`
            <lcards-message
                type="info"
                message="Configure cascade animation (continuous waterfall effect) and change detection (highlights when values change).">
            </lcards-message>

            <!-- Cascade Animation -->
            <lcards-form-section
                header="Cascade Animation"
                description="Authentic LCARS waterfall color cycling effect"
                icon="mdi:animation"
                ?expanded=${true}
                ?outlined=${true}
                headerLevel="4">

                ${FormField.renderField(this, 'animation.type', {
                    label: 'Animation Type',
                    helper: 'Enable cascade animation'
                })}

                ${animationType === 'cascade' ? html`
                    ${FormField.renderField(this, 'animation.pattern', {
                        label: 'Timing Pattern',
                        helper: 'Preset timing patterns'
                    })}

                    <!-- 3-Color Cascade -->
                    <lcards-color-section
                        .editor=${this}
                        header="Cascade Colors"
                        description="3-color cycle for cascade effect"
                        .colorPaths=${[
                            { path: 'animation.colors.start', label: 'Start Color', helper: 'Starting color (75% dwell)' },
                            { path: 'animation.colors.text', label: 'Middle Color', helper: 'Middle color (10% snap)' },
                            { path: 'animation.colors.end', label: 'End Color', helper: 'Ending color (10% brief)' }
                        ]}
                        ?expanded=${true}
                        ?useColorPicker=${true}>
                    </lcards-color-section>

                    <!-- Speed Controls -->
                    <lcards-grid-layout>
                        ${FormField.renderField(this, 'animation.speed_multiplier', {
                            label: 'Speed Multiplier',
                            helper: '2.0 = twice as fast, 0.5 = half speed'
                        })}

                        ${FormField.renderField(this, 'animation.duration', {
                            label: 'Override Duration (ms)',
                            helper: 'Override all row durations (leave empty to use pattern)'
                        })}
                    </lcards-grid-layout>

                    ${FormField.renderField(this, 'animation.easing', {
                        label: 'Easing Function',
                        helper: 'Animation easing (e.g., "linear", "ease-in-out")'
                    })}

                    <!-- Custom Timing (when pattern = custom) -->
                    ${pattern === 'custom' ? html`
                        <div style="margin-top: 16px;">
                            <mwc-button disabled aria-label="Configure custom timing - coming in a future update">
                                <ha-icon icon="mdi:clock-edit" slot="icon"></ha-icon>
                                Configure Custom Timing (Coming in PR 5)
                            </mwc-button>

                            <ha-alert alert-type="info" style="margin-top: 12px;">
                                Custom timing array configuration will be available in a future update.
                                For now, use the YAML tab to define per-row timing.
                                <br><br>
                                <strong>Example:</strong>
                                <pre style="margin-top: 8px; font-size: 12px;">animation:
  timing:
    - { duration: 3000, delay: 0.1 }
    - { duration: 2000, delay: 0.2 }
    - { duration: 4000, delay: 0.3 }</pre>
                            </ha-alert>
                        </div>
                    ` : ''}
                ` : ''}
            </lcards-form-section>

            <!-- Change Detection -->
            <lcards-form-section
                header="Change Detection"
                description="Highlight cells when values change"
                icon="mdi:alert-circle-outline"
                ?expanded=${true}
                ?outlined=${true}
                headerLevel="4">

                ${FormField.renderField(this, 'animation.highlight_changes', {
                    label: 'Highlight Changes',
                    helper: 'Enable animation when cell values change'
                })}

                ${highlightChanges ? html`
                    ${FormField.renderField(this, 'animation.change_preset', {
                        label: 'Change Animation Preset',
                        helper: 'Animation style for value changes'
                    })}

                    <lcards-grid-layout>
                        ${FormField.renderField(this, 'animation.change_duration', {
                            label: 'Duration (ms)',
                            helper: 'Animation duration'
                        })}

                        ${FormField.renderField(this, 'animation.change_easing', {
                            label: 'Easing',
                            helper: 'Easing function'
                        })}

                        ${FormField.renderField(this, 'animation.max_highlight_cells', {
                            label: 'Max Cells',
                            helper: 'Maximum cells to animate per update'
                        })}
                    </lcards-grid-layout>

                    <!-- Preset-specific parameters info -->
                    <ha-alert alert-type="info">
                        <strong>${changePreset.charAt(0).toUpperCase() + changePreset.slice(1)} Preset Parameters:</strong>
                        <br><br>
                        ${changePreset === 'pulse' ? html`
                            • <strong>max_scale:</strong> Maximum scale factor (default: 1.05)<br>
                            • <strong>min_opacity:</strong> Minimum opacity (default: 0.7)
                        ` : ''}
                        ${changePreset === 'glow' ? html`
                            • <strong>color:</strong> Glow color (default: preset color)<br>
                            • <strong>blur_max:</strong> Maximum blur radius in px (default: 8)
                        ` : ''}
                        ${changePreset === 'flash' ? html`
                            • <strong>color:</strong> Flash color (default: preset color)<br>
                            • <strong>intensity:</strong> Flash intensity 0-1 (default: 0.6)
                        ` : ''}
                        <br>
                        Configure these in <code>animation.change_params</code> via the YAML tab.
                        Visual configuration will be added in a future update.
                    </ha-alert>
                ` : ''}
            </lcards-form-section>
        `;
    }

    // ============================================================================
    // TAB 5: ADVANCED
    // ============================================================================

    /**
     * Advanced Tab - Performance and metadata
     * @returns {TemplateResult}
     * @private
     */
    _renderAdvancedTab() {
        return html`
            <lcards-message
                type="info"
                message="Configure performance settings and card metadata for large grids and rules engine targeting.">
            </lcards-message>

            <!-- Performance Controls -->
            <lcards-form-section
                header="Performance"
                description="Optimization for large grids"
                icon="mdi:speedometer"
                ?expanded=${true}
                ?outlined=${true}
                headerLevel="4">

                <lcards-message
                    type="info"
                    message="For large grids (100+ cells), consider: reducing refresh_interval, limiting max_highlight_cells, disabling change detection, or using simpler animation patterns.">
                </lcards-message>

                ${FormField.renderField(this, 'refresh_interval', {
                    label: 'Refresh Interval (ms)',
                    helper: 'Auto-refresh interval (0 = disabled, higher = better performance)'
                })}

                ${FormField.renderField(this, 'animation.max_highlight_cells', {
                    label: 'Max Highlight Cells',
                    helper: 'Maximum cells to animate per update (lower = better performance)'
                })}
            </lcards-form-section>

            <!-- Card Metadata -->
            <lcards-form-section
                header="Card Metadata"
                description="Identification and categorization"
                icon="mdi:tag"
                ?expanded=${true}
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

            <!-- Help Text -->
            <lcards-form-section
                header="Optimization Tips"
                description="Performance best practices"
                icon="mdi:help-circle"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">

                <ha-alert alert-type="info">
                    <strong>For optimal performance with large grids:</strong><br><br>
                    
                    • <strong>Limit grid size:</strong> Keep grids under 200 cells for smooth animations<br>
                    • <strong>Reduce refresh rate:</strong> Use longer refresh_interval for random mode<br>
                    • <strong>Limit animations:</strong> Disable cascade or change detection for very large grids<br>
                    • <strong>Use simple patterns:</strong> "niagara" or "fast" patterns perform better than "default"<br>
                    • <strong>Cap highlights:</strong> Set max_highlight_cells to 20-30 for large grids<br>
                    • <strong>Optimize templates:</strong> Avoid complex Jinja2 logic in template mode<br><br>
                    
                    See <code>doc/user/examples/data-grid-performance.yaml</code> for examples.
                </ha-alert>
            </lcards-form-section>
        `;
    }
}

// Register the custom element
customElements.define('lcards-data-grid-editor', LCARdSDataGridEditor);
