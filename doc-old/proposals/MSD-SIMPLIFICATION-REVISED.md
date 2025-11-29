# MSD Simplification: Revised Implementation Plan

**Date:** 22 November 2025
**Goal:** Transform MSD overlays to use SimpleCards exclusively
**Timeline:** 3-4 weeks
**Breaking Changes:** YES - No backward compatibility

---

## Executive Summary

MSD currently duplicates functionality that exists in SimpleCards. This refactor:

1. **Removes duplicate overlays**: ButtonOverlay, TextOverlay, ApexChartsOverlay, StatusGridOverlay
2. **Unifies card rendering**: All cards (SimpleCards & HA cards) use existing MsdControlsRenderer
3. **Simplifies config**: Single overlay pattern using `type:` field
4. **Reduces code**: ~100KB deletion, no new code needed

**Key Insight:** We already have the perfect system - MsdControlsRenderer handles foreignObject positioning for any card type. We just need to:
- Port ApexChartsOverlay → lcards-simple-chart
- Delete the old overlay classes
- Route everything through MsdControlsRenderer

---

## Current Architecture (Problem)

```
MSD Overlays (4 different patterns):
├── ButtonOverlay.js (~35KB)         ❌ Duplicates lcards-simple-button
├── TextOverlay.js (~48KB)           ❌ Can use enhanced lcards-simple-button
├── ApexChartsOverlay.js (~8KB)      ❌ Should be SimpleCard
├── StatusGridOverlay.js (~8KB)      ❌ Replace with Grid + SimpleButtons
├── LineOverlay.js                   ✅ Keep (SVG-specific)
└── MsdControlsRenderer.js           ✅ Already perfect for cards!
```

**Config Complexity:**
```yaml
# Today we have 4+ different patterns:
- type: button        # → ButtonOverlay
- type: text          # → TextOverlay
- type: apexchart     # → ApexChartsOverlay
- type: status_grid   # → StatusGridOverlay
- type: control       # → MsdControlsRenderer
  card:
    type: custom:some-card
- type: line          # → LineOverlay
```

---

## Target Architecture (Solution)

```
MSD = Universal Canvas System
  │
  ├─ SVG-Native Overlays (MSD-specific)
  │   └── LineOverlay - Routed SVG paths
  │
  └─ Card-Based Overlays (Universal via MsdControlsRenderer)
      ├── SimpleCards
      │   ├── lcards-simple-button
      │   ├── lcards-simple-chart (new)
      │   └── (future: lcards-simple-text if needed)
      │
      └── HA Cards
          └── Any HA card (entities, grid, etc.)
```

**Config Simplicity:**
```yaml
# After refactor - single unified pattern:
- type: custom:lcards-simple-button
  entity: light.bedroom
  position: anchor_1

- type: custom:lcards-simple-chart
  source: sensor.temperature
  position: anchor_2

- type: entities
  entities: [...]
  position: anchor_3

- type: line              # Only special case
  from: anchor_1
  to: anchor_2
```

**Detection Logic:**
```javascript
// In AdvancedRenderer._renderOverlay():
if (overlay.type === 'line') {
  return LineOverlay.render(...);
}

// Everything else is a card → delegate to MsdControlsRenderer
return this.systemsManager.controlsRenderer.render(overlay, ...);
```

---

## Implementation Plan

### Week 1: Create lcards-simple-chart

**Objective:** Port ApexChartsOverlay → SimpleCard

#### File to Create: `src/cards/lcards-simple-chart.js`

```javascript
/**
 * LCARdS Simple Chart Card
 *
 * Data visualization using ApexCharts library (already bundled).
 * Ports functionality from ApexChartsOverlay to standalone SimpleCard.
 *
 * Features:
 * - Real-time data updates via DataSourceManager
 * - Multiple chart types (line, area, bar, etc.)
 * - Theme token integration
 * - Rules-based dynamic styling
 * - Time-series support
 */

import { html, css } from 'lit';
import { LCARdSSimpleCard } from '../base/LCARdSSimpleCard.js';
import { lcardsLog } from '../utils/lcards-logging.js';

export class LCARdSSimpleChart extends LCARdSSimpleCard {
  static CARD_TYPE = 'simple-chart';

  static get properties() {
    return {
      ...super.properties,
      _chartReady: { type: Boolean, state: true }
    };
  }

  static get styles() {
    return [
      super.styles,
      css`
        :host {
          display: block;
          width: 100%;
          height: 100%;
        }

        .chart-container {
          width: 100%;
          height: 100%;
          min-height: 200px;
        }
      `
    ];
  }

  constructor() {
    super();
    this._chart = null;
    this._chartReady = false;
  }

  /**
   * Handle first update - initialize chart
   * @protected
   */
  async _handleFirstUpdate() {
    super._handleFirstUpdate();

    // Register with RulesEngine
    const overlayId = this.config.id || `simple-chart-${this._cardGuid}`;
    this._registerOverlayForRules(overlayId, this.config.tags || []);

    // Wait for container to be available
    await this.updateComplete;

    // Initialize ApexCharts
    await this._initializeChart();
  }

  /**
   * Called when rules produce style patches
   * @protected
   */
  _onRulePatchesChanged() {
    if (this._chart && this._chartReady) {
      this._updateChartOptions();
    }
  }

  /**
   * Initialize ApexCharts instance
   * Port from ApexChartsOverlay.js
   * @private
   */
  async _initializeChart() {
    const container = this.renderRoot.querySelector('.chart-container');
    if (!container) {
      lcardsLog.error('[LCARdSSimpleChart] Chart container not found');
      return;
    }

    // Build chart options (port from ApexChartsOverlay)
    const options = this._buildChartOptions();

    // ApexCharts is already bundled - window.ApexCharts should exist
    if (!window.ApexCharts) {
      lcardsLog.error('[LCARdSSimpleChart] ApexCharts not available');
      return;
    }

    // Create chart instance
    this._chart = new ApexCharts(container, options);
    await this._chart.render();

    this._chartReady = true;

    lcardsLog.debug(`[LCARdSSimpleChart] Chart initialized for ${this._cardGuid}`);
  }

  /**
   * Build ApexCharts options from config
   * Port from ApexChartsOverlay._buildChartOptions()
   * @private
   */
  _buildChartOptions() {
    // Get style with rule patches applied
    const style = this._getMergedStyleWithRules(this.config.style || {});

    // Resolve theme tokens
    const primaryColor = this.getThemeToken('colors.accent.primary', 'var(--lcars-orange)');
    const textColor = this.getThemeToken('colors.text.primary', 'var(--primary-text-color)');

    const options = {
      chart: {
        type: this.config.chart_type || 'line',
        height: '100%',
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800
        },
        background: 'transparent',
        toolbar: {
          show: false
        }
      },
      series: this._getSeriesData(),
      colors: style.colors || [primaryColor],
      stroke: {
        curve: style.curve || 'smooth',
        width: style.strokeWidth || 2
      },
      xaxis: {
        type: this.config.xaxis_type || 'datetime',
        labels: {
          style: {
            colors: textColor
          }
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: textColor
          }
        }
      },
      theme: {
        mode: 'dark'
      }
    };

    return options;
  }

  /**
   * Get series data from DataSourceManager
   * Port from ApexChartsOverlay
   * @private
   */
  _getSeriesData() {
    if (!this._singletons?.dataSourceManager) {
      return [];
    }

    const source = this.config.source || this.config.entity;
    if (!source) {
      return [];
    }

    // Get data from DataSourceManager
    const dataSource = this._singletons.dataSourceManager.getSource(source);
    if (!dataSource) {
      return [];
    }

    const data = dataSource.getHistory?.() || [];

    return [{
      name: this.config.series_name || source,
      data: data.map(point => ({
        x: point.timestamp,
        y: point.value
      }))
    }];
  }

  /**
   * Update chart options (for rule-based style changes)
   * @private
   */
  _updateChartOptions() {
    if (!this._chart) return;

    const newOptions = this._buildChartOptions();

    // Update without redrawing series data
    this._chart.updateOptions({
      colors: newOptions.colors,
      stroke: newOptions.stroke
    }, false, false);

    lcardsLog.trace(`[LCARdSSimpleChart] Updated chart options for ${this._cardGuid}`);
  }

  /**
   * Render the chart card
   * @protected
   */
  _renderCard() {
    return html`
      <div class="simple-card-container">
        <div class="chart-container"></div>
      </div>
    `;
  }

  /**
   * Cleanup on disconnect
   * @protected
   */
  _onDisconnected() {
    if (this._chart) {
      this._chart.destroy();
      this._chart = null;
    }
    super._onDisconnected();
  }

  /**
   * Get card size for HA layout
   * @protected
   */
  _getCardSize() {
    return 4;
  }
}

// Register card
customElements.define('lcards-simple-chart', LCARdSSimpleChart);
```

#### Update `src/lcards.js` - Add Registration

```javascript
// Import simple chart card
import { LCARdSSimpleChart } from './cards/lcards-simple-chart.js';

// In initializeCustomCards() function:
lcardsLog.info('[LCARdS] Registering lcards-simple-chart card');
if (!customElements.get('lcards-simple-chart')) {
  customElements.define('lcards-simple-chart', LCARdSSimpleChart);
}
```

**Testing Checklist:**
- [ ] Chart renders standalone with static data
- [ ] DataSource integration works
- [ ] Theme colors apply
- [ ] Rules-based style changes update chart

---

### Week 2: Unify MSD Overlay System

**Objective:** Make MsdControlsRenderer handle ALL card-based overlays

#### Step 1: Update MsdControlsRenderer to Accept Any Card Type

**File:** `src/msd/controls/MsdControlsRenderer.js`

The current `resolveCardDefinition()` method looks for `overlay.card`. We need it to also handle overlays where the card definition IS the overlay itself:

```javascript
resolveCardDefinition(overlay) {
  lcardsLog.debug('[MsdControlsRenderer] Resolving card definition for', overlay.id, {
    hasCard: !!overlay.card,
    hasType: !!overlay.type,
    overlayType: overlay.type
  });

  // Pattern 1: Nested card definition (current)
  // { type: 'control', card: { type: 'custom:some-card', ... } }
  if (overlay.card) {
    return overlay.card;
  }

  // Pattern 2: Overlay IS the card definition (new unified pattern)
  // { type: 'custom:lcards-simple-button', entity: '...', position: [...] }
  if (overlay.type && overlay.type !== 'control' && overlay.type !== 'line') {
    // Build card definition from overlay itself
    const { id, position, size, z_index, tags, ...cardProps } = overlay;
    return cardProps;  // Everything except positioning metadata
  }

  // Pattern 3: Try alternate config locations (backward compat during transition)
  if (overlay.card_config) return overlay.card_config;
  if (overlay.cardConfig) return overlay.cardConfig;

  lcardsLog.warn('[MsdControlsRenderer] No card definition found for', overlay.id);
  return null;
}
```

#### Step 2: Update AdvancedRenderer to Delegate Card Overlays

**File:** `src/msd/renderer/AdvancedRenderer.js`

```javascript
/**
 * Render overlay based on type
 *
 * Decision tree:
 * - If type === 'line' → LineOverlay (SVG-native)
 * - Else → MsdControlsRenderer (card-based)
 *
 * @param {Object} overlay - Overlay configuration
 * @param {Object} anchors - Anchor positions
 * @param {Array} viewBox - SVG viewBox dimensions
 * @returns {Object} Render result
 * @private
 */
_renderOverlay(overlay, anchors, viewBox) {
  lcardsLog.trace(`[AdvancedRenderer] Rendering overlay: ${overlay.type} (${overlay.id})`);

  // SVG-native overlay (line routing)
  if (overlay.type === 'line') {
    const renderer = this._getRendererForOverlay(overlay);
    if (renderer && renderer.render) {
      return renderer.render(overlay, anchors, viewBox, this.cardInstance);
    }
  }

  // Everything else is card-based → delegate to MsdControlsRenderer
  // This includes:
  // - SimpleCards: custom:lcards-simple-button, custom:lcards-simple-chart
  // - HA cards: entities, grid, button, light, etc.
  // - Legacy: type=control with nested card definition
  return this._renderCardOverlay(overlay, anchors, viewBox);
}

/**
 * Render card-based overlay via MsdControlsRenderer
 *
 * MsdControlsRenderer handles:
 * - foreignObject creation and positioning
 * - Card element creation (SimpleCards & HA cards)
 * - HASS context application
 * - Config application via setConfig()
 * - Event isolation
 *
 * @param {Object} overlay - Overlay configuration
 * @param {Object} anchors - Anchor positions
 * @param {Array} viewBox - SVG viewBox dimensions
 * @returns {Object} Render result
 * @private
 */
async _renderCardOverlay(overlay, anchors, viewBox) {
  if (!this.systemsManager?.controlsRenderer) {
    lcardsLog.error('[AdvancedRenderer] No controlsRenderer available');
    return this._renderErrorPlaceholder(overlay);
  }

  try {
    // Build resolved model for MsdControlsRenderer
    const resolvedModel = {
      anchors,
      viewBox,
      overlays: [overlay]
    };

    // Delegate to MsdControlsRenderer
    await this.systemsManager.controlsRenderer.renderControlOverlay(overlay, resolvedModel);

    return {
      overlayId: overlay.id,
      success: true
    };

  } catch (error) {
    lcardsLog.error(`[AdvancedRenderer] Error rendering card overlay ${overlay.id}:`, error);
    return this._renderErrorPlaceholder(overlay);
  }
}
```

#### Step 3: Remove Instance-Based Overlay Registry

Since MsdControlsRenderer now handles all cards, we don't need the instance registry in AdvancedRenderer:

**File:** `src/msd/renderer/AdvancedRenderer.js`

```javascript
// DELETE these lines from constructor:
// this.overlayRenderers = new Map();

// DELETE this method entirely:
// _getOrCreateOverlayRenderer(overlay) { ... }
```

**Testing Checklist:**
- [ ] SimpleButton works as overlay
- [ ] SimpleChart works as overlay
- [ ] HA cards work as overlays
- [ ] Line overlays still work
- [ ] Multiple overlays don't conflict

---

### Week 3: Remove Obsolete Code

**Objective:** Delete duplicate overlay implementations

#### Files to Delete

```bash
# Delete old overlay classes (~100KB total)
rm src/msd/overlays/ButtonOverlay.js           # 35KB
rm src/msd/overlays/TextOverlay.js             # 48KB
rm src/msd/overlays/StatusGridOverlay.js       # 8KB
rm src/msd/overlays/ApexChartsOverlay.js       # 8KB

# Delete old renderer
rm src/msd/renderer/StatusGridRenderer.js      # 3.5KB

# Delete old overlay renderer (if exists)
rm src/msd/renderer/ApexChartsOverlayRenderer.js
```

#### Update Imports

**File:** `src/msd/renderer/AdvancedRenderer.js`

```javascript
// REMOVE these imports:
// import { StatusGridRenderer } from './StatusGridRenderer.js';
// import { ApexChartsOverlayRenderer } from './ApexChartsOverlayRenderer.js';
// import { TextOverlay } from '../overlays/TextOverlay.js';
// import { ButtonOverlay } from '../overlays/ButtonOverlay.js';
// import { ApexChartsOverlay } from '../overlays/ApexChartsOverlay.js';
// import { StatusGridOverlay } from '../overlays/StatusGridOverlay.js';

// KEEP:
import { LineOverlay } from '../overlays/LineOverlay.js';
```

**File:** `src/msd/overlays/index.js`

```javascript
// Only export LineOverlay (SVG-native MSD overlay)
export { LineOverlay } from './LineOverlay.js';
export { OverlayBase } from './OverlayBase.js';  // Keep if LineOverlay uses it

// All card-based overlays are now standalone SimpleCards:
// ButtonOverlay → lcards-simple-button
// TextOverlay → lcards-simple-button (with button_area: false)
// ApexChartsOverlay → lcards-simple-chart
// StatusGridOverlay → Grid card + SimpleButtons
```

**Testing Checklist:**
- [ ] All imports resolve correctly
- [ ] No broken references to deleted files
- [ ] Build succeeds
- [ ] Bundle size reduced by ~100KB

---

### Week 4: Documentation & Examples

#### Create Migration Guide

**File:** `doc/migration/msd-overlay-to-simplecards.md`

```markdown
# MSD Overlay Migration Guide

## Overview

MSD overlays have been simplified to use SimpleCards exclusively. This reduces code duplication and provides a consistent, powerful pattern.

## Migration Steps

### Button Overlays → lcards-simple-button

**Before:**
```yaml
overlays:
  - type: button
    id: light_btn
    entity: light.living_room
    position: anchor_1
    style:
      color: var(--lcars-blue)
```

**After:**
```yaml
overlays:
  - type: custom:lcards-simple-button
    id: light_btn
    entity: light.living_room
    position: anchor_1
    style:
      color: colors.accent.primary
```

**Changes:**
- `type: button` → `type: custom:lcards-simple-button`
- Style directly on overlay (no nesting)
- Theme tokens instead of CSS vars

### Text Overlays → lcards-simple-button

**Before:**
```yaml
overlays:
  - type: text
    id: main_label
    content: "System Status"
    position: anchor_1
    style:
      color: var(--lcars-orange)
      fontSize: 24
```

**After:**
```yaml
overlays:
  - type: custom:lcards-simple-button
    id: main_label
    position: anchor_1
    button_area: false
    text:
      label:
        content: "System Status"
        font_size: 24
        color: colors.accent.primary
```

**Changes:**
- `type: text` → `type: custom:lcards-simple-button` + `button_area: false`
- Content in `text.label.content`
- Theme tokens for styling

### ApexCharts → lcards-simple-chart

**Before:**
```yaml
overlays:
  - type: apexchart
    id: temp_chart
    position: anchor_1
    source: sensor.temperature
    chart_type: line
```

**After:**
```yaml
overlays:
  - type: custom:lcards-simple-chart
    id: temp_chart
    position: anchor_1
    source: sensor.temperature
    chart_type: line
```

**Changes:**
- `type: apexchart` → `type: custom:lcards-simple-chart`
- Everything else stays the same

### Status Grid → Grid + SimpleButtons

**Before:**
```yaml
overlays:
  - type: status_grid
    id: system_grid
    position: anchor_1
    rows: 3
    columns: 4
    cells:
      - entity: light.bedroom
        label: Bedroom
      - entity: light.kitchen
        label: Kitchen
```

**After:**
```yaml
overlays:
  - type: grid
    position: anchor_1
    size: [400, 300]
    columns: 4
    cards:
      - type: custom:lcards-simple-button
        entity: light.bedroom
        preset: picard_bullet
        text:
          label:
            content: Bedroom
        tags: [grid_cell]

      - type: custom:lcards-simple-button
        entity: light.kitchen
        preset: picard_bullet
        text:
          label:
            content: Kitchen
        tags: [grid_cell]
```

**Benefits:**
- More flexible (full Grid card features)
- Consistent styling via presets
- Multi-card targeting via rules + tags
- Each button has full SimpleButton capabilities

### Line Overlays (No Change)

Line overlays are MSD-specific and don't change:

```yaml
overlays:
  - type: line
    id: connection_line
    from: anchor_1
    to: anchor_2
    style:
      stroke: colors.accent.secondary
```

## New Capabilities

### Rules Engine Integration

All SimpleCards support rules-based dynamic styling:

```yaml
rules:
  - conditions:
      - entity: alarm_control_panel.home
        state: triggered
    actions:
      targets:
        tags: [grid_cell]
      style:
        color: colors.alert.critical
        glow: true
```

### Preset System

Use presets for consistent styling:

```yaml
overlays:
  - type: custom:lcards-simple-button
    preset: picard_bullet
    entity: light.bedroom
    position: anchor_1
```

### Theme Tokens

Use semantic theme tokens instead of CSS vars:

```yaml
style:
  color: colors.accent.primary
  text_color: colors.text.primary
  border_color: colors.border.default
```
```

#### Update Main Documentation

Update these files to reflect the new patterns:
- `doc/user/msd-overlays.md` - Remove old overlay types
- `doc/architecture/msd-system.md` - Document unified architecture
- `README.md` - Update examples

#### Create Examples

**File:** `examples/msd-simple-dashboard.yaml`

```yaml
type: custom:lcards-msd-card
msd:
  base_svg:
    source: builtin
    template: lcars_picard

  view_box: [0, 0, 1920, 1080]

  overlays:
    # SimpleButton overlays
    - type: custom:lcards-simple-button
      id: light_main
      entity: light.living_room
      position: [100, 100]
      preset: lozenge
      text:
        label:
          content: "Main Lights"
      tap_action:
        action: toggle

    # SimpleChart overlay
    - type: custom:lcards-simple-chart
      id: temp_chart
      position: [100, 200]
      size: [400, 200]
      source: sensor.temperature
      chart_type: line
      style:
        colors: [colors.accent.primary]

    # HA Grid card as overlay
    - type: grid
      position: [600, 100]
      size: [400, 400]
      columns: 2
      cards:
        - type: custom:lcards-simple-button
          entity: light.bedroom
          preset: picard_bullet
        - type: custom:lcards-simple-button
          entity: light.kitchen
          preset: picard_bullet

    # Line connecting overlays
    - type: line
      from: light_main
      to: temp_chart
      style:
        stroke: colors.accent.secondary
        stroke_width: 2
```

**Testing Checklist:**
- [ ] Documentation is complete
- [ ] Examples work correctly
- [ ] Migration guide is clear
- [ ] All references to old overlay types removed

---

## Summary of Changes

### Code Deletions (~100KB)
- ✅ ButtonOverlay.js (35KB)
- ✅ TextOverlay.js (48KB)
- ✅ ApexChartsOverlay.js (8KB)
- ✅ StatusGridOverlay.js (8KB)
- ✅ StatusGridRenderer.js (3.5KB)

### Code Additions (~8KB)
- ✅ lcards-simple-chart.js (8KB - port from ApexChartsOverlay)

### Code Modifications
- ✅ MsdControlsRenderer.resolveCardDefinition() - Handle unified pattern
- ✅ AdvancedRenderer._renderOverlay() - Delegate cards to MsdControlsRenderer
- ✅ src/lcards.js - Register lcards-simple-chart

### Net Change
- **~92KB code deletion**
- **Unified architecture**
- **No new rendering patterns** (reuse MsdControlsRenderer)
- **Cleaner config** (single pattern for all cards)

---

## Success Criteria

### Technical
- [ ] All tests passing (manual)
- [ ] No console errors
- [ ] Bundle size reduced by ~90KB
- [ ] All overlay types render correctly

### User Experience
- [ ] Config migration straightforward
- [ ] All features preserved (via SimpleCards + Rules)
- [ ] Documentation complete
- [ ] Examples provided

### Code Quality
- [ ] No duplicate implementations
- [ ] Clear architectural separation
- [ ] Consistent patterns
- [ ] Maintainable structure

---

## Implementation Notes

### Key Architectural Decisions

1. **Reuse MsdControlsRenderer** - Don't reinvent the wheel. The existing controls system already handles foreignObject positioning perfectly.

2. **Single Detection Pattern** - If `type !== 'line'`, it's a card. Simple and clean.

3. **No Backward Compatibility** - Clean break to final architecture. One-time config migration.

4. **Minimal New Code** - Only create lcards-simple-chart. Everything else is deletion and routing.

### Why This Works

- **MsdControlsRenderer is already perfect** - Handles card creation, HASS context, config application, event isolation
- **SimpleCards are already powerful** - Multi-text, icons, rules, themes, presets
- **Overlays are just positioned cards** - Position/size metadata + card config
- **foreignObject is the secret sauce** - SVG viewBox positioning + HTML content

### Migration Strategy

Since we have no users:
1. Make all changes at once
2. Update internal test configs
3. Document the patterns
4. Move forward with clean architecture

No need for gradual migration or deprecation warnings.
