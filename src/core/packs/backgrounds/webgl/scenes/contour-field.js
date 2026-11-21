/**
 * `contour-field` on WebGL (lazy chunk): the banded noise field of
 * ContourFieldEffect, sampled per block of `cell_size` px on the GPU every
 * frame. Same bands, colour ramp, waterline and fill colour as the Canvas2D
 * version (`_sampleColorAt`, line for line).
 *
 * @module core/packs/backgrounds/webgl/scenes/contour-field
 */
import { createFieldScene, rgba, MAX_OCTAVES } from './field-scene.js';

/** Colour stops the shader holds; longer lists are resampled to this many */
export const MAX_STOPS = 16;

const FRAG = /* glsl */ `
uniform int uOctaves;
uniform float uBands;
uniform float uFill;
uniform bool uBlend;
uniform vec4 uStops[${MAX_STOPS}];
uniform int uStopCount;
uniform vec4 uFillColor;
uniform bool uHasFill;

vec4 colorAtBand( float bandValue ) {
  float p = bandValue * float( uStopCount - 1 );
  if ( !uBlend ) {
    int idx = clamp( int( floor( p + 0.5 ) ), 0, uStopCount - 1 );
    return uStops[ idx ];
  }
  int idx = min( uStopCount - 2, int( floor( p ) ) );
  float frac = p - float( idx );
  return mix( uStops[ idx ], uStops[ idx + 1 ], frac );
}

void main() {
  vec2 px = lcPixel();
  float raw = lcFbm( lcCell(), lcLocal( px ), uOctaves );
  float n = clamp( ( raw + 1.0 ) * 0.5, 0.0, 1.0 );
  float bands = max( 2.0, floor( uBands + 0.5 ) );
  float bandIdx = clamp( floor( n * bands ), 0.0, bands - 1.0 );
  vec4 land = colorAtBand( bandIdx / ( bands - 1.0 ) );
  vec4 c = land;
  if ( uFill > 0.0 ) {
    float t = uBlend ? clamp( ( n - uFill ) / ( 1.0 / bands ), 0.0, 1.0 ) : ( n >= uFill ? 1.0 : 0.0 );
    vec3 underRgb = uHasFill ? uFillColor.rgb * uFillColor.a + land.rgb * ( 1.0 - uFillColor.a ) : land.rgb;
    float underA = uHasFill ? land.a : 0.0;
    c = vec4( mix( underRgb, land.rgb, t ), mix( underA, land.a, t ) );
  }
  gl_FragColor = vec4( c.rgb * c.a, c.a );
}`;

/**
 * @param {{ params: Record<string, any>, colors: Record<string, Array<{ r: number, g: number, b: number, a: number }>> }} opts
 */
export function createScene({ params, colors }) {
  const stops = new Float32Array(MAX_STOPS * 4);
  const u = {
    uOctaves: { value: 2 },
    uBands: { value: 5 },
    uFill: { value: 0 },
    uBlend: { value: true },
    uStops: { value: stops },
    uStopCount: { value: 2 },
    uFillColor: { value: [0, 0, 0, 0] },
    uHasFill: { value: false }
  };

  /** @param {string} key @param {any} value */
  function setParam(key, value) {
    if (key === 'num_octaves') u.uOctaves.value = Math.max(1, Math.min(MAX_OCTAVES, Math.round(value)));
    else if (key === 'num_bands') u.uBands.value = Math.max(2, Math.min(64, value));
    else if (key === 'fill_level') u.uFill.value = Math.max(0, Math.min(0.95, value));
    else if (key === 'blend_colors') u.uBlend.value = value !== false;
  }
  for (const key of ['num_octaves', 'num_bands', 'fill_level', 'blend_colors']) {
    if (params[key] !== undefined) setParam(key, params[key]);
  }

  /** @param {Record<string, Array<{ r: number, g: number, b: number, a: number }>>} cols */
  function setColors(cols) {
    let list = cols.stops?.length ? cols.stops : [{ r: 255, g: 255, b: 255, a: 1 }];
    if (list.length === 1) list = [list[0], list[0]];
    if (list.length > MAX_STOPS) {
      const src = list;
      list = Array.from({ length: MAX_STOPS }, (_, i) => src[Math.round((i * (src.length - 1)) / (MAX_STOPS - 1))]);
    }
    list.forEach((c, i) => stops.set(rgba(c), i * 4));
    u.uStopCount.value = list.length;
    const fill = cols.fill?.[0];
    u.uHasFill.value = !!fill;
    u.uFillColor.value = rgba(fill, [0, 0, 0, 0]);
  }
  setColors(colors);

  return createFieldScene({
    fragment: FRAG,
    uniforms: u,
    pan: (e) => ({
      offsetX: e._offsetX,
      offsetY: e._offsetY,
      block: Math.max(1, Math.min(16, Math.round(e.params.cell_size ?? 1))),
      k: e.params.noise_scale ?? 0.005
    }),
    setParam,
    setColors
  });
}
