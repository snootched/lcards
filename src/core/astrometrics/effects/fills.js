/**
 * `fill.effect` on a `sphere` body or under a `grid` surface's lines: the
 * background presets `plasma` (two-colour bands), `fluid` (a one-colour
 * wash) and `contour-field` (topographic bands) painted on the object, with
 * the same formulas as their background shaders but sampled from 3D noise
 * at the object-space position (`noise3-glsl.js`): seamless round a sphere,
 * and it turns with a spinning planet. `bands` draws belts round the
 * latitude (the object's y axis), their edges swirled by the noise: a gas
 * giant. `preset` names a planet type (FILL_PRESETS) the config's own keys
 * are merged over.
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
export const FILL_TYPES = { plasma: 0, fluid: 1, contour: 2, bands: 3, swirl: 4 };
/** Colour stops a contour fill holds; longer lists are resampled to this many */
export const MAX_STOPS = 16;
/** Noise cells across the object's radius when base_frequency is not set */
const CELLS_PER_RADIUS = 3;
/** Seconds a swirl layer runs before it fades out and restarts */
const SWIRL_CYCLE = 10;
/** The direction the field flows (`speed`), normalised */
const FLOW = new Vector3(1, 0.35, 0.6).normalize();

/** @param {string} name - an LCARdS palette colour (always injected, whatever the theme) */
const pal = (name) => `var(--lcards-${name})`;

/**
 * Planet types for `fill.effect.preset` (names in `names.js` FILL_PRESETS):
 * a type and its settings, with the config's own keys merged over.
 * @type {Record<string, Record<string, any>>}
 */
export const FILL_PRESETS = {
  gas_giant: { type: 'bands', colors: [pal('yellow-light'), pal('yellow-dark'), pal('yellow-lightest'), pal('orange-light'), pal('yellow-light'), pal('yellow-darkest')], num_bands: 15, turbulence: 0.35, num_octaves: 5 },
  ringed_giant: { type: 'bands', colors: [pal('yellow-lightest'), pal('yellow-light'), pal('yellow-medium-light'), pal('yellow-dark')], num_bands: 19, turbulence: 0.15, num_octaves: 4 },
  ice_giant: { type: 'bands', colors: [pal('blue-light'), pal('blue-medium-light'), pal('blue-light'), pal('green-lightest')], num_bands: 7, turbulence: 0.08, num_octaves: 3 },
  storm_giant: { type: 'bands', colors: [pal('blue-medium'), pal('blue-medium-dark'), pal('blue-medium-light'), pal('blue-dark')], num_bands: 9, turbulence: 0.4, num_octaves: 5 },
  clouds: { type: 'bands', colors: [pal('yellow-lightest'), pal('yellow-medium'), pal('yellow-light'), pal('orange-lightest')], num_bands: 5, turbulence: 0.9, num_octaves: 5, speed: 0.4 },
  lava: { type: 'contour', colors: [pal('gray-darkest'), pal('gray-darkest'), pal('gray-darkest'), pal('gray-dark'), pal('orange-dark'), pal('yellow-medium')], num_bands: 9, num_octaves: 4, blend_colors: false },
  ice: { type: 'contour', colors: [pal('blue-medium-light'), pal('blue-light'), pal('moonlight'), pal('gray-lightest')], num_bands: 6, num_octaves: 5 },
  rocky: { type: 'contour', colors: [pal('gray-medium-dark'), pal('gray-medium'), pal('gray-medium-light'), pal('gray-light')], num_bands: 7, num_octaves: 6 },
  terran: { type: 'contour', colors: [pal('blue-dark'), pal('blue-medium-dark'), pal('green-medium'), pal('green-medium-light'), pal('yellow-dark'), pal('gray-lightest')], num_bands: 8, num_octaves: 5, blend_colors: false }
};

/**
 * A fill.effect config with its preset merged under it.
 * @param {any} fill
 * @returns {Record<string, any>}
 */
export function resolveFill(fill) {
  const f = fill && typeof fill === 'object' ? fill : {};
  const preset = typeof f.preset === 'string' ? FILL_PRESETS[f.preset] : undefined;
  return preset ? { ...preset, ...f } : f;
}

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
uniform float uRadius;
uniform float uTurb;
uniform vec2 uTau;
uniform vec2 uFade;
uniform float uAng;
uniform float uFall;
uniform float uWind;
uniform float uRipple;
uniform float uDepth;

// swirl: one layer of gas, streaks along a log spiral, turned and drawn in by tau seconds
float swirlLayer( float th, float r, float lr, float tau ) {
  float u = th + uWind * lr - uAng * tau * 1.15 / ( r + 0.15 );
  float l = lr + uFall * tau;
  float k = uFreq * uRadius / 3.0;
  // a coarse warp breaks the rings into clumps, then fine noise streaked along the spiral
  float w = lcFbm3( uCell, vec3( cos( u ) * 1.4, sin( u ) * 1.4, l * 2.5 ) * k + vec3( 5.2, 1.3, 7.7 ), 3 );
  l += 0.12 * uTurb * w;
  u += 0.5 * uTurb * w;
  vec3 p = vec3( cos( u ) * 2.4, sin( u ) * 2.4, l * 8.0 ) * k;
  return lcFbm3( uCell, p, uOctaves );
}

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
  } else if ( uType == 3 ) {
    // bands: belts evenly spaced in latitude, colours repeating from the
    // south pole, the edges swirled by the noise and the belts mottled
    float lat = clamp( vPos.y / uRadius, -1.0, 1.0 );
    float bands = max( 2.0, floor( uBands + 0.5 ) );
    // noise stretched along the latitude, so the swirls run east-west
    float swirl = lcFbm3( uCell, vPos * vec3( 1.0, 4.0, 1.0 ) * uFreq * 1.5 + uLocal, uOctaves );
    float t = asin( lat ) / 3.141592653589793 + 0.5 + uTurb * swirl * ( 2.0 / bands );
    float s = max( 0.0, t ) * bands;
    int idx = int( floor( s ) );
    int i0 = idx - ( idx / uStopCount ) * uStopCount;
    int i1 = ( i0 + 1 ) - ( ( i0 + 1 ) / uStopCount ) * uStopCount;
    vec4 c0 = uStops[ i0 ];
    c = uBlend ? mix( c0, uStops[ i1 ], smoothstep( 0.55, 1.0, fract( s ) ) ) : c0;
    c.rgb *= 0.9 + 0.2 * n;
  } else if ( uType == 4 ) {
    // swirl: gas spiralling in round the object's y axis, faster near the
    // middle, streaked along the spiral with dark lanes, colours from the
    // middle (first stop) out to the rim, a rippled heart and a ragged edge.
    // Two layers a half cycle apart crossfade, so the winding never piles up.
    float r = length( vPos.xz ) / uRadius;
    float th = atan( vPos.z, vPos.x );
    float lr = log( max( r, 1e-3 ) );
    float g = uFade.x * swirlLayer( th, r, lr, uTau.x ) + uFade.y * swirlLayer( th, r, lr, uTau.y );
    g /= max( 1e-3, sqrt( uFade.x * uFade.x + uFade.y * uFade.y ) );
    float dens = smoothstep( -0.6, 0.5, g );
    float heart = 1.0 - smoothstep( 0.0, 0.28, r );
    float ripple = 0.75 + 0.25 * sin( r * 70.0 - uRipple );
    float coarse = lcFbm3( uCell, vec3( cos( th ), sin( th ), lr * 2.0 ) * 1.3, 2 );
    float edge = 1.0 - smoothstep( 0.55, 1.0, r + uTurb * 0.4 * coarse );
    c = colorAtBand( clamp( r, 0.0, 1.0 ) );
    // the lanes are thin gas, not empty: a dim floor under the streaks
    c.rgb *= mix( 0.3 + 1.0 * dens, ripple * 1.2, heart );
    c.a *= mix( 0.3 + 0.7 * dens, 1.0, heart * 0.8 ) * edge;
    // down a well the gas thins out before the narrow throat, into the light at its heart
    if ( uDepth > 0.0 ) c.a *= 1.0 - smoothstep( 0.3, 0.75, -vPos.y / uDepth );
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
 * @param {any} fill - the `fill.effect` config
 * @param {import('../objects/common.js').BuildContext} ctx
 * @param {{ radius: number, base?: number[], opacity?: number, solid?: boolean, depth?: number }} o -
 *   radius sets the default detail; base is the colour under the fill (straight rgba);
 *   solid writes depth (a sphere's body, which hides what is behind it); depth is a well's (a swirl thins out down it)
 * @returns {{ material: ShaderMaterial, tick: ((dt: number, t: number) => boolean) | null }}
 */
export function fillMaterial(fill, ctx, o) {
  const f = resolveFill(fill);
  const type = FILL_TYPES[/** @type {keyof typeof FILL_TYPES} */ (f.type)] ?? FILL_TYPES.plasma;
  const radius = Math.max(1e-3, o.radius);
  const freq = f.base_frequency !== undefined ? Math.max(0, num(f.base_frequency, 0)) : CELLS_PER_RADIUS / radius;
  const octaves = Math.max(1, Math.min(MAX_OCTAVES3, Math.round(num(f.num_octaves, type === FILL_TYPES.contour ? 2 : type === FILL_TYPES.plasma ? 3 : 4))));
  const stops = new Float32Array(MAX_STOPS * 4);
  let stopCount = 2;
  if (type === FILL_TYPES.contour || type === FILL_TYPES.bands || type === FILL_TYPES.swirl) {
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
    uOpacity: { value: Math.max(0, Math.min(1, num(f.opacity, 1))) * (o.opacity ?? 1) },
    uRadius: { value: radius },
    uTurb: { value: Math.max(0, Math.min(1, num(f.turbulence, 0.3))) },
    uTau: { value: [0, 0] },
    uFade: { value: [1, 0] },
    // swirl: radians a second at the rim, log-radius a second drawn in, spiral winding, ripple phase
    uAng: { value: num(f.speed, 0) / radius },
    uFall: { value: 0.04 * Math.sign(num(f.speed, 0)) },
    uWind: { value: 2.2 },
    uRipple: { value: 0 },
    uDepth: { value: Math.max(0, o.depth ?? 0) }
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
  if (type === FILL_TYPES.swirl) {
    return {
      material,
      tick: speed
        ? (/** @type {number} */ _dt, /** @type {number} */ t) => {
          // two layers SWIRL_CYCLE apart by half, each restarting as it fades out
          const s = t / 1000;
          for (let k = 0; k < 2; k++) {
            const ph = (s / SWIRL_CYCLE + k / 2) % 1;
            u.uTau.value[k] = ph * SWIRL_CYCLE;
            u.uFade.value[k] = 1 - Math.abs(2 * ph - 1);
          }
          u.uRipple.value = (s * 2.5) % (2 * Math.PI);
          return true;
        }
        : null
    };
  }
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
