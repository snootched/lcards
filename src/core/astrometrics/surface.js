/**
 * Tessellated surfaces with grid coordinates. Every vertex carries `surf`
 * (s, t) in scene units (arc lengths on curved shapes), which the grid
 * material draws lines from. Surfaces are always cut into patches: one huge
 * triangle has too little varying precision across it and every line lands
 * a fraction of a pixel off (the E1 parity test: 31.6 % of pixels wrong on
 * one 32000-unit quad, 0.01 % on the same area in 64 x 64 quads).
 *
 * Directions follow the placement convention: bearing 0 is north (-z),
 * clockwise from above (east = +x).
 *
 * @module core/astrometrics/surface
 */
import { BufferGeometry, BufferAttribute } from 'three';

const DEG = Math.PI / 180;

/**
 * A (nu x nv) patch: fn(u, v) gives [x, y, z, s, t] for u, v in 0..1.
 * @param {number} nu
 * @param {number} nv
 * @param {(u: number, v: number) => number[]} fn
 * @returns {BufferGeometry}
 */
export function surfaceGeometry(nu, nv, fn) {
  nu = Math.max(1, Math.round(nu));
  nv = Math.max(1, Math.round(nv));
  const pos = new Float32Array((nu + 1) * (nv + 1) * 3);
  const surf = new Float32Array((nu + 1) * (nv + 1) * 2);
  let i = 0;
  for (let j = 0; j <= nv; j++) {
    for (let k = 0; k <= nu; k++, i++) {
      const [x, y, z, s, t] = fn(k / nu, j / nv);
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      surf[i * 2] = s;
      surf[i * 2 + 1] = t;
    }
  }
  const index = new (nu * nv * 6 > 65535 ? Uint32Array : Uint16Array)(nu * nv * 6);
  let n = 0;
  for (let j = 0; j < nv; j++) {
    for (let k = 0; k < nu; k++) {
      const a = j * (nu + 1) + k;
      const b = a + 1;
      const c = a + nu + 1;
      const d = c + 1;
      index[n++] = a; index[n++] = c; index[n++] = b;
      index[n++] = b; index[n++] = c; index[n++] = d;
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(pos, 3));
  g.setAttribute('surf', new BufferAttribute(surf, 2));
  g.setIndex(new BufferAttribute(index, 1));
  g.computeBoundingSphere();
  return g;
}

/** Patches across a span: at least `min`, about 1/32 of the object each */
const segs = (/** @type {number} */ min = 32) => Math.max(min, 32);

/**
 * A flat rectangle on y = 0, centred; s = x, t = z.
 * @param {number} width
 * @param {number} depth
 * @param {number} [detail] - patch count multiplier (a deformed grid bends smoothly)
 */
export function planeGeometry(width, depth, detail = 1) {
  const nu = Math.max(8 * detail, Math.min(96, Math.round(32 * Math.max(1, width / depth))));
  const nv = Math.max(8 * detail, Math.min(96, Math.round(32 * Math.max(1, depth / width))));
  return surfaceGeometry(nu, nv, (u, v) => {
    const x = (u - 0.5) * width;
    const z = (v - 0.5) * depth;
    return [x, 0, z, x, z];
  });
}

/**
 * An annulus sector on the plane y = h; s, t = x, z (for the polar pattern).
 * @param {{ r0?: number, r1: number, a0?: number, a1?: number, y?: number, detail?: number }} o - bearings in degrees
 */
export function discGeometry({ r0 = 0, r1, a0 = 0, a1 = 360, y = 0, detail = 1 }) {
  const na = Math.max(8, Math.ceil(Math.abs(a1 - a0) / 3.75));
  const nr = Math.max(4, Math.min(48 * detail, Math.ceil(((r1 - r0) / Math.max(r1, 1e-6)) * segs() * detail)));
  // (bearing runs backwards along u so the front faces up)
  return surfaceGeometry(na, nr, (u, v) => {
    const a = (a1 - u * (a1 - a0)) * DEG;
    const r = r0 + v * (r1 - r0);
    const x = r * Math.sin(a);
    const z = -r * Math.cos(a);
    return [x, y, z, x, z];
  });
}

/**
 * A sphere (or a band of it) of radius R: s = longitude arc times `around`
 * (lon 0 faces +z, east to the right), t = latitude arc.
 * @param {{ radius: number, lat0?: number, lat1?: number, around?: number, detail?: number }} o
 */
export function sphereGeometry({ radius: R, lat0 = -90, lat1 = 90, around = 1, detail = 1 }) {
  const nv = Math.max(8, Math.ceil((Math.abs(lat1 - lat0) / 5.625) * detail));
  // (longitude runs backwards along u so the front faces out)
  return surfaceGeometry(64, nv, (u, v) => {
    const lon = (1 - u) * 2 * Math.PI;
    const lat = (lat0 + v * (lat1 - lat0)) * DEG;
    const c = Math.cos(lat);
    return [R * c * Math.sin(lon), R * Math.sin(lat), R * c * Math.cos(lon), lon * R * around, lat * R];
  });
}

/**
 * A sky dome (upper hemisphere): s = azimuth arc times `around` (azimuth 0 at
 * north, -z, clockwise from above), t = altitude arc.
 * @param {{ radius: number, around?: number, detail?: number }} o
 */
export function domeGeometry({ radius: R, around = 1, detail = 1 }) {
  return surfaceGeometry(96, 24 * detail, (u, v) => {
    const az = u * 2 * Math.PI;
    const alt = (v * Math.PI) / 2;
    const c = Math.cos(alt);
    return [R * c * Math.sin(az), R * Math.sin(alt), -R * c * Math.cos(az), az * R * around, alt * R];
  });
}

/**
 * An open cylinder round the y axis from y0 to y1 (or part of one between
 * bearings): s = arc round times `around`, t = y.
 * @param {{ radius: number, y0: number, y1: number, a0?: number, a1?: number, around?: number, detail?: number }} o
 */
export function cylinderGeometry({ radius: R, y0, y1, a0 = 0, a1 = 360, around = 1, detail = 1 }) {
  const na = Math.max(8, Math.ceil(Math.abs(a1 - a0) / 3.75));
  // (a deformed cylinder bends along its height: at least 32 rows)
  const nv = Math.max(detail > 1 ? 32 : 2, Math.min(48 * detail, Math.ceil((Math.abs(y1 - y0) / Math.max(R, 1e-6)) * 8 * detail)));
  return surfaceGeometry(na, nv, (u, v) => {
    const a = (a0 + u * (a1 - a0)) * DEG;
    const y = y0 + v * (y1 - y0);
    return [R * Math.sin(a), y, -R * Math.cos(a), a * R * around, y];
  });
}

/**
 * A well (a funnel round the y axis): the rim at y = 0, the bottom at
 * y = -depth. `profile` holds radii at evenly spaced heights from the
 * bottom (index 0) to the rim (`wellProfile()`); s = arc round times
 * `around` at the rim radius, t = arc length up the surface from the
 * bottom, so rings sit evenly along it however steep it is.
 * @param {{ profile: number[], depth: number, around?: number, detail?: number }} o - detail: rows up the surface (32 each)
 */
export function wellGeometry({ profile, depth, around = 1, detail = 1 }) {
  const n = profile.length - 1;
  const rim = profile[n];
  const dy = depth / n;
  const arc = [0];
  for (let i = 1; i <= n; i++) arc.push(arc[i - 1] + Math.hypot(dy, profile[i] - profile[i - 1]));
  /** @param {number} v - 0 bottom, 1 rim */
  const at = (v) => {
    const x = v * n;
    const k = Math.min(n - 1, Math.floor(x));
    const f = x - k;
    return [profile[k] + (profile[k + 1] - profile[k]) * f, arc[k] + (arc[k + 1] - arc[k]) * f];
  };
  return surfaceGeometry(96, Math.max(8, Math.min(n, 32 * detail)), (u, v) => {
    const a = u * 2 * Math.PI;
    const [r, t] = at(v);
    return [r * Math.sin(a), -depth + v * depth, -r * Math.cos(a), a * rim * around, t];
  });
}

/**
 * A vertical radial wall at one bearing, from r0 to r1 and y0 to y1:
 * s = r, t = y.
 * @param {{ r0: number, r1: number, a: number, y0: number, y1: number }} o
 */
export function radialWallGeometry({ r0, r1, a, y0, y1 }) {
  const sx = Math.sin(a * DEG);
  const sz = -Math.cos(a * DEG);
  return surfaceGeometry(16, 8, (u, v) => {
    const r = r0 + u * (r1 - r0);
    const y = y0 + v * (y1 - y0);
    return [r * sx, y, r * sz, r, y];
  });
}

/**
 * A rectangle in a vertical or horizontal plane for box faces.
 * fn maps (s, t) in scene units to xyz.
 * @param {number} sw - extent along s
 * @param {number} tw - extent along t
 * @param {(s: number, t: number) => number[]} fn
 */
export function rectGeometry(sw, tw, fn) {
  const nu = Math.max(4, Math.min(64, Math.round(16 * Math.max(1, sw / Math.max(tw, 1e-6)))));
  const nv = Math.max(4, Math.min(64, Math.round(16 * Math.max(1, tw / Math.max(sw, 1e-6)))));
  return surfaceGeometry(nu, nv, (u, v) => {
    const s = (u - 0.5) * sw;
    const t = (v - 0.5) * tw;
    return [...fn(s, t), s, t];
  });
}

/**
 * How much to scale the arc coordinate round a closed curve so a whole
 * number of cells fits (no seam): circumference / cells.
 * @param {number} radius
 * @param {number} cell - wanted spacing (scene units)
 * @returns {number} scale for s
 */
export function aroundScale(radius, cell) {
  if (!(cell > 0) || !(radius > 0)) return 1;
  const circ = 2 * Math.PI * radius;
  const n = Math.max(1, Math.round(circ / cell));
  return (n * cell) / circ;
}
