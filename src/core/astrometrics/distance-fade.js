/**
 * Distance visibility, shared by points and objects: `fade: [start, end]`,
 * `min_distance`, `max_distance`, in scene units from the camera. A point's
 * distance is to the point; an object's is to the nearest edge of its
 * bounding sphere (0 with the camera inside), which is the same rule for a
 * radius of 0. A flat object (a plane or disc grid) is measured to its box
 * instead, so a camera above a galactic disc is as far away as its height. The range edges fade over 10 % instead of popping, so two
 * things with touching ranges cross-fade.
 *
 * `ObjectFader` applies it to objects for one render: it hides the ones out
 * of range and scales the opacity of the partly faded ones, then puts every
 * material back, so builders that write their own opacity (a pulsing
 * placeholder, a recoloured line) keep working.
 *
 * @module core/astrometrics/distance-fade
 */
import { Box3, Matrix4, Sphere, Vector3 } from 'three';
import { num } from './objects/common.js';

/** @typedef {{ fade: [number, number] | null, minDistance: number, maxDistance: number }} DistanceRange */

/**
 * The range from a point or object config; null when it sets none.
 * @param {any} def
 * @returns {DistanceRange | null}
 */
export function distanceRange(def) {
  const fade = Array.isArray(def?.fade) && def.fade.length === 2 ? /** @type {[number, number]} */ ([num(def.fade[0], 0), num(def.fade[1], 1)]) : null;
  const minDistance = num(def?.min_distance, 0);
  const maxDistance = num(def?.max_distance, Infinity);
  if (!fade && !(minDistance > 0) && !Number.isFinite(maxDistance)) return null;
  return { fade, minDistance, maxDistance };
}

/**
 * Opacity factor 0..1 at a distance.
 * @param {DistanceRange} r
 * @param {number} dist
 */
export function distanceAlpha(r, dist) {
  let a = 1;
  if (r.fade) {
    const [f0, f1] = r.fade;
    a *= 1 - Math.min(1, Math.max(0, (dist - f0) / Math.max(1e-6, f1 - f0)));
  }
  if (Number.isFinite(r.maxDistance)) a *= Math.min(1, Math.max(0, (r.maxDistance * 1.1 - dist) / (r.maxDistance * 0.1)));
  if (r.minDistance > 0) a *= Math.min(1, Math.max(0, (dist - r.minDistance * 0.9) / (r.minDistance * 0.1)));
  return a;
}

/** Below this an object is not drawn at all (as a label is not) */
export const HIDDEN_ALPHA = 0.02;

/**
 * Distance from a position to the nearest edge of a sphere, 0 inside it.
 * @param {Vector3} from
 * @param {Vector3} center
 * @param {number} radius
 */
export function sphereDistance(from, center, radius) {
  return Math.max(0, from.distanceTo(center) - radius);
}

/**
 * An object's bounding sphere local to its node (so spin and `at` motion
 * move it for free): the union of its meshes' own bounding spheres (exact
 * for a planet, where the sphere round a box would be 1.7 times too big).
 * @param {import('three').Object3D} node
 * @returns {Sphere}
 */
export function localBounds(node) {
  node.updateWorldMatrix(true, true);
  const out = new Sphere(new Vector3(), -1);
  const s = new Sphere();
  node.traverse((o) => {
    const m = /** @type {any} */ (o);
    let own = null;
    if (m.isInstancedMesh) {
      if (!m.boundingSphere) m.computeBoundingSphere();
      own = m.boundingSphere;
    } else if (m.geometry) {
      if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere();
      own = m.geometry.boundingSphere;
    }
    if (!own || !(own.radius >= 0) || !Number.isFinite(own.radius)) return;
    s.copy(own).applyMatrix4(m.matrixWorld);
    if (out.radius < 0) out.copy(s);
    else out.union(s);
  });
  if (out.radius < 0) return new Sphere(new Vector3(), 0);
  node.worldToLocal(out.center);
  // radius in the node's own units (a system's frame scales it)
  out.radius /= node.matrixWorld.getMaxScaleOnAxis() || 1;
  return out;
}

/**
 * An object's bounding box local to its node, for a flat one (`flat`).
 * @param {import('three').Object3D} node
 * @returns {Box3}
 */
export function localBox(node) {
  node.updateWorldMatrix(true, true);
  const inv = new Matrix4().copy(node.matrixWorld).invert();
  const out = new Box3();
  const b = new Box3();
  const m = new Matrix4();
  node.traverse((o) => {
    const g = /** @type {any} */ (o).geometry;
    if (!g?.getAttribute?.('position')) return;
    if (!g.boundingBox) g.computeBoundingBox();
    if (!g.boundingBox || g.boundingBox.isEmpty()) return;
    out.union(b.copy(g.boundingBox).applyMatrix4(m.multiplyMatrices(inv, o.matrixWorld)));
  });
  return out.isEmpty() ? out.setFromCenterAndSize(new Vector3(), new Vector3()) : out;
}

/**
 * Each object's bounding sphere, measured once (again for a dynamic object,
 * and when a model finishes loading), placed in the world per call. Shared
 * by the fader and the depth passes.
 */
export class ObjectBounds {
  constructor() {
    /** @type {WeakMap<import('./objects/common.js').BuiltObject, { sphere: Sphere, ready: boolean }>} */
    this._map = new WeakMap();
    /** @type {WeakMap<import('./objects/common.js').BuiltObject, Box3>} */
    this._boxes = new WeakMap();
    this._center = new Vector3();
    this._local = new Vector3();
    this._inv = new Matrix4();
  }

  /**
   * Distance from a world position to the object: to its box when it is
   * flat, else to its sphere; 0 inside.
   * @param {import('./objects/common.js').BuiltObject} b
   * @param {Vector3} from
   */
  distance(b, from) {
    if (b.flat) {
      let box = this._boxes.get(b);
      if (!box) {
        box = localBox(b.node);
        this._boxes.set(b, box);
      }
      const m = b.node.matrixWorld;
      const local = this._local.copy(from).applyMatrix4(this._inv.copy(m).invert());
      return box.distanceToPoint(local) * m.getMaxScaleOnAxis();
    }
    const { center, radius } = this.world(b);
    return sphereDistance(from, center, radius);
  }

  /**
   * The sphere in world space now (the centre is reused: read it before the next call).
   * @param {import('./objects/common.js').BuiltObject} b
   * @returns {{ center: Vector3, radius: number }}
   */
  world(b) {
    const ready = b.isReady?.() ?? true;
    let cached = this._map.get(b);
    // A line object between moving points changes shape; a model grows when it loads
    if (!cached || b.dynamic || cached.ready !== ready) {
      cached = { sphere: localBounds(b.node), ready };
      this._map.set(b, cached);
    }
    const m = b.node.matrixWorld;
    return { center: this._center.copy(cached.sphere.center).applyMatrix4(m), radius: cached.sphere.radius * m.getMaxScaleOnAxis() };
  }
}

/**
 * Per frame: `begin` before the render, `end` after it.
 */
export class ObjectFader {
  /** @param {ObjectBounds} [bounds] */
  constructor(bounds = new ObjectBounds()) {
    /** @type {WeakMap<object, { range: DistanceRange | null }>} parsed ranges, by config */
    this._ranges = new WeakMap();
    this._bounds = bounds;
    /** @type {{ mat: any, opacity: number, transparent: boolean, depthWrite: boolean, uniform: number | undefined }[]} */
    this._saved = [];
    /** @type {Map<string, number>} last factor by object id (tests, debug) */
    this.alphas = new Map();
  }

  /**
   * @param {import('./objects/common.js').BuiltObject[]} list
   * @param {Map<import('./objects/common.js').BuiltObject, import('three').Group>} outer
   * @param {Vector3} camera - its world position
   * @param {(b: import('./objects/common.js').BuiltObject) => number} [unit] - world units per unit of the
   *   object's own frame (its distances are in its system's units)
   */
  begin(list, outer, camera, unit = () => 1) {
    this.alphas.clear();
    for (const b of list) {
      const range = this._range(b.config);
      if (!range) continue;
      const g = outer.get(b);
      if (!g) continue;
      const a = distanceAlpha(range, this._distance(b, camera) / unit(b));
      this.alphas.set(b.id, a);
      g.visible = b.config.visible !== false && a > HIDDEN_ALPHA;
      if (g.visible && a < 1) this._scale(b.node, a);
    }
  }

  /** Every material back as it was */
  end() {
    // last saved first: anything saved twice ends at its first, unscaled value
    for (let i = this._saved.length - 1; i >= 0; i--) {
      const s = this._saved[i];
      s.mat.opacity = s.opacity;
      s.mat.depthWrite = s.depthWrite;
      if (s.mat.transparent !== s.transparent) {
        s.mat.transparent = s.transparent;
        if (!s.mat.isShaderMaterial) s.mat.needsUpdate = true;
      }
      if (s.uniform !== undefined) s.mat.uniforms.uOpacity.value = s.uniform;
    }
    this._saved.length = 0;
  }

  /** @param {any} cfg @private */
  _range(cfg) {
    let r = this._ranges.get(cfg);
    if (!r) {
      r = { range: distanceRange(cfg) };
      this._ranges.set(cfg, r);
    }
    return r.range;
  }

  /**
   * @param {import('./objects/common.js').BuiltObject} b
   * @param {Vector3} camera
   * @private
   */
  _distance(b, camera) {
    return this._bounds.distance(b, camera);
  }

  /**
   * Scale every material under a node by a, once each (a material can be on many meshes).
   * @param {import('three').Object3D} node
   * @param {number} a
   * @private
   */
  _scale(node, a) {
    /** @type {Set<any>} */
    const seen = new Set();
    node.traverseVisible((o) => {
      const m = /** @type {any} */ (o).material;
      for (const mat of Array.isArray(m) ? m : m ? [m] : []) {
        if (seen.has(mat)) continue;
        seen.add(mat);
        // a uniform can be shared by materials (a grid's front and back faces): scale it once
        const u = mat.uniforms?.uOpacity && !seen.has(mat.uniforms.uOpacity) ? mat.uniforms.uOpacity : undefined;
        if (u) seen.add(u);
        this._saved.push({ mat, opacity: mat.opacity, transparent: mat.transparent, depthWrite: mat.depthWrite, uniform: u ? u.value : undefined });
        // see-through while it fades: what is behind shows, not a darker body
        mat.depthWrite = false;
        // A solid body blends only while it fades, so a still scene draws as before
        // (three's own materials compile opaque ones with alpha 1: a new program)
        if (!mat.transparent) {
          mat.transparent = true;
          if (!mat.isShaderMaterial) mat.needsUpdate = true;
        }
        if (u) u.value *= a;
        else if (!mat.uniforms?.uOpacity) mat.opacity *= a;
      }
    });
  }
}
