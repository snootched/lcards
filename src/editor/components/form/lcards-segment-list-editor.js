/**
 * LCARdS Segment List Editor
 *
 * Manage multiple SVG segments with actions, styling, and entity tracking.
 * Used by component presets (dpad) and custom SVG buttons.
 *
 * @example
 * <lcards-segment-list-editor
 *   .editor=${this}
 *   .segments=${this.config.svg?.segments || []}
 *   .hass=${this.hass}
 *   ?expanded=${true}
 *   @value-changed=${this._handleSegmentsChange}>
 * </lcards-segment-list-editor>
 */

import { LitElement, html, css } from 'lit';
import './lcards-form-section.js';
import '../common/lcards-action-editor.js';
import './lcards-multi-action-editor.js';

export class LCARdSSegmentListEditor extends LitElement {

    static get properties() {
        return {
            editor: { type: Object },         // Parent editor reference
            segments: { type: Array },        // Array of segment configs
            hass: { type: Object },           // Home Assistant instance
            expanded: { type: Boolean },      // Expanded state
            _editingIndex: { type: Number, state: true } // Currently editing segment index
        };
    }

    constructor() {
        super();
        this.editor = null;
        this.segments = [];
        this.hass = null;
        this.expanded = true;
        this._editingIndex = -1;
    }

    static get styles() {
        return css`
            :host {
                display: block;
            }

            .segment-list {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .segment-item {
                border: 1px solid var(--divider-color, #e0e0e0);
                border-radius: 8px;
                padding: 12px;
                background: var(--card-background-color, #fff);
            }

            .segment-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
            }

            .segment-title {
                font-weight: 500;
                color: var(--primary-text-color, #212121);
                font-size: 14px;
            }

            .segment-actions {
                display: flex;
                gap: 4px;
            }

            .segment-summary {
                display: flex;
                flex-direction: column;
                gap: 4px;
                font-size: 12px;
                color: var(--secondary-text-color, #727272);
            }

            .segment-summary-item {
                display: flex;
                gap: 8px;
            }

            .segment-summary-label {
                font-weight: 500;
            }

            .segment-details {
                margin-top: 12px;
                padding-top: 12px;
                border-top: 1px solid var(--divider-color, #e0e0e0);
            }

            .form-row {
                margin-bottom: 16px;
            }

            .form-row label {
                display: block;
                font-weight: 500;
                color: var(--primary-text-color, #212121);
                font-size: 14px;
                margin-bottom: 8px;
            }

            ha-textfield,
            ha-entity-picker {
                width: 100%;
                display: block;
            }

            .add-button {
                width: 100%;
                margin-top: 12px;
            }

            mwc-icon-button {
                --mdc-icon-size: 20px;
            }
        `;
    }

    render() {
        return html`
            <lcards-form-section
                header="Segments"
                description="Configure individual SVG segments for interaction"
                icon="mdi:vector-square"
                ?expanded=${this.expanded}
                ?outlined=${true}
                headerLevel="4">

                <div class="segment-list">
                    ${this.segments.map((segment, index) => this._renderSegmentItem(segment, index))}
                </div>

                <mwc-button
                    class="add-button"
                    outlined
                    icon="mdi:plus"
                    @click=${this._addSegment}>
                    Add Segment
                </mwc-button>
            </lcards-form-section>
        `;
    }

    /**
     * Render individual segment item
     * @param {Object} segment - Segment configuration
     * @param {number} index - Segment index
     * @returns {TemplateResult}
     * @private
     */
    _renderSegmentItem(segment, index) {
        const isEditing = this._editingIndex === index;
        const segmentId = segment.id || `segment-${index}`;
        const actionsCount = this._countActions(segment);

        return html`
            <div class="segment-item">
                <div class="segment-header">
                    <div class="segment-title">
                        ${segmentId}
                    </div>
                    <div class="segment-actions">
                        <mwc-icon-button
                            icon="${isEditing ? 'mdi:chevron-up' : 'mdi:pencil'}"
                            title="${isEditing ? 'Collapse' : 'Edit'}"
                            @click=${() => this._toggleEdit(index)}>
                        </mwc-icon-button>
                        <mwc-icon-button
                            icon="mdi:delete"
                            title="Delete"
                            @click=${() => this._deleteSegment(index)}>
                        </mwc-icon-button>
                    </div>
                </div>

                ${!isEditing ? html`
                    <div class="segment-summary">
                        ${segment.selector ? html`
                            <div class="segment-summary-item">
                                <span class="segment-summary-label">Selector:</span>
                                <span>${segment.selector}</span>
                            </div>
                        ` : ''}
                        ${segment.entity ? html`
                            <div class="segment-summary-item">
                                <span class="segment-summary-label">Entity:</span>
                                <span>${segment.entity}</span>
                            </div>
                        ` : ''}
                        ${actionsCount > 0 ? html`
                            <div class="segment-summary-item">
                                <span class="segment-summary-label">Actions:</span>
                                <span>${actionsCount} configured</span>
                            </div>
                        ` : ''}
                    </div>
                ` : html`
                    <div class="segment-details">
                        ${this._renderSegmentForm(segment, index)}
                    </div>
                `}
            </div>
        `;
    }

    /**
     * Render segment form
     * @param {Object} segment - Segment configuration
     * @param {number} index - Segment index
     * @returns {TemplateResult}
     * @private
     */
    _renderSegmentForm(segment, index) {
        return html`
            <div class="form-row">
                <label>Segment ID</label>
                <ha-textfield
                    .value=${segment.id || ''}
                    @input=${(e) => this._updateSegmentProperty(index, 'id', e.target.value)}
                    placeholder="e.g., up, down, left, right">
                </ha-textfield>
            </div>

            <div class="form-row">
                <label>CSS Selector</label>
                <ha-textfield
                    .value=${segment.selector || ''}
                    @input=${(e) => this._updateSegmentProperty(index, 'selector', e.target.value)}
                    placeholder="e.g., #arrow-up, .button-segment">
                </ha-textfield>
            </div>

            <div class="form-row">
                <label>Entity</label>
                <ha-entity-picker
                    .hass=${this.hass}
                    .value=${segment.entity || ''}
                    @value-changed=${(e) => this._updateSegmentProperty(index, 'entity', e.detail.value)}
                    allow-custom-entity>
                </ha-entity-picker>
            </div>

            <lcards-multi-action-editor
                .hass=${this.hass}
                .actions=${{
                    tap_action: segment.tap_action,
                    hold_action: segment.hold_action,
                    double_tap_action: segment.double_tap_action
                }}
                @value-changed=${(e) => this._updateSegmentActions(index, e.detail.value)}>
            </lcards-multi-action-editor>
        `;
    }

    /**
     * Toggle edit mode for segment
     * @param {number} index - Segment index
     * @private
     */
    _toggleEdit(index) {
        if (this._editingIndex === index) {
            this._editingIndex = -1;
        } else {
            this._editingIndex = index;
        }
    }

    /**
     * Add new segment
     * @private
     */
    _addSegment() {
        const newSegment = {
            id: `segment-${this.segments.length}`,
            selector: '',
            entity: '',
            tap_action: { action: 'toggle' }
        };

        const updatedSegments = [...this.segments, newSegment];
        this._updateSegments(updatedSegments);
        this._editingIndex = updatedSegments.length - 1;
    }

    /**
     * Delete segment
     * @param {number} index - Segment index
     * @private
     */
    _deleteSegment(index) {
        const updatedSegments = this.segments.filter((_, i) => i !== index);
        this._updateSegments(updatedSegments);
        if (this._editingIndex === index) {
            this._editingIndex = -1;
        } else if (this._editingIndex > index) {
            this._editingIndex--;
        }
    }

    /**
     * Update segment property
     * @param {number} index - Segment index
     * @param {string} property - Property name
     * @param {*} value - New value
     * @private
     */
    _updateSegmentProperty(index, property, value) {
        const updatedSegments = [...this.segments];
        updatedSegments[index] = {
            ...updatedSegments[index],
            [property]: value
        };
        this._updateSegments(updatedSegments);
    }

    /**
     * Update segment actions
     * @param {number} index - Segment index
     * @param {Object} actions - Actions object
     * @private
     */
    _updateSegmentActions(index, actions) {
        const updatedSegments = [...this.segments];
        updatedSegments[index] = {
            ...updatedSegments[index],
            tap_action: actions.tap_action,
            hold_action: actions.hold_action,
            double_tap_action: actions.double_tap_action
        };
        this._updateSegments(updatedSegments);
    }

    /**
     * Update segments array
     * @param {Array} updatedSegments - New segments array
     * @private
     */
    _updateSegments(updatedSegments) {
        this.segments = updatedSegments;

        // Dispatch value-changed event
        this.dispatchEvent(new CustomEvent('value-changed', {
            detail: { value: updatedSegments },
            bubbles: true,
            composed: true
        }));

        this.requestUpdate();
    }

    /**
     * Count configured actions for a segment
     * @param {Object} segment - Segment configuration
     * @returns {number} Number of configured actions
     * @private
     */
    _countActions(segment) {
        let count = 0;
        if (segment.tap_action && segment.tap_action.action !== 'none') count++;
        if (segment.hold_action && segment.hold_action.action !== 'none') count++;
        if (segment.double_tap_action && segment.double_tap_action.action !== 'none') count++;
        return count;
    }
}

customElements.define('lcards-segment-list-editor', LCARdSSegmentListEditor);
