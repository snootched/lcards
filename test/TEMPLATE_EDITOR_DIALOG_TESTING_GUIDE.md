# Template Editor Dialog Testing Guide

## Overview
This guide provides comprehensive testing instructions for the new Template Editor Dialog in the data-grid card.

## Prerequisites
1. Home Assistant installation
2. LCARdS custom card installed
3. Fresh build of `lcards.js` in `www/community/lcards/`

## Build Instructions
```bash
cd /home/runner/work/LCARdS/LCARdS
npm run build
# Copy dist/lcards.js to Home Assistant www/community/lcards/
```

## Test Configuration
Use the provided `test-data-grid-template-editor.yaml` file or create a new data-grid card with:
```yaml
type: custom:lcards-data-grid
data_mode: template
```

---

## Test Cases

### Test 1: Dialog Opens
**Objective:** Verify the template editor dialog opens correctly.

**Steps:**
1. Add test card to dashboard
2. Click card menu → "Edit"
3. Navigate to "Data Mode" tab
4. Verify data_mode is set to "template"
5. Click "Configure Template Rows" button

**Expected:**
- Dialog opens in modal overlay
- Dialog has title "Configure Template Rows"
- "Add Row" button is visible
- "Save" and "Cancel" buttons visible at bottom
- If no rows exist, should show one default row with 3 empty cells

**Pass Criteria:** ✅ Dialog opens without console errors

---

### Test 2: Add Row
**Objective:** Verify new rows can be added.

**Steps:**
1. Open template editor dialog
2. Click "Add Row" button
3. Observe new row appears

**Expected:**
- New row added to end of list
- Row is expanded by default
- Row has 3 empty cells by default
- Row header shows "Row N: [, , ]" (empty preview)

**Pass Criteria:** ✅ Row added successfully, no errors

---

### Test 3: Edit Cell Values
**Objective:** Verify cell values can be edited.

**Steps:**
1. Open template editor dialog
2. Expand a row (click row header)
3. Type "Room" in Cell 1 input
4. Type "Temperature" in Cell 2 input
5. Type "Status" in Cell 3 input

**Expected:**
- Text appears in input fields as typed
- Row header preview updates: "Row 1: [Room, Temperature, Status]"
- No validation errors

**Pass Criteria:** ✅ Cell values update correctly

---

### Test 4: Entity Picker
**Objective:** Verify entity picker inserts templates correctly.

**Steps:**
1. Open template editor dialog
2. Expand a row
3. Click the Home Assistant icon button next to Cell 2
4. Entity picker overlay appears
5. Type "sensor.temp" to filter
6. Select "sensor.temperature" (or similar entity)
7. Click "Insert Template"

**Expected:**
- Entity picker overlay appears
- Entity can be selected from list
- After clicking "Insert Template", cell value becomes: `{{states.sensor.temperature.state}}`
- Overlay closes
- Cell input shows the template string

**Pass Criteria:** ✅ Template inserted correctly

---

### Test 5: Delete Cell
**Objective:** Verify cells can be removed.

**Steps:**
1. Open template editor dialog
2. Expand row with 3 cells
3. Click X button on Cell 3
4. Observe cell is removed

**Expected:**
- Cell 3 removed from row
- Row now has 2 cells
- Cell 2 remains unchanged
- Row preview updates to show only 2 cells

**Pass Criteria:** ✅ Cell removed successfully

---

### Test 6: Add Cell
**Objective:** Verify cells can be added to a row.

**Steps:**
1. Open template editor dialog
2. Expand a row
3. Click "Add Cell" button below cells
4. Observe new empty cell added

**Expected:**
- New cell added at end of row
- Cell has empty text input
- Cell has entity picker and delete buttons

**Pass Criteria:** ✅ Cell added successfully

---

### Test 7: Row Style Overrides
**Objective:** Verify row-level styling works.

**Steps:**
1. Open template editor dialog
2. Expand a row
3. Expand "Row Style Overrides" section
4. Set background to: `var(--lcars-blue)`
5. Set text color to: `var(--lcars-moonlight)`
6. Set font weight to: `700`
7. Set padding to: `12px`

**Expected:**
- Color pickers show for background and text color
- Number input for font weight accepts values
- Text input for padding accepts CSS values
- No validation errors

**Pass Criteria:** ✅ Style fields accept input

---

### Test 8: Cell Style Overrides
**Objective:** Verify cell-level styling works.

**Steps:**
1. Open template editor dialog
2. Expand a row with at least 2 cells
3. Expand "Cell Style Overrides" section
4. Toggle "Override" switch ON for Cell 1
5. Set Cell 1 color to: `var(--lcars-red)`
6. Set Cell 1 font weight to: `700`
7. Leave Cell 2 override OFF

**Expected:**
- Cell 1 card shows style fields when switch is ON
- Cell 2 card shows "Using row/grid defaults" when switch is OFF
- Style fields accept input
- No validation errors

**Pass Criteria:** ✅ Cell styles toggle and accept input

---

### Test 9: Delete Row
**Objective:** Verify rows can be deleted.

**Steps:**
1. Open template editor dialog
2. Create row with some cell content: "Test", "Data", "Here"
3. Click trash icon on row header
4. Confirm deletion in prompt

**Expected:**
- Confirmation prompt appears: "This row has content. Are you sure?"
- After confirming, row is removed
- Remaining rows renumbered correctly
- No console errors

**Pass Criteria:** ✅ Row deleted after confirmation

---

### Test 10: Delete Empty Row
**Objective:** Verify empty rows can be deleted without confirmation.

**Steps:**
1. Open template editor dialog
2. Add new empty row
3. Click trash icon on empty row

**Expected:**
- No confirmation prompt
- Row deleted immediately

**Pass Criteria:** ✅ Empty row deleted without prompt

---

### Test 11: Reorder Rows (Move Up)
**Objective:** Verify rows can be moved up.

**Steps:**
1. Open template editor dialog
2. Create 3 rows with distinct content:
   - Row 1: [A, B, C]
   - Row 2: [D, E, F]
   - Row 3: [G, H, I]
3. Click up arrow on Row 2
4. Observe order changes

**Expected:**
- Row 2 moves to Row 1 position
- Old Row 1 becomes Row 2
- Row 3 remains Row 3
- Up arrow on Row 1 is disabled

**Pass Criteria:** ✅ Row moved up correctly

---

### Test 12: Reorder Rows (Move Down)
**Objective:** Verify rows can be moved down.

**Steps:**
1. Open template editor dialog with 3 rows
2. Click down arrow on Row 1
3. Observe order changes

**Expected:**
- Row 1 moves to Row 2 position
- Old Row 2 becomes Row 1
- Row 3 remains Row 3
- Down arrow on last row is disabled

**Pass Criteria:** ✅ Row moved down correctly

---

### Test 13: Collapse/Expand Rows
**Objective:** Verify rows can be collapsed and expanded.

**Steps:**
1. Open template editor dialog
2. Click row header to collapse expanded row
3. Observe row content hidden
4. Click header again to expand

**Expected:**
- Clicking collapsed row header expands it
- Clicking expanded row header collapses it
- Chevron icon rotates (right → down)
- Cell editing and style sections only visible when expanded

**Pass Criteria:** ✅ Rows collapse/expand correctly

---

### Test 14: Save Changes
**Objective:** Verify save button persists changes to config.

**Steps:**
1. Open template editor dialog
2. Add row with values: ["System", "CPU", "OK"]
3. Set row style background: `var(--lcars-dark-blue)`
4. Toggle cell style for Cell 3
5. Set Cell 3 color: `var(--lcars-red)`
6. Click "Save" button

**Expected:**
- Dialog closes
- Template rows summary shows "1 row(s) configured"
- Switch to YAML tab
- Verify structure:
  ```yaml
  rows:
    - values: ['System', 'CPU', 'OK']
      style:
        background: var(--lcars-dark-blue)
      cellStyles:
        - null
        - null
        - color: var(--lcars-red)
  ```

**Pass Criteria:** ✅ Changes saved to config correctly

---

### Test 15: Cancel Changes
**Objective:** Verify cancel button discards changes.

**Steps:**
1. Open template editor dialog
2. Add 2 new rows
3. Edit cell values
4. Click "Cancel" button

**Expected:**
- Dialog closes
- No changes saved to config
- YAML tab shows original configuration

**Pass Criteria:** ✅ Changes discarded

---

### Test 16: Simple Array Format Conversion
**Objective:** Verify simple arrays convert to/from full objects.

**Steps:**
1. Create card with simple array rows in YAML:
   ```yaml
   rows:
     - ['A', 'B', 'C']
     - ['D', 'E', 'F']
   ```
2. Open template editor dialog
3. Observe rows load correctly
4. Don't add any styles
5. Save

**Expected:**
- Rows load with values from arrays
- After save (with no styles), YAML remains simple arrays
- No unnecessary style/cellStyles properties added

**Pass Criteria:** ✅ Simple format preserved when no styles

---

### Test 17: Full Object Format
**Objective:** Verify full object format is preserved when styles present.

**Steps:**
1. Open template editor dialog
2. Add row: ["Test", "Data", "Here"]
3. Add row style: background = `rgba(0,0,0,0.5)`
4. Save

**Expected:**
- YAML shows full object format:
  ```yaml
  rows:
    - values: ['Test', 'Data', 'Here']
      style:
        background: rgba(0,0,0,0.5)
  ```

**Pass Criteria:** ✅ Full object format used when styles present

---

### Test 18: Mixed Format Rows
**Objective:** Verify mixed simple/object formats work together.

**Steps:**
1. Create config with mixed formats:
   ```yaml
   rows:
     - ['Simple', 'Array', 'Row']
     - values: ['Object', 'Format', 'Row']
       style:
         font_weight: 700
   ```
2. Open template editor dialog
3. Edit both rows
4. Save

**Expected:**
- Both rows load correctly
- Simple row remains simple if no styles added
- Object row preserves object format

**Pass Criteria:** ✅ Mixed formats handled correctly

---

### Test 19: Entity Template Variations
**Objective:** Verify different template syntaxes are preserved.

**Steps:**
1. Open template editor dialog
2. Manually type templates in cells:
   - Cell 1: `{{states.sensor.temp.state}}`
   - Cell 2: `{{states.sensor.temp.state}}°C`
   - Cell 3: `{% if is_state('sensor.temp', 'on') %}ON{% else %}OFF{% endif %}`
3. Save and verify YAML

**Expected:**
- All template syntaxes preserved exactly
- Jinja2 logic blocks preserved
- No template evaluation in editor

**Pass Criteria:** ✅ Templates preserved as-is

---

### Test 20: Large Grid Performance
**Objective:** Verify dialog handles many rows efficiently.

**Steps:**
1. Open template editor dialog
2. Add 20 rows
3. Expand/collapse several rows
4. Edit various cells
5. Save

**Expected:**
- Dialog remains responsive
- No lag when expanding/collapsing
- Save completes quickly
- No console errors

**Pass Criteria:** ✅ Performance acceptable with many rows

---

## Console Error Check

Throughout all tests, monitor browser console for errors:
- Open DevTools (F12)
- Check Console tab
- No red error messages should appear
- Yellow warnings are acceptable (HA framework warnings)

## Known Limitations

1. **Entity picker styling:** Basic modal overlay (not full HA dialog pattern)
2. **No drag-and-drop:** Rows reorder with up/down buttons only
3. **No live preview:** Preview added in future enhancement
4. **No template validation:** Syntax errors caught at runtime, not in editor

## Reporting Issues

If tests fail, report with:
1. Test case number
2. Steps taken
3. Expected vs actual behavior
4. Console errors (if any)
5. Browser and HA version
6. Screenshot (if applicable)

---

## Success Criteria

✅ **All 20 test cases pass**
✅ **No console errors during normal operation**
✅ **YAML output matches expected structure**
✅ **Changes persist after save and reopen**
✅ **Dialog responsive and performant**

## Next Steps After Testing

1. Run `code_review` tool for automated code review
2. Address any issues found
3. Create documentation for users
4. Add to CHANGELOG.md
5. Merge to main branch
