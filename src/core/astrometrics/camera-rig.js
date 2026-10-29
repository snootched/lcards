/**
 * Astrometrics camera rig: the camera is a pure function of seven keys
 * (target x/y/z, yaw, tilt, distance, fov) plus a projection. A view is a set
 * of keys, a drag edits yaw and tilt (or pans the target), wheel and pinch
 * edit the distance, limits clamp, and a fly-to is one anime.js tween of a
 * progress value the keys follow from the flight's two ends.
 *
 * The tween is built with `autoplay: false` and **seeked from the scene's
 * frame loop** (`step(now)`), as the background effects do: requesting a
 * frame from anime's own update drew only every other vsync. Yaw takes the
 * short way round. Under reduced motion a fly-to jumps.
 *
 * Orientation: yaw 0 puts the camera south of the target (+z) looking north
 * (-z); yaw turns it clockwise seen from above; tilt 90 looks straight down.
 * The camera turns with a YXZ Euler (yaw, then -tilt), so tilt 90 is as well
 * defined as any other.
 *
 * @module core/astrometrics/camera-rig
 */
import { PerspectiveCamera, OrthographicCamera } from 'three';
import { animate, utils } from 'animejs';
import { resolveEasing } from '../../utils/lcards-anim-helpers.js';
import { prefersReducedMotion } from '../../utils/reduced-motion.js';
import { classifyWheel, wheelAction, wheelZoomFactor } from './wheel-input.js';

const DEG = Math.PI / 180;

/** @typedef {{ tx: number, ty: number, tz: number, yaw: number, tilt: number, distance: number, fov: number }} CameraKeys */
/**
 * Where the target may go: a sphere, or a box (an axis left out is free).
 * @typedef {{ center: [number, number, number], radius: number } | { x?: [number, number], y?: [number, number], z?: [number, number] }} TargetLimit
 */
/** @typedef {{ tilt: [number, number], distance: [number, number], yaw: [number, number] | null, target: TargetLimit | null }} CameraLimits */
/**
 * Held motion (buttons, keys): per second, in view heights (pan, x right and
 * y up, the view moves), zoom steps (1 halves the distance at zoom_step 2) and
 * degrees (orbit: yaw, tilt).
 * @typedef {{ pan?: [number, number], zoom?: number, orbit?: [number, number] }} CameraMotion
 */

/** @type {CameraKeys} */
export const DEFAULT_KEYS = { tx: 0, ty: 0, tz: 0, yaw: 20, tilt: 35, distance: 260, fov: 40 };

/** @type {CameraLimits} */
export const DEFAULT_LIMITS = { tilt: [-90, 90], distance: [1, 100000], yaw: null, target: null };

/** The default target limit is a sphere this many times the scene's radius */
export const TARGET_LIMIT_SCALE = 1.5;

/**
 * `to` moved by whole turns so that going from `from` to it is the short way.
 * @param {number} from
 * @param {number} to
 */
export function shortestYaw(from, to) {
  const d = ((((to - from) % 360) + 540) % 360) - 180;
  return from + d;
}

/**
 * Camera position and Euler angles (radians, order YXZ) for a set of keys.
 * @param {CameraKeys} k
 * @returns {{ position: [number, number, number], rotation: { x: number, y: number }, forward: [number, number, number] }}
 */
export function cameraPose(k) {
  const t = k.tilt * DEG;
  const y = k.yaw * DEG;
  const ct = Math.cos(t);
  const off = [ct * Math.sin(y), Math.sin(t), ct * Math.cos(y)];
  return {
    position: [k.tx + k.distance * off[0], k.ty + k.distance * off[1], k.tz + k.distance * off[2]],
    rotation: { x: -t, y },
    forward: [-off[0], -off[1], -off[2]]
  };
}

/**
 * The camera's screen right and up as world vectors (unit length).
 * @param {CameraKeys} k
 * @returns {{ right: [number, number, number], up: [number, number, number] }}
 */
export function screenBasis(k) {
  const t = k.tilt * DEG;
  const y = k.yaw * DEG;
  return {
    right: [Math.cos(y), 0, -Math.sin(y)],
    up: [-Math.sin(t) * Math.sin(y), Math.cos(t), -Math.sin(t) * Math.cos(y)]
  };
}

/**
 * The widest view, width over height: on a wider card the vertical field of
 * view narrows so the view is no wider than at this shape. A 40 degree view
 * on a 5:1 card would be about 122 degrees across, and spheres near its
 * edges would stretch out from the centre (wide-angle distortion).
 */
export const MAX_VIEW_ASPECT = 2;

/**
 * The vertical field of view drawn for `fov` on a card of `aspect` (w / h):
 * `fov` up to MAX_VIEW_ASPECT, narrower beyond it.
 * @param {number} fov - degrees
 * @param {number} aspect
 */
export function lensFov(fov, aspect) {
  if (!(aspect > MAX_VIEW_ASPECT)) return fov;
  return (2 * Math.atan((Math.tan((fov * DEG) / 2) * MAX_VIEW_ASPECT) / aspect)) / DEG;
}

/**
 * World units the view is high at the target (orthographic: everywhere)
 * @param {CameraKeys} k
 * @param {number} [aspect] - the card's w / h
 */
function viewHeight(k, aspect = 1) {
  return 2 * k.distance * Math.tan((lensFov(k.fov, aspect) * DEG) / 2);
}

/**
 * The ray through CSS px (x, y) of a w x h view.
 * @param {CameraKeys} k
 * @param {'perspective' | 'orthographic'} projection
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @returns {{ origin: [number, number, number], dir: [number, number, number] }} dir is unit length
 */
export function screenRay(k, projection, x, y, w, h) {
  const pose = cameraPose(k);
  const { right, up } = screenBasis(k);
  const halfH = viewHeight(k, w / Math.max(1, h)) / 2;
  // Offsets from the centre in world units at the target
  const ox = ((x / Math.max(1, w)) * 2 - 1) * halfH * (w / Math.max(1, h));
  const oy = (1 - (y / Math.max(1, h)) * 2) * halfH;
  if (projection === 'orthographic') {
    const origin = /** @type {[number, number, number]} */ ([0, 1, 2].map((i) => pose.position[i] + right[i] * ox + up[i] * oy));
    return { origin, dir: pose.forward };
  }
  const d = [0, 1, 2].map((i) => pose.forward[i] * k.distance + right[i] * ox + up[i] * oy);
  const len = Math.hypot(d[0], d[1], d[2]) || 1;
  return { origin: pose.position, dir: /** @type {[number, number, number]} */ (d.map((v) => v / len)) };
}

/**
 * Where a ray meets the plane through `point` with normal `normal`, or null
 * (parallel within `grazing`, or behind the origin).
 * @param {{ origin: number[], dir: number[] }} ray
 * @param {number[]} point
 * @param {number[]} normal - unit length
 * @param {number} [grazing] - minimum |cos| between the ray and the normal
 * @returns {[number, number, number] | null}
 */
export function rayPlane(ray, point, normal, grazing = 1e-6) {
  const denom = ray.dir[0] * normal[0] + ray.dir[1] * normal[1] + ray.dir[2] * normal[2];
  if (Math.abs(denom) < grazing) return null;
  const t = ((point[0] - ray.origin[0]) * normal[0] + (point[1] - ray.origin[1]) * normal[1] + (point[2] - ray.origin[2]) * normal[2]) / denom;
  if (!(t > 0)) return null;
  return [ray.origin[0] + ray.dir[0] * t, ray.origin[1] + ray.dir[1] * t, ray.origin[2] + ray.dir[2] * t];
}

/**
 * Clamp a target position into a limit (in place on keys).
 * @param {CameraKeys} k
 * @param {TargetLimit | null} limit
 */
function clampTarget(k, limit) {
  if (!limit) return;
  if ('radius' in limit) {
    const c = limit.center;
    const d = [k.tx - c[0], k.ty - c[1], k.tz - c[2]];
    const len = Math.hypot(d[0], d[1], d[2]);
    if (len > limit.radius && len > 0) {
      const f = limit.radius / len;
      k.tx = c[0] + d[0] * f;
      k.ty = c[1] + d[1] * f;
      k.tz = c[2] + d[2] * f;
    }
    return;
  }
  /** @param {number} v @param {[number, number] | undefined} r */
  const box = (v, r) => (r ? Math.min(r[1], Math.max(r[0], v)) : v);
  k.tx = box(k.tx, limit.x);
  k.ty = box(k.ty, limit.y);
  k.tz = box(k.tz, limit.z);
}

/** Above this ratio of distances (e: about 2.7x) a fly-to zooms in log distance */
const LOG_FLY_RATIO = Math.E;

/**
 * Keys part way through a fly-to that zooms a long way (a galaxy to a
 * station): the distance moves evenly in log, so every factor of ten takes
 * the same time, and the target is tied to the zoom: zooming in it arrives
 * early (the camera does not sweep past at close range), zooming out it
 * leaves late. Written `b + (a - b)(1 - u)` so the end is exact however far
 * the start was. Yaw, tilt and fov follow the eased progress.
 * @param {CameraKeys} from
 * @param {CameraKeys} to
 * @param {number} e - eased progress 0..1
 * @returns {CameraKeys}
 */
export function logFlyKeys(from, to, e) {
  const da = from.distance;
  const db = to.distance;
  const distance = e >= 1 ? db : Math.exp(Math.log(da) + (Math.log(db) - Math.log(da)) * e);
  const u = e >= 1 ? 1 : db < da ? (da - distance) / (da - db) : (distance - da) / (db - da);
  /** @param {'tx' | 'ty' | 'tz'} k */
  const target = (k) => to[k] + (from[k] - to[k]) * (1 - u);
  /** @param {'yaw' | 'tilt' | 'fov'} k */
  const lin = (k) => from[k] + (to[k] - from[k]) * e;
  return { tx: target('tx'), ty: target('ty'), tz: target('tz'), yaw: lin('yaw'), tilt: lin('tilt'), distance, fov: lin('fov') };
}

/**
 * Keys part way through a short fly-to: every key linear in the eased progress, exact at the end.
 * @param {CameraKeys} from
 * @param {CameraKeys} to
 * @param {number} e
 * @returns {CameraKeys}
 */
export function lerpKeys(from, to, e) {
  if (e >= 1) return { ...to };
  /** @param {keyof CameraKeys} k */
  const l = (k) => from[k] + (to[k] - from[k]) * e;
  return { tx: l('tx'), ty: l('ty'), tz: l('tz'), yaw: l('yaw'), tilt: l('tilt'), distance: l('distance'), fov: l('fov') };
}

/**
 * Whether a fly-to between two distances zooms in log distance.
 * @param {number} a
 * @param {number} b
 */
export function isLogFly(a, b) {
  return a > 0 && b > 0 && Math.max(a / b, b / a) > LOG_FLY_RATIO;
}

/**
 * Clamp keys to limits (in place).
 * @param {CameraKeys} k
 * @param {CameraLimits} limits
 */
export function clampKeys(k, limits) {
  k.tilt = Math.min(limits.tilt[1], Math.max(limits.tilt[0], k.tilt));
  k.distance = Math.min(limits.distance[1], Math.max(limits.distance[0], k.distance));
  if (limits.yaw) k.yaw = Math.min(limits.yaw[1], Math.max(limits.yaw[0], k.yaw));
  k.fov = Math.min(150, Math.max(5, k.fov));
  clampTarget(k, limits.target);
  return k;
}

/**
 * Default distance limits: today's [1, 100000], widened for a scene at true
 * scale (down to half its smallest object, out to 20 times its size), so a
 * station a kilometre across in a solar system measured in km can be reached.
 * @param {{ radius: number, smallest?: number } | undefined} scene
 * @returns {[number, number]}
 */
export function defaultDistance(scene) {
  const [lo, hi] = DEFAULT_LIMITS.distance;
  const small = scene?.smallest;
  return [small !== undefined && small > 0 ? Math.min(lo, small * 0.5) : lo, scene && scene.radius > 0 ? Math.max(hi, scene.radius * 20) : hi];
}

/**
 * Config limits (`{ tilt: [a, b], distance: [a, b], yaw: [a, b], target }`,
 * any part) over the defaults. `target`: `{ radius, center? }` (a sphere),
 * `{ x?, y?, z? }` (a box of [a, b] ranges), or `false` (none). Left out, the
 * target stays within a sphere of TARGET_LIMIT_SCALE x the scene's radius
 * (`scene`), so nobody pans the scene out of sight. Distance: `defaultDistance`.
 * @param {any} cfg
 * @param {{ center: [number, number, number], radius: number, smallest?: number }} [scene]
 * @returns {CameraLimits}
 */
export function parseLimits(cfg, scene) {
  /** @param {any} v @param {[number, number] | null} d @returns {[number, number] | null} */
  const pair = (v, d) => (Array.isArray(v) && v.length === 2 && v.every(Number.isFinite) ? [Math.min(v[0], v[1]), Math.max(v[0], v[1])] : d);
  const t = cfg?.target;
  /** @type {TargetLimit | null} */
  let target = null;
  if (t && typeof t === 'object' && Number.isFinite(t.radius) && t.radius > 0) {
    const c = Array.isArray(t.center) && t.center.length === 3 && t.center.every(Number.isFinite) ? t.center : scene?.center ?? [0, 0, 0];
    target = { center: /** @type {[number, number, number]} */ ([...c]), radius: t.radius };
  } else if (t && typeof t === 'object' && ['x', 'y', 'z'].some((a) => t[a] !== undefined)) {
    /** @type {{ x?: [number, number], y?: [number, number], z?: [number, number] }} */
    const box = {};
    for (const a of /** @type {const} */ (['x', 'y', 'z'])) {
      const r = pair(t[a], null);
      if (r) box[a] = r;
    }
    target = box;
  } else if (t !== false && scene && scene.radius > 0) {
    target = { center: [...scene.center], radius: scene.radius * TARGET_LIMIT_SCALE };
  }
  return {
    tilt: /** @type {[number, number]} */ (pair(cfg?.tilt, DEFAULT_LIMITS.tilt)),
    distance: /** @type {[number, number]} */ (pair(cfg?.distance, defaultDistance(scene))),
    yaw: pair(cfg?.yaw, null),
    target
  };
}

/**
 * A view (`{ target, yaw, tilt, distance, fov, projection }`) as keys.
 * `target` is a point id or `[x, y, z]`; `resolveTarget` turns it into a
 * position. Keys a view leaves out stay as they are.
 * @param {any} view
 * @param {(ref: any) => ({ x: number, y: number, z: number } | null)} resolveTarget
 * @returns {Partial<CameraKeys>}
 */
export function viewToKeys(view, resolveTarget) {
  /** @type {Partial<CameraKeys>} */
  const out = {};
  if (!view || typeof view !== 'object') return out;
  if (view.target !== undefined) {
    const p = resolveTarget(view.target);
    if (p) Object.assign(out, { tx: p.x, ty: p.y, tz: p.z });
  }
  for (const key of /** @type {const} */ (['yaw', 'tilt', 'distance', 'fov'])) {
    const v = Number(view[key]);
    if (view[key] !== undefined && Number.isFinite(v)) out[key] = v;
  }
  return out;
}

export class CameraRig {
  /**
   * @param {Object} [opts]
   * @param {() => void} [opts.onChange] - the keys changed: draw a frame
   */
  constructor({ onChange = () => {} } = {}) {
    this.perspective = new PerspectiveCamera(DEFAULT_KEYS.fov, 1, 0.1, 1e5);
    this.orthographic = new OrthographicCamera(-1, 1, 1, -1, 0.1, 1e5);
    this.perspective.rotation.order = 'YXZ';
    this.orthographic.rotation.order = 'YXZ';
    /** @type {'perspective' | 'orthographic'} */
    this.projection = 'perspective';
    /** @type {CameraKeys} */
    this.keys = { ...DEFAULT_KEYS };
    this.limits = parseLimits(null);
    this.aspect = 1;
    this.onChange = onChange;
    /** @type {any} running fly-to tween */
    this._tween = null;
    /** @type {{ from: CameraKeys, to: CameraKeys, log: boolean } | null} the running fly-to's ends (converted on a frame change) */
    this._fly = null;
    /** The distance when a pinch began */
    this._pinchDist = 0;
    this._tweenStart = 0;
    /** True while a warp fly-to runs (the runtime streaks the stars) */
    this.warp = false;
    this._tweenDuration = 0;
    /** @type {(() => void) | null} */
    this._tweenDone = null;
    /** @type {{ e: number } | null} the running fly-to's eased progress */
    this._progress = null;
    /** @type {(() => void) | null} */
    this._detach = null;
    /** @type {'screen' | 'ground'} what a pan moves along */
    this.panMode = 'screen';
    /** @type {'orbit' | 'pan'} what a one-pointer drag does */
    this.dragMode = 'orbit';
    /** @type {'cursor' | 'target'} what wheel and pinch zoom toward */
    this.zoomTo = 'cursor';
    /** Distance factor of one zoom step (buttons, keys, double-tap) */
    this.zoomStep = 2;
    /** @type {'auto' | 'zoom' | 'pan'} what a wheel event does (`auto`: a touchpad swipe pans, a mouse wheel zooms) */
    this.wheelMode = 'auto';
    /** Wheel and pinch zoom about the target, not the cursor (the runtime sets it while following a moving point) */
    this.zoomAbout = false;
    /** @type {CameraMotion | null} held motion, run by step() */
    this.motion = null;
    this._motionLast = -1;
  }

  /** @returns {PerspectiveCamera | OrthographicCamera} */
  get camera() {
    return this.projection === 'orthographic' ? this.orthographic : this.perspective;
  }

  /** Whether one-finger drag pans (tilt and yaw both fixed by the limits) */
  get panOnly() {
    return this.limits.tilt[0] === this.limits.tilt[1];
  }

  /** Whether a fly-to (or a held motion) is running */
  get flying() {
    return !!this._tween || !!this.motion;
  }

  /** Put the camera where the keys say (call before every render) */
  apply() {
    const k = this.keys;
    const pose = cameraPose(k);
    const near = Math.max(0.05, k.distance / 1000);
    const far = k.distance * 50 + 5000;
    if (this.projection === 'orthographic') {
      const cam = this.orthographic;
      const halfH = viewHeight(k, this.aspect) / 2;
      cam.left = -halfH * this.aspect;
      cam.right = halfH * this.aspect;
      cam.top = halfH;
      cam.bottom = -halfH;
      cam.near = near;
      cam.far = far;
      cam.position.set(...pose.position);
      cam.rotation.set(pose.rotation.x, pose.rotation.y, 0);
      cam.updateProjectionMatrix();
      cam.updateMatrixWorld();
      return;
    }
    const cam = this.perspective;
    cam.fov = lensFov(k.fov, this.aspect);
    cam.aspect = this.aspect;
    cam.near = near;
    cam.far = far;
    cam.position.set(...pose.position);
    cam.rotation.set(pose.rotation.x, pose.rotation.y, 0);
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
  }

  /**
   * Jump to keys (partial), no tween.
   * @param {Partial<CameraKeys>} keys
   * @param {'perspective' | 'orthographic'} [projection]
   */
  set(keys, projection) {
    this.cancel();
    if (projection) this.projection = projection;
    Object.assign(this.keys, keys);
    clampKeys(this.keys, this.limits);
    this.onChange();
  }

  /**
   * Fly to keys (partial). Resolves when it lands (or is cancelled).
   * @param {Partial<CameraKeys>} to
   * @param {{ duration?: number, ease?: any, projection?: 'perspective' | 'orthographic', warp?: boolean }} [opts] -
   *   warp: stars streak while it flies (`warp` is true until it lands)
   * @returns {Promise<void>}
   */
  flyTo(to, { duration = 1600, ease = 'inOutCubic', projection, warp = false } = {}) {
    this.cancel();
    if (projection) this.projection = projection;
    const target = clampKeys({ ...this.keys, ...to }, this.limits);
    target.yaw = shortestYaw(this.keys.yaw, target.yaw);
    if (prefersReducedMotion() || !(duration > 0)) {
      utils.set(this.keys, target);
      this.onChange();
      return Promise.resolve();
    }
    const easing = /** @type {any} */ (resolveEasing(ease) ?? 'inOutCubic');
    // one eased progress; the keys follow it from the two ends (logFlyKeys over a long zoom, else lerpKeys),
    // which a frame change converts mid-flight (rebase)
    const fly = { from: { ...this.keys }, to: target, log: isLogFly(this.keys.distance, target.distance) };
    this._fly = fly;
    const progress = { e: 0 };
    this._progress = progress;
    this._tween = animate(progress, {
      e: 1, duration, ease: easing, autoplay: false,
      onUpdate: () => { Object.assign(this.keys, (fly.log ? logFlyKeys : lerpKeys)(fly.from, fly.to, progress.e)); }
    });
    this._tweenStart = -1;
    this._tweenDuration = duration;
    this.warp = warp;
    this.onChange();
    return new Promise((resolve) => { this._tweenDone = resolve; });
  }

  /** The running fly-to (its ends), null when none: the same object for the whole flight */
  get fly() {
    return this._fly;
  }

  /**
   * Move the target by `d` (a followed point moved): the keys, or a running
   * fly-to's landing target (and its start too with `from`, for a flight
   * that began on the point, such as a zoom step), the keys following at the
   * flight's progress.
   * @param {number[]} d - [dx, dy, dz]
   * @param {{ from?: boolean }} [opts]
   */
  moveTarget(d, { from = true } = {}) {
    /** @param {CameraKeys} k */
    const add = (k) => { k.tx += d[0]; k.ty += d[1]; k.tz += d[2]; };
    const fly = this._fly;
    if (fly && this._progress) {
      add(fly.to);
      if (from) add(fly.from);
      Object.assign(this.keys, (fly.log ? logFlyKeys : lerpKeys)(fly.from, fly.to, this._progress.e));
    } else {
      add(this.keys);
    }
  }

  /**
   * The scene changed frame (frames.js): the keys, and a running fly-to's
   * ends, in the new frame's units. `target` replaces the fly-to's landing
   * target (re-read from its point in the new frame, exact there).
   * @param {(p: number[]) => number[]} point - a position, old frame to new
   * @param {number} ratio - new units per old unit
   * @param {{ tx: number, ty: number, tz: number } | null} [target]
   */
  rebase(point, ratio, target = null) {
    /** @param {CameraKeys} k @returns {CameraKeys} */
    const map = (k) => {
      const [tx, ty, tz] = point([k.tx, k.ty, k.tz]);
      return { ...k, tx, ty, tz, distance: k.distance * ratio };
    };
    Object.assign(this.keys, map(this.keys));
    if (this._fly) {
      this._fly.from = map(this._fly.from);
      this._fly.to = { ...map(this._fly.to), ...(target ?? {}) };
    }
    this._pinchDist *= ratio;
  }

  /** Stop a fly-to where it is */
  cancel() {
    if (!this._tween) return;
    this._tween.cancel?.();
    this._tween = null;
    this._fly = null;
    this.warp = false;
    const done = this._tweenDone;
    this._tweenDone = null;
    done?.();
  }

  /**
   * Advance the fly-to (or the held motion) to `now` (the frame loop calls this).
   * @param {number} now - ms
   * @returns {boolean} true while it still runs (draw another frame)
   */
  step(now) {
    if (this.motion && !this._tween) {
      const dt = this._motionLast < 0 ? 0 : Math.min(0.1, (now - this._motionLast) / 1000);
      this._motionLast = now;
      this._applyNudge(this.motion, dt);
      return true;
    }
    if (!this._tween) return false;
    if (this._tweenStart < 0) this._tweenStart = now;
    const t = Math.min(this._tweenDuration, now - this._tweenStart);
    this._tween.seek(t);
    if (t < this._tweenDuration) return true;
    this._tween = null;
    this._fly = null;
    this.warp = false;
    const done = this._tweenDone;
    this._tweenDone = null;
    done?.();
    return false;
  }

  /**
   * World units per CSS px at the target, for panning.
   * @param {number} heightPx
   */
  unitsPerPx(heightPx) {
    return viewHeight(this.keys, this.aspect) / Math.max(1, heightPx);
  }

  /**
   * The world directions a pan moves along: the screen's right and up
   * (`panMode` screen), or right and forward on the ground (ground).
   */
  panBasis() {
    if (this.panMode === 'screen') return screenBasis(this.keys);
    const y = this.keys.yaw * DEG;
    return { right: [Math.cos(y), 0, -Math.sin(y)], up: [-Math.sin(y), 0, -Math.cos(y)] };
  }

  /**
   * Move the target by a screen drag (content follows the pointer).
   * @param {number} dx - CSS px
   * @param {number} dy
   * @param {number} heightPx - viewport height
   */
  pan(dx, dy, heightPx) {
    const s = this.unitsPerPx(heightPx);
    const { right, up } = this.panBasis();
    this.keys.tx += (-dx * right[0] + dy * up[0]) * s;
    this.keys.ty += (-dx * right[1] + dy * up[1]) * s;
    this.keys.tz += (-dx * right[2] + dy * up[2]) * s;
  }

  /**
   * The world spot under CSS px (x, y) for zooming toward it: on the ground
   * plane through the target (`panMode` ground, unless the ray grazes it),
   * else on the plane through the target facing the camera.
   * @param {number} x
   * @param {number} y
   * @param {number} w - viewport width
   * @param {number} h - viewport height
   * @returns {[number, number, number]}
   */
  spotAt(x, y, w, h) {
    const k = this.keys;
    const ray = screenRay(k, this.projection, x, y, w, h);
    const target = [k.tx, k.ty, k.tz];
    if (this.panMode === 'ground') {
      const hit = rayPlane(ray, target, [0, 1, 0], 0.15);
      if (hit) return hit;
    }
    const f = cameraPose(k).forward;
    return rayPlane(ray, target, [-f[0], -f[1], -f[2]]) ?? /** @type {[number, number, number]} */ (target);
  }

  /**
   * Zoom by a distance factor (< 1 closer) toward a world spot: everything
   * scales about `at`, so it stays where it is on screen. Without `at` the
   * zoom is about the target. The factor is clamped by the distance limits
   * first, so the spot stays put at a limit too.
   * @param {number} factor
   * @param {number[] | null} [at]
   */
  zoomAt(factor, at = null) {
    const k = this.keys;
    const d1 = Math.min(this.limits.distance[1], Math.max(this.limits.distance[0], k.distance * factor));
    const f = d1 / k.distance;
    if (at) {
      k.tx = at[0] + (k.tx - at[0]) * f;
      k.ty = at[1] + (k.ty - at[1]) * f;
      k.tz = at[2] + (k.tz - at[2]) * f;
    }
    k.distance = d1;
    clampKeys(k, this.limits);
  }

  /**
   * Keys after a nudge (see CameraMotion; `scale` multiplies it), without
   * moving the camera.
   * @param {CameraMotion} n
   * @param {number} [scale]
   * @returns {CameraKeys}
   */
  nudged(n, scale = 1) {
    const k = { ...this.keys };
    if (n.pan) {
      const { right, up } = this.panBasis();
      const s = viewHeight(k, this.aspect) * scale;
      k.tx += (right[0] * n.pan[0] + up[0] * n.pan[1]) * s;
      k.ty += (right[1] * n.pan[0] + up[1] * n.pan[1]) * s;
      k.tz += (right[2] * n.pan[0] + up[2] * n.pan[1]) * s;
    }
    if (n.zoom) k.distance *= Math.pow(this.zoomStep, -n.zoom * scale);
    if (n.orbit) {
      k.yaw += n.orbit[0] * scale;
      k.tilt += n.orbit[1] * scale;
    }
    return clampKeys(k, this.limits);
  }

  /**
   * One step of a nudge: a short fly (or a jump with `duration` 0).
   * @param {CameraMotion} n
   * @param {{ duration?: number }} [opts]
   */
  nudge(n, { duration = 250 } = {}) {
    return this.flyTo(this.nudged(n), { duration, ease: 'outQuad' });
  }

  /**
   * Start (or with null stop) a held motion: step() moves the camera at
   * this rate each frame.
   * @param {CameraMotion | null} m
   */
  setMotion(m) {
    if (m) this.cancel();
    this.motion = m;
    this._motionLast = -1;
    if (m) this.onChange();
  }

  /**
   * @private
   * @param {CameraMotion} n
   * @param {number} scale
   */
  _applyNudge(n, scale) {
    Object.assign(this.keys, this.nudged(n, scale));
  }

  /**
   * Drag to orbit (or pan: shift, right or middle button, two fingers, or a
   * fixed tilt; `dragMode` pan swaps orbit and pan), wheel and pinch to zoom
   * (toward the pointer with `zoomTo` cursor), a touchpad's two-finger swipe
   * to pan (shift: orbit; see wheel-input.js and `wheelMode`).
   * @param {HTMLElement} el
   * @param {{ onStart?: () => void, shouldStart?: (e: PointerEvent) => boolean, onPan?: () => void }} [hooks] -
   *   `shouldStart` false leaves that press alone (a point drag in the Studio); `onPan` runs when an input moves
   *   the target (the runtime lets go of a followed point)
   */
  attach(el, { onStart, shouldStart, onPan } = {}) {
    this.detach();
    /** Two fingers move less than this (CSS px) while zooming about the target: a pinch, not a pan */
    const PINCH_PAN_SLOP = 12;
    let pinchPan = 0;
    /** @type {{ kind: import('./wheel-input.js').WheelKind, t: number } | null} */
    let gesture = null;
    let gestureDist = 0;
    /** @type {Map<number, { x: number, y: number }>} */
    const pts = new Map();
    let pinch0 = 0;
    let panMode = false;
    const mid = () => {
      const [a, b] = [...pts.values()];
      return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, d: Math.hypot(a.x - b.x, a.y - b.y) };
    };
    let last = { x: 0, y: 0 };
    /** @param {PointerEvent} e */
    const down = (e) => {
      if (shouldStart && !shouldStart(e)) return;
      el.setPointerCapture?.(e.pointerId);
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      this.cancel();
      onStart?.();
      panMode = e.button === 1 || ((this.dragMode === 'pan') !== (e.shiftKey || e.button === 2));
      if (pts.size === 2) {
        const m = mid();
        pinch0 = m.d;
        this._pinchDist = this.keys.distance;
        last = m;
        pinchPan = 0;
      }
    };
    /** @param {PointerEvent} e */
    const move = (e) => {
      const p = pts.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x;
      const dy = e.clientY - p.y;
      p.x = e.clientX;
      p.y = e.clientY;
      const h = el.clientHeight || 1;
      if (pts.size === 1) {
        if (panMode || this.panOnly) {
          this.pan(dx, dy, h);
          onPan?.();
        } else {
          this.keys.yaw -= dx * 0.3;
          this.keys.tilt += dy * 0.3;
        }
      } else if (pts.size === 2) {
        const m = mid();
        const factor = (this._pinchDist * pinch0) / Math.max(1, m.d) / this.keys.distance;
        // zooming about a followed point: the fingers' small drift is not a pan
        pinchPan += Math.hypot(m.x - last.x, m.y - last.y);
        if (!this.zoomAbout || pinchPan > PINCH_PAN_SLOP) {
          this.pan(m.x - last.x, m.y - last.y, h);
          onPan?.();
        }
        this.zoomAt(factor, this._zoomSpot(el, m.x, m.y));
        last = m;
      }
      clampKeys(this.keys, this.limits);
      this.onChange();
    };
    /** @param {PointerEvent} e */
    const up = (e) => {
      pts.delete(e.pointerId);
      if (pts.size === 1) {
        const [only] = pts.values();
        last = only;
      }
    };
    /** @param {WheelEvent} e */
    const wheel = (e) => {
      e.preventDefault();
      this.cancel();
      gesture = classifyWheel(/** @type {any} */ (e), gesture, performance.now());
      if (wheelAction(gesture.kind, this.wheelMode) === 'pan') {
        // like scrolling a page: the content moves with the fingers
        const lines = e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? 400 : 1;
        const dx = e.deltaX * lines;
        const dy = e.deltaY * lines;
        if (e.shiftKey && !this.panOnly) {
          this.keys.yaw += dx * 0.3;
          this.keys.tilt -= dy * 0.3;
        } else {
          this.pan(-dx, -dy, el.clientHeight || 1);
          onPan?.();
        }
        clampKeys(this.keys, this.limits);
      } else {
        this.zoomAt(wheelZoomFactor(e, gesture.kind), this._zoomSpot(el, e.clientX, e.clientY));
      }
      this.onChange();
    };
    // Safari sends a touchpad pinch as gesture events (scale since the start), not ctrl+wheel
    /** @param {any} e */
    const gestureStart = (e) => {
      e.preventDefault();
      this.cancel();
      gestureDist = this.keys.distance;
    };
    /** @param {any} e */
    const gestureChange = (e) => {
      e.preventDefault();
      if (!(e.scale > 0) || !(gestureDist > 0)) return;
      this.zoomAt(gestureDist / e.scale / this.keys.distance, this._zoomSpot(el, e.clientX, e.clientY));
      this.onChange();
    };
    /** @param {MouseEvent} e - no autoscroll on a middle press (it pans) */
    const mouseDown = (e) => { if (e.button === 1) e.preventDefault(); };
    /** @param {Event} e */
    const menu = (e) => e.preventDefault();
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', wheel, { passive: false });
    el.addEventListener('gesturestart', gestureStart);
    el.addEventListener('gesturechange', gestureChange);
    el.addEventListener('mousedown', mouseDown);
    el.addEventListener('contextmenu', menu);
    this._detach = () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.removeEventListener('wheel', wheel);
      el.removeEventListener('gesturestart', gestureStart);
      el.removeEventListener('gesturechange', gestureChange);
      el.removeEventListener('mousedown', mouseDown);
      el.removeEventListener('contextmenu', menu);
    };
  }

  /**
   * The spot wheel and pinch zoom toward (client px), or null for the target.
   * @private
   * @param {HTMLElement} el
   * @param {number} clientX
   * @param {number} clientY
   */
  _zoomSpot(el, clientX, clientY) {
    if (this.zoomTo !== 'cursor' || this.zoomAbout) return null;
    const r = el.getBoundingClientRect();
    const w = r.width || el.clientWidth || 1;
    const h = r.height || el.clientHeight || 1;
    return this.spotAt(clientX - r.left, clientY - r.top, w, h);
  }

  detach() {
    this._detach?.();
    this._detach = null;
  }

  dispose() {
    this.cancel();
    this.motion = null;
    this.detach();
  }
}
