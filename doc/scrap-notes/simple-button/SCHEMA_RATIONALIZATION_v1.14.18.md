# Schema Rationalization - v1.14.18

**Date:** November 20, 2025
**Status:** ✅ Documentation Complete - Ready for Implementation

## Overview

This document tracks the rationalization of the LCARdS Simple Button schema across documentation, theme tokens, presets, and code implementation.

---

## Phase 1: Documentation ✅ COMPLETE

### Changes Made

#### 1. **Standardized on `font_size`**
- ❌ **Removed:** `text.<field>.size`
- ✅ **Standard:** `text.<field>.font_size`
- **Rationale:** Matches CSS property naming, clearer intent

#### 2. **Removed All Backward Compatibility**
- ❌ **Removed:** All flat-key documentation (`background_color`, `text_color`, etc.)
- ❌ **Removed:** Migration guide sections
- ❌ **Removed:** "Legacy" and "Deprecated" references
- ✅ **Clean Break:** v1.14.18 only supports nested schema

#### 3. **Updated Both Docs to Match**
- ✅ `doc/architecture/simple-button-schema-definition.md` - Authoritative schema
- ✅ `doc/user-guide/configuration/simple-button-quick-reference.md` - User reference
- Both now have identical schema definitions with consistent examples

#### 4. **Version Bump**
- **Previous:** v1.14.16
- **New:** v1.14.18
- **Breaking Changes Notice:** Added to both docs

---

## Final Schema Structure (Authoritative)

### Text Properties
```yaml
text:
  <field-id>:
    content: <string>
    position: <position-name>
    x: <number>                # Explicit coordinates
    y: <number>
    x_percent: <number>        # Percentage positioning
    y_percent: <number>
    rotation: <number>         # Degrees (positive = clockwise)
    padding: <number|object>   # Uniform or {top, right, bottom, left}
    font_size: <number>        # ✅ STANDARD (not 'size')
    font_weight: <css-value>
    font_family: <css-value>
    color: <color|object>      # Single color or {active, inactive, unavailable}
    anchor: start | middle | end
    baseline: hanging | central | alphabetic
    show: <boolean>
    template: <boolean>
```

### Style Properties
```yaml
style:
  card:
    color:
      default: <color>
      active: <color>
      inactive: <color>
      unavailable: <color>
      background:
        default: <color>
        active: <color>
        inactive: <color>
        unavailable: <color>

  border:
    width: <css-size> | {top, right, bottom, left}
    radius: <css-size> | {top_left, top_right, bottom_right, bottom_left}
    color:
      default: <color>
      active: <color>
      inactive: <color>
      unavailable: <color>
    # Per-side override:
    top: {width: <css-size>, color: <color>}
    right: {width: <css-size>, color: <color>}
    bottom: {width: <css-size>, color: <color>}
    left: {width: <css-size>, color: <color>}

  text:
    default:
      color:
        default: <color>
        active: <color>
        inactive: <color>
        unavailable: <color>
      font_size: <css-size>      # ✅ STANDARD
      font_weight: <css-value>
      font_family: <css-font-stack>
```

---

## Phase 2: Theme Tokens (Next)

### Required Changes

**File:** `src/core/themes/tokens/lcarsClassicTokens.js`

#### Current State Analysis
✅ Already uses `font_size` (correct!)
```javascript
text: {
  default: {
    font_size: '14px',  // ✅ Correct
    // ...
  }
}
```

#### Cleanup Needed
- [ ] Organize properties for clarity
- [ ] Ensure all nested paths match schema
- [ ] Remove any inconsistent structures
- [ ] Add JSDoc comments for clarity

---

## Phase 3: Presets (Next)

### Required Changes

**File:** `src/core/packs/loadBuiltinPacks.js`

#### Presets to Update
- [ ] `button.base` - Foundation preset
- [ ] `button.lozenge` - Fully rounded
- [ ] `button.lozenge-right` - Icon on right
- [ ] `button.bullet` - Half rounded (left)
- [ ] `button.bullet-right` - Half rounded (right)
- [ ] `button.capped` - Single side rounded
- [ ] All other button variants

#### Changes Needed
- [ ] Verify all use nested schema
- [ ] Ensure `text.default.font_size` (not `size`)
- [ ] Verify `border.radius` structure
- [ ] Check `icon.size` references (icon size is OK, text uses font_size)

---

## Phase 4: Code Implementation (Next)

### Required Changes

**File:** `src/cards/lcards-simple-button.js`

#### Backward Compatibility Removal
- [ ] Remove all flat-key reading code:
  - `background_color` → Only use `card.color.background.{state}`
  - `text_color` → Only use `text.default.color.{state}`
  - `border_color` → Only use `border.color.{state}`
  - `border_width` → Only use `border.width`
  - `border_radius` → Only use `border.radius`
  - `font_size` → Only use `text.default.font_size`
  - `font_weight` → Only use `text.default.font_weight`
  - `font_family` → Only use `text.default.font_family`

#### Methods to Update
- [ ] `_resolveButtonStyleSync()` - Remove flat-key fallbacks
- [ ] `_processIconConfiguration()` - Verify nested schema only
- [ ] `_resolveBorderConfiguration()` - Remove legacy support
- [ ] `_resolveTextConfiguration()` - Use `font_size` only
- [ ] `_generateSimpleButtonSVG()` - Read from nested paths only
- [ ] Remove any `_hasNestedValue()` checks for flat keys

---

## Phase 5: Testing (Final)

### Test Files to Update
- [ ] `test/*.yaml` - All test configs using simple buttons
- [ ] Convert any flat-key configs to nested schema
- [ ] Update all `size:` to `font_size:` in text blocks
- [ ] Verify icon `size:` is unchanged (that's correct)

### Validation
- [ ] Build succeeds (`npm run build`)
- [ ] Buttons render correctly in Home Assistant
- [ ] State changes work (active/inactive/unavailable)
- [ ] Rules engine still functions
- [ ] Theme token resolution works
- [ ] Computed tokens work (alpha, darken, etc.)

---

## Breaking Changes Summary

### v1.14.18 Breaking Changes

**Removed Support:**
1. ❌ All flat-key style properties (`background_color`, `text_color`, etc.)
2. ❌ Old icon syntax (`{type: 'mdi', icon: 'lightbulb'}`)
3. ❌ Old rules syntax (`conditions:` array)
4. ❌ `text.<field>.size` (use `font_size` instead)

**Migration Required:**
Users **must** update their configs to use nested schema. No automatic migration.

**Rationale:**
- Clean up technical debt from multiple refactoring iterations
- Single, clear schema reduces confusion
- Easier maintenance going forward
- Aligns with modern CB-LCARS standards

---

## Checklist

### Documentation ✅
- [x] Update `simple-button-schema-definition.md`
- [x] Update `simple-button-quick-reference.md`
- [x] Remove all backward compatibility references
- [x] Standardize on `font_size`
- [x] Add breaking changes notices
- [x] Bump version to 1.14.18

### Theme Tokens
- [ ] Review `lcarsClassicTokens.js` structure
- [ ] Verify `font_size` usage
- [ ] Organize for clarity
- [ ] Add documentation comments

### Presets
- [ ] Update all button presets
- [ ] Verify nested schema usage
- [ ] Check `font_size` vs `size` usage
- [ ] Test preset inheritance

### Code
- [ ] Remove flat-key backward compatibility
- [ ] Update all reading code to nested paths only
- [ ] Remove legacy fallback logic
- [ ] Update JSDoc comments

### Testing
- [ ] Update test configs
- [ ] Build and verify
- [ ] Test in Home Assistant
- [ ] Verify all features still work

---

## Implementation Order

1. ✅ **Documentation** - Complete authoritative schema
2. **Theme Tokens** - Align token structure
3. **Presets** - Update preset definitions
4. **Code** - Remove legacy support
5. **Testing** - Verify everything works

**Current Status:** Phase 1 complete, ready for Phase 2

---

**Document Owner:** Schema Rationalization Team
**Last Updated:** November 20, 2025
