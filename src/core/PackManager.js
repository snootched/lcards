/**
 * PackManager - Central Pack Registration System
 *
 * Manages loading and registration of builtin and external packs.
 * Packs contain only: style_presets, animations, rules, and themes.
 *
 * Obsolete fields (overlays, anchors, routing, palettes, profiles) are
 * deprecated and will be ignored with a warning.
 *
 * @module core/PackManager
 */

import { loadBuiltinPacks } from './packs/loadBuiltinPacks.js';
import { lcardsLog } from '../utils/lcards-logging.js';

/**
 * PackManager - Centralized pack loading and registration
 *
 * Coordinates pack loading and registers pack contents to appropriate
 * core singleton managers (StylePresetManager, AnimationRegistry, etc.)
 */
export class PackManager {
  constructor(core) {
    this.core = core;
    this.loadedPacks = new Map();
  }

  /**
   * Load and register builtin packs
   * This is the ONLY place in the codebase that calls loadBuiltinPacks()
   * 
   * @param {Array<string>} packIds - Pack IDs to load (default: all core packs)
   */
  async loadBuiltinPacks(packIds = ['core', 'lcards_buttons', 'lcards_sliders', 'lcars_fx', 'builtin_themes']) {
    lcardsLog.debug('[PackManager] Loading builtin packs:', packIds);

    const packs = loadBuiltinPacks(packIds);

    if (!packs || packs.length === 0) {
      lcardsLog.error('[PackManager] No packs loaded!');
      throw new Error('Failed to load builtin packs');
    }

    for (const pack of packs) {
      if (!pack) continue;
      await this.registerPack(pack);
    }

    lcardsLog.info('[PackManager] ✅ Loaded and registered builtin packs:', packIds);
  }

  /**
   * Register pack contents to core managers
   * Distributes pack data to ThemeManager, StylePresetManager, RulesEngine, etc.
   * 
   * @param {Object} pack - Pack object with style_presets, animations, rules, themes, svg_assets
   */
  async registerPack(pack) {
    if (!pack || !pack.id) {
      lcardsLog.warn('[PackManager] Invalid pack object - missing id');
      return;
    }

    lcardsLog.debug(`[PackManager] Registering pack: ${pack.id}`);

    // Check for deprecated fields and warn
    const deprecatedFields = ['overlays', 'anchors', 'routing', 'palettes', 'profiles'];
    const foundDeprecated = deprecatedFields.filter(field => pack[field]);

    if (foundDeprecated.length > 0) {
      lcardsLog.warn(
        `[PackManager] Pack '${pack.id}' contains deprecated fields: ${foundDeprecated.join(', ')}. ` +
        `These fields are ignored. Move custom styles to 'style_presets' and colors to 'themes'.`
      );
    }

    // ✅ 1. Register themes to ThemeManager
    if (pack.themes && this.core.themeManager) {
      this.core.themeManager.registerThemesFromPack(pack);
    }

    // ✅ 2. Register style presets to StylePresetManager
    if (pack.style_presets && this.core.stylePresetManager) {
      this.core.stylePresetManager.registerPresetsFromPack(pack);
    }

    // ✅ 3. Register rules to RulesEngine
    if (pack.rules && Array.isArray(pack.rules) && this.core.rulesManager) {
      pack.rules.forEach(rule => {
        if (rule.id) {
          this.core.rulesManager.rules.push(rule);
          this.core.rulesManager.rulesById.set(rule.id, rule);
        }
      });
      
      if (pack.rules.length > 0) {
        this.core.rulesManager.buildDependencyIndex();
        this.core.rulesManager.markAllDirty();
        lcardsLog.debug(`[PackManager] Registered ${pack.rules.length} rules from pack: ${pack.id}`);
      }
    }

    // ✅ 4. Register assets to AssetManager
    if ((pack.svg_assets || pack.font_assets || pack.audio_assets) && this.core.assetManager) {
      await this.core.assetManager.preloadFromPack(pack);
    }

    // ✅ 5. Animations - AnimationRegistry is a cache, no registration needed
    // Animation definitions in packs are used on-demand via getOrCreateInstance()

    // Store pack reference
    this.loadedPacks.set(pack.id, {
      id: pack.id,
      version: pack.version,
      description: pack.description,
      registeredAt: Date.now()
    });

    lcardsLog.debug(`[PackManager] ✅ Pack registered: ${pack.id}`);
  }

  /**
   * Get loaded pack by ID
   * @param {string} packId - Pack ID
   * @returns {Object|undefined} Pack metadata
   */
  getPack(packId) {
    return this.loadedPacks.get(packId);
  }

  /**
   * Get all loaded pack IDs
   * @returns {Array<string>} Array of pack IDs
   */
  getLoadedPackIds() {
    return Array.from(this.loadedPacks.keys());
  }

  /**
   * Get debug information
   * @returns {Object} Debug info
   */
  getDebugInfo() {
    return {
      loadedPacks: Array.from(this.loadedPacks.values()),
      packCount: this.loadedPacks.size
    };
  }

  /**
   * Get all loaded packs with detailed content summary
   * Used by Pack Explorer to list available packs
   * @returns {Array<Object>} Array of pack metadata with content counts
   */
  getLoadedPacks() {
    const packs = [];

    this.loadedPacks.forEach((packMeta, packId) => {
      // Get content counts from each manager
      const themeCount = this.core.themeManager?.getThemesByPack(packId).length || 0;
      
      // For presets, we need to count across all overlay types
      let presetCount = 0;
      if (this.core.stylePresetManager) {
        const allPresets = this.core.stylePresetManager.getAllPresetsWithSource();
        Object.values(allPresets).forEach(typePresets => {
          presetCount += typePresets.filter(p => p.pack === packId).length;
        });
      }

      packs.push({
        ...packMeta,
        themeCount,
        presetCount,
        // TODO: Add rule count, asset count when available
        ruleCount: 0,
        assetCount: 0
      });
    });

    return packs;
  }

  /**
   * Get pack metadata by ID
   * Used by Pack Explorer to show pack details
   * @param {string} packId - Pack ID
   * @returns {Object|null} Pack metadata with content breakdown
   */
  getPackMetadata(packId) {
    const packMeta = this.loadedPacks.get(packId);
    if (!packMeta) {
      return null;
    }

    // Get detailed content breakdown
    const themes = this.core.themeManager?.getThemesByPack(packId) || [];
    
    const presets = {};
    if (this.core.stylePresetManager) {
      const allPresets = this.core.stylePresetManager.getAllPresetsWithSource();
      Object.entries(allPresets).forEach(([type, typePresets]) => {
        const packPresets = typePresets.filter(p => p.pack === packId);
        if (packPresets.length > 0) {
          presets[type] = packPresets;
        }
      });
    }

    return {
      ...packMeta,
      themes,
      presets,
      // TODO: Add rules, assets when available
      rules: [],
      assets: {}
    };
  }

  /**
   * Get aggregate statistics across all packs
   * Used by Pack Explorer summary view
   * @returns {Object} Pack statistics
   */
  getPackStatistics() {
    const packs = this.getLoadedPacks();
    
    return {
      totalPacks: packs.length,
      totalThemes: packs.reduce((sum, p) => sum + p.themeCount, 0),
      totalPresets: packs.reduce((sum, p) => sum + p.presetCount, 0),
      totalRules: packs.reduce((sum, p) => sum + p.ruleCount, 0),
      totalAssets: packs.reduce((sum, p) => sum + p.assetCount, 0)
    };
  }
}
