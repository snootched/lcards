/**
 * Shaped Slider Component
 *
 * A generic clip-path shell component that supports multiple shape types
 * (lozenge, rect, rounded, diamond, hexagon, polygon, path). The shape is
 * configured via `style.shaped.type` — defaulting to `lozenge`.
 *
 * Design philosophy:
 * - The component provides the visual SHELL only: clip path, background rect,
 *   and zone `<g>` placeholders.
 * - The card injects all dynamic content (fill, ranges, progress) via the zone
 *   injection pipeline.
 * - No range-zone is emitted; range bands are embedded directly inside the
 *   track-zone content by `_generateShapedContent()` on the card side.
 * - Colors are always resolved by the card, never by the component.
 *
 * Label bands:
 * - Vertical:   topLabel / lozenge body / bottomLabel
 * - Horizontal: leftLabel / lozenge body / rightLabel
 * Band sizes are driven by `style.shaped.label.*` (pixels).
 *
 * Orientation: Auto (driven by style.track.orientation).
 *
 * @module core/packs/components/sliders/shaped
 */

import { buildClipPath, SUPPORTED_SHAPES } from './shapes.js';

/** Module-level counter for unique clipPath IDs when config.id is absent. */
let _uidCounter = 0;

// ─────────────────────────────────────────────────────────────────────────────
// Zone calculation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate zone bounds for the shaped component.
 *
 * The card area is split into three bands:
 *   - **Vertical**:   top-label / shaped-body / bottom-label
 *   - **Horizontal**: left-label / shaped-body / right-label
 *
 * An `_shaped` key is included in the return value to pass lozenge body
 * geometry directly to `render()` without recalculating.
 *
 * @param {number} width   - Container width in pixels
 * @param {number} height  - Container height in pixels
 * @param {Object} [context] - Optional render context
 * @param {Object} [context.style] - Slider style configuration
 * @returns {Object} Zone definitions with bounds
 */
export function calculateZones(width, height, context) {
    const shapedStyle = context?.style?.shaped;
    const orientation = context?.style?.track?.orientation ?? 'vertical';

    let bodyX, bodyY, bodyW, bodyH;

    if (orientation === 'horizontal') {
        const leftW  = shapedStyle?.label?.left?.size  ?? 60;
        const rightW = shapedStyle?.label?.right?.size ?? 60;

        bodyX = leftW;
        bodyY = 0;
        bodyW = Math.max(1, width - leftW - rightW);
        bodyH = height;
    } else {
        // Vertical (default)
        const topH = shapedStyle?.label?.top?.size    ?? 36;
        const botH = shapedStyle?.label?.bottom?.size ?? 36;

        bodyX = 0;
        bodyY = topH;
        bodyW = width;
        bodyH = Math.max(1, height - topH - botH);
    }

    // Zones equal body bounds — no inner padding.
    // The clip path in render() handles the shape boundary completely;
    // adding padding here creates visible gaps at fill ends (e.g. flat
    // bottom on a lozenge because the fill rect can't reach the clip edge).
    const bodyZone = { x: bodyX, y: bodyY, width: bodyW, height: bodyH };

    return {
        track:    { ...bodyZone },
        control:  { ...bodyZone },
        progress: { ...bodyZone },
        // No range zone — ranges are embedded in track content
        text:     { x: 0, y: 0, width, height },
        // Internal hint for render() — body bounds
        _shaped:  { ...bodyZone }
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Shell render
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Render the shaped component shell SVG.
 *
 * Produces the clip path and background rect for the chosen shape, plus
 * `<g>` zone placeholders with `data-zone` attributes for content injection.
 *
 * @param {Object} context
 * @param {number} context.width
 * @param {number} context.height
 * @param {Object} context.colors   - Resolved colors (expects `trackBackground`)
 * @param {Object} context.config   - Card config
 * @param {Object} context.style    - Slider style config
 * @param {Object} [context.zones]  - Pre-calculated zones (supplied by card)
 * @returns {string} SVG markup with zone placeholders
 */
export function render(context) {
    const { width, height, colors, config, style } = context;

    // Use pre-calculated zones if provided, otherwise derive them here
    const zones = context.zones || calculateZones(width, height, context);

    // Body geometry — prefer hint stored by calculateZones, fall back to control zone
    const body   = zones._shaped ?? zones.control;
    const bodyX  = body.x;
    const bodyY  = body.y;
    const bodyW  = body.width;
    const bodyH  = body.height;

    // Shape type — defaults to lozenge
    const shapeType = style?.shaped?.type ?? 'lozenge';

    // Shape-specific options forwarded to buildClipPath
    const shapeOptions = {
        radius:      style?.shaped?.radius,
        orientation: style?.track?.orientation,
        points:      style?.shaped?.polygon?.points,
        d:           style?.shaped?.path?.d,
        translate:   style?.shaped?.path?.translate
    };

    // Unique ID per card instance
    const uid = config?.id ?? `shaped-${++_uidCounter}`;
    const clipId = `shaped-clip-${uid}`;

    // Track background (dark "empty" fill inside the shape)
    const trackBg = colors?.trackBackground
        ?? style?.shaped?.track?.background
        ?? '#12121c';

    const clipPathElement = buildClipPath(clipId, shapeType, bodyX, bodyY, bodyW, bodyH, shapeOptions);

    return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <!-- Clip path constrains all injected content to the shape boundary -->
    ${clipPathElement}
  </defs>

  <!-- Full-card transparent background -->
  <rect width="${width}" height="${height}" fill="transparent" />

  <!-- Shape background (the "empty" portion of the track) -->
  <rect x="${bodyX}" y="${bodyY}" width="${bodyW}" height="${bodyH}"
        clip-path="url(#${clipId})"
        fill="${trackBg}" />

  <!-- Progress bar zone — clipped to shape -->
  <!-- Content injected here uses absolute SVG coordinates; clip-path handles boundary -->
  <g id="progress-zone" data-zone="progress"
     clip-path="url(#${clipId})"
     transform="translate(0, 0)"
     data-bounds="${zones.progress.x},${zones.progress.y},${zones.progress.width},${zones.progress.height}">
  </g>

  <!-- Track zone (fill + ranges, injected by card) — clipped to shape -->
  <!-- Content injected here uses absolute SVG coordinates; clip-path handles boundary -->
  <g id="track-zone" data-zone="track"
     clip-path="url(#${clipId})"
     transform="translate(0, 0)"
     data-bounds="${zones.track.x},${zones.track.y},${zones.track.width},${zones.track.height}">
  </g>

  <!-- Control overlay — full body area for pointer interaction -->
  <rect id="control-zone" data-zone="control"
        x="${zones.control.x}" y="${zones.control.y}"
        width="${zones.control.width}" height="${zones.control.height}"
        fill="none" stroke="none" pointer-events="all"
        data-bounds="${zones.control.x},${zones.control.y},${zones.control.width},${zones.control.height}" />

  <!-- Text zone — full card area so labels can sit in exterior bands -->
  <g id="text-zone" data-zone="text"
     transform="translate(${zones.text.x}, ${zones.text.y})"
     data-bounds="${zones.text.x},${zones.text.y},${zones.text.width},${zones.text.height}">
  </g>
</svg>
    `.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return component metadata used by the component registry and editor.
 * @returns {Object}
 */
export function getMetadata() {
    return {
        type:               'slider',
        pack:               'lcards_sliders',
        id:                 'shaped',
        name:               'Shaped',
        description:        'Generic clip-path slider with exterior label bands. Shape is configurable via style.shaped.type (lozenge, rect, rounded, diamond, hexagon, polygon, path).',
        orientation:        'auto',
        supportsOrientation: ['horizontal', 'vertical'],
        defaultOrientation:  'vertical',
        features: [
            'clip-shape',
            'exterior-labels',
            'solid-fill',
            'range-bands',
            'invert-fill',
            'state-colors',
            'text-fields',
            'configurable-shape'
        ],
        supportedShapes: SUPPORTED_SHAPES,
        configSchema: {
            style: {
                shaped: {
                    type: {
                        description: 'Shape to use as the clip boundary',
                        type: 'string',
                        enum: SUPPORTED_SHAPES,
                        default: 'lozenge'
                    },
                    radius: {
                        description: 'Corner radius in px (lozenge defaults to auto = min(w,h)/2, rounded defaults to 8)',
                        type: 'number'
                    },
                    fill: {
                        color: {
                            description: 'Value fill colour',
                            type: 'string',
                            default: '#93e1ff'
                        }
                    },
                    label: {
                        top:    { size: { type: 'number', default: 36 } },
                        bottom: { size: { type: 'number', default: 36 } },
                        left:   { size: { type: 'number', default: 60 } },
                        right:  { size: { type: 'number', default: 60 } }
                    },
                    track: {
                        background: {
                            description: 'Shape track background colour (the empty portion)',
                            type: 'string',
                            default: 'theme:components.slider.track.background'
                        }
                    },
                    polygon: {
                        points: {
                            description: 'Array of [xPct, yPct] pairs (0-1) for polygon shape type',
                            type: 'array'
                        }
                    },
                    path: {
                        d: {
                            description: 'SVG path d-attribute for path shape type',
                            type: 'string'
                        },
                        translate: {
                            description: 'If true, wrap path in translate(bodyX, bodyY) transform',
                            type: 'boolean',
                            default: false
                        }
                    }
                }
            }
        }
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Default export
// ─────────────────────────────────────────────────────────────────────────────

export default {
    calculateZones,
    render,
    metadata: getMetadata()
};
