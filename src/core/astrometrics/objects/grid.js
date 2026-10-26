/**
 * `type: grid`: a grid surface, `shape: plane | disc | dome | sphere | cylinder`,
 * styled with the background `grid` effect's keys (`pattern`, `line_spacing`,
 * `major_*_interval`, `line_width*`, `color*`, `fill_color`, `spoke_count`,
 * `back_opacity`) in scene units. Curved shapes take `line_spacing_deg`
 * (rings and meridians every N degrees) and always fit a whole number of
 * cells round (no seam).
 *
 * Extras: `border` (fat lines on the open edges, on by default),
 * `ring_labels` (bearing labels round a disc or dome), and on a plane
 * `axis_labels` + `cells` (a lettered sector map: column letters, row
 * numbers zero-padded, filled cell ranges with per-cell `shade` and an
 * optional `border`, and `cell: AF3` placements).
 *
 * @module core/astrometrics/objects/grid
 */
import { Group, Mesh, MeshBasicMaterial, Vector3, DoubleSide, BufferGeometry, BufferAttribute } from 'three';
import { gridFace } from '../grid-mesh-material.js';
import { planeGeometry, discGeometry, domeGeometry, sphereGeometry, cylinderGeometry, aroundScale } from '../surface.js';
import { FatLine } from '../lines.js';
import { lettersToIndex, indexToLetters, parseCell, bearingXZ } from '../placements.js';
import { built, num, pair, gridLook, DEFAULT_COLORS } from './common.js';
import { GRID_SHAPES } from '../names.js';

const DEG = Math.PI / 180;
export { GRID_SHAPES };

/**
 * A closed circle as a flat polyline (bearing 0 at north, clockwise).
 * @param {number} r
 * @param {number} y
 * @param {number} [n]
 */
export function circleRun(r, y = 0, n = 256) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const [x, z] = bearingXZ(r, (i / n) * 360);
    out.push(x, y, z);
  }
  return out;
}

/**
 * The sector map's axes: how column and row labels read and where they start.
 * Numbers are zero-padded to the widest label (at least 2 digits: 01 to 15),
 * as scientific displays do; `pad: 0` turns it off, `pad: n` sets the width.
 * @param {any} cfg - axis_labels
 * @param {number} [colCount] - columns on the grid (for the padding width)
 * @param {number} [rowCount]
 */
export function axisSpec(cfg, colCount = 1, rowCount = 1) {
  const columns = cfg?.columns === 'numbers' ? 'numbers' : 'letters';
  const rows = cfg?.rows === 'letters' ? 'letters' : 'numbers';
  /** @param {'letters' | 'numbers'} kind @param {any} start */
  const startIndex = (kind, start) => {
    if (kind === 'letters') {
      const i = lettersToIndex(String(start ?? 'A'));
      return i < 0 ? 0 : i;
    }
    return Math.round(num(start, 1));
  };
  const colStart = startIndex(columns, cfg?.column_start);
  const rowStart = startIndex(rows, cfg?.row_start);
  /** @param {number} last - the largest number shown */
  const width = (last) => (cfg?.pad !== undefined ? Math.max(0, Math.round(num(cfg.pad, 0))) : Math.max(2, String(Math.abs(last)).length));
  const colPad = width(colStart + colCount - 1);
  const rowPad = width(rowStart + rowCount - 1);
  /** @param {number} n @param {number} pad */
  const padded = (n, pad) => (n < 0 ? '-' : '') + String(Math.abs(n)).padStart(pad, '0');
  return {
    columns,
    rows,
    /** @param {number} i - 0 based */
    colLabel: (i) => (columns === 'letters' ? indexToLetters(colStart + i) : padded(colStart + i, colPad)),
    /** @param {number} i */
    rowLabel: (i) => (rows === 'letters' ? indexToLetters(rowStart + i) : padded(rowStart + i, rowPad)),
    /**
     * Cell code to 0-based column and row, or null.
     * @param {string} code
     * @returns {{ c: number, r: number } | null}
     */
    parse(code) {
      const p = parseCell(code);
      if (p) {
        // letters + number: letters name the lettered axis
        if (columns === 'letters' && rows === 'numbers') return { c: lettersToIndex(p.col) - colStart, r: p.row - rowStart };
        if (columns === 'numbers' && rows === 'letters') return { c: p.row - colStart, r: lettersToIndex(p.col) - rowStart };
      }
      // number + letters (rows lettered, written column first: 3AF)
      const m = /^(-?\d+)([A-Z]+)$/i.exec(String(code ?? '').trim());
      if (m && columns === 'numbers' && rows === 'letters') return { c: Number(m[1]) - colStart, r: lettersToIndex(m[2]) - rowStart };
      return null;
    }
  };
}

/**
 * @param {any} cfg
 * @param {import('./common.js').BuildContext} ctx
 * @returns {import('./common.js').BuiltObject}
 */
export function buildGrid(cfg, ctx) {
  const shape = GRID_SHAPES.includes(cfg.shape) ? cfg.shape : 'plane';
  const node = new Group();
  node.name = `grid:${cfg.id ?? ''}`;
  const out = built(cfg, node);
  const border = cfg.border !== false;
  const edgeColor = cfg.color_major !== undefined ? ctx.color(cfg.color_major, DEFAULT_COLORS.grid) : ctx.color(cfg.color, DEFAULT_COLORS.grid);
  const edgeWidth = num(cfg.line_width_major, Math.max(1.5, num(cfg.line_width, 1) * 1.5));
  const opacity = num(cfg.opacity, 1);
  /** @param {number[][]} runs */
  const addEdge = (runs) => {
    const line = new FatLine(runs, { color: edgeColor, width: edgeWidth, opacity, additive: cfg.blend === 'add' });
    node.add(line.object);
    out.lines.push(line);
  };
  /** @param {import('three').BufferGeometry} geo @param {import('../grid-mesh-material.js').GridLook} look */
  const addFace = (geo, look) => {
    const face = gridFace(geo, look);
    node.add(face);
    out.gridFaces.push(face);
    out.pickMeshes.push(...face.children);
    return face;
  };

  if (shape === 'plane') {
    const [w, d] = pair(cfg.size, [200, 200]);
    const s = Math.max(1e-3, num(cfg.line_spacing, 10));
    const face = addFace(planeGeometry(w, d), gridLook(cfg, ctx, { cell: [s, s], back: 1, planePolar: cfg.pattern === 'polar' }));
    // Lines from the north-west corner, so cells line up with the edges
    shiftSurf(face, w / 2, d / 2);
    face.userData.uniforms.uPolarC.value.set(w / 2, d / 2);
    if (border) addEdge([[-w / 2, 0, -d / 2, w / 2, 0, -d / 2, w / 2, 0, d / 2, -w / 2, 0, d / 2, -w / 2, 0, -d / 2]]);
    const cols = Math.max(1, Math.round(w / s));
    const rows = Math.max(1, Math.round(d / s));
    const axes = axisSpec(cfg.axis_labels, cols, rows);
    out.cellPoint = (code) => {
      const p = axes.parse(code);
      if (!p || p.c < 0 || p.r < 0 || p.c >= cols || p.r >= rows) return null;
      return new Vector3(-w / 2 + (p.c + 0.5) * s, 0, -d / 2 + (p.r + 0.5) * s);
    };
    if (cfg.axis_labels) {
      const a = cfg.axis_labels;
      const every = Math.max(1, Math.round(num(a.every, 1)));
      const style = a.style ?? 'tiny';
      const gap = num(a.offset, s * 0.6);
      for (let c = 0; c < cols; c += every) {
        out.points.push({ id: `${cfg.id ?? 'grid'}.col.${c}`, object: cfg.id, xyz: [-w / 2 + (c + 0.5) * s, 0, -d / 2 - gap], label: axes.colLabel(c), style, color: a.color, text: a.text, priority: 30 });
      }
      for (let r = 0; r < rows; r += every) {
        out.points.push({ id: `${cfg.id ?? 'grid'}.row.${r}`, object: cfg.id, xyz: [-w / 2 - gap, 0, -d / 2 + (r + 0.5) * s], label: axes.rowLabel(r), style, color: a.color, text: a.text, priority: 30 });
      }
    }
    for (const cell of Array.isArray(cfg.cells) ? cfg.cells : []) {
      const a = axes.parse(cell?.from ?? cell?.cell);
      const b = axes.parse(cell?.to ?? cell?.from ?? cell?.cell);
      if (!a || !b) continue;
      const c0 = Math.max(0, Math.min(a.c, b.c));
      const c1 = Math.min(cols - 1, Math.max(a.c, b.c));
      const r0 = Math.max(0, Math.min(a.r, b.r));
      const r1 = Math.min(rows - 1, Math.max(a.r, b.r));
      if (c1 < c0 || r1 < r0) continue;
      const col = ctx.color(cell.color, DEFAULT_COLORS.volume);
      const fill = cellFill(c0, c1, r0, r1, { s, x0: -w / 2, z0: -d / 2, color: col, shade: num(cell.shade, 0), seed: num(cell.seed, 0) });
      fill.material.opacity = num(cell.opacity, 0.25) * (col[3] ?? 1) * opacity;
      node.add(fill);
      if (cell.border) {
        const b = typeof cell.border === 'object' ? cell.border : {};
        const x0 = -w / 2 + c0 * s;
        const x1 = -w / 2 + (c1 + 1) * s;
        const z0 = -d / 2 + r0 * s;
        const z1 = -d / 2 + (r1 + 1) * s;
        const line = new FatLine([[x0, 0.02, z0, x1, 0.02, z0, x1, 0.02, z1, x0, 0.02, z1, x0, 0.02, z0]], {
          color: b.color !== undefined ? ctx.color(b.color, DEFAULT_COLORS.volume) : col,
          width: num(b.width, 1.5),
          opacity: num(b.opacity, 0.9) * opacity,
          renderOrder: 3
        });
        node.add(line.object);
        out.lines.push(line);
      }
    }
  } else if (shape === 'disc') {
    const R = Math.max(1e-3, num(cfg.radius, 100));
    const r0 = Math.max(0, num(cfg.inner_radius, 0));
    const spokes = cfg.line_spacing_deg !== undefined ? Math.round(360 / Math.max(1, num(cfg.line_spacing_deg, 10))) : num(cfg.spoke_count, 36);
    const s = Math.max(1e-3, num(cfg.line_spacing, R / 10));
    addFace(discGeometry({ r0, r1: R }), { ...gridLook({ pattern: 'polar', ...cfg, spoke_count: spokes }, ctx, { cell: [s, s], back: 1, planePolar: (cfg.pattern ?? 'polar') === 'polar' }) });
    if (border) addEdge(r0 > 0 ? [circleRun(R), circleRun(r0)] : [circleRun(R)]);
    out.radius = R;
    ringLabels(cfg, R, out);
  } else {
    const R = Math.max(1e-3, num(cfg.radius, 100));
    const deg = cfg.line_spacing_deg !== undefined ? Math.max(0.5, num(cfg.line_spacing_deg, 15)) : null;
    const sAlong = deg ? R * deg * DEG : Math.max(1e-3, num(cfg.line_spacing, R * 15 * DEG));
    // round: a whole number of cells (the arc coordinate is scaled to fit)
    const cellAround = deg ? R * deg * DEG : sAlong;
    const around = aroundScale(R, cellAround);
    const polar = cfg.pattern === 'polar';
    // polar on a curved surface: rings along the axis, spoke_count meridians round
    const meridian = polar && num(cfg.spoke_count, 0) > 0 ? (2 * Math.PI * R) / num(cfg.spoke_count, 12) : cellAround;
    const look = gridLook(cfg, ctx, { cell: [meridian, sAlong], pattern: polar ? 'both' : cfg.pattern, back: shape === 'cylinder' ? 0.25 : 0.25 });
    const scale = polar ? 1 : around;
    if (shape === 'dome') {
      addFace(domeGeometry({ radius: R, around: scale }), look);
      if (border) addEdge([circleRun(R)]);
    } else if (shape === 'sphere') {
      addFace(sphereGeometry({ radius: R, around: scale }), look);
    } else {
      const h = Math.max(1e-3, num(cfg.height, R));
      addFace(cylinderGeometry({ radius: R, y0: -h / 2, y1: h / 2, around: scale }), look);
      if (border) addEdge([circleRun(R, -h / 2), circleRun(R, h / 2)]);
    }
    out.radius = R;
    ringLabels(cfg, R, out);
  }
  return out;
}

/**
 * A deterministic 0..1 per cell (the same cell always gets the same shade).
 * @param {number} c
 * @param {number} r
 * @param {number} seed
 */
export function cellHash(c, r, seed = 0) {
  let h = Math.imul(c + 0x9e37, 0x85ebca6b) ^ Math.imul(r + 0x7f4a, 0xc2b2ae35) ^ Math.imul(seed + 1, 0x27d4eb2f);
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
  h ^= h >>> 12;
  return (h >>> 0) / 4294967296;
}

/**
 * A filled cell range, one quad per cell; `shade` (0..1) varies each cell's
 * brightness up and down by that fraction, as on a printed sector map.
 * @param {number} c0
 * @param {number} c1
 * @param {number} r0
 * @param {number} r1
 * @param {{ s: number, x0: number, z0: number, color: number[], shade: number, seed: number }} o
 */
export function cellFill(c0, c1, r0, r1, { s, x0, z0, color, shade, seed }) {
  const n = (c1 - c0 + 1) * (r1 - r0 + 1);
  const pos = new Float32Array(n * 12);
  const colors = new Float32Array(n * 12);
  const index = new Uint32Array(n * 6);
  // vertex colours are linear in three.js
  const lin = (/** @type {number} */ v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  let q = 0;
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++, q++) {
      const k = 1 + Math.max(0, Math.min(1, shade)) * (2 * cellHash(c, r, seed) - 1);
      const rgb = [0, 1, 2].map((i) => lin(Math.max(0, Math.min(1, color[i] * k))));
      const xa = x0 + c * s;
      const za = z0 + r * s;
      pos.set([xa, 0.01, za, xa + s, 0.01, za, xa, 0.01, za + s, xa + s, 0.01, za + s], q * 12);
      for (let v = 0; v < 4; v++) colors.set(rgb, q * 12 + v * 3);
      index.set([q * 4, q * 4 + 2, q * 4 + 1, q * 4 + 1, q * 4 + 2, q * 4 + 3], q * 6);
    }
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(pos, 3));
  geo.setAttribute('color', new BufferAttribute(colors, 3));
  geo.setIndex(new BufferAttribute(index, 1));
  geo.computeBoundingSphere();
  const mesh = new Mesh(geo, new MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: DoubleSide }));
  mesh.renderOrder = 1;
  return mesh;
}

/**
 * Bearing labels round a disc or dome base (`ring_labels: { step, radius, style }`).
 * @param {any} cfg
 * @param {number} R
 * @param {import('./common.js').BuiltObject} out
 */
function ringLabels(cfg, R, out) {
  const rl = cfg.ring_labels;
  if (!rl) return;
  const step = Math.max(1, num(rl.step, 10));
  const r = num(rl.radius, R * 1.06);
  const start = num(rl.start, 0);
  for (let deg = start; deg < start + 360 - 1e-9; deg += step) {
    const b = ((deg % 360) + 360) % 360;
    out.points.push({ id: `${cfg.id ?? 'grid'}.ring.${b}`, object: cfg.id, polar: [r, b], alt: num(rl.alt, 0), label: String(Math.round(b * 100) / 100), style: rl.style ?? 'minor', color: rl.color, text: rl.text, priority: 50 });
  }
}

/**
 * Offset the surface coordinates of a face's geometry.
 * @param {Group} face
 * @param {number} ds
 * @param {number} dt
 */
function shiftSurf(face, ds, dt) {
  const mesh = /** @type {Mesh} */ (face.children[0]);
  const attr = mesh.geometry.getAttribute('surf');
  for (let i = 0; i < attr.count; i++) attr.setXY(i, attr.getX(i) + ds, attr.getY(i) + dt);
  attr.needsUpdate = true;
}
