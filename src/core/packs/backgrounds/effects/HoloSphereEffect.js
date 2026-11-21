/**
 * `holo-sphere` on Canvas2D: the rotating latitude/longitude wireframe planet
 * with its scan band, drawn as projected line segments. The WebGL version
 * (webgl/scenes/holo-sphere.js) draws the same model (holo-sphere-model.js);
 * this one is its fallback and the `renderer: canvas` version.
 *
 * Segments are bucketed by brightness (far side, limb, front, band) so a
 * frame is a handful of strokes, not one per segment.
 *
 * @module core/packs/backgrounds/effects/HoloSphereEffect
 */
import { BaseEffect } from './BaseEffect.js';
import { numProp, colorProp } from './animatable-props.js';
import { resolveColor } from '../../../themes/resolve-color.js';
import {
  sphereSegments, placePoint, depthAlpha, bandGlow, createScanBand, sphereFrame
} from './holo-sphere-model.js';

/** Brightness buckets for the line strokes */
const LEVELS = 6;

export class HoloSphereEffect extends BaseEffect {
  static animatableProps = {
    ...BaseEffect.animatableProps,
    rotate_speed: numProp('rotate_speed'),
    tilt: numProp('tilt', { min: -90, max: 90 }),
    size: numProp('size', { min: 0 }),
    position_x: numProp('position_x'),
    position_y: numProp('position_y'),
    back_opacity: numProp('back_opacity', { min: 0, max: 1 }),
    line_width: numProp('line_width', { min: 0.1 }),
    color: colorProp('color'),
    scan_color: colorProp('scan_color')
  };

  static recolorFields = ['color', 'scan_color'];

  /**
   * @param {Object} config
   * @param {number} [config.rotate_speed=1] - Revolutions per minute (negative turns the other way)
   * @param {number} [config.tilt=20] - Degrees, north pole toward the viewer
   * @param {number} [config.latitude_lines=7]
   * @param {number} [config.longitude_lines=12]
   * @param {number} [config.size=0.8] - Diameter as a fraction of the card's shorter side
   * @param {number} [config.position_x=0.5]
   * @param {number} [config.position_y=0.5]
   * @param {number} [config.back_opacity=0.2]
   * @param {number} [config.line_width=1] - px
   * @param {number} [config.scan_period=6] - Seconds per scan sweep, 0 = no band
   * @param {string} [config.color]
   * @param {string} [config.scan_color]
   * @param {number} [config.opacity=1]
   */
  constructor(config = {}) {
    super(/** @type {any} */ (config));
    this.rotate_speed = config.rotate_speed ?? 1;
    this.tilt = config.tilt ?? 20;
    this.size = config.size ?? 0.8;
    this.position_x = config.position_x ?? 0.5;
    this.position_y = config.position_y ?? 0.5;
    this.back_opacity = config.back_opacity ?? 0.2;
    this.line_width = config.line_width ?? 1;
    this.color = resolveColor(config.color ?? '#93e1ff', { concrete: true });
    this.scan_color = resolveColor(config.scan_color ?? '#dfe1e8', { concrete: true });
    /** Rotation in degrees, integrated so a rotate_speed change never jumps */
    this._angle = 0;
    this._segments = sphereSegments(config.latitude_lines ?? 7, config.longitude_lines ?? 12);
    this._scan = createScanBand(config.scan_period ?? 6);
    this._p = { x: 0, y: 0, z: 0 };
    this._q = { x: 0, y: 0, z: 0 };
  }

  /**
   * @param {number} deltaTime
   * @param {number} w
   * @param {number} h
   */
  update(deltaTime, w, h) {
    super.update(deltaTime, w, h);
    this._angle = (this._angle + this.rotate_speed * 0.006 * deltaTime * this.speed) % 360;
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} w
   * @param {number} h
   */
  draw(ctx, w, h) {
    const { cx, cy, r } = sphereFrame(this, w, h);
    const a = (this._angle * Math.PI) / 180;
    const t = (this.tilt * Math.PI) / 180;
    const cosA = Math.cos(a), sinA = Math.sin(a), cosT = Math.cos(t), sinT = Math.sin(t);
    this._scan.seek(this._elapsedTime);
    const band = this._scan.band;
    const seg = this._segments;
    const p = this._p, q = this._q;

    /** @type {Path2D[]} */
    const lines = Array.from({ length: LEVELS }, () => new Path2D());
    /** @type {Path2D[]} */
    const glow = Array.from({ length: LEVELS }, () => new Path2D());
    for (let i = 0; i < seg.length; i += 6) {
      placePoint(seg[i], seg[i + 1], seg[i + 2], cosA, sinA, cosT, sinT, p);
      placePoint(seg[i + 3], seg[i + 4], seg[i + 5], cosA, sinA, cosT, sinT, q);
      const level = Math.min(LEVELS - 1, Math.floor(depthAlpha((p.z + q.z) / 2, this.back_opacity) * LEVELS));
      lines[level].moveTo(cx + p.x * r, cy - p.y * r);
      lines[level].lineTo(cx + q.x * r, cy - q.y * r);
      // Band: by latitude (object-space y), dimmed on the far side like the lines
      const g = bandGlow((seg[i + 1] + seg[i + 4]) / 2, band) * depthAlpha((p.z + q.z) / 2, this.back_opacity);
      if (g > 1 / LEVELS) {
        const gl = Math.min(LEVELS - 1, Math.floor(g * LEVELS));
        glow[gl].moveTo(cx + p.x * r, cy - p.y * r);
        glow[gl].lineTo(cx + q.x * r, cy - q.y * r);
      }
    }

    const alpha = ctx.globalAlpha;
    ctx.lineWidth = this.line_width;
    ctx.strokeStyle = this.color;
    lines.forEach((path, level) => {
      ctx.globalAlpha = alpha * this.opacity * ((level + 0.5) / LEVELS);
      ctx.stroke(path);
    });
    ctx.strokeStyle = this.scan_color;
    ctx.lineWidth = this.line_width * 1.5;
    glow.forEach((path, level) => {
      ctx.globalAlpha = alpha * this.opacity * ((level + 0.5) / LEVELS);
      ctx.stroke(path);
    });
    ctx.globalAlpha = alpha;
  }

  destroy() {
    this._scan.cancel();
    super.destroy();
  }
}
