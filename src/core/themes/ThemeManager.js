/**
 * @fileoverview ThemeManager - Central theme system management
 *
 * Replaces DefaultsManager and ProfileResolver with unified theme-based defaults.
 * All component defaults come from active theme's component tokens.
 *
 * Features:
 * - Load themes from packs
 * - Activate/switch themes at runtime
 * - Provide component defaults via token resolution
 * - Replace DefaultsManager.getDefault() API
 * - Replace ProfileResolver style layering
 *
 * @module msd/themes/ThemeManager
 */

import { ThemeTokenResolver, initializeTokenResolver, getTokenResolver } from './ThemeTokenResolver.js';
import { lcardsLog } from '../../utils/lcards-logging.js';
import { BaseService } from '../../core/BaseService.js';
import { setAlertMode as injectAlertMode, ALERT_MODE_TRANSFORMS } from './paletteInjector.js';

/**
 * Built-in filter presets for base SVG
 * These provide common filter combinations for visual hierarchy
 */
export const BUILTIN_FILTER_PRESETS = {
  // No filters - clear/remove all filtering
  none: {},

  // Subtle backdrop - overlays visible but not overpowering
  dimmed: {
    opacity: 0.5,
    brightness: 0.8
  },

  // Very subtle - gentle de-emphasis
  subtle: {
    opacity: 0.6,
    blur: '1px',
    grayscale: 0.2
  },

  // Heavy dimming - makes overlays really pop
  backdrop: {
    opacity: 0.3,
    blur: '3px',
    brightness: 0.6
  },

  // Washed out look
  faded: {
    opacity: 0.4,
    grayscale: 0.5,
    contrast: 0.7
  },

  // Alert mode - bright with red tint
  'red-alert': {
    opacity: 1.0,
    brightness: 1.2,
    hue_rotate: 10
  },

  // Full grayscale for minimal distraction
  monochrome: {
    opacity: 0.6,
    grayscale: 1.0,
    contrast: 0.8
  }
};

/**
 * ThemeManager - Central theme system coordinator
 *
 * Manages theme loading, activation, and provides unified access to component defaults.
 * Replaces the deprecated DefaultsManager and ProfileResolver systems.
 */
export class ThemeManager extends BaseService {
  constructor() {
    super();
    /** @type {Map<string, Object>} Theme ID -> Theme object */
    this.themes = new Map();

    /** @type {string|null} Active theme ID */
    this.activeThemeId = null;

    /** @type {Object|null} Active theme object */
    this.activeTheme = null;

    /** @type {ThemeTokenResolver|null} Token resolver instance */
    this.resolver = null;

    /** @type {boolean} Initialization state */
    this.initialized = false;

    // Alert mode tracking
    this.currentAlertMode = 'green_alert';
  }

  /**
   * Initialize theme system from packs
   *
   * @param {Array<Object>} packs - Loaded pack objects
   * @param {string} [requestedThemeId='lcars-classic'] - Theme ID to activate
   * @param {Element} [rootElement=null] - Root element for CSS variables
   * @returns {Promise<void>}
   */
  async initialize(packs, requestedThemeId = 'lcars-classic', rootElement = null) {
    lcardsLog.debug('[ThemeManager] 🎨 Initializing theme system');

    // Load all themes from packs
    this.themes.clear();
    packs.forEach(pack => {
      if (pack.themes && typeof pack.themes === 'object') {
        Object.entries(pack.themes).forEach(([themeId, theme]) => {
          this.themes.set(themeId, {
            ...theme,
            packId: pack.id
          });
          lcardsLog.debug(`[ThemeManager] Loaded theme: ${themeId} from pack: ${pack.id}`);
        });
      }
    });

    if (this.themes.size === 0) {
      lcardsLog.warn('[ThemeManager] No themes found in packs - using fallback');
    }

    // Find default theme from packs
    const packWithDefault = packs.find(pack => pack.defaultTheme);
    const fallbackThemeId = packWithDefault?.defaultTheme || 'lcars-classic';

    // Activate requested theme (or fallback)
    const themeToActivate = requestedThemeId || fallbackThemeId;
    await this.activateTheme(themeToActivate, rootElement);

    this.initialized = true;

    lcardsLog.info('[ThemeManager] ✅ Theme system initialized:', {
      themeCount: this.themes.size,
      activeTheme: this.activeThemeId,
      availableThemes: Array.from(this.themes.keys())
    });
  }

  /**
   * Activate a specific theme
   *
   * @param {string} themeId - Theme ID to activate
   * @param {Element} [rootElement=null] - Root element for CSS variables
   * @returns {Promise<void>}
   * @throws {Error} If theme not found or has no tokens
   */
  async activateTheme(themeId, rootElement = null) {
    const theme = this.themes.get(themeId);

    if (!theme) {
      lcardsLog.error('[ThemeManager] Theme not found:', themeId);
      throw new Error(`Theme not found: ${themeId}`);
    }

    if (!theme.tokens) {
      lcardsLog.error('[ThemeManager] Theme has no tokens:', themeId);
      throw new Error(`Theme has no tokens: ${themeId}`);
    }

    // Initialize token resolver with theme tokens
    initializeTokenResolver(theme.tokens, rootElement);
    this.resolver = getTokenResolver();

    // Clear resolver cache on theme change
    if (this.activeThemeId && this.activeThemeId !== themeId) {
      this.resolver.clearCache();
    }

    // Load theme CSS file if specified
    if (theme.cssFile) {
      this._loadThemeCss(theme.cssFile, themeId);
    }

    this.activeThemeId = themeId;
    this.activeTheme = theme;

    lcardsLog.info('[ThemeManager] ✅ Theme activated:', {
      id: themeId,
      name: theme.name,
      description: theme.description,
      tokenCount: this._countTokens(theme.tokens)
    });
  }

  /**
   * Get default value for a component property
   *
   * **Replaces:** DefaultsManager.getDefault()
   *
   * @param {string} componentType - Component type (e.g., 'text', 'statusGrid')
   * @param {string} property - Property name (e.g., 'defaultSize', 'defaultColor')
   * @param {*} [fallback=null] - Fallback value if token not found
   * @param {Object} [context={}] - Resolution context (viewBox, etc.)
   * @returns {*} Resolved value
   *
   * @example
   * // Get text component default font size
   * const fontSize = themeManager.getDefault('text', 'defaultSize');
   * // Returns: 14 (from theme's components.text.defaultSize token)
   *
   * @example
   * // Get status grid default cell color
   * const cellColor = themeManager.getDefault('statusGrid', 'defaultCellColor');
   * // Returns: 'var(--lcars-orange, #FF9900)' (resolved from token path)
   */
  getDefault(componentType, property, fallback = null, context = {}) {
    if (!this.resolver) {
      lcardsLog.warn('[ThemeManager] No resolver available - theme not initialized');
      return fallback;
    }

    const tokenPath = `components.${componentType}.${property}`;
    return this.resolver.resolve(tokenPath, fallback, context);
  }

  /**
   * Get component-scoped resolver function
   *
   * Returns a function that automatically prefixes token paths with component name.
   *
   * @param {string} componentType - Component type (e.g., 'statusGrid', 'overlayRenderer')
   * @returns {Function} Scoped resolver function
   * @throws {Error} If ThemeManager not initialized
   *
   * @example
   * const statusGridResolver = themeManager.getComponentResolver('statusGrid');
   * const cellColor = statusGridResolver('defaultCellColor', '#FF9900');
   * // Resolves: components.statusGrid.defaultCellColor
   */
  getComponentResolver(componentType) {
    if (!this.resolver) {
      throw new Error('ThemeManager not initialized - call initialize() first');
    }

    return (property, fallback = null, context = {}) => {
      const tokenPath = `components.${componentType}.${property}`;
      return this.resolver.resolve(tokenPath, fallback, context);
    };
  }

  /**
   * Get a theme token by path (for StylePresetManager integration)
   *
   * @param {string} tokenPath - Token path (e.g., 'colors.accent.primary')
   * @param {*} fallback - Fallback value if token not found
   * @param {Object} context - Additional context for resolution
   * @returns {*} Resolved token value or fallback
   *
   * @example
   * const primaryColor = themeManager.getToken('colors.accent.primary');
   * const textSize = themeManager.getToken('typography.fontSize.base', '16px');
   */
  getToken(tokenPath, fallback = undefined, context = {}) {
    if (!this.resolver) {
      lcardsLog.warn('[ThemeManager] No resolver available - theme not initialized');
      return fallback;
    }

    return this.resolver.resolve(tokenPath, fallback, context);
  }  /**
   * Get token resolver for direct token path resolution
   *
   * For advanced usage where you need direct access to the token resolver.
   *
   * @returns {ThemeTokenResolver} Token resolver instance
   * @throws {Error} If ThemeManager not initialized
   *
   * @example
   * const resolver = themeManager.getResolver();
   * const color = resolver.resolve('colors.accent.primary');
   */
  getResolver() {
    if (!this.resolver) {
      throw new Error('ThemeManager not initialized - call initialize() first');
    }
    return this.resolver;
  }

  /**
   * Get active theme information
   *
   * @returns {Object|null} Active theme info or null if not initialized
   *
   * @example
   * const theme = themeManager.getActiveTheme();
   * console.log(theme.name); // "LCARS Classic"
   * console.log(theme.tokens.components.chart); // {strokeColor: '...', ...}
   */
  getActiveTheme() {
    if (!this.activeTheme) {
      return null;
    }

    return {
      id: this.activeThemeId,
      name: this.activeTheme.name,
      description: this.activeTheme.description,
      packId: this.activeTheme.packId,
      tokens: this.activeTheme.tokens,  // ✅ NEW: Include actual tokens
      // ✅ NEW: Also include flattened token structure for direct access
      ...this.activeTheme.tokens  // This spreads colors, typography, components, etc. to top level
    };
  }

  /**
   * List all available theme IDs
   *
   * @returns {Array<string>} Array of theme IDs
   *
   * @example
   * const themes = themeManager.listThemes();
   * // Returns: ['lcars-classic', 'lcars-ds9', 'lcars-voyager']
   */
  listThemes() {
    return Array.from(this.themes.keys());
  }

  /**
   * Get detailed theme information
   *
   * @param {string} themeId - Theme ID
   * @returns {Object|null} Theme details or null if not found
   *
   * @example
   * const themeInfo = themeManager.getTheme('lcars-classic');
   * console.log(themeInfo.name); // "LCARS Classic"
   * console.log(themeInfo.packId); // "builtin_themes"
   */
  getTheme(themeId) {
    const theme = this.themes.get(themeId);
    return theme ? {
      id: themeId,
      name: theme.name,
      description: theme.description,
      packId: theme.packId,
      hasCssFile: !!theme.cssFile
    } : null;
  }

  /**
   * Load theme CSS file into document
   *
   * @private
   * @param {string} cssFile - CSS filename
   * @param {string} themeId - Theme identifier
   */
  _loadThemeCss(cssFile, themeId) {
    try {
      // Check if already loaded
      const existingLink = document.querySelector(`link[data-theme-id="${themeId}"]`);
      if (existingLink) {
        lcardsLog.debug('[ThemeManager] Theme CSS already loaded:', themeId);
        return;
      }

      // Create link element
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `/local/cb-lcars/themes/${cssFile}`;
      link.setAttribute('data-theme-id', themeId);

      document.head.appendChild(link);

      lcardsLog.debug('[ThemeManager] Loaded theme CSS:', cssFile);
    } catch (error) {
      lcardsLog.warn('[ThemeManager] Failed to load theme CSS:', cssFile, error);
    }
  }

  /**
   * Count total tokens in theme
   *
   * @private
   * @param {Object} tokens - Token object
   * @returns {number} Total token count
   */
  _countTokens(tokens) {
    let count = 0;

    function countRecursive(obj) {
      for (const key in obj) {
        if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
          countRecursive(obj[key]);
        } else {
          count++;
        }
      }
    }

    countRecursive(tokens);
    return count;
  }

  /**
   * Get debug information
   *
   * @returns {Object} Debug info including themes, active theme, and cache stats
   */
  getDebugInfo() {
    return {
      initialized: this.initialized,
      activeTheme: this.getActiveTheme(),
      availableThemes: this.listThemes().map(id => this.getTheme(id)),
      resolverCacheSize: this.resolver?.resolutionCache?.size || 0,
      themeCount: this.themes.size
    };
  }

  /**
   * Clear all caches
   *
   * Useful for development/hot-reload scenarios.
   */
  clearCache() {
    if (this.resolver) {
      this.resolver.clearCache();
      lcardsLog.debug('[ThemeManager] Resolver cache cleared');
    }
  }

  /**
   * Get a filter preset by name
   *
   * Checks both built-in presets and theme-defined presets.
   * Theme presets override built-in presets with the same name.
   *
   * @param {string} presetName - Name of the filter preset
   * @returns {Object|null} Filter object or null if not found
   *
   * @example
   * const filters = themeManager.getFilterPreset('dimmed');
   * // Returns: { opacity: 0.5, brightness: 0.8 }
   */
  getFilterPreset(presetName) {
    // Check theme-defined presets first (allows themes to override built-ins)
    if (this.activeTheme?.filter_presets?.[presetName]) {
      return this.activeTheme.filter_presets[presetName];
    }

    // Fall back to built-in presets
    return BUILTIN_FILTER_PRESETS[presetName] || null;
  }

  /**
   * List all available filter preset names
   *
   * @returns {Array<string>} Array of preset names
   *
   * @example
   * const presets = themeManager.listFilterPresets();
   * // Returns: ['dimmed', 'subtle', 'backdrop', 'faded', 'red-alert', 'monochrome', ...]
   */
  listFilterPresets() {
    const builtinPresets = Object.keys(BUILTIN_FILTER_PRESETS);
    const themePresets = this.activeTheme?.filter_presets
      ? Object.keys(this.activeTheme.filter_presets)
      : [];

    // Combine and deduplicate (theme presets take precedence)
    return [...new Set([...builtinPresets, ...themePresets])];
  }

  /**
   * Track theme token resolution (for provenance tracking)
   *
   * Records token resolution chains for debugging and troubleshooting.
   * Called by cards when they resolve theme tokens through getToken() or getDefault().
   *
   * @param {string} tokenPath - Token path (e.g., 'colors.accent.primary')
   * @param {string} originalRef - Original reference (e.g., 'theme:colors.accent.primary')
   * @param {any} resolvedValue - Final resolved value
   * @param {Array<Object>} resolutionChain - Resolution steps
   * @param {Object} cardTracker - Card's ProvenanceTracker instance
   * @param {string[]} usedByFields - Fields using this token
   *
   * @example
   * themeManager.trackTokenResolution(
   *   'colors.accent.primary',
   *   'theme:colors.accent.primary',
   *   '#ff9966',
   *   [{ step: 'token_lookup', value: '#ff9966', source: 'theme.tokens' }],
   *   card._provenanceTracker,
   *   ['style.background']
   * );
   */
  trackTokenResolution(tokenPath, originalRef, resolvedValue, resolutionChain = [], cardTracker = null, usedByFields = []) {
    if (!cardTracker) {
      lcardsLog.trace('[ThemeManager] No card tracker provided for token resolution tracking');
      return;
    }

    // Build resolution chain if not provided
    if (resolutionChain.length === 0) {
      resolutionChain = [{
        step: 'token_lookup',
        value: resolvedValue,
        source: 'theme.tokens'
      }];
    }

    // Track in card's provenance tracker
    cardTracker.trackThemeToken(tokenPath, originalRef, resolvedValue, resolutionChain, usedByFields);

    lcardsLog.trace(`[ThemeManager] Tracked token resolution: ${tokenPath}`, {
      resolvedValue,
      usedByFields
    });
  }

  /**
   * Set alert mode
   * 
   * @param {string} mode - Alert mode ('red_alert', 'blue_alert', etc.)
   * @returns {Promise<void>}
   */
  async setAlertMode(mode) {
    if (!ALERT_MODE_TRANSFORMS[mode]) {
      lcardsLog.warn(`[ThemeManager] Unknown alert mode: ${mode}`);
      return;
    }
    
    // Get HASS instance
    const hass = this._hass || window.lcards?.core?._currentHass;
    if (!hass) {
      lcardsLog.error('[ThemeManager] Cannot set alert mode - HASS not available');
      return;
    }
    
    // Apply alert mode
    await injectAlertMode(mode, hass);
    
    // Update state
    this.currentAlertMode = mode;
    
    // Clear token cache (colors have changed)
    if (this.resolver) {
      this.resolver.clearCache();
    }
    
    // Notify subscribers
    this._notifyThemeChange('alert_mode', { mode });
    
    lcardsLog.info(`[ThemeManager] ✅ Alert mode: ${mode}`);
  }

  /**
   * Get current alert mode
   * @returns {string}
   */
  getAlertMode() {
    return this.currentAlertMode;
  }

  /**
   * Destroy theme manager and clean up resources
   */
  destroy() {
    this.themes.clear();
    this.activeThemeId = null;
    this.activeTheme = null;
    this.resolver = null;
    this.initialized = false;

    lcardsLog.debug('[ThemeManager] Destroyed');
  }
}

// Make globally accessible for debugging
if (typeof window !== 'undefined') {
  window.ThemeManager = ThemeManager;
}