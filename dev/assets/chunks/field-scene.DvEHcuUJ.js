import{a as g,N as w,V as v,P as C,b as y,c as P,O as B}from"./instance.DkfKKL3N.js";import{N as s}from"./BackgroundAnimationRenderer.Bi3RWZjJ.js";const u=e=>`${e>>>0}u`,L=8,M=`
float lcHash( ivec2 p ) {
  uint h = ( ( uint( p.x ) * ${u(s.X)} ) ^ ( uint( p.y ) * ${u(s.Y)} ) ) + ${u(s.S)};
  h ^= h >> 16u;
  h *= ${u(s.M1)};
  h ^= h >> 15u;
  h *= ${u(s.M2)};
  h ^= h >> 16u;
  return float( h ) / 1073741824.0 - 2.0;
}

// Value noise at lattice cell + local (local may exceed 0..1)
float lcSmoothNoise( ivec2 cell, vec2 local ) {
  vec2 fl = floor( local );
  ivec2 i = cell + ivec2( fl );
  vec2 f = local - fl;
  vec2 u = f * f * ( 3.0 - 2.0 * f );
  float a = lcHash( i );
  float b = lcHash( i + ivec2( 1, 0 ) );
  float c = lcHash( i + ivec2( 0, 1 ) );
  float d = lcHash( i + ivec2( 1, 1 ) );
  return a + ( b - a ) * u.x + ( c - a ) * u.y + ( a + d - b - c ) * u.x * u.y;
}

// fBm over cell + local, as _fbm(x, y, octaves) with x = cell + local
float lcFbm( ivec2 cell, vec2 local, int octaves ) {
  float value = 0.0;
  float amplitude = 0.5;
  for ( int k = 0; k < ${L}; k++ ) {
    if ( k >= octaves ) break;
    value += amplitude * lcSmoothNoise( cell, local );
    amplitude *= 0.5;
    cell *= 2;
    local *= 2.0;
  }
  return value;
}
`;function d(e){const l=Math.floor(e);return[l|0,e-l]}const _=`
void main() {
  gl_Position = vec4( position.xy, 0.0, 1.0 );
}`,$=`
precision highp float;
precision highp int;
uniform vec2 uSize;
uniform vec2 uCell;
uniform vec2 uLocal;
uniform vec2 uPhase;
uniform float uBlock;
uniform float uK;
${M}
// This pixel, top-left origin, integer index (as the Canvas2D loops)
vec2 lcPixel() {
  return vec2( floor( gl_FragCoord.x ), uSize.y - 1.0 - floor( gl_FragCoord.y ) );
}
// Its lattice coordinate, split: whole cells + local part
vec2 lcLocal( vec2 px ) {
  vec2 rel = uBlock > 0.0 ? floor( ( px + uPhase ) / uBlock ) * uBlock : px;
  return uLocal + rel * uK;
}
ivec2 lcCell() {
  return ivec2( uCell );
}
`;function x(e,l,i){const a=-e;if(l>0){const o=Math.floor(a/l),[n,r]=d(o*l*i);return{cell:n,local:r,phase:a-o*l}}const[t,c]=d(a*i);return{cell:t,local:c,phase:0}}function H(e,l,i,a,t){const c=x(l,a,t),o=x(i,a,t);e.uCell.value.set(c.cell,o.cell),e.uLocal.value.set(c.local,o.local),e.uPhase.value.set(c.phase,o.phase),e.uBlock.value=a,e.uK.value=t}function E({fragment:e,uniforms:l,pan:i,setParam:a,setColors:t}){const c={uSize:{value:new v(1,1)},uCell:{value:new v},uLocal:{value:new v},uPhase:{value:new v},uBlock:{value:0},uK:{value:.01},...l},o=new g({uniforms:c,vertexShader:_,fragmentShader:$+e,transparent:!0,premultipliedAlpha:!0,depthTest:!1,depthWrite:!1,blending:w}),n=new C(2,2),r=new y(n,o);r.frustumCulled=!1;const p=new P;p.add(r);const S=new B(-1,1,1,-1,0,1);return{scene:p,camera:S,material:o,seek(m,h){const f=i(h);H(c,f.offsetX,f.offsetY,f.block,f.k)},resize(m,h){c.uSize.value.set(m,h)},setParam:a,setColors:t,dispose(){n.dispose(),o.dispose()}}}export{L as M,E as c};
