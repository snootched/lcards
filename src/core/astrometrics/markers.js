/**
 * Point markers as small inline SVGs in `currentColor` (the label's colour,
 * so a CSS variable colour stays live). `moon_phase` draws the lit part of
 * the moon from its illuminated fraction.
 *
 * @module core/astrometrics/markers
 */

export { MARKERS } from './names.js';

/** @type {Record<string, string>} */
const SHAPES = {
  dot: '<svg width="10" height="10" viewBox="-5 -5 10 10"><circle r="3.5" fill="currentColor"/></svg>',
  triangle: '<svg width="12" height="12" viewBox="-6 -6 12 12"><path d="M0 -5 L5 4 L-5 4Z" fill="currentColor"/></svg>',
  diamond: '<svg width="12" height="12" viewBox="-6 -6 12 12"><path d="M0 -5 L5 0 L0 5 L-5 0Z" fill="currentColor"/></svg>',
  square: '<svg width="10" height="10" viewBox="-5 -5 10 10"><rect x="-3.5" y="-3.5" width="7" height="7" fill="currentColor"/></svg>',
  reticle: '<svg width="22" height="22" viewBox="-11 -11 22 22"><circle r="7" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M0 -11V-4M0 4V11M-11 0H-4M4 0H11" stroke="currentColor" stroke-width="1.5"/></svg>'
};

/** Marker size in px (its box is centred on the point) */
export const MARKER_SIZE = { dot: 10, triangle: 12, diamond: 12, square: 10, reticle: 22, moon_phase: 16, none: 0 };

/**
 * The lit part of a moon disc of radius r: the limb half plus the
 * terminator, an ellipse whose half-width is r * |1 - 2 * fraction|.
 * Waxing is lit on the right (as seen from the northern hemisphere).
 * @param {number} fraction - 0 new to 1 full
 * @param {boolean} waxing
 * @param {number} [r]
 */
export function moonPhasePath(fraction, waxing, r = 6) {
  const f = Math.min(1, Math.max(0, fraction));
  const k = +(r * Math.abs(1 - 2 * f)).toFixed(3);
  const limb = waxing ? 1 : 0;
  // Gibbous: the terminator bulges into the dark half
  const term = f > 0.5 ? limb : 1 - limb;
  return `M0 ${-r} A${r} ${r} 0 0 ${limb} 0 ${r} A${k} ${r} 0 0 ${term} 0 ${-r}Z`;
}

/**
 * @param {string} name
 * @param {{ fraction?: number, waxing?: boolean }} [moon]
 * @returns {string} SVG markup, '' for none or an unknown name
 */
export function markerSvg(name, moon) {
  if (name === 'moon_phase') {
    const d = moonPhasePath(moon?.fraction ?? 0.5, moon?.waxing ?? true);
    return `<svg width="16" height="16" viewBox="-8 -8 16 16"><circle r="6" fill="none" stroke="currentColor" stroke-width="1" opacity="0.45"/><path d="${d}" fill="currentColor"/></svg>`;
  }
  return SHAPES[name] ?? '';
}
