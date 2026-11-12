var l=Object.defineProperty;var a=(e,r)=>l(e,"name",{value:r,configurable:true});import{c as f}from"./field-scene-x_5OCYxv.js";import{M as s}from"./noise-glsl-BA2w49__.js";import{r as m}from"./scene-helpers-qAOFaaBN.js";const i=4,v=`
uniform int uOctaves;
uniform vec4 uColor;

void main() {
  float raw = lcFbm( lcCell(), lcLocal( lcPixel() ), uOctaves );
  float a = clamp( ( raw + 1.0 ) * 0.5 * uColor.a, 0.0, 1.0 );
  gl_FragColor = vec4( uColor.rgb * a, a );
}`;function d({params:e,colors:r}){const c={uOctaves:{value:4},uColor:{value:[.39215686274509803,.7058823529411765,1,.8]}};function n(o,t){o==="num_octaves"&&(c.uOctaves.value=Math.max(1,Math.min(s,Math.round(t))))}a(n,"setParam"),e.num_octaves!==void 0&&n("num_octaves",e.num_octaves);function u(o){var t;c.uColor.value=m((t=o.wash)==null?void 0:t[0],[100/255,180/255,1,.8])}return a(u,"setColors"),u(r),f({fragment:v,uniforms:c,pan:a(o=>({offsetX:o._offsetX,offsetY:o._offsetY,block:i,k:o.params.base_frequency??.01}),"pan"),setParam:n,setColors:u})}a(d,"createScene");export{d as createScene};
//# sourceMappingURL=fluid-CbcX-RQ9.js.map
