# MSD Card Architecture

**Type:** Advanced coordinator card  
**Purpose:** Canvas-based multi-overlay system  
**Base:** `LCARdSNativeCard` → custom initialization

---

## High-Level Architecture

```mermaid
graph TD
    A[MSD Card Element] --> B[Uses Core Singletons]
    B --> C[themeManager]
    B --> D[stylePresetManager]
    B --> E[assetManager]
    B --> F[rulesManager]
    
    A --> G[MSD-Specific Systems]
    G --> H[Pipeline]
    H --> I[AdvancedRenderer]
    H --> J[RouterCore]
    H --> K[AnimationManager per-card]
    
    style B fill:#e1f5e1
    style G fill:#d1ecf1
```

**Key Concept:** MSD uses core singletons for intelligence, creates pipeline for rendering/routing.

---

## Card Initialization Flow

```mermaid
sequenceDiagram
    participant Card as MSD Card
    participant Core as window.lcards.core
    participant Asset as AssetManager
    participant Pipeline as MSD Pipeline
    
    Card->>Card: _onConfigSet(config)
    Card->>Asset: get('svg', base_svg.source)
    Asset-->>Card: svgContent
    
    Card->>Card: _onFirstUpdated()
    Card->>Pipeline: initialize(config, svgContent, hass)
    
    Pipeline->>Pipeline: ConfigProcessor
    Pipeline->>Pipeline: AnchorProcessor extracts anchors
    Pipeline->>Core: configManager.processConfig()
    
    Pipeline->>Pipeline: MsdCardCoordinator.init
    Pipeline->>Core: Access singletons
    Pipeline->>Pipeline: Create renderer/router
    
    Pipeline-->>Card: pipelineAPI
    Card->>Card: render()
```

**Key Facts:**
- ✅ Card loads SVG from AssetManager
- ✅ Card passes **raw config** to pipeline (no preprocessing)
- ✅ Pipeline extracts anchors, validates config
- ✅ Pipeline accesses core singletons, creates MSD-specific systems

---

## Pipeline Initialization

```mermaid
graph TD
    A[Pipeline.init] --> B[ConfigProcessor]
    B --> C[Extract viewBox from svgContent]
    B --> D[AnchorProcessor.processAnchors]
    
    D --> E[findSvgAnchors from SVG]
    D --> F[Merge with user anchors]
    D --> G[Resolve percentages]
    
    C --> H[CoreConfigManager.processConfig]
    G --> H
    H --> I[Schema validation + provenance]
    
    A --> J[MsdCardCoordinator.init]
    J --> K[Access core singletons]
    K --> L[themeManager]
    K --> M[stylePresetManager]
    K --> N[rulesManager]
    
    J --> O[Create MSD systems]
    O --> P[AdvancedRenderer]
    O --> Q[RouterCore]
    O --> R[AnimationManager]
    
    style B fill:#d1ecf1
    style J fill:#e1f5e1
```

**Key Facts:**
- ✅ Anchor extraction happens in pipeline (not card)
- ✅ CoreConfigManager provides provenance tracking
- ✅ MsdCardCoordinator accesses singletons (doesn't create them)

---

## MSD-Specific Systems

| System | Purpose | Instance Type |
|--------|---------|---------------|
| `AdvancedRenderer` | SVG overlay rendering | Per-card |
| `RouterCore` | Line path calculation | Per-card |
| `AnimationManager` | Animation orchestration | Per-card |
| `MsdControlsRenderer` | Embedded card management | Per-card |

**Why Per-Card:**
- Each MSD card has unique overlays, routes, animations
- Canvas rendering is card-specific
- Core singletons handle shared intelligence (themes, rules, presets)

---

## Configuration Flow

```mermaid
graph LR
    A[User YAML] --> B[Card receives config]
    B --> C[Load SVG from AssetManager]
    
    C --> D[Pass to Pipeline]
    D --> E[AnchorProcessor]
    E --> F[Extract SVG anchors]
    E --> G[Merge user anchors]
    
    G --> H[CoreConfigManager]
    H --> I[Validate schema]
    H --> J[Track provenance]
    H --> K[Apply defaults from theme]
    
    K --> L[MsdCardCoordinator uses config]
    
    style D fill:#d1ecf1
    style H fill:#e1f5e1
```

**Key Facts:**
- ✅ Raw config → pipeline
- ✅ Anchors extracted from SVG (not card)
- ✅ Full provenance tracked

---

## Overlay Types

**MSD supports 2 overlay types:**

1. **`line`** - SVG paths with intelligent routing
   - Uses RouterCore for path calculation
   - Themes applied via themeManager
   - Rules targetable via rulesManager

2. **`control`** - Embedded HA cards
   - Any HA card (including LCARdS cards)
   - 9-point attachment system for lines
   - Self-managing (own HASS updates)

---

## HASS Update Handling

```mermaid
graph TD
    A[HASS Update] --> B{MSD Card}
    B --> C[Block card re-render]
    B --> D[Forward to MsdCardCoordinator]
    
    D --> E[Update DataSourceManager]
    D --> F[Forward to control overlays]
    
    F --> G[Embedded cards update themselves]
    
    style C fill:#ffe4b5
```

**Why Block MSD Re-render:**
- MSD canvas doesn't need re-render on HASS changes
- Control overlays (embedded cards) handle own updates
- Only re-render when config or overlays change

---

## References
- Card implementation: `src/cards/lcards-msd.js`
- Pipeline: `src/msd/pipeline/PipelineCore.js`
- Config processing: `src/msd/pipeline/ConfigProcessor.js`
- Anchor processing: `src/msd/pipeline/AnchorProcessor.js`
- Card coordinator: `src/msd/pipeline/MsdCardCoordinator.js`
- Renderer: `src/msd/renderer/AdvancedRenderer.js`
- Router: `src/msd/routing/RouterCore.js`
- Core singletons: [core-initialization.md](./core-initialization.md)
