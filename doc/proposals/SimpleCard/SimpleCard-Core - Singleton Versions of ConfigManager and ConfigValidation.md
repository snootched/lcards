# Configuration Validation & Merging Architecture - Strategic Plan

**Document Version**: 1.0  
**Date**: 2025-11-10  
**Author**: LCARdS Architecture Team  
**Status**: Implementation Plan

---

## Executive Summary

This document outlines the strategic plan for **unified configuration validation and merging** across all LCARdS card types (SimpleCard, MSD, future cards). The goal is to **extract configuration processing to a singleton service** that all cards use, eliminating duplicate logic and ensuring consistent behavior.

**Key Decisions**:
- ✅ Extract **validation** to `CoreValidationService` singleton (already exists)
- ✅ Extract **config merging** to new `CoreConfigManager` singleton
- ✅ MSD's `CardModel` concept becomes **card-type agnostic**
- ✅ All cards (SimpleCard, MSD, future) use the same validation/merging pipeline
- ✅ Card-specific schemas register with the singleton
- ⚠️ MSD will be **refactored later** to use singletons (Phase 2)

---

## Current State Analysis

### SimpleCard Configuration Flow (Needs Improvement)

```javascript
// src/base/LCARdSSimpleCard.js
setConfig(config) {
  // ❌ NO VALIDATION - Just accepts whatever config is given
  this._config = config;
  
  // ❌ NO DEEP MERGING - Basic shallow merge with preset
  if (config.preset) {
    const preset = this._singletons?.stylePresetManager.getPreset('button', config.preset);
    this._mergedConfig = { ...preset.style, ...config.style };
  }
  
  // ❌ NO PROVENANCE TRACKING - Can't debug where values came from
}
```

**Problems**:
1. No schema validation (typos/invalid values silently ignored)
2. Shallow merge (nested objects overwrite instead of merge)
3. No preset inheritance (can't extend base → preset → user)
4. No provenance (can't tell if color came from theme, preset, or user)
5. Duplicate logic in every card type

---

### MSD Configuration Flow (Complex but Complete)

```javascript
// src/msd/pipeline/ModelBuilder.js
async buildModel(rawConfig) {
  // ✅ VALIDATION - Full schema validation
  const validated = this.validator.validate(rawConfig, msdSchema);
  
  // ✅ PACK MERGING - Merge builtin packs + user config
  const merged = this.packMerger.merge(builtinDefaults, rawConfig);
  
  // ✅ PROVENANCE TRACKING - Every value tagged with source
  merged.__provenance = {
    merge_order: [...],
    field_sources: { /* color: 'user_config' */ }
  };
  
  // ✅ DEEP MERGING - Recursive object merging
  // ✅ DEFAULTS - Base → Theme → Pack → User hierarchy
  
  return cardModel; // Complete merged & validated config
}
```

**Strengths**:
- Full validation, deep merging, provenance tracking
- Multi-source merging (base → theme → pack → user)

**Problems**:
- Tightly coupled to MSD overlay system
- Not reusable by SimpleCard or other card types
- Requires full MSD pipeline initialization

---

## Ideal State: Unified Configuration Architecture

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│              window.lcardsCore (Singleton Registry)          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │     CoreValidationService (Already Exists)           │  │
│  │  - Schema registry (MSD, SimpleCard, custom)         │  │
│  │  - JSON Schema validation                            │  │
│  │  - Error formatting with suggestions                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │     CoreConfigManager (NEW - To Be Created)          │  │
│  │  - Deep config merging (base → theme → preset → user)│  │
│  │  - Provenance tracking                               │  │
│  │  - Pack integration                                  │  │
│  │  - Template variable resolution                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │     ThemeManager (Existing Singleton)                │  │
│  │  - Theme token resolution                            │  │
│  │  - Component defaults (button.defaultColor, etc.)    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │     StylePresetManager (Existing Singleton)          │  │
│  │  - Button presets (lozenge, picard, etc.)           │  │
│  │  - Overlay presets                                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                           ▲
                           │ All cards use singletons
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼──────┐  ┌────────▼────────┐  ┌─────▼──────┐
│ SimpleCard   │  │   MSD Card      │  │ Future     │
│              │  │                 │  │ Cards      │
│ setConfig()  │  │ buildModel()    │  │            │
│   ↓          │  │   ↓             │  │            │
│ validate()   │  │ validate()      │  │            │
│   ↓          │  │   ↓             │  │            │
│ mergeConfig()│  │ mergeConfig()   │  │            │
└──────────────┘  └─────────────────┘  └────────────┘
```

---

## Target Architecture: CoreConfigManager Singleton

### Location
`src/core/config-manager/index.js`

### Responsibilities

| Function | Description |
|----------|-------------|
| **Validation** | Validate config against registered schemas |
| **Deep Merging** | Merge base → theme → preset → pack → user configs |
| **Provenance Tracking** | Track source of every config value |
| **Template Resolution** | Resolve template variables (`{{tokens}}`) |
| **Pack Integration** | Load and merge builtin/custom packs |
| **Error Reporting** | User-friendly validation errors with suggestions |

---

### API Design

```javascript
/**
 * CoreConfigManager - Unified configuration processing
 * 
 * Provides validation, deep merging, and provenance tracking for all card types.
 * Replaces duplicate config logic in SimpleCard, MSD, and future cards.
 * 
 * @class CoreConfigManager
 */
export class CoreConfigManager {
  constructor() {
    this.validationService = null;  // Link to CoreValidationService
    this.themeManager = null;       // Link to ThemeManager
    this.stylePresetManager = null; // Link to StylePresetManager
    
    this.initialized = false;
  }

  /**
   * Initialize with singleton references
   * @param {Object} singletons - { validationService, themeManager, stylePresetManager }
   */
  async initialize(singletons) {
    this.validationService = singletons.validationService;
    this.themeManager = singletons.themeManager;
    this.stylePresetManager = singletons.stylePresetManager;
    
    this.initialized = true;
    lcardsLog.info('[CoreConfigManager] ✅ Initialized');
  }

  /**
   * Process card configuration with full validation and merging
   * 
   * @param {Object} userConfig - Raw config from YAML/UI
   * @param {string} cardType - Card type ('simple-button', 'msd', etc.)
   * @param {Object} context - Additional context (hass, entity, etc.)
   * @returns {Object} { valid, mergedConfig, errors, warnings, provenance }
   * 
   * @example
   * const result = configManager.processConfig(
   *   { type: 'custom:lcards-simple-button', preset: 'lozenge' },
   *   'simple-button',
   *   { hass, entity }
   * );
   * 
   * if (!result.valid) {
   *   console.error('Config errors:', result.errors);
   * }
   * 
   * const finalConfig = result.mergedConfig;
   */
  processConfig(userConfig, cardType, context = {}) {
    lcardsLog.debug(`[CoreConfigManager] Processing config for ${cardType}`);

    // Step 1: Validate against schema
    const validation = this._validateConfig(userConfig, cardType);
    if (!validation.valid) {
      return {
        valid: false,
        mergedConfig: null,
        errors: validation.errors,
        warnings: validation.warnings,
        provenance: null
      };
    }

    // Step 2: Build merge layers
    const mergeLayers = this._buildMergeLayers(userConfig, cardType, context);

    // Step 3: Deep merge with provenance tracking
    const mergeResult = this._deepMergeWithProvenance(mergeLayers);

    // Step 4: Resolve template variables
    const resolvedConfig = this._resolveTemplates(mergeResult.config, context);

    return {
      valid: true,
      mergedConfig: resolvedConfig,
      errors: [],
      warnings: validation.warnings,
      provenance: mergeResult.provenance
    };
  }

  /**
   * Validate config against registered schema
   * @private
   */
  _validateConfig(config, cardType) {
    const schema = this.validationService.getSchema(cardType);
    if (!schema) {
      lcardsLog.warn(`[CoreConfigManager] No schema registered for ${cardType}`);
      return { valid: true, errors: [], warnings: [] };
    }

    return this.validationService.validate(config, schema);
  }

  /**
   * Build merge layers (base → theme → preset → pack → user)
   * @private
   */
  _buildMergeLayers(userConfig, cardType, context) {
    const layers = [];

    // Layer 1: Base defaults (from card type)
    const baseDefaults = this._getBaseDefaults(cardType);
    if (baseDefaults) {
      layers.push({
        source: 'base_defaults',
        priority: 1,
        config: baseDefaults
      });
    }

    // Layer 2: Theme defaults (from ThemeManager)
    const themeDefaults = this._getThemeDefaults(cardType);
    if (themeDefaults) {
      layers.push({
        source: 'theme_defaults',
        priority: 2,
        config: themeDefaults
      });
    }

    // Layer 3: Preset (from StylePresetManager)
    if (userConfig.preset) {
      const preset = this._getPreset(cardType, userConfig.preset);
      if (preset) {
        layers.push({
          source: `preset_${userConfig.preset}`,
          priority: 3,
          config: preset
        });
      }
    }

    // Layer 4: Pack overrides (if any)
    const packOverrides = this._getPackOverrides(cardType, userConfig);
    if (packOverrides) {
      layers.push({
        source: 'pack_overrides',
        priority: 4,
        config: packOverrides
      });
    }

    // Layer 5: User config (highest priority)
    layers.push({
      source: 'user_config',
      priority: 5,
      config: userConfig
    });

    return layers;
  }

  /**
   * Deep merge layers with provenance tracking
   * @private
   */
  _deepMergeWithProvenance(layers) {
    const result = {};
    const provenance = {
      merge_order: layers.map(l => l.source),
      field_sources: {}
    };

    // Sort by priority (lowest first, user config last)
    const sortedLayers = [...layers].sort((a, b) => a.priority - b.priority);

    // Merge each layer, tracking provenance
    sortedLayers.forEach(layer => {
      this._mergeLayer(result, layer.config, layer.source, provenance, '');
    });

    return { config: result, provenance };
  }

  /**
   * Recursively merge a config layer
   * @private
   */
  _mergeLayer(target, source, sourceName, provenance, path) {
    for (const [key, value] of Object.entries(source)) {
      const fieldPath = path ? `${path}.${key}` : key;

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        // Nested object - recurse
        target[key] = target[key] || {};
        this._mergeLayer(target[key], value, sourceName, provenance, fieldPath);
      } else {
        // Primitive value - overwrite and track provenance
        target[key] = value;
        provenance.field_sources[fieldPath] = sourceName;
      }
    }
  }

  /**
   * Resolve template variables ({{tokens}})
   * @private
   */
  _resolveTemplates(config, context) {
    // TODO: Implement template variable resolution
    // For now, return config as-is
    return config;
  }

  /**
   * Get base defaults for card type
   * @private
   */
  _getBaseDefaults(cardType) {
    const defaults = {
      'simple-button': {
        style: {
          width: null,
          height: 45,
          fontSize: 20,
          textAlign: 'right'
        },
        showLabel: true,
        showIcon: false
      },
      'msd': {
        // MSD base defaults
      }
    };

    return defaults[cardType] || null;
  }

  /**
   * Get theme defaults from ThemeManager
   * @private
   */
  _getThemeDefaults(cardType) {
    if (!this.themeManager) return null;

    // Get component defaults from active theme
    const componentType = this._mapCardTypeToComponent(cardType);
    return this.themeManager.getDefault(componentType, 'base');
  }

  /**
   * Get preset from StylePresetManager
   * @private
   */
  _getPreset(cardType, presetName) {
    if (!this.stylePresetManager) return null;

    const overlayType = this._mapCardTypeToOverlay(cardType);
    return this.stylePresetManager.getPreset(overlayType, presetName);
  }

  /**
   * Map card type to component type (for ThemeManager)
   * @private
   */
  _mapCardTypeToComponent(cardType) {
    const mapping = {
      'simple-button': 'button',
      'simple-label': 'text',
      'msd': 'msd'
    };
    return mapping[cardType] || cardType;
  }

  /**
   * Map card type to overlay type (for StylePresetManager)
   * @private
   */
  _mapCardTypeToOverlay(cardType) {
    const mapping = {
      'simple-button': 'button',
      'simple-label': 'text',
      'msd': 'overlay'
    };
    return mapping[cardType] || cardType;
  }

  /**
   * Get pack overrides (placeholder for future pack system)
   * @private
   */
  _getPackOverrides(cardType, userConfig) {
    // TODO: Implement pack override loading
    return null;
  }

  /**
   * Get debug information
   * @returns {Object} Debug info
   */
  getDebugInfo() {
    return {
      initialized: this.initialized,
      hasValidationService: !!this.validationService,
      hasThemeManager: !!this.themeManager,
      hasStylePresetManager: !!this.stylePresetManager
    };
  }
}
```

---

## Usage Examples

### SimpleCard Usage

```javascript
// src/base/LCARdSSimpleCard.js

setConfig(config) {
  const configManager = this._singletons?.configManager;
  if (!configManager) {
    throw new Error('CoreConfigManager not available');
  }

  // Process config with validation and merging
  const result = configManager.processConfig(
    config,
    'simple-button',
    { hass: this.hass, entity: this._entity }
  );

  if (!result.valid) {
    // Show validation errors to user
    throw new Error(`Invalid configuration: ${result.errors.map(e => e.formattedMessage).join(', ')}`);
  }

  // Use merged config
  this._config = result.mergedConfig;
  this._provenance = result.provenance;

  lcardsLog.debug('[SimpleCard] Config merged with provenance:', {
    sources: this._provenance.merge_order,
    colorSource: this._provenance.field_sources['style.color']
  });
}
```

---

### MSD Usage (Future Refactor)

```javascript
// src/msd/pipeline/ModelBuilder.js (Future state)

async buildModel(rawConfig) {
  const configManager = window.lcardsCore.configManager;

  // Use singleton instead of local merging logic
  const result = configManager.processConfig(
    rawConfig,
    'msd',
    { hass: this.hass }
  );

  if (!result.valid) {
    return { errors: result.errors };
  }

  // Build overlay model from merged config
  const cardModel = this._buildOverlayModel(result.mergedConfig);
  cardModel.__provenance = result.provenance;

  return cardModel;
}
```

---

## Implementation Roadmap

### Phase 1: Create CoreConfigManager (Week 1)

**Duration**: 3-4 days

**Tasks**:
1. Create `src/core/config-manager/index.js`
2. Implement `processConfig()` method
3. Implement `_buildMergeLayers()` method
4. Implement `_deepMergeWithProvenance()` method
5. Add to `lcardsCore` singleton registry
6. Write unit tests

**Files to Create**:
```
src/core/config-manager/
├── index.js              # CoreConfigManager class
├── MergeEngine.js        # Deep merge with provenance
└── TemplateResolver.js   # Template variable resolution
```

**Files to Modify**:
```
src/core/lcards-core.js   # Add configManager singleton
```

---

### Phase 2: Integrate with SimpleCard (Week 1-2)

**Duration**: 2-3 days

**Tasks**:
1. Update `LCARdSSimpleCard.setConfig()` to use `CoreConfigManager`
2. Register `simple-button` schema with `CoreValidationService`
3. Add provenance debugging support
4. Update tests to validate merged configs
5. Update documentation

**Files to Modify**:
```
src/base/LCARdSSimpleCard.js
src/cards/lcards-simple-button.js
```

**Benefits**:
- ✅ Validation catches config errors early
- ✅ Deep merging works correctly (no more shallow merge bugs)
- ✅ Provenance tracking for debugging
- ✅ Consistent with future card types

---

### Phase 3: MSD Refactor (Future - Week 4+)

**Duration**: 1-2 weeks

**Tasks**:
1. Extract MSD's `PackMerger` logic into `CoreConfigManager`
2. Migrate `ModelBuilder` to use `CoreConfigManager`
3. Update MSD schemas for `CoreValidationService`
4. Preserve all MSD features (overlay system, routing, etc.)
5. Comprehensive testing of MSD migration

**Files to Modify**:
```
src/msd/pipeline/ModelBuilder.js
src/msd/config/PackMerger.js (logic moves to CoreConfigManager)
```

**Challenges**:
- MSD has complex overlay-specific merging logic
- Must preserve backward compatibility
- Requires careful testing

---

## Schema Registration Strategy

### Card Types Register Their Own Schemas

```javascript
// src/cards/schemas/simple-button-schema.js
export const SimpleButtonSchema = {
  $id: 'simple-button-v1',
  type: 'object',
  required: ['type'],
  properties: {
    type: { type: 'string', enum: ['custom:lcards-simple-button'] },
    entity: { type: 'string', pattern: '^[a-z_]+\\.[a-z0-9_]+$' },
    preset: { 
      type: 'string', 
      enum: ['lozenge', 'bullet', 'picard', 'square', 'pill']
    },
    label: { type: 'string' },
    icon: { type: 'string' },
    style: { type: 'object' },
    // ... more properties
  }
};

// Register on module load
if (window.lcardsCore?.validationService) {
  window.lcardsCore.validationService.registerSchema('simple-button', SimpleButtonSchema);
}
```

---

### MSD Registers Its Schema

```javascript
// src/msd/schemas/msd-schema.js
export const MSDSchema = {
  $id: 'msd-v1',
  type: 'object',
  required: ['type'],
  properties: {
    type: { type: 'string', enum: ['custom:cb-lcars-card'] },
    overlays: { type: 'array', items: { type: 'object' } },
    base_svg: { type: 'string' },
    routing: { type: 'object' },
    rules: { type: 'array' },
    // ... more properties
  }
};

// Register on module load
if (window.lcardsCore?.validationService) {
  window.lcardsCore.validationService.registerSchema('msd', MSDSchema);
}
```

---

## Provenance Tracking Benefits

### Debug Output Example

```javascript
// After config processing
console.log(card._provenance);

// Output:
{
  merge_order: [
    'base_defaults',
    'theme_defaults',
    'preset_lozenge',
    'user_config'
  ],
  field_sources: {
    'style.color': 'user_config',
    'style.fontSize': 'preset_lozenge',
    'style.height': 'base_defaults',
    'style.textAlign': 'theme_defaults'
  }
}
```

**Use Cases**:
- User asks "Why is my button orange?" → Check `field_sources['style.color']` → "Came from user_config"
- User asks "Where did fontSize come from?" → Check `field_sources['style.fontSize']` → "Came from preset_lozenge"
- Debugging theme issues → See exactly which values come from theme vs preset

---

## Migration Path: MSD CardModel → CoreConfigManager

### Current MSD CardModel Structure

```javascript
// src/msd/pipeline/ModelBuilder.js
class CardModel {
  constructor() {
    this.overlays = [];
    this.viewBox = { width: 1000, height: 1000 };
    this.routing = {};
    this.rules = [];
    this.__provenance = {};
  }
}
```

**Key Features**:
- Overlay-specific structure (`overlays[]`)
- Routing configuration
- Rules integration
- Provenance tracking

---

### Future: CoreConfigManager Outputs CardModel

```javascript
// Future state (after MSD refactor)
const result = configManager.processConfig(rawConfig, 'msd', context);

// result.mergedConfig is now the "CardModel equivalent"
const cardModel = {
  overlays: result.mergedConfig.overlays,
  viewBox: result.mergedConfig.viewBox || { width: 1000, height: 1000 },
  routing: result.mergedConfig.routing || {},
  rules: result.mergedConfig.rules || [],
  __provenance: result.provenance
};
```

**Benefits**:
- Same CardModel structure, but built by singleton
- MSD-specific logic stays in MSD (overlay rendering, routing calculation)
- Config merging logic shared across all cards

---

## Key Architectural Decisions

### ✅ Decision 1: Extract to Singleton

**Rationale**: 
- Eliminates duplicate config merging logic
- Ensures consistent behavior across all cards
- Enables future cards to benefit immediately
- Centralized debugging and validation

**Alternative Rejected**: Keep card-specific merging
- Would require maintaining duplicate logic
- Would cause divergence between card types

---

### ✅ Decision 2: Card-Type Agnostic Design

**Rationale**:
- `CoreConfigManager` doesn't know about overlays, buttons, or MSD specifics
- Card types register their own schemas
- Merging logic is universal (base → theme → preset → user)

**Alternative Rejected**: MSD-specific manager
- Would not be reusable by SimpleCard
- Would require separate manager for each card type

---

### ✅ Decision 3: Provenance Tracking Always Enabled

**Rationale**:
- Minimal performance overhead
- Invaluable for debugging
- Enables future features (config diff, migration tools)

**Alternative Rejected**: Optional provenance
- Would complicate API
- Would lose debugging capability in production

---

### ✅ Decision 4: MSD Refactor is Phase 3 (Not Urgent)

**Rationale**:
- MSD works today (no critical bugs)
- SimpleCard needs validation/merging NOW (Phase 0 roadmap)
- MSD refactor is risky (complex system, many edge cases)
- Better to prove `CoreConfigManager` with SimpleCard first

**Timeline**:
- **Phase 1-2**: Build `CoreConfigManager`, integrate with SimpleCard (2 weeks)
- **Phase 3**: MSD refactor using proven singleton (future, 1-2 weeks)

---

## Testing Strategy

### Unit Tests

```javascript
// test/core/config-manager.test.js
describe('CoreConfigManager', () => {
  it('should merge base → preset → user configs', () => {
    const result = configManager.processConfig(
      { preset: 'lozenge', style: { color: 'red' } },
      'simple-button'
    );

    expect(result.mergedConfig.style.fontSize).toBe(20); // From base
    expect(result.mergedConfig.style.borderRadius).toBe(25); // From preset
    expect(result.mergedConfig.style.color).toBe('red'); // From user
  });

  it('should track provenance for all fields', () => {
    const result = configManager.processConfig(
      { preset: 'lozenge', style: { color: 'red' } },
      'simple-button'
    );

    expect(result.provenance.field_sources['style.color']).toBe('user_config');
    expect(result.provenance.field_sources['style.fontSize']).toBe('base_defaults');
    expect(result.provenance.field_sources['style.borderRadius']).toBe('preset_lozenge');
  });

  it('should validate against registered schema', () => {
    const result = configManager.processConfig(
      { preset: 'invalid_preset' },
      'simple-button'
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ type: 'invalid_enum' })
    );
  });
});
```

---

### Integration Tests

```javascript
// test/cards/simple-button-config.test.js
describe('SimpleCard Config Integration', () => {
  it('should merge preset + user config correctly', async () => {
    const card = await fixture(html`
      <lcards-simple-button
        .config=${{
          preset: 'lozenge',
          style: { color: 'red' }
        }}
      ></lcards-simple-button>
    `);

    const mergedConfig = card._config;
    expect(mergedConfig.style.fontSize).toBe(20); // From base
    expect(mergedConfig.style.color).toBe('red'); // From user
  });
});
```

---

## Performance Considerations

### Config Processing is Fast

**Typical Processing Time**: < 5ms for SimpleCard config

**Breakdown**:
- Schema validation: 1-2ms
- Layer building: < 1ms
- Deep merge: 1-2ms
- Template resolution: < 1ms

**Caching Strategy**:
- Cache validation results for identical configs
- Cache preset lookups
- Cache theme token resolution

---

## Documentation Requirements

### User-Facing Docs

1. **Config Validation Errors Guide**
   - Common errors and how to fix them
   - Validation error reference

2. **Config Merging Behavior**
   - Order of precedence (base → theme → preset → user)
   - How to override preset values
   - Provenance debugging guide

3. **Schema Reference**
   - Available properties for each card type
   - Valid values for enums
   - Required vs optional properties

---

### Developer Docs

1. **CoreConfigManager API Reference**
   - `processConfig()` method
   - Schema registration
   - Custom merge layers

2. **Migration Guide: MSD → CoreConfigManager**
   - How to refactor MSD cards
   - Backward compatibility strategy
   - Testing checklist

3. **Creating New Card Types**
   - How to register schemas
   - How to define base defaults
   - How to use `CoreConfigManager`

---

## Summary: What We're Doing

### ✅ Immediate (Phase 0-1, Weeks 1-2)

1. **Create `CoreConfigManager` singleton** (`src/core/config-manager/`)
2. **Integrate with `CoreValidationService`** (already exists)
3. **Update SimpleCard to use `CoreConfigManager`**
4. **Add schema for `simple-button`**

**Result**: SimpleCard has proper validation, deep merging, and provenance tracking.

---

### ⚠️ Future (Phase 3, Weeks 4+)

5. **Refactor MSD to use `CoreConfigManager`**
6. **Extract MSD's `PackMerger` logic**
7. **Migrate MSD schemas**

**Result**: All cards use the same config processing pipeline.

---

### 🎯 End State

**All LCARdS cards (SimpleCard, MSD, future cards) will**:
- ✅ Use `CoreConfigManager` for config processing
- ✅ Use `CoreValidationService` for validation
- ✅ Have consistent merge behavior (base → theme → preset → user)
- ✅ Track provenance for debugging
- ✅ Support pack-based configuration
- ✅ Have user-friendly validation errors

**MSD-specific concepts (overlays, routing, etc.) stay in MSD**. Only the **config merging pipeline** moves to singleton.

---

## Conclusion

This plan provides a clear path to **unified configuration processing** across all LCARdS card types:

1. **Phase 1**: Build `CoreConfigManager` singleton
2. **Phase 2**: Integrate with SimpleCard (proves the concept)
3. **Phase 3**: Refactor MSD to use singleton (eliminates duplicate logic)

**The architecture is card-type agnostic** - it doesn't know about overlays, buttons, or MSD specifics. It just knows how to merge configs and track provenance.

**MSD's CardModel concept evolves** from "MSD-specific merged config" to "output of CoreConfigManager for MSD card type". The structure stays the same, but the processing logic becomes shared.

---

**Document End**
