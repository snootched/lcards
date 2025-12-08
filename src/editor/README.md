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
├── cards/                   # Card-specific editors
├── components/              # Reusable editor components
│   ├── common/             # Common UI components
│   └── yaml/               # YAML editor
└── utils/                  # Utility functions
    └── yaml-utils.js       # YAML conversion (uses js-yaml)

Note: Schemas are NOT stored in editor directory.
Cards register schemas with CoreConfigManager singleton.
Validation is performed by CoreValidationService singleton.
```

## Key Components

- **LCARdSBaseEditor** - Abstract base class for all editors
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

## Architecture Patterns

- **Schema Registration**: Cards register schemas with `configManager.registerCardSchema()`
- **Schema Query**: Editors query via `configManager.getCardSchema(cardType)`
- **Validation**: Uses `validationService.validate()` for comprehensive validation
- **Static Imports**: Editor imported statically in card file (webpack compatibility)
- **Deep Merge**: Uses `core/config-manager/merge-helpers.js` (no duplication)

## Documentation

See [Visual Editor Architecture](../../doc/architecture/visual-editor-architecture.md) for detailed documentation.

## Status

### Phase 1: Foundation ✅ (Current)
- Base editor architecture
- Button card editor
- Basic components
- YAML editor (simple textarea)

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
