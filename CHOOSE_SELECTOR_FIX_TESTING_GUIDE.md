# Choose Selector Value Handling - Testing Guide

## Overview

This guide provides step-by-step instructions for testing the choose selector value transformation fix in LCARdS FormFieldHelper.

## What Was Fixed

**Problem:** Choose selectors were polluting config with wrapper structures and not loading existing clean configs correctly.

**Solution:** Added bidirectional value transformation:
1. **On render**: Clean config value → choose structure (so HA knows which option to show)
2. **On change**: Choose structure → clean config value (so config stays clean)

## Setup

1. **Copy built file to Home Assistant:**
   ```bash
   cp dist/lcards.js /path/to/homeassistant/www/community/lcards/
   ```

2. **Clear browser cache:**
   - Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
   - Or open Developer Console and check "Disable cache"

3. **Open browser console:**
   - Press `F12` to see debug logs
   - Filter by `[FormFieldHelper]` to see transformation logs

## Test Scenarios

### Test 1: Gap Field (Slider) - Number ↔ String

**Location:** Any card with `style.track.segments.gap` (e.g., lcards-slider)

**Steps:**
1. Open slider card editor
2. Navigate to "Track" tab
3. Locate "Gap" field with choose selector

**Test 1a: Set number value**
```yaml
# Action: Set gap to 23 using slider
# Expected console log:
# [FormFieldHelper] Choose value extracted: {
#   path: "style.track.segments.gap",
#   rawValue: { active_choice: "pixels", pixels: 23, theme_token: "" },
#   activeChoice: "pixels",
#   extractedValue: 23
# }

# Expected config (YAML view):
style:
  track:
    segments:
      gap: 23  # ✅ Clean number (no wrapper)
```

**Test 1b: Switch to theme token**
```yaml
# Action: Change selector to "Theme Token"
# Action: Enter: {theme:spacing.sm}
# Expected console log:
# [FormFieldHelper] Choose value extracted: {
#   path: "style.track.segments.gap",
#   rawValue: { active_choice: "theme_token", pixels: 0, theme_token: "{theme:spacing.sm}" },
#   activeChoice: "theme_token",
#   extractedValue: "{theme:spacing.sm}"
# }

# Expected config (YAML view):
style:
  track:
    segments:
      gap: "{theme:spacing.sm}"  # ✅ Clean string (no wrapper)
```

**Test 1c: Switch back to pixels**
```yaml
# Action: Change selector back to "Pixels"
# Expected: Slider shows last number value (e.g., 23)
# Number box updates when moving slider
```

### Test 2: Border Radius (Button) - Number ↔ Object

**Location:** Button card editor

**Steps:**
1. Open button card editor
2. Navigate to "Card & Border" or "Border" tab
3. Locate "Radius" field with choose selector

**Test 2a: Set number value**
```yaml
# Action: Set radius to 12
# Expected config:
style:
  border:
    radius: 12  # ✅ Clean number
```

**Test 2b: Switch to Per Corner**
```yaml
# Action: Change selector to "Per Corner"
# Action: Set values:
#   - Top Left: 12
#   - Top Right: 12
#   - Bottom Right: 0
#   - Bottom Left: 0

# Expected console log:
# [FormFieldHelper] Choose value extracted: {
#   path: "style.border.radius",
#   rawValue: { active_choice: "per_corner", per_corner: {...}, ... },
#   activeChoice: "per_corner",
#   extractedValue: { top_left: 12, top_right: 12, ... }
# }

# Expected config:
style:
  border:
    radius:  # ✅ Clean object (no wrapper)
      top_left: 12
      top_right: 12
      bottom_right: 0
      bottom_left: 0
```

### Test 3: Bar Width (Elbow) - Number ↔ "theme" String

**Location:** Elbow card editor (if available)

**Steps:**
1. Open elbow card editor
2. Navigate to "Elbow Design" tab
3. Locate "Bar Width" field

**Test 3a: Set number value**
```yaml
# Action: Set bar_width to 90
# Expected config:
style:
  elbow:
    bar_width: 90  # ✅ Clean number
```

**Test 3b: Switch to Theme Binding**
```yaml
# Action: Change selector to "Theme Binding"
# Expected console log:
# [FormFieldHelper] Choose value extracted: {
#   path: "style.elbow.bar_width",
#   rawValue: { active_choice: "theme_binding", pixels: 0, theme_binding: "theme" },
#   activeChoice: "theme_binding",
#   extractedValue: "theme"
# }

# Expected config:
style:
  elbow:
    bar_width: "theme"  # ✅ Clean string (special "theme" value)
```

### Test 4: Loading Existing Config

**Test 4a: Load number value**
```yaml
# Action: Edit card YAML directly:
type: custom:lcards-slider
style:
  track:
    segments:
      gap: 23

# Action: Switch to visual editor
# Expected console log:
# [FormFieldHelper] Value prepared for choose selector: {
#   rawValue: 23,
#   activeChoice: "pixels",
#   chooseValue: { active_choice: "pixels", pixels: 23, theme_token: "" }
# }

# Expected: Gap field shows:
#   - "Pixels" option selected
#   - Slider at position 23
#   - Number box shows "23"
```

**Test 4b: Load theme token value**
```yaml
# Action: Edit card YAML directly:
type: custom:lcards-slider
style:
  track:
    segments:
      gap: "{theme:spacing.sm}"

# Action: Switch to visual editor
# Expected console log:
# [FormFieldHelper] Value prepared for choose selector: {
#   rawValue: "{theme:spacing.sm}",
#   activeChoice: "theme_token",
#   chooseValue: { active_choice: "theme_token", pixels: 0, theme_token: "{theme:spacing.sm}" }
# }

# Expected: Gap field shows:
#   - "Theme Token" option selected
#   - Text input with value "{theme:spacing.sm}"
```

**Test 4c: Load object value**
```yaml
# Action: Edit card YAML directly:
type: custom:lcards-button
style:
  border:
    radius:
      top_left: 12
      top_right: 12
      bottom_right: 0
      bottom_left: 0

# Action: Switch to visual editor
# Expected: Radius field shows:
#   - "Per Corner" option selected
#   - All four corner fields populated with correct values
```

### Test 5: Choose Selector Reactivity

**Steps:**
1. Open any card with choose selector field
2. Test live updates within same choice

**Test 5a: Number selector reactivity**
```
# Action: Move slider
# Expected: Number box updates immediately (live binding)
# Expected: Config updates with each change
```

**Test 5b: Text selector reactivity**
```
# Action: Type in text input
# Expected: Value updates in config as you type
```

**Test 5c: Cross-choice switching**
```
# Action: Start with "Pixels" (23)
# Action: Switch to "Theme Token"
# Expected: Previous number value is NOT lost (stored in choose structure temporarily)
# Expected: Text input appears, ready for theme token

# Action: Enter "{theme:spacing.sm}"
# Action: Switch back to "Pixels"
# Expected: Slider returns to last number value (23)
# Expected: Theme token is NOT lost until you save with pixels selected
```

## Success Criteria

✅ **Config stays clean:**
- No `active_choice` property in saved YAML
- No nested choice structures in saved YAML
- Only the actual selected value is saved

✅ **Choose selector renders correctly:**
- Automatically selects correct option based on value type
- Shows correct input for selected option (slider, text, object editor)
- All fields are populated with correct values

✅ **Live updates work:**
- Number box updates as slider moves
- Text input updates as you type
- Switching choices preserves previous values temporarily

✅ **Console logging works:**
- `[FormFieldHelper] Value prepared for choose selector` on render
- `[FormFieldHelper] Choose value extracted` on change
- Logs show correct value transformations

✅ **No errors:**
- No console errors
- No "undefined" values in fields
- No 0-height choose selectors

## Troubleshooting

### Problem: Choose selector has 0 height / doesn't render

**Cause:** Value transformation not working

**Check:**
1. Look for console errors
2. Check console logs - should see `[FormFieldHelper] Value prepared for choose selector`
3. Verify selector config has `choose.choices` structure

**Fix:** Hard refresh browser (Ctrl+Shift+R) to clear cached version

### Problem: Config has wrapper objects

**Cause:** Value extraction not working

**Check:**
1. Look for `active_choice` in YAML
2. Check console logs - should see `[FormFieldHelper] Choose value extracted`
3. Verify change event is being handled

**Fix:** Hard refresh browser, verify correct lcards.js version loaded

### Problem: Existing config doesn't load

**Cause:** Value preparation not detecting correct choice

**Check:**
1. Console log shows which `activeChoice` was detected
2. Verify value type matches choice selector type
3. Check for theme token patterns (`{theme:`, `var(--`)

**Fix:** May need to adjust value detection logic in `_prepareValueForSelector()`

## Debug Commands

```javascript
// In browser console:

// Check if new code is loaded:
console.log(window.customCards.find(c => c.type === 'lcards-button')?.version);

// Get FormFieldHelper:
const form = document.querySelector('lcards-form-field');
console.log(form);

// Check selector config:
const editor = document.querySelector('lcards-button-editor');
const schema = editor._getSchemaForPath?.('style.track.segments.gap');
console.log(schema?.['x-ui-hints']?.selector);

// Manually test transformation:
const testValue = 23;
const selectorConfig = { choose: { choices: { pixels: { selector: { number: {} } }, theme_token: { selector: { text: {} } } } } };
// Would need to access FormFieldHelper class directly
```

## Visual Examples

### ✅ CORRECT: Clean Config
```yaml
type: custom:lcards-slider
style:
  track:
    segments:
      gap: 23
```

### ❌ WRONG: Polluted Config (Before Fix)
```yaml
type: custom:lcards-slider
style:
  track:
    segments:
      gap:
        active_choice: pixels  # ❌ Should not be here
        pixels: 23             # ❌ Should not be nested
        theme_token: ""        # ❌ Should not be here
```

## Conclusion

If all test scenarios pass, the choose selector value transformation is working correctly:
- Config stays clean (no wrapper objects)
- Choose selectors render correctly with existing configs
- Live updates work smoothly
- Type switching preserves values appropriately

Report any failures with:
1. Test scenario number
2. Console logs (filter by `[FormFieldHelper]`)
3. YAML before/after
4. Browser console errors
