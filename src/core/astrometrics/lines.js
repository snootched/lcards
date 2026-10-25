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
 * @module core/astrometrics/lines
 */
import { InstancedInterleavedBuffer, InterleavedBufferAttribute, AdditiveBlending, Color, SRGBColorSpace, Matrix4 } from 'three';
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
      .replace('mod( vLineDistance + dashOffset', 'mod( vPxD / vPxW + dashOffset');
  }
}

/**
 * Flatten runs to segment pairs.
 * @param {number[][]} runs - each a flat [x, y, z, ...] polyline
 * @returns {{ positions: Float32Array, starts: Uint8Array, count: number }} starts[i] = 1 where segment i begins a run
 */
export function runsToSegments(runs) {
  let count = 0;
  for (const r of runs) count += Math.max(0, r.length / 3 - 1);
  const positions = new Float32Array(count * 6);
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
 * Cumulative screen-space length (CSS px) at both ends of every segment.
 * Segments with an end behind the camera add nothing.
 * @param {Float32Array} positions - segment pairs (object space)
 * @param {Uint8Array} starts
 * @param {Matrix4} mvp - projection * view * model
 * @param {number} width - CSS px
 * @param {number} height
 * @param {Float32Array} out - 2 per segment
 * @returns {Float32Array}
 */
export function screenDistances(positions, starts, mvp, width, height, out) {
  const e = mvp.elements;
  let acc = 0;
  let px = 0;
  let py = 0;
  let pok = false;
  const n = starts.length;
  for (let i = 0; i < n; i++) {
    if (starts[i]) acc = 0;
    out[i * 2] = acc;
    // end point only: the start is the previous end within a run
    for (let k = starts[i] ? 0 : 1; k < 2; k++) {
      const o = i * 6 + k * 3;
      const x = positions[o];
      const y = positions[o + 1];
      const z = positions[o + 2];
      const w = e[3] * x + e[7] * y + e[11] * z + e[15];
      const ok = w > 1e-6;
      const sx = ok ? ((e[0] * x + e[4] * y + e[8] * z + e[12]) / w) * 0.5 * width : 0;
      const sy = ok ? ((e[1] * x + e[5] * y + e[9] * z + e[13]) / w) * 0.5 * height : 0;
      if (k === 1 && ok && pok) acc += Math.hypot(sx - px, sy - py);
      px = sx;
      py = sy;
      pok = ok;
    }
    out[i * 2 + 1] = acc;
  }
  return out;
}

/** @param {number[]} rgb - sRGB 0..1 @returns {number[]} linear (vertex colours are not converted by three.js) */
const toLinear = (rgb) => rgb.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));

const _mvp = new Matrix4();

/**
 * @typedef {Object} LineStyle
 * @property {number[]} color - straight sRGB rgba 0..1
 * @property {number[]} [colorTo] - fades to this along each run
 * @property {number} [width] - CSS px
 * @property {number} [opacity]
 * @property {number[] | null} [dash] - [on, off] CSS px
 * @property {boolean} [additive]
 * @property {number} [renderOrder]
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
    this.dashed = dashed;
    this.geometry = new LineSegmentsGeometry();
    this.object = new LineSegments2(this.geometry, this.material);
    this.object.renderOrder = style.renderOrder ?? 3;
    this.object.frustumCulled = false;
    /** @type {{ positions: Float32Array, starts: Uint8Array, count: number }} */
    this._segs = { positions: new Float32Array(0), starts: new Uint8Array(0), count: 0 };
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
    this._segs = segs;
    if (!segs.count) {
      this.object.visible = false;
      return;
    }
    this.object.visible = true;
    // (setPositions makes fresh instance buffers; the old ones go with the old attributes)
    this.geometry.setPositions(segs.positions);
    if (this.style.colorTo) this.geometry.setColors(this._colors(runs));
    if (this.dashed) {
      this._dist = new Float32Array(segs.count * 2);
      this._distBuffer = new InstancedInterleavedBuffer(this._dist, 2, 1);
      this.geometry.setAttribute('instanceDistanceStart', new InterleavedBufferAttribute(this._distBuffer, 1, 0));
      this.geometry.setAttribute('instanceDistanceEnd', new InterleavedBufferAttribute(this._distBuffer, 1, 1));
    }
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
    if (!this.dashed || !this._dist || !this._distBuffer || !this._segs.count || !this.object.visible) return;
    _mvp.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse).multiply(this.object.matrixWorld);
    screenDistances(this._segs.positions, this._segs.starts, _mvp, width, height, this._dist);
    this._distBuffer.needsUpdate = true;
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

