/**
 * ThreeSceneEffect: a three.js scene as one more effect in a card's
 * Canvas2DRenderer stack (main chunk; three.js itself is never imported here).
 *
 * The scene module and three.js load on the first draw (a probe effect built
 * only to read colours never loads anything). Each frame the scene renders
 * on the page's shared WebGL context (three-runtime.js) and is copied into
 * the card's canvas with drawImage, at the entry's place in the stack. So
 * everything Canvas2DRenderer does applies unchanged: tab-hidden pause,
 * off-screen suspend, PerformanceMonitor, the reduced-motion held frame,
 * `_xform` and ZoomEffect.
 *
 * **Scene motion runs on this effect's clock.** A scene builds its anime.js
 * animations (cameras, meshes, `getInstances()`, uniforms, timelines) with
 * `autoplay: false`; `seek(time)` is called every update with the effect's
 * elapsed time, which already runs at `speed`. Pausing, holding a frame and
 * warping are therefore automatic, and a speed change never jumps.
 *
 * Scene module contract (`static loadScene` returns its `createScene`):
 *   createScene({ params, colors }) => {
 *     scene, camera,
 *     seek(timeMs, effect),        // advance every animation to timeMs
 *     resize(w, h),
 *     setParam(key, value),        // a declared numeric key changed
 *     setColors(colors),           // [{ r, g, b, a }] per colour key
 *     dispose()
 *   }
 *
 * @module core/packs/backgrounds/webgl/ThreeSceneEffect
 */
import { BaseEffect } from '../effects/BaseEffect.js';
import { lcardsLog } from '../../../../utils/lcards-logging.js';
import { parseColorToRgba } from '../../textures/effects/noise-helpers.js';
import { resolveColor } from '../../../themes/resolve-color.js';

/** @type {Promise<typeof import('./three-runtime.js')> | null} */
let runtimePromise = null;

/** Load three.js + the shared context once; a failed load is not cached. */
export function loadThreeRuntime() {
  runtimePromise ??= import('./three-runtime.js').catch((error) => {
    runtimePromise = null;
    throw error;
  });
  return runtimePromise;
}

/**
 * A numeric scene key: stored in `params`, forwarded to the live scene.
 * @param {string} key
 * @param {{ min?: number, max?: number }} [opts]
 * @returns {import('../effects/animatable-props.js').AnimatableProp}
 */
export function sceneProp(key, { min = -Infinity, max = Infinity } = {}) {
  return {
    get: (e) => e.params[key],
    set: (e, v) => {
      const n = Number(v);
      if (!Number.isFinite(n)) return;
      e.params[key] = Math.max(min, Math.min(max, n));
      e._scene?.setParam(key, e.params[key]);
    }
  };
}

/**
 * A colour scene key (one colour; a `colors` list collapses to it while animated).
 * @param {string} key - Index into `colorKeys`
 * @returns {import('../effects/animatable-props.js').AnimatableProp}
 */
export function sceneColorProp(key) {
  return {
    color: true,
    get: (e) => e.colors[key]?.[0],
    set: (e, v) => {
      e.colors[key] = [v];
      e._pushColors();
    }
  };
}

export class ThreeSceneEffect extends BaseEffect {
  /**
   * Loads the scene module (a lazy `import()`); set by each subclass.
   * @type {() => Promise<{ createScene: (opts: any) => any }>}
   */
  static loadScene = () => Promise.reject(new Error('no scene'));

  /**
   * @param {Object} config
   * @param {Record<string, any>} [config.params] - Numeric scene keys
   * @param {Record<string, string[]>} [config.colors] - Colour keys, each a list of colours
   * @param {number} [config.opacity]
   */
  constructor(config = {}) {
    super(/** @type {any} */ (config));
    /** @type {Record<string, any>} */
    this.params = { ...(config.params ?? {}) };
    /** @type {Record<string, string[]>} concrete CSS colours per colour key */
    this.colors = Object.fromEntries(Object.entries(config.colors ?? {}).map(([k, list]) =>
      [k, list.map((c) => resolveColor(c, { concrete: true }))]));
    /** @type {any} the live scene, once loaded */
    this._scene = null;
    /** @type {any} */
    this._runtime = null;
    this._loading = false;
    this._destroyed = false;
    /** releaseGPU() was called and nothing has drawn since */
    this._released = false;
    this._w = 0;
    this._h = 0;
    /** Set by BackgroundAnimationRenderer: redraw / swap to the Canvas2D fallback */
    this.host = /** @type {{ requestFrame?: () => void, fail?: (reason: string) => void } | null} */ (null);
    this._user = { onContextLost: () => this._fail('context lost') };
  }

  /** @returns {Record<string, Array<{ r: number, g: number, b: number, a: number }>>} */
  _rgbaColors() {
    return Object.fromEntries(Object.entries(this.colors).map(([k, list]) =>
      [k, list.map((c) => parseColorToRgba(c, '#ffffff'))]));
  }

  _pushColors() {
    this._scene?.setColors(this._rgbaColors());
  }

  /** @private */
  async _load() {
    this._loading = true;
    try {
      const [runtime, mod] = await Promise.all([
        loadThreeRuntime(),
        /** @type {typeof ThreeSceneEffect} */ (this.constructor).loadScene()
      ]);
      if (this._destroyed) return;
      const renderer = runtime.acquire(this._user);
      this._runtime = runtime;
      const scene = mod.createScene({ params: this.params, colors: this._rgbaColors() });
      // Compile and upload off the frame, so the first draw does not trip
      // Canvas2DRenderer's hard frame budget
      await renderer.compileAsync(scene.scene, scene.camera).catch(() => {});
      if (this._destroyed || this._released) {
        scene.dispose();
        runtime.release(this._user);
        this._loading = false;
        return;
      }
      scene.seek(this._elapsedTime, this);
      runtime.render(scene.scene, scene.camera, 2, 2);
      this._scene = scene;
      this._w = 0;
      this.host?.requestFrame?.();
      lcardsLog.debug(`[ThreeSceneEffect] ${this.constructor.name} ready`);
    } catch (error) {
      lcardsLog.warn(`[ThreeSceneEffect] ${this.constructor.name} could not start:`, error);
      this._fail('load failed');
    }
    this._loading = false;
  }

  /**
   * The card left the page (BackgroundAnimationRenderer.suspend): give the
   * GPU resources and the shared context back. The next draw builds the scene
   * again; its motion follows the effect clock, so it carries on where it was.
   */
  releaseGPU() {
    this._released = true;
    this._disposeScene();
  }

  /**
   * @param {string} reason
   * @private
   */
  _fail(reason) {
    if (this._destroyed) return;
    this._disposeScene();
    this.host?.fail?.(reason);
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} w
   * @param {number} h
   */
  draw(ctx, w, h) {
    this._released = false;
    if (!this._scene) {
      if (!this._loading && !this._destroyed) this._load();
      return;
    }
    if (w !== this._w || h !== this._h) {
      this._w = w;
      this._h = h;
      this._scene.resize(w, h);
    }
    this._scene.seek(this._elapsedTime, this);
    const out = this._runtime.render(this._scene.scene, this._scene.camera, w, h);
    if (!out) return;
    const alpha = ctx.globalAlpha;
    ctx.globalAlpha = alpha * this.opacity;
    ctx.drawImage(out.source, 0, out.sy, w, h, 0, 0, w, h);
    out.done?.();
    ctx.globalAlpha = alpha;
  }

  /**
   * F1: take the new palette's colours from a fresh (never loaded) build.
   * @param {any} fresh
   * @returns {boolean}
   */
  recolorFrom(fresh) {
    if (fresh?.constructor !== this.constructor) return false;
    this.colors = fresh.colors;
    this._pushColors();
    return true;
  }

  /** @private */
  _disposeScene() {
    if (this._scene) {
      this._scene.dispose();
      this._scene = null;
    }
    if (this._runtime) {
      this._runtime.release(this._user);
      this._runtime = null;
    }
  }

  destroy() {
    this._destroyed = true;
    this._disposeScene();
    super.destroy();
  }
}

/**
 * `warp-starfield`: stars flying at the viewer on an InstancedMesh; streaks
 * stretch with `speed`. Two variants for the C2 evaluation: `instances` (one
 * anime.js loop per star through the three adapter's getInstances) and
 * `shader` (one time uniform, positions in the vertex shader).
 */
export class WarpStarfieldEffect extends ThreeSceneEffect {
  static loadScene = () => import('./scenes/warp-starfield.js');

  static animatableProps = {
    ...BaseEffect.animatableProps,
    streak: sceneProp('streak', { min: 0 }),
    color: sceneColorProp('stars')
  };
}

/**
 * `grid-floor`: a perspective LCARS wireframe floor scrolling to the horizon,
 * with a scan line and a slow camera drift (an anime.js timeline on the camera
 * rig). `camera_height` and `camera_tilt` reach the camera through the adapter.
 */
export class GridFloorEffect extends ThreeSceneEffect {
  static loadScene = () => import('./scenes/grid-floor.js');

  static animatableProps = {
    ...BaseEffect.animatableProps,
    camera_height: sceneProp('camera_height', { min: 0.1 }),
    camera_tilt: sceneProp('camera_tilt', { min: -89, max: 89 }),
    color: sceneColorProp('lines'),
    scan_color: sceneColorProp('scan')
  };
}
