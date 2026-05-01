# Bulk Overlay Selectors Reference

> **Target multiple overlays with selector keywords**
> Efficient bulk updates for alert systems and global state changes

## Overview

The **Bulk Overlay Selector System** allows you to target multiple overlays in a single rule using special selector keywords, eliminating the need to list every overlay individually. This is particularly powerful for implementing global state changes like alert systems.

**Key Benefits:**
- ✅ Update all overlays with a single rule
- ✅ Target overlays by type, tag, or pattern
- ✅ Exclude specific overlays from bulk changes
- ✅ Layer multiple selectors for complex scenarios
- ✅ Maintain backwards compatibility with direct overlay IDs

---
## Quick Example

### Before (Tedious - Multiple Overlay Updates)

```yaml
rules:
  - id: red_alert
    when: {entity: input_select.alert, state: "red_alert"}
    apply:
      overlays:
        text1:                    # Each overlay needs explicit ID
          style: {color: "red"}
        text2:
          style: {color: "red"}
        chart1:
          style: {color: "red"}
        # ... must list ALL 50+ overlays 😱
```

### After (Efficient - Bulk Selector)

```yaml
rules:
  - id: red_alert
    when: {entity: input_select.alert, state: "red_alert"}
    apply:
      overlays:
        all:  # ✨ One selector updates everything
          style: {color: "red"}
```

---

## Selector Types

### 1. `all:` - Target All Overlays

Applies to every overlay in your MSD.

```yaml
rules:
  - id: red_alert
    when: {entity: input_select.alert, state: "red_alert"}
    apply:
      overlays:
        all:
          style:
            color: "var(--lcars-red)"
            border_color: "var(--lcars-red)"
            border_width: 4
```

**Use Cases:**
- Global alert states (Red Alert)
- Theme switches
- Opacity/visibility changes for all overlays

---

### 2. `type:typename:` - Target by Overlay Type

Targets all overlays of a specific type.

**Available Types:**
- `type:line:` - All line overlays
- `type:control:` - All control overlays

**Example:**

```yaml
rules:
  - id: blue_alert
    when: {entity: input_select.alert, state: "blue_alert"}
    apply:
      overlays:
        type:control:  # All controls turn blue
          style:
            color: "var(--lcars-blue)"

        type:line:  # All lines get blue color
          style:
            color: "var(--lcars-blue)"
```

**Use Cases:**
- Style all controls consistently
- Change line colors globally

---

### 3. `tag:tagname:` - Target by Tag

Targets overlays with specific tags (semantic grouping).

**Step 1: Tag your overlays**

```yaml
overlays:
  - id: warp_core_temp
    type: apexchart
    tags: ["critical", "engineering"]
    # ... rest of config

  - id: shield_status
    type: status_grid
    tags: ["critical", "tactical"]
    # ... rest of config

  - id: crew_roster
    type: text
    tags: ["informational"]
    # ... rest of config
```

**Step 2: Target by tag in rules**

```yaml
rules:
  - id: yellow_alert
    when: {entity: input_select.alert, state: "yellow_alert"}
    apply:
      overlays:
        tag:critical:  # Only critical systems change
          style:
            color: "var(--lcars-yellow)"
            border_color: "var(--lcars-yellow)"
```

**Tag Naming Conventions:**

✅ **Recommended Tags:**

By Criticality:
- `critical` - Life-critical systems
- `important` - Important but not critical
- `informational` - Display-only information

By Function:
- `engineering` - Engineering systems
- `tactical` - Weapons, shields, sensors
- `navigation` - Navigation and helm
- `security` - Security systems
- `medical` - Medical systems

By Behavior:
- `alert-sensitive` - Changes on alert status
- `real-time` - Updates frequently
- `static` - Rarely changes

**Use Cases:**
- Department-specific dashboards
- Criticality-based alerts
- Behavioral grouping

---

### 4. `pattern:regex:` - Target by ID Pattern

Targets overlays whose IDs match a regular expression.

```yaml
rules:
  - id: high_temp_alert
    when: {entity: sensor.avg_temp, above: 80}
    apply:
      overlays:
        pattern:^temp_.*:  # All IDs starting with "temp_"
          style:
            color: "var(--lcars-red)"

        pattern:.*_sensor$:  # All IDs ending with "_sensor"
          style:
            border_width: 3
```

**Use Cases:**
- Naming convention-based targeting
- Legacy config support
- Complex ID-based grouping

---

### 5. `exclude:` - Exclude Specific Overlays

Excludes specific overlay IDs from bulk targeting.

```yaml
rules:
  - id: red_alert
    when: {entity: input_select.alert, state: "red_alert"}
    apply:
      overlays:
        all:
          style: {color: "red"}

        exclude: ["ship_logo", "stardate"]  # Don't change these
```

**Use Cases:**
- Preserve branding elements
- Protect control panels
- Exception handling

---

## Advanced Patterns

### Pattern 1: Layered Styling

Apply different styles to different groups in one rule:

```yaml
rules:
  - id: intruder_alert
    when: {entity: input_select.alert, state: "intruder_alert"}
    apply:
      overlays:
        # Base layer: All overlays get yellow border
        all:
          style:
            border_color: "var(--lcars-yellow)"
            border_width: 1

        # Critical layer: Critical systems turn red
        tag:critical:
          style:
            color: "var(--lcars-red)"
            border_width: 4

        # Security layer: Security systems enhanced
        tag:security:
          style:
            border_width: 6

        # Exclusions
        exclude: ["ship_logo"]
```

**Result:** Three layers of styling with exclusions.

---

### Pattern 2: Conditional Tag Targeting

Combine entity conditions with tag targeting:

```yaml
rules:
  # Critical alert when any critical system over threshold
  - id: critical_system_alert
    when:
      any:
        - entity: sensor.warp_core_temp
          above: 90
        - entity: sensor.shield_power
          below: 20
    apply:
      overlays:
        tag:critical:
          style:
            color: "var(--lcars-red)"
            border_color: "var(--lcars-red)"
            border_width: 4
```

---

## Real-World Example: Star Trek Alert System

Complete implementation of canonical LCARS alert system:

```yaml
# Create HA helper entity first:
# input_select:
#   ship_alert_status:
#     name: "Ship Alert Status"
#     options: ["normal", "yellow_alert", "red_alert", "blue_alert"]
#     initial: "normal"

overlays:
  # Tag your overlays
  - id: warp_core_temp
    type: control
    tags: ["critical", "engineering", "alert-sensitive"]
    # ... config

  - id: shields
    type: control
    tags: ["critical", "tactical", "alert-sensitive"]
    # ... config

  - id: crew_roster
    type: control
    tags: ["informational"]
    # ... config

rules:
  # Normal operation
  - id: alert_normal
    priority: 10
    when: {entity: input_select.ship_alert_status, state: "normal"}
    apply:
      overlays:
        all:
          style:
            color: "var(--lcars-blue)"
            border_color: null

  # Yellow alert - elevated readiness
  - id: alert_yellow
    priority: 20
    when: {entity: input_select.ship_alert_status, state: "yellow_alert"}
    apply:
      overlays:
        tag:critical:
          style:
            color: "var(--lcars-yellow)"
            border_color: "var(--lcars-yellow)"
            border_width: 2

  # Red alert - maximum danger
  - id: alert_red
    priority: 30
    when: {entity: input_select.ship_alert_status, state: "red_alert"}
    apply:
      overlays:
        all:
          style:
            color: "var(--lcars-red)"
            border_color: "var(--lcars-red)"
            border_width: 4
        exclude: ["ship_logo", "stardate"]

  # Blue alert - atmospheric operations
  - id: alert_blue
    priority: 25
    when: {entity: input_select.ship_alert_status, state: "blue_alert"}
    apply:
      overlays:
        type:control:
          style: {color: "var(--lcars-blue)"}
        type:line:
          style:
            color: "var(--lcars-blue)"
```

---

## Tagging Best Practices

### Multi-Tag Strategy

Use multiple tags for flexible targeting:

```yaml
overlays:
  - id: warp_core_temp
    tags: [
      "critical",         # Criticality
      "engineering",      # Department
      "real-time",        # Behavior
      "alert-sensitive"   # Response
    ]
```

### Consistent Naming

✅ **Do:**
- Use lowercase
- Use hyphens for multi-word: `life-support`
- Be descriptive: `engineering` not `eng`
- Be consistent across config

❌ **Don't:**
- Use spaces: `life support`
- Use camelCase: `lifeSupport`
- Use abbreviations: `eng`
- Mix naming styles

---

## Selector Priority

When an overlay matches multiple selectors, **later selectors override earlier ones**:

```yaml
overlays:
  all:
    style: {color: "blue"}  # Applied first

  tag:critical:
    style: {color: "red"}   # Overrides blue for critical overlays
```

**Order matters!** Put more general selectors first, specific ones last.

---

## Performance

### Optimization

Selector resolution is **O(n)** where n = number of overlays.

**Benchmarks:**
- 10 overlays: <1ms
- 50 overlays: ~2ms
- 100 overlays: ~5ms
- 200 overlays: ~10ms

**Acceptable** for typical MSDs (10-50 overlays).

### Tips

- ✅ Use specific selectors when possible
- ✅ Combine related changes in one rule
- ✅ Use tags for semantic groups (not everything)
- ⚠️ Avoid excessive pattern matching

---

## Overlay Selector Syntax

The `apply.overlays` section uses **object keys** for overlay targeting:

### Direct Overlay IDs

```yaml
rules:
  - id: direct_rule
    apply:
      overlays:
        text1:                    # Overlay ID as object key
          style: {color: "red"}
        text2:                    # Another overlay ID
          style: {color: "blue"}
```

### Mix Direct IDs and Bulk Selectors

```yaml
rules:
  - id: mixed_rule
    apply:
      overlays:
        all:                      # Bulk selector - all overlays
          style: {opacity: 0.8}

        text1:                    # Direct overlay ID
          style: {color: "red"}
```

---

## Troubleshooting

### Selector not matching overlays?

**Check browser console:**
```javascript
// View all overlays with tags
window.lcards.debug.msd.resolvedModel.overlays

// View selector resolution
// (Look for "[RulesEngine] Selector resolution complete")
```

**Common issues:**
- ❌ Tag name mismatch (check spelling)
- ❌ Type name incorrect (use lowercase: `apexchart` not `ApexChart`)
- ❌ Pattern regex syntax error
- ❌ Overlay excluded unintentionally

### Performance issues?

**Enable debug mode:**
```yaml
# Check resolution time in console
# [RulesEngine] Selector resolution complete: { resolutionTime: "2.5ms" }
```

**If > 10ms with < 100 overlays:**
- Check for complex regex patterns
- Reduce number of selectors per rule
- Report issue to developers
---

## Migration Guide

### From Individual Targeting to Bulk Selectors

**Before (Repetitive Individual IDs):**
```yaml
rules:
  - id: my_rule
    apply:
      overlays:
        text1:                    # Each overlay needs explicit entry
          style: {color: "red"}
        text2:
          style: {color: "red"}
        chart1:
          style: {color: "red"}
```

**After (Step 1 - Add tags to overlays):**
```yaml
overlays:
  - id: text1
    tags: ["critical"]
  - id: text2
    tags: ["critical"]
  - id: chart1
    tags: ["critical"]
```

**After (Step 2 - Use tag selector in rule):**
```yaml
rules:
  - id: my_rule
    apply:
      overlays:
        tag:critical:
          style: {color: "red"}
```

---


## Summary

The Bulk Overlay Selector System provides:

✅ **Maintainable** - Update many overlays with one rule
✅ **Flexible** - Multiple selector types for any use case
✅ **Powerful** - Layered styling with exclusions
✅ **Professional** - Enables complex global state management
✅ **Compatible** - Works with existing configs

**Perfect for:** Alert systems, theme switches, department dashboards, responsive layouts, and any scenario requiring bulk overlay updates.


## See Also

- [Rules Engine](../../core/rules/)
- [Line Overlay](./line-overlay.md)
- [Control Overlay](./control-overlay.md)
