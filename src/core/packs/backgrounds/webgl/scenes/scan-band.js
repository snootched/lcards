/**
 * The grid's scan band timing, free of three.js: the background grid
 * (`grid.js`) and the astrometrics scene objects share it.
 *
 * @module core/packs/backgrounds/webgl/scenes/scan-band
 */

/**
 * The scan band: sweeps from the far end to the near end (inQuad), fading in
 * and out, then rests. Pure function of the effect clock.
 * @param {number} t - ms
 * @param {number} periodS - seconds, 0 = off
 * @returns {{ pos: number, strength: number }} pos 0 (far) to 1 (near)
 */
export function scanAt(t, periodS) {
  if (!(periodS > 0)) return { pos: 0, strength: 0 };
  const total = periodS * 1000;
  const sweep = total * 0.75;
  const local = ((t % total) + total) % total;
  if (local >= sweep) return { pos: 1, strength: 0 };
  const q = local / sweep;
  return { pos: q * q, strength: Math.min(1, q / 0.15, (1 - q) / 0.15) };
}
