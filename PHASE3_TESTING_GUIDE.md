# Phase 3: Anchor Dialog Visibility + Controls Tab Testing Guide

## Overview

This guide covers testing the fixes and enhancements made in Phase 3:
1. **Fix 1**: Anchor dialog visibility from any tab
2. **Fix 2**: Live preview element name (already correct)
3. **Phase 3 Foundation**: Controls tab placeholder implementation

---

## Prerequisites

1. **Build the project**:
   ```bash
   cd /home/runner/work/LCARdS/LCARdS
   npm install
   npm run build
   ```

2. **Copy to Home Assistant**:
   ```bash
   cp dist/lcards.js /path/to/homeassistant/www/community/lcards/
   ```

3. **Hard refresh browser** (Ctrl+Shift+R)

---

## Test 1: Anchor Dialog Visibility Fix

### Objective
Verify that the anchor form dialog appears immediately from any tab when placing an anchor.

### Test Steps

1. **Open MSD Studio**:
   - Use existing MSD card from `msd-test-1.yaml`
   - Click "Configure" or open editor
   - Click "Open Studio" button

2. **Test from Base SVG Tab** (PRIMARY TEST):
   - Make sure you're on the "Base SVG" tab (first tab)
   - Click "Place Anchor" mode button in toolbar
   - Click anywhere on the preview canvas
   - **Expected**: Anchor form dialog appears immediately
   - **Previous Behavior**: Had to manually switch to Anchors tab first

3. **Test from Controls Tab**:
   - Switch to "Controls" tab
   - Click "Place Anchor" mode button
   - Click on preview canvas
   - **Expected**: Anchor form dialog appears immediately

4. **Test from Lines Tab**:
   - Switch to "Lines" tab
   - Click "Place Anchor" mode button
   - Click on preview canvas
   - **Expected**: Anchor form dialog appears immediately

5. **Verify Anchor Creation**:
   - In the dialog, enter anchor name: `test_anchor_phase3`
   - X: 500, Y: 300, Unit: vb
   - Click "Save"
   - **Expected**: Dialog closes, anchor created
   - Switch to "Anchors" tab
   - **Expected**: See new anchor in list

### Success Criteria
- ✅ Anchor dialog appears from ANY tab
- ✅ No need to manually switch to Anchors tab
- ✅ Dialog overlays properly on top of studio dialog
- ✅ Anchor is saved correctly

---

## Test 2: Live Preview Element Name

### Objective
Verify that live preview correctly creates `lcards-msd-card` element.

### Test Steps

1. **Open MSD Studio**:
   - Use `msd-test-1.yaml` config
   - Click "Open Studio"

2. **Verify Preview Renders**:
   - **Expected**: Preview shows USS Enterprise (or configured SVG)
   - **Expected**: No console errors about "setConfig is not a function"

3. **Check Console** (F12):
   - Look for "[MSDLivePreview] Creating preview card" messages
   - **Expected**: No errors related to element creation

### Success Criteria
- ✅ Preview renders MSD card correctly
- ✅ No errors in console
- ✅ SVG appears properly in preview panel

---

## Test 3: Controls Tab - Empty State

### Objective
Verify Controls tab displays proper empty state message.

### Test Steps

1. **Create New MSD Card** (no controls):
   ```yaml
   type: custom:lcards-msd-card
   msd:
     base_svg:
       source: builtin:ncc-1701-a-blue
     anchors:
       test1: [100, 100]
   ```

2. **Open Studio**:
   - Click "Open Studio"
   - Navigate to "Controls" tab

3. **Verify Empty State**:
   - **Expected**: Info message: "No control overlays defined yet."
   - **Expected**: Message explains what controls are
   - **Expected**: Two buttons visible: "Add Control" and "Place on Canvas"

### Success Criteria
- ✅ Friendly empty state message
- ✅ Clear explanation of controls
- ✅ Action buttons available

---

## Test 4: Controls Tab - List Display

### Objective
Verify Controls tab displays existing controls correctly.

### Test Steps

1. **Use Test Config** with controls:
   - Use `msd-test-1.yaml` (has `control1` and `control2`)
   - Or create a test config:
     ```yaml
     type: custom:lcards-msd-card
     msd:
       base_svg:
         source: builtin:ncc-1701-a-blue
       overlays:
         - id: test_control
           type: control
           card:
             type: button
             entity: light.living_room
           position: [500, 300]
           size: [120, 80]
     ```

2. **Open Studio**:
   - Navigate to "Controls" tab

3. **Verify Control List Item**:
   - **Expected**: Control card displayed with:
     - Icon: `mdi:card-outline` (outline icon, not solid)
     - Control ID in bold (e.g., "control1" or "test_control")
     - Card type and position in monospace font (e.g., "button @ [500, 300]")
     - Three action buttons: Edit (pencil), Highlight (eye), Delete (trash)

4. **Verify Multiple Controls**:
   - If using `msd-test-1.yaml`, should see both `control1` and `control2`
   - Each control has its own card

### Success Criteria
- ✅ Controls displayed in list format
- ✅ Proper icon (`mdi:card-outline`)
- ✅ Monospace font for position info
- ✅ Three action buttons per control
- ✅ Multiple controls displayed correctly

---

## Test 5: Control Actions - Placeholders

### Objective
Verify control action buttons show appropriate placeholder alerts.

### Test Steps

1. **Open Studio** with controls (use `msd-test-1.yaml`)
2. **Navigate to Controls tab**

3. **Test "Add Control" Button**:
   - Click "Add Control" button
   - **Expected**: Alert: "Control form coming in next PR (Phase 3 full implementation)"

4. **Test "Place on Canvas" Button**:
   - Click "Place on Canvas" button
   - **Expected**: Mode changes (toolbar updates)

5. **Test "Edit" Button**:
   - Click pencil icon on a control
   - **Expected**: Alert: "Edit control: [control_id] (coming in next PR)"

6. **Test "Highlight" Button**:
   - Click eye icon on a control
   - **Expected**: Alert: "Highlight control: [control_id] (coming in next PR)"

### Success Criteria
- ✅ All placeholder alerts show appropriate messages
- ✅ Messages are consistent
- ✅ Buttons are clickable and responsive

---

## Test 6: Control Deletion

### Objective
Verify control deletion works with confirmation dialog.

### Test Steps

1. **Open Studio** with controls (use `msd-test-1.yaml`)
2. **Navigate to Controls tab**
3. **Count Initial Controls**: Note number of controls (should be 2: control1, control2)

4. **Delete a Control**:
   - Click delete (trash) icon on `control1`
   - **Expected**: HA confirmation dialog appears
   - **Expected**: Title: "Delete Control"
   - **Expected**: Message: "Delete control "control1"? This may affect lines connected to this control."

5. **Cancel Deletion**:
   - Click "No" or "Cancel"
   - **Expected**: Dialog closes, control still in list

6. **Confirm Deletion**:
   - Click delete icon again
   - Click "Yes" or "Confirm"
   - **Expected**: Dialog closes
   - **Expected**: Control removed from list
   - **Expected**: Control count decreased by 1

7. **Verify Persistence**:
   - Switch to different tab and back to Controls
   - **Expected**: Deleted control still gone
   - Click "Save" in studio
   - Reopen studio
   - **Expected**: Control permanently deleted

### Success Criteria
- ✅ Confirmation dialog appears
- ✅ Proper warning message about lines
- ✅ Cancel works (keeps control)
- ✅ Confirm works (deletes control)
- ✅ Deletion persists in config

---

## Test 7: Controls Help Documentation

### Objective
Verify Controls tab help section displays proper documentation.

### Test Steps

1. **Open Studio**, navigate to Controls tab
2. **Scroll to bottom** (below control list)

3. **Verify Help Message**:
   - **Expected**: Info message titled "About Control Overlays:"
   - **Expected**: Four bullet points:
     1. "Control overlays are HA cards (buttons, entities, custom cards) positioned on your MSD"
     2. "Use anchors or coordinates to position controls"
     3. "Controls can be connected with lines for visual flow"
     4. "Example: Button card at anchor "warp_drive" showing power status"

### Success Criteria
- ✅ Help message is visible
- ✅ All four bullet points present
- ✅ Content is clear and helpful

---

## Test 8: Integration Test - Full Workflow

### Objective
Test complete workflow combining anchor placement and control management.

### Test Steps

1. **Create New MSD Card**:
   ```yaml
   type: custom:lcards-msd-card
   msd:
     base_svg:
       source: builtin:ncc-1701-a-blue
   ```

2. **Open Studio**

3. **Add Anchor from Base SVG Tab**:
   - Stay on "Base SVG" tab
   - Click "Place Anchor" mode
   - Click preview at desired location
   - **Expected**: Anchor dialog appears immediately
   - Name: `control_position`
   - Save anchor

4. **Manually Add Control** (via YAML tab for now):
   - Switch to different tab
   - Save studio
   - Edit card YAML directly:
     ```yaml
     msd:
       overlays:
         - id: my_control
           type: control
           card:
             type: button
             entity: light.living_room
           anchor: control_position
           size: [120, 80]
     ```

5. **Verify in Studio**:
   - Reopen studio
   - Navigate to Controls tab
   - **Expected**: See `my_control` in list
   - **Expected**: Position shows "control_position" (anchor name)

6. **Delete Control**:
   - Click delete on `my_control`
   - Confirm deletion
   - **Expected**: Control removed

7. **Save and Close**:
   - Click "Save" in studio
   - **Expected**: Config saved without errors

### Success Criteria
- ✅ Anchor placement works from any tab
- ✅ Controls display correctly
- ✅ Control deletion works
- ✅ Full workflow completes without errors

---

## Regression Tests

### Test Existing Functionality

1. **Base SVG Tab**:
   - ✅ SVG source selection works
   - ✅ ViewBox configuration works
   - ✅ Filters can be applied

2. **Anchors Tab**:
   - ✅ Anchor list displays correctly
   - ✅ Add Anchor button works
   - ✅ Edit anchor works
   - ✅ Delete anchor works

3. **Other Tabs**:
   - ✅ Lines tab shows placeholder
   - ✅ Channels tab shows placeholder
   - ✅ Debug tab shows placeholder

4. **Mode System**:
   - ✅ View mode works
   - ✅ Place Anchor mode toggles correctly
   - ✅ Place Control mode toggles correctly
   - ✅ Mode toolbar updates properly

---

## Known Issues / Expected Behavior

1. **Control Form Not Implemented**: 
   - "Add Control" button shows placeholder alert
   - This is expected - full implementation comes in next PR

2. **Edit Control Not Implemented**:
   - Edit button shows placeholder alert
   - This is expected - full implementation comes in next PR

3. **Highlight Control Not Implemented**:
   - Highlight button shows placeholder alert
   - This is expected - full implementation comes in next PR

4. **Place Control Mode**:
   - Mode can be activated but doesn't do anything yet
   - This is expected - full implementation comes in next PR

---

## Browser Console Checks

### Expected Log Messages

When opening studio and navigating to Controls tab:
```
[MSDStudio] Opening studio with config: {...}
[MSDStudio] Tab changed to: controls
```

When clicking action buttons:
```
(No log messages - alerts appear directly)
```

### Expected Warnings/Errors

**None** - Implementation should not generate any console errors.

---

## Test Checklist Summary

- [ ] Test 1: Anchor dialog from Base SVG tab ✓
- [ ] Test 1: Anchor dialog from Controls tab ✓
- [ ] Test 1: Anchor dialog from Lines tab ✓
- [ ] Test 2: Live preview renders correctly ✓
- [ ] Test 3: Controls tab empty state ✓
- [ ] Test 4: Controls tab with controls ✓
- [ ] Test 5: Control action placeholders ✓
- [ ] Test 6: Control deletion with confirmation ✓
- [ ] Test 7: Controls help documentation ✓
- [ ] Test 8: Full integration workflow ✓
- [ ] Regression: Other tabs still work ✓
- [ ] No console errors ✓

---

## Troubleshooting

### Issue: Anchor dialog doesn't appear
**Fix**: 
- Check browser console for errors
- Hard refresh (Ctrl+Shift+R)
- Verify `dist/lcards.js` was updated

### Issue: Controls not showing in list
**Verify**:
- Config has `msd.overlays` array
- Overlays have `type: control`
- Each control has an `id` property

### Issue: Delete doesn't work
**Check**:
- Confirmation dialog appears?
- Console errors?
- Try clicking "Yes" or "Confirm" (dialog wording)

---

## Next Steps (Phase 3 Full)

After this PR, the following will be implemented:
- ✨ Control form dialog with card picker
- ✨ Card editor integration
- ✨ Position/size configuration UI
- ✨ Place Control Mode (click to place)
- ✨ Visual bounding boxes in preview
- ✨ Highlight control in preview

---

**Last Updated**: 2026-01-10  
**Version**: Phase 3 Foundation  
**Status**: Ready for Testing ✅
