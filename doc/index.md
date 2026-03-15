# LCARdS

**A unified card ecosystem for Home Assistant inspired by Star Trek LCARS**

[![GitHub release](https://img.shields.io/github/v/release/snootched/LCARdS?display_name=release)](https://github.com/snootched/LCARdS/releases)
[![License](https://img.shields.io/github/license/snootched/LCARdS)](https://github.com/snootched/lcards/blob/main/LICENSE)
[![Last commit](https://img.shields.io/github/last-commit/snootched/LCARdS)](https://github.com/snootched/LCARdS/commits/main)

---

## What is LCARdS?

LCARdS isn't just another custom card — it's a **complete LCARS dashboard platform** for Home Assistant, inspired by the iconic Library Computer Access/Retrieval System interface from Star Trek.

Build immersive, interactive starship-style dashboards with:

- **Unified architecture** — Every card shares powerful reactivity, cross-card rules, and unified actions
- **Studio editors** — Immersive, wizard-driven interfaces with live preview and provenance tracking
- **Extensible design** — Community packs, themes, and animations
- **No backend required** — Data transformations run in the browser for real-time dashboards

!!! tip "Cards as a system"
    LCARdS cards work together as a **system**, not isolated components.  
    Define rules once, apply across all cards. Create data sources that multiple cards share.  
    Build dashboards that feel alive.

---

## Quick Navigation

<div class="grid cards" markdown>

-   :material-rocket-launch:{ .lg .middle } **Getting Started**

    ---

    Install LCARdS and build your first LCARS interface in minutes.

    [:octicons-arrow-right-24: Installation](user-guide/getting-started/installation.md)  
    [:octicons-arrow-right-24: Quick Start](user-guide/getting-started/quickstart.md)  
    [:octicons-arrow-right-24: First Card Tutorial](user-guide/getting-started/first-card.md)

-   :material-book-open-variant:{ .lg .middle } **User Guide**

    ---

    Configure data sources, overlays, rules, and advanced features.

    [:octicons-arrow-right-24: User Guide Overview](user-guide/README.md)

-   :material-sitemap:{ .lg .middle } **Architecture**

    ---

    Understand the rendering pipeline, subsystems, and design patterns.

    [:octicons-arrow-right-24: Architecture Overview](architecture/overview.md)

-   :material-code-braces:{ .lg .middle } **API Reference**

    ---

    71 documented API methods for power users and integrators.

    [:octicons-arrow-right-24: API Reference](api/README.md)

</div>

---

## Key Features

=== "Unified Card API"

    Every card shares the same powerful base:

    - Cross-card rules and reactivity
    - Tag-based targeting system
    - Unified action handlers
    - Template support (JS expressions, tokens, Jinja2)

=== "LCARS Aesthetic"

    Authentic Star Trek LCARS visual language:

    - Signature curved corner elements
    - LCARS colour palette with full theme support
    - Animated transitions and sound effects
    - Pack system for community themes

=== "Data-Driven"

    Rich data binding system:

    - Multiple data source types (entity, template, computed)
    - Real-time transformations and aggregations
    - Rules engine for conditional behaviour
    - Cross-card data sharing

---

!!! info "Source & Community"
    LCARdS is open source. Browse the code, report issues, and contribute at  
    **[github.com/snootched/lcards](https://github.com/snootched/lcards)**
