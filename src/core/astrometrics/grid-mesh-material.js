/**
 * The background grid's line drawing (`grid-lines-glsl.js`) on real meshes.
 * A mesh supplies surface coordinates in scene units (around, along) as the
 * `surf` attribute instead of a ray hit; px per unit come from the screen
 * derivatives as in the analytic shader, so lines are `line_width` px wide
 * at any distance and fade where they crowd.
 *
 * Each grid face is drawn twice from one geometry and one set of uniforms:
 * back faces at `back_opacity` (render order 1), then front faces (render
 * order 2). No depth write, so far sides of every object draw before near
 * sides; solid fills (a sphere's dark body) write depth and hide lines
 * behind them. Rims and edges are fat lines, not shader bands (a mesh cannot
 * draw past its edge).
 *
 * @module core/astrometrics/grid-mesh-material
 */
import { ShaderMaterial, NormalBlending, AdditiveBlending, BackSide, FrontSide, Vector2, Mesh, Group } from 'three';
import { GRID_LINES_GLSL } from '../packs/backgrounds/webgl/scenes/grid-lines-glsl.js';

/** Pattern names as the shared chunk numbers them */
export const PATTERNS = { both: 0, horizontal: 1, vertical: 2, diagonal: 3, hexagonal: 4, dots: 5, polar: 6 };

const VERT = /* glsl */ `
attribute vec2 surf;
varying vec2 vSurf;
void main() {
  vSurf = surf;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`;

const FRAG = /* glsl */ `
precision highp float;
${GRID_LINES_GLSL}
varying vec2 vSurf;
uniform float uMul;
// 1: polar rings and spokes from the plane coordinates (a flat disc)
uniform bool uPlanePolar;
// 1: the scan band rings out from the polar centre (a disc's ping) instead of sweeping t
uniform bool uScanRadial;
uniform float uOpacity;
void main() {
  acc = vec4( 0.0 );
  gMul = uMul * uOpacity;
  vec2 p = vSurf;
  float kx = 1.0 / max( derivLen( p.x ), 1e-6 );
  float ky = 1.0 / max( derivLen( p.y ), 1e-6 );
  if ( uPlanePolar ) {
    vec2 q = p - uPolarC;
    float r = length( q );
    vec2 gx = dFdx( p );
    vec2 gy = dFdy( p );
    float det = gx.x * gy.y - gy.x * gx.y;
    mat2 toPx = mat2( gy.y, -gx.y, -gy.x, gx.x ) / ( abs( det ) > 1e-12 ? det : 1e-12 );
    vec2 e = r > 1e-6 ? q / r : vec2( 1.0, 0.0 );
    gPolar = vec4( r, atan( q.y, q.x ), length( toPx * e ), length( toPx * vec2( -e.y, e.x ) ) );
  }
  float scanV = p.y;
  float scanK = ky;
  if ( uScanRadial && uPlanePolar ) {
    scanV = gPolar.x;
    scanK = gPolar.z;
  }
  drawHit( p - uScroll, kx, ky, scanV, scanK );
  if ( acc.a <= 0.0 ) discard;
  gl_FragColor = acc;
}`;

/**
 * @typedef {Object} GridLook
 * @property {keyof typeof PATTERNS} [pattern]
 * @property {[number, number]} [cell] - line spacing along s (around / x) and t (along / z), scene units
 * @property {number} [majorRow] - every Nth line along t is major (0 none)
 * @property {number} [majorCol]
 * @property {number} [widthMinor] - px
 * @property {number} [widthMajor]
 * @property {number[]} [color] - straight rgba 0..1
 * @property {number[]} [colorMajor]
 * @property {number[]} [fill]
 * @property {number} [spokes] - polar
 * @property {number} [spacing] - diagonal / dots spacing
 * @property {number} [hexRadius]
 * @property {number} [dotRadius]
 * @property {boolean} [planePolar] - polar from the plane coordinates (disc)
 * @property {number} [back] - opacity of the far side (0 skips its draw)
 * @property {number} [opacity]
 * @property {boolean} [additive]
 */

/**
 * Uniforms for one grid face.
 * @param {GridLook} look
 */
export function gridUniforms(look) {
  const c = look.color ?? [1, 0.6, 0.4, 0.5];
  return {
    uScroll: { value: new Vector2() },
    uPattern: { value: PATTERNS[look.pattern ?? 'both'] ?? 0 },
    uCell: { value: new Vector2(...(look.cell ?? [10, 10])) },
    uCount: { value: new Vector2(0, 0) },
    uMajorRow: { value: Math.max(0, look.majorRow ?? 0) },
    uMajorCol: { value: Math.max(0, look.majorCol ?? 0) },
    uBorder: { value: true },
    uWidthMinor: { value: look.widthMinor ?? 1 },
    uWidthMajor: { value: look.widthMajor ?? 2 },
    uSpacing: { value: look.spacing ?? look.cell?.[0] ?? 10 },
    uHexR: { value: look.hexRadius ?? 10 },
    uDotR: { value: look.dotRadius ?? 1 },
    uColor: { value: c },
    uColorMajor: { value: look.colorMajor ?? c },
    uFill: { value: look.fill ?? [0, 0, 0, 0] },
    uScan: { value: [0, 0, 0, 0] },
    uScanZ: { value: 0 },
    uScanStrength: { value: 0 },
    uPolarC: { value: new Vector2() },
    uSpokes: { value: look.spokes ?? 12 },
    uSpokeOff: { value: 0 },
    uPlanePolar: { value: !!look.planePolar },
    uScanRadial: { value: false },
    uOpacity: { value: look.opacity ?? 1 }
  };
}

/**
 * A grid face: two meshes (far side, then near side) on one geometry and
 * one set of uniforms. `userData.uniforms` lets callers recolour in place.
 * @param {import('three').BufferGeometry} geometry - with a `surf` attribute
 * @param {GridLook} look
 * @returns {Group}
 */
export function gridFace(geometry, look) {
  const u = gridUniforms(look);
  const back = Math.max(0, Math.min(1, look.back ?? 0.25));
  /** @param {import('three').Side} side @param {number} mul */
  const make = (side, mul) => new ShaderMaterial({
    uniforms: { ...u, uMul: { value: mul } },
    vertexShader: VERT,
    fragmentShader: FRAG,
    side,
    transparent: true,
    premultipliedAlpha: true,
    depthTest: true,
    depthWrite: false,
    blending: look.additive ? AdditiveBlending : NormalBlending
  });
  const group = new Group();
  if (back > 0) {
    const b = new Mesh(geometry, make(BackSide, back));
    b.renderOrder = 1;
    group.add(b);
  }
  const f = new Mesh(geometry, make(FrontSide, 1));
  f.renderOrder = 2;
  group.add(f);
  group.userData.uniforms = u;
  return group;
}

/**
 * Recolour a grid face in place.
 * @param {Group} face
 * @param {{ color?: number[], colorMajor?: number[], fill?: number[] }} c
 */
export function setGridColors(face, c) {
  const u = face.userData.uniforms;
  if (!u) return;
  if (c.color) u.uColor.value = c.color;
  if (c.colorMajor) u.uColorMajor.value = c.colorMajor;
  if (c.fill) u.uFill.value = c.fill;
}

/**
 * Where a face's scan band runs, in the face's own coordinates: from the
 * top of `t` (a sphere's north pole, a dome's zenith, a cylinder's or
 * wall's top, a plane's far edge) to the bottom, or for a polar disc from
 * the centre out to its rim.
 * @param {Group} face
 * @returns {{ from: number, to: number, radial: boolean }}
 */
export function scanRange(face) {
  const u = face.userData.uniforms;
  const geo = /** @type {any} */ (face.children[0])?.geometry;
  const surf = geo?.getAttribute('surf');
  const radial = !!u?.uPlanePolar.value;
  const c = u?.uPolarC.value ?? { x: 0, y: 0 };
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i < (surf?.count ?? 0); i++) {
    const v = radial ? Math.hypot(surf.getX(i) - c.x, surf.getY(i) - c.y) : surf.getY(i);
    lo = Math.min(lo, v);
    hi = Math.max(hi, v);
  }
  if (!(hi >= lo)) return { from: 0, to: 0, radial };
  return radial ? { from: 0, to: hi, radial } : { from: hi, to: lo, radial };
}

/**
 * Set a face's scan band: `pos` 0 (start) to 1 (end) along its range,
 * `strength` 0 hides it.
 * @param {Group} face
 * @param {{ from: number, to: number, radial: boolean }} range
 * @param {number} pos
 * @param {number} strength
 */
export function setScan(face, range, pos, strength) {
  const u = face.userData.uniforms;
  if (!u) return;
  u.uScanRadial.value = range.radial;
  u.uScanStrength.value = strength;
  u.uScanZ.value = range.from + (range.to - range.from) * pos;
}
