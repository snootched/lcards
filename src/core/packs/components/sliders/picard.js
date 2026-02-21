/**
 * Picard Slider Component
 *
 * Star Trek LCARS-inspired vertical slider with:
 * - State-aware borders (resolved by card)
 * - Animated indicator (pulsing light blue in top-left)
 * - Separate progress bar zone (cyan fill)
 * - Range indicator zone (inset colored bars with black borders)
 * - Decorative border frame around range area
 * - Track zone for pills or gauge
 * - Colors are resolved by the card, not the component
 *
 * Orientation: Vertical only (initially)
 * ViewBox: 365×601 (scales proportionally with container)
 *
 * @module core/packs/components/sliders/picard
 */

/**
 * Calculate zone bounds for Picard component
 * Scales from original 365×601 viewBox to actual container dimensions
 * @param {number} width - Container width in pixels
 * @param {number} height - Container height in pixels
 * @returns {Object} Zone definitions with bounds
 */
export function calculateZones(width, height) {
    // Scale from original 365×601 viewBox
    const scaleX = width / 365;
    const scaleY = height / 601;

    return {
        progress: {
            x: 100 * scaleX,
            y: 72 * scaleY,
            width: 19 * scaleX,
            height: 441 * scaleY
        },
        control: {
            x: 100 * scaleX,
            y: 72 * scaleY,
            width: 19 * scaleX,
            height: 441 * scaleY
        },
        range: {
            x: 148 * scaleX,
            y: 84 * scaleY,
            width: 18 * scaleX,      // Wider to better display ranges (was 16)
            height: 418 * scaleY
        },
        solidBar: {
            x: 183 * scaleX,
            y: 72 * scaleY,
            width: 16 * scaleX,
            height: 441 * scaleY
        },
        track: {
            x: 199 * scaleX,
            y: 72 * scaleY,
            width: 120 * scaleX,
            height: 441 * scaleY
        },
        text: {
            x: 0 * scaleX,         // After left border decorations with padding
            y: 16 * scaleY,         // After top horizontal arm (arm thickness = 16)
            width: 365 * scaleX,    // Usable width (365 - 20 left - 20 right padding)
            height: 552 * scaleY    // To y:522 (before bottom vertical arm starts)
        }
    };
}

/**
 * Render range segments with ] frame styling (extends left to cover background)
 * @param {Object} zoneSpec - Range zone dimensions
 * @param {Object} colors - Resolved colors
 * @param {Object} style - Resolved style
 * @param {Object} config - Card config
 * @returns {string} SVG markup for range segments
 */
function renderRangeSegments(zoneSpec, colors, style, config) {
    const ranges = style?.ranges || [];
    if (ranges.length === 0) return '';

    const displayMin = config.min ?? 0;
    const displayMax = config.max ?? 100;
    const displayRange = displayMax - displayMin;

    const borderColor = style?.range?.border?.color || '#000000';
    const borderGap = style?.range?.border?.gap ?? 2;

    const height = zoneSpec.height;
    const width = zoneSpec.width;

    let svg = '';

    ranges.forEach((range, index) => {
        const rangeMin = range.min ?? displayMin;
        const rangeMax = range.max ?? displayMax;
        const rangeColor = range.color || '#CCCCCC';

        const startPercent = (rangeMin - displayMin) / displayRange;
        const endPercent = (rangeMax - displayMin) / displayRange;
        const sizePercent = endPercent - startPercent;

        const isFirstRange = index === 0;
        const isLastRange = index === ranges.length - 1;

        // Vertical: ranges stack from bottom to top
        const rangeHeight = height * sizePercent;
        const rangeY = height * (1 - endPercent);

        // Background rect: extend left beyond zone to cover frame background
        svg += `<rect x="${-borderGap}" y="${rangeY}" width="${width + borderGap}" height="${rangeHeight}" fill="${borderColor}" />`;

        // Color rect: ] frame - borders only on outer edges
        const topInset = isFirstRange ? borderGap : 0;
        const bottomInset = isLastRange ? borderGap : 0;
        const innerWidth = width - borderGap;  // Right border only
        const innerHeight = Math.max(1, rangeHeight - topInset - bottomInset);

        svg += `<rect x="${-borderGap}" y="${rangeY + topInset}" width="${innerWidth}" height="${innerHeight}" fill="${rangeColor}" />`;
    });

    return svg;
}

/**
 * Render Picard component shell SVG
 * @param {Object} context - Full render context
 * @param {number} context.width - Container width in pixels
 * @param {number} context.height - Container height in pixels
 * @param {Object} context.colors - Resolved colors from resolveColors()
 * @param {Object} context.config - Full card config (user + preset merged)
 * @param {Object} context.style - Resolved style object (preset + user overrides)
 * @param {Object} context.state - Current card state (value, entity, min, max, domain)
 * @param {Object} context.hass - Home Assistant object
 * @returns {string} Complete SVG markup with zones marked for content injection
 */
export function render(context) {
    const { width, height, colors, config, style, zones: contextZones } = context;
    // Use pre-calculated zones from context (already adjusted for borders) or calculate fresh
    const zones = contextZones || calculateZones(width, height);

    // Scale factors for border paths
    const sx = width / 365;
    const sy = height / 601;

    // User-configurable options with defaults
    const showAnimation = config.show_animation !== false;
    const animationSpeed = config.animation_speed || 2;
    const hasRanges = style?.ranges && style.ranges.length > 0;

    return `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background (transparent) -->
  <rect width="${width}" height="${height}" fill="transparent" />

  <!-- Top-left border ] shape (state-aware: blue when active) -->
  <path fill="${colors.borderTop}" d="M0,0 L${175*sx},0 L${175*sx},${64*sy} L${145*sx},${64*sy} L${145*sx},${16*sy} L0,${16*sy} Z" />

  <!-- Top-right border [ shape (gray) -->
  <path fill="${colors.borderBottom}" d="M${183*sx},0 L${width},0 L${width},${16*sy} L${199*sx},${16*sy} L${199*sx},${64*sy} L${183*sx},${64*sy} Z" />

  <!-- Bottom-left border ] shape (state-aware: blue when active) -->
  <path fill="${colors.borderTop}" d="M0,${570*sy} L${145*sx},${570*sy} L${145*sx},${522*sy} L${175*sx},${522*sy} L${175*sx},${height} L0,${height} Z" />

  <!-- Bottom-right border [ shape (gray) -->
  <path fill="${colors.borderBottom}" d="M${183*sx},${522*sy} L${199*sx},${522*sy} L${199*sx},${570*sy} L${width},${570*sy} L${width},${height} L${183*sx},${height} Z" />

  <!-- Range zone: solid bar when no ranges, notched frame when ranges exist -->
  ${hasRanges ? `
  <!-- Range area border frame (notched, customizable color) -->
  <path fill="${colors.rangeFrame}" d="M${145*sx},${72*sy} L${175*sx},${72*sy} L${175*sx},${514*sy} L${145*sx},${514*sy} L${145*sx},${509*sy} L${170*sx},${509*sy} L${170*sx},${77*sy} L${145*sx},${77*sy} Z" />
  ` : `
  <!-- Solid range bar (no ranges defined) - fills the frame area -->
  <rect x="${145*sx}" y="${72*sy}" width="${30*sx}" height="${442*sy}" fill="${colors.rangeFrame}" />
  `}

  <!-- Solid vertical bar (connector between range and track) -->
  <rect x="${zones.solidBar.x}" y="${zones.solidBar.y}" width="${zones.solidBar.width}" height="${zones.solidBar.height}" fill="${colors.solidBar}" />

  <!-- Animation indicators (3 squares with staggered timing) -->
  ${showAnimation ? `
  <rect x="${2*sx}" y="${28*sy}" width="${26*sx}" height="${24*sy}" fill="${colors.animationIndicator}">
    <animate attributeName="opacity" values="1;0.3;1" dur="${animationSpeed}s" repeatCount="indefinite" />
  </rect>
  <rect x="${38*sx}" y="${28*sy}" width="${26*sx}" height="${24*sy}" fill="${colors.animationIndicator}">
    <animate attributeName="opacity" values="1;0.3;1" dur="${animationSpeed}s" begin="${animationSpeed/3}s" repeatCount="indefinite" />
  </rect>
  <rect x="${74*sx}" y="${28*sy}" width="${26*sx}" height="${24*sy}" fill="${colors.animationIndicator}">
    <animate attributeName="opacity" values="1;0.3;1" dur="${animationSpeed}s" begin="${(animationSpeed*2)/3}s" repeatCount="indefinite" />
  </rect>
  ` : ''}

  <!-- Range indicators zone (render first so progress thumb appears on top) -->
  <g id="range-zone" data-zone="range"
     transform="translate(${zones.range.x}, ${zones.range.y})"
     data-bounds="${zones.range.x},${zones.range.y},${zones.range.width},${zones.range.height}">
    ${hasRanges ? renderRangeSegments(zones.range, colors, style, config) : ''}
  </g>

  <!-- Progress bar zone (leftmost, renders after ranges for proper z-order) -->
  <g id="progress-zone" data-zone="progress"
     transform="translate(${zones.progress.x}, ${zones.progress.y})"
     data-bounds="${zones.progress.x},${zones.progress.y},${zones.progress.width},${zones.progress.height}">
  </g>

  <!-- Control overlay zone (overlaps progress bar for slider interaction) -->
  <rect id="control-zone" data-zone="control"
        x="${zones.control.x}" y="${zones.control.y}"
        width="${zones.control.width}" height="${zones.control.height}"
        fill="none" stroke="none" pointer-events="all"
        data-bounds="${zones.control.x},${zones.control.y},${zones.control.width},${zones.control.height}" />

  <!-- Track zone (pills or gauge - rightmost) -->
  <g id="track-zone" data-zone="track"
     transform="translate(${zones.track.x}, ${zones.track.y})"
     data-bounds="${zones.track.x},${zones.track.y},${zones.track.width},${zones.track.height}">
  </g>

  <!-- Text zone -->
  <g id="text-zone" data-zone="text"
     transform="translate(${zones.text.x}, ${zones.text.y})"
     data-bounds="${zones.text.x},${zones.text.y},${zones.text.width},${zones.text.height}">
  </g>
</svg>
  `.trim();
}

/**
 * Component metadata
 */
export const metadata = {
    type: 'slider',
    pack: 'lcards_sliders',
    name: 'picard',
    displayName: 'Picard',
    orientation: 'vertical',
    features: [
        'state-aware-borders',
        'animated-indicator',
        'progress-bar',
        'range-indicators',
        'decorative-frame'
    ],
    defaultSize: {
        width: 365,
        height: 601
    },
    configurableOptions: [
        {
            key: 'show_animation',
            type: 'boolean',
            default: true,
            description: 'Show pulsing animation indicators in top-left',
            'x-ui-hints': {
                label: 'Show Animation',
                helper: 'Show 3 pulsing animation indicators in top-left (default: true)',
                selector: { boolean: {} }
            }
        },
        {
            key: 'animation_speed',
            type: 'number',
            default: 2,
            description: 'Animation pulse speed in seconds',
            'x-ui-hints': {
                label: 'Animation Speed',
                helper: 'Animation pulse speed in seconds (default: 2)',
                selector: {
                    number: {
                        mode: 'box',
                        step: 0.1,
                        min: 0.1,
                        max: 10
                    }
                }
            }
        }
    ],
    description: 'Star Trek LCARS-inspired vertical slider with state-aware borders and animated indicator'
};

/**
 * Default export with all functions and metadata
 */
export default {
    render,
    calculateZones,
    metadata
};
