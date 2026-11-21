/**
 * @fileoverview Linear interpolation / range-mapping utility.
 *
 * Maps a value from one numeric range to another.  Pass `clamp = true` to
 * prevent the output from exceeding the output range.
 *
 * @module utils/linearMap
 */

import { interpolateColor } from '../core/themes/resolve-color.js';

export function linearMap(val, inMin, inMax, outMin, outMax, clamp) {
  if (inMax === inMin) return outMin;
  let t = (val - inMin) / (inMax - inMin);
  if (clamp) {
    if (t < 0) t = 0;
    else if (t > 1) t = 1;
  }
  return outMin + t * (outMax - outMin);
}

/**
 * A map_range `output` for an input value: numbers map linearly, two colours
 * (any form LCARdS accepts) blend through interpolateColor(). The one output
 * mapping for every map_range (animations, background animations, button
 * shape textures).
 *
 * @param {number} val - Input value
 * @param {number} inMin
 * @param {number} inMax
 * @param {[any, any]} output - `[low, high]`: two numbers or two colours
 * @param {boolean} clamp - Hold at the ends of `output` (colours always hold)
 * @param {Object} [options]
 * @param {Element|null} [options.element=null] - Element whose CSS variables apply to colours
 * @returns {number|string|undefined} undefined when `output` is neither two numbers nor two colours
 */
export function mapRangeOutput(val, inMin, inMax, output, clamp, { element = null } = {}) {
  const [outMin, outMax] = output;
  if (typeof outMin === 'number' && typeof outMax === 'number' &&
      Number.isFinite(outMin) && Number.isFinite(outMax)) {
    return linearMap(val, inMin, inMax, outMin, outMax, clamp);
  }
  if (typeof outMin === 'string' && typeof outMax === 'string') {
    const t = linearMap(val, inMin, inMax, 0, 1, true);
    return interpolateColor(outMin, outMax, t, { element }) ?? undefined;
  }
  return undefined;
}
