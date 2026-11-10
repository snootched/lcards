# Architecture

How LCARdS is built: the Home Assistant integration, the frontend bundle, the core singletons and the cards on top of them. These pages are written for contributors and checked against the code; each cites the source files it describes. To build something, start with the [Development](../development/) guides; for configuring cards, see the user docs.

Read [Systems Overview](systems-arch.md) first: it shows how the pieces fit at runtime and links everything else.

---

## Overview

| Page | What it covers |
|---|---|
| [Systems Overview](systems-arch.md) | Runtime diagram, which element runs where, the core services, packs |
| [Home Assistant Integration](ha-integration.md) | The Python custom integration: boot, static paths, bundle loading, WebSocket API, actions, push channel, diagnostics, build and release |

## Cards

| Page | What it covers |
|---|---|
| [Card Foundation](cards/lcards-card-foundation.md) | `LCARdSNativeCard` and `LCARdSCard`: lifecycle hooks, config processing, HASS flow, entity access, templates, actions, rules integration, cleanup |
| [Layout View and Layout Card](layout-view.md) | `lcards-layout-view`, `lcards-layout-card` and the Layout Studio: the shared grid engine, the editor overlay, persistence, visibility-driven row sizing |
| [Shell Strategy](shell-strategy.md) | The `custom:lcars-shell` dashboard strategy: registration, options, what `generate()` builds |
| [Charts](charts.md) | The chart card: `sources[]`, the series fetcher, the ApexCharts adapter |
| [Astrometrics](astrometrics.md) | The astrometrics card: three.js scene, camera, ephemeris and clock, models |
| [MSD Pipeline](msd/) | The MSD card: config processing, anchors, overlays, rendering, controls |
| [Routing Engine (RouterCore)](msd/routing.md) | MSD line routing: trunks, lanes, corners |

## Animation

| Page | What it covers |
|---|---|
| [Animation Architecture](animations/) | Who fires each trigger, scopes, presets, playback features, the files |

## Core subsystems

The singletons on `window.lcards.core`, one page each, plus the initialization order and how HASS reaches them: start at [Core Subsystems](subsystems/). The ones cards meet most often are the [Systems Manager](subsystems/systems-manager.md), [Rules Engine](subsystems/rules-engine.md), [Theme System](subsystems/theme-system.md), [Config Manager](subsystems/config-manager.md), [Animation Manager](subsystems/animation-manager.md) and the per-card [Action Handler](subsystems/action-handler.md).

## Internals

Lower-level implementation notes: [Internals](internals/) covers background animations, data source buffers, entity display formatting, the backend actions and push channel, persistent storage and shape textures.
