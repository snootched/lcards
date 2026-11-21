/**
 * A tileable 3D fBm noise texture for raymarched volumes (`nebula` with
 * `render: volume`). Hashing noise per sample costs a raymarch +10 to +31 ms
 * a frame; two reads of this texture per sample cost +0.7 to +2.3 ms (E6
 * raymarch spike). Made once on the CPU, on first use, and shared by every
 * volume in the page.
 *
 * Value noise of the same hash family as the shaders' (NOISE_HASH, with
 * noise3-glsl's third axis), each octave on a lattice that wraps at the
 * texture's edge, so `RepeatWrapping` shows no seam.
 *
 * @module core/astrometrics/effects/noise3-texture
 */
import { Data3DTexture, RedFormat, LinearFilter, RepeatWrapping } from 'three';
import { NOISE_HASH } from '../../packs/textures/effects/noise-helpers.js';
import { HASH_Z } from './noise3-glsl.js';

/** Texels along each side */
export const NOISE_SIZE = 64;
/** Lattice cells across the texture at the first octave (doubles per octave) */
const BASE_CELLS = 4;
const OCTAVES = 4;

/**
 * The hash at a lattice point, 0 to 1.
 * @param {number} x @param {number} y @param {number} z
 */
function hash01(x, y, z) {
  let h = (((Math.imul(x, NOISE_HASH.X) ^ Math.imul(y, NOISE_HASH.Y) ^ Math.imul(z, HASH_Z)) >>> 0) + NOISE_HASH.S) >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, NOISE_HASH.M1) >>> 0;
  h ^= h >>> 15;
  h = Math.imul(h, NOISE_HASH.M2) >>> 0;
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/**
 * The noise volume's texels (pure: the same size always gives the same
 * bytes), x fastest, then y, then z. 0 to 255, about 128 on average.
 * @param {number} [n] - texels along each side
 * @returns {Uint8Array}
 */
export function noiseVolume(n = NOISE_SIZE) {
  const sum = new Float32Array(n * n * n);
  let total = 0;
  for (let o = 0, cells = BASE_CELLS, amp = 0.5; o < OCTAVES; o++, cells *= 2, amp *= 0.5) {
    const c = Math.min(cells, n);
    // this octave's lattice, wrapping at c cells (a different z slab per octave)
    const lattice = new Float32Array(c * c * c);
    for (let z = 0; z < c; z++) for (let y = 0; y < c; y++) for (let x = 0; x < c; x++) lattice[x + c * (y + c * z)] = hash01(x, y, z + o * 1013);
    // per texel along an axis: the cell, its neighbour and the smoothed fraction
    const i0 = new Int32Array(n);
    const i1 = new Int32Array(n);
    const f = new Float32Array(n);
    for (let t = 0; t < n; t++) {
      const p = (t / n) * c;
      const k = Math.floor(p);
      const r = p - k;
      i0[t] = k % c;
      i1[t] = (k + 1) % c;
      f[t] = r * r * (3 - 2 * r);
    }
    for (let z = 0; z < n; z++) {
      const z0 = i0[z] * c * c, z1 = i1[z] * c * c, w = f[z];
      for (let y = 0; y < n; y++) {
        const y0 = i0[y] * c, y1 = i1[y] * c, v = f[y];
        const row = n * (y + n * z);
        for (let x = 0; x < n; x++) {
          const x0 = i0[x], x1 = i1[x], u = f[x];
          const a = lattice[x0 + y0 + z0] + (lattice[x1 + y0 + z0] - lattice[x0 + y0 + z0]) * u;
          const b = lattice[x0 + y1 + z0] + (lattice[x1 + y1 + z0] - lattice[x0 + y1 + z0]) * u;
          const d = lattice[x0 + y0 + z1] + (lattice[x1 + y0 + z1] - lattice[x0 + y0 + z1]) * u;
          const e = lattice[x0 + y1 + z1] + (lattice[x1 + y1 + z1] - lattice[x0 + y1 + z1]) * u;
          const lo = a + (b - a) * v;
          const hi = d + (e - d) * v;
          sum[x + row] += amp * (lo + (hi - lo) * w);
        }
      }
    }
    total += amp;
  }
  const out = new Uint8Array(sum.length);
  for (let i = 0; i < sum.length; i++) out[i] = Math.round((sum[i] / total) * 255);
  return out;
}

/** @type {Data3DTexture | null} */
let shared = null;

/**
 * The shared noise texture (made on the first call). Never disposed: one
 * 256 KB texture serves every volume nebula for the page's life.
 * @returns {Data3DTexture}
 */
export function noiseTexture() {
  if (shared) return shared;
  const tex = new Data3DTexture(noiseVolume(), NOISE_SIZE, NOISE_SIZE, NOISE_SIZE);
  tex.format = RedFormat;
  tex.minFilter = tex.magFilter = LinearFilter;
  tex.wrapS = tex.wrapT = tex.wrapR = RepeatWrapping;
  tex.unpackAlignment = 1;
  tex.needsUpdate = true;
  shared = tex;
  return tex;
}
