# Component Preset System Testing Guide

## Overview
This document describes how to test the new component preset system for the ALERT component.

## Build Instructions

```bash
npm install
npm run build
```

The built file will be in `dist/lcards.js`. Copy this to your Home Assistant installation:
```bash
cp dist/lcards.js /path/to/homeassistant/www/community/lcards/
```

Then hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R) to load the new version.

## Test Cases

### Test 1: Basic ALERT Component with Preset

Add this to your Lovelace dashboard:

```yaml
type: custom:lcards-button
component: alert
preset: condition_red
entity: sensor.cpu_percent
```

**Expected Result:**
- Red alert symbol with animated bars
- Text shows "ALERT" and "CONDITION: RED" in red
- Bars animate with staggered flash effect
- Text blinks after 2 second delay

### Test 2: Different Presets

Test all 6 condition presets:

```yaml
# Blue alert
type: custom:lcards-button
component: alert
preset: condition_blue
entity: sensor.cpu_percent

# Green alert
type: custom:lcards-button
component: alert
preset: condition_green
entity: sensor.cpu_percent

# Yellow alert
type: custom:lcards-button
component: alert
preset: condition_yellow
entity: sensor.cpu_percent

# Grey alert
type: custom:lcards-button
component: alert
preset: condition_grey
entity: sensor.cpu_percent

# Black alert
type: custom:lcards-button
component: alert
preset: condition_black
entity: sensor.cpu_percent
```

**Expected Result:**
- Each preset displays with its corresponding color
- Text shows appropriate "CONDITION: [COLOR]" label

### Test 3: Range-Based Preset Switching

```yaml
type: custom:lcards-button
component: alert
entity: sensor.cpu_percent
ranges:
  enabled: true
  ranges:
    - from: 0
      to: 30
      preset: condition_green
    - from: 30
      to: 70
      preset: condition_yellow
    - from: 70
      to: 100
      preset: condition_red
```

**Expected Result:**
- Alert color changes based on CPU percentage
- 0-30%: Green
- 30-70%: Yellow
- 70-100%: Red

### Test 4: Custom Text with Templates

#### JavaScript Template
```yaml
type: custom:lcards-button
component: alert
preset: condition_blue
entity: sensor.cpu_percent
segments:
  alert_text:
    text: "[[[return entity.state > 80 ? 'CRITICAL' : 'OK']]]"
  sub_text:
    text: "[[[return entity.state + '% CPU']]]"
```

#### Token Template
```yaml
type: custom:lcards-button
component: alert
preset: condition_yellow
entity: sensor.temperature
segments:
  alert_text:
    text: "TEMP"
  sub_text:
    text: "{entity.state}°C"
```

**Expected Result:**
- Text updates dynamically based on entity state
- Templates evaluate correctly

### Test 5: Exact Value Matching

```yaml
type: custom:lcards-button
component: alert
entity: binary_sensor.motion
ranges:
  enabled: true
  ranges:
    - equals: "on"
      preset: condition_red
    - equals: "off"
      preset: condition_green
```

**Expected Result:**
- Shows red when motion detected (on)
- Shows green when no motion (off)

### Test 6: Attribute-Based Ranges

```yaml
type: custom:lcards-button
component: alert
entity: light.bedroom
ranges:
  enabled: true
  attribute: brightness
  ranges:
    - from: 0
      to: 50
      preset: condition_grey
    - from: 50
      to: 200
      preset: condition_yellow
    - from: 200
      to: 256
      preset: condition_red
```

**Expected Result:**
- Alert color changes based on light brightness attribute
- Brightness is automatically normalized to 0-100 scale

### Test 7: DPAD Backward Compatibility

```yaml
type: custom:lcards-button
component: dpad
entity: media_player.living_room
dpad:
  segments:
    up:
      tap_action:
        action: call-service
        service: media_player.volume_up
    down:
      tap_action:
        action: call-service
        service: media_player.volume_down
    center:
      tap_action:
        action: call-service
        service: media_player.media_play_pause
```

**Expected Result:**
- DPAD works exactly as before
- No errors in console
- All actions trigger correctly

### Test 8: Preset Validation

Try an invalid preset:

```yaml
type: custom:lcards-button
component: alert
preset: invalid_preset_name
entity: sensor.cpu_percent
```

**Expected Result:**
- Console shows error: "Invalid preset 'invalid_preset_name' for component 'alert'"
- Falls back to 'default' preset
- Card still renders without crashing

### Test 9: Custom Segment Style Overrides

```yaml
type: custom:lcards-button
component: alert
preset: condition_blue
entity: sensor.cpu_percent
segments:
  shape:
    style:
      fill: "#FF00FF"  # Override preset color
  alert_text:
    text: "CUSTOM"
    style:
      fill: "#FF00FF"
      font_size: 20
```

**Expected Result:**
- Shape and text use custom magenta color (overriding preset)
- Text is larger (20px)
- Other segments (bars, sub_text) still use preset colors

### Test 10: Rules Engine Override

```yaml
type: custom:lcards-button
component: alert
preset: condition_green
entity: sensor.cpu_percent
rules:
  - id: high_cpu
    when:
      entity: sensor.cpu_percent
      above: 80
    apply:
      preset: condition_red
```

**Expected Result:**
- Starts with green preset
- Switches to red preset when CPU > 80%
- Rules take precedence over base preset

## Validation Checklist

- [ ] Build completes without errors
- [ ] All 6 condition presets render correctly
- [ ] Range-based switching works for numeric values
- [ ] Range-based switching works for exact value matching
- [ ] JavaScript templates evaluate correctly
- [ ] Token templates evaluate correctly
- [ ] DPAD component still works (backward compatibility)
- [ ] Invalid preset name shows error and falls back to default
- [ ] User segment overrides work correctly
- [ ] Rules engine can override presets
- [ ] Text animations work (blink after 2s)
- [ ] Bar animations work (staggered flash)
- [ ] No console errors during normal operation

## Known Issues / Limitations

None at this time. If you encounter any issues, please file a GitHub issue with:
1. Your YAML configuration
2. Browser console errors (if any)
3. Expected vs actual behavior

## Architecture Notes

### Merge Order (Low to High Priority)
```
component.segments ← preset.segments ← user.segments ← rules patches
```

### Preset vs Range Behavior
- If both `preset` and `ranges` are specified, ranges take precedence
- Ranges are evaluated on every HASS update
- Invalid preset from range evaluation falls back to explicitly set `preset` or 'default'

### Text Template Processing
- Evaluated asynchronously
- Supports all 4 template types (JavaScript, Token, DataSource, Jinja2)
- Re-evaluated on entity state changes
- Applied after segment interactivity setup
