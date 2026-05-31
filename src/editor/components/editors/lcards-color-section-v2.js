/**
 * @fileoverview LCARdS Color Section v2
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
import { ColorUtils } from '../../../core/themes/ColorUtils.js';
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
            allowMatchLight: { type: Boolean }, // Show "Match Light Colour" option
            // Explicit entity ID — passing this as a string prop ensures the component
            // re-renders when the entity changes (object-ref editor prop won't trigger it).
            entityId: { type: String },

            // Suggested states for quick-add
            suggestedStates: { type: Array },

            // Allow custom state names
            allowCustomStates: { type: Boolean },

            // Show color preview bar
            showPreview: { type: Boolean },

            // CSS variable prefixes to scan
            variablePrefixes: { type: Array },

            // Internal state
            _expandedStates: { attribute: false, state: true },
            _customStateInput: { type: String, state: true },
            _rangeOperator: { type: String, state: true },
            _rangeMin: { type: String, state: true },
            _rangeMax: { type: String, state: true },
            _guideExpanded: { type: Boolean, state: true }
        };
    }

    constructor() {
        super();
        this.editor = null;
        this.basePath = '';
        this.header = 'Colours';
        this.description = '';
        this.expanded = false;
        this.allowMatchLight = false;
        this.entityId = '';          // Explicit entity ID for reactivity
        this.suggestedStates = ['default', 'active', 'inactive', 'unavailable', 'zero', 'non_zero', 'hover', 'pressed'];
        this.allowCustomStates = true;
        this.showPreview = true;
        this.variablePrefixes = ['--lcards-', '--lcars-', '--cblcars-'];
        this._expandedStates = new Set();
        this._customStateInput = '';
        this._rangeOperator = 'above';
        this._rangeMin = '';
        this._rangeMax = '';
        this._guideExpanded = false;

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

                /* State mapping info box */
                .state-mapping-info {
                    background: var(--primary-background-color);
                    border: var(--ha-border-width-sm) solid var(--divider-color);
                    border-radius: var(--ha-card-border-radius, 12px);
                    margin-bottom: 12px;
                    margin-top: 12px;
                    font-size: 13px;
                    overflow: hidden;
                }

                .state-mapping-info-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 12px;
                    cursor: pointer;
                    user-select: none;
                    color: var(--primary-color);
                    font-weight: 500;
                }

                .state-mapping-info-header:hover {
                    background: rgba(var(--rgb-primary-color, 3, 169, 244), 0.06);
                }

                .state-mapping-info-header ha-icon {
                    flex-shrink: 0;
                }

                .state-mapping-info-header .guide-chevron {
                    margin-left: auto;
                    transition: transform 0.2s;
                }

                .state-mapping-info-header .guide-chevron.expanded {
                    transform: rotate(180deg);
                }

                .state-mapping-info-body {
                    padding: 0 12px 12px 12px;
                    border-top: var(--ha-border-width-sm) solid var(--divider-color);
                }

                .state-mapping-info strong {
                    color: var(--primary-color);
                }

                .state-mapping-info code {
                    background: rgba(0, 0, 0, 0.1);
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-family: monospace;
                    font-size: 12px;
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
                    border-radius: var(--ha-card-border-radius, 12px);
                }

                /* Quick Add Section */
                .quick-add-section {
                    margin-bottom: 12px;
                }

                .field-label {
                    font-size: 14px;
                    font-weight: 500;
                    color: var(--primary-text-color);
                    margin-bottom: 8px;
                }

                .quick-add-buttons {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .quick-add-buttons ha-button {
                    flex: 0 1 auto;
                }

                .no-suggested-states {
                    font-size: 13px;
                    color: var(--secondary-text-color);
                    font-style: italic;
                    padding: 12px;
                    text-align: center;
                    background: var(--secondary-background-color);
                    border-radius: 8px;
                    margin-bottom: 12px;
                }

                .custom-state-input {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                    padding-top: 12px;
                    border-top: var(--ha-border-width-sm) solid var(--divider-color);
                }

                /* Action buttons - ensure visibility */
                .editor-item-actions {
                    display: flex;
                    gap: 4px;
                    flex-shrink: 0;
                    margin-left: 8px;
                }

                .editor-item-actions ha-icon-button {
                    --ha-icon-button-size: 40px;
                    --mdc-icon-size: 20px;
                    --md-icon-button-icon-color: var(--primary-text-color);
                    --md-icon-button-hover-icon-color: var(--error-color);
                }

                .editor-item-actions ha-icon-button:hover {
                    --md-icon-button-icon-color: var(--error-color);
                }

                /* Expand icon spacing */
                .expand-icon {
                    margin-left: 4px;
                    flex-shrink: 0;
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

                /* Fix dropdown clipping from overflow:hidden */
                .editor-item-content {
                    position: relative;
                }

                .editor-item-content lcards-color-picker {
                    position: relative;
                }

                /* Range condition form */
                .range-condition-input {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    padding-top: 12px;
                    border-top: var(--ha-border-width-sm) solid var(--divider-color);
                }

                .range-condition-row {
                    display: flex;
                    gap: 8px;
                    align-items: flex-start;
                    flex-wrap: wrap;
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
                icon="mdi:palette"
                outlined>

                <!-- Existing States (List) -->
                ${stateCount === 0 ? this._renderEmptyState() : html`
                    <div class="editor-list">
                        ${Object.entries(currentStates).map(([state, color]) =>
                            this._renderColorStateItem(state, color)
                        )}
                    </div>
                `}

                <!-- State Mapping Info (collapsible) -->
                <div class="state-mapping-info">
                    <div class="state-mapping-info-header"
                         @click=${() => { this._guideExpanded = !this._guideExpanded; }}>
                        <ha-icon icon="mdi:information-outline"></ha-icon>
                        <span>State Mapping Guide</span>
                        <ha-icon
                            class="guide-chevron ${this._guideExpanded ? 'expanded' : ''}"
                            icon="mdi:chevron-down">
                        </ha-icon>
                    </div>
                    ${this._guideExpanded ? html`
                    <div class="state-mapping-info-body">
                        <br>
                        Use custom state names (e.g., <code>heat</code>, <code>cool</code>, <code>playing</code>) for exact entity states, or use mapped states:<br>
                        • <strong>active</strong> → on, locked, open, home, playing, heating, cooling, etc.<br>
                        • <strong>inactive</strong> → off, paused, idle, stopped, unlocked, closed, etc.<br>
                        • <strong>unavailable</strong> → unavailable, unknown<br>
                        • <strong>default</strong> → fallback for all other states
                        <br><br>
                        Numeric states (e.g. counts, sensor values):<br>
                        • <strong>zero</strong> → entity state is exactly 0 — higher priority than ranges<br>
                        • <strong>above:N</strong> → value &gt; N — e.g. <code>above:50</code><br>
                        • <strong>below:N</strong> → value &lt; N — e.g. <code>below:20</code><br>
                        • <strong>between:N:M</strong> → N ≤ value ≤ M — e.g. <code>between:20:80</code><br>
                        When multiple ranges match, the most specific one wins (narrowest / highest above / lowest below).<br>
                        • <strong>non_zero</strong> → any non-zero number — catch-all when no range matched<br>
                        <br>
                        Interactive element states (if supported by card):<br>
                        • <strong>hover</strong> · <strong>pressed</strong>
                    </div>
                    ` : ''}
                </div>

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
                                style="background: ${this._resolveColorForPreview(color)}">
                            </div>
                        ` : ''}
                    </div>

                    <!-- Actions -->
                    <div class="editor-item-actions">
                        <ha-icon-button
                            .label=${'Delete'}
                            .path=${'M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z'}
                            @click=${(e) => this._deleteState(e, state)}>
                        </ha-icon-button>
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
                            ?allowMatchLight=${this.entityId ? this.entityId.startsWith('light.') : (this.allowMatchLight || (this.editor?._isLightEntity ?? false))}
                            .entityId=${this.entityId || this.editor?.config?.entity || ''}
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
        const existingStates = Object.keys(currentStates);
        const availableSuggested = this.suggestedStates.filter(s => !existingStates.includes(s));

        return html`
            <div class="add-state-controls">
                <!-- Quick Add Buttons for Suggested States -->
                ${availableSuggested.length > 0 ? html`
                    <div class="quick-add-section">
                        <div class="field-label">Quick Add States</div>
                        <div class="quick-add-buttons">
                            ${availableSuggested.map(state => html`
                                <ha-button
                                    @click=${() => this._addState(state)}
                                    outlined>
                                    <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                                    ${this._formatStateLabel(state)}
                                </ha-button>
                            `)}
                        </div>
                    </div>
                ` : html`
                    <div class="no-suggested-states">
                        All suggested states have been added
                    </div>
                `}

                <!-- Custom State Input (if enabled) -->
                ${this.allowCustomStates ? html`
                    <div class="custom-state-input">
                        <ha-selector
                            style="flex:1;"
                            .hass=${this.editor.hass}
                            .label=${'Custom State Name'}
                            .selector=${{ text: {} }}
                            .value=${this._customStateInput}
                            @value-changed=${this._handleCustomStateInput}
                            @keydown=${this._handleCustomStateKeydown}>
                        </ha-selector>
                        <ha-button
                            variant="brand"
                            @click=${this._addCustomState}
                            ?disabled=${!this._customStateInput.trim()}>
                            <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                            Add Custom
                        </ha-button>
                    </div>
                ` : ''}

                <!-- Range Condition Input -->
                <div class="range-condition-input">
                    <div class="field-label">Add Range Condition</div>
                    <div class="range-condition-row">
                        <ha-selector
                            style="width:140px; flex-shrink:0;"
                            .hass=${this.editor.hass}
                            .label=${'Operator'}
                            .value=${this._rangeOperator}
                            .selector=${{
                                select: {
                                    mode: 'dropdown',
                                    options: [
                                        { value: 'above', label: 'Above (>)' },
                                        { value: 'below', label: 'Below (<)' },
                                        { value: 'between', label: 'Between' }
                                    ]
                                }
                            }}
                            @value-changed=${this._handleRangeOperatorChange}>
                        </ha-selector>
                        <ha-selector
                            style="flex:1; min-width:80px;"
                            .hass=${this.editor.hass}
                            .label=${this._rangeOperator === 'between' ? 'From' : 'Threshold'}
                            .selector=${{ number: { mode: 'box', step: 0.01 } }}
                            .value=${this._rangeMin === '' ? null : parseFloat(this._rangeMin)}
                            @value-changed=${this._handleRangeMinChange}>
                        </ha-selector>
                        ${this._rangeOperator === 'between' ? html`
                            <ha-selector
                                style="flex:1; min-width:80px;"
                                .hass=${this.editor.hass}
                                .label=${'To'}
                                .selector=${{ number: { mode: 'box', step: 0.01 } }}
                                .value=${this._rangeMax === '' ? null : parseFloat(this._rangeMax)}
                                @value-changed=${this._handleRangeMaxChange}>
                            </ha-selector>
                        ` : ''}
                        <ha-button
                            style="align-self: center;"
                            variant="brand"
                            @click=${this._addRangeCondition}
                            ?disabled=${!this._isValidRangeForm()}>
                            <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                            Add
                        </ha-button>
                    </div>
                </div>
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
     * Handle custom state input change
     * @param {Event} e - input event
     * @private
     */
    _handleCustomStateInput(e) {
        this._customStateInput = e.detail.value ?? '';
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

        lcardsLog.info('[ColorSectionV2] Added custom state', { state: stateName });
    }

    /**
     * Handle range operator change
     * @param {Event} e
     * @private
     */
    _handleRangeOperatorChange(e) {
        this._rangeOperator = /** @type {CustomEvent} */ (e).detail.value;
    }

    /**
     * Handle range min/threshold input
     * @param {Event} e
     * @private
     */
    _handleRangeMinChange(e) {
        const v = e.detail?.value;
        this._rangeMin = v !== null && v !== undefined ? String(v) : '';
    }

    /**
     * Handle range max input (between only)
     * @param {Event} e
     * @private
     */
    _handleRangeMaxChange(e) {
        const v = e.detail?.value;
        this._rangeMax = v !== null && v !== undefined ? String(v) : '';
    }

    /**
     * Validate the current range form inputs
     * @returns {boolean}
     * @private
     */
    _isValidRangeForm() {
        const min = parseFloat(this._rangeMin);
        if (isNaN(min)) return false;
        if (this._rangeOperator === 'between') {
            const max = parseFloat(this._rangeMax);
            if (isNaN(max)) return false;
            if (min >= max) return false;
        }
        return true;
    }

    /**
     * Build the DSL key from the current range form state
     * @returns {string}
     * @private
     */
    _buildRangeKey() {
        if (this._rangeOperator === 'between') {
            return `between:${this._rangeMin}:${this._rangeMax}`;
        }
        return `${this._rangeOperator}:${this._rangeMin}`;
    }

    /**
     * Add the current range condition to the config
     * @private
     */
    _addRangeCondition() {
        if (!this._isValidRangeForm()) return;

        const key = this._buildRangeKey();

        if (this._hasState(key)) {
            this._showError(`Range condition "${key}" already exists`);
            return;
        }

        this._addState(key);

        // Reset form
        this._rangeMin = '';
        this._rangeMax = '';

        lcardsLog.info('[ColorSectionV2] Added range condition', { key });
    }

    /**
     * Add a new state with empty color value
     * @param {string} state - State name
     * @private
     */
    _addState(state) {
        const currentStates = this._getCurrentStates();

        if (currentStates[state] !== undefined) {
            // State already exists, skip silently
            lcardsLog.debug('[ColorSectionV2] State already exists:', state);
            return;
        }

        // Add new state with empty value
        const newStates = { ...currentStates, [state]: '' };
        this.editor._setConfigValue(this.basePath, newStates);

        // Auto-expand new state for immediate editing
        this._expandedStates.add(state);
        this.requestUpdate();

        lcardsLog.info('[ColorSectionV2] Added state', { state });
    }

    /**
     * Delete a state
     * @param {Event} e - Click event
     * @param {string} state - State name
     * @private
     */
    async _deleteState(e, state) {
        e.stopPropagation();

        const confirmed = await this._showConfirmDialog(
            'Delete State',
            `Delete "${state}" state?`
        );

        if (!confirmed) return;

        const currentStates = this._getCurrentStates();
        delete currentStates[state];

        this.editor._setConfigValue(this.basePath, currentStates);
        this._expandedStates.delete(state);
        this.requestUpdate();

        lcardsLog.info('[ColorSectionV2] Deleted state', { state });
    }



    /**     * Resolve color for preview (handles computed tokens and CSS variables)
     * @param {string} color - Color value
     * @returns {string} Resolved color
     * @private
     */
    _resolveColorForPreview(color) {
        if (!color) return 'transparent';

        // Check if it's a computed token
        const validFunctions = ['lighten', 'darken', 'alpha', 'saturate', 'desaturate', 'mix'];
        const isComputedToken = validFunctions.some(fn => color.startsWith(`${fn}(`));

        if (isComputedToken) {
            try {
                const match = color.match(/^(\w+)\((.+)\)$/);
                if (match) {
                    const [, funcName, argsStr] = match;
                    const args = this._splitArguments(argsStr);

                    if (args.length >= 2) {
                        const baseColor = this._resolveColorForPreview(args[0].trim());
                        const amount = parseFloat(args[1]);

                        switch (funcName) {
                            case 'lighten': return ColorUtils.lighten(baseColor, amount);
                            case 'darken': return ColorUtils.darken(baseColor, amount);
                            case 'alpha': return ColorUtils.alpha(baseColor, amount);
                            case 'saturate': return ColorUtils.saturate(baseColor, amount);
                            case 'desaturate': return ColorUtils.desaturate(baseColor, amount);
                            case 'mix':
                                if (args.length === 3) {
                                    const color2 = this._resolveColorForPreview(args[1].trim());
                                    const ratio = parseFloat(args[2]);
                                    return ColorUtils.mix(baseColor, color2, ratio);
                                }
                        }
                    }
                }
            } catch (error) {
                lcardsLog.warn('[ColorSectionV2] Failed to resolve computed color:', error);
            }
        }

        // Handle CSS variables via DOM
        if (color.includes('var(')) {
            try {
                const temp = document.createElement('div');
                temp.style.color = color;
                document.body.appendChild(temp);
                const computed = getComputedStyle(temp).color;
                document.body.removeChild(temp);
                return computed;
            } catch (err) {
                return color;
            }
        }

        return color;
    }

    /**
     * Split function arguments handling nested parentheses
     * @param {string} argsStr - Arguments string
     * @returns {Array<string>} Array of arguments
     * @private
     */
    _splitArguments(argsStr) {
        const args = [];
        let current = '';
        let depth = 0;

        for (const char of argsStr) {
            if (char === '(') {
                depth++;
                current += char;
            } else if (char === ')') {
                depth--;
                current += char;
            } else if (char === ',' && depth === 0) {
                args.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }

        if (current) {
            args.push(current.trim());
        }

        return args;
    }

    /**     * Format state name as readable label
     * @param {string} state - State name
     * @returns {string} Formatted label
     * @private
     */
    _formatStateLabel(state) {
        // Range DSL keys — format for display
        if (state.startsWith('above:')) return `Above ${state.slice(6)}`;
        if (state.startsWith('below:')) return `Below ${state.slice(6)}`;
        const between = state.match(/^between:(-?[\d.]+):(-?[\d.]+)$/);
        if (between) return `Between ${between[1]}–${between[2]}`;

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
    async _showError(message) {
        await this._showDialog('Error', message, 'error');
        lcardsLog.warn('[ColorSectionV2] Error', { message });
    }

    /**
     * Show HA-style dialog
     * @param {string} title - Dialog title
     * @param {string} message - Dialog message (supports HTML)
     * @param {string} type - Dialog type: 'info', 'warning', 'error'
     * @private
     */
    async _showDialog(title, message, type = 'info') {
        return new Promise((resolve) => {
            const dialog = document.createElement('ha-dialog');
            // @ts-ignore - TS2339: auto-suppressed
            dialog.headerTitle = title;
            // @ts-ignore - TS2339: auto-suppressed
            dialog.open = true;

            const content = document.createElement('div');
            content.innerHTML = message;
            content.style.padding = '16px';
            dialog.appendChild(content);

            const closeButton = document.createElement('ha-button');
            closeButton.slot = 'footer';
            closeButton.textContent = 'OK';
            closeButton.addEventListener('click', () => {
                // @ts-ignore - TS2551: auto-suppressed
                dialog.close();
                resolve();
            });

            dialog.appendChild(closeButton);

            dialog.addEventListener('closed', () => {
                dialog.remove();
            });

            document.body.appendChild(dialog);
        });
    }

    /**
     * Show HA-style confirmation dialog
     * @param {string} title - Dialog title
     * @param {string} message - Dialog message (supports HTML)
     * @returns {Promise<boolean>} True if confirmed
     * @private
     */
    async _showConfirmDialog(title, message) {
        return new Promise((resolve) => {
            const dialog = document.createElement('ha-dialog');
            // @ts-ignore - TS2339: auto-suppressed
            dialog.headerTitle = title;
            // @ts-ignore - TS2339: auto-suppressed
            dialog.open = true;

            const content = document.createElement('div');
            content.innerHTML = message;
            content.style.padding = '16px';
            content.style.lineHeight = '1.5';
            dialog.appendChild(content);

            // Cancel button
            const cancelButton = document.createElement('ha-button');
            cancelButton.textContent = 'Cancel';
            cancelButton.setAttribute('appearance', 'plain');
            cancelButton.addEventListener('click', () => {
                // @ts-ignore - TS2339: auto-suppressed
                dialog.open = false;
                resolve(false);
            });

            // Confirm button
            const confirmButton = document.createElement('ha-button');
            confirmButton.textContent = 'Delete';
            confirmButton.setAttribute('variant', 'danger');
            confirmButton.addEventListener('click', () => {
                // @ts-ignore - TS2339: auto-suppressed
                dialog.open = false;
                resolve(true);
            });

            const footerDiv = document.createElement('div');
            footerDiv.slot = 'footer';
            footerDiv.appendChild(cancelButton);
            footerDiv.appendChild(confirmButton);
            dialog.appendChild(footerDiv);

            dialog.addEventListener('closed', () => {
                dialog.remove();
            });

            document.body.appendChild(dialog);
        });
    }
}

if (!customElements.get('lcards-color-section-v2')) customElements.define('lcards-color-section-v2', LCARdSColorSectionV2);
