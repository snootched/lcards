/**
 * `nebula` with `volumetric: true` (lazy chunk): the same clouds as
 * NebulaEffect (seeded layout, colours, opacities, the drift of their centres,
 * taken from a NebulaEffect model each frame), each shaded with noise on the
 * GPU instead of a smooth radial gradient: a turbulent edge (`turbulence`)
 * and wisps inside, scrolling with `scroll_speed_x/y` and slowly evolving.
 *
 * Two noise fields per pixel, shared by every cloud, so the cost does not
 * grow with `cloud_count`. Clouds composite in order, source-over, as the
 * Canvas2D version draws them.
 *
 * @module core/packs/backgrounds/webgl/scenes/nebula
 */
import { createFieldScene } from './field-scene.js';
import { parseColorToRgba } from '../../../textures/effects/noise-helpers.js';

/** NebulaEffect caps cloud_count at 10 */
export const MAX_CLOUDS = 10;

const FRAG = /* glsl */ `
uniform int uCount;
uniform vec2 uCenter[${MAX_CLOUDS}];
uniform float uRadius[${MAX_CLOUDS}];
uniform vec4 uColor[${MAX_CLOUDS}];
uniform vec2 uStops[${MAX_CLOUDS}];
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
  for ( int i = 0; i < ${MAX_CLOUDS}; i++ ) {
    if ( i >= uCount ) break;
    float r = length( px - uCenter[ i ] ) / uRadius[ i ];
    r += uTurb * 0.3 * warp;
    float ca = clamp( profile( r, uStops[ i ] ) * tex, 0.0, 1.0 ) * uColor[ i ].a;
    rgb = uColor[ i ].rgb * ca + rgb * ( 1.0 - ca );
    a = ca + a * ( 1.0 - ca );
  }
  gl_FragColor = vec4( rgb, a );
}`;

/**
 * @param {{ params: Record<string, any>, colors: Record<string, any> }} _opts - unused:
 *   clouds and colours come from the effect's model each frame
 */
export function createScene(_opts) {
  const u = {
    uCount: { value: 0 },
    uCenter: { value: new Float32Array(MAX_CLOUDS * 2) },
    uRadius: { value: new Float32Array(MAX_CLOUDS) },
    uColor: { value: new Float32Array(MAX_CLOUDS * 4) },
    uStops: { value: new Float32Array(MAX_CLOUDS * 2) },
    uTurb: { value: 0.5 },
    uTime: { value: 0 }
  };
  /** @type {Map<string, { r: number, g: number, b: number }>} */
  const parsed = new Map();
  let w = 1;
  let h = 1;

  const field = createFieldScene({
    fragment: FRAG,
    uniforms: u,
    // Noise moves with the scroll (Canvas2D samples at px + scroll); finer
    // than the drift noise so the texture reads at card sizes
    pan: (e) => ({ offsetX: -e.model._scrollOffsetX, offsetY: -e.model._scrollOffsetY, block: 0, k: (e.model.noiseScale ?? 0.003) * 4 }),
    setParam() {},
    setColors() { parsed.clear(); }
  });

  const baseSeek = field.seek;
  const baseResize = field.resize;
  return {
    ...field,
    /** @param {number} w2 @param {number} h2 */
    resize(w2, h2) {
      w = w2;
      h = h2;
      baseResize(w2, h2);
    },
    /**
     * @param {number} t - effect clock, ms
     * @param {any} effect - NebulaGLEffect (its NebulaEffect model holds the clouds)
     */
    seek(t, effect) {
      baseSeek(t, effect);
      const model = effect.model;
      const placements = model.cloudPlacements(w, h).slice(0, MAX_CLOUDS);
      u.uCount.value = placements.length;
      placements.forEach(({ cloud, x, y, radius }, i) => {
        u.uCenter.value[i * 2] = x;
        u.uCenter.value[i * 2 + 1] = y;
        u.uRadius.value[i] = Math.max(1, radius);
        let c = parsed.get(cloud.color);
        if (!c) {
          c = parseColorToRgba(cloud.color, '#ff00ff');
          parsed.set(cloud.color, c);
        }
        // The colour's own alpha is replaced by the stops, as in Canvas2D
        u.uColor.value.set([c.r / 255, c.g / 255, c.b / 255, cloud.opacity], i * 4);
        u.uStops.value[i * 2] = cloud.stops[1];
        u.uStops.value[i * 2 + 1] = cloud.stops[2];
      });
      u.uTurb.value = model.turbulence;
      u.uTime.value = t / 1000;
    }
  };
}
