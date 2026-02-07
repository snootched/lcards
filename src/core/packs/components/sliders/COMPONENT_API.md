# Slider Component API

> **Guide for authoring new slider components for LCARdS**

## Overview

Slider components define the structural shell (SVG layout) for slider cards. They use a **render function architecture** where components dynamically generate SVG based on card configuration, state, and dimensions.

Components are **pure functions** that receive context and return SVG markup with data-zone markers for content injection.

---

## Component Structure

A slider component exports three main elements:

```javascript
export default {
    render,           // Function: Generate SVG from context
    calculateZones,   // Function: Calculate zone bounds for dimensions
    metadata          // Object: Component metadata and options
};
```

---

## 1. The `render()` Function

**Signature:**
```javascript
export function render(context) {
    // Returns: string (SVG markup)
}
```

**Context Object:**
```javascript
{
    width: number,         // Container width in pixels
    height: number,        // Container height in pixels
    colors: Object,        // Resolved colors from color system
    config: Object,        // Full card config (user + preset merged)
    style: Object,         // Resolved style object (preset + user overrides)
    state: Object,         // Current card state
    hass: Object,          // Home Assistant object
    zones: Object          // Pre-calculated zones (optional, recalculate if needed)
}
```

**colors Object (Resolved by card):**
```javascript
{
    // Border colors (state-aware, from style.border.top/bottom/left/right.color)
    borderTop: '#ff9966',
    borderBottom: '#9966cc',
    borderLeft: '#ff9966',
    borderRight: '#9966cc',

    // Progress bar (from style.gauge.progress_bar.color)
    progressBar: '#00EDED',

    // Range indicators (from style.range.frame.color and style.range.border.color)
    rangeFrame: '#2765FD',
    rangeBorder: '#000000',

    // Solid bar connector (from style.solid_bar.color)
    solidBar: '#9DA4B9',

    // Animation indicator (from style.animation.indicator.color)
    animationIndicator: '#3AA5D0'
}
```

**Color Resolution Mapping:**

The card resolves colors from config/style paths and passes them pre-resolved to components:

| colors.* | Resolved From | Fallback |
|----------|---------------|----------|
| `borderTop` | `style.border.top.color` | `#9DA4B9` |
| `borderBottom` | `style.border.bottom.color` | `#9DA4B9` |
| `borderLeft` | `style.border.left.color` | `#9DA4B9` |
| `borderRight` | `style.border.right.color` | `#9DA4B9` |
| `progressBar` | `style.gauge.progress_bar.color` | `#00EDED` |
| `rangeFrame` | `style.range.frame.color` | (top border color) |
| `rangeBorder` | `style.range.border.color` | `#000000` |
| `solidBar` | `style.solid_bar.color` | (top border color) |
| `animationIndicator` | `style.animation.indicator.color` | `#3AA5D0` |

**Critical**: Border colors are **state-aware** - they can be configured as objects with keys like `on`, `off`, `unavailable` and the card resolves them based on entity state before passing to the component.

**state Object:**
```javascript
{
    value: 45,           // Current slider value
    entity: Object,      // HA entity object
    min: 0,              // Control min
    max: 100,            // Control max
    domain: 'light'      // Entity domain
}
```

**Return Value:**
Complete SVG markup with **data-zone** attributes marking content injection points.

---

## 2. Zone System

Zones define rectangular areas where the slider card injects dynamic content.

### Zone Types

| Zone ID | Purpose | Required | Content Injected By Card |
|---------|---------|----------|--------------------------|
| `track` | Pills or gauge display | ✅ | Card renders pills/gauge SVG |
| `control` | Mouse/touch interaction overlay | ✅ | Transparent rect for event handling |
| `progress` | Progress bar (separate from track) | ❌ | Card renders progress bar (gauge mode) |
| `range` | Range background indicators | ❌ | Card renders colored range segments |
| `text` | Text field container | ✅ | Card injects text elements |
| `border` | Border decorations (optional) | ❌ | Card injects border rects if configured |

### Zone Markup

Each zone must have:
- `id` attribute matching zone type
- `data-zone` attribute with zone ID
- `data-bounds` attribute: `"x,y,width,height"` in pixels
- `transform="translate(x, y)"` for g elements (x/y match data-bounds)

**Examples:**

```xml
<!-- Track zone (g element with transform) -->
<g id="track-zone" data-zone="track"
   transform="translate(199, 72)"
   data-bounds="199,72,120,441">
</g>

<!-- Control zone (rect element, no transform needed) -->
<rect id="control-zone" data-zone="control"
      x="100" y="72"
      width="19" height="441"
      fill="none" stroke="none" pointer-events="all"
      data-bounds="100,72,19,441" />

<!-- Text zone (positioned at origin or with transform) -->
<g id="text-zone" data-zone="text"
   transform="translate(0, 16)"
   data-bounds="0,16,365,552">
</g>
```

---

## 3. The `calculateZones()` Function

**Signature:**
```javascript
export function calculateZones(width, height) {
    // Returns: Object with zone definitions
}
```

**Purpose:**
Calculates zone bounds scaled from original design viewBox to actual container dimensions.

**Return Format:**
```javascript
{
    track: {
        x: 199,        // X position in pixels
        y: 72,         // Y position in pixels
        width: 120,    // Width in pixels
        height: 441    // Height in pixels
    },
    control: { x, y, width, height },
    progress: { x, y, width, height },  // Optional
    range: { x, y, width, height },     // Optional
    text: { x, y, width, height }
}
```

**Scaling Example:**
```javascript
export function calculateZones(width, height) {
    // Original design: 365×601 viewBox
    const scaleX = width / 365;
    const scaleY = height / 601;

    return {
        track: {
            x: 199 * scaleX,
            y: 72 * scaleY,
            width: 120 * scaleX,
            height: 441 * scaleY
        },
        // ... other zones
    };
}
```

---

## 4. Component Metadata

**Structure:**
```javascript
export const metadata = {
    type: 'slider',                    // Component type (always 'slider')
    name: 'my-component',              // Unique identifier (kebab-case)
    displayName: 'My Component',       // Human-readable name
    orientation: 'vertical',           // 'vertical', 'horizontal', or 'auto'
    features: [],                      // Feature tags (see below)
    defaultSize: {                     // Default dimensions
        width: 365,
        height: 601
    },
    configurableOptions: [],           // User-configurable options (see below)
    description: 'Component description'
};
```

### Feature Tags

Optional feature flags for documentation/filtering:

```javascript
features: [
    'state-aware-borders',    // Borders change color based on state
    'animated-indicator',     // Includes animation elements
    'progress-bar',           // Has dedicated progress bar zone
    'range-indicators',       // Has dedicated range indicator zone
    'decorative-frame'        // Has decorative border elements
]
```

### Configurable Options

User-facing configuration exposed in the visual editor:

```javascript
configurableOptions: [
    {
        key: 'show_animation',          // Config path (accessed via config.show_animation)
        type: 'boolean',                // Type: boolean, number, string, color
        default: true,                  // Default value
        description: 'Show animation',  // Description for docs
        'x-ui-hints': {                 // Editor UI hints
            label: 'Show Animation',
            helper: 'Enable pulsing indicator',
            selector: { boolean: {} }   // HA-style selector
        }
    },
    {
        key: 'animation_speed',
        type: 'number',
        default: 2,
        description: 'Animation speed in seconds',
        'x-ui-hints': {
            label: 'Animation Speed',
            helper: 'Pulse duration (0.1-10 seconds)',
            selector: {
                number: {
                    mode: 'box',
                    step: 0.1,
                    min: 0.1,
                    max: 10
                }
            }
        }
    }
]
```

**Supported Types:**
- `boolean` - Toggle switch
- `number` - Number input with optional min/max/step
- `string` - Text input
- `color` - Color picker (use format: 'color-lcards')

---

## 5. Orientation Handling

Components can support:

1. **`vertical`** - Locked to vertical layout
2. **`horizontal`** - Locked to horizontal layout
3. **`auto`** - Adapts to `style.track.orientation` config

**Orientation is controlled by card config**, not component choice. Components define the visual shell, not layout direction.

---

## 6. Color Resolution

**DO NOT hardcode colors** - use the `colors` object from context.

The card resolves colors from `style.*` config paths and passes them pre-resolved to components. This handles:
- Theme tokens (e.g., `var(--primary-color)`)
- State-aware colors (entity on/off/unavailable)
- Preset overrides
- CSS variable resolution

**All colors are fully resolved before reaching the component** - you simply use them as-is.

See Section 1 for the complete `colors` object structure and the mapping table showing which config paths map to which color properties.

**Example:**
```javascript
// ✅ CORRECT - Use resolved colors
<path fill="${colors.borderTop}" d="..." />
<rect fill="${colors.progressBar}" />
<circle fill="${colors.animationIndicator}" />

// ❌ WRONG - Don't hardcode
<path fill="#ff9966" d="..." />

// ❌ WRONG - Don't try to resolve yourself
<path fill="${config.style.border.top.color}" d="..." />  // Not state-aware!
```

---

## 7. Content Injection Flow

1. **Card calls `calculateZones(width, height)`** to get zone bounds
2. **Card calls `render(context)`** to generate SVG shell
3. **Card parses SVG** and finds zone elements by `data-zone` attribute
4. **Card injects content** into zones:
   - `track` → Pills or gauge SVG
   - `progress` → Progress bar rect
   - `range` → Colored range segments
   - `text` → Text field elements
   - `control` → Interaction overlay (already in shell)

---

## 8. Best Practices

### DO ✅

- **Use relative coordinates** - Scale from original viewBox to actual dimensions
- **Preserve aspect ratio** - Use proportional scaling (scaleX, scaleY)
- **Mark all zones** with proper `data-zone` and `data-bounds`
- **Use resolved colors** from context.colors
- **Document configurable options** with clear labels and helpers
- **Test at multiple sizes** - Components should scale gracefully
- **Keep SVG simple** - Avoid overly complex paths or effects

### DON'T ❌

- **Don't hardcode dimensions** - Always scale from viewBox
- **Don't hardcode colors** - Use color system
- **Don't inject content directly** - Let card populate zones
- **Don't use external dependencies** - Keep components self-contained
- **Don't use CSS** - All styling must be inline SVG attributes
- **Don't modify card state** - Components are pure render functions

---

## 9. Testing Your Component

### Manual Testing Checklist

1. **Registration**: Add to `sliders/index.js` export
2. **Visual Test**: Load in card editor with various configs
3. **Scaling Test**: Resize card container (50px - 1000px)
4. **Mode Test**: Test with both `pills` and `gauge` modes
5. **Range Test**: Add ranges and verify rendering
6. **Text Test**: Configure text fields in all positions
7. **State Test**: Toggle entity state (active/inactive borders)
8. **Animation Test**: Verify animations work at different speeds

### Example Test Config

```yaml
type: custom:lcards-slider
component: my-component
entity: light.kitchen
preset: gauge-basic
style:
  track:
    orientation: vertical
  ranges:
    - min: 0
      max: 33
      color: '#00eeee'
      label: Low
    - min: 33
      max: 66
      color: '#66ccff'
      label: Normal
```

---

## 10. Registration

Add your component to `sliders/index.js`:

```javascript
import myComponent from './my-component.js';

export const sliderComponents = {
    'default': defaultComponent,
    'picard': picardComponent,
    'my-component': myComponent  // Add here
};
```

---

## Example: Minimal Component

```javascript
/**
 * Minimal Slider Component
 * Simple horizontal slider with basic zones
 */

export function calculateZones(width, height) {
    return {
        track: { x: 10, y: 10, width: width - 20, height: height - 20 },
        control: { x: 10, y: 10, width: width - 20, height: height - 20 },
        text: { x: 0, y: 0, width: width, height: height }
    };
}

export function render(context) {
    const { width, height, colors, zones } = context;
    const z = zones || calculateZones(width, height);

    return `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <!-- Track zone -->
  <g id="track-zone" data-zone="track"
     transform="translate(${z.track.x}, ${z.track.y})"
     data-bounds="${z.track.x},${z.track.y},${z.track.width},${z.track.height}">
  </g>

  <!-- Control zone -->
  <rect id="control-zone" data-zone="control"
        x="${z.control.x}" y="${z.control.y}"
        width="${z.control.width}" height="${z.control.height}"
        fill="none" stroke="none" pointer-events="all"
        data-bounds="${z.control.x},${z.control.y},${z.control.width},${z.control.height}" />

  <!-- Text zone -->
  <g id="text-zone" data-zone="text"
     transform="translate(${z.text.x}, ${z.text.y})"
     data-bounds="${z.text.x},${z.text.y},${z.text.width},${z.text.height}">
  </g>
</svg>
    `.trim();
}

export const metadata = {
    type: 'slider',
    name: 'minimal',
    displayName: 'Minimal',
    orientation: 'auto',
    features: [],
    defaultSize: { width: 300, height: 50 },
    configurableOptions: [],
    description: 'Minimal slider component with basic zones'
};

export default { render, calculateZones, metadata };
```

---

## Questions?

See existing components for reference:
- `default.js` - Simple component with border support
- `picard.js` - Complex component with all features

For color system details, see `src/core/colors/README.md` (if available).
