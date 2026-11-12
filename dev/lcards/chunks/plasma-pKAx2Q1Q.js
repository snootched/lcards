var s=Object.defineProperty;var a=(e,u)=>s(e,"name",{value:u,configurable:true});import{c as i}from"./field-scene-x_5OCYxv.js";import{M as v}from"./noise-glsl-BA2w49__.js";import{r as f}from"./scene-helpers-qAOFaaBN.js";const m=`
uniform int uOctaves;
uniform vec4 uColorA;
uniform vec4 uColorB;

void main() {
  float raw = lcFbm( lcCell(), lcLocal( lcPixel() ), uOctaves );
  float n = ( raw + 1.0 ) * 0.5;
  float pik = 3.141592653589793 * float( uOctaves );
  float alphaA = abs( sin( n * pik ) ) * uColorA.a;
  float alphaB = abs( cos( n * pik ) ) * uColorB.a;
  // Source-over: colour B over colour A
  float outA = alphaA + alphaB * ( 1.0 - alphaA );
  vec3 rgb = vec3( 0.0 );
  if ( outA > 0.001 ) rgb = ( uColorA.rgb * alphaA * ( 1.0 - alphaB ) + uColorB.rgb * alphaB ) / outA;
  gl_FragColor = vec4( rgb * outA, outA );
}`;function h({params:e,colors:u}){const r={uOctaves:{value:3},uColorA:{value:[0,0,1,.9]},uColorB:{value:[1,0,.5,.9]}};function t(o,l){o==="num_octaves"&&(r.uOctaves.value=Math.max(1,Math.min(v,Math.round(l))))}a(t,"setParam"),e.num_octaves!==void 0&&t("num_octaves",e.num_octaves);function c(o){var l,n;r.uColorA.value=f((l=o.a)==null?void 0:l[0],[80/255,0,1,.9]),r.uColorB.value=f((n=o.b)==null?void 0:n[0],[1,40/255,120/255,.9])}return a(c,"setColors"),c(u),i({fragment:m,uniforms:r,pan:a(o=>({offsetX:o._offsetX,offsetY:o._offsetY,block:0,k:o.params.base_frequency??.012}),"pan"),setParam:t,setColors:c})}a(h,"createScene");export{h as createScene};
//# sourceMappingURL=plasma-pKAx2Q1Q.js.map
