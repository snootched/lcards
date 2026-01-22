# Editor Components Guide

## Overview

This guide documents the reusable editor components used in LCARdS card editors. These components provide consistent UI patterns and functionality across all card editors.

## Color Section v2 (`lcards-color-section-v2`)

**Location:** `src/editor/components/editors/lcards-color-section-v2.js`

### Description

Modern list-based color section editor with freeform state support. Matches the UI pattern of animation/filter editors with collapsible items and inline color previews.

### Key Features

- **List-based collapsible items** - Each color state is displayed as an expandable item
- **Inline color preview bar** - 6px height color bar showing the actual color when collapsed
- **Suggested states dropdown** - Quick-add common states (default, active, inactive, unavailable, hover, pressed)
- **Custom state input** - Free-form text input for custom states (validated: alphanumeric + `_-`)
- **Delete capability** - Remove unused states (except 'default' which is required)
- **Duplicate state** - Copy states with unique auto-generated names
- **Backward compatible** - Automatically converts string configs to object format

### Usage

```javascript
import '../components/editors/lcards-color-section-v2.js';

// In your editor's render method:
html`
  <lcards-color-section-v2
    .editor=${this}
    basePath="style.card.color.background"
    header="Background Colors"
    description="Card background color for each state - supports custom states"
    .suggestedStates=${['default', 'active', 'inactive', 'unavailable', 'hover', 'pressed']}
    ?allowCustomStates=${true}
    ?expanded=${false}>
  </lcards-color-section-v2>
`
```

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `editor` | Object | `null` | Parent editor reference (required) |
| `basePath` | String | `''` | Config path (e.g., 'style.card.color.background') |
| `header` | String | `'Colors'` | Section header text |
| `description` | String | `''` | Section description text |
| `expanded` | Boolean | `false` | Initial expanded state of section |
| `suggestedStates` | Array | `['default', 'active', ...]` | Suggested states for dropdown |
| `allowCustomStates` | Boolean | `true` | Allow custom state name input |
| `showPreview` | Boolean | `true` | Show inline color preview bar |
| `variablePrefixes` | Array | `['--lcards-', '--lcars-', '--cblcars-']` | CSS variable prefixes to scan |

### Config Format

#### Input (Simple String)
```yaml
style:
  card:
    color:
      background: "#ff9900"
```

#### Automatically Converted To
```yaml
style:
  card:
    color:
      background:
        default: "#ff9900"
```

#### With Custom States
```yaml
style:
  card:
    color:
      background:
        default: "#888888"
        active: "#ff9900"
        inactive: "#444444"
        idle: "#0099ff"        # Custom state
        buffering: "#ffcc00"  # Custom state
        cleaning: "#00ff99"   # Custom state
```

### Custom State Support in Button Card

The button card already supports freeform state colors through its state resolution logic (see `src/cards/lcards-button.js` line 994-1010):

```javascript
// Priority 2: Entity state (direct or mapped)
if (entityState) {
    // Try direct match first (THIS IS THE FREEFORM SUPPORT!)
    if (style[entityState]) {
        return style[entityState];
    }
    
    // Try mapped state (on → active, off → inactive, etc.)
    const mappedState = this._mapEntityStateToStyleState(entityState);
    if (mappedState && style[mappedState]) {
        return style[mappedState];
    }
}
```

This means you can configure custom states that match your entity's actual states, and the button will automatically use them when the entity enters that state.

### Example Use Cases

#### Media Player States
```yaml
type: custom:lcards-button
entity_id: media_player.living_room
style:
  card:
    color:
      background:
        default: "#888888"
        playing: "#00ff00"      # Custom: entity state 'playing'
        paused: "#ffcc00"       # Custom: entity state 'paused'
        buffering: "#ff9900"    # Custom: entity state 'buffering'
        idle: "#444444"         # Custom: entity state 'idle'
```

#### Vacuum Cleaner States
```yaml
type: custom:lcards-button
entity_id: vacuum.roborock
style:
  card:
    color:
      background:
        default: "#888888"
        active: "#0099ff"
        cleaning: "#00ff99"     # Custom: entity state 'cleaning'
        returning: "#ffcc00"    # Custom: entity state 'returning'
        docked: "#444444"       # Custom: entity state 'docked'
        error: "#ff0000"        # Custom: entity state 'error'
```

#### Climate Control States
```yaml
type: custom:lcards-button
entity_id: climate.thermostat
style:
  card:
    color:
      background:
        default: "#888888"
        heating: "#ff6600"      # Custom: entity state 'heating'
        cooling: "#0099ff"      # Custom: entity state 'cooling'
        fan: "#00ffff"          # Custom: entity state 'fan_only'
        dry: "#ffcc00"          # Custom: entity state 'dry'
        off: "#444444"
```

### Visual Design

The component uses the inline color bar preview (Option 2 from design spec):

```
┌─────────────────────────────────────────────────────┐
│ Background Colors                                  ⌄ │
├─────────────────────────────────────────────────────┤
│                                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │ Default                                   ⌄  │   │
│ │ #888888                                      │   │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │   │ ← Gray bar
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │ Active                                [📋] ⌄  │   │
│ │ #FF9900                                      │   │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │   │ ← Orange bar
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │ Idle (custom)                      [📋] [✖] ⌄ │   │
│ │ #0099FF                                      │   │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │   │ ← Blue bar
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ ┌─────────────────────────────────────────────┐    │
│ │ Add Suggested State          [▼]            │    │
│ │ ┌─────────────────────────────────────────┐ │    │
│ │ │ Custom State Name: [buffering... ]      │ │    │
│ │ │                         [+ Add Custom]  │ │    │
│ │ └─────────────────────────────────────────┘ │    │
│ └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

**Benefits:**
- ✅ Full-width bar is highly visible
- ✅ Fits LCARS aesthetic (horizontal bars)
- ✅ Shows color even when collapsed
- ✅ Hover animation (bar grows slightly)
- ✅ Better for colorblind users (larger target)

### State Name Validation

Custom state names must follow these rules:
- Lowercase alphanumeric characters (`a-z`, `0-9`)
- Underscores (`_`) and hyphens (`-`) allowed
- Cannot be empty
- Cannot duplicate existing state names

**Valid examples:** `idle`, `buffering`, `cleaning-floor`, `state_2`, `custom-state-1`

**Invalid examples:** `Idle` (uppercase), `my state` (space), `state!` (special char)

### Migration from v1 to v2

Color Section v1 (`lcards-color-section`) remains available and functional. Migration is optional but recommended for consistency.

#### Before (v1)
```javascript
import '../components/editors/lcards-color-section.js';

<lcards-color-section
    .editor=${this}
    .config=${this.config}
    basePath="style.card.color.background"
    header="Background Colors"
    description="Card background color for each state"
    .states=${['default', 'active', 'inactive', 'unavailable']}
    ?expanded=${false}>
</lcards-color-section>
```

#### After (v2)
```javascript
import '../components/editors/lcards-color-section-v2.js';

<lcards-color-section-v2
    .editor=${this}
    basePath="style.card.color.background"
    header="Background Colors"
    description="Card background color for each state - supports custom states"
    .suggestedStates=${['default', 'active', 'inactive', 'unavailable', 'hover', 'pressed']}
    ?allowCustomStates=${true}
    ?expanded=${false}>
</lcards-color-section-v2>
```

**Changes:**
- Remove `.config=${this.config}` prop (not needed)
- Change `.states` to `.suggestedStates`
- Add `?allowCustomStates=${true}` to enable custom states
- Add `.config` is no longer needed as v2 uses `editor._getConfigValue()` internally

### Cards Using Color Section v2

- `lcards-button-editor` - Background colors
- `lcards-elbow-editor` - Segment colors
- `lcards-slider-editor` - Border colors (left, top, right, bottom)

### Implementation Notes

#### State Management
- States are stored as an object in config: `{ default: '#color', active: '#color', ... }`
- Empty state list shows "No color states configured" message
- Minimum one state (default) is always required

#### Duplicate Behavior
- Duplicated states get auto-generated names: `original_copy`, `original_copy1`, etc.
- Source color value is copied to the duplicate
- Duplicated state is auto-expanded for immediate editing

#### Delete Behavior
- Confirmation dialog shown before deletion
- 'default' state cannot be deleted (required base state)
- Deleted state is removed from config immediately

#### Expand/Collapse
- Click anywhere in header to toggle expansion
- Action buttons (duplicate, delete) stop event propagation
- Newly added states auto-expand for immediate color selection
- Expanded state shows full `lcards-color-picker` component

### Styling Integration

Uses `editorWidgetStyles` for consistency with animation/filter editors:
- Rounded corners (12px)
- Consistent spacing (12px gaps)
- Hover effects on items
- LCARS color scheme

Additional styles specific to color-section-v2:
- 6px color preview bar
- Hover animation (bar grows to 8px)
- Secondary background for add-state controls

### Logging

Component logs to `[ColorSectionV2]` namespace:
- `debug` - Initialization with config
- `info` - State additions, duplications, deletions
- `warn` - Validation errors

Enable debug logging:
```javascript
window.lcards.setGlobalLogLevel('debug')
```

---

## Other Editor Components

### Color Section v1 (`lcards-color-section`)

**Status:** Legacy, still supported

Original color section with fixed state list. Use v2 for new implementations.

### Color Picker (`lcards-color-picker`)

Unified color picker with CSS variable dropdown, custom color input, and live preview.

See: `src/editor/components/shared/lcards-color-picker.js`

### Form Section (`lcards-form-section`)

Collapsible section container for grouping related form fields.

See: `src/editor/components/shared/lcards-form-section.js`

### Animation Editor (`lcards-animation-editor`)

List-based editor for animation configurations.

See: `src/editor/components/lcards-animation-editor.js`

### Filter Editor (`lcards-filter-editor`)

List-based editor for CSS/SVG filter configurations.

See: `src/editor/components/lcards-filter-editor.js`

---

## Best Practices

### When to Use Color Section v2

✅ **Use v2 when:**
- Editor supports state-based colors
- Users might need custom states (media players, vacuums, etc.)
- You want consistent modern UI with animation/filter editors

❌ **Don't use v2 when:**
- Only single color needed (use `lcards-color-picker` directly)
- Multiple independent colors (use v1 with `colorPaths`)

### Component Selection Guide

| Use Case | Component |
|----------|-----------|
| Single color | `lcards-color-picker` |
| Multiple independent colors | `lcards-color-section` (v1) with `colorPaths` |
| State-based colors (fixed states) | `lcards-color-section` (v1) |
| State-based colors (custom states) | `lcards-color-section-v2` ⭐ |

### Consistent Patterns

All list-based editors (animation, filter, color-v2) share these patterns:
- Collapsible items with expand icon
- Action buttons (duplicate, delete) in header
- Add controls at bottom
- Uses `editorWidgetStyles`
- Rounded corners (12px)
- Consistent spacing (12px gaps)

---

## Future Enhancements

Potential improvements for color-section-v2:
- [ ] Drag-and-drop reordering of states
- [ ] Import/export state color palettes
- [ ] Color picker presets specific to state type
- [ ] Bulk edit (apply same color to multiple states)
- [ ] State color history/undo
- [ ] Integration with theme token browser

---

*Last Updated: January 2026*
*Version: LCARdS v1.20.01*
