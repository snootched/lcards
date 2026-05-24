import { lcardsLog } from '../../utils/lcards-logging.js';
import { deepMergeImmutable } from '../../utils/deepMerge.js';
import { resolveThemeTokensRecursive } from '../../utils/lcards-theme.js';

/**
 * StylePresetManager - Handles style_presets from loaded packs
 *
 * This is separate from ThemeManage.
 * StylePresets are named style bundles that can be applied to overlays.
 *
 * Usage:
 *   stylePresetManager.getPreset('button', 'lozenge')
 *   stylePresetManager.getPreset('select-menu', 'filled')
 *   // Returns: { style: { ... } }
 */
export class StylePresetManager {
  constructor() {
    this.loadedPacks = [];
    this.presetCache = new Map();
    this.initialized = false;

    this.stats = {
      presetsUsed: 0,
      tokensResolved: 0,
      cacheHits: 0
    };
  }

  /**
   * Initialize with pack data
   * @param {Array} packs - Array of pack objects
   */
  async initialize(packs) {
    lcardsLog.debug('[StylePresetManager] 🎨 Initializing with packs:', packs.map(p => p.id));

    this.loadedPacks = packs || [];
    this.presetCache.clear();
    this.initialized = true;

    // Build cache for faster lookups
    this._buildPresetCache();

    lcardsLog.debug('[StylePresetManager] ✅ Initialized with preset cache:', {
      packCount: this.loadedPacks.length,
      cacheSize: this.presetCache.size,
      availableTypes: this._getAvailableOverlayTypes()
    });
  }

  /**
   * Register style presets from a pack
   * Called by PackManager for each pack loaded
   *
   * @param {Object} pack - Pack object with style_presets field
   */
  registerPresetsFromPack(pack) {
    if (!pack.style_presets || typeof pack.style_presets !== 'object') {
      return;
    }

    // Add pack to loaded packs if not already there
    if (!this.loadedPacks.find(p => p.id === pack.id)) {
      this.loadedPacks.push(pack);
    }

    // Rebuild cache to include new presets
    this._buildPresetCache();

    lcardsLog.debug(`[StylePresetManager] Registered presets from pack: ${pack.id}`);
    this.initialized = true;
  }

  /**
   * Get a style preset for a specific overlay type with hierarchical lookup
   * @param {string} overlayType - Type of overlay (e.g., 'button', 'select-menu')
   * @param {string} presetName - Name of the preset (e.g., 'lozenge', 'bullet')
   * @param {Object} themeManager - Optional theme manager for token resolution
   * @returns {Object|null} Preset configuration or null if not found
   */
  getPreset(overlayType, presetName, themeManager = null) {
    if (!this.initialized) {
      lcardsLog.warn('[StylePresetManager] ⚠️ Not initialized - call initialize() first');
      return null;
    }

    // Try multiple lookup strategies in priority order
    const lookupStrategies = [
      // 1. Exact match: overlayType.presetName
      `${overlayType}.${presetName}`,

      // 2. Universal button preset: button.presetName (for button-like overlays)
      ...(this._isButtonLikeOverlay(overlayType) ? [`button.${presetName}`] : [])
    ];

    for (const cacheKey of lookupStrategies) {
      // Check cache first
      if (this.presetCache.has(cacheKey)) {
        const cached = this.presetCache.get(cacheKey);
        lcardsLog.debug(`[StylePresetManager] ✅ Found preset ${presetName} for ${overlayType} (${cacheKey}, cached from pack: ${cached.packId})`);
        return this._resolvePreset(cached.preset, themeManager);
      }

      // Search through packs
      const preset = this._findPresetInPacks(cacheKey);
      if (preset) {
        lcardsLog.debug(`[StylePresetManager] ✅ Found preset ${presetName} for ${overlayType} (${cacheKey}) in pack ${preset.packId}`);
        return this._resolvePreset(preset.preset, themeManager);
      }
    }

    lcardsLog.debug(`[StylePresetManager] ❌ Preset ${presetName} not found for ${overlayType} (tried: ${lookupStrategies.join(', ')})`);
    return null;
  }

  /**
   * Get all available presets for an overlay type (includes universal presets)
   * Filters out 'base' presets which are meant for extension only
   * @param {string} overlayType - Type of overlay
   * @returns {Array} Array of preset names
   */
  getAvailablePresets(overlayType) {
    const presets = new Set();

    // Add direct presets for this overlay type
    for (const pack of this.loadedPacks) {
      if (pack.style_presets && pack.style_presets[overlayType]) {
        Object.keys(pack.style_presets[overlayType]).forEach(name => {
          // Filter out 'base' presets (used for extension only, not direct use)
          if (name !== 'base') {
            presets.add(name);
          }
        });
      }
    }

    // Add universal button presets if this is a button-like overlay
    if (this._isButtonLikeOverlay(overlayType)) {
      for (const pack of this.loadedPacks) {
        if (pack.style_presets && pack.style_presets.button) {
          Object.keys(pack.style_presets.button).forEach(name => {
            // Filter out 'base' presets
            if (name !== 'base') {
              presets.add(name);
            }
          });
        }
      }
    }

    return Array.from(presets);
  }

  /**
   * Get all available overlay types that have presets
   * @returns {Array} Array of overlay type names
   */
  getAvailableOverlayTypes() {
    return this._getAvailableOverlayTypes();
  }

  /**
   * Check if a specific preset exists
   * @param {string} overlayType - Type of overlay
   * @param {string} presetName - Name of the preset
   * @returns {boolean} True if preset exists
   */
  hasPreset(overlayType, presetName) {
    return this.getPreset(overlayType, presetName) !== null;
  }

  /**
   * Get debug information about loaded presets
   * @returns {Object} Debug information
   */
  getDebugInfo() {
    const info = {
      initialized: this.initialized,
      packCount: this.loadedPacks.length,
      cacheSize: this.presetCache.size,
      packDetails: [],
      presetsByType: {},
      universalPresets: {
        button: this._getUniversalButtonPresets()
      }
    };

    // Pack details
    info.packDetails = this.loadedPacks.map(pack => ({
      id: pack.id,
      version: pack.version,
      hasStylePresets: !!pack.style_presets,
      categories: pack.style_presets ? Object.keys(pack.style_presets) : []
    }));

    // Presets by type/category
    for (const category of this._getAvailableOverlayTypes()) {
      info.presetsByType[category] = this.getAvailablePresets(category);
    }

    return info;
  }

  /**
   * Get all preset names for a given type
   * Used by Pack Explorer to list available presets
   * @param {string} type - Preset type ('button', 'slider', etc.)
   * @returns {string[]} Array of preset names
   */
  getPresetNames(type) {
    if (!this.initialized) {
      lcardsLog.warn('[StylePresetManager] Not initialized - call initialize() first');
      return [];
    }
    return this.getAvailablePresets(type);
  }

  /**
   * Get preset metadata for Pack Explorer
   * @param {string} type - Preset type
   * @param {string} name - Preset name
   * @returns {Object} Metadata object with id, type, description, pack source
   */
  getPresetMetadata(type, name) {
    if (!this.initialized) {
      lcardsLog.warn('[StylePresetManager] Not initialized - call initialize() first');
      return null;
    }

    // Find the preset in cache or packs
    const cacheKey = `${type}.${name}`;
    let preset = null;
    let packId = 'unknown';

    if (this.presetCache.has(cacheKey)) {
      const cached = this.presetCache.get(cacheKey);
      preset = cached.preset;
      packId = cached.packId || 'unknown';
    } else {
      // Search through packs
      const found = this._findPresetInPacks(cacheKey);
      if (found) {
        preset = found.preset;
        packId = found.packId || 'unknown';
      }
    }

    if (!preset) {
      return null;
    }

    return {
      id: name,
      type,
      extends: preset.extends,
      description: preset.description || `${name} preset for ${type}`,
      pack: packId,
      presetType: type
    };
  }

  /**
   * Get all presets with their pack source information
   * Used by Pack Explorer to build tree view
   * @returns {Object} Map of overlayType -> [{name, packId, ...}]
   */
  getAllPresetsWithSource() {
    if (!this.initialized) {
      lcardsLog.warn('[StylePresetManager] Not initialized - call initialize() first');
      return {};
    }

    const result = {};

    for (const overlayType of this._getAvailableOverlayTypes()) {
      result[overlayType] = [];
      const presetNames = this.getAvailablePresets(overlayType);

      for (const name of presetNames) {
        const metadata = this.getPresetMetadata(overlayType, name);
        if (metadata) {
          result[overlayType].push(metadata);
        }
      }
    }

    return result;
  }

  /**
   * Clear all cached presets (useful for hot-reloading)
   */
  clearCache() {
    this.presetCache.clear();
    lcardsLog.debug('[StylePresetManager] 🧹 Preset cache cleared');
  }

  destroy() {
    this.clearCache();
  }

  /**
   * Reinitialize with new pack data (useful for hot-reloading)
   * @param {Array} packs - New pack data
   */
  async reinitialize(packs) {
    lcardsLog.debug('[StylePresetManager] 🔄 Reinitializing with new pack data');
    this.clearCache();
    await this.initialize(packs);
  }

  // Private methods

  /**
   * Resolve preset with theme tokens and inheritance
   * @private
   * @param {Object} preset - Raw preset object
   * @param {Object} themeManager - Theme manager for token resolution
   * @returns {Object} Resolved preset
   */
  _resolvePreset(preset, themeManager = null) {
    if (!preset) return null;

    // Handle 'extends' property for inheritance
    if (preset.extends) {
      lcardsLog.debug(`[StylePresetManager] 🔍 Before extends resolution:`, {
        presetPath: preset.extends,
        presetKeys: Object.keys(preset),
        hasBorder: !!preset.border,
        borderKeys: preset.border ? Object.keys(preset.border) : []
      });

      const basePreset = this._resolveExtends(preset.extends, themeManager);
      if (basePreset) {
        lcardsLog.debug(`[StylePresetManager] 🔍 Base preset loaded:`, {
          baseKeys: Object.keys(basePreset),
          hasBorder: !!basePreset.border,
          borderKeys: basePreset.border ? Object.keys(basePreset.border) : [],
          borderWidth: basePreset.border?.width,
          borderRadius: basePreset.border?.radius
        });

        // Remove extends property
        const { extends: _, ...presetWithoutExtends } = preset;

        lcardsLog.debug(`[StylePresetManager] 🔍 Child preset (without extends):`, {
          childKeys: Object.keys(presetWithoutExtends),
          hasBorder: !!presetWithoutExtends.border,
          borderKeys: presetWithoutExtends.border ? Object.keys(presetWithoutExtends.border) : [],
          borderWidth: presetWithoutExtends.border?.width,
          borderRadius: presetWithoutExtends.border?.radius
        });

        // Use immutable deep merge - creates fresh object, no mutations!
        preset = deepMergeImmutable(basePreset, presetWithoutExtends);

        lcardsLog.debug(`[StylePresetManager] 🔍 After merge:`, {
          resultKeys: Object.keys(preset),
          hasBorder: !!preset.border,
          borderKeys: preset.border ? Object.keys(preset.border) : [],
          borderWidth: preset.border?.width,
          borderRadius: preset.border?.radius,
          fullBorder: JSON.stringify(preset.border)
        });
      }
    }

    // Resolve theme tokens if theme manager is available
    if (themeManager) {
      preset = resolveThemeTokensRecursive(preset, themeManager);
    }

    return preset;
  }

  /**
   * Resolve extends property to get base preset
   * @private
   * @param {string} extendsPath - Path like 'button.lozenge'
   * @param {Object} themeManager - Theme manager for token resolution
   * @returns {Object|null} Base preset or null
   */
  _resolveExtends(extendsPath, themeManager) {
    const [category, presetName] = extendsPath.split('.');
    if (!category || !presetName) {
      lcardsLog.warn(`[StylePresetManager] ⚠️ Invalid extends path: ${extendsPath}`);
      return null;
    }

    // Recursive preset lookup (but prevent infinite loops)
    if (this._extendStack && this._extendStack.includes(extendsPath)) {
      lcardsLog.warn(`[StylePresetManager] ⚠️ Circular extends detected: ${extendsPath}`);
      return null;
    }

    this._extendStack = this._extendStack || [];
    this._extendStack.push(extendsPath);

    const basePreset = this._findPresetInPacks(`${category}.${presetName}`);
    // Pass null for themeManager to keep theme tokens unresolved during extends chain
    // The parent _resolvePreset will resolve all tokens after the final merge
    const resolved = basePreset ? this._resolvePreset(basePreset.preset, null) : null;

    this._extendStack.pop();
    if (this._extendStack.length === 0) {
      delete this._extendStack;
    }

    return resolved;
  }

  /**
   * Find preset in loaded packs by cache key
   * @private
   * @param {string} cacheKey - Cache key like 'button.lozenge'
   * @returns {Object|null} Pack and preset info or null
   */
  _findPresetInPacks(cacheKey) {
    const [category, presetName] = cacheKey.split('.');

    for (const pack of this.loadedPacks) {
      if (pack.style_presets &&
          pack.style_presets[category] &&
          pack.style_presets[category][presetName]) {

        const preset = pack.style_presets[category][presetName];

        // Cache the result for future lookups (store the original reference)
        this.presetCache.set(cacheKey, { preset, packId: pack.id });

        return { preset, packId: pack.id };
      }
    }

    return null;
  }

  /**
   * Check if overlay type is button-like (should look for universal button presets)
   * @private
   * @param {string} overlayType - Overlay type
   * @returns {boolean} True if button-like
   */
  _isButtonLikeOverlay(overlayType) {
    const buttonLikeTypes = [
      'button',
      'select-menu'  // select-menu preset is a shortcut applied to embedded lcards-button cards
    ];

    return buttonLikeTypes.includes(overlayType);
  }

  /**
   * Build preset cache for faster lookups
   * @private
   */
  _buildPresetCache() {
    for (const pack of this.loadedPacks) {
      if (!pack.style_presets) continue;

      for (const [category, presets] of Object.entries(pack.style_presets)) {
        for (const [presetName, preset] of Object.entries(presets)) {
          const cacheKey = `${category}.${presetName}`;

          // Store with pack info for debugging
          this.presetCache.set(cacheKey, {
            preset,
            packId: pack.id,
            category,
            presetName
          });
        }
      }
    }

    lcardsLog.debug('[StylePresetManager] 🎨 Built preset cache:', {
      totalPresets: this.presetCache.size,
      universalButtons: this._getUniversalButtonPresets().length,
      overlaySpecific: this._getOverlaySpecificPresets()
    });
  }

  /**
   * Get list of universal button presets for debugging
   * @private
   * @returns {Array} Array of button preset names
   */
  _getUniversalButtonPresets() {
    const buttonPresets = [];
    for (const [key, value] of this.presetCache.entries()) {
      if (key.startsWith('button.')) {
        buttonPresets.push(value.presetName);
      }
    }
    return buttonPresets;
  }

  /**
   * Get overlay-specific preset counts for debugging
   * @private
   * @returns {Object} Object with overlay type counts
   */
  _getOverlaySpecificPresets() {
    const counts = {};
    for (const [key, value] of this.presetCache.entries()) {
      if (!key.startsWith('button.')) {
        counts[value.category] = (counts[value.category] || 0) + 1;
      }
    }
    return counts;
  }

  /**
   * Get all available overlay types that have presets
   * @private
   * @returns {Array} Array of overlay type names
   */
  _getAvailableOverlayTypes() {
    const types = new Set();

    for (const pack of this.loadedPacks) {
      if (pack.style_presets) {
        Object.keys(pack.style_presets).forEach(type => types.add(type));
      }
    }

    return Array.from(types);
  }

  // ========================================
}

// Make StylePresetManager globally accessible for debugging
if (typeof window !== 'undefined') {
  window.StylePresetManager = StylePresetManager;
}