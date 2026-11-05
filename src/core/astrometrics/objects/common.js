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
import { MathUtils, Matrix4, Vector3 } from 'three';
import { sphereAxes } from '../ephemeris.js';
import { scanAt } from '../../packs/backgrounds/webgl/scenes/scan-band.js';
import { scanRange, setScan } from '../grid-mesh-material.js';
import { lcardsLog } from '../../../utils/lcards-logging.js';

/** Default colours (theme tokens and LCARdS variables; resolved concrete for WebGL) */
export const DEFAULT_COLORS = {
  grid: 'theme:colors.ui.tertiary',
  line: 'theme:colors.ui.secondary',
  volume: 'var(--lcars-blue, var(--lcards-blue-medium))',
  path: 'var(--lcars-orange, var(--lcards-orange-medium))',
  fill: 'black',
  glow: 'var(--lcards-moonlight)',
  nebula: 'var(--lcars-violet, var(--lcards-blue-medium))',
  stars: 'var(--lcards-moonlight)',
  scan: 'var(--lcards-moonlight)',
  model: 'var(--lcars-blue, var(--lcards-blue-medium))',
  modelRim: 'var(--lcards-moonlight)',
  pulse: 'var(--lcards-moonlight)'
};

/**
 * @typedef {Object} BuildContext
 * @property {(value: any, fallback: string) => number[]} color - concrete straight sRGB rgba 0..1
 * @property {import('../placements.js').Placements | null} places - set before `update` runs
 * @property {() => (import('../sky.js').SkyState | null)} sky
 * @property {() => number} [date] - the scene clock's date, ms (`clock`; body points, spheres and orbits)
 * @property {(system: string | undefined) => number | null} [kmPerUnit] - km per unit of a frame (its `units`), null without; set by buildScene
 * @property {() => void} requestFrame
 * @property {(pointId: any) => (import('three').Object3D | null)} [pointSpace] - what a point's motion is measured on: the
 *   outer group of the object it stands on (placed and turned, not spun), or null (set once the placements exist)
 * @property {(url: string) => any} loadTexture - three.js texture, redraws when loaded
 * @property {typeof import('../effects/index.js') | null} [effects] - the effects chunk, when the config uses it (`usesEffects`)
 * @property {typeof import('../model/index.js') | null} [models] - the model chunk, when the config has a model (`usesModels`)
 * @property {(src: string) => (Promise<import('three/examples/jsm/loaders/GLTFLoader.js').GLTF> | null)} [loadModel] - a model file, parsed (once per src)
 * @property {() => Map<string, BuiltObject>} [objects] - the scene's objects by id, live (set by buildScene)
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
 * @property {(local: import('three').Vector3) => (string | null)} [cellAt] - the cell under a local position (picking)
 * @property {number} spin - degrees per second round the object's y axis
 * @property {boolean} occludes - hides labels behind it (a solid sphere)
 * @property {import('three').Object3D[]} pickMeshes
 * @property {any[]} points - generated points (ring and axis labels), before the user's
 * @property {import('../lines.js').FatLine[]} lines
 * @property {import('three').Group[]} gridFaces
 * @property {(() => void) | null} update
 * @property {import('../looks.js').LookParts} [lookParts] - parts that switch with the card's look (looks.js)
 * @property {() => void} [repin] - a line pinned in world space (lines.js anchoredRuns): drawn again if what it stands in moved
 * @property {boolean} dynamic
 * @property {import('../star-field.js').StarField} [field] - backdrop stars and dust
 * @property {((dt: number, t: number) => boolean) | null} tick - own motion per frame (drift, scan, flow): dt and the scene clock in ms; true while it still moves
 * @property {(ms: number) => void} [onDate] - follow the scene date (a body's turn, an orbit line): every frame, whatever time_scale is
 * @property {import('three').Object3D} [placeNode] - what points on it are local to, when not `node` (a model's file space)
 * @property {'sphere' | 'depth'} [occluder] - how it hides labels when `occludes`: a sphere of `radius` (default), or its depth (meshes)
 * @property {boolean} [flat] - distance keys measure to its bounding box, not its sphere (a plane or disc grid)
 * @property {boolean} [moving] - moves on its own besides spin (animation): points on it change every frame
 * @property {(local: import('three').Vector3) => import('three').Vector3} [warp] - a deformed grid: moves an undeformed local position (in place) where the surface is now
 * @property {(hit: import('three').Intersection) => (import('three').Vector3 | null)} [unwarpHit] - a deformed grid: a pick on it as an undeformed local position
 * @property {() => boolean} [isReady] - false while it loads (points on it wait)
 * @property {(name: string) => (import('three').Object3D | null)} [partNode] - a named node (a model's part)
 * @property {() => string[]} [partNames]
 * @property {() => string} [loadState]
 * @property {number} [drawnSize] - a model's largest extent as drawn, scene units (its real size once the file is in)
 * @property {number} [realExtent] - a real-size model's largest extent at its real size, scene units (`model_scale: visible` reads it)
 * @property {(k: number) => void} [magnify] - a real-size model: draw it k times its real size, about its centre (1: real)
 * @property {() => ({ src: string, extent: number[], size: number, real: boolean } | null)} [modelInfo] - a model's file extent (its own
 *   units), its drawn size and whether that is its real size; null until the file is in
 * @property {() => void} [dispose] - its own cleanup besides geometry and materials
 * @property {(world: import('three').Vector3) => void} [lightAt] - lit from a point (`light`): where it is now, world; the scene
 *   builder sets it every layout pass
 * @property {(source: object, lights: { at: number[], radius: number, color: number[], level: number }[]) => void} [setLights] - a volume nebula: lights from one source (lightning), world
 * @property {(world: number[]) => boolean} [contains] - whether a world position is inside its region (a volume nebula)
 * @property {(key: string, value: number | null) => boolean} [live] - a setting that follows an entity, changed in place
 * @property {(key: string, color: string | null) => boolean} [liveColor] - a colour that follows an entity, changed in place (names.js LIVE_TYPE_KEYS); null: the config's again
 *   (names.js LIVE_TYPE_KEYS; a joined path such as radius.0): true when it took it; null puts the built value back
 * @property {(renderer: import('three').WebGLRenderer, scene: import('three').Scene, camera: import('three').PerspectiveCamera | import('three').OrthographicCamera, w: number, h: number, frame: number) => void} [prerender] - before each render, while
 *   it shows: draw what it needs first (a volume nebula's solid depth); w and h in drawing buffer px
 * @property {(view: { camera: import('three').Camera, height: number, dpr: number }) => void} [lod] - before each render: change its level of detail for this view (height in CSS px)
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
    tick: null,
    ...extra
  };
}

/**
 * One frame of object motion: spin, then each object's own `tick`. The
 * runtime skips it under reduced motion, and its clock holds there, so
 * motion carries on from where it stopped.
 * @param {BuiltObject[]} list
 * @param {number} dt - ms since the last frame
 * @param {number} t - the scene clock, ms
 * @returns {boolean} true while something moves (draw another frame)
 */
export function stepObjects(list, dt, t) {
  let moving = false;
  for (const b of list) {
    if (b.spin) {
      b.node.rotation.y += MathUtils.degToRad(b.spin) * (dt / 1000);
      moving = true;
    }
    if (b.tick?.(dt, t)) moving = true;
  }
  return moving;
}

/**
 * @param {any} v
 * @param {number} d
 */
/**
 * A part's settings (`coma: { size }`): the object, or {} when the part is
 * left out or only switched (true / false).
 * @param {any} v
 * @returns {Record<string, any>}
 */
export function sub(v) {
  return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
}

/**
 * Whether a part that can be switched (`edges: true | false | {...}`) is on:
 * false is off, true or settings on, left out the default.
 * @param {any} v @param {boolean} def
 */
export function isOn(v, def) {
  return v === undefined || v === null ? def : v !== false;
}

/**
 * Major line width, px (`major.line_width`, default 1.5 x line_width, at least 1.5)
 * @param {any} cfg
 */
export function majorWidth(cfg) {
  return num(sub(cfg.major).line_width, Math.max(1.5, num(cfg.line_width, 1) * 1.5));
}

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
 * `body: <name>` on a sphere or ring: the object takes the real body's pole
 * and turn at the scene clock's date (ephemeris.js), so its north pole points
 * where the planet's does and longitude 0 faces where its prime meridian
 * does. `spin` and `rotation` do not apply. Points on it move (it turns).
 * Nothing for an unknown name (the checker warns).
 * @param {BuiltObject} out
 */
export function bodyTurn(out) {
  const name = out.config?.body;
  if (name === undefined || name === null || name === '' || !sphereAxes(String(name), 0)) return;
  out.spin = 0;
  out.moving = true;
  const m = new Matrix4();
  const x = new Vector3(), y = new Vector3(), z = new Vector3();
  out.onDate = (ms) => {
    const a = sphereAxes(String(name), ms);
    if (!a) return;
    m.makeBasis(x.fromArray(a.x), y.fromArray(a.y), z.fromArray(a.z));
    out.node.quaternion.setFromRotationMatrix(m);
  };
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
  const major = sub(cfg.major);
  const colorMajor = major.color !== undefined ? ctx.color(major.color, DEFAULT_COLORS.grid) : [color[0], color[1], color[2], Math.min(1, (color[3] ?? 1) * 1.6)];
  return {
    pattern: /** @type {any} */ (o.pattern ?? cfg.pattern ?? 'both'),
    cell: o.cell,
    majorRow: o.majorRow ?? num(major.row_interval, 0),
    majorCol: o.majorCol ?? num(major.col_interval, 0),
    widthMinor: num(cfg.line_width, 1),
    widthMajor: majorWidth(cfg),
    color,
    colorMajor,
    fill: sub(cfg.fill).color !== undefined ? ctx.color(sub(cfg.fill).color, 'transparent') : undefined,
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

/**
 * The scan band (`scan: { period, color }`)
 * on an object's grid faces: each face sweeps its own range (see
 * `scanRange`) on the scene clock. Null when `scan.period` is not set.
 * @param {any} cfg
 * @param {BuildContext} ctx
 * @param {import('three').Group[]} faces
 * @returns {((dt: number, t: number) => boolean) | null}
 */
export function scanTicker(cfg, ctx, faces) {
  const scan = sub(cfg.scan);
  const period = num(scan.period, 0);
  if (!(period > 0) || !faces.length) return null;
  const color = ctx.color(scan.color, DEFAULT_COLORS.scan);
  const runs = faces.map((face) => ({ face, range: scanRange(face) }));
  for (const { face } of runs) face.userData.uniforms.uScan.value = withOpacity(color, num(cfg.opacity, 1));
  return (_dt, t) => {
    const { pos, strength } = scanAt(t, period);
    for (const { face, range } of runs) setScan(face, range, pos, strength);
    return true;
  };
}

/**
 * One tick from several (scan and fill on one object); null when none.
 * @param {(((dt: number, t: number) => boolean) | null | undefined)[]} ticks
 * @returns {((dt: number, t: number) => boolean) | null}
 */
export function combineTicks(...ticks) {
  const list = /** @type {((dt: number, t: number) => boolean)[]} */ (ticks.filter(Boolean));
  if (list.length < 2) return list[0] ?? null;
  return (dt, t) => {
    let moving = false;
    for (const tick of list) if (tick(dt, t)) moving = true;
    return moving;
  };
}

/**
 * The `fill.effect` material for an object, from the effects chunk; null
 * without one (or with the chunk missing: a warning, the object draws without it).
 * @param {any} cfg
 * @param {BuildContext} ctx
 * @param {{ radius: number, base?: number[], opacity?: number, solid?: boolean, depth?: number }} o
 */
export function fillFor(cfg, ctx, o) {
  const effect = sub(cfg.fill).effect;
  if (!effect) return null;
  if (!ctx.effects) {
    lcardsLog.warn(`[Astrometrics] fill.effect on '${cfg.id ?? cfg.type}' skipped: the effects chunk is not loaded`);
    return null;
  }
  return ctx.effects.fillMaterial(effect, ctx, o);
}
