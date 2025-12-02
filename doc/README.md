# LCARdS Documentation

> **Complete documentation for the LCARdS Home Assistant card system**

---

## 🏛️ Architecture

LCARdS uses a **singleton-based core architecture** with the following key systems:

| Singleton | Access | Purpose |
|-----------|--------|---------|
| `lcardsCore.themeManager` | ThemeManager | Theme and design tokens |
| `lcardsCore.dataSourceManager` | DataSourceManager | Entity state and data fetching |
| `lcardsCore.rulesManager` | RulesEngine | Conditional styling rules |
| `lcardsCore.validationService` | CoreValidationService | Config validation |
| `lcardsCore.animationRegistry` | AnimationRegistry | Animation caching |
| `lcardsCore.animationManager` | AnimationManager | Animation coordination |

**MSD Overlay Types:** `line` (SVG lines) and `control` (embedded HA cards)

**Key Principle:** Any card can define `data_sources` and `rules` that are registered with global singletons, making them available system-wide for cross-card data sharing.

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
- 📖 [Simple Button Card Reference](./user/configuration/simple-button-quick-reference.md)
- 🎨 [Rules Engine Guide](./user/configuration/rules.md)
- 🔍 [Console Help](./user/advanced/CONSOLE_HELP_QUICK_REF.md)

### For Developers
- 🏛️ [Architecture Overview](./architecture/overview.md)
- 🧩 [Simple Card Foundation](./architecture/cards/lcards-card-foundation.md)
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

*Last Updated: November 2025*
