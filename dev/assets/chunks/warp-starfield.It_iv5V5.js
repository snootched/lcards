import{c as z,d as I,e as T,a as V,A as $,V as k,I as N,f as X,g as b,C as H}from"./instance.DkfKKL3N.js";import{s as G,t as U}from"./scene-helpers.DoVgHnOc.js";import"./number.Bx7EVHc7.js";import"./target.FfaGmL8c.js";const Y=`
// red at 0 to violet at 1 (hue 0 to 0.8)
vec3 spectral( float x ) {
  vec3 k = abs( mod( 0.8 * x * 6.0 + vec3( 0.0, 4.0, 2.0 ), 6.0 ) - 3.0 ) - 1.0;
  return clamp( k, 0.0, 1.0 );
}

// Where a colour sits on the ramp: its hue (magenta counts as violet), white and greys in the middle
float spectralPos( vec3 c ) {
  float mx = max( c.r, max( c.g, c.b ) );
  float mn = min( c.r, min( c.g, c.b ) );
  float d = mx - mn;
  if ( mx <= 0.0 || d <= 1e-4 ) return 0.5;
  float h;
  if ( mx == c.r ) h = mod( ( c.g - c.b ) / d, 6.0 );
  else if ( mx == c.g ) h = ( c.b - c.r ) / d + 2.0;
  else h = ( c.r - c.g ) / d + 4.0;
  h /= 6.0;
  float pos = h > 0.9 ? 0.0 : clamp( h / 0.8, 0.0, 1.0 );
  return mix( 0.5, pos, d / mx );
}

// A star's colour at 'along' its streak (0 tail, 1 head), Doppler shifted;
// .a is how much of it is still visible light
vec4 warpSpectrum( vec3 star, float along, float dir ) {
  float x = spectralPos( star ) + ( 0.5 - along ) * dir;
  float out_ = max( -x, x - 1.0 );
  return vec4( spectral( clamp( x, 0.0, 1.0 ) ), 1.0 - smoothstep( 0.0, 0.3, out_ ) );
}
`,m=60,L=-.5,O=9e3,j=24,D=70,B=8,W=`
uniform float uTime;
uniform float uStretch;
uniform float uScaleXY;
// Camera turned from the direction of travel: lateral drift per unit depth
uniform vec2 uDir;
attribute float aPhase;
attribute float aRate;
varying vec3 vColor;
varying float vViewDepth;
// 0 at the streak's tail, 1 at its head
varying float vAlong;
void main() {
  vAlong = position.z + 1.0;
  vec4 base = instanceMatrix * vec4( position.xy * uScaleXY, 0.0, 1.0 );
  float travel = fract( aPhase + uTime * aRate / ${O.toFixed(1)} );
  float z = mix( ${(-m).toFixed(1)}, ${L.toFixed(1)}, travel ) + position.z * uStretch;
  // Stars stream along the direction of travel, seen from a turned camera:
  // the farther they are, the more they sit toward where the ship is heading
  // (streaks lean the same way, since the tail is farther than the head)
  vec4 mv = modelViewMatrix * vec4( base.xy + uDir * z, z, 1.0 );
  gl_Position = projectionMatrix * mv;
  vViewDepth = -mv.z;
#ifdef USE_INSTANCING_COLOR
  vColor = instanceColor;
#else
  vColor = vec3( 1.0 );
#endif
}`,Z=`
varying vec3 vColor;
varying float vViewDepth;
varying float vAlong;
// spectrum on, times how far the stars have stretched (dots keep their colour)
uniform float uSpectrum;
// 1: Doppler (violet at the tail), -1: reversed
uniform float uSpectrumDir;
${Y}
void main() {
  float fade = ( 1.0 - smoothstep( ${(m*.45).toFixed(1)}, ${m.toFixed(1)}, vViewDepth ) ) * smoothstep( 0.0, ${B.toFixed(1)}, vViewDepth );
  vec3 rgb = vColor;
  // (a uniform branch: no spectrum maths per pixel while it is off or on dots)
  if ( uSpectrum > 0.0 ) {
    vec4 w = warpSpectrum( vColor, vAlong, uSpectrumDir );
    rgb = mix( vColor, w.rgb, uSpectrum );
    fade *= mix( 1.0, w.a, uSpectrum );
  }
  gl_FragColor = vec4( rgb * fade, fade );
}`;function q(e){const n=Math.max(0,Math.min(1,(e-.15)/.75));return n*n*(3-2*n)}function et({params:e,colors:n}){const d=Math.max(1,Math.min(2e4,Math.round(e.count??600))),r=G(e.seed??1),v=e.min_radius??.5,y=e.max_radius??2,p=new z,i=new I(D,1,.1,m+5),s=new T(.5,.2,1,8);s.rotateX(Math.PI/2),s.translate(0,0,-.5);const l=Array.from({length:d},()=>({x:(r()*2-1)*40,y:(r()*2-1)*24,phase:r(),rate:.6+r()*.8,size:2*(v+r()*(y-v)),slot:r()})),h={value:1},x={value:.01},g={value:new k},c=new V({uniforms:{uTime:{value:0},uStretch:h,uScaleXY:x,uDir:g,uSpectrum:{value:0},uSpectrumDir:{value:1}},vertexShader:W,fragmentShader:Z,transparent:!0,premultipliedAlpha:!0,depthWrite:!1,blending:$}),o=new N(s,c,d);o.frustumCulled=!1,p.add(o);const S=new X;l.forEach((t,a)=>{S.makeScale(t.size,t.size,1).setPosition(t.x,t.y,0),o.setMatrixAt(a,S)}),s.setAttribute("aPhase",new b(new Float32Array(l.map(t=>t.phase)),1)),s.setAttribute("aRate",new b(new Float32Array(l.map(t=>t.rate)),1));const w=40;let f=1;function M(){i.fov=Math.max(20,Math.min(120,e.fov??D)),i.updateProjectionMatrix(),x.value=2*j*Math.tan(i.fov*Math.PI/360)/f}function A(){const t=a=>Math.max(-w,Math.min(w,a))*Math.PI/180;g.value.set(Math.tan(t(e.camera_yaw??0)),-Math.tan(t(e.camera_tilt??0)))}function C(){i.rotation.z=(e.camera_roll??0)*Math.PI/180}function P(t){t==="fov"?M():t==="camera_tilt"||t==="camera_yaw"?A():t==="camera_roll"&&C()}A(),C();const R=new H;function _(t){var u;const a=(u=t.stars)!=null&&u.length?t.stars:[{r:255,g:255,b:255}];l.forEach((E,F)=>o.setColorAt(F,U(a[Math.floor(E.slot*a.length)%a.length],R))),o.instanceColor&&(o.instanceColor.needsUpdate=!0)}return _(n),{scene:p,camera:i,seek(t,a){const u=Math.max(0,(a.speed??1)-1)*(e.streak??1);h.value=.05+u*.9,c.uniforms.uTime.value=t,c.uniforms.uSpectrum.value=e.spectrum?q(h.value):0,c.uniforms.uSpectrumDir.value=e.spectrum_direction==="reverse"?-1:1},resize(t,a){f=Math.max(1,a),i.aspect=t/f,M()},setParam:P,setColors:_,dispose(){s.dispose(),c.dispose(),o.dispose()}}}export{et as createScene,q as spectrumAt};
