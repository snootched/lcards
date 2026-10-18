/**
 * Radar Scope Component
 *
 * A round scope: a rim, range rings, cross hairs and a sweep wedge (meWho Protostar, M148).
 * Every part is a segment, so each takes its own colour; give the button a `rotate`
 * animation (or the sweep segment one) for a turning scan. The `center` zone takes a
 * label or reading.
 *
 * @module core/packs/components/radar
 */

const radarSvg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <path id="sweep" d="M50 50 L50 6 A44 44 0 0 1 78.28 16.29 Z" />
  <circle id="rings" cx="50" cy="50" r="30" />
  <circle id="inner-ring" cx="50" cy="50" r="15" />
  <path id="cross" d="M50 6 V94 M6 50 H94" />
  <circle id="rim" cx="50" cy="50" r="46" />
</svg>`;

/** @type {Object.<string, Object>} */
export const radarComponents = {
    'radar': {
        svg: radarSvg,
        orientation: 'square',
        features: ['multi-segment', 'state-based-styling', 'zones', 'text-overlay'],
        zones: {
            center: { x: 30, y: 30, width: 40, height: 40 },
        },
        segments: {
            sweep:        { style: { fill: 'theme:colors.ui.secondary', 'fill-opacity': 0.35, stroke: 'none' } },
            rings:        { style: { fill: 'none', stroke: 'theme:colors.ui.secondary', 'stroke-width': 0.8 } },
            'inner-ring': { style: { fill: 'none', stroke: 'theme:colors.ui.secondary', 'stroke-width': 0.8 } },
            cross:        { style: { fill: 'none', stroke: 'theme:colors.card.topColor', 'stroke-width': 0.8 } },
            rim:          { style: { fill: 'none', stroke: 'theme:colors.ui.primary', 'stroke-width': 3 } },
        },
        presets: { default: {} },
        metadata: {
            type: 'radar',
            card_type: 'button',
            pack: 'lcards_buttons',
            id: 'radar',
            name: 'Radar Scope',
            description: 'Round scope with rim, range rings, cross hairs and a sweep wedge',
            version: '1.0.0'
        }
    }
};
