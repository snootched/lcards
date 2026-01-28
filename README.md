# LCARdS
*A STAR TREK FAN PRODUCTION*
![LCARdS Banner](docs/assets/lcards-banner.gif)
<!--
IMAGE PLACEHOLDER: Hero banner
Suggested: Animated MSD showing cards, lines, animations, and effects
File: docs/assets/lcards-banner.gif
-->

**A unified card system for Home Assistant inspired by the iconic LCARS interface from Star Trek.
<br>Build your own LCARS-style dashboards and Master Systems Display (MSD) with realistic controls and animations.**

[![GitHub release](https://img.shields.io/github/v/release/snootched/LCARdS?display_name=release&logo=startrek&color=37a6d1")](https://github.com/snootched/LCARdS/releases)
[![License](https://img.shields.io/github/license/snootched/LCARdS?logo=opensourceinitiative&logoColor=white)](LICENSE)
[![Last commit](https://img.shields.io/github/last-commit/snootched/LCARdS?style=default&logo=git&logoColor=white&color=37a6d1)](https://github.com/snootched/LCARdS/commits/main)

<br>

> [!IMPORTANT]
> **LCARdS** is a work in progress and not a fully commissioned Starfleet product — expect some tribbles!
>
> This is a **hobby** project, with great community support and contribution.  This is not professional, and should be used for personal use only.
>
> AI coding tools have been leveraged in this project - please see AI disclaimer section below.

<br>

## What is LCARdS?

LCARdS is the next evolution of dedicated LCARS-inspired cards for Home Assistant.
<br>It originates from, and supercedes the  [CB-LCARS](https://github.com/snootched/cb-lcars) project - and is meant to accompany [**HA-LCARS themes**](https://github.com/th3jesta/ha-lcars).
<br>Although deployed and used as individual custom cards - it's built upon common core components that aim to provide a **more complete and cohesive LCARS-like dashboard experience.**

- **Unified architecture** - Every card has access to centralized data sources with entity subcription and notification, cross-card rules, and unified actions.
- **Studio editors** - Most cards now have dedicated editing studio interfaces with live previews - augmented with schema-backed yaml editors for context-aware autocomplete and validation.
- **Extensible design** - Content can be enhanced and distrbuted (future) via content packs - adding button types, sliders styles, animation definitions, and more.

<br>

## Feature Parity with CB-LCARS

If coming from CB-LCARS, use this table to quickly see what the equivalent card/feature is in LCARdS.  Not all features and functions may be available yet, but will be added over time.


Legend:  ✅ Present | ❌ Not present | ⚠️ Partial

| Feature | CB-LCARS | LCARdS | Notes |
|---|:---:|:---:|---|
| Button Card | ✅ <br>`cb-lcars-button-card` | ✅ <br>`lcards-button` | Builtin `preset` collection provides the standard LCARS buttons which are completely configurable. |
| Multi-Segment Buttons | ❌ | ✅ <br>`lcards-button` | Allows for complex SVGs (`component`) to be used as advanced multi-segment/multi-touch controls.  The controls are configured with use of new `segements` configurations. |
| D-PAD Card | ✅ <br>`cb-lcars-dpad-card` | ✅ <br>`lcards-button` | First advanced button to use `component` feature of `lcards-button` card. |
| Label Card | ✅ <br>`cb-lcars-label-card` | ✅ <br>`lcards-button` | Label functionality can by used with `lcards-button`.  Addional presets available for text labels with or without decoration. |
| Elbow Card | ✅ <br>`cb-lcars-elbow-card` | ✅ <br>`lcards-elbow` | Equivalent in LCARdS - enhanced with more corner styles (ie. straight cut with configurable angles) |
| Double Elbow Card | ✅ <br>`cb-lcars-double-elbow-card` | ✅ <br>`lcards-elbow` | Double Elbow functionality is now consolidated into a single unified `lcards-elbow` card.  Available elbow styles will allow for double mode if supported. |
| Slider Card | ✅ <br>`cb-lcars-multimeter-card` | ⚠️ <br>`lcards-slider` | Completely replacing former multimeter card.  Enhanced with much better configuration options for direction, inversion, display min/max, control min/max etc.  Picard-style slider pending. |
| Cascade Data Grid | ⚠️ | ✅ `lcards-data-grid` | CB-LCARS provided decorative only version as background animation.  <br><br>In LCARdS, `lcards-data-grid` is full featured tabular/cell-based grid that can show real entity data, text, etc.  It still supports a decorative mode (generated data) equivalent to CB-LCARS version if desired.  |
| Chart / Graph Card | ❌ | ✅ <br>`lcards-chart` | Embedded ApexCharts library providing access to a variety of charts/graphs types to plot entity/data against. |
| MSD (Master Systems Display) Card | ❌ | ✅ <br>`lcards-msd` | Full MSD system in a card.  Embed controls (other HA cards), connect and route lines, add animations to reflect statuses, etc. |
| Background Animations | ✅ <br>GRID, ALERT, GEO Array, Pulsewave| ❌ | Not yet implmented. |
| Element Animations | ❌ | ✅ | Embedded Anime.js v4 library enabling capability to animate any SVG element (cards, lines/stroke, text, etc.) |
| Symbiont (embedded cards) | ✅ | ❌ | Not yet implmented. |
| State-based Styling / Custom States | ✅ | ✅✅ | CB-LCARS has a limited set of states to control styles.  LCARdS uses both common state groupings [`default`|`active`|`inactive`|`unavailable`] and the ability to definte any state to the list for customized styling.  Integrates with core rules engine for hot-patching card styles. |

<br>


<br>

## Installation

<details>
<summary><b>With HACS (Recommended)</b></summary>

<br>

1. Open HACS in your Home Assistant instance
2. Go to **Frontend** → Click **⊕** button
3. Search for **LCARdS** and install
4. Restart Home Assistant
5. Refresh your browser cache
6. Add LCARdS cards from the dashboard editor

</details>

<details>
<summary><b>Manual Installation</b></summary>

<br>

1. Download `lcards.js` from the [latest release](https://github.com/snootched/LCARdS/releases)
2. Copy to `<config>/www/`
3. Add as a resource in your dashboard (Settings → Dashboards → Resources)
4. Use `/local/lcards.js` as the URL, type: **JavaScript Module**
5. Refresh your browser
6. LCARdS cards are now available in the card picker

</details>

<br>

[![Open in HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=snootched&repository=LCARdS&category=frontend)

**Need help?** Check the [Getting Started Guide →](doc/user-guide/getting-started/)

<br>

---
## LCARdS Features and Design

### 🎯 Unified Architecture & Core Systems
- LCARdS is now based on Lit - moving away from the custom-button-card base of CB-LCARS.
- Cards share a set of common core systems:
  - **Systems Manager** - centralized entity subscriptions and smart card notifications.
  - **Rules Engine** — centralized conditional styling and cross-card behaviors targetable by tags, types, IDs, etc.
  - **Theme Manager** — token-based theming allowing for themes to define many visual aspects.
  - **Animation Framework** — provides fully integrated anime.js v4 with helper methods and a core set of animation presets.
  - **DataSource Manager** — centralized data buffers providing entity history, transformations and aggregations that can be used for runtime visualizations.
- Template support (JavaScript, Jinja2, LCARdS tokens)
- Unified action handlers and lifecycle


### 🎨 Visual Editors
- Card editors have been upgraded with immersive configuration studios.
- Live WYSIWGY configuration.
- Schema-backed YAML editing with inline auto-complete for card options.
- Provenance tracking for configuration layer debugging.

----

<br>

## System Architecture

LCARdS is built on a layered architecture that keeps cards simple while providing powerful shared features:

```mermaid
graph TB
    subgraph "Home Assistant"
        HA[Home Assistant<br/>hass object]
    end

    subgraph "LCARdS Cards"
        Cards[Button, Slider, MSD,<br/>Chart, Data Grid, Elbow]
    end

    subgraph "LCARdS Core<br/>(window.lcards.core)"
        Core[Core Singleton Hub]
    end

    subgraph "Core Systems"
        Systems[Systems Manager<br/>Entity caching & change detection]
        Data[Data Sources<br/>Entity subscriptions & history]
        Rules[Rules Engine<br/>Conditional styling & behavior]
        Theme[Theme Manager<br/>Tokens & colors]
        Anim[Animation Framework<br/>Anime.js integration]
    end

    HA -->|provides state| Cards
    Cards -->|forward updates| Core
    Core -->|distribute| Systems
    Core -->|distribute| Data
    Core -->|distribute| Rules

    Systems -.->|notify| Cards
    Data -.->|notify| Cards
    Rules -.->|apply patches| Cards

    Theme -.->|provide tokens| Cards
    Anim -.->|coordinate| Cards

    Data -->|query entities| HA
    Rules -->|read state| HA

    style HA fill:#4d94ff,stroke:#0066cc,color:#fff
    style Cards fill:#ff9900,stroke:#cc7700,color:#000
    style Core fill:#cc66ff,stroke:#9933cc,color:#000
    style Systems fill:#9999ff,stroke:#6666cc,color:#000
    style Data fill:#9999ff,stroke:#6666cc,color:#000
    style Rules fill:#9999ff,stroke:#6666cc,color:#000
    style Theme fill:#9999ff,stroke:#6666cc,color:#000
    style Anim fill:#9999ff,stroke:#6666cc,color:#000
```
```mermaid
graph TB
    subgraph "Home Assistant"
        HA[Home Assistant]
    end

    subgraph "Your Dashboard"
        Cards[LCARdS Cards<br/>Button • Slider • MSD • Chart • Elbow • Data Grid]
    end

    subgraph "LCARdS Core"
        Core[Shared Intelligence<br/>Rules • Themes • Animations • Data Sources]
    end

    HA -->|entity states| Cards
    Cards -->|updates| Core
    Core -->|rules & styling| Cards
    Core -->|queries| HA

    style HA fill:#4d94ff,stroke:#0066cc,color:#fff
    style Cards fill:#ff9900,stroke:#cc7700,color:#000
    style Core fill:#9999ff,stroke:#6666cc,color:#000
```

```mermaid
graph TB
    subgraph "Home Assistant"
        HA[Home Assistant]
    end

    subgraph "Your Dashboard"
        Button[Button Card]
        Slider[Slider Card]
        Chart[Chart Card]
        Elbow[Elbow Card]
        Grid[Data Grid Card]
        MSD[MSD Card<br/><i>container for cards & controls</i>]
    end

    subgraph "LCARdS Core<br/><i>The Intelligence Layer</i>"
        Rules[Rules Engine]
        Theme[Theme Manager]
        Data[Data Sources]
        Anim[Animations]
        Systems[Systems Manager]
    end

    HA -->|entity data| Button
    HA -->|entity data| Slider
    HA -->|entity data| Chart
    HA -->|entity data| Elbow
    HA -->|entity data| Grid
    HA -->|entity data| MSD

    Button -.->|rely on| Rules
    Slider -.->|rely on| Rules
    Chart -.->|rely on| Data
    Elbow -.->|rely on| Theme
    Grid -.->|rely on| Data
    MSD -.->|rely on| Rules

    Button -.->|rely on| Theme
    Slider -.->|rely on| Systems
    Chart -.->|rely on| Anim
    MSD -.->|rely on| Systems

    style HA fill:#4d94ff,stroke:#0066cc,color:#fff
    style Button fill:#ff9900,stroke:#cc7700,color:#000
    style Slider fill:#ff9900,stroke:#cc7700,color:#000
    style Chart fill:#ff9900,stroke:#cc7700,color:#000
    style Elbow fill:#ff9900,stroke:#cc7700,color:#000
    style Grid fill:#ff9900,stroke:#cc7700,color:#000
    style MSD fill:#ff6600,stroke:#cc4400,color:#fff
    style Rules fill:#9999ff,stroke:#6666cc,color:#000
    style Theme fill:#9999ff,stroke:#6666cc,color:#000
    style Data fill:#9999ff,stroke:#6666cc,color:#000
    style Anim fill:#9999ff,stroke:#6666cc,color:#000
    style Systems fill:#9999ff,stroke:#6666cc,color:#000
```

```mermaid
graph TB
    subgraph "Home Assistant"
        HA[Home Assistant]
    end

    subgraph "LCARdS Core<br/><i>The Intelligence Layer</i>"
        Core[Rules • Themes • Data • Animations • Systems]
    end

    subgraph "Your Dashboard"
        Button[Button Card]
        Slider[Slider Card]
        Chart[Chart Card]
        Elbow[Elbow Card]
        Grid[Data Grid Card]
        MSD[MSD Card<br/><i>container for cards & controls</i>]
    end

    HA <-->|entity data| Core
    Core -.->|provides smarts to| Button
    Core -.->|provides smarts to| Slider
    Core -.->|provides smarts to| Chart
    Core -.->|provides smarts to| Elbow
    Core -.->|provides smarts to| Grid
    Core -.->|provides smarts to| MSD

    style HA fill:#4d94ff,stroke:#0066cc,color:#fff
    style Core fill:#9999ff,stroke:#6666cc,color:#000
    style Button fill:#ff9900,stroke:#cc7700,color:#000
    style Slider fill:#ff9900,stroke:#cc7700,color:#000
    style Chart fill:#ff9900,stroke:#cc7700,color:#000
    style Elbow fill:#ff9900,stroke:#cc7700,color:#000
    style Grid fill:#ff9900,stroke:#cc7700,color:#000
    style MSD fill:#ff6600,stroke:#cc4400,color:#fff
```


```mermaid
graph TB
    HA[Home Assistant]

    subgraph Core["LCARdS Core"]
        direction LR
        Rules[Rules Engine]
        Systems[Systems Manager]
        Data[Data Sources]
        Theme[Theme Manager]
        Anim[Animation Manager]
    end

    Button[Button Card]
    Slider[Slider Card]
    Chart[Chart Card]
    Elbow[Elbow Card]
    Grid[Data Grid Card]
    MSD[MSD Card<br/><i>container</i>]

    HA <--> Core
    Core -.-> Button
    Core -.-> Slider
    Core -.-> Chart
    Core -.-> Elbow
    Core -.-> Grid
    Core -.-> MSD

    style HA fill:#4d94ff,stroke:#0066cc,color:#fff
    style Core fill:#9999ff,stroke:#6666cc,color:#000,stroke-dasharray: 5 5
    style Rules fill:#b8b8ff,stroke:#6666cc,color:#000
    style Systems fill:#b8b8ff,stroke:#6666cc,color:#000
    style Data fill:#b8b8ff,stroke:#6666cc,color:#000
    style Theme fill:#b8b8ff,stroke:#6666cc,color:#000
    style Anim fill:#b8b8ff,stroke:#6666cc,color:#000
    style Button fill:#ff9900,stroke:#cc7700,color:#000
    style Slider fill:#ff9900,stroke:#cc7700,color:#000
    style Chart fill:#ff9900,stroke:#cc7700,color:#000
    style Elbow fill:#ff9900,stroke:#cc7700,color:#000
    style Grid fill:#ff9900,stroke:#cc7700,color:#000
    style MSD fill:#ff6600,stroke:#cc4400,color:#fff
```


```mermaid
graph TB
    HA[Home Assistant]

    subgraph Core["LCARdS Core"]
        direction LR
        Rules[Rules Engine]
        Systems[Systems Manager]
        Data[Data Sources]
        Theme[Theme Manager]
        Anim[Animation Manager]
    end

    Button[Button Card]
    Slider[Slider Card]
    Chart[Chart Card]
    Elbow[Elbow Card]
    Grid[Data Grid Card]
    MSD[MSD Card<br/><i>container</i>]

    HA <--> Rules
    HA <--> Systems
    HA <--> Data

    Core -.-> Button
    Core -.-> Slider
    Core -.-> Chart
    Core -.-> Elbow
    Core -.-> Grid
    Core -.-> MSD

    style HA fill:#4d94ff,stroke:#0066cc,color:#fff
    style Core fill:#9999ff,stroke:#6666cc,color:#000
    style Rules fill:#b8b8ff,stroke:#6666cc,color:#000
    style Systems fill:#b8b8ff,stroke:#6666cc,color:#000
    style Data fill:#b8b8ff,stroke:#6666cc,color:#000
    style Theme fill:#b8b8ff,stroke:#6666cc,color:#000
    style Anim fill:#b8b8ff,stroke:#6666cc,color:#000
    style Button fill:#ff9900,stroke:#cc7700,color:#000
    style Slider fill:#ff9900,stroke:#cc7700,color:#000
    style Chart fill:#ff9900,stroke:#cc7700,color:#000
    style Elbow fill:#ff9900,stroke:#cc7700,color:#000
    style Grid fill:#ff9900,stroke:#cc7700,color:#000
    style MSD fill:#ff6600,stroke:#cc4400,color:#fff
```

```mermaid
graph TB
    subgraph "Home Assistant"
        HA[Home Assistant]
    end

    subgraph Core["LCARdS Core"]
        direction LR
        Rules[Rules Engine]
        Systems[Systems Manager]
        Data[Data Sources]
        Theme[Theme Manager]
        Anim[Animation Manager]
    end

    subgraph Cards["Your Dashboard"]
        direction LR
        Button[Button Card]
        Slider[Slider Card]
        Chart[Chart Card]
        Elbow[Elbow Card]
        Grid[Data Grid Card]
        MSD[MSD Card<br/><i>container</i>]
    end

    HA <--> Rules
    HA <--> Systems
    HA <--> Data

    Core -.-> Cards

    style HA fill:#4d94ff,stroke:#0066cc,color:#fff
    style Core fill:#9999ff,stroke:#6666cc,color:#000
    style Cards fill:#ff9900,stroke:#cc7700,color:#000
    style Rules fill:#b8b8ff,stroke:#6666cc,color:#000
    style Systems fill:#b8b8ff,stroke:#6666cc,color:#000
    style Data fill:#b8b8ff,stroke:#6666cc,color:#000
    style Theme fill:#b8b8ff,stroke:#6666cc,color:#000
    style Anim fill:#b8b8ff,stroke:#6666cc,color:#000
    style Button fill:#ffb84d,stroke:#cc7700,color:#000
    style Slider fill:#ffb84d,stroke:#cc7700,color:#000
    style Chart fill:#ffb84d,stroke:#cc7700,color:#000
    style Elbow fill:#ffb84d,stroke:#cc7700,color:#000
    style Grid fill:#ffb84d,stroke:#cc7700,color:#000
    style MSD fill:#ff6600,stroke:#cc4400,color:#fff
```

```mermaid
graph TB
    subgraph "Home Assistant"
        HA[Home Assistant]
    end

    subgraph Core["LCARdS Core"]
        direction LR
        Rules[Rules Engine]
        Systems[Systems Manager]
        Data[Data Sources]
        Theme[Theme Manager]
        Anim[Animation Manager]
    end

    subgraph "Your Dashboard"
        Button[Button Card]
        Slider[Slider Card]
        Chart[Chart Card]
        Elbow[Elbow Card]
        Grid[Data Grid Card]
        MSD[MSD Card<br/><i>container for cards & controls</i>]
    end

    HA <--> Rules
    HA <--> Systems
    HA <--> Data

    Core -.-> Button
    Core -.-> Slider
    Core -.-> Chart
    Core -.-> Elbow
    Core -.-> Grid
    Core -.-> MSD

    style HA fill:#4d94ff,stroke:#0066cc,color:#fff
    style Core fill:#9999ff,stroke:#6666cc,color:#000
    style Rules fill:#b8b8ff,stroke:#6666cc,color:#000
    style Systems fill:#b8b8ff,stroke:#6666cc,color:#000
    style Data fill:#b8b8ff,stroke:#6666cc,color:#000
    style Theme fill:#b8b8ff,stroke:#6666cc,color:#000
    style Anim fill:#b8b8ff,stroke:#6666cc,color:#000
    style Button fill:#ff9900,stroke:#cc7700,color:#000
    style Slider fill:#ff9900,stroke:#cc7700,color:#000
    style Chart fill:#ff9900,stroke:#cc7700,color:#000
    style Elbow fill:#ff9900,stroke:#cc7700,color:#000
    style Grid fill:#ff9900,stroke:#cc7700,color:#000
    style MSD fill:#ff6600,stroke:#cc4400,color:#fff
```

```mermaid
graph TB
    subgraph "Home Assistant"
        HA[Home Assistant]
    end

    subgraph Core["LCARdS Core"]
        direction LR
        Rules[Rules Engine]
        Systems[Systems Manager]
        Data[Data Sources]
        Theme[Theme Manager]
        Anim[Animation Manager]
    end

    subgraph Cards["Your Dashboard"]
        direction LR
        Button[Button Card]
        Slider[Slider Card]
        Chart[Chart Card]
        Elbow[Elbow Card]
        Grid[Data Grid Card]
        MSD[MSD Card<br/><i>container for cards & controls</i>]
    end

    HA <--> Rules
    HA <--> Systems
    HA <--> Data

    Core -.-> Cards

    style HA fill:#4d94ff,stroke:#0066cc,color:#fff
    style Core fill:#9999ff,stroke:#6666cc,color:#000
    style Cards fill:#ff9900,stroke:#cc7700,color:#000
    style Rules fill:#b8b8ff,stroke:#6666cc,color:#000
    style Systems fill:#b8b8ff,stroke:#6666cc,color:#000
    style Data fill:#b8b8ff,stroke:#6666cc,color:#000
    style Theme fill:#b8b8ff,stroke:#6666cc,color:#000
    style Anim fill:#b8b8ff,stroke:#6666cc,color:#000
    style Button fill:#ffb84d,stroke:#cc7700,color:#000
    style Slider fill:#ffb84d,stroke:#cc7700,color:#000
    style Chart fill:#ffb84d,stroke:#cc7700,color:#000
    style Elbow fill:#ffb84d,stroke:#cc7700,color:#000
    style Grid fill:#ffb84d,stroke:#cc7700,color:#000
    style MSD fill:#ff6600,stroke:#cc4400,color:#fff
```
```mermaid
graph TB
    subgraph "Home Assistant"
        HA[Home Assistant]
    end

    subgraph Core["LCARdS Core"]
        direction LR
        Rules[Rules Engine]
        Systems[Systems Manager]
        Data[Data Sources]
        Theme[Theme Manager]
        Anim[Animation Manager]
    end

    subgraph Cards["Your Dashboard"]
        direction LR
        Button[Button Card]
        Slider[Slider Card]
        Chart[Chart Card]
        Elbow[Elbow Card]
        Grid[Data Grid Card]
        MSD[MSD Card<br/><i>container</i>]
    end

    HA <--> Rules
    HA <--> Systems
    HA <--> Data

    Core -.-> Cards

    style HA fill:#4d94ff,stroke:#0066cc,color:#fff
    style Core fill:#9999ff,stroke:#6666cc,color:#000
    style Cards fill:#ff9900,stroke:#cc7700,color:#000
    style Rules fill:#b8b8ff,stroke:#6666cc,color:#000
    style Systems fill:#b8b8ff,stroke:#6666cc,color:#000
    style Data fill:#b8b8ff,stroke:#6666cc,color:#000
    style Theme fill:#b8b8ff,stroke:#6666cc,color:#000
    style Anim fill:#b8b8ff,stroke:#6666cc,color:#000
    style Button fill:#ffb84d,stroke:#cc7700,color:#000
    style Slider fill:#ffb84d,stroke:#cc7700,color:#000
    style Chart fill:#ffb84d,stroke:#cc7700,color:#000
    style Elbow fill:#ffb84d,stroke:#cc7700,color:#000
    style Grid fill:#ffb84d,stroke:#cc7700,color:#000
    style MSD fill:#ff6600,stroke:#cc4400,color:#fff
```


```mermaid
graph TB
    subgraph "Home Assistant"
        HA[Home Assistant]
    end

    subgraph Core["LCARdS Core"]
        direction LR
        Rules[Rules Engine]
        Systems[Systems Manager]
        Data[Data Sources]
        Theme[Theme Manager]
        Anim[Animation Manager]
    end

    Button[Button Card]
    Slider[Slider Card]
    Chart[Chart Card]
    Elbow[Elbow Card]
    Grid[Data Grid Card]
    MSD[MSD Card<br/><i>container for cards & controls</i>]

    HA <--> Rules
    HA <--> Systems
    HA <--> Data

    Core -.-> Button
    Core -.-> Slider
    Core -.-> Chart
    Core -.-> Elbow
    Core -.-> Grid
    Core -.-> MSD

    style HA fill:#4d94ff,stroke:#0066cc,color:#fff
    style Core fill:#9999ff,stroke:#6666cc,color:#000
    style Rules fill:#b8b8ff,stroke:#6666cc,color:#000
    style Systems fill:#b8b8ff,stroke:#6666cc,color:#000
    style Data fill:#b8b8ff,stroke:#6666cc,color:#000
    style Theme fill:#b8b8ff,stroke:#6666cc,color:#000
    style Anim fill:#b8b8ff,stroke:#6666cc,color:#000
    style Button fill:#ff9900,stroke:#cc7700,color:#000
    style Slider fill:#ff9900,stroke:#cc7700,color:#000
    style Chart fill:#ff9900,stroke:#cc7700,color:#000
    style Elbow fill:#ff9900,stroke:#cc7700,color:#000
    style Grid fill:#ff9900,stroke:#cc7700,color:#000
    style MSD fill:#ff6600,stroke:#cc4400,color:#fff
```
```mermaid
graph TB
    subgraph "Home Assistant"
        HA[Home Assistant]
    end

    subgraph Core["LCARdS Core"]
        direction LR
        Rules[Rules Engine]
        Systems[Systems Manager]
        Data[Data Sources]
        Theme[Theme Manager]
        Anim[Animation Manager]
    end

    subgraph Cards["Your Dashboard"]
        direction LR
        Button[Button Card]
        Slider[Slider Card]
        Chart[Chart Card]
        Elbow[Elbow Card]
        Grid[Data Grid Card]
        MSD[MSD Card<br/><i>container</i>]
    end

    HA <--> Core
    Core -.-> Button
    Core -.-> Slider
    Core -.-> Chart
    Core -.-> Elbow
    Core -.-> Grid
    Core -.-> MSD

    style HA fill:#4d94ff,stroke:#0066cc,color:#fff
    style Core fill:#9999ff,stroke:#6666cc,color:#000
    style Cards fill:#cccccc,stroke:#999999,color:#000
    style Rules fill:#b8b8ff,stroke:#6666cc,color:#000
    style Systems fill:#b8b8ff,stroke:#6666cc,color:#000
    style Data fill:#b8b8ff,stroke:#6666cc,color:#000
    style Theme fill:#b8b8ff,stroke:#6666cc,color:#000
    style Anim fill:#b8b8ff,stroke:#6666cc,color:#000
    style Button fill:#ffb84d,stroke:#cc7700,color:#000
    style Slider fill:#ffb84d,stroke:#cc7700,color:#000
    style Chart fill:#ffb84d,stroke:#cc7700,color:#000
    style Elbow fill:#ffb84d,stroke:#cc7700,color:#000
    style Grid fill:#ffb84d,stroke:#cc7700,color:#000
    style MSD fill:#ff6600,stroke:#cc4400,color:#fff
```
```mermaid
graph TB
    subgraph "Home Assistant"
        HA[Home Assistant]
    end

    subgraph Core["LCARdS Core"]
        direction LR
        Rules[Rules Engine]
        Systems[Systems Manager]
        Data[Data Sources]
        Theme[Theme Manager]
        Anim[Animation Manager]
    end

    subgraph Cards["Your Dashboard"]
        direction LR
        Button[Button Card]
        Slider[Slider Card]
        Chart[Chart Card]
        Elbow[Elbow Card]
        Grid[Data Grid Card]
        MSD[MSD Card<br/><i>container</i>]
    end

    HA <--> Rules
    HA <--> Systems
    HA <--> Data

    Core -.-> Button
    Core -.-> Slider
    Core -.-> Chart
    Core -.-> Elbow
    Core -.-> Grid
    Core -.-> MSD

    style HA fill:#4d94ff,stroke:#0066cc,color:#fff
    style Core fill:#9999ff,stroke:#6666cc,color:#000
    style Cards fill:#cccccc,stroke:#999999,color:#000
    style Rules fill:#b8b8ff,stroke:#6666cc,color:#000
    style Systems fill:#b8b8ff,stroke:#6666cc,color:#000
    style Data fill:#b8b8ff,stroke:#6666cc,color:#000
    style Theme fill:#b8b8ff,stroke:#6666cc,color:#000
    style Anim fill:#b8b8ff,stroke:#6666cc,color:#000
    style Button fill:#ffb84d,stroke:#cc7700,color:#000
    style Slider fill:#ffb84d,stroke:#cc7700,color:#000
    style Chart fill:#ffb84d,stroke:#cc7700,color:#000
    style Elbow fill:#ffb84d,stroke:#cc7700,color:#000
    style Grid fill:#ffb84d,stroke:#cc7700,color:#000
    style MSD fill:#ff6600,stroke:#cc4400,color:#fff
```
```mermaid
graph TB
    subgraph "Home Assistant"
        direction LR
        HA[Home Assistant]
    end

    subgraph Core["LCARdS Core"]
        direction LR
        Rules[Rules Engine]
        Systems[Systems Manager]
        Data[Data Sources]
        Theme[Theme Manager]
        Anim[Animation Manager]
    end

    subgraph Cards["Your Dashboard"]
        direction LR
        Button[Button Card]
        Slider[Slider Card]
        Chart[Chart Card]
        Elbow[Elbow Card]
        Grid[Data Grid Card]
        MSD[MSD Card]
    end

    HA <--> Core
    Core -.-> Cards

    style HA fill:#4d94ff,stroke:#0066cc,color:#fff
    style Core fill:#9999ff,stroke:#6666cc,color:#000
    style Cards fill:#ff9900,stroke:#cc7700,color:#000
    style Rules fill:#b8b8ff,stroke:#6666cc,color:#000
    style Systems fill:#b8b8ff,stroke:#6666cc,color:#000
    style Data fill:#b8b8ff,stroke:#6666cc,color:#000
    style Theme fill:#b8b8ff,stroke:#6666cc,color:#000
    style Anim fill:#b8b8ff,stroke:#6666cc,color:#000
    style Button fill:#ffb84d,stroke:#cc7700,color:#000
    style Slider fill:#ffb84d,stroke:#cc7700,color:#000
    style Chart fill:#ffb84d,stroke:#cc7700,color:#000
    style Elbow fill:#ffb84d,stroke:#cc7700,color:#000
    style Grid fill:#ffb84d,stroke:#cc7700,color:#000
    style MSD fill:#ff6600,stroke:#cc4400,color:#fff
```
---

## The Fleet


### Button Card [`lcards-button`]

![Button Card Samples](docs/assets/card-button-samples.png)
<!--
IMAGE PLACEHOLDER: Button card varieties
Show: Lozenge, bullet, capped, Picard variants in active/inactive states
File: docs/assets/card-button-samples.png
-->

Provides all standard LCARS buttons, plus advanced multi-segment/multi-function buttons.

<details>
<summary><b>Key Features</b></summary>

- Multiple preset styles (lozenge, bullet, capped, Picard, text, etc.)
- Complex SVG `component` with configurabale interactive `segments` for multi-funtion buttons.
- Dynamic state-based styling.
- Full rules engine and template support.
- Multiple custom text fields supported with full configuration and template support.

**[→ Full Documentation](doc/user-guide/)**

</details>

---

### Slider Card [`lcards-slider`]

![Slider Card Samples](docs/assets/card-slider-samples.png)
<!--
IMAGE PLACEHOLDER: Slider/multimeter samples
Show: Horizontal pills, vertical gauge, Picard style in 2-3 examples
File: docs/assets/card-slider-samples.png
-->

Interactive sliders for display of sensors, and control of entities.

<details>
<summary><b>Key Features</b></summary>

- Multiple presets available (pills and gauge mode)
- Horizontal and vertical orientations
- Full display and control inversion options (ie. for cover support.)
- Both display min/max settings and control min/max settings.

**[→ Full Documentation](doc/user-guide/)**

</details>

---

### Elbow Card [`lcards-elbow`]

![Elbow Card Samples](docs/assets/card-elbow-samples.png)
<!--
IMAGE PLACEHOLDER: Elbow card varieties
Show: Header-left, header-right, footer variants, simple and segmented styles
File: docs/assets/card-elbow-samples.png
-->

Classic LCARS corner designs for authentic interface aesthetics.

<details>
<summary><b>Key Features</b></summary>

- Header/footer positioning with left/right orientation
- Simple (single elbow) and segmented (double elbow) modes
- Multiple elbow types available (header, footer, open, contained, etc)
- Mutiple elbow style presets available: standard LCARS arc, corner-cuts with configurable angles.
- Extends `lcards-button` and inherits functionality (multi-text fields, actions, rules, animations, templates)

**[→ Full Documentation](doc/user-guide/)**

</details>

---

### MSD (Master Systems Display) Card [`lcards-msd`]

![MSD Card Sample](docs/assets/card-msd-sample.gif)
<!--
IMAGE PLACEHOLDER: MSD card in action
Show: Animated MSD with multiple blocks, dynamic lines, embedded animations
File: docs/assets/card-msd-sample.gif
-->

![MSD Studio Editor](docs/assets/msd-studio-editor.png)
<!--
IMAGE PLACEHOLDER: MSD Studio editor
Show: Studio editor open with config overlay, block diagram, provenance panel visible
File: docs/assets/msd-studio-editor.png
-->

Highly configurable canvas with multi-card and routing line support.

<details>
<summary><b>Key Features</b></summary>

- Multiple controls per MSD (controls are other HA cards.)
- Dynamic connecting lines and animations
- **Studio Editor**: Drag-and-drop visual configuration with live preview.


**[→ Full Documentation](doc/user-guide/advanced/msd-controls.md)**

</details>

---

### Chart Card [`lcards-chart`]

![Chart Card Samples](docs/assets/card-chart-samples.png)
<!--
IMAGE PLACEHOLDER: Chart card examples
Show: Line chart, area chart, bar chart with LCARS theming
File: docs/assets/card-chart-samples.png
-->

LCARdS integrated charting card powered by ApexCharts library.

<details>
<summary><b>Key Features</b></summary>

- 15+ chart types (line, area, bar, pie, scatter, heatmap, radar)
- Real-time entity updates with multi-series support
- Advanced data sources with history preload
- Automatic data transformations from LCARdS datasources/entities to ApexChards data series.

**[→ Full Documentation](doc/user-guide/configuration/overlays/apexcharts-overlay.md)**

</details>

---

### Data Grid Card [`lcards-data-grid`]

![Data Grid Sample](docs/assets/card-data-grid-sample.gif)
<!--
IMAGE PLACEHOLDER: Data grid with cascade animation
Show: Grid with cascade animation and entity data updates
File: docs/assets/card-data-grid-sample.gif
-->

LCARS data grids with configurable data modes and cascade animations.

<details>
<summary><b>Key Features</b></summary>

- Multiple modes available: decorative mode (random generated data) and data mode (real entity data.)
- Cascade animation with LCARS color cycling.
- Static text and templates supported.
- "spreadsheet" mode with configurable column and row headers.
- Hierarchical cascading styles: table-level defaults with overrides available at column, row, and cell level.

**[→ Full Documentation](doc/user-guide/)**

</details>

---

**[→ View Full Documentation](doc/user-guide/)**

<br>

---

## Card Configuration Studios

Most LCARdS cards feature dedicated immersive graphical dialogs that provide a more interactive experience to configure card settings.  Look for the ***[Open Configuration Studio**]* launcher button in the card's main configuration tab.

![Studio Editing Experience](docs/assets/studio-editing-ui.png)
<!--
IMAGE PLACEHOLDER: Studio editor showcase
Show: MSD studio open
File: docs/assets/studio-editing-ui.png
-->

> [!TIP]
> **Edit like a Starfleet engineer.** Studio editors make complex configurations intuitive, powerful features discoverable, and mistakes reversible.

<br>

---

## Main Engineering

![Main Engineering Dialogs](docs/assets/main-engineering-dialogs.png)
<!--
IMAGE PLACEHOLDER: Main Engineering UI
Show: Screenshots of alert mode selector, theme browser, provenance tracker dialogs
File: docs/assets/main-engineering-dialogs.png
-->

LCARdS centralized systems [core systems] are available for discovery, inspection, configuration via the `Main Engineering` tab of any LCARdS card editor.
Here you can access things like data sources, provenance tracking, theme browsing and alert modes, etc.

<table>
<tr>
<td width="33%">

### Data Sources
- View all data sources in the system: local (defined in this card) and global (defined in other cards)
- Interactive browsing of data sources and their buffers, aggregations, and trnasformations

</td>
<td width="33%">

### Theme Browser
- Browse and view theme tokens and CSS variables live
- View and configure alert mode settings **

</td>
<td width="33%">

### Provenance Tracking
- See change history for each card


</td>
</tr>
<tr>
<td width="33%">

### tbd

</td>
<td width="33%">

### Rules Engine
- View rules in the system

</td>
<td width="33%">

### tbd

</td>
</tr>
</table>

<br>

---

## Built to Extend

LCARdS is (aiming for) designed for **extensibility and community contribution** by way of a *pack system*.
Packs can contain themes (token definitions), button presets, configuration definitions, inline component SVGs, links and metadata for external SVGs, animation and font definitions etc.


TODO: change to pack merging example

```mermaid
graph LR
    subgraph BuiltinPacks["Builtin Packs"]
        P1["lcards_buttons<br/>v1.12.0<br/><br/>• style_presets"]
        P2["lcards_sliders<br/>v1.12.0<br/><br/>• style_presets"]
        P3["builtin_themes<br/>v1.12.0<br/><br/>• themes"]
        P4["lcars_fx<br/>v1.12.0<br/><br/>• animations<br/>• rules"]
    end

    subgraph ExternalPacks["External/User Packs"]
        E1["ds9_pack<br/>v2.0.0<br/><br/>• themes<br/>• style_presets<br/>• svg_assets<br/>• animations"]
        E2["voyager_pack<br/>v1.5.0<br/><br/>• themes<br/>• font_assets<br/>• rules"]
        E3["uss_enterprise_msd<br/>v1.0.0<br/><br/>• svg_assets<br/>• animations"]
    end

    subgraph PackMgr["PackManager<br/>(Orchestrator)"]
        PM[Pack Loader &<br/>Content Distributor]
    end

    subgraph Managers["Core Singleton Managers"]
        TM[ThemeManager<br/>Theme tokens]
        SPM[StylePresetManager<br/>Button & slider presets]
        AR[AnimationRegistry<br/>Animation definitions]
        RE[RulesEngine<br/>Conditional rules]
        AM[AssetManager<br/>SVG & font assets]
    end

    P1 --> PM
    P2 --> PM
    P3 --> PM
    P4 --> PM
    E1 --> PM
    E2 --> PM
    E3 --> PM

    PM -->|themes| TM
    PM -->|style_presets| SPM
    PM -->|animations| AR
    PM -->|rules| RE
    PM -->|svg_assets<br/>font_assets| AM

    TM -.->|consumed by| Cards[Cards]
    SPM -.->|consumed by| Cards
    AR -.->|consumed by| Cards
    RE -.->|consumed by| Cards
    AM -.->|consumed by| Cards

    style P1 fill:#6699ff,stroke:#3366cc,color:#000
    style P2 fill:#6699ff,stroke:#3366cc,color:#000
    style P3 fill:#6699ff,stroke:#3366cc,color:#000
    style P4 fill:#6699ff,stroke:#3366cc,color:#000
    style E1 fill:#66cc99,stroke:#339966,color:#000
    style E2 fill:#66cc99,stroke:#339966,color:#000
    style E3 fill:#66cc99,stroke:#339966,color:#000
    style PM fill:#cc66ff,stroke:#9933cc,color:#000
    style TM fill:#9999ff,stroke:#6666cc,color:#000
    style SPM fill:#9999ff,stroke:#6666cc,color:#000
    style AR fill:#9999ff,stroke:#6666cc,color:#000
    style RE fill:#9999ff,stroke:#6666cc,color:#000
    style AM fill:#9999ff,stroke:#6666cc,color:#000
    style Cards fill:#ff9900,stroke:#cc7700,color:#000
```

**Key Concepts:**
- **Packs are content distribution units** containing any combination of: `themes`, `style_presets`, `animations`, `rules`, `svg_assets`, `font_assets`
- **Single packs can contain multiple content types** (e.g., lcars_buttons has both style_presets and components)
- **PackManager orchestrates distribution** at core initialization, registering content to appropriate managers
- **Cards consume from managers**, not packs directly — enabling clean separation and hot-swapping
- **Community extensibility** — custom packs can extend LCARdS with new themes, button styles, animations, and more
-
Check out the [Developer Documentation →](doc/architecture/)

<br>

---

## Documentation

| Resource | Description |
|----------|-------------|
| [📖 User Guide](doc/user-guide/) | Complete guide to using LCARdS |
| [🚀 Getting Started](doc/user-guide/getting-started/) | Installation and first card tutorial |
| [🎨 Configuration](doc/user-guide/configuration/) | All card types and configuration |
| [🎭 Theming](doc/user-guide/advanced/theme_creation_tutorial.md) | Themes and token system |
| [⚙️ Rules Engine](doc/user-guide/configuration/rules.md) | Cross-card rules and automation |
| [🏗️ Architecture](doc/architecture/) | Developer docs and system design |
| [❓ Getting Started](doc/user-guide/getting-started/) | Common questions and solutions |

<br>

---

## Acknowledgements & Thanks

A very sincere thanks to these projects and their authors, contributors and communities for doing what they do, and making it available.  It really does make this a fun hobby to tinker with.

[**ha-lcars theme**](https://github.com/th3jesta/ha-lcars) (the definitive LCARS theme for HA!)

[**lovelace-layout-card**](https://github.com/thomasloven/lovelace-layout-card)

[**lovelace-card-mod**](https://github.com/thomasloven/lovelace-card-mod)

<br>
As well, some shout-outs and attributions to these great projects:
<br><br>

[LCARSlad London](https://twitter.com/lcarslad) for excellent LCARS images and diagrams for reference.

[meWho Titan.DS](https://www.mewho.com/titan) for such a cool interactive design demo and colour reference.

[TheLCARS.com]( https://www.thelcars.com) a great LCARS design reference, and the original base reference for Data Cascade and Pulsewave animations.

[lcars](https://github.com/joernweissenborn/lcars) for the SVG used inline in the dpad control.

- **All Star Trek & LCARS fans** - Your passion drives this project 🖖

<br>

---

## License & Disclaimers

This project uses the MIT License. For more details see [LICENSE](LICENSE)

---
A STAR TREK FAN PRODUCTION

This project is a non-commercial fan production. Star Trek and all related marks, logos, and characters are solely owned by CBS Studios Inc.
This fan production is not endorsed by, sponsored by, nor affiliated with CBS, Paramount Pictures, or any other Star Trek franchise.

No commercial exhibition or distribution is permitted. No alleged independent rights will be asserted against CBS or Paramount Pictures.
This work is intended for personal and recreational use only.

---

### AI-Assisted Development Notice (AIG‑2)

This project is heavily developed with the assistance of AI tools.  Most implementation code and portions of the documentation were generated by AI models.
<br>All architectural decisions, design direction, integration strategy, and project structure are human-led.
<br>All AI-generated components are reviewed, validated, tested, and refined by human contributors to ensure accuracy, coherence, and consistency with project standards.

This is a human-directed, AI-assisted project. AI acts as an implementation accelerator; humans remain responsible for decisions, quality control, and final output.

---

🖖 **Live long and prosper** 🖖
