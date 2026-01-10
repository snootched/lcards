# MSD Graphical Editor Phase 1 - Testing Guide

## Overview

This guide provides comprehensive testing procedures for the MSD Graphical Editor Phase 1 implementation. Phase 1 establishes the foundation: studio dialog shell, live preview, mode system, and enhanced debug visualization.

## Prerequisites

1. **Build the Project**
   ```bash
   cd /path/to/LCARdS
   npm run build
   ```

2. **Copy to Home Assistant**
   ```bash
   cp dist/lcards.js /config/www/community/lcards/
   ```

3. **Clear Browser Cache**
   - Hard refresh: `Ctrl+Shift+R` (Chrome/Firefox) or `Cmd+Shift+R` (Mac)

4. **Sample MSD Config**
   Use the test configuration below or an existing MSD card.

## Test Configuration

### Basic MSD Card Config

```yaml
type: custom:lcards-msd
id: test_msd_card
name: Test MSD Display
msd:
  base_svg:
    builtin: ncc-1701-a
  view_box: [0, 0, 1920, 1200]
  anchors:
    warp_core: [960, 600]
    bridge: [960, 200]
    engineering: [500, 800]
    sickbay: [1400, 800]
  overlays:
    - id: warp_status
      type: control
      position: [100, 100]
      size: [200, 60]
      card:
        type: custom:lcards-button
        entity: sensor.power_status
        name: Warp Core
    - id: bridge_connection
      type: line
      source:
        anchor: bridge
      target:
        overlay: warp_status
        attachment: center
      style:
        stroke: cyan
        stroke_width: 2
```

## Testing Checklist

### 1. Editor Registration & Launch

#### Test 1.1: Editor Opens from HA GUI
**Steps:**
1. Add a new MSD card via HA dashboard editor
2. Click "Show Code Editor" toggle off (visual editor mode)
3. Verify MSD editor appears

**Expected:**
- ✅ LCARdS MSD Editor loads
- ✅ "Configuration" tab is active by default
- ✅ Utility tabs visible (DataSources, Templates, Rules, YAML, etc.)

#### Test 1.2: Editor Opens for Existing Card
**Steps:**
1. Edit existing MSD card
2. Verify editor loads with current config

**Expected:**
- ✅ Editor loads with existing configuration
- ✅ Card metadata summary shows correct values

---

### 2. Main Editor - Configuration Tab

#### Test 2.1: Studio Launcher Card
**Steps:**
1. Navigate to "Configuration" tab
2. Locate studio launcher card at top

**Expected:**
- ✅ Card displays title: "🖼️ MSD Configuration Studio"
- ✅ Description text present and clear
- ✅ "Open Configuration Studio" button visible with icon

#### Test 2.2: Card Metadata Summary
**Steps:**
1. Expand "Card Metadata" section
2. Review displayed information

**Expected:**
- ✅ Base SVG source displayed (builtin key or "Not configured")
- ✅ Anchor count matches config
- ✅ Control overlay count correct
- ✅ Line overlay count correct
- ✅ Icons displayed next to each metric

#### Test 2.3: Card Identification Section
**Steps:**
1. Expand "Card Identification" section
2. Edit ID, name, tags fields

**Expected:**
- ✅ Fields editable
- ✅ Changes reflected in YAML tab
- ✅ HA recognizes changes (config-changed event fires)

---

### 3. Studio Dialog - Launch & Shell

#### Test 3.1: Studio Opens
**Steps:**
1. Click "Open Configuration Studio" button
2. Wait for dialog to render

**Expected:**
- ✅ Full-screen dialog appears (95vw × 90vh)
- ✅ Dialog overlays entire screen with proper z-index
- ✅ Background dimmed (modal overlay)
- ✅ No console errors

#### Test 3.2: Studio Header
**Steps:**
1. Examine studio header

**Expected:**
- ✅ Title: "MSD Configuration Studio" with icon
- ✅ Three action buttons: Reset, Cancel, Save
- ✅ Save button is raised (primary style)
- ✅ Icons present on Reset and Save buttons

#### Test 3.3: Studio Footer
**Steps:**
1. Examine studio footer

**Expected:**
- ✅ Left side: Status indicator (green check + "Ready")
- ✅ Right side: Current mode display
- ✅ Mode label updates when mode changes

---

### 4. Mode System

#### Test 4.1: Mode Toolbar Render
**Steps:**
1. Locate mode toolbar below header

**Expected:**
- ✅ 5 mode buttons displayed horizontally
- ✅ Each button has icon and label
- ✅ Labels: View, Place Anchor, Place Control, Connect Line, Draw Channel
- ✅ View mode active by default (highlighted)

#### Test 4.2: Mode Activation
**Steps:**
1. Click each mode button in sequence
2. Observe visual feedback

**Expected:**
- ✅ Clicked mode becomes active (primary color background)
- ✅ Only one mode active at a time
- ✅ Footer updates to show current mode name
- ✅ Footer icon matches mode icon

#### Test 4.3: Mode Deactivation
**Steps:**
1. Activate a mode (e.g., Place Anchor)
2. Click the same mode button again

**Expected:**
- ✅ Mode deactivates
- ✅ Returns to View mode
- ✅ Footer shows "Mode: View"

#### Test 4.4: Mode Persistence
**Steps:**
1. Activate Place Control mode
2. Switch between tabs
3. Return to original tab

**Expected:**
- ✅ Mode remains active (Place Control)
- ✅ Mode selection persists across tab changes

---

### 5. Split Panel Layout

#### Test 5.1: Panel Proportions
**Steps:**
1. Measure panel widths visually

**Expected:**
- ✅ Config panel: ~60% width
- ✅ Preview panel: ~40% width
- ✅ Vertical divider between panels visible

#### Test 5.2: Panel Content
**Steps:**
1. Examine left panel (config)
2. Examine right panel (preview)

**Expected:**
Config Panel:
- ✅ Tab navigation bar at top
- ✅ Tab content area scrollable
- ✅ Content fills panel height

Preview Panel:
- ✅ Live preview component renders
- ✅ Preview header with title and refresh button
- ✅ Preview footer with info message

#### Test 5.3: Responsive Layout
**Steps:**
1. Resize browser window to <1024px width
2. Observe layout changes

**Expected:**
- ✅ Panels stack vertically on small screens
- ✅ Each panel takes 50% height
- ✅ Layout remains usable

---

### 6. Tab Navigation

#### Test 6.1: Tab Rendering
**Steps:**
1. Count tabs in navigation bar

**Expected:**
- ✅ 6 tabs total: Base SVG, Anchors, Controls, Lines, Channels, Debug
- ✅ Base SVG tab active by default
- ✅ Active tab has visual indicator (primary color underline, 4px thick)

#### Test 6.2: Tab Switching
**Steps:**
1. Click each tab in sequence
2. Verify content changes

**Expected:**
- ✅ Tab content updates immediately
- ✅ Only one tab active at a time
- ✅ Active tab indicator moves correctly
- ✅ No flash of unstyled content

#### Test 6.3: Tab Placeholder Content
**Steps:**
1. Visit each tab
2. Read placeholder messages

**Expected:**
Each tab shows:
- ✅ Large icon (64px, semi-transparent)
- ✅ Tab title as heading
- ✅ Description text explaining future functionality
- ✅ "Coming in Phase X" message

**Specific Tab Content:**
- Base SVG: "Coming in Phase 2"
- Anchors: "Coming in Phase 2"
- Controls: "Coming in Phase 3"
- Lines: "Coming in Phase 4"
- Channels: "Coming in Phase 5"
- Debug: "Coming in Phase 6"

---

### 7. Live Preview Component

#### Test 7.1: Preview Header
**Steps:**
1. Examine preview header

**Expected:**
- ✅ Title: "Live Preview" with eye icon
- ✅ Refresh button (icon-button) on right side
- ✅ Button responds to hover

#### Test 7.2: Preview with Base SVG
**Steps:**
1. Use config with base_svg configured
2. Observe preview content

**Expected:**
- ✅ Actual `<lcards-msd>` element renders
- ✅ Base SVG displays correctly
- ✅ Controls render if configured
- ✅ Lines render if configured
- ✅ No console errors

#### Test 7.3: Preview without Base SVG
**Steps:**
1. Use config without base_svg (or delete msd.base_svg)
2. Observe preview content

**Expected:**
- ✅ Empty state displays
- ✅ Large "image-off" icon shown
- ✅ Message: "No base SVG configured"
- ✅ Helper text: "Configure a base SVG in the 'Base SVG' tab..."

#### Test 7.4: Manual Refresh
**Steps:**
1. Click refresh button
2. Observe behavior

**Expected:**
- ✅ Preview re-renders immediately
- ✅ No delay (debounce bypassed)
- ✅ Console log: "[MSDLivePreview] Preview refreshed (manual)"

#### Test 7.5: Auto-Update (Debounced)
**Steps:**
1. Make config change (e.g., change mode multiple times rapidly)
2. Wait 300ms
3. Observe preview

**Expected:**
- ✅ Preview does NOT update on every change
- ✅ Preview updates once after 300ms debounce
- ✅ Console log: "[MSDLivePreview] Preview updated (debounced)"

#### Test 7.6: Preview Footer
**Steps:**
1. Read preview footer text

**Expected:**
- ✅ Info icon displayed
- ✅ Text: "Preview updates automatically (300ms debounce)"

---

### 8. Config Management

#### Test 8.1: Initial Config Load
**Steps:**
1. Open studio with existing MSD config
2. Verify config loaded

**Expected:**
- ✅ Working config is deep clone of initial config
- ✅ Preview shows current config state
- ✅ Console log: "[MSDStudio] Opened with config: {...}"

#### Test 8.2: Reset Button
**Steps:**
1. Make changes (e.g., switch tabs, modes)
2. Click "Reset" button
3. Observe behavior

**Expected:**
- ✅ Config reverts to initial state
- ✅ Preview updates to show initial config
- ✅ Console log: "[MSDStudio] Resetting to initial config"
- ✅ No changes persisted

#### Test 8.3: Cancel Button
**Steps:**
1. Make changes
2. Click "Cancel" button

**Expected:**
- ✅ Dialog closes immediately
- ✅ No config-changed event fired
- ✅ Changes discarded
- ✅ Main editor unchanged
- ✅ Dialog element removed from DOM

#### Test 8.4: Save Button
**Steps:**
1. Open studio
2. Click "Save" button (even without changes)

**Expected:**
- ✅ config-changed event dispatched
- ✅ Main editor receives updated config
- ✅ HA recognizes config change
- ✅ YAML tab updates
- ✅ Dialog closes
- ✅ Console log: "[MSDStudio] Saving config: {...}"

---

### 9. Debug Settings Integration

#### Test 9.1: Debug Settings Object
**Steps:**
1. Open browser DevTools
2. Select preview `<lcards-msd>` element
3. Inspect its config property

**Expected:**
- ✅ `msd.debug` object exists
- ✅ Contains: `anchors: true`, `bounding_boxes: true`, etc.
- ✅ Settings merged from preview component's debugSettings

#### Test 9.2: Debug Settings Effect
**Steps:**
1. Verify preview renders debug overlays (if MSD supports it)

**Expected:**
- ✅ Debug overlays visible (if base SVG and anchors configured)
- ✅ No errors in console related to debug rendering

---

### 10. Error Handling

#### Test 10.1: Invalid Config
**Steps:**
1. Manually corrupt config in YAML (main editor)
2. Save and open studio

**Expected:**
- ✅ Studio opens without crash
- ✅ Preview may show error state or empty state
- ✅ No unhandled exceptions

#### Test 10.2: Missing HASS
**Steps:**
1. (Difficult to test without HA environment)

**Expected:**
- ✅ Editor handles gracefully
- ✅ No crashes

#### Test 10.3: Console Logs
**Steps:**
1. Open browser console
2. Open/close studio, switch modes/tabs

**Expected:**
- ✅ Only debug-level logs appear (not errors)
- ✅ Logs prefixed with component name (e.g., "[MSDStudio]")
- ✅ Logs provide useful debugging info

---

### 11. Styling & Responsiveness

#### Test 11.1: Theme Consistency
**Steps:**
1. Verify colors match HA theme

**Expected:**
- ✅ Primary color used for active states
- ✅ Background colors match HA theme
- ✅ Text colors legible in both light/dark modes
- ✅ Borders and dividers use `--divider-color`

#### Test 11.2: Mode Button Styling
**Steps:**
1. Hover over mode buttons
2. Click to activate

**Expected:**
- ✅ Hover: border changes to primary color
- ✅ Active: background changes to primary color
- ✅ Active: text color inverts to white
- ✅ Smooth transitions (0.2s)

#### Test 11.3: Tab Button Styling
**Steps:**
1. Hover over tabs
2. Click to activate

**Expected:**
- ✅ Hover: background lightens
- ✅ Active: bottom border thickens to 4px
- ✅ Active: text color changes to primary
- ✅ Inactive border is 3px transparent

#### Test 11.4: Responsive Breakpoints
**Steps:**
1. Resize to various widths: 1920px, 1440px, 1024px, 768px

**Expected:**
- ✅ Layout adapts appropriately
- ✅ Text remains legible
- ✅ Buttons remain clickable
- ✅ No horizontal scrolling

---

### 12. Memory & Performance

#### Test 12.1: Dialog Cleanup
**Steps:**
1. Open studio
2. Close studio (cancel)
3. Inspect DOM

**Expected:**
- ✅ Dialog element removed from document.body
- ✅ No orphaned elements in DOM
- ✅ Event listeners cleaned up (check browser DevTools memory profiler)

#### Test 12.2: Preview Debounce
**Steps:**
1. Rapidly switch modes 10 times
2. Observe preview updates

**Expected:**
- ✅ Preview does NOT update 10 times
- ✅ Preview updates once after 300ms
- ✅ Debounce timer cleared on subsequent changes

#### Test 12.3: Multiple Open/Close Cycles
**Steps:**
1. Open studio, close (10 times)

**Expected:**
- ✅ No memory leaks (check DevTools memory)
- ✅ Performance remains consistent
- ✅ No accumulation of event listeners

---

### 13. Integration with Main Editor

#### Test 13.1: Config Propagation
**Steps:**
1. Make change in studio (future: when editable)
2. Save studio
3. Check main editor

**Expected:**
- ✅ Main editor's config updates
- ✅ YAML tab reflects changes
- ✅ HA persists changes to dashboard

#### Test 13.2: Utility Tabs Accessible
**Steps:**
1. Close studio
2. Navigate to DataSources, Templates, Rules tabs

**Expected:**
- ✅ All utility tabs accessible
- ✅ Tabs function normally
- ✅ No interference from studio

---

### 14. Browser Compatibility

Test in multiple browsers:

#### Test 14.1: Chrome/Edge
**Steps:**
1. Test all features in Chrome/Edge

**Expected:**
- ✅ All features work
- ✅ No console errors

#### Test 14.2: Firefox
**Steps:**
1. Test all features in Firefox

**Expected:**
- ✅ All features work
- ✅ No console errors

#### Test 14.3: Safari (if available)
**Steps:**
1. Test all features in Safari

**Expected:**
- ✅ All features work
- ✅ No console errors

---

## Success Criteria

Phase 1 is considered complete when:

1. ✅ All tests in sections 1-13 pass
2. ✅ No console errors during normal operation
3. ✅ Studio opens and displays correctly
4. ✅ Mode system functional with visual feedback
5. ✅ Tab navigation works smoothly
6. ✅ Live preview renders actual MSD card
7. ✅ Config management (save/cancel/reset) works
8. ✅ Split panel layout renders at 60/40
9. ✅ Placeholder tabs display with Phase indicators
10. ✅ Editor integrates with main editor and HA GUI

## Known Limitations (Phase 1)

- **No functional workflows**: Mode buttons don't trigger actions (coming Phase 2-5)
- **No config editing**: Tabs show placeholders only (coming Phase 2-6)
- **Debug visualization**: Debug renderer methods added but not yet called from preview (coming Phase 6)
- **No anchor/control placement**: Click-to-place deferred to Phase 2-3
- **No line connection**: Connect workflow deferred to Phase 4
- **No channel drawing**: Draw workflow deferred to Phase 5

## Reporting Issues

When reporting issues, include:

1. **Browser & Version**: e.g., Chrome 120.0.6099.129
2. **Home Assistant Version**: e.g., 2024.1.3
3. **Steps to Reproduce**: Exact sequence of actions
4. **Expected Behavior**: What should happen
5. **Actual Behavior**: What actually happened
6. **Console Logs**: Any errors/warnings
7. **Screenshots**: Visual evidence (if applicable)

## Next Phase Preview

**Phase 2** will implement:
- Base SVG configuration (builtin picker, custom path, viewBox)
- Anchor management (list, add, edit, delete, visual placement)
- Click-to-place anchor workflow
- Debug tab with visualization controls

Stay tuned! 🚀
