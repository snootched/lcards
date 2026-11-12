var F=Object.defineProperty;var n=(u,i)=>F(u,"name",{value:i,configurable:true});import{c as x}from"./field-scene-x_5OCYxv.js";import{M as g}from"./noise-glsl-BA2w49__.js";import{r as v}from"./scene-helpers-qAOFaaBN.js";const t=16,h=`
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
}`;function B({params:u,colors:i}){const r=new Float32Array(t*4),o={uOctaves:{value:2},uBands:{value:5},uFill:{value:0},uBlend:{value:true},uStops:{value:r},uStopCount:{value:2},uFillColor:{value:[0,0,0,0]},uHasFill:{value:false}};function f(l,a){l==="num_octaves"?o.uOctaves.value=Math.max(1,Math.min(g,Math.round(a))):l==="num_bands"?o.uBands.value=Math.max(2,Math.min(64,a)):l==="fill_level"?o.uFill.value=Math.max(0,Math.min(.95,a)):l==="blend_colors"&&(o.uBlend.value=a!==false)}n(f,"setParam");for(const l of["num_octaves","num_bands","fill_level","blend_colors"])u[l]!==void 0&&f(l,u[l]);function s(l){var d,m;let a=(d=l.stops)!=null&&d.length?l.stops:[{r:255,g:255,b:255,a:1}];if(a.length===1&&(a=[a[0],a[0]]),a.length>t){const e=a;a=Array.from({length:t},(p,b)=>e[Math.round(b*(e.length-1)/(t-1))])}a.forEach((e,p)=>r.set(v(e),p*4)),o.uStopCount.value=a.length;const c=(m=l.fill)==null?void 0:m[0];o.uHasFill.value=!!c,o.uFillColor.value=v(c,[0,0,0,0])}return n(s,"setColors"),s(i),x({fragment:h,uniforms:o,pan:n(l=>({offsetX:l._offsetX,offsetY:l._offsetY,block:Math.max(1,Math.min(16,Math.round(l.params.cell_size??1))),k:l.params.noise_scale??.005}),"pan"),setParam:f,setColors:s})}n(B,"createScene");export{t as MAX_STOPS,B as createScene};
//# sourceMappingURL=contour-field-8ymvsFi7.js.map
