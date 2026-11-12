var Ft=Object.defineProperty;var g=(e,t)=>Ft(e,"name",{value:t,configurable:true});import{a8 as Tt,a9 as _t,L as Ne,aa as jt,ab as Et,ac as Rt,N as Wt,W as ft,k as oe,G as Ge,ad as ht,S as fe,b as we,ae as Pt,E as Ht,af as Dt,C as Ke,f as pt,M as de,$ as I,z as $e,V as W,y as Ie,a6 as mt,ag as qt,r as Bt,u as Nt,A as vt,m as Xe,s as $t,c as It,F as me,U as Vt,D as Ut}from"./three.module-DQ1AG__Q.js";import{N as Gt,s as be}from"./noise-glsl-BA2w49__.js";import{s as Ce}from"./scene-helpers-qAOFaaBN.js";import{b as Ye,n as s,i as ve,s as Q,D as ce,F as Ee,p as bt}from"./volume-DZauerbA.js";import{dp as ae,bP as Kt}from"./lcards-main-C148JfkA.js";import{a as gt,O as Xt,M as Re,b as ot}from"./index-Ckfcp9Z5.js";import{B as Yt}from"./borg-face-glsl-CIeMPBAQ.js";const se=g(e=>`${e>>>0}u`,"u32"),wt=668265263,yt=8,Zt=`
float lcHash3( ivec3 p ) {
  uint h = ( ( uint( p.x ) * ${se(ae.X)} ) ^ ( uint( p.y ) * ${se(ae.Y)} ) ^ ( uint( p.z ) * ${se(wt)} ) ) + ${se(ae.S)};
  h ^= h >> 16u;
  h *= ${se(ae.M1)};
  h ^= h >> 15u;
  h *= ${se(ae.M2)};
  h ^= h >> 16u;
  // -1 .. 1
  return float( h ) / 2147483648.0 - 1.0;
}

float lcNoise3( ivec3 cell, vec3 local ) {
  vec3 fl = floor( local );
  ivec3 i = cell + ivec3( fl );
  vec3 f = local - fl;
  vec3 u = f * f * ( 3.0 - 2.0 * f );
  float x00 = mix( lcHash3( i ), lcHash3( i + ivec3( 1, 0, 0 ) ), u.x );
  float x10 = mix( lcHash3( i + ivec3( 0, 1, 0 ) ), lcHash3( i + ivec3( 1, 1, 0 ) ), u.x );
  float x01 = mix( lcHash3( i + ivec3( 0, 0, 1 ) ), lcHash3( i + ivec3( 1, 0, 1 ) ), u.x );
  float x11 = mix( lcHash3( i + ivec3( 0, 1, 1 ) ), lcHash3( i + ivec3( 1, 1, 1 ) ), u.x );
  return mix( mix( x00, x10, u.y ), mix( x01, x11, u.y ), u.z );
}

// fBm, about -1 .. 1 (each octave doubles the frequency, halves the amplitude)
float lcFbm3( ivec3 cell, vec3 local, int octaves ) {
  float value = 0.0;
  float amplitude = 0.5;
  float total = 0.0;
  for ( int k = 0; k < ${yt}; k++ ) {
    if ( k >= octaves ) break;
    value += amplitude * lcNoise3( cell, local );
    total += amplitude;
    amplitude *= 0.5;
    cell *= 2;
    local *= 2.0;
  }
  return value / max( total, 1e-6 );
}
`,Me=64,Qt=4,Jt=4;function ea(e,t,a){let o=((Math.imul(e,ae.X)^Math.imul(t,ae.Y)^Math.imul(a,wt))>>>0)+ae.S>>>0;return o^=o>>>16,o=Math.imul(o,ae.M1)>>>0,o^=o>>>15,o=Math.imul(o,ae.M2)>>>0,o^=o>>>16,(o>>>0)/4294967296}g(ea,"hash01");function ta(e=Me){const t=new Float32Array(e*e*e);let a=0;for(let l=0,d=Qt,r=.5;l<Jt;l++,d*=2,r*=.5){const u=Math.min(d,e),i=new Float32Array(u*u*u);for(let v=0;v<u;v++)for(let b=0;b<u;b++)for(let M=0;M<u;M++)i[M+u*(b+u*v)]=ea(M,b,v+l*1013);const x=new Int32Array(e),h=new Int32Array(e),k=new Float32Array(e);for(let v=0;v<e;v++){const b=v/e*u,M=Math.floor(b),w=b-M;x[v]=M%u,h[v]=(M+1)%u,k[v]=w*w*(3-2*w)}for(let v=0;v<e;v++){const b=x[v]*u*u,M=h[v]*u*u,w=k[v];for(let m=0;m<e;m++){const f=x[m]*u,C=h[m]*u,S=k[m],j=e*(m+e*v);for(let A=0;A<e;A++){const p=x[A],_=h[A],T=k[A],P=i[p+f+b]+(i[_+f+b]-i[p+f+b])*T,L=i[p+C+b]+(i[_+C+b]-i[p+C+b])*T,G=i[p+f+M]+(i[_+f+M]-i[p+f+M])*T,E=i[p+C+M]+(i[_+C+M]-i[p+C+M])*T,K=P+(L-P)*S,ie=G+(E-G)*S;t[A+j]+=r*(K+(ie-K)*w)}}}a+=r}const o=new Uint8Array(t.length);for(let l=0;l<t.length;l++)o[l]=Math.round(t[l]/a*255);return o}g(ta,"noiseVolume");let We=null;function aa(){if(We)return We;const e=new Tt(ta(),Me,Me,Me);return e.format=_t,e.minFilter=e.magFilter=Ne,e.wrapS=e.wrapT=e.wrapR=jt,e.unpackAlignment=1,e.needsUpdate=true,We=e,e}g(aa,"noiseTexture");const rt=.5,Ae=new WeakMap;function oa(e){if(!e.isMesh)return false;const t=e.material;return Array.isArray(t)?t.some(a=>a&&a.depthWrite&&a.visible!==false):!!t&&t.depthWrite&&t.visible!==false}g(oa,"isSolid");function ra(e,t,a,o,l,d){var M;const r=Math.max(4,Math.round(o*rt)),u=Math.max(4,Math.round(l*rt));let i=Ae.get(t);if(i&&i.frame===d&&i.image.size.x===o&&i.image.size.y===l)return i.image;if(!i||i.target.width!==r||i.target.height!==u){i==null||i.target.dispose(),(M=i==null?void 0:i.target.depthTexture)==null||M.dispose();const w=new Et(r,u,Rt);w.minFilter=w.magFilter=Wt,i={target:new ft(r,u,{depthBuffer:true,depthTexture:w}),frame:-1,image:{texture:w,near:0,far:0,ortho:false,size:new oe,target:new oe(r,u)}},Ae.set(t,i)}const x=[];t.traverseVisible(w=>{(w.isMesh||w.isLine||w.isPoints||w.isSprite)&&!oa(w)&&x.push(w)});for(const w of x)w.visible=false;const h=t.background,k=e.getRenderTarget(),v=e.autoClear;try{t.background=null,e.setRenderTarget(i.target),e.autoClear=false,e.clear(false,true,false),e.render(t,a)}finally{for(const w of x)w.visible=true;t.background=h,e.setRenderTarget(k),e.autoClear=v}i.frame=d;const b=i.image;return b.near=a.near,b.far=a.far,b.ortho=a.isOrthographicCamera===true,b.size.set(o,l),b}g(ra,"solidDepth");function la(e){var a;const t=Ae.get(e);t&&((a=t.target.depthTexture)==null||a.dispose(),t.target.dispose(),Ae.delete(e))}g(la,"disposeSolidDepth");const na=`
uniform sampler2D uSolid;
uniform float uSolidOn;
uniform vec2 uSolidSize;
uniform vec2 uSolidPlanes;
uniform float uSolidOrtho;
float solidViewDepth() {
  if ( uSolidOn < 0.5 ) return 1e30;
  float d = texture2D( uSolid, gl_FragCoord.xy / uSolidSize ).x;
  if ( d >= 1.0 ) return 1e30;
  float z = uSolidOrtho > 0.5 ? orthographicDepthToViewZ( d, uSolidPlanes.x, uSolidPlanes.y ) : perspectiveDepthToViewZ( d, uSolidPlanes.x, uSolidPlanes.y );
  return -z;
}
`;function ia(){return{uSolid:{value:null},uSolidOn:{value:0},uSolidSize:{value:new oe(1,1)},uSolidPlanes:{value:new oe(.1,1e3)},uSolidOrtho:{value:0}}}g(ia,"solidUniforms");function sa(e,t){e.uSolidOn.value=t?1:0,t&&(e.uSolid.value=t.texture,e.uSolidSize.value.copy(t.target),e.uSolidPlanes.value.set(t.near,t.far),e.uSolidOrtho.value=t.ortho?1:0)}g(sa,"useSolidDepth");const Ve=18,ua="var(--lcards-green-medium)",ca="var(--lcards-green-lightest)",da="var(--lcards-gray-medium)";function fa(e){if(Array.isArray(e)&&e.length===3)return e.map(a=>Math.max(.001,s(a,20)));const t=Math.max(.001,s(e,20));return[t,t,t]}g(fa,"cubeSize");function ha(e){const t=Ce(e),a=[];for(let o=0;o<Ve;o++){const l=o<6?o:Math.floor(t()*6);a.push([l,(t()*2-1)*.8,(t()*2-1)*.8,t()])}return a}g(ha,"cubeSpots");const pa=`
uniform vec3 uCamObj;
uniform vec3 uDirObj;
varying vec3 vObj;
varying vec3 vCamObj;
varying vec3 vDirObj;
void main() {
  vObj = position;
  vCamObj = uCamObj;
  // the view direction, for an orthographic camera (parallel rays)
  vDirObj = uDirObj;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,ma=`
uniform vec3 uColor;
uniform vec3 uGlow;
uniform float uTime;
uniform float uDetail;
uniform float uOpacity;
uniform vec4 uSpots[${Ve}];
// three gives a fragment shader the view matrix only; model-view comes from the CPU
uniform mat4 uModelView;
uniform mat4 uProj;
varying vec3 vObj;
varying vec3 vCamObj;
varying vec3 vDirObj;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
${Yt}
void main() {
  vec3 rd = isOrthographic ? normalize(vDirObj) : normalize(vObj - vCamObj);
  vec3 ro = isOrthographic ? vObj - rd * 4.0 : vCamObj;
  rd += vec3(equal(rd, vec3(0.0))) * 1e-6;
  vec3 nC, nL;
  float tIn = boxHit(ro, rd, 1.0, nC);
  if (tIn < 0.0) tIn = 0.0;   // the camera inside the box: start here
  // flat faces (detail off) carry the lattice on the face itself
  float latB = uDetail > 0.5 ? 1.0 - DEPTH * 0.3 : 1.0;
  float tLat = boxHit(ro, rd, latB, nL);
  // how big a pixel is on the cube, in face units
  float pxUV = max(length(fwidth(vObj)), 1e-4);

  // ── Relief march through the carved shell (as the screen effect) ──
  float tHit = -1.0;
  vec3 n = vec3(0.0);
  float t0 = tIn;
  int k0 = uDetail > 0.5 ? outsideAxis(ro + rd * (tIn + 1e-4)) : -1;
  if (k0 < 0) { tHit = tIn; n = nC; }
  else {
    float dt = DEPTH / 6.0;
    for (int i = 0; i < 56; i++) {
      float t1 = t0 + dt;
      vec3 p = ro + rd * t1;
      if (max(abs(p.x), max(abs(p.y), abs(p.z))) > 1.0001) break;
      int k = outsideAxis(p);
      if (k < 0) { tHit = t1; break; }
      t0 = t1; k0 = k;
    }
    if (tHit > 0.0) {
      for (int i = 0; i < 6; i++) {
        float tm = (t0 + tHit) * 0.5;
        int k = outsideAxis(ro + rd * tm);
        if (k < 0) tHit = tm; else { t0 = tm; k0 = k; }
      }
      vec3 pa = ro + rd * t0, pb = ro + rd * tHit;
      float da = reliefDepth(axisUV(pa, k0), axisFace(pa, k0));
      float db = reliefDepth(axisUV(pb, k0), axisFace(pb, k0));
      if (abs(da - db) < 1e-4) {
        n[k0] = sign(pb[k0]);
      } else {
        int u = (k0 + 1) - 3 * ((k0 + 1) / 3), v = (k0 + 2) - 3 * ((k0 + 2) / 3);
        int w = abs(rd[u]) > abs(rd[v]) ? u : v;
        n[w] = -sign(rd[w]);
      }
    }
  }

  // view space: three's camera looks down -z with +y up
  vec3 L = normalize(vec3(-0.45, 0.55, 0.7));
  vec3 col = vec3(0.0);
  float a = 0.0;
  vec3 pDepth = ro + rd * max(tHit, tIn);
  if (tHit >= 0.0) {
    vec3 p = ro + rd * tHit;
    vec3 ap = abs(p);
    int k = ap.x > ap.y ? (ap.x > ap.z ? 0 : 2) : (ap.y > ap.z ? 1 : 2);
    vec2 uv = axisUV(p, k);
    float face = axisFace(p, k);
    float rise = uDetail > 0.5 ? 1.0 - clamp((1.0 - ap[k]) / DEPTH, 0.0, 1.0) : 1.0;
    bool wall = abs(n[k]) < 0.5;
    vec3 nv = normalize((uModelView * vec4(n, 0.0)).xyz);
    vec3 faceN = vec3(k == 0, k == 1, k == 2) * sign(p[k]);
    vec3 faceNv = normalize((uModelView * vec4(faceN, 0.0)).xyz);
    float diff = max(dot(nv, L), 0.0);
    float top = smoothstep(0.35, 0.85, faceNv.y);
    vec3 side = mix(vec3(0.2, 0.25, 0.21), uColor * 0.5, 0.6);
    vec3 metal = mix(side, vec3(0.34, 0.38, 0.35), top);
    metal *= 0.7 + 0.6 * hash(floor((uv * 0.5 + 0.5) * 14.0 + 0.37) + face);
    vec4 fine = greebleLayer((uv * 0.5 + 0.5) * 36.0 + 0.71, face * 17.0 + 9.0);
    float fineK = 1.0 - smoothstep(0.2, 0.45, pxUV * 36.0);
    float detail = wall
      ? 0.75 + 0.25 * step(0.5, fract((1.0 - ap[k]) * 90.0))
      : (1.0 + 0.6 * fine.y * fineK) * (1.0 - 0.6 * fine.z * fineK);
    // flat faces (detail off): the machinery as shading only
    if (uDetail < 0.5) detail *= 0.55 + 0.45 * (1.0 - reliefDepth(uv, face) / DEPTH);
    float ao = mix(0.3, 1.0, rise);
    col = metal * (0.3 + 1.0 * diff) * ao * detail;
    col += uColor * 0.16 * (1.0 - rise) * (1.0 - top);
    for (int i = 0; i < ${Ve}; i++) {
      vec4 sp = uSpots[i];
      if (abs(sp.x - face) > 0.5) continue;
      float d = length(uv - sp.yz);
      float period = 2000.0 + 3000.0 * fract(sp.w * 7.31);
      float pulse = 0.55 + 0.45 * sin(uTime / period * 6.2832 + sp.w * 6.2832);
      float gl = exp(-d * d / 0.03) * pulse;
      col += mix(uColor, uGlow, 0.3) * gl * (0.6 + 2.2 * (1.0 - rise) + 0.8 * diff);
    }
    a = 1.0;
  }
  // the rail lattice over the machinery in front of it
  if (tLat >= 0.0 && (tHit < 0.0 || tLat <= tHit + 1e-5)) {
    vec3 pl = ro + rd * tLat;
    float axisL;
    vec2 uvL = faceUV(pl, nL, axisL) / latB;
    float faceL = axisL * 2.0 + (dot(nL, vec3(1.0)) > 0.0 ? 1.0 : 0.0);
    vec3 nLv = normalize((uModelView * vec4(nL, 0.0)).xyz);
    float lat = lattice(uvL, faceL, pxUV * 2.0) * 0.9;
    vec3 latCol = mix(vec3(0.55, 0.6, 0.57), uColor * 0.8, 0.25) * (0.5 + 0.5 * max(dot(nLv, L), 0.0));
    col = latCol * lat + col * (1.0 - lat);
    a = lat + a * (1.0 - lat);
    if (a == lat) pDepth = pl;
  }
  if (a < 0.5) discard;
  gl_FragColor = vec4(col / a, uOpacity);
  vec4 clip = uProj * uModelView * vec4(pDepth, 1.0);
  gl_FragDepth = clamp(clip.z / clip.w * 0.5 + 0.5, 0.0, 1.0);
}`,va=`
varying vec3 vN;
void main() {
  vN = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,ba=`
uniform vec3 uColor;
uniform float uOpacity;
varying vec3 vN;
void main() {
  float diff = max(dot(normalize(vN), normalize(vec3(-0.45, 0.55, 0.7))), 0.0);
  gl_FragColor = vec4(uColor * (0.35 + 0.65 * diff), uOpacity);
}`;function Pe(e){const t=new Ke().setRGB(e[0],e[1],e[2],pt);return new W(t.r,t.g,t.b)}g(Pe,"linear");function xt(e,t,a,o){const l=[],d=[e,t,a];for(let r=0;r<3;r++){const u=(r+1)%3,i=(r+2)%3;for(const x of[-1,1])for(let h=0;h<=o;h++){const k=-1+2*h/o,v=[0,0,0],b=[0,0,0];v[i]=b[i]=x*d[i],v[u]=b[u]=k*d[u],v[r]=-d[r],b[r]=d[r],l.push([...v,...b])}}return l}g(xt,"boxRuns");function to(e,t){const a=new Ge;a.name=`cube:${e.id??""}`;const[o,l,d]=fa(e.size),r=Ye(e,a,{radius:Math.hypot(o,l,d)/2}),u=new ht(2,2,2);let i,x;if(e.shape==="box"){const h=t.color(e.color,da);x=h;const k=s(e.opacity,1)*(h[3]??1),v=new fe({uniforms:{uColor:{value:Pe(h)},uOpacity:{value:k}},vertexShader:va,fragmentShader:ba,transparent:k<1,depthWrite:k>=1,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1});if(i=new we(u,v),ve(e.edges,true)){const b=t.color(Q(e.edges).color,"theme:colors.ui.secondary"),M=new Pt(new Ht(u),new Dt({color:new Ke().setRGB(b[0],b[1],b[2],pt),transparent:true,opacity:b[3]??1}));M.name="edges",i.add(M)}}else{const h=ha(s(e.seed,1)),k=t.color(Q(e.glow).color,ca);x=k;const v={uColor:{value:Pe(t.color(e.color,ua))},uGlow:{value:Pe(k)},uTime:{value:0},uDetail:{value:e.detail===false?0:1},uOpacity:{value:1},uSpots:{value:h.map(w=>new I(w[0],w[1],w[2],w[3]))},uModelView:{value:new de},uProj:{value:new de},uCamObj:{value:new W},uDirObj:{value:new W}},b=new fe({name:"lcards-borg-cube",uniforms:v,vertexShader:pa,fragmentShader:ma,side:$e});i=new we(u,b);const M=new de;i.onBeforeRender=(w,m,f)=>{v.uModelView.value.multiplyMatrices(f.matrixWorldInverse,i.matrixWorld),v.uProj.value.copy(f.projectionMatrix);const C=i.worldToLocal(f.getWorldPosition(new W));v.uCamObj.value.copy(C);const S=f.getWorldDirection(new W);v.uDirObj.value.copy(S.transformDirection(M.copy(i.matrixWorld).invert()));const j=Math.max(Math.abs(C.x),Math.abs(C.y),Math.abs(C.z))<1;b.side=j?Ie:$e},r.tick=(w,m)=>(v.uTime.value=m,true)}return i.name="cube",i.scale.set(o/2,l/2,d/2),a.add(i),gt(r,{runs:xt(o/2,l/2,d/2,3),color:x,body:[i]}),r.pickMeshes.push(i),r.occludes=e.occlude!==false,r.occluder="depth",r.occludes&&i.layers.enable(Xt),r}g(to,"buildCube");const ga=48,wa=5,ya=4,Z="0.55",ee="0.08",xa=.5,St=2.7;function Sa(e){if(Array.isArray(e)){const a=Math.max(.001,s(e[0],200));return[a,Math.max(.001,s(e[1],a/5)),Math.max(.001,s(e[2],a))]}const t=Math.max(.001,s(e,200));return[t,t,t]}g(Sa,"regionBox");function Ca(e,t){const a=Math.PI*t.waves*(e+1),o=t.base+t.ay*(Math.sin(a+t.phase)+.3*Math.sin(2.3*a+1.7+t.phase*1.3))/1.3,l=t.az*Math.sin(.7*a+.9+t.phase*.8);return[o,l]}g(Ca,"ribbonAt");const B=14;function Ma(e){const t=new de().makeRotationFromEuler(new $t(e.turn[0],e.turn[1],e.turn[2],"YXZ")),a=new mt().setFromMatrix4(t).transpose(),o=a.elements;for(let l=0;l<3;l++)for(let d=0;d<3;d++)o[l*3+d]/=e.axes[d];return a}g(Ma,"cloudMatrix");const lt=`
varying vec3 vLocal;
void main() {
  vLocal = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Aa=`
precision highp float;
precision highp sampler3D;
#include <packing>
${na}
uniform sampler3D uNoise;
varying vec3 vLocal;
uniform vec3 uCam;
uniform vec3 uFwd;
uniform float uOrtho;
uniform float uWorldScale;
uniform float uBall;
uniform vec3 uHalf;
uniform int uCount;
uniform vec4 uClouds[ ${B} ];
uniform mat3 uShapes[ ${B} ];
uniform vec4 uTints[ ${B} ];
uniform vec4 uBase;
uniform vec4 uCore;
uniform float uDust;
uniform vec3 uDustColor;
uniform float uDensity;
uniform float uK;
uniform float uMinStep;
uniform float uTurb;
uniform float uFreq;
uniform vec3 uWarpOff;
uniform vec3 uWispOff;
uniform vec4 uStops[ 4 ];
uniform int uStopCount;
uniform vec4 uBand;
// band: its glow's half-thickness (of the half height); the open gap's half-height
uniform float uBandW;
uniform float uGap;
// columns: width range (multipliers); a vortex's radius at its middle against its ends
uniform vec2 uColWidth;
uniform float uWaist;
uniform float uTime;
uniform int uColKind;
uniform int uColCount;
uniform vec4 uColColor;
// lights in the gas (lightning): local xyz and radius; rgb and level
uniform vec4 uLights[ 4 ];
uniform vec4 uLightColor[ 4 ];
uniform int uLightCount;
uniform float uVeins;
// wake (the Nexus): the ribbon's curve (waves along x, amplitude in y and z of the half size, phase)
// and the wake (the ribbon's height, side +1 up / -1 down, how far it leans back along x going out); the ribbon's glow colour
uniform vec4 uRibbon;
uniform vec3 uWake;
uniform vec3 uRibbonGlow;
uniform vec3 uRibbonCore;

vec2 enterLeave( vec3 ro, vec3 rd ) {
  if ( uBall > 0.5 ) {
    float R = uHalf.x;
    float b = dot( ro, rd );
    float c = dot( ro, ro ) - R * R;
    float h = b * b - c;
    if ( h < 0.0 ) return vec2( 1.0, 0.0 );
    h = sqrt( h );
    return vec2( -b - h, -b + h );
  }
  vec3 inv = 1.0 / rd;
  vec3 t0 = ( -uHalf - ro ) * inv;
  vec3 t1 = ( uHalf - ro ) * inv;
  vec3 tmin = min( t0, t1 );
  vec3 tmax = max( t0, t1 );
  return vec2( max( max( tmin.x, tmin.y ), tmin.z ), min( min( tmax.x, tmax.y ), tmax.z ) );
}

// a fixed turn (about 37 degrees round a tilted axis)
const mat3 WISP_TURN = mat3( 0.80, 0.36, -0.48, -0.20, 0.91, 0.36, 0.56, -0.20, 0.80 );

float edge( vec3 p ) {
  if ( uBall > 0.5 ) return smoothstep( 0.0, 0.3, 1.0 - length( p ) / uHalf.x );
  // a rounded box (superellipse): no hard face or corner shows
  vec3 q = abs( p ) / uHalf;
  q *= q;
  return smoothstep( 0.0, 0.45, 1.0 - sqrt( sqrt( dot( q, q ) ) ) );
}

// cavity: where the hollow sits (it breaks out of the gas on the +z side) and its radius
const vec3 CAVITY = vec3( 0.0, 0.0, 0.5 );
const float HOLLOW = 0.55;

// bipolar: a lobe's radius (round the y axis) at a height 0 (the waist) to 1 (its far end), over the region
float lobe( float s ) {
  s = clamp( s, 0.0, 1.0 );
  // a cup: narrow at the waist, widest about two thirds out, closing at the end
  return 0.05 + 0.6 * sqrt( s ) * pow( 1.0 - s, 0.3 );
}

// noise is streaked along these axes (smaller: longer streaks)
#if SHAPE == 2
const vec3 STREAK = vec3( 1.0, 0.4, 1.0 );
#elif SHAPE == 3
const vec3 STREAK = vec3( 0.3, 1.0, 1.0 );
#elif SHAPE == 5
// layers: long rolling streaks along x, flatter in y
const vec3 STREAK = vec3( 0.25, 1.6, 0.6 );
#elif SHAPE == 6
// wake: streaked out from the ribbon (the direction it streams)
const vec3 STREAK = vec3( 0.9, 0.45, 0.9 );
#else
const vec3 STREAK = vec3( 1.0 );
#endif

// the region's form over the region (q: -1 to 1 inside), 0 to 1
float envelope( vec3 q ) {
  float r = length( q );
#if SHAPE == 1
  // shell: a hollow sphere, the gas at about three quarters of the radius
  float d = ( r - 0.75 ) / 0.09;
  return exp( -d * d );
#elif SHAPE == 2
  // bipolar: an hourglass up and down the y axis, two hollow lobes joined at a pinched waist;
  // the gas is in their walls (bright where seen edge on), a little inside
  float s = abs( q.y ) / 0.95;
  float rho = lobe( s );
  // distance to the wall, not just across: the wall leans where the lobe widens or closes
  float slope = ( lobe( s + 0.02 ) - lobe( s - 0.02 ) ) / 0.04 / 0.95;
  float d = ( length( q.xz ) - rho ) / sqrt( 1.0 + slope * slope );
  float wall = exp( -pow( d / 0.06, 2.0 ) );
  float fill = 0.2 * ( 1.0 - smoothstep( -0.05, 0.0, d ) );
  return max( wall, fill ) * ( 1.0 - smoothstep( 0.9, 1.0, s ) );
#elif SHAPE == 4
  // cavity: a thick cup of gas round a hollow that opens on its +z side (a blister:
  // a bright bowl seen from there, a crescent from the side), faintly lit inside
  float h = length( q - CAVITY );
  float cup = smoothstep( HOLLOW - 0.05, HOLLOW + 0.06, h ) * ( 1.0 - smoothstep( HOLLOW + 0.2, HOLLOW + 0.45, h ) );
  return max( cup, 0.06 * ( 1.0 - smoothstep( 0.0, HOLLOW, h ) ) ) * ( 1.0 - smoothstep( 0.75, 1.0, r ) );
#else
  return 1.0;
#endif
}

#if SHAPE == 5
// layers: a floor and a ceiling of gas with a gap between; their surfaces roll in ridges
// and troughs (h: the surface noise, about -2 to 2). Returns the field and how deep in (0 to 1).
vec2 layerField( vec3 p, vec3 q ) {
  vec3 s = vec3( p.x * 0.35, 0.0, p.z * 0.8 ) * uFreq;
  float hf = ( texture( uNoise, s + vec3( 0.0, 0.21, 0.0 ) + uWarpOff ).r - ${Z} ) / ${ee};
  float hc = ( texture( uNoise, s + vec3( 0.5, 0.63, 0.3 ) + uWarpOff ).r - ${Z} ) / ${ee};
  // ridged: sharp crests, broad troughs
  float ff = ( texture( uNoise, s * 3.1 + vec3( 0.2, 0.47, 0.8 ) + uWarpOff * 1.7 ).r - ${Z} ) / ${ee};
  float rf = 1.0 - abs( hf ) + 0.35 * ff;
  float rc = 1.0 - abs( hc ) - 0.35 * ff;
  float top = -uGap + 0.12 * rf;
  float bot = uGap - 0.12 * rc;
  float fl = smoothstep( 0.0, 0.1, top - q.y );
  float ce = smoothstep( 0.0, 0.1, q.y - bot );
  float depth = fl >= ce ? ( top - q.y ) / 0.7 : ( q.y - bot ) / 0.7;
  return vec2( max( fl, ce ), clamp( depth, 0.0, 1.0 ) );
}

// columns between floor and ceiling, on a sunflower spiral over the region: kind 1 fire
// (wide at the foot, rising flame, a splash ring on the floor), 2 vortex (a twisting hourglass, dark
// at its rim). Thinner than a march step, so each is added once where the ray passes its axis.
vec2 columnAt( int j ) {
  float fa = float( j ) * 2.39996 + 0.7;
  return vec2( cos( fa ), sin( fa ) ) * sqrt( ( float( j ) + 0.5 ) / float( uColCount ) ) * 0.75 * uHalf.xz;
}
float columnWidth( int j ) {
  return mix( uColWidth.x, uColWidth.y, fract( float( j ) * 0.618 + 0.37 ) );
}
float columnBase( int j ) {
  return uHalf.x * ( uColKind == 2 ? 0.05 : 0.045 ) * ( 0.7 + 0.6 * fract( float( j ) * 0.618 ) ) * columnWidth( j );
}
float columnRadius( int j, float qy ) {
  float R = columnBase( j );
  float prof = uColKind == 2 ? 1.75 * uWaist + 1.75 * ( 1.0 - uWaist ) * pow( abs( qy ) / 0.35, 2.0 ) : 1.15 - 0.75 * clamp( ( qy + 0.35 ) / 0.7, 0.0, 1.0 );
  return R * min( prof, 2.5 );
}
// the glow (rgb) and cover (a) a ray picks up passing column j at its closest point t
vec4 columnPass( int j, vec3 ro, vec3 rd, float t ) {
  vec3 p = ro + rd * t;
  vec3 q = p / uHalf;
  if ( abs( q.y ) > 0.55 ) return vec4( 0.0 );
  float rr = columnRadius( j, q.y );
  // the axis waves as it rises (within the pass window: about half a radius)
  float wv = p.y * 0.045 + float( j ) * 1.7 + uTime * ( uColKind == 2 ? 6.0e-4 : 3.0e-4 );
  vec2 off = p.xz - columnAt( j ) - vec2( sin( wv ), cos( wv * 1.3 ) ) * rr * ( uColKind == 2 ? 0.12 : 0.45 );
  float d = length( off ) / rr;
  if ( d > 2.0 ) return vec4( 0.0 );
  // across the column as seen (for the flame's streaks), twisting for a vortex
  vec2 h = normalize( rd.xz + 1e-6 );
  float side = ( h.x * off.y - h.y * off.x ) / rr;
  float rise = uTime * ( uColKind == 2 ? 1.0e-5 : 4.0e-5 );
  float tw = uColKind == 2 ? q.y * 4.0 + uTime * 1.2e-3 : 0.0;
  float zc = ( texture( uNoise, vec3( ( side + tw ) * ( uColKind == 2 ? 0.15 : 0.3 ), p.y * 0.6 * uFreq - rise, float( j ) * 0.13 ) ).r - ${Z} ) / ${ee};
  float zf = ( texture( uNoise, vec3( ( side + tw ) * 0.9 + 0.31, p.y * 1.9 * uFreq - rise * 2.5, float( j ) * 0.13 + 0.5 ) ).r - ${Z} ) / ${ee};
  // fire: fine flame streaks; a vortex keeps its smooth twist
  zc = uColKind == 2 ? zc : zc * 0.7 + zf * 0.5;
  float chord = min( 1.0 / max( length( rd.xz ), 0.05 ), 3.0 );
  float ends = 1.0 - smoothstep( 0.4, 0.55, abs( q.y ) );
  float body = exp( -d * d * 1.6 ) * smoothstep( -0.6, 1.1, zc ) * ends * chord;
  float glow = body * ( uColKind == 1 ? 1.0 : 0.8 );
  float cover = clamp( body * 0.5, 0.0, 1.0 );
  if ( uColKind == 2 ) cover = clamp( cover + exp( -pow( ( d - 1.05 ) / 0.3, 2.0 ) ) * ends * 0.35 * chord, 0.0, 0.9 );
  // white-hot heart, the sheets' surface colour at the edge (fire); the column colour throughout (vortex)
  vec3 col = uColKind == 1 ? mix( uColColor.rgb, uStops[ 0 ].rgb, smoothstep( 0.1, 1.1, d ) ) : uColColor.rgb;
  return vec4( col * glow, cover );
}
// the fire's splash ring on the floor (wide and flat: sampled with the gas)
float splash( vec3 p, vec3 q ) {
  float b = 0.0;
  for ( int j = 0; j < ${B}; j++ ) {
    if ( j >= uColCount ) break;
    float R = columnBase( j );
    float rl = length( p.xz - columnAt( j ) ) / R;
    b += exp( -pow( ( rl - 1.9 ) / 0.4, 2.0 ) ) * exp( -pow( ( q.y + 0.24 ) / 0.05, 2.0 ) ) / columnWidth( j );
  }
  return b;
}

#endif

#if SHAPE == 6
// the ribbon's curve across the region's length (x: -1 to 1 of the half size): its y and z there
vec2 ribbonAt( float x ) {
  float a = 3.14159265 * uRibbon.x * ( x + 1.0 );
  float y = uWake.x + uRibbon.y * ( sin( a + uRibbon.w ) + 0.3 * sin( 2.3 * a + 1.7 + uRibbon.w * 1.3 ) ) / 1.3;
  float z = uRibbon.z * sin( 0.7 * a + 0.9 + uRibbon.w * 0.8 );
  return vec2( y, z );
}
// the wake: a sheet of gas trailing the ribbon on one side, thickening and thinning out away
// from it. x: the field; y: how far out (0 at the ribbon, 1 at the far edge); z: near the ribbon
vec3 wakeField( vec3 q ) {
  q.y *= uWake.y;
  // leaning: further out, the gas comes from further along the ribbon (a fan trailing to one side)
  q.x += uWake.z * max( q.y - uWake.x, 0.0 );
  vec2 c = ribbonAt( q.x );
  float dy = q.y - c.x;
  float dz = q.z - c.y;
  float slope = ( ribbonAt( q.x + 0.01 ).x - ribbonAt( q.x - 0.01 ).x ) / 0.02 * uHalf.y / uHalf.x;
  float u = dy / max( 1.0 - c.x, 0.1 );
  float th = 0.1 + 0.5 * clamp( u, 0.0, 1.0 );
  float across = exp( -pow( dz / th, 2.0 ) );
  float fall = u >= 0.0 ? exp( -2.4 * u ) * ( 1.0 - smoothstep( 0.4, 0.9, u ) ) : exp( -pow( u / 0.05, 2.0 ) );
  // true distance to the ribbon (the curve leans where it waves), of the half height
  float dc = length( vec2( dy * uHalf.y / sqrt( 1.0 + slope * slope ), dz * uHalf.z ) ) / uHalf.y;
  float near = exp( -pow( dc / 0.14, 2.0 ) );
  return vec3( across * fall, clamp( u, 0.0, 1.0 ), near );
}
#endif

#if SHAPE == 5 || SHAPE == 6
// colour stops through a sheet's depth (0: its surface)
vec4 layerTint( float d ) {
  if ( uStopCount < 2 ) return uStops[ 0 ];
  float x = d * float( uStopCount - 1 );
  int i = int( floor( x ) );
  vec4 c = uStops[ 0 ];
  for ( int j = 0; j < 3; j++ ) if ( j == i ) c = mix( uStops[ j ], uStops[ j + 1 ], fract( x ) );
  return i >= uStopCount - 1 ? uStops[ uStopCount - 1 ] : c;
}
#endif

void main() {
  vec3 ro;
  vec3 rd;
  if ( uOrtho > 0.5 ) {
    rd = uFwd;
    ro = vLocal - rd * 4.0 * length( uHalf );
  } else {
    ro = uCam;
    rd = normalize( vLocal - uCam );
  }
  vec2 ab = enterLeave( ro, rd );
  // from the camera (perspective) or its plane (orthographic) on
  float start = uOrtho > 0.5 ? dot( uCam - ro, rd ) : 0.0;
  float a = max( ab.x, start );
  float b = ab.y;
  // stop at the nearest solid: its view depth over this ray's share of the view direction
  float along = dot( rd, uFwd );
  if ( along > 1e-4 ) {
    float solid = ( solidViewDepth() / uWorldScale - dot( ro - uCam, uFwd ) ) / along;
    b = min( b, solid );
  }
  // only where the ray passes through a cloud: from the first one it enters to the last it leaves
  // (a ray that misses them all costs nothing more, and every sample lands in gas)
  float c0 = 1e30;
  float c1 = -1e30;
#if SHAPE == 0 || SHAPE == 3
  for ( int j = 0; j < ${B}; j++ ) {
    if ( j >= uCount ) break;
    vec3 oc = ro - uClouds[ j ].xyz;
    float hb = dot( oc, rd );
    float h = hb * hb - dot( oc, oc ) + uClouds[ j ].w * uClouds[ j ].w;
    if ( h <= 0.0 ) continue;
    h = sqrt( h );
    c0 = min( c0, -hb - h );
    c1 = max( c1, -hb + h );
  }
  a = max( a, c0 );
  b = min( b, c1 );
#endif
  if ( b <= a ) discard;
  // steps no shorter than uMinStep: a short span through gas takes fewer samples
  float dt = max( ( b - a ) / float( STEPS ), uMinStep );
  // a different start per pixel: steps show as grain, not as bands
  float jitter = fract( 52.9829189 * fract( dot( gl_FragCoord.xy, vec2( 0.06711056, 0.00583715 ) ) ) );
  // emission per unit length: at density 1 a ray through the middle of a cloud gathers about 1
  float k = uDensity * uK;
  vec3 acc = vec3( 0.0 );
  float alpha = 0.0;
#if SHAPE == 5
  // where the ray crosses the band's plane (y = 0), if it does
  float bandT = abs( rd.y ) > 1e-5 ? -ro.y / rd.y : -1.0;
  if ( bandT < a || bandT > b ) bandT = -1e30;
  // where the ray passes closest to each column's axis, in order along it (each step then checks
  // only the next one)
  float colT[ ${B} ];
  int colI[ ${B} ];
  int colN = 0;
  for ( int j = 0; j < ${B}; j++ ) {
    if ( j >= uColCount ) break;
    vec2 o = ro.xz - columnAt( j );
    float vv = dot( rd.xz, rd.xz );
    if ( vv < 1e-8 ) continue;
    float tc = -dot( o, rd.xz ) / vv;
    // passes near enough to show, inside the span
    vec2 near = o + rd.xz * tc;
    if ( tc < a || tc > b || dot( near, near ) > 25.0 * uHalf.x * uHalf.x * 0.0081 * uColWidth.y * uColWidth.y ) continue;
    int k = colN;
    for ( int m = ${B} - 1; m > 0; m-- ) {
      if ( m > colN ) continue;
      if ( colT[ m - 1 ] > tc ) { colT[ m ] = colT[ m - 1 ]; colI[ m ] = colI[ m - 1 ]; k = m - 1; } else break;
    }
    colT[ k ] = tc;
    colI[ k ] = j;
    colN++;
  }
  int colNext = 0;
#endif
  for ( int i = 0; i < STEPS; i++ ) {
    float t = a + ( float( i ) + jitter ) * dt;
    if ( t > b ) break;
    vec3 p = ro + rd * t;
    // the clouds' shape (how far into one), and their colour and opacity where they overlap
    float field = 0.0;
    float dark = 0.0;
    float boost = 1.0;
#if SHAPE == 0 || SHAPE == 3
    vec4 tint = vec4( 0.0 );
    float tw = 0.0;
#else
    // a soft floor: where no cloud reaches (a shape's envelope), the first colour
    vec4 tint = uBase * 1e-3;
    float tw = 1e-3;
#endif
    for ( int j = 0; j < ${B}; j++ ) {
      if ( j >= uCount ) break;
      vec3 d = uShapes[ j ] * ( p - uClouds[ j ].xyz );
      float dd = dot( d, d );
      float w = max( 0.0, 1.0 - dd );
      w *= w;
      if ( uClouds[ j ].w < 0.0 ) { dark += w; continue; }
      field += w;
#if SHAPE == 0 || SHAPE == 3
      tint += w * uTints[ j ];
      tw += w;
#else
      // shapes: colour from the nearest clouds, reaching past their edges
      float wc = exp( -2.0 * dd );
      tint += wc * uTints[ j ];
      tw += wc;
#endif
    }
#if SHAPE == 5
    vec2 lf = layerField( p, p / uHalf );
    // a faint haze fills the gap (the gas never quite clears); the band lights it round the middle
    float bg = uBand.a * exp( -pow( p.y / uHalf.y / max( uBandW * 3.0, uGap ), 2.0 ) ) * ( 1.0 - lf.x );
    field = max( lf.x * 1.2, 0.16 + 0.12 * min( bg, 1.0 ) );
    tint = layerTint( lf.y );
    tint.rgb = mix( tint.rgb, uBand.rgb, clamp( bg, 0.0, 1.0 ) );
    tw = 1.0;
    boost = 1.0 + 0.4 * bg;
    // the band's light through the gap: smooth (not the gas's noise), bright seen along it
    acc += ( 1.0 - alpha ) * uBand.rgb * bg * edge( p ) * 0.15 * dt / uHalf.x;
    // the band itself: a thin bright sheet at the middle, added once where the ray crosses it
    if ( uBand.a > 0.0 && abs( bandT - t ) <= 0.5 * dt ) {
      vec3 pb = ro + rd * bandT;
      float zb = ( texture( uNoise, vec3( pb.x * 0.6, 0.37, pb.z * 0.6 ) * uFreq + uWarpOff ).r - ${Z} ) / ${ee};
      float ln = uBand.a * min( uBandW * 0.15 / max( abs( rd.y ), 1e-3 ), 1.5 ) * clamp( 0.75 + 0.35 * zb, 0.2, 1.6 ) * edge( pb );
      acc += ( 1.0 - alpha ) * uBand.rgb * ln;
      alpha += ( 1.0 - alpha ) * clamp( ln * 0.1, 0.0, 1.0 );
    }
    // (only near the floor's surface)
    if ( uColKind == 1 && abs( p.y / uHalf.y + 0.24 ) < 0.15 ) {
      float sp = clamp( splash( p, p / uHalf ), 0.0, 1.0 );
      field = max( field, sp * 1.4 );
      tint = mix( tint, uColColor, sp );
      boost *= 1.0 + 2.0 * sp;
    }
    // liquid fire: fine bright veins in the sheets' surfaces, darker between (high contrast)
    if ( uVeins > 0.0 && lf.y < 0.4 ) {
      float fz = ( texture( uNoise, vec3( p.x * 0.9, p.y * 1.6, p.z * 1.4 ) * uFreq * 1.3 + uWispOff ).r - ${Z} ) / ${ee};
      float vein = pow( max( 0.0, 1.0 - abs( fz ) * 0.6 ), 3.0 );
      float near = ( 1.0 - smoothstep( 0.0, 0.4, lf.y ) ) * uVeins;
      field *= mix( 1.0, 0.45 + 1.1 * vein, near );
      boost *= 1.0 + 2.5 * vein * near;
    }
    // columns this step passes (in order along the ray)
    for ( int g = 0; g < 2; g++ ) {
      if ( colNext >= colN ) break;
      float tc = colT[ colNext ];
      if ( tc >= t + 0.5 * dt ) break;
      vec4 c = columnPass( colI[ colNext ], ro, rd, tc );
      acc += ( 1.0 - alpha ) * c.rgb;
      alpha += ( 1.0 - alpha ) * c.a;
      colNext++;
    }
#elif SHAPE == 6
    vec3 wk = wakeField( p / uHalf );
    // the clouds give clumps in the sheet
    field = wk.x * ( 0.75 + 0.35 * min( field, 1.0 ) ) * 1.8;
    tint = layerTint( wk.y );
    tint.rgb = mix( tint.rgb, uRibbonGlow, 0.6 * wk.z );
    // white-hot right at the ribbon
    tint.rgb = mix( tint.rgb, uRibbonCore, 0.85 * wk.z * wk.z * wk.z );
    tw = 1.0;
    // the ribbon lights the gas round it
    boost = 1.4 + 4.0 * wk.z;
#elif SHAPE != 0 && SHAPE != 3
    // the shape gives the form, the clouds the clumps in it
    field = envelope( p / uHalf ) * ( 0.35 + 0.65 * min( field, 1.0 ) ) * 1.15;
#endif
    if ( field < 1e-4 && dark < 1e-4 ) continue;
    tint /= max( tw, 1e-6 );
    // deep in the gas (a shape: near its middle), the core colour
#if SHAPE == 0 || SHAPE == 3
    float coreAt = smoothstep( 0.45, 1.1, field );
#else
    float coreAt = 1.0 - smoothstep( 0.0, 0.65, length( p / uHalf ) );
#endif
#if SHAPE == 6
    tint.rgb = mix( tint.rgb, uCore.rgb, uCore.a * wk.z );
#elif SHAPE != 5
    tint.rgb = mix( tint.rgb, uCore.rgb, uCore.a * coreAt );
#endif
    vec3 pn = p * STREAK;
    float n1 = texture( uNoise, pn * uFreq + uWarpOff ).r;
    // wisps: finer, and pushed about by the coarse field (curls, not blobs)
    // (turned against the texture's axes: its repeat and grid do not line up with the coarse field's)
    float n2 = texture( uNoise, WISP_TURN * pn * uFreq * ${St.toFixed(1)} + uWispOff + ( n1 - ${Z} ) * 2.5 ).r;
    // the texture's fBm is narrow (mean about 0.55, spread about 0.08): standardise it
    float z = ( n1 * 0.65 + n2 * 0.35 - ${Z} ) / ${ee};
    // the noise moves each cloud's edge in and out: ragged edges and holes, a dense middle
    float gas = smoothstep( 0.0, 0.5, min( field, 1.0 ) - 0.6 * uTurb + z * 0.5 * uTurb );
#if SHAPE == 3
    // filaments: thin wrinkled sheets where the noise crosses its middle (thread-like seen edge on)
    float zr = ( n1 - ${Z} ) / ${ee};
    float zs = ( n2 - ${Z} ) / ${ee};
    float ridge = pow( max( 0.0, 1.0 - abs( zr + 0.15 * zs ) * 0.7 ), 5.0 );
    gas = smoothstep( 0.0, 0.35, min( field, 1.0 ) ) * ridge * 3.0;
#elif SHAPE == 4
    // cavity: the wall of the hollow is lit (the stars inside)
    float rq = length( p / uHalf - CAVITY );
    float rim = exp( -pow( ( rq - HOLLOW - 0.06 ) / 0.07, 2.0 ) );
    gas *= 1.0 + 2.5 * rim;
#endif
    // brighter filaments, darker lanes
    float glow = 0.5 + 0.5 * smoothstep( -1.5, 1.5, z );
    float fade = edge( p );
    float s = clamp( gas * tint.a * fade * k * dt, 0.0, 1.0 );
    // dust: dark gas, eroded as the gas is, that hides what is behind it
    float sd = 0.0;
    if ( dark > 1e-4 ) {
      float dgas = smoothstep( 0.0, 0.5, min( dark, 1.0 ) - 0.6 * uTurb + z * 0.5 * uTurb );
      sd = clamp( dgas * uDust * fade * k * 4.0 * dt, 0.0, 1.0 );
    }
    // lit from inside (a strike): the gas brightens and takes the light's colour
    vec3 lit = vec3( 0.0 );
    for ( int j = 0; j < 4; j++ ) {
      if ( j >= uLightCount ) break;
      vec3 dl = p - uLights[ j ].xyz;
      float x2 = dot( dl, dl ) / ( uLights[ j ].w * uLights[ j ].w );
      lit += uLightColor[ j ].rgb * uLightColor[ j ].a * ( exp( -x2 ) + 0.3 / ( 1.0 + 2.0 * x2 ) );
    }
    float litL = max( lit.r, max( lit.g, lit.b ) );
    acc += ( 1.0 - alpha ) * ( ( tint.rgb * glow * boost * ( 1.0 + 2.5 * litL ) + lit * 2.0 ) * s * ( 1.0 - sd ) + uDustColor * sd );
    alpha += ( 1.0 - alpha ) * clamp( s + sd, 0.0, 1.0 );
    if ( alpha > 0.98 ) break;
  }
  // premultiplied: add adds acc, normal lays it over
  gl_FragColor = vec4( acc, alpha );
}`,ka=`
precision highp float;
uniform sampler2D uGas;
uniform vec2 uFull;
uniform float uOpacity;
void main() {
  vec4 c = texture2D( uGas, gl_FragCoord.xy / uFull );
  if ( c.a <= 0.002 ) discard;
  gl_FragColor = c * uOpacity;
}`,ke=1.7*St;function nt(e,t){const a=g(o=>o-Math.floor(o),"fr");return{body:[a(e.body[0]+t[0]),a(e.body[1]+t[1])],wisp:[a(e.wisp[0]+t[0]*ke),a(e.wisp[1]+t[1]*ke)]}}g(nt,"stepDrift");function za(e){const a=[[],[],[]];for(let o=0;o<=96;o++){const l=o/96*Math.PI*2,d=Math.cos(l),r=Math.sin(l);a[0].push(e[0]*d,0,e[2]*r),a[1].push(e[0]*d,e[1]*r,0),a[2].push(0,e[1]*d,e[2]*r)}return a}g(za,"ballRuns");function La(e,t,a,o){const l=new Ge;l.name=`nebula:${e.id??""}`;const d=e.size===void 0,r=d?(()=>{const n=Math.max(.001,s(e.radius,100));return[n,n,n]})():Sa(e.size).map(n=>n/2),u=a.clouds.slice(0,B),i=u.filter(n=>!n.dust),x=i.length?i.reduce((n,c)=>n+c.radius,0)/i.length:1,h=Math.max(0,Kt.indexOf(e.shape)),k=h===3?64:ga,v=e.noise_scale!==void 0?Math.max(0,s(e.noise_scale,0)):wa/x,b=h===3?.8:h===6?2.2:h>0?xa:1,M=v/ya*(e.noise_scale===void 0?b:1),w=o(0),m=Q(e.core).color,f=m!==void 0?t.color(m,"#ffffff"):null,C=Q(e.dust),S=C.color!==void 0?t.color(C.color,"#000000"):[0,0,0],j=Math.max(1,Math.min(4,Array.isArray(e.colors)?e.colors.length:1)),A=h===5&&ve(e.band,false)?Q(e.band):null,p=h===5&&e.columns?Q(e.columns):null,_=ve(e.lightning,false)?Q(e.lightning):null,T=A?t.color(A.color,ce.glow):[0,0,0],P=h===6?Q(e.wake):null,L=h===6?Q(e.ribbon):null,G=(P==null?void 0:P.side)==="down"?-1:1,E={waves:Math.max(0,s(L==null?void 0:L.waves,2.5)),ay:Math.max(0,s(L==null?void 0:L.amplitude,.2)),az:Math.max(0,s(L==null?void 0:L.amplitude,.2))*.6,phase:0,base:-.55},K=L?t.color(L.color,ce.glow):[1,1,1,1],ie=L?Q(L.glow):{},O=L?ie.color!==void 0?t.color(ie.color,ce.glow):o(0):[1,1,1,1],R=L?s(L.speed,0):0,F={...ia(),uNoise:{value:aa()},uCam:{value:new W},uFwd:{value:new W(0,0,-1)},uOrtho:{value:0},uWorldScale:{value:1},uBall:{value:d?1:0},uHalf:{value:new W(r[0],r[1],r[2])},uCount:{value:u.length},uClouds:{value:Array.from({length:B},(n,c)=>u[c]?new I(u[c].xyz[0],u[c].xyz[1],u[c].xyz[2],Math.max(...u[c].axes)*(u[c].dust?-1:1)):new I(0,0,0,1))},uShapes:{value:Array.from({length:B},(n,c)=>u[c]?Ma(u[c]):new mt)},uBase:{value:new I(w[0],w[1],w[2],(w[3]??1)*.55)},uCore:{value:f?new I(f[0],f[1],f[2],1):new I(0,0,0,0)},uDust:{value:Math.max(0,Math.min(1,s(C.amount,.8)))},uDustColor:{value:new W(S[0],S[1],S[2])},uTints:{value:Array.from({length:B},(n,c)=>{if(!u[c]||u[c].dust)return new I(0,0,0,0);const z=o(u[c].color);return new I(z[0],z[1],z[2],(z[3]??1)*u[c].opacity)})},uDensity:{value:Math.max(0,s(e.density,1))},uK:{value:2.2/x},uMinStep:{value:x/10},uTurb:{value:Math.max(0,Math.min(1,s(e.turbulence,.5)))},uFreq:{value:M},uWarpOff:{value:new W},uWispOff:{value:new W},uStops:{value:Array.from({length:4},(n,c)=>{const z=o(Math.min(c,j-1));return new I(z[0],z[1],z[2],(z[3]??1)*.8)})},uStopCount:{value:j},uBand:{value:A?new I(T[0],T[1],T[2],Math.max(0,s(A.brightness,1))):new I(0,0,0,0)},uBandW:{value:A?Math.max(.01,Math.min(.5,s(A.width,.08))):.08},uGap:{value:Math.max(0,Math.min(.45,s(e.gap,.56)/2))},uColWidth:{value:(()=>{const n=p==null?void 0:p.width,c=Array.isArray(n)?[s(n[0],1),s(n[1]??n[0],1)]:[s(n,1),s(n,1)];return new oe(Math.max(.1,Math.min(c[0],c[1])),Math.max(.1,c[0],c[1]))})()},uWaist:{value:Math.max(.05,Math.min(1,s(p==null?void 0:p.waist,.2)))},uTime:{value:0},uColKind:{value:p?Math.max(0,["none","fire","vortex"].indexOf(p.kind??"fire")):0},uLights:{value:Array.from({length:Re},()=>new I(0,0,0,1))},uLightColor:{value:Array.from({length:Re},()=>new I(0,0,0,0))},uLightCount:{value:0},uRibbon:{value:new I(E.waves,E.ay,E.az,0)},uWake:{value:new W(E.base,G,Math.max(-1,Math.min(1,s(P==null?void 0:P.lean,0))))},uRibbonCore:{value:new W(K[0],K[1],K[2])},uRibbonGlow:{value:new W(O[0],O[1],O[2])},uVeins:{value:h===5?Math.max(0,Math.min(1,s(e.veins,0))):0},uColCount:{value:p&&p.kind!=="lightning"?Math.min(B,Math.max(0,Math.round(s(p.count,4)))):0},uColColor:{value:(()=>{const n=p?t.color(p.color,ce.glow):[1,1,1,1];return new I(n[0],n[1],n[2],n[3]??1)})()}},re=new fe({uniforms:F,vertexShader:lt,fragmentShader:Aa,defines:{SHAPE:h,STEPS:k},depthTest:false,depthWrite:false,side:Ie,blending:qt}),Ze=d?new Bt(r[0]*1.02,3):new ht(r[0]*2,r[1]*2,r[2]*2),ye=new we(Ze,re);ye.matrixAutoUpdate=false,ye.frustumCulled=false;const ze=new Nt;ze.add(ye),ze.matrixWorldAutoUpdate=false;let X=null;const Le={uGas:{value:null},uFull:{value:new oe(1,1)},uOpacity:{value:Math.max(0,s(e.opacity,1))}},Ct=e.blend!=="normal",Mt=new fe({uniforms:Le,vertexShader:lt,fragmentShader:ka,transparent:true,premultipliedAlpha:true,depthTest:false,depthWrite:false,side:Ie,blending:Ct?vt:Xe}),V=new we(Ze,Mt);V.name="nebula-volume",V.renderOrder=2.25,l.add(V);const Oe=new de,Qe=new W,Je=new Ke,At=g(n=>{Oe.copy(V.matrixWorld).invert(),n.getWorldPosition(Qe),F.uCam.value.copy(Qe).applyMatrix4(Oe),n.getWorldDirection(F.uFwd.value),F.uFwd.value.transformDirection(Oe),F.uOrtho.value=n.isOrthographicCamera?1:0,F.uWorldScale.value=V.matrixWorld.getMaxScaleOnAxis()},"aim"),$=Ye(e,l,{radius:Math.hypot(r[0],r[1],r[2]),materials:[re]}),Fe=new Map,Te=new de,le=new W;$.setLights=(n,c)=>{var H;if(c.length)Fe.set(n,c);else if(!Fe.delete(n))return;const z=[...Fe.values()].flat().sort((D,J)=>J.level-D.level).slice(0,Re);V.updateWorldMatrix(true,false),Te.copy(V.matrixWorld).invert();const q=V.matrixWorld.getMaxScaleOnAxis()||1;z.forEach((D,J)=>{le.set(D.at[0],D.at[1],D.at[2]).applyMatrix4(Te),F.uLights.value[J].set(le.x,le.y,le.z,Math.max(.001,D.radius/q)),F.uLightColor.value[J].set(D.color[0],D.color[1],D.color[2],D.level)}),F.uLightCount.value=z.length,(H=t.requestFrame)==null||H.call(t)},$.contains=n=>(V.updateWorldMatrix(true,false),le.set(n[0],n[1],n[2]).applyMatrix4(Te.copy(V.matrixWorld).invert()),d?le.length()<=r[0]:Math.abs(le.x)<=r[0]&&Math.abs(le.y)<=r[1]&&Math.abs(le.z)<=r[2]);const _e=g(()=>{const n=[];for(let c=0;c<=160;c++){const z=-.92+1.84*c/160,[q,H]=Ca(z,E);n.push(z*r[0],q*G*r[1],H*r[2])}return n},"ribRun"),Y=p&&p.kind==="lightning"?ot({type:"lightning",id:`${$.id}:columns`,mode:"column",count:Math.min(B,Math.max(1,Math.round(s(p.count,4)))),size:[r[0]*2,r[1]*.5,r[2]*2],color:p.color,glow:p.glow,speed:p.speed,seed:s(e.seed,1)},t):null,U=_?ot(h===6&&_.mode==="crawl"?{seed:s(e.seed,1),..._,type:"lightning",id:`${$.id}:lightning`,mode:"crawl",size:[r[0]*2,r[1]*2,r[2]*2],path:g(()=>_e(),"path"),up:[0,G,0]}:{seed:s(e.seed,1),..._,type:"lightning",id:`${$.id}:lightning`,mode:"strike",size:[r[0]*1.8,r[1]*(h===5?.75:1.5),r[2]*1.8]},t):null;for(const n of[Y,U])n&&(l.add(n.node),$.lines.push(...n.lines));gt($,{runs:d?za(r):xt(r[0],r[1],r[2],1),color:[...w],body:[V,...[Y,U].filter(n=>!!n).map(n=>n.node)]});const he=[];if(L&&ve(e.ribbon,true)){const n=Math.max(.5,s(L.width,6)),c=ve(L.glow,true),z=c?Math.max(0,s(ie.width,8)):0,q=_e();z&&he.push(new Ee([q],{color:O,width:n*z,opacity:.5,soft:true,lighten:true})),c&&he.push(new Ee([q],{color:O,width:n*3,opacity:.9,soft:true,lighten:true})),he.push(new Ee([q],{color:K,width:n,opacity:1,additive:true,tube:true}));for(const H of he)H.object.renderOrder=H.style.lighten?2.2:3.4,l.add(H.object),$.lines.push(H)}let je=null;$.prerender=(n,c,z,q,H,D)=>{if(!V.visible)return;je=c;const J=ra(n,c,z,q,H,D);sa(F,J);const[Se,at]=[J.target.x,J.target.y];(!X||X.width!==Se||X.height!==at)&&(X==null||X.dispose(),X=new ft(Se,at,{depthBuffer:false,minFilter:Ne,magFilter:Ne})),V.updateWorldMatrix(true,false),ye.matrixWorld.copy(V.matrixWorld),At(z);const Lt=n.getRenderTarget();n.getClearColor(Je);const Ot=n.getClearAlpha();try{n.setRenderTarget(X),n.setClearColor(0,0),n.clear(true,false,false),n.render(ze,z)}finally{n.setRenderTarget(Lt),n.setClearColor(Je,Ot)}Le.uGas.value=X.texture,Le.uFull.value.set(q,H)},$.dispose=()=>{var n,c;(n=Y==null?void 0:Y.dispose)==null||n.call(Y),(c=U==null?void 0:U.dispose)==null||c.call(U),X==null||X.dispose(),re.dispose(),je&&la(je)};const kt=g(n=>n*M/1e3,"toRate"),xe=bt(e.drift,[0,0]),et=[...xe];let ne=null,pe=null;const tt=g((n,c)=>{var q,H;const z=et.map(kt);if(ne?pe!==null&&(ne=nt(ne,[(c-pe)*z[0],(c-pe)*z[1]])):ne=nt({body:[0,0],wisp:[0,0]},[c*z[0],c*z[1]]),pe=c,F.uWarpOff.value.set(-ne.body[0],0,-ne.body[1]),F.uWispOff.value.set(ne.wisp[0],.37,ne.wisp[1]),F.uTime.value=c,R){E.phase=-Math.PI*E.waves*R*c/1e3/r[0],F.uRibbon.value.w=E.phase;const D=R*c/1e3*M*.5;F.uWarpOff.value.y=-(D-Math.floor(D)),F.uWispOff.value.y=.37-(D*ke-Math.floor(D*ke));const J=_e();for(const Se of he)Se.setRuns([J])}return(q=Y==null?void 0:Y.tick)==null||q.call(Y,n,c),(H=U==null?void 0:U.tick)==null||H.call(U,n,c),z[0]!==0||z[1]!==0||!!p||!!U||!!R},"tick");$.tick=xe[0]||xe[1]||p||U||R?tt:null;const zt=F.uDensity.value;return $.live=(n,c)=>{var q;if(n==="density")return F.uDensity.value=c===null||!Number.isFinite(c)?zt:Math.max(0,c),(q=t.requestFrame)==null||q.call(t),true;const z=n==="drift"?[0,1]:n==="drift.0"?[0]:n==="drift.1"?[1]:null;if(!z)return false;for(const H of z)et[H]=c===null||!Number.isFinite(c)?xe[H]:c;return $.tick||(ne={body:[0,0],wisp:[0,0]},pe=null,$.tick=tt),true},$}g(La,"buildNebulaVolume");const Oa=["band","columns","lightning","core","dust","ribbon","wake"],Fa={badlands:{render:"volume",shape:"layers",size:[500,140,500],count:6,colors:["var(--lcars-yellow, var(--lcards-yellow-medium))","var(--lcars-orange, var(--lcards-orange-medium))","var(--lcars-red, var(--lcards-orange-dark))"],seed:3,drift:[4,1],veins:.8,gap:.4,band:{brightness:1.5,width:.1,color:"var(--lcars-orange, var(--lcards-orange-medium))"},columns:{count:8,kind:"fire",width:[1,3],color:"var(--lcars-butter, var(--lcards-yellow-lightest))"}},badlands_voyager:{render:"volume",shape:"layers",size:[500,160,500],count:4,colors:["var(--lcars-peach, var(--lcards-orange-lightest))","var(--lcars-mauve, var(--lcards-orange-light))","var(--lcars-black-cherry, var(--lcards-gray-dark))"],seed:8,drift:[3,0],band:{brightness:1,color:"var(--lcars-butter, var(--lcards-yellow-lightest))"},columns:{count:7,kind:"lightning",speed:.6,color:"var(--lcars-roseblush, var(--lcards-orange-lightest))",glow:{color:"var(--lcars-magenta, var(--lcards-orange-medium))"}},lightning:{rate:.8,branches:3,color:"var(--lcars-space-white, var(--lcards-moonlight))",glow:{color:"var(--lcars-magenta, var(--lcards-orange-medium))"}}},nexus:{render:"volume",shape:"wake",size:[2e3,500,500],count:8,colors:["var(--lcars-roseblush, var(--lcards-orange-lightest))","var(--lcars-red, var(--lcards-orange-dark))","var(--lcars-black-cherry, var(--lcards-gray-dark))"],seed:2,turbulence:.55,wake:{lean:.35},ribbon:{waves:2.5,amplitude:.2,speed:40,width:4,color:"var(--lcars-space-white, var(--lcards-moonlight))",glow:{color:"var(--lcars-violet-creme, var(--lcards-moonlight))"}},lightning:{mode:"crawl",count:18,reach:.18,width:1.4,color:"var(--lcars-space-white, var(--lcards-moonlight))",glow:{color:"var(--lcars-lavender, var(--lcards-blue-light))"}}}};function Ta(e){const t=e&&typeof e.preset=="string"?Fa[e.preset]:void 0;if(!t)return e;const a={...t,...e};for(const l of Oa){const d=t[l],r=e[l];d&&typeof d=="object"&&r&&typeof r=="object"&&!Array.isArray(r)?a[l]={...d,...r}:d&&r===true&&(a[l]=d)}e.radius!==void 0&&e.size===void 0&&delete a.size;const o=_a(e,t);if(o!==1){e.drift===void 0&&t.drift!==void 0&&(a.drift=Ue(t.drift,o));const l=a.ribbon,d=e.ribbon&&typeof e.ribbon=="object"&&e.ribbon.speed!==void 0;l&&typeof l=="object"&&!d&&typeof l.speed=="number"&&(a.ribbon={...l,speed:Ue(l.speed,o)})}return a}g(Ta,"withNebulaPreset");function _a(e,t){const a=Array.isArray(t.size)?t.size[0]:Number(t.size);let o=NaN;return e.size!==void 0?o=Array.isArray(e.size)?Number(e.size[0]):typeof e.size=="number"?e.size:NaN:typeof e.radius=="number"&&(o=2*e.radius),Number.isFinite(o)&&o>0&&a>0?o/a:1}g(_a,"sizeRatio");const Ue=g((e,t)=>Array.isArray(e)?e.map(a=>Ue(a,t)):typeof e=="number"?Number((e*t).toPrecision(4)):e,"scaleSpeed"),it=10,ja=[.25,.55],He=[3,5],De=[.6,1.6],Ea=1.5,st=4;function ut(e,t,a){const o=[(a()-.5)*Math.PI,a()*Math.PI*2,(a()-.5)*Math.PI];return t<=0?{axes:[e,e,e],turn:[0,0,0]}:{axes:[e*(1+1.5*t),e*(1-.6*t),e*(1-.3*t)],turn:o}}g(ut,"stretchedAxes");function Ra(e){var M,w;const t=Ce(s(e.seed,1)),a=e.size!==void 0?Ha(e.size):null,o=a?Math.max(...a)/2:Math.max(.001,s(e.radius,100)),l=Math.max(1,Array.isArray(e.colors)?e.colors.length:1),[d,r]=e.render==="volume"?ja:[.15,.4],[u,i]=[s(e.min_radius,o*d),s(e.max_radius,o*r)].map(m=>Math.max(.001,m)).sort((m,f)=>m-f),[x,h]=[s((M=e.brightness)==null?void 0:M[0],.3),s((w=e.brightness)==null?void 0:w[1],.8)].map(m=>Math.max(0,Math.min(1,m))).sort((m,f)=>m-f);let k;if(Array.isArray(e.clouds)&&e.clouds.length){const m=e.clouds.filter(S=>S&&typeof S=="object");let f=0,C=0;k=[],m.forEach((S,j)=>{const A=S.dust===true;if(A?C++>=st:f++>=it)return;const p=Math.max(.001,s(S.radius,(u+i)/2)),_=Array.isArray(S.size)?S.size:null,T=_?[0,1,2].map(G=>Math.max(.001,s(_[G],p*2)/2)):[p,p,p],P=Array.isArray(S.rotation)?S.rotation:null,L=P?[s(P[0],0),-s(P[1],0),s(P[2],0)].map(G=>G*Math.PI/180):[0,0,0];k.push({xyz:Array.isArray(S.xyz)?[s(S.xyz[0],0),s(S.xyz[1],0),s(S.xyz[2],0)]:[0,0,0],radius:_?Math.max(...T):p,axes:T,turn:L,color:S.color!==void 0?-1-j:j%l,opacity:Math.max(0,Math.min(1,s(S.opacity,(x+h)/2))),dust:A})})}else{const m=Math.max(1,Math.min(it,Math.round(s(e.count,4)))),f=Math.max(0,Math.min(1,s(e.stretch,0))),C=Ce(s(e.seed,1)*7919+13);k=[];for(let A=0;A<m;A++){const p=Math.floor(t()*l)%l,_=qe(t,a,o),T=u+t()*(i-u);k.push({xyz:_,radius:T,...ut(T,f,C),color:p,opacity:x+t()*(h-x),dust:false})}const S=Ce(s(e.seed,1)*104729+71),j=Math.max(0,Math.min(st,Math.round(s(Q(e.dust).count,0))));for(let A=0;A<j;A++){const p=k[A%m],_=qe(S,null,p.radius*.25),T=p.radius*(.8+S()*.3);k.push({xyz:p.xyz.map((P,L)=>P+_[L]),radius:T,...ut(T,Math.max(f,.55),S),color:0,opacity:1,dust:true})}}const v=[];let b=0;return k.forEach((m,f)=>{if(m.dust)return;const C=He[0]+Math.floor(t()*(He[1]-He[0]+1)),S=[.6+t()*.3,.1+t()*.2];for(let j=0;j<C;j++){const A=j===0?0:m.radius*.45,p=j===0?[0,0,0]:Wa(qe(t,null,A),m),_=[m.xyz[0]+p[0],m.xyz[1]+p[1]*.6,m.xyz[2]+p[2]],T=m.radius*(j===0?1:.55+t()*.35);v.push({xyz:_,radius:T,cloud:f,opacity:m.opacity*(j===0?.6:.9/(C-1)),stops:S,offset:[t()*97,t()*97]}),b=Math.max(b,Math.hypot(..._)+T)}}),{clouds:k,puffs:v,extent:b}}g(Ra,"nebulaLayout");function Wa(e,t){if(t.axes[0]===t.axes[1]&&t.axes[1]===t.axes[2]&&!t.turn.some(Boolean))return e;const a=[0,1,2].map(o=>e[o]*t.axes[o]/t.radius);return Pa(a,t.turn)}g(Wa,"alongAxes");function Pa(e,t){const[a,o,l,d,r,u]=[Math.cos(t[0]),Math.sin(t[0]),Math.cos(t[1]),Math.sin(t[1]),Math.cos(t[2]),Math.sin(t[2])];let[i,x,h]=e;return[i,x]=[i*r-x*u,i*u+x*r],[x,h]=[x*a-h*o,x*o+h*a],[i,h]=[i*l+h*d,-i*d+h*l],[i,x,h]}g(Pa,"turnYXZ");function Ha(e){if(Array.isArray(e)){const a=Math.max(.001,s(e[0],200));return[a,Math.max(.001,s(e[1],a/5)),Math.max(.001,s(e[2],a))]}const t=Math.max(.001,s(e,200));return[t,t,t]}g(Ha,"boxSize");function qe(e,t,a){if(t)return[(e()-.5)*t[0],(e()-.5)*t[1],(e()-.5)*t[2]];const o=e()*2-1,l=e()*2*Math.PI,d=Math.sqrt(1-o*o),r=a*Math.cbrt(e());return[r*d*Math.cos(l),r*o,r*d*Math.sin(l)]}g(qe,"inside");function ct(e,t,a,o){const[l,d]=be(a),[r,u]=be(o);e.set(l,r),t.set(d,u)}g(ct,"driftUniforms");const Da=`
attribute vec2 corner;
attribute vec3 puff;
attribute vec4 tint;
attribute vec4 shape;
varying vec2 vUv;
varying vec4 vTint;
varying vec2 vStops;
varying vec2 vOffset;
void main() {
  float radius = puff.x;
  vec4 view = modelViewMatrix * vec4( position, 1.0 );
  // the camera's distance along its view direction (an orthographic camera too)
  float dist = -view.z;
  float t = clamp( ( dist - ${De[0].toFixed(2)} * radius ) / ( ${(De[1]-De[0]).toFixed(2)} * radius ), 0.0, 1.0 );
  float fade = t * t * ( 3.0 - 2.0 * t );
  view.xy += corner * radius;
  vUv = corner;
  vTint = vec4( tint.rgb, tint.a * fade );
  vStops = shape.xy;
  vOffset = shape.zw;
  gl_Position = projectionMatrix * view;
  // a puff with nothing to show leaves the screen (no fill cost)
  if ( vTint.a <= 0.0 ) gl_Position = vec4( 2.0, 2.0, 2.0, 1.0 );
}`,qa=`
precision highp float;
${Gt}
varying vec2 vUv;
varying vec4 vTint;
varying vec2 vStops;
varying vec2 vOffset;
uniform float uTurb;
uniform float uScale;
// drift, split into whole cells and the rest per field (a field's own multiple
// of the drift, so its coordinate never jumps when the rest wraps)
uniform ivec2 uWarpCell;
uniform vec2 uWarpLocal;
uniform ivec2 uWispCell;
uniform vec2 uWispLocal;
uniform float uOpacity;

// The preset's gradient: 1 at the middle, s.x at 0.4, s.y at 0.7, 0 at the edge
float profile( float r, vec2 s ) {
  if ( r < 0.4 ) return mix( 1.0, s.x, r / 0.4 );
  if ( r < 0.7 ) return mix( s.x, s.y, ( r - 0.4 ) / 0.3 );
  if ( r < 1.0 ) return mix( s.y, 0.0, ( r - 0.7 ) / 0.3 );
  return 0.0;
}

void main() {
  float r0 = length( vUv );
  if ( r0 >= 1.0 ) discard;
  vec2 q = vUv * uScale + vOffset;
  // edge turbulence, and wisps at a finer scale drifting the other way (the preset's shader)
  float warp = lcFbm( uWarpCell, q + uWarpLocal, 4 );
  float wisp = lcFbm( uWispCell, q * 3.0 + vec2( 17.3, -9.1 ) + uWispLocal, 5 );
  float tex = mix( 0.3, 1.35, smoothstep( -0.6, 0.9, wisp ) );
  float r = r0 + uTurb * 0.3 * warp;
  // the turbulence can pull the gradient inside the quad's edge: fade the rim so no circle shows
  float rim = 1.0 - smoothstep( 0.8, 1.0, r0 );
  float a = clamp( profile( r, vStops ) * tex, 0.0, 1.0 ) * rim * vTint.a * uOpacity;
  if ( a <= 0.002 ) discard;
  gl_FragColor = vec4( vTint.rgb, a );
}`;function ao(e,t){e=Ta(e);const a=new Ge;a.name=`nebula:${e.id??""}`;const{clouds:o,puffs:l,extent:d}=Ra(e),u=(Array.isArray(e.colors)&&e.colors.length?e.colors:[e.colors!=null&&!Array.isArray(e.colors)?e.colors:e.color]).map(O=>t.color(O,ce.nebula)),i=g(O=>O>=0?u[O%u.length]:t.color(e.clouds[-1-O].color,ce.nebula),"colorOf");if(e.render==="volume")return La(e,t,{clouds:o},i);const x=l.length,h=new Float32Array(x*12),k=new Float32Array(x*8),v=new Float32Array(x*12),b=new Float32Array(x*16),M=new Float32Array(x*16),w=new Uint16Array(x*6),m=[-1,-1,1,-1,1,1,-1,1];l.forEach((O,R)=>{const N=i(o[O.cloud].color);for(let F=0;F<4;F++){const re=R*4+F;h.set(O.xyz,re*3),k.set([m[F*2],m[F*2+1]],re*2),v.set([O.radius,0,0],re*3),b.set([N[0],N[1],N[2],(N[3]??1)*O.opacity],re*4),M.set([O.stops[0],O.stops[1],O.offset[0],O.offset[1]],re*4)}w.set([0,1,2,0,2,3].map(F=>F+R*4),R*6)});const f=new It;f.setAttribute("position",new me(h,3)),f.setAttribute("corner",new me(k,2)),f.setAttribute("puff",new me(v,3)),f.setAttribute("tint",new me(b,4)),f.setAttribute("shape",new me(M,4)),f.setIndex(new Vt(w,1)),f.computeBoundingSphere(),f.boundingSphere&&(f.boundingSphere.radius=Math.max(f.boundingSphere.radius,d));const C=l.length?l.reduce((O,R)=>O+R.radius,0)/l.length:1,S=e.noise_scale!==void 0?Math.max(0,s(e.noise_scale,0))*C:Ea,j=e.blend!=="normal",A={uTurb:{value:Math.max(0,Math.min(1,s(e.turbulence,.5)))},uScale:{value:S},uWarpCell:{value:new oe(0,0)},uWarpLocal:{value:new oe(0,0)},uWispCell:{value:new oe(0,0)},uWispLocal:{value:new oe(0,0)},uOpacity:{value:Math.max(0,s(e.opacity,1))}},p=new fe({uniforms:A,vertexShader:Da,fragmentShader:qa,transparent:true,depthTest:true,depthWrite:false,blending:j?vt:Xe}),_=new we(f,p);_.renderOrder=.25,a.add(_);const T=Ye(e,a,{radius:d}),P=g(O=>O/C*S/1e3,"toRate"),L=bt(e.drift,[0,0]),G=[...L];let E=null,K=null;const ie=g((O,R)=>{const N=G.map(P);return E?K!==null&&(E=[E[0]+(R-K)*N[0],E[1]+(R-K)*N[1]]):E=[R*N[0],R*N[1]],K=R,ct(A.uWarpCell.value,A.uWarpLocal.value,E[0],E[1]),ct(A.uWispCell.value,A.uWispLocal.value,-1.7*E[0],-1.7*E[1]),N[0]!==0||N[1]!==0},"tick");return T.tick=L[0]||L[1]?ie:null,T.live=(O,R)=>{const N=O==="drift"?[0,1]:O==="drift.0"?[0]:O==="drift.1"?[1]:null;if(!N)return false;for(const F of N)G[F]=R===null||!Number.isFinite(R)?L[F]:R;return T.tick||(E=[0,0],K=null,T.tick=ie),true},T}g(ao,"buildNebula");const te={plasma:0,fluid:1,contour:2,bands:3,swirl:4},ge=16,Ba=3,dt=10,Be=new W(1,.35,.6).normalize(),y=g(e=>`var(--lcards-${e})`,"pal"),Na={gas_giant:{type:"bands",colors:[y("yellow-light"),y("yellow-dark"),y("yellow-lightest"),y("orange-light"),y("yellow-light"),y("yellow-darkest")],num_bands:15,turbulence:.35,num_octaves:5},ringed_giant:{type:"bands",colors:[y("yellow-lightest"),y("yellow-light"),y("yellow-medium-light"),y("yellow-dark")],num_bands:19,turbulence:.15,num_octaves:4},ice_giant:{type:"bands",colors:[y("blue-light"),y("blue-medium-light"),y("blue-light"),y("green-lightest")],num_bands:7,turbulence:.08,num_octaves:3},storm_giant:{type:"bands",colors:[y("blue-medium"),y("blue-medium-dark"),y("blue-medium-light"),y("blue-dark")],num_bands:9,turbulence:.4,num_octaves:5},clouds:{type:"bands",colors:[y("yellow-lightest"),y("yellow-medium"),y("yellow-light"),y("orange-lightest")],num_bands:5,turbulence:.9,num_octaves:5,speed:.4},lava:{type:"contour",colors:[y("gray-darkest"),y("gray-darkest"),y("gray-darkest"),y("gray-dark"),y("orange-dark"),y("yellow-medium")],num_bands:9,num_octaves:4,blend_colors:false},ice:{type:"contour",colors:[y("blue-medium-light"),y("blue-light"),y("moonlight"),y("gray-lightest")],num_bands:6,num_octaves:5},rocky:{type:"contour",colors:[y("gray-medium-dark"),y("gray-medium"),y("gray-medium-light"),y("gray-light")],num_bands:7,num_octaves:6},terran:{type:"contour",colors:[y("blue-dark"),y("blue-medium-dark"),y("green-medium"),y("green-medium-light"),y("yellow-dark"),y("gray-lightest")],num_bands:8,num_octaves:5,blend_colors:false}};function $a(e){const t=e&&typeof e=="object"?e:{},a=typeof t.preset=="string"?Na[t.preset]:void 0;return a?{...a,...t}:t}g($a,"resolveFill");const ue={a:"var(--lcars-blue, var(--lcards-blue-medium))",b:"var(--lcars-orange, var(--lcards-orange-medium))",wash:"var(--lcars-blue, var(--lcards-blue-medium))"},Ia=`
varying vec3 vPos;
void main() {
  vPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Va=`
precision highp float;
${Zt}
varying vec3 vPos;
uniform int uType;
uniform int uOctaves;
uniform float uFreq;
uniform ivec3 uCell;
uniform vec3 uLocal;
uniform vec4 uColorA;
uniform vec4 uColorB;
uniform vec4 uStops[ ${ge} ];
uniform int uStopCount;
uniform float uBands;
uniform float uFill;
uniform bool uBlend;
uniform vec4 uFillColor;
uniform bool uHasFill;
uniform vec4 uBase;
uniform float uOpacity;
uniform float uRadius;
uniform float uTurb;
uniform vec2 uTau;
uniform vec2 uFade;
uniform float uAng;
uniform float uFall;
uniform float uWind;
uniform float uRipple;
uniform float uDepth;

// swirl: one layer of gas, streaks along a log spiral, turned and drawn in by tau seconds
float swirlLayer( float th, float r, float lr, float tau ) {
  float u = th + uWind * lr - uAng * tau * 1.15 / ( r + 0.15 );
  float l = lr + uFall * tau;
  float k = uFreq * uRadius / 3.0;
  // a coarse warp breaks the rings into clumps, then fine noise streaked along the spiral
  float w = lcFbm3( uCell, vec3( cos( u ) * 1.4, sin( u ) * 1.4, l * 2.5 ) * k + vec3( 5.2, 1.3, 7.7 ), 3 );
  l += 0.12 * uTurb * w;
  u += 0.5 * uTurb * w;
  vec3 p = vec3( cos( u ) * 2.4, sin( u ) * 2.4, l * 8.0 ) * k;
  return lcFbm3( uCell, p, uOctaves );
}

vec4 colorAtBand( float bandValue ) {
  float p = bandValue * float( uStopCount - 1 );
  if ( !uBlend ) return uStops[ clamp( int( floor( p + 0.5 ) ), 0, uStopCount - 1 ) ];
  int idx = min( uStopCount - 2, int( floor( p ) ) );
  return mix( uStops[ idx ], uStops[ idx + 1 ], p - float( idx ) );
}

void main() {
  float raw = lcFbm3( uCell, vPos * uFreq + uLocal, uOctaves );
  float n = clamp( ( raw + 1.0 ) * 0.5, 0.0, 1.0 );
  vec4 c;
  if ( uType == 0 ) {
    // plasma: colour B's bands over colour A's
    float pik = 3.141592653589793 * float( uOctaves );
    float aA = abs( sin( n * pik ) ) * uColorA.a;
    float aB = abs( cos( n * pik ) ) * uColorB.a;
    float a = aA + aB * ( 1.0 - aA );
    vec3 rgb = a > 0.001 ? ( uColorA.rgb * aA * ( 1.0 - aB ) + uColorB.rgb * aB ) / a : vec3( 0.0 );
    c = vec4( rgb, a );
  } else if ( uType == 1 ) {
    // fluid: the noise is the wash's alpha
    c = vec4( uColorA.rgb, n * uColorA.a );
  } else if ( uType == 3 ) {
    // bands: belts evenly spaced in latitude, colours repeating from the
    // south pole, the edges swirled by the noise and the belts mottled
    float lat = clamp( vPos.y / uRadius, -1.0, 1.0 );
    float bands = max( 2.0, floor( uBands + 0.5 ) );
    // noise stretched along the latitude, so the swirls run east-west
    float swirl = lcFbm3( uCell, vPos * vec3( 1.0, 4.0, 1.0 ) * uFreq * 1.5 + uLocal, uOctaves );
    float t = asin( lat ) / 3.141592653589793 + 0.5 + uTurb * swirl * ( 2.0 / bands );
    float s = max( 0.0, t ) * bands;
    int idx = int( floor( s ) );
    int i0 = idx - ( idx / uStopCount ) * uStopCount;
    int i1 = ( i0 + 1 ) - ( ( i0 + 1 ) / uStopCount ) * uStopCount;
    vec4 c0 = uStops[ i0 ];
    c = uBlend ? mix( c0, uStops[ i1 ], smoothstep( 0.55, 1.0, fract( s ) ) ) : c0;
    c.rgb *= 0.9 + 0.2 * n;
  } else if ( uType == 4 ) {
    // swirl: gas spiralling in round the object's y axis, faster near the
    // middle, streaked along the spiral with dark lanes, colours from the
    // middle (first stop) out to the rim, a rippled heart and a ragged edge.
    // Two layers a half cycle apart crossfade, so the winding never piles up.
    float r = length( vPos.xz ) / uRadius;
    float th = atan( vPos.z, vPos.x );
    float lr = log( max( r, 1e-3 ) );
    float g = uFade.x * swirlLayer( th, r, lr, uTau.x ) + uFade.y * swirlLayer( th, r, lr, uTau.y );
    g /= max( 1e-3, sqrt( uFade.x * uFade.x + uFade.y * uFade.y ) );
    float dens = smoothstep( -0.6, 0.5, g );
    float heart = 1.0 - smoothstep( 0.0, 0.28, r );
    float ripple = 0.75 + 0.25 * sin( r * 70.0 - uRipple );
    float coarse = lcFbm3( uCell, vec3( cos( th ), sin( th ), lr * 2.0 ) * 1.3, 2 );
    float edge = 1.0 - smoothstep( 0.55, 1.0, r + uTurb * 0.4 * coarse );
    c = colorAtBand( clamp( r, 0.0, 1.0 ) );
    // the lanes are thin gas, not empty: a dim floor under the streaks
    c.rgb *= mix( 0.3 + 1.0 * dens, ripple * 1.2, heart );
    c.a *= mix( 0.3 + 0.7 * dens, 1.0, heart * 0.8 ) * edge;
    // down a well the gas thins out before the narrow throat, into the light at its heart
    if ( uDepth > 0.0 ) c.a *= 1.0 - smoothstep( 0.3, 0.75, -vPos.y / uDepth );
  } else {
    // contour: stepped bands, the lowest flooded below fill_level
    float bands = max( 2.0, floor( uBands + 0.5 ) );
    vec4 land = colorAtBand( clamp( floor( n * bands ), 0.0, bands - 1.0 ) / ( bands - 1.0 ) );
    c = land;
    if ( uFill > 0.0 ) {
      float t = uBlend ? clamp( ( n - uFill ) / ( 1.0 / bands ), 0.0, 1.0 ) : ( n >= uFill ? 1.0 : 0.0 );
      vec3 under = uHasFill ? mix( land.rgb, uFillColor.rgb, uFillColor.a ) : land.rgb;
      c = vec4( mix( under, land.rgb, t ), mix( uHasFill ? land.a : 0.0, land.a, t ) );
    }
  }
  c.a *= uOpacity;
  // over the base (a sphere's body colour), premultiplied
  float a = c.a + uBase.a * ( 1.0 - c.a );
  if ( a <= 0.001 ) discard;
  gl_FragColor = vec4( c.rgb * c.a + uBase.rgb * uBase.a * ( 1.0 - c.a ), a );
}`;function Ua(e){let t=e.length?e:[[1,1,1,1]];if(t.length===1&&(t=[t[0],t[0]]),t.length>ge){const a=t;t=Array.from({length:ge},(o,l)=>a[Math.round(l*(a.length-1)/(ge-1))])}return t}g(Ua,"contourStops");function oo(e,t,a){const o=$a(e),l=te[o.type]??te.plasma,d=Math.max(.001,a.radius),r=o.base_frequency!==void 0?Math.max(0,s(o.base_frequency,0)):Ba/d,u=Math.max(1,Math.min(yt,Math.round(s(o.num_octaves,l===te.contour?2:l===te.plasma?3:4)))),i=new Float32Array(ge*4);let x=2;if(l===te.contour||l===te.bands||l===te.swirl){const w=Array.isArray(o.colors)?o.colors:o.colors!==void 0?[o.colors]:[ue.a,ue.b],m=Ua(w.map(f=>t.color(f,ue.a)));m.forEach((f,C)=>i.set([f[0],f[1],f[2],f[3]??1],C*4)),x=m.length}const h={uType:{value:l},uOctaves:{value:u},uFreq:{value:r},uCell:{value:new W(0,0,0)},uLocal:{value:new W(0,0,0)},uColorA:{value:t.color(l===te.fluid?o.color:o.color_a,l===te.fluid?ue.wash:ue.a)},uColorB:{value:t.color(o.color_b,ue.b)},uStops:{value:i},uStopCount:{value:x},uBands:{value:Math.max(2,Math.min(64,s(o.num_bands,5)))},uFill:{value:Math.max(0,Math.min(.95,s(o.fill_level,0)))},uBlend:{value:o.blend_colors!==false},uFillColor:{value:o.fill_color!==void 0?t.color(o.fill_color,"transparent"):[0,0,0,0]},uHasFill:{value:o.fill_color!==void 0},uBase:{value:a.base??[0,0,0,0]},uOpacity:{value:Math.max(0,Math.min(1,s(o.opacity,1)))*(a.opacity??1)},uRadius:{value:d},uTurb:{value:Math.max(0,Math.min(1,s(o.turbulence,.3)))},uTau:{value:[0,0]},uFade:{value:[1,0]},uAng:{value:s(o.speed,0)/d},uFall:{value:.04*Math.sign(s(o.speed,0))},uWind:{value:2.2},uRipple:{value:0},uDepth:{value:Math.max(0,a.depth??0)}},k=new fe({uniforms:h,vertexShader:Ia,fragmentShader:Va,transparent:true,premultipliedAlpha:true,blending:Xe,side:a.solid?$e:Ut,depthTest:true,depthWrite:!!a.solid}),v=s(o.speed,0);if(l===te.swirl)return{material:k,tick:v?(w,m)=>{const f=m/1e3;for(let C=0;C<2;C++){const S=(f/dt+C/2)%1;h.uTau.value[C]=S*dt,h.uFade.value[C]=1-Math.abs(2*S-1)}return h.uRipple.value=f*2.5%(2*Math.PI),true}:null};const b=v*r/1e3;return{material:k,tick:b?(w,m)=>{const f=m*b,[C,S]=be(Be.x*f),[j,A]=be(Be.y*f),[p,_]=be(Be.z*f);return h.uCell.value.set(C,j,p),h.uLocal.value.set(S,A,_),true}:null}}g(oo,"fillMaterial");export{te as FILL_TYPES,to as buildCube,ao as buildNebula,fa as cubeSize,ha as cubeSpots,oo as fillMaterial,Ra as nebulaLayout,Pa as turnYXZ};
//# sourceMappingURL=index-N-Q-jI25.js.map
