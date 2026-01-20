<!-- 
IMAGE PLACEHOLDER: Hero Banner
Suggested filename: docs/assets/lcards-hero-banner.gif
What to show: Animated MSD display showcasing various LCARdS cards in action - buttons responding to taps, 
sliders adjusting, charts updating, data grids cascading, with theme switching and alert mode transitions.
Should convey the dynamic, interactive nature of the ecosystem.
-->

<div align="center">

# LCARdS: The Ultimate LCARS Card Ecosystem for Home Assistant

### A unified, extensible platform for creating immersive Star Trek-inspired dashboards

[![Version](https://img.shields.io/github/v/release/snootched/LCARdS?style=flat-square)](https://github.com/snootched/LCARdS/releases)
[![License](https://img.shields.io/github/license/snootched/LCARdS?style=flat-square)](LICENSE)
[![Last Commit](https://img.shields.io/github/last-commit/snootched/LCARdS?style=flat-square)](https://github.com/snootched/LCARdS/commits/main)
[![HACS](https://img.shields.io/badge/HACS-Default-orange.svg?style=flat-square)](https://github.com/hacs/integration)

</div>

---

## 🌟 What is LCARdS?

LCARdS is not just another custom card collection—it's a **complete card ecosystem** built on a unified, intelligent architecture. Every card shares advanced reactivity, cross-card communication, and a powerful rules engine that makes your dashboards truly dynamic and interactive.

Think of LCARdS as a **platform for building LCARS experiences**, not just individual cards. It's modular, extensible, and designed for growth, with immersive Studio editors that give you a "Main Engineering" experience right in your browser.

### Why LCARdS is Different

🎯 **Unified Core with Advanced Systems**
- Rules engine for conditional styling across all cards
- Tag-based targeting for coordinated behaviors
- Global systems manager for cross-card communication
- Centralized data sources with real-time subscriptions

🔗 **Cross-Card Interactivity**
- Cards can subscribe to entity changes and react instantly
- Unified action system with service calls, navigation, and custom actions
- Overlay system for coordinated visual effects
- Global alert modes (Red Alert, Yellow Alert) that cascade across entire dashboards

🎨 **Immersive Studio Editors**
- Edit cards in place with powerful visual editors
- "Main Engineering" overlays with schema-driven helpers
- Provenance tracking to see configuration history
- Context-aware wizards and auto-complete

🧩 **Extensible UI Packs**
- Developers and community can contribute new card types
- Animation packs for custom motion profiles
- Theme packs with token-based styling
- Open architecture for third-party extensions

⚡ **No Backend Config Required**
- Data sources run entirely in browser
- Real-time transformations and aggregations
- History preload and windowing for performance
- No server-side dependencies

🏗️ **Modern Architecture**
- Built with LitElement and Web Components
- Modular, maintainable codebase
- Comprehensive API documentation
- TypeScript-ready with full IntelliSense support

**📚 Learn More:**
- [User Documentation Portal](doc/README.md) - Complete guides and tutorials
- [Architecture Documentation](doc/architecture/) - For developers and contributors

---

## ✨ Features at a Glance

✅ **Unified core with advanced systems** - Rules engine, tag-based targeting, systems manager, global alert/engineering dialogs

✅ **Truly customizable** - Dynamic theming, template support (JavaScript, Token, DataSource, Jinja2), deep animation framework

✅ **Cross-card interactivity** - Entity subscriptions, actions, overlays—cards can talk to each other

✅ **Immersive Studio Editors** - Edit in place with "Main Engineering" overlays, provenance tracking, powerful helpers

✅ **Extensible UI Packs** - Developers and community can contribute new card types, animations, themes

✅ **No backend config required** - Data sources and transformations run entirely in the browser for real-time dashboards

✅ **Modern architecture** - Built with LitElement, modular codebase, extensible APIs

**[See detailed features →](doc/README.md)**

---

## 🚀 The Fleet: Card Types

### LCARS Button Card

The most flexible button in the galaxy—whether you need a simple control or an interactive command interface.

**Key Features:**
- **Multiple style variants** - Lozenge, bullet, capped, Picard variants and more
- **Entity or service binding** - Control any entity with animated state feedback
- **Dynamic styles** - Conditional formatting with the rules engine
- **Full action support** - Tap, hold, double-tap with service calls and navigation
- **Template integration** - JavaScript, Token, DataSource, and Jinja2 templates
- **SVG backgrounds** - Interactive segments with state-aware styling

<!-- 
IMAGE PLACEHOLDER: Button Card Varieties
Suggested filename: docs/assets/button-card-collage.png
What to show: Grid collage showing button style varieties (lozenge, bullet, capped, Picard variants) 
in different states (active, inactive, hover) and various colors from LCARS palette.
-->

**[View full documentation →](doc/user/configuration/cards/button.md)**

---

### LCARS Slider / Multimeter Card

Interactive gauges, sliders, and meters for precise control and monitoring of entity values.

**Key Features:**
- **Flexible mapping** - Map any entity or sensor with custom range/gradient support
- **Multiple control types** - Light color, temperature, cover position, media volume, and more
- **Visual style options** - Vertical, horizontal, and "Picard" multimeter styles
- **Pills and gauge modes** - Segmented bar style or ruler with tick marks
- **Interactive or read-only** - Auto-configures based on entity domain
- **Theme integration** - Full support for LCARS color palettes and tokens

<!-- 
IMAGE PLACEHOLDER: Slider Card Examples
Suggested filename: docs/assets/slider-card-examples.png
What to show: 2-3 slider examples showing horizontal/vertical orientations, pills vs gauge visual styles,
with different gradient colors and entity types (light brightness, temperature, volume).
-->

**[View full documentation →](doc/user/configuration/cards/slider.md)**

---

### LCARS Elbow Card

Classic LCARS elbow/corner designs that define the iconic interface aesthetic.

**Key Features:**
- **Flexible positioning** - Header/footer placement with left/right orientation
- **Two styles** - Simple (single elbow) and segmented (Picard-style double elbow)
- **Authentic geometry** - LCARS arc formula-based curves for pixel-perfect accuracy
- **Full button functionality** - Actions, rules, animations, and templates inherited from button card
- **Theme-aware** - Automatic color integration with LCARS palettes
- **Layout control** - Precise control over bar widths, heights, and curve radii

<!-- 
IMAGE PLACEHOLDER: Elbow Card Variants
Suggested filename: docs/assets/elbow-card-variants.png
What to show: Examples of header-left, header-right, footer-left, footer-right variants in both 
simple and segmented (double elbow) styles, showing authentic LCARS corner curves.
-->

**[View full documentation →](doc/user/configuration/cards/elbow.md)**

---

### LCARS MSD (Multi-Status Display) Card
***The Crown Jewel***

The flagship card—sophisticated displays combining multiple entities, status blocks, live graphs, and custom animations in a unified interface.

**Key Features:**
- **Multi-entity displays** - Show multiple entities, status blocks, live graphs, and icons in one card
- **Customizable layouts** - Block positioning, dynamic connection lines, embedded animations
- **Advanced data sources** - Real-time updates with history preload and transformations
- **Immersive STUDIO Editor** - Drag-and-drop, visual live configuration, provenance/history tracking
- **Main Engineering helpers** - Context-aware wizards, schema validation, and auto-complete
- **Cross-card coordination** - Alert modes, global states, and system-wide events

<!-- 
IMAGE PLACEHOLDER: MSD Card with Studio Editor
Suggested filename: docs/assets/msd-card-studio-editor.gif
What to show: Animated example showing MSD card with multiple blocks and connecting lines displaying 
live data, PLUS screenshot of Studio editor overlay open with configuration panel, block diagram, 
provenance dialog, and theme selector visible. Should convey the power of visual editing.
-->

**[View full documentation →](doc/user/advanced/msd-controls.md)**

---

### LCARS Chart Card

Powerful standalone charting with 15+ chart types powered by ApexCharts integration.

**Key Features:**
- **Real-time updates** - Live data from Home Assistant entities with automatic refresh
- **Multi-series support** - Plot multiple data sources on a single chart
- **15+ chart types** - Line, area, bar, column, pie, scatter, heatmap, radar, and more
- **50+ style properties** - Complete control over colors, markers, grid, axes, typography
- **Advanced data sources** - History preload, throttling, coalescing, and windowing
- **Theme integration** - LCARdS theme tokens and Home Assistant CSS variables

<!-- 
IMAGE PLACEHOLDER: Chart Card Examples
Suggested filename: docs/assets/chart-card-examples.png
What to show: Examples of line chart, area chart, and bar chart with LCARS theming 
(authentic LCARS colors, styled axes, legends). Show real sensor data trending over time.
-->

**[View full documentation →](doc/user/configuration/cards/chart.md)**

---

### LCARS Data Grid Card

Authentic LCARS-style data grids with cascade animations and real-time entity updates.

**Key Features:**
- **Dual data modes** - Decorative (random data for ambiance) or data (real entity values)
- **Cascade animations** - Per-row timing with authentic LCARS color cycling
- **Change detection** - Highlight animations when entity values update
- **Grid and timeline layouts** - Flexible CSS Grid positioning with responsive design
- **Template support** - Static text, entity references, or Jinja2 templates in cells
- **Performance optimized** - Efficient rendering for large data sets

<!-- 
IMAGE PLACEHOLDER: Data Grid Card
Suggested filename: docs/assets/data-grid-card.gif
What to show: Animated data grid showing cascade animation effect with LCARS color cycling,
plus entity data display with change detection highlights when values update.
-->

**[View full documentation →](doc/user/configuration/cards/data-grid.md)**

---

### ...and More!

Additional cards for **labels**, **animated backgrounds**, **overlays**, and more are part of the LCARdS ecosystem.

**[Explore the complete card gallery →](doc/user/configuration/cards/)**

---

## 🎬 Editing with Immersive Studio

**Edit like Starfleet engineers** with Studio editors built right into each card.

For advanced cards like MSD, charting, and overlays, the Studio experience offers:

✨ **Live Preview** - See changes instantly with undo/redo history  
🧙 **Schema-Driven Helpers** - Context-aware wizards and auto-complete  
🎨 **Theme Switcher** - Test your design with different LCARS themes instantly  
📜 **Provenance Tracking** - See configuration history and who changed what  
🛠️ **Main Engineering Access** - System-level dialogs for advanced features  

<!-- 
IMAGE PLACEHOLDER: Studio Editor Experience
Suggested filename: docs/assets/studio-editor-experience.png
What to show: Screenshot showing MSD Studio editor open with overlay panel, provenance dialog 
showing configuration history, theme selector dropdown, and rules builder interface visible. 
Should convey the comprehensive editing environment.
-->

---

## 🏛️ Main Engineering: System-Level Features

Centralized platform features that coordinate across your entire dashboard:

### 🔍 Provenance Tracking
See complete configuration history for each card with timestamp and change tracking. Never lose track of what changed or why.

### 🚨 Global Alert Modes
Switch your entire dashboard to "Red Alert", "Yellow Alert", or "Blue Alert" with coordinated animations, color shifts, and optional sound effects that cascade across all cards simultaneously.

### 🎨 Theme Browser & Token System
Browse and switch between LCARS themes instantly. Extend with custom token packs or create entirely new themes with the token-based styling system.

### 🎛️ Centralized Systems Manager
Real-time communication bus between all cards. Subscribe to entity changes, broadcast events, and coordinate behaviors across your dashboard.

### 💬 Dialog-driven Tools
Access animations, overlay controls, validation tools, and engineering helpers through intuitive dialogs—no YAML editing required for common tasks.

<!-- 
IMAGE PLACEHOLDER: Main Engineering Dialogs
Suggested filename: docs/assets/main-engineering-dialogs.png
What to show: Screenshots showing multiple Main Engineering dialogs: alert mode selector with 
Red/Yellow/Blue alert buttons, theme browser with theme previews, and provenance tracker with 
change timeline.
-->

---

## 📦 Quick Installation

### Install via HACS (Recommended)

1. Open **HACS** in Home Assistant
2. Go to **Integrations** → **Custom Repositories**
3. Add repository URL: `https://github.com/snootched/LCARdS`
4. Set category to **Lovelace**
5. Click **Install** on the LCARdS card
6. **Restart Home Assistant**
7. Add LCARdS cards from the Dashboard editor

**[View detailed installation guide →](doc/user/getting-started/installation.md)**

---

## 🔧 Tech + Extensibility

### Modern Foundation

LCARdS is built on **modern web standards** for maximum compatibility and performance:

- **LitElement** - Fast, lightweight web components with reactive updates
- **Web Components** - Standards-based custom elements that work anywhere
- **ES6 Modules** - Clean, maintainable code architecture
- **Webpack** - Optimized bundling for production deployment

### Extensible Architecture

The LCARdS platform is designed for community growth:

🎁 **UI Packs (Coming Soon)** - Developers and users can author and share card types, animation packs, and theme collections

🎨 **Token-Driven Theming** - Extend existing HA-LCARS themes or create entirely new ones with the token system

🔌 **Open APIs** - Comprehensive documentation for contributing cards, services, and extensions

🤝 **Community Welcome** - Open for PRs, suggestions, and community authorship

---

## 📚 Documentation Links

<table>
<tr>
<td width="50%" valign="top">

### 👤 For Users

- 🚀 [**Getting Started**](doc/user/getting-started/) - Installation and quick start
- 📖 [**Card Documentation**](doc/user/configuration/cards/) - Complete card reference
- 🎨 [**Theming Guide**](doc/user/advanced/theme_creation_tutorial.md) - Create custom themes
- 🎯 [**Rules Engine**](doc/user/configuration/rules.md) - Conditional styling
- 💡 [**Examples**](doc/user/examples/) - Real-world dashboard examples
- ❓ [**FAQ & Troubleshooting**](doc/user/advanced/README.md) - Common issues and solutions

</td>
<td width="50%" valign="top">

### 🏗️ For Developers

- 🏛️ [**Architecture Overview**](doc/architecture/overview.md) - System architecture
- 🧩 [**Card Foundation**](doc/architecture/cards/lcards-card-foundation.md) - Build new cards
- 🔌 [**API Reference**](doc/architecture/api/api-reference.md) - Complete API docs
- 🎭 [**Subsystems**](doc/architecture/subsystems/README.md) - Core system details
- 📊 [**Diagrams**](doc/architecture/diagrams/) - Architecture visualizations

</td>
</tr>
</table>

**[📚 Documentation Portal →](doc/README.md)**

---

## 🙏 Acknowledgements & Credits

LCARdS stands on the shoulders of giants. Special thanks to:

- **[HA-LCARS theme](https://github.com/th3jesta/ha-lcars)** by @th3jesta - Foundation for visual authenticity and LCARS design language
- **[custom-button-card](https://github.com/custom-cards/button-card)** by @RomRider - Inspiration for flexible configuration patterns
- **[my-cards](https://github.com/AnthonMS/my-cards)** by @AnthonMS - Reference for modern card architecture
- **[lovelace-card-mod](https://github.com/thomasloven/lovelace-card-mod)** by @thomasloven - Integration patterns and styling techniques
- **[ApexCharts](https://apexcharts.com/)** - Powerful charting library powering the Chart card
- **[anime.js](https://animejs.com/)** - Animation engine for smooth LCARS motion
- **All Star Trek & LCARS fans** whose imagination and passion drive this project forward 🖖

---

## 📄 License

**MIT License** - See [LICENSE](LICENSE) file for details.

Copyright (c) 2025 Jason Weyermars

---

<div align="center">

**Made with ❤️ for the Star Trek and Home Assistant communities**

🖖 **Live Long and Prosper** 🖖

[Report Bug](https://github.com/snootched/LCARdS/issues) • [Request Feature](https://github.com/snootched/LCARdS/issues) • [Discussions](https://github.com/snootched/LCARdS/discussions)

</div>
