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

Alert mode changes are triggered by calling `themeManager.setAlertMode(mode)`. This is typically driven by `AlertMode` service, which watches the `input_select.lcars_alert_mode` helper via `HelperManager` and calls `setAlertMode()` whenever it changes.

When `setAlertMode(mode)` is called, it:
1. Loads user-customised transform parameters from HA helpers (unless `opts.skipHelperLoad` is set, e.g. from the Alert Lab editor)
2. Calls `paletteInjector` which writes new values to CSS custom properties on `:root`
3. Clears the `ThemeTokenResolver` cache so fresh resolves pick up the new values
4. Updates `themeManager.currentAlertMode`
5. Fires all `_alertModeSubscribers` callbacks — **after** CSS vars are written, so it is safe to call `requestUpdate()` directly from the callback

Transform spec (defined in `alertModeTransform.js`):

```javascript
ALERT_MODE_TRANSFORMS['red'] = {
  'palette.moonlight': '#ff2d2d',
  'palette.background': '#2a0000',
  // ...
}
```

Cards using theme tokens in CSS see the change immediately — no re-render needed for CSS-driven styles.

To react to alert mode changes in a card:

```javascript
const tm = window.lcards.core.themeManager;
const unsubscribe = tm.subscribeToAlertMode((mode) => {
    this._alertMode = mode;
    this.requestUpdate();
});
// In disconnectedCallback():
unsubscribe();
```

---

## Scoped Theme Overrides

`ThemeManager` integrates with `ScopedSettingsService` to allow per-device or per-user theme token overrides. Overrides are stored under `STORAGE_KEY_THEME_OVERRIDES` and loaded on startup. They are applied on top of the active theme's token tree, so they survive theme switches.

```javascript
const tm = window.lcards.core.themeManager;

// Load all scopes and apply (called automatically on startup)
await tm.loadOverrides();

// Write an override for a scope ('device', 'user', or 'global')
await tm.setOverride('palette.moonlight', '#ff0000', 'device');

// Clear one override
await tm.clearOverride('palette.moonlight', 'device');
```

Scoped overrides require the `scoped_storage` backend capability — they degrade gracefully when the backend is absent.

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
