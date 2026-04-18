---
title: Core Concepts
description: The systems that power every LCARdS card — templates, data sources, rules engine, themes, and more.
---

# Core Concepts

LCARdS cards are driven by a set of shared singleton services, and a set of per-card configuration options shared across all card types. This section covers both.

## Per-Card Options

Options you configure directly in individual card YAML:

| Option | Description |
|---|---|
| [Actions](actions.md) | Tap, hold, and double-tap actions wired to any HA service call |
| [Colours](colours.md) | Accepted colour formats and state-based colour maps |
| [Presets](presets.md) | Named style collections — apply a full card appearance in one line |
| [Sounds](sounds.md) | Event-driven audio feedback via the Sound Manager |
| [Styles](styles.md) | The `style:` block — card background, border, icon, and dimension overrides |
| [Text Fields](text-fields.md) | Label and value field templating reference |

## Core Services

Shared singleton systems that all cards tap into:

| Service | Description |
|---|---|
| [Alert Mode](alert-mode.md) | Coordinated dashboard-wide red/yellow alert states with full UI and audio transformation |
| [Data Sources](datasources/) | Live entity subscriptions, polling, history buffers, and transformations |
| [Rules Engine](rules/) | Conditional styling engine — change colours, icons, labels, and trigger animations based on entity state |
| [Templates](templates/) | Four template types — JavaScript, token, data source, and Jinja2 — evaluated uniformly across all properties |
| [Themes](themes/) | Token-based colour palette shared across all cards |

## Effects

| Effect | Description |
|---|---|
| [Animations](animations.md) | anime.js-powered animations triggered by interactions or entity changes |
| [Background Animations](effects/background-animations.md) | Canvas2D animated backgrounds behind card content |
| [Filters](effects/filters.md) | Stackable CSS and SVG visual filters — blur, brightness, colour shift, displacement |
