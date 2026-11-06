/**
 * `type: galaxy`: a procedural spiral galaxy in 3D. Seeded stars (px-sized
 * points, as the backdrop's) along a central bar, a bulge, spiral arms and
 * a thin disc, with soft glow along the arms and the core and darker dust
 * lanes on the arms' inner edges, all at their real places so the camera
 * sees parallax as it moves through it.
 *
 * The default is the Milky Way's structure (R4c): a bar, the two major arms
 * (Scutum-Centaurus and Perseus) from its ends, the two minor arms
 * (Sagittarius and Norma) between them, and the Orion spur where the Sun
 * is. Everything scales with `radius` (default 50,000, light years):
 * the Sun's place is 0.52 of the radius toward bearing 180 (the default
 * camera), where a starter puts its Sol point. `arms: <n>` makes a generic
 * spiral of n equal arms instead.
 *
 * Frame: the disc lies in the object's xz plane, y is galactic north.
 * Seen from above it turns clockwise, so the arms trail anticlockwise.
 *
 * @module core/astrometrics/objects/galaxy
 */
import {
  Group, InstancedBufferGeometry, InstancedBufferAttribute, Float32BufferAttribute, Uint16BufferAttribute, ShaderMaterial, Mesh,
  AdditiveBlending, NormalBlending
} from 'three';
import { seededRandom } from '../../packs/backgrounds/webgl/scenes/scene-helpers.js';
import { addDiagram, bodyGroup } from './diagram.js';
import { createStarField } from '../star-field.js';
import { built, num, sub, DEFAULT_COLORS } from './common.js';

const DEG = Math.PI / 180;

/** The Sun's distance from the centre as a fraction of the radius (26,000 of 50,000 ly) */
export const SUN_FRACTION = 0.52;

/**
 * The Milky Way's arms: start angle at the bar's end, degrees from the
 * bar's near end (bearings round the centre), weight (share of the arm
 * stars), and how far out it runs (fraction of the radius). With the bar's
 * near end at bearing 153 (27 degrees off the Sun-centre line) and a 12
 * degree pitch, the arms cross the Sun's line (bearing 180) in their real
 * order: Scutum-Centaurus ~17,700 ly, Sagittarius ~24,700 (just inside the
 * Sun), Perseus ~34,500 (just outside), Norma (the Outer arm) ~48,000. The
 * Orion spur is a short segment at the Sun's radius.
 */
export const MILKY_WAY_ARMS = [
  { name: 'Scutum-Centaurus', start: 0, weight: 1.6, end: 1 },
  { name: 'Perseus', start: 180, weight: 1.6, end: 1 },
  { name: 'Sagittarius', start: 270, weight: 0.8, end: 0.9 },
  { name: 'Norma', start: 90, weight: 0.8, end: 0.97 },
  { name: 'Orion spur', start: 0, weight: 0.25, end: 0, spur: true }
];

/** The bar's near end, bearing (27 degrees off the Sun-centre line, the Sun at 180) */
export const MILKY_WAY_BAR_ANGLE = 153;

/**
 * A logarithmic spiral arm: the bearing at radius r.
 * @param {number} start - bearing at r0, degrees
 * @param {number} r0 - where the arm starts
 * @param {number} r
 * @param {number} pitch - degrees
 */
export const armBearing = (start, r0, r, pitch) => start + Math.log(Math.max(r, 1e-9) / r0) / Math.tan(pitch * DEG) / DEG;

/** @param {() => number} rnd a standard normal (Box-Muller) */
const gauss = (rnd) => Math.sqrt(-2 * Math.log(Math.max(1e-12, rnd()))) * Math.cos(2 * Math.PI * rnd());

/** @param {number} r @param {number} bearing degrees, clockwise from north (-z) @returns {[number, number]} */
const xz = (r, bearing) => [r * Math.sin(bearing * DEG), -r * Math.cos(bearing * DEG)];

/**
 * @typedef {Object} GalaxyModel
 * @property {number} R - radius
 * @property {number} bar - the bar's half-length (0: none)
 * @property {number} barAngle - bearing of the bar's near end, degrees
 * @property {number} pitch - arm pitch, degrees
 * @property {number} thickness - the disc's scale height
 * @property {{ name: string, start: number, weight: number, end: number, spur?: boolean }[]} arms
 */

/** The Milky Way's radius, light years (the default radius) */
const MILKY_WAY_LY = 50000;
/** A light year, km */
const LY_KM = 9.4607304725808e12;

/**
 * The model from a config: the Milky Way by default, or `arms.count: n` equal arms.
 * @param {any} cfg
 * @param {number | null} [kmPerUnit] - the frame's named units: the default radius is the Milky Way's in them
 * @returns {GalaxyModel}
 */
export function galaxyModel(cfg, kmPerUnit = null) {
  const R = Math.max(1e-6, num(cfg.radius, kmPerUnit ? (MILKY_WAY_LY * LY_KM) / kmPerUnit : MILKY_WAY_LY));
  const armsPart = sub(cfg.arms);
  const barPart = sub(cfg.bar);
  const n = Math.round(num(armsPart.count, 0));
  const barAngle = num(barPart.angle, MILKY_WAY_BAR_ANGLE);
  const arms = n > 0
    ? Array.from({ length: Math.min(8, n) }, (_, i) => ({ name: `arm ${i + 1}`, start: barAngle + (360 * i) / n, weight: 1, end: 1 }))
    : MILKY_WAY_ARMS.map((a) => ({ ...a, start: a.spur ? 0 : a.start + barAngle }));
  return {
    R,
    bar: Math.max(0, num(barPart.length, 0.32)) * R,
    barAngle,
    pitch: Math.min(45, Math.max(4, num(armsPart.pitch, 12))),
    thickness: Math.max(0, num(cfg.thickness, 0.02)) * R,
    arms
  };
}

/**
 * Where a star of each part goes: seeded points of the bulge, bar, arms and
 * disc. `part`: 0 bulge, 1 bar, 2 arm, 3 disc (for colours and the tests).
 * @param {GalaxyModel} m
 * @param {number} count
 * @param {() => number} rnd
 * @returns {{ positions: Float32Array, parts: Uint8Array }}
 */
export function galaxyStars(m, count, rnd) {
  const { R, bar, barAngle, pitch, thickness, arms } = m;
  const positions = new Float32Array(count * 3);
  const parts = new Uint8Array(count);
  const r0 = Math.max(bar, 0.12 * R);
  const sunR = SUN_FRACTION * R;
  const total = arms.reduce((s, a) => s + a.weight, 0) || 1;
  // shares: bulge, bar, arms, disc
  const shares = [0.12, bar > 0 ? 0.1 : 0, 0.52, 0.26];
  const cut = shares.map((_, i) => shares.slice(0, i + 1).reduce((a, b) => a + b, 0) / shares.reduce((a, b) => a + b, 0));
  for (let i = 0; i < count; i++) {
    const u = rnd();
    let x = 0, y = 0, z = 0, part = 3;
    if (u < cut[0]) {
      // the bulge: a flattened ball round the centre
      part = 0;
      const s = 0.08 * R;
      x = gauss(rnd) * s; z = gauss(rnd) * s; y = gauss(rnd) * s * 0.6;
    } else if (u < cut[1]) {
      // the bar: along its axis, thinner across
      part = 1;
      const t = (rnd() * 2 - 1) * bar;
      const w = 0.035 * R * (1 - 0.5 * Math.abs(t) / bar);
      const [ax, az] = xz(1, barAngle);
      x = ax * t + az * gauss(rnd) * w; z = az * t - ax * gauss(rnd) * w;
      y = gauss(rnd) * w * 0.5;
    } else if (u < cut[2]) {
      // an arm, by weight: denser near its start, spreading as it goes
      part = 2;
      let pick = rnd() * total;
      let arm = arms[0];
      for (const a of arms) { pick -= a.weight; if (pick <= 0) { arm = a; break; } }
      let r, b;
      if (arm.spur) {
        // the Orion spur: a short segment through the Sun's radius, near bearing 180
        r = sunR * (0.92 + rnd() * 0.16);
        b = 180 + (rnd() - 0.5) * 30 + (r - sunR) / sunR * 120;
      } else {
        r = r0 + Math.pow(rnd(), 1.4) * (arm.end * R - r0);
        b = armBearing(arm.start, r0, r, pitch);
      }
      const spread = (0.012 + 0.03 * (r / R)) * R;
      const [px, pz] = xz(r, b);
      x = px + gauss(rnd) * spread; z = pz + gauss(rnd) * spread;
      y = gauss(rnd) * thickness * 0.6;
    } else {
      // the disc: exponential in radius, a little thicker than the arms
      const r = Math.min(R, -Math.log(Math.max(1e-6, rnd())) * 0.3 * R);
      [x, z] = xz(r, rnd() * 360);
      y = gauss(rnd) * thickness;
    }
    positions[i * 3] = x; positions[i * 3 + 1] = y; positions[i * 3 + 2] = z;
    parts[i] = part;
  }
  return { positions, parts };
}

/**
 * Soft blobs along the arms (glow) and on their inner edges (dust), and the
 * core: centres and sizes in scene units.
 * @param {GalaxyModel} m
 * @param {number} count - per kind
 * @param {() => number} rnd
 */
export function galaxyBlobs(m, count, rnd) {
  const { R, bar, pitch, arms } = m;
  const r0 = Math.max(bar, 0.12 * R);
  const main = arms.filter((a) => !a.spur);
  const total = main.reduce((s, a) => s + a.weight, 0) || 1;
  /** @type {{ glow: number[][], dust: number[][] }} [x, y, z, size] */
  const out = { glow: [], dust: [] };
  for (let i = 0; i < count; i++) {
    let pick = rnd() * total;
    let arm = main[0];
    for (const a of main) { pick -= a.weight; if (pick <= 0) { arm = a; break; } }
    const r = r0 + Math.pow(rnd(), 1.2) * (arm.end * R - r0);
    const b = armBearing(arm.start, r0, r, pitch);
    const spread = 0.02 * R;
    const [gx, gz] = xz(r, b);
    out.glow.push([gx + gauss(rnd) * spread, 0, gz + gauss(rnd) * spread, (0.05 + 0.05 * rnd()) * R]);
    // dust: a little inward of the arm (its inner, leading edge)
    const [dx, dz] = xz(r * 0.95, b - 4);
    out.dust.push([dx + gauss(rnd) * spread * 0.5, 0, dz + gauss(rnd) * spread * 0.5, (0.025 + 0.03 * rnd()) * R]);
  }
  return out;
}

const BLOB_VERT = /* glsl */ `
attribute vec2 corner;
attribute vec4 iBlob;
attribute vec4 iColor;
varying vec2 vQ;
varying vec4 vColor;
void main() {
  vec4 mv = modelViewMatrix * vec4( iBlob.xyz, 1.0 );
  // a billboard iBlob.w across, in the object's units
  float s = iBlob.w * length( modelViewMatrix[ 0 ].xyz );
  mv.xy += corner * s * 0.5;
  vQ = corner;
  vColor = iColor;
  gl_Position = projectionMatrix * mv;
}`;

const BLOB_FRAG = /* glsl */ `
uniform float uOpacity;
varying vec2 vQ;
varying vec4 vColor;
void main() {
  float r2 = dot( vQ, vQ );
  if ( r2 > 1.0 ) discard;
  float a = exp( -4.0 * r2 ) * ( 1.0 - r2 );
  gl_FragColor = vec4( vColor.rgb, vColor.a * a * uOpacity );
}`;

/**
 * Soft round billboards in scene units (one draw): the galaxy's glow and dust.
 * @param {number[][]} blobs - [x, y, z, size]
 * @param {number[]} color - rgba
 * @param {number} opacity
 * @param {boolean} additive
 */
function blobField(blobs, color, opacity, additive) {
  const geo = new InstancedBufferGeometry();
  geo.setAttribute('corner', new Float32BufferAttribute([-1, -1, 1, -1, 1, 1, -1, 1], 2));
  geo.setAttribute('position', new Float32BufferAttribute(new Float32Array(12), 3));
  geo.setIndex(new Uint16BufferAttribute([0, 1, 2, 0, 2, 3], 1));
  geo.setAttribute('iBlob', new InstancedBufferAttribute(new Float32Array(blobs.flat()), 4));
  const cols = new Float32Array(blobs.length * 4);
  for (let i = 0; i < blobs.length; i++) cols.set(color, i * 4);
  geo.setAttribute('iColor', new InstancedBufferAttribute(cols, 4));
  geo.instanceCount = blobs.length;
  const material = new ShaderMaterial({
    uniforms: { uOpacity: { value: opacity } },
    vertexShader: BLOB_VERT,
    fragmentShader: BLOB_FRAG,
    transparent: true,
    depthWrite: false,
    blending: additive ? AdditiveBlending : NormalBlending
  });
  const mesh = new Mesh(geo, material);
  mesh.frustumCulled = false;
  return mesh;
}

/**
 * The diagram look's lines (flat, in the disc's plane): each arm's
 * logarithmic spiral from where the arms start to where it ends (spurs
 * too), and the frame: the disc's rim, the bar and a ring round the bulge.
 * @param {GalaxyModel} m
 * @returns {{ arms: number[][], frame: number[][] }}
 */
export function galaxyDiagram(m) {
  const { R, bar, barAngle, pitch, arms } = m;
  const r0 = Math.max(bar, 0.12 * R);
  const STEPS = 96;
  const spiral = arms.map((a) => {
    const end = Math.max(r0, a.end * R);
    // a spur starts part way out, where it branches
    const from = a.spur ? Math.max(r0, end * 0.55) : r0;
    /** @type {number[]} */
    const run = [];
    for (let i = 0; i <= STEPS; i++) {
      const r = from + ((end - from) * i) / STEPS;
      const [x, z] = xz(r, armBearing(a.start, r0, r, pitch));
      run.push(x, 0, z);
    }
    return run;
  });
  /** @param {number} r @returns {number[]} */
  const ring = (r) => {
    const run = [];
    for (let i = 0; i <= 128; i++) {
      const [x, z] = xz(r, (i * 360) / 128);
      run.push(x, 0, z);
    }
    return run;
  };
  const frame = [ring(R), ring(r0 * 0.5)];
  if (bar > 0) {
    const [x, z] = xz(bar, barAngle);
    frame.push([x, 0, z, -x, 0, -z]);
  }
  return { arms: spiral, frame };
}

/**
 * @param {any} cfg
 * @param {import('./common.js').BuildContext} ctx
 * @returns {import('./common.js').BuiltObject}
 */
export function buildGalaxy(cfg, ctx) {
  const node = new Group();
  node.name = `galaxy:${cfg.id ?? ''}`;
  const m = galaxyModel(cfg, ctx.kmPerUnit?.(cfg._system) ?? null);
  const out = built(cfg, node, { radius: m.R, flat: true });
  const opacity = num(cfg.opacity, 1);
  const rnd = seededRandom(num(cfg.seed, 3));
  const n = Math.max(0, Math.min(100000, Math.round(num(sub(cfg.stars).count, 40000))));
  const { positions, parts } = galaxyStars(m, n, rnd);
  const core = ctx.color(sub(cfg.core).color, 'var(--lcars-yellow, var(--lcards-yellow-medium))');
  const arm = ctx.color(sub(cfg.arms).color, 'var(--lcars-blue, var(--lcards-blue-medium))');
  const star = ctx.color(sub(cfg.stars).color, DEFAULT_COLORS.stars);
  const sizes = new Float32Array(n);
  const cols = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const p = parts[i];
    // the old stars of the bulge and bar warm, the arms' young ones toward the arm colour, the disc pale
    const tint = p <= 1 ? core : p === 2 ? arm : star;
    const mix = p === 3 ? 0.2 : 0.35 + rnd() * 0.5;
    const c = [0, 1, 2].map((k) => star[k] + (tint[k] - star[k]) * mix);
    sizes[i] = 0.8 + Math.pow(rnd(), 3) * 2.2;
    cols.set([c[0], c[1], c[2], 0.35 + rnd() * 0.65], i * 4);
  }
  const field = createStarField({ positions, sizes, colors: cols, opacity });
  // the stars, glow and dust are the realistic part; the diagram look draws the arms as lines
  const body = bodyGroup('galaxy-body');
  node.add(body);
  body.add(field.mesh);
  out.field = field;
  // glow along the arms and at the core, dust on the arms' inner edges
  const glowOpacity = Math.max(0, num(cfg.glow, 0.6)) * opacity;
  const dust = sub(cfg.dust);
  const dustOpacity = Math.max(0, num(dust.amount, 0.5)) * opacity;
  const blobs = galaxyBlobs(m, 260, seededRandom(num(cfg.seed, 3) + 1));
  if (glowOpacity > 0) {
    const g = blobField(blobs.glow, [arm[0], arm[1], arm[2], 0.18], glowOpacity, true);
    g.renderOrder = -0.5;
    body.add(g);
    const c = blobField([[0, 0, 0, 0.45 * m.R], [0, 0, 0, 0.2 * m.R]], [core[0], core[1], core[2], 0.5], glowOpacity, true);
    c.renderOrder = -0.5;
    body.add(c);
  }
  if (dustOpacity > 0) {
    const bg = ctx.color(dust.color, 'var(--primary-background-color, #000)');
    const d = blobField(blobs.dust, [bg[0], bg[1], bg[2], 0.6], dustOpacity, false);
    d.renderOrder = -0.4;
    body.add(d);
  }
  // the diagram look: each arm as its spiral in the arm colour; the disc's rim, the bar and a ring
  // round the bulge in the core colour
  const lines = galaxyDiagram(m);
  addDiagram(out, { runs: lines.arms, color: arm, body: [body] });
  addDiagram(out, { runs: lines.frame, color: core, body: [] });
  // far away it is a few px across: fewer stars draw (they would merge anyway)
  out.lod = ({ camera, height }) => {
    const c = /** @type {any} */ (camera);
    const d = Math.max(1e-6, c.position.distanceTo(node.getWorldPosition(c.position.clone())));
    const px = c.isPerspectiveCamera ? (m.R / d) / Math.tan((c.fov * DEG) / 2) * (height / 2) : height;
    const geo = /** @type {any} */ (field.mesh.geometry);
    // every star from 300 px radius up, never fewer than 15 % (they would merge anyway)
    geo.instanceCount = Math.round(n * Math.min(1, Math.max(0.15, px / 300)));
  };
  return out;
}
