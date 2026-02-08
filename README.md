# LCARdS
*A STAR TREK FAN PRODUCTION*
![LCARdS Banner](doc/img/lcards-banner.png)
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
> AI coding tools have been leveraged in this project - please see the [AI Usage](#ai-usage) section below for details.

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
2. Search for **LCARdS** and install
3. Refresh your browser cache
4. Add LCARdS cards from the dashboard editor

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

<br>

---
## LCARdS Features and Design

### 🎯 Unified Architecture & Core Systems
- LCARdS is now based on Lit - moving away from the custom-button-card base of CB-LCARS.
- LCARdS makes use of popular libaries under the hook like **[ApexCharts](https://apexcharts.com)**, **[Animje.js](https://animejs.com)**, and **[d3](https://d3js.org/)** components.
- The cards share a set of common core systems:
  - **Systems Manager** - centralized entity subscriptions and smart card notifications (reducing multiple subscriptions on same entities)
  - **Rules Engine** — centralized processing of conditional styling and cross-card behaviors - send updates to multiple cards targetable by tags, types, IDs, etc.
  - **Theme Manager** — token-based theming allowing for themes to define many visual aspects.
  - **Animation Framework** — provides fully integrated anime.js v4 with helper methods and a core set of animation presets.
  - **DataSource Manager** — centralized data buffers providing runtime entity history, and processors to transform output for card usage such as charting visualizations.
  - ..and more
- Template support (JavaScript, Jinja2, LCARdS tokens)

### 🎨 Visual Editors
- Card editors have been upgraded with immersive configuration studios.
- Live WYSIWGY configuration.
- Schema-backed YAML editing with inline auto-complete for card options.
- Provenance tracking for configuration layer debugging.

----

<br>

## System Architecture

LCARdS is built on a layered architecture that aims keeps cards simple.  The cards leverage the shared core for accessing powerful features:

```mermaid
graph LR
    subgraph HA["Home Assistant"]
        HACore[HA Core]
    end

    subgraph CORE["LCARdS Core"]
       subgraph CoreSystems["window.lcards.core.*"]
            direction LR
            CoreRules[Rules Engine]:::coreStyle
            CoreThemes[Theme Manager]:::coreStyle
            CoreData[Data Source Manager]:::coreStyle
            CoreSystemsMgr[Systems Manager]:::coreStyle
            CoreAnim[Animation Manager]:::coreStyle
            CoreOther[...other core systems]:::coreStyle
        end
    end

    subgraph DASHBOARD["Dashboard"]
        Button([LCARdS Button Card]):::lcardsStyle
        Elbow(["LCARdS Elbow Card"]):::lcardsStyle
        Slider([LCARdS Slider Card]):::lcardsStyle
        Chart([LCARdS Chart Card]):::lcardsStyle
        Grid([LCARdS Data Grid Card]):::lcardsStyle
        subgraph MSD[LCARdS MSD Card]
            Card1([HA Cards]):::lcardsStyle
            MSDLCARdS([LCARdS Cards]):::lcardsStyle
        end
    end

    HACore 0@-..-CoreSystems
    CoreSystems 1@-...- Button
    CoreSystems 2@-.- Slider
    CoreSystems 3@-.- Chart
    CoreSystems 4@-.- Elbow
    CoreSystems 5@-.- Grid
    CoreSystems 6@-.- MSD
    CoreSystems 7@-.- MSDLCARdS

    0@{ animate: slow }
    1@{ animate: slow }
    2@{ animate: slow }
    3@{ animate: slow }
    4@{ animate: slow }
    5@{ animate: slow }
    6@{ animate: slow }
    7@{ animate: slow }

    linkStyle 0,1,2,3,4,5,6,7 stroke:#00eeee,stroke-width:3px

    classDef lcardsStyle fill:#ffb399,stroke:#e7442a,color:#000
    classDef coreStyle fill:#6d748c,stroke:#d2d5df

    style HA fill:#1c3c55,stroke:#37a6d1,color:#fff
    style HACore fill:#37a6d1,stroke:#93e1ff,color:#fff

    style CORE fill:#1e2229,stroke:#2f3749
    style CoreSystems fill:#2f3749,stroke:#52596e

    style DASHBOARD fill:#2f3749,stroke:#52596e
    style MSD fill:#e7442a,stroke:#ffb399,color:#fff
```

---

## The Fleet


### Button Card [`lcards-button`]

![Button Card Samples](doc/img/lcards-button.png)

Provides all standard LCARS buttons, plus advanced multi-segment/multi-function buttons.

<details>
<summary><b>Key Features</b></summary>

- Multiple preset styles (lozenge, bullet, capped, outline, text, etc.)
- For more complex shapes - SVG `component` function providing configurabale interactive `segments` to create multi-funtion buttons.
- Dynamic state-based styling.
- Multiple custom text fields supported with full configuration and template support.

**[Button Documentation](doc/user/cards/button/button.md)**

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

- Multiple components and presets available
- Out of the box Pills, Gauge, and `Picard mode`)
- Horizontal and vertical orientations
- Full display and control inversion options
- Configure differnt min/max settings for the display and the slider control

**[Slider Documentation](doc/user/cards/slider/slider.md)**

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
- Supports optional HA-LCARS input helper binding for sizing controls.

**[Elbow Documentation](doc/user/cards/elbow/elbow.md)**

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

- Add multiple controls per MSD (controls are other HA cards.)
- Dynamic connecting lines and animations
- **Studio Editor**: Drag-and-drop visual configuration with live preview.


**[MSD Documentation](doc/user/cards/msd/msd.md)**

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
- Automatic data transformations from LCARdS datasources or HA entities to ApexCharts data series format.

**[Chart Documentation](doc/user/cards/chart/chart.md)**

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
- Customizable data-cascade animation with LCARS color cycling.
- Static text and templates supported.
- "spreadsheet"-like configuration in configuration studio
- Hierarchical cascading styles: table-level defaults with overrides available at column, row, and cell level.

**[Data-Grid Documentation](doc/user/cards/data-grid/data-grid.md)**

</details>

<br>

---

## Card Editors and Configuration Studios

The aim is for LCARdS to have as much UI-based configuration as it can - but also to be easy to learn and navigate.  Of course, YAML is always available - and UI-editors have a schema-enhanced YAML editing tab to help with validation and auto-complete.


Above the standard HA editor - some cards feature a more immersive graphicalal environment - *Configuration Studio*  You can use these editors to quickly get set up and out of spacedock.


> [!TIP]
> Look for the ***[Open Configuration Studio]*** launcher button in the card's main configuration tab.

![Studio Editing Experience](docs/assets/studio-editing-ui.png)
<!--
IMAGE PLACEHOLDER: Studio editor showcase
Show: MSD studio open
File: docs/assets/studio-editing-ui.png
-->


<br>

---

## Main Engineering

![Main Engineering Dialogs](docs/assets/main-engineering-dialogs.png)
<!--
IMAGE PLACEHOLDER: Main Engineering UI
Show: Screenshots of alert mode selector, theme browser, provenance tracker dialogs
File: docs/assets/main-engineering-dialogs.png
-->

Access to LCARdS core systems are available from the `Main Engineering` tab of any LCARdS card editor.

From here you can access and manage data sources, inspect provenance tracking, brows theme/CSS variables provided by LCARdS and HA-LCARS, edit alert modes, and more.

<table>

<tr>
<td width="40%">

### Data Sources
- View all registered LCARdS data sources: local (defined by this card) and global (defined by other cards)
- Create, Edit, Remove data sources and processing buffers.
- Interactively browse any data source and its data and processor buffers.

</td>

<td width="60%">

![datasource browser](doc/img/ds-browser.png)

</td>
</tr>

<tr>
<td width="40%">

### Theme Browser
- Browse and view theme tokens and CSS variables live
- View and configure alert mode settings **

</td>

<td width="60%">

![theme browser](doc/img/theme-browser.png)

</td>

</tr>

<tr>
<td width="40%">

### Provenance Tracking
- Inpect the effective/runtime card configuration.
- View which system provided the final value for each config option.
- Discover if a rule has changed any style of the card during runtime.

</td>

<td width="60%">

![provenance browser](doc/img/provenance-browser.png)

</td>

</tr>

<tr>
<td width="40%">

### Rules Engine
- View all rules in the system
- See rules affecting this card
- (future) Access Rule Builder studio

</td>

<td width="60%">

![rules browser](doc/img/rules-browser.png)

</td>

</tr>
</table>

<br>

---

## Built to Extend

LCARdS design is aiming to have an extensbile architecture that can enable **customization and community contribution** by way of a *pack system*.


```mermaid
flowchart TB
    subgraph BuiltinPacks["<b>Builtin Packs</b>"]
        P1["lcards_buttons<br/>v2026.x.y<br/><br/><code>- style_presets [buttons]</code>"]:::builtinPacksStyle
        P2["lcards_sliders<br/>v2026.x.y<br/><br/><code>- style_presets [sliders]</code>"]:::builtinPacksStyle
        P3["builtin_themes<br/>v2026.x.y<br/><br/><code>- themes</code>"]:::builtinPacksStyle
        P4["lcars_fx<br/>v2026.x.y<br/><br/><code>- animations<br/>- rules</code>"]:::builtinPacksStyle
    end

    subgraph ExternalPacks["<b>External/User Packs</b>"]
        E1["ds9_pack<br/>v2.0.0<br/><br/><code>- themes<br/>- style_presets<br/>- svg_assets<br/>- animations</code>"]:::externalPacksStyle
        E2["voyager_pack<br/>v1.5.0<br/><br/><code>- themes<br/>- font_assets<br/>- rules</code>"]:::externalPacksStyle
        E3["msd_collection<br/>v1.0.0<br/><br/><code>- svg_assets<br/>- animations</code>"]:::externalPacksStyle
    end

    subgraph PackMgr["<b>PackManager</b>"]
        PM[Pack Loader &<br/>Content Distributor]
    end

    subgraph CoreSystems["<b>Core Systems</b>"]
        TM[ThemeManager<br/>Theme tokens]:::coreStyle
        SPM[StylePresetManager<br/>Button & slider presets]:::coreStyle
        AR[AnimationRegistry<br/>Animation definitions]:::coreStyle
        RE[RulesEngine<br/>Conditional rules]:::coreStyle
        AM[AssetManager<br/>SVG & font assets]:::coreStyle
    end

    P1 0@--- PM
    P2 1@--- PM
    P3 2@--- PM
    P4 3@--- PM
    E1 4@--- PM
    E2 5@--- PM
    E3 6@--- PM

    PM 7@---|themes| TM
    PM 8@---|style_presets| SPM
    PM 9@---|animations| AR
    PM 10@---|rules| RE
    PM 11@---|svg_assets<br/>font_assets| AM

    TM 12@-.- Cards([LCARdS Cards])
    SPM 13@-.- Cards
    AR 14@-.- Cards
    RE 15@-.- Cards
    AM 16@-.- Cards



    0@{ animate: slow }
    1@{ animate: slow }
    2@{ animate: slow }
    3@{ animate: slow }
    4@{ animate: slow }
    5@{ animate: slow }
    6@{ animate: slow }
    7@{ animate: slow }
    8@{ animate: slow }
    9@{ animate: slow }
    10@{ animate: slow }
    11@{ animate: slow }
    12@{ animate: slow }
    13@{ animate: slow }
    14@{ animate: slow }
    15@{ animate: slow }
    16@{ animate: slow }

    linkStyle 0,1,2,3 stroke:#67caf0,stroke-width:3px
    linkStyle 4,5,6 stroke:#f9ef97,stroke-width:3px
    linkStyle 7,8,9,10,11 stroke:#00eeee,stroke-width:3px,color:#fff
    linkStyle 12,13,14,15,16 stroke:#ffb399,stroke-width:3px

    style BuiltinPacks fill:#2f3749,stroke:#52596e
    style ExternalPacks fill:#2f3749,stroke:#52596e
    style CoreSystems fill:#1e2229,stroke:#2f3749
    style Cards fill:#e7442a,stroke:#ffb399,color:#fff
    style PM fill:#1c3c55,stroke:#37a6d1,color:#fff
    style PackMgr fill:#2f3749,stroke:#52596e

    classDef builtinPacksStyle fill:#2a7193,stroke:#67caf0,color:#fff
    classDef externalPacksStyle fill:#ac943b,stroke:#f9ef97,color:#fff
    classDef coreStyle fill:#2f3749,stroke:#52596e
```

**Key Concepts:**
- **Packs are content distribution units** containing any combination of: `themes`, `style_presets`, `animations`, `rules`, `svg_assets`, `font_assets`, and future types.
- **Single packs can contain multiple content types** (e.g., lcars_buttons has both style_presets and components)
- **PackManager orchestrates the merge and distribution** at core initialization - registering content to appropriate managers
- **Cards consume from managers**, not packs directly — enabling clean separation from the cards
- **Community extensibility** — custom packs will be able to extend LCARdS with new themes, button styles, animations, and more

Check out the [Developer Documentation →](doc/architecture/)

<br>

---
## AI Usage

<details>
<summary>AI-Assisted Development Notice (AIG‑2)</summary>

<i>This project is heavily developed with the assistance of AI tools.  Most implementation code and portions of the documentation were generated by AI models.
<br>All architectural decisions, design direction, integration strategy, and project structure are human-led.
<br>AI-generated components are reviewed, validated/tested, and refined by human contributors to ensure accuracy, coherence, and consistency with project standards.

This is a human-directed, AI-assisted project. AI acts as an implementation accelerator; humans remain responsible for decisions, testing for quality control, and final output.</i>
</details>

<br>
This project is as much as an experimentation with various AI-enabled tools and learning about different software designs as it is about the creation of the actual custom cards.

<br>
Different models are used throughout the process to plan, create, and (ultimately) refactor the cards and systems.  As we gain more experience, and develop more ideas, then systems are revisited.  We attempt to further standardize, simplify, and optimize where we can as we go.

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

[TheLCARS.com]( https://www.thelcars.com) a great LCARS design reference, and the original base reference for colours, Data Cascade and Pulsewave animations.

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

🖖 **Live long and prosper** 🖖
