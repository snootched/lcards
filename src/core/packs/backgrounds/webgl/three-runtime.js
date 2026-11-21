/**
 * The page's one WebGL context for three.js background scenes (lazy chunk).
 *
 * Browsers keep about 16 live WebGL contexts per page and drop the oldest
 * beyond that, so cards do not get a context each: every scene renders into
 * this shared offscreen canvas, and its ThreeSceneEffect copies the result
 * into the card's own Canvas2D canvas (drawImage) straight after. The canvas
 * only grows; each render uses the bottom-left `w x h` corner (GL origin).
 *
 * Importing `animejs/adapters/three` here registers the anime.js three.js
 * adapter, so scenes can animate cameras, meshes, instances, materials and
 * uniforms with plain `animate()`.
 *
 * @module core/packs/backgrounds/webgl/three-runtime
 */
import { WebGLRenderer } from 'three';
import 'animejs/adapters/three';
import { lcardsLog } from '../../../../utils/lcards-logging.js';
import { markWebGLBroken } from './webgl-support.js';

/** @type {WebGLRenderer | null} */
let renderer = null;
let width = 0;
let height = 0;
/** @type {Set<{ onContextLost: () => void }>} */
const users = new Set();
let created = 0;
/**
 * How a render reaches the card: 'bitmap' renders on an OffscreenCanvas and
 * hands over an ImageBitmap (transferToImageBitmap, stays on the GPU where
 * the browser can); 'blit' copies straight from a DOM canvas. Default bitmap
 * where OffscreenCanvas exists. Switchable for the C2 benchmark.
 * @type {'bitmap' | 'blit'}
 */
let mode = typeof OffscreenCanvas !== 'undefined' ? 'bitmap' : 'blit';

/**
 * The browser took the context away (too many contexts, GPU reset): every
 * scene falls back to Canvas2D, and so do later ones.
 * @param {Event} ev
 */
function onContextLost(ev) {
  ev.preventDefault();
  lcardsLog.warn('[ThreeRuntime] WebGL context lost: background scenes fall back to Canvas2D');
  markWebGLBroken();
  const lost = [...users];
  users.clear();
  disposeRenderer();
  lost.forEach((u) => u.onContextLost());
}

/**
 * Join the shared context (created on first use).
 * @param {{ onContextLost: () => void }} user
 * @returns {WebGLRenderer}
 */
export function acquire(user) {
  if (!renderer) {
    const canvas = mode === 'bitmap' ? new OffscreenCanvas(1, 1) : document.createElement('canvas');
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, premultipliedAlpha: true, powerPreference: 'low-power' });
    renderer.setClearColor(0x000000, 0);
    renderer.setScissorTest(true);
    width = 0;
    height = 0;
    created++;
    canvas.addEventListener('webglcontextlost', /** @type {EventListener} */ (onContextLost));
    lcardsLog.debug('[ThreeRuntime] Shared WebGL context created');
  }
  users.add(user);
  return renderer;
}

/**
 * Leave the shared context; the last user out disposes it (no context is
 * held by a page without WebGL backgrounds).
 * @param {{ onContextLost: () => void }} user
 */
export function release(user) {
  if (!users.delete(user) || users.size > 0) return;
  disposeRenderer();
  lcardsLog.debug('[ThreeRuntime] Shared WebGL context released');
}

function disposeRenderer() {
  if (!renderer) return;
  const r = renderer;
  renderer = null;
  // A deliberate loss is not the browser taking it away
  r.domElement.removeEventListener('webglcontextlost', /** @type {EventListener} */ (onContextLost));
  r.dispose();
  r.forceContextLoss();
}

/**
 * Render `scene` at `w x h` and return where to copy it from.
 * @param {import('three').Scene} scene
 * @param {import('three').Camera} camera
 * @param {number} w
 * @param {number} h
 * @param {(renderer: WebGLRenderer) => void} [draw] - draws instead of one plain
 *   render (several passes into the same frame)
 * @returns {{ source: CanvasImageSource, sy: number, done?: () => void } | null} what to
 *   draw from, the y of the rendered region in it (top-left origin), and what
 *   to call once drawn (closes the bitmap)
 */
export function render(scene, camera, w, h, draw) {
  // Lost but the webglcontextlost event not yet delivered: draw nothing
  // (transferToImageBitmap would throw); the event swaps in the fallbacks
  if (!renderer || renderer.getContext().isContextLost()) return null;
  if (w > width || h > height) {
    width = Math.max(width, w);
    height = Math.max(height, h);
    renderer.setSize(width, height, false);
  }
  renderer.setViewport(0, 0, w, h);
  renderer.setScissor(0, 0, w, h);
  if (draw) draw(renderer);
  else renderer.render(scene, camera);
  if (mode === 'bitmap') {
    const bitmap = /** @type {OffscreenCanvas} */ (/** @type {unknown} */ (renderer.domElement)).transferToImageBitmap();
    return { source: bitmap, sy: height - h, done: () => bitmap.close() };
  }
  return { source: renderer.domElement, sy: height - h };
}

/**
 * Benchmark only: switch how renders reach the cards (takes effect for
 * scenes built after the shared context is next created).
 * @param {'bitmap' | 'blit'} next
 */
export function _setMode(next) {
  mode = next;
}

/** Live users, whether a context exists, contexts created so far (tests, benchmarks) */
export function stats() {
  return { users: users.size, context: !!renderer, created, width, height, mode };
}

/** Tests and benchmarks: the shared canvas (to simulate a context loss) */
export function _canvas() {
  return /** @type {HTMLCanvasElement | OffscreenCanvas | null} */ (renderer?.domElement ?? null);
}
