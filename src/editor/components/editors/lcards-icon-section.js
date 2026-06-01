/**
 * @fileoverview LCARdS Icon Section
 *
 * Per-state icon selector — exact UI counterpart to lcards-color-section-v2 but for
 * icon names rather than colour values.
 *
 * Features (identical to color section v2):
 * - List-based collapsible items for each icon state
 * - Suggested states dropdown (default, active, inactive, etc.)
 * - Custom state input with validation
 * - Range condition builder (above/below/between)
 * - Delete capability
 * - State Mapping Guide (collapsible)
 *
 * Each expanded item renders an ha-selector (type: icon) instead of a colour picker.
 *
 * @example
 * <lcards-icon-section
 *   .editor=${this}
 *   basePath="icon_style.icon"
 *   header="Per-state Icons"
 *   .suggestedStates=${['default', 'active', 'inactive', 'unavailable', 'zero', 'non_zero']}
 *   ?allowCustomStates=${true}>
 * </lcards-icon-section>
 */

import { LitElement, html, css } from 'lit';
import { lcardsLog } from '../../../utils/lcards-logging.js';
import { editorWidgetStyles } from './editor-widget-styles.js';
import '../shared/lcards-form-section.js';

export class LCARdSIconSection extends LitElement {

    static get properties() {
        return {
            editor: { type: Object },           // Parent editor reference
            basePath: { type: String },         // e.g., 'icon_style.icon'
            header: { type: String },           // Section header
            description: { type: String },      // Section description
            expanded: { type: Boolean },        // Expanded state

            // Suggested states for quick-add
            suggestedStates: { type: Array },

            // Allow custom state names
            allowCustomStates: { type: Boolean },

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
        this.header = 'Per-state Icons';
        this.description = '';
        this.expanded = false;
        this.suggestedStates = ['default', 'active', 'inactive', 'unavailable', 'zero', 'non_zero'];
        this.allowCustomStates = true;
        this._expandedStates = new Set();
        this._customStateInput = '';
        this._rangeOperator = 'above';
        this._rangeMin = '';
        this._rangeMax = '';
        this._guideExpanded = false;
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

                /* Action buttons */
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

                /* Icon preview in header */
                .icon-preview {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    color: var(--secondary-text-color);
                    font-size: 13px;
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

                /* Icon picker wrapper */
                .editor-item-content {
                    position: relative;
                    padding: 8px 12px 12px;
                }

                .editor-item-content ha-selector {
                    display: block;
                    width: 100%;
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
                    Icon section requires 'editor' property
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
                icon="mdi:swap-horizontal"
                outlined>

                <!-- Existing States (List) -->
                ${stateCount === 0 ? this._renderEmptyState() : html`
                    <div class="editor-list">
                        ${Object.entries(currentStates).map(([state, icon]) =>
                            this._renderIconStateItem(state, icon)
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
                <ha-icon icon="mdi:shape"></ha-icon>
                <div style="font-weight: 500; margin-bottom: 8px;">No per-state icons configured</div>
                <div style="font-size: 13px;">
                    Add a suggested state or create a custom state below.<br>
                    Falls back to the top-level <code>icon</code> field when no state matches.
                </div>
            </div>
        `;
    }

    /**
     * Render a single icon state item
     * @param {string} state - State name
     * @param {string} iconValue - Icon string value (e.g. 'mdi:lightbulb')
     * @returns {TemplateResult}
     * @private
     */
    _renderIconStateItem(state, iconValue) {
        const isExpanded = this._expandedStates.has(state);

        return html`
            <div class="editor-item">
                <!-- Header (Clickable to Expand) -->
                <div class="editor-item-header" @click=${() => this._toggleState(state)}>
                    <!-- State Info -->
                    <div class="editor-item-info">
                        <div class="editor-item-title">${this._formatStateLabel(state)}</div>
                        <div class="editor-item-subtitle icon-preview">
                            ${iconValue
                                ? html`<ha-icon .icon=${iconValue}></ha-icon> ${iconValue}`
                                : html`<span style="font-style:italic">Not set</span>`
                            }
                        </div>
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

                <!-- Content (Icon Picker) -->
                ${isExpanded ? html`
                    <div class="editor-item-content">
                        <ha-selector
                            .hass=${this.editor.hass}
                            .label=${this._formatStateLabel(state) + ' icon'}
                            .value=${iconValue || ''}
                            .selector=${{ icon: {} }}
                            @value-changed=${(e) => this._handleIconChange(state, e)}>
                        </ha-selector>
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

    // ─── Data Accessors ──────────────────────────────────────────────────────────

    /**
     * Get current icon states from config.
     * Handles both string (simple single icon) and object (state-based) formats.
     * @returns {Object<string, string>}
     * @private
     */
    _getCurrentStates() {
        const value = this.editor._getConfigValue(this.basePath);

        if (typeof value === 'string' && value) {
            // Convert single string to object with 'default' state
            return { default: value };
        } else if (typeof value === 'object' && value !== null) {
            return value;
        }

        return {};
    }

    // ─── Event Handlers ──────────────────────────────────────────────────────────

    /**
     * Toggle state expansion
     * @param {string} state
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
     * Handle icon change from ha-selector
     * @param {string} state
     * @param {CustomEvent} e
     * @private
     */
    _handleIconChange(state, e) {
        const currentStates = this._getCurrentStates();
        currentStates[state] = e.detail.value;
        this.editor._setConfigValue(this.basePath, currentStates);
        lcardsLog.debug('[IconSection] Icon changed', { state, value: e.detail.value });
    }

    /**
     * Handle custom state input change
     * @param {Event} e
     * @private
     */
    _handleCustomStateInput(e) {
        this._customStateInput = e.detail.value ?? '';
    }

    /**
     * Handle custom state keydown (Enter to add)
     * @param {KeyboardEvent} e
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

        if (!/^[a-z0-9_-]+$/.test(stateName)) {
            this._showError('State name must be alphanumeric with optional underscores/hyphens');
            return;
        }

        if (this._hasState(stateName)) {
            this._showError(`State "${stateName}" already exists`);
            return;
        }

        this._addState(stateName);
        this._customStateInput = '';

        lcardsLog.info('[IconSection] Added custom state', { state: stateName });
    }

    _handleRangeOperatorChange(e) {
        this._rangeOperator = /** @type {CustomEvent} */ (e).detail.value;
    }

    _handleRangeMinChange(e) {
        const v = e.detail?.value;
        this._rangeMin = v !== null && v !== undefined ? String(v) : '';
    }

    _handleRangeMaxChange(e) {
        const v = e.detail?.value;
        this._rangeMax = v !== null && v !== undefined ? String(v) : '';
    }

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

    _buildRangeKey() {
        if (this._rangeOperator === 'between') {
            return `between:${this._rangeMin}:${this._rangeMax}`;
        }
        return `${this._rangeOperator}:${this._rangeMin}`;
    }

    _addRangeCondition() {
        if (!this._isValidRangeForm()) return;

        const key = this._buildRangeKey();

        if (this._hasState(key)) {
            this._showError(`Range condition "${key}" already exists`);
            return;
        }

        this._addState(key);
        this._rangeMin = '';
        this._rangeMax = '';

        lcardsLog.info('[IconSection] Added range condition', { key });
    }

    /**
     * Add a new state with empty icon value
     * @param {string} state
     * @private
     */
    _addState(state) {
        const currentStates = this._getCurrentStates();

        if (currentStates[state] !== undefined) {
            lcardsLog.debug('[IconSection] State already exists:', state);
            return;
        }

        const newStates = { ...currentStates, [state]: '' };
        this.editor._setConfigValue(this.basePath, newStates);

        // Auto-expand new state for immediate editing
        this._expandedStates.add(state);
        this.requestUpdate();

        lcardsLog.info('[IconSection] Added state', { state });
    }

    /**
     * Delete a state
     * @param {Event} e
     * @param {string} state
     * @private
     */
    async _deleteState(e, state) {
        e.stopPropagation();

        const confirmed = await this._showConfirmDialog(
            'Delete State',
            `Delete "${state}" icon state?`
        );

        if (!confirmed) return;

        const currentStates = this._getCurrentStates();
        delete currentStates[state];

        this.editor._setConfigValue(this.basePath, currentStates);
        this._expandedStates.delete(state);
        this.requestUpdate();

        lcardsLog.info('[IconSection] Deleted state', { state });
    }

    // ─── Utilities ───────────────────────────────────────────────────────────────

    /**
     * Format state name as readable label
     * @param {string} state
     * @returns {string}
     * @private
     */
    _formatStateLabel(state) {
        if (state.startsWith('above:')) return `Above ${state.slice(6)}`;
        if (state.startsWith('below:')) return `Below ${state.slice(6)}`;
        const between = state.match(/^between:(-?[\d.]+):(-?[\d.]+)$/);
        if (between) return `Between ${between[1]}–${between[2]}`;

        return state
            .split(/[-_]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    _hasState(state) {
        return this._getCurrentStates()[state] !== undefined;
    }

    async _showError(message) {
        await this._showDialog('Error', message, 'error');
        lcardsLog.warn('[IconSection] Error', { message });
    }

    async _showDialog(title, message, type = 'info') {
        return new Promise((resolve) => {
            const dialog = document.createElement('ha-dialog');
            // @ts-ignore
            dialog.headerTitle = title;
            // @ts-ignore
            dialog.open = true;

            const content = document.createElement('div');
            content.innerHTML = message;
            content.style.padding = '16px';
            dialog.appendChild(content);

            const closeButton = document.createElement('ha-button');
            closeButton.slot = 'footer';
            closeButton.textContent = 'OK';
            closeButton.addEventListener('click', () => {
                // @ts-ignore
                dialog.open = false;
                resolve();
            });

            dialog.appendChild(closeButton);
            dialog.addEventListener('closed', () => dialog.remove());
            document.body.appendChild(dialog);
        });
    }

    async _showConfirmDialog(title, message) {
        return new Promise((resolve) => {
            const dialog = document.createElement('ha-dialog');
            // @ts-ignore
            dialog.headerTitle = title;
            // @ts-ignore
            dialog.open = true;

            const content = document.createElement('div');
            content.innerHTML = message;
            content.style.padding = '16px';
            content.style.lineHeight = '1.5';
            dialog.appendChild(content);

            const cancelButton = document.createElement('ha-button');
            cancelButton.textContent = 'Cancel';
            cancelButton.setAttribute('appearance', 'plain');
            cancelButton.addEventListener('click', () => {
                // @ts-ignore
                dialog.open = false;
                resolve(false);
            });

            const confirmButton = document.createElement('ha-button');
            confirmButton.textContent = 'Delete';
            confirmButton.setAttribute('variant', 'danger');
            confirmButton.addEventListener('click', () => {
                // @ts-ignore
                dialog.open = false;
                resolve(true);
            });

            const footerDiv = document.createElement('div');
            footerDiv.slot = 'footer';
            footerDiv.appendChild(cancelButton);
            footerDiv.appendChild(confirmButton);
            dialog.appendChild(footerDiv);

            dialog.addEventListener('closed', () => dialog.remove());
            document.body.appendChild(dialog);
        });
    }
}

if (!customElements.get('lcards-icon-section')) customElements.define('lcards-icon-section', LCARdSIconSection);
