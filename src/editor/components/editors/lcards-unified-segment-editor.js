/**
 * @fileoverview LCARdS Unified Segment Editor
 *
 * Handles both pre-defined (dpad) and custom (svg) segments using consistent object-based schema.
 * Both modes now use keyed objects with 'default' inheritance pattern.
 *
 * @element lcards-unified-segment-editor
 * @fires value-changed - When segment configuration changes
 *
 * @property {Object} editor - Parent editor instance
 * @property {'dpad'|'custom'} mode - Editor mode
 * @property {string|null} componentType - For non-dpad predefined components (e.g. 'alert').
 *   When set, overrides the config path prefix from 'dpad' or 'svg' to the component name.
 * @property {Object} segments - Segment configurations (keyed by ID)
 * @property {Array<string>} predefinedSegmentIds - For dpad/component mode (segment IDs to display)
 * @property {Array<string>} discoveredSegmentIds - For custom mode (IDs found in SVG)
 * @property {Boolean} showDefaults - Show "Default" section
 */

import { LitElement, html, css } from 'lit';
import '../shared/lcards-form-section.js';
import '../shared/lcards-form-field.js';
import '../shared/lcards-message.js';
import './lcards-multi-action-editor.js';
import './lcards-color-section-v2.js';
import '../lcards-animation-editor.js';

export class LCARdSUnifiedSegmentEditor extends LitElement {
    static get properties() {
        return {
            editor: { type: Object },
            mode: { type: String },          // 'dpad' | 'custom'
            componentType: { type: String }, // e.g. 'alert' — overrides config path prefix
            segments: { type: Object },      // Always object, keyed by segment ID
            predefinedSegmentIds: { type: Array },  // For dpad/component: ['center', 'up', ...]
            discoveredSegmentIds: { type: Array },  // For custom: IDs found in SVG
            showDefaults: { type: Boolean },
            hass: { type: Object },
            _expandedSegments: { type: Set, state: true }
        };
    }

    constructor() {
        super();
        /** @type {any} */
        this.editor = undefined;
        /** @type {any} */
        this.hass = undefined;
        this.mode = 'custom';
        this.componentType = null;
        this.segments = {};
        this.predefinedSegmentIds = [];
        this.discoveredSegmentIds = [];
        this.showDefaults = false;
        this._expandedSegments = new Set();
    }

    /**
     * Return the config path prefix used for this segment editor.
     * When componentType is set (e.g. 'alert'), that is used verbatim.
     * Otherwise falls back to 'dpad' or 'svg' depending on mode.
     * @private
     * @returns {string}
     */
    _getBasePrefix() {
        if (this.componentType) return this.componentType;
        return this.mode === 'dpad' ? 'dpad' : 'svg';
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
                margin-bottom: 12px;
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
        return `${this._getBasePrefix()}.segments.${segmentId}`;
    }

    /**
     * Delete segment configuration
     * @param {string} segmentId
     * @private
     */
    _deleteSegment(segmentId) {
        const newSegments = { ...this.segments };
        delete newSegments[segmentId];
        // @ts-ignore - TS2339: auto-suppressed
        this.editor._setConfigValue(`${this._getBasePrefix()}.segments`, newSegments);
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
            // @ts-ignore - TS2339: auto-suppressed
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
                <ha-button
                    class="add-button"
                    appearance="filled"
                    variant="brand"
                    @click=${this._handleAddSegment}>
                    <ha-icon slot="start" icon="mdi:plus"></ha-icon>
                    Add Segment
                </ha-button>
            ` : ''}
        `;
    }

    /**
     * Render default configuration section
     * @returns {TemplateResult}
     * @private
     */
    _renderDefaultSection() {
        const basePath = `${this._getBasePrefix()}.segments.default`;
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
                    // @ts-ignore - TS2339: auto-suppressed
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

                    <lcards-color-section-v2
                        // @ts-ignore - TS2339: auto-suppressed
                        .editor=${this.editor}
                        // @ts-ignore - TS2339: auto-suppressed
                        .config=${this.editor.config}
                        basePath="${basePath}.style.fill"
                        header="Fill"
                        description="SVG fill colour states - supports custom states like 'heat', 'cool', 'playing', etc."
                        .suggestedStates=${['default', 'active', 'inactive', 'unavailable', 'hover', 'pressed']}
                        ?allowCustomStates=${true}
                        ?expanded=${false}>
                    </lcards-color-section-v2>

                    <lcards-color-section-v2
                        // @ts-ignore - TS2339: auto-suppressed
                        .editor=${this.editor}
                        // @ts-ignore - TS2339: auto-suppressed
                        .config=${this.editor.config}
                        basePath="${basePath}.style.stroke"
                        header="Stroke"
                        description="SVG stroke colour states - supports custom states like 'heat', 'cool', 'playing', etc."
                        .suggestedStates=${['default', 'active', 'inactive', 'unavailable', 'hover', 'pressed']}
                        ?allowCustomStates=${true}
                        ?expanded=${false}>
                    </lcards-color-section-v2>

                    <ha-selector
                        // @ts-ignore - TS2339: auto-suppressed
                        .hass=${this.hass}
                        .label=${'Stroke Width'}
                        .helper=${'SVG stroke width (number or string)'}
                        .selector=${{ text: {} }}
                        // @ts-ignore - TS2339: auto-suppressed
                        .value=${this.editor._getConfigValue(`${basePath}.style.stroke-width`) || ''}
                        // @ts-ignore - TS2339: auto-suppressed
                        @value-changed=${(e) => this.editor._setConfigValue(`${basePath}.style.stroke-width`, e.detail.value)}>
                    </ha-selector>
                </lcards-form-section>

                <!-- Default Animations -->
                <lcards-form-section
                    header="Default Segment Animations"
                    description="Default animations for all segments"
                    icon="mdi:animation"
                    ?expanded=${false}>

                    <lcards-message type="info">
                        <p style="margin: 0; font-size: 13px; line-height: 1.4;">
                            These animations apply to <strong>all segments</strong> unless overridden. For card-wide animations, use the Effects tab.
                        </p>
                    </lcards-message>

                    <lcards-animation-editor
                        // @ts-ignore - TS2339: auto-suppressed
                        .hass=${this.hass}
                        .animations=${defaultConfig.animations || []}
                        // @ts-ignore - TS2339: auto-suppressed
                        .cardElement=${this.editor._cardElement}
                        @animations-changed=${(e) => {
                            // @ts-ignore - TS2339: auto-suppressed
                            this.editor._setConfigValue(`${basePath}.animations`, e.detail.value);
                        }}>
                    </lcards-animation-editor>
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
        const basePath = `${this._getBasePrefix()}.segments.default`;

        // Update each action
        ['tap_action', 'hold_action', 'double_tap_action'].forEach(key => {
            if (actions[key]?.action !== 'none') {
                // @ts-ignore - TS2339: auto-suppressed
                this.editor._setConfigValue(`${basePath}.${key}`, actions[key]);
            } else {
                // Remove action if set to 'none'
                // @ts-ignore - TS2339: auto-suppressed
                const currentConfig = this.editor._getConfigValue(basePath) || {};
                const updatedConfig = { ...currentConfig };
                delete updatedConfig[key];
                // @ts-ignore - TS2339: auto-suppressed
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
        const isPredefined = this.mode === 'dpad' || !!this.componentType;
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
                        <ha-selector
                            // @ts-ignore - TS2339: auto-suppressed
                            .hass=${this.hass}
                            .label=${'CSS Selector'}
                            .helper=${'Element selector (e.g., #id, .class, [data-segment=\'name\'])'}
                            .selector=${{ text: {} }}
                            // @ts-ignore - TS2339: auto-suppressed
                            .value=${this.editor._getConfigValue(`${this._getBasePath(segmentId)}.selector`) || ''}
                            // @ts-ignore - TS2339: auto-suppressed
                            @value-changed=${(e) => this.editor._setConfigValue(`${this._getBasePath(segmentId)}.selector`, e.detail.value)}>
                        </ha-selector>
                    ` : ''}

                    <!-- Entity Override -->
                    <div class="form-row">
                        <label>Entity Override</label>
                        <ha-entity-picker
                            // @ts-ignore - TS2339: auto-suppressed
                            .hass=${this.hass}
                            // @ts-ignore - TS2339: auto-suppressed
                            .value=${this.editor._getConfigValue(`${this._getBasePath(segmentId)}.entity`) || ''}
                            // @ts-ignore - TS2339: auto-suppressed
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
                        // @ts-ignore - TS2339: auto-suppressed
                        .hass=${this.hass}
                        .actions=${this._getSegmentActions(segmentId)}
                        @value-changed=${(e) => this._handleSegmentActionsChange(segmentId, e)}>
                    </lcards-multi-action-editor>

                    <!-- Animations -->
                    ${this._renderSegmentAnimations(segmentId)}

                    <!-- SVG Style -->
                    ${this._renderSegmentStyle(segmentId)}

                    <!-- Delete Button (custom mode only) -->
                    ${!isPredefined ? html`
                        <ha-button
                            class="delete-button"
                            appearance="filled"
                            variant="danger"
                            @click=${() => this._deleteSegment(segmentId)}>
                            <ha-icon slot="start" icon="mdi:delete"></ha-icon>
                            Delete Segment
                        </ha-button>
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
                // @ts-ignore - TS2339: auto-suppressed
                this.editor._setConfigValue(`${basePath}.${key}`, actions[key]);
            } else {
                // Remove action if set to 'none'
                // @ts-ignore - TS2339: auto-suppressed
                const currentConfig = this.editor._getConfigValue(basePath) || {};
                const updatedConfig = { ...currentConfig };
                delete updatedConfig[key];
                // @ts-ignore - TS2339: auto-suppressed
                this.editor._setConfigValue(basePath, updatedConfig);
            }
        });
    }

    /**
     * Render segment animations section
     * @param {string} segmentId
     * @returns {TemplateResult}
     * @private
     */
    _renderSegmentAnimations(segmentId) {
        const basePath = this._getBasePath(segmentId);
        const segmentConfig = this.segments?.[segmentId] || {};
        const animations = segmentConfig.animations || [];

        // Check if this card has component-level animations (system animations).
        // When it does, alert the user so they understand the context.
        // @ts-ignore - TS2339: auto-suppressed
        const hasComponentAnimations = (this.editor._cardElement?._componentAnimations?.length ?? 0) > 0;

        return html`
            <lcards-form-section
                header="Segment Animations"
                description="Animations triggered only when this specific segment is interacted with"
                icon="mdi:animation"
                ?expanded=${false}>

                ${hasComponentAnimations ? html`
                    <lcards-message type="warning">
                        <p style="margin: 0; font-size: 13px; line-height: 1.4;">
                            This component has <strong>card-level animations</strong> defined (visible in the <strong>Effects tab</strong>).
                            Segment animations are independent and work best for interaction triggers like <em>on_tap</em> or <em>on_hover</em>.
                            Avoid redefining the same preset here — it will run in parallel, not replace the card-level animation.
                        </p>
                    </lcards-message>
                ` : html`
                    <lcards-message type="info">
                        <p style="margin: 0; font-size: 13px; line-height: 1.4;">
                            These animations trigger <strong>only for this segment</strong>. For card-wide animations, use the Effects tab.
                        </p>
                    </lcards-message>
                `}

                <lcards-animation-editor
                    // @ts-ignore - TS2339: auto-suppressed
                    .hass=${this.hass}
                    .animations=${animations}
                    // @ts-ignore - TS2339: auto-suppressed
                    .cardElement=${this.editor._cardElement}
                    @animations-changed=${(e) => {
                        // @ts-ignore - TS2339: auto-suppressed
                        this.editor._setConfigValue(`${basePath}.animations`, e.detail.value);
                    }}>
                </lcards-animation-editor>
            </lcards-form-section>
        `;
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

                <lcards-color-section-v2
                    // @ts-ignore - TS2339: auto-suppressed
                    .editor=${this.editor}
                    // @ts-ignore - TS2339: auto-suppressed
                    .config=${this.editor.config}
                    basePath="${basePath}.style.fill"
                    header="Fill"
                    description="SVG fill colour states - supports custom states like 'heat', 'cool', 'playing', etc."
                    .suggestedStates=${['default', 'active', 'inactive', 'unavailable', 'hover', 'pressed']}
                    ?allowCustomStates=${true}
                    ?expanded=${false}>
                </lcards-color-section-v2>

                <lcards-color-section-v2
                    // @ts-ignore - TS2339: auto-suppressed
                    .editor=${this.editor}
                    // @ts-ignore - TS2339: auto-suppressed
                    .config=${this.editor.config}
                    basePath="${basePath}.style.stroke"
                    header="Stroke"
                    description="SVG stroke colour states - supports custom states like 'heat', 'cool', 'playing', etc."
                    .suggestedStates=${['default', 'active', 'inactive', 'unavailable', 'hover', 'pressed']}
                    ?allowCustomStates=${true}
                    ?expanded=${false}>
                </lcards-color-section-v2>

                <ha-selector
                    // @ts-ignore - TS2339: auto-suppressed
                    .hass=${this.hass}
                    .label=${'Stroke Width'}
                    .helper=${'SVG stroke width (overrides default)'}
                    .selector=${{ text: {} }}
                    // @ts-ignore - TS2339: auto-suppressed
                    .value=${this.editor._getConfigValue(`${basePath}.style.stroke-width`) || ''}
                    // @ts-ignore - TS2339: auto-suppressed
                    @value-changed=${(e) => this.editor._setConfigValue(`${basePath}.style.stroke-width`, e.detail.value)}>
                </ha-selector>

                <ha-selector
                    // @ts-ignore - TS2339: auto-suppressed
                    .hass=${this.hass}
                    .label=${'Opacity'}
                    .helper=${'SVG opacity (0.0 = transparent, 1.0 = opaque)'}
                    .selector=${{
                        number: {
                            min: 0,
                            max: 1,
                            step: 0.1,
                            mode: 'box'
                        }
                    }}
                    // @ts-ignore - TS2339: auto-suppressed
                    .value=${this.editor._getConfigValue(`${basePath}.style.opacity`) || ''}
                    // @ts-ignore - TS2339: auto-suppressed
                    @value-changed=${(e) => this.editor._setConfigValue(`${basePath}.style.opacity`, e.detail.value)}>
                </ha-selector>
            </lcards-form-section>
        `;
    }
}

customElements.define('lcards-unified-segment-editor', LCARdSUnifiedSegmentEditor);
