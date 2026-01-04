# Chart Editor Implementation Plan

**Version:** 1.0  
**Status:** Phase 1 Complete - Foundation  
**Last Updated:** 2026-01-04

---

## Overview

This document outlines the complete implementation plan for the LCARdS Chart Configuration Studio - a full-screen immersive editor for configuring chart cards with 16 chart types and comprehensive styling options.

The implementation follows a proven 5-phase approach that delivers incremental value while maintaining code quality and testability.

---

## Architecture

### Design Pattern: Studio Dialog with Live Preview

Following the successful data-grid editor pattern:

```
┌─────────────────────────────────────────────────────────────────┐
│  Chart Configuration Studio                    [Save] [Cancel]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────┐  ┌──────────────────────────────┐ │
│  │  Configuration (60%)    │  │  Live Preview (40%)          │ │
│  │                         │  │                              │ │
│  │  ┌──Tab Navigation───┐  │  │  ┌────────────────────────┐ │ │
│  │  │ Data│Chart│Colors │  │  │  │                        │ │ │
│  │  └────────────────────┘  │  │  │   <lcards-chart>       │ │ │
│  │                         │  │  │                        │ │ │
│  │  ┌──Tab Content──────┐  │  │  │    (Live Preview)      │ │ │
│  │  │                   │  │  │  │                        │ │ │
│  │  │  Form fields,     │  │  │  │                        │ │ │
│  │  │  color pickers,   │  │  │  └────────────────────────┘ │ │
│  │  │  sliders, etc.    │  │  │                              │ │
│  │  │                   │  │  │  [Refresh Preview]           │ │
│  │  │  (Scrollable)     │  │  │                              │ │
│  │  └───────────────────┘  │  │  (Sticky positioning)        │ │
│  └─────────────────────────┘  └──────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Component Architecture

```
lcards-chart-editor.js (Main Editor)
    │
    ├─ Configuration Tab
    │   ├─ Studio Launcher Card
    │   ├─ Card Metadata (id, name, tags)
    │   └─ Configuration Summary
    │
    ├─ Utility Tabs (from LCARdSBaseEditor)
    │   ├─ DataSources
    │   ├─ Templates
    │   ├─ Rules
    │   ├─ Theme
    │   ├─ YAML
    │   ├─ Developer
    │   └─ Provenance
    │
    └─ Opens Studio Dialog ──────────┐
                                     │
                                     ▼
        lcards-chart-studio-dialog.js (Studio)
            │
            ├─ Dialog Shell (95vw × 90vh)
            │   ├─ Header (Title + Buttons)
            │   ├─ Split Panel Layout (60/40)
            │   └─ Event System
            │
            ├─ Configuration Panel (60%)
            │   ├─ Tab Navigation (10 tabs)
            │   └─ Tab Content (scrollable)
            │
            └─ Preview Panel (40%)
                └─ lcards-chart-live-preview.js
                    ├─ Preview Header
                    ├─ <lcards-chart> Instance
                    ├─ Debounced Updates (300ms)
                    └─ Manual Refresh Button
```

---

## Phase 1: Foundation (COMPLETE)

**Status:** ✅ Complete  
**Estimated Effort:** 3-5 days  
**Code Size:** ~2,900 lines

### Goals

1. Establish core architecture
2. Create 10-tab structure with placeholders
3. Implement live preview system
4. Document complete implementation roadmap

### Deliverables

#### 1. Chart Editor (`src/editor/cards/lcards-chart-editor.js`)
✅ Extends `LCARdSBaseEditor`  
✅ Configuration tab with studio launcher  
✅ Card metadata fields (id, name, tags)  
✅ `_openChartStudio()` method  
✅ Event handling for studio changes  
✅ Utility tabs integration

**Key Features:**
- Prominent "Open Configuration Studio" button
- Clean, minimal interface
- Full integration with base editor utilities

#### 2. Studio Dialog (`src/editor/dialogs/lcards-chart-studio-dialog.js`)
✅ Split-panel layout (60% config / 40% preview)  
✅ Dialog header with Save/Cancel/Reset buttons  
✅ 10-tab navigation structure  
✅ Tab content placeholder rendering  
✅ Working copy config management  
✅ Event dispatching (config-changed, closed)  
✅ Validation error display area

**Tab Structure:**
1. **Data Sources** - Coming in Phase 2
2. **Chart Type** - Coming in Phase 3
3. **Colors** - Coming in Phase 3
4. **Stroke & Fill** - Coming in Phase 3
5. **Markers & Grid** - Coming in Phase 3
6. **Axes** - Coming in Phase 4
7. **Legend & Labels** - Coming in Phase 4
8. **Theme** - Coming in Phase 4
9. **Animation** - Coming in Phase 4
10. **Advanced** - Coming in Phase 5

#### 3. Live Preview (`src/editor/components/lcards-chart-live-preview.js`)
✅ Preview container with header  
✅ Debounced config updates (300ms)  
✅ Manual refresh button  
✅ Renders `<lcards-chart>` element  
✅ Empty state handling  
✅ HASS instance passing  
✅ Key-based re-rendering

#### 4. Chart Card Integration (`src/cards/lcards-chart.js`)
✅ Import chart editor  
✅ Add `getConfigElement()` static method  
✅ Editor registration with Home Assistant

#### 5. Implementation Plan (`CHART_EDITOR_IMPLEMENTATION_PLAN.md`)
✅ Complete 5-phase roadmap (this document)  
✅ Architecture diagrams  
✅ Detailed task breakdown  
✅ Integration points  
✅ Testing checklist

---

## Phase 2: Data Sources Tab

**Status:** 🔜 Planned  
**Estimated Effort:** 5-7 days  
**Code Size:** ~800 lines

### Goals

1. Implement entity/DataSource selection
2. Support multi-series configuration
3. Add data transformation options
4. Handle source validation

### Features

#### Basic Data Source Selection
- [ ] Entity picker (single source)
- [ ] DataSource picker (integration with DataSourceManager)
- [ ] Source type toggle (entity vs datasource)
- [ ] Entity state display

#### Multi-Series Support
- [ ] Add/remove series
- [ ] Series naming
- [ ] Per-series entity/datasource selection
- [ ] Series ordering (drag-and-drop)

#### Data Configuration
- [ ] History hours slider (for time-series)
- [ ] Max points limit
- [ ] Update interval
- [ ] Data aggregation options (avg, min, max, last)

#### Advanced DataSource Config
- [ ] Transformation pipeline builder
- [ ] Moving average window
- [ ] Smoothing options
- [ ] Data filtering

### Integration Points

- `window.lcards.core.dataSourceManager` - DataSource management
- `lcards-datasource-picker-dialog` - DataSource selection UI
- `chart-schema.js` - Schema for data sources configuration

### Testing Checklist

- [ ] Single entity selection works
- [ ] Multi-series adds/removes correctly
- [ ] DataSource picker opens and selects
- [ ] Config saves properly
- [ ] Preview updates with new sources
- [ ] Validation catches missing sources

---

## Phase 3: Visual Tabs (Chart Type, Colors, Stroke, Markers)

**Status:** 🔜 Planned  
**Estimated Effort:** 10-12 days  
**Code Size:** ~1,500 lines

### Goals

1. Implement visual chart type selector
2. Build comprehensive color configuration
3. Add stroke and fill styling
4. Configure markers and grid

### Features

#### Chart Type Tab
- [ ] Visual grid of 16 chart types with icons
- [ ] Chart type cards (clickable)
- [ ] Dimension configuration (width/height)
- [ ] Stacked/grouped toggle (for bar/column)
- [ ] Chart orientation (horizontal/vertical)

**Chart Types:**
- Line, Area, Bar, Column
- Scatter, Pie, Donut
- Heatmap, RadialBar, Radar, PolarArea
- Treemap, RangeBar, RangeArea
- Candlestick, BoxPlot

#### Colors Tab
- [ ] Series colors (array editor)
- [ ] Color picker integration
- [ ] Theme token support
- [ ] Background colors
- [ ] Marker colors
- [ ] Legend colors
- [ ] Data label colors

#### Stroke & Fill Tab
- [ ] Stroke width slider
- [ ] Stroke color picker
- [ ] Line curve type (smooth, straight, stepline)
- [ ] Dash array configuration
- [ ] Fill type (solid, gradient, pattern)
- [ ] Fill opacity slider
- [ ] Gradient configuration
  - [ ] Type (linear/radial)
  - [ ] Color stops
  - [ ] Direction

#### Markers & Grid Tab
- [ ] Marker enable/disable toggle
- [ ] Marker size slider
- [ ] Marker shape selector
- [ ] Marker colors
- [ ] Grid line configuration
  - [ ] Show/hide X/Y grid
  - [ ] Grid color
  - [ ] Grid dash pattern
- [ ] Gridline position (front/back)

### Component Requirements

- `lcards-color-picker` - Enhanced color selection
- `lcards-gradient-editor` - Gradient configuration (new)
- `lcards-chart-type-selector` - Visual chart type picker (new)
- Array editors for multi-value properties

### Integration Points

- Chart schema `colors` property group
- Chart schema `stroke` property group
- Chart schema `fill` property group
- Chart schema `markers` property group
- Chart schema `grid` property group

### Testing Checklist

- [ ] All 16 chart types selectable
- [ ] Chart type changes update preview
- [ ] Color picker works with theme tokens
- [ ] Gradient configuration applies correctly
- [ ] Stroke styling updates in real-time
- [ ] Marker configuration works
- [ ] Grid lines toggle properly

---

## Phase 4: Style Tabs (Axes, Legend, Theme, Animation)

**Status:** 🔜 Planned  
**Estimated Effort:** 8-10 days  
**Code Size:** ~1,200 lines

### Goals

1. Configure X/Y axes styling
2. Set up legend and labels
3. Apply theme settings
4. Configure animations

### Features

#### Axes Tab
- [ ] X-axis configuration
  - [ ] Type (datetime, numeric, category)
  - [ ] Title and styling
  - [ ] Labels (show/hide, format, rotation)
  - [ ] Tick configuration
  - [ ] Border styling
- [ ] Y-axis configuration
  - [ ] Multiple Y-axes support
  - [ ] Title and styling
  - [ ] Min/max values
  - [ ] Tick interval
  - [ ] Opposite side toggle
- [ ] Axis colors and fonts

#### Legend & Labels Tab
- [ ] Legend enable/disable
- [ ] Legend position (top, right, bottom, left)
- [ ] Legend alignment
- [ ] Legend markers
- [ ] Legend colors
- [ ] Data labels configuration
  - [ ] Enable/disable
  - [ ] Position
  - [ ] Format
  - [ ] Offset
- [ ] Tooltip configuration
  - [ ] Enable/disable
  - [ ] Shared tooltip
  - [ ] Custom formatting

#### Theme Tab
- [ ] Theme mode (light/dark/auto)
- [ ] Palette selection (palette1-10)
- [ ] Monochrome enable/disable
- [ ] Monochrome color
- [ ] Custom theme colors
- [ ] Font family override

#### Animation Tab
- [ ] Animation preset selector
  - [ ] lcars_standard
  - [ ] lcars_dramatic
  - [ ] lcars_minimal
  - [ ] lcars_realtime
  - [ ] lcars_alert
  - [ ] none
- [ ] Custom animation speed
- [ ] Animation easing
- [ ] Animation enable/disable per series
- [ ] Dynamic animations toggle

### Component Requirements

- `lcards-animation-preset-selector` - Visual animation picker (new)
- `lcards-axis-editor` - Axis configuration (new)
- Position pickers for legend/labels

### Integration Points

- Chart schema `xaxis` property group
- Chart schema `yaxis` property group
- Chart schema `legend` property group
- Chart schema `dataLabels` property group
- Chart schema `theme` property group
- Chart schema `animation` property group

### Testing Checklist

- [ ] Axes configuration applies correctly
- [ ] Legend positions work
- [ ] Data labels display properly
- [ ] Theme changes update chart
- [ ] Animation presets apply
- [ ] Custom animations work

---

## Phase 5: Advanced Tab

**Status:** 🔜 Planned  
**Estimated Effort:** 5-7 days  
**Code Size:** ~700 lines

### Goals

1. Add custom formatters
2. Configure typography
3. Expose display options
4. Allow raw chart_options override

### Features

#### Formatters Section
- [ ] Value formatter (template-based)
- [ ] X-axis formatter
- [ ] Y-axis formatter
- [ ] Tooltip formatter
- [ ] Legend formatter
- [ ] Data label formatter
- [ ] Template evaluation preview

#### Typography Section
- [ ] Font family selector
- [ ] Font size configuration
- [ ] Font weight options
- [ ] Text color overrides
- [ ] Per-element typography
  - [ ] Title
  - [ ] Subtitle
  - [ ] Axis labels
  - [ ] Data labels
  - [ ] Legend

#### Display Options
- [ ] Chart width/height
- [ ] Responsive mode toggle
- [ ] Maintain aspect ratio
- [ ] Zoom enable/disable
- - [ ] Pan enable/disable
- [ ] Selection enable/disable
- [ ] Export menu configuration

#### Raw Override Section
- [ ] JSON editor for `chart_options`
- [ ] Syntax highlighting
- [ ] Validation
- [ ] Warning about overrides
- [ ] Documentation links

### Component Requirements

- `lcards-json-editor` - JSON editing with validation (new)
- `lcards-font-selector` - Font family picker (existing)
- Template editor integration

### Integration Points

- Chart schema `formatters` property group
- Chart schema `typography` property group
- Chart schema `display` property group
- Chart schema `chart_options` property

### Testing Checklist

- [ ] Formatters apply correctly
- [ ] Typography changes work
- [ ] Display options affect chart
- [ ] Raw override works
- [ ] JSON validation catches errors
- [ ] Template formatters evaluate

---

## File Structure

```
src/
├── cards/
│   └── lcards-chart.js                         # Modified - add getConfigElement()
├── editor/
│   ├── cards/
│   │   └── lcards-chart-editor.js              # Phase 1 - Main editor
│   ├── dialogs/
│   │   └── lcards-chart-studio-dialog.js       # Phase 1 - Studio dialog
│   └── components/
│       ├── lcards-chart-live-preview.js        # Phase 1 - Preview
│       ├── lcards-chart-type-selector.js       # Phase 3 - Chart type picker
│       ├── lcards-gradient-editor.js           # Phase 3 - Gradient config
│       ├── lcards-animation-preset-selector.js # Phase 4 - Animation picker
│       ├── lcards-axis-editor.js               # Phase 4 - Axis config
│       └── lcards-json-editor.js               # Phase 5 - JSON editor
└── CHART_EDITOR_IMPLEMENTATION_PLAN.md         # This document
```

---

## Integration Points

### Existing Components to Use

- `LCARdSBaseEditor` - Base class for editors
- `lcards-form-section` - Collapsible form sections
- `lcards-message` - Info/warning/error messages
- `LCARdSFormFieldHelper` - Form field helpers
- `lcards-color-picker` - Color selection
- `lcards-font-selector` - Font family picker
- `lcards-datasource-picker-dialog` - DataSource selection
- `editorStyles` - Shared editor CSS

### Core Systems

- `window.lcards.core.dataSourceManager` - DataSource management
- `window.lcards.core.themeManager` - Theme tokens
- `window.lcards.core.rulesManager` - Conditional styling
- `window.lcards.core.configManager` - Schema validation

### Chart System

- `lcards-chart` - The chart card component
- `ApexChartsAdapter` - ApexCharts integration
- `chart-schema.js` - Complete chart schema

---

## Testing Strategy

### Phase 1 (Manual Testing in HA)

1. **Build & Deploy:**
   ```bash
   npm run build
   cp dist/lcards.js /path/to/homeassistant/www/
   ```

2. **Test Editor Registration:**
   - Add chart card to dashboard
   - Verify "Edit" button appears
   - Click edit, verify chart editor opens

3. **Test Studio Launch:**
   - Click "Open Configuration Studio"
   - Verify full-screen dialog opens
   - Verify all 10 tabs visible
   - Test tab switching

4. **Test Dialog Buttons:**
   - Save: Should close and fire config-changed
   - Cancel: Should close without saving
   - Reset: Should restore original config

5. **Test Preview:**
   - Verify preview panel renders
   - Verify empty state when no config
   - Click refresh button

### Later Phases

- Unit tests for tab rendering
- Integration tests for config updates
- Visual regression tests for dialog layout
- E2E tests for complete workflows

---

## Code Size Estimates

| Component | Lines | Phase |
|-----------|-------|-------|
| Chart Editor | ~400 | 1 |
| Studio Dialog Shell | ~800 | 1 |
| Live Preview | ~200 | 1 |
| Implementation Plan | ~1,500 | 1 |
| **Phase 1 Total** | **~2,900** | **1** |
| Data Sources Tab | ~800 | 2 |
| Chart Type Tab | ~400 | 3 |
| Colors Tab | ~350 | 3 |
| Stroke & Fill Tab | ~350 | 3 |
| Markers & Grid Tab | ~400 | 3 |
| **Phase 3 Total** | **~1,500** | **3** |
| Axes Tab | ~500 | 4 |
| Legend & Labels Tab | ~400 | 4 |
| Theme Tab | ~200 | 4 |
| Animation Tab | ~300 | 4 |
| **Phase 4 Total** | **~1,400** | **4** |
| Advanced Tab | ~700 | 5 |
| **Phase 5 Total** | **~700** | **5** |
| **Grand Total** | **~7,300** | **All** |

---

## Timeline Estimates

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1 | 3-5 days | None |
| Phase 2 | 5-7 days | Phase 1 |
| Phase 3 | 10-12 days | Phase 2 |
| Phase 4 | 8-10 days | Phase 3 |
| Phase 5 | 5-7 days | Phase 4 |
| **Total** | **31-41 days** | Sequential |

**Note:** Timelines assume single developer, full-time work. Parallel development possible for some tasks.

---

## Success Criteria

### Phase 1 (Current)
✅ Build completes without errors  
✅ Chart card shows "Edit" option in HA  
✅ Editor opens when clicking "Edit"  
✅ Studio launcher button visible  
✅ Studio dialog opens in full-screen  
✅ All 10 tabs visible and switchable  
✅ "Coming in Phase X" messages display  
✅ Live preview panel shows (empty initially)  
✅ Save/Cancel/Reset buttons work  
✅ Dialog cleans up on close  

### Future Phases
- All tab content implemented
- Config validation works
- Preview updates in real-time
- All 16 chart types supported
- Color configuration complete
- Animation presets work
- DataSource integration functional

---

## Migration Notes

**Non-breaking addition:**
- New editor component, doesn't affect existing charts
- Editor registration is optional (cards work without it)
- No changes to chart card behavior or API
- Backward compatible with manual YAML editing

**For Users:**
- Visual editor becomes available for chart cards
- YAML editing still fully supported
- Can switch between visual and YAML at any time
- Existing chart configs work unchanged

---

## References

### Existing Patterns
- `src/editor/cards/lcards-data-grid-editor.js` - Launcher pattern
- `src/editor/dialogs/lcards-data-grid-studio-dialog.js` - Split-panel layout
- `src/editor/components/lcards-data-grid-live-preview.js` - Preview component

### Schema
- `src/cards/schemas/chart-schema.js` - Complete chart schema with x-ui-hints

### Documentation
- `DATA_GRID_EDITOR_IMPLEMENTATION.md` - Similar implementation doc
- `SPREADSHEET_EDITOR_IMPLEMENTATION.md` - Dialog pattern reference

---

## Change Log

### 2026-01-04 - Phase 1 Complete
- Created chart editor with studio launcher
- Implemented studio dialog shell with 10-tab structure
- Built live preview component with debouncing
- Added getConfigElement() to chart card
- Documented complete implementation plan

---

## Next Steps

1. **Test Phase 1 in Home Assistant**
   - Manual testing following checklist above
   - Document any issues or improvements

2. **Begin Phase 2: Data Sources Tab**
   - Implement entity/DataSource selection
   - Add multi-series support
   - Build transformation UI

3. **Iterate Based on Feedback**
   - Gather user feedback on Phase 1
   - Adjust Phase 2+ plans as needed
   - Maintain this document as single source of truth

---

**End of Implementation Plan**
