# Style Resolver

> **Centralized style resolution system with theme integration**
> Unified style resolution across all components with intelligent caching, token resolution, and provenance tracking.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Resolution Priority](#resolution-priority)
4. [Token System](#token-system)
5. [Caching](#caching)
6. [Preset Application](#preset-application)
7. [Configuration](#configuration)
8. [API Reference](#api-reference)
9. [Examples](#examples)
10. [Debugging](#debugging)

---

## Overview

The **Style Resolver** provides centralized style resolution across all MSD components with **singleton theme integration**. It handles token resolution from the singleton ThemeManager, applies intelligent caching for performance, and tracks provenance for debugging.

### Key Features

- ✅ **Multi-tier resolution** - Explicit values, tokens, theme defaults, fallbacks
- ✅ **Singleton theme integration** - Resolve tokens from shared ThemeManager singleton
- ✅ **Multi-Card consistency** - Consistent styling across all cards via shared themes
- ✅ **Token resolution** - Resolve theme tokens using dot notation
- ✅ **Intelligent caching** - Cache resolved values for performance
- ✅ **Preset support** - Apply LCARS style presets
- ✅ **Coordinated theme changes** - Automatic theme change handling across all cards
- ✅ **Provenance tracking** - Track resolution sources for debugging
- ✅ **Validation** - Validate style values

### Integrated Systems

- **ThemeManager Singleton** - Shared token resolution across all cards
- **CacheManager** - Performance optimization
- **PresetManager** - LCARS preset application
- **ProvenanceTracker** - Debugging support
- **StyleValidator** - Value validation

---

## Architecture

### System Integration

```mermaid
graph TB
    subgraph "Input Sources"
        Config[Overlay Config]
        Theme[Theme System]
        Presets[LCARS Presets]
        Defaults[System Defaults]
    end

    subgraph "Style Resolver"
        SR[StyleResolverService]

        subgraph "Components"
            TR[Token Resolver]
            CM[Cache Manager]
            PM[Preset Manager]
            SV[Style Validator]
            PT[Provenance Tracker]
        end
    end

    subgraph "Consumers"
        AR[Advanced Renderer]
        OI[Overlay Instances]
        RE[Rules Engine]
    end

    Config --> SR
    Theme --> TR
    Presets --> PM
    Defaults --> SR

    SR --> TR
    SR --> CM
    SR --> PM
    SR --> SV
    SR --> PT

    SR -.resolved styles.-> AR
    SR -.resolved styles.-> OI
    SR -.resolved styles.-> RE

    style SR fill:#f9ef97,stroke:#ac943b,stroke-width:3px,color:#0c2a15
```

### Integration with Renderer Hierarchy

```mermaid
graph TB
    subgraph PC["PipelineCore"]
        SRS[StyleResolverService]

        subgraph SRS_Internal["StyleResolverService Components"]
            TR[TokenResolver]
            TTR[ThemeTokenResolver]
        end
    end

    subgraph Renderers["Renderer Layer"]
        BR[BaseRenderer<br/>auto-integrated]
        MCR[MsdControlsRenderer<br/>card embedding]

        subgraph Specialized["Current Renderers"]
            LineR[LineOverlay]
        end
    end

    PC --> BR
    PC --> MCR

    BR --> LineR

    SRS --> TR
    TR --> TTR

    style PC fill:#b8e0c1,stroke:#266239,stroke-width:2px,color:#0c2a15
    style SRS fill:#f9ef97,stroke:#ac943b,stroke-width:3px,color:#0c2a15
    style BR fill:#80bb93,stroke:#083717,stroke-width:2px,color:#0c2a15
    style MCR fill:#80bb93,stroke:#083717,stroke-width:2px,color:#0c2a15
```

**Integration Points:**

- **PipelineCore** - Creates StyleResolverService during initialization
- **BaseRenderer** - Automatic integration via `this.styleResolver` property
- **LineOverlay** - Inherits from OverlayBase
- **MsdControlsRenderer** - Handles card-based overlays (LCARdSCards, HA cards)

**Resolution Chain:**

1. **Explicit Value** - Direct value from overlay config (highest priority)
2. **Token Resolution** - Resolve via ThemeTokenResolver
3. **Theme Default** - Component-specific defaults from theme
4. **Preset Value** - From LCARS presets (if applied)
5. **System Fallback** - Hardcoded default (lowest priority)

### Resolution Flow

```mermaid
sequenceDiagram
    participant OI as Overlay Instance
    participant SR as Style Resolver
    participant Cache as Cache Manager
    participant TR as Token Resolver
    participant TM as Theme Manager

    OI->>SR: resolveProperty(property, value, tokenPath)

    SR->>Cache: get(cacheKey)
    alt Cached
        Cache-->>SR: cached value
        SR-->>OI: {value, source: 'cache'}
    else Not cached
        Cache-->>SR: null

        alt Has explicit value
            SR->>SV: validate(value)
            SR-->>OI: {value, source: 'explicit'}
        else Has token path
            SR->>TR: resolve(tokenPath)
            TR->>TM: getToken(path)
            TM-->>TR: token value
            TR-->>SR: resolved value
            SR->>Cache: set(cacheKey, value)
            SR-->>OI: {value, source: 'token'}
        else Use theme default
            SR->>TM: getComponentDefaults(type)
            TM-->>SR: defaults
            SR->>Cache: set(cacheKey, value)
            SR-->>OI: {value, source: 'theme'}
        end
    end
```

---

## Resolution Priority

The Style Resolver follows a strict priority chain:

### Priority Chain

```
1. Explicit Value (from overlay config)
   ↓ (if undefined)
2. Token Reference (from theme)
   ↓ (if not found)
3. Theme Component Default
   ↓ (if not found)
4. LCARS Preset Value
   ↓ (if not found)
5. System Fallback
```

### Examples

#### 1. Explicit Value (Highest Priority)

```yaml
overlays:
  - id: power_line
    type: line
    style:
      color: '#FF0000'    # Explicit - used directly
```

**Result:** `{value: '#FF0000', source: 'explicit'}`

#### 2. Token Reference

```yaml
overlays:
  - id: power_line
    type: line
    style:
      color: 'colors.accent.primary'    # Token reference
```

**Result:** `{value: '#FF9900', source: 'token_system'}`

#### 3. Theme Default

```yaml
overlays:
  - id: power_line
    type: line
    style:
      # No color specified - uses theme default
```

**Result:** `{value: '#FFFFFF', source: 'theme_default'}`

#### 4. Card Styling

```yaml
overlays:
  - id: control_panel
    type: control
    position: [100, 100]
    size: [200, 80]
    card:
      type: custom:lcards-button-card
      entity: light.main
      # Card handles its own styling via themes
```

**Result:** Card uses LCARdS theme tokens internally

#### 5. System Fallback

```yaml
overlays:
  - id: unknown_line
    type: line
    style:
      # No value, token, theme, or preset available
```

**Result:** `{value: 'transparent', source: 'system_fallback'}`

---

## Token System

### Token Path Format

Tokens use **dot notation** to reference theme values:

```
category.subcategory.property
```

### Token Categories

| Category | Purpose | Examples |
|----------|---------|----------|
| `colors` | Color values | `colors.accent.primary`, `colors.ui.border` |
| `typography` | Font settings | `typography.fontFamily.primary`, `typography.fontSize.xl` |
| `spacing` | Spacing values | `spacing.scale.4`, `spacing.gap.base` |
| `borders` | Border properties | `borders.width.base`, `borders.radius.lg` |
| `effects` | Visual effects | `effects.opacity.muted`, `effects.glow.accent` |
| `animations` | Animation settings | `animations.duration.fast`, `animations.easing.ease` |
| `components` | Component defaults | `components.text.defaultColor` |

### Using Tokens

```yaml
overlays:
  - id: styled_line
    type: line
    attach_start: anchor1.middle-right
    attach_end: anchor2.middle-left
    style:
      # Token references
      color: 'colors.accent.primary'
      stroke_width: 3
      
      # Explicit values override tokens
      marker_end: 'arrow'
```

### Token Resolution

The TokenResolver handles token resolution:

```javascript
// Resolve a token path
const value = tokenResolver.resolve('colors.accent.primary');
// Returns: '#FF9900'

// Nested tokens
const fontSize = tokenResolver.resolve('typography.fontSize.xl');
// Returns: '24px'
```

### Token References

Tokens can reference other tokens:

```javascript
// Theme tokens
{
  colors: {
    base: '#FF9900',
    primary: 'colors.base',        // References colors.base
    accent: 'colors.primary'        // References colors.primary (→ colors.base)
  }
}

// Resolution
tokenResolver.resolve('colors.accent');
// Returns: '#FF9900'
```

---

## Caching

### Cache Strategy

The Style Resolver uses intelligent caching to optimize performance:

```javascript
// Cache key generation
const cacheKey = `${property}:${value}:${tokenPath}:${contextHash}`;

// Cache lookup
const cached = cache.get('property', cacheKey);
if (cached) {
  return cached;
}

// Cache storage
cache.set('property', cacheKey, {
  value: resolvedValue,
  source: 'token_system',
  timestamp: Date.now()
});
```

### Cache Invalidation

Cache is automatically invalidated when:

1. **Theme changes** - All caches cleared
2. **Configuration updates** - Affected caches cleared
3. **Cache size limit** - LRU eviction
4. **Manual clear** - Developer-triggered

### Cache Statistics

```javascript
const stats = styleResolver.getCacheStats();
console.log(stats);
// {
//   size: 245,
//   hits: 1234,
//   misses: 156,
//   hitRate: 0.888,
//   tokenResolutions: 89,
//   averageResolutionTime: 0.12
// }
```

### Performance Impact

- **Without cache:** ~0.5-2ms per resolution
- **With cache:** ~0.01ms per resolution
- **Improvement:** 50-200x faster for repeated resolutions

---

## Preset Application

### LCARS Presets

Presets provide predefined style bundles for lines and cards:

```yaml
overlays:
  - id: power_line
    type: line
    style:
      preset: 'dashed'
      # Preset provides: dash_array, stroke_width

      # Override specific properties
      color: '#00FF00'    # Overrides preset color
```

### Available Presets

#### Line Presets

| Preset | Description | Style |
|--------|-------------|-------|
| `solid` | Solid line | `dash_array: none` |
| `dashed` | Standard dashes | `dash_array: 5,5` |
| `dotted` | Dotted line | `dash_array: 2,2` |
| `thick` | Wide line | `stroke_width: 4` |

> **Note:** Card styling presets are handled by individual LCARdSCards (e.g., `lcards-button-card`) via their own preset systems.

### Preset Resolution

```javascript
// Apply preset
const presetStyles = presetManager.apply('dashed', 'line');
// Returns: {
//   dash_array: '5,5',
//   stroke_width: 2
// }

// Merge with explicit values
const finalStyles = {
  ...presetStyles,
  ...overlay.style    // Explicit values override preset
};
```

---

## Configuration

### Service Configuration

```javascript
const styleResolver = new StyleResolverService(themeManager, {
  // Cache settings
  cacheEnabled: true,
  maxCacheSize: 1000,

  // Debug settings
  debug: false,
  trackProvenance: true,

  // Preset configuration
  presets: {
    line: {
      dashed: { /* preset styles */ },
      dotted: { /* preset styles */ }
    }
  }
});
```

### Theme Integration

```yaml
msd_config:
  theme: lcars-classic    # Active theme

  custom_theme:
    tokens:
      colors:
        primary: '#FF9900'
      typography:
        fontSize:
          xl: '24px'
```

---

## API Reference

### Constructor

```javascript
new StyleResolverService(themeManager, config)
```

**Parameters:**
- `themeManager` (Object) - ThemeManager instance
- `config` (Object) - Configuration options
  - `cacheEnabled` (boolean) - Enable caching (default: true)
  - `maxCacheSize` (number) - Max cache entries (default: 1000)
  - `debug` (boolean) - Enable debug logging (default: false)

### Methods

#### `resolveProperty(options)`

Resolve a single style property.

```javascript
const result = styleResolver.resolveProperty({
  property: 'color',
  value: overlay.style?.color,
  tokenPath: 'colors.primary',
  defaultValue: '#FF9900',
  context: { overlayId: 'my-text', overlayType: 'text' },
  componentType: 'text'
});
```

**Parameters:**
- `options.property` (string) - Property name
- `options.value` (*) - Explicit value from config
- `options.tokenPath` (string) - Token path to resolve
- `options.defaultValue` (*) - Final fallback
- `options.context` (Object) - Resolution context
- `options.componentType` (string) - Component type

**Returns:** Object `{value, source, provenance}`

#### `resolveStyles(overlay, componentType)`

Resolve all styles for an overlay.

```javascript
const styles = styleResolver.resolveStyles(overlay, 'text');
// Returns: {
//   color: {value: '#FF9900', source: 'token'},
//   font_size: {value: '24px', source: 'theme'},
//   ...
// }
```

#### `getCacheStats()`

Get cache statistics.

```javascript
const stats = styleResolver.getCacheStats();
```

**Returns:** Object with cache metrics

#### `clearCache()`

Clear all caches.

```javascript
styleResolver.clearCache();
```

#### `onThemeChange(callback)`

Subscribe to theme changes.

```javascript
const unsubscribe = styleResolver.onThemeChange((themeName, theme) => {
  console.log('Theme changed:', themeName);
});

// Later: unsubscribe()
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `themeManager` | ThemeManager | Theme system reference |
| `cache` | CacheManager | Cache manager instance |
| `tokenResolver` | TokenResolver | Token resolution |
| `presetManager` | PresetManager | Preset application |
| `stats` | Object | Resolution statistics |

---

## Examples

### Example 1: Basic Resolution

```javascript
// Resolve color property
const result = styleResolver.resolveProperty({
  property: 'color',
  value: undefined,
  tokenPath: 'colors.accent.primary',
  defaultValue: '#FF9900'
});

console.log(result);
// {
//   value: '#FF9900',
//   source: 'token_system',
//   provenance: {
//     tokenPath: 'colors.accent.primary',
//     resolvedAt: 1234567890
//   }
// }
```

### Example 2: With Explicit Value

```javascript
const result = styleResolver.resolveProperty({
  property: 'color',
  value: '#FF0000',              // Explicit value
  tokenPath: 'colors.primary',   // Ignored (explicit takes priority)
  defaultValue: '#FF9900'
});

console.log(result);
// {
//   value: '#FF0000',
//   source: 'explicit',
//   provenance: { explicit: true }
// }
```

### Example 3: Full Overlay Resolution

```yaml
data_sources:
  temperature:
    type: entity
    entity: sensor.temperature

overlays:
  - id: power_line
    type: line
    attach_start: temp_sensor.middle-right
    attach_end: display_panel.middle-left
    style:
      color: 'colors.accent.primary'
      stroke_width: 3
      marker_end: 'arrow'
```

**Resolution:**
```javascript
const styles = styleResolver.resolveStyles(overlay, 'line');
// {
//   color: {value: '#FF9900', source: 'token'},
//   stroke_width: {value: 3, source: 'explicit'},
//   marker_end: {value: 'arrow', source: 'explicit'}
// }
```

---

## Debugging

### Enable Debug Logging

```javascript
styleResolver.config.debug = true;
```

### Browser Console Access

```javascript
// Access StyleResolver
const sr = window.lcards.debug.msd.pipelineInstance.coordinator.styleResolver;

// Check cache stats
console.log(sr.getCacheStats());

// Resolve property manually
const result = sr.resolveProperty({
  property: 'color',
  tokenPath: 'colors.primary'
});
console.log('Resolved:', result);
```

### Provenance Tracking

```javascript
// Enable provenance tracking
styleResolver.config.trackProvenance = true;

// Check resolution provenance
const result = styleResolver.resolveProperty({
  property: 'color',
  tokenPath: 'colors.accent.primary'
});

console.log('Provenance:', result.provenance);
// {
//   tokenPath: 'colors.accent.primary',
//   resolvedValue: '#FF9900',
//   resolutionTime: 0.12,
//   cacheHit: false,
//   source: 'token_system'
// }
```

### Resolution Sources

Track where each value came from:

```javascript
const styles = styleResolver.resolveStyles(overlay, 'text');

Object.entries(styles).forEach(([prop, result]) => {
  console.log(`${prop}: ${result.value} (${result.source})`);
});
// color: #FF9900 (token_system)
// font_size: 24px (theme_default)
// border_color: transparent (system_fallback)
```

---

## 📚 Related Documentation

- **[Theme System](theme-system.md)** - Theme management
- **[Advanced Renderer](advanced-renderer.md)** - Rendering system
- **[Overlay System](../../user/configuration/overlays/README.md)** - Overlay types
