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
| `getPreset(type, name)` | `Object\|null` | Full preset definition, or `null` if not found |
| `getPresetIds(type)` | `string[]` | All preset names for an overlay type |
| `getAvailablePresets(type)` | `Object[]` | Preset objects with metadata for a type |
| `getDebugInfo()` | `Object` | Stats snapshot: pack count, cache size, presets by type |

```javascript
const spm = window.lcards.core.stylePresetManager

// Get a preset definition
const preset = spm.getPreset('button', 'lozenge')

// List what's available
spm.getPresetIds('button')   // ['lozenge', 'bullet', 'capped', ...]
```

Card config `style` always merges *on top of* the preset, so any field can be overridden per-card.

---

## Console Access

::: code-group
```javascript [Snapshot]
window.lcards.debug.singleton('stylePresetManager')
// → { type: 'StylePresetManager', initialized: true, packCount: 3, cacheSize: 24 }
```
```javascript [Live object]
const spm = window.lcards.core.stylePresetManager

spm.getPresetIds('button')       // available button presets
spm.getPreset('slider', 'pills') // full preset config object
spm.getAvailablePresets('elbow') // all elbow presets with metadata
```
:::

---

## Built-in Presets

| Type | Presets |
|---|---|
| `button` | `lozenge`, `bullet`, `capped`, `outline`, `pill`, `text`, `icon` |
| `slider` | `pills`, `gauge` |
| `elbow` | `header_left`, `header_right`, `footer_left`, `footer_right` |

---

## See Also

- [Pack System](pack-system.md)
- [Button Card](../../cards/button/)
- [Slider Card](../../cards/slider-card/)
