# Chart Studio Phase 4 - Quick Reference Guide

## What Was Implemented

### Phase 3 Fixes ✅

1. **Schema-Driven Controls**
   - All `ha-selector` replaced with `FormField.renderField()`
   - Automatic label/helper generation from schema
   - Consistent validation and behavior

2. **Unified Color Pickers**
   - All single color pickers use `lcards-color-section`
   - Theme token support
   - Consistent UX

3. **Fixed HA Dialogs**
   - Proper `ha-dialog` creation
   - `mwc-button` for actions
   - Correct event handling

### Phase 4 New Tabs ✅

#### Tab 6: Axes
```yaml
style:
  xaxis:
    labels:
      show: true      # Toggle
      rotate: 0       # -90 to 90 slider
    border:
      show: true      # Toggle
    ticks:
      show: true      # Toggle
  yaxis:
    labels:
      show: true      # Toggle
    border:
      show: true      # Toggle
    ticks:
      show: true      # Toggle
```

#### Tab 7: Legend & Labels
```yaml
style:
  legend:
    show: false                # Toggle
    position: bottom           # top/right/bottom/left
    horizontalAlign: center    # left/center/right
  data_labels:
    show: false                # Toggle
    offsetY: 0                 # -50 to 50 slider
  display:
    tooltip:
      show: true               # Toggle
      theme: dark              # light/dark
```

#### Tab 8: Theme
```yaml
style:
  theme:
    mode: dark                 # light/dark
    palette: ""                # Optional palette name
    monochrome:
      enabled: false           # Toggle
      color: "#FF9900"         # Color picker
      shade_to: dark           # light/dark
      shade_intensity: 0.65    # 0-1 slider
```

#### Tab 9: Animation
```yaml
style:
  animation:
    preset: lcars_standard     # Selector with presets
```

Available presets:
- `lcars_standard` - Balanced speed and smoothness
- `lcars_dramatic` - Slower, more cinematic
- `lcars_minimal` - Fast, subtle transitions
- `lcars_realtime` - No animation for live data
- `none` - Disable all animations

#### Tab 10: Advanced
```yaml
style:
  formatters:
    xaxis_label: "HH:mm"      # Template string
    yaxis_label: "{value}°C"  # Template string
    tooltip: "{x|MMM DD}: {y}°C"  # Template string
  typography:
    font_family: "Antonio, Helvetica Neue, sans-serif"
    font_size: 12
  display:
    toolbar: false            # Toggle
  chart_options:              # Raw YAML override
    xaxis:
      type: datetime
```

## Usage Examples

### Example 1: Temperature Chart with Axes Configuration
```yaml
type: custom:lcards-chart
chart_type: line
source: sensor.temperature
style:
  xaxis:
    labels:
      show: true
      rotate: -45
  yaxis:
    labels:
      show: true
  legend:
    show: true
    position: top
    horizontalAlign: center
```

### Example 2: Monochrome Theme
```yaml
type: custom:lcards-chart
chart_type: area
source: sensor.power
style:
  theme:
    mode: dark
    monochrome:
      enabled: true
      color: "#FF9900"
      shade_to: dark
      shade_intensity: 0.65
```

### Example 3: Advanced Formatting
```yaml
type: custom:lcards-chart
chart_type: line
source: sensor.temperature
style:
  formatters:
    xaxis_label: "HH:mm"
    yaxis_label: "{value}°C"
    tooltip: "{x|MMM DD HH:mm}: {y}°C"
  typography:
    font_family: "Antonio"
    font_size: 14
  animation:
    preset: lcars_dramatic
```

## Testing Quick Start

1. Copy `dist/lcards.js` to HA:
   ```bash
   cp dist/lcards.js /path/to/homeassistant/www/community/lcards/
   ```

2. Hard refresh browser: `Ctrl+Shift+R` (Chrome) or `Cmd+Shift+R` (Mac)

3. Open Lovelace dashboard

4. Add new chart card or edit existing

5. Click "Open Configuration Studio"

6. Navigate through all 10 tabs:
   - Data Sources
   - Chart Type
   - Colors
   - Stroke & Fill
   - Markers & Grid
   - **Axes** (NEW)
   - **Legend & Labels** (NEW)
   - **Theme** (NEW)
   - **Animation** (NEW)
   - **Advanced** (NEW)

7. Test each control in the new tabs

8. Verify preview updates as you make changes

9. Save and verify config is correct

## Troubleshooting

### Controls not showing?
- Check browser console for errors
- Verify schema import: `window.lcards.core` should exist
- Hard refresh browser

### Preview not updating?
- Preview has 300ms debounce
- Check for console errors
- Verify chart data is valid

### Color pickers not working?
- Verify lcards-color-section component loaded
- Check for event handling errors
- Try selecting a theme color token

### YAML editor not showing?
- Verify ha-yaml-editor component exists
- Check HA version compatibility
- Try using simple config first

## Known Patterns

### Schema-Driven Controls
```javascript
// In tab render method:
${FormField.renderField(this, 'style.xaxis.labels.show', {
    label: 'Show X-Axis Labels'
})}
```

### Color Pickers
```javascript
// Single color picker:
<lcards-color-section
    .colors=${[value || '#FF9900']}
    .label=${"Color"}
    .maxColors=${1}
    @colors-changed=${(e) => this._setNestedValue(path, e.detail.colors[0])}>
</lcards-color-section>
```

### Conditional Rendering
```javascript
// Show controls only if feature enabled:
${this._getNestedValue('style.legend.show') ? html`
    ${FormField.renderField(this, 'style.legend.position')}
` : ''}
```

## Key Files

- **Dialog:** `src/editor/dialogs/lcards-chart-studio-dialog.js`
- **Schema:** `src/cards/schemas/chart-schema.js`
- **Summary:** `PHASE4_IMPLEMENTATION_SUMMARY.md`
- **Build:** `dist/lcards.js`

## Support

For issues or questions:
1. Check `PHASE4_IMPLEMENTATION_SUMMARY.md` for detailed documentation
2. Review schema definitions in `chart-schema.js`
3. Check browser console for errors
4. Verify HA version compatibility

---

**Ready to test!** All features implemented and build passing. 🎉
