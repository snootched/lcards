# Architecture Overview

> **LCARdS System Architecture**  
> High-level overview of the singleton-based rendering system, card types, and component relationships.

---

## 🎯 Core Philosophy

LCARdS is a Home Assistant custom card system built on a **singleton-based, data-driven architecture** that supports multiple card instances with shared resources.

**Key Principle:** Shared intelligence, distributed presentation.
- Global singleton systems (RulesEngine, DataSourceManager, ThemeManager) provide shared intelligence
- Individual cards focus solely on presentation and user interaction
- Entity caching provides 80-90% faster access with multiple cards

---

## 🏗️ Card Architecture

LCARdS provides two card foundation types, both built on a common base:

```
LitElement (Lit web component)
    ↓
LCARdSNativeCard (HA integration, shadow DOM, actions)
    ↓
    ├─→ LCARdSSimpleCard → Simple Cards (SimpleButton, etc.)
    │   • Lightweight, single-purpose cards
    │   • Direct singleton integration
    │   • Template processing & action handling
    │   • **Go-forward architecture** ⭐
    │
    └─→ LCARdSMSDCard → MSD Cards
        • Multi-overlay complex displays
        • Advanced rendering pipeline
        • Navigation & routing
        • **Future: Will be refactored to use Simple Cards for overlays**
```

### Current State

- ✅ **SimpleCard Foundation**: Clean architecture - all new cards use this
- ✅ **SimpleButton Card**: Production Simple Card
- ✅ **MSD Cards**: Complex multi-overlay displays

**See:** [Simple Card Foundation](cards/simple-card-foundation.md) for details on the Simple Card architecture.

---

## 🎨 Architecture Layers

```mermaid
graph TB
    subgraph "Home Assistant Layer"
        HA[Home Assistant Core]
        HASS[hass Object]
    end

    subgraph "LCARdS Global Singleton Layer"
        LC[lcardsCore]

        subgraph "BaseService Architecture"
            BS["⭐ BaseService
            updateHass() and ingestHass()"]
        end

        subgraph "Shared Intelligence Systems"
            RE["🧠 RulesEngine
            extends BaseService"]
            DSM["📊 DataSourceManager
            extends BaseService"]
            TM["🎨 ThemeManager
            extends BaseService"]
            AM["🎬 AnimationManager
            extends BaseService"]
            SPM["🎭 StylePresetManager
            extends BaseService"]
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

        subgraph "SimpleButton Card"
            CardC[SimpleButton Card]
            SimpleC[Direct Rendering]
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
    classDef simplecard fill:#458359,stroke:#095320,stroke-width:2px,color:#f3f4f7

    class BS baseservice
    class RE,DSM,TM,AM,SPM,AR,VS,SL,CSM singleton
    class CardA,SMA,RendererA,CardB,SMB,RendererB card
    class CardC,SimpleC simplecard
```

**Layers:**
1. **Home Assistant Layer** - Provides `hass` object with entity states
2. **Singleton Layer** - Shared intelligence systems (rules, data, themes)
3. **Card Instance Layer** - Individual card instances with their rendering
4. **Output Layer** - Final SVG/HTML output to shadow DOM

---

## 🔑 Key Concepts

### Singleton Systems
All intelligence is shared across card instances:
- **RulesEngine** - Conditional logic evaluation
- **DataSourceManager** - Entity subscriptions and data processing (MSD cards)
- **CoreSystemsManager** - Entity caching (Simple Cards)
- **ThemeManager** - Color schemes and styling
- **AnimationManager** - Animation coordination

**See:** [Core Components](core-components.md) for detailed singleton documentation.

### BaseService Pattern
Most singletons extend `BaseService` for consistent lifecycle:
- `updateHass(hass)` - Receive new `hass` object from Home Assistant
- `ingestHass()` - Process and react to hass updates
- Guaranteed lifecycle methods eliminate runtime type checking

### Multi-Card Coordination
- Multiple MSD or Simple cards can coexist on same dashboard
- Singletons provide consistent behavior across all cards
- Entity subscriptions shared (no duplicate subscriptions)
- Rules can target overlays across cards

### Global Data Source and Rules Publication

**Any card can define data sources and rules that become globally available:**

```yaml
# MSD card defines a data source
type: custom:lcards-msd-card
data_sources:
  cpu_temperature:
    entity: sensor.cpu_temp
    window_seconds: 3600
    history: { preload: true, hours: 6 }

# The data source is registered with DataSourceManager singleton
# Any other card can now reference 'cpu_temperature' in templates
```

```yaml
# Simple card defines rules
type: custom:lcards-simple-button
entity: light.bedroom
rules:
  - id: light_on_style
    when:
      entity: light.bedroom
      state: 'on'
    apply:
      style:
        primary: '#00ff00'

# These rules are registered with RulesEngine singleton
# Rule evaluation is shared and distributed to all cards
```

**Benefits:**
- ✅ Define data sources in one place, use everywhere
- ✅ No duplicate Home Assistant subscriptions
- ✅ Shared data processing (transformations, aggregations)
- ✅ Consistent rule evaluation across all cards

---

## 📊 MSD + Simple Cards: Hybrid Architecture

The recommended approach combines MSD cards for layout with embedded Simple Cards for interactions:

| Component | Responsibility |
|-----------|----------------|
| **MSD Card** | Layout, line routing, SVG backgrounds |
| **Simple Cards (embedded)** | Buttons, charts, interactive elements |
| **Simple Cards (standalone)** | Individual controls outside MSD |

**See:** [MSD Flow Part 2](diagrams/MSD%20Flow%20-%20Part%202.md#-msd--simple-cards-together) for detailed examples.

---

## 📚 Detailed Documentation

### Card Types
- **[Simple Card Foundation](cards/simple-card-foundation.md)** - Simple Card architecture
- **[MSD Flow Diagrams](diagrams/)** - MSD initialization and rendering

### Systems
- **[Subsystems](subsystems/)** - Detailed docs for each singleton
- **[Schemas](schemas/)** - Configuration schemas
- **[API Reference](api/)** - Runtime and debug APIs

---

**Status:** Current - reflects singleton architecture with Simple Card foundation
