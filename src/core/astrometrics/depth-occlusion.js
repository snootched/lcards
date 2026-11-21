/**
 * Label occlusion by meshes (models): a small GPU depth pass. Objects that
 * occlude by depth put their meshes on `OCCLUDER_LAYER`; once per changed
 * frame the runtime renders just that layer into a quarter-size target with
 * `depthMaterial()` (linear view depth in RGB, coverage in alpha), and reads
 * it back asynchronously (`readRenderTargetPixelsAsync`: no stall, one frame
 * late). `layoutLabels` then compares each label's view depth with the
 * nearest depth in a 3x3 texel window round it (the texel alone for points
 * standing on an occluding object).
 *
 * An object with its own look (a raymarched shader) can occlude correctly by
 * giving its meshes a material that writes the same encoding:
 * `DEPTH_ENCODE_GLSL` (`encodeViewDepth(viewDepth, far)`).
 *
 * @module core/astrometrics/depth-occlusion
 */
import { ShaderMaterial, WebGLRenderTarget, Color, DoubleSide, Vector3, NearestFilter } from 'three';

/** The layer occluding meshes are on (besides 0, where they draw) */
export const OCCLUDER_LAYER = 5;
/** Depth target size: this fraction of the scene's CSS size */
const SCALE = 0.25;

/** GLSL: view depth (0 to far) packed into 24 bits of RGB, alpha 1 (covered) */
export const DEPTH_ENCODE_GLSL = /* glsl */ `
vec4 encodeViewDepth(float d, float far) {
  float x = clamp(d / far, 0.0, 1.0 - 1.0 / 16777216.0);
  vec3 enc = fract(x * vec3(1.0, 255.0, 65025.0));
  enc -= enc.yzz * vec3(1.0 / 255.0, 1.0 / 255.0, 0.0);
  return vec4(enc, 1.0);
}
`;

/**
 * Decode one texel (bytes) to a view depth; Infinity where nothing was drawn.
 * @param {Uint8Array} data
 * @param {number} i - byte index of the texel
 * @param {number} far
 */
export function decodeViewDepth(data, i, far) {
  if (data[i + 3] < 128) return Infinity;
  return (data[i] / 255 + data[i + 1] / 65025 + data[i + 2] / 16581375) * far;
}

/** The default depth material (skinned and morphed meshes too) */
export function depthMaterial() {
  return new ShaderMaterial({
    name: 'lcards-occluder-depth',
    uniforms: { uFar: { value: 1000 } },
    side: DoubleSide,
    vertexShader: /* glsl */ `
      varying float vDepth;
      #include <common>
      #include <skinning_pars_vertex>
      #include <morphtarget_pars_vertex>
      void main() {
        #include <skinbase_vertex>
        #include <begin_vertex>
        #include <morphtarget_vertex>
        #include <skinning_vertex>
        vec4 mv = modelViewMatrix * vec4(transformed, 1.0);
        vDepth = -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uFar;
      varying float vDepth;
      ${DEPTH_ENCODE_GLSL}
      void main() { gl_FragColor = encodeViewDepth(vDepth, uFar); }`
  });
}

/**
 * One read-back depth image: view depth by CSS-space position.
 * @typedef {Object} DepthSnapshot
 * @property {number} w - texels
 * @property {number} h
 * @property {Uint8Array} data - RGBA, rows bottom up (GL order)
 * @property {number} far
 */

/**
 * The nearest view depth in a window of texels round (u, v), 0..1 from the
 * top left; Infinity where nothing was drawn. `r` 1 is a 3x3 window (a
 * point near a silhouette stays hidden), 0 the texel alone (a point on the
 * mesh seen at a grazing angle: its neighbours are nearer).
 * @param {DepthSnapshot} snap
 * @param {number} u
 * @param {number} v
 * @param {number} [r]
 */
export function depthNear(snap, u, v, r = 1) {
  const cx = Math.floor(u * snap.w);
  const cy = Math.floor((1 - v) * snap.h);
  let best = Infinity;
  for (let dy = -r; dy <= r; dy++) {
    const y = cy + dy;
    if (y < 0 || y >= snap.h) continue;
    for (let dx = -r; dx <= r; dx++) {
      const x = cx + dx;
      if (x < 0 || x >= snap.w) continue;
      const d = decodeViewDepth(snap.data, (y * snap.w + x) * 4, snap.far);
      if (d < best) best = d;
    }
  }
  return best;
}

/**
 * The depth pass and its latest snapshot, for one scene.
 */
export class DepthOcclusion {
  /**
   * @param {{ onSnapshot?: () => void }} [o] - a new snapshot is in (lay the labels out again)
   */
  constructor({ onSnapshot } = {}) {
    this.material = depthMaterial();
    /** @type {WebGLRenderTarget | null} */
    this.target = null;
    /** @type {DepthSnapshot | null} */
    this.snapshot = null;
    this.pending = false;
    this.disposed = false;
    /** What the last capture saw (camera and occluders); a capture with the same key is skipped */
    this.key = '';
    this.onSnapshot = onSnapshot;
    this._clear = new Color();
  }

  /**
   * Render the occluder layer and read it back (unless one is in flight, or
   * nothing changed since the last).
   * @param {import('three').WebGLRenderer} renderer
   * @param {import('three').Scene} scene
   * @param {import('three').Camera & { far: number }} camera
   * @param {number} cssW
   * @param {number} cssH
   * @param {string} key - camera and occluder state; equal to the last capture's: skipped
   */
  capture(renderer, scene, camera, cssW, cssH, key) {
    if (this.pending || this.disposed || key === this.key) return;
    const w = Math.max(8, Math.round(cssW * SCALE));
    const h = Math.max(8, Math.round(cssH * SCALE));
    if (!this.target || this.target.width !== w || this.target.height !== h) {
      this.target?.dispose();
      this.target = new WebGLRenderTarget(w, h, { minFilter: NearestFilter, magFilter: NearestFilter, depthBuffer: true });
    }
    const far = camera.far;
    this.material.uniforms.uFar.value = far;
    const mask = camera.layers.mask;
    const override = scene.overrideMaterial;
    const background = scene.background;
    const prevTarget = renderer.getRenderTarget();
    renderer.getClearColor(this._clear);
    const alpha = renderer.getClearAlpha();
    try {
      camera.layers.set(OCCLUDER_LAYER);
      scene.overrideMaterial = this.material;
      scene.background = null;
      renderer.setRenderTarget(this.target);
      renderer.setClearColor(0x000000, 0);
      renderer.clear(true, true, false);
      renderer.render(scene, camera);
    } finally {
      camera.layers.mask = mask;
      scene.overrideMaterial = override;
      scene.background = background;
      renderer.setRenderTarget(prevTarget);
      renderer.setClearColor(this._clear, alpha);
    }
    this.key = key;
    this.pending = true;
    const data = new Uint8Array(w * h * 4);
    const target = this.target;
    renderer.readRenderTargetPixelsAsync(target, 0, 0, w, h, data).then(() => {
      this.pending = false;
      if (this.disposed || target !== this.target) return;
      this.snapshot = { w, h, data, far };
      this.onSnapshot?.();
    }, () => { this.pending = false; });
  }

  /** Forget the snapshot (nothing occludes by depth now) */
  clear() {
    this.snapshot = null;
    this.key = '';
  }

  dispose() {
    this.disposed = true;
    this.target?.dispose();
    this.target = null;
    this.material.dispose();
  }
}

/**
 * A label's view depth (distance along the camera's view axis).
 * @param {Vector3} p - world
 * @param {import('three').Camera} camera
 * @param {Vector3} [tmp]
 */
export function viewDepth(p, camera, tmp = new Vector3()) {
  return -tmp.copy(p).applyMatrix4(camera.matrixWorldInverse).z;
}
