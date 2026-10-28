/**
 * `type: grid`: a grid surface, `shape: plane | disc | dome | sphere | cylinder`,
 * styled with the background `grid` effect's keys (`pattern`, `line_spacing`,
 * `major_*_interval`, `line_width*`, `color*`, `fill_color`, `spoke_count`,
 * `back_opacity`) in scene units. Curved shapes take `line_spacing_deg`
 * (rings and meridians every N degrees) and always fit a whole number of
 * cells round (no seam).
 *
 * Extras: `edges` (fat lines on the open edges, on by default),
 * `ring_labels` (bearing labels round a disc or dome), and on a plane
 * `axis_labels` + `cells` (a lettered sector map: column letters, row
 * numbers zero-padded, filled cell ranges with per-cell `shade` and an
 * optional `edges` outline, and `cell: AF3` placements).
 *
 * `shape: well` is a funnel round the y axis (the background grid's
 * `well_shape` / `well_throat` / `well_profile`), rim at y = 0. `deform:`
 * warps any shape (wobble, bend, twist, noise; `deform.js`): the faces,
 * rims, cell fills and the points on the grid all move with it.
 *
 * @module core/astrometrics/objects/grid
 */
import { Group, Mesh, MeshBasicMaterial, Vector3, DoubleSide, BufferGeometry, BufferAttribute, Triangle } from 'three';
import { gridFace } from '../grid-mesh-material.js';
import { planeGeometry, discGeometry, domeGeometry, sphereGeometry, cylinderGeometry, wellGeometry, aroundScale } from '../surface.js';
import { makeDeformer } from '../deform.js';
import { wellProfile } from '../../packs/backgrounds/effects/grid-surface-model.js';
import { FatLine } from '../lines.js';
import { lettersToIndex, indexToLetters, parseCell, bearingXZ } from '../placements.js';
import { built, num, pair, gridLook, scanTicker, combineTicks, fillFor, DEFAULT_COLORS } from './common.js';
import { GRID_SHAPES, AXIAL_GRID_SHAPES } from '../names.js';

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
    },
    /**
     * 0-based column and row to the code parse() reads back (letters first),
     * or null when both axes are letters or both numbers.
     * @param {number} c
     * @param {number} r
     */
    cellName(c, r) {
      if (columns === 'letters' && rows === 'numbers') return `${indexToLetters(colStart + c)}${rowStart + r}`;
      if (columns === 'numbers' && rows === 'letters') return `${indexToLetters(rowStart + r)}${colStart + c}`;
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
  const border = cfg.edges !== false;
  const edgeColor = ctx.color(cfg.edge_color ?? cfg.color_major ?? cfg.color, DEFAULT_COLORS.grid);
  const edgeWidth = num(cfg.edge_width, num(cfg.line_width_major, Math.max(1.5, num(cfg.line_width, 1) * 1.5)));
  // radius: a number, or [inner, outer] (a disc with a hole)
  const [innerR, outerR] = Array.isArray(cfg.radius) ? [num(cfg.radius[0], 0), num(cfg.radius[1], 100)] : [0, num(cfg.radius, 100)];
  const opacity = num(cfg.opacity, 1);
  const deforming = (Array.isArray(cfg.deform) ? cfg.deform : []).length > 0;
  // a deformed surface bends between patches: twice as many
  const detail = deforming ? 2 : 1;
  /** @type {{ line: FatLine }[]} what the deformer moves besides the faces */
  const warpLines = [];
  /** @type {BufferGeometry[]} */
  const warpGeos = [];
  /** @type {number[] | undefined} the y range round the axis (axial deforms) */
  let extent;
  /** @param {number[][]} runs */
  const addEdge = (runs) => {
    if (deforming) runs = runs.map((r) => densify(r, edgeStep(cfg)));
    const line = new FatLine(runs, { color: edgeColor, width: edgeWidth, opacity, additive: cfg.blend === 'add' });
    node.add(line.object);
    out.lines.push(line);
    warpLines.push({ line });
  };
  /** @param {import('three').BufferGeometry} geo @param {import('../grid-mesh-material.js').GridLook} look */
  const addFace = (geo, look) => {
    warpGeos.push(geo);
    const face = gridFace(geo, look);
    node.add(face);
    out.gridFaces.push(face);
    out.pickMeshes.push(...face.children);
    return face;
  };

  if (shape === 'plane') {
    const [w, d] = pair(cfg.size, [200, 200]);
    const s = Math.max(1e-3, num(cfg.line_spacing, 10));
    const face = addFace(planeGeometry(w, d, detail), gridLook(cfg, ctx, { cell: [s, s], back: 1, planePolar: cfg.pattern === 'polar' }));
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
    out.cellAt = (local) => {
      const c = Math.floor((local.x + w / 2) / s);
      const r = Math.floor((local.z + d / 2) / s);
      return c >= 0 && r >= 0 && c < cols && r < rows ? axes.cellName(c, r) : null;
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
      const fill = cellFill(c0, c1, r0, r1, { s, x0: -w / 2, z0: -d / 2, color: col, shade: num(cell.shade, 0), seed: num(cell.seed, 0), sub: deforming ? 4 : 1 });
      fill.material.opacity = num(cell.opacity, 0.25) * (col[3] ?? 1) * opacity;
      node.add(fill);
      warpGeos.push(fill.geometry);
      if (cell.edges) {
        const b = typeof cell.edges === 'object' ? cell.edges : {};
        const x0 = -w / 2 + c0 * s;
        const x1 = -w / 2 + (c1 + 1) * s;
        const z0 = -d / 2 + r0 * s;
        const z1 = -d / 2 + (r1 + 1) * s;
        const box = [x0, 0.02, z0, x1, 0.02, z0, x1, 0.02, z1, x0, 0.02, z1, x0, 0.02, z0];
        const runs = [deforming ? densify(box, edgeStep(cfg)) : box];
        const line = new FatLine(runs, {
          color: b.color !== undefined ? ctx.color(b.color, DEFAULT_COLORS.volume) : col,
          width: num(b.width, 1.5),
          opacity: num(b.opacity, 0.9) * opacity,
          renderOrder: 3
        });
        node.add(line.object);
        out.lines.push(line);
        warpLines.push({ line });
      }
    }
  } else if (shape === 'disc') {
    const R = Math.max(1e-3, outerR);
    const r0 = Math.max(0, Math.min(innerR, R));
    const spokes = cfg.line_spacing_deg !== undefined ? Math.round(360 / Math.max(1, num(cfg.line_spacing_deg, 10))) : num(cfg.spoke_count, 36);
    const s = Math.max(1e-3, num(cfg.line_spacing, R / 10));
    addFace(discGeometry({ r0, r1: R, detail }), { ...gridLook({ pattern: 'polar', ...cfg, spoke_count: spokes }, ctx, { cell: [s, s], back: 1, planePolar: (cfg.pattern ?? 'polar') === 'polar' }) });
    if (border) addEdge(r0 > 0 ? [circleRun(R), circleRun(r0)] : [circleRun(R)]);
    out.radius = R;
    ringLabels(cfg, R, out);
  } else {
    const R = Math.max(1e-3, outerR);
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
      addFace(domeGeometry({ radius: R, around: scale, detail }), look);
      if (border) addEdge([circleRun(R)]);
      extent = [0, R];
    } else if (shape === 'sphere') {
      addFace(sphereGeometry({ radius: R, around: scale, detail }), look);
      extent = [-R, R];
    } else if (shape === 'well') {
      const depth = Math.max(1e-3, num(cfg.depth, R));
      const profile = wellProfile(cfg, R);
      addFace(wellGeometry({ profile, depth, around: scale, detail }), look);
      if (border) addEdge(profile[0] > 1e-3 ? [circleRun(R), circleRun(profile[0], -depth)] : [circleRun(R)]);
      extent = [-depth, 0];
      out.centre = [0, -depth / 2, 0];
    } else {
      const h = Math.max(1e-3, num(cfg.height, R));
      addFace(cylinderGeometry({ radius: R, y0: -h / 2, y1: h / 2, around: scale, detail }), look);
      if (border) addEdge([circleRun(R, -h / 2), circleRun(R, h / 2)]);
      extent = [-h / 2, h / 2];
    }
    out.radius = R;
    ringLabels(cfg, R, out);
  }
  // fill_effect: one material under every face's lines (drawn after the far side, before the near side)
  const size = pair(cfg.size, [200, 200]);
  const effect = fillFor(cfg, ctx, { radius: out.radius ?? Math.max(size[0], size[1]) / 2, opacity });
  if (effect) {
    for (const face of out.gridFaces) {
      const mesh = new Mesh(/** @type {any} */ (face.children[0]).geometry, effect.material);
      mesh.renderOrder = 1.5;
      node.add(mesh);
    }
  }
  out.tick = combineTicks(deformTicker(cfg, shape, out, extent, warpGeos, warpLines), scanTicker(cfg, ctx, out.gridFaces), effect?.tick);
  return out;
}

/**
 * The grid's `deform:` list on its geometry, rims and points: applied once
 * now, and per frame on the scene clock when it moves. Sets `warp` (points
 * on the grid), `unwarpHit` (picks map back to the undeformed surface) and
 * `moving`. Null tick when nothing deforms or nothing moves.
 * @param {any} cfg
 * @param {string} shape
 * @param {import('./common.js').BuiltObject} out
 * @param {number[] | undefined} extent - [y0, y1] round the axis
 * @param {BufferGeometry[]} geos
 * @param {{ line: FatLine }[]} lines
 * @returns {((dt: number, t: number) => boolean) | null}
 */
export function deformTicker(cfg, shape, out, extent, geos, lines) {
  const axial = /** @type {readonly string[]} */ (AXIAL_GRID_SHAPES).includes(shape);
  const size = axial || shape === 'disc' ? (out.radius ?? 100) : Math.max(...pair(cfg.size, [200, 200])) / 2;
  const [y0, y1] = extent ?? [-size, size];
  const deformer = makeDeformer(cfg.deform, { kind: axial ? 'axial' : 'flat', size, y0, y1 });
  if (!deformer) return null;
  const bases = geos.map((g) => /** @type {Float32Array} */ (g.getAttribute('position').array).slice());
  const faceRuns = bases.map((b) => deformer.batch(b));
  const lineRuns = lines.map(({ line }) => deformer.batch(line.segmentPositions()));
  const lineOut = lines.map(({ line }) => new Float32Array(line.segmentPositions().length));
  const p = [0, 0, 0];
  let now = 0;
  /** @param {number} t */
  const apply = (t) => {
    now = t;
    geos.forEach((g, i) => {
      const attr = g.getAttribute('position');
      faceRuns[i](t, /** @type {Float32Array} */ (attr.array));
      attr.needsUpdate = true;
    });
    lines.forEach(({ line }, i) => {
      lineRuns[i](t, lineOut[i]);
      line.moveSegments(lineOut[i]);
    });
  };
  apply(0);
  // Bounds once, grown by the furthest a vertex moves (culling and picks stay right)
  for (const g of geos) {
    g.computeBoundingSphere();
    if (g.boundingSphere) g.boundingSphere.radius += deformer.reach;
  }
  out.moving = deformer.moving;
  out.warp = (v) => {
    deformer.warp(v.x, v.y, v.z, now, p);
    return v.set(p[0], p[1], p[2]);
  };
  const tri = new Triangle();
  const bary = new Vector3();
  const [va, vb, vc] = [new Vector3(), new Vector3(), new Vector3()];
  out.unwarpHit = (hit) => {
    const mesh = /** @type {Mesh} */ (hit.object);
    const i = geos.indexOf(mesh.geometry);
    if (i < 0 || !hit.face) return null;
    const pos = mesh.geometry.getAttribute('position');
    const { a, b, c } = hit.face;
    const local = mesh.worldToLocal(hit.point.clone());
    tri.set(va.fromBufferAttribute(pos, a), vb.fromBufferAttribute(pos, b), vc.fromBufferAttribute(pos, c));
    if (!tri.getBarycoord(local, bary)) return null;
    const base = bases[i];
    /** @param {number} n @param {number} k */
    const at = (n, k) => base[n * 3 + k];
    return new Vector3(
      at(a, 0) * bary.x + at(b, 0) * bary.y + at(c, 0) * bary.z,
      at(a, 1) * bary.x + at(b, 1) * bary.y + at(c, 1) * bary.z,
      at(a, 2) * bary.x + at(b, 2) * bary.y + at(c, 2) * bary.z
    );
  };
  if (!deformer.moving) return null;
  return (_dt, t) => {
    apply(t);
    return true;
  };
}

/**
 * A polyline with points added so no segment is longer than `step` (a
 * straight edge on a deformed grid bends with it).
 * @param {number[]} run - x, y, z, ...
 * @param {number} step
 * @returns {number[]}
 */
export function densify(run, step) {
  if (run.length < 6 || !(step > 0)) return run;
  const out = [run[0], run[1], run[2]];
  for (let k = 3; k < run.length; k += 3) {
    const [ax, ay, az] = [run[k - 3], run[k - 2], run[k - 1]];
    const [bx, by, bz] = [run[k], run[k + 1], run[k + 2]];
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay, bz - az) / step));
    for (let i = 1; i <= n; i++) out.push(ax + ((bx - ax) * i) / n, ay + ((by - ay) * i) / n, az + ((bz - az) * i) / n);
  }
  return out;
}

/**
 * Point spacing for straight edges on a deformed grid: 1/64 of its size.
 * @param {any} cfg
 */
const edgeStep = (cfg) => Math.max(...pair(cfg.size, [200, 200]), ...pair(cfg.radius, [0, 0])) / 64;

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
 * `sub` splits each cell into sub x sub quads (a deformed grid bends inside a cell).
 * @param {number} c0
 * @param {number} c1
 * @param {number} r0
 * @param {number} r1
 * @param {{ s: number, x0: number, z0: number, color: number[], shade: number, seed: number, sub?: number }} o
 */
export function cellFill(c0, c1, r0, r1, { s, x0, z0, color, shade, seed, sub = 1 }) {
  const m = Math.max(1, Math.round(sub));
  const e = s / m;
  const n = (c1 - c0 + 1) * (r1 - r0 + 1) * m * m;
  const pos = new Float32Array(n * 12);
  const colors = new Float32Array(n * 12);
  const index = new Uint32Array(n * 6);
  // vertex colours are linear in three.js
  const lin = (/** @type {number} */ v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  let q = 0;
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      const k = 1 + Math.max(0, Math.min(1, shade)) * (2 * cellHash(c, r, seed) - 1);
      const rgb = [0, 1, 2].map((i) => lin(Math.max(0, Math.min(1, color[i] * k))));
      for (let j = 0; j < m; j++) {
        for (let i = 0; i < m; i++, q++) {
          const xa = x0 + c * s + i * e;
          const za = z0 + r * s + j * e;
          pos.set([xa, 0.01, za, xa + e, 0.01, za, xa, 0.01, za + e, xa + e, 0.01, za + e], q * 12);
          for (let v = 0; v < 4; v++) colors.set(rgb, q * 12 + v * 3);
          index.set([q * 4, q * 4 + 2, q * 4 + 1, q * 4 + 1, q * 4 + 2, q * 4 + 3], q * 6);
        }
      }
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
