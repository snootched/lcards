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
import { labelItem, LABEL_STYLES } from './label-layer.js';
import { MARKERS, OBJECT_TYPES } from './names.js';
import { buildGrid } from './objects/grid.js';
import { buildVolume } from './objects/volume.js';
import { buildSphere } from './objects/sphere.js';
import { buildRing, buildPath, buildBeam } from './objects/lines.js';
import { buildImage, buildStars } from './objects/image.js';
import { buildGlow } from './objects/glow.js';
import { applyRotation, disposeNode, num } from './objects/common.js';
import { lcardsLog } from '../../utils/lcards-logging.js';

export { OBJECT_TYPES };
/** Builders of the objects points can stand on; line objects read points, so they come second */
const FIRST = { grid: buildGrid, volume: buildVolume, sphere: buildSphere, image: buildImage, glow: buildGlow };

/** Default label colours per style (CSS values: variables stay live) */
export const LABEL_COLORS = {
  title: 'var(--lcards-moonlight)',
  major: 'var(--lcards-moonlight)',
  minor: 'theme:colors.text.onDark',
  tiny: 'theme:colors.text.onDark',
  selected: 'theme:colors.status.error'
};

/**
 * @typedef {Object} AstroScene
 * @property {Scene} scene
 * @property {Map<string, import('./objects/common.js').BuiltObject>} objects - by id (objects without one get `type#n`, counted per type in config order)
 * @property {import('./objects/common.js').BuiltObject[]} list - in config order
 * @property {Map<import('./objects/common.js').BuiltObject, Group>} outer - each object's position / rotation group
 * @property {Placements} places
 * @property {any[]} pointDefs - generated + user, the user's last
 * @property {(import('./label-layer.js').LabelItem & { color: string, def: any })[]} labels
 * @property {import('./objects/common.js').BuiltObject | null} stars
 * @property {Sphere} bounds - of the objects (for a default view)
 * @property {() => void} layout - one frame's placement pass: matrices, objects on points (`at`), then what reads moving points
 * @property {() => void} dispose
 */

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
    list.push(b);
  };

  for (const cfg of cfgs) {
    const fn = FIRST[/** @type {keyof typeof FIRST} */ (cfg.type)];
    if (fn) add(cfg, (c) => fn(c, ctx));
    else if (!OBJECT_TYPES.includes(cfg.type)) lcardsLog.warn(`[Astrometrics] unknown object type '${cfg.type}'`);
  }

  /** @type {Map<string, import('./placements.js').PlacementHost>} */
  const hosts = new Map();
  for (const [id, b] of objects) hosts.set(id, { node: b.node, radius: b.radius, cellPoint: b.cellPoint, moving: b.spin !== 0 });
  const userPoints = Array.isArray(config?.points) ? config.points.filter((p) => p && typeof p === 'object' && p.id !== undefined) : [];
  const pointDefs = [...list.flatMap((b) => b.points), ...userPoints.map((p) => ({ ...p, id: String(p.id) }))];
  const places = new Placements({ points: pointDefs, hosts, sky: ctx.sky });
  ctx.places = places;

  for (const cfg of cfgs) {
    if (cfg.type === 'ring') add(cfg, (c) => buildRing(c, ctx));
    else if (cfg.type === 'path') add(cfg, (c) => buildPath(c, ctx, objects));
    else if (cfg.type === 'beam') add(cfg, (c) => buildBeam(c, ctx));
  }

  const stars = config?.backdrop?.stars ? buildStars(config.backdrop.stars === true ? {} : config.backdrop.stars, ctx) : null;
  if (stars) scene.add(stars.node);

  // Bounds before the first placement pass (a default view frames them)
  scene.updateMatrixWorld(true);
  const box = new Box3();
  for (const b of list) if (b.type in FIRST) box.expandByObject(b.node);
  const bounds = box.isEmpty() ? new Sphere(new Vector3(), 100) : box.getBoundingSphere(new Sphere());

  // Labels: the last definition of an id wins (the user's over generated ones)
  /** @type {Map<string, any>} */
  const byId = new Map();
  for (const p of pointDefs) byId.set(String(p.id), p);
  const labels = [];
  for (const def of byId.values()) {
    const marker = MARKERS.includes(def.marker) ? def.marker : 'none';
    const text = def.label === undefined || def.label === null ? '' : String(def.label);
    if (!text && marker === 'none') continue;
    const style = def.style && LABEL_STYLES[/** @type {keyof typeof LABEL_STYLES} */ (def.style)] ? def.style : 'minor';
    const item = labelItem({
      id: String(def.id),
      text,
      style,
      marker,
      priority: def.priority !== undefined ? num(def.priority, 0) : undefined,
      anchor: ['center', 'right', 'left'].includes(def.anchor) ? def.anchor : undefined,
      fade: Array.isArray(def.fade) && def.fade.length === 2 ? [num(def.fade[0], 0), num(def.fade[1], 1)] : null,
      minDistance: num(def.min_distance, 0),
      maxDistance: num(def.max_distance, Infinity),
      pickable: def.tap_action !== undefined ? def.tap_action?.action !== 'none' : marker !== 'none'
    });
    // labelItem fills undefined priority / anchor from the style and marker
    if (def.priority === undefined) item.priority = LABEL_STYLES[item.style].priority;
    if (!['center', 'right', 'left'].includes(def.anchor)) item.anchor = marker !== 'none' ? 'right' : 'center';
    labels.push({ ...item, color: cssColor(def.color, LABEL_COLORS[item.style]), def });
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
    bounds,
    layout,
    dispose() {
      for (const b of list) b.lines.forEach((l) => l.dispose());
      disposeNode(scene);
      scene.clear();
    }
  };
}
