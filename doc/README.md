# LCARdS Documentation

> **Complete documentation for the LCARdS Home Assistant card system**

---

## 🏛️ Architecture

LCARdS uses a **hybrid architecture** with core singleton systems for shared intelligence and per-card systems for local orchestration:

### Core Singleton Systems (Shared Across All Cards)

| Singleton | Access | Purpose |
|-----------|--------|---------|
| `lcardsCore.themeManager` | ThemeManager | Theme and design tokens |
| `lcardsCore.dataSourceManager` | DataSourceManager | Entity state and data fetching |
| `lcardsCore.rulesManager` | RulesEngine | Conditional styling rules |
| `lcardsCore.validationService` | CoreValidationService | Config validation |
| `lcardsCore.stylePresetManager` | StylePresetManager | Style presets and CSS utilities |
| `lcardsCore.animationRegistry` | AnimationRegistry | Animation instance caching |
| `lcardsCore.systemsManager` | CoreSystemsManager | Entity caching for LCARdS Cards |

### Per-Card Systems (One Instance Per Card)

| System | Used By | Purpose |
|--------|---------|---------|
| `AnimationManager` | Each card instance | Animation coordination and playback |
| `MSD SystemsManager` | MSD cards only | MSD rendering pipeline orchestration |

**Key Principle:** Core singletons provide shared intelligence (data, rules, themes) while per-card systems handle local rendering and animation. Any card can define `data_sources` and `rules` that are registered with global singletons, making them available system-wide for cross-card data sharing.

---

## 📚 Documentation Structure

### 👤 [User Documentation](./user/)
Everything users need to build LCARS dashboards in Home Assistant:
- **[Getting Started](./user/getting-started/)** - Installation, quick start, first card
- **[Configuration](./user/configuration/)** - Complete configuration guides for all overlays, datasources, rules
- **[Examples](./user/examples/)** - Real-world dashboard examples
- **[Guides](./user/guides/)** - Step-by-step tutorials
- **[Advanced](./user/advanced/)** - Console API, debugging tools, advanced techniques

### 🏗️ [Architecture Documentation](./architecture/)
Internal architecture and developer documentation:
- **[Subsystems](./architecture/subsystems/)** - Core system architecture (RulesEngine, DataSources, Theme, etc.)
- **[Schemas](./architecture/schemas/)** - Card schemas and configuration structure
- **[Diagrams](./architecture/diagrams/)** - System flow diagrams and architecture visualizations
- **[API References](./architecture/api/)** - Debug API, Runtime API documentation

---

## 🎯 Quick Links

### For Users
- 🚀 [Quick Start Guide](./user/getting-started/quickstart.md)
- 📖 [Button Card Reference](./user/configuration/cards/button.md)
- 🎨 [Rules Engine Guide](./user/configuration/rules.md)
- 🔍 [Console Help](./user/advanced/console-help-quick-ref.md)

### For Developers
- 🏛️ [Architecture Overview](./architecture/overview.md)
- 🧩 [LCARdS Card Foundation](./architecture/cards/lcards-card-foundation.md)
- 🔌 [API Reference](./architecture/api/api-reference.md)
- 🎭 [Subsystems Overview](./architecture/subsystems/README.md)

---

## 📊 Documentation Philosophy

All documentation in this tree reflects the **current state of the code**. Documents are:
- ✅ **Accurate** - Verified against implementation
- ✅ **Complete** - No placeholder sections
- ✅ **Current** - Actively maintained
- ✅ **Clear** - Written for comprehension



---

## 🔄 Documentation Updates

When making code changes:
1. Update relevant documentation files
2. Verify examples still work
3. Update schemas if configuration changed
4. Keep diagrams in sync with code

---

## 🏗️ Architecture Notes

**Singleton vs Per-Card:**
- **Singletons** (ThemeManager, DataSourceManager, RulesEngine, etc.) are shared across all card instances for maximum efficiency and cross-card coordination
- **Per-card systems** (AnimationManager, MSD SystemsManager) are instantiated once per card for local rendering and animation control
- **CoreSystemsManager** is a singleton used by LCARdS Cards (lcards-button, lcards-chart, etc.)
- **MSD SystemsManager** is per-card, used only by MSD cards, and connects to the core singletons

For detailed architecture information, see [Architecture Overview](./architecture/overview.md) and [Subsystems](./architecture/subsystems/README.md).

---

*Last Updated: January 2026*
