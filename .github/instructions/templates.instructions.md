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
    variables: this.config.variables || {},
    theme:     window.lcards?.core?.themeManager?.getCurrentTheme()
  },
  dataSourceManager: window.lcards?.core?.dataSourceManager  // null if not needed
});

// Always use async evaluation — covers all 4 types
const result = await evaluator.evaluateAsync(template);
```

`evaluateAsync()` returns the original string on error (never throws) — check for the error sentinel only if you need to distinguish failure from a template that produces the word "error".

---

## DataSource Template Syntax

```
{datasource:source_name}           — current value, no format
{datasource:source_name:.2f}       — Python format spec (floats)
{datasource:source_name:>8}        — alignment
{ds:source_name}                   — short alias
{source_name}                      — legacy MSD syntax (backward compat only)
```

The explicit `{datasource:...}` form is preferred for new code. The legacy `{name}` form works but can create false positives when the name collides with a token key.

---

## Token Context Keys

Available in `{...}` token templates:

| Token | Resolves to |
|-------|------------|
| `{entity.state}` | `entity.state` (HA-translated display string) |
| `{entity.attributes.X}` | Entity attribute `X` |
| `{config.X}` | `config.X` from card config |
| `{variables.X}` | `config.variables.X` |
| `{theme:palette.moonlight}` | Theme token at path `palette.moonlight` |
| `{hass.user.name}` | Current HA user name |

---

## JavaScript Template Context

Inside `[[[...]]]`, the following are available as variables:

```javascript
[[[
  // Available: entity, config, hass, variables, states (= hass.states)
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
| `'parts'` | `{ value, unit }` object |
| `'unit'` | Unit string only |

Pass via `context.displayFormat` when creating the evaluator.

---

## Anti-patterns

❌ Don't create a new `UnifiedTemplateEvaluator` for each field in a render loop — create one per render cycle and reuse it for all fields
❌ Don't use `evaluator.evaluateAsync()` in `_renderCard()` (synchronous Lit render) — use `_processCustomTemplates()` + cache pattern instead
❌ Don't use the legacy `{name}` datasource syntax in new code — use `{datasource:name}` to avoid false positives with token keys
❌ Don't assume Jinja2 evaluation is synchronous — it's always async (network round-trip to HA)
❌ Don't manually scan config for Jinja2 entities — `_updateTrackedEntities()` does this automatically via `_extractAllConfigStrings()`
