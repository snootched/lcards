/**
 * `holo-sphere` scene (lazy chunk): the latitude/longitude wireframe planet,
 * computed per pixel. Each pixel solves the sphere straight down the screen
 * (the view is orthographic), takes the front and back hit points back into
 * the sphere's own frame (rotation, then tilt undone), and draws the lines
 * there as distances: `line_width` px at any size, antialiased, the far side
 * under the front at `back_opacity`, and the scan band lighting the lines it
 * crosses. The model (line placement, far-side dimming, band) is shared with
 * the Canvas2D version (effects/holo-sphere-model.js); the shader mirrors
 * `depthAlpha()` and `bandGlow()`.
 *
 * The rotation angle is integrated on the effect (`_angle`, so a
 * `rotate_speed` change never jumps); the band is a pure function of the
 * effect clock (`createScanBand`).
 *
 * @module core/packs/backgrounds/webgl/scenes/holo-sphere
 */
import {
  Scene, OrthographicCamera, PlaneGeometry, Mesh, ShaderMaterial, NormalBlending, Vector2, Matrix3
} from 'three';
import { rgba } from './scene-helpers.js';
import { createScanBand, sphereFrame, BAND_WIDTH } from '../../effects/holo-sphere-model.js';

const VERT = /* glsl */ `
void main() {
  gl_Position = vec4( position.xy, 0.0, 1.0 );
}`;

const FRAG = /* glsl */ `
precision highp float;
uniform vec2 uSize;
uniform vec2 uCentre;
uniform float uRadius;
uniform mat3 uToObject;
uniform float uLat;
uniform float uLon;
uniform float uWidth;
uniform vec4 uColor;
uniform vec4 uScan;
uniform float uBack;
uniform float uBandY;
uniform float uBandStrength;

const float PI = 3.14159265358979;

vec4 acc;
void over( vec3 rgb, float a ) {
  acc = vec4( rgb * a, a ) + acc * ( 1.0 - a );
}

float band( float d, float w ) {
  float f = 0.6;
  return clamp( ( min( d + f, w * 0.5 ) - max( d - f, -w * 0.5 ) ) / ( 2.0 * f ), 0.0, 1.0 );
}

// depthAlpha() of the model: full in front, uBack behind, a short blend at the limb
float depthAlpha( float z ) {
  float t = clamp( ( z + 0.15 ) / 0.3, 0.0, 1.0 );
  return uBack + ( 1.0 - uBack ) * t * t * ( 3.0 - 2.0 * t );
}

// The wireframe at one hit point (view-space z on the unit sphere)
void surface( vec2 q, float z ) {
  vec3 o = uToObject * vec3( q, z );
  float lat = asin( clamp( o.y, -1.0, 1.0 ) );
  float lon = atan( o.z, o.x );
  // Longitude without the jump at +-pi, for its screen derivative
  float lon2 = atan( -o.z, -o.x );
  float dLat = length( vec2( dFdx( lat ), dFdy( lat ) ) );
  float dLon = min( length( vec2( dFdx( lon ), dFdy( lon ) ) ), length( vec2( dFdx( lon2 ), dFdy( lon2 ) ) ) );
  float cov = 0.0;
  if ( uLat > 0.5 ) {
    // Rings between the poles: lat = -pi/2 + pi * i / (uLat + 1), i = 1..uLat
    float step = PI / ( uLat + 1.0 );
    float i = clamp( floor( ( lat + PI * 0.5 ) / step + 0.5 ), 1.0, uLat );
    float d = abs( lat - ( -PI * 0.5 + step * i ) );
    cov = max( cov, band( d / max( dLat, 1e-6 ), uWidth ) );
  }
  if ( uLon > 0.5 ) {
    float step = 2.0 * PI / uLon;
    float d = abs( mod( lon + step * 0.5, step ) - step * 0.5 );
    cov = max( cov, band( d / max( dLon, 1e-6 ), uWidth ) );
  }
  if ( cov <= 0.0 ) return;
  float depth = depthAlpha( z );
  float dy = ( o.y - uBandY ) / ${BAND_WIDTH.toFixed(4)};
  float glow = clamp( uBandStrength * exp( -dy * dy ) * uScan.a, 0.0, 1.0 );
  float la = depth * uColor.a;
  // The band lights the lines it crosses (Canvas2D strokes them again in the scan colour)
  vec3 rgb = mix( uColor.rgb, uScan.rgb, glow );
  over( rgb, cov * clamp( la + glow * depth * ( 1.0 - la ), 0.0, 1.0 ) );
}

void main() {
  acc = vec4( 0.0 );
  // Pixel centre, top-left origin, then the unit sphere's frame (y up)
  vec2 px = vec2( gl_FragCoord.x, uSize.y - gl_FragCoord.y );
  vec2 q = ( px - uCentre ) / uRadius;
  q.y = -q.y;
  float r2 = dot( q, q );
  // Outside the disk: nothing (the lines' screen derivatives blow up at the limb)
  if ( r2 >= 1.0 ) { gl_FragColor = vec4( 0.0 ); return; }
  float z = sqrt( max( 0.0, 1.0 - r2 ) );
  surface( q, -z );
  surface( q, z );
  gl_FragColor = acc;
}`;

/**
 * @param {{ params: Record<string, any>, colors: Record<string, Array<{ r: number, g: number, b: number, a: number }>> }} opts
 */
export function createScene({ params, colors }) {
  const u = {
    uSize: { value: new Vector2(1, 1) },
    uCentre: { value: new Vector2() },
    uRadius: { value: 1 },
    uToObject: { value: new Matrix3() },
    uLat: { value: 7 },
    uLon: { value: 12 },
    uWidth: { value: 1 },
    uColor: { value: [0x93 / 255, 0xe1 / 255, 1, 1] },
    uScan: { value: [0xdf / 255, 0xe1 / 255, 0xe8 / 255, 1] },
    uBack: { value: 0.2 },
    uBandY: { value: -2 },
    uBandStrength: { value: 0 }
  };
  const material = new ShaderMaterial({
    uniforms: u,
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    premultipliedAlpha: true,
    depthTest: false,
    depthWrite: false,
    blending: NormalBlending
  });
  const geometry = new PlaneGeometry(2, 2);
  const quad = new Mesh(geometry, material);
  quad.frustumCulled = false;
  const scene = new Scene();
  scene.add(quad);
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  let scan = createScanBand(params.scan_period ?? 6);
  let scanPeriod = params.scan_period ?? 6;
  let w = 1;
  let h = 1;

  /** @param {Record<string, Array<{ r: number, g: number, b: number, a: number }>>} cols */
  function setColors(cols) {
    u.uColor.value = rgba(cols.lines?.[0], [0x93 / 255, 0xe1 / 255, 1, 1]);
    u.uScan.value = rgba(cols.scan?.[0], [0xdf / 255, 0xe1 / 255, 0xe8 / 255, 1]);
  }
  setColors(colors);

  return {
    scene,
    camera,
    material,
    /**
     * @param {number} t - effect clock, ms
     * @param {{ _angle: number }} effect
     */
    seek(t, effect) {
      const f = sphereFrame(params, w, h);
      u.uCentre.value.set(f.cx, f.cy);
      u.uRadius.value = f.r;
      // view = Rx(tilt) * Ry(angle) * object (placePoint); its inverse is the transpose
      const a = ((effect._angle ?? 0) * Math.PI) / 180;
      const tl = ((params.tilt ?? 20) * Math.PI) / 180;
      const ca = Math.cos(a), sa = Math.sin(a), ct = Math.cos(tl), st = Math.sin(tl);
      // Rx * Ry, row-major: rows (x', y', z')
      const m = [
        ca, 0, sa,
        st * sa, ct, -st * ca,
        -ct * sa, st, ct * ca
      ];
      // Matrix3.set takes row-major; set the transpose
      u.uToObject.value.set(m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]);
      u.uLat.value = Math.max(0, Math.min(64, Math.round(params.latitude_lines ?? 7)));
      u.uLon.value = Math.max(0, Math.min(128, Math.round(params.longitude_lines ?? 12)));
      u.uWidth.value = Math.max(0.1, params.line_width ?? 1);
      u.uBack.value = Math.max(0, Math.min(1, params.back_opacity ?? 0.2));
      if ((params.scan_period ?? 6) !== scanPeriod) {
        scanPeriod = params.scan_period ?? 6;
        scan = createScanBand(scanPeriod);
      }
      scan.seek(t);
      u.uBandY.value = scan.band.y;
      u.uBandStrength.value = scan.band.strength;
    },
    /** @param {number} width @param {number} height */
    resize(width, height) {
      w = width;
      h = height;
      u.uSize.value.set(w, h);
    },
    setParam() {},
    setColors,
    dispose() {
      geometry.dispose();
      material.dispose();
    }
  };
}
