/**
 * LCARdS Slider Editor
 *
 * Visual configuration editor for slider cards.
 * Standalone editor extending LCARdSBaseEditor directly.
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
import '../components/shared/lcards-message.js';

// Import specialized editor components
import '../components/editors/lcards-multi-text-editor.js';
import '../components/editors/lcards-multi-action-editor.js';

// Import dashboard components
import '../components/dashboard/lcards-rules-dashboard.js';

// Import datasource components
import '../components/datasources/lcards-datasource-editor-tab.js';

// Import template components
import '../components/templates/lcards-template-sandbox.js';

// Import theme browser
import '../components/theme-browser/lcards-theme-token-browser-tab.js';

// Import provenance tab
import '../components/provenance/lcards-provenance-tab.js';

export class LCARdSSliderEditor extends LCARdSBaseEditor {
    constructor() {
        super();
        this.cardType = 'slider';
        lcardsLog.debug('[LCARdSSliderEditor] Standalone editor initialized with cardType: slider');
    }

    /**
     * Get current slider mode (pills or gauge)
     * Based on track type, not preset vs component
     * @returns {'pills'|'gauge'}
     * @private
     */
    _getMode() {
        return this.config.style?.track?.type || 'pills';
    }

    /**
     * Clean config when switching modes or making incompatible changes
     * Removes mode-specific config when switching between pills and gauge
     * @param {string} changeType - Type of change: 'mode', 'preset', 'component'
     * @param {*} newValue - New value being set
     * @private
     */
    _cleanConfigForChange(changeType, newValue) {
        const newConfig = { ...this.config };

        if (changeType === 'mode') {
            // Switching between pills and gauge - clean mode-specific config
            if (newValue === 'pills') {
                // Switching to pills - remove gauge config
                if (newConfig.style?.gauge) {
                    delete newConfig.style.gauge;
                }
            } else if (newValue === 'gauge') {
                // Switching to gauge - remove pills-specific segment config
                if (newConfig.style?.track?.segments) {
                    delete newConfig.style.track.segments;
                }
            }
        } else if (changeType === 'preset') {
            // Changing preset - keep only user overrides
            // The new preset will provide base config via CoreConfigManager
            lcardsLog.debug('[LCARdSSliderEditor] Preset changed, keeping user overrides');
        }

        this._updateConfig(newConfig);
    }

    /**
     * Define editor tabs - dynamically show/hide mode-specific tabs
     * @returns {Array} Tab definitions
     * @protected
     */
    _getTabDefinitions() {
        const mode = this._getMode();

        const tabs = [
            {
                label: 'Config',
                content: () => this._renderFromConfig(this._getConfigTabConfig())
            },
            {
                label: 'Control',
                content: () => this._renderFromConfig(this._getControlTabConfig())
            }
        ];

        // Mode-specific tabs
        if (mode === 'pills') {
            tabs.push({
                label: 'Track',
                content: () => this._renderFromConfig(this._getTrackTabConfig())
            });
        } else {
            tabs.push({
                label: 'Gauge',
                content: () => this._renderFromConfig(this._getGaugeTabConfig())
            });
        }

        // Common tabs
        tabs.push(
            {
                label: 'Colors',
                content: () => this._renderColorsTab()
            },
            {
                label: 'Text',
                content: () => this._renderTextTab()
            },
            {
                label: 'Borders',
                content: () => this._renderBordersTab()
            },
            {
                label: 'Actions',
                content: () => this._renderActionsTab()
            },
            ...this._getUtilityTabs()
        );

        return tabs;
    }

    /**
     * Config tab - Layout, mode, and card identification
     * Note: Entity field is in Control tab for sliders
     * @returns {Array} Config tab definition
     */
    _getConfigTabConfig() {
        const mode = this._getMode();
        const hasPreset = !!this.config.preset;
        const hasComponent = !!this.config.component;

        return this._buildConfigTab({
            infoMessage: 'Configure your LCARdS slider card. Start with a preset for quick setup, or manually configure orientation and track style.',
            modeSections: [
                {
                    type: 'section',
                    header: 'Quick Setup',
                    description: 'Use presets for common slider configurations',
                    icon: 'mdi:palette',
                    expanded: true,
                    outlined: true,
                    children: [
                        {
                            type: 'field',
                            path: 'preset',
                            label: 'Style Preset',
                            helper: 'Choose a preset: pills-basic, gauge-basic'
                        },
                        ...(hasPreset ? [
                            {
                                type: 'custom',
                                render: () => html`
                                    <lcards-message
                                        type="success"
                                        message="Preset applied! Track style, colors, and spacing are configured automatically. Override any settings below if needed.">
                                    </lcards-message>
                                `
                            }
                        ] : [])
                    ]
                },
                {
                    type: 'section',
                    header: 'Layout & Visual Mode',
                    description: 'Component orientation and track style',
                    icon: 'mdi:tune-variant',
                    expanded: !hasPreset,
                    outlined: true,
                    children: [
                        {
                            type: 'field',
                            path: 'style.track.orientation',
                            label: 'Orientation',
                            helper: 'Slider direction: horizontal or vertical (default: horizontal)'
                        },
                        ...(hasComponent ? [
                            {
                                type: 'field',
                                path: 'component',
                                label: 'Advanced Component',
                                helper: 'Advanced SVG component (e.g., horizontal, vertical, picard-vertical)'
                            }
                        ] : []),
                        {
                            type: 'custom',
                            render: () => html`
                                <ha-selector
                                    .hass=${this.hass}
                                    .label=${'Track Style'}
                                    .helper=${mode === 'pills'
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
                                    .value=${mode}
                                    @value-changed=${this._handleTrackTypeChange}>
                                </ha-selector>
                            `
                        }
                    ]
                }
            ],
            basicFields: [
                // Entity field moved to Control tab
                { path: 'id', label: 'Card ID', helper: '[Optional] Custom ID for targeting with rules and animations' },
                { path: 'tags', label: 'Tags', helper: 'Select existing tags or type new ones for rule targeting' }
            ],
            basicSectionHeader: 'Card Identification',
            basicSectionDescription: 'ID and tags for targeting with rules'
        });
    }

    /**
     * Control tab - Entity, range, and interaction settings
     * @returns {Array} Control tab definition
     */
    _getControlTabConfig() {
        return [
            {
                type: 'custom',
                render: () => html`
                    <lcards-message
                        type="info"
                        message="Configure the entity to control and its value range and behavior.">
                    </lcards-message>
                `
            },
            {
                type: 'section',
                header: 'Entity',
                description: 'Entity to control or display',
                icon: 'mdi:home-automation',
                expanded: true,
                outlined: true,
                children: [
                    {
                        type: 'field',
                        path: 'entity',
                        label: 'Entity',
                        helper: 'Entity to control/display (light, cover, fan, sensor, etc.)'
                    }
                ]
            },
            {
                type: 'section',
                header: 'Entity Attribute',
                description: 'Specific attribute to control',
                icon: 'mdi:database',
                expanded: true,
                outlined: true,
                children: [
                    {
                        type: 'field',
                        path: 'control.attribute',
                        label: 'Attribute',
                        helper: 'Entity attribute to control (e.g., brightness for lights, current_position for covers)'
                    }
                ]
            },
            {
                type: 'section',
                header: 'Value Range',
                description: 'Minimum, maximum, and step size',
                icon: 'mdi:tune',
                expanded: true,
                outlined: true,
                children: [
                    {
                        type: 'field',
                        path: 'control.min',
                        label: 'Minimum Value',
                        helper: 'Minimum slider value (default: 0 or entity min)'
                    },
                    {
                        type: 'field',
                        path: 'control.max',
                        label: 'Maximum Value',
                        helper: 'Maximum slider value (default: 100 or entity max)'
                    },
                    {
                        type: 'field',
                        path: 'control.step',
                        label: 'Step Size',
                        helper: 'Increment/decrement amount (default: 1 or entity step)'
                    }
                ]
            },
            {
                type: 'section',
                header: 'Interaction',
                description: 'Control interaction behavior',
                icon: 'mdi:gesture-tap',
                expanded: true,
                outlined: true,
                children: [
                    {
                        type: 'field',
                        path: 'control.locked',
                        label: 'Locked (Display Only)',
                        helper: 'Disable interaction (auto-locked for sensors)'
                    }
                ]
            }
        ];
    }

    /**
     * Track tab - Pills mode configuration (segmented bar)
     * Only shown when mode is 'pills'
     * @returns {Array} Track tab definition
     */
    _getTrackTabConfig() {
        return [
            {
                type: 'custom',
                render: () => html`
                    <lcards-message
                        type="info"
                        message="Configure the segmented pill display. Pills show filled/unfilled based on the current value.">
                    </lcards-message>
                `
            },
            {
                type: 'section',
                header: 'Track Layout',
                description: 'Margin and spacing around track',
                icon: 'mdi:page-layout-sidebar-left',
                expanded: true,
                outlined: true,
                children: [
                    {
                        type: 'field',
                        path: 'style.track.margin',
                        label: 'Track Margin',
                        helper: 'Margin around track in pixels (default: 10)'
                    }
                ]
            },
            {
                type: 'section',
                header: 'Pill Segments',
                description: 'Number, size, and shape of segments',
                icon: 'mdi:view-sequential',
                expanded: true,
                outlined: true,
                children: [
                    {
                        type: 'field',
                        path: 'style.track.segments.count',
                        label: 'Segment Count',
                        helper: 'Number of pill segments (leave empty for auto-calculation)'
                    },
                    {
                        type: 'field',
                        path: 'style.track.segments.gap',
                        label: 'Gap Size (px)',
                        helper: 'Space between segments in pixels'
                    },
                    {
                        type: 'field',
                        path: 'style.track.segments.shape.radius',
                        label: 'Border Radius (px)',
                        helper: 'Roundness of pill corners in pixels'
                    },
                    {
                        type: 'field',
                        path: 'style.track.segments.size.height',
                        label: 'Pill Height (px)',
                        helper: 'Height of each pill in pixels'
                    },
                    {
                        type: 'field',
                        path: 'style.track.segments.size.width',
                        label: 'Pill Width (px)',
                        helper: 'Width of each pill in pixels (leave empty for auto-calculation)'
                    }
                ]
            },
            {
                type: 'section',
                header: 'Gradient Behavior',
                description: 'Color interpolation behavior',
                icon: 'mdi:transition',
                expanded: true,
                outlined: true,
                children: [
                    {
                        type: 'field',
                        path: 'style.track.segments.gradient.interpolated',
                        label: 'Interpolate Colors',
                        helper: 'Blend colors smoothly across segments (vs. solid start/end colors)'
                    }
                ]
            },
            {
                type: 'section',
                header: 'Appearance',
                description: 'Opacity for filled and unfilled pills',
                icon: 'mdi:opacity',
                expanded: false,
                outlined: true,
                children: [
                    {
                        type: 'field',
                        path: 'style.track.segments.appearance.unfilled.opacity',
                        label: 'Unfilled Opacity',
                        helper: 'Opacity for unfilled pills (0-1, default: 0.2)'
                    },
                    {
                        type: 'field',
                        path: 'style.track.segments.appearance.filled.opacity',
                        label: 'Filled Opacity',
                        helper: 'Opacity for filled pills (0-1, default: 1.0)'
                    }
                ]
            }
        ];
    }

    /**
     * Gauge tab - Gauge/ruler mode configuration
     * Only shown when mode is 'gauge'
     * @returns {Array} Gauge tab definition
     */
    _getGaugeTabConfig() {
        return [
            {
                type: 'custom',
                render: () => html`
                    <lcards-message
                        type="info"
                        message="Configure the gauge/ruler display with progress bar, tick marks, and scale labels. Colors are configured in the Colors tab.">
                    </lcards-message>
                `
            },
            {
                type: 'section',
                header: 'Progress Bar',
                description: 'Current value indicator bar',
                icon: 'mdi:progress-check',
                expanded: true,
                outlined: true,
                children: [
                    {
                        type: 'field',
                        path: 'style.gauge.progress_bar.height',
                        label: 'Height',
                        helper: 'Progress bar height in pixels (default: 12)'
                    },
                    {
                        type: 'field',
                        path: 'style.gauge.progress_bar.radius',
                        label: 'Border Radius',
                        helper: 'Progress bar border radius in pixels (default: 2)'
                    }
                ]
            },
            {
                type: 'section',
                header: 'Major Tick Marks',
                description: 'Primary scale marks',
                icon: 'mdi:ruler',
                expanded: true,
                outlined: true,
                children: [
                    {
                        type: 'field',
                        path: 'style.gauge.scale.tick_marks.major.enabled',
                        label: 'Show Major Ticks'
                    },
                    {
                        type: 'field',
                        path: 'style.gauge.scale.tick_marks.major.interval',
                        label: 'Interval',
                        helper: 'Value interval between major ticks (e.g., 10 for every 10 units)'
                    },
                    {
                        type: 'field',
                        path: 'style.gauge.scale.tick_marks.major.width',
                        label: 'Line Width',
                        helper: 'Major tick line width in pixels (default: 2)'
                    }
                ]
            },
            {
                type: 'section',
                header: 'Minor Tick Marks',
                description: 'Secondary scale marks',
                icon: 'mdi:ruler',
                expanded: false,
                outlined: true,
                children: [
                    {
                        type: 'field',
                        path: 'style.gauge.scale.tick_marks.minor.enabled',
                        label: 'Show Minor Ticks'
                    },
                    {
                        type: 'field',
                        path: 'style.gauge.scale.tick_marks.minor.interval',
                        label: 'Interval',
                        helper: 'Value interval between minor ticks (e.g., 2 for every 2 units)'
                    },
                    {
                        type: 'field',
                        path: 'style.gauge.scale.tick_marks.minor.height',
                        label: 'Height',
                        helper: 'Minor tick height in pixels (default: 10)'
                    },
                    {
                        type: 'field',
                        path: 'style.gauge.scale.tick_marks.minor.width',
                        label: 'Line Width',
                        helper: 'Minor tick line width in pixels (default: 1)'
                    }
                ]
            },
            {
                type: 'section',
                header: 'Scale Labels',
                description: 'Numeric labels on scale',
                icon: 'mdi:format-text',
                expanded: false,
                outlined: true,
                children: [
                    {
                        type: 'field',
                        path: 'style.gauge.scale.labels.enabled',
                        label: 'Show Scale Labels'
                    },
                    {
                        type: 'field',
                        path: 'style.gauge.scale.labels.unit',
                        label: 'Unit',
                        helper: 'Unit to append to values (%, °C, °F, W, etc.)'
                    },
                    {
                        type: 'field',
                        path: 'style.gauge.scale.labels.font_size',
                        label: 'Font Size',
                        helper: 'Label font size in pixels (default: 14)'
                    },
                    {
                        type: 'field',
                        path: 'style.gauge.scale.labels.padding',
                        label: 'Padding',
                        helper: 'Space between tick and label in pixels (default: 3)'
                    }
                ]
            },
            {
                type: 'section',
                header: 'Value Indicator',
                description: 'Current value marker (optional)',
                icon: 'mdi:arrow-up-bold',
                expanded: false,
                outlined: true,
                children: [
                    {
                        type: 'field',
                        path: 'style.gauge.indicator.enabled',
                        label: 'Show Indicator',
                        helper: 'Display a marker at the current value'
                    },
                    {
                        type: 'field',
                        path: 'style.gauge.indicator.type',
                        label: 'Indicator Type',
                        helper: 'line: vertical/horizontal line, thumb: circular marker'
                    },
                    {
                        type: 'field',
                        path: 'style.gauge.indicator.size.width',
                        label: 'Width',
                        helper: 'Indicator width in pixels (default: 4)'
                    },
                    {
                        type: 'field',
                        path: 'style.gauge.indicator.size.height',
                        label: 'Height',
                        helper: 'Indicator height in pixels (default: 25)'
                    },
                    {
                        type: 'field',
                        path: 'style.gauge.indicator.border.enabled',
                        label: 'Show Border',
                        helper: 'Add border around indicator'
                    },
                    {
                        type: 'field',
                        path: 'style.gauge.indicator.border.width',
                        label: 'Border Width',
                        helper: 'Border width in pixels (default: 1)'
                    }
                ]
            }
        ];
    }

    /**
     * Advanced tab - Grid layout and other settings
     * @returns {Array} Advanced tab definition
     */
    _getAdvancedTabConfig() {
        return [
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
            }
        ];
    }

    // ============================================================================
    // TAB RENDERERS - Use specialized components for complex UIs
    // ============================================================================

    /**
     * Text tab - Text field configuration (button-style)
     * Uses multi-text editor for full button compatibility
     */
    _renderTextTab() {
        return html`
            <div class="section-container">
                <lcards-message
                    type="info"
                    message="Configure text fields using the button card's text system. Text is positioned in border caps (left/top/right/bottom) or the track area.">
                </lcards-message>

                <lcards-multi-text-editor
                    .editor=${this}
                    .config=${this.config}
                    .hass=${this.hass}>
                </lcards-multi-text-editor>
            </div>
        `;
    }

    /**
     * Colors tab - All color configuration consolidated
     * Dynamically shows pills or gauge colors based on mode
     */
    _renderColorsTab() {
        const mode = this._getMode();

        if (mode === 'pills') {
            return html`
                <div class="section-container">
                    <lcards-message
                        type="info"
                        message="Configure pill gradient colors. Pills interpolate smoothly between start and end colors.">
                    </lcards-message>

                    <lcards-form-section
                        header="Pill Gradient Colors"
                        description="Start and end colors for pill gradient"
                        ?expanded=${true}
                        outlined>

                        <div style="margin-bottom: 12px;">
                            <div style="font-size: 14px; font-weight: 500; margin-bottom: 8px; padding: 2px 8px;">
                                Gradient Start
                            </div>
                            <lcards-color-picker
                                .hass=${this.hass}
                                .value=${this._getConfigValue('style.track.segments.gradient.start') || ''}
                                ?showPreview=${true}
                                @value-changed=${(e) => this._handleGradientColorChange('start', e)}>
                            </lcards-color-picker>
                            <div style="font-size: 12px; color: var(--secondary-text-color); margin-top: 4px; padding: 0 8px;">
                                Color at minimum value (left/bottom)
                            </div>
                        </div>

                        <div style="margin-bottom: 12px;">
                            <div style="font-size: 14px; font-weight: 500; margin-bottom: 8px; padding: 2px 8px;">
                                Gradient End
                            </div>
                            <lcards-color-picker
                                .hass=${this.hass}
                                .value=${this._getConfigValue('style.track.segments.gradient.end') || ''}
                                ?showPreview=${true}
                                @value-changed=${(e) => this._handleGradientColorChange('end', e)}>
                            </lcards-color-picker>
                            <div style="font-size: 12px; color: var(--secondary-text-color); margin-top: 4px; padding: 0 8px;">
                                Color at maximum value (right/top)
                            </div>
                        </div>

                    </lcards-form-section>

                    <lcards-color-section
                        .editor=${this}
                        basePath="style.track"
                        header="Track Background"
                        description="Background color behind pills"
                        .colorPaths=${[
                            { path: 'background', label: 'Background', helper: 'Track background color' }
                        ]}
                        ?expanded=${false}
                        ?useColorPicker=${true}>
                    </lcards-color-section>
                </div>
            `;
        } else {
            return html`
                <div class="section-container">
                    <lcards-message
                        type="info"
                        message="Configure gauge colors for progress bar, ticks, labels, and value indicator.">
                    </lcards-message>

                    <lcards-color-section
                        .editor=${this}
                        basePath="style.gauge.progress_bar"
                        header="Progress Bar Color"
                        description="Color of the filled progress bar"
                        .colorPaths=${[
                            { path: 'color', label: 'Progress Color', helper: 'Color of progress bar fill' }
                        ]}
                        ?expanded=${true}
                        ?useColorPicker=${true}>
                    </lcards-color-section>

                    <lcards-color-section
                        .editor=${this}
                        basePath="style.gauge.scale.tick_marks.major"
                        header="Tick Mark Colors"
                        description="Colors for scale tick marks"
                        .colorPaths=${[
                            { path: 'color', label: 'Tick Color', helper: 'Color of tick marks (both major and minor)' }
                        ]}
                        ?expanded=${false}
                        ?useColorPicker=${true}>
                    </lcards-color-section>

                    <lcards-color-section
                        .editor=${this}
                        basePath="style.gauge.scale.labels"
                        header="Label Colors"
                        description="Color for scale numeric labels"
                        .colorPaths=${[
                            { path: 'color', label: 'Label Color', helper: 'Color of numeric scale labels' }
                        ]}
                        ?expanded=${false}
                        ?useColorPicker=${true}>
                    </lcards-color-section>

                    <lcards-color-section
                        .editor=${this}
                        basePath="style.gauge.indicator"
                        header="Indicator Colors"
                        description="Colors for value indicator marker"
                        .colorPaths=${[
                            { path: 'color', label: 'Indicator Color', helper: 'Color of value indicator' },
                            { path: 'border.color', label: 'Border Color', helper: 'Color of indicator border' }
                        ]}
                        ?expanded=${false}
                        ?useColorPicker=${true}>
                    </lcards-color-section>
                </div>
            `;
        }
    }

    /**
     * Borders tab - Border editor with visual preview
     */
    _renderBordersTab() {
        return html`
            <div class="section-container">
                <lcards-message
                    type="info"
                    message="Configure SVG borders rendered as part of the component. Use the unified mode for equal borders on all sides, or per-side mode for individual control.">
                </lcards-message>

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
            </div>
        `;
    }

    /**
     * Actions tab - multi-action editor
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
     * Rules tab - display-only rules dashboard
     */
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
        const oldMode = this._getMode();

        if (newMode === oldMode) return;

        lcardsLog.info(`[LCARdSSliderEditor] Mode switch: ${oldMode} → ${newMode}`);

        // Clean incompatible config
        this._cleanConfigForChange(oldMode, newMode);

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
                            radius: 2,
                            gradient: {
                                start: '{theme:palette.moonlight}',
                                end: '{theme:palette.alert-red}',
                                interpolation: 'smooth'
                            }
                        },
                        margin: { left: 0, right: 0 },
                        background: 'transparent',
                        opacity: { inactive: 0.2 }
                    }
                }
            };
        } else if (newMode === 'gauge') {
            modeDefaults = {
                style: {
                    gauge: {
                        progress_bar: {
                            height: 10,
                            radius: 5,
                            color: '{theme:palette.moonlight}'
                        },
                        scale: {
                            tick_marks: {
                                major: { interval: 10, width: 2, height: 12, color: '{theme:palette.moonlight}' },
                                minor: { interval: 5, width: 1, height: 6, color: '{theme:palette.text-dim}' }
                            },
                            labels: {
                                font_size: 12,
                                padding: { top: 8 },
                                unit: '',
                                color: '{theme:palette.text-primary}'
                            }
                        },
                        indicator: {
                            type: 'triangle',
                            size: { width: 12, height: 12 },
                            color: '{theme:palette.alert-red}',
                            border: { width: 1, color: '{theme:palette.moonlight}' }
                        }
                    }
                }
            };
        }

        // Deep merge defaults with existing config
        const updatedConfig = deepMerge({}, this.config, modeDefaults);

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

    /**
     * Handle gradient color change
     * @param {string} type - 'start' or 'end'
     * @param {CustomEvent} e - Color change event
     * @private
     */
    _handleGradientColorChange(type, e) {
        const path = `style.track.segments.gradient.${type}`;
        this._setConfigValue(path, e.detail.value);
    }

    // ============================================================================
    // HELPER METHODS
    // ============================================================================

    /**
     * Get preset options for dropdown
     * @private
     */
    _getPresetOptions() {
        const stylePresetManager = window.lcards?.core?.stylePresetManager;
        if (!stylePresetManager) return [];

        const presets = stylePresetManager.getAvailablePresets('slider');
        return presets.map(name => ({ value: name, label: name }));
    }

    /**
     * Get component options for dropdown
     * @private
     */
    _getComponentOptions() {
        return [
            { value: 'horizontal', label: 'Horizontal' },
            { value: 'vertical', label: 'Vertical' },
            { value: 'picard-vertical', label: 'Picard Vertical' }
        ];
    }
}

// Register custom element
customElements.define('lcards-slider-editor', LCARdSSliderEditor);

lcardsLog.info('[LCARdSSliderEditor] Standalone editor module loaded');
