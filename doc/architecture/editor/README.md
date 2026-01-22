# Visual Editor Architecture

> **Documentation for LCARdS visual editor system**

---

## Overview

The LCARdS visual editor provides a user-friendly interface for configuring cards without manual YAML editing, following Home Assistant's native card editor patterns.

---

## Documentation

### Core Architecture
- **[architecture.md](architecture.md)** - Editor system architecture, components, and patterns
- **[creating-editors.md](creating-editors.md)** - How to create new card editors
- **[schema-ui-hints.md](schema-ui-hints.md)** - Complete x-ui-hints specification

### Components
- **[components.md](components.md)** - Reusable editor components library
- **[datasource-picker-dialog.md](datasource-picker-dialog.md)** - DataSource picker component

### Features
- **[template-evaluation-browser.md](template-evaluation-browser.md)** - Template evaluation and theme token browser

### Styling
- **[style-guide.md](style-guide.md)** - Editor styling guidelines and best practices
- **[visual-tweaks.md](visual-tweaks.md)** - Visual refinements and UI polish

---

## Quick Reference

### Editor Base Class
All card editors extend `LCARdSBaseEditor` which provides:
- Tab management (Config, YAML, other custom tabs)
- YAML ↔ Config synchronization
- Validation integration
- Consistent styling

### Key Components
- **lcards-form-field** - Auto-rendering form field
- **lcards-form-section** - Collapsible sections
- **lcards-color-selector** - LCARS-themed color picker
- **lcards-entity-field** - Entity picker
- **lcards-action-editor** - Action configuration
- **lcards-monaco-yaml-editor** - YAML editor with validation

### Schema-Driven Forms
The editor system is schema-driven - field types are auto-detected from JSON Schema definitions, reducing editor implementation complexity by ~70%.

---

## Implementation Status

✅ **Phase 1 Complete** - Foundational architecture
✅ **Phase 1.5 Complete** - Schema-driven form components
✅ **Phase 2 Complete** - Visual polish and refinements

---

*Last Updated: January 2026 - LCARdS v1.20+*
