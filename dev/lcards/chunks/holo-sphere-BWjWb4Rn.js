var z=Object.defineProperty;var p=(a,i)=>z(a,"name",{value:i,configurable:true});import{S as _,m as F,a6 as k,k as L,i as P,b as q,u as T,O as I}from"./three.module-DQ1AG__Q.js";import{r as M}from"./scene-helpers-qAOFaaBN.js";import{cY as B,cZ as O,c_ as R}from"./lcards-main-C148JfkA.js";const W=`
void main() {
  gl_Position = vec4( position.xy, 0.0, 1.0 );
}`,A=`
precision highp float;
uniform vec2 uSize;
uniform vec2 uCentre;
uniform float uRadius;
uniform mat3 uToObject;
uniform float uLat;
uniform float uLon;
uniform float uWidth;
uniform vec4 uColor;
uniform vec4 uScan;
uniform float uBack;
uniform float uBandY;
uniform float uBandStrength;

const float PI = 3.14159265358979;

vec4 acc;
void over( vec3 rgb, float a ) {
  acc = vec4( rgb * a, a ) + acc * ( 1.0 - a );
}

float band( float d, float w ) {
  float f = 0.6;
  return clamp( ( min( d + f, w * 0.5 ) - max( d - f, -w * 0.5 ) ) / ( 2.0 * f ), 0.0, 1.0 );
}

// depthAlpha() of the model: full in front, uBack behind, a short blend at the limb
float depthAlpha( float z ) {
  float t = clamp( ( z + 0.15 ) / 0.3, 0.0, 1.0 );
  return uBack + ( 1.0 - uBack ) * t * t * ( 3.0 - 2.0 * t );
}

// The wireframe at one hit point (view-space z on the unit sphere)
void surface( vec2 q, float z ) {
  vec3 o = uToObject * vec3( q, z );
  float lat = asin( clamp( o.y, -1.0, 1.0 ) );
  float lon = atan( o.z, o.x );
  // Longitude without the jump at +-pi, for its screen derivative
  float lon2 = atan( -o.z, -o.x );
  float dLat = length( vec2( dFdx( lat ), dFdy( lat ) ) );
  float dLon = min( length( vec2( dFdx( lon ), dFdy( lon ) ) ), length( vec2( dFdx( lon2 ), dFdy( lon2 ) ) ) );
  float cov = 0.0;
  if ( uLat > 0.5 ) {
    // Rings between the poles: lat = -pi/2 + pi * i / (uLat + 1), i = 1..uLat
    float step = PI / ( uLat + 1.0 );
    float i = clamp( floor( ( lat + PI * 0.5 ) / step + 0.5 ), 1.0, uLat );
    float d = abs( lat - ( -PI * 0.5 + step * i ) );
    cov = max( cov, band( d / max( dLat, 1e-6 ), uWidth ) );
  }
  if ( uLon > 0.5 ) {
    float step = 2.0 * PI / uLon;
    float d = abs( mod( lon + step * 0.5, step ) - step * 0.5 );
    cov = max( cov, band( d / max( dLon, 1e-6 ), uWidth ) );
  }
  if ( cov <= 0.0 ) return;
  float depth = depthAlpha( z );
  float dy = ( o.y - uBandY ) / ${R.toFixed(4)};
  float glow = clamp( uBandStrength * exp( -dy * dy ) * uScan.a, 0.0, 1.0 );
  float la = depth * uColor.a;
  // The band lights the lines it crosses (Canvas2D strokes them again in the scan colour)
  vec3 rgb = mix( uColor.rgb, uScan.rgb, glow );
  over( rgb, cov * clamp( la + glow * depth * ( 1.0 - la ), 0.0, 1.0 ) );
}

void main() {
  acc = vec4( 0.0 );
  // Pixel centre, top-left origin, then the unit sphere's frame (y up)
  vec2 px = vec2( gl_FragCoord.x, uSize.y - gl_FragCoord.y );
  vec2 q = ( px - uCentre ) / uRadius;
  q.y = -q.y;
  float r2 = dot( q, q );
  // Outside the disk: nothing (the lines' screen derivatives blow up at the limb)
  if ( r2 >= 1.0 ) { gl_FragColor = vec4( 0.0 ); return; }
  float z = sqrt( max( 0.0, 1.0 - r2 ) );
  surface( q, -z );
  surface( q, z );
  gl_FragColor = acc;
}`;function N({params:a,colors:i}){const e={uSize:{value:new L(1,1)},uCentre:{value:new L},uRadius:{value:1},uToObject:{value:new k},uLat:{value:7},uLon:{value:12},uWidth:{value:1},uColor:{value:[.5764705882352941,.8823529411764706,1,1]},uScan:{value:[.8745098039215686,.8823529411764706,.9098039215686274,1]},uBack:{value:.2},uBandY:{value:-2},uBandStrength:{value:0}},r=new _({uniforms:e,vertexShader:W,fragmentShader:A,transparent:true,premultipliedAlpha:true,depthTest:false,depthWrite:false,blending:F}),g=new P(2,2),x=new q(g,r);x.frustumCulled=false;const b=new T;b.add(x);const C=new I(-1,1,1,-1,0,1);let u=B(a.scan_period??6),c=a.scan_period??6,s=1,d=1;function w(o){var n,l;e.uColor.value=M((n=o.lines)==null?void 0:n[0],[147/255,225/255,1,1]),e.uScan.value=M((l=o.scan)==null?void 0:l[0],[223/255,225/255,232/255,1])}return p(w,"setColors"),w(i),{scene:b,camera:C,material:r,seek(o,n){const l=O(a,s,d);e.uCentre.value.set(l.cx,l.cy),e.uRadius.value=l.r;const S=(n._angle??0)*Math.PI/180,y=(a.tilt??20)*Math.PI/180,f=Math.cos(S),h=Math.sin(S),v=Math.cos(y),m=Math.sin(y),t=[f,0,h,m*h,v,-m*f,-v*h,m,v*f];e.uToObject.value.set(t[0],t[3],t[6],t[1],t[4],t[7],t[2],t[5],t[8]),e.uLat.value=Math.max(0,Math.min(64,Math.round(a.latitude_lines??7))),e.uLon.value=Math.max(0,Math.min(128,Math.round(a.longitude_lines??12))),e.uWidth.value=Math.max(.1,a.line_width??1),e.uBack.value=Math.max(0,Math.min(1,a.back_opacity??.2)),(a.scan_period??6)!==c&&(c=a.scan_period??6,u=B(c)),u.seek(o),e.uBandY.value=u.band.y,e.uBandStrength.value=u.band.strength},resize(o,n){s=o,d=n,e.uSize.value.set(s,d)},setParam(){},setColors:w,dispose(){g.dispose(),r.dispose()}}}p(N,"createScene");export{N as createScene};
//# sourceMappingURL=holo-sphere-BWjWb4Rn.js.map
