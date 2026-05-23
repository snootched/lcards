# Internals

This section documents lower-level implementation details that underpin the subsystems above. You rarely need to touch this code directly, but understanding it is valuable when debugging unexpected rendering behaviour, contributing new visual effects, or tracing data through the pipeline.

---

## Pages in This Section

| Page | What it covers |
|------|----------------|
| [Background Animation System](#background-animation-system) | Canvas2D rendering pipeline for animated card backgrounds |
| [DataSource Buffers](#datasource-buffer-structure) | Internal buffer and processor-output data shape |
| [HA Entity Display](#ha-entity-display-utility) | Locale-aware entity value formatting |
| [HA Services — Implementation Notes](#ha-services--implementation-notes) | Backend service architecture and server-push channel |
| [Shape Texture System](#shape-texture-system) | SVG-native declarative texture effects inside card shapes |
| [Persistent Storage](#persistent-storage) | HA-backed key/value store for user and layout state |

---

## Background Animation System

[Full reference →](./background-animation-system.md)

Canvas2D rendering architecture for animated card backgrounds. An effect stack system applies modular preset effects (particles, warp, scan lines, noise, etc.) and an `AnimationPerformanceMonitor` degrades quality automatically on low-end devices.

Consult this when implementing new canvas-based visual effects, configuring background animations on cards, or investigating performance degradation.

---

## DataSource Buffer Structure

[Full reference →](./datasource-buffers.md)

Documents the internal shape of datasource data objects: the main `v` buffer holding raw entity values, and named processor buffers holding outputs from unit conversion, moving averages, rate calculations, and other pipeline stages.

Consult this when referencing datasource values in templates (`{ds:source.buffer}`), configuring processors, or accessing buffers directly via `DataSourceManager`.

---

## HA Entity Display Utility

[Full reference →](./ha-entity-display.md)

Centralised utility (`src/utils/ha-entity-display.js`) for i18n/locale-aware formatting of Home Assistant entity values. Delegates to the stable `hass.format*` API family and provides graceful fallbacks. This is the single source of truth for all HA text formatting in LCARdS.

Consult this when displaying entity values, units, or state strings in cards to ensure consistent formatting and translation support.

---

## HA Services — Implementation Notes

[Full reference →](./ha-services.md)

Documents the LCARdS backend service architecture: alert mode management, frontend control directives, portal overlays, and the server-push channel that broadcasts events (reload, log level changes, portal triggers) to all connected browser tabs.

Consult this when understanding how HA service calls interact with the integration lifecycle, or when implementing features that need the push channel.

---

## Shape Texture System

[Full reference →](./shape-texture-system.md)

SVG-native texture system that renders declarative effects (grid, plasma, fluid, level fills, etc.) inside button and elbow shape boundaries. Complements the canvas background system but operates entirely in SVG, driving color and template evaluation through the same pipeline as the rest of the card.

Consult this when configuring animated textures on cards, adding new SVG-based preset effects, or tracing texture color resolution.

---

## Persistent Storage

[Full reference →](./storage.md)

Key/value store backed by Home Assistant's storage API (written to `.storage/lcards`), exposed over WebSocket as read/write/delete commands. Values survive HA restarts. Used by scoped settings, layout state, and any feature that needs cross-session persistence.

Consult this when implementing user preferences or dashboard state that must survive page reloads and HA restarts.
