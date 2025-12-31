/**
 * LCARdS Visual Grid Designer
 *
 * Dual-mode grid designer for configuring CSS Grid layouts.
 * Supports visual designer (interactive controls) and CSS text editor modes.
 *
 * @element lcards-visual-grid-designer
 * @fires grid-changed - When grid configuration changes (detail: { rows, columns, gap, cssGrid })
 *
 * @property {Number} rows - Number of rows (default: 8)
 * @property {Number} columns - Number of columns (default: 12)
 * @property {Number} gap - Gap size in px (default: 8)
 * @property {String} mode - 'visual' | 'text' (default: 'visual')
 * @property {Object} cssGrid - Full CSS Grid config object
 *
 * @example
 * <lcards-visual-grid-designer
 *   .rows=${8}
 *   .columns=${12}
 *   .gap=${8}
 *   .mode=${'visual'}
 *   @grid-changed=${this._handleGridChanged}>
 * </lcards-visual-grid-designer>
 */

import { LitElement, html, css } from 'lit';
import { lcardsLog } from '../../../utils/lcards-logging.js';

export class LCARdSVisualGridDesigner extends LitElement {

    static properties = {
        rows: { type: Number },
        columns: { type: Number },
        gap: { type: Number },
        mode: { type: String },
        cssGrid: { type: Object },
        _gridStructure: { type: Array, state: true },
        _validationErrors: { type: Object, state: true },
        _cssDebounceTimer: { state: true },
        _cssInputs: { type: Object, state: true }
    };

    constructor() {
        super();
        this.rows = 8;
        this.columns = 12;
        this.gap = 8;
        this.mode = 'visual';
        this.cssGrid = {};
        this._gridStructure = [];
        this._validationErrors = {};
        this._cssDebounceTimer = null;
        this._cssInputs = {
            'grid-template-columns': '',
            'grid-template-rows': '',
            'gap': '',
            'grid-auto-flow': 'row',
            'justify-items': 'stretch',
            'align-items': 'stretch'
        };
        this._buildGridStructure();
    }

    static get styles() {
        return css`
            :host {
                display: block;
            }

            .grid-designer {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }

            /* Mode Toggle */
            .mode-toggle {
                display: flex;
                gap: 8px;
                padding: 12px;
                background: var(--secondary-background-color, #f5f5f5);
                border-radius: 8px;
            }

            .mode-toggle ha-button {
                flex: 1;
            }

            /* Visual Designer */
            .visual-designer {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }

            .toolbox {
                display: flex;
                flex-wrap: wrap;
                gap: 16px;
                padding: 16px;
                background: var(--secondary-background-color, #f5f5f5);
                border-radius: 8px;
            }

            .tool-group {
                display: flex;
                align-items: center;
                gap: 8px;
                flex: 1;
                min-width: 200px;
            }

            .tool-group label {
                font-weight: 500;
                font-size: 14px;
                color: var(--primary-text-color, #212121);
                min-width: 80px;
            }

            .tool-controls {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .count-display {
                min-width: 40px;
                text-align: center;
                font-weight: 600;
                font-size: 16px;
                color: var(--primary-color, #03a9f4);
            }

            .gap-slider {
                flex: 1;
                min-width: 120px;
            }

            .gap-value {
                min-width: 50px;
                font-weight: 600;
                font-size: 14px;
                color: var(--primary-color, #03a9f4);
            }

            /* Grid Canvas */
            .grid-canvas {
                background: var(--card-background-color, white);
                border: 2px solid var(--divider-color, #e0e0e0);
                border-radius: 8px;
                padding: 16px;
                max-height: 400px;
                overflow: auto;
            }

            .grid-preview {
                display: grid;
                gap: var(--grid-gap, 8px);
                grid-template-columns: var(--grid-columns);
                grid-template-rows: var(--grid-rows);
            }

            .grid-cell {
                border: 1px solid var(--divider-color, #e0e0e0);
                background: var(--secondary-background-color, #fafafa);
                min-height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                color: var(--secondary-text-color, #727272);
                transition: all 0.2s ease;
                border-radius: 4px;
            }

            .grid-cell:hover {
                background: var(--primary-color);
                opacity: 0.1;
            }

            /* Grid Statistics */
            .grid-stats {
                display: flex;
                gap: 24px;
                padding: 12px 16px;
                background: var(--secondary-background-color, #f5f5f5);
                border-radius: 8px;
                flex-wrap: wrap;
            }

            .stat {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .stat-label {
                font-size: 11px;
                color: var(--secondary-text-color, #727272);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .stat-value {
                font-size: 16px;
                font-weight: 600;
                color: var(--primary-text-color, #212121);
            }

            /* Text Editor */
            .text-editor {
                display: flex;
                flex-direction: column;
                gap: 12px;
                padding: 16px;
                background: var(--secondary-background-color, #f5f5f5);
                border-radius: 8px;
            }

            .input-group {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .input-group label {
                font-weight: 500;
                font-size: 14px;
                color: var(--primary-text-color, #212121);
                padding: 2px 8px;
            }

            .input-group ha-textfield,
            .input-group ha-selector {
                width: 100%;
            }

            .validation-error {
                font-size: 12px;
                color: var(--error-color, #db4437);
                padding: 0 8px;
            }

            .advanced-section {
                margin-top: 8px;
            }

            .advanced-header {
                display: flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
                padding: 8px;
                border-radius: 4px;
                transition: background 0.2s ease;
            }

            .advanced-header:hover {
                background: var(--secondary-background-color, #f5f5f5);
            }

            .advanced-header ha-icon {
                transition: transform 0.2s ease;
            }

            .advanced-header.expanded ha-icon {
                transform: rotate(90deg);
            }

            .advanced-header label {
                font-weight: 600;
                font-size: 13px;
                color: var(--secondary-text-color, #727272);
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin: 0;
                cursor: pointer;
            }

            .advanced-content {
                display: none;
                padding-top: 12px;
            }

            .advanced-content.expanded {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            /* Responsive */
            @media (max-width: 768px) {
                .toolbox {
                    flex-direction: column;
                }

                .tool-group {
                    min-width: 100%;
                }

                .grid-stats {
                    flex-direction: column;
                    gap: 12px;
                }
            }
        `;
    }

    connectedCallback() {
        super.connectedCallback();
        this._syncCssInputsFromProps();
        lcardsLog.debug('[VisualGridDesigner] Component connected', {
            rows: this.rows,
            columns: this.columns,
            gap: this.gap,
            mode: this.mode
        });
    }

    updated(changedProps) {
        if (changedProps.has('rows') || changedProps.has('columns')) {
            this._buildGridStructure();
        }
    }

    render() {
        return html`
            <div class="grid-designer">
                ${this._renderModeToggle()}
                ${this.mode === 'visual' ? this._renderVisualDesigner() : this._renderTextEditor()}
            </div>
        `;
    }

    /**
     * Render mode toggle buttons
     * @private
     */
    _renderModeToggle() {
        return html`
            <div class="mode-toggle">
                <ha-button
                    .appearance=${this.mode === 'visual' ? 'accent' : 'plain'}
                    @click=${() => this._switchMode('visual')}>
                    <ha-icon icon="mdi:pencil-ruler" slot="icon"></ha-icon>
                    Visual Designer
                </ha-button>
                <ha-button
                    .appearance=${this.mode === 'text' ? 'accent' : 'plain'}
                    @click=${() => this._switchMode('text')}>
                    <ha-icon icon="mdi:code-braces" slot="icon"></ha-icon>
                    CSS Editor
                </ha-button>
            </div>
        `;
    }

    /**
     * Render visual designer mode
     * @private
     */
    _renderVisualDesigner() {
        return html`
            <div class="visual-designer">
                <!-- Toolbox -->
                <div class="toolbox">
                    <!-- Rows Control -->
                    <div class="tool-group">
                        <label>Rows:</label>
                        <div class="tool-controls">
                            <ha-icon-button
                                .path=${'M19,13H5V11H19V13Z'}
                                @click=${this._removeRow}
                                .disabled=${this.rows <= 1}
                                label="Remove Row">
                            </ha-icon-button>
                            <div class="count-display">${this.rows}</div>
                            <ha-icon-button
                                .path=${'M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z'}
                                @click=${this._addRow}
                                .disabled=${this.rows >= 30}
                                label="Add Row">
                            </ha-icon-button>
                        </div>
                    </div>

                    <!-- Columns Control -->
                    <div class="tool-group">
                        <label>Columns:</label>
                        <div class="tool-controls">
                            <ha-icon-button
                                .path=${'M19,13H5V11H19V13Z'}
                                @click=${this._removeColumn}
                                .disabled=${this.columns <= 1}
                                label="Remove Column">
                            </ha-icon-button>
                            <div class="count-display">${this.columns}</div>
                            <ha-icon-button
                                .path=${'M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z'}
                                @click=${this._addColumn}
                                .disabled=${this.columns >= 30}
                                label="Add Column">
                            </ha-icon-button>
                        </div>
                    </div>

                    <!-- Gap Control -->
                    <div class="tool-group">
                        <label>Gap:</label>
                        <input
                            type="range"
                            class="gap-slider"
                            min="0"
                            max="20"
                            .value=${this.gap}
                            @input=${this._handleGapChange}>
                        <div class="gap-value">${this.gap}px</div>
                    </div>
                </div>

                <!-- Grid Preview -->
                <div class="grid-canvas">
                    <div class="grid-preview" style="${this._getGridStyle()}">
                        ${this._gridStructure.flat().map(cell => html`
                            <div class="grid-cell">
                                ${cell.row + 1},${cell.col + 1}
                            </div>
                        `)}
                    </div>
                </div>

                <!-- Grid Statistics -->
                ${this._renderGridStats()}
            </div>
        `;
    }

    /**
     * Render grid statistics
     * @private
     */
    _renderGridStats() {
        return html`
            <div class="grid-stats">
                <div class="stat">
                    <div class="stat-label">Grid</div>
                    <div class="stat-value">${this.columns} × ${this.rows}</div>
                </div>
                <div class="stat">
                    <div class="stat-label">Total Cells</div>
                    <div class="stat-value">${this.rows * this.columns}</div>
                </div>
                <div class="stat">
                    <div class="stat-label">Gap</div>
                    <div class="stat-value">${this.gap}px</div>
                </div>
            </div>
        `;
    }

    /**
     * Render text editor mode
     * @private
     */
    _renderTextEditor() {
        return html`
            <div class="text-editor">
                <!-- Basic Grid Properties -->
                <div class="input-group">
                    <label>Grid Template Columns</label>
                    <ha-textfield
                        .placeholder=${'repeat(12, 1fr)'}
                        .value=${this._cssInputs['grid-template-columns']}
                        @input=${(e) => this._handleCSSInput('grid-template-columns', e.target.value)}>
                    </ha-textfield>
                    ${this._renderValidationError('grid-template-columns')}
                </div>

                <div class="input-group">
                    <label>Grid Template Rows</label>
                    <ha-textfield
                        .placeholder=${'repeat(8, auto)'}
                        .value=${this._cssInputs['grid-template-rows']}
                        @input=${(e) => this._handleCSSInput('grid-template-rows', e.target.value)}>
                    </ha-textfield>
                    ${this._renderValidationError('grid-template-rows')}
                </div>

                <div class="input-group">
                    <label>Gap</label>
                    <ha-textfield
                        .placeholder=${'8px'}
                        .value=${this._cssInputs['gap']}
                        @input=${(e) => this._handleCSSInput('gap', e.target.value)}>
                    </ha-textfield>
                    ${this._renderValidationError('gap')}
                </div>

                <!-- Advanced Properties (Collapsible) -->
                ${this._renderAdvancedProperties()}
            </div>
        `;
    }

    /**
     * Render advanced properties section
     * @private
     */
    _renderAdvancedProperties() {
        const isExpanded = this._advancedExpanded || false;
        
        return html`
            <div class="advanced-section">
                <div 
                    class="advanced-header ${isExpanded ? 'expanded' : ''}"
                    @click=${() => {
                        this._advancedExpanded = !isExpanded;
                        this.requestUpdate();
                    }}>
                    <ha-icon icon="mdi:chevron-right"></ha-icon>
                    <label>Advanced Properties</label>
                </div>
                <div class="advanced-content ${isExpanded ? 'expanded' : ''}">
                    <div class="input-group">
                        <label>Grid Auto Flow</label>
                        <ha-selector
                            .selector=${{
                                select: {
                                    mode: 'dropdown',
                                    options: ['row', 'column', 'dense']
                                }
                            }}
                            .value=${this._cssInputs['grid-auto-flow']}
                            @value-changed=${(e) => this._handleCSSInput('grid-auto-flow', e.detail.value)}>
                        </ha-selector>
                    </div>

                    <div class="input-group">
                        <label>Justify Items</label>
                        <ha-selector
                            .selector=${{
                                select: {
                                    mode: 'dropdown',
                                    options: ['stretch', 'start', 'end', 'center']
                                }
                            }}
                            .value=${this._cssInputs['justify-items']}
                            @value-changed=${(e) => this._handleCSSInput('justify-items', e.detail.value)}>
                        </ha-selector>
                    </div>

                    <div class="input-group">
                        <label>Align Items</label>
                        <ha-selector
                            .selector=${{
                                select: {
                                    mode: 'dropdown',
                                    options: ['stretch', 'start', 'end', 'center']
                                }
                            }}
                            .value=${this._cssInputs['align-items']}
                            @value-changed=${(e) => this._handleCSSInput('align-items', e.detail.value)}>
                        </ha-selector>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render validation error for CSS property
     * @private
     */
    _renderValidationError(prop) {
        const error = this._validationErrors[prop];
        if (!error) return '';
        
        return html`
            <div class="validation-error">
                <ha-icon icon="mdi:alert-circle"></ha-icon>
                ${error}
            </div>
        `;
    }

    /**
     * Build 2D array of cells based on rows × columns
     * @private
     */
    _buildGridStructure() {
        this._gridStructure = Array.from({ length: this.rows }, (_, r) =>
            Array.from({ length: this.columns }, (_, c) => ({ row: r, col: c }))
        );
        lcardsLog.debug('[VisualGridDesigner] Grid structure rebuilt', {
            rows: this.rows,
            columns: this.columns,
            totalCells: this.rows * this.columns
        });
    }

    /**
     * Switch between visual and text modes
     * @private
     */
    _switchMode(newMode) {
        if (this.mode === newMode) return;
        
        lcardsLog.debug('[VisualGridDesigner] Switching mode', {
            from: this.mode,
            to: newMode
        });
        
        this.mode = newMode;
        
        if (newMode === 'text') {
            this._syncCssInputsFromProps();
        }
        
        this.requestUpdate();
    }

    /**
     * Sync CSS inputs from current property values
     * @private
     */
    _syncCssInputsFromProps() {
        this._cssInputs = {
            'grid-template-columns': this.cssGrid['grid-template-columns'] || `repeat(${this.columns}, 1fr)`,
            'grid-template-rows': this.cssGrid['grid-template-rows'] || `repeat(${this.rows}, auto)`,
            'gap': this.cssGrid['gap'] || `${this.gap}px`,
            'grid-auto-flow': this.cssGrid['grid-auto-flow'] || 'row',
            'justify-items': this.cssGrid['justify-items'] || 'stretch',
            'align-items': this.cssGrid['align-items'] || 'stretch'
        };
    }

    /**
     * Add a row
     * @private
     */
    _addRow() {
        if (this.rows >= 30) return;
        this.rows++;
        this._fireGridChanged();
    }

    /**
     * Remove a row
     * @private
     */
    _removeRow() {
        if (this.rows <= 1) return;
        this.rows--;
        this._fireGridChanged();
    }

    /**
     * Add a column
     * @private
     */
    _addColumn() {
        if (this.columns >= 30) return;
        this.columns++;
        this._fireGridChanged();
    }

    /**
     * Remove a column
     * @private
     */
    _removeColumn() {
        if (this.columns <= 1) return;
        this.columns--;
        this._fireGridChanged();
    }

    /**
     * Handle gap slider change
     * @private
     */
    _handleGapChange(e) {
        this.gap = parseInt(e.target.value, 10);
        this._fireGridChanged();
    }

    /**
     * Handle CSS text input (debounced)
     * @private
     */
    _handleCSSInput(prop, val) {
        this._cssInputs[prop] = val;
        this.requestUpdate();
        
        // Clear existing timer
        if (this._cssDebounceTimer) {
            clearTimeout(this._cssDebounceTimer);
        }
        
        // Debounce 500ms
        this._cssDebounceTimer = setTimeout(() => {
            lcardsLog.debug('[VisualGridDesigner] CSS input changed (debounced)', {
                property: prop,
                value: val
            });
            
            // Validate and fire event
            this._validateCSSValue(prop, val);
            this._fireGridChanged();
        }, 500);
    }

    /**
     * Get grid style string for preview
     * @private
     */
    _getGridStyle() {
        return `
            --grid-gap: ${this.gap}px;
            --grid-columns: repeat(${this.columns}, 1fr);
            --grid-rows: repeat(${this.rows}, auto);
        `;
    }

    /**
     * Get current CSS property value
     * @private
     */
    _getCSSValue(prop) {
        return this._cssInputs[prop] || '';
    }

    /**
     * Validate CSS value
     * @private
     */
    _validateCSSValue(prop, val) {
        // Clear existing error
        delete this._validationErrors[prop];
        
        if (!val || val.trim() === '') {
            // Empty is valid (will use defaults)
            this.requestUpdate();
            return true;
        }
        
        let isValid = true;
        
        // Basic validation patterns
        switch (prop) {
            case 'grid-template-columns':
            case 'grid-template-rows':
                // Check for valid CSS Grid track syntax
                // Allow: repeat(), fr, px, %, auto, minmax(), etc.
                if (!/^[\d\s\w(),%\.\-]+$/.test(val)) {
                    this._validationErrors[prop] = 'Invalid grid template syntax';
                    isValid = false;
                }
                break;
            
            case 'gap':
                // Check for valid length value
                if (!/^\d+(\.\d+)?(px|em|rem|%)?(\s+\d+(\.\d+)?(px|em|rem|%)?)?$/.test(val)) {
                    this._validationErrors[prop] = 'Invalid gap value (e.g., 8px, 1rem, 8px 12px)';
                    isValid = false;
                }
                break;
        }
        
        if (!isValid) {
            lcardsLog.warn('[VisualGridDesigner] Validation error', {
                property: prop,
                value: val,
                error: this._validationErrors[prop]
            });
        }
        
        this.requestUpdate();
        return isValid;
    }

    /**
     * Fire grid-changed event
     * @private
     */
    _fireGridChanged() {
        const cssGrid = {
            'grid-template-columns': this.mode === 'text' 
                ? this._cssInputs['grid-template-columns'] 
                : `repeat(${this.columns}, 1fr)`,
            'grid-template-rows': this.mode === 'text'
                ? this._cssInputs['grid-template-rows']
                : `repeat(${this.rows}, auto)`,
            'gap': this.mode === 'text'
                ? this._cssInputs['gap']
                : `${this.gap}px`
        };
        
        // Include advanced properties if in text mode
        if (this.mode === 'text') {
            if (this._cssInputs['grid-auto-flow'] && this._cssInputs['grid-auto-flow'] !== 'row') {
                cssGrid['grid-auto-flow'] = this._cssInputs['grid-auto-flow'];
            }
            if (this._cssInputs['justify-items'] && this._cssInputs['justify-items'] !== 'stretch') {
                cssGrid['justify-items'] = this._cssInputs['justify-items'];
            }
            if (this._cssInputs['align-items'] && this._cssInputs['align-items'] !== 'stretch') {
                cssGrid['align-items'] = this._cssInputs['align-items'];
            }
        }
        
        const detail = {
            rows: this.rows,
            columns: this.columns,
            gap: this.gap,
            cssGrid
        };
        
        lcardsLog.debug('[VisualGridDesigner] Firing grid-changed event', detail);
        
        this.dispatchEvent(new CustomEvent('grid-changed', {
            detail,
            bubbles: true,
            composed: true
        }));
    }
}

customElements.define('lcards-visual-grid-designer', LCARdSVisualGridDesigner);
