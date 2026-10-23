/**
 * Whether three.js background scenes can run on this page (main chunk; no
 * three.js here). Probed once with a throwaway WebGL2 context, which is freed
 * straight away. A lost shared context marks WebGL broken for the page, so
 * later cards go to their Canvas2D fallback at once.
 *
 * @module core/packs/backgrounds/webgl/webgl-support
 */

/** @type {boolean | null} */
let available = null;
let broken = false;

/** @returns {boolean} */
export function webglAvailable() {
  if (broken) return false;
  if (available !== null) return available;
  available = false;
  try {
    if (typeof document === 'undefined' || typeof WebGL2RenderingContext === 'undefined') return available;
    const gl = document.createElement('canvas').getContext('webgl2');
    available = !!gl;
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    available = false;
  }
  return available;
}

/** The shared context was lost: use the fallbacks from now on */
export function markWebGLBroken() {
  broken = true;
}

/**
 * Tests only: force the probe result (null re-probes).
 * @param {boolean | null} value
 */
export function _setWebGLAvailableForTests(value) {
  available = value;
  broken = false;
}
