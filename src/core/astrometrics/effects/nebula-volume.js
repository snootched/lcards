/**
 * `type: nebula` with `render: volume`: the gas raymarched through its
 * region (a box from `size`, else a ball of `radius`), so the camera can fly
 * into it and see gas all round, which camera-facing puffs cannot give.
 *
 * The clouds are the same as the puffs' (`nebulaLayout`: seeded or placed by
 * hand, the same colours and opacities), here soft blobs of density; the
 * gas is the blobs eroded by 3D noise from a shared tileable texture
 * (`noise3-texture.js`, two reads per sample: the E6 spike's go). Density
 * falls to zero at the region's faces, so no edge shows.
 *
 * Marched at half resolution before each render (`prerender`): a BackSide
 * mesh of the region (it still draws with the camera inside) into a target
 * the size of the solid depth image, each fragment marching front to back
 * from where its ray enters the clouds to where it leaves them, or to the
 * nearest solid (`solid-depth.js`: a planet inside the gas hides the gas
 * behind it). The scene's own mesh of the region then lays that image over
 * the frame (soft gas loses nothing at half resolution; a quarter of the
 * fragments march). No depth test against its own back face (that would
 * lose the gas in front of a planet).
 *
 * `shape: layers` (the Badlands) is a floor and a ceiling of gas with a
 * gap between (`gap`): bright veins in their surfaces (`veins`), a band
 * glowing mid-gap (a thin sheet added once where the ray crosses it, and a
 * smooth glow through the gap), and columns standing floor to ceiling
 * (`columns`: fire and vortex in the march, each added once where the ray
 * passes its axis; lightning as bolts of a `lightning` object). Lightning,
 * its own (`lightning:` here) or a `type: lightning` striking inside the
 * region, lights the gas through four light uniforms (`setLights`).
 *
 * @module core/astrometrics/effects/nebula-volume
 */
import { Group, Mesh, Scene, BoxGeometry, IcosahedronGeometry, ShaderMaterial, BackSide, AdditiveBlending, NormalBlending, NoBlending, Vector2, Vector3, Vector4, Matrix3, Matrix4, Euler, WebGLRenderTarget, LinearFilter, Color } from 'three';
import { noiseTexture } from './noise3-texture.js';
import { SOLID_DEPTH_GLSL, solidUniforms, solidDepth, useSolidDepth, disposeSolidDepth } from './solid-depth.js';
import { built, num, pair, sub, isOn, DEFAULT_COLORS } from '../objects/common.js';
import { buildLightning, MAX_LIGHTS } from '../objects/lightning.js';
import { addDiagram } from '../objects/diagram.js';
import { boxRuns } from './cube.js';
import { FatLine } from '../lines.js';
import { NEBULA_SHAPES } from '../names.js';

/** Samples along each ray */
export const VOLUME_STEPS = 48;
/** Noise cells (of the texture's first octave) across a mean cloud radius when noise_scale is not set */
const CELLS_PER_RADIUS = 5;
/** Cells across the noise texture at its first octave (noise3-texture.js) */
const TEXTURE_CELLS = 4;
/** The two-read noise's mean and spread (standard deviation), measured on the texture */
const NOISE_MEAN = '0.55';
const NOISE_SPREAD = '0.08';
/** A shape's noise against the clouds' (shell, bipolar, cavity) */
const SHAPE_FREQ = 0.5;
/** Wisps: this many times finer than the main field */
const WISP_SCALE = 2.7;

/** @param {any} v @returns {[number, number, number]} */
export function regionBox(v) {
  if (Array.isArray(v)) {
    const w = Math.max(1e-3, num(v[0], 200));
    return [w, Math.max(1e-3, num(v[1], w / 5)), Math.max(1e-3, num(v[2], w))];
  }
  const s = Math.max(1e-3, num(v, 200));
  return [s, s, s];
}

/**
 * How much gas is left at a point of the region from its faces in: 1 well
 * inside, 0 at a face (the shader computes the same).
 * @param {number[]} q - the point over the half size (box) or the radius (ball), -1 to 1 inside
 * @param {boolean} ball
 */
export function edgeFalloff(q, ball) {
  const ss = (/** @type {number} */ a, /** @type {number} */ b, /** @type {number} */ x) => {
    const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  if (ball) return ss(0, 0.3, 1 - Math.hypot(q[0], q[1], q[2]));
  return ss(0, 0.45, 1 - Math.pow(q[0] ** 4 + q[1] ** 4 + q[2] ** 4, 0.25));
}

/**
 * The ribbon's curve (`shape: wake`, the Nexus) at x (-1 to 1 of the half
 * length): its y and z over the half size, as the shader's ribbonAt.
 * @param {number} x
 * @param {{ waves: number, ay: number, az: number, phase: number, base: number }} r
 * @returns {[number, number]}
 */
export function ribbonAt(x, r) {
  const a = Math.PI * r.waves * (x + 1);
  const y = r.base + (r.ay * (Math.sin(a + r.phase) + 0.3 * Math.sin(2.3 * a + 1.7 + r.phase * 1.3))) / 1.3;
  const z = r.az * Math.sin(0.7 * a + 0.9 + r.phase * 0.8);
  return [y, z];
}

/** Gas clouds and dust clouds the shader takes (nebula.js MAX_CLOUDS + MAX_DUST) */
const MAX_CLOUDS = 14;

/**
 * A cloud's ellipsoid as the shader takes it: M maps a point's offset from
 * the centre to the unit ball (M = A^-1 R^T, A its half axes, R its turn);
 * a round cloud is I / r.
 * @param {{ axes: number[], turn: number[] }} c
 */
export function cloudMatrix(c) {
  const r = new Matrix4().makeRotationFromEuler(new Euler(c.turn[0], c.turn[1], c.turn[2], 'YXZ'));
  const m = new Matrix3().setFromMatrix4(r).transpose();
  const e = m.elements;
  // scale the rows (column-major: element col * 3 + row)
  for (let col = 0; col < 3; col++) for (let row = 0; row < 3; row++) e[col * 3 + row] /= c.axes[row];
  return m;
}

const VERT = /* glsl */ `
varying vec3 vLocal;
void main() {
  vLocal = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`;

const FRAG = /* glsl */ `
precision highp float;
precision highp sampler3D;
#include <packing>
${SOLID_DEPTH_GLSL}
uniform sampler3D uNoise;
varying vec3 vLocal;
uniform vec3 uCam;
uniform vec3 uFwd;
uniform float uOrtho;
uniform float uWorldScale;
uniform float uBall;
uniform vec3 uHalf;
uniform int uCount;
uniform vec4 uClouds[ ${MAX_CLOUDS} ];
uniform mat3 uShapes[ ${MAX_CLOUDS} ];
uniform vec4 uTints[ ${MAX_CLOUDS} ];
uniform vec4 uBase;
uniform vec4 uCore;
uniform float uDust;
uniform vec3 uDustColor;
uniform float uDensity;
uniform float uK;
uniform float uMinStep;
uniform float uTurb;
uniform float uFreq;
uniform vec3 uWarpOff;
uniform vec3 uWispOff;
uniform vec4 uStops[ 4 ];
uniform int uStopCount;
uniform vec4 uBand;
// band: its glow's half-thickness (of the half height); the open gap's half-height
uniform float uBandW;
uniform float uGap;
// columns: width range (multipliers); a vortex's radius at its middle against its ends
uniform vec2 uColWidth;
uniform float uWaist;
uniform float uTime;
uniform int uColKind;
uniform int uColCount;
uniform vec4 uColColor;
// lights in the gas (lightning): local xyz and radius; rgb and level
uniform vec4 uLights[ 4 ];
uniform vec4 uLightColor[ 4 ];
uniform int uLightCount;
uniform float uVeins;
// wake (the Nexus): the ribbon's curve (waves along x, amplitude in y and z of the half size, phase)
// and the wake (the ribbon's height, side +1 up / -1 down, how far it leans back along x going out); the ribbon's glow colour
uniform vec4 uRibbon;
uniform vec3 uWake;
uniform vec3 uRibbonGlow;
uniform vec3 uRibbonCore;

vec2 enterLeave( vec3 ro, vec3 rd ) {
  if ( uBall > 0.5 ) {
    float R = uHalf.x;
    float b = dot( ro, rd );
    float c = dot( ro, ro ) - R * R;
    float h = b * b - c;
    if ( h < 0.0 ) return vec2( 1.0, 0.0 );
    h = sqrt( h );
    return vec2( -b - h, -b + h );
  }
  vec3 inv = 1.0 / rd;
  vec3 t0 = ( -uHalf - ro ) * inv;
  vec3 t1 = ( uHalf - ro ) * inv;
  vec3 tmin = min( t0, t1 );
  vec3 tmax = max( t0, t1 );
  return vec2( max( max( tmin.x, tmin.y ), tmin.z ), min( min( tmax.x, tmax.y ), tmax.z ) );
}

// a fixed turn (about 37 degrees round a tilted axis)
const mat3 WISP_TURN = mat3( 0.80, 0.36, -0.48, -0.20, 0.91, 0.36, 0.56, -0.20, 0.80 );

float edge( vec3 p ) {
  if ( uBall > 0.5 ) return smoothstep( 0.0, 0.3, 1.0 - length( p ) / uHalf.x );
  // a rounded box (superellipse): no hard face or corner shows
  vec3 q = abs( p ) / uHalf;
  q *= q;
  return smoothstep( 0.0, 0.45, 1.0 - sqrt( sqrt( dot( q, q ) ) ) );
}

// cavity: where the hollow sits (it breaks out of the gas on the +z side) and its radius
const vec3 CAVITY = vec3( 0.0, 0.0, 0.5 );
const float HOLLOW = 0.55;

// bipolar: a lobe's radius (round the y axis) at a height 0 (the waist) to 1 (its far end), over the region
float lobe( float s ) {
  s = clamp( s, 0.0, 1.0 );
  // a cup: narrow at the waist, widest about two thirds out, closing at the end
  return 0.05 + 0.6 * sqrt( s ) * pow( 1.0 - s, 0.3 );
}

// noise is streaked along these axes (smaller: longer streaks)
#if SHAPE == 2
const vec3 STREAK = vec3( 1.0, 0.4, 1.0 );
#elif SHAPE == 3
const vec3 STREAK = vec3( 0.3, 1.0, 1.0 );
#elif SHAPE == 5
// layers: long rolling streaks along x, flatter in y
const vec3 STREAK = vec3( 0.25, 1.6, 0.6 );
#elif SHAPE == 6
// wake: streaked out from the ribbon (the direction it streams)
const vec3 STREAK = vec3( 0.9, 0.45, 0.9 );
#else
const vec3 STREAK = vec3( 1.0 );
#endif

// the region's form over the region (q: -1 to 1 inside), 0 to 1
float envelope( vec3 q ) {
  float r = length( q );
#if SHAPE == 1
  // shell: a hollow sphere, the gas at about three quarters of the radius
  float d = ( r - 0.75 ) / 0.09;
  return exp( -d * d );
#elif SHAPE == 2
  // bipolar: an hourglass up and down the y axis, two hollow lobes joined at a pinched waist;
  // the gas is in their walls (bright where seen edge on), a little inside
  float s = abs( q.y ) / 0.95;
  float rho = lobe( s );
  // distance to the wall, not just across: the wall leans where the lobe widens or closes
  float slope = ( lobe( s + 0.02 ) - lobe( s - 0.02 ) ) / 0.04 / 0.95;
  float d = ( length( q.xz ) - rho ) / sqrt( 1.0 + slope * slope );
  float wall = exp( -pow( d / 0.06, 2.0 ) );
  float fill = 0.2 * ( 1.0 - smoothstep( -0.05, 0.0, d ) );
  return max( wall, fill ) * ( 1.0 - smoothstep( 0.9, 1.0, s ) );
#elif SHAPE == 4
  // cavity: a thick cup of gas round a hollow that opens on its +z side (a blister:
  // a bright bowl seen from there, a crescent from the side), faintly lit inside
  float h = length( q - CAVITY );
  float cup = smoothstep( HOLLOW - 0.05, HOLLOW + 0.06, h ) * ( 1.0 - smoothstep( HOLLOW + 0.2, HOLLOW + 0.45, h ) );
  return max( cup, 0.06 * ( 1.0 - smoothstep( 0.0, HOLLOW, h ) ) ) * ( 1.0 - smoothstep( 0.75, 1.0, r ) );
#else
  return 1.0;
#endif
}

#if SHAPE == 5
// layers: a floor and a ceiling of gas with a gap between; their surfaces roll in ridges
// and troughs (h: the surface noise, about -2 to 2). Returns the field and how deep in (0 to 1).
vec2 layerField( vec3 p, vec3 q ) {
  vec3 s = vec3( p.x * 0.35, 0.0, p.z * 0.8 ) * uFreq;
  float hf = ( texture( uNoise, s + vec3( 0.0, 0.21, 0.0 ) + uWarpOff ).r - ${NOISE_MEAN} ) / ${NOISE_SPREAD};
  float hc = ( texture( uNoise, s + vec3( 0.5, 0.63, 0.3 ) + uWarpOff ).r - ${NOISE_MEAN} ) / ${NOISE_SPREAD};
  // ridged: sharp crests, broad troughs
  float ff = ( texture( uNoise, s * 3.1 + vec3( 0.2, 0.47, 0.8 ) + uWarpOff * 1.7 ).r - ${NOISE_MEAN} ) / ${NOISE_SPREAD};
  float rf = 1.0 - abs( hf ) + 0.35 * ff;
  float rc = 1.0 - abs( hc ) - 0.35 * ff;
  float top = -uGap + 0.12 * rf;
  float bot = uGap - 0.12 * rc;
  float fl = smoothstep( 0.0, 0.1, top - q.y );
  float ce = smoothstep( 0.0, 0.1, q.y - bot );
  float depth = fl >= ce ? ( top - q.y ) / 0.7 : ( q.y - bot ) / 0.7;
  return vec2( max( fl, ce ), clamp( depth, 0.0, 1.0 ) );
}

// columns between floor and ceiling, on a sunflower spiral over the region: kind 1 fire
// (wide at the foot, rising flame, a splash ring on the floor), 2 vortex (a twisting hourglass, dark
// at its rim). Thinner than a march step, so each is added once where the ray passes its axis.
vec2 columnAt( int j ) {
  float fa = float( j ) * 2.39996 + 0.7;
  return vec2( cos( fa ), sin( fa ) ) * sqrt( ( float( j ) + 0.5 ) / float( uColCount ) ) * 0.75 * uHalf.xz;
}
float columnWidth( int j ) {
  return mix( uColWidth.x, uColWidth.y, fract( float( j ) * 0.618 + 0.37 ) );
}
float columnBase( int j ) {
  return uHalf.x * ( uColKind == 2 ? 0.05 : 0.045 ) * ( 0.7 + 0.6 * fract( float( j ) * 0.618 ) ) * columnWidth( j );
}
float columnRadius( int j, float qy ) {
  float R = columnBase( j );
  float prof = uColKind == 2 ? 1.75 * uWaist + 1.75 * ( 1.0 - uWaist ) * pow( abs( qy ) / 0.35, 2.0 ) : 1.15 - 0.75 * clamp( ( qy + 0.35 ) / 0.7, 0.0, 1.0 );
  return R * min( prof, 2.5 );
}
// the glow (rgb) and cover (a) a ray picks up passing column j at its closest point t
vec4 columnPass( int j, vec3 ro, vec3 rd, float t ) {
  vec3 p = ro + rd * t;
  vec3 q = p / uHalf;
  if ( abs( q.y ) > 0.55 ) return vec4( 0.0 );
  float rr = columnRadius( j, q.y );
  // the axis waves as it rises (within the pass window: about half a radius)
  float wv = p.y * 0.045 + float( j ) * 1.7 + uTime * ( uColKind == 2 ? 6.0e-4 : 3.0e-4 );
  vec2 off = p.xz - columnAt( j ) - vec2( sin( wv ), cos( wv * 1.3 ) ) * rr * ( uColKind == 2 ? 0.12 : 0.45 );
  float d = length( off ) / rr;
  if ( d > 2.0 ) return vec4( 0.0 );
  // across the column as seen (for the flame's streaks), twisting for a vortex
  vec2 h = normalize( rd.xz + 1e-6 );
  float side = ( h.x * off.y - h.y * off.x ) / rr;
  float rise = uTime * ( uColKind == 2 ? 1.0e-5 : 4.0e-5 );
  float tw = uColKind == 2 ? q.y * 4.0 + uTime * 1.2e-3 : 0.0;
  float zc = ( texture( uNoise, vec3( ( side + tw ) * ( uColKind == 2 ? 0.15 : 0.3 ), p.y * 0.6 * uFreq - rise, float( j ) * 0.13 ) ).r - ${NOISE_MEAN} ) / ${NOISE_SPREAD};
  float zf = ( texture( uNoise, vec3( ( side + tw ) * 0.9 + 0.31, p.y * 1.9 * uFreq - rise * 2.5, float( j ) * 0.13 + 0.5 ) ).r - ${NOISE_MEAN} ) / ${NOISE_SPREAD};
  // fire: fine flame streaks; a vortex keeps its smooth twist
  zc = uColKind == 2 ? zc : zc * 0.7 + zf * 0.5;
  float chord = min( 1.0 / max( length( rd.xz ), 0.05 ), 3.0 );
  float ends = 1.0 - smoothstep( 0.4, 0.55, abs( q.y ) );
  float body = exp( -d * d * 1.6 ) * smoothstep( -0.6, 1.1, zc ) * ends * chord;
  float glow = body * ( uColKind == 1 ? 1.0 : 0.8 );
  float cover = clamp( body * 0.5, 0.0, 1.0 );
  if ( uColKind == 2 ) cover = clamp( cover + exp( -pow( ( d - 1.05 ) / 0.3, 2.0 ) ) * ends * 0.35 * chord, 0.0, 0.9 );
  // white-hot heart, the sheets' surface colour at the edge (fire); the column colour throughout (vortex)
  vec3 col = uColKind == 1 ? mix( uColColor.rgb, uStops[ 0 ].rgb, smoothstep( 0.1, 1.1, d ) ) : uColColor.rgb;
  return vec4( col * glow, cover );
}
// the fire's splash ring on the floor (wide and flat: sampled with the gas)
float splash( vec3 p, vec3 q ) {
  float b = 0.0;
  for ( int j = 0; j < ${MAX_CLOUDS}; j++ ) {
    if ( j >= uColCount ) break;
    float R = columnBase( j );
    float rl = length( p.xz - columnAt( j ) ) / R;
    b += exp( -pow( ( rl - 1.9 ) / 0.4, 2.0 ) ) * exp( -pow( ( q.y + 0.24 ) / 0.05, 2.0 ) ) / columnWidth( j );
  }
  return b;
}

#endif

#if SHAPE == 6
// the ribbon's curve across the region's length (x: -1 to 1 of the half size): its y and z there
vec2 ribbonAt( float x ) {
  float a = 3.14159265 * uRibbon.x * ( x + 1.0 );
  float y = uWake.x + uRibbon.y * ( sin( a + uRibbon.w ) + 0.3 * sin( 2.3 * a + 1.7 + uRibbon.w * 1.3 ) ) / 1.3;
  float z = uRibbon.z * sin( 0.7 * a + 0.9 + uRibbon.w * 0.8 );
  return vec2( y, z );
}
// the wake: a sheet of gas trailing the ribbon on one side, thickening and thinning out away
// from it. x: the field; y: how far out (0 at the ribbon, 1 at the far edge); z: near the ribbon
vec3 wakeField( vec3 q ) {
  q.y *= uWake.y;
  // leaning: further out, the gas comes from further along the ribbon (a fan trailing to one side)
  q.x += uWake.z * max( q.y - uWake.x, 0.0 );
  vec2 c = ribbonAt( q.x );
  float dy = q.y - c.x;
  float dz = q.z - c.y;
  float slope = ( ribbonAt( q.x + 0.01 ).x - ribbonAt( q.x - 0.01 ).x ) / 0.02 * uHalf.y / uHalf.x;
  float u = dy / max( 1.0 - c.x, 0.1 );
  float th = 0.1 + 0.5 * clamp( u, 0.0, 1.0 );
  float across = exp( -pow( dz / th, 2.0 ) );
  float fall = u >= 0.0 ? exp( -2.4 * u ) * ( 1.0 - smoothstep( 0.4, 0.9, u ) ) : exp( -pow( u / 0.05, 2.0 ) );
  // true distance to the ribbon (the curve leans where it waves), of the half height
  float dc = length( vec2( dy * uHalf.y / sqrt( 1.0 + slope * slope ), dz * uHalf.z ) ) / uHalf.y;
  float near = exp( -pow( dc / 0.14, 2.0 ) );
  return vec3( across * fall, clamp( u, 0.0, 1.0 ), near );
}
#endif

#if SHAPE == 5 || SHAPE == 6
// colour stops through a sheet's depth (0: its surface)
vec4 layerTint( float d ) {
  if ( uStopCount < 2 ) return uStops[ 0 ];
  float x = d * float( uStopCount - 1 );
  int i = int( floor( x ) );
  vec4 c = uStops[ 0 ];
  for ( int j = 0; j < 3; j++ ) if ( j == i ) c = mix( uStops[ j ], uStops[ j + 1 ], fract( x ) );
  return i >= uStopCount - 1 ? uStops[ uStopCount - 1 ] : c;
}
#endif

void main() {
  vec3 ro;
  vec3 rd;
  if ( uOrtho > 0.5 ) {
    rd = uFwd;
    ro = vLocal - rd * 4.0 * length( uHalf );
  } else {
    ro = uCam;
    rd = normalize( vLocal - uCam );
  }
  vec2 ab = enterLeave( ro, rd );
  // from the camera (perspective) or its plane (orthographic) on
  float start = uOrtho > 0.5 ? dot( uCam - ro, rd ) : 0.0;
  float a = max( ab.x, start );
  float b = ab.y;
  // stop at the nearest solid: its view depth over this ray's share of the view direction
  float along = dot( rd, uFwd );
  if ( along > 1e-4 ) {
    float solid = ( solidViewDepth() / uWorldScale - dot( ro - uCam, uFwd ) ) / along;
    b = min( b, solid );
  }
  // only where the ray passes through a cloud: from the first one it enters to the last it leaves
  // (a ray that misses them all costs nothing more, and every sample lands in gas)
  float c0 = 1e30;
  float c1 = -1e30;
#if SHAPE == 0 || SHAPE == 3
  for ( int j = 0; j < ${MAX_CLOUDS}; j++ ) {
    if ( j >= uCount ) break;
    vec3 oc = ro - uClouds[ j ].xyz;
    float hb = dot( oc, rd );
    float h = hb * hb - dot( oc, oc ) + uClouds[ j ].w * uClouds[ j ].w;
    if ( h <= 0.0 ) continue;
    h = sqrt( h );
    c0 = min( c0, -hb - h );
    c1 = max( c1, -hb + h );
  }
  a = max( a, c0 );
  b = min( b, c1 );
#endif
  if ( b <= a ) discard;
  // steps no shorter than uMinStep: a short span through gas takes fewer samples
  float dt = max( ( b - a ) / float( STEPS ), uMinStep );
  // a different start per pixel: steps show as grain, not as bands
  float jitter = fract( 52.9829189 * fract( dot( gl_FragCoord.xy, vec2( 0.06711056, 0.00583715 ) ) ) );
  // emission per unit length: at density 1 a ray through the middle of a cloud gathers about 1
  float k = uDensity * uK;
  vec3 acc = vec3( 0.0 );
  float alpha = 0.0;
#if SHAPE == 5
  // where the ray crosses the band's plane (y = 0), if it does
  float bandT = abs( rd.y ) > 1e-5 ? -ro.y / rd.y : -1.0;
  if ( bandT < a || bandT > b ) bandT = -1e30;
  // where the ray passes closest to each column's axis, in order along it (each step then checks
  // only the next one)
  float colT[ ${MAX_CLOUDS} ];
  int colI[ ${MAX_CLOUDS} ];
  int colN = 0;
  for ( int j = 0; j < ${MAX_CLOUDS}; j++ ) {
    if ( j >= uColCount ) break;
    vec2 o = ro.xz - columnAt( j );
    float vv = dot( rd.xz, rd.xz );
    if ( vv < 1e-8 ) continue;
    float tc = -dot( o, rd.xz ) / vv;
    // passes near enough to show, inside the span
    vec2 near = o + rd.xz * tc;
    if ( tc < a || tc > b || dot( near, near ) > 25.0 * uHalf.x * uHalf.x * 0.0081 * uColWidth.y * uColWidth.y ) continue;
    int k = colN;
    for ( int m = ${MAX_CLOUDS} - 1; m > 0; m-- ) {
      if ( m > colN ) continue;
      if ( colT[ m - 1 ] > tc ) { colT[ m ] = colT[ m - 1 ]; colI[ m ] = colI[ m - 1 ]; k = m - 1; } else break;
    }
    colT[ k ] = tc;
    colI[ k ] = j;
    colN++;
  }
  int colNext = 0;
#endif
  for ( int i = 0; i < STEPS; i++ ) {
    float t = a + ( float( i ) + jitter ) * dt;
    if ( t > b ) break;
    vec3 p = ro + rd * t;
    // the clouds' shape (how far into one), and their colour and opacity where they overlap
    float field = 0.0;
    float dark = 0.0;
    float boost = 1.0;
#if SHAPE == 0 || SHAPE == 3
    vec4 tint = vec4( 0.0 );
    float tw = 0.0;
#else
    // a soft floor: where no cloud reaches (a shape's envelope), the first colour
    vec4 tint = uBase * 1e-3;
    float tw = 1e-3;
#endif
    for ( int j = 0; j < ${MAX_CLOUDS}; j++ ) {
      if ( j >= uCount ) break;
      vec3 d = uShapes[ j ] * ( p - uClouds[ j ].xyz );
      float dd = dot( d, d );
      float w = max( 0.0, 1.0 - dd );
      w *= w;
      if ( uClouds[ j ].w < 0.0 ) { dark += w; continue; }
      field += w;
#if SHAPE == 0 || SHAPE == 3
      tint += w * uTints[ j ];
      tw += w;
#else
      // shapes: colour from the nearest clouds, reaching past their edges
      float wc = exp( -2.0 * dd );
      tint += wc * uTints[ j ];
      tw += wc;
#endif
    }
#if SHAPE == 5
    vec2 lf = layerField( p, p / uHalf );
    // a faint haze fills the gap (the gas never quite clears); the band lights it round the middle
    float bg = uBand.a * exp( -pow( p.y / uHalf.y / max( uBandW * 3.0, uGap ), 2.0 ) ) * ( 1.0 - lf.x );
    field = max( lf.x * 1.2, 0.16 + 0.12 * min( bg, 1.0 ) );
    tint = layerTint( lf.y );
    tint.rgb = mix( tint.rgb, uBand.rgb, clamp( bg, 0.0, 1.0 ) );
    tw = 1.0;
    boost = 1.0 + 0.4 * bg;
    // the band's light through the gap: smooth (not the gas's noise), bright seen along it
    acc += ( 1.0 - alpha ) * uBand.rgb * bg * edge( p ) * 0.15 * dt / uHalf.x;
    // the band itself: a thin bright sheet at the middle, added once where the ray crosses it
    if ( uBand.a > 0.0 && abs( bandT - t ) <= 0.5 * dt ) {
      vec3 pb = ro + rd * bandT;
      float zb = ( texture( uNoise, vec3( pb.x * 0.6, 0.37, pb.z * 0.6 ) * uFreq + uWarpOff ).r - ${NOISE_MEAN} ) / ${NOISE_SPREAD};
      float ln = uBand.a * min( uBandW * 0.15 / max( abs( rd.y ), 1e-3 ), 1.5 ) * clamp( 0.75 + 0.35 * zb, 0.2, 1.6 ) * edge( pb );
      acc += ( 1.0 - alpha ) * uBand.rgb * ln;
      alpha += ( 1.0 - alpha ) * clamp( ln * 0.1, 0.0, 1.0 );
    }
    // (only near the floor's surface)
    if ( uColKind == 1 && abs( p.y / uHalf.y + 0.24 ) < 0.15 ) {
      float sp = clamp( splash( p, p / uHalf ), 0.0, 1.0 );
      field = max( field, sp * 1.4 );
      tint = mix( tint, uColColor, sp );
      boost *= 1.0 + 2.0 * sp;
    }
    // liquid fire: fine bright veins in the sheets' surfaces, darker between (high contrast)
    if ( uVeins > 0.0 && lf.y < 0.4 ) {
      float fz = ( texture( uNoise, vec3( p.x * 0.9, p.y * 1.6, p.z * 1.4 ) * uFreq * 1.3 + uWispOff ).r - ${NOISE_MEAN} ) / ${NOISE_SPREAD};
      float vein = pow( max( 0.0, 1.0 - abs( fz ) * 0.6 ), 3.0 );
      float near = ( 1.0 - smoothstep( 0.0, 0.4, lf.y ) ) * uVeins;
      field *= mix( 1.0, 0.45 + 1.1 * vein, near );
      boost *= 1.0 + 2.5 * vein * near;
    }
    // columns this step passes (in order along the ray)
    for ( int g = 0; g < 2; g++ ) {
      if ( colNext >= colN ) break;
      float tc = colT[ colNext ];
      if ( tc >= t + 0.5 * dt ) break;
      vec4 c = columnPass( colI[ colNext ], ro, rd, tc );
      acc += ( 1.0 - alpha ) * c.rgb;
      alpha += ( 1.0 - alpha ) * c.a;
      colNext++;
    }
#elif SHAPE == 6
    vec3 wk = wakeField( p / uHalf );
    // the clouds give clumps in the sheet
    field = wk.x * ( 0.75 + 0.35 * min( field, 1.0 ) ) * 1.8;
    tint = layerTint( wk.y );
    tint.rgb = mix( tint.rgb, uRibbonGlow, 0.6 * wk.z );
    // white-hot right at the ribbon
    tint.rgb = mix( tint.rgb, uRibbonCore, 0.85 * wk.z * wk.z * wk.z );
    tw = 1.0;
    // the ribbon lights the gas round it
    boost = 1.4 + 4.0 * wk.z;
#elif SHAPE != 0 && SHAPE != 3
    // the shape gives the form, the clouds the clumps in it
    field = envelope( p / uHalf ) * ( 0.35 + 0.65 * min( field, 1.0 ) ) * 1.15;
#endif
    if ( field < 1e-4 && dark < 1e-4 ) continue;
    tint /= max( tw, 1e-6 );
    // deep in the gas (a shape: near its middle), the core colour
#if SHAPE == 0 || SHAPE == 3
    float coreAt = smoothstep( 0.45, 1.1, field );
#else
    float coreAt = 1.0 - smoothstep( 0.0, 0.65, length( p / uHalf ) );
#endif
#if SHAPE == 6
    tint.rgb = mix( tint.rgb, uCore.rgb, uCore.a * wk.z );
#elif SHAPE != 5
    tint.rgb = mix( tint.rgb, uCore.rgb, uCore.a * coreAt );
#endif
    vec3 pn = p * STREAK;
    float n1 = texture( uNoise, pn * uFreq + uWarpOff ).r;
    // wisps: finer, and pushed about by the coarse field (curls, not blobs)
    // (turned against the texture's axes: its repeat and grid do not line up with the coarse field's)
    float n2 = texture( uNoise, WISP_TURN * pn * uFreq * ${WISP_SCALE.toFixed(1)} + uWispOff + ( n1 - ${NOISE_MEAN} ) * 2.5 ).r;
    // the texture's fBm is narrow (mean about 0.55, spread about 0.08): standardise it
    float z = ( n1 * 0.65 + n2 * 0.35 - ${NOISE_MEAN} ) / ${NOISE_SPREAD};
    // the noise moves each cloud's edge in and out: ragged edges and holes, a dense middle
    float gas = smoothstep( 0.0, 0.5, min( field, 1.0 ) - 0.6 * uTurb + z * 0.5 * uTurb );
#if SHAPE == 3
    // filaments: thin wrinkled sheets where the noise crosses its middle (thread-like seen edge on)
    float zr = ( n1 - ${NOISE_MEAN} ) / ${NOISE_SPREAD};
    float zs = ( n2 - ${NOISE_MEAN} ) / ${NOISE_SPREAD};
    float ridge = pow( max( 0.0, 1.0 - abs( zr + 0.15 * zs ) * 0.7 ), 5.0 );
    gas = smoothstep( 0.0, 0.35, min( field, 1.0 ) ) * ridge * 3.0;
#elif SHAPE == 4
    // cavity: the wall of the hollow is lit (the stars inside)
    float rq = length( p / uHalf - CAVITY );
    float rim = exp( -pow( ( rq - HOLLOW - 0.06 ) / 0.07, 2.0 ) );
    gas *= 1.0 + 2.5 * rim;
#endif
    // brighter filaments, darker lanes
    float glow = 0.5 + 0.5 * smoothstep( -1.5, 1.5, z );
    float fade = edge( p );
    float s = clamp( gas * tint.a * fade * k * dt, 0.0, 1.0 );
    // dust: dark gas, eroded as the gas is, that hides what is behind it
    float sd = 0.0;
    if ( dark > 1e-4 ) {
      float dgas = smoothstep( 0.0, 0.5, min( dark, 1.0 ) - 0.6 * uTurb + z * 0.5 * uTurb );
      sd = clamp( dgas * uDust * fade * k * 4.0 * dt, 0.0, 1.0 );
    }
    // lit from inside (a strike): the gas brightens and takes the light's colour
    vec3 lit = vec3( 0.0 );
    for ( int j = 0; j < 4; j++ ) {
      if ( j >= uLightCount ) break;
      vec3 dl = p - uLights[ j ].xyz;
      float x2 = dot( dl, dl ) / ( uLights[ j ].w * uLights[ j ].w );
      lit += uLightColor[ j ].rgb * uLightColor[ j ].a * ( exp( -x2 ) + 0.3 / ( 1.0 + 2.0 * x2 ) );
    }
    float litL = max( lit.r, max( lit.g, lit.b ) );
    acc += ( 1.0 - alpha ) * ( ( tint.rgb * glow * boost * ( 1.0 + 2.5 * litL ) + lit * 2.0 ) * s * ( 1.0 - sd ) + uDustColor * sd );
    alpha += ( 1.0 - alpha ) * clamp( s + sd, 0.0, 1.0 );
    if ( alpha > 0.98 ) break;
  }
  // premultiplied: add adds acc, normal lays it over
  gl_FragColor = vec4( acc, alpha );
}`;

/** Lays the half-resolution gas over the frame (the region's pixels only) */
const SHOW_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uGas;
uniform vec2 uFull;
uniform float uOpacity;
void main() {
  vec4 c = texture2D( uGas, gl_FragCoord.xy / uFull );
  if ( c.a <= 0.002 ) discard;
  gl_FragColor = c * uOpacity;
}`;

/** The wisps move this much faster than the body */
const WISP_RATE = 1.7 * WISP_SCALE;

/**
 * @typedef {Object} DriftOffsets
 * @property {[number, number]} body - the body's texture offset on x and z, 0 to 1
 * @property {[number, number]} wisp - the wisps', 0 to 1
 */

/**
 * Move the drift offsets on by `d` texture repeats (the wisps WISP_RATE times
 * as far). The texture repeats every 1, so each offset wraps to 0 to 1 (float
 * precision), and each on its own: a wisp offset made from the wrapped body
 * offset would jump every time the body wraps.
 * @param {DriftOffsets} o
 * @param {[number, number]} d
 * @returns {DriftOffsets}
 */
export function stepDrift(o, d) {
  const fr = (/** @type {number} */ x) => x - Math.floor(x);
  return {
    body: [fr(o.body[0] + d[0]), fr(o.body[1] + d[1])],
    wisp: [fr(o.wisp[0] + d[0] * WISP_RATE), fr(o.wisp[1] + d[1] * WISP_RATE)]
  };
}

/**
 * A ball region's outline for the diagram look: a ring round each axis
 * (an ellipse when its half sizes differ).
 * @param {number[]} half - half sizes x, y, z
 * @returns {number[][]}
 */
export function ballRuns(half) {
  const N = 96;
  /** @type {number[][]} */
  const runs = [[], [], []];
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * Math.PI * 2;
    const c = Math.cos(t), s = Math.sin(t);
    runs[0].push(half[0] * c, 0, half[2] * s);
    runs[1].push(half[0] * c, half[1] * s, 0);
    runs[2].push(0, half[1] * c, half[2] * s);
  }
  return runs;
}

/**
 * @param {any} cfg
 * @param {import('../objects/common.js').BuildContext} ctx
 * @param {{ clouds: import('./nebula.js').NebulaCloud[] }} layout
 * @param {(i: number) => number[]} colorOf - a cloud's colour index to rgba
 * @returns {import('../objects/common.js').BuiltObject}
 */
export function buildNebulaVolume(cfg, ctx, layout, colorOf) {
  const node = new Group();
  node.name = `nebula:${cfg.id ?? ''}`;
  const ball = cfg.size === undefined;
  const half = ball ? (() => { const R = Math.max(1e-3, num(cfg.radius, 100)); return [R, R, R]; })() : regionBox(cfg.size).map((v) => v / 2);
  const clouds = layout.clouds.slice(0, MAX_CLOUDS);
  const gasClouds = clouds.filter((c) => !c.dust);
  const meanRadius = gasClouds.length ? gasClouds.reduce((s, c) => s + c.radius, 0) / gasClouds.length : 1;
  const shape = Math.max(0, NEBULA_SHAPES.indexOf(cfg.shape));
  // filaments are thin: finer noise, more steps
  const steps = shape === 3 ? 64 : VOLUME_STEPS;
  // texture repeats per scene unit: noise_scale is noise cells per scene unit, as for the puffs
  const cellsPerUnit = cfg.noise_scale !== undefined ? Math.max(0, num(cfg.noise_scale, 0)) : CELLS_PER_RADIUS / meanRadius;
  // a shape is one smooth form across the whole region, which shows the texture's repeat: coarser noise
  const shapeFreq = shape === 3 ? 0.8 : shape === 6 ? 2.2 : shape > 0 ? SHAPE_FREQ : 1;
  const freq = (cellsPerUnit / TEXTURE_CELLS) * (cfg.noise_scale === undefined ? shapeFreq : 1);
  const base = colorOf(0);
  const coreColor = sub(cfg.core).color;
  const core = coreColor !== undefined ? ctx.color(coreColor, '#ffffff') : null;
  const dust = sub(cfg.dust);
  const dustColor = dust.color !== undefined ? ctx.color(dust.color, '#000000') : [0, 0, 0];

  const stopCount = Math.max(1, Math.min(4, Array.isArray(cfg.colors) ? cfg.colors.length : 1));
  // layers only: the band between the sheets, the columns, strikes in the gas
  const band = shape === 5 && isOn(cfg.band, false) ? sub(cfg.band) : null;
  const cols = shape === 5 && cfg.columns ? sub(cfg.columns) : null;
  const strikes = isOn(cfg.lightning, false) ? sub(cfg.lightning) : null;
  const bandColor = band ? ctx.color(band.color, DEFAULT_COLORS.glow) : [0, 0, 0];
  // wake only: the ribbon (its curve, line and glow) and the wake's side
  const wake = shape === 6 ? sub(cfg.wake) : null;
  const rib = shape === 6 ? sub(cfg.ribbon) : null;
  const side = wake?.side === 'down' ? -1 : 1;
  const curve = { waves: Math.max(0, num(rib?.waves, 2.5)), ay: Math.max(0, num(rib?.amplitude, 0.2)), az: Math.max(0, num(rib?.amplitude, 0.2)) * 0.6, phase: 0, base: -0.55 };
  const ribColor = rib ? ctx.color(rib.color, DEFAULT_COLORS.glow) : [1, 1, 1, 1];
  const ribGlow = rib ? sub(rib.glow) : {};
  const ribGlowColor = rib ? (ribGlow.color !== undefined ? ctx.color(ribGlow.color, DEFAULT_COLORS.glow) : colorOf(0)) : [1, 1, 1, 1];
  const ribSpeed = rib ? num(rib.speed, 0) : 0;

  const solid = solidUniforms();
  const u = {
    ...solid,
    uNoise: { value: noiseTexture() },
    uCam: { value: new Vector3() },
    uFwd: { value: new Vector3(0, 0, -1) },
    uOrtho: { value: 0 },
    uWorldScale: { value: 1 },
    uBall: { value: ball ? 1 : 0 },
    uHalf: { value: new Vector3(half[0], half[1], half[2]) },
    uCount: { value: clouds.length },
    // w: the bounding radius (the ray clip), negative for dust
    uClouds: { value: Array.from({ length: MAX_CLOUDS }, (_, i) => (clouds[i] ? new Vector4(clouds[i].xyz[0], clouds[i].xyz[1], clouds[i].xyz[2], Math.max(...clouds[i].axes) * (clouds[i].dust ? -1 : 1)) : new Vector4(0, 0, 0, 1))) },
    uShapes: { value: Array.from({ length: MAX_CLOUDS }, (_, i) => (clouds[i] ? cloudMatrix(clouds[i]) : new Matrix3())) },
    uBase: { value: new Vector4(base[0], base[1], base[2], (base[3] ?? 1) * 0.55) },
    uCore: { value: core ? new Vector4(core[0], core[1], core[2], 1) : new Vector4(0, 0, 0, 0) },
    uDust: { value: Math.max(0, Math.min(1, num(dust.amount, 0.8))) },
    uDustColor: { value: new Vector3(dustColor[0], dustColor[1], dustColor[2]) },
    uTints: {
      value: Array.from({ length: MAX_CLOUDS }, (_, i) => {
        if (!clouds[i] || clouds[i].dust) return new Vector4(0, 0, 0, 0);
        const c = colorOf(clouds[i].color);
        return new Vector4(c[0], c[1], c[2], (c[3] ?? 1) * clouds[i].opacity);
      })
    },
    uDensity: { value: Math.max(0, num(cfg.density, 1)) },
    uK: { value: 2.2 / meanRadius },
    // a cloud's diameter in no fewer than 20 samples
    uMinStep: { value: meanRadius / 10 },
    uTurb: { value: Math.max(0, Math.min(1, num(cfg.turbulence, 0.5))) },
    uFreq: { value: freq },
    uWarpOff: { value: new Vector3() },
    uWispOff: { value: new Vector3() },
    // layers: the colours from the surface down, the band, the scene clock
    uStops: { value: Array.from({ length: 4 }, (_, i) => { const c = colorOf(Math.min(i, stopCount - 1)); return new Vector4(c[0], c[1], c[2], (c[3] ?? 1) * 0.8); }) },
    uStopCount: { value: stopCount },
    uBand: { value: band ? new Vector4(bandColor[0], bandColor[1], bandColor[2], Math.max(0, num(band.brightness, 1))) : new Vector4(0, 0, 0, 0) },
    uBandW: { value: band ? Math.max(0.01, Math.min(0.5, num(band.width, 0.08))) : 0.08 },
    uGap: { value: Math.max(0, Math.min(0.45, num(cfg.gap, 0.56) / 2)) },
    uColWidth: { value: (() => { const w = cols?.width; const r = Array.isArray(w) ? [num(w[0], 1), num(w[1] ?? w[0], 1)] : [num(w, 1), num(w, 1)]; return new Vector2(Math.max(0.1, Math.min(r[0], r[1])), Math.max(0.1, r[0], r[1])); })() },
    uWaist: { value: Math.max(0.05, Math.min(1, num(cols?.waist, 0.2))) },
    uTime: { value: 0 },
    uColKind: { value: cols ? Math.max(0, ['none', 'fire', 'vortex'].indexOf(cols.kind ?? 'fire')) : 0 },
    uLights: { value: Array.from({ length: MAX_LIGHTS }, () => new Vector4(0, 0, 0, 1)) },
    uLightColor: { value: Array.from({ length: MAX_LIGHTS }, () => new Vector4(0, 0, 0, 0)) },
    uLightCount: { value: 0 },
    uRibbon: { value: new Vector4(curve.waves, curve.ay, curve.az, 0) },
    uWake: { value: new Vector3(curve.base, side, Math.max(-1, Math.min(1, num(wake?.lean, 0)))) },
    uRibbonCore: { value: new Vector3(ribColor[0], ribColor[1], ribColor[2]) },
    uRibbonGlow: { value: new Vector3(ribGlowColor[0], ribGlowColor[1], ribGlowColor[2]) },
    uVeins: { value: shape === 5 ? Math.max(0, Math.min(1, num(cfg.veins, 0))) : 0 },
    uColCount: { value: cols && cols.kind !== 'lightning' ? Math.min(MAX_CLOUDS, Math.max(0, Math.round(num(cols.count, 4)))) : 0 },
    uColColor: { value: (() => { const c = cols ? ctx.color(cols.color, DEFAULT_COLORS.glow) : [1, 1, 1, 1]; return new Vector4(c[0], c[1], c[2], c[3] ?? 1); })() }
  };
  const march = new ShaderMaterial({
    uniforms: u,
    vertexShader: VERT,
    fragmentShader: FRAG,
    defines: { SHAPE: shape, STEPS: steps },
    depthTest: false,
    depthWrite: false,
    side: BackSide,
    blending: NoBlending
  });
  const geo = ball ? new IcosahedronGeometry(half[0] * 1.02, 3) : new BoxGeometry(half[0] * 2, half[1] * 2, half[2] * 2);
  // the march draws alone into its target, from the shown mesh's place
  const marchMesh = new Mesh(geo, march);
  marchMesh.matrixAutoUpdate = false;
  marchMesh.frustumCulled = false;
  const marchScene = new Scene();
  marchScene.add(marchMesh);
  marchScene.matrixWorldAutoUpdate = false;
  /** @type {WebGLRenderTarget | null} */
  let target = null;

  const show = { uGas: { value: /** @type {import('three').Texture | null} */ (null) }, uFull: { value: new Vector2(1, 1) }, uOpacity: { value: Math.max(0, num(cfg.opacity, 1)) } };
  const additive = cfg.blend !== 'normal';
  const mat = new ShaderMaterial({
    uniforms: show,
    vertexShader: VERT,
    fragmentShader: SHOW_FRAG,
    transparent: true,
    premultipliedAlpha: true,
    depthTest: false,
    depthWrite: false,
    side: BackSide,
    blending: additive ? AdditiveBlending : NormalBlending
  });
  const mesh = new Mesh(geo, mat);
  mesh.name = 'nebula-volume';
  // after the grid faces (1 to 2: a sphere's face paints its body, which would cover the gas in
  // front of a planet), before the lines; the solid depth pass stops the gas behind a solid
  mesh.renderOrder = 2.25;
  node.add(mesh);

  const inv = new Matrix4();
  const camWorld = new Vector3();
  const clear = new Color();
  /** @param {import('three').Camera} camera */
  const aim = (camera) => {
    inv.copy(mesh.matrixWorld).invert();
    camera.getWorldPosition(camWorld);
    u.uCam.value.copy(camWorld).applyMatrix4(inv);
    camera.getWorldDirection(u.uFwd.value);
    u.uFwd.value.transformDirection(inv);
    u.uOrtho.value = /** @type {any} */ (camera).isOrthographicCamera ? 1 : 0;
    u.uWorldScale.value = mesh.matrixWorld.getMaxScaleOnAxis();
  };

  // the gas renders in a pass of its own (off the node tree): its colours fade in place too (recolor.js)
  const out = built(cfg, node, { radius: Math.hypot(half[0], half[1], half[2]), materials: [march] });

  // lights from lightning, by source; the brightest MAX_LIGHTS go to the march
  /** @type {Map<object, { at: number[], radius: number, color: number[], level: number }[]>} */
  const lightSets = new Map();
  const toLocal = new Matrix4();
  const lp = new Vector3();
  out.setLights = (source, lights) => {
    if (lights.length) lightSets.set(source, lights);
    else if (!lightSets.delete(source)) return;
    const all = [...lightSets.values()].flat().sort((a, b) => b.level - a.level).slice(0, MAX_LIGHTS);
    mesh.updateWorldMatrix(true, false);
    toLocal.copy(mesh.matrixWorld).invert();
    const scale = mesh.matrixWorld.getMaxScaleOnAxis() || 1;
    all.forEach((l, i) => {
      lp.set(l.at[0], l.at[1], l.at[2]).applyMatrix4(toLocal);
      u.uLights.value[i].set(lp.x, lp.y, lp.z, Math.max(1e-3, l.radius / scale));
      u.uLightColor.value[i].set(l.color[0], l.color[1], l.color[2], l.level);
    });
    u.uLightCount.value = all.length;
    ctx.requestFrame?.();
  };
  out.contains = (world) => {
    mesh.updateWorldMatrix(true, false);
    lp.set(world[0], world[1], world[2]).applyMatrix4(toLocal.copy(mesh.matrixWorld).invert());
    return ball ? lp.length() <= half[0] : Math.abs(lp.x) <= half[0] && Math.abs(lp.y) <= half[1] && Math.abs(lp.z) <= half[2];
  };
  // the ribbon's line, local (wake only)
  const ribRun = () => {
    const pts = [];
    for (let i = 0; i <= 160; i++) {
      const x = -0.92 + (1.84 * i) / 160;
      const [y, z] = ribbonAt(x, curve);
      pts.push(x * half[0], y * side * half[1], z * half[2]);
    }
    return pts;
  };
  // lightning columns: held discharges floor to ceiling, as a lightning object of its own
  const bolts = cols && cols.kind === 'lightning'
    ? buildLightning({ type: 'lightning', id: `${out.id}:columns`, mode: 'column', count: Math.min(MAX_CLOUDS, Math.max(1, Math.round(num(cols.count, 4)))), size: [half[0] * 2, half[1] * 0.5, half[2] * 2], color: cols.color, glow: cols.glow, speed: cols.speed, seed: num(cfg.seed, 1) }, ctx)
    : null;
  // strikes in the gas (lightning: true or { ... }): a lightning object of its own over most of the region
  const struck = strikes
    ? buildLightning(shape === 6 && strikes.mode === 'crawl'
      // wake: discharges crawling off the ribbon
      ? { seed: num(cfg.seed, 1), ...strikes, type: 'lightning', id: `${out.id}:lightning`, mode: 'crawl', size: [half[0] * 2, half[1] * 2, half[2] * 2], path: () => ribRun(), up: [0, side, 0] }
      : { seed: num(cfg.seed, 1), ...strikes, type: 'lightning', id: `${out.id}:lightning`, mode: 'strike', size: [half[0] * 1.8, half[1] * (shape === 5 ? 0.75 : 1.5), half[2] * 1.8] }, ctx)
    : null;
  for (const b of [bolts, struck]) {
    if (!b) continue;
    node.add(b.node);
    out.lines.push(...b.lines);
  }
  // the diagram look: the region's outline (a ball's three rings on its axes, a box's edges) in the
  // gas's first colour; the gas and its lightning are the realistic part (the ribbon is a line: it
  // shows in every look)
  addDiagram(out, {
    runs: ball ? ballRuns(half) : boxRuns(half[0], half[1], half[2], 1),
    color: [...base],
    body: [mesh, ...[bolts, struck].filter((b) => !!b).map((b) => /** @type {any} */ (b).node)]
  });
  // the ribbon: a white-hot line along the curve (a lit tube), a glow round it
  /** @type {FatLine[]} */
  const ribLines = [];
  if (rib && isOn(cfg.ribbon, true)) {
    const w = Math.max(0.5, num(rib.width, 6));
    const glowOn = isOn(rib.glow, true);
    const gw = glowOn ? Math.max(0, num(ribGlow.width, 8)) : 0;
    const run = ribRun();
    if (gw) ribLines.push(new FatLine([run], { color: ribGlowColor, width: w * gw, opacity: 0.5, soft: true, lighten: true }));
    if (glowOn) ribLines.push(new FatLine([run], { color: ribGlowColor, width: w * 3, opacity: 0.9, soft: true, lighten: true }));
    ribLines.push(new FatLine([run], { color: ribColor, width: w, opacity: 1, additive: true, tube: true }));
    for (const l of ribLines) {
      // the glows under the gas (max blending: drawn first, the gas adds over them), the line over it
      l.object.renderOrder = l.style.lighten ? 2.2 : 3.4;
      node.add(l.object);
      out.lines.push(l);
    }
  }
  /** @type {import('three').Scene | null} */
  let sceneOf = null;
  // before each render: where the solids are this frame, then the gas at their resolution
  out.prerender = (renderer, scene, camera, w, h, frame) => {
    // the look hides the gas (the diagram look shows the outline): no march
    if (!mesh.visible) return;
    sceneOf = scene;
    const img = solidDepth(renderer, scene, camera, w, h, frame);
    useSolidDepth(u, img);
    const [tw, th] = [img.target.x, img.target.y];
    if (!target || target.width !== tw || target.height !== th) {
      target?.dispose();
      target = new WebGLRenderTarget(tw, th, { depthBuffer: false, minFilter: LinearFilter, magFilter: LinearFilter });
    }
    mesh.updateWorldMatrix(true, false);
    marchMesh.matrixWorld.copy(mesh.matrixWorld);
    aim(camera);
    const prev = renderer.getRenderTarget();
    renderer.getClearColor(clear);
    const clearAlpha = renderer.getClearAlpha();
    try {
      renderer.setRenderTarget(target);
      renderer.setClearColor(0x000000, 0);
      renderer.clear(true, false, false);
      renderer.render(marchScene, camera);
    } finally {
      renderer.setRenderTarget(prev);
      renderer.setClearColor(clear, clearAlpha);
    }
    show.uGas.value = target.texture;
    show.uFull.value.set(w, h);
  };
  out.dispose = () => {
    bolts?.dispose?.();
    struck?.dispose?.();
    target?.dispose();
    march.dispose();
    if (sceneOf) disposeSolidDepth(sceneOf);
  };

  // drift: scene units per second on x and z (the wisps the other way, faster), as texture repeats
  const toRate = (/** @type {number} */ d) => (d * freq) / 1000;
  const baseDrift = pair(cfg.drift, [0, 0]);
  const drift = [...baseDrift];
  /** @type {DriftOffsets | null} */
  let offsets = null;
  /** @type {number | null} */
  let lastT = null;
  const tick = (/** @type {number} */ _dt, /** @type {number} */ t) => {
    const rate = drift.map(toRate);
    if (!offsets) offsets = stepDrift({ body: [0, 0], wisp: [0, 0] }, [t * rate[0], t * rate[1]]);
    else if (lastT !== null) offsets = stepDrift(offsets, [(t - lastT) * rate[0], (t - lastT) * rate[1]]);
    lastT = t;
    u.uWarpOff.value.set(-offsets.body[0], 0, -offsets.body[1]);
    u.uWispOff.value.set(offsets.wisp[0], 0.37, offsets.wisp[1]);
    u.uTime.value = t;
    if (ribSpeed) {
      // the waves travel along the ribbon (scene units a second), the wake streams out from it
      curve.phase = (-Math.PI * curve.waves * ribSpeed * t) / 1000 / half[0];
      u.uRibbon.value.w = curve.phase;
      const flow = ((ribSpeed * t) / 1000) * freq * 0.5;
      u.uWarpOff.value.y = -(flow - Math.floor(flow));
      u.uWispOff.value.y = 0.37 - ((flow * WISP_RATE) - Math.floor(flow * WISP_RATE));
      const run = ribRun();
      for (const l of ribLines) l.setRuns([run]);
    }
    bolts?.tick?.(_dt, t);
    struck?.tick?.(_dt, t);
    return rate[0] !== 0 || rate[1] !== 0 || !!cols || !!struck || !!ribSpeed;
  };
  out.tick = baseDrift[0] || baseDrift[1] || cols || struck || ribSpeed ? tick : null;
  const baseDensity = u.uDensity.value;
  out.live = (key, value) => {
    if (key === 'density') {
      u.uDensity.value = value === null || !Number.isFinite(value) ? baseDensity : Math.max(0, value);
      ctx.requestFrame?.();
      return true;
    }
    const sides = key === 'drift' ? [0, 1] : key === 'drift.0' ? [0] : key === 'drift.1' ? [1] : null;
    if (!sides) return false;
    for (const i of sides) drift[i] = value === null || !Number.isFinite(value) ? baseDrift[i] : value;
    if (!out.tick) {
      offsets = { body: [0, 0], wisp: [0, 0] };
      lastT = null;
      out.tick = tick;
    }
    return true;
  };
  return out;
}
