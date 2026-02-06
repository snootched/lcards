# Slider Render Function Architecture

## Overview

The render function architecture enables slider components to dynamically generate SVG markup at runtime, rather than using static SVG templates. This provides maximum flexibility for creating complex, customizable slider designs.

## Architecture Components

### 1. Component Definition

A render function component exports an object with the following properties:

```javascript
export default {
  render: (context) => string,      // Required: Generate SVG markup
  calculateZones: (w, h) => object, // Required: Calculate zone bounds
  resolveColors: (...) => object,   // Optional: Resolve state-based colors
  metadata: object                  // Required: Component metadata
};
```

### 2. Render Function Signature

```javascript
/**
 * @param {Object} context - Full render context
 * @param {number} context.width - Container width in pixels
 * @param {number} context.height - Container height in pixels
 * @param {Object} context.colors - Resolved colors from resolveColors()
 * @param {Object} context.config - Full card config (user + preset merged)
 * @param {Object} context.style - Resolved style object (preset + user overrides)
 * @param {Object} context.state - Current card state
 * @param {number} context.state.value - Current slider value
 * @param {Object} context.state.entity - Entity object
 * @param {number} context.state.min - Control min value
 * @param {number} context.state.max - Control max value
 * @param {string} context.state.domain - Entity domain
 * @param {Object} context.hass - Home Assistant object
 * @returns {string} Complete SVG markup with zone elements
 */
function render(context) {
  const { width, height, colors, config, style, state, hass } = context;
  
  // Generate SVG dynamically based on context
  return `<svg>...</svg>`;
}
```

### 3. Zone Calculation

```javascript
/**
 * Calculate zone bounds for content injection
 * @param {number} width - Container width in pixels
 * @param {number} height - Container height in pixels
 * @returns {Object} Zone definitions with bounds
 */
function calculateZones(width, height) {
  return {
    // Required: Track zone for pills/gauge content
    track: { x, y, width, height },
    
    // Required: Control zone for input overlay
    control: { x, y, width, height },
    
    // Optional: Separate progress bar zone (for gauge mode)
    progress: { x, y, width, height },
    
    // Optional: Range indicators zone
    range: { x, y, width, height },
    
    // Optional: Text zone
    text: { x, y, width, height }
  };
}
```

### 4. Color Resolution

```javascript
/**
 * Resolve state-based colors
 * @param {string} actualState - Entity's actual state value ('on', 'off', etc.)
 * @param {string} classifiedState - Classified state ('on', 'off', 'unavailable')
 * @param {Object} config - Full card config
 * @param {Object} hass - Home Assistant object
 * @returns {Object} Resolved color map
 */
function resolveColors(actualState, classifiedState, config, hass) {
  const resolveStateColor = (colorConfig, fallback) => {
    if (!colorConfig) return fallback;
    if (typeof colorConfig === 'string') return colorConfig;
    // Try actual state first, then classified state, then default
    return colorConfig[actualState] || 
           colorConfig[classifiedState] || 
           colorConfig.default || 
           fallback;
  };
  
  return {
    borderTop: resolveStateColor(config.style?.border?.top?.color, '#9DA4B9'),
    // ... other colors
  };
}
```

### 5. Metadata

```javascript
export const metadata = {
  name: 'component-name',           // Component identifier
  displayName: 'Display Name',      // Human-readable name
  orientation: 'vertical',          // 'vertical' | 'horizontal' | 'auto'
  features: [                       // List of features
    'state-aware-borders',
    'animated-indicator'
  ],
  defaultSize: {                    // Reference dimensions
    width: 365,
    height: 601
  },
  configurableOptions: [            // User-configurable options
    {
      key: 'show_animation',
      type: 'boolean',
      default: true,
      description: 'Show pulsing animation indicator'
    }
  ],
  description: 'Component description'
};
```

## Rendering Pipeline

### Slider Card Processing Flow

```
1. User selects component: 'picard'
2. Card detects render function in _loadSliderComponent()
   - Stores: _componentRenderer, _componentCalculateZones, _componentResolveColors
   - Sets: _componentLoaded = true
3. On render (_renderCard):
   a. Check if _componentRenderer exists → use _renderWithRenderer()
   b. Calculate zones: zones = calculateZones(width, height)
   c. Classify entity state: classifiedState = _classifyState(actualState)
   d. Resolve colors: colors = resolveColors(actualState, classifiedState, config, hass)
   e. Build render context: { width, height, colors, config, style, state, hass }
   f. Call render(context) → get shell SVG string
   g. Parse shell SVG to DOM
   h. Generate zone content:
      - Pills/Gauge → inject into #track-zone
      - Progress bar → inject into #progress-zone (if exists)
      - Range indicators → inject into #range-zone (if exists)
   i. Serialize back to string
   j. Render with input overlay
```

## Zone Content Injection

### Zone Element Structure

Render function components must include zone elements with specific IDs:

```xml
<!-- Track zone: Pills or gauge content -->
<g id="track-zone" data-zone="track"
   transform="translate(x, y)"
   data-bounds="x,y,width,height">
</g>

<!-- Progress zone (optional): Separate progress bar -->
<g id="progress-zone" data-zone="progress"
   transform="translate(x, y)"
   data-bounds="x,y,width,height">
</g>

<!-- Range zone (optional): Range indicators -->
<g id="range-zone" data-zone="range"
   transform="translate(x, y)"
   data-bounds="x,y,width,height">
</g>

<!-- Control zone: Invisible input overlay area -->
<rect id="control-zone" data-zone="control"
      x="x" y="y" width="width" height="height"
      fill="none" stroke="none" pointer-events="none"
      data-bounds="x,y,width,height" />
```

### Zone Coordinate System

**Zone-Local Coordinates**: Content injected into zones uses **zone-local coordinates** (origin at 0,0 within zone). Zones are positioned via SVG `transform` attribute.

Benefits:
- Content generation is independent of zone position
- Zones can be repositioned without regenerating content
- Scaling is consistent and predictable

Example:
```javascript
// Zone positioned at (100, 50) with size 200×400
// Content uses coordinates (0, 0) to (200, 400)
const progressBar = `<rect x="0" y="${barY}" width="19" height="${barHeight}" fill="#00EDED" />`;
```

## Content Generation Methods

The slider card provides helper methods for generating zone content:

### Pills Content
```javascript
_generatePillsContent(zoneSpec, orientation)
```
Generates segmented pill track using zone dimensions.

### Gauge Content
```javascript
_generateGaugeContent(zoneSpec, orientation, skipProgressBar)
```
Generates gauge ruler with ticks and labels. Set `skipProgressBar=true` for components with separate progress zones.

### Progress Bar
```javascript
_generateProgressBar(zoneSpec, orientation)
```
Generates just the progress bar rect for separate progress zones. Fills from bottom (vertical) or left (horizontal) based on current value.

### Range Indicators
```javascript
_generateRangeIndicators(zoneSpec, orientation)
```
Generates colored range bars with inset black borders and optional labels based on `config.ranges`.

## State Classification

Entity states are classified into normalized values for color resolution:

```javascript
_classifyState(state) {
  if (!state || state === 'unavailable' || state === 'unknown') {
    return 'unavailable';
  }
  
  // Domain-specific classification
  if (domain === 'light' || domain === 'switch') {
    return state === 'on' ? 'on' : 'off';
  }
  
  if (domain === 'number' || domain === 'input_number') {
    const numValue = parseFloat(state);
    return (!isNaN(numValue) && numValue > 0) ? 'on' : 'off';
  }
  
  return 'on';  // Default
}
```

## Component Registration

Register render function components in `src/core/packs/components/sliders/index.js`:

```javascript
import picardComponent from './picard.js';

export const sliderComponents = {
  'basic': {
    svg: sliderBasicSvg,
    orientation: 'auto',
    features: []
  },
  
  'picard': picardComponent  // Render function component
};
```

## Backward Compatibility

Static SVG components continue to work unchanged. The slider card detects the component type:

```javascript
if (component.render && typeof component.render === 'function') {
  // Render function component → use _renderWithRenderer()
} else if (component.svg) {
  // Static SVG component → use existing static path
}
```

## Performance Considerations

### Memoization
- Pills/gauge content is cached (existing memoization)
- Zone bounds recalculated only on resize (not on every render)

### Re-render Optimization
Avoid full re-renders on state updates:
- Only progress bar and range indicators update on value change
- Border colors update on state change (entity on/off)
- Full re-render only on container resize or config change

## Example: Picard Component

See `src/core/packs/components/sliders/picard.js` for a complete implementation example.

Key features:
- State-aware borders (blue when active, gray when inactive)
- Animated pulsing indicator (configurable)
- Separate progress bar zone
- Range indicator zone with decorative frame
- Fully customizable via config options

## Creating New Components

To create a new render function component:

1. Create file: `src/core/packs/components/sliders/my-component.js`
2. Implement required functions: `render()`, `calculateZones()`
3. Implement optional functions: `resolveColors()`
4. Define `metadata` object
5. Export default object with all functions
6. Register in `src/core/packs/components/sliders/index.js`
7. Build and test

## Testing

Verify component registration:
```javascript
import { getSliderComponent } from './src/core/packs/components/sliders/index.js';

const component = getSliderComponent('my-component');
console.log('Has render:', typeof component.render === 'function');
console.log('Has calculateZones:', typeof component.calculateZones === 'function');

// Test zone calculation
const zones = component.calculateZones(365, 601);
console.log('Zones:', zones);

// Test color resolution
const colors = component.resolveColors('on', 'on', {}, {});
console.log('Colors:', colors);
```

## Future Enhancements

Potential future additions:
- Horizontal orientation support for Picard
- Additional render function components (LCARS variants)
- Component editor UI showing configurable options from metadata
- Animation customization (fade, slide, pulse patterns)
- External pack examples with render function components
