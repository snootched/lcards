# Chart Configuration Studio - Phase 1 Testing Guide

## Quick Start

This guide helps you test the newly created Chart Configuration Studio in Home Assistant.

---

## Installation

1. **Build the project:**
   ```bash
   cd /path/to/LCARdS
   npm run build
   ```

2. **Copy to Home Assistant:**
   ```bash
   # Option 1: Direct copy (if HA is local)
   cp dist/lcards.js /path/to/homeassistant/www/community/lcards/

   # Option 2: Using scp (if HA is remote)
   scp dist/lcards.js user@ha-host:/config/www/community/lcards/
   ```

3. **Clear browser cache:**
   - Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
   - Or open DevTools (F12) → Network tab → Check "Disable cache"

---

## Testing Checklist

### ✅ Phase 1 Tests

#### 1. Editor Registration
- [ ] **Add chart card to dashboard**
  - Go to Dashboard → Edit → Add Card
  - Search for "Chart" or "lcards-chart"
  - Select "LCARdS Chart Card"
  
- [ ] **Verify editor opens**
  - Click the pencil icon on the chart card
  - Visual editor should open (not just YAML)

#### 2. Chart Editor Interface
- [ ] **Configuration tab visible**
  - Should be the first tab
  - Contains "Chart Configuration Studio" card

- [ ] **Studio launcher present**
  - Large call-to-action card at top
  - Button says "Open Configuration Studio"
  - Icon is `mdi:chart-line`

- [ ] **Card metadata section**
  - Collapsed by default
  - Contains fields: Card ID, Name, Tags

- [ ] **Utility tabs accessible**
  - DataSources tab
  - Templates tab
  - Rules tab
  - Theme tab
  - YAML tab
  - Developer tab
  - Provenance tab

#### 3. Studio Dialog Launch
- [ ] **Click "Open Configuration Studio" button**
  - Full-screen dialog should open
  - Dialog size: 95vw × 90vh (very large)

- [ ] **Dialog header present**
  - Title: "Chart Configuration Studio"
  - Save button (with save icon)
  - Reset button (with restore icon)
  - Cancel button (with close icon)

#### 4. Tab Navigation
- [ ] **All 10 tabs visible**
  1. Data Sources (database icon)
  2. Chart Type (chart-line icon)
  3. Colors (palette icon)
  4. Stroke & Fill (brush icon)
  5. Markers & Grid (scatter-plot icon)
  6. Axes (axis-arrow icon)
  7. Legend & Labels (label icon)
  8. Theme (theme-light-dark icon)
  9. Animation (animation icon)
  10. Advanced (cog icon)

- [ ] **Tab switching works**
  - Click each tab
  - Active tab highlights with bottom border
  - Active tab text changes to primary color

#### 5. Tab Content (Phase 1 Placeholders)
- [ ] **Each tab shows "Coming Soon" message**
  - Hammer-wrench icon
  - Tab name as heading
  - "Coming in Phase X" text
  - Description of future content

#### 6. Live Preview Panel
- [ ] **Preview panel visible** (right side, 40% width)
  - Header: "Live Preview"
  - Refresh button (circular arrow icon)
  - Empty state message (initially)

- [ ] **Preview header elements**
  - Eye icon
  - "Live Preview" text
  - Refresh icon button

- [ ] **Empty state displays correctly**
  - Chart icon
  - "No preview available" message
  - "Configure your chart to see a live preview" helper text

- [ ] **Footer present**
  - Info icon
  - "Preview updates automatically as you edit" text

#### 7. Dialog Buttons
- [ ] **Save button**
  - Click Save
  - Dialog closes
  - No errors in console

- [ ] **Cancel button**
  - Make a change (switch tabs)
  - Click Cancel
  - No confirmation prompt (no changes to config yet)
  - Dialog closes

- [ ] **Reset button**
  - Click Reset
  - Confirmation dialog appears
  - Click OK
  - Config resets (no visible change yet)

#### 8. Split Panel Layout
- [ ] **Desktop view (> 1024px)**
  - Configuration panel: 60% width (left)
  - Preview panel: 40% width (right)
  - Horizontal split

- [ ] **Mobile view (< 1024px)**
  - Configuration panel: full width (top)
  - Preview panel: auto height (bottom)
  - Vertical stack

#### 9. Responsive Behavior
- [ ] **Resize browser window**
  - Layout adapts at 1024px breakpoint
  - No horizontal overflow
  - Tabs scroll if too many

- [ ] **Tab navigation scrolling**
  - If window narrow, tabs scroll horizontally
  - No wrapping

#### 10. Console Checks
- [ ] **No JavaScript errors**
  - Open browser DevTools (F12)
  - Check Console tab
  - Should see debug logs like:
    - `[LCARdSChartEditor] Editor initialized`
    - `[ChartStudio] Opened with config:`
    - `[ChartLivePreview] Component connected`

- [ ] **No 404s in Network tab**
  - All imports load successfully
  - No missing files

---

## Expected Behavior

### ✅ What Should Work

1. **Editor opens** when clicking "Edit" on chart card
2. **Studio launches** when clicking launcher button
3. **Tabs switch** smoothly with visual feedback
4. **Dialog closes** with Save/Cancel/Reset buttons
5. **Preview panel renders** with empty state
6. **No console errors** during normal operation

### ⏭️ What Doesn't Work Yet (Expected)

1. **No actual configuration** - Tabs are placeholders
2. **Preview doesn't update** - No config to preview
3. **No data sources** - Phase 2 feature
4. **No color pickers** - Phase 3 feature
5. **No chart type selector** - Phase 3 feature
6. **Form fields don't exist yet** - Future phases

---

## Troubleshooting

### Issue: Editor doesn't open

**Symptoms:**
- Clicking "Edit" shows only YAML editor
- No visual tabs appear

**Solutions:**
1. Check that `getConfigElement()` is present in `lcards-chart.js`
2. Verify build included the editor files
3. Hard refresh browser (Ctrl+Shift+R)
4. Check browser console for import errors

### Issue: Studio dialog doesn't open

**Symptoms:**
- Clicking launcher button does nothing
- Console shows errors

**Solutions:**
1. Check console for specific error message
2. Verify `lcards-chart-studio-dialog.js` loaded
3. Check that HASS instance is available
4. Verify config is a valid object

### Issue: Tabs not visible

**Symptoms:**
- Dialog opens but tabs are missing
- Only one tab visible

**Solutions:**
1. Check browser width (tabs scroll on narrow screens)
2. Verify all 10 tabs render in DOM
3. Check CSS is loading correctly
4. Try zooming out browser

### Issue: Preview panel blank

**Symptoms:**
- Right panel completely empty
- No preview header

**Solutions:**
1. This is expected in Phase 1 (empty state)
2. Check that `lcards-chart-live-preview` component loaded
3. Verify HASS instance passed correctly

---

## Debug Commands

```javascript
// In browser console:

// Check if editor is registered
console.log(document.createElement('lcards-chart-editor'));

// Check if studio dialog is registered
console.log(document.createElement('lcards-chart-studio-dialog'));

// Check if preview component is registered
console.log(document.createElement('lcards-chart-live-preview'));

// Check LCARdS core
console.log(window.lcards);

// Enable debug logging
window.lcards.setGlobalLogLevel('debug');
```

---

## Manual Test Script

Copy and paste this checklist for systematic testing:

```
CHART CONFIGURATION STUDIO - PHASE 1 TEST RESULTS

Date: _____________
Tester: _____________
HA Version: _____________
Browser: _____________

[ ] 1. Editor Registration
    [ ] Chart card shows "Edit" button
    [ ] Editor opens (not just YAML)

[ ] 2. Editor Interface
    [ ] Configuration tab visible
    [ ] Studio launcher card present
    [ ] Metadata fields visible
    [ ] Utility tabs accessible

[ ] 3. Studio Launch
    [ ] Launcher button works
    [ ] Full-screen dialog opens
    [ ] Header with buttons visible

[ ] 4. Tab Navigation
    [ ] All 10 tabs visible
    [ ] Tab icons correct
    [ ] Tab switching works
    [ ] Active state highlights

[ ] 5. Tab Content
    [ ] All tabs show "Coming Soon"
    [ ] Phase numbers correct
    [ ] Descriptions present

[ ] 6. Preview Panel
    [ ] Panel visible (right side)
    [ ] Header with refresh button
    [ ] Empty state displays
    [ ] Footer message present

[ ] 7. Dialog Buttons
    [ ] Save closes dialog
    [ ] Cancel closes dialog
    [ ] Reset shows confirmation

[ ] 8. Split Layout
    [ ] Desktop: 60/40 split
    [ ] Mobile: stacked vertically

[ ] 9. Responsive
    [ ] Breakpoint at 1024px works
    [ ] Tabs scroll if needed
    [ ] No overflow issues

[ ] 10. Console
    [ ] No JavaScript errors
    [ ] Debug logs present
    [ ] No 404s in Network

NOTES:
_________________________________________________
_________________________________________________
_________________________________________________

ISSUES FOUND:
_________________________________________________
_________________________________________________
_________________________________________________

OVERALL: [ ] PASS  [ ] FAIL  [ ] PARTIAL
```

---

## Success Criteria

Phase 1 is successful if:

✅ All 10 checkpoints pass  
✅ No critical console errors  
✅ Dialog opens and closes cleanly  
✅ Layout is responsive  
✅ "Coming Soon" placeholders visible  

---

## Next Steps After Testing

1. **Report Issues:**
   - File GitHub issues for any bugs
   - Include browser console logs
   - Provide screenshots

2. **Phase 2 Preparation:**
   - Review `CHART_EDITOR_IMPLEMENTATION_PLAN.md`
   - Understand Data Sources tab requirements
   - Prepare for entity/DataSource integration

3. **Provide Feedback:**
   - UX feedback on studio layout
   - Tab organization suggestions
   - Performance observations

---

## Screenshot Checklist

Capture these for documentation:

1. Chart editor with studio launcher
2. Studio dialog at 95vw × 90vh size
3. All 10 tabs visible in navigation
4. "Coming Soon" placeholder (any tab)
5. Live preview empty state
6. Split panel layout (desktop)
7. Stacked layout (mobile)
8. Tab active state highlighting

---

**End of Testing Guide**
