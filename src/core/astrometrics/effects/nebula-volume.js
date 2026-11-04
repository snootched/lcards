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
 * @module core/astrometrics/effects/nebula-volume
 */
import { Group, Mesh, Scene, BoxGeometry, IcosahedronGeometry, ShaderMaterial, BackSide, AdditiveBlending, NormalBlending, NoBlending, Vector2, Vector3, Vector4, Matrix3, Matrix4, Euler, WebGLRenderTarget, LinearFilter, Color } from 'three';
import { noiseTexture } from './noise3-texture.js';
import { SOLID_DEPTH_GLSL, solidUniforms, solidDepth, useSolidDepth, disposeSolidDepth } from './solid-depth.js';
import { built, num, pair, sub } from '../objects/common.js';
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
  for ( int i = 0; i < STEPS; i++ ) {
    float t = a + ( float( i ) + jitter ) * dt;
    if ( t > b ) break;
    vec3 p = ro + rd * t;
    // the clouds' shape (how far into one), and their colour and opacity where they overlap
    float field = 0.0;
    float dark = 0.0;
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
#if SHAPE != 0 && SHAPE != 3
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
    tint.rgb = mix( tint.rgb, uCore.rgb, uCore.a * coreAt );
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
    acc += ( 1.0 - alpha ) * ( tint.rgb * s * glow * ( 1.0 - sd ) + uDustColor * sd );
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
  const shapeFreq = shape === 3 ? 0.8 : shape > 0 ? SHAPE_FREQ : 1;
  const freq = (cellsPerUnit / TEXTURE_CELLS) * (cfg.noise_scale === undefined ? shapeFreq : 1);
  const base = colorOf(0);
  const coreColor = sub(cfg.core).color;
  const core = coreColor !== undefined ? ctx.color(coreColor, '#ffffff') : null;
  const dust = sub(cfg.dust);
  const dustColor = dust.color !== undefined ? ctx.color(dust.color, '#000000') : [0, 0, 0];

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
    uWispOff: { value: new Vector3() }
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

  const out = built(cfg, node, { radius: Math.hypot(half[0], half[1], half[2]) });
  /** @type {import('three').Scene | null} */
  let sceneOf = null;
  // before each render: where the solids are this frame, then the gas at their resolution
  out.prerender = (renderer, scene, camera, w, h, frame) => {
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
    return rate[0] !== 0 || rate[1] !== 0;
  };
  out.tick = baseDrift[0] || baseDrift[1] ? tick : null;
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
