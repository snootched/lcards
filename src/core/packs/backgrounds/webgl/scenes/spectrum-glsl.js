/**
 * The warp spectrum: streaks that split into colour along their length (the
 * TNG warp look), as a Doppler shift of each star's own colour. Shared by
 * the `warp-starfield` background and the astrometrics star field.
 *
 * A streak's tail lies nearer the direction of travel than its head, so it
 * is shifted further toward violet; the head toward red. Each star starts
 * where its own colour sits on the red (0) to violet (1) ramp (white and
 * grey stars in the middle, so they show the whole rainbow); light shifted
 * past either end of the ramp leaves the visible range and fades out. A
 * blue star therefore streaks green to violet with a fading tail, a red one
 * red to green with a fading head. `dir` -1 reverses the shift (violet at
 * the head).
 *
 * @module core/packs/backgrounds/webgl/scenes/spectrum-glsl
 */
export const SPECTRUM_GLSL = /* glsl */ `
// red at 0 to violet at 1 (hue 0 to 0.8)
vec3 spectral( float x ) {
  vec3 k = abs( mod( 0.8 * x * 6.0 + vec3( 0.0, 4.0, 2.0 ), 6.0 ) - 3.0 ) - 1.0;
  return clamp( k, 0.0, 1.0 );
}

// Where a colour sits on the ramp: its hue (magenta counts as violet), white and greys in the middle
float spectralPos( vec3 c ) {
  float mx = max( c.r, max( c.g, c.b ) );
  float mn = min( c.r, min( c.g, c.b ) );
  float d = mx - mn;
  if ( mx <= 0.0 || d <= 1e-4 ) return 0.5;
  float h;
  if ( mx == c.r ) h = mod( ( c.g - c.b ) / d, 6.0 );
  else if ( mx == c.g ) h = ( c.b - c.r ) / d + 2.0;
  else h = ( c.r - c.g ) / d + 4.0;
  h /= 6.0;
  float pos = h > 0.9 ? 0.0 : clamp( h / 0.8, 0.0, 1.0 );
  return mix( 0.5, pos, d / mx );
}

// A star's colour at 'along' its streak (0 tail, 1 head), Doppler shifted;
// .a is how much of it is still visible light
vec4 warpSpectrum( vec3 star, float along, float dir ) {
  float x = spectralPos( star ) + ( 0.5 - along ) * dir;
  float out_ = max( -x, x - 1.0 );
  return vec4( spectral( clamp( x, 0.0, 1.0 ) ), 1.0 - smoothstep( 0.0, 0.3, out_ ) );
}
`;
