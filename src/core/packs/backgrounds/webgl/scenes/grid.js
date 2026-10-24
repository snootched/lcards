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
import { lcm, linePeriod } from '../../effects/GridEffect.js';
import { SURFACES, surfaceSize, wrapAround, surfaceFrame, curvedCamera, CURVED_TILT } from '../../effects/grid-surface-model.js';
import { lcardsLog } from '../../../../../utils/lcards-logging.js';

const PATTERNS = { both: 0, horizontal: 1, vertical: 2, diagonal: 3, hexagonal: 4, dots: 5 };

const VERT = /* glsl */ `
void main() {
  gl_Position = vec4( position.xy, 0.0, 1.0 );
}`;

const FRAG = /* glsl */ `
precision highp float;
uniform vec2 uSize;
uniform mat4 uInvViewProj;
uniform vec3 uCamPos;
uniform vec3 uCamFwd;
uniform float uDepth;
uniform vec2 uScroll;
uniform int uPattern;
uniform vec2 uCell;
uniform vec2 uCount;
uniform float uMajorRow;
uniform float uMajorCol;
uniform bool uBorder;
uniform float uWidthMinor;
uniform float uWidthMajor;
uniform float uSpacing;
uniform float uHexR;
uniform float uDotR;
uniform vec4 uColor;
uniform vec4 uColorMajor;
uniform vec4 uFill;
uniform vec4 uScan;
uniform float uScanZ;
uniform float uScanStrength;
uniform int uSurface;
uniform mat3 uToLocal;
uniform float uRadius;
uniform float uHalfLen;
uniform float uAround;
uniform bool uSwap;
uniform bool uInside;
uniform float uBack;

vec4 acc;
// Opacity of the hit being drawn (a curved surface's far side is dimmed)
float gMul = 1.0;
// Source-over, straight alpha in, premultiplied accumulator
void over( vec4 c, float cov ) {
  float a = c.a * cov * gMul;
  acc = vec4( c.rgb * a, a ) + acc * ( 1.0 - a );
}

// Coverage of this pixel by a band w px wide, d px from its centre line.
// f: half the pixel's extent across the line (0.5 for an axis-aligned line,
// 0.707 at 45 degrees), so the coverage is the pixel's area under the band
float band( float d, float w, float f ) {
  return clamp( ( min( d + f, w * 0.5 ) - max( d - f, -w * 0.5 ) ) / ( 2.0 * f ), 0.0, 1.0 );
}

// A line family: d world units from the nearest line, spacing s, scale
// k px per unit; lines fade to their average where they crowd
float lineCov( float d, float s, float k, float w, float f ) {
  float gap = s * k;
  float sharp = band( abs( d ) * k, w, f );
  // Crowding is the gap measured in line widths: below about 5 widths the
  // lines blend to their average, and that fades out as they merge (a calm
  // horizon, not a solid band)
  float t = gap / max( w, 1.0 );
  float avg = clamp( w / max( gap, 1e-3 ), 0.0, 1.0 ) * smoothstep( 1.2, 3.0, t );
  return mix( avg, sharp, smoothstep( 2.5, 5.0, t ) );
}

bool divisible( float i, float n ) {
  return n > 0.0 && abs( mod( i, n ) ) < 0.5;
}

// Rows (axis 1) or columns (axis 0) of the tiled rectangular grid
void rectLines( vec2 p, int axis, float k ) {
  float cell = axis == 1 ? uCell.y : uCell.x;
  float count = axis == 1 ? uCount.y : uCount.x;
  float interval = axis == 1 ? uMajorRow : uMajorCol;
  float v = axis == 1 ? p.y : p.x;
  // Line index counted across tiles (v is within one scroll period, a whole
  // number of tiles and major intervals, so the count lines up)
  float r = floor( v / cell + 0.5 );
  float d = v - r * cell;
  // A tile seam (show_border_lines: false hides these)
  if ( !uBorder && divisible( r, count ) ) return;
  bool major = divisible( r, interval );
  over( major ? uColorMajor : uColor, lineCov( d, cell, k, major ? uWidthMajor : uWidthMinor, 0.5 ) );
}

// Hexagon centre of lattice column c, row r (flat-top, odd columns shifted down)
vec2 hexCentre( float c, float r ) {
  float h = sqrt( 3.0 ) * uHexR;
  return vec2( c * 1.5 * uHexR, r * h + ( abs( mod( c, 2.0 ) ) > 0.5 ? h * 0.5 : 0.0 ) );
}

void hexLines( vec2 p, float k ) {
  float h = sqrt( 3.0 ) * uHexR;
  float c0 = floor( p.x / ( 1.5 * uHexR ) + 0.5 );
  vec2 best = vec2( 0.0 ), second = vec2( 0.0 );
  vec2 bestId = vec2( 0.0 ), secondId = vec2( 0.0 );
  float d1 = 1e20, d2 = 1e20;
  for ( int dc = -1; dc <= 1; dc++ ) {
    float c = c0 + float( dc );
    float shift = abs( mod( c, 2.0 ) ) > 0.5 ? h * 0.5 : 0.0;
    float r0 = floor( ( p.y - shift ) / h + 0.5 );
    for ( int dr = -1; dr <= 1; dr++ ) {
      float r = r0 + float( dr );
      vec2 ctr = hexCentre( c, r );
      float dd = dot( p - ctr, p - ctr );
      if ( dd < d1 ) { d2 = d1; second = best; secondId = bestId; d1 = dd; best = ctr; bestId = vec2( c, r ); }
      else if ( dd < d2 ) { d2 = dd; second = ctr; secondId = vec2( c, r ); }
    }
  }
  // Distance to the shared edge: the bisector of the two nearest centres
  float edge = ( d2 - d1 ) / ( 2.0 * length( second - best ) );
  bool m1 = divisible( bestId.x, uMajorCol ) && divisible( bestId.y, uMajorRow );
  bool m2 = divisible( secondId.x, uMajorCol ) && divisible( secondId.y, uMajorRow );
  // Canvas2D strokes every edge about 4.5 times on average (each edge
  // belongs to two hexagons, and its tiles of 3 x 3 hexagons overlap): match
  // that brightness evenly, with one stroke at the equivalent alpha. An edge
  // of a major hexagon is drawn major.
  bool major = m1 || m2;
  vec4 c = major ? uColorMajor : uColor;
  c.a = 1.0 - pow( 1.0 - c.a, 4.5 );
  over( c, lineCov( edge, h, k, major ? uWidthMajor : uWidthMinor, 0.6 ) );
}

// One hit's grid: p the scrolled surface coordinates, kx and ky px per unit
// along them, scanV the unscrolled coordinate the scan line sweeps (scanK px
// per unit along it)
void drawHit( vec2 p, float kx, float ky, float scanV, float scanK ) {
  float k = sqrt( kx * ky );
  if ( uFill.a > 0.0 ) over( uFill, 1.0 );
  if ( uPattern <= 2 ) {
    if ( uPattern != 2 ) rectLines( p, 1, ky );
    if ( uPattern != 1 ) rectLines( p, 0, kx );
  } else if ( uPattern == 3 ) {
    float s = uSpacing;
    float u = mod( p.x - p.y, s ); u = min( u, s - u );
    float v = mod( p.x + p.y, s ); v = min( v, s - v );
    // Perpendicular distance to a 45 degree line is the axis distance / sqrt(2)
    over( uColor, lineCov( u * 0.70710678, s * 0.70710678, k, uWidthMinor, 0.70710678 ) );
    over( uColor, lineCov( v * 0.70710678, s * 0.70710678, k, uWidthMinor, 0.70710678 ) );
  } else if ( uPattern == 4 ) {
    hexLines( p, k );
  } else {
    vec2 q = mod( p, uSpacing );
    q = min( q, uSpacing - q );
    float dpx = length( q ) * k;
    float gap = uSpacing * k;
    float cov = clamp( uDotR * k - dpx + 0.5, 0.0, 1.0 );
    over( uColor, mix( clamp( 3.14159 * uDotR * uDotR / ( uSpacing * uSpacing ), 0.0, 1.0 ), cov, smoothstep( 1.5, 4.0, gap ) ) );
  }

  if ( uScanStrength > 0.0 ) {
    float dpx = abs( scanV - uScanZ ) * scanK;
    over( uScan, uScanStrength * clamp( band( dpx, 2.5, 0.5 ) + 0.35 * exp( -dpx * dpx / 64.0 ), 0.0, 1.0 ) );
  }
}

float derivLen( float v ) {
  return length( vec2( dFdx( v ), dFdy( v ) ) );
}

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
  } else {
    along = asin( clamp( x.y / uRadius, -1.0, 1.0 ) ) * uRadius;
    n = x;
    if ( uSurface == 2 ) rim = along;
  }
  float dL = derivLen( along );
  r.rim = rim;
  r.ok = t > 0.0 && rim >= ( uBorder ? -0.5 * uWidthMajor * dL : 0.0 );
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
  if ( uBorder && h.rim < 1e8 ) over( uColorMajor, band( abs( h.rim ) * kAlong, uWidthMajor, 0.5 ) );
}

void main() {
  acc = vec4( 0.0 );
  vec2 ndc = gl_FragCoord.xy / uSize * 2.0 - 1.0;
  vec4 a = uInvViewProj * vec4( ndc, -1.0, 1.0 );
  vec4 b = uInvViewProj * vec4( ndc, 1.0, 1.0 );
  vec3 dir = normalize( b.xyz / b.w - a.xyz / a.w );

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
 * The scan band: sweeps from the far end to the near end (inQuad), fading in
 * and out, then rests. Pure function of the effect clock.
 * @param {number} t - ms
 * @param {number} periodS - seconds, 0 = off
 * @returns {{ pos: number, strength: number }} pos 0 (far) to 1 (near)
 */
export function scanAt(t, periodS) {
  if (!(periodS > 0)) return { pos: 0, strength: 0 };
  const total = periodS * 1000;
  const sweep = total * 0.75;
  const local = ((t % total) + total) % total;
  if (local >= sweep) return { pos: 1, strength: 0 };
  const q = local / sweep;
  return { pos: q * q, strength: Math.min(1, q / 0.15, (1 - q) / 0.15) };
}

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
    uBack: { value: 0.25 }
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
        const side = prm.surface_side === 'inside' ? 'inside' : 'outside';
        const tilt = Math.max(0, Math.min(90, prm.camera_tilt ?? CURVED_TILT[side]));
        const cam = curvedCamera({
          side, surface: surfaceName, axis: prm.surface_axis, tilt, yaw, zoom,
          radius: size.radius, distance: unit * zoom
        });
        view.position.set(...cam.position);
        utils.set(view, { rotateY: cam.rotateY, rotateX: cam.rotateX });
        u.uDepth.value = cam.depth;
        u.uRadius.value = size.radius;
        u.uHalfLen.value = surfaceName === 'cylinder' ? size.halfLength : 0;
        u.uInside.value = side === 'inside';
        u.uBack.value = Math.max(0, Math.min(1, prm.back_opacity ?? 0.25));
        u.uToLocal.value.fromArray(surfaceFrame(surfaceName, prm.surface_axis)).transpose();
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
        utils.set(view, { rotateY: yaw, rotateX: -tilt });
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
      if (pattern === 4) {
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
      if (size) u.uAround.value = wrapAround(size.radius, u.uSwap.value ? py : px).scale;
      /** @param {number} v @param {number} period */
      const wrap = (v, period) => (period > 0 ? ((v % period) + period) % period : v);
      u.uScroll.value.set(wrap(m.scrollX, px), wrap(m.scrollY, py));

      // Scan band, from the far end of what is visible to the near edge
      const scan = scanAt(t, prm.scan_period ?? 0);
      u.uScanStrength.value = scan.strength;
      if (scan.strength > 0 && size) {
        // Along the axis, from the top (or the pole) down
        const r = size.radius;
        const top = surfaceName === 'cylinder' ? (size.halfLength || size.extent / 2) : (Math.PI / 2) * r;
        const bottom = surfaceName === 'sphere' ? -top : surfaceName === 'dome' ? 0 : -top;
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
