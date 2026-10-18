/**
 * Bracket Arcs Component
 *
 * Two arcs, ( and ), framing a round display (meWho Titan.DS fleet directory, M141).
 * Put the content in the `center` zone (a ring gauge, a radar, a number) or layer a card
 * over it; the arcs are segments, so they take state colours, actions and animations.
 *
 * @module core/packs/components/brackets
 */

const bracketsSvg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <path id="left" d="M26.00 91.57 A48 48 0 0 1 26.00 8.43 L29.00 13.63 A42 42 0 0 0 29.00 86.37 Z" />
  <path id="right" d="M74.00 8.43 A48 48 0 0 1 74.00 91.57 L71.00 86.37 A42 42 0 0 0 71.00 13.63 Z" />
</svg>`;

/** @type {Object.<string, Object>} */
export const bracketsComponents = {
    'brackets': {
        svg: bracketsSvg,
        orientation: 'square',
        features: ['multi-segment', 'state-based-styling', 'zones', 'text-overlay'],
        // Zones in viewBox units (0 0 100 100): the space between the arcs, and each arc.
        zones: {
            center: { x: 18, y: 18, width: 64, height: 64 },
            left:   { x: 2,  y: 8,  width: 10, height: 84 },
            right:  { x: 88, y: 8,  width: 10, height: 84 },
        },
        segments: {
            left:  { style: { fill: 'theme:colors.ui.secondary', stroke: 'none' } },
            right: { style: { fill: 'theme:colors.ui.secondary', stroke: 'none' } },
        },
        presets: { default: {} },
        metadata: {
            type: 'brackets',
            card_type: 'button',
            pack: 'lcards_buttons',
            id: 'brackets',
            name: 'Bracket Arcs',
            description: 'Two arcs framing a round display; content goes in the center zone',
            version: '1.0.0'
        }
    }
};
