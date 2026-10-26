/**
 * `backdrop.stars`: `count` stars at infinity (a shell that stays round
 * the camera: they turn with it, panning never moves them), and
 * `backdrop.dust`: particles at a finite distance round the scene centre,
 * so every camera move shows parallax. Both take the `starfield`
 * background preset's key names (`count`, `seed`, `min_radius` /
 * `max_radius` px, `min_opacity` / `max_opacity`, `colors`) and streak
 * during a warp fly-to (`star-field.js`).
 *
 * @module core/astrometrics/objects/stars
 */
import { Group } from 'three';
import { seededRandom } from '../../packs/backgrounds/webgl/scenes/scene-helpers.js';
import { createStarField } from '../star-field.js';
import { built, num, DEFAULT_COLORS } from './common.js';

/** Radius of the star shell round the camera, scene units */
export const STAR_SHELL = 3000;

/**
 * Seeded sizes, colours and opacities for `n` stars, positions from `place`.
 * @param {any} cfg
 * @param {import('./common.js').BuildContext} ctx
 * @param {{ count: number, radius: [number, number], place: (rnd: () => number) => number[] }} d - defaults and placement
 */
function field(cfg, ctx, d) {
  const n = Math.max(0, Math.min(50000, Math.round(num(cfg.count, d.count))));
  const rnd = seededRandom(num(cfg.seed, 7));
  const list = Array.isArray(cfg.colors) && cfg.colors.length ? cfg.colors : [cfg.color];
  const colors = list.map((/** @type {any} */ c) => ctx.color(c, DEFAULT_COLORS.stars));
  const [r0, r1] = [Math.max(0, num(cfg.min_radius, d.radius[0])), Math.max(0, num(cfg.max_radius, d.radius[1]))].sort((a, b) => a - b);
  const [o0, o1] = [num(cfg.min_opacity, 0.35), num(cfg.max_opacity, 1)].map((v) => Math.max(0, Math.min(1, v))).sort((a, b) => a - b);
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
  return createStarField({ positions, sizes, colors: cols, opacity: num(cfg.opacity, 1), spectrum: cfg.spectrum === true });
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
 * @param {{ center: number[], radius: number }} scene - the scene's bounds (dust fills 1.5 x their radius by default)
 * @returns {import('./common.js').BuiltObject}
 */
export function buildDust(cfg, ctx, scene) {
  const R = Math.max(1e-3, num(cfg.radius, scene.radius * 1.5));
  const c = scene.center;
  const dust = field(cfg, ctx, {
    count: 400,
    radius: [0.4, 1],
    place: (rnd) => {
      const p = onSphere(rnd, R * Math.cbrt(rnd()));
      return [c[0] + p[0], c[1] + p[1], c[2] + p[2]];
    }
  });
  const node = new Group();
  node.name = 'backdrop:dust';
  node.add(dust.mesh);
  return built({ ...cfg, type: 'dust', id: cfg.id ?? '__dust' }, node, { field: dust });
}
