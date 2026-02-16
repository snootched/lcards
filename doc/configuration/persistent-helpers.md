# Persistent Configuration via Input Helpers

LCARdS now supports persistent configuration through Home Assistant input helpers. This allows your theme customizations, alert mode settings, and other preferences to persist across Home Assistant restarts and be controlled via automations.

## Overview

The helper system provides:
- **Persistent Storage**: Configuration survives restarts
- **Automation Integration**: Control LCARdS via automations
- **Central Management**: Dedicated configuration panel
- **Manual Fallback**: YAML export for manual setup

## Installing the Configuration Panel

The LCARdS configuration panel is a frontend-only component that must be registered manually in your Home Assistant configuration.

### Step 1: Add Panel Configuration

Add the following to your Home Assistant `configuration.yaml`:

```yaml
panel_custom:
  - name: lcards-config
    sidebar_title: LCARdS Config
    sidebar_icon: mdi:cog
    url_path: lcards-config
    module_url: /hacsfiles/lcards/lcards-config-panel.js
```

**Note**: If you installed LCARdS manually (not via HACS), adjust the path:
```yaml
    module_url: /local/community/lcards/lcards-config-panel.js
```

### Step 2: Restart Home Assistant

After adding the configuration, restart Home Assistant for the panel to appear in the sidebar.

### Step 3: Verify Installation

Once restarted, you should see **"LCARdS Config"** in your Home Assistant sidebar. Click it to access the configuration panel.

## Accessing the Configuration Panel

After installation, the panel provides three tabs:
   - **Helpers**: View, create, and edit helpers
   - **Alert Lab**: Color customization for alert modes
   - **YAML Export**: Copy YAML for manual setup

## Helper Categories

### Alert System

**Alert Mode Selector** (`input_select.lcards_alert_mode`)
- Controls the active alert mode
- Options: `default`, `red_alert`, `yellow_alert`, `blue_alert`, `white_alert`
- Can be changed via automations to trigger theme changes

**Alert Lab Parameters** (12 helpers)
- HSL (Hue, Saturation, Lightness) values for each alert mode
- Red, Yellow, Blue, and White alert modes each have 3 helpers
- Example: `input_number.lcards_alert_lab_red_hue`

## Creating Helpers

### Via Configuration Panel (Recommended)

1. Open the **LCARdS Config** panel
2. Go to the **Helpers** tab
3. Click "Create All Missing Helpers" to create all helpers at once
4. Or click "Create" next to individual helpers

### Via YAML

If you prefer manual setup or automation:

1. Go to the **YAML Export** tab in the config panel
2. Click "Copy to Clipboard"
3. Paste into your `configuration.yaml`
4. Restart Home Assistant

Example YAML:

```yaml
input_select:
  lcards_alert_mode:
    name: LCARdS Alert Mode
    options:
      - default
      - red_alert
      - yellow_alert
      - blue_alert
      - white_alert
    initial: default
    icon: mdi:alarm-light

input_number:
  lcards_alert_lab_red_hue:
    name: Alert Lab Red Hue
    min: 0
    max: 360
    step: 1
    mode: slider
    unit_of_measurement: "°"
    icon: mdi:palette
  # ... (more helpers)
```

## Using the Alert Lab

The Alert Lab provides an interactive interface for customizing alert mode colors.

### Workflow

1. Open the Theme Browser (any card editor → Theme tab → "Browse Theme Tokens")
2. Switch to the **Alert Mode Lab** view
3. Select an alert mode (Red, Yellow, Blue, or White)
4. Adjust HSL sliders to customize colors
5. Enable "Auto-apply changes" to see live preview
6. Click **"Save to Helpers"** to persist your changes

### Parameters

Each alert mode has three adjustable parameters:

- **Hue Shift** (0-360°): Target hue for color transformation
- **Hue Strength** (0-1): Intensity of hue shift
- **Saturation** (0-3×): Saturation multiplier
- **Lightness** (0-2×): Lightness multiplier

### Saving and Loading

- **Save to Helpers**: Writes current parameters to input helpers
- **Apply Live**: Applies changes to the theme immediately
- **Reset to Defaults**: Restores factory defaults

When you reopen the Alert Lab, it automatically loads values from helpers if they exist.

## Automation Integration

### Triggering Alert Modes

Change the alert mode via automation:

```yaml
automation:
  - alias: "Red Alert on Security Breach"
    trigger:
      - platform: state
        entity_id: binary_sensor.security_system
        to: "on"
    action:
      - service: input_select.select_option
        target:
          entity_id: input_select.lcards_alert_mode
        data:
          option: red_alert
```

### Responding to Alert Changes

React when alert mode changes:

```yaml
automation:
  - alias: "Flash Lights on Red Alert"
    trigger:
      - platform: state
        entity_id: input_select.lcards_alert_mode
        to: red_alert
    action:
      - service: light.turn_on
        target:
          entity_id: light.living_room
        data:
          rgb_color: [255, 0, 0]
          brightness: 255
```

### Scheduling Alert Modes

Change alert mode based on time or conditions:

```yaml
automation:
  - alias: "Blue Alert During Night"
    trigger:
      - platform: sun
        event: sunset
    action:
      - service: input_select.select_option
        target:
          entity_id: input_select.lcards_alert_mode
        data:
          option: blue_alert
  
  - alias: "Normal Mode at Dawn"
    trigger:
      - platform: sun
        event: sunrise
    action:
      - service: input_select.select_option
        target:
          entity_id: input_select.lcards_alert_mode
        data:
          option: default
```

## Helper Value Management

### Reading Values

Access helper values in templates:

```yaml
sensor:
  - platform: template
    sensors:
      current_alert_mode:
        value_template: "{{ states('input_select.lcards_alert_mode') }}"
```

### Setting Values

Change helper values programmatically:

```yaml
# Set red hue to 15°
service: input_number.set_value
target:
  entity_id: input_number.lcards_alert_lab_red_hue
data:
  value: 15
```

### Restoring Defaults

Use the config panel's "Reset to Defaults" button or set values manually:

```yaml
# Red alert defaults
service: input_number.set_value
target:
  entity_id: input_number.lcards_alert_lab_red_hue
data:
  value: 0  # Default hue

service: input_number.set_value
target:
  entity_id: input_number.lcards_alert_lab_red_saturation
data:
  value: 140  # Default saturation (%)
```

## Troubleshooting

### Panel Not Appearing in Sidebar

1. Verify the `panel_custom` configuration is in `configuration.yaml`
2. Check the module path is correct (`/hacsfiles/lcards/lcards-config-panel.js` for HACS)
3. Restart Home Assistant (required after config changes)
4. Check Home Assistant logs for panel registration errors
5. Ensure LCARdS is properly installed and the panel file exists

### Panel Loads But Shows Errors

1. Check browser console for JavaScript errors
2. Verify `window.lcards.core.helperManager` is available
3. Ensure main LCARdS card system is loaded (add at least one LCARdS card to a dashboard)
4. Clear browser cache and reload

### Helper Creation Fails

If WebSocket helper creation fails:
1. Use the YAML Export tab
2. Add helpers manually to `configuration.yaml`
3. Restart Home Assistant

### Alert Lab Changes Not Persisting

1. Ensure helpers exist (Helpers tab shows "Exists")
2. Click "Save to Helpers" after making changes
3. Verify helper values updated in HA Developer Tools → States

### Values Not Loading in Alert Lab

1. Confirm helpers exist with correct entity IDs
2. Check helper values are within valid ranges
3. Reload the Theme Browser dialog

## Tips and Best Practices

### Performance
- Helpers add minimal overhead
- Alert mode changes are instant
- Helper value updates don't require card reloads

### Organization
- Use helper groups to organize LCARdS helpers
- Add to a dedicated Lovelace view for easy access
- Consider using input_select entities in dashboards

### Backups
- Helpers are stored in `.storage/` directory
- Included in Home Assistant backups automatically
- YAML export provides manual backup option

### Testing
- Test alert mode changes in a non-production dashboard first
- Use Developer Tools → Services to test helper changes
- Monitor browser console for errors during helper operations

## Future Expansion

The helper system is designed to support additional configuration:
- Card default styling
- Animation preferences
- Layout templates
- More alert mode customizations

## See Also

- [Developer Guide: Helpers API](../development/helpers-api.md)
- [Architecture: Alert Mode System](../architecture/subsystems/alert-mode.md)
- [CHANGELOG.md](../../CHANGELOG.md) - Version history
