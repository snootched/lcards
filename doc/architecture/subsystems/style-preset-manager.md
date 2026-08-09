# Style Preset Manager

> **`window.lcards.core.stylePresetManager`** — Central registry of named style presets for buttons, sliders, and elbows.

---

## Overview

`StylePresetManager` stores named preset objects loaded from packs. When a card config declares `preset: lozenge`, the manager resolves the full style definition so the card never needs to hard-code shape geometry or default sizes.

---

## File

`src/core/presets/StylePresetManager.js`

---

## Preset Namespacing

Presets are keyed by `type.name`, e.g. `button.lozenge`, `slider.pills`, `elbow.header_left`. The card type is always implicit from the registering pack.

---

## Pack Registration

Packs contributed through `style_presets`:

```javascript
export const BUTTONS_PACK = {
  style_presets: {
    button: {
      lozenge: {
        shape: 'lozenge',
        height: 40,
        border_radius: 20,
        // ...
      },
      bullet: { shape: 'bullet', ... },
      pill:   { shape: 'pill',   ... },
    }
  }
};
```

---

## Public API

| Method | Returns | Description |
|---|---|---|
| `getPreset(type, name, themeManager?)` | `Object\|null` | Full preset definition (extends chain resolved, theme tokens resolved if a `themeManager` is passed), or `null` if not found |
| `getPresetNames(type)` | `string[]` | All preset names for an overlay type (plain strings, `'base'` filtered out) |
| `getAvailablePresets(type)` | `string[]` | Same array as `getPresetNames(type)` — `getPresetNames` is a thin wrapper around this with an `initialized` guard |
| `getPresetMetadata(type, name)` | `Object\|null` | Metadata for one preset: `{ id, type, extends, description, pack, presetType }` |
| `getAllPresetsWithSource()` | `Object` | `{ [overlayType]: metadata[] }` for every type — used to build the Pack Explorer tree |
| `hasPreset(type, name)` | `boolean` | Whether a preset exists |
| `getAvailableOverlayTypes()` | `string[]` | All overlay types that have at least one preset registered |
| `getDebugInfo()` | `Object` | Stats snapshot: pack count, cache size, presets by type, pack details |

Note: `getAvailablePresets()`/`getPresetNames()` return **plain preset-name strings**, not objects — use `getPresetMetadata(type, name)` or `getAllPresetsWithSource()` for the metadata-bearing form (`{ id, type, extends, description, pack, presetType }`).

```javascript
const spm = window.lcards.core.stylePresetManager

// Get a preset definition
const preset = spm.getPreset('button', 'lozenge')

// List what's available
spm.getPresetNames('button')   // ['lozenge', 'bullet', 'capped', ...]
```

Card config `style` always merges *on top of* the preset, so any field can be overridden per-card.

---

## Console Access

::: code-group
```javascript [Snapshot]
window.lcards.debug.singleton('stylePresetManager')
// → {
//   initialized: true,
//   packCount: 3,
//   cacheSize: 24,
//   packDetails: [
//     { id: 'lcards_buttons', version: '2026.08.0', hasStylePresets: true, categories: ['button'] },
//     { id: 'lcards_sliders', version: '2026.08.0', hasStylePresets: true, categories: ['slider'] },
//     // ...
//   ],
//   presetsByType: { button: ['lozenge', 'bullet', 'capped', ...], slider: ['pills-basic', 'gauge-basic', ...] },
//   universalPresets: { button: ['lozenge', 'bullet', 'capped', ...] }
// }
```
```javascript [Live object]
const spm = window.lcards.core.stylePresetManager

spm.getPresetNames('button')                    // available button preset names (string[])
spm.getPreset('slider', 'pills-basic')          // full preset config object
spm.getPresetMetadata('button', 'lozenge')      // { id, type, extends, description, pack, presetType }
spm.getAllPresetsWithSource()                   // { overlayType: metadata[] } for every type
```
:::

---

## Built-in Presets

Preset catalogs change as packs evolve — `spm.getPresetNames(type)` in the console is the authoritative current list. As of this build:

| Type | Presets |
|---|---|
| `button` | `lozenge`, `lozenge-right`, `bullet`, `bullet-right`, `capped`, `capped-right`, `barrel`, `barrel-right`, `filled`, `filled-right`, `outline`, `outline-right`, `icon`, `text-only`, six `bar-label-*` variants, `panel-light`, `panel-dark` |
| `slider` | `pills-basic`, `pills-left-border`, `pills-left-border-rounded`, `gauge-basic`, `gauge-left-border`, `gauge-left-border-rounded`, `shaped-vertical`, `shaped-horizontal`, `picard-gauge-vertical` |

`elbow` shapes (`header-left`, `header-right`, `footer-left`, `footer-right`) are **not** `StylePresetManager` presets — elbows are structural path generators registered as `ComponentManager` components instead: `window.lcards.core.componentManager.getComponentsByType('elbow')`. See [Component Manager](component-manager.md).

---

## See Also

- [Pack System](pack-system.md)
- [Button Card](../../cards/button/)
- [Slider Card](../../cards/slider-card/)
