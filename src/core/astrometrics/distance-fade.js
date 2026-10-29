/**
 * Distance visibility, shared by points and objects: `fade: [start, end]`,
 * `min_distance`, `max_distance`, in scene units from the camera. A point's
 * distance is to the point; an object's is to the nearest edge of its
 * bounding sphere (0 with the camera inside), which is the same rule for a
 * radius of 0. The range edges fade over 10 % instead of popping, so two
 * things with touching ranges cross-fade.
 *
 * `ObjectFader` applies it to objects for one render: it hides the ones out
 * of range and scales the opacity of the partly faded ones, then puts every
 * material back, so builders that write their own opacity (a pulsing
 * placeholder, a recoloured line) keep working.
 *
 * @module core/astrometrics/distance-fade
 */
import { Sphere, Vector3 } from 'three';
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
  // radius in the node's units (an `at` group never scales)
  return out;
}

/**
 * Per frame: `begin` before the render, `end` after it.
 */
export class ObjectFader {
  constructor() {
    /** @type {WeakMap<object, { range: DistanceRange | null }>} parsed ranges, by config */
    this._ranges = new WeakMap();
    /** @type {WeakMap<import('./objects/common.js').BuiltObject, { sphere: Sphere, ready: boolean }>} */
    this._bounds = new WeakMap();
    /** @type {{ mat: any, opacity: number, transparent: boolean, depthWrite: boolean, uniform: number | undefined }[]} */
    this._saved = [];
    this._center = new Vector3();
    /** @type {Map<string, number>} last factor by object id (tests, debug) */
    this.alphas = new Map();
  }

  /**
   * @param {import('./objects/common.js').BuiltObject[]} list
   * @param {Map<import('./objects/common.js').BuiltObject, import('three').Group>} outer
   * @param {Vector3} camera - its world position
   */
  begin(list, outer, camera) {
    this.alphas.clear();
    for (const b of list) {
      const range = this._range(b.config);
      if (!range) continue;
      const g = outer.get(b);
      if (!g) continue;
      const a = distanceAlpha(range, this._distance(b, camera));
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
    const ready = b.isReady?.() ?? true;
    let cached = this._bounds.get(b);
    // A line object between moving points changes shape; a model grows when it loads
    if (!cached || b.dynamic || cached.ready !== ready) {
      cached = { sphere: localBounds(b.node), ready };
      this._bounds.set(b, cached);
    }
    const c = this._center.copy(cached.sphere.center).applyMatrix4(b.node.matrixWorld);
    return sphereDistance(camera, c, cached.sphere.radius);
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
