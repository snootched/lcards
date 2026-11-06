/**
 * `type: crystalline`: the Crystalline Entity (TNG "Datalore", "Silicon
 * Avatar"), made in code and seeded. A straight faceted spine along the
 * object's y axis, a bright starburst core at its middle, and branches in
 * tiers round the spine that fork again and again (`branches` levels),
 * thinning to thorns, all inside a spindle (an ellipsoid `size` tall and
 * 0.8 of that across). Glassy and translucent: it glows from inside (lit by
 * the core), with bright edges; drawn additively, so it needs no light.
 *
 * `size` defaults to 3 km in the frame's named units (no canon figure: the
 * production design was two or three Enterprise-D lengths, and on screen it
 * dwarfs the 642 m ship), or 3000 scene units when the frame has none.
 *
 * Level of detail: far away (under about 10 px tall) one dot in the core colour;
 * then the spine and the first fork levels; close up every level.
 *
 * @module core/astrometrics/objects/crystalline
 */
import {
  Group, Mesh, BufferGeometry, Float32BufferAttribute, ShaderMaterial, AdditiveBlending, NormalBlending, Vector3, Color,
  SRGBColorSpace, Points, InstancedBufferGeometry, Uint16BufferAttribute
} from 'three';
import { seededRandom } from '../../packs/backgrounds/webgl/scenes/scene-helpers.js';
import { built, num, sub } from './common.js';
import { pixelSize } from './belt.js';

const DEG = Math.PI / 180;
/** Default height along the spine, km */
export const ENTITY_KM = 3;
/** Width across as a share of the height */
const WIDTH = 0.8;
/** Under this many px tall it draws as a dot */
export const DOT_TALL = 10;
/** Most fork levels */
export const MAX_LEVELS = 5;

export const DEFAULT_CRYSTAL_COLOR = 'var(--lcards-blue-medium)';
export const DEFAULT_CORE_COLOR = 'var(--lcards-moonlight)';

/**
 * @typedef {Object} Shard
 * @property {number[]} a - base, local
 * @property {number[]} b - tip, local
 * @property {number} r0 - base half-width
 * @property {number} r1 - tip half-width (0: a point)
 * @property {number} level - 0 the spine, 1 a main branch, 2+ its forks
 * @property {number} roll - turn of the blade about its length, radians
 */

/**
 * The entity's size and settings (pure).
 * @param {any} cfg
 * @param {number | null} [kmPerUnit] - the frame's named units, km each
 */
export function crystallineModel(cfg, kmPerUnit = null) {
  const def = kmPerUnit ? ENTITY_KM / kmPerUnit : ENTITY_KM * 1000;
  // any size above 0 (3 km in au is 2e-8): a floor would make it too big
  const given = num(cfg.size, def);
  const H = given > 0 ? given : def;
  return {
    H,
    W: H * WIDTH,
    levels: Math.max(1, Math.min(MAX_LEVELS, Math.round(num(cfg.branches, 4)))),
    seed: num(cfg.seed, 7)
  };
}

/**
 * Half-width of the spindle at height y (0 beyond its ends).
 * @param {{ H: number, W: number }} m
 * @param {number} y
 */
export function envelope(m, y) {
  const u = (2 * y) / m.H;
  return u * u >= 1 ? 0 : (m.W / 2) * Math.sqrt(1 - u * u);
}

/**
 * Every shard of the entity, the spine first, then level by level (so a
 * draw range over the start is a lower level of detail). Pure and seeded.
 * @param {ReturnType<typeof crystallineModel>} m
 * @returns {{ shards: Shard[], levelEnds: number[] }} levelEnds[l]: shards up to and including level l
 */
export function crystallineShards(m) {
  const rnd = seededRandom(m.seed + 17);
  const { H } = m;
  /** @type {Shard[][]} */
  const byLevel = Array.from({ length: m.levels + 1 }, () => []);
  const spineR = H * 0.016;
  // the spine: a long prism with pointed ends, split in three so the middle is thickest
  byLevel[0].push({ a: [0, -H / 2, 0], b: [0, -H * 0.15, 0], r0: 0, r1: spineR, level: 0, roll: 0 });
  byLevel[0].push({ a: [0, -H * 0.15, 0], b: [0, H * 0.15, 0], r0: spineR, r1: spineR, level: 0, roll: 0 });
  byLevel[0].push({ a: [0, H * 0.15, 0], b: [0, H / 2, 0], r0: spineR, r1: 0, level: 0, roll: 0 });

  // the core: a burst of crystal spikes out of the spine's middle
  for (let i = 0; i < 48; i++) {
    const z = rnd() * 2 - 1;
    const az = rnd() * 2 * Math.PI;
    const q = Math.sqrt(1 - z * z);
    const len = H * (0.03 + Math.pow(rnd(), 2) * 0.12);
    byLevel[0].push({ a: [0, 0, 0], b: [q * Math.cos(az) * len, z * len, q * Math.sin(az) * len], r0: H * (0.004 + rnd() * 0.006), r1: 0, level: 0, roll: rnd() * Math.PI });
  }

  const tiers = 7;
  const around = 5;
  const v = new Vector3();
  const d = new Vector3();
  const side = new Vector3();
  const up = new Vector3(0, 1, 0);
  const deepest = m.levels;
  /** A shard's blade half-width: at least a share of its length (short thorns stay stubby) */
  const blade = (/** @type {number} */ r, /** @type {number} */ len) => Math.max(r, len * 0.09);
  /**
   * Short thorns along a segment, to the deepest level (they show close up).
   * @param {Vector3} a
   * @param {Vector3} dir
   * @param {number} segL
   */
  const thorns = (a, dir, segL) => {
    const n = 1 + (rnd() < 0.5 ? 1 : 0);
    for (let k = 0; k < n; k++) {
      side.copy(dir).cross(Math.abs(dir.y) > 0.9 ? new Vector3(1, 0, 0) : up).normalize();
      side.applyAxisAngle(dir, rnd() * 2 * Math.PI);
      const ang = (40 + rnd() * 30) * DEG;
      d.copy(dir).multiplyScalar(Math.cos(ang)).addScaledVector(side, Math.sin(ang)).normalize();
      const at = a.clone().addScaledVector(dir, segL * (0.2 + rnd() * 0.6));
      const len = segL * (0.18 + rnd() * 0.22);
      byLevel[deepest].push({ a: at.toArray(), b: at.clone().addScaledVector(d, len).toArray(), r0: len * 0.09, r1: 0, level: deepest, roll: rnd() * Math.PI });
    }
  };
  /**
   * A branch from p along unit dir, then its forks.
   * @param {Vector3} p
   * @param {Vector3} dir
   * @param {number} len
   * @param {number} r
   * @param {number} level
   */
  const grow = (p, dir, len, r, level) => {
    // clip to the spindle: shorten until the tip is inside
    let L = len;
    for (let k = 0; k < 6; k++) {
      v.copy(dir).multiplyScalar(L).add(p);
      if (Math.hypot(v.x, v.z) <= envelope(m, v.y) * 1.02) break;
      L *= 0.8;
    }
    if (L < len * 0.3 && level > 1) return;
    const leaf = level >= deepest;
    // a branch is a run of short segments, bending a little at each joint, a fork pair at every joint
    const segs = leaf ? 1 : level === 1 ? 5 : level === 2 ? 3 : 2;
    const segL = L / segs;
    const childLen = L * (level === 1 ? 0.26 : level === 2 ? 0.4 : 0.52);
    const cur = p.clone();
    const curDir = dir.clone();
    let rr = blade(r, segL * 0.5);
    /** A pair of forks off a joint, in a plane turned at random */
    const pair = (/** @type {Vector3} */ at, /** @type {Vector3} */ along, /** @type {number} */ k, /** @type {number} */ cr) => {
      if (level === 1) {
        // off a main branch the forks stay near its upright plane (the tree seen side on)
        side.copy(up).addScaledVector(along, -along.dot(up)).normalize();
        side.applyAxisAngle(along, (rnd() - 0.5) * 0.7);
      } else {
        side.copy(along).cross(Math.abs(along.y) > 0.9 ? new Vector3(1, 0, 0) : up).normalize();
        side.applyAxisAngle(along, rnd() * Math.PI);
      }
      for (const sgn of [1, -1]) {
        if (rnd() < (level === 1 ? 0.1 : 0.3)) continue;
        const ang = (38 + rnd() * 24) * DEG;
        d.copy(along).multiplyScalar(Math.cos(ang)).addScaledVector(side, sgn * Math.sin(ang)).normalize();
        grow(at.clone(), d.clone(), childLen * k * (0.8 + rnd() * 0.4), cr, level + 1);
      }
    };
    for (let i = 0; i < segs; i++) {
      if (i > 0) {
        side.copy(curDir).cross(up).normalize();
        if (side.lengthSq() < 1e-6) side.set(1, 0, 0);
        side.applyAxisAngle(curDir, rnd() * 2 * Math.PI);
        curDir.applyAxisAngle(side, (4 + rnd() * 7) * DEG).normalize();
      }
      const start = cur.clone();
      const end = cur.clone().addScaledVector(curDir, segL);
      const last = i === segs - 1;
      const rEnd = leaf ? 0 : rr * 0.8;
      byLevel[level].push({ a: start.toArray(), b: end.toArray(), r0: rr, r1: rEnd, level, roll: rnd() * Math.PI });
      if (!leaf) {
        if (!last) pair(end, curDir, 1 - (i / segs) * 0.4, Math.max(rEnd * 0.75, childLen * 0.04));
        else if (segs === 1) pair(start.clone().addScaledVector(curDir, segL * 0.5), curDir, 0.8, Math.max(rr * 0.6, childLen * 0.04));
        if (level >= 2 && deepest > level + 1) thorns(start, curDir, segL);
      }
      cur.copy(end);
      rr = rEnd;
    }
    if (leaf) return;
    // the tip forks into a Y (now and then three ways): chevrons
    const forks = 2 + (rnd() < 0.2 ? 1 : 0);
    side.copy(curDir).cross(Math.abs(curDir.y) > 0.9 ? new Vector3(1, 0, 0) : up).normalize();
    const turn = rnd() * Math.PI;
    for (let f = 0; f < forks; f++) {
      const ang = (26 + rnd() * 20) * DEG;
      d.copy(side).applyAxisAngle(curDir, turn + (f / forks) * 2 * Math.PI);
      d.multiplyScalar(Math.sin(ang)).addScaledVector(curDir, Math.cos(ang)).normalize();
      grow(cur.clone().addScaledVector(curDir, -segL * 0.05), d.clone(), childLen * 0.75, Math.max(rr * 1.1, childLen * 0.04), level + 1);
    }
  };
  for (let t = 0; t < tiers; t++) {
    // tiers over the middle 80 % of the spine
    const u = -0.8 + (1.6 * (t + 0.5)) / tiers + (rnd() - 0.5) * 0.06;
    const y = (u * H) / 2;
    const reach = envelope(m, y);
    const start = rnd() * 2 * Math.PI;
    const n = around - (Math.abs(u) > 0.6 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      const az = start + (i / n) * 2 * Math.PI + (rnd() - 0.5) * 0.35;
      // up and out, the upper half a little more up, the lower half a little more down
      const el = (18 + u * 22 + (rnd() - 0.5) * 14) * DEG;
      const dir = new Vector3(Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el));
      grow(new Vector3(0, y, 0), dir, reach * (0.85 + rnd() * 0.15) / Math.cos(el), spineR * 0.95, 1);
    }
  }
  const shards = byLevel.flat();
  const levelEnds = [];
  let n = 0;
  for (const l of byLevel) { n += l.length; levelEnds.push(n); }
  return { shards, levelEnds };
}

const SIDES = 4;

/**
 * Shards as one flat-shaded mesh: each a 4-sided blade (flatter one way
 * than the other) tapering from base to tip. Vertex order follows the
 * shard order, so a draw range keeps whole levels.
 * @param {Shard[]} shards
 * @returns {{ geometry: BufferGeometry, vertsPerShard: number }}
 */
export function shardGeometry(shards) {
  const vertsPerShard = SIDES * 6;
  const pos = new Float32Array(shards.length * vertsPerShard * 3);
  const nor = new Float32Array(shards.length * vertsPerShard * 3);
  const lvl = new Float32Array(shards.length * vertsPerShard);
  const a = new Vector3();
  const b = new Vector3();
  const ax = new Vector3();
  const u = new Vector3();
  const w = new Vector3();
  const n = new Vector3();
  const e1 = new Vector3();
  const e2 = new Vector3();
  /** @type {Vector3[]} */
  const ring0 = Array.from({ length: SIDES }, () => new Vector3());
  /** @type {Vector3[]} */
  const ring1 = Array.from({ length: SIDES }, () => new Vector3());
  let o = 0;
  const put = (/** @type {Vector3} */ p, /** @type {number} */ level) => {
    pos[o * 3] = p.x; pos[o * 3 + 1] = p.y; pos[o * 3 + 2] = p.z;
    nor[o * 3] = n.x; nor[o * 3 + 1] = n.y; nor[o * 3 + 2] = n.z;
    lvl[o] = level;
    o++;
  };
  const tri = (/** @type {Vector3} */ p, /** @type {Vector3} */ q, /** @type {Vector3} */ r, /** @type {number} */ level) => {
    e1.subVectors(q, p); e2.subVectors(r, p);
    n.crossVectors(e1, e2);
    if (n.lengthSq() < 1e-30) n.copy(ax); else n.normalize();
    put(p, level); put(q, level); put(r, level);
  };
  for (const s of shards) {
    a.fromArray(s.a); b.fromArray(s.b);
    ax.subVectors(b, a).normalize();
    u.copy(Math.abs(ax.y) > 0.9 ? new Vector3(1, 0, 0) : new Vector3(0, 1, 0)).cross(ax).normalize();
    u.applyAxisAngle(ax, s.roll);
    w.crossVectors(ax, u).normalize();
    // a blade: wide one way, thin the other (the spine stays square)
    const flat = s.level === 0 ? 1 : 0.3;
    for (let k = 0; k < SIDES; k++) {
      const t = (k / SIDES) * 2 * Math.PI + Math.PI / 4;
      const cu = Math.cos(t);
      const cw = Math.sin(t) * flat;
      ring0[k].copy(a).addScaledVector(u, cu * s.r0).addScaledVector(w, cw * s.r0);
      ring1[k].copy(b).addScaledVector(u, cu * s.r1).addScaledVector(w, cw * s.r1);
    }
    for (let k = 0; k < SIDES; k++) {
      const k2 = (k + 1) % SIDES;
      tri(ring0[k], ring0[k2], ring1[k2], s.level);
      tri(ring0[k], ring1[k2], ring1[k], s.level);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(pos, 3));
  geometry.setAttribute('normal', new Float32BufferAttribute(nor, 3));
  geometry.setAttribute('level', new Float32BufferAttribute(lvl, 1));
  return { geometry, vertsPerShard };
}

const SHARD_VERT = /* glsl */ `
attribute float level;
uniform float uH;
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vToCore;
varying float vLevel;
varying float vR;
void main() {
  vec4 mv = modelViewMatrix * vec4( position, 1.0 );
  vNormal = normalize( normalMatrix * normal );
  vView = normalize( -mv.xyz );
  // the core is the object's origin
  vec4 core = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
  vToCore = core.xyz - mv.xyz;
  vR = length( position ) / uH;
  vLevel = level;
  gl_Position = projectionMatrix * mv;
}`;

const SHARD_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uEdge;
uniform vec3 uCore;
uniform float uOpacity;
uniform float uGlow;
uniform float uPulse;
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vToCore;
varying float vLevel;
varying float vR;
void main() {
  vec3 N = normalize( vNormal );
  if ( !gl_FrontFacing ) N = -N;
  float facing = abs( dot( N, normalize( vView ) ) );
  float fres = pow( 1.0 - facing, 3.0 );
  // lit from inside, by the core: faces toward it bright, falling off with distance
  float toward = abs( dot( N, normalize( vToCore ) ) );
  // glow (0 to 1, 0.7 the default look) sets how far and how strongly the core's light reaches
  float g = 0.3 + uGlow;
  float near = 1.0 / ( 1.0 + pow( vR / ( 0.1 * pow( g, 1.5 ) ), 2.0 ) );
  vec3 c = uColor * ( 0.12 + 0.42 * toward * g );
  c += uEdge * fres * 1.0;
  // white glints on the facets that face the core squarely
  c += uCore * pow( toward, 10.0 ) * 0.7;
  c += uCore * near * uGlow * uPulse * 0.64 * toward;
  // the spine: a white light along it
  if ( vLevel < 0.5 ) c += uCore * ( 0.45 + 0.5 * near * uPulse ) * g * facing;
  float a = uOpacity * ( 0.4 + 0.5 * fres );
  gl_FragColor = vec4( c * a, a );
}`;

const CORE_VERT = /* glsl */ `
attribute vec2 corner;
uniform float uSize;
uniform float uGlow;
varying vec2 vQ;
void main() {
  vQ = corner;
  vec4 mv = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
  // a brighter core reaches further: 0.65 of the size at glow 0, 1.15 at 1
  mv.xy += corner * uSize * ( 0.5 + 0.5 * ( 0.3 + uGlow ) );
  gl_Position = projectionMatrix * mv;
}`;

const CORE_FRAG = /* glsl */ `
uniform vec3 uCore;
uniform float uOpacity;
uniform float uPulse;
uniform float uGlow;
uniform float uRays[40];
varying vec2 vQ;
void main() {
  float r = length( vQ );
  if ( r > 1.0 ) discard;
  float ang = atan( vQ.y, vQ.x );
  float glow = exp( -r * r * 90.0 ) * 1.6 + exp( -r * r * 16.0 ) * 0.16;
  float rays = 0.0;
  for ( int i = 0; i < 20; i++ ) {
    float a = uRays[ i * 2 ];
    float len = uRays[ i * 2 + 1 ];
    float da = abs( mod( ang - a + 3.14159265, 6.2831853 ) - 3.14159265 );
    float w = 0.003 + 0.014 * ( 1.0 - r ) * ( 1.0 - r );
    rays += exp( -pow( da / w, 2.0 ) ) * max( 0.0, 1.0 - r / len );
  }
  float v = ( glow + rays * 1.3 ) * uPulse * ( 0.3 + uGlow );
  float a = clamp( v, 0.0, 1.0 ) * uOpacity;
  gl_FragColor = vec4( uCore * a, a );
}`;

const DOT_VERT = /* glsl */ `
uniform float uDpr;
void main() {
  gl_PointSize = 4.0 * uDpr;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`;

const DOT_FRAG = /* glsl */ `
uniform vec3 uCore;
uniform float uOpacity;
void main() {
  gl_FragColor = vec4( uCore, uOpacity );
}`;

/**
 * @param {number[]} c - rgba
 */
function rgb(c) {
  return new Color().setRGB(c[0], c[1], c[2], SRGBColorSpace);
}

/**
 * @param {any} cfg
 * @param {import('./common.js').BuildContext} ctx
 * @returns {import('./common.js').BuiltObject}
 */
export function buildCrystalline(cfg, ctx) {
  const node = new Group();
  node.name = `crystalline:${cfg.id ?? ''}`;
  const m = crystallineModel(cfg, ctx.kmPerUnit?.(cfg._system) ?? null);
  const out = built(cfg, node, { radius: m.H / 2 });
  const opacity = Math.max(0, Math.min(1, num(cfg.opacity, 1)));
  const core = sub(cfg.core);
  const body = ctx.color(cfg.color, DEFAULT_CRYSTAL_COLOR);
  const coreC = ctx.color(core.color, DEFAULT_CORE_COLOR);
  // edges: the body colour toward the core's light
  const edge = [0, 1, 2].map((k) => body[k] + (coreC[k] - body[k]) * 0.75);
  const additive = cfg.blend !== 'normal';
  const pulse = { value: 1 };
  const glow = { value: Math.min(1, Math.max(0, num(cfg.glow, 0.7))) };

  const { shards, levelEnds } = crystallineShards(m);
  const { geometry, vertsPerShard } = shardGeometry(shards);
  const mat = new ShaderMaterial({
    uniforms: {
      uColor: { value: rgb(body) }, uEdge: { value: rgb([...edge, 1]) }, uCore: { value: rgb(coreC) },
      uOpacity: { value: opacity }, uGlow: glow, uPulse: pulse, uH: { value: m.H }
    },
    vertexShader: SHARD_VERT,
    fragmentShader: SHARD_FRAG,
    transparent: true,
    depthWrite: false,
    side: 2,
    blending: additive ? AdditiveBlending : NormalBlending,
    premultipliedAlpha: true
  });
  const crystal = new Mesh(geometry, mat);
  crystal.name = 'crystal';
  crystal.frustumCulled = false;
  crystal.renderOrder = 0.6;

  // the core: a camera-facing starburst
  const rnd = seededRandom(m.seed + 29);
  const rays = [];
  for (let i = 0; i < 20; i++) rays.push(rnd() * 2 * Math.PI, 0.2 + Math.pow(rnd(), 2) * 0.8);
  const coreGeo = new InstancedBufferGeometry();
  coreGeo.setAttribute('corner', new Float32BufferAttribute([-1, -1, 1, -1, 1, 1, -1, 1], 2));
  coreGeo.setAttribute('position', new Float32BufferAttribute(new Float32Array(12), 3));
  coreGeo.setIndex(new Uint16BufferAttribute([0, 1, 2, 0, 2, 3], 1));
  coreGeo.instanceCount = 1;
  const coreMat = new ShaderMaterial({
    uniforms: { uCore: { value: rgb(coreC) }, uOpacity: { value: opacity }, uPulse: pulse, uGlow: glow, uSize: { value: m.H * 0.6 }, uRays: { value: rays } },
    vertexShader: CORE_VERT,
    fragmentShader: CORE_FRAG,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    premultipliedAlpha: true
  });
  const burst = new Mesh(coreGeo, coreMat);
  burst.name = 'core';
  burst.frustumCulled = false;
  burst.renderOrder = 0.7;

  const dotGeo = new BufferGeometry();
  dotGeo.setAttribute('position', new Float32BufferAttribute(new Float32Array(3), 3));
  const dotMat = new ShaderMaterial({
    uniforms: { uCore: { value: rgb(coreC) }, uOpacity: { value: opacity }, uDpr: { value: 1 } },
    vertexShader: DOT_VERT,
    fragmentShader: DOT_FRAG,
    transparent: true,
    depthWrite: false
  });
  const dot = new Points(dotGeo, dotMat);
  dot.name = 'dot';
  dot.visible = false;
  node.add(crystal, burst, dot);

  let dots = false;
  const here = new Vector3();
  out.lod = ({ camera, height, dpr }) => {
    node.getWorldPosition(here);
    const k = node.matrixWorld.getMaxScaleOnAxis();
    const dist = Math.max(0, here.distanceTo(camera.position) - (m.H / 2) * k);
    const px = pixelSize(camera, m.H * k, dist, height);
    dotMat.uniforms.uDpr.value = dpr;
    // under about 10 px tall the branches cannot be told apart: a dot instead (with a margin so it does not flicker)
    dots = dots ? px < DOT_TALL * 1.1 : px < DOT_TALL * 0.9;
    crystal.visible = burst.visible = !dots;
    dot.visible = dots;
    // fork levels by size on screen: two levels under 120 px, three under 400
    const level = px < 120 ? 1 : px < 400 ? 2 : m.levels;
    geometry.setDrawRange(0, levelEnds[Math.min(level, levelEnds.length - 1)] * vertsPerShard);
  };

  // glow and opacity follow an entity in place (names.js LIVE_TYPE_KEYS)
  const baseGlow = glow.value;
  out.live = (key, value) => {
    if (key === 'glow') glow.value = value === null ? baseGlow : Math.min(1, Math.max(0, value));
    else if (key === 'opacity') {
      const o = value === null ? opacity : Math.min(1, Math.max(0, value));
      mat.uniforms.uOpacity.value = coreMat.uniforms.uOpacity.value = dotMat.uniforms.uOpacity.value = o;
    } else return false;
    return true;
  };

  const period = Math.max(0, num(core.period, 6));
  out.tick = period > 0 ? (/** @type {number} */ _dt, /** @type {number} */ t) => {
    pulse.value = 0.85 + 0.2 * Math.sin((2 * Math.PI * t) / (period * 1000));
    return true;
  } : null;
  return out;
}
