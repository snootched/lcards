# LCARdS Visual Editor

Visual editor components for LCARdS cards, integrated with Home Assistant's native card editor interface.

## Quick Start

### Creating a New Card Editor

1. **Register Schema in Card Class** (`cards/lcards-mycard.js`):
```javascript
import { LCARdSCard } from '../base/LCARdSCard.js';

// Import editor component for getConfigElement()
import '../editor/cards/lcards-mycard-editor.js';

export class LCARdSMyCard extends LCARdSCard {
    static CARD_TYPE = 'mycard';
    
    static getStubConfig() {
        return {
            type: 'custom:lcards-mycard',
            entity: 'light.example'
        };
    }
    
    static getConfigElement() {
        // Static import - editor bundled with card
        return document.createElement('lcards-mycard-editor');
    }
}

// Register schema with CoreConfigManager singleton
if (window.lcardsCore?.configManager) {
    window.lcardsCore.configManager.registerCardSchema('mycard', {
        type: 'object',
        properties: {
            entity: { type: 'string', description: 'Entity ID' },
            preset: { type: 'string', enum: ['lozenge', 'bullet'] }
        },
        required: ['type', 'entity']
    });
}
```

2. **Create Editor** (`editor/cards/lcards-mycard-editor.js`):
```javascript
import { LCARdSBaseEditor } from '../base/LCARdSBaseEditor.js';

export class LCARdSMyCardEditor extends LCARdSBaseEditor {
    constructor() {
        super();
        this.cardType = 'mycard'; // Set card type for schema lookup
    }
    
    _getTabDefinitions() {
        return [
            { label: 'Config', content: () => this._renderConfigTab() },
            { label: 'YAML', content: () => this._renderYamlTab() }
        ];
    }
    
    // Note: _getSchema() is NOT overridden
    // Base class queries singleton using this.cardType
    
    _renderConfigTab() { /* ... */ }
    _renderYamlTab() { /* ... */ }
}

customElements.define('lcards-mycard-editor', LCARdSMyCardEditor);
```

## Directory Structure

```
editor/
├── base/                    # Base classes and shared styles
│   ├── LCARdSBaseEditor.js  # Enhanced with path-based config access
│   └── editor-styles.js     # Shared CSS
├── cards/                   # Card-specific editors
│   └── lcards-button-editor.js  # Reference implementation
├── components/              # Reusable editor components
│   ├── common/             # Common UI components
│   ├── form/               # Schema-driven form components
│   │   ├── lcards-form-field.js         # Smart auto-rendering field
│   │   ├── lcards-form-section.js       # Collapsible sections
│   │   ├── lcards-grid-layout.js        # Two-column responsive layout
│   │   ├── lcards-color-selector.js     # LCARS palette + custom colors
│   │   ├── lcards-color-section.js      # State-based color groups
│   │   ├── lcards-entity-field.js       # Entity picker wrapper
│   │   ├── lcards-multi-text-editor.js  # NEW: Multi-text field manager
│   │   ├── lcards-icon-editor.js        # NEW: Icon config (simple/advanced)
│   │   ├── lcards-border-editor.js      # NEW: Border config with preview
│   │   ├── lcards-segment-list-editor.js # NEW: SVG segment manager
│   │   └── lcards-multi-action-editor.js # NEW: Unified action editor
│   └── yaml/               # YAML editor
└── utils/                  # Utility functions
    └── yaml-utils.js       # YAML conversion (uses js-yaml)

utils/                      # Shared utilities (not editor-specific)
└── schema-helpers.js       # NEW: Schema navigation and formatting

Note: Schemas are NOT stored in editor directory.
Cards register schemas with CoreConfigManager singleton.
Validation is performed by CoreValidationService singleton.
```

## Key Components

### Base Editor
- **LCARdSBaseEditor** - Abstract base class with path-based config access
  - `_getConfigValue(path)` - Get value by dot-notation path
  - `_setConfigValue(path, value)` - Set value with automatic deep merge
  - `_getSchemaForPath(path)` - Get schema for specific path
  - `_evaluateCondition(condition)` - Evaluate visibility/disabled conditions

### Form Components
- **lcards-form-field** - Smart field that auto-renders based on schema
  - Supports: entity, color, action formats
  - Handles: boolean, number, string, enum, array types
  - Auto-generates labels from schema or path
- **lcards-form-section** - Collapsible section with ha-expansion-panel
- **lcards-grid-layout** - Responsive two-column layout (stacks on mobile)
- **lcards-color-selector** - Color picker with LCARS palette presets
- **lcards-color-section** - Specialized for state-based colors
- **lcards-entity-field** - Entity picker with domain filtering

### Enhanced Form Components (v1.17.0)
- **lcards-multi-text-editor** - Manage multiple text fields with per-field styling
  - Add/edit/remove text fields dynamically
  - Per-field positioning, fonts, colors
  - State-based color support
  - Template toggle per field
  - Visibility toggle
- **lcards-icon-editor** - Icon configuration with simple/advanced modes
  - Simple mode: icon string + basic controls
  - Advanced mode: full styling (position, size, rotation, background)
  - State-based icon colors
  - Background configuration (color, radius, padding)
- **lcards-border-editor** - Border configuration with visual preview
  - Unified/per-side width toggle
  - Unified/per-corner radius toggle
  - State-based border colors
  - Live SVG preview
- **lcards-segment-list-editor** - SVG segment management
  - Add/remove/edit segments
  - Per-segment entity and actions
  - Compact summary view with expand for details
- **lcards-multi-action-editor** - Unified action configuration
  - Tap, hold, and double-tap actions in one view
  - Uses existing lcards-action-editor for each type
  - Collapsible sections per action type

### Legacy Components
- **LCARdSCardConfigSection** - Common card properties (entity, ID, tags, layout)
- **LCARdSActionEditor** - Action configuration (tap, hold, double-tap)
- **LCARdSMonacoYamlEditor** - YAML editor with validation

## Features

✅ **Tab-based UI** - Organize editor into logical sections  
✅ **YAML synchronization** - Visual tabs ↔ YAML tab bidirectional sync  
✅ **Schema validation** - Uses CoreValidationService singleton for production-grade validation  
✅ **Singleton pattern** - Schemas queried from CoreConfigManager  
✅ **HA integration** - Uses Home Assistant's standard components  
✅ **Graceful fallbacks** - Works without HA-specific components  
✅ **Schema-driven forms** - Smart components that auto-render based on schema  
✅ **Path-based access** - Dot-notation for nested config values  
✅ **Responsive layout** - Two-column grids that stack on mobile  
✅ **Collapsible sections** - Organize complex forms efficiently  

## Architecture Patterns

- **Schema Registration**: Cards register schemas with `configManager.registerCardSchema()`
- **Schema Query**: Editors query via `configManager.getCardSchema(cardType)`
- **Validation**: Uses `validationService.validate()` for comprehensive validation
- **Static Imports**: Editor imported statically in card file (webpack compatibility)
- **Deep Merge**: Uses `core/config-manager/merge-helpers.js` (no duplication)
- **Path-based Access**: Use dot-notation paths for nested config access

## Using the New Form Components

### Schema-Driven Form Field

The `lcards-form-field` component automatically renders the appropriate control based on schema:

```javascript
import '../components/form/lcards-form-field.js';

_renderConfigTab() {
    return html`
        <!-- Auto-renders entity picker based on schema format -->
        <lcards-form-field
            .editor=${this}
            path="entity"
            label="Entity">
        </lcards-form-field>

        <!-- Auto-renders dropdown for enum types -->
        <lcards-form-field
            .editor=${this}
            path="preset"
            label="Style Preset">
        </lcards-form-field>

        <!-- Auto-renders number input with min/max from schema -->
        <lcards-form-field
            .editor=${this}
            path="grid_columns">
        </lcards-form-field>
    `;
}
```

### Collapsible Sections

```javascript
import '../components/form/lcards-form-section.js';

_renderConfigTab() {
    return html`
        <lcards-form-section
            header="Basic Configuration"
            description="Core card settings"
            ?expanded=${true}>
            
            <lcards-form-field .editor=${this} path="entity"></lcards-form-field>
            <lcards-form-field .editor=${this} path="id"></lcards-form-field>
        </lcards-form-section>

        <lcards-form-section
            header="Advanced"
            ?expanded=${false}
            outlined>
            
            <lcards-form-field .editor=${this} path="update_interval"></lcards-form-field>
        </lcards-form-section>
    `;
}
```

### Two-Column Layout

```javascript
import '../components/form/lcards-grid-layout.js';

_renderConfigTab() {
    return html`
        <lcards-form-section header="Layout">
            <lcards-grid-layout>
                <lcards-form-field .editor=${this} path="grid_columns"></lcards-form-field>
                <lcards-form-field .editor=${this} path="grid_rows"></lcards-form-field>
            </lcards-grid-layout>
        </lcards-form-section>
    `;
}
```

### Using Path-Based Config Access

```javascript
// Get nested config value
const borderColor = this._getConfigValue('style.color.border.default');

// Set nested config value (auto-merges)
this._setConfigValue('style.color.border.default', '#ff9900');

// Get schema for specific path
const schema = this._getSchemaForPath('style.color.border.default');
```

### Enhanced Components Usage

#### Multi-Text Editor
```javascript
import '../components/form/lcards-multi-text-editor.js';

_renderTextTab() {
    return html`
        <lcards-multi-text-editor
            .editor=${this}
            .textConfig=${this.config.text || {}}
            .presetFields=${['name', 'label', 'state']}
            .hass=${this.hass}
            @value-changed=${(e) => this._setConfigValue('text', e.detail.value)}>
        </lcards-multi-text-editor>
    `;
}
```

#### Icon Editor
```javascript
import '../components/form/lcards-icon-editor.js';

_renderIconTab() {
    return html`
        <lcards-icon-editor
            .editor=${this}
            path="icon"
            label="Icon Configuration"
            .hass=${this.hass}
            @value-changed=${(e) => this._setConfigValue('icon', e.detail.value)}>
        </lcards-icon-editor>
    `;
}
```

#### Border Editor
```javascript
import '../components/form/lcards-border-editor.js';

_renderBorderTab() {
    return html`
        <lcards-border-editor
            .editor=${this}
            path="style.border"
            label="Border Configuration"
            ?showPreview=${true}
            @value-changed=${(e) => this._setConfigValue('style.border', e.detail.value)}>
        </lcards-border-editor>
    `;
}
```

#### Segment List Editor
```javascript
import '../components/form/lcards-segment-list-editor.js';

_renderSegmentsTab() {
    return html`
        <lcards-segment-list-editor
            .editor=${this}
            .segments=${this.config.svg?.segments || []}
            .hass=${this.hass}
            ?expanded=${true}
            @value-changed=${this._handleSegmentsChange}>
        </lcards-segment-list-editor>
    `;
}

_handleSegmentsChange(event) {
    const segments = event.detail.value;
    this._updateConfig({
        svg: {
            ...(this.config.svg || {}),
            segments
        }
    });
}
```

#### Multi-Action Editor
```javascript
import '../components/form/lcards-multi-action-editor.js';

_renderActionsTab() {
    return html`
        <lcards-multi-action-editor
            .hass=${this.hass}
            .actions=${{
                tap_action: this.config.tap_action || { action: 'toggle' },
                hold_action: this.config.hold_action || { action: 'more-info' },
                double_tap_action: this.config.double_tap_action || { action: 'none' }
            }}
            @value-changed=${this._handleActionsChange}>
        </lcards-multi-action-editor>
    `;
}

_handleActionsChange(event) {
    const actions = event.detail.value;
    this._updateConfig({
        tap_action: actions.tap_action,
        hold_action: actions.hold_action,
        double_tap_action: actions.double_tap_action
    });
}
```

### Complete Example

See `src/editor/cards/lcards-button-editor.js` for a complete reference implementation using all new components.

## Documentation

See [Visual Editor Architecture](../../doc/architecture/visual-editor-architecture.md) for detailed documentation.

## Test Examples

See `doc/user/examples/button-visual-editor-test.yaml` for comprehensive test configurations demonstrating all features.

## Status

### Phase 1: Enhanced Visual Editor ✅ (v1.17.0)
- ✅ Horizontal tab scrolling with fade indicators
- ✅ Multi-text field editor
- ✅ Icon editor (simple/advanced modes)
- ✅ Border editor with preview
- ✅ Segment list editor
- ✅ Multi-action editor
- ✅ 8-tab button editor structure
- ✅ State-based color support (existing component)

### Phase 2: Advanced Features (Future)
- 🔜 Animation editor with visual timeline
- 🔜 SVG background editor
- 🔜 Component/shape selector
- 🔜 Live preview panel
- 🔜 Enhanced color section (copy/reset/preview)
- Enhanced base editor with path-based config access
- Smart form field component with auto-rendering
- Collapsible section components
- Responsive grid layouts
- Color selector with LCARS palette
- Entity picker wrapper
- Button card editor as reference implementation

### Phase 2: DataSource Builder 🔜 (Future)
- Visual datasource configuration
- Transform picker
- Preview

### Phase 3: Rules Engine Builder 🔜 (Future)
- Visual rule builder
- Condition tree
- Rule tester

### Phase 4: Enhanced Features 🔜 (Future)
- Full Monaco editor with IntelliSense
- Live card preview
- Theme preview
