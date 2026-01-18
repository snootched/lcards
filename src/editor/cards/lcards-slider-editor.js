/**
 * LCARdS Slider Editor
 *
 * Visual configuration editor for slider cards.
 * 5-tab structure with utility tabs from base class.
 *
 * @extends {LCARdSBaseEditor}
 */

import { html } from 'lit';
import { lcardsLog } from '../../utils/lcards-logging.js';
import { LCARdSBaseEditor } from '../base/LCARdSBaseEditor.js';
import { deepMerge } from '../../utils/deepMerge.js';

// Import shared form components
import '../components/editors/lcards-color-section.js';
import '../components/editors/lcards-color-section-v2.js';
import '../components/editors/lcards-border-editor.js';
import '../components/editors/lcards-object-editor.js';
import '../components/editors/lcards-grid-layout.js';
import '../components/shared/lcards-message.js';
import { LCARdSFormFieldHelper as FormField } from '../components/shared/lcards-form-field.js';
import '../components/shared/lcards-form-section.js';

// Import specialized editor components
import '../components/editors/lcards-multi-text-editor.js';
import '../components/editors/lcards-multi-action-editor.js';

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

/**
 * Slider configuration state manager
 * Tracks component, preset, track type, and orientation
 * @private
 */
class SliderConfigState {
    constructor(config) {
        this.config = config;
    }

    // Component: Provides shell SVG (basic, picard, etc.)
    get component() {
        return this.config.component || 'basic';
    }

    // Preset: Provides style defaults (pills-basic, gauge-basic, etc.)
    get preset() {
        return this.config.preset || null;
    }

    // Track type: Visual rendering style (pills or gauge)
    get trackType() {
        return this.config.style?.track?.type || 'pills';
    }

    // Orientation: Layout direction (horizontal or vertical)
    get orientation() {
        return this.config.style?.track?.orientation || 'horizontal';
    }

    /**
     * Get configuration source priority
     * @returns {'preset' | 'component' | 'manual'}
     */
    getConfigSource() {
        if (this.preset) return 'preset';
        if (this.component) return 'component';
        return 'manual';
    }
}

export class LCARdSSliderEditor extends LCARdSBaseEditor {

    constructor() {
        super();
        this.cardType = 'slider';
        lcardsLog.debug('[LCARdSSliderEditor] Editor initialized with cardType: slider (5 tabs + utility tabs)');
    }

    /**
     * Get slider configuration state manager
     * @returns {SliderConfigState}
     * @private
     */
    _getSliderState() {
        return new SliderConfigState(this.config);
    }

    /**
     * Define editor tabs - 5 tabs + utility tabs from base class
     * @returns {Array} Tab definitions
     * @protected
     */
    _getTabDefinitions() {
        return [
            { label: 'Config', content: () => this._renderFromConfig(this._getConfigTabConfig()) },
            { label: 'Slider Track', content: () => this._renderTrackTab() },
            { label: 'Borders', content: () => this._renderBordersTab() },
            { label: 'Text Fields', content: () => this._renderTextTab() },
            { label: 'Actions', content: () => this._renderActionsTab() },
            ...this._getUtilityTabs()
        ];
    }

    // ============================================================================
    // TAB RENDERERS - 8-TAB STRUCTURE
    // ============================================================================

    /**
     * Config tab - declarative configuration
     * Consolidated: Component, Preset, Entity, Card ID
     */
    _getConfigTabConfig() {
        const state = this._getSliderState();

        return [
            {
                type: 'custom',
                render: () => html`
                    <lcards-message
                        type="info"
                        message="Configure your slider: Choose a component shell (basic or styled), apply a preset for quick styling, and select the entity to control.">
                    </lcards-message>
                `
            },
            {
                type: 'section',
                header: 'Component & Preset',
                description: 'Shell SVG and visual style presets',
                icon: 'mdi:shape',
                expanded: true,
                outlined: true,
                children: [
                    {
                        type: 'grid',
                        columns: 2,
                        children: [
                            {
                                type: 'field',
                                path: 'component',
                                label: 'Component',
                                helper: 'Shell SVG (basic, picard, etc.)'
                            },
                            {
                                type: 'field',
                                path: 'style.track.orientation',
                                label: 'Orientation',
                                helper: 'Layout direction (horizontal or vertical)'
                            }
                        ]
                    },
                    {
                        type: 'field',
                        path: 'preset',
                        label: 'Style Preset',
                        helper: 'Quick styling (pills-basic, gauge-basic, etc.)'
                    },
                    ...(state.preset ? [{
                        type: 'custom',
                        render: () => html`
                            <lcards-message
                                type="success"
                                message="✓ Preset '${state.preset}' applied! Track style, colors, and spacing configured automatically.">
                            </lcards-message>
                        `
                    }] : [])
                ]
            },

            {
                type: 'section',
                header: 'Card Identification',
                description: 'ID and tags for rule targeting',
                icon: 'mdi:tag',
                expanded: false,
                outlined: true,
                children: [
                    {
                        type: 'field',
                        path: 'id',
                        label: 'Card ID',
                        helper: '[Optional] Custom ID for targeting with rules and animations'
                    },
                    {
                        type: 'field',
                        path: 'tags',
                        label: 'Tags',
                        helper: 'Select existing tags or type new ones for rule targeting'
                    }
                ]
            }
        ];
    }

    /**
     * Track Tab - Pills or Gauge styling (dynamic based on track type)
     * @returns {TemplateResult}
     * @private
     */
    _renderTrackTab() {
        const state = this._getSliderState();

        return html`
            <lcards-message
                type="info"
                message="Configure track appearance. Entity configuration and track style selection.">
            </lcards-message>

            <!-- Entity Configuration -->
            <lcards-form-section
                header="Entity Configuration"
                description="Entity to control and value range"
                icon="mdi:home-automation"
                ?expanded=${true}
                ?outlined=${true}
                headerLevel="4">

                ${FormField.renderField(this, 'entity', {
                    label: 'Entity',
                    helper: 'Entity to control/display (light, cover, fan, sensor, etc.)'
                })}

                <lcards-grid-layout>
                    ${FormField.renderField(this, 'control.attribute', {
                        label: 'Attribute',
                        helper: 'Entity attribute to control (e.g., brightness)'
                    })}

                    ${FormField.renderField(this, 'control.locked', {
                        label: 'Display Only',
                        helper: 'Disable interaction (auto-locked for sensors)'
                    })}
                </lcards-grid-layout>

                <lcards-grid-layout columns="3">
                    ${FormField.renderField(this, 'control.min', {
                        label: 'Min',
                        helper: 'Minimum value'
                    })}

                    ${FormField.renderField(this, 'control.max', {
                        label: 'Max',
                        helper: 'Maximum value'
                    })}

                    ${FormField.renderField(this, 'control.step', {
                        label: 'Step',
                        helper: 'Increment size'
                    })}
                </lcards-grid-layout>
            </lcards-form-section>

            <!-- Dynamic: Pills or Gauge Configuration with INLINE COLORS -->
            ${state.trackType === 'pills' ? this._renderPillsConfiguration() : this._renderGaugeConfiguration()}

            <!-- Track Margins -->
            <lcards-form-section
                header="Track Margins"
                description="Spacing around slider track"
                icon="mdi:arrow-expand-all"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">

                <lcards-object-editor
                    .editor=${this}
                    path="style.track.margin"
                    .properties=${['top', 'right', 'bottom', 'left']}
                    controlType="number"
                    .controlConfig=${{ min: 0, max: 100, mode: 'box', unit_of_measurement: 'px' }}
                    columns="2">
                </lcards-object-editor>
            </lcards-form-section>

            <!-- Track Background -->
            <lcards-color-section
                .editor=${this}
                basePath="style.track.background"
                header="Track Background"
                description="Background color behind track content"
                ?singleColor=${true}
                ?expanded=${false}
                ?useColorPicker=${true}>
            </lcards-color-section>
        `;
    }

    /**
     * Pills Configuration - Pills settings with INLINE gradient colors
     * @returns {TemplateResult}
     * @private
     */
    _renderPillsConfiguration() {
        return html`
            <lcards-form-section
                header="Pills Settings"
                description="Segment configuration and appearance"
                icon="mdi:view-sequential"
                ?expanded=${true}
                ?outlined=${true}
                headerLevel="4">

                <lcards-grid-layout columns="1">
                    ${FormField.renderField(this, 'style.track.segments.count', {
                        label: 'Segment Count',
                        helper: 'Number of pill segments'
                    })}

                    ${FormField.renderField(this, 'style.track.segments.gap', {
                        label: 'Gap Size (px)',
                        helper: 'Space between segments'
                    })}

                    ${FormField.renderField(this, 'style.track.segments.shape.radius', {
                        label: 'Border Radius (px)',
                        helper: 'Roundness of pill corners'
                    })}

                    ${FormField.renderField(this, 'style.track.segments.size.height', {
                        label: 'Pill Height (px)',
                        helper: 'Height of each pill'
                    })}
                </lcards-grid-layout>

                <!-- INLINE COLORS: Gradient colors appear right here with pills settings -->
                <lcards-color-section
                    .editor=${this}
                    header="Gradient Colors"
                    description="Start and end colors for pill gradient"
                    .colorPaths=${[
                        { path: 'style.track.segments.gradient.start', label: 'Gradient Start', helper: 'Color at minimum value (left/bottom)' },
                        { path: 'style.track.segments.gradient.end', label: 'Gradient End', helper: 'Color at maximum value (right/top)' }
                    ]}
                    ?expanded=${true}
                    ?useColorPicker=${true}>
                </lcards-color-section>

                ${FormField.renderField(this, 'style.track.segments.gradient.interpolated', {
                    label: 'Interpolate Colors',
                    helper: 'Blend colors smoothly across segments'
                })}
            </lcards-form-section>

            <!-- Opacity Settings -->
            <lcards-form-section
                header="Appearance"
                description="Opacity for filled and unfilled pills"
                icon="mdi:opacity"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">

                <lcards-grid-layout columns="1">
                    ${FormField.renderField(this, 'style.track.segments.appearance.unfilled.opacity', {
                        label: 'Unfilled Opacity',
                        helper: 'Opacity for unfilled pills (0-1, default: 0.2)'
                    })}

                    ${FormField.renderField(this, 'style.track.segments.appearance.filled.opacity', {
                        label: 'Filled Opacity',
                        helper: 'Opacity for filled pills (0-1, default: 1.0)'
                    })}
                </lcards-grid-layout>
            </lcards-form-section>
        `;
    }

    /**
     * Gauge Configuration - Gauge settings with INLINE colors per section
     * @returns {TemplateResult}
     * @private
     */
    _renderGaugeConfiguration() {
        return html`
            <lcards-message
                type="info"
                message="Configure the gauge/ruler display with progress bar, tick marks, and scale labels. Colors appear inline with each section.">
            </lcards-message>

            <!-- Progress Bar with INLINE COLOR -->
            <lcards-form-section
                header="Progress Bar"
                description="Current value indicator bar"
                icon="mdi:progress-check"
                ?expanded=${true}
                ?outlined=${true}
                headerLevel="4">

                <lcards-grid-layout>
                    ${FormField.renderField(this, 'style.gauge.progress_bar.height', {
                        label: 'Height',
                        helper: 'Progress bar height in pixels (default: 12)'
                    })}

                    ${FormField.renderField(this, 'style.gauge.progress_bar.radius', {
                        label: 'Border Radius',
                        helper: 'Progress bar border radius in pixels (default: 2)'
                    })}
                </lcards-grid-layout>

                <!-- INLINE: Progress bar color -->
                <lcards-color-section
                    .editor=${this}
                    basePath="style.gauge.progress_bar.color"
                    header="Progress Bar Color"
                    description="Color of the filled progress bar"
                    ?singleColor=${true}
                    ?expanded=${true}
                    ?useColorPicker=${true}>
                </lcards-color-section>
            </lcards-form-section>

            <!-- Tick Marks & Scale with INLINE COLOR -->
            <lcards-form-section
                header="Tick Marks & Scale"
                description="Major and minor tick marks"
                icon="mdi:ruler"
                ?expanded=${true}
                ?outlined=${true}
                headerLevel="4">

                <!-- Major Ticks Subsection -->
                <lcards-form-section
                    header="Major Tick Marks"
                    description="Primary scale marks"
                    icon="mdi:format-list-bulleted"
                    ?expanded=${true}
                    ?outlined=${false}
                    headerLevel="5">

                    <lcards-grid-layout>
                        ${FormField.renderField(this, 'style.gauge.scale.tick_marks.major.enabled', {
                            label: 'Show Major Ticks'
                        })}

                        ${FormField.renderField(this, 'style.gauge.scale.tick_marks.major.interval', {
                        label: 'Interval',
                        helper: 'Value interval between major ticks'
                    })}

                        ${FormField.renderField(this, 'style.gauge.scale.tick_marks.major.width', {
                        label: 'Line Width',
                        helper: 'Major tick line width in pixels'
                    })}
                    </lcards-grid-layout>
                </lcards-form-section>

                <!-- Minor Ticks Subsection -->
                <lcards-form-section
                    header="Minor Tick Marks"
                    description="Secondary scale marks"
                    icon="mdi:format-list-bulleted-square"
                    ?expanded=${false}
                    ?outlined=${false}
                    headerLevel="5">

                    <lcards-grid-layout>
                        ${FormField.renderField(this, 'style.gauge.scale.tick_marks.minor.enabled', {
                            label: 'Show Minor Ticks'
                        })}

                        ${FormField.renderField(this, 'style.gauge.scale.tick_marks.minor.interval', {
                        label: 'Interval',
                        helper: 'Value interval between minor ticks'
                    })}

                        ${FormField.renderField(this, 'style.gauge.scale.tick_marks.minor.height', {
                        label: 'Height',
                        helper: 'Minor tick height in pixels'
                    })}

                        ${FormField.renderField(this, 'style.gauge.scale.tick_marks.minor.width', {
                        label: 'Line Width',
                        helper: 'Minor tick line width in pixels'
                    })}
                    </lcards-grid-layout>
                </lcards-form-section>

                <!-- INLINE: Tick mark color -->
                <lcards-color-section
                    .editor=${this}
                    basePath="style.gauge.scale.tick_marks.major.color"
                    header="Tick Mark Color"
                    description="Color for scale tick marks (both major and minor)"
                    ?singleColor=${true}
                    ?expanded=${false}
                    ?useColorPicker=${true}>
                </lcards-color-section>

                <!-- Scale Labels Subsection with INLINE COLOR -->
                <lcards-form-section
                    header="Scale Labels"
                    description="Numeric labels on scale"
                    icon="mdi:format-text"
                    ?expanded=${false}
                    ?outlined=${false}
                    headerLevel="5">

                    <lcards-grid-layout>
                        ${FormField.renderField(this, 'style.gauge.scale.labels.enabled', {
                            label: 'Show Scale Labels'
                        })}

                        ${FormField.renderField(this, 'style.gauge.scale.labels.unit', {
                        label: 'Unit',
                        helper: 'Unit to append to values (%, °C, °F, W, etc.)'
                    })}

                        ${FormField.renderField(this, 'style.gauge.scale.labels.font_size', {
                        label: 'Font Size',
                        helper: 'Label font size in pixels'
                    })}

                        ${FormField.renderField(this, 'style.gauge.scale.labels.padding', {
                        label: 'Padding',
                        helper: 'Space between tick and label in pixels'
                    })}
                    </lcards-grid-layout>

                    <!-- INLINE: Label color -->
                    <lcards-color-section
                        .editor=${this}
                        basePath="style.gauge.scale.labels.color"
                        header="Label Color"
                        description="Color for scale numeric labels"
                        ?singleColor=${true}
                        ?expanded=${true}
                        ?useColorPicker=${true}>
                    </lcards-color-section>
                </lcards-form-section>
            </lcards-form-section>

            <!-- Value Indicator with INLINE COLORS -->
            <lcards-form-section
                header="Value Indicator"
                description="Current value marker (optional)"
                icon="mdi:arrow-up-bold"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">

                <lcards-grid-layout>
                    ${FormField.renderField(this, 'style.gauge.indicator.enabled', {
                        label: 'Show Indicator',
                        helper: 'Display a marker at the current value'
                    })}

                    ${FormField.renderField(this, 'style.gauge.indicator.type', {
                        label: 'Indicator Type',
                        helper: 'line: vertical/horizontal line, thumb: circular marker'
                    })}

                    ${FormField.renderField(this, 'style.gauge.indicator.size.width', {
                        label: 'Width',
                        helper: 'Indicator width in pixels'
                    })}

                    ${FormField.renderField(this, 'style.gauge.indicator.size.height', {
                        label: 'Height',
                        helper: 'Indicator height in pixels'
                    })}

                    ${FormField.renderField(this, 'style.gauge.indicator.border.enabled', {
                        label: 'Show Border',
                        helper: 'Add border around indicator'
                    })}

                    ${FormField.renderField(this, 'style.gauge.indicator.border.width', {
                        label: 'Border Width',
                        helper: 'Border width in pixels'
                    })}
                </lcards-grid-layout>

                <!-- INLINE: Indicator colors -->
                <lcards-color-section
                    .editor=${this}
                    header="Indicator Colors"
                    description="Colors for value indicator marker"
                    .colorPaths=${[
                        {
                            path: 'style.gauge.indicator.color',
                            label: 'Indicator Color',
                            helper: 'Color of value indicator'
                        },
                        {
                            path: 'style.gauge.indicator.border.color',
                            label: 'Border Color',
                            helper: 'Color of indicator border'
                        }
                    ]}
                    ?expanded=${true}
                    ?useColorPicker=${true}>
                </lcards-color-section>
            </lcards-form-section>
        `;
    }

    /**
     * Text Tab - Standard multi-text editor
     * @returns {TemplateResult}
     * @private
     */
    _renderTextTab() {
        return html`
            <lcards-multi-text-editor
                .editor=${this}
                .config=${this.config}
                .hass=${this.hass}>
            </lcards-multi-text-editor>
        `;
    }

    /**
     * Borders Tab - Border sizing and state-based colors
     * @returns {TemplateResult}
     * @private
     */
    _renderBordersTab() {
        return html`
            <lcards-message
                type="info"
                message="Configure SVG border caps (left, top, right, bottom) with sizes and state-based colors.">
            </lcards-message>

            <!-- Left Border -->
            <lcards-form-section
                header="Left Border"
                description="Left border cap configuration"
                icon="mdi:border-left"
                ?expanded=${true}
                ?outlined=${true}
                headerLevel="4">

                <lcards-grid-layout>
                    ${FormField.renderField(this, 'style.border.left.enabled', {
                        label: 'Enabled',
                        helper: 'Show left border cap'
                    })}

                    ${FormField.renderField(this, 'style.border.left.size', {
                        label: 'Size (px)',
                        helper: 'Border width in pixels'
                    })}
                </lcards-grid-layout>

                <lcards-color-section-v2
                    .editor=${this}
                    basePath="style.border.left.color"
                    header="Left Border Colors"
                    description="State-based colors for left border - supports custom states"
                    .suggestedStates=${['default', 'active', 'inactive', 'unavailable', 'hover', 'pressed']}
                    ?allowCustomStates=${true}
                    ?expanded=${false}>
                </lcards-color-section-v2>
            </lcards-form-section>

            <!-- Top Border -->
            <lcards-form-section
                header="Top Border"
                description="Top border cap configuration"
                icon="mdi:border-top"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">

                <lcards-grid-layout>
                    ${FormField.renderField(this, 'style.border.top.enabled', {
                        label: 'Enabled',
                        helper: 'Show top border cap'
                    })}

                    ${FormField.renderField(this, 'style.border.top.size', {
                        label: 'Size (px)',
                        helper: 'Border height in pixels'
                    })}
                </lcards-grid-layout>

                <lcards-color-section-v2
                    .editor=${this}
                    basePath="style.border.top.color"
                    header="Top Border Colors"
                    description="State-based colors for top border - supports custom states"
                    .suggestedStates=${['default', 'active', 'inactive', 'unavailable', 'hover', 'pressed']}
                    ?allowCustomStates=${true}
                    ?expanded=${false}>
                </lcards-color-section-v2>
            </lcards-form-section>

            <!-- Right Border -->
            <lcards-form-section
                header="Right Border"
                description="Right border cap configuration"
                icon="mdi:border-right"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">

                <lcards-grid-layout>
                    ${FormField.renderField(this, 'style.border.right.enabled', {
                        label: 'Enabled',
                        helper: 'Show right border cap'
                    })}

                    ${FormField.renderField(this, 'style.border.right.size', {
                        label: 'Size (px)',
                        helper: 'Border width in pixels'
                    })}
                </lcards-grid-layout>

                <lcards-color-section-v2
                    .editor=${this}
                    basePath="style.border.right.color"
                    header="Right Border Colors"
                    description="State-based colors for right border - supports custom states"
                    .suggestedStates=${['default', 'active', 'inactive', 'unavailable', 'hover', 'pressed']}
                    ?allowCustomStates=${true}
                    ?expanded=${false}>
                </lcards-color-section-v2>
            </lcards-form-section>

            <!-- Bottom Border -->
            <lcards-form-section
                header="Bottom Border"
                description="Bottom border cap configuration"
                icon="mdi:border-bottom"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">

                <lcards-grid-layout>
                    ${FormField.renderField(this, 'style.border.bottom.enabled', {
                        label: 'Enabled',
                        helper: 'Show bottom border cap'
                    })}

                    ${FormField.renderField(this, 'style.border.bottom.size', {
                        label: 'Size (px)',
                        helper: 'Border height in pixels'
                    })}
                </lcards-grid-layout>

                <lcards-color-section-v2
                    .editor=${this}
                    basePath="style.border.bottom.color"
                    header="Bottom Border Colors"
                    description="State-based colors for bottom border - supports custom states"
                    .suggestedStates=${['default', 'active', 'inactive', 'unavailable', 'hover', 'pressed']}
                    ?allowCustomStates=${true}
                    ?expanded=${false}>
                </lcards-color-section-v2>
            </lcards-form-section>
        `;
    }

    /**
     * Actions Tab - Standard multi-action editor
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

    // ============================================================================
    // HELPER METHODS
    // ============================================================================

    /**
     * Handle actions change from multi-action editor
     * @param {CustomEvent} e - Actions change event
     * @private
     */
    _handleActionsChange(e) {
        const actions = e.detail.value;
        const updatedConfig = {
            ...this.config,
            tap_action: actions.tap_action,
            hold_action: actions.hold_action,
            double_tap_action: actions.double_tap_action
        };
        this._updateConfig(updatedConfig);
    }
}

// Register custom element
customElements.define('lcards-slider-editor', LCARdSSliderEditor);

lcardsLog.info('[LCARdSSliderEditor] Standalone editor module loaded');
