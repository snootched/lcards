# Template System

> Unified template evaluation for all LCARdS cards and text fields.

---

## Overview

All dynamic text in LCARdS is processed by `UnifiedTemplateEvaluator`. It orchestrates four distinct sub-evaluators in a fixed priority order. Cards create a single evaluator instance and call `evaluateAsync()` on any string.

---

## Key Classes

| Class | File | Role |
|---|---|---|
| `UnifiedTemplateEvaluator` | `core/templates/UnifiedTemplateEvaluator.js` | Orchestrator — runs all four evaluators in order |
| `LCARdSCardTemplateEvaluator` | `core/templates/LCARdSCardTemplateEvaluator.js` | Handles JS `[[[...]]]` and token `{...}` templates |
| `DataSourceTemplateEvaluator` | `core/templates/DataSourceTemplateEvaluator.js` | Handles `{ds:name}` and `{datasource:name.key}` |
| `HATemplateEvaluator` | `core/templates/HATemplateEvaluator.js` | Sends Jinja2 to HA server for evaluation |
| `TemplateDetector` | `core/templates/TemplateDetector.js` | Fast type detection — avoids unnecessary evaluator calls |
| `TemplateParser` | `core/templates/TemplateParser.js` | Tokenises complex mixed-content strings |

---

## Template Types & Syntax

### 1 — JavaScript `[[[...]]]`

```yaml
text: "[[[return entity.state.toUpperCase()]]]"
text: "[[[return Math.round(entity.attributes.brightness / 2.55) + '%']]]"
```

Evaluation context includes: `entity`, `hass`, `config`, `theme`, `states`.

### 2 — LCARdS Tokens `{...}`

```yaml
text: "{entity.state}"
text: "{entity.attributes.friendly_name}"
text: "{theme:palette.moonlight}"
text: "{config.name}"
```

### 3 — DataSource `{ds:...}`

```yaml
text: "{ds:sensor_name}"                    # HA-native: locale-formatted + unit
text: "{ds:sensor_name.celsius:.1f}"        # processor buffer: 1 decimal, no auto-unit
text: "{ds:sensor_name.celsius:.1f} °C"    # manual unit suffix
text: "{datasource:temp.rolling_avg}"       # explicit long prefix
```

**Rule:** no format spec → HA-native display with unit. With a format spec → number only, caller controls the suffix.

### 4 — Jinja2 `{{...}}` / `{% %}`

```yaml
text: "{{states('sensor.temp')}} °C"
text: "{% if is_state('light.kitchen','on') %}On{% else %}Off{% endif %}"
```

Jinja2 is asynchronous — evaluated by HA server via WebSocket.

---

## Evaluation Order

A single string may contain multiple template types. They are evaluated sequentially:

1. JavaScript `[[[...]]]` replaced first (synchronous)
2. Token `{...}` replaced (synchronous)
3. DataSource `{ds:...}` replaced (synchronous — reads latest buffer value)
4. Jinja2 `{{...}}` sent to HA (async — awaited before render)

---

## Creating an Evaluator

```javascript
import { UnifiedTemplateEvaluator } from '../core/templates/UnifiedTemplateEvaluator.js';

const evaluator = new UnifiedTemplateEvaluator({
  hass: this.hass,
  context: {
    entity: this.hass.states[this.config.entity_id],
    config: this.config,
    hass: this.hass,
    theme: window.lcards.core.themeManager.getCurrentTheme()
  },
  dataSourceManager: window.lcards.core.dataSourceManager
});

const result = await evaluator.evaluateAsync(template);
```

---

## See Also

- [Templates User Guide](../../core/templates/)
- [DataSource System](datasource-system.md)
