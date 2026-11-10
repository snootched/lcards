# Validation Service

> Config schema validation for all LCARdS card types: `window.lcards.core.validationService`

---

## Overview

Runtime config validation is split across two singletons:

- **`CoreConfigManager`** (`window.lcards.core.configManager`) owns the **per-card-type schema registry** (`registerCardSchema()` / `getCardSchema()`) and validates automatically as the last step of `processConfig()`. Its merge pipeline has its own page: [Config Manager](config-manager.md).
- **`CoreValidationService`** (`window.lcards.core.validationService`, `src/core/validation-service/index.js`) does the structural validation, `validate(data, schema, context)`. It also holds optional token-reference and data-source-reference validators, and a small internal registry of generic schemas (`card-config`, `entity-reference`, `action-config`, `position`, `size`).

`CoreValidationService` is a plain class (it does not extend `BaseService`). Core creates it in `_performInitialization()` with `{ validateEntities: true, cacheResults: true, debug: false }`, calls `initialize(hass)`, and passes hass updates to `updateHass()` from `LCARdSCore._updateHass()` (`src/core/lcards-core.js`).

This is the **runtime** validator that runs in the browser. The build and the user CLI use a different checker: `scripts/lib/config-validator.js` (ajv over the published schemas, plus unknown keys and registry names). Both read the same card schemas from `src/cards/schemas/`.

---

## Key files

| File | Role |
|---|---|
| `src/core/validation-service/index.js` | `CoreValidationService` (`validate()`), plus the internal `CoreSchemaRegistry` (5 generic schemas) and `CoreErrorFormatter` (applied inside `validate()`) |
| `src/core/validation-service/TokenValidator.js` | Checks theme-token references against a `ThemeManager`; only through `validationService.validateTokens()` |
| `src/core/validation-service/DataSourceValidator.js` | Checks `source` / `data_source` / `sources` on data-source-capable config types; only through `validationService.validateDataSources()` |
| `src/core/validation-service/ErrorFormatter.js` | Turns a validation result into a multi-line string, for `validationService.formatErrors()` |
| `src/core/config-manager/index.js` | `CoreConfigManager`: schema registry (`_cardSchemas`), merge pipeline, `_validateConfig()` which calls `validationService.validate()` |
| `src/cards/schemas/*.js` | Per-card schema definitions (`button-schema.js`, `msd-schema.js`, ...); shared parts in `common-schemas.js` |
| `src/cards/schemas/card-plumbing.js` | `CARD_PLUMBING_KEYS`: Home Assistant layout keys and card-mod / UIX keys accepted at any card root |

---

## Schema registration

Each card class has a static `registerSchema()`. `src/lcards-main.js` calls them once, after core initialisation and the custom element definitions:

```javascript
if (window.lcards?.core?.configManager) {
    if (LCARdSButton.registerSchema) LCARdSButton.registerSchema();
    if (LCARdSElbow.registerSchema) LCARdSElbow.registerSchema();
    if (LCARdSChart.registerSchema) LCARdSChart.registerSchema();
    if (LCARdSSlider.registerSchema) LCARdSSlider.registerSchema();
    if (LCARdSDataGrid.registerSchema) LCARdSDataGrid.registerSchema();
    if (LCARdSMSDCard.registerSchema) LCARdSMSDCard.registerSchema();
    if (LCARdSAlertOverlay.registerSchema) LCARdSAlertOverlay.registerSchema();
    if (LCARdSSelectMenu.registerSchema) LCARdSSelectMenu.registerSchema();
    if (LCARdSLayoutCard.registerSchema) LCARdSLayoutCard.registerSchema();
    if (LCARdSAstrometricsCard.registerSchema) LCARdSAstrometricsCard.registerSchema();
}
```

The schemas are registered under the card's `CARD_TYPE` (the key `processConfig()` is called with), not the custom element name:

| Card | Registered as |
|---|---|
| Button | `button` |
| Elbow | `elbow` |
| Chart | `chart` |
| Slider | `slider` |
| Data grid | `data-grid` |
| MSD | `msd` |
| Alert overlay | `alert-overlay` |
| Select menu | `select-menu` |
| Layout card | `layout-card` |
| Astrometrics | `astrometrics`: its `registerSchema()` only registers the defaults (`{ height: 400 }`); the schema is a lazy chunk registered on first use by `ensureAstrometricsSchema()` (`src/cards/lcards-astrometrics-card.js`), so it stays out of the main bundle |

Inside `registerSchema()` the card builds its schema with the runtime option lists (presets, components, positions) and registers it:

```javascript
static registerSchema() {
    const configManager = window.lcards?.core?.configManager;
    if (!configManager) {
        lcardsLog.error('[MyCard] CoreConfigManager not available for schema registration');
        return;
    }
    const schema = getMyCardSchema({ /* runtime options, e.g. available presets */ });
    configManager.registerCardSchema('my-card', schema, { version: __LCARDS_VERSION__ });
    // Behavioural defaults, if the card has any (see the Config Manager page)
    configManager.registerCardDefaults('my-card', { orientation: 'horizontal' });
}
```

To add a new card type to validation:

1. Add a schema file at `src/cards/schemas/my-card-schema.js`, every property with a `description`.
2. Add `static CARD_TYPE = 'my-card'` and `static registerSchema()` to the card class.
3. Call `MyCard.registerSchema()` in `src/lcards-main.js`.
4. Add the schema to `scripts/lib/card-schemas.js` so the doc validator, the description check and the published schema know it.

Once registered, every `processConfig(userConfig, 'my-card', context)` validates the merged config against that schema; with no schema registered, validation is skipped and the result is `valid: true`.

---

## What `validate()` checks

`validate(data, schema, context = {})`:

1. counts the call, builds a cache key `JSON.stringify(data) + schema (name or JSON) + JSON.stringify(context)` and returns a cached result if `config.cacheResults`;
2. looks up a string schema in `CoreSchemaRegistry` (unknown name: `schema_not_found` error);
3. walks the schema (`_validateAgainstSchema()`);
4. if `config.validateEntities` and hass is present, checks entity references (`_validateEntities()`);
5. sets `valid = errors.length === 0` (warnings never make a result invalid; there is no strict mode);
6. runs every error and warning through `CoreErrorFormatter.formatError()`, caches the result, returns it.

An exception inside gives a `validation_error` error.

The walker is hand-written, not ajv. It supports:

| Schema feature | Behaviour |
|---|---|
| `type` (one or a list) | A list dispatches on the value's runtime type |
| `oneOf` / `anyOf` | Passes when any option matches (a multi-match `oneOf` is tolerated); the matching branch's warnings surface, and a `deprecated` branch warns |
| `properties` | Each present property is validated; `discriminatedBy` picks the sub-schema from a sibling field |
| `required: true` on a property | Missing: `required_field` **error** |
| `required: [...]` (array form) | Missing: `missing_recommended_field` **warning** (never enforced as an error, so older saved configs are not rejected) |
| `additionalProperties: false` | Unknown key: `invalid_property` **error** |
| `additionalProperties: 'warn'` | Unknown key: `invalid_property` **warning** |
| `deprecated` (with `x-replacement`) | `deprecated_property` warning |
| `enum`, `pattern`, `minimum`, `maximum`, `minLength`, `maxLength` | `invalid_enum`, `invalid_format`, `out_of_range` errors |
| `items`, `minItems`, `maxItems` | Array checks |
| Root `CARD_PLUMBING_KEYS` | Always accepted at the root |

Entity checks (`_findEntityReferences()`): only values under the keys `entity`, `entity_id` and `entities` that look like `domain.object` are checked, and nothing under a `.card.`, `.card_config.` or `.cardConfig.` path (nested cards validate their own). A missing entity is a `missing_entity` **warning**, never an error. The check is skipped while `hass.states` is empty. Results are cached per entity id in `entityCache`, which `updateHass()` clears; the result cache (`validationCache`) is not cleared on hass updates.

---

## Public API

### `CoreConfigManager` (schema registry)

| Method | Returns | Description |
|---|---|---|
| `registerCardSchema(cardType, schema, options?)` | `void` | Register a schema; `options.version` defaults to `'1.0'` |
| `getCardSchema(cardType)` | `Object \| null` | The registered schema |
| `processConfig(userConfig, cardType, context?)` | `Promise<{ valid, mergedConfig, errors, warnings, provenance }>` | Merge, resolve tokens, validate. See [Config Manager](config-manager.md) |

`registerCardDefaults()`, `updateContext()` and the merge layers are on the [Config Manager](config-manager.md) page.

### `CoreValidationService`

| Method | Returns | Description |
|---|---|---|
| `initialize(hass?)` | `Promise<void>` | Stores hass, sets `initialized` |
| `validate(data, schema, context?)` | `{ valid, errors, warnings, data, schema }` | Validate against a schema object or a registry name (`'card-config'`, `'entity-reference'`, `'action-config'`, `'position'`, `'size'`); `schema` in the result is the name or `'inline'` |
| `validateTokens(config, context?)` | `{ errors, warnings }` | Runs `TokenValidator`; needs `setThemeManager()` first, else returns empty lists. Not called by `validate()` |
| `validateDataSources(config, context?)` | `{ errors, warnings }` | Runs `DataSourceValidator`; needs `setDataSourceManager()` first. Not called by `validate()` |
| `setThemeManager(themeManager)` | `void` | Creates `tokenValidator` |
| `setDataSourceManager(dataSourceManager)` | `void` | Creates `dataSourceValidator` |
| `formatErrors(validationResult)` | `string` | Multi-line summary via `ErrorFormatter` |
| `setCaching(enabled)` | `void` | Sets `config.cacheResults`; `false` also clears the caches |
| `clearCache()` | `void` | Clears the result cache and the entity cache |
| `updateHass(hass)` | `void` | Stores hass, clears the entity cache |
| `getStats()` | `Object` | `{ validationsPerformed, errorsFound, warningsFound, cacheHits, entityChecks }` |
| `getDebugInfo()` | `Object` | See [Console access](#console-access) |
| `destroy()` | `void` | Clears caches and hass |

```javascript
// The common path: card types validate through configManager
const configManager = window.lcards.core.configManager;
const result = await configManager.processConfig(this._rawConfig, 'button', { hass: this.hass });
if (!result.valid) {
    lcardsLog.warn('[MyCard] Config validation failed:', result.errors);
}

// Direct structural validation against any schema object
const vs = window.lcards.core.validationService;
const direct = vs.validate({ entity: 'light.bedroom' }, myJsonSchema);
```

---

## Who calls it

| Caller | What it does |
|---|---|
| `CoreConfigManager._validateConfig()` | `validate(mergedConfig, schema, { context: cardType })` for every `processConfig()` (cards, MSD) |
| `LCARdSBaseEditor._validateConfigWithSingleton()` (`src/editor/base/LCARdSBaseEditor.js`) | `validate(config, this._getSchema(), { cardType, source: 'editor' })`; used by `_validateConfig()` and on YAML edits, where only a valid result is committed and the errors feed the YAML tab's markers (`_validationErrors`) |
| MSD pipeline (`initMsdPipeline()`, `src/msd/pipeline/PipelineCore.js`) | Does not call `validate()` itself: MSD configs are validated by `processConfig()` through `ConfigProcessor.processAndValidateConfig()`, and errors there disable the pipeline. It hands the shared service to the coordinator (below) |

The MSD pipeline does not write the service's `config`. It calls `setThemeManager()` / `setDataSourceManager()` with the coordinator's managers (the core singletons), stores the service as `coordinator.validationService` and publishes it as `window.lcards.validationService`. `config` is shared by every card and is not set for one.

---

## Console access

::: code-group
```javascript [Snapshot]
window.lcards.debug.singleton('validationService')
// {
//   initialized: true,
//   hasHASS: true,
//   config: {
//     validateEntities: true, cacheResults: true, debug: false,
//     validateTokens: true, validateDataSources: true, stopOnError: false
//   },
//   stats: { validationsPerformed, errorsFound, warningsFound, cacheHits, entityChecks },
//   cacheSize: 24,
//   entityCacheSize: 12,
//   availableSchemas: ['card-config', 'entity-reference', 'action-config', 'position', 'size']
// }
```
```javascript [Live object]
const vs = window.lcards.core.validationService;

vs.validate(config, schema, context);     // structural validation
vs.getStats();
vs.clearCache();
vs.setCaching(false);                     // re-validate on every call while debugging
vs.formatErrors(result);

const cm = window.lcards.core.configManager;
cm.getCardSchema('button');               // registered schema for a CARD_TYPE
cm.getDebugInfo().registeredCards;        // { schemas: [...], defaults: [...] }
```
:::

`availableSchemas` lists the generic schemas built into `CoreValidationService`, not the card schemas; those are in `configManager` (`cm.getCardSchema('button')`). `config.validateTokens` and `config.validateDataSources` are flags only: nothing reads them.

---

## Error output

`validate()` (and `processConfig()`, which passes its lists through) returns:

```javascript
{
  valid: boolean,
  errors:   Array<{ type, field, message, formattedMessage, suggestion, severity, context }>,
  warnings: Array<{ type, field, message, formattedMessage, suggestion, severity, context }>
}
```

Entries are objects. `formattedMessage` and `suggestion` come from `CoreErrorFormatter` templates where one exists for the `type`, else `'Validation error: {message}'` and `'Check your configuration'`:

| `type` | List | `formattedMessage` template |
|---|---|---|
| `required_field` | errors | `Required field "{field}" is missing` |
| `invalid_type` | errors | `Field "{field}" must be {expected}, got {actual}` |
| `invalid_enum` | errors | `Field "{field}" must be one of: {validValues}` |
| `invalid_format` | errors | `Field "{field}" has invalid format` |
| `out_of_range` | errors | `Field "{field}" value {value} is out of valid range` |
| `invalid_property` | errors or warnings (`additionalProperties: false` / `'warn'`) | generic (`Validation error: Unexpected property "..."`) |
| `missing_recommended_field` | warnings | generic |
| `deprecated_property` | warnings | generic |
| `unrecognized_discriminator` | warnings | generic |
| `missing_entity` | warnings | `Entity "{entity}" not found in Home Assistant` |
| `schema_not_found`, `validation_error` | errors | generic |

---

## TokenValidator

`TokenValidator` (`constructor(themeManager)`, `validate(config, context)`) walks a config for theme-token-shaped strings and checks that each resolves against the active theme. It exists on `validationService.tokenValidator` after `setThemeManager()` (today only the MSD pipeline calls that). Nothing calls `validateTokens()` automatically.

---

## Error display

1. **Browser console**: `LCARdSCard._processConfigAsync()` logs `result.errors` with `lcardsLog.error` and `result.warnings` with `lcardsLog.warn`, and applies the merged config either way.
2. **Card editor**: the YAML tab shows the errors from `_validateConfigWithSingleton()` inline and does not commit an invalid YAML edit.

---

## See also

- [Config Manager](config-manager.md)
- [Card Foundation](../cards/lcards-card-foundation.md)
- [Developer: Custom Card](../../development/custom-card.md)
