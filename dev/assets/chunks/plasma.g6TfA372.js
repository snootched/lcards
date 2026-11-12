import{c as n,M as m}from"./field-scene.DvEHcuUJ.js";import{r as i}from"./scene-helpers.DoVgHnOc.js";import"./instance.DkfKKL3N.js";import"./number.Bx7EVHc7.js";import"./target.FfaGmL8c.js";import"./BackgroundAnimationRenderer.Bi3RWZjJ.js";import"./lcards-logging.BkMNBuzN.js";import"./reduced-motion.CR8xNM6Y.js";import"./resolve-color.DTQ_ay1J.js";import"./ColorUtils.Cit0BI8M.js";import"./theme.90cI75yW.js";import"./framework.DIp0zHSV.js";import"./template-string.D_XUSOOq.js";import"./ha-entity-display.CZm-V4fY.js";import"./effect-handle.ujHuwroQ.js";const f=`
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
}`;function S({params:t,colors:c}){const a={uOctaves:{value:3},uColorA:{value:[0,0,1,.9]},uColorB:{value:[1,0,.5,.9]}};function e(o,r){o==="num_octaves"&&(a.uOctaves.value=Math.max(1,Math.min(m,Math.round(r))))}t.num_octaves!==void 0&&e("num_octaves",t.num_octaves);function l(o){var r,u;a.uColorA.value=i((r=o.a)==null?void 0:r[0],[80/255,0,1,.9]),a.uColorB.value=i((u=o.b)==null?void 0:u[0],[1,40/255,120/255,.9])}return l(c),n({fragment:f,uniforms:a,pan:o=>({offsetX:o._offsetX,offsetY:o._offsetY,block:0,k:o.params.base_frequency??.012}),setParam:e,setColors:l})}export{S as createScene};
