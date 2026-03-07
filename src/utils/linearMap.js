/**
 * @fileoverview Linear interpolation / range-mapping utility.
 *
 * Maps a value from one numeric range to another.  Pass `clamp = true` to
 * prevent the output from exceeding the output range.
 *
 * @module utils/linearMap
 */

export function linearMap(val, inMin, inMax, outMin, outMax, clamp) {
  if (inMax === inMin) return outMin;
  let t = (val - inMin) / (inMax - inMin);
  if (clamp) {
    if (t < 0) t = 0;
    else if (t > 1) t = 1;
  }
  return outMin + t * (outMax - outMin);
}
