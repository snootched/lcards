/**
 * LCARdS Elbow Editor
 *
 * Visual editor for LCARdS Elbow card with specialized UI for elbow geometry configuration.
 * Elbow cards extend lcards-button with LCARS elbow/corner treatments featuring 4 positions
 * and 2 styles (simple/segmented).
 *
 * Features:
 * - 7 main tabs: Config, Elbow Design, Text, Actions, Advanced, + 6 utility tabs
 * - Dynamic Elbow Design tab (changes based on simple/segmented style)
 * - Auto-calculation helpers for LCARS-formula curves
 * - State-based color editing for simple style
 * - Individual color pickers for segmented style segments
 * - Inherits button card functionality (text, actions, etc.)
 */

import { html } from 'lit';
import { LCARdSBaseEditor } from '../base/LCARdSBaseEditor.js';
import { configToYaml } from '../utils/yaml-utils.js';
import '../components/shared/lcards-message.js';
import '../components/yaml/lcards-yaml-editor.js';
// Import shared form components
import '../components/shared/lcards-form-field.js';
import '../components/shared/lcards-form-section.js';
import '../components/shared/lcards-color-picker.js';
// Import specialized editor components
import '../components/editors/lcards-grid-layout.js';
import '../components/editors/lcards-color-section.js';
import '../components/editors/lcards-multi-text-editor.js';
import '../components/editors/lcards-multi-action-editor.js';
// Import dashboard components
import '../components/dashboard/lcards-rules-dashboard.js';
// Import datasource components
import '../components/datasources/lcards-datasource-editor-tab.js';
// Import template components
import '../components/templates/lcards-template-evaluation-tab.js';
import '../components/theme-browser/lcards-theme-token-browser-tab.js';
import '../components/provenance/lcards-provenance-tab.js';

export class LCARdSElbowEditor extends LCARdSBaseEditor {

    constructor() {
        super();
        this.cardType = 'elbow';
    }

    /**
     * Get tab definitions for the elbow editor
     * @returns {Array<{label: string, content: Function}>}
     * @private
     */
    _getTabDefinitions() {
        return [
            { label: 'Config', content: () => this._renderConfigTab() },
            { label: 'Elbow Design', content: () => this._renderElbowDesignTab() },
            { label: 'Text', content: () => this._renderTextTab() },
            { label: 'Actions', content: () => this._renderActionsTab() },
            { label: 'Advanced', content: () => this._renderAdvancedTab() },
            { label: 'Data Sources', content: () => this._renderDataSourcesTab() },
            { label: 'Rules', content: () => this._renderRulesTab() },
            { label: 'Templates', content: () => this._renderTemplatesTab() },
            { label: 'Theme Browser', content: () => this._renderThemeTokensTab() },
            { label: 'Provenance', content: () => this._renderProvenanceTab() },
            { label: 'YAML', content: () => this._renderYamlTab() }
        ];
    }

    /**
     * Config tab - Basic elbow configuration
     * @returns {TemplateResult}
     * @private
     */
    _renderConfigTab() {
        const elbowType = this.config.elbow?.type || 'header-left';
        const elbowStyle = this._getElbowStyle();

        return html`
            <lcards-message
                type="info"
                message="Configure your LCARS elbow card. Elbows are positioned borders with rounded corners that create the iconic LCARS interface aesthetic.">
            </lcards-message>

            <lcards-form-section
                header="Elbow Configuration"
                description="Choose elbow position and style"
                icon="mdi:vector-polyline"
                ?expanded=${true}
                ?outlined=${true}>
                
                <div class="form-row">
                    <label>Elbow Position</label>
                    <ha-select
                        .value=${elbowType}
                        @selected=${this._handleElbowTypeChange}
                        @closed=${(e) => e.stopPropagation()}>
                        <mwc-list-item value="header-left">Header Left</mwc-list-item>
                        <mwc-list-item value="header-right">Header Right</mwc-list-item>
                        <mwc-list-item value="footer-left">Footer Left</mwc-list-item>
                        <mwc-list-item value="footer-right">Footer Right</mwc-list-item>
                    </ha-select>
                    <div class="helper-text">
                        Position of the elbow corner on the card
                    </div>
                </div>

                <div class="form-row">
                    <label>Elbow Style</label>
                    <ha-select
                        .value=${elbowStyle}
                        @selected=${this._handleStyleChange}
                        @closed=${(e) => e.stopPropagation()}>
                        <mwc-list-item value="simple">Simple (single elbow)</mwc-list-item>
                        <mwc-list-item value="segmented">Segmented (Picard-style double)</mwc-list-item>
                    </ha-select>
                    <div class="helper-text">
                        ${elbowStyle === 'simple'
                            ? 'Simple: Single elbow with one curve'
                            : 'Segmented: Double concentric elbows with gap (TNG aesthetic)'}
                    </div>
                </div>
            </lcards-form-section>

            <lcards-form-section
                header="Basic Configuration"
                description="Core card settings"
                icon="mdi:cog"
                ?expanded=${true}
                ?outlined=${true}>
                
                <lcards-form-field
                    .editor=${this}
                    path="entity"
                    label="Entity"
                    helper="[Optional] Entity to control">
                </lcards-form-field>

                <lcards-form-field
                    .editor=${this}
                    path="id"
                    label="Card ID"
                    helper="[Optional] Custom ID for targeting with rules and animations">
                </lcards-form-field>
            </lcards-form-section>
        `;
    }

    /**
     * Elbow Design tab - Geometry and colors configuration
     * Dynamically changes based on simple vs segmented style
     * @returns {TemplateResult}
     * @private
     */
    _renderElbowDesignTab() {
        const elbowStyle = this._getElbowStyle();

        if (elbowStyle === 'segmented') {
            return this._renderSegmentedDesign();
        } else {
            return this._renderSimpleDesign();
        }
    }

    /**
     * Render simple style design section
     * @returns {TemplateResult}
     * @private
     */
    _renderSimpleDesign() {
        const segment = this.config.elbow?.segment || {};
        const barWidth = segment.bar_width ?? 90;
        const barHeight = segment.bar_height ?? barWidth;
        const outerCurve = segment.outer_curve ?? 'auto';
        const isOuterAuto = outerCurve === 'auto';
        const innerCurve = segment.inner_curve;

        // Calculate auto values for helper text
        const calculatedOuterCurve = barWidth / 2;
        const calculatedInnerCurve = (isOuterAuto ? calculatedOuterCurve : outerCurve) / 2;

        return html`
            <lcards-message
                type="info"
                message="Configure dimensions and curves for your simple elbow. Use 'auto' mode for authentic LCARS geometry (outer curve = bar_width / 2).">
            </lcards-message>

            <lcards-form-section
                header="Elbow Dimensions"
                description="Configure bar thickness"
                icon="mdi:resize"
                ?expanded=${true}
                ?outlined=${true}>
                
                <lcards-grid-layout columns="2">
                    <lcards-form-field
                        .editor=${this}
                        path="elbow.segment.bar_width"
                        label="Bar Width (Vertical)"
                        type="number"
                        helper="Thickness of the vertical sidebar (pixels)">
                    </lcards-form-field>

                    <lcards-form-field
                        .editor=${this}
                        path="elbow.segment.bar_height"
                        label="Bar Height (Horizontal)"
                        type="number"
                        helper="Thickness of the horizontal bar (pixels)">
                    </lcards-form-field>
                </lcards-grid-layout>
            </lcards-form-section>

            <lcards-form-section
                header="Elbow Curves"
                description="Configure corner radii using LCARS formulas"
                icon="mdi:vector-curve"
                ?expanded=${true}
                ?outlined=${true}>
                
                <div class="form-row">
                    <label>Outer Curve Mode</label>
                    <ha-switch
                        .checked=${!isOuterAuto}
                        @change=${this._handleOuterCurveModeChange}>
                    </ha-switch>
                    <div class="helper-text">
                        ${isOuterAuto
                            ? `Auto mode: outer_curve = bar_width / 2 = ${calculatedOuterCurve.toFixed(1)}px`
                            : 'Manual mode: specify custom outer curve radius'}
                    </div>
                </div>

                ${!isOuterAuto ? html`
                    <lcards-form-field
                        .editor=${this}
                        path="elbow.segment.outer_curve"
                        label="Outer Curve Radius"
                        type="number"
                        helper="Outer corner radius (pixels)">
                    </lcards-form-field>
                ` : ''}

                <lcards-form-field
                    .editor=${this}
                    path="elbow.segment.inner_curve"
                    label="Inner Curve Radius"
                    type="number"
                    helper="${this._getInnerCurveHelperText(calculatedInnerCurve, innerCurve)}">
                </lcards-form-field>
            </lcards-form-section>

            <lcards-form-section
                header="Elbow Colors"
                description="State-based colors for the elbow"
                icon="mdi:palette"
                ?expanded=${true}
                ?outlined=${true}>
                
                <lcards-color-section
                    .editor=${this}
                    basePath="elbow.segment.color"
                    header="Segment Colors"
                    description="Elbow segment color for each state"
                    .states=${['default', 'active', 'inactive', 'unavailable']}
                    ?expanded=${false}>
                </lcards-color-section>
            </lcards-form-section>
        `;
    }

    /**
     * Render segmented style design section
     * @returns {TemplateResult}
     * @private
     */
    _renderSegmentedDesign() {
        const segments = this.config.elbow?.segments || {};
        const gap = segments.gap ?? 4;
        const outerSegment = segments.outer_segment || {};
        const innerSegment = segments.inner_segment || {};
        
        const isInnerOuterCurveManual = innerSegment.outer_curve !== undefined;

        return html`
            <lcards-message
                type="info"
                message="Configure your segmented (Picard-style) double elbow with outer and inner concentric segments.">
            </lcards-message>

            <lcards-form-section
                header="Segment Spacing"
                description="Gap between outer and inner segments"
                icon="mdi:resize"
                ?expanded=${true}
                ?outlined=${true}>
                
                <lcards-form-field
                    .editor=${this}
                    path="elbow.segments.gap"
                    label="Segment Gap"
                    type="number"
                    helper="Gap between outer and inner segments (pixels, default: 4)">
                </lcards-form-field>
            </lcards-form-section>

            <lcards-form-section
                header="Outer Segment (Frame)"
                description="Outer elbow dimensions and color"
                icon="mdi:vector-square"
                ?expanded=${true}
                ?outlined=${true}>
                
                <lcards-grid-layout columns="2">
                    <lcards-form-field
                        .editor=${this}
                        path="elbow.segments.outer_segment.bar_width"
                        label="Bar Width"
                        type="number"
                        helper="Vertical bar thickness (pixels)">
                    </lcards-form-field>

                    <lcards-form-field
                        .editor=${this}
                        path="elbow.segments.outer_segment.bar_height"
                        label="Bar Height"
                        type="number"
                        helper="Horizontal bar thickness (pixels)">
                    </lcards-form-field>

                    <lcards-form-field
                        .editor=${this}
                        path="elbow.segments.outer_segment.outer_curve"
                        label="Outer Curve"
                        type="number"
                        helper="Outer corner radius (pixels)">
                    </lcards-form-field>

                    <lcards-form-field
                        .editor=${this}
                        path="elbow.segments.outer_segment.inner_curve"
                        label="Inner Curve"
                        type="number"
                        helper="Inner corner radius (pixels)">
                    </lcards-form-field>
                </lcards-grid-layout>

                <div class="form-row">
                    <label>Outer Segment Color</label>
                    <lcards-color-picker
                        .value=${outerSegment.color || ''}
                        @value-changed=${(e) => this._setConfigValue('elbow.segments.outer_segment.color', e.detail.value)}
                        .variablePrefixes=${['--lcards-', '--lcars-', '--cblcars-', '--picard-']}>
                    </lcards-color-picker>
                    <div class="helper-text">
                        Solid color for outer segment
                    </div>
                </div>
            </lcards-form-section>

            <lcards-form-section
                header="Inner Segment (Content Area)"
                description="Inner elbow dimensions and color"
                icon="mdi:vector-square-open"
                ?expanded=${true}
                ?outlined=${true}>
                
                <div class="form-row">
                    <label>Manual Outer Curve Override</label>
                    <ha-switch
                        .checked=${isInnerOuterCurveManual}
                        @change=${this._handleInnerOuterCurveToggle}>
                    </ha-switch>
                    <div class="helper-text">
                        ${isInnerOuterCurveManual
                            ? 'Manual mode: custom inner segment outer curve'
                            : 'Auto mode: inner curve calculated for concentricity with outer segment'}
                    </div>
                </div>

                <lcards-grid-layout columns="2">
                    <lcards-form-field
                        .editor=${this}
                        path="elbow.segments.inner_segment.bar_width"
                        label="Bar Width"
                        type="number"
                        helper="Vertical bar thickness (pixels)">
                    </lcards-form-field>

                    <lcards-form-field
                        .editor=${this}
                        path="elbow.segments.inner_segment.bar_height"
                        label="Bar Height"
                        type="number"
                        helper="Horizontal bar thickness (pixels)">
                    </lcards-form-field>

                    ${isInnerOuterCurveManual ? html`
                        <lcards-form-field
                            .editor=${this}
                            path="elbow.segments.inner_segment.outer_curve"
                            label="Outer Curve"
                            type="number"
                            helper="Outer corner radius (pixels)">
                        </lcards-form-field>
                    ` : ''}

                    <lcards-form-field
                        .editor=${this}
                        path="elbow.segments.inner_segment.inner_curve"
                        label="Inner Curve"
                        type="number"
                        helper="Inner corner radius (pixels)">
                    </lcards-form-field>
                </lcards-grid-layout>

                <div class="form-row">
                    <label>Inner Segment Color</label>
                    <lcards-color-picker
                        .value=${innerSegment.color || ''}
                        @value-changed=${(e) => this._setConfigValue('elbow.segments.inner_segment.color', e.detail.value)}
                        .variablePrefixes=${['--lcards-', '--lcars-', '--cblcars-', '--picard-']}>
                    </lcards-color-picker>
                    <div class="helper-text">
                        Solid color for inner segment
                    </div>
                </div>
            </lcards-form-section>
        `;
    }

    /**
     * Text tab - uses multi-text editor (inherited from button)
     * @returns {TemplateResult}
     * @private
     */
    _renderTextTab() {
        return html`
            <lcards-multi-text-editor
                .editor=${this}
                .hass=${this.hass}>
            </lcards-multi-text-editor>
        `;
    }

    /**
     * Actions tab - uses multi-action editor (card-level actions only)
     * @returns {TemplateResult}
     * @private
     */
    _renderActionsTab() {
        return html`
            <lcards-multi-action-editor
                .hass=${this.hass}
                .actions=${{
                    tap_action: this.config.tap_action,
                    hold_action: this.config.hold_action,
                    double_tap_action: this.config.double_tap_action
                }}
                @value-changed=${this._handleActionsChange}>
            </lcards-multi-action-editor>
        `;
    }

    /**
     * Advanced tab - CSS classes and animations
     * @returns {TemplateResult}
     * @private
     */
    _renderAdvancedTab() {
        return html`
            <lcards-message
                type="info"
                message="Advanced features for custom styling and animations.">
            </lcards-message>

            <lcards-form-section
                header="Advanced Options"
                description="Additional configuration options"
                icon="mdi:cog"
                ?expanded=${true}
                ?outlined=${true}>
                
                <lcards-form-field
                    .editor=${this}
                    path="css_class"
                    label="Custom CSS Class"
                    helper="Add custom CSS class for styling">
                </lcards-form-field>
            </lcards-form-section>
        `;
    }

    /**
     * Data Sources tab - datasource editor with ribbon navigation
     * @returns {TemplateResult}
     * @private
     */
    _renderDataSourcesTab() {
        return html`
            <lcards-datasource-editor-tab
                .editor=${this}
                .config=${this.config}
                .hass=${this.hass}>
            </lcards-datasource-editor-tab>
        `;
    }

    /**
     * Rules tab - display-only rules dashboard
     * @returns {TemplateResult}
     * @private
     */
    _renderRulesTab() {
        return html`
            <lcards-rules-dashboard
                .editor=${this}
                .cardId=${this.config.id || this.config.cardId || ''}
                .hass=${this.hass}>
            </lcards-rules-dashboard>
        `;
    }

    /**
     * Templates tab - template evaluation and debugging
     * @returns {TemplateResult}
     * @private
     */
    _renderTemplatesTab() {
        return html`
            <lcards-template-evaluation-tab
                .editor=${this}
                .config=${this.config}
                .hass=${this.hass}>
            </lcards-template-evaluation-tab>
        `;
    }

    /**
     * Theme Tokens tab - theme token browser
     * @returns {TemplateResult}
     * @private
     */
    _renderThemeTokensTab() {
        return html`
            <lcards-theme-token-browser-tab
                .editor=${this}
                .config=${this.config}
                .hass=${this.hass}>
            </lcards-theme-token-browser-tab>
        `;
    }

    /**
     * Provenance tab - provenance inspector
     * @returns {TemplateResult}
     * @private
     */
    _renderProvenanceTab() {
        return html`
            <lcards-provenance-tab
                .editor=${this}
                .config=${this.config}
                .hass=${this.hass}>
            </lcards-provenance-tab>
        `;
    }

    // ==================== Helper Methods ====================

    /**
     * Get current elbow style (simple or segmented)
     * @returns {string} 'simple' or 'segmented'
     * @private
     */
    _getElbowStyle() {
        return this.config.elbow?.style || 'simple';
    }

    /**
     * Get inner curve helper text showing LCARS formula calculation
     * @param {number} calculatedValue - Auto-calculated inner curve value
     * @param {number|undefined} currentValue - Current inner curve value
     * @returns {string}
     * @private
     */
    _getInnerCurveHelperText(calculatedValue, currentValue) {
        if (currentValue !== undefined) {
            return `Current: ${currentValue}px (default would be ${calculatedValue.toFixed(1)}px using LCARS formula: outer / 2)`;
        }
        return `LCARS formula: outer_curve / 2 = ${calculatedValue.toFixed(1)}px (default if not specified)`;
    }

    // ==================== Event Handlers ====================

    /**
     * Handle elbow type change (header-left, header-right, etc.)
     * @param {CustomEvent} event
     * @private
     */
    _handleElbowTypeChange(event) {
        const newType = event.target.value;
        this._setConfigValue('elbow.type', newType);
    }

    /**
     * Handle style change (simple vs segmented)
     * @param {CustomEvent} event
     * @private
     */
    _handleStyleChange(event) {
        const newStyle = event.target.value;
        const currentStyle = this._getElbowStyle();

        if (newStyle === currentStyle) return;

        // Create new elbow config with appropriate structure
        const newElbowConfig = {
            type: this.config.elbow?.type || 'header-left',
            style: newStyle
        };

        if (newStyle === 'simple') {
            // Initialize simple style structure
            newElbowConfig.segment = {
                bar_width: 90,
                bar_height: 90,
                outer_curve: 'auto',
                inner_curve: undefined // Will use LCARS formula
            };
        } else {
            // Initialize segmented style structure
            newElbowConfig.segments = {
                gap: 4,
                outer_segment: {
                    bar_width: 90,
                    bar_height: 90
                },
                inner_segment: {
                    bar_width: 60,
                    bar_height: 60
                }
            };
        }

        this._setConfigValue('elbow', newElbowConfig);
        this.requestUpdate();
    }

    /**
     * Handle outer curve mode toggle (auto vs manual)
     * @param {CustomEvent} event
     * @private
     */
    _handleOuterCurveModeChange(event) {
        const isManual = event.target.checked;
        
        if (isManual) {
            // Switch to manual mode - set a numeric value
            const barWidth = this.config.elbow?.segment?.bar_width ?? 90;
            const calculatedValue = barWidth / 2;
            this._setConfigValue('elbow.segment.outer_curve', calculatedValue);
        } else {
            // Switch to auto mode
            this._setConfigValue('elbow.segment.outer_curve', 'auto');
        }
        
        this.requestUpdate();
    }

    /**
     * Handle inner segment outer curve override toggle
     * @param {CustomEvent} event
     * @private
     */
    _handleInnerOuterCurveToggle(event) {
        const isManual = event.target.checked;
        
        if (isManual) {
            // Switch to manual mode - calculate initial concentric value
            const calculatedValue = this._calculateInnerOuterCurveAuto();
            this._setConfigValue('elbow.segments.inner_segment.outer_curve', calculatedValue);
        } else {
            // Switch to auto mode - remove the property
            const newConfig = { ...this.config };
            if (newConfig.elbow?.segments?.inner_segment?.outer_curve !== undefined) {
                delete newConfig.elbow.segments.inner_segment.outer_curve;
                this.config = newConfig;
                this._validateConfig();
                this._yamlValue = configToYaml(this.config);
                
                this.dispatchEvent(new CustomEvent('config-changed', {
                    detail: { config: this.config },
                    bubbles: true,
                    composed: true
                }));
            }
        }
        
        this.requestUpdate();
    }

    /**
     * Calculate auto-concentric outer curve for inner segment
     * @returns {number}
     * @private
     */
    _calculateInnerOuterCurveAuto() {
        const outerSegment = this.config.elbow?.segments?.outer_segment || {};
        const gap = this.config.elbow?.segments?.gap ?? 4;
        const outerBarWidth = outerSegment.bar_width ?? 90;
        const innerBarWidth = this.config.elbow?.segments?.inner_segment?.bar_width ?? 60;
        const outerCurve = outerSegment.outer_curve ?? (outerBarWidth / 2);

        // Concentric calculation: outer segment's outer curve - gap - inner segment's bar width
        return Math.max(0, outerCurve - gap - innerBarWidth);
    }

    /**
     * Handle actions change from multi-action editor
     * @param {CustomEvent} event
     * @private
     */
    _handleActionsChange(event) {
        const actions = event.detail.value;

        // Create update object, only including defined actions
        const updates = {};

        // Add actions that are actually configured
        if (actions.tap_action) {
            updates.tap_action = actions.tap_action;
        }
        if (actions.hold_action) {
            updates.hold_action = actions.hold_action;
        }
        if (actions.double_tap_action) {
            updates.double_tap_action = actions.double_tap_action;
        }

        // Remove actions that are no longer in the actions object
        const newConfig = { ...this.config, ...updates };

        if (!actions.tap_action && this.config.tap_action) {
            delete newConfig.tap_action;
        }
        if (!actions.hold_action && this.config.hold_action) {
            delete newConfig.hold_action;
        }
        if (!actions.double_tap_action && this.config.double_tap_action) {
            delete newConfig.double_tap_action;
        }

        // Update entire config with cleaned version
        this.config = newConfig;
        this._validateConfig();
        this._yamlValue = configToYaml(this.config);

        // Fire config-changed event
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this.config },
            bubbles: true,
            composed: true
        }));
    }
}

customElements.define('lcards-elbow-editor', LCARdSElbowEditor);
