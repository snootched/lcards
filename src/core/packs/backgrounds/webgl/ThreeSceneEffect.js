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
import { NebulaEffect } from '../effects/NebulaEffect.js';
import { GridEffect } from '../effects/GridEffect.js';

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
    let out;
    try {
      out = this._runtime.render(this._scene.scene, this._scene.camera, w, h);
    } catch (error) {
      // An exception here would end the card's whole frame loop
      lcardsLog.warn(`[ThreeSceneEffect] ${this.constructor.name} render failed:`, error);
      this._fail('render failed');
      return;
    }
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
 * stretch with `speed`. One time uniform; the vertex shader places the stars.
 */
export class WarpStarfieldEffect extends ThreeSceneEffect {
  static loadScene = () => import('./scenes/warp-starfield.js');

  static animatableProps = {
    ...BaseEffect.animatableProps,
    streak: sceneProp('streak', { min: 0 }),
    camera_tilt: sceneProp('camera_tilt', { min: -40, max: 40 }),
    camera_yaw: sceneProp('camera_yaw', { min: -40, max: 40 }),
    fov: sceneProp('fov', { min: 20, max: 120 }),
    color: sceneColorProp('stars')
  };
}

/**
 * A noise field drawn on the GPU (`contour-field`, `plasma`, `fluid` on
 * WebGL): the scroll is integrated here exactly as the Canvas2D effects do
 * (`_offsetX/Y` in px, `scroll_speed_x/y` px/s times `speed`); the scene
 * reads it every frame. Keys that the Canvas2D version re-bakes for are
 * plain uniforms here, so they are animatable.
 */
export class NoiseFieldEffect extends ThreeSceneEffect {
  /** Config colour key → colour slot, for updateConfig (template-bound colours) */
  static colorKeys = /** @type {Record<string, string>} */ ({});

  /**
   * @param {{ params?: Record<string, any>, colors?: Record<string, string[]>, opacity?: number,
   *   offsetX?: number, offsetY?: number }} [config] - ThreeSceneEffect config, plus the start offset (px)
   */
  constructor(config = {}) {
    super(config);
    this._offsetX = config.offsetX ?? 0;
    this._offsetY = config.offsetY ?? 0;
  }

  /**
   * @param {number} deltaTime
   * @param {number} w
   * @param {number} h
   */
  update(deltaTime, w, h) {
    super.update(deltaTime, w, h);
    const s = (deltaTime / 1000) * this.speed;
    this._offsetX += (this.params.scroll_speed_x ?? 0) * s;
    this._offsetY += (this.params.scroll_speed_y ?? 0) * s;
  }

  /**
   * Entity-bound values that are not animatable keys (snake_case, as in YAML).
   * @param {Record<string, any>} cfg
   */
  updateConfig(cfg) {
    if (cfg.opacity !== undefined) this.opacity = cfg.opacity;
    if (cfg.speed !== undefined) this.speed = cfg.speed;
    for (const key of Object.keys(this.params)) {
      if (cfg[key] === undefined) continue;
      this.params[key] = cfg[key];
      this._scene?.setParam(key, cfg[key]);
    }
    const colorKeys = /** @type {typeof NoiseFieldEffect} */ (this.constructor).colorKeys;
    let recolor = false;
    for (const [key, slot] of Object.entries(colorKeys)) {
      if (typeof cfg[key] !== 'string') continue;
      this.colors[slot] = [resolveColor(cfg[key], { concrete: true })];
      recolor = true;
    }
    if (recolor) this._pushColors();
  }
}

/** `contour-field` on WebGL (scenes/contour-field.js); Canvas2D: ContourFieldEffect */
export class ContourFieldGLEffect extends NoiseFieldEffect {
  static loadScene = () => import('./scenes/contour-field.js');

  static animatableProps = {
    ...BaseEffect.animatableProps,
    scroll_speed_x: sceneProp('scroll_speed_x'),
    scroll_speed_y: sceneProp('scroll_speed_y'),
    noise_scale: sceneProp('noise_scale', { min: 0.0001 }),
    num_bands: sceneProp('num_bands', { min: 2, max: 64 }),
    fill_level: sceneProp('fill_level', { min: 0, max: 0.95 })
  };

  static colorKeys = { fill_color: 'fill' };
}

/** `plasma` on WebGL (scenes/plasma.js); Canvas2D: PlasmaTextureEffect */
export class PlasmaGLEffect extends NoiseFieldEffect {
  static loadScene = () => import('./scenes/plasma.js');

  static animatableProps = {
    ...BaseEffect.animatableProps,
    scroll_speed_x: sceneProp('scroll_speed_x'),
    scroll_speed_y: sceneProp('scroll_speed_y'),
    base_frequency: sceneProp('base_frequency', { min: 0.0001 }),
    color_a: sceneColorProp('a'),
    color_b: sceneColorProp('b')
  };

  static colorKeys = { color_a: 'a', color_b: 'b' };
}

/** `fluid` on WebGL (scenes/fluid.js); Canvas2D: FluidTextureEffect */
export class FluidGLEffect extends NoiseFieldEffect {
  static loadScene = () => import('./scenes/fluid.js');

  static animatableProps = {
    ...BaseEffect.animatableProps,
    scroll_speed_x: sceneProp('scroll_speed_x'),
    scroll_speed_y: sceneProp('scroll_speed_y'),
    base_frequency: sceneProp('base_frequency', { min: 0.0001 }),
    color: sceneColorProp('wash')
  };

  static colorKeys = { color: 'wash' };
}

/**
 * `holo-sphere` on WebGL (scenes/holo-sphere.js); Canvas2D: HoloSphereEffect.
 * The rotation angle is integrated here, as the Canvas2D version does, so a
 * `rotate_speed` change never jumps and a rebuild carries on (`_angle`).
 */
export class HoloSphereGLEffect extends ThreeSceneEffect {
  static loadScene = () => import('./scenes/holo-sphere.js');

  static animatableProps = {
    ...BaseEffect.animatableProps,
    rotate_speed: sceneProp('rotate_speed'),
    tilt: sceneProp('tilt', { min: -90, max: 90 }),
    size: sceneProp('size', { min: 0 }),
    position_x: sceneProp('position_x'),
    position_y: sceneProp('position_y'),
    back_opacity: sceneProp('back_opacity', { min: 0, max: 1 }),
    line_width: sceneProp('line_width', { min: 0.1 }),
    color: sceneColorProp('lines'),
    scan_color: sceneColorProp('scan')
  };

  /** @param {{ params?: Record<string, any>, colors?: Record<string, string[]>, opacity?: number }} [config] */
  constructor(config = {}) {
    super(config);
    /** Rotation in degrees */
    this._angle = 0;
  }

  /**
   * @param {number} deltaTime
   * @param {number} w
   * @param {number} h
   */
  update(deltaTime, w, h) {
    super.update(deltaTime, w, h);
    this._angle = (this._angle + (this.params.rotate_speed ?? 1) * 0.006 * deltaTime * this.speed) % 360;
  }
}

/**
 * A Canvas2D effect's animatable keys, applied to the model a WebGL effect
 * wraps (`effect.model`): the keys, their limits and colour handling stay
 * the Canvas2D effect's own.
 * @param {Record<string, import('../effects/animatable-props.js').AnimatableProp>} props
 * @param {string[]} keys
 * @returns {Record<string, import('../effects/animatable-props.js').AnimatableProp>}
 */
function onModel(props, keys) {
  return Object.fromEntries(keys.map((key) => {
    const prop = props[key];
    return [key, { ...prop, get: (e) => prop.get(e.model), set: (e, v) => prop.set(e.model, v) }];
  }));
}

/**
 * `nebula` with `volumetric: true` on WebGL (scenes/nebula.js). The clouds,
 * their drift and colours are a NebulaEffect (the Canvas2D effect, never
 * drawn): the same seeded layout as `nebula` without `volumetric`, shaded
 * with noise on the GPU.
 */
export class NebulaGLEffect extends ThreeSceneEffect {
  static loadScene = () => import('./scenes/nebula.js');

  static animatableProps = {
    ...BaseEffect.animatableProps,
    ...onModel(NebulaEffect.animatableProps, ['scroll_speed_x', 'scroll_speed_y', 'turbulence'])
  };

  /**
   * @param {{ model: NebulaEffect, opacity?: number }} config - the model is a NebulaEffect built from the same config
   */
  constructor(config) {
    super({ opacity: config.opacity });
    this.model = config.model;
  }

  /** Scroll offsets live on the model; exposed so a rebuild carries them */
  get _scrollOffsetX() { return this.model._scrollOffsetX; }
  set _scrollOffsetX(v) { this.model._scrollOffsetX = v; }
  get _scrollOffsetY() { return this.model._scrollOffsetY; }
  set _scrollOffsetY(v) { this.model._scrollOffsetY = v; }

  /**
   * @param {number} deltaTime
   * @param {number} w
   * @param {number} h
   */
  update(deltaTime, w, h) {
    super.update(deltaTime, w, h);
    this.model.speed = this.speed;
    this.model.update(deltaTime, w, h);
  }

  /** @param {Record<string, any>} cfg - entity-bound values (camelCase copies included) */
  updateConfig(cfg) {
    if (cfg.opacity !== undefined) this.opacity = cfg.opacity;
    if (cfg.speed !== undefined) this.speed = cfg.speed;
    if (cfg.noiseScale !== undefined) this.model.noiseScale = cfg.noiseScale;
  }

  /**
   * F1: the model takes the new palette (same seed, same colour slots).
   * @param {any} fresh
   * @returns {boolean}
   */
  recolorFrom(fresh) {
    if (!(fresh instanceof NebulaGLEffect) || !this.model.recolorFrom(fresh.model)) return false;
    this._scene?.setColors({});
    return true;
  }

  destroy() {
    this.model.destroy();
    super.destroy();
  }
}

/**
 * `grid` (and `grid-diagonal`, `grid-hexagonal`) on WebGL (scenes/grid.js):
 * the grid per pixel on a ground plane through a camera; `view: flat` lands
 * on the Canvas2D pixels, `view: floor` is a perspective floor. The pattern,
 * scroll and colours are a GridEffect (the Canvas2D effect, never drawn):
 * same keys, same defaults, same recolour.
 */
export class GridGLEffect extends ThreeSceneEffect {
  static loadScene = () => import('./scenes/grid.js');

  static animatableProps = {
    ...BaseEffect.animatableProps,
    ...onModel(GridEffect.animatableProps, [
      'scroll_speed_x', 'scroll_speed_y', 'line_spacing', 'line_width', 'line_width_minor', 'line_width_major',
      'color', 'color_major', 'fill_color'
    ]),
    camera_tilt: sceneProp('camera_tilt', { min: 1, max: 90 }),
    camera_yaw: sceneProp('camera_yaw'),
    camera_distance: sceneProp('camera_distance', { min: 0.05 }),
    fov: sceneProp('fov', { min: 5, max: 150 }),
    scan_color: sceneColorProp('scan')
  };

  /**
   * @param {{ model: GridEffect, params?: Record<string, any>, colors?: Record<string, string[]>, opacity?: number }} config
   */
  constructor(config) {
    super({ params: config.params, colors: config.colors, opacity: config.opacity });
    this.model = config.model;
  }

  /** Scroll lives on the model; exposed so a rebuild carries it */
  get scrollX() { return this.model.scrollX; }
  set scrollX(v) { this.model.scrollX = v; }
  get scrollY() { return this.model.scrollY; }
  set scrollY(v) { this.model.scrollY = v; }

  /**
   * @param {number} deltaTime
   * @param {number} w
   * @param {number} h
   */
  update(deltaTime, w, h) {
    super.update(deltaTime, w, h);
    this.model.speed = this.speed;
    this.model.update(deltaTime, w, h);
  }

  /**
   * Entity-bound values that are not animatable keys.
   * @param {Record<string, any>} cfg
   */
  updateConfig(cfg) {
    if (cfg.opacity !== undefined) this.opacity = cfg.opacity;
    if (cfg.speed !== undefined) this.speed = cfg.speed;
    for (const key of ['view', 'scan_period']) if (cfg[key] !== undefined) this.params[key] = cfg[key];
  }

  /**
   * F1: the model takes the new palette; the scan colour from the fresh copy.
   * @param {any} fresh
   * @returns {boolean}
   */
  recolorFrom(fresh) {
    if (!(fresh instanceof GridGLEffect) || !this.model.recolorFrom(fresh.model)) return false;
    this.colors = fresh.colors;
    this._pushColors();
    return true;
  }

  destroy() {
    this.model.destroy();
    super.destroy();
  }
}
