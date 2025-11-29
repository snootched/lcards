# SVG Segment Action Filtering Fix

**Date:** 2025-11-28
**Version:** 1.20.09
**Status:** ✅ Fixed## Problem

When using Phase 2 segmented SVG with per-segment `tap_action` configurations, the **button-level action was firing instead of (or in addition to) the segment action**.

### Example Configuration
```yaml
type: custom:lcards-simple-button
entity: remote.living_room
svg:
  content: |
    <path id="arrow-up" d="M 40,30 L 50,15 L 60,30..." fill="var(--lcars-blue)" />
  segments:
    - id: up
      selector: "#arrow-up"
      tap_action:
        action: call-service
        service: light.toggle
        target:
          entity_id: light.tv
```

### Observed Behavior
- User clicks segment with `light.toggle` configured
- Console logs: `[LCARdSActionHandler] Toggling remote.living_room`
- Error: `Service remote.toggle not found`
- Segment's `tap_action` never executed

## Root Cause

### Event Capture Phase Ordering

1. **Button-level action handler** attached to parent `<g data-overlay-id="simple-button">` element in `updated()` lifecycle
2. **Segment action handlers** attached to child elements (e.g., `<path id="arrow-up">`) AFTER button handler in same `updated()` cycle
3. Both handlers use **`capture: true`** (capture phase, not bubble phase)

In capture mode with same-phase listeners:
- Events travel **parent → child** during capture phase
- **First-attached handler runs first** (button handler)
- Button handler calls `event.stopPropagation()` immediately
- **Segment handler never receives event** (propagation stopped)

### Timeline
```
1. Render cycle starts
2. updated() runs
3. _setupButtonActions() attaches click handler to <g> (capture phase)
4. _setupSegmentInteractivity() attaches click handlers to <path> elements (capture phase)
5. User clicks <path id="arrow-up">
6. Capture phase: button handler runs first → stopPropagation()
7. Segment handler never runs (propagation blocked)
8. Button action executes (wrong action!)
```

### Initial Attempted Solution (Failed)

**Approach 1: Event marker pattern** ❌
```javascript
// Segment handler sets marker
e.__lcardsSegmentHandled = true;

// Button handler checks marker
if (event.__lcardsSegmentHandled) return;
```

**Why it failed:** Marker is set by segment handler, but segment handler never runs because button handler calls `stopPropagation()` first!

## Solution

### DOM Attribute Detection Pattern

Instead of relying on event flow, **mark segment elements with a data attribute** and check `event.target` in the button handler:

#### 1. Segment Elements Get Marker Attribute (lcards-simple-button.js)
```javascript
// When setting up segment interactivity
_attachSegmentListeners(element, segment) {
    // ... listener setup ...

    // Make element pointer-interactive
    element.style.pointerEvents = 'all';
    element.style.cursor = 'pointer';

    // Mark as segment for button-level action filtering
    element.setAttribute('data-lcards-segment', segment.id);

    // ... cleanup return ...
}
```

#### 2. Button Handler Checks Target Element (LCARdSActionHandler.js)
```javascript
const tapHandler = async (event) => {
    // Check if click target is a segment element (Phase 2 multi-action regions)
    // Walk up the DOM tree to check for data-lcards-segment attribute
    let targetElement = event.target;
    while (targetElement && targetElement !== element) {
        if (targetElement.hasAttribute && targetElement.hasAttribute('data-lcards-segment')) {
            lcardsLog.trace(`[LCARdSActionHandler] Skipping tap - clicked on segment "${targetElement.getAttribute('data-lcards-segment')}"`);
            return; // Let segment handler deal with it
        }
        targetElement = targetElement.parentElement;
    }

    // Now safe to stop propagation - we know we're handling this
    event.stopPropagation();
    event.preventDefault();

    // ... rest of button action logic
};
```

### Why This Works

1. Button handler runs first (capture phase, attached first)
2. **Checks `event.target`** to see if it's a segment element (or child of one)
3. If segment detected → **returns early**, doesn't call `stopPropagation()`
4. Event continues propagating to segment handler
5. Segment handler executes its action
6. If NOT a segment → button handler proceeds normally

## Testing

### Test Case 1: D-Pad with Different Services
```yaml
type: custom:lcards-simple-button
entity: remote.living_room
svg:
  content: |
    <svg viewBox="0 0 100 100">
      <path id="arrow-up" d="M 40,30 L 50,15 L 60,30..." />
    </svg>
  segments:
    - id: up
      selector: "#arrow-up"
      tap_action:
        action: call-service
        service: light.toggle
        target:
          entity_id: light.bedroom
```

**Expected:**
- Click up arrow → `light.toggle` called with `light.bedroom`
- No `remote.toggle` error
- Segment action executes exclusively

### Test Case 2: Mixed Segment + Button Actions
```yaml
type: custom:lcards-simple-button
entity: light.all_lights
tap_action:
  action: more-info
svg:
  content: |
    <svg viewBox="0 0 100 100">
      <rect id="zone1" x="0" y="0" width="50" height="50" />
      <rect id="background" x="0" y="0" width="100" height="100" fill="none" />
    </svg>
  segments:
    - id: zone1
      selector: "#zone1"
      tap_action:
        action: navigate
        navigation_path: /lovelace/zone1
```

**Expected:**
- Click zone1 → Navigate to /lovelace/zone1
- Click background (no segment) → Show more-info for `light.all_lights`
- Segment clicks don't trigger button action

## Files Modified

### `/home/jweyermars/code/lcards/src/cards/lcards-simple-button.js`
- Line 723: Added `element.setAttribute('data-lcards-segment', segment.id)` marker

### `/home/jweyermars/code/lcards/src/base/LCARdSActionHandler.js`
- Lines 220-229: Added DOM tree walk to detect segment elements before handling button action

## Impact

- ✅ Segments with `tap_action` now execute their own actions exclusively
- ✅ Button-level `tap_action` still fires when clicking non-segment areas
- ✅ No breaking changes to existing non-segmented buttons
- ✅ Hold actions and double-tap actions unaffected (future enhancement)

## Related Features

### Phase 2: Segmented SVG (Full Feature Set)
- ✅ Per-segment styling (default, hover, active states)
- ✅ Per-segment actions (tap_action) - **NOW WORKING**
- ⏳ Per-segment hold_action (works with same pattern)
- ⏳ Per-segment entity monitoring (future)
- ⏳ Segment state-based styling from entity (future)

## Version History

- **1.20.05**: SVG background support (Phase 1)
- **1.20.06**: Attempted fix with event marker pattern (failed - marker never set)
- **1.20.08**: Working fix with DOM attribute detection pattern
- **1.20.09**: Added `target` parameter support for `call-service` actions (HA new format)

## Notes

### Why Not Remove Capture Phase?

The capture phase is intentional for shadow DOM SVG elements:
- Ensures action handler runs even when clicking child elements
- Needed for text, icons, and nested SVG groups
- Used consistently in MSD cards

### Alternative Approaches Considered

1. **Event marker pattern (tried first)** ❌
   - Marker set by segment handler, but segment handler never runs
   - Button's `stopPropagation()` blocks event before marker can be set

2. **Remove button actions when segments exist** ❌
   - Breaks mixed-mode usage (segment + background areas)

3. **Use bubble phase for segments** ❌
   - Inconsistent with MSD pattern
   - Doesn't solve issue if button also uses bubble
   - Still need to prevent button handler from running first

4. **Check event.target in button handler** ✅
   - Works regardless of event phase
   - Clean, explicit opt-out mechanism
   - Future-proof for hold/double-tap
   - **FINAL SOLUTION**
