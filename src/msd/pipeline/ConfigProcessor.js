/**
 * @fileoverview ConfigProcessor — validates and enriches MSD card configs.
 *
 * Responsibilities:
 * - Extracts SVG metadata (viewBox, anchors) from raw SVG content before validation.
 * - Passes the enriched config through CoreConfigManager for schema validation.
 * - Merges anchor sources (SVG-extracted vs. user-defined) with correct precedence.
 * - Returns a flat MSD config, validation issues, and provenance for the pipeline.
 */

import { lcardsLog } from '../../utils/lcards-logging.js';
import { AnchorProcessor } from './AnchorProcessor.js';

/**
 * Process and validate MSD config using CoreConfigManager.
 * Handles anchor extraction, viewBox resolution, and complete config building.
 *
 * @param {Object} userMsdConfig - User MSD configuration
 * @param {string} svgContent - SVG content string (for anchor extraction)
 * @returns {Promise<Object>} { mergedConfig, issues, provenance }
 */
export async function processAndValidateConfig(userMsdConfig, svgContent = null) {
  const core = window.lcards?.core || window.lcardsCore;

  if (!core?.configManager?.initialized) {
    throw new Error('[ConfigProcessor] CoreConfigManager not initialized - this is a fatal error');
  }

  lcardsLog.trace('[ConfigProcessor] Processing config with SVG extraction');

  // Extract SVG metadata BEFORE config processing
  let viewBox = null;
  let anchors = {};

  if (svgContent) {
    // Extract viewBox from SVG
    viewBox = window.lcards?.getSvgViewBox?.(svgContent);

    // Extract and merge anchors
    const anchorResult = AnchorProcessor.processAnchors(
      svgContent,
      userMsdConfig.anchors || {},
      viewBox || [0, 0, 1920, 1080]
    );

    anchors = anchorResult.anchors;

    lcardsLog.trace('[ConfigProcessor] SVG metadata extracted:', {
      viewBox,
      anchorCount: anchorResult.metadata.totalCount,
      svgAnchors: anchorResult.metadata.svgAnchorCount,
      userAnchors: anchorResult.metadata.userAnchorCount
    });
  } else if (userMsdConfig.base_svg?.source === 'none') {
    // No SVG - use explicit viewBox from config
    viewBox = userMsdConfig.view_box;
    anchors = AnchorProcessor.processAnchors(
      null,
      userMsdConfig.anchors || {},
      viewBox || [0, 0, 1920, 1080]
    ).anchors;

    lcardsLog.trace('[ConfigProcessor] base_svg: "none" - using explicit viewBox:', viewBox);
  }

  // Merge extracted metadata into config BEFORE validation
  // This ensures anchors/viewBox flow through the merge pipeline with provenance
  const enhancedConfig = {
    ...userMsdConfig,
    view_box: viewBox || userMsdConfig.view_box || [0, 0, 1920, 1080],
    anchors: anchors,  // Put extracted anchors here - will be at top-level after processConfig
    _svgMetadata: {
      extractedViewBox: viewBox,
      extractedAnchors: Object.keys(anchors).length,
      processingSource: svgContent ? 'svg_extraction' : 'config_explicit'
    }
  };

  // Process through CoreConfigManager (includes validation)
  const result = await core.configManager.processConfig(
    enhancedConfig,
    'msd',
    { hass: window.hass }
  );

  // Extract the 'msd' property from the nested config structure
  // CoreConfigManager returns: { type, msd: {...}, rules, data_sources }
  // But CardModel expects flat structure: { base_svg, overlays, anchors, ... }
  const fullConfig = result.mergedConfig;
  const mergedConfig = fullConfig.msd || fullConfig; // Extract msd property or use full config if already flat
  const provenance = result.provenance;

  // Merge top-level anchors (extracted from SVG) with nested anchors (user-defined).
  // CoreConfigManager places extracted anchors at fullConfig.anchors (top-level)
  // but user-defined anchors are at fullConfig.msd.anchors (nested).
  // User anchors override extracted anchors with the same name.
  if (fullConfig.anchors && Object.keys(fullConfig.anchors).length > 0) {
    mergedConfig.anchors = {
      ...fullConfig.anchors,           // Extracted anchors (base layer)
      ...(mergedConfig.anchors || {})  // User anchors (override layer)
    };
    lcardsLog.trace('[ConfigProcessor] Merged anchors after CoreConfigManager:', {
      extractedCount: Object.keys(fullConfig.anchors).length,
      userCount: Object.keys(mergedConfig.anchors || {}).length - Object.keys(fullConfig.anchors).length,
      totalCount: Object.keys(mergedConfig.anchors).length
    });
  }

  // Convert CoreConfigManager result to MSD validation format
  const issues = {
    errors: result.errors || [],
    warnings: result.warnings || []
  };

  // Store result in mergedConfig for backward compatibility
  mergedConfig.__issues = issues;

  // Store original user config in debug namespace
  if (typeof window !== 'undefined') {
    window.lcards = window.lcards || {};
    window.lcards.debug = window.lcards.debug || {};
    window.lcards.debug.msd = window.lcards.debug.msd || {};
    window.lcards.debug.msd._originalUserConfig = userMsdConfig;
  }

  // Anchor validation - UPDATED to accept overlay IDs as virtual anchors
  try {
    const existingCodes = new Set(issues.errors.map(e=>e.code));
    const anchorSet = new Set(Object.keys(mergedConfig.anchors || {}));

    // Add overlay IDs as valid anchor targets (same as in validateMerged)
    const overlayIds = new Set();
    (mergedConfig.overlays || []).forEach(overlay => {
      if (overlay && overlay.id) {
        overlayIds.add(overlay.id);
        anchorSet.add(overlay.id); // Make overlay IDs valid anchor targets
      }
    });

    (mergedConfig.overlays || []).forEach(o=>{
      if (!o || !o.id) return;
      const aRefs = [];
      if (typeof o.anchor === 'string') aRefs.push(o.anchor);
      if (typeof o.attach_to === 'string') aRefs.push(o.attach_to);
      if (typeof o.attachTo === 'string') aRefs.push(o.attachTo);
      aRefs.forEach(ref=>{
        if (ref && !anchorSet.has(ref)) {
          const code = 'anchor.missing';
          if (!existingCodes.has(`${code}:${ref}:${o.id}`)) {
            issues.errors.push({ code, severity:'error', overlay:o.id, anchor:ref, msg:`Overlay ${o.id} references missing anchor '${ref}'` });
            existingCodes.add(`${code}:${ref}:${o.id}`);
          }
        }
      });
    });
  } catch(_) {}

  lcardsLog.trace('[ConfigProcessor] ✅ Config processed with provenance:', {
    layers: provenance?.merge_order?.length || 0,
    fields: Object.keys(provenance?.field_sources || {}).length,
    errors: issues.errors.length,
    warnings: issues.warnings.length
  });

  return { mergedConfig, issues, provenance };
}

/**
 * Alternative MSD config processor (used by some parts of the system)
 * Uses CoreConfigManager exclusively
 */
export async function processMsdConfig(userMsdConfig) {
  const core = window.lcards?.core || window.lcardsCore;

  if (!core?.configManager?.initialized) {
    throw new Error('[ConfigProcessor] CoreConfigManager not initialized - this is a fatal error');
  }

  lcardsLog.trace('[ConfigProcessor] processMsdConfig using CoreConfigManager');

  const result = await core.configManager.processConfig(
    userMsdConfig,
    'msd',
    { hass: window.hass }
  );

  const issues = {
    errors: result.errors || [],
    warnings: result.warnings || []
  };

  if (issues.errors.length > 0) {
    lcardsLog.error('MSD validation errors:', issues.errors);
  }

  if (issues.warnings.length > 0) {
    lcardsLog.warn('MSD validation warnings:', issues.warnings);
  }

  return {
    config: result.mergedConfig,
    validation: issues
  };
}
