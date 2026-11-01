/**
 * `type: model`: a glTF / GLB file (`src`: `/local/...`, a URL, or
 * `builtin:<key>` from the LCARdS model library) as an astrometrics object.
 * A lazy chunk of its own (GLTFLoader and the meshopt decoder), loaded only
 * when a config has a model (`usesModels()` in `../names.js`).
 *
 * Structure: the object's node (spins) > `fit` (scales the file to `size`,
 * its largest extent, centred on its bounds; without `size`, to its real size
 * in the scene's or system's `units`: `length` metres long, else as the file
 * measures in `file_units`) > `file` (the glTF
 * scene in the file's own coordinates). Points on the model (`object:
 * <model>`, `xyz`, `part`) are in file space, so `size` never moves them.
 * Until the file is in, a faint pulsing box stands in (of `size`, or about a
 * starship's size) and points on the model wait.
 *
 * Looks: `material: hologram` (default: the shader in
 * `hologram-material.js`) or `original` (the file's own materials, lit by a
 * small light rig). `edges` draws feature edges, `animation` plays clips on
 * the scene clock. Draco files are refused (no decoder is shipped).
 *
 * @module core/astrometrics/model
 */
import {
  Group, Box3, Vector3, LineSegments, LineBasicMaterial, EdgesGeometry, BoxGeometry, Mesh,
  AnimationMixer, LoopRepeat, HemisphereLight, DirectionalLight, SRGBColorSpace
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { scanAt } from '../../packs/backgrounds/webgl/scenes/scan-band.js';
import { built, num, DEFAULT_COLORS } from '../objects/common.js';
import { hologramUniforms, hologramMaterial, depthOnlyMaterial } from './hologram-material.js';
import { OCCLUDER_LAYER } from '../depth-occlusion.js';
import { lcardsLog } from '../../../utils/lcards-logging.js';
import { modelSizeSet, modelLengthSet, realScale } from '../names.js';

/**
 * Feature edges by default up to this many triangles: working them out runs
 * on the main thread (2.5 million triangles took 11 s, and the page froze),
 * and on a model that dense they are noise anyway. `edges: true` still draws them.
 */
export const EDGE_TRIANGLE_BUDGET = 250_000;

/**
 * Triangles in a parsed file.
 * @param {import('three').Object3D} root
 */
export function triangleCount(root) {
  let n = 0;
  root.traverse((o) => {
    const g = /** @type {any} */ (o).isMesh ? /** @type {Mesh} */ (o).geometry : null;
    if (g) n += Math.floor((g.index?.count ?? g.attributes.position?.count ?? 0) / 3);
  });
  return n;
}

/**
 * Fetch and parse a model file (any size: a big file is the dashboard
 * owner's choice, see the models docs' Make it light).
 * @param {string} url
 * @param {{ fetchImpl?: typeof fetch, onProgress?: (loaded: number, total: number) => void }} [o] - onProgress: bytes so far
 *   and the file's size (0 when the server does not say), then once more with loaded -1 while the file is parsed
 * @returns {Promise<import('three/examples/jsm/loaders/GLTFLoader.js').GLTF>}
 */
export async function loadModelFile(url, { fetchImpl = fetch, onProgress } = {}) {
  const res = await fetchImpl(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const total = Number(res.headers.get('content-length')) || 0;
  /** @type {ArrayBuffer} */
  let buf;
  const reader = onProgress ? res.body?.getReader?.() : undefined;
  if (reader) {
    /** @type {Uint8Array[]} */
    const chunks = [];
    let loaded = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      loaded += value.byteLength;
      onProgress?.(loaded, total);
    }
    const all = new Uint8Array(loaded);
    let at = 0;
    for (const c of chunks) {
      all.set(c, at);
      at += c.byteLength;
    }
    buf = all.buffer;
  } else {
    buf = await res.arrayBuffer();
  }
  onProgress?.(-1, total);
  return parseModel(buf, url.slice(0, url.lastIndexOf('/') + 1));
}

/**
 * Parse GLB / glTF bytes (meshopt-compressed or not).
 * @param {ArrayBuffer} buffer
 * @param {string} [path] - where relative URIs in a .gltf resolve
 */
export async function parseModel(buffer, path = '') {
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  try {
    return await loader.parseAsync(buffer, path);
  } catch (error) {
    if (/draco/i.test(String(/** @type {any} */ (error)?.message))) throw new Error('Draco-compressed files are not supported: export without Draco, or with meshopt (gltfpack -cc)');
    throw error;
  }
}

/**
 * Names of the clips to play: `animation: all`, a name, or a list.
 * @param {any} value
 * @param {string[]} available
 */
export function clipNames(value, available) {
  if (value === undefined || value === null || value === false || value === 'none') return [];
  if (value === true || value === 'all') return [...available];
  const want = (Array.isArray(value) ? value : [value]).map(String);
  return want.filter((n) => available.includes(n));
}

/**
 * The fit of a file to `size`: the scale and the offset (applied after the
 * scale) that centre its bounds on the origin.
 * @param {Box3} box - the file's bounds, file space
 * @param {number} size - the largest extent wanted
 */
export function fitTransform(box, size) {
  const extent = box.getSize(new Vector3());
  const largest = Math.max(extent.x, extent.y, extent.z) || 1;
  return scaleTransform(box, size / largest);
}

/**
 * A file drawn at `scale` scene units per file unit (its real size), centred
 * on its bounds.
 * @param {Box3} box - the file's bounds, file space
 * @param {number} scale
 */
export function scaleTransform(box, scale) {
  const extent = box.getSize(new Vector3());
  const centre = box.getCenter(new Vector3());
  return { scale, offset: centre.multiplyScalar(-scale), extent };
}

/** The stand-in's size for a model at its real size, metres (about a starship) */
const REAL_HOLDER_M = 300;

/**
 * How a model is sized: `size` when set, else its real size where the
 * scene (or its system) has units (`length` metres long, else as the file
 * measures in `file_units`), else the default 50.
 * @param {any} cfg
 * @param {number | null | undefined} kmPerSceneUnit
 * @returns {{ size: number | null, real: number | null, isReal: boolean, holder: number }} size (largest extent, scene units)
 *   or real (scene units per file unit); isReal: drawn at its real size (from length or the file); the stand-in box's size, scene units
 */
export function modelSizing(cfg, kmPerSceneUnit) {
  const set = modelSizeSet(cfg);
  if (set !== null) return { size: set, real: null, isReal: false, holder: set };
  const real = realScale(cfg?.file_units, kmPerSceneUnit);
  if (real === null) return { size: 50, real: null, isReal: false, holder: 50 };
  const metresPerUnit = /** @type {number} */ (kmPerSceneUnit) * 1000;
  const length = modelLengthSet(cfg);
  if (length !== null) return { size: length / metresPerUnit, real: null, isReal: true, holder: length / metresPerUnit };
  return { size: null, real, isReal: true, holder: REAL_HOLDER_M / metresPerUnit };
}

/**
 * @param {any} cfg
 * @param {import('../objects/common.js').BuildContext} ctx
 * @returns {import('../objects/common.js').BuiltObject}
 */
export function buildModel(cfg, ctx) {
  const node = new Group();
  node.name = `model:${cfg.id ?? ''}`;
  const fit = new Group();
  fit.name = 'fit';
  const file = new Group();
  file.name = 'file';
  fit.add(file);
  node.add(fit);
  const sizing = modelSizing(cfg, ctx.kmPerUnit?.(cfg._system));
  const size = sizing.holder;
  const opacity = num(cfg.opacity, 0.85);
  const hologram = cfg.material !== 'original';

  // Stand-in until the file is in: a pulsing box of the model's size
  const holderMat = new LineBasicMaterial({ transparent: true, depthWrite: false, opacity: 0.25 });
  const c0 = ctx.color(cfg.color, DEFAULT_COLORS.model);
  holderMat.color.setRGB(c0[0], c0[1], c0[2], SRGBColorSpace);
  const holder = new LineSegments(new EdgesGeometry(new BoxGeometry(size, size * 0.35, size)), holderMat);
  holder.name = 'placeholder';
  node.add(holder);

  /** @type {Map<string, import('three').Object3D>} */
  const parts = new Map();
  /** @type {AnimationMixer[]} one per copy of the file (an original model's hologram twin animates too) */
  const mixers = [];
  /** @type {ReturnType<typeof hologramUniforms> | null} */
  let uniforms = null;
  let state = /** @type {'loading' | 'ready' | 'failed'} */ ('loading');
  let disposed = false;
  const scanPeriod = num(cfg.scan_period, 0);
  const warnedParts = new Set();
  /** @type {number[] | null} the file's extent, its own units (once in) */
  let fileExtent = null;

  const out = built(cfg, node, {
    radius: size / 2,
    placeNode: file,
    occludes: cfg.occlude !== false,
    occluder: 'depth',
    moving: cfg.animation !== undefined && cfg.animation !== 'none',
    isReady: () => state === 'ready',
    partNode(/** @type {string} */ name) {
      const p = parts.get(name);
      if (!p && state === 'ready' && !warnedParts.has(name)) {
        warnedParts.add(name);
        lcardsLog.warn(`[Astrometrics] model '${cfg.id}' has no part '${name}' (parts: ${[...parts.keys()].join(', ')})`);
      }
      return p ?? null;
    },
    partNames: () => [...parts.keys()],
    loadState: () => state,
    drawnSize: size,
    // a real-size model can be drawn larger to stay visible (`model_scale: visible`): its largest extent and the scale
    ...(sizing.isReal ? { realExtent: size, magnify: (/** @type {number} */ k) => magnify(k) } : {}),
    modelInfo: () => (state === 'ready' && fileExtent ? { src: String(cfg.src ?? ''), extent: fileExtent, size: out.drawnSize ?? size, real: sizing.isReal } : null)
  });

  /** The fit before magnifying (the file's scale and centring), once the file is in */
  let fitBase = /** @type {{ scale: number, offset: Vector3 } | null} */ (null);
  let mag = 1;
  /**
   * Drawn k times its real size, about its centre (k 1: its real size).
   * @param {number} k
   */
  const magnify = (k) => {
    if (!(k > 0) || Math.abs(k - mag) <= mag * 1e-4) return;
    mag = k;
    if (fitBase) {
      fit.scale.setScalar(fitBase.scale * k);
      fit.position.copy(fitBase.offset).multiplyScalar(k);
      out.radius = (/** @type {number} */ (out.realExtent) * k) / 2;
    } else {
      holder.scale.setScalar(k);
      out.radius = (size * k) / 2;
    }
  };

  /** @param {import('three/examples/jsm/loaders/GLTFLoader.js').GLTF} gltf */
  const install = (gltf) => {
    if (disposed) return;
    // A copy: the parsed file is cached for rebuilds (geometry and the file's materials are shared)
    const scene = cloneSkinned(gltf.scene);
    scene.updateMatrixWorld(true);
    const box = new Box3().setFromObject(scene);
    const { scale, offset, extent } = sizing.real !== null ? scaleTransform(box, sizing.real) : fitTransform(box, size);
    const largest = Math.max(extent.x, extent.y, extent.z);
    out.radius = (largest * scale * mag) / 2;
    out.drawnSize = largest * scale;
    if (sizing.isReal) out.realExtent = largest * scale;
    fitBase = { scale, offset: offset.clone() };
    fileExtent = [extent.x, extent.y, extent.z];
    fit.scale.setScalar(scale * mag);
    fit.position.copy(offset).multiplyScalar(mag);
    file.add(scene);
    node.remove(holder);
    holder.geometry.dispose();
    holderMat.dispose();

    scene.traverse((o) => { if (o.name && o !== scene && !parts.has(o.name)) parts.set(o.name, o); });
    const triangles = triangleCount(scene);
    const edgesByDefault = triangles <= EDGE_TRIANGLE_BUDGET;
    if (!edgesByDefault && cfg.edges === undefined) {
      lcardsLog.info(`[Astrometrics] model '${cfg.id}': ${triangles.toLocaleString('en-US')} triangles, so no feature edges (edges: true draws them, slowly)`);
    }

    /**
     * The hologram look on a copy of the file: one shader, a depth twin per mesh (solid).
     * @param {import('three').Object3D} copy
     */
    const makeHologram = (copy) => {
      const look = {
        color: c0,
        rim: ctx.color(cfg.rim_color, DEFAULT_COLORS.modelRim),
        scan: ctx.color(cfg.scan_color, DEFAULT_COLORS.scan),
        opacity,
        scanlines: Math.min(1, Math.max(0, num(cfg.scanlines, 0.5)))
      };
      uniforms = hologramUniforms(look);
      // The scan runs along the longest axis, over the file's bounds
      const axis = extent.x >= extent.y && extent.x >= extent.z ? 'x' : extent.y >= extent.z ? 'y' : 'z';
      uniforms.uAxis.value.set(axis === 'x' ? 1 : 0, axis === 'y' ? 1 : 0, axis === 'z' ? 1 : 0);
      uniforms.uRange.value = [box.min[axis], box.max[axis]];
      const mat = hologramMaterial(uniforms, { additive: cfg.blend !== 'normal' });
      const solid = cfg.solid !== false;
      const depthMat = solid ? depthOnlyMaterial() : null;
      /** @type {Mesh[]} */
      const meshes = [];
      copy.traverse((o) => { if (/** @type {any} */ (o).isMesh) meshes.push(/** @type {Mesh} */ (o)); });
      const u = uniforms;
      // view space to the file's own space, per render in doubles (in float32 on
      // the GPU, a model far from the origin would lose its scanlines)
      /** @param {any} _r @param {any} _s @param {import('three').Camera} camera */
      const viewToModel = (_r, _s, camera) => { u.uViewToModel.value.multiplyMatrices(camera.matrixWorldInverse, file.matrixWorld).invert(); };
      for (const m of meshes) {
        m.material = mat;
        m.renderOrder = 1;
        m.onBeforeRender = viewToModel;
        // the depth twin: same geometry, depth only (not for skinned meshes: they would need the skeleton)
        if (depthMat && !(/** @type {any} */ (m).isSkinnedMesh)) {
          const twin = new Mesh(m.geometry, depthMat);
          twin.name = '';
          m.add(twin);
        }
      }
    };

    /**
     * Feature edges as lines on a copy of the file.
     * @param {import('three').Object3D} copy
     * @param {boolean} holo - a hologram's (its rim colour)
     */
    const addEdges = (copy, holo) => {
      const ec = ctx.color(cfg.edge_color, holo ? DEFAULT_COLORS.modelRim : DEFAULT_COLORS.model);
      const edgeMat = new LineBasicMaterial({ transparent: true, depthWrite: false, opacity: (ec[3] ?? 1) * Math.min(1, opacity + 0.15) });
      edgeMat.color.setRGB(ec[0], ec[1], ec[2], SRGBColorSpace);
      const angle = num(cfg.edge_angle, 30);
      /** @type {Mesh[]} */
      const meshes = [];
      copy.traverse((o) => { if (/** @type {any} */ (o).isMesh && !(/** @type {any} */ (o).isSkinnedMesh)) meshes.push(/** @type {Mesh} */ (o)); });
      for (const m of meshes) {
        const lines = new LineSegments(new EdgesGeometry(m.geometry, angle), edgeMat);
        lines.renderOrder = 2;
        m.add(lines);
      }
    };

    /** @type {import('three').Object3D[]} copies of the file that animate */
    const copies = [scene];
    if (hologram) {
      makeHologram(scene);
    } else {
      // Own copies of the file's materials: the parsed file is shared between
      // objects, and one object's distance fade must not fade the others
      scene.traverse((o) => {
        const m = /** @type {any} */ (o);
        if (m.isMesh) m.material = Array.isArray(m.material) ? m.material.map((x) => x.clone()) : m.material.clone();
      });
      // The file's own materials, lit (the other objects are unlit: only these see the lights)
      const hemi = new HemisphereLight(0xffffff, 0x404858, 1.4);
      const sun = new DirectionalLight(0xffffff, 2);
      sun.position.set(1, 2, 1.5);
      node.add(hemi, sun);
      // the diagram look draws it as a hologram: a twin, hidden but in that look (looks.js)
      const twin = cloneSkinned(gltf.scene);
      twin.visible = false;
      file.add(twin);
      makeHologram(twin);
      if (cfg.edges ?? edgesByDefault) addEdges(twin, true);
      copies.push(twin);
      out.lookParts = { realistic: [scene], diagramOnly: [twin] };
    }

    if (cfg.edges ?? (hologram && edgesByDefault)) addEdges(scene, hologram);

    scene.traverse((o) => { if (/** @type {any} */ (o).isMesh && /** @type {any} */ (o).material?.name !== 'lcards-hologram-depth') out.pickMeshes.push(o); });
    // The meshes hide labels behind them (the depth pass renders this layer)
    if (cfg.occlude !== false) for (const m of out.pickMeshes) m.layers.enable(OCCLUDER_LAYER);

    const names = clipNames(cfg.animation, gltf.animations.map((a) => a.name));
    if (names.length) {
      for (const copy of copies) {
        const m = new AnimationMixer(copy);
        for (const name of names) {
          const clip = gltf.animations.find((a) => a.name === name);
          if (clip) m.clipAction(clip).setLoop(LoopRepeat, Infinity).play();
        }
        mixers.push(m);
      }
    } else if (cfg.animation !== undefined && cfg.animation !== 'none' && gltf.animations.length) {
      lcardsLog.warn(`[Astrometrics] model '${cfg.id}': no animation '${cfg.animation}' (clips: ${gltf.animations.map((a) => a.name).join(', ')})`);
    }
    state = 'ready';
    ctx.requestFrame();
  };

  const src = String(cfg.src ?? '');
  const load = ctx.loadModel ? ctx.loadModel(src) : null;
  if (!src || !load) {
    state = 'failed';
    holderMat.opacity = 0.1;
    if (!src) lcardsLog.warn(`[Astrometrics] model '${cfg.id}' has no src`);
  } else {
    load.then(install, (/** @type {any} */ error) => {
      if (disposed) return;
      state = 'failed';
      holderMat.opacity = 0.1;
      lcardsLog.warn(`[Astrometrics] could not load model '${cfg.id}' (${src}): ${error?.message ?? error}`);
      ctx.requestFrame();
    });
  }

  out.tick = (dt, t) => {
    if (state === 'loading') {
      holderMat.opacity = 0.15 + 0.15 * (0.5 + 0.5 * Math.sin(t / 300));
      return true;
    }
    if (state !== 'ready') return false;
    let moving = false;
    if (mixers.length) {
      for (const m of mixers) m.update(dt / 1000);
      moving = true;
    }
    if (uniforms && scanPeriod > 0) {
      const { pos, strength } = scanAt(t, scanPeriod);
      uniforms.uScanPos.value = pos;
      uniforms.uScanStrength.value = strength;
      moving = true;
    }
    return moving;
  };
  out.dispose = () => {
    disposed = true;
    for (const m of mixers) m.stopAllAction();
  };
  out.dynamic = true;
  return out;
}

