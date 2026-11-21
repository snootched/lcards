/**
 * Ring Slider Component
 *
 * A circular gauge: a thick arc around the centre text (the M148 Protostar.NX
 * look). The arc runs from `style.ring.start_angle` to `style.ring.end_angle`
 * (degrees, 0 = top, clockwise); the value arc fills it from the start, and
 * dragging around the ring sets the value.
 *
 * Design philosophy (same as `shaped`):
 * - The component provides the SHELL only: the zone `<g>` placeholders.
 * - The card draws the track, ranges, fill, ticks and markers into the track
 *   zone (`_generateRingContent()`), and owns the pointer overlay.
 * - Colours are always resolved by the card, never by the component.
 *
 * Text zones sit in the square inscribed in the ring's inner edge: `label`
 * (top), `value` (middle), `sublabel` (bottom) and `center` (all of it).
 *
 * @module core/packs/components/sliders/ring
 */

import { ringLayout, ringTextZones } from '../../../../cards/slider-ring-geometry.js';

/**
 * Calculate zone bounds for the ring component.
 *
 * `_ring` carries the full ring layout (centre, radii, angles) to the card and
 * to `render()`. The room outside the ring (ticks, markers, labels) comes from
 * the card (`context.ringOuterPad`: it knows the label texts), else
 * `style.ring.padding`, else none.
 *
 * @param {number} width   - Container width in pixels
 * @param {number} height  - Container height in pixels
 * @param {Object} [context] - Optional render context
 * @param {Object} [context.style] - Slider style configuration
 * @param {number} [context.ringOuterPad] - Room outside the ring in px
 * @returns {Object} Zone definitions with bounds
 */
export function calculateZones(width, height, context) {
    const style = context?.style;
    const outerPad = context?.ringOuterPad ?? style?.ring?.padding ?? 0;
    const layout = ringLayout(width, height, style?.ring, { outerPad });
    const textZones = ringTextZones(layout.inner);

    return {
        track:    { ...layout.box },
        control:  { ...layout.box },
        progress: { ...layout.box },
        text:     { x: 0, y: 0, width, height },
        _ring:    layout,
        ...textZones
    };
}

/**
 * Render the ring component shell SVG.
 * @param {Object} context
 * @param {number} context.width
 * @param {number} context.height
 * @param {Object} [context.style] - Slider style configuration
 * @param {Object} [context.zones] - Pre-calculated zones (supplied by card)
 * @returns {string} SVG markup with zone placeholders
 */
export function render(context) {
    const { width, height } = context;
    const zones = context.zones || calculateZones(width, height, context);
    const b = zones.track;

    return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="transparent" />

  <!-- Track zone: track arc, range arcs, value arc, ticks, markers (absolute coordinates) -->
  <g id="track-zone" data-zone="track"
     transform="translate(0, 0)"
     data-bounds="${b.x},${b.y},${b.width},${b.height}">
  </g>

  <!-- Control zone: the card puts its pointer overlay over this box -->
  <rect id="control-zone" data-zone="control"
        x="${zones.control.x}" y="${zones.control.y}"
        width="${zones.control.width}" height="${zones.control.height}"
        fill="none" stroke="none"
        data-bounds="${zones.control.x},${zones.control.y},${zones.control.width},${zones.control.height}" />

  <!-- Text zone: full card area; fields target label / value / sublabel / center -->
  <g id="text-zone" data-zone="text"
     transform="translate(0, 0)"
     data-bounds="0,0,${width},${height}">
  </g>
</svg>
    `.trim();
}

/**
 * Return component metadata used by the component registry and editor.
 * @returns {Object}
 */
export function getMetadata() {
    return {
        type:               'slider',
        pack:               'lcards_sliders',
        id:                 'ring',
        name:               'Ring',
        description:        'Circular gauge: a thick value arc around the centre text. Drag around the ring to set the value. Angles, thickness and caps via style.ring.*; text fields target the label, value, sublabel or center zones.',
        orientation:        'auto',
        supportsOrientation: ['horizontal', 'vertical'],
        defaultOrientation:  'horizontal',
        features: [
            'ring',
            'drag-around',
            'range-arcs',
            'markers',
            'scale',
            'marker-labels',
            'invert-fill',
            'state-colors',
            'text-fields'
        ],
        textZones: ['label', 'value', 'sublabel', 'center']
    };
}

export default {
    calculateZones,
    render,
    metadata: getMetadata()
};
