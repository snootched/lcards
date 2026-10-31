/**
 * Warp for the astrometrics card (`warp`, `warp_factor`): the stars stream
 * past as the ship goes to warp. A `warp-starfield` background layer (the TNG
 * spectrum streaks) fades in behind the scene and speeds up to the warp
 * factor while the scene's own backdrop stars and dust streak along the view
 * (the scene's setCruise); dropping out of warp
 * slows it and fades it out. The layer is made on the first engage and let go
 * once it is out of warp again. Nothing under reduced motion.
 *
 * Also driven from code (the tribute: `engage()` with its own factor).
 *
 * @module core/astrometrics/warp-drive
 */
import { BackgroundAnimationRenderer } from '../packs/backgrounds/BackgroundAnimationRenderer.js';
import { prefersReducedMotion } from '../../utils/reduced-motion.js';
import { lcardsLog } from '../../utils/lcards-logging.js';

/** Going to warp takes this long, ms (dropping out a little less) */
export const ENGAGE_MS = 2200;
export const DISENGAGE_MS = 1600;

/** The default warp factor */
export const DEFAULT_FACTOR = 6;

/** A change of warp factor (or strength) eases over this long, ms: the streaks speed up and slow down, never jump */
export const FACTOR_EASE_MS = 1500;

/**
 * The streak layer's speed at a warp factor: 1 is stars drifting, a factor
 * of 9.9 long streaks.
 * @param {number} factor - 1 to 9.9
 */
export function warpSpeed(factor) {
  const f = Math.min(9.9, Math.max(1, Number.isFinite(factor) ? factor : DEFAULT_FACTOR));
  return 1 + f * 1.4;
}

/**
 * The layer at a level of warp (0 at rest, 1 at the warp factor): its
 * opacity rises fast, its speed late (the jump to warp at the end).
 * @param {number} level
 * @param {number} factor
 */
export function warpState(level, factor) {
  const l = Math.min(1, Math.max(0, level));
  return { opacity: Math.min(1, l * 2.5), speed: 1 + (warpSpeed(factor) - 1) * l * l * l };
}

/**
 * Whether `warp` says go: true, or an entity's state (or attribute) that is
 * on: `on`, `true`, `home`, `open`, or a number above 0.
 * @param {any} value - the state or attribute
 */
export function warpOn(value) {
  if (value === true) return true;
  if (typeof value === 'number') return value > 0;
  if (typeof value !== 'string') return false;
  const s = value.trim().toLowerCase();
  if (['on', 'true', 'yes', 'engaged', 'open', 'home'].includes(s)) return true;
  const n = Number(s);
  return s !== '' && Number.isFinite(n) && n > 0;
}

/**
 * A value moved toward a target by at most `step`.
 * @param {number} v
 * @param {number} to
 * @param {number} step
 */
function approach(v, to, step) {
  const d = to - v;
  return Math.abs(d) <= step ? to : v + Math.sign(d) * step;
}

export class WarpDrive {
  /**
   * @param {HTMLElement} layer - an empty layer behind the scene
   * @param {any} owner - the card (theme colours for the layer)
   * @param {{ onLevel?: (level: number, factor: number) => void }} [hooks] - the level and the factor as they change (the scene streaks its stars)
   */
  constructor(layer, owner, { onLevel } = {}) {
    this.layer = layer;
    this.owner = owner;
    this.onLevel = onLevel;
    /** 0 at rest, 1 at warp */
    this.level = 0;
    this.target = 0;
    this.factor = DEFAULT_FACTOR;
    /** The factor the layer shows now, eased toward `factor` */
    this.shownFactor = DEFAULT_FACTOR;
    /** How strong the layer is (0 to 1 of its opacity; the tribute thins it behind the portrait), and shown now */
    this.strength = 1;
    this.shownStrength = 1;
    /** @type {BackgroundAnimationRenderer | null} */
    this._renderer = null;
    this._raf = 0;
    this._last = 0;
  }

  /** Whether it is at warp or on the way */
  get engaged() {
    return this.target > 0;
  }

  /**
   * Go to warp (true) or drop out (false).
   * @param {boolean} on
   */
  set(on) {
    const next = on && !prefersReducedMotion() ? 1 : 0;
    if (next === this.target) return;
    this.target = next;
    if (next && !this._renderer) this._start();
    this._run();
  }

  /**
   * The warp factor (1 to 9.9): the layer's speed follows.
   * @param {number | null} f
   */
  setFactor(f) {
    this.factor = f !== null && Number.isFinite(f) ? Math.min(9.9, Math.max(1, f)) : DEFAULT_FACTOR;
    // at rest it takes the factor at once; at warp it speeds up or slows down to it
    if (this.level === 0) this.shownFactor = this.factor;
    this._run();
  }

  /**
   * How strong the streaks are, 0 to 1 of their opacity (eased).
   * @param {number} a
   */
  setStrength(a) {
    this.strength = Math.min(1, Math.max(0, Number.isFinite(a) ? a : 1));
    if (this.level === 0) this.shownStrength = this.strength;
    this._run();
  }

  /** @private */
  _start() {
    this.layer.replaceChildren();
    const renderer = new BackgroundAnimationRenderer(this.layer, [{
      preset: 'warp-starfield',
      config: { count: 900, spectrum: true, streak: 1.2, max_radius: 2.2, fov: 75, speed: 1, opacity: 0 }
    }], this.owner);
    if (!renderer.init()) {
      lcardsLog.warn('[Astrometrics] warp could not start');
      renderer.destroy();
      return;
    }
    this._renderer = renderer;
  }

  /** @private */
  _run() {
    if (this._raf) return;
    this._last = performance.now();
    const step = (/** @type {number} */ now) => {
      this._raf = 0;
      const dt = Math.min(100, now - this._last);
      this._last = now;
      const ms = this.target > this.level ? ENGAGE_MS : DISENGAGE_MS;
      this.level = approach(this.level, this.target, dt / ms);
      this.shownFactor = approach(this.shownFactor, this.factor, (dt / FACTOR_EASE_MS) * 8.9);
      this.shownStrength = approach(this.shownStrength, this.strength, dt / FACTOR_EASE_MS);
      this._apply();
      this.onLevel?.(this.level, this.shownFactor);
      const settled = this.level === this.target && this.shownFactor === this.factor && this.shownStrength === this.strength;
      if (!settled) this._raf = requestAnimationFrame(step);
      else if (this.level === 0) this._stop();
    };
    this._raf = requestAnimationFrame(step);
  }

  /** @private */
  _apply() {
    const h = this._renderer?.handles?.[0];
    if (!h) return;
    const { opacity, speed } = warpState(this.level, this.shownFactor);
    h.setProp('opacity', opacity * this.shownStrength);
    h.setProp('speed', speed);
  }

  /** @private */
  _stop() {
    this._renderer?.destroy();
    this._renderer = null;
    this.layer.replaceChildren();
  }

  destroy() {
    cancelAnimationFrame(this._raf);
    this._raf = 0;
    this._stop();
  }
}
