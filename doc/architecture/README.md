# LCARdS Architecture Documentation

> **Internal architecture, system design, and developer documentation**

---

## 📖 Core Documents

### Architecture Overview
- **[overview.md](overview.md)** - High-level system architecture, singleton pattern, card types ⭐ **Start here**

---

## 🃏 [Cards](./cards/)

Card-specific architecture:
- **[simple-card-foundation.md](./cards/simple-card-foundation.md)** - Go-forward architecture for new cards

---

## 🎭 [Subsystems](./subsystems/)

Detailed documentation for each singleton system:

| System | Purpose | Doc |
|--------|---------|-----|
| **Core Systems Manager** | Entity caching for Simple Cards | [Read](./subsystems/core-systems-manager.md) |
| **Rules Engine** | Conditional logic and dynamic updates | [Read](./subsystems/rules-engine.md) |
| **Rules Template Syntax** | Template processing and rule syntax | [Read](./subsystems/rules-template-syntax.md) |
| **DataSource System** | Entity subscriptions for MSD cards | [Read](./subsystems/datasource-system.md) |
| **Theme System** | Color schemes and styling | [Read](./subsystems/theme-system.md) |
| **Animation Registry** | Animation definitions | [Read](./subsystems/animation-registry.md) |
| **Template Processor** | Template evaluation | [Read](./subsystems/template-processor.md) |
| **Validation System** | Schema validation | [Read](./subsystems/validation-system.md) |
| **Style Resolver** | Style computation | [Read](./subsystems/style-resolver.md) |
| **Router Core** | MSD navigation | [Read](./subsystems/router-core.md) |
| **Advanced Renderer** | SVG rendering pipeline | [Read](./subsystems/advanced-renderer.md) |
| **MSD Systems Manager** | MSD coordination | [Read](./subsystems/msd-systems-manager.md) |
| **Pack System** | Configuration packs | [Read](./subsystems/pack-system.md) |

[→ All Subsystems](./subsystems/README.md)

---

## 📋 [Schemas](./schemas/)

Official schema definitions (markdown with fully commented YAML):

### Simple Cards
- **[simple-button-schema-definition.md](./schemas/simple-button-schema-definition.md)** - Complete SimpleButton schema
- **[simple-chart-schema-definition.md](./schemas/simple-chart-schema-definition.md)** - Complete SimpleChart schema

### MSD Cards
- **[msd-schema-definition.md](./schemas/msd-schema-definition.md)** - Complete MSD card configuration ⭐
- **[line-overlay-schema-definition.md](./schemas/line-overlay-schema-definition.md)** - Line overlay with routing and attachment

---

## 📊 [Diagrams](./diagrams/)

Visual documentation:
- **[MSD Flow - Part 1](./diagrams/MSD%20Flow%20-%20Part%201.md)** - Initialization flow
- **[MSD Flow - Part 2](./diagrams/MSD%20Flow%20-%20Part%202.md)** - Rendering flow

---

## 🔌 [API Documentation](./api/)

### For Developers
- **[api-reference.md](./api/api-reference.md)** - Complete `window.lcards.debug.msd` namespace
- **[debug-api.md](./api/debug-api.md)** - Detailed debug methods
- **[runtime-api.md](./api/runtime-api.md)** - User-facing `window.lcards.msd` API

**Note:** Console help for users is in [user/advanced](../user/advanced/)

---

## 🎯 Key Concepts

### Singleton Architecture
- **BaseService Pattern** - All singletons extend BaseService for lifecycle consistency
- **Shared Intelligence** - Rules, data, themes shared across all cards
- **Distributed Presentation** - Individual cards handle only rendering

### Card Types
- **Simple Cards** (go-forward) - Lightweight, single-purpose (SimpleButton)
- **MSD Cards** (current) - Complex multi-overlay displays

### Performance
- **Entity Caching** - 80-90% faster with CoreSystemsManager
- **Shared Subscriptions** - No duplicate entity subscriptions
- **Incremental Updates** - Only changed overlays re-render

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
