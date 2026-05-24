# Core Subsystems

LCARdS exposes a set of singleton services on `window.lcards.core.*`. Each subsystem extends `BaseService`, is instantiated by `LCARdSCore._performInitialization()`, and receives HASS updates via `LCARdSCore.ingestHass()`. Cards never instantiate subsystems directly.

---

## Quick Reference

| Subsystem | Singleton | Role |
|-----------|-----------|------|
| [Animation Manager](#animation-manager) | `animationManager` | anime.js v4 orchestration, scoped per overlay |
| [Asset Manager](#asset-manager) | `assetManager` | SVG / font / audio loading and caching |
| [Component Manager](#component-manager) | `componentManager` | Named multi-segment SVG component registry |
| [Connection Overlay](#connection-overlay) | `connectionOverlay` | Full-screen lost-connection UI |
| [DataSource System](#datasource-system) | `dataSourceManager` | Rolling entity buffers with processor pipelines |
| [Device Identity](#device-identity) | `deviceIdentityManager` | Stable per-browser UUID for scoped settings |
| [Helper Manager](#helper-manager) | `helperManager` | HA input_* helper read/write |
| [Integration Service](#integration-service) | `integrationService` | Backend probe, storage helpers, push events |
| [Pack System](#pack-system) | `packManager` | Named bundles: themes, components, presets, assets |
| [Rules Engine](#rules-engine) | `rulesManager` | Condition evaluation → style patch on overlays |
| [Scoped Settings](#scoped-settings) | `scopedSettings` | Device → user → global three-tier waterfall |
| [Screen Effect System](#screen-effect-system) | `screenEffectManager` | Full-screen composited canvas effects |
| [Sound System](#sound-system) | `soundManager` | Event-driven audio with scheme mapping |
| [Style Preset Manager](#style-preset-manager) | `stylePresetManager` | Named preset bundles loaded from packs |
| [Systems Manager](#systems-manager) | `systemsManager` | Entity state cache, subscriptions, overlay registry |
| [Template System](#template-system) | `templateSystem` | Unified evaluator for all four template types |
| [Theme System](#theme-system) | `themeManager` | Token resolution, alert palette transforms |
| [Validation Service](#validation-service) | `validationService` | Runtime config schema validation by card type |

---

## Animation Manager

**`window.lcards.core.animationManager`** · [Full reference →](./animation-manager.md)

Orchestrates anime.js v4 animations scoped per overlay. Integrates with DataSource thresholds and the Rules Engine for reactive and rule-triggered playback. Maintains an `AnimationRegistry` that caches animation instances for performance.

Consult this when implementing card animations, wiring entity-change or datasource triggers, or using built-in presets like `pulse` and `slide`.

---

## Asset Manager

**`window.lcards.core.assetManager`** · [Full reference →](./asset-manager.md)

Loads and caches SVG, font, and audio assets from packs, keeping a URL-only registry for browser-native image loading. Provides runtime registration of user images as first-class builtin references.

Consult this when adding custom assets to cards, registering user images, or loading SVG/font content at runtime.

---

## Component Manager

**`window.lcards.core.componentManager`** · [Full reference →](./component-manager.md)

Holds named SVG component definitions (dpad, alert, elbow variants) where each segment can receive independent styling and actions. Consumed by button cards running in component mode.

Consult this when building multi-segment interactive shapes or defining new component types.

---

## Connection Overlay

**`window.lcards.core.connectionOverlay`** · [Full reference →](./connection-overlay.md)

Monitors the Home Assistant WebSocket connection and renders a full-screen overlay when the frontend loses server contact. Supports text or custom card modes and optional reconnection banners, configured via the scoped settings waterfall.

Consult this when customising connection-lost behaviour or layering it with `ScreenEffectManager`.

---

## DataSource System

**`window.lcards.core.dataSourceManager`** · [Full reference →](./datasource-system.md)

Manages named entity data buffers with rolling history and processor pipelines (unit conversion, smoothing, trending, statistics). Provides reactive subscriptions so cards receive processed values automatically on entity change.

Consult this when cards need derived sensor data, statistics-based displays, or datasource-threshold-driven animations.

---

## Device Identity

**`window.lcards.core.deviceIdentityManager`** · [Full reference →](./device-identity.md)

Provides a stable browser-profile identity using a stored UUID and auto-seeded display name. This identity is the key for device-scoped settings in the ScopedSettingsService waterfall.

Consult this when implementing per-device configuration or device-specific features like kiosk overrides.

---

## Helper Manager

**`window.lcards.core.helperManager`** · [Full reference →](./helper-manager.md)

Manages HA `input_*` helper entities (select, boolean, number) for persistent frontend state — alert mode, sound schemes, user preferences. Provides typed read/write access and auto-creation of missing helpers.

Consult this when implementing features that need HA-backed persistent storage or when reading/writing alert and sound configuration.

---

## Integration Service

**`window.lcards.core.integrationService`** · [Full reference →](./integration-service.md)

Probes the LCARdS HA backend on startup to determine availability, wraps WebSocket storage operations, and handles push events from Python service handlers (reload, log level, portal overlays).

Consult this when implementing backend-dependent features, checking integration availability before persisting data, or handling remote-control directives.

---

## Pack System

**`window.lcards.core.packManager`** · [Full reference →](./pack-system.md)

Defines the structure, loading, and distribution of named bundles containing style presets, components, themes, rules, animations, and assets. Packs are loaded at startup by `PackManager`; downstream registries consume the declared entries.

Consult this when creating new packs, adding component types, or understanding how registries populate from pack data.

---

## Rules Engine

**`window.lcards.core.rulesManager`** · [Full reference →](./rules-engine.md)

Evaluates rule conditions on every HASS state push and produces style patches that are merged onto target overlays — overlays have no knowledge that a rule is driving them. Supports complex multi-condition logic and cross-card overlay targeting by tag, type, ID, or pattern.

Consult this when implementing conditional styling, state-dependent animations, or coordinated alert patterns across multiple cards.

---

## Scoped Settings

**`window.lcards.core.scopedSettings`** · [Full reference →](./scoped-settings.md)

Implements a three-tier waterfall (device → user → global) for any LCARdS setting. Each scope can be overridden independently; the most-specific set value wins at read time, and all scopes are persisted to the HA backend.

Consult this when adding new settings that need per-device or per-user overrides.

---

## Screen Effect System

**`window.lcards.core.screenEffectManager`** · [Full reference →](./screen-effects.md)

Composites a full-screen canvas effect layer above all UI. Ships named presets (blur, static, pixelate, glitch, vignette) accessible via console API, HA services, and card config. Layered above `ConnectionOverlay`.

Consult this when implementing visual feedback, alert backdrop effects, or custom canvas-based screen effects.

---

## Sound System

**`window.lcards.core.soundManager`** · [Full reference →](./sound-system.md)

Event-driven audio feedback for card interactions and HA UI events. Maps events to assets via schemes defined in packs, with per-event overrides and scoped settings support for per-user and per-device sound preferences.

Consult this when playing sounds on card actions, configuring sound schemes via packs, or implementing per-user/device audio preferences.

---

## Style Preset Manager

**`window.lcards.core.stylePresetManager`** · [Full reference →](./style-preset-manager.md)

Stores named preset objects (lozenge, bullet, pills, gauge, etc.) loaded from packs. Cards reference presets by name to avoid hard-coding style definitions, and the manager resolves the full preset object at render time.

Consult this when creating card style presets or when cards need to look up and apply style bundles by name.

---

## Systems Manager

**`window.lcards.core.systemsManager`** · [Full reference →](./systems-manager.md)

Provides the shared entity state cache with targeted subscriptions and change deduplication for all LCARdS cards, plus an overlay registry used by the Rules Engine for cross-card targeting.

Consult this when cards need entity state subscriptions, when registering overlays for rule targeting, or performing overlay-aware operations.

---

## Template System

**`window.lcards.core.templateSystem`** · [Full reference →](./template-system.md)

Unified evaluator for all four LCARdS template types — JavaScript `[[[...]]]`, LCARdS tokens `{...}`, DataSource references `{ds:...}`, and Jinja2 `{{...}}` — applied in a fixed priority order via `UnifiedTemplateEvaluator`.

Consult this when implementing dynamic text fields, understanding template evaluation order, or injecting custom context into expressions.

---

## Theme System

**`window.lcards.core.themeManager`** · [Full reference →](./theme-system.md)

Token-based theming with alert-mode palette transformations. Maintains the active theme registry and resolves `theme:` token paths to concrete CSS values. The resolver singleton (`themeManager.resolver`) must be accessed via `window.lcards.core` — module-level imports have no token tree.

Consult this when implementing theme-aware styling, accessing theme tokens in code or config, or supporting alert-triggered palette swaps.

---

## Validation Service

**`window.lcards.core.validationService`** · [Full reference →](./validation-service.md)

Runtime config schema validation keyed by card type. Catches structural errors and unknown fields before render and surfaces them in the editor. Card schemas are registered in `CoreConfigManager`.

Consult this when implementing card config validation, understanding error reporting paths, or debugging configuration issues in the editor.
