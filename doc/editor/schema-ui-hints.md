# Schema-Driven UI Hints (`x-ui-hints`)

**Complete specification for `x-ui-hints` - the declarative UI metadata system for LCARdS card schemas.**

---

## Using FormFieldHelper (Recommended)

LCARdS provides a **static helper class** that generates form fields directly from schemas with x-ui-hints. This is the recommended approach for rendering form fields in card editors.

### Basic Usage

```javascript
import { LCARdSFormFieldHelper as FormField } from '../components/shared/lcards-form-field.js';

_renderMyTab() {
    return html`
        <lcards-form-section header="Settings">
            ${FormField.renderField(this, 'style.track.segments.gap')}
            ${FormField.renderField(this, 'entity')}
        </lcards-form-section>
    `;
}
```

### With Overrides

```javascript
${FormField.renderField(this, 'entity', {
    label: 'Primary Entity',
    helper: 'Select the entity this card controls',
    required: true
})}

${FormField.renderField(this, 'custom_field', {
    selectorOverride: {
        number: {
            mode: 'slider',
            min: 0,
            max: 100
        }
    }
})}
```

### Benefits

- ✅ **Direct `ha-selector` rendering** (no wrapper element)
- ✅ **Native HA reactivity** (value updates propagate correctly)
- ✅ **Better performance** (no shadow DOM nesting)
- ✅ **Easier debugging** (selector visible in editor template)
- ✅ **Full `ha-selector-choose` support** (number box updates, placeholders work)

### Migration from `<lcards-form-field>`

**Before (Custom Element - Deprecated):**
```html
<lcards-form-field
    .editor=${this}
    path="style.border.radius"
    label="Border Radius"
    helper="Corner roundness">
</lcards-form-field>
```

**After (Helper Function - Recommended):**
```javascript
${FormField.renderField(this, 'style.border.radius', {
    label: 'Border Radius',
    helper: 'Corner roundness'
})}
```

The helper automatically:
- Reads schema from `this._getSchemaForPath(path)`
- Applies x-ui-hints (label, helper, selector config)
- Auto-generates selectors for oneOf (choose), numbers, strings, booleans
- Handles value changes via `this._setConfigValue(path, value)`

For detailed migration instructions, see [`doc/editor/migration-form-field.md`](./migration-form-field.md).

---

## Overview

`x-ui-hints` is a custom JSON Schema extension property that stores UI presentation metadata directly within schema definitions. This enables a **schema-driven UI** where the visual editor automatically generates appropriate controls without requiring manual editor configuration.

### Key Benefits

✅ **Single Source of Truth**: Schema defines both validation AND UI  
✅ **Consistent UX**: All fields of the same type render consistently  
✅ **Less Boilerplate**: Eliminates redundant editor configuration  
✅ **Full ha-selector Power**: Access to all Home Assistant selector features (slider ticks, modes, units, domains, etc.)  
✅ **Flexible Override**: Field-level overrides available when needed  

---

## Priority Order

When `lcards-form-field` renders a control, it follows this priority hierarchy:

```
1. Field-level selectorOverride (highest priority)
   ↓
2. Schema x-ui-hints.selector (default)
   ↓
3. Auto-generated from schema type/constraints (fallback)
```

**Example:**

```javascript
// Schema defines default behavior
{
  "font_size": {
    "type": "number",
    "minimum": 8,
    "maximum": 72,
    "x-ui-hints": {
      "selector": {
        "number": {
          "mode": "slider",
          "step": 1,
          "unit_of_measurement": "px"
        }
      }
    }
  }
}

// In editor: field override for special case
html`
  <lcards-form-field
    path="style.font_size"
    .selectorOverride=${{
      number: {
        mode: 'box',  // Override to box for advanced users
        step: 0.5     // Finer control
      }
    }}>
  </lcards-form-field>
`
```

---

## `x-ui-hints` Properties

### Core Properties

#### `label` (string)
Override the displayed label for this field.

```json
{
  "width": {
    "type": "number",
    "x-ui-hints": {
      "label": "Width (Grid Columns)"
    }
  }
}
```

**Fallback**: Uses `schema.title` → formatted path name

---

#### `helper` (string)
Help text displayed below the control.

```json
{
  "rotation": {
    "type": "number",
    "x-ui-hints": {
      "helper": "Rotate text in degrees (negative = counter-clockwise)"
    }
  }
}
```

**Fallback**: Uses `schema.description` → empty string

---

#### `selector` (object)
Full Home Assistant selector configuration. The object key must match the selector type (`number`, `entity`, `select`, `icon`, etc.).

```json
{
  "height": {
    "type": "number",
    "minimum": 1,
    "maximum": 100,
    "x-ui-hints": {
      "selector": {
        "number": {
          "mode": "slider",
          "step": 1,
          "unit_of_measurement": "rows"
        }
      }
    }
  }
}
```

**Important**: Schema constraints (min/max/step) are automatically merged with selector config.

---

#### `defaultOneOfBranch` (number)
For `oneOf` schemas, specify the default branch index (0-based) to display.

```json
{
  "padding": {
    "oneOf": [
      {
        "type": "number",
        "title": "Uniform Padding",
        "minimum": 0,
        "maximum": 200
      },
      {
        "type": "object",
        "title": "Per-Side Padding",
        "properties": {
          "top": { "type": "number" },
          "right": { "type": "number" },
          "bottom": { "type": "number" },
          "left": { "type": "number" }
        }
      }
    ],
    "x-ui-hints": {
      "defaultOneOfBranch": 0,  // Show number input by default
      "selector": {
        "number": {
          "mode": "slider",
          "step": 1,
          "unit_of_measurement": "px"
        }
      }
    }
  }
}
```

**Without `defaultOneOfBranch`**: User sees a type selector dropdown first  
**With `defaultOneOfBranch`**: User sees the preferred input immediately (type selector still accessible)

---

#### `icon` (string)
MDI icon for section headers (future use - not yet implemented in form fields).

```json
{
  "style": {
    "type": "object",
    "x-ui-hints": {
      "icon": "mdi:palette"
    }
  }
}
```

---

## Selector Type Reference

### `number` Selector

Full control over numeric input rendering.

```json
{
  "brightness": {
    "type": "number",
    "minimum": 0,
    "maximum": 255,
    "x-ui-hints": {
      "selector": {
        "number": {
          "mode": "slider",           // 'box' | 'slider'
          "step": 1,                   // Increment/decrement step
          "unit_of_measurement": "%",  // Display unit suffix
          "slider_ticks": true         // Show tick marks on slider (HA 2023.4+)
        }
      }
    }
  }
}
```

**Schema Integration**: `minimum` and `maximum` from schema are automatically used as `min` and `max` for the selector.

---

### `entity` Selector

Entity picker with domain/device class filtering.

```json
{
  "entity": {
    "type": "string",
    "format": "entity",
    "x-ui-hints": {
      "selector": {
        "entity": {
          "domain": ["light", "switch"],        // Limit to specific domains
          "device_class": "temperature",        // Filter by device class
          "multiple": false                     // Single or multi-select
        }
      }
    }
  }
}
```

**Common Options**:
- `domain`: `string[]` - Filter by entity domains
- `device_class`: `string` - Filter by device class
- `integration`: `string` - Filter by integration
- `multiple`: `boolean` - Allow multiple selection

---

### `select` Selector

Dropdown/list selection from enum values.

```json
{
  "preset": {
    "type": "string",
    "enum": ["lozenge", "bullet", "outline", "pill"],
    "x-ui-hints": {
      "selector": {
        "select": {
          "mode": "dropdown",         // 'dropdown' | 'list'
          "multiple": false,          // Allow multiple selection
          "custom_value": false,      // Allow user-entered values
          "sort": false               // Sort options alphabetically
        }
      }
    }
  }
}
```

**Note**: `options` array is auto-generated from schema `enum` values.

---

### `icon` Selector

Icon picker with MDI icon search.

```json
{
  "icon": {
    "type": "string",
    "format": "icon",
    "x-ui-hints": {
      "selector": {
        "icon": {
          "placeholder": "Search icons..."
        }
      }
    }
  }
}
```

---

### `ui_color` Selector

Home Assistant's native color picker.

```json
{
  "color": {
    "type": "string",
    "format": "color",
    "x-ui-hints": {
      "selector": {
        "ui_color": {
          "default_color": "#FF9900"
        }
      }
    }
  }
}
```

**Note**: For LCARdS-specific color features (theme tokens, state colors), use `format: 'color'` without hints - this triggers the custom `lcards-color-picker`.

---

### `boolean` Selector

Toggle switch.

```json
{
  "enabled": {
    "type": "boolean",
    "x-ui-hints": {
      "selector": {
        "boolean": {}
      }
    }
  }
}
```

---

## oneOf Handling

The `oneOf` keyword allows a property to accept multiple types (e.g., `number` OR `string`).

### Without Hints (Default Behavior)

```json
{
  "font_size": {
    "oneOf": [
      { "type": "number", "minimum": 1, "maximum": 200 },
      { "type": "string", "pattern": "^\\d+px$" }
    ]
  }
}
```

**User Experience**: 
1. Sees a dropdown: "Option 1 (number)" vs "Option 2 (string)"
2. Selects type
3. Sees the appropriate input

### With `defaultOneOfBranch` (Improved UX)

```json
{
  "font_size": {
    "oneOf": [
      { 
        "type": "number",
        "title": "Pixels",
        "minimum": 1,
        "maximum": 200
      },
      { 
        "type": "string",
        "title": "CSS Value",
        "pattern": "^\\d+px$"
      }
    ],
    "x-ui-hints": {
      "defaultOneOfBranch": 0,  // Show number input by default
      "selector": {
        "number": {
          "mode": "slider",
          "step": 1,
          "unit_of_measurement": "px"
        }
      }
    }
  }
}
```

**User Experience**:
1. Immediately sees number slider (branch 0)
2. Can still switch to string input if needed via type selector

### Forcing a Branch (Editor Field Level)

```javascript
// Force string branch for advanced users
html`
  <lcards-form-field
    path="style.font_size"
    .oneOfBranch=${1}>  <!-- Force branch 1 (string) -->
  </lcards-form-field>
`
```

**User Experience**: Only sees string input, no type selector.

---

## Using ha-selector-choose for oneOf

For fields with multiple type options (number vs string, simple vs object), you can use Home Assistant's native `ha-selector-choose` for better UX.

### Correct Structure (choices object)

The `ha-selector-choose` requires a `choices` **object** with named keys, not an array:

```javascript
{
  "gap": {
    "oneOf": [
      { 
        "type": "number",
        "minimum": 0,
        "maximum": 50
      },
      { 
        "type": "string",
        "pattern": "^(\\d+px|theme:|\\{theme:)"
      }
    ],
    "x-ui-hints": {
      "label": "Segment Gap",
      "helper": "Space between segments (pixels or theme token)",
      "selector": {
        "choose": {
          "choices": {  // ← Object with named keys (REQUIRED)
            "pixels": {
              "selector": {
                "number": {
                  "mode": "slider",
                  "min": 0,
                  "max": 50,
                  "step": 1,
                  "unit_of_measurement": "px"
                }
              }
            },
            "theme": {
              "selector": {
                "text": {
                  "placeholder": "{theme:spacing.sm}"
                }
              }
            }
          }
        }
      }
    }
  }
}
```

### How It Works

The `ha-selector-choose` component automatically detects which choice to display based on the value type:

- **If value is a number** → Shows the `pixels` selector (number input/slider)
- **If value is a string** → Shows the `theme` selector (text input)
- **If value is an object** → Shows the object selector
- **User can switch** between choices using a segmented button control

### Complex Example: Per-Corner Radius

```javascript
{
  "radius": {
    "oneOf": [
      { "type": "number" },
      { "type": "string" },
      { 
        "type": "object",
        "properties": {
          "top_left": { "type": "number" },
          "top_right": { "type": "number" },
          "bottom_right": { "type": "number" },
          "bottom_left": { "type": "number" }
        }
      }
    ],
    "x-ui-hints": {
      "selector": {
        "choose": {
          "choices": {
            "pixels": {
              "selector": {
                "number": {
                  "mode": "slider",
                  "min": 0,
                  "max": 100,
                  "step": 1,
                  "unit_of_measurement": "px"
                }
              }
            },
            "theme": {
              "selector": {
                "text": {
                  "placeholder": "{theme:borders.radius.md}"
                }
              }
            },
            "per_corner": {
              "selector": {
                "object": {
                  "properties": {
                    "top_left": { 
                      "title": "Top Left",
                      "number": { "min": 0, "max": 100 }
                    },
                    "top_right": { 
                      "title": "Top Right",
                      "number": { "min": 0, "max": 100 }
                    },
                    "bottom_right": { 
                      "title": "Bottom Right",
                      "number": { "min": 0, "max": 100 }
                    },
                    "bottom_left": { 
                      "title": "Bottom Left",
                      "number": { "min": 0, "max": 100 }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

### Auto-Generation Behavior

When `lcards-form-field` encounters a `oneOf` schema **without** explicit `x-ui-hints.selector.choose`, it automatically generates a `choose` selector:

1. **Analyzes each oneOf branch** to determine the type (Number, Text, Object, etc.)
2. **Generates choice keys** from the type labels (lowercase with underscores)
3. **Creates appropriate selectors** for each branch type
4. **Returns a `choices` object** (not an array)

**Example auto-generated keys:**
- `"Number"` → `"number"`
- `"Theme Token"` → `"theme_token"`
- `"Per Corner"` → `"per_corner"`
- `"Theme Binding"` → `"theme_binding"`

### User Experience

```
Segment Gap: [ Pixels | Theme Token ]  ← Segmented button control
[====●======] 4px  ← Active selector (slider in this case)
```

When the user:
1. **Switches between choices** using the segmented button
2. **The appropriate input appears** (slider, text, object editor, etc.)
3. **Value is preserved** when switching between compatible types
4. **Value is cleared** when switching to an incompatible type

### Important Notes

⚠️ **Common Mistake**: Using `"options": [...]` (array) instead of `"choices": {}` (object)

```javascript
// ❌ WRONG - Will render with 0 height
"choose": {
  "options": [
    { "value": "pixels", "label": "Pixels", "selector": {...} }
  ]
}

// ✅ CORRECT - Will render properly
"choose": {
  "choices": {
    "pixels": { "selector": {...} }
  }
}
```

⚠️ **Key Names Matter**: Choice keys must be valid JavaScript identifiers (lowercase letters, numbers, underscores)

⚠️ **No Manual Detection Needed**: Home Assistant's choose selector handles value type detection automatically

---

## Complete Example: Button Schema

```javascript
export function getButtonSchema(options = {}) {
    const paddingSchema = {
        oneOf: [
            {
                type: 'number',
                title: 'Uniform Padding',
                minimum: 0,
                maximum: 200,
                description: 'Same padding on all sides (in pixels)'
            },
            {
                type: 'object',
                title: 'Per-Side Padding',
                description: 'Different padding for each side',
                properties: {
                    top: { type: 'number', minimum: 0, maximum: 200 },
                    right: { type: 'number', minimum: 0, maximum: 200 },
                    bottom: { type: 'number', minimum: 0, maximum: 200 },
                    left: { type: 'number', minimum: 0, maximum: 200 }
                }
            }
        ],
        'x-ui-hints': {
            label: 'Padding',
            helper: 'Use number for uniform padding, or object for per-side control',
            defaultOneOfBranch: 0,
            selector: {
                number: {
                    mode: 'slider',
                    step: 1,
                    unit_of_measurement: 'px'
                }
            }
        }
    };

    return {
        type: 'object',
        properties: {
            entity: {
                type: 'string',
                format: 'entity',
                'x-ui-hints': {
                    label: 'Entity',
                    helper: 'Select the Home Assistant entity this button controls',
                    selector: {
                        entity: {
                            domain: ['light', 'switch', 'button']
                        }
                    }
                }
            },
            width: {
                type: 'number',
                minimum: 1,
                maximum: 24,
                default: 4,
                'x-ui-hints': {
                    label: 'Width (Grid Columns)',
                    helper: 'Card width in HA grid columns (1-24)',
                    selector: {
                        number: {
                            mode: 'slider',
                            step: 1,
                            unit_of_measurement: 'cols'
                        }
                    }
                }
            },
            text: {
                type: 'object',
                additionalProperties: {
                    properties: {
                        padding: paddingSchema,
                        font_size: {
                            oneOf: [
                                { type: 'number', minimum: 1, maximum: 200 },
                                { type: 'string', pattern: '^\\d+px$' }
                            ],
                            'x-ui-hints': {
                                label: 'Font Size',
                                helper: 'Size in pixels (recommended) or CSS units',
                                defaultOneOfBranch: 0,
                                selector: {
                                    number: {
                                        mode: 'slider',
                                        step: 1,
                                        unit_of_measurement: 'px'
                                    }
                                }
                            }
                        },
                        rotation: {
                            type: 'number',
                            minimum: -360,
                            maximum: 360,
                            'x-ui-hints': {
                                label: 'Rotation',
                                helper: 'Rotate text in degrees (negative = counter-clockwise)',
                                selector: {
                                    number: {
                                        mode: 'slider',
                                        step: 1,
                                        unit_of_measurement: '°'
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    };
}
```

---

## Migration from Legacy ha-formbuilder

### Old Way (YAML + ha-formbuilder)

```yaml
# Old ha-formbuilder config
- label: "Bar Width"
  configValue: "style.bar_width"
  selector:
    number:
      min: 10
      max: 500
      mode: slider
      slider_ticks: true
      unit_of_measurement: "px"
```

### New Way (Schema x-ui-hints)

```javascript
{
  "style": {
    "properties": {
      "bar_width": {
        "type": "number",
        "minimum": 10,
        "maximum": 500,
        "x-ui-hints": {
          "label": "Bar Width",
          "selector": {
            "number": {
              "mode": "slider",
              "slider_ticks": true,
              "unit_of_measurement": "px"
            }
          }
        }
      }
    }
  }
}
```

### In Editor (Auto-Pickup)

```javascript
// That's it! No manual field config needed
html`<lcards-form-field .editor=${this} path="style.bar_width"></lcards-form-field>`
```

---

## Best Practices

### ✅ DO

- **Add hints to frequently-edited fields** (entity, dimensions, colors, font sizes)
- **Use `defaultOneOfBranch`** to show the most common option first
- **Provide helpful `helper` text** explaining what the field does
- **Use sliders for bounded numeric ranges** (0-100, 0-360, etc.)
- **Use `unit_of_measurement`** to clarify units (px, %, °, cols, rows)
- **Respect schema constraints** - hints complement, don't replace validation

### ❌ DON'T

- **Don't add hints to every single field** - focus on high-impact fields
- **Don't override min/max in selector** - let schema constraints flow through
- **Don't create inconsistent UX** - similar fields should have similar controls
- **Don't use hints for complex custom UI** - use custom editor components instead

---

## Field-Level Overrides

When schema hints aren't sufficient, use field-level `selectorOverride`:

```javascript
// Schema says slider, but we want box for this specific field
html`
  <lcards-form-field
    path="advanced.custom_step"
    .selectorOverride=${{
      number: {
        mode: 'box',
        step: 0.001  // Very fine control
      }
    }}>
  </lcards-form-field>
`
```

**When to use**:
- Edge cases that differ from standard usage
- Advanced/power-user options
- Temporary overrides during development

---

## CSS Density Control

Spacing can be customized via CSS variables:

```css
:root {
  --lcards-section-spacing: 16px;  /* Default section/field margin */
  --lcards-icon-spacing: 12px;     /* Icon/header padding */
}

/* Compact mode */
.compact-editor {
  --lcards-section-spacing: 8px;
  --lcards-icon-spacing: 6px;
}
```

---

## Future Enhancements

### Planned Features

- **Icon support in section headers** - Display icons next to section titles
- **Conditional visibility** - Show/hide fields based on other field values
- **Field grouping** - Visual grouping of related fields
- **Custom validators** - Client-side validation with helpful error messages
- **Async options** - Dynamically load select options from external sources

---

## API Reference

### `lcards-form-field` Properties

```typescript
interface LCARdSFormField {
  path: string;                    // Config path (dot notation)
  editor: Object;                  // Parent editor reference
  label?: string;                  // Label override
  helper?: string;                 // Helper text override
  required?: boolean;              // Required field
  disabled?: boolean;              // Disabled state
  selectorOverride?: Object;       // Override selector config
  oneOfBranch?: number;            // Force specific oneOf branch (0-indexed)
}
```

### Schema `x-ui-hints` Structure

```typescript
interface XUiHints {
  label?: string;                  // Display label override
  helper?: string;                 // Help text
  icon?: string;                   // MDI icon name
  defaultOneOfBranch?: number;     // Default oneOf branch (0-indexed)
  selector?: {
    [type: string]: Object;        // HA selector config by type
  };
}
```

---

## See Also

- **[Home Assistant Selector Documentation](https://www.home-assistant.io/docs/blueprint/selectors/)** - Official HA selector reference
- **[src/editor/README.md](../../../src/editor/README.md)** - LCARdS editor architecture guide
- **[src/editor/components/shared/lcards-form-field.js](../../../src/editor/components/shared/lcards-form-field.js)** - Form field implementation
- **[JSON Schema Draft 7](https://json-schema.org/draft-07/json-schema-release-notes.html)** - JSON Schema specification

---

*Last Updated: December 2025 | LCARdS Schema-Driven UI System*
