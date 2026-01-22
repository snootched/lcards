# LCARdS Architecture Documentation

> **Internal architecture, system design, and developer documentation**

---

## 📖 Core Documents

### Architecture Overview
- **[overview.md](overview.md)** - High-level system architecture, singleton pattern, card types ⭐ **Start here**
- **[core-initialization.md](core-initialization.md)** - Core singleton initialization flow
- **[pack-system-guide.md](pack-system-guide.md)** - Pack system developer guide (v1.23.0)
- **[msd-card-architecture.md](msd-card-architecture.md)** - MSD card architecture

---

## 🃏 [Cards](./cards/)

Card-specific architecture:
- **[lcards-card-foundation.md](./cards/lcards-card-foundation.md)** - Go-forward architecture for new cards

---

## 📐 [Schemas](./schemas/)

Official schema definitions (single source of truth):
- **[button-schema-definition.md](./schemas/button-schema-definition.md)** - Button card schema
- **[chart-schema-definition.md](./schemas/chart-schema-definition.md)** - Chart card schema
- **[slider-schema-definition.md](./schemas/slider-schema-definition.md)** - Slider card schema
- **[elbow-schema-definition.md](./schemas/elbow-schema-definition.md)** - Elbow card schema
- **[msd-schema-definition.md](./schemas/msd-schema-definition.md)** - MSD card schema
- **[control-overlay-schema-definition.md](./schemas/control-overlay-schema-definition.md)** - Control overlay schema
- **[line-overlay-schema-definition.md](./schemas/line-overlay-schema-definition.md)** - Line overlay schema

---

## 🎭 [Subsystems](./subsystems/)

Detailed documentation for core systems:

### Core Singleton Systems (Shared Across All Cards)

| System | Type | Purpose | Doc |
|--------|------|---------|-----|
| **Core Systems Manager** | Singleton | Entity caching for LCARdS Cards | [Read](./subsystems/core-systems-manager.md) |
| **DataSource System** | Singleton | Entity subscriptions and data processing | [Read](./subsystems/datasource-system.md) |
| **Rules Engine** | Singleton | Conditional logic and dynamic updates | [Read](./subsystems/rules-engine.md) |
| **Theme System** | Singleton | Color schemes and styling | [Read](./subsystems/theme-system.md) |
| **Animation Registry** | Singleton | Animation instance caching | [Read](./subsystems/animation-registry.md) |
| **Validation System** | Singleton | Schema validation | [Read](./subsystems/validation-system.md) |
| **Pack System** | Singleton | Configuration packs | [Read](./subsystems/pack-system.md) |

### Per-Card Systems (One Instance Per Card)

| System | Type | Purpose | Doc |
|--------|------|---------|-----|
| **MSD Card Coordinator** | Per MSD card | MSD rendering pipeline orchestration | [Read](./subsystems/msd-card-coordinator.md) |
| **Advanced Renderer** | Per MSD card | SVG rendering pipeline | [Read](./subsystems/advanced-renderer.md) |
| **Style Resolver** | Per MSD card | Style computation | [Read](./subsystems/style-resolver.md) |
| **Router Core** | Per MSD card | Path routing for line overlays | [Read](./subsystems/router-core.md) |

**Note:** Template processing is handled by the unified template system in `src/core/templates/` (TemplateDetector, TemplateParser, and card-specific evaluators), not as a per-card system.

---

## 🎨 [Visual Editor](./editor/)

Editor system architecture and components:
- **[architecture.md](./editor/architecture.md)** - Editor system architecture
- **[components.md](./editor/components.md)** - Reusable editor components
- **[style-guide.md](./editor/style-guide.md)** - Editor styling guidelines
- **[visual-tweaks.md](./editor/visual-tweaks.md)** - Visual refinements and tweaks
- **[creating-editors.md](./editor/creating-editors.md)** - How to create new card editors
- **[schema-ui-hints.md](./editor/schema-ui-hints.md)** - Complete x-ui-hints specification
- **[datasource-picker-dialog.md](./editor/datasource-picker-dialog.md)** - DataSource picker component
- **[template-evaluation-browser.md](./editor/template-evaluation-browser.md)** - Template evaluation and theme browser features

---

## 🔌 [APIs](./api/)

Debug and runtime APIs:
- **[debug-api.md](./api/debug-api.md)** - Debug API for MSD introspection
- **[runtime-api.md](./api/runtime-api.md)** - User-facing runtime API

---

## 📂 Directory Structure

```
doc/architecture/
├── README.md              # This file
├── overview.md            # Start here - system overview
├── core-initialization.md # Core startup sequence
├── pack-system-guide.md   # Pack system guide
├── msd-card-architecture.md
├── api/                   # Debug & runtime APIs
├── cards/                 # Card architectures
├── schemas/               # Schema definitions
├── subsystems/            # Core system details
└── editor/                # Visual editor docs
```

---

## 🗄️ Historical Documentation

Historical and migration documentation has been moved to `doc/archive/` for reference.

---

### Additional Documentation

| Document | Purpose |
|----------|---------|
| **[Rules Template Syntax](./subsystems/rules-template-syntax.md)** | Template processing and rule syntax reference |

[→ All Subsystems](./subsystems/README.md)

---

## 📋 [Schemas](./schemas/)

Official schema definitions (markdown with fully commented YAML):

### LCARdS Cards
- **[button-schema-definition.md](./schemas/button-schema-definition.md)** - Complete Button card schema
- **[chart-schema-definition.md](./schemas/chart-schema-definition.md)** - Complete Chart card schema

### MSD Cards
- **[msd-schema-definition.md](./schemas/msd-schema-definition.md)** - Complete MSD card configuration ⭐
- **[line-overlay-schema-definition.md](./schemas/line-overlay-schema-definition.md)** - Line overlay with routing and attachment

---

## 📊 [Diagrams](./diagrams/)

Visual documentation:
- **[Core Initialization](./core-initialization.md)** - Module load and singleton creation ⭐
- **[MSD Card Architecture](./msd-card-architecture.md)** - MSD pipeline and systems ⭐

---

## 🔌 [API Documentation](./api/)

### For Developers
- **[api-reference.md](./api/api-reference.md)** - Complete `window.lcards.debug.msd` namespace
- **[debug-api.md](./api/debug-api.md)** - Detailed debug methods
- **[runtime-api.md](./api/runtime-api.md)** - User-facing `window.lcards.msd` API

**Note:** Console help for users is in [user/advanced](../user/advanced/)

---

## 🎯 Key Concepts

### Singleton vs Per-Card Architecture

LCARdS uses a **hybrid architecture** for optimal performance and flexibility:

**Core Singleton Systems:**
- **BaseService Pattern** - All singletons extend BaseService for lifecycle consistency
- **Shared Intelligence** - DataSource, Rules, Themes shared across all card instances
- **Cross-Card Coordination** - Single source of truth for entity data and styling rules
- **Used by all cards** - Both LCARdS Cards and MSD cards access core singletons

**Per-Card Systems:**
- **Local Orchestration** - Each card has its own rendering pipeline
- **Animation Management** - AnimationManager instantiated per card for local control
- **MSD-Specific** - MSD Card Coordinator only used by MSD cards (not LCARdS Cards)
- **Resource Efficiency** - Local systems only created when needed

### Card Types
- **LCARdS Cards** (go-forward) - Lightweight, single-purpose (lcards-button, lcards-elbow, lcards-chart, lcards-slider)
  - Use CoreSystemsManager singleton for entity caching
  - Access core singletons directly (DataSourceManager, RulesEngine, ThemeManager)
  - No heavy MSD rendering pipeline
- **MSD Cards** (current) - Complex multi-overlay displays
  - Use MSD Card Coordinator per-card for rendering orchestration
  - MSD Card Coordinator connects to core singletons
  - Full SVG rendering pipeline with Advanced Renderer

### Performance
- **Entity Caching** - 80-90% faster with CoreSystemsManager singleton
- **Shared Subscriptions** - No duplicate entity subscriptions across cards
- **Incremental Updates** - Only changed overlays re-render
- **Animation Caching** - AnimationRegistry singleton caches instances for reuse

---

## 🔄 Keeping Documentation Current

When modifying code:
1. ✅ Update relevant architecture docs
2. ✅ Update schemas if configuration changed
3. ✅ Update diagrams to reflect new flow
4. ✅ Verify subsystem docs match implementation
5. ✅ Test API examples still work

---

*For user-facing documentation, see [../user/](../user/)*
