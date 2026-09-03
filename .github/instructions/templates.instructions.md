---
applyTo: "src/core/templates/**, src/cards/**"
---

# LCARdS Template System Rules

---

## Four Template Types — Evaluation Order

`UnifiedTemplateEvaluator` processes these types **in order** in a single pass:

| # | Type | Syntax | Sync/Async |
|---|------|--------|------------|
| 1 | JavaScript | `[[[return entity.state.toUpperCase()]]]` | Sync |
| 2 | Token | `{entity.state}`, `{entity.attributes.brightness}`, `{theme:palette.moonlight}` | Sync |
| 3 | DataSource | `{datasource:sensor_temp:.1f}°C`, `{ds:cpu_usage}` | Sync |
| 4 | Jinja2 | `{{states("sensor.temp")}}`, `{% if is_state(...) %}` | Async (via HA) |

Each phase receives the output of the previous phase. Jinja2 is always last because it requires a round trip to Home Assistant.

Jinja2 templates round-trip to HA's real `render_template` API (the same engine as automations/template sensors — no client-side sanitization of the template text) with a `variables: { config, user, variables }` payload mirroring the JS/Token context below, so `{{ config.x }}` / `{{ user }}` / `{{ variables.x }}` work inside `{{ }}` too.

`evaluateAsync()` (all four phases) and `evaluateSync()` (JS + Token + DataSource only, **no Jinja2**) are both public entry points on `UnifiedTemplateEvaluator` — use `evaluateSync()` when a value must resolve synchronously without an `await` (e.g. a field recomputed on every hass tick, like `lcards-slider.js`'s marker `value`/`min`/`max` resolution). It never attempts Jinja2, so a `{{ }}`/`{% %}` template handed to `evaluateSync()` is left unevaluated.

---

## Creating an Evaluator

Always create one evaluator per evaluation context — do not reuse across different cards or config scopes.

```javascript
import { UnifiedTemplateEvaluator } from '../core/templates/UnifiedTemplateEvaluator.js';

const evaluator = new UnifiedTemplateEvaluator({
  hass: this.hass,
  context: {
    entity:    this.hass.states[this.config.entity],  // or null
    config:    this.config,
    hass:      this.hass,
    states:    this.hass.states,                      // flat dict, keyed by full entity_id
    variables: this.config.variables || {},
    theme:     window.lcards?.core?.themeManager?.getCurrentTheme()
  },
  dataSourceManager: window.lcards?.core?.dataSourceManager  // null if not needed
});

// Use async evaluation to cover all 4 types (including Jinja2)
const result = await evaluator.evaluateAsync(template);

// Or, when the caller can't await (e.g. resolved on every hass tick):
const syncResult = evaluator.evaluateSync(template); // JS + Token + DataSource only
```

Per-phase error/fallback behaviour differs — none of them throw up to the caller:

| Phase | On failure |
|-------|-----------|
| JavaScript | Original `[[[...]]]` text returned unevaluated |
| Token | Empty string |
| DataSource | Empty string (unresolved source) |
| Jinja2 | Original content string returned unchanged (also on the 5s HA round-trip timeout) |

`evaluateAsync()`'s outer try/catch is a last-resort safety net on top of the above — check for the error sentinel only if you need to distinguish failure from a template that legitimately produces the word "error".

---

## DataSource Template Syntax

```
{datasource:source_name}           — current value, no format
{datasource:source_name:.2f}       — Python format spec (floats)
{ds:source_name}                   — short alias
{source_name}                      — legacy MSD syntax (backward compat only)
```

No padding/alignment specs (e.g. `:>8`) are supported — an unrecognized format spec is silently ignored and the raw value is used as-is.

The explicit `{datasource:...}` form is preferred for new code. The legacy `{name}` form works but can create false positives when the name collides with a token key.

---

## Token Context Keys

Available in `{...}` token templates:

| Token | Resolves to |
|-------|------------|
| `{entity.state}` | `entity.state` (HA-translated display string) |
| `{entity.attributes.X}` | Entity attribute `X` |
| `{states.domain.object_id.state}` | State of an **explicitly named** entity (not `config.entity`) — HA-translated display string |
| `{states.domain.object_id.attributes.X}` | Attribute `X` of an explicitly named entity |
| `{config.X}` | `config.X` from card config |
| `{variables.X}` | `config.variables.X` |
| `{theme:palette.moonlight}` | Theme token at path `palette.moonlight` |
| `{hass.user.name}` | Current HA user name |

`{states.domain.object_id...}` requires `states` to be present on the evaluator's `context` (see above) — it is a flat dict keyed by the full `"domain.object_id"` string, so the entity ID is reconstructed from the two segments right after `states` (`_resolveToken()` special-cases this, since a plain per-segment dot-walk can't otherwise resolve a key that itself contains a `.`).

---

## JavaScript Template Context

Inside `[[[...]]]`, the following are available as variables:

```javascript
[[[
  // Available: entity, config, hass, variables, states (= hass.states), theme, user
  if (!entity) return 'No entity';
  return entity.state === 'on' ? 'Active' : 'Inactive';
]]]
```

Return a value explicitly. `undefined` renders as empty string.

---

## Jinja2 Auto-tracking

The card base class scans all config string values for Jinja2 entity references (via `TemplateParser.extractJinja2Entities()`) and registers them in `_trackedEntities`. HASS updates for those entities trigger template re-evaluation automatically.

For JS templates or token templates that reference entities the scanner can't detect statically, use `triggers_update`:

```yaml
triggers_update:
  - sensor.outdoor_temperature
  - binary_sensor.motion_kitchen
```

---

## Pre-evaluating Style Templates

When a card needs Jinja2/JS templates to be resolved **before** synchronous SVG/style generation, pre-evaluate them in `_processCustomTemplates()` and consume via `_resolveTemplateValue()`:

```javascript
async _processCustomTemplates() {
  // Pre-evaluate any template strings found in config.style
  await this._preEvaluateStyleTemplates(this.config.style);
  this.requestUpdate();
}

_resolveStyle() {
  // Inside synchronous style resolution:
  const color = this._resolveTemplateValue(this.config.style.color) || fallback;
}
```

`_resolveTemplateValue(value)` returns the cached evaluated result if the value was a template; otherwise returns the value unchanged.

---

## `displayFormat` Option

Token evaluation of `{entity.state}` respects a `displayFormat` option on the evaluator context:

| Value | Behaviour |
|-------|-----------|
| `'friendly'` _(default)_ | HA-translated display string (e.g. "Open", "Playing") |
| `'raw'` | Raw `entity.state` string (e.g. "on", "playing") |
| `'parts'` | Value and unit joined into one string (e.g. `"23.5 °C"`) |
| `'unit'` | Unit string only |

Pass via `context.displayFormat` when creating the evaluator.

---

## Anti-patterns

❌ Don't create a new `UnifiedTemplateEvaluator` for each field in a render loop — create one per render cycle and reuse it for all fields
❌ Don't use `evaluator.evaluateAsync()` in `_renderCard()` (synchronous Lit render) — use `_processCustomTemplates()` + cache pattern instead
❌ Don't use the legacy `{name}` datasource syntax in new code — use `{datasource:name}` to avoid false positives with token keys
❌ Don't assume Jinja2 evaluation is synchronous — it's always async (network round-trip to HA)
❌ Don't manually scan config for Jinja2 entities — `_updateTrackedEntities()` does this automatically via `_extractAllConfigStrings()`
