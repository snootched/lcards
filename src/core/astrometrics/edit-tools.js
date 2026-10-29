/**
 * Edit-mode maths for the Astrometrics Studio, free of studio concepts:
 * which placement form a point drags in, where a drag on a placement plane
 * lands, how far a tap is from an object drawn only with lines (rings,
 * paths, beams), and an object's box in its own space (the selection box).
 *
 * @module core/astrometrics/edit-tools
 */
import { Box3, Matrix4, Vector3 } from 'three';
import { rayPlane } from './camera-rig.js';
import { pointBinding } from './placements.js';

const DEG = Math.PI / 180;

/** A tap this close (CSS px) to an object drawn with lines selects it */
export const SELECT_RADIUS = 24;

/** Forms a point drags in, in the order a point config is read; the last three need an `object` */
const DRAG_FORMS = /** @type {const} */ (['xyz', 'polar', 'latlon', 'altaz', 'cell']);
const HOSTED = new Set(['latlon', 'altaz', 'cell']);

/**
 * The placement form a point drags in, or null: `sky`, `at` and `part`
 * points, points an entity places, and surface forms without an object do
 * not drag.
 * @param {any} def - a point config
 * @returns {'xyz' | 'polar' | 'latlon' | 'altaz' | 'cell' | null}
 */
export function dragForm(def) {
  if (!def || typeof def !== 'object' || pointBinding(def)) return null;
  if (def.part !== undefined && def.part !== null && def.part !== '') return null;
  for (const form of DRAG_FORMS) {
    const v = def[form];
    const set = form === 'cell' ? typeof v === 'string' && v !== '' : Array.isArray(v);
    if (set) return HOSTED.has(form) && !def.object ? null : form;
  }
  return null;
}

const r1 = (/** @type {number} */ v) => Math.round(v * 10) / 10;

/**
 * A point's `offset` as a vector (world units, added after the placement).
 * @param {any} def
 */
function offsetOf(def) {
  const o = def?.offset;
  return Array.isArray(o) && o.length >= 3 ? new Vector3(+o[0] || 0, +o[1] || 0, +o[2] || 0) : new Vector3();
}

/**
 * An `xyz` or `polar` point dragged on its own horizontal plane: the plane at
 * the point's height (xyz y, polar `alt`) in its object's space (the scene
 * without one), so a drag keeps the height. The new value of the form, or
 * null when the ray misses the plane (seen edge on, or behind the camera).
 * @param {{ origin: number[], dir: number[] }} ray - world
 * @param {any} def - the point config
 * @param {'xyz' | 'polar'} form
 * @param {import('three').Object3D | null} [space] - the object points on it are local to
 * @param {number} [unit] - world units per unit of the point's own frame (its offset is in them)
 * @returns {number[] | null}
 */
export function planeDragValue(ray, def, form, space = null, unit = 1) {
  const height = form === 'xyz' ? (+def.xyz?.[1] || 0) : (Number(def.alt) || 0);
  const point = new Vector3(0, height, 0);
  const normal = new Vector3(0, 1, 0);
  if (space) {
    space.updateWorldMatrix(true, false);
    point.applyMatrix4(space.matrixWorld);
    normal.transformDirection(space.matrixWorld);
  }
  const offset = offsetOf(def).multiplyScalar(unit);
  point.add(offset);
  const hit = rayPlane(ray, point.toArray(), normal.toArray(), 0.02);
  if (!hit) return null;
  const local = new Vector3(hit[0], hit[1], hit[2]).sub(offset);
  if (space) space.worldToLocal(local);
  if (form === 'xyz') return [r1(local.x), def.xyz[1], r1(local.z)];
  const bearing = (((Math.atan2(local.x, -local.z) / DEG) % 360) + 360) % 360;
  return [r1(Math.hypot(local.x, local.z)), r1(bearing)];
}

/**
 * Distance (px) from (px, py) to the segment a-b.
 * @param {number} px
 * @param {number} py
 * @param {number} ax
 * @param {number} ay
 * @param {number} bx
 * @param {number} by
 */
export function segmentDistance(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 ? Math.min(1, Math.max(0, ((px - ax) * dx + (py - ay) * dy) / len2)) : 0;
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}

/**
 * A world position on screen (CSS px), or null behind the camera.
 * @param {Vector3} v - world (not changed)
 * @param {import('three').Camera} camera
 * @param {number} w
 * @param {number} h
 * @returns {[number, number] | null}
 */
export function toScreen(v, camera, w, h) {
  const p = v.clone().project(camera);
  if (!(p.z >= -1 && p.z <= 1)) return null;
  return [(p.x + 1) * 0.5 * w, (1 - p.y) * 0.5 * h];
}

/**
 * How far (CSS px) a spot is from an object drawn with lines: its lines'
 * segments and its middle, on screen. Infinity when none of it is in front.
 * @param {import('./objects/common.js').BuiltObject} b
 * @param {import('three').Camera} camera
 * @param {number} w
 * @param {number} h
 * @param {number} x
 * @param {number} y
 */
export function screenDistance(b, camera, w, h, x, y) {
  let best = Infinity;
  const c = b.centre ?? [0, 0, 0];
  const mid = toScreen(new Vector3(c[0], c[1], c[2]).applyMatrix4(b.node.matrixWorld), camera, w, h);
  if (mid) best = Math.hypot(x - mid[0], y - mid[1]);
  const a = new Vector3();
  const e = new Vector3();
  for (const l of b.lines) {
    if (!l.object.visible) continue;
    const pos = l.segmentPositions();
    const m = l.object.matrixWorld;
    for (let i = 0; i + 5 < pos.length; i += 6) {
      const sa = toScreen(a.set(pos[i], pos[i + 1], pos[i + 2]).applyMatrix4(m), camera, w, h);
      const sb = toScreen(e.set(pos[i + 3], pos[i + 4], pos[i + 5]).applyMatrix4(m), camera, w, h);
      if (!sa || !sb) continue;
      best = Math.min(best, segmentDistance(x, y, sa[0], sa[1], sb[0], sb[1]));
    }
  }
  return best;
}

/**
 * The box round everything drawn under `node`, in `node`'s own space (so a
 * box added to the node turns and moves with it). Empty when nothing has
 * geometry.
 * @param {import('three').Object3D} node
 * @param {(o: import('three').Object3D) => boolean} [skip] - leave these (and what is under them) out
 * @returns {Box3}
 */
export function localBox(node, skip) {
  node.updateWorldMatrix(true, true);
  const inv = new Matrix4().copy(node.matrixWorld).invert();
  const box = new Box3();
  const m = new Matrix4();
  /** @param {import('three').Object3D} o */
  const walk = (o) => {
    if (skip?.(o)) return;
    const g = /** @type {any} */ (o).geometry;
    if (g) {
      if (!g.boundingBox) g.computeBoundingBox?.();
      if (g.boundingBox && !g.boundingBox.isEmpty()) box.union(g.boundingBox.clone().applyMatrix4(m.multiplyMatrices(inv, o.matrixWorld)));
    }
    for (const child of o.children) walk(child);
  };
  walk(node);
  return box;
}

/**
 * A box's twelve edges as polylines (two loops and four uprights).
 * @param {Box3} box
 * @returns {number[][]}
 */
export function boxRuns(box) {
  const { min: a, max: b } = box;
  const loop = (/** @type {number} */ y) => [a.x, y, a.z, b.x, y, a.z, b.x, y, b.z, a.x, y, b.z, a.x, y, a.z];
  const up = (/** @type {number} */ x, /** @type {number} */ z) => [x, a.y, z, x, b.y, z];
  return [loop(a.y), loop(b.y), up(a.x, a.z), up(b.x, a.z), up(b.x, b.z), up(a.x, b.z)];
}
