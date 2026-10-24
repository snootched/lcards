/**
 * `fluid` on WebGL (lazy chunk): FluidTextureEffect's one-colour wash, noise
 * as alpha, sampled per 4 px world block on the GPU every frame
 * (`_fillRegion`, line for line).
 *
 * @module core/packs/backgrounds/webgl/scenes/fluid
 */
import { createFieldScene, rgba, MAX_OCTAVES } from './field-scene.js';

/** Block size in px, as FluidTextureEffect's CELL */
const CELL = 4;

const FRAG = /* glsl */ `
uniform int uOctaves;
uniform vec4 uColor;

void main() {
  float raw = lcFbm( lcCell(), lcLocal( lcPixel() ), uOctaves );
  float a = clamp( ( raw + 1.0 ) * 0.5 * uColor.a, 0.0, 1.0 );
  gl_FragColor = vec4( uColor.rgb * a, a );
}`;

/**
 * @param {{ params: Record<string, any>, colors: Record<string, Array<{ r: number, g: number, b: number, a: number }>> }} opts
 */
export function createScene({ params, colors }) {
  const u = {
    uOctaves: { value: 4 },
    uColor: { value: [100 / 255, 180 / 255, 1, 0.8] }
  };

  /** @param {string} key @param {any} value */
  function setParam(key, value) {
    if (key === 'num_octaves') u.uOctaves.value = Math.max(1, Math.min(MAX_OCTAVES, Math.round(value)));
  }
  if (params.num_octaves !== undefined) setParam('num_octaves', params.num_octaves);

  /** @param {Record<string, Array<{ r: number, g: number, b: number, a: number }>>} cols */
  function setColors(cols) {
    u.uColor.value = rgba(cols.wash?.[0], [100 / 255, 180 / 255, 1, 0.8]);
  }
  setColors(colors);

  return createFieldScene({
    fragment: FRAG,
    uniforms: u,
    pan: (e) => ({ offsetX: e._offsetX, offsetY: e._offsetY, block: CELL, k: e.params.base_frequency ?? 0.01 }),
    setParam,
    setColors
  });
}
