/**
 * `type: model`: a glTF / GLB file (`src`: `/local/...`, a URL, or
 * `builtin:<key>` from the LCARdS model library) as an astrometrics object.
 * A lazy chunk of its own (GLTFLoader and the meshopt decoder), loaded only
 * when a config has a model (`usesModels()` in `../names.js`).
 *
 * Structure: the object's node (spins) > `fit` (scales the file to `size`,
 * its largest extent, centred on its bounds) > `file` (the glTF scene in the
 * file's own coordinates). Points on the model (`object: <model>`, `xyz`,
 * `part`) are in file space, so `size` never moves them. Until the file is
 * in, a faint pulsing box of `size` stands in and points on the model wait.
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

/** Default `max_file_size`, MB */
export const DEFAULT_MAX_MB = 20;

/**
 * Fetch and parse a model file, refusing one over `maxBytes`.
 * @param {string} url
 * @param {{ maxBytes?: number, fetchImpl?: typeof fetch }} [o]
 * @returns {Promise<import('three/examples/jsm/loaders/GLTFLoader.js').GLTF>}
 */
export async function loadModelFile(url, { maxBytes = DEFAULT_MAX_MB * 1024 * 1024, fetchImpl = fetch } = {}) {
  const res = await fetchImpl(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const len = Number(res.headers.get('content-length'));
  const tooBig = (/** @type {number} */ n) => new Error(`${(n / 1048576).toFixed(1)} MB is over max_file_size (${(maxBytes / 1048576).toFixed(1)} MB)`);
  if (len > maxBytes) throw tooBig(len);
  const buf = await res.arrayBuffer();
  if (buf.byteLength > maxBytes) throw tooBig(buf.byteLength);
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
  const scale = size / largest;
  const centre = box.getCenter(new Vector3());
  return { scale, offset: centre.multiplyScalar(-scale), extent };
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
  const size = Math.max(1e-3, num(cfg.size, 50));
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
  /** @type {AnimationMixer | null} */
  let mixer = null;
  /** @type {ReturnType<typeof hologramUniforms> | null} */
  let uniforms = null;
  let state = /** @type {'loading' | 'ready' | 'failed'} */ ('loading');
  let disposed = false;
  const scanPeriod = num(cfg.scan_period, 0);
  const warnedParts = new Set();

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
    loadState: () => state
  });

  /** @param {import('three/examples/jsm/loaders/GLTFLoader.js').GLTF} gltf */
  const install = (gltf) => {
    if (disposed) return;
    // A copy: the parsed file is cached for rebuilds (geometry and the file's materials are shared)
    const scene = cloneSkinned(gltf.scene);
    scene.updateMatrixWorld(true);
    const box = new Box3().setFromObject(scene);
    const { scale, offset, extent } = fitTransform(box, size);
    fit.scale.setScalar(scale);
    fit.position.copy(offset);
    file.add(scene);
    node.remove(holder);
    holder.geometry.dispose();
    holderMat.dispose();

    scene.traverse((o) => { if (o.name && o !== scene && !parts.has(o.name)) parts.set(o.name, o); });

    if (hologram) {
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
      scene.traverse((o) => { if (/** @type {any} */ (o).isMesh) meshes.push(/** @type {Mesh} */ (o)); });
      for (const m of meshes) {
        m.material = mat;
        m.renderOrder = 1;
        // the depth twin: same geometry, depth only (not for skinned meshes: they would need the skeleton)
        if (depthMat && !(/** @type {any} */ (m).isSkinnedMesh)) {
          const twin = new Mesh(m.geometry, depthMat);
          twin.name = '';
          m.add(twin);
        }
      }
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
    }

    if (cfg.edges ?? hologram) {
      const ec = ctx.color(cfg.edge_color, hologram ? DEFAULT_COLORS.modelRim : DEFAULT_COLORS.model);
      const edgeMat = new LineBasicMaterial({ transparent: true, depthWrite: false, opacity: (ec[3] ?? 1) * Math.min(1, opacity + 0.15) });
      edgeMat.color.setRGB(ec[0], ec[1], ec[2], SRGBColorSpace);
      const angle = num(cfg.edge_angle, 30);
      /** @type {Mesh[]} */
      const meshes = [];
      scene.traverse((o) => { if (/** @type {any} */ (o).isMesh && !(/** @type {any} */ (o).isSkinnedMesh)) meshes.push(/** @type {Mesh} */ (o)); });
      for (const m of meshes) {
        const lines = new LineSegments(new EdgesGeometry(m.geometry, angle), edgeMat);
        lines.renderOrder = 2;
        m.add(lines);
      }
    }

    scene.traverse((o) => { if (/** @type {any} */ (o).isMesh && /** @type {any} */ (o).material?.name !== 'lcards-hologram-depth') out.pickMeshes.push(o); });
    // The meshes hide labels behind them (the depth pass renders this layer)
    if (cfg.occlude !== false) for (const m of out.pickMeshes) m.layers.enable(OCCLUDER_LAYER);

    const names = clipNames(cfg.animation, gltf.animations.map((a) => a.name));
    if (names.length) {
      mixer = new AnimationMixer(scene);
      for (const name of names) {
        const clip = gltf.animations.find((a) => a.name === name);
        if (clip) mixer.clipAction(clip).setLoop(LoopRepeat, Infinity).play();
      }
    } else if (cfg.animation !== undefined && cfg.animation !== 'none' && gltf.animations.length) {
      lcardsLog.warn(`[Astrometrics] model '${cfg.id}': no animation '${cfg.animation}' (clips: ${gltf.animations.map((a) => a.name).join(', ')})`);
    }
    state = 'ready';
    ctx.requestFrame();
  };

  const src = String(cfg.src ?? '');
  const load = ctx.loadModel ? ctx.loadModel(src, num(cfg.max_file_size, DEFAULT_MAX_MB)) : null;
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
    if (mixer) {
      mixer.update(dt / 1000);
      moving = true;
    }
    if (uniforms && scanPeriod > 0) {
      const { pos, strength } = scanAt(t, scanPeriod);
      uniforms.uScanPos.value = pos;
      uniforms.uScanStrength.value = strength;
      moving = true;
    }
    if (uniforms) uniforms.uToModel.value.copy(file.matrixWorld).invert();
    return moving;
  };
  out.dispose = () => {
    disposed = true;
    mixer?.stopAllAction();
  };
  // the model's world matrix can change without a tick (a rule moved it): keep uToModel current on layout
  out.update = () => { if (uniforms) uniforms.uToModel.value.copy(file.matrixWorld).invert(); };
  out.dynamic = true;
  return out;
}

