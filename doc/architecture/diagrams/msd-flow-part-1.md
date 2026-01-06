# MSD System Flow & Architecture (Part 1: Core & Initialization)

> **Complete data flow from configuration to rendering with singleton coordination**
> A detailed guide to how LCARdS MSD cards initialize, connect to shared systems, and coordinate multi-card rendering.

---

## 📋 Table of Contents

### Part 1 (This Document)
1. [Overview](#overview)
2. [Two-Tier Architecture](#two-tier-architecture)
3. [Complete Pipeline Flow](#complete-pipeline-flow)
4. [Initialization Sequence](#initialization-sequence)
5. [Configuration Processing](#configuration-processing)
6. [Pack System](#pack-system)
7. [Model Building](#model-building)
8. [Systems Initialization](#systems-initialization)

### Part 2 (See MSD-flow-part2.md)
9. DataSource Lifecycle
10. Rendering Pipeline
11. Runtime Updates
12. Template Processing
13. Rules Engine Evaluation
14. Line Routing
15. Debug & Introspection
16. Performance Characteristics

---

## Overview

The MSD (Master Systems Display) system follows a **two-tier architecture**: global singleton intelligence systems shared across all cards, and per-card MSD SystemsManagers that orchestrate individual card rendering.

### Architecture Summary

**Tier 1: Global Singleton Layer**
- Shared intelligence systems (RulesEngine, DataSourceManager, ThemeManager, AnimationRegistry)
- CoreSystemsManager (for LCARdS Cards only - MSD cards do NOT use this)
- Created once on first card initialization (MSD or LCARdS Card)
- Serves all cards simultaneously
- Efficient resource usage through shared processing

**Tier 2: Per-Card Instance Layer**
- Each MSD card creates its own MSD SystemsManager (per-card instance)
- Each card creates its own AnimationManager (per-card instance)
- LCARdS Cards do NOT use MSD SystemsManager
- Card-specific rendering pipeline (AdvancedRenderer, RouterCore, etc.) - MSD cards only
- Connects to singleton layer for shared intelligence
- Independent rendering but coordinated updates

**Important Distinction:**
- **MSD Cards** → Use DataSourceManager singleton directly (bypass CoreSystemsManager)
- **LCARdS Cards** → Use CoreSystemsManager singleton for entity caching (lighter weight)
- Both leverage shared RulesEngine singleton, ThemeManager singleton, AnimationRegistry singleton
- AnimationManager is per-card (not singleton) - works with singleton AnimationRegistry for caching

### Key Characteristics

- 🌐 **Singleton Intelligence** - Shared systems across all cards
- 🎯 **Multi-Card Support** - Multiple MSD cards coexist with coordinated updates
- 🔄 **Event-driven** - Responds to HA entity changes through singleton distribution
- 📦 **Modular** - Clear separation between global intelligence and per-card rendering
- ⚡ **Efficient** - Shared processing, incremental updates, coordinated cross-card updates
- 🎯 **Declarative** - Configuration-first approach with singleton-aware targeting
- 🔍 **Debuggable** - Comprehensive introspection tools with singleton state visibility

---

## Two-Tier Architecture

### Architecture Diagram

```mermaid
graph TB
    subgraph "Tier 1: Global Singleton Layer"
        LC[lcardsCore Initializer]
        RE[🧠 RulesEngine Singleton]
        DSM[📊 DataSourceManager Singleton]
        TM[🎨 ThemeManager Singleton]
        AR[🎬 AnimationRegistry Singleton]
        VS[✅ ValidationService Singleton]
    end

    subgraph "Tier 2: Card A Pipeline"
        ConfigA[Card A Config] --> ProcessA[Config Processing]
        ProcessA --> PacksA[Pack Merge]
        PacksA --> ModelA[Model Building]
        ModelA --> SysA[MSD SystemsManager A]
        SysA --> AnimA[AnimationManager A - Per Card]
        SysA --> RenderA[AdvancedRenderer A]
        RenderA --> DisplayA[SVG Display A]
    end

    subgraph "Tier 2: Card B Pipeline"
        ConfigB[Card B Config] --> ProcessB[Config Processing]
        ProcessB --> PacksB[Pack Merge]
        PacksB --> ModelB[Model Building]
        ModelB --> SysB[MSD SystemsManager B]
        SysB --> AnimB[AnimationManager B - Per Card]
        SysB --> RenderB[AdvancedRenderer B]
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
    SysA -.register datasources.-> DSM
    SysB -.register datasources.-> DSM

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

---

## Complete Pipeline Flow

### End-to-End Multi-Card System Flow

```mermaid
sequenceDiagram
    participant UserA as Card A Config
    participant UserB as Card B Config
    participant Core as lcardsCore
    participant DSM as DataSourceManager (Singleton)
    participant RE as RulesEngine (Singleton)
    participant TM as ThemeManager (Singleton)
    participant SysA as MSD SystemsManager A
    participant SysB as MSD SystemsManager B
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

    Core->>SysA: new SystemsManager()
    SysA->>SysA: Connect to singletons
    SysA->>DSM: Register card A datasources
    SysA->>RE: Register card A rules with callback
    SysA->>RendA: Initialize AdvancedRenderer A

    %% Second card initialization
    UserB->>Core: initMsdPipeline(configB, mountElB, hass)
    Core->>Core: Singletons already exist - reuse

    Core->>SysB: new SystemsManager()
    SysB->>SysB: Connect to existing singletons
    SysB->>DSM: Register card B datasources
    SysB->>RE: Register card B rules with callback
    SysB->>RendB: Initialize AdvancedRenderer B

    %% Initial render
    RendA->>SVGA: Initial render A
    RendB->>SVGB: Initial render B

    %% Shared processing with distribution
    DSM->>DSM: Entity state changed
    DSM->>SysA: Distribute updates to card A
    DSM->>SysB: Distribute updates to card B

    SysA->>RE: Request rule evaluation for card A
    SysB->>RE: Request rule evaluation for card B

    RE->>RE: Evaluate all rules once
    RE->>SysA: Send card A rule results via callback
    RE->>SysB: Send card B rule results via callback

    SysA->>RendA: Apply updates to renderer A
    SysB->>RendB: Apply updates to renderer B

    RendA->>SVGA: Update SVG A
    RendB->>SVGB: Update SVG B

    loop Multi-Card Runtime Updates
        DSM->>DSM: Shared entity change
        DSM->>SysA: Notify card A
        DSM->>SysB: Notify card B

        Note over RE: Single rule evaluation<br/>serves both cards
        RE->>SysA: Card A results via callback
        RE->>SysB: Card B results via callback

        par Card A Updates
            SysA->>RendA: Incremental update A
            RendA->>SVGA: Update elements A
        and Card B Updates
            SysB->>RendB: Incremental update B
            RendB->>SVGB: Update elements B
        end
    end
```

**Pipeline Flow Summary:**
1. **Singleton Initialization** - lcardsCore creates shared intelligence systems (first card only)
2. **Card Registration** - Each card creates MSD SystemsManager, registers with singletons
3. **Configuration Processing** - Per-card config validation and pack merging
4. **Model Building** - Each card builds its internal overlay representation
5. **Systems Coordination** - MSD SystemsManager connects to singletons, creates local systems
6. **Shared Processing** - Singletons process data once, distribute to all cards
7. **Distributed Rendering** - Each card renders independently with shared intelligence
8. **Coordinated Runtime** - Entity changes trigger singleton evaluation, distributed updates

---

## Initialization Sequence

### Core Initialization (Module Load - ONE TIME)

```mermaid
graph TD
    A[lcards.js Module Load] --> B[initializeLCARdSCore]
    B --> C[Create Singletons Once]
    
    C --> D[ThemeManager]
    C --> E[StylePresetManager]
    C --> F[PackManager]
    C --> G[AssetManager]
    C --> H[RulesEngine]
    C --> I[DataSourceManager]
    C --> J[AnimationRegistry]
    C --> K[ValidationService]
    
    F --> L[loadBuiltinPacks ONCE]
    L --> M[Register themes to ThemeManager]
    L --> N[Register presets to StylePresetManager]
    L --> O[Register SVGs to AssetManager]
    
    B --> P[window.lcards.core = singletons]
    
    style A fill:#e1f5e1
    style B fill:#e1f5e1
    style P fill:#d1ecf1
    style C fill:#b8e0c1,stroke:#266239,stroke-width:3px
    style D,E,F,G,H,I,J,K fill:#b8e0c1,stroke:#266239,stroke-width:2px
```

**Core Initialization Facts:**
- ✅ Happens **once at module load** (before any card instantiated)
- ✅ **PackManager** loads builtin packs once (`core`, `lcards_buttons`, themes)
- ✅ All cards access `window.lcards.core.*` (never create singletons)
- ✅ AssetManager pre-loads all SVG assets from packs

---

### MSD Card Initialization (Per Instance)

```mermaid
graph TD
    A[MSD Card Element] --> B[_onConfigSet config]
    B --> C{Has base_svg?}
    
    C -->|Yes| D[AssetManager.get svg, source]
    C -->|No| E[base_svg: none]
    
    D --> F[Store svgContent]
    E --> F
    
    F --> G[_onFirstUpdated]
    G --> H[_initializeMsdPipeline]
    
    H --> I[Pass raw config + svgContent]
    I --> J[MsdInstanceManager.initialize]
    
    J --> K[PipelineCore.initMsdPipeline]
    
    style A fill:#fff3cd
    style D fill:#d1ecf1
    style K fill:#e1f5e1
```

**MSD Card Initialization Facts:**
- ✅ Card only loads SVG from AssetManager (already loaded by core)
- ✅ Card passes **raw config** to pipeline (no "enhancement")
- ✅ Card **never** processes anchors (pipeline does via AnchorProcessor)
- ✅ Card **never** initializes singletons (accesses from core)

---

### Pipeline Config Processing

```mermaid
graph TD
    A[PipelineCore.initMsdPipeline] --> B[ConfigProcessor]
    B --> C[Extract viewBox from svgContent]
    B --> D[AnchorProcessor.processAnchors]
    
    D --> E[findSvgAnchors from SVG]
    D --> F[Merge with user anchors]
    D --> G[Resolve percentages]
    
    C --> H[Build enhancedConfig]
    G --> H
    
    H --> I[CoreConfigManager.processConfig]
    I --> J[Schema validation]
    I --> K[Provenance tracking]
    
    K --> L[mergedConfig with metadata]
    
    style B fill:#d1ecf1
    style D fill:#e1f5e1
    style I fill:#d1ecf1
```

**Config Processing Facts:**
- ✅ **ConfigProcessor** extracts viewBox from SVG
- ✅ **AnchorProcessor** extracts anchors from SVG (not card)
- ✅ User anchors override SVG anchors
- ✅ **CoreConfigManager** validates with full provenance

---

### SystemsManager + Local Systems

```mermaid
graph TD
    Start[Pipeline Initialization] --> MSM[Create MSD SystemsManager]

    MSM --> ConnectSingletons[Connect to Core Singletons]
    ConnectSingletons --> TM[themeManager = window.lcards.core.themeManager]
    ConnectSingletons --> SPM[stylePresetManager = window.lcards.core.stylePresetManager]
    ConnectSingletons --> RE[rulesManager = window.lcards.core.rulesManager]
    ConnectSingletons --> DSM[dataSourceManager = window.lcards.core.dataSourceManager]

    MSM --> LocalSystems[Initialize MSD-Specific Systems]
    LocalSystems --> Router[RouterCore]
    LocalSystems --> Renderer[AdvancedRenderer]
    LocalSystems --> Debug[MsdDebugRenderer]
    LocalSystems --> Controls[MsdControlsRenderer]
    LocalSystems --> HUD[MsdHudManager]
    LocalSystems --> Anim[AnimationManager - Per Card]

    Renderer --> Initial[Initial Render]
    Initial --> Display[Display SVG]
    Display --> Ready[✅ Card Ready]

    Ready --> Runtime[Enter Coordinated Runtime]

    style Start fill:#37a6d1,stroke:#2a7193,color:#f3f4f7
    style Ready fill:#266239,stroke:#083717,color:#f3f4f7
    style Runtime fill:#f9ef97,stroke:#ac943b,color:#0c2a15
    style TM,SPM,RE,DSM fill:#b8e0c1,stroke:#266239,stroke-width:3px
```

**Initialization Steps:**
1. **Core Init** - Singletons created at module load (once)
2. **Card Init** - Card loads SVG from AssetManager
3. **Pipeline Init** - ConfigProcessor + AnchorProcessor process config
4. **SystemsManager** - Connects to existing singletons from `window.lcards.core`
5. **Local Systems** - Initialize card-specific systems (AdvancedRenderer, RouterCore, etc.)
6. **Initial Render** - Generate first SVG output with singleton intelligence
7. **Coordinated Runtime** - Enter multi-card event-driven mode with shared processing

---

## Configuration Processing

### Config Processing Flow (NEW - PR #159)

**Location:** `src/msd/pipeline/ConfigProcessor.js`

The config processing flow has been significantly refactored to move anchor extraction from the card to the pipeline:

```mermaid
graph TD
    Raw[Raw User Config + SVG Content] --> CP[ConfigProcessor]
    
    CP --> ExtractVB[Extract viewBox from SVG]
    CP --> AP[AnchorProcessor.processAnchors]
    
    AP --> FindSVG[findSvgAnchors from SVG]
    FindSVG --> MergeAnchors[Merge with user anchors]
    MergeAnchors --> ResolvePercent[Resolve percentage coords]
    
    ExtractVB --> BuildEnhanced[Build Enhanced Config]
    ResolvePercent --> BuildEnhanced
    
    BuildEnhanced --> CCM[CoreConfigManager.processConfig]
    
    CCM --> Schema[Schema Validation]
    Schema --> Defaults[Apply Defaults]
    Defaults --> Provenance[Track Provenance]
    
    Provenance --> Output[mergedConfig with metadata]
    
    style Raw fill:#37a6d1,stroke:#2a7193,color:#f3f4f7
    style AP fill:#e1f5e1
    style CCM fill:#d1ecf1
    style Output fill:#266239,stroke:#083717,color:#f3f4f7
```

**Key Flow Changes (PR #159):**

❌ **OLD (Pre-PR #159):**
1. Card processed anchors via `_processAnchors()`
2. Card extracted SVG anchors
3. Card injected anchors into config
4. Card passed "enhanced config" to pipeline
5. Pipeline received pre-processed config (lost provenance)

✅ **NEW (Post-PR #159):**
1. Card passes **raw config + svgContent** to pipeline
2. **ConfigProcessor** extracts viewBox from SVG
3. **AnchorProcessor** extracts + merges anchors:
   - Extract anchors from SVG via `findSvgAnchors(svgContent)`
   - Merge with user-defined anchors (user overrides SVG)
   - Resolve percentage coordinates to absolute positions
4. **Build enhanced config** with extracted metadata:
   ```javascript
   {
     ...config,
     view_box: viewBox,
     anchors: processedAnchors,
     _svgMetadata: { ... }
   }
   ```
5. **CoreConfigManager** validates:
   - Schema validation
   - Provenance tracking (know where each value came from)
   - Default application

**Benefits:**
- ✅ Full provenance maintained (know source of every value)
- ✅ Card logic simplified (no preprocessing)
- ✅ Consistent validation flow
- ✅ Testable anchor processing (isolated in AnchorProcessor)

**Configuration Stages:**
1. **SVG Extraction** - Extract viewBox and anchors from SVG
2. **Anchor Processing** - Merge SVG + user anchors, resolve coordinates
3. **Config Enhancement** - Build complete config with extracted metadata
4. **Schema Validation** - Check against JSON schema (CoreConfigManager)
5. **Default Application** - Fill in missing values with pack defaults
6. **Provenance Tracking** - Record where each value came from

**Validation Features:**
- Required field checking
- Type validation
- Range validation
- Dependency validation
- Custom validators per overlay type

---

## Pack System

### Pack Loading & Merging (Module Load)

```mermaid
graph TD
    Start[Module Load: lcards-core.js] --> Init[initializeLCARdSCore]
    
    Init --> CreatePM[Create PackManager Singleton]
    CreatePM --> LoadBuiltin[PackManager.loadBuiltinPacks ONCE]

    LoadBuiltin --> Themes[builtin_themes]
    LoadBuiltin --> Core[core pack]
    LoadBuiltin --> Buttons[lcards_buttons]

    Themes --> RegisterTM[Register to ThemeManager]
    Core --> RegisterSPM[Register to StylePresetManager]
    Buttons --> RegisterSPM
    
    Themes --> RegisterAM[Register SVGs to AssetManager]
    Core --> RegisterAM
    Buttons --> RegisterAM

    RegisterTM --> Expose[window.lcards.core.packManager]
    RegisterSPM --> Expose
    RegisterAM --> Expose
    
    Expose --> Ready[Packs Loaded - Ready for Cards]

    style Start fill:#e1f5e1
    style LoadBuiltin fill:#37a6d1,stroke:#2a7193,color:#f3f4f7
    style Ready fill:#266239,stroke:#083717,color:#f3f4f7
```

**Pack Loading Facts:**
- ✅ Happens **once at module load** (not per card)
- ✅ **PackManager** singleton loads builtin packs
- ✅ Themes register with **ThemeManager** singleton
- ✅ Presets register with **StylePresetManager** singleton
- ✅ SVGs register with **AssetManager** singleton
- ✅ No per-card pack loading or `mergePacks()` calls

**Pack Types:**
- **builtin_themes** - Theme definitions (always loaded, managed by ThemeManager singleton)
- **core** - Core overlays and defaults
- **lcards_buttons** - LCARS button presets
- **external** - User-provided packs from URLs (loaded per-card if specified)

**Merge Priority:**
1. Builtin packs (lowest priority)
2. External packs
3. User configuration (highest priority)

**What Packs Provide:**
- Theme tokens and component defaults (via ThemeManager singleton)
- Style presets (e.g., LCARS button styles via StylePresetManager)
- Reusable overlay templates
- SVG assets (via AssetManager singleton)
- Animation definitions (cached in AnimationRegistry singleton, used by per-card AnimationManagers)

---

## Model Building

### Card Model Construction

```mermaid
graph TD
    Config[Merged Configuration] --> Builder[Model Builder]

    Builder --> Parse[Parse Overlays]
    Parse --> Overlays[Overlay Array]

    Overlays --> Line[Line Overlays]
    Overlays --> Control[Control Overlays]

    Line --> Validate[Validate Each]
    Control --> Validate

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
- Stores all overlay definitions for this card
- Tracks overlay dependencies (e.g., lines attached to overlays)
- Provides query methods (getOverlayById, getOverlaysByType)
- Caches resolved model for performance
- Supports incremental updates

---

## Systems Initialization

### MSD SystemsManager + Singleton Coordination

```mermaid
graph TD
    subgraph "Global Singleton Layer (First Card Only)"
        LC[lcardsCore] --> DSM[📊 DataSourceManager Singleton]
        LC --> RE[🧠 RulesEngine Singleton]
        LC --> TM[🎨 ThemeManager Singleton]
        LC --> AR[🎬 AnimationRegistry Singleton]
        LC --> VS[✅ ValidationService Singleton]

        DSM --> Entities[Subscribe to HA Entities]
        DSM --> History[Preload History]
        DSM --> Buffer[Initialize Entity Buffers]

        RE --> RuleStore[Initialize Rule Store]
        RE --> Callbacks[Setup Callback Arrays]

        TM --> Tokens[Load Theme Tokens]
        TM --> Defaults[Component Defaults]

        AR --> Cache[Initialize Animation Cache]
        AR --> Presets[Load Animation Presets]
    end

    subgraph "Per-Card Layer (Each MSD Card)"
        MSM[MSD SystemsManager] --> RegisterDS[Register DataSources with Singleton]
        MSM --> RegisterRE[Register Rules with Singleton]
        MSM --> AnimMgr[Create AnimationManager - Per Card]
        MSM --> LocalInit[Initialize Local Systems]

        RegisterDS --> DSM
        RegisterRE --> RE
        AnimMgr --> AR

        LocalInit --> Router[RouterCore]
        LocalInit --> Renderer[AdvancedRenderer]
        LocalInit --> Debug[MsdDebugRenderer]
        LocalInit --> Controls[MsdControlsRenderer]
        LocalInit --> HUD[MsdHudManager]
        LocalInit --> Updater[BaseOverlayUpdater]

        Router --> PathLib[Initialize Path Library]
        Renderer --> SVG[Setup SVG Namespace]
        Renderer --> OverlayRenderers[Initialize Overlay Renderers]
    end

    Renderer --> Ready[✅ Card Systems Ready]

    classDef singleton fill:#b8e0c1,stroke:#266239,stroke-width:3px,color:#0c2a15
    classDef cardLocal fill:#80bb93,stroke:#083717,stroke-width:2px,color:#0c2a15

    class LC,DSM,RE,TM,AM,VS,Entities,History,Buffer,RuleStore,Callbacks,Tokens,Defaults,Registry,Triggers singleton
    class MSM,RegisterDS,RegisterRE,RegisterAM,LocalInit,Router,Renderer,Debug,Controls,HUD,Updater,PathLib,SVG,OverlayRenderers cardLocal
```

**MSD SystemsManager Role:**
- **Singleton Connection** - Connects to existing global singletons (does NOT create them)
- **Registration Bridge** - Registers card's datasources/rules with singletons
- **Local System Management** - Creates and manages card-specific rendering systems
- **Callback Coordination** - Receives updates from singletons via registered callbacks
- **Per-Card Cleanup** - Handles card removal without affecting singletons or other cards

**System Types:**

**Global Singleton Systems (Shared):**
1. **DataSourceManager** - Entity subscriptions shared across all MSD cards
2. **RulesEngine** - Rule evaluation with callback distribution to all MSD cards
3. **ThemeManager** - Theme tokens and defaults available to all MSD cards
4. **AnimationRegistry** - Animation instance caching shared across all MSD cards
5. **ValidationService** - Schema validation shared across all MSD cards
6. **PackManager** - Pack loading and registration (loads once at module init)
7. **AssetManager** - SVG and component asset management

**Per-Card Local Systems:**
1. **RouterCore** - Card-specific line path calculation
2. **AdvancedRenderer** - Card-specific SVG generation
3. **MsdDebugRenderer** - Card-specific debug overlays
4. **MsdControlsRenderer** - Card-specific control overlays
5. **MsdHudManager** - Card-specific HUD management
6. **BaseOverlayUpdater** - Card-specific incremental updates
7. **AnimationManager** - Per-card animation playback (uses shared AnimationRegistry)

**Template Processing:**
- Uses unified template system (`src/core/templates/`) - NOT a per-card system
- TemplateDetector/TemplateParser for syntax detection
- Card-specific evaluators (UnifiedTemplateEvaluator, DataSourceMixin, HATemplateEvaluator)

**Key Point**: MSD cards do **NOT** use CoreSystemsManager. They bypass it entirely and connect directly to the singleton layer (DataSourceManager, RulesEngine, etc.). CoreSystemsManager is only for LCARdS Cards.

---

## 🔗 Global Data Source and Rules Publication

### Any Card Can Define Data Sources and Rules

A key architectural feature: **data sources and rules defined in any card are registered with global singletons**, making them available system-wide.

```mermaid
graph LR
    subgraph "Card A (MSD)"
        DSA[data_sources:<br/>cpu_temp]
        RA[rules:<br/>cpu_hot]
    end

    subgraph "Card B (LCARdS card)"
        DSB[data_sources:<br/>memory_usage]
        RB[rules:<br/>memory_warning]
    end

    subgraph "Global Singletons"
        DSM[DataSourceManager<br/>• cpu_temp<br/>• memory_usage]
        RE[RulesEngine<br/>• cpu_hot<br/>• memory_warning]
    end

    subgraph "Card C (Any Card)"
        CC[Can use:<br/>• cpu_temp<br/>• memory_usage<br/>• All rules apply]
    end

    DSA --> DSM
    DSB --> DSM
    RA --> RE
    RB --> RE
    DSM --> CC
    RE --> CC
```

**How It Works:**

1. **Card defines data sources** → Registered with `DataSourceManager` singleton
2. **Card defines rules** → Registered with `RulesEngine` singleton
3. **All cards receive** → Updates from shared data sources and rule evaluations
4. **No duplication** → Same entity subscription serves all cards

**Example: Shared Data Source**

```yaml
# Card A (MSD) defines a data source
type: custom:lcards-msd-card
data_sources:
  temperature:
    entity: sensor.temperature
    window_seconds: 3600
    history:
      preload: true
      hours: 6

# Card B (LCARdS card) can reference the same data
# via template syntax: {temperature.v} or {temperature.aggregations.avg}
```

**Example: Cross-Card Rules**

```yaml
# Card A defines a rule
rules:
  - id: global_alert
    when:
      all:
        - entity: binary_sensor.alarm
          state: 'on'
    apply:
      base_svg:
        filter_preset: red-alert

# This rule affects Card A directly
# Other cards on the dashboard get rule updates too
# Each card applies its own applicable rules
```

**Benefits:**

- ✅ **No duplicate subscriptions** - One Home Assistant connection per entity
- ✅ **Consistent state** - All cards see the same entity state
- ✅ **Shared processing** - Transformations and aggregations computed once
- ✅ **Flexible architecture** - Define data sources where convenient, use anywhere

---

## 📚 Related Documentation

- **[MSD SystemsManager](../subsystems/msd-systems-manager.md)** - Per-card orchestrator for MSD cards
- **[CoreSystemsManager](../subsystems/core-systems-manager.md)** - Lightweight singleton for LCARdS Cards
- **[Architecture Overview](../overview.md)** - Complete system architecture
- **[DataSource System](../subsystems/datasource-system.md)** - Data processing pipeline
- **[Advanced Renderer](../subsystems/advanced-renderer.md)** - SVG rendering engine

---

**Status:** ✅ Singleton extraction complete, CoreSystemsManager integrated with LCARdS Cards
