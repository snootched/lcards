/**
 * Curved grid surfaces (`surface: cylinder | dome | sphere`): the sizes,
 * the wrap snapping and the camera, as pure functions shared by the WebGL
 * grid scene and the tests. World units are px at the surface's front point
 * when `camera_distance` is 1, as on the plane.
 *
 * Surface coordinates are arc lengths: `around` (angle x radius) and `along`
 * (height on a cylinder, latitude x radius on a dome or sphere). At the front
 * the grid reads like the flat grid: on a vertical cylinder `around` is the
 * screen's x, on a horizontal one its y (so `scroll_speed_x` spins a vertical
 * cylinder and `scroll_speed_y` rolls a horizontal one).
 *
 * @module core/packs/backgrounds/effects/grid-surface-model
 */

/** @type {Record<string, number>} shader ids */
export const SURFACES = { plane: 0, cylinder: 1, dome: 2, sphere: 3 };

/**
 * Size of a curved surface on a w x h card.
 * @param {Record<string, any>} p - effect params
 * @param {number} w
 * @param {number} h
 * @returns {{ radius: number, halfLength: number, extent: number }} halfLength 0 = unbounded;
 *   extent: the card's size along the axis on screen (scan range when unbounded)
 */
export function surfaceSize(p, w, h) {
  const radius = Math.max(1, (clamp(p.surface_size ?? 0.8, 0.05, 4) * Math.min(w, h)) / 2);
  const horizontal = p.surface_axis === 'horizontal';
  const extent = horizontal ? w : h;
  const len = Math.max(0, p.surface_length ?? 1);
  return { radius, halfLength: (len * extent) / 2, extent };
}

/**
 * Stretch the `around` coordinate so a whole number of pattern periods goes
 * round (no seam where the angle wraps).
 * @param {number} radius
 * @param {number} period - the pattern's period along `around`, world units
 * @returns {{ count: number, scale: number }} periods round, and the factor on angle x radius
 */
export function wrapAround(radius, period) {
  const c = 2 * Math.PI * radius;
  if (!(period > 0)) return { count: 0, scale: 1 };
  const count = Math.max(1, Math.round(c / period));
  return { count, scale: (count * period) / c };
}

/**
 * The world-to-surface rotation: the surface's own frame has its axis on y
 * and its front (where `around` is 0) toward +z, the camera at yaw 0.
 * @param {string} surface
 * @param {string} axis - 'vertical' | 'horizontal'
 * @returns {number[]} 3 x 3, row-major: local = M * world
 */
export function surfaceFrame(surface, axis) {
  if (axis !== 'horizontal' || surface === 'sphere') return [1, 0, 0, 0, 1, 0, 0, 0, 1];
  // Cylinder: the axis lies across the card (world x)
  if (surface === 'cylinder') return [0, -1, 0, 1, 0, 0, 0, 0, 1];
  // Dome: faces the camera (axis world z), the pole at the front
  return [1, 0, 0, 0, 0, 1, 0, -1, 0];
}

/** Default camera tilt on a curved surface, by side */
export const CURVED_TILT = { outside: 15, inside: 0 };

/**
 * Where the camera sits for a curved surface, and how it is turned.
 * Outside: it orbits the centre, `distance` (px) from the front point, at
 * `tilt` degrees above the equator and `yaw` round the axis. Inside: on the
 * centre, pitched up by `tilt` and turned by `yaw` (yaw 0 looks down a
 * horizontal cylinder), slid back along the view by (zoom - 1) x radius.
 * @param {{ side: string, surface: string, axis: string, tilt: number, yaw: number, zoom: number, radius: number, distance: number }} c
 * @returns {{ position: [number, number, number], rotateX: number, rotateY: number, depth: number }}
 *   rotations in degrees for the YXZ-ordered camera; depth: view distance to the centre
 */
export function curvedCamera({ side, surface, axis, tilt, yaw, zoom, radius, distance }) {
  const rad = Math.PI / 180;
  if (side === 'inside') {
    const heading = yaw + (surface === 'cylinder' && axis === 'horizontal' ? 90 : 0);
    // three's camera looks down -z: turned by heading, pitched by tilt
    const ct = Math.cos(tilt * rad);
    const fwd = [-Math.sin(heading * rad) * ct, Math.sin(tilt * rad), -Math.cos(heading * rad) * ct];
    const back = (zoom - 1) * radius;
    return {
      position: [-fwd[0] * back, -fwd[1] * back, -fwd[2] * back],
      rotateX: tilt,
      rotateY: heading,
      depth: Math.max(0, back)
    };
  }
  const d = radius + distance;
  const tr = tilt * rad;
  const yr = yaw * rad;
  return {
    position: [d * Math.cos(tr) * Math.sin(yr), d * Math.sin(tr), d * Math.cos(tr) * Math.cos(yr)],
    rotateX: -tilt,
    rotateY: yaw,
    depth: d
  };
}

/** @param {number} v @param {number} lo @param {number} hi */
function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, Number(v)));
}
