# Component Manager

> **`window.lcards.core.componentManager`** — Registry of SVG component definitions for button component mode.

---

## Overview

`ComponentManager` holds named component definitions loaded from packs. Components are structured SVG objects where each named segment can receive independent style, action, and text config. Cards in **component mode** query the registry at render time rather than importing SVG data directly.

---

## File

`src/core/components/ComponentManager.js`

---

## Built-in Components

| Component ID | Description |
|---|---|
| `dpad` | D-pad directional control (9 segments: up/down/left/right, 4 diagonal corners, center) |
| `dpad_voyager` | Alternate D-pad visual variant |
| `alert` | Alert shield shape (2 segments: shape, bars) |
| `header-left` / `header-right` / `footer-left` / `footer-right` / `header-contained` / `footer-contained` | Elbow shape variants (distributed via `lcards_elbows` pack — no `elbow_` prefix on the IDs) |

---

## Component Definition Structure

```javascript
{
  // Inline SVG markup (viewBox and all segment <path> elements live inside this string)
  svg: `<svg viewBox="0 0 80 80">...<path id="up" d="M..."/>...</svg>`,

  orientation: 'square',
  features: ['multi-segment', 'state-based-styling', 'zones', 'text-overlay'],

  // Named rectangular regions in viewBox coordinate space — used for text overlay placement
  zones: {
    up: { x: 34, y: 0.5, width: 12, height: 9.5 },
    // ... down / left / right / center / up_left / up_right / down_left / down_right
  },

  // Default per-segment styling (theme-token references, not literal colors)
  segments: {
    up: {
      style: {
        fill: 'theme:components.dpad.segment.directional.fill',
        stroke: 'theme:components.dpad.segment.directional.stroke',
        'stroke-width': 'theme:components.dpad.segment.directional.stroke-width',
      }
    },
    // ... down / left / right / up-left / up-right / down-left / down-right / center
  },

  presets: { default: {} },
  validatePreset(presetName) { return presetName in this.presets; },
  getPresetNames() { return Object.keys(this.presets); },

  metadata: {
    type: 'dpad',           // Required — used by ComponentManager for getComponentsByType()
    card_type: 'button',    // Which card editor this component is valid for
    pack: 'lcards_buttons',
    id: 'dpad',
    name: 'D-Pad Control',
    description: 'Interactive directional control with 9 segments',
    version: '1.0.0',
  }
}
```

Per-segment actions (`tap_action`, etc.) are not part of the component definition — they're supplied by the card config (e.g. `dpad.segments.up.tap_action`) and merged on top of these defaults at render time.

---

## Pack Registration

```javascript
// Inside a pack:
export const ELBOW_PACK = {
  components: {
    'header-left': { ... },
    'footer-right': { ... },
  }
};
```

---

## Public API

| Method | Returns | Description |
|---|---|---|
| `getComponent(name)` | `Object\|undefined` | Full component definition by name |
| `getComponentMetadata(name)` | `Object\|null` | Just the `metadata` block (or a minimal fallback for legacy components without one) |
| `hasComponent(name)` | `boolean` | True if a component with this name is registered |
| `getAllComponentNames()` | `string[]` | All registered component names |
| `getComponentsByType(type)` | `string[]` | Names of all components matching a type string — **names only**, not full definitions |
| `getComponentTypes()` | `string[]` | All distinct type strings in use |
| `registerComponentsFromPack(pack)` | `void` | Bulk-register `pack.components`, tagging each with `pack: pack.id` |

```javascript
const cm = window.lcards.core.componentManager;

// Get component definition
const def = cm.getComponent('dpad');

// Check existence
cm.hasComponent('dpad')  // true

// List all
cm.getAllComponentNames()     // ['dpad', 'dpad_voyager', 'alert', 'header-left', ...]
cm.getComponentsByType('dpad') // ['dpad', 'dpad_voyager']
```

---

## Button Component Mode

When a button card has `component: dpad` in config, it:
1. Retrieves the definition from `componentManager`
2. Builds one SVG path element per segment
3. Attaches per-segment style, text, and action from config overrides merged on top of definition defaults

---

## Console Access

::: code-group
```javascript [Snapshot]
window.lcards.debug.singleton('componentManager')
// → { initialized: true, totalComponents: 11, componentsByType: { dpad: 2, alert: 1, elbow: 6, slider: 3 },
//      componentNames: ['dpad', 'dpad_voyager', 'alert', 'header-left', ...] }
```
```javascript [Live object]
const cm = window.lcards.core.componentManager

cm.getAllComponentNames()     // all registered names
cm.getComponent('dpad')       // full definition with segments/zones/metadata
cm.hasComponent('dpad')       // existence check
cm.getComponentsByType('dpad') // names of that type (string[], not full defs)
```
:::

---

## See Also

- [Button Card — Component Mode](../../cards/button/)
- [Asset Manager](asset-manager.md)
- [Pack System](pack-system.md)
