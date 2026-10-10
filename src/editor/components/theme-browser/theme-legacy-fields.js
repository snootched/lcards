/**
 * @fileoverview HA legacy / HA-LCARS colour field catalog (LEGACY_FIELD_DEFS).
 *
 * Split out of lcards-theme-generator-view.js so the theme token browser can use
 * the catalog without pulling in the generator view (CodeMirror and the bundled
 * HA-LCARS theme YAML), which now loads only when the generator is opened.
 */

/**
 * Every color-valued field this generator gives dedicated UI to — HA's
 * legacy semantic vars (`doc/development/ha-css-vars.md` Layer 3) plus
 * HA-LCARS's full `lcars-ui-*`/card/sidebar/tooltip semantic layer
 * (`ha-lcars/src/defaults.yaml` + `&base` in `preamble.yaml` — audited
 * directly against both source files, not just this repo's own catalog).
 * Numeric/non-color base vars (ripple opacities, header font-size, etc.)
 * aren't here — those are a plain-text job, see Advanced / Raw Overrides.
 * `role`/`tone` pairs are looked up against whichever family the user
 * assigned to that palette role in "Palette Seed". `live: true` fields skip
 * that Palette Seed derivation entirely: their unset default is always
 * _staticHaDefault(field.key)'s real answer (HA-LCARS's own shared anchor,
 * or HA core's own baseline) for that exact key, looked up fresh
 * every time rather than a value hand-transcribed into this array — since
 * these fields were never Palette-Seed-derived design tokens to begin with,
 * there's nothing to gain by baking a snapshot of their real value in here.
 * Omitted from export unless the user explicitly overrides one: the
 * exported YAML is designed to be merged into a real HA-LCARS theme file
 * (see `mergeKeys` in _buildExportModel) that already provides these same
 * values via its own shared anchors, so re-stating them would be redundant.
 * `fixed`/`fixedDark` (a literal, hand-computed value) is reserved for the
 * rare field whose real definition genuinely can't be expressed as a simple
 * key lookup — currently only `lcars-secondary-text`, see its own comment.
 */
// Small string templates so the ~40 LEGACY_FIELD_DEFS entries that are mechanical variants of
// another field in this same array (a -text/icon counterpart, a badge/alert colour-name variant)
// don't need fully hand-authored description prose — see each entry's `description` below.
const textOn = (bgLabel) => `Text colour rendered on top of ${bgLabel}.`;
const iconOn = (bgLabel) => `Icon colour rendered on top of ${bgLabel}.`;
const alertVariant = (colourName) => `Indicator colour HA-LCARS switches --lcars-alert-color to during a ${colourName} alert.`;
const labelBadgeVariant = (colourName) => `Background colour for a ${colourName}-variant ha-label-badge.`;

export const LEGACY_FIELD_DEFS = [
  // ── Core ──
  { key: 'primary-color', label: 'Primary Colour', group: 'Core', role: 'primary', tone: 40, description: "HA's own accent colour: buttons, active toggles, selected tabs, and focus rings across stock HA UI." },
  { key: 'accent-color', label: 'Accent Colour', group: 'Core', role: 'primary', tone: 40, description: 'A secondary accent used alongside Primary Colour for less prominent highlights in stock HA components.' },
  { key: 'primary-background-color', label: 'Primary Background', group: 'Core', live: true, description: 'The base page background behind every card and panel.' },
  { key: 'secondary-background-color', label: 'Secondary Background', group: 'Core', role: 'neutral', tone: 20, description: 'Background for secondary surfaces: dialogs, list rows, form fields.' },
  { key: 'card-background-color', label: 'Card Background', group: 'Core', role: 'neutral', tone: 20, description: 'Background colour of ha-card and every Lovelace card by default.' },
  { key: 'lcars-background-color', label: 'LCARS Background', group: 'Core', live: true, description: "HA-LCARS's own page background, layered under Primary Background for the LCARS look." },
  // HA-LCARS's own default is transparent; exposed so a user can opt into a visible divider.
  // Consumer confirmed live in 174 files across HA's frontend, not vestigial.
  { key: 'divider-color', label: 'Divider', group: 'Core', live: true, description: "Colour of divider lines between list items and sections (HA-LCARS's own default is transparent)." },

  // ── Text ──
  { key: 'primary-text-color', label: 'Primary Text', group: 'Text', live: true, description: 'Default text colour used almost everywhere in stock HA UI.' },
  { key: 'secondary-text-color', label: 'Secondary Text', group: 'Text', live: true, description: 'Muted/secondary text: captions, helper text, timestamps.' },
  { key: 'text-primary-color', label: 'Text on Primary Background', group: 'Text', live: true, description: 'Text/icon colour placed on surfaces coloured with Primary Colour (e.g. filled buttons).' },
  { key: 'text-accent-color', label: 'Text on Accent Background', group: 'Text', live: true, description: 'Text/icon colour placed on surfaces coloured with Accent Colour.' },
  { key: 'disabled-text-color', label: 'Disabled Text', group: 'Text', live: true, description: 'Text colour for disabled controls and unavailable entities.' },
  { key: 'lcars-primary-text', label: 'LCARS Primary Text', group: 'Text', live: true, description: "Default LCARS-styled text colour, layered under HA's own Primary Text." },
  // The one field that can't be a plain `live` key lookup: its real definition is
  // color-mix(in oklch, var(--lcars-primary-text) 80%, var(--lcars-ui-mix-color)), and
  // lcars-ui-mix-color only exists inside HA-LCARS's modes.light/modes.dark blocks (black light /
  // white dark), not the flat layer _staticHaDefault's var()-substitution walks — so a plain
  // _staticHaDefault('lcars-secondary-text') lookup can't fully resolve it. Hand-computed once via
  // this generator's own lerpOklch (matches computeHaDefaultScale's math) instead of relying on the
  // picker's own CSS color-mix() support, which would only resolve correctly in a runtime that
  // actually implements `in oklch` interpolation, silently falling back to gray otherwise.
  { key: 'lcars-secondary-text', label: 'LCARS Secondary Text', group: 'Text', fixed: '#bebebe', fixedDark: '#ffffff', description: 'A dimmer LCARS text tone, derived from LCARS Primary Text for less prominent labels.' },
  { key: 'lcars-background-text', label: 'LCARS Background Text', group: 'Text', live: true, description: textOn('LCARS Background') },

  // ── Status Colours (alerts, badges, energy) ── the 5 state-*-color entity-state fallback fields
  // below are tagged with this same group for data/export purposes, but render in the Domain &
  // State Colours section instead (see DOMAIN_FALLBACK_KEYS) — they're this chain's real starting
  // point, not a generic "status" colour.
  { key: 'success-color', label: 'Success', group: 'Status Colours', role: 'green', tone: 40, description: 'Colour for success alerts, badges, and positive indicators across stock HA UI.' },
  { key: 'warning-color', label: 'Warning', group: 'Status Colours', role: 'orange', tone: 40, description: 'Colour for warning alerts and caution indicators.' },
  { key: 'error-color', label: 'Error', group: 'Status Colours', role: 'red', tone: 40, description: 'Colour for error alerts and failure indicators.' },
  { key: 'info-color', label: 'Info', group: 'Status Colours', role: 'primary', tone: 40, description: 'Colour for informational alerts and neutral notices.' },
  { key: 'state-active-color', label: 'State: Active', group: 'Status Colours', live: true, description: "Global Fallback: an entity icon's colour for any 'active' state with no more specific var set (see Domain & State Colours)." },
  { key: 'state-inactive-color', label: 'State: Inactive', group: 'Status Colours', live: true, description: "Global Fallback: an entity icon's colour for any 'inactive' state with no more specific var set." },
  { key: 'state-unavailable-color', label: 'State: Unavailable', group: 'Status Colours', live: true, description: 'Icon colour for an entity whose state is unavailable.' },
  { key: 'state-unknown-color', label: 'State: Unknown', group: 'Status Colours', live: true, description: 'Icon colour for an entity whose state is unknown.' },
  { key: 'state-color', label: 'State: Default Icon', group: 'Status Colours', live: true, description: 'Default icon colour for domains/states with no active/inactive distinction at all.' },
  // Label badges (ha-label-badge.ts/ha-state-label-badge.ts) and the energy dashboard's
  // non-fossil indicator (hui-energy-distribution-card.ts) — all confirmed live consumers, not
  // just present in HA-LCARS's own boilerplate. Red/yellow/green mirror error/warning/success's
  // own role choice; no dedicated Blue Palette Seed role exists, so blue mirrors info-color's;
  // grey mirrors state-inactive-color's neutral/60.
  { key: 'label-badge-text-color', label: 'Label Badge Text', group: 'Status Colours', live: true, description: 'Text colour shown on every ha-label-badge, regardless of its background variant.' },
  { key: 'label-badge-red', label: 'Label Badge: Red', group: 'Status Colours', role: 'red', tone: 40, description: labelBadgeVariant('red') },
  { key: 'label-badge-yellow', label: 'Label Badge: Yellow', group: 'Status Colours', role: 'orange', tone: 40, description: labelBadgeVariant('yellow') },
  { key: 'label-badge-blue', label: 'Label Badge: Blue', group: 'Status Colours', role: 'primary', tone: 40, description: labelBadgeVariant('blue') },
  { key: 'label-badge-green', label: 'Label Badge: Green', group: 'Status Colours', role: 'green', tone: 40, description: labelBadgeVariant('green') },
  { key: 'label-badge-grey', label: 'Label Badge: Grey', group: 'Status Colours', role: 'neutral', tone: 60, description: labelBadgeVariant('grey') },
  { key: 'energy-non-fossil-color', label: 'Energy: Non-Fossil', group: 'Status Colours', role: 'green', tone: 40, description: "Colour for the non-fossil energy indicator on the Energy dashboard's distribution card." },

  // ── LCARS UI ──
  { key: 'lcars-ui-primary', label: 'LCARS UI Primary', group: 'LCARS UI', role: 'primary', tone: 40, description: "The boldest of HA-LCARS's 4 UI colour tiers: the most prominent chrome elements (see UI Colour Tiers preview)." },
  { key: 'lcars-ui-primary-text', label: 'LCARS UI Primary Text', group: 'LCARS UI', live: true, description: textOn('LCARS UI Primary') },
  { key: 'lcars-ui-secondary', label: 'LCARS UI Secondary', group: 'LCARS UI', role: 'neutral', tone: 60, description: "The second of HA-LCARS's 4 UI colour tiers." },
  { key: 'lcars-ui-secondary-text', label: 'LCARS UI Secondary Text', group: 'LCARS UI', live: true, description: textOn('LCARS UI Secondary') },
  { key: 'lcars-ui-tertiary', label: 'LCARS UI Tertiary', group: 'LCARS UI', role: 'primary', tone: 40, description: "The third of HA-LCARS's 4 UI colour tiers." },
  { key: 'lcars-ui-tertiary-text', label: 'LCARS UI Tertiary Text', group: 'LCARS UI', live: true, description: textOn('LCARS UI Tertiary') },
  { key: 'lcars-ui-quaternary', label: 'LCARS UI Quaternary', group: 'LCARS UI', role: 'neutral', tone: 20, description: "The most muted of HA-LCARS's 4 UI colour tiers." },
  { key: 'lcars-ui-quaternary-text', label: 'LCARS UI Quaternary Text', group: 'LCARS UI', role: 'neutral', tone: 90, description: textOn('LCARS UI Quaternary') },
  { key: 'lcars-ui-accent-color', label: 'LCARS UI Accent', group: 'LCARS UI', role: 'primary', tone: 40, description: 'A dedicated accent tier, separate from the primary/secondary/tertiary/quaternary stack, for standout chrome elements.' },
  { key: 'lcars-ui-accent-text', label: 'LCARS UI Accent Text', group: 'LCARS UI', live: true, description: textOn('LCARS UI Accent') },
  { key: 'lcars-ui-text-heading', label: 'LCARS UI Heading Text', group: 'LCARS UI', role: 'neutral', tone: 90, description: 'Heading text colour for LCARS-styled panels and section titles.' },
  { key: 'lcars-ui-app-header-background-color', label: 'App Header Background', group: 'LCARS UI', role: 'primary', tone: 40, description: "Background colour of HA's top app header bar." },
  { key: 'lcars-ui-app-header-text-color', label: 'App Header Text', group: 'LCARS UI', live: true, description: textOn('App Header Background') },
  { key: 'lcars-ui-app-header-clock', label: 'App Header Clock', group: 'LCARS UI', role: 'neutral', tone: 90, description: 'Colour of the clock shown in the app header, if enabled.' },
  { key: 'lcars-ui-config-button', label: 'Config Button', group: 'LCARS UI', role: 'primary', tone: 40, description: 'Background colour of the settings/config button chip.' },
  { key: 'lcars-ui-config-icon', label: 'Config Icon', group: 'LCARS UI', live: true, description: iconOn('Config Button') },

  // ── Cards ──
  { key: 'lcars-card-top-color', label: 'Card Top', group: 'Cards', role: 'primary', tone: 40, description: "Top band colour for HA-LCARS's card_mod card styling (header-*/top card_mod classes)." },
  { key: 'lcars-card-top-text', label: 'Card Top Text', group: 'Cards', live: true, description: textOn('Card Top') },
  { key: 'lcars-card-mid-color', label: 'Card Middle', group: 'Cards', role: 'neutral', tone: 60, description: "Middle band colour for HA-LCARS's card_mod card styling (middle-* card_mod classes)." },
  { key: 'lcars-card-mid-text', label: 'Card Middle Text', group: 'Cards', live: true, description: textOn('Card Middle') },
  { key: 'lcars-card-button-color', label: 'Card Button', group: 'Cards', role: 'primary', tone: 40, description: "Colour for HA-LCARS's card_mod button classes (button-small/-large/-lozenge/-bullet)." },
  { key: 'lcars-card-button-text', label: 'Card Button Text', group: 'Cards', live: true, description: textOn('Card Button') },
  { key: 'lcars-card-bottom-color', label: 'Card Bottom', group: 'Cards', role: 'neutral', tone: 60, description: "Bottom band colour for HA-LCARS's card_mod card styling (footer-*/bottom card_mod classes)." },
  { key: 'lcars-card-bottom-text', label: 'Card Bottom Text', group: 'Cards', live: true, description: textOn('Card Bottom') },
  { key: 'lcars-settings-card-color', label: 'Settings Card', group: 'Cards', role: 'neutral', tone: 60, description: "Background colour for HA-LCARS's settings-card card_mod class." },
  { key: 'lcars-settings-card-text', label: 'Settings Card Text', group: 'Cards', role: 'neutral', tone: 90, description: textOn('Settings Card') },
  // MDC-themed inputs/selects still used throughout HA (ha-alert.ts, ha-radio-list-item.ts,
  // ha-check-list-item.ts, entity pickers, …) despite HA moving new components away from MWC —
  // confirmed live (23/3/2/3 consumer files respectively), not vestigial, before adding these.
  { key: 'mdc-theme-primary', label: 'MDC Theme Primary', group: 'Cards', role: 'neutral', tone: 90, description: 'Primary colour for legacy Material (MWC) components still used in HA: dialogs, radio/checkbox lists, entity pickers.' },
  { key: 'mdc-theme-secondary', label: 'MDC Theme Secondary', group: 'Cards', role: 'neutral', tone: 90, description: 'Secondary colour for the same legacy Material components.' },
  { key: 'mdc-theme-on-primary', label: 'MDC Theme On Primary', group: 'Cards', live: true, description: textOn('MDC Theme Primary') },
  { key: 'mdc-theme-on-secondary', label: 'MDC Theme On Secondary', group: 'Cards', live: true, description: textOn('MDC Theme Secondary') },
  { key: 'control-circular-slider-background', label: 'Thermostat Slider Background', group: 'Cards', role: 'neutral', tone: 20, description: 'Track background colour for the circular thermostat/climate slider control.' },

  // ── Sidebar ──
  { key: 'lcars-sidebar-background', label: 'Sidebar Background', group: 'Sidebar', live: true, description: 'Background colour of the HA sidebar navigation panel.' },
  { key: 'lcars-sidebar-text', label: 'Sidebar Text', group: 'Sidebar', role: 'neutral', tone: 90, description: 'Heading/label text colour in the sidebar, distinct from individual item text.' },
  { key: 'lcars-sidebar-icon-color', label: 'Sidebar Icon', group: 'Sidebar', role: 'neutral', tone: 90, description: 'Icon colour for unselected sidebar navigation items.' },
  { key: 'lcars-sidebar-icon-background', label: 'Sidebar Icon Background', group: 'Sidebar', role: 'neutral', tone: 20, description: "Background chip colour behind each sidebar item's icon." },
  { key: 'lcars-sidebar-item-color', label: 'Sidebar Item', group: 'Sidebar', role: 'neutral', tone: 90, description: 'Text colour for unselected sidebar navigation items.' },
  { key: 'lcars-sidebar-selected-color', label: 'Sidebar Selected', group: 'Sidebar', role: 'primary', tone: 40, description: 'Colour used for the currently-selected sidebar item (icon and text).' },
  { key: 'lcars-sidebar-notification-color', label: 'Sidebar Notification', group: 'Sidebar', role: 'red', tone: 40, description: 'Background colour for the notification-count badge on sidebar items.' },

  // ── Tooltip & Misc ──
  { key: 'lcars-tooltip-background', label: 'Tooltip Background', group: 'Tooltip & Misc', role: 'neutral', tone: 60, description: "Background colour of HA's hover tooltips (e.g. an entity's more-info tooltip)." },
  { key: 'lcars-tooltip-text', label: 'Tooltip Text', group: 'Tooltip & Misc', live: true, description: textOn('Tooltip Background') },
  { key: 'lcars-ripple-color', label: 'Ripple Effect', group: 'Tooltip & Misc', role: 'primary', tone: 40, description: 'Tint colour for the press/hover ripple effect on interactive HA-LCARS elements.' },
  // input-dropdown-icon-color (ha-form-multi_select.ts) and ha-outlined-field-container-color
  // (ha-outlined-field.ts — the newer, post-MWC input component family, actively current) and
  // markdown-code-text-color (ha-markdown.ts, ha-assist-chat.ts) all confirmed live consumers.
  // more-info-header-background and mini-media-player-base/icon-color were deliberately left out
  // here — verified against the real frontend checkout, not just HA-LCARS's own boilerplate:
  // more-info-header-background has zero consumers anywhere in current HA frontend, and
  // mini-media-player-* belongs to a third-party HACS card, not HA core.
  { key: 'input-dropdown-icon-color', label: 'Input Dropdown Icon', group: 'Tooltip & Misc', role: 'neutral', tone: 90, description: 'Dropdown-arrow icon colour on multi-select form fields.' },
  { key: 'ha-outlined-field-container-color', label: 'Outlined Field Container', group: 'Tooltip & Misc', role: 'neutral', tone: 90, description: "Border/container colour for HA's newer outlined text-field component." },
  { key: 'markdown-code-text-color', label: 'Markdown Code Text', group: 'Tooltip & Misc', live: true, description: 'Text colour for inline code blocks rendered inside markdown cards and the assist chat.' },
  { key: 'code-editor-background-color', label: 'Code Editor Background', group: 'Tooltip & Misc', live: true, description: "Background colour of HA's built-in YAML/code editor." },

  // ── Alert Colours ── HA-LCARS's alert-mode indicator palette (preamble.yaml's alert-state CSS
  // switches lcars-alert-color between these at runtime); confirmed against the shared
  // &lcars-variables anchor (ha-lcars-all-themes.yaml) that -red/-yellow/-blue/-white/-uv/-uvc have
  // real boilerplate defaults there (e.g. lcars-alert-red: var(--lcars-crimson)). lcars-alert-color
  // itself has no default anywhere in HA-LCARS — not the shared anchor, not any bundled alert-variant
  // theme, which each hardcode a literal colour instead of deriving one — so live:true lets it
  // honestly show no default rather than inventing a role/tone convention nothing else supports.
  { key: 'lcars-alert-color', label: 'Alert (current)', group: 'Alert Colours', live: true, description: 'The currently-active alert indicator colour. HA-LCARS switches this between the variants below at runtime.' },
  { key: 'lcars-alert-red', label: 'Alert: Red', group: 'Alert Colours', live: true, description: alertVariant('Red') },
  { key: 'lcars-alert-yellow', label: 'Alert: Yellow', group: 'Alert Colours', live: true, description: alertVariant('Yellow') },
  { key: 'lcars-alert-blue', label: 'Alert: Blue', group: 'Alert Colours', live: true, description: alertVariant('Blue') },
  { key: 'lcars-alert-white', label: 'Alert: White', group: 'Alert Colours', live: true, description: alertVariant('White') },
  { key: 'lcars-alert-uv', label: 'Alert: UV', group: 'Alert Colours', live: true, description: alertVariant('UV') },
  { key: 'lcars-alert-uvc', label: 'Alert: UVC', group: 'Alert Colours', live: true, description: alertVariant('UVC') },
];
