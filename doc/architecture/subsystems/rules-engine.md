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

## Evaluation Flow

```
HASS state push
    → mark affected rules dirty  (dependency index O(1) lookup)
    → evaluate dirty rules only  (compiled predicates)
    → for each matched rule: compute patches
    → distribute patches to registered overlay listeners
    → overlays call requestUpdate()
```

---

## Rule Schema

```yaml
rules:
  - id: high_temp
    priority: 10
    when:
      entity: sensor.cpu_temp
      above: 75
    apply:
      style:
        color: var(--lcards-red)
      animations:
        - tag: temp_widget
          preset: alert_pulse
          loop: true

  - id: motion_active
    when:
      entity: binary_sensor.front_door
      state: "on"
    apply:
      style:
        background: var(--lcards-orange)
```

---

## Condition Operators

| Operator | Value type | Meaning |
|---|---|---|
| `state` | string | Exact state match |
| `above` | number | `numeric_state > value` |
| `below` | number | `numeric_state < value` |
| `attribute` | `{ key, value }` | Attribute equals value |
| `template` | JS string | `[[[code]]]` — truthy return |
| `all` | array of conditions | AND |
| `any` | array of conditions | OR |

---

## Targeting

Rules target overlays via:

| Field | Matches |
|---|---|
| `id:` | Exact overlay ID |
| `tag:` | Any overlay with that tag |
| `type:` | All overlays of that card type |
| `*` | All registered overlays |

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

Higher `priority` (lower number) wins when multiple rules target the same overlay property. A rule can include `stop_processing: true` to prevent lower-priority rules from being evaluated for that overlay.

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

- [Rule-Based Animations](../animations/rule-based-animations.md)
- [Debug API](../../development/debug-api.md)
