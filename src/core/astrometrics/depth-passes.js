/**
 * Depth for scenes at true scale: a station a few km away with a planet
 * 40,000 km behind it and the Sun 150 million km further. One depth buffer
 * cannot hold that range, so the render is split into slices along the view
 * (each at most `SLICE_RATIO` from its near to its far plane), drawn far to
 * near with the depth cleared between them: every fragment lands in the
 * slice holding its depth, and nearer slices draw over farther ones.
 *
 * The planner works from each object's distance range (camera to the near
 * and far edges of its bounding sphere). A scene that fits the camera's own
 * near and far planes (every scene built to fit, as before E10) gets exactly
 * those planes and one pass, so it renders as it always has.
 *
 * Layered render: the star field sits on a shell round the camera
 * (`STAR_SHELL`); once objects reach past it, it draws first in a pass of
 * its own, so it stays behind everything (stars at infinity).
 *
 * @module core/astrometrics/depth-passes
 */
import { STAR_SHELL } from './objects/stars.js';

/** Far over near per slice: 24-bit depth holds it with room to spare */
export const SLICE_RATIO = 2e4;

/** @typedef {{ near: number, far: number }} DepthRange */

/**
 * The slices for this view, far to near, as [near, far] pairs.
 * @param {DepthRange[]} ranges - the objects', camera units
 * @param {DepthRange} camera - the camera's own planes (what the scene got before)
 * @param {number} floor - nothing nearer is drawn (a thousandth of the view distance)
 * @returns {[number, number][]}
 */
export function depthSlices(ranges, camera, floor) {
  let near = camera.near;
  let far = camera.far;
  for (const r of ranges) {
    if (!(r.far > floor)) continue;
    // the camera inside an object's sphere says nothing about how near its surface is:
    // only an object wholly in front pulls the near plane in
    if (r.near > 0) near = Math.min(near, Math.max(r.near, floor));
    far = Math.max(far, r.far);
  }
  if (near === camera.near && far === camera.far) return [[near, far]];
  if (far / near <= Math.max(camera.far / camera.near, SLICE_RATIO)) return [[near, far]];
  const n = Math.ceil(Math.log(far / near) / Math.log(SLICE_RATIO));
  /** @type {[number, number][]} */
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const a = i === 0 ? near : near * Math.pow(far / near, i / n);
    const b = i === n - 1 ? far : near * Math.pow(far / near, (i + 1) / n);
    out.push([a, b]);
  }
  return out;
}

/**
 * Whether the star field needs its own pass: an object reaches past its shell.
 * @param {DepthRange[]} ranges
 */
export function starsBehind(ranges) {
  return ranges.some((r) => r.far > STAR_SHELL * 0.9);
}

/**
 * @typedef {Object} PassItem
 * @property {import('three').Object3D} node - toggled per slice (an object's outer group)
 * @property {number} near
 * @property {number} far
 */

/**
 * Draw the scene in its slices (and the star pass), then leave the camera on
 * the whole range (labels cull by it) and every node as it was.
 * @param {import('three').WebGLRenderer} renderer
 * @param {import('three').Scene} scene
 * @param {import('three').PerspectiveCamera | import('three').OrthographicCamera} camera
 * @param {{ slices: [number, number][], stars: import('three').Object3D | null, layered: boolean, items: PassItem[] }} plan
 */
export function drawPasses(renderer, scene, camera, plan) {
  const { slices, stars, layered, items } = plan;
  if (slices.length === 1 && !layered) {
    setPlanes(camera, slices[0][0], slices[0][1]);
    renderer.render(scene, camera);
    return;
  }
  const autoClear = renderer.autoClear;
  const shown = items.map((it) => it.node.visible);
  const starsShown = stars?.visible ?? false;
  renderer.autoClear = false;
  try {
    renderer.clear();
    if (stars && starsShown) {
      // the stars alone (dust and helpers draw in the slices)
      const others = scene.children.filter((c) => c !== stars && c.visible);
      for (const c of others) c.visible = false;
      setPlanes(camera, STAR_SHELL / 1000, STAR_SHELL * 2);
      renderer.render(scene, camera);
      for (const c of others) c.visible = true;
      stars.visible = false;
    }
    for (const [a, b] of slices) {
      let any = false;
      items.forEach((it, i) => {
        const on = shown[i] && it.far >= a && it.near <= b;
        it.node.visible = on;
        any ||= on;
      });
      if (!any) continue;
      setPlanes(camera, a, b);
      renderer.clearDepth();
      renderer.render(scene, camera);
    }
  } finally {
    renderer.autoClear = autoClear;
    items.forEach((it, i) => { it.node.visible = shown[i]; });
    if (stars) stars.visible = starsShown;
    setPlanes(camera, slices[slices.length - 1][0], slices[0][1]);
  }
}

/**
 * @param {import('three').PerspectiveCamera | import('three').OrthographicCamera} camera
 * @param {number} near
 * @param {number} far
 */
function setPlanes(camera, near, far) {
  if (camera.near === near && camera.far === far) return;
  camera.near = near;
  camera.far = far;
  camera.updateProjectionMatrix();
}
