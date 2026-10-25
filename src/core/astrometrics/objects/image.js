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

/**
 * `backdrop.stars`: `count` points on a shell of `radius`, `size` px.
 * @param {any} cfg
 * @param {import('./common.js').BuildContext} ctx
 * @returns {import('./common.js').BuiltObject}
 */
export function buildStars(cfg, ctx) {
  const n = Math.max(0, Math.min(50000, Math.round(num(cfg.count, 2000))));
  const r = num(cfg.radius, 3000);
  const rnd = seededRandom(num(cfg.seed, 7));
  const c = ctx.color(cfg.color, DEFAULT_COLORS.stars);
  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  // vertex colours are linear in three.js
  const lin = c.slice(0, 3).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  for (let i = 0; i < n; i++) {
    const u = rnd() * 2 - 1;
    const th = rnd() * 2 * Math.PI;
    const q = Math.sqrt(1 - u * u);
    pos[i * 3] = r * q * Math.cos(th);
    pos[i * 3 + 1] = r * u;
    pos[i * 3 + 2] = r * q * Math.sin(th);
    const b = 0.35 + rnd() * 0.65;
    col[i * 3] = lin[0] * b;
    col[i * 3 + 1] = lin[1] * b;
    col[i * 3 + 2] = lin[2] * b;
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new Float32BufferAttribute(col, 3));
  const points = new Points(g, new PointsMaterial({
    size: num(cfg.size, 1.6), sizeAttenuation: false, vertexColors: true, transparent: true,
    opacity: num(cfg.opacity, 1) * (c[3] ?? 1), depthWrite: false
  }));
  points.renderOrder = -1;
  points.frustumCulled = false;
  const node = new Group();
  node.name = 'backdrop:stars';
  node.add(points);
  return built({ ...cfg, type: 'stars', id: cfg.id ?? '__stars' }, node);
}
