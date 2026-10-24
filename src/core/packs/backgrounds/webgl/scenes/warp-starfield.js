/**
 * `warp-starfield` scene (lazy chunk): stars on an InstancedMesh flying at
 * the camera; streaks stretch with the effect's `speed`.
 *
 * One time uniform; the vertex shader places every star, so the cost stays
 * flat at any star count. (C2 also had a per-star anime.js loop through the
 * three adapter's `getInstances()`: about 1 µs per star per frame, 4 ms at
 * 5000 stars on a real GPU, so it was dropped.) The time is the effect
 * clock (ThreeSceneEffect), so `speed` warps the stars without a jump.
 *
 * @module core/packs/backgrounds/webgl/scenes/warp-starfield
 */
import {
  Scene, PerspectiveCamera, CylinderGeometry, InstancedMesh, ShaderMaterial,
  InstancedBufferAttribute, Matrix4, AdditiveBlending, Color
} from 'three';
import { seededRandom, toColor } from './scene-helpers.js';

/** Depth of the star volume and how close stars come before wrapping */
const DEPTH = 60;
const NEAR = -0.5;
/** ms for one pass from the back to the camera at speed 1, rate 1 */
const PASS_MS = 9000;
/** Star sizes are true px (radius) at this distance; nearer stars look bigger */
const SIZE_DEPTH = 24;
const FOV = 70;
/** Stars fade in over this distance from the camera (no close-up boxes) */
const NEAR_FADE = 8;

const SHADER_VERT = /* glsl */ `
uniform float uTime;
uniform float uStretch;
uniform float uScaleXY;
attribute float aPhase;
attribute float aRate;
varying vec3 vColor;
varying float vViewDepth;
void main() {
  vec4 base = instanceMatrix * vec4( position.xy * uScaleXY, 0.0, 1.0 );
  float travel = fract( aPhase + uTime * aRate / ${PASS_MS.toFixed(1)} );
  float z = mix( ${(-DEPTH).toFixed(1)}, ${NEAR.toFixed(1)}, travel ) + position.z * uStretch;
  vec4 mv = modelViewMatrix * vec4( base.xy, z, 1.0 );
  gl_Position = projectionMatrix * mv;
  vViewDepth = -mv.z;
#ifdef USE_INSTANCING_COLOR
  vColor = instanceColor;
#else
  vColor = vec3( 1.0 );
#endif
}`;

const SHADER_FRAG = /* glsl */ `
varying vec3 vColor;
varying float vViewDepth;
void main() {
  float fade = ( 1.0 - smoothstep( ${(DEPTH * 0.45).toFixed(1)}, ${DEPTH.toFixed(1)}, vViewDepth ) ) * smoothstep( 0.0, ${NEAR_FADE.toFixed(1)}, vViewDepth );
  gl_FragColor = vec4( vColor * fade, fade );
}`;

/**
 * @param {{ params: Record<string, any>, colors: Record<string, Array<{ r: number, g: number, b: number }>> }} opts
 */
export function createScene({ params, colors }) {
  const count = Math.max(1, Math.min(20000, Math.round(params.count ?? 600)));
  const rng = seededRandom(params.seed ?? 1);
  const minR = params.min_radius ?? 0.5;
  const maxR = params.max_radius ?? 2;

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 0.1, DEPTH + 5);

  // A unit streak along z: a round head (diameter 1) at z = 0 tapering to the
  // tail at z = -1 (8 sides: round as a dot, a thinning line when stretched)
  const geometry = new CylinderGeometry(0.5, 0.2, 1, 8);
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, 0, -0.5);

  // Per star: position across the view, phase in the pass, rate, size, colour slot
  const stars = Array.from({ length: count }, () => ({
    x: (rng() * 2 - 1) * 40,
    y: (rng() * 2 - 1) * 24,
    phase: rng(),
    rate: 0.6 + rng() * 0.8,
    // Diameter in px at SIZE_DEPTH; uScaleXY turns px into world units for the card height
    size: 2 * (minR + rng() * (maxR - minR)),
    slot: rng()
  }));

  const stretch = { value: 1 };
  const scaleXY = { value: 0.01 };
  const material = new ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uStretch: stretch, uScaleXY: scaleXY },
    vertexShader: SHADER_VERT,
    fragmentShader: SHADER_FRAG,
    transparent: true,
    premultipliedAlpha: true,
    depthWrite: false,
    blending: AdditiveBlending
  });

  const mesh = new InstancedMesh(geometry, material, count);
  mesh.frustumCulled = false;
  scene.add(mesh);

  const m = new Matrix4();
  stars.forEach((s, i) => {
    m.makeScale(s.size, s.size, 1).setPosition(s.x, s.y, 0);
    mesh.setMatrixAt(i, m);
  });
  geometry.setAttribute('aPhase', new InstancedBufferAttribute(new Float32Array(stars.map((s) => s.phase)), 1));
  geometry.setAttribute('aRate', new InstancedBufferAttribute(new Float32Array(stars.map((s) => s.rate)), 1));

  const tmp = new Color();
  /** @param {Record<string, Array<{ r: number, g: number, b: number }>>} cols */
  function setColors(cols) {
    const list = cols.stars?.length ? cols.stars : [{ r: 255, g: 255, b: 255 }];
    stars.forEach((s, i) => mesh.setColorAt(i, toColor(list[Math.floor(s.slot * list.length) % list.length], tmp)));
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }
  setColors(colors);

  return {
    scene,
    camera,
    /**
     * @param {number} t - effect clock in ms (already runs at `speed`)
     * @param {{ speed: number }} effect
     */
    seek(t, effect) {
      // Streak: a dot at speed 1, a line that grows past it (warp)
      const warp = Math.max(0, (effect.speed ?? 1) - 1) * (params.streak ?? 1);
      stretch.value = 0.05 + warp * 0.9;
      material.uniforms.uTime.value = t;
    },
    /** @param {number} w @param {number} h */
    resize(w, h) {
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
      // World units per px at SIZE_DEPTH, so star radii are px whatever the card size
      scaleXY.value = (2 * SIZE_DEPTH * Math.tan((FOV * Math.PI) / 360)) / Math.max(1, h);
    },
    setParam() {},
    setColors,
    dispose() {
      geometry.dispose();
      material.dispose();
      mesh.dispose();
    }
  };
}
