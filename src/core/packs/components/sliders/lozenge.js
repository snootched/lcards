/**
 * Lozenge Slider Component
 *
 * Pill-shaped (fully-rounded-corner rectangle) slider with:
 * - Exterior text label areas above/below (vertical) or left/right (horizontal)
 *   the lozenge body — not overlapping the lozenge itself.
 * - Configurable track background colour and value fill colour.
 * - ClipPath ensures all injected track content is clipped to the pill shape.
 * - The card injects a `lozenge`-mode solid fill rect via the track zone; the
 *   component itself only provides the SVG shell (clip path, background, zones).
 * - Colors are resolved by the card, not the component.
 *
 * Orientation: Auto (horizontal or vertical via style.track.orientation)
 *
 * @module core/packs/components/sliders/lozenge
 */

/** Incrementing counter used to generate unique clipPath IDs per card instance. */
let _uidCounter = 0;

/**
 * Calculate zone bounds for the lozenge component.
 *
 * For **vertical** orientation the card area is split into three horizontal bands:
 *   - top label band   (topLabelH px)   — transparent, used by text zone for value label
 *   - lozenge body     (remainder)
 *   - bottom label band (botLabelH px)  — transparent, used by text zone for name label
 *
 * For **horizontal** orientation the split is left / lozenge / right.
 *
 * @param {number} width  - Container width in pixels
 * @param {number} height - Container height in pixels
 * @param {Object} [context] - Optional render context for style overrides
 * @param {Object} [context.style] - Slider style configuration
 * @returns {Object} Zone definitions with bounds
 */
export function calculateZones(width, height, context) {
    const lozengeStyle = context?.style?.lozenge;
    const orientation  = context?.style?.track?.orientation ?? 'vertical';
    const innerPad     = 4;

    if (orientation === 'horizontal') {
        // Horizontal: label bands on left and right
        const leftLabelW  = lozengeStyle?.label?.left?.size  ?? 60;
        const rightLabelW = lozengeStyle?.label?.right?.size ?? 60;

        const lozengeX = leftLabelW;
        const lozengeW = Math.max(1, width - leftLabelW - rightLabelW);
        const lozengeY = 0;
        const lozengeH = height;

        return {
            track:    { x: lozengeX + innerPad, y: lozengeY + innerPad,
                        width: Math.max(1, lozengeW - innerPad * 2),
                        height: Math.max(1, lozengeH - innerPad * 2) },
            control:  { x: lozengeX, y: lozengeY, width: lozengeW, height: lozengeH },
            progress: { x: lozengeX + innerPad, y: lozengeY + innerPad,
                        width: Math.max(1, lozengeW - innerPad * 2),
                        height: Math.max(1, lozengeH - innerPad * 2) },
            range:    { x: lozengeX + innerPad, y: lozengeY + innerPad,
                        width: Math.max(1, lozengeW - innerPad * 2),
                        height: Math.max(1, lozengeH - innerPad * 2) },
            text:     { x: 0, y: 0, width: width, height: height },
            // Internal geometry exposed for render()
            _lozenge: { x: lozengeX, y: lozengeY, width: lozengeW, height: lozengeH }
        };
    }

    // Vertical (default)
    const topLabelH = lozengeStyle?.label?.top?.size    ?? 36;
    const botLabelH = lozengeStyle?.label?.bottom?.size ?? 36;

    const lozengeY = topLabelH;
    const lozengeH = Math.max(1, height - topLabelH - botLabelH);
    const lozengeX = 0;
    const lozengeW = width;

    return {
        track:    { x: lozengeX + innerPad, y: lozengeY + innerPad,
                    width: Math.max(1, lozengeW - innerPad * 2),
                    height: Math.max(1, lozengeH - innerPad * 2) },
        control:  { x: lozengeX, y: lozengeY, width: lozengeW, height: lozengeH },
        progress: { x: lozengeX + innerPad, y: lozengeY + innerPad,
                    width: Math.max(1, lozengeW - innerPad * 2),
                    height: Math.max(1, lozengeH - innerPad * 2) },
        range:    { x: lozengeX + innerPad, y: lozengeY + innerPad,
                    width: Math.max(1, lozengeW - innerPad * 2),
                    height: Math.max(1, lozengeH - innerPad * 2) },
        text:     { x: 0, y: 0, width: width, height: height },
        // Internal geometry exposed for render()
        _lozenge: { x: lozengeX, y: lozengeY, width: lozengeW, height: lozengeH }
    };
}

/**
 * Render the lozenge component shell SVG.
 *
 * Produces a pill-shaped outer shell with a clipPath so that all track/pills/
 * progress content is automatically clipped to the lozenge boundary.
 * Text zones span the full card area so labels can appear in the exterior bands.
 *
 * @param {Object} context - Full render context
 * @param {number} context.width   - Container width in pixels
 * @param {number} context.height  - Container height in pixels
 * @param {Object} context.colors  - Resolved colors from resolveColors()
 * @param {Object} context.config  - Card configuration
 * @param {Object} context.style   - Slider style configuration
 * @param {Object} context.state   - Current state information
 * @param {Object} context.hass    - Home Assistant object
 * @param {Object} [context.zones] - Pre-calculated zones (supplied by card)
 * @returns {string} SVG markup with zone placeholders
 */
export function render(context) {
    const { width, height, colors, config, zones: contextZones } = context;

    // Zones are pre-calculated by the card (which calls calculateZones with context),
    // but fall back to a fresh calculation for standalone use.
    const zones = contextZones || calculateZones(width, height, context);

    // Lozenge geometry — prefer the internal hint stored by calculateZones, or derive.
    const loz = zones._lozenge ?? zones.control;
    const lozengeX = loz.x;
    const lozengeY = loz.y;
    const lozengeW = loz.width;
    const lozengeH = loz.height;

    // Pill radius: fully rounded = half the shorter dimension
    const rx = config?.style?.lozenge?.radius
        ?? Math.floor(Math.min(lozengeW, lozengeH) / 2);

    // Track background colour (dark "empty" fill inside the lozenge)
    const trackBackground = colors?.trackBackground
        ?? context?.style?.lozenge?.track?.background
        ?? '#12121c';

    // Unique ID so multiple lozenges on the same page don't share clipPath IDs
    const uid = config?.id ?? `lozenge-${++_uidCounter}`;

    return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <!-- Clip path constrains all track/progress content to the pill shape -->
    <clipPath id="lozenge-clip-${uid}">
      <rect x="${lozengeX}" y="${lozengeY}"
            width="${lozengeW}" height="${lozengeH}"
            rx="${rx}" ry="${rx}" />
    </clipPath>
  </defs>

  <!-- Outer card background (transparent) -->
  <rect width="${width}" height="${height}" fill="transparent" />

  <!-- Lozenge track background (the "empty" portion of the pill) -->
  <rect x="${lozengeX}" y="${lozengeY}"
        width="${lozengeW}" height="${lozengeH}"
        rx="${rx}" ry="${rx}"
        fill="${trackBackground}" />

  <!-- Progress bar zone — clipped to lozenge shape -->
  <g id="progress-zone" data-zone="progress"
     clip-path="url(#lozenge-clip-${uid})"
     transform="translate(${zones.progress.x}, ${zones.progress.y})"
     data-bounds="${zones.progress.x},${zones.progress.y},${zones.progress.width},${zones.progress.height}">
  </g>

  <!-- Track zone (lozenge solid fill, injected by card) — clipped to lozenge shape -->
  <g id="track-zone" data-zone="track"
     clip-path="url(#lozenge-clip-${uid})"
     transform="translate(${zones.track.x}, ${zones.track.y})"
     data-bounds="${zones.track.x},${zones.track.y},${zones.track.width},${zones.track.height}">
  </g>

  <!-- Range indicators zone — clipped to lozenge shape -->
  <g id="range-zone" data-zone="range"
     clip-path="url(#lozenge-clip-${uid})"
     transform="translate(${zones.range.x}, ${zones.range.y})"
     data-bounds="${zones.range.x},${zones.range.y},${zones.range.width},${zones.range.height}">
  </g>

  <!-- Control overlay — full lozenge area for pointer interaction -->
  <rect id="control-zone" data-zone="control"
        x="${zones.control.x}" y="${zones.control.y}"
        width="${zones.control.width}" height="${zones.control.height}"
        fill="none" stroke="none" pointer-events="all"
        data-bounds="${zones.control.x},${zones.control.y},${zones.control.width},${zones.control.height}" />

  <!-- Text zone — full card area so labels can sit in the exterior bands -->
  <g id="text-zone" data-zone="text"
     transform="translate(${zones.text.x}, ${zones.text.y})"
     data-bounds="${zones.text.x},${zones.text.y},${zones.text.width},${zones.text.height}">
  </g>
</svg>
    `.trim();
}

/**
 * Get component metadata.
 * @returns {Object} Component information
 */
export function getMetadata() {
    return {
        type: 'slider',
        pack: 'lcards_sliders',
        id: 'lozenge',
        name: 'Lozenge',
        description: 'Pill-shaped floating lozenge slider with exterior text label bands above/below (vertical) or left/right (horizontal)',
        orientation: 'auto',
        supportsOrientation: ['horizontal', 'vertical'],
        defaultOrientation: 'vertical',
        features: [
            'pill-shape',
            'clipped-track',
            'exterior-labels',
            'solid-fill',
            'range-bands',
            'invert-fill',
            'state-colors',
            'text-fields'
        ],
        configSchema: {
            style: {
                lozenge: {
                    radius: {
                        description: 'Override pill radius (defaults to auto = min(lozengeW,lozengeH)/2)',
                        type: 'number'
                    },
                    fill: {
                        description: 'Value fill appearance',
                        color: {
                            description: 'Colour of the filled (value) portion',
                            type: 'string',
                            default: '#93e1ff'
                        }
                    },
                    label: {
                        description: 'Label band sizes in pixels — space reserved outside the lozenge body',
                        top:    { size: { type: 'number', default: 36 } },
                        bottom: { size: { type: 'number', default: 36 } },
                        left:   { size: { type: 'number', default: 60 } },
                        right:  { size: { type: 'number', default: 60 } }
                    },
                    track: {
                        background: {
                            description: 'Lozenge track background colour (the empty portion)',
                            type: 'string',
                            default: '#12121c'
                        }
                    }
                }
            }
        }
    };
}

/** Default export with all functions and metadata expected by the component system. */
export default {
    calculateZones,
    render,
    metadata: getMetadata()
};
