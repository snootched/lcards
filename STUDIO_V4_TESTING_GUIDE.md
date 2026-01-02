# Studio v4 Critical Fixes - Testing Guide

## Overview
This guide provides comprehensive testing procedures for the Studio v4 critical fixes implemented to resolve validation and UI issues.

## Build and Setup

### 1. Build the Project
```bash
cd /home/runner/work/LCARdS/LCARdS
npm run build
```

Expected output: Build should complete successfully with warnings about bundle size (normal).

### 2. Copy to Home Assistant
```bash
cp dist/lcards.js /path/to/homeassistant/www/community/lcards/
```

### 3. Hard Refresh Browser
Press `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac) to clear cache.

---

## Test Cases

### Test Case 1: Manual Mode - Initial Configuration

**Purpose**: Verify that Manual mode initializes properly without validation errors.

**Steps**:
1. Open Home Assistant Lovelace editor
2. Add new card → LCARdS Data Grid
3. In editor, click "Open Studio"
4. Studio v4 should open
5. Select "Manual" mode

**Expected Results**:
- ✅ No immediate validation errors
- ✅ Preview shows empty grid (not error message)
- ✅ Config panel shows "Manual Mode Settings"
- ✅ "Add Row" button is visible
- ✅ No console errors

**Actual Behavior** (to be recorded during testing):
- [ ] Pass / [ ] Fail
- Notes: _______________________________________________

---

### Test Case 2: Manual Mode - Edit Mode Toggle

**Purpose**: Verify edit mode toggle works correctly.

**Steps**:
1. Continue from Test Case 1 (Manual mode selected)
2. In preview panel header, click "Switch to Edit Mode" button
3. Observe the preview panel

**Expected Results**:
- ✅ Button changes to "Preview Mode"
- ✅ Blue info banner appears: "WYSIWYG Mode: Click cells to edit..."
- ✅ Grid cells become clickable (cursor: pointer)
- ✅ No validation errors appear

**Actual Behavior**:
- [ ] Pass / [ ] Fail
- Notes: _______________________________________________

---

### Test Case 3: Manual Mode - Add Row

**Purpose**: Verify row can be added in Manual mode.

**Steps**:
1. Continue from Test Case 2 (in Manual mode)
2. In config panel, click "Add Row" button
3. Check preview and config panel

**Expected Results**:
- ✅ Row appears in rows list
- ✅ Preview updates to show new row
- ✅ No errors in console
- ✅ Config shows rows array with empty values

**Actual Behavior**:
- [ ] Pass / [ ] Fail
- Notes: _______________________________________________

---

### Test Case 4: Data Table Mode - Initial Selection

**Purpose**: Verify Data Table mode initializes with correct layout enum.

**Steps**:
1. Open Studio v4 for new Data Grid card
2. Select "Data Table" mode
3. Observe the configuration panel

**Expected Results**:
- ✅ No immediate validation errors
- ✅ Layout selector shows "Spreadsheet" and "Timeline" options (NOT "column-based" or "row-timeline")
- ✅ Default selection is "Spreadsheet"
- ✅ Preview shows empty grid (not error)
- ✅ No console errors about "Unknown layout"

**Actual Behavior**:
- [ ] Pass / [ ] Fail
- Notes: _______________________________________________

---

### Test Case 5: Data Table - Add Column

**Purpose**: Verify column can be added in spreadsheet layout.

**Steps**:
1. Continue from Test Case 4 (Data Table mode, Spreadsheet layout)
2. Scroll to "Columns" section
3. Click "Add Column" button
4. Verify column appears in list

**Expected Results**:
- ✅ Column appears in list with "Column 1" header
- ✅ Preview updates to show column
- ✅ Config shows columns array with proper structure

**Actual Behavior**:
- [ ] Pass / [ ] Fail
- Notes: _______________________________________________

---

### Test Case 6: Data Table - Edit Column

**Purpose**: Verify column editor overlay works.

**Steps**:
1. Continue from Test Case 5 (column added)
2. Click the pencil icon next to the column
3. Overlay should appear

**Expected Results**:
- ✅ Modal overlay appears with form
- ✅ Overlay shows "Edit Column 1" title
- ✅ Form fields present:
  - Column Header (text input)
  - Width (number input)
  - Alignment (dropdown: Left/Center/Right)
- ✅ "Cancel" and "Save" buttons present
- ✅ Clicking backdrop closes overlay
- ✅ Changing values and clicking Save updates config

**Actual Behavior**:
- [ ] Pass / [ ] Fail
- Notes: _______________________________________________

---

### Test Case 7: Data Table - Timeline Layout Switch

**Purpose**: Verify switching to Timeline layout works correctly.

**Steps**:
1. In Data Table mode (Spreadsheet layout)
2. In "Layout Type" dropdown, select "Timeline"
3. Observe configuration panel changes

**Expected Results**:
- ✅ Layout changes to "Timeline"
- ✅ "Columns" section disappears
- ✅ "Timeline Rows" section appears
- ✅ Info message: "Rows automatically populate with historical values..."
- ✅ "Add Timeline Row" button visible
- ✅ No console errors

**Actual Behavior**:
- [ ] Pass / [ ] Fail
- Notes: _______________________________________________

---

### Test Case 8: Data Table Timeline - Add Row

**Purpose**: Verify timeline row can be added.

**Steps**:
1. Continue from Test Case 7 (Timeline layout)
2. Click "Add Timeline Row" button
3. Verify row appears

**Expected Results**:
- ✅ Row appears in list
- ✅ Row shows icon, label, and edit/delete buttons
- ✅ Default label is "Row 1"
- ✅ Config shows rows array with timeline structure

**Actual Behavior**:
- [ ] Pass / [ ] Fail
- Notes: _______________________________________________

---

### Test Case 9: Data Table Timeline - Edit Row

**Purpose**: Verify timeline row editor overlay works.

**Steps**:
1. Continue from Test Case 8 (timeline row added)
2. Click the pencil icon next to the row
3. Overlay should appear

**Expected Results**:
- ✅ Modal overlay appears with form
- ✅ Overlay shows "Edit Timeline Row 1" title
- ✅ Form fields present:
  - Entity or DataSource (entity picker)
  - Label (text input)
  - Format Template (text input with helper)
  - History Hours (number input, min=1, max=24)
- ✅ "Cancel" and "Save" buttons present
- ✅ Clicking backdrop closes overlay
- ✅ Changing values and clicking Save updates config

**Actual Behavior**:
- [ ] Pass / [ ] Fail
- Notes: _______________________________________________

---

### Test Case 10: Advanced Tab - Style Hierarchy Diagram

**Purpose**: Verify style hierarchy diagram renders as SVG.

**Steps**:
1. In Studio v4, click "Advanced" tab
2. Click "Styling" sub-tab
3. Observe "Style Hierarchy" section

**Expected Results**:
- ✅ SVG diagram is visible (NOT plain text)
- ✅ Diagram shows boxes connected by arrows
- ✅ Boxes are labeled (Grid-wide, Row, Cell, etc.)
- ✅ "Lowest Priority" and "Highest Priority" labels visible
- ✅ Help text below diagram explains precedence
- ✅ Diagram adapts to current mode (shows Header/Column only in Data Table mode)

**Actual Behavior**:
- [ ] Pass / [ ] Fail
- Notes: _______________________________________________

---

### Test Case 11: Advanced Tab - Cascade Animation Colors

**Purpose**: Verify cascade animation color pickers are present.

**Steps**:
1. In Studio v4 Advanced tab, click "Animation" sub-tab
2. In "Cascade Animation" section, select "Cascade" type
3. Observe the form

**Expected Results**:
- ✅ "Pattern" dropdown appears (Default, Niagara, Fast, Frozen)
- ✅ "Speed Multiplier" input appears
- ✅ **"Cascade Colors" section appears** with color pickers
- ✅ Three color pickers present:
  - Start Color (with helper: "Starting color (75% dwell)")
  - Middle Color (with helper: "Middle color (10% snap)")
  - End Color (with helper: "Ending color (10% brief)")
- ✅ Color pickers use `lcards-color-section` component
- ✅ Color pickers support theme tokens and CSS variables

**Actual Behavior**:
- [ ] Pass / [ ] Fail
- Notes: _______________________________________________

---

### Test Case 12: Validation - Edit Mode Suppression

**Purpose**: Verify validation errors are suppressed in edit mode.

**Steps**:
1. Open Studio v4 in Manual mode
2. Toggle to Edit Mode
3. Don't add any rows yet
4. Observe validation messages

**Expected Results**:
- ✅ No validation errors shown in edit mode
- ✅ No red error messages appear
- ✅ User can freely configure without error blocking

**Actual Behavior**:
- [ ] Pass / [ ] Fail
- Notes: _______________________________________________

---

### Test Case 13: Validation - Save with Incomplete Config

**Purpose**: Verify validation errors appear on save attempt.

**Steps**:
1. Continue from Test Case 12 (Edit mode, no rows)
2. Toggle back to Preview Mode
3. Click "Save Configuration" button
4. Observe validation

**Expected Results**:
- ✅ Validation errors now appear
- ✅ Config is not saved
- ✅ Error message is helpful (e.g., "Manual mode: At least one row is required")

**Actual Behavior**:
- [ ] Pass / [ ] Fail
- Notes: _______________________________________________

---

### Test Case 14: Console Error Check

**Purpose**: Verify no console errors or warnings appear.

**Steps**:
1. Open browser DevTools (F12)
2. Go through Test Cases 1-13
3. Monitor console for errors

**Expected Results**:
- ✅ No errors about "Unknown layout: row-timeline"
- ✅ No errors about "Unknown layout: column-based"
- ✅ No errors about "Template mode requires rows array" (on initial load)
- ✅ No errors about invalid enum values
- ✅ Only expected warnings (if any)

**Actual Behavior**:
- [ ] Pass / [ ] Fail
- Notes: _______________________________________________

---

### Test Case 15: Config Conversion - Save and Load

**Purpose**: Verify config is properly converted between Studio v4 and card.

**Steps**:
1. Configure a Manual mode card in Studio v4
2. Save configuration
3. Check saved YAML in editor
4. Reload the editor
5. Open Studio v4 again

**Expected Results**:
- ✅ Saved YAML uses `data_mode: 'template'` (NOT 'manual')
- ✅ When reopened, Studio v4 correctly shows "Manual" mode
- ✅ All settings are preserved
- ✅ Preview works correctly

**Actual Behavior**:
- [ ] Pass / [ ] Fail
- Notes: _______________________________________________

---

## Regression Tests

### Regression 1: Decorative Mode Still Works

**Steps**:
1. Open Studio v4
2. Select "Decorative" mode
3. Configure settings
4. Save

**Expected Results**:
- ✅ Decorative mode works as before
- ✅ Format selector works
- ✅ Refresh interval works
- ✅ Preview shows random data

**Actual Behavior**:
- [ ] Pass / [ ] Fail

---

### Regression 2: WYSIWYG Cell Editing Still Works

**Steps**:
1. Open Studio v4 in Manual mode
2. Add a row
3. Toggle to Edit Mode
4. Click a cell in preview

**Expected Results**:
- ✅ Cell editor overlay appears (existing functionality)
- ✅ Can edit cell value
- ✅ Changes save correctly

**Actual Behavior**:
- [ ] Pass / [ ] Fail

---

## Success Criteria

All tests must pass with the following outcomes:

- [x] Build completes without errors
- [ ] All 15 test cases pass
- [ ] Both regression tests pass
- [ ] No new console errors introduced
- [ ] Performance is acceptable (Studio opens in < 2 seconds)

---

## Known Issues (Expected)

None at this time. All critical issues from the problem statement should be resolved.

---

## Issue Resolution Mapping

| Issue # | Problem | Fix Applied | Test Case |
|---------|---------|-------------|-----------|
| 1 | Manual mode "Template mode requires rows array" | Initialize empty rows on mode selection | TC 1, 2 |
| 2 | WYSIWYG error blocking UI | Suppress validation in edit mode | TC 2, 12 |
| 3 | Data Table "Timeline mode requires source" | Initialize spreadsheet layout by default | TC 4 |
| 4 | Layout field validation error | Replace 'column-based'/'row-timeline' with 'spreadsheet'/'timeline' | TC 4, 7 |
| 5 | Console warning "Unknown layout: row-timeline" | Use correct enum values throughout | TC 14 |
| 6 | Edit Timeline Row button does nothing | Implement timeline row editor overlay | TC 9 |
| 7 | Add Column issues | Ensure column editor overlay works | TC 6 |
| 8 | Visual hierarchy diagram not implemented | Create SVG component | TC 10 |
| 9 | Animation color pickers missing | Add lcards-color-section for cascade colors | TC 11 |

---

## Testing Notes

**Date**: _______________
**Tester**: _______________
**Environment**: Home Assistant version _______________
**Browser**: _______________

**Overall Results**:
- Total Tests: 15 + 2 regression = 17
- Passed: _______
- Failed: _______
- Blocked: _______

**Additional Comments**:
________________________________________________________________
________________________________________________________________
________________________________________________________________

---

## Developer Notes

### Changes Made

1. **connectedCallback()**: Added initialization logic for Manual and Data Table modes
2. **_handleModeChange()**: Added mode-specific initialization
3. **_handleLayoutChange()**: New method to handle layout changes with proper config initialization
4. **_validateConfig()**: Updated to suppress validation in edit mode and use correct layout names
5. **_renderDataTableModeConfig()**: Updated to use 'spreadsheet' and 'timeline' values
6. **_renderStylingSubTab()**: Integrated lcards-style-hierarchy-diagram component
7. **_renderAnimationSubTab()**: Added lcards-color-section for cascade animation colors
8. **_editColumn()**: Implemented to set _activeOverlay
9. **_editTimelineRow()**: Implemented to set _activeOverlay
10. **_renderOverlay()**: New method to render active overlay
11. **_renderTimelineRowEditorOverlay()**: New overlay rendering method
12. **_renderColumnEditorOverlay()**: New overlay rendering method
13. **_saveTimelineRow()**, **_saveColumn()**, **_closeOverlay()**: New overlay handlers
14. **lcards-style-hierarchy-diagram.js**: New SVG diagram component

### Files Modified

- `src/editor/dialogs/lcards-data-grid-studio-dialog-v4.js` (main fixes)
- `src/editor/components/shared/lcards-style-hierarchy-diagram.js` (new component)

### Build Status

✅ Build successful
✅ No TypeScript/JavaScript errors
✅ Bundle size within acceptable limits (2.87 MiB - expected for LCARdS)
