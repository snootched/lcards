import { RendererUtils } from './RendererUtils.js';

/**
 * Implicit z-index defaults by overlay type, applied when an overlay has no
 * explicit `z_index` — reproduces the pre-Phase-3 paint order (controls over
 * lines) plus shape's slot beneath both. See OverlayUtils.resolveZIndex().
 */
export const DEFAULT_Z_BY_TYPE = { control: 200, line: 100, shape: 50 };

/**
 * Shared utilities for overlay renderers
 * Provides common functionality without requiring inheritance
 */
export class OverlayUtils {
  /**
   * Resolve an overlay's effective stacking z-index: explicit z_index, else
   * the type's implicit default, else a global fallback (150, between shape
   * and line) — the single source of truth for the ordering formula
   * AdvancedRenderer's final z-order pass (real SVG paint order) uses, so any
   * other consumer needing the SAME ordering (e.g. MSD Studio's interactive
   * hit-layer) doesn't re-derive its own, driftable copy.
   * @param {Object} overlay
   * @returns {number}
   */
  static resolveZIndex(overlay) {
    return overlay?.z_index ?? DEFAULT_Z_BY_TYPE[overlay?.type] ?? 150;
  }

  /**
   * Build an id → declared-array-index map, for the tie-break used when two
   * overlays share a resolved z-index (see compareByZIndex).
   * @param {Array<Object>} overlays - the full, unfiltered overlays array
   * @returns {Map<string, number>}
   */
  static buildDeclOrderMap(overlays) {
    return new Map((overlays || []).map((o, i) => [o.id, i]));
  }

  /**
   * Comparator for Array.prototype.sort: ascending resolved z-index, ties
   * broken by declared order. Pass the Map from buildDeclOrderMap.
   * @param {Object} a
   * @param {Object} b
   * @param {Map<string, number>} declOrder
   * @returns {number}
   */
  static compareByZIndex(a, b, declOrder) {
    const za = OverlayUtils.resolveZIndex(a);
    const zb = OverlayUtils.resolveZIndex(b);
    if (za !== zb) return za - zb;
    return (declOrder.get(a.id) ?? 0) - (declOrder.get(b.id) ?? 0);
  }

  /**
   * Resolve position from various formats (coordinates, anchor references)
   * @param {Array|string} position - Position specification
   * @param {Object} anchors - Available anchors
   * @returns {Array|null} [x, y] coordinates or null if invalid
   */
  static resolvePosition(position, anchors) {
    if (Array.isArray(position) && position.length >= 2) {
      return [Number(position[0]), Number(position[1])];
    }

    if (typeof position === 'string' && anchors && anchors[position]) {
      const anchor = anchors[position];
      return Array.isArray(anchor) ? [anchor[0], anchor[1]] : null;
    }

    return null;
  }

  /**
   * Compute standard attachment points for any overlay
   * @param {Object} overlay - Overlay configuration
   * @param {Object} anchors - Available anchors
   * @returns {Object|null} Attachment points object
   */
  static computeAttachmentPoints(overlay, anchors) {
    const position = this.resolvePosition(overlay.position, anchors);
    const size = overlay.size;

    if (!position || !size || !Array.isArray(size) || size.length < 2) {
      return null;
    }

    const [x, y] = position;
    const [width, height] = size;

    return {
      id: overlay.id,
      center: [x + width / 2, y + height / 2],
      bbox: {
        left: x,
        right: x + width,
        top: y,
        bottom: y + height,
        width,
        height,
        x,
        y
      },
      points: {
        center: [x + width / 2, y + height / 2],
        top: [x + width / 2, y],
        bottom: [x + width / 2, y + height],
        left: [x, y + height / 2],
        right: [x + width, y + height / 2],
        topLeft: [x, y],
        topRight: [x + width, y],
        bottomLeft: [x, y + height],
        bottomRight: [x + width, y + height]
      }
    };
  }

  /**
   * Normalize style properties (handle snake_case and camelCase)
   * @param {Object} style - Style object
   * @returns {Object} Normalized style object
   */
  static normalizeStyle(style) {
    if (!style || typeof style !== 'object') return {};

    return {
      fontSize: style.font_size || style.fontSize || 16,
      fill: style.color || style.fill || 'var(--lcars-text-light, var(--lcards-moonlight, #ffffff))',
      fontFamily: style.font_family || style.fontFamily || 'Antonio, sans-serif',
      stroke: style.stroke || 'none',
      strokeWidth: style.stroke_width || style.strokeWidth || 1,
      opacity: style.opacity || 1,
      ...style // Include any other properties as-is
    };
  }

  /**
   * Build common SVG attributes for overlay elements
   * @param {string} overlayId - Overlay ID
   * @param {string} overlayType - Overlay type
   * @param {Object} additionalAttrs - Additional attributes
   * @returns {string} Attribute string for SVG elements
   */
  static buildSvgAttributes(overlayId, overlayType, additionalAttrs = {}) {
    const attrs = [
      `data-overlay-id="${overlayId}"`,
      `data-overlay-type="${overlayType}"`
    ];

    Object.entries(additionalAttrs).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        attrs.push(`${key}="${value}"`);
      }
    });

    return attrs.join(' ');
  }

  /**
   * Escape XML special characters (delegates to RendererUtils)
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  static escapeXml(text) {
    return RendererUtils.escapeXml(text);
  }
}