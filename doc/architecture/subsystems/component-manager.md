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
| `dpad` | D-pad directional control (5 segments: up/down/left/right/center) |
| `alert` | Alert diamond shape (single segment) |
| `elbow_*` | Elbow shape variants (distributed via elbow pack) |

---

## Component Definition Structure

```javascript
{
  id: 'dpad',
  type: 'component',
  segments: {
    up:     { path: 'M...', label: 'Up' },
    down:   { path: 'M...', label: 'Down' },
    left:   { path: 'M...', label: 'Left' },
    right:  { path: 'M...', label: 'Right' },
    center: { path: 'M...', label: 'Center' },
  },
  viewBox: '0 0 100 100',
  defaults: {
    up:    { action: { tap_action: { action: 'call-service', ... } } },
    // ...
  }
}
```

---

## Pack Registration

```javascript
// Inside a pack:
export const ELBOW_PACK = {
  components: {
    'elbow_header_left': { ... },
    'elbow_footer_right': { ... },
  }
};
```

---

## Public API

| Method | Returns | Description |
|---|---|---|
| `getComponent(id)` | `Object\|null` | Full component definition by ID, or null |
| `hasComponent(id)` | `boolean` | True if a component with this ID is registered |
| `getComponentIds()` | `string[]` | All registered component IDs |
| `getComponentsByType(type)` | `Object[]` | All components matching a type string |

```javascript
const cm = window.lcards.core.componentManager;

// Get component definition
const def = cm.getComponent('dpad');

// Check existence
cm.hasComponent('dpad')  // true

// List all
cm.getComponentIds()     // ['dpad', 'alert', ...]
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
// → { type: 'ComponentManager', initialized: true, componentCount: 8, componentIds: ['dpad', ...] }
```
```javascript [Live object]
const cm = window.lcards.core.componentManager

cm.getComponentIds()         // all registered IDs
cm.getComponent('dpad')      // full definition with segments/defaults
cm.hasComponent('dpad')      // existence check
cm.getComponentsByType('nav') // filter by type
```
:::

---

## See Also

- [Button Card — Component Mode](../../cards/button/)
- [Asset Manager](asset-manager.md)
- [Pack System](pack-system.md)
