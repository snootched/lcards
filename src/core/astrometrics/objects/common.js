/**
 * Shared bits for the astrometrics object builders: the build context, the
 * built-object shape, defaults and small parsers.
 *
 * Every builder takes the object's config and the context and returns a
 * `BuiltObject`: its three.js node, what placements on it need (radius,
 * cell centres), what it adds to the scene (generated points with labels,
 * fat lines, pick meshes), and an optional `update` the runtime calls once
 * after placements exist and every frame while it is `dynamic` (ends on a
 * moving point, the sky).
 *
 * @module core/astrometrics/objects/common
 */
import { MathUtils } from 'three';

/** Default colours (theme tokens and LCARdS variables; resolved concrete for WebGL) */
export const DEFAULT_COLORS = {
  grid: 'theme:colors.ui.tertiary',
  line: 'theme:colors.ui.secondary',
  volume: 'var(--lcars-blue, var(--lcards-blue-medium))',
  path: 'var(--lcars-orange, var(--lcards-orange-medium))',
  fill: 'black',
  glow: 'var(--lcards-moonlight)',
  stars: 'var(--lcards-moonlight)'
};

/**
 * @typedef {Object} BuildContext
 * @property {(value: any, fallback: string) => number[]} color - concrete straight sRGB rgba 0..1
 * @property {import('../placements.js').Placements | null} places - set before `update` runs
 * @property {() => (import('../sky.js').SkyState | null)} sky
 * @property {() => void} requestFrame
 * @property {(url: string) => any} loadTexture - three.js texture, redraws when loaded
 */

/**
 * @typedef {Object} BuiltObject
 * @property {string} id
 * @property {string} type
 * @property {any} config
 * @property {import('three').Object3D} node
 * @property {number} [radius] - for latlon / altaz placements and occlusion
 * @property {number[]} [centre] - local middle (fly-to and the object's label), default the origin
 * @property {(code: string) => (import('three').Vector3 | null)} [cellPoint]
 * @property {number} spin - degrees per second round the object's y axis
 * @property {boolean} occludes - hides labels behind it (a solid sphere)
 * @property {import('three').Object3D[]} pickMeshes
 * @property {any[]} points - generated points (ring and axis labels), before the user's
 * @property {import('../lines.js').FatLine[]} lines
 * @property {import('three').Group[]} gridFaces
 * @property {(() => void) | null} update
 * @property {boolean} dynamic
 */

/**
 * A built object with the defaults filled in.
 * @param {any} config
 * @param {import('three').Object3D} node
 * @param {Partial<BuiltObject>} [extra]
 * @returns {BuiltObject}
 */
export function built(config, node, extra = {}) {
  const spin = num(config.spin, 0);
  return {
    id: String(config.id ?? ''),
    type: String(config.type),
    config,
    node,
    spin,
    occludes: false,
    pickMeshes: [],
    points: [],
    lines: [],
    gridFaces: [],
    update: null,
    dynamic: false,
    ...extra
  };
}

/**
 * @param {any} v
 * @param {number} d
 */
export function num(v, d) {
  const n = Number(v);
  return v !== undefined && v !== null && v !== '' && Number.isFinite(n) ? n : d;
}

/**
 * `[a, b]` or one number for both.
 * @param {any} v
 * @param {[number, number]} d
 * @returns {[number, number]}
 */
export function pair(v, d) {
  if (Array.isArray(v) && v.length >= 2) return [num(v[0], d[0]), num(v[1], d[1])];
  if (v !== undefined && Number.isFinite(Number(v))) return [Number(v), Number(v)];
  return d;
}

/**
 * Object rotation from config (`rotation: [x, y, z]` degrees, YXZ order;
 * y is a bearing, clockwise from above).
 * @param {import('three').Object3D} node
 * @param {any} config
 */
export function applyRotation(node, config) {
  const r = Array.isArray(config.rotation) ? config.rotation : null;
  node.rotation.order = 'YXZ';
  if (r) node.rotation.set(MathUtils.degToRad(num(r[0], 0)), -MathUtils.degToRad(num(r[1], 0)), MathUtils.degToRad(num(r[2], 0)));
}

/**
 * Colour with the object's `opacity` folded into alpha.
 * @param {number[]} c
 * @param {number} opacity
 */
export function withOpacity(c, opacity) {
  return [c[0], c[1], c[2], (c[3] ?? 1) * opacity];
}

/**
 * Free every geometry, material and texture under a node.
 * @param {import('three').Object3D} node
 */
export function disposeNode(node) {
  node.traverse((o) => {
    const m = /** @type {any} */ (o);
    m.geometry?.dispose?.();
    const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
    for (const mat of mats) {
      mat.map?.dispose?.();
      mat.dispose?.();
    }
  });
}

/**
 * Grid look keys (shared with the background `grid` effect's names) to
 * material settings. `cell` is the spacing along s and t.
 * @param {any} cfg
 * @param {BuildContext} ctx
 * @param {{ cell: [number, number], pattern?: string, back?: number, planePolar?: boolean, majorRow?: number, majorCol?: number }} o
 * @returns {import('../grid-mesh-material.js').GridLook}
 */
export function gridLook(cfg, ctx, o) {
  const opacity = num(cfg.opacity, 1);
  const color = ctx.color(cfg.color, DEFAULT_COLORS.grid);
  const colorMajor = cfg.color_major !== undefined ? ctx.color(cfg.color_major, DEFAULT_COLORS.grid) : [color[0], color[1], color[2], Math.min(1, (color[3] ?? 1) * 1.6)];
  return {
    pattern: /** @type {any} */ (o.pattern ?? cfg.pattern ?? 'both'),
    cell: o.cell,
    majorRow: o.majorRow ?? num(cfg.major_row_interval, 0),
    majorCol: o.majorCol ?? num(cfg.major_col_interval, 0),
    widthMinor: num(cfg.line_width, 1),
    widthMajor: num(cfg.line_width_major, Math.max(1.5, num(cfg.line_width, 1) * 1.5)),
    color,
    colorMajor,
    fill: cfg.fill_color !== undefined ? ctx.color(cfg.fill_color, 'transparent') : undefined,
    spokes: num(cfg.spoke_count, 12),
    spacing: o.cell[0],
    hexRadius: num(cfg.hex_radius, o.cell[0]),
    dotRadius: num(cfg.dot_radius, o.cell[0] * 0.08),
    planePolar: o.planePolar,
    back: num(cfg.back_opacity, o.back ?? 0.25),
    opacity,
    additive: cfg.blend === 'add'
  };
}
