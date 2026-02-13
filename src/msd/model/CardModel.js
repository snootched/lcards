import { perfTimeAsync } from '../../utils/performance.js';
import { lcardsLog } from '../../utils/lcards-logging.js';

export async function buildCardModel(mergedConfig) {
  return perfTimeAsync('cardModel.build', async () => {
    // Phase A: implement viewBox:auto + SVG anchor extraction + percent resolution.
    // Extract actual viewBox from SVG content instead of hardcoding
    let viewBox = [0, 0, 400, 200]; // fallback only

    lcardsLog.trace('[CardModel] Initial viewBox (fallback):', viewBox);
    lcardsLog.trace('[CardModel] Merged config base_svg:', mergedConfig.base_svg);

    // Handle base_svg in multiple formats:
    // Format 1: base_svg: "builtin:template-name"
    // Format 2: base_svg: { source: "builtin:template-name", filters?: [...], filter_preset?: "..." }
    let baseSvgSource = null;
    let baseSvgFilters = null;
    let baseSvgFilterPreset = null;

    if (typeof mergedConfig.base_svg === 'string') {
      baseSvgSource = mergedConfig.base_svg;
    } else if (mergedConfig.base_svg && typeof mergedConfig.base_svg === 'object' && mergedConfig.base_svg.source) {
      baseSvgSource = mergedConfig.base_svg.source;
      baseSvgFilters = mergedConfig.base_svg.filters;
      baseSvgFilterPreset = mergedConfig.base_svg.filter_preset;
    }

    lcardsLog.trace('[CardModel] Resolved base_svg source:', baseSvgSource);

    // Resolve filter preset if specified (merge with explicit filters)
    let resolvedFilters = null;
    if (baseSvgFilterPreset || baseSvgFilters) {
      // Get ThemeManager instance to resolve preset
      const themeManager = window.lcards?.theme;

      if (baseSvgFilterPreset && themeManager) {
        const presetFilters = themeManager.getFilterPreset(baseSvgFilterPreset);
        if (presetFilters) {
          resolvedFilters = { ...presetFilters };
          lcardsLog.trace('[CardModel] Resolved filter preset:', baseSvgFilterPreset, presetFilters);
        } else {
          lcardsLog.warn('[CardModel] Unknown filter preset:', baseSvgFilterPreset);
        }
      }

      // Merge explicit filters
      if (baseSvgFilters) {
        // If filters is an array (new format), use it directly
        if (Array.isArray(baseSvgFilters)) {
          resolvedFilters = baseSvgFilters;
          lcardsLog.trace('[CardModel] Using array-based filters:', resolvedFilters);
        } else {
          // Legacy object format - merge with preset
          resolvedFilters = resolvedFilters ? { ...resolvedFilters, ...baseSvgFilters } : { ...baseSvgFilters };
          lcardsLog.trace('[CardModel] Applied explicit filters (object format):', resolvedFilters);
        }
      }
    }

    // Try to extract actual SVG viewBox from base_svg (unless source is "none")
    if (baseSvgSource && baseSvgSource !== 'none') {
      lcardsLog.trace('[CardModel] Using SVG source:', baseSvgSource);
      const { getSvgContent, getSvgViewBox } = await import('../../utils/lcards-anchor-helpers.js');
      const svgContent = getSvgContent(baseSvgSource);
      if (svgContent) {
        const extractedViewBox = getSvgViewBox(svgContent);
        if (extractedViewBox && Array.isArray(extractedViewBox) && extractedViewBox.length === 4) {
          viewBox = extractedViewBox;
          lcardsLog.trace('[CardModel] Extracted viewBox from SVG:', viewBox);
        } else {
          lcardsLog.warn('[CardModel] Could not extract viewBox from SVG content');
        }
      } else {
        lcardsLog.warn('[CardModel] Could not get SVG content for:', baseSvgSource);
      }
    } else if (baseSvgSource === 'none') {
      // When source is "none", use explicit view_box from config
      if (mergedConfig.view_box && Array.isArray(mergedConfig.view_box)) {
        viewBox = mergedConfig.view_box;
        lcardsLog.trace('[CardModel] Using explicit viewBox for base_svg="none":', viewBox);
      } else {
        lcardsLog.warn('[CardModel] base_svg is "none" but no explicit view_box provided, using fallback');
      }
    } else {
      lcardsLog.warn('[CardModel] No base_svg specified in merged config');
    }

    lcardsLog.trace('[CardModel] Final viewBox:', viewBox);

    // Build baseSvg object for model
    const baseSvg = {
      source: baseSvgSource,
      filters: resolvedFilters
    };

    // Copy anchors from config - these are used by OverlayUtils.resolvePosition()
    const anchors = mergedConfig.anchors || {};

    lcardsLog.trace('[CardModel] Anchors from config:', {
      count: Object.keys(anchors).length,
      anchors: anchors
    });

    // Preserve template property in overlays
    // Default to empty array if no overlays defined (e.g., testing base SVG only)
    const overlaysBase = (mergedConfig.overlays || []).map(o => {
      const baseOverlay = {
        id: o.id,
        type: o.type,
        style: o.style || {},
        raw: o
      };

      // Preserve template reference if present
      if (o.template && typeof o.template === 'string') {
        baseOverlay.template = o.template;
      }

      // Preserve animation_preset reference if present (for Phase 3)
      if (o.animation_preset && typeof o.animation_preset === 'string') {
        baseOverlay.animation_preset = o.animation_preset;
      }

      // Preserve other critical properties
      if (o.source) baseOverlay.source = o.source;
      if (o.data_source) baseOverlay.data_source = o.data_source;
      if (o.sources) baseOverlay.sources = o.sources;

      // Position: support both explicit position and anchor reference
      // Position takes precedence if both are specified
      if (o.position) {
        baseOverlay.position = o.position;
      } else if (o.anchor) {
        baseOverlay.position = o.anchor; // Use anchor as position (will be resolved by OverlayUtils)
      }

      if (o.size) baseOverlay.size = o.size;

      // Line overlay properties
      if (o.attach_to) baseOverlay.attach_to = o.attach_to;
      if (o.channel) baseOverlay.channel = o.channel;
      if (o.smooth !== undefined) baseOverlay.smooth = o.smooth;
      if (o.routing_strategy) baseOverlay.routing_strategy = o.routing_strategy;
      if (o.gap) baseOverlay.gap = o.gap;
      if (o.attach_side) baseOverlay.attach_side = o.attach_side;

      // Control overlay properties
      if (o.card) baseOverlay.card = o.card;

      return baseOverlay;
    });

    return { viewBox, baseSvg, anchors, overlaysBase, __raw: mergedConfig };
  });
}
