# Rules Engine

> **`window.lcards.core.rulesManager`** — Evaluates conditions and hot-patches card styles at runtime.

---

## Overview

`RulesEngine` extends `BaseService`. It maintains a compiled index of rules, tracks which entities each rule depends on, and re-evaluates dirty rules on every HASS state push. Matched rules produce **patches** — plain style objects that are merged onto target overlays without those overlays needing to know the rule exists.

---

## Key Classes

| Class | File | Role |
|---|---|---|
| `RulesEngine` | `core/rules/RulesEngine.js` | Evaluation loop, dependency index, patch distribution |
| `compileConditions` | `core/rules/compileConditions.js` | Compiles rule `when` DSL to optimised predicate functions |
| `RuleTraceBuffer` | `core/rules/RuleTraceBuffer.js` | Ring buffer of evaluation events for the Debug Panel |

---

## Compilation

When `RulesEngine` is constructed it immediately compiles every rule's `when` block into an optimised predicate tree via `compileRule()` in `compileConditions.js`. The result is stored in `this.compiledRules` (a `Map<ruleId, { tree, deps }>`):

- **`tree`** — a recursive node structure (`all`, `any`, `not`, leaf comparisons, `javascript`, `jinja2`) that `evalCompiled()` walks during evaluation.
- **`deps`** — sets of entity IDs, performance-metric keys, and feature flags that the rule references, used to build the dependency index.

Compilation happens once per `RulesEngine` instance (at construction). If rules are replaced, a new `RulesEngine` instance is created rather than mutating the existing one. Compilation issues (e.g. a plain string `condition` without `[[[ ]]]` or `{{ }}`) are logged as warnings and the affected rule falls back to an always-true node.

```javascript
// compileConditions.js shape
{ tree: {
    type: 'all',           // 'all' | 'any' | 'not' | 'leaf' | 'javascript' | 'jinja2' | 'always'
    nodes: [ ... ]
  },
  deps: {
    entities: Set<string>,
    perf:     Set<string>,
    flags:    Set<string>
  }
}
```

---

## Evaluation Flow

```
HASS state push
    → mark affected rules dirty  (dependency index O(1) lookup)
    → evaluate dirty rules only  (evalCompiled() walks compiled tree)
    → for each matched rule: compute patches
    → distribute patches to registered overlay listeners
    → overlays call requestUpdate()
```

---

## Rule Schema

```yaml
rules:
  - id: high_temp
    priority: 10             # higher number = evaluated first
    stop: false
    enabled: true
    when:
      entity: sensor.cpu_temp
      above: 75
    apply:
      overlays:
        tag:temp_widget:     # tag selector — all overlays tagged 'temp_widget'
          style:
            color: var(--lcars-red)
      animations:
        - tag: temp_widget
          preset: pulse
          loop: true

  - id: motion_active
    when:
      entity: binary_sensor.front_door
      state: "on"
    apply:
      overlays:
        front-door-button:   # direct overlay ID
          style:
            color: var(--lcars-orange)
```

---

## Condition Operators

| Operator | Value type | Meaning |
|---|---|---|
| `state` | string | Exact state match (alias for `equals`) |
| `equals` | string/number | Exact equality |
| `not_equals` | string/number | Inequality |
| `above` | number | `numeric_state > value` (strictly greater) |
| `at_least` | number | `numeric_state >= value` (inclusive) |
| `below` | number | `numeric_state < value` (strictly less) |
| `at_most` | number | `numeric_state <= value` (inclusive) |
| `in` | array | State is one of the listed values |
| `not_in` | array | State is not in the listed values |
| `regex` | string | State matches regular expression |
| `attribute` | string | Attribute name — pair with comparison operator |
| `all` | condition[] | AND — all nested conditions must match |
| `any` | condition[] | OR — at least one nested condition must match |
| `not` | condition | Negate a nested condition |
| `condition` | string | JS `[[[code]]]` or Jinja2 `{{template}}` — truthy return |
| `jinja2` | string | Explicit Jinja2 template |
| `javascript` | string | Explicit JavaScript expression |
| `time_between` | `"HH:MM-HH:MM"` | True when current time is in range |
| `weekday_in` | string[] | True when today is one of `mon`…`sun` |
| `sun_elevation` | `{ above?, at_least?, below?, at_most? }` | True when sun elevation matches |
| `perf_metric` | `{ key, above?, at_least?, below?, at_most? }` | Internal performance metric comparison |
| `random_chance` | number 0–1 | True with given probability each evaluation |

---

## Targeting

The keys of `apply.overlays` are selectors. Each maps to a patch fragment:

| Selector form | Matches |
|---|---|
| `overlay-id` | Exact overlay ID (direct match) |
| `tag:tagname` | All overlays with tag `tagname` |
| `type:typename` | All overlays of type `typename` |
| `pattern:regex` | All overlays whose ID matches the regex |
| `all` | Every registered overlay |
| `exclude` | Array of IDs to exclude from bulk selectors |

Multiple selectors in one rule are merged; later selectors' style keys override earlier ones for the same overlay.

---

## Card Integration

```javascript
// Register overlay (in _handleFirstUpdate)
this._registerOverlayForRules({ id: `btn-${this._cardGuid}`, type: 'button' });

// Receive patches
_onRulePatchesChanged(patches) {
  this._resolveStyle();   // merge config.style + patches, then requestUpdate()
}
```

---

## Priority & Stop Processing

Higher `priority` **number** wins when multiple rules target the same overlay property (default `0`). Rules are evaluated in descending priority order.

Set `stop: true` on a rule to prevent lower-priority rules from running at all once this rule matches.

---

## Public API

| Property / Method | Returns | Description |
|---|---|---|
| `rules` | `Rule[]` | All registered rules in evaluation order |
| `rulesById` | `Map<id, Rule>` | Rules keyed by ID for fast lookup |
| `getAllRules()` | `Rule[]` | Array of all registered rule objects |
| `getTrace()` | `Object` | Detailed evaluation trace with per-overlay match history |
| `getRecentMatches(windowMs)` | `Match[]` | All rule matches within the last N milliseconds |
| `getRuleTrace(ruleId, limit?)` | `Object[]` | Per-rule match history with optional result count limit |

---

## Console Access

::: code-group
```javascript [Snapshot]
window.lcards.debug.singleton('rulesManager')
// → { type: 'RulesEngine', rulesCount: 3, dirtyRules: 0, evalCounts: {...}, trace: {...} }
```
```javascript [Live object]
const rm = window.lcards.core.rulesManager

rm.rules                            // full rules array
rm.rulesById                        // Map<id, rule>
rm.getTrace()                       // detailed evaluation trace
rm.getRecentMatches(30000)          // matches in the last 30s
rm.getRuleTrace('my-rule-id', 20)   // history for one rule
rm.getAllRules()                     // array of all registered rules
```
:::

---

## See Also

- [Rule-Based Animations](../../core/animations/rule-based-animations.md)
- [Debug API](../../development/debug-api.md)
