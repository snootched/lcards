# Helpers API - Developer Guide

This guide explains the architecture and usage of the LCARdS helper management system for developers extending or maintaining the codebase.

## Architecture Overview

The helper system consists of three main components:

```
┌─────────────────────────────────────┐
│   Helper Registry (Schema)          │
│   - Authoritative definitions       │
│   - YAML templates                  │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Helper Manager (Service)          │
│   - Lifecycle management            │
│   - State monitoring                │
│   - Value access                    │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Helper API (WebSocket Wrapper)    │
│   - Create/delete operations        │
│   - Entity registry updates         │
└─────────────────────────────────────┘
```

## Core Components

### 1. Helper API (`lcards-helper-api.js`)

Low-level WebSocket API wrapper for Home Assistant helper operations.

**Functions:**

```javascript
// Create a new helper
await createHelper(hass, domain, name, attributes);

// Delete a helper
await deleteHelper(hass, domain, helperId);

// Rename helper entity_id
await updateHelperEntityId(hass, currentEntityId, newEntityId);

// Idempotent creation (check + create if missing)
await ensureHelper(hass, definition);

// Check existence
const exists = helperExists(hass, entityId);

// Get value
const value = getHelperValue(hass, entityId, defaultValue);

// Set value (public API)
await setHelperValue(hass, entityId, value);
```

**WebSocket API Notes:**

The HA WebSocket API for helpers is undocumented and may change:

```javascript
// Create input_number
await hass.callWS({
  type: 'input_number/create',
  name: 'Helper Name',
  min: 0,
  max: 100,
  step: 1,
  mode: 'slider',
  icon: 'mdi:icon'
});

// Rename entity
await hass.callWS({
  type: 'config/entity_registry/update',
  entity_id: 'input_number.old_id',
  new_entity_id: 'input_number.new_id'
});
```

**Supported Domains:**
- `input_number` - Sliders and number inputs
- `input_select` - Dropdowns
- `input_boolean` - Toggles

**Error Handling:**

All functions throw errors with meaningful messages. Always wrap in try/catch:

```javascript
try {
  await createHelper(hass, 'input_number', 'My Helper', {
    min: 0,
    max: 100,
    step: 1
  });
} catch (error) {
  console.error('Failed to create helper:', error.message);
}
```

### 2. Helper Registry (`lcards-helper-registry.js`)

Authoritative schema defining all LCARdS helpers.

**Registry Structure:**

```javascript
export const HELPER_REGISTRY = {
  helper_key: {
    entity_id: 'input_select.lcards_helper_name',
    domain: 'input_select',
    name: 'Human Readable Name',
    description: 'Purpose and usage',
    icon: 'mdi:icon-name',
    category: 'category_name',
    ws_create_params: {
      // Domain-specific parameters
      options: ['option1', 'option2']
    },
    default_value: 'option1',
    yaml_config: `input_select:
  lcards_helper_name:
    name: Human Readable Name
    options:
      - option1
      - option2
    icon: mdi:icon-name`
  }
};
```

**Key Fields:**

- `entity_id`: Desired entity ID in Home Assistant
- `domain`: Helper type (`input_number`, `input_select`, `input_boolean`)
- `ws_create_params`: Parameters for WebSocket creation
- `default_value`: Fallback value if helper doesn't exist
- `yaml_config`: Valid YAML for manual creation

**Utility Functions:**

```javascript
// Get helpers by category
const alertHelpers = getHelpersByCategory('alert_system');

// Get all categories
const categories = getCategories();

// Lookup by key
const definition = getHelperDefinition('alert_mode');

// Get all helpers
const all = getAllHelpers();

// Generate YAML
const yaml = generateHelpersYAML();
const categoryYaml = generateHelpersYAML('alert_system');

// Find by entity_id
const helper = findHelperByEntityId('input_select.lcards_alert_mode');
```

### 3. Helper Manager (`lcards-helper-manager.js`)

Service class managing helper lifecycle and state.

**Initialization:**

```javascript
import { LCARdSHelperManager } from './core/helpers/lcards-helper-manager.js';

const helperManager = new LCARdSHelperManager(hass);

// Integrated in core
window.lcards.core.helperManager
```

**Lifecycle Methods:**

```javascript
// Get missing helpers
const missing = helperManager.getMissingHelpers();

// Create all missing helpers
const results = await helperManager.ensureAllHelpers();
// Returns: { total, existing, created, failed, errors }

// Create single helper
await helperManager.ensureHelper('alert_mode');
```

**State Access:**

```javascript
// Get current value (or default)
const mode = helperManager.getHelperValue('alert_mode');

// Set value (calls HA service)
await helperManager.setHelperValue('alert_mode', 'red_alert');

// Check existence
if (helperManager.helperExists('alert_mode')) {
  // Helper exists
}
```

**Reactivity:**

```javascript
// Subscribe to changes
const unsubscribe = helperManager.subscribeToHelper(
  'alert_mode',
  (newValue, oldValue) => {
    console.log(`Alert mode changed: ${oldValue} → ${newValue}`);
  }
);

// Cleanup
unsubscribe();

// Or unsubscribe by key
helperManager.unsubscribeFromHelper('alert_mode');
```

**Helper Bindings (Future):**

```javascript
// Resolve helper bindings in card config
const config = {
  alertMode: null,
  threshold: null
};

const bindings = {
  alertMode: 'alert_mode',
  threshold: 'alert_threshold'
};

const resolved = helperManager.resolveHelperBindings(config, bindings);
// Returns config with values from helpers
```

**Export:**

```javascript
// Generate YAML
const yaml = helperManager.generateYAML();
const alertYaml = helperManager.generateYAML('alert_system');

// Get helpers by category
const helpers = helperManager.getHelpersByCategory('alert_system');
```

## Adding New Helpers

### Step 1: Define in Registry

Add to `HELPER_REGISTRY` in `lcards-helper-registry.js`:

```javascript
export const HELPER_REGISTRY = {
  // ... existing helpers
  
  my_new_helper: {
    entity_id: 'input_boolean.lcards_my_feature_enabled',
    domain: 'input_boolean',
    name: 'My Feature Enabled',
    description: 'Enable or disable my cool feature',
    icon: 'mdi:feature-search',
    category: 'features',
    ws_create_params: {}, // input_boolean has no extra params
    default_value: false,
    yaml_config: `input_boolean:
  lcards_my_feature_enabled:
    name: My Feature Enabled
    icon: mdi:feature-search`
  }
};
```

### Step 2: Use in Code

Access via Helper Manager:

```javascript
// Check if feature is enabled
const isEnabled = window.lcards.core.helperManager.getHelperValue('my_new_helper');

if (isEnabled) {
  // Feature logic
}

// Subscribe to changes
window.lcards.core.helperManager.subscribeToHelper(
  'my_new_helper',
  (enabled) => {
    // React to changes
    this.featureEnabled = enabled;
    this.requestUpdate();
  }
);
```

### Step 3: Document

Update user documentation with:
- Purpose of the helper
- Expected values
- Usage examples
- Automation integration

## Integration Points

### Core System

The Helper Manager is initialized in `lcards-core.js`:

```javascript
// Initialize HelperManager (Phase 2f)
this.helperManager = new LCARdSHelperManager(hass);

// Update HASS
if (this.helperManager) {
  this.helperManager.updateHass(hass);
}
```

Access globally:

```javascript
window.lcards.core.helperManager
```

### Alert Lab Integration

The Alert Lab loads and saves helper values:

```javascript
// On open: Load from helpers
_loadAlertLabFromHelpers() {
  const helperManager = window.lcards.core.helperManager;
  
  ['red', 'yellow', 'blue', 'white'].forEach(mode => {
    const hue = helperManager.getHelperValue(`alert_lab_${mode}_hue`);
    const saturation = helperManager.getHelperValue(`alert_lab_${mode}_saturation`);
    const lightness = helperManager.getHelperValue(`alert_lab_${mode}_lightness`);
    
    // Apply values
    setAlertModeTransformParameter(`${mode}_alert`, 'hueShift', hue);
    setAlertModeTransformParameter(`${mode}_alert`, 'saturationMultiplier', saturation / 100);
    setAlertModeTransformParameter(`${mode}_alert`, 'lightnessMultiplier', lightness / 100);
  });
}

// On save: Persist to helpers
async _saveToHelpers() {
  const helperManager = window.lcards.core.helperManager;
  const transform = getAlertModeTransform(this._selectedAlertMode);
  const mode = this._selectedAlertMode.replace('_alert', '');
  
  await helperManager.setHelperValue(`alert_lab_${mode}_hue`, transform.hueShift);
  await helperManager.setHelperValue(`alert_lab_${mode}_saturation`, transform.saturationMultiplier * 100);
  await helperManager.setHelperValue(`alert_lab_${mode}_lightness`, transform.lightnessMultiplier * 100);
}
```

### Configuration Panel

The panel provides UI for helper management:

```javascript
// Load status
this._helpers = helperManager.getAllHelpers().map(helper => ({
  ...helper,
  exists: helperManager.helperExists(helper.key),
  currentValue: helperManager.getHelperValue(helper.key)
}));

// Create all
const results = await helperManager.ensureAllHelpers();

// Set value
await helperManager.setHelperValue(key, value);
```

## Testing Guidelines

### Unit Testing

Test helper operations:

```javascript
// Mock HASS instance
const mockHass = {
  callWS: jest.fn(),
  callService: jest.fn(),
  states: {},
  connection: {
    subscribeEvents: jest.fn(() => () => {})
  }
};

// Test creation
test('creates helper via WebSocket', async () => {
  mockHass.callWS.mockResolvedValue({ id: 'helper_id' });
  
  const result = await createHelper(mockHass, 'input_number', 'Test Helper', {
    min: 0,
    max: 100
  });
  
  expect(mockHass.callWS).toHaveBeenCalledWith({
    type: 'input_number/create',
    name: 'Test Helper',
    min: 0,
    max: 100
  });
});
```

### Integration Testing

1. Create helpers via panel
2. Verify entity IDs in HA
3. Test value updates
4. Verify Alert Lab persistence
5. Test automation integration

### Manual Testing Checklist

- [ ] Create all helpers via config panel
- [ ] Edit helper values in panel
- [ ] Save Alert Lab parameters
- [ ] Reload Alert Lab and verify values loaded
- [ ] Change helper via automation
- [ ] Verify theme updates
- [ ] Export YAML and verify accuracy
- [ ] Delete test helpers

## Best Practices

### Naming Conventions

- Prefix all helpers with `lcards_`
- Use snake_case for entity IDs
- Group by category in registry
- Use descriptive names

### Error Handling

Always wrap helper operations:

```javascript
try {
  await helperManager.setHelperValue('alert_mode', 'red_alert');
} catch (error) {
  lcardsLog.error('[MyComponent] Failed to set helper:', error);
  // Show user-friendly error
}
```

### State Management

- Cache helper values when appropriate
- Subscribe to changes for reactive updates
- Unsubscribe on component cleanup

### Performance

- Batch helper creation when possible
- Use default values as fallback
- Avoid excessive subscriptions

## Future Enhancements

Planned features for helper system:

1. **Card Schema Bindings**
   - Declarative helper bindings in card schemas
   - Auto-apply helper values to config
   - UI indicators for helper-driven values

2. **Additional Categories**
   - `styling`: Card styling defaults
   - `behavior`: Card behavior settings
   - `layout`: Layout preferences

3. **Migration Tools**
   - Import from old config formats
   - Bulk helper operations
   - Config versioning

4. **Advanced Features**
   - Helper validation rules
   - Inter-helper dependencies
   - Conditional helper enablement

## Related Documentation

- [User Guide: Persistent Helpers](../configuration/persistent-helpers.md)
- [Architecture: Core Services](../architecture/core-services.md)
- [API Reference: Helper Manager](../api/helper-manager.md)

## API Reference

### Helper API

See [lcards-helper-api.js](../../src/core/helpers/lcards-helper-api.js) for complete API.

### Helper Manager

See [lcards-helper-manager.js](../../src/core/helpers/lcards-helper-manager.js) for complete API.

### Helper Registry

See [lcards-helper-registry.js](../../src/core/helpers/lcards-helper-registry.js) for registry structure.
