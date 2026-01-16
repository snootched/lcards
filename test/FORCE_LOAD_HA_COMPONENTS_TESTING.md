# Force-Load HA Components Testing Guide

## Overview
This document describes how to test the force-loading mechanism for Home Assistant components (`hui-card-picker` and `hui-card-element-editor`) in the MSD Studio dialog.

## What Was Changed

### New Methods Added

1. **`_forceLoadHAComponents()`** - Strategy 1
   - Creates a temporary hidden `hui-dialog-edit-card` element
   - Triggers HA's internal component loading mechanism
   - Returns `true` if components successfully loaded

2. **`_forceLoadViaGridCard()`** - Strategy 2
   - Creates a temporary hidden grid card element
   - Attempts to trigger edit mode to force component loading
   - Alternative approach if Strategy 1 fails

3. **Enhanced `_ensureHAComponentsLoaded()`**
   - Tries Strategy 1 first, then Strategy 2
   - Supports three tiers:
     - **Tier 1**: Full native (picker + editor) ✅
     - **Tier 2**: Hybrid mode (dropdown + native editor) ⚠️
     - **Tier 3**: Full fallback (legacy picker) ⚠️

## Testing Procedure

### Test 1: Fresh Page Load - Verify Force-Load Works

**Steps:**
1. Open Home Assistant in a fresh browser tab (or clear cache)
2. Open browser console (F12)
3. Enable verbose logging:
   ```javascript
   window.lcards.setGlobalLogLevel('debug')
   ```
4. Open any MSD card editor
5. Click "Open Studio" button to launch MSD Studio

**Expected Console Output:**
```
[MSDStudio] Checking HA component availability...
[MSDStudio] Initial state: { picker: false, editor: true }
[MSDStudio] Strategy 1: Trying hui-dialog-edit-card...
[MSDStudio] Attempting to force-load HA components...
[MSDStudio] ✅ Successfully force-loaded HA components
[MSDStudio] ✅ Tier 1: Full native (picker + editor)
```

**Verification:**
```javascript
// Check if components are now loaded
console.log('hui-card-picker:', !!customElements.get('hui-card-picker'));
console.log('hui-card-element-editor:', !!customElements.get('hui-card-element-editor'));
// Both should be true
```

### Test 2: Verify No UI Glitches

**Steps:**
1. Follow Test 1 procedure
2. Watch the screen carefully during MSD Studio opening

**Expected Behavior:**
- No dialogs or popups should flash on screen
- No visible temporary elements
- Smooth transition to MSD Studio dialog
- Console may show expected errors like "Dialog open failed (expected)" - this is normal

**Note:** The force-loading happens entirely off-screen (elements positioned at `-9999px` with `visibility: hidden`)

### Test 3: Verify Control Form Uses Native Picker

**Steps:**
1. Complete Test 1 (force-load successful)
2. In MSD Studio, go to "Controls" tab
3. Click "Add Control" button
4. Go to "Card" subtab in the form

**Expected Behavior:**
- Should see HA's native card picker (visual grid with card icons)
- Should NOT see legacy dropdown picker
- Selecting a card should open HA's native card editor

**Console Verification:**
```javascript
// Check tier mode
console.log('Component availability:', {
  picker: !!customElements.get('hui-card-picker'),
  editor: !!customElements.get('hui-card-element-editor')
});
// Both should be true for Tier 1
```

### Test 4: Verify Strategy 2 Fallback

**Steps:**
1. This test requires Strategy 1 to fail (rare in normal conditions)
2. Open browser console
3. Monitor for fallback logging:

**Expected Console Output (if Strategy 1 fails):**
```
[MSDStudio] Strategy 1: Trying hui-dialog-edit-card...
[MSDStudio] hui-dialog-edit-card not available, cannot force-load
[MSDStudio] Strategy 2: Trying temporary grid card...
[MSDStudio] Attempting force-load via temporary grid card...
[MSDStudio] ✅ Force-loaded via grid card
[MSDStudio] ✅ Tier 1: Full native (picker + editor)
```

### Test 5: Verify Tier 2 Hybrid Mode

**Steps:**
1. This test simulates `hui-card-picker` not loading (rare)
2. If `hui-card-element-editor` is available but `hui-card-picker` is not

**Expected Behavior:**
- Dropdown card type selector shown (legacy)
- Once card type selected, HA's native editor is used
- Console shows: `⚠️ Tier 2: Hybrid mode (dropdown + native editor)`

### Test 6: Verify Tier 3 Fallback

**Steps:**
1. This test simulates both components unavailable (very rare)

**Expected Behavior:**
- Full legacy card picker (dropdown + manual YAML)
- Console shows: `⚠️ Tier 3: Full fallback (legacy picker)`
- Warning banner may appear in UI

## Debugging Commands

```javascript
// Check current component state
console.log('Component State:', {
  picker: !!customElements.get('hui-card-picker'),
  editor: !!customElements.get('hui-card-element-editor'),
  dialog: !!customElements.get('hui-dialog-edit-card'),
  grid: !!customElements.get('hui-grid-card')
});

// Enable debug logging
window.lcards.setGlobalLogLevel('debug');

// Check MSD Studio instance (when open)
const studio = document.querySelector('lcards-msd-studio-dialog');
console.log('Studio available:', !!studio);
console.log('HA components available:', studio?._haComponentsAvailable);
```

## Common Issues and Solutions

### Issue 1: Components Still Not Loading

**Symptoms:**
- Console shows all strategies failed
- Tier 2 or Tier 3 mode active

**Solutions:**
1. Check HA version - ensure using recent version (2023.1+)
2. Try opening Grid card editor manually once (Edit Dashboard → Add Card → Grid)
3. Check browser console for errors
4. Clear browser cache and reload

### Issue 2: Console Errors During Force-Load

**Symptoms:**
- See errors like "Cannot read property X of undefined"
- Message says "Dialog open failed (expected)"

**Solution:**
- This is NORMAL and EXPECTED
- The force-loading intentionally calls methods without proper parameters
- The goal is to trigger component registration, not to actually use the dialog
- As long as final state shows components loaded, it worked correctly

### Issue 3: Performance Impact

**Symptoms:**
- MSD Studio takes longer to open
- Delay of ~100-200ms

**Solution:**
- This is expected and minimal
- Force-loading adds small delay but only on first open
- Components remain registered for entire browser session
- Subsequent opens will be instant (components already loaded)

## Success Criteria

✅ On fresh page load, force-loading is attempted
✅ Strategy 1 or Strategy 2 succeeds
✅ `hui-card-picker` becomes available without user action
✅ No visible UI glitches during force-loading
✅ Console shows clear logging of force-load attempts
✅ If force-load fails, gracefully falls back to Tier 2/3
✅ Control form uses native card picker (Tier 1)
✅ Native card editor works correctly

## Rollback Instructions

If force-loading causes issues:

1. **Restore previous version:**
   ```bash
   git revert b142d6d
   ```

2. **Remove force-load methods:**
   - Delete `_forceLoadHAComponents()` method
   - Delete `_forceLoadViaGridCard()` method
   - Restore original `_ensureHAComponentsLoaded()` (passive detection only)

3. **Accept Tier 2 as primary:**
   - Document that users need to open Grid editor once
   - Or accept legacy picker as fallback

## Additional Notes

- Force-loading is a workaround for HA's lazy-loading mechanism
- Components remain globally registered once loaded
- No memory leaks - temporary elements are properly cleaned up
- Safe to use - worst case is components don't load and fallback is used
- Future HA versions may change lazy-loading behavior
