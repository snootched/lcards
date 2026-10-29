/**
 * `type: belt`: an asteroid belt, a band of low-poly rocks round the
 * object's centre (one InstancedMesh, one draw). The rocks are seeded:
 * spread across `radius: [inner, outer]` (densest in the middle of the band)
 * and `thickness` up and down, sized from `size: [min, max]` with many small
 * and few large ones, each stretched and turned its own way.
 *
 * Lit from the belt's centre (its star): the face toward the centre is
 * bright, the far face dark, so the belt reads as rocks round a sun without
 * any scene lights. `period` (seconds per turn at the inner edge) moves the
 * rocks round the centre, the outer ones slower (Kepler: period grows with
 * radius^1.5); `tumble` turns each rock on its own axis. Both are per-frame
 * instance updates and hold still under reduced motion.
 *
 * @module core/astrometrics/objects/belt
 */
import {
  Group, InstancedMesh, IcosahedronGeometry, ShaderMaterial, Matrix4, Quaternion, Vector3, Color, InstancedBufferAttribute,
  SRGBColorSpace
} from 'three';
import { seededRandom } from '../../packs/backgrounds/webgl/scenes/scene-helpers.js';
import { built, num, pair } from './common.js';

/** Most rocks one belt draws */
export const MAX_ROCKS = 5000;
const DEG = Math.PI / 180;
const DEFAULT_COLOR = 'var(--lcards-gray-light)';

const VERT = /* glsl */ `
attribute float aShade;
varying vec3 vNormal;
varying vec3 vToCentre;
varying float vShade;
void main() {
  vec4 local = instanceMatrix * vec4( position, 1.0 );
  vec4 world = modelMatrix * local;
  vNormal = normalize( mat3( modelMatrix ) * mat3( instanceMatrix ) * normal );
  // the light: the belt's centre (its star)
  vToCentre = ( modelMatrix * vec4( 0.0, 0.0, 0.0, 1.0 ) ).xyz - world.xyz;
  vShade = aShade;
  gl_Position = projectionMatrix * viewMatrix * world;
}`;

const FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
varying vec3 vNormal;
varying vec3 vToCentre;
varying float vShade;
void main() {
  float lit = max( dot( normalize( vNormal ), normalize( vToCentre ) ), 0.0 );
  vec3 c = uColor * vShade * ( 0.3 + 0.7 * lit );
  gl_FragColor = vec4( c, uOpacity );
}`;

/**
 * A rough rock: an icosahedron with its corners pushed in and out, split
 * into flat faces (each face its own normal, so it looks faceted).
 * @param {() => number} rnd
 */
export function rockGeometry(rnd) {
  const base = new IcosahedronGeometry(1, 1);
  const pos = base.getAttribute('position');
  // the same corner moves the same way on every face it belongs to
  /** @type {Map<string, number>} */
  const pushes = new Map();
  for (let i = 0; i < pos.count; i++) {
    const key = `${pos.getX(i).toFixed(4)},${pos.getY(i).toFixed(4)},${pos.getZ(i).toFixed(4)}`;
    if (!pushes.has(key)) pushes.set(key, 0.72 + rnd() * 0.5);
    const k = /** @type {number} */ (pushes.get(key));
    pos.setXYZ(i, pos.getX(i) * k, pos.getY(i) * k, pos.getZ(i) * k);
  }
  const geo = base.index ? base.toNonIndexed() : base;
  geo.computeVertexNormals();
  return geo;
}

/**
 * The rocks' places, sizes and spins (pure, seeded: the same config gives
 * the same belt).
 * @param {any} cfg
 * @returns {{ inner: number, outer: number, rocks: { r: number, angle: number, y: number, scale: number[], axis: number[], phase: number, tumble: number, shade: number }[] }}
 */
export function beltLayout(cfg) {
  const rnd = seededRandom(num(cfg.seed, 1));
  const [rawA, rawB] = Array.isArray(cfg.radius) ? pair(cfg.radius, [80, 100]) : [num(cfg.radius, 100) * 0.8, num(cfg.radius, 100)];
  const inner = Math.max(0, Math.min(rawA, rawB));
  const outer = Math.max(inner, rawA, rawB);
  const thickness = Math.max(0, num(cfg.thickness, (outer - inner) * 0.15));
  const [minS, maxS] = Array.isArray(cfg.size) ? pair(cfg.size, [0.4, 1.6]) : [num(cfg.size, 1.6) * 0.25, num(cfg.size, 1.6)];
  const lo = Math.max(1e-3, Math.min(minS, maxS));
  const hi = Math.max(lo, minS, maxS);
  const count = Math.max(0, Math.min(MAX_ROCKS, Math.round(num(cfg.count, 600))));
  const tumble = num(cfg.tumble, 30);
  const rocks = [];
  for (let i = 0; i < count; i++) {
    // densest across the middle of the band (a triangle distribution)
    const r = inner + (outer - inner) * ((rnd() + rnd()) / 2);
    // height: roughly normal, most rocks near the plane
    const g = (rnd() + rnd() + rnd() - 1.5) / 1.5;
    const s = lo + (hi - lo) * Math.pow(rnd(), 3);
    const ax = [rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1];
    const len = Math.hypot(ax[0], ax[1], ax[2]) || 1;
    rocks.push({
      r,
      angle: rnd() * 360,
      y: g * (thickness / 2),
      scale: [s * (0.7 + rnd() * 0.6), s * (0.55 + rnd() * 0.4), s * (0.7 + rnd() * 0.6)],
      axis: ax.map((v) => v / len),
      phase: rnd() * 360,
      tumble: tumble * (0.4 + rnd() * 1.2),
      shade: 0.65 + rnd() * 0.45
    });
  }
  return { inner, outer, rocks };
}

/**
 * @param {any} cfg
 * @param {import('./common.js').BuildContext} ctx
 * @returns {import('./common.js').BuiltObject}
 */
export function buildBelt(cfg, ctx) {
  const node = new Group();
  node.name = `belt:${cfg.id ?? ''}`;
  const { inner, outer, rocks } = beltLayout(cfg);
  const out = built(cfg, node, { radius: outer });
  if (!rocks.length) return out;

  const geo = rockGeometry(seededRandom(num(cfg.seed, 1) + 7));
  const shade = new Float32Array(rocks.length);
  rocks.forEach((k, i) => { shade[i] = k.shade; });
  // per-instance attribute on the shared rock geometry
  geo.setAttribute('aShade', new InstancedBufferAttribute(shade, 1));
  const c = ctx.color(cfg.color, DEFAULT_COLOR);
  const opacity = num(cfg.opacity, 1) * (c[3] ?? 1);
  const color = new Color().setRGB(c[0], c[1], c[2], SRGBColorSpace);
  const mat = new ShaderMaterial({
    uniforms: { uColor: { value: new Vector3(color.r, color.g, color.b) }, uOpacity: { value: opacity } },
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: opacity < 1,
    depthWrite: opacity >= 1
  });
  const mesh = new InstancedMesh(geo, mat, rocks.length);
  mesh.name = 'rocks';

  const m = new Matrix4();
  const q = new Quaternion();
  const turn = new Quaternion();
  const p = new Vector3();
  const s = new Vector3();
  const axis = new Vector3();
  const Y = new Vector3(0, 1, 0);
  /** @param {number} t - the scene clock, ms */
  const place = (t) => {
    const period = num(cfg.period, 0);
    for (let i = 0; i < rocks.length; i++) {
      const k = rocks[i];
      // Kepler: the outer rocks take longer round (period ~ r^1.5)
      const orbit = period > 0 ? (360 * t) / 1000 / (period * Math.pow(k.r / Math.max(1e-3, inner > 0 ? inner : k.r), 1.5)) : 0;
      // clockwise seen from above (as a positive spin), from north
      const a = (k.angle + orbit) * DEG;
      p.set(k.r * Math.sin(a), k.y, -k.r * Math.cos(a));
      axis.set(k.axis[0], k.axis[1], k.axis[2]);
      q.setFromAxisAngle(axis, (k.phase + (k.tumble * t) / 1000) * DEG);
      turn.setFromAxisAngle(Y, -a);
      q.premultiply(turn);
      s.set(k.scale[0], k.scale[1], k.scale[2]);
      m.compose(p, q, s);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  };
  place(0);
  // the rocks stay in their band as they move: one bound for every frame
  mesh.computeBoundingSphere();
  node.add(mesh);
  out.pickMeshes.push(mesh);
  const moving = num(cfg.period, 0) > 0 || rocks.some((k) => k.tumble !== 0);
  out.tick = moving ? (/** @type {number} */ _dt, /** @type {number} */ t) => { place(t); return true; } : null;
  return out;
}
