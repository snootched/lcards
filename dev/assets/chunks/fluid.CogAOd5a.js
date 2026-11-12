import{c,M as n}from"./field-scene.DvEHcuUJ.js";import{r as u}from"./scene-helpers.DoVgHnOc.js";import"./instance.DkfKKL3N.js";import"./number.Bx7EVHc7.js";import"./target.FfaGmL8c.js";import"./BackgroundAnimationRenderer.Bi3RWZjJ.js";import"./lcards-logging.BkMNBuzN.js";import"./reduced-motion.CR8xNM6Y.js";import"./resolve-color.DTQ_ay1J.js";import"./ColorUtils.Cit0BI8M.js";import"./theme.90cI75yW.js";import"./framework.DIp0zHSV.js";import"./template-string.D_XUSOOq.js";import"./ha-entity-display.CZm-V4fY.js";import"./effect-handle.ujHuwroQ.js";const l=4,s=`
uniform int uOctaves;
uniform vec4 uColor;

void main() {
  float raw = lcFbm( lcCell(), lcLocal( lcPixel() ), uOctaves );
  float a = clamp( ( raw + 1.0 ) * 0.5 * uColor.a, 0.0, 1.0 );
  gl_FragColor = vec4( uColor.rgb * a, a );
}`;function L({params:a,colors:i}){const r={uOctaves:{value:4},uColor:{value:[.39215686274509803,.7058823529411765,1,.8]}};function e(o,t){o==="num_octaves"&&(r.uOctaves.value=Math.max(1,Math.min(n,Math.round(t))))}a.num_octaves!==void 0&&e("num_octaves",a.num_octaves);function m(o){var t;r.uColor.value=u((t=o.wash)==null?void 0:t[0],[100/255,180/255,1,.8])}return m(i),c({fragment:s,uniforms:r,pan:o=>({offsetX:o._offsetX,offsetY:o._offsetY,block:l,k:o.params.base_frequency??.01}),setParam:e,setColors:m})}export{L as createScene};
