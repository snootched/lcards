# MSD System Flow & Singleton Architecture

> **Complete data flow from configuration to rendering with singleton intelligence layer**
> A detailed guide to how LCARdS initializes shared systems, processes configuration, and coordinates multi-card rendering.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Complete Pipeline Flow](#complete-pipeline-flow)
3. [Initialization Sequence](#initialization-sequence)
4. [Configuration Processing](#configuration-processing)
5. [Pack System](#pack-system)
6. [Model Building](#model-building)
7. [Systems Initialization](#systems-initialization)
8. [DataSource Lifecycle](#datasource-lifecycle)
9. [Rendering Pipeline](#rendering-pipeline)
10. [Runtime Updates](#runtime-updates)
11. [Template Processing](#template-processing)
12. [Rules Engine Evaluation](#rules-engine-evaluation)
13. [Line Routing](#line-routing)
14. [Debug & Introspection](#debug--introspection)

---

## Overview

The MSD (Master Systems Display) system follows a **singleton architecture** with global intelligence systems shared across multiple cards and lightweight per-card rendering pipelines.

### Singleton Architecture Flow

```mermaid
graph TB
    subgraph "Singleton Layer (Global)"
        LC[lcardsCore Initializer]
        RE[🧠 RulesEngine Singleton]
        DSM[📊 DataSourceManager Singleton]
        TM[🎨 ThemeManager Singleton]
        AM[🎬 AnimationManager Singleton]
        VS[✅ ValidationService Singleton]
    end

    subgraph "Card A Pipeline"
        ConfigA[Card A Config] --> ProcessA[Config Processing]
        ProcessA --> PacksA[Pack Merge]
        PacksA --> ModelA[Model Building]
        ModelA --> SysA[Systems Manager A]
        SysA --> RenderA[Renderer A]
        RenderA --> DisplayA[SVG Display A]
    end

    subgraph "Card B Pipeline"
        ConfigB[Card B Config] --> ProcessB[Config Processing]
        ProcessB --> PacksB[Pack Merge]
        PacksB --> ModelB[Model Building]
        ModelB --> SysB[Systems Manager B]
        SysB --> RenderB[Renderer B]
        RenderB --> DisplayB[SVG Display B]
    end

    %% Singleton initialization
    ConfigA --> LC
    ConfigB --> LC
    LC --> RE
    LC --> DSM
    LC --> TM
    LC --> AM
    LC --> VS

    %% Singleton to card distribution
    RE -.rule updates.-> SysA
    RE -.rule updates.-> SysB
    DSM -.entity data.-> SysA
    DSM -.entity data.-> SysB
    TM -.themes.-> RenderA
    TM -.themes.-> RenderB
    AM -.animations.-> RenderA
    AM -.animations.-> RenderB

    %% Card registration with singletons
    SysA -.register rules.-> RE
    SysB -.register rules.-> RE

    %% Runtime updates
    DisplayA -.->|Updates| RuntimeA[Runtime Updates A]
    DisplayB -.->|Updates| RuntimeB[Runtime Updates B]
    RuntimeA -.->|Re-render| RenderA
    RuntimeB -.->|Re-render| RenderB

    DSM -.->|Shared Updates| RuntimeA
    DSM -.->|Shared Updates| RuntimeB

    classDef singleton fill:#b8e0c1,stroke:#266239,stroke-width:3px,color:#0c2a15
    classDef cardA fill:#80bb93,stroke:#083717,stroke-width:2px,color:#0c2a15
    classDef cardB fill:#458359,stroke:#095320,stroke-width:2px,color:#f3f4f7

    class LC,RE,DSM,TM,AM,VS singleton
    class ConfigA,ProcessA,PacksA,ModelA,SysA,RenderA,DisplayA,RuntimeA cardA
    class ConfigB,ProcessB,PacksB,ModelB,SysB,RenderB,DisplayB,RuntimeB cardB
```

**Key Characteristics:**
- 🌐 **Singleton Intelligence** - Shared systems across all cards (RulesEngine, DataSourceManager, ThemeManager, AnimationManager)
- 🎯 **Multi-Card Support** - Multiple MSD cards can coexist with shared rule evaluation
- 🔄 **Event-driven** - Responds to HA entity changes through singleton distribution
- 📦 **Modular** - Clear separation between global intelligence and per-card rendering
- ⚡ **Efficient** - Shared processing, incremental updates, coordinated cross-card updates
- 🎯 **Declarative** - Configuration-first approach with singleton-aware targeting
- 🔍 **Debuggable** - Comprehensive introspection tools with singleton state visibility

---

## Complete Pipeline Flow

### End-to-End Singleton System Flow

```mermaid
sequenceDiagram
    participant UserA as Card A Config
    participant UserB as Card B Config
    participant Core as lcardsCore
    participant DSM as DataSourceManager (Singleton)
    participant RE as RulesEngine (Singleton)
    participant TM as ThemeManager (Singleton)
    participant AM as AnimationManager (Singleton)
    participant SysA as SystemsManager A
    participant SysB as SystemsManager B
    participant RendA as AdvancedRenderer A
    participant RendB as AdvancedRenderer B
    participant SVGA as SVG Output A
    participant SVGB as SVG Output B

    %% First card initialization
    UserA->>Core: initMsdPipeline(configA, mountElA, hass)
    Core->>Core: Initialize singletons (first time)
    Core->>DSM: Initialize DataSourceManager singleton
    Core->>RE: Initialize RulesEngine singleton
    Core->>TM: Initialize ThemeManager singleton
    Core->>AM: Initialize AnimationManager singleton

    Core->>SysA: initializeSystems(configA)
    SysA->>DSM: Register card A datasources
    SysA->>RE: Register card A rules
    SysA->>RendA: Initialize renderer A

    %% Second card initialization
    UserB->>Core: initMsdPipeline(configB, mountElB, hass)
    Core->>Core: Singletons already exist - reuse

    Core->>SysB: initializeSystems(configB)
    SysB->>DSM: Register card B datasources
    SysB->>RE: Register card B rules (callback array)
    SysB->>RendB: Initialize renderer B

    %% Shared processing with distribution
    DSM->>DSM: Entity state changed
    DSM->>SysA: Distribute updates to card A
    DSM->>SysB: Distribute updates to card B

    SysA->>RE: Request rule evaluation for card A
    SysB->>RE: Request rule evaluation for card B

    RE->>RE: Evaluate all rules once
    RE->>SysA: Send card A rule results
    RE->>SysB: Send card B rule results

    SysA->>RendA: Apply updates to renderer A
    SysB->>RendB: Apply updates to renderer B

    RendA->>SVGA: Update SVG A
    RendB->>SVGB: Update SVG B

    loop Multi-Card Runtime Updates
        DSM->>DSM: Shared entity change
        DSM->>SysA: Notify card A
        DSM->>SysB: Notify card B

        Note over RE: Single rule evaluation<br/>serves both cards
        RE->>SysA: Card A results
        RE->>SysB: Card B results

        par Card A Updates
            SysA->>RendA: Incremental update A
            RendA->>SVGA: Update elements A
        and Card B Updates
            SysB->>RendB: Incremental update B
            RendB->>SVGB: Update elements B
        end
    end
```

**Singleton Flow Summary:**
1. **Singleton Initialization** - lcardsCore creates shared intelligence systems (first card only)
2. **Card Registration** - Each card registers its datasources and rules with singletons
3. **Configuration Processing** - Per-card config validation and pack merging
4. **Model Building** - Each card builds its internal representation
5. **Systems Coordination** - SystemsManager connects cards to singletons
6. **Shared Processing** - Singletons process data once, distribute to all cards
7. **Distributed Rendering** - Each card renders independently with shared intelligence
8. **Coordinated Runtime** - Entity changes trigger singleton evaluation, distributed updates


---

## Initialization Sequence

### Singleton Architecture Initialization

```mermaid
graph TD
    Start[Card Load] --> Entry[index.js Entry Point]
    Entry --> Core[lcardsCore.initMsdPipeline]

    Core --> FirstCard{First card<br/>in browser?}

    FirstCard -->|Yes| InitSingletons[Initialize Singletons]
    InitSingletons --> DSM[📊 DataSourceManager Singleton]
    InitSingletons --> RE[🧠 RulesEngine Singleton]
    InitSingletons --> TM[🎨 ThemeManager Singleton]
    InitSingletons --> VS[✅ ValidationService Singleton]

    FirstCard -->|No| ReuseSingletons[Reuse Existing Singletons]
    ReuseSingletons --> CardSetup
    DSM --> CardSetup[Card-Specific Setup]

    CardSetup --> Config[Process Card Configuration]
    Config --> Valid{Valid<br/>config?}
    Valid -->|No| Error[Throw Error<br/>with details]
    Valid -->|Yes| Packs[Load & Merge Packs]

    Packs --> Model[Build Card Model]
    Model --> Systems[Initialize Systems Manager]

    Systems --> RegisterDS[Register with DataSourceManager]
    Systems --> RegisterRE[Register with RulesEngine]
    Systems --> LocalSystems[Initialize Local Systems]

    LocalSystems --> Template[TemplateProcessor]
    LocalSystems --> Router[RouterCore]
    LocalSystems --> Renderer[AdvancedRenderer]

    Systems --> RegisterAM[Register with AnimationManager]

    Renderer --> Initial[Initial Render]
    Initial --> Display[Display SVG]
    Display --> Ready[✅ Card Ready]

    Ready --> Runtime[Enter Coordinated Runtime]

    style Start fill:#37a6d1,stroke:#2a7193,color:#f3f4f7
    style Error fill:#d91604,stroke:#ef1d10,color:#f3f4f7
    style Ready fill:#266239,stroke:#083717,color:#f3f4f7
    style Runtime fill:#f9ef97,stroke:#ac943b,color:#0c2a15
    style DSM,RE,TM,AM,VS fill:#b8e0c1,stroke:#266239,stroke-width:3px
```

**Singleton Initialization Steps:**
1. **Entry Point** - `index.js` exports `initMsdPipeline`, calls `lcardsCore`
2. **Singleton Check** - First card creates global singletons, subsequent cards reuse
3. **Singleton Creation** - DataSourceManager, RulesEngine, ThemeManager, AnimationManager, ValidationService
4. **Card Registration** - Register datasources and rules with appropriate singletons
5. **Config Processing** - Per-card validation and pack merging
6. **Local Systems** - Initialize card-specific systems (TemplateProcessor, Renderer)
7. **Initial Render** - Generate first SVG output with singleton intelligence
8. **Coordinated Runtime** - Enter multi-card event-driven mode with shared processing

---

## Configuration Processing

### Config Validation & Normalization

```mermaid
graph TD
    Raw[Raw User Config] --> Validator[Configuration Validator]

    Validator --> Schema{Schema<br/>valid?}
    Schema -->|No| Issues[Collect Issues]
    Schema -->|Yes| Normalize[Normalize Values]

    Issues --> Severity{Critical?}
    Severity -->|Yes| Throw[Throw Error]
    Severity -->|No| Warn[Log Warnings]

    Normalize --> Defaults[Apply Defaults]
    Defaults --> Expand[Expand Shorthand]
    Expand --> Resolved[Resolved Config]

    Warn --> Resolved
    Resolved --> Provenance[Track Provenance]
    Provenance --> Output[{mergedConfig, issues, provenance}]

    style Raw fill:#37a6d1,stroke:#2a7193,color:#f3f4f7
    style Throw fill:#d91604,stroke:#ef1d10,color:#f3f4f7
    style Warn fill:#f9ef97,stroke:#ac943b,color:#0c2a15
    style Output fill:#266239,stroke:#083717,color:#f3f4f7
```

**Configuration Stages:**
1. **Schema Validation** - Check against JSON schema
2. **Normalization** - Convert shorthand to full format
3. **Default Application** - Fill in missing values
4. **Issue Collection** - Track warnings and errors
5. **Provenance Tracking** - Record where each value came from

**Validation Features:**
- Required field checking
- Type validation
- Range validation
- Dependency validation
- Custom validators per overlay type

---

## Pack System

### Pack Loading & Merging

```mermaid
graph TD
    Start[Pack Loading] --> Builtin[Load Builtin Packs]

    Builtin --> Themes[builtin_themes]
    Builtin --> Core[core pack]
    Builtin --> Buttons[cb_lcars_buttons]

    Start --> External[Load External Packs]
    External --> User[User-defined packs]

    Themes --> Merge[Pack Merger]
    Core --> Merge
    Buttons --> Merge
    User --> Merge

    Merge --> Priority[Apply Priority Rules]
    Priority --> Themes2[Theme Selection]
    Themes2 --> Active[Set Active Theme]

    Active --> Presets[Register Style Presets]
    Presets --> Components[Register Component Defaults]
    Components --> Output[Merged Configuration]

    style Builtin fill:#37a6d1,stroke:#2a7193,color:#f3f4f7
    style External fill:#f9ef97,stroke:#ac943b,color:#0c2a15
    style Output fill:#266239,stroke:#083717,color:#f3f4f7
```

**Pack Types:**
- **builtin_themes** - Theme definitions (always loaded)
- **core** - Core overlays and defaults
- **cb_lcars_buttons** - LCARS button presets
- **external** - User-provided packs from URLs

**Merge Priority:**
1. Builtin packs (lowest priority)
2. External packs
3. User configuration (highest priority)

**What Packs Provide:**
- Theme tokens and component defaults
- Style presets (e.g., LCARS button styles)
- Reusable overlay templates
- Animation definitions

---

## Model Building

### Card Model Construction

```mermaid
graph TD
    Config[Merged Configuration] --> Builder[Model Builder]

    Builder --> Parse[Parse Overlays]
    Parse --> Overlays[Overlay Array]

    Overlays --> Text[Text Overlays]
    Overlays --> Button[Button Overlays]
    Overlays --> Line[Line Overlays]
    Overlays --> Grid[Status Grid Overlays]
    Overlays --> Chart[ApexChart Overlays]

    Text --> Validate[Validate Each]
    Button --> Validate
    Line --> Validate
    Grid --> Validate
    Chart --> Validate

    Validate --> Dependencies[Build Dependency Graph]
    Dependencies --> Lines[Line Attachment Resolution]
    Lines --> Model[CardModel Instance]

    Model --> Methods[Model Methods]
    Methods --> Compute[computeResolvedModel]
    Methods --> Get[getOverlayById]
    Methods --> Update[updateOverlay]

    style Config fill:#37a6d1,stroke:#2a7193,color:#f3f4f7
    style Model fill:#266239,stroke:#083717,color:#f3f4f7
```

**Model Building Process:**
1. **Parse Overlays** - Convert config to overlay objects
2. **Type Validation** - Ensure each overlay has valid type
3. **Dependency Analysis** - Build graph of overlay relationships
4. **Line Resolution** - Resolve line attachment points
5. **Model Creation** - Instantiate CardModel with all overlays

**CardModel Features:**
- Stores all overlay definitions
- Tracks overlay dependencies (e.g., lines attached to overlays)
- Provides query methods (getOverlayById, getOverlaysByType)
- Caches resolved model for performance
- Supports incremental updates


---

## Systems Initialization

### Singleton + SystemsManager Coordination

```mermaid
graph TD
    subgraph "Singleton Layer (Global - First Card Only)"
        LC[lcardsCore] --> DSM[📊 DataSourceManager Singleton]
        LC --> RE[🧠 RulesEngine Singleton]
        LC --> TM[🎨 ThemeManager Singleton]
        LC --> AM[🎬 AnimationManager Singleton]
        LC --> VS[✅ ValidationService Singleton]

        DSM --> Entities[Subscribe to HA Entities]
        DSM --> History[Preload History]
        DSM --> Buffer[Initialize Entity Buffers]

        RE --> RuleStore[Initialize Rule Store]
        RE --> Callbacks[Setup Callback Arrays]

        TM --> Tokens[Load Theme Tokens]
        TM --> Defaults[Component Defaults]

        AM --> Registry[Initialize Animation Registry]
        AM --> Triggers[Setup Animation Triggers]
    end

    subgraph "Card Layer (Per Card)"
        Manager[SystemsManager] --> RegisterDS[Register DataSources with Singleton]
        Manager --> RegisterRE[Register Rules with Singleton]
        Manager --> RegisterAM[Register Animations with Singleton]
        Manager --> LocalInit[Initialize Local Systems]

        RegisterDS --> DSM
        RegisterRE --> RE
        RegisterAM --> AM

        LocalInit --> Template[TemplateProcessor]
        LocalInit --> Router[RouterCore]
        LocalInit --> Renderer[AdvancedRenderer]

        Template --> Registry[Register Built-in Functions]
        Router --> PathLib[Initialize Path Library]
        Renderer --> SVG[Setup SVG Namespace]
        Renderer --> OverlayRenderers[Initialize Overlay Renderers]
    end

    Renderer --> Ready[✅ Card Systems Ready]

    classDef singleton fill:#b8e0c1,stroke:#266239,stroke-width:3px,color:#0c2a15
    classDef cardLocal fill:#80bb93,stroke:#083717,stroke-width:2px,color:#0c2a15

    class LC,DSM,RE,TM,VS,Entities,History,Buffer,RuleStore,Callbacks,Tokens,Defaults singleton
    class Manager,RegisterDS,RegisterRE,LocalInit,Template,Router,Anim,Renderer,Registry,PathLib,AnimeJS,SVG,OverlayRenderers cardLocal
```

**Singleton SystemsManager Role:**
- **Global Coordination** - First card creates shared intelligence singletons
- **Registration Bridge** - Each card registers its datasources/rules with singletons
- **Local System Management** - Manages card-specific systems (TemplateProcessor, Renderer)
- **Singleton Access** - Provides card access to shared intelligence systems
- **Multi-Card Cleanup** - Handles card removal without affecting other cards

**System Types:**
**Singleton Systems (Shared):**
1. **DataSourceManager** - Entity subscriptions shared across all cards
2. **RulesEngine** - Rule evaluation with callback distribution to all cards
3. **ThemeManager** - Theme tokens and defaults available to all cards
4. **AnimationManager** - Animation coordination shared across all cards
5. **ValidationService** - Schema validation shared across all cards

**Local Systems (Per Card):**
1. **TemplateProcessor** - Card-specific template resolution
2. **RouterCore** - Card-specific line path calculation
3. **AdvancedRenderer** - Card-specific SVG generation
7. **AdvancedRenderer** - SVG rendering

---

## DataSource Lifecycle

### Singleton DataSourceManager Multi-Card Coordination

```mermaid
sequenceDiagram
    participant CardA as Card A Config
    participant CardB as Card B Config
    participant DSM as DataSourceManager Singleton
    participant DS as Shared DataSource
    participant HA as Home Assistant
    participant Transform as Transformations
    participant Agg as Aggregations
    participant OverlayA as Card A Overlays
    participant OverlayB as Card B Overlays

    %% Card A registration
    CardA->>DSM: Register data_sources (Card A)
    DSM->>DS: Create/reuse DataSource for entity
    DS->>HA: Subscribe to entity (if first)
    HA-->>DS: Current state

    %% Card B registration (same entity)
    CardB->>DSM: Register data_sources (Card B)
    DSM->>DS: Reuse existing DataSource
    Note over DSM: Same entity - shared DataSource

    opt Historical Data (Shared)
        DS->>HA: Request history (shared across cards)
        HA-->>DS: Historical data array
        DS->>DS: Pre-fill shared buffer
    end

    DS->>Transform: Apply transformations (once)
    Transform->>Transform: Unit conversion
    Transform->>Transform: Scaling
    Transform->>Transform: Smoothing
    Transform-->>DS: Transformed values

    DS->>Agg: Calculate aggregations (once)
    Agg->>Agg: Moving average
    Agg->>Agg: Min/Max
    Agg->>Agg: Rate of change
    Agg-->>DS: Aggregated values

    %% Distribute to both cards
    DS->>OverlayA: Emit to Card A overlays
    DS->>OverlayB: Emit to Card B overlays
    OverlayA-->>OverlayA: Card A initial render
    OverlayB-->>OverlayB: Card B initial render

    loop Multi-Card Runtime Updates
        HA->>DS: Entity state changed
        DS->>DS: Add to shared buffer
        DS->>Transform: Re-apply transformations (once)
        DS->>Agg: Recalculate aggregations (once)

        Note over DSM: Singleton distributes to all cards
        DS->>OverlayA: Emit to Card A overlays
        DS->>OverlayB: Emit to Card B overlays

        par Card Updates
            OverlayA-->>OverlayA: Card A incremental update
        and
            OverlayB-->>OverlayB: Card B incremental update
        end
    end

    CardA->>DSM: Card A removed
    Note over DSM: Keep DataSource - Card B still using
    CardB->>DSM: Card B removed
    DSM->>DS: destroy() - no more subscribers
    DS->>HA: Unsubscribe from entity
```

**Singleton DataSource Features:**
- **Shared Subscriptions** - One entity subscription serves multiple cards
- **Coordinated Processing** - Single transformation/aggregation pipeline per entity
- **Multi-Card Distribution** - Processed data distributed to all subscribers
- **Reference Counting** - DataSources destroyed when no cards using them
- **Efficient Resource Usage** - Shared buffers, transformations, and HA connections
- **Historical preload** - Load past data once, share across all cards
- **Time-windowed buffers** - Efficient shared memory management
- **Transformation pipeline** - 50+ processors applied once per entity
- **Aggregation engine** - Statistics calculated once, distributed to all cards

---

## Rendering Pipeline

### SVG Generation Process

```mermaid
graph TD
    Model[Resolved Model] --> Renderer[AdvancedRenderer]

    Renderer --> Loop[Loop Through Overlays]
    Loop --> Type{Overlay<br/>Type?}

    Type -->|text| TextR[TextRenderer]
    Type -->|button| ButtonR[ButtonRenderer]
    Type -->|line| LineR[LineRenderer]
    Type -->|status_grid| GridR[StatusGridRenderer]
    Type -->|apexchart| ChartR[ApexChartRenderer]

    TextR --> Style[Resolve Styles]
    ButtonR --> Style
    LineR --> Style
    GridR --> Style
    ChartR --> Style

    Style --> Theme[Apply Theme Defaults]
    Theme --> Preset{Preset<br/>specified?}
    Preset -->|Yes| ApplyPreset[Apply Style Preset]
    Preset -->|No| Direct[Use Direct Styles]

    ApplyPreset --> Merge[Merge Styles]
    Direct --> Merge

    Merge --> SVG[Generate SVG Elements]
    SVG --> Attach[Attach to DOM]
    Attach --> Events[Attach Event Listeners]
    Events --> Complete[✅ Overlay Rendered]

    Complete --> Next{More<br/>overlays?}
    Next -->|Yes| Loop
    Next -->|No| Done[Rendering Complete]

    style Model fill:#37a6d1,stroke:#2a7193,color:#f3f4f7
    style Done fill:#266239,stroke:#083717,color:#f3f4f7
```

**Rendering Steps:**
1. **Loop Overlays** - Process each overlay in order
2. **Type Detection** - Identify overlay type
3. **Style Resolution** - Resolve styles from theme, presets, and user config
4. **SVG Generation** - Create SVG elements
5. **DOM Attachment** - Add elements to SVG container
6. **Event Binding** - Attach click handlers, hover effects
7. **Return to Loop** - Process next overlay

**Renderer Features:**
- **Incremental updates** - Only re-render changed overlays
- **Efficient DOM manipulation** - Minimize reflows
- **Event delegation** - Centralized event handling
- **Style caching** - Avoid redundant calculations
- **ViewBox scaling** - Responsive sizing


---

## Runtime Updates

### Multi-Card Singleton Coordinated Updates

```mermaid
sequenceDiagram
    participant Entity as HA Entity
    participant DSM as DataSourceManager Singleton
    participant RE as RulesEngine Singleton
    participant CardA as Card A Systems
    participant CardB as Card B Systems
    participant TemplateA as TemplateProcessor A
    participant TemplateB as TemplateProcessor B
    participant RendererA as AdvancedRenderer A
    participant RendererB as AdvancedRenderer B
    participant DOMA as SVG DOM A
    participant DOMB as SVG DOM B

    Entity->>DSM: State changed (single event)
    DSM->>DSM: Update shared buffer
    DSM->>DSM: Process transformations (once)
    DSM->>DSM: Recalculate aggregations (once)

    Note over DSM: Singleton distributes to all registered cards
    DSM->>CardA: Emit update to Card A
    DSM->>CardB: Emit update to Card B

    par Card A Processing
        CardA->>RE: Check Card A affected rules
        RE->>RE: Re-evaluate all rules (shared)
        RE-->>CardA: Card A rule results

        CardA->>TemplateA: Re-process Card A templates
        TemplateA->>DSM: Get current values
        DSM-->>TemplateA: Shared processed values
        TemplateA-->>CardA: Resolved content A

        CardA->>RendererA: incrementalUpdate(Card A overlays)

        loop For each changed overlay A
            RendererA->>RendererA: Find existing SVG element
            RendererA->>RendererA: Update element attributes
            RendererA->>DOMA: Apply changes (no reflow)
        end

        RendererA-->>CardA: Update A complete

    and Card B Processing
        CardB->>RE: Check Card B affected rules
        Note over RE: Same rule evaluation serves both cards
        RE-->>CardB: Card B rule results

        CardB->>TemplateB: Re-process Card B templates
        TemplateB->>DSM: Get current values
        DSM-->>TemplateB: Same shared processed values
        TemplateB-->>CardB: Resolved content B

        CardB->>RendererB: incrementalUpdate(Card B overlays)

        loop For each changed overlay B
            RendererB->>RendererB: Find existing SVG element
            RendererB->>RendererB: Update element attributes
            RendererB->>DOMB: Apply changes (no reflow)
        end

        RendererB-->>CardB: Update B complete
    end
```

**Singleton Update Optimization:**
- ✅ **Shared Processing** - Single entity processing serves all cards
- ✅ **Coordinated Rule Evaluation** - Rules evaluated once, distributed to all cards
- ✅ **No full re-renders** - Only update changed overlays per card
- ✅ **Parallel Card Updates** - Multiple cards update simultaneously
- ✅ **Minimal DOM manipulation** - Batch updates per card
- ✅ **Efficient diffing** - Track what changed per card
- ✅ **Event coalescing** - Batch rapid updates across all cards
- ✅ **Async processing** - Non-blocking coordinated updates

**Multi-Card Update Triggers:**
- Single entity state change affects multiple cards
- Shared DataSource computed value changes
- Singleton rule re-evaluation distributed to relevant cards
- Cross-card targeting (overlay updates in different cards)
- User interactions with card-to-card effects
- Timer-based updates coordinated across cards

---

## Template Processing

### Template Resolution Flow

```mermaid
graph TD
    Template[Template String<br/>\{datasource.value\}] --> Processor[TemplateProcessor]

    Processor --> Parse[Parse Template]
    Parse --> Tokens[Extract Tokens]

    Tokens --> Type{Token<br/>Type?}

    Type -->|datasource| DS[DataSourceManager]
    Type -->|function| Func[Built-in Function]
    Type -->|expression| Expr[JavaScript Expression]

    DS --> Get[Get DataSource Value]
    Get --> Trans{Transformation<br/>specified?}
    Trans -->|Yes| TransValue[Get Transformation Value]
    Trans -->|No| RawValue[Get Raw Value]

    TransValue --> Format[Apply Formatting]
    RawValue --> Format

    Func --> Eval[Evaluate Function]
    Eval --> Format

    Expr --> Safe[Safe Eval Context]
    Safe --> Format

    Format --> Replace[Replace Token]
    Replace --> More{More<br/>tokens?}
    More -->|Yes| Tokens
    More -->|No| Result[Resolved String]

    style Template fill:#37a6d1,stroke:#2a7193,color:#f3f4f7
    style Result fill:#266239,stroke:#083717,color:#f3f4f7
```

**Template Features:**
- **DataSource references** - `{datasource.value}`, `{datasource.transformations.key}`
- **Aggregation access** - `{datasource.aggregations.avg.value}`
- **Built-in functions** - `{@round(datasource.value, 1)}`
- **Expressions** - `{datasource.value * 2 + 10}`
- **Formatting** - `{datasource.value:.2f}` (2 decimal places)
- **Safe evaluation** - Sandboxed JavaScript execution

---

## Rules Engine Evaluation

### Rule Processing

```mermaid
graph TD
    Model[Card Model] --> Rules[RulesEngine]

    Rules --> Loop[Loop Through Rules]
    Loop --> Condition[Evaluate Condition]

    Condition --> Type{Condition<br/>Type?}

    Type -->|datasource| DS[Check DataSource Value]
    Type -->|entity| Entity[Check HA Entity State]
    Type -->|expression| Expr[Evaluate Expression]
    Type -->|time| Time[Check Time/Date]

    DS --> Compare[Compare with Target]
    Entity --> Compare
    Expr --> Compare
    Time --> Compare

    Compare --> Match{Condition<br/>Met?}

    Match -->|Yes| Actions[Execute Actions]
    Match -->|No| Next{More<br/>rules?}

    Actions --> ActionType{Action<br/>Type?}

    ActionType -->|set_style| StyleAction[Update Overlay Style]
    ActionType -->|set_visibility| VisAction[Show/Hide Overlay]
    ActionType -->|set_content| ContentAction[Update Content]
    ActionType -->|trigger_animation| AnimAction[Start Animation]

    StyleAction --> Apply[Apply to Overlay]
    VisAction --> Apply
    ContentAction --> Apply
    AnimAction --> Apply

    Apply --> Next
    Next -->|Yes| Loop
    Next -->|No| Complete[✅ Rules Evaluated]

    style Model fill:#37a6d1,stroke:#2a7193,color:#f3f4f7
    style Complete fill:#266239,stroke:#083717,color:#f3f4f7
```

**Rule Types:**
- **Conditional styling** - Change colors based on value ranges
- **Visibility control** - Show/hide overlays based on conditions
- **Content updates** - Dynamic text based on state
- **Animation triggers** - Start animations on conditions
- **Multi-condition rules** - AND/OR logic

**Evaluation Timing:**
- Initial render
- DataSource updates
- Entity state changes
- Manual trigger (user action)

---

## Line Routing

### Path Calculation

```mermaid
graph TD
    Line[Line Overlay] --> Router[RouterCore]

    Router --> Anchor[Get Anchor Point]
    Router --> Attach[Get Attach Point]

    Anchor --> Gap1[Apply anchor_gap]
    Attach --> Gap2[Apply attach_gap]

    Gap1 --> Start[Start Point x,y]
    Gap2 --> End[End Point x,y]

    Start --> Mode{Routing<br/>Mode?}
    End --> Mode

    Mode -->|auto| Auto[Smart Pathfinding]
    Mode -->|direct| Direct[Straight Line]
    Mode -->|orthogonal| Ortho[Right Angles]
    Mode -->|curved| Curved[Bezier Curves]

    Auto --> Grid[Build Grid Graph]
    Grid --> Obstacles[Mark Obstacles]
    Obstacles --> AStar[A* Algorithm]
    AStar --> Path[Calculated Path]

    Direct --> Path
    Ortho --> Path
    Curved --> Path

    Path --> SVG[Generate SVG Path]
    SVG --> Style[Apply Line Style]
    Style --> Complete[✅ Line Rendered]

    style Line fill:#37a6d1,stroke:#2a7193,color:#f3f4f7
    style Complete fill:#266239,stroke:#083717,color:#f3f4f7
```

**Line Routing Features:**
- **9-point attachment** - Any side or corner of any overlay
- **Gap system** - Offset from attachment point
- **Auto routing** - Obstacle avoidance with A*
- **Multiple algorithms** - Direct, orthogonal, curved
- **Dynamic updates** - Recalculate on overlay movement
- **Style control** - Width, color, dashes, arrows

---

## Debug & Introspection

### Debug System

```mermaid
graph TD
    Debug[Debug System] --> Expose[window.lcards.debug.msd]

    Expose --> Pipeline[Pipeline Access]
    Expose --> Systems[Systems Access]
    Expose --> Model[Model Access]
    Expose --> State[State Inspection]

    Pipeline --> ConfigAccess[View Configuration]
    Pipeline --> Provenance[Check Provenance]
    Pipeline --> Issues[View Validation Issues]

    Systems --> DSM[DataSourceManager]
    Systems --> Rules[RulesEngine]
    Systems --> Template[TemplateProcessor]
    Systems --> Renderer[Renderer State]

    DSM --> DSSources[View All DataSources]
    DSM --> DSValues[Current Values]
    DSM --> DSHistory[Buffer Contents]

    Model --> Overlays[Inspect Overlays]
    Model --> Dependencies[Dependency Graph]
    Model --> Resolved[Resolved Model]

    State --> Performance[Performance Metrics]
    State --> Events[Event Log]
    State --> Memory[Memory Usage]

    Debug --> Methods[Debug Methods]
    Methods --> Dump[dumpState]
    Methods --> Trace[traceDataFlow]
    Methods --> Test[testRules]
    Methods --> Validate[validateConfig]

    style Debug fill:#37a6d1,stroke:#2a7193,color:#f3f4f7
    style Methods fill:#266239,stroke:#083717,color:#f3f4f7
```

**Debug Features:**

**Console Access:**
```javascript
// Access debug interface
window.lcards.debug.msd

// View configuration
window.lcards.debug.msd.config

// Inspect datasources
window.lcards.debug.msd.systems.dataSourceManager.dataSources

// View resolved model
window.lcards.debug.msd.model.computeResolvedModel()

// Dump full state
window.lcards.debug.msd.dumpState()
```

**Debug Methods:**
- `dumpState()` - Export complete system state
- `traceDataFlow(overlayId)` - Track data flow to overlay
- `testRules()` - Dry-run rule evaluation
- `validateConfig()` - Re-validate configuration
- `inspectDataSource(id)` - View datasource details
- `reRender()` - Force full re-render

**Debug Renderers:**
- **MsdDebugRenderer** - Overlay bounds, attachment points
- **MsdControlsRenderer** - Runtime controls, config editor

---

## Performance Characteristics

### System Performance

| Aspect | Performance | Notes |
|--------|-------------|-------|
| **Initial Load** | ~100-200ms | Depends on pack count, theme complexity |
| **First Render** | ~50-100ms | Depends on overlay count |
| **DataSource Update** | ~1-5ms | Per datasource, includes transformations |
| **Incremental Render** | ~2-10ms | Per changed overlay |
| **Rule Evaluation** | ~0.5-2ms | Per rule |
| **Template Processing** | ~1-3ms | Per template |
| **Line Routing (auto)** | ~5-20ms | Depends on path complexity |
| **Memory Usage** | 5-20 MB | Depends on history buffer size |

**Optimization Techniques:**
- Event coalescing (batch rapid updates)
- Incremental rendering (no full re-renders)
- Style caching (avoid redundant calculations)
- Buffer windowing (automatic old data cleanup)
- Lazy evaluation (compute only when needed)
- Efficient DOM manipulation (minimize reflows)

---

## Summary

### Key Pipeline Stages

1. **Configuration** → Process and validate user config
2. **Packs** → Load and merge themes, presets, external config
3. **Model** → Build internal card representation
4. **Systems** → Initialize all subsystems
5. **DataSources** → Subscribe to HA entities, preload history
6. **Resolution** → Resolve templates, evaluate rules
7. **Rendering** → Generate SVG from resolved model
8. **Runtime** → Handle updates incrementally

### System Characteristics

- ✅ **Event-driven** - React to HA state changes
- ✅ **Declarative** - Configuration-first approach
- ✅ **Modular** - Clear subsystem boundaries
- ✅ **Efficient** - Incremental updates only
- ✅ **Debuggable** - Comprehensive introspection
- ✅ **Extensible** - Pack system, custom renderers
- ✅ **Performant** - Optimized for real-time dashboards

### Architecture Benefits

**For Users:**
- Fast, responsive dashboards
- Real-time data updates
- Rich visual effects
- Easy configuration

**For Developers:**
- Clear separation of concerns
- Easy to debug and test
- Extensible architecture
- Well-documented pipeline

---

**Related Documentation:**
- [Systems Manager](subsystems/systems-manager.md) - Central orchestration
- [DataSource System](subsystems/datasource-system.md) - Data processing
- [Advanced Renderer](subsystems/advanced-renderer.md) - SVG generation
- [Pack System](subsystems/pack-system.md) - Configuration merging
- [Rules Engine](subsystems/rules-engine.md) - Conditional logic
- [Template Processor](subsystems/template-processor.md) - String resolution
