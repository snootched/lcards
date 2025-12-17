/**
 * LCARdS Unified Segment Editor
 *
 * Handles both pre-defined (dpad) and custom (svg) segments using consistent object-based schema.
 * Both modes now use keyed objects with 'default' inheritance pattern.
 *
 * @element lcards-unified-segment-editor
 * @fires value-changed - When segment configuration changes
 *
 * @property {Object} editor - Parent editor instance
 * @property {'dpad'|'custom'} mode - Editor mode
 * @property {Object} segments - Segment configurations (keyed by ID)
 * @property {Array<string>} predefinedSegmentIds - For dpad mode (segment IDs to display)
 * @property {Array<string>} discoveredSegmentIds - For custom mode (IDs found in SVG)
 * @property {Boolean} showDefaults - Show "Default" section
 */

import { LitElement, html, css } from 'lit';
import './lcards-form-section.js';
import './lcards-form-field.js';
import './lcards-multi-action-editor.js';
import './lcards-color-section.js';

export class LCARdSUnifiedSegmentEditor extends LitElement {
    static get properties() {
        return {
            editor: { type: Object },
            mode: { type: String },  // 'dpad' | 'custom'
            segments: { type: Object },  // Always object, keyed by segment ID
            predefinedSegmentIds: { type: Array },  // For dpad: ['center', 'up', 'down', ...]
            discoveredSegmentIds: { type: Array },  // For custom: IDs found in SVG
            showDefaults: { type: Boolean },
            hass: { type: Object },
            _expandedSegments: { type: Set, state: true }
        };
    }

    constructor() {
        super();
        this.mode = 'custom';
        this.segments = {};
        this.predefinedSegmentIds = [];
        this.discoveredSegmentIds = [];
        this.showDefaults = false;
        this._expandedSegments = new Set();
    }

    static get styles() {
        return css`
            :host {
                display: block;
            }

            .segments-list {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .add-button {
                margin-top: 16px;
            }

            .section-label {
                font-weight: 500;
                color: var(--primary-text-color, #212121);
                font-size: 14px;
                margin-bottom: 8px;
            }

            .section-description {
                font-size: 12px;
                color: var(--secondary-text-color, #727272);
                margin-bottom: 12px;
            }

            .form-row {
                display: flex;
                flex-direction: column;
                gap: 8px;
                margin-bottom: 16px;
            }

            .form-row label {
                font-weight: 500;
                color: var(--primary-text-color, #212121);
                font-size: 14px;
            }

            .helper-text {
                font-size: 12px;
                color: var(--secondary-text-color, #727272);
                margin-top: 4px;
            }

            .delete-button {
                margin-top: 16px;
                --mdc-theme-primary: var(--error-color, #db4437);
            }
        `;
    }

    /**
     * Get list of segment IDs to render
     * @returns {Array<string>}
     * @private
     */
    _getSegmentIdList() {
        if (this.mode === 'dpad') {
            return this.predefinedSegmentIds;
        } else {
            // For custom mode: show discovered IDs + any user-configured IDs not yet discovered
            const configuredIds = Object.keys(this.segments || {}).filter(id => id !== 'default');
            const allIds = new Set([...this.discoveredSegmentIds, ...configuredIds]);
            return Array.from(allIds);
        }
    }

    /**
     * Get icon for segment
     * @param {string} segmentId
     * @returns {string}
     * @private
     */
    _getSegmentIcon(segmentId) {
        if (this.mode === 'dpad') {
            const iconMap = {
                'center': 'mdi:gamepad-round',
                'up': 'mdi:gamepad-up',
                'down': 'mdi:gamepad-down',
                'left': 'mdi:gamepad-left',
                'right': 'mdi:gamepad-right',
                'up-left': 'mdi:numeric-1-circle',
                'up-right': 'mdi:numeric-2-circle',
                'down-left': 'mdi:numeric-3-circle',
                'down-right': 'mdi:numeric-4-circle'
            };
            return iconMap[segmentId] || 'mdi:gamepad';
        } else {
            return 'mdi:vector-square';
        }
    }

    /**
     * Format segment label for display
     * @param {string} segmentId
     * @returns {string}
     * @private
     */
    _formatSegmentLabel(segmentId) {
        if (!segmentId) return 'Segment';
        return segmentId.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    /**
     * Get base config path for segment
     * @param {string} segmentId
     * @returns {string}
     * @private
     */
    _getBasePath(segmentId) {
        return this.mode === 'dpad' 
            ? `dpad.segments.${segmentId}`
            : `svg.segments.${segmentId}`;
    }

    /**
     * Delete segment configuration
     * @param {string} segmentId
     * @private
     */
    _deleteSegment(segmentId) {
        const newSegments = { ...this.segments };
        delete newSegments[segmentId];
        
        const basePath = this.mode === 'dpad' ? 'dpad.segments' : 'svg.segments';
        this.editor._setConfigValue(basePath, newSegments);
    }

    /**
     * Handle add segment button click
     * @private
     */
    _handleAddSegment() {
        const segmentId = prompt('Enter segment ID (must match an element id in your SVG):');
        if (segmentId && segmentId.trim()) {
            const basePath = `svg.segments.${segmentId.trim()}`;
            // Create empty segment config to make it appear
            this.editor._setConfigValue(`${basePath}.tap_action`, { action: 'none' });
        }
    }

    render() {
        const segmentIds = this._getSegmentIdList();
        
        return html`
            ${this.showDefaults ? this._renderDefaultSection() : ''}
            
            <div class="segments-list">
                ${segmentIds.map(id => this._renderSegment(id))}
            </div>
            
            ${this.mode === 'custom' ? html`
                <mwc-button
                    class="add-button"
                    outlined
                    icon="mdi:plus"
                    @click=${this._handleAddSegment}>
                    Add Segment
                </mwc-button>
            ` : ''}
        `;
    }

    /**
     * Render default configuration section
     * @returns {TemplateResult}
     * @private
     */
    _renderDefaultSection() {
        const basePath = this.mode === 'dpad' ? 'dpad.segments.default' : 'svg.segments.default';
        const defaultConfig = this.segments?.default || {};
        
        return html`
            <lcards-form-section
                header="Default Configuration"
                description="Applied to all segments unless overridden"
                icon="mdi:cog-outline"
                ?expanded=${true}
                ?outlined=${true}>
                
                <!-- Default Actions -->
                <div class="section-label">Default Actions</div>
                <div class="section-description">
                    Applied to all segments unless overridden (${basePath})
                </div>
                <lcards-multi-action-editor
                    .hass=${this.hass}
                    .actions=${this._getDefaultActions()}
                    @value-changed=${this._handleDefaultActionsChange}>
                </lcards-multi-action-editor>
                
                <!-- Default Style -->
                <lcards-form-section 
                    header="Default SVG Style"
                    description="Default SVG styling properties"
                    icon="mdi:palette-outline"
                    ?expanded=${false}>
                    
                    <lcards-color-section
                        .editor=${this.editor}
                        .config=${this.editor.config}
                        basePath="${basePath}.style.fill"
                        header="Fill"
                        description="SVG fill color states"
                        .states=${['default', 'active', 'inactive', 'unavailable']}
                        ?expanded=${false}>
                    </lcards-color-section>
                    
                    <lcards-color-section
                        .editor=${this.editor}
                        .config=${this.editor.config}
                        basePath="${basePath}.style.stroke"
                        header="Stroke"
                        description="SVG stroke color states"
                        .states=${['default', 'active', 'inactive', 'unavailable']}
                        ?expanded=${false}>
                    </lcards-color-section>

                    <div class="form-row">
                        <label>Stroke Width</label>
                        <ha-textfield
                            .value=${this.editor._getConfigValue(`${basePath}.style.stroke-width`) || ''}
                            @input=${(e) => this.editor._setConfigValue(`${basePath}.style.stroke-width`, e.target.value)}
                            placeholder="e.g., 1 or 0.5">
                        </ha-textfield>
                        <div class="helper-text">SVG stroke width (number or string)</div>
                    </div>
                </lcards-form-section>
            </lcards-form-section>
        `;
    }

    /**
     * Get default actions
     * @returns {Object}
     * @private
     */
    _getDefaultActions() {
        const defaultConfig = this.segments?.default || {};
        return {
            tap_action: defaultConfig.tap_action || { action: 'none' },
            hold_action: defaultConfig.hold_action || { action: 'none' },
            double_tap_action: defaultConfig.double_tap_action || { action: 'none' }
        };
    }

    /**
     * Handle default actions change
     * @param {CustomEvent} event
     * @private
     */
    _handleDefaultActionsChange(event) {
        const actions = event.detail.value;
        const basePath = this.mode === 'dpad' ? 'dpad.segments.default' : 'svg.segments.default';
        
        // Update each action
        ['tap_action', 'hold_action', 'double_tap_action'].forEach(key => {
            if (actions[key]?.action !== 'none') {
                this.editor._setConfigValue(`${basePath}.${key}`, actions[key]);
            } else {
                // Remove action if set to 'none'
                const currentConfig = this.editor._getConfigValue(basePath) || {};
                const updatedConfig = { ...currentConfig };
                delete updatedConfig[key];
                this.editor._setConfigValue(basePath, updatedConfig);
            }
        });
    }

    /**
     * Render individual segment
     * @param {string} segmentId
     * @returns {TemplateResult}
     * @private
     */
    _renderSegment(segmentId) {
        const segment = this.segments?.[segmentId] || {};
        const icon = this._getSegmentIcon(segmentId);
        const label = this._formatSegmentLabel(segmentId);
        const isExpanded = this._expandedSegments.has(segmentId);
        const isPredefined = this.mode === 'dpad';
        const isDiscovered = this.discoveredSegmentIds.includes(segmentId);
        
        return html`
            <lcards-form-section
                header="${label}"
                secondary="${segmentId}"
                icon="${icon}"
                ?expanded=${isExpanded}
                ?outlined=${true}
                headerLevel="4"
                @expanded-changed=${(e) => this._handleSegmentToggle(segmentId, e)}>
                
                ${isExpanded ? html`
                    <!-- Show manual selector field for custom mode if not auto-discovered -->
                    ${!isPredefined && !isDiscovered ? html`
                        <div class="form-row">
                            <label>CSS Selector</label>
                            <ha-textfield
                                .value=${this.editor._getConfigValue(`${this._getBasePath(segmentId)}.selector`) || ''}
                                @input=${(e) => this.editor._setConfigValue(`${this._getBasePath(segmentId)}.selector`, e.target.value)}
                                placeholder="#id, .class, [data-segment='name']">
                            </ha-textfield>
                            <div class="helper-text">Element selector (e.g., #id, .class, [data-segment='name'])</div>
                        </div>
                    ` : ''}
                    
                    <!-- Entity Override -->
                    <div class="form-row">
                        <label>Entity Override</label>
                        <ha-entity-picker
                            .hass=${this.hass}
                            .value=${this.editor._getConfigValue(`${this._getBasePath(segmentId)}.entity`) || ''}
                            @value-changed=${(e) => this.editor._setConfigValue(`${this._getBasePath(segmentId)}.entity`, e.detail.value)}
                            allow-custom-entity>
                        </ha-entity-picker>
                        <div class="helper-text">Optional entity for this segment (overrides card entity)</div>
                    </div>
                    
                    <!-- Actions -->
                    <div class="section-label">Actions</div>
                    <div class="section-description">
                        Override default actions for this segment
                    </div>
                    <lcards-multi-action-editor
                        .hass=${this.hass}
                        .actions=${this._getSegmentActions(segmentId)}
                        @value-changed=${(e) => this._handleSegmentActionsChange(segmentId, e)}>
                    </lcards-multi-action-editor>
                    
                    <!-- SVG Style -->
                    ${this._renderSegmentStyle(segmentId)}
                    
                    <!-- Delete Button (custom mode only) -->
                    ${!isPredefined ? html`
                        <mwc-button
                            class="delete-button"
                            @click=${() => this._deleteSegment(segmentId)}>
                            Delete Segment
                        </mwc-button>
                    ` : ''}
                ` : ''}
            </lcards-form-section>
        `;
    }

    /**
     * Handle segment toggle
     * @param {string} segmentId
     * @param {CustomEvent} event
     * @private
     */
    _handleSegmentToggle(segmentId, event) {
        if (event.detail.expanded) {
            this._expandedSegments.add(segmentId);
        } else {
            this._expandedSegments.delete(segmentId);
        }
        this.requestUpdate();
    }

    /**
     * Get segment actions
     * @param {string} segmentId
     * @returns {Object}
     * @private
     */
    _getSegmentActions(segmentId) {
        const segmentConfig = this.segments?.[segmentId] || {};
        return {
            tap_action: segmentConfig.tap_action || { action: 'none' },
            hold_action: segmentConfig.hold_action || { action: 'none' },
            double_tap_action: segmentConfig.double_tap_action || { action: 'none' }
        };
    }

    /**
     * Handle segment actions change
     * @param {string} segmentId
     * @param {CustomEvent} event
     * @private
     */
    _handleSegmentActionsChange(segmentId, event) {
        const actions = event.detail.value;
        const basePath = this._getBasePath(segmentId);
        
        // Update each action
        ['tap_action', 'hold_action', 'double_tap_action'].forEach(key => {
            if (actions[key]?.action !== 'none') {
                this.editor._setConfigValue(`${basePath}.${key}`, actions[key]);
            } else {
                // Remove action if set to 'none'
                const currentConfig = this.editor._getConfigValue(basePath) || {};
                const updatedConfig = { ...currentConfig };
                delete updatedConfig[key];
                this.editor._setConfigValue(basePath, updatedConfig);
            }
        });
    }

    /**
     * Render segment style section
     * @param {string} segmentId
     * @returns {TemplateResult}
     * @private
     */
    _renderSegmentStyle(segmentId) {
        const basePath = this._getBasePath(segmentId);
        
        return html`
            <lcards-form-section
                header="SVG Style Override"
                description="Override default SVG styling"
                icon="mdi:palette-outline"
                ?expanded=${false}>
                
                <lcards-color-section
                    .editor=${this.editor}
                    .config=${this.editor.config}
                    basePath="${basePath}.style.fill"
                    header="Fill"
                    description="SVG fill color states"
                    .states=${['default', 'active', 'inactive', 'unavailable']}
                    ?expanded=${false}>
                </lcards-color-section>
                
                <lcards-color-section
                    .editor=${this.editor}
                    .config=${this.editor.config}
                    basePath="${basePath}.style.stroke"
                    header="Stroke"
                    description="SVG stroke color states"
                    .states=${['default', 'active', 'inactive', 'unavailable']}
                    ?expanded=${false}>
                </lcards-color-section>
                
                <div class="form-row">
                    <label>Stroke Width</label>
                    <ha-textfield
                        .value=${this.editor._getConfigValue(`${basePath}.style.stroke-width`) || ''}
                        @input=${(e) => this.editor._setConfigValue(`${basePath}.style.stroke-width`, e.target.value)}
                        placeholder="e.g., 1 or 0.5">
                    </ha-textfield>
                    <div class="helper-text">SVG stroke width (overrides default)</div>
                </div>

                <div class="form-row">
                    <label>Opacity</label>
                    <ha-textfield
                        .value=${this.editor._getConfigValue(`${basePath}.style.opacity`) || ''}
                        @input=${(e) => this.editor._setConfigValue(`${basePath}.style.opacity`, e.target.value)}
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        placeholder="0.0 - 1.0">
                    </ha-textfield>
                    <div class="helper-text">SVG opacity (0.0 = transparent, 1.0 = opaque)</div>
                </div>
            </lcards-form-section>
        `;
    }
}

customElements.define('lcards-unified-segment-editor', LCARdSUnifiedSegmentEditor);
