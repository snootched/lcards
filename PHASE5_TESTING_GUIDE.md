# Phase 5: Channels Tab + Line Editor Schema Fix - Testing Guide

## Overview
This guide provides step-by-step instructions for testing Phase 5 implementation, which includes:
1. **Line Editor Schema Fix** - Corrects line overlays to use the official MSD schema
2. **Channels Tab** - Full CRUD interface for routing channel management

---

## Prerequisites

### Installation
```bash
# 1. Copy built file to Home Assistant
cp dist/lcards.js /config/www/community/lcards/

# 2. Clear browser cache (Ctrl+Shift+R in most browsers)

# 3. Open Home Assistant Lovelace dashboard
```

### Test Configuration
Create a test MSD card in your Lovelace dashboard:

```yaml
type: custom:lcards-msd
msd:
  base_svg:
    builtin: engineering
  anchors:
    cpu_core: [200, 150]
    memory: [600, 150]
    storage: [400, 400]
  overlays:
    - type: control
      id: cpu_button
      position: [100, 100]
      size: [150, 80]
      card:
        type: custom:lcards-button
        entity: sensor.cpu_temp
    - type: control
      id: memory_button
      position: [500, 100]
      size: [150, 80]
      card:
        type: custom:lcards-button
        entity: sensor.memory_usage
```

---

## Part 1: Line Editor Schema Testing

### Test 1.1: Open Existing Line
**Goal**: Verify existing lines load correctly with new schema

1. Open MSD Studio (click Edit on MSD card)
2. Navigate to **Lines** tab
3. If you have existing lines, click **Edit** on one
4. **Verify**:
   - ✅ Line ID displays correctly
   - ✅ Anchor/Attach To fields show correct values
   - ✅ Anchor Side/Attach Side fields appear only if connecting to overlays
   - ✅ Gap values display correctly
   - ✅ Routing mode shows in dropdown (not as object)
   - ✅ Style tab shows color, width, dash_array fields

**Screenshot Location**: Take screenshot of line form showing all fields

---

### Test 1.2: Create New Line Between Anchors
**Goal**: Verify line creation uses correct schema

1. Open MSD Studio → **Lines** tab
2. Click **Add Line**
3. Set:
   - **Line ID**: `test_anchor_line`
   - **Anchor**: `cpu_core`
   - **Attach To**: `memory`
   - **Route**: `manhattan`
4. Go to **Style** tab:
   - **Color**: `var(--lcars-orange)`
   - **Width**: `3`
   - **Dash Array**: `5,5`
5. Click **Save**
6. **Verify**:
   - ✅ Line appears in preview
   - ✅ Line uses manhattan routing (right angles)
   - ✅ Line is orange with dashed pattern
7. Save MSD card and check YAML:
   ```yaml
   overlays:
     - type: line
       id: test_anchor_line
       anchor: cpu_core
       attach_to: memory
       route: manhattan
       style:
         color: var(--lcars-orange)
         width: 3
         dash_array: "5,5"
   ```

**Expected**: No `source`, `target`, `routing.mode`, or `stroke` properties in YAML

---

### Test 1.3: Create Line Between Overlays
**Goal**: Verify overlay attachment with sides and gaps

1. Open MSD Studio → **Lines** tab
2. Click **Add Line**
3. Set:
   - **Line ID**: `test_overlay_line`
   - **Anchor**: `cpu_button` (overlay)
   - **Anchor Side**: `right`
   - **Anchor Gap**: `10`
   - **Attach To**: `memory_button` (overlay)
   - **Attach Side**: `left`
   - **Attach Gap**: `10`
   - **Route**: `auto`
4. Click **Save**
5. **Verify**:
   - ✅ Line starts from right side of cpu_button
   - ✅ Line ends at left side of memory_button
   - ✅ Gaps visible between line and overlay edges
6. Edit the line and verify:
   - ✅ All fields populate correctly
   - ✅ Anchor Side and Attach Side show only for overlays

**Screenshot Location**: Take screenshot showing line with gaps and attachment points

---

### Test 1.4: Connect Line Mode
**Goal**: Verify interactive line creation

1. Open MSD Studio → **Lines** tab
2. Click **Enter Connect Mode** button (or use mode toolbar)
3. Click on `cpu_core` anchor in preview
4. Click on `storage` anchor in preview
5. **Verify**:
   - ✅ Line form opens with pre-filled anchor and attach_to
   - ✅ Can edit line properties before saving
   - ✅ Line uses correct schema when saved

---

### Test 1.5: Style Properties
**Goal**: Verify all style properties work

1. Create a new line
2. Style tab settings:
   - **Color**: `#FF0000`
   - **Width**: `5`
   - **Dash Array**: `10,5,2,5` (dash-dot pattern)
   - **End Marker**: `arrow`
3. **Verify**:
   - ✅ Line is red
   - ✅ Line is thick (5px)
   - ✅ Line has dash-dot pattern
   - ✅ Arrow appears at end of line

---

## Part 2: Channels Tab Testing

### Test 2.1: Add Bundling Channel
**Goal**: Verify channel creation and visualization

1. Open MSD Studio → **Channels** tab
2. Click **Add Channel**
3. Set:
   - **Channel ID**: `power_corridor`
   - **Channel Type**: `Bundling (lines prefer)`
   - **Bounds**:
     - X: `300`
     - Y: `200`
     - Width: `200`
     - Height: `100`
   - **Priority**: `10`
   - **Visualization Color**: `#00FF00` (green)
4. Click **Add**
5. **Verify**:
   - ✅ Channel appears in channel list
   - ✅ Channel shows green color indicator
   - ✅ Channel bounds display correctly: `[300, 200] 200×100`
   - ✅ Channel type shows as "Bundling"
   - ✅ Green rectangle appears in preview with dashed border
   - ✅ Channel label shows in preview: "power_corridor (bundling)"

**Screenshot Location**: Take screenshot of channel list and preview showing channel

---

### Test 2.2: Draw Channel Mode
**Goal**: Verify visual channel drawing

1. Navigate to **Channels** tab
2. Click **Draw on Canvas**
3. Notice cursor changes to crosshair
4. Click first point in preview (e.g., 100, 100)
5. Click second point (e.g., 400, 300)
6. **Verify**:
   - ✅ Channel form opens with pre-filled bounds
   - ✅ Bounds calculated correctly: `[100, 100] 300×200`
   - ✅ Can edit channel properties
   - ✅ Mode returns to View after creation

**Screenshot Location**: Take screenshot showing crosshair cursor and channel form

---

### Test 2.3: Edit Channel
**Goal**: Verify channel editing

1. In channel list, click **Edit** (pencil icon) on a channel
2. Modify:
   - **Channel Type**: Change to `Avoiding (lines avoid)`
   - **Priority**: Change to `50`
   - **Color**: Change to `#FF0000` (red)
3. Click **Save**
4. **Verify**:
   - ✅ Channel updates in list
   - ✅ Color indicator changes to red
   - ✅ Type label changes to "Avoiding"
   - ✅ Preview updates to show red channel
   - ✅ ID field is disabled (cannot change ID when editing)

---

### Test 2.4: Highlight Channel
**Goal**: Verify channel highlight feature

1. Click **Eye** icon on a channel
2. **Verify**:
   - ✅ Channel highlights in preview (visible effect for 2 seconds)
   - ✅ Highlight automatically clears after 2 seconds

---

### Test 2.5: Delete Channel
**Goal**: Verify channel deletion

1. Click **Delete** (trash icon) on a channel
2. Confirm deletion dialog
3. **Verify**:
   - ✅ Confirmation dialog appears with warning message
   - ✅ Channel removes from list after confirmation
   - ✅ Channel removes from preview
   - ✅ Config updates correctly

---

### Test 2.6: Multiple Channel Types
**Goal**: Verify different channel types display correctly

1. Create three channels:
   - **bundling_1**: Type=Bundling, Color=#00FF00 (green)
   - **avoiding_1**: Type=Avoiding, Color=#FF0000 (red)
   - **waypoint_1**: Type=Waypoint, Color=#0000FF (blue)
2. **Verify**:
   - ✅ Each channel has correct color border
   - ✅ Channel backgrounds are semi-transparent (color + 22 opacity)
   - ✅ Type labels show correctly in list
   - ✅ All three channels visible in preview simultaneously

**Screenshot Location**: Take screenshot showing all three channel types

---

### Test 2.7: Channel Priority
**Goal**: Verify priority setting

1. Create channel with Priority = 1
2. Create channel with Priority = 100
3. Edit channel to change priority to 50
4. **Verify**:
   - ✅ Priority slider works (1-100 range)
   - ✅ Priority values save correctly
   - ✅ Helper text explains: "Higher priority = stronger influence on routing"

---

### Test 2.8: Channel Bounds Validation
**Goal**: Verify bounds input

1. Create channel with bounds: `[0, 0, 50, 50]`
2. Create channel with bounds: `[800, 600, 100, 100]`
3. **Verify**:
   - ✅ All numeric inputs accept positive values
   - ✅ Bounds display in preview at correct coordinates
   - ✅ Width and height apply correctly

---

### Test 2.9: Empty State
**Goal**: Verify empty channel list display

1. Delete all channels (if any exist)
2. **Verify**:
   - ✅ Info message displays: "No routing channels defined"
   - ✅ Message explains what channels are
   - ✅ Lists bundling, avoiding, and waypoint types with descriptions
   - ✅ Add Channel and Draw on Canvas buttons still visible

---

### Test 2.10: Help Documentation
**Goal**: Verify help section

1. Scroll to bottom of Channels tab
2. **Verify**:
   - ✅ Info message titled "About Routing Channels:" visible
   - ✅ Lists all three channel types with descriptions
   - ✅ Explains priority system
   - ✅ Mentions use cases (cable management, sensitive equipment, routing hubs)

---

## Part 3: Integration Testing

### Test 3.1: Lines + Channels Together
**Goal**: Verify lines and channels work together

1. Create a bundling channel in the middle of the canvas
2. Create a line that would naturally route through the channel
3. **Verify**:
   - ✅ Line routing considers the channel
   - ✅ Both line and channel visible in preview
   - ✅ Config contains both overlays and channels sections

---

### Test 3.2: Full Workflow
**Goal**: Complete end-to-end test

1. Start with fresh MSD card
2. Add Base SVG (builtin: engineering)
3. Add 3 anchors via Place Anchor Mode
4. Add 2 control overlays via Place Control Mode
5. Add 3 lines connecting various points
6. Add 2 routing channels (1 bundling, 1 avoiding)
7. **Verify**:
   - ✅ All tabs functional
   - ✅ Preview updates correctly as you add elements
   - ✅ Save produces valid YAML
   - ✅ Card renders correctly in dashboard
   - ✅ Re-opening editor loads all elements correctly

---

### Test 3.3: Config Persistence
**Goal**: Verify config saves and loads correctly

1. Create complex MSD with lines and channels
2. Click Save
3. Refresh page
4. Re-open MSD Studio
5. **Verify**:
   - ✅ All lines load with correct schema properties
   - ✅ All channels load with correct properties
   - ✅ Can edit existing lines and channels
   - ✅ No schema migration issues

---

### Test 3.4: YAML Validation
**Goal**: Verify generated YAML matches schema

1. Create a line and a channel
2. Save and view YAML
3. **Verify line overlay**:
   ```yaml
   - type: line
     id: line_1
     anchor: cpu_core          # ✅ Not 'source'
     attach_to: memory         # ✅ Not 'target'
     route: manhattan          # ✅ String, not object
     style:
       color: var(--lcars-orange)  # ✅ Not 'stroke'
       width: 2                    # ✅ Not 'stroke_width'
   ```
4. **Verify channel**:
   ```yaml
   channels:
     power_corridor:
       type: bundling
       bounds: [100, 50, 200, 100]
       priority: 10
       color: "#00FF00"
   ```

---

## Part 4: Edge Cases & Error Handling

### Test 4.1: Empty Field Validation
**Goal**: Verify required field validation

1. Try to create line without ID
2. Try to create channel without ID
3. **Verify**:
   - ✅ Alert displays: "Line ID is required"
   - ✅ Alert displays: "Channel ID is required"
   - ✅ Forms don't save with empty required fields

---

### Test 4.2: Duplicate IDs
**Goal**: Verify ID uniqueness

1. Create line with ID `line_1`
2. Try to create another line with ID `line_1`
3. **Verify**:
   - ✅ System allows it (IDs managed by user)
   - ⚠️ User responsible for unique IDs

---

### Test 4.3: Large Bounds
**Goal**: Verify handling of large values

1. Create channel with bounds: `[10000, 10000, 5000, 5000]`
2. **Verify**:
   - ✅ Values accept large numbers
   - ✅ Channel may not be visible in default viewBox
   - ✅ No errors or crashes

---

### Test 4.4: Negative Bounds
**Goal**: Verify handling of negative values

1. Try creating channel with negative X or Y
2. **Verify**:
   - ✅ Negative values accepted (valid for SVG coordinates)
   - ✅ Channel renders at negative coordinates if in viewBox

---

### Test 4.5: Mode Switching
**Goal**: Verify mode transitions

1. Enter Draw Channel Mode
2. Click first point
3. Switch to another tab before second click
4. **Verify**:
   - ✅ Mode resets correctly
   - ✅ No partial channel state persists
   - ✅ Can safely switch modes mid-operation

---

## Part 5: Visual Verification

### Screenshots to Capture
1. ✅ Line form showing correct schema fields (anchor, attach_to, route, style.color, etc.)
2. ✅ Line connecting overlays with visible gaps and attachment points
3. ✅ Channels tab with list of channels (different types)
4. ✅ Channel form dialog with all fields
5. ✅ Preview showing multiple channels (green bundling, red avoiding, blue waypoint)
6. ✅ Draw Channel Mode with crosshair cursor
7. ✅ Complete MSD with lines and channels together
8. ✅ YAML output showing correct schema

---

## Expected Results Summary

### Line Editor Schema Fix
- ✅ All line properties use correct schema terminology
- ✅ `anchor` and `attach_to` replace `source` and `target`
- ✅ `route` is a string, not an object
- ✅ `style.color` and `style.width` replace `stroke` and `stroke_width`
- ✅ Attachment sides (`anchor_side`, `attach_side`) only appear for overlays
- ✅ Gaps (`anchor_gap`, `attach_gap`) work correctly
- ✅ Old configs continue to work (backward compatibility)

### Channels Tab
- ✅ Full CRUD operations (Create, Read, Update, Delete)
- ✅ Visual channel list with type indicators
- ✅ Channel form with all fields
- ✅ Draw Channel Mode for visual creation
- ✅ Channel visualization in preview (color-coded rectangles)
- ✅ Highlight feature works
- ✅ Help documentation clear and useful
- ✅ Empty state informative

---

## Known Issues / Limitations
(Document any issues found during testing here)

---

## Testing Checklist

### Part 1: Line Editor Schema
- [ ] Test 1.1: Open Existing Line
- [ ] Test 1.2: Create New Line Between Anchors
- [ ] Test 1.3: Create Line Between Overlays
- [ ] Test 1.4: Connect Line Mode
- [ ] Test 1.5: Style Properties

### Part 2: Channels Tab
- [ ] Test 2.1: Add Bundling Channel
- [ ] Test 2.2: Draw Channel Mode
- [ ] Test 2.3: Edit Channel
- [ ] Test 2.4: Highlight Channel
- [ ] Test 2.5: Delete Channel
- [ ] Test 2.6: Multiple Channel Types
- [ ] Test 2.7: Channel Priority
- [ ] Test 2.8: Channel Bounds Validation
- [ ] Test 2.9: Empty State
- [ ] Test 2.10: Help Documentation

### Part 3: Integration
- [ ] Test 3.1: Lines + Channels Together
- [ ] Test 3.2: Full Workflow
- [ ] Test 3.3: Config Persistence
- [ ] Test 3.4: YAML Validation

### Part 4: Edge Cases
- [ ] Test 4.1: Empty Field Validation
- [ ] Test 4.2: Duplicate IDs
- [ ] Test 4.3: Large Bounds
- [ ] Test 4.4: Negative Bounds
- [ ] Test 4.5: Mode Switching

### Part 5: Visual Verification
- [ ] All screenshots captured
- [ ] YAML output verified

---

## Completion Criteria
- ✅ All tests pass
- ✅ No JavaScript errors in browser console
- ✅ Generated YAML matches official schema
- ✅ Line routing respects channels (visual verification)
- ✅ UI is intuitive and responsive
- ✅ Help documentation is clear
- ✅ Screenshots captured for documentation

---

**Last Updated**: 2026-01-10
**Version**: Phase 5 Complete
