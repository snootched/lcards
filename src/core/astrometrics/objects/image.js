/**
 * `type: image`: the user's own picture (a galaxy photo, a chart) on a flat
 * rectangle or disc lying on the scene plane, `size` scene units across.
 * `blend: add` suits a photo on black. Stars: `backdrop.stars`, a shell of
 * points that stays round the camera (at infinity: panning never moves it).
 *
 * @module core/astrometrics/objects/image
 */
import { Group, Mesh, MeshBasicMaterial, PlaneGeometry, CircleGeometry, DoubleSide, AdditiveBlending, SRGBColorSpace,
  BufferGeometry, Float32BufferAttribute, Points, PointsMaterial } from 'three';
import { seededRandom } from '../../packs/backgrounds/webgl/scenes/scene-helpers.js';
import { built, num, pair, DEFAULT_COLORS } from './common.js';

/**
 * @param {any} cfg
 * @param {import('./common.js').BuildContext} ctx
 * @returns {import('./common.js').BuiltObject}
 */
export function buildImage(cfg, ctx) {
  const node = new Group();
  node.name = `image:${cfg.id ?? ''}`;
  const out = built(cfg, node);
  const [w, d] = pair(cfg.size, [200, 200]);
  const geo = cfg.shape === 'disc' ? new CircleGeometry(w / 2, 96) : new PlaneGeometry(w, d);
  geo.rotateX(-Math.PI / 2);
  const mat = new MeshBasicMaterial({ transparent: true, depthWrite: false, side: DoubleSide, opacity: num(cfg.opacity, 1) });
  if (cfg.src) {
    mat.map = ctx.loadTexture(String(cfg.src));
    if (mat.map) mat.map.colorSpace = SRGBColorSpace;
  }
  if (cfg.blend === 'add') mat.blending = AdditiveBlending;
  const mesh = new Mesh(geo, mat);
  // under the grids (they draw over it), just above the plane they share
  mesh.position.y = num(cfg.y, -0.01);
  mesh.renderOrder = 0.5;
  node.add(mesh);
  out.pickMeshes.push(mesh);
  return out;
}

/** Star sizes are drawn in this many steps between min_radius and max_radius (one material each) */
const STAR_SIZE_STEPS = 4;

/**
 * `backdrop.stars`: `count` stars at infinity (they turn with the camera,
 * panning never moves them), with the `starfield` background preset's key
 * names: `min_radius` / `max_radius` (px), `min_opacity` / `max_opacity`,
 * `colors` (or `color`), `seed`.
 * @param {any} cfg
 * @param {import('./common.js').BuildContext} ctx
 * @returns {import('./common.js').BuiltObject}
 */
export function buildStars(cfg, ctx) {
  const n = Math.max(0, Math.min(50000, Math.round(num(cfg.count, 2000))));
  const R = 3000;
  const rnd = seededRandom(num(cfg.seed, 7));
  const list = Array.isArray(cfg.colors) && cfg.colors.length ? cfg.colors : [cfg.color];
  // vertex colours are linear in three.js
  const lin = (/** @type {number} */ v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const colors = list.map((c) => {
    const rgba = ctx.color(c, DEFAULT_COLORS.stars);
    return [lin(rgba[0]), lin(rgba[1]), lin(rgba[2]), rgba[3] ?? 1];
  });
  const [r0, r1] = [Math.max(0, num(cfg.min_radius, 0.4)), Math.max(0, num(cfg.max_radius, 1.2))].sort((a, b) => a - b);
  const [o0, o1] = [num(cfg.min_opacity, 0.35), num(cfg.max_opacity, 1)].map((v) => Math.max(0, Math.min(1, v))).sort((a, b) => a - b);
  const steps = r1 - r0 < 0.05 ? 1 : STAR_SIZE_STEPS;
  /** @type {{ pos: number[], col: number[] }[]} */
  const buckets = Array.from({ length: steps }, () => ({ pos: [], col: [] }));
  for (let i = 0; i < n; i++) {
    const u = rnd() * 2 - 1;
    const th = rnd() * 2 * Math.PI;
    const q = Math.sqrt(1 - u * u);
    const size = rnd();
    const alpha = o0 + rnd() * (o1 - o0);
    const c = colors[Math.floor(rnd() * colors.length) % colors.length];
    const b = buckets[Math.min(steps - 1, Math.floor(size * steps))];
    b.pos.push(R * q * Math.cos(th), R * u, R * q * Math.sin(th));
    b.col.push(c[0], c[1], c[2], c[3] * alpha);
  }
  const node = new Group();
  node.name = 'backdrop:stars';
  buckets.forEach((b, k) => {
    if (!b.pos.length) return;
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(b.pos, 3));
    g.setAttribute('color', new Float32BufferAttribute(b.col, 4));
    // diameter in CSS px (the runtime scales it by the device pixel ratio)
    const radius = steps === 1 ? (r0 + r1) / 2 : r0 + ((k + 0.5) / steps) * (r1 - r0);
    const points = new Points(g, new PointsMaterial({
      size: Math.max(0.5, radius * 2), sizeAttenuation: false, vertexColors: true, transparent: true,
      opacity: num(cfg.opacity, 1), depthWrite: false
    }));
    points.renderOrder = -1;
    points.frustumCulled = false;
    node.add(points);
  });
  return built({ ...cfg, type: 'stars', id: cfg.id ?? '__stars' }, node);
}
