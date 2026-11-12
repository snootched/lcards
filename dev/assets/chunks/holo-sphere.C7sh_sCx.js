import{a as C,N as z,M as _,V as y,P as F,b as P,c as k,O as q}from"./instance.DkfKKL3N.js";import{r as M}from"./scene-helpers.DoVgHnOc.js";import{c as S,s as T,B as I}from"./BackgroundAnimationRenderer.Bi3RWZjJ.js";import"./number.Bx7EVHc7.js";import"./target.FfaGmL8c.js";import"./lcards-logging.BkMNBuzN.js";import"./reduced-motion.CR8xNM6Y.js";import"./resolve-color.DTQ_ay1J.js";import"./ColorUtils.Cit0BI8M.js";import"./theme.90cI75yW.js";import"./framework.DIp0zHSV.js";import"./template-string.D_XUSOOq.js";import"./ha-entity-display.CZm-V4fY.js";import"./effect-handle.ujHuwroQ.js";const O=`
void main() {
  gl_Position = vec4( position.xy, 0.0, 1.0 );
}`,R=`
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
  float dy = ( o.y - uBandY ) / ${I.toFixed(4)};
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
}`;function U({params:t,colors:B}){const e={uSize:{value:new y(1,1)},uCentre:{value:new y},uRadius:{value:1},uToObject:{value:new _},uLat:{value:7},uLon:{value:12},uWidth:{value:1},uColor:{value:[.5764705882352941,.8823529411764706,1,1]},uScan:{value:[.8745098039215686,.8823529411764706,.9098039215686274,1]},uBack:{value:.2},uBandY:{value:-2},uBandStrength:{value:0}},u=new C({uniforms:e,vertexShader:O,fragmentShader:R,transparent:!0,premultipliedAlpha:!0,depthTest:!1,depthWrite:!1,blending:z}),v=new F(2,2),p=new P(v,u);p.frustumCulled=!1;const g=new k;g.add(p);const L=new q(-1,1,1,-1,0,1);let i=S(t.scan_period??6),r=t.scan_period??6,c=1,s=1;function x(o){var n,l;e.uColor.value=M((n=o.lines)==null?void 0:n[0],[147/255,225/255,1,1]),e.uScan.value=M((l=o.scan)==null?void 0:l[0],[223/255,225/255,232/255,1])}return x(B),{scene:g,camera:L,material:u,seek(o,n){const l=T(t,c,s);e.uCentre.value.set(l.cx,l.cy),e.uRadius.value=l.r;const b=(n._angle??0)*Math.PI/180,w=(t.tilt??20)*Math.PI/180,d=Math.cos(b),f=Math.sin(b),h=Math.cos(w),m=Math.sin(w),a=[d,0,f,m*f,h,-m*d,-h*f,m,h*d];e.uToObject.value.set(a[0],a[3],a[6],a[1],a[4],a[7],a[2],a[5],a[8]),e.uLat.value=Math.max(0,Math.min(64,Math.round(t.latitude_lines??7))),e.uLon.value=Math.max(0,Math.min(128,Math.round(t.longitude_lines??12))),e.uWidth.value=Math.max(.1,t.line_width??1),e.uBack.value=Math.max(0,Math.min(1,t.back_opacity??.2)),(t.scan_period??6)!==r&&(r=t.scan_period??6,i=S(r)),i.seek(o),e.uBandY.value=i.band.y,e.uBandStrength.value=i.band.strength},resize(o,n){c=o,s=n,e.uSize.value.set(c,s)},setParam(){},setColors:x,dispose(){v.dispose(),u.dispose()}}}export{U as createScene};
