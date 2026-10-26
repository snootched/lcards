/**
 * `grid` on WebGL (lazy chunk): the grid computed per pixel on a ground plane
 * seen through a camera. Looking straight down (`camera_tilt: 90`, the flat
 * view) the plane maps 1 unit to 1 px and the grid lands on the same pixels
 * as the Canvas2D GridEffect; tilted (the floor view) it is a perspective
 * floor. Every pixel casts a ray onto the plane, so the grid is exact at any
 * distance and nothing is drawn above the horizon.
 *
 * Lines are distances, not geometry: a line's coverage is the overlap of the
 * pixel with a band `line_width` px wide, the world distance turned into px
 * with the screen derivatives. That gives any width, antialiasing, and lines
 * that fade to their average density where they crowd (no moire).
 *
 * The patterns follow GridEffect: rows and columns (majors counted across
 * tiles, so evenly spaced at every seam; border lines at tile seams; drawn
 * in the same order so crossings composite the same), diagonal, hexagonal
 * and dots. The pattern settings come from the effect's GridEffect model.
 * The line code itself is `grid-lines-glsl.js`, shared with the
 * astrometrics mesh grid.
 *
 * @module core/packs/backgrounds/webgl/scenes/grid
 */
import {
  Scene, OrthographicCamera, PerspectiveCamera, PlaneGeometry, Mesh, ShaderMaterial, NormalBlending,
  Vector2, Vector3, Matrix3, Matrix4
} from 'three';
import { utils } from 'animejs';
import { parseColorToRgba } from '../../../textures/effects/noise-helpers.js';
import { rgba } from './scene-helpers.js';
import { lcm, linePeriod, polarPeriods } from '../../effects/GridEffect.js';
import { SURFACES, surfaceSize, wrapAround, surfaceFrame, curvedCamera, curvedTilt, wellProfile, wellArc, rippleProfile, surfaceRotation, toSurface, WELL_SEGMENTS } from '../../effects/grid-surface-model.js';
import { lcardsLog } from '../../../../../utils/lcards-logging.js';
import { GRID_LINES_GLSL } from './grid-lines-glsl.js';
import { scanAt } from './scan-band.js';

/** Re-exported: the scan band timing lives in scan-band.js (shared with the astrometrics scene) */
export { scanAt };

const PATTERNS = { both: 0, horizontal: 1, vertical: 2, diagonal: 3, hexagonal: 4, dots: 5, polar: 6 };

const VERT = /* glsl */ `
void main() {
  gl_Position = vec4( position.xy, 0.0, 1.0 );
}`;

const FRAG = /* glsl */ `
precision highp float;
#define WELL_SEGMENTS ${WELL_SEGMENTS}
uniform vec2 uSize;
uniform mat4 uInvViewProj;
uniform vec3 uCamPos;
uniform vec3 uCamFwd;
uniform float uDepth;
uniform int uSurface;
uniform mat3 uToLocal;
uniform float uRadius;
uniform float uHalfLen;
uniform float uAround;
uniform bool uSwap;
uniform bool uInside;
uniform float uBack;
// Well: radius at WELL_SEGMENTS + 1 heights, bottom to rim
uniform float uProfile[ WELL_SEGMENTS + 1 ];
// Well: arc length up the surface at the same heights
uniform float uArc[ WELL_SEGMENTS + 1 ];
// Well: its widest radius (the bounding cylinder)
uniform float uWellMaxR;

// Arc length up the well at height y (linear past the ends)
float wellAlong( float y ) {
  float dy = 2.0 * uHalfLen / float( WELL_SEGMENTS );
  int i = int( clamp( floor( y / dy ), 0.0, float( WELL_SEGMENTS - 1 ) ) );
  return uArc[ i ] + ( y - float( i ) * dy ) * ( uArc[ i + 1 ] - uArc[ i ] ) / dy;
}
${GRID_LINES_GLSL}
// A curved surface hit, in the surface's frame (axis on y, front toward +z):
// its coordinates (around, along), px per unit along each, the unscrolled
// along for the scan line, whether it is on the surface, whether it is the
// far side, and its view depth
struct Hit { vec2 p; vec2 k; float along; float rim; bool ok; bool back; float depth; };

Hit surfaceHit( vec3 o, vec3 d, float t, vec3 fwdL ) {
  Hit r;
  vec3 x = o + d * t;
  // around: the angle from the front as arc length; the second form has its
  // jump on the other side, for a clean screen derivative across the first's
  float ang = atan( x.x, x.z );
  float ang2 = atan( -x.x, -x.z );
  float s = uRadius * uAround;
  float around = ang * s;
  float dA = min( derivLen( ang ), derivLen( ang2 ) ) * s;
  float along;
  vec3 n;
  // rim: distance (world units along the axis) to an open edge, the ends of
  // a cylinder or the base of a dome; the surface reaches half a rim line
  // past it, so the rim is drawn whole
  float rim = 1e9;
  if ( uSurface == 1 ) {
    along = x.y;
    n = vec3( x.x, 0.0, x.z );
    if ( uHalfLen > 0.0 ) rim = uHalfLen - abs( x.y );
  } else if ( uSurface == 4 ) {
    // Well: arc length up from the bottom, open at both ends (its hits come
    // from the slices, which already reach half a rim line past the ends)
    along = wellAlong( x.y );
    n = x;
    rim = min( along, uArc[ WELL_SEGMENTS ] - along );
  } else {
    along = asin( clamp( x.y / uRadius, -1.0, 1.0 ) ) * uRadius;
    n = x;
    if ( uSurface == 2 ) rim = along;
  }
  float dL = derivLen( along );
  r.rim = rim;
  // (dL capped: where neighbour pixels hit different sheets it jumps, and a
  // wide tolerance would let a far-off part of the quadric through)
  r.ok = t > 0.0 && ( uSurface == 4 || rim >= ( uBorder ? -0.5 * uWidthMajor * min( dL, 2.0 ) : 0.0 ) );
  r.along = along;
  r.p = uSwap ? vec2( along, around ) : vec2( around, along );
  vec2 dp = uSwap ? vec2( dL, dA ) : vec2( dA, dL );
  r.k = 1.0 / max( dp, vec2( 1e-6 ) );
  // Seen from outside, a face turned away from the camera is the far side
  r.back = !uInside && dot( n, d ) > 0.0;
  r.depth = t * dot( d, fwdL );
  return r;
}

void drawSurfaceHit( Hit h ) {
  float kAlong = uSwap ? h.k.x : h.k.y;
  // The grid stops at the rim (the band past it is the rim line's)
  if ( h.rim >= 0.0 ) drawHit( h.p - uScroll, h.k.x, h.k.y, h.along, kAlong );
  // (px per unit floored: where the roots swap order, along's derivative
  // jumps and would turn the whole wall into rim)
  if ( uBorder && h.rim < 1e8 ) over( uColorMajor, band( abs( h.rim ) * max( kAlong, 0.5 ), uWidthMajor, 0.5 ) );
}

// Well: WELL_SEGMENTS cone slices stacked bottom to rim, each an exact
// ray hit (x^2 + z^2 = (c + s y)^2 within its heights); the four nearest
// hits are drawn far to near, and only a hit behind a nearer one is the
// far side (the inside seen through the mouth is not)
void drawWell( vec3 dir ) {
  vec3 o = uToLocal * uCamPos;
  vec3 d = uToLocal * dir;
  // The bottom at y = 0, its middle at the origin
  o.y += uHalfLen;
  float len = 2.0 * uHalfLen;
  float dy = len / float( WELL_SEGMENTS );
  // The end slices reach half a rim line past the ends, so the rims draw whole
  float pad = uBorder ? uWidthMajor : 0.0;
  float ts[ 4 ];
  for ( int j = 0; j < 4; j++ ) ts[ j ] = -1.0;
  // Only the slices the ray can reach: the heights where it is inside the
  // bounding cylinder (a ray that misses it tests none)
  float ba = dot( d.xz, d.xz );
  float bb = dot( o.xz, d.xz );
  float bc = dot( o.xz, o.xz ) - uWellMaxR * uWellMaxR * 1.0001;
  float bdisc = bb * bb - ba * bc;
  int iLo = WELL_SEGMENTS;
  int iHi = -1;
  if ( ba < 1e-12 ) {
    // Along the axis: every slice if it runs inside the cylinder
    if ( bc <= 0.0 ) { iLo = 0; iHi = WELL_SEGMENTS - 1; }
  } else if ( bdisc >= 0.0 ) {
    float bs = sqrt( bdisc );
    float t0 = max( ( -bb - bs ) / ba, 0.0 );
    float t1 = ( -bb + bs ) / ba;
    if ( t1 > 0.0 ) {
      float ya = o.y + t0 * d.y;
      float yb = o.y + t1 * d.y;
      iLo = int( floor( ( min( ya, yb ) - pad ) / dy ) );
      iHi = int( floor( ( max( ya, yb ) + pad ) / dy ) );
    }
  }
  for ( int i = 0; i < WELL_SEGMENTS; i++ ) {
    if ( i < iLo || i > iHi ) continue;
    float y0 = float( i ) * dy;
    float r0 = uProfile[ i ];
    float sl = ( uProfile[ i + 1 ] - r0 ) / dy;
    float lo = i == 0 ? y0 - pad : y0;
    float hi = i == WELL_SEGMENTS - 1 ? y0 + dy + pad : y0 + dy;
    float cy = r0 + sl * ( o.y - y0 );
    float sdy = sl * d.y;
    float qa = dot( d.xz, d.xz ) - sdy * sdy;
    float qb = dot( o.xz, d.xz ) - sdy * cy;
    float qc = dot( o.xz, o.xz ) - cy * cy;
    float disc = qb * qb - qa * qc;
    if ( disc < 0.0 ) continue;
    float sq = sqrt( disc );
    // The stable form of the roots (qa can be zero or negative on a slice)
    float qq = -( qb + ( qb < 0.0 ? -sq : sq ) );
    for ( int k = 0; k < 2; k++ ) {
      float t = k == 0 ? ( abs( qa ) > 1e-12 ? qq / qa : -1.0 ) : ( abs( qq ) > 1e-12 ? qc / qq : -1.0 );
      float y = o.y + t * d.y;
      // In front, within the slice, on the real cone (not its mirror)
      if ( t <= 0.0 || y < lo || y >= hi || r0 + sl * ( y - y0 ) < 0.0 ) continue;
      // Insert, keeping the four nearest in order
      for ( int j = 0; j < 4; j++ ) {
        if ( t < 0.0 ) break;
        if ( ts[ j ] < 0.0 || t < ts[ j ] ) { float tmp = ts[ j ]; ts[ j ] = t; t = tmp; }
      }
    }
  }
  vec3 fwdL = uToLocal * uCamFwd;
  Hit hs[ 4 ];
  // Every hit evaluated (screen derivatives in uniform control flow)
  for ( int j = 0; j < 4; j++ ) hs[ j ] = surfaceHit( o, d, ts[ j ], fwdL );
  for ( int j = 3; j >= 0; j-- ) {
    if ( !hs[ j ].ok ) continue;
    gMul = j > 0 ? uBack : 1.0;
    if ( gMul > 0.0 ) drawSurfaceHit( hs[ j ] );
  }
  gl_FragColor = acc;
}

void main() {
  acc = vec4( 0.0 );
  vec2 ndc = gl_FragCoord.xy / uSize * 2.0 - 1.0;
  vec4 a = uInvViewProj * vec4( ndc, -1.0, 1.0 );
  vec4 b = uInvViewProj * vec4( ndc, 1.0, 1.0 );
  vec3 dir = normalize( b.xyz / b.w - a.xyz / a.w );

  if ( uSurface == 4 ) {
    drawWell( dir );
    return;
  }

  if ( uSurface > 0 ) {
    // The surface sits at the world origin
    vec3 o = uToLocal * uCamPos;
    vec3 d = uToLocal * dir;
    float qa, qb, qc;
    if ( uSurface == 1 ) {
      qa = dot( d.xz, d.xz ); qb = dot( o.xz, d.xz ); qc = dot( o.xz, o.xz ) - uRadius * uRadius;
    } else {
      qa = 1.0; qb = dot( o, d ); qc = dot( o, o ) - uRadius * uRadius;
    }
    float disc = qb * qb - qa * qc;
    // Both hits are evaluated in every pixel, so their screen derivatives
    // are taken in uniform control flow; a miss only skips the drawing
    float sq = sqrt( max( disc, 0.0 ) );
    float qa1 = max( qa, 1e-9 );
    vec3 fwdL = uToLocal * uCamFwd;
    Hit h0 = surfaceHit( o, d, ( -qb - sq ) / qa1, fwdL );
    Hit h1 = surfaceHit( o, d, ( -qb + sq ) / qa1, fwdL );
    if ( disc <= 0.0 ) { gl_FragColor = vec4( 0.0 ); return; }
    // Far hit first, then the near one over it
    if ( h1.ok ) {
      gMul = h1.back ? uBack : 1.0;
      if ( gMul > 0.0 ) drawSurfaceHit( h1 );
    }
    if ( h0.ok ) {
      gMul = h0.back ? uBack : 1.0;
      if ( gMul > 0.0 ) drawSurfaceHit( h0 );
    }
    // An unbounded cylinder runs off into the distance: fade it out
    float depth = h0.ok ? h0.depth : h1.depth;
    acc *= 1.0 - smoothstep( uDepth + 4.0 * uRadius, uDepth + 16.0 * uRadius, depth );
    gl_FragColor = acc;
    return;
  }

  if ( dir.y > -1e-5 ) { gl_FragColor = vec4( 0.0 ); return; }
  vec3 hit = uCamPos + dir * ( -uCamPos.y / dir.y );
  float depth = dot( hit - uCamPos, uCamFwd );
  vec2 g = hit.xz;
  vec2 p = g - uScroll;
  // px per world unit along each axis (1 in the flat view)
  float kx = 1.0 / max( length( vec2( dFdx( p.x ), dFdy( p.x ) ) ), 1e-6 );
  float ky = 1.0 / max( length( vec2( dFdx( p.y ), dFdy( p.y ) ) ), 1e-6 );
  if ( uPattern == 6 ) {
    vec2 q = g - uPolarC;
    float r = length( q );
    // px per unit across a ring (radially) and across a spoke, from the
    // plane's screen Jacobian (smooth everywhere, also at the centre)
    vec2 gx = dFdx( g );
    vec2 gy = dFdy( g );
    float det = gx.x * gy.y - gy.x * gx.y;
    mat2 toPx = mat2( gy.y, -gx.y, -gy.x, gx.x ) / ( abs( det ) > 1e-12 ? det : 1e-12 );
    vec2 e = r > 1e-6 ? q / r : vec2( 1.0, 0.0 );
    gPolar = vec4( r, atan( q.y, q.x ), length( toPx * e ), length( toPx * vec2( -e.y, e.x ) ) );
  }
  drawHit( p, kx, ky, p.y + uScroll.y, ky );

  // Far floor: fade by view depth (the flat view sits exactly at uDepth)
  acc *= 1.0 - smoothstep( uDepth * 1.05, uDepth * 4.0, depth );
  gl_FragColor = acc;
}`;


/**
 * Camera presets per view; explicit keys override them.
 * @type {Record<string, { tilt: number, distance: number }>}
 */
export const VIEWS = { flat: { tilt: 90, distance: 1 }, floor: { tilt: 10, distance: 1 } };

/**
 * @param {{ params: Record<string, any>, colors: Record<string, Array<{ r: number, g: number, b: number, a: number }>> }} opts
 */
export function createScene({ colors }) {
  const u = {
    uSize: { value: new Vector2(1, 1) },
    uInvViewProj: { value: new Matrix4() },
    uCamPos: { value: new Vector3() },
    uCamFwd: { value: new Vector3() },
    uDepth: { value: 1 },
    uScroll: { value: new Vector2() },
    uPattern: { value: 0 },
    uCell: { value: new Vector2(40, 40) },
    uCount: { value: new Vector2(1, 1) },
    uMajorRow: { value: 0 },
    uMajorCol: { value: 0 },
    uBorder: { value: true },
    uWidthMinor: { value: 1 },
    uWidthMajor: { value: 2 },
    uSpacing: { value: 40 },
    uHexR: { value: 40 },
    uDotR: { value: 2 },
    uColor: { value: [1, 0.6, 0.4, 0.3] },
    uColorMajor: { value: [1, 0.6, 0.4, 0.3] },
    uFill: { value: [0, 0, 0, 0] },
    uScan: { value: [0.87, 0.88, 0.91, 1] },
    uScanZ: { value: 0 },
    uScanStrength: { value: 0 },
    uSurface: { value: 0 },
    uToLocal: { value: new Matrix3() },
    uRadius: { value: 1 },
    uHalfLen: { value: 0 },
    uAround: { value: 1 },
    uSwap: { value: false },
    uInside: { value: false },
    uBack: { value: 0.25 },
    uProfile: { value: new Array(WELL_SEGMENTS + 1).fill(0) },
    uArc: { value: new Array(WELL_SEGMENTS + 1).fill(0) },
    uWellMaxR: { value: 1 },
    uPolarC: { value: new Vector2() },
    uSpokes: { value: 12 },
    uSpokeOff: { value: 0 }
  };
  const material = new ShaderMaterial({
    uniforms: u,
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    premultipliedAlpha: true,
    depthTest: false,
    depthWrite: false,
    blending: NormalBlending
  });
  const geometry = new PlaneGeometry(2, 2);
  const quad = new Mesh(geometry, material);
  quad.frustumCulled = false;
  const scene = new Scene();
  scene.add(quad);
  // Renders the quad; `view` is the camera the rays come from
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const view = new PerspectiveCamera(60, 1, 1, 1e7);
  view.rotation.order = 'YXZ';
  let w = 1;
  let h = 1;

  /** @type {Map<string, [number, number, number, number]>} */
  const parsed = new Map();
  /** @param {string | null | undefined} c @returns {[number, number, number, number]} */
  const vec = (c) => {
    if (!c || c === 'transparent') return [0, 0, 0, 0];
    let v = parsed.get(c);
    if (!v) {
      const p = parseColorToRgba(c, 'rgba(0,0,0,0)');
      v = [p.r / 255, p.g / 255, p.b / 255, p.a ?? 1];
      parsed.set(c, v);
    }
    return v;
  };
  let scanColor = colors.scan?.[0];
  const ndcTmp = new Vector3();
  let warnedPattern = false;
  let warnedInside = false;
  let profileKey = '';
  /** @type {number[]} the well's profile before the ripple */
  let baseProfile = [];
  let baseMaxR = 1;
  let ripplePhase = 0;
  let lastT = 0;

  /**
   * Where the ray through screen point (0, ndcY) meets the ground: its z, or
   * null above the horizon.
   * @param {number} ndcY
   */
  function groundZ(ndcY) {
    ndcTmp.set(0, ndcY, 0.5).unproject(view);
    const dir = ndcTmp.sub(view.position).normalize();
    if (dir.y > -1e-5) return null;
    return view.position.z + dir.z * (-view.position.y / dir.y);
  }

  return {
    scene,
    camera,
    material,
    /** The camera the rays come from (tests) */
    view,
    /**
     * @param {number} t - effect clock, ms
     * @param {any} effect - GridGLEffect: `params` (view and scan keys), `model` (GridEffect)
     */
    seek(t, effect) {
      const m = effect.model;
      const prm = effect.params;
      if (!m._rowHeight || !m._colWidth) m._computeGridDimensions(w, h);

      const fov = Math.max(5, Math.min(150, prm.fov ?? 60));
      const surfaceName = SURFACES[prm.surface] ? prm.surface : 'plane';
      const curved = surfaceName !== 'plane';
      const yaw = prm.camera_yaw ?? 0;
      // Round the line of sight, after tilt and yaw (the camera's order is
      // YXZ); the camera turning one way turns the picture the other
      const roll = prm.camera_roll ?? 0;
      const zoom = Math.max(0.05, prm.camera_distance ?? 1);
      // Distance at which 1 unit = 1 px
      const unit = h / (2 * Math.tan((fov * Math.PI) / 360));
      view.fov = fov;
      view.aspect = w / Math.max(1, h);
      /** @type {ReturnType<typeof surfaceSize> | null} */
      let size = null;
      if (curved) {
        // Curved: the surface at the origin, the camera round it (or inside)
        size = surfaceSize(prm, w, h);
        // A well is seen from outside only (looking into it reads as inside)
        if (surfaceName === 'well' && prm.surface_side === 'inside' && !warnedInside) {
          lcardsLog.debug('[grid] surface_side: inside is not supported on a well; drawing the outside view');
          warnedInside = true;
        }
        const side = prm.surface_side === 'inside' && surfaceName !== 'well' ? 'inside' : 'outside';
        const tilt = Math.max(0, Math.min(90, prm.camera_tilt ?? curvedTilt(surfaceName, side)));
        const cam = curvedCamera({
          side, surface: surfaceName, axis: prm.surface_axis, tilt, yaw, zoom,
          radius: size.radius, distance: unit * zoom
        });
        view.position.set(...cam.position);
        utils.set(view, { rotateY: cam.rotateY, rotateX: cam.rotateX, rotateZ: roll });
        u.uDepth.value = cam.depth;
        u.uRadius.value = size.radius;
        u.uHalfLen.value = surfaceName === 'cylinder' || surfaceName === 'well' ? size.halfLength : 0;
        if (surfaceName === 'well') {
          const key = JSON.stringify([prm.well_profile, prm.well_shape, prm.well_throat, prm.well_profile_to, prm.well_morph, size.radius, size.halfLength]);
          if (key !== profileKey) {
            profileKey = key;
            baseProfile = wellProfile(prm, size.radius);
            baseMaxR = Math.max(...baseProfile);
            // Rings ride on the surface without the ripple: the waves pass through them
            u.uArc.value = wellArc(baseProfile, 2 * size.halfLength);
            u.uProfile.value = baseProfile;
          }
          // Ripple phase: integrated, so a speed change never jumps
          const dt = t - lastT;
          if (dt > 0 && dt < 1000) ripplePhase = (ripplePhase + ((prm.well_ripple_speed ?? 0.5) * dt) / 1000) % 1;
          lastT = t;
          const amplitude = Math.min(0.9, Math.max(0, prm.well_ripple ?? 0));
          // Bounding cylinder for the slice search (a ripple swells past the profile)
          u.uWellMaxR.value = baseMaxR * (1 + amplitude);
          if (amplitude > 0) u.uProfile.value = rippleProfile(baseProfile, amplitude, Math.max(0, prm.well_ripple_waves ?? 3), ripplePhase);
          else if (u.uProfile.value !== baseProfile) u.uProfile.value = baseProfile;
        }
        u.uInside.value = side === 'inside';
        u.uBack.value = Math.max(0, Math.min(1, prm.back_opacity ?? 0.25));
        const rotation = surfaceRotation(prm.surface_rotate_x ?? 0, prm.surface_rotate_y ?? 0, prm.surface_rotate_z ?? 0);
        u.uToLocal.value.fromArray(toSurface(surfaceFrame(surfaceName, prm.surface_axis), rotation)).transpose();
        u.uSwap.value = surfaceName === 'cylinder' && prm.surface_axis === 'horizontal';
      } else {
        // Plane: orbit the screen centre's ground point (w/2, h/2), at the
        // distance where 1 unit = 1 px there; tilt 90 looks straight down
        const base = VIEWS[prm.view] ?? VIEWS.flat;
        const tilt = Math.max(1, Math.min(90, prm.camera_tilt ?? base.tilt));
        const dist = unit * Math.max(0.05, prm.camera_distance ?? base.distance);
        const tr = (tilt * Math.PI) / 180;
        const yr = (yaw * Math.PI) / 180;
        view.position.set(
          w / 2 + dist * Math.cos(tr) * Math.sin(yr),
          dist * Math.sin(tr),
          h / 2 + dist * Math.cos(tr) * Math.cos(yr)
        );
        utils.set(view, { rotateY: yaw, rotateX: -tilt, rotateZ: roll });
        u.uDepth.value = dist;
      }
      u.uSurface.value = SURFACES[surfaceName];
      view.updateProjectionMatrix();
      view.updateMatrixWorld();
      u.uInvViewProj.value.multiplyMatrices(view.matrixWorld, view.projectionMatrixInverse);
      u.uCamPos.value.copy(view.position);
      view.getWorldDirection(u.uCamFwd.value);

      // Pattern, from the GridEffect model
      let pattern = PATTERNS[/** @type {keyof typeof PATTERNS} */ (m.pattern)] ?? 0;
      const spokes = Math.max(0, Math.round(m.spokeCount ?? 12));
      // Polar on a curved surface: rings along the axis, spoke_count meridians
      // round it, which the rows and columns draw (around is x, or y when swapped)
      const polarCurved = curved && pattern === 6;
      if (polarCurved) pattern = spokes > 0 ? 0 : (u.uSwap.value ? 2 : 1);
      // A dome or sphere is not flat: diagonal and hexagonal tilings would
      // distort, so they draw rows and columns there
      if ((surfaceName === 'dome' || surfaceName === 'sphere') && (pattern === 3 || pattern === 4)) {
        if (!warnedPattern) lcardsLog.debug(`[grid] pattern '${m.pattern}' draws as 'both' on a ${surfaceName}`);
        warnedPattern = true;
        pattern = 0;
      }
      u.uPattern.value = pattern;
      u.uCell.value.set(m._colWidth, m._rowHeight);
      // Tile seams (show_border_lines) belong to the flat grid
      if (curved) u.uCount.value.set(0, 0);
      else u.uCount.value.set(m._totalCols, m._totalRows);
      u.uMajorRow.value = Math.max(0, m.majorRowInterval | 0);
      u.uMajorCol.value = Math.max(0, m.majorColInterval | 0);
      // Rings take the row interval, spokes the column one: swapped, around is y
      if (polarCurved && u.uSwap.value) {
        u.uMajorRow.value = Math.max(0, m.majorColInterval | 0);
        u.uMajorCol.value = Math.max(0, m.majorRowInterval | 0);
      }
      u.uSpokes.value = spokes;
      u.uPolarC.value.set((m.polarX ?? 0.5) * w, (m.polarY ?? 0.5) * h);
      u.uBorder.value = m.showBorderLines !== false;
      u.uWidthMinor.value = Math.max(0, m.lineWidthMinor);
      u.uWidthMajor.value = Math.max(0, m.lineWidthMajor);
      u.uSpacing.value = pattern === 3 ? Math.max(m._colWidth, m._rowHeight) : (m.dotSpacing ?? m.lineSpacing);
      u.uHexR.value = m.hexRadius;
      u.uDotR.value = m.dotRadius ?? 2;
      u.uColor.value = vec(m.color);
      u.uColorMajor.value = vec(m.colorMajor);
      u.uFill.value = vec(m.fillColor);

      // Scroll, reduced to one period of the pattern (float precision)
      let px;
      let py;
      /** @type {ReturnType<typeof polarPeriods> | null} */
      let polar = null;
      if (pattern === 6) {
        polar = polarPeriods(m._rowHeight, m.lineSpacing, spokes, u.uMajorRow.value, u.uMajorCol.value);
        px = polar.spoke;
        py = polar.ring;
      } else if (pattern === 4) {
        const hexH = Math.sqrt(3) * m.hexRadius;
        px = lcm(2, Math.max(1, u.uMajorCol.value)) * 1.5 * m.hexRadius;
        py = Math.max(1, u.uMajorRow.value) * hexH;
      } else if (pattern === 3 || pattern === 5) {
        px = py = u.uSpacing.value;
      } else if (curved) {
        px = m._colWidth * Math.max(1, u.uMajorCol.value);
        py = m._rowHeight * Math.max(1, u.uMajorRow.value);
      } else {
        px = linePeriod(m._colWidth, m._totalCols, u.uMajorCol.value);
        py = linePeriod(m._rowHeight, m._totalRows, u.uMajorRow.value);
      }
      // Round a curved surface: a whole number of periods (no seam)
      if (size && polarCurved && spokes > 0) {
        // Exactly spoke_count columns round
        u.uAround.value = (spokes * (u.uSwap.value ? m._rowHeight : m._colWidth)) / (2 * Math.PI * size.radius);
      } else if (size) {
        u.uAround.value = wrapAround(size.radius, u.uSwap.value ? py : px).scale;
      }
      /** @param {number} v @param {number} period */
      const wrap = (v, period) => (period > 0 ? ((v % period) + period) % period : v);
      u.uScroll.value.set(wrap(m.scrollX, px), wrap(m.scrollY, py));
      u.uSpokeOff.value = polar && spokes > 0 ? (u.uScroll.value.x / m.lineSpacing) * ((2 * Math.PI) / spokes) : 0;

      // Scan band, from the far end of what is visible to the near edge
      const scan = scanAt(t, prm.scan_period ?? 0);
      u.uScanStrength.value = scan.strength;
      if (scan.strength > 0 && size) {
        // Along the axis, from the top (or the pole) down
        const r = size.radius;
        // (a well from the rim down to the bottom, along its surface)
        const top = surfaceName === 'well' ? u.uArc.value[WELL_SEGMENTS]
          : surfaceName === 'cylinder' ? (size.halfLength || size.extent / 2) : (Math.PI / 2) * r;
        const bottom = surfaceName === 'sphere' ? -top : surfaceName === 'dome' || surfaceName === 'well' ? 0 : -top;
        u.uScanZ.value = top + (bottom - top) * scan.pos;
      } else if (scan.strength > 0) {
        const near = groundZ(-1) ?? h;
        const far = groundZ(1) ?? (view.position.z - u.uDepth.value * 5);
        u.uScanZ.value = far + (near - far) * scan.pos;
      }
      u.uScan.value = rgba(scanColor, [0xdf / 255, 0xe1 / 255, 0xe8 / 255, 1]);
    },
    /** @param {number} width @param {number} height */
    resize(width, height) {
      w = width;
      h = height;
      u.uSize.value.set(w, h);
    },
    setParam() {},
    /** @param {Record<string, Array<{ r: number, g: number, b: number, a: number }>>} cols */
    setColors(cols) {
      scanColor = cols.scan?.[0];
      parsed.clear();
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    }
  };
}
