/**
 * `deform:` on a grid: warps of the object's local space, applied on the
 * CPU to the undeformed positions every frame (or once when nothing
 * moves). One function moves the mesh vertices, the rim lines, the points
 * standing on the grid and maps picks back, so they always agree. The grid
 * lines come from the `surf` attribute, which does not move: they are
 * painted on the surface and stretch with it.
 *
 * Two frames, by shape: axial (cylinder, sphere, dome, well: round the
 * local y axis, h = 0 at the bottom, 1 at the top) and flat (plane, disc:
 * polar on the plane, outward is +y). Amplitudes are fractions of the
 * object's size S (its radius, or half a plane's larger side). Repeating
 * motion is a `period` (seconds per cycle), noise moves by `drift` (scene
 * units per second); without them a deformation is a still shape.
 *
 * Free of three.js (node tests, the config checker).
 *
 * @module core/astrometrics/deform
 */
import { DEFORM_TYPES } from './names.js';

const DEG = Math.PI / 180;
const TAU = 2 * Math.PI;

/**
 * @typedef {Object} DeformFrame
 * @property {'axial' | 'flat'} kind
 * @property {number} size - S, scene units
 * @property {number} [y0] - axial: the bottom of the object's extent
 * @property {number} [y1] - axial: the top
 */

/**
 * @typedef {Object} Deformer
 * @property {boolean} moving - animates on the scene clock
 * @property {number} reach - the furthest any position moves, scene units (bounds)
 * @property {(x: number, y: number, z: number, t: number, out: number[]) => number[]} warp - one position; t: scene clock, ms
 * @property {(base: Float32Array) => (t: number, dst: Float32Array) => void} batch - a whole position array (x, y, z, ...) each frame: the same result as warp, with what does not change worked out once
 */

/**
 * @param {any} v
 * @param {number} d
 */
const num = (v, d) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

/**
 * Normalised height from the anchor: 0 there, 1 at the far end
 * (`middle`: 0 in the middle, 1 at both ends).
 * @param {number} y
 * @param {number} y0
 * @param {number} y1
 * @param {string} anchor
 */
function fromAnchor(y, y0, y1, anchor) {
  const L = Math.max(1e-6, y1 - y0);
  if (anchor === 'top') return (y1 - y) / L;
  if (anchor === 'middle') return Math.abs(y - (y0 + y1) / 2) / (L / 2);
  return (y - y0) / L;
}

/**
 * Cycles per second from a `period` in seconds (0 or none: still).
 * @param {any} period
 */
const rate = (period) => {
  const p = num(period, 0);
  return p > 0 ? 1 / p : 0;
};

/**
 * How much of a deformation shows at t: 1 when it is still, else a swing
 * between -1 and 1.
 * @param {number} speed - cycles per second
 * @param {number} ts - seconds
 */
const swing = (speed, ts) => (speed ? Math.sin(TAU * speed * ts) : 1);

/**
 * A lattice hash, 0..1.
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {number} seed
 */
function hash3(x, y, z, seed) {
  let h = Math.imul(x, 0x8da6b343) ^ Math.imul(y, 0xd8163841) ^ Math.imul(z, 0xcb1ab31f) ^ Math.imul(seed + 1, 0x27d4eb2f);
  h = Math.imul(h ^ (h >>> 13), 0x5bd1e995);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

/**
 * Smooth 3D value noise, -1..1 (deterministic for a seed).
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {number} [seed]
 */
export function valueNoise3(x, y, z, seed = 0) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const fx = x - xi;
  const fy = y - yi;
  const fz = z - zi;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const w = fz * fz * (3 - 2 * fz);
  const lerp = (/** @type {number} */ a, /** @type {number} */ b, /** @type {number} */ k) => a + (b - a) * k;
  const c = (/** @type {number} */ i, /** @type {number} */ j, /** @type {number} */ k) => hash3(xi + i, yi + j, zi + k, seed);
  const x00 = lerp(c(0, 0, 0), c(1, 0, 0), u);
  const x10 = lerp(c(0, 1, 0), c(1, 1, 0), u);
  const x01 = lerp(c(0, 0, 1), c(1, 0, 1), u);
  const x11 = lerp(c(0, 1, 1), c(1, 1, 1), u);
  return lerp(lerp(x00, x10, v), lerp(x01, x11, v), w) * 2 - 1;
}

/**
 * Octaves of value noise, -1..1.
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {number} octaves
 * @param {number} seed
 */
export function fbm3(x, y, z, octaves, seed) {
  let sum = 0;
  let amp = 1;
  let total = 0;
  for (let o = 0; o < octaves; o++) {
    sum += amp * valueNoise3(x, y, z, seed + o * 17);
    total += amp;
    amp *= 0.5;
    x *= 2;
    y *= 2;
    z *= 2;
  }
  return sum / total;
}

/**
 * @typedef {Object} DeformStep
 * @property {boolean} moving
 * @property {number} reach
 * @property {(ts: number) => (p: number[]) => void} at - the step at time ts (seconds), time-only terms worked out once
 * @property {(src: Float32Array) => (ts: number, src: Float32Array, dst: Float32Array) => void} [prepare] - a faster batch form for a step whose input never changes (per-vertex terms worked out once)
 */

/**
 * One deformation as a warp step; null for an unknown type or no amplitude.
 * @param {any} d - one `deform:` entry
 * @param {DeformFrame} frame
 * @returns {DeformStep | null}
 */
export function deformStep(d, frame) {
  if (!d || !(/** @type {readonly string[]} */ (DEFORM_TYPES)).includes(d.type)) return null;
  const S = Math.max(1e-6, frame.size);
  const axial = frame.kind === 'axial';
  const y0 = frame.y0 ?? -S;
  const y1 = frame.y1 ?? S;
  const L = Math.max(1e-6, y1 - y0);
  const anchor = String(d.anchor ?? 'bottom');
  if (d.type === 'wobble') {
    const a = num(d.amplitude, 0.08);
    const lobes = Math.round(num(d.lobes, 3));
    const waves = num(d.waves, 1);
    const speed = rate(d.period);
    if (!a) return null;
    /** The phase of a position (fixed) and how far out it moves (axial: a fraction of the radius) */
    const phase = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ z) => {
      const theta = Math.atan2(x, -z);
      if (axial) return [lobes * theta + TAU * waves * ((y - y0) / L), a];
      const r = Math.hypot(x, z) / S;
      return [lobes * theta + TAU * waves * r, a * S * Math.min(1, r)];
    };
    return {
      moving: speed !== 0,
      reach: Math.abs(a) * S,
      at(ts) {
        const shift = -TAU * speed * ts;
        return (p) => {
          const [ph, m] = phase(p[0], p[1], p[2]);
          const w = m * Math.sin(ph + shift);
          if (axial) {
            p[0] *= 1 + w;
            p[2] *= 1 + w;
          } else p[1] += w;
        };
      },
      // sin(ph + shift) = sin ph cos shift + cos ph sin shift: no trig per vertex per frame
      prepare(src) {
        const n = src.length / 3;
        const ms = new Float32Array(n);
        const mc = new Float32Array(n);
        for (let i = 0; i < n; i++) {
          const [ph, m] = phase(src[i * 3], src[i * 3 + 1], src[i * 3 + 2]);
          ms[i] = m * Math.sin(ph);
          mc[i] = m * Math.cos(ph);
        }
        return (ts, s, dst) => {
          const shift = -TAU * speed * ts;
          const cs = Math.cos(shift);
          const sn = Math.sin(shift);
          for (let i = 0, k = 0; i < n; i++, k += 3) {
            const w = ms[i] * cs + mc[i] * sn;
            if (axial) {
              dst[k] = s[k] * (1 + w);
              dst[k + 1] = s[k + 1];
              dst[k + 2] = s[k + 2] * (1 + w);
            } else {
              dst[k] = s[k];
              dst[k + 1] = s[k + 1] + w;
              dst[k + 2] = s[k + 2];
            }
          }
        };
      }
    };
  }
  if (d.type === 'bend') {
    const a = num(d.amplitude, 0.25);
    const bearing = num(d.bearing, 0) * DEG;
    const motion = ['sway', 'circle', 'none'].includes(d.motion) ? d.motion : 'sway';
    const speed = motion === 'none' ? 0 : rate(d.period);
    if (!a) return null;
    return {
      moving: speed !== 0,
      reach: Math.abs(a) * S,
      at(ts) {
        const b = motion === 'circle' ? bearing + TAU * speed * ts : bearing;
        const m = a * S * (motion === 'sway' ? swing(speed, ts) : 1);
        const dx = Math.sin(b);
        const dz = -Math.cos(b);
        return (p) => {
          if (axial) {
            const h = fromAnchor(p[1], y0, y1, anchor);
            p[0] += dx * m * h * h;
            p[2] += dz * m * h * h;
          } else {
            const along = (p[0] * dx + p[2] * dz) / S;
            p[1] += m * along * along;
          }
        };
      },
      // axial: the bend at each height worked out once; flat: no trig per vertex
      prepare(src) {
        const n = src.length / 3;
        const hh = new Float32Array(n);
        if (axial) for (let i = 0; i < n; i++) hh[i] = fromAnchor(src[i * 3 + 1], y0, y1, anchor) ** 2;
        return (ts, s, dst) => {
          const b = motion === 'circle' ? bearing + TAU * speed * ts : bearing;
          const m = a * S * (motion === 'sway' ? swing(speed, ts) : 1);
          const dx = Math.sin(b);
          const dz = -Math.cos(b);
          dst.set(s);
          for (let i = 0, k = 0; i < n; i++, k += 3) {
            if (axial) {
              dst[k] += dx * m * hh[i];
              dst[k + 2] += dz * m * hh[i];
            } else {
              const along = (s[k] * dx + s[k + 2] * dz) / S;
              dst[k + 1] += m * along * along;
            }
          }
        };
      }
    };
  }
  if (d.type === 'twist') {
    const angle = num(d.angle, 90) * DEG;
    const speed = rate(d.period);
    if (!angle) return null;
    return {
      moving: speed !== 0,
      reach: 0,
      at(ts) {
        const turn = angle * swing(speed, ts);
        return (p) => {
          const k = axial ? fromAnchor(p[1], y0, y1, anchor) : 1 - Math.min(1, Math.hypot(p[0], p[2]) / S);
          const c = Math.cos(turn * k);
          const s = Math.sin(turn * k);
          // clockwise from above, as bearings run
          const x = p[0] * c - p[2] * s;
          p[2] = p[0] * s + p[2] * c;
          p[0] = x;
        };
      }
    };
  }
  // noise
  const a = num(d.amplitude, 0.05);
  const f = Math.max(1e-6, num(d.base_frequency, 3 / S));
  const octaves = Math.max(1, Math.min(6, Math.round(num(d.num_octaves, 2))));
  // drift in scene units per second, as noise cells per second
  const speed = num(d.drift, 0) * f;
  const seed = Math.round(num(d.seed, 0));
  if (!a) return null;
  return {
    moving: speed !== 0,
    reach: Math.abs(a) * S,
    at(ts) {
      const drift = speed * ts;
      return (p) => {
        const n = a * S * fbm3(p[0] * f + drift, p[1] * f, p[2] * f, octaves, seed);
        if (!axial) {
          p[1] += n;
          return;
        }
        const rho = Math.hypot(p[0], p[2]);
        if (rho < 1e-6) return;
        p[0] += (p[0] / rho) * n;
        p[2] += (p[2] / rho) * n;
      };
    }
  };
}

/**
 * A grid's deformer from its `deform:` list (applied in order); null when
 * nothing deforms.
 * @param {any} list
 * @param {DeformFrame} frame
 * @returns {Deformer | null}
 */
export function makeDeformer(list, frame) {
  const steps = /** @type {DeformStep[]} */ ((Array.isArray(list) ? list : list ? [list] : []).map((d) => deformStep(d, frame)).filter((s) => !!s));
  if (!steps.length) return null;
  return {
    moving: steps.some((s) => s.moving),
    reach: steps.reduce((sum, s) => sum + s.reach, 0),
    warp(x, y, z, t, out) {
      out[0] = x;
      out[1] = y;
      out[2] = z;
      const ts = t / 1000;
      for (const s of steps) s.at(ts)(out);
      return out;
    },
    batch(base) {
      // Still steps at the front never change: worked out once
      const lead = steps.findIndex((s) => s.moving);
      const pre = base.slice();
      const p = [0, 0, 0];
      /** @param {DeformStep[]} list @param {number} ts @param {Float32Array} arr */
      const run = (list, ts, arr) => {
        if (!list.length) return;
        const fns = list.map((s) => s.at(ts));
        for (let k = 0; k < arr.length; k += 3) {
          p[0] = arr[k];
          p[1] = arr[k + 1];
          p[2] = arr[k + 2];
          for (const fn of fns) fn(p);
          arr[k] = p[0];
          arr[k + 1] = p[1];
          arr[k + 2] = p[2];
        }
      };
      run(lead < 0 ? steps : steps.slice(0, lead), 0, pre);
      if (lead < 0) return (_t, dst) => dst.set(pre);
      // the first moving step sees the same input every frame: its batch form when it has one
      const first = steps[lead].prepare?.(pre);
      const rest = steps.slice(first ? lead + 1 : lead);
      return (t, dst) => {
        const ts = t / 1000;
        if (first) first(ts, pre, dst);
        else dst.set(pre);
        run(rest, ts, dst);
      };
    }
  };
}
