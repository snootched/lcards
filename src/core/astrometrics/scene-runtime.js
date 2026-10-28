/**
 * The astrometrics scene runtime (lazy chunk, with three.js): a 3D scene of
 * grids, volumes, globes, orbits and routes with DOM labels, an orbiting
 * camera and named views, rendered **on demand** through the page's shared
 * WebGL context (`three-runtime.js`) into the host's own 2D canvas.
 *
 * Nothing draws unless something changed: a camera key (drag, wheel, a
 * fly-to), a spinning object or auto-rotate, data (the sky timer, Home
 * Assistant state), a resize or a theme change. An idle scene costs nothing;
 * off screen and in a hidden tab nothing draws. Reduced motion holds spin and
 * auto-rotate and makes fly-to jump.
 *
 * Free of card concerns: the card (E2b) passes config, `hass`, a colour
 * resolver and an `onTap` hook, and calls the returned API.
 *
 *   const s = createAstroScene(host, config, { hass, resolveColor, onTap });
 *   s.setConfig(config); s.setHass(hass); await s.flyTo('map'); s.requestFrame(); s.recolor(); s.dispose();
 *
 * @module core/astrometrics/scene-runtime
 */
import { TextureLoader, Raycaster, Vector2, Vector3 } from 'three';
import { acquire, release, render as sharedRender } from '../packs/backgrounds/webgl/three-runtime.js';
import { webglAvailable } from '../packs/backgrounds/webgl/webgl-support.js';
import { parseColorToRgba } from '../packs/textures/effects/noise-helpers.js';
import { resolveColor as defaultResolveColor } from '../themes/resolve-color.js';
import { prefersReducedMotion, onReducedMotionChange } from '../../utils/reduced-motion.js';
import { lcardsLog } from '../../utils/lcards-logging.js';
import { CameraRig, viewToKeys, parseLimits, clampKeys, screenRay, rayPlane, DEFAULT_KEYS } from './camera-rig.js';
import { LabelLayer } from './label-layer.js';
import { CardLayer, pointCard } from './card-layer.js';
import { markerSvg } from './markers.js';
import { DepthOcclusion } from './depth-occlusion.js';
import { buildScene, makeLabelItem } from './scene-builder.js';
import { BINDABLE_FORMS } from './placements.js';
import { FatLine } from './lines.js';
import { skyState } from './sky.js';
import { warpTails } from './star-field.js';
import { STAR_SHELL } from './objects/stars.js';
import { num, stepObjects } from './objects/common.js';
import { usesEffects, usesModels } from './names.js';

const DEG = Math.PI / 180;
/** Point keys that place it: a rule patch on one moves the point */
const PLACE_KEYS = ['xyz', 'polar', 'latlon', 'altaz', 'sky', 'at', 'cell', 'object', 'part', 'alt', 'offset'];
/** Point keys that shape its label: a rule patch on one rebuilds that label */
const LABEL_KEYS = ['label', 'text', 'style', 'color', 'marker', 'priority', 'overlap', 'fade', 'min_distance', 'max_distance', 'tap_action', 'card'];
/** The sun crosses its own width in about 2 minutes: recompute the sky this often */
const SKY_INTERVAL_MS = 60_000;
/** A press this long is a hold (Home Assistant's hold time); a tap must be shorter */
const HOLD_MS = 500;
/** Movement (CSS px) that turns a press into a drag */
const TAP_SLOP = 6;
/** Two taps in blank space this close in time (ms) and place (CSS px) are a double-tap */
const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_SLOP = 24;
/** A double-tap zoom flies this long (ms) */
const DOUBLE_TAP_FLY_MS = 450;
/** A button or key held this long (ms) after its first step moves continuously */
const PRESS_REPEAT_MS = 300;

/**
 * Camera commands (on-card buttons, keys): one step on press, then a rate
 * while held. Pan in view heights (x right, y up: the view moves), zoom in
 * zoom steps, orbit in degrees (as a drag the same way would).
 * @type {Record<string, { step: import('./camera-rig.js').CameraMotion, rate: import('./camera-rig.js').CameraMotion }>}
 */
export const CAMERA_COMMANDS = {
  'pan-left': { step: { pan: [-0.15, 0] }, rate: { pan: [-0.8, 0] } },
  'pan-right': { step: { pan: [0.15, 0] }, rate: { pan: [0.8, 0] } },
  'pan-up': { step: { pan: [0, 0.15] }, rate: { pan: [0, 0.8] } },
  'pan-down': { step: { pan: [0, -0.15] }, rate: { pan: [0, -0.8] } },
  'zoom-in': { step: { zoom: 1 }, rate: { zoom: 1.5 } },
  'zoom-out': { step: { zoom: -1 }, rate: { zoom: -1.5 } },
  'orbit-left': { step: { orbit: [15, 0] }, rate: { orbit: [60, 0] } },
  'orbit-right': { step: { orbit: [-15, 0] }, rate: { orbit: [-60, 0] } },
  'orbit-up': { step: { orbit: [0, -10] }, rate: { orbit: [0, -40] } },
  'orbit-down': { step: { orbit: [0, 10] }, rate: { orbit: [0, 40] } }
};

/** @type {Record<string, string>} key (shift + key with an `S` prefix) to command */
const KEY_COMMANDS = {
  ArrowLeft: 'pan-left', ArrowRight: 'pan-right', ArrowUp: 'pan-up', ArrowDown: 'pan-down',
  SArrowLeft: 'orbit-left', SArrowRight: 'orbit-right', SArrowUp: 'orbit-up', SArrowDown: 'orbit-down',
  '+': 'zoom-in', '=': 'zoom-in', '-': 'zoom-out', _: 'zoom-out'
};

/**
 * @typedef {Object} AstroTapHit
 * @property {'point' | 'object'} kind
 * @property {string} id
 * @property {any} config - the point or object config
 * @property {Vector3} position - world
 */

/**
 * @typedef {Object} AstroSceneOptions
 * @property {any} [hass]
 * @property {(value: any, opts?: any) => any} [resolveColor] - resolveColor() (`concrete` for WebGL, CSS for labels)
 * @property {(hit: AstroTapHit) => boolean | void} [onTap] - return true when handled (else a point flies to itself)
 * @property {(hit: AstroTapHit) => void} [onHold] - a press held HOLD_MS within the tap distance, on a point or an object with a `hold_action`
 * @property {(reason: string) => void} [onFail] - no WebGL, or the context was lost
 * @property {(sky: import('./sky.js').SkyState) => void} [onSky] - the sky changed (a recompute that moved the sun or moon, at most once a minute); for label templates that read it
 * @property {(card: Record<string, any>) => HTMLElement | null} [mountCard] - build the element for a point's Lovelace card (`card.card`); without it points show no cards
 * @property {(el: HTMLElement, hass: any) => void} [setCardHass] - give a mounted card hass
 */

/**
 * Edit mode (the Astrometrics Studio): taps select instead of acting.
 * @typedef {Object} AstroEditHooks
 * @property {(hit: AstroTapHit | null) => void} [onSelect] - a tap: what is under it (any point or object), null in blank space
 * @property {(id: string, form: string, value: number[] | string, done: boolean) => void} [onDrag] - set to let points be dragged:
 *   the point's new value in its own placement form (`dragForm`), per move and once more with `done` on release (shown live, no rebuild)
 */

/**
 * Run-time label values the card resolves (templates, state colours), CSS values.
 * @typedef {Object} AstroLabelValues
 * @property {string} [color] - the point's colour (marker)
 * @property {string} [selectedColor]
 * @property {Record<string, { text?: string, color?: string, selectedColor?: string, background?: string }>} [fields]
 */

/**
 * @typedef {Object} AstroSceneApi
 * @property {(config: any) => void} setConfig
 * @property {(hass: any) => void} setHass
 * @property {(view: string | Record<string, any>, opts?: { duration?: number, warp?: boolean }) => Promise<void>} flyTo
 * @property {() => void} requestFrame
 * @property {() => void} recolor - re-resolve theme colours (theme or alert change)
 * @property {(command: string) => void} press - start a camera command (CAMERA_COMMANDS name, or `reset`): one step, then held motion
 * @property {() => void} release - end the pressed command
 * @property {(opts?: { duration?: number }) => Promise<void>} home - fly back to the start view
 * @property {(x: number, y: number, opts?: { out?: boolean }) => Promise<void>} zoomTo - the double-tap zoom at CSS px (x, y)
 * @property {(hooks: AstroEditHooks | null) => void} setEditMode - while set, taps select (any point or object) and run no actions; no double-tap zoom
 * @property {(id: string | null, kind?: 'point' | 'object') => void} highlight - mark a point (the default) or an object as selected
 *   (an object gets a box round it); null clears
 * @property {() => { target: number[], yaw: number, tilt: number, distance: number, fov: number, projection: 'perspective' | 'orthographic' }} cameraKeys -
 *   the camera now, as a view's keys
 * @property {(handler: ((x: number, y: number) => void) | null) => void} setPickHandler - while set, a tap goes to it (no actions, no double-tap)
 * @property {(x: number, y: number, form: string, object?: string) => (number[] | string | null)} placeAt - a placement form's value for the spot at CSS px (x, y), or null
 * @property {(x: number, y: number) => ({ form: string, value: number[] | string, object?: string } | null)} placementAt - a new
 *   point's placement for the spot at CSS px (x, y): on the object under it in its natural form (`latlon` on a sphere,
 *   `altaz` on a dome, `cell` on a lettered grid, else `xyz` local to it), else `xyz` on the ground; null when neither is hit
 * @property {(id: string) => (string[] | null)} partNames - a model object's named parts, null until it has loaded (or not a model)
 * @property {(values: Record<string, AstroLabelValues>) => void} setLabelValues - label text and colours by point id (no rebuild)
 * @property {(values: Record<string, Record<string, number[] | null>>) => void} updatePoints - positions from entities by point id (no rebuild)
 * @property {(patches: { points?: Record<string, any>, objects?: Record<string, any> }) => void} patch - rule effects on points and objects (no world rebuild)
 * @property {() => import('./sky.js').SkyState | null} sky - the sky now (null when nothing follows the sky)
 * @property {() => void} dispose
 * @property {() => any} debug - state for tests and the console
 */

const CSS = `
.astro-scene { position: relative; width: 100%; height: 100%; overflow: hidden; touch-action: none; user-select: none; outline: none; }
.astro-scene:focus-visible { box-shadow: inset 0 0 0 var(--ha-border-width-md) var(--primary-color); }
.astro-scene > canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.astro-scene .astro-message { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  font-family: var(--lcars-font, 'Antonio'), sans-serif; color: var(--lcards-moonlight); opacity: 0.7; }
`;

/**
 * @param {HTMLElement | ShadowRoot} host - where the scene goes (sized by the card)
 * @param {any} config
 * @param {AstroSceneOptions} [options]
 * @returns {AstroSceneApi}
 */
export function createAstroScene(host, config, options = {}) {
  const resolve = options.resolveColor ?? defaultResolveColor;
  let hass = options.hass ?? null;
  let cfg = config ?? {};

  const wrap = document.createElement('div');
  wrap.className = 'astro-scene';
  wrap.setAttribute('role', 'application');
  wrap.setAttribute('aria-label', 'Astrometrics scene: arrows pan, shift and arrows orbit, plus and minus zoom, Home resets');
  const style = document.createElement('style');
  style.textContent = CSS;
  const canvas = document.createElement('canvas');
  wrap.append(style, canvas);
  host.append(wrap);
  const ctx2d = canvas.getContext('2d');
  const labels = new LabelLayer(wrap, { snap: cfg.labels?.snap === true });
  const cards = new CardLayer(wrap, { mount: options.mountCard, setHass: options.setCardHass, onResize: () => requestFrame() });
  cards.setHass(hass);
  /** The points' cards, from the label items (the last definition of an id wins) */
  const syncCards = () => cards.setCards(/** @type {import('./card-layer.js').PointCard[]} */ ((world?.labels ?? []).map((l) => pointCard(l.def)).filter(Boolean)));

  const user = { onContextLost: () => fail('context lost') };
  let failed = false;
  let renderer = /** @type {import('three').WebGLRenderer | null} */ (null);
  if (webglAvailable()) renderer = acquire(user);
  else queueMicrotask(() => fail('no webgl'));

  let raf = 0;
  let pending = false;
  let onScreen = true;
  let ready = false;
  let disposed = false;
  let last = 0;
  let frames = 0;
  /** The scene clock (ms): object motion (drift, scan, flow) reads it; it holds under reduced motion */
  let clock = 0;
  /** @type {Vector3 | null} the camera position last frame (warp streaks) */
  let lastCamera = null;
  let cssW = 1;
  let cssH = 1;
  let dpr = 1;
  let dragging = false;
  let reduced = prefersReducedMotion();
  /** @type {string | null} */
  let selected = null;
  /** @type {string | null} the object with the selection box (edit mode) */
  let boxed = null;
  /** @type {FatLine | null} */
  let boxLine = null;
  /** @type {typeof import('./edit-tools.js') | null} edit-mode maths, loaded with the first edit mode (dashboards never need it) */
  let tools = null;
  /** @type {Map<string, AstroLabelValues>} */
  const labelValues = new Map();
  /** @type {Map<string, Record<string, number[] | null>>} positions from entities, by point id */
  const boundValues = new Map();
  /** @type {Map<string, number>} label opacity from rules (visible: false is 0), by point id */
  const pointAlpha = new Map();
  let builds = 0;
  let objectBuilds = 0;
  /** @type {import('./sky.js').SkyState | null} */
  let sky = null;
  let usesSky = false;
  /** @type {Set<import('three').Texture>} */
  const textures = new Set();
  const loader = new TextureLoader();
  loader.setCrossOrigin('anonymous');
  /** @type {Map<string, Promise<import('three/examples/jsm/loaders/GLTFLoader.js').GLTF>>} model files by URL, parsed once for every build */
  const modelFiles = new Map();

  const rig = new CameraRig({ onChange: () => requestFrame() });
  /** Labels hidden behind meshes (models): a small depth pass, read back a frame late */
  const depth = new DepthOcclusion({ onSnapshot: () => { depthFresh = true; requestFrame(); } });
  /** A new depth image is in: lay the labels out again once, without a new capture */
  let depthFresh = false;
  /** @type {import('./scene-builder.js').AstroScene | null} */
  let world = null;
  /** @type {Record<string, any>} */
  let views = {};
  let cameraKey = '';
  /** @type {{ keys: import('./camera-rig.js').CameraKeys, projection: 'perspective' | 'orthographic' } | null} the start view, for reset */
  let home = null;

  /** @type {import('./objects/common.js').BuildContext} */
  const ctx = {
    color: (value, fallback) => {
      const fb = resolve(fallback, { concrete: true, element: wrap, fallback: '#ffffff' });
      const c = resolve(value ?? fallback, { concrete: true, element: wrap, fallback: fb });
      if (c === 'transparent') return [0, 0, 0, 0];
      const p = parseColorToRgba(typeof c === 'string' ? c : String(fb), '#ffffff');
      return [p.r / 255, p.g / 255, p.b / 255, p.a ?? 1];
    },
    places: null,
    sky: () => sky,
    requestFrame: () => requestFrame(),
    loadTexture: (src) => {
      // builtin:<key>: an image from the LCARdS image library (builtin:earth_blue_marble)
      const key = src.startsWith('builtin:') ? src.slice('builtin:'.length) : null;
      const url = key ? (window.lcards?.core?.assetManager?.resolveImageUrl?.(key) ?? '') : src;
      if (key && !url) lcardsLog.warn(`[Astrometrics] no built-in image '${key}'`);
      const t = loader.load(url, () => requestFrame(), undefined, () => lcardsLog.warn(`[Astrometrics] could not load image ${url}`));
      textures.add(t);
      return t;
    },
    loadModel: (src, maxMB) => {
      const models = ctx.models;
      if (!models) return null;
      // builtin:<key>: a model from the LCARdS model library (builtin:constitution)
      const key = src.startsWith('builtin:') ? src.slice('builtin:'.length) : null;
      const url = key ? (window.lcards?.core?.assetManager?.resolveModelUrl?.(key) ?? '') : src;
      if (!url) return Promise.reject(new Error(`no built-in model '${key}'`));
      const cacheKey = `${url}|${maxMB}`;
      let p = modelFiles.get(cacheKey);
      if (!p) {
        p = models.loadModelFile(url, { maxBytes: maxMB * 1024 * 1024 });
        modelFiles.set(cacheKey, p);
        // a failed load is tried again on the next build
        p.catch(() => modelFiles.delete(cacheKey));
      }
      return p;
    }
  };
  /** @param {any} value @param {string} fallback */
  const cssColor = (value, fallback) => String(resolve(value ?? fallback, { fallback: resolve(fallback) }) ?? fallback);

  /** @param {string} reason */
  function fail(reason) {
    if (failed || disposed) return;
    failed = true;
    lcardsLog.warn(`[Astrometrics] scene unavailable (${reason})`);
    if (renderer) release(user);
    renderer = null;
    if (options.onFail) options.onFail(reason);
    else {
      const msg = document.createElement('div');
      msg.className = 'astro-message';
      msg.textContent = reason === 'no webgl' ? '3D view needs WebGL' : '3D view stopped (graphics context lost)';
      wrap.append(msg);
    }
  }

  function refreshSky() {
    if (!usesSky) return false;
    const next = skyState(hass);
    const changed = !sky || Math.abs(next.sun.azimuth - sky.sun.azimuth) > 1e-3 || Math.abs(next.sun.altitude - sky.sun.altitude) > 1e-3
      || Math.abs(next.moon.azimuth - sky.moon.azimuth) > 1e-3 || new Date(next.time).toDateString() !== new Date(sky.time).toDateString();
    sky = next;
    if (changed) {
      for (const it of labels.items) if (it.marker === 'moon_phase') labels.style(it.id, { svg: markerSvg('moon_phase', sky.moon) });
      options.onSky?.(sky);
    }
    return changed;
  }
  const skyTimer = setInterval(() => { if (refreshSky()) requestFrame(); }, SKY_INTERVAL_MS);

  /** Initial camera from the config (view by name, else the first, else framing the bounds) */
  function initialView() {
    const cam = cfg.camera ?? {};
    views = cam.views && typeof cam.views === 'object' ? cam.views : {};
    const name = cam.view !== undefined && views[cam.view] ? cam.view : Object.keys(views)[0];
    const view = name ? views[name] : null;
    const b = world?.bounds;
    // A named view that leaves out yaw faces north; with no view, frame the bounds at an angle
    const base = { ...DEFAULT_KEYS, tx: b?.center.x ?? 0, ty: b?.center.y ?? 0, tz: b?.center.z ?? 0, distance: (b?.radius ?? 100) * 2.8, ...(view ? { yaw: 0 } : {}) };
    rig.set({ ...base, ...viewToKeys(view, (r) => world?.places.resolve(r) ?? null) }, view?.projection === 'orthographic' ? 'orthographic' : 'perspective');
    home = { keys: { ...rig.keys }, projection: rig.projection };
  }

  /**
   * The scene's extent for the default target limit: the objects' bounds,
   * grown to take in every labelled point and every view target.
   * @returns {{ center: [number, number, number], radius: number } | undefined}
   */
  function sceneSphere() {
    if (!world) return undefined;
    const c = world.bounds.center;
    let r = world.bounds.radius;
    /** @param {Vector3 | null | undefined} p */
    const take = (p) => { if (p) r = Math.max(r, p.distanceTo(c)); };
    for (const it of world.labels) take(world.places.get(it.id));
    const vs = cfg.camera?.views && typeof cfg.camera.views === 'object' ? Object.values(cfg.camera.views) : [];
    for (const v of vs) if (v && typeof v === 'object' && v.target !== undefined) take(world.places.resolve(v.target));
    return { center: [c.x, c.y, c.z], radius: r };
  }

  /** Camera options that need no new view: pan and drag modes, zoom, limits */
  function applyCameraOptions() {
    const cam = cfg.camera ?? {};
    rig.panMode = cam.pan === 'ground' ? 'ground' : 'screen';
    rig.dragMode = cam.drag === 'pan' ? 'pan' : 'orbit';
    rig.zoomTo = cam.zoom_to === 'target' ? 'target' : 'cursor';
    rig.zoomStep = num(cam.zoom_step, 2) > 1 ? num(cam.zoom_step, 2) : 2;
    rig.limits = parseLimits(cam.limits, sceneSphere());
  }

  /** @type {{ effects?: Promise<void>, models?: Promise<void> }} the lazy chunks loading */
  const chunkLoads = {};
  /** Bumped per waiting build, so only the last one builds when the chunks arrive */
  let chunkWait = 0;

  /**
   * The lazy chunks this config needs that are not in yet (a failed load
   * leaves null: the scene builds without them).
   * @returns {Promise<void>[]}
   */
  function missingChunks() {
    const want = [];
    if (usesEffects(cfg) && ctx.effects === undefined) {
      want.push(chunkLoads.effects ??= import('./effects/index.js').then((m) => { ctx.effects = m; }, (error) => {
        lcardsLog.warn('[Astrometrics] could not load the scene effects:', error);
        ctx.effects = null;
      }));
    }
    if (usesModels(cfg) && ctx.models === undefined) {
      want.push(chunkLoads.models ??= import('./model/index.js').then((m) => { ctx.models = m; }, (error) => {
        lcardsLog.warn('[Astrometrics] could not load the model loader:', error);
        ctx.models = null;
      }));
    }
    return want;
  }

  function build() {
    world?.dispose();
    world = null;
    ready = false;
    ctx.places = null;
    // A nebula (or another noise effect) needs the effects chunk, a model the model chunk: build once they are in
    const want = missingChunks();
    if (want.length) {
      const gen = ++chunkWait;
      Promise.all(want).then(() => { if (!disposed && gen === chunkWait) build(); });
      return;
    }
    // The sky clock runs for sky points and paths, and for label templates that read sky.*
    usesSky = (Array.isArray(cfg.points) && cfg.points.some((p) => p?.sky || /\bsky\./.test(JSON.stringify(p?.text ?? p?.label ?? ''))))
      || (Array.isArray(cfg.objects) && cfg.objects.some((o) => o?.sky));
    if (usesSky) refreshSky();
    world = buildScene(cfg, ctx, { cssColor });
    builds++;
    labels.snap = cfg.labels?.snap === true;
    labels.setItems(world.labels);
    syncCards();
    for (const it of world.labels) if (it.marker !== 'none') labels.style(it.id, { svg: markerSvg(it.marker, sky?.moon) });
    labels.select(selected);
    showBox();
    // What the card resolved before this build (templates, state colours, entity positions) stays
    for (const [id, v] of labelValues) labels.style(id, v);
    for (const [id, forms] of boundValues) for (const [form, value] of Object.entries(forms)) world.places.setPosition(id, /** @type {any} */ (form), value);
    for (const b of world.list) for (const f of b.gridFaces) {
      const u = f.userData.uniforms;
      f.userData.baseWidths ??= [u.uWidthMinor.value, u.uWidthMajor.value];
    }
    applyCameraOptions();
    const key = JSON.stringify(cfg.camera ?? null);
    if (key !== cameraKey) {
      cameraKey = key;
      initialView();
    }
    resize();
    // Compile and upload off the frame (the first draw would stall otherwise)
    const r = renderer;
    const w = world;
    if (!r) return;
    rig.apply();
    r.compileAsync(w.scene, rig.camera).catch(() => {}).then(() => {
      if (disposed || world !== w) return;
      ready = true;
      requestFrame();
    });
  }

  function resize() {
    const rect = wrap.getBoundingClientRect();
    cssW = Math.max(1, rect.width || wrap.clientWidth || 1);
    cssH = Math.max(1, rect.height || wrap.clientHeight || 1);
    dpr = Math.min(2, globalThis.devicePixelRatio || 1);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    rig.aspect = cssW / cssH;
    if (world) {
      for (const b of world.list) {
        for (const l of b.lines) l.setResolution(cssW, cssH);
        for (const f of b.gridFaces) {
          const [minor, major] = f.userData.baseWidths ?? [1, 2];
          f.userData.uniforms.uWidthMinor.value = minor * dpr;
          f.userData.uniforms.uWidthMajor.value = major * dpr;
        }
      }
      for (const f of [world.stars?.field, world.dust?.field]) f?.setResolution(cssW, cssH, dpr);
      boxLine?.setResolution(cssW, cssH);
    }
    labels.invalidateSizes();
    requestFrame();
  }

  function requestFrame() {
    if (disposed || failed) return;
    if (!onScreen || document.hidden) { pending = true; return; }
    if (!raf) raf = requestAnimationFrame(frame);
  }

  /** @param {number} now */
  function frame(now) {
    raf = 0;
    if (disposed || failed || !world || !ready || !renderer) return;
    if (!onScreen || document.hidden) { pending = true; return; }
    pending = false;
    const dt = last ? Math.min(100, now - last) : 0;
    last = now;
    let moving = false;
    if (!reduced) {
      clock += dt;
      moving = stepObjects(world.list, dt, clock);
      const auto = num(cfg.camera?.auto_rotate, 0);
      if (auto && !dragging && !rig.flying) {
        rig.keys.yaw += auto * (dt / 1000);
        moving = true;
      }
    }
    const settle = depthFresh;
    depthFresh = false;
    const flying = rig.step(now);
    rig.apply();
    const camera = rig.camera;
    streaks(camera.position, dt, flying);
    // Stars sit at infinity: they move with the camera
    world.stars?.node.position.copy(camera.position);
    world.layout();
    for (const b of world.list) for (const l of b.lines) l.updateDashes(camera, cssW, cssH);

    const W = canvas.width;
    const H = canvas.height;
    let out = null;
    try {
      out = sharedRender(world.scene, camera, W, H);
    } catch (error) {
      lcardsLog.warn('[Astrometrics] render failed:', error);
      fail('render failed');
      return;
    }
    if (out && ctx2d) {
      ctx2d.clearRect(0, 0, W, H);
      ctx2d.drawImage(out.source, 0, out.sy, W, H, 0, 0, W, H);
      out.done?.();
    }
    if (!settle) captureDepth(camera);
    updateLabels(camera);
    frames++;
    if (moving || flying) requestFrame();
  }

  /**
   * Warp streaks: while a warp fly-to moves the camera, stars and dust
   * stretch along the motion (`backdrop.stars.streak`, default 1); round
   * again when it lands. Off under reduced motion (the fly jumps).
   * @param {Vector3} position - the camera's, this frame
   * @param {number} dt - ms
   * @param {boolean} flying
   */
  function streaks(position, dt, flying) {
    if (!world) return;
    const fields = [world.stars?.field, world.dust?.field].filter((f) => !!f);
    const warping = flying && rig.warp && !reduced;
    const tails = warping && lastCamera
      ? warpTails(position.clone().sub(lastCamera), dt, { sceneRadius: world.bounds.radius, shell: STAR_SHELL, streak: num(cfg.backdrop?.stars?.streak, 1) })
      : null;
    lastCamera = position.clone();
    if (!fields.length) return;
    world.stars?.field?.setTail(tails?.stars ?? null);
    world.dust?.field?.setTail(tails?.dust ?? null);
  }

  /** Objects whose meshes hide labels by depth (loaded models), this frame */
  function depthOccluders() {
    return world ? world.list.filter((b) => b.occludes && b.occluder === 'depth' && (b.isReady?.() ?? true) && (world?.outer.get(b)?.visible ?? true)) : [];
  }

  /**
   * Render the depth occluders for the label pass, when the camera or one
   * of them changed since the last capture (a moving one: every frame).
   * @param {import('three').PerspectiveCamera | import('three').OrthographicCamera} camera
   */
  function captureDepth(camera) {
    const list = depthOccluders();
    if (!renderer || !world || !list.length) {
      depth.clear();
      return;
    }
    const moving = list.some((b) => b.spin || b.moving || b.config.at !== undefined);
    const key = moving ? String(frames) : `${camera.matrixWorld.elements.join(',')}|${camera.projectionMatrix.elements.join(',')}|${cssW}x${cssH}|${builds}|${objectBuilds}|${list.map((b) => b.id).join(',')}`;
    depth.capture(renderer, world.scene, camera, cssW, cssH, key);
  }

  /** @param {import('three').Camera} camera */
  function updateLabels(camera) {
    if (!world) return;
    for (const it of labels.items) {
      const def = /** @type {any} */ (it).def;
      it.world = world.places.get(it.id);
      it.alphaScale = pointAlpha.get(it.id) ?? 1;
      const alt = def.sky ? sky?.[/** @type {'sun' | 'moon'} */ (def.sky)]?.altitude : Array.isArray(def.altaz) ? Number(def.altaz[1]) : undefined;
      if (alt !== undefined && alt < 0) {
        const mode = def.below_horizon ?? (def.sky ? 'dim' : 'show');
        it.alphaScale *= mode === 'hide' ? 0 : mode === 'dim' ? 0.35 : 1;
      }
    }
    /** @type {import('./label-layer.js').Occluder[]} */
    const occluders = [];
    for (const b of world.list) {
      if (!b.occludes || !b.radius) continue;
      const center = new Vector3().setFromMatrixPosition(b.node.matrixWorld);
      const scale = new Vector3().setFromMatrixScale(b.node.matrixWorld).x;
      if (b.occluder === 'depth') continue;
      occluders.push({ center, radius: b.radius * scale, id: b.id });
    }
    const snapshot = depth.snapshot;
    if (snapshot && depthOccluders().length) {
      // A point on a model may sit a little inside it (a part's origin, seen along the part): 5 % of the model's size
      /** @type {Map<string, number>} */
      const biases = new Map();
      for (const b of depthOccluders()) {
        const scale = new Vector3().setFromMatrixScale(b.node.matrixWorld).x;
        biases.set(b.id, (b.radius ?? 1) * 2 * scale * 0.05);
      }
      const near = (world.bounds.radius || 100) * 0.002;
      occluders.push({ kind: 'depth', snapshot, id: '', bias: (host) => (host !== null && biases.get(host)) || near });
    }
    labels.update(camera, cssW, cssH, occluders);
    cards.update((id) => labels.item(id), cssW, cssH);
  }

  // Picking ----------------------------------------------------------------
  const ray = new Raycaster();
  const ndc = new Vector2();
  /** @type {{ x: number, y: number, t: number, moved: boolean, held: boolean } | null} */
  let down = null;
  let holdTimer = /** @type {ReturnType<typeof setTimeout> | undefined} */ (undefined);
  /** @type {{ id: string, form: string, def: any, value: number[] | string | null } | null} a point being dragged (edit mode) */
  let pointDrag = null;
  /**
   * The draggable point under (x, y) CSS px in edit mode, or null.
   * @param {number} x
   * @param {number} y
   */
  const draggableAt = (x, y) => {
    if (!world || !tools || !editHooks?.onDrag || pickHandler) return null;
    const hit = labels.pick(x, y);
    const def = hit ? world.places.configs.get(hit.id) : undefined;
    const form = tools.dragForm(def);
    return hit && form ? { id: hit.id, form, def } : null;
  };
  /** @param {PointerEvent} e */
  const onDown = (e) => {
    if (e.button > 0) return;
    const d = { x: e.clientX, y: e.clientY, t: performance.now(), moved: false, held: false };
    down = d;
    dragging = true;
    const r0 = canvas.getBoundingClientRect();
    const grab = draggableAt(e.clientX - r0.left, e.clientY - r0.top);
    pointDrag = grab ? { ...grab, value: null } : null;
    if (pointDrag) {
      canvas.setPointerCapture?.(e.pointerId);
      canvas.style.cursor = 'grabbing';
    }
    clearTimeout(holdTimer);
    if (options.onHold) {
      holdTimer = setTimeout(() => {
        if (down !== d || d.moved) return;
        d.held = true;
        const r = canvas.getBoundingClientRect();
        hold(d.x - r.left, d.y - r.top);
      }, HOLD_MS);
    }
  };
  /** @param {PointerEvent} e */
  const onMove = (e) => {
    if (down && !down.moved && Math.hypot(e.clientX - down.x, e.clientY - down.y) > TAP_SLOP) down.moved = true;
    const r = canvas.getBoundingClientRect();
    if (pointDrag && down?.moved) {
      dragPoint(pointDrag, e.clientX - r.left, e.clientY - r.top);
    } else if (!down && editHooks?.onDrag && !pickHandler) {
      canvas.style.cursor = draggableAt(e.clientX - r.left, e.clientY - r.top) ? 'grab' : '';
    }
  };
  /** @param {PointerEvent} e */
  const onUp = (e) => {
    dragging = false;
    clearTimeout(holdTimer);
    const d = down;
    down = null;
    const drag = pointDrag;
    pointDrag = null;
    if (drag) {
      canvas.style.cursor = 'grab';
      if (d?.moved) {
        if (drag.value !== null) editHooks?.onDrag?.(drag.id, drag.form, drag.value, true);
        return;
      }
    }
    if (!d || !world || d.held || d.moved || Math.hypot(e.clientX - d.x, e.clientY - d.y) > TAP_SLOP || performance.now() - d.t >= HOLD_MS) return;
    const r = canvas.getBoundingClientRect();
    tap(e.clientX - r.left, e.clientY - r.top, e.shiftKey);
  };
  const onCancel = () => {
    dragging = false;
    down = null;
    clearTimeout(holdTimer);
    // A cancelled drag puts the point back
    if (pointDrag && world) world.places.replaceDef(pointDrag.id, pointDrag.def);
    pointDrag = null;
    canvas.style.cursor = '';
    requestFrame();
  };

  /**
   * Move a dragged point to (x, y) CSS px, live (no rebuild), and tell the
   * hooks. `xyz` and `polar` slide on the point's own horizontal plane; the
   * surface forms follow the object under the pointer.
   * @param {{ id: string, form: string, def: any, value: number[] | string | null }} drag
   * @param {number} x
   * @param {number} y
   */
  function dragPoint(drag, x, y) {
    if (!world || !tools) return;
    const host = drag.def.object ? world.objects.get(String(drag.def.object)) : undefined;
    const value = drag.form === 'xyz' || drag.form === 'polar'
      ? tools.planeDragValue(screenRay(rig.keys, rig.projection, x, y, cssW, cssH), drag.def, drag.form, host ? (host.placeNode ?? host.node) : null)
      : placeAt(x, y, drag.form, host ? String(drag.def.object) : undefined);
    if (value === null || value === undefined) return;
    drag.value = value;
    world.places.replaceDef(drag.id, { ...drag.def, [drag.form]: value });
    requestFrame();
    editHooks?.onDrag?.(drag.id, drag.form, value, false);
  }
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onCancel);

  /**
   * What is under (x, y) CSS px: the nearest point marker, else an object
   * whose config has `key` (`tap_action`, `hold_action`) under it (any
   * object when `key` is null).
   * @param {number} x
   * @param {number} y
   * @param {string | null} key
   * @returns {AstroTapHit | null}
   */
  function pickAt(x, y, key) {
    if (!world) return null;
    const hit = labels.pick(x, y);
    if (hit && hit.world) return { kind: 'point', id: hit.id, config: /** @type {any} */ (hit).def, position: hit.world.clone() };
    /** @param {import('./objects/common.js').BuiltObject} obj @returns {AstroTapHit} */
    const objectHit = (obj) => {
      const c = obj.centre ?? [0, 0, 0];
      return { kind: 'object', id: obj.id, config: obj.config, position: new Vector3(c[0], c[1], c[2]).applyMatrix4(obj.node.matrixWorld) };
    };
    // Edit mode: what is drawn only with lines (rings, paths, beams, glows) is picked by its distance on screen
    if (key === null && tools) {
      let near = null;
      let best = tools.SELECT_RADIUS;
      for (const b of world.list) {
        if (b.pickMeshes.length || w0(b)) continue;
        const dist = tools.screenDistance(b, rig.camera, cssW, cssH, x, y);
        if (dist <= best) { best = dist; near = b; }
      }
      if (near) return objectHit(near);
    }
    ndc.set((x / cssW) * 2 - 1, -(y / cssH) * 2 + 1);
    ray.setFromCamera(ndc, rig.camera);
    const candidates = world.list.filter((b) => (key === null || b.config[key] !== undefined) && b.pickMeshes.length);
    const hits = ray.intersectObjects(candidates.flatMap((b) => b.pickMeshes), false);
    const obj = hits.length ? candidates.find((b) => b.pickMeshes.includes(hits[0].object)) : undefined;
    return obj ? objectHit(obj) : null;
  }

  /**
   * Whether an object is hidden (its `visible`, a rule): not picked.
   * @param {import('./objects/common.js').BuiltObject} b
   */
  function w0(b) {
    return world?.outer.get(b)?.visible === false;
  }

  /**
   * The selection box round the `boxed` object, in a theme colour, drawn
   * through everything; rebuilt with the world.
   */
  function showBox() {
    if (boxLine) {
      boxLine.object.removeFromParent();
      boxLine.dispose();
      boxLine = null;
    }
    const b = boxed && world ? world.objects.get(boxed) : undefined;
    if (!b || !tools) return;
    const box = tools.localBox(b.node);
    if (box.isEmpty()) return;
    // A little larger than the object, so the box does not sit on its edges
    box.expandByScalar(Math.max(0.5, box.getSize(new Vector3()).length() * 0.02));
    boxLine = new FatLine(tools.boxRuns(box), { color: ctx.color('var(--lcards-moonlight)', '#ffffff'), width: 2, opacity: 0.9, renderOrder: 20 });
    boxLine.material.depthTest = false;
    boxLine.material.transparent = true;
    boxLine.setResolution(cssW, cssH);
    b.node.add(boxLine.object);
    requestFrame();
  }

  /**
   * A hold at (x, y) CSS px: only what has a `hold_action` (a point's
   * marker is picked even without one, the card ignores it then).
   * @param {number} x
   * @param {number} y
   */
  function hold(x, y) {
    if (editHooks) return;
    const hit = pickAt(x, y, 'hold_action');
    if (hit && hit.config?.hold_action !== undefined) options.onHold?.(hit);
  }

  /** @type {{ x: number, y: number, t: number } | null} the last tap in blank space */
  let blankTap = null;
  /** @type {((x: number, y: number) => void) | null} picking a position (the editor) */
  let pickHandler = null;
  /** @type {AstroEditHooks | null} edit mode (the Studio) */
  let editHooks = null;

  /**
   * A placement form's value for what is under (x, y) CSS px: on the
   * object's surface (local to it) when `object` names one, else on the
   * ground plane (y = 0). Rounded to what a person would type.
   * @param {number} x
   * @param {number} y
   * @param {string} form - xyz, polar, latlon, altaz or cell
   * @param {string} [object]
   * @returns {number[] | string | null}
   */
  function placeAt(x, y, form, object) {
    if (!world) return null;
    const host = object ? world.objects.get(object) : undefined;
    if (object && !host) return null;
    ndc.set((x / cssW) * 2 - 1, -(y / cssH) * 2 + 1);
    ray.setFromCamera(ndc, rig.camera);
    /** @type {Vector3 | null} */
    let local = null;
    if (host) {
      const hit = ray.intersectObjects(host.pickMeshes, false)[0];
      // a model's points are in its file's coordinates; a deformed grid's on its undeformed surface
      if (hit) local = host.unwarpHit?.(hit) ?? (host.placeNode ?? host.node).worldToLocal(hit.point.clone());
    } else {
      const r = screenRay(rig.keys, rig.projection, x, y, cssW, cssH);
      const g = rayPlane(r, [0, 0, 0], [0, 1, 0], 0.02);
      if (g) local = new Vector3(g[0], g[1], g[2]);
    }
    if (!local) return null;
    const r1 = (/** @type {number} */ v) => Math.round(v * 10) / 10;
    const bearing = (((Math.atan2(local.x, -local.z) / DEG) % 360) + 360) % 360;
    const R = local.length() || 1;
    switch (form) {
      case 'xyz': return [r1(local.x), r1(local.y), r1(local.z)];
      case 'polar': return [r1(Math.hypot(local.x, local.z)), r1(bearing)];
      case 'latlon': return [r1(Math.asin(local.y / R) / DEG), r1(Math.atan2(local.x, local.z) / DEG)];
      case 'altaz': return [r1(bearing), r1(Math.asin(local.y / R) / DEG)];
      case 'cell': return host?.cellAt?.(local) ?? null;
      default: return null;
    }
  }

  /**
   * A new point's placement for (x, y) CSS px: on the object (with a pick
   * mesh and an id) under it in the form that suits its surface, else on
   * the ground.
   * @param {number} x
   * @param {number} y
   * @returns {{ form: string, value: number[] | string, object?: string } | null}
   */
  function placementAt(x, y) {
    if (!world) return null;
    ndc.set((x / cssW) * 2 - 1, -(y / cssH) * 2 + 1);
    ray.setFromCamera(ndc, rig.camera);
    // A point names its object by id: objects without one are not stood on
    const candidates = world.list.filter((o) => o.pickMeshes.length && !w0(o) && o.config.id !== undefined);
    const hits = ray.intersectObjects(candidates.flatMap((o) => o.pickMeshes), false);
    const b = hits.length ? candidates.find((o) => o.pickMeshes.includes(hits[0].object)) : undefined;
    if (b) {
      const shape = b.type === 'grid' ? String(b.config.shape ?? 'plane') : '';
      const forms = b.type === 'sphere' || shape === 'sphere' ? ['latlon', 'xyz'] : shape === 'dome' ? ['altaz', 'xyz'] : b.cellAt ? ['cell', 'xyz'] : ['xyz'];
      for (const form of forms) {
        const value = placeAt(x, y, form, b.id);
        if (value !== null) return { form, value, object: b.id };
      }
    }
    const value = placeAt(x, y, 'xyz');
    return value === null ? null : { form: 'xyz', value };
  }

  /**
   * A tap at (x, y) CSS px: the nearest point marker, else an object with a
   * `tap_action` under it. Two taps in blank space are a double-tap: zoom
   * toward the spot (out with shift), unless `camera.double_tap: none`.
   * @param {number} x
   * @param {number} y
   * @param {boolean} [shift]
   */
  function tap(x, y, shift = false) {
    if (pickHandler) {
      pickHandler(x, y);
      return;
    }
    if (editHooks) {
      editHooks.onSelect?.(pickAt(x, y, null));
      return;
    }
    const hit = pickAt(x, y, 'tap_action');
    // A tap anywhere but on the open card's point closes it
    if (cards.openId && cards.openId !== hit?.id) {
      if (selected === cards.openId) select(null);
      cards.close();
      requestFrame();
    }
    if (!hit) {
      const now = performance.now();
      const b = blankTap;
      if (b && now - b.t < DOUBLE_TAP_MS && Math.hypot(x - b.x, y - b.y) <= DOUBLE_TAP_SLOP && cfg.camera?.double_tap !== 'none' && cfg.camera?.controls !== false) {
        blankTap = null;
        zoomTo(x, y, { out: shift });
      } else {
        blankTap = { x, y, t: now };
      }
      return;
    }
    blankTap = null;
    const action = hit.config?.tap_action;
    // A point with a tap card: the tap opens (or closes) it and selects the
    // point; an explicit fly-to tap_action flies too, other actions do not run
    if (hit.kind === 'point' && cards.showsOnTap(hit.id)) {
      const opened = cards.toggle(hit.id);
      select(opened ? hit.id : null);
      if (action?.action === 'fly-to' && options.onTap?.(hit) !== true) flyToPosition(hit.position, hit.config.view);
      return;
    }
    if (options.onTap?.(hit) === true) return;
    if (hit.kind === 'point') {
      if (action && action.action !== 'fly-to') return;
      select(hit.id);
      flyToPosition(hit.position, hit.config.view);
    } else if (action?.action === 'fly-to') {
      flyToPosition(hit.position, hit.config.view);
    }
  }

  /** @param {string | null} id */
  function select(id) {
    selected = id;
    labels.select(id);
    requestFrame();
  }

  /**
   * Rule effects, without rebuilding the world: new configs for some points
   * and objects (the base config with the patch merged, or the base config
   * again when a patch ends). A point's label is rebuilt only when a label
   * key changed; visible / opacity act per frame; a position form moves it.
   * An object's visible toggles it; any other change rebuilds that object.
   * @param {{ points?: Record<string, any>, objects?: Record<string, any> }} patches
   */
  function patch({ points = {}, objects = {} } = {}) {
    if (!world) return;
    const w = world;
    // Keep the config in step, so a rebuild (alert mode) keeps the rule effects
    cfg = {
      ...cfg,
      points: Array.isArray(cfg.points) ? cfg.points.map((p) => (p && points[String(p.id)] !== undefined ? points[String(p.id)] : p)) : cfg.points,
      objects: Array.isArray(cfg.objects) ? cfg.objects.map((o) => (o && o.id !== undefined && objects[String(o.id)] !== undefined ? objects[String(o.id)] : o)) : cfg.objects
    };
    for (const [id, def] of Object.entries(points)) {
      const old = w.places.configs.get(id);
      if (!old || !def) continue;
      if (PLACE_KEYS.some((k) => JSON.stringify(old[k]) !== JSON.stringify(def[k]))) {
        w.places.replaceDef(id, def);
        for (const [form, value] of Object.entries(boundValues.get(id) ?? {})) w.places.setPosition(id, /** @type {any} */ (form), value);
      }
      if (LABEL_KEYS.some((k) => JSON.stringify(old[k]) !== JSON.stringify(def[k]))) {
        if (!PLACE_KEYS.some((k) => JSON.stringify(old[k]) !== JSON.stringify(def[k]))) w.places.configs.set(id, { ...def, id });
        const item = makeLabelItem({ ...def, id }, cfg.labels, cssColor);
        labelValues.delete(id);
        if (item) {
          labels.upsertItem(item);
          if (item.marker !== 'none') labels.style(id, { svg: markerSvg(item.marker, sky?.moon) });
        } else labels.removeItem(id);
        const i = w.labels.findIndex((l) => l.id === id);
        if (i >= 0 && item) w.labels[i] = item;
        else if (i >= 0) w.labels.splice(i, 1);
        else if (item) w.labels.push(item);
      }
      const alpha = def.visible === false ? 0 : def.opacity !== undefined ? Math.min(1, Math.max(0, num(def.opacity, 1))) : 1;
      if (alpha === 1) pointAlpha.delete(id);
      else pointAlpha.set(id, alpha);
    }
    if (Object.keys(points).length) syncCards();
    for (const [id, next] of Object.entries(objects)) {
      const b = w.objects.get(id);
      if (!b || !next) continue;
      const { visible: _a, ...restOld } = b.config;
      const { visible: _b, ...restNew } = next;
      if (JSON.stringify(restOld) === JSON.stringify(restNew)) {
        const g = w.outer.get(b);
        if (g) g.visible = next.visible !== false;
        b.config = { ...next, id };
      } else if (w.rebuildObject(id, next)) {
        objectBuilds++;
        if (id === boxed) showBox();
        renderer?.compileAsync(w.scene, rig.camera).catch(() => {}).then(() => requestFrame());
      }
    }
    requestFrame();
  }

  /**
   * Positions from entities, by point id: `{ shuttle: { latlon: [lat, lon] } }`
   * (null: no position until the next value). No rebuild: one frame.
   * @param {Record<string, Record<string, number[] | null>>} values
   */
  function updatePoints(values) {
    for (const [id, forms] of Object.entries(values ?? {})) {
      const keep = { ...(boundValues.get(id) ?? {}) };
      for (const [form, value] of Object.entries(forms ?? {})) {
        if (!BINDABLE_FORMS.includes(/** @type {any} */ (form))) continue;
        keep[form] = value;
        world?.places.setPosition(id, /** @type {any} */ (form), value);
      }
      boundValues.set(id, keep);
    }
    requestFrame();
  }

  /**
   * Label values from the card (evaluated templates, state colours), by
   * point id; merged into what was set before and kept across rebuilds.
   * @param {Record<string, import('./scene-runtime.js').AstroLabelValues>} values
   */
  function setLabelValues(values) {
    for (const [id, v] of Object.entries(values ?? {})) {
      const prev = labelValues.get(id) ?? {};
      const fields = { ...(prev.fields ?? {}) };
      for (const [name, f] of Object.entries(v.fields ?? {})) fields[name] = { ...(fields[name] ?? {}), ...f };
      const next = { ...prev, ...v, fields };
      labelValues.set(id, next);
      labels.style(id, v);
    }
    requestFrame();
  }

  /**
   * @param {Vector3} p
   * @param {any} [view] - keys to land on (`distance`, `tilt`, `yaw`)
   */
  function flyToPosition(p, view) {
    const base = views[cfg.camera?.view] ?? views[Object.keys(views)[0]];
    const startDist = num(base?.distance, (world?.bounds.radius ?? 100) * 2.8);
    const keys = { tx: p.x, ty: p.y, tz: p.z, distance: Math.min(rig.keys.distance, startDist * 0.35), ...viewToKeys(view, () => null) };
    return rig.flyTo(keys, { duration: num(cfg.camera?.fly_duration, 1600), ease: cfg.camera?.ease, warp: warpFor(view) });
  }

  /**
   * @param {string | Record<string, any>} view - a view name, a point id (`{ point: id }`), or keys
   * @param {{ duration?: number, warp?: boolean }} [opts] - warp: stars streak on the way (default the view's `warp`, else `camera.warp`)
   */
  function flyTo(view, opts = {}) {
    if (!world) return Promise.resolve();
    const duration = opts.duration ?? num(cfg.camera?.fly_duration, 1600);
    if (typeof view === 'string') {
      if (views[view]) {
        const v = views[view];
        return rig.flyTo(viewToKeys(v, (r) => world?.places.resolve(r) ?? null), { duration, ease: cfg.camera?.ease, projection: v.projection === 'orthographic' ? 'orthographic' : 'perspective', warp: opts.warp ?? warpFor(v) });
      }
      const p = world.places.get(view);
      if (p) return flyToPosition(p);
      lcardsLog.warn(`[Astrometrics] no view or point '${view}'`);
      return Promise.resolve();
    }
    if (view && typeof view === 'object' && typeof view.point === 'string') {
      const p = world.places.get(view.point);
      return p ? flyToPosition(p, opts.warp !== undefined ? { ...view, warp: opts.warp } : view) : Promise.resolve();
    }
    return rig.flyTo(viewToKeys(view, (r) => world?.places.resolve(r) ?? null), { duration, ease: cfg.camera?.ease, warp: opts.warp ?? warpFor(view) });
  }

  /**
   * Whether a fly-to streaks the stars: the view's (or landing keys') `warp`, else the card's `camera.warp`.
   * @param {any} [view]
   */
  function warpFor(view) {
    return (view && typeof view === 'object' && typeof view.warp === 'boolean') ? view.warp : cfg.camera?.warp === true;
  }

  /**
   * Where a double-tap at (x, y) CSS px zooms to: an object's surface, else
   * the ground (y = 0) when the ray meets it within the target limit, else
   * the plane through the target facing the camera.
   * @param {number} x
   * @param {number} y
   * @returns {[number, number, number]}
   */
  function zoomSpot(x, y) {
    if (world) {
      ndc.set((x / cssW) * 2 - 1, -(y / cssH) * 2 + 1);
      ray.setFromCamera(ndc, rig.camera);
      const hits = ray.intersectObjects(world.list.flatMap((b) => b.pickMeshes), false);
      if (hits.length) return [hits[0].point.x, hits[0].point.y, hits[0].point.z];
      const r = screenRay(rig.keys, rig.projection, x, y, cssW, cssH);
      const ground = rayPlane(r, [0, 0, 0], [0, 1, 0], 0.15);
      if (ground) {
        const k = clampKeys({ ...rig.keys, tx: ground[0], ty: ground[1], tz: ground[2] }, rig.limits);
        if (k.tx === ground[0] && k.ty === ground[1] && k.tz === ground[2]) return ground;
      }
    }
    return rig.spotAt(x, y, cssW, cssH);
  }

  /**
   * The double-tap zoom: the spot becomes the orbit target, one zoom step
   * closer (further with `out`).
   * @param {number} x
   * @param {number} y
   * @param {{ out?: boolean }} [opts]
   */
  function zoomTo(x, y, { out = false } = {}) {
    if (!world) return Promise.resolve();
    const p = zoomSpot(x, y);
    const distance = rig.keys.distance * (out ? rig.zoomStep : 1 / rig.zoomStep);
    return rig.flyTo({ tx: p[0], ty: p[1], tz: p[2], distance }, { duration: DOUBLE_TAP_FLY_MS, ease: 'outCubic' });
  }

  /** @param {{ duration?: number }} [opts] */
  function goHome({ duration } = {}) {
    if (!home) return Promise.resolve();
    return rig.flyTo(home.keys, { duration: duration ?? num(cfg.camera?.fly_duration, 1600), ease: cfg.camera?.ease, projection: home.projection });
  }

  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let pressTimer;
  /** @param {string} command */
  function press(command) {
    endPress();
    if (command === 'reset') { goHome(); return; }
    const c = CAMERA_COMMANDS[command];
    if (!c) return;
    rig.nudge(c.step);
    pressTimer = setTimeout(() => rig.setMotion(c.rate), PRESS_REPEAT_MS);
  }
  function endPress() {
    clearTimeout(pressTimer);
    pressTimer = undefined;
    if (rig.motion) rig.setMotion(null);
  }

  /** @param {KeyboardEvent} e */
  const onKeyDown = (e) => {
    if (e.key === 'Escape' && cards.openId) {
      if (selected === cards.openId) select(null);
      cards.close();
      requestFrame();
      return;
    }
    // Keys typed into a card on a point are the card's
    if (cards.contains(e)) return;
    if (cfg.camera?.controls === false || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'Home') {
      e.preventDefault();
      if (!e.repeat) press('reset');
      return;
    }
    const command = KEY_COMMANDS[(e.shiftKey ? 'S' : '') + e.key] ?? KEY_COMMANDS[e.key];
    if (!command) return;
    e.preventDefault();
    if (!e.repeat) press(command);
  };
  const onKeyUp = () => endPress();
  wrap.addEventListener('keydown', onKeyDown);
  wrap.addEventListener('keyup', onKeyUp);
  wrap.addEventListener('blur', onKeyUp);

  // Observers --------------------------------------------------------------
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => resize()) : null;
  ro?.observe(wrap);
  const io = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver((entries) => {
    onScreen = entries.some((e) => e.isIntersecting);
    if (onScreen && pending) requestFrame();
  }) : null;
  io?.observe(wrap);
  const onVisibility = () => { if (!document.hidden && pending) { last = 0; requestFrame(); } };
  document.addEventListener('visibilitychange', onVisibility);
  const offReduced = onReducedMotionChange((r) => { reduced = r; last = 0; requestFrame(); });
  const onFonts = () => { labels.invalidateSizes(); requestFrame(); };
  document.fonts?.addEventListener?.('loadingdone', onFonts);
  /** @param {boolean} on */
  const setControls = (on) => {
    if (on) rig.attach(canvas, { onStart: () => { dragging = true; endPress(); }, shouldStart: () => !pointDrag });
    else { rig.detach(); endPress(); }
    wrap.style.touchAction = on ? 'none' : 'auto';
    if (on) wrap.tabIndex = 0;
    else wrap.removeAttribute('tabindex');
  };

  setControls(cfg.camera?.controls !== false);
  build();

  return {
    setConfig(next) {
      cfg = next ?? {};
      setControls(cfg.camera?.controls !== false);
      build();
    },
    setHass(next) {
      hass = next;
      cards.setHass(next);
      if (refreshSky()) requestFrame();
    },
    flyTo,
    press,
    release: endPress,
    home: goHome,
    zoomTo,
    setEditMode(hooks) {
      editHooks = hooks;
      blankTap = null;
      if (hooks && !tools) {
        import('./edit-tools.js').then((m) => {
          tools = m;
          showBox();
        }, (error) => lcardsLog.warn('[Astrometrics] could not load the edit tools:', error));
      }
      if (!hooks) {
        canvas.style.cursor = pickHandler ? 'crosshair' : '';
        boxed = null;
        showBox();
      }
    },
    highlight(id, kind = 'point') {
      select(kind === 'point' ? id : null);
      boxed = kind === 'object' ? id : null;
      showBox();
    },
    cameraKeys() {
      const k = rig.keys;
      const r1 = (/** @type {number} */ v) => Math.round(v * 10) / 10;
      return { target: [r1(k.tx), r1(k.ty), r1(k.tz)], yaw: r1(k.yaw), tilt: r1(k.tilt), distance: r1(k.distance), fov: r1(k.fov), projection: rig.projection };
    },
    setPickHandler(handler) {
      pickHandler = handler;
      blankTap = null;
      canvas.style.cursor = handler ? 'crosshair' : '';
    },
    placeAt,
    placementAt,
    partNames(id) {
      const b = world?.objects.get(id);
      return b?.partNames && b.loadState?.() === 'ready' ? b.partNames() : null;
    },
    requestFrame,
    setLabelValues,
    updatePoints,
    patch,
    sky: () => sky,
    recolor() {
      build();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      clearInterval(skyTimer);
      clearTimeout(holdTimer);
      clearTimeout(pressTimer);
      wrap.removeEventListener('keydown', onKeyDown);
      wrap.removeEventListener('keyup', onKeyUp);
      wrap.removeEventListener('blur', onKeyUp);
      ro?.disconnect();
      io?.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      document.fonts?.removeEventListener?.('loadingdone', onFonts);
      offReduced();
      rig.dispose();
      depth.dispose();
      labels.dispose();
      cards.dispose();
      boxLine?.dispose();
      world?.dispose();
      world = null;
      for (const t of textures) t.dispose();
      textures.clear();
      if (renderer) release(user);
      renderer = null;
      wrap.remove();
    },
    debug() {
      return {
        frames,
        clock,
        builds,
        objectBuilds,
        ready,
        failed,
        keys: { ...rig.keys },
        projection: rig.projection,
        labels: { ...labels.stats },
        sky,
        world,
        rig,
        labelItems: labels.items,
        labelLayer: labels,
        cardLayer: cards,
        depth,
        tap,
        hold,
        boxed,
        selectionBox: boxLine,
        limits: rig.limits,
        home
      };
    }
  };
}
