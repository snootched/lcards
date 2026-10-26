/**
 * `fill_effect` on a `sphere` body or under a `grid` surface's lines: the
 * background presets `plasma` (two-colour bands), `fluid` (a one-colour
 * wash) and `contour-field` (topographic bands) painted on the object, with
 * the same formulas as their background shaders but sampled from 3D noise
 * at the object-space position (`noise3-glsl.js`): seamless round a sphere,
 * and it turns with a spinning planet.
 *
 * `speed` (scene units per second) moves the noise field through the
 * object, so the surface churns; still by default.
 *
 * @module core/astrometrics/effects/fills
 */
import { ShaderMaterial, NormalBlending, DoubleSide, FrontSide, Vector3 } from 'three';
import { NOISE3_GLSL, MAX_OCTAVES3 } from './noise3-glsl.js';
import { splitCoord } from '../../packs/backgrounds/webgl/scenes/noise-glsl.js';
import { num } from '../objects/common.js';

/** Fill effect names (the background presets they come from) */
export const FILL_TYPES = { plasma: 0, fluid: 1, contour: 2 };
/** Colour stops a contour fill holds; longer lists are resampled to this many */
export const MAX_STOPS = 16;
/** Noise cells across the object's radius when base_frequency is not set */
const CELLS_PER_RADIUS = 3;
/** The direction the field flows (`speed`), normalised */
const FLOW = new Vector3(1, 0.35, 0.6).normalize();

/** Default colours (theme variables; resolved concrete for WebGL) */
export const FILL_COLORS = {
  a: 'var(--lcars-blue, var(--lcards-blue-medium))',
  b: 'var(--lcars-orange, var(--lcards-orange-medium))',
  wash: 'var(--lcars-blue, var(--lcards-blue-medium))'
};

const VERT = /* glsl */ `
varying vec3 vPos;
void main() {
  vPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`;

const FRAG = /* glsl */ `
precision highp float;
${NOISE3_GLSL}
varying vec3 vPos;
uniform int uType;
uniform int uOctaves;
uniform float uFreq;
uniform ivec3 uCell;
uniform vec3 uLocal;
uniform vec4 uColorA;
uniform vec4 uColorB;
uniform vec4 uStops[ ${MAX_STOPS} ];
uniform int uStopCount;
uniform float uBands;
uniform float uFill;
uniform bool uBlend;
uniform vec4 uFillColor;
uniform bool uHasFill;
uniform vec4 uBase;
uniform float uOpacity;

vec4 colorAtBand( float bandValue ) {
  float p = bandValue * float( uStopCount - 1 );
  if ( !uBlend ) return uStops[ clamp( int( floor( p + 0.5 ) ), 0, uStopCount - 1 ) ];
  int idx = min( uStopCount - 2, int( floor( p ) ) );
  return mix( uStops[ idx ], uStops[ idx + 1 ], p - float( idx ) );
}

void main() {
  float raw = lcFbm3( uCell, vPos * uFreq + uLocal, uOctaves );
  float n = clamp( ( raw + 1.0 ) * 0.5, 0.0, 1.0 );
  vec4 c;
  if ( uType == 0 ) {
    // plasma: colour B's bands over colour A's
    float pik = 3.141592653589793 * float( uOctaves );
    float aA = abs( sin( n * pik ) ) * uColorA.a;
    float aB = abs( cos( n * pik ) ) * uColorB.a;
    float a = aA + aB * ( 1.0 - aA );
    vec3 rgb = a > 0.001 ? ( uColorA.rgb * aA * ( 1.0 - aB ) + uColorB.rgb * aB ) / a : vec3( 0.0 );
    c = vec4( rgb, a );
  } else if ( uType == 1 ) {
    // fluid: the noise is the wash's alpha
    c = vec4( uColorA.rgb, n * uColorA.a );
  } else {
    // contour: stepped bands, the lowest flooded below fill_level
    float bands = max( 2.0, floor( uBands + 0.5 ) );
    vec4 land = colorAtBand( clamp( floor( n * bands ), 0.0, bands - 1.0 ) / ( bands - 1.0 ) );
    c = land;
    if ( uFill > 0.0 ) {
      float t = uBlend ? clamp( ( n - uFill ) / ( 1.0 / bands ), 0.0, 1.0 ) : ( n >= uFill ? 1.0 : 0.0 );
      vec3 under = uHasFill ? mix( land.rgb, uFillColor.rgb, uFillColor.a ) : land.rgb;
      c = vec4( mix( under, land.rgb, t ), mix( uHasFill ? land.a : 0.0, land.a, t ) );
    }
  }
  c.a *= uOpacity;
  // over the base (a sphere's body colour), premultiplied
  float a = c.a + uBase.a * ( 1.0 - c.a );
  if ( a <= 0.001 ) discard;
  gl_FragColor = vec4( c.rgb * c.a + uBase.rgb * uBase.a * ( 1.0 - c.a ), a );
}`;

/**
 * Colour stops for a contour fill: a list resampled to at most MAX_STOPS,
 * one colour doubled.
 * @param {number[][]} list
 * @returns {number[][]}
 */
export function contourStops(list) {
  let out = list.length ? list : [[1, 1, 1, 1]];
  if (out.length === 1) out = [out[0], out[0]];
  if (out.length > MAX_STOPS) {
    const src = out;
    out = Array.from({ length: MAX_STOPS }, (_, i) => src[Math.round((i * (src.length - 1)) / (MAX_STOPS - 1))]);
  }
  return out;
}

/**
 * The fill material for one object, and its tick when it moves.
 * @param {any} fill - the `fill_effect` config
 * @param {import('../objects/common.js').BuildContext} ctx
 * @param {{ radius: number, base?: number[], opacity?: number, solid?: boolean }} o -
 *   radius sets the default detail; base is the colour under the fill (straight rgba);
 *   solid writes depth (a sphere's body, which hides what is behind it)
 * @returns {{ material: ShaderMaterial, tick: ((dt: number, t: number) => boolean) | null }}
 */
export function fillMaterial(fill, ctx, o) {
  const f = fill && typeof fill === 'object' ? fill : {};
  const type = FILL_TYPES[/** @type {keyof typeof FILL_TYPES} */ (f.type)] ?? FILL_TYPES.plasma;
  const radius = Math.max(1e-3, o.radius);
  const freq = f.base_frequency !== undefined ? Math.max(0, num(f.base_frequency, 0)) : CELLS_PER_RADIUS / radius;
  const octaves = Math.max(1, Math.min(MAX_OCTAVES3, Math.round(num(f.num_octaves, type === FILL_TYPES.contour ? 2 : type === FILL_TYPES.plasma ? 3 : 4))));
  const stops = new Float32Array(MAX_STOPS * 4);
  let stopCount = 2;
  if (type === FILL_TYPES.contour) {
    const list = Array.isArray(f.colors) ? f.colors : f.colors !== undefined ? [f.colors] : [FILL_COLORS.a, FILL_COLORS.b];
    const resolved = contourStops(list.map((/** @type {any} */ c) => ctx.color(c, FILL_COLORS.a)));
    resolved.forEach((c, i) => stops.set([c[0], c[1], c[2], c[3] ?? 1], i * 4));
    stopCount = resolved.length;
  }
  const u = {
    uType: { value: type },
    uOctaves: { value: octaves },
    uFreq: { value: freq },
    uCell: { value: new Vector3(0, 0, 0) },
    uLocal: { value: new Vector3(0, 0, 0) },
    uColorA: { value: ctx.color(type === FILL_TYPES.fluid ? f.color : f.color_a, type === FILL_TYPES.fluid ? FILL_COLORS.wash : FILL_COLORS.a) },
    uColorB: { value: ctx.color(f.color_b, FILL_COLORS.b) },
    uStops: { value: stops },
    uStopCount: { value: stopCount },
    uBands: { value: Math.max(2, Math.min(64, num(f.num_bands, 5))) },
    uFill: { value: Math.max(0, Math.min(0.95, num(f.fill_level, 0))) },
    uBlend: { value: f.blend_colors !== false },
    uFillColor: { value: f.fill_color !== undefined ? ctx.color(f.fill_color, 'transparent') : [0, 0, 0, 0] },
    uHasFill: { value: f.fill_color !== undefined },
    uBase: { value: o.base ?? [0, 0, 0, 0] },
    uOpacity: { value: Math.max(0, Math.min(1, num(f.opacity, 1))) * (o.opacity ?? 1) }
  };
  const material = new ShaderMaterial({
    uniforms: u,
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    premultipliedAlpha: true,
    blending: NormalBlending,
    side: o.solid ? FrontSide : DoubleSide,
    depthTest: true,
    depthWrite: !!o.solid
  });
  const speed = num(f.speed, 0);
  /** noise cells per ms along FLOW */
  const rate = (speed * freq) / 1000;
  const tick = rate
    ? (/** @type {number} */ _dt, /** @type {number} */ t) => {
      const d = t * rate;
      const [cx, lx] = splitCoord(FLOW.x * d);
      const [cy, ly] = splitCoord(FLOW.y * d);
      const [cz, lz] = splitCoord(FLOW.z * d);
      u.uCell.value.set(cx, cy, cz);
      u.uLocal.value.set(lx, ly, lz);
      return true;
    }
    : null;
  return { material, tick };
}
