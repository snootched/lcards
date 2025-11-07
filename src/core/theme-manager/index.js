/**
 * @fileoverview CoreThemeManager - Central theme system management for LCARdS core infrastructure
 *
 * Extracted from MSD ThemeManager to provide shared theme capabilities across all card types.
 * Manages theme loading, activation, and provides unified access to component defaults.
 *
 * Features:
 * - Load themes from packs
 * - Activate/switch themes at runtime
 * - Provide component defaults via token resolution
 * - Cross-card theme coordination
 * - Filter preset management
 *
 * @module core/theme-manager
 */

import { lcardsLog } from '../../utils/lcards-logging.js';

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
 * Lightweight token resolver for core theme system
 * Simplified version that doesn't need all the MSD-specific features
 */
class CoreTokenResolver {
  constructor(tokens, rootElement = null) {
    this.tokens = tokens || {};
    this.rootElement = rootElement || (typeof document !== 'undefined' ? document.documentElement : null);
    this.resolutionCache = new Map();
  }

  /**
   * Resolve token path to value
   * @param {string} path - Token path (e.g., 'colors.accent.primary')
   * @param {*} fallback - Fallback value if not found
   * @param {Object} context - Resolution context
   * @returns {*} Resolved value
   */
  resolve(path, fallback = null, context = {}) {
    const cacheKey = `${path}:${JSON.stringify(context)}`;

    if (this.resolutionCache.has(cacheKey)) {
      return this.resolutionCache.get(cacheKey);
    }

    const value = this._resolvePath(path, this.tokens) ?? fallback;
    this.resolutionCache.set(cacheKey, value);
    return value;
  }

  /**
   * Resolve nested path in token object
   * @private
   */
  _resolvePath(path, obj) {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }

    return current;
  }

  /**
   * Clear resolution cache
   */
  clearCache() {
    this.resolutionCache.clear();
  }
}

/**
 * CoreThemeManager - Central theme system coordinator for shared core infrastructure
 *
 * Manages theme loading, activation, and provides unified access to component defaults
 * across all LCARdS card types (MSD, standalone overlays, etc.)
 */
export class CoreThemeManager {
  constructor() {
    /** @type {Map<string, Object>} Theme ID -> Theme object */
    this.themes = new Map();

    /** @type {string|null} Active theme ID */
    this.activeThemeId = null;

    /** @type {Object|null} Active theme object */
    this.activeTheme = null;

    /** @type {CoreTokenResolver|null} Token resolver instance */
    this.resolver = null;

    /** @type {boolean} Initialization state */
    this.initialized = false;

    lcardsLog.debug('[CoreThemeManager] 🎨 Core theme manager created');
  }

  /**
   * Initialize theme system
   * Can be called with packs (full initialization) or without (lightweight)
   *
   * @param {Array<Object>|null} packs - Loaded pack objects (optional for lightweight init)
   * @param {string} requestedThemeId - Theme ID to activate
   * @param {Element} rootElement - Root element for CSS variables
   * @returns {Promise<void>}
   */
  async initialize(packs = null, requestedThemeId = 'lcars-classic', rootElement = null) {
    lcardsLog.debug('[CoreThemeManager] 🚀 Initializing core theme system');

    if (packs && Array.isArray(packs)) {
      // Full initialization with packs
      this._loadThemesFromPacks(packs);
    } else {
      // Lightweight initialization - create minimal default theme
      this._createDefaultTheme();
    }

    // Activate theme
    const themeToActivate = this.themes.has(requestedThemeId) ? requestedThemeId : 'lcars-classic';
    await this.activateTheme(themeToActivate, rootElement);

    this.initialized = true;

    lcardsLog.info('[CoreThemeManager] ✅ Core theme system initialized:', {
      themeCount: this.themes.size,
      activeTheme: this.activeThemeId,
      availableThemes: Array.from(this.themes.keys())
    });
  }

  /**
   * Load themes from packs
   * @private
   */
  _loadThemesFromPacks(packs) {
    this.themes.clear();

    packs.forEach(pack => {
      if (pack.themes && typeof pack.themes === 'object') {
        Object.entries(pack.themes).forEach(([themeId, theme]) => {
          this.themes.set(themeId, {
            ...theme,
            packId: pack.id
          });
          lcardsLog.debug(`[CoreThemeManager] Loaded theme: ${themeId} from pack: ${pack.id}`);
        });
      }
    });

    if (this.themes.size === 0) {
      lcardsLog.warn('[CoreThemeManager] No themes found in packs - creating default');
      this._createDefaultTheme();
    }
  }

  /**
   * Create minimal default theme for lightweight operation
   * @private
   */
  _createDefaultTheme() {
    const defaultTheme = {
      name: 'LCARS Classic (Core)',
      description: 'Minimal default theme for core infrastructure',
      packId: 'core-builtin',
      tokens: {
        colors: {
          accent: {
            primary: '#FF9900',
            secondary: '#9999FF'
          },
          background: {
            primary: '#000000',
            secondary: '#1a1a1a'
          },
          text: {
            primary: '#FFFFFF',
            secondary: '#CCCCCC'
          }
        },
        typography: {
          fontSize: {
            base: '14px',
            small: '12px',
            large: '16px'
          }
        },
        components: {
          text: {
            defaultSize: 14,
            defaultColor: '#FFFFFF'
          },
          button: {
            defaultColor: '#FF9900',
            defaultSize: 'medium'
          }
        }
      }
    };

    this.themes.set('lcars-classic', defaultTheme);
    lcardsLog.debug('[CoreThemeManager] Created default theme');
  }

  /**
   * Activate a specific theme
   * @param {string} themeId - Theme ID to activate
   * @param {Element} rootElement - Root element for CSS variables
   * @returns {Promise<void>}
   */
  async activateTheme(themeId, rootElement = null) {
    const theme = this.themes.get(themeId);

    if (!theme) {
      lcardsLog.error('[CoreThemeManager] Theme not found:', themeId);
      throw new Error(`Theme not found: ${themeId}`);
    }

    if (!theme.tokens) {
      lcardsLog.error('[CoreThemeManager] Theme has no tokens:', themeId);
      throw new Error(`Theme has no tokens: ${themeId}`);
    }

    // Create token resolver
    this.resolver = new CoreTokenResolver(theme.tokens, rootElement);

    this.activeThemeId = themeId;
    this.activeTheme = theme;

    lcardsLog.info('[CoreThemeManager] ✅ Theme activated:', {
      id: themeId,
      name: theme.name,
      description: theme.description,
      tokenCount: this._countTokens(theme.tokens)
    });
  }

  /**
   * Get default value for a component property
   * @param {string} componentType - Component type (e.g., 'text', 'button')
   * @param {string} property - Property name (e.g., 'defaultSize', 'defaultColor')
   * @param {*} fallback - Fallback value if token not found
   * @param {Object} context - Resolution context
   * @returns {*} Resolved value
   */
  getDefault(componentType, property, fallback = null, context = {}) {
    if (!this.resolver) {
      lcardsLog.warn('[CoreThemeManager] No resolver available - theme not initialized');
      return fallback;
    }

    const tokenPath = `components.${componentType}.${property}`;
    return this.resolver.resolve(tokenPath, fallback, context);
  }

  /**
   * Get theme token by path
   * @param {string} tokenPath - Token path (e.g., 'colors.accent.primary')
   * @param {*} fallback - Fallback value if not found
   * @param {Object} context - Resolution context
   * @returns {*} Resolved token value
   */
  getToken(tokenPath, fallback = undefined, context = {}) {
    if (!this.resolver) {
      lcardsLog.warn('[CoreThemeManager] No resolver available - theme not initialized');
      return fallback;
    }

    return this.resolver.resolve(tokenPath, fallback, context);
  }

  /**
   * Get component-scoped resolver function
   * @param {string} componentType - Component type
   * @returns {Function} Scoped resolver function
   */
  getComponentResolver(componentType) {
    if (!this.resolver) {
      throw new Error('CoreThemeManager not initialized - call initialize() first');
    }

    return (property, fallback = null, context = {}) => {
      const tokenPath = `components.${componentType}.${property}`;
      return this.resolver.resolve(tokenPath, fallback, context);
    };
  }

  /**
   * Get active theme information
   * @returns {Object|null} Active theme info
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
      tokens: this.activeTheme.tokens
    };
  }

  /**
   * List all available theme IDs
   * @returns {Array<string>} Array of theme IDs
   */
  listThemes() {
    return Array.from(this.themes.keys());
  }

  /**
   * Get filter preset by name
   * @param {string} presetName - Name of the filter preset
   * @returns {Object|null} Filter object or null if not found
   */
  getFilterPreset(presetName) {
    // Check theme-defined presets first
    if (this.activeTheme?.filter_presets?.[presetName]) {
      return this.activeTheme.filter_presets[presetName];
    }

    // Fall back to built-in presets
    return BUILTIN_FILTER_PRESETS[presetName] || null;
  }

  /**
   * List all available filter preset names
   * @returns {Array<string>} Array of preset names
   */
  listFilterPresets() {
    const builtinPresets = Object.keys(BUILTIN_FILTER_PRESETS);
    const themePresets = this.activeTheme?.filter_presets
      ? Object.keys(this.activeTheme.filter_presets)
      : [];

    return [...new Set([...builtinPresets, ...themePresets])];
  }

  /**
   * Count total tokens in theme
   * @private
   */
  _countTokens(tokens) {
    let count = 0;
    const countRecursive = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
          countRecursive(obj[key]);
        } else {
          count++;
        }
      }
    };
    countRecursive(tokens);
    return count;
  }

  /**
   * Get debug information
   * @returns {Object} Debug info
   */
  getDebugInfo() {
    return {
      initialized: this.initialized,
      activeTheme: this.getActiveTheme(),
      availableThemes: this.listThemes(),
      resolverCacheSize: this.resolver?.resolutionCache?.size || 0,
      themeCount: this.themes.size
    };
  }

  /**
   * Update HASS instance (for consistency with other core managers)
   * @param {Object} hass - Home Assistant instance
   */
  updateHass(hass) {
    // Theme manager doesn't need HASS, but keep for API consistency
    lcardsLog.debug('[CoreThemeManager] 🔄 HASS updated (no-op for themes)');
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

    lcardsLog.debug('[CoreThemeManager] Destroyed');
  }
}