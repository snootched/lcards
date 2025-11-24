import { mergePacks } from '../../core/packs/mergePacks.js';
import { validateMerged } from '../validation/validateMerged.js';
import { lcardsLog } from '../../utils/lcards-logging.js';

export { mergePacks, validateMerged };

/**
 * Process and validate MSD config using CoreConfigManager
 * Falls back to direct mergePacks if ConfigManager unavailable
 */
export async function processAndValidateConfig(userMsdConfig) {
  let mergedConfig;
  let provenance;
  let issues;

  // Try to use CoreConfigManager (unified path)
  const core = window.lcardsCore || window.lcards?.core;

  if (core?.configManager?.initialized) {
    try {
      lcardsLog.debug('[ConfigProcessor] Using CoreConfigManager for MSD processing');

      const result = await core.configManager.processConfig(
        userMsdConfig,
        'msd',
        { hass: window.hass }
      );

      mergedConfig = result.mergedConfig;
      provenance = result.provenance;

      // Convert CoreConfigManager result to MSD validation format
      issues = {
        errors: result.errors || [],
        warnings: result.warnings || []
      };

      // Store result in mergedConfig for backward compatibility
      mergedConfig.__issues = issues;

    } catch (error) {
      // FALLBACK: CoreConfigManager failed (network/load error) - use direct mergePacks
      // This path should rarely execute - CoreConfigManager initialization is part of lcards-core.js startup
      lcardsLog.warn('[ConfigProcessor] CoreConfigManager failed, falling back to mergePacks:', error);
      mergedConfig = await mergePacks(userMsdConfig);
      provenance = mergedConfig.__provenance;
    }
  } else {
    // FALLBACK: CoreConfigManager not loaded yet (rare timing issue)
    // This path should rarely execute - CoreConfigManager is loaded in lcards-core.js before MSD cards render
    lcardsLog.warn('[ConfigProcessor] CoreConfigManager not available (timing issue), using mergePacks directly');
    mergedConfig = await mergePacks(userMsdConfig);
    provenance = mergedConfig.__provenance;
  }

  // If issues not set (legacy path), run validation
  if (!issues) {
    const t0 = performance.now();
    issues = validateMerged(mergedConfig);
    mergedConfig.__issues = issues;
    const t1 = performance.now();
    try { window.lcards.debug.msd && (window.lcards.debug.msd._validationMs = (t1 - t0)); } catch {}
  }

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
 * Uses CoreConfigManager when available, falls back to direct processing
 */
export async function processMsdConfig(userMsdConfig) {
  try {
    // Try unified path via CoreConfigManager
    const core = window.lcardsCore || window.lcards?.core;

    if (core?.configManager?.initialized) {
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

    // Fallback: Legacy path
    lcardsLog.debug('[ConfigProcessor] processMsdConfig using legacy path');
    const preValidation = validateMerged(userMsdConfig);
    const mergedConfig = await mergePacks(userMsdConfig);
    const postValidation = validateMerged(mergedConfig);

    const issues = {
      errors: [...preValidation.errors, ...postValidation.errors],
      warnings: [...preValidation.warnings, ...postValidation.warnings]
    };

    if (issues.errors.length > 0) {
      lcardsLog.error('MSD validation errors:', issues.errors);
    }

    if (issues.warnings.length > 0) {
      lcardsLog.warn('MSD validation warnings:', issues.warnings);
    }

    return {
      config: mergedConfig,
      validation: issues
    };

  } catch (error) {
    lcardsLog.error('MSD processing failed:', error);
    throw error;
  }
}
