---
title: Core Concepts
description: The systems that power every LCARdS card — templates, data sources, rules engine, themes, and more.
---

# Core Concepts

LCARdS cards are driven by a set of shared singleton services. Understanding these systems lets you build reactive, animated, and context-aware dashboards far beyond what static YAML can produce.

| Concept | Description |
|---|---|
| [Alert Mode](alert-mode.md) | Coordinated dashboard-wide red/yellow alert states with full UI and audio transformation |
| [Presets](presets.md) | Named style collections — apply a full card appearance in one line |
| [Styles](styles.md) | The `style:` block — card background, border, icon, and dimension overrides |
| [Colours](colours.md) | Accepted colour formats and state-based colour maps |
| [Text Fields](text-fields.md) | Label and value field templating reference |
| [Actions](actions.md) | Tap, hold, and double-tap actions wired to any HA service call |
| [Sounds](sounds.md) | Event-driven audio feedback via the Sound Manager |

## Systems

| System | Description |
|---|---|
| [Templates](templates/) | Four template types — JavaScript, token, data source, and Jinja2 — evaluated uniformly across all properties |
| [Data Sources](datasources/) | Live entity subscriptions, polling, history buffers, and transformations |
| [Rules Engine](rules/) | Conditional styling engine — change colours, icons, labels, and trigger animations based on entity state |
| [Themes](themes/) | Token-based colour palette shared across all cards |
| [Animations](animations.md) | anime.js-powered animations triggered by interactions or entity changes |
| [Filters](effects/filters.md) | Stackable CSS and SVG visual filters — blur, brightness, colour shift, displacement |
| [Background Animations](effects/background-animations.md) | Canvas2D animated backgrounds behind card content |
