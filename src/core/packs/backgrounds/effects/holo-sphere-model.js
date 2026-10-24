/**
 * `holo-sphere` model, shared by the Canvas2D effect (HoloSphereEffect) and
 * the three.js scene (webgl/scenes/holo-sphere.js), so both tiers draw the
 * same planet: the wireframe on a unit sphere, how rotation and tilt place a
 * point, how bright the far side and the scan band are.
 *
 * @module core/packs/backgrounds/effects/holo-sphere-model
 */
/** Line segments per full latitude ring, and per meridian (pole to pole) */
const RING_STEPS = 64;
const MERIDIAN_STEPS = 32;
/** Half-height of the scan band's glow, in sphere radii */
export const BAND_WIDTH = 0.08;

/**
 * The wireframe: latitude rings (poles excluded) and meridians, as segment
 * end points on the unit sphere, y up.
 * @param {number} latitudes - rings between the poles
 * @param {number} longitudes - meridians around
 * @returns {Float32Array} x, y, z of segment starts and ends, 6 numbers per segment
 */
export function sphereSegments(latitudes, longitudes) {
  const lat = Math.max(0, Math.min(64, Math.round(latitudes)));
  const lon = Math.max(0, Math.min(128, Math.round(longitudes)));
  const out = new Float32Array((lat * RING_STEPS + lon * MERIDIAN_STEPS) * 6);
  let k = 0;
  /** @param {number} x @param {number} y @param {number} z */
  const put = (x, y, z) => { out[k++] = x; out[k++] = y; out[k++] = z; };
  for (let i = 1; i <= lat; i++) {
    const phi = -Math.PI / 2 + (Math.PI * i) / (lat + 1);
    const y = Math.sin(phi);
    const r = Math.cos(phi);
    for (let s = 0; s < RING_STEPS; s++) {
      const a0 = (2 * Math.PI * s) / RING_STEPS;
      const a1 = (2 * Math.PI * (s + 1)) / RING_STEPS;
      put(r * Math.cos(a0), y, r * Math.sin(a0));
      put(r * Math.cos(a1), y, r * Math.sin(a1));
    }
  }
  for (let j = 0; j < lon; j++) {
    const theta = (2 * Math.PI * j) / lon;
    const cx = Math.cos(theta);
    const cz = Math.sin(theta);
    for (let s = 0; s < MERIDIAN_STEPS; s++) {
      const p0 = -Math.PI / 2 + (Math.PI * s) / MERIDIAN_STEPS;
      const p1 = -Math.PI / 2 + (Math.PI * (s + 1)) / MERIDIAN_STEPS;
      put(Math.cos(p0) * cx, Math.sin(p0), Math.cos(p0) * cz);
      put(Math.cos(p1) * cx, Math.sin(p1), Math.cos(p1) * cz);
    }
  }
  return out;
}

/**
 * Rotate a unit-sphere point about y by `angle`, then tilt it about x by
 * `tilt` (positive tilts the north pole toward the viewer). z > 0 faces the
 * viewer. Same order as the scene: the sphere spins inside a tilted group.
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {number} cosA - cos(angle)
 * @param {number} sinA
 * @param {number} cosT - cos(tilt)
 * @param {number} sinT
 * @param {{ x: number, y: number, z: number }} out
 */
export function placePoint(x, y, z, cosA, sinA, cosT, sinT, out) {
  // About y (three.js rotation.y: x' = x cos + z sin, z' = -x sin + z cos)
  const rx = x * cosA + z * sinA;
  const rz = -x * sinA + z * cosA;
  // About x (three.js rotation.x: y' = y cos - z sin, z' = y sin + z cos)
  out.x = rx;
  out.y = y * cosT - rz * sinT;
  out.z = y * sinT + rz * cosT;
  return out;
}

/**
 * How bright a line is by its depth: full in front, `back` behind, a short
 * blend across the limb.
 * @param {number} z - facing depth, -1 (far) to 1 (near)
 * @param {number} back - far-side brightness, 0-1
 */
export function depthAlpha(z, back) {
  const t = Math.max(0, Math.min(1, (z + 0.15) / 0.3));
  const s = t * t * (3 - 2 * t);
  return back + (1 - back) * s;
}

/**
 * The scan band glow at latitude height `y` (object space, so the band
 * follows the tilt like a line of latitude).
 * @param {number} y
 * @param {{ y: number, strength: number }} band
 */
export function bandGlow(y, band) {
  const d = (y - band.y) / BAND_WIDTH;
  return band.strength * Math.exp(-d * d);
}

/**
 * The scan band: sweeps up the sphere (inOutSine), fading in over the first
 * fifth of the sweep and out over the last, then rests for a quarter of the
 * period. A pure function of the effect clock, so it pauses, holds under
 * reduced motion and follows `speed` with the effect. (Pure maths, not an
 * anime.js animation: this module is in the presets' import graph, which the
 * build's node scripts load, and anime.js needs a document on import.)
 * @param {number} periodS - one sweep plus its rest, seconds (0 = no band)
 */
export function createScanBand(periodS) {
  const band = { y: -1.2, strength: 0 };
  const total = periodS * 1000;
  const sweep = total * 0.75;
  return {
    band,
    /** @param {number} t - effect clock, ms */
    seek: (t) => {
      if (!(total > 0)) {
        band.strength = 0;
        return;
      }
      const local = ((t % total) + total) % total;
      if (local >= sweep) {
        band.y = 1.2;
        band.strength = 0;
        return;
      }
      const p = local / sweep;
      band.y = -1.2 + 2.4 * (0.5 - Math.cos(Math.PI * p) / 2);
      band.strength = Math.min(1, p / 0.2, (1 - p) / 0.2);
    },
    cancel: () => {}
  };
}

/**
 * Where the sphere sits on a `w x h` canvas: centre and radius in px.
 * @param {{ size?: number, position_x?: number, position_y?: number }} p
 * @param {number} w
 * @param {number} h
 */
export function sphereFrame(p, w, h) {
  return {
    cx: (p.position_x ?? 0.5) * w,
    cy: (p.position_y ?? 0.5) * h,
    r: Math.max(1, ((p.size ?? 0.8) * Math.min(w, h)) / 2)
  };
}
