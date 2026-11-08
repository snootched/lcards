---
description: "Rule priority, stop and enabled: which rule wins when several patch the same card, and how to see which rules apply now (Rules tab, Provenance tab, browser console)."
---

# Priority and Debugging

**When several rules match at once, `priority` decides which one wins and `stop` can silence the rest.** This page also shows how to see which rules apply now. The rule keys themselves are on the [Rules Engine](./#rule-structure) page.

## priority

**The higher `priority` wins where two matching rules patch the same key of the same card.** Rules are also checked in descending priority order.

- Patches from several rules merge, highest priority on top: a key only one rule sets still applies, whatever its priority.
- Here power is 82, so both rules match and the red one (priority 100) wins. Drag power under 80 for yellow, and under 50 for neither.

```yaml live controls
type: custom:lcards-button
id: docs-rules-priority-btn
preset: lozenge
text:
  name:
    content: POWER
    show: true
rules:
  - id: docs-rules-priority-high
    priority: 100
    when:
      entity: input_number.lcards_test_power
      above: 80
    apply:
      overlays:
        docs-rules-priority-btn:
          style:
            card:
              color:
                background: var(--lcars-alert-red)
  - id: docs-rules-priority-mid
    priority: 50
    when:
      entity: input_number.lcards_test_power
      above: 50
    apply:
      overlays:
        docs-rules-priority-btn:
          style:
            card:
              color:
                background: var(--lcars-alert-yellow)
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `priority` | number | `0` | Higher wins. Rules with the same priority have no set order |

## stop

**`stop: true` makes a matching rule the only one that patches its cards: lower-priority rules' patches on those cards are dropped while it matches.** Use it for an alert that must override every other style.

- It works card by card: a lower-priority rule still patches cards the stopping rule does not touch, and its animations and blueprint filters still run.
- The whole lower patch is dropped, not only the keys that clash. Here, above 80 the button turns red and the lower rule's name change is dropped too; between 50 and 80 the name reads HIGH.

```yaml live controls
type: custom:lcards-button
id: docs-rules-stop-btn
preset: lozenge
text:
  name:
    content: POWER
    show: true
rules:
  - id: docs-rules-stop-critical
    priority: 100
    stop: true
    when:
      entity: input_number.lcards_test_power
      above: 80
    apply:
      overlays:
        docs-rules-stop-btn:
          style:
            card:
              color:
                background: var(--lcars-alert-red)
  - id: docs-rules-stop-high
    priority: 10
    when:
      entity: input_number.lcards_test_power
      above: 50
    apply:
      overlays:
        docs-rules-stop-btn:
          text:
            name:
              content: HIGH
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `stop` | boolean | `false` | While this rule matches, drop lower-priority rules' patches on the cards it patches |

## enabled

**`enabled: false` turns a rule off without deleting it.** The Rules tab's toggle in the card editor sets it.

- A rule that is off never matches, so it patches nothing and starts no animations.

```yaml live
type: custom:lcards-button
id: docs-rules-enabled-btn
preset: lozenge
text:
  name:
    content: RULE OFF
    show: true
rules:
  - id: docs-rules-enabled
    enabled: false
    when:
      entity: input_number.lcards_test_power
      above: 0
    apply:
      overlays:
        docs-rules-enabled-btn:
          style:
            card:
              color:
                background: var(--lcars-alert-red)
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `enabled` | boolean | `true` | `false` turns the rule off |

## Viewing active rules

**The card editor's Rules and Provenance tabs show which rules there are and what they change now; the browser console shows the engine's trace.**

- The **Rules** tab lists the rules that target this card and every rule on the page, with each rule's priority, `stop`, on or off, source card, targets, condition and number of changes. It adds, edits, reorders, turns off and deletes the rules in this card's config, and marks a rule that needs a page refresh to apply.
- The **Provenance** tab's "Set by rules now" filter lists the values of this card that a rule is setting right now, and which rule.

From the browser console:

```javascript
const rm = window.lcards.core.rulesManager;
rm.getAllRules()                     // all registered rules
rm.getTrace()                        // detailed evaluation trace
rm.getRecentMatches(30000)           // matches in the last 30 s (default 60 s)
rm.getRuleTrace('my-rule-id', 20)    // history for one rule (default the last 20)
```
