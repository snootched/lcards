/**
 * Where the solid things are, for raymarched gas (`nebula` with
 * `render: volume`): a half-resolution depth image of every mesh that writes
 * depth (planets, models, asteroids, opaque cubes), so each ray through the
 * gas stops at the nearest solid. Gas in front of a planet still shows, gas
 * behind it does not.
 *
 * The solids draw with their own materials (several place their vertices in
 * their own shaders: the asteroid's and the cube's camera-relative maths),
 * into a target with a DepthTexture; everything that does not write depth
 * (grids, lines, glows, the puffs, the volumes themselves) is hidden for the
 * pass. One capture per frame serves every volume in the scene.
 *
 * @module core/astrometrics/effects/solid-depth
 */
import { WebGLRenderTarget, DepthTexture, UnsignedIntType, NearestFilter, Vector2 } from 'three';

/** Depth image size: this fraction of the drawing buffer */
const SCALE = 0.5;

/**
 * @typedef {Object} SolidDepthImage
 * @property {DepthTexture} texture
 * @property {number} near - the camera planes it was drawn with
 * @property {number} far
 * @property {boolean} ortho
 * @property {Vector2} size - the drawing buffer it covers, px
 * @property {Vector2} target - its own size, px (a pass drawn at this size: gl_FragCoord over it is the uv)
 */

/** @type {WeakMap<import('three').Scene, { target: WebGLRenderTarget, frame: number, image: SolidDepthImage }>} */
const perScene = new WeakMap();

/**
 * Whether an object takes part in the depth pass (a solid).
 * @param {any} o
 */
export function isSolid(o) {
  if (!o.isMesh) return false;
  const m = o.material;
  return Array.isArray(m) ? m.some((x) => x && x.depthWrite && x.visible !== false) : !!m && m.depthWrite && m.visible !== false;
}

/**
 * The depth image for this frame (drawn on the first call per frame).
 * @param {import('three').WebGLRenderer} renderer
 * @param {import('three').Scene} scene
 * @param {import('three').PerspectiveCamera | import('three').OrthographicCamera} camera - on the planes to draw with
 * @param {number} w - drawing buffer px
 * @param {number} h
 * @param {number} frame - the runtime's frame counter
 * @returns {SolidDepthImage}
 */
export function solidDepth(renderer, scene, camera, w, h, frame) {
  const tw = Math.max(4, Math.round(w * SCALE));
  const th = Math.max(4, Math.round(h * SCALE));
  let entry = perScene.get(scene);
  if (entry && entry.frame === frame && entry.image.size.x === w && entry.image.size.y === h) return entry.image;
  if (!entry || entry.target.width !== tw || entry.target.height !== th) {
    entry?.target.dispose();
    entry?.target.depthTexture?.dispose();
    const depthTexture = new DepthTexture(tw, th, UnsignedIntType);
    depthTexture.minFilter = depthTexture.magFilter = NearestFilter;
    const target = new WebGLRenderTarget(tw, th, { depthBuffer: true, depthTexture });
    entry = { target, frame: -1, image: { texture: depthTexture, near: 0, far: 0, ortho: false, size: new Vector2(), target: new Vector2(tw, th) } };
    perScene.set(scene, entry);
  }

  /** @type {import('three').Object3D[]} */
  const hidden = [];
  scene.traverseVisible((o) => {
    const drawable = /** @type {any} */ (o).isMesh || /** @type {any} */ (o).isLine || /** @type {any} */ (o).isPoints || /** @type {any} */ (o).isSprite;
    if (drawable && !isSolid(o)) hidden.push(o);
  });
  for (const o of hidden) o.visible = false;
  const background = scene.background;
  const prev = renderer.getRenderTarget();
  const autoClear = renderer.autoClear;
  try {
    scene.background = null;
    renderer.setRenderTarget(entry.target);
    renderer.autoClear = false;
    renderer.clear(false, true, false);
    renderer.render(scene, camera);
  } finally {
    for (const o of hidden) o.visible = true;
    scene.background = background;
    renderer.setRenderTarget(prev);
    renderer.autoClear = autoClear;
  }
  entry.frame = frame;
  const img = entry.image;
  img.near = camera.near;
  img.far = camera.far;
  img.ortho = /** @type {any} */ (camera).isOrthographicCamera === true;
  img.size.set(w, h);
  return img;
}

/**
 * Drop a scene's depth target (its last volume is gone).
 * @param {import('three').Scene} scene
 */
export function disposeSolidDepth(scene) {
  const entry = perScene.get(scene);
  if (!entry) return;
  entry.target.depthTexture?.dispose();
  entry.target.dispose();
  perScene.delete(scene);
}

/**
 * GLSL: the view distance (along the view direction, positive) of the
 * nearest solid at this fragment of a pass drawn at the image's own size; a very large number where there is none.
 * Needs `#include <packing>` before it.
 */
export const SOLID_DEPTH_GLSL = /* glsl */ `
uniform sampler2D uSolid;
uniform float uSolidOn;
uniform vec2 uSolidSize;
uniform vec2 uSolidPlanes;
uniform float uSolidOrtho;
float solidViewDepth() {
  if ( uSolidOn < 0.5 ) return 1e30;
  float d = texture2D( uSolid, gl_FragCoord.xy / uSolidSize ).x;
  if ( d >= 1.0 ) return 1e30;
  float z = uSolidOrtho > 0.5 ? orthographicDepthToViewZ( d, uSolidPlanes.x, uSolidPlanes.y ) : perspectiveDepthToViewZ( d, uSolidPlanes.x, uSolidPlanes.y );
  return -z;
}
`;

/** The uniforms SOLID_DEPTH_GLSL reads, off */
export function solidUniforms() {
  return {
    uSolid: { value: /** @type {DepthTexture | null} */ (null) },
    uSolidOn: { value: 0 },
    uSolidSize: { value: new Vector2(1, 1) },
    uSolidPlanes: { value: new Vector2(0.1, 1000) },
    uSolidOrtho: { value: 0 }
  };
}

/**
 * Point the uniforms at a depth image (null: off).
 * @param {ReturnType<typeof solidUniforms>} u
 * @param {SolidDepthImage | null} img
 */
export function useSolidDepth(u, img) {
  u.uSolidOn.value = img ? 1 : 0;
  if (!img) return;
  u.uSolid.value = img.texture;
  // read at the target's own resolution (the gas marches at that size)
  u.uSolidSize.value.copy(img.target);
  u.uSolidPlanes.value.set(img.near, img.far);
  u.uSolidOrtho.value = img.ortho ? 1 : 0;
}
