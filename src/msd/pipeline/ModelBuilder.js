/**
 * @fileoverview ModelBuilder — assembles the resolved overlay model for an MSD card.
 *
 * Takes a merged config and CardModel, applies theme token resolution and
 * returns a fully-resolved model ready for AdvancedRenderer.
 */

import { lcardsLog } from '../../utils/lcards-logging.js';

export class ModelBuilder {
  constructor(mergedConfig, cardModel, coordinator) {
    this.mergedConfig = mergedConfig;
    this.cardModel = cardModel;
    this.systems = coordinator;

    // animationIndex removed - animations now defined directly on overlays

    this._resolvedModelRef = null;
  }

  async computeResolvedModel() {
    // Assemble base overlays with profiles
    const baseOverlays = this._assembleBaseOverlays();

    // REMOVED: _subscribeOverlaysToDataSources (sparkline/ribbon/historybar specific)
    // this._subscribeOverlaysToDataSources(baseOverlays);

    // REMOVED: Rule evaluation - now handled by core rulesManager singleton
    // Rules are evaluated globally and applied via card's _onRulePatchesChanged() callback
    // MSD card receives patches automatically when rules affecting it change

    // Process animations (no rule result needed)
    const { animDiff } = this._processAnimations(baseOverlays, { overlayPatches: [] });

    // Build final resolved model
    const resolved = {
      viewBox: this.cardModel.viewBox,
      anchors: { ...this.cardModel.anchors },
      overlays: baseOverlays,
      animations: animDiff.active,
      config: this.mergedConfig
    };

    // Update router
    try {
      this.systems.router.setOverlays && this.systems.router.setOverlays(resolved.overlays);
    } catch(_) {}

    this._resolvedModelRef = resolved;
    return resolved;
  }

  getResolvedModel() {
    return this._resolvedModelRef;
  }


  _assembleBaseOverlays() {
    return this.cardModel.overlaysBase.map(o => {
        // Start with overlay's own style (highest precedence)
        const baseStyle = o.style || {};

        // Resolve any theme token references in the style
        const resolvedStyle = this._resolveThemeTokensInStyle(baseStyle, o.type);

        // FIXED: Preserve ALL properties from raw overlay config AND from baseOverlay
        // Start with all raw properties, then override with processed values from CardModel
        const resolvedOverlay = {
          ...o.raw,  // Start with ALL raw properties (includes entities, card, etc.)
          ...o,      // Overlay baseOverlay properties from CardModel (position, attach_to, etc.)
          id: o.id,
          type: o.type,
          style: resolvedStyle,
          finalStyle: { ...resolvedStyle },
          _raw: o.raw
        };

        return resolvedOverlay;
      });
  }

  /**
   * Resolve theme token references in overlay style
   * @private
   */
    /**
   * Resolve theme tokens in style objects
   * @param {Object} style - Style object that may contain theme tokens
   * @param {string} overlayType - Type of overlay for component-scoped resolution
   * @returns {Object} Style object with resolved theme tokens
   */
  _resolveThemeTokensInStyle(style, overlayType) {
    if (!style || typeof style !== 'object') {
      return style;
    }

    const resolved = {};
    const themeManager = this.systems.themeManager;

    if (!themeManager || !themeManager.initialized || !themeManager.resolver) {
      // No theme system available, return style as-is
      return { ...style };
    }

    // Get component-scoped resolver - use the resolver from ThemeManager
    const resolveToken = themeManager.resolver.forComponent(overlayType);

    // Recursively resolve token references in style values
    for (const [key, value] of Object.entries(style)) {
      if (typeof value === 'string' && value.startsWith('theme:')) {
        // This is a theme token reference: "theme:colors.accent.primary"
        const tokenPath = value.substring(6); // Remove "theme:" prefix
        resolved[key] = resolveToken(tokenPath, value);
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Recursively resolve nested objects
        resolved[key] = this._resolveThemeTokensInStyle(value, overlayType);
      } else {
        // Keep value as-is
        resolved[key] = value;
      }
    }

    return resolved;
  }




  // REMOVED METHOD: _subscribeOverlaysToDataSources
  // Subscribed sparkline/ribbon/historybar overlays which are no longer supported.

  // REMOVED METHOD: _monitorPendingSubscriptions
  // Was only used by _subscribeOverlaysToDataSources.


  // REMOVED: _applyRules() - rules now evaluated by core rulesManager singleton
  // Rules are applied via card's _onRulePatchesChanged() callback, not during model building

  // REMOVED: _applyOverlayPatches() - patches applied via core rulesManager callback
  // MSD card receives rule patches through _onRulePatchesChanged() lifecycle hook

  _processAnimations(overlaysWithPatches, ruleResult) {
    // Legacy animation_ref system removed
    // Animations are now handled directly by AnimationManager from overlay.animations arrays
    const animDiff = { active: [] };

    return { activeAnimations: [], animDiff };
  }
}
