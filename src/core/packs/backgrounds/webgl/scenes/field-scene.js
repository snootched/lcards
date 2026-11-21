/**
 * Noise field scenes (lazy chunk): one full-screen quad and one fragment
 * shader, for the WebGL versions of `contour-field`, `plasma` and `fluid`.
 * Nothing is baked: every frame samples the field on the GPU, so resizing,
 * recolouring (alert modes) and changing a noise key cost nothing, and those
 * keys can be animated.
 *
 * Coordinates follow the Canvas2D effects exactly. A pixel `px` (top-left
 * origin) sits at world position `px - offset`, where `offset` is the
 * effect's accumulated scroll in px. Contour and fluid sample once per block
 * of `B` world px (`cell_size`, or fluid's 4 px); plasma samples every pixel
 * (`B = 0`). The lattice coordinate is world times `k` (the noise frequency).
 * The CPU splits the scroll into whole lattice cells and a remainder
 * (`fieldUniforms()`), so the shader only does float maths on small numbers.
 *
 * @module core/packs/backgrounds/webgl/scenes/field-scene
 */
import { Scene, OrthographicCamera, PlaneGeometry, Mesh, ShaderMaterial, Vector2, NormalBlending } from 'three';
import { NOISE_GLSL, MAX_OCTAVES, splitCoord } from './noise-glsl.js';
import { rgba } from './scene-helpers.js';

export { MAX_OCTAVES, rgba };

const VERT = /* glsl */ `
void main() {
  gl_Position = vec4( position.xy, 0.0, 1.0 );
}`;

/** Shared fragment prelude: noise, the pixel, its lattice coordinate */
const PRELUDE = /* glsl */ `
precision highp float;
precision highp int;
uniform vec2 uSize;
uniform vec2 uCell;
uniform vec2 uLocal;
uniform vec2 uPhase;
uniform float uBlock;
uniform float uK;
${NOISE_GLSL}
// This pixel, top-left origin, integer index (as the Canvas2D loops)
vec2 lcPixel() {
  return vec2( floor( gl_FragCoord.x ), uSize.y - 1.0 - floor( gl_FragCoord.y ) );
}
// Its lattice coordinate, split: whole cells + local part
vec2 lcLocal( vec2 px ) {
  vec2 rel = uBlock > 0.0 ? floor( ( px + uPhase ) / uBlock ) * uBlock : px;
  return uLocal + rel * uK;
}
ivec2 lcCell() {
  return ivec2( uCell );
}
`;

/**
 * Pan uniforms for one axis: see the module comment.
 * @param {number} offset - accumulated scroll, px
 * @param {number} block - block size in px (0 = per pixel)
 * @param {number} k - lattice units per world px
 * @returns {{ cell: number, local: number, phase: number }}
 */
export function fieldAxis(offset, block, k) {
  const p = -offset;
  if (block > 0) {
    const whole = Math.floor(p / block);
    const [cell, local] = splitCoord(whole * block * k);
    return { cell, local, phase: p - whole * block };
  }
  const [cell, local] = splitCoord(p * k);
  return { cell, local, phase: 0 };
}

/**
 * Write the pan uniforms for both axes.
 * @param {Record<string, { value: any }>} u
 * @param {number} offsetX
 * @param {number} offsetY
 * @param {number} block
 * @param {number} k
 */
export function fieldUniforms(u, offsetX, offsetY, block, k) {
  const x = fieldAxis(offsetX, block, k);
  const y = fieldAxis(offsetY, block, k);
  u.uCell.value.set(x.cell, y.cell);
  u.uLocal.value.set(x.local, y.local);
  u.uPhase.value.set(x.phase, y.phase);
  u.uBlock.value = block;
  u.uK.value = k;
}

/**
 * @param {{
 *   fragment: string,
 *   uniforms: Record<string, { value: any }>,
 *   pan: (effect: any) => { offsetX: number, offsetY: number, block: number, k: number },
 *   setParam: (key: string, value: any) => void,
 *   setColors: (colors: Record<string, Array<{ r: number, g: number, b: number, a: number }>>) => void
 * }} opts - `fragment`: the shader body after the prelude (declares its own
 *   uniforms and main); `pan`: where the field is, read from the effect each frame
 */
export function createFieldScene({ fragment, uniforms, pan, setParam, setColors }) {
  const u = {
    uSize: { value: new Vector2(1, 1) },
    uCell: { value: new Vector2() },
    uLocal: { value: new Vector2() },
    uPhase: { value: new Vector2() },
    uBlock: { value: 0 },
    uK: { value: 0.01 },
    ...uniforms
  };
  const material = new ShaderMaterial({
    uniforms: u,
    vertexShader: VERT,
    fragmentShader: PRELUDE + fragment,
    transparent: true,
    premultipliedAlpha: true,
    depthTest: false,
    depthWrite: false,
    blending: NormalBlending
  });
  const geometry = new PlaneGeometry(2, 2);
  const quad = new Mesh(geometry, material);
  quad.frustumCulled = false;
  const scene = new Scene();
  scene.add(quad);
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  return {
    scene,
    camera,
    material,
    /** @param {number} _t @param {any} effect */
    seek(_t, effect) {
      const p = pan(effect);
      fieldUniforms(u, p.offsetX, p.offsetY, p.block, p.k);
    },
    /** @param {number} w @param {number} h */
    resize(w, h) {
      u.uSize.value.set(w, h);
    },
    setParam,
    setColors,
    dispose() {
      geometry.dispose();
      material.dispose();
    }
  };
}
