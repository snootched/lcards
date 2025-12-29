# Component Registry System

**Version:** 1.0  
**Module:** `src/core/packs/components/`  
**Status:** ✅ Production Ready

## Overview

The Component Registry is the **centralized lookup system** for all reusable UI components across LCARdS card types. Components provide pre-built SVG shapes, segment configurations, and theme token references that cards can use for consistent visual patterns.

The registry is used by `CoreConfigManager` to resolve component configurations during the card initialization process.

---

## Architecture

### Unified Registry Pattern

All components are exported through a **single unified registry** (`index.js`) that cards import from:

```javascript
// Cards import from unified registry
import { getComponent } from '../core/packs/components/index.js';

// CoreConfigManager dynamically imports
const { getComponent } = await import('../packs/components/index.js');
const componentPreset = getComponent(userConfig.component);
```

**Key Benefits:**
- Single source of truth for all component lookups
- No need to know which sub-registry a component lives in
- Easy to add new component types without changing consumer code
- Consistent API across all card types

---

## Component Structure Types

The registry supports **two component structure types** for backward compatibility and flexibility:

### 1. Legacy Preset Structure (D-Pad)

Used by components with complex segment-based configurations:

```javascript
export const dpadComponentPreset = {
    // Metadata
    id: 'dpad',
    name: 'D-Pad Control',
    description: 'Interactive directional control with 9 segments',
    version: '1.0.0',
    
    // Shape reference
    shape: 'dpad',
    
    // Segment configurations with theme tokens
    segments: {
        up: {
            style: {
                fill: 'theme:components.dpad.segment.directional.fill',
                stroke: 'theme:components.dpad.segment.directional.stroke'
            }
        },
        down: { /* ... */ },
        // ... more segments
    }
};
```

**When to use:**
- Component has multiple interactive segments
- Needs complex metadata (id, name, description, version)
- Integrates deeply with theme system via component tokens
- Segment-based interactions (buttons, switches, controls)

### 2. Component Registry Structure (Sliders, Buttons, Future)

Used by simpler components focused on SVG shape rendering:

```javascript
export const sliderComponents = {
    'basic': {
        svg: '<svg viewBox="0 0 100 100">...</svg>',
        orientation: 'auto',  // 'auto' | 'horizontal' | 'vertical'
        features: []          // Optional feature flags
    },
    
    'picard': {
        svg: '<svg viewBox="0 0 80 300">...</svg>',
        orientation: 'vertical',
        features: ['decorative-borders', 'segmented-elbows']
    }
};
```

**When to use:**
- Component is primarily an SVG shape with data zones
- Multiple variants exist (basic, styled, themed)
- Simple structure without complex segment interactions
- Cards handle interaction logic independently

---

## Creating a New Component Type

Follow this step-by-step guide to add a new component type (e.g., buttons, elbows, MSD frames).

### Step 1: Create Component Directory

Create a new directory under `src/core/packs/components/`:

```bash
mkdir src/core/packs/components/buttons/
```

### Step 2: Define Component Structure

Create `index.js` in your new directory:

```javascript
/**
 * Button Component Registry
 *
 * SVG components for LCARdS Button cards with data-zone attributes
 * for dynamic content injection. Each component defines:
 * - Static visual structure (borders, elbows, backgrounds)
 * - Zone markers (data-zone="icon", "text", "segment") with bounds
 *
 * @module core/packs/components/buttons
 */

/**
 * Basic button SVG (rounded rectangle)
 */
const buttonBasicSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 200 50" xmlns="http://www.w3.org/2000/svg">
  <metadata>
    <title>LCARdS Basic Button Component</title>
    <description>Simple rounded rectangle button shell</description>
  </metadata>
  
  <!-- Background zone -->
  <rect id="bg-zone"
        data-zone="background"
        data-bounds="0,0,200,50"
        x="0" y="0"
        width="200" height="50"
        rx="25" ry="25"
        fill="{{BACKGROUND_COLOR}}" />
  
  <!-- Icon zone (left side) -->
  <g id="icon-zone"
     data-zone="icon"
     data-bounds="10,10,30,30">
    <!-- Card injects icon here -->
  </g>
  
  <!-- Text zone (center) -->
  <g id="text-zone"
     data-zone="text"
     data-bounds="50,10,100,30">
    <!-- Card injects text here -->
  </g>
</svg>`;

/**
 * Lozenge button SVG (LCARS-style pill shape)
 */
const buttonLozengeSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 200 50" xmlns="http://www.w3.org/2000/svg">
  <metadata>
    <title>LCARdS Lozenge Button</title>
    <description>LCARS-style pill-shaped button with end caps</description>
  </metadata>
  
  <!-- Lozenge path -->
  <path id="bg-zone"
        data-zone="background"
        d="M 25,0 L 175,0 A 25,25 0 0 1 175,50 L 25,50 A 25,25 0 0 1 25,0 Z"
        fill="{{BACKGROUND_COLOR}}" />
  
  <g id="text-zone" data-zone="text" data-bounds="40,12,120,26">
    <!-- Text injected here -->
  </g>
</svg>`;

/**
 * Button component registry
 *
 * @type {Object.<string, {svg: string, orientation: string, features: string[]}>}
 */
export const buttonComponents = {
    // Basic rectangular button
    'basic': {
        svg: buttonBasicSvg,
        orientation: 'auto',  // Works in any layout
        features: ['icon-zone', 'text-zone']
    },
    
    // LCARS-style lozenge
    'lozenge': {
        svg: buttonLozengeSvg,
        orientation: 'horizontal',  // Locked to horizontal
        features: ['text-zone', 'lcars-style']
    }
};

/**
 * Get a button component by name
 * @param {string} name - Component name
 * @returns {Object|undefined} Component object or undefined if not found
 */
export function getButtonComponent(name) {
    return buttonComponents[name];
}

/**
 * Check if a button component exists
 * @param {string} name - Component name
 * @returns {boolean} True if component exists
 */
export function hasButtonComponent(name) {
    return name in buttonComponents;
}

/**
 * Get all available button component names
 * @returns {string[]} Array of component names
 */
export function getButtonComponentNames() {
    return Object.keys(buttonComponents);
}
```

### Step 3: Register in Unified Registry

**CRITICAL:** Update `src/core/packs/components/index.js` to include your new components:

```javascript
/**
 * Component Registry
 * ... (existing JSDoc)
 */

import { dpadComponentPreset } from './dpad.js';
import { sliderComponents } from './sliders/index.js';
import { buttonComponents } from './buttons/index.js';  // ← ADD IMPORT

/**
 * Component registry mapping component names to their presets
 * @type {Object.<string, Object>}
 */
export const components = {
    dpad: dpadComponentPreset,      // D-Pad preset (legacy structure)
    ...sliderComponents,             // Slider registry (basic, picard)
    ...buttonComponents              // ← ADD SPREAD HERE
};

// Keep existing getComponent, hasComponent, etc. functions unchanged
```

**Why this matters:**
- `CoreConfigManager` uses `getComponent()` from this file
- Forgetting this step = "Component preset 'X' not found" errors
- All component types MUST be merged into the unified registry

### Step 4: Use in Card Implementation

Cards can now reference your components in their config:

```yaml
type: custom:lcards-button
component: lozenge  # Uses buttonComponents['lozenge']
entity: light.kitchen
```

Card implementation:

```javascript
import { getComponent } from '../core/packs/components/index.js';

// In card's render logic
const componentDef = getComponent(this.config.component);
if (componentDef && componentDef.svg) {
    // Inject SVG and populate data zones
    return html`${unsafeHTML(componentDef.svg)}`;
}
```

### Step 5: Update JSDoc (Optional but Recommended)

Update the main `index.js` JSDoc to list your new component type:

```javascript
/**
 * Component Registry
 *
 * Centralized registry for all card component types...
 *
 * 1. **Legacy preset structure** (D-Pad):
 *    ...
 *
 * 2. **Component registry structure** (Sliders, Buttons, Elbows, MSD):
 *    ...                                      ^^^^^^^ ADD HERE
 *
 * Future component types will be added using the same spread pattern.
 */
```

---

## Component Naming Conventions

### Registry Keys (Component IDs)

Use lowercase with hyphens for multi-word component names:

```javascript
export const myComponents = {
    'basic': { /* ... */ },           // ✅ Single word
    'picard-vertical': { /* ... */ }, // ✅ Multi-word hyphenated
    'lcars-alert': { /* ... */ },     // ✅ Prefix with style name
    'tng-style-panel': { /* ... */ }  // ✅ Clear, descriptive
};
```

**Avoid:**
```javascript
'BasicButton': { /* ... */ },  // ❌ PascalCase
'picard_vertical': { /* ... */ }, // ❌ Snake_case
'pv': { /* ... */ }             // ❌ Unclear abbreviations
```

### Registry Variable Names

Use plural noun + "Components":

```javascript
export const buttonComponents = { /* ... */ };    // ✅
export const sliderComponents = { /* ... */ };    // ✅
export const elbowComponents = { /* ... */ };     // ✅
export const msdFrameComponents = { /* ... */ };  // ✅
```

### File Structure

```
src/core/packs/components/
├── index.js              # Unified registry (all components merged)
├── dpad.js               # Legacy preset (single file)
├── sliders/
│   └── index.js          # Slider component registry
├── buttons/              # ← Your new component type
│   └── index.js          # Button component registry
└── README.md             # This file
```

---

## SVG Best Practices

### Data Zones

Use `data-zone` attributes to mark areas where cards inject dynamic content:

```svg
<!-- Zone for text injection -->
<g id="text-zone"
   data-zone="text"
   data-bounds="10,10,100,30">
  <!-- Card injects text here -->
</g>

<!-- Zone for icon injection -->
<g id="icon-zone"
   data-zone="icon"
   data-bounds="120,15,20,20">
  <!-- Card injects icon here -->
</g>

<!-- Zone for interactive overlay -->
<rect id="control-zone"
      data-zone="control"
      data-bounds="0,0,200,50"
      fill="none"
      pointer-events="none" />
```

**Zone Types:**
- `text` - Text label injection point
- `icon` - Icon/image injection point
- `control` - Interactive overlay (buttons, sliders)
- `track` - Progress/slider track area
- `background` - Background fill area
- `segment` - Individual button/control segment

### ViewBox Sizing

Choose appropriate viewBox for your component:

```svg
<!-- Square components (adapts to any orientation) -->
<svg viewBox="0 0 100 100" preserveAspectRatio="none">

<!-- Horizontal components (buttons, headers) -->
<svg viewBox="0 0 200 50">

<!-- Vertical components (sliders, side panels) -->
<svg viewBox="0 0 80 300">

<!-- Fixed aspect ratio (icons, logos) -->
<svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
```

### Theme Token Placeholders

Use `{{TOKEN_NAME}}` placeholders for theme-aware colors:

```svg
<rect fill="{{BACKGROUND_COLOR}}" />
<path stroke="{{BORDER_COLOR}}" />
<text fill="{{TEXT_COLOR}}">Label</text>
```

Cards replace these at runtime with theme values.

---

## Testing Your Components

### 1. Syntax Verification

```bash
# Build the project to check for syntax errors
npm run build
```

### 2. Registry Lookup Test

Create a test file `/tmp/test-my-components.js`:

```javascript
const components = {
    dpad: { id: 'dpad' },  // Existing
    ...{ 'basic': { svg: '...' }, 'lozenge': { svg: '...' } }  // Your new components
};

function getComponent(name) {
    return components[name];
}

// Test lookups
console.log('Test: getComponent("basic"):', getComponent('basic') ? 'PASS ✓' : 'FAIL ✗');
console.log('Test: getComponent("lozenge"):', getComponent('lozenge') ? 'PASS ✓' : 'FAIL ✗');
console.log('Test: getComponent("dpad"):', getComponent('dpad') ? 'PASS ✓' : 'FAIL ✗');
```

### 3. Integration Test in Home Assistant

1. Build: `npm run build`
2. Copy `dist/lcards.js` to Home Assistant `www/community/lcards/`
3. Create test card:
   ```yaml
   type: custom:lcards-button
   component: basic
   entity: light.test
   ```
4. Check browser console for errors
5. Verify no "Component preset 'X' not found" warnings

---

## Troubleshooting

### "Component preset 'X' not found"

**Cause:** Component not merged into unified registry  
**Solution:** Check that you added the spread operator in `index.js`:

```javascript
export const components = {
    dpad: dpadComponentPreset,
    ...sliderComponents,
    ...buttonComponents  // ← Make sure this exists!
};
```

### Component Doesn't Render

**Cause:** SVG syntax error or missing data zones  
**Solution:** Validate SVG in browser dev tools:

```javascript
// In browser console
const svg = `<svg>...</svg>`;
const parser = new DOMParser();
const doc = parser.parseFromString(svg, 'image/svg+xml');
console.log(doc.querySelector('parsererror')); // Should be null
```

### Build Errors After Adding Component

**Cause:** Import path incorrect or circular dependency  
**Solution:** Verify import path:

```javascript
// ✅ CORRECT: Relative path from index.js to your registry
import { buttonComponents } from './buttons/index.js';

// ❌ WRONG: Absolute path or missing .js extension
import { buttonComponents } from 'src/core/packs/components/buttons';
```

---

## Migration Guide: Existing Components → Unified Registry

If you have components in separate files that need to be added:

### Before (Separate, Unused)

```javascript
// src/cards/my-card.js
import { mySpecialComponent } from './components/my-special.js';

// Component not in unified registry
```

### After (Unified Registry)

1. Move component to `src/core/packs/components/my-type/index.js`
2. Export as registry:
   ```javascript
   export const myTypeComponents = {
       'special': mySpecialComponent
   };
   ```
3. Merge into unified registry (`src/core/packs/components/index.js`):
   ```javascript
   import { myTypeComponents } from './my-type/index.js';
   
   export const components = {
       dpad: dpadComponentPreset,
       ...sliderComponents,
       ...buttonComponents,
       ...myTypeComponents  // ← Add here
   };
   ```
4. Update card to use unified import:
   ```javascript
   import { getComponent } from '../core/packs/components/index.js';
   const comp = getComponent('special');
   ```

---

## Real-World Examples

### Example 1: D-Pad (Legacy Preset)

**File:** `src/core/packs/components/dpad.js`

```javascript
export const dpadComponentPreset = {
    id: 'dpad',
    name: 'D-Pad Control',
    segments: {
        up: { style: { fill: 'theme:components.dpad.segment.directional.fill' } },
        // ... 8 more segments
    }
};
```

**Registration:** Direct object (not spread)
```javascript
export const components = {
    dpad: dpadComponentPreset,  // Single entry
    // ...
};
```

### Example 2: Sliders (Registry)

**File:** `src/core/packs/components/sliders/index.js`

```javascript
export const sliderComponents = {
    'basic': {
        svg: sliderBasicSvg,
        orientation: 'auto',
        features: []
    },
    'picard': {
        svg: sliderPicardVerticalSvg,
        orientation: 'vertical',
        features: ['decorative-borders']
    }
};
```

**Registration:** Spread operator (multiple entries)
```javascript
export const components = {
    dpad: dpadComponentPreset,
    ...sliderComponents,  // Adds 'basic' and 'picard'
    // ...
};
```

### Example 3: Future Elbows (Registry)

**File:** `src/core/packs/components/elbows/index.js` (not yet created)

```javascript
export const elbowComponents = {
    'rounded': {
        svg: elbowRoundedSvg,
        orientation: 'auto',
        features: ['smooth-corners']
    },
    'angular': {
        svg: elbowAngularSvg,
        orientation: 'auto',
        features: ['sharp-corners', 'lcars-style']
    }
};
```

**Registration:**
```javascript
import { elbowComponents } from './elbows/index.js';

export const components = {
    dpad: dpadComponentPreset,
    ...sliderComponents,
    ...buttonComponents,
    ...elbowComponents  // Future addition
};
```

---

## API Reference

### `getComponent(name)`

Get a component by name from unified registry.

**Parameters:**
- `name` (string) - Component identifier

**Returns:** `Object | undefined`
- Legacy preset: `{ id, name, description, version, segments }`
- Registry entry: `{ svg, orientation, features }`

**Example:**
```javascript
import { getComponent } from '../core/packs/components/index.js';

const comp = getComponent('basic');
if (comp && comp.svg) {
    // Render component SVG
}
```

### `hasComponent(name)`

Check if a component exists in registry.

**Parameters:**
- `name` (string) - Component identifier

**Returns:** `boolean`

**Example:**
```javascript
if (hasComponent('lozenge')) {
    console.log('Lozenge component available');
}
```

### `getComponentNames()`

Get all registered component names.

**Returns:** `string[]`

**Example:**
```javascript
const allComponents = getComponentNames();
// ['dpad', 'basic', 'picard', 'lozenge', ...]
```

### `getComponentMetadata(name)`

Get component metadata (legacy presets only).

**Parameters:**
- `name` (string) - Component identifier

**Returns:** `Object | null`
```javascript
{
    id: string,
    name: string,
    description: string,
    version: string
}
```

**Example:**
```javascript
const meta = getComponentMetadata('dpad');
console.log(meta.name);  // "D-Pad Control"
```

---

## Checklist: Adding a New Component Type

Use this checklist when adding new component types:

- [ ] Create directory: `src/core/packs/components/[type]/`
- [ ] Create `index.js` with component registry
- [ ] Define SVG strings with data zones
- [ ] Export registry object (e.g., `buttonComponents`)
- [ ] Export helper functions (`getButtonComponent`, etc.)
- [ ] Import registry in `src/core/packs/components/index.js`
- [ ] Add spread to `components` object: `...buttonComponents`
- [ ] Update JSDoc in unified registry
- [ ] Run `npm run build` to verify no errors
- [ ] Test component lookup in browser console
- [ ] Create example card using new component
- [ ] Verify no "Component preset not found" errors
- [ ] Document component in card's schema/editor (if applicable)

---

## See Also

- [CoreConfigManager README](../../config-manager/README.md) - Component resolution and config processing
- [LCARdS Card Guide](../../../../doc/architecture/lcards-card-foundation.md) - Card implementation patterns
- [Theme System](../themes/README.md) - Theme token integration
- [Style Presets](../presets/README.md) - Preset system architecture

---

**Last Updated:** December 29, 2024  
**Version:** 1.0  
**Authors:** LCARdS Development Team
