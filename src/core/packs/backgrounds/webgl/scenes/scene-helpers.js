/**
 * Shared bits for the three.js background scenes (lazy chunk).
 * @module core/packs/backgrounds/webgl/scenes/scene-helpers
 */
import { Color, SRGBColorSpace } from 'three';

/**
 * Seeded RNG (mulberry32), the same one the Canvas2D starfield uses.
 * @param {number} seed
 * @returns {() => number}
 */
export function seededRandom(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * @param {{ r: number, g: number, b: number }} c - 0-255 channels
 * @param {Color} [target]
 * @returns {Color}
 */
export function toColor(c, target = new Color()) {
  return target.setRGB(c.r / 255, c.g / 255, c.b / 255, SRGBColorSpace);
}

/**
 * Fade a stock material out with distance (alpha, not fog: the scene sits on
 * a transparent canvas over other layers, and fog would fade to black).
 * Also lets the geometry stretch along z (`uStretch`) and scale in x/y
 * (`uScaleXY`), for star streaks and pixel-true star sizes.
 *
 * The view depth is rebuilt in the fragment shader from gl_FragCoord.z and
 * the camera's near/far planes. No varying: a line crossing the near plane
 * (the floor runs under the camera) vanished with one on SwiftShader.
 *
 * @param {import('three').Material} material
 * @param {{ camera: import('three').PerspectiveCamera, far: { value: number }, full: { value: number },
 *   near?: { value: number }, stretch?: { value: number }, scaleXY?: { value: number } }} uniforms
 *   `far`: distance where it is gone; `full`: distance where it is fully visible;
 *   `near`: fade in over this distance from the camera (0 = no near fade)
 */
export function addDepthFade(material, uniforms) {
  material.transparent = true;
  material.premultipliedAlpha = true;
  material.depthWrite = false;
  const camNear = { value: uniforms.camera.near };
  const camFar = { value: uniforms.camera.far };
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uFadeFar = uniforms.far;
    shader.uniforms.uFadeFull = uniforms.full;
    shader.uniforms.uFadeNear = uniforms.near ?? { value: 0 };
    shader.uniforms.uStretch = uniforms.stretch ?? { value: 1 };
    shader.uniforms.uScaleXY = uniforms.scaleXY ?? { value: 1 };
    shader.uniforms.uCamNear = camNear;
    shader.uniforms.uCamFar = camFar;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uStretch;\nuniform float uScaleXY;')
      .replace('#include <begin_vertex>', 'vec3 transformed = vec3( position.xy * uScaleXY, position.z * uStretch );');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uFadeFar;\nuniform float uFadeFull;\nuniform float uFadeNear;\nuniform float uCamNear;\nuniform float uCamFar;')
      .replace('#include <color_fragment>', `#include <color_fragment>
float ndcZ = gl_FragCoord.z * 2.0 - 1.0;
float viewDepth = 2.0 * uCamNear * uCamFar / ( uCamFar + uCamNear - ndcZ * ( uCamFar - uCamNear ) );
diffuseColor.a *= ( 1.0 - smoothstep( uFadeFull, uFadeFar, viewDepth ) ) * ( uFadeNear > 0.0 ? smoothstep( 0.0, uFadeNear, viewDepth ) : 1.0 );`);
  };
}
