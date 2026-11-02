/**
 * Fat lines for the astrometrics scene: three.js `LineSegments2` (px widths,
 * per-vertex colours, additive glow) with **dashes in screen px**.
 *
 * three.js dashes lines in world units, so near the camera a dash grows
 * huge. Here the CPU writes each segment's cumulative screen-space length
 * (CSS px) into the dash distance attributes every frame, and the material
 * patch interpolates them linearly in screen space: GLSL ES 3.00 has no
 * `noperspective`, so the vertex shader passes `d * w` and `w` and the
 * fragment divides (perspective-correct interpolation of both cancels out).
 * `dash: [6, 4]` then means 6 px on, 4 px off, at any distance.
 *
 * Every line is a list of runs (polylines); a path split at the horizon is
 * one line with two runs. The dash pattern continues along a run and
 * restarts at the next.
 *
 * **Anchored vertices.** The GPU stores positions as 32-bit floats: a route
 * in a galaxy in light years has its Sol end at 26,000, good only to about
 * 0.002 ly (18 billion km), so seen from inside the Sol system its end would
 * jump by a solar system's width. A line keeps its positions in 64-bit and
 * draws them relative to an anchor (`object.position`, full precision in the
 * matrices): the vertex nearest the camera, moved when the camera is so close
 * to the line that the float error would show.
 *
 * @module core/astrometrics/lines
 */
import { InstancedInterleavedBuffer, InterleavedBufferAttribute, AdditiveBlending, CustomBlending, MaxEquation, OneFactor, Color, SRGBColorSpace, Matrix4, Vector3 } from 'three';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';

/**
 * `LineMaterial` with the dash test on screen-linear distances.
 */
export class PxDashLineMaterial extends LineMaterial {
  /** @param {any} params */
  constructor(params) {
    super(params);
    this.vertexShader = this.vertexShader
      .replace('void main() {', 'varying float vPxW;\nvarying float vPxD;\nvoid main() {')
      .replace('gl_Position = clip;', 'gl_Position = clip;\n\t\t\t#ifdef USE_DASH\n\t\t\t\tvPxW = clip.w;\n\t\t\t\tvPxD = vLineDistance * clip.w;\n\t\t\t#endif');
    this.fragmentShader = this.fragmentShader
      .replace('void main() {', 'varying float vPxW;\nvarying float vPxD;\nvoid main() {')
      .replace('mod( vLineDistance + dashOffset', 'mod( vPxD / vPxW + dashOffset')
      // tube: shaded as a lit cylinder across its width (vUv.x runs -1 to 1 edge to edge)
      .replace('gl_FragColor = vec4( diffuseColor.rgb, alpha );', `#ifdef USE_TUBE
				float tx = clamp( vUv.x, -1.0, 1.0 );
				float nz = sqrt( max( 0.0, 1.0 - tx * tx ) );
				float spec = exp( -pow( ( tx + 0.3 ) / 0.16, 2.0 ) );
				diffuseColor.rgb = diffuseColor.rgb * ( 0.18 + 0.82 * nz ) + vec3( 0.55 * spec );
			#endif
			#ifdef USE_SOFT
				alpha *= exp( -3.0 * vUv.x * vUv.x );
			#endif
			gl_FragColor = vec4( diffuseColor.rgb, alpha );`)
      // lighten: the brightest piece wins where pieces overlap (max blending
      // ignores alpha, so the colour carries it)
      .replace('#include <colorspace_fragment>', `#include <colorspace_fragment>
			#ifdef USE_LIGHTEN
				gl_FragColor = vec4( gl_FragColor.rgb * gl_FragColor.a, gl_FragColor.a );
			#endif`);
  }
}

/**
 * Flatten runs to segment pairs.
 * @param {number[][]} runs - each a flat [x, y, z, ...] polyline
 * @returns {{ positions: Float64Array, starts: Uint8Array, count: number }} starts[i] = 1 where segment i begins a run
 */
export function runsToSegments(runs) {
  let count = 0;
  for (const r of runs) count += Math.max(0, r.length / 3 - 1);
  // 64-bit: a line far from its frame's origin keeps its precision until it is anchored (FatLine)
  const positions = new Float64Array(count * 6);
  const starts = new Uint8Array(count);
  let i = 0;
  for (const r of runs) {
    const n = r.length / 3;
    for (let k = 0; k < n - 1; k++, i++) {
      positions.set(r.slice(k * 3, k * 3 + 6), i * 6);
      starts[i] = k === 0 ? 1 : 0;
    }
  }
  return { positions, starts, count };
}

/**
 * Cumulative screen-space length (CSS px) at both ends of every segment, as
 * the dash distances the line shader interpolates.
 *
 * A segment with one end behind the camera is trimmed by three.js's line
 * shader at its near-plane estimate, and that end's distance interpolated by
 * the same fraction (`mix(start, end, alpha)`). With `proj` the same trim is
 * done here and the end's value chosen so the shader's interpolation lands on
 * the true screen length at the cut; without it (or for an orthographic
 * camera) such a segment adds nothing. Without this, a line running from
 * beside the camera to far away draws huge dashes that jump as the camera
 * moves.
 * @param {Float32Array | Float64Array} positions - segment pairs (object space)
 * @param {Uint8Array} starts
 * @param {Matrix4} mvp - projection * view * model
 * @param {number} width - CSS px
 * @param {number} height
 * @param {Float32Array} out - 2 per segment
 * @param {Matrix4} [proj] - the camera's projection matrix (its near-plane estimate)
 * @returns {Float32Array}
 */
export function screenDistances(positions, starts, mvp, width, height, out, proj) {
  const e = mvp.elements;
  const p = proj?.elements;
  // perspective (as LineMaterial tests it): projectionMatrix[2][3] == -1
  const perspective = !!p && p[11] === -1;
  // the shader's near-plane estimate (view z), as clip w
  const wNear = perspective ? -(p[10] > 0 ? -p[14] / (p[10] + 1) : (-0.5 * p[14]) / p[10]) : 0;
  const w = (/** @type {number} */ o) => e[3] * positions[o] + e[7] * positions[o + 1] + e[11] * positions[o + 2] + e[15];
  /** screen position of a point between two ends (t from the first), CSS px */
  const at = (/** @type {number} */ a, /** @type {number} */ b, /** @type {number} */ t) => {
    const x = positions[a] + (positions[b] - positions[a]) * t;
    const y = positions[a + 1] + (positions[b + 1] - positions[a + 1]) * t;
    const z = positions[a + 2] + (positions[b + 2] - positions[a + 2]) * t;
    const cw = e[3] * x + e[7] * y + e[11] * z + e[15];
    return [((e[0] * x + e[4] * y + e[8] * z + e[12]) / cw) * 0.5 * width, ((e[1] * x + e[5] * y + e[9] * z + e[13]) / cw) * 0.5 * height];
  };
  let acc = 0;
  const n = starts.length;
  for (let i = 0; i < n; i++) {
    if (starts[i]) acc = 0;
    const a = i * 6;
    const b = a + 3;
    const w0 = w(a);
    const w1 = w(b);
    if (w0 > 1e-6 && w1 > 1e-6) {
      const [x0, y0] = at(a, b, 0);
      const [x1, y1] = at(a, b, 1);
      const len = Math.hypot(x1 - x0, y1 - y0);
      out[i * 2] = acc;
      out[i * 2 + 1] = acc + len;
      acc += len;
    } else if (perspective && w0 > 0 && w1 <= 0) {
      // the end is behind: the shader cuts at alpha and interpolates the end's distance by it
      const alpha = (w0 - wNear) / (w0 - w1);
      const [x0, y0] = at(a, b, 0);
      const [xc, yc] = at(a, b, alpha);
      const len = Math.hypot(xc - x0, yc - y0);
      out[i * 2] = acc;
      out[i * 2 + 1] = alpha > 1e-9 ? acc + len / alpha : acc;
      acc += len;
    } else if (perspective && w1 > 0 && w0 <= 0) {
      // the start is behind: cut from the end's side
      const alpha = (w1 - wNear) / (w1 - w0);
      const [x1, y1] = at(a, b, 1);
      const [xc, yc] = at(b, a, alpha);
      const len = Math.hypot(x1 - xc, y1 - yc);
      out[i * 2] = alpha > 1e-9 ? acc + len - len / alpha : acc;
      out[i * 2 + 1] = acc + len;
      acc += len;
    } else {
      out[i * 2] = acc;
      out[i * 2 + 1] = acc;
    }
  }
  return out;
}

/** @param {number[]} rgb - sRGB 0..1 @returns {number[]} linear (vertex colours are not converted by three.js) */
const toLinear = (rgb) => rgb.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));

const _mvp = new Matrix4();
const _inv = new Matrix4();
const _cam = new Vector3();

/**
 * @typedef {Object} LineStyle
 * @property {number[]} color - straight sRGB rgba 0..1
 * @property {number[]} [colorTo] - fades to this along each run
 * @property {number} [width] - CSS px
 * @property {number} [opacity]
 * @property {number[] | null} [dash] - [on, off] CSS px
 * @property {boolean} [additive]
 * @property {number} [renderOrder]
 * @property {boolean} [tube] - shaded as a lit cylinder across its width
 * @property {boolean} [soft] - fades out toward its edges (a beam's haze)
 * @property {boolean} [lighten] - overlapping pieces show the brightest, not their sum (a glow under a curve)
 */

export class FatLine {
  /**
   * @param {number[][]} runs
   * @param {LineStyle} style
   */
  constructor(runs, style) {
    this.style = style;
    const dashed = Array.isArray(style.dash) && style.dash.length >= 2 && style.dash[0] > 0;
    const c = style.color;
    this.material = new PxDashLineMaterial({
      color: style.colorTo ? 0xffffff : new Color().setRGB(c[0], c[1], c[2], SRGBColorSpace).getHex(),
      linewidth: style.width ?? 1.5,
      worldUnits: false,
      dashed,
      dashSize: dashed ? Number(style.dash?.[0]) : 1,
      gapSize: dashed ? Math.max(0, Number(style.dash?.[1] ?? style.dash?.[0])) : 1,
      transparent: true,
      opacity: (style.opacity ?? 1) * (c[3] ?? 1),
      vertexColors: !!style.colorTo,
      depthWrite: false
    });
    if (style.additive) this.material.blending = AdditiveBlending;
    if (style.tube) this.material.defines.USE_TUBE = '';
    if (style.soft) this.material.defines.USE_SOFT = '';
    if (style.lighten) {
      this.material.defines.USE_LIGHTEN = '';
      this.material.blending = CustomBlending;
      this.material.blendEquation = MaxEquation;
      this.material.blendSrc = OneFactor;
      this.material.blendDst = OneFactor;
    }
    this.dashed = dashed;
    this.geometry = new LineSegmentsGeometry();
    this.object = new LineSegments2(this.geometry, this.material);
    this.object.renderOrder = style.renderOrder ?? 3;
    this.object.frustumCulled = false;
    /** @type {{ positions: Float64Array, starts: Uint8Array, count: number }} relative to the anchor */
    this._segs = { positions: new Float64Array(0), starts: new Uint8Array(0), count: 0 };
    /** @type {Float64Array} the segment ends in the line's own space (the anchor added back) */
    this._abs = new Float64Array(0);
    /** The anchor: where the vertices are measured from (`object.position`) */
    this._anchor = [0, 0, 0];
    /** Moved in place by moveSegments (a deforming rim): never re-anchored, its base positions stay as given */
    this._moved = false;
    /** @type {Float32Array | null} */
    this._dist = null;
    /** @type {InstancedInterleavedBuffer | null} */
    this._distBuffer = null;
    this.setRuns(runs);
  }

  /**
   * Replace the polylines (same style).
   * @param {number[][]} runs
   */
  setRuns(runs) {
    const segs = runsToSegments(runs);
    this._abs = segs.positions;
    this._segs = { ...segs, positions: this._relative(segs.positions) };
    if (!segs.count) {
      this.object.visible = false;
      return;
    }
    this.object.visible = true;
    // (setPositions makes fresh instance buffers; the old ones go with the old attributes)
    this.geometry.setPositions(Float32Array.from(this._segs.positions));
    // three caches the instance count the first time it draws the geometry and
    // never again: a line that grows (a trail) would stay at its first length
    /** @type {any} */ (this.geometry)._maxInstanceCount = undefined;
    if (this.style.colorTo) this.geometry.setColors(this._colors(runs));
    if (this.dashed) {
      this._dist = new Float32Array(segs.count * 2);
      this._distBuffer = new InstancedInterleavedBuffer(this._dist, 2, 1);
      this.geometry.setAttribute('instanceDistanceStart', new InterleavedBufferAttribute(this._distBuffer, 1, 0));
      this.geometry.setAttribute('instanceDistanceEnd', new InterleavedBufferAttribute(this._distBuffer, 1, 1));
    }
  }

  /**
   * The segment end points as drawn (x, y, z per end, two ends per segment):
   * a copy to move with `moveSegments`.
   * @returns {Float32Array}
   */
  segmentPositions() {
    return Float32Array.from(this._segs.positions);
  }

  /**
   * Move the segment ends in place (a deforming rim each frame), without new
   * buffers: `positions` as `segmentPositions()` gave them, moved.
   * @param {Float32Array} positions
   */
  moveSegments(positions) {
    const attr = /** @type {any} */ (this.geometry.getAttribute('instanceStart'));
    if (!attr || attr.data.array.length !== positions.length) return;
    this._moved = true;
    attr.data.array.set(positions);
    attr.data.needsUpdate = true;
  }

  /**
   * Positions relative to the anchor.
   * @param {Float64Array} abs
   * @private
   */
  _relative(abs) {
    const [ax, ay, az] = this._anchor;
    const out = new Float64Array(abs.length);
    for (let i = 0; i < abs.length; i += 3) {
      out[i] = abs[i] - ax;
      out[i + 1] = abs[i + 1] - ay;
      out[i + 2] = abs[i + 2] - az;
    }
    return out;
  }

  /**
   * Keep the vertices near the camera exact: when the camera is so close to
   * the line that 32-bit positions measured from the anchor would be off by
   * more than about a millionth of its distance, the vertex nearest it
   * becomes the anchor. Most lines never move theirs.
   * @param {import('three').Camera} camera - matrices up to date
   * @returns {boolean} whether it moved
   */
  anchorTo(camera) {
    const abs = this._abs;
    if (this._moved || !this._segs.count || !this.object.visible || !this.object.parent) return false;
    // the camera in the line's own space (the parent's: the anchor is object.position)
    _cam.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(_inv.copy(this.object.parent.matrixWorld).invert());
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < abs.length; i += 3) {
      const d = (abs[i] - _cam.x) ** 2 + (abs[i + 1] - _cam.y) ** 2 + (abs[i + 2] - _cam.z) ** 2;
      if (d < bestD) { bestD = d; best = i; }
    }
    const [ax, ay, az] = this._anchor;
    const off = Math.hypot(abs[best] - ax, abs[best + 1] - ay, abs[best + 2] - az);
    // 32-bit floats hold about 7 digits: the nearest vertex is off by ~6e-8 of its offset from the anchor
    if (off * 1e-6 <= Math.sqrt(bestD)) return false;
    this._anchor = [abs[best], abs[best + 1], abs[best + 2]];
    this._segs = { ...this._segs, positions: this._relative(abs) };
    const attr = /** @type {any} */ (this.geometry.getAttribute('instanceStart'));
    if (attr && attr.data.array.length === this._segs.positions.length) {
      attr.data.array.set(this._segs.positions);
      attr.data.needsUpdate = true;
    } else {
      this.geometry.setPositions(Float32Array.from(this._segs.positions));
    }
    this.geometry.computeBoundingSphere();
    this.object.position.set(this._anchor[0], this._anchor[1], this._anchor[2]);
    this.object.updateMatrixWorld();
    return true;
  }

  /**
   * Per-segment colours, fading from `color` to `colorTo` along each run.
   * @param {number[][]} runs
   * @private
   */
  _colors(runs) {
    const a = toLinear(this.style.color.slice(0, 3));
    const b = toLinear((this.style.colorTo ?? this.style.color).slice(0, 3));
    const out = new Float32Array(this._segs.count * 6);
    let i = 0;
    for (const r of runs) {
      const n = r.length / 3;
      for (let k = 0; k < n - 1; k++, i++) {
        for (let e = 0; e < 2; e++) {
          const t = n > 1 ? (k + e) / (n - 1) : 0;
          for (let ch = 0; ch < 3; ch++) out[i * 6 + e * 3 + ch] = a[ch] + (b[ch] - a[ch]) * t;
        }
      }
    }
    return out;
  }

  /**
   * Line width is in CSS px against this resolution.
   * @param {number} width - CSS px
   * @param {number} height
   */
  setResolution(width, height) {
    this.material.resolution.set(width, height);
  }

  /**
   * Rewrite the px dash distances for this frame (dashed lines only).
   * @param {import('three').Camera} camera - matrices up to date
   * @param {number} width - CSS px
   * @param {number} height
   */
  updateDashes(camera, width, height) {
    this.anchorTo(camera);
    if (!this.dashed || !this._dist || !this._distBuffer || !this._segs.count || !this.object.visible) return;
    _mvp.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse).multiply(this.object.matrixWorld);
    screenDistances(this._segs.positions, this._segs.starts, _mvp, width, height, this._dist, camera.projectionMatrix);
    this._distBuffer.needsUpdate = true;
  }

  /**
   * Slide the dashes along the line: positive moves them from each run's
   * start toward its end, `px` CSS px from rest (kept inside one dash
   * period, so float precision holds however long it runs).
   * @param {number} px
   */
  setFlow(px) {
    if (!this.dashed) return;
    const period = this.material.dashSize + this.material.gapSize;
    this.material.dashOffset = period > 0 ? -(((px % period) + period) % period) : 0;
  }

  /**
   * @param {number[]} color - sRGB rgba
   * @param {number[]} [colorTo]
   */
  setColor(color, colorTo) {
    this.style = { ...this.style, color, colorTo: colorTo ?? this.style.colorTo };
    if (this.style.colorTo) {
      if (this._segs.count) this.geometry.setColors(this._colorsFromSegments());
    } else {
      this.material.color.setRGB(color[0], color[1], color[2], SRGBColorSpace);
    }
    this.material.opacity = (this.style.opacity ?? 1) * (color[3] ?? 1);
  }

  /** Colours for the current segments (runs rebuilt from the starts) @private */
  _colorsFromSegments() {
    /** @type {number[][]} */
    const runs = [];
    const { positions, starts, count } = this._segs;
    for (let i = 0; i < count; i++) {
      if (starts[i]) runs.push(Array.from(positions.subarray(i * 6, i * 6 + 3)));
      runs[runs.length - 1].push(...positions.subarray(i * 6 + 3, i * 6 + 6));
    }
    return this._colors(runs);
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }
}

