/**
 * The grid's line drawing in GLSL, shared by the analytic background grid
 * (`grid.js`, a ray per pixel) and the astrometrics mesh grid material
 * (surface coordinates from a mesh attribute). Lines look the same in both.
 *
 * A host declares nothing of this itself: it gets the line uniforms
 * (pattern, cells, widths, colours, scroll, scan, polar centre and spokes)
 * and the functions: `over` (composites into `acc`), `band`, `lineCov`,
 * `rectLines`, `hexLines`, `polarLines`, `drawHit` and `derivLen`. Before
 * `drawHit` the host clears `acc`, sets `gMul` and, for the polar
 * pattern, `gPolar`.
 *
 * @module core/packs/backgrounds/webgl/scenes/grid-lines-glsl
 */

export const GRID_LINES_GLSL = /* glsl */ `
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
uniform vec2 uPolarC;
uniform float uSpokes;
uniform float uSpokeOff;

vec4 acc;
// Opacity of the hit being drawn (a curved surface's far side is dimmed)
float gMul = 1.0;
// Polar pattern on the plane: radius, angle, px per unit across a ring and
// across a spoke (set in main, where the screen derivatives are uniform)
vec4 gPolar = vec4( 0.0 );
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

// Rings round uPolarC (moved outward by the vertical scroll), then spokes
// (turned by uSpokeOff)
void polarLines() {
  float r = gPolar.x;
  float v = r - uScroll.y;
  float n = floor( v / uCell.y + 0.5 );
  // No ring at or inside the centre
  if ( n * uCell.y + uScroll.y > 0.0 ) {
    bool major = divisible( n, uMajorRow );
    over( major ? uColorMajor : uColor, lineCov( v - n * uCell.y, uCell.y, gPolar.z, major ? uWidthMajor : uWidthMinor, 0.5 ) );
  }
  if ( uSpokes < 0.5 ) return;
  float pitch = 6.28318531 / uSpokes;
  float th = gPolar.y - uSpokeOff;
  float j = floor( th / pitch + 0.5 );
  float dth = abs( th - j * pitch );
  // Distance to the spoke, a ray from the centre (behind the centre: to the centre)
  float d = dth < 1.5707963 ? r * sin( dth ) : r;
  bool major = divisible( mod( j, uSpokes ), uMajorCol );
  // A major spoke crowds at its own spacing (majors outlast the minors inward)
  float gap = r * pitch * ( major ? max( uMajorCol, 1.0 ) : 1.0 );
  over( major ? uColorMajor : uColor, lineCov( d, gap, gPolar.w, major ? uWidthMajor : uWidthMinor, 0.6 ) );
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
  } else if ( uPattern == 6 ) {
    polarLines();
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
`;
