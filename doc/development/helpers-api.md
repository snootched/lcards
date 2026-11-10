# Helpers API - Developer Guide

How the LCARdS helper system is built and how to use and extend it: the Home Assistant helper entities (`input_select`, `input_boolean`, `input_number`, `input_text`, plus one template `sensor`) behind alert mode, the Alert Lab colours, the sound settings and the HA-LCARS theme values. The runtime view (state tracking, the alert-mode auto-switch, the console) is [Helper Manager](../architecture/subsystems/helper-manager.md); the user page is [Persistent Helpers](/configuration/persistent-helpers).

## Architecture Overview

The helper system has three modules in `src/core/helpers/`. The manager reads definitions from the registry and calls Home Assistant through the API module:

```
┌─────────────────────────────────────┐
│   Helper Registry (Schema)          │
│   lcards-helper-registry.js         │
│   - Authoritative definitions       │
│   - YAML templates                  │
└──────────────┬──────────────────────┘
               │ definitions
┌──────────────▼──────────────────────┐
│   Helper Manager (Service)          │
│   lcards-helper-manager.js          │
│   - Lifecycle management            │
│   - State monitoring                │
│   - Value access                    │
└──────────────┬──────────────────────┘
               │ calls
┌──────────────▼──────────────────────┐
│   Helper API (WebSocket Wrapper)    │
│   lcards-helper-api.js              │
│   - Create/update/delete            │
│   - Entity registry updates         │
│   - Service calls for values        │
└─────────────────────────────────────┘
```

## Core Components

### 1. Helper API (`lcards-helper-api.js`)

Low-level wrapper around Home Assistant's helper WebSocket commands and services. Every function takes `hass` and an entity ID; the manager wraps them by registry key, so card and service code uses the manager instead.

**Functions:**

```javascript
// Is the helper WebSocket API reachable? (sends input_number/list)
const ok = await verifyHelperAPIAvailable(hass);

// Create a new helper (<domain>/create)
await createHelper(hass, domain, name, attributes);

// Delete a helper (<domain>/delete, by its storage id)
await deleteHelper(hass, domain, helperId);

// Persist a helper's config (<domain>/update), e.g. a new input_select options list
await updateHelperConfig(hass, domain, entityId, { name, options, icon });

// Rename the entity_id (config/entity_registry/update)
await updateHelperEntityId(hass, currentEntityId, newEntityId);

// Idempotent creation: create if missing, then rename to the wanted entity_id
await ensureHelper(hass, definition);
// → { exists, created, entity_id }

// Existence and value, from hass.states
const exists = helperExists(hass, entityId);
const value = getHelperValue(hass, entityId, defaultValue);   // the state string

// Set a value through the domain's service
await setHelperValue(hass, entityId, value);
```

`setHelperValue()` picks the service by domain (`lcards-helper-api.js:365-400`): `input_boolean.turn_on` / `turn_off` / `toggle` (`true`, `'on'` or `1` turns it on; `'toggle'` toggles), `input_select.select_option`, and `set_value` for `input_number` and `input_text`. Any other domain throws.

**WebSocket API Notes:**

Home Assistant's helper WebSocket commands are not a documented public API and may change. The shapes LCARdS sends:

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

Creating, renaming and updating helpers needs an admin user: these commands are admin-only in Home Assistant. `updateHelperConfig()` also resolves the storage id through `config/entity_registry/get` (admin-only), which is why `updateSelectOptions()` falls back to the non-persistent `input_select.set_options` service for non-admins.

**Supported Domains:**
- `input_number` - Sliders and number inputs
- `input_select` - Dropdowns
- `input_boolean` - Toggles
- `input_text` - Free text (for example the alert overlay message)
- `sensor` - Only as a registry entry with `ws_create_params: null`: a template sensor the user sets up in YAML (`lcars_header`). It is never created or written.

**Error Handling:**

`createHelper()`, `deleteHelper()`, `updateHelperConfig()`, `updateHelperEntityId()`, `ensureHelper()` and `setHelperValue()` throw an `Error` with a readable message; `verifyHelperAPIAvailable()`, `helperExists()` and `getHelperValue()` never throw. Wrap the throwing calls and log with `lcardsLog`:

```javascript
import { lcardsLog } from '../../utils/lcards-logging.js';

try {
  await createHelper(hass, 'input_number', 'My Helper', {
    min: 0,
    max: 100,
    step: 1
  });
} catch (error) {
  lcardsLog.error('[MyFeature] Failed to create helper:', error.message);
}
```

### 2. Helper Registry (`lcards-helper-registry.js`)

Authoritative schema of all LCARdS helpers: 49 entries in three categories (`alert_system`, `ha_lcars_theme`, `sound`; the list is in [Helper Manager: Helper Registry](../architecture/subsystems/helper-manager.md#helper-registry)).

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
    initial: option1
    icon: mdi:icon-name`
  }
};
```

**Key Fields:**

- `entity_id`: Desired entity ID in Home Assistant
- `domain`: Helper type (`input_number`, `input_select`, `input_boolean`, `input_text`, or `sensor` for the template sensor)
- `category`: Grouping for the config panel's Helpers tab and for `resetCategoryToDefaults()`
- `ws_create_params`: Parameters for WebSocket creation. `null` marks an entry that cannot be created over WebSocket (the template sensor): `ensureHelper()` skips it and returns `{ skipped: true }` (`lcards-helper-manager.js:436-445`)
- `default_value`: Value set right after creation, returned while the helper does not exist, and written by "Reset to Defaults"
- `yaml_config`: Valid YAML for manual creation. It starts the helper at `default_value` (`initial:`), and must read the same in YAML 1.1, which Home Assistant uses: quote `off`, `on`, `yes`, `no` (`tests/core/helper-yaml-initial.test.js`, `helper-registry-yaml.test.js`)
- `excludeFromBulkReset` (optional): a category-wide "Reset to Defaults" skips this helper (the active sound scheme)

**Utility Functions:**

```javascript
// Get helpers by category
const alertHelpers = getHelpersByCategory('alert_system');

// Get all categories
const categories = getCategories();

// Lookup by key
const definition = getHelperDefinition('alert_mode');

// Get all helpers (each with its key)
const all = getAllHelpers();

// Generate YAML
const yaml = generateHelpersYAML();
const categoryYaml = generateHelpersYAML('alert_system');

// Find by entity_id
const helper = findHelperByEntityId('input_select.lcards_alert_mode');
```

### 3. Helper Manager (`lcards-helper-manager.js`)

`LCARdSHelperManager` extends `BaseService`: helper lifecycle, a value cache fed by one `state_changed` subscription, and subscriptions by key.

**Initialization:**

The core creates it in `_performInitialization()` (`src/core/lcards-core.js:223-225`) and feeds it HASS from `ingestHass()` (`lcards-core.js:582-583`). Use the singleton; never construct a second one:

```javascript
const helperManager = window.lcards.core.helperManager;
```

**Lifecycle Methods:**

```javascript
// Registry entries whose entity is missing in Home Assistant
const missing = helperManager.getMissingHelpers();

// Create all missing helpers (sets each new helper to its default_value)
const results = await helperManager.ensureAllHelpers();
// Returns: { total, existing, created, failed, errors }

// Create a single helper by key
await helperManager.ensureHelper('alert_mode');
// Returns: { exists, created, entity_id } (plus skipped: true for ws_create_params: null)

// Write registry defaults to existing helpers (one category, or all with null)
const reset = await helperManager.resetCategoryToDefaults('alert_system');
// Returns: { success, failed, skipped }

// Replace an input_select's options (SoundManager keeps sound_scheme in step with the schemes)
await helperManager.updateSelectOptions('sound_scheme', ['none', 'lcards_default'], 'lcards_default');
// Returns: { optionsUpdated, restored }
```

The config panel's Helpers tab uses `getMissingHelpers()`, `ensureAllHelpers()` and `resetCategoryToDefaults()` (`src/panels/lcards-config-panel.js:444-517`).

**State Access:**

```javascript
// Current value: the entity's state string ('on'/'off' for an input_boolean),
// or default_value while the helper doesn't exist
const mode = helperManager.getHelperValue('alert_mode');

// Set value (calls the domain's Home Assistant service)
await helperManager.setHelperValue('alert_mode', 'red_alert');

// Check existence
if (helperManager.helperExists('alert_mode')) {
  // Helper exists
}
```

- `setHelperValue()` clamps an `input_number` value to the helper's own `min`/`max` (from its state attributes) before calling the service: Home Assistant rejects a value outside the range, and an older helper may have a narrower range than the registry (`lcards-helper-manager.js:563-571`, `tests/core/helper-value-clamp.test.js`).
- It updates the cache right away, normalising `input_boolean` values to `'on'`/`'off'`; the state change event confirms it later.
- A value read before the cache has it comes live from `hass.states`, and is not cached.

**Reactivity:**

```javascript
// Subscribe to changes
const unsubscribe = helperManager.subscribeToHelper(
  'alert_mode',
  (newValue, oldValue) => {
    lcardsLog.debug(`[MyFeature] Alert mode changed: ${oldValue} → ${newValue}`);
  }
);

// Cleanup
unsubscribe();

// Or drop every subscriber of a key
helperManager.unsubscribeFromHelper('alert_mode');
```

All helpers share one `state_changed` subscription (`tests/core/helper-manager-subscriptions.test.js`); subscribing to a key only adds a callback. Callbacks get the new and old state strings.

**Helper Bindings:**

```javascript
// Copy helper values into a config object: { configKey: helperKey }
const resolved = helperManager.resolveHelperBindings(
  { volume: 0.5 },
  { volume: 'sound_volume' }
);
// → { volume: '0.5' }  (the helper's state string; a null value keeps the config's own)
```

**Export and Debug:**

```javascript
// Generate YAML
const yaml = helperManager.generateYAML();
const alertYaml = helperManager.generateYAML('alert_system');

// Get helpers by category
const helpers = helperManager.getHelpersByCategory('alert_system');

// Snapshot for window.lcards.debug.singleton('helperManager')
helperManager.getDebugInfo();
// → { type, subscriptionsCount, stateListeners, watchedHelpers, cachedValues, autoSwitchInitialized }
```

## Adding New Helpers

### Step 1: Define in Registry

Add to `HELPER_REGISTRY` in `lcards-helper-registry.js`, in an existing category (a new category also needs its label and icon in the config panel's Helpers tab, `categoryLabels` and `CATEGORY_ICONS` in `src/panels/lcards-config-panel.js`):

```javascript
export const HELPER_REGISTRY = {
  // ... existing helpers

  sound_my_feature_enabled: {
    entity_id: 'input_boolean.lcards_sound_my_feature_enabled',
    domain: 'input_boolean',
    name: 'LCARdS My Feature Sounds',
    description: 'Enable or disable the sounds of my feature',
    icon: 'mdi:volume-high',
    category: 'sound',
    ws_create_params: {}, // input_boolean has no extra params
    default_value: true,
    yaml_config: `input_boolean:
  lcards_sound_my_feature_enabled:
    name: LCARdS My Feature Sounds
    initial: true
    icon: mdi:volume-high`
  }
};
```

### Step 2: Use in Code

Access it through the Helper Manager, by key:

```javascript
const hm = window.lcards.core.helperManager;

// An input_boolean reads 'on'/'off' once it exists, and default_value (a boolean) before
const value = hm.getHelperValue('sound_my_feature_enabled');
const isEnabled = value === true || value === 'on';

// Subscribe to changes; keep the unsubscribe function for cleanup
this._unsubMyFeature = hm.subscribeToHelper(
  'sound_my_feature_enabled',
  (newValue) => {
    this.featureEnabled = newValue === 'on';
    this.requestUpdate();
  }
);
```

### Step 3: Test and Document

- The node tests read every registry entry: `helper-yaml-initial.test.js` (YAML `initial` equals `default_value` for booleans and numbers) and `helper-registry-yaml.test.js` (YAML 1.1 parity). An `alert_lab_*` default must also equal the built-in alert transform (`tests/core/alert-defaults-match.test.js`).
- Add a test for the behaviour that uses the helper, in the layer that fits ([Testing](./testing)).
- Update the user docs: [Persistent Helpers](/configuration/persistent-helpers) with the purpose, the values and an automation example.

## Integration Points

### Core System

The core creates the Helper Manager during initialization and passes every HASS update on (`src/core/lcards-core.js`):

```javascript
// _performInitialization()
this.helperManager = new LCARdSHelperManager(hass);

// ingestHass()
if (this.helperManager) {
  this.helperManager.updateHass(hass);
}
```

Access globally:

```javascript
window.lcards.core.helperManager
```

### Alert Lab and Configuration Panel

Both consumers use the manager API above.

- **Alert Lab** (the theme token browser tab, `src/editor/components/theme-browser/lcards-theme-token-browser-tab.js`) writes the `alert_lab_*` numbers with `setHelperValue()`. Per alert colour (`red`, `yellow`, `blue`, `gray`, `black`) the keys are `alert_lab_<mode>_hue`, `_hue_strength`, `_saturation` and `_lightness`; red, yellow and blue also have `_center_hue`, `_range` and `_strength` (the hue anchor), and black has `alert_lab_black_threshold`, `_dark_multiplier` and `_light_multiplier` (32 in all).
- **Alert transforms:** `loadAlertTransformsFromHelpers()` (`src/core/themes/alertModeTransform.js:436`) reads those helpers before an alert mode is applied, so a page reload keeps the customised colours. The registry defaults equal the built-in transforms, so the Lab's Reset and the Helpers tab's "Reset to Defaults" give the same colours (`tests/core/alert-defaults-match.test.js`).
- **Config Panel** (Helpers tab): lists helper status with `getAllHelpers()`, `helperExists()` and `getHelperValue()`, creates missing ones with `ensureAllHelpers()`, and resets a category with `resetCategoryToDefaults()`.

## Best Practices

- **Naming:** prefix all helper entity IDs with `lcards_`, use snake_case, and group by category in the registry.
- **Error handling:** wrap the throwing API and manager calls (`ensureHelper()`, `setHelperValue()`, ...) in try/catch and log with `lcardsLog`, never `console.*`.
- **State:** subscribe to changes instead of polling, and unsubscribe on cleanup (the function returned by `subscribeToHelper()`, or `unsubscribeFromHelper()`).
- **Values are strings:** compare against the state string (`'on'`, `'red_alert'`, `'0.5'`) and parse numbers, but allow the boolean or number `default_value` returned before the helper exists.
- **Performance:** create helpers in bulk with `ensureAllHelpers()` rather than looping `ensureHelper()` calls.

**Tests.** Node tests: `tests/core/helper-manager-subscriptions.test.js` (one `state_changed` subscription for all helpers), `helper-value-clamp.test.js`, `helper-registry-yaml.test.js`, `helper-yaml-initial.test.js` and `alert-defaults-match.test.js`. The real Home Assistant layer (`npm run test:ha`) creates its own `lcards_test_*` helpers for card fixtures, and checks `input_select.lcards_alert_mode` around the alert actions (`tests/ha/ha.spec.js`). Creating helpers from the config panel is still checked by hand: create them from the Helpers tab, confirm the entities in Home Assistant, save and reload in the Alert Lab, and change a value from an automation. See [Testing](./testing).
