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

import { html, css } from 'lit';
import { LCARdSBaseEditor } from '../base/LCARdSBaseEditor.js';
import { configToYaml } from '../utils/yaml-utils.js';
import { getElbowSchema } from '../../cards/schemas/elbow-schema.js';
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

    static get styles() {
        return [
            super.styles,
            css`
                .theme-info {
                    background: var(--primary-background-color, #f0f0f0);
                    border-left: 3px solid var(--primary-color, #03a9f4);
                    padding: 12px;
                    margin: 8px 0;
                    border-radius: 4px;
                }

                .theme-info .helper-text {
                    margin: 0;
                    color: var(--primary-text-color, #212121);
                }

                .theme-info code {
                    background: var(--secondary-background-color, #e0e0e0);
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-family: 'Courier New', monospace;
                    font-size: 0.9em;
                }
            `
        ];
    }

    /**
     * Get tab definitions for the elbow editor
     * @returns {Array<{label: string, content: Function}>}
     * @private
     */
    _getTabDefinitions() {
        return [
            { label: 'Config', content: () => this._renderFromConfig(this._getConfigTabConfig()) },
            { label: 'Elbow Design', content: () => this._renderElbowDesignTab() },
            { label: 'Text', content: () => this._renderTextTab() },
            { label: 'Actions', content: () => this._renderActionsTab() },
            ...this._getUtilityTabs()
        ];
    }

    /**
     * Config tab - declarative configuration
     */
    _getConfigTabConfig() {
        const elbowType = this.config.elbow?.type || 'header-left';
        const elbowStyle = this._getElbowStyle();

        return [
            {
                type: 'custom',
                render: () => html`
                    <lcards-message
                        type="info"
                        message="Configure your LCARS elbow card. Elbows are positioned borders with rounded corners that create the iconic LCARS interface aesthetic.">
                    </lcards-message>
                `
            },
            {
                type: 'section',
                header: 'Elbow Configuration',
                description: 'Choose elbow position and style',
                icon: 'mdi:vector-polyline',
                expanded: true,
                outlined: true,
                children: [
                    {
                        type: 'custom',
                        render: () => html`
                            <ha-selector
                                .hass=${this.hass}
                                .label=${'Elbow Position'}
                                .helper=${'Position of the elbow corner on the card'}
                                .selector=${{
                                    select: {
                                        mode: 'dropdown',
                                        options: [
                                            { value: 'header-left', label: 'Header Left' },
                                            { value: 'header-right', label: 'Header Right' },
                                            { value: 'footer-left', label: 'Footer Left' },
                                            { value: 'footer-right', label: 'Footer Right' }
                                        ]
                                    }
                                }}
                                .value=${elbowType}
                                @value-changed=${(e) => this._setConfigValue('elbow.type', e.detail.value)}>
                            </ha-selector>

                            <ha-selector
                                .hass=${this.hass}
                                .label=${'Elbow Style'}
                                .helper=${elbowStyle === 'simple'
                                    ? 'Simple: Single elbow with one curve'
                                    : 'Segmented: Double concentric elbows with gap (TNG aesthetic)'}
                                .selector=${{
                                    select: {
                                        mode: 'dropdown',
                                        options: [
                                            { value: 'simple', label: 'Simple (single elbow)' },
                                            { value: 'segmented', label: 'Segmented (Picard-style double)' }
                                        ]
                                    }
                                }}
                                .value=${elbowStyle}
                                @value-changed=${this._handleStyleChange}>
                            </ha-selector>
                        `
                    }
                ]
            },
            {
                type: 'section',
                header: 'Basic Configuration',
                description: 'Core card settings',
                icon: 'mdi:cog',
                expanded: true,
                outlined: true,
                children: [
                    { type: 'field', path: 'entity', label: 'Entity', helper: '[Optional] Entity to control' },
                    { type: 'field', path: 'id', label: 'Card ID', helper: '[Optional] Custom ID for targeting with rules and animations' },
                    { type: 'field', path: 'tags', label: 'Tags', helper: 'Select existing tags or type new ones for rule targeting' }
                ]
            }
        ];
    }

    /**
     * Old direct rendering method - replaced by declarative config above
     * Keeping for reference during migration
     * @deprecated Use _getConfigTabConfig() instead
     * @private
     */
    _renderConfigTab_OLD() {
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

                <ha-selector
                    .hass=${this.hass}
                    .label=${'Elbow Position'}
                    .helper=${'Position of the elbow corner on the card'}
                    .selector=${{
                        select: {
                            mode: 'dropdown',
                            options: [
                                { value: 'header-left', label: 'Header Left' },
                                { value: 'header-right', label: 'Header Right' },
                                { value: 'footer-left', label: 'Footer Left' },
                                { value: 'footer-right', label: 'Footer Right' }
                            ]
                        }
                    }}
                    .value=${elbowType}
                    @value-changed=${(e) => this._setConfigValue('elbow.type', e.detail.value)}>
                </ha-selector>

                <ha-selector
                    .hass=${this.hass}
                    .label=${'Elbow Style'}
                    .helper=${elbowStyle === 'simple'
                        ? 'Simple: Single elbow with one curve'
                        : 'Segmented: Double concentric elbows with gap (TNG aesthetic)'}
                    .selector=${{
                        select: {
                            mode: 'dropdown',
                            options: [
                                { value: 'simple', label: 'Simple (single elbow)' },
                                { value: 'segmented', label: 'Segmented (Picard-style double)' }
                            ]
                        }
                    }}
                    .value=${elbowStyle}
                    @value-changed=${this._handleStyleChange}>
                </ha-selector>
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

                <lcards-form-field
                    .editor=${this}
                    path="tags"
                    label="Tags"
                    helper="Select existing tags or type new ones for rule targeting">
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
        // Preserve 'theme' strings - don't default them to numbers
        const barWidth = segment.bar_width !== undefined ? segment.bar_width : 90;
        const barHeight = segment.bar_height !== undefined ? segment.bar_height : barWidth;
        const outerCurve = segment.outer_curve ?? 'auto';
        const isOuterAuto = outerCurve === 'auto';
        const innerCurve = segment.inner_curve;

        // Calculate auto values for helper text (handle 'theme' case)
        const numericBarWidth = typeof barWidth === 'number' ? barWidth : 90;
        const numericBarHeight = typeof barHeight === 'number' ? barHeight : 90;
        const calculatedOuterCurve = numericBarWidth / 2;
        const calculatedInnerCurve = (isOuterAuto ? calculatedOuterCurve : outerCurve) / 2;

        return html`
            <lcards-message
                type="info"
                message="Configure dimensions and curves for your simple elbow. The diagram below shows what each setting controls.">
            </lcards-message>

            <!-- Visual Diagram -->
            <lcards-form-section
                header="Elbow Geometry Diagram"
                description="Visual reference for understanding elbow dimensions"
                icon="mdi:ruler"
                ?expanded=${true}
                ?outlined=${true}>

                <div style="padding: 20px; background: var(--ha-card-background, #1c1c1c); border-radius: 8px; text-align: center;">
                    <svg viewBox="0 0 400 300" style="max-width: 500px; width: 100%; height: auto;">
                        <!-- Background -->
                        <rect x="0" y="0" width="400" height="300" fill="transparent" stroke="none"/>

                        <!-- Example Elbow (header-left style) -->
                        <g id="elbow-example">
                            <!-- Vertical bar (bar_width controls this) -->
                            <rect x="50" y="50" width="80" height="200" fill="var(--primary-color, #FF9900)" opacity="0.7"/>
                            <!-- Horizontal bar (bar_height controls this) -->
                            <rect x="50" y="50" width="300" height="30" fill="var(--primary-color, #FF9900)" opacity="0.7"/>

                            <!-- Outer arc (outer_curve) -->
                            <path d="M 130 50 A 40 40 0 0 0 50 90"
                                  fill="none"
                                  stroke="var(--accent-color, #00FFFF)"
                                  stroke-width="3"
                                  stroke-dasharray="5,5"/>

                            <!-- Inner arc (inner_curve) -->
                            <path d="M 130 80 A 20 20 0 0 0 110 100"
                                  fill="none"
                                  stroke="var(--warning-color, #FFAA00)"
                                  stroke-width="3"
                                  stroke-dasharray="5,5"/>
                        </g>

                        <!-- Labels with arrows -->
                        <!-- bar_width label -->
                        <line x1="130" y1="150" x2="160" y2="150" stroke="white" stroke-width="2" marker-end="url(#arrowhead)"/>
                        <text x="165" y="155" fill="white" font-size="14" font-weight="bold">bar_width</text>
                        <text x="165" y="170" fill="white" font-size="11" opacity="0.7">(vertical thickness)</text>

                        <!-- bar_height label -->
                        <line x1="200" y1="80" x2="200" y2="35" stroke="white" stroke-width="2" marker-end="url(#arrowhead)"/>
                        <text x="125" y="30" fill="white" font-size="14" font-weight="bold">bar_height</text>
                        <text x="105" y="20" fill="white" font-size="11" opacity="0.7">(horizontal thickness)</text>

                        <!-- outer_curve label -->
                        <line x1="90" y1="70" x2="30" y2="70" stroke="var(--accent-color, #00FFFF)" stroke-width="2" marker-end="url(#arrowhead-cyan)"/>
                        <text x="10" y="50" fill="var(--accent-color, #00FFFF)" font-size="14" font-weight="bold">outer_curve</text>
                        <text x="10" y="65" fill="var(--accent-color, #00FFFF)" font-size="11" opacity="0.9">(outer radius)</text>

                        <!-- inner_curve label -->
                        <line x1="115" y1="95" x2="90" y2="120" stroke="var(--warning-color, #FFAA00)" stroke-width="2" marker-end="url(#arrowhead-yellow)"/>
                        <text x="10" y="135" fill="var(--warning-color, #FFAA00)" font-size="14" font-weight="bold">inner_curve</text>
                        <text x="10" y="150" fill="var(--warning-color, #FFAA00)" font-size="11" opacity="0.9">(inner radius)</text>

                        <!-- Arrow markers -->
                        <defs>
                            <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                                <polygon points="0 0, 10 3, 0 6" fill="white" />
                            </marker>
                            <marker id="arrowhead-cyan" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                                <polygon points="0 0, 10 3, 0 6" fill="var(--accent-color, #00FFFF)" />
                            </marker>
                            <marker id="arrowhead-yellow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                                <polygon points="0 0, 10 3, 0 6" fill="var(--warning-color, #FFAA00)" />
                            </marker>
                        </defs>
                    </svg>
                </div>
            </lcards-form-section>

            <lcards-form-section
                header="Bar Dimensions"
                description="Configure the thickness of the elbow bars (static values or dynamic theme binding)"
                icon="mdi:resize"
                ?expanded=${true}
                ?outlined=${true}>

                <ha-selector
                    .hass=${this.hass}
                    .label=${'Bar Width Mode (Vertical)'}
                    .helper=${barWidth === 'theme'
                        ? '🎨 Dynamic: Binds to input_number.lcars_vertical helper'
                        : '📏 Static: Fixed pixel value'}
                    .selector=${{
                        select: {
                            mode: 'dropdown',
                            options: [
                                { value: 'static', label: 'Static Value' },
                                { value: 'theme', label: 'Theme Binding (input_number.lcars_vertical)' }
                            ]
                        }
                    }}
                    .value=${barWidth === 'theme' ? 'theme' : 'static'}
                    @value-changed=${(e) => this._handleBarWidthModeChange(e)}>
                </ha-selector>

                ${barWidth !== 'theme' ? html`
                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Bar Width (Vertical)'}
                        .helper=${'Thickness of the vertical sidebar'}
                        .selector=${{
                            number: {
                                min: 10,
                                max: 500,
                                step: 5,
                                mode: 'slider',
                                unit_of_measurement: 'px'
                            }
                        }}
                        .value=${typeof barWidth === 'number' ? barWidth : 90}
                        @value-changed=${(e) => this._setConfigValue('elbow.segment.bar_width', e.detail.value)}>
                    </ha-selector>
                ` : html`
                    <div class="form-row theme-info">
                        <div class="helper-text">
                            ℹ️ Bar width will dynamically follow <code>input_number.lcars_vertical</code> entity state.
                            Create this helper in Home Assistant configuration to enable theme integration.
                        </div>
                    </div>
                `}

                <ha-selector
                    .hass=${this.hass}
                    .label=${'Bar Height Mode (Horizontal)'}
                    .helper=${barHeight === 'theme'
                        ? '🎨 Dynamic: Binds to input_number.lcars_horizontal helper'
                        : '📏 Static: Fixed pixel value'}
                    .selector=${{
                        select: {
                            mode: 'dropdown',
                            options: [
                                { value: 'static', label: 'Static Value' },
                                { value: 'theme', label: 'Theme Binding (input_number.lcars_horizontal)' }
                            ]
                        }
                    }}
                    .value=${barHeight === 'theme' ? 'theme' : 'static'}
                    @value-changed=${(e) => this._handleBarHeightModeChange(e)}>
                </ha-selector>

                ${barHeight !== 'theme' ? html`
                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Bar Height (Horizontal)'}
                        .helper=${'Thickness of the horizontal bar'}
                        .selector=${{
                            number: {
                                min: 10,
                                max: 500,
                                step: 5,
                                mode: 'slider',
                                unit_of_measurement: 'px'
                            }
                        }}
                        .value=${typeof barHeight === 'number' ? barHeight : 90}
                        @value-changed=${(e) => this._setConfigValue('elbow.segment.bar_height', e.detail.value)}>
                    </ha-selector>
                ` : html`
                    <div class="form-row theme-info">
                        <div class="helper-text">
                            ℹ️ Bar height will dynamically follow <code>input_number.lcars_horizontal</code> entity state.
                            Create this helper in Home Assistant configuration to enable theme integration.
                        </div>
                    </div>
                `}
            </lcards-form-section>

            <lcards-form-section
                header="Corner Curves"
                description="Configure the rounded corner radii using LCARS formulas"
                icon="mdi:vector-curve"
                ?expanded=${true}
                ?outlined=${true}>

                <div class="form-row">
                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Outer Curve Radius - Enable Manual Mode'}
                        .helper=${isOuterAuto
                            ? `Auto mode active: Outer radius = bar_width ÷ 2 = ${calculatedOuterCurve.toFixed(1)}px (LCARS formula)`
                            : 'Manual mode: Set custom outer curve radius below'}
                        .selector=${{ boolean: {} }}
                        .value=${!isOuterAuto}
                        @value-changed=${this._handleOuterCurveModeChange}>
                    </ha-selector>
                </div>

                ${!isOuterAuto ? html`
                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Outer Curve Radius'}
                        .helper=${'Outer corner radius'}
                        .selector=${{
                            number: {
                                min: 0,
                                max: 250,
                                step: 5,
                                mode: 'slider',
                                unit_of_measurement: 'px'
                            }
                        }}
                        .value=${typeof outerCurve === 'number' ? outerCurve : calculatedOuterCurve}
                        @value-changed=${(e) => this._setConfigValue('elbow.segment.outer_curve', e.detail.value)}>
                    </ha-selector>
                ` : ''}

                <ha-selector
                    .hass=${this.hass}
                    .label=${'Inner Curve Radius'}
                    .helper=${innerCurve !== undefined
                        ? `Current: ${innerCurve}px (default would be ${calculatedInnerCurve.toFixed(1)}px using LCARS formula)`
                        : `Using LCARS formula: outer_curve ÷ 2 = ${calculatedInnerCurve.toFixed(1)}px`}
                    .selector=${{
                        number: {
                            min: 0,
                            max: 250,
                            step: 5,
                            mode: 'slider',
                            unit_of_measurement: 'px'
                        }
                    }}
                    .value=${innerCurve ?? calculatedInnerCurve}
                    @value-changed=${(e) => this._setConfigValue('elbow.segment.inner_curve', e.detail.value)}>
                </ha-selector>
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

                <ha-selector
                    .hass=${this.hass}
                    .label=${'Segment Gap'}
                    .helper=${`Gap between outer and inner segments (default: 4px)`}
                    .selector=${{
                        number: {
                            min: 0,
                            max: 50,
                            step: 1,
                            mode: 'slider',
                            unit_of_measurement: 'px'
                        }
                    }}
                    .value=${gap}
                    @value-changed=${(e) => this._setConfigValue('elbow.segments.gap', e.detail.value)}>
                </ha-selector>
            </lcards-form-section>

            <lcards-form-section
                header="Outer Segment (Frame)"
                description="Outer elbow dimensions and color"
                icon="mdi:vector-square"
                ?expanded=${true}
                ?outlined=${true}>

                <ha-selector
                    .hass=${this.hass}
                    .label=${'Bar Width'}
                    .helper=${'Vertical bar thickness'}
                    .selector=${{
                        number: {
                            min: 10,
                            max: 500,
                            step: 5,
                            mode: 'slider',
                            unit_of_measurement: 'px'
                        }
                    }}
                    .value=${outerSegment.bar_width ?? 90}
                    @value-changed=${(e) => this._setConfigValue('elbow.segments.outer_segment.bar_width', e.detail.value)}>
                </ha-selector>

                <ha-selector
                    .hass=${this.hass}
                    .label=${'Bar Height'}
                    .helper=${'Horizontal bar thickness'}
                    .selector=${{
                        number: {
                            min: 10,
                            max: 500,
                            step: 5,
                            mode: 'slider',
                            unit_of_measurement: 'px'
                        }
                    }}
                    .value=${outerSegment.bar_height ?? outerSegment.bar_width ?? 90}
                    @value-changed=${(e) => this._setConfigValue('elbow.segments.outer_segment.bar_height', e.detail.value)}>
                </ha-selector>

                <ha-selector
                    .hass=${this.hass}
                    .label=${'Outer Curve'}
                    .helper=${'Outer corner radius'}
                    .selector=${{
                        number: {
                            min: 0,
                            max: 250,
                            step: 5,
                            mode: 'slider',
                            unit_of_measurement: 'px'
                        }
                    }}
                    .value=${outerSegment.outer_curve ?? (outerSegment.bar_width ?? 90) / 2}
                    @value-changed=${(e) => this._setConfigValue('elbow.segments.outer_segment.outer_curve', e.detail.value)}>
                </ha-selector>

                <ha-selector
                    .hass=${this.hass}
                    .label=${'Inner Curve'}
                    .helper=${'Inner corner radius'}
                    .selector=${{
                        number: {
                            min: 0,
                            max: 250,
                            step: 5,
                            mode: 'slider',
                            unit_of_measurement: 'px'
                        }
                    }}
                    .value=${outerSegment.inner_curve ?? (outerSegment.outer_curve ?? (outerSegment.bar_width ?? 90) / 2) / 2}
                    @value-changed=${(e) => this._setConfigValue('elbow.segments.outer_segment.inner_curve', e.detail.value)}>
                </ha-selector>

                <div class="form-row">
                    <label>Outer Segment Color</label>
                    <lcards-color-picker
                        .value=${typeof outerSegment.color === 'string' ? outerSegment.color : outerSegment.color?.default || ''}
                        @value-changed=${(e) => this._setConfigValue('elbow.segments.outer_segment.color', e.detail.value)}
                        .variablePrefixes=${['--lcards-', '--lcars-', '--cblcars-', '--picard-']}>
                    </lcards-color-picker>
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
                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Manual Mode'}
                        .helper=${isInnerOuterCurveManual
                            ? 'Manual mode: custom inner segment outer curve'
                            : 'Auto mode: calculated for concentricity with outer segment'}
                        .selector=${{ boolean: {} }}
                        .value=${isInnerOuterCurveManual}
                        @value-changed=${this._handleInnerOuterCurveToggle}>
                    </ha-selector>
                </div>

                <ha-selector
                    .hass=${this.hass}
                    .label=${'Bar Width'}
                    .helper=${'Vertical bar thickness'}
                    .selector=${{
                        number: {
                            min: 10,
                            max: 500,
                            step: 5,
                            mode: 'slider',
                            unit_of_measurement: 'px'
                        }
                    }}
                    .value=${innerSegment.bar_width ?? 60}
                    @value-changed=${(e) => this._setConfigValue('elbow.segments.inner_segment.bar_width', e.detail.value)}>
                </ha-selector>

                <ha-selector
                    .hass=${this.hass}
                    .label=${'Bar Height'}
                    .helper=${'Horizontal bar thickness'}
                    .selector=${{
                        number: {
                            min: 10,
                            max: 500,
                            step: 5,
                            mode: 'slider',
                            unit_of_measurement: 'px'
                        }
                    }}
                    .value=${innerSegment.bar_height ?? innerSegment.bar_width ?? 60}
                    @value-changed=${(e) => this._setConfigValue('elbow.segments.inner_segment.bar_height', e.detail.value)}>
                </ha-selector>

                ${isInnerOuterCurveManual ? html`
                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Outer Curve'}
                        .helper=${'Outer corner radius'}
                        .selector=${{
                            number: {
                                min: 0,
                                max: 250,
                                step: 5,
                                mode: 'slider',
                                unit_of_measurement: 'px'
                            }
                        }}
                        .value=${innerSegment.outer_curve ?? this._calculateInnerOuterCurveAuto()}
                        @value-changed=${(e) => this._setConfigValue('elbow.segments.inner_segment.outer_curve', e.detail.value)}>
                    </ha-selector>
                ` : ''}

                <ha-selector
                    .hass=${this.hass}
                    .label=${'Inner Curve'}
                    .helper=${'Inner corner radius'}
                    .selector=${{
                        number: {
                            min: 0,
                            max: 250,
                            step: 5,
                            mode: 'slider',
                            unit_of_measurement: 'px'
                        }
                    }}
                    .value=${innerSegment.inner_curve ?? (innerSegment.outer_curve ?? this._calculateInnerOuterCurveAuto()) / 2}
                    @value-changed=${(e) => this._setConfigValue('elbow.segments.inner_segment.inner_curve', e.detail.value)}>
                </ha-selector>

                <div class="form-row">
                    <label>Inner Segment Color</label>
                    <lcards-color-picker
                        .value=${typeof innerSegment.color === 'string' ? innerSegment.color : innerSegment.color?.default || ''}
                        @value-changed=${(e) => this._setConfigValue('elbow.segments.inner_segment.color', e.detail.value)}
                        .variablePrefixes=${['--lcards-', '--lcars-', '--cblcars-', '--picard-']}>
                    </lcards-color-picker>
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
    /**
     * Get Advanced tab configuration
     * @returns {Array} Advanced tab config
     * @protected
     */
    _getAdvancedTabConfig() {
        return [
            {
                type: 'custom',
                render: () => html`
                    <lcards-message
                        type="info"
                        message="Advanced features for custom styling and animations.">
                    </lcards-message>
                `
            },
            {
                type: 'section',
                header: 'Advanced Options',
                description: 'Additional configuration options',
                icon: 'mdi:cog',
                expanded: true,
                outlined: true,
                children: [
                    { type: 'field', path: 'css_class', label: 'Custom CSS Class', helper: 'Add custom CSS class for styling' }
                ]
            }
        ];
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
        const newType = event.detail.value;
        this._setConfigValue('elbow.type', newType);
    }

    /**
     * Handle style change (simple vs segmented)
     * @param {CustomEvent} event
     * @private
     */
    _handleStyleChange(event) {
        const newStyle = event.detail.value;
        const currentStyle = this._getElbowStyle();

        if (newStyle === currentStyle) return;

        // Get schema to pull defaults
        const schema = getElbowSchema({
            availablePresets: [],
            positionEnum: []
        });

        // Create new elbow config with appropriate structure
        const newElbowConfig = {
            type: this.config.elbow?.type || 'header-left',
            style: newStyle
        };

        if (newStyle === 'simple') {
            // Initialize simple style structure using schema defaults
            const segmentDefaults = schema.properties.elbow.properties.segment.default || {
                bar_width: 90,
                bar_height: 90,
                outer_curve: 'auto'
            };
            newElbowConfig.segment = { ...segmentDefaults };
            // Don't copy over segments config
        } else {
            // Initialize segmented style structure using schema defaults
            const segmentsDefaults = schema.properties.elbow.properties.segments.default || {
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
            newElbowConfig.segments = JSON.parse(JSON.stringify(segmentsDefaults)); // Deep clone
            // Don't copy over segment config
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
        const isManual = event.detail.value;

        if (isManual) {
            // Switch to manual mode - set a numeric value
            const barWidth = this.config.elbow?.segment?.bar_width;
            // Handle 'theme' - use default numeric value for calculation
            const numericBarWidth = typeof barWidth === 'number' ? barWidth : 90;
            const calculatedValue = numericBarWidth / 2;
            this._setConfigValue('elbow.segment.outer_curve', calculatedValue);
        } else {
            // Switch to auto mode
            this._setConfigValue('elbow.segment.outer_curve', 'auto');
        }

        this.requestUpdate();
    }

    /**
     * Handle bar width mode change (static vs theme)
     * @param {CustomEvent} event
     * @private
     */
    _handleBarWidthModeChange(event) {
        const newMode = event.detail.value;

        if (newMode === 'theme') {
            // Switch to theme mode
            this._setConfigValue('elbow.segment.bar_width', 'theme');
        } else {
            // Switch to static mode - use default or current numeric value
            const currentValue = this.config.elbow?.segment?.bar_width;
            const defaultValue = typeof currentValue === 'number' ? currentValue : 90;
            this._setConfigValue('elbow.segment.bar_width', defaultValue);
        }

        this.requestUpdate();
    }

    /**
     * Handle bar height mode change (static vs theme)
     * @param {CustomEvent} event
     * @private
     */
    _handleBarHeightModeChange(event) {
        const newMode = event.detail.value;

        if (newMode === 'theme') {
            // Switch to theme mode
            this._setConfigValue('elbow.segment.bar_height', 'theme');
        } else {
            // Switch to static mode - use default or current numeric value
            const currentValue = this.config.elbow?.segment?.bar_height;
            const defaultValue = typeof currentValue === 'number' ? currentValue : 90;
            this._setConfigValue('elbow.segment.bar_height', defaultValue);
        }

        this.requestUpdate();
    }

    /**
     * Handle inner segment outer curve override toggle
     * @param {CustomEvent} event
     * @private
     */
    _handleInnerOuterCurveToggle(event) {
        const isManual = event.detail.value;

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

    /**
     * Delete a config value by path
     * @param {string} path - Dot-notation path
     * @private
     */
    _deleteConfigValue(path) {
        const newConfig = { ...this.config };
        const keys = path.split('.');
        let current = newConfig;

        // Navigate to parent
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) return; // Path doesn't exist
            current = current[keys[i]];
        }

        // Delete the final key
        delete current[keys[keys.length - 1]];

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

customElements.define('lcards-elbow-editor', LCARdSElbowEditor);
