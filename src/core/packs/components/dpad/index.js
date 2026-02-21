/**
 * D-Pad Component (Unified Format)
 *
 * Interactive 9-segment D-pad control for media players, remotes, or directional navigation.
 * Provides 4 directional arrows (up/down/left/right), 4 diagonal corners, and center button.
 *
 * This component uses the unified component format with inline SVG, eliminating the need
 * for the separate shapes registry. All segment configurations use theme tokens for
 * consistent styling across themes.
 *
 * @module core/packs/components/dpad
 */

/**
 * D-Pad SVG Shape (Inline)
 * 9-segment interactive directional control
 * Migrated from shapes registry to unified component format
 */
const dpadSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="80mm" height="80mm" version="1.1" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
  <metadata>
    <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:cc="http://creativecommons.org/ns#" xmlns:dc="http://purl.org/dc/elements/1.1/">
      <cc:Work rdf:about="">
        <dc:format>image/svg+xml</dc:format>
        <dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage"/>
        <dc:title>LCARdS D-Pad Interactive Component</dc:title>
        <dc:description>9-segment interactive D-pad control for remote/media control</dc:description>
      </cc:Work>
    </rdf:RDF>
  </metadata>

  <!-- Background -->

  <!--
  <rect id="background" width="80" height="80" fill="#1a1a2e" />
  -->
  <rect id="background" width="80" height="80" fill="none" />

  <!-- Diagonal Corner Segments -->
  <path id="up-left" d="m33 33v-32.35c-15.992 2.4474-29.977 16.417-32.424 32.35z" />
  <path id="up-right" d="m47 33v-32.35c15.992 2.4474 29.977 16.417 32.424 32.35z" />
  <path id="down-left" d="m33 47v32.35c-15.992-2.4474-29.977-16.417-32.424-32.35z" />
  <path id="down-right" d="m47 47v32.35c15.992-2.4474 29.977-16.417 32.424-32.35z" />

  <!-- Directional Arrows -->
  <path id="up" d="m34 10h12v-9.5c-3.8785-0.47437-8.044-0.4824-12 0z" />
  <path id="down" d="m46 70h-12v9.5c3.8785 0.47437 8.044 0.4824 12 0z" />
  <path id="left" d="m10 46v-12h-9.5c-0.47437 3.8785-0.4824 8.044 0 12z" />
  <path id="right" d="m70 34v12h9.5c0.47437-3.8785 0.4824-8.044 0-12z" />

  <!-- Center Button (plus shape) -->
  <path id="center" d="m11 34v12h23v23h12v-23h23v-12h-23v-23h-12v23z" />

  <!-- Decorative Lines (optional - can be styled or hidden) -->
  <g id="decorative-lines" opacity="0.3">
    <path d="m34 13.49h12" stroke="#000" stroke-width="0.75" fill="none"/>
    <path d="m34 16.2h12" stroke="#000" stroke-width="0.75" fill="none"/>
    <path d="m34 19.48h12" stroke="#000" stroke-width="0.75" fill="none"/>
    <path d="m34 27.9h12" stroke="#000" stroke-width="0.75" fill="none"/>
    <path d="m34 59h12" stroke="#000" stroke-width="0.75" fill="none"/>
    <path d="m44.2 2.199v5.0271" stroke="#000" stroke-width="1.2" fill="none"/>
    <path d="m2.199 35.8h5.0271" stroke="#000" stroke-width="1.2" fill="none"/>
    <path d="m77.801 44.2h-5.0271" stroke="#000" stroke-width="1.2" fill="none"/>
    <path d="m35.8 77.801v-5.0271" stroke="#000" stroke-width="1.2" fill="none"/>
  </g>
</svg>`;

/**
 * D-Pad component registry (unified format)
 *
 * This follows the same structure as slider and button components:
 * - svg: Inline SVG content (no external shapes registry needed)
 * - orientation: Layout direction (auto for flexible, or locked)
 * - features: Array of supported features
 * - segments: Pre-defined interactive regions with styles and actions
 * - metadata: Discovery and documentation info
 *
 * @type {Object.<string, Object>}
 */
export const dpadComponents = {
    'dpad': {
        // Inline SVG content (migrated from shapes registry)
        svg: dpadSvg,

        // Orientation (locked for d-pad due to directional nature)
        orientation: 'square',

        // Features supported by this component
        features: ['multi-segment', 'state-based-styling'],

        // Default segment configurations with theme token references
        segments: {
            // Directional arrows
            up: {
                style: {
                    fill: 'theme:components.dpad.segment.directional.fill',
                    stroke: 'theme:components.dpad.segment.directional.stroke',
                    'stroke-width': 'theme:components.dpad.segment.directional.stroke-width',
                }
            },
            down: {
                style: {
                    fill: 'theme:components.dpad.segment.directional.fill',
                    stroke: 'theme:components.dpad.segment.directional.stroke',
                    'stroke-width': 'theme:components.dpad.segment.directional.stroke-width',
                }
            },
            left: {
                style: {
                    fill: 'theme:components.dpad.segment.directional.fill',
                    stroke: 'theme:components.dpad.segment.directional.stroke',
                    'stroke-width': 'theme:components.dpad.segment.directional.stroke-width',
                }
            },
            right: {
                style: {
                    fill: 'theme:components.dpad.segment.directional.fill',
                    stroke: 'theme:components.dpad.segment.directional.stroke',
                    'stroke-width': 'theme:components.dpad.segment.directional.stroke-width',
                }
            },

            // Diagonal corners
            'up-left': {
                style: {
                    fill: 'theme:components.dpad.segment.diagonal.fill',
                    stroke: 'theme:components.dpad.segment.diagonal.stroke',
                    'stroke-width': 'theme:components.dpad.segment.diagonal.stroke-width',
                }
            },
            'up-right': {
                style: {
                    fill: 'theme:components.dpad.segment.diagonal.fill',
                    stroke: 'theme:components.dpad.segment.diagonal.stroke',
                    'stroke-width': 'theme:components.dpad.segment.diagonal.stroke-width',
                }
            },
            'down-left': {
                style: {
                    fill: 'theme:components.dpad.segment.diagonal.fill',
                    stroke: 'theme:components.dpad.segment.diagonal.stroke',
                    'stroke-width': 'theme:components.dpad.segment.diagonal.stroke-width',
                }
            },
            'down-right': {
                style: {
                    fill: 'theme:components.dpad.segment.diagonal.fill',
                    stroke: 'theme:components.dpad.segment.diagonal.stroke',
                    'stroke-width': 'theme:components.dpad.segment.diagonal.stroke-width',
                }
            },

            // Center button
            center: {
                style: {
                    fill: 'theme:components.dpad.segment.center.fill',
                    stroke: 'theme:components.dpad.segment.center.stroke',
                    'stroke-width': 'theme:components.dpad.segment.center.stroke-width',
                }
            },
        },

        // Preset support (backward-compatible stub so validatePreset / getPresetNames
        // are available on all components without special-casing in the button card)
        presets: {
            default: {}
        },

        validatePreset(presetName) {
            return presetName in this.presets;
        },

        getPresetNames() {
            return Object.keys(this.presets);
        },

        // Metadata for discovery and documentation
        metadata: {
            type: 'dpad',  // Explicit type for ComponentManager
            card_type: 'button', // Which card editor this component is valid for
            pack: 'lcards_buttons',
            id: 'dpad',
            name: 'D-Pad Control',
            description: 'Interactive directional control with 9 segments',
            version: '1.0.0',

            // Example usage documentation
            examples: {
                basic: {
                    description: 'Basic media player control',
                    config: {
                        component: 'dpad',
                        entity: 'media_player.living_room',
                        dpad: {
                            segments: {
                                up: { tap_action: { action: 'call-service', service: 'media_player.volume_up' } },
                                down: { tap_action: { action: 'call-service', service: 'media_player.volume_down' } },
                                left: { tap_action: { action: 'call-service', service: 'media_player.media_previous_track' } },
                                right: { tap_action: { action: 'call-service', service: 'media_player.media_next_track' } },
                                center: { tap_action: { action: 'call-service', service: 'media_player.media_play_pause' } },
                            },
                        },
                    },
                },
                advanced: {
                    description: 'Remote control with full directional navigation',
                    config: {
                        component: 'dpad',
                        entity: 'remote.roku',
                        dpad: {
                            segments: {
                                up: { tap_action: { action: 'call-service', service: 'remote.send_command', data: { command: 'up' } } },
                                down: { tap_action: { action: 'call-service', service: 'remote.send_command', data: { command: 'down' } } },
                                left: { tap_action: { action: 'call-service', service: 'remote.send_command', data: { command: 'left' } } },
                                right: { tap_action: { action: 'call-service', service: 'remote.send_command', data: { command: 'right' } } },
                                center: { tap_action: { action: 'call-service', service: 'remote.send_command', data: { command: 'select' } } },
                                'up-left': { tap_action: { action: 'call-service', service: 'remote.send_command', data: { command: 'home' } } },
                                'up-right': { tap_action: { action: 'call-service', service: 'remote.send_command', data: { command: 'back' } } },
                            },
                        },
                    },
                },
            }
        }
    }
};

