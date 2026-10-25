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
import { CameraRig, viewToKeys, parseLimits, DEFAULT_KEYS } from './camera-rig.js';
import { LabelLayer } from './label-layer.js';
import { markerSvg } from './markers.js';
import { buildScene, LABEL_COLORS } from './scene-builder.js';
import { skyState } from './sky.js';
import { num } from './objects/common.js';

const DEG = Math.PI / 180;
/** The sun crosses its own width in about 2 minutes: recompute the sky this often */
const SKY_INTERVAL_MS = 60_000;

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
 * @property {(reason: string) => void} [onFail] - no WebGL, or the context was lost
 */

/**
 * @typedef {Object} AstroSceneApi
 * @property {(config: any) => void} setConfig
 * @property {(hass: any) => void} setHass
 * @property {(view: string | Record<string, any>, opts?: { duration?: number }) => Promise<void>} flyTo
 * @property {() => void} requestFrame
 * @property {() => void} recolor - re-resolve theme colours (theme or alert change)
 * @property {() => void} dispose
 * @property {() => any} debug - state for tests and the console
 */

const CSS = `
.astro-scene { position: relative; width: 100%; height: 100%; overflow: hidden; touch-action: none; user-select: none; }
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
  const style = document.createElement('style');
  style.textContent = CSS;
  const canvas = document.createElement('canvas');
  wrap.append(style, canvas);
  host.append(wrap);
  const ctx2d = canvas.getContext('2d');
  const labels = new LabelLayer(wrap, { snap: cfg.labels?.snap === true });

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
  let cssW = 1;
  let cssH = 1;
  let dpr = 1;
  let dragging = false;
  let reduced = prefersReducedMotion();
  /** @type {string | null} */
  let selected = null;
  /** @type {import('./sky.js').SkyState | null} */
  let sky = null;
  let usesSky = false;
  /** @type {Set<import('three').Texture>} */
  const textures = new Set();
  const loader = new TextureLoader();
  loader.setCrossOrigin('anonymous');

  const rig = new CameraRig({ onChange: () => requestFrame() });
  /** @type {import('./scene-builder.js').AstroScene | null} */
  let world = null;
  /** @type {Record<string, any>} */
  let views = {};
  let cameraKey = '';

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
    loadTexture: (url) => {
      const t = loader.load(url, () => requestFrame(), undefined, () => lcardsLog.warn(`[Astrometrics] could not load image ${url}`));
      textures.add(t);
      return t;
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
    }
    return changed;
  }
  const skyTimer = setInterval(() => { if (refreshSky()) requestFrame(); }, SKY_INTERVAL_MS);

  /** Initial camera from the config (view by name, else the first, else framing the bounds) */
  function initialView() {
    const cam = cfg.camera ?? {};
    views = cam.views && typeof cam.views === 'object' ? cam.views : {};
    rig.limits = parseLimits(cam.limits);
    const name = cam.view !== undefined && views[cam.view] ? cam.view : Object.keys(views)[0];
    const view = name ? views[name] : null;
    const b = world?.bounds;
    // A named view that leaves out yaw faces north; with no view, frame the bounds at an angle
    const base = { ...DEFAULT_KEYS, tx: b?.center.x ?? 0, ty: b?.center.y ?? 0, tz: b?.center.z ?? 0, distance: (b?.radius ?? 100) * 2.8, ...(view ? { yaw: 0 } : {}) };
    rig.set({ ...base, ...viewToKeys(view, (r) => world?.places.resolve(r) ?? null) }, view?.projection === 'orthographic' ? 'orthographic' : 'perspective');
  }

  function build() {
    world?.dispose();
    world = null;
    ready = false;
    ctx.places = null;
    usesSky = (Array.isArray(cfg.points) && cfg.points.some((p) => p?.sky)) || (Array.isArray(cfg.objects) && cfg.objects.some((o) => o?.sky));
    if (usesSky) refreshSky();
    world = buildScene(cfg, ctx, { cssColor });
    labels.snap = cfg.labels?.snap === true;
    labels.setItems(world.labels);
    for (const it of world.labels) {
      labels.style(it.id, { color: it.id === selected ? cssColor(null, LABEL_COLORS.selected) : it.color, svg: markerSvg(it.marker, sky?.moon) });
    }
    for (const b of world.list) for (const f of b.gridFaces) {
      const u = f.userData.uniforms;
      f.userData.baseWidths ??= [u.uWidthMinor.value, u.uWidthMajor.value];
    }
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
      const pts = /** @type {any} */ (world.stars?.node.children[0]);
      if (pts?.material) {
        pts.userData.baseSize ??= pts.material.size;
        pts.material.size = pts.userData.baseSize * dpr;
      }
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
      for (const b of world.list) {
        if (!b.spin) continue;
        b.node.rotation.y += b.spin * DEG * (dt / 1000);
        moving = true;
      }
      const auto = num(cfg.camera?.auto_rotate, 0);
      if (auto && !dragging && !rig.flying) {
        rig.keys.yaw += auto * (dt / 1000);
        moving = true;
      }
    }
    const flying = rig.step(now);
    rig.apply();
    const camera = rig.camera;
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
    updateLabels(camera);
    frames++;
    if (moving || flying) requestFrame();
  }

  /** @param {import('three').Camera} camera */
  function updateLabels(camera) {
    if (!world) return;
    for (const it of labels.items) {
      const def = /** @type {any} */ (it).def;
      it.world = world.places.get(it.id);
      it.alphaScale = 1;
      const alt = def.sky ? sky?.[/** @type {'sun' | 'moon'} */ (def.sky)]?.altitude : Array.isArray(def.altaz) ? Number(def.altaz[1]) : undefined;
      if (alt !== undefined && alt < 0) {
        const mode = def.below_horizon ?? (def.sky ? 'dim' : 'show');
        it.alphaScale = mode === 'hide' ? 0 : mode === 'dim' ? 0.35 : 1;
      }
    }
    /** @type {import('./label-layer.js').Occluder[]} */
    const occluders = [];
    for (const b of world.list) {
      if (!b.occludes || !b.radius) continue;
      const center = new Vector3().setFromMatrixPosition(b.node.matrixWorld);
      const scale = new Vector3().setFromMatrixScale(b.node.matrixWorld).x;
      occluders.push({ center, radius: b.radius * scale, id: b.id });
    }
    labels.update(camera, cssW, cssH, occluders);
  }

  // Picking ----------------------------------------------------------------
  const ray = new Raycaster();
  const ndc = new Vector2();
  /** @type {{ x: number, y: number, t: number } | null} */
  let down = null;
  /** @param {PointerEvent} e */
  const onDown = (e) => {
    down = { x: e.clientX, y: e.clientY, t: performance.now() };
    dragging = true;
  };
  /** @param {PointerEvent} e */
  const onUp = (e) => {
    dragging = false;
    const d = down;
    down = null;
    if (!d || !world || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6 || performance.now() - d.t > 600) return;
    const r = canvas.getBoundingClientRect();
    tap(e.clientX - r.left, e.clientY - r.top);
  };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', () => { dragging = false; down = null; });

  /**
   * A tap at (x, y) CSS px: the nearest point marker, else an object with a
   * `tap_action` under it.
   * @param {number} x
   * @param {number} y
   */
  function tap(x, y) {
    if (!world) return;
    const hit = labels.pick(x, y);
    if (hit && hit.world) {
      const def = /** @type {any} */ (hit).def;
      const info = { kind: /** @type {const} */ ('point'), id: hit.id, config: def, position: hit.world.clone() };
      if (options.onTap?.(info) === true) return;
      if (def.tap_action && def.tap_action.action !== 'fly-to') return;
      select(hit.id);
      flyToPosition(info.position, def.view);
      return;
    }
    ndc.set((x / cssW) * 2 - 1, -(y / cssH) * 2 + 1);
    ray.setFromCamera(ndc, rig.camera);
    const tappable = world.list.filter((b) => b.config.tap_action !== undefined && b.pickMeshes.length);
    const hits = ray.intersectObjects(tappable.flatMap((b) => b.pickMeshes), false);
    if (!hits.length) return;
    const obj = tappable.find((b) => b.pickMeshes.includes(hits[0].object));
    if (!obj) return;
    const c = obj.centre ?? [0, 0, 0];
    const position = new Vector3(c[0], c[1], c[2]).applyMatrix4(obj.node.matrixWorld);
    if (options.onTap?.({ kind: 'object', id: obj.id, config: obj.config, position }) === true) return;
    if (obj.config.tap_action?.action === 'fly-to') flyToPosition(position, obj.config.view);
  }

  /** @param {string | null} id */
  function select(id) {
    selected = id;
    labels.select(id);
    for (const it of labels.items) {
      labels.style(it.id, { color: it.id === id ? cssColor(null, LABEL_COLORS.selected) : /** @type {any} */ (it).color });
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
    return rig.flyTo(keys, { duration: num(cfg.camera?.fly_duration, 1600), ease: cfg.camera?.ease });
  }

  /**
   * @param {string | Record<string, any>} view - a view name, a point id (`{ point: id }`), or keys
   * @param {{ duration?: number }} [opts]
   */
  function flyTo(view, opts = {}) {
    if (!world) return Promise.resolve();
    const duration = opts.duration ?? num(cfg.camera?.fly_duration, 1600);
    if (typeof view === 'string') {
      if (views[view]) {
        const v = views[view];
        return rig.flyTo(viewToKeys(v, (r) => world?.places.resolve(r) ?? null), { duration, ease: cfg.camera?.ease, projection: v.projection === 'orthographic' ? 'orthographic' : 'perspective' });
      }
      const p = world.places.get(view);
      if (p) return flyToPosition(p);
      lcardsLog.warn(`[Astrometrics] no view or point '${view}'`);
      return Promise.resolve();
    }
    if (view && typeof view === 'object' && typeof view.point === 'string') {
      const p = world.places.get(view.point);
      return p ? flyToPosition(p, view) : Promise.resolve();
    }
    return rig.flyTo(viewToKeys(view, (r) => world?.places.resolve(r) ?? null), { duration, ease: cfg.camera?.ease });
  }

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
    if (on) rig.attach(canvas, { onStart: () => { dragging = true; } });
    else rig.detach();
    wrap.style.touchAction = on ? 'none' : 'auto';
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
      if (refreshSky()) requestFrame();
    },
    flyTo,
    requestFrame,
    recolor() {
      build();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      clearInterval(skyTimer);
      ro?.disconnect();
      io?.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      document.fonts?.removeEventListener?.('loadingdone', onFonts);
      offReduced();
      rig.dispose();
      labels.dispose();
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
        ready,
        failed,
        keys: { ...rig.keys },
        projection: rig.projection,
        labels: { ...labels.stats },
        sky,
        world,
        rig,
        labelItems: labels.items,
        tap
      };
    }
  };
}
