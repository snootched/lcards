# Validation Service

> Config schema validation for all LCARdS card types — `window.lcards.core.validationService`

---

## Overview

Config validation is split across two singletons:

- **`CoreConfigManager`** (`window.lcards.core.configManager`) owns the **per-card-type schema registry** (`registerCardSchema()` / `getCardSchema()`) and calls validation automatically as the last step of its four/five-layer `processConfig()` merge pipeline.
- **`CoreValidationService`** (`window.lcards.core.validationService`) does the actual structural (JSON-schema-style) validation via `validate(data, schema, context)`. It also owns optional token-reference and data-source-reference validators, and a small legacy registry of generic schemas (`card-config`, `entity-reference`, `action-config`, `position`, `size`) used internally.

---

## Key Files

| File | Role |
|---|---|
| `core/validation-service/index.js` | `CoreValidationService` — structural validation (`validate()`), plus internal `CoreSchemaRegistry` (5 built-in generic schemas) and `CoreErrorFormatter` (used automatically inside `validate()`) |
| `core/validation-service/TokenValidator.js` | Validates `{theme:token.path}` / token-path references against a `ThemeManager` — called manually via `validationService.validateTokens()` |
| `core/validation-service/DataSourceValidator.js` | Validates `source` / `data_source` / `sources` fields on data-source-capable config types (currently `lcards-chart`/`chart`) — called manually via `validationService.validateDataSources()` |
| `core/validation-service/ErrorFormatter.js` | Standalone formatter that turns a validation result into a multi-line human-readable string, used by `validationService.formatErrors()` |
| `core/config-manager/index.js` | `CoreConfigManager` — per-card-type schema registry (`_cardSchemas`), config merge pipeline, and the `_validateConfig()` step that calls `validationService.validate()` |
| `src/cards/schemas/*.js` | Per-card JSON schema definitions (e.g. `button-schema.js`, `msd-schema.js`) |

---

## Schema Registration

Each card class exposes a static `registerSchema()` method. These are called in `src/lcards.js` after all core services initialise:

```javascript
// lcards.js (called once at startup, after core is ready)
if (LCARdSButton.registerSchema) LCARdSButton.registerSchema();
if (LCARdSElbow.registerSchema) LCARdSElbow.registerSchema();
if (LCARdSMSDCard.registerSchema) LCARdSMSDCard.registerSchema();
// ... one call per card type
```

Inside `registerSchema()`, the card calls `configManager.registerCardSchema()`:

```javascript
// Inside your card class
static registerSchema() {
    const configManager = window.lcards?.core?.configManager;
    if (!configManager) return;

    const schema = getMyCardSchema({ /* runtime options, e.g. available presets */ });
    configManager.registerCardSchema('my-card', schema, { version: __LCARDS_VERSION__ });
}
```

To add a new card type to validation:
1. Add a schema file at `src/cards/schemas/my-card-schema.js`
2. Add `static registerSchema()` to your card class calling `configManager.registerCardSchema('my-card', schema)`
3. Call `MyCard.registerSchema()` in `src/lcards.js` after core initialisation

Once registered, `configManager.processConfig(userConfig, 'my-card', context)` automatically validates the merged config against that schema on every call — there's no separate opt-in step.

---

## Public API

### `CoreConfigManager` (schema registry + orchestration)

| Method | Returns | Description |
|---|---|---|
| `registerCardSchema(cardType, schema, options?)` | `void` | Register a JSON schema for a card type. `options.version` defaults to `'1.0'` |
| `getCardSchema(cardType)` | `Object\|null` | The raw registered schema, or `null` |
| `processConfig(userConfig, cardType, context?)` | `Promise<{ valid, mergedConfig, errors, warnings, provenance }>` | Runs the full merge pipeline, then validates the merged result against the registered schema (skipped silently if no schema is registered for `cardType`) |
| `getDebugInfo()` | `Object` | `{ initialized, stats, registeredCards: { schemas, defaults }, dependencies }` |

### `CoreValidationService` (structural validation)

| Method | Returns | Description |
|---|---|---|
| `validate(data, schema, context?)` | `{ valid, errors, warnings, data, schema }` | Validate `data` against a schema object, or a string name from the internal generic registry (`'card-config'`, `'entity-reference'`, `'action-config'`, `'position'`, `'size'`) |
| `validateTokens(config, context?)` | `{ errors, warnings }` | Runs `TokenValidator` — requires `setThemeManager()` to have been called first; returns `{ errors: [], warnings: [] }` otherwise. **Not invoked automatically** by `validate()` or by `configManager` — call it explicitly |
| `validateDataSources(config, context?)` | `{ errors, warnings }` | Runs `DataSourceValidator` — requires `setDataSourceManager()` first. **Not invoked automatically** either |
| `setThemeManager(themeManager)` | `void` | Wires up `validateTokens()` |
| `setDataSourceManager(dataSourceManager)` | `void` | Wires up `validateDataSources()` |
| `formatErrors(validationResult)` | `string` | Multi-line human-readable summary via the standalone `ErrorFormatter` |
| `getStats()` | `Object` | `{ validationsPerformed, errorsFound, warningsFound, cacheHits, entityChecks }` |
| `clearCache()` | `void` | Clears the validation-result cache and the entity-existence cache |
| `getDebugInfo()` | `Object` | See [Console Access](#console-access) below |

```javascript
// Card-type validation (the common path) goes through configManager, not validationService directly:
const configManager = window.lcards.core.configManager;
const result = await configManager.processConfig(this.config, 'lcards-button', { hass: this.hass });
if (!result.valid) {
  lcardsLog.warn('[MyCard] Config validation failed:', result.errors);
}

// Direct structural validation against an arbitrary schema object:
const vs = window.lcards.core.validationService;
const result2 = vs.validate({ entity: 'light.bedroom' }, myJsonSchema);
```

The config, editor, and MSD pipeline code paths all call `CoreValidationService.validate()` directly. `TokenValidator`/`DataSourceValidator` work correctly once wired up via `setThemeManager()`/`setDataSourceManager()`, but `validateTokens()`/`validateDataSources()` must be called explicitly — `validate()` runs structural and entity validation only.

---

## Console Access

::: code-group
```javascript [Snapshot]
window.lcards.debug.singleton('validationService')
// → {
//   initialized: true,
//   hasHASS: true,
//   config: {
//     strict: false, validateEntities: true, cacheResults: true, debug: false,
//     validateTokens: true, validateDataSources: true, stopOnError: false
//   },
//   stats: { validationsPerformed: 42, errorsFound: 3, warningsFound: 5, cacheHits: 18, entityChecks: 12 },
//   cacheSize: 24,
//   entityCacheSize: 12,
//   availableSchemas: ['card-config', 'entity-reference', 'action-config', 'position', 'size']
// }
```
```javascript [Live object]
const vs = window.lcards.core.validationService

vs.validate(config, schema, context)     // run structural validation directly
vs.getStats()                            // { validationsPerformed, errorsFound, warningsFound, cacheHits, entityChecks }
vs.clearCache()                          // clear validation + entity caches
vs.formatErrors(result)                  // human-readable multi-line summary

const cm = window.lcards.core.configManager
cm.getCardSchema('lcards-button')        // registered JSON schema for a card type
```
:::

Note: `availableSchemas` in the snapshot lists the **legacy generic schemas** built into `CoreValidationService` (`card-config`, `entity-reference`, `action-config`, `position`, `size`) — it does not include per-card-type schemas (`lcards-button`, `msd`, etc.), which live in `configManager` instead. Use `cm.getCardSchema('lcards-button')` for those.

---

## Error Output Format

`CoreValidationService.validate()` (and `CoreConfigManager.processConfig()`, which wraps it) returns:

```javascript
{
  valid: boolean,
  errors: Array<{ type, field, message, formattedMessage, suggestion, severity, context }>,
  warnings: Array<{ type, field, message, formattedMessage, suggestion, severity, context }>
}
```

`errors`/`warnings` are **objects, not plain strings** — each entry carries a machine-readable `type` (e.g. `'required_field'`, `'invalid_type'`, `'invalid_enum'`, `'out_of_range'`, `'missing_entity'`), the `field` path, and a `formattedMessage` produced automatically by the internal `CoreErrorFormatter`. Example `formattedMessage` values:

```
Required field "entity" is missing
Field "style.color" must be string, got number
Field "preset" must be one of: lozenge, pill, bullet, rectangle
Field "style.color" value 999 is out of valid range
Entity "light.bedroom_lamp" not found in Home Assistant
```

Entity references are checked only as a **warning** (`missing_entity`) when `validateEntities` is enabled and HASS is available — an unknown entity never blocks a save.

---

## TokenValidator

`TokenValidator` (`constructor(themeManager)`, `validate(config, context)`) walks a config object looking for theme-token-shaped string values and checks that each resolves against the active theme via `ThemeTokenResolver`. It's available on `validationService.tokenValidator` once `setThemeManager()` has been called, but — as noted above — nothing in the current codebase calls `validationService.validateTokens()` automatically; a card or pipeline stage that wants token validation must call it explicitly.

---

## Error Display

Validation errors surface in two places:

1. **Browser console** — structured log messages with field paths (via `lcardsLog.warn()` at call sites)
2. **Card editor** — `LCARdSBaseEditor._validateConfig()` calls `validationService.validate()` directly against the schema from `configManager.getCardSchema()` and stores the result for the YAML tab's inline error markers

---

## See Also

- [Card Foundation](../cards/lcards-card-foundation.md)
- [Developer: Custom Card](../../development/custom-card.md)
