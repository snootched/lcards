# Migration Guide: lcards-form-field Custom Element → FormFieldHelper

## Overview

The `<lcards-form-field>` custom element has been **refactored to a helper function** for better performance, reactivity, and compatibility with `ha-selector-choose`.

## Why?

### Problems with Custom Element
- ❌ Double shadow DOM nesting broke value propagation
- ❌ Number box didn't update as slider moved (choose selector)
- ❌ Placeholder text didn't render in nested inputs
- ❌ Hard to debug (buried in shadow DOM)
- ❌ Value transformation logic caused update cycle issues

### Benefits of Helper Function
- ✅ Direct `ha-selector` rendering (no wrapper)
- ✅ Native HA reactivity works perfectly
- ✅ Choose selector updates correctly (number box, placeholders)
- ✅ Easier to debug (visible in editor template)
- ✅ Better performance (no custom element lifecycle overhead)

## Migration Steps

### 1. Import the Helper

**At top of editor file:**
```javascript
import { LCARdSFormFieldHelper as FormField } from '../components/shared/lcards-form-field.js';
```

### 2. Replace Custom Element Tags

**Before:**
```html
<lcards-form-field 
    .editor=${this} 
    path="style.track.segments.gap" 
    label="Gap Size"
    helper="Space between segments">
</lcards-form-field>
```

**After:**
```javascript
${FormField.renderField(this, 'style.track.segments.gap', {
    label: 'Gap Size',
    helper: 'Space between segments'
})}
```

### 3. Simplify (Use Schema Defaults)

If the label/helper are already in x-ui-hints, you can omit them:

```javascript
// Schema has x-ui-hints.label and x-ui-hints.helper
${FormField.renderField(this, 'style.track.segments.gap')}
```

### 4. Handle Selector Overrides

**Before:**
```html
<lcards-form-field 
    .editor=${this} 
    path="entity" 
    .selectorOverride=${{ entity: { domain: 'light' } }}>
</lcards-form-field>
```

**After:**
```javascript
${FormField.renderField(this, 'entity', {
    selectorOverride: { entity: { domain: 'light' } }
})}
```

## Choose Selector Value Transformation (v1.12.01+)

As of v1.12.01, FormFieldHelper includes **bidirectional value transformation** for `ha-selector-choose`:

### How It Works

1. **On Render** (`_prepareValueForSelector`): Transforms clean config value → choose structure
   ```javascript
   // Config has clean value:
   gap: 23
   
   // FormFieldHelper transforms to choose structure for ha-selector:
   {
     active_choice: "pixels",
     pixels: 23,
     theme_token: ""
   }
   ```

2. **On Change** (`_handleChange`): Extracts actual value from choose structure → clean config
   ```javascript
   // ha-selector emits choose structure:
   {
     active_choice: "pixels",
     pixels: 23,
     theme_token: ""
   }
   
   // FormFieldHelper extracts clean value for config:
   gap: 23
   ```

### Benefits

✅ **Config stays clean** - No `active_choice` or nested choice values in YAML  
✅ **Choose selector renders correctly** - Auto-detects which option to show based on value type  
✅ **Existing configs load properly** - Clean values automatically transform on render  
✅ **Type detection** - Automatically detects number, string (theme tokens), objects  

### Debug Logging

The transformation logs to console for debugging:

```javascript
[FormFieldHelper] Value prepared for choose selector: {
  rawValue: 23,
  activeChoice: "pixels",
  chooseValue: { active_choice: "pixels", pixels: 23, theme_token: "" }
}

[FormFieldHelper] Choose value extracted: {
  path: "style.track.segments.gap",
  rawValue: { active_choice: "pixels", pixels: 23, theme_token: "" },
  activeChoice: "pixels",
  extractedValue: 23
}
```

### Supported Value Types

| Value Type | Detection Logic | Example |
|------------|-----------------|---------|
| Number | `typeof value === 'number'` | `23` → finds choice with `number` selector |
| Theme Token | `value.startsWith('{theme:')` | `{theme:spacing.sm}` → finds `theme_token` choice |
| Theme Binding | `value === 'theme'` | `"theme"` → finds `theme_binding` choice |
| Object | `typeof value === 'object'` | `{ top: 10, right: 10 }` → finds `object` selector |

## API Reference

```javascript
FormFieldHelper.renderField(editor, path, options)
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `editor` | Object | ✅ | Card editor instance (must have `hass`, `_getSchemaForPath`, `_getConfigValue`, `_setConfigValue`) |
| `path` | String | ✅ | Config path (e.g., `'style.track.segments.gap'`) |
| `options` | Object | ❌ | Optional overrides |
| `options.label` | String | ❌ | Override label from x-ui-hints |
| `options.helper` | String | ❌ | Override helper text from x-ui-hints |
| `options.selectorOverride` | Object | ❌ | Override entire selector config |
| `options.disabled` | Boolean | ❌ | Disable the selector (default: `false`) |
| `options.required` | Boolean | ❌ | Mark as required (default: `false`) |

### Returns

`TemplateResult` — Direct `ha-selector` template (no wrapper element)

## Backward Compatibility

The custom element is still registered but **deprecated**. It delegates to the helper function internally.

**You'll see a console warning:**
```
[LCARdS] <lcards-form-field> custom element is deprecated.
Use FormFieldHelper.renderField() instead for better performance and reactivity.
```

**Timeline:**
- Current version: Both work, custom element warns
- Next major version: Custom element removed

## Examples

### Basic Field
```javascript
${FormField.renderField(this, 'entity')}
```

### With Label Override
```javascript
${FormField.renderField(this, 'entity', {
    label: 'Primary Entity',
    helper: 'The entity this card controls'
})}
```

### With Selector Override
```javascript
${FormField.renderField(this, 'custom_number', {
    selectorOverride: {
        number: {
            mode: 'slider',
            min: 0,
            max: 100,
            step: 5
        }
    }
})}
```

### Choose Selector (Auto-Generated from oneOf)
```javascript
// Schema has oneOf: [number, string]
// Helper automatically generates choose selector with "Number" and "Theme Token" options
${FormField.renderField(this, 'style.border.radius')}
```

### In Grid Layout
```javascript
<lcards-grid-layout columns="3">
    ${FormField.renderField(this, 'control.min', {
        label: 'Min',
        helper: 'Minimum value'
    })}

    ${FormField.renderField(this, 'control.max', {
        label: 'Max',
        helper: 'Maximum value'
    })}

    ${FormField.renderField(this, 'control.step', {
        label: 'Step',
        helper: 'Increment size'
    })}
</lcards-grid-layout>
```

## Testing Checklist

After migration, verify:
- [ ] All fields render correctly
- [ ] Value changes update config
- [ ] Choose selectors show segmented toggle
- [ ] Number box updates as slider moves (choose selector)
- [ ] Placeholder text shows in text inputs (choose selector)
- [ ] Schema x-ui-hints are applied (label, helper, constraints)
- [ ] Selector overrides work
- [ ] Required/disabled states work

## Common Patterns

### Entity Field
```javascript
${FormField.renderField(this, 'entity', {
    label: 'Entity',
    helper: 'Entity to control/display'
})}
```

### Number Field with Slider
Schema already has x-ui-hints, so minimal code:
```javascript
${FormField.renderField(this, 'style.track.segments.gap')}
```

### Boolean Switch
```javascript
${FormField.renderField(this, 'control.locked', {
    label: 'Display Only',
    helper: 'Disable interaction'
})}
```

### Multiple Fields in Grid
```javascript
<lcards-form-section header="Appearance">
    <lcards-grid-layout>
        ${FormField.renderField(this, 'style.opacity.unfilled')}
        ${FormField.renderField(this, 'style.opacity.filled')}
    </lcards-grid-layout>
</lcards-form-section>
```

## Performance Benefits

The helper function approach offers significant performance improvements:

1. **No Custom Element Lifecycle**: Eliminates creation/connection overhead
2. **No Shadow DOM Nesting**: Direct template rendering
3. **Better Change Detection**: HA's native reactivity works without wrapper
4. **Faster Updates**: No event transformation or propagation delays
5. **Smaller Bundle**: Less code to parse and execute

## Troubleshooting

### Field Not Rendering
- ✅ Check that `path` exists in schema
- ✅ Verify `editor._getSchemaForPath(path)` returns a schema
- ✅ Ensure editor has `hass`, `_getConfigValue`, `_setConfigValue` methods

### Value Not Updating
- ✅ Check that `editor._setConfigValue` is implemented correctly
- ✅ Verify path syntax matches schema structure (use dot notation)
- ✅ Ensure `editor.config` is reactive (triggers re-render)

### Choose Selector Not Working
- ✅ Verify schema has `oneOf` array
- ✅ Check that oneOf branches have valid types
- ✅ Use helper function (not deprecated custom element)

### Label/Helper Not Showing
- ✅ Check schema has `x-ui-hints.label` / `x-ui-hints.helper`
- ✅ Or pass explicit `label`/`helper` options
- ✅ Verify `getEffectiveLabel` utility is working

## Related Documentation

- [Schema UI Hints Reference](./schema-ui-hints.md)
- [LCARdSBaseEditor API](../architecture/subsystems/editor-base-class.md)
- [Home Assistant Selectors](https://www.home-assistant.io/docs/blueprint/selectors/)

## Questions?

If you encounter issues during migration, check:
1. Console for deprecation warnings
2. Browser dev tools for error messages
3. Schema definitions for x-ui-hints
4. Existing slider editor for reference implementation

---

*Last Updated: December 2025 | LCARdS v1.12.01*
