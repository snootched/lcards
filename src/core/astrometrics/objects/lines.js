/**
 * Line objects: `ring` (a circle or ellipse round a point: orbits, rims),
 * `path` (a line through points, or an arched route between two; a
 * `sky: sun | moon` path is the body's track across today, split where it
 * goes below the horizon), and `beam` (a glowing straight line). Widths and
 * dashes are CSS px. Ends on moving points (a spinning planet, the sky) are
 * re-read every frame.
 *
 * @module core/astrometrics/objects/lines
 */
import { Group, Vector3 } from 'three';
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
  const style = lineStyle(cfg, ctx, DEFAULT_COLORS.line);
  const lines = addLine(out, cfg, style);
  const pulse = addPulse(out, cfg, ctx, style.width ?? 1.5);
  if (pulse) lines.push(pulse);
  for (const l of lines) l.setRuns([run]);
  out.tick = flowTicker(cfg, lines);
  out.radius = Math.max(a, b);
  // (centred on its `at`, as every object)
  return out;
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
    set([run]);
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
    const run = a && b ? [[a.x, a.y, a.z, b.x, b.y, b.z]] : [];
    lines.forEach((l) => l.setRuns(run));
  };
  out.dynamic = !!(ctx.places?.isDynamic(cfg.from) || ctx.places?.isDynamic(cfg.to));
  return out;
}
