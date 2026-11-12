import{c as g}from"./field-scene.DvEHcuUJ.js";import{p as x}from"./BackgroundAnimationRenderer.Bi3RWZjJ.js";import"./instance.DkfKKL3N.js";import"./number.Bx7EVHc7.js";import"./target.FfaGmL8c.js";import"./lcards-logging.BkMNBuzN.js";import"./reduced-motion.CR8xNM6Y.js";import"./resolve-color.DTQ_ay1J.js";import"./ColorUtils.Cit0BI8M.js";import"./theme.90cI75yW.js";import"./framework.DIp0zHSV.js";import"./template-string.D_XUSOOq.js";import"./ha-entity-display.CZm-V4fY.js";import"./effect-handle.ujHuwroQ.js";const r=10,T=`
uniform int uCount;
uniform vec2 uCenter[${r}];
uniform float uRadius[${r}];
uniform vec4 uColor[${r}];
uniform vec2 uStops[${r}];
uniform float uTurb;
uniform float uTime;

// The Canvas2D gradient: stops 1 at 0, s.x at 0.4, s.y at 0.7, 0 at 1
float profile( float r, vec2 s ) {
  if ( r < 0.4 ) return mix( 1.0, s.x, r / 0.4 );
  if ( r < 0.7 ) return mix( s.x, s.y, ( r - 0.4 ) / 0.3 );
  if ( r < 1.0 ) return mix( s.y, 0.0, ( r - 0.7 ) / 0.3 );
  return 0.0;
}

void main() {
  vec2 px = lcPixel();
  vec2 q = lcLocal( px );
  vec2 drift = vec2( uTime * 0.015, -uTime * 0.011 );
  // Edge turbulence, and wisps at a finer scale (both about -1.5..1.5)
  float warp = lcFbm( lcCell(), q + drift, 4 );
  float wisp = lcFbm( lcCell() * 3, q * 3.0 - drift * 1.7 + vec2( 17.3, -9.1 ), 5 );
  float tex = mix( 0.3, 1.35, smoothstep( -0.6, 0.9, wisp ) );
  vec3 rgb = vec3( 0.0 );
  float a = 0.0;
  for ( int i = 0; i < ${r}; i++ ) {
    if ( i >= uCount ) break;
    float r = length( px - uCenter[ i ] ) / uRadius[ i ];
    r += uTurb * 0.3 * warp;
    float ca = clamp( profile( r, uStops[ i ] ) * tex, 0.0, 1.0 ) * uColor[ i ].a;
    rgb = uColor[ i ].rgb * ca + rgb * ( 1.0 - ca );
    a = ca + a * ( 1.0 - ca );
  }
  gl_FragColor = vec4( rgb, a );
}`;function X(w){const e={uCount:{value:0},uCenter:{value:new Float32Array(r*2)},uRadius:{value:new Float32Array(r)},uColor:{value:new Float32Array(r*4)},uStops:{value:new Float32Array(r*2)},uTurb:{value:.5},uTime:{value:0}},i=new Map;let n=1,c=1;const s=g({fragment:T,uniforms:e,pan:o=>({offsetX:-o.model._scrollOffsetX,offsetY:-o.model._scrollOffsetY,block:0,k:(o.model.noiseScale??.003)*4}),setParam(){},setColors(){i.clear()}}),p=s.seek,v=s.resize;return{...s,resize(o,u){n=o,c=u,v(o,u)},seek(o,u){p(o,u);const m=u.model,f=m.cloudPlacements(n,c).slice(0,r);e.uCount.value=f.length,f.forEach(({cloud:t,x:b,y:C,radius:d},a)=>{e.uCenter.value[a*2]=b,e.uCenter.value[a*2+1]=C,e.uRadius.value[a]=Math.max(1,d);let l=i.get(t.color);l||(l=x(t.color,"#ff00ff"),i.set(t.color,l)),e.uColor.value.set([l.r/255,l.g/255,l.b/255,t.opacity],a*4),e.uStops.value[a*2]=t.stops[1],e.uStops.value[a*2+1]=t.stops[2]}),e.uTurb.value=m.turbulence,e.uTime.value=o/1e3}}}export{r as MAX_CLOUDS,X as createScene};
