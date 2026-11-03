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
import { Group, Mesh, Scene, BoxGeometry, IcosahedronGeometry, ShaderMaterial, BackSide, AdditiveBlending, NormalBlending, NoBlending, Vector2, Vector3, Vector4, Matrix4, WebGLRenderTarget, LinearFilter, Color } from 'three';
import { noiseTexture } from './noise3-texture.js';
import { SOLID_DEPTH_GLSL, solidUniforms, solidDepth, useSolidDepth, disposeSolidDepth } from './solid-depth.js';
import { built, num, pair } from '../objects/common.js';

/** Samples along each ray */
export const VOLUME_STEPS = 48;
/** Noise cells (of the texture's first octave) across a mean cloud radius when noise_scale is not set */
const CELLS_PER_RADIUS = 5;
/** Cells across the noise texture at its first octave (noise3-texture.js) */
const TEXTURE_CELLS = 4;
/** The two-read noise's mean and spread (standard deviation), measured on the texture */
const NOISE_MEAN = '0.55';
const NOISE_SPREAD = '0.08';
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

const MAX_CLOUDS = 10;

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
uniform vec4 uTints[ ${MAX_CLOUDS} ];
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
  if ( b <= a ) discard;
  // steps no shorter than uMinStep: a short span through gas takes fewer samples
  float dt = max( ( b - a ) / float( ${VOLUME_STEPS} ), uMinStep );
  // a different start per pixel: steps show as grain, not as bands
  float jitter = fract( 52.9829189 * fract( dot( gl_FragCoord.xy, vec2( 0.06711056, 0.00583715 ) ) ) );
  // emission per unit length: at density 1 a ray through the middle of a cloud gathers about 1
  float k = uDensity * uK;
  vec3 acc = vec3( 0.0 );
  float alpha = 0.0;
  for ( int i = 0; i < ${VOLUME_STEPS}; i++ ) {
    float t = a + ( float( i ) + jitter ) * dt;
    if ( t > b ) break;
    vec3 p = ro + rd * t;
    // the clouds' shape (how far into one), and their colour and opacity where they overlap
    float field = 0.0;
    vec4 tint = vec4( 0.0 );
    for ( int j = 0; j < ${MAX_CLOUDS}; j++ ) {
      if ( j >= uCount ) break;
      vec3 d = ( p - uClouds[ j ].xyz ) / uClouds[ j ].w;
      float w = max( 0.0, 1.0 - dot( d, d ) );
      w *= w;
      field += w;
      tint += w * uTints[ j ];
    }
    if ( field < 1e-4 ) continue;
    tint /= field;
    float n1 = texture( uNoise, p * uFreq + uWarpOff ).r;
    // wisps: finer, and pushed about by the coarse field (curls, not blobs)
    // (turned against the texture's axes: its repeat and grid do not line up with the coarse field's)
    float n2 = texture( uNoise, WISP_TURN * p * uFreq * ${WISP_SCALE.toFixed(1)} + uWispOff + ( n1 - ${NOISE_MEAN} ) * 2.5 ).r;
    // the texture's fBm is narrow (mean about 0.55, spread about 0.08): standardise it
    float z = ( n1 * 0.65 + n2 * 0.35 - ${NOISE_MEAN} ) / ${NOISE_SPREAD};
    // the noise moves each cloud's edge in and out: ragged edges and holes, a dense middle
    float gas = smoothstep( 0.0, 0.5, min( field, 1.0 ) - 0.6 * uTurb + z * 0.5 * uTurb );
    // brighter filaments, darker lanes
    float glow = 0.5 + 0.5 * smoothstep( -1.5, 1.5, z );
    float s = clamp( gas * tint.a * edge( p ) * k * dt, 0.0, 1.0 );
    acc += ( 1.0 - alpha ) * tint.rgb * s * glow;
    alpha += ( 1.0 - alpha ) * s;
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
 * @param {{ clouds: { xyz: number[], radius: number, color: number, opacity: number }[] }} layout
 * @param {(i: number) => number[]} colorOf - a cloud's colour index to rgba
 * @returns {import('../objects/common.js').BuiltObject}
 */
export function buildNebulaVolume(cfg, ctx, layout, colorOf) {
  const node = new Group();
  node.name = `nebula:${cfg.id ?? ''}`;
  const ball = cfg.size === undefined;
  const half = ball ? (() => { const R = Math.max(1e-3, num(cfg.radius, 100)); return [R, R, R]; })() : regionBox(cfg.size).map((v) => v / 2);
  const clouds = layout.clouds.slice(0, MAX_CLOUDS);
  const meanRadius = clouds.length ? clouds.reduce((s, c) => s + c.radius, 0) / clouds.length : 1;
  // texture repeats per scene unit: noise_scale is noise cells per scene unit, as for the puffs
  const cellsPerUnit = cfg.noise_scale !== undefined ? Math.max(0, num(cfg.noise_scale, 0)) : CELLS_PER_RADIUS / meanRadius;
  const freq = cellsPerUnit / TEXTURE_CELLS;

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
    uClouds: { value: Array.from({ length: MAX_CLOUDS }, (_, i) => (clouds[i] ? new Vector4(clouds[i].xyz[0], clouds[i].xyz[1], clouds[i].xyz[2], clouds[i].radius) : new Vector4(0, 0, 0, 1))) },
    uTints: {
      value: Array.from({ length: MAX_CLOUDS }, (_, i) => {
        if (!clouds[i]) return new Vector4(0, 0, 0, 0);
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
