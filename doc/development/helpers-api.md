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
- `input_text` - Free-text storage (e.g. JSON config blobs)

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
- `domain`: Helper type (`input_number`, `input_select`, `input_boolean`, `input_text`)
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

### Alert Lab & Configuration Panel

Both consumers use the same Helper Manager API already documented above — no new methods. The Alert Lab reads/writes `alert_lab_{mode}_{hue,saturation,lightness}` keys via `getHelperValue()`/`setHelperValue()` on open/save; the Config Panel lists helper status via `getAllHelpers()` + `helperExists()` + `getHelperValue()`, and bulk-creates missing ones via `ensureAllHelpers()`.

## Best Practices

- **Naming:** prefix all helpers with `lcards_`, snake_case entity IDs, group by category in the registry.
- **Error handling:** wrap `createHelper()`/`setHelperValue()` calls in try/catch — see the Error Handling notes under Helper API above.
- **State:** subscribe to changes for reactive updates instead of polling, and unsubscribe on component cleanup (`unsubscribeFromHelper()` or the function returned by `subscribeToHelper()`).
- **Performance:** batch helper creation via `ensureAllHelpers()` rather than looping `ensureHelper()` calls; avoid excessive subscriptions.

There is no automated test suite for this project — validate helper changes manually: create via the Config Panel, confirm the entity appears in HA, exercise Alert Lab save/reload, and trigger a value change from an automation.
