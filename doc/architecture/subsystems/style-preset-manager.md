# Style Preset Manager

> **`window.lcards.core.stylePresetManager`**: registry of named style presets (button and slider) from packs.

---

## Overview

`StylePresetManager` (`src/core/presets/StylePresetManager.js`) stores the `style_presets` of every pack and returns a preset by card type and name, with its `extends` chain merged and, when a `ThemeManager` is passed, its `theme:` tokens resolved. A preset is a partial card config: when a card sets `preset: lozenge`, `CoreConfigManager` merges the preset as one layer of the config. It is a plain class (it does not extend `BaseService`); the core also exposes it as `core.getStylePresetManager()` and `window.lcards.styleResolver` (`src/lcards-main.js`).

Elbow shapes are not presets: they are `ComponentManager` components (see [Component Manager](component-manager.md)).

---

## Registration

`PackManager.registerPack()` calls `registerPresetsFromPack(pack)` for every pack with `style_presets` (`src/core/PackManager.js`). It appends the pack to `loadedPacks` (once per pack id), rebuilds the lookup cache and sets `initialized`. `initialize(packs)` / `reinitialize(packs)` replace the whole pack list at once; the core does not call them.

Packs that ship presets:

| Pack | Type key | Source |
|---|---|---|
| `lcards_buttons` | `button` | `src/core/packs/style-presets/buttons/index.js` (`BUTTON_PRESETS`) |
| `lcards_sliders` | `slider` | `src/core/packs/style-presets/sliders/index.js` (`SLIDER_PRESETS`) |

The cache key is `<type>.<name>` (`button.lozenge`, `slider.pills-basic`). `_buildPresetCache()` walks the packs in registration order, so when two packs define the same key the later pack's preset is the one returned.

---

## Preset Shape

A preset has the same structure as the card config it applies to (the same schema), plus three registry-only keys that `CoreConfigManager._getPresetConfig()` strips before the merge: `extends`, `description`, `compatibleComponents`. Example (`button.base`, abbreviated, and `button.lozenge`):

```javascript
// src/core/packs/style-presets/buttons/index.js
base: {
  min_height: 'theme:components.button.layout.minHeight',
  show_icon: false,
  card: {
    color: {
      background: {
        default: 'theme:components.button.background.default',
        active: 'theme:components.button.background.active',
        inactive: 'theme:components.button.background.inactive'
        // unavailable, hover, pressed
      }
    }
  },
  text: {
    default: {
      position: 'center-right',
      font_family: 'theme:components.button.text.font_family',
      font_size: 'theme:components.button.text.font_size'
      // color: { default, active, inactive, unavailable }, ...
    },
    name: { position: 'bottom-right', content: '{entity.attributes.friendly_name}', show: false },
    state: { position: 'top-right', content: '{entity.state}', show: false }
    // label: { ... }
  }
  // border, ...
},

lozenge: {
  extends: 'button.base',
  icon_area: 'left',
  border: {
    width: 0,
    radius: {
      top_left: 'theme:components.button.radius.full',
      top_right: 'theme:components.button.radius.full',
      bottom_left: 'theme:components.button.radius.full',
      bottom_right: 'theme:components.button.radius.full'
    }
  }
  // icon_style, text padding ...
}
```

- Values that come from the theme are `theme:` tokens (`theme:components.button.radius.full`), never literal colours.
- `extends: '<type>.<name>'` names the parent. `_resolveExtends()` resolves the parent's own chain first (tokens left unresolved), then `deepMergeImmutable(parent, child)`; the merged result has its tokens resolved once at the end. A circular chain logs a warning and stops.
- A preset named `base` exists only to be extended: `getAvailablePresets()` leaves it out, but `getPreset(type, 'base')` still returns it.

---

## Lookup

`getPreset(overlayType, presetName, themeManager?)`:

1. Tries `<overlayType>.<presetName>`.
2. For a button-like type, then tries `button.<presetName>`. Button-like types are `button` and `select-menu` (`_isButtonLikeOverlay()`); so a select menu gets every button preset, applied to its embedded buttons.
3. Checks the cache first, then the packs (`_findPresetInPacks()`, which also fills the cache).
4. Passes the hit through `_resolvePreset()`: the `extends` merge, then `resolveThemeTokensRecursive(preset, themeManager)` (`src/utils/lcards-theme.js`) when a theme manager was given. That helper replaces strings that start with `theme:` and evaluates computed colour expressions, except those containing `match-light` / `match-brightness`, which the card resolves per render.

It returns `null` (with a warning) before the first pack registers, and `null` when nothing matches.

Callers:

- `CoreConfigManager._getPresetConfig(cardType, userConfig)` (`src/core/config-manager/index.js`) passes the theme manager and uses the result as the preset layer of the merge (behavioral, theme, preset, component, user). The user's config always wins. When the preset is not found and the config also has `component`, the name is taken as a component preset (for example `alert`'s `condition_red`), resolved by the card, and only a trace is logged.
- `LCARdSCard.getStylePreset(overlayType, presetName)` (`src/base/LCARdSCard.js`) for cards that look presets up themselves.
- The slider editor lists `getAvailablePresets('slider')` and reads each with `getPreset()` (`src/editor/cards/lcards-slider-editor.js`); the Pack Explorer uses `getAllPresetsWithSource()`.

---

## Built-in Presets

`spm.getPresetNames(type)` is the authoritative list at runtime. In this build:

| Type | Presets |
|---|---|
| `button` | `lozenge`, `lozenge-right`, `bullet`, `bullet-right`, `capped`, `capped-right`, `barrel`, `barrel-right`, `filled`, `filled-right`, `outline`, `outline-right`, `icon`, `text-only`, `bar-label-base`, nine `bar-label-*` variants (`left`, `center`, `right`, `square`, `lozenge`, `bullet-left`, `bullet-right`, `capped-left`, `capped-right`), `panel-light`, `panel-dark`, `panel-flagged`, `toggle-tab` (plus `base`) |
| `slider` | `pills-basic`, `pills-left-border`, `pills-left-border-rounded`, `gauge-basic`, `gauge-left-border`, `gauge-left-border-rounded`, `shaped-vertical`, `shaped-horizontal`, `ring`, `picard-ring`, `picard-gauge-vertical` (plus `base`) |

The user-facing tables are in `doc/core/presets.md`, kept in step with the packs by `tests/core/presets-doc.test.js`.

---

## Public API

| Method | Returns | Description |
|---|---|---|
| `initialize(packs)` | `Promise<void>` | Replace the pack list, rebuild the cache |
| `reinitialize(packs)` | `Promise<void>` | `clearCache()` then `initialize(packs)` |
| `registerPresetsFromPack(pack)` | `void` | Add one pack's `style_presets` (called by `PackManager`) |
| `getPreset(type, name, themeManager?)` | `Object\|null` | Preset with `extends` merged, tokens resolved when `themeManager` is given (see [Lookup](#lookup)) |
| `hasPreset(type, name)` | `boolean` | `getPreset(type, name) !== null` (so it includes the button fallback) |
| `getAvailablePresets(type)` | `string[]` | Names for a type, plus button presets for button-like types; `base` left out |
| `getPresetNames(type)` | `string[]` | `getAvailablePresets(type)` with an `initialized` guard (`[]` before the first pack) |
| `getPresetMetadata(type, name)` | `Object\|null` | `{ id, type, extends, description, pack, presetType }` for an exact `type.name` (no button fallback) |
| `getAllPresetsWithSource()` | `Object` | `{ [type]: metadata[] }` for every type, for the Pack Explorer |
| `getAvailableOverlayTypes()` | `string[]` | Types with at least one preset (`['button', 'slider']`) |
| `clearCache()` / `destroy()` | `void` | Empty the lookup cache (lookups refill it from the packs) |
| `getDebugInfo()` | `Object` | See the snapshot below |

`getAvailablePresets()` and `getPresetNames()` return plain names. The metadata form is `getPresetMetadata()` / `getAllPresetsWithSource()`.

---

## Console Access

::: code-group
```javascript [Snapshot]
window.lcards.debug.singleton('stylePresetManager')
// → {
//   initialized: true,
//   packCount: 2,
//   cacheSize: 41,
//   packDetails: [
//     { id: 'lcards_buttons', version: '<build version>', hasStylePresets: true, categories: ['button'] },
//     { id: 'lcards_sliders', version: '<build version>', hasStylePresets: true, categories: ['slider'] }
//   ],
//   presetsByType: { button: ['lozenge', 'lozenge-right', ...], slider: ['pills-basic', ...] },
//   universalPresets: { button: ['base', 'lozenge', ...] }
// }
```
```javascript [Live object]
const spm = window.lcards.core.stylePresetManager
const tm = window.lcards.core.themeManager

spm.getPresetNames('button')                 // button preset names (string[])
spm.getPreset('slider', 'pills-basic')       // extends merged, theme: tokens left as is
spm.getPreset('slider', 'pills-basic', tm)   // tokens resolved too
spm.getPreset('select-menu', 'lozenge')      // falls back to button.lozenge
spm.getPresetMetadata('button', 'lozenge')   // { id, type, extends: 'button.base', description, pack, presetType }
```
:::

---

## See Also

- [Pack System](pack-system.md)
- [Theme System](theme-system.md)
- [Button Card](../../cards/button/)
- [Slider Card](../../cards/slider-card/)
