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
 * 3. Preset OR Component (mutually exclusive):
 *    - Preset: Named style config from StylePresetManager
 *    - Component: Segment defaults (dpad, svg, gauge) from component registry
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
   * 3. Preset OR Component (mutually exclusive):
   *    - preset: Named style configuration (lozenge, bullet, etc.)
   *    - component: Segment defaults (dpad, svg, gauge)
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
   * // With preset
   * const result = await configManager.processConfig(
   *   { preset: 'lozenge', entity: 'light.bedroom' },
   *   'simple-button',
   *   { hass: this.hass }
   * );
   *
   * // With component (mutually exclusive)
   * const result = await configManager.processConfig(
   *   { component: 'dpad', entity: 'media_player.tv' },
   *   'simple-button',
   *   { hass: this.hass }
   * );
   */
  async processConfig(userConfig, cardType, context = {}) {
    if (!this.initialized) {
      lcardsLog.error('[CoreConfigManager] Not initialized - call initialize() first');
      return this._createErrorResult(userConfig, 'CoreConfigManager not initialized');
    }

    lcardsLog.debug(`[CoreConfigManager] Processing config for ${cardType}`, {
      hasPreset: !!userConfig.preset,
      hasEntity: !!userConfig.entity,
      hasStyle: !!userConfig.style,
      isMsdNested: cardType === 'msd' && !!userConfig.msd  // ✅ NEW: Detect MSD
    });

    this.stats.configurationsProcessed++;

    try {
      // ✅ NEW: Special handling for MSD nested structure
      // MSD cards have { type, id, grid_options, msd: {...} } instead of flat config
      if (cardType === 'msd' && userConfig.msd) {
        lcardsLog.trace('[CoreConfigManager] Detected MSD nested structure, using _processMsdConfig()');
        return await this._processMsdConfig(userConfig, context);
      }
      
      // Standard four-layer merge for flat-structure cards
      // PackManager handles packs globally - no per-card pack merging needed
      return await this._processLCARdSCardConfig(userConfig, cardType, context);

    } catch (error) {
      lcardsLog.error(`[CoreConfigManager] Processing failed for ${cardType}:`, error);
      this.stats.validationErrors++;
      return this._createErrorResult(userConfig, error.message);
    }
  }

  /**
   * Process MSD card config with nested structure
   * 
   * MSD cards have a unique nested structure: { type, id, grid_options, msd: {...} }
   * This method processes the nested msd object through the standard config pipeline
   * and reconstructs the top-level structure with provenance attached.
   * 
   * @param {Object} userConfig - Full user config with nested msd object
   * @param {Object} context - Processing context { hass, entity, ... }
   * @returns {Promise<ConfigResult>} Result with merged config and provenance
   * @private
   * 
   * @example
   * // Input:
   * {
   *   type: 'custom:lcards-msd-card',
   *   id: 'bridge',
   *   grid_options: { columns: 'full', rows: 8 },
   *   msd: {
   *     base_svg: { source: 'builtin:ncc-1701-a' },
   *     overlays: [...]
   *   }
   * }
   * 
   * // Output:
   * {
   *   valid: true,
   *   mergedConfig: {
   *     type: 'custom:lcards-msd-card',
   *     id: 'bridge',
   *     grid_options: {...},
   *     msd: { <processed with theme tokens, validation> },
   *     __provenance: { merge_order: [...], field_sources: {...} }
   *   },
   *   provenance: {...},
   *   errors: [],
   *   warnings: []
   * }
   */
  async _processMsdConfig(userConfig, context) {
    lcardsLog.debug('[CoreConfigManager] Processing MSD nested config', {
      hasId: !!userConfig.id,
      hasMsd: !!userConfig.msd,
      hasGridOptions: !!userConfig.grid_options
    });

    // Validate nested structure
    if (!userConfig.msd || typeof userConfig.msd !== 'object') {
      lcardsLog.error('[CoreConfigManager] Invalid MSD config: missing or invalid msd object');
      return this._createErrorResult(userConfig, 'MSD config must contain a "msd" object');
    }

    try {
      // Process the nested msd object through standard four-layer merge
      const msdResult = await this._processLCARdSCardConfig(
        userConfig.msd,
        'msd',
        context
      );

      // Track that we processed nested structure
      if (msdResult.provenance) {
        msdResult.provenance.nested_structure = {
          type: 'msd',
          processed_path: 'msd',
          top_level_fields: ['type', 'id', 'grid_options']
        };
      }

      // Reconstruct top-level structure with processed msd config
      const processedConfig = {
        type: userConfig.type,
        id: userConfig.id,
        grid_options: userConfig.grid_options,
        
        // ✅ Processed msd object (with theme tokens resolved, validation applied)
        msd: msdResult.mergedConfig,
        
        // ✅ CRITICAL: Attach provenance at top level (this is what was missing!)
        __provenance: msdResult.provenance,
        
        // ✅ Attach validation results
        __validation: {
          errors: msdResult.errors || [],
          warnings: msdResult.warnings || [],
          valid: msdResult.valid
        }
      };

      lcardsLog.debug('[CoreConfigManager] MSD config processed successfully', {
        hasProvenance: !!processedConfig.__provenance,
        validationErrors: msdResult.errors?.length || 0,
        validationWarnings: msdResult.warnings?.length || 0,
        mergeOrder: msdResult.provenance?.merge_order
      });

      // Return in standard ConfigResult format
      return {
        valid: msdResult.valid,
        mergedConfig: processedConfig,
        provenance: msdResult.provenance,
        errors: msdResult.errors || [],
        warnings: msdResult.warnings || []
      };

    } catch (error) {
      lcardsLog.error('[CoreConfigManager] Error processing MSD nested config:', error);
      return this._createErrorResult(userConfig, `MSD config processing failed: ${error.message}`);
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
   * Get registered schema for a card type
   * @param {string} cardType - Card type identifier
   * @returns {Object|null} JSON Schema object or null if not registered
   */
  getCardSchema(cardType) {
    const entry = this._cardSchemas.get(cardType);
    if (!entry) {
      return null;
    }
    return entry.schema;
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
  // PRIVATE METHODS - MSD Processing (DEPRECATED - NO LONGER USED)
  // ============================================================================
  // NOTE: MSD now uses standard LCARdS card processing via _processLCARdSCardConfig
  // This method and mergePacks are legacy code kept temporarily for reference only

  /**
   * Process MSD-style pack-based configuration
   * @deprecated MSD now uses standard four-layer merge like other LCARdS cards
   * @private
   */
  async _processMSDConfig(userConfig, cardType, context) {
    lcardsLog.debug(`[CoreConfigManager] Processing MSD config (pack-based merge)`);

    // Extract MSD configuration from nested structure
    // User config: { type: 'custom:lcards-msd-card', msd: {...}, data_sources: {...}, rules: [...] }
    const msdContent = userConfig.msd || userConfig;

    // Merge MSD content with packs (preserves all MSD provenance)
    const mergedMsdContent = await mergePacks(msdContent);
    const provenance = mergedMsdContent.__provenance;

    // Reconstruct full config structure for validation
    const mergedConfig = {
      type: userConfig.type,
      msd: mergedMsdContent,
      // Include root-level properties if present
      ...(userConfig.data_sources ? { data_sources: userConfig.data_sources } : {}),
      ...(userConfig.rules ? { rules: userConfig.rules } : {})
    };

    // Validate against card schema (expects { type, msd } structure)
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
   * Layer 3 can be either preset OR component (mutually exclusive)
   * @private
   */
  async _processLCARdSCardConfig(userConfig, cardType, context) {
    lcardsLog.debug(`[CoreConfigManager] Processing LCARdS card config (four-layer merge)`);

    // STEP 1: Get behavioral defaults
    const behavioralDefaults = this._getCardDefaults(cardType);

    // STEP 2: Get theme component defaults (style base)
    const themeDefaults = this._getThemeDefaults(cardType);

    // STEP 3: Get preset AND/OR component defaults
    // Both can be specified - they're complementary (preset=style, component=segments)
    let presetConfig = {};
    let componentConfig = {};

    if (userConfig.preset) {
      presetConfig = await this._getPresetConfig(cardType, userConfig);
    }

    if (userConfig.component) {
      componentConfig = await this._getComponentDefaults(cardType, userConfig);
    }

    // STEP 4: Five-layer deep merge when both preset and component exist
    // Order: behavioral → theme → preset → component → user
    let mergedConfig = deepMerge({}, behavioralDefaults);
    mergedConfig = deepMerge(mergedConfig, themeDefaults);
    mergedConfig = deepMerge(mergedConfig, presetConfig);
    mergedConfig = deepMerge(mergedConfig, componentConfig);
    mergedConfig = deepMerge(mergedConfig, userConfig);    // STEP 5: Resolve theme tokens
    this._resolveThemeTokens(mergedConfig, cardType);

    // STEP 6: Create provenance tracking (now supports both preset and component)
    const provenance = this._createProvenance(
      behavioralDefaults,
      themeDefaults,
      presetConfig,
      componentConfig,
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
   * Four-layer deep merge: behavioral → theme → (preset OR component) → user
   * @private
   */
  _fourLayerMerge(behavioral, theme, presetOrComponent, user) {
    let result = deepMerge({}, behavioral);
    result = deepMerge(result, theme);
    result = deepMerge(result, presetOrComponent);
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
   * Get component defaults if specified (dpad, svg, gauge, etc.)
   * Components provide segment/element configurations with theme tokens
   * @private
   */
  async _getComponentDefaults(cardType, userConfig) {
    if (!userConfig.component) {
      return {};
    }

    // Import component registry (use dynamic import to avoid circular deps)
    const { getComponent } = await import('../packs/components/index.js');
    const componentPreset = getComponent(userConfig.component);

    if (!componentPreset) {
      lcardsLog.warn(
        `[CoreConfigManager] Component preset '${userConfig.component}' not found`
      );
      return {};
    }

    lcardsLog.debug(`[CoreConfigManager] Loading component preset`, {
      component: userConfig.component,
      hasSegments: !!componentPreset.segments
    });

    // Component presets provide segment configurations
    // Nest under component name key (e.g., { dpad: { segments: {...} } })
    const componentKey = userConfig.component;
    return {
      [componentKey]: {
        segments: componentPreset.segments || {}
      }
    };
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
   * Layer 3 can be preset OR component (mutually exclusive)
   * @private
   */
  _createProvenance(behavioral, theme, preset, component, user, cardType) {
    const provenance = {
      card_type: cardType,
      merge_order: [],
      field_sources: {},
      timestamp: Date.now()
    };

    // Build layers object for field source tracking
    const layers = {};

    // Layer 1: Behavioral defaults
    if (Object.keys(behavioral).length > 0) {
      provenance.merge_order.push('card_defaults');
      layers.card_defaults = behavioral;
    }

    // Layer 2: Theme defaults
    if (Object.keys(theme).length > 0) {
      provenance.merge_order.push('theme_defaults');
      layers.theme_defaults = theme;
    }

    // Layer 3: Preset (if present)
    if (user.preset && Object.keys(preset).length > 0) {
      const presetLayerName = `preset_${user.preset}`;
      provenance.merge_order.push(presetLayerName);
      layers[presetLayerName] = preset;
    }

    // Layer 4: Component (if present)
    if (user.component && Object.keys(component).length > 0) {
      const componentLayerName = `component_${user.component}`;
      provenance.merge_order.push(componentLayerName);
      layers[componentLayerName] = component;
    }

    // Layer 5: User config (always included)
    provenance.merge_order.push('user_config');
    layers.user_config = user;

    // Track field sources with layer-by-layer values
    trackFieldSources(provenance.field_sources, layers);

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
    // DEPRECATED: Pack merging removed in MSD refactor
    // All packs loaded globally by PackManager, not per-card
    // MSD now uses standard four-layer merge like other LCARdS cards
    return false;
  }

  /**
   * Map card type to theme component type
   * @private
   */
  /**
   * Map legacy card type names to component type
   * @private
   */
  _mapCardTypeToComponent(cardType) {
    const mapping = {
      'simple-button': 'button',  // Legacy alias
      'simple-label': 'text',     // Legacy alias
      'simple-gauge': 'gauge',    // Legacy alias
      'msd': 'msd'
    };
    return mapping[cardType] || cardType;
  }

  /**
   * Map legacy card type to preset overlay type
   * @private
   */
  _mapCardTypeToOverlay(cardType) {
    const mapping = {
      'simple-button': 'button',  // Legacy alias
      'simple-label': 'text',     // Legacy alias
      'simple-gauge': 'gauge'     // Legacy alias
    };
    return mapping[cardType] || cardType;
  }

  /**
   * Register builtin card types with behavioral defaults
   * Includes legacy 'simple-*' aliases for backward compatibility
   * @private
   */
  _registerBuiltinCardTypes() {
    // Legacy Simple Button: BEHAVIORAL defaults only
    this.registerCardDefaults('simple-button', {
      show_label: true,
      show_icon: false,
      enable_hold_action: true,
      enable_double_tap: false
    });

    // Legacy Simple Label
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
