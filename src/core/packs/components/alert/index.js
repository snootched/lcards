/**
 * Alert Component (Unified Format)
 *
 * LCARS alert symbol component with animated bar segments.
 * Provides visual alerts for critical status monitoring and alarm states.
 *
 * This component uses the unified component format with inline SVG, following
 * the same architecture as DPAD. All segment configurations use theme tokens
 * for consistent styling across themes.
 *
 * Architecture:
 * - 1 main shape segment (alert symbol)
 * - 6 top bar segments (horizontal bars above symbol)
 * - 6 bottom bar segments (horizontal bars below symbol)
 * - Total: 13 interactive segments
 *
 * @module core/packs/components/alert
 */

/**
 * Alert SVG Shape (Inline)
 * LCARS-style alert symbol with animated bar segments
 * Standard size: 100mm × 73.56mm (maintains button card aspect ratio)
 */
const alertSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="100mm" height="73.56mm" version="1.1" viewBox="0 0 100 73.56" xmlns="http://www.w3.org/2000/svg">
  <metadata>
    <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:cc="http://creativecommons.org/ns#" xmlns:dc="http://purl.org/dc/elements/1.1/">
      <cc:Work rdf:about="">
        <dc:format>image/svg+xml</dc:format>
        <dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage"/>
        <dc:title>LCARdS Alert Symbol Component</dc:title>
        <dc:description>LCARS alert symbol with animated bar segments for status monitoring</dc:description>
      </cc:Work>
    </rdf:RDF>
  </metadata>

  <!-- Background (transparent) -->
  <rect id="background" width="100" height="73.56" fill="none" />

  <!-- Main Alert Shape (Octagon with exclamation) -->
  <g id="shape">
    <!-- Octagon outline -->
    <path d="M 30,15 L 70,15 L 85,30 L 85,60 L 70,75 L 30,75 L 15,60 L 15,30 Z" 
          fill="none" stroke="#999999" stroke-width="3" />
    
    <!-- Exclamation mark -->
    <rect x="47" y="28" width="6" height="28" rx="2" fill="#999999" />
    <circle cx="50" cy="64" r="3.5" fill="#999999" />
  </g>

  <!-- Top Bar Segments (above alert symbol) -->
  <rect id="bar-top-1" x="5" y="2" width="12" height="4" rx="1" fill="#999999" />
  <rect id="bar-top-2" x="20" y="2" width="12" height="4" rx="1" fill="#999999" />
  <rect id="bar-top-3" x="35" y="2" width="12" height="4" rx="1" fill="#999999" />
  <rect id="bar-top-4" x="53" y="2" width="12" height="4" rx="1" fill="#999999" />
  <rect id="bar-top-5" x="68" y="2" width="12" height="4" rx="1" fill="#999999" />
  <rect id="bar-top-6" x="83" y="2" width="12" height="4" rx="1" fill="#999999" />

  <!-- Bottom Bar Segments (below alert symbol) -->
  <rect id="bar-bottom-1" x="5" y="67.56" width="12" height="4" rx="1" fill="#999999" />
  <rect id="bar-bottom-2" x="20" y="67.56" width="12" height="4" rx="1" fill="#999999" />
  <rect id="bar-bottom-3" x="35" y="67.56" width="12" height="4" rx="1" fill="#999999" />
  <rect id="bar-bottom-4" x="53" y="67.56" width="12" height="4" rx="1" fill="#999999" />
  <rect id="bar-bottom-5" x="68" y="67.56" width="12" height="4" rx="1" fill="#999999" />
  <rect id="bar-bottom-6" x="83" y="67.56" width="12" height="4" rx="1" fill="#999999" />
</svg>`;

/**
 * Alert component registry (unified format)
 *
 * This follows the same structure as DPAD and slider components:
 * - svg: Inline SVG content (no external shapes registry needed)
 * - orientation: Layout direction (square for alert symbol)
 * - features: Array of supported features
 * - segments: Pre-defined interactive regions with styles and actions
 * - metadata: Discovery and documentation info
 *
 * @type {Object.<string, Object>}
 */
export const alertComponents = {
    'alert': {
        // Inline SVG content
        svg: alertSvg,

        // Orientation (square aspect ratio for alert symbol)
        orientation: 'square',

        // Features supported by this component
        features: ['multi-segment', 'state-based-styling', 'animation-targets'],

        // Default segment configurations with theme token references
        segments: {
            // Main alert shape
            shape: {
                style: {
                    fill: 'theme:components.alert.segment.shape.fill',
                    stroke: 'theme:components.alert.segment.shape.stroke',
                    'stroke-width': 'theme:components.alert.segment.shape.stroke-width',
                }
            },

            // Top bar segments
            'bar-top-1': {
                style: {
                    fill: 'theme:components.alert.segment.bar.fill',
                    stroke: 'theme:components.alert.segment.bar.stroke',
                    'stroke-width': 'theme:components.alert.segment.bar.stroke-width',
                }
            },
            'bar-top-2': {
                style: {
                    fill: 'theme:components.alert.segment.bar.fill',
                    stroke: 'theme:components.alert.segment.bar.stroke',
                    'stroke-width': 'theme:components.alert.segment.bar.stroke-width',
                }
            },
            'bar-top-3': {
                style: {
                    fill: 'theme:components.alert.segment.bar.fill',
                    stroke: 'theme:components.alert.segment.bar.stroke',
                    'stroke-width': 'theme:components.alert.segment.bar.stroke-width',
                }
            },
            'bar-top-4': {
                style: {
                    fill: 'theme:components.alert.segment.bar.fill',
                    stroke: 'theme:components.alert.segment.bar.stroke',
                    'stroke-width': 'theme:components.alert.segment.bar.stroke-width',
                }
            },
            'bar-top-5': {
                style: {
                    fill: 'theme:components.alert.segment.bar.fill',
                    stroke: 'theme:components.alert.segment.bar.stroke',
                    'stroke-width': 'theme:components.alert.segment.bar.stroke-width',
                }
            },
            'bar-top-6': {
                style: {
                    fill: 'theme:components.alert.segment.bar.fill',
                    stroke: 'theme:components.alert.segment.bar.stroke',
                    'stroke-width': 'theme:components.alert.segment.bar.stroke-width',
                }
            },

            // Bottom bar segments
            'bar-bottom-1': {
                style: {
                    fill: 'theme:components.alert.segment.bar.fill',
                    stroke: 'theme:components.alert.segment.bar.stroke',
                    'stroke-width': 'theme:components.alert.segment.bar.stroke-width',
                }
            },
            'bar-bottom-2': {
                style: {
                    fill: 'theme:components.alert.segment.bar.fill',
                    stroke: 'theme:components.alert.segment.bar.stroke',
                    'stroke-width': 'theme:components.alert.segment.bar.stroke-width',
                }
            },
            'bar-bottom-3': {
                style: {
                    fill: 'theme:components.alert.segment.bar.fill',
                    stroke: 'theme:components.alert.segment.bar.stroke',
                    'stroke-width': 'theme:components.alert.segment.bar.stroke-width',
                }
            },
            'bar-bottom-4': {
                style: {
                    fill: 'theme:components.alert.segment.bar.fill',
                    stroke: 'theme:components.alert.segment.bar.stroke',
                    'stroke-width': 'theme:components.alert.segment.bar.stroke-width',
                }
            },
            'bar-bottom-5': {
                style: {
                    fill: 'theme:components.alert.segment.bar.fill',
                    stroke: 'theme:components.alert.segment.bar.stroke',
                    'stroke-width': 'theme:components.alert.segment.bar.stroke-width',
                }
            },
            'bar-bottom-6': {
                style: {
                    fill: 'theme:components.alert.segment.bar.fill',
                    stroke: 'theme:components.alert.segment.bar.stroke',
                    'stroke-width': 'theme:components.alert.segment.bar.stroke-width',
                }
            },
        },

        // Metadata for discovery and documentation
        metadata: {
            type: 'alert',  // Explicit type for ComponentManager
            id: 'alert',
            name: 'Alert Symbol',
            description: 'LCARS alert symbol with animated bar segments for status monitoring',
            version: '1.0.0',

            // Example usage documentation
            examples: {
                basic: {
                    description: 'Basic red alert with entity binding',
                    config: {
                        type: 'custom:lcards-button',
                        component: 'alert',
                        entity: 'binary_sensor.red_alert',
                        preset: 'alert-red',
                        text: {
                            name: {
                                content: 'RED ALERT',
                                position: 'center'
                            }
                        }
                    },
                },
                animated: {
                    description: 'Alert with pulsing bar animation',
                    config: {
                        type: 'custom:lcards-button',
                        component: 'alert',
                        entity: 'binary_sensor.intruder_alert',
                        preset: 'alert-yellow',
                        animations: [
                            {
                                targets: "[id^='bar-top-'], [id^='bar-bottom-']",
                                preset: 'pulse',
                                params: {
                                    duration: 500,
                                    max_scale: 1.05,
                                    loop: true,
                                    stagger: 83.3
                                }
                            }
                        ]
                    },
                },
                rules: {
                    description: 'Dynamic alert preset switching based on threat level',
                    config: {
                        type: 'custom:lcards-button',
                        component: 'alert',
                        entity: 'sensor.threat_level',
                        preset: 'alert-green',
                        rules: [
                            {
                                id: 'high_threat',
                                when: {
                                    entity: 'sensor.threat_level',
                                    above: 80
                                },
                                apply: {
                                    preset: 'alert-red'
                                }
                            },
                            {
                                id: 'medium_threat',
                                when: {
                                    entity: 'sensor.threat_level',
                                    above: 50,
                                    below: 80
                                },
                                apply: {
                                    preset: 'alert-yellow'
                                }
                            }
                        ]
                    },
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
