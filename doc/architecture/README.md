# LCARdS Architecture Documentation

> **Internal architecture, system design, and developer documentation**

---

## 📖 Core Documents

### Architecture Overview
- **[overview.md](overview.md)** - High-level system architecture, singleton pattern, card types ⭐ **Start here**

---

## 🃏 [Cards](./cards/)

Card-specific architecture:
- **[lcards-card-foundation.md](./cards/lcards-card-foundation.md)** - Go-forward architecture for new cards

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
| **MSD Systems Manager** | Per MSD card | MSD rendering pipeline orchestration | [Read](./subsystems/msd-systems-manager.md) |
| **Advanced Renderer** | Per MSD card | SVG rendering pipeline | [Read](./subsystems/advanced-renderer.md) |
| **Style Resolver** | Per MSD card | Style computation | [Read](./subsystems/style-resolver.md) |
| **Router Core** | Per MSD card | Path routing for line overlays | [Read](./subsystems/router-core.md) |

**Note:** Template processing is handled by the unified template system in `src/core/templates/` (TemplateDetector, TemplateParser, and card-specific evaluators), not as a per-card system.

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
- **MSD-Specific** - MSD SystemsManager only used by MSD cards (not LCARdS Cards)
- **Resource Efficiency** - Local systems only created when needed

### Card Types
- **LCARdS Cards** (go-forward) - Lightweight, single-purpose (lcards-button, lcards-elbow, lcards-chart, lcards-slider)
  - Use CoreSystemsManager singleton for entity caching
  - Access core singletons directly (DataSourceManager, RulesEngine, ThemeManager)
  - No heavy MSD rendering pipeline
- **MSD Cards** (current) - Complex multi-overlay displays
  - Use MSD SystemsManager per-card for rendering orchestration
  - MSD SystemsManager connects to core singletons
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
