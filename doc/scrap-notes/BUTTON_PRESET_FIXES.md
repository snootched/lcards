# Button Preset Fixes - Phase 1 Completion

## Date: November 18, 2025

## Summary
Fixed all button presets in `src/core/packs/loadBuiltinPacks.js` to use proper nested object structures that match how the `lcards-simple-button.js` code expects them.

## Problem
The button presets were using flat property names (e.g., `padding_top`, `icon_border_right_color`) when the rendering code expects nested objects (e.g., `text.padding.top`, `icon.border.right.color`).

## Solution
Converted all presets to use proper nested structure matching the CB-LCARS YAML format and the actual code expectations.

---

## Fixed Presets

### 1. **Base Button** ✅
**Before:** Flat properties
```javascript
padding_top: 'theme:...',
padding_bottom: 'theme:...',
text_justify: 'right',
icon_size: 'theme:...',
icon_border_width: 'theme:...'
```

**After:** Nested structure
```javascript
text: {
  justify: 'right',
  align_items: 'end',
  padding: {
    top: 'theme:...',
    bottom: 'theme:...',
    left: 'theme:...',
    right: 'theme:...'
  },
  default: {
    color: {
      active: 'theme:...',
      inactive: 'theme:...',
      unavailable: 'theme:...'
    }
  }
},
border: {
  width: 0,
  color: 'theme:...',
  radius: 'theme:...'
},
icon: {
  size: 'theme:...',
  position: 'left',
  color: { default: 'theme:...' },
  border: {
    width: 'theme:...',
    color: 'theme:...',
    padding: 'theme:...'
  }
}
```

### 2. **Lozenge Buttons** ✅
Already had correct nested structure:
- `lozenge`
- `lozenge-right`

**Structure:**
```javascript
border: {
  radius: {
    top_left: 'theme:...',
    top_right: 'theme:...',
    bottom_left: 'theme:...',
    bottom_right: 'theme:...'
  }
},
icon: {
  border: {
    left: { padding: '0px' },
    right: { padding: '3px' }
  }
}
```

### 3. **Bullet Buttons** ✅
**Before:** Flat border radius properties
```javascript
border_radius_top_left: 'theme:...',
border_radius_bottom_left: 'theme:...',
border_radius_top_right: 'theme:...',
border_radius_bottom_right: 'theme:...'
```

**After:** Nested structure
```javascript
border: {
  radius: {
    top_left: 'theme:...',
    bottom_left: 'theme:...',
    top_right: 'theme:...',
    bottom_right: 'theme:...'
  }
}
```

Fixed variants:
- `bullet`
- `bullet-right`

### 4. **Capped Buttons** ✅
Same fix as bullet buttons - converted to nested `border.radius` structure.

Fixed variants:
- `capped`
- `capped-right`

### 5. **Picard Filled Buttons** ✅
**Before:** Mixed flat and problematic properties
```javascript
text_align_items: 'center',
padding_top: 0,
padding_bottom: 5,
padding_left: 'theme:...',
icon_border_right_color: 'theme:...',
icon_border_right_padding: 'theme:...',
icon_border_left_color: 'theme:...'
```

**After:** Proper nested structure
```javascript
text: {
  align_items: 'center',
  padding: {
    top: '0px',
    bottom: '5px',
    left: 'theme:...',
    right: 'theme:...'
  },
  color: {
    default: 'theme:...',
    active: 'theme:...',
    inactive: 'theme:...'
  }
},
icon: {
  justify: 'left',
  border: {
    right: {
      size: '6px',
      color: 'theme:...',
      padding: 'theme:...'
    },
    left: {
      size: '6px',
      color: 'theme:...',
      padding: 'theme:...'
    }
  }
}
```

Fixed variants:
- `picard-filled`
- `picard-filled-right`
- `picard-filled-dense`
- `picard-filled-dense-right`

### 6. **Picard Outline Buttons** ✅
**Before:** Mixed flat properties
```javascript
background_color: 'theme:...',
border_width: 'theme:...',
border_color: 'theme:...',
text_color: 'theme:...',
icon_border_right_color: 'theme:...'
```

**After:** Proper nested structure
```javascript
background_color: 'theme:...',  // Kept flat (top-level)
border: {
  width: 'theme:...',
  color: 'theme:...'
},
text: {
  align_items: 'center',
  padding: { ... },
  color: {
    default: 'theme:...',
    active: 'theme:...',
    inactive: 'theme:...'
  }
},
icon: {
  justify: 'left',
  border: {
    right: {
      size: '6px',
      color: 'theme:...',
      padding: 'theme:...'
    }
  }
}
```

Fixed variants:
- `picard`
- `picard-right`
- `picard-dense`
- `picard-dense-right`

### 7. **Picard Icon Button** ✅
**Before:** Mixed flat properties
```javascript
border_radius_top_left: 'theme:...',
border_radius_top_right: 'theme:...',
border_radius_bottom_left: 'theme:...',
border_radius_bottom_right: 'theme:...',
icon_justify: 'center',
text_align_items: 'center',
icon_border_left_width: 0,
icon_border_right_width: 0,
icon_size: 30
```

**After:** Proper nested structure
```javascript
border: {
  radius: {
    top_left: 'theme:...',
    top_right: 'theme:...',
    bottom_left: 'theme:...',
    bottom_right: 'theme:...'
  }
},
icon: {
  size: 30,
  justify: 'center',
  border: {
    left: { width: 0 },
    right: { width: 0 }
  }
},
text: {
  align_items: 'center'
}
```

### 8. **Square Button** ✅
Already minimal and correct - no nested properties needed.

---

## Verification

### Build Status
✅ **Success** - No compilation errors
```
webpack 5.97.0 compiled with 3 warnings in 8621 ms
```

(Warnings are normal bundle size recommendations, not errors)

### Code Structure Validation
All presets now match the expected structure from `lcards-simple-button.js`:
- ✅ `style.text.padding.top`
- ✅ `style.text.default.color.active`
- ✅ `style.icon.border.right.color`
- ✅ `style.icon.border.right.padding`
- ✅ `style.border.radius.top_left`
- ✅ `style.border.custom_path`

### Theme Token Integration
All values properly reference theme tokens:
- ✅ `theme:components.button.base.font.family`
- ✅ `theme:components.button.base.layout.height.standard`
- ✅ `theme:components.button.base.icon.border.padding.dense`
- ✅ `theme:components.button.base.radius.full`

---

## Reference: CB-LCARS Legacy Format

The fixes align with the original CB-LCARS YAML structure:
```yaml
lcards-button-picard-filled:
  template: lcards-button-base
  variables:
    text:
      label:
        font_weight: normal
        padding:
          top: 0px
          left: 10px
          right: 10px
          bottom: 5px
        color:
          active: black
          inactive: black
    icon:
      justify: left
      border:
        right:
          size: 6px
          color: black
          padding: 1.5%
        left:
          size: 6px
          color: transparent
          padding: 0.5%
```

---

## Next Steps

1. **Test in Browser** ⏸️
   - Open `test/test-custom-path.html` to verify custom path rendering
   - Test button presets in actual Home Assistant dashboard

2. **Documentation** 📝
   - Update user guide with preset examples
   - Document nested structure requirements

3. **Phase 2** 🚀
   - Complete remaining Phase 1 tasks
   - Move to Phase 2: MSD globalization features

---

## Files Modified
- `src/core/packs/loadBuiltinPacks.js` - Fixed all button presets (lines 50-400)

## Commit Message
```
fix: Convert button presets to proper nested structure

- Fixed base button to use text.padding, icon.border, border.radius
- Updated all Picard variants (filled, outline, icon)
- Converted bullet and capped presets to nested border.radius
- All presets now match lcards-simple-button.js expectations
- Build successful with theme token integration
```
