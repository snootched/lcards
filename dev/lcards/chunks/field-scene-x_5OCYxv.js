var x=Object.defineProperty;var u=(e,l)=>x(e,"name",{value:l,configurable:true});import{S,m as w,k as p,i as C,b as L,u as P,O as B}from"./three.module-DQ1AG__Q.js";import{N as y,s as d}from"./noise-glsl-BA2w49__.js";import"./instance-ZFbqqu8f.js";const z=`
void main() {
  gl_Position = vec4( position.xy, 0.0, 1.0 );
}`,_=`
precision highp float;
precision highp int;
uniform vec2 uSize;
uniform vec2 uCell;
uniform vec2 uLocal;
uniform vec2 uPhase;
uniform float uBlock;
uniform float uK;
${y}
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
`;function m(e,l,r){const a=-e;if(l>0){const o=Math.floor(a/l),[n,c]=d(o*l*r);return{cell:n,local:c,phase:a-o*l}}const[s,t]=d(a*r);return{cell:s,local:t,phase:0}}u(m,"fieldAxis");function E(e,l,r,a,s){const t=m(l,a,s),o=m(r,a,s);e.uCell.value.set(t.cell,o.cell),e.uLocal.value.set(t.local,o.local),e.uPhase.value.set(t.phase,o.phase),e.uBlock.value=a,e.uK.value=s}u(E,"fieldUniforms");function O({fragment:e,uniforms:l,pan:r,setParam:a,setColors:s}){const t={uSize:{value:new p(1,1)},uCell:{value:new p},uLocal:{value:new p},uPhase:{value:new p},uBlock:{value:0},uK:{value:.01},...l},o=new S({uniforms:t,vertexShader:z,fragmentShader:_+e,transparent:true,premultipliedAlpha:true,depthTest:false,depthWrite:false,blending:w}),n=new C(2,2),c=new L(n,o);c.frustumCulled=false;const v=new P;v.add(c);const g=new B(-1,1,1,-1,0,1);return{scene:v,camera:g,material:o,seek(h,f){const i=r(f);E(t,i.offsetX,i.offsetY,i.block,i.k)},resize(h,f){t.uSize.value.set(h,f)},setParam:a,setColors:s,dispose(){n.dispose(),o.dispose()}}}u(O,"createFieldScene");export{O as c};
//# sourceMappingURL=field-scene-x_5OCYxv.js.map
