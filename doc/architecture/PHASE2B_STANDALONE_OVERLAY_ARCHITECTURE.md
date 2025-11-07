# Phase 2b: Standalone Overlay Cards Architecture

## Overview
Phase 2b creates standalone overlay card components that leverage the core systems extracted in Phase 2a. These cards are lightweight, modern, and can be used independently without the full MSD system.

## Architecture Design

### Core Principles
1. **Minimal Dependencies**: Use only core systems, no MSD dependencies
2. **Lightweight**: Small bundle size, fast rendering
3. **Modern Standards**: ES6+ modules, Web Components, Lit integration
4. **LCARS Styling**: Authentic Star Trek LCARS visual design
5. **Core Integration**: Leverage all 6 core systems for shared functionality

### Component Hierarchy

```
StandaloneOverlayCard (Base Class)
├── Core System Integration
│   ├── SystemsManager: Entity state and lifecycle
│   ├── DataSourceManager: Real-time data updates
│   ├── RulesManager: Conditional logic and automation
│   ├── ThemeManager: LCARS theme and token system
│   ├── AnimationManager: Smooth transitions and effects
│   ├── ValidationService: Config validation
│   └── StyleLibrary: Preset styles and utilities
├── Lifecycle Management
│   ├── Initialize: Core system registration
│   ├── Render: DOM generation and updates
│   ├── Update: State change handling
│   └── Destroy: Cleanup and unregistration
└── Component Library
    ├── StatusOverlay: Entity status indicators
    ├── ControlOverlay: Interactive control panels
    ├── InfoOverlay: Information displays
    └── AlertOverlay: Notification and alert systems
```

### Implementation Strategy

#### 1. Base Class: StandaloneOverlayCard
- **Purpose**: Foundation for all standalone overlay cards
- **Features**:
  - Core system integration and coordination
  - Common lifecycle methods (init, render, update, destroy)
  - HASS integration and entity state management
  - Event handling and user interaction
  - CSS class management and styling
  - Animation coordination

#### 2. Component Library
Each component type provides specific overlay functionality:

##### StatusOverlay
- Real-time entity status display
- Color-coded status indicators
- Compact, non-intrusive design
- Support for multiple entities

##### ControlOverlay
- Interactive control panels
- Touch/click interaction
- Service call integration
- Visual feedback and animations

##### InfoOverlay
- Information display panels
- Text, numeric, and graphical data
- Responsive layout adaptation
- Auto-refresh capabilities

##### AlertOverlay
- Notification and alert display
- Priority-based styling
- Auto-dismiss functionality
- Sound and visual indicators

### Technical Implementation

#### Core System Integration
```javascript
class StandaloneOverlayCard {
  constructor() {
    this.core = window.lcards?.core;
    this.cardId = `overlay-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.initialized = false;
  }

  async initialize(hass, config) {
    if (!this.core) throw new Error('LCARdS core not available');

    // Register with core systems
    this.context = this.core.systemsManager.registerCard(this.cardId, this, config);
    this.animContext = this.core.animationManager.registerCard(this.cardId);

    // Validate configuration
    const validation = this.core.validationService.validate(config, 'overlay-card');
    if (!validation.valid) throw new Error('Invalid configuration');

    this.initialized = true;
  }
}
```

#### Rendering System
- Use Lit for reactive rendering
- Leverage StyleLibrary for consistent LCARS styling
- Integrate ThemeManager for theming support
- Apply AnimationManager for smooth transitions

#### State Management
- Subscribe to entity updates via SystemsManager
- Use DataSourceManager for efficient data polling
- Apply RulesManager for conditional behavior
- Handle HASS state changes reactively

### File Structure

```
/src/cards/standalone/
├── base/
│   ├── StandaloneOverlayCard.js       # Base class
│   ├── OverlayRenderer.js             # Rendering utilities
│   └── OverlayEventHandler.js         # Event management
├── components/
│   ├── StatusOverlay.js               # Status indicators
│   ├── ControlOverlay.js              # Control panels
│   ├── InfoOverlay.js                 # Information displays
│   └── AlertOverlay.js                # Alerts and notifications
├── styles/
│   ├── overlay-base.css               # Base overlay styles
│   ├── lcars-overlay-theme.css        # LCARS-specific theming
│   └── component-styles.css           # Component-specific styles
└── index.js                           # Main export
```

### Integration Points

#### With Core Systems
- **SystemsManager**: Card registration, entity subscriptions
- **DataSourceManager**: Real-time data updates
- **RulesManager**: Conditional logic and automation rules
- **ThemeManager**: LCARS theming and token resolution
- **AnimationManager**: Smooth transitions and effects
- **ValidationService**: Configuration validation
- **StyleLibrary**: Consistent styling and presets

#### With Home Assistant
- **Lovelace Integration**: Register as custom card type
- **Entity Interaction**: Real-time state updates and service calls
- **Dashboard Integration**: Seamless integration with HA dashboards
- **Configuration UI**: YAML-based configuration with validation

### Performance Considerations

#### Bundle Size Optimization
- Tree shaking for unused code elimination
- Lazy loading for component-specific features
- Shared core system usage (no duplication)
- Minimal external dependencies

#### Runtime Performance
- Efficient DOM updates with Lit's reactive system
- Smart re-rendering based on actual state changes
- Animation performance optimization
- Memory leak prevention with proper cleanup

### Development Timeline

#### Phase 2b.1: Foundation (Current)
- Design architecture and file structure
- Create base StandaloneOverlayCard class
- Integrate with all core systems
- Implement basic rendering and lifecycle

#### Phase 2b.2: Component Library
- Implement StatusOverlay component
- Create ControlOverlay component
- Build InfoOverlay component
- Develop AlertOverlay component

#### Phase 2b.3: Integration & Testing
- Lovelace integration and registration
- Comprehensive testing suite
- Performance optimization
- Documentation and examples

## Next Steps

1. **Create Base Class**: Implement StandaloneOverlayCard foundation
2. **Core Integration**: Connect with all 6 core systems
3. **Rendering System**: Build Lit-based rendering pipeline
4. **Component Implementation**: Start with StatusOverlay as proof of concept

This architecture provides a solid foundation for modern, lightweight LCARS overlay cards that leverage our extracted core infrastructure while maintaining independence from the MSD system.