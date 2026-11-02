/**
 * `type: belt`: an asteroid belt, a band of low-poly rocks round the
 * object's centre (one InstancedMesh, one draw). The rocks are seeded:
 * spread across `radius: [inner, outer]` (densest in the middle of the band)
 * and `thickness` up and down, sized from `size: [min, max]` with many small
 * and few large ones, each stretched and turned its own way. `colors` (a
 * list) gives each rock one of them, picked by the seed (wins over `color`).
 *
 * Lit from the belt's centre (its star): the face toward the centre is
 * bright, the far face dark, so the belt reads as rocks round a sun without
 * any scene lights. `period` (seconds per turn at the inner edge) moves the
 * rocks round the centre, the outer ones slower (Kepler: period grows with
 * radius^1.5); `tumble` turns each rock on its own axis. Both are per-frame
 * instance updates and hold still under reduced motion.
 *
 * Following an entity, `radius` (or either side), `thickness` and `count`
 * change in place and ease (`live`): each rock keeps its seeded place across
 * and up the band, so the band widens or thins round the same rocks; a
 * `count` binding builds for the most it can reach and draws the first n.
 *
 * Far away the rocks become dots (no key): when the largest rock would be
 * under about 1.5 px on screen (`DOT_PX`, measured from the camera to the
 * band itself), one point per rock in the same place and shade takes over,
 * and only the points move. The switch has a little slack so it does not
 * flicker at the edge.
 *
 * @module core/astrometrics/objects/belt
 */
import {
  Group, InstancedMesh, IcosahedronGeometry, ShaderMaterial, Matrix4, Quaternion, Vector3, Color, InstancedBufferAttribute,
  SRGBColorSpace, BufferGeometry, BufferAttribute, Points
} from 'three';
import { seededRandom } from '../../packs/backgrounds/webgl/scenes/scene-helpers.js';
import { built, num, pair } from './common.js';
import { MAX_ROCKS } from '../names.js';

export { MAX_ROCKS };
const DEG = Math.PI / 180;
const DEFAULT_COLOR = 'var(--lcards-gray-light)';

const VERT = /* glsl */ `
attribute float aShade;
attribute vec3 aTint;
varying vec3 vNormal;
varying vec3 vToCentre;
varying float vShade;
varying vec3 vTint;
// In view space, not world space: modelViewMatrix is built in doubles on the CPU,
// so a belt far from the origin (true scale) stays steady in float32
void main() {
  vec4 view = modelViewMatrix * instanceMatrix * vec4( position, 1.0 );
  vNormal = normalize( mat3( modelViewMatrix ) * mat3( instanceMatrix ) * normal );
  // the light: the belt's centre (its star)
  vToCentre = ( modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 ) ).xyz - view.xyz;
  vShade = aShade;
  vTint = aTint;
  gl_Position = projectionMatrix * view;
}`;

const FRAG = /* glsl */ `
uniform float uOpacity;
varying vec3 vNormal;
varying vec3 vToCentre;
varying float vShade;
varying vec3 vTint;
void main() {
  float lit = max( dot( normalize( vNormal ), normalize( vToCentre ) ), 0.0 );
  vec3 c = vTint * vShade * ( 0.3 + 0.7 * lit );
  gl_FragColor = vec4( c, uOpacity );
}`;

const DOT_VERT = /* glsl */ `
attribute float aShade;
attribute vec3 aTint;
attribute float aSize;
uniform float uPxPerUnit;
uniform float uOrtho;
uniform float uDpr;
varying float vShade;
varying vec3 vTint;
varying float vCover;
varying float vPhase;
void main() {
  vShade = aShade;
  vTint = aTint;
  // how much of the rock's lit side faces the camera, as a moon's phase (view space: the camera at 0)
  vec4 mv = modelViewMatrix * vec4( position, 1.0 );
  vec3 toCentre = normalize( ( modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 ) ).xyz - mv.xyz );
  vPhase = 0.5 + 0.5 * dot( toCentre, normalize( -mv.xyz ) );
  // the rock's size on screen, device px: under one px it covers part of one
  float px = aSize * ( uOrtho > 0.0 ? uOrtho : uPxPerUnit / max( -mv.z, 1e-6 ) ) * uDpr;
  gl_PointSize = max( px, 1.0 );
  vCover = clamp( px * px, 0.0, 1.0 );
  gl_Position = projectionMatrix * mv;
}`;

const DOT_FRAG = /* glsl */ `
uniform float uOpacity;
varying float vShade;
varying vec3 vTint;
varying float vCover;
varying float vPhase;
void main() {
  // a rock's average light as seen from here (the rocks' 0.3 base, 0.7 lit)
  gl_FragColor = vec4( vTint * vShade * ( 0.3 + 0.45 * vPhase ), uOpacity * vCover );
}`;

/** Rocks become dots when the largest would be smaller than this on screen, CSS px */
export const DOT_PX = 1.5;

/**
 * How many CSS px a size in scene units covers at a distance.
 * @param {import('three').Camera} camera
 * @param {number} size
 * @param {number} dist
 * @param {number} height - the view's height, CSS px
 */
export function pixelSize(camera, size, dist, height) {
  const cam = /** @type {any} */ (camera);
  if (cam.isOrthographicCamera) return (size * height * cam.zoom) / Math.max(1e-9, cam.top - cam.bottom);
  return (size * height) / Math.max(1e-9, 2 * Math.max(dist, 1e-6) * Math.tan((cam.fov * Math.PI) / 360));
}

/**
 * Distance from a position local to the belt to its band (a ring of
 * rectangular section, inner to outer and thickness high); 0 inside it.
 * @param {Vector3} local
 * @param {number} inner
 * @param {number} outer
 * @param {number} thickness
 */
export function bandDistance(local, inner, outer, thickness) {
  const rho = Math.hypot(local.x, local.z);
  const dr = Math.max(0, inner - rho, rho - outer);
  const dy = Math.max(0, Math.abs(local.y) - thickness / 2);
  return Math.hypot(dr, dy);
}

/**
 * Dots now? With slack round DOT_PX: stays as it is between 0.9 and 1.1 of it.
 * @param {boolean} dots - dots last frame
 * @param {number} px - the largest rock's size on screen
 */
export function useDots(dots, px) {
  return dots ? px < DOT_PX * 1.1 : px < DOT_PX * 0.9;
}

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
 * the same belt). `rocks` holds as many as the belt is built for (`count`,
 * or `_most.count` when a binding can raise it), `count` how many draw.
 * Each rock's `u` (0 inner edge, 1 outer) and `g` (-1 to 1, bottom to top)
 * place it in the band whatever its edges (`r` and `y` are those now).
 * @returns {{ inner: number, outer: number, thickness: number, largest: number, count: number, rocks: { r: number, u: number, angle: number, y: number, g: number, scale: number[], axis: number[], phase: number, tumble: number, shade: number }[] }}
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
  const most = Math.max(count, Math.min(MAX_ROCKS, Math.round(num(cfg._most?.count, 0))));
  const tumble = num(cfg.tumble, 30);
  const rocks = [];
  for (let i = 0; i < most; i++) {
    // densest across the middle of the band (a triangle distribution)
    const u = (rnd() + rnd()) / 2;
    // height: roughly normal, most rocks near the plane
    const g = (rnd() + rnd() + rnd() - 1.5) / 1.5;
    const s = lo + (hi - lo) * Math.pow(rnd(), 3);
    const ax = [rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1];
    const len = Math.hypot(ax[0], ax[1], ax[2]) || 1;
    rocks.push({
      r: inner + (outer - inner) * u,
      u,
      angle: rnd() * 360,
      y: g * (thickness / 2),
      g,
      scale: [s * (0.7 + rnd() * 0.6), s * (0.55 + rnd() * 0.4), s * (0.7 + rnd() * 0.6)],
      axis: ax.map((v) => v / len),
      phase: rnd() * 360,
      tumble: tumble * (0.4 + rnd() * 1.2),
      shade: 0.65 + rnd() * 0.45
    });
  }
  // a rock is about twice its scale across; the largest are stretched up to 1.3
  return { inner, outer, thickness, largest: hi * 2.6, count, rocks };
}

/**
 * Which of the belt's colours each rock takes: an index into `colors`, by
 * its own seeded stream (so the layout stays as it was without colours).
 * @param {number} count
 * @param {number} n - how many colours
 * @param {any} seed
 * @returns {number[]}
 */
export function rockColorIndex(count, n, seed) {
  if (n <= 1) return new Array(count).fill(0);
  const rnd = seededRandom(num(seed, 1) + 13);
  return Array.from({ length: count }, () => Math.floor(rnd() * n) % n);
}

/**
 * @param {any} cfg
 * @param {import('./common.js').BuildContext} ctx
 * @returns {import('./common.js').BuiltObject}
 */
export function buildBelt(cfg, ctx) {
  const node = new Group();
  node.name = `belt:${cfg.id ?? ''}`;
  const layout = beltLayout(cfg);
  const { largest, rocks } = layout;
  // the band's edges and how many draw now: live settings change them (see live below)
  let { inner, outer, thickness, count: drawn } = layout;
  const out = built(cfg, node, { radius: outer });
  if (!rocks.length) return out;

  const geo = rockGeometry(seededRandom(num(cfg.seed, 1) + 7));
  const shade = new Float32Array(rocks.length);
  rocks.forEach((k, i) => { shade[i] = k.shade; });
  // per-instance attribute on the shared rock geometry
  geo.setAttribute('aShade', new InstancedBufferAttribute(shade, 1));
  // one colour, or one of `colors` per rock (linear, as the shader works)
  const list = Array.isArray(cfg.colors) && cfg.colors.length ? cfg.colors : [cfg.color];
  const cols = list.map((/** @type {any} */ v) => ctx.color(v, DEFAULT_COLOR));
  const linear = cols.map((c) => new Color().setRGB(c[0], c[1], c[2], SRGBColorSpace));
  const pick = rockColorIndex(rocks.length, linear.length, cfg.seed);
  const tint = new Float32Array(rocks.length * 3);
  pick.forEach((k, i) => { tint[i * 3] = linear[k].r; tint[i * 3 + 1] = linear[k].g; tint[i * 3 + 2] = linear[k].b; });
  geo.setAttribute('aTint', new InstancedBufferAttribute(tint, 3));
  // a colour's own alpha: the first one's (they fade the belt as a whole)
  const opacity = num(cfg.opacity, 1) * (cols[0][3] ?? 1);
  const mat = new ShaderMaterial({
    uniforms: { uOpacity: { value: opacity } },
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: opacity < 1,
    depthWrite: opacity >= 1
  });
  const mesh = new InstancedMesh(geo, mat, rocks.length);
  mesh.name = 'rocks';

  // Far away: one dot per rock
  const dotPos = new Float32Array(rocks.length * 3);
  const dotGeo = new BufferGeometry();
  dotGeo.setAttribute('position', new BufferAttribute(dotPos, 3));
  dotGeo.setAttribute('aShade', new BufferAttribute(shade.slice(), 1));
  dotGeo.setAttribute('aTint', new BufferAttribute(tint.slice(), 3));
  dotGeo.setAttribute('aSize', new BufferAttribute(Float32Array.from(rocks, (k) => (2 * (k.scale[0] + k.scale[1] + k.scale[2])) / 3), 1));
  const dotMat = new ShaderMaterial({
    uniforms: {
      uOpacity: { value: opacity },
      uPxPerUnit: { value: 1 },
      uOrtho: { value: 0 },
      uDpr: { value: 1 }
    },
    vertexShader: DOT_VERT,
    fragmentShader: DOT_FRAG,
    // part-covered pixels blend
    transparent: true,
    depthWrite: false
  });
  const dotCloud = new Points(dotGeo, dotMat);
  dotCloud.name = 'dots';
  dotCloud.visible = false;
  let dots = false;
  let clock = 0;

  const m = new Matrix4();
  const q = new Quaternion();
  const turn = new Quaternion();
  const p = new Vector3();
  const s = new Vector3();
  const axis = new Vector3();
  const Y = new Vector3(0, 1, 0);
  /** @param {number} t - the scene clock, ms */
  const place = (t) => {
    clock = t;
    const period = num(cfg.period, 0);
    for (let i = 0; i < drawn; i++) {
      const k = rocks[i];
      k.r = inner + (outer - inner) * k.u;
      k.y = k.g * (thickness / 2);
      // Kepler: the outer rocks take longer round (period ~ r^1.5)
      const orbit = period > 0 ? (360 * t) / 1000 / (period * Math.pow(k.r / Math.max(1e-3, inner > 0 ? inner : k.r), 1.5)) : 0;
      // clockwise seen from above (as a positive spin), from north
      const a = (k.angle + orbit) * DEG;
      p.set(k.r * Math.sin(a), k.y, -k.r * Math.cos(a));
      if (dots) {
        dotPos[i * 3] = p.x;
        dotPos[i * 3 + 1] = p.y;
        dotPos[i * 3 + 2] = p.z;
        continue;
      }
      axis.set(k.axis[0], k.axis[1], k.axis[2]);
      q.setFromAxisAngle(axis, (k.phase + (k.tumble * t) / 1000) * DEG);
      turn.setFromAxisAngle(Y, -a);
      q.premultiply(turn);
      s.set(k.scale[0], k.scale[1], k.scale[2]);
      m.compose(p, q, s);
      mesh.setMatrixAt(i, m);
    }
    if (dots) dotGeo.attributes.position.needsUpdate = true;
    else mesh.instanceMatrix.needsUpdate = true;
  };
  /** The rocks stay in their band as they move: one bound for every frame (again when the band changes) */
  const bound = () => {
    mesh.computeBoundingSphere();
    dotGeo.boundingSphere = /** @type {import('three').Sphere} */ (mesh.boundingSphere).clone();
  };
  /** @param {number} n */
  const setDrawn = (n) => {
    drawn = n;
    mesh.count = n;
    dotGeo.setDrawRange(0, n);
  };
  setDrawn(drawn);
  place(0);
  bound();
  node.add(mesh, dotCloud);
  const local = new Vector3();
  out.lod = ({ camera, height, dpr }) => {
    local.copy(camera.position);
    node.worldToLocal(local);
    const next = useDots(dots, pixelSize(camera, largest, bandDistance(local, inner, outer, thickness), height));
    const cam = /** @type {any} */ (camera);
    // rock sizes are the belt's own units; px per world unit times world units per own unit (a system's frame)
    const k = node.matrixWorld.getMaxScaleOnAxis();
    dotMat.uniforms.uDpr.value = dpr;
    dotMat.uniforms.uOrtho.value = cam.isOrthographicCamera ? pixelSize(camera, k, 1, height) : 0;
    dotMat.uniforms.uPxPerUnit.value = cam.isOrthographicCamera ? 0 : pixelSize(camera, k, 1, height);
    if (next === dots) return;
    dots = next;
    mesh.visible = !dots;
    dotCloud.visible = dots;
    // the one now shown catches up with the motion
    place(clock);
  };
  // radius: [a, b] as built, each side live on its own
  const builtSides = Array.isArray(cfg.radius) ? pair(cfg.radius, [80, 100]) : [layout.inner, layout.outer];
  const sides = [...builtSides];
  // a live setting (null: the built value again); the next frame draws it, now when the rocks stand still
  out.live = (key, value) => {
    const v = value === null ? null : Math.max(0, value);
    if (key === 'radius') {
      // one number is the outer edge, the inner 0.8 of it (as built)
      outer = v ?? layout.outer;
      inner = v === null ? layout.inner : v * 0.8;
    } else if (key === 'radius.0' || key === 'radius.1') {
      // a side each; whichever is smaller is the inner edge
      const i = key === 'radius.0' ? 0 : 1;
      sides[i] = v ?? builtSides[i];
      inner = Math.min(sides[0], sides[1]);
      outer = Math.max(sides[0], sides[1]);
    } else if (key === 'thickness') thickness = v ?? layout.thickness;
    else if (key === 'count') setDrawn(Math.min(rocks.length, Math.round(v ?? layout.count)));
    else return false;
    out.radius = outer;
    place(clock);
    // the bound covers the drawn rocks only (three.js counts mesh.count)
    bound();
    return true;
  };
  out.pickMeshes.push(mesh);
  const moving = num(cfg.period, 0) > 0 || rocks.some((k) => k.tumble !== 0);
  out.tick = moving ? (/** @type {number} */ _dt, /** @type {number} */ t) => { place(t); return true; } : null;
  return out;
}
