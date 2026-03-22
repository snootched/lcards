# Theme System

> **`window.lcards.core.themeManager`** — Token-based theming with alert-mode palette transformations.

---

## Overview

`ThemeManager` extends `BaseService`. It holds a registry of loaded themes, resolves token paths to concrete values, and manages the active theme. During alert mode it injects palette transforms directly into CSS custom properties so all cards update without re-rendering.

---

## Key Classes

| Class | File | Role |
|---|---|---|
| `ThemeManager` | `core/themes/ThemeManager.js` | Theme registry, activation, token resolution |
| `ThemeTokenResolver` | `core/themes/ThemeTokenResolver.js` | Path-based token lookup (`palette.moonlight` etc.) |
| `paletteInjector` | `core/themes/paletteInjector.js` | Writes CSS custom properties for alert palette swaps |
| `alertModeTransform` | `core/themes/alertModeTransform.js` | Loads per-alert-condition colour transforms from helpers |
| `alertTransitions` | `core/themes/alertTransitions.js` | Smooth CSS colour transitions during alert state change |

---

## Theme Token Structure

```javascript
{
  palette: {
    moonlight: '#99ccff',
    'alert-red': '#ff2d2d',
    // ...
  },
  spacing: { small: '4px', medium: '8px', large: '16px' },
  borders: { radius: '8px', width: '2px' },
  components: {
    button: { background: '{palette.moonlight}', height: '40px' },
    // ...
  }
}
```

Tokens can reference other tokens by path: `'{palette.moonlight}'`.

---

## Built-in Themes

| ID | Description |
|---|---|
| `lcars-default` | Standard LCARS orange/blue palette |
| `lcars-dark` | Dark variant |
| `cb-lcars` | Retro CB-LCARS compatible palette |

---

## Token Usage

In card config any colour or style field accepts a theme token:

```yaml
style:
  background: "{theme:palette.moonlight}"
  border-color: "{theme:palette.alert-red}"
```

In JavaScript:

```javascript
const theme = window.lcards.core.themeManager.getCurrentTheme();
const color = theme.palette.moonlight;
```

---

## Alert Mode Integration

When alert mode changes, `paletteInjector` replaces CSS custom properties on `:root`, applying colour transforms from `ALERT_MODE_TRANSFORMS`. Cards using theme tokens in CSS see the change immediately — no re-render needed.

Transform spec:

```javascript
ALERT_MODE_TRANSFORMS['red'] = {
  'palette.moonlight': '#ff2d2d',
  'palette.background': '#2a0000',
  // ...
}
```

---

## Public API

| Method | Returns | Description |
|---|---|---|
| `getCurrentTheme()` | `ThemeObject` | Full active theme (tokens, palette, spacing, …) |
| `getActiveTheme()` | `ThemeObject` | Alias for `getCurrentTheme()` |
| `setActiveTheme(id)` | `void` | Switch to a registered theme by ID |
| `listThemes()` | `string[]` | All registered theme IDs |
| `resolveToken(path)` | `string\|null` | Resolve a dot-path token against the active theme |
| `getToken(path, fallback?)` | `string` | Resolve token with a default fallback value |
| `getAlertMode()` | `string` | Current alert mode (`'green'`, `'red'`, `'yellow'`) |
| `setAlertMode(mode)` | `void` | Trigger alert mode change (updates CSS vars + fires events) |
| `getRegisteredThemes()` | `Map<id, Theme>` | All loaded theme objects |

---

## Console Access

::: code-group
```javascript [Snapshot]
window.lcards.debug.singleton('themeManager')
// → { type: 'ThemeManager', activeTheme: 'lcars-default', themeCount: 3, alertMode: 'green' }
```
```javascript [Live object]
const tm = window.lcards.core.themeManager

tm.getCurrentTheme()          // active theme object (tokens, palette, etc.)
tm.getActiveTheme()           // alias for getCurrentTheme()
tm.setActiveTheme('cb-lcars') // switch active theme
tm.listThemes()               // all registered theme IDs
tm.resolveToken('palette.moonlight')   // resolve token path to value
tm.getToken('palette.moonlight', '#fff') // resolve with fallback
tm.getAlertMode()             // current alert mode string
tm.setAlertMode('red')        // trigger alert mode change
tm.getRegisteredThemes()      // Map of all loaded theme objects
```
:::

---

## See Also

- [Alert Mode](../../core/alert-mode.md)
- [Pack System](pack-system.md)
