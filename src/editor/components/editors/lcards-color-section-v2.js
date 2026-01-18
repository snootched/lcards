/**
 * LCARdS Color Section v2
 *
 * Modern list-based color section editor with freeform state support.
 * Matches the UI pattern of animation/filter editors with collapsible items.
 *
 * Key Features:
 * - List-based collapsible items for each color state
 * - Inline color preview bar (6px height)
 * - Suggested states dropdown (default, active, inactive, etc.)
 * - Custom state input with validation
 * - Delete capability (except 'default' state)
 * - Duplicate state functionality
 * - LCARS aesthetic with rounded corners
 *
 * @example
 * <lcards-color-section-v2
 *   .editor=${this}
 *   basePath="style.card.color.background"
 *   header="Background Colors"
 *   .suggestedStates=${['default', 'active', 'inactive', 'unavailable', 'hover', 'pressed']}
 *   ?allowCustomStates=${true}>
 * </lcards-color-section-v2>
 */

import { LitElement, html, css } from 'lit';
import { lcardsLog } from '../../../utils/lcards-logging.js';
import { editorWidgetStyles } from './editor-widget-styles.js';
import '../shared/lcards-form-section.js';
import '../shared/lcards-color-picker.js';

export class LCARdSColorSectionV2 extends LitElement {

    static get properties() {
        return {
            editor: { type: Object },           // Parent editor reference
            basePath: { type: String },         // e.g., 'style.card.color.background'
            header: { type: String },           // Section header
            description: { type: String },      // Section description
            expanded: { type: Boolean },        // Expanded state
            
            // NEW: Suggested states for quick-add
            suggestedStates: { type: Array },
            
            // NEW: Allow custom state names
            allowCustomStates: { type: Boolean },
            
            // NEW: Show color preview bar
            showPreview: { type: Boolean },
            
            // CSS variable prefixes to scan
            variablePrefixes: { type: Array },
            
            // Internal state
            _expandedStates: { type: Set, state: true },
            _customStateInput: { type: String, state: true }
        };
    }

    constructor() {
        super();
        this.editor = null;
        this.basePath = '';
        this.header = 'Colors';
        this.description = '';
        this.expanded = false;
        this.suggestedStates = ['default', 'active', 'inactive', 'unavailable', 'hover', 'pressed'];
        this.allowCustomStates = true;
        this.showPreview = true;
        this.variablePrefixes = ['--lcards-', '--lcars-', '--cblcars-'];
        this._expandedStates = new Set();
        this._customStateInput = '';
        
        lcardsLog.debug('[ColorSectionV2] Initialized', {
            basePath: this.basePath,
            suggestedStates: this.suggestedStates
        });
    }

    static get styles() {
        return [
            editorWidgetStyles,
            css`
                :host {
                    display: block;
                }

                /* Color preview bar */
                .color-preview-bar {
                    height: 6px;
                    width: 100%;
                    border-radius: 3px;
                    margin-top: 6px;
                    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2);
                    transition: height 0.2s;
                }

                .editor-item-header:hover .color-preview-bar {
                    height: 8px;
                }

                /* Add state controls */
                .add-state-controls {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-top: 12px;
                    padding: 12px;
                    background: var(--secondary-background-color);
                    border-radius: 8px;
                }

                .custom-state-input {
                    display: flex;
                    gap: 8px;
                    align-items: flex-end;
                }

                .custom-state-input ha-textfield {
                    flex: 1;
                }

                ha-select {
                    width: 100%;
                }

                /* Empty state */
                .empty-state {
                    text-align: center;
                    padding: 24px;
                    color: var(--secondary-text-color);
                }

                .empty-state ha-icon {
                    --mdc-icon-size: 48px;
                    color: var(--disabled-text-color);
                    margin-bottom: 12px;
                }
            `
        ];
    }

    render() {
        if (!this.editor) {
            return html`
                <ha-alert alert-type="error">
                    Color section v2 requires 'editor' property
                </ha-alert>
            `;
        }

        const currentStates = this._getCurrentStates();
        const stateCount = Object.keys(currentStates).length;

        return html`
            <lcards-form-section
                header="${this.header}"
                description="${this.description}"
                ?expanded=${this.expanded}
                outlined>
                
                <!-- Existing States (List) -->
                ${stateCount === 0 ? this._renderEmptyState() : html`
                    <div class="editor-list">
                        ${Object.entries(currentStates).map(([state, color]) => 
                            this._renderColorStateItem(state, color)
                        )}
                    </div>
                `}
                
                <!-- Add State Controls -->
                ${this._renderAddStateControls()}
            </lcards-form-section>
        `;
    }

    /**
     * Render empty state message
     * @returns {TemplateResult}
     * @private
     */
    _renderEmptyState() {
        return html`
            <div class="empty-state">
                <ha-icon icon="mdi:palette"></ha-icon>
                <div style="font-weight: 500; margin-bottom: 8px;">No color states configured</div>
                <div style="font-size: 13px;">
                    Add a suggested state or create a custom state below
                </div>
            </div>
        `;
    }

    /**
     * Render a single color state item
     * @param {string} state - State name
     * @param {string} color - Color value
     * @returns {TemplateResult}
     * @private
     */
    _renderColorStateItem(state, color) {
        const isExpanded = this._expandedStates.has(state);
        const isDefault = state === 'default';
        
        return html`
            <div class="editor-item">
                <!-- Header (Clickable to Expand) -->
                <div class="editor-item-header" @click=${() => this._toggleState(state)}>
                    <!-- State Info -->
                    <div class="editor-item-info">
                        <div class="editor-item-title">${this._formatStateLabel(state)}</div>
                        <div class="editor-item-subtitle">${color || 'Not set'}</div>
                        
                        <!-- Color Preview Bar -->
                        ${color && this.showPreview ? html`
                            <div class="color-preview-bar" 
                                style="background: ${color}">
                            </div>
                        ` : ''}
                    </div>
                    
                    <!-- Actions -->
                    <div class="editor-item-actions">
                        <ha-icon-button 
                            icon="mdi:content-copy"
                            .label=${'Duplicate'}
                            @click=${(e) => this._duplicateState(e, state)}>
                        </ha-icon-button>
                        ${!isDefault ? html`
                            <ha-icon-button 
                                icon="mdi:delete"
                                .label=${'Delete'}
                                @click=${(e) => this._deleteState(e, state)}>
                            </ha-icon-button>
                        ` : ''}
                    </div>
                    
                    <!-- Expand Icon -->
                    <ha-icon 
                        class="expand-icon ${isExpanded ? 'expanded' : ''}"
                        icon="mdi:chevron-down">
                    </ha-icon>
                </div>
                
                <!-- Content (Color Picker) -->
                ${isExpanded ? html`
                    <div class="editor-item-content">
                        <lcards-color-picker
                            .hass=${this.editor.hass}
                            .value=${color || ''}
                            .variablePrefixes=${this.variablePrefixes}
                            ?showPreview=${true}
                            @value-changed=${(e) => this._handleColorChange(state, e)}>
                        </lcards-color-picker>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Render add state controls
     * @returns {TemplateResult}
     * @private
     */
    _renderAddStateControls() {
        const currentStates = this._getCurrentStates();
        const availableSuggested = this.suggestedStates.filter(
            state => !(state in currentStates)
        );

        return html`
            <div class="add-state-controls">
                <!-- Suggested States Dropdown -->
                ${availableSuggested.length > 0 ? html`
                    <ha-select
                        .label=${'Add Suggested State'}
                        @selected=${this._addSuggestedState}>
                        <mwc-list-item value="">-- Select State --</mwc-list-item>
                        ${availableSuggested.map(state => html`
                            <mwc-list-item value="${state}">
                                ${this._formatStateLabel(state)}
                            </mwc-list-item>
                        `)}
                    </ha-select>
                ` : html`
                    <div style="font-size: 13px; color: var(--secondary-text-color); text-align: center;">
                        All suggested states have been added
                    </div>
                `}
                
                <!-- Custom State Input (if enabled) -->
                ${this.allowCustomStates ? html`
                    <div class="custom-state-input">
                        <ha-textfield
                            .label=${'Custom State Name'}
                            .placeholder=${'idle, buffering, cleaning...'}
                            .value=${this._customStateInput}
                            @input=${this._handleCustomStateInput}
                            @keydown=${this._handleCustomStateKeydown}>
                        </ha-textfield>
                        <ha-button @click=${this._addCustomState}>
                            <ha-icon icon="mdi:plus" slot="icon"></ha-icon>
                            Add Custom
                        </ha-button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Get current color states from config
     * Handles both string (simple) and object (state-based) formats
     * @returns {Object}
     * @private
     */
    _getCurrentStates() {
        const value = this.editor._getConfigValue(this.basePath);
        
        if (typeof value === 'string') {
            // Convert string to object with 'default' state
            return { default: value };
        } else if (typeof value === 'object' && value !== null) {
            return value;
        }
        
        // Return empty object if no states configured
        return {};
    }

    /**
     * Toggle state expansion
     * @param {string} state - State name
     * @private
     */
    _toggleState(state) {
        if (this._expandedStates.has(state)) {
            this._expandedStates.delete(state);
        } else {
            this._expandedStates.add(state);
        }
        this.requestUpdate();
    }

    /**
     * Handle color change from color picker
     * @param {string} state - State name
     * @param {CustomEvent} e - value-changed event
     * @private
     */
    _handleColorChange(state, e) {
        const currentStates = this._getCurrentStates();
        currentStates[state] = e.detail.value;
        this.editor._setConfigValue(this.basePath, currentStates);
        lcardsLog.debug('[ColorSectionV2] Color changed', { state, value: e.detail.value });
    }

    /**
     * Add a suggested state from dropdown
     * @param {CustomEvent} e - selected event
     * @private
     */
    _addSuggestedState(e) {
        const state = e.target.value;
        if (!state) return;
        
        this._addState(state);
        
        // Reset dropdown
        e.target.value = '';
        
        lcardsLog.info('[ColorSectionV2] Added suggested state', { state });
    }

    /**
     * Handle custom state input change
     * @param {Event} e - input event
     * @private
     */
    _handleCustomStateInput(e) {
        this._customStateInput = e.target.value;
    }

    /**
     * Handle custom state keydown (Enter to add)
     * @param {KeyboardEvent} e - keydown event
     * @private
     */
    _handleCustomStateKeydown(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            this._addCustomState();
        }
    }

    /**
     * Add a custom state from text input
     * @private
     */
    _addCustomState() {
        const input = this.renderRoot.querySelector('ha-textfield');
        const stateName = (this._customStateInput || '').trim().toLowerCase();
        
        if (!stateName) {
            this._showError('Please enter a state name');
            return;
        }
        
        // Validate state name (alphanumeric, underscore, hyphen)
        if (!/^[a-z0-9_-]+$/.test(stateName)) {
            this._showError('State name must be alphanumeric with optional underscores/hyphens');
            return;
        }
        
        if (this._hasState(stateName)) {
            this._showError(`State "${stateName}" already exists`);
            return;
        }
        
        this._addState(stateName);
        
        // Clear input
        this._customStateInput = '';
        if (input) {
            input.value = '';
        }
        
        lcardsLog.info('[ColorSectionV2] Added custom state', { state: stateName });
    }

    /**
     * Add a new state with empty color value
     * @param {string} state - State name
     * @private
     */
    _addState(state) {
        const currentStates = this._getCurrentStates();
        
        // Add new state with empty value
        const newStates = { ...currentStates, [state]: '' };
        this.editor._setConfigValue(this.basePath, newStates);
        
        // Auto-expand new state for immediate editing
        this._expandedStates.add(state);
        this.requestUpdate();
    }

    /**
     * Delete a state (except default)
     * @param {Event} e - Click event
     * @param {string} state - State name
     * @private
     */
    _deleteState(e, state) {
        e.stopPropagation();
        
        if (state === 'default') {
            this._showError('Cannot delete default state');
            return;
        }
        
        if (!confirm(`Delete "${state}" state?`)) return;
        
        const currentStates = this._getCurrentStates();
        delete currentStates[state];
        
        this.editor._setConfigValue(this.basePath, currentStates);
        this._expandedStates.delete(state);
        this.requestUpdate();
        
        lcardsLog.info('[ColorSectionV2] Deleted state', { state });
    }

    /**
     * Duplicate a state with new name
     * @param {Event} e - Click event
     * @param {string} sourceState - Source state name
     * @private
     */
    _duplicateState(e, sourceState) {
        e.stopPropagation();
        
        const currentStates = this._getCurrentStates();
        const sourceColor = currentStates[sourceState];
        
        // Generate unique name
        let newState = `${sourceState}_copy`;
        let counter = 1;
        while (this._hasState(newState)) {
            newState = `${sourceState}_copy${counter}`;
            counter++;
        }
        
        // Add duplicated state
        const newStates = { ...currentStates, [newState]: sourceColor };
        this.editor._setConfigValue(this.basePath, newStates);
        
        // Auto-expand duplicated state
        this._expandedStates.add(newState);
        this.requestUpdate();
        
        lcardsLog.info('[ColorSectionV2] Duplicated state', { 
            source: sourceState, 
            duplicate: newState 
        });
    }

    /**
     * Format state name as readable label
     * @param {string} state - State name
     * @returns {string} Formatted label
     * @private
     */
    _formatStateLabel(state) {
        return state
            .split(/[-_]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Check if state exists
     * @param {string} state - State name
     * @returns {boolean}
     * @private
     */
    _hasState(state) {
        const currentStates = this._getCurrentStates();
        return currentStates[state] !== undefined;
    }

    /**
     * Show error message
     * @param {string} message - Error message
     * @private
     */
    _showError(message) {
        // Use HA toast notification if available
        if (this.editor.hass?.callService) {
            this.editor.hass.callService('system_log', 'write', {
                message: `[LCARdS Color Section v2] ${message}`,
                level: 'warning'
            });
        }
        
        // Also show browser alert for immediate feedback
        alert(message);
        
        lcardsLog.warn('[ColorSectionV2] Error', { message });
    }
}

customElements.define('lcards-color-section-v2', LCARdSColorSectionV2);
