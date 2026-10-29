/**
 * Line objects: `ring` (a circle or ellipse round a point: orbits, rims;
 * with `image`, a flat textured band, Saturn's rings),
 * `path` (a line through points, or an arched route between two; a
 * `sky: sun | moon` path is the body's track across today, split where it
 * goes below the horizon), `beam` (a glowing straight line) and `trail`
 * (where a moving point has been, fading to its tail). Widths and
 * dashes are CSS px. Ends on moving points (a spinning planet, the sky) are
 * re-read every frame.
 *
 * @module core/astrometrics/objects/lines
 */
import { Group, Vector3, BufferGeometry, Float32BufferAttribute, Mesh, MeshBasicMaterial, DoubleSide, SRGBColorSpace } from 'three';
import { FatLine } from '../lines.js';
import { altazToLocal } from '../placements.js';
import { dayPath } from '../sky.js';
import { built, num, pair, DEFAULT_COLORS } from './common.js';

const DEG = Math.PI / 180;

/**
 * An ellipse in a plane tilted by `inclination` (about the line of nodes)
 * and turned to `node` (a bearing), as a flat closed polyline round the origin.
 * @param {{ a: number, b?: number, inclination?: number, node?: number, n?: number, from?: number, to?: number }} o - from / to: part of the ring, degrees
 */
export function ellipseRun({ a, b = a, inclination = 0, node = 0, n = 256, from = 0, to = 360 }) {
  const ci = Math.cos(inclination * DEG);
  const si = Math.sin(inclination * DEG);
  const cn = Math.cos(node * DEG);
  const sn = Math.sin(node * DEG);
  const out = [];
  const steps = Math.max(8, Math.ceil((n * Math.abs(to - from)) / 360));
  for (let i = 0; i <= steps; i++) {
    const t = (from + ((to - from) * i) / steps) * DEG;
    // in the ring's own plane: x along the line of nodes, z across
    const x = a * Math.sin(t);
    const z0 = -b * Math.cos(t);
    const y = -z0 * si;
    const z = z0 * ci;
    // turn the line of nodes to its bearing (clockwise from above)
    out.push(x * cn - z * sn, y, x * sn + z * cn);
  }
  return out;
}

/** Segments of a ring drawn whole (`ellipseRun`'s default) */
const RING_SEGMENTS = 256;
/** Most segments in a ring's refined window */
const RING_FINE_MAX = 2048;

/**
 * Where a ring needs finer segments for this view: a ring at true scale (an
 * orbit of 150 million km) drawn in 256 segments misses its planet by
 * thousands of km between vertices, which shows from close by. Returns the
 * window round the bearing nearest the camera, degrees, and its step; null
 * when the whole ring at 256 segments is within half a pixel everywhere.
 * @param {{ a: number, b?: number, inclination?: number, node?: number, from?: number, to?: number }} o
 * @param {[number, number, number]} cam - the camera in the ring's own space
 * @param {number} pxPerDist - size of a pixel per unit of distance from the camera (perspective)
 *   or `pxFlat` for an orthographic camera (a pixel's size anywhere)
 * @param {number} [pxFlat]
 * @returns {{ center: number, half: number, step: number } | null}
 */
export function ringWindow(o, cam, pxPerDist, pxFlat) {
  const { a, b = a, inclination = 0, node = 0, from = 0, to = 360 } = o;
  const r = Math.max(a, b);
  const coarse = (Math.abs(to - from) * DEG) / Math.ceil((RING_SEGMENTS * Math.abs(to - from)) / 360);
  // gap between the chord and the curve at the coarse step
  const sag = (r * coarse * coarse) / 8;
  // the camera's bearing on the ring (exact for a circle; near enough for an ellipse)
  const ci = Math.cos(inclination * DEG), si = Math.sin(inclination * DEG);
  const cn = Math.cos(node * DEG), sn = Math.sin(node * DEG);
  const x = cam[0] * cn + cam[2] * sn;
  const z = -cam[0] * sn + cam[2] * cn;
  const z0 = z * ci - cam[1] * si;
  const t = Math.atan2(x / a, -z0 / b);
  const p = [a * Math.sin(t), b * Math.cos(t) * si, -b * Math.cos(t) * ci];
  /** @param {number} ln */
  const px = (ln) => (pxFlat !== undefined ? pxFlat : ln * pxPerDist);
  // distance from the camera to the ring there (the nearest stretch)
  const near = Math.max(Math.hypot(x - p[0], cam[1] - p[1], z - p[2]), r * 1e-9);
  if (sag < 0.5 * px(near)) return null;
  // fine step: under a quarter pixel at the nearest point
  let step = Math.sqrt((8 * 0.25 * px(near)) / r);
  // the window: as far round as the coarse ring would still show its corners
  const reach = pxFlat !== undefined ? Math.PI * r : sag / (0.5 * pxPerDist);
  const half = Math.min(Math.PI, reach / r);
  if ((2 * half) / step > RING_FINE_MAX) step = (2 * half) / RING_FINE_MAX;
  return { center: t / DEG, half: half / DEG, step: step / DEG };
}

/**
 * A ring's runs for a refined window: fine inside it, the usual steps outside.
 * @param {{ a: number, b?: number, inclination?: number, node?: number, from?: number, to?: number }} o
 * @param {{ center: number, half: number, step: number }} w
 * @returns {number[][]}
 */
export function refinedRuns(o, w) {
  const from = o.from ?? 0, to = o.to ?? 360;
  const full = Math.abs(to - from) >= 360;
  // the window's centre moved into [from, to)
  let c = w.center;
  while (c < from) c += 360;
  while (c >= from + 360) c -= 360;
  const lo = full ? c - w.half : Math.max(from, c - w.half);
  const hi = full ? c + w.half : Math.min(to, c + w.half);
  if (!(hi > lo)) return [ellipseRun(o)];
  // ellipseRun's n is per full turn
  const runs = [ellipseRun({ ...o, from: lo, to: hi, n: 360 / w.step })];
  /** @param {number} f @param {number} t */
  const coarse = (f, t) => { if (t - f > 1e-9) runs.push(ellipseRun({ ...o, from: f, to: t })); };
  if (full) coarse(hi, lo + 360);
  else {
    coarse(from, lo);
    coarse(hi, to);
  }
  return runs;
}

/**
 * The px-width line style of a line object.
 * @param {any} cfg
 * @param {import('./common.js').BuildContext} ctx
 * @param {string} fallback
 * @returns {import('../lines.js').LineStyle}
 */
function lineStyle(cfg, ctx, fallback) {
  const color = ctx.color(cfg.color, fallback);
  return {
    color,
    colorTo: cfg.color_to !== undefined ? ctx.color(cfg.color_to, fallback) : undefined,
    width: num(cfg.width, 1.5),
    opacity: num(cfg.opacity, 1),
    dash: Array.isArray(cfg.dash) ? cfg.dash.map(Number) : null,
    additive: cfg.blend === 'add'
  };
}

/**
 * A line plus its optional glow (a wide faint additive line under it).
 * @param {import('./common.js').BuiltObject} out
 * @param {any} cfg
 * @param {import('../lines.js').LineStyle} style
 */
function addLine(out, cfg, style) {
  /** @type {FatLine[]} */
  const made = [];
  if (cfg.glow) {
    const k = typeof cfg.glow === 'number' ? Math.max(1, cfg.glow) : 4;
    const glow = new FatLine([], { ...style, colorTo: style.colorTo, width: (style.width ?? 1.5) * k, opacity: (style.opacity ?? 1) * 0.22, dash: null, additive: true });
    glow.object.renderOrder = 2.5;
    made.push(glow);
  }
  const main = new FatLine([], style);
  made.push(main);
  for (const l of made) {
    out.node.add(l.object);
    out.lines.push(l);
  }
  return made;
}

/** `pulse: true` defaults: length and gap in px along the line, speed in px per second */
const PULSE = { length: 14, gap: 90, speed: 80 };

/**
 * `pulse`: bright dashes travelling along the line (the `flow` background
 * preset's streaks), an additive dashed line over it.
 * @param {import('./common.js').BuiltObject} out
 * @param {any} cfg
 * @param {import('./common.js').BuildContext} ctx
 * @param {number} width - the line's width, px
 * @returns {FatLine | null}
 */
function addPulse(out, cfg, ctx, width) {
  if (!cfg.pulse) return null;
  const p = cfg.pulse === true ? {} : cfg.pulse;
  const line = new FatLine([], {
    color: ctx.color(p.color, DEFAULT_COLORS.pulse),
    width: num(p.width, width + 1),
    opacity: num(cfg.opacity, 1),
    dash: [Math.max(0.5, num(p.length, PULSE.length)), Math.max(0, num(p.gap, PULSE.gap))],
    additive: true
  });
  line.object.renderOrder = 3.5;
  out.node.add(line.object);
  out.lines.push(line);
  return line;
}

/**
 * Dashes and pulses moving along the line at `flow_speed` px per second
 * (a pulse alone moves at 80); null when nothing moves.
 * @param {any} cfg
 * @param {FatLine[]} lines
 * @returns {((dt: number, t: number) => boolean) | null}
 */
export function flowTicker(cfg, lines) {
  const speed = num(cfg.flow_speed, cfg.pulse ? num(cfg.pulse?.speed, PULSE.speed) : 0);
  const moving = lines.filter((l) => l.dashed);
  if (!speed || !moving.length) return null;
  return (_dt, t) => {
    for (const l of moving) l.setFlow((speed * t) / 1000);
    return true;
  };
}

/**
 * @param {any} cfg
 * @param {import('./common.js').BuildContext} ctx
 * @returns {import('./common.js').BuiltObject}
 */
export function buildRing(cfg, ctx) {
  const node = new Group();
  node.name = `ring:${cfg.id ?? ''}`;
  const out = built(cfg, node);
  const [a, b] = pair(cfg.radius, [100, 100]);
  const [from, to] = Array.isArray(cfg.arc) ? pair(cfg.arc, [0, 360]) : [0, 360];
  const run = ellipseRun({ a, b, inclination: num(cfg.inclination, 0), node: num(cfg.node, 0), from, to });
  if (cfg.image) addBand(out, cfg, ctx, { a, b, from, to });
  // a textured band draws its line only when a width is set
  const style = lineStyle(cfg, ctx, DEFAULT_COLORS.line);
  const lines = cfg.image && cfg.width === undefined ? [] : addLine(out, cfg, style);
  const pulse = addPulse(out, cfg, ctx, style.width ?? 1.5);
  if (pulse) lines.push(pulse);
  for (const l of lines) l.setRuns([run]);
  out.tick = flowTicker(cfg, lines);
  out.radius = Math.max(a, b);
  // Close to a ring at true scale: finer segments round the nearest bearing
  if (lines.length) {
    const shape = { a, b, inclination: num(cfg.inclination, 0), node: num(cfg.node, 0), from, to };
    /** @type {{ center: number, half: number, step: number } | null} */
    let shown = null;
    const cam = new Vector3();
    out.lod = ({ camera, height }) => {
      cam.setFromMatrixPosition(camera.matrixWorld);
      node.worldToLocal(cam);
      // the ring's own units per world unit (an `at` group never scales; the node might)
      const k = 1 / new Vector3().setFromMatrixScale(node.matrixWorld).x;
      const c = /** @type {any} */ (camera);
      const pxPerDist = c.isPerspectiveCamera ? (2 * Math.tan((c.fov * DEG) / 2)) / Math.max(1, height) : 0;
      const pxFlat = c.isOrthographicCamera ? ((c.top - c.bottom) / c.zoom / Math.max(1, height)) * k : undefined;
      const w = ringWindow(shape, [cam.x, cam.y, cam.z], pxPerDist, pxFlat);
      // rebuild only when the window moves or its step changes a fair bit
      const same = w && shown
        ? Math.abs(w.center - shown.center) < shown.step * 8 && Math.abs(Math.log(w.step / shown.step)) < 0.3 && Math.abs(Math.log(w.half / shown.half)) < 0.3
        : w === shown;
      if (same) return;
      shown = w;
      const runs = w ? refinedRuns(shape, w) : [run];
      for (const l of lines) l.setRuns(runs);
    };
  }
  // (centred on its `at`, as every object)
  return out;
}

/**
 * A ring's `image` band: a flat strip from `inner_radius` out to the ring,
 * in the ring's plane, the texture's u running across it (inner rim 0,
 * outer 1). Drawn after solid bodies, so a planet in its middle hides the
 * far side and the near side passes in front.
 * @param {import('./common.js').BuiltObject} out
 * @param {any} cfg
 * @param {import('./common.js').BuildContext} ctx
 * @param {{ a: number, b: number, from: number, to: number }} o
 */
function addBand(out, cfg, ctx, { a, b, from, to }) {
  const [ia, ib] = pair(cfg.inner_radius, [a / 2, (a / 2) * (b / a)]);
  const shape = { inclination: num(cfg.inclination, 0), node: num(cfg.node, 0), from, to };
  const outer = ellipseRun({ a, b, ...shape });
  const inner = ellipseRun({ a: ia, b: ib, ...shape });
  const n = outer.length / 3;
  const pos = new Float32Array(n * 6);
  const uv = new Float32Array(n * 4);
  /** @type {number[]} */
  const index = [];
  for (let i = 0; i < n; i++) {
    pos.set(inner.slice(i * 3, i * 3 + 3), i * 6);
    pos.set(outer.slice(i * 3, i * 3 + 3), i * 6 + 3);
    const v = i / Math.max(1, n - 1);
    uv.set([0, v, 1, v], i * 4);
    if (i < n - 1) {
      const k = i * 2;
      index.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  geo.setIndex(index);
  const mat = new MeshBasicMaterial({ transparent: true, depthWrite: false, side: DoubleSide, opacity: num(cfg.image_opacity, 1) * num(cfg.opacity, 1) });
  mat.map = ctx.loadTexture(String(cfg.image));
  if (mat.map) mat.map.colorSpace = SRGBColorSpace;
  if (cfg.image_color !== undefined) {
    const c = ctx.color(cfg.image_color, '#ffffff');
    mat.color.setRGB(c[0], c[1], c[2], SRGBColorSpace);
  }
  const mesh = new Mesh(geo, mat);
  mesh.renderOrder = 1;
  out.node.add(mesh);
  out.pickMeshes.push(mesh);
}

/**
 * Points of a two-ended arched route: a sine bump of height `arc` (scene
 * units, upward) between a and b.
 * @param {Vector3} a
 * @param {Vector3} b
 * @param {number} arc
 * @param {number} [n]
 */
export function arcRun(a, b, arc, n = 32) {
  const out = [];
  const steps = arc ? n : 1;
  for (let k = 0; k <= steps; k++) {
    const t = k / steps;
    out.push(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t + Math.sin(t * Math.PI) * arc, a.z + (b.z - a.z) * t);
  }
  return out;
}

/**
 * Split a sky track into runs above the horizon (on a dome of radius R).
 * @param {{ azimuth: number, altitude: number }[]} track
 * @param {number} R
 * @returns {number[][]}
 */
export function skyRuns(track, R) {
  /** @type {number[][]} */
  const runs = [];
  /** @type {number[] | null} */
  let cur = null;
  const v = new Vector3();
  for (let i = 0; i < track.length; i++) {
    const p = track[i];
    if (p.altitude < 0) {
      // close the run on the horizon, where it crossed
      if (cur && i > 0) {
        const q = track[i - 1];
        const f = q.altitude / (q.altitude - p.altitude);
        altazToLocal(q.azimuth + shortDelta(q.azimuth, p.azimuth) * f, 0, R, v);
        cur.push(v.x, v.y, v.z);
      }
      cur = null;
      continue;
    }
    if (!cur) {
      cur = [];
      runs.push(cur);
      if (i > 0) {
        const q = track[i - 1];
        const f = q.altitude / (q.altitude - p.altitude);
        altazToLocal(q.azimuth + shortDelta(q.azimuth, p.azimuth) * f, 0, R, v);
        cur.push(v.x, v.y, v.z);
      }
    }
    altazToLocal(p.azimuth, p.altitude, R, v);
    cur.push(v.x, v.y, v.z);
  }
  return runs.filter((r) => r.length >= 6);
}

/** @param {number} a @param {number} b */
/**
 * Runs through world positions as the node draws them: local to its parent
 * (its object's group, inside its frame's) and relative to an anchor the
 * node moves to, so a line far from the origin (a route from Earth to a
 * station, in km) keeps its precision on the GPU.
 * @param {import('three').Object3D} node
 * @param {number[][]} runs - world [x, y, z, ...]
 * @param {number[] | null} [anchor] - world [x, y, z]; default the first point
 * @returns {number[][]}
 */
export function anchoredRuns(node, runs, anchor = null) {
  const parent = node.parent;
  const first = anchor ?? runs.find((r) => r.length >= 3) ?? null;
  if (!parent || !first) {
    node.position.set(0, 0, 0);
    return runs;
  }
  const inv = parent.matrixWorld.clone().invert();
  const v = new Vector3();
  const o = new Vector3(first[0], first[1], first[2]).applyMatrix4(inv);
  node.position.copy(o);
  return runs.map((run) => {
    const out = new Array(run.length);
    for (let i = 0; i + 2 < run.length; i += 3) {
      v.set(run[i], run[i + 1], run[i + 2]).applyMatrix4(inv).sub(o);
      out[i] = v.x;
      out[i + 1] = v.y;
      out[i + 2] = v.z;
    }
    return out;
  });
}

const shortDelta = (a, b) => ((((b - a) % 360) + 540) % 360) - 180;

/**
 * @param {any} cfg
 * @param {import('./common.js').BuildContext} ctx
 * @param {Map<string, import('./common.js').BuiltObject>} objects - for `object` (the sky dome)
 * @returns {import('./common.js').BuiltObject}
 */
export function buildPath(cfg, ctx, objects) {
  const node = new Group();
  node.name = `path:${cfg.id ?? ''}`;
  const out = built(cfg, node);
  const style = lineStyle(cfg, ctx, DEFAULT_COLORS.path);
  const lines = addLine(out, cfg, style);
  const pulse = addPulse(out, cfg, ctx, style.width ?? 1.5);
  if (pulse) lines.push(pulse);
  out.tick = flowTicker(cfg, lines);
  /** @param {number[][]} runs */
  const set = (runs) => lines.forEach((l) => l.setRuns(runs));
  if (cfg.sky === 'sun' || cfg.sky === 'moon') {
    // A day's track on the dome `object`, local to it
    let dayKey = '';
    out.update = () => {
      const dome = cfg.object ? objects.get(cfg.object) : undefined;
      const sky = ctx.sky();
      if (!sky) return;
      const day = new Date(sky.time).toDateString();
      const key = `${day}|${sky.location.latitude}|${sky.location.longitude}`;
      if (key === dayKey) return;
      dayKey = key;
      const R = (dome?.radius ?? 100) + num(cfg.alt, 0);
      set(skyRuns(dayPath(cfg.sky, sky.location.latitude, sky.location.longitude, sky.time), R));
      if (dome) {
        dome.node.updateMatrixWorld();
        node.matrixAutoUpdate = false;
        node.matrix.copy(dome.node.matrixWorld);
        node.matrixWorldNeedsUpdate = true;
      }
    };
    out.dynamic = true;
    return out;
  }
  const refs = Array.isArray(cfg.points) ? cfg.points : [cfg.from, cfg.to].filter((r) => r !== undefined);
  const arc = num(cfg.arc, 0);
  out.update = () => {
    const pts = refs.map((r) => ctx.places?.resolve(r) ?? null).filter((p) => !!p);
    if (pts.length < 2) { set([]); return; }
    /** @type {number[]} */
    const run = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const leg = arcRun(/** @type {Vector3} */ (pts[i]), /** @type {Vector3} */ (pts[i + 1]), arc);
      run.push(...(i === 0 ? leg : leg.slice(3)));
    }
    set(anchoredRuns(node, [run]));
  };
  out.dynamic = refs.some((r) => !!ctx.places?.isDynamic(r));
  return out;
}

/**
 * @param {any} cfg
 * @param {import('./common.js').BuildContext} ctx
 * @returns {import('./common.js').BuiltObject}
 */
export function buildBeam(cfg, ctx) {
  const node = new Group();
  node.name = `beam:${cfg.id ?? ''}`;
  const out = built(cfg, node);
  const color = ctx.color(cfg.color, DEFAULT_COLORS.line);
  const width = num(cfg.width, 12);
  const opacity = num(cfg.opacity, 1);
  // wide faint, medium, thin bright core
  const layers = [[width, 0.12], [width * 0.4, 0.25], [Math.min(1.5, width), 0.9]];
  /** @type {FatLine[]} */
  const lines = layers.map(([w, a]) => new FatLine([], { color, width: w, opacity: opacity * a, additive: true }));
  for (const l of lines) {
    node.add(l.object);
    out.lines.push(l);
  }
  const pulse = addPulse(out, cfg, ctx, Math.min(1.5, width) * 2);
  if (pulse) lines.push(pulse);
  out.tick = flowTicker(cfg, lines);
  out.update = () => {
    const a = ctx.places?.resolve(cfg.from);
    const b = ctx.places?.resolve(cfg.to);
    const run = a && b ? anchoredRuns(node, [[a.x, a.y, a.z, b.x, b.y, b.z]]) : [];
    lines.forEach((l) => l.setRuns(run));
  };
  out.dynamic = !!(ctx.places?.isDynamic(cfg.from) || ctx.places?.isDynamic(cfg.to));
  return out;
}

/** Most samples a trail keeps (older ones are thinned out) */
export const TRAIL_SAMPLES = 256;

/**
 * Where a point has been: samples at least `length / TRAIL_SAMPLES` apart,
 * the newest last, plus the head (where the point is now). Samples older than
 * `length` drop off, the oldest sliding toward the next so the tail shrinks
 * smoothly. Pure (the caller passes the time), so it is tested without a clock.
 */
export class TrailHistory {
  /** @param {number} lengthMs - how long the trail is, ms */
  constructor(lengthMs) {
    this.length = Math.max(1, lengthMs);
    this.step = this.length / TRAIL_SAMPLES;
    /** @type {{ t: number, p: number[] }[]} */
    this.samples = [];
    /** @type {number[] | null} */
    this.head = null;
  }

  /**
   * The point's position now.
   * @param {number} t - ms
   * @param {number[]} p - [x, y, z]
   */
  push(t, p) {
    this.head = [...p];
    const last = this.samples[this.samples.length - 1];
    if (!last || t - last.t >= this.step) this.samples.push({ t, p: [...p] });
    this.age(t);
  }

  /** Drop samples older than the trail's length (the newest stays) @param {number} t */
  age(t) {
    const s = this.samples;
    const from = t - this.length;
    while (s.length > 1 && s[1].t <= from) s.shift();
    if (s.length > 1 && s[0].t < from) {
      const [a, b] = s;
      const k = (from - a.t) / (b.t - a.t);
      a.p = a.p.map((v, i) => v + (b.p[i] - v) * k);
      a.t = from;
    }
  }

  /** Whether there is a line to draw (the point has moved within the length) */
  get moving() {
    return this.run().length >= 6;
  }

  /** The run, oldest to newest, the head last (empty when there is no line) */
  run() {
    const pts = this.samples.map((x) => x.p);
    const last = pts[pts.length - 1];
    const h = this.head;
    if (h && last && (h[0] !== last[0] || h[1] !== last[1] || h[2] !== last[2])) pts.push(h);
    // a still point leaves equal samples behind: no line
    const moved = pts.some((q) => q[0] !== pts[0][0] || q[1] !== pts[0][1] || q[2] !== pts[0][2]);
    return pts.length > 1 && moved ? pts.flat() : [];
  }
}

/**
 * `trail`: a line behind a moving point (`point`), `length` seconds long,
 * built while the card is open. `fade_tail` (default) runs it from the colour at
 * the point to black at the tail (the background, in space). Normal blending:
 * added light doubles where the short segments' ends overlap, beading the line.
 * @param {any} cfg
 * @param {import('./common.js').BuildContext} ctx
 * @returns {import('./common.js').BuiltObject}
 */
export function buildTrail(cfg, ctx) {
  const node = new Group();
  node.name = `trail:${cfg.id ?? ''}`;
  const out = built(cfg, node);
  const style = lineStyle(cfg, ctx, DEFAULT_COLORS.path);
  if (cfg.fade_tail !== false) {
    // runs go oldest to newest: from black to the colour
    style.colorTo = style.color;
    style.color = [0, 0, 0, style.color[3] ?? 1];
  }
  // no glow: a wide additive line beads where its many short segments overlap
  const lines = addLine(out, { ...cfg, glow: false }, style);
  const history = new TrailHistory(num(cfg.length, 10) * 1000);
  const flow = flowTicker(cfg, lines);
  // frames keep coming while the tail has somewhere to shrink to
  out.tick = (dt, t) => {
    const f = flow ? flow(dt, t) : false;
    return history.moving || f;
  };
  out.update = () => {
    const p = ctx.places?.resolve(cfg.point);
    const now = performance.now();
    // kept local to the trail's group (its frame's units), so a frame change leaves the history as it is
    if (p) {
      const q = node.parent ? node.parent.worldToLocal(p.clone()) : p;
      history.push(now, [q.x, q.y, q.z]);
    } else history.age(now);
    const run = history.run();
    // drawn relative to the head, where the eye is (precise near the moving point)
    const h = history.head;
    if (h) node.position.set(h[0], h[1], h[2]);
    const local = h ? run.map((v, i) => v - h[i % 3]) : run;
    lines.forEach((l) => l.setRuns(local.length ? [local] : []));
  };
  out.dynamic = true;
  return out;
}
