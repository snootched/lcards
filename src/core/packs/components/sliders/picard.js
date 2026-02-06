/**
 * Picard Slider Component
 * 
 * Star Trek LCARS-inspired vertical slider with:
 * - State-aware borders (blue when active, gray when inactive)
 * - Animated indicator (pulsing light blue in top-left)
 * - Separate progress bar zone (cyan fill)
 * - Range indicator zone (inset colored bars with black borders)
 * - Decorative border frame around range area
 * - Track zone for pills or gauge
 * 
 * Orientation: Vertical only (initially)
 * ViewBox: 365×601 (scales proportionally with container)
 * 
 * @module core/packs/components/sliders/picard
 */

// Default color constants
const DEFAULT_BORDER_ACTIVE = '#2766FF';
const DEFAULT_BORDER_INACTIVE = '#9DA4B9';
const DEFAULT_PROGRESS_COLOR = '#00EDED';
const DEFAULT_RANGE_BORDER_COLOR = '#000000';
const DEFAULT_RANGE_FRAME_COLOR = '#2765FD';
const DEFAULT_ANIMATION_COLOR = '#3AA5D0';

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
            y: 92 * scaleY,
            width: 19 * scaleX,
            height: 421 * scaleY
        },
        range: {
            x: 148 * scaleX,
            y: 84 * scaleY,
            width: 16 * scaleX,
            height: 418 * scaleY
        },
        track: {
            x: 183 * scaleX,
            y: 72 * scaleY,
            width: 146 * scaleX,
            height: 441 * scaleY
        },
        control: {
            x: 183 * scaleX,
            y: 72 * scaleY,
            width: 146 * scaleX,
            height: 441 * scaleY
        },
        text: {
            x: 0,
            y: 20 * scaleY,
            width: 145 * scaleX,
            height: 50 * scaleY
        }
    };
}

/**
 * Resolve state-based colors for Picard component
 * @param {string} actualState - Entity's actual state value ('on', 'off', etc.)
 * @param {string} classifiedState - Classified state ('active', 'inactive', 'unavailable')
 * @param {Object} config - Full card config
 * @param {Object} hass - Home Assistant object
 * @returns {Object} Resolved color map
 */
export function resolveColors(actualState, classifiedState, config, hass) {
    // Helper to resolve state-based color
    const resolveStateColor = (colorConfig, fallback) => {
        if (!colorConfig) return fallback;
        if (typeof colorConfig === 'string') return colorConfig;
        // Try actual state first, then classified state, then default
        return colorConfig[actualState] || colorConfig[classifiedState] || colorConfig.default || fallback;
    };
    
    // Determine if entity is active based on classified state
    const isActive = classifiedState === 'on';
    
    return {
        borderTop: resolveStateColor(
            config.style?.border?.top?.color,
            isActive ? DEFAULT_BORDER_ACTIVE : DEFAULT_BORDER_INACTIVE
        ),
        borderBottom: resolveStateColor(
            config.style?.border?.bottom?.color,
            DEFAULT_BORDER_INACTIVE
        ),
        progressBar: resolveStateColor(
            config.style?.gauge?.progress_bar?.color,
            DEFAULT_PROGRESS_COLOR
        ),
        rangeBorder: config.style?.range?.border?.color || DEFAULT_RANGE_BORDER_COLOR,
        rangeFrame: config.style?.range?.frame?.color || DEFAULT_RANGE_FRAME_COLOR,
        animationIndicator: config.style?.animation?.indicator?.color || DEFAULT_ANIMATION_COLOR
    };
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
    const { width, height, colors, config, style } = context;
    const zones = calculateZones(width, height);
    
    // Scale factors for border paths
    const sx = width / 365;
    const sy = height / 601;
    
    // User-configurable options with defaults
    const showAnimation = config.show_animation !== false;
    const animationSpeed = config.animation_speed || 2;
    const borderRadius = style?.border?.radius ?? 0;
    const frameThickness = style?.range?.frame?.thickness ?? 5;
    
    return `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="picard-clip">
      <rect x="0" y="0" width="${width}" height="${height}" rx="${borderRadius}" />
    </clipPath>
  </defs>
  
  <!-- Background (transparent) -->
  <rect width="${width}" height="${height}" fill="transparent" rx="${borderRadius}" />
  
  <!-- Top-left border (state-aware: blue when active) -->
  <path fill="${colors.borderTop}" d="M0,0 L${175*sx},0 L${175*sx},${64*sy} L${145*sx},${64*sy} L${145*sx},${16*sy} L0,${16*sy} Z" />
  
  <!-- Top-right border (gray) -->
  <path fill="${colors.borderBottom}" d="M${183*sx},0 L${width},0 L${width},${16*sy} L${199*sx},${16*sy} L${199*sx},${64*sy} L${183*sx},${64*sy} Z" />
  
  <!-- Bottom-left border (state-aware: blue when active) -->
  <path fill="${colors.borderTop}" d="M0,${570*sy} L${145*sx},${570*sy} L${145*sx},${522*sy} L${175*sx},${522*sy} L${175*sx},${height} L0,${height} Z" />
  
  <!-- Bottom-right border (gray) -->
  <path fill="${colors.borderBottom}" d="M${183*sx},${522*sy} L${199*sx},${522*sy} L${199*sx},${570*sy} L${width},${570*sy} L${width},${height} L${183*sx},${height} Z" />
  
  <!-- Range area border frame (customizable color and thickness) -->
  <path fill="${colors.rangeFrame}" stroke="${colors.rangeFrame}" stroke-width="${frameThickness}" d="M${145*sx},${72*sy} L${175*sx},${72*sy} L${175*sx},${514*sy} L${145*sx},${514*sy} L${145*sx},${509*sy} L${170*sx},${509*sy} L${170*sx},${77*sy} L${145*sx},${77*sy} Z" />
  
  <!-- Animation indicator (conditional + customizable speed) -->
  ${showAnimation ? `
  <rect x="${2*sx}" y="${32*sy}" width="${16*sx}" height="${18*sy}" fill="${colors.animationIndicator}">
    <animate attributeName="opacity" values="1;0.3;1" dur="${animationSpeed}s" repeatCount="indefinite" />
  </rect>
  ` : ''}
  
  <!-- Progress bar zone -->
  <g id="progress-zone" data-zone="progress"
     transform="translate(${zones.progress.x}, ${zones.progress.y})"
     data-bounds="${zones.progress.x},${zones.progress.y},${zones.progress.width},${zones.progress.height}">
  </g>
  
  <!-- Range indicators zone -->
  <g id="range-zone" data-zone="range"
     transform="translate(${zones.range.x}, ${zones.range.y})"
     data-bounds="${zones.range.x},${zones.range.y},${zones.range.width},${zones.range.height}">
  </g>
  
  <!-- Track zone (pills or gauge) -->
  <g id="track-zone" data-zone="track"
     transform="translate(${zones.track.x}, ${zones.track.y})"
     data-bounds="${zones.track.x},${zones.track.y},${zones.track.width},${zones.track.height}">
  </g>
  
  <!-- Control overlay zone (invisible) -->
  <rect id="control-zone" data-zone="control"
        x="${zones.control.x}" y="${zones.control.y}"
        width="${zones.control.width}" height="${zones.control.height}"
        fill="none" stroke="none" pointer-events="none"
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
 * Component metadata
 */
export const metadata = {
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
            description: 'Show pulsing animation indicator in top-left'
        },
        {
            key: 'animation_speed',
            type: 'number',
            default: 2,
            description: 'Animation pulse speed in seconds'
        },
        {
            key: 'style.border.radius',
            type: 'number',
            default: 0,
            description: 'Border radius for rounded corners'
        },
        {
            key: 'style.range.frame.thickness',
            type: 'number',
            default: 5,
            description: 'Thickness of decorative range frame'
        },
        {
            key: 'style.range.frame.color',
            type: 'string',
            default: '#2765FD',
            description: 'Color of decorative range frame'
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
    resolveColors,
    metadata
};
