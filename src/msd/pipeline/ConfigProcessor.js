import { lcardsLog } from '../../utils/lcards-logging.js';

/**
 * Process and validate MSD config using CoreConfigManager
 * Requires CoreConfigManager to be initialized (part of lcards-core.js startup)
 */
export async function processAndValidateConfig(userMsdConfig) {
  const core = window.lcards?.core || window.lcardsCore;

  if (!core?.configManager?.initialized) {
    throw new Error('[ConfigProcessor] CoreConfigManager not initialized - this is a fatal error');
  }

  lcardsLog.debug('[ConfigProcessor] Using CoreConfigManager for MSD processing');

  const result = await core.configManager.processConfig(
    userMsdConfig,
    'msd',
    { hass: window.hass }
  );

  const mergedConfig = result.mergedConfig;
  const provenance = result.provenance;

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

  lcardsLog.debug('[ConfigProcessor] processMsdConfig using CoreConfigManager');

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
