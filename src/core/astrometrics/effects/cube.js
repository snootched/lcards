/**
 * `type: cube`: a cube in the scene. `style: borg` (default) is the Borg cube
 * of the screen effect, ray-marched in object space on a box: carved
 * machinery under every face, the rail lattice over it, green light from the
 * recesses and glow spots pulsing deep inside. The face functions are the
 * effect's own (borg-face-glsl.js, shared with its worker). `detail: false`
 * draws the flat faces with the lattice only (no march) for slow GPUs.
 * `style: plain` is a shaded box with its edges.
 *
 * The march writes gl_FragDepth at the hit, so other objects pass into the
 * cube's recesses correctly; labels hide behind it by its box (the depth
 * pass draws the box, at most DEPTH short of the carved surface).
 *
 * @module core/astrometrics/effects/cube
 */
import { Group, Mesh, BoxGeometry, ShaderMaterial, Matrix4, Vector3, Vector4, Color, SRGBColorSpace, EdgesGeometry, LineSegments, LineBasicMaterial, FrontSide, BackSide } from 'three';
import { BORG_FACE_GLSL } from '../../screen-effects/effects/borg-face-glsl.js';
import { seededRandom } from '../../packs/backgrounds/webgl/scenes/scene-helpers.js';
import { OCCLUDER_LAYER } from '../depth-occlusion.js';
import { built, num } from '../objects/common.js';

/** Glow spots on the faces (as the screen effect's `cubeSpots`) */
export const CUBE_SPOTS = 18;
export const CUBE_STYLES = /** @type {const} */ (['borg', 'plain']);
const DEFAULT_COLOR = 'var(--lcards-green-medium)';
const DEFAULT_GLOW = 'var(--lcards-green-lightest)';
const DEFAULT_PLAIN = 'var(--lcards-gray-medium)';

/**
 * The cube's extent per axis, scene units: a number or [x, y, z].
 * @param {any} size
 * @returns {number[]}
 */
export function cubeSize(size) {
  if (Array.isArray(size) && size.length === 3) return size.map((v) => Math.max(1e-3, num(v, 20)));
  const s = Math.max(1e-3, num(size, 20));
  return [s, s, s];
}

/**
 * Seeded glow spots, [face, u, v, phase] (one on every face first).
 * @param {number} seed
 */
export function cubeSpots(seed) {
  const rand = seededRandom(seed);
  const spots = [];
  for (let i = 0; i < CUBE_SPOTS; i++) {
    const face = i < 6 ? i : Math.floor(rand() * 6);
    spots.push([face, (rand() * 2 - 1) * 0.8, (rand() * 2 - 1) * 0.8, rand()]);
  }
  return spots;
}

// World-space maths happens on the CPU in doubles (onBeforeRender): in float32
// a cube far from the origin (true scale) would shake and march from the wrong eye
const VERT = /* glsl */ `
uniform vec3 uCamObj;
uniform vec3 uDirObj;
varying vec3 vObj;
varying vec3 vCamObj;
varying vec3 vDirObj;
void main() {
  vObj = position;
  vCamObj = uCamObj;
  // the view direction, for an orthographic camera (parallel rays)
  vDirObj = uDirObj;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const FRAG = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uGlow;
uniform float uTime;
uniform float uDetail;
uniform float uOpacity;
uniform vec4 uSpots[${CUBE_SPOTS}];
// three gives a fragment shader the view matrix only; model-view comes from the CPU
uniform mat4 uModelView;
uniform mat4 uProj;
varying vec3 vObj;
varying vec3 vCamObj;
varying vec3 vDirObj;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
${BORG_FACE_GLSL}
void main() {
  vec3 rd = isOrthographic ? normalize(vDirObj) : normalize(vObj - vCamObj);
  vec3 ro = isOrthographic ? vObj - rd * 4.0 : vCamObj;
  rd += vec3(equal(rd, vec3(0.0))) * 1e-6;
  vec3 nC, nL;
  float tIn = boxHit(ro, rd, 1.0, nC);
  if (tIn < 0.0) tIn = 0.0;   // the camera inside the box: start here
  // flat faces (detail off) carry the lattice on the face itself
  float latB = uDetail > 0.5 ? 1.0 - DEPTH * 0.3 : 1.0;
  float tLat = boxHit(ro, rd, latB, nL);
  // how big a pixel is on the cube, in face units
  float pxUV = max(length(fwidth(vObj)), 1e-4);

  // ── Relief march through the carved shell (as the screen effect) ──
  float tHit = -1.0;
  vec3 n = vec3(0.0);
  float t0 = tIn;
  int k0 = uDetail > 0.5 ? outsideAxis(ro + rd * (tIn + 1e-4)) : -1;
  if (k0 < 0) { tHit = tIn; n = nC; }
  else {
    float dt = DEPTH / 6.0;
    for (int i = 0; i < 56; i++) {
      float t1 = t0 + dt;
      vec3 p = ro + rd * t1;
      if (max(abs(p.x), max(abs(p.y), abs(p.z))) > 1.0001) break;
      int k = outsideAxis(p);
      if (k < 0) { tHit = t1; break; }
      t0 = t1; k0 = k;
    }
    if (tHit > 0.0) {
      for (int i = 0; i < 6; i++) {
        float tm = (t0 + tHit) * 0.5;
        int k = outsideAxis(ro + rd * tm);
        if (k < 0) tHit = tm; else { t0 = tm; k0 = k; }
      }
      vec3 pa = ro + rd * t0, pb = ro + rd * tHit;
      float da = reliefDepth(axisUV(pa, k0), axisFace(pa, k0));
      float db = reliefDepth(axisUV(pb, k0), axisFace(pb, k0));
      if (abs(da - db) < 1e-4) {
        n[k0] = sign(pb[k0]);
      } else {
        int u = (k0 + 1) - 3 * ((k0 + 1) / 3), v = (k0 + 2) - 3 * ((k0 + 2) / 3);
        int w = abs(rd[u]) > abs(rd[v]) ? u : v;
        n[w] = -sign(rd[w]);
      }
    }
  }

  // view space: three's camera looks down -z with +y up
  vec3 L = normalize(vec3(-0.45, 0.55, 0.7));
  vec3 col = vec3(0.0);
  float a = 0.0;
  vec3 pDepth = ro + rd * max(tHit, tIn);
  if (tHit >= 0.0) {
    vec3 p = ro + rd * tHit;
    vec3 ap = abs(p);
    int k = ap.x > ap.y ? (ap.x > ap.z ? 0 : 2) : (ap.y > ap.z ? 1 : 2);
    vec2 uv = axisUV(p, k);
    float face = axisFace(p, k);
    float rise = uDetail > 0.5 ? 1.0 - clamp((1.0 - ap[k]) / DEPTH, 0.0, 1.0) : 1.0;
    bool wall = abs(n[k]) < 0.5;
    vec3 nv = normalize((uModelView * vec4(n, 0.0)).xyz);
    vec3 faceN = vec3(k == 0, k == 1, k == 2) * sign(p[k]);
    vec3 faceNv = normalize((uModelView * vec4(faceN, 0.0)).xyz);
    float diff = max(dot(nv, L), 0.0);
    float top = smoothstep(0.35, 0.85, faceNv.y);
    vec3 side = mix(vec3(0.2, 0.25, 0.21), uColor * 0.5, 0.6);
    vec3 metal = mix(side, vec3(0.34, 0.38, 0.35), top);
    metal *= 0.7 + 0.6 * hash(floor((uv * 0.5 + 0.5) * 14.0 + 0.37) + face);
    vec4 fine = greebleLayer((uv * 0.5 + 0.5) * 36.0 + 0.71, face * 17.0 + 9.0);
    float fineK = 1.0 - smoothstep(0.2, 0.45, pxUV * 36.0);
    float detail = wall
      ? 0.75 + 0.25 * step(0.5, fract((1.0 - ap[k]) * 90.0))
      : (1.0 + 0.6 * fine.y * fineK) * (1.0 - 0.6 * fine.z * fineK);
    // flat faces (detail off): the machinery as shading only
    if (uDetail < 0.5) detail *= 0.55 + 0.45 * (1.0 - reliefDepth(uv, face) / DEPTH);
    float ao = mix(0.3, 1.0, rise);
    col = metal * (0.3 + 1.0 * diff) * ao * detail;
    col += uColor * 0.16 * (1.0 - rise) * (1.0 - top);
    for (int i = 0; i < ${CUBE_SPOTS}; i++) {
      vec4 sp = uSpots[i];
      if (abs(sp.x - face) > 0.5) continue;
      float d = length(uv - sp.yz);
      float period = 2000.0 + 3000.0 * fract(sp.w * 7.31);
      float pulse = 0.55 + 0.45 * sin(uTime / period * 6.2832 + sp.w * 6.2832);
      float gl = exp(-d * d / 0.03) * pulse;
      col += mix(uColor, uGlow, 0.3) * gl * (0.6 + 2.2 * (1.0 - rise) + 0.8 * diff);
    }
    a = 1.0;
  }
  // the rail lattice over the machinery in front of it
  if (tLat >= 0.0 && (tHit < 0.0 || tLat <= tHit + 1e-5)) {
    vec3 pl = ro + rd * tLat;
    float axisL;
    vec2 uvL = faceUV(pl, nL, axisL) / latB;
    float faceL = axisL * 2.0 + (dot(nL, vec3(1.0)) > 0.0 ? 1.0 : 0.0);
    vec3 nLv = normalize((uModelView * vec4(nL, 0.0)).xyz);
    float lat = lattice(uvL, faceL, pxUV * 2.0) * 0.9;
    vec3 latCol = mix(vec3(0.55, 0.6, 0.57), uColor * 0.8, 0.25) * (0.5 + 0.5 * max(dot(nLv, L), 0.0));
    col = latCol * lat + col * (1.0 - lat);
    a = lat + a * (1.0 - lat);
    if (a == lat) pDepth = pl;
  }
  if (a < 0.5) discard;
  gl_FragColor = vec4(col / a, uOpacity);
  vec4 clip = uProj * uModelView * vec4(pDepth, 1.0);
  gl_FragDepth = clamp(clip.z / clip.w * 0.5 + 0.5, 0.0, 1.0);
}`;

const PLAIN_VERT = /* glsl */ `
varying vec3 vN;
void main() {
  vN = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const PLAIN_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
varying vec3 vN;
void main() {
  float diff = max(dot(normalize(vN), normalize(vec3(-0.45, 0.55, 0.7))), 0.0);
  gl_FragColor = vec4(uColor * (0.35 + 0.65 * diff), uOpacity);
}`;

/** @param {number[]} c - straight sRGB 0..1 @returns {Vector3} linear */
function linear(c) {
  const col = new Color().setRGB(c[0], c[1], c[2], SRGBColorSpace);
  return new Vector3(col.r, col.g, col.b);
}

/**
 * @param {any} cfg
 * @param {import('../objects/common.js').BuildContext} ctx
 * @returns {import('../objects/common.js').BuiltObject}
 */
export function buildCube(cfg, ctx) {
  const node = new Group();
  node.name = `cube:${cfg.id ?? ''}`;
  const [sx, sy, sz] = cubeSize(cfg.size);
  const out = built(cfg, node, { radius: Math.hypot(sx, sy, sz) / 2 });
  // a box of half size 1, scaled to the size (the shaders work on the unit box)
  const geo = new BoxGeometry(2, 2, 2);
  /** @type {Mesh} */
  let mesh;
  if (cfg.style === 'plain') {
    const c = ctx.color(cfg.color, DEFAULT_PLAIN);
    const opacity = num(cfg.opacity, 1) * (c[3] ?? 1);
    const mat = new ShaderMaterial({
      uniforms: { uColor: { value: linear(c) }, uOpacity: { value: opacity } },
      vertexShader: PLAIN_VERT,
      fragmentShader: PLAIN_FRAG,
      transparent: opacity < 1,
      depthWrite: opacity >= 1,
      // the edges sit on the faces: push the faces back a little so the edges win
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1
    });
    mesh = new Mesh(geo, mat);
    if (cfg.edges !== false) {
      const e = ctx.color(cfg.edge_color, 'theme:colors.ui.secondary');
      const lines = new LineSegments(new EdgesGeometry(geo), new LineBasicMaterial({ color: new Color().setRGB(e[0], e[1], e[2], SRGBColorSpace), transparent: true, opacity: e[3] ?? 1 }));
      lines.name = 'edges';
      mesh.add(lines);
    }
  } else {
    const spots = cubeSpots(num(cfg.seed, 1));
    const uniforms = {
      uColor: { value: linear(ctx.color(cfg.color, DEFAULT_COLOR)) },
      uGlow: { value: linear(ctx.color(cfg.glow_color, DEFAULT_GLOW)) },
      uTime: { value: 0 },
      uDetail: { value: cfg.detail === false ? 0 : 1 },
      // 1: the distance fade scales it while the cube fades out
      uOpacity: { value: 1 },
      uSpots: { value: spots.map((s) => new Vector4(s[0], s[1], s[2], s[3])) },
      uModelView: { value: new Matrix4() },
      uProj: { value: new Matrix4() },
      uCamObj: { value: new Vector3() },
      uDirObj: { value: new Vector3() }
    };
    const mat = new ShaderMaterial({
      name: 'lcards-borg-cube',
      uniforms,
      vertexShader: VERT,
      fragmentShader: FRAG,
      side: FrontSide
    });
    // the camera inside the box would see no front faces: draw the back ones then too
    mesh = new Mesh(geo, mat);
    const toObj = new Matrix4();
    mesh.onBeforeRender = (_r, _s, camera) => {
      uniforms.uModelView.value.multiplyMatrices(camera.matrixWorldInverse, mesh.matrixWorld);
      uniforms.uProj.value.copy(camera.projectionMatrix);
      const local = mesh.worldToLocal(camera.getWorldPosition(new Vector3()));
      uniforms.uCamObj.value.copy(local);
      const fwd = camera.getWorldDirection(new Vector3());
      uniforms.uDirObj.value.copy(fwd.transformDirection(toObj.copy(mesh.matrixWorld).invert()));
      const inside = Math.max(Math.abs(local.x), Math.abs(local.y), Math.abs(local.z)) < 1;
      mat.side = inside ? BackSide : FrontSide;
    };
    // the spots pulse on the scene clock (held under reduced motion)
    out.tick = (_dt, t) => {
      uniforms.uTime.value = t;
      return true;
    };
  }
  mesh.name = 'cube';
  mesh.scale.set(sx / 2, sy / 2, sz / 2);
  node.add(mesh);
  out.pickMeshes.push(mesh);
  out.occludes = cfg.occlude !== false;
  out.occluder = 'depth';
  if (out.occludes) mesh.layers.enable(OCCLUDER_LAYER);
  return out;
}
