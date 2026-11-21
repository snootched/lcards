/**
 * `type: asteroid`: one irregular rock, made for a close look (a belt's
 * rocks are made to be seen by the thousand). Seeded: broad lumps, knobs,
 * craters and fine roughness pushed into a sphere, stretched along its own
 * axes, smooth-shaded so the craters' bowls shade. `size` is its largest
 * extent; `tumble` turns it on a seeded axis (degrees per second; off under
 * reduced motion, as all motion is).
 *
 * Lit from `light` (a point id or [x, y, z], default the origin of the
 * frame it is in: its star): the near side bright, a hard terminator, the
 * far side dark. The light's world position comes from the scene builder
 * every layout pass (`lightAt`) and goes into view space on the CPU, in
 * doubles, so an asteroid at true scale far from the origin is lit steadily.
 *
 * Far away it becomes a dot (as a belt's rocks do): when the rock would be
 * under about 1.5 px on screen, one point in its colour, as bright as its
 * lit part seen from here (a moon's phase), takes over.
 *
 * @module core/astrometrics/objects/asteroid
 */
import {
  Group, Mesh, IcosahedronGeometry, ShaderMaterial, Vector3, Color, SRGBColorSpace, BufferGeometry, BufferAttribute, Points, EdgesGeometry
} from 'three';
import { seededRandom } from '../../packs/backgrounds/webgl/scenes/scene-helpers.js';
import { OCCLUDER_LAYER } from '../depth-occlusion.js';
import { built, num } from './common.js';
import { addDiagram, edgeRuns } from './diagram.js';
import { pixelSize, useDots } from './belt.js';

const DEG = Math.PI / 180;
const DEFAULT_COLOR = 'var(--lcards-gray-light)';
const DEFAULT_SIZE = 4;

const VERT = /* glsl */ `
uniform vec3 uLight;
varying vec3 vNormal;
varying vec3 vToLight;
varying vec3 vPos;
void main() {
  vPos = position;
  vec4 view = modelViewMatrix * vec4( position, 1.0 );
  vNormal = normalize( normalMatrix * normal );
  // uLight is in view space already (worked out in doubles on the CPU)
  vToLight = uLight - view.xyz;
  gl_Position = projectionMatrix * view;
}`;

const FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
uniform float uSeed;
varying vec3 vNormal;
varying vec3 vToLight;
varying vec3 vPos;
float hash( vec3 p ) {
  p = fract( p * 0.3183099 + uSeed );
  p *= 17.0;
  return fract( p.x * p.y * p.z * ( p.x + p.y + p.z ) );
}
// value noise on the rock's own position (it turns with the rock)
float noise( vec3 x ) {
  vec3 i = floor( x );
  vec3 f = fract( x );
  f = f * f * ( 3.0 - 2.0 * f );
  return mix( mix( mix( hash( i ), hash( i + vec3( 1, 0, 0 ) ), f.x ), mix( hash( i + vec3( 0, 1, 0 ) ), hash( i + vec3( 1, 1, 0 ) ), f.x ), f.y ),
              mix( mix( hash( i + vec3( 0, 0, 1 ) ), hash( i + vec3( 1, 0, 1 ) ), f.x ), mix( hash( i + vec3( 0, 1, 1 ) ), hash( i + vec3( 1, 1, 1 ) ), f.x ), f.y ), f.z );
}
void main() {
  float lit = max( dot( normalize( vNormal ), normalize( vToLight ) ), 0.0 );
  // mottled regolith: broad patches and fine grain
  float mottle = 0.72 + 0.22 * noise( vPos * 3.0 ) + 0.12 * noise( vPos * 14.0 );
  // a hard terminator and a dim night side (no air to spread the light)
  gl_FragColor = vec4( uColor * mottle * ( 0.06 + 0.94 * lit ), uOpacity );
}`;

const DOT_VERT = /* glsl */ `
uniform vec3 uLight;
uniform float uSize;
uniform float uPxPerUnit;
uniform float uOrtho;
uniform float uDpr;
varying float vCover;
varying float vPhase;
void main() {
  vec4 mv = modelViewMatrix * vec4( position, 1.0 );
  vPhase = 0.5 + 0.5 * dot( normalize( uLight - mv.xyz ), normalize( -mv.xyz ) );
  float px = uSize * ( uOrtho > 0.0 ? uOrtho : uPxPerUnit / max( -mv.z, 1e-6 ) ) * uDpr;
  gl_PointSize = max( px, 1.0 );
  vCover = clamp( px * px, 0.0, 1.0 );
  gl_Position = projectionMatrix * mv;
}`;

const DOT_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
varying float vCover;
varying float vPhase;
void main() {
  gl_FragColor = vec4( uColor * ( 0.08 + 0.6 * vPhase ), uOpacity * vCover );
}`;

/** The icosahedron detail of the diagram look's coarse rock (12 for the rock itself) */
const DIAGRAM_DETAIL = 2;

/**
 * The rock's shape (pure, seeded): unit-sphere corners pushed out by broad
 * lumps and medium knobs, in by craters (a bowl with a raised rim) and a
 * little at random, then stretched along its own axes. Smooth shading (so
 * a crater's bowl shades), largest extent 2.
 * @param {any} seed
 * @param {number} [detail] - icosahedron subdivisions (12: the rock; fewer: the diagram look's coarse one)
 * @returns {BufferGeometry}
 */
export function asteroidGeometry(seed, detail = 12) {
  const rnd = seededRandom(num(seed, 1) + 101);
  const unit = () => {
    const v = new Vector3(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1);
    return v.lengthSq() > 1e-6 ? v.normalize() : new Vector3(0, 1, 0);
  };
  // broad lumps (the overall potato), medium knobs and hollows, craters
  const lumps = Array.from({ length: 6 }, () => ({ dir: unit(), amp: (rnd() * 2 - 1) * 0.35, width: 1 + rnd() * 2 }));
  const knobs = Array.from({ length: 24 }, () => ({ dir: unit(), amp: (rnd() * 2 - 1) * 0.12, width: 6 + rnd() * 10 }));
  const craters = [
    ...Array.from({ length: 6 + Math.floor(rnd() * 6) }, () => ({ dir: unit(), r: 0.12 + Math.pow(rnd(), 2) * 0.4, depth: 0.8 + rnd() * 0.6 })),
    // many small ones
    ...Array.from({ length: 40 }, () => ({ dir: unit(), r: 0.04 + rnd() * 0.07, depth: 1 + rnd() * 0.6 }))
  ];
  const stretch = [1, 0.6 + rnd() * 0.3, 0.5 + rnd() * 0.3];

  const base = new IcosahedronGeometry(1, detail);
  const pos = base.getAttribute('position');
  /** @type {Map<string, number>} the same corner moves the same way on every face it belongs to */
  const pushes = new Map();
  const v = new Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.set(pos.getX(i), pos.getY(i), pos.getZ(i));
    const key = `${v.x.toFixed(4)},${v.y.toFixed(4)},${v.z.toFixed(4)}`;
    let k = pushes.get(key);
    if (k === undefined) {
      k = 1;
      // broad lumps and hollows: a smooth bump round each direction
      for (const l of lumps) k += l.amp * Math.exp(-l.width * (1 - v.dot(l.dir)) * 4);
      for (const l of knobs) k += l.amp * Math.exp(-l.width * (1 - v.dot(l.dir)) * 4);
      // craters: a bowl inside r (deeper for a wider one), a raised rim just past it
      for (const c of craters) {
        const a = Math.acos(Math.min(1, Math.max(-1, v.dot(c.dir))));
        const t = a / c.r;
        const d = c.depth * c.r;
        if (t < 1) k -= d * (1 - t * t);
        else if (t < 1.5) k += d * 0.3 * Math.sin(((t - 1) / 0.5) * Math.PI);
      }
      k += (rnd() - 0.5) * 0.03;
      pushes.set(key, k);
    }
    pos.setXYZ(i, v.x * k * stretch[0], v.y * k * stretch[1], v.z * k * stretch[2]);
  }
  const geo = base.index ? base.toNonIndexed() : base;
  geo.computeVertexNormals();
  smoothNormals(geo);
  // largest extent 2 (a unit "radius"), centred
  geo.computeBoundingBox();
  const box = /** @type {import('three').Box3} */ (geo.boundingBox);
  const c = box.getCenter(new Vector3());
  const e = box.getSize(new Vector3());
  const s = 2 / Math.max(e.x, e.y, e.z, 1e-9);
  geo.translate(-c.x, -c.y, -c.z);
  geo.scale(s, s, s);
  geo.computeBoundingSphere();
  return geo;
}

/**
 * Smooth shading on a non-indexed geometry: each corner's normal the mean
 * of the faces' normals at that place.
 * @param {BufferGeometry} geo - flat normals computed
 */
function smoothNormals(geo) {
  const pos = geo.getAttribute('position');
  const nor = geo.getAttribute('normal');
  /** @type {Map<string, Vector3>} */
  const sum = new Map();
  const key = (/** @type {number} */ i) => `${pos.getX(i).toFixed(5)},${pos.getY(i).toFixed(5)},${pos.getZ(i).toFixed(5)}`;
  for (let i = 0; i < pos.count; i++) {
    const k = key(i);
    const v = sum.get(k) ?? new Vector3();
    v.x += nor.getX(i); v.y += nor.getY(i); v.z += nor.getZ(i);
    sum.set(k, v);
  }
  for (const v of sum.values()) v.normalize();
  for (let i = 0; i < pos.count; i++) {
    const v = /** @type {Vector3} */ (sum.get(key(i)));
    nor.setXYZ(i, v.x, v.y, v.z);
  }
  nor.needsUpdate = true;
}

/**
 * The seeded axis a rock tumbles round (unit length).
 * @param {any} seed
 */
export function tumbleAxis(seed) {
  const rnd = seededRandom(num(seed, 1) + 202);
  const v = new Vector3(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1);
  return v.lengthSq() > 1e-6 ? v.normalize() : new Vector3(0, 1, 0);
}

/**
 * @param {any} cfg
 * @param {import('./common.js').BuildContext} ctx
 * @returns {import('./common.js').BuiltObject}
 */
export function buildAsteroid(cfg, ctx) {
  const node = new Group();
  node.name = `asteroid:${cfg.id ?? ''}`;
  const size = Math.max(1e-6, num(cfg.size, DEFAULT_SIZE));
  const out = built(cfg, node, { radius: size / 2 });

  const c = ctx.color(cfg.color, DEFAULT_COLOR);
  const linear = new Color().setRGB(c[0], c[1], c[2], SRGBColorSpace);
  const opacity = num(cfg.opacity, 1) * (c[3] ?? 1);
  /** where the light is, view space (set before each draw) */
  const lightView = new Vector3();
  const color = new Color(linear.r, linear.g, linear.b);
  const mat = new ShaderMaterial({
    uniforms: { uLight: { value: lightView }, uColor: { value: color }, uOpacity: { value: opacity }, uSeed: { value: (num(cfg.seed, 1) * 0.618) % 1 } },
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: opacity < 1,
    depthWrite: opacity >= 1
  });
  const mesh = new Mesh(asteroidGeometry(cfg.seed), mat);
  mesh.name = 'rock';
  mesh.scale.setScalar(size / 2);
  // tumbles inside the node (which spins, faces and is placed by the scene)
  const spinner = new Group();
  spinner.add(mesh);
  // the diagram look: the same rock made coarse (its lumps and big craters, about 300 faces) drawn as
  // its edges, tumbling with it; far away the dot stands in, as in every look
  const coarse = asteroidGeometry(cfg.seed, DIAGRAM_DETAIL);
  const edges = new EdgesGeometry(coarse, 1);
  addDiagram(out, { runs: edgeRuns(edges, size / 2), color: c, body: [mesh], parent: spinner });
  edges.dispose();
  coarse.dispose();

  const dotMat = new ShaderMaterial({
    uniforms: {
      uLight: { value: lightView }, uColor: { value: color }, uOpacity: { value: opacity },
      uSize: { value: size }, uPxPerUnit: { value: 1 }, uOrtho: { value: 0 }, uDpr: { value: 1 }
    },
    vertexShader: DOT_VERT,
    fragmentShader: DOT_FRAG,
    transparent: true,
    depthWrite: false
  });
  const dotGeo = new BufferGeometry();
  dotGeo.setAttribute('position', new BufferAttribute(new Float32Array(3), 3));
  const dot = new Points(dotGeo, dotMat);
  dot.name = 'dot';
  dot.visible = false;
  node.add(spinner, dot);

  /** The light, world (from the builder; until then the frame's origin, the scene origin) */
  const lightWorld = new Vector3();
  out.lightAt = (p) => { lightWorld.copy(p); };
  // into view space in doubles, before each draw of either
  const toView = (/** @type {import('three').Camera} */ camera) => { lightView.copy(lightWorld).applyMatrix4(camera.matrixWorldInverse); };
  mesh.onBeforeRender = (_r, _s, camera) => toView(camera);
  dot.onBeforeRender = (_r, _s, camera) => toView(camera);

  let dots = false;
  const here = new Vector3();
  out.lod = ({ camera, height, dpr }) => {
    node.getWorldPosition(here);
    // own units to world (a system's frame)
    const k = node.matrixWorld.getMaxScaleOnAxis();
    const dist = Math.max(0, here.distanceTo(camera.position) - (size / 2) * k);
    const next = useDots(dots, pixelSize(camera, size * k, dist, height));
    const cam = /** @type {any} */ (camera);
    dotMat.uniforms.uDpr.value = dpr;
    dotMat.uniforms.uOrtho.value = cam.isOrthographicCamera ? pixelSize(camera, k, 1, height) : 0;
    dotMat.uniforms.uPxPerUnit.value = cam.isOrthographicCamera ? 0 : pixelSize(camera, k, 1, height);
    if (next === dots) return;
    dots = next;
    spinner.visible = !dots;
    dot.visible = dots;
  };

  const axis = tumbleAxis(cfg.seed);
  const tumble = num(cfg.tumble, 10);
  const phase = seededRandom(num(cfg.seed, 1) + 303)() * 360;
  spinner.quaternion.setFromAxisAngle(axis, phase * DEG);
  out.tick = tumble !== 0 ? (/** @type {number} */ _dt, /** @type {number} */ t) => {
    spinner.quaternion.setFromAxisAngle(axis, (phase + (tumble * t) / 1000) * DEG);
    return true;
  } : null;

  out.pickMeshes.push(mesh);
  out.occludes = cfg.occlude !== false;
  out.occluder = 'depth';
  if (out.occludes) mesh.layers.enable(OCCLUDER_LAYER);
  return out;
}
