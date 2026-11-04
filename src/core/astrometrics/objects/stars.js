/**
 * `backdrop.stars`: `count` stars at infinity (a shell that stays round
 * the camera: they turn with it, panning never moves them), and
 * `backdrop.dust`: particles that fill the space round the camera out to
 * `radius` wherever it goes (they wrap round it, star-field.js), so every
 * camera move shows parallax. Both take the `starfield`
 * background preset's key names (`count`, `seed`, `min_radius` /
 * `max_radius` px, `brightness` [low, high], `colors`) and streak
 * during a warp fly-to (`star-field.js`).
 *
 * @module core/astrometrics/objects/stars
 */
import { Group } from 'three';
import { seededRandom } from '../../packs/backgrounds/webgl/scenes/scene-helpers.js';
import { createStarField } from '../star-field.js';
import { built, num, sub, isOn, DEFAULT_COLORS } from './common.js';

/** Radius of the star shell round the camera, scene units */
export const STAR_SHELL = 3000;

/**
 * Seeded sizes, colours and opacities for `n` stars, positions from `place`.
 * @param {any} cfg
 * @param {import('./common.js').BuildContext} ctx
 * @param {{ count: number, radius: [number, number], place: (rnd: () => number) => number[], reach?: number }} d - defaults and placement
 */
function field(cfg, ctx, d) {
  const n = Math.max(0, Math.min(50000, Math.round(num(cfg.count, d.count))));
  const rnd = seededRandom(num(cfg.seed, 7));
  const list = Array.isArray(cfg.colors) && cfg.colors.length ? cfg.colors : [cfg.color];
  const colors = list.map((/** @type {any} */ c) => ctx.color(c, DEFAULT_COLORS.stars));
  const [r0, r1] = [Math.max(0, num(cfg.min_radius, d.radius[0])), Math.max(0, num(cfg.max_radius, d.radius[1]))].sort((a, b) => a - b);
  const [o0, o1] = [num(cfg.brightness?.[0], 0.35), num(cfg.brightness?.[1], 1)].map((v) => Math.max(0, Math.min(1, v))).sort((a, b) => a - b);
  const positions = new Float32Array(n * 3);
  const sizes = new Float32Array(n);
  const cols = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    positions.set(d.place(rnd), i * 3);
    const size = rnd();
    const alpha = o0 + rnd() * (o1 - o0);
    const c = colors[Math.floor(rnd() * colors.length) % colors.length];
    // diameter in CSS px (the shader scales it by the device pixel ratio)
    sizes[i] = Math.max(0.5, (r0 + size * (r1 - r0)) * 2);
    cols.set([c[0], c[1], c[2], (c[3] ?? 1) * alpha], i * 4);
  }
  return createStarField({ positions, sizes, colors: cols, opacity: num(cfg.opacity, 1), spectrum: isOn(cfg.spectrum, false), reverse: sub(cfg.spectrum).direction === 'reverse', reach: d.reach });
}

/** @param {() => number} rnd @param {number} R a uniform point on a sphere of radius R */
function onSphere(rnd, R) {
  const u = rnd() * 2 - 1;
  const th = rnd() * 2 * Math.PI;
  const q = Math.sqrt(1 - u * u);
  return [R * q * Math.cos(th), R * u, R * q * Math.sin(th)];
}

/**
 * @param {any} cfg
 * @param {import('./common.js').BuildContext} ctx
 * @returns {import('./common.js').BuiltObject}
 */
export function buildStars(cfg, ctx) {
  const stars = field(cfg, ctx, { count: 2000, radius: [0.4, 1.2], place: (rnd) => onSphere(rnd, STAR_SHELL) });
  const node = new Group();
  node.name = 'backdrop:stars';
  node.add(stars.mesh);
  return built({ ...cfg, type: 'stars', id: cfg.id ?? '__stars' }, node, { field: stars });
}

/**
 * @param {any} cfg
 * @param {import('./common.js').BuildContext} ctx
 * @param {{ radius: number }} scene - the scene's bounds (dust reaches 1.5 x their radius round the camera by default)
 * @returns {import('./common.js').BuiltObject}
 */
export function buildDust(cfg, ctx, scene) {
  const R = Math.max(1e-3, num(cfg.radius, scene.radius * 1.5));
  // seeded once in a cube of side 2R; the shader wraps it round the camera
  const dust = field(cfg, ctx, {
    count: 800,
    radius: [0.4, 1],
    reach: R,
    place: (rnd) => [(rnd() * 2 - 1) * R, (rnd() * 2 - 1) * R, (rnd() * 2 - 1) * R]
  });
  const node = new Group();
  node.name = 'backdrop:dust';
  node.add(dust.mesh);
  return built({ ...cfg, type: 'dust', id: cfg.id ?? '__dust' }, node, { field: dust });
}
