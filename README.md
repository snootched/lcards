# LCARdS

![LCARdS Banner](docs/assets/lcards-banner.gif)
<!-- 
IMAGE PLACEHOLDER: Hero banner
Suggested: Animated MSD showing cards, lines, animations, and effects
File: docs/assets/lcards-banner.gif
-->

**A unified card ecosystem for Home Assistant inspired by Star Trek LCARS**

[![GitHub release](https://img.shields.io/github/v/release/snootched/LCARdS?display_name=release)](https://github.com/snootched/LCARdS/releases)
[![License](https://img.shields.io/github/license/snootched/LCARdS)](LICENSE)
[![Last commit](https://img.shields.io/github/last-commit/snootched/LCARdS)](https://github.com/snootched/LCARdS/commits/main)
[![Docs](https://img.shields.io/badge/docs-snootched.github.io%2Flcards-ff6753)](https://snootched.github.io/lcards/)

<br>

## 📖 Documentation

Full documentation is available at **https://snootched.github.io/lcards/**

> The `doc/` folder contains the Markdown source — browse it directly on GitHub or visit the docs site for the full rendered experience with search, navigation, and diagrams.

<br>

## What is LCARdS?

LCARdS isn't just another custom card—it's a **complete LCARS dashboard platform** for Home Assistant.

Build immersive, interactive Star Trek dashboards with:
- **Unified architecture** - Every card shares powerful reactivity, cross-card rules, and unified actions
- **Studio editors** - Immersive, wizard-driven interfaces with live preview and provenance tracking
- **Extensible design** - Community can create and share UI packs, themes, and animations
- **No backend required** - Data transformations run in your browser for real-time dashboards

> [!TIP]
> LCARdS cards work together as a **system**, not as isolated components. Define rules once, apply across all cards. Create data sources that multiple cards can share. Build dashboards that feel alive.

**Ready to build your own starship interface?** [Get started →](doc/user-guide/getting-started/)

<br>

## Why Choose LCARdS?

<table>
<tr>
<td width="50%">

### 🎯 Unified Card API
Every card shares the same powerful base:
- Cross-card rules and reactivity
- Tag-based targeting system
- Unified action handlers
- Template support (JS, tokens, Jinja2)

</td>
<td width="50%">

### 🎨 Immersive Studio Editors
Edit like Starfleet engineers:
- Visual, context-aware editors
- Live preview with undo history
- Provenance tracking
- "Main Engineering" system dialogs

</td>
</tr>
<tr>
<td width="50%">

### 🔧 Advanced Systems
Platform-level features:
- **Rules Engine** - Conditions, actions, cross-card behaviors
- **Systems Manager** - Centralized notifications and overlays
- **Theme Manager** - Token-based theming with live switching
- **Animation Framework** - Rich, customizable effects

</td>
<td width="50%">

### 🚀 Extensible & Community-Driven
Built to grow:
- Community can author UI packs
- Token-based themes (extends HA-LCARS)
- Modern web components (LitElement)
- Open for contributions

</td>
</tr>
<tr>
<td width="50%">

### 📊 Real-Time Data Sources
No backend templates needed:
- Browser-side transformations
- Entity subscriptions and aggregations
- Live updates without storage overhead
- Just-in-time dashboard data

</td>
<td width="50%">

### 🎮 Global Alert Modes
Coordinated dashboard states:
- Red Alert, Blue Alert, and more
- Synchronized styles and sounds
- Apply across all cards instantly
- Perfect for immersive experiences

</td>
</tr>
</table>

<br>

## System Architecture

LCARdS is built on a layered architecture that keeps cards simple while providing powerful shared features:

```mermaid
graph TB
    subgraph "Your Dashboard"
        Button[Button Cards]
        Slider[Slider Cards]
        MSD[MSD Cards]
        Chart[Chart Cards]
    end
    
    subgraph "LCARdS Core Systems"
        Rules[Rules Engine]
        Systems[Systems Manager]
        Theme[Theme Manager]
        Data[Data Sources]
        Anim[Animation Framework]
    end
    
    subgraph "Home Assistant"
        Entities[Entities & Services]
        HA[Home Assistant Core]
    end
    
    Button --> Rules
    Slider --> Rules
    MSD --> Rules
    Chart --> Rules
    
    Button --> Systems
    Slider --> Systems
    MSD --> Systems
    Chart --> Systems
    
    Rules --> Theme
    Systems --> Theme
    Systems --> Data
    Data --> Anim
    
    Rules --> Entities
    Data --> Entities
    Entities --> HA
    
    style Button fill:#ff9900,stroke:#cc7700,color:#000
    style Slider fill:#ff9900,stroke:#cc7700,color:#000
    style MSD fill:#ff9900,stroke:#cc7700,color:#000
    style Chart fill:#ff9900,stroke:#cc7700,color:#000
    style Rules fill:#9999ff,stroke:#6666cc,color:#000
    style Systems fill:#9999ff,stroke:#6666cc,color:#000
    style Theme fill:#9999ff,stroke:#6666cc,color:#000
    style Data fill:#9999ff,stroke:#6666cc,color:#000
    style Anim fill:#9999ff,stroke:#6666cc,color:#000
```

**Cards talk to Core Systems, Core Systems talk to Home Assistant.** This unified architecture means features built once work everywhere.

<br>

## Installation

**Home Assistant minimum version:** 2024.1.0

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

<br>

## The Fleet

> [!NOTE]
> All LCARdS cards share the same powerful base: rules, actions, templates, animations, and theming. Choose the right card for your UI, then customize with the full platform's capabilities.

---

### Button Card

![Button Card Samples](docs/assets/card-button-samples.png)
<!-- 
IMAGE PLACEHOLDER: Button card varieties
Show: Lozenge, bullet, capped, Picard variants in active/inactive states
File: docs/assets/card-button-samples.png
-->

The most versatile button in the galaxy. Lozenge, bullet, capped, Picard variants and more.

<details>
<summary><b>Key Features</b></summary>

- Multiple preset styles (lozenge, bullet, capped, Picard, dense)
- Entity or service binding with dynamic state responses
- Unified action handling (tap, hold, double-tap)
- Full rules engine and template support
- Custom SVG backgrounds and interactive segments

**[→ Full Documentation](doc/user-guide/)**

</details>

---

### Slider / Multimeter Card

![Slider Card Samples](docs/assets/card-slider-samples.png)
<!-- 
IMAGE PLACEHOLDER: Slider/multimeter samples
Show: Horizontal pills, vertical gauge, Picard style in 2-3 examples
File: docs/assets/card-slider-samples.png
-->

Interactive controls and gauges for lights, covers, fans, and sensors.

<details>
<summary><b>Key Features</b></summary>

- Automatic entity detection (lights, media players, covers, fans, climate)
- Pills and gauge visual modes
- Horizontal, vertical, and Picard multimeter styles
- Range gradients and color matching to light entities
- Read-only sensor mode or interactive controls

**[→ Full Documentation](doc/user-guide/)**

</details>

---

### Elbow Card

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
- Simple (single elbow) and segmented (Picard double elbow) modes
- LCARS arc formula-based geometry for authentic curves
- Full button functionality (actions, rules, animations, templates)

**[→ Full Documentation](doc/user-guide/)**

</details>

---

### MSD (Multi-Status Display) Card
**✨ The Crown Jewel**

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

The flagship card. Sophisticated multi-entity displays with **immersive visual editor**.

<details>
<summary><b>Key Features</b></summary>

- Multi-entity status blocks with customizable layouts
- Dynamic connecting lines and embedded animations
- **Studio Editor**: Drag-and-drop visual configuration
- Live preview with undo/redo history
- Provenance tracking and Main Engineering helpers
- Context-aware wizards for complex configurations

> [!TIP]
> The MSD Studio editor is where LCARdS truly shines. Build complex layouts visually, see changes in real-time, and access platform-wide features through intuitive dialogs.

**[→ Full Documentation](doc/user-guide/advanced/msd-controls.md)**

</details>

---

### Chart Card

![Chart Card Samples](docs/assets/card-chart-samples.png)
<!-- 
IMAGE PLACEHOLDER: Chart card examples
Show: Line chart, area chart, bar chart with LCARS theming
File: docs/assets/card-chart-samples.png
-->

Powerful standalone charting with 15+ chart types powered by ApexCharts.

<details>
<summary><b>Key Features</b></summary>

- 15+ chart types (line, area, bar, pie, scatter, heatmap, radar)
- Real-time entity updates with multi-series support
- Advanced data sources with history preload
- 50+ style properties with full theme integration
- Works standalone or embedded in MSD

**[→ Full Documentation](doc/user-guide/configuration/overlays/apexcharts-overlay.md)**

</details>

---

### Data Grid Card

![Data Grid Sample](docs/assets/card-data-grid-sample.gif)
<!-- 
IMAGE PLACEHOLDER: Data grid with cascade animation
Show: Grid with cascade animation and entity data updates
File: docs/assets/card-data-grid-sample.gif
-->

Authentic LCARS data grids with cascade animations.

<details>
<summary><b>Key Features</b></summary>

- Decorative mode (random data) and data mode (real entities)
- Cascade animations with LCARS color cycling
- Change detection with highlight animations
- Grid and timeline layouts
- Auto-detection of static text, entities, or templates

**[→ Full Documentation](doc/user-guide/)**

</details>

---

**[→ View Full Documentation](doc/user-guide/)**

<br>

---

<br>

## Editing with Studio

> [!IMPORTANT]
> LCARdS features **immersive, wizard-driven editors** that bring the "Main Engineering" experience to your dashboard configuration.

![Studio Editing Experience](docs/assets/studio-editing-ui.png)
<!-- 
IMAGE PLACEHOLDER: Studio editor showcase
Show: MSD studio open with:
- Config overlay panel
- Live preview
- Provenance dialog
- Theme selector
- Rules builder visible in background
File: docs/assets/studio-editing-ui.png
-->

### What Makes Studio Different?

All LCARdS cards have in-place editors, but advanced cards (like MSD) get the **full Studio experience**:

- **Visual, live editing** - See changes as you make them
- **Schema-driven helpers** - Context-aware inputs and wizards
- **Undo/Redo history** - Never lose your work
- **Provenance tracking** - See who changed what and when
- **Theme live-switching** - Test themes without leaving the editor
- **Main Engineering access** - Global dialogs for rules, alerts, animations

> [!TIP]
> **Edit like a Starfleet engineer.** Studio editors make complex configurations intuitive, powerful features discoverable, and mistakes reversible.

<br>

---

<br>

## Main Engineering

![Main Engineering Dialogs](docs/assets/main-engineering-dialogs.png)
<!-- 
IMAGE PLACEHOLDER: Main Engineering UI
Show: Screenshots of alert mode selector, theme browser, provenance tracker dialogs
File: docs/assets/main-engineering-dialogs.png
-->

LCARdS isn't just cards—it's a platform with **centralized system-level features**:

<table>
<tr>
<td width="33%">

### Global Alert Modes
Switch your entire dashboard to:
- 🔴 **Red Alert**
- 🔵 **Blue Alert**
- 🟡 **Yellow Alert**

Coordinated styles, sounds, and animations across all cards instantly.

</td>
<td width="33%">

### Theme Browser
- Browse and switch themes live
- Token-based system extends HA-LCARS
- Create and share theme packs
- Real-time preview

</td>
<td width="33%">

### Provenance Tracking
- See change history for each card
- Track who modified what
- Rollback to previous versions
- Export/import configurations

</td>
</tr>
<tr>
<td width="33%">

### Systems Manager
- Real-time card-to-card communication
- Centralized notification system
- Context overlays
- Tag-based targeting

</td>
<td width="33%">

### Rules Engine
- Define conditions and actions once
- Apply across multiple cards
- Cross-card reactivity
- Event-driven behaviors

</td>
<td width="33%">

### Animation Framework
- Rich, customizable effects
- LCARS-authentic presets
- Lifecycle management
- Performance-optimized

</td>
</tr>
</table>

> [!NOTE]
> **Main Engineering features are accessible from any Studio editor.** Create a rule, apply it to tagged cards. Switch alert modes, see all cards respond. One system, infinite possibilities.

<br>

---

<br>

## Built to Extend

LCARdS is designed for **community contribution and extensibility**:

```mermaid
graph LR
    Core[LCARdS Core] --> Cards[Card Types]
    Core --> Themes[Theme Packs]
    Core --> Anims[Animations]
    Core --> Packs[UI Packs]
    
    Cards --> Community[Community<br>Contributions]
    Themes --> Community
    Anims --> Community
    Packs --> Community
    
    style Core fill:#ff9900,stroke:#cc7700,color:#000
    style Community fill:#9999ff,stroke:#6666cc,color:#000
```

- **Modern architecture** - Built with LitElement web components
- **Card APIs** - Extend `LCARdSCard` base for new card types
- **UI Packs** - Community can author and share packs (coming soon)
- **Token-based theming** - Create themes that extend HA-LCARS
- **Open source** - PRs, issues, and suggestions welcome

**Want to contribute?** Check out the [Developer Documentation →](doc/architecture/)

<br>

---

<br>

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

<br>

## Acknowledgements

LCARdS stands on the shoulders of giants:

- [**HA-LCARS theme**](https://github.com/th3jesta/ha-lcars) - The foundation for LCARS visual authenticity
- [**custom-button-card**](https://github.com/custom-cards/button-card) - Inspiration for flexible card design
- [**my-cards**](https://github.com/AnthonMS/my-cards) - Slider implementation reference
- [**lovelace-card-mod**](https://github.com/thomasloven/lovelace-card-mod) - Advanced styling capabilities
- **All Star Trek & LCARS fans** - Your passion drives this project 🖖

<br>

---

<br>

## License

MIT License — See [LICENSE](LICENSE)

---

**Live long and prosper.** 🖖
