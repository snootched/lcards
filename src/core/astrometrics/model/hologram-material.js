/**
 * The hologram look for `model` objects: one shader for every mesh of a
 * model (the uniforms are shared, so one tick moves the scan band on all of
 * them). A faint body in the theme colour, a bright Fresnel rim, screen-space
 * scanlines and the scan band (`scanAt`, the grid's sweep) running along the
 * model's longest axis, drawn additively.
 *
 * Colours are straight sRGB written as they are, like the grid shader. A
 * depth-only copy of each mesh (`depthOnlyMaterial`) drawn first makes the
 * model solid: its far side and what is behind it stay hidden.
 *
 * @module core/astrometrics/model/hologram-material
 */
import { ShaderMaterial, MeshBasicMaterial, AdditiveBlending, NormalBlending, DoubleSide, FrontSide, Matrix4, Vector3 } from 'three';

const VERT = /* glsl */ `
uniform mat4 uToModel;
varying vec3 vNormal;
varying vec3 vView;
varying float vAxis;
uniform vec3 uAxis;
#include <common>
#include <skinning_pars_vertex>
#include <morphtarget_pars_vertex>
void main() {
  #include <skinbase_vertex>
  #include <begin_vertex>
  #include <morphtarget_vertex>
  #include <skinning_vertex>
  #include <beginnormal_vertex>
  #include <morphnormal_vertex>
  #include <skinnormal_vertex>
  vec4 mv = modelViewMatrix * vec4(transformed, 1.0);
  vNormal = normalize(normalMatrix * objectNormal);
  vView = -mv.xyz;
  // where along the scan axis, in the model's own (file) space
  vAxis = dot((uToModel * modelMatrix * vec4(transformed, 1.0)).xyz, uAxis);
  gl_Position = projectionMatrix * mv;
}
`;

const FRAG = /* glsl */ `
uniform vec4 uColor;
uniform vec4 uRim;
uniform vec4 uScan;
uniform float uOpacity;
uniform float uFill;
uniform float uScanlines;
uniform float uLinePx;
uniform vec2 uRange;
uniform float uScanPos;
uniform float uScanStrength;
varying vec3 vNormal;
varying vec3 vView;
varying float vAxis;
void main() {
  vec3 n = normalize(vNormal);
  vec3 v = normalize(vView);
  float facing = abs(dot(n, v));
  float rim = pow(1.0 - facing, 2.2);
  vec3 c = uColor.rgb * uFill * uColor.a + uRim.rgb * rim * uRim.a;
  // scanlines: dark rows every uLinePx device px
  float line = 0.5 + 0.5 * sin(gl_FragCoord.y * 3.14159265 / uLinePx);
  c *= 1.0 - uScanlines * 0.6 * line;
  // the scan band: a bright slice moving along the axis
  float t = (vAxis - uRange.x) / max(1e-5, uRange.y - uRange.x);
  float band = exp(-pow((t - uScanPos) / 0.035, 2.0)) * uScanStrength;
  c += uScan.rgb * band * uScan.a;
  gl_FragColor = vec4(c * uOpacity, 1.0);
}
`;

/**
 * @typedef {Object} HologramLook
 * @property {number[]} color - rgba 0..1, the body
 * @property {number[]} rim
 * @property {number[]} scan
 * @property {number} opacity
 * @property {number} scanlines - 0 off
 * @property {boolean} [additive] - default true
 */

/**
 * Uniforms one model's hologram materials share.
 * @param {HologramLook} look
 */
export function hologramUniforms(look) {
  return {
    uColor: { value: look.color },
    uRim: { value: look.rim },
    uScan: { value: look.scan },
    uOpacity: { value: look.opacity },
    uFill: { value: 0.35 },
    uScanlines: { value: look.scanlines },
    uLinePx: { value: 2 },
    uRange: { value: [0, 1] },
    uAxis: { value: new Vector3(0, 0, 1) },
    uToModel: { value: new Matrix4() },
    uScanPos: { value: 0 },
    uScanStrength: { value: 0 }
  };
}

/**
 * @param {ReturnType<typeof hologramUniforms>} uniforms - shared, not copied
 * @param {{ skinned?: boolean, morphed?: boolean, additive?: boolean }} [o]
 */
export function hologramMaterial(uniforms, { additive = true } = {}) {
  const m = new ShaderMaterial({
    name: 'lcards-hologram',
    uniforms,
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: additive ? AdditiveBlending : NormalBlending
  });
  return m;
}

/** Writes depth only (the solid model: drawn before the hologram) */
export function depthOnlyMaterial() {
  return new MeshBasicMaterial({ name: 'lcards-hologram-depth', colorWrite: false, depthWrite: true, side: FrontSide });
}
