---
title: Features
description: What every LCARdS card can do (actions, colours, text, animations, sounds) and the shared services behind them (themes, rules, data sources, templates, alert mode).
---

# Features

Every LCARdS card shares two things: options you set on each card (actions, colours, text) and services that work across all cards at once (themes, rules, data sources). This section covers both. New here? [How LCARdS works](../getting-started/what-is-lcards#how-it-works) shows how they fit together.

## On Every Card

Options you set on each card:

| Option | Description |
|---|---|
| [Actions](actions.md) | Tap, hold, and double-tap actions wired to any HA service call |
| [Colours](colours.md) | Accepted colour formats and state-based colour maps |
| [Presets](presets.md) | Named style collections: apply a full card appearance in one line |
| [Sounds](sounds.md) | Event-driven audio feedback via the Sound Manager |
| [Styles](styles.md) | The `style:` block: card background, border, icon, and dimension overrides |
| [Text Fields](text-fields.md) | Label and value field templating reference |

## Shared Services

Services every card on the screen shares, so they work across cards at once:

| Service | Description |
|---|---|
| [Alert Mode](alert-mode.md) | Coordinated dashboard-wide red/yellow alert states with full UI and audio transformation |
| [Data Sources](datasources/) | Live entity subscriptions, polling, history buffers, and transformations |
| [Rules Engine](rules/) | Conditional styling engine: change colours, icons, labels, and trigger animations based on entity state |
| [Templates](templates/) | Four template types: JavaScript, token, data source, and Jinja2, evaluated uniformly across all properties |
| [Themes](themes/) | Token-based colour palette shared across all cards |

## Effects

| Effect | Description |
|---|---|
| [Animations](animations.md) | anime.js-powered animations triggered by interactions or entity changes |
| [Background Animations](effects/background-animations.md) | Canvas2D animated backgrounds behind card content |
| [Filters](effects/filters.md) | Stackable CSS and SVG visual filters: blur, brightness, colour shift, displacement |
