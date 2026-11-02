/**
 * `type: comet`: a small dark nucleus (an asteroid's rock), a soft coma
 * round it and two tails pointing away from its star (`light`): a narrow,
 * straight ion tail (`ion_color`) and a broader dust tail (`color`) that
 * bends back along the comet's path as it moves (a gentle fixed curve while
 * it stands still). `tails` picks which draw.
 *
 * The tails are seeded particles streaming outward (one draw each, placed in
 * the vertex shader, added up as light), so they read from every angle. The
 * way away from the star is worked out in the comet's own space before each
 * draw, so `face`, `spin` and `rotation` turn the nucleus but never the
 * tails. The streaming follows the scene clock and holds under reduced motion.
 *
 * `size` (the nucleus), `coma_size`, `tail_length` and `glow` (the coma's and
 * tails' opacity) change in place when they follow an entity (names.js
 * LIVE_TYPE_KEYS). `activity: distance` scales the coma, the tails and the
 * glow by the distance to the star every frame: full at `activity_range`'s
 * near end, falling off with the square of the distance, gone at its far end.
 *
 * @module core/astrometrics/objects/comet
 */
import {
  Group, ShaderMaterial, BufferGeometry, BufferAttribute, Points, Vector3, Matrix4, Color, SRGBColorSpace, AdditiveBlending, Sphere
} from 'three';
import { seededRandom } from '../../packs/backgrounds/webgl/scenes/scene-helpers.js';
import { built, num, pair } from './common.js';
import { buildAsteroid } from './asteroid.js';
import { buildGlow } from './glow.js';
import { pixelSize } from './belt.js';
import { Facing } from '../facing.js';
import { COMET_TAILS } from '../names.js';
const NUCLEUS_COLOR = 'var(--lcards-gray-medium-dark)';
const DUST_COLOR = 'var(--lcards-moonlight)';
const ION_COLOR = 'var(--lcards-blue-medium)';
const ION_COUNT = 3000;
const DUST_COUNT = 6000;

const TAIL_VERT = /* glsl */ `
attribute float aAlong;
attribute vec2 aSide;
attribute float aSpeed;
attribute float aSize;
uniform float uTime;
uniform vec3 uDir;
uniform vec3 uU;
uniform vec3 uV;
uniform float uLength;
uniform float uSpread;
uniform vec3 uBend;
uniform float uComa;
uniform float uSize;
uniform float uPxPerUnit;
uniform float uOrtho;
uniform float uDpr;
varying float vAlpha;
void main() {
  // how far along the tail, 0 at the coma to 1 at its end: streaming outward
  float f = fract( aAlong + uTime * aSpeed );
  vec3 p = uDir * ( f * uLength )
    + ( uU * aSide.x + uV * aSide.y ) * ( uComa * 0.3 + f * uLength * uSpread )
    + uBend * f * f * uLength;
  vec4 mv = modelViewMatrix * vec4( p, 1.0 );
  float s = uSize * aSize * ( 1.0 + f * 1.5 );
  float px = s * ( uOrtho > 0.0 ? uOrtho : uPxPerUnit / max( -mv.z, 1e-6 ) ) * uDpr;
  gl_PointSize = clamp( px, 1.0, 256.0 );
  // fades toward the end, eases in at the coma; a particle under a pixel covers part of one
  vAlpha = pow( 1.0 - f, 2.0 ) * smoothstep( 0.0, 0.04, f ) * clamp( px * px, 0.0, 1.0 );
  gl_Position = projectionMatrix * mv;
}`;

const TAIL_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
varying float vAlpha;
void main() {
  float d = length( gl_PointCoord - 0.5 ) * 2.0;
  float soft = max( 1.0 - d * d, 0.0 );
  gl_FragColor = vec4( uColor, uOpacity * vAlpha * soft );
}`;

/**
 * How active a comet is at a distance from its star: 1 at `near` and closer,
 * falling with the square of the distance, 0 at `far` and beyond.
 * @param {number} dist
 * @param {number} near
 * @param {number} far
 */
export function activityAt(dist, near, far) {
  const n = Math.max(1e-9, Math.min(near, far));
  const f = Math.max(near, far);
  if (!(f > n)) return dist <= n ? 1 : 0;
  const floor = (n / f) ** 2;
  const k = (n / Math.max(dist, n)) ** 2;
  return Math.min(1, Math.max(0, (k - floor) / (1 - floor)));
}

/**
 * One tail's particles (pure, seeded): where each starts along the tail, its
 * place across it (a disc, denser in the middle), how fast it streams and
 * its size.
 * @param {number} count
 * @param {number} seed
 */
export function tailParticles(count, seed) {
  const rnd = seededRandom(seed);
  const along = new Float32Array(count);
  const side = new Float32Array(count * 2);
  const speed = new Float32Array(count);
  const size = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    along[i] = rnd();
    const a = rnd() * Math.PI * 2;
    const r = Math.sqrt(rnd()) * (0.4 + 0.6 * rnd());
    side[i * 2] = Math.cos(a) * r;
    side[i * 2 + 1] = Math.sin(a) * r;
    speed[i] = 0.6 + rnd() * 0.8;
    size[i] = 0.5 + rnd();
  }
  return { along, side, speed, size };
}

/**
 * @param {any} cfg
 * @param {import('./common.js').BuildContext} ctx
 * @returns {import('./common.js').BuiltObject}
 */
export function buildComet(cfg, ctx) {
  const node = new Group();
  node.name = `comet:${cfg.id ?? ''}`;
  const seed = num(cfg.seed, 1);
  const base = {
    size: Math.max(1e-6, num(cfg.size, 2)),
    coma: Math.max(0, num(cfg.coma_size, 10)),
    tail: Math.max(0, num(cfg.tail_length, 60)),
    glow: Math.min(1, Math.max(0, num(cfg.glow, 1)))
  };
  const now = { ...base };
  const out = built(cfg, node, { radius: Math.max(now.size, now.coma) / 2 });

  // the nucleus: a dark rock, lit from the same star
  const nucleus = buildAsteroid({ id: cfg.id, size: base.size, seed, tumble: cfg.tumble ?? 10, color: cfg.nucleus_color ?? NUCLEUS_COLOR, occlude: false }, ctx);
  // the coma shows through it (it writes no depth: the glow's middle is not hidden behind its near side)
  const rock = /** @type {import('three').Mesh} */ (nucleus.node.getObjectByName('rock'));
  /** @type {import('three').Material} */ (rock.material).depthWrite = false;
  node.add(nucleus.node);
  // the coma: a soft glow round it (its size and opacity set per frame)
  const coma = buildGlow({ size: 1, color: cfg.color ?? DUST_COLOR, opacity: 1, falloff: 1.6 }, ctx);
  const comaSprite = /** @type {import('three').Sprite} */ (coma.node.children[0]);
  node.add(coma.node);

  const which = COMET_TAILS.includes(cfg.tails) ? cfg.tails : 'both';
  /**
   * @param {number} count @param {number} s @param {any} colorValue @param {string} fallback @param {number} spread @param {number} speed @param {number} size
   */
  const tail = (count, s, colorValue, fallback, spread, speed, size) => {
    const p = tailParticles(count, s);
    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(new Float32Array(count * 3), 3));
    geo.setAttribute('aAlong', new BufferAttribute(p.along, 1));
    geo.setAttribute('aSide', new BufferAttribute(p.side, 2));
    geo.setAttribute('aSpeed', new BufferAttribute(Float32Array.from(p.speed, (v) => v * speed), 1));
    geo.setAttribute('aSize', new BufferAttribute(p.size, 1));
    const c = ctx.color(colorValue, fallback);
    const mat = new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }, uDir: { value: new Vector3(1, 0, 0) }, uU: { value: new Vector3(0, 1, 0) }, uV: { value: new Vector3(0, 0, 1) },
        uLength: { value: 0 }, uSpread: { value: spread }, uBend: { value: new Vector3() }, uComa: { value: 0 }, uSize: { value: size },
        uPxPerUnit: { value: 1 }, uOrtho: { value: 0 }, uDpr: { value: 1 },
        uColor: { value: new Color().setRGB(c[0], c[1], c[2], SRGBColorSpace) }, uOpacity: { value: c[3] ?? 1 }
      },
      vertexShader: TAIL_VERT,
      fragmentShader: TAIL_FRAG,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending
    });
    // placed in the shader: the bound is as far as the tail can reach, any way (framing a fly-to, distance keys)
    geo.boundingSphere = new Sphere(new Vector3(), base.tail + base.coma / 2);
    const pts = new Points(geo, mat);
    // placed in the shader: no bound to cull by
    pts.frustumCulled = false;
    pts.renderOrder = 0.5;
    node.add(pts);
    return { pts, mat, alpha: c[3] ?? 1 };
  };
  const tails = [];
  if (which === 'both' || which === 'ion') tails.push({ kind: 'ion', ...tail(ION_COUNT, seed + 11, cfg.ion_color, ION_COLOR, 0.025, 0.09, 0.08) });
  if (which === 'both' || which === 'dust') tails.push({ kind: 'dust', ...tail(DUST_COUNT, seed + 23, cfg.color, DUST_COLOR, 0.1, 0.03, 0.14) });
  for (const t of tails) t.pts.name = `${t.kind}_tail`;

  // the star, world (from the builder's light pass); the comet's motion for the dust tail's bend
  const lightWorld = new Vector3();
  out.lightAt = (p) => {
    lightWorld.copy(p);
    nucleus.lightAt?.(p);
  };
  const activity = cfg.activity === 'distance';
  const [near, far] = Array.isArray(cfg.activity_range) ? pair(cfg.activity_range, [50, 300]) : [50, 300];
  const facing = new Facing();
  /** the dust tail's lag, local (eases toward where the motion puts it) */
  const bend = new Vector3();
  const here = new Vector3();
  const dir = new Vector3();
  const u = new Vector3();
  const v = new Vector3();
  const lag = new Vector3();
  const inv = new Matrix4();
  const Y = new Vector3(0, 1, 0);
  const X = new Vector3(1, 0, 0);
  let level = 1;

  /** Coma and tails at this frame's activity */
  const apply = () => {
    const coma = now.coma * level;
    comaSprite.scale.set(coma, coma, 1);
    comaSprite.material.opacity = 0.9 * now.glow * level;
    comaSprite.visible = coma > 0 && now.glow > 0;
    for (const t of tails) {
      t.mat.uniforms.uLength.value = now.tail * level;
      t.mat.uniforms.uComa.value = coma;
      t.mat.uniforms.uSize.value = (t.kind === 'ion' ? 0.03 : 0.06) * Math.max(now.coma, now.tail * 0.08);
      // each particle is faint: the tail's light is many of them added up
      t.mat.uniforms.uOpacity.value = (t.kind === 'ion' ? 0.2 : 0.11) * t.alpha * now.glow * Math.min(1, level * 1.5);
      t.pts.visible = now.tail > 0 && level > 0 && now.glow > 0;
    }
    out.radius = Math.max(now.size, coma) / 2;
  };

  out.lod = (view) => {
    nucleus.lod?.(view);
    node.updateWorldMatrix(true, false);
    node.getWorldPosition(here);
    // the frame's units (a system's), for the activity range and the nucleus's own scale
    const frame = node.parent?.parent;
    const k = frame ? frame.matrixWorld.getMaxScaleOnAxis() : 1;
    level = activity ? activityAt(here.distanceTo(lightWorld) / Math.max(k, 1e-12), near, far) : 1;
    // away from the star, in the comet's own space
    inv.copy(node.matrixWorld).invert();
    dir.copy(here).sub(lightWorld);
    if (dir.lengthSq() === 0) dir.set(1, 0, 0);
    dir.transformDirection(inv);
    u.crossVectors(dir, Math.abs(dir.dot(Y)) > 0.9 ? X : Y).normalize();
    v.crossVectors(dir, u).normalize();
    // the dust tail lags behind the motion (across the tail); still: a gentle curve one way
    facing.move(here);
    if (facing.dir) {
      lag.copy(facing.dir).negate().transformDirection(inv);
      lag.addScaledVector(dir, -lag.dot(dir));
      if (lag.lengthSq() > 1e-12) lag.normalize().multiplyScalar(0.35);
    } else lag.copy(u).multiplyScalar(0.2);
    bend.lerp(lag, bend.lengthSq() === 0 ? 1 : 0.05);
    const cam = /** @type {any} */ (view.camera);
    const ppu = pixelSize(view.camera, node.matrixWorld.getMaxScaleOnAxis(), 1, view.height);
    for (const t of tails) {
      const un = t.mat.uniforms;
      un.uDir.value.copy(dir);
      un.uU.value.copy(u);
      un.uV.value.copy(v);
      if (t.kind === 'dust') un.uBend.value.copy(bend);
      un.uDpr.value = view.dpr;
      un.uOrtho.value = cam.isOrthographicCamera ? ppu : 0;
      un.uPxPerUnit.value = cam.isOrthographicCamera ? 0 : ppu;
    }
    apply();
  };

  // live settings (null: the built value again)
  out.live = (key, value) => {
    if (key === 'size') {
      now.size = value === null ? base.size : Math.max(1e-6, value);
      nucleus.node.scale.setScalar(now.size / base.size);
    } else if (key === 'coma_size') now.coma = value === null ? base.coma : Math.max(0, value);
    else if (key === 'tail_length') now.tail = value === null ? base.tail : Math.max(0, value);
    else if (key === 'glow') now.glow = value === null ? base.glow : Math.min(1, Math.max(0, value));
    else return false;
    apply();
    return true;
  };

  apply();
  out.tick = (/** @type {number} */ dt, /** @type {number} */ t) => {
    nucleus.tick?.(dt, t);
    for (const x of tails) x.mat.uniforms.uTime.value = t / 1000;
    return true;
  };
  out.pickMeshes.push(...nucleus.pickMeshes, comaSprite);
  out.dispose = () => { nucleus.dispose?.(); coma.dispose?.(); };
  return out;
}
