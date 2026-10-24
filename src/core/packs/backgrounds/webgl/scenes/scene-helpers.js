/**
 * Shared bits for the three.js background scenes (lazy chunk).
 * @module core/packs/backgrounds/webgl/scenes/scene-helpers
 */
import { Color, SRGBColorSpace } from 'three';
// Registers the anime.js three adapter, so a scene's animate() calls on
// three.js objects work whatever loaded first (every scene imports this file)
import 'animejs/adapters/three';

/**
 * Seeded RNG (mulberry32), the same one the Canvas2D starfield uses.
 * @param {number} seed
 * @returns {() => number}
 */
export function seededRandom(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * @param {{ r: number, g: number, b: number }} c - 0-255 channels
 * @param {Color} [target]
 * @returns {Color}
 */
export function toColor(c, target = new Color()) {
  return target.setRGB(c.r / 255, c.g / 255, c.b / 255, SRGBColorSpace);
}

/**
 * @param {number} v - colour channel 0-255
 */
const ch = (v) => Math.max(0, Math.min(255, v)) / 255;

/**
 * A colour as a vec4 uniform value: sRGB channels 0-1 (no colour-space
 * conversion, the Canvas2D effects write the same bytes) and alpha.
 * @param {{ r: number, g: number, b: number, a?: number } | undefined} c
 * @param {[number, number, number, number]} [fallback]
 * @returns {[number, number, number, number]}
 */
export function rgba(c, fallback = [1, 1, 1, 1]) {
  return c ? [ch(c.r), ch(c.g), ch(c.b), c.a ?? 1] : fallback;
}
