import{M as ne,f as se,a as ue,N as ce,V as z,h as V,P as de,b as fe,c as he,O as me,d as pe}from"./instance.DkfKKL3N.js";import{a as ve,l as ge,b as te,p as xe}from"./BackgroundAnimationRenderer.Bi3RWZjJ.js";import{r as we}from"./scene-helpers.DoVgHnOc.js";import{l as oe}from"./lcards-logging.BkMNBuzN.js";import{a as re}from"./target.FfaGmL8c.js";import"./number.Bx7EVHc7.js";import"./reduced-motion.CR8xNM6Y.js";import"./resolve-color.DTQ_ay1J.js";import"./ColorUtils.Cit0BI8M.js";import"./theme.90cI75yW.js";import"./framework.DIp0zHSV.js";import"./template-string.D_XUSOOq.js";import"./ha-entity-display.CZm-V4fY.js";import"./effect-handle.ujHuwroQ.js";const le={plane:0,cylinder:1,dome:2,sphere:3,well:4},Me=.1,H=64,O={trumpet:(a,e)=>1/(1/e-a*(1/e-1)),cone:(a,e)=>e+(1-e)*a,bowl:(a,e)=>Math.sqrt(e*e+(1-e*e)*a),wormhole:(a,e)=>O.trumpet(Math.abs(2*a-1),e)};function Z(a,e,r=H){const o=X(a.well_morph??0,0,1);if(Array.isArray(a.well_profile_to)&&o>0){const l=Z({...a,well_morph:0},e,r),c=Z({...a,well_profile:a.well_profile_to,well_morph:0},e,r);return l.map((d,y)=>d+(c[y]-d)*o)}const i=new Array(r+1),n=Array.isArray(a.well_profile)?a.well_profile.map(Number).filter(Number.isFinite).map(l=>Math.max(0,l)).reverse():null;if(n&&n.length>=2){const l=n.length-1,c=d=>d<0?2*n[0]-n[1]:d>l?2*n[l]-n[l-1]:n[d];for(let d=0;d<=r;d++){const y=d/r*l,w=Math.min(l-1,Math.floor(y)),M=y-w,[C,b,q,_]=[c(w-1),c(w),c(w+1),c(w+2)],A=.5*(2*b+(q-C)*M+(2*C-5*b+4*q-_)*M*M+(3*b-C-3*q+_)*M*M*M);i[d]=Math.max(0,A)*e}return i}const h=O[a.well_shape]??O.trumpet,u=X(a.well_throat??.15,.02,1);for(let l=0;l<=r;l++)i[l]=Math.min(1,h(l/r,u))*e;return i}function ye(a,e,r){const o=Math.max(1,X(a.surface_size??.8,.05,4)*Math.min(e,r)/2),n=a.surface_axis==="horizontal"?e:r;let h=Math.max(0,a.surface_length??1);return a.surface==="well"&&(h=Math.max(Me,h)),{radius:o,halfLength:h*n/2,extent:n}}function be(a,e){const r=2*Math.PI*a;if(!(e>0))return{count:0,scale:1};const o=Math.max(1,Math.round(r/e));return{count:o,scale:o*e/r}}function Se(a,e){return e!=="horizontal"||a==="sphere"?[1,0,0,0,1,0,0,0,1]:a==="cylinder"?[0,-1,0,1,0,0,0,0,1]:[1,0,0,0,0,1,0,-1,0]}const je={outside:15,inside:0},Ce=(a,e)=>a==="well"?35:je[e==="inside"?"inside":"outside"];function _e({side:a,surface:e,axis:r,tilt:o,yaw:i,zoom:n,radius:h,distance:u}){const l=Math.PI/180;if(a==="inside"){const w=i+(e==="cylinder"&&r==="horizontal"?90:0),M=Math.cos(o*l),C=[-Math.sin(w*l)*M,Math.sin(o*l),-Math.cos(w*l)*M],b=(n-1)*h;return{position:[-C[0]*b,-C[1]*b,-C[2]*b],rotateX:o,rotateY:w,depth:Math.max(0,b)}}const c=h+u,d=o*l,y=i*l;return{position:[c*Math.cos(d)*Math.sin(y),c*Math.sin(d),c*Math.cos(d)*Math.cos(y)],rotateX:-o,rotateY:i,depth:c}}function ke(a,e,r,o){const i=a.length-1;return a.map((n,h)=>n*Math.max(0,1+e*Math.sin(2*Math.PI*(r*(h/i)+o))))}function Le(a,e,r){const o=Math.PI/180,[i,n,h]=[Math.cos(a*o),Math.cos(e*o),Math.cos(r*o)],[u,l,c]=[Math.sin(a*o),Math.sin(e*o),Math.sin(r*o)];return[n*h,-n*c,l,i*c+u*h*l,i*h-u*l*c,-u*n,u*c-i*h*l,u*h+i*l*c,i*n]}function Pe(a,e){const r=new Array(9).fill(0);for(let o=0;o<3;o++)for(let i=0;i<3;i++)for(let n=0;n<3;n++)r[o*3+i]+=a[o*3+n]*e[i*3+n];return r}function qe(a,e){const r=e/(a.length-1),o=[0];for(let i=1;i<a.length;i++)o.push(o[i-1]+Math.hypot(r,a[i]-a[i-1]));return o}function X(a,e,r){return Math.max(e,Math.min(r,Number(a)))}const Re=`
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
`;function We(a,e){if(!(e>0))return{pos:0,strength:0};const r=e*1e3,o=r*.75,i=(a%r+r)%r;if(i>=o)return{pos:1,strength:0};const n=i/o;return{pos:n*n,strength:Math.min(1,n/.15,(1-n)/.15)}}const Ee={both:0,horizontal:1,vertical:2,diagonal:3,hexagonal:4,dots:5,polar:6},ze=`
void main() {
  gl_Position = vec4( position.xy, 0.0, 1.0 );
}`,He=`
precision highp float;
#define WELL_SEGMENTS ${H}
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
${Re}
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
}`,ie={flat:{tilt:90,distance:1},floor:{tilt:10,distance:1}};function $e({colors:a}){var $;const e={uSize:{value:new z(1,1)},uInvViewProj:{value:new se},uCamPos:{value:new V},uCamFwd:{value:new V},uDepth:{value:1},uScroll:{value:new z},uPattern:{value:0},uCell:{value:new z(40,40)},uCount:{value:new z(1,1)},uMajorRow:{value:0},uMajorCol:{value:0},uBorder:{value:!0},uWidthMinor:{value:1},uWidthMajor:{value:2},uSpacing:{value:40},uHexR:{value:40},uDotR:{value:2},uColor:{value:[1,.6,.4,.3]},uColorMajor:{value:[1,.6,.4,.3]},uFill:{value:[0,0,0,0]},uScan:{value:[.87,.88,.91,1]},uScanZ:{value:0},uScanStrength:{value:0},uSurface:{value:0},uToLocal:{value:new ne},uRadius:{value:1},uHalfLen:{value:0},uAround:{value:1},uSwap:{value:!1},uInside:{value:!1},uBack:{value:.25},uProfile:{value:new Array(H+1).fill(0)},uArc:{value:new Array(H+1).fill(0)},uWellMaxR:{value:1},uPolarC:{value:new z},uSpokes:{value:12},uSpokeOff:{value:0}},r=new ue({uniforms:e,vertexShader:ze,fragmentShader:He,transparent:!0,premultipliedAlpha:!0,depthTest:!1,depthWrite:!1,blending:ce}),o=new de(2,2),i=new fe(o,r);i.frustumCulled=!1;const n=new he;n.add(i);const h=new me(-1,1,1,-1,0,1),u=new pe(60,1,1,1e7);u.rotation.order="YXZ";let l=1,c=1;const d=new Map,y=g=>{if(!g||g==="transparent")return[0,0,0,0];let p=d.get(g);if(!p){const t=xe(g,"rgba(0,0,0,0)");p=[t.r/255,t.g/255,t.b/255,t.a??1],d.set(g,p)}return p};let w=($=a.scan)==null?void 0:$[0];const M=new V;let C=!1,b=!1,q="",_=[],A=1,F=0,Y=0;function K(g){M.set(0,g,.5).unproject(u);const p=M.sub(u.position).normalize();return p.y>-1e-5?null:u.position.z+p.z*(-u.position.y/p.y)}return{scene:n,camera:h,material:r,view:u,seek(g,p){const t=p.model,s=p.params;(!t._rowHeight||!t._colWidth)&&t._computeGridDimensions(l,c);const J=Math.max(5,Math.min(150,s.fov??60)),f=le[s.surface]?s.surface:"plane",I=f!=="plane",N=s.camera_yaw??0,U=s.camera_roll??0,Q=Math.max(.05,s.camera_distance??1),ee=c/(2*Math.tan(J*Math.PI/360));u.fov=J,u.aspect=l/Math.max(1,c);let v=null;if(I){v=ye(s,l,c),f==="well"&&s.surface_side==="inside"&&!b&&(oe.debug("[grid] surface_side: inside is not supported on a well; drawing the outside view"),b=!0);const x=s.surface_side==="inside"&&f!=="well"?"inside":"outside",m=Math.max(0,Math.min(90,s.camera_tilt??Ce(f,x))),j=_e({side:x,surface:f,axis:s.surface_axis,tilt:m,yaw:N,zoom:Q,radius:v.radius,distance:ee*Q});if(u.position.set(...j.position),re(u,{rotateY:j.rotateY,rotateX:j.rotateX,rotateZ:U}),e.uDepth.value=j.depth,e.uRadius.value=v.radius,e.uHalfLen.value=f==="cylinder"||f==="well"?v.halfLength:0,f==="well"){const E=JSON.stringify([s.well_profile,s.well_shape,s.well_throat,s.well_profile_to,s.well_morph,v.radius,v.halfLength]);E!==q&&(q=E,_=Z(s,v.radius),A=Math.max(..._),e.uArc.value=qe(_,2*v.halfLength),e.uProfile.value=_);const G=g-Y;G>0&&G<1e3&&(F=(F+(s.well_ripple_speed??.5)*G/1e3)%1),Y=g;const B=Math.min(.9,Math.max(0,s.well_ripple??0));e.uWellMaxR.value=A*(1+B),B>0?e.uProfile.value=ke(_,B,Math.max(0,s.well_ripple_waves??3),F):e.uProfile.value!==_&&(e.uProfile.value=_)}e.uInside.value=x==="inside",e.uBack.value=Math.max(0,Math.min(1,s.back_opacity??.25));const W=Le(s.surface_rotate_x??0,s.surface_rotate_y??0,s.surface_rotate_z??0);e.uToLocal.value.fromArray(Pe(Se(f,s.surface_axis),W)).transpose(),e.uSwap.value=f==="cylinder"&&s.surface_axis==="horizontal"}else{const x=ie[s.view]??ie.flat,m=Math.max(1,Math.min(90,s.camera_tilt??x.tilt)),j=ee*Math.max(.05,s.camera_distance??x.distance),W=m*Math.PI/180,E=N*Math.PI/180;u.position.set(l/2+j*Math.cos(W)*Math.sin(E),j*Math.sin(W),c/2+j*Math.cos(W)*Math.cos(E)),re(u,{rotateY:N,rotateX:-m,rotateZ:U}),e.uDepth.value=j}e.uSurface.value=le[f],u.updateProjectionMatrix(),u.updateMatrixWorld(),e.uInvViewProj.value.multiplyMatrices(u.matrixWorld,u.projectionMatrixInverse),e.uCamPos.value.copy(u.position),u.getWorldDirection(e.uCamFwd.value);let S=Ee[t.pattern]??0;const k=Math.max(0,Math.round(t.spokeCount??12)),D=I&&S===6;D&&(S=k>0?0:e.uSwap.value?2:1),(f==="dome"||f==="sphere")&&(S===3||S===4)&&(C||oe.debug(`[grid] pattern '${t.pattern}' draws as 'both' on a ${f}`),C=!0,S=0),e.uPattern.value=S,e.uCell.value.set(t._colWidth,t._rowHeight),I?e.uCount.value.set(0,0):e.uCount.value.set(t._totalCols,t._totalRows),e.uMajorRow.value=Math.max(0,t.majorRowInterval|0),e.uMajorCol.value=Math.max(0,t.majorColInterval|0),D&&e.uSwap.value&&(e.uMajorRow.value=Math.max(0,t.majorColInterval|0),e.uMajorCol.value=Math.max(0,t.majorRowInterval|0)),e.uSpokes.value=k,e.uPolarC.value.set((t.polarX??.5)*l,(t.polarY??.5)*c),e.uBorder.value=t.showBorderLines!==!1,e.uWidthMinor.value=Math.max(0,t.lineWidthMinor),e.uWidthMajor.value=Math.max(0,t.lineWidthMajor),e.uSpacing.value=S===3?Math.max(t._colWidth,t._rowHeight):t.dotSpacing??t.lineSpacing,e.uHexR.value=t.hexRadius,e.uDotR.value=t.dotRadius??2,e.uColor.value=y(t.color),e.uColorMajor.value=y(t.colorMajor),e.uFill.value=y(t.fillColor);let L,P,T=null;if(S===6)T=ve(t._rowHeight,t.lineSpacing,k,e.uMajorRow.value,e.uMajorCol.value),L=T.spoke,P=T.ring;else if(S===4){const x=Math.sqrt(3)*t.hexRadius;L=ge(2,Math.max(1,e.uMajorCol.value))*1.5*t.hexRadius,P=Math.max(1,e.uMajorRow.value)*x}else S===3||S===5?L=P=e.uSpacing.value:I?(L=t._colWidth*Math.max(1,e.uMajorCol.value),P=t._rowHeight*Math.max(1,e.uMajorRow.value)):(L=te(t._colWidth,t._totalCols,e.uMajorCol.value),P=te(t._rowHeight,t._totalRows,e.uMajorRow.value));v&&D&&k>0?e.uAround.value=k*(e.uSwap.value?t._rowHeight:t._colWidth)/(2*Math.PI*v.radius):v&&(e.uAround.value=be(v.radius,e.uSwap.value?P:L).scale);const ae=(x,m)=>m>0?(x%m+m)%m:x;e.uScroll.value.set(ae(t.scrollX,L),ae(t.scrollY,P)),e.uSpokeOff.value=T&&k>0?e.uScroll.value.x/t.lineSpacing*(2*Math.PI/k):0;const R=We(g,s.scan_period??0);if(e.uScanStrength.value=R.strength,R.strength>0&&v){const x=v.radius,m=f==="well"?e.uArc.value[H]:f==="cylinder"?v.halfLength||v.extent/2:Math.PI/2*x,j=f==="sphere"?-m:f==="dome"||f==="well"?0:-m;e.uScanZ.value=m+(j-m)*R.pos}else if(R.strength>0){const x=K(-1)??c,m=K(1)??u.position.z-e.uDepth.value*5;e.uScanZ.value=m+(x-m)*R.pos}e.uScan.value=we(w,[223/255,225/255,232/255,1])},resize(g,p){l=g,c=p,e.uSize.value.set(l,c)},setParam(){},setColors(g){var p;w=(p=g.scan)==null?void 0:p[0],d.clear()},dispose(){o.dispose(),r.dispose()}}}export{ie as VIEWS,$e as createScene,We as scanAt};
