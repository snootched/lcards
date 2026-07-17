import { lcardsLog } from '../../utils/lcards-logging.js';

/**
 * AnchorProcessor - Pipeline-level anchor extraction and merging
 *
 * This utility handles extraction of anchor points from SVG content and merging
 * with user-defined anchors. Replaces card-level _processAnchors() logic.
 *
 * Key responsibilities:
 * - Extract anchor points from SVG elements (<circle>, <text>, <g> with IDs)
 * - Resolve percentage coordinates to absolute positions
 * - Merge SVG anchors with user anchors (user overrides SVG)
 * - Track provenance metadata for debugging
 */
export class AnchorProcessor {
  /**
   * Process anchors from SVG + user config + pack defaults
   *
   * @param {string} svgContent - SVG content string (null for base_svg: "none")
   * @param {Object} userAnchors - User-defined anchors from config
   * @param {Array} viewBox - SVG viewBox [x, y, width, height]
   * @param {Object} [computedAnchors] - Algorithmically-derived anchors (SvgStructureAnalyzer),
   *   lowest precedence - a hand-drawn SVG anchor or explicit config anchor always wins.
   * @returns {Object} { anchors, metadata } - Resolved anchors with provenance
   */
  static processAnchors(svgContent, userAnchors = {}, viewBox, computedAnchors = {}) {
    lcardsLog.trace('[AnchorProcessor] Processing anchors:', {
      hasSvgContent: !!svgContent,
      userAnchorCount: Object.keys(userAnchors).length,
      computedAnchorCount: Object.keys(computedAnchors).length,
      viewBox
    });

    // Extract SVG anchors (from <circle>, <text>, <g> with IDs)
    const svgAnchors = this._extractSvgAnchors(svgContent);

    // Resolve percentage coordinates in user anchors
    const resolvedUserAnchors = this._resolvePercentages(userAnchors, viewBox);

    // Merge: computed anchors < SVG anchors < user anchors (each layer overrides the previous)
    const merged = { ...computedAnchors, ...svgAnchors, ...resolvedUserAnchors };

    lcardsLog.trace('[AnchorProcessor] Anchors processed:', {
      computedAnchorCount: Object.keys(computedAnchors).length,
      svgAnchorCount: Object.keys(svgAnchors).length,
      userAnchorCount: Object.keys(resolvedUserAnchors).length,
      totalCount: Object.keys(merged).length,
      svgAnchorNames: Object.keys(svgAnchors),
      userAnchorNames: Object.keys(resolvedUserAnchors)
    });

    return {
      anchors: merged,
      metadata: {
        computedAnchorCount: Object.keys(computedAnchors).length,
        svgAnchorCount: Object.keys(svgAnchors).length,
        userAnchorCount: Object.keys(resolvedUserAnchors).length,
        totalCount: Object.keys(merged).length,
        processingSource: svgContent ? 'svg_extraction' : 'config_explicit'
      }
    };
  }

  /**
   * Extract anchor points from SVG content
   * Uses existing window.lcards.findSvgAnchors() helper
   *
   * @param {string} svgContent - SVG content string
   * @returns {Object} Extracted anchors { anchorName: [x, y] }
   * @private
   */
  static _extractSvgAnchors(svgContent) {
    if (!svgContent) {
      lcardsLog.trace('[AnchorProcessor] No SVG content - skipping anchor extraction');
      return {};
    }

    // Use existing utility from lcards-anchor-helpers.js
    const anchors = window.lcards?.findSvgAnchors?.(svgContent) || {};

    lcardsLog.trace('[AnchorProcessor] Extracted SVG anchors:', anchors);

    return anchors;
  }

  /**
   * Resolve percentage coordinates to absolute positions
   * Converts anchor coordinates like ["50%", "50%"] to absolute [x, y]
   *
   * @param {Object} anchors - Anchors with possibly percentage coordinates
   * @param {Array} viewBox - SVG viewBox [minX, minY, width, height]
   * @returns {Object} Anchors with resolved absolute coordinates
   * @private
   */
  static _resolvePercentages(anchors, viewBox) {
    if (!anchors || Object.keys(anchors).length === 0) {
      return {};
    }

    const [minX, minY, vw, vh] = viewBox;
    const resolved = {};

    for (const [name, pos] of Object.entries(anchors)) {
      if (Array.isArray(pos) && pos.length === 2) {
        let [x, y] = pos;

        // Convert percentage strings to absolute coordinates
        if (typeof x === 'string' && x.endsWith('%')) {
          x = minX + (parseFloat(x) / 100) * vw;
          lcardsLog.trace(`[AnchorProcessor] Resolved ${name} x: ${pos[0]} → ${x}`);
        }
        if (typeof y === 'string' && y.endsWith('%')) {
          y = minY + (parseFloat(y) / 100) * vh;
          lcardsLog.trace(`[AnchorProcessor] Resolved ${name} y: ${pos[1]} → ${y}`);
        }

        resolved[name] = [Number(x), Number(y)];
      } else {
        // Non-coordinate anchor (e.g., group without position)
        resolved[name] = pos;
      }
    }

    return resolved;
  }
}
