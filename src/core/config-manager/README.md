# CoreConfigManager

**Version:** 1.0
**Module:** `src/core/config-manager/index.js`
**Status:** ✅ Production Ready

## Overview

CoreConfigManager provides unified configuration processing for all LCARdS card types (LCARdS Card, MSD, future cards). It orchestrates existing systems (mergePacks, CoreValidationService, StylePresetManager, ThemeManager) through a consistent API.

## Key Principle: Behavioral vs. Style Defaults

### ✅ Card Defaults = BEHAVIORAL ONLY

Card defaults registered in CoreConfigManager should **only** contain behavioral flags and feature toggles:

```javascript
// ✅ CORRECT: Behavioral defaults
configManager.registerCardDefaults('simple-button', {
  show_label: true,           // Whether to display label
  show_icon: false,           // Whether to display icon
  enable_hold_action: true,   // Whether hold action is enabled
  enable_double_tap: false    // Whether double-tap is enabled
});
```

### ❌ Card Defaults ≠ STYLE

Style defaults belong in Theme or Presets, **not** card defaults:

```javascript
// ❌ WRONG: Don't put styles in card defaults
configManager.registerCardDefaults('simple-button', {
  style: {
    height: 45,        // ← Should be in theme or preset
    fontSize: 20       // ← Should be in theme or preset
  }
});
```

**Where styles come from:**
- **Theme Component Defaults**: `ThemeManager.getDefault('button', 'base')` → Base styles per component
- **Presets**: `StylePresetManager.getPreset('button', 'lozenge')` → Named style configurations
- **User Config**: User's YAML `style: { color: 'red' }` → Explicit overrides

---

## Four-Layer Merge Hierarchy

Configuration is merged in four layers (static) plus one runtime layer:

### Static Layers (Build Time)

1. **Card Defaults** (Priority 1 - Lowest)
   - Source: `CoreConfigManager.registerCardDefaults()`
   - Contains: Behavioral flags only
   - Example: `{ show_label: true, show_icon: false }`

2. **Theme Defaults** (Priority 2)
   - Source: `ThemeManager.getDefault(componentType, 'base')`
   - Contains: Component-level style base
   - Example: `{ style: { height: 45, color: 'theme:colors.accent.primary' } }`

3. **Preset** (Priority 3)
   - Source: `StylePresetManager.getPreset(overlayType, presetName)`
   - Contains: Named style configuration
   - Example: `{ style: { borderRadius: 25, fontSize: 20 } }`

4. **User Config** (Priority 4 - Highest Static)
   - Source: User's YAML configuration
   - Contains: Both behavioral and style overrides
   - Example: `{ show_icon: true, style: { color: 'red' } }`

### Runtime Layer

5. **Rules Patches** (Priority 5 - Highest Overall)
   - Source: `RulesEngine.evaluateDirty()` → `overlayPatches`
   - Applied by: `ModelBuilder._applyOverlayPatches()`
   - **Overrides ALL static config at runtime**
   - Example: `{ style: { color: 'green' } }` when entity turns on

---

## API Reference

### `processConfig(userConfig, cardType, context)`

Process card configuration with four-layer merge.

**Parameters:**
- `userConfig` (Object) - Raw config from YAML/UI
- `cardType` (string) - Card type identifier ('simple-button', 'msd', etc.)
- `context` (Object) - Additional context `{ hass, entity, ... }`

**Returns:** `Promise<ConfigResult>`

```javascript
{
  valid: boolean,           // Whether validation passed
  mergedConfig: Object,     // Fully merged configuration
  errors: Array,            // Validation errors (empty if valid)
  warnings: Array,          // Validation warnings
  provenance: Object        // Tracking info for debugging
}
```

**Example:**

```javascript
const result = await core.configManager.processConfig(
  {
    preset: 'lozenge',
    entity: 'light.bedroom',
    style: { color: 'red' }
  },
  'simple-button',
  { hass: this.hass }
);

if (result.valid) {
  this._config = result.mergedConfig;
  this._provenance = result.provenance;
} else {
  console.error('Config validation failed:', result.errors);
}
```

### `registerCardDefaults(cardType, defaults)`

Register behavioral defaults for a card type.

**⚠️ BEHAVIORAL ONLY** - No styles allowed!

**Parameters:**
- `cardType` (string) - Card type identifier
- `defaults` (Object) - Behavioral defaults only

**Example:**

```javascript
// ✅ CORRECT
configManager.registerCardDefaults('simple-button', {
  show_label: true,
  show_icon: false,
  enable_hold_action: true
});

// ❌ WRONG - Styles not allowed
configManager.registerCardDefaults('simple-button', {
  style: { height: 45 }  // Will be ignored with warning
});
```

### `registerCardSchema(cardType, schema, options)`

Register JSON schema for validation.

**Parameters:**
- `cardType` (string) - Card type identifier
- `schema` (Object) - JSON schema object
- `options` (Object) - Registration options
  - `version` (string) - Schema version (default: '1.0')

**Example:**

```javascript
configManager.registerCardSchema('simple-button', {
  type: 'object',
  properties: {
    entity: { type: 'string' },
    label: { type: 'string' },
    preset: { type: 'string' },
    show_label: { type: 'boolean' },
    show_icon: { type: 'boolean' }
  },
  required: ['entity']
}, { version: '1.0' });
```

### `getDebugInfo()`

Get debug information about registered cards and processing stats.

**Returns:** `Object`

```javascript
{
  initialized: true,
  stats: {
    configurationsProcessed: 15,
    validationErrors: 0,
    presetsResolved: 10,
    tokensResolved: 25
  },
  registeredCards: {
    schemas: ['simple-button', 'simple-label'],
    defaults: ['simple-button', 'simple-label']
  },
  dependencies: {
    hasValidationService: true,
    hasThemeManager: true,
    hasStylePresetManager: true
  }
}
```

---

## Usage Examples

### Example 1: LCARdS Card with Preset

```javascript
// Card self-registers at module load
if (window.lcardsCore?.configManager) {
  window.lcardsCore.configManager.registerCardDefaults('simple-button', {
    show_label: true,
    show_icon: false
  });
}

// In card's setConfig()
async setConfig(config) {
  const core = window.lcardsCore;
  if (!core?.configManager?.initialized) {
    // Fallback: Use raw config
    this._config = config;
    return;
  }

  // Process with CoreConfigManager
  const result = await core.configManager.processConfig(
    config,
    'simple-button',
    { hass: this.hass }
  );

  if (!result.valid) {
    console.error('Config errors:', result.errors);
  }

  this._config = result.mergedConfig;
  this._provenance = result.provenance;
}
```

### Example 2: Full Layer Resolution

```yaml
# User's YAML config
type: custom:lcards-button
preset: lozenge
entity: light.living_room
label: Living Room
show_icon: true     # Override default false
style:
  color: red        # Override preset color
```

**Processing flow:**

1. **Card Defaults**: `{ show_label: true, show_icon: false }`
2. **Theme Defaults**: `{ style: { height: 45, color: 'theme:colors.accent.primary' } }`
3. **Preset** (lozenge): `{ style: { borderRadius: 25, fontSize: 20, color: 'theme:colors.accent.primary' } }`
4. **User Config**: Overrides `show_icon` and `style.color`

**Result after merge + token resolution:**

```javascript
{
  type: 'custom:lcards-button',
  entity: 'light.living_room',
  label: 'Living Room',
  preset: 'lozenge',
  show_label: true,        // From card defaults
  show_icon: true,         // From user (overrides default false)
  style: {
    height: 45,            // From theme defaults
    borderRadius: 25,      // From preset
    fontSize: 20,          // From preset
    color: 'red'           // From user (overrides preset)
  }
}
```

**Provenance:**

```javascript
{
  card_type: 'simple-button',
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

### Example 3: Runtime Rules Override

At runtime, Rules Engine can override ANY static config:

```javascript
// Static config after merge
mergedConfig.style.color = 'red';  // From user config (priority 4)

// But Rules Engine has HIGHEST priority (priority 5)
rules: [{
  conditions: [{ entity: 'light.living_room', state: 'on' }],
  actions: [{
    overlay: 'living_room_button',
    changes: {
      style: { color: 'green' }  // ← OVERRIDES static 'red'
    }
  }]
}];

// When light turns on:
// 1. Entity state changes
// 2. Rules evaluate → Match!
// 3. Patch applied: color = 'green'
// 4. Render: Button shows GREEN (not red)
```

---

## MSD Compatibility

CoreConfigManager automatically detects MSD-style configs and uses pack-based merging:

```javascript
// MSD config (has use_packs)
const msdConfig = {
  use_packs: {
    builtin: ['core'],
    external: []
  },
  overlays: [/* ... */],
  rules: [/* ... */]
};

// CoreConfigManager detects MSD and uses mergePacks internally
const result = await configManager.processConfig(msdConfig, 'msd', {});

// Result includes full MSD provenance tracking
console.log(result.provenance.__provenance);
```

---

## Theme Token Resolution

Theme tokens (`theme:path.to.token`) are resolved automatically after merge:

```javascript
// Preset with tokens
{
  style: {
    color: 'theme:colors.accent.primary',
    height: 'theme:components.button.defaultHeight'
  }
}

// After token resolution
{
  style: {
    color: '#ff9966',     // Resolved from theme
    height: 45            // Resolved from theme
  }
}
```

Tokens are resolved **after** four-layer merge but **before** validation.

---

## Error Handling

### Validation Errors

```javascript
const result = await configManager.processConfig(config, 'simple-button', {});

if (!result.valid) {
  result.errors.forEach(error => {
    console.error(error.formattedMessage);
  });
}
```

### Missing Dependencies

```javascript
// CoreConfigManager handles missing dependencies gracefully
if (!themeManager) {
  console.warn('ThemeManager not available - theme features disabled');
}

if (!stylePresetManager) {
  console.warn('StylePresetManager not available - preset features disabled');
}
```

### Processing Errors

```javascript
try {
  const result = await configManager.processConfig(config, cardType, {});
} catch (error) {
  // Processing errors are caught and returned in result
  console.error('Config processing failed:', error.message);
}
```

---

## Best Practices

### 1. Self-Register at Module Load

```javascript
// At top level of card module (not in class)
if (window.lcardsCore?.configManager) {
  window.lcardsCore.configManager.registerCardDefaults('my-card', {
    // Behavioral defaults only
  });

  window.lcardsCore.configManager.registerCardSchema('my-card', {
    // JSON schema
  });
}
```

### 2. Handle Missing ConfigManager

```javascript
async setConfig(config) {
  const core = window.lcardsCore;

  if (!core?.configManager?.initialized) {
    // Fallback: Use raw config
    this._config = config;
    return;
  }

  // Use ConfigManager
  const result = await core.configManager.processConfig(...);
}
```

### 3. Use Provenance for Debugging

```javascript
if (this._provenance) {
  console.log('Config came from:', this._provenance.merge_order);
  console.log('show_label came from:', this._provenance.field_sources['show_label']);
}
```

### 4. Validate After Processing

```javascript
const result = await configManager.processConfig(config, cardType, {});

if (!result.valid) {
  // Show errors to user
  this._showConfigErrors(result.errors);
}
```

---

## Architecture Notes

### Why Separate Behavioral and Style Defaults?

1. **Single Responsibility**: Each system has one clear purpose
2. **No Duplication**: Style defaults in one place (Theme + Presets)
3. **Theme Support**: Styles can reference theme tokens
4. **Clear Override Path**: User knows where each value comes from

### Priority Hierarchy

```
Static (Build Time):
1. Card Defaults (behavioral)     ← Lowest
2. Theme Defaults (style base)
3. Preset (named style)
4. User Config (explicit)

Runtime (Every Render):
5. Rules Patches (live state)     ← HIGHEST
```

### When to Use Each Layer

- **Card Defaults**: Sensible behavioral defaults for the card type
- **Theme Defaults**: Component-level style foundation
- **Presets**: Named style variations users can select
- **User Config**: User's specific customizations
- **Rules**: Dynamic behavior based on entity state

---

## Troubleshooting

### "Config not processed" Warning

**Cause**: CoreConfigManager not initialized
**Solution**: Check that lcardsCore.initialize() was called

### "Preset not found" Warning

**Cause**: Preset name doesn't exist
**Solution**: Check StylePresetManager for available presets

### Theme Tokens Not Resolving

**Cause**: ThemeManager not initialized
**Solution**: Verify ThemeManager loaded successfully

### Validation Always Fails

**Cause**: Schema not registered
**Solution**: Call `registerCardSchema()` at module load

---

## See Also

- [Simple Card Foundation](../architecture/lcards-card-foundation.md) - LCARdS Card usage
- [Theme System](../themes/README.md) - Theme tokens and component defaults
- [Style Presets](../presets/README.md) - Named style configurations
- [UNIFIED_ACTION_SYSTEM](../../architecture/UNIFIED_ACTION_SYSTEM.md) - Action handling

---

**Last Updated:** November 11, 2025
**Version:** 1.0
