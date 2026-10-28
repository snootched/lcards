/**
 * Curved grid surfaces (`surface: cylinder | dome | sphere | well`): the sizes,
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
 * The well is a surface of revolution round its axis: a radius for every
 * height, from the bottom (y = 0) to the rim (y = depth), given by a named
 * shape or by control diameters (`wellProfile`). The shader draws it as
 * WELL_SEGMENTS stacked cone slices, each with an exact ray hit. Its `along`
 * is the arc length up the surface from the bottom (`wellArc`), so the rings
 * are evenly spaced on the surface whatever its slope.
 *
 * @module core/packs/backgrounds/effects/grid-surface-model
 */

/** @type {Record<string, number>} shader ids */
export const SURFACES = { plane: 0, cylinder: 1, dome: 2, sphere: 3, well: 4 };

/** A well's shortest depth, as a fraction of the card along its axis (a well must end) */
export const WELL_MIN_DEPTH = 0.1;

/** Cone slices a well is drawn with (the shader's loop count) */
export const WELL_SEGMENTS = 64;

/** Named well shapes: radius (fraction of the rim) at height h (0 bottom, 1 rim), throat a */
export const WELL_SHAPES = {
  // The gravity well: r ~ 1 / depth, nearly flat at the rim, plunging to the throat
  trumpet: (/** @type {number} */ h, /** @type {number} */ a) => 1 / (1 / a - h * (1 / a - 1)),
  cone: (/** @type {number} */ h, /** @type {number} */ a) => a + (1 - a) * h,
  // A paraboloid: round at the bottom
  bowl: (/** @type {number} */ h, /** @type {number} */ a) => Math.sqrt(a * a + (1 - a * a) * h),
  // Two trumpets throat to throat (an hourglass): the throat halfway down
  wormhole: (/** @type {number} */ h, /** @type {number} */ a) => WELL_SHAPES.trumpet(Math.abs(2 * h - 1), a)
};

/**
 * A well's radius at WELL_SEGMENTS + 1 evenly spaced heights, from the bottom
 * (index 0) to the rim. `well_profile` (diameters as fractions of
 * `surface_size`, rim first, evenly spaced down the depth) is followed by a
 * smooth curve (Catmull-Rom) through every point; otherwise `well_shape`
 * with `well_throat`.
 * @param {Record<string, any>} p - effect params
 * @param {number} radius - the surface radius (half of surface_size)
 * @param {number} [segments]
 * @returns {number[]}
 */
export function wellProfile(p, radius, segments = WELL_SEGMENTS) {
  // well_morph blends toward well_profile_to (0 = this profile, 1 = that one)
  const morph = clamp(p.well_morph ?? 0, 0, 1);
  if (Array.isArray(p.well_profile_to) && morph > 0) {
    const from = wellProfile({ ...p, well_morph: 0 }, radius, segments);
    const to = wellProfile({ ...p, well_profile: p.well_profile_to, well_morph: 0 }, radius, segments);
    return from.map((r, i) => r + (to[i] - r) * morph);
  }
  const out = new Array(segments + 1);
  const pts = Array.isArray(p.well_profile)
    ? p.well_profile.map(Number).filter(Number.isFinite).map((v) => Math.max(0, v)).reverse()
    : null;
  if (pts && pts.length >= 2) {
    const n = pts.length - 1;
    const at = (/** @type {number} */ i) => (i < 0 ? 2 * pts[0] - pts[1] : i > n ? 2 * pts[n] - pts[n - 1] : pts[i]);
    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * n;
      const k = Math.min(n - 1, Math.floor(x));
      const t = x - k;
      const [p0, p1, p2, p3] = [at(k - 1), at(k), at(k + 1), at(k + 2)];
      const v = 0.5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (3 * p1 - p0 - 3 * p2 + p3) * t * t * t);
      out[i] = Math.max(0, v) * radius;
    }
    return out;
  }
  const shape = WELL_SHAPES[/** @type {keyof typeof WELL_SHAPES} */ (p.well_shape)] ?? WELL_SHAPES.trumpet;
  const a = clamp(p.well_throat ?? 0.15, 0.02, 1);
  for (let i = 0; i <= segments; i++) out[i] = Math.min(1, shape(i / segments, a)) * radius;
  return out;
}

/**
 * Size of a curved surface on a w x h card.
 * @param {Record<string, any>} p - effect params
 * @param {number} w
 * @param {number} h
 * @returns {{ radius: number, halfLength: number, extent: number }}
 *   halfLength 0 = unbounded (a well: half its depth);
 *   extent: the card's size along the axis on screen (scan range when unbounded)
 */
export function surfaceSize(p, w, h) {
  const radius = Math.max(1, (clamp(p.surface_size ?? 0.8, 0.05, 4) * Math.min(w, h)) / 2);
  const horizontal = p.surface_axis === 'horizontal';
  const extent = horizontal ? w : h;
  let len = Math.max(0, p.surface_length ?? 1);
  // A well must end
  if (p.surface === 'well') len = Math.max(WELL_MIN_DEPTH, len);
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
  // Dome and well: face the camera (axis world z), the pole or the mouth at the front
  return [1, 0, 0, 0, 0, 1, 0, -1, 0];
}

/** Default camera tilt on a curved surface, by side */
export const CURVED_TILT = { outside: 15, inside: 0 };

/**
 * Default camera tilt for a surface: a well is looked into from higher up.
 * @param {string} surface
 * @param {string} side
 */
export const curvedTilt = (surface, side) => (surface === 'well' ? 35 : CURVED_TILT[side === 'inside' ? 'inside' : 'outside']);

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

/**
 * A well profile with a ripple running along it: each radius scaled by
 * 1 + amplitude x sin(2 pi (waves x h + phase)), h the height (0 bottom,
 * 1 rim). A rising phase moves the waves down toward the bottom.
 * @param {number[]} profile - radii from wellProfile()
 * @param {number} amplitude - fraction of the local radius (0 = none)
 * @param {number} waves - wavelengths along the depth
 * @param {number} phase - cycles
 * @returns {number[]}
 */
export function rippleProfile(profile, amplitude, waves, phase) {
  const n = profile.length - 1;
  return profile.map((r, i) => r * Math.max(0, 1 + amplitude * Math.sin(2 * Math.PI * (waves * (i / n) + phase))));
}

/**
 * A curved surface's own rotation (`surface_rotate_x/y/z`, degrees, about
 * the card's axes at camera_yaw 0: x tips it toward or away from you, y
 * turns it round the vertical, z leans it left or right), applied in that
 * order (three.js Euler 'XYZ').
 * @param {number} rx
 * @param {number} ry
 * @param {number} rz
 * @returns {number[]} 3 x 3, row-major: world = R * surface
 */
export function surfaceRotation(rx, ry, rz) {
  const r = Math.PI / 180;
  const [a, b, c] = [Math.cos(rx * r), Math.cos(ry * r), Math.cos(rz * r)];
  const [d, e, f] = [Math.sin(rx * r), Math.sin(ry * r), Math.sin(rz * r)];
  // Rx * Ry * Rz (three's makeRotationFromEuler, order XYZ)
  return [
    b * c, -b * f, e,
    a * f + d * c * e, a * c - d * e * f, -d * b,
    d * f - a * c * e, d * c + a * e * f, a * b
  ];
}

/**
 * The world-to-surface matrix the shader takes: the axis frame after the
 * surface's own rotation is undone (frame x R^T).
 * @param {number[]} frame - surfaceFrame(), row-major
 * @param {number[]} rotation - surfaceRotation(), row-major
 * @returns {number[]} row-major
 */
export function toSurface(frame, rotation) {
  const out = new Array(9).fill(0);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) out[i * 3 + j] += frame[i * 3 + k] * rotation[j * 3 + k];
  return out;
}

/**
 * Arc length up a well's surface from the bottom at each profile height.
 * @param {number[]} profile - radii from wellProfile()
 * @param {number} depth - world units, bottom to rim
 * @returns {number[]}
 */
export function wellArc(profile, depth) {
  const dy = depth / (profile.length - 1);
  const out = [0];
  for (let i = 1; i < profile.length; i++) out.push(out[i - 1] + Math.hypot(dy, profile[i] - profile[i - 1]));
  return out;
}

/** @param {number} v @param {number} lo @param {number} hi */
function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, Number(v)));
}
