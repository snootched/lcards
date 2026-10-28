/**
 * `type: nebula`: clouds of gas in scene space. The background `nebula`
 * preset's look (seeded clouds, colours, opacities, the volumetric shader's
 * turbulent edge and wisps) lifted into 3D: each cloud is a few
 * camera-facing puffs at small depth offsets, so clouds shift against each
 * other and against the grids as the camera orbits, and a cloud keeps some
 * body seen from any side.
 *
 * One mesh for the whole nebula: every puff is a quad whose corners the
 * vertex shader turns to face the camera, so nothing is computed on the CPU
 * per frame. Puffs fade out as the camera comes close (flying through a
 * cloud does not fill the view with one flat sprite). Additive by default:
 * no depth sorting is needed, and a solid sphere (which writes depth) still
 * hides the clouds behind it.
 *
 * `drift` (scene units per second) slides the noise through the clouds;
 * still by default, so a still scene draws nothing.
 *
 * @module core/astrometrics/effects/nebula
 */
import { Group, Mesh, BufferGeometry, Float32BufferAttribute, Uint16BufferAttribute, ShaderMaterial, AdditiveBlending, NormalBlending, Vector2 } from 'three';
import { NOISE_GLSL, splitCoord } from '../../packs/backgrounds/webgl/scenes/noise-glsl.js';
import { seededRandom } from '../../packs/backgrounds/webgl/scenes/scene-helpers.js';
import { built, num, pair, DEFAULT_COLORS } from '../objects/common.js';

/** The `nebula` preset caps cloud_count at 10 */
export const MAX_CLOUDS = 10;
/** Puffs per cloud */
const PUFFS = [3, 5];
/** A puff fades out between these multiples of its radius from the camera */
const NEAR_FADE = [0.6, 1.6];
/** Noise cells across a cloud's radius when noise_scale is not set */
const CELLS_PER_RADIUS = 1.5;

/**
 * @typedef {Object} NebulaPuff
 * @property {number[]} xyz - local position
 * @property {number} radius
 * @property {number} cloud - index of its cloud (its colour)
 * @property {number} opacity - the cloud's opacity, shared out between its puffs
 * @property {[number, number]} stops - the preset's mid and outer gradient stops
 * @property {[number, number]} offset - where in the noise field it samples
 */

/**
 * The clouds and their puffs, from the config (pure, seeded: the same
 * config always gives the same nebula).
 * @param {any} cfg
 * @returns {{ clouds: { xyz: number[], radius: number, color: number, opacity: number }[], puffs: NebulaPuff[], extent: number }}
 */
export function nebulaLayout(cfg) {
  const rnd = seededRandom(num(cfg.seed, 1));
  const box = cfg.size !== undefined ? boxSize(cfg.size) : null;
  const R = box ? Math.max(...box) / 2 : Math.max(1e-3, num(cfg.radius, 100));
  const colorCount = Math.max(1, Array.isArray(cfg.colors) ? cfg.colors.length : 1);
  const [r0, r1] = [num(cfg.min_radius, R * 0.15), num(cfg.max_radius, R * 0.4)].map((v) => Math.max(1e-3, v)).sort((a, b) => a - b);
  const [o0, o1] = [num(cfg.min_opacity, 0.3), num(cfg.max_opacity, 0.8)].map((v) => Math.max(0, Math.min(1, v))).sort((a, b) => a - b);

  /** @type {{ xyz: number[], radius: number, color: number, opacity: number }[]} */
  let clouds;
  if (Array.isArray(cfg.clouds) && cfg.clouds.length) {
    clouds = cfg.clouds.filter((/** @type {any} */ c) => c && typeof c === 'object').slice(0, MAX_CLOUDS).map((/** @type {any} */ c, /** @type {number} */ i) => ({
      xyz: Array.isArray(c.xyz) ? [num(c.xyz[0], 0), num(c.xyz[1], 0), num(c.xyz[2], 0)] : [0, 0, 0],
      radius: Math.max(1e-3, num(c.radius, (r0 + r1) / 2)),
      color: c.color !== undefined ? -1 - i : i % colorCount,
      opacity: Math.max(0, Math.min(1, num(c.opacity, (o0 + o1) / 2)))
    }));
  } else {
    const n = Math.max(1, Math.min(MAX_CLOUDS, Math.round(num(cfg.cloud_count, 4))));
    clouds = [];
    for (let i = 0; i < n; i++) {
      const color = Math.floor(rnd() * colorCount) % colorCount;
      clouds.push({ xyz: inside(rnd, box, R), radius: r0 + rnd() * (r1 - r0), color, opacity: o0 + rnd() * (o1 - o0) });
    }
  }

  /** @type {NebulaPuff[]} */
  const puffs = [];
  let extent = 0;
  clouds.forEach((c, i) => {
    const k = PUFFS[0] + Math.floor(rnd() * (PUFFS[1] - PUFFS[0] + 1));
    // the preset's gradient stops: mid 60 to 90 %, outer 10 to 30 %
    const stops = /** @type {[number, number]} */ ([0.6 + rnd() * 0.3, 0.1 + rnd() * 0.2]);
    for (let j = 0; j < k; j++) {
      // the first puff is the cloud's core; the rest sit round it
      const spread = j === 0 ? 0 : c.radius * 0.45;
      const d = j === 0 ? [0, 0, 0] : inside(rnd, null, spread);
      const xyz = [c.xyz[0] + d[0], c.xyz[1] + d[1] * 0.6, c.xyz[2] + d[2]];
      const radius = c.radius * (j === 0 ? 1 : 0.55 + rnd() * 0.35);
      // puffs overlap in the middle: share the cloud's opacity so it stays about as bright as one
      puffs.push({ xyz, radius, cloud: i, opacity: c.opacity * (j === 0 ? 0.6 : 0.9 / (k - 1)), stops, offset: [rnd() * 97, rnd() * 97] });
      extent = Math.max(extent, Math.hypot(...xyz) + radius);
    }
  });
  return { clouds, puffs, extent };
}

/** @param {any} v @returns {[number, number, number]} */
function boxSize(v) {
  if (Array.isArray(v)) {
    const w = Math.max(1e-3, num(v[0], 200));
    return [w, Math.max(1e-3, num(v[1], w / 5)), Math.max(1e-3, num(v[2], w))];
  }
  const s = Math.max(1e-3, num(v, 200));
  return [s, s, s];
}

/**
 * A uniform random point in a box (`size`) or a ball of radius `R`.
 * @param {() => number} rnd
 * @param {number[] | null} box
 * @param {number} R
 */
function inside(rnd, box, R) {
  if (box) return [(rnd() - 0.5) * box[0], (rnd() - 0.5) * box[1], (rnd() - 0.5) * box[2]];
  const u = rnd() * 2 - 1;
  const th = rnd() * 2 * Math.PI;
  const q = Math.sqrt(1 - u * u);
  const r = R * Math.cbrt(rnd());
  return [r * q * Math.cos(th), r * u, r * q * Math.sin(th)];
}

/**
 * How much of a puff shows at a distance from the camera (0 close up, 1 far).
 * The vertex shader computes the same.
 * @param {number} distance
 * @param {number} radius
 */
export function nearFade(distance, radius) {
  const a = NEAR_FADE[0] * radius;
  const b = NEAR_FADE[1] * radius;
  const t = Math.max(0, Math.min(1, (distance - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/**
 * A drift offset in noise cells as the shader takes it: whole cells and the
 * rest, so float precision holds however far it has drifted.
 * @param {Vector2} cell
 * @param {Vector2} local
 * @param {number} x
 * @param {number} y
 */
export function driftUniforms(cell, local, x, y) {
  const [cx, lx] = splitCoord(x);
  const [cy, ly] = splitCoord(y);
  cell.set(cx, cy);
  local.set(lx, ly);
}

const VERT = /* glsl */ `
attribute vec2 corner;
attribute vec3 puff;
attribute vec4 tint;
attribute vec4 shape;
varying vec2 vUv;
varying vec4 vTint;
varying vec2 vStops;
varying vec2 vOffset;
void main() {
  float radius = puff.x;
  vec4 view = modelViewMatrix * vec4( position, 1.0 );
  // the camera's distance along its view direction (an orthographic camera too)
  float dist = -view.z;
  float t = clamp( ( dist - ${NEAR_FADE[0].toFixed(2)} * radius ) / ( ${(NEAR_FADE[1] - NEAR_FADE[0]).toFixed(2)} * radius ), 0.0, 1.0 );
  float fade = t * t * ( 3.0 - 2.0 * t );
  view.xy += corner * radius;
  vUv = corner;
  vTint = vec4( tint.rgb, tint.a * fade );
  vStops = shape.xy;
  vOffset = shape.zw;
  gl_Position = projectionMatrix * view;
  // a puff with nothing to show leaves the screen (no fill cost)
  if ( vTint.a <= 0.0 ) gl_Position = vec4( 2.0, 2.0, 2.0, 1.0 );
}`;

const FRAG = /* glsl */ `
precision highp float;
${NOISE_GLSL}
varying vec2 vUv;
varying vec4 vTint;
varying vec2 vStops;
varying vec2 vOffset;
uniform float uTurb;
uniform float uScale;
// drift, split into whole cells and the rest per field (a field's own multiple
// of the drift, so its coordinate never jumps when the rest wraps)
uniform ivec2 uWarpCell;
uniform vec2 uWarpLocal;
uniform ivec2 uWispCell;
uniform vec2 uWispLocal;
uniform float uOpacity;

// The preset's gradient: 1 at the middle, s.x at 0.4, s.y at 0.7, 0 at the edge
float profile( float r, vec2 s ) {
  if ( r < 0.4 ) return mix( 1.0, s.x, r / 0.4 );
  if ( r < 0.7 ) return mix( s.x, s.y, ( r - 0.4 ) / 0.3 );
  if ( r < 1.0 ) return mix( s.y, 0.0, ( r - 0.7 ) / 0.3 );
  return 0.0;
}

void main() {
  float r0 = length( vUv );
  if ( r0 >= 1.0 ) discard;
  vec2 q = vUv * uScale + vOffset;
  // edge turbulence, and wisps at a finer scale drifting the other way (the preset's shader)
  float warp = lcFbm( uWarpCell, q + uWarpLocal, 4 );
  float wisp = lcFbm( uWispCell, q * 3.0 + vec2( 17.3, -9.1 ) + uWispLocal, 5 );
  float tex = mix( 0.3, 1.35, smoothstep( -0.6, 0.9, wisp ) );
  float r = r0 + uTurb * 0.3 * warp;
  // the turbulence can pull the gradient inside the quad's edge: fade the rim so no circle shows
  float rim = 1.0 - smoothstep( 0.8, 1.0, r0 );
  float a = clamp( profile( r, vStops ) * tex, 0.0, 1.0 ) * rim * vTint.a * uOpacity;
  if ( a <= 0.002 ) discard;
  gl_FragColor = vec4( vTint.rgb, a );
}`;

/**
 * @param {any} cfg
 * @param {import('../objects/common.js').BuildContext} ctx
 * @returns {import('../objects/common.js').BuiltObject}
 */
export function buildNebula(cfg, ctx) {
  const node = new Group();
  node.name = `nebula:${cfg.id ?? ''}`;
  const { clouds, puffs, extent } = nebulaLayout(cfg);
  const list = Array.isArray(cfg.colors) && cfg.colors.length ? cfg.colors : [cfg.color];
  const palette = list.map((/** @type {any} */ c) => ctx.color(c, DEFAULT_COLORS.nebula));
  /** @param {number} i - a palette index, or -1 - n for cloud n's own colour */
  const colorOf = (i) => (i >= 0 ? palette[i % palette.length] : ctx.color(cfg.clouds[-1 - i].color, DEFAULT_COLORS.nebula));

  const n = puffs.length;
  const position = new Float32Array(n * 12);
  const corner = new Float32Array(n * 8);
  const puff = new Float32Array(n * 12);
  const tint = new Float32Array(n * 16);
  const shape = new Float32Array(n * 16);
  const index = new Uint16Array(n * 6);
  const CORNERS = [-1, -1, 1, -1, 1, 1, -1, 1];
  puffs.forEach((p, i) => {
    const c = colorOf(clouds[p.cloud].color);
    for (let v = 0; v < 4; v++) {
      const k = i * 4 + v;
      position.set(p.xyz, k * 3);
      corner.set([CORNERS[v * 2], CORNERS[v * 2 + 1]], k * 2);
      puff.set([p.radius, 0, 0], k * 3);
      tint.set([c[0], c[1], c[2], (c[3] ?? 1) * p.opacity], k * 4);
      shape.set([p.stops[0], p.stops[1], p.offset[0], p.offset[1]], k * 4);
    }
    index.set([0, 1, 2, 0, 2, 3].map((x) => x + i * 4), i * 6);
  });
  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(position, 3));
  geo.setAttribute('corner', new Float32BufferAttribute(corner, 2));
  geo.setAttribute('puff', new Float32BufferAttribute(puff, 3));
  geo.setAttribute('tint', new Float32BufferAttribute(tint, 4));
  geo.setAttribute('shape', new Float32BufferAttribute(shape, 4));
  geo.setIndex(new Uint16BufferAttribute(index, 1));
  // the quads grow in the vertex shader: bound them by their full size
  geo.computeBoundingSphere();
  if (geo.boundingSphere) geo.boundingSphere.radius = Math.max(geo.boundingSphere.radius, extent);

  const meanRadius = puffs.length ? puffs.reduce((s, p) => s + p.radius, 0) / puffs.length : 1;
  const scale = cfg.noise_scale !== undefined ? Math.max(0, num(cfg.noise_scale, 0)) * meanRadius : CELLS_PER_RADIUS;
  const additive = cfg.blend !== 'normal';
  const u = {
    uTurb: { value: Math.max(0, Math.min(1, num(cfg.turbulence, 0.5))) },
    uScale: { value: scale },
    uWarpCell: { value: new Vector2(0, 0) },
    uWarpLocal: { value: new Vector2(0, 0) },
    uWispCell: { value: new Vector2(0, 0) },
    uWispLocal: { value: new Vector2(0, 0) },
    uOpacity: { value: Math.max(0, num(cfg.opacity, 1)) }
  };
  const mat = new ShaderMaterial({
    uniforms: u,
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    blending: additive ? AdditiveBlending : NormalBlending
  });
  const mesh = new Mesh(geo, mat);
  // after the stars, before the grids' far sides
  mesh.renderOrder = 0.25;
  node.add(mesh);

  const out = built(cfg, node, { radius: extent });
  // noise cells per ms: `drift` scene units per second over the puffs' mean radius
  const rate = pair(cfg.drift, [0, 0]).map((d) => ((d / meanRadius) * scale) / 1000);
  if (rate[0] || rate[1]) {
    out.tick = (_dt, t) => {
      driftUniforms(u.uWarpCell.value, u.uWarpLocal.value, t * rate[0], t * rate[1]);
      // wisps: three times finer, drifting back at 1.7 times the speed
      driftUniforms(u.uWispCell.value, u.uWispLocal.value, -1.7 * t * rate[0], -1.7 * t * rate[1]);
      return true;
    };
  }
  return out;
}
