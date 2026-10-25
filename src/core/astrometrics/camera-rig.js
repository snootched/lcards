/**
 * Astrometrics camera rig: the camera is a pure function of seven keys
 * (target x/y/z, yaw, tilt, distance, fov) plus a projection. A view is a set
 * of keys, a drag edits yaw and tilt (or pans the target), wheel and pinch
 * edit the distance, limits clamp, and a fly-to is one anime.js tween over
 * the plain key numbers.
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

const DEG = Math.PI / 180;

/** @typedef {{ tx: number, ty: number, tz: number, yaw: number, tilt: number, distance: number, fov: number }} CameraKeys */
/** @typedef {{ tilt: [number, number], distance: [number, number], yaw: [number, number] | null }} CameraLimits */

/** @type {CameraKeys} */
export const DEFAULT_KEYS = { tx: 0, ty: 0, tz: 0, yaw: 20, tilt: 35, distance: 260, fov: 40 };

/** @type {CameraLimits} */
export const DEFAULT_LIMITS = { tilt: [-90, 90], distance: [1, 100000], yaw: null };

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
 * Clamp keys to limits (in place).
 * @param {CameraKeys} k
 * @param {CameraLimits} limits
 */
export function clampKeys(k, limits) {
  k.tilt = Math.min(limits.tilt[1], Math.max(limits.tilt[0], k.tilt));
  k.distance = Math.min(limits.distance[1], Math.max(limits.distance[0], k.distance));
  if (limits.yaw) k.yaw = Math.min(limits.yaw[1], Math.max(limits.yaw[0], k.yaw));
  k.fov = Math.min(150, Math.max(5, k.fov));
  return k;
}

/**
 * Config limits (`{ tilt: [a, b], distance: [a, b], yaw: [a, b] }`, any part)
 * over the defaults.
 * @param {any} cfg
 * @returns {CameraLimits}
 */
export function parseLimits(cfg) {
  /** @param {any} v @param {[number, number] | null} d @returns {[number, number] | null} */
  const pair = (v, d) => (Array.isArray(v) && v.length === 2 && v.every(Number.isFinite) ? [Math.min(v[0], v[1]), Math.max(v[0], v[1])] : d);
  return {
    tilt: /** @type {[number, number]} */ (pair(cfg?.tilt, DEFAULT_LIMITS.tilt)),
    distance: /** @type {[number, number]} */ (pair(cfg?.distance, DEFAULT_LIMITS.distance)),
    yaw: pair(cfg?.yaw, null)
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
    this._tweenStart = 0;
    this._tweenDuration = 0;
    /** @type {(() => void) | null} */
    this._tweenDone = null;
    /** @type {(() => void) | null} */
    this._detach = null;
  }

  /** @returns {PerspectiveCamera | OrthographicCamera} */
  get camera() {
    return this.projection === 'orthographic' ? this.orthographic : this.perspective;
  }

  /** Whether one-finger drag pans (tilt and yaw both fixed by the limits) */
  get panOnly() {
    return this.limits.tilt[0] === this.limits.tilt[1];
  }

  /** Whether a fly-to is running */
  get flying() {
    return !!this._tween;
  }

  /** Put the camera where the keys say (call before every render) */
  apply() {
    const k = this.keys;
    const pose = cameraPose(k);
    const near = Math.max(0.05, k.distance / 1000);
    const far = k.distance * 50 + 5000;
    if (this.projection === 'orthographic') {
      const cam = this.orthographic;
      const halfH = k.distance * Math.tan((k.fov * DEG) / 2);
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
    cam.fov = k.fov;
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
   * @param {{ duration?: number, ease?: any, projection?: 'perspective' | 'orthographic' }} [opts]
   * @returns {Promise<void>}
   */
  flyTo(to, { duration = 1600, ease = 'inOutCubic', projection } = {}) {
    this.cancel();
    if (projection) this.projection = projection;
    const target = clampKeys({ ...this.keys, ...to }, this.limits);
    target.yaw = shortestYaw(this.keys.yaw, target.yaw);
    if (prefersReducedMotion() || !(duration > 0)) {
      utils.set(this.keys, target);
      this.onChange();
      return Promise.resolve();
    }
    this._tween = animate(this.keys, { ...target, duration, ease: /** @type {any} */ (resolveEasing(ease) ?? 'inOutCubic'), autoplay: false });
    this._tweenStart = -1;
    this._tweenDuration = duration;
    this.onChange();
    return new Promise((resolve) => { this._tweenDone = resolve; });
  }

  /** Stop a fly-to where it is */
  cancel() {
    if (!this._tween) return;
    this._tween.cancel?.();
    this._tween = null;
    const done = this._tweenDone;
    this._tweenDone = null;
    done?.();
  }

  /**
   * Advance the fly-to to `now` (the frame loop calls this).
   * @param {number} now - ms
   * @returns {boolean} true while it still runs (draw another frame)
   */
  step(now) {
    if (!this._tween) return false;
    if (this._tweenStart < 0) this._tweenStart = now;
    const t = Math.min(this._tweenDuration, now - this._tweenStart);
    this._tween.seek(t);
    if (t < this._tweenDuration) return true;
    this._tween = null;
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
    return (2 * this.keys.distance * Math.tan((this.keys.fov * DEG) / 2)) / Math.max(1, heightPx);
  }

  /**
   * Move the target by a screen drag (content follows the pointer).
   * @param {number} dx - CSS px
   * @param {number} dy
   * @param {number} heightPx - viewport height
   */
  pan(dx, dy, heightPx) {
    const s = this.unitsPerPx(heightPx);
    const y = this.keys.yaw * DEG;
    // camera right (cos, 0, -sin) and screen-up on the ground (-sin, 0, -cos)
    this.keys.tx += (-dx * Math.cos(y) - dy * Math.sin(y)) * s;
    this.keys.tz += (dx * Math.sin(y) - dy * Math.cos(y)) * s;
  }

  /**
   * Drag to orbit (or pan: shift, right button, two fingers, or a fixed
   * tilt), wheel and pinch to zoom.
   * @param {HTMLElement} el
   * @param {{ onStart?: () => void }} [hooks]
   */
  attach(el, { onStart } = {}) {
    this.detach();
    /** @type {Map<number, { x: number, y: number }>} */
    const pts = new Map();
    let pinch0 = 0;
    let dist0 = 0;
    let panMode = false;
    const mid = () => {
      const [a, b] = [...pts.values()];
      return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, d: Math.hypot(a.x - b.x, a.y - b.y) };
    };
    let last = { x: 0, y: 0 };
    /** @param {PointerEvent} e */
    const down = (e) => {
      el.setPointerCapture?.(e.pointerId);
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      this.cancel();
      onStart?.();
      panMode = e.shiftKey || e.button === 2;
      if (pts.size === 2) {
        const m = mid();
        pinch0 = m.d;
        dist0 = this.keys.distance;
        last = m;
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
        if (panMode || this.panOnly) this.pan(dx, dy, h);
        else {
          this.keys.yaw -= dx * 0.3;
          this.keys.tilt += dy * 0.3;
        }
      } else if (pts.size === 2) {
        const m = mid();
        this.keys.distance = (dist0 * pinch0) / Math.max(1, m.d);
        this.pan(m.x - last.x, m.y - last.y, h);
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
      this.keys.distance *= Math.exp(e.deltaY * 0.001);
      clampKeys(this.keys, this.limits);
      this.onChange();
    };
    /** @param {Event} e */
    const menu = (e) => e.preventDefault();
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', wheel, { passive: false });
    el.addEventListener('contextmenu', menu);
    this._detach = () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.removeEventListener('wheel', wheel);
      el.removeEventListener('contextmenu', menu);
    };
  }

  detach() {
    this._detach?.();
    this._detach = null;
  }

  dispose() {
    this.cancel();
    this.detach();
  }
}
