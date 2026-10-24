/**
 * GLSL port of the Canvas2D value noise (textures/effects/noise-helpers.js),
 * built from the same hash constants so both tiers sample the same field.
 *
 * Precision: a lattice coordinate is passed split into whole cells (`ivec2`)
 * and a small local part (`vec2`), so the float32 maths only ever sees small
 * numbers, however far the field has scrolled. At octave k the whole part
 * doubles in integer maths (wrapping, as the JS `| 0`), and the local part
 * doubles in float.
 *
 * @module core/packs/backgrounds/webgl/scenes/noise-glsl
 */
import { NOISE_HASH } from '../../../textures/effects/noise-helpers.js';

/** @param {number} n */
const u32 = (n) => `${(n >>> 0)}u`;

/** Most octaves a shader loop runs (uniform count, constant loop bound) */
export const MAX_OCTAVES = 8;

export const NOISE_GLSL = /* glsl */ `
float lcHash( ivec2 p ) {
  uint h = ( ( uint( p.x ) * ${u32(NOISE_HASH.X)} ) ^ ( uint( p.y ) * ${u32(NOISE_HASH.Y)} ) ) + ${u32(NOISE_HASH.S)};
  h ^= h >> 16u;
  h *= ${u32(NOISE_HASH.M1)};
  h ^= h >> 15u;
  h *= ${u32(NOISE_HASH.M2)};
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
  for ( int k = 0; k < ${MAX_OCTAVES}; k++ ) {
    if ( k >= octaves ) break;
    value += amplitude * lcSmoothNoise( cell, local );
    amplitude *= 0.5;
    cell *= 2;
    local *= 2.0;
  }
  return value;
}
`;

/**
 * Split a lattice coordinate for the shader: whole cells and the rest.
 * @param {number} v
 * @returns {[number, number]} [cell, local], local in [0, 1)
 */
export function splitCoord(v) {
  const cell = Math.floor(v);
  return [cell | 0, v - cell];
}
