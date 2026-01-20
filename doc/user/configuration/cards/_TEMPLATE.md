<!--
CARD DOCUMENTATION TEMPLATE

This template provides a consistent structure for all LCARdS card documentation.

INSTRUCTIONS FOR USE:
1. Copy this template to a new file: [card-name].md
2. Replace all [PLACEHOLDERS] with actual content
3. Remove sections that don't apply (mark with N/A if you want to keep structure)
4. Follow the existing pattern from button.md, slider.md, chart.md, etc.
5. Include working examples that users can copy-paste
6. Use schema format consistent with other card docs
7. Add screenshots/images where helpful (use placeholder comments)
8. Keep "Quick Start" section minimal - show simplest working config
9. Save detailed explanations for "Configuration Details" section
10. Update "Last Updated" date and version when making changes

STYLE GUIDELINES:
- Use ✅ emoji for feature lists
- Use consistent YAML formatting (2-space indent)
- Include comments in YAML examples
- Use tables for property references
- Link to related docs
- Use code blocks with yaml syntax highlighting
- Keep examples practical and copy-pasteable

STYLE CONSISTENCY:
- Heading Level 1 (#): Card title only
- Heading Level 2 (##): Major sections (Overview, Quick Start, Schema, etc.)
- Heading Level 3 (###): Subsections and specific topics
- Heading Level 4 (####): Rarely needed, only for deep nesting

See existing card docs for reference:
- doc/user/configuration/cards/button.md
- doc/user/configuration/cards/slider.md
- doc/user/configuration/cards/chart.md
- doc/user/configuration/cards/elbow.md
- doc/user/configuration/cards/data-grid.md
-->

# LCARdS [CARD NAME] Card - User Guide

**Component:** `custom:lcards-[card-name]`  
**Extends:** `custom:lcards-[parent]` *(if applicable)*  
**Purpose:** [One-line description of card's primary function]

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Complete Schema](#complete-schema)
4. [Configuration Details](#configuration-details)
5. [Common Use Cases](#common-use-cases)
6. [Styling Guide](#styling-guide)
7. [Theme Integration](#theme-integration)
8. [Advanced Features](#advanced-features)
9. [Complete Examples](#complete-examples)
10. [Troubleshooting](#troubleshooting)

---

## Overview

[2-3 paragraph description of the card. Explain what it does, what problems it solves, and how it fits into the LCARdS ecosystem.]

[Paragraph 1: High-level purpose and main functionality]

[Paragraph 2: Key technical details or unique aspects]

[Paragraph 3: How it integrates with other LCARdS features]

### Key Features

✅ **[Feature 1]** - [Brief description of feature and why it matters]

✅ **[Feature 2]** - [Brief description of feature and why it matters]

✅ **[Feature 3]** - [Brief description of feature and why it matters]

✅ **[Feature 4]** - [Brief description of feature and why it matters]

✅ **[Feature 5]** - [Brief description of feature and why it matters]

✅ **[Feature 6]** - [Brief description of feature and why it matters]

[Include 4-8 total features]

### When to Use This Card

- **[Use case 1]** - [Description of when/why to use for this scenario]
- **[Use case 2]** - [Description of when/why to use for this scenario]
- **[Use case 3]** - [Description of when/why to use for this scenario]
- **[Use case 4]** - [Description of when/why to use for this scenario]

<!--
IMAGE PLACEHOLDER: [Card Name] Overview
Suggested filename: docs/assets/[card-name]-overview.png or .gif
What to show: [Description of what screenshot(s) should show - include specific states, 
configurations, or interactions that demonstrate the card's capabilities]
-->

---

## Quick Start

### Minimal Configuration

The absolute minimum needed to create a functional card:

```yaml
type: custom:lcards-[card-name]
[minimal required properties]
# Example: entity, component, etc.
```

**Result:** [Brief description of what this minimal configuration produces]

### With Basic Styling

Add common customizations users typically want:

```yaml
type: custom:lcards-[card-name]
[minimal config properties]

# Basic styling additions
style:
  [common style property 1]: [value]
  [common style property 2]: [value]

# Common optional features
[optional feature 1]: [value]
[optional feature 2]: [value]
```

**Result:** [Description of enhanced appearance/functionality]

---

## Complete Schema

```yaml
type: custom:lcards-[card-name]

# ================================
# REQUIRED PROPERTIES
# ================================
[required_property_1]: <type>     # Description of property
[required_property_2]: <type>     # Description of property

# ================================
# CORE CONFIGURATION
# ================================
[core_config_section]:
  [property_1]: <type>            # Description (default: value)
  [property_2]: <type>            # Description (default: value)
  [property_3]:                   # Nested object description
    [nested_prop_1]: <type>       # Description
    [nested_prop_2]: <type>       # Description

# ================================
# STYLING
# ================================
style:
  # [Style Category 1]
  [style_section_1]:
    [style_prop_1]: <type>        # Description (default: value)
    [style_prop_2]: <type>        # Description (default: value)

  # [Style Category 2]
  [style_section_2]:
    [style_prop_1]: <type>        # Description (default: value)
    [style_prop_2]: <type>        # Description (default: value)

# ================================
# DATA SOURCES (Optional)
# ================================
data_sources:
  [source_name]:
    entity_id: <entity_id>        # Entity to track
    update_interval: <number>     # Update frequency in seconds
    history_size: <number>        # Number of historical values to keep
    transformations:              # Optional data transformations
      - type: [transformation]    # moving_average, throttle, etc.
        [params]: [values]

# ================================
# RULES (Optional)
# ================================
rules:
  - id: [rule_id]                 # Unique rule identifier
    conditions:                   # Conditions to match
      - [condition_config]
    patches:                      # Style changes to apply
      style:
        [property]: [value]

# ================================
# ANIMATIONS (Optional)
# ================================
animations:
  - preset: [preset_name]         # Animation preset
    trigger: [trigger]            # on_load, on_tap, on_entity_change, etc.
    duration: <number>            # Duration in ms
    loop: <bool/number>           # true, false, or iteration count
    [preset_params]: [values]     # Preset-specific parameters

# ================================
# ACTIONS (Optional)
# ================================
tap_action:
  action: [action_type]           # toggle, call-service, navigate, more-info, etc.
  [action_params]: [values]       # Action-specific parameters

hold_action:
  action: [action_type]
  [action_params]: [values]

double_tap_action:
  action: [action_type]
  [action_params]: [values]

# ================================
# LAYOUT (Optional)
# ================================
grid_options:
  rows: <number>                  # Grid rows for HA layout
  columns: <number>               # Grid columns for HA layout
```

---

## Configuration Details

### [Configuration Section 1]

[Detailed explanation of this configuration section. Explain what it controls, how it works, 
and any important concepts users need to understand.]

**Available Options:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `[property_1]` | `[type]` | `[default]` | [Detailed description] |
| `[property_2]` | `[type]` | `[default]` | [Detailed description] |
| `[property_3]` | `[type]` | `[default]` | [Detailed description] |

**Example:**

```yaml
type: custom:lcards-[card-name]
[section_name]:
  [property_1]: [example_value]
  [property_2]: [example_value]
  [property_3]: [example_value]
```

---

### [Configuration Section 2]

[Detailed explanation of second configuration section]

**Available Options:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `[property_1]` | `[type]` | `[default]` | [Detailed description] |
| `[property_2]` | `[type]` | `[default]` | [Detailed description] |

**Example:**

```yaml
type: custom:lcards-[card-name]
[section_name]:
  [property_1]: [example_value]
  [property_2]: [example_value]
```

[Repeat for each major configuration section]

---

## Common Use Cases

### Use Case 1: [Descriptive Name]

[Brief description of this use case and what it accomplishes]

```yaml
type: custom:lcards-[card-name]
# [Use case specific configuration]
[property_1]: [value]
[property_2]: [value]

style:
  [style_property]: [value]
```

**What this does:** [Explanation of the result]

**When to use:** [Scenarios where this configuration is appropriate]

---

### Use Case 2: [Descriptive Name]

[Brief description of this use case and what it accomplishes]

```yaml
type: custom:lcards-[card-name]
# [Use case specific configuration]
[property_1]: [value]
[property_2]: [value]

[section_name]:
  [property]: [value]
```

**What this does:** [Explanation of the result]

**When to use:** [Scenarios where this configuration is appropriate]

---

### Use Case 3: [Descriptive Name]

[Brief description of this use case and what it accomplishes]

```yaml
type: custom:lcards-[card-name]
# [Use case specific configuration]
[property_1]: [value]
[property_2]: [value]
```

**What this does:** [Explanation of the result]

**When to use:** [Scenarios where this configuration is appropriate]

[Repeat for 3-5 common use cases]

---

## Styling Guide

### [Style Category 1]

[Explanation of this styling category and what visual aspects it controls]

**Key Properties:**

- **`[property_1]`** - [Description of what this property controls]
- **`[property_2]`** - [Description of what this property controls]
- **`[property_3]`** - [Description of what this property controls]

**Example:**

```yaml
style:
  [category]:
    [property_1]: [value]
    [property_2]: [value]
    [property_3]: [value]
```

---

### [Style Category 2]

[Explanation of this styling category]

**Key Properties:**

- **`[property_1]`** - [Description]
- **`[property_2]`** - [Description]

**Example:**

```yaml
style:
  [category]:
    [property_1]: [value]
    [property_2]: [value]
```

[Repeat for major style categories]

---

### Color Options

[Explain how colors work in this card - state-based colors, theme tokens, etc.]

**Formats Supported:**

```yaml
# Direct color value
color: "#FF9900"

# Theme token
color: "{theme:palette.moonlight}"

# State-based colors
color:
  active: "#FF9900"
  inactive: "#CC7700"
  unavailable: "#666666"
```

---

## Theme Integration

### Using Theme Tokens

[Explain how this card integrates with LCARdS themes]

```yaml
style:
  [property]: "{theme:palette.[color-name]}"
  [property]: "{theme:spacing.[size-name]}"
  [property]: "{theme:typography.[type-name]}"
```

**Available Token Categories:**

- **`palette`** - Color values from current theme
- **`spacing`** - Spacing values (margins, padding, gaps)
- **`typography`** - Font sizes, weights, families

**Example with Theme Tokens:**

```yaml
type: custom:lcards-[card-name]
style:
  background: "{theme:palette.moonlight}"
  border: "{theme:palette.alert-red}"
  padding: "{theme:spacing.medium}"
```

**[See theme documentation →](../../advanced/theme_creation_tutorial.md)**

---

## Advanced Features

### [Advanced Feature 1]

[Detailed explanation of an advanced feature. Include technical details, edge cases, 
and when/why to use this feature.]

**Configuration:**

```yaml
type: custom:lcards-[card-name]
[advanced_feature_config]:
  [property_1]: [value]
  [property_2]: [value]
```

**How it works:** [Technical explanation]

**Example scenario:** [Real-world use case]

---

### [Advanced Feature 2]

[Detailed explanation of second advanced feature]

**Configuration:**

```yaml
type: custom:lcards-[card-name]
[advanced_feature_config]:
  [property_1]: [value]
  [property_2]: [value]
```

**How it works:** [Technical explanation]

**Example scenario:** [Real-world use case]

---

### Template Support

This card supports [number] template types for dynamic content:

#### 1. JavaScript Templates

```yaml
[property]: "[[[return entity.state.toUpperCase()]]]"
```

#### 2. Token Templates

```yaml
[property]: "{entity.state} - {entity.attributes.friendly_name}"
```

#### 3. DataSource Templates

```yaml
[property]: "{datasource:sensor_temp:.1f}°C"
```

#### 4. Jinja2 Templates

```yaml
[property]: "{{states('sensor.temperature')}}"
```

**[See template documentation →](../../../architecture/subsystems/rules-template-syntax.md)**

---

### Rules Engine Integration

[Explain how this card works with the rules engine]

**Example rule:**

```yaml
rules:
  - id: high_temperature_alert
    conditions:
      - entity: sensor.temperature
        operator: ">"
        value: 30
    patches:
      style:
        background: "{theme:palette.alert-red}"
```

**[See rules documentation →](../rules.md)**

---

## Complete Examples

### Example 1: [Descriptive Name]

[Brief description of what this complete example demonstrates]

```yaml
type: custom:lcards-[card-name]
# [Complete, working configuration]
entity: [entity_id]

[section_1]:
  [property]: [value]

[section_2]:
  [property]: [value]

style:
  [style_property]: [value]

animations:
  - preset: [preset]
    trigger: [trigger]

tap_action:
  action: [action]
```

**Result:** [Description of what this produces and why it's useful]

**Use this when:** [Scenarios where this configuration is helpful]

<!--
IMAGE PLACEHOLDER: [Example Name]
Suggested filename: docs/assets/[card-name]-example-1.png
What to show: [Description of screenshot showing this example in action]
-->

---

### Example 2: [Descriptive Name]

[Brief description of what this complete example demonstrates]

```yaml
type: custom:lcards-[card-name]
# [Complete, working configuration for different scenario]
entity: [entity_id]

[section_1]:
  [property]: [value]

data_sources:
  [source_name]:
    entity_id: [entity]
    update_interval: 5

rules:
  - id: [rule_id]
    conditions:
      - [condition]
    patches:
      style:
        [property]: [value]

style:
  [style_property]: [value]
```

**Result:** [Description of what this produces]

**Use this when:** [Scenarios where this configuration is helpful]

---

### Example 3: [Descriptive Name]

[Brief description of advanced example]

```yaml
type: custom:lcards-[card-name]
# [Complete, working configuration showing advanced features]
[configuration]
```

**Result:** [Description of advanced functionality]

[Include 2-4 complete examples showing different capabilities]

---

## Troubleshooting

### Common Issue 1: [Issue Title]

**Problem:** [Description of the problem users encounter]

**Symptoms:**
- [Symptom 1]
- [Symptom 2]

**Solution:** [Step-by-step fix]

```yaml
# Example of correct configuration
[corrected_config]
```

---

### Common Issue 2: [Issue Title]

**Problem:** [Description of the problem]

**Symptoms:**
- [Symptom 1]
- [Symptom 2]

**Solution:** [Step-by-step fix]

---

### Common Issue 3: [Issue Title]

**Problem:** [Description of the problem]

**Solution:** [Step-by-step fix]

---

### Common Issue 4: [Issue Title]

**Problem:** [Description of the problem]

**Solution:** [Step-by-step fix]

---

### Debugging Tips

**Check Browser Console:**
```javascript
// Enable debug logging
window.lcards.setGlobalLogLevel('debug')

// Check card registration
console.log(window.customCards)

// Inspect theme tokens
window.lcards.core.themeManager.getCurrentTheme()
```

**Validate Configuration:**
- Use the built-in validation service in the Studio editor
- Check for required properties
- Verify entity IDs exist in Home Assistant
- Test templates in the template sandbox

**[See troubleshooting guide →](../../advanced/validation_guide.md)**

---

## Related Documentation

### Related Cards
- [LCARdS Button Card](./button.md) - [Brief description of relationship]
- [LCARdS [Related Card]](./[related-card].md) - [Brief description]

### Related Features
- [Rules Engine](../rules.md) - Conditional styling across cards
- [Data Sources](../datasources.md) - Entity subscriptions and transformations
- [Template System](../../../architecture/subsystems/rules-template-syntax.md) - Dynamic content evaluation

### Architecture Documentation
- [LCARdS Card Foundation](../../../architecture/cards/lcards-card-foundation.md)
- [Subsystems Overview](../../../architecture/subsystems/README.md)

---

**Last Updated:** [YYYY-MM-DD]  
**Applies to Version:** [version number]  
**Component:** `custom:lcards-[card-name]`

---

<div align="center">

[Report Issue](https://github.com/snootched/LCARdS/issues) • [Request Feature](https://github.com/snootched/LCARdS/issues) • [Discussions](https://github.com/snootched/LCARdS/discussions)

</div>
