/**
 * @fileoverview CoreConfigManager - Unified configuration processing facade
 *
 * Orchestrates existing systems (mergePacks, CoreValidationService, StylePresetManager,
 * ThemeManager) to provide card-type-agnostic config processing with validation,
 * merging, and provenance tracking.
 *
 * KEY PRINCIPLE: Card defaults are BEHAVIORAL only (show/hide, enable/disable).
 *                Style defaults come from Theme + Presets.
 *
 * @module core/config-manager
 */

import { lcardsLog } from '../../utils/lcards-logging.js';
import { mergePacks } from '../packs/mergePacks.js';
import { deepMerge, trackFieldSources } from './merge-helpers.js';

/**
 * CoreConfigManager - Unified configuration processing
 *
 * Four-layer merge hierarchy:
 * 1. Card Defaults (behavioral: show_label, enable_hold_action)
 * 2. Theme Defaults (component style base from ThemeManager)
 * 3. Preset (named style config from StylePresetManager)
 * 4. User Config (explicit overrides)
 * 5. Rules Patches (runtime only - highest priority)
 */
export class CoreConfigManager {
  constructor() {
    // Dependencies (injected during initialization)
    this.validationService = null;
    this.themeManager = null;
    this.stylePresetManager = null;

    // Card-specific configuration registries
    this._cardSchemas = new Map();      // Schema definitions for validation
    this._cardDefaults = new Map();     // BEHAVIORAL defaults only

    // State
    this.initialized = false;

    // Statistics
    this.stats = {
      configurationsProcessed: 0,
      validationErrors: 0,
      presetsResolved: 0,
      tokensResolved: 0
    };
  }

  /**
   * Initialize CoreConfigManager with singleton dependencies
   * @param {Object} singletons - Required singleton instances
   * @param {Object} singletons.validationService - CoreValidationService instance
   * @param {Object} singletons.themeManager - ThemeManager instance
   * @param {Object} singletons.stylePresetManager - StylePresetManager instance
   */
  async initialize(singletons) {
    if (this.initialized) {
      lcardsLog.warn('[CoreConfigManager] Already initialized');
      return;
    }

    lcardsLog.debug('[CoreConfigManager] Initializing...');

    // Store dependencies
    this.validationService = singletons.validationService;
    this.themeManager = singletons.themeManager;
    this.stylePresetManager = singletons.stylePresetManager;

    // Validate dependencies
    if (!this.validationService) {
      throw new Error('CoreConfigManager requires validationService');
    }
    if (!this.themeManager) {
      lcardsLog.debug('[CoreConfigManager] ThemeManager not available during init (will be added later)');
    }
    if (!this.stylePresetManager) {
      lcardsLog.debug('[CoreConfigManager] StylePresetManager not available during init (will be added later)');
    }

    // Register builtin card types
    this._registerBuiltinCardTypes();

    this.initialized = true;
    lcardsLog.info('[CoreConfigManager] ✅ Initialized');
  }

  /**
   * Update context with late-initialized dependencies
   * Allows ConfigManager to be initialized early before all systems are ready
   *
   * @param {Object} context - Additional context to add
   * @param {Object} context.themeManager - ThemeManager instance
   * @param {Object} context.stylePresetManager - StylePresetManager instance
   */
  async updateContext(context) {
    if (!this.initialized) {
      lcardsLog.warn('[CoreConfigManager] Cannot update context - not initialized');
      return;
    }

    if (context.themeManager) {
      this.themeManager = context.themeManager;
      lcardsLog.debug('[CoreConfigManager] ThemeManager added to context');
    }

    if (context.stylePresetManager) {
      this.stylePresetManager = context.stylePresetManager;
      lcardsLog.debug('[CoreConfigManager] StylePresetManager added to context');
    }
  }

  /**
   * Process card configuration with four-layer merge
   *
   * Merge order:
   * 1. Card defaults (behavioral: show_label, etc.)
   * 2. Theme defaults (component style base with tokens)
   * 3. Preset (named style configuration)
   * 4. User config (overrides)
   *
   * Then: Resolve theme tokens → Validate → Return result
   *
   * @param {Object} userConfig - Raw config from YAML/UI
   * @param {string} cardType - Card type identifier ('simple-button', 'msd', etc.)
   * @param {Object} context - Additional context { hass, entity, ... }
   * @returns {Promise<ConfigResult>} Result with merged config, validation, provenance
   *
   * @example
   * const result = await configManager.processConfig(
   *   { preset: 'lozenge', entity: 'light.bedroom' },
   *   'simple-button',
   *   { hass: this.hass }
   * );
   * if (result.valid) {
   *   this._config = result.mergedConfig;
   *   this._provenance = result.provenance;
   * }
   */
  async processConfig(userConfig, cardType, context = {}) {
    if (!this.initialized) {
      lcardsLog.error('[CoreConfigManager] Not initialized - call initialize() first');
      return this._createErrorResult(userConfig, 'CoreConfigManager not initialized');
    }

    lcardsLog.debug(`[CoreConfigManager] Processing config for ${cardType}`, {
      hasPreset: !!userConfig.preset,
      hasEntity: !!userConfig.entity,
      hasStyle: !!userConfig.style
    });

    this.stats.configurationsProcessed++;

    try {
      // Check if this is MSD-style pack-based config
      if (this._usePackMerging(cardType, userConfig)) {
        return await this._processMSDConfig(userConfig, cardType, context);
      }

      // LCARdS Card: Four-layer merge
      return await this._processLCARdSCardConfig(userConfig, cardType, context);

    } catch (error) {
      lcardsLog.error(`[CoreConfigManager] Processing failed for ${cardType}:`, error);
      this.stats.validationErrors++;
      return this._createErrorResult(userConfig, error.message);
    }
  }

  /**
   * Register card type schema for validation
   * @param {string} cardType - Card type identifier
   * @param {Object} schema - JSON schema object
   * @param {Object} options - Registration options
   * @param {string} options.version - Schema version (default: '1.0')
   */
  registerCardSchema(cardType, schema, options = {}) {
    const schemaEntry = {
      schema,
      version: options.version || '1.0',
      registeredAt: Date.now()
    };

    this._cardSchemas.set(cardType, schemaEntry);
    lcardsLog.debug(`[CoreConfigManager] Registered schema for ${cardType}`, {
      version: schemaEntry.version,
      hasProperties: !!schema.properties
    });
  }

  /**
   * Register card type BEHAVIORAL defaults
   *
   * ⚠️ BEHAVIORAL ONLY: show_label, show_icon, enable_hold_action, etc.
   * ❌ NOT FOR STYLES: Use Theme + Presets for style defaults
   *
   * @param {string} cardType - Card type identifier
   * @param {Object} defaults - Behavioral defaults only
   *
   * @example
   * // ✅ CORRECT: Behavioral defaults
   * configManager.registerCardDefaults('simple-button', {
   *   show_label: true,
   *   show_icon: false,
   *   enable_hold_action: true
   * });
   *
   * // ❌ WRONG: Don't put styles in card defaults
   * configManager.registerCardDefaults('simple-button', {
   *   style: { height: 45 }  // NO! Use theme/preset instead
   * });
   */
  registerCardDefaults(cardType, defaults) {
    // Validate that defaults don't contain style objects
    if (defaults.style) {
      lcardsLog.warn(
        `[CoreConfigManager] Card defaults for ${cardType} contain 'style' - ` +
        `this should be in Theme or Presets instead. Ignoring style defaults.`
      );
      // Remove style from defaults
      const { style, ...behavioralDefaults } = defaults;
      defaults = behavioralDefaults;
    }

    this._cardDefaults.set(cardType, {
      defaults,
      registeredAt: Date.now()
    });

    lcardsLog.debug(`[CoreConfigManager] Registered defaults for ${cardType}`, {
      keys: Object.keys(defaults)
    });
  }

  /**
   * Get debug information about registered cards and processing stats
   * @returns {Object} Debug information
   */
  getDebugInfo() {
    return {
      initialized: this.initialized,
      stats: { ...this.stats },
      registeredCards: {
        schemas: Array.from(this._cardSchemas.keys()),
        defaults: Array.from(this._cardDefaults.keys())
      },
      dependencies: {
        hasValidationService: !!this.validationService,
        hasThemeManager: !!this.themeManager,
        hasStylePresetManager: !!this.stylePresetManager
      }
    };
  }

  // ============================================================================
  // PRIVATE METHODS - MSD Processing
  // ============================================================================

  /**
   * Process MSD-style pack-based configuration
   * @private
   */
  async _processMSDConfig(userConfig, cardType, context) {
    lcardsLog.debug(`[CoreConfigManager] Processing MSD config (pack-based merge)`);

    // Use existing mergePacks system (preserves all MSD provenance)
    const mergedConfig = await mergePacks(userConfig);
    const provenance = mergedConfig.__provenance;

    // Validate
    const validation = this._validateConfig(mergedConfig, cardType, context);
    if (!validation.valid) {
      this.stats.validationErrors++;
    }

    return {
      valid: validation.valid,
      mergedConfig,
      errors: validation.errors,
      warnings: validation.warnings,
      provenance
    };
  }

  // ============================================================================
  // PRIVATE METHODS - LCARdS Card Processing
  // ============================================================================

  /**
   * Process LCARdS card-style four-layer configuration
   * @private
   */
  async _processLCARdSCardConfig(userConfig, cardType, context) {
    lcardsLog.debug(`[CoreConfigManager] Processing LCARdS card config (four-layer merge)`);

    // STEP 1: Get behavioral defaults
    const behavioralDefaults = this._getCardDefaults(cardType);

    // STEP 2: Get theme component defaults (style base)
    const themeDefaults = this._getThemeDefaults(cardType);

    // STEP 3: Get preset (if specified in user config)
    const presetConfig = await this._getPresetConfig(cardType, userConfig);

    // STEP 4: Four-layer deep merge
    const mergedConfig = this._fourLayerMerge(
      behavioralDefaults,
      themeDefaults,
      presetConfig,
      userConfig
    );

    // STEP 5: Resolve theme tokens
    this._resolveThemeTokens(mergedConfig, cardType);

    // STEP 6: Create provenance tracking
    const provenance = this._createProvenance(
      behavioralDefaults,
      themeDefaults,
      presetConfig,
      userConfig,
      cardType
    );

    // STEP 7: Validate
    const validation = this._validateConfig(mergedConfig, cardType, context);
    if (!validation.valid) {
      this.stats.validationErrors++;
    }

    return {
      valid: validation.valid,
      mergedConfig,
      errors: validation.errors,
      warnings: validation.warnings,
      provenance
    };
  }

  /**
   * Four-layer deep merge: behavioral → theme → preset → user
   * @private
   */
  _fourLayerMerge(behavioral, theme, preset, user) {
    let result = deepMerge({}, behavioral);
    result = deepMerge(result, theme);
    result = deepMerge(result, preset);
    result = deepMerge(result, user);
    return result;
  }

  /**
   * Get behavioral defaults for card type
   * @private
   */
  _getCardDefaults(cardType) {
    const entry = this._cardDefaults.get(cardType);
    if (!entry) {
      lcardsLog.debug(`[CoreConfigManager] No defaults registered for ${cardType}`);
      return {};
    }
    return { ...entry.defaults };
  }

  /**
   * Get theme component defaults for card type
   * @private
   */
  _getThemeDefaults(cardType) {
    if (!this.themeManager || !this.themeManager.initialized) {
      return {};
    }

    const componentType = this._mapCardTypeToComponent(cardType);
    const themeDef = this.themeManager.getDefault(componentType, 'base');

    if (!themeDef) {
      return {};
    }

    // Nest under 'style' key
    return { style: { ...themeDef } };
  }

  /**
   * Get preset configuration if specified
   * @private
   */
  async _getPresetConfig(cardType, userConfig) {
    if (!userConfig.preset || !this.stylePresetManager) {
      return {};
    }

    const overlayType = this._mapCardTypeToOverlay(cardType);
    const preset = this.stylePresetManager.getPreset(
      overlayType,
      userConfig.preset,
      this.themeManager
    );

    if (!preset) {
      lcardsLog.warn(
        `[CoreConfigManager] Preset '${userConfig.preset}' not found for ${overlayType}`
      );
      return {};
    }

    this.stats.presetsResolved++;

    // Presets can have nested 'style' or be flat
    return preset.style ? preset : { style: preset };
  }

  /**
   * Resolve theme tokens in merged config
   * @private
   */
  _resolveThemeTokens(config, cardType) {
    if (!this.themeManager || !this.themeManager.resolver) {
      return;
    }

    const componentType = this._mapCardTypeToComponent(cardType);
    const resolveToken = this.themeManager.resolver.forComponent(componentType);

    this._walkAndResolveTokens(config, resolveToken);
  }

  /**
   * Walk object tree and resolve 'theme:' tokens
   * @private
   */
  _walkAndResolveTokens(obj, resolveToken) {
    if (!obj || typeof obj !== 'object') return;

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && value.startsWith('theme:')) {
        const tokenPath = value.substring(6); // Remove 'theme:' prefix
        obj[key] = resolveToken(tokenPath, value);
        this.stats.tokensResolved++;
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        this._walkAndResolveTokens(value, resolveToken);
      }
    }
  }

  /**
   * Create provenance tracking for four-layer merge
   * @private
   */
  _createProvenance(behavioral, theme, preset, user, cardType) {
    const provenance = {
      card_type: cardType,
      merge_order: [],
      field_sources: {},
      timestamp: Date.now()
    };

    // Track which layers were used
    if (Object.keys(behavioral).length > 0) {
      provenance.merge_order.push('card_defaults');
    }
    if (Object.keys(theme).length > 0) {
      provenance.merge_order.push('theme_defaults');
    }
    if (user.preset && Object.keys(preset).length > 0) {
      provenance.merge_order.push(`preset_${user.preset}`);
    }
    provenance.merge_order.push('user_config');

    // Track field sources
    trackFieldSources(provenance.field_sources, {
      card_defaults: behavioral,
      theme_defaults: theme,
      [`preset_${user.preset || 'none'}`]: preset,
      user_config: user
    });

    return provenance;
  }

  /**
   * Validate configuration against schema
   * @private
   */
  _validateConfig(config, cardType, context) {
    const schemaEntry = this._cardSchemas.get(cardType);

    // If no schema registered, skip validation
    if (!schemaEntry) {
      lcardsLog.debug(`[CoreConfigManager] No schema for ${cardType}, skipping validation`);
      return { valid: true, errors: [], warnings: [] };
    }

    // Use CoreValidationService
    try {
      const result = this.validationService.validate(config, schemaEntry.schema, {
        context: cardType
      });

      return {
        valid: result.valid,
        errors: result.errors || [],
        warnings: result.warnings || []
      };
    } catch (error) {
      lcardsLog.error(`[CoreConfigManager] Validation failed:`, error);
      return {
        valid: false,
        errors: [{
          type: 'validation_error',
          message: error.message,
          formattedMessage: `Validation error: ${error.message}`
        }],
        warnings: []
      };
    }
  }

  // ============================================================================
  // PRIVATE METHODS - Helpers
  // ============================================================================

  /**
   * Check if config requires pack-based merging (MSD style)
   * @private
   */
  _usePackMerging(cardType, userConfig) {
    // Use pack merging if:
    // 1. Card type is 'msd', OR
    // 2. Config has use_packs property
    return cardType === 'msd' || !!userConfig.use_packs;
  }

  /**
   * Map card type to theme component type
   * @private
   */
  _mapCardTypeToComponent(cardType) {
    const mapping = {
      'simple-button': 'button',
      'simple-label': 'text',
      'simple-gauge': 'gauge',
      'msd': 'msd'
    };
    return mapping[cardType] || cardType;
  }

  /**
   * Map card type to preset overlay type
   * @private
   */
  _mapCardTypeToOverlay(cardType) {
    const mapping = {
      'simple-button': 'button',
      'simple-label': 'text',
      'simple-gauge': 'gauge'
    };
    return mapping[cardType] || cardType;
  }

  /**
   * Register builtin card types with behavioral defaults
   * @private
   */
  _registerBuiltinCardTypes() {
    // Simple Button: BEHAVIORAL defaults only
    this.registerCardDefaults('simple-button', {
      show_label: true,
      show_icon: false,
      enable_hold_action: true,
      enable_double_tap: false
    });

    // Simple Label
    this.registerCardDefaults('simple-label', {
      show_label: true,
      show_name: true
    });

    lcardsLog.debug('[CoreConfigManager] Registered builtin card types');
  }

  /**
   * Create error result
   * @private
   */
  _createErrorResult(userConfig, errorMessage) {
    return {
      valid: false,
      mergedConfig: userConfig,
      errors: [{
        type: 'processing_error',
        message: errorMessage,
        formattedMessage: `Config processing failed: ${errorMessage}`
      }],
      warnings: [],
      provenance: null
    };
  }
}
