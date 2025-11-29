# LCARdS MSD Refactor: Implementation Plan

**Project:** Convert MSD from widget library to universal canvas system
**Goal:** Eliminate ~100KB of duplicate code, unify architecture around SimpleCard pattern
**Timeline:** 4 weeks
**Risk Level:** Medium (requires careful migration)

---

## Executive Summary

The MSD (Master Systems Display) system currently duplicates functionality that exists in SimpleCards. This refactor transforms MSD into a **universal canvas system** that positions any card type (SimpleCards or HA cards) using SVG anchors, while removing redundant overlay implementations.

**Key Changes:**
- Remove `StatusGridOverlay` entirely (use Grid card + SimpleButtons)
- Remove `ButtonOverlay` (replaced by `lcards-simple-button`)
- Extract `TextOverlay` → `lcards-simple-text` SimpleCard
- Extract `ApexChartsOverlay` → `lcards-simple-chart` SimpleCard
- Keep `LineOverlay` as MSD-specific (no standalone equivalent)
- Unify card positioning via foreignObject pattern

**Benefits:**
- ✅ ~100KB code reduction
- ✅ Single implementation per feature
- ✅ New SimpleCards automatically work in MSD
- ✅ Consistent user experience across standalone and MSD contexts

---

## Architecture Vision

### Current State (Problem)

```
MSD Overlays (Duplicate Implementations)
├── ButtonOverlay.js (~35KB)      ❌ Duplicates lcards-simple-button
├── TextOverlay.js (~48KB)        ❌ Should be SimpleCard
├── StatusGridOverlay.js (~8KB)   ❌ Inferior to Grid + SimpleButtons
├── ApexChartsOverlay.js (~8KB)   ❌ Should be SimpleCard
└── LineOverlay.js                ✅ MSD-specific, keep
```

### Target State (Solution)

```
MSD = Universal Canvas System
  │
  ├─ SVG-Native Overlays (MSD-specific)
  │   └── LineOverlay - Routed SVG paths
  │
  └─ Card-Based Overlays (Universal Pattern)
      ├── SimpleCards
      │   ├── lcards-simple-text (new)
      │   ├── lcards-simple-button (exists)
      │   └── lcards-simple-chart (new)
      │
      └── HA Cards
          ├── entities
          ├── grid
          └── [any other HA card]
```

**Key Principle:** MSD provides SVG positioning via foreignObject containers. The cards themselves are standard SimpleCards or HA cards with full feature support.

---

## Phase 1: Create lcards-simple-text (Week 1)

### Objective
Extract text rendering logic from TextOverlay into a standalone SimpleCard that works both in MSD and as a standalone card.

### Files to Create

#### `src/cards/lcards-simple-text.js`

```javascript
/**
 * LCARdS Simple Text Card
 *
 * Displays text with template support, theme tokens, and rules integration.
 * Can be used standalone or as an MSD overlay.
 *
 * Features:
 * - Template processing (JavaScript, tokens, Jinja2)
 * - Theme token resolution
 * - Rules-based dynamic styling
 * - SVG rendering for LCARS aesthetic
 * - Entity state awareness
 */

import { svg } from 'lit';
import { LCARdSSimpleCard } from '../base/LCARdSSimpleCard.js';
import { lcardsLog } from '../utils/lcards-logging.js';

export class LCARdSSimpleText extends LCARdSSimpleCard {
  static CARD_TYPE = 'simple-text';

  static get properties() {
    return {
      ...super.properties,
      _processedText: { type: String, state: true },
      _textStyle: { type: Object, state: true }
    };
  }

  constructor() {
    super();
    this._processedText = '';
    this._textStyle = {};
  }

  /**
   * Process text templates
   * Called by base class template processing system
   * @protected
   */
  async _processCustomTemplates() {
    // Get text from config
    const textConfig = this.config.text || this.config.content || this.config.label || '';

    // Process templates (supports JavaScript, tokens, Jinja2)
    this._processedText = await this.processTemplate(textConfig);

    lcardsLog.trace(`[LCARdSSimpleText] Processed text for ${this._cardGuid}:`, {
      raw: textConfig,
      processed: this._processedText
    });
  }

  /**
   * Called when config updates (for style re-resolution)
   * @protected
   */
  _onConfigUpdated() {
    this._resolveTextStyle();
  }

  /**
   * Handle first update - setup rules integration
   * @protected
   */
  _handleFirstUpdate() {
    super._handleFirstUpdate();

    // Register with RulesEngine for dynamic styling
    const overlayId = this.config.id || `simple-text-${this._cardGuid}`;
    this._registerOverlayForRules(overlayId, this.config.tags || []);

    // Resolve initial style
    this._resolveTextStyle();
  }

  /**
   * Called when rules produce style patches
   * @protected
   */
  _onRulePatchesChanged() {
    // Re-resolve style with new patches
    this._resolveTextStyle();
  }

  /**
   * Resolve text styling with full cascade
   *
   * Style Priority (low to high):
   * 1. Theme defaults
   * 2. Preset styles
   * 3. Config styles
   * 4. Theme token resolution
   * 5. State overrides
   * 6. Rule patches
   *
   * @private
   */
  _resolveTextStyle() {
    // Start with defaults from theme
    let style = {
      x: 0,
      y: 0,
      color: this.getThemeToken('colors.text.primary', 'var(--primary-text-color)'),
      fontSize: this.getThemeToken('typography.text.size', 18),
      fontFamily: this.getThemeToken('typography.text.family', 'var(--lcars-font-family, Antonio)'),
      fontWeight: this.getThemeToken('typography.text.weight', 'normal'),
      anchor: 'start',
      baseline: 'middle'
    };

    // Apply preset if specified
    if (this.config.preset) {
      const preset = this.getStylePreset('text', this.config.preset);
      if (preset) {
        style = { ...style, ...preset };
        lcardsLog.trace(`[LCARdSSimpleText] Applied preset: ${this.config.preset}`);
      }
    }

    // Apply config styles
    if (this.config.style) {
      style = { ...style, ...this.config.style };
    }

    // Apply state-based overrides if entity present
    if (this._entity) {
      const stateClass = this._classifyEntityState();
      const stateColor = this.getThemeToken(`colors.text.${stateClass}`);
      if (stateColor) {
        style.color = stateColor;
      }
    }

    // Apply rule patches (highest priority)
    style = this._getMergedStyleWithRules(style);

    this._textStyle = style;
    this.requestUpdate();

    lcardsLog.trace(`[LCARdSSimpleText] Resolved style for ${this._cardGuid}:`, style);
  }

  /**
   * Render the text card
   * @protected
   */
  _renderCard() {
    const style = this._textStyle;
    const text = this._processedText;

    return svg`
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
        viewBox="0 0 200 50">
        <text
          x="${style.x}"
          y="${style.y || 25}"
          fill="${style.color}"
          font-size="${style.fontSize}"
          font-family="${style.fontFamily}"
          font-weight="${style.fontWeight}"
          text-anchor="${style.anchor}"
          dominant-baseline="${style.baseline}">
          ${text}
        </text>
      </svg>
    `;
  }

  /**
   * Get card size for HA layout
   * @protected
   */
  _getCardSize() {
    return 1;
  }
}

// Register card
customElements.define('lcards-simple-text', LCARdSSimpleText);
```

### Files to Modify

#### `src/lcards.js` (Registration)

Add to card registration section:

```javascript
// Import simple text card
import { LCARdSSimpleText } from './cards/lcards-simple-text.js';

// In initializeCustomCards() function, add:
lcardsLog.info('[LCARdS] Registering lcards-simple-text card');
if (!customElements.get('lcards-simple-text')) {
  customElements.define('lcards-simple-text', LCARdSSimpleText);
}
```

### Testing Checklist

- [ ] Card renders standalone with static text
- [ ] Template processing works (JavaScript, tokens)
- [ ] Entity state updates trigger re-render
- [ ] Theme tokens resolve correctly
- [ ] Rules-based styling applies
- [ ] Card works in Grid/Stack layouts

### Documentation

Create `doc/cards/lcards-simple-text.md`:

```markdown
# lcards-simple-text

Displays text with template support and dynamic styling.

## Basic Usage

```yaml
type: custom:lcards-simple-text
text: "System Status"
```

## With Entity

```yaml
type: custom:lcards-simple-text
text: "{{entity.attributes.friendly_name}}: {{entity.state}}"
entity: sensor.temperature
```

## With Theme Tokens

```yaml
type: custom:lcards-simple-text
text: "Temperature: {{entity.state}}°C"
entity: sensor.temperature
style:
  color: colors.text.primary
  fontSize: 24
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `text` | string | required | Text to display (supports templates) |
| `entity` | string | optional | Entity for template context |
| `style.color` | string | theme | Text color |
| `style.fontSize` | number | 18 | Font size in pixels |
| `style.anchor` | string | 'start' | Text anchor (start/middle/end) |
```

---

## Phase 2: Create lcards-simple-chart (Week 2)

### Objective
Extract ApexCharts integration from ApexChartsOverlay into a standalone SimpleCard.

### Files to Create

#### `src/cards/lcards-simple-chart.js`

```javascript
/**
 * LCARdS Simple Chart Card
 *
 * Data visualization using ApexCharts library.
 * Can be used standalone or as an MSD overlay.
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
    // Update chart options with new styles
    if (this._chart && this._chartReady) {
      this._updateChartOptions();
    }
  }

  /**
   * Initialize ApexCharts instance
   * @private
   */
  async _initializeChart() {
    const container = this.renderRoot.querySelector('.chart-container');
    if (!container) {
      lcardsLog.error('[LCARdSSimpleChart] Chart container not found');
      return;
    }

    // Build chart options
    const options = this._buildChartOptions();

    // Load ApexCharts if not already loaded
    if (!window.ApexCharts) {
      await this._loadApexCharts();
    }

    // Create chart instance
    this._chart = new ApexCharts(container, options);
    await this._chart.render();

    this._chartReady = true;

    lcardsLog.debug(`[LCARdSSimpleChart] Chart initialized for ${this._cardGuid}`);
  }

  /**
   * Build ApexCharts options from config
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
   * Load ApexCharts library dynamically
   * @private
   */
  async _loadApexCharts() {
    if (window.ApexCharts) return;

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/apexcharts@latest';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load ApexCharts'));
      document.head.appendChild(script);
    });
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

### Files to Modify

#### `src/lcards.js` (Registration)

```javascript
// Import simple chart card
import { LCARdSSimpleChart } from './cards/lcards-simple-chart.js';

// In initializeCustomCards(), add:
lcardsLog.info('[LCARdS] Registering lcards-simple-chart card');
if (!customElements.get('lcards-simple-chart')) {
  customElements.define('lcards-simple-chart', LCARdSSimpleChart);
}
```

### Testing Checklist

- [ ] Chart renders with static data
- [ ] DataSource integration works
- [ ] Real-time updates display correctly
- [ ] Theme colors apply
- [ ] Rules-based style changes update chart
- [ ] Chart destroys cleanly on disconnect

---

## Phase 3: Update MSD Renderer for Card Overlays (Week 3)

### Objective
Enable MSD to position any card type (SimpleCards or HA cards) using the foreignObject pattern.

### Files to Modify

#### `src/msd/renderer/AdvancedRenderer.js`

**Key Changes:**
1. Add `_renderCardOverlay()` method
2. Update `_renderOverlay()` routing logic
3. Add legacy migration warnings
4. Implement foreignObject positioning

```javascript
/**
 * Render overlay based on type
 * Routes to appropriate renderer (card-based or SVG-native)
 *
 * @param {Object} overlay - Overlay configuration
 * @param {Object} anchors - Anchor positions
 * @param {Array} viewBox - SVG viewBox dimensions
 * @returns {Object} Render result with markup and metadata
 * @private
 */
_renderOverlay(overlay, anchors, viewBox) {
  lcardsLog.trace(`[AdvancedRenderer] Rendering overlay: ${overlay.type} (${overlay.id})`);

  // Card-based overlays (SimpleCards or HA cards)
  if (overlay.type === 'card') {
    return this._renderCardOverlay(overlay, anchors, viewBox);
  }

  // SVG-native overlays (MSD-specific)
  if (overlay.type === 'line') {
    const renderer = this._getRendererForOverlay(overlay);
    if (renderer && renderer.render) {
      return renderer.render(overlay, anchors, viewBox, this.cardInstance);
    }
  }

  // Legacy overlays (auto-migrate with warnings)
  if (overlay.type === 'button') {
    lcardsLog.warn(`[AdvancedRenderer] Legacy overlay type 'button' detected for ${overlay.id}.
      Please migrate to: type: card, card_type: simple-button
      Legacy support will be removed in v2.0.`);

    // Auto-migrate
    return this._renderCardOverlay({
      ...overlay,
      type: 'card',
      card_type: 'simple-button',
      config: {
        entity: overlay.entity,
        ...overlay.style,
        ...overlay.actions
      }
    }, anchors, viewBox);
  }

  if (overlay.type === 'text') {
    lcardsLog.warn(`[AdvancedRenderer] Legacy overlay type 'text' detected for ${overlay.id}.
      Please migrate to: type: card, card_type: simple-text
      Legacy support will be removed in v2.0.`);

    // Auto-migrate
    return this._renderCardOverlay({
      ...overlay,
      type: 'card',
      card_type: 'simple-text',
      config: {
        text: overlay.content || overlay.text,
        entity: overlay.entity,
        ...overlay.style
      }
    }, anchors, viewBox);
  }

  // Unknown type
  lcardsLog.error(`[AdvancedRenderer] Unknown overlay type: ${overlay.type} for ${overlay.id}`);
  return this._renderErrorPlaceholder(overlay);
}

/**
 * Render card-based overlay using foreignObject positioning
 *
 * This method treats SimpleCards and HA cards identically:
 * 1. Resolve position from anchor
 * 2. Create card instance
 * 3. Wrap in foreignObject for SVG positioning
 * 4. Mount card after DOM insertion
 *
 * @param {Object} overlay - Overlay configuration with card_type
 * @param {Object} anchors - Anchor positions
 * @param {Array} viewBox - SVG viewBox dimensions
 * @returns {Object} Render result with markup and postMount callback
 * @private
 */
_renderCardOverlay(overlay, anchors, viewBox) {
  // Resolve position from anchor
  const position = this._resolveOverlayPosition(overlay, anchors, viewBox);

  if (!position) {
    lcardsLog.error(`[AdvancedRenderer] Could not resolve position for card overlay ${overlay.id}`);
    return this._renderErrorPlaceholder(overlay);
  }

  // Determine card type (SimpleCard or HA card)
  const cardType = overlay.card_type;
  if (!cardType) {
    lcardsLog.error(`[AdvancedRenderer] No card_type specified for card overlay ${overlay.id}`);
    return this._renderErrorPlaceholder(overlay);
  }

  // Get card size from overlay or use defaults
  const width = overlay.size?.[0] || position.width || 200;
  const height = overlay.size?.[1] || position.height || 100;

  lcardsLog.debug(`[AdvancedRenderer] Rendering card overlay ${overlay.id}:`, {
    cardType,
    position,
    size: [width, height]
  });

  // Generate foreignObject markup
  const markup = `
    <foreignObject
      id="${overlay.id}"
      data-overlay-id="${overlay.id}"
      data-overlay-type="card"
      data-card-type="${cardType}"
      x="${position.x}"
      y="${position.y}"
      width="${width}"
      height="${height}"
      style="overflow: visible;">
      <div
        xmlns="http://www.w3.org/1999/xhtml"
        class="card-overlay-container"
        style="width: 100%; height: 100%;">
      </div>
    </foreignObject>
  `;

  // Return result with postMount callback
  return {
    markup,
    overlayId: overlay.id,
    postMount: (container) => {
      // This callback is called after SVG is inserted into DOM
      this._mountCardInOverlay(overlay, cardType, container);
    }
  };
}

/**
 * Mount card instance into foreignObject container
 * Creates and initializes card, then appends to container
 *
 * @param {Object} overlay - Overlay configuration
 * @param {string} cardType - Card type (e.g., 'simple-button')
 * @param {Element} container - SVG container element
 * @private
 */
_mountCardInOverlay(overlay, cardType, container) {
  try {
    // Find the foreignObject element
    const foreignObject = container.querySelector(`[data-overlay-id="${overlay.id}"]`);
    if (!foreignObject) {
      lcardsLog.error(`[AdvancedRenderer] Could not find foreignObject for ${overlay.id}`);
      return;
    }

    const mountPoint = foreignObject.querySelector('.card-overlay-container');
    if (!mountPoint) {
      lcardsLog.error(`[AdvancedRenderer] Could not find mount point for ${overlay.id}`);
      return;
    }

    // Create card instance
    const card = this._createCardInstance(cardType, overlay);
    if (!card) {
      lcardsLog.error(`[AdvancedRenderer] Could not create card instance for ${overlay.id}`);
      return;
    }

    // Mount card
    mountPoint.appendChild(card);

    lcardsLog.debug(`[AdvancedRenderer] Successfully mounted ${cardType} card in overlay ${overlay.id}`);

  } catch (error) {
    lcardsLog.error(`[AdvancedRenderer] Error mounting card in overlay ${overlay.id}:`, error);
  }
}

/**
 * Create card instance (SimpleCard or HA card)
 *
 * @param {string} cardType - Card type (e.g., 'simple-button', 'entities')
 * @param {Object} overlay - Overlay configuration
 * @returns {HTMLElement|null} Card element or null if creation failed
 * @private
 */
_createCardInstance(cardType, overlay) {
  // Determine element tag name
  let tagName;

  if (cardType.startsWith('simple-')) {
    // SimpleCard: lcards-simple-button
    tagName = `lcards-${cardType}`;
  } else {
    // HA card: hui-entities-card
    tagName = `hui-${cardType}-card`;
  }

  // Check if element is registered
  const cardClass = customElements.get(tagName);
  if (!cardClass) {
    lcardsLog.error(`[AdvancedRenderer] Card type not registered: ${tagName}`);
    return null;
  }

  // Create instance
  const card = new cardClass();

  // Set config
  if (overlay.config) {
    try {
      card.setConfig(overlay.config);
    } catch (error) {
      lcardsLog.error(`[AdvancedRenderer] Error setting config for ${tagName}:`, error);
      return null;
    }
  }

  // Set HASS
  if (this.hass) {
    card.hass = this.hass;
  }

  return card;
}

/**
 * Resolve overlay position from anchor
 *
 * @param {Object} overlay - Overlay configuration
 * @param {Object} anchors - Anchor positions
 * @param {Array} viewBox - SVG viewBox dimensions
 * @returns {Object|null} Position {x, y, width, height} or null
 * @private
 */
_resolveOverlayPosition(overlay, anchors, viewBox) {
  // Use existing OverlayUtils for position resolution
  const position = OverlayUtils.resolvePosition(overlay.position, anchors);

  if (!position) {
    lcardsLog.warn(`[AdvancedRenderer] Could not resolve position for ${overlay.id}`);
    return null;
  }

  return {
    x: position[0],
    y: position[1],
    width: overlay.size?.[0],
    height: overlay.size?.[1]
  };
}

/**
 * Render error placeholder for invalid overlays
 *
 * @param {Object} overlay - Overlay configuration
 * @returns {Object} Render result with error markup
 * @private
 */
_renderErrorPlaceholder(overlay) {
  return {
    markup: `
      <g id="${overlay.id}" data-overlay-id="${overlay.id}" data-overlay-type="error">
        <rect
          x="0" y="0"
          width="200" height="50"
          fill="rgba(255,0,0,0.1)"
          stroke="red"
          stroke-width="2"/>
        <text
          x="100" y="25"
          text-anchor="middle"
          fill="red"
          font-size="12">
          Error: ${overlay.type} - ${overlay.id}
        </text>
      </g>
    `,
    overlayId: overlay.id
  };
}
```

**Also Update:**

```javascript
/**
 * Main render method - orchestrates all overlay rendering
 * @param {Array} overlays - Array of overlay configurations
 * @param {Object} anchors - Anchor positions
 * @param {Array} viewBox - SVG viewBox dimensions
 * @returns {Object} Complete render result
 */
async render(overlays, anchors, viewBox) {
  const results = [];
  const postMountCallbacks = [];

  // Render each overlay
  for (const overlay of overlays) {
    const result = this._renderOverlay(overlay, anchors, viewBox);

    if (result) {
      results.push(result.markup);

      // Collect postMount callbacks for card overlays
      if (result.postMount) {
        postMountCallbacks.push({
          overlayId: result.overlayId,
          callback: result.postMount
        });
      }
    }
  }

  // Combine markup
  const combinedMarkup = results.join('\n');

  return {
    html: combinedMarkup,
    postMountCallbacks
  };
}
```

#### `src/msd/pipeline/SystemsManager.js`

**Update render method to handle postMount callbacks:**

```javascript
/**
 * Render all overlays and handle card mounting
 * @returns {Object} Render result
 */
async render() {
  const model = this.modelBuilder.getResolvedModel();

  // Render overlays
  const result = await this.renderer.render(
    model.overlays,
    model.anchors,
    model.viewBox
  );

  // Store postMount callbacks for execution after DOM insertion
  if (result.postMountCallbacks) {
    this._pendingPostMounts = result.postMountCallbacks;
  }

  return {
    html: result.html
  };
}

/**
 * Execute postMount callbacks after DOM insertion
 * Called by card after SVG is inserted into shadow DOM
 * @param {Element} container - SVG container element
 */
executePostMounts(container) {
  if (!this._pendingPostMounts) return;

  lcardsLog.debug(`[SystemsManager] Executing ${this._pendingPostMounts.length} postMount callbacks`);

  this._pendingPostMounts.forEach(({ overlayId, callback }) => {
    try {
      callback(container);
    } catch (error) {
      lcardsLog.error(`[SystemsManager] Error in postMount for ${overlayId}:`, error);
    }
  });

  this._pendingPostMounts = null;
}
```

#### `src/cards/lcards-msd.js`

**Update to call postMount callbacks:**

```javascript
/**
 * Update MSD rendering
 * @private
 */
async _updateMsdRendering() {
  if (!this._msdPipeline || !this._msdInitialized) {
    return;
  }

  try {
    // Get rendered content from MSD pipeline
    if (this._msdPipeline.systemsManager && this._msdPipeline.systemsManager.render) {
      const renderResult = await this._msdPipeline.systemsManager.render();

      if (renderResult && renderResult.html) {
        this._renderContent = renderResult.html;
        this.requestUpdate();

        // Wait for DOM update to complete
        await this.updateComplete;

        // Execute postMount callbacks for card overlays
        const svgContainer = this.shadowRoot.querySelector('#msd-v1-comprehensive-wrapper');
        if (svgContainer && this._msdPipeline.systemsManager.executePostMounts) {
          this._msdPipeline.systemsManager.executePostMounts(svgContainer);
        }
      }
    }
  } catch (error) {
    lcardsLog.error('[LCARdSMSDCard] Failed to update MSD rendering:', error);
  }
}
```

### Testing Checklist

- [ ] SimpleCard overlays render in MSD
- [ ] HA card overlays render in MSD
- [ ] Positioning via anchors works
- [ ] Cards receive HASS updates
- [ ] Legacy button/text overlays auto-migrate with warnings
- [ ] postMount callbacks execute correctly

---

## Phase 4: Remove Obsolete Overlay Classes (Week 4)

### Objective
Delete duplicate overlay implementations and update documentation.

### Files to Delete

```bash
# Remove duplicate overlay classes (~100KB total)
rm src/msd/overlays/ButtonOverlay.js           # 35KB
rm src/msd/overlays/TextOverlay.js             # 48KB
rm src/msd/overlays/StatusGridOverlay.js       # 8KB
rm src/msd/overlays/ApexChartsOverlay.js       # 8KB

# Remove obsolete renderer
rm src/msd/renderer/StatusGridRenderer.js      # 3.5KB

# Update imports in overlay base
# Keep only LineOverlay in src/msd/overlays/
```

### Files to Modify

#### `src/msd/renderer/AdvancedRenderer.js`

**Remove imports:**

```javascript
// DELETE these imports:
// import { ButtonOverlay } from '../overlays/ButtonOverlay.js';
// import { TextOverlay } from '../overlays/TextOverlay.js';
// import { StatusGridOverlay } from '../overlays/StatusGridOverlay.js';
// import { ApexChartsOverlay } from '../overlays/ApexChartsOverlay.js';
// import { StatusGridRenderer } from './StatusGridRenderer.js';

// KEEP:
import { LineOverlay } from '../overlays/LineOverlay.js';
```

**Remove from `_getRendererForOverlay()`:**

```javascript
_getRendererForOverlay(overlay) {
  // Only need to handle LineOverlay now
  if (overlay.type === 'line') {
    return LineOverlay;
  }

  // Everything else goes through _renderCardOverlay()
  return null;
}
```

#### `src/msd/overlays/index.js`

**Update exports:**

```javascript
// Only export LineOverlay (SVG-native MSD overlay)
export { LineOverlay } from './LineOverlay.js';
export { OverlayBase } from './OverlayBase.js';

// All card-based overlays are now standalone SimpleCards
// ButtonOverlay → lcards-simple-button
// TextOverlay → lcards-simple-text
// ApexChartsOverlay → lcards-simple-chart
```

### Documentation Updates

#### Create `doc/migration/msd-v2-overlay-migration.md`

```markdown
# MSD v2 Overlay Migration Guide

## Overview

MSD v2 transforms MSD from a widget library to a universal canvas system. Card-based overlays (buttons, text, charts) are now standalone SimpleCards that can be used anywhere.

## Migration Steps

### Button Overlays

**Before:**
```yaml
overlays:
  - type: button
    id: light_btn
    entity: light.living_room
    anchor: button_1
    style:
      color: var(--lcars-blue)
    actions:
      tap_action:
        action: toggle
```

**After:**
```yaml
overlays:
  - type: card
    card_type: simple-button
    id: light_btn
    anchor: button_1
    config:
      entity: light.living_room
      style:
        color: colors.accent.primary
      tap_action:
        action: toggle
```

**Changes:**
- `type: button` → `type: card` + `card_type: simple-button`
- Overlay config wrapped in `config:` key
- Can now use full SimpleCard features (rules, presets, etc.)

### Text Overlays

**Before:**
```yaml
overlays:
  - type: text
    id: main_label
    content: "{{entity.attributes.friendly_name}}"
    anchor: label_1
    style:
      color: var(--lcars-orange)
      fontSize: 24
```

**After:**
```yaml
overlays:
  - type: card
    card_type: simple-text
    id: main_label
    anchor: label_1
    config:
      text: "{{entity.attributes.friendly_name}}"
      entity: light.living_room
      style:
        color: colors.accent.primary
        fontSize: 24
```

**Changes:**
- `type: text` → `type: card` + `card_type: simple-text`
- `content:` → `text:` (inside config)
- Overlay config wrapped in `config:` key

### Status Grid → Grid Card + SimpleButtons

**Before:**
```yaml
overlays:
  - type: status_grid
    id: system_grid
    anchor: grid_main
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
# Use standard HA Grid card with SimpleButtons
- type: grid
  cards:
    - type: custom:lcards-simple-button
      entity: light.bedroom
      label: Bedroom
      preset: picard_bullet
    - type: custom:lcards-simple-button
      entity: light.kitchen
      label: Kitchen
      preset: picard_bullet
```

**Why?**
- More flexible (full Grid card features)
- Better maintained (standard HA pattern)
- More powerful (full SimpleButton features per cell)
- Cleaner architecture (no duplicate grid logic)

### ApexCharts Overlays

**Before:**
```yaml
overlays:
  - type: apexchart
    id: temp_chart
    anchor: chart_1
    source: sensor.temperature
    chart_type: line
```

**After:**
```yaml
overlays:
  - type: card
    card_type: simple-chart
    id: temp_chart
    anchor: chart_1
    config:
      source: sensor.temperature
      chart_type: line
```

**Changes:**
- `type: apexchart` → `type: card` + `card_type: simple-chart`
- Chart config wrapped in `config:` key

### Line Overlays (No Change)

Line overlays remain MSD-specific and don't change:

```yaml
overlays:
  - type: line
    id: connection_line
    from: button_1
    to: chart_1
    style:
      stroke: colors.accent.secondary
```

## Automatic Migration

Legacy overlay types are automatically migrated with deprecation warnings:

```
[AdvancedRenderer] Legacy overlay type 'button' detected for light_btn.
  Please migrate to: type: card, card_type: simple-button
  Legacy support will be removed in v2.0.
```

Your config will continue to work, but you should migrate to the new pattern.

## Benefits

### For Users
- ✅ Use SimpleCards anywhere (standalone or in MSD)
- ✅ Consistent features across contexts
- ✅ Better documentation (one pattern)
- ✅ More powerful (rules, themes, presets)

### For Developers
- ✅ ~100KB less code to maintain
- ✅ Single implementation per feature
- ✅ Easier testing
- ✅ Clearer architecture

## Need Help?

- Check examples in `doc/examples/msd-v2/`
- Review SimpleCard docs in `doc/cards/`
- Ask on GitHub Discussions
```

#### Update `README.md`

Add migration notice:

```markdown
## ⚠️ MSD v2 Migration

If you're using MSD overlays (buttons, text, charts), please review the [Migration Guide](doc/migration/msd-v2-overlay-migration.md).

**Key Changes:**
- Button overlays → `lcards-simple-button` cards
- Text overlays → `lcards-simple-text` cards
- Chart overlays → `lcards-simple-chart` cards
- Status grids → Grid card + SimpleButtons

Legacy overlay types will continue to work with deprecation warnings until v2.0.
```

### Testing Checklist

- [ ] All imports resolve correctly
- [ ] No broken references to deleted files
- [ ] Legacy auto-migration still works
- [ ] Documentation is complete
- [ ] Examples are updated

---

## Testing Strategy

### Unit Tests

Create test files for each new card:

#### `tests/cards/lcards-simple-text.test.js`

```javascript
import { expect, fixture, html } from '@open-wc/testing';
import '../../src/cards/lcards-simple-text.js';

describe('lcards-simple-text', () => {
  it('renders static text', async () => {
    const el = await fixture(html`
      <lcards-simple-text .config=${{ text: 'Hello World' }}></lcards-simple-text>
    `);

    const text = el.shadowRoot.querySelector('text');
    expect(text.textContent).to.equal('Hello World');
  });

  it('processes JavaScript templates', async () => {
    const el = await fixture(html`
      <lcards-simple-text .config=${{
        text: '[[[return 2 + 2]]]'
      }}></lcards-simple-text>
    `);

    await el.updateComplete;
    const text = el.shadowRoot.querySelector('text');
    expect(text.textContent).to.equal('4');
  });

  it('applies theme tokens', async () => {
    const el = await fixture(html`
      <lcards-simple-text .config=${{
        text: 'Styled',
        style: { color: 'colors.accent.primary' }
      }}></lcards-simple-text>
    `);

    await el.updateComplete;
    const text = el.shadowRoot.querySelector('text');
    expect(text.getAttribute('fill')).to.match(/var\(--lcars-/);
  });
});
```

### Integration Tests

#### `tests/integration/msd-card-overlays.test.js`

```javascript
import { expect, fixture, html } from '@open-wc/testing';
import '../../src/cards/lcards-msd.js';

describe('MSD Card Overlays', () => {
  it('renders SimpleCard overlay via foreignObject', async () => {
    const msdConfig = {
      type: 'custom:lcards-msd-card',
      msd: {
        base_svg: { source: 'none' },
        view_box: [0, 0, 800, 600],
        overlays: [
          {
            type: 'card',
            card_type: 'simple-text',
            id: 'test_text',
            position: [100, 100],
            config: {
              text: 'Test'
            }
          }
        ]
      }
    };

    const el = await fixture(html`
      <lcards-msd-card .config=${msdConfig}></lcards-msd-card>
    `);

    await el.updateComplete;

    const foreignObject = el.shadowRoot.querySelector('foreignObject[data-overlay-id="test_text"]');
    expect(foreignObject).to.exist;

    const card = foreignObject.querySelector('lcards-simple-text');
    expect(card).to.exist;
  });

  it('auto-migrates legacy button overlay', async () => {
    const msdConfig = {
      type: 'custom:lcards-msd-card',
      msd: {
        base_svg: { source: 'none' },
        view_box: [0, 0, 800, 600],
        overlays: [
          {
            type: 'button',  // Legacy type
            id: 'test_btn',
            entity: 'light.test',
            position: [100, 100]
          }
        ]
      }
    };

    const el = await fixture(html`
      <lcards-msd-card .config=${msdConfig}></lcards-msd-card>
    `);

    await el.updateComplete;

    // Should auto-migrate to simple-button card
    const card = el.shadowRoot.querySelector('lcards-simple-button');
    expect(card).to.exist;
  });
});
```

### Manual Testing Checklist

#### Standalone Cards

- [ ] `lcards-simple-text` renders in dashboard
- [ ] `lcards-simple-chart` renders with data
- [ ] Template processing works
- [ ] Theme tokens resolve
- [ ] Rules apply correctly
- [ ] Entity state updates trigger re-render

#### MSD Integration

- [ ] SimpleCard overlays position correctly
- [ ] HA card overlays work
- [ ] Legacy overlays auto-migrate
- [ ] HASS updates propagate to cards
- [ ] Multiple overlays don't conflict
- [ ] Sizing/positioning is accurate

#### Migration

- [ ] Existing MSD configs work (legacy mode)
- [ ] Migration warnings display
- [ ] Migrated configs work correctly
- [ ] Documentation is clear

---

## Rollout Plan

### Week 1: SimpleText
- Create `lcards-simple-text.js`
- Register in `lcards.js`
- Write tests
- Create documentation
- Test standalone usage

### Week 2: SimpleChart
- Create `lcards-simple-chart.js`
- Register in `lcards.js`
- Write tests
- Create documentation
- Test standalone usage

### Week 3: MSD Integration
- Update `AdvancedRenderer.js`
- Update `SystemsManager.js`
- Update `lcards-msd.js`
- Add auto-migration logic
- Test MSD card overlays
- Test legacy migration

### Week 4: Cleanup
- Delete obsolete files
- Update all imports
- Update documentation
- Create migration guide
- Final testing
- Prepare release notes

---

## Success Criteria

### Technical
- [ ] All tests passing
- [ ] No console errors
- [ ] Bundle size reduced by ~100KB
- [ ] Performance metrics maintained
- [ ] Memory leaks checked

### User Experience
- [ ] Existing configs work (legacy mode)
- [ ] New configs more powerful
- [ ] Documentation complete
- [ ] Migration path clear
- [ ] Examples provided

### Code Quality
- [ ] No duplicate implementations
- [ ] Clear architectural separation
- [ ] Full JSDoc coverage
- [ ] Consistent patterns
- [ ] Maintainable structure

---

## Risk Mitigation

### Breaking Changes
**Risk:** Users with existing MSD configs
**Mitigation:** Auto-migration with warnings, maintain legacy support through v2.0

### Performance
**Risk:** foreignObject rendering overhead
**Mitigation:** Test with multiple overlays, optimize postMount execution

### Card Registration
**Risk:** Cards not available when MSD initializes
**Mitigation:** Ensure card registration happens before MSD initialization in `lcards.js`

### HASS Propagation
**Risk:** Cards in foreignObject don't receive HASS updates
**Mitigation:** Explicitly set HASS in `_createCardInstance()`

---

## Post-Implementation

### Documentation
- [ ] Update architecture docs
- [ ] Create migration guide
- [ ] Add examples for each card type
- [ ] Update README
- [ ] Create video walkthrough

### Communication
- [ ] GitHub release notes
- [ ] Migration announcement
- [ ] Update Discord/forums
- [ ] Deprecation timeline

### Monitoring
- [ ] Track GitHub issues
- [ ] Monitor user questions
- [ ] Gather feedback
- [ ] Plan v2.0 timeline

---

## Questions for Agent

Before implementation, please confirm:

1. **SimpleCard SVG Rendering**: Do SimpleCards render SVG content or HTML? (Response: SVG for LCARS aesthetic)

2. **Card Registration Order**: Should SimpleCards be registered before MSD in `lcards.js`? (Response: Yes)

3. **Legacy Support Duration**: Keep auto-migration through which version? (Response: Remove in v2.0)

4. **Testing Framework**: Use `@open-wc/testing` or another framework? (Response: Confirm choice)

5. **ApexCharts Loading**: Load library dynamically or bundle? (Response: Dynamic for smaller initial bundle)

---

## Appendix: File Checklist

### Files to Create (6 total)
- [ ] `src/cards/lcards-simple-text.js`
- [ ] `src/cards/lcards-simple-chart.js`
- [ ] `tests/cards/lcards-simple-text.test.js`
- [ ] `tests/cards/lcards-simple-chart.test.js`
- [ ] `tests/integration/msd-card-overlays.test.js`
- [ ] `doc/migration/msd-v2-overlay-migration.md`

### Files to Modify (5 total)
- [ ] `src/lcards.js` (card registration)
- [ ] `src/msd/renderer/AdvancedRenderer.js` (card overlay support)
- [ ] `src/msd/pipeline/SystemsManager.js` (postMount execution)
- [ ] `src/cards/lcards-msd.js` (postMount callback)
- [ ] `README.md` (migration notice)

### Files to Delete (5 total)
- [ ] `src/msd/overlays/ButtonOverlay.js`
- [ ] `src/msd/overlays/TextOverlay.js`
- [ ] `src/msd/overlays/StatusGridOverlay.js`
- [ ] `src/msd/overlays/ApexChartsOverlay.js`
- [ ] `src/msd/renderer/StatusGridRenderer.js`

### Documentation to Create (2 total)
- [ ] `doc/cards/lcards-simple-text.md`
- [ ] `doc/cards/lcards-simple-chart.md`

---
