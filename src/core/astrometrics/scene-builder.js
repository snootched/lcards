/**
 * Builds an astrometrics scene from config without a renderer (so tests can
 * build one headless): the objects, the placements over them, and the label
 * items for the points.
 *
 * Build order: objects that points can stand on (`grid`, `volume`,
 * `sphere`, `image`, `glow`), then the placements (generated points first, the
 * user's after, so a user point of the same id wins), then the line objects
 * that read points (`ring`, `path`, `beam`). Each object sits in an outer
 * group (its `at` position and `rotation`); the inner node spins.
 *
 * @module core/astrometrics/scene-builder
 */
import { Scene, Group, Vector3, Box3, Sphere } from 'three';
import { Placements } from './placements.js';
import { labelItem } from './label-layer.js';
import { resolveLabel, plainColor, selectedColor, fieldCss } from './label-text.js';
import { TemplateDetector } from '../templates/TemplateDetector.js';
import { MARKERS, OBJECT_TYPES } from './names.js';
import { pointCard } from './card-layer.js';
import { buildGrid } from './objects/grid.js';
import { buildVolume } from './objects/volume.js';
import { buildSphere } from './objects/sphere.js';
import { buildRing, buildPath, buildBeam, buildTrail } from './objects/lines.js';
import { buildImage } from './objects/image.js';
import { buildStars, buildDust } from './objects/stars.js';
import { buildGlow } from './objects/glow.js';
import { buildBelt } from './objects/belt.js';
import { applyRotation, disposeNode, num } from './objects/common.js';
import { lcardsLog } from '../../utils/lcards-logging.js';

export { OBJECT_TYPES };
/** Builders of the objects points can stand on; line objects read points, so they come second */
const FIRST = { grid: buildGrid, volume: buildVolume, sphere: buildSphere, image: buildImage, glow: buildGlow, belt: buildBelt };

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
 * @property {Sphere} bounds - of the objects (for a default view)
 * @property {() => void} layout - one frame's placement pass: matrices, objects on points (`at`), then what reads moving points
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
    pickable: card?.show === 'tap' || (def.tap_action !== undefined ? def.tap_action?.action !== 'none' : marker !== 'none')
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
  const scene = new Scene();
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
    applyRotation(g, cfg);
    g.add(b.node);
    if (cfg.visible === false) g.visible = false;
    scene.add(g);
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
    } else if (cfg.type === 'model') {
      const models = ctx.models;
      if (models) add(cfg, (c) => models.buildModel(c, ctx));
      else lcardsLog.warn('[Astrometrics] model skipped: the model chunk is not loaded');
    } else if (!OBJECT_TYPES.includes(cfg.type)) lcardsLog.warn(`[Astrometrics] unknown object type '${cfg.type}'`);
  }

  /** @type {Map<string, import('./placements.js').PlacementHost>} */
  const hosts = new Map();
  for (const [id, b] of objects) hosts.set(id, hostOf(b));
  const userPoints = Array.isArray(config?.points) ? config.points.filter((p) => p && typeof p === 'object' && p.id !== undefined) : [];
  const pointDefs = [...list.flatMap((b) => b.points), ...userPoints.map((p) => ({ ...p, id: String(p.id) }))];
  const places = new Placements({ points: pointDefs, hosts, sky: ctx.sky });
  ctx.places = places;

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
  for (const b of list) if (b.type in FIRST || b.type === 'nebula' || b.type === 'model') box.expandByObject(b.node);
  const bounds = box.isEmpty() ? new Sphere(new Vector3(), 100) : box.getBoundingSphere(new Sphere());

  // Dust round the scene (after the bounds: it fills them)
  const dust = config?.backdrop?.dust
    ? buildDust(config.backdrop.dust === true ? {} : config.backdrop.dust, ctx, { center: bounds.center.toArray(), radius: bounds.radius })
    : null;
  if (dust) scene.add(dust.node);

  // Labels: the last definition of an id wins (the user's over generated ones)
  /** @type {Map<string, any>} */
  const byId = new Map();
  for (const p of pointDefs) byId.set(String(p.id), p);
  const labels = [];
  for (const def of byId.values()) {
    const item = makeLabelItem(def, config?.labels, cssColor);
    if (item) labels.push(item);
  }

  const layout = () => {
    scene.updateMatrixWorld();
    places.invalidate();
    let placed = false;
    for (const [b, g] of outer) {
      if (b.config.at === undefined) continue;
      const p = places.resolve(b.config.at);
      if (p && !g.position.equals(p)) {
        g.position.copy(p);
        placed = true;
      }
    }
    if (placed) {
      scene.updateMatrixWorld();
      places.invalidate();
    }
    for (const b of list) if (b.dynamic) b.update?.();
    scene.updateMatrixWorld();
  };
  // First pass: everything placed, every line object filled once
  layout();
  for (const b of list) if (!b.dynamic) b.update?.();
  scene.updateMatrixWorld();

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
    layout,
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
