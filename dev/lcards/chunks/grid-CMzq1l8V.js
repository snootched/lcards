var le=Object.defineProperty;var M=(j,e)=>le(j,"name",{value:e,configurable:true});import{S as ie,m as ue,k as S,a6 as se,V as H,M as ne,i as de,b as ce,u as fe,O as he,P as ve}from"./three.module-DQ1AG__Q.js";import{l as Q,aJ as ee,c$ as me,d0 as pe,d1 as ae,b5 as we}from"./lcards-main-C148JfkA.js";import{r as ge}from"./scene-helpers-qAOFaaBN.js";import{W as _,S as te,s as xe,c as ye,a as Me,w as Se,b as be,r as Le,d as _e,t as je,e as qe,f as Ce}from"./grid-surface-model-DOWBJmGy.js";import{G as ke,s as Pe}from"./scan-band-DqAGxl4h.js";const Ee={both:0,horizontal:1,vertical:2,diagonal:3,hexagonal:4,dots:5,polar:6},We=`
void main() {
  gl_Position = vec4( position.xy, 0.0, 1.0 );
}`,Re=`
precision highp float;
#define WELL_SEGMENTS ${_}
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
${ke}
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
}`,oe={flat:{tilt:90,distance:1},floor:{tilt:10,distance:1}};function Ge({colors:j}){var X;const e={uSize:{value:new S(1,1)},uInvViewProj:{value:new ne},uCamPos:{value:new H},uCamFwd:{value:new H},uDepth:{value:1},uScroll:{value:new S},uPattern:{value:0},uCell:{value:new S(40,40)},uCount:{value:new S(1,1)},uMajorRow:{value:0},uMajorCol:{value:0},uBorder:{value:true},uWidthMinor:{value:1},uWidthMajor:{value:2},uSpacing:{value:40},uHexR:{value:40},uDotR:{value:2},uColor:{value:[1,.6,.4,.3]},uColorMajor:{value:[1,.6,.4,.3]},uFill:{value:[0,0,0,0]},uScan:{value:[.87,.88,.91,1]},uScanZ:{value:0},uScanStrength:{value:0},uSurface:{value:0},uToLocal:{value:new se},uRadius:{value:1},uHalfLen:{value:0},uAround:{value:1},uSwap:{value:false},uInside:{value:false},uBack:{value:.25},uProfile:{value:new Array(_+1).fill(0)},uArc:{value:new Array(_+1).fill(0)},uWellMaxR:{value:1},uPolarC:{value:new S},uSpokes:{value:12},uSpokeOff:{value:0}},q=new ie({uniforms:e,vertexShader:We,fragmentShader:Re,transparent:true,premultipliedAlpha:true,depthTest:false,depthWrite:false,blending:ue}),T=new de(2,2),A=new ce(T,q);A.frustumCulled=false;const I=new fe;I.add(A);const re=new he(-1,1,1,-1,0,1),o=new ve(60,1,1,1e7);o.rotation.order="YXZ";let h=1,f=1;const C=new Map,k=M(s=>{if(!s||s==="transparent")return[0,0,0,0];let i=C.get(s);if(!i){const a=we(s,"rgba(0,0,0,0)");i=[a.r/255,a.g/255,a.b/255,a.a??1],C.set(s,i)}return i},"vec");let F=(X=j.scan)==null?void 0:X[0];const G=new H;let N=false,D=false,B="",v=[],V=1,P=0,Z=0;function O(s){G.set(0,s,.5).unproject(o);const i=G.sub(o.position).normalize();return i.y>-1e-5?null:o.position.z+i.z*(-o.position.y/i.y)}return M(O,"groundZ"),{scene:I,camera:re,material:q,view:o,seek(s,i){const a=i.model,t=i.params;(!a._rowHeight||!a._colWidth)&&a._computeGridDimensions(h,f);const Y=Math.max(5,Math.min(150,t.fov??60)),r=te[t.surface]?t.surface:"plane",b=r!=="plane",E=t.camera_yaw??0,$=t.camera_roll??0,J=Math.max(.05,t.camera_distance??1),K=f/(2*Math.tan(Y*Math.PI/360));o.fov=Y,o.aspect=h/Math.max(1,f);let u=null;if(b){u=xe(t,h,f),r==="well"&&t.surface_side==="inside"&&!D&&(Q.debug("[grid] surface_side: inside is not supported on a well; drawing the outside view"),D=true);const n=t.surface_side==="inside"&&r!=="well"?"inside":"outside",l=Math.max(0,Math.min(90,t.camera_tilt??ye(r,n))),c=Me({side:n,surface:r,axis:t.surface_axis,tilt:l,yaw:E,zoom:J,radius:u.radius,distance:K*J});if(o.position.set(...c.position),ee(o,{rotateY:c.rotateY,rotateX:c.rotateX,rotateZ:$}),e.uDepth.value=c.depth,e.uRadius.value=u.radius,e.uHalfLen.value=r==="cylinder"||r==="well"?u.halfLength:0,r==="well"){const y=JSON.stringify([t.well_profile,t.well_shape,t.well_throat,t.well_profile_to,t.well_morph,u.radius,u.halfLength]);y!==B&&(B=y,v=Se(t,u.radius),V=Math.max(...v),e.uArc.value=be(v,2*u.halfLength),e.uProfile.value=v);const R=s-Z;R>0&&R<1e3&&(P=(P+(t.well_ripple_speed??.5)*R/1e3)%1),Z=s;const z=Math.min(.9,Math.max(0,t.well_ripple??0));e.uWellMaxR.value=V*(1+z),z>0?e.uProfile.value=Le(v,z,Math.max(0,t.well_ripple_waves??3),P):e.uProfile.value!==v&&(e.uProfile.value=v)}e.uInside.value=n==="inside",e.uBack.value=Math.max(0,Math.min(1,t.back_opacity??.25));const x=_e(t.surface_rotate_x??0,t.surface_rotate_y??0,t.surface_rotate_z??0);e.uToLocal.value.fromArray(je(qe(r,t.surface_axis),x)).transpose(),e.uSwap.value=r==="cylinder"&&t.surface_axis==="horizontal"}else{const n=oe[t.view]??oe.flat,l=Math.max(1,Math.min(90,t.camera_tilt??n.tilt)),c=K*Math.max(.05,t.camera_distance??n.distance),x=l*Math.PI/180,y=E*Math.PI/180;o.position.set(h/2+c*Math.cos(x)*Math.sin(y),c*Math.sin(x),f/2+c*Math.cos(x)*Math.cos(y)),ee(o,{rotateY:E,rotateX:-l,rotateZ:$}),e.uDepth.value=c}e.uSurface.value=te[r],o.updateProjectionMatrix(),o.updateMatrixWorld(),e.uInvViewProj.value.multiplyMatrices(o.matrixWorld,o.projectionMatrixInverse),e.uCamPos.value.copy(o.position),o.getWorldDirection(e.uCamFwd.value);let d=Ee[a.pattern]??0;const m=Math.max(0,Math.round(a.spokeCount??12)),W=b&&d===6;W&&(d=m>0?0:e.uSwap.value?2:1),(r==="dome"||r==="sphere")&&(d===3||d===4)&&(N||Q.debug(`[grid] pattern '${a.pattern}' draws as 'both' on a ${r}`),N=true,d=0),e.uPattern.value=d,e.uCell.value.set(a._colWidth,a._rowHeight),b?e.uCount.value.set(0,0):e.uCount.value.set(a._totalCols,a._totalRows),e.uMajorRow.value=Math.max(0,a.majorRowInterval|0),e.uMajorCol.value=Math.max(0,a.majorColInterval|0),W&&e.uSwap.value&&(e.uMajorRow.value=Math.max(0,a.majorColInterval|0),e.uMajorCol.value=Math.max(0,a.majorRowInterval|0)),e.uSpokes.value=m,e.uPolarC.value.set((a.polarX??.5)*h,(a.polarY??.5)*f),e.uBorder.value=a.showBorderLines!==false,e.uWidthMinor.value=Math.max(0,a.lineWidthMinor),e.uWidthMajor.value=Math.max(0,a.lineWidthMajor),e.uSpacing.value=d===3?Math.max(a._colWidth,a._rowHeight):a.dotSpacing??a.lineSpacing,e.uHexR.value=a.hexRadius,e.uDotR.value=a.dotRadius??2,e.uColor.value=k(a.color),e.uColorMajor.value=k(a.colorMajor),e.uFill.value=k(a.fillColor);let p,w,L=null;if(d===6)L=me(a._rowHeight,a.lineSpacing,m,e.uMajorRow.value,e.uMajorCol.value),p=L.spoke,w=L.ring;else if(d===4){const n=Math.sqrt(3)*a.hexRadius;p=pe(2,Math.max(1,e.uMajorCol.value))*1.5*a.hexRadius,w=Math.max(1,e.uMajorRow.value)*n}else d===3||d===5?p=w=e.uSpacing.value:b?(p=a._colWidth*Math.max(1,e.uMajorCol.value),w=a._rowHeight*Math.max(1,e.uMajorRow.value)):(p=ae(a._colWidth,a._totalCols,e.uMajorCol.value),w=ae(a._rowHeight,a._totalRows,e.uMajorRow.value));u&&W&&m>0?e.uAround.value=m*(e.uSwap.value?a._rowHeight:a._colWidth)/(2*Math.PI*u.radius):u&&(e.uAround.value=Ce(u.radius,e.uSwap.value?w:p).scale);const U=M((n,l)=>l>0?(n%l+l)%l:n,"wrap");e.uScroll.value.set(U(a.scrollX,p),U(a.scrollY,w)),e.uSpokeOff.value=L&&m>0?e.uScroll.value.x/a.lineSpacing*(2*Math.PI/m):0;const g=Pe(s,t.scan_period??0);if(e.uScanStrength.value=g.strength,g.strength>0&&u){const n=u.radius,l=r==="well"?e.uArc.value[_]:r==="cylinder"?u.halfLength||u.extent/2:Math.PI/2*n,c=r==="sphere"?-l:r==="dome"||r==="well"?0:-l;e.uScanZ.value=l+(c-l)*g.pos}else if(g.strength>0){const n=O(-1)??f,l=O(1)??o.position.z-e.uDepth.value*5;e.uScanZ.value=l+(n-l)*g.pos}e.uScan.value=ge(F,[223/255,225/255,232/255,1])},resize(s,i){h=s,f=i,e.uSize.value.set(h,f)},setParam(){},setColors(s){var i;F=(i=s.scan)==null?void 0:i[0],C.clear()},dispose(){T.dispose(),q.dispose()}}}M(Ge,"createScene");export{oe as VIEWS,Ge as createScene,Pe as scanAt};
//# sourceMappingURL=grid-CMzq1l8V.js.map
