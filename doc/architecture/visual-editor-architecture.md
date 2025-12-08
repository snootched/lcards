# LCARdS Visual Editor Architecture

## Overview

The LCARdS Visual Editor provides a user-friendly interface for configuring LCARdS cards within Home Assistant's native card editor. This document describes the architecture, components, and usage patterns.

## Architecture

### Component Hierarchy

```
LCARdSBaseEditor (Abstract Base Class)
    ├── Tab Management
    ├── Config State Management
    ├── YAML Synchronization
    ├── Schema Validation
    └── HA Integration (fireEvent)
            ↓
    LCARdSButtonEditor (Card-Specific Editor)
        ├── Card Config Tab
        ├── Actions Tab
        └── Advanced YAML Tab
```

### Data Flow

```
User Edits Visual Tab
        ↓
Component fires 'value-changed' event
        ↓
BaseEditor._updateConfig() merges partial config
        ↓
        ├→ Updates YAML editor (configToYaml)
        └→ Validates against schema
            ↓
    fireEvent('config-changed') to Home Assistant
            ↓
    Home Assistant updates dashboard config
```

**Bidirectional Sync:**
- Visual tab edit → Internal config → YAML tab update
- YAML tab edit → Parse & validate → Internal config → Visual tabs update (via requestUpdate)

### Prevention of Circular Updates

The editor uses the `_isUpdatingYaml` flag to prevent infinite loops:

1. Visual tab changes config → Sets `_isUpdatingYaml = true` → Updates YAML → Resets flag
2. YAML tab changes → Checks `_isUpdatingYaml` → If false, updates config → Does NOT re-update YAML

## Directory Structure

```
src/editor/
├── base/
│   ├── LCARdSBaseEditor.js      # Abstract base class
│   └── editor-styles.js          # Shared CSS styles
│
├── cards/
│   └── lcards-button-editor.js   # Button card editor
│
├── components/
│   ├── common/
│   │   ├── lcards-card-config-section.js  # Entity, ID, tags, layout
│   │   └── lcards-action-editor.js        # Tap/hold/double-tap actions
│   └── yaml/
│       └── lcards-monaco-yaml-editor.js   # YAML editor with validation
│
└── utils/
    └── yaml-utils.js             # YAML ↔ JSON conversion (uses js-yaml)

Note: Schemas are NOT stored in editor directory. Cards register their schemas 
with CoreConfigManager, and editors query them via window.lcardsCore.configManager.
Validation is performed by CoreValidationService singleton.
```

## Creating a New Card Editor

### Step 1: Register Schema in Card Class

Schemas are registered by the card class itself, not stored in separate files. This ensures a single source of truth.

```javascript
// src/cards/lcards-mycard.js
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

// Register schema with CoreConfigManager
if (window.lcardsCore?.configManager) {
    const configManager = window.lcardsCore.configManager;
    
    // Register behavioral defaults
    configManager.registerCardDefaults('mycard', {
        enable_hold_action: true
    });
    
    // Register JSON schema for validation
    configManager.registerCardSchema('mycard', {
        type: 'object',
        properties: {
            entity: {
                type: 'string',
                description: 'Entity ID to control'
            },
            preset: {
                type: 'string',
                enum: ['lozenge', 'bullet', 'capped'],
                description: 'Style preset'
            }
            // ... other properties
        },
        required: ['type']
    });
}
```

### Step 2: Create the Editor Component

The editor queries the schema from the singleton rather than importing it.

```javascript
// src/editor/cards/lcards-mycard-editor.js
import { html } from 'lit';
import { LCARdSBaseEditor } from '../base/LCARdSBaseEditor.js';
import '../components/common/lcards-card-config-section.js';
import '../components/yaml/lcards-monaco-yaml-editor.js';

export class LCARdSMyCardEditor extends LCARdSBaseEditor {
    
    constructor() {
        super();
        this.cardType = 'mycard'; // Set card type for schema lookup
    }
    
    _getTabDefinitions() {
        return [
            {
                label: 'Configuration',
                content: () => this._renderConfigTab()
            },
            {
                label: 'Advanced (YAML)',
                content: () => this._renderYamlTab()
            }
        ];
    }
    
    // Note: _getSchema() is NOT overridden - base class queries singleton
    // using this.cardType to call window.lcardsCore.configManager.getCardSchema()
    
    _renderConfigTab() {
        return html`
            <lcards-card-config-section
                .hass=${this.hass}
                .config=${this.config}
                .schema=${this._getSchema()}
                @config-changed=${(e) => this._updateConfig(e.detail.config)}>
            </lcards-card-config-section>
            
            <!-- Add card-specific configuration UI here -->
        `;
    }
    
    _renderYamlTab() {
        return html`
            <lcards-monaco-yaml-editor
                .value=${this._yamlValue}
                .schema=${this._getSchema()}
                .errors=${this._validationErrors}
                @value-changed=${this._handleYamlChange}>
            </lcards-monaco-yaml-editor>
        `;
    }
}

customElements.define('lcards-mycard-editor', LCARdSMyCardEditor);
```

### Key Architecture Points

1. **Schema Registration**: Cards register schemas with `CoreConfigManager` during initialization
2. **Schema Retrieval**: Editors query schemas via `window.lcardsCore.configManager.getCardSchema(cardType)`
3. **Single Source of Truth**: Schema lives in card file, editor consumes it
4. **Static Imports**: Editor is imported statically at top of card file (webpack compatibility)
5. **CardType Property**: Editor sets `this.cardType` in constructor for schema lookup

## Components

### LCARdSBaseEditor

**Purpose:** Abstract base class providing core editor functionality.

**Key Methods:**
- `setConfig(config)` - Initialize editor with config (called by HA)
- `_updateConfig(updates, source)` - Merge partial config updates
- `_handleYamlChange(ev)` - Handle YAML editor changes
- `_getTabDefinitions()` - Abstract: Define tabs (override in subclass)
- `_getSchema()` - Abstract: Return JSON Schema (override in subclass)

### LCARdSCardConfigSection

**Purpose:** Reusable component for common card properties.

**Props:**
- `hass` - Home Assistant instance
- `config` - Card configuration
- `schema` - JSON Schema for property descriptions

**Features:**
- Entity picker (with fallback to text input)
- Card ID field
- Tags input (comma-separated)
- Preset selector (if schema defines presets)
- Grid layout controls (columns/rows)

**Events:**
- `config-changed` - Fires when any property changes

### LCARdSActionEditor

**Purpose:** Action configuration component for tap/hold/double-tap.

**Props:**
- `hass` - Home Assistant instance
- `action` - Action object (e.g., `{ action: 'toggle' }`)
- `label` - Label for the action (optional)

**Features:**
- Uses HA's `ha-selector` with `ui_action` type when available
- Falls back to simple dropdown when HA components unavailable
- Supports all standard HA actions (toggle, more-info, navigate, url, call-service, none)

**Events:**
- `value-changed` - Fires when action changes

### LCARdSMonacoYamlEditor

**Purpose:** YAML editor with syntax highlighting and validation.

**Props:**
- `value` - YAML string
- `schema` - JSON Schema for validation
- `errors` - Array of validation errors
- `readOnly` - Read-only mode flag

**Features:**
- **Phase 1:** Simple textarea with monospace font
- **Future:** Full Monaco editor with IntelliSense, syntax highlighting, auto-completion

**Events:**
- `value-changed` - Fires when YAML content changes

## Utilities

### yaml-utils.js

Uses `js-yaml` package (already in project) for YAML parsing.

```javascript
import { configToYaml, yamlToConfig, validateYaml } from '../utils/yaml-utils.js';

// Convert config object to YAML string
const yaml = configToYaml(config);

// Convert YAML string to config object
const config = yamlToConfig(yamlString);

// Validate YAML syntax (returns { valid, error, lineNumber })
const result = validateYaml(yamlString);
```

### Deep Merge

The editor uses the existing `deepMerge` utility from the core config manager:

```javascript
// In LCARdSBaseEditor.js
import { deepMerge } from '../../core/config-manager/merge-helpers.js';

// Use for merging partial config updates
this.config = deepMerge(this.config, updates);
```

### Schema Validation

**Validation is handled by the singleton `CoreValidationService`**, not local utilities:

```javascript
// In LCARdSBaseEditor._validateConfigWithSingleton()
const validationService = window.lcardsCore?.validationService;
const result = validationService.validate(config, schema, {
    cardType: this.cardType,
    source: 'editor'
});

// Returns: { valid, errors, warnings, data, schema }
```

**Benefits of using singleton validation:**
- Production-grade validation with full JSON Schema support
- Entity existence checking (queries HASS)
- Professional error messages with suggestions
- Performance optimization via caching
- Consistent validation across entire application

## Schema Definition

### Schema Registration Pattern

Schemas are registered by card classes, not stored in separate files:

```javascript
// In card file (e.g., src/cards/lcards-button.js)
if (window.lcardsCore?.configManager) {
    const configManager = window.lcardsCore.configManager;
    
    configManager.registerCardSchema('button', {
        type: 'object',
        title: 'Button Card',
        description: 'Interactive button card',
        properties: {
            entity: {
                type: 'string',
                description: 'Entity ID to control'
            },
            preset: {
                type: 'string',
                enum: ['lozenge', 'bullet', 'capped'],
                description: 'Style preset'
            },
            tap_action: {
                type: 'object',
                description: 'Action on tap'
            }
        },
        required: ['type']
    });
}
```

### Editor Schema Query

Editors retrieve schemas from the singleton:

```javascript
// In LCARdSBaseEditor._getSchema()
_getSchema() {
    const configManager = window.lcardsCore?.configManager;
    
    if (!configManager) {
        console.warn('[LCARdSBaseEditor] CoreConfigManager not available');
        return {};
    }
    
    const schema = configManager.getCardSchema(this.cardType);
    
    if (!schema) {
        console.warn(`[LCARdSBaseEditor] No schema registered for card type: ${this.cardType}`);
        return {};
    }
    
    return schema;
}
```

### Supported Schema Features

- Type validation (`string`, `number`, `boolean`, `object`, `array`)
- Required properties
- Enum values (for dropdowns)
- Min/max for numbers
- Pattern matching for strings
- Nested objects
- Array validation with item schemas

## Code Splitting

Editors are bundled with the card using static imports (current webpack configuration):

```
Main bundle: lcards.js (includes all cards and editors)
  - Cards register schemas at initialization
  - Editors query schemas from singleton at runtime
  - Editor components statically imported in card files
```

Future webpack configuration could enable code splitting for smaller initial bundle size.

## Styling

### Using Shared Styles

```javascript
import { editorStyles } from '../base/editor-styles.js';

static get styles() {
    return [
        editorStyles,
        css`
            /* Additional custom styles */
        `
    ];
}
```

### CSS Custom Properties

Editors use HA's CSS custom properties for theming:

- `--card-background-color` - Background color
- `--primary-text-color` - Primary text color
- `--secondary-text-color` - Secondary text color
- `--divider-color` - Border/divider color
- `--primary-color` - Accent color
- `--error-color` - Error color
- `--warning-color` - Warning color

## Best Practices

### 1. Use Reusable Components

Don't reinvent common patterns:
```javascript
// ✅ Good
import '../components/common/lcards-card-config-section.js';

// ❌ Bad - reimplementing entity picker
<input type="text" placeholder="entity" />
```

### 2. Fire Config Changes Properly

Always use the helper method:
```javascript
// ✅ Good
this._updateConfig({ entity: newValue });

// ❌ Bad - doesn't notify HA
this.config.entity = newValue;
```

### 3. Prevent Circular Updates

Use the `source` parameter:
```javascript
// Visual tab update
this._updateConfig(updates, 'visual'); // Will sync to YAML

// YAML tab update
this._updateConfig(updates, 'yaml'); // Won't re-sync YAML
```

### 4. Validate Input

Use schema validation:
```javascript
_validateConfig() {
    const errors = validateAgainstSchema(this.config, this._getSchema());
    this._validationErrors = errors;
}
```

### 5. Provide Helpful Descriptions

Use schema descriptions:
```javascript
entity: {
    type: 'string',
    description: 'Entity ID to control (e.g., light.bedroom)'
}
```

## Testing

### Manual Testing Checklist

1. **Open Editor:**
   - Add card via UI
   - Click edit button
   - Verify editor opens

2. **Visual Tabs:**
   - Change entity → Check YAML tab updates
   - Change preset → Check YAML tab updates
   - Change actions → Check YAML tab updates

3. **YAML Tab:**
   - Edit YAML → Check visual tabs update
   - Invalid YAML → Check error message appears
   - Fix YAML → Check error clears

4. **Save:**
   - Make changes
   - Click save
   - Verify card updates
   - Refresh page
   - Verify changes persisted

### Integration Testing

Test with different card types and configurations to ensure the editor handles all scenarios correctly.

## Future Enhancements

### Phase 2: DataSource Builder
- Visual UI for datasource configuration
- Transform picker with dynamic forms
- Aggregation selector
- Preview of datasource output

### Phase 3: Rules Engine Builder
- Visual rule builder with condition tree
- All/any/not logic support
- Rule tester with state simulation
- Integration with RulesEngine singleton

### Phase 4: Monaco Integration
- Full Monaco editor with IntelliSense
- YAML syntax highlighting
- Auto-completion based on schema
- Hover documentation
- Error markers in gutter

### Phase 5: Live Preview
- Real-time card preview
- State simulation
- Theme preview
- Responsive preview (mobile/tablet/desktop)

## Troubleshooting

### Editor Not Appearing

1. Check if `getConfigElement()` is defined in card class
2. Verify editor import path is correct
3. Check browser console for errors
4. Ensure editor is registered with `customElements.define()`

### Config Not Saving

1. Verify `fireEvent('config-changed')` is called
2. Check if config object is properly formatted
3. Ensure all required properties are present
4. Check for validation errors

### YAML Sync Issues

1. Verify `_isUpdatingYaml` flag is being used correctly
2. Check `source` parameter in `_updateConfig()` calls
3. Ensure `configToYaml()` and `yamlToConfig()` are working
4. Look for circular update loops in browser console

## Contributing

When adding new editor features:

1. Follow the existing component patterns
2. Use shared styles and utilities
3. Document new components and APIs
4. Test thoroughly in Home Assistant
5. Update this documentation

## References

- [Home Assistant Card Editor Guidelines](https://developers.home-assistant.io/docs/frontend/custom-ui/custom-card/#card-editor)
- [Custom Card Helpers](https://github.com/custom-cards/custom-card-helpers)
- [LCARdS Documentation](../../doc/README.md)
