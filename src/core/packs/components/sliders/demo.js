/**
 * Demo Slider Component
 *
 * Comprehensive demonstration component showcasing all available interfaces,
 * zones, and configurable options for slider component authoring.
 *
 * Features:
 * - All zone types (track, control, progress, range, text, border)
 * - User-configurable options (colors, dimensions, toggles)
 * - Dynamic decoration elements
 * - State-aware styling
 * - Animation examples
 * - Orientation-agnostic design
 *
 * This component serves as both documentation and a testing tool for
 * slider component development. It intentionally includes ALL possible
 * features to demonstrate the full API surface.
 *
 * @module core/packs/components/sliders/demo
 */

/**
 * Calculate zone bounds for demo component
 * Demonstrates proportional scaling from original design viewBox
 *
 * @param {number} width - Container width in pixels
 * @param {number} height - Container height in pixels
 * @returns {Object} Zone definitions with bounds
 */
export function calculateZones(width, height) {
    // Original design viewBox: 400×600 (2:3 aspect ratio)
    // All zones scale proportionally to actual container size
    const scaleX = width / 400;
    const scaleY = height / 600;

    return {
        // REQUIRED: Track zone - Where pills/gauge are rendered
        track: {
            x: 200 * scaleX,      // Right side of component
            y: 80 * scaleY,       // Top margin
            width: 160 * scaleX,  // Main content area
            height: 440 * scaleY  // Full height minus margins
        },

        // REQUIRED: Control zone - Mouse/touch interaction overlay
        // Usually overlaps track or progress bar for user input
        control: {
            x: 80 * scaleX,       // Overlaps progress bar
            y: 80 * scaleY,
            width: 40 * scaleX,   // Thin vertical strip
            height: 440 * scaleY
        },

        // OPTIONAL: Progress bar zone - Dedicated progress bar area
        // Used in gauge mode when component has separate progress visualization
        progress: {
            x: 80 * scaleX,       // Left side, separate from track
            y: 80 * scaleY,
            width: 40 * scaleX,
            height: 440 * scaleY
        },

        // OPTIONAL: Range indicator zone - Colored range backgrounds
        // Card injects range segments based on style.ranges config
        range: {
            x: 140 * scaleX,      // Between progress and track
            y: 80 * scaleY,
            width: 40 * scaleX,
            height: 440 * scaleY
        },

        // REQUIRED: Text zone - Text field container
        // Card injects text elements based on text config
        text: {
            x: 0 * scaleX,
            y: 0 * scaleY,
            width: 80 * scaleX,   // Left border area
            height: 600 * scaleY
        },

        // OPTIONAL: Border zone - If component uses card's border system
        // Usually not needed if component has custom borders
        border: {
            x: 0,
            y: 0,
            width: width,
            height: height
        }
    };
}

/**
 * Render demo component shell SVG
 * Demonstrates all context properties and zone types
 *
 * @param {Object} context - Full render context
 * @param {number} context.width - Container width in pixels
 * @param {number} context.height - Container height in pixels
 * @param {Object} context.colors - Resolved colors from color system
 * @param {Object} context.config - Full card config (user + preset merged)
 * @param {Object} context.style - Resolved style object
 * @param {Object} context.state - Current card state (value, entity, min, max)
 * @param {Object} context.hass - Home Assistant object
 * @param {Object} context.zones - Pre-calculated zones (optional)
 * @returns {string} Complete SVG markup with zones
 */
export function render(context) {
    const { width, height, colors, config, style, state, zones: contextZones } = context;

    // Use pre-calculated zones from context or calculate fresh
    const zones = contextZones || calculateZones(width, height);

    // ================================================================
    // USER-CONFIGURABLE OPTIONS
    // Demonstrates how to read config values with defaults
    // ================================================================

    // Boolean options
    const showDecorations = config.show_decorations !== false;  // Default: true
    const showAnimation = config.show_animation !== false;
    const showGrid = config.show_grid !== false;

    // Number options
    const decorationSize = config.decoration_size || 10;
    const animationSpeed = config.animation_speed || 2;
    const borderThickness = config.border_thickness || 5;

    // Color options (use config or fallback to resolved colors)
    const decorationColor = config.decoration_color || colors.animationIndicator;

    // Style-based options (nested in style object)
    const borderRadius = style?.border?.radius ?? 0;
    const showRangeLabels = style?.range?.show_labels !== false;

    // ================================================================
    // STATE-AWARE RENDERING
    // Demonstrates using state for dynamic rendering
    // ================================================================

    const isActive = state?.entity?.state === 'on';
    const currentValue = state?.value ?? 50;

    // ================================================================
    // SCALE FACTORS
    // For positioning decorative elements proportionally
    // ================================================================

    const sx = width / 400;
    const sy = height / 600;

    // ================================================================
    // SVG GENERATION
    // ================================================================

    return `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="transparent" />

  <!-- ============================================================ -->
  <!-- DECORATIVE ELEMENTS (User-configurable) -->
  <!-- ============================================================ -->

  ${showDecorations ? `
  <!-- Top border decoration (state-aware color) -->
  <rect x="0" y="0" width="${width}" height="${borderThickness * sy}" fill="${colors.borderTop}" />

  <!-- Bottom border decoration -->
  <rect x="0" y="${height - (borderThickness * sy)}" width="${width}" height="${borderThickness * sy}" fill="${colors.borderBottom}" />

  <!-- Left decorative panel -->
  <rect x="0" y="${20 * sy}" width="${60 * sx}" height="${560 * sy}" fill="${colors.borderTop}" opacity="0.3" />

  <!-- Corner decorations -->
  <circle cx="${20 * sx}" cy="${30 * sy}" r="${decorationSize * sx}" fill="${decorationColor}" />
  <circle cx="${20 * sx}" cy="${570 * sy}" r="${decorationSize * sx}" fill="${decorationColor}" />
  ` : ''}

  ${showGrid ? `
  <!-- Grid lines (helpful for layout visualization) -->
  <line x1="0" y1="${height/3}" x2="${width}" y2="${height/3}" stroke="#ffffff" stroke-width="0.5" opacity="0.2" />
  <line x1="0" y1="${height*2/3}" x2="${width}" y2="${height*2/3}" stroke="#ffffff" stroke-width="0.5" opacity="0.2" />
  <line x1="${width/4}" y1="0" x2="${width/4}" y2="${height}" stroke="#ffffff" stroke-width="0.5" opacity="0.2" />
  <line x1="${width/2}" y1="0" x2="${width/2}" y2="${height}" stroke="#ffffff" stroke-width="0.5" opacity="0.2" />
  <line x1="${width*3/4}" y1="0" x2="${width*3/4}" y2="${height}" stroke="#ffffff" stroke-width="0.5" opacity="0.2" />
  ` : ''}

  <!-- ============================================================ -->
  <!-- ANIMATION EXAMPLE (User-configurable speed) -->
  <!-- ============================================================ -->

  ${showAnimation ? `
  <!-- Pulsing indicator -->
  <rect x="${10 * sx}" y="${40 * sy}" width="${20 * sx}" height="${20 * sy}" fill="${colors.animationIndicator}">
    <animate attributeName="opacity" values="1;0.3;1" dur="${animationSpeed}s" repeatCount="indefinite" />
  </rect>

  <!-- Scrolling indicator -->
  <rect x="${10 * sx}" y="${70 * sy}" width="${20 * sx}" height="${5 * sy}" fill="${colors.animationIndicator}">
    <animate attributeName="y" values="${70 * sy};${100 * sy};${70 * sy}" dur="${animationSpeed * 1.5}s" repeatCount="indefinite" />
  </rect>
  ` : ''}

  <!-- ============================================================ -->
  <!-- ZONE MARKERS (Visual guides - remove in production) -->
  <!-- These show zone boundaries for development/testing -->
  <!-- ============================================================ -->

  ${config.show_zone_markers ? `
  <!-- Track zone marker -->
  <rect x="${zones.track.x}" y="${zones.track.y}"
        width="${zones.track.width}" height="${zones.track.height}"
        fill="none" stroke="#ff0000" stroke-width="2" stroke-dasharray="5,5" opacity="0.5" />
  <text x="${zones.track.x + 5}" y="${zones.track.y + 15}" font-size="12" fill="#ff0000">track</text>

  <!-- Progress zone marker -->
  <rect x="${zones.progress.x}" y="${zones.progress.y}"
        width="${zones.progress.width}" height="${zones.progress.height}"
        fill="none" stroke="#00ff00" stroke-width="2" stroke-dasharray="5,5" opacity="0.5" />
  <text x="${zones.progress.x + 5}" y="${zones.progress.y + 15}" font-size="12" fill="#00ff00">progress</text>

  <!-- Range zone marker -->
  <rect x="${zones.range.x}" y="${zones.range.y}"
        width="${zones.range.width}" height="${zones.range.height}"
        fill="none" stroke="#0000ff" stroke-width="2" stroke-dasharray="5,5" opacity="0.5" />
  <text x="${zones.range.x + 5}" y="${zones.range.y + 15}" font-size="12" fill="#0000ff">range</text>

  <!-- Control zone marker -->
  <rect x="${zones.control.x}" y="${zones.control.y}"
        width="${zones.control.width}" height="${zones.control.height}"
        fill="none" stroke="#ffff00" stroke-width="2" stroke-dasharray="5,5" opacity="0.5" />
  <text x="${zones.control.x + 5}" y="${zones.control.y + 15}" font-size="12" fill="#ffff00">control</text>

  <!-- Text zone marker -->
  <rect x="${zones.text.x}" y="${zones.text.y}"
        width="${zones.text.width}" height="${zones.text.height}"
        fill="none" stroke="#ff00ff" stroke-width="2" stroke-dasharray="5,5" opacity="0.5" />
  <text x="${zones.text.x + 5}" y="${zones.text.y + 15}" font-size="12" fill="#ff00ff">text</text>
  ` : ''}

  <!-- ============================================================ -->
  <!-- REQUIRED ZONES -->
  <!-- These MUST be present for card to inject content -->
  <!-- ============================================================ -->

  <!-- Progress bar zone (OPTIONAL but common in gauge mode) -->
  <g id="progress-zone" data-zone="progress"
     transform="translate(${zones.progress.x}, ${zones.progress.y})"
     data-bounds="${zones.progress.x},${zones.progress.y},${zones.progress.width},${zones.progress.height}">
    <!-- Card injects progress bar rect here -->
  </g>

  <!-- Range indicator zone (OPTIONAL - for colored range backgrounds) -->
  <g id="range-zone" data-zone="range"
     transform="translate(${zones.range.x}, ${zones.range.y})"
     data-bounds="${zones.range.x},${zones.range.y},${zones.range.width},${zones.range.height}">
    <!-- Card injects range segment rects here -->
  </g>

  <!-- Control overlay zone (REQUIRED - must have pointer-events="all") -->
  <rect id="control-zone" data-zone="control"
        x="${zones.control.x}" y="${zones.control.y}"
        width="${zones.control.width}" height="${zones.control.height}"
        fill="none" stroke="none" pointer-events="all"
        data-bounds="${zones.control.x},${zones.control.y},${zones.control.width},${zones.control.height}" />

  <!-- Track zone (REQUIRED - pills or gauge rendered here) -->
  <g id="track-zone" data-zone="track"
     transform="translate(${zones.track.x}, ${zones.track.y})"
     data-bounds="${zones.track.x},${zones.track.y},${zones.track.width},${zones.track.height}">
    <!-- Card injects pills or gauge SVG here -->
  </g>

  <!-- Text zone (REQUIRED - text fields rendered here) -->
  <g id="text-zone" data-zone="text"
     transform="translate(${zones.text.x}, ${zones.text.y})"
     data-bounds="${zones.text.x},${zones.text.y},${zones.text.width},${zones.text.height}">
    <!-- Card injects text elements here -->
  </g>

  <!-- Border zone (OPTIONAL - only if using card's border system) -->
  <g id="border-zone" data-zone="border">
    <!-- Card injects border rects here if style.border configured -->
  </g>
</svg>
    `.trim();
}

/**
 * Component metadata
 * Demonstrates all metadata fields and configurable options
 */
export const metadata = {
    // ================================================================
    // REQUIRED METADATA
    // ================================================================

    type: 'slider',                    // Component type (always 'slider')
    name: 'demo',                      // Unique identifier (kebab-case)
    displayName: 'Demo Component',     // Human-readable name for UI

    // ================================================================
    // ORIENTATION
    // ================================================================

    orientation: 'auto',               // 'vertical', 'horizontal', or 'auto'
                                      // 'auto' adapts to style.track.orientation config

    // ================================================================
    // FEATURE FLAGS
    // Optional tags for documentation and filtering
    // ================================================================

    features: [
        'state-aware-borders',         // Borders change color based on entity state
        'animated-indicator',          // Includes animation elements
        'progress-bar',                // Has dedicated progress bar zone
        'range-indicators',            // Has dedicated range indicator zone
        'decorative-elements',         // Has decorative visual elements
        'zone-markers'                 // Can show zone boundaries for debugging
    ],

    // ================================================================
    // DEFAULT SIZE
    // Used when card is first added to dashboard
    // ================================================================

    defaultSize: {
        width: 400,
        height: 600
    },

    // ================================================================
    // CONFIGURABLE OPTIONS
    // User-facing configuration exposed in visual editor
    // All types and selectors demonstrated
    // ================================================================

    configurableOptions: [
        // ============================================================
        // BOOLEAN OPTIONS
        // ============================================================

        {
            key: 'show_decorations',
            type: 'boolean',
            default: true,
            description: 'Show decorative border elements',
            'x-ui-hints': {
                label: 'Show Decorations',
                helper: 'Display decorative visual elements (default: true)',
                selector: { boolean: {} }
            }
        },

        {
            key: 'show_animation',
            type: 'boolean',
            default: true,
            description: 'Show animated indicators',
            'x-ui-hints': {
                label: 'Show Animation',
                helper: 'Enable pulsing and scrolling animations (default: true)',
                selector: { boolean: {} }
            }
        },

        {
            key: 'show_grid',
            type: 'boolean',
            default: false,
            description: 'Show layout grid lines',
            'x-ui-hints': {
                label: 'Show Grid',
                helper: 'Display grid lines for layout visualization (default: false)',
                selector: { boolean: {} }
            }
        },

        {
            key: 'show_zone_markers',
            type: 'boolean',
            default: false,
            description: 'Show zone boundary markers',
            'x-ui-hints': {
                label: 'Show Zone Markers',
                helper: 'Display colored outlines for all zones (development only, default: false)',
                selector: { boolean: {} }
            }
        },

        // ============================================================
        // NUMBER OPTIONS
        // ============================================================

        {
            key: 'decoration_size',
            type: 'number',
            default: 10,
            description: 'Size of decorative elements in pixels',
            'x-ui-hints': {
                label: 'Decoration Size',
                helper: 'Size of corner decorations in pixels (default: 10)',
                selector: {
                    number: {
                        mode: 'box',
                        step: 1,
                        min: 5,
                        max: 30
                    }
                }
            }
        },

        {
            key: 'animation_speed',
            type: 'number',
            default: 2,
            description: 'Animation speed in seconds',
            'x-ui-hints': {
                label: 'Animation Speed',
                helper: 'Duration of animation cycle in seconds (default: 2)',
                selector: {
                    number: {
                        mode: 'slider',
                        step: 0.1,
                        min: 0.1,
                        max: 10
                    }
                }
            }
        },

        {
            key: 'border_thickness',
            type: 'number',
            default: 5,
            description: 'Border thickness in pixels',
            'x-ui-hints': {
                label: 'Border Thickness',
                helper: 'Thickness of top/bottom borders in pixels (default: 5)',
                selector: {
                    number: {
                        mode: 'box',
                        step: 1,
                        min: 0,
                        max: 20
                    }
                }
            }
        },

        // ============================================================
        // COLOR OPTIONS
        // ============================================================

        {
            key: 'decoration_color',
            type: 'color',
            default: '#66ccff',
            description: 'Color of decorative elements',
            'x-ui-hints': {
                label: 'Decoration Color',
                helper: 'Color for corner decorations and animations (default: #66ccff)',
                format: 'color-lcards'     // Use LCARdS color picker
            }
        },

        // ============================================================
        // STYLE-NESTED OPTIONS
        // Demonstrates accessing nested style properties
        // ============================================================

        {
            key: 'style.border.radius',
            type: 'number',
            default: 0,
            description: 'Border radius for rounded corners',
            'x-ui-hints': {
                label: 'Border Radius',
                helper: 'Rounded corner radius in pixels (default: 0)',
                selector: {
                    number: {
                        mode: 'box',
                        step: 1,
                        min: 0,
                        max: 50
                    }
                }
            }
        },

        {
            key: 'style.range.show_labels',
            type: 'boolean',
            default: true,
            description: 'Show labels on range indicators',
            'x-ui-hints': {
                label: 'Show Range Labels',
                helper: 'Display labels on colored range segments (default: true)',
                selector: { boolean: {} }
            }
        }
    ],

    // ================================================================
    // DESCRIPTION
    // Long-form description for documentation
    // ================================================================

    description: 'Comprehensive demo component showcasing all available zones, configurable options, and rendering features. Use this as a reference for component development and testing.'
};

/**
 * Default export with all functions and metadata
 */
export default {
    render,
    calculateZones,
    metadata
};
