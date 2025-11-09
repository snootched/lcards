# Unified Preset System - Implementation Complete

**Status**: ✅ **COMPLETE** - Both V2 cards and MSD cards can now use unified presets
**Date**: November 8, 2025
**Context**: Phase 2B Overlay Architecture - Preset Integration

## Overview

Successfully implemented a unified preset system that allows both V2 cards and MSD cards to use the same button presets with consistent styling, theme token integration, and inheritance patterns.

## Architecture Summary

### Unified Access Pattern
Both card types access presets through the StylePresetManager singleton:

```javascript
// V2 Cards (via SystemsManager)
const preset = this.getStylePreset('button', 'lozenge');

// MSD Cards (via direct singleton access)
const preset = window.lcards.core.getStylePresetManager().getPreset('button', 'lozenge');

// Unified API (consistent access)
const preset = window.lcards.debug.singletons.getStylePresetManager().getPreset('button', 'lozenge');
```

### Theme Token Integration
All presets use theme tokens for consistent theming:

```javascript
// In preset definition
background_color: 'theme:components.button.base.background.active'

// Resolved at runtime by StylePresetManager
background_color: '#FF9900'  // From active theme
```

## Implementation Details

### 1. ✅ Theme Token Expansion
**File**: `src/msd/themes/tokens/lcarsClassicTokens.js`

Added comprehensive button tokens to support unified presets:
- `components.button.base.*` - Complete token hierarchy
- Color states: active/inactive/unavailable
- Layout dimensions: height, padding, margins
- Border radius values: none/small/medium/large/full/pill
- Typography: font family, sizes, weights
- Icon styling: sizes, border properties

### 2. ✅ Builtin Preset Pack
**File**: `src/msd/packs/loadBuiltinPacks.js`

Converted all legacy button templates to unified presets in `LCARDS_BUTTONS_PACK`:

**Button Presets Available**:
- `base` - Foundation for all buttons
- `lozenge` - Fully rounded (pill-shaped)
- `lozenge-right` - Pill-shaped with right-aligned text/icon
- `bullet` - Half-rounded (rounded left, square right)
- `bullet-right` - Half-rounded (square left, rounded right)
- `capped` - Single-side rounded (left side only)
- `capped-right` - Single-side rounded (right side only)
- `picard-filled` - Solid filled style with borders
- `picard-filled-right` - Filled with right-aligned content
- `picard-filled-dense` - Compact height variant
- `picard-filled-dense-right` - Compact + right-aligned
- `picard` - Outline style (transparent background)
- `picard-right` - Outline with right-aligned content
- `picard-dense` - Compact outline
- `picard-dense-right` - Compact outline + right-aligned
- `picard-icon` - Icon-only compact button
- `square` - Basic square button

**Features**:
- ✅ **Inheritance**: `extends: 'button.base'` for consistent foundation
- ✅ **Theme Tokens**: All colors/dimensions use `theme:` prefixes
- ✅ **State Management**: Active/inactive/unavailable state support
- ✅ **Layout Variants**: Left/right alignment, dense variants, icon-only
- ✅ **Automatic Loading**: Always loaded with `builtin_themes` pack

### 3. ✅ Singleton Integration
**File**: `src/core/lcards-core.js`

Added public getter methods for preset access:
```javascript
getStylePresetManager() // Returns StylePresetManager singleton
getThemeManager()       // Returns ThemeManager via SystemsManager
```

**File**: `src/msd/packs/loadBuiltinPacks.js`
- ✅ `builtin_themes` pack always loaded at startup
- ✅ Contains both themes AND presets
- ✅ Automatic initialization via existing SystemsManager flow

### 4. ✅ V2 Card Integration
**File**: `src/base/V2CardSystemsManager.js`

Added StylePresetManager access methods:
```javascript
getStylePreset(overlayType, presetName)    // Get resolved preset with theme tokens
getAvailablePresets(overlayType)           // List available presets
hasStylePreset(overlayType, presetName)    // Check preset existence
```

**Features**:
- ✅ **Theme Token Resolution**: Automatically resolves `theme:` tokens via ThemeManager
- ✅ **Error Handling**: Graceful fallbacks when services unavailable
- ✅ **Consistent API**: Same interface as MSD cards use

### 5. ✅ Inheritance & Resolution
**Verified Working**:
- ✅ **Preset Inheritance**: `extends: 'button.base'` correctly merges properties
- ✅ **Theme Token Resolution**: `theme:components.button.*` resolves to actual values
- ✅ **Hierarchical Lookup**: Universal `button.*` presets work for all overlay types
- ✅ **Runtime Resolution**: Tokens resolved dynamically with active theme

## Testing Results

### Preset Structure Test ✅
**File**: `test-preset-structure.js`

```
✅ Preset data structures are correctly defined
✅ Inheritance chain resolution works (extends property)
✅ Theme token resolution works (theme: prefix)
✅ Complex presets like picard-icon resolve correctly
✅ State management properties are preserved
```

**Sample Resolution**:
```javascript
// Input: button.lozenge preset
{
  extends: 'button.base',
  border_radius_top_left: 'theme:components.button.base.radius.pill'
}

// Resolved Output:
{
  font_family: 'Arial, sans-serif',        // Inherited from base
  background_color: '#FF9900',             // Inherited from base
  border_radius_top_left: 25,              // Theme token resolved
  // ... all other base properties inherited
}
```

## Usage Examples

### V2 Card Usage
```javascript
class MyV2Card extends LCARdSV2Card {
  async connectedCallback() {
    await super.connectedCallback();

    // Get lozenge preset for button styling
    const preset = this.getStylePreset('button', 'lozenge');

    // Apply to element
    this.applyPresetStyles(this.buttonElement, preset);
  }
}
```

### MSD Card Usage
```javascript
// In MSD overlay configuration
{
  overlays: [
    {
      type: 'button',
      style_preset: 'lozenge',  // Uses button.lozenge preset
      // ... other config
    }
  ]
}

// Or programmatically
const preset = window.lcards.core.getStylePresetManager().getPreset('button', 'picard-filled');
```

## Benefits Achieved

### 1. ✅ **Unified Styling**
- Both V2 and MSD cards use identical button appearances
- Consistent theme integration across card types
- No duplication of styling logic

### 2. ✅ **Theme Consistency**
- All presets respect active theme colors
- Dynamic theme switching affects all cards uniformly
- Theme tokens provide flexible color customization

### 3. ✅ **Maintainability**
- Single source of truth for button styling
- Easy to add new preset variants
- Inheritance reduces duplication

### 4. ✅ **Developer Experience**
- Simple API: `getStylePreset('button', 'lozenge')`
- Consistent interface across V2/MSD
- Rich preset library available immediately

## Next Steps

### Immediate (Ready to Use)
1. ✅ **V2 Button Cards**: Can now implement using unified presets
2. ✅ **MSD Styling**: StatusGrid and other overlays can reference button presets
3. ✅ **Theme Development**: New themes automatically work with all presets

### Future Enhancements
1. **Additional Preset Categories**: text, chart, layout presets
2. **Runtime Preset Registration**: Custom presets from user packs
3. **Preset Validation**: Schema validation for preset definitions
4. **Visual Preset Editor**: UI for creating/editing presets

## Critical Path Unblocked

The **preset integration** was identified as the critical path blocker for V2 card development. This implementation resolves that blocker:

✅ **V2 cards can now access unified presets**
✅ **Theme integration is complete**
✅ **Legacy button templates converted**
✅ **Singleton architecture unified**

**Result**: V2 card suite development can now proceed with consistent, theme-aware styling using the unified preset system.