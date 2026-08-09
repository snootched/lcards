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

Only one theme ships in the core theme pack (`core/packs/builtin-themes.js`) today:

| ID | Description |
|---|---|
| `lcards-default` | Default LCARdS theme, built for HA-LCARS integration (also the pack's `defaultTheme`) |

`tm.listThemes()` in the console is the authoritative list if a pack has registered additional themes at runtime.

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
const theme = window.lcards.core.themeManager.getActiveTheme();
const color = theme.palette.moonlight;
```

Note: `ThemeManager` has no `getCurrentTheme()` method — only `getActiveTheme()`. The returned object is `{ id, name, description, packId, tokens, ...tokens }`: the raw token tree is available both nested under `.tokens` and spread onto the top level (so `theme.palette` and `theme.tokens.palette` are the same data).

---

## Alert Mode Integration

Alert mode changes are triggered by calling `themeManager.setAlertMode(mode)`. This is typically driven by `AlertMode` service, which watches the `input_select.lcars_alert_mode` helper via `HelperManager` and calls `setAlertMode()` whenever it changes.

`setAlertMode()` calls are serialized — each call chains onto an internal queue, so back-to-back calls (e.g. rapid alert-mode switching) always finish applying in the order they were issued, even though the work itself is async. Returns a `Promise<void>` that resolves once this call's own turn has fully applied.

When a call reaches the front of the queue, it:
1. Loads user-customised transform parameters from HA helpers (unless `opts.skipHelperLoad` is set, e.g. from the Alert Lab editor)
2. Calls `paletteInjector` which writes new values to CSS custom properties on `:root`
3. Clears the `ThemeTokenResolver` cache so fresh resolves pick up the new values
4. Updates `themeManager.currentAlertMode`
5. Fires all `_alertModeSubscribers` callbacks — **after** CSS vars are written, so it is safe to call `requestUpdate()` directly from the callback

Transform spec (defined in `alertModeTransform.js`). Alert mode keys always carry the `_alert` suffix — `green_alert`, `red_alert`, `yellow_alert`, `blue_alert`, `gray_alert`, `black_alert`, `borg_alert` — and each transform is an HSL hue-shift/anchor spec, not a literal palette-token map:

```javascript
ALERT_MODE_TRANSFORMS['red_alert'] = {
  hueShift: 0,                    // target red
  hueStrength: 0.8,
  saturationMultiplier: 1.4,
  lightnessMultiplier: 0.9,
  hueAnchor: { centerHue: 0, range: 60, strength: 0.9 }
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
| `getActiveTheme()` | `ThemeObject\|null` | Full active theme: `{ id, name, description, packId, tokens, ...tokens }` |
| `activateTheme(themeId, rootElement?)` | `Promise<void>` | Switch to a registered theme by ID; throws if the theme (or its tokens) isn't found |
| `listThemes()` / `getThemeIds()` | `string[]` | All registered theme IDs (`getThemeIds()` is an alias of `listThemes()`) |
| `getTheme(themeId)` | `Object\|null` | `{ id, name, description, packId, hasCssFile }` for one theme |
| `getThemesWithMetadata()` | `Object[]` | `{ id, name, description, version, pack, type, tokenCount, hasCssFile }` for every theme |
| `getToken(path, fallback?, context?)` | `*` | Resolve a token path against the active theme, via `this.resolver.resolve()` |
| `getDefault(componentType, property, fallback?, context?)` | `*` | Resolve `components.<componentType>.<property>` |
| `getAlertMode()` | `string` | Current alert mode (`'green_alert'`, `'red_alert'`, `'yellow_alert'`, `'blue_alert'`, `'gray_alert'`, `'black_alert'`, `'borg_alert'`) |
| `setAlertMode(mode, opts?)` | `Promise<void>` | Trigger alert mode change (updates CSS vars + fires events); calls are serialized/queued |
| `loadOverrides()` / `setOverride()` / `clearOverride()` | `Promise<void>` | Scoped token override management — see [Scoped Theme Overrides](#scoped-theme-overrides) above |

---

## Console Access

::: code-group
```javascript [Snapshot]
window.lcards.debug.singleton('themeManager')
// → {
//   initialized: true,
//   activeTheme: { id: 'lcars-default', name: 'LCARS Classic', description: '...', packId: 'builtin_themes', tokens: {...}, /* ...tokens spread */ },
//   availableThemes: [
//     { id: 'lcars-default', name: 'LCARS Classic', description: '...', packId: 'builtin_themes', hasCssFile: false },
//     // ...
//   ],
//   resolverCacheSize: 87,
//   themeCount: 3
// }
```
```javascript [Live object]
const tm = window.lcards.core.themeManager

tm.getActiveTheme()                       // active theme object ({ id, name, tokens, ...tokens })
await tm.activateTheme('cb-lcars')        // switch active theme (async)
tm.listThemes()                           // all registered theme IDs
tm.getToken('palette.moonlight', '#fff')  // resolve a token path with a fallback
tm.getAlertMode()                         // current alert mode string, e.g. 'green_alert'
await tm.setAlertMode('red_alert')        // trigger alert mode change
tm.getThemesWithMetadata()                // full metadata array for every loaded theme
```
:::

---

## See Also

- [Alert Mode](../../core/alert-mode.md)
- [Pack System](pack-system.md)
