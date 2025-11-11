# CoreConfigManager - Final Architecture & Implementation Proposal

**Document Version**: 4.0 - FINAL (REVISED)  
**Date**: 2025-11-11  
**Author**: LCARdS Architecture Team  
**Status**: Ready for Implementation  
**Implementation Target**: Core Singleton System  
**Revision Notes**: Clarified separation of concerns - Card Defaults are BEHAVIORAL only, not style defaults. Style defaults come from Presets + Theme tokens.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Critical Architecture Clarification](#critical-architecture-clarification)
4. [Configuration Layer Hierarchy](#configuration-layer-hierarchy)
5. [Architectural Decisions](#architectural-decisions)
6. [CoreConfigManager Design](#coreconfigmanager-design)
7. [Implementation Plan](#implementation-plan)
8. [Schema Registration Pattern](#schema-registration-pattern)
9. [Usage Examples](#usage-examples)
10. [MSD Migration Path](#msd-migration-path)
11. [Testing Strategy](#testing-strategy)
12. [Success Criteria](#success-criteria)

---

## Executive Summary

This proposal finalizes the architecture for **CoreConfigManager** - the last MSD system to be extracted into the LCARdS Core singleton infrastructure. This manager provides unified configuration processing for all card types (SimpleCard, MSD, future cards) while eliminating parallel systems and ensuring consistency across the codebase.

### What We're Building

A **lightweight facade** that coordinates existing proven systems:
- **Existing**: `mergePacks` (src/core/packs/mergePacks.js) - Deep config merging with provenance
- **Existing**: `CoreValidationService` (src/core/validation-service/) - Schema validation with error formatting
- **Existing**: `StylePresetManager` (src/core/presets/) - Named style configurations with theme token support
- **Existing**: `ThemeManager` (src/core/themes/) - Theme token resolution and component defaults
- **NEW**: `CoreConfigManager` - Card-type-agnostic API that orchestrates these systems

### Key Requirements

1. ✅ **MSD MUST use core singletons** - No parallel config systems
2. ✅ **All provenance tracking preserved** - Leverages existing `mergePacks` provenance
3. ✅ **Cards self-register schemas** - Schemas ship with card implementations
4. ✅ **Consistent API** - Same config processing for SimpleCard, MSD, future cards
5. ✅ **Backward compatible** - Existing MSD configs continue to work
6. ✅ **Clear separation of concerns** - Card defaults are BEHAVIORAL, not style

---

## Current State Analysis

### What's Already Complete ✅

#### 1. Core Singleton Infrastructure (`src/core/lcards-core.js`)

All major MSD systems have been extracted to core singletons:

```javascript
// Already available in window.lcardsCore
{
  systemsManager: CoreSystemsManager,      // Entity state tracking
  dataSourceManager: DataSourceManager,    // Real MSD DataSourceManager
  rulesManager: RulesEngine,               // Real MSD RulesEngine
  themeManager: ThemeManager,              // Real MSD ThemeManager with packs
  animationManager: AnimationManager,      // Animation coordination
  validationService: CoreValidationService,// Config validation
  stylePresetManager: StylePresetManager,  // Style presets + CSS utilities
  animationRegistry: AnimationRegistry,    // Animation instance caching
  actionHandler: LCARdSActionHandler      // Unified action handling
}
```

#### 2. Config Merging System (`src/core/packs/mergePacks.js`)

**Already implements comprehensive config merging** with full provenance tracking (~700 lines of proven code).

#### 3. Validation System (`src/core/validation-service/index.js`)

**Already implements schema validation** with user-friendly error formatting (~600 lines).

#### 4. Style Preset System (`src/core/presets/StylePresetManager.js`)

**Already implements named style configurations** that can reference theme tokens:

```javascript
// Example: Button presets
button: {
  lozenge: {
    borderRadius: 25,
    fontSize: 20,
    color: 'theme:colors.accent.primary',  // ← Theme token reference
    height: 'theme:components.button.defaultHeight'
  },
  bullet: {
    borderRadius: 40,
    fontSize: 18,
    color: 'theme:colors.accent.secondary'
  }
}
```

#### 5. Theme System (`src/core/themes/ThemeManager.js`)

**Already implements theme token resolution** and component-level defaults:

```javascript
// Example: Theme structure
{
  colors: {
    accent: {
      primary: '#ff9966',
      secondary: '#99ccff'
    }
  },
  components: {
    button: {
      defaultHeight: 45,
      defaultColor: 'theme:colors.accent.primary'
    },
    text: {
      defaultFontSize: 16
    }
  }
}
```

---

## Critical Architecture Clarification

### The Confusion: What Are "Card Defaults"?

**Problem Identified**: The original proposal suggested shipping style defaults (height, fontSize, etc.) in CoreConfigManager. This creates overlap with:
- Theme component defaults
- Style presets
- Theme tokens

**Resolution**: Card defaults in CoreConfigManager are **BEHAVIORAL ONLY**, not style defaults.

### Clear Separation of Concerns

| System | Purpose | Example Values | Contains Styles? |
|--------|---------|----------------|------------------|
| **Card Defaults** (CoreConfigManager) | Behavioral flags & feature toggles | `show_label: true`, `show_icon: false`, `enable_hold_action: true` | ❌ NO |
| **Theme Component Defaults** (ThemeManager) | Component-level style base | `defaultHeight: 45`, `defaultColor: 'theme:colors.accent.primary'` | ✅ YES |
| **Style Presets** (StylePresetManager) | Named style configurations | `lozenge: { borderRadius: 25, fontSize: 20 }` | ✅ YES |
| **User Config** | User overrides | `preset: 'lozenge'`, `style: { color: 'red' }` | ✅ YES |

**Key Principle**: 
- ✅ **Card Defaults** = Behavior (show/hide, enable/disable features)
- ✅ **Theme + Presets** = Style (colors, sizes, fonts)
- ✅ **User Config** = Overrides for both

---

## Configuration Layer Hierarchy

### Static Configuration Layers (Build Time)

These layers are merged by CoreConfigManager during `processConfig()`:

```
┌─────────────────────────────────────────────────────────────────┐
│  Layer 1: CARD DEFAULTS (Lowest Priority - Behavioral Base)    │
│  Source: CoreConfigManager.registerCardDefaults()              │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  {                                                         │ │
│  │    show_label: true,        ← Behavioral                  │ │
│  │    show_icon: false,        ← Behavioral                  │ │
│  │    enable_hold_action: true ← Behavioral                  │ │
│  │  }                                                         │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Layer 2: THEME DEFAULTS (Low Priority - Component Style Base) │
│  Source: ThemeManager.getDefault('button', 'base')             │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  {                                                         │ │
│  │    style: {                                                │ │
│  │      height: 45,                     ← Static value       │ │
│  │      color: 'theme:colors.accent.primary' ← Token         │ │
│  │    }                                                       │ │
│  │  }                                                         │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Layer 3: PRESET (Medium Priority - Named Style Config)        │
│  Source: StylePresetManager.getPreset('button', 'lozenge')    │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  {                                                         │ │
│  │    style: {                                                │ │
│  │      borderRadius: 25,               ← Static value       │ │
│  │      fontSize: 20,                   ← Static value       │ │
│  │      color: 'theme:colors.accent.primary' ← Token         │ │
│  │    }                                                       │ │
│  │  }                                                         │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Layer 4: USER CONFIG (Highest Static Priority - User Override)│
│  Source: User's YAML configuration                             │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  {                                                         │ │
│  │    type: 'custom:lcards-simple-button',                   │ │
│  │    preset: 'lozenge',                                      │ │
│  │    label: 'My Button',                                     │ │
│  │    show_icon: true,                  ← Override behavior  │ │
│  │    style: {                                                │ │
│  │      color: 'red'                    ← Override style     │ │
│  │    }                                                       │ │
│  │  }                                                         │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                            ▼
                    ┌───────────────┐
                    │  Theme Token  │
                    │  Resolution   │
                    └───────────────┘
                            ▼
                ┌──────────────────────┐
                │  MERGED CONFIG       │
                │  (Static Complete)   │
                └──────────────────────┘
```

### Runtime Dynamic Layer (Highest Priority)

**After static merge, Rules Engine applies live patches**:

```
┌─────────────────────────────────────────────────────────────────┐
│  Layer 5: RULES ENGINE PATCHES (Runtime - Highest Priority)    │
│  Source: RulesEngine.evaluateDirty() → overlayPatches          │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Rules trigger based on entity state changes:             │ │
│  │                                                            │ │
│  │  IF entity.state === 'on':                                │ │
│  │    PATCH overlay 'my_button':                             │ │
│  │      style.color = 'green'                                │ │
│  │      style.status_indicator = 'active'                    │ │
│  │                                                            │ │
│  │  IF entity.state === 'off':                               │ │
│  │    PATCH overlay 'my_button':                             │ │
│  │      style.color = 'gray'                                 │ │
│  │      style.status_indicator = 'inactive'                  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Applied by: ModelBuilder._applyOverlayPatches()               │
│  Timing: Every render cycle (after entity state changes)       │
│  Priority: OVERRIDES ALL STATIC CONFIG                         │
└─────────────────────────────────────────────────────────────────┘
                            ▼
                ┌──────────────────────┐
                │  FINAL RUNTIME       │
                │  CONFIG WITH PATCHES │
                └──────────────────────┘
```

### Complete Merge Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     CONFIG PROCESSING FLOW                      │
└─────────────────────────────────────────────────────────────────┘

  User writes YAML
       │
       ▼
┌─────────────────┐
│  User Config    │  ← preset: 'lozenge', style: { color: 'red' }
└─────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│               CoreConfigManager.processConfig()                 │
│                                                                 │
│  Step 1: Load Card Defaults (Behavioral)                       │
│         ↓                                                       │
│  Step 2: Load Theme Defaults (Component Style Base)            │
│         ↓                                                       │
│  Step 3: Load Preset (Named Style Config)                      │
│         ↓                                                       │
│  Step 4: Deep Merge (Card → Theme → Preset → User)            │
│         ↓                                                       │
│  Step 5: Resolve Theme Tokens ('theme:colors.accent.primary') │
│         ↓                                                       │
│  Step 6: Validate Against Schema                               │
│         ↓                                                       │
│  Step 7: Return { mergedConfig, provenance, errors }           │
└─────────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────┐
│  Merged Config  │  ← All static layers merged, tokens resolved
└─────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Card Initialization                          │
│  this._config = result.mergedConfig                            │
│  this._provenance = result.provenance                          │
└─────────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RUNTIME (Every Render)                       │
│                                                                 │
│  1. Entity state changes                                        │
│         ↓                                                       │
│  2. RulesEngine.evaluateDirty()                                │
│         ↓                                                       │
│  3. Generate overlay patches                                    │
│         ↓                                                       │
│  4. ModelBuilder._applyOverlayPatches()                        │
│         ↓                                                       │
│  5. Patches OVERRIDE static config                             │
│         ↓                                                       │
│  6. Renderer uses patched config                               │
└─────────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────┐
│  Rendered Card  │  ← Final visual state with live patches
└─────────────────┘


PRIORITY HIERARCHY (Low → High):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Card Defaults (Behavioral)     ← show_label: true
2. Theme Defaults (Style Base)    ← height: 45
3. Preset (Named Style)           ← borderRadius: 25
4. User Config (Static Override)  ← color: 'red'
5. Rules Patches (Runtime)        ← color: 'green' (when on) ← HIGHEST
```

---

## Architectural Decisions

### Decision 1: CoreConfigManager is a Facade ✅

**Rationale**:
- `mergePacks`, `CoreValidationService`, `StylePresetManager`, `ThemeManager` already do the heavy lifting
- CoreConfigManager orchestrates these systems with a unified API (~400 lines)
- Avoids duplicating complex, proven logic
- Enables consistent config processing across all cards

**Implementation Impact**: LOW
- Wraps existing systems
- No rewrite required
- Most complexity already solved

---

### Decision 2: Card Defaults Are BEHAVIORAL Only ✅

**Rationale**:
- Style defaults belong in **Presets** (can reference theme tokens, resolved by theme system)
- Behavioral defaults belong in **CoreConfigManager** (show/hide, enable/disable)
- Prevents confusion and overlap
- Clear separation of concerns

**Examples**:

```javascript
// ✅ CORRECT: Card defaults are behavioral
registerCardDefaults('simple-button', {
  show_label: true,
  show_icon: false,
  enable_hold_action: true,
  enable_double_tap: false
});

// ❌ WRONG: Don't put styles in card defaults
registerCardDefaults('simple-button', {
  style: {
    height: 45,        // ← Should be in theme or preset
    fontSize: 20       // ← Should be in theme or preset
  }
});
```

**Where Styles Come From**:
- **Theme Component Defaults**: `ThemeManager.getDefault('button', 'base')`
- **Presets**: `StylePresetManager.getPreset('button', 'lozenge')`
- **User Config**: User's YAML `style: { color: 'red' }`

---

### Decision 3: MSD MUST Use Core Singletons ✅

**Rationale**:
- Eliminates parallel systems
- Ensures consistency
- Single source of truth for config processing
- Easier maintenance and debugging

**Current State**: MSD uses `mergePacks` directly but doesn't expose unified API

**Target State**: MSD uses `CoreConfigManager.processConfig()`

---

### Decision 4: Cards Self-Register Schemas ✅

**Rationale**:
- Schema lives with card implementation (single source of truth)
- Adding new cards doesn't require core changes
- Follows "open for extension" principle
- Schema versioning per card

---

### Decision 5: Rules Engine Has Highest Runtime Priority ✅

**Rationale**:
- Rules must be able to override ANY static config for live state reflection
- Entity state changes → Rules evaluate → Patches apply → Visual update
- This is existing behavior, just documenting it explicitly

**Example**:
```javascript
// Static config says button is red
mergedConfig.style.color = 'red';

// But at runtime, entity turns on → Rule fires
rule: {
  conditions: [{ entity: 'light.living_room', state: 'on' }],
  actions: [{ 
    overlay: 'my_button',
    changes: { style: { color: 'green' } }  // ← OVERRIDES static 'red'
  }]
}

// Final rendered color: green (when light is on)
```

**Priority Order**:
1. Card Defaults (lowest)
2. Theme Defaults
3. Preset
4. User Config
5. **Rules Patches** ← HIGHEST (runtime only)

---

### Decision 6: All Provenance Preserved ✅

**Guarantee**: CoreConfigManager wraps `mergePacks`, so all provenance tracking is preserved

**Provenance Structure**:
```javascript
{
  merge_order: [
    'card_defaults',      // show_label: true, show_icon: false
    'theme_defaults',     // defaultHeight: 45, defaultColor: token
    'preset_lozenge',     // borderRadius: 25, fontSize: 20
    'user_config'         // color: red, label: 'My Button'
  ],
  field_sources: {
    'show_label': 'card_defaults',
    'show_icon': 'card_defaults',
    'style.height': 'theme_defaults',
    'style.borderRadius': 'preset_lozenge',
    'style.fontSize': 'preset_lozenge',
    'style.color': 'user_config',
    'label': 'user_config'
  },
  theme: { /* theme selection provenance */ },
  packs: { /* pack loading info */ }
}
```

---

## CoreConfigManager Design

### Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│           window.lcardsCore (Singleton Registry)             │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │      CoreConfigManager (NEW - ~400 lines)              │  │
│  │                                                         │  │
│  │  Orchestrates:                                         │  │
│  │  ┌─ processConfig(config, cardType, context)          │  │
│  │  ├─ registerCardSchema(type, schema)                  │  │
│  │  ├─ registerCardDefaults(type, defaults)              │  │
│  │  └─ getDebugInfo()                                     │  │
│  │                                                         │  │
│  │         │           │            │            │         │  │
│  │         ▼           ▼            ▼            ▼         │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │  │
│  │  │mergePacks│ │Validation│ │  Preset  │ │  Theme   │ │  │
│  │  │ (exists) │ │ (exists) │ │  Manager │ │ Manager  │ │  │
│  │  │~700 lines│ │~600 lines│ │ (exists) │ │ (exists) │ │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                           ▲
                           │ All cards use unified API
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼──────┐  ┌────────▼────────┐  ┌─────▼──────┐
│ SimpleButton │  │   MSD Card      │  │  Future    │
│              │  │                 │  │  Cards     │
│ Self-        │  │ Uses            │  │ Self-      │
│ registers    │  │ CoreConfigMgr   │  │ register   │
│ schema       │  │ (migrated)      │  │ schema     │
└──────────────┘  └─────────────────┘  └────────────┘
```

### File Structure

```
src/core/config-manager/
├── index.js                    # CoreConfigManager class (main implementation)
├── merge-helpers.js            # Layer merging utilities
└── README.md                   # Usage documentation
```

### API Design

```javascript
/**
 * CoreConfigManager - Unified configuration processing facade
 * 
 * Orchestrates existing systems (mergePacks, CoreValidationService, 
 * StylePresetManager, ThemeManager) to provide card-type-agnostic 
 * config processing with validation, merging, and provenance tracking.
 * 
 * KEY PRINCIPLE: Card defaults are BEHAVIORAL only (show/hide, enable/disable).
 *                Style defaults come from Theme + Presets.
 */
export class CoreConfigManager {
  /**
   * Process card configuration
   * 
   * Merge order:
   * 1. Card defaults (behavioral: show_label, etc.)
   * 2. Theme defaults (style base: defaultHeight, tokens)
   * 3. Preset (named style: borderRadius, fontSize)
   * 4. User config (overrides)
   * 5. Resolve theme tokens
   * 6. Validate
   * 
   * @param {Object} userConfig - Raw config from YAML/UI
   * @param {string} cardType - Card type identifier ('simple-button', 'msd', etc.)
   * @param {Object} context - Additional context { hass, entity, ... }
   * @returns {Promise<ConfigResult>} Result with merged config, validation, provenance
   */
  async processConfig(userConfig, cardType, context = {});

  /**
   * Register card type schema (for validation)
   */
  registerCardSchema(cardType, schema, options = {});

  /**
   * Register card type BEHAVIORAL defaults
   * 
   * ⚠️ BEHAVIORAL ONLY: show_label, show_icon, enable_hold_action, etc.
   * ❌ NOT FOR STYLES: Use Theme + Presets for style defaults
   */
  registerCardDefaults(cardType, defaults);

  /**
   * Get debug information
   */
  getDebugInfo();
}
```

---

## Implementation Plan

### Phase 1: Create CoreConfigManager (2-3 days)

#### Task 1.1: Implement Core Class

**File**: `src/core/config-manager/index.js`

**Key Implementation Points**:

1. **BEHAVIORAL defaults only** (no style defaults)
2. **Four-layer merge**: Card Defaults → Theme Defaults → Preset → User Config
3. **Preset lookup** via StylePresetManager
4. **Theme token resolution** via ThemeManager
5. **Validation** via CoreValidationService
6. **Provenance tracking** for all layers

**Implementation Skeleton**:

```javascript
/**
 * @fileoverview CoreConfigManager - Unified configuration processing facade
 */

import { lcardsLog } from '../../utils/lcards-logging.js';
import { mergePacks } from '../packs/mergePacks.js';

export class CoreConfigManager {
  constructor() {
    this.validationService = null;
    this.themeManager = null;
    this.stylePresetManager = null;
    
    // Card-specific configuration (BEHAVIORAL ONLY)
    this._cardSchemas = new Map();
    this._cardDefaults = new Map();  // ← BEHAVIORAL: show_label, etc.
    
    this.initialized = false;
  }

  async initialize(singletons) {
    this.validationService = singletons.validationService;
    this.themeManager = singletons.themeManager;
    this.stylePresetManager = singletons.stylePresetManager;
    
    this._registerBuiltinCardTypes();
    this.initialized = true;
    
    lcardsLog.info('[CoreConfigManager] ✅ Initialized');
  }

  /**
   * Process card configuration (main entry point)
   * 
   * Four-layer merge:
   * 1. Card defaults (behavioral)
   * 2. Theme defaults (component style base)
   * 3. Preset (named style config)
   * 4. User config (overrides)
   * 
   * Then: Resolve theme tokens → Validate
   */
  async processConfig(userConfig, cardType, context = {}) {
    lcardsLog.debug(`[CoreConfigManager] Processing config for ${cardType}`);

    try {
      // STEP 1: Get behavioral defaults
      const behavioralDefaults = this._getCardDefaults(cardType);

      // STEP 2: Get theme component defaults (style base)
      let themeDefaults = {};
      if (this.themeManager && this.themeManager.initialized) {
        const componentType = this._mapCardTypeToComponent(cardType);
        const themeDef = this.themeManager.getDefault(componentType, 'base');
        if (themeDef) {
          themeDefaults = { style: themeDef };  // Nest under 'style'
        }
      }

      // STEP 3: Get preset (if specified in user config)
      let presetConfig = {};
      if (userConfig.preset && this.stylePresetManager) {
        const overlayType = this._mapCardTypeToOverlay(cardType);
        const preset = this.stylePresetManager.getPreset(overlayType, userConfig.preset);
        if (preset) {
          // Presets can have nested 'style' or be flat
          presetConfig = preset.style ? preset : { style: preset };
        }
      }

      // STEP 4: Check if MSD-style pack merging needed
      let mergedConfig;
      let provenance;
      
      if (this._usePackMerging(cardType, userConfig)) {
        // MSD: Full pack merging (preserves all provenance)
        mergedConfig = await mergePacks(userConfig);
        provenance = mergedConfig.__provenance;
      } else {
        // SimpleCard: Four-layer merge
        mergedConfig = this._fourLayerMerge(
          behavioralDefaults,
          themeDefaults,
          presetConfig,
          userConfig
        );
        provenance = this._createProvenance(
          behavioralDefaults,
          themeDefaults,
          presetConfig,
          userConfig,
          cardType
        );
      }

      // STEP 5: Resolve theme tokens in final merged config
      if (this.themeManager && this.themeManager.initialized) {
        this._resolveThemeTokens(mergedConfig, cardType);
      }

      // STEP 6: Validate against schema
      const validation = this._validateConfig(mergedConfig, cardType, context);

      // STEP 7: Return complete result
      return {
        valid: validation.valid,
        mergedConfig,
        errors: validation.errors,
        warnings: validation.warnings,
        provenance
      };

    } catch (error) {
      lcardsLog.error(`[CoreConfigManager] Processing failed:`, error);
      return {
        valid: false,
        mergedConfig: userConfig,
        errors: [{ 
          type: 'processing_error', 
          message: error.message,
          formattedMessage: `Config processing failed: ${error.message}`
        }],
        warnings: [],
        provenance: null
      };
    }
  }

  /**
   * Four-layer deep merge: behavioral → theme → preset → user
   * @private
   */
  _fourLayerMerge(behavioral, theme, preset, user) {
    // Deep merge each layer in order
    let result = this._deepMerge({}, behavioral);
    result = this._deepMerge(result, theme);
    result = this._deepMerge(result, preset);
    result = this._deepMerge(result, user);
    return result;
  }

  /**
   * Deep merge helper (recursive)
   * @private
   */
  _deepMerge(target, source) {
    const result = { ...target };
    
    for (const [key, value] of Object.entries(source)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        // Nested object - recurse
        result[key] = this._deepMerge(result[key] || {}, value);
      } else {
        // Primitive or array - overwrite
        result[key] = value;
      }
    }
    
    return result;
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

    // Track layers
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

    // Track field sources (simplified - full implementation would be more detailed)
    this._trackFieldSources(provenance.field_sources, {
      behavioral, theme, preset, user
    }, '');

    return provenance;
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
        const tokenPath = value.substring(6);
        obj[key] = resolveToken(tokenPath, value);
      } else if (typeof value === 'object' && value !== null) {
        this._walkAndResolveTokens(value, resolveToken);
      }
    }
  }

  /**
   * Register builtin card types (BEHAVIORAL defaults only)
   * @private
   */
  _registerBuiltinCardTypes() {
    // Simple Button: BEHAVIORAL defaults only
    this.registerCardDefaults('simple-button', {
      show_label: true,           // ✅ Behavioral
      show_icon: false,           // ✅ Behavioral
      enable_hold_action: true,   // ✅ Behavioral
      enable_double_tap: false    // ✅ Behavioral
      // ❌ NO STYLE DEFAULTS - those come from Theme + Presets
    });

    // Simple Label
    this.registerCardDefaults('simple-label', {
      show_label: true,
      show_name: true
    });
  }

  // ... other methods (registerCardSchema, _validateConfig, etc.)
}
```

**See full implementation in original proposal sections for complete code.**

#### Task 1.2: Integrate with lcardsCore

**File**: `src/core/lcards-core.js`

**Changes** (same as original proposal):
- Add import
- Add to constructor
- Initialize after ValidationService
- Add to cardContext
- Add to debug info
- Add to destroy

#### Task 1.3: Create Documentation

**File**: `src/core/config-manager/README.md`

Include clarification about behavioral vs. style defaults:

```markdown
# CoreConfigManager

## Key Principle: Behavioral vs. Style Defaults

### ✅ Card Defaults = BEHAVIORAL ONLY
- `show_label: true` - Whether to display label
- `show_icon: false` - Whether to display icon
- `enable_hold_action: true` - Whether hold action is enabled

### ❌ Card Defaults ≠ STYLE
Style defaults come from:
- **Theme Component Defaults**: `ThemeManager.getDefault('button', 'base')`
- **Presets**: `StylePresetManager.getPreset('button', 'lozenge')`

## Four-Layer Merge

1. **Card Defaults** (Behavioral base)
2. **Theme Defaults** (Component style base with tokens)
3. **Preset** (Named style configuration)
4. **User Config** (Overrides)

Then: Resolve theme tokens → Validate → Return

## Runtime: Rules Engine

After static merge, RulesEngine applies live patches with HIGHEST priority:
- Entity state changes
- Rules evaluate
- Patches override ALL static config
- Visual updates reflect live state
```

---

### Phase 2: Integrate with SimpleCard (2-3 days)

#### Task 2.1: Update SimpleCard Base Class

**File**: `src/base/LCARdSSimpleCard.js`

Update `setConfig` to use CoreConfigManager (same as original proposal).

#### Task 2.2: Update Simple Button with Schema Registration

**File**: `src/cards/lcards-simple-button.js`

**Key Change**: Remove style defaults from card defaults

```javascript
// ✅ CORRECT: Behavioral defaults only
const SIMPLE_BUTTON_DEFAULTS = {
  show_label: true,
  show_icon: false,
  enable_hold_action: true,
  enable_double_tap: false
  // ❌ NO STYLES HERE - they come from Theme + Presets
};

// Self-register
if (window.lcardsCore?.configManager) {
  window.lcardsCore.configManager.registerCardDefaults(
    'simple-button',
    SIMPLE_BUTTON_DEFAULTS
  );
}
```

**Style defaults should be in**:
1. **Theme** (`src/core/themes/packs/builtin_themes.js`):
```javascript
components: {
  button: {
    defaultHeight: 45,
    defaultColor: 'theme:colors.accent.primary'
  }
}
```

2. **Presets** (`src/core/presets/packs/lcards_buttons.js`):
```javascript
button: {
  lozenge: {
    borderRadius: 25,
    fontSize: 20,
    color: 'theme:colors.accent.primary'
  }
}
```

---

### Phase 3: MSD Migration (2-3 days)

Same as original proposal - update ConfigProcessor to use CoreConfigManager.

---

## Schema Registration Pattern

Same as original proposal - cards self-register schemas when module loads.

---

## Usage Examples

### Example 1: Simple Button with Full Layer Resolution

```javascript
// 1. CARD DEFAULTS (Behavioral)
registerCardDefaults('simple-button', {
  show_label: true,
  show_icon: false
});

// 2. THEME DEFAULTS (Component Style Base)
// From ThemeManager (builtin_themes pack)
theme.components.button = {
  defaultHeight: 45,
  defaultColor: 'theme:colors.accent.primary'  // Token: '#ff9966'
};

// 3. PRESET (Named Style Config)
// From StylePresetManager (lcards_buttons pack)
presets.button.lozenge = {
  borderRadius: 25,
  fontSize: 20,
  color: 'theme:colors.accent.primary'
};

// 4. USER CONFIG
const userConfig = {
  type: 'custom:lcards-simple-button',
  preset: 'lozenge',
  entity: 'light.living_room',
  label: 'Living Room',
  show_icon: true,  // Override behavioral default
  style: {
    color: 'red'    // Override preset color
  }
};

// RESULT AFTER CoreConfigManager.processConfig():
{
  type: 'custom:lcards-simple-button',
  entity: 'light.living_room',
  label: 'Living Room',
  preset: 'lozenge',
  show_label: true,        // From card defaults
  show_icon: true,         // From user config (overrides default false)
  style: {
    height: 45,            // From theme defaults
    borderRadius: 25,      // From preset
    fontSize: 20,          // From preset
    color: 'red'           // From user config (overrides preset)
  }
}

// PROVENANCE:
{
  merge_order: ['card_defaults', 'theme_defaults', 'preset_lozenge', 'user_config'],
  field_sources: {
    'show_label': 'card_defaults',
    'show_icon': 'user_config',
    'style.height': 'theme_defaults',
    'style.borderRadius': 'preset_lozenge',
    'style.fontSize': 'preset_lozenge',
    'style.color': 'user_config'
  }
}
```

### Example 2: Runtime Rules Override

```javascript
// After static merge, button color is 'red' (from user config)
mergedConfig.style.color = 'red';

// Entity is light.living_room, currently OFF
entity.state = 'off';

// But Rules Engine has a rule:
rules: [{
  conditions: [{ entity: 'light.living_room', state: 'on' }],
  actions: [{ 
    overlay: 'living_room_button',
    changes: { 
      style: { 
        color: 'green',              // ← OVERRIDE static red
        status_indicator: 'active'
      }
    }
  }]
}];

// At runtime, when light turns ON:
// 1. Entity state changes: entity.state = 'on'
// 2. RulesEngine evaluates: Rule matches!
// 3. Patch generated: { style: { color: 'green', status_indicator: 'active' } }
// 4. ModelBuilder applies patch: finalStyle.color = 'green' (OVERRIDES red)
// 5. Renderer displays button in green

// PRIORITY ORDER AT RUNTIME:
// User config: color = 'red' (priority 4)
// Rules patch: color = 'green' (priority 5) ← WINS!
// Final render: GREEN button
```

---

## Testing Strategy

### Unit Tests

**File**: `test/unit/core/config-manager.test.js`

```javascript
describe('CoreConfigManager - Layer Merging', () => {
  it('should apply four-layer merge correctly', async () => {
    // Setup: Card defaults, theme defaults, preset, user config
    configManager.registerCardDefaults('test-card', {
      show_label: true    // Behavioral
    });
    
    mockThemeManager.getDefault = () => ({
      defaultHeight: 45   // Style from theme
    });
    
    mockStylePresetManager.getPreset = () => ({
      style: {
        borderRadius: 25,  // Style from preset
        fontSize: 20
      }
    });
    
    const userConfig = {
      preset: 'test-preset',
      style: { color: 'red' }  // User override
    };
    
    const result = await configManager.processConfig(userConfig, 'test-card', {});
    
    // Verify merge
    expect(result.mergedConfig.show_label).toBe(true);        // From card defaults
    expect(result.mergedConfig.style.height).toBe(45);        // From theme
    expect(result.mergedConfig.style.borderRadius).toBe(25);  // From preset
    expect(result.mergedConfig.style.fontSize).toBe(20);      // From preset
    expect(result.mergedConfig.style.color).toBe('red');      // From user
    
    // Verify provenance
    expect(result.provenance.field_sources['show_label']).toBe('card_defaults');
    expect(result.provenance.field_sources['style.color']).toBe('user_config');
  });

  it('should NOT include styles in card defaults', () => {
    // Anti-pattern test
    configManager.registerCardDefaults('test-card', {
      show_label: true,
      style: { height: 45 }  // ← This should NOT be done
    });
    
    // Card defaults should be behavioral only
    const defaults = configManager._getCardDefaults('test-card');
    expect(defaults.show_label).toBe(true);  // ✅ OK
    expect(defaults.style).toBeUndefined();  // ✅ Should not have styles
  });
});

describe('CoreConfigManager - Theme Token Resolution', () => {
  it('should resolve theme tokens after merge', async () => {
    mockStylePresetManager.getPreset = () => ({
      style: {
        color: 'theme:colors.accent.primary'  // Token
      }
    });
    
    mockThemeManager.resolver.forComponent = () => (token) => {
      if (token === 'colors.accent.primary') return '#ff9966';
      return token;
    };
    
    const result = await configManager.processConfig(
      { preset: 'test' }, 
      'test-card', 
      {}
    );
    
    // Token should be resolved
    expect(result.mergedConfig.style.color).toBe('#ff9966');
  });
});
```

### Integration Tests

Test complete flow with real cards:

```javascript
describe('SimpleButton - Full Config Flow', () => {
  it('should merge all layers and resolve tokens', async () => {
    // Setup real systems
    const card = await fixture(html`
      <lcards-simple-button
        .config=${{
          preset: 'lozenge',
          label: 'Test',
          style: { color: 'red' }
        }}
      ></lcards-simple-button>
    `);

    // Verify merged config
    expect(card._config.show_label).toBe(true);        // Card default
    expect(card._config.style.height).toBe(45);        // Theme default
    expect(card._config.style.borderRadius).toBe(25);  // Preset
    expect(card._config.style.color).toBe('red');      // User override
    
    // Verify provenance
    expect(card._provenance.field_sources['show_label']).toBe('card_defaults');
  });
});
```

---

## Success Criteria

### Phase 1: CoreConfigManager Created ✅
- [ ] `src/core/config-manager/index.js` implemented
- [ ] Integrated with `lcardsCore` singleton
- [ ] Four-layer merge working (behavioral → theme → preset → user)
- [ ] Theme token resolution working
- [ ] Unit tests passing
- [ ] Documentation complete

### Phase 2: SimpleCard Integration ✅
- [ ] `LCARdSSimpleCard.setConfig()` uses CoreConfigManager
- [ ] `lcards-simple-button` registers schema and behavioral defaults
- [ ] No style defaults in card defaults (only behavioral)
- [ ] Preset lookup working
- [ ] Theme token resolution working in real cards
- [ ] Integration tests passing

### Phase 3: MSD Migration ✅
- [ ] `ConfigProcessor.processAndValidateConfig()` uses CoreConfigManager
- [ ] MSD schema registered
- [ ] Provenance tracking preserved
- [ ] All MSD tests passing
- [ ] Backward compatibility verified

### Overall Success ✅
- [ ] All cards use single config processing API
- [ ] Clear separation: Behavioral defaults vs. Style defaults
- [ ] Rules Engine can override any static config at runtime
- [ ] Provenance tracking complete
- [ ] Zero regressions in existing functionality

---

## Appendix: Complete Priority Hierarchy

### Static Configuration (Build Time)

| Priority | Layer | Source | Example Values | Type |
|----------|-------|--------|----------------|------|
| 1 (Lowest) | Card Defaults | CoreConfigManager | `show_label: true` | Behavioral |
| 2 | Theme Defaults | ThemeManager | `defaultHeight: 45` | Style |
| 3 | Preset | StylePresetManager | `borderRadius: 25` | Style |
| 4 | User Config | YAML | `color: 'red'` | Both |

### Runtime Configuration (Every Render)

| Priority | Layer | Source | Example Values | Type |
|----------|-------|--------|----------------|------|
| 5 (Highest) | Rules Patches | RulesEngine | `color: 'green'` (when on) | Style |

**Key Insight**: Rules patches have FINAL SAY at runtime, overriding all static config.

---

## Document Change Log

- **v1.0** (2025-11-11): Initial proposal
- **v2.0** (2025-11-11): Added MSD migration path
- **v3.0** (2025-11-11): Clarified schema registration pattern
- **v4.0** (2025-11-11): **MAJOR REVISION**
  - Clarified Card Defaults are BEHAVIORAL only (no styles)
  - Added four-layer merge flow diagram
  - Documented Rules Engine as highest runtime priority
  - Updated all examples to reflect behavioral vs. style separation
  - Added complete priority hierarchy table

---

**Document End**
