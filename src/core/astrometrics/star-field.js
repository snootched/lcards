/**
 * Star fields for the astrometrics scene: `backdrop.stars` (a shell at
 * infinity that stays round the camera) and `backdrop.dust` (particles at
 * a finite distance round the scene, so any camera move shows parallax).
 *
 * Every star is a camera-facing quad drawn in screen px (round, `size` px
 * across at any distance, as the `starfield` preset's stars). During a warp
 * fly-to the quad stretches from where the star was to where it is: the
 * vertex shader projects the star and the star moved by `tail` (scene
 * units, opposite the camera's motion), so streaks point away from the
 * direction of flight, longer the faster the camera moves, faint at the
 * tail. `spectrum` Doppler shifts each star's own colour along its streak
 * (violet toward the tail, red toward the head; the TNG warp look).
 *
 * @module core/astrometrics/star-field
 */
import { InstancedBufferGeometry, InstancedBufferAttribute, Float32BufferAttribute, Uint16BufferAttribute, Mesh, ShaderMaterial, Vector2, Vector3 } from 'three';
import { SPECTRUM_GLSL } from '../packs/backgrounds/webgl/scenes/spectrum-glsl.js';

const VERT = /* glsl */ `
attribute vec2 corner;
attribute vec3 iPos;
attribute float iSize;
attribute vec4 iColor;
uniform vec3 uTail;
uniform vec2 uRes;
uniform float uDpr;
varying vec4 vColor;
varying vec2 vQ;
varying float vLen;
varying float vR;
void main() {
  vec4 h = projectionMatrix * modelViewMatrix * vec4( iPos, 1.0 );
  vColor = iColor;
  if ( h.w <= 1e-4 ) { gl_Position = vec4( 2.0, 2.0, 2.0, 1.0 ); return; }
  vec4 t = projectionMatrix * modelViewMatrix * vec4( iPos + uTail, 1.0 );
  // a tail behind the camera: no streak
  if ( t.w <= 1e-4 ) t = h;
  vec2 halfRes = 0.5 * uRes;
  vec2 hs = h.xy / h.w * halfRes;
  vec2 ts = t.xy / t.w * halfRes;
  vec2 d = hs - ts;
  float len = length( d );
  vec2 dir = len > 1e-3 ? d / len : vec2( 1.0, 0.0 );
  vec2 across = vec2( -dir.y, dir.x );
  // at least a pixel across, so the smallest stars still show
  float r = max( 0.5, 0.5 * iSize * uDpr ) + 0.5;
  // from r before the tail to r past the head
  float s = mix( -r, len + r, corner.x );
  vec2 p = ts + dir * s + across * ( corner.y * r );
  vQ = vec2( s, corner.y * r );
  vLen = len;
  vR = r - 0.5;
  gl_Position = vec4( p / halfRes * h.w, h.z, h.w );
}`;

const FRAG = /* glsl */ `
precision highp float;
varying vec4 vColor;
varying vec2 vQ;
varying float vLen;
varying float vR;
uniform float uOpacity;
uniform float uSpectrum;
// 1: Doppler (violet at the tail), -1: reversed
uniform float uSpectrumDir;

${SPECTRUM_GLSL}
void main() {
  // distance to the streak (a segment along x from the tail, 0, to the head, vLen)
  float along = clamp( vQ.x, 0.0, vLen );
  float dist = length( vec2( vQ.x - along, vQ.y ) );
  float a = clamp( vR - dist + 0.5, 0.0, 1.0 );
  if ( a <= 0.0 ) discard;
  float f = vLen > 0.5 ? along / vLen : 1.0;
  float streaking = smoothstep( 2.0, 24.0, vLen );
  // a streak fades toward its tail, and spreads its light thinner the longer it is
  a *= mix( 1.0, mix( 0.1, 1.0, f ) * 0.8, streaking );
  // the star's own colour Doppler shifted along the streak (spectrum-glsl.js)
  float k = uSpectrum * streaking;
  vec3 rgb = vColor.rgb;
  if ( k > 0.0 ) {
    vec4 w = warpSpectrum( vColor.rgb, f, uSpectrumDir );
    rgb = mix( vColor.rgb, w.rgb, k );
    a *= mix( 1.0, w.a, k );
  }
  gl_FragColor = vec4( rgb, a * vColor.a * uOpacity );
}`;

/**
 * @typedef {Object} StarField
 * @property {Mesh} mesh
 * @property {(tail: Vector3 | null) => void} setTail - scene units, null for none (round stars)
 * @property {(width: number, height: number, dpr: number) => void} setResolution - CSS px and the pixel ratio
 */

/**
 * @param {{ positions: Float32Array, sizes: Float32Array, colors: Float32Array, opacity?: number, spectrum?: boolean, reverse?: boolean }} o -
 *   positions xyz, sizes px across, colors straight sRGB rgba; reverse flips the spectrum (violet at the head)
 * @returns {StarField}
 */
export function createStarField({ positions, sizes, colors, opacity = 1, spectrum = false, reverse = false }) {
  const n = sizes.length;
  const geo = new InstancedBufferGeometry();
  // x: 0 tail .. 1 head; y: across
  geo.setAttribute('corner', new Float32BufferAttribute([0, -1, 1, -1, 1, 1, 0, 1], 2));
  // three.js needs a position attribute to draw; the shader does not read it
  geo.setAttribute('position', new Float32BufferAttribute(new Float32Array(12), 3));
  geo.setIndex(new Uint16BufferAttribute([0, 1, 2, 0, 2, 3], 1));
  geo.setAttribute('iPos', new InstancedBufferAttribute(positions, 3));
  geo.setAttribute('iSize', new InstancedBufferAttribute(sizes, 1));
  geo.setAttribute('iColor', new InstancedBufferAttribute(colors, 4));
  geo.instanceCount = n;
  const u = {
    uTail: { value: new Vector3() },
    uRes: { value: new Vector2(1, 1) },
    uDpr: { value: 1 },
    uOpacity: { value: opacity },
    uSpectrum: { value: spectrum ? 1 : 0 },
    uSpectrumDir: { value: reverse ? -1 : 1 }
  };
  const material = new ShaderMaterial({ uniforms: u, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false });
  const mesh = new Mesh(geo, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;
  return {
    mesh,
    setTail(tail) {
      if (tail) u.uTail.value.copy(tail);
      else u.uTail.value.set(0, 0, 0);
    },
    setResolution(width, height, dpr) {
      u.uRes.value.set(Math.max(1, width * dpr), Math.max(1, height * dpr));
      u.uDpr.value = dpr;
    }
  };
}

/**
 * How long the streaks are this frame, from the camera's motion during a
 * warp fly-to: the stars' tail (they sit at `shell` units) and the dust's.
 * Speed counts against `scale`, the camera's distance from what it looks at:
 * a camera moving its own distance in a second streaks the stars by about
 * 0.05 x `streak` radians, so a long flight streaks the same at any scale (a
 * hop between planets measured in km, a jump across a galaxy in ly). Dust
 * trails the last 0.1 x `streak` seconds of motion. Pure, for the runtime
 * and the tests.
 * @param {{ x: number, y: number, z: number }} moved - camera position change this frame, scene units
 * @param {number} dtMs
 * @param {{ scale: number, shell: number, streak: number }} o
 * @returns {{ stars: Vector3, dust: Vector3, speed: number } | null} null when it does not move
 */
export function warpTails(moved, dtMs, { scale, shell, streak }) {
  const dist = Math.hypot(moved.x, moved.y, moved.z);
  if (!(dtMs > 0) || !(dist > 0) || !(streak > 0)) return null;
  const speed = dist / (dtMs / 1000);
  const dir = new Vector3(moved.x, moved.y, moved.z).divideScalar(dist);
  // the stars were nearer the direction of flight: their tail points along it
  const angle = Math.min(0.4, 0.05 * streak * (speed / Math.max(1e-300, scale)));
  return {
    stars: dir.clone().multiplyScalar(shell * angle),
    dust: dir.clone().multiplyScalar(speed * 0.1 * streak),
    speed
  };
}

/**
 * The streaks at warp (the card's `warp`, warp-drive.js): the camera does not
 * move, the stars stream as if it flew along its view, longer with the warp
 * factor as the ship comes up to speed (`level` 0 to 1).
 * @param {{ x: number, y: number, z: number }} forward - the view direction, unit length
 * @param {{ level: number, factor: number, scale: number, shell: number, streak: number }} o -
 *   `scale` the camera's distance from what it looks at (the dust's streaks)
 * @returns {{ stars: Vector3, dust: Vector3 } | null}
 */
export function cruiseTails(forward, { level, factor, scale, shell, streak }) {
  if (!(level > 0) || !(streak > 0)) return null;
  const dir = new Vector3(forward.x, forward.y, forward.z).normalize();
  const angle = Math.min(0.4, (0.03 + 0.025 * factor) * streak) * level;
  return { stars: dir.clone().multiplyScalar(shell * angle), dust: dir.clone().multiplyScalar(scale * 0.06 * factor * level * streak) };
}
