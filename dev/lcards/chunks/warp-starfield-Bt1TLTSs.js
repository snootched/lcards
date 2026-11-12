var T=Object.defineProperty;var r=(t,o)=>T(t,"name",{value:o,configurable:true});import{u as I,P as V,a5 as $,S as N,A as X,k as H,p as k,M as G,j as y,C as U}from"./three.module-DQ1AG__Q.js";import{s as Y,t as j}from"./scene-helpers-qAOFaaBN.js";import{S as L}from"./spectrum-glsl-BeKtUtCb.js";const h=60,O=-.5,B=9e3,W=24,P=70,Z=8,q=`
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
  float travel = fract( aPhase + uTime * aRate / ${B.toFixed(1)} );
  float z = mix( ${(-h).toFixed(1)}, ${O.toFixed(1)}, travel ) + position.z * uStretch;
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
}`,J=`
varying vec3 vColor;
varying float vViewDepth;
varying float vAlong;
// spectrum on, times how far the stars have stretched (dots keep their colour)
uniform float uSpectrum;
// 1: Doppler (violet at the tail), -1: reversed
uniform float uSpectrumDir;
${L}
void main() {
  float fade = ( 1.0 - smoothstep( ${(h*.45).toFixed(1)}, ${h.toFixed(1)}, vViewDepth ) ) * smoothstep( 0.0, ${Z.toFixed(1)}, vViewDepth );
  vec3 rgb = vColor;
  // (a uniform branch: no spectrum maths per pixel while it is off or on dots)
  if ( uSpectrum > 0.0 ) {
    vec4 w = warpSpectrum( vColor, vAlong, uSpectrumDir );
    rgb = mix( vColor, w.rgb, uSpectrum );
    fade *= mix( 1.0, w.a, uSpectrum );
  }
  gl_FragColor = vec4( rgb * fade, fade );
}`;function K(t){const o=Math.max(0,Math.min(1,(t-.15)/.75));return o*o*(3-2*o)}r(K,"spectrumAt");function re({params:t,colors:o}){const d=Math.max(1,Math.min(2e4,Math.round(t.count??600))),n=Y(t.seed??1),p=t.min_radius??.5,R=t.max_radius??2,S=new I,s=new V(P,1,.1,h+5),c=new $(.5,.2,1,8);c.rotateX(Math.PI/2),c.translate(0,0,-.5);const u=Array.from({length:d},()=>({x:(n()*2-1)*40,y:(n()*2-1)*24,phase:n(),rate:.6+n()*.8,size:2*(p+n()*(R-p)),slot:n()})),f={value:1},w={value:.01},M={value:new H},l=new N({uniforms:{uTime:{value:0},uStretch:f,uScaleXY:w,uDir:M,uSpectrum:{value:0},uSpectrumDir:{value:1}},vertexShader:q,fragmentShader:J,transparent:true,premultipliedAlpha:true,depthWrite:false,blending:X}),i=new k(c,l,d);i.frustumCulled=false,S.add(i);const x=new G;u.forEach((e,a)=>{x.makeScale(e.size,e.size,1).setPosition(e.x,e.y,0),i.setMatrixAt(a,x)}),c.setAttribute("aPhase",new y(new Float32Array(u.map(e=>e.phase)),1)),c.setAttribute("aRate",new y(new Float32Array(u.map(e=>e.rate)),1));const g=40;let v=1;function A(){s.fov=Math.max(20,Math.min(120,t.fov??P)),s.updateProjectionMatrix(),w.value=2*W*Math.tan(s.fov*Math.PI/360)/v}r(A,"updateFov");function C(){const e=r(a=>Math.max(-g,Math.min(g,a))*Math.PI/180,"rad");M.value.set(Math.tan(e(t.camera_yaw??0)),-Math.tan(e(t.camera_tilt??0)))}r(C,"updateDir");function _(){s.rotation.z=(t.camera_roll??0)*Math.PI/180}r(_,"updateRoll");function b(e){e==="fov"?A():e==="camera_tilt"||e==="camera_yaw"?C():e==="camera_roll"&&_()}r(b,"setParam"),C(),_();const E=new U;function D(e){var m;const a=(m=e.stars)!=null&&m.length?e.stars:[{r:255,g:255,b:255}];u.forEach((F,z)=>i.setColorAt(z,j(a[Math.floor(F.slot*a.length)%a.length],E))),i.instanceColor&&(i.instanceColor.needsUpdate=true)}return r(D,"setColors"),D(o),{scene:S,camera:s,seek(e,a){const m=Math.max(0,(a.speed??1)-1)*(t.streak??1);f.value=.05+m*.9,l.uniforms.uTime.value=e,l.uniforms.uSpectrum.value=t.spectrum?K(f.value):0,l.uniforms.uSpectrumDir.value=t.spectrum_direction==="reverse"?-1:1},resize(e,a){v=Math.max(1,a),s.aspect=e/v,A()},setParam:b,setColors:D,dispose(){c.dispose(),l.dispose(),i.dispose()}}}r(re,"createScene");export{re as createScene,K as spectrumAt};
//# sourceMappingURL=warp-starfield-Bt1TLTSs.js.map
