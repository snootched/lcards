# Architecture Overview

> **LCARdS System Architecture**
> A comprehensive overview of the LCARdS singleton-based rendering system, component relationships, and multi-card data flow.

---

## 🎯 High-Level Architecture

LCARdS is a Home Assistant custom card system built on a **singleton-based, data-driven architecture** that supports multiple card instances with shared resources.

**Core Philosophy:** Shared intelligence, distributed presentation. A set of global singleton systems (RulesEngine, ThemeManager, etc.) provide shared intelligence and data processing, while individual cards focus solely on presentation and user interaction.

The architecture consists of several key layers:

```mermaid
graph TB
    subgraph "Home Assistant Layer"
        HA[Home Assistant Core]
        HASS[hass Object]
    end

    subgraph "LCARdS Global Singleton Layer"
        LC[lcardsCore]

        subgraph "BaseService Architecture"
            BS[⭐ BaseService<br/>updateHass() + ingestHass()]
        end

        subgraph "Shared Intelligence Systems"
            RE[🧠 RulesEngine<br/>extends BaseService]
            DSM[📊 DataSourceManager<br/>extends BaseService]
            TM[🎨 ThemeManager<br/>extends BaseService]
            AM[🎬 AnimationManager<br/>extends BaseService]
            SPM[🎭 StylePresetManager<br/>extends BaseService]
            AR[🗂️ AnimationRegistry]
            VS[✅ ValidationService<br/>extends BaseService]
            SL[📚 StyleLibrary]
            CSM[⚙️ CoreSystemsManager<br/>extends BaseService]
        end
    end

    subgraph "Card Instance Layer"
        subgraph "MSD Card A"
            CardA[MSD Card Element A]
            SMA[Systems Manager A]
            RendererA[Advanced Renderer A]
            OIA[Overlay Instances A]
        end

        subgraph "MSD Card B"
            CardB[MSD Card Element B]
            SMB[Systems Manager B]
            RendererB[Advanced Renderer B]
            OIB[Overlay Instances B]
        end

        subgraph "V2 Button Card"
            CardC[V2 Button Card]
            SimpleC[Simple Renderer C]
        end
    end

    subgraph "Output Layer"
        SVGA[SVG Container A]
        DOMA[HTML Elements A]
        SVGB[SVG Container B]
        DOMB[HTML Elements B]
        DOMC[HTML Elements C]
    end

    %% BaseService inheritance hierarchy
    BS -.inherits.-> RE
    BS -.inherits.-> DSM
    BS -.inherits.-> TM
    BS -.inherits.-> AM
    BS -.inherits.-> SPM
    BS -.inherits.-> VS
    BS -.inherits.-> CSM

    %% Home Assistant to Singletons
    HA --> HASS
    HASS --> LC
    LC --> RE
    LC --> DSM
    LC --> TM

    %% Singletons serve all cards
    RE -.rule results.-> SMA
    RE -.rule results.-> SMB
    RE -.rule results.-> CardC
    DSM -.entity data.-> SMA
    DSM -.entity data.-> SMB
    TM -.themes.-> RendererA
    TM -.themes.-> RendererB
    TM -.themes.-> SimpleC
    AM -.animations.-> RendererA
    AM -.animations.-> RendererB

    %% Card instance flows
    CardA --> SMA --> RendererA --> OIA --> SVGA
    CardB --> SMB --> RendererB --> OIB --> SVGB
    CardC --> SimpleC --> DOMC
    OIA --> DOMA
    OIB --> DOMB

    %% Multi-directional rule registration
    SMA -.registers rules.-> RE
    SMB -.registers rules.-> RE
    CardC -.registers overlays.-> RE

    classDef baseservice fill:#f9ef97,stroke:#ac943b,stroke-width:3px,color:#0c2a15
    classDef singleton fill:#b8e0c1,stroke:#266239,stroke-width:2px,color:#0c2a15
    classDef card fill:#80bb93,stroke:#083717,stroke-width:2px,color:#0c2a15
    classDef v2card fill:#458359,stroke:#095320,stroke-width:2px,color:#f3f4f7

    class BS baseservice
    class RE,DSM,TM,AM,SPM,AR,VS,SL,CSM singleton
    class CardA,SMA,RendererA,CardB,SMB,RendererB card
    class CardC,SimpleC v2card
```

---

## 🏗️ Core Components

### BaseService Architecture ⭐
**Standardized inheritance pattern** for all LCARdS singleton services providing consistent lifecycle management.

**Purpose:** Ensures all singleton services have guaranteed `updateHass()` and `ingestHass()` methods, eliminating runtime type checking and providing architectural consistency.

**Core Methods:**
- **`updateHass(hass)`**: Standard lifecycle method called by core when HASS state updates
- **`ingestHass(hass)`**: Alternative API for services that prefer this pattern

**Inheritance Patterns:**

| Service | HASS Needs | Override Pattern |
|---------|------------|------------------|
| **DataSourceManager** | ✅ Critical | Overrides `updateHass()` → calls `ingestHass()` |
| **RulesEngine** | ✅ Critical | Overrides `updateHass()` → calls `ingestHass()` |
| **ThemeManager** | ❌ Theme-only | Uses inherited no-op methods |
| **AnimationManager** | ❌ Currently | Uses inherited no-op methods |
| **ValidationService** | ❌ Validation-only | Uses inherited no-op methods |
| **SystemsManager** | ❌ Coordination-only | Uses inherited no-op methods |

**Benefits:**
- ✅ **API Consistency**: All services guaranteed to have lifecycle methods
- ✅ **No Runtime Checks**: Core can safely call `updateHass()` without `typeof` checks
- ✅ **Clean Architecture**: Proper inheritance hierarchy instead of defensive programming
- ✅ **Future Flexibility**: Services can easily add HASS handling by overriding methods

### Singleton Layer (lcardsCore)
**Global shared intelligence systems** that serve all card instances on a page.

#### 1. RulesEngine Singleton 🧠
**Centralized rule evaluation system** that processes rules from all cards and distributes results.

**BaseService Integration:** Extends BaseService, overrides `updateHass()` → `ingestHass()` for HASS data processing.

**Responsibilities:**
- Collect rules from all MSD and V2 card instances
- Monitor Home Assistant entity state changes
- Evaluate rule conditions across all registered rules
- Distribute rule results to all registered card callbacks
- Maintain rule dependency tracking and performance optimization

**Multi-Card Features:**
- Multiple callback registration (one per card instance)
- Cross-card rule targeting (rules can affect overlays on any card)
- Shared entity monitoring (single HASS subscription for all cards)

#### 2. DataSource Manager Singleton 📊
**Shared data processing hub** that serves all card instances.

**BaseService Integration:** Extends BaseService, overrides `updateHass()` → `ingestHass()` for entity data processing and subscriptions.

**Responsibilities:**
- Single Home Assistant entity subscription for all cards
- Maintain shared time-windowed data buffers
- Apply transformation pipelines (unit conversion, scaling, smoothing)
- Calculate aggregations (averages, rates, trends)
- Generate computed values from expressions
- Provide processed data to all card instances

**Multi-Card Benefits:**
- Eliminates duplicate entity subscriptions
- Shared data caching and processing
- Consistent data across all cards

#### 3. ThemeManager Singleton 🎨
**Shared theme system** providing consistent styling across all cards.

**BaseService Integration:** Extends BaseService, uses inherited no-op lifecycle methods (theme-only, doesn't need HASS data).

**Responsibilities:**
- Load and manage theme packs from all cards
- Resolve CSS variables and theme properties
- Provide theme-aware color schemes
- Handle theme switching and updates
- Maintain theme caching for performance

#### 4. AnimationManager Singleton 🎬
**Centralized animation coordination** for all card animations.

**BaseService Integration:** Extends BaseService, uses inherited no-op lifecycle methods (could override for entity-driven animations in future).

**Responsibilities:**
- Manage animation sequences across all cards
- Coordinate cross-card animation synchronization
- Handle animation conflicts and priorities
- Provide animation presets and utilities

#### 5. StylePresetManager Singleton 🎭
**Shared style preset system** for consistent component styling.

**Responsibilities:**
- Load and manage style presets from all cards
- Resolve style inheritance and overrides
- Provide preset-based styling for overlays

#### 6. Other Singletons
- **AnimationRegistry** 🗂️: Shared animation definitions
- **ValidationService** ✅: Schema validation for all configurations *(extends BaseService, uses no-op lifecycle)*
- **StyleLibrary** 📚: Shared style utilities and helpers
- **CoreSystemsManager** ⚙️: Singleton lifecycle management *(extends BaseService, uses no-op lifecycle)*
- 50+ predefined transformations
- Statistical aggregation engines
- Memory-efficient circular buffers
- Performance optimization (coalescing, throttling)

**Key Files:**
- `src/msd/datasource/DataSourceManager.js`
- `src/msd/datasource/DataSourceMixin.js`
- `src/msd/datasource/processors/`
- `src/msd/datasource/aggregations/`

**See:** [DataSource System Architecture](subsystems/datasource-system.md)

### Card Instance Layer

#### 1. Systems Manager (Per-Card)
**Card-specific orchestration hub** that connects individual cards to shared singletons.

**Responsibilities:**
- Register card's rules with shared RulesEngine singleton
- Connect to shared DataSourceManager for entity data
- Initialize card-specific rendering pipeline
- Handle card lifecycle (connect, update, disconnect)
- Coordinate card-specific overlays and rendering
- Bridge between singleton systems and card presentation

**Key Changes in Singleton Architecture:**
- No longer creates local systems (uses shared singletons)
- Registers callbacks with shared RulesEngine for rule updates
- Manages card-specific rule cleanup on destruction

**Key Files:**
- `src/msd/pipeline/SystemsManager.js`

### 2. Advanced Renderer
**Main rendering engine** that processes overlays and produces SVG/HTML output.

**Responsibilities:**
- Parse and validate configuration
- Render overlays in correct order
- Manage overlay instances (reuse vs. recreate)
- Compute attachment points
- Build virtual anchors for overlay-to-overlay connections
- Handle font stabilization
- Process rules engine conditions
- Manage incremental vs. full rendering

**Key Files:**
- `src/msd/renderer/AdvancedRenderer.js`

**See:** [Advanced Renderer Documentation](components/advanced-renderer.md)

### 4. Template Processor
**Dynamic content resolution** using datasource values and entity states.

**Responsibilities:**
- Parse template syntax (e.g., `{datasource.value}`, `{entity.state}`)
- Resolve datasource values with dot notation
- Substitute entity attributes
- Handle nested templates
- Provide formatted output

**Template Syntax:**
- `{datasource_name.value}` - Datasource current value
- `{datasource_name.aggregates.key}` - Aggregation results
- `{datasource_name.transformations.key}` - Transformation results
- `{entity.state}` - Entity state value
- `{entity.attributes.name}` - Entity attributes

**See:** [Template Processor Documentation](subsystems/template-processor.md)

### 5. Rules Engine
**Conditional rendering** based on datasource values and entity states.

**Responsibilities:**
- Evaluate condition expressions
- Support complex logic (AND/OR/NOT)
- Query datasource values
- Apply conditional properties
- Filter overlays based on rules

**Integration:**
- Datasource dot-notation access
- Entity state comparisons
- Threshold detection
- Range checking

**See:** [Rules Engine Documentation](subsystems/rules-engine.md)

### 6. Overlay System
**Modular overlay architecture** where each overlay type has its own renderer.

**Overlay Types:**
- **Text**: Dynamic text rendering with font stabilization
- **Button**: Interactive buttons with LCARS presets
- **Line**: Connection lines with routing and gaps
- **Status Grid**: Multi-cell grids with individual cell control
- **ApexCharts**: Chart integration with dynamic data

**Key Pattern:**
Each overlay has:
- Instance class (e.g., `TextOverlay`)
- `render()` method that returns SVG/HTML markup
- `update()` method for incremental updates
- `computeAttachmentPoints()` for connection system

**See:** [Overlay System Documentation](components/overlay-system.md)

### 7. Attachment Point Manager
**Connection system** that manages attachment points for overlay-to-overlay connections.

**Responsibilities:**
- Store attachment points (center, top, bottom, left, right, corners)
- Provide attachment point lookup for lines
- Manage virtual anchors (e.g., `button1.top`, `text1.left`)
- Handle gap-adjusted anchors

**Key Concepts:**
- **Attachment Points**: Named coordinates on an overlay's bbox
- **Virtual Anchors**: Dynamic anchors like `overlayId.side`
- **Gap System**: `anchor_gap` and `attach_gap` for offset control

**See:** [Attachment Point Manager Documentation](components/attachment-point-manager.md)

### 8. Router Core
**Line routing system** that computes paths between points.

**Responsibilities:**
- Compute orthogonal routes (horizontal/vertical segments)
- Avoid obstacles
- Cache computed routes
- Support route invalidation and recomputation

**Routing Modes:**
- `auto`: Automatic orthogonal routing with obstacle avoidance
- `direct`: Straight line between points
- Manual: Explicit waypoints

**See:** [Router Core Documentation](components/router-core.md)

---

## 🔄 Rendering Pipeline

```mermaid
sequenceDiagram
    participant Card
    participant SM as Systems Manager
    participant AR as Advanced Renderer
    participant OI as Overlay Instance
    participant APM as Attachment Point Manager
    participant SVG as SVG Container

    Card->>SM: update(config, hass)
    SM->>AR: render(overlays, anchors)

    loop For each overlay
        AR->>AR: Parse & validate config
        AR->>AR: Process rules engine
        AR->>AR: Apply templates

        alt Overlay exists (incremental)
            AR->>OI: update(newConfig, oldConfig)
            OI->>OI: Compute diff
            OI->>OI: Update only changed parts
            OI-->>AR: Updated markup
        else New overlay (full render)
            AR->>OI: new OverlayClass(config)
            OI->>OI: render()
            OI-->>AR: Full markup
        end

        AR->>OI: computeAttachmentPoints()
        OI-->>AR: {bbox, points}
        AR->>APM: setAttachmentPoints(overlayId, points)

        AR->>AR: Build virtual anchors (with gaps)
    end

    AR->>AR: Render lines (after all overlays)
    AR->>AR: Apply font stabilization
    AR-->>SM: Combined markup
    SM->>SVG: Inject into DOM

    Note over AR,APM: Lines use attachment points<br/>from APM for connections
```

---

## 🔀 Data Flow Pipeline

**LCARdS is fundamentally data-driven.** Understanding the data flow is key to understanding the system.

```mermaid
flowchart TB
    subgraph "1. Data Acquisition"
        HA[Home Assistant Entities]
        Sub[Entity Subscriptions]
        Hist[Historical Preload]
    end

    subgraph "2. Data Processing"
        Buffer[Time-Windowed Buffer]
        Trans[Transformations]
        Agg[Aggregations]
        Compute[Computed Sources]
    end

    subgraph "3. Data Access"
        DSM[DataSource Manager]
        TP[Template Processor]
        RE[Rules Engine]
    end

    subgraph "4. Presentation"
        AR[Advanced Renderer]
        Overlays[Overlay Instances]
        SVG[Visual Output]
    end

    HA --> Sub
    HA --> Hist
    Sub --> Buffer
    Hist --> Buffer
    Buffer --> Trans
    Trans --> Agg
    Agg --> Compute
    Compute --> DSM
    DSM --> TP
    DSM --> RE
    TP --> AR
    RE --> AR
    AR --> Overlays
    Overlays --> SVG
```

**Data Flow Steps:**

1. **Acquisition**: Entity states flow from Home Assistant
2. **Processing**: Transformations and aggregations applied
3. **Access**: Templates and rules query processed data
4. **Presentation**: Overlays rendered with dynamic content

**See:** [DataSource System Architecture](subsystems/datasource-system.md) for detailed data flow

---

## 🔀 Data Flow (Legacy Section)

```mermaid
flowchart LR
    subgraph Input
        YAML[YAML Config]
        Entities[HA Entities]
    end

    subgraph Processing
        Parser[Config Parser]
        TP[Template Processor]
        RE[Rules Engine]
    end

    subgraph Rendering
        AR[Advanced Renderer]
        OI[Overlay Instances]
    end

    subgraph Output
        SVG[SVG Markup]
        DOM[DOM Elements]
    end

    YAML --> Parser
    Entities --> TP
    Parser --> TP
    TP --> RE
    RE --> AR
    AR --> OI
    OI --> SVG
    OI --> DOM
```

**Data Flow Steps:**

1. **Configuration Parsing**
   - YAML config parsed into JavaScript objects
   - Schema validation
   - Defaults applied

2. **Template Processing**
   - Entity values extracted from `hass` object
   - Templates evaluated (e.g., `{entity.state}`)
   - Dynamic content substituted

3. **Rules Engine**
   - Conditions evaluated
   - Conditional properties applied
   - Overlays filtered based on rules

4. **Rendering**
   - Overlays rendered in order
   - Attachment points computed
   - Virtual anchors created

5. **Output Generation**
   - SVG markup for visual elements
   - HTML for interactive elements (grids, charts)
   - Combined into final output

---

## 🔧 Key Subsystems

### DataSource System
**Problem:** Need real-time, processed data from Home Assistant with transformations and aggregations.

**Solution:** Comprehensive data processing pipeline with subscriptions, buffers, transformations, and aggregations.

**See:** [DataSource System Documentation](subsystems/datasource-system.md)

### Font Stabilization
**Problem:** During font loading, text bounding boxes are temporarily invalid (width=0, height=0), causing lines to jump to incorrect positions.

**Solution:** Multi-pass stabilization with bbox validation.

**See:** [Font Stabilization Documentation](subsystems/font-stabilization.md)

### Incremental Updates
**Problem:** Full re-render on every state change is expensive.

**Solution:** Diff-based updates that only modify changed properties.

**Supported:**
- Text content and style changes
- Button content and style changes
- Status grid cell updates
- ApexCharts data updates

**See:** [Incremental Updates Documentation](components/incremental-updates.md)

### Rules Engine
**Purpose:** Conditional rendering based on entity states.

**Features:**
- Show/hide overlays based on conditions
- Apply conditional styles
- Support complex conditions (AND/OR/NOT)

**See:** [Rules Engine Documentation](subsystems/rules-engine.md)

### Template Processor
**Purpose:** Dynamic content using entity data.

**Syntax:**
- `{entity.state}` - Entity state value
- `{entity.attributes.friendly_name}` - Entity attributes
- `{entity.last_changed}` - Timestamp data

**See:** [Template Processor Documentation](subsystems/template-processor.md)

---

## 📊 Component Relationships

```mermaid
graph TB
    SM[Systems Manager]
    AR[Advanced Renderer]
    APM[Attachment Point Manager]
    RC[Router Core]
    TP[Template Processor]
    RE[Rules Engine]

    TO[Text Overlay]
    BO[Button Overlay]
    LO[Line Overlay]
    SG[Status Grid]
    AC[ApexCharts]

    SM -->|orchestrates| AR
    SM -->|provides| APM
    SM -->|provides| RC
    AR -->|uses| APM
    AR -->|uses| RC
    AR -->|uses| TP
    AR -->|uses| RE

    AR -->|creates| TO
    AR -->|creates| BO
    AR -->|creates| LO
    AR -->|creates| SG
    AR -->|creates| AC

    LO -->|queries| APM
    LO -->|uses| RC

    TO -->|registers points| APM
    BO -->|registers points| APM
    SG -->|registers points| APM
```

---

## 🎨 Rendering Strategies

### Full Render
Used when:
- Initial card load
- Configuration changes
- Overlay structure changes

**Process:**
1. Parse full configuration
2. Create all overlay instances
3. Render all overlays
4. Compute all attachment points
5. Build all virtual anchors
6. Font stabilization passes

### Incremental Update
Used when:
- Entity state changes
- Minimal configuration updates

**Process:**
1. Identify changed overlays
2. Call `update()` on affected instances
3. Update only changed attachment points
4. Recompute affected lines
5. Skip font stabilization if bbox unchanged

---

## � Multi-Card Architecture

### Singleton-Based Multi-Instance Support

The LCARdS system now supports **multiple card instances** on a single page through a singleton-based architecture.

#### Architecture Benefits

**Previous Architecture Problems:**
- ❌ Each MSD card created duplicate systems (RulesEngine, DataSourceManager, etc.)
- ❌ Multiple HASS subscriptions for the same entities
- ❌ No cross-card rule coordination
- ❌ Resource waste and potential conflicts

**New Singleton Architecture Solutions:**
- ✅ **Single shared systems** serve all cards
- ✅ **Single HASS subscription** per entity across all cards
- ✅ **Cross-card rule targeting** - rules can affect overlays on any card
- ✅ **Resource efficiency** - shared caching and processing
- ✅ **Coordinated updates** - all cards receive rule results simultaneously

#### Multi-Card Rule Flow

```mermaid
sequenceDiagram
    participant HASS as Home Assistant
    participant RE as RulesEngine Singleton
    participant CardA as MSD Card A
    participant CardB as MSD Card B
    participant CardC as V2 Button Card

    Note over CardA,CardC: Card Initialization
    CardA->>RE: Register rules & callback
    CardB->>RE: Register rules & callback
    CardC->>RE: Register overlay targets

    Note over HASS,CardC: Entity State Change
    HASS->>RE: Entity light.tv = "on"
    RE->>RE: Evaluate ALL rules from all cards

    Note over RE: Rule Results Distribution
    RE->>CardA: callback() with rule results
    RE->>CardB: callback() with rule results
    RE->>CardC: callback() with rule results

    Note over CardA,CardC: Individual Card Updates
    CardA->>CardA: Apply relevant overlays
    CardB->>CardB: Apply relevant overlays
    CardC->>CardC: Apply button styles
```

#### Cross-Card Rule Targeting

Rules from one card can target overlays on other cards:

**Card A Rule:**
```yaml
rules:
  - id: emergency_alert
    when: { entity: alarm.fire, state: "on" }
    apply:
      overlays:
        # Target specific overlay on any card
        "emergency_button": { style: { color: red } }

        # Target by tag across ALL cards
        "*[tag~='emergency']": { style: { border: { color: red } } }
```

**Result:** All cards with `emergency_button` overlay or `emergency` tag get styled.

### V2 Card Architecture

#### Lightweight Cards Using Singletons

The singleton architecture enables a new category of **V2 Cards** - lightweight, purpose-built cards that leverage shared systems:

**V2 Card Characteristics:**
- ✅ **Singleton-aware**: Direct access to shared RulesEngine, ThemeManager, etc.
- ✅ **Lightweight**: No routing, no local systems, minimal complexity
- ✅ **Rules-responsive**: Register overlays that respond to global rules
- ✅ **Theme-consistent**: Automatic theme inheritance from shared ThemeManager
- ✅ **Animation-ready**: Access to shared AnimationManager

**Comparison:**

| Feature | MSD Card | V2 Card |
|---------|----------|---------|
| Complexity | High - Full pipeline | Low - Simple renderer |
| Systems | Local + Shared | Shared only |
| Configuration | Full MSD schema | Minimal schema |
| Routing | Yes | No |
| Use Case | Complex displays | Single-purpose components |

#### V2 Card Foundation Class

```javascript
class LCARdSV2Card extends LitElement {
  constructor() {
    super();
    // Direct singleton access
    this.rulesEngine = lcardsCore.rulesManager;
    this.themeManager = lcardsCore.themeManager;

    // Register for rule updates
    this.rulesEngine.setReEvaluationCallback(() => {
      this.handleRuleUpdate();
    });
  }

  handleRuleUpdate() {
    // Lightweight rule processing
    const results = this.rulesEngine.evaluateDirty(this.hass);
    this.applyRuleResults(results);
  }
}
```

---

## �🔑 Key Design Patterns

### 1. Instance-Based Rendering
Overlay instances persist between updates for efficient incremental updates.

### 2. Attachment Point System
Standardized connection points allow flexible overlay-to-overlay connections.

### 3. Virtual Anchors
Dynamic anchors (e.g., `button1.left`) created on-the-fly with gap offsets.

### 4. Two-Phase Rendering
- **Phase 1**: Render overlays, compute attachment points
- **Phase 2**: Render lines using computed attachment points

### 5. Multi-Pass Stabilization
Font loading handled through multiple validation passes with bbox checking.

---

## 📚 Further Reading

- [Advanced Renderer Details](components/advanced-renderer.md)
- [Overlay System Architecture](components/overlay-system.md)
- [Attachment Point System](components/attachment-point-manager.md)
- [Incremental Updates](components/incremental-updates.md)
- [Rendering Pipeline Diagram](diagrams/rendering-pipeline.md)
- [Overlay Lifecycle Diagram](diagrams/overlay-lifecycle.md)

---

**Last Updated:** November 8, 2025
**Version:** 2025.11.1-singleton-architecture
