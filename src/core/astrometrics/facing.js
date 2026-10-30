/**
 * `face: motion` on objects: an object `at` a moving point turns to face
 * where it is going, its +z (a built-in model's bow) along the travel, its
 * +y as near the scene's up as that allows. The object's `rotation` applies
 * on top, as the model's own correction (a file whose bow is along +x).
 *
 * The heading is the point's movement since the last one big enough to
 * trust, measured on what the point stands on (the scene builder passes
 * positions in that object's outer group), so an orbit round a moving
 * planet reads as an orbit, and a frame change does not turn it.
 * Before the point has moved, and while motion is held (reduced motion
 * holds spin), a point standing on a spinning object faces along the spin;
 * else the object keeps its `rotation` until the point first moves.
 *
 * `face: <point id>` turns an object toward a point instead: its +z, or
 * down its axis (-y: a well's throat) for a round object (`axisFacing`).
 *
 * @module core/astrometrics/facing
 */
import { Euler, MathUtils, Matrix4, Quaternion, Vector3 } from 'three';
import { num } from './objects/common.js';

/** Movement under this fraction of the distance from the origin is noise (float32-sized steps far out) */
const MIN_STEP = 1e-6;

const ZERO = new Vector3();
const UP = new Vector3(0, 1, 0);

/**
 * The quaternion of a `rotation` config, as `applyRotation` sets it.
 * @param {any} config
 */
export function rotationQuaternion(config) {
  const r = Array.isArray(config?.rotation) ? config.rotation : null;
  const e = new Euler(0, 0, 0, 'YXZ');
  if (r) e.set(MathUtils.degToRad(num(r[0], 0)), -MathUtils.degToRad(num(r[1], 0)), MathUtils.degToRad(num(r[2], 0)));
  return new Quaternion().setFromEuler(e);
}

/**
 * Which way a point standing on a spinning object moves: along the spin,
 * round the object's own y axis (world, unit length), or null.
 * @param {Vector3} point - world
 * @param {import('three').Object3D} host - the spinning node
 * @param {number} spin - degrees per second (positive: anticlockwise seen from above)
 * @returns {Vector3 | null}
 */
export function spinTangent(point, host, spin) {
  if (!spin) return null;
  host.updateWorldMatrix(true, false);
  const axis = UP.clone().transformDirection(host.matrixWorld);
  const r = point.clone().sub(new Vector3().setFromMatrixPosition(host.matrixWorld));
  const t = axis.cross(r);
  if (t.lengthSq() === 0) return null;
  return t.normalize().multiplyScalar(Math.sign(spin));
}

const DOWN = new Vector3(0, -1, 0);

/**
 * The object's own direction that `face: <point id>` turns toward the
 * point: down the axis (-y) for an object round an axis (a grid other than
 * a plane, a ring, a belt, a galaxy), so a well's throat leads to it and a
 * disc lies across the way to it; null (+z, upright) for the rest.
 * @param {any} config
 * @returns {Vector3 | null}
 */
export function axisFacing(config) {
  const round = ['ring', 'belt', 'galaxy'].includes(config?.type) || (config?.type === 'grid' && (config.shape ?? 'plane') !== 'plane');
  return round ? DOWN : null;
}

/**
 * Per object: where its point was, and the heading.
 */
export class Facing {
  constructor() {
    /** @type {Vector3 | null} */
    this.anchor = null;
    /** @type {Vector3 | null} the travel direction, parent units (unit length) */
    this.dir = null;
    this._m = new Matrix4();
    this._q = new Quaternion();
  }

  /**
   * The point is at `p` now (the object's parent group's units).
   * @param {Vector3} p
   * @returns {boolean} whether the heading changed
   */
  move(p) {
    if (!this.anchor) {
      this.anchor = p.clone();
      return false;
    }
    const d = p.clone().sub(this.anchor);
    const len = d.length();
    if (!(len > MIN_STEP * Math.max(1, p.length()))) return false;
    this.dir = d.divideScalar(len);
    this.anchor.copy(p);
    return true;
  }

  /**
   * Turn the object's outer group along `dir` (its parent's space), with its
   * `rotation` on top. True when it turned (false without a direction: it
   * keeps its `rotation`).
   * @param {import('three').Object3D} group
   * @param {any} config
   * @param {Vector3 | null} dir
   * @param {Vector3 | null} [axis] - the object's own direction to turn along dir (default: +z, upright)
   */
  orient(group, config, dir, axis = null) {
    if (!dir) return false;
    if (axis) this._q.setFromUnitVectors(axis, dir.clone().normalize());
    else {
      // lookAt(eye, target, up) points +z from target to eye: here along dir
      this._m.lookAt(dir, ZERO, UP);
      this._q.setFromRotationMatrix(this._m);
    }
    this._q.multiply(rotationQuaternion(config));
    if (group.quaternion.equals(this._q)) return false;
    group.quaternion.copy(this._q);
    return true;
  }
}
