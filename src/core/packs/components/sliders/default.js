/**
 * Default Slider Component
 *
 * Simple rectangular slider with overlapping zones:
 * - All zones (progress, control, track, range) occupy same space
 * - Clean, minimal design
 * - Works for both horizontal and vertical orientations
 * - Colors are resolved by the card, not the component
 *
 * @module core/packs/components/sliders/default
 */

/**
 * Calculate zone bounds for default component
 * All zones overlap in the same rectangular space with small padding
 * @param {number} width - Container width in pixels
 * @param {number} height - Container height in pixels
 * @returns {Object} Zone definitions with bounds
 */
export function calculateZones(width, height) {
    // All zones occupy the full space (no padding, like legacy basic component)
    const sharedBounds = {
        x: 0,
        y: 0,
        width: width,
        height: height
    };

    return {
        progress: { ...sharedBounds },
        control: { ...sharedBounds },
        range: { ...sharedBounds },
        track: { ...sharedBounds },
        text: {
            x: 5,
            y: 5,
            width: width - 10,
            height: Math.min(30, height / 2)
        }
    };
}

/**
 * Render default component shell SVG
 * @param {Object} context - Full render context
 * @param {number} context.width - Container width in pixels
 * @param {number} context.height - Container height in pixels
 * @param {Object} context.colors - Resolved colors from resolveColors()
 * @param {Object} context.config - Card configuration
 * @param {Object} context.style - Slider style configuration
 * @param {Object} context.state - Current state information
 * @param {Object} context.hass - Home Assistant object
 * @returns {string} SVG markup with zone placeholders
 */
export function render(context) {
    const { width, height, colors, zones: contextZones } = context;
    // Use pre-calculated zones from context (already adjusted for borders) or calculate fresh
    const zones = contextZones || calculateZones(width, height);

    return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <!-- Background (transparent by default, can be styled via config) -->
  <rect width="${width}" height="${height}" fill="transparent"></rect>

  <!-- Range indicators zone (overlapping with track) -->
  <g id="range-zone" data-zone="range"
     transform="translate(${zones.range.x}, ${zones.range.y})"
     data-bounds="${zones.range.x},${zones.range.y},${zones.range.width},${zones.range.height}">
  </g>

  <!-- Progress bar background zone — rendered before track so ticks paint over the fill -->
  <g id="progress-zone-bg" data-zone="progress"
     transform="translate(${zones.progress.x}, ${zones.progress.y})"
     data-bounds="${zones.progress.x},${zones.progress.y},${zones.progress.width},${zones.progress.height}">
  </g>

  <!-- Track zone (gauge or pills) -->
  <g id="track-zone" data-zone="track"
     transform="translate(${zones.track.x}, ${zones.track.y})"
     data-bounds="${zones.track.x},${zones.track.y},${zones.track.width},${zones.track.height}">
  </g>

  <!-- Progress bar foreground zone — rendered after track so value indicator overlays tick marks -->
  <g id="progress-zone" data-zone="progress"
     transform="translate(${zones.progress.x}, ${zones.progress.y})"
     data-bounds="${zones.progress.x},${zones.progress.y},${zones.progress.width},${zones.progress.height}">
  </g>

  <!-- Control overlay zone (overlapping with progress/track for interaction) -->
  <rect id="control-zone" data-zone="control"
        x="${zones.control.x}" y="${zones.control.y}"
        width="${zones.control.width}" height="${zones.control.height}"
        fill="none" stroke="none" pointer-events="all"
        data-bounds="${zones.control.x},${zones.control.y},${zones.control.width},${zones.control.height}" />

  <!-- Text zone -->
  <g id="text-zone" data-zone="text"
     transform="translate(${zones.text.x}, ${zones.text.y})"
     data-bounds="${zones.text.x},${zones.text.y},${zones.text.width},${zones.text.height}">
  </g>
</svg>
    `.trim();
}

/**
 * Get component metadata
 * @returns {Object} Component information
 */
export function getMetadata() {
    return {
        type: 'slider',
        pack: 'lcards_sliders',
        id: 'default',
        name: 'Default',
        description: 'Simple rectangular slider with state-aware colours and overlapping zones',
        orientation: 'auto',  // Adapts to style.track.orientation
        supportsOrientation: ['horizontal', 'vertical'],
        defaultOrientation: 'horizontal',
        features: [
            'state-colors',
            'progress-bar',
            'gauge',
            'pills',
            'ranges',
            'text-fields'
        ],
        configSchema: {
            style: {
                border: {
                    color: {
                        description: 'Border colour (state-aware: object with state keys or single colour)',
                        type: ['string', 'object']
                    },
                    width: {
                        description: 'Border width in pixels',
                        type: 'number',
                        default: 2
                    },
                    radius: {
                        description: 'Corner radius — uniform number (e.g. 12) or per-corner object { top_left, top_right, bottom_right, bottom_left }. LCARS tip: set left corners to 0 and right corners to 12 for end-cap rounding on a left-bordered slider.',
                        type: ['number', 'object'],
                        default: 0
                    }
                },
                background: {
                    color: {
                        description: 'Background colour (state-aware: object with state keys or single colour)',
                        type: ['string', 'object']
                    }
                }
            }
        }
    };
}

// Export component structure expected by component system
export default {
    calculateZones,
    render,
    metadata: getMetadata()
};
