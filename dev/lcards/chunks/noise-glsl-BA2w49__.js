var t=Object.defineProperty;var o=(l,e)=>t(l,"name",{value:e,configurable:true});import{dp as c}from"./lcards-main-C148JfkA.js";const a=o(l=>`${l>>>0}u`,"u32"),i=8,s=`
float lcHash( ivec2 p ) {
  uint h = ( ( uint( p.x ) * ${a(c.X)} ) ^ ( uint( p.y ) * ${a(c.Y)} ) ) + ${a(c.S)};
  h ^= h >> 16u;
  h *= ${a(c.M1)};
  h ^= h >> 15u;
  h *= ${a(c.M2)};
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
  for ( int k = 0; k < ${i}; k++ ) {
    if ( k >= octaves ) break;
    value += amplitude * lcSmoothNoise( cell, local );
    amplitude *= 0.5;
    cell *= 2;
    local *= 2.0;
  }
  return value;
}
`;function h(l){const e=Math.floor(l);return[e|0,l-e]}o(h,"splitCoord");export{i as M,s as N,h as s};
//# sourceMappingURL=noise-glsl-BA2w49__.js.map
