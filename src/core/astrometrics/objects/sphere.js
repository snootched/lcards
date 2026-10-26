/**
 * `type: sphere`: a planet or globe. A grid of latitude and longitude lines
 * (`lat_step`, `lon_step` degrees) over a dark body that writes depth, so
 * lines and labels behind it are hidden. `image` puts the user's own texture
 * on the body instead of the fill. `spin` turns it (degrees per second,
 * positive is prograde: the front moves east); `latlon` points on it follow.
 *
 * @module core/astrometrics/objects/sphere
 */
import { Group, Mesh, MeshBasicMaterial, SphereGeometry, SRGBColorSpace } from 'three';
import { gridFace } from '../grid-mesh-material.js';
import { sphereGeometry } from '../surface.js';
import { built, num, gridLook, scanTicker, combineTicks, fillFor, DEFAULT_COLORS } from './common.js';

const DEG = Math.PI / 180;

/**
 * @param {any} cfg
 * @param {import('./common.js').BuildContext} ctx
 * @returns {import('./common.js').BuiltObject}
 */
export function buildSphere(cfg, ctx) {
  const node = new Group();
  node.name = `sphere:${cfg.id ?? ''}`;
  const R = Math.max(1e-3, num(cfg.radius, 10));
  const out = built(cfg, node, { radius: R, occludes: cfg.occlude !== false });
  const latStep = Math.max(1, num(cfg.lat_step, 15));
  const lonStep = Math.max(1, num(cfg.lon_step, 15));
  // lon lines must close round: a whole number of steps
  const lonN = Math.max(1, Math.round(360 / lonStep));
  const look = gridLook(cfg, ctx, { cell: [(2 * Math.PI * R) / lonN, R * latStep * DEG], back: 0 });
  const face = gridFace(sphereGeometry({ radius: R }), look);
  node.add(face);
  out.gridFaces.push(face);

  const baseColor = ctx.color(cfg.fill, DEFAULT_COLORS.fill);
  // fill_effect paints the body (over the fill colour) and still writes depth
  const effect = fillFor(cfg, ctx, { radius: R, base: [baseColor[0], baseColor[1], baseColor[2], num(cfg.fill_opacity, 0.85) * (baseColor[3] ?? 1)], solid: true });
  /** @type {import('three').Material} */
  let bodyMat;
  if (effect) bodyMat = effect.material;
  else {
    const fillMat = new MeshBasicMaterial({ transparent: true, depthWrite: true });
    if (cfg.image) {
      fillMat.map = ctx.loadTexture(String(cfg.image));
      if (fillMat.map) fillMat.map.colorSpace = SRGBColorSpace;
      fillMat.opacity = num(cfg.image_opacity, 1);
    } else {
      fillMat.color.setRGB(baseColor[0], baseColor[1], baseColor[2], SRGBColorSpace);
      fillMat.opacity = num(cfg.fill_opacity, 0.85) * (baseColor[3] ?? 1);
    }
    bodyMat = fillMat;
  }
  // Just inside the grid, so the near lines pass the depth test
  const body = new Mesh(new SphereGeometry(R * 0.995, 64, 32), bodyMat);
  // three's sphere has u = 0 at -x; turn it so the texture's centre faces +z (lon 0)
  body.rotation.y = -Math.PI / 2;
  body.renderOrder = 0;
  node.add(body);
  out.pickMeshes.push(body);
  out.tick = combineTicks(scanTicker(cfg, ctx, out.gridFaces), effect?.tick);
  return out;
}
