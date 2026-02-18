/**
 * Alert Component with Component Preset System
 *
 * LCARS alert symbol component with animated bar segments and text labels.
 * Implements component-specific presets for different condition states.
 *
 * Features:
 * - Component presets (condition_red, condition_blue, etc.)
 * - Text segments with template support
 * - Animated bar segments
 * - Theme token integration
 *
 * Architecture:
 * - 1 main shape segment (alert symbol)
 * - 12 bar segments (animated horizontal bars)
 * - 2 text segments (alert_text, sub_text)
 *
 * @module core/packs/components/alert
 */

/**
 * Alert SVG Shape (Inline)
 * LCARS-style alert symbol with animated bars and text elements
 * Standard size: 100mm × 85.56mm
 */
const alertSvg = `<svg viewBox="0 0 100 85.56" xmlns="http://www.w3.org/2000/svg">
  <g id="alert-shape">
    <path fill-rule="evenodd" clip-rule="evenodd" d="
      M30.40 0 V21.00 C30.40 21.84 31.06 22.50 31.89 22.50
      H68.08 C68.91 22.50 69.57 21.84 69.57 21.00 V0
      C77.94 2.90 85.08 7.63 90.35 13.59
      L75.92 25.26 H24.08 L9.29 13.59
      C14.62 7.63 22.01 2.90 30.40 0Z
      M1.08 28.36 C0.37 31.07 0 33.84 0 36.63
      C0 39.42 0.37 42.19 1.08 44.90
      H15.10 V28.36 H1.08Z
      M9.29 60.03 C14.62 65.90 22.01 70.62 30.40 73.56
      V52.54 C30.40 51.70 31.06 51.04 31.89 51.04
      H68.08 C68.91 51.04 69.57 51.70 69.57 52.54 V73.56
      C77.94 70.62 85.08 65.90 90.35 60.03
      L75.92 48.37 H24.08 L9.29 60.03Z
      M98.67 44.90 C99.38 42.19 99.76 39.42 99.76 36.63
      C99.76 33.84 99.38 31.07 98.67 28.36
      H84.77 V44.90 H98.67Z
    "/>
  </g>
  
  <!-- Animated bars (12 lines) -->
  <g id="alert-bars">
    <line id="bar-1" x1="50" y1="0" x2="50" y2="2.9" stroke-width="33.33"/>
    <line id="bar-2" x1="50" y1="5.8" x2="50" y2="8.7" stroke-width="33.33"/>
    <line id="bar-3" x1="50" y1="11.6" x2="50" y2="14.5" stroke-width="33.33"/>
    <line id="bar-4" x1="50" y1="17.4" x2="50" y2="20.3" stroke-width="33.33"/>
    <line id="bar-5" x1="50" y1="23.2" x2="50" y2="26.1" stroke-width="33.33"/>
    <line id="bar-6" x1="50" y1="29.0" x2="50" y2="31.9" stroke-width="33.33"/>
    <line id="bar-7" x1="50" y1="53.7" x2="50" y2="56.6" stroke-width="33.33"/>
    <line id="bar-8" x1="50" y1="59.5" x2="50" y2="62.4" stroke-width="33.33"/>
    <line id="bar-9" x1="50" y1="65.3" x2="50" y2="68.2" stroke-width="33.33"/>
    <line id="bar-10" x1="50" y1="71.1" x2="50" y2="74.0" stroke-width="33.33"/>
    <line id="bar-11" x1="50" y1="76.9" x2="50" y2="79.8" stroke-width="33.33"/>
    <line id="bar-12" x1="50" y1="82.7" x2="50" y2="85.56" stroke-width="33.33"/>
  </g>
  
  <!-- Text elements -->
  <text id="alert-text" x="50" y="40" text-anchor="middle" dominant-baseline="middle">ALERT</text>
  <text id="sub-text" x="50" y="50" text-anchor="middle" dominant-baseline="middle">CONDITION</text>
</svg>`;

/**
 * Alert component registry with preset system
 *
 * Component presets define complete segment overrides for different alert conditions.
 * Merge order: component.segments ← preset.segments ← user.segments ← rules
 *
 * @type {Object.<string, Object>}
 */
export const alertComponents = {
    'alert': {
        id: 'alert',
        name: 'LCARS Alert',
        description: 'Animated alert symbol with condition presets',
        version: '1.0.0',
        
        // Inline SVG content
        svg: alertSvg,
        
        // Orientation (square aspect ratio for alert symbol)
        orientation: 'square',
        
        // Features supported by this component
        features: ['multi-segment', 'state-based-styling', 'animation-targets', 'text-segments', 'component-presets'],
        
        // Component defaults
        defaults: {
            animation_duration: 2,
            blink_duration: 4,
            blink_delay: 2,
            enable_bar_animation: true,
            enable_blink: true
        },
        
        // Default segment configurations with theme token references
        segments: {
            shape: {
                selector: '#alert-shape path',
                style: {
                    fill: 'theme:components.alert.shape.fill.default'
                }
            },
            bars: {
                selector: '[id^="bar-"]',
                style: {
                    stroke: 'theme:components.alert.bars.stroke.default',
                    stroke_width: 33.33,
                    animation_base: 'theme:components.alert.bars.stroke.animation_base',
                    animation_flash: 'theme:components.alert.bars.stroke.animation_flash'
                }
            },
            alert_text: {
                selector: '#alert-text',
                text: 'ALERT',
                style: {
                    fill: 'theme:components.alert.text.alert_text.color.default',
                    font_size: 'theme:components.alert.text.alert_text.font.size',
                    font_weight: 'theme:components.alert.text.alert_text.font.weight',
                    font_family: 'theme:components.alert.text.alert_text.font.family',
                    text_transform: 'uppercase'
                }
            },
            sub_text: {
                selector: '#sub-text',
                text: 'CONDITION',
                style: {
                    fill: 'theme:components.alert.text.sub_text.color.default',
                    font_size: 'theme:components.alert.text.sub_text.font.size',
                    font_weight: 'theme:components.alert.text.sub_text.font.weight',
                    font_family: 'theme:components.alert.text.sub_text.font.family',
                    text_transform: 'uppercase'
                }
            }
        },
        
        // Component presets (override segments)
        presets: {
            default: {},
            
            condition_red: {
                segments: {
                    shape: { style: { fill: 'var(--lcars-alert-red)' } },
                    bars: { 
                        style: { 
                            stroke: 'var(--lcars-alert-red)', 
                            animation_base: 'var(--lcars-alert-red)', 
                            animation_flash: 'var(--picard-lightest-orange)' 
                        } 
                    },
                    alert_text: { text: 'ALERT', style: { fill: 'var(--lcars-alert-red)' } },
                    sub_text: { text: 'CONDITION: RED', style: { fill: 'var(--lcars-alert-red)' } }
                }
            },
            
            condition_blue: {
                segments: {
                    shape: { style: { fill: 'var(--lcars-alert-blue)' } },
                    bars: { 
                        style: { 
                            stroke: 'var(--lcars-alert-blue)', 
                            animation_base: 'var(--lcars-alert-blue)', 
                            animation_flash: 'var(--picard-light-blue)' 
                        } 
                    },
                    alert_text: { text: 'ALERT', style: { fill: 'var(--lcars-alert-blue)' } },
                    sub_text: { text: 'CONDITION: BLUE', style: { fill: 'var(--lcars-alert-blue)' } }
                }
            },
            
            condition_green: {
                segments: {
                    shape: { style: { fill: 'var(--picard-green)' } },
                    bars: { 
                        style: { 
                            stroke: 'var(--picard-green)', 
                            animation_base: 'var(--picard-green)', 
                            animation_flash: 'var(--picard-light-green)' 
                        } 
                    },
                    alert_text: { text: 'ALERT', style: { fill: 'var(--picard-green)' } },
                    sub_text: { text: 'CONDITION: GREEN', style: { fill: 'var(--picard-green)' } }
                }
            },
            
            condition_yellow: {
                segments: {
                    shape: { style: { fill: 'var(--lcars-alert-yellow)' } },
                    bars: { 
                        style: { 
                            stroke: 'var(--lcars-alert-yellow)', 
                            animation_base: 'var(--lcars-alert-yellow)', 
                            animation_flash: 'var(--picard-yellow)' 
                        } 
                    },
                    alert_text: { text: 'ALERT', style: { fill: 'var(--lcars-alert-yellow)' } },
                    sub_text: { text: 'CONDITION: YELLOW', style: { fill: 'var(--lcars-alert-yellow)' } }
                }
            },
            
            condition_grey: {
                segments: {
                    shape: { style: { fill: 'var(--picard-dark-gray)' } },
                    bars: { 
                        style: { 
                            stroke: 'var(--picard-grey)', 
                            animation_base: 'var(--picard-darkest-gray)', 
                            animation_flash: 'var(--picard-medium-light-gray)' 
                        } 
                    },
                    alert_text: { text: 'ALERT', style: { fill: 'var(--picard-dark-gray)' } },
                    sub_text: { text: 'CONDITION: GREY', style: { fill: 'var(--picard-dark-gray)' } }
                }
            },
            
            condition_black: {
                segments: {
                    shape: { style: { fill: 'var(--picard-lightest-blue)' } },
                    bars: { 
                        style: { 
                            stroke: 'var(--picard-lightest-blue)', 
                            animation_base: 'var(--picard-lightest-blue)', 
                            animation_flash: 'black' 
                        } 
                    },
                    alert_text: { text: 'ALERT', style: { fill: 'var(--picard-lightest-blue)' } },
                    sub_text: { text: 'CONDITION: BLACK', style: { fill: 'var(--picard-lightest-blue)' } }
                }
            }
        },
        
        /**
         * Validate preset name for this component
         * @param {string} presetName - Preset name to validate
         * @returns {boolean} True if preset exists
         */
        validatePreset(presetName) {
            return presetName in this.presets;
        },
        
        /**
         * Get all available preset names
         * @returns {Array<string>} Array of preset names
         */
        getPresetNames() {
            return Object.keys(this.presets);
        },
        
        // Metadata for discovery and documentation
        metadata: {
            type: 'alert',
            id: 'alert',
            name: 'Alert Symbol',
            description: 'LCARS alert symbol with condition presets and animated bars',
            version: '1.0.0',
            
            // Example usage documentation
            examples: {
                basic: {
                    description: 'Basic red alert with component preset',
                    config: {
                        type: 'custom:lcards-button',
                        component: 'alert',
                        preset: 'condition_red',
                        entity: 'binary_sensor.red_alert'
                    }
                },
                ranges: {
                    description: 'Range-based preset switching',
                    config: {
                        type: 'custom:lcards-button',
                        component: 'alert',
                        entity: 'sensor.temperature',
                        ranges: {
                            enabled: true,
                            ranges: [
                                { from: 0, to: 50, preset: 'condition_green' },
                                { from: 50, to: 80, preset: 'condition_yellow' },
                                { from: 80, to: 100, preset: 'condition_red' }
                            ]
                        }
                    }
                },
                customText: {
                    description: 'Custom text with template',
                    config: {
                        type: 'custom:lcards-button',
                        component: 'alert',
                        preset: 'condition_blue',
                        entity: 'sensor.cpu_usage',
                        segments: {
                            alert_text: {
                                text: "[[[return entity.state > 80 ? 'CRITICAL' : 'OK']]]"
                            },
                            sub_text: {
                                text: "{entity.state}% CPU"
                            }
                        }
                    }
                }
            }
        }
    }
};

/**
 * Get an alert component by name
 * @param {string} name - Component name
 * @returns {Object|undefined} Component object or undefined if not found
 */
export function getAlertComponent(name) {
    return alertComponents[name];
}

/**
 * Check if an alert component exists
 * @param {string} name - Component name
 * @returns {boolean} True if component exists
 */
export function hasAlertComponent(name) {
    return name in alertComponents;
}

/**
 * Get all available alert component names
 * @returns {string[]} Array of component names
 */
export function getAlertComponentNames() {
    return Object.keys(alertComponents);
}
