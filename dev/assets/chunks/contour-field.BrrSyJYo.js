import{c as b,M as F}from"./field-scene.DvEHcuUJ.js";import{r as d}from"./scene-helpers.DoVgHnOc.js";import"./instance.DkfKKL3N.js";import"./number.Bx7EVHc7.js";import"./target.FfaGmL8c.js";import"./BackgroundAnimationRenderer.Bi3RWZjJ.js";import"./lcards-logging.BkMNBuzN.js";import"./reduced-motion.CR8xNM6Y.js";import"./resolve-color.DTQ_ay1J.js";import"./ColorUtils.Cit0BI8M.js";import"./theme.90cI75yW.js";import"./framework.DIp0zHSV.js";import"./template-string.D_XUSOOq.js";import"./ha-entity-display.CZm-V4fY.js";import"./effect-handle.ujHuwroQ.js";const t=16,x=`
uniform int uOctaves;
uniform float uBands;
uniform float uFill;
uniform bool uBlend;
uniform vec4 uStops[${t}];
uniform int uStopCount;
uniform vec4 uFillColor;
uniform bool uHasFill;

vec4 colorAtBand( float bandValue ) {
  float p = bandValue * float( uStopCount - 1 );
  if ( !uBlend ) {
    int idx = clamp( int( floor( p + 0.5 ) ), 0, uStopCount - 1 );
    return uStops[ idx ];
  }
  int idx = min( uStopCount - 2, int( floor( p ) ) );
  float frac = p - float( idx );
  return mix( uStops[ idx ], uStops[ idx + 1 ], frac );
}

void main() {
  vec2 px = lcPixel();
  float raw = lcFbm( lcCell(), lcLocal( px ), uOctaves );
  float n = clamp( ( raw + 1.0 ) * 0.5, 0.0, 1.0 );
  float bands = max( 2.0, floor( uBands + 0.5 ) );
  float bandIdx = clamp( floor( n * bands ), 0.0, bands - 1.0 );
  vec4 land = colorAtBand( bandIdx / ( bands - 1.0 ) );
  vec4 c = land;
  if ( uFill > 0.0 ) {
    float t = uBlend ? clamp( ( n - uFill ) / ( 1.0 / bands ), 0.0, 1.0 ) : ( n >= uFill ? 1.0 : 0.0 );
    vec3 underRgb = uHasFill ? uFillColor.rgb * uFillColor.a + land.rgb * ( 1.0 - uFillColor.a ) : land.rgb;
    float underA = uHasFill ? land.a : 0.0;
    c = vec4( mix( underRgb, land.rgb, t ), mix( underA, land.a, t ) );
  }
  gl_FragColor = vec4( c.rgb * c.a, c.a );
}`;function E({params:u,colors:p}){const e=new Float32Array(t*4),a={uOctaves:{value:2},uBands:{value:5},uFill:{value:0},uBlend:{value:!0},uStops:{value:e},uStopCount:{value:2},uFillColor:{value:[0,0,0,0]},uHasFill:{value:!1}};function i(l,o){l==="num_octaves"?a.uOctaves.value=Math.max(1,Math.min(F,Math.round(o))):l==="num_bands"?a.uBands.value=Math.max(2,Math.min(64,o)):l==="fill_level"?a.uFill.value=Math.max(0,Math.min(.95,o)):l==="blend_colors"&&(a.uBlend.value=o!==!1)}for(const l of["num_octaves","num_bands","fill_level","blend_colors"])u[l]!==void 0&&i(l,u[l]);function r(l){var f,c;let o=(f=l.stops)!=null&&f.length?l.stops:[{r:255,g:255,b:255,a:1}];if(o.length===1&&(o=[o[0],o[0]]),o.length>t){const n=o;o=Array.from({length:t},(m,v)=>n[Math.round(v*(n.length-1)/(t-1))])}o.forEach((n,m)=>e.set(d(n),m*4)),a.uStopCount.value=o.length;const s=(c=l.fill)==null?void 0:c[0];a.uHasFill.value=!!s,a.uFillColor.value=d(s,[0,0,0,0])}return r(p),b({fragment:x,uniforms:a,pan:l=>({offsetX:l._offsetX,offsetY:l._offsetY,block:Math.max(1,Math.min(16,Math.round(l.params.cell_size??1))),k:l.params.noise_scale??.005}),setParam:i,setColors:r})}export{t as MAX_STOPS,E as createScene};
