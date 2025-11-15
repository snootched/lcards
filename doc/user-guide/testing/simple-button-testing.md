# Simple Button Card - Testing Guide

**Version:** 1.11.23+
**Schema:** CB-LCARS Nested Schema Only
**Last Updated:** November 15, 2025

---

## Testing Status

**Completed Tests:**
- ✅ Test 1: Basic Rendering (v1.10.73)
- ✅ Test 2: Entity Binding (v1.10.73)
- ✅ Test 3: Computed Tokens - Alpha (v1.10.76)
- ✅ Test 4: Computed Tokens - Darken/Lighten (v1.10.77)
- ✅ Test 5: Theme Tokens (v1.10.78)
- ⚠️ Test 6: Border Flexibility (v1.10.86 - Partial: uniform & per-corner work, per-side not implemented)
- ✅ Test 7: Typography (v1.10.86)
- ✅ Test 8: Lozenge Preset (v1.11.23)
- ✅ Test 9: Preset Override (v1.11.23)
- ✅ Test 10: Icon Formats (v1.11.23)

**Pending Tests:**
- ⏳ Test 11: Rules Engine - JavaScript (ready to test)
- ⏳ Test 12: Rules Engine - Jinja2 (ready to test)
- ⚠️ Test 13: Rules Engine - Token Syntax (SKIP - duplicate of Test 11)
- ⏳ Test 14: Rules Engine - Entity State (ready to test)
- ⏳ Test 15: Rules Engine - Priority (ready to test)
- ⏳ Tests 16-20: Actions (Toggle, Call Service, Navigate, More Info, Complex Example)

**Documentation Updates (v1.11.23+):**
- ✅ Corrected all Rules Engine syntax (Tests 11-15)
- ✅ Removed incorrect `type: javascript`, `type: jinja2`, `type: token`, `type: entity` syntax
- ✅ Updated to use `when.any` + template conditions + `apply.overlays.tag:button.style`
- ✅ Added notes about template context and `stop_after` behavior

**Known Issues:**
- Editor preview border mutation (documented in Test 5, low priority, workaround: reload page)
- Per-side border widths and individual side styling not yet implemented (Test 6)

---
## Quick Test Setup

Copy these test configs to a Lovelace dashboard for systematic verification.
All tests use the **new nested schema** - flat keys are no longer supported.

---

## Test 1: Basic Rendering (No Entity)

```yaml
type: custom:lcards-simple-button
label: "Basic Button"
```

**Expected:**
- Orange button (default theme color)
- Black text
- Label reads "Basic Button"
- 2px black border, 8px radius

---

## Test 2: Entity Binding with State Changes

```yaml
type: custom:lcards-simple-button
entity: light.living_room
label: "Living Room"
show_icon: true
icon: 'mdi:lightbulb'

style:
  card:
    color:
      background:
        active: 'var(--lcars-orange)'
        inactive: 'var(--lcars-gray)'
        unavailable: 'var(--lcars-red)'

  text:
    default:
      color:
        active: 'black'
        inactive: 'var(--lcars-color-text-disabled)'
        unavailable: 'white'

tap_action:
  action: toggle
```

**Test Actions:**
1. Click button to toggle light ON → Orange background, black text
2. Click again to toggle OFF → Gray background, dim text
3. Make entity unavailable → Red background, white text

**Expected:** Colors change **instantly** without page refresh.

**Status:** ✅ PASSED (v1.10.73)
- Invalid entity correctly shows unavailable state
- Border radius persists through state changes
- Colors update correctly on state changes

**Known Issues:**
- Icon color doesn't change with state (uses `currentColor` or config override)
- Icon border may overlap button border in unavailable state

---

## Test 3: Computed Tokens - Alpha (Transparency) ✅

**Status:** PASSED (v1.10.76)
- Computed tokens resolve to CSS `color-mix()` correctly
- Invalid tokens are detected and logged with warnings
- Valid tokens produce transparent colors as expected

```yaml
type: custom:lcards-simple-button
entity: switch.coffee_maker
label: "Coffee Maker"
icon: 'mdi:coffee'

style:
  card:
    color:
      background:
        active: 'var(--lcars-orange)'
        inactive: alpha(colors.accent.primary, 0.5)
        unavailable: alpha(colors.status.danger, 0.3)

  text:
    default:
      color:
        active: 'black'
        inactive: 'white'

tap_action:
  action: toggle
```

**Verification:**
1. Open DevTools (F12) → Elements tab
2. Find the `<path>` or `<rect>` element with `class="button-bg"`
3. Check `fill` attribute value
4. Should see: `color-mix(in srgb, var(--lcars-orange) 50%, transparent)`
5. Should NOT see: `alpha(...)` as literal text

**Expected:** Computed tokens resolve to CSS `color-mix()` at render time.

**Note:** Invalid token paths (e.g., `colors.ui.error`) will generate console warnings and render as literal text.

---

## Test 4: Computed Tokens - Darken/Lighten ✅

**Status:** PASSED (v1.10.77)
- Both `darken()` and `lighten()` resolve correctly
- Percentage format (`30%`) and decimal format (`0.3`) both supported
- Generates proper `color-mix()` CSS with black/white mixing

### Darken Test
```yaml
type: custom:lcards-simple-button
label: "Darker Orange"

style:
  card:
    color:
      background:
        active: darken(colors.accent.primary, 30%)
  text:
    default:
      color:
        active: 'white'
```

### Lighten Test
```yaml
type: custom:lcards-simple-button
label: "Lighter Orange"

style:
  card:
    color:
      background:
        active: lighten(colors.accent.primary, 30%)
  text:
    default:
      color:
        active: 'black'
```

**Verification:**
- Darken: Should be darker than default orange
- Lighten: Should be lighter than default orange
- Inspect DOM: Should see `color-mix()` with black/white mixing

**Note:** Supports both `30%` and `0.3` formats for the amount parameter.

---

## Test 5: Theme Tokens

```yaml
type: custom:lcards-simple-button
entity: light.bedroom
label: "Bedroom"
icon: 'entity'

style:
  card:
    color:
      background:
        active: 'theme:components.button.base.background.active'
        inactive: 'theme:components.button.base.background.inactive'

  border:
    color:
      active: 'theme:components.button.base.border.color.active'

  text:
    default:
      color:
        active: 'theme:components.button.base.text.default.color.active'
      font_size: 'theme:components.button.base.text.default.font_size'
```

**Expected:**
- Colors pulled from theme
- Font size from theme
- Icon shows entity's own icon

**Known Issues:**
- **Editor Preview Border Mutation (Low Priority):** In the editor preview window, after toggling the button state, the border radius/width may change to default values (8px/2px) and persist until page reload. This is an editor-preview-only issue and does not affect the actual dashboard. Workaround: Reload the page. This issue is documented but deferred as it does not impact core functionality.

**Status:** ✅ **PASSED** (v1.10.78) - Theme tokens resolve correctly, invalid token warnings work

---

## Test 6: Border Flexibility

### Uniform Border
```yaml
type: custom:lcards-simple-button
label: "Uniform Border"

style:
  border:
    width: 3px
    radius: 12px
    color:
      active: 'var(--lcars-yellow)'
```

### Per-Corner Radius
```yaml
type: custom:lcards-simple-button
label: "Per-Corner"

style:
  border:
    width: 2px
    radius:
      top_left: 30px
      top_right: 5px
      bottom_right: 30px
      bottom_left: 5px
    color:
      active: 'var(--lcars-blue)'
```

### Per-Side Width
```yaml
type: custom:lcards-simple-button
label: "Per-Side Width"

style:
  border:
    width:
      top: 5px
      right: 1px
      bottom: 5px
      left: 1px
    radius: 8px
    color:
      active: 'black'
```

### Individual Side Styling
```yaml
type: custom:lcards-simple-button
label: "Individual Sides"

style:
  border:
    radius: 12px
    top:
      width: 5px
      color: 'var(--lcars-orange)'
    right:
      width: 1px
      color: 'var(--lcars-gray)'
    bottom:
      width: 5px
      color: 'var(--lcars-orange)'
    left:
      width: 1px
      color: 'var(--lcars-gray)'
```

**Expected:**
- Uniform: 3px yellow border, 12px radius
- Per-corner: Rounded top-left/bottom-right, sharp top-right/bottom-left
- Per-side: Thick top/bottom, thin left/right
- Individual: Orange thick top/bottom, gray thin left/right

**Status:** ⚠️ **PARTIAL** (v1.10.86)
- ✅ Uniform border: Width and radius work (accepts numbers or px units)
- ✅ Per-corner radius: All corners render correctly
- ❌ Per-side width: Not implemented (requires complex SVG rendering with 4 separate borders)
- ❌ Individual side styling: Not implemented (requires per-side border rendering)

**Note:** Per-side widths and individual side styling require drawing separate SVG elements for each border side, which is not yet implemented. These features are documented as "not yet supported" and may be implemented in a future release.

---

## Test 7: Typography

```yaml
type: custom:lcards-simple-button
label: "Custom Typography"

style:
  text:
    default:
      color:
        active: 'var(--lcars-yellow)'
      font_size: 20px
      font_weight: 900
      font_family: "'Courier New', monospace"
```

**Expected:**
- Yellow text
- Large (20px) and extra bold (900)
- Monospace font

**Status:** ✅ **PASSED** (v1.10.86)
- Text color changes correctly
- Font size adjusts properly
- Font weight (boldness) renders correctly
- Custom font family applies (monospace)

---

## Test 8: Lozenge Preset

```yaml
type: custom:lcards-simple-button
preset: lozenge
label: "Lozenge"
icon: 'mdi:star'
```

```yaml
type: custom:lcards-simple-button
preset: lozenge-right
label: "Right Icon"
icon: 'mdi:arrow-right'
```

**Expected:**
- Lozenge: Fully rounded (pill shape), icon on left
- Lozenge-right: Fully rounded, icon on right side

**Status:** ✅ **PASSED** (v1.10.95)
- Border radius correctly resolves from theme token `theme:components.button.base.radius.full`
- Preset applies full rounded corners (34px from HA theme)
- Icon positioning works correctly
- Theme token resolution through StylePresetManager working properly

**Technical Notes:**
- Fixed timing issue: Custom elements now register after core initialization (v1.10.93)
- Fixed token resolution: Strips `'theme:'` prefix before calling resolver (v1.10.95)
- Resolution chain: `theme:token` → theme value → CSS var → computed value → numeric

---

## Test 9: Preset Override

```yaml
type: custom:lcards-simple-button
preset: lozenge
label: "Custom Lozenge"
icon: 'mdi:heart'

style:
  card:
    color:
      background:
        active: 'var(--lcars-red)'

  border:
    color:
      active: 'var(--lcars-yellow)'

  text:
    default:
      color:
        active: 'white'
      font_size: 18px
```

**Expected:**
- Lozenge shape maintained (full rounded corners)
- Red background (overriding preset)
- Yellow border (overriding preset)
- White text, 18px (overriding preset)
- Icon on left (preset default position)

**Status:** ✅ **PASSED** (v1.11.23)
- Config styles correctly override preset defaults
- Deep merge preserves preset shape characteristics
- All override properties apply correctly
- Merge priority chain works: preset → theme → config

---

## Test 10: Icon Formats

### Material Design Icons
```yaml
type: custom:lcards-simple-button
label: "MDI Icon"
icon: 'mdi:lightbulb-on'
show_icon: true
```

### Simple Icons
```yaml
type: custom:lcards-simple-button
label: "Simple Icon"
icon: 'si:github'
show_icon: true
```

### Entity Icon (Auto-detect)
```yaml
type: custom:lcards-simple-button
entity: light.bedroom
label: "Entity Icon"
show_icon: true
```

### Entity Icon (Explicit)
```yaml
type: custom:lcards-simple-button
entity: light.bedroom
label: "Entity Icon"
icon: 'entity'
show_icon: true
```

**Expected:**
- MDI: Shows lightbulb icon
- SI: Shows GitHub logo
- Entity (auto): Uses entity's configured icon automatically
- Entity (explicit): Same result, but explicitly specified

**Status:** ✅ **PASSED** (v1.11.23)
- All three icon formats render correctly
- Entity icon auto-detection works (HA style)
- `icon: 'entity'` is optional - just use `show_icon: true` with entity binding
- MDI and Simple Icons require explicit `icon:` specification

---

## Test 11: Rules Engine - JavaScript

```yaml
type: custom:lcards-simple-button
entity: light.bedroom
label: "Brightness Aware"
icon: 'mdi:lightbulb'
show_icon: true

style:
  card:
    color:
      background:
        active: 'var(--lcars-blue)'

  text:
    default:
      color:
        active: 'white'

rules:
  - id: high_brightness
    when:
      any:
        - condition: '[[[return entity.attributes.brightness > 200]]]'
    apply:
      overlays:
        tag:button:
          style:
            card:
              color:
                background:
                  active: 'var(--lcars-yellow)'
            text:
              default:
                color:
                  active: 'black'
```

**Test Actions:**
1. Set light brightness < 200 → Blue background, white text
2. Set light brightness > 200 → Yellow background, black text

**Expected:** Colors change **instantly** as brightness changes.

**Note:** JavaScript conditions use `[[[...]]]` wrapper and go inside `when.any`. The `entity` variable contains the button's bound entity. You can also access any entity via `states['entity.id']`.

---

## Test 12: Rules Engine - Jinja2

```yaml
type: custom:lcards-simple-button
entity: sensor.temperature
label: "Temperature"
show_icon: true
icon: 'mdi:thermometer'

style:
  card:
    color:
      background:
        active: 'var(--lcars-blue)'

  text:
    default:
      color:
        active: 'white'

rules:
  - id: high_temperature
    when:
      any:
        - condition: "{{ float(states('sensor.temperature')) > 25 }}"
    apply:
      overlays:
        tag:button:
          style:
            card:
              color:
                background:
                  active: 'var(--lcars-red)'
```

**Expected:**
- Temperature ≤ 25: Blue background
- Temperature > 25: Red background

**Note:** Jinja2 conditions use `{{ ... }}` wrapper and can use all Home Assistant template functions like `states()` and `float()`.

---

## Test 13: Rules Engine - Token Syntax

**Note:** This test is a duplicate of Test 11 (JavaScript). Token syntax `${}` is not a separate rule type - tokens are replaced during template processing before rules evaluate. Use JavaScript or Jinja2 templates instead.

**SKIP THIS TEST** - Use Test 11 (JavaScript) or Test 12 (Jinja2) instead.

---

## Test 14: Rules Engine - Entity State

```yaml
type: custom:lcards-simple-button
entity: switch.living_room
label: "Living Room Switch"
show_icon: true
icon: 'mdi:lightbulb'

style:
  card:
    color:
      background:
        active: 'var(--lcars-gray)'

rules:
  - id: switch_on
    when:
      any:
        - entity: switch.living_room
          state: "on"
    apply:
      overlays:
        tag:button:
          style:
            card:
              color:
                background:
                  active: 'var(--lcars-green)'
```

**Expected:**
- Switch off: Gray background
- Switch on: Green background

**Note:** Simple entity state matching uses `entity:` and `state:` under `when.any`. This is the simplest rules syntax.

---

## Test 15: Multiple Rules (Priority)

```yaml
type: custom:lcards-simple-button
entity: binary_sensor.motion
label: "Motion Sensor"
show_icon: true
icon: 'mdi:motion-sensor'

style:
  card:
    color:
      background:
        active: 'var(--lcars-gray)'

rules:
  # High priority - critical motion detected
  - id: motion_critical
    priority: 100
    stop_after: true  # Stops further rules from applying
    when:
      any:
        - entity: binary_sensor.motion
          state: "on"
        - entity: sensor.motion_level
          above: 90
    apply:
      overlays:
        tag:button:
          style:
            card:
              color:
                background:
                  active: 'var(--lcars-ui-red)'

  # Low priority - normal motion (won't apply if stop_after triggered)
  - id: motion_normal
    priority: 50
    when:
      any:
        - entity: binary_sensor.motion
          state: "on"
    apply:
      overlays:
        tag:button:
          style:
            card:
              color:
                background:
                  active: 'var(--lcars-gold)'
```

**Test Sequence:**
1. Motion off: Gray (default)
2. Motion on, level < 90: Gold (motion_normal rule)
3. Motion on, level > 90: Red (motion_critical applies, stop_after prevents motion_normal)

**Expected:** Rules execute in priority order (higher first). Use `stop_after: true` to prevent lower-priority rules from applying when a match occurs.

**Note:** Without `stop_after`, later matching rules would also apply. Priority controls evaluation order, `stop_after` controls whether to continue evaluating.

---

## Test 16: Actions - Toggle

```yaml
type: custom:lcards-simple-button
entity: light.living_room
label: "Toggle Light"
icon: 'mdi:lightbulb'

tap_action:
  action: toggle
```

**Expected:** Click toggles entity on/off.

---

## Test 17: Actions - Call Service

```yaml
type: custom:lcards-simple-button
label: "All Lights Off"
icon: 'mdi:lightbulb-off'

style:
  card:
    color:
      background:
        active: 'var(--lcars-ui-red)'
  text:
    default:
      color:
        active: 'white'

tap_action:
  action: call-service
  service: light.turn_off
  target:
    area_id: all
```

**Expected:** Click turns off all lights.

---

## Test 18: Actions - Navigate

```yaml
type: custom:lcards-simple-button
label: "Go to Settings"
icon: 'mdi:cog'

tap_action:
  action: navigate
  navigation_path: /config/dashboard
```

**Expected:** Click navigates to HA config page.

---

## Test 19: Actions - More Info

```yaml
type: custom:lcards-simple-button
entity: climate.thermostat
label: "Thermostat"
icon: 'entity'

hold_action:
  action: more-info
```

**Expected:** Long press shows entity more-info dialog.

---

## Test 20: Complex Combined Example

```yaml
type: custom:lcards-simple-button
entity: light.bedroom
label: "Master Bedroom"
icon: 'entity'
preset: lozenge

style:
  card:
    color:
      background:
        active: alpha(colors.accent.primary, 0.9)
        inactive: 'var(--lcars-gray)'

  border:
    width: 2px
    radius:
      top_left: 50px
      top_right: 50px
      bottom_right: 50px
      bottom_left: 50px
    color:
      active: 'black'
      inactive: 'var(--lcars-ui-gray)'

  text:
    default:
      color:
        active: 'black'
        inactive: 'var(--lcars-color-text-disabled)'
      font_size: 16px
      font_weight: bold

tap_action:
  action: toggle

hold_action:
  action: more-info

rules:
  - id: high_brightness
    when:
      any:
        - condition: '[[[return states["light.bedroom"].attributes.brightness > 200]]]'
    apply:
      overlays:
        tag:button:
          style:
            card:
              color:
                background:
                  active: 'var(--lcars-yellow)'
            border:
              color:
                active: 'var(--lcars-orange)'
```

**Expected:**
- Lozenge shape with computed alpha
- State changes work instantly
- Brightness > 200 changes to yellow with orange border
- Click toggles, long-press shows more info
- All nested schema properties work together

---

## Verification Checklist

After running all tests, verify:

- [ ] All buttons render correctly
- [ ] State changes reflect instantly (no refresh needed)
- [ ] Computed tokens resolve (check DevTools)
- [ ] Theme tokens pull from theme
- [ ] Border flexibility works (uniform, per-corner, per-side)
- [ ] Typography customization works
- [ ] Presets apply correctly
- [ ] Preset overrides work
- [ ] All icon formats display
- [ ] All 4 Rules Engine types work
- [ ] Multiple rules prioritize correctly
- [ ] All action types work
- [ ] Complex combinations work

---

## Common Issues

### Button not rendering
- Check browser console for errors
- Verify `type: custom:lcards-simple-button`
- Ensure lcards.js is loaded

### Colors not resolving
- Check CSS variable names in DevTools
- Verify theme tokens exist in theme
- Check computed token syntax (no spaces in function names)

### Rules not applying
- Verify `when`/`apply` syntax (not `conditions`)
- Check condition type matches expression
- Use browser console for JavaScript errors
- Test Jinja2 in HA Developer Tools → Template

### Icons not showing
- Verify format: `'mdi:icon-name'` (with colon, in quotes)
- Check icon exists in MDI library
- For Simple Icons: `'si:icon-name'`
- For entity icons: Use string `'entity'`

---

**For reference documentation, see:**
- `doc/user-guide/configuration/simple-button-quick-reference.md` - Complete schema reference
- `doc/architecture/simple-button-schema-definition.md` - Detailed specification
- `doc/architecture/rules-engine-template-syntax.md` - Rules Engine documentation
