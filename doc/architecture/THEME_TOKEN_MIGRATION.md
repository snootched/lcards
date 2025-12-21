# Theme Token Refactor - Migration Guide

## Overview

The LCARdS theme token system has been refactored in v1.15.0+ to be more minimal, component-driven, and properly integrated with HA-LCARS theme variables.

## Key Changes

### 1. CB-LCARS Palette Injection

The CB-LCARS `green_alert` palette is now injected as CSS variables at runtime:

- **Format**: `--lcards-<hue>-<shade>` (e.g., `--lcards-orange-medium`, `--lcards-gray-dark`)
- **Hues**: orange, gray, blue, green, yellow, plus moonlight
- **Shades**: darkest, dark, medium-dark, medium, medium-light, light, lightest

These variables are automatically available before any components render.

### 2. Color Token Hygiene

**Renamed**:
- `colors.status.danger` → `colors.status.error`

**Fallback Pattern**:
All color tokens now follow this pattern:
```
var(--lcars-<name>, var(--lcards-<hue>-<shade>))
```

This provides:
1. Primary: HA-LCARS theme variable (e.g., `--lcars-card-button`)
2. Fallback: CB-LCARS palette variable (e.g., `--lcards-gray-medium-light`)

### 3. Minimal Token Schema

**Removed unused token categories**:
- `colors.accent.*` (use `colors.ui.*` or `colors.card.*` instead)
- `colors.lcars.*` (use CSS variables directly)
- `colors.alert.*` (use `colors.status.error`)
- `spacing.scale` (extensive spacing system not used)
- `effects.*` (shadows, glow, blur - not used in current components)
- `animations.*` (handled by AnimationManager)
- `components.line.*` (MSD-specific, not used in cards)
- `components.text.*` (MSD-specific overlays)
- `components.statusGrid.*` (not implemented yet)

**Component-specific tokens**:
Tokens are now organized by component:
- `components.button.*`
- `components.elbow.*`
- `components.slider.*`
- `components.chart.*`
- `components.dpad.*`

### 4. Updated Token Paths

**Button component**:
```js
// OLD (no longer supported)
components.button.base.background.default

// NEW
components.button.background.default
```

**Text styling**:
```js
// OLD
colors.ui.foreground

// NEW
colors.text.onLight  // for text on light backgrounds
colors.text.onDark   // for text on dark backgrounds
```

## Migration for Theme Pack Authors

### If you're creating a custom theme:

1. **Use the new color token structure**:
```yaml
tokens:
  colors:
    card:
      button: 'var(--lcars-card-button, var(--lcards-blue-medium))'
      buttonOff: 'var(--lcars-card-button-off, var(--lcards-gray-medium))'
```

2. **Reference shared tokens**:
```yaml
components:
  button:
    background:
      default: 'colors.card.button'  # Token reference
    text:
      color:
        default: 'colors.text.onLight'  # Token reference
```

3. **Update status references**:
```yaml
# OLD
color: 'colors.status.danger'

# NEW
color: 'colors.status.error'
```

### If you're extending an existing theme:

Your theme will automatically inherit the new minimal schema. No changes required unless you were referencing removed tokens.

## Available CSS Variables

### From HA-LCARS (if theme is installed):
- `--lcars-font`
- `--lcars-text-gray`
- `--lcars-ui-primary`
- `--lcars-ui-secondary`
- `--lcars-ui-tertiary`
- `--lcars-ui-quaternary`
- `--lcars-card-button`
- `--lcars-card-button-off`
- `--lcars-card-button-unavailable`
- `--lcars-card-top-color`
- `--lcars-card-bottom-color`
- `--lcars-orange`, `--lcars-blue`, `--lcars-yellow`, `--lcars-white`, etc.

### From LCARdS (always available):
- `--lcards-orange-{darkest,dark,medium-dark,medium,medium-light,light,lightest}`
- `--lcards-gray-{darkest,dark,medium-dark,medium,medium-light,light,lightest}`
- `--lcards-blue-{darkest,dark,medium-dark,medium,medium-light,light,lightest}`
- `--lcards-green-{darkest,dark,medium-dark,medium,medium-light,light,lightest}`
- `--lcards-yellow-{darkest,dark,medium-dark,medium,medium-light,light,lightest}`
- `--lcards-moonlight`

## Examples

### Custom button colors:
```yaml
type: custom:lcards-button
entity: light.bedroom
style:
  background: 'var(--lcards-blue-medium)'
  border_color: 'var(--lcards-blue-dark)'
  text_color: 'var(--lcards-moonlight)'
```

### Using theme tokens:
```yaml
type: custom:lcards-button
entity: switch.fan
# No style overrides - uses theme tokens automatically
# Falls back to --lcards-* colors if HA-LCARS not installed
```

## Troubleshooting

### Colors not showing correctly:
1. Check browser console for any CSS variable warnings
2. Verify HA-LCARS theme is installed (or rely on --lcards-* fallbacks)
3. Clear browser cache

### Token not found errors:
1. Check that you're using the new token paths (see migration guide above)
2. Refer to the backup file: `src/core/themes/tokens/lcarsClassicTokens.js.backup`

## Support

For questions or issues, please open an issue on GitHub with:
- Your theme configuration
- Browser console errors (if any)
- Expected vs actual behavior
