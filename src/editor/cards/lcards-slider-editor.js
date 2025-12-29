/**
 * LCARdS Slider Editor
 *
 * Visual configuration editor for slider cards.
 * Refactored from 11 tabs to 6 tabs with inline colors for better UX.
 *
 * @extends {LCARdSBaseEditor}
 */

import { html } from 'lit';
import { lcardsLog } from '../../utils/lcards-logging.js';
import { LCARdSBaseEditor } from '../base/LCARdSBaseEditor.js';
import { deepMerge } from '../../utils/deepMerge.js';

// Import shared form components
import '../components/editors/lcards-color-section.js';
import '../components/editors/lcards-border-editor.js';
import '../components/editors/lcards-object-editor.js';
import '../components/editors/lcards-grid-layout.js';
import '../components/shared/lcards-message.js';
import '../components/shared/lcards-form-field.js';
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
 * Clarifies relationships between component, preset, and track configuration
 * @private
 */
class SliderConfigState {
    constructor(config) {
        this.config = config;
    }

    // Component: Provides shell SVG (horizontal, vertical, picard)
    get component() {
        return this.config.component || null;
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

    /**
     * Check if component is compatible with current orientation
     * @returns {boolean}
     */
    isComponentCompatible() {
        if (!this.component) return true;
        
        // Component name implies orientation
        if (this.component.includes('horizontal') && this.orientation !== 'horizontal') return false;
        if (this.component.includes('vertical') && this.orientation !== 'vertical') return false;
        
        return true;
    }

    /**
     * Get recommended orientation for selected component
     * @returns {string|null}
     */
    getRecommendedOrientation() {
        if (!this.component) return null;
        if (this.component.includes('horizontal')) return 'horizontal';
        if (this.component.includes('vertical')) return 'vertical';
        return null;
    }
}

export class LCARdSSliderEditor extends LCARdSBaseEditor {
    
    static get properties() {
        return {
            ...super.properties,
            _developerSubTab: { type: Number, state: true }
        };
    }

    constructor() {
        super();
        this.cardType = 'slider';
        this._developerSubTab = 0;
        lcardsLog.debug('[LCARdSSliderEditor] Refactored editor initialized with cardType: slider (6 tabs)');
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
     * Define editor tabs - NEW: 6 tabs with inline colors
     * @returns {Array} Tab definitions
     * @protected
     */
    _getTabDefinitions() {
        return [
            { label: 'Setup', content: () => this._renderSetupTab() },
            { label: 'Configuration', content: () => this._renderConfigurationTab() },
            { label: 'Text & Styling', content: () => this._renderTextStylingTab() },
            { label: 'Advanced', content: () => this._renderFromConfig(this._getAdvancedTabConfig()) },
            { label: 'Developer', content: () => this._renderDeveloperTab() },
            { label: 'YAML', content: () => this._renderYamlTab() }
        ];
    }

    // ============================================================================
    // TAB RENDERERS - NEW 6-TAB STRUCTURE
    // ============================================================================

    /**
     * Setup Tab - Preset selection and component/orientation configuration
     * @returns {TemplateResult}
     * @private
     */
    _renderSetupTab() {
        const state = this._getSliderState();
        const hasPreset = !!state.preset;

        return html`
            <lcards-message
                type="info"
                message="Start with a preset for quick setup, or manually configure your slider component and orientation.">
            </lcards-message>

            <!-- Quick Start Section -->
            <lcards-form-section
                header="Quick Start"
                description="Choose a preset for instant configuration"
                icon="mdi:flash"
                ?expanded=${!hasPreset}
                ?outlined=${true}
                headerLevel="4">

                <lcards-form-field
                    .editor=${this}
                    path="preset"
                    label="Style Preset"
                    helper="pills-basic, gauge-basic, etc.">
                </lcards-form-field>

                ${hasPreset ? html`
                    <lcards-message
                        type="success"
                        message="✓ Preset '${state.preset}' applied! Track style, colors, and spacing configured automatically. Override below if needed.">
                    </lcards-message>
                ` : ''}
            </lcards-form-section>

            <!-- Component & Orientation Section -->
            <lcards-form-section
                header="Component & Orientation"
                description="Shell SVG component and layout direction"
                icon="mdi:cube-outline"
                ?expanded=${!hasPreset}
                ?outlined=${true}
                headerLevel="4">

                <lcards-grid-layout>
                    <lcards-form-field
                        .editor=${this}
                        path="component"
                        label="Component"
                        helper="Shell SVG template (horizontal, vertical, picard)">
                    </lcards-form-field>

                    <lcards-form-field
                        .editor=${this}
                        path="style.track.orientation"
                        label="Orientation"
                        helper="Layout direction (should match component)">
                    </lcards-form-field>
                </lcards-grid-layout>

                ${!state.isComponentCompatible() ? html`
                    <lcards-message
                        type="warning"
                        message="⚠️ Component '${state.component}' expects ${state.getRecommendedOrientation()} orientation. Current: ${state.orientation}">
                    </lcards-message>
                ` : ''}

                <lcards-message
                    type="info"
                    message="💡 Component provides the shell SVG. Orientation controls layout direction. These should match.">
                </lcards-message>
            </lcards-form-section>

            <!-- Card Identification -->
            <lcards-form-section
                header="Card Identification"
                description="ID and tags for rule targeting"
                icon="mdi:tag"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">

                <lcards-grid-layout>
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
                </lcards-grid-layout>
            </lcards-form-section>
        `;
    }

    /**
     * Configuration Tab - Entity + Track style (pills/gauge) with INLINE COLORS
     * @returns {TemplateResult}
     * @private
     */
    _renderConfigurationTab() {
        const state = this._getSliderState();

        return html`
            <lcards-message
                type="info"
                message="Configure the entity to control and track style (pills or gauge). Colors appear inline with relevant settings.">
            </lcards-message>

            <!-- Entity Configuration -->
            <lcards-form-section
                header="Entity"
                description="Entity to control or display"
                icon="mdi:home-automation"
                ?expanded=${true}
                ?outlined=${true}
                headerLevel="4">

                <lcards-form-field
                    .editor=${this}
                    path="entity"
                    label="Entity"
                    helper="Entity to control/display (light, cover, fan, sensor, etc.)">
                </lcards-form-field>

                <lcards-form-field
                    .editor=${this}
                    path="control.attribute"
                    label="Attribute"
                    helper="Entity attribute to control (e.g., brightness for lights)">
                </lcards-form-field>
            </lcards-form-section>

            <!-- Value Range -->
            <lcards-form-section
                header="Value Range"
                description="Minimum, maximum, and step size"
                icon="mdi:tune"
                ?expanded=${true}
                ?outlined=${true}
                headerLevel="4">

                <lcards-grid-layout>
                    <lcards-form-field
                        .editor=${this}
                        path="control.min"
                        label="Minimum Value"
                        helper="Minimum slider value (default: 0 or entity min)">
                    </lcards-form-field>

                    <lcards-form-field
                        .editor=${this}
                        path="control.max"
                        label="Maximum Value"
                        helper="Maximum slider value (default: 100 or entity max)">
                    </lcards-form-field>

                    <lcards-form-field
                        .editor=${this}
                        path="control.step"
                        label="Step Size"
                        helper="Increment/decrement amount (default: 1 or entity step)">
                    </lcards-form-field>

                    <lcards-form-field
                        .editor=${this}
                        path="control.locked"
                        label="Locked (Display Only)"
                        helper="Disable interaction (auto-locked for sensors)">
                    </lcards-form-field>
                </lcards-grid-layout>
            </lcards-form-section>

            <!-- Track Style Selector -->
            <lcards-form-section
                header="Track Style"
                description="Choose between pills (segmented bar) or gauge (ruler)"
                icon="mdi:tune-variant"
                ?expanded=${true}
                ?outlined=${true}
                headerLevel="4">

                <ha-selector
                    .hass=${this.hass}
                    .label=${'Track Type'}
                    .helper=${state.trackType === 'pills'
                        ? 'Pills: Segmented bar slider with color gradient support'
                        : 'Gauge: Ruler-style display with tick marks and scale labels'}
                    .selector=${{
                        select: {
                            mode: 'dropdown',
                            options: [
                                { value: 'pills', label: 'Pills (Segmented Bar)' },
                                { value: 'gauge', label: 'Gauge (Ruler)' }
                            ]
                        }
                    }}
                    .value=${state.trackType}
                    @value-changed=${this._handleTrackTypeChange}>
                </ha-selector>
            </lcards-form-section>

            <!-- Dynamic: Pills or Gauge Configuration with INLINE COLORS -->
            ${state.trackType === 'pills' ? this._renderPillsConfiguration() : this._renderGaugeConfiguration()}
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

                <lcards-grid-layout>
                    <lcards-form-field .editor=${this} path="style.track.segments.count" label="Segment Count" helper="Number of pill segments"></lcards-form-field>
                    <lcards-form-field .editor=${this} path="style.track.segments.gap" label="Gap Size (px)" helper="Space between segments"></lcards-form-field>
                    <lcards-form-field .editor=${this} path="style.track.segments.shape.radius" label="Border Radius (px)" helper="Roundness of pill corners"></lcards-form-field>
                    <lcards-form-field .editor=${this} path="style.track.segments.size.height" label="Pill Height (px)" helper="Height of each pill"></lcards-form-field>
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

                <lcards-form-field .editor=${this} path="style.track.segments.gradient.interpolated" label="Interpolate Colors" helper="Blend colors smoothly across segments"></lcards-form-field>
            </lcards-form-section>

            <!-- Track background color also inline -->
            <lcards-color-section
                .editor=${this}
                basePath="style.track.background"
                header="Track Background"
                description="Background color behind pills"
                ?singleColor=${true}
                ?expanded=${false}
                ?useColorPicker=${true}>
            </lcards-color-section>

            <!-- Opacity Settings -->
            <lcards-form-section
                header="Appearance"
                description="Opacity for filled and unfilled pills"
                icon="mdi:opacity"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">

                <lcards-grid-layout>
                    <lcards-form-field
                        .editor=${this}
                        path="style.track.segments.appearance.unfilled.opacity"
                        label="Unfilled Opacity"
                        helper="Opacity for unfilled pills (0-1, default: 0.2)">
                    </lcards-form-field>

                    <lcards-form-field
                        .editor=${this}
                        path="style.track.segments.appearance.filled.opacity"
                        label="Filled Opacity"
                        helper="Opacity for filled pills (0-1, default: 1.0)">
                    </lcards-form-field>
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
                    <lcards-form-field
                        .editor=${this}
                        path="style.gauge.progress_bar.height"
                        label="Height"
                        helper="Progress bar height in pixels (default: 12)">
                    </lcards-form-field>

                    <lcards-form-field
                        .editor=${this}
                        path="style.gauge.progress_bar.radius"
                        label="Border Radius"
                        helper="Progress bar border radius in pixels (default: 2)">
                    </lcards-form-field>
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
                        <lcards-form-field
                            .editor=${this}
                            path="style.gauge.scale.tick_marks.major.enabled"
                            label="Show Major Ticks">
                        </lcards-form-field>

                        <lcards-form-field
                            .editor=${this}
                            path="style.gauge.scale.tick_marks.major.interval"
                            label="Interval"
                            helper="Value interval between major ticks">
                        </lcards-form-field>

                        <lcards-form-field
                            .editor=${this}
                            path="style.gauge.scale.tick_marks.major.width"
                            label="Line Width"
                            helper="Major tick line width in pixels">
                        </lcards-form-field>
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
                        <lcards-form-field
                            .editor=${this}
                            path="style.gauge.scale.tick_marks.minor.enabled"
                            label="Show Minor Ticks">
                        </lcards-form-field>

                        <lcards-form-field
                            .editor=${this}
                            path="style.gauge.scale.tick_marks.minor.interval"
                            label="Interval"
                            helper="Value interval between minor ticks">
                        </lcards-form-field>

                        <lcards-form-field
                            .editor=${this}
                            path="style.gauge.scale.tick_marks.minor.height"
                            label="Height"
                            helper="Minor tick height in pixels">
                        </lcards-form-field>

                        <lcards-form-field
                            .editor=${this}
                            path="style.gauge.scale.tick_marks.minor.width"
                            label="Line Width"
                            helper="Minor tick line width in pixels">
                        </lcards-form-field>
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
                        <lcards-form-field
                            .editor=${this}
                            path="style.gauge.scale.labels.enabled"
                            label="Show Scale Labels">
                        </lcards-form-field>

                        <lcards-form-field
                            .editor=${this}
                            path="style.gauge.scale.labels.unit"
                            label="Unit"
                            helper="Unit to append to values (%, °C, °F, W, etc.)">
                        </lcards-form-field>

                        <lcards-form-field
                            .editor=${this}
                            path="style.gauge.scale.labels.font_size"
                            label="Font Size"
                            helper="Label font size in pixels">
                        </lcards-form-field>

                        <lcards-form-field
                            .editor=${this}
                            path="style.gauge.scale.labels.padding"
                            label="Padding"
                            helper="Space between tick and label in pixels">
                        </lcards-form-field>
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
                    <lcards-form-field
                        .editor=${this}
                        path="style.gauge.indicator.enabled"
                        label="Show Indicator"
                        helper="Display a marker at the current value">
                    </lcards-form-field>

                    <lcards-form-field
                        .editor=${this}
                        path="style.gauge.indicator.type"
                        label="Indicator Type"
                        helper="line: vertical/horizontal line, thumb: circular marker">
                    </lcards-form-field>

                    <lcards-form-field
                        .editor=${this}
                        path="style.gauge.indicator.size.width"
                        label="Width"
                        helper="Indicator width in pixels">
                    </lcards-form-field>

                    <lcards-form-field
                        .editor=${this}
                        path="style.gauge.indicator.size.height"
                        label="Height"
                        helper="Indicator height in pixels">
                    </lcards-form-field>

                    <lcards-form-field
                        .editor=${this}
                        path="style.gauge.indicator.border.enabled"
                        label="Show Border"
                        helper="Add border around indicator">
                    </lcards-form-field>

                    <lcards-form-field
                        .editor=${this}
                        path="style.gauge.indicator.border.width"
                        label="Border Width"
                        helper="Border width in pixels">
                    </lcards-form-field>
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
     * Text & Styling Tab - Text fields, borders, margins, actions
     * @returns {TemplateResult}
     * @private
     */
    _renderTextStylingTab() {
        return html`
            <lcards-message
                type="info"
                message="Configure text fields, borders, margins, and actions. Text is positioned in border caps (left/top/right/bottom) or the track area.">
            </lcards-message>

            <!-- Text Fields -->
            <lcards-multi-text-editor
                .editor=${this}
                .config=${this.config}
                .hass=${this.hass}>
            </lcards-multi-text-editor>

            <!-- Borders with inline colors -->
            <lcards-form-section 
                header="Borders" 
                description="SVG borders with visual preview"
                icon="mdi:border-all" 
                ?expanded=${true} 
                ?outlined=${true}
                headerLevel="4">
                
                <lcards-border-editor
                    .editor=${this}
                    path="style.border"
                    label="Border Configuration"
                    mode="svg"
                    ?showPreview=${true}
                    .supportedSides=${['top', 'right', 'bottom', 'left']}>
                </lcards-border-editor>
                
                <lcards-color-section
                    .editor=${this}
                    basePath="style.border.color"
                    header="State-Based Border Colors"
                    description="Override border colors based on entity state"
                    .colorPaths=${[
                        { path: 'active', label: 'Active State', helper: 'Border color when entity is active' },
                        { path: 'inactive', label: 'Inactive State', helper: 'Border color when entity is inactive' }
                    ]}
                    ?expanded=${false}
                    ?useColorPicker=${true}>
                </lcards-color-section>
            </lcards-form-section>

            <!-- Track Margins (using object editor) -->
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

            <!-- Actions -->
            <lcards-form-section 
                header="Actions" 
                description="Tap, hold, and double-tap actions"
                icon="mdi:gesture-tap" 
                ?expanded=${false} 
                ?outlined=${true}
                headerLevel="4">
                
                <lcards-multi-action-editor
                    .hass=${this.hass}
                    .actions=${{
                        tap_action: this.config.tap_action,
                        hold_action: this.config.hold_action,
                        double_tap_action: this.config.double_tap_action
                    }}
                    @value-changed=${this._handleActionsChange}>
                </lcards-multi-action-editor>
            </lcards-form-section>
        `;
    }

    /**
     * Developer Tab - Sub-tabs for 5 developer tools
     * @returns {TemplateResult}
     * @private
     */
    _renderDeveloperTab() {
        return html`
            <lcards-message 
                type="info" 
                message="Developer tools: Data sources, rules, templates, theme tokens, and provenance tracking.">
            </lcards-message>

            <ha-tab-group @wa-tab-show=${this._handleDeveloperSubTabChange}>
                <ha-tab-group-tab value="0" ?active=${(this._developerSubTab || 0) === 0}>Data Sources</ha-tab-group-tab>
                <ha-tab-group-tab value="1" ?active=${(this._developerSubTab || 0) === 1}>Rules</ha-tab-group-tab>
                <ha-tab-group-tab value="2" ?active=${(this._developerSubTab || 0) === 2}>Templates</ha-tab-group-tab>
                <ha-tab-group-tab value="3" ?active=${(this._developerSubTab || 0) === 3}>Theme Browser</ha-tab-group-tab>
                <ha-tab-group-tab value="4" ?active=${(this._developerSubTab || 0) === 4}>Provenance</ha-tab-group-tab>

                <ha-tab-panel value="0" ?hidden=${(this._developerSubTab || 0) !== 0}>${this._renderDataSourcesTab()}</ha-tab-panel>
                <ha-tab-panel value="1" ?hidden=${(this._developerSubTab || 0) !== 1}>${this._renderRulesTab()}</ha-tab-panel>
                <ha-tab-panel value="2" ?hidden=${(this._developerSubTab || 0) !== 2}>${this._renderTemplatesTab()}</ha-tab-panel>
                <ha-tab-panel value="3" ?hidden=${(this._developerSubTab || 0) !== 3}>${this._renderThemeTokensTab()}</ha-tab-panel>
                <ha-tab-panel value="4" ?hidden=${(this._developerSubTab || 0) !== 4}>${this._renderProvenanceTab()}</ha-tab-panel>
            </ha-tab-group>
        `;
    }

    /**
     * Handle developer sub-tab change
     * @param {CustomEvent} event - wa-tab-show event
     * @private
     */
    _handleDeveloperSubTabChange(event) {
        const value = event.target.activeTab?.getAttribute('value');
        if (value !== null) {
            this._developerSubTab = parseInt(value, 10);
            this.requestUpdate();
        }
    }

    /**
     * Advanced tab - Grid layout, CSS class, and animations
     * @returns {Array} Advanced tab definition
     */
    _getAdvancedTabConfig() {
        return [
            {
                type: 'custom',
                render: () => html`
                    <lcards-message
                        type="info"
                        message="Advanced configuration: Grid layout, custom CSS classes, and animation settings.">
                    </lcards-message>
                `
            },
            {
                type: 'section',
                header: 'Grid Layout',
                description: 'Card size in Home Assistant grid',
                icon: 'mdi:grid',
                expanded: true,
                outlined: true,
                children: [
                    {
                        type: 'field',
                        path: 'grid_columns',
                        label: 'Grid Columns',
                        helper: 'Number of grid columns to span (1-12, default: 4)'
                    },
                    {
                        type: 'field',
                        path: 'grid_rows',
                        label: 'Grid Rows',
                        helper: 'Number of grid rows to span (1-12, default: 1)'
                    }
                ]
            },
            {
                type: 'section',
                header: 'Custom Styling',
                description: 'CSS classes and advanced styling options',
                icon: 'mdi:code-braces',
                expanded: false,
                outlined: true,
                children: [
                    {
                        type: 'field',
                        path: 'css_class',
                        label: 'Custom CSS Class',
                        helper: 'Add custom CSS class for styling'
                    }
                ]
            }
        ];
    }

    // ============================================================================
    // HELPER METHODS
    // ============================================================================

    /**
     * Handle mode switch (pills ↔ gauge)
     * Applies default config for new mode and cleans old mode settings
     * @param {CustomEvent} e - Mode change event
     * @private
     */
    _handleTrackTypeChange(e) {
        const newMode = e.detail.value; // 'pills' or 'gauge'
        const state = this._getSliderState();
        const oldMode = state.trackType;

        if (newMode === oldMode) return;

        lcardsLog.info(`[LCARdSSliderEditor] Mode switch: ${oldMode} → ${newMode}`);

        // Clean incompatible config
        const newConfig = { ...this.config };
        if (newMode === 'pills') {
            // Switching to pills - remove gauge config
            if (newConfig.style?.gauge) {
                delete newConfig.style.gauge;
            }
        } else if (newMode === 'gauge') {
            // Switching to gauge - remove pills-specific segment config
            if (newConfig.style?.track?.segments) {
                delete newConfig.style.track.segments;
            }
        }

        // Apply mode defaults
        let modeDefaults = {};
        if (newMode === 'pills') {
            modeDefaults = {
                style: {
                    track: {
                        type: 'pills',
                        segments: {
                            count: 20,
                            gap: 2,
                            size: { width: 10, height: 40 },
                            shape: { radius: 2 },
                            gradient: {
                                start: '{theme:palette.moonlight}',
                                end: '{theme:palette.alert-red}',
                                interpolated: true
                            },
                            appearance: {
                                unfilled: { opacity: 0.2 },
                                filled: { opacity: 1.0 }
                            }
                        },
                        margin: { left: 0, right: 0, top: 0, bottom: 0 },
                        background: 'transparent'
                    }
                }
            };
        } else if (newMode === 'gauge') {
            modeDefaults = {
                style: {
                    track: {
                        type: 'gauge'
                    },
                    gauge: {
                        progress_bar: {
                            height: 10,
                            radius: 5,
                            color: '{theme:palette.moonlight}'
                        },
                        scale: {
                            tick_marks: {
                                major: { 
                                    enabled: true,
                                    interval: 10, 
                                    width: 2, 
                                    height: 12, 
                                    color: '{theme:palette.moonlight}' 
                                },
                                minor: { 
                                    enabled: true,
                                    interval: 5, 
                                    width: 1, 
                                    height: 6, 
                                    color: '{theme:palette.text-dim}' 
                                }
                            },
                            labels: {
                                enabled: true,
                                font_size: 12,
                                padding: 8,
                                unit: '',
                                color: '{theme:palette.text-primary}'
                            }
                        },
                        indicator: {
                            enabled: false,
                            type: 'line',
                            size: { width: 4, height: 25 },
                            color: '{theme:palette.alert-red}',
                            border: { 
                                enabled: false,
                                width: 1, 
                                color: '{theme:palette.moonlight}' 
                            }
                        }
                    }
                }
            };
        }

        // Deep merge defaults with existing config
        const updatedConfig = deepMerge({}, newConfig, modeDefaults);

        // Set track.type explicitly
        if (!updatedConfig.style) updatedConfig.style = {};
        if (!updatedConfig.style.track) updatedConfig.style.track = {};
        updatedConfig.style.track.type = newMode;

        // Fire config changed event
        this._updateConfig(updatedConfig);

        lcardsLog.debug(`[LCARdSSliderEditor] Applied ${newMode} defaults:`, modeDefaults);
    }

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
