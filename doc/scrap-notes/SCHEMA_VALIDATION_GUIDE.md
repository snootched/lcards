# LCARdS Universal Button Presets - Schema Validation Guide

## 🎯 **Overview**
This guide covers the correct configuration keys for using button presets in LCARdS v3, ensuring schema validation passes and universal presets work correctly across overlay types.

## 📋 **Correct Configuration Schema**

### **ButtonOverlay Configuration**
```yaml
- type: button
  id: my_button
  style:
    lcars_button_preset: lozenge  # ✅ CORRECT: In style section
  config:
    label: "My Button"
    action: none
```

**❌ INCORRECT ButtonOverlay configurations:**
```yaml
- type: button
  preset: lozenge           # ❌ Wrong: preset at root level
  lcars_button_preset: lozenge  # ❌ Wrong: not in style section
```

### **StatusGridOverlay Configuration**

#### **Cell-Level Presets (Recommended)**
```yaml
- type: status_grid
  id: my_grid
  cells:
    - id: cell1
      component: button
      lcars_button_preset: lozenge  # ✅ CORRECT: At cell level
      config:
        label: "Cell Button"
```

#### **Overlay-Level Presets (Legacy Support)**
```yaml
- type: status_grid
  id: my_grid
  style:
    lcars_button_preset: status_grid.lozenge  # ✅ CORRECT: Legacy format
  cells:
    - id: cell1
      component: button
      config:
        label: "Cell Button"
```

**❌ INCORRECT StatusGrid configurations:**
```yaml
cells:
  - id: cell1
    preset: lozenge                # ❌ Wrong: should be lcars_button_preset
    style:
      preset: lozenge              # ❌ Wrong: preset should be at cell level
      lcars_button_preset: lozenge # ❌ Wrong: should be at cell level
```

## 🎨 **Available Universal Button Presets**

All these presets work in both ButtonOverlay and StatusGrid:

| Preset Name | Description | Theme Tokens Used |
|-------------|-------------|-------------------|
| `lozenge` | Rounded button with accent primary color | `theme:colors.accent.primary` |
| `bullet` | Compact rounded button with secondary accent | `theme:colors.accent.secondary` |
| `picard-filled` | Square filled button with tertiary accent | `theme:colors.accent.tertiary` |
| `badge` | Info-style badge with subtle background | `theme:colors.status.info` |
| `compact` | Minimal button with muted styling | `theme:colors.ui.muted` |

## 🔄 **Universal Preset Lookup Strategy**

When you specify a preset, the system looks for it in this order:

1. **Exact Match**: `{overlayType}.{presetName}`
   - `button_overlay.lozenge`
   - `status_grid.bullet`

2. **Universal Fallback**: `button.{presetName}` ✅
   - `button.lozenge` (works for ButtonOverlay)
   - `button.bullet` (works for StatusGrid)

3. **Fallback Candidates**: Other potential matches

## 🔄 **Backward Compatibility**

Legacy `status_grid.{preset}` configurations still work via extends:

```yaml
# This still works:
style:
  lcars_button_preset: status_grid.lozenge

# Because status_grid.lozenge extends button.lozenge
```

**Pack Definition:**
```javascript
status_grid: {
  lozenge: { extends: 'button.lozenge' },
  bullet: { extends: 'button.bullet' },
  // ... other presets
}
```

## 🎭 **Theme Token Integration**

Universal presets use theme tokens for dynamic styling:

```javascript
// Example: lozenge preset
{
  color: 'theme:colors.accent.primary',           // Dynamic accent color
  background_color: 'theme:colors.ui.card',       // Card background
  border_color: 'theme:colors.ui.border',         // Border color
  font_family: 'theme:typography.fontFamily.primary', // Primary font
  text_color: 'theme:colors.ui.foreground'        // Text color
}
```

These resolve to actual values during rendering based on the active theme.

## ✅ **Schema Validation Tests**

### **Valid Configurations**
- ✅ `style.lcars_button_preset` in ButtonOverlay
- ✅ `lcars_button_preset` in StatusGrid cells
- ✅ `style.lcars_button_preset` in StatusGrid (legacy)
- ✅ Universal preset names (`lozenge`, `bullet`, etc.)
- ✅ Legacy preset names (`status_grid.lozenge`)

### **Invalid Configurations**
- ❌ `preset` at root level (any overlay)
- ❌ `preset` in style section
- ❌ `lcars_button_preset` outside of style/cell
- ❌ Undefined preset names

## 🧪 **Test Configuration**

Use `test-universal-presets.yaml` to verify:
- ButtonOverlay with universal presets
- StatusGrid cells with universal presets
- Legacy compatibility with `status_grid.lozenge`
- Theme token resolution in action

## 🚀 **Implementation Status**

- ✅ Universal button presets defined in `loadBuiltinPacks.js`
- ✅ StylePresetManager hierarchical lookup implemented
- ✅ Theme token resolution via ModelBuilder fixed
- ✅ Backward compatibility via extends property
- ✅ Schema validation in place
- ✅ Runtime error (`forComponent is not a function`) fixed

## 📁 **Key Files**

- `src/msd/validation/schemas/buttonOverlay.js` - ButtonOverlay schema
- `src/msd/validation/schemas/statusGridOverlay.js` - StatusGrid schema
- `src/msd/packs/loadBuiltinPacks.js` - Universal preset definitions
- `src/msd/presets/StylePresetManager.js` - Preset resolution logic
- `src/msd/pipeline/ModelBuilder.js` - Theme token resolution
- `test-universal-presets.yaml` - Comprehensive test configuration
