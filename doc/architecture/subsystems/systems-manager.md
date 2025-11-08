# Systems Manager

> **Central orchestrator for the LCARdS rendering pipeline**
> Manages lifecycle, coordinates subsystems, and provides unified access to all system components.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Lifecycle Management](#lifecycle-management)
4. [Subsystem Coordination](#subsystem-coordination)
5. [System Access](#system-access)
6. [Configuration](#configuration)
7. [API Reference](#api-reference)
8. [Debugging](#debugging)

---

## Overview

The **SystemsManager** is a **per-card orchestrator** that bridges individual card instances with the shared singleton systems. In the new singleton architecture, SystemsManager no longer creates local systems but instead connects cards to shared resources and manages card-specific rendering.

### New Role in Singleton Architecture

- ✅ **Singleton integration** - Connect to shared RulesEngine, DataSourceManager, etc.
- ✅ **Rule registration** - Add card's rules to shared RulesEngine singleton
- ✅ **Callback management** - Register for rule updates from shared systems
- ✅ **Card-specific rendering** - Manage card's individual AdvancedRenderer
- ✅ **Resource cleanup** - Clean up card-specific resources on disposal
- ✅ **Bridge pattern** - Translate between singleton APIs and card needs

### Singleton vs Local Systems

**Singleton Systems (Shared):**
- **RulesEngine** - Shared across all cards
- **DataSourceManager** - Single entity subscriptions for all cards
- **ThemeManager** - Consistent themes across all cards
- **AnimationManager** - Coordinated animations
- **StylePresetManager** - Shared style presets

**Card-Local Systems:**
- **AdvancedRenderer** - Card-specific overlay rendering
- **AttachmentPointManager** - Card-specific attachment calculations
- **RouterCore** - Card-specific path routing
- **TemplateProcessor** - Card-specific template evaluation

---

## Architecture

### Singleton Integration Pattern

```mermaid
graph TB
    subgraph "Shared Singleton Layer"
        LC[lcardsCore]
        RE[🧠 RulesEngine Singleton]
        DSM[📊 DataSourceManager Singleton]
        TM[🎨 ThemeManager Singleton]
        AM[🎬 AnimationManager Singleton]
    end

    subgraph "Card A Instance"
        CardA[LCARdS Card A]
        SMA[Systems Manager A]

        subgraph "Card A Local Systems"
            ARA[Advanced Renderer A]
            APMA[Attachment Point Manager A]
            RCA[Router Core A]
            TPA[Template Processor A]
        end
    end

    subgraph "Card B Instance"
        CardB[LCARdS Card B]
        SMB[Systems Manager B]

        subgraph "Card B Local Systems"
            ARB[Advanced Renderer B]
            APMB[Attachment Point Manager B]
            RCB[Router Core B]
            TPB[Template Processor B]
        end
    end

    %% Card to SystemsManager
    CardA --> SMA
    CardB --> SMB

    %% SystemsManager to Singletons (shared)
    SMA -.connects to.-> RE
    SMA -.connects to.-> DSM
    SMA -.connects to.-> TM
    SMB -.connects to.-> RE
    SMB -.connects to.-> DSM
    SMB -.connects to.-> TM

    %% SystemsManager to Local Systems (card-specific)
    SMA --> ARA
    SMA --> APMA
    SMA --> RCA
    SMA --> TPA
    SMB --> ARB
    SMB --> APMB
    SMB --> RCB
    SMB --> TPB

    %% Data flow from singletons to local systems
    DSM -.data.-> TPA
    DSM -.data.-> TPB
    RE -.rule results.-> SMA
    RE -.rule results.-> SMB
    TM -.themes.-> ARA
    TM -.themes.-> ARB

    %% Local system coordination
    TPA -.templates.-> ARA
    TPB -.templates.-> ARB
    APMA -.points.-> RCA
    APMB -.points.-> RCB

    classDef singleton fill:#b8e0c1,stroke:#266239,stroke-width:3px,color:#0c2a15
    classDef cardSystem fill:#80bb93,stroke:#083717,stroke-width:2px,color:#0c2a15
    classDef localSystem fill:#458359,stroke:#095320,stroke-width:2px,color:#f3f4f7

    class LC,RE,DSM,TM,AM singleton
    class CardA,SMA,CardB,SMB cardSystem
    class ARA,APMA,RCA,TPA,ARB,APMB,RCB,TPB localSystem
```

### Initialization Flow

```mermaid
sequenceDiagram
    participant Card as LCARdS Card
    participant SM as Systems Manager
    participant DSM as DataSource Manager
    participant TP as Template Processor
    participant RE as Rules Engine
    participant AR as Advanced Renderer

    Card->>SM: new SystemsManager(config, hass)
    SM->>SM: validateConfiguration()

    Note over SM: Phase 1: Data Systems
    SM->>DSM: new DataSourceManager()
    SM->>DSM: initialize()
    DSM-->>SM: Ready

    Note over SM: Phase 2: Processing
    SM->>TP: new TemplateProcessor()
    SM->>TP: initialize(dataSourceManager)
    TP-->>SM: Ready

    SM->>RE: new RulesEngine()
    SM->>RE: initialize(dataSourceManager)
    RE-->>SM: Ready

    Note over SM: Phase 3: Rendering
    SM->>AR: new AdvancedRenderer()
    SM->>AR: initialize(allSystems)
    AR-->>SM: Ready

    SM-->>Card: Systems Ready

    Card->>SM: start()
    SM->>DSM: start()
    SM->>AR: start()
    SM-->>Card: Running
```

---

## Lifecycle Management

### Initialization

The SystemsManager follows a strict initialization sequence:

```javascript
// 1. Construction
const systemsManager = new SystemsManager(config, hass);

// 2. Initialize all subsystems (in order)
await systemsManager.initialize();

// 3. Start active systems
await systemsManager.start();
```

**Initialization phases:**

1. **Validation** - Verify configuration is valid
2. **Data Systems** - Initialize DataSourceManager first
3. **Processing** - Initialize TemplateProcessor and RulesEngine
4. **Rendering** - Initialize AdvancedRenderer and overlay system
5. **Support Systems** - Initialize AnimationRegistry, AttachmentPointManager, RouterCore
6. **Cross-linking** - Connect subsystems with references to each other

### Update Cycle

When configuration changes:

```javascript
// Update with new configuration
await systemsManager.update(newConfig);

// SystemsManager will:
// 1. Diff configuration changes
// 2. Update affected subsystems
// 3. Maintain subscriptions where possible
// 4. Re-render affected overlays
```

### Disposal

Clean shutdown of all systems:

```javascript
// Stop and dispose all subsystems
systemsManager.dispose();

// Automatically:
// 1. Stop all active subscriptions
// 2. Clear data buffers
// 3. Remove event listeners
// 4. Release memory
// 5. Unregister from Home Assistant
```

---

## Subsystem Coordination

### Dependency Management

The SystemsManager ensures subsystems are initialized in the correct order based on dependencies:

```javascript
// Dependency tree
const dependencies = {
  dataSourceManager: [],                    // No dependencies
  templateProcessor: ['dataSourceManager'], // Needs data
  rulesEngine: ['dataSourceManager'],       // Needs data
  advancedRenderer: [                       // Needs everything
    'dataSourceManager',
    'templateProcessor',
    'rulesEngine'
  ]
};
```

### Inter-System Communication

Subsystems communicate through the SystemsManager:

```javascript
// DataSource update triggers rule evaluation
dataSourceManager.on('update', (sourceId) => {
  rulesEngine.markDirty(sourceId);
  rulesEngine.evaluate();
});

// Rule changes trigger rendering updates
rulesEngine.on('rulesChanged', () => {
  advancedRenderer.updateOverlays();
});

// Template changes trigger re-rendering
templateProcessor.on('templateChanged', (templateId) => {
  advancedRenderer.updateOverlaysUsingTemplate(templateId);
});
```

### Error Propagation

Errors in subsystems are caught and handled gracefully:

```javascript
try {
  await dataSourceManager.initialize();
} catch (error) {
  console.error('Failed to initialize DataSourceManager:', error);
  // Continue with degraded functionality
  this.dataSourceManager = null;
}
```

---

## System Access

### Accessing Subsystems

Get references to specific subsystems:

```javascript
// From card instance
const systemsManager = this.systemsManager;

// Access specific subsystems
const dataSourceManager = systemsManager.dataSourceManager;
const advancedRenderer = systemsManager.advancedRenderer;
const rulesEngine = systemsManager.rulesEngine;
```

### Global Debug Access

For debugging, systems are exposed globally:

```javascript
// Access from browser console
window.lcards.debug.msd = {
  pipelineInstance: {
    systemsManager: systemsManager
  }
};

// Access subsystems
const dsm = window.lcards.debug.msd.pipelineInstance.systemsManager.dataSourceManager;
const renderer = window.lcards.debug.msd.pipelineInstance.systemsManager.advancedRenderer;
```

### System State

Check system state:

```javascript
// Check if systems are initialized
if (systemsManager.isInitialized) {
  console.log('Systems ready');
}

// Check if systems are running
if (systemsManager.isRunning) {
  console.log('Systems active');
}

// Get system health
const health = systemsManager.getHealth();
console.log('System health:', health);
```

---

## Configuration

### Basic Configuration

Minimal configuration needed:

```yaml
# SystemsManager is created automatically by the card
# Configuration is passed to subsystems

data_sources:
  # DataSourceManager configuration
  temperature:
    type: entity
    entity: sensor.temperature

overlays:
  # AdvancedRenderer configuration
  - id: temp_display
    type: text
    source: temperature
    position: [100, 100]
```

### Advanced Configuration

Configure subsystem behavior:

```yaml
# Subsystem-specific settings
msd_config:
  # DataSource settings
  data_sources:
    buffer_size: 1000           # Default buffer size
    preload_history: true       # Load historical data
    update_throttle: 100        # Throttle updates (ms)

  # Rendering settings
  renderer:
    incremental_updates: true   # Use incremental rendering
    batch_size: 10              # Batch overlay updates

  # Rules settings
  rules:
    trace_evaluation: false     # Enable rule tracing
    cache_conditions: true      # Cache condition results

  # Performance settings
  performance:
    enable_monitoring: true     # Track performance
    log_slow_operations: true   # Log slow operations
```

---

## API Reference

### Constructor

```javascript
new SystemsManager(config, hass, options)
```

**Parameters:**
- `config` (Object) - Complete MSD configuration
- `hass` (Object) - Home Assistant connection object
- `options` (Object) - Optional settings

**Options:**
```javascript
{
  debug: false,              // Enable debug logging
  enablePerformanceMonitoring: true,
  gracefulDegradation: true  // Continue on subsystem errors
}
```

### Methods

#### `initialize()`

Initialize all subsystems in dependency order.

```javascript
await systemsManager.initialize();
```

**Returns:** Promise\<void\>

#### `start()`

Start active subsystems (DataSource subscriptions, rendering).

```javascript
await systemsManager.start();
```

**Returns:** Promise\<void\>

#### `update(newConfig)`

Update with new configuration.

```javascript
await systemsManager.update(newConfig);
```

**Parameters:**
- `newConfig` (Object) - New MSD configuration

**Returns:** Promise\<void\>

#### `dispose()`

Stop and clean up all subsystems.

```javascript
systemsManager.dispose();
```

**Returns:** void

#### `getSubsystem(name)`

Get reference to a specific subsystem.

```javascript
const dsm = systemsManager.getSubsystem('dataSourceManager');
```

**Parameters:**
- `name` (string) - Subsystem name

**Returns:** Object | null

#### `getHealth()`

Get system health information.

```javascript
const health = systemsManager.getHealth();
// {
//   initialized: true,
//   running: true,
//   subsystems: {
//     dataSourceManager: { status: 'healthy', sources: 5 },
//     advancedRenderer: { status: 'healthy', overlays: 12 },
//     ...
//   }
// }
```

**Returns:** Object

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `isInitialized` | boolean | Whether systems are initialized |
| `isRunning` | boolean | Whether systems are running |
| `config` | Object | Current configuration |
| `hass` | Object | Home Assistant connection |
| `dataSourceManager` | DataSourceManager | DataSource subsystem |
| `templateProcessor` | TemplateProcessor | Template subsystem |
| `rulesEngine` | RulesEngine | Rules subsystem |
| `advancedRenderer` | AdvancedRenderer | Renderer subsystem |
| `animationRegistry` | AnimationRegistry | Animation subsystem |

---

## Debugging

### Browser Console Access

```javascript
// Access SystemsManager
const sm = window.lcards.debug.msd.pipelineInstance.systemsManager;

// Check initialization status
console.log('Initialized:', sm.isInitialized);
console.log('Running:', sm.isRunning);

// Get subsystems
const dsm = sm.dataSourceManager;
const renderer = sm.advancedRenderer;
const rules = sm.rulesEngine;

// Check subsystem status
console.log('DataSources:', dsm.getAllSources().length);
console.log('Overlays:', renderer.getAllOverlays().length);
console.log('Rules:', rules.getAllRules().length);
```

### System Health Check

```javascript
const health = sm.getHealth();

// Check overall status
if (health.initialized && health.running) {
  console.log('✅ Systems healthy');
} else {
  console.log('❌ System issues detected');
}

// Check subsystem details
Object.entries(health.subsystems).forEach(([name, status]) => {
  console.log(`${name}: ${status.status}`);
});
```

### Performance Monitoring

```javascript
// Enable performance monitoring
sm.setOption('enablePerformanceMonitoring', true);

// Get performance metrics
const metrics = sm.getPerformanceMetrics();
console.log('Metrics:', metrics);
// {
//   initializationTime: 150,
//   updateCycles: 42,
//   averageUpdateTime: 8.5,
//   slowOperations: [...]
// }
```

### Troubleshooting

**Systems not initializing:**

```javascript
// Check for initialization errors
const initErrors = sm.getInitializationErrors();
console.log('Init errors:', initErrors);

// Try re-initializing specific subsystem
await sm.reinitializeSubsystem('dataSourceManager');
```

**Systems not updating:**

```javascript
// Check if systems are running
console.log('Running:', sm.isRunning);

// Check if subsystems are active
console.log('DataSources active:', sm.dataSourceManager?.isActive);
console.log('Renderer active:', sm.advancedRenderer?.isActive);

// Manually trigger update
await sm.forceUpdate();
```

---

## 📚 Related Documentation

### Subsystems
- **[DataSource Manager](datasource-system.md)** - Data processing hub
- **[Advanced Renderer](advanced-renderer.md)** - Overlay rendering engine
- **[Rules Engine](rules-engine.md)** - Conditional logic system
- **[Template Processor](template-processor.md)** - Template evaluation
- **[Animation Registry](animation-registry.md)** - Animation management

### Architecture
- **[Architecture Overview](../overview.md)** - System architecture
- **[Pipeline Architecture](../implementation-details/pipeline-architecture.md)** - Data pipeline

---

**Last Updated:** October 26, 2025
**Version:** 2025.10.1-fuk.42-69
