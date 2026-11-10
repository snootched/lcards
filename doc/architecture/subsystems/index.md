# Core Subsystems

LCARdS exposes a set of singleton services on `window.lcards.core.*`. `window.lcards.core` is the `LCARdSCore` instance itself (`src/lcards-main.js` assigns `window.lcards.core = lcardsCore`), so every service below is a property of that object, created once by `LCARdSCore._performInitialization()` (`src/core/lcards-core.js`). Cards never instantiate core subsystems themselves; they read them from `window.lcards.core` (or from the `_singletons` map `LCARdSCard` builds from it).

Fourteen services extend `BaseService` (`src/core/BaseService.js`): `themeManager`, `rulesManager`, `dataSourceManager`, `animationManager`, `assetManager`, `helperManager`, `soundManager`, `screenEffectManager`, `borgAssimilationManager`, `integrationService`, `deviceIdentityManager`, `scopedSettingsService`, `portalOverlayManager` and `connectionOverlayService`. The rest are plain classes: `systemsManager` (`CoreSystemsManager`), `validationService`, `configManager`, `stylePresetManager`, `componentManager`, `packManager` and `performanceMonitor`. Being a `BaseService` only gives a class no-op `updateHass()` / `ingestHass()` defaults and `getServiceInfo()`; whether a service actually receives HASS is decided by the list in `LCARdSCore._updateHass()` (see [HASS distribution](#hass-distribution)).

To inspect any of them from the browser console, use `window.lcards.debug.singleton('<name>')` (it calls that service's `getDebugInfo()`) and `window.lcards.debug.singletons()` (every service that has one). See [Debug API: `debug.singleton(manager)`](../../development/debug-api.md#debug-singleton-manager).

---

## Quick Reference

| Subsystem | Singleton | Class (file under `src/`) | Role |
|-----------|-----------|---------------------------|------|
| [Animation Manager](#animation-manager) | `animationManager` | `AnimationManager` (`core/animation/AnimationManager.js`) | anime.js v4 orchestration, scoped per overlay |
| [Asset Manager](#asset-manager) | `assetManager` | `AssetManager` (`core/assets/AssetManager.js`) | SVG / font / audio / image loading and caching |
| [Borg Assimilation](#borg-assimilation) | `borgAssimilationManager` | `BorgAssimilationManager` (`core/borg/BorgAssimilationManager.js`) | The assimilate / deassimilate screen takeover |
| [Component Manager](#component-manager) | `componentManager` | `ComponentManager` (`core/components/ComponentManager.js`) | Named multi-segment SVG component registry |
| [Config Manager](#config-manager) | `configManager` | `CoreConfigManager` (`core/config-manager/index.js`) | Card config merge pipeline with provenance |
| [Connection Overlay](#connection-overlay) | `connectionOverlayService` | `ConnectionOverlayService` (`core/services/ConnectionOverlayService.js`) | Full-screen lost-connection UI |
| [DataSource System](#datasource-system) | `dataSourceManager` | `DataSourceManager` (`core/data-sources/DataSourceManager.js`) | Named entity buffers with processor pipelines |
| [Device Identity](#device-identity) | `deviceIdentityManager` | `DeviceIdentityManager` (`core/services/DeviceIdentityManager.js`) | Stable per-browser UUID and display name |
| [Helper Manager](#helper-manager) | `helperManager` | `LCARdSHelperManager` (`core/helpers/lcards-helper-manager.js`) | LCARdS `input_*` helper entities: create, read, write, watch |
| [Integration Service](#integration-service) | `integrationService` | `IntegrationService` (`core/services/IntegrationService.js`) | Backend probe, global storage helpers, push events |
| [Pack System](#pack-system) | `packManager` | `PackManager` (`core/PackManager.js`) | Loads built-in packs into the registries |
| [Performance Monitor](#performance-monitor) | `performanceMonitor` | `AnimationPerformanceMonitor` (`core/animation/PerformanceMonitor.js`) | FPS watch for canvas background animations |
| [Portal Overlay Manager](#portal-overlay-manager) | `portalOverlayManager` | `PortalOverlayManager` (`core/services/PortalOverlayManager.js`) | Named full-screen overlay slots in the effect portal |
| [Rules Engine](#rules-engine) | `rulesManager` | `RulesEngine` (`core/rules/RulesEngine.js`) | Condition evaluation, style patches on overlays |
| [Scoped Settings](#scoped-settings) | `scopedSettingsService` | `ScopedSettingsService` (`core/services/ScopedSettingsService.js`) | Device, user, global settings waterfall |
| [Screen Effect System](#screen-effect-system) | `screenEffectManager` | `ScreenEffectManager` (`core/screen-effects/ScreenEffectManager.js`) | Full-screen composited effect layers |
| [Sound System](#sound-system) | `soundManager` | `SoundManager` (`core/sound/SoundManager.js`) | Event-driven audio with scheme mapping |
| [Style Preset Manager](#style-preset-manager) | `stylePresetManager` | `StylePresetManager` (`core/presets/StylePresetManager.js`) | Named preset bundles loaded from packs |
| [Systems Manager](#systems-manager) | `systemsManager` | `CoreSystemsManager` (`core/systems-manager/index.js`) | Entity state cache, subscriptions, overlay registry |
| [Template System](#template-system) | *(no singleton: instantiated per use)* | `UnifiedTemplateEvaluator` (`core/templates/UnifiedTemplateEvaluator.js`) | Evaluator for all four template types |
| [Theme System](#theme-system) | `themeManager` | `ThemeManager` (`core/themes/ThemeManager.js`) | Token resolution, alert palette transforms |
| [Validation Service](#validation-service) | `validationService` | `CoreValidationService` (`core/validation-service/index.js`) | Runtime config schema validation by card type |

---

## Initialization Order

`src/lcards-main.js` calls `lcardsCore.initialize(stubHass)` when the bundle loads, with a stub HASS (`states: {}`, no `connection`, `user.is_admin: false`). `initialize()` runs `_performInitialization()` once; a second caller that arrives while it runs waits for it and then applies its own (real) HASS through `_updateHass()`. Cards that call `registerCard()` before the core is ready are queued in `_pendingCards`.

`_performInitialization(hass)` (`src/core/lcards-core.js`) runs these steps in order. "Created" means the constructor only; "initialized" means an `initialize()` call is awaited.

| # | Step | Notes |
|---|------|-------|
| 1 | `injectPalette()` | Writes the LCARdS palette as `--lcards-*` CSS variables, before any theme exists |
| 2 | `systemsManager` created, `initialize(hass)` | Entity cache and overlay registry |
| 3 | `dataSourceManager` created with `hass` | Sources are created later by cards (`createDataSource()`) or MSD (`initializeFromConfig()`) |
| 4 | `rulesManager` created | `rulesManager.systemsManager` is set so rules can reach the overlay registry |
| 5 | `themeManager` created | Themes arrive with the packs in step 15 |
| 6 | `animationManager` created with `systemsManager`, `initialize([], { suppressMountWarning: true })` | |
| 7 | `performanceMonitor` created | Starts measuring only when a canvas background calls `start()` |
| 8 | `validationService` created, `initialize(hass)` | |
| 9 | `configManager` created, `initialize({ validationService })` | Early, because cards process config from the moment they exist; theme and preset managers are added in step 17 |
| 10 | `stylePresetManager` created | Presets arrive with the packs |
| 11 | `assetManager` created, `initialize()` | |
| 12 | `componentManager` created, `initialize()` | |
| 13 | `helperManager` created with `hass` | |
| 14 | `soundManager` created, `initialize(core)` | |
| 15 | `packManager` created, `loadBuiltinPacks()` | The only place built-in packs are loaded; fills themes, presets, components, assets, sound schemes |
| 16 | Fonts with `metadata.autoLoad` loaded | Fire-and-forget `assetManager.loadFont(key)` |
| 17 | `themeManager.activateTheme('lcards-default')`, then `configManager.updateContext({ themeManager, stylePresetManager })` | A failed theme activation is logged, not fatal |
| 18 | Debug APIs attached | `window.lcards.debug.datasources`, and `debug.core` / `debug.singleton` / `debug.singletons` from `CoreDebugAPI` |
| 19 | `screenEffectManager` created | The portal is appended to `document.body` on first use |
| 20 | `borgAssimilationManager` created | Needs the screen effect and theme managers |
| 21 | `integrationService` created | Probes `lcards/info` on the first HASS that has a `connection` |
| 22 | `deviceIdentityManager` created | Initialises on its first `updateHass()` |
| 23 | `scopedSettingsService` created | |
| 24 | `portalOverlayManager` created | |
| 25 | `connectionOverlayService` created, `updateHass(hass)` | Subscribes to connection events as soon as it sees a HASS with a `connection` (the module-load stub has none, so in practice on the first real HASS) |
| 26 | Two `integrationService.onReady()` follow-ups registered | `themeManager.loadOverrides()` and `connectionOverlayService.initialize()`, both fire-and-forget |
| 27 | `_coreInitialized = true`, `_startGlobalHassFeed()` | See [HASS distribution](#hass-distribution) |
| 28 | `soundManager.mountGlobalUIListener()`, `soundManager.subscribeToAlertMode()` | |
| 29 | Queued cards registered | Each pending `registerCard()` promise resolves with its card context |
| 30 | `system_ready` sound | Once per page load (`window._lcardsSystemReadyPlayed`), after `soundManager.ensureReady()` |

If any awaited step throws, the core plays the `error` sound, leaves `_coreInitialized` false and rethrows.

### HASS distribution

`LCARdSCore._updateHass(hass)` pushes a HASS object to these services, in this order, by calling `updateHass(hass)` on each: `systemsManager`, `dataSourceManager`, `rulesManager`, `themeManager`, `animationManager`, `validationService`, `soundManager`, `integrationService`, `deviceIdentityManager`, `scopedSettingsService`, `portalOverlayManager`, `connectionOverlayService`, `assetManager`, `helperManager`. The other services do not receive HASS from the core.

Three paths lead into it:

- **Cards**: `LCARdSCard` calls `window.lcards.core.ingestHass(hass)` when a HASS change touches its own entities. `ingestHass()` keeps only the latest HASS and runs `_updateHass()` once per microtask, so many cards updating in the same tick cause one distribution.
- **Global feed**: `_startGlobalHassFeed()` polls `document.querySelector('home-assistant').hass` every 500 ms (`GLOBAL_HASS_POLL_MS`) while no card is registered or a portal overlay shows content, so pages without LCARdS cards (and overlay cards) still get live HASS.
- **Direct**: `updateHass(hass)` on the core calls `_updateHass()` without the microtask deduplication. Separately, `LCARdSNativeCard`'s `hass` setter forwards every real HASS straight to `helperManager.ingestHass()`, so the alert-mode auto-switch works on any page with a card.

---

## Action Handler

**Per card, not a core singleton** · [Full reference →](./action-handler.md)

`LCARdSActionHandler` is created by each card (`LCARdSCard` constructor: `this._actionHandler = new LCARdSActionHandler()`); there is no `window.lcards.core.actionHandler`. It attaches tap, hold, double-tap, hover and leave listeners to card elements, runs the configured Home Assistant action (toggle, more-info, perform-action, navigate, url, assist, plus the astrometrics actions), plays the matching card sound and fires the `on_tap` / `on_hold` / `on_double_tap` / `on_hover` / `on_leave` animation triggers with the pointer position.

Consult this when wiring interactions on a card element or running an action from code.

---

## Animation Manager

**`window.lcards.core.animationManager`** · [Full reference →](./animation-manager.md)

Orchestrates anime.js v4 animations scoped per overlay. Integrates with DataSource thresholds and the Rules Engine for reactive and rule-triggered playback.

Consult this when implementing card animations, wiring entity-change or datasource triggers, or using built-in presets like `pulse` and `slide`.

---

## Asset Manager

**`window.lcards.core.assetManager`** · [Full reference →](./asset-manager.md)

Loads and caches SVG, font, and audio assets from packs, keeping a URL-only registry for browser-native image loading. Provides runtime registration of user images as first-class builtin references.

Consult this when adding custom assets to cards, registering user images, or loading SVG/font content at runtime.

---

## Borg Assimilation

**`window.lcards.core.borgAssimilationManager`** · [Full reference →](./borg-assimilation.md)

Runs the Borg assimilation sequence: the `borg_alert` palette, the font swap, the `borg-assimilation` canvas intro and persistent screen effects, and the deassimilation outro that reverts them. Driven by the `lcards.borg_assimilate` / `lcards.borg_deassimilate` actions (through the integration push channel) and the `window.lcards.borg.*` console API.

Consult this when changing the assimilation sequence or its defaults.

---

## Component Manager

**`window.lcards.core.componentManager`** · [Full reference →](./component-manager.md)

Holds named SVG component definitions (dpad, alert, elbow variants) where each segment can receive independent styling and actions. Consumed by button cards running in component mode.

Consult this when building multi-segment interactive shapes or defining new component types.

---

## Config Manager

**`window.lcards.core.configManager`** · [Full reference →](./config-manager.md)

`CoreConfigManager` merges a card's config in layers (behavioural card defaults, theme defaults, preset or component, user config) with provenance tracking, using the validation service, theme manager and style preset manager. Card schemas are registered here for validation.

Consult this when changing how card config is merged or validated, or when registering a card schema.

---

## Connection Overlay

**`window.lcards.core.connectionOverlayService`** · [Full reference →](./connection-overlay.md)

Monitors the Home Assistant WebSocket connection and shows a full-screen overlay when the frontend loses server contact. Supports text or custom card modes and optional reconnection banners, configured through the scoped settings waterfall. The overlay is shown in the `connection-overlay` slot of the Portal Overlay Manager.

Consult this when customising connection-lost behaviour.

---

## DataSource System

**`window.lcards.core.dataSourceManager`** · [Full reference →](./datasource-system.md)

Manages named data sources: each follows one entity (or attribute), keeps a rolling history buffer and runs a named processor pipeline (unit conversion, smoothing, rate, statistics, ...). Subscribers receive the value and every processor output on each update.

Consult this when cards need derived sensor data, statistics-based displays, or datasource-driven animations.

---

## Device Identity

**`window.lcards.core.deviceIdentityManager`** · [Full reference →](./device-identity.md)

Provides a stable browser-profile identity: a UUID kept in `localStorage` and a display name stored in the backend. This identity is the key for device-scoped settings in the Scoped Settings waterfall and for device targeting of LCARdS actions.

Consult this when implementing per-device configuration or device-specific features like kiosk overrides.

---

## Helper Manager

**`window.lcards.core.helperManager`** · [Full reference →](./helper-manager.md)

Manages the Home Assistant helper entities LCARdS uses for shared state (`input_select`, `input_boolean`, `input_number`, `input_text`): alert mode, alert colour tuning, sound settings and HA-LCARS theme values. Provides typed read/write access, change subscriptions, creation of missing helpers, and the alert-mode auto-switch that applies a changed `input_select.lcards_alert_mode` to the theme.

Consult this when implementing features backed by Home Assistant helpers or when reading/writing alert and sound configuration.

---

## Integration Service

**`window.lcards.core.integrationService`** · [Full reference →](./integration-service.md)

Probes the LCARdS integration (`lcards/info`) to learn whether the backend is available, wraps the global storage commands (writes are admin-only), and handles push events from the Python actions (reload, log level, alert mode, effects, portal cards, Borg, astrometrics).

Consult this when implementing backend-dependent features, checking integration availability before persisting data, or handling remote-control directives.

---

## Pack System

**`window.lcards.core.packManager`** · [Full reference →](./pack-system.md)

Defines the structure, loading, and distribution of named bundles containing style presets, components, themes, rules, animations, and assets. Packs are loaded at startup by `PackManager`; downstream registries consume the declared entries.

Consult this when creating new packs, adding component types, or understanding how registries populate from pack data.

---

## Performance Monitor

**`window.lcards.core.performanceMonitor`** · No page of its own; see [Animation Manager](./animation-manager.md)

`AnimationPerformanceMonitor` measures frames per second while at least one `Canvas2DRenderer` (canvas background animations) has called `start()` (reference counted; `stop()` ends the loop when the last one leaves). Readings in the first 5 s after a renderer joins are ignored. Each check dispatches a `lcards:performance-check` window event with `fps`, `shouldReduceEffects` (below `reduceEffects`, 24 fps) and `shouldDisable3D` (three consecutive checks below `disable3D`, 12 fps); `Canvas2DRenderer._onPerfCheck()` then skips frames or stops. Console access: `window.lcards.debug.perf` (`fps()`, `status()`, `thresholds`; see [Debug API: `perf`](../../development/debug-api.md#perf-performance-monitor)).

---

## Portal Overlay Manager

**`window.lcards.core.portalOverlayManager`** · [Full reference →](./portal-overlay-manager.md)

Manages named overlay slots inside the Screen Effect Manager's fixed portal: `alert-overlay` (the alert overlay card), `connection-overlay` (the Connection Overlay) and `ha-service` (the `lcards.show_portal_card` action). Each slot mounts a card or a text message, owns its dismiss and duration handling and may claim the screen effect layers; the manager pushes HASS to every mounted card.

Consult this when showing content above the whole dashboard.

---

## Rules Engine

**`window.lcards.core.rulesManager`** · [Full reference →](./rules-engine.md)

Evaluates rule conditions on HASS updates and produces style patches that are merged onto target overlays; overlays have no knowledge that a rule is driving them. Supports multi-condition logic and cross-card overlay targeting by tag, type, ID, or pattern.

Consult this when implementing conditional styling, state-dependent animations, or coordinated alert patterns across multiple cards.

---

## Scoped Settings

**`window.lcards.core.scopedSettingsService`** · [Full reference →](./scoped-settings.md)

Implements a waterfall (device, then user, then global, then a caller fallback) for LCARdS settings stored in the integration backend. Reads return the most specific value set; writes target one scope. Global writes need a Home Assistant admin.

Consult this when adding new settings that need per-device or per-user overrides.

---

## Screen Effect System

**`window.lcards.core.screenEffectManager`** · [Full reference →](./screen-effects.md)

Composites full-screen effect layers (backdrop, colour and canvas slots) above the dashboard. Ships named presets (blur, static, pixelate, glitch, vignette and more) used from the console API, the `lcards.trigger_effect` action and card config. Its fixed portal also hosts the Portal Overlay Manager's slots, so the connection overlay and alert overlay content sits on top of the effect slots.

Consult this when implementing visual feedback, alert backdrop effects, or custom canvas-based screen effects.

---

## Sound System

**`window.lcards.core.soundManager`** · [Full reference →](./sound-system.md)

Event-driven audio feedback for card interactions and Home Assistant UI events. Maps events to assets via schemes defined in packs, with per-event overrides and scoped settings support for per-user and per-device sound preferences.

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

**`new UnifiedTemplateEvaluator(...)`**: not a core singleton; cards instantiate one directly · [Full reference →](./template-system.md)

Unified evaluator for all four LCARdS template types (JavaScript `[[[...]]]`, LCARdS tokens `{...}`, DataSource references `{ds:...}`, and Jinja2 `{{...}}`) applied in a fixed priority order via `UnifiedTemplateEvaluator`.

Consult this when implementing dynamic text fields, understanding template evaluation order, or injecting custom context into expressions.

---

## Theme System

**`window.lcards.core.themeManager`** · [Full reference →](./theme-system.md)

Token-based theming with alert-mode palette transformations. Maintains the active theme registry and resolves `theme:` token paths to concrete CSS values. The resolver (`themeManager.resolver`) must be accessed via `window.lcards.core`; module-level imports have no token tree.

Consult this when implementing theme-aware styling, accessing theme tokens in code or config, or supporting alert-triggered palette swaps.

---

## Validation Service

**`window.lcards.core.validationService`** · [Full reference →](./validation-service.md)

Runtime config schema validation keyed by card type. Catches structural errors and unknown fields before render and surfaces them in the editor. Card schemas are registered in `CoreConfigManager`.

Consult this when implementing card config validation, understanding error reporting paths, or debugging configuration issues in the editor.
