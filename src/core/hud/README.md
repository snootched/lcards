# LCARdS Global HUD System

## Overview

The LCARdS Global HUD (Heads-Up Display) system provides runtime debugging and inspection capabilities across all LCARdS cards. It replaces the previous MSD-specific HUD with a unified, extensible architecture.

## Architecture

```
window.lcards.core.hudManager (Global Singleton)
  ├─ HudManager - Panel & card registration
  ├─ HudService - Keyboard shortcuts & UI
  └─ HudEventBus - Event coordination

Panels:
  ├─ Core Panels (Available for all cards)
  │  ├─ PerformancePanel - FPS, memory, timing
  │  ├─ ValidationPanel - Errors & warnings
  │  ├─ DebugFlagsPanel - Debug feature toggles
  │  └─ SystemHealthPanel - Singleton status
  │
  └─ Card-Specific Panels (Registered by cards)
     └─ MSD Card
        ├─ RoutingPanel - Line routing visualization
        ├─ OverlaysPanel - Overlay inspection
        └─ ChannelTrendPanel - Channel usage trends
```

## Usage

### Opening the HUD

**Keyboard Shortcut:** `Alt + Shift + U` (default, configurable)

```javascript
// Or programmatically:
window.lcards.core.hudManager.show();
window.lcards.core.hudManager.toggle();
```

### Configuring the Keyboard Shortcut

```javascript
// Change shortcut to Ctrl+Shift+D
window.lcards.core.hudService.setShortcut({
  ctrl: true,
  shift: true,
  alt: false,
  meta: false,
  key: 'd'
});

// Get current shortcut description
const shortcut = window.lcards.core.hudService.getShortcutDescription();
console.log('HUD Shortcut:', shortcut); // "Ctrl+Shift+D"
```

### Multi-Card Dashboards

When multiple LCARdS cards are present on a dashboard, the HUD displays a card selector dropdown. Select a card to view its specific panels alongside the global panels.

## For Card Developers

### Registering a Card with the HUD

```javascript
import { MyPanel1 } from './hud/panels/MyPanel1.js';
import { MyPanel2 } from './hud/panels/MyPanel2.js';

class MyCustomCard extends LCARdSCard {
  async _initializeCard() {
    // ... card initialization

    // Create card-specific panels
    const panels = new Map([
      ['my-panel-1', new MyPanel1()],
      ['my-panel-2', new MyPanel2()]
    ]);

    // Register with HUD
    const cardContext = {
      guid: this._cardGuid,
      type: 'my-custom-card',
      instance: this,
      panels: panels,
      // Add any custom context data
      customData: this._someInternalState
    };

    window.lcards.core.hudManager.registerCard(this._cardGuid, cardContext);
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    // Unregister from HUD
    if (this._cardGuid) {
      window.lcards.core.hudManager.unregisterCard(this._cardGuid);
    }
  }
}
```

### Creating a Custom Panel

All panels must implement these methods:

```javascript
export class MyCustomPanel {
  /**
   * Capture data for the panel
   * @returns {Object} Panel data
   */
  captureData() {
    return {
      myMetric: this._calculateMetric(),
      status: this._getStatus()
    };
  }

  /**
   * Render panel HTML
   * @param {Object} data - Data from captureData()
   * @returns {string} HTML string
   */
  renderHtml(data) {
    return `
      <div class="my-panel">
        <h4>My Custom Panel</h4>
        <p>Metric: ${data.myMetric}</p>
        <p>Status: ${data.status}</p>
        ${this._getStyles()}
      </div>
    `;
  }

  /**
   * Cleanup resources (optional but recommended)
   */
  destroy() {
    // Cleanup timers, listeners, etc.
  }

  /**
   * Panel-specific styles (optional)
   * @private
   */
  _getStyles() {
    return `
      <style>
        .my-panel h4 {
          margin: 0 0 12px 0;
          border-bottom: 1px solid rgba(0, 255, 255, 0.3);
        }
        /* ... more styles ... */
      </style>
    `;
  }
}
```

### Panel Design Guidelines

1. **Keep panels focused**: Each panel should have a single, clear purpose
2. **Performance**: `captureData()` is called frequently - keep it fast
3. **Styling**: Use inline styles within `renderHtml()` to avoid conflicts
4. **Color scheme**: Use LCARS-inspired colors (cyan: `#00ffff`, yellow: `#ffcc66`, etc.)
5. **Responsiveness**: Design for the HUD's ~420px width
6. **No dependencies**: Panels should be self-contained

### Accessing Card Context

Panels can access the card context through the HUD manager:

```javascript
captureData() {
  const hudManager = window.lcards.core.hudManager;
  const cardGuid = hudManager.state.activeCard;
  const cardContext = hudManager.cards.get(cardGuid);

  if (cardContext) {
    // Access card-specific data
    const myData = cardContext.customData;
    // ...
  }

  return { /* panel data */ };
}
```

## Core Panels

### PerformancePanel

Monitors runtime performance:
- **FPS** - Frames per second
- **Memory** - Heap usage (Chrome only)
- **Timing** - Top 5 slowest operations
- **Page Load** - Initial page load time

💡 **Tip**: For deeper analysis, use browser dev tools (F12) and Home Assistant developer stats.

### ValidationPanel

Aggregates validation errors and warnings from all cards:
- **Errors** - Critical validation failures
- **Warnings** - Non-critical issues
- **By Card** - Breakdown by card instance

### DebugFlagsPanel

Toggle debug features:
- **Verbose Logging** - Enable debug-level console logs
- **Bounding Boxes** - Show element boundaries (MSD)
- **Anchor Points** - Show anchor points (MSD)
- **Routing Paths** - Show line routing (MSD)
- **Performance Markers** - Show timing markers
- **Animation Debug** - Log animation lifecycle

### SystemHealthPanel

Monitor LCARdS core systems:
- **Singleton Status** - Health of core services
- **Resource Counts** - Cards, data sources, rules, themes
- **System Health Score** - Overall health percentage
- **Uptime** - Time since initialization

## MSD Panels

### RoutingPanel

Visualize and debug line routing:
- **Route Statistics** - Cache hits, costs, strategies
- **Visual Overlay** - SVG path visualization
- **Route Analysis** - Detailed path inspection
- **Filtering** - By strategy, cost, cache status

### OverlaysPanel

Inspect overlay structure:
- **Overlay List** - All overlays with metadata
- **Highlight** - Visual overlay highlighting
- **Type Breakdown** - Statistics by overlay type
- **Attachment Info** - Anchor and attach_to relationships

### ChannelTrendPanel

Analyze routing channel usage:
- **Channel Occupancy** - Current usage per channel
- **Conflict Detection** - Over-subscribed channels
- **Usage Trends** - Historical usage patterns
- **Optimization Hints** - Routing improvement suggestions

## Event System

The HUD uses an event bus for panel coordination:

```javascript
// Subscribe to events
const hudBus = window.lcards.core.hudManager.bus;

hudBus.on('select:changed', (selection) => {
  console.log('Selected:', selection.type, selection.id);
});

// Emit events
hudBus.emit('my-custom-event', { data: 'value' });

// Wildcard listener (all events)
hudBus.on('*', ({ event, payload }) => {
  console.log('Event:', event, payload);
});
```

## API Reference

### HudManager

#### Properties

- `panels` - Map<string, PanelInstance> - Registered panels
- `cards` - Map<string, CardContext> - Registered cards
- `state` - Object - HUD state (visible, activeCard, activePanel, etc.)
- `bus` - HudEventBus - Event bus instance
- `selection` - SelectionManager - Selection state manager

#### Methods

- `registerPanel(panelId, panelInstance)` - Register a panel
- `unregisterPanel(panelId)` - Unregister a panel
- `registerCard(cardGuid, cardContext)` - Register a card
- `unregisterCard(cardGuid)` - Unregister a card
- `setActivePanel(panelId)` - Set active panel
- `setActiveCard(cardGuid)` - Set active card
- `show()` - Show HUD
- `hide()` - Hide HUD
- `toggle()` - Toggle HUD visibility
- `refresh()` - Refresh HUD content
- `setRefreshRate(ms)` - Set auto-refresh interval

### HudService

#### Methods

- `initialize()` - Initialize service (setup keyboard listeners)
- `setShortcut(config)` - Set custom keyboard shortcut
- `getShortcut()` - Get current shortcut config
- `getShortcutDescription()` - Get human-readable shortcut

### HudEventBus

#### Methods

- `on(event, callback)` - Subscribe to event (returns unsubscribe function)
- `once(event, callback)` - Subscribe to event (one-time)
- `off(event, callback)` - Unsubscribe from event
- `emit(event, payload)` - Emit event
- `clear()` - Clear all listeners

## Migration from MSD HUD

### Breaking Changes

1. **MsdHudManager removed** - Use `window.lcards.core.hudManager` instead
2. **Panel registration** - Panels now registered per-card, not globally
3. **Keyboard shortcut** - Changed from `Ctrl+H` to `Alt+Shift+U`
4. **Panel locations** - Core panels moved to `src/core/hud/panels/`

### Migration Guide

#### Before (MSD-specific):

```javascript
// Old MSD HUD
this.hudManager = new MsdHudManager();
this.hudManager.init(mountEl);
window.lcards.debug.msd.hud = this.hudManager;
```

#### After (Global HUD):

```javascript
// Register MSD panels with global HUD
const panels = new Map([
  ['routing', new RoutingPanel()],
  ['overlays', new OverlaysPanel()],
  ['channel-trend', new ChannelTrendPanel()]
]);

window.lcards.core.hudManager.registerCard(cardGuid, {
  guid: cardGuid,
  type: 'msd',
  instance: this,
  panels: panels
});
```

### Removed Features

- **DataSourcePanel** - Use editor's DataSource tab
- **RulesPanel** - Use editor's Rules dashboard
- **ExportPanel** - Use Home Assistant's native export
- **PacksPanel** - Low value, removed
- **IssuesPanel** - Consolidated into ValidationPanel

## Troubleshooting

### HUD Not Appearing

1. Check keyboard shortcut: `window.lcards.core.hudService.getShortcutDescription()`
2. Verify HUD manager exists: `!!window.lcards.core.hudManager`
3. Check browser console for errors
4. Try opening manually: `window.lcards.core.hudManager.show()`

### Panels Not Showing

1. Verify panel registration: `window.lcards.core.hudManager.panels`
2. Check active panel: `window.lcards.core.hudManager.state.activePanel`
3. Verify panel has required methods: `captureData()`, `renderHtml()`
4. Check browser console for panel errors

### Card-Specific Panels Missing

1. Verify card is registered: `window.lcards.core.hudManager.cards`
2. Check active card: `window.lcards.core.hudManager.state.activeCard`
3. Verify card has panels: `cardContext.panels`
4. Check panel IDs: Should be `{cardGuid}:{panelId}`

## Development Tips

1. **Use logging**: `lcardsLog.debug('[MyPanel] ...')` for debugging
2. **Test refresh rate**: Adjust `setRefreshRate()` during development
3. **Browser dev tools**: Essential for debugging panel rendering
4. **Panel isolation**: Test panels independently before registration
5. **Performance**: Profile `captureData()` with large datasets
6. **Styling**: Use Chrome DevTools to inspect HUD styles

## Future Enhancements

Planned features for future releases:

- [ ] Panel resize/reposition support
- [ ] Panel layout customization
- [ ] Export panel data to JSON
- [ ] Panel snapshots/history
- [ ] Custom panel themes
- [ ] Panel keyboard shortcuts
- [ ] Dockable/floating HUD modes
- [ ] Panel search/filter
- [ ] Performance profiling integration
- [ ] Animation timeline viewer

## Contributing

When adding new panels:

1. Follow the panel interface pattern
2. Keep panels self-contained
3. Add JSDoc comments
4. Update this README
5. Add examples to documentation
6. Test with multiple cards
7. Verify cleanup in `destroy()`

## License

Part of the LCARdS project - MIT License
