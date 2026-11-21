# Internals

This section documents lower-level implementation details under the [core subsystems](../subsystems/) and the [card foundation](../cards/lcards-card-foundation.md). You rarely need to touch this code directly, but it helps when debugging unexpected rendering, contributing a new visual effect, or tracing data through the pipeline.

---

## Pages in This Section

| Page | What it covers |
|------|----------------|
| [Background Animation System](#background-animation-system) | Canvas2D and WebGL (three.js) rendering of animated card backgrounds |
| [DataSource Buffers](#datasource-buffer-structure) | Internal buffer and processor-output data shape |
| [Home Assistant Entity Display](#home-assistant-entity-display-utility) | Locale-aware entity value formatting |
| [Home Assistant Services: Implementation Notes](#home-assistant-services-implementation-notes) | Backend action architecture and the server-push channel |
| [Shape Texture System](#shape-texture-system) | Canvas2D textures and effects clipped inside button and elbow shapes |
| [Persistent Storage](#persistent-storage) | The integration's key/value store: global, per-user and per-device settings |

---

## Background Animation System

[Full reference →](./background-animation-system.md)

How the `background_animation` layer of buttons, elbows, MSD and astrometrics cards is drawn: one `<canvas>` and one Canvas2D loop per card, preset effects stacked in config order, optional zoom layers, and a WebGL (three.js) version for many presets, drawn on one WebGL context shared by the page with the Canvas2D version as the fallback. On slow devices `AnimationPerformanceMonitor` makes the renderer skip frames, then stop it with a recovery probe.

Consult this when implementing a new background effect, configuring background animations on cards, or investigating performance degradation.

---

## DataSource Buffer Structure

[Full reference →](./datasource-buffers.md)

Documents the internal shape of datasource data objects: the main `v` buffer holding raw entity values, and named processor buffers holding outputs from unit conversion, moving averages, rate calculations, and other pipeline stages.

Consult this when referencing datasource values in templates (`{ds:source.buffer}`), configuring processors, or accessing buffers directly via `DataSourceManager`.

---

## Home Assistant Entity Display Utility

[Full reference →](./ha-entity-display.md)

Centralised utility (`src/utils/ha-entity-display.js`) for locale-aware formatting of Home Assistant entity values. Delegates to the stable `hass.format*` API family and provides fallbacks. This is the single source of truth for Home Assistant text formatting in LCARdS; cards use the `LCARdSCard` wrappers (`_getStateDisplay()` and friends).

Consult this when displaying entity values, units, or state strings in cards to ensure consistent formatting and translation support.

---

## Home Assistant Services: Implementation Notes

[Full reference →](./ha-services.md)

Documents how the `lcards.*` actions are registered and validated, and the server-push channel (`lcards_event` over `lcards/subscribe`) that delivers alert modes, reloads, log levels, screen effects, sounds, portal overlays, Borg and astrometrics commands to connected browsers, with optional per-device and per-user targeting.

Consult this when tracing how a Home Assistant action reaches the browser, or when adding an action that needs the push channel.

---

## Shape Texture System

[Full reference →](./shape-texture-system.md)

The `shape_texture` option: declarative effects (grid, plasma, fluid, level fills and more) drawn with Canvas2D on a `<canvas>` inside a `<foreignObject>` in the card SVG, clipped to the button or elbow shape and driven by one shared animation loop (`CanvasTextureRenderer`, `src/core/packs/textures/`). Colours and templates resolve through the same pipeline as the rest of the card.

Consult this when configuring animated textures on cards, adding a texture preset, or tracing texture colour resolution.

---

## Persistent Storage

[Full reference →](./storage.md)

The integration's key/value store (Home Assistant's `Store`, written under `.storage/`), exposed over the `lcards/storage/*` WebSocket commands, with per-user and per-device namespaces. Values survive Home Assistant restarts. Its users are the scoped settings service (sound settings, theme overrides, connection overlay settings), the sound manager's custom schemes, device identity (registered devices), and the config panel's storage explorer and users and devices tabs. Layout edits are not stored here: the layout view saves through Home Assistant's own dashboard config (`lovelace.saveConfig`).

Consult this when implementing a setting that must survive page reloads and Home Assistant restarts.
