var T=Object.defineProperty;var n=(c,e)=>T(c,"name",{value:e,configurable:true});import{c as w}from"./field-scene-x_5OCYxv.js";import{b5 as S}from"./lcards-main-C148JfkA.js";const r=10,F=`
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
}`;function k(c){const e={uCount:{value:0},uCenter:{value:new Float32Array(r*2)},uRadius:{value:new Float32Array(r)},uColor:{value:new Float32Array(r*4)},uStops:{value:new Float32Array(r*2)},uTurb:{value:.5},uTime:{value:0}},s=new Map;let f=1,m=1;const i=w({fragment:F,uniforms:e,pan:n(o=>({offsetX:-o.model._scrollOffsetX,offsetY:-o.model._scrollOffsetY,block:0,k:(o.model.noiseScale??.003)*4}),"pan"),setParam(){},setColors(){s.clear()}}),b=i.seek,C=i.resize;return{...i,resize(o,u){f=o,m=u,C(o,u)},seek(o,u){b(o,u);const p=u.model,v=p.cloudPlacements(f,m).slice(0,r);e.uCount.value=v.length,v.forEach(({cloud:a,x:d,y:g,radius:x},t)=>{e.uCenter.value[t*2]=d,e.uCenter.value[t*2+1]=g,e.uRadius.value[t]=Math.max(1,x);let l=s.get(a.color);l||(l=S(a.color,"#ff00ff"),s.set(a.color,l)),e.uColor.value.set([l.r/255,l.g/255,l.b/255,a.opacity],t*4),e.uStops.value[t*2]=a.stops[1],e.uStops.value[t*2+1]=a.stops[2]}),e.uTurb.value=p.turbulence,e.uTime.value=o/1e3}}}n(k,"createScene");export{r as MAX_CLOUDS,k as createScene};
//# sourceMappingURL=nebula-B1YWj0Iu.js.map
