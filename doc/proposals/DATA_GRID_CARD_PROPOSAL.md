# LCARdS Data Grid Card - Design Proposal

## Overview

This document outlines the design and implementation plan for the `lcards-data-grid` card, a new card type that provides a flexible, configurable grid display for data visualization in LCARdS.

## Background

The existing `status_grid` overlay in the MSD system demonstrates the value of grid-based data display. However, it's tightly coupled to the MSD architecture. A standalone `lcards-data-grid` card would:

1. Make grid functionality accessible outside of MSD contexts
2. Provide a simpler, more focused API for grid-based displays  
3. Enable use cases like dashboards, monitoring grids, and data tables
4. Offer a modern, schema-driven editor experience

## Architecture

### Card Component (`lcards-data-grid.js`)

The card extends `LCARdSCard` (or potentially `LCARdSNativeCard` for native Lit implementation) and provides:

- **Data Modes**:
  - `form`: Static configuration-based data
  - `random`: Randomized data for testing/demos
  - `template`: Template-based data with YAML editor
  
- **Grid System**: Leverages existing `StatusGridRenderer` where possible
- **Live Preview**: Direct updates without re-instantiation
- **Schema Integration**: Full schema coverage for validation

### Editor Dialog

The editor follows the Theme Browser pattern with `ha-tab-group` navigation:

#### Tab 1: Data
- **Mode Selector**: Radio buttons for form/random/template
- **Form Mode**:
  - `refresh_interval`: Number selector for auto-refresh
  - Cell data configuration
- **Template Mode**:  
  - Inline YAML editor
  - Template syntax highlighting
  - Validation feedback

#### Tab 2: Layout  
- **Visual Grid Designer**:
  - Interactive grid preview
  - Click to configure cells
  - Drag to resize
- **Expert Mode**:
  - All 14 CSS Grid properties
  - Text inputs with autocomplete
  - Real-time validation

#### Tab 3: Styling
- **Typography**:
  - Font family (with `lcards-font-selector`)
  - Font size, weight, transform
  - Letter spacing, line height
- **Colors**:
  - `lcards-color-picker` for all color properties
  - Preset manager with apply functionality
  - Color scheme presets
- **Borders**:
  - Border width, radius, style
  - Per-side configuration

#### Tab 4: Animation  
- **Cascade Animations**:
  - Enable/disable toggle
  - Direction, delay, duration controls
  - Real-time preview
- **Change Detection**:
  - Animate on data change
  - Transition configurations
- **Conditional Rendering**:
  - Options tied to schema presets
  - Show/hide based on animation type

#### Tab 5: Advanced
- **Performance**:
  - Debounce settings for large datasets
  - Update throttling
  - Virtual scrolling (future)
- **Metadata**:
  - Card ID, labels, tags
  - Accessibility properties
  - Debug options

### Schema Definition

```javascript
// src/schemas/data-grid-schema.js
export const dataGridSchema = {
  type: 'object',
  properties: {
    // Data Configuration
    data_mode: {
      type: 'string',
      enum: ['form', 'random', 'template'],
      default: 'form',
      description: 'Data source mode'
    },
    refresh_interval: {
      type: 'number',
      minimum: 1000,
      default: 5000,
      description: 'Auto-refresh interval in milliseconds'
    },
    template: {
      type: 'string',
      description: 'YAML template for template mode'
    },
    
    // Grid Layout
    grid: {
      type: 'object',
      properties: {
        columns: { type: 'number', minimum: 1, maximum: 12, default: 3 },
        rows: { type: 'number', minimum: 1, maximum: 12, default: 3 },
        gap: { type: 'number', minimum: 0, default: 8 },
        // ... 11 more CSS Grid properties
      }
    },
    
    // Cell Configuration
    cells: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          entity: { type: 'string' },
          label: { type: 'string' },
          value: { type: ['string', 'number', 'boolean'] },
          color: { type: 'string', format: 'color' },
          // ... additional cell properties
        }
      }
    },
    
    // Styling
    style: {
      type: 'object',
      properties: {
        // Typography
        font_family: { type: 'string', format: 'font-family' },
        font_size: { type: 'number' },
        font_weight: { type: 'string' },
        
        // Colors
        color: { type: 'string', format: 'color' },
        background: { type: 'string', format: 'color' },
        
        // Borders
        border_width: { type: 'number' },
        border_radius: { type: 'number' },
        border_color: { type: 'string', format: 'color' },
      }
    },
    
    // Animation
    animation: {
      type: 'object',
      properties: {
        cascade: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean', default: false },
            direction: { type: 'string', enum: ['ltr', 'rtl', 'ttb', 'btt'] },
            delay: { type: 'number', default: 50 },
            duration: { type: 'number', default: 300 }
          }
        },
        on_change: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean', default: true },
            effect: { type: 'string', enum: ['fade', 'slide', 'scale'] }
          }
        }
      }
    },
    
    // Advanced
    advanced: {
      type: 'object',
      properties: {
        debounce_ms: { type: 'number', default: 100 },
        debug: { type: 'boolean', default: false }
      }
    }
  }
};
```

## Implementation Plan

### Phase 1: Foundation (MVP)
- [ ] Create `lcards-data-grid.js` card component
- [ ] Implement basic grid rendering
- [ ] Add minimal schema
- [ ] Create 2-tab editor (Data, YAML)
- [ ] Integration tests

### Phase 2: Layout & Styling
- [ ] Add Layout tab with visual designer
- [ ] Add Styling tab with typography/colors/borders
- [ ] Implement CSS Grid expert mode
- [ ] Add `lcards-font-selector` integration
- [ ] Add `lcards-color-picker` integration

### Phase 3: Animation & Advanced
- [ ] Add Animation tab with cascade support
- [ ] Add change detection animations
- [ ] Add Advanced tab with performance options
- [ ] Implement live preview debouncing

### Phase 4: Enhancements
- [ ] Preset manager for styling
- [ ] Template mode with YAML editor
- [ ] Virtual scrolling for large datasets
- [ ] Accessibility improvements

## Technical Considerations

### Live Preview Implementation

```javascript
// Avoid re-instantiation by directly updating config
_updateConfigPath(path, value) {
  // Deep clone only for template evaluator
  const clonedConfig = this._needsTemplateEval(value) 
    ? deepClone(this._config) 
    : this._config;
    
  // Update path
  setNestedProperty(clonedConfig, path, value);
  
  // Fire config-changed without re-render
  this.dispatchEvent(new CustomEvent('config-changed', {
    detail: { config: clonedConfig },
    bubbles: true,
    composed: true
  }));
}
```

### Debouncing for Large Datasets

```javascript
// Debounce updates to avoid performance issues
_debouncedUpdate = debounce((config) => {
  this._updateGrid(config);
}, this._config.advanced?.debounce_ms || 100);
```

### Schema-Driven Form Generation

```javascript
// Use lcards-form for automatic field generation
render() {
  return html`
    <lcards-form
      .schema=${dataGridSchema}
      .config=${this._config}
      .hass=${this.hass}
      @value-changed=${this._handleValueChanged}
    ></lcards-form>
  `;
}
```

## Integration Points

### Existing Components to Leverage
- `StatusGridRenderer`: Core grid rendering logic
- `lcards-form`: Schema-driven form generation
- `lcards-font-selector`: Font selection with preview
- `lcards-color-picker`: Color selection with CSS variable support
- `validationService`: Runtime validation
- `TemplateProcessor`: Template evaluation

### New Components Needed
- `lcards-grid-layout-designer`: Visual grid configuration
- `lcards-data-grid-preview`: Live preview component
- `lcards-yaml-editor`: Syntax-highlighted YAML editor

## Success Criteria

1. ✅ **Build System**: No build errors, passes linting
2. ✅ **Schema Coverage**: 100% of fields defined in schema
3. ✅ **Live Preview**: All changes reflected immediately
4. ✅ **Performance**: No lag with 100+ cells
5. ✅ **Validation**: All invalid configs caught with clear errors
6. ✅ **UX**: Matches Theme Browser dialog standards
7. ✅ **Tests**: Unit tests for all major functions
8. ✅ **Documentation**: Complete user guide and API docs

## Open Questions

1. Should we support cell templates (Jinja2) for dynamic content?
2. Do we need a separate "cell editor" dialog for complex cell configs?
3. Should the visual designer support drag-and-drop cell reordering?
4. Do we want to support grid animations beyond cascade (e.g., wave, spiral)?
5. Should we add export/import functionality for grid configurations?

## References

- [StatusGridRenderer](../../src/msd/renderer/StatusGridRenderer.js)
- [StatusGridOverlay](../../src/msd/overlays/StatusGridOverlay.js)
- [Button Card Editor](../../src/editor/cb-lcars-card-editor-forms.yaml#L7023)
- [Repository Memories](../MEMORIES.md) - Font system, editor patterns, etc.

## Changelog

- 2026-01-01: Initial proposal created
