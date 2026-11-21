import { prefersReducedMotion } from '../../../../utils/reduced-motion.js';
import { PICARD_OPTIONS } from './component-options.js';

/**
 * The indicator lights' pulse, as an inline CSS animation on the light (keyframes
 * `lcards-slider-pulse` in the slider's styles). It was an SVG <animate>, which
 * runs on the main thread and repaints the gauge every frame (36 lights: 36 ms/s
 * of main thread, 129 ms/s at a quarter CPU speed); a CSS opacity animation runs
 * on the compositor (about 1 ms/s). Measured 2026-11-17. None under reduced motion.
 * @param {number} seconds one pulse
 * @param {number} begin delay before the first pulse, in seconds
 * @returns {string} a style attribute, or ''
 */
export function pulseStyle(seconds, begin = 0) {
    if (prefersReducedMotion()) return '';
    // numbers only into the style attribute (animation_speed comes from config)
    const dur = Number(seconds) > 0 ? +Number(seconds).toFixed(3) : 2;
    const delay = Number(begin) > 0 ? +Number(begin).toFixed(3) : 0;
    return `style="animation: lcards-slider-pulse ${dur}s linear ${delay}s infinite"`;
}
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
 * @param {{ config?: any }} [context] - the card's zone context (shape: column picks the Titan zones)
 * @returns {Object} Zone definitions with bounds
 */
export function calculateZones(width, height, context) {
    if (context?.config?.shape === 'column') return columnZones(width, height);
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

// ── shape: column ────────────────────────────────────────────────────────
// The Titan.DS column gauge (reference L026, M131, M183): a number cap at each
// end, a thin bracket line down the left, the fill bar with its thumb, a narrow
// range strip, a tick axis, then the ticks with their numbers. Fixed px parts
// (a bank of these sits in narrow columns), so nothing squashes with the width.

/** Sizes of the column's parts, px. @param {number} height */
function columnMetrics(height) {
    const cap = Math.max(14, Math.min(26, Math.round(height * 0.08)));
    // the scanning lights sit in a row between the top cap and the bracket
    const lightsRow = 8;
    const top = cap + 4 + lightsRow;
    const bottom = height - cap - 6;
    return { cap, lightsY: cap + 4, top, bottom, bar: { x: 8, width: 8 }, range: { x: 19, width: 5 }, axis: { x: 26, width: 2 }, lights: 6 };
}

/**
 * Zones of the column: caps as text zones `top` and `bottom` (the value and the
 * name), the bar, the range strip, the axis and the ticks.
 * @param {number} width
 * @param {number} height
 */
export function columnZones(width, height) {
    const m = columnMetrics(height);
    const y = m.top + m.lights;
    const h = Math.max(0, m.bottom - y);
    return {
        top: { x: 0, y: 0, width, height: m.cap },
        bottom: { x: 0, y: height - m.cap, width, height: m.cap },
        progress: { x: m.bar.x, y, width: m.bar.width, height: h },
        // a wider hit area than the bar, so it is easy to drag
        control: { x: 0, y, width: Math.min(width, 44), height: h },
        range: { x: m.range.x, y, width: m.range.width, height: h },
        solidBar: { x: m.axis.x, y, width: m.axis.width, height: h },
        // the ticks and numbers stop short of the right bracket
        track: { x: m.axis.x + m.axis.width, y, width: Math.max(0, width - m.axis.x - m.axis.width - 6), height: h },
        text: { x: 0, y: 0, width, height }
    };
}

/** @param {any} context */
function renderColumn(context) {
    const { width, height, colors, config, style, zones: contextZones } = context;
    const zones = contextZones || columnZones(width, height);
    const m = columnMetrics(height);
    const showAnimation = config.show_animation !== false;
    const animationSpeed = config.animation_speed || 2;
    const pulse = (/** @type {number} */ begin) => pulseStyle(animationSpeed, begin);
    const hasRanges = style?.ranges && style.ranges.length > 0;
    return `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="transparent" />
  <!-- Number caps (value on top, name below; the card writes their text) -->
  <rect x="0" y="0" width="${width}" height="${m.cap}" fill="${colors.borderTop}" />
  <rect x="0" y="${height - m.cap}" width="${width}" height="${m.cap}" fill="${colors.borderBottom}" />
  <!-- Bracket lines down both sides, with feet: the column is a closed [ ] box -->
  <path fill="${colors.solidBar}" d="M0,${m.top} L12,${m.top} L12,${m.top + 3} L3,${m.top + 3} L3,${m.bottom - 3} L12,${m.bottom - 3} L12,${m.bottom} L0,${m.bottom} Z" />
  <path fill="${colors.solidBar}" d="M${width},${m.top} L${width - 12},${m.top} L${width - 12},${m.top + 3} L${width - 3},${m.top + 3} L${width - 3},${m.bottom - 3} L${width - 12},${m.bottom - 3} L${width - 12},${m.bottom} L${width},${m.bottom} Z" />
  ${showAnimation ? [0, 1, 2].map(i => `
  <rect x="${i * 8}" y="${m.lightsY}" width="6" height="5" fill="${colors.animationIndicator}" ${pulse((animationSpeed * i) / 3)} />`).join('') : ''}
  <!-- Tick axis -->
  <rect x="${zones.solidBar.x}" y="${zones.solidBar.y}" width="${zones.solidBar.width}" height="${zones.solidBar.height}" fill="${colors.solidBar}" />
  ${hasRanges ? '' : `<!-- Range strip, dim without ranges -->
  <rect x="${zones.range.x}" y="${zones.range.y}" width="${zones.range.width}" height="${zones.range.height}" fill="${colors.rangeFrame}" opacity="0.35" />`}
  <g id="range-zone" data-zone="range" transform="translate(${zones.range.x}, ${zones.range.y})"
     data-bounds="${zones.range.x},${zones.range.y},${zones.range.width},${zones.range.height}"></g>
  <g id="progress-zone" data-zone="progress" transform="translate(${zones.progress.x}, ${zones.progress.y})"
     data-bounds="${zones.progress.x},${zones.progress.y},${zones.progress.width},${zones.progress.height}"></g>
  <rect id="control-zone" data-zone="control" x="${zones.control.x}" y="${zones.control.y}"
        width="${zones.control.width}" height="${zones.control.height}" fill="none" stroke="none" pointer-events="all"
        data-bounds="${zones.control.x},${zones.control.y},${zones.control.width},${zones.control.height}" />
  <g id="track-zone" data-zone="track" transform="translate(${zones.track.x}, ${zones.track.y})"
     data-bounds="${zones.track.x},${zones.track.y},${zones.track.width},${zones.track.height}"></g>
  <g id="text-zone" data-zone="text" transform="translate(0, 0)" data-bounds="0,0,${width},${height}"></g>
</svg>`.trim();
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
 * @param {Object} [context.zones] - Pre-calculated zones (optional)
 * @returns {string} Complete SVG markup with zones marked for content injection
 */
export function render(context) {
    if (context.config?.shape === 'column') return renderColumn(context);
    const { width, height, colors, config, style, zones: contextZones } = context;
    // Use pre-calculated zones from context (already adjusted for borders) or calculate fresh
    const zones = contextZones || calculateZones(width, height);

    // Scale factors for border paths
    const sx = width / 365;
    const sy = height / 601;

    // User-configurable options with defaults
    const showAnimation = config.show_animation !== false;
    const animationSpeed = config.animation_speed || 2;
    const pulse = (/** @type {number} */ begin) => pulseStyle(animationSpeed, begin);
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
  <rect x="${2*sx}" y="${28*sy}" width="${26*sx}" height="${24*sy}" fill="${colors.animationIndicator}" ${pulse(0)} />
  <rect x="${38*sx}" y="${28*sy}" width="${26*sx}" height="${24*sy}" fill="${colors.animationIndicator}" ${pulse(animationSpeed / 3)} />
  <rect x="${74*sx}" y="${28*sy}" width="${26*sx}" height="${24*sy}" fill="${colors.animationIndicator}" ${pulse((animationSpeed * 2) / 3)} />
  ` : ''}

  <!-- Range indicators zone (render first so progress thumb appears on top) -->
  <g id="range-zone" data-zone="range"
     transform="translate(${zones.range.x}, ${zones.range.y})"
     data-bounds="${zones.range.x},${zones.range.y},${zones.range.width},${zones.range.height}">
    <!-- bands drawn by the card (lcards-slider _generateGaugeBandRanges) -->
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
        'column-shape',
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
    configurableOptions: PICARD_OPTIONS,
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
