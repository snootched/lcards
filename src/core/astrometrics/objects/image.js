/**
 * `type: image`: the user's own picture (a galaxy photo, a chart) on a flat
 * rectangle or disc lying on the scene plane, `size` scene units across.
 * `blend: add` suits a photo on black.
 *
 * @module core/astrometrics/objects/image
 */
import { Group, Mesh, MeshBasicMaterial, PlaneGeometry, CircleGeometry, DoubleSide, AdditiveBlending, SRGBColorSpace } from 'three';
import { built, num, pair } from './common.js';

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
  mesh.position.y = num(cfg.alt, -0.01);
  mesh.renderOrder = 0.5;
  node.add(mesh);
  out.pickMeshes.push(mesh);
  return out;
}
