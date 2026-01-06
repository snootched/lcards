# MSD (Master Systems Display) Card - Official Schema Definition

**Date:** January 2026
**Purpose:** Single source of truth for MSD card schema
**Status:** 🎯 DEFINITIVE - All implementations must match this

**Architecture:** Complex multi-overlay SVG display system with routing, rules, and animations

---

## ⚠️ Breaking Changes in v1.22+

**Removed Fields:**
- ❌ `use_packs` - Packs are now loaded globally by PackManager at startup
- ❌ `version` - No longer required in MSD configuration

**Deprecated Overlay Types:**
The following overlay types have been removed. Use LCARdS cards instead:
- ❌ `text` → Use `custom:lcards-button` with text configuration
- ❌ `button` → Use `custom:lcards-button`
- ❌ `status_grid` → Use grid of `custom:lcards-button` cards
- ❌ `apexchart` → Use `custom:lcards-chart`

**Valid Overlay Types (v1.22+):**
- ✅ `line` - SVG line/path with intelligent routing
- ✅ `control` - Embedded Home Assistant card (including all LCARdS cards)

---

## Overview

MSD (Master Systems Display) cards are the advanced card type in LCARdS, supporting:
- **2 overlay types:** `line` for SVG paths and `control` for embedded cards
- Line routing with intelligent pathfinding (Manhattan, grid, smart, direct)
- Anchor-based positioning system
- Integration with global singleton systems (RulesEngine, DataSourceManager, ThemeManager, PackManager)
- Real-time entity subscriptions and data processing

**Important:** MSD cards use DataSourceManager directly for entity data. For lightweight entity access, use Simple Cards which use CoreSystemsManager.

---

## Minimal Example

Basic MSD card with one line overlay and one control overlay:

```yaml
type: custom:lcards-msd-card

base_svg:
  source: builtin:ncc-1701-a-blue
  filter_preset: dimmed

anchors:
  cpu_core: [120, 80]
  memory_bank: [400, 80]
  temp_display: [50, 50]

overlays:
  # Line connecting two anchors
  - id: cpu_memory_line
    type: line
    anchor: cpu_core
    attach_to: memory_bank
    style:
      color: var(--lcars-orange)
      width: 2

  # Embedded LCARdS button card
  - id: temp_button
    type: control
    position: temp_display
    size: [200, 60]
    card:
      type: custom:lcards-button
      entity: sensor.cpu_temp
      name: CPU Temperature
      style:
        background: var(--lcars-blue)
```

---

## Complete Schema Documentation

For complete schema documentation including:
- All overlay properties (line and control)
- Routing configuration options
- Rules engine integration
- Data source definitions
- Migration guides from legacy overlay types

Please refer to the source file: `src/core/validation-service/schemas/msdCard.js`

Or view the backup documentation: `doc/architecture/schemas/msd-schema-definition.md.bak`

---

## Reference

### Supported Overlay Types

| Type | Description | Use Case |
|------|-------------|----------|
| `line` | SVG line/path with routing | Visual connectors, data flow indicators |
| `control` | Embedded HA card | Buttons, charts, sensors, any HA card |

### Deprecated Overlay Types

| Type | Removed | Replacement |
|------|---------|-------------|
| `text` | v1.22 | `custom:lcards-button` with text |
| `button` | v1.22 | `custom:lcards-button` |
| `status_grid` | v1.22 | Multiple `custom:lcards-button` cards |
| `apexchart` | v1.22 | `custom:lcards-chart` |

---

## Architecture

MSD cards integrate with the following core systems:

- **PackManager** - Loads global packs (themes, style presets, rules, animations)
- **DataSourceManager** - Entity subscriptions and data processing
- **RulesEngine** - Conditional styling and behavior
- **ThemeManager** - Theme tokens and color palettes
- **StylePresetManager** - Style preset application
- **AnimationRegistry** - Animation definitions and caching
- **ValidationService** - Configuration validation

---

**Last Updated:** January 2026  
**Version:** v1.22+  
**Schema File:** `src/core/validation-service/schemas/msdCard.js`
