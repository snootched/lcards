/**
 * `plasma` on WebGL (lazy chunk): PlasmaTextureEffect's two-colour bands,
 * sampled per pixel on the GPU every frame (`_fillRegion`, line for line).
 *
 * @module core/packs/backgrounds/webgl/scenes/plasma
 */
import { createFieldScene, rgba, MAX_OCTAVES } from './field-scene.js';

const FRAG = /* glsl */ `
uniform int uOctaves;
uniform vec4 uColorA;
uniform vec4 uColorB;

void main() {
  float raw = lcFbm( lcCell(), lcLocal( lcPixel() ), uOctaves );
  float n = ( raw + 1.0 ) * 0.5;
  float pik = 3.141592653589793 * float( uOctaves );
  float alphaA = abs( sin( n * pik ) ) * uColorA.a;
  float alphaB = abs( cos( n * pik ) ) * uColorB.a;
  // Source-over: colour B over colour A
  float outA = alphaA + alphaB * ( 1.0 - alphaA );
  vec3 rgb = vec3( 0.0 );
  if ( outA > 0.001 ) rgb = ( uColorA.rgb * alphaA * ( 1.0 - alphaB ) + uColorB.rgb * alphaB ) / outA;
  gl_FragColor = vec4( rgb * outA, outA );
}`;

/**
 * @param {{ params: Record<string, any>, colors: Record<string, Array<{ r: number, g: number, b: number, a: number }>> }} opts
 */
export function createScene({ params, colors }) {
  const u = {
    uOctaves: { value: 3 },
    uColorA: { value: [0, 0, 1, 0.9] },
    uColorB: { value: [1, 0, 0.5, 0.9] }
  };

  /** @param {string} key @param {any} value */
  function setParam(key, value) {
    if (key === 'num_octaves') u.uOctaves.value = Math.max(1, Math.min(MAX_OCTAVES, Math.round(value)));
  }
  if (params.num_octaves !== undefined) setParam('num_octaves', params.num_octaves);

  /** @param {Record<string, Array<{ r: number, g: number, b: number, a: number }>>} cols */
  function setColors(cols) {
    u.uColorA.value = rgba(cols.a?.[0], [80 / 255, 0, 1, 0.9]);
    u.uColorB.value = rgba(cols.b?.[0], [1, 40 / 255, 120 / 255, 0.9]);
  }
  setColors(colors);

  return createFieldScene({
    fragment: FRAG,
    uniforms: u,
    pan: (e) => ({ offsetX: e._offsetX, offsetY: e._offsetY, block: 0, k: e.params.base_frequency ?? 0.012 }),
    setParam,
    setColors
  });
}
