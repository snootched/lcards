/**
 * `type: glow`: a soft light that always faces the camera (a galactic core,
 * a star, a beacon), drawn additively. Procedural: a radial falloff made in
 * code, no artwork. `size` is its diameter in scene units, `falloff` how fast
 * it fades from the middle (higher is a tighter core), `at` where it sits.
 *
 * @module core/astrometrics/objects/glow
 */
import { Group, Sprite, SpriteMaterial, DataTexture, RGBAFormat, LinearFilter, AdditiveBlending, NormalBlending, SRGBColorSpace } from 'three';
import { built, num, DEFAULT_COLORS } from './common.js';
import { addDiagram, circleXY } from './diagram.js';

const SIZE = 64;

/**
 * Radial falloff as alpha (white RGB), 0 at the edge.
 * @param {number} falloff
 */
export function glowTexture(falloff) {
  const data = new Uint8Array(SIZE * SIZE * 4);
  const k = Math.max(0.25, falloff);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const r = Math.hypot(x + 0.5 - SIZE / 2, y + 0.5 - SIZE / 2) / (SIZE / 2);
      // a smooth edge, and a brighter core the higher the falloff
      const a = r >= 1 ? 0 : Math.pow(1 - r, k) * (1 - r * r);
      const i = (y * SIZE + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = 255;
      data[i + 3] = Math.round(Math.min(1, a) * 255);
    }
  }
  const t = new DataTexture(data, SIZE, SIZE, RGBAFormat);
  t.magFilter = LinearFilter;
  t.minFilter = LinearFilter;
  t.needsUpdate = true;
  return t;
}

/**
 * @param {any} cfg
 * @param {import('./common.js').BuildContext} ctx
 * @returns {import('./common.js').BuiltObject}
 */
export function buildGlow(cfg, ctx) {
  const node = new Group();
  node.name = `glow:${cfg.id ?? ''}`;
  const c = ctx.color(cfg.color, DEFAULT_COLORS.glow);
  const mat = new SpriteMaterial({
    map: glowTexture(num(cfg.falloff, 2)),
    transparent: true,
    depthWrite: false,
    blending: cfg.blend === 'normal' ? NormalBlending : AdditiveBlending,
    opacity: num(cfg.opacity, 0.9) * (c[3] ?? 1)
  });
  mat.color.setRGB(c[0], c[1], c[2], SRGBColorSpace);
  const sprite = new Sprite(mat);
  const size = Math.max(0, num(cfg.size, 60));
  sprite.scale.set(size, size, 1);
  sprite.renderOrder = 0.5;
  node.add(sprite);
  const out = built(cfg, node, { radius: size / 2 });
  // the diagram look: a ring marker with four ticks, facing the camera, in the glow's colour
  const r = size * 0.2;
  const ticks = [[1, 0], [0, 1], [-1, 0], [0, -1]].map(([x, y]) => [x * r * 1.3, y * r * 1.3, 0, x * r * 1.8, y * r * 1.8, 0]);
  addDiagram(out, { runs: [circleXY(r), ...ticks], color: c, body: [sprite], facing: true });
  return out;
}
