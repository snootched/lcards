/**
 * Builds an astrometrics scene from config without a renderer (so tests can
 * build one headless): the objects, the placements over them, and the label
 * items for the points.
 *
 * Build order: objects that points can stand on (`grid`, `volume`,
 * `sphere`, `image`, `glow`), then the placements (generated points first, the
 * user's after, so a user point of the same id wins), then the line objects
 * that read points (`ring`, `path`, `beam`). Each object sits in an outer
 * group (its `at` position and `rotation`, turned along its point's travel
 * with `face: motion`, facing.js); the inner node spins.
 *
 * Systems (`type: system`, frames.js): the config is flattened first
 * (`flattenSystems`); each frame has a group in the scene, an object's outer
 * group goes into its frame's, and a system's group sits at its `at` point,
 * scaled to its units. Built with the scene's own frame current.
 *
 * @module core/astrometrics/scene-builder
 */
import { Scene, Group, Vector3, Box3, Sphere, Matrix4 } from 'three';
import { Placements } from './placements.js';
import { labelItem } from './label-layer.js';
import { resolveLabel, plainColor, selectedColor, fieldCss } from './label-text.js';
import { TemplateDetector } from '../templates/TemplateDetector.js';
import { MARKERS, OBJECT_TYPES, flattenSystems, systemScale, kmPerUnit } from './names.js';
import { Frames, ROOT } from './frames.js';
import { pointCard } from './card-layer.js';
import { buildGrid } from './objects/grid.js';
import { buildVolume } from './objects/volume.js';
import { buildSphere } from './objects/sphere.js';
import { buildRing, buildPath, buildBeam, buildTrail } from './objects/lines.js';
import { buildImage } from './objects/image.js';
import { buildStars, buildDust } from './objects/stars.js';
import { buildGlow } from './objects/glow.js';
import { buildBelt } from './objects/belt.js';
import { buildGalaxy } from './objects/galaxy.js';
import { applyRotation, disposeNode, num } from './objects/common.js';
import { localBounds } from './distance-fade.js';
import { Facing, spinTangent } from './facing.js';
import { lcardsLog } from '../../utils/lcards-logging.js';

export { OBJECT_TYPES };
/** Builders of the objects points can stand on; line objects read points, so they come second */
const FIRST = { grid: buildGrid, volume: buildVolume, sphere: buildSphere, image: buildImage, glow: buildGlow, belt: buildBelt, galaxy: buildGalaxy };

/**
 * @typedef {Object} AstroScene
 * @property {Scene} scene
 * @property {Map<string, import('./objects/common.js').BuiltObject>} objects - by id (objects without one get `type#n`, counted per type in config order)
 * @property {import('./objects/common.js').BuiltObject[]} list - in config order
 * @property {Map<import('./objects/common.js').BuiltObject, Group>} outer - each object's position / rotation group
 * @property {Placements} places
 * @property {any[]} pointDefs - generated + user, the user's last
 * @property {(import('./label-layer.js').LabelItem & { color: string, selectedColor: string, def: any, spec: import('./label-text.js').LabelSpec })[]} labels
 * @property {import('./objects/common.js').BuiltObject | null} stars
 * @property {import('./objects/common.js').BuiltObject | null} dust
 * @property {Sphere} bounds - of the objects (for a default view), scene units
 * @property {Frames} frames - the scene's frame and its systems'
 * @property {() => void} layout - one frame's placement pass: matrices, objects on points (`at`), then what reads moving points
 * @property {() => void} rebased - the current frame changed: placed again, and every line object drawn again from its points
 *   (a static one was drawn in the old frame's units, as precise as they were)
 * @property {(id: string, cfg: any) => boolean} rebuildObject - build one object again from a new config (a rule patch), in place; false for an unknown id
 * @property {() => void} dispose
 */

/**
 * What points on an object stand on.
 * @param {import('./objects/common.js').BuiltObject} b
 * @returns {import('./placements.js').PlacementHost}
 */
function hostOf(b) {
  return { node: b.placeNode ?? b.node, radius: b.radius, cellPoint: b.cellPoint, moving: b.spin !== 0 || b.moving === true, ready: b.isReady, partNode: b.partNode, warp: b.warp };
}

/**
 * The label item for a point, or null when it shows nothing (no text, no
 * marker, no card).
 * @param {any} def - the point config
 * @param {any} labelsCfg - the card's `labels`
 * @param {(value: any, fallback: string) => string} cssColor
 * @returns {(import('./label-layer.js').LabelItem & { color: string, selectedColor: string, def: any, spec: import('./label-text.js').LabelSpec }) | null}
 */
export function makeLabelItem(def, labelsCfg, cssColor) {
  const marker = MARKERS.includes(def.marker) ? def.marker : 'none';
  const spec = resolveLabel(def, labelsCfg);
  const card = pointCard(def);
  if (!spec.fields.length && marker === 'none' && !card) return null;
  const item = labelItem({
    id: String(def.id),
    style: spec.style,
    priority: spec.priority,
    overlap: spec.overlap,
    marker,
    fields: spec.fields.map((f) => ({
      name: f.name,
      position: f.position,
      css: fieldCss(f),
      // A template shows once the card has evaluated it (no raw {entity.state} flash)
      text: f.template && TemplateDetector.hasTemplates(f.content) ? '' : f.content,
      color: cssColor(plainColor(f.color), 'var(--lcards-moonlight)'),
      selectedColor: cssColor(selectedColor(f.color), 'var(--lcards-moonlight)'),
      ...(f.background !== undefined ? { background: cssColor(plainColor(f.background), 'transparent') } : {})
    })),
    fade: Array.isArray(def.fade) && def.fade.length === 2 ? [num(def.fade[0], 0), num(def.fade[1], 1)] : null,
    minDistance: num(def.min_distance, 0),
    maxDistance: num(def.max_distance, Infinity),
    anchor: card !== null,
    host: def.object !== undefined && def.object !== null ? String(def.object) : null,
    // A tap card opens on a tap, whatever the tap_action
    pickable: card?.show === 'tap' || (def.tap_action !== undefined ? def.tap_action?.action !== 'none' : marker !== 'none'),
    // a ship or a globe at the point makes it something to tap
    pickableWithObject: def.tap_action === undefined,
    leader: def.leader !== false
  });
  return {
    ...item,
    color: cssColor(plainColor(spec.color), 'var(--lcards-moonlight)'),
    selectedColor: cssColor(selectedColor(spec.color), 'var(--lcards-moonlight)'),
    def,
    spec
  };
}

/**
 * @param {any} config - the card config (`objects`, `points`, `backdrop`)
 * @param {import('./objects/common.js').BuildContext} ctx
 * @param {{ cssColor?: (value: any, fallback: string) => string }} [opts] - label colours (CSS)
 * @returns {AstroScene}
 */
export function buildScene(config, ctx, { cssColor = (v, f) => String(v ?? f) } = {}) {
  config = flattenSystems(config);
  const scene = new Scene();
  const frames = new Frames();
  /** @type {any[]} systems, parents first (config order) */
  const systems = [];
  for (const o of Array.isArray(config?.objects) ? config.objects : []) {
    if (o?.type !== 'system') continue;
    const parent = o._system ?? ROOT;
    const parentUnits = parent === ROOT ? config.units : systems.find((x) => x.id === parent)?.units;
    let k = systemScale(o, parentUnits);
    if (k === null) {
      lcardsLog.warn(`[Astrometrics] system '${o.id}': units ${o.units} need the scene's units (units: ly at the top), or give scale`);
      k = 1;
    }
    frames.add(String(o.id), parent, k);
    systems.push(o);
  }
  for (const f of frames.frames.values()) {
    scene.add(f.node);
    // a hidden system hides everything in it
    if (f.parent !== null) f.node.visible = systems.find((x) => String(x.id) === f.id)?.visible !== false;
  }
  frames.place();
  /** @param {string | undefined} sys */
  const unitsOf = (sys) => (sys ? systems.find((x) => String(x.id) === sys)?.units : config?.units);
  ctx.kmPerUnit = (sys) => kmPerUnit(unitsOf(sys));
  /** @type {Map<string, import('./objects/common.js').BuiltObject>} */
  const objects = new Map();
  /** @type {import('./objects/common.js').BuiltObject[]} */
  const list = [];
  /** @type {Map<import('./objects/common.js').BuiltObject, Group>} */
  const outer = new Map();
  const cfgs = Array.isArray(config?.objects) ? config.objects.filter((o) => o && typeof o === 'object') : [];
  const counts = /** @type {Record<string, number>} */ ({});

  /** @type {Map<string, (cfg: any) => import('./objects/common.js').BuiltObject>} how each object was built, by id */
  const builders = new Map();
  /** @param {any} cfg @param {(cfg: any) => import('./objects/common.js').BuiltObject} build */
  const add = (cfg, build) => {
    counts[cfg.type] = (counts[cfg.type] ?? 0) + 1;
    // An object without an id gets `type#n` (its generated points stand on it)
    if (cfg.id === undefined || cfg.id === null || cfg.id === '') cfg = { ...cfg, id: `${cfg.type}#${counts[cfg.type]}` };
    else if (objects.has(String(cfg.id))) lcardsLog.warn(`[Astrometrics] two objects with id '${cfg.id}': the later one wins in references`);
    let b;
    try {
      b = build(cfg);
    } catch (error) {
      lcardsLog.warn(`[Astrometrics] could not build ${cfg.type} '${cfg.id}':`, error);
      return;
    }
    const g = new Group();
    g.name = `at:${b.id}`;
    // a real body turns itself (bodyTurn): no rotation on top
    if (!b.onDate || cfg.body === undefined) applyRotation(g, cfg);
    g.add(b.node);
    if (cfg.visible === false) g.visible = false;
    frames.get(cfg._system).node.add(g);
    outer.set(b, g);
    objects.set(b.id, b);
    builders.set(b.id, build);
    list.push(b);
  };

  for (const cfg of cfgs) {
    const fn = FIRST[/** @type {keyof typeof FIRST} */ (cfg.type)];
    if (fn) add(cfg, (c) => fn(c, ctx));
    else if (cfg.type === 'nebula') {
      const effects = ctx.effects;
      if (effects) add(cfg, (c) => effects.buildNebula(c, ctx));
      else lcardsLog.warn('[Astrometrics] nebula skipped: the effects chunk is not loaded');
    } else if (cfg.type === 'cube') {
      const effects = ctx.effects;
      if (effects) add(cfg, (c) => effects.buildCube(c, ctx));
      else lcardsLog.warn('[Astrometrics] cube skipped: the effects chunk is not loaded');
    } else if (cfg.type === 'model') {
      const models = ctx.models;
      if (models) add(cfg, (c) => models.buildModel(c, ctx));
      else lcardsLog.warn('[Astrometrics] model skipped: the model chunk is not loaded');
    } else if (cfg.type !== 'system' && !OBJECT_TYPES.includes(cfg.type)) lcardsLog.warn(`[Astrometrics] unknown object type '${cfg.type}'`);
  }

  /** @type {Map<string, import('./placements.js').PlacementHost>} */
  const hosts = new Map();
  for (const [id, b] of objects) hosts.set(id, hostOf(b));
  const userPoints = Array.isArray(config?.points) ? config.points.filter((p) => p && typeof p === 'object' && p.id !== undefined) : [];
  const pointDefs = [...list.flatMap((b) => b.points), ...userPoints.map((p) => ({ ...p, id: String(p.id) }))];
  const places = new Placements({ points: pointDefs, hosts, sky: ctx.sky, frame: frames.nested ? (id) => frames.get(id).node : undefined, date: ctx.date, units: unitsOf });
  ctx.places = places;
  /**
   * What a point's motion is measured on (trails, `face: motion`): the outer
   * group of the object it stands on, which moves and turns with that object
   * but does not spin, so an orbit round a moving planet reads as an orbit.
   * Null for a point on nothing.
   * @param {any} id
   */
  const pointSpace = (id) => {
    const def = typeof id === 'string' ? places.defs.get(id) : undefined;
    const host = def?.object !== undefined ? objects.get(String(def.object)) : undefined;
    return (host && outer.get(host)) ?? null;
  };
  ctx.pointSpace = pointSpace;

  /**
   * Each system's origin from its `at` (a point, or [x, y, z]), in its
   * parent's units: read only while the parent is the current frame, where
   * scene units are the parent's own (exact). True when one moved.
   */
  const placeSystems = () => {
    let moved = false;
    for (const o of systems) {
      const f = frames.get(String(o.id));
      if (f.parent !== frames.current || o.at === undefined) continue;
      scene.updateMatrixWorld();
      places.invalidate();
      const p = places.resolve(o.at);
      if (!p) continue;
      const parent = frames.get(f.parent).node;
      const local = parent.worldToLocal(p.clone());
      if (local.x === f.origin[0] && local.y === f.origin[1] && local.z === f.origin[2]) continue;
      f.origin = [local.x, local.y, local.z];
      moved = true;
    }
    if (moved) {
      frames.place();
      scene.updateMatrixWorld();
      places.invalidate();
    }
    return moved;
  };
  placeSystems();

  for (const cfg of cfgs) {
    if (cfg.type === 'ring') add(cfg, (c) => buildRing(c, ctx));
    else if (cfg.type === 'path') add(cfg, (c) => buildPath(c, ctx, objects));
    else if (cfg.type === 'beam') add(cfg, (c) => buildBeam(c, ctx));
    else if (cfg.type === 'trail') add(cfg, (c) => buildTrail(c, ctx));
  }
  // Line objects need the placements to draw, so they come second; points can
  // still stand on them (a planet on its spinning orbit ring)
  for (const [id, b] of objects) if (!hosts.has(id)) hosts.set(id, hostOf(b));

  const stars = config?.backdrop?.stars ? buildStars(config.backdrop.stars === true ? {} : config.backdrop.stars, ctx) : null;
  if (stars) scene.add(stars.node);

  // Bounds before the first placement pass (a default view frames them)
  scene.updateMatrixWorld(true);
  const box = new Box3();
  for (const b of list) if (b.type in FIRST || b.type === 'nebula' || b.type === 'model' || b.type === 'cube') box.expandByObject(b.node);
  const bounds = box.isEmpty() ? new Sphere(new Vector3(), 100) : box.getBoundingSphere(new Sphere());

  // Dust round the scene (after the bounds: it fills them)
  const dust = config?.backdrop?.dust
    ? buildDust(config.backdrop.dust === true ? {} : config.backdrop.dust, ctx, { center: bounds.center.toArray(), radius: bounds.radius })
    : null;
  if (dust) frames.get(ROOT).node.add(dust.node);

  // Labels: the last definition of an id wins (the user's over generated ones)
  /** @type {Map<string, any>} */
  const byId = new Map();
  for (const p of pointDefs) byId.set(String(p.id), p);
  const labels = [];
  for (const def of byId.values()) {
    const item = makeLabelItem(def, config?.labels, cssColor);
    if (item) labels.push(item);
  }

  // Objects still loading (models): when one is in, the static line objects
  // draw again, so a path ending on one of its parts appears
  /** @type {import('./objects/common.js').BuiltObject[]} */
  let loading = list.filter((b) => b.isReady && !b.isReady());

  /** @type {Map<import('./objects/common.js').BuiltObject, Facing>} objects with `face: motion` */
  const facing = new Map();
  const toLocal = new Matrix4();
  /**
   * Turn the `face: motion` objects along their points' travel. The travel
   * is measured on what the point stands on (its object's outer group:
   * placed and turned, not spun), so a ship circling a planet that is itself
   * on an orbit faces round the planet, not along the planet's way; a point
   * on nothing is measured in the object's parent group.
   * @returns {boolean} whether one turned
   */
  const face = () => {
    let turned = false;
    for (const [b, g] of outer) {
      if (b.config.face !== 'motion' || b.config.at === undefined) continue;
      const world = places.resolve(b.config.at);
      if (!world) continue;
      let f = facing.get(b);
      if (!f) facing.set(b, (f = new Facing()));
      const def = typeof b.config.at === 'string' ? places.defs.get(b.config.at) : undefined;
      const host = def?.object !== undefined ? objects.get(String(def.object)) : undefined;
      const ref = pointSpace(b.config.at) ?? g.parent;
      f.move(ref ? ref.worldToLocal(world.clone()) : world.clone());
      // the heading in world space: the measured one, else along a spinning host
      const dir = f.dir ? (ref ? f.dir.clone().transformDirection(ref.matrixWorld) : f.dir.clone()) : host?.spin ? spinTangent(world, host.node, host.spin) : null;
      // into the object's parent (frames are only scaled and moved, so a direction keeps its way)
      if (dir && g.parent) dir.transformDirection(toLocal.copy(g.parent.matrixWorld).invert());
      if (f.orient(g, b.config, dir)) turned = true;
    }
    return turned;
  };

  const layout = () => {
    scene.updateMatrixWorld();
    places.invalidate();
    let placed = systems.length ? placeSystems() : false;
    for (const [b, g] of outer) {
      if (b.config.at === undefined) continue;
      let p = places.resolve(b.config.at);
      // in its frame's units (the frame's group is identity for the current frame)
      if (p && b.config._system !== undefined && g.parent) p = g.parent.worldToLocal(p.clone());
      if (p && !g.position.equals(p)) {
        g.position.copy(p);
        placed = true;
      }
    }
    if (placed) {
      scene.updateMatrixWorld();
      places.invalidate();
    }
    // after placing, so the point and what it stands on are read in the same frame
    if (face()) {
      scene.updateMatrixWorld();
      places.invalidate();
    }
    for (const b of list) if (b.dynamic) b.update?.();
    if (loading.some((b) => b.isReady?.())) {
      loading = loading.filter((b) => !b.isReady?.());
      for (const b of list) if (!b.dynamic) b.update?.();
    }
    scene.updateMatrixWorld();
  };
  // First pass: everything placed, every line object filled once
  layout();
  for (const b of list) if (!b.dynamic) b.update?.();
  scene.updateMatrixWorld();

  // How far each system's contents reach from its origin (its own units): the camera works in it inside a few times that
  for (const o of systems) {
    const f = frames.get(String(o.id));
    // the union of its meshes' and lines' own spheres, local to its group (own units)
    const s = localBounds(f.node);
    let r = s.radius > 0 ? s.center.length() + s.radius : 0;
    for (const p of pointDefs) {
      if (p._system !== f.id) continue;
      const v = places.get(String(p.id));
      if (v) r = Math.max(r, f.node.worldToLocal(v.clone()).length());
    }
    f.radius = r;
  }

  return {
    scene,
    objects,
    list,
    outer,
    places,
    pointDefs,
    labels,
    stars,
    dust,
    bounds,
    frames,
    layout,
    rebased() {
      layout();
      for (const b of list) if (!b.dynamic) b.update?.();
      scene.updateMatrixWorld();
    },
    rebuildObject(id, cfg) {
      const old = objects.get(id);
      const build = builders.get(id);
      const g = old ? outer.get(old) : undefined;
      if (!old || !build || !g) return false;
      let b;
      try {
        b = build({ ...cfg, id });
      } catch (error) {
        lcardsLog.warn(`[Astrometrics] could not rebuild ${cfg.type} '${id}':`, error);
        return false;
      }
      g.remove(old.node);
      old.dispose?.();
      old.lines.forEach((l) => l.dispose());
      disposeNode(old.node);
      g.rotation.set(0, 0, 0);
      applyRotation(g, cfg);
      g.visible = cfg.visible !== false;
      g.add(b.node);
      outer.delete(old);
      outer.set(b, g);
      loading = loading.filter((x) => x !== old);
      if (b.isReady && !b.isReady()) loading.push(b);
      objects.set(id, b);
      list[list.indexOf(old)] = b;
      hosts.set(id, hostOf(b));
      scene.updateMatrixWorld(true);
      places.invalidate();
      if (!b.dynamic) b.update?.();
      return true;
    },
    dispose() {
      for (const b of list) {
        b.dispose?.();
        b.lines.forEach((l) => l.dispose());
      }
      disposeNode(scene);
      scene.clear();
    }
  };
}
