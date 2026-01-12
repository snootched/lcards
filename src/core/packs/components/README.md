# Component Registry System

**Version:** 2.0 (Unified Format)  
**Module:** `src/core/packs/components/`  
**Status:** ✅ Production Ready

## Overview

The Component Registry is the **centralized lookup system** for all reusable UI components across LCARdS card types. Components provide pre-built SVG shapes, segment configurations, zone injection points, and theme token references that cards can use for consistent visual patterns.

**Major Change in v2.0:** All components now use a **unified inline SVG format**. The legacy shapes registry and external shape references have been removed, simplifying the architecture and making components self-contained.

---

## Quick Start

### Using Components in Cards

```javascript
import { getComponent } from '../core/packs/components/index.js';

// Get a component
const component = getComponent('dpad');

// Component structure (unified format)
{
  svg: '<svg>...</svg>',           // Inline SVG content
  orientation: 'square',            // Layout direction
  features: ['multi-segment'],      // Supported features
  segments: { /* ... */ },          // Interactive segments config
  metadata: { /* ... */ }           // Documentation & examples
}
```

### Available Components

- **D-Pad Components** (`dpad`): 9-segment directional control
- **Slider Components** (`basic`, `picard`, `picard-vertical`): Track backgrounds with zones
- **Button Components**: Registered via AssetManager (metadata only)

---

## Unified Component Format

All components follow this structure (as of v2.0):

```javascript
export const componentName = {
  // 1. INLINE SVG CONTENT (required)
  svg: `<svg viewBox="0 0 100 100">
    <!-- SVG paths with IDs for segments -->
    <path id="segment1" d="..." />
    <path id="segment2" d="..." />
    
    <!-- Groups with data-zone for content injection -->
    <g id="track-zone" data-zone="track" data-bounds="10,10,80,80">
      <!-- Card injects dynamic content here -->
    </g>
  </svg>`,
  
  // 2. ORIENTATION (required)
  // 'auto' - Adapts to container
  // 'horizontal' | 'vertical' - Fixed layout
  // 'square' - Equal width/height
  orientation: 'auto',
  
  // 3. FEATURES (optional)
  // Array of feature flags for capability detection
  features: ['multi-segment', 'zones', 'state-based-styling'],
  
  // 4. SEGMENTS (optional)
  // Pre-defined interactive regions with default styles
  segments: {
    segment1: {
      style: {
        fill: 'theme:components.component.segment.fill',
        stroke: 'theme:components.component.segment.stroke'
      },
      tap_action: { /* ... */ },
      hold_action: { /* ... */ }
    }
  },
  
  // 5. METADATA (optional)
  // Discovery, documentation, and examples
  metadata: {
    id: 'component-id',
    name: 'Component Name',
    description: 'What this component does',
    version: '1.0.0',
    examples: { /* ... */ }
  }
};
```

---

## Zones vs Segments

Components can define two types of interactive regions:

### Zones (Content Injection Points)

**Purpose:** Empty SVG groups where cards inject runtime content (tracks, gauges, text, etc.)

**Attributes:**
- `data-zone="name"` - Zone identifier
- `data-bounds="x,y,width,height"` - Bounding box for layout calculations

**Common Zones:**
- `track` - Slider/progress content
- `control` - Interactive overlays
- `text` - Text labels
- `icon` - Icon placeholders
- `range` - Range backgrounds

**Example:**
```svg
<g id="track-zone" data-zone="track" data-bounds="10,10,80,80">
  <!-- Card injects pills/gauge here at runtime -->
</g>
```

**Card Usage:**
```javascript
// Base class provides zone methods (as of v2.0)
async _initialize() {
  const component = getComponent('basic');
  await this._loadComponent(component);  // Extracts zones automatically
}

_renderCard() {
  const trackZone = this._getZone('track');
  if (trackZone) {
    this._injectIntoZone('track', this._generateTrackContent());
  }
}
```

### Segments (Pre-Defined Interactive Regions)

**Purpose:** SVG paths/shapes with IDs that map to styles + actions

**Attributes:**
- `id="segment-name"` - Element ID for selector targeting

**Common Segments:**
- Directional controls (d-pad: up/down/left/right)
- Multi-button layouts (keypad, remote)
- State indicators (status grid cells)

**Example:**
```javascript
{
  svg: `<path id="up" d="..."/><path id="down" d="..."/>`,
  segments: {
    up: {
      style: { fill: 'theme:colors.lcars.blue' },
      tap_action: { action: 'call-service', service: 'media_player.volume_up' }
    },
    down: {
      style: { fill: 'theme:colors.lcars.red' },
      tap_action: { action: 'call-service', service: 'media_player.volume_down' }
    }
  }
}
```

**Card Usage:**
```javascript
// Base class provides segment methods (as of v2.0)
_finalizeSvgProcessing(svgContent, svgConfig) {
  if (svgConfig.segments) {
    const ids = this._extractSegmentIds(svgContent);  // Auto-discover IDs
    this._processedSegments = this._processSegmentConfig(svgConfig.segments, ids);
  }
}

firstUpdated() {
  const svg = this.shadowRoot.querySelector('.component-svg');
  this._setupSegmentInteractivity(this._processedSegments, svg);
}
```

---

## Base Class Integration (v2.0)

As of v2.0, `LCARdSCard` provides built-in methods for zone and segment handling, eliminating code duplication:

### Zone Methods

```javascript
// Load component and extract zones/segments
await this._loadComponent(componentDef);

// Extract zones from rendered SVG
this._extractZones(svgElement);

// Get zone metadata
const zone = this._getZone('track');
// Returns: { element: <g>, bounds: { x, y, width, height } }

// Inject content into zone
this._injectIntoZone('track', '<rect x="0" y="0" width="100" height="20" />');
```

### Segment Methods

```javascript
// Auto-discover segment IDs from SVG
const ids = this._extractSegmentIds(svgContent);
// Returns: ['up', 'down', 'left', 'right', 'center']

// Process segment configuration
const segments = this._processSegmentConfig(segmentsObject, ids);
// Merges defaults + per-segment config, validates IDs

// Setup interactivity (styles + event listeners)
this._setupSegmentInteractivity(segments, svgContainer);
// Applies initial styles, attaches click/hold handlers
```

**Migration from v1.0:**
- Slider cards: Remove duplicate `_extractZones()` method → use inherited
- Button cards: Remove duplicate `_extractSegmentIdsFromSvg()` → use inherited `_extractSegmentIds()`
- Custom cards: Extend `LCARdSCard` to get zones + segments for free

---

## Creating New Components

### Step 1: Create Component File

```javascript
// src/core/packs/components/mycomponent/index.js
export const myComponents = {
  'basic': {
    svg: `<svg viewBox="0 0 100 100">
      <g id="content-zone" data-zone="content" data-bounds="0,0,100,100"></g>
    </svg>`,
    orientation: 'auto',
    features: [],
    metadata: {
      id: 'my-component-basic',
      name: 'My Component (Basic)',
      description: 'A basic component for my card',
      version: '1.0.0'
    }
  }
};
```

### Step 2: Register in Unified Registry

```javascript
// src/core/packs/components/index.js
import { myComponents } from './mycomponent/index.js';

export const components = {
  ...dpadComponents,
  ...sliderComponents,
  ...myComponents  // ← Add here
};
```

### Step 3: Use in Card

```javascript
import { getComponent } from '../core/packs/components/index.js';

export class MyCard extends LCARdSCard {
  async _initialize() {
    super._initialize();
    
    const component = getComponent('basic');
    await this._loadComponent(component);  // Zones extracted automatically
  }
  
  _renderCard() {
    const contentZone = this._getZone('content');
    if (contentZone) {
      this._injectIntoZone('content', this._generateContent());
    }
    return this._renderSvg();
  }
}
```

---

## External SVG Files (Build-Time Enhancement)

### Current Implementation

SVG content is inlined as JavaScript strings for webpack/rollup compatibility:

```javascript
const componentSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="80mm" height="80mm">...</svg>`;
```

### Optional: Load from External Files

For easier SVG editing, you can load external `.svg` files at build time.

#### Option 1: Vite Asset Imports (Recommended for LCARdS)

```javascript
// vite.config.js (already configured)
export default {
  assetsInclude: ['**/*.svg']
};

// Component file
import componentSvg from './component.svg?raw';  // ← ?raw loads as string

export const myComponents = {
  'basic': {
    svg: componentSvg,  // ← No inline string needed
    orientation: 'auto',
    features: []
  }
};
```

#### Option 2: Webpack Raw Loader

```javascript
// webpack.config.js
module.exports = {
  module: {
    rules: [{
      test: /\.svg$/,
      use: 'raw-loader'
    }]
  }
};

// Component file
import componentSvg from './component.svg';  // ← Loaded as string at build time
```

**File Structure:**
```
src/core/packs/components/mycomponent/
├── component.svg       # Source file (edit this)
├── index.js            # Component definition (imports component.svg)
└── README.md           # Component documentation
```

**Recommendation:**
- **Development**: Keep `.svg` files in component directories for easy editing
- **Build**: Use Vite `?raw` imports (already configured in LCARdS)
- **Source Control**: Commit both `.svg` files and `.js` files for transparency

---

## Theme Token Integration

Components should reference theme tokens instead of hardcoded values:

```javascript
segments: {
  up: {
    style: {
      fill: 'theme:components.dpad.segment.directional.fill',  // ← Theme token
      stroke: 'theme:components.dpad.segment.directional.stroke',
      'stroke-width': 'theme:components.dpad.segment.directional.stroke-width'
    }
  }
}
```

**Token Resolution Flow:**
1. Card loads component with theme tokens
2. CoreConfigManager merges component → preset → user config
3. Template engine resolves `theme:*` tokens to actual values
4. Final config applied to SVG elements

**Benefits:**
- Consistent styling across themes
- Automatic theme switching support
- Centralized color management

---

## Migration Guide

### Migrating from Legacy Format (v1.0 → v2.0)

**Before (Legacy):**
```javascript
// Component with external shape reference
{
  id: 'my-component',
  shape: 'my-shape',  // ❌ No longer supported
  segments: {...}
}

// Separate shapes registry
export const shapes = {
  'my-shape': '<svg>...</svg>'
};
```

**After (Unified):**
```javascript
// Component with inline SVG
{
  'my-component': {
    svg: '<svg>...</svg>',  // ✅ Inline SVG
    orientation: 'auto',
    features: ['multi-segment'],
    segments: {...},
    metadata: {
      id: 'my-component',
      name: 'My Component',
      description: '...',
      version: '1.0.0'
    }
  }
}
```

**Migration Steps:**
1. Move SVG content from shapes registry to component's `svg` property
2. Change from single preset object to registry map (`{ 'name': { ... } }`)
3. Add `orientation` and `features` properties
4. Nest metadata under `metadata` property
5. Delete shapes registry import/reference

---

## Troubleshooting

### Component Not Found

**Error:** `Component preset not found: my-component`

**Solution:**
1. Check component is exported in its `index.js`
2. Check component is spread into unified registry (`src/core/packs/components/index.js`)
3. Verify component name matches exactly (case-sensitive)

### Segments Not Interactive

**Error:** Segments render but don't respond to clicks

**Solution:**
1. Ensure SVG elements have `id` attributes matching segment names
2. Check `_setupSegmentInteractivity()` is called after SVG renders
3. Verify segments have `tap_action` or `hold_action` configured
4. Check card extends `LCARdSCard` (provides segment methods)

### Zones Not Found

**Error:** `Cannot inject into unknown zone: track`

**Solution:**
1. Ensure SVG has `<g>` with `data-zone="track"` attribute
2. Check `_extractZones()` is called after SVG is in DOM
3. Verify zone name matches exactly (case-sensitive)
4. Check SVG is rendered before zone injection

---

## Real-World Examples

### Example 1: D-Pad Component

**File:** `src/core/packs/components/dpad/index.js`

**Features:**
- 9 interactive segments (directional + diagonals + center)
- Theme token integration for consistent styling
- Comprehensive metadata with usage examples

**Usage:**
```yaml
type: custom:lcards-button
component: dpad
entity: media_player.living_room
dpad:
  segments:
    up: { tap_action: { action: call-service, service: media_player.volume_up } }
    down: { tap_action: { action: call-service, service: media_player.volume_down } }
    center: { tap_action: { action: call-service, service: media_player.media_play_pause } }
```

### Example 2: Slider Component

**File:** `src/core/packs/components/sliders/index.js`

**Features:**
- Data zones for track and control injection
- Orientation flexibility (auto/horizontal/vertical)
- Multiple variants (basic, picard, picard-vertical)

**Usage:**
```yaml
type: custom:lcards-slider
component: basic
entity: light.bedroom
preset: pills-basic
```

### Example 3: Custom Keypad

**Hypothetical component for numeric input:**

```javascript
export const keypadComponents = {
  'numeric': {
    svg: `<svg viewBox="0 0 120 160">
      <path id="key-1" d="M 10,10 L 30,10 L 30,30 L 10,30 Z"/>
      <path id="key-2" d="M 45,10 L 65,10 L 65,30 L 45,30 Z"/>
      <!-- ... more keys -->
    </svg>`,
    orientation: 'square',
    features: ['multi-segment'],
    segments: {
      'key-1': { 
        style: { fill: 'theme:colors.lcars.blue' },
        tap_action: { action: 'call-service', service: 'input_number.set_value', data: { value: 1 } }
      },
      // ... more segments
    },
    metadata: {
      id: 'keypad-numeric',
      name: 'Numeric Keypad',
      description: 'Interactive numeric input keypad',
      version: '1.0.0'
    }
  }
};
```

---

## Future Enhancements

### Planned Features

1. **Dynamic Component Loading** - Load components from external URLs
2. **Component Validation** - JSON Schema validation for component structure
3. **Component Preview Tool** - Visual component browser in editor
4. **Animation Presets** - Built-in animation configurations per component
5. **Responsive Components** - Breakpoint-based component variants

### Contributing

When adding new components:
1. Follow the unified format specification
2. Include comprehensive metadata and examples
3. Use theme tokens for all colors
4. Document zones and segments clearly
5. Test with multiple themes

---

## API Reference

### getComponent(name)

**Returns:** Component object or undefined

```javascript
const component = getComponent('dpad');
// { svg, orientation, features, segments, metadata }
```

### hasComponent(name)

**Returns:** Boolean

```javascript
if (hasComponent('custom-keypad')) {
  // Component exists
}
```

### getComponentNames()

**Returns:** Array of component names

```javascript
const names = getComponentNames();
// ['dpad', 'basic', 'picard', 'picard-vertical']
```

---

## Version History

### v2.0.0 (Current)
- ✅ Unified inline SVG format for all components
- ✅ Removed legacy shapes registry
- ✅ Added base class zone/segment methods
- ✅ Simplified component structure
- ✅ Comprehensive documentation

### v1.0.0
- Initial component registry system
- Dual structure support (preset + registry)
- External shapes registry

---

**For questions or issues, see:** `doc/architecture/subsystems/components.md`
