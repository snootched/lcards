/**
 * 3D value noise for scene effects that wrap a surface or fill a volume (a
 * planet's plasma, a banded gas giant): sampled at the object-space
 * position, so there is no seam at longitude 0 and no pinch at the poles,
 * which 2D noise on a sphere's (lon, lat) would have. The same hash family
 * as the 2D noise (`noise-glsl.js`, NOISE_HASH), with a third axis.
 *
 * Precision as in the 2D noise: a lattice coordinate arrives split into
 * whole cells (`ivec3`) and a small rest (`vec3`), so a long drift never
 * reaches large floats.
 *
 * @module core/astrometrics/effects/noise3-glsl
 */
import { NOISE_HASH } from '../../packs/textures/effects/noise-helpers.js';

/** @param {number} n */
const u32 = (n) => `${(n >>> 0)}u`;

/** The third axis' multiplier (odd, well mixed) */
export const HASH_Z = 0x27d4eb2f;

/** Most octaves a fill shader loop runs */
export const MAX_OCTAVES3 = 8;

export const NOISE3_GLSL = /* glsl */ `
float lcHash3( ivec3 p ) {
  uint h = ( ( uint( p.x ) * ${u32(NOISE_HASH.X)} ) ^ ( uint( p.y ) * ${u32(NOISE_HASH.Y)} ) ^ ( uint( p.z ) * ${u32(HASH_Z)} ) ) + ${u32(NOISE_HASH.S)};
  h ^= h >> 16u;
  h *= ${u32(NOISE_HASH.M1)};
  h ^= h >> 15u;
  h *= ${u32(NOISE_HASH.M2)};
  h ^= h >> 16u;
  // -1 .. 1
  return float( h ) / 2147483648.0 - 1.0;
}

float lcNoise3( ivec3 cell, vec3 local ) {
  vec3 fl = floor( local );
  ivec3 i = cell + ivec3( fl );
  vec3 f = local - fl;
  vec3 u = f * f * ( 3.0 - 2.0 * f );
  float x00 = mix( lcHash3( i ), lcHash3( i + ivec3( 1, 0, 0 ) ), u.x );
  float x10 = mix( lcHash3( i + ivec3( 0, 1, 0 ) ), lcHash3( i + ivec3( 1, 1, 0 ) ), u.x );
  float x01 = mix( lcHash3( i + ivec3( 0, 0, 1 ) ), lcHash3( i + ivec3( 1, 0, 1 ) ), u.x );
  float x11 = mix( lcHash3( i + ivec3( 0, 1, 1 ) ), lcHash3( i + ivec3( 1, 1, 1 ) ), u.x );
  return mix( mix( x00, x10, u.y ), mix( x01, x11, u.y ), u.z );
}

// fBm, about -1 .. 1 (each octave doubles the frequency, halves the amplitude)
float lcFbm3( ivec3 cell, vec3 local, int octaves ) {
  float value = 0.0;
  float amplitude = 0.5;
  float total = 0.0;
  for ( int k = 0; k < ${MAX_OCTAVES3}; k++ ) {
    if ( k >= octaves ) break;
    value += amplitude * lcNoise3( cell, local );
    total += amplitude;
    amplitude *= 0.5;
    cell *= 2;
    local *= 2.0;
  }
  return value / max( total, 1e-6 );
}
`;
