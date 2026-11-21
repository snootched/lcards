/**
 * `type: volume`: a see-through cell box (a territory). `shape: sector`
 * spans `radius: [r0, r1]`, bearings `angle: [a0, a1]` and `height: [y0, y1]`
 * round the scene centre; `shape: box` is `size: [w, h, d]` centred on its
 * position; `shape: prism` is an `outline` of `[x, z]` points (any polygon:
 * a territory's border) between `height: [y0, y1]`. Every face is a grid (`cells`: spacing per direction), the edges
 * are fat lines. Far faces draw at `back_opacity` (1 by default: a volume is
 * a wireframe, its far side is not hidden).
 *
 * @module core/astrometrics/objects/volume
 */
import { Group } from 'three';
import { gridFace } from '../grid-mesh-material.js';
import { discGeometry, cylinderGeometry, radialWallGeometry, rectGeometry, polygonGeometry, wallGeometry } from '../surface.js';
import { FatLine } from '../lines.js';
import { bearingXZ } from '../placements.js';
import { built, num, pair, withOpacity, scanTicker, sub, isOn, DEFAULT_COLORS } from './common.js';

const DEG = Math.PI / 180;

/**
 * A prism's outline as [x, z] pairs (at least 3, numbers only); null when it has none.
 * @param {any} v
 * @returns {[number, number][] | null}
 */
export function prismOutline(v) {
  if (!Array.isArray(v)) return null;
  const pts = v.filter((p) => Array.isArray(p) && p.length >= 2 && Number.isFinite(Number(p[0])) && Number.isFinite(Number(p[1])))
    .map((p) => /** @type {[number, number]} */ ([Number(p[0]), Number(p[1])]));
  return pts.length >= 3 ? pts : null;
}

/**
 * @param {any} cfg
 * @param {import('./common.js').BuildContext} ctx
 * @returns {import('./common.js').BuiltObject}
 */
export function buildVolume(cfg, ctx) {
  const node = new Group();
  node.name = `volume:${cfg.id ?? ''}`;
  const out = built(cfg, node);
  const opacity = num(cfg.opacity, 1);
  const base = ctx.color(cfg.color, DEFAULT_COLORS.volume);
  // Faces fainter than the edges unless set
  const faceAlpha = num(sub(cfg.faces).opacity, 0.45);
  const col = withOpacity(base, faceAlpha);
  const colMajor = withOpacity(base, Math.min(1, faceAlpha * 1.8));
  const back = num(cfg.back_opacity, 1);
  const cells = cfg.cells ?? {};
  const width = num(cfg.line_width, 1);
  /** @param {[number, number]} cell @param {any} [extra] */
  const look = (cell, extra = {}) => ({
    pattern: /** @type {const} */ ('both'), cell, color: col, colorMajor: colMajor, widthMinor: width, widthMajor: width,
    back, opacity, additive: cfg.blend === 'add', ...extra
  });
  /** The faces whose t is height (walls): the scan band climbs them */
  /** @type {import('three').Group[]} */
  const walls = [];
  /** @param {import('three').BufferGeometry} geo @param {any} l @param {boolean} [wall] */
  const face = (geo, l, wall = false) => {
    const f = gridFace(geo, l);
    node.add(f);
    out.gridFaces.push(f);
    out.pickMeshes.push(...f.children);
    if (wall) walls.push(f);
  };
  /** @type {number[][]} */
  const edges = [];

  const outline = cfg.shape === 'prism' ? prismOutline(cfg.outline) : null;
  if (cfg.shape === 'prism' && outline) {
    const [y0, y1] = pair(cfg.height, [0, 10]);
    const xs = outline.map((p) => p[0]);
    const zs = outline.map((p) => p[1]);
    const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs));
    const cx = num(cells.width, span / 8);
    const cz = num(cells.depth, span / 8);
    const layer = num(cells.height, (y1 - y0) / 2);
    for (const y of [y0, y1]) face(polygonGeometry(outline, y), look([cx, cz]));
    let s0 = 0;
    outline.forEach((a, i) => {
      const b = outline[(i + 1) % outline.length];
      face(wallGeometry({ a, b, y0, y1, s0 }), look([cx, layer]), true);
      s0 += Math.hypot(b[0] - a[0], b[1] - a[1]);
      for (const y of [y0, y1]) edges.push([a[0], y, a[1], b[0], y, b[1]]);
      edges.push([a[0], y0, a[1], a[0], y1, a[1]]);
    });
    // the label and fly-to aim at the outline's middle
    out.centre = [xs.reduce((p, v) => p + v, 0) / xs.length, (y0 + y1) / 2, zs.reduce((p, v) => p + v, 0) / zs.length];
  } else if (cfg.shape === 'box') {
    const s = Array.isArray(cfg.size) ? cfg.size : [num(cfg.size, 20), num(cfg.size, 20), num(cfg.size, 20)];
    const [w, h, d] = [num(s[0], 20), num(s[1], 20), num(s[2], 20)];
    const cx = num(cells.width, w / 4);
    const cy = num(cells.height, h / 4);
    const cz = num(cells.depth, d / 4);
    // top, bottom (s = x, t = z), front, back (x, y), sides (z, y)
    for (const y of [-h / 2, h / 2]) face(rectGeometry(w, d, (a, b) => [a, y, b]), look([cx, cz]));
    for (const z of [-d / 2, d / 2]) face(rectGeometry(w, h, (a, b) => [a, b, z]), look([cx, cy]), true);
    for (const x of [-w / 2, w / 2]) face(rectGeometry(d, h, (a, b) => [x, b, a]), look([cz, cy]), true);
    const X = [-w / 2, w / 2];
    const Y = [-h / 2, h / 2];
    const Z = [-d / 2, d / 2];
    for (const y of Y) for (const z of Z) edges.push([X[0], y, z, X[1], y, z]);
    for (const x of X) for (const z of Z) edges.push([x, Y[0], z, x, Y[1], z]);
    for (const x of X) for (const y of Y) edges.push([x, y, Z[0], x, y, Z[1]]);
  } else {
    const [r0, r1] = pair(cfg.radius, [50, 100]);
    const [a0, a1] = pair(cfg.angle, [0, 90]);
    const [y0, y1] = pair(cfg.height, [0, 10]);
    const ring = num(cells.ring, (r1 - r0) / 4);
    const step = Math.max(0.5, num(cells.angle, 10));
    const layer = num(cells.layer, (y1 - y0) / 2);
    // Caps: polar rings every `ring`, spokes every `step` degrees
    const polar = { pattern: /** @type {const} */ ('polar'), planePolar: true, spokes: Math.round(360 / step), majorRow: 0, majorCol: 0 };
    for (const y of [y0, y1]) face(discGeometry({ r0, r1, a0, a1, y }), look([ring, ring], polar));
    // Curved walls: arcs every `step` degrees (s = arc), layers every `layer`
    for (const r of [r0, r1]) if (r > 0) face(cylinderGeometry({ radius: r, y0, y1, a0, a1 }), look([r * step * DEG, layer]), true);
    for (const a of [a0, a1]) face(radialWallGeometry({ r0, r1, a, y0, y1 }), look([ring, layer]), true);
    const n = Math.max(8, Math.ceil(Math.abs(a1 - a0) / 2));
    /** @param {number} r @param {number} y */
    const arc = (r, y) => {
      const run = [];
      for (let k = 0; k <= n; k++) {
        const [x, z] = bearingXZ(r, a0 + (k / n) * (a1 - a0));
        run.push(x, y, z);
      }
      return run;
    };
    for (const y of [y0, y1]) for (const r of [r0, r1]) if (r > 0) edges.push(arc(r, y));
    for (const y of [y0, y1]) for (const a of [a0, a1]) {
      const [xa, za] = bearingXZ(r0, a);
      const [xb, zb] = bearingXZ(r1, a);
      edges.push([xa, y, za, xb, y, zb]);
    }
    for (const r of [r0, r1]) for (const a of [a0, a1]) {
      const [x, z] = bearingXZ(r, a);
      edges.push([x, y0, z, x, y1, z]);
    }
    // the volume's middle, for its label and fly-to
    const [mx, mz] = bearingXZ((r0 + r1) / 2, (a0 + a1) / 2);
    out.centre = [mx, (y0 + y1) / 2, mz];
  }
  if (isOn(cfg.edges, true)) {
    const e = sub(cfg.edges);
    const line = new FatLine(edges, { color: e.color !== undefined ? ctx.color(e.color, DEFAULT_COLORS.volume) : base, width: num(e.width, 1.5), opacity: opacity * 0.9, additive: cfg.blend === 'add' });
    node.add(line.object);
    out.lines.push(line);
  }
  // the band climbs the walls (the caps keep their polar grid)
  out.tick = scanTicker(cfg, ctx, walls);
  return out;
}
