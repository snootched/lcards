/**
 * @fileoverview LCARdS Theme Generator
 *
 * In-app builder for a custom HA-LCARS-compatible theme profile: pick seed
 * colors (or link to LCARdS's own canon families), review the auto-generated
 * HA semantic tokens and domain/state colors, then copy the resulting theme
 * YAML into an HA-LCARS `themes.yaml`. Reuses `themeGeneratorCore.js` (also
 * used by the release-time Node generator scripts) for every computation —
 * OKLCH scale interpolation, WCAG-validated semantic tokens, and the
 * domain/state rule engine — so this UI and the shipped Picard Red/Blue
 * profiles stay backed by the same math.
 *
 * Mounted as the "generator" sub-view of lcards-theme-token-browser-tab.js.
 *
 * @element lcards-theme-generator-view
 * @property {Object} hass - Home Assistant instance
 */

import { LitElement, html, css, nothing } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { editorStyles } from '../../base/editor-styles.js';
import { infoGuideStyles } from '../shared/info-guide-styles.js';
import { searchableSelectStyles } from '../shared/searchable-select-styles.js';
import { lcardsLog } from '../../../utils/lcards-logging.js';
import { copyTextToClipboard } from '../../../utils/clipboard-utils.js';
import { yamlToConfig } from '../../utils/yaml-utils.js';
import { GREEN_ALERT_PALETTE } from '../../../core/themes/paletteInjector.js';
import { getKnownVariableCatalog } from '../../../core/themes/knownThemeVariables.js';
import { createHuiCardWrapper, applyHassToCard, isCardModAvailable } from '../../../utils/ha-card-factory.js';
import {
  TONE_ORDER, HA_PALETTE_ROLES, ROLE_TO_SLOT, SEMANTIC_ROLES, BORDER_ROLES, SEMANTIC_TIERS, SURFACE,
  toneKey, lcardsToneVarName, computeFullScale, computeHaDefaultScale, rgbToHex, hexToRgb, lerpOklch,
  resolveOnEntry, resolveFillEntry, resolveBorderEntry, resolveSurfaceEntry, resolveFormBackgroundEntry,
  DOMAIN_STATES, formatThemeYaml, WA_COLOR_ALIAS_VARS, HA_CORE_DEFAULTS,
} from '../../../core/themes/themeGeneratorCore.js';
// @ts-expect-error — Vite ?raw suffix is a build-time import; TypeScript cannot resolve relative ?raw paths
import allHaLcarsThemesRaw from '../../../../yaml/theme/ha-lcars-all-themes.yaml?raw';
import '../shared/lcards-form-section.js';
import '../shared/lcards-color-picker.js';
import '../yaml/lcards-yaml-editor.js';

const LCARDS_FAMILIES = ['orange', 'gray', 'blue', 'green', 'yellow'];
const ANCHOR_TONES = ['05', '20', '30', '40', '70', '80', '90'];
const GAP_TONES = ['10', '50', '60', '95'];

/**
 * Every theme ha-lcars ships (bundled at build time from `yaml/theme/ha-
 * lcars-all-themes.yaml`, a vendored verbatim copy of ha-lcars's own
 * generated `themes/lcars.yaml` — see that file's header). Parsed once at
 * module load: js-yaml's default schema resolves the file's `<<: *anchor`
 * merge keys natively since the anchors are defined earlier in the same
 * document, so every entry here is a fully-flat, ready-to-use key/value map.
 */
const HA_LCARS_THEME_LIBRARY = (() => {
  try {
    const parsed = yamlToConfig(allHaLcarsThemesRaw);
    const names = Object.keys(parsed).filter(n => !n.startsWith('(DO NOT'));
    // Every theme merges in the full ~180-key raw palette (&lcars-variables)
    // and ~80-key HA-var mapping (&base) verbatim — identical across all 24
    // themes wherever a theme doesn't specifically override them. Diffing
    // against this shared baseline (also present in the parsed document, as
    // its own pseudo-key entries) lets the importer keep only what's
    // actually distinctive about the theme being loaded, instead of ~300
    // boilerplate rows every time.
    const boilerplate = {
      ...(parsed['(DO NOT USE/MODIFY)=== LCARS variables'] || {}),
      ...(parsed['(DO NOT USE/MODIFY)=== Base customizations'] || {}),
    };
    return { themes: parsed, names: names.sort(), boilerplate };
  } catch (err) {
    lcardsLog.error('[ThemeGeneratorView] Failed to parse bundled ha-lcars theme library', err);
    return { themes: {}, names: [], boilerplate: {} };
  }
})();
/**
 * Flat {varName: value} map for resolving a _staticHaDefault().var reference — passed as a
 * <lcards-color-picker>'s themeContext (or a real CSS custom property spread, for a live-mounted
 * preview) so a portable value like `var(--lcars-graphite)` resolves against ha-lcars's own shared
 * anchor / HA_CORE_DEFAULTS specifically, never the live page. `boilerplate` (the shared anchor)
 * wins on overlap (there isn't any in practice — HA_CORE_DEFAULTS only covers keys the anchor
 * doesn't define — but the priority mirrors _staticHaDefault's own tier order).
 */
const STATIC_DEFAULT_CONTEXT = { ...HA_CORE_DEFAULTS, ...HA_LCARS_THEME_LIBRARY.boilerplate };
const FAMILY_LABELS = { orange: 'Orange', gray: 'Gray', blue: 'Blue', green: 'Green', yellow: 'Yellow' };
const ROLE_LABELS = { primary: 'Primary', neutral: 'Neutral', orange: 'Orange (Warning)', red: 'Red (Danger)', green: 'Green (Success)' };
const ROLE_ICONS = {
  primary: 'mdi:star-four-points', neutral: 'mdi:circle-outline',
  orange: 'mdi:alert', red: 'mdi:alert-octagon', green: 'mdi:check-circle',
};
/** Per-domain icon for each Domain & State Colors sub-section header — falls back to a generic icon for any domain not listed here (e.g. if DOMAIN_STATES gains one this list hasn't caught up with yet). */
const DOMAIN_ICONS = {
  light: 'mdi:lightbulb', switch: 'mdi:toggle-switch', fan: 'mdi:fan', cover: 'mdi:window-shutter',
  lock: 'mdi:lock', climate: 'mdi:thermostat', binary_sensor: 'mdi:radiobox-marked',
  alarm_control_panel: 'mdi:shield-home', media_player: 'mdi:cast', person: 'mdi:account',
  device_tracker: 'mdi:crosshairs-gps', humidifier: 'mdi:air-humidifier', vacuum: 'mdi:robot-vacuum',
  siren: 'mdi:bullhorn', water_heater: 'mdi:water-boiler', valve: 'mdi:valve',
  input_boolean: 'mdi:toggle-switch-outline', automation: 'mdi:robot', sun: 'mdi:white-balance-sunny',
};

/**
 * Preview-only. A faithful port of HA's real stateActive() (frontend/src/common/entity/
 * state_active.ts), restricted to the domains DOMAIN_STATES actually rosters — not a guess or a
 * generic word classifier, this mirrors HA's own per-domain logic exactly so an unset row's preview
 * swatch can resolve the same --state-<domain>-active-color/-inactive-color var (tier 3 of the real
 * fallback chain, see the Domain & State Colours info guide) the live dashboard would actually use.
 * Never exported and never affects theme output — see _liveDomainStateDefault, the only caller.
 */
function isDomainStatePreviewActive(domain, state) {
  if (state === 'off') return false;
  switch (domain) {
    case 'alarm_control_panel': return state !== 'disarmed';
    case 'cover': case 'valve': return state !== 'closed';
    case 'device_tracker': case 'person': return state !== 'not_home';
    case 'lock': return state !== 'locked';
    case 'media_player': return state !== 'standby';
    case 'vacuum': return !['idle', 'docked', 'paused'].includes(state);
    default: return true;
  }
}

/**
 * One representative "on"/active state per DOMAIN_STATES domain, used to synthesize a fake demo
 * entity for the Domain & State Colours — Live preview (see _buildDemoHass/_renderDomainDemoPreview).
 * Excludes person/device_tracker: confirmed against HA frontend source (hui-tile-card.ts's
 * _computeStateColor) that tile cards never colour those two domains' icons from CSS vars at all —
 * their colour lives on a badge via an unrelated mechanism this generator doesn't touch.
 */
const DOMAIN_DEMO_ENTITIES = [
  { domain: 'light', state: 'on' },
  { domain: 'switch', state: 'on' },
  { domain: 'fan', state: 'on' },
  { domain: 'cover', state: 'open' },
  { domain: 'lock', state: 'locked' },
  { domain: 'climate', state: 'heat' },
  { domain: 'binary_sensor', state: 'on' },
  { domain: 'alarm_control_panel', state: 'armed_home' },
  { domain: 'media_player', state: 'playing' },
  { domain: 'humidifier', state: 'on' },
  { domain: 'vacuum', state: 'cleaning' },
  { domain: 'siren', state: 'on' },
  { domain: 'water_heater', state: 'on' },
  { domain: 'valve', state: 'open' },
  { domain: 'input_boolean', state: 'on' },
  { domain: 'automation', state: 'on' },
  { domain: 'sun', state: 'above_horizon' },
];

const TONE_LABELS = {
  '05': 'Darkest', '10': '10', '20': 'Dark', '30': 'Medium Dark', '40': 'Base',
  '50': '50', '60': '60', '70': 'Medium Light', '80': 'Light', '90': 'Lightest', '95': '95',
};

const HA_COLOR_RAMP_RE = /^ha-color-(primary|neutral|orange|red|green)-(\d{2})$/;

/**
 * Every color-valued field this generator gives dedicated UI to — HA's
 * legacy semantic vars (`doc/development/ha-css-vars.md` Layer 3) plus
 * ha-lcars's full `lcars-ui-*`/card/sidebar/tooltip semantic layer
 * (`ha-lcars/src/defaults.yaml` + `&base` in `preamble.yaml` — audited
 * directly against both source files, not just this repo's own catalog).
 * Numeric/non-color base vars (ripple opacities, header font-size, etc.)
 * aren't here — those are a plain-text job, see Advanced / Raw Overrides.
 * `role`/`tone` pairs are looked up against whichever family the user
 * assigned to that palette role in "Palette Seed". `live: true` fields skip
 * that Palette Seed derivation entirely: their unset default is always
 * _staticHaDefault(field.key)'s real answer (ha-lcars's own shared anchor,
 * or HA core's own baseline) for that exact key, looked up fresh
 * every time rather than a value hand-transcribed into this array — since
 * these fields were never Palette-Seed-derived design tokens to begin with,
 * there's nothing to gain by baking a snapshot of their real value in here.
 * Omitted from export unless the user explicitly overrides one: the
 * exported YAML is designed to be merged into a real ha-lcars theme file
 * (see `mergeKeys` in _buildExportModel) that already provides these same
 * values via its own shared anchors, so re-stating them would be redundant.
 * `fixed`/`fixedDark` (a literal, hand-computed value) is reserved for the
 * rare field whose real definition genuinely can't be expressed as a simple
 * key lookup — currently only `lcars-secondary-text`, see its own comment.
 */
const LEGACY_FIELD_DEFS = [
  // ── Core ──
  { key: 'primary-color', label: 'Primary Colour', group: 'Core', role: 'primary', tone: 40 },
  { key: 'accent-color', label: 'Accent Colour', group: 'Core', role: 'primary', tone: 40 },
  { key: 'primary-background-color', label: 'Primary Background', group: 'Core', live: true },
  { key: 'secondary-background-color', label: 'Secondary Background', group: 'Core', role: 'neutral', tone: 20 },
  { key: 'card-background-color', label: 'Card Background', group: 'Core', role: 'neutral', tone: 20 },
  { key: 'lcars-background-color', label: 'LCARS Background', group: 'Core', live: true },
  // ha-lcars's own default is transparent; exposed so a user can opt into a visible divider.
  // Consumer confirmed live in 174 files across HA's frontend, not vestigial.
  { key: 'divider-color', label: 'Divider', group: 'Core', live: true },

  // ── Text ──
  { key: 'primary-text-color', label: 'Primary Text', group: 'Text', live: true },
  { key: 'secondary-text-color', label: 'Secondary Text', group: 'Text', live: true },
  { key: 'text-primary-color', label: 'Text on Primary Background', group: 'Text', live: true },
  { key: 'text-accent-color', label: 'Text on Accent Background', group: 'Text', live: true },
  { key: 'disabled-text-color', label: 'Disabled Text', group: 'Text', live: true },
  { key: 'lcars-primary-text', label: 'LCARS Primary Text', group: 'Text', live: true },
  // The one field that can't be a plain `live` key lookup: its real definition is
  // color-mix(in oklch, var(--lcars-primary-text) 80%, var(--lcars-ui-mix-color)), and
  // lcars-ui-mix-color only exists inside ha-lcars's modes.light/modes.dark blocks (black light /
  // white dark), not the flat layer _staticHaDefault's var()-substitution walks — so a plain
  // _staticHaDefault('lcars-secondary-text') lookup can't fully resolve it. Hand-computed once via
  // this generator's own lerpOklch (matches computeHaDefaultScale's math) instead of relying on the
  // picker's own CSS color-mix() support, which would only resolve correctly in a runtime that
  // actually implements `in oklch` interpolation, silently falling back to gray otherwise.
  { key: 'lcars-secondary-text', label: 'LCARS Secondary Text', group: 'Text', fixed: '#bebebe', fixedDark: '#ffffff' },
  { key: 'lcars-background-text', label: 'LCARS Background Text', group: 'Text', live: true },

  // ── Status Colours (alerts, badges, energy) ── the 5 state-*-color entity-state fallback fields
  // below are tagged with this same group for data/export purposes, but render in the Domain &
  // State Colours section instead (see DOMAIN_FALLBACK_KEYS) — they're this chain's real starting
  // point, not a generic "status" colour.
  { key: 'success-color', label: 'Success', group: 'Status Colours', role: 'green', tone: 40 },
  { key: 'warning-color', label: 'Warning', group: 'Status Colours', role: 'orange', tone: 40 },
  { key: 'error-color', label: 'Error', group: 'Status Colours', role: 'red', tone: 40 },
  { key: 'info-color', label: 'Info', group: 'Status Colours', role: 'primary', tone: 40 },
  { key: 'state-active-color', label: 'State: Active', group: 'Status Colours', live: true },
  { key: 'state-inactive-color', label: 'State: Inactive', group: 'Status Colours', live: true },
  { key: 'state-unavailable-color', label: 'State: Unavailable', group: 'Status Colours', live: true },
  { key: 'state-unknown-color', label: 'State: Unknown', group: 'Status Colours', live: true },
  { key: 'state-color', label: 'State: Default Icon', group: 'Status Colours', live: true },
  // Label badges (ha-label-badge.ts/ha-state-label-badge.ts) and the energy dashboard's
  // non-fossil indicator (hui-energy-distribution-card.ts) — all confirmed live consumers, not
  // just present in ha-lcars's own boilerplate. Red/yellow/green mirror error/warning/success's
  // own role choice; no dedicated Blue Palette Seed role exists, so blue mirrors info-color's;
  // grey mirrors state-inactive-color's neutral/60.
  { key: 'label-badge-text-color', label: 'Label Badge Text', group: 'Status Colours', live: true },
  { key: 'label-badge-red', label: 'Label Badge: Red', group: 'Status Colours', role: 'red', tone: 40 },
  { key: 'label-badge-yellow', label: 'Label Badge: Yellow', group: 'Status Colours', role: 'orange', tone: 40 },
  { key: 'label-badge-blue', label: 'Label Badge: Blue', group: 'Status Colours', role: 'primary', tone: 40 },
  { key: 'label-badge-green', label: 'Label Badge: Green', group: 'Status Colours', role: 'green', tone: 40 },
  { key: 'label-badge-grey', label: 'Label Badge: Grey', group: 'Status Colours', role: 'neutral', tone: 60 },
  { key: 'energy-non-fossil-color', label: 'Energy: Non-Fossil', group: 'Status Colours', role: 'green', tone: 40 },

  // ── LCARS UI ──
  { key: 'lcars-ui-primary', label: 'LCARS UI Primary', group: 'LCARS UI', role: 'primary', tone: 40 },
  { key: 'lcars-ui-primary-text', label: 'LCARS UI Primary Text', group: 'LCARS UI', live: true },
  { key: 'lcars-ui-secondary', label: 'LCARS UI Secondary', group: 'LCARS UI', role: 'neutral', tone: 60 },
  { key: 'lcars-ui-secondary-text', label: 'LCARS UI Secondary Text', group: 'LCARS UI', live: true },
  { key: 'lcars-ui-tertiary', label: 'LCARS UI Tertiary', group: 'LCARS UI', role: 'primary', tone: 40 },
  { key: 'lcars-ui-tertiary-text', label: 'LCARS UI Tertiary Text', group: 'LCARS UI', live: true },
  { key: 'lcars-ui-quaternary', label: 'LCARS UI Quaternary', group: 'LCARS UI', role: 'neutral', tone: 20 },
  { key: 'lcars-ui-quaternary-text', label: 'LCARS UI Quaternary Text', group: 'LCARS UI', role: 'neutral', tone: 90 },
  { key: 'lcars-ui-accent-color', label: 'LCARS UI Accent', group: 'LCARS UI', role: 'primary', tone: 40 },
  { key: 'lcars-ui-accent-text', label: 'LCARS UI Accent Text', group: 'LCARS UI', live: true },
  { key: 'lcars-ui-text-heading', label: 'LCARS UI Heading Text', group: 'LCARS UI', role: 'neutral', tone: 90 },
  { key: 'lcars-ui-app-header-background-color', label: 'App Header Background', group: 'LCARS UI', role: 'primary', tone: 40 },
  { key: 'lcars-ui-app-header-text-color', label: 'App Header Text', group: 'LCARS UI', live: true },
  { key: 'lcars-ui-app-header-clock', label: 'App Header Clock', group: 'LCARS UI', role: 'neutral', tone: 90 },
  { key: 'lcars-ui-config-button', label: 'Config Button', group: 'LCARS UI', role: 'primary', tone: 40 },
  { key: 'lcars-ui-config-icon', label: 'Config Icon', group: 'LCARS UI', live: true },

  // ── Cards ──
  { key: 'lcars-card-top-color', label: 'Card Top', group: 'Cards', role: 'primary', tone: 40 },
  { key: 'lcars-card-top-text', label: 'Card Top Text', group: 'Cards', live: true },
  { key: 'lcars-card-mid-color', label: 'Card Middle', group: 'Cards', role: 'neutral', tone: 60 },
  { key: 'lcars-card-mid-text', label: 'Card Middle Text', group: 'Cards', live: true },
  { key: 'lcars-card-button-color', label: 'Card Button', group: 'Cards', role: 'primary', tone: 40 },
  { key: 'lcars-card-button-text', label: 'Card Button Text', group: 'Cards', live: true },
  { key: 'lcars-card-bottom-color', label: 'Card Bottom', group: 'Cards', role: 'neutral', tone: 60 },
  { key: 'lcars-card-bottom-text', label: 'Card Bottom Text', group: 'Cards', live: true },
  { key: 'lcars-settings-card-color', label: 'Settings Card', group: 'Cards', role: 'neutral', tone: 60 },
  { key: 'lcars-settings-card-text', label: 'Settings Card Text', group: 'Cards', role: 'neutral', tone: 90 },
  // MDC-themed inputs/selects still used throughout HA (ha-alert.ts, ha-radio-list-item.ts,
  // ha-check-list-item.ts, entity pickers, …) despite HA moving new components away from MWC —
  // confirmed live (23/3/2/3 consumer files respectively), not vestigial, before adding these.
  { key: 'mdc-theme-primary', label: 'MDC Theme Primary', group: 'Cards', role: 'neutral', tone: 90 },
  { key: 'mdc-theme-secondary', label: 'MDC Theme Secondary', group: 'Cards', role: 'neutral', tone: 90 },
  { key: 'mdc-theme-on-primary', label: 'MDC Theme On Primary', group: 'Cards', live: true },
  { key: 'mdc-theme-on-secondary', label: 'MDC Theme On Secondary', group: 'Cards', live: true },
  { key: 'control-circular-slider-background', label: 'Thermostat Slider Background', group: 'Cards', role: 'neutral', tone: 20 },

  // ── Sidebar ──
  { key: 'lcars-sidebar-background', label: 'Sidebar Background', group: 'Sidebar', live: true },
  { key: 'lcars-sidebar-text', label: 'Sidebar Text', group: 'Sidebar', role: 'neutral', tone: 90 },
  { key: 'lcars-sidebar-icon-color', label: 'Sidebar Icon', group: 'Sidebar', role: 'neutral', tone: 90 },
  { key: 'lcars-sidebar-icon-background', label: 'Sidebar Icon Background', group: 'Sidebar', role: 'neutral', tone: 20 },
  { key: 'lcars-sidebar-item-color', label: 'Sidebar Item', group: 'Sidebar', role: 'neutral', tone: 90 },
  { key: 'lcars-sidebar-selected-color', label: 'Sidebar Selected', group: 'Sidebar', role: 'primary', tone: 40 },
  { key: 'lcars-sidebar-notification-color', label: 'Sidebar Notification', group: 'Sidebar', role: 'red', tone: 40 },

  // ── Tooltip & Misc ──
  { key: 'lcars-tooltip-background', label: 'Tooltip Background', group: 'Tooltip & Misc', role: 'neutral', tone: 60 },
  { key: 'lcars-tooltip-text', label: 'Tooltip Text', group: 'Tooltip & Misc', live: true },
  { key: 'lcars-ripple-color', label: 'Ripple Effect', group: 'Tooltip & Misc', role: 'primary', tone: 40 },
  // input-dropdown-icon-color (ha-form-multi_select.ts) and ha-outlined-field-container-color
  // (ha-outlined-field.ts — the newer, post-MWC input component family, actively current) and
  // markdown-code-text-color (ha-markdown.ts, ha-assist-chat.ts) all confirmed live consumers.
  // more-info-header-background and mini-media-player-base/icon-color were deliberately left out
  // here — verified against the real frontend checkout, not just ha-lcars's own boilerplate:
  // more-info-header-background has zero consumers anywhere in current HA frontend, and
  // mini-media-player-* belongs to a third-party HACS card, not HA core.
  { key: 'input-dropdown-icon-color', label: 'Input Dropdown Icon', group: 'Tooltip & Misc', role: 'neutral', tone: 90 },
  { key: 'ha-outlined-field-container-color', label: 'Outlined Field Container', group: 'Tooltip & Misc', role: 'neutral', tone: 90 },
  { key: 'markdown-code-text-color', label: 'Markdown Code Text', group: 'Tooltip & Misc', live: true },
  { key: 'code-editor-background-color', label: 'Code Editor Background', group: 'Tooltip & Misc', live: true },
];
const LEGACY_KEYS = new Set(LEGACY_FIELD_DEFS.map(f => f.key));
/**
 * LEGACY_FIELD_DEFS keys needing an auto-generated --rgb-<key> companion (comma-separated R,G,B
 * decimals). HA's own theme-application code (apply_themes_on_element.ts's processTheme()) only
 * auto-derives --rgb-<key> from --<key> when the value is a literal hex string — every one of
 * these fields resolves to a portable var(--ha-color-x-y, ...) reference instead (or, for the
 * fixed-hex ones, is included anyway for structural parity with genuine ha-lcars theme output),
 * so HA's auto-derivation silently never fires and any rgba(var(--rgb-x), N) effect throughout
 * HA's core frontend (ha-data-table.ts, ha-automation-row.ts, ha-suggest-with-ai-button.ts,
 * ha-config-integration-page.ts, ha-config-entry-row.ts, etc. — confirmed via direct frontend
 * source grep, not assumed) silently falls back to HA's stock blue/orange tint. This is the
 * generator's own confirmed 7-field set (primary/accent/card-bg/error/success/warning/info),
 * not simply copied from ha-lcars's own hand-authored set — ha-lcars's bundled themes omit the
 * 4 status-color companions entirely (a gap of their own), and 2 of ha-lcars's own 7
 * (primary-background-color/primary-text-color/secondary-text-color minus the ones already
 * fixed-hex) don't actually need our help since HA auto-derives literal hex correctly — kept
 * anyway here for output parity with what a genuine ha-lcars theme file looks like.
 */
const RGB_COMPANION_FIELDS = new Set([
  'primary-color', 'accent-color', 'card-background-color',
  'secondary-background-color', 'primary-background-color',
  'primary-text-color', 'secondary-text-color',
  'error-color', 'success-color', 'warning-color', 'info-color',
]);
// These 5 LEGACY_FIELD_DEFS keys are the genuine, primary starting point of HA's real per-entity
// state-color fallback chain (frontend/src/common/entity/state_color.ts: domain+state ->
// domain+active/inactive -> these generic fields). Still defined/exported exactly like every other
// LEGACY_FIELD_DEFS entry (see _buildExportModel's Legacy loop) — this Set only controls where they
// RENDER: pulled out of _renderLegacySection's "Status Colours" group and shown instead at the top
// of Domain & State Colours, next to the per-domain rows that build on them.
const DOMAIN_FALLBACK_KEYS = new Set([
  'state-active-color', 'state-inactive-color', 'state-unavailable-color', 'state-unknown-color', 'state-color',
]);
// Display order, most relevant/foundational first — LCARS UI leads since its primary/secondary/
// tertiary/quaternary tiers are what everything else ha-lcars-specific (Cards, Sidebar, Tooltip)
// visually derives from; Core (HA's own primary-color/backgrounds) follows since it's foundational
// too, just to plain HA chrome rather than LCARS-specific styling. Status Colours and Tooltip &
// Misc are the least commonly hand-tuned, so they trail.
const LEGACY_GROUP_ORDER = ['LCARS UI', 'Core', 'Text', 'Cards', 'Sidebar', 'Status Colours', 'Tooltip & Misc'];
const LEGACY_GROUPS = LEGACY_GROUP_ORDER.filter(g => LEGACY_FIELD_DEFS.some(f => f.group === g));

const DOMAIN_KEY_RE = /^state-([a-z0-9_]+)-([a-z0-9_]+)-color$/;

/** Badge text for a _staticHaDefault()/_liveDomainStateDefault() tier — 'unknown' gets no badge at all (see _staticHaDefault's doc comment: genuinely no source exists, showing one would be dishonest). */
const DEFAULT_TIER_LABELS = { lcars: 'HA-LCARS Default', ha: 'HA Default', global: 'Global Default', unknown: null };

/** Real <ha-button> variant/role pairing for the Live Component Preview — semantic role -> ha-button's own `variant` attribute (note: primary maps to "brand", not "primary"). */
const HA_BUTTON_VARIANTS = [
  { role: 'primary', variant: 'brand', label: 'Primary' },
  { role: 'neutral', variant: 'neutral', label: 'Neutral' },
  { role: 'danger', variant: 'danger', label: 'Danger' },
  { role: 'warning', variant: 'warning', label: 'Warning' },
  { role: 'success', variant: 'success', label: 'Success' },
];
/** ha-button's `appearance` attribute per tier — "accent" reads the loud fill tokens, "filled" reads the normal fill tokens. */
const HA_BUTTON_TIERS = [
  { appearance: 'accent', label: 'Loud' },
  { appearance: 'filled', label: 'Normal' },
];

/**
 * The five foundational `lcars-ui-*` tier colours (LEGACY_FIELD_DEFS's "LCARS UI" group) paired
 * with their own `-text` field, for the "UI Colour Tiers" mockup cell in _renderLcarsMockups. No
 * real HA component consumes these vars directly (unlike Core/Text, which ha-button/ha-card read
 * via HA's own --ha-color-* / --primary-color tokens) and they aren't tied to a single card_mod
 * class the way Cards' lcars-card-top/mid/button/bottom are, so — unlike Cards — there's no
 * existing real-component or card_mod rendering of these anywhere else in this preview to lean on.
 */
const UI_TIER_BARS = [
  { key: 'lcars-ui-primary', textKey: 'lcars-ui-primary-text', label: 'Primary' },
  { key: 'lcars-ui-secondary', textKey: 'lcars-ui-secondary-text', label: 'Secondary' },
  { key: 'lcars-ui-tertiary', textKey: 'lcars-ui-tertiary-text', label: 'Tertiary' },
  { key: 'lcars-ui-quaternary', textKey: 'lcars-ui-quaternary-text', label: 'Quaternary' },
  { key: 'lcars-ui-accent-color', textKey: 'lcars-ui-accent-text', label: 'Accent' },
];

/**
 * Real card_mod demo configs matching examples straight from ha-lcars's own README ("Usage
 * instructions" > "Classes"), grouped for display. Button demos deliberately use only a
 * name/icon, never a real entity — the README's own examples bind to specific lights/switches,
 * but this generator can't assume any particular entity exists in the user's HA instance; a
 * `type: button` card renders fine without one (the README's own "button-large" example does the
 * same, for its "reload themes" action button). Rendered only when isCardModAvailable() — see
 * _renderLcarsCardModPreview. ALL_CARDMOD_DEMOS is the flattened form the mount/update loop uses.
 *
 * `narrow: true` on lozenge/bullet: ha-lcars's own README states these classes are "only works on
 * standard button cards; also works on button cards in a horizontal-stacks and grids up to two
 * columns wide; more columns get glitchy" — their CSS absolutely-positions the icon into a fixed-
 * width strip on one end (`> ha-state-icon { width: var(--lcars-vertical-border); position:
 * absolute; height:100%; ...}`) with the label `<span>` filling the rest, which only reads as the
 * intended pill/capped shape at the narrow, moderately-tall proportions the README's own reference
 * screenshots use (~159px wide) — the general mockup grid's wide `minmax(200px,1fr)` auto-fit cells
 * (sized for the header/middle/footer bars) starve these of the height they need, which is what
 * produced the "icon in the large area, text clipped" layout bug. button-small/-large don't set
 * this: their own CSS uses a different (non-absolute-icon-strip) technique and aren't subject to
 * the same column-width warning.
 * @type {{group: string, demos: {slot: string, label: string, narrow?: boolean, config: Object<string,*>}[]}[]}
 */
const LCARS_CARDMOD_DEMOS = [
  {
    group: 'Header / Middle / Footer',
    demos: [
      { slot: 'header', label: 'header-left', config: { type: 'markdown', content: '# HEADER-LEFT', card_mod: { class: 'header-left' } } },
      { slot: 'middle', label: 'middle-left', config: { type: 'markdown', content: '# MIDDLE-LEFT', card_mod: { class: 'middle-left' } } },
      { slot: 'footer', label: 'footer-left', config: { type: 'markdown', content: '# FOOTER-LEFT', card_mod: { class: 'footer-left' } } },
    ],
  },
  {
    group: 'Buttons',
    demos: [
      { slot: 'btn-small', label: 'button-small', config: { type: 'button', show_name: true, show_icon: true, name: 'Desk Lamp', icon: 'mdi:desk-lamp', card_mod: { class: 'button-small' } } },
      { slot: 'btn-large', label: 'button-large', config: { type: 'button', show_name: true, show_icon: true, name: 'Reload', icon: 'mdi:refresh', card_mod: { class: 'button-large' } } },
      { slot: 'btn-lozenge-l', label: 'button-lozenge-left', narrow: true, config: { type: 'button', show_name: true, show_icon: true, name: 'Speakers', icon: 'mdi:speaker-multiple', card_mod: { class: 'button-lozenge-left' } } },
      { slot: 'btn-lozenge-r', label: 'button-lozenge-right', narrow: true, config: { type: 'button', show_name: true, show_icon: true, name: 'Lightsaber', icon: 'mdi:lightsaber', card_mod: { class: 'button-lozenge-right' } } },
      { slot: 'btn-bullet-l', label: 'button-bullet-left', narrow: true, config: { type: 'button', show_name: true, show_icon: true, name: 'Tree', icon: 'mdi:pine-tree', card_mod: { class: 'button-bullet-left' } } },
      { slot: 'btn-bullet-r', label: 'button-bullet-right', narrow: true, config: { type: 'button', show_name: true, show_icon: true, name: 'Counter', icon: 'mdi:lightbulb-group', card_mod: { class: 'button-bullet-right' } } },
    ],
  },
  {
    group: 'Standalone Bars',
    demos: [
      { slot: 'bar-l', label: 'bar-left', config: { type: 'markdown', content: 'bar-left', card_mod: { class: 'bar-left' } } },
      { slot: 'bar-r', label: 'bar-right', config: { type: 'markdown', content: 'bar-right', card_mod: { class: 'bar-right' } } },
    ],
  },
];
const ALL_CARDMOD_DEMOS = LCARS_CARDMOD_DEMOS.flatMap(g => g.demos);

export class LCARdSThemeGeneratorView extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      _model: { state: true },
      _pasteYamlText: { state: true },
      _importError: { state: true },
      _importFeedback: { state: true },
      _previewMode: { state: true },
      _copyFeedback: { state: true },
      _rawFilterText: { state: true },
      _selectedLibraryTheme: { state: true },
      _expandedGuideIds: { state: true },
      _startMode: { state: true },
    };
  }

  constructor() {
    super();
    this.hass = undefined;
    this._model = this._createDefaultModel();
    this._pasteYamlText = '';
    this._importError = null;
    this._importFeedback = null;
    this._previewMode = 'dark';
    this._copyFeedback = false;
    this._rawFilterText = '';
    this._expandedGuideIds = new Set();
    /** Flat var map of the theme last imported (library or pasted), if any — passed to color pickers as `themeContext` so swatch previews for values still expressed as raw var() references resolve against the actual imported theme instead of whatever's live on the page. Not reactive on its own; always set/cleared in the same call as a _model write, which already triggers re-render. */
    this._importedThemeContext = null;
    /** _staticColorContext()'s memoization: the _importedThemeContext identity its cached merged context was last built from. */
    this._staticColorContextSource = undefined;
    this._staticColorContextCache = null;
    /** _liveImportedThemeContext()'s memoization: the {imported, legacy, raw} identities its cached merged context was last built from. */
    this._liveContextSource = null;
    this._liveContextCache = null;
    // Starts from "LCARS Default" (the same bundled reference theme _staticHaDefault used to treat as
    // an implicit, unlabeled fallback) via the real, already-correct import path — not a bespoke
    // "blank" model. This is what "Start Blank" used to fake with a parallel static-preview system;
    // importing for real means every field is a genuine, editable, revertable value from the start,
    // exactly like picking any other bundled theme, rather than a second mechanism duplicating it.
    this._startMode = 'library';
    this._selectedLibraryTheme = 'LCARS Default';
    this._importThemeObject('LCARS Default', HA_LCARS_THEME_LIBRARY.themes['LCARS Default']);
    /** slot -> mounted <hui-card> wrapper element for the real card_mod demos (see _renderLcarsCardModPreview). Plain instance properties, not Lit-reactive — mirrors lcards-elbow.js's _symbiontElement convention, since these are imperatively created/mounted DOM nodes the render() output only provides a stable container for. */
    this._lcarsCardModWrappers = {};
    /** domain -> mounted <hui-card> (tile) wrapper element for the synthetic-entity demos (see _renderDomainDemoPreview). Same plain, non-Lit-reactive convention as _lcarsCardModWrappers. */
    this._domainDemoWrappers = {};
    /** _buildDemoHass()'s memoization cache — the hass object identity it was last computed from, and the resulting clone. */
    this._demoHassSourceHass = null;
    this._demoHassCache = null;
  }

  /** @returns {{name: string, roles: Object<string,{source: string, family?: string, darkFamily?: string}>, customAnchors: Object, customAnchorsTouched: Object, customAnchorsDark: Object, customAnchorsDarkTouched: Object, importedRamps: Object, importedRampsRaw: Object, legacy: Object, domainOverrides: Object, raw: Array}} */
  _createDefaultModel() {
    return {
      name: 'My HA-LCARS Theme',
      // Every role starts genuinely unset — mirrors exactly what _importThemeObject already does for
      // any role an imported theme doesn't define (see its own comment: pre-selecting a family here
      // would misleadingly imply it's actually part of the theme, when it isn't). A "blank" theme
      // should mean blank: every role/tone-driven field falls through to HA's own real live default
      // (via the existing roleUnset/_isRoleTonePreviewFallback machinery) until the user deliberately
      // assigns something in Palette Seed.
      roles: {
        primary: { source: 'none' },
        neutral: { source: 'none' },
        orange: { source: 'none' },
        red: { source: 'none' },
        green: { source: 'none' },
      },
      customAnchors: {},
      customAnchorsTouched: {},
      customAnchorsDark: {},
      customAnchorsDarkTouched: {},
      importedRamps: {},
      // Same per-role/tone shape as importedRamps, but the theme's own ORIGINAL portable
      // text (e.g. "var(--lcars-ui-tertiary)", "color-mix(in oklch, var(--lcars-ui-tertiary)
      // 8%, white)") — never resolved. importedRamps is for Palette Seed's own swatches/math
      // (always needs concrete hex); this is what Custom mode seeds from when switching off
      // "Imported", so the user keeps editing the theme's real, portable definitions instead
      // of losing them to a one-way bake to hex.
      importedRampsRaw: {},
      legacy: {},
      domainOverrides: {},
      raw: [],
    };
  }

  static get styles() {
    return [
      editorStyles,
      infoGuideStyles,
      searchableSelectStyles,
      css`
        :host { display: block; background: none; }
        .gen-hint {
          font-size: var(--ha-font-size-m);
          color: var(--secondary-text-color);
          line-height: 1.5;
          margin: 0 0 var(--ha-space-3) 0;
        }
        .gen-field-row {
          display: grid;
          grid-template-columns: minmax(160px, 260px) 1fr auto 1fr auto;
          align-items: center;
          gap: var(--ha-space-3);
          padding: var(--ha-space-2) var(--ha-space-2);
          border-bottom: var(--ha-border-width-sm) solid var(--divider-color, #e0e0e0);
        }
        .gen-field-row:last-child { border-bottom: none; }
        /* Zebra striping — a single thin bottom border reads poorly once rows get tall (color
           picker + preview swatch, vertically centered), since the eye loses the row band scanning
           left to right. A background band per row fixes that regardless of row height. */
        .gen-field-row:nth-child(even), .gen-raw-row:nth-child(even) {
          background: color-mix(in srgb, var(--secondary-background-color) 35%, transparent);
        }
        .gen-field-label { font-weight: 500; font-size: var(--ha-font-size-m); display: flex; flex-direction: column; gap: 2px; }
        .gen-field-varname { font-family: 'Fira Code','Consolas','Menlo',monospace; font-size: 11px; color: var(--secondary-text-color); opacity: 0.8; font-weight: normal; }
        .gen-revert-spacer { width: 40px; }
        .gen-row-header {
          display: grid; grid-template-columns: minmax(160px, 260px) 1fr auto 1fr auto; gap: var(--ha-space-3);
          font-size: var(--ha-font-size-s); color: var(--secondary-text-color); font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.04em; padding: 0 0 var(--ha-space-2) 0;
        }
        .gen-dark-toggle { display: flex; align-items: center; gap: var(--ha-space-1); flex-shrink: 0; }
        .gen-dark-toggle-label { font-size: var(--ha-font-size-s); color: var(--secondary-text-color); white-space: nowrap; }
        .gen-dark-empty { font-size: var(--ha-font-size-s); color: var(--secondary-text-color); opacity: 0.6; font-style: italic; }
        .gen-preset-row, .gen-toolbar-row { display: flex; gap: var(--ha-space-2); flex-wrap: wrap; align-items: center; margin: var(--ha-space-2) 0; }
        /* Keeps the Light/Dark mode toggle in view while scrolling a long Preview & Export
           section — otherwise switching modes means scrolling all the way back to the top every
           time. Harmless no-op if some ancestor's overflow/transform blocks sticky from engaging.
           Background must match lcards-form-section's own ha-expansion-panel background formula
           (see lcards-form-section.js) — this toolbar sits in the outer editor page's own theme
           context (not the theme being edited, unlike the preview boxes below it), so a plain
           --card-background-color reads as a mismatched grey bar against the panel's actual
           tinted background rather than blending into it. */
        .gen-preview-mode-toolbar {
          position: sticky; top: 0; z-index: 2; padding-block: var(--ha-space-2);
          background: color-mix(in srgb, var(--secondary-background-color) 30%, color-mix(in srgb, var(--primary-background-color) 95%, transparent));
        }
        .gen-role-header { display: flex; align-items: center; gap: var(--ha-space-3); margin-bottom: var(--ha-space-2); flex-wrap: wrap; }
        .gen-toggle-group ha-button::part(base) {
          min-height: 28px; height: 28px; padding-block: 0; font-size: var(--ha-font-size-s, 12px);
        }
        .gen-toggle-group-m ha-button::part(base) {
          min-height: 40px; height: 40px; font-size: var(--ha-font-size-m, 14px);
        }
        .gen-toggle-group ha-button:first-child::part(base) {
          border-start-start-radius: var(--ha-border-radius-pill); border-end-start-radius: var(--ha-border-radius-pill);
          border-start-end-radius: 0; border-end-end-radius: 0; border-inline-end: none;
        }
        .gen-toggle-group ha-button:last-child::part(base) {
          border-start-start-radius: 0; border-end-start-radius: 0;
          border-start-end-radius: var(--ha-border-radius-pill); border-end-end-radius: var(--ha-border-radius-pill);
        }
        .gen-toggle-group ha-button:not(:first-child):not(:last-child)::part(base) {
          border-radius: 0; border-inline-end: none;
        }
        .gen-anchor-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: var(--ha-space-3); margin-bottom: var(--ha-space-3); }
        .gen-anchor-cell { display: flex; flex-direction: column; gap: var(--ha-space-1); padding: var(--ha-space-2); border-radius: var(--ha-border-radius-sm); }
        .gen-anchor-cell label { font-size: var(--ha-font-size-s); color: var(--secondary-text-color); }
        .gen-anchor-cell.gen-anchor-gap label { font-style: italic; opacity: 0.85; }
        .gen-anchor-cell.gen-anchor-base {
          border: var(--ha-border-width-md) solid var(--primary-color);
          background: color-mix(in srgb, var(--primary-color) 8%, transparent);
        }
        .gen-anchor-cell.gen-anchor-base label { color: var(--primary-color); font-weight: 600; font-style: normal; opacity: 1; }
        .gen-role-content { margin-bottom: var(--ha-space-4); }
        .gen-mode-columns {
          display: grid; grid-template-columns: 1fr 1fr; gap: var(--ha-space-4);
          padding: var(--ha-space-3); border-radius: var(--ha-border-radius-sm);
          background: color-mix(in srgb, var(--secondary-background-color) 40%, transparent);
          margin-bottom: var(--ha-space-2);
        }
        .gen-mode-column { min-width: 0; }
        .gen-mode-column-label {
          font-size: var(--ha-font-size-s); font-weight: 600; text-transform: uppercase;
          letter-spacing: 0.04em; color: var(--secondary-text-color); margin-bottom: var(--ha-space-2);
        }
        .gen-scale-row { display: flex; align-items: center; gap: var(--ha-space-3); margin-bottom: var(--ha-space-2); }
        .gen-scale-label { flex: 0 0 90px; font-size: var(--ha-font-size-s); font-weight: 500; }
        .gen-scale-swatches { display: flex; gap: 2px; flex: 1; }
        /* Checkerboard base layer so a genuinely transparent value reads as transparent (checker
           shows through) rather than looking identical to an opaque colour that happens to match
           whatever's behind the swatch — the standard design-tool convention for this. Swatches set
           only background-color inline (never the background shorthand) so this background-image
           survives underneath it. Border uses --divider-color (matches the same pattern already used
           for the alert-mode preview swatches in lcards-theme-token-browser-tab.js) instead of a fixed
           rgba(0,0,0,X), which is invisible against black/near-black swatch values. */
        .gen-scale-swatch, .gen-varswatch-swatch {
          background-image:
            linear-gradient(45deg, rgba(128,128,128,0.4) 25%, transparent 25%),
            linear-gradient(-45deg, rgba(128,128,128,0.4) 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, rgba(128,128,128,0.4) 75%),
            linear-gradient(-45deg, transparent 75%, rgba(128,128,128,0.4) 75%);
          background-size: 8px 8px;
          background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
          position: relative;
        }
        /* The actual swatch colour lives on this separate, absolutely-positioned child rather than
           the swatch's own background-color — CSS always paints background-image above
           background-color on the same element, so a checkerboard set that way would show on top
           of every colour, opaque or not. Stacking a real element over the checkerboard instead
           means an opaque fill fully covers it (checkerboard invisible) while a transparent one
           lets it show through underneath, same as any real colour-tool's transparency indicator. */
        .gen-swatch-fill { position: absolute; inset: 0; border-radius: inherit; }
        .gen-scale-swatch { flex: 1; height: 32px; border-radius: var(--ha-border-radius-sm); border: var(--ha-border-width-sm) solid var(--divider-color, #e0e0e0); }
        .gen-scale-swatch-tag {
          position: absolute; right: 2px; bottom: 2px; font-size: 10px; line-height: 1.5;
          font-family: 'Fira Code','Consolas','Menlo',monospace; padding: 0 3px; border-radius: 2px;
          background: rgba(255,255,255,0.8); color: #000; pointer-events: none; user-select: none;
        }
        .gen-scale-swatch-fallback { border: var(--ha-border-width-sm) dashed color-mix(in srgb, currentColor 40%, transparent); opacity: 0.85; }
        .gen-fallback-badge {
          flex: 0 0 auto; font-size: var(--ha-font-size-s); font-weight: 600; text-transform: uppercase;
          letter-spacing: 0.03em; padding: 2px var(--ha-space-2); border-radius: var(--ha-border-radius-pill);
          border: var(--ha-border-width-sm) dashed var(--secondary-text-color); color: var(--secondary-text-color);
          white-space: nowrap;
        }
        .gen-raw-row {
          display: grid; grid-template-columns: minmax(200px, 280px) 1fr auto 1fr auto;
          align-items: center; gap: var(--ha-space-3); padding: var(--ha-space-2);
          border-bottom: var(--ha-border-width-sm) solid var(--divider-color, #e0e0e0);
        }
        .gen-btn-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: var(--ha-space-3); margin: var(--ha-space-3) 0; }
        /* No fill — a solid-colour cell background here tends to land on/near the same neutral
           tones real card/button colours use, making the cell edges hard to tell from the content
           inside it. An outline groups the cell without competing with whatever colour is being
           previewed. */
        .gen-btn-cell { background: transparent; border: var(--ha-border-width-sm) solid var(--divider-color, #e0e0e0); border-radius: var(--ha-border-radius-md); padding: var(--ha-space-3); text-align: center; }
        .gen-btn-cell-fallback { border: var(--ha-border-width-sm) dashed var(--secondary-text-color); }
        .gen-mock-caption { font-size: var(--ha-font-size-s); opacity: 0.7; margin-top: var(--ha-space-1); }
        .gen-imported-note { font-size: var(--ha-font-size-m); color: var(--secondary-text-color); margin-bottom: var(--ha-space-3); }
        /* align-items:start overrides CSS Grid's default stretch — otherwise every cell in a row
           stretches to match its row's tallest cell, so a deliberately-tall neighbour (e.g. a
           lozenge/bullet button, see .gen-mockup-cell-narrow below) drags ordinary button-small/
           button-large cells up into the same tall, square-looking box even though they never
           asked for that height. Each cell now sizes to its own content instead. */
        .gen-mockup-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--ha-space-4); margin: var(--ha-space-3) 0; align-items: start; }
        .gen-mockup-cell { background: transparent; border: var(--ha-border-width-sm) solid var(--divider-color, #e0e0e0); border-radius: var(--ha-border-radius-md); padding: var(--ha-space-3); }
        /* lozenge/bullet button demos (see LCARS_CARDMOD_DEMOS's narrow:true doc comment) need a
           narrower cell than the general auto-fit grid gives them (sized for wide header/middle/
           footer bars) — ha-lcars's own CSS already handles height itself (min-height: 60px on the
           real <ha-card>, same as any other HA button — no override needed here once the grid stops
           stretching rows, see .gen-mockup-grid's align-items above). Width can't be a fixed pixel
           value, though: the icon strip's own width IS --lcars-vertical-border (ha-lcars's own CSS
           sets ha-state-icon's width to var(--lcars-vertical-border)), and that var is
           user-configurable per-install via an input_number helper (ha-lcars's own "adjust border
           thickness" feature) — a real install can set it far above the 35px boilerplate default
           (confirmed via a live DOM export: one instance had it at 132px). A fixed-width cell left
           almost nothing for the label in that case. Scale the cell width off the same variable so
           there's always a consistent amount of room for text beyond however wide the icon strip
           actually renders, capped so an extreme value doesn't blow out the whole grid. */
        .gen-mockup-cell-narrow { width: clamp(160px, calc(var(--lcars-vertical-border, 35px) + 130px), 320px); justify-self: start; }
        .gen-live-preview {
          /* lcars-background-color (the real HA-LCARS page backdrop), not card-background-color —
             the latter usually matches (or nearly matches) one of the actual card colours shown
             inside this box (e.g. it's the same var ha-card itself reads), so using it here made
             the wrapper blend into its own contents instead of reading as "the page behind the
             cards" the way a real HA-LCARS dashboard does. */
          background: var(--lcars-background-color); color: var(--primary-text-color);
          border-radius: var(--ha-border-radius-md); padding: var(--ha-space-4); margin: var(--ha-space-3) 0;
        }
        .gen-live-switch-row { display: flex; gap: var(--ha-space-4); margin-top: var(--ha-space-3); }
        .gen-alert-stack { display: flex; flex-direction: column; gap: var(--ha-space-2); margin-bottom: var(--ha-space-4); }
        .gen-varswatch-group { margin-bottom: var(--ha-space-4); }
        .gen-varswatch-group:last-child { margin-bottom: 0; }
        .gen-varswatch-row { display: flex; flex-wrap: wrap; gap: var(--ha-space-3); }
        .gen-varswatch-chip { display: flex; flex-direction: column; align-items: center; gap: var(--ha-space-1); width: 76px; }
        .gen-varswatch-swatch { width: 40px; height: 40px; border-radius: var(--ha-border-radius-md); border: var(--ha-border-width-sm) solid var(--divider-color, #e0e0e0); }
        .gen-varswatch-label { font-size: var(--ha-font-size-s); text-align: center; opacity: 0.85; line-height: 1.2; }
        .gen-cardmod-slot { min-height: 40px; }
        .gen-domain-demo-slot { min-height: 40px; }
        .gen-mockup-caption { font-size: var(--ha-font-size-s); font-weight: 600; color: var(--secondary-text-color); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: var(--ha-space-2); }
        .gen-preview-subheading { font-size: var(--ha-font-size-m); color: var(--secondary-text-color); margin: -4px 0 var(--ha-space-3) 0; }
        /* LCARS UI Chrome only — deliberately not a collapsible lcards-form-section, see the comment
           on that section's markup in _renderPreviewExportSection. */
        .gen-preview-box {
          border: var(--ha-border-width-sm) solid var(--divider-color, #e0e0e0); border-radius: var(--ha-border-radius-lg);
          padding: var(--ha-space-4); margin: var(--ha-space-3) 0;
          background: color-mix(in srgb, var(--secondary-background-color) 20%, transparent);
        }
        /* This is the actual deliverable, not another preview — a stronger, primary-coloured
           border (vs. the plain divider-coloured one every preview box uses) sets it apart as the
           final output, visually distinct from everything explanatory above it. */
        .gen-export-box { border: var(--ha-border-width-md) solid var(--primary-color); margin-top: var(--ha-space-5); }
        .gen-preview-heading { font-size: var(--ha-font-size-l); font-weight: 600; margin-bottom: var(--ha-space-2); }
        .gen-cardmod-group-title { font-size: var(--ha-font-size-m); font-weight: 600; margin: var(--ha-space-4) 0 var(--ha-space-2) 0; }
        .gen-cardmod-group-title:first-child { margin-top: 0; }
        .gen-lcars-sidebar { border-radius: var(--ha-border-radius-md); padding: var(--ha-space-2); display: flex; flex-direction: column; gap: var(--ha-space-2); }
        .gen-lcars-sidebar-item { display: flex; align-items: center; gap: var(--ha-space-2); font-size: 12px; padding: var(--ha-space-1) var(--ha-space-2); }
        .gen-lcars-sidebar-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .gen-lcars-sidebar-badge { margin-left: auto; font-size: 9px; border-radius: 999px; padding: 1px 6px; color: #000; }
        .gen-lcars-header { display: flex; justify-content: space-between; padding: var(--ha-space-2) var(--ha-space-3); border-radius: var(--ha-border-radius-sm); font-size: 12px; font-weight: 600; margin-bottom: var(--ha-space-3); }
        .gen-lcars-tooltip { display: inline-block; padding: var(--ha-space-1) var(--ha-space-2); border-radius: var(--ha-border-radius-sm); font-size: 11px; }
        .gen-lcars-tier-heading { font-size: 13px; font-weight: 700; letter-spacing: 0.03em; margin-bottom: var(--ha-space-2); }
        .gen-lcars-tier-stack { display: flex; flex-direction: column; gap: var(--ha-space-1); }
        .gen-lcars-tier-bar { padding: var(--ha-space-1) var(--ha-space-3); border-radius: var(--ha-border-radius-pill); font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; text-align: right; }
        .gen-lcars-tier-config { display: flex; align-items: center; gap: var(--ha-space-2); margin-top: var(--ha-space-2); }
        .gen-lcars-config-chip { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0; }
        .gen-lcars-config-chip ha-icon { --mdc-icon-size: 16px; }
        .yaml-actions { display: flex; align-items: center; justify-content: space-between; gap: var(--ha-space-3); margin-bottom: var(--ha-space-2); }
        .yaml-block { font-family: 'Fira Code','Consolas','Menlo',monospace; font-size: 0.78em; line-height: 1.7;
          background: var(--primary-background-color); border-radius: var(--ha-border-radius-md); padding: var(--ha-space-3);
          max-height: 50vh; overflow-y: auto; margin: 0; }
        datalist { display: none; }
      `,
    ];
  }

  /**
   * Theme library entries to offer in "Load from ha-lcars": every theme
   * currently installed on this HA instance (`hass.themes.themes` — always
   * exactly what's actually running, never stale) merged with the bundled
   * reference snapshot (`yaml/theme/ha-lcars-all-themes.yaml`, refreshed
   * manually via `npm run lcars:export-all-themes`, so it CAN lag behind
   * upstream ha-lcars between refreshes). Installed wins on name collision.
   * @returns {Array<{name: string, source: string, obj: Object}>} source is 'installed' or 'bundled'
   */
  get _themeLibraryEntries() {
    const liveThemes = this.hass?.themes?.themes || {};
    const liveNames = new Set(Object.keys(liveThemes));
    const entries = [];
    for (const name of liveNames) {
      entries.push({ name, source: 'installed', obj: liveThemes[name] });
    }
    for (const name of HA_LCARS_THEME_LIBRARY.names) {
      if (liveNames.has(name)) continue;
      entries.push({ name, source: 'bundled', obj: HA_LCARS_THEME_LIBRARY.themes[name] });
    }
    entries.sort((a, b) => a.name.localeCompare(b.name));
    return entries;
  }

  // ─── Collapsible info-guide helper (preset-info-guide pattern) ─────────

  _toggleGuide(id) {
    const updated = new Set(this._expandedGuideIds);
    if (updated.has(id)) updated.delete(id); else updated.add(id);
    this._expandedGuideIds = updated;
  }

  _renderInfoGuide(id, icon, title, bodyTemplate) {
    const expanded = this._expandedGuideIds.has(id);
    return html`
      <div class="preset-info-guide">
        <div class="preset-info-guide-header" @click=${() => this._toggleGuide(id)}>
          <ha-icon icon="${icon}"></ha-icon>
          <span>${title}</span>
          <ha-icon icon="mdi:chevron-down" class="guide-chevron ${expanded ? 'expanded' : ''}"></ha-icon>
        </div>
        ${expanded ? html`<div class="preset-info-guide-body">${bodyTemplate}</div>` : nothing}
      </div>
    `;
  }

  // ─── Palette-role tone resolution ──────────────────────────────────────

  _anchorsForFamily(family) {
    /** @type {Object<string,string>} */
    const anchors = {};
    for (const tone of ANCHOR_TONES) {
      anchors[tone] = GREEN_ALERT_PALETTE[toneKey(family, Number(tone))];
    }
    return anchors;
  }

  /**
   * ha-lcars's own shipped themes never vary the palette layer by mode — only
   * the semantic tone-index *selection* (handled elsewhere, always mode-aware)
   * differs. HA's own theme-application layering fully supports mode-scoped
   * palette values too (confirmed directly in apply_themes_on_element.ts —
   * a theme's `modes.dark`/`modes.light` block can override literally any
   * key, palette atoms included), so this generator optionally allows a
   * genuinely different palette per mode — e.g. reassigning a role to a
   * different family, or hand-picking different custom tones, in dark mode.
   * Defaults to 'light' for every caller that doesn't care about the
   * distinction (most call sites, since most roles never opt into this).
   */
  _scaleForRole(role, mode = 'light') {
    const cfg = this._model.roles[role];
    if (cfg.source === 'none') {
      /** @type {Object<string,string>} */
      const blank = {};
      for (const tone of TONE_ORDER) blank[tone] = '#888888';
      return blank;
    }
    if (cfg.source === 'imported') {
      // Imported ramps are captured from the theme's flat (mode-invariant)
      // ha-color-*-* keys — none of the 24 bundled ha-lcars themes mode-scope
      // this layer, so there's no dark variant to look for here.
      return this._model.importedRamps[role] || computeFullScale(this._anchorsForFamily('gray')).scale;
    }
    if (cfg.source === 'custom') {
      const raw = (mode === 'dark' && this._model.customAnchorsDark[role])
        ? this._model.customAnchorsDark[role]
        : this._model.customAnchors[role];
      if (!raw) return computeFullScale(this._anchorsForFamily(cfg.family || 'gray')).scale;
      // Anchor tones may be stored as portable text (var()/color-mix(), e.g. seeded verbatim
      // from an Imported ramp — see _ensureCustomAnchors) rather than hex; every consumer of
      // this scale (swatches, _resolveTone, WCAG math, export) needs a real color regardless,
      // so resolve through _previewHex here. Gap tones are already concrete hex from
      // computeFullScale and pass through _previewHex's hex fast-path unchanged.
      /** @type {Object<string,string>} */
      const resolved = {};
      for (const tone of TONE_ORDER) resolved[tone] = this._previewHex(raw[tone]);
      return resolved;
    }
    const family = (mode === 'dark' && cfg.darkFamily) ? cfg.darkFamily : cfg.family;
    return computeFullScale(this._anchorsForFamily(family)).scale;
  }

  /** @returns {{var: string, hex: string}} */
  _resolveTone(role, spec, mode = 'light') {
    if (spec === 'WHITE') return { var: 'var(--white-color)', hex: '#ffffff' };
    if (spec === 'BLACK') return { var: 'var(--black-color)', hex: '#000000' };
    const cfg = this._model.roles[role];
    const scale = this._scaleForRole(role, mode);
    const hex = scale[String(spec).padStart(2, '0')] || '#888888';
    if (cfg.source === 'family') {
      const family = (mode === 'dark' && cfg.darkFamily) ? cfg.darkFamily : cfg.family;
      return { var: `var(${lcardsToneVarName(family, spec)}, ${hex})`, hex };
    }
    // 'custom' and 'imported' both have no LCARdS --lcards-* var to hybrid-reference — literal hex only.
    return { var: hex, hex };
  }

  /** Whether a role's palette is currently set to differ between light and dark mode. */
  _roleDarkDiffers(role) {
    const cfg = this._model.roles[role];
    if (cfg.source === 'family') return cfg.darkFamily !== undefined;
    if (cfg.source === 'custom') return !!this._model.customAnchorsDark[role];
    return false;
  }

  /** Bridges a semantic role (primary/neutral/disabled/danger/warning/success) to a palette role via ROLE_TO_SLOT. Passed as the `resolveTone` callback to themeGeneratorCore's resolvers, which call it with (role, spec, mode). */
  _resolveSemanticRoleTone(semanticRole, spec, mode = 'light') {
    return this._resolveTone(ROLE_TO_SLOT[semanticRole] || semanticRole, spec, mode);
  }

  /**
   * Whether a specific role+tone slot has no real value from this generator right now — either the
   * whole role is "None", or (for "Imported") the theme's own ramp genuinely doesn't define that
   * particular stop (a partial import, e.g. a theme that only sets 6 of the 11 ha-color-primary-*
   * stops). "family" and "custom" are always fully defined by construction (every tone is either an
   * OKLCH-computed gap tone or an explicit anchor), so only "none" and a partial "imported" ramp can
   * land here.
   */
  _isRoleTonePreviewFallback(role, tone) {
    const cfg = this._model.roles[role];
    if (cfg?.source === 'none') return true;
    if (cfg?.source === 'imported') return !(tone in (this._model.importedRamps[role] || {}));
    return false;
  }

  /** Preview-only counterpart to _scaleForRole, for Palette Seed's own "Full scale" swatch strip: identical for any tone that actually has a Palette Seed value, but for one that doesn't (a "None" role, or a stop a partial "Imported" ramp genuinely skips) fills it from _staticHaDefault's static reference data instead of the gray placeholder _scaleForRole falls back to. Never used for export. */
  _scaleForRolePreview(role, mode = 'light') {
    const base = this._scaleForRole(role, mode);
    /** @type {Object<string,string>} */
    const scale = {};
    for (const tone of TONE_ORDER) {
      scale[tone] = this._isRoleTonePreviewFallback(role, tone) ? this._staticHaDefault(`ha-color-${role}-${tone}`).hex : base[tone];
    }
    return scale;
  }

  /**
   * Resolves any CSS color string (literal hex, var(), color-mix(), rgb(),
   * named color, etc.) to a concrete 6-digit hex, via the same DOM
   * round-trip lcards-color-picker.js/ColorUtils use. Always returns valid
   * hex, never the original string back unresolved — callers (OKLCH scale
   * math, imported-ramp resolution) would otherwise silently corrupt into
   * NaN garbage on a non-hex input like `var(--lcars-apricot)`. Falls back
   * to a neutral gray, logged, if resolution genuinely fails (e.g. the
   * referenced var isn't live on the page right now).
   */
  _resolveToHex(value) {
    const FALLBACK = '#888888';
    if (!value) return FALLBACK;
    if (/^#[0-9a-fA-F]{6}$/.test(value)) return value;
    try {
      const temp = document.createElement('div');
      temp.style.color = value;
      document.body.appendChild(temp);
      const computed = getComputedStyle(temp).color;
      document.body.removeChild(temp);
      const m = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (m) return rgbToHex(Number(m[1]), Number(m[2]), Number(m[3]));
    } catch (err) {
      lcardsLog.warn('[ThemeGeneratorView] Could not resolve color to hex', value, err);
    }
    lcardsLog.warn('[ThemeGeneratorView] Unresolvable color, using neutral gray fallback', value);
    return FALLBACK;
  }

  /**
   * Resolves a raw value pulled from a *parsed but not-yet-applied* ha-lcars
   * theme object to a concrete hex — substituting any `var(--key)` reference
   * (bare, or embedded in a larger expression like `color-mix()`) found as a
   * key in that SAME object first, repeatedly, before ever touching the live
   * DOM. ha-lcars themes constantly alias one field to another this way
   * (e.g. LCARS 25C's `lcars-ui-tertiary: var(--lcars-alt-orange)`, where
   * `--lcars-alt-orange` is one of ~180 raw named colors merged in from the
   * shared &lcars-variables anchor) — `_resolveToHex`'s DOM round-trip alone
   * can't see any of that, since none of it is actually injected as live CSS
   * during import; it would silently resolve against whatever theme happens
   * to be ACTIVE on the page right now instead of the theme actually being
   * imported (wrong theme entirely, or a bare fallback gray if nothing
   * defines that var live). Only once every reference that resolves locally
   * has been substituted — what's left is a literal color or a genuinely
   * global/always-live var like --lcards-gray-darkest or --white-color —
   * does this fall through to the live-DOM round-trip, which is the right
   * tool for those.
   *
   * `color-mix(in oklch, A PCT%, B)` is computed directly via lerpOklch —
   * the SAME OKLCH math this generator already uses elsewhere
   * (computeHaDefaultScale) — rather than trusted to the browser's own
   * color-mix() support. This is what ha-lcars's ha-color-primary-* generic
   * ramp is built from in every bundled theme that doesn't hand-tune it
   * (22 of 24); relying on the DOM to parse it meant a stop only ever
   * resolved correctly if the runtime's CSS engine actually implemented
   * `in oklch` interpolation, and silently fell back to gray otherwise —
   * this removes that dependency entirely for the case that matters most.
   *
   * `noDom` (used by _staticHaDefault, where themeObj is HA_LCARS_THEME_LIBRARY.boilerplate — the
   * genuinely shared anchor, not a specific theme's own choices): some boilerplate values chain
   * through a reference that's legitimately per-theme, not itself in boilerplate (e.g.
   * primary-background-color -> var(--lcars-background-color), where lcars-background-color is each
   * theme's own accent pick). Left to the normal DOM-round-trip fallback below, an unresolved
   * var(--lcars-background-color) would inherit from document.documentElement — i.e. whatever theme
   * is actually active on this page, exactly the bug this whole area exists to avoid. When true, a
   * value that doesn't fully resolve within themeObj returns a neutral placeholder instead of ever
   * touching the DOM; already-literal hex and the few CSS keywords this codebase's own static data
   * actually uses (black/white/transparent) still resolve normally.
   */
  _resolveThemeValue(value, themeObj, depth = 0, noDom = false) {
    if (typeof value !== 'string' || depth >= 12) return noDom ? this._resolveLiteralNoDom(value) : this._resolveToHex(value);
    if (value.includes('var(--')) {
      let changed = false;
      const next = value.replace(/var\(--([a-zA-Z0-9-]+)\)/g, (match, key) => {
        if (Object.prototype.hasOwnProperty.call(themeObj, key)) {
          changed = true;
          return String(themeObj[key]);
        }
        return match;
      });
      if (changed) return this._resolveThemeValue(next, themeObj, depth + 1, noDom);
    }
    const mixMatch = value.trim().match(/^color-mix\(in oklch,\s*(.+?)\s+([\d.]+)%\s*,\s*(.+?)\)$/i);
    if (mixMatch) {
      const [, baseExpr, pctStr, towardExpr] = mixMatch;
      const baseHex = this._resolveThemeValue(baseExpr.trim(), themeObj, depth + 1, noDom);
      const towardKeyword = towardExpr.trim().toLowerCase();
      const towardHex = towardKeyword === 'black' ? '#000000'
        : towardKeyword === 'white' ? '#ffffff'
        : this._resolveThemeValue(towardExpr.trim(), themeObj, depth + 1, noDom);
      return lerpOklch(towardHex, baseHex, Number(pctStr) / 100);
    }
    return noDom ? this._resolveLiteralNoDom(value) : this._resolveToHex(value);
  }

  /** DOM-free terminal resolution for _resolveThemeValue's noDom mode — a real hex or a small set of known keywords resolve normally; anything still unresolved (a var() this codebase's own static data can't chase further, most commonly) becomes a neutral placeholder rather than ever risking a live-DOM read. */
  _resolveLiteralNoDom(value) {
    if (/^#[0-9a-fA-F]{6}$/.test(value)) return value;
    const KNOWN_KEYWORDS = { black: '#000000', white: '#ffffff', transparent: 'transparent' };
    return KNOWN_KEYWORDS[String(value).trim().toLowerCase()] ?? '#888888';
  }

  /**
   * Preview-only resolution for values that may still be raw `var(--lcars-
   * ...)` references left over from an import (Legacy/Domain/Raw overrides
   * keep the portable var() form for the actual export — see mergeKeys in
   * _buildExportModel — this never changes what's stored). Chases those
   * through whichever theme was last imported, if any, via _resolveThemeValue;
   * with nothing imported this is just _resolveToHex, unchanged from before.
   */
  _previewHex(value) {
    if (this._importedThemeContext) return this._resolveThemeValue(value, this._liveImportedThemeContext());
    return this._resolveToHex(value);
  }

  /**
   * Whether a semantic role (primary/neutral/disabled/danger/warning/success) has no Palette Seed
   * definition — i.e. its underlying role/family slot (via ROLE_TO_SLOT) is set to "None". When
   * true, _buildExportModel omits that role's ha-color-* keys entirely rather than emitting a gray
   * placeholder, so HA's own real fallback chain (its baseline palette, cascaded via CSS custom
   * properties — confirmed in apply_themes_on_element.ts/core.globals.ts) takes over cleanly.
   */
  _semanticRoleUnset(role) {
    const slot = ROLE_TO_SLOT[role] || role;
    return this._model.roles[slot]?.source === 'none';
  }

  /**
   * Whether an unmodified role-tied Legacy field (LEGACY_FIELD_DEFS entries with a `role`/`tone`,
   * e.g. primary-color -> role 'primary') should be computed from Palette Seed's tone scale at all.
   * True only for 'family' (an LCARdS palette) and 'custom' (hand-built tones) — the two sources with
   * no actual theme backing the role, where the computed scale IS the deliberate source of truth.
   * False for 'none' (nothing to compute from) AND — this is the part _semanticRoleUnset alone gets
   * wrong for this purpose — 'imported' too: a real theme IS loaded there, so an unmodified field
   * should show that theme's own value (via _staticHaDefault, same as any other unset field), never
   * a value re-derived from the ramp. The ramp's tone-40 and this field happening to reference the
   * same underlying var is a coincidence of how a given theme is built, not something guaranteed —
   * deriving from the ramp regardless was silently ignoring the field's own real (or boilerplate)
   * value in favour of a computed stand-in, exactly the kind of fabrication this generator otherwise
   * goes out of its way to avoid.
   */
  _roleDerivesLegacyFields(role) {
    const slot = ROLE_TO_SLOT[role] || role;
    const source = this._model.roles[slot]?.source;
    return source === 'family' || source === 'custom';
  }

  /**
   * Static default resolution for a `--ha-color-*`/`--state-*-color`/legacy var — deliberately NEVER
   * touches the live DOM. HA applies a theme by setting CSS custom properties as an inline style on
   * `document.documentElement` (frontend's applyThemesOnElement -> element.style.setProperty), which
   * unconditionally wins the cascade over HA's own baseline `html {}` rule for that same element —
   * there is no way to "see behind" that override for the live element, and HA's baseline rule only
   * ever matches the literal root `<html>`, so no other element in the same document can see the
   * un-overridden value via inheritance either. A `getComputedStyle(document.documentElement)` read
   * therefore always reflects whatever theme happens to be active in this browser session right now,
   * never HA's real defaults — confirmed the hard way (see commit history) when this used to badge a
   * user's own active LCARdS theme colours as "HA Default".
   *
   * Resolves against two static, bundled datasets instead, most specific first:
   * 1. `HA_LCARS_THEME_LIBRARY.boilerplate` — the shared `&lcars-variables`/`&base` anchor every real
   *    ha-lcars theme merges in via `<<:`, so a hit here is a genuine, reliable universal default.
   *    Deliberately NOT `HA_LCARS_THEME_LIBRARY.themes['LCARS Default']` (one specific bundled
   *    theme's full content, anchor plus its OWN particular choices) — that was the actual bug: a
   *    theme named "LCARS Default" defining `lcars-ui-primary` a certain way is that theme's own
   *    choice, no more universal than any other bundled theme's, and badging it "HA-LCARS Default"
   *    claimed otherwise. Fields only "LCARS Default" itself defines are covered by this editor
   *    defaulting to importing that theme for real (see the constructor) — a genuine, editable,
   *    revertable value, not a fabricated implicit default. Tier 'lcars'.
   * 2. HA_CORE_DEFAULTS (themeGeneratorCore.js) — a small hand-transcribed snapshot of HA core's own
   *    real baseline (color.globals.ts/core.globals.ts), for whatever the shared anchor doesn't
   *    define. Tier 'ha'.
   * Neither hit: tier 'unknown', a neutral placeholder — no live-DOM fallback, since that's exactly
   * the thing being fixed here.
   *
   * Returns both `var` (the shared anchor's actual stored value for this key, one level resolved —
   * e.g. disabled-text-color's `var` is `var(--lcars-graphite)`, its OWN real definition, never a
   * self-referential `var(--disabled-text-color)` wrapper around the key we were asked for; for an
   * 'ha' hit there's no portable form left since HA_CORE_DEFAULTS was hand-flattened to hex, so `var`
   * is just that hex) and `hex` (always a concrete color, resolved with _resolveThemeValue's noDom
   * mode — see that method's own doc comment for why — for math/comparison callers that can't consume
   * a reference). Callers previewing a colour to a human — anything feeding a <lcards-color-picker>'s
   * `.value` or a real CSS custom property on a live-mounted component — should prefer `var`, wired to
   * STATIC_DEFAULT_CONTEXT (or a themeContext that layers it under an actually-imported theme) so the
   * picker/browser chases any further indirection itself.
   */
  _staticHaDefault(varName) {
    if (Object.prototype.hasOwnProperty.call(HA_LCARS_THEME_LIBRARY.boilerplate, varName)) {
      const raw = HA_LCARS_THEME_LIBRARY.boilerplate[varName];
      return { var: raw, hex: this._resolveThemeValue(raw, HA_LCARS_THEME_LIBRARY.boilerplate, 0, true), tier: 'lcars' };
    }
    if (Object.prototype.hasOwnProperty.call(HA_CORE_DEFAULTS, varName)) {
      return { var: HA_CORE_DEFAULTS[varName], hex: HA_CORE_DEFAULTS[varName], tier: 'ha' };
    }
    return { var: '#888888', hex: '#888888', tier: 'unknown' };
  }

  /**
   * _importedThemeContext (the theme as originally imported) with every field the user has since
   * edited — Legacy overrides and Raw Overrides both — layered on top. Without this, a field whose
   * own raw text is e.g. `var(--lcars-ui-tertiary)` keeps resolving against whatever lcars-ui-tertiary
   * was at import time even after the user picks a new colour for LCARS UI Tertiary itself, since
   * that edit only ever lands in _model.legacy — it never touches _importedThemeContext, which is
   * otherwise only ever (re)assigned once, at import. Domain & State overrides are deliberately not
   * included: those keys (state-<domain>-<state>-color) are themselves leaves other fields don't
   * reference back via var(), so there's nothing for them to feed here.
   * Memoized on the identity of _importedThemeContext/_model.legacy/_model.raw together (same
   * reasoning as _staticColorContext(): lcards-color-picker's own family-grouping cache keys off this
   * object's reference identity, so a fresh object every render would silently defeat that cache).
   */
  _liveImportedThemeContext() {
    const legacy = this._model.legacy;
    const raw = this._model.raw;
    const source = this._liveContextSource;
    if (!source || source.imported !== this._importedThemeContext || source.legacy !== legacy || source.raw !== raw) {
      const overrides = {};
      for (const key of Object.keys(legacy)) {
        const value = legacy[key]?.value;
        if (value !== undefined) overrides[key] = value;
      }
      for (const entry of raw) {
        if (entry.key && entry.value !== undefined) overrides[entry.key] = entry.value;
      }
      this._liveContextCache = { ...(this._importedThemeContext || {}), ...overrides };
      this._liveContextSource = { imported: this._importedThemeContext, legacy, raw };
    }
    return this._liveContextCache;
  }

  /**
   * The themeContext for a color-picker showing a _staticHaDefault().var value — STATIC_DEFAULT_CONTEXT,
   * with an actually-imported theme's own (live-edited) vars layered on top (an import's values are
   * more specific to what the user loaded and should win any overlap). Memoized on
   * _liveImportedThemeContext()'s own identity, not recomputed per render/per field: lcards-color-picker's
   * own family-grouping cache keys off this object's reference identity (see its themeContext doc
   * comment), so a fresh object every render would silently defeat that cache for every picker on the
   * page, not just this one.
   */
  _staticColorContext() {
    const liveContext = this._liveImportedThemeContext();
    if (this._staticColorContextSource !== liveContext) {
      this._staticColorContextCache = this._importedThemeContext
        ? { ...STATIC_DEFAULT_CONTEXT, ...liveContext }
        : STATIC_DEFAULT_CONTEXT;
      this._staticColorContextSource = liveContext;
    }
    return this._staticColorContextCache;
  }

  /**
   * The real static default for a role/tone-driven LEGACY_FIELD_DEFS field — its OWN key, checked
   * directly against static reference data. Never approximated from the generic ha-color-<role>-<tone>
   * semantic slot: that's a different, unrelated CSS var (confirmed via audit that all 43 role/tone
   * fields already resolve directly — this generator has no field left that needs a substitute value).
   * A field with no direct entry anywhere genuinely has no default to show — see _staticHaDefault's
   * 'unknown' tier, a neutral placeholder with no badge, not a guess.
   */
  _legacyFieldDefault(field) {
    return this._staticHaDefault(field.key);
  }

  /**
   * Badge text for a Palette Seed role's unset ("None") default. A role's ramp is always fully
   * covered by a single _staticHaDefault tier or not at all (none of the 5 roles' ramps are in
   * ha-lcars's shared boilerplate anchor; HA_CORE_DEFAULTS covers all 5 fully), so tone 40 is a safe
   * representative for the whole role — no need to check every tone individually.
   */
  _roleDefaultBadge(role) {
    return DEFAULT_TIER_LABELS[this._staticHaDefault(`ha-color-${role}-40`).tier];
  }

  /**
   * Full preview resolution for an unset Domain & State Colours row — walks the same real tiers HA's
   * state_color.ts walks (skipping the device_class tier, not modeled by this generator at all):
   * literal --state-<domain>-<state>-color, then --state-<domain>-active/inactive-color (picking the
   * side via isDomainStatePreviewActive, a faithful port of HA's real stateActive()), then Global
   * Fallback's own state-active/inactive-color. The floor tier is deliberately override-aware — not
   * just this._staticHaDefault(globalKey), which is blind to an override the user just made in Global
   * Fallback above (nothing is applied for real until the theme is actually exported and used) — and
   * badges "Global Default" ONLY when that override genuinely exists; with nothing configured
   * anywhere in the chain, even the floor tier is still "HA Default"/"HA-LCARS Default", exactly the
   * hierarchy this section promises: specific override, then Global Default (if configured), then
   * whichever static default applies.
   */
  _liveDomainStateDefault(domain, state) {
    const stateResult = this._staticHaDefault(`state-${domain}-${state}-color`);
    if (stateResult.tier !== 'unknown') return stateResult;
    const activeKey = isDomainStatePreviewActive(domain, state) ? 'active' : 'inactive';
    const domainActiveResult = this._staticHaDefault(`state-${domain}-${activeKey}-color`);
    if (domainActiveResult.tier !== 'unknown') return domainActiveResult;
    const globalKey = `state-${activeKey}-color`;
    const globalOverride = this._model.legacy[globalKey]?.value;
    if (globalOverride !== undefined) return { var: globalOverride, hex: this._previewHex(globalOverride), tier: 'global' };
    return this._staticHaDefault(globalKey);
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  render() {
    return html`
      <div class="tab-content-container">
        ${this._renderInfoGuide('overview', 'mdi:palette-swatch-outline', 'What is the HA-LCARS Theme Lab?', html`
          <p>Builds a complete, HA-LCARS theme profile — pick your colours here, then copy
            the generated YAML into your own HA-LCARS <code>lcars.yaml</code> theme file. Nothing here writes to your live HA install;
            it only reads an existing theme when you explicitly load or paste one.</p>
          <p>The sections below follow HA's own 3-layer colour model:</p>
          <ul>
            <li><strong>Palette Seed</strong> — the raw <code>ha-color-&lt;role&gt;-*</code> palette (5 roles × 11
              tones each). Reuse an LCARdS family, hand-build custom tones, or adopt a loaded theme's own ramp.
              Everything else on this page is computed from these choices.</li>
            <li><strong>HA-LCARS &amp; Legacy HA Semantic Colours</strong> and <strong>Domain &amp; State Colours</strong>
              — HA's semantic tokens and per-entity-state colours, defaulted from Palette Seed above but overridable
              field by field.</li>
            <li><strong>Advanced / Raw Overrides</strong> — an escape hatch for any var name this page doesn't give
              dedicated UI to.</li>
          </ul>
          <p class="preset-info-guide-tip"><strong>Leaving a Palette Seed role as "None"</strong> will ensure that role's keys are left out of the export entirely so
            HA's own real baseline palette applies for it instead. Swatches shown with a dashed border and an
            <span class="gen-fallback-badge">HA-LCARS Default</span> or <span class="gen-fallback-badge">HA Default</span>
            badge are previewing that real default — ha-lcars's own shared anchor first, HA core's own baseline
            otherwise — not this theme, and not whatever theme happens to be active on this page.</p>
          <p>Every section supports independent light/dark values where HA itself supports them, and <strong>Preview
            &amp; Export</strong> at the bottom always reflects the full current state — mockups, the complete
            generated YAML, and a copy-to-clipboard button.</p>
        `)}
        ${this._renderStartSection()}
        ${this._renderPaletteSeedSection()}
        ${this._renderLegacySection()}
        ${this._renderDomainSection()}
        ${this._renderRawSection()}
        ${this._renderPreviewExportSection()}
      </div>
    `;
  }

  _renderStartSection() {
    const mode = this._startMode;
    return html`
      <lcards-form-section header="Start" icon="mdi:rocket-launch-outline" ?expanded=${true} ?outlined=${true}>
        <p class="gen-hint">Starts from "LCARS Default" (ha-lcars's own reference theme) below — change
          the selection to start from a different bundled/installed theme, or switch to Paste to bring in
          your own custom YAML instead.</p>
        <div class="gen-toggle-group gen-toggle-group-m">
          <wa-button-group childSelector="ha-button">
            <ha-button variant="brand" size="m" .appearance=${mode === 'library' ? 'accent' : 'filled'}
              @click=${() => this._selectStartMode('library')}>Load from HA-LCARS</ha-button>
            <ha-button variant="brand" size="m" .appearance=${mode === 'paste' ? 'accent' : 'filled'}
              @click=${() => this._selectStartMode('paste')}>Paste theme YAML</ha-button>
          </wa-button-group>
        </div>

        <div class="gen-field-row" style="grid-template-columns: minmax(140px, 220px) 1fr;">
          <div class="gen-field-label">Theme Name</div>
          <ha-input .value=${this._model.name} label="Theme Name"
            @input=${(ev) => this._setName(ev.target.value)}></ha-input>
        </div>

        ${mode === 'library' ? html`
          <div class="gen-field-row" style="grid-template-columns: minmax(140px, 220px) 1fr auto;">
            <div class="gen-field-label">Theme</div>
            <ha-selector .hass=${this.hass}
              .selector=${{ select: { mode: 'dropdown', options: this._themeLibraryEntries.map(e => ({ value: e.name, label: `${e.name}${e.source === 'installed' ? '  •  installed on this HA' : '  •  bundled reference'}` })) } }}
              .value=${this._selectedLibraryTheme}
              .label=${'Theme'}
              @value-changed=${(ev) => { this._selectedLibraryTheme = ev.detail.value; }}>
            </ha-selector>
            <ha-button @click=${() => this._handleLoadLibraryTheme()} .disabled=${!this._selectedLibraryTheme}>Load</ha-button>
          </div>
          ${this._renderInfoGuide('library', 'mdi:information-outline', 'How loading an HA-LCARS theme works', html`
            <p>Loading an HA-LCARS theme will populate the HA-LCARS UI variables and any other HA-legacy and state colours into the sections below as your
              starting point.</p>
            <ul>
              <li><strong>Installed on this HA</strong> — themes that have been read live from this session.  These themes are what your Home Assistant instance has loaded right now
                (<code>hass.themes.themes</code>). Always current, whatever version you actually have installed.</li>
              <li><strong>Bundled reference</strong> — LCARdS includes a snapshot of the most current version of HA-LCARS available at the time of release.
                Reference themes are only shown when that theme isn't currently installed; it may lag behind the latest HA-LCARS release.</li>
            </ul>
            <p class="preset-info-guide-tip"><strong>Note:</strong> In the <strong>Palette Seed</strong> section below, a role switches to "Imported" whenever the loaded theme has an <code>ha-color-&lt;role&gt;-*</code> ramp
              defined.  Each HA-LCARS theme currently includes the <code>primary</code> role ramp.  If the theme doesn't define one of these roles it is set to "None" and previews HA core's own baseline for it instead.</p>
          `)}
        ` : nothing}

        ${mode === 'paste' ? html`
          <div class="gen-field-row" style="grid-template-columns: minmax(140px, 220px) 1fr; align-items: start;">
            <div class="gen-field-label">Theme YAML</div>
            <div>
              <lcards-yaml-editor .hass=${this.hass} .value=${this._pasteYamlText}
                @value-changed=${(ev) => { this._pasteYamlText = ev.detail.value; }}>
              </lcards-yaml-editor>
              <div class="gen-toolbar-row">
                <ha-button @click=${() => this._handleImportYaml()}>Import</ha-button>
              </div>
            </div>
          </div>
          ${this._renderInfoGuide('paste', 'mdi:information-outline', 'What gets recognized when pasting', html`
            <p>Pulls in anything the sections below recognize:</p>
            <ul>
              <li>Legacy / LCARS-UI colour fields</li>
              <li><code>state-&lt;domain&gt;-&lt;state&gt;-color</code> entries</li>
              <li>Complete <code>ha-color-&lt;role&gt;-*</code> ramps (all 11 stops) — promoted to Palette Seed as an
                "Imported" source</li>
            </ul>
            <p>Everything else lands in Advanced / Raw Overrides untouched — nothing is silently dropped.</p>
            <p class="preset-info-guide-missing-note">YAML anchor merge keys (<code>&lt;&lt;: *anchor</code>)
              referencing another file's shared definitions can't be resolved from a standalone paste and are
              skipped.</p>
          `)}
        ` : nothing}

        ${this._importError ? html`<div class="error-message">${this._importError}</div>` : nothing}
        ${this._importFeedback ? html`<div class="info-message">${this._importFeedback}</div>` : nothing}
      </lcards-form-section>
    `;
  }

  _renderPaletteSeedSection() {
    return html`
      <lcards-form-section header="Palette Seed" icon="mdi:palette-outline" ?expanded=${true} ?outlined=${true}
        description="Adopt an imported theme's ramps, assign an LCARdS palette family, or define fully customized tones for each of HA's 5 palette roles. Every role starts at None.">
        <p class="gen-hint">These feed HA's own native <code>ha-color-&lt;role&gt;-*</code> palettes (05-95 tones,
          one scale per role) — the colours HA's frontend falls back to on native components HA-LCARS's own
          styling doesn't reach, like dialogs and form controls. Everything else in this generator (Legacy fields,
          LCARS UI, Domain &amp; State Colours) that isn't explicitly overridden derives from whatever you set
          here — a role left at <strong>None</strong> (the default for all 5) means every field that would
          otherwise derive from it previews and exports HA's own real default instead, until you assign one.</p>
        ${HA_PALETTE_ROLES.map(role => this._renderRoleSeed(role))}
      </lcards-form-section>
    `;
  }

  _renderRoleSeed(role) {
    const cfg = this._model.roles[role];
    const hasImported = !!this._model.importedRamps[role];
    const importedCount = Object.keys(this._model.importedRamps[role] || {}).length;
    const canVaryByMode = cfg.source === 'family' || cfg.source === 'custom';
    const darkDiffers = canVaryByMode && this._roleDarkDiffers(role);
    const isUnset = cfg.source === 'none';
    const lightScale = this._scaleForRolePreview(role, 'light');
    const darkScale = darkDiffers ? this._scaleForRolePreview(role, 'dark') : null;
    return html`
      <lcards-form-section header="${ROLE_LABELS[role]}" icon="${ROLE_ICONS[role]}"
        .secondary=${this._roleSourceSummary(role)} ?expanded=${role === 'primary'} nested>
        <div class="gen-role-header">
          <div class="gen-toggle-group">
            <wa-button-group childSelector="ha-button">
              <ha-button variant="brand" size="s" .appearance=${cfg.source === 'none' ? 'accent' : 'filled'}
                @click=${() => this._updateRoleSource(role, 'none')}>None</ha-button>
              <ha-button variant="brand" size="s" .appearance=${cfg.source === 'family' ? 'accent' : 'filled'}
                @click=${() => this._updateRoleSource(role, 'family')}>LCARdS Palettes</ha-button>
              <ha-button variant="brand" size="s" .appearance=${cfg.source === 'custom' ? 'accent' : 'filled'}
                @click=${() => this._updateRoleSource(role, 'custom')}>Custom</ha-button>
              ${hasImported ? html`
                <ha-button variant="brand" size="s" .appearance=${cfg.source === 'imported' ? 'accent' : 'filled'}
                  @click=${() => this._updateRoleSource(role, 'imported')}>Imported</ha-button>
              ` : nothing}
            </wa-button-group>
          </div>
        </div>

        ${isUnset ? html`
          <p class="gen-hint">Not set — this theme won't define <code>ha-color-${role}-*</code> at all. HA falls
            back to its own baseline palette for it (confirmed in HA's frontend source: any
            <code>--ha-color-*</code> key a theme omits keeps whatever HA's default CSS already set, since themes
            apply as a partial overlay, not a full replacement). The swatches below preview that real default —
            HA core's own baseline for this role (none of the 5 roles' ramps are part of ha-lcars's shared
            anchor) — never a guess, and never dependent on whatever theme happens to be active on this page right
            now. Pick "LCARdS Palettes" to reuse a LCARdS family, "Custom" to
            hand-build one, or "Imported" if this theme has its own ramp available.</p>
        ` : nothing}

        ${cfg.source === 'imported' ? html`
          <p class="gen-imported-note">Using this theme's own imported <code>ha-color-${role}-*</code> ramp —
            ${importedCount < 11
              ? html`${importedCount} of 11 stops (this theme only defines that many — the rest, marked with a
                  dashed border below, preview HA's own live fallback for that specific stop, and won't be part of
                  the exported theme)`
              : html`all 11 stops`}, not editable here, and not mode-varying (none of HA-LCARS's bundled themes
            mode-scope this layer). Switch to Custom to hand-tune (including a dark-mode variant, and to fill in any
            missing stops yourself), or LCARdS Palettes to use a LCARdS family instead.</p>
        ` : nothing}

        ${canVaryByMode ? html`
          <label class="gen-dark-toggle" style="margin-bottom: var(--ha-space-3);">
            <ha-switch .checked=${darkDiffers}
              @change=${(ev) => this._toggleRoleDarkDiffers(role, ev.target.checked)}></ha-switch>
            <span class="gen-dark-toggle-label">Differs in dark mode — e.g. a different family or hand-picked hue, not just a different tone</span>
          </label>
          <div class="gen-role-content ${darkDiffers ? 'gen-mode-columns' : ''}">
            <div class="gen-mode-column">
              ${darkDiffers ? html`<div class="gen-mode-column-label">Light</div>` : nothing}
              ${this._renderRoleSourceContent(role, 'light')}
            </div>
            ${darkDiffers ? html`
              <div class="gen-mode-column">
                <div class="gen-mode-column-label">Dark</div>
                ${this._renderRoleSourceContent(role, 'dark')}
              </div>
            ` : nothing}
          </div>
        ` : nothing}

        <div class="gen-scale-row">
          <div class="gen-scale-label">${darkDiffers ? 'Full scale (light)' : 'Full scale'}</div>
          <div class="gen-scale-swatches">
            ${TONE_ORDER.map(tone => {
              const fallback = this._isRoleTonePreviewFallback(role, tone);
              return html`
                <div class="gen-scale-swatch ${fallback ? 'gen-scale-swatch-fallback' : ''}"
                  title="${fallback ? `${this._roleDefaultBadge(role)} — not set by this theme` : ''}">
                  <div class="gen-swatch-fill" style="background-color:${lightScale[tone]}"></div>
                  <span class="gen-scale-swatch-tag">${tone}</span>
                </div>
              `;
            })}
          </div>
          ${isUnset ? html`<span class="gen-fallback-badge">${this._roleDefaultBadge(role)}</span>` : nothing}
        </div>
        ${darkDiffers ? html`
          <div class="gen-scale-row">
            <div class="gen-scale-label">Full scale (dark)</div>
            <div class="gen-scale-swatches">
              ${TONE_ORDER.map(tone => html`
                <div class="gen-scale-swatch">
                  <div class="gen-swatch-fill" style="background-color:${darkScale[tone]}"></div>
                  <span class="gen-scale-swatch-tag">${tone}</span>
                </div>
              `)}
            </div>
          </div>
        ` : nothing}
      </lcards-form-section>
    `;
  }

  /** Short at-a-glance status shown in each Palette Seed role's collapsed section header — visible without expanding, so the 5 roles are distinguishable from each other at a glance. */
  _roleSourceSummary(role) {
    const cfg = this._model.roles[role];
    if (cfg.source === 'none') return `Not set — ${this._roleDefaultBadge(role)}`;
    if (cfg.source === 'family') {
      const darkNote = cfg.darkFamily && cfg.darkFamily !== cfg.family ? ` (dark: ${FAMILY_LABELS[cfg.darkFamily]})` : '';
      return `LCARdS Palettes: ${FAMILY_LABELS[cfg.family]}${darkNote}`;
    }
    if (cfg.source === 'custom') return this._roleDarkDiffers(role) ? 'Custom (light + dark)' : 'Custom';
    if (cfg.source === 'imported') {
      const count = Object.keys(this._model.importedRamps[role] || {}).length;
      return count < 11 ? `Imported (${count}/11 stops)` : 'Imported (complete)';
    }
    return '';
  }

  /** Renders the family-selector or 11-tone custom grid for one role in one mode — reused for the light column (always shown) and the dark column (shown only when that role's palette differs by mode). */
  _renderRoleSourceContent(role, mode) {
    const cfg = this._model.roles[role];
    if (cfg.source === 'family') {
      const family = mode === 'dark' ? (cfg.darkFamily || cfg.family) : cfg.family;
      return html`
        <ha-selector .hass=${this.hass}
          .selector=${{ select: { mode: 'dropdown', options: LCARDS_FAMILIES.map(f => ({ value: f, label: FAMILY_LABELS[f] })) } }}
          .value=${family}
          .label=${mode === 'dark' ? 'Dark mode family' : 'LCARdS family'}
          @value-changed=${(ev) => this._updateRoleFamily(role, ev.detail.value, mode)}>
        </ha-selector>
      `;
    }
    // 'custom'
    const store = mode === 'dark' ? this._model.customAnchorsDark : this._model.customAnchors;
    const scale = this._scaleForRole(role, mode);
    return html`
      ${mode === 'light' ? this._renderInfoGuide(`custom-${role}`, 'mdi:information-outline', 'Two ways to fill in a custom family', html`
        <p>Every tone starts out gray until you set it — this is a blank slate, not pre-filled from a LCARdS
          family (except the <strong>Base</strong> swatch, seeded from whatever this role/mode was showing just
          before you switched to Custom).</p>
        <ul>
          <li>Set all 11 tones by hand, or</li>
          <li><strong>Generate other 10 tones from Base</strong> — fills the rest from the Base colour using the
            same OKLCH lightness-ramp HA-LCARS's own generic fallback uses (visible as the "ha-lcars generic"
            comparison row in <code>reports/palette-scale-review.html</code>). <strong>Clear all</strong> resets
            everything (including Base) back to blank gray.</li>
        </ul>
        <p class="preset-info-guide-tip">The 7 solid-outlined swatches (Darkest/Dark/Medium Dark/Base/Medium
          Light/Light/Lightest) are the ones OKLCH interpolation is calculated <em>from</em>. Editing any of
          them automatically recalculates the 4 italic in-between swatches (10/50/60/95) to stay smoothly
          blended — unless you've hand-edited that specific in-between swatch yourself, in which case it's
          locked in as your own choice and won't be overwritten. Enable "Differs in dark mode" above for a fully
          independent dark palette — including genuinely different hues, e.g. a green family reimagined as
          purple at night.</p>
      `) : nothing}
      <div class="gen-toolbar-row">
        <ha-button @click=${() => this._clearCustomAnchors(role, mode)}>
          <ha-icon icon="mdi:eraser" slot="start"></ha-icon>
          Clear all
        </ha-button>
        <ha-button @click=${() => this._generateAnchorsFromBase(role, mode)}>
          <ha-icon icon="mdi:auto-fix" slot="start"></ha-icon>
          Generate other 10 tones from Base
        </ha-button>
      </div>
      <div class="gen-anchor-grid">
        ${TONE_ORDER.map(tone => html`
          <div class="gen-anchor-cell ${GAP_TONES.includes(tone) ? 'gen-anchor-gap' : ''} ${tone === '40' ? 'gen-anchor-base' : ''}">
            <label>${TONE_LABELS[tone]}${tone === '40' ? ' — seed for Generate' : ''} (tone ${tone})</label>
            <lcards-color-picker .hass=${this.hass}
              .value=${(store[role] || {})[tone] ?? scale[tone]}
              .showBuilder=${false}
              .themeContext=${this._liveImportedThemeContext()}
              @value-changed=${(ev) => this._updateCustomTone(role, tone, ev.detail.value, mode)}>
            </lcards-color-picker>
          </div>
        `)}
      </div>
    `;
  }

  _renderLegacySection() {
    return html`
      <lcards-form-section header="HA-LCARS &amp; Legacy HA Semantic Colours" icon="mdi:format-color-fill" ?expanded=${false} ?outlined=${true}
        description="Define the colour for HA-LCARS lcars-ui-*/card/sidebar/tooltip vars and legacy HA vars.  The CSS var name is shown under each label reference. When not imported, the defaults are derived from Palette Seed.">
        <div class="gen-row-header">
          <div></div><div>Light</div><div></div><div>Dark</div><div></div>
        </div>
        ${LEGACY_GROUPS.map(group => html`
          <lcards-form-section header="${group}" ?expanded=${group === 'LCARS UI'} nested>
            ${LEGACY_FIELD_DEFS.filter(f => f.group === group && !DOMAIN_FALLBACK_KEYS.has(f.key)).map(field => this._renderLegacyField(field))}
          </lcards-form-section>
        `)}
      </lcards-form-section>
    `;
  }

  _renderLegacyField(field) {
    const override = this._model.legacy[field.key] || {};
    const isModified = override.value !== undefined;
    const roleUnset = field.live || (!field.fixed && !isModified && !this._roleDerivesLegacyFields(field.role));
    const resolveDefault = field.live
      ? () => this._staticHaDefault(field.key)
      : (roleUnset
        ? () => this._legacyFieldDefault(field)
        : this._resolveTone.bind(this));
    const defaultEntry = field.fixed ? { var: field.fixed, hex: field.fixed } : resolveDefault(field.role, field.tone, 'light');
    const defaultEntryDark = field.fixed
      ? { var: field.fixedDark ?? field.fixed, hex: field.fixedDark ?? field.fixed }
      : resolveDefault(field.role, field.tone, 'dark');
    const cascadeDiffers = defaultEntryDark.hex !== defaultEntry.hex;
    // .var (a portable var()/color-mix() expression when available, literal hex otherwise) — never
    // pre-resolved to hex ourselves. themeContext below chases it the rest of the way, the same
    // machinery already used for a raw imported override's own var() references.
    const displayValue = override.value ?? defaultEntry.var;
    const hasDark = override.dark !== undefined;
    // Fixed fields are ha-lcars's own harvested structural constants, not a real HA-core fallback
    // (several, like the lcars-ui-*/lcars-card-* ones, aren't even real HA vars) — labeled distinctly
    // from "HA Default" so a blank field is never mistaken for a genuine user override either way.
    const badgeLabel = isModified ? null
      : field.fixed ? 'HA-LCARS Default'
      : field.live ? DEFAULT_TIER_LABELS[this._staticHaDefault(field.key).tier]
      : roleUnset ? DEFAULT_TIER_LABELS[this._legacyFieldDefault(field).tier]
      : null;
    return html`
      <div class="gen-field-row">
        <div class="gen-field-label">${field.label}<code class="gen-field-varname">--${field.key}</code>
          ${badgeLabel ? html`<span class="gen-fallback-badge">${badgeLabel}</span>` : nothing}
        </div>
        <lcards-color-picker .hass=${this.hass} .value=${displayValue} .showBuilder=${false} .themeContext=${this._staticColorContext()}
          @value-changed=${(ev) => this._setLegacyValue(field.key, ev.detail.value)}>
        </lcards-color-picker>
        <label class="gen-dark-toggle">
          <ha-switch .checked=${hasDark}
            @change=${(ev) => this._toggleLegacyDark(field.key, ev.target.checked, defaultEntryDark.var)}></ha-switch>
          <span class="gen-dark-toggle-label">Dark</span>
        </label>
        ${hasDark ? html`
          <lcards-color-picker .hass=${this.hass} .value=${override.dark ?? defaultEntryDark.var} .showBuilder=${false} .themeContext=${this._staticColorContext()}
            @value-changed=${(ev) => this._setLegacyValue(field.key, ev.detail.value, true)}>
          </lcards-color-picker>
        ` : (badgeLabel
          ? html`<span class="gen-dark-empty">(${badgeLabel} — not set by this theme)</span>`
          : !isModified && cascadeDiffers
            ? html`<span class="gen-dark-empty">(using Palette Seed's dark default)</span>`
            : html`<span class="gen-dark-empty">(using light value)</span>`)}
        ${isModified ? html`
          <ha-icon-button .label=${'Revert to computed default'} @click=${() => this._revertLegacyValue(field.key)}>
            <ha-icon icon="mdi:restore"></ha-icon>
          </ha-icon-button>
        ` : html`<span class="gen-revert-spacer"></span>`}
      </div>
    `;
  }

  _renderDomainSection() {
    return html`
      <lcards-form-section header="Domain &amp; State Colours" icon="mdi:state-machine" ?expanded=${false} ?outlined=${true}>
        ${this._renderInfoGuide('domain', 'mdi:information-outline', 'How domain & state colours work', html`
          <p>HA colours a per-entity-domain state icon/badge by walking a fixed CSS fallback chain
            (confirmed against HA's own <code>state_color.ts</code>) until it finds a var that's actually
            defined, most specific first:</p>
          <ol>
            <li><code>--state-&lt;domain&gt;-&lt;device_class&gt;-&lt;state&gt;-color</code> — only when the
              entity has a device_class</li>
            <li><code>--state-&lt;domain&gt;-&lt;state&gt;-color</code> — the rows below, e.g.
              <code>--state-light-on-color</code></li>
            <li><code>--state-&lt;domain&gt;-active-color</code> / <code>-inactive-color</code> — HA's own
              per-domain active/inactive split, decided by HA's <code>stateActive()</code> (genuinely
              domain-specific — e.g. for locks, every state except "locked" counts as active). This isn't
              redundant with the row above it: that targets one exact state name, this is a coarser catch-all
              covering every <em>other</em> state in the domain, named or not. Not editable here — a dedicated
              pair of fields per domain would mean ~58 more rows, reintroducing exactly the kind of large
              hand-maintained roster this section deliberately avoids. Reachable via Advanced / Raw Overrides
              if you need that level of control.</li>
            <li><strong>Global Fallback</strong>, just below — the final, generic floor:
              <code>--state-active-color</code> / <code>--state-inactive-color</code>, plus
              unavailable/unknown/default-icon for their own special cases.</li>
          </ol>
          <p>An entity that's genuinely <code>unavailable</code> skips this whole chain and always uses Global
            Fallback's <code>--state-unavailable-color</code> directly.</p>
          <p class="preset-info-guide-tip"><strong>Rows only ever hold a real value once you (or your starting
            theme) explicitly set one.</strong> <code>lock</code>/most of <code>climate</code> show real values
            from the start since ha-lcars's own shared anchor genuinely defines those specifically — the same
            values any real ha-lcars theme has, not a guess. Every other row starts unset, previewed from static
            reference data, never whatever theme happens to be active on this page: badged
            <strong>HA-LCARS Default</strong> when that same shared anchor defines the exact colour,
            <strong>HA Default</strong> when HA core itself does, or <strong>Global Default</strong> when neither
            does and the row is really just previewing Global Fallback's own Active/Inactive colour. An unset row
            writes nothing to the exported theme — leaving everything unset and only setting Global Fallback is a
            perfectly complete theme. Set a
            row only when a specific domain/state genuinely needs to break from that fallback.</p>
        `)}
        <lcards-form-section header="Global Fallback" ?expanded=${true} nested>
          ${LEGACY_FIELD_DEFS.filter(f => DOMAIN_FALLBACK_KEYS.has(f.key)).map(field => this._renderLegacyField(field))}
        </lcards-form-section>
        <div class="gen-row-header">
          <div></div><div>Light</div><div></div><div>Dark</div><div></div>
        </div>
        ${Object.entries(DOMAIN_STATES).map(([domain, states]) => html`
          <lcards-form-section header="${domain.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}"
            icon="${DOMAIN_ICONS[domain] || 'mdi:shape-outline'}" ?expanded=${domain === 'light'} nested>
            ${states.map(state => this._renderDomainStateRow(domain, state))}
          </lcards-form-section>
        `)}
      </lcards-form-section>
    `;
  }

  _renderDomainStateRow(domain, state) {
    const overrideKey = `${domain}.${state}`;
    const override = this._model.domainOverrides[overrideKey] || {};
    const isModified = override.value !== undefined;
    const varName = `state-${domain}-${state}-color`;
    const { var: defaultVar, tier } = this._liveDomainStateDefault(domain, state);
    const badgeLabel = DEFAULT_TIER_LABELS[tier];
    const displayValue = override.value ?? defaultVar;
    const hasDark = override.dark !== undefined;
    return html`
      <div class="gen-field-row">
        <div class="gen-field-label"><span style="text-transform:capitalize">${state.replace(/_/g, ' ')}</span><code class="gen-field-varname">--${varName}</code>
          ${!isModified ? html`<span class="gen-fallback-badge">${badgeLabel}</span>` : nothing}
        </div>
        <lcards-color-picker .hass=${this.hass} .value=${displayValue} .showBuilder=${false} .themeContext=${this._staticColorContext()}
          @value-changed=${(ev) => this._setDomainOverride(domain, state, ev.detail.value)}>
        </lcards-color-picker>
        <label class="gen-dark-toggle">
          <ha-switch .checked=${hasDark}
            @change=${(ev) => this._toggleDomainDark(domain, state, ev.target.checked, defaultVar)}></ha-switch>
          <span class="gen-dark-toggle-label">Dark</span>
        </label>
        ${hasDark ? html`
          <lcards-color-picker .hass=${this.hass} .value=${override.dark ?? defaultVar} .showBuilder=${false} .themeContext=${this._staticColorContext()}
            @value-changed=${(ev) => this._setDomainOverride(domain, state, ev.detail.value, true)}>
          </lcards-color-picker>
        ` : (!isModified
          ? html`<span class="gen-dark-empty">(${badgeLabel} — not set by this theme)</span>`
          : html`<span class="gen-dark-empty">(using light value)</span>`)}
        ${isModified ? html`
          <ha-icon-button .label=${'Revert to HA default'} @click=${() => this._revertDomainOverride(domain, state)}>
            <ha-icon icon="mdi:restore"></ha-icon>
          </ha-icon-button>
        ` : html`<span class="gen-revert-spacer"></span>`}
      </div>
    `;
  }

  _renderRawSection() {
    const catalogOptions = getKnownVariableCatalog().map(e => ({ value: e.name, label: e.name }));
    return html`
      <lcards-form-section header="Advanced / Raw Overrides" icon="mdi:tune-variant" ?expanded=${false} ?outlined=${true}
        description="Anything outside the curated sections above — WebAwesome design tokens, data-viz colours, component-level fallback vars, or any other var name. Pick a var name (no leading --) from the searchable list, or type your own — any name is accepted.">
        ${this._model.raw.length ? html`
          <div class="gen-row-header" style="grid-template-columns: minmax(200px, 280px) 1fr auto 1fr auto;">
            <div>Var Name</div><div>Light</div><div></div><div>Dark</div><div></div>
          </div>
        ` : nothing}
        ${this._model.raw.map(entry => this._renderRawRow(entry, catalogOptions))}
        <div class="gen-toolbar-row">
          <ha-button @click=${() => this._addRawOverride()}>
            <ha-icon icon="mdi:plus" slot="start"></ha-icon>
            Add Override
          </ha-button>
        </div>
      </lcards-form-section>
    `;
  }

  _renderRawRow(entry, catalogOptions) {
    const hasDark = entry.dark !== undefined;
    return html`
      <div class="gen-raw-row">
        <ha-selector .hass=${this.hass}
          .selector=${{ select: { mode: 'dropdown', custom_value: true, options: catalogOptions } }}
          .value=${entry.key} .label=${'Var Name'}
          @value-changed=${(ev) => this._updateRawKey(entry.id, (ev.detail.value ?? '').trim())}>
        </ha-selector>
        <lcards-color-picker .hass=${this.hass} .value=${entry.value ?? ''} .showBuilder=${false} .themeContext=${this._liveImportedThemeContext()}
          @value-changed=${(ev) => this._updateRawValue(entry.id, ev.detail.value)}>
        </lcards-color-picker>
        <label class="gen-dark-toggle">
          <ha-switch .checked=${hasDark} @change=${(ev) => this._toggleRawDark(entry.id, ev.target.checked)}></ha-switch>
          <span class="gen-dark-toggle-label">Dark</span>
        </label>
        ${hasDark ? html`
          <lcards-color-picker .hass=${this.hass} .value=${entry.dark ?? ''} .showBuilder=${false} .themeContext=${this._liveImportedThemeContext()}
            @value-changed=${(ev) => this._updateRawValue(entry.id, ev.detail.value, true)}>
          </lcards-color-picker>
        ` : html`<span class="gen-dark-empty">(using light value)</span>`}
        <ha-icon-button .label=${'Remove'} @click=${() => this._removeRawOverride(entry.id)}>
          <ha-icon icon="mdi:delete"></ha-icon>
        </ha-icon-button>
      </div>
    `;
  }

  _renderPreviewExportSection() {
    const model = this._buildExportModel();
    const yamlText = formatThemeYaml(model);
    return html`
      <lcards-form-section header="Preview &amp; Export" icon="mdi:file-export-outline" ?expanded=${true} ?outlined=${true}>
        <div class="gen-toolbar-row gen-preview-mode-toolbar">
          <div class="gen-toggle-group gen-toggle-group-m">
            <wa-button-group childSelector="ha-button">
              <ha-button variant="brand" size="s" .appearance=${this._previewMode === 'light' ? 'accent' : 'filled'}
                @click=${() => { this._previewMode = 'light'; }}>Light</ha-button>
              <ha-button variant="brand" size="s" .appearance=${this._previewMode === 'dark' ? 'accent' : 'filled'}
                @click=${() => { this._previewMode = 'dark'; }}>Dark</ha-button>
            </wa-button-group>
          </div>
        </div>

        <lcards-form-section header="Palette Seed — Full Palettes" icon="mdi:palette-swatch" ?expanded=${true} nested
          description="The 5 raw ha-color-<role>-* palettes (05–95) everything below is computed from — see Palette Seed above to change them.">
          <div class="gen-scale-preview">
            ${HA_PALETTE_ROLES.map(role => {
              const isUnset = this._model.roles[role]?.source === 'none';
              const scale = this._scaleForRolePreview(role, this._previewMode);
              return html`
                <div class="gen-scale-row">
                  <div class="gen-scale-label">${ROLE_LABELS[role]}</div>
                  <div class="gen-scale-swatches">
                    ${TONE_ORDER.map(tone => {
                      const fallback = this._isRoleTonePreviewFallback(role, tone);
                      return html`
                        <div class="gen-scale-swatch ${fallback ? 'gen-scale-swatch-fallback' : ''}"
                          title="${fallback ? `${this._roleDefaultBadge(role)} — not set by this theme` : ''}">
                          <div class="gen-swatch-fill" style="background-color:${scale[tone]}"></div>
                          <span class="gen-scale-swatch-tag">${tone}</span>
                        </div>
                      `;
                    })}
                  </div>
                  ${isUnset ? html`<span class="gen-fallback-badge">${this._roleDefaultBadge(role)}</span>` : nothing}
                </div>
              `;
            })}
          </div>
        </lcards-form-section>

        <lcards-form-section header="Colour Reference" icon="mdi:format-color-fill" ?expanded=${false} nested
          description="Every field in HA-LCARS &amp; Legacy HA Semantic Colours below, as a single at-a-glance swatch sheet — same grouping, same live-resolved values (default or overridden, whichever is currently active) for the selected Light/Dark mode above.">
          ${this._renderVarSwatchSection(model)}
        </lcards-form-section>

        <lcards-form-section header="Domain &amp; State Colours — Live" icon="mdi:state-machine" ?expanded=${false} nested
          @expanded-changed=${() => this.requestUpdate()}
          description="Real HA tile cards against a synthetic demo entity for each well-known domain below — Domain &amp; State Colours has no live preview otherwise, only raw colour rows.">
          ${this._renderInfoGuide('domain-demo', 'mdi:information-outline', 'What these tiles are, and what they can\'t show', html`
            <p>Each tile is a real <code>hui-card</code> (the same HA element type your real dashboard uses)
              pointed at a fake entity — e.g. <code>light.lcards_theme_lab_demo</code> — that doesn't exist in your
              HA instance. Created only for this preview, never written anywhere, gone when you close the Theme
              Lab. Tapping a tile does nothing (no more-info dialog) since the entity behind it isn't real.</p>
            <p class="preset-info-guide-tip"><strong>Person and device tracker are missing on purpose:</strong> HA's
              own tile card never colours those two domains' icons from a CSS var at all — their colour lives on a
              badge, an unrelated mechanism this generator doesn't touch. They're still editable as static swatches
              in <strong>Domain &amp; State Colours</strong> above.</p>
            <p class="preset-info-guide-missing-note">A tile captioned <strong>HA-LCARS Default</strong> or
              <strong>HA Default</strong> means that domain/state hasn't been overridden in Domain &amp; State
              Colours — this is a real, live-mounted <code>hui-card</code>, but the colour you see is this section's
              own static default (ha-lcars's shared anchor, or HA core's own baseline), the same as everywhere
              else on this page — never whatever theme happens to be active on this browser tab. Separately, LCARdS
              only ever generates the generic <code>--state-&lt;domain&gt;-&lt;state&gt;-color</code>
              var, never a device_class-specific one (e.g. <code>--state-binary_sensor-smoke-on-color</code>) — but
              HA's own default theme defines several of those more specific vars unconditionally, so your <em>real</em>
              device-classed entities (an actual <code>binary_sensor.smoke</code>, say) will keep showing HA's
              baked-in colour regardless of what this theme sets, since CSS <code>var()</code> fallback only engages
              once the higher-priority var is undefined.</p>
          `)}
          ${this._renderDomainDemoPreview(model)}
        </lcards-form-section>

        <!-- Deliberately NOT a collapsible lcards-form-section, unlike its siblings — see the long
             comment on updated()'s docblock. Card_mod/UIX demo cards below are imperatively mounted
             the moment their container first exists in the DOM; when this was briefly made
             collapsible, mounting was correctly deferred until first expand, but by then the cards
             were created and configured all at once, right as the user expanded the panel, rather
             than eagerly on page load like every other section's declarative content — and UIX's
             own per-card style injection came back consistently empty, strongly suggesting an
             async template-fetch race rather than enough time to resolve before being inspected.
             Kept eagerly mounted (this box's own div, not gated behind ha-expansion-panel's lazy
             <slot>) until that's root-caused for real, even though it makes this box unable to
             collapse like the rest of Preview & Export. -->
        <div class="gen-preview-box">
          <div class="gen-preview-heading">LCARS UI Chrome</div>
          <p class="gen-preview-subheading">The sidebar, app header, tooltip, and core <code>lcars-ui-*</code> colour
            tiers — the parts of a real HA-LCARS dashboard that can't be reproduced as an actual card_mod-classed
            card (see below), since their styling targets HA's own live app-shell chrome (or, for the colour tiers,
            no single card_mod class at all) rather than a per-card class.</p>
          ${this._renderInfoGuide('lcars-mockups', 'mdi:information-outline', 'What these mockups show', html`
            <p>Hand-built approximations, coloured from your actual <strong>HA-LCARS &amp; Legacy HA Semantic
              Colours</strong> values (defaults or overrides, whichever is currently active) for the selected
              Light/Dark mode above. Not pixel-exact to HA-LCARS's own CSS, but close enough to sanity-check contrast
              and hue choices before pasting anywhere. Card chrome itself isn't mocked up here any more — see the real
              card_mod header/middle/footer/button examples below instead.</p>
          `)}
          ${this._renderLcarsMockups(this._previewMode)}

          <p class="gen-preview-subheading">Below: the same chrome — plus buttons, and standalone bars — but
            rendered by real HA-LCARS card_mod classes, not an approximation, when card_mod or UIX is available.</p>
          ${this._renderInfoGuide('lcars-cardmod', 'mdi:information-outline', 'What this needs to actually render', html`
            <p>These are real examples straight from HA-LCARS's own README ("Usage instructions" → "Classes") —
              plain <code>markdown</code>/<code>button</code> cards with a <code>card_mod: {class: ...}</code>
              config, created the same way LCARdS creates any real HA card elsewhere in this app. Two things both
              need to be true for them to render correctly:</p>
            <ul>
              <li>Either <a href="https://github.com/thomasloven/lovelace-card-mod" target="_blank" rel="noopener">card_mod</a>
                or its HACS successor <a href="https://uix.lf.technology/" target="_blank" rel="noopener">UIX (UI
                eXtension)</a> — a drop-in replacement that processes the same <code>card_mod:</code> config key —
                must be installed. Without one of these, these classes don't mean anything to any card.</li>
              <li>Your <strong>currently active HA theme</strong> must be an HA-LCARS theme, since the class
                definitions themselves live in a theme's own <code>card-mod-card-yaml</code> — a reserved variable
                card_mod/UIX reads from whichever theme is actually applied to this page right now, not from the
                theme you're editing here. There's no way for this generator to inject that on your behalf: it's a
                large block of Jinja2-templated CSS tied to HA helper entities, not something that can be copied in
                as plain CSS.</li>
            </ul>
            <p class="preset-info-guide-tip">The <em>colours</em> those classes use, though —
              <code>--lcars-card-top-color</code> and friends — do come from the theme you're editing here, live, the
              same way the rest of this preview does. Only the class definitions themselves depend on what's actually
              active. The button demos below use a name/icon only, no real entity — HA-LCARS's own README examples
              bind these classes to real lights/switches, but this generator can't assume any specific entity exists
              in your HA instance.</p>
          `)}
          ${this._renderLcarsCardModPreview(model)}
        </div>

        <lcards-form-section header="HA-* Native Controls" icon="mdi:home-assistant" ?expanded=${false} nested
          description="Real, live stock Home Assistant elements (not HA-LCARS-specific, and not hand-drawn approximations) — wrapped in this theme's actual computed colours for the selected Light/Dark mode above.">
          ${this._renderInfoGuide('live-preview', 'mdi:information-outline', 'What\'s real here, and what still isn\'t', html`
            <p>These are real <code>ha-card</code>/<code>ha-button</code>/<code>ha-switch</code>/<code>ha-checkbox</code>/
              <code>ha-alert</code> elements, wrapped in a container carrying this theme's actual computed CSS custom
              properties — HA's own component CSS resolves colours exactly the way it would once this theme is
              installed and applied for real. Nothing outside this box is affected — no live HA theme, setting, or
              other part of this page is touched, and nothing here is written to the exported YAML. Unlike the
              card_mod examples above, these always render — no card_mod/UIX or active-theme prerequisite.</p>
            <p class="preset-info-guide-tip">The <code>ha-alert</code> stack at the top exercises HA's legacy
              <code>info/success/warning/error-color</code> vars, a layer none of the buttons below touch — see
              <strong>Colour Reference</strong> above for every other field this theme defines, as swatches.</p>
            <p class="preset-info-guide-tip">The switch and checkbox are only shown once each, not once per state —
              they're real, interactive controls, so toggle them yourself to see both the on and off colours rather
              than comparing two static copies.</p>
            <p class="preset-info-guide-tip"><strong>Roles left "None" in Palette Seed</strong> render using whatever
              HA (or your current active theme) genuinely falls back to right now, on this very page — the same real
              fallback behaviour as everywhere else in this preview, just applied automatically by the browser
              instead of read manually.</p>
            <p class="preset-info-guide-missing-note">Still not your actual dashboard: a real Lovelace view adds its
              own card layout, spacing, and any card-mod/HA-LCARS chrome around content like this — see
              <strong>LCARS UI Chrome</strong> above for that layer. This box only proves the theme's colour tokens
              resolve correctly on genuine HA components.</p>
          `)}
          ${this._renderLiveComponentPreview(model)}
        </lcards-form-section>

        <div class="gen-preview-box gen-export-box">
          <div class="gen-preview-heading">Generated Theme YAML</div>
          <div class="info-card">
            <p>Paste this into your existing HA-LCARS <code>themes.yaml</code>, alongside its other themes (not a
              standalone file) — like every real HA-LCARS theme, it references the shared <code>&amp;lcars-variables</code>,
              <code>&amp;base</code>, and <code>&amp;card-mod-css</code> anchors (the <code>&lt;&lt;: *name</code> lines
              near the top) for the sidebar chrome, fonts, tables, tooltips, and card-mod styling this generator
              doesn't reproduce on its own. Everything explicitly listed below always wins over what those anchors
              provide.</p>
          </div>
          <div class="yaml-actions">
            <span class="gen-hint" style="margin:0;">Generated YAML — read-only, copy it below.</span>
            <ha-button @click=${() => this._handleCopyYaml()}>
              <ha-icon icon="${this._copyFeedback ? 'mdi:check' : 'mdi:content-copy'}" slot="start"></ha-icon>
              ${this._copyFeedback ? 'Copied!' : 'Copy YAML'}
            </ha-button>
          </div>
          <pre class="yaml-block"><code>${yamlText}</code></pre>
        </div>
      </lcards-form-section>
    `;
  }

  /** Resolves a Legacy field's current value (override or computed default) for a specific light/dark mode, as a concrete hex — used by the LCARS UI mockups below. Mirrors _renderLegacyField's own default-resolution (roleUnset -> static default, never a gray placeholder). */
  _legacyValueForMode(key, mode) {
    const field = LEGACY_FIELD_DEFS.find(f => f.key === key);
    if (!field) return '#888888';
    const override = this._model.legacy[key];
    if (mode === 'dark' && override?.dark !== undefined) return this._previewHex(override.dark);
    if (override?.value !== undefined) return this._previewHex(override.value);
    // field.fixed is always a literal hex for the one remaining hand-computed field
    // (lcars-secondary-text) — no theme context needed to resolve it further.
    if (field.fixed) return (mode === 'dark' && field.fixedDark) ? field.fixedDark : field.fixed;
    if (field.live) return this._staticHaDefault(field.key).hex;
    if (!this._roleDerivesLegacyFields(field.role)) return this._legacyFieldDefault(field).hex;
    return this._resolveTone(field.role, field.tone, mode).hex;
  }

  _renderLcarsMockups(mode) {
    const v = (key) => this._legacyValueForMode(key, mode);
    return html`
      <div class="gen-mockup-grid">
        <div class="gen-mockup-cell">
          <div class="gen-mockup-caption">Sidebar</div>
          <div class="gen-lcars-sidebar" style="background:${v('lcars-sidebar-background')}">
            ${['Overview', 'Energy', 'Map'].map((label, i) => html`
              <div class="gen-lcars-sidebar-item" style="color:${i === 1 ? v('lcars-sidebar-selected-color') : v('lcars-sidebar-item-color')}">
                <span class="gen-lcars-sidebar-dot" style="background:${i === 1 ? v('lcars-sidebar-selected-color') : v('lcars-sidebar-icon-color')}"></span>
                ${label}
                ${i === 2 ? html`<span class="gen-lcars-sidebar-badge" style="background:${v('lcars-sidebar-notification-color')}">3</span>` : nothing}
              </div>
            `)}
          </div>
        </div>
        <div class="gen-mockup-cell">
          <div class="gen-mockup-caption">App Header &amp; Tooltip</div>
          <div class="gen-lcars-header" style="background:${v('lcars-ui-app-header-background-color')};color:${v('lcars-ui-app-header-text-color')}">
            <span>LCARdS</span>
            <span style="color:${v('lcars-ui-app-header-clock')}">14:22</span>
          </div>
          <div class="gen-lcars-tooltip" style="background:${v('lcars-tooltip-background')};color:${v('lcars-tooltip-text')}">
            Living Room Light
          </div>
        </div>
        <div class="gen-mockup-cell">
          <div class="gen-mockup-caption">UI Colour Tiers</div>
          <div class="gen-lcars-tier-heading" style="color:${v('lcars-ui-text-heading')}">Status Display</div>
          <div class="gen-lcars-tier-stack">
            ${UI_TIER_BARS.map(({ key, textKey, label }) => html`
              <div class="gen-lcars-tier-bar" style="background:${v(key)};color:${v(textKey)}">${label}</div>
            `)}
          </div>
          <div class="gen-lcars-tier-config">
            <span class="gen-lcars-config-chip" style="background:${v('lcars-ui-config-button')}">
              <ha-icon icon="mdi:cog" style="color:${v('lcars-ui-config-icon')}"></ha-icon>
            </span>
            <span class="gen-mockup-caption" style="margin:0">Config</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Comprehensive live swatch sheet for every field in LEGACY_FIELD_DEFS — same grouping
   * (LEGACY_GROUPS) as the actual "HA-LCARS & Legacy HA Semantic Colours" editing section, so this
   * reference view never drifts out of sync with what's actually editable. Deliberately not a
   * hand-picked subset (an earlier version of this preview only showed 8 curated slots, which
   * under-represented HA-LCARS's actual colour surface and was inconsistent with itself — e.g. it
   * had UI Tertiary but not UI Primary/Quaternary). Each swatch is a plain `background: var(--key)`
   * inside the same _buildLiveVarStyle-carrying wrapper the rest of this preview uses, so the
   * browser resolves the live value itself — no separate hex-resolution logic to keep in sync.
   */
  _renderVarSwatchSection(model) {
    const styles = this._buildLiveVarStyle(model, this._previewMode);
    return html`
      <div class="gen-live-preview" style=${styleMap(styles)}>
        ${LEGACY_GROUPS.map(group => html`
          <div class="gen-varswatch-group">
            <div class="gen-cardmod-group-title">${group}</div>
            <div class="gen-varswatch-row">
              ${LEGACY_FIELD_DEFS.filter(f => f.group === group).map(field => html`
                <div class="gen-varswatch-chip" title="--${field.key}">
                  <div class="gen-varswatch-swatch">
                    <div class="gen-swatch-fill" style="background-color:var(--${field.key})"></div>
                  </div>
                  <span class="gen-varswatch-label">${field.label}</span>
                </div>
              `)}
            </div>
          </div>
        `)}
      </div>
    `;
  }

  /**
   * Real, live HA elements (ha-card/ha-button/ha-switch) wrapped in this theme's actual computed
   * CSS custom properties (see _buildLiveVarStyle) — HA's own component CSS resolves colours
   * exactly as it would once this theme is applied for real. Replaces the old hand-approximated
   * button mockups (fake <button>s + hand-computed WCAG contrast math) entirely: real ha-button
   * reading --ha-color-on-primary-loud etc. already gets that same correction for free, since
   * _buildExportModel bakes it into the exported tokens via resolveOnEntry().
   */
  _renderLiveComponentPreview(model) {
    const styles = this._buildLiveVarStyle(model, this._previewMode);
    return html`
      <div class="gen-live-preview" style=${styleMap(styles)}>
        <div class="gen-alert-stack">
          <ha-alert alert-type="info">Info</ha-alert>
          <ha-alert alert-type="success">Success</ha-alert>
          <ha-alert alert-type="warning">Warning</ha-alert>
          <ha-alert alert-type="error">Error</ha-alert>
        </div>
        <ha-card header="Warp Core Status">
          <div class="card-content">Standby — 94% output.</div>
          <div class="card-actions">
            <ha-button appearance="plain" variant="neutral">Cancel</ha-button>
            <ha-button appearance="accent" variant="brand">Engage</ha-button>
          </div>
        </ha-card>
        <div class="gen-btn-grid">
          ${HA_BUTTON_VARIANTS.flatMap(({ role, variant, label }) => HA_BUTTON_TIERS.map(({ appearance, label: tierLabel }) => {
            const unset = this._semanticRoleUnset(role);
            return html`
              <div class="gen-btn-cell ${unset ? 'gen-btn-cell-fallback' : ''}">
                <ha-button size="s" variant=${variant} appearance=${appearance}>${label} / ${tierLabel}</ha-button>
                ${unset ? html`<div class="gen-mock-caption"><span class="gen-fallback-badge">HA default</span></div>` : nothing}
              </div>
            `;
          }))}
        </div>
        <div class="gen-live-switch-row">
          <ha-switch checked></ha-switch>
          <ha-checkbox checked></ha-checkbox>
        </div>
      </div>
    `;
  }

  /**
   * Real card_mod-processed HA-LCARS chrome — the exact header-left/middle-left/footer-left
   * classes from HA-LCARS's own README, applied to real markdown cards created via the same
   * createHuiCardWrapper() infrastructure LCARdS already uses elsewhere (MsdControlsRenderer,
   * lcards-elbow's symbiont embedding). Gated on isCardModAvailable() — renders an honest
   * fallback message instead of broken/unstyled cards when card_mod itself isn't installed.
   * Mounting is imperative (see updated()), matching lcards-elbow.js's _symbiontElement pattern:
   * these are real DOM nodes card_mod/Lovelace create, not something Lit can declare directly.
   */
  _renderLcarsCardModPreview(model) {
    if (!isCardModAvailable()) {
      return html`<p class="gen-hint">Neither card_mod nor UIX (UI eXtension) is installed on this HA instance —
        these examples need one of them. Install either via
        <a href="https://hacs.xyz/" target="_blank" rel="noopener">HACS</a> to see this preview.</p>`;
    }
    const styles = this._buildLiveVarStyle(model, this._previewMode);
    const activeThemeVars = this.hass?.themes?.themes?.[this.hass.themes.theme];
    const activeThemeHasCardMod = !!activeThemeVars?.['card-mod-card-yaml'];
    return html`
      <div class="gen-live-preview" style=${styleMap(styles)}>
        ${!activeThemeHasCardMod ? html`
          <p class="gen-hint">Your currently active HA theme doesn't appear to define HA-LCARS's card-mod classes
            — these may render unstyled below. Switch your active theme to an HA-LCARS variant to see this
            preview correctly.</p>
        ` : nothing}
        ${LCARS_CARDMOD_DEMOS.map(({ group, demos }) => html`
          <div class="gen-cardmod-group-title">${group}</div>
          <div class="gen-mockup-grid">
            ${demos.map(({ slot, label, narrow }) => html`
              <div class="gen-mockup-cell ${narrow ? 'gen-mockup-cell-narrow' : ''}">
                <div class="gen-mockup-caption">${label}</div>
                <div class="gen-cardmod-slot" data-slot="${slot}"></div>
              </div>
            `)}
          </div>
        `)}
      </div>
    `;
  }

  /**
   * Real HA `tile` cards against synthetic (fake, non-real) entities — one per DOMAIN_DEMO_ENTITIES
   * domain — so the Domain & State Colours matrix (--state-<domain>-<state>-color, edited only as
   * raw colour rows in _renderDomainSection) gets an actual live rendering, not just a swatch.
   * `tile` is a core Lovelace card type (no card_mod/UIX prerequisite, unlike the section above).
   * Mounting is imperative (see updated()), same pattern as _renderLcarsCardModPreview. Shows the
   * same badge convention every sibling preview box in this file uses when a domain/state row hasn't
   * been explicitly overridden — its colour is _buildDomainDefaultStyle's static default (via
   * _buildLiveVarStyle), never whatever's genuinely active on this browser tab.
   */
  _renderDomainDemoPreview(model) {
    const styles = this._buildLiveVarStyle(model, this._previewMode);
    return html`
      <div class="gen-live-preview" style=${styleMap(styles)}>
        <div class="gen-mockup-grid">
          ${DOMAIN_DEMO_ENTITIES.map(({ domain, state }) => {
            const isModified = this._model.domainOverrides[`${domain}.${state}`]?.value !== undefined;
            const badgeLabel = isModified ? null : DEFAULT_TIER_LABELS[this._liveDomainStateDefault(domain, state).tier];
            return html`
              <div class="gen-mockup-cell">
                <div class="gen-mockup-caption">${domain.replace(/_/g, ' ')} — ${state.replace(/_/g, ' ')}
                  ${badgeLabel ? html`<span class="gen-fallback-badge">${badgeLabel}</span>` : nothing}</div>
                <div class="gen-domain-demo-slot" data-domain="${domain}"></div>
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }

  /**
   * Creates (once) and keeps HASS current on the real card_mod demo cards (_renderLcarsCardModPreview)
   * and the synthetic-entity domain/state demo tiles (_renderDomainDemoPreview) — mirrors
   * lcards-elbow.js's imperative symbiont-card mount pattern, since these are real DOM nodes
   * outside Lit's own declarative rendering. Two independent loops: card_mod demos are gated on
   * isCardModAvailable(), domain demo tiles are not — `tile` is a core, always-available Lovelace
   * card type with no card_mod/UIX dependency.
   *
   * The domain-demo host section defaults to collapsed (lcards-form-section, see
   * _renderPreviewExportSection) — ha-expansion-panel's internals only render their own <slot> once
   * expanded at least once (`_showContent`, set from the `expanded` property), so
   * .gen-domain-demo-slot containers genuinely don't exist in the DOM yet on first render when
   * collapsed — querySelector below would find nothing and mounting would silently never happen.
   * Since ha-expansion-panel's own expanded-changed event doesn't bubble/cross shadow boundaries,
   * that lcards-form-section listens for it directly and calls this.requestUpdate(), so this loop
   * re-runs (and finally finds the now-slotted containers) right after the user expands it.
   *
   * The card_mod host section (LCARS UI Chrome) deliberately does NOT use lcards-form-section, for
   * a different, still not fully root-caused reason: when it briefly did, mounting correctly waited
   * for first-expand (same fix as above), but the demo cards then all got created+configured in one
   * burst right as the user expanded the panel, rather than eagerly on first page load like before —
   * and UIX's own per-card <style> injection came back consistently empty across every demo card.
   * Leading theory: an async template-fetch race that had plenty of time to resolve under the old,
   * eager-on-load timing but not under expand-triggered lazy creation. Kept as a plain, always-
   * mounted div until that's confirmed and fixed for real — see the comment on its markup in
   * _renderPreviewExportSection.
   */
  updated(changedProps) {
    super.updated?.(changedProps);
    if (isCardModAvailable()) {
      for (const { slot, config } of ALL_CARDMOD_DEMOS) {
        const container = this.renderRoot.querySelector(`.gen-cardmod-slot[data-slot="${slot}"]`);
        if (!container) continue;
        let wrapper = this._lcarsCardModWrappers[slot];
        if (!wrapper) {
          wrapper = createHuiCardWrapper(config, this.hass);
          this._lcarsCardModWrappers[slot] = wrapper;
        }
        if (!container.contains(wrapper)) container.appendChild(wrapper);
        if (changedProps.has('hass')) applyHassToCard(wrapper, this.hass, `cardmod-preview-${slot}`);
      }
    }

    const demoHass = this._buildDemoHass();
    for (const { domain } of DOMAIN_DEMO_ENTITIES) {
      const container = this.renderRoot.querySelector(`.gen-domain-demo-slot[data-domain="${domain}"]`);
      if (!container || !demoHass) continue;
      let wrapper = this._domainDemoWrappers[domain];
      if (!wrapper) {
        const entityId = `${domain}.lcards_theme_lab_demo`;
        wrapper = createHuiCardWrapper(
          { type: 'tile', entity: entityId, tap_action: { action: 'none' }, icon_tap_action: { action: 'none' } },
          demoHass,
        );
        this._domainDemoWrappers[domain] = wrapper;
      }
      if (!container.contains(wrapper)) container.appendChild(wrapper);
      if (changedProps.has('hass')) applyHassToCard(wrapper, demoHass, `domain-demo-preview-${domain}`);
    }
  }

  /** Tears down the imperatively-mounted card_mod demo cards and domain/state demo tiles — mirrors lcards-elbow.js's _unmountSymbiontCard(). */
  disconnectedCallback() {
    for (const slot of Object.keys(this._lcarsCardModWrappers)) {
      this._lcarsCardModWrappers[slot]?.remove?.();
    }
    this._lcarsCardModWrappers = {};
    for (const domain of Object.keys(this._domainDemoWrappers)) {
      this._domainDemoWrappers[domain]?.remove?.();
    }
    this._domainDemoWrappers = {};
    super.disconnectedCallback();
  }

  // ─── Model update handlers ──────────────────────────────────────────────

  _setName(name) {
    this._model = { ...this._model, name };
  }

  _selectStartMode(mode) {
    this._startMode = mode;
  }

  _updateRoleSource(role, source) {
    if (source === 'custom') this._ensureCustomAnchors(role, 'light');
    const prevCfg = this._model.roles[role];
    const nextCfg = { ...prevCfg, source };
    // A role coming from "None" (or, in principle, "Imported") has no `family` at all — every
    // downstream resolver (computeFullScale -> hexToRgb) assumes 'family' source always has one,
    // so switching without seeding a default crashes on the very next render rather than showing
    // a blank dropdown for the user to fill in.
    if (source === 'family' && !nextCfg.family) nextCfg.family = LCARDS_FAMILIES[0];
    this._model = { ...this._model, roles: { ...this._model.roles, [role]: nextCfg } };
  }

  _updateRoleFamily(role, family, mode = 'light') {
    const key = mode === 'dark' ? 'darkFamily' : 'family';
    this._model = { ...this._model, roles: { ...this._model.roles, [role]: { ...this._model.roles[role], [key]: family } } };
  }

  /**
   * Turns a role's dark-mode palette variant on/off. For 'family' source,
   * this sets/clears `darkFamily` (starting as a copy of the light family,
   * so the dropdown isn't blank). For 'custom' source, this seeds/discards
   * the parallel customAnchorsDark state. Not offered for 'none'/'imported'.
   */
  _toggleRoleDarkDiffers(role, enabled) {
    const cfg = this._model.roles[role];
    if (cfg.source === 'family') {
      this._model = {
        ...this._model,
        roles: { ...this._model.roles, [role]: { ...cfg, darkFamily: enabled ? (cfg.darkFamily || cfg.family) : undefined } },
      };
      return;
    }
    if (cfg.source === 'custom') {
      if (enabled) {
        this._ensureCustomAnchors(role, 'dark');
      } else {
        const customAnchorsDark = { ...this._model.customAnchorsDark };
        const customAnchorsDarkTouched = { ...this._model.customAnchorsDarkTouched };
        delete customAnchorsDark[role];
        delete customAnchorsDarkTouched[role];
        this._model = { ...this._model, customAnchorsDark, customAnchorsDarkTouched };
      }
    }
  }

  /**
   * Seeds a role's custom-anchor state (light or dark) the first time Custom
   * mode — or a dark-mode variant — is selected: only the Base (tone 40)
   * swatch is pre-filled, from whatever this role/mode was actually showing
   * right before the switch (an imported ramp's own tone 40, a linked
   * family's tone 40, the light custom value, or gray if unset) — not a
   * full 11-tone copy, which would blur "what was there" vs "what you're
   * now building". Every other tone starts genuinely blank; Generate fills
   * them from Base.
   */
  /**
   * Seeds a role's Custom anchors the first time it's switched to Custom.
   * Coming from "Imported" (a real theme's own ramp is available, complete
   * or partial), every tone the theme genuinely defines is seeded with its
   * ORIGINAL portable text verbatim — "var(--lcars-ui-tertiary)", "color-
   * mix(in oklch, var(--lcars-ui-tertiary) 8%, white)", etc. — not the
   * resolved hex Palette Seed's own swatches use internally, so nothing
   * about the theme's real, portable definition is lost by switching to
   * Custom to hand-tune one stop. lcards-color-picker's own preview (given
   * .themeContext) still renders an accurate swatch for these without them
   * needing to be baked to hex. Any stop the theme's own ramp doesn't
   * define (a partial import) is seeded from HA's live default instead —
   * a real, editable starting point rather than an unexplained blank.
   * Coming from "family"/"none" (no real per-tone data exists at all, just
   * a computed scale), only Base is seeded — matching how family colors
   * always worked here — leaving the other 10 genuinely blank rather than
   * implying they came from somewhere real.
   *
   * Tones seeded from the theme's own raw ramp are marked touched immediately — they're genuine,
   * theme-authored values, not "still needs computing" placeholders, so editing one anchor tone
   * (e.g. Base) must never silently recompute/overwrite them via the untouched-gap-tone OKLCH
   * interpolation in _updateCustomTone. A partial ramp's live-fallback-seeded stops are left
   * untouched on purpose, since those are just a guess, not real theme data — an adjacent anchor
   * edit filling them in via OKLCH interpolation is a reasonable improvement over a disconnected
   * fallback color.
   */
  _ensureCustomAnchors(role, mode = 'light') {
    const store = mode === 'dark' ? 'customAnchorsDark' : 'customAnchors';
    const touchedStore = mode === 'dark' ? 'customAnchorsDarkTouched' : 'customAnchorsTouched';
    if (this._model[store][role]) return;
    const rawRamp = this._model.roles[role]?.source === 'imported' ? this._model.importedRampsRaw[role] : null;
    /** @type {Object<string,string>} */
    const scale = {};
    const touched = new Set();
    if (rawRamp) {
      for (const tone of TONE_ORDER) {
        if (rawRamp[tone] !== undefined) {
          scale[tone] = rawRamp[tone];
          touched.add(tone);
        } else {
          scale[tone] = this._staticHaDefault(`ha-color-${role}-${tone}`).hex;
        }
      }
    } else {
      const baseHex = this._scaleForRole(role, mode)['40'] || '#888888';
      for (const tone of TONE_ORDER) scale[tone] = tone === '40' ? baseHex : '#888888';
    }
    this._model = {
      ...this._model,
      [store]: { ...this._model[store], [role]: scale },
      [touchedStore]: { ...this._model[touchedStore], [role]: touched },
    };
  }

  /**
   * Sets one of the 11 tones directly, for either the light or dark custom
   * palette — fully independent of every other tone. The only things that
   * ever touch more than one tone at once are _ensureCustomAnchors's initial
   * seed (switching a role to Custom for the first time) and the explicit
   * "regenerate from Base" action (_generateAnchorsFromBase). This used to
   * also live-recompute the 4 in-between gap tones (10/50/60/95) from
   * whichever anchor tones were just edited, guarded by a "touched" set so a
   * hand-set gap tone wouldn't get clobbered — but that guard didn't cover
   * every path a tone could become "already set" without being marked
   * touched, so an untouched gap tone could still change out from under the
   * user on an unrelated anchor edit. Removed rather than patched again:
   * editing one swatch should never have a visible side effect on another.
   */
  _updateCustomTone(role, tone, value, mode = 'light') {
    const store = mode === 'dark' ? 'customAnchorsDark' : 'customAnchors';
    const touchedStore = mode === 'dark' ? 'customAnchorsDarkTouched' : 'customAnchorsTouched';
    const scale = { ...(this._model[store][role] || {}), [tone]: value };
    const touched = new Set(this._model[touchedStore][role] || []);
    touched.add(tone);

    this._model = {
      ...this._model,
      [store]: { ...this._model[store], [role]: scale },
      [touchedStore]: { ...this._model[touchedStore], [role]: touched },
    };
  }

  /** Resets all 11 tones (light or dark) for a role to a neutral placeholder and clears the touched-set, so the user starts genuinely blank rather than family-seeded. */
  _clearCustomAnchors(role, mode = 'light') {
    const store = mode === 'dark' ? 'customAnchorsDark' : 'customAnchors';
    const touchedStore = mode === 'dark' ? 'customAnchorsDarkTouched' : 'customAnchorsTouched';
    /** @type {Object<string,string>} */
    const scale = {};
    for (const tone of TONE_ORDER) scale[tone] = '#888888';
    this._model = {
      ...this._model,
      [store]: { ...this._model[store], [role]: scale },
      [touchedStore]: { ...this._model[touchedStore], [role]: new Set() },
    };
  }

  /** Regenerates the other 10 tones (light or dark) from whatever that mode's Base (tone 40) swatch currently holds, via the same OKLCH lightness-ramp ha-lcars's own generic fallback uses (computeHaDefaultScale, which already covers all 11 HA tone slots). Base itself is left exactly as the user set it (e.g. a var() reference) — only used as a resolved-hex seed for the math, never overwritten. */
  _generateAnchorsFromBase(role, mode = 'light') {
    const store = mode === 'dark' ? 'customAnchorsDark' : 'customAnchors';
    const touchedStore = mode === 'dark' ? 'customAnchorsDarkTouched' : 'customAnchorsTouched';
    const current = this._model[store][role] || {};
    const originalBase = current['40'] || '#888888';
    const seedHex = this._previewHex(originalBase);
    const fullScale = computeHaDefaultScale(seedHex);
    fullScale['40'] = originalBase;
    this._model = {
      ...this._model,
      [store]: { ...this._model[store], [role]: fullScale },
      [touchedStore]: { ...this._model[touchedStore], [role]: new Set() },
    };
  }

  _setLegacyValue(key, value, isDark = false) {
    const entry = { ...(this._model.legacy[key] || {}) };
    if (isDark) entry.dark = value; else entry.value = value;
    this._model = { ...this._model, legacy: { ...this._model.legacy, [key]: entry } };
  }

  _toggleLegacyDark(key, enabled, fallbackValue) {
    const entry = { ...(this._model.legacy[key] || {}) };
    if (enabled) entry.dark = entry.dark ?? entry.value ?? fallbackValue;
    else delete entry.dark;
    this._model = { ...this._model, legacy: { ...this._model.legacy, [key]: entry } };
  }

  /** Removes a field's override entirely (light and dark), reverting it to its Palette-Seed-derived computed default. */
  _revertLegacyValue(key) {
    const legacy = { ...this._model.legacy };
    delete legacy[key];
    this._model = { ...this._model, legacy };
  }

  /** Removes a domain/state's override entirely (light and dark), reverting it to HA's own real fallback chain. */
  _revertDomainOverride(domain, state) {
    const key = `${domain}.${state}`;
    const domainOverrides = { ...this._model.domainOverrides };
    delete domainOverrides[key];
    this._model = { ...this._model, domainOverrides };
  }

  _setDomainOverride(domain, state, value, isDark = false) {
    const key = `${domain}.${state}`;
    const entry = { ...(this._model.domainOverrides[key] || {}) };
    if (isDark) entry.dark = value; else entry.value = value;
    this._model = { ...this._model, domainOverrides: { ...this._model.domainOverrides, [key]: entry } };
  }

  _toggleDomainDark(domain, state, enabled, fallbackValue) {
    const key = `${domain}.${state}`;
    const entry = { ...(this._model.domainOverrides[key] || {}) };
    if (enabled) entry.dark = entry.dark ?? entry.value ?? fallbackValue;
    else delete entry.dark;
    this._model = { ...this._model, domainOverrides: { ...this._model.domainOverrides, [key]: entry } };
  }

  _addRawOverride() {
    const id = `raw-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    this._model = { ...this._model, raw: [...this._model.raw, { id, key: '', value: '#ffffff' }] };
  }

  _updateRawKey(id, key) {
    this._model = { ...this._model, raw: this._model.raw.map(r => (r.id === id ? { ...r, key } : r)) };
  }

  _updateRawValue(id, value, isDark = false) {
    this._model = {
      ...this._model,
      raw: this._model.raw.map(r => (r.id === id ? { ...r, [isDark ? 'dark' : 'value']: value } : r)),
    };
  }

  _toggleRawDark(id, enabled) {
    this._model = {
      ...this._model,
      raw: this._model.raw.map(r => {
        if (r.id !== id) return r;
        if (enabled) return { ...r, dark: r.dark ?? r.value };
        const { dark, ...rest } = r;
        return rest;
      }),
    };
  }

  _removeRawOverride(id) {
    this._model = { ...this._model, raw: this._model.raw.filter(r => r.id !== id) };
  }

  // ─── Import ─────────────────────────────────────────────────────────────

  _handleLoadLibraryTheme() {
    this._importError = null;
    this._importFeedback = null;
    const name = this._selectedLibraryTheme;
    const entry = this._themeLibraryEntries.find(e => e.name === name);
    if (!entry) {
      this._importError = `"${name}" not found.`;
      return;
    }
    this._importThemeObject(name, entry.obj);
  }

  _handleImportYaml() {
    this._importError = null;
    this._importFeedback = null;
    const text = this._pasteYamlText;
    if (!text || !text.trim()) {
      this._importError = 'Paste a theme YAML block first.';
      return;
    }

    // Strip merge-key lines (<<: *anchor) — those pull in another file's
    // shared ha-lcars anchors (&lcars-variables/&base/&card-mod-css), not
    // resolvable from a standalone paste (unlike the bundled library above,
    // which is a self-contained document with those anchors defined earlier
    // in the same file, resolved natively by js-yaml).
    const stripped = text.replace(/^\s*<<:\s*\*\S+\s*$/gm, '');

    let parsed;
    try {
      parsed = yamlToConfig(stripped);
    } catch (err) {
      this._importError = `Could not parse YAML: ${err.message}`;
      lcardsLog.warn('[ThemeGeneratorView] YAML import failed', err);
      return;
    }

    const themeNames = Object.keys(parsed || {});
    if (!themeNames.length) {
      this._importError = 'No theme found in the pasted YAML.';
      return;
    }
    const themeName = themeNames[0];
    this._importThemeObject(themeName, parsed[themeName] || {});
  }

  /**
   * Buckets a flat/mode-scoped theme object (however it was sourced — the
   * bundled ha-lcars library or a pasted YAML block) into this generator's
   * curated legacy/domain-state fields, a raw-overrides catch-all for
   * anything unrecognized, and (when a role's full 11-stop ha-color-* ramp
   * is present) a Palette Seed "Imported" source per role. Loading a theme
   * REPLACES legacy/domainOverrides/raw/importedRamps wholesale rather than
   * merging on top of a previous import — each load is a clean start from
   * that theme, not a layered accumulation of whatever was loaded before.
   */
  _importThemeObject(name, themeObj) {
    const legacy = {};
    const domainOverrides = {};
    const raw = [];
    const rampBuffer = {}; // role -> {tone: value}, collected in the same pass
    let skippedRgbCount = 0;

    const assignFlat = (key, value, isDark) => {
      // rgb-<x> companions for any RGB_COMPANION_FIELDS member are always freshly recomputed
      // from their source field in _buildExportModel (section 2, below) — capturing the imported
      // theme's own static rgb-* line here as a Raw Override would go stale the instant the
      // source colour changes afterward, since Raw Overrides (section 5) are applied last and
      // unconditionally win over whatever section 2 just computed.
      if (key.startsWith('rgb-') && RGB_COMPANION_FIELDS.has(key.slice(4))) {
        skippedRgbCount++;
        return;
      }
      if (LEGACY_KEYS.has(key)) {
        legacy[key] = legacy[key] || {};
        if (isDark) legacy[key].dark = value; else legacy[key].value = value;
        return;
      }
      const domainMatch = key.match(DOMAIN_KEY_RE);
      if (domainMatch) {
        const overrideKey = `${domainMatch[1]}.${domainMatch[2]}`;
        domainOverrides[overrideKey] = domainOverrides[overrideKey] || {};
        if (isDark) domainOverrides[overrideKey].dark = value; else domainOverrides[overrideKey].value = value;
        return;
      }
      const rampMatch = !isDark && key.match(HA_COLOR_RAMP_RE);
      if (rampMatch) {
        const [, rampRole, tone] = rampMatch;
        rampBuffer[rampRole] = rampBuffer[rampRole] || {};
        rampBuffer[rampRole][tone] = value;
      }
      let entry = raw.find(r => r.key === key);
      if (!entry) {
        entry = { id: `raw-import-${key}`, key, value: undefined };
        raw.push(entry);
      }
      if (isDark) entry.dark = value; else entry.value = value;
    };

    // ha-color-primary-* (and any other role's) ramp resolution to concrete
    // hex for Palette Seed's swatches happens once values are fully
    // collected below, via _resolveThemeValue against this theme's own var
    // map — no special-casing needed here. Raw/Legacy/Domain fields keep
    // the portable var(--...) form verbatim (see mergeKeys in _buildExportModel).
    const boilerplate = HA_LCARS_THEME_LIBRARY.boilerplate;
    for (const [key, rawValue] of Object.entries(themeObj)) {
      if (key === 'modes') continue;
      // card-mod-*-yaml entries are multi-line CSS blobs, not individual
      // theme vars — not something this color-picker-driven tool can edit.
      if (key.startsWith('card-mod-')) continue;
      if (typeof rawValue !== 'string' && typeof rawValue !== 'number') continue;
      // Boilerplate de-noise: a value that's byte-identical to the shared &lcars-variables/&base
      // anchors (~250 keys, verbatim across all 24 bundled themes) means this key isn't actually
      // distinctive to the theme being imported — it only looks "defined" because js-yaml already
      // resolved the theme's own `<<: *lcars-variables, *base` merge key before we ever see this flat
      // object, and a merge-inherited key is indistinguishable, once flattened, from one the theme
      // genuinely restates itself. Applies uniformly, including recognized Legacy/Domain keys (it
      // used to skip only the unrecognized Raw-Overrides catch-all — back when an unset field's
      // preview was this generator's own guessed default, capturing every recognized key
      // unconditionally was the only way to avoid silently replacing a real value with a guess; now
      // that an unset field previews this exact same boilerplate data via _staticHaDefault, capturing
      // a boilerplate-identical value as a "real override" just means a false isModified flag and a
      // Revert button that leads right back to the same colour). HA_COLOR_RAMP_RE stops are
      // unaffected in practice — boilerplate never defines an ha-color-<role>-* key at all.
      if (key in boilerplate && boilerplate[key] === rawValue) continue;
      assignFlat(key, String(rawValue), false);
    }
    for (const mode of ['light', 'dark']) {
      const modeObj = themeObj.modes?.[mode];
      if (!modeObj) continue;
      for (const [key, value] of Object.entries(modeObj)) {
        if (typeof value !== 'string' && typeof value !== 'number') continue;
        assignFlat(key, String(value), mode === 'dark');
      }
    }

    // Promote any role with at least one ha-color-<role>-* stop out of Raw Overrides into a proper
    // "Imported" Palette Seed source — whatever the theme genuinely defines, however much of it
    // there is, not an all-11-or-nothing gate. A theme defining only some stops is a real, honest
    // partial ramp, not something to hide in Raw Overrides; Palette Seed shows it as partial and
    // (via _scaleForRolePreview) previews the missing stops against static reference data per-tone,
    // the same mechanism a role left fully "None" falls back to.
    /** @type {Object<string,Object<string,string>>} */
    const importedRamps = {};
    /** @type {Object<string,Object<string,string>>} */
    const importedRampsRaw = {};
    for (const [role, tones] of Object.entries(rampBuffer)) {
      if (!HA_PALETTE_ROLES.includes(role)) continue;
      /** @type {Object<string,string>} */
      const resolved = {};
      for (const tone of TONE_ORDER) {
        if (tone in tones) resolved[tone] = this._resolveThemeValue(tones[tone], themeObj);
      }
      importedRamps[role] = resolved;
      importedRampsRaw[role] = { ...tones };
      for (const tone of TONE_ORDER) {
        const idx = raw.findIndex(r => r.key === `ha-color-${role}-${tone}`);
        if (idx !== -1) raw.splice(idx, 1);
      }
    }

    // Reflect what actually got loaded, honestly: a role with a resolved
    // ramp switches to "Imported" (the truthful representation of what this
    // theme actually has); a role with nothing to import goes to "none"
    // rather than keeping whatever LCARdS family happened to be selected
    // before — pre-selecting a family here would misleadingly imply that
    // family is actually part of the loaded theme, when it isn't.
    /** @type {Object<string,{source: string, family?: string}>} */
    const roles = {};
    for (const role of HA_PALETTE_ROLES) {
      roles[role] = importedRamps[role] ? { source: 'imported' } : { source: 'none' };
    }

    this._model = {
      ...this._model,
      name,
      roles,
      legacy,
      domainOverrides,
      raw,
      importedRamps,
      importedRampsRaw,
    };
    // Remembered purely for _previewHex — lets Legacy/Domain/Raw swatch previews resolve any
    // leftover var(--lcars-...) override values against this theme's own colors, not the live page.
    this._importedThemeContext = themeObj;
    const rampCount = Object.keys(importedRamps).length;
    const rampNote = rampCount
      ? ` ${rampCount} palette ramp(s) imported and now active in Palette Seed.`
      : '';
    const untouchedRoles = HA_PALETTE_ROLES.filter(r => !importedRamps[r]);
    const untouchedNote = untouchedRoles.length
      ? ` ${untouchedRoles.map(r => ROLE_LABELS[r]).join(', ')} had nothing to import — still your own choice there.`
      : '';
    const skippedRgbNote = skippedRgbCount
      ? ` ${skippedRgbCount} rgb-* companion(s) recomputed automatically instead of imported.`
      : '';
    this._importFeedback = `Loaded "${name}" — ${Object.keys(legacy).length} known field(s), ${Object.keys(domainOverrides).length} domain colour(s), ${raw.length} sent to Advanced / Raw Overrides.${rampNote}${untouchedNote}${skippedRgbNote}`;
  }

  // ─── Export ─────────────────────────────────────────────────────────────

  _resolveOnValue(role, mode, tier) {
    const resolveTone = this._resolveSemanticRoleTone.bind(this);
    const resolveFillResting = (r, t) => resolveFillEntry(resolveTone, r, mode, t, 'resting');
    return resolveOnEntry(resolveTone, resolveFillResting, role, mode, tier).var;
  }

  _buildExportModel() {
    /** @type {Object<string,string>} */
    const flat = {};
    /** @type {Object<string,string>} */
    const light = {};
    /** @type {Object<string,string>} */
    const dark = {};
    const resolveTone = this._resolveSemanticRoleTone.bind(this);

    // 1. LCARdS canon palette — always inlined as literal hex (self-contained, matches paletteInjector.js convention).
    for (const family of LCARDS_FAMILIES) {
      for (const tone of TONE_ORDER) {
        flat[lcardsToneVarName(family, tone).slice(2)] = GREEN_ALERT_PALETTE[toneKey(family, Number(tone))];
      }
    }
    flat['lcards-moonlight'] = GREEN_ALERT_PALETTE['moonlight'];

    // 1b. HA palette atoms — the actual ha-color-{role}-{tone} layer Palette Seed above builds (05-95, 11 stops per
    // role). Everything else in this file (legacy fields, domain colors, ha-color-on/fill/border/surface semantic
    // tokens) only ever consumes these indirectly through _resolveTone/_scaleForRole — they never depend on the
    // atoms actually being exported, since 'family' source resolves to a self-contained --lcards-* var reference and
    // 'custom'/'imported' resolve to literal hex either way. But native HA components that read --ha-color-{role}-*
    // directly (bypassing the semantic layer entirely) need the atoms themselves in the YAML to see this theme's
    // palette at all — without this block a fully custom Palette Seed role (including a hand-built dark variant)
    // would visibly preview here but never actually reach the exported theme. Roles left at 'none' emit nothing,
    // falling back to whatever the merged-in ha-lcars boilerplate (or HA's own baseline) defines for that family.
    for (const role of HA_PALETTE_ROLES) {
      const cfg = this._model.roles[role];
      if (cfg.source === 'none') continue;
      const darkDiffers = this._roleDarkDiffers(role);
      for (const tone of TONE_ORDER) {
        // A partial "Imported" ramp (the theme genuinely only defines some stops) omits the stops
        // it doesn't have, same reasoning as a fully "None" role above — never bake the internal
        // gray placeholder in as if it were a real color.
        if (cfg.source === 'imported' && !(tone in (this._model.importedRamps[role] || {}))) continue;
        const key = `ha-color-${role}-${tone}`;
        const lightEntry = this._resolveTone(role, tone, 'light');
        flat[key] = lightEntry.var;
        if (darkDiffers) {
          const darkEntry = this._resolveTone(role, tone, 'dark');
          if (darkEntry.var !== lightEntry.var) dark[key] = darkEntry.var;
        }
      }
    }

    // 2. Legacy & lcars-ui fields. An explicit override (with or without its own dark variant) always wins outright.
    // Otherwise, if the underlying Palette Seed role genuinely differs by mode, cascade that difference through as
    // an automatic dark-mode entry — without this, a role's dark-mode family/custom palette would silently never
    // surface, since the flat value alone applies to both modes per HA's `modes.dark` layering. A field whose role
    // doesn't actually derive Legacy fields (_roleDerivesLegacyFields — "None", or "Imported" with nothing captured
    // for this specific key) and has no override is omitted entirely — HA has its own baseline default for every
    // one of these (confirmed in color.globals.ts: --primary-color, --success-color, --warning-color,
    // --error-color, etc. are all defined there), so leaving the key out lets that real default apply instead of a
    // computed stand-in. `live`/`fixed` fields have no role/tone at all — same omit-unless-overridden rule, but
    // unconditionally, since there's no Palette Seed computation to fall back to for them in the first place: the
    // exported YAML is designed to be merged into a real ha-lcars theme file that already provides these same
    // values via its own shared anchors (see `mergeKeys` below), so re-stating them here would just be redundant
    // (see LEGACY_FIELD_DEFS' own doc comment).
    for (const field of LEGACY_FIELD_DEFS) {
      const override = this._model.legacy[field.key];
      if (field.live || field.fixed) {
        if (override?.value === undefined) continue;
        flat[field.key] = override.value;
        if (override.dark !== undefined) dark[field.key] = override.dark;
        continue;
      }
      if (override?.value === undefined && !this._roleDerivesLegacyFields(field.role)) continue;
      const defaultEntry = this._resolveTone(field.role, field.tone, 'light');
      // Hoisted out of the dark-mode branching below (previously computed only lazily inside it)
      // so the RGB-companion block after can reuse the same resolved hex rather than a second
      // _resolveTone call — see RGB_COMPANION_FIELDS' own doc comment for why this is needed at all.
      const darkEntry = this._resolveTone(field.role, field.tone, 'dark');
      flat[field.key] = override?.value ?? defaultEntry.var;
      if (override?.dark !== undefined) {
        dark[field.key] = override.dark;
      } else if (override?.value === undefined && darkEntry.var !== defaultEntry.var) {
        dark[field.key] = darkEntry.var;
      }

      if (RGB_COMPANION_FIELDS.has(field.key)) {
        const lightHex = override?.value !== undefined ? this._previewHex(override.value) : defaultEntry.hex;
        flat[`rgb-${field.key}`] = hexToRgb(lightHex).join(', ');
        if (dark[field.key] !== undefined) {
          const darkHex = override?.dark !== undefined ? this._previewHex(override.dark)
            : darkEntry?.hex;
          if (darkHex) dark[`rgb-${field.key}`] = hexToRgb(darkHex).join(', ');
        }
      }
    }

    // 3. HA semantic tokens — mode-specific and computed for any role that actually has a Palette
    // Seed definition. A role left "None" is skipped entirely (both modes, on/fill/border alike) —
    // HA's own baseline semantic tokens (semantic.globals.ts, e.g. --ha-color-on-danger-normal:
    // var(--ha-color-red-40)) get inline-applied as a real fallback by apply_themes_on_element.ts
    // whenever a theme doesn't define the key itself; emitting a gray placeholder here would win
    // over that fallback by simply being present, defeating it even though nothing meaningful was
    // actually authored. Surface/form-background are neutral-role-derived, gated the same way.
    for (const mode of ['light', 'dark']) {
      const bucket = mode === 'light' ? light : dark;
      for (const role of SEMANTIC_ROLES) {
        if (this._semanticRoleUnset(role)) continue;
        for (const tier of SEMANTIC_TIERS) {
          bucket[`ha-color-on-${role}-${tier}`] = this._resolveOnValue(role, mode, tier);
        }
      }
      for (const role of SEMANTIC_ROLES) {
        if (this._semanticRoleUnset(role)) continue;
        for (const tier of SEMANTIC_TIERS) {
          const states = role === 'disabled' ? ['resting', 'hover'] : ['resting', 'hover', 'active'];
          for (const state of states) {
            bucket[`ha-color-fill-${role}-${tier}-${state}`] = resolveFillEntry(resolveTone, role, mode, tier, state).var;
          }
        }
      }
      for (const role of BORDER_ROLES) {
        if (this._semanticRoleUnset(role)) continue;
        for (const tier of SEMANTIC_TIERS) {
          bucket[`ha-color-border-${role}-${tier}`] = resolveBorderEntry(resolveTone, role, mode, tier).var;
        }
      }
      if (!this._semanticRoleUnset('neutral')) {
        for (const key of Object.keys(SURFACE[mode])) {
          const varName = key === 'on-surface-default' ? 'ha-color-on-surface-default' : `ha-color-surface-${key}`;
          bucket[varName] = resolveSurfaceEntry(resolveTone, mode, key).var;
        }
        bucket['ha-color-form-background-hover'] = resolveFormBackgroundEntry(resolveTone, mode, 'hover').var;
        bucket['ha-color-form-background-disabled'] = resolveFormBackgroundEntry(resolveTone, mode, 'disabled').var;
      }
    }

    // 4. Domain/state colors. Unset by default — a row is only written when the user explicitly overrides
    // it. HA's own real fallback chain (state_color.ts: domain+state -> domain+active/inactive -> the
    // global state-active-color/state-inactive-color fields in Legacy above) already resolves an omitted
    // key on its own, entirely in the browser, so there's nothing to compute or guess here.
    for (const [domain, states] of Object.entries(DOMAIN_STATES)) {
      for (const state of states) {
        const key = `state-${domain}-${state}-color`;
        const overrideKey = `${domain}.${state}`;
        const override = this._model.domainOverrides[overrideKey];
        if (override?.value === undefined) continue;
        flat[key] = override.value;
        if (override.dark !== undefined) dark[key] = override.dark;
      }
    }

    // 5. Raw overrides.
    for (const entry of this._model.raw) {
      if (!entry.key) continue;
      flat[entry.key] = entry.value ?? '';
      if (entry.dark !== undefined) dark[entry.key] = entry.dark;
    }

    return {
      name: this._model.name || 'My HA-LCARS Theme',
      // Every real ha-lcars theme (including the shipped Picard profiles)
      // merges these in — they carry the raw named-color palette, the HA-var
      // mapping layer, and card-mod CSS this generator doesn't reproduce
      // (sidebar chrome, fonts, table/tooltip/badge styling, etc.). Explicit
      // keys below still win over anything merged, per standard YAML `<<:`
      // merge-key semantics — this ADDS inherited defaults, never overrides
      // what's actually generated here.
      mergeKeys: ['lcars-variables', 'base', 'card-mod-css'],
      flat,
      modes: { light, dark },
    };
  }

  /**
   * Builds a Lit styleMap object from an already-computed export model, for every section that mounts
   * real HA elements (Live Component Preview, LCARS UI Chrome / real card_mod preview, Domain & State
   * Colours — Live's synthetic tile cards) — the theme's actual computed CSS custom properties for the
   * given mode, layered exactly like apply_themes_on_element.ts does it (flat first, mode-specific
   * overrides on top), plus _buildLegacyDefaultStyle/_buildDomainDefaultStyle filling in whatever's
   * unset (so real elements never fall through to this browser tab's actual active theme instead —
   * see those methods' own doc comments) and the static WA_COLOR_ALIAS_VARS indirection layer (see
   * that constant's own doc comment for why it's needed). Real HA elements nested inside a
   * wrapper carrying this style pick these up through completely normal CSS custom-property
   * inheritance — no JS theme-application call, no mutation of document.documentElement or
   * hass.themes, nothing outside the wrapper is affected.
   *
   * Also seeds a baseline from HA_LCARS_THEME_LIBRARY.boilerplate — the raw ~180-entry named
   * palette and ~80-entry HA-var mapping every real ha-lcars theme merges in via
   * &lcars-variables/&base. This generator's own export deliberately never reproduces that layer
   * (mergeKeys relies on the user's real themes.yaml already having it) — but a portable var()
   * value captured from an imported theme (e.g. a Legacy override like lcars-card-top-color:
   * var(--lcars-alt-dark-gray)) references it directly. Without this baseline those references
   * are genuinely undefined in this wrapper (not "wrong", just missing), and since background-color
   * isn't an inherited property, an unresolved var() falls through to transparent — which is
   * exactly the "everything went gray/washed out" bug this fixes: what showed through was this
   * generator's own preview-box background, not the theme failing to apply.
   */
  _buildLiveVarStyle(exportModel, mode) {
    /** @type {Object<string,string>} */
    const styles = {};
    for (const [key, value] of Object.entries(HA_LCARS_THEME_LIBRARY.boilerplate)) {
      if (typeof value === 'string') styles[`--${key}`] = value;
    }
    Object.assign(styles, this._buildLegacyDefaultStyle(mode));
    Object.assign(styles, this._buildDomainDefaultStyle());
    const merged = { ...exportModel.flat, ...(exportModel.modes[mode] || {}) };
    for (const [key, value] of Object.entries(merged)) {
      if (!value) continue;
      styles[`--${key}`] = value;
    }
    return { ...styles, ...WA_COLOR_ALIAS_VARS };
  }

  /**
   * Every LEGACY_FIELD_DEFS field NOT already covered by HA_LCARS_THEME_LIBRARY.boilerplate or the
   * export model's own flat/modes (i.e. `fixed`/`live`/role-unset fields with no override — the exact
   * set _renderLegacyField shows a static-default badge for) gets its current preview value set here
   * too. Without this, _buildLiveVarStyle's inline style simply never mentions these vars at all, so
   * the real mounted ha-card/hui-card components in LCARS UI Chrome / Live Component Preview inherit
   * them from the actual page ancestor chain instead — i.e. whatever theme is genuinely active in this
   * browser tab, not this draft's own chosen/default colours. A field whose role genuinely derives it
   * (_roleDerivesLegacyFields — "family"/"custom") is deliberately skipped: its real computed value is
   * already in exportModel.flat, which is layered on top of this in _buildLiveVarStyle and must win.
   * Uses `.var` (a portable reference, e.g. var(--lcars-almond-creme)) rather than a pre-resolved hex —
   * the real CSS cascade resolves it natively against the boilerplate spread above (the raw named
   * palette a reference like that points into), no JS resolution needed.
   */
  _buildLegacyDefaultStyle(mode) {
    /** @type {Object<string,string>} */
    const styles = {};
    for (const field of LEGACY_FIELD_DEFS) {
      const override = this._model.legacy[field.key];
      if (override?.value !== undefined) continue;
      if (!field.fixed && !field.live && this._roleDerivesLegacyFields(field.role)) continue;
      styles[`--${field.key}`] = field.fixed
        ? ((mode === 'dark' && field.fixedDark) ? field.fixedDark : field.fixed)
        : this._legacyFieldDefault(field).var;
    }
    return styles;
  }

  /**
   * Same gap-filling as _buildLegacyDefaultStyle, for Domain & State Colours — Live's synthetic tile
   * cards (_renderDomainDemoPreview): a domain/state with no override is otherwise absent from
   * exportModel.flat entirely (by design — HA's real fallback should apply once actually deployed),
   * so the real, live-mounted <hui-card> for it would inherit --state-<domain>-<state>-color from
   * this browser tab's actual active theme instead of this draft's chosen/default colour. Only needs
   * DOMAIN_DEMO_ENTITIES' own roster, not the full DOMAIN_STATES — nothing else is rendered here.
   */
  _buildDomainDefaultStyle() {
    /** @type {Object<string,string>} */
    const styles = {};
    for (const { domain, state } of DOMAIN_DEMO_ENTITIES) {
      const overrideKey = `${domain}.${state}`;
      if (this._model.domainOverrides[overrideKey]?.value !== undefined) continue;
      styles[`--state-${domain}-${state}-color`] = this._liveDomainStateDefault(domain, state).var;
    }
    return styles;
  }

  /**
   * Synthetic hass clone for the Domain & State Colours — Live preview: one fake entity per
   * DOMAIN_DEMO_ENTITIES domain, injected into a shallow-cloned `states`. Never written back to
   * `this.hass` — scoped entirely to the demo <hui-tile-card> wrappers this feeds. Deliberately
   * omits device_class (would short-circuit HA's stateColorCss() fallback chain onto a more
   * specific var this generator doesn't produce) and rgb_color on the light entity specifically
   * (hui-tile-card computes light colour via JS rgb2hsv/hsv2rgb math when present, bypassing CSS
   * vars entirely) — confirmed against HA frontend source (state_color.ts, hui-tile-card.ts).
   * Memoized on `this.hass` reference identity; recomputes (a full shallow copy of hass.states) on
   * every hass change while the Theme Lab is open, same accepted per-tick cost category as the
   * existing card_mod loop's applyHassToCard calls, just extended to a bigger object.
   */
  _buildDemoHass() {
    if (!this.hass) return this.hass;
    if (this._demoHassSourceHass === this.hass) return this._demoHassCache;
    const states = { ...this.hass.states };
    for (const { domain, state } of DOMAIN_DEMO_ENTITIES) {
      const entityId = `${domain}.lcards_theme_lab_demo`;
      states[entityId] = {
        entity_id: entityId,
        state,
        attributes: { friendly_name: `Demo ${domain.replace(/_/g, ' ')}` },
        last_changed: '', last_updated: '',
        context: { id: 'lcards-preview', parent_id: null, user_id: null },
      };
    }
    this._demoHassSourceHass = this.hass;
    this._demoHassCache = { ...this.hass, states };
    return this._demoHassCache;
  }

  async _handleCopyYaml() {
    const yamlText = formatThemeYaml(this._buildExportModel());
    const success = await copyTextToClipboard(yamlText);
    this._copyFeedback = success;
    if (success) {
      setTimeout(() => { this._copyFeedback = false; }, 2000);
    }
  }
}

if (!customElements.get('lcards-theme-generator-view')) {
  customElements.define('lcards-theme-generator-view', LCARdSThemeGeneratorView);
}
