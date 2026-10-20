var _r=Object.defineProperty;var k=(b,r)=>_r(b,"name",{value:r,configurable:true});import{i as xr,a as yr,b as l,bn as y,bv as I,bw as J,bx as Q,l as Z,by as W,bz as H,bA as j,bB as E,bC as C,A as g,a8 as Sr,bD as Ar,bE as P,bF as L,bG as nr,bH as or,bI as cr,bJ as lr,bK as ir,bL as Cr,bo as Y,bp as F,bq as sr,bM as dr,bN as hr,bO as ur,bP as q,bQ as pr,bR as $r,z as Rr,bS as gr}from"./lcards-main-C10Twmlb.js";import{y as fr,o as M}from"./lcards-yaml-editor-kz8qT51r.js";import{e as Tr,i as Lr,s as Dr,r as zr}from"./lcards-message-BMG6miXA.js";import{L as A,r as Hr}from"./lcards-config-panel-BEDk_MEv.js";import{f as Er}from"./lcards-form-section-DSoN9OMH.js";const Fr=`# Vendored, verbatim copy of ha-lcars/themes/lcars.yaml — every theme
# ha-lcars ships, self-contained (its &lcars-variables/&base/&card-mod-css
# anchors are defined earlier in this same file). Regenerate with
# \`npm run lcars:export-all-themes\` after \`npm run lcars:generate-themes\`.
# Consumed by src/editor/components/theme-browser/lcards-theme-generator-view.js
# via a build-time Vite \`?raw\` import — do not hand-edit.
# LCARS Theme
# Color codes and font choice from https://www.thelcars.com
#     --thanks Jim Robertus!
# Custom themes can be created down at the bottom of this
# file. Or, search for "THEME DEFINITIONS", which will take
# you right there.

# ======================================================= #
#                     LCARS VARIABLES                     #
# ======================================================= #
(DO NOT USE/MODIFY)=== LCARS variables: &lcars-variables
  lcars-space-white: "#f5f6fa"
  lcars-violet-creme: "#ddbbff"
  lcars-green: "#33cc99"
  lcars-magenta: "#cc4499"
  lcars-blue: "#4455ff"
  lcars-yellow: "#ffcc33"
  lcars-violet: "#9944ff"
  lcars-orange: "#ff7700"
  lcars-african-violet: "#cc88ff"
  lcars-text-purple: "#cc77ff"
  lcars-red: "#dd4444"
  lcars-almond: "#ffaa90"
  lcars-almond-creme: "#ffbbaa"
  lcars-sunflower: "#ffcc66"
  lcars-bluey: "#7788ff"
  lcars-gray: "#666688"
  lcars-sky: "#aaaaff"
  lcars-ice: "#88ccff"
  lcars-gold: "#ffaa00"
  lcars-mars: "#ff2200"
  lcars-peach: "#ff8866"
  lcars-butterscotch: "#ff9966"
  lcars-tomato: "#ff5555"
  lcars-lilac: "#cc33ff"
  lcars-evening: "#2255ff"
  lcars-midnight: "#1111ee"
  lcars-ghost: "#88bbff"
  lcars-wheat: "#ccaa88"
  lcars-roseblush: "#cc6666"
  lcars-honey: "#ffcc99"
  lcars-cardinal: "#cc2233"
  lcars-pumpkinshade: "#ff7744"
  lcars-darkpumpkin: "#91550b"
  lcars-tangerine: "#ff8833"
  lcars-martian: "#99dd66"
  lcars-text-blue: "#2266ff"
  lcars-moonbeam: "#ccdeff"
  lcars-cool: "#5588ff"
  lcars-galaxy: "#444a77"
  lcars-moonshine: "#ddeeff"
  lcars-october-sunset: "#ff4400"
  lcars-harvestgold: "#ffaa44"
  lcars-butter: "#ffeecc"
  lcars-steel-blue: "#5588ee" # lcars-c43
  lcars-aqua: "#88ffff" # lcars-c44
  lcars-deep-navy: "#344470" # lcars-c45
  lcars-slate: "#455580" # lcars-c46
  lcars-periwinkle: "#7799dd" # lcars-c47
  lcars-sky-blue: "#66ccff" # lcars-c48
  lcars-powder-blue: "#99ccff" # lcars-c49
  lcars-vermilion: "#ff3500" # lcars-c50
  lcars-plum: "#552255" # lcars-c51
  lcars-eggplant: "#663366" # lcars-c52
  lcars-mauve: "#774477" # lcars-c53
  lcars-orchid: "#885588" # lcars-c54
  lcars-lavender-rose: "#996699" # lcars-c55
  lcars-yam: "#ff8800" # lcars-c56
  lcars-taupe: "#d0b0a0" # lcars-c57
  lcars-periwinkle-light: "#bbbbff" # lcars-c58
  lcars-sage: "#99aa66" # lcars-c59
  lcars-emerald: "#00bb00" # lcars-c60
  lcars-lime: "#33ff33" # lcars-c61
  lcars-mint: "#ddffdd" # lcars-c62
  lcars-peach-light: "#ffebde" # lcars-c63
  lcars-lilac-light: "#cc99cc" # lcars-c64
  lcars-lavender-mist: "#f6eef6" # lcars-c65
  lcars-plum-medium: "#aa66aa" # lcars-c66
  lcars-orchid-light: "#dd88dd" # lcars-c67
  lcars-scarlet: "#ff0000" # lcars-c68
  lcars-crimson: "#cc0000" # lcars-c69
  lcars-ruby: "#ee0000" # lcars-c70
  lcars-silver: "#dfdfdf" # lcars-c71
  lcars-pearl: "#f7f7f7" # lcars-c72

  # LCARS Modern Theme Colors
  lcars-modern-light-gray: "#9996BA"

  # LCARS Transporter Theme Colors
  lcars-navy-gray: "#2C374B" # lcars-c73
  lcars-slate-gray: "#6E748C" # lcars-c74
  lcars-teal: "#2A7092" # lcars-c75
  lcars-coral: "#FA6851" # lcars-c76
  lcars-charcoal: "#51596C" # lcars-c77

  # LCARS Navigation Theme Colors
  lcars-olive: "#827A53" # lcars-c79
  lcars-sand: "#CDB972" # lcars-c80
  lcars-lemon: "#F7EE51" # lcars-c81
  lcars-cornflower: "#6499FF" # lcars-c82
  lcars-khaki-dark: "#B8A666" # lcars-c83

  # LCARS Picard S1 Colors
  lcars-dunkelgrau: "#30374AFF"
  lcars-mittelgrau: "#656B83FF"
  lcars-hellgrau: "#9FA5BDFF"
  lcars-feuerrot: "#E7432AFF"
  lcars-mango: "#E5960C"
  lcars-turquoise: "#6efaf9" # lcars-c84
  lcars-beige: "#e2c599" # lcars-c85
  lcars-cerulean: "#21bece" # lcars-c86
  lcars-midnight-blue: "#012556" # lcars-c87
  lcars-seafoam: "#d6f6f1" # lcars-c88
  lcars-apricot: "#e1915c" # lcars-c89

  # Additional Colors
  lcars-lavender: "#cc88ff"
  lcars-error: "#ff2200"
  # Grayscale text scale, perceptually spaced (CIE L*).
  # Use these for text on backgrounds: pick the darkest step (on dark bg) or
  # lightest step (on light bg) that still clears the WCAG ratio you need.
  # Ordered black -> white. The existing dark/gray/light anchors are preserved.
  lcars-text-dark: "#000000" # L*=0  — pure black, max contrast
  lcars-text-coal: "#292929" # L*=17 — near-black, softens stark black on bright surfaces
  lcars-text-smoke: "#4E4E4E" # L*=33 — dark gray
  lcars-text-stone: "#777777" # L*=50 — mid gray
  lcars-text-mist: "#A2A2A2" # L*=67 — light-mid gray
  lcars-text-gray: "#d3d3d3" # L*=84 — light gray (off-white), softens stark white on dark surfaces
  lcars-text-light: "#FFFFFF" # L*=100 — pure white, max contrast
  lcars-medium-gray: "#B6B6C1"
  lcars-dark-gray: "#3e3e3e"
  lcars-khaki: "#ffe399"
  lcars-cardassia-maroon: "#4f1a23"
  lcars-dark-red: "#360000"
  lcars-green-primary: "#288855"
  lcars-green-secondary: "#229a6c"
  lcars-green-tertiary: "#88de90"
  lcars-green-middle: "#0f5616"
  lcars-green-footer: "#37bd76"
  # LCARS 25C
  lcars-alt-dark-gray: "#2f3749"
  lcars-medium-dark-gray: "#52596e"
  lcars-primary-gray: "#6d748c"
  lcars-light-gray: "#9ea5ba"
  lcars-ghost-gray: "#d2d5df"
  lcars-starlight: "#f3f4f7"
  lcars-cyan: "#0ee"
  lcars-alt-orange: "#e7442a"
  lcars-light-orange: "#ff6753"
  lcars-pale-orange: "#ff977b"
  lcars-alt-blue: "#37a6d1"
  lcars-medium-dark-blue: "#2a7193"
  lcars-dark-blue: "#1c3c55"
  lcars-alt-green: "#2B9032"
  lcars-black-cherry: "#8c6d7c"
  lcars-font-color: "#828ba6"

  lcars-alert-red: var(--lcars-crimson)
  lcars-alert-yellow: var(--lcars-gold)
  lcars-alert-blue: var(--lcars-text-blue)
  lcars-alert-white: var(--lcars-silver)
  lcars-alert-uv: "#000080"
  lcars-alert-uvc: "#68fffa"

  # General
  lcars-black: "#000000"
  lcars-graphite: "#555555"

  # TNG Theme Colors
  lcars-wheat-light: "#f5deb3"
  lcars-peach-cream: "#f5cd9f"
  lcars-tan: "#d2b48c"
  lcars-antique-gold: "#c5b358"
  lcars-warm-gold: "#efc861"
  lcars-amber: "#ffbb33"
  lcars-khaki-light: "#f0e68c"
  lcars-vivid-crimson: "#dc143c"
  lcars-maroon: "#8b0000"

  # Lower Decks II Colors
  lcars-vanilla: "#fff5c7"

  # Kronos Colors
  lcars-deep-maroon: "#930a00"

  # Red Alert Colors
  lcars-brick-red: "#bf1b1b"
  lcars-mahogany: "#9d361e"
  lcars-muted-coral: "#d66a60"
  lcars-sienna: "#91311c"

  # ── LCARdS Palette Colors ──────────────────────────────────────────────────
  # Self-contained hex definitions — do not convert to var() references.
  # LCARdS card components depend on the full --lcards-* spectrum.

  # Orange family
  lcards-orange-darkest: "#d91604"
  lcards-orange-dark: "#ef1d10"
  lcards-orange-medium-dark: "#e7442a"
  lcards-orange: "#ff6753"
  lcards-orange-medium: "#ff6753"
  lcards-orange-medium-light: "#ff8470"
  lcards-orange-light: "#ff977b"
  lcards-orange-lightest: "#ffb399"

  # Gray family
  lcards-gray-darkest: "#1e2229"
  lcards-gray-dark: "#2f3749"
  lcards-gray-medium-dark: "#52596e"
  lcards-gray: "#6d748c"
  lcards-gray-medium: "#6d748c"
  lcards-gray-medium-light: "#9ea5ba"
  lcards-gray-light: "#d2d5df"
  lcards-gray-lightest: "#f3f4f7"
  lcards-moonlight: "#dfe1e8"

  # Blue family
  lcards-blue-darkest: "#002241"
  lcards-blue-dark: "#1c3c55"
  lcards-blue-medium-dark: "#2a7193"
  lcards-blue: "#37a6d1"
  lcards-blue-medium: "#37a6d1"
  lcards-blue-medium-light: "#67caf0"
  lcards-blue-light: "#93e1ff"
  lcards-blue-lightest: "#00eeee"

  # Green family
  lcards-green-darkest: "#0c2a15"
  lcards-green-dark: "#083717"
  lcards-green-medium-dark: "#095320"
  lcards-green: "#266239"
  lcards-green-medium: "#266239"
  lcards-green-medium-light: "#458359"
  lcards-green-light: "#80bb93"
  lcards-green-lightest: "#b8e0c1"

  # Yellow family
  lcards-yellow-darkest: "#70602c"
  lcards-yellow-dark: "#ac943b"
  lcards-yellow-medium-dark: "#d2bf50"
  lcards-yellow: "#f9ef97"
  lcards-yellow-medium: "#f9ef97"
  lcards-yellow-medium-light: "#fffac9"
  lcards-yellow-light: "#e7e6de"
  lcards-yellow-lightest: "#f5f5dc"

  # Shapes
  lcars-vertical-border: 35px
  lcars-horizontal-border: 10px
  lcars-outer-radius: 34px
  lcars-inner-radius: 20px
  # Calculated
  lcars-middle-vertical-border: "calc(var(--lcars-vertical-border) + 0px)"

  # Font
  lcars-font: Tungsten
  lcars-fallback-font: Antonio

  # MSD Colors:
  msd-bright: "#fff1ab"
  msd-medium: var(--lcars-yellow) ### "#ffcc33"
  msd-normal: var(--lcars-orange) ### "#ff7700"
  msd-dark: var(--lcars-october-sunset) ### "#ff4400"
  msd-ra-bright: "#dca29e"
  msd-ra-medium: "#e97369"
  msd-ra-normal: "#ff1100"
  msd-ra-dark: "#7f0800"

# ======================================================= #
#                   BASE CUSTOMIZATIONS                   #
# ======================================================= #
(DO NOT USE/MODIFY)=== Base customizations: &base
  primary-color: var(--lcars-ui-tertiary)
  # ha-color-primary-* tonal palette lives in src/defaults.yaml so themes can
  # override it without duplicating keys brought in via <<: *base (issue #232).
  primary-background-color: var(--lcars-background-color)
  secondary-background-color: var(--lcars-ui-quaternary)
  divider-color: transparent
  accent-color: var(--lcars-ui-accent-color)
  text-accent-color: var(--lcars-ui-accent-text)
  box-sizing: unset !important

  # Fonts
  font-family: "var(--lcars-font), var(--lcars-fallback-font), Segoe UI Variable Static Text, Segoe UI, SegoeUI, -apple-system,BlinkMacSystemFont, system-ui, sans-serif"
  ha-font-family-body: var(--font-family)
  ha-card-header-font-family: var(--font-family)
  header-font-size: calc(var(--header-height) * 0.93)

  # Text
  # Default card has a quaternary background. When the card background changes
  # or when there's a black background (e.g. /config/devices/dashboard), these
  # are overriden in the card_mod CSS.
  lcars-primary-text: var(--lcars-text-light)
  lcars-secondary-text: color-mix(in oklch, var(--lcars-primary-text) 80%, var(--lcars-ui-mix-color))
  # This should be a list of all varaibles that control the color of text in
  #   every part of the UI and in every card.
  ha-card-header-color: var(--lcars-primary-text)
  ha-color-text-primary: var(--lcars-primary-text)
  primary-text-color: var(--lcars-primary-text)
  secondary-text-color: var(--lcars-primary-text)
  text-primary-color: var(--lcars-primary-text)
  disabled-text-color: var(--lcars-graphite)
  mdc-select-label-ink-color: var(--lcars-secondary-text)
  mdc-select-ink-color: var(--lcars-primary-text)
  mdc-text-field-label-ink-color: var(--lcars-primary-text)
  mdc-text-field-fill-color: transparent
  mdc-text-field-ink-color: var(--lcars-primary-text)
  wa-form-control-value-color: var(--lcars-primary-text);

  # Sidebar Menu
  sidebar-background-color: var(--lcars-sidebar-background)
  sidebar-menu-button-background-color: var(--sidebar-background-color)
  sidebar-icon-color: var(--lcars-sidebar-text)
  sidebar-text-color: var(--lcars-sidebar-text)
  sidebar-selected-icon-color: var(--lcars-sidebar-text)
  sidebar-menu-button-text-color: var(--lcars-sidebar-text)

  # States and Badges
  state-icon-color: var(--lcars-primary-text)
  state-active-color: var(--lcars-sunflower)

  # Sliders
  ha-slider-background: none !important

  # Badges
  label-badge-text-color: var(--lcars-text-dark)
  label-badge-red: var(--lcars-alt-orange)
  label-badge-yellow: var(--lcars-sunflower)
  label-badge-blue: var(--lcars-blue)
  label-badge-green: var(--lcars-green)
  label-badge-grey: var(--lcars-medium-gray)

  # Cards
  card-background-color: var(--secondary-background-color)
  ha-card-border-radius: var(--lcars-outer-radius)
  ha-card-border-width: 0px
  ha-heading-card-title-color: var(--lcars-ui-text-heading)

  # Tables
  # TODO: Test this. this alternates between black and quaternary?
  table-row-background-color: var(--primary-background-color)
  table-row-alternative-background-color: var(--secondary-background-color)
  data-table-background-color: var(--lcars-background-color)

  # Material Design Components
  mdc-typography-button-font-family: var(--font-family)
  mdc-typography-body2-font-family: var(--font-family)
  mdc-theme-primary: var(--lcars-text-gray)
  mdc-theme-secondary: var(--lcars-text-gray)
  mdc-button-outline-color: transparent
  mdc-typography-font-family: var(--font-family)
  mdc-theme-on-primary: black
  mdc-theme-on-secondary: black
  mdc-theme-text-primary-on-background: var(--lcars-ui-secondary-text)
  mdc-theme-text-secondary-on-background: var(--lcars-ui-secondary-text)
  mdc-shape-small: 0px

  #App Header
  app-header-edit-background-color: transparent
  app-header-text-color: var(--lcars-ui-app-header-text-color, var(--lcars-ui-primary-text))
  header-height: 40px
  # Tabs
  ha-tab-padding-start: 5px;
  ha-tab-padding-end: 5px;
  #State
  state-color: var(--lcars-ui-secondary)
  #Code Editor
  code-editor-background-color: black
  # Other
  more-info-header-background: rgba(25, 25, 25)
  app-header-background-color: var(--lcars-ui-app-header-background-color, var(--lcars-ui-primary))
  mini-media-player-base-color: var(--lcars-text-gray)
  mini-media-player-icon-color: var(--lcars-text-gray)
  state-lock-locked-color: var(--lcars-green)
  state-lock-unlocked-color: var(--lcars-dark-red)
  state-lock-locking-color: var(--lcars-yellow)
  state-lock-unlocking-color: var(--lcars-yellow)
  state-lock-open-color: var(--lcars-red)
  state-lock-jammed-color: var(--lcars-scarlet)
  input-dropdown-icon-color: var(--lcars-text-gray)
  ha-outlined-field-container-color: var(--lcars-text-gray)
  markdown-code-text-color: var(--lcars-text-light)

  # Fields
  ha-color-form-background: rgba(0, 0, 0, 0.01)
  ha-color-form-background-hover: rgba(255, 255, 255, 0.05)
  ha-color-form-background-disabled: rgba(0, 0, 0, 0.1)
  ha-color-fill-primary-quiet-resting: rgba(255, 255, 255, 0.1)

  # Thermostat Card  # ha-frontend: src/panels/lovelace/cards/hui-thermostat-card.ts, src/components/ha-control-circular-slider.ts
  control-circular-slider-background: var(--lcars-dark-gray)
  state-climate-auto-color: var(--lcars-cyan)
  state-climate-manual-color: var(--lcars-primary-gray)
  state-climate-fan_only-color: var(--lcars-medium-gray)
  state-climate-dry-color: var(--lcars-light-orange)
  state-climate-idle-color: var(--lcars-pale-orange)
  state-climate-heat-cool-color: var(--lcars-alt-green)
  state-climate-heat-color: var(--lcars-alt-orange)
  state-climate-cool-color: var(--lcars-cyan)
  state-unknown-color: var(--lcars-starlight)
  energy-non-fossil-color: var(--lcars-alt-green)

  # Calendar card and panel
  table-header-background-color: var(--ha-color-primary-10)

  # Hover tooltips (ha-tooltip) — sidebar item names, header icons, etc.
  # Set at theme level (not #view) so tooltips outside the dashboard —
  # notably the collapsed sidebar's — are covered too. Without these,
  # ha-tooltip falls back to --ha-color-surface-default (HA near-black in
  # dark mode) and --primary-text-color, which can collide (issue: black
  # text on black tooltip in dark mode).
  ha-tooltip-background-color: var(--lcars-tooltip-background)
  ha-tooltip-text-color: var(--lcars-tooltip-text)

# ======================================================= #
#                    CARD MODIFICATIONS                   #
# ======================================================= #
(DO NOT USE/MODIFY)=== card-mod CSS: &card-mod-css # Card modifications
  card-mod-drawer: |
    :host {
      /* ----------------------------------------------- */
      /*         Dashbaord Texture and Gradient          */
      /* ----------------------------------------------- */
      {% if not is_state('input_boolean.lcars_texture', 'off') %}
      &::before {
        content: "";
        background: radial-gradient(ellipse farthest-corner at center center, var(--lcars-backlight-center) 0%, var(--lcars-backlight-middle) var(--lcars-backlight-middle-location), var(--lcars-backlight-outer) 100%);
        width: 100%;
        height: 100%;
        z-index: 9990;
        position: fixed;
        mix-blend-mode: overlay;
        opacity: 1;
        pointer-events: none;
      }
      &::after {
        content: "";
        background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAMAAAAp4XiDAAAAUVBMVEWFhYWDg4N3d3dtbW17e3t1dXWBgYGHh4d5eXlzc3OLi4ubm5uVlZWPj4+NjY19fX2JiYl/f39ra2uRkZGZmZlpaWmXl5dvb29xcXGTk5NnZ2c8TV1mAAAAG3RSTlNAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAvEOwtAAAFVklEQVR4XpWWB67c2BUFb3g557T/hRo9/WUMZHlgr4Bg8Z4qQgQJlHI4A8SzFVrapvmTF9O7dmYRFZ60YiBhJRCgh1FYhiLAmdvX0CzTOpNE77ME0Zty/nWWzchDtiqrmQDeuv3powQ5ta2eN0FY0InkqDD73lT9c9lEzwUNqgFHs9VQce3TVClFCQrSTfOiYkVJQBmpbq2L6iZavPnAPcoU0dSw0SUTqz/GtrGuXfbyyBniKykOWQWGqwwMA7QiYAxi+IlPdqo+hYHnUt5ZPfnsHJyNiDtnpJyayNBkF6cWoYGAMY92U2hXHF/C1M8uP/ZtYdiuj26UdAdQQSXQErwSOMzt/XWRWAz5GuSBIkwG1H3FabJ2OsUOUhGC6tK4EMtJO0ttC6IBD3kM0ve0tJwMdSfjZo+EEISaeTr9P3wYrGjXqyC1krcKdhMpxEnt5JetoulscpyzhXN5FRpuPHvbeQaKxFAEB6EN+cYN6xD7RYGpXpNndMmZgM5Dcs3YSNFDHUo2LGfZuukSWyUYirJAdYbF3MfqEKmjM+I2EfhA94iG3L7uKrR+GdWD73ydlIB+6hgref1QTlmgmbM3/LeX5GI1Ux1RWpgxpLuZ2+I+IjzZ8wqE4nilvQdkUdfhzI5QDWy+kw5Wgg2pGpeEVeCCA7b85BO3F9DzxB3cdqvBzWcmzbyMiqhzuYqtHRVG2y4x+KOlnyqla8AoWWpuBoYRxzXrfKuILl6SfiWCbjxoZJUaCBj1CjH7GIaDbc9kqBY3W/Rgjda1iqQcOJu2WW+76pZC9QG7M00dffe9hNnseupFL53r8F7YHSwJWUKP2q+k7RdsxyOB11n0xtOvnW4irMMFNV4H0uqwS5ExsmP9AxbDTc9JwgneAT5vTiUSm1E7BSflSt3bfa1tv8Di3R8n3Af7MNWzs49hmauE2wP+ttrq+AsWpFG2awvsuOqbipWHgtuvuaAE+A1Z/7gC9hesnr+7wqCwG8c5yAg3AL1fm8T9AZtp/bbJGwl1pNrE7RuOX7PeMRUERVaPpEs+yqeoSmuOlokqw49pgomjLeh7icHNlG19yjs6XXOMedYm5xH2YxpV2tc0Ro2jJfxC50ApuxGob7lMsxfTbeUv07TyYxpeLucEH1gNd4IKH2LAg5TdVhlCafZvpskfncCfx8pOhJzd76bJWeYFnFciwcYfubRc12Ip/ppIhA1/mSZ/RxjFDrJC5xifFjJpY2Xl5zXdguFqYyTR1zSp1Y9p+tktDYYSNflcxI0iyO4TPBdlRcpeqjK/piF5bklq77VSEaA+z8qmJTFzIWiitbnzR794USKBUaT0NTEsVjZqLaFVqJoPN9ODG70IPbfBHKK+/q/AWR0tJzYHRULOa4MP+W/HfGadZUbfw177G7j/OGbIs8TahLyynl4X4RinF793Oz+BU0saXtUHrVBFT/DnA3ctNPoGbs4hRIjTok8i+algT1lTHi4SxFvONKNrgQFAq2/gFnWMXgwffgYMJpiKYkmW3tTg3ZQ9Jq+f8XN+A5eeUKHWvJWJ2sgJ1Sop+wwhqFVijqWaJhwtD8MNlSBeWNNWTa5Z5kPZw5+LbVT99wqTdx29lMUH4OIG/D86ruKEauBjvH5xy6um/Sfj7ei6UUVk4AIl3MyD4MSSTOFgSwsH/QJWaQ5as7ZcmgBZkzjjU1UrQ74ci1gWBCSGHtuV1H2mhSnO3Wp/3fEV5a+4wz//6qy8JxjZsmxxy5+4w9CDNJY09T072iKG0EnOS0arEYgXqYnXcYHwjTtUNAcMelOd4xpkoqiTYICWFq0JSiPfPDQdnt+4/wuqcXY47QILbgAAAABJRU5ErkJggg==);
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0px;
        z-index: 9991;
        mix-blend-mode: overlay;
        opacity: 1;
        pointer-events: none;
      }
      {% endif %}
    }
  card-mod-card-yaml: &card-mod-card |
    .: |
      /* ----------------------------------------------- */
      /*                Common Card Styles               */
      /* ----------------------------------------------- */
      :host {
        /* Re-resolve these here for cards with theme overrides */
        --lcars-horizontal-border: {{ states('input_number.lcars_horizontal') if has_value('input_number.lcars_horizontal') else 10 }}px !important;
        --lcars-vertical-border: {{ states('input_number.lcars_vertical') if has_value('input_number.lcars_vertical') else 35 }}px !important;
        --lcars-middle-vertical-border: {{ states('input_number.lcars_vertical') if has_value('input_number.lcars_vertical') else 35 }}px !important;
        --lcars-sound: {{ true if is_state('input_boolean.lcars_sound', 'on') else false }};
        --lcars-texture: {{ true if is_state('input_boolean.lcars_texture', 'on') else false }};

        /* Default card has quaternary background. */
        font-family: var(--font-family) !important;
        --md-sys-color-primary: var(--lcars-ui-quaternary) !important;

        /* Force these to be recomputed to prevent eager variable resolution */
        --lcars-primary-text: var(--lcars-ui-quaternary-text) !important;
        --lcars-secondary-text: color-mix(in oklch, var(--lcars-primary-text) 80%, var(--lcars-ui-mix-color));
        --ha-card-header-color: var(--lcars-primary-text);
        --ha-color-text-primary: var(--lcars-primary-text);
        --primary-text-color: var(--lcars-primary-text);
        --secondary-text-color: var(--lcars-primary-text);
        --text-primary-color: var(--lcars-primary-text);
        --mdc-select-label-ink-color: var(--lcars-secondary-text);
        --mdc-select-ink-color: var(--lcars-primary-text);
        --mdc-text-field-label-ink-color: var(--lcars-primary-text);
        --mdc-text-field-fill-color: transparent;
        --mdc-text-field-ink-color: var(--lcars-primary-text);
        --wa-form-control-value-color: var(--lcars-primary-text);
        --state-icon-color: var(--lcars-primary-text);
        --card-primary-color: var(--lcars-primary-text);
        --card-secondary-color: var(--lcars-secondary-text);
        color: var(--primary-text-color);
      }
      :host, :host > ha-card {
        &:not(.type-undefined,.type-custom-grid-layout) {
          height: 100%;
        }

      }
      
      /* =============================================== */
      /*        HEADER CLASSES AND CARD TYPE FIXES       */
      /* =============================================== */
      
      /* ------------- Common Header Styles ------------ */
      :host(.header-left),
      :host(.header-right),
      :host(.header-contained),
      :host(.header-open),
      ha-card:is(.header-left,
                 .header-right,
                 .header-contained,
                 .header-open
      ):not(div > *) {
        display: block !important;
        height: 100%;
        border: 0px solid var(--lcars-card-top-color);
        border-top-width: var(--lcars-horizontal-border);
        border-radius: 0px;
        padding: 0px;
        box-sizing: border-box;
        background-color: var(--lcars-card-top-color);
        text-transform: uppercase;

        > :not(style,card-mod,h1) {
          background-color: var(--lcars-background-color);
          --lcars-primary-text: var(--lcars-background-text) !important;
          --lcars-secondary-text: color-mix(in oklch, var(--lcars-primary-text) 80%, var(--lcars-ui-mix-color));
          --ha-card-header-color: var(--lcars-primary-text);
          --ha-color-text-primary: var(--lcars-primary-text);
          --primary-text-color: var(--lcars-primary-text);
          --secondary-text-color: var(--lcars-primary-text);
          --text-primary-color: var(--lcars-primary-text);
          --mdc-select-label-ink-color: var(--lcars-secondary-text);
          --mdc-select-ink-color: var(--lcars-primary-text);
          --mdc-text-field-label-ink-color: var(--lcars-primary-text);
          --mdc-text-field-fill-color: transparent;
          --mdc-text-field-ink-color: var(--lcars-primary-text);
          --wa-form-control-value-color: var(--lcars-primary-text);
          --state-icon-color: var(--lcars-primary-text);
          --card-primary-color: var(--lcars-primary-text);
          --card-secondary-color: var(--lcars-secondary-text);
          color: var(--primary-text-color);
          border-radius: 0px;
          padding-top: 6px;
          height: 100%;
          box-sizing: border-box;
        }
        > ha-markdown,
        > ha-card > ha-markdown {
          padding-block: 0px;
        }
      }
      
      /* ----------------Border on left----------------- */
      :host(.header-left),
      :host(.header-contained),
      ha-card:is(.header-left,
                 .header-contained
      ):not(div > *) {
        border-top-left-radius: var(--ha-card-border-radius);
        border-left-width: var(--lcars-vertical-border);

        > :not(style,card-mod) {
          border-top-left-radius: var(--lcars-inner-radius);
          padding-left: 6px;
        }
      }

      /* ----------------Border on right---------------- */
      :host(.header-right),
      :host(.header-contained),
      ha-card:is(.header-right,
                 .header-contained
      ):not(div > *) {
        border-top-right-radius: var(--ha-card-border-radius);
        border-right-width: var(--lcars-vertical-border);

        > :not(style,card-mod) {
          border-top-right-radius: var(--lcars-inner-radius);
          padding-right: 6px;
        }
      }

      /* =============================================== */
      /*        MIDDLE CLASSES AND CARD TYPE FIXES       */
      /* =============================================== */

      /* ------------- Common Middle Styles ------------ */
      :host(.middle-left),
      :host(.middle-right),
      :host(.middle-contained),
      :host(.middle-blank),
      ha-card:is(.middle-left,
                 .middle-right,
                 .middle-contained,
                 .middle-blank
      ):not(div > *)  {
        display: block !important;
        height: 100%;
        background-color: var(--lcars-background-color);
        padding: 0px;
        box-sizing: border-box;
        border-radius: 0px;
        border-inline: 0px solid var(--lcars-card-mid-color);
        text-transform: uppercase;

        > :not(style,card-mod,h1) {
          border-radius: 0px;
          background-color: var(--lcars-background-color);
          --lcars-primary-text: var(--lcars-background-text) !important;
          --lcars-secondary-text: color-mix(in oklch, var(--lcars-primary-text) 80%, var(--lcars-ui-mix-color));
          --ha-card-header-color: var(--lcars-primary-text);
          --ha-color-text-primary: var(--lcars-primary-text);
          --primary-text-color: var(--lcars-primary-text);
          --secondary-text-color: var(--lcars-primary-text);
          --text-primary-color: var(--lcars-primary-text);
          --mdc-select-label-ink-color: var(--lcars-secondary-text);
          --mdc-select-ink-color: var(--lcars-primary-text);
          --mdc-text-field-label-ink-color: var(--lcars-primary-text);
          --mdc-text-field-fill-color: transparent;
          --mdc-text-field-ink-color: var(--lcars-primary-text);
          --wa-form-control-value-color: var(--lcars-primary-text);
          --state-icon-color: var(--lcars-primary-text);
          --card-primary-color: var(--lcars-primary-text);
          --card-secondary-color: var(--lcars-secondary-text);
          color: var(--primary-text-color);
          height: 100%;
          box-sizing: border-box;
        }
      }
      > ha-markdown,
      > ha-card > ha-markdown {
        padding-block: 0px;
      }
      
      /* -----------------Border on left---------------- */
      :host(.middle-left),
      :host(.middle-contained),
      ha-card:is(.middle-left,
                 .middle-contained
      ):not(div > *) {
        border-left-width: var(--lcars-vertical-border);
        > :not(style,card-mod) {
          padding-left: 6px;
        }
      }

      /* ----------------Border on right---------------- */
      :host(.middle-right),
      :host(.middle-contained),
      ha-card:is(.middle-right,
                 .middle-contained
      ):not(div > *) {
        border-right-width: var(--lcars-vertical-border);
        > :not(style,card-mod) {
          padding-right: 6px;
        }
      }

      /* -------------- Entities Card padding ---------- */
      :host(.middle-blank) {
        #states {
          padding: 0px;
        }
      }

      /* =============================================== */
      /*        FOOTER CLASSES AND CARD TYPE FIXES       */
      /* =============================================== */
      
      /* ------------- Common Footer Styles ------------ */
      :host(.footer-left),
      :host(.footer-right),
      :host(.footer-contained),
      :host(.footer-open),
      ha-card:is(.footer-left,
                 .footer-right,
                 .footer-contained,
                 .footer-open
      ):not(div > *) {
        display: block !important;
        height: 100%;
        padding: 0px;          
        box-sizing: border-box;
        border-radius: 0px;
        border: 0px solid var(--lcars-card-bottom-color);
        border-bottom-width: var(--lcars-horizontal-border);
        background-color: var(--lcars-card-bottom-color);
        text-transform: uppercase;

        > :not(style,card-mod,h1) {
          border-radius: 0px;
          background-color: var(--lcars-background-color);
          --lcars-primary-text: var(--lcars-background-text) !important;
          --lcars-secondary-text: color-mix(in oklch, var(--lcars-primary-text) 80%, var(--lcars-ui-mix-color));
          --ha-card-header-color: var(--lcars-primary-text);
          --ha-color-text-primary: var(--lcars-primary-text);
          --primary-text-color: var(--lcars-primary-text);
          --secondary-text-color: var(--lcars-primary-text);
          --text-primary-color: var(--lcars-primary-text);
          --mdc-select-label-ink-color: var(--lcars-secondary-text);
          --mdc-select-ink-color: var(--lcars-primary-text);
          --mdc-text-field-label-ink-color: var(--lcars-primary-text);
          --mdc-text-field-fill-color: transparent;
          --mdc-text-field-ink-color: var(--lcars-primary-text);
          --wa-form-control-value-color: var(--lcars-primary-text);
          --state-icon-color: var(--lcars-primary-text);
          --card-primary-color: var(--lcars-primary-text);
          --card-secondary-color: var(--lcars-secondary-text);
          color: var(--primary-text-color);
          padding-bottom: 6px;
          height: 100%;
          box-sizing: border-box;

        }
        > ha-markdown,
        > ha-card > ha-markdown {
          padding-block: 0px;
        }
      }

      /* ----------------------------------------------- */
      /*              Specific Footer Styles             */
      /* ----------------------------------------------- */

      /* -----------------Border on left---------------- */
      :host(.footer-left),
      :host(.footer-contained),
      ha-card:is(.footer-left,
                 .footer-contained
      ):not(div > *)  {
        border-bottom-left-radius: var(--ha-card-border-radius) !important;
        border-left-width: var(--lcars-vertical-border);

        > :not(style,card-mod) {
          border-bottom-left-radius: var(--lcars-inner-radius) !important;
          padding-left: 6px;
        }
      }

      /* ----------------Border on right---------------- */
      :host(.footer-right),
      :host(.footer-contained),
      ha-card:is(.footer-right,
                 .footer-contained
      ):not(div > *)  {
        border-bottom-right-radius: var(--ha-card-border-radius) !important;
        border-right-width: var(--lcars-vertical-border);

        > :not(style,card-mod) {
          border-bottom-right-radius: var(--lcars-inner-radius) !important;
          padding-right: 6px;
        }
      }

      /* =============================================== */
      /*                     BUTTONS                     */
      /* =============================================== */

      /* ----------------------------------------------- */
      /*               Common Button Styles              */
      /* ----------------------------------------------- */
      :host(.button-small),
      :host(.button-large),
      :host(.button-lozenge-left),
      :host(.button-lozenge-right),
      :host(.button-bullet-left),
      :host(.button-bullet-right),
      :host(.button-capped-left),
      :host(.button-capped-right),
      :host(.button-barrel-left),
      :host(.button-barrel-right),
      :host(.button-bar-left),
      :host(.button-bar-right),
      ha-card:is(
        .button-small,
        .button-large,
        .button-lozenge-left,
        .button-lozenge-right,
        .button-bullet-left,
        .button-bullet-right,
        .button-capped-left,
        .button-capped-right,
        .button-barrel-left,
        .button-barrel-right,
        .button-bar-left,
        .button-bar-right
      ) {

        > ha-card,
        > #aspect-ratio > ha-card,
        &:is(ha-card) {
          background-color: var(--lcars-card-button-color);
          --lcars-primary-text: var(--lcars-card-button-text) !important;
          --lcars-secondary-text: color-mix(in oklch, var(--lcars-primary-text) 80%, var(--lcars-ui-mix-color));
          --ha-card-header-color: var(--lcars-primary-text);
          --ha-color-text-primary: var(--lcars-primary-text);
          --primary-text-color: var(--lcars-primary-text);
          --secondary-text-color: var(--lcars-primary-text);
          --text-primary-color: var(--lcars-primary-text);
          --mdc-select-label-ink-color: var(--lcars-secondary-text);
          --mdc-select-ink-color: var(--lcars-primary-text);
          --mdc-text-field-label-ink-color: var(--lcars-primary-text);
          --mdc-text-field-fill-color: transparent;
          --mdc-text-field-ink-color: var(--lcars-primary-text);
          --wa-form-control-value-color: var(--lcars-primary-text);
          --state-icon-color: var(--lcars-primary-text);
          --card-primary-color: var(--lcars-primary-text);
          --card-secondary-color: var(--lcars-secondary-text);
          color: var(--primary-text-color);
          text-transform: uppercase;

          /* Louder ripple press feedback to handle wide range in colors */
          --ha-ripple-color: var(--lcars-ripple-color);
          --ha-ripple-pressed-opacity: var(--lcars-ripple-pressed-opacity);
          --ha-ripple-hover-opacity: var(--lcars-ripple-hover-opacity);
        }
      }

      /* ----------------------------------------------- */
      /*           Small Button Class and Fixes          */
      /* ----------------------------------------------- */
      :host(.button-small),
      ha-card:is(.button-small) {
        > ha-card, 
        > #aspect-ratio > ha-card,
        &:is(ha-card) {
          display: flex;
          border-radius: 0px !important;
          position: relative;
          flex-direction: column;
          flex-wrap: nowrap;
          justify-content: center;
          
          > .more-info {
            display: none;
          }
          > .content {
            > #controls {
              display: flex;
              place-content: flex-start center;
              position: relative; 
              padding: 0px;
            }
            > #info {
              text-align: right;
              box-sizing: border-box;
              width: 100%;
              padding: 0px 6px 6px 0px;
              margin-top: -24px;
              position: relative;
            }
          }

          > span {
            box-sizing: border-box;
            text-align: right;
            width: 100%;
            padding: 6px;
            margin: unset;
            position: absolute;
            bottom: 0;
          }

          > span.state {
            text-align: right;
            width: 100%;
            padding: 6px;
            padding-bottom: 22px;
            margin: unset;
            position: absolute;
            bottom: 0;
          }
        }
      }

      /* ----------------------------------------------- */
      /*           Large Button Class and Fixes          */
      /* ----------------------------------------------- */
      /* None... amazingly */
      
      /* =============================================== */
      /*      BULLET/LOZENGE/CAPPED/BARREL BUTTONS       */
      /* =============================================== */
      /* These must handle all possible applications of  */
      /* the classes by card-mod. That includes both     */
      /* :host and ha-card because nesting a card in     */
      /* stacks, layout-card, etc will affect where the  */
      /* class is applied.                               */

      :host(.button-lozenge-left),
      :host(.button-lozenge-right),
      :host(.button-bullet-left),
      :host(.button-bullet-right),
      :host(.button-capped-left),
      :host(.button-capped-right),
      :host(.button-barrel-left),
      :host(.button-barrel-right),
      :host(.button-bar-left),
      :host(.button-bar-right),
      ha-card:is(
        .button-lozenge-left,
        .button-lozenge-right,
        .button-bullet-left,
        .button-bullet-right,
        .button-capped-left,
        .button-capped-right,
        .button-barrel-left,
        .button-barrel-right,
        .button-bar-left,
        .button-bar-right
      ) {

        > ha-card, 
        > #aspect-ratio > ha-card,
        &:is(ha-card) {
        
          min-height: 60px;
          display: flex;
          align-items: flex-end;
          flex-direction: column-reverse;
          border-radius: 0px;
          padding-block: 0px;

          > ha-state-icon {
            --mdc-icon-size: unset;
            background-color: var(--lcars-card-top-color);
            position: absolute;
            left: 0;
            width: var(--lcars-vertical-border);
            height: 100% !important;
            max-height: 100% !important;
            border-right: var(--lcars-background-color) solid 6px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          > span {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: flex-end;
            justify-content: flex-end;
            margin-top: unset;
            padding: 6px;
          }
          
          > span.state {
            align-items: center;
            color: var(--lcars-card-button-text);
          }

          /* Big Slider Card */
          &:is(#container) {
            > #slider {
              right: 0;
              left: calc(var(--lcars-vertical-border) + 6px);
              background: linear-gradient(90deg, var(--bsc-slider-color), var(--bsc-slider-color) var(--bsc-percent), transparent var(--bsc-percent), transparent 100%);
            }
            > #content {
              padding-left: calc(var(--lcars-vertical-border) + 18px);
              justify-content: right;
            }
          }
        }
      }
      
      /* ----------------------------------------------- */
      /*               Flip Right Buttons                */
      /* ----------------------------------------------- */
      :host(.button-lozenge-right),
      :host(.button-bullet-right),
      :host(.button-capped-right),
      :host(.button-barrel-right),
      ha-card:is(
        .button-lozenge-right,
        .button-bullet-right,
        .button-capped-right,
        .button-barrel-right
      ) {

        > ha-card#container,
        > ha-card, 
        > #aspect-ratio > ha-card,
        &:is(ha-card) {

          align-items: flex-start;

          > ha-state-icon {
            left: auto;
            right: 0;
            border-right: 0px;
            border-left: var(--lcars-background-color) solid 6px;
          }
          
          > span {
            justify-content: flex-start;
            left: var(--lcars-vertical-border);
            padding-inline: 6px;
          }
          
          /* Big Slider Card */
          &:is(#container) {
            > #slider {
              right: calc(var(--lcars-vertical-border) + 6px);
              left: 0;
              background: linear-gradient(90deg, var(--bsc-slider-color), var(--bsc-slider-color) var(--bsc-percent), transparent var(--bsc-percent), transparent 100%);
            }
            > #content {
              padding-left: var(--ha-card-border-radius);
              padding-right: 0px;
              justify-content: left;
            }
          }
        }
      }


      /* ----------------------------------------------- */
      /*                   Corner Radii                  */
      /* ----------------------------------------------- */
      :host(.button-lozenge-left),
      :host(.button-lozenge-right),
      :host(.button-bullet-left),
      :host(.button-capped-right),
      :host(.button-bar-left),
      :host(.button-bar-right),
      ha-card:is(
        .button-lozenge-left,
        .button-bullet-left,
        .button-bar-left,
        .button-lozenge-right,
        .button-capped-right,
        .button-bar-right
      ) {
        > ha-card#container,
        > ha-card, 
        > #aspect-ratio > ha-card,
        &:is(ha-card) {
          border-top-right-radius: var(--ha-card-border-radius);
          border-bottom-right-radius: var(--ha-card-border-radius);
        }
      }
      :host(.button-lozenge-left),
      :host(.button-lozenge-right),
      :host(.button-bullet-right),
      :host(.button-capped-left),
      :host(.button-bar-left),
      :host(.button-bar-right),
      ha-card:is(
        .button-lozenge-left,
        .button-capped-left,
        .button-bar-left,
        .button-lozenge-right,
        .button-bullet-right,
        .button-bar-right
      ) {
        > ha-card#container,
        > ha-card, 
        > #aspect-ratio > ha-card,
        &:is(ha-card) {
      
          border-top-left-radius: var(--ha-card-border-radius);
          border-bottom-left-radius: var(--ha-card-border-radius);
        }
      }
      :host(.button-lozenge-left), 
      :host(.button-bullet-left),
      ha-card:is(
        .button-lozenge-left,
        .button-bullet-left
      ) {
        > ha-card#container,
        > ha-card, 
        > #aspect-ratio > ha-card,
        &:is(ha-card) {
          > span {
            padding-right: var(--ha-card-border-radius);
          }
        }
      }
      :host(.button-lozenge-right), 
      :host(.button-bullet-right),
      ha-card:is(
        .button-lozenge-right,
        .button-bullet-right
      ) {
        > ha-card#container,
        > ha-card, 
        > #aspect-ratio > ha-card,
        &:is(ha-card) {
          > span {
            padding-left: var(--ha-card-border-radius);
          }
        }
      }

      /* ----------------------------------------------- */
      /*                  Button Bar                     */
      /* ----------------------------------------------- */
      :host(.button-bar-left),
      :host(.button-bar-right),
      ha-card:is(
        .button-bar-left,
        .button-bar-right
      ) {
        > ha-card#container,
        > ha-card, 
        > #aspect-ratio > ha-card,
        &:is(ha-card) {

          line-height: 60px;
          font-size: 60px;
          padding-left: var(--lcars-vertical-border);
          flex-direction: row;
          justify-content: space-between;

          > span {
            width: fit-content;
            padding: 0px;

            &:is(.state) {
              padding-right: var(--ha-card-border-radius);
              height: 100%;
            }

            &:not(.state) { 
              color: var(--lcars-background-text);
              height: 100%;
              background-color: var(--lcars-background-color);
              padding-inline: 6px;
              padding-bottom: 0.05em;
              margin-top: -0.5em;
            }
          }
          
          > ha-state-icon {
            font-size: 0;
          }
          
          /* Big Slider Card */
          &:is(#container) {
            > #slider {
              right: 0;
              left: calc(var(--lcars-vertical-border) + 6px);
              background: linear-gradient(90deg, var(--bsc-slider-color), var(--bsc-slider-color) var(--bsc-percent), transparent var(--bsc-percent), transparent 100%);
            }
            > #content {
              position: relative;
              padding-right: var(--ha-card-border-radius);
              padding-left: 18px;
              padding-bottom: 0.1em;
              justify-content: left;
            }
          }
          
        }
      }

      :host(.button-bar-right),
      ha-card:is(.button-bar-right) {
        > ha-card#container,
        > ha-card, 
        > #aspect-ratio > ha-card,
        &:is(ha-card) {

          flex-direction: row-reverse;
          padding-left: 0;
          padding-right: var(--lcars-vertical-border);

          > span:is(.state) {
              padding-left: var(--ha-card-border-radius);
              padding-right: 0;
          }

          > ha-state-icon {
            left: auto;
            right: 0;
            border-right: 0px;
            border-left: var(--lcars-background-color) solid 6px;
          }

          /* Big Slider Card */
          &:is(#container) {
            > #slider {
              right: calc(var(--lcars-vertical-border) + 6px);
              left: 0;
              background: linear-gradient(90deg, var(--bsc-slider-color), var(--bsc-slider-color) var(--bsc-percent), transparent var(--bsc-percent), transparent 100%);
            }
            > #content {
              padding-left: var(--ha-card-border-radius);
              padding-right: 18px;
              justify-content: right;
            }
          }
        }
        
      }


      /* =============================================== */
      /*                    BAR STYLES                   */
      /* =============================================== */

      /* ----------------------------------------------- */
      /*                Common Bar Styles                */
      /* ----------------------------------------------- */
      :host(.bar-left),
      :host(.bar-right),
      :host(.bar-large-left),
      :host(.bar-large-right),
      ha-card:is(.bar-left,
                 .bar-large-left,
                 .bar-right,
                 .bar-large-right
      ):not(div > *)   {
        background-color: var(--lcars-card-top-color);
        --lcars-primary-text: var(--lcars-card-top-text) !important;
        border-radius: 9999px;
        display: block;
        height: 1em;
        font-size: 2em;
        line-height: 1;
        overflow:hidden;

        > :not(style,card-mod,h1) {
          text-transform: uppercase;
          background-color: var(--lcars-background-color);
          --lcars-primary-text: var(--lcars-background-text) !important;
          --lcars-secondary-text: color-mix(in oklch, var(--lcars-primary-text) 80%, var(--lcars-ui-mix-color));
          --ha-card-header-color: var(--lcars-primary-text);
          --ha-color-text-primary: var(--lcars-primary-text);
          --primary-text-color: var(--lcars-primary-text);
          --secondary-text-color: var(--lcars-primary-text);
          --text-primary-color: var(--lcars-primary-text);
          --mdc-select-label-ink-color: var(--lcars-secondary-text);
          --mdc-select-ink-color: var(--lcars-primary-text);
          --mdc-text-field-label-ink-color: var(--lcars-primary-text);
          --mdc-text-field-fill-color: transparent;
          --mdc-text-field-ink-color: var(--lcars-primary-text);
          --wa-form-control-value-color: var(--lcars-primary-text);
          --state-icon-color: var(--lcars-primary-text);
          --card-primary-color: var(--lcars-primary-text);
          --card-secondary-color: var(--lcars-secondary-text);
          color: var(--primary-text-color);
          border-radius: 0px;
          display: inline-block;
          padding: 0px 6px 0px 6px;
          height: calc(100% + 0.4em);
          vertical-align: top;
          overflow: hidden;

          > ha-markdown {
            padding: 0px;
            margin-top: -0.06em;
          }
        }

        .title { 
          font-size: inherit !important;
          line-height: 1;
          margin-top: -0.06em;
        }
      }
      
      :host(.bar-large-left),
      :host(.bar-large-right),
      ha-card:is(.bar-large-left,
                 .bar-large-right
      ):not(div > *) {
          font-size: 3em;
      }

      :host(.bar-left),
      :host(.bar-large-left),
      ha-card:is(.bar-left,
                 .bar-large-left
      ):not(div > *) {
        border-left: var(--lcars-vertical-border) solid var(--lcars-card-top-color);
      }

      :host(.bar-right),
      :host(.bar-large-right),
      ha-card:is(.bar-right,
                 .bar-large-right
      ):not(div > *) {
        border-right: var(--lcars-vertical-border) solid var(--lcars-card-top-color);
        text-align: right;
      }

      /* =============================================== */
      /*               STACK STYLES                      */
      /* =============================================== */
      :host(.type-vertical-stack),
      :host(.type-horizontal-stack) {
        position: relative;
        .card-header {
          padding: 0px;
          position: absolute;
          left: calc( 0px - var(--lcars-vertical-border) /2);
          top: 50%;
          transform: translate(-50%, -50%);
          background-color: transparent;
        }
      }
      :host(.header-right.type-horizontal-stack),
      :host(.middle-right.type-horizontal-stack),
      :host(.footer-right.type-horizontal-stack),
      :host(.header-right.type-vertical-stack),
      :host(.middle-right.type-vertical-stack),
      :host(.footer-right.type-vertical-stack) {
        .card-header {
          transform: translate(50%, -50%);
          left: unset;
          right: calc( 0px - var(--lcars-vertical-border) /2);
        }
      }
      :host(.header-left.type-horizontal-stack),
      :host(.header-right.type-horizontal-stack),
      :host(.header-contained.type-horizontal-stack),
      :host(.header-left.type-vertical-stack),
      :host(.header-right.type-vertical-stack),
      :host(.header-contained.type-vertical-stack) {
        .card-header {
          color: var(--lcars-card-top-text);
        }
      }
      :host(.middle-left.type-horizontal-stack),
      :host(.middle-right.type-horizontal-stack),
      :host(.middle-contained.type-horizontal-stack),
      :host(.middle-left.type-vertical-stack),
      :host(.middle-right.type-vertical-stack),
      :host(.middle-contained.type-vertical-stack) {
        .card-header {
          color: var(--lcars-card-mid-text);
        }
      }
      :host(.footer-left.type-horizontal-stack),
      :host(.footer-right.type-horizontal-stack),
      :host(.footer-contained.type-horizontal-stack),
      :host(.footer-left.type-vertical-stack),
      :host(.footer-right.type-vertical-stack),
      :host(.footer-contained.type-vertical-stack) {
        .card-header {
          color: var(--lcars-card-bottom-text);
        }
      }
      
      /* =============================================== */
      /*               MISCELLANEOUS STYLES              */
      /* =============================================== */

      /* WIP fix for aliasing ugliness on slider tracks */
      .type-light > .bar {
        stroke-width: 5px;
      }

      /* ----------------------------------------------- */
      /*               Specific Card Fixes               */
      /* ----------------------------------------------- */

      /* ----------- Calendar Card --------------------- */
      :host(.type-calendar),
      ha-card:is(.type-calendar) {
        ha-full-calendar {
          --lcars-primary-text: var(--lcars-background-text) !important;
          --lcars-secondary-text: color-mix(in oklch, var(--lcars-primary-text) 80%, var(--lcars-ui-mix-color));
          --ha-card-header-color: var(--lcars-primary-text);
          --ha-color-text-primary: var(--lcars-primary-text);
          --primary-text-color: var(--lcars-primary-text);
          --secondary-text-color: var(--lcars-primary-text);
          --text-primary-color: var(--lcars-primary-text);
          --mdc-select-label-ink-color: var(--lcars-secondary-text);
          --mdc-select-ink-color: var(--lcars-primary-text);
          --mdc-text-field-label-ink-color: var(--lcars-primary-text);
          --mdc-text-field-fill-color: transparent;
          --mdc-text-field-ink-color: var(--lcars-primary-text);
          --wa-form-control-value-color: var(--lcars-primary-text);
          --state-icon-color: var(--lcars-primary-text);
          --card-primary-color: var(--lcars-primary-text);
          --card-secondary-color: var(--lcars-secondary-text);
        }
      }

      /* ----------- HTML Template Card ---------------- */
      :host, ha-card {
        &:is(.type-custom-html-template-card, .type-custom-html-card) {
          padding:0px !important;
        }
      }

      /* ----------- Weather Card ---------------------- */
      :host(.type-custom-weather-card) > ha-card {
        padding-top: 12px !important;
      }

      /* ----------- To-Do List Card ------------------- */
      :host(.type-todo-list),
      ha-card:is(.type-todo-list) {
        --lcars-type: "todo-list";
        --card-background-color: transparent !important;
        --ha-card-border-radius: 0px !important;
        --active-color: var(--lcars-card-mid-color);
        --active-text-color: var(--lcars-card-mid-text);
        --completed-color: color-mix(in srgb, var(--active-color), black 70%);
        --completed-text-color: var(--lcars-gray);
        --list-border-left: 0px;
        --list-border-right: 0px;

        > ha-card, &:is(ha-card) {
          div.addRow {
            background-color: var(--lcars-card-bottom-color);
            --mdc-text-field-fill-color: var(--lcars-card-bottom-color);
            color: var(--lcars-card-bottom-text);
            --mdc-text-field-ink-color: var(--lcars-card-bottom-text);
            --mdc-text-field-label-ink-color: var(--lcars-card-bottom-text);
            caret-color: currentColor;
            border-top-left-radius: var(--list-border-left);
            border-top-right-radius: var(--list-border-right);
            border-bottom-left-radius: var(--list-border-left);
            border-bottom-right-radius: var(--list-border-right);
            margin-block: 5px;
            padding: 5px max(15px, var(--list-border-right)) 5px max(15px, var(--list-border-left));
            height: 50px;
          }
          ha-sortable > ha-list {
            .header {
              background-color: var(--lcars-card-top-color);
              color: var(--lcars-card-top-text);
              --primary-text-color: var(--lcars-card-top-text);
              border-top-left-radius: var(--list-border-left);
              border-top-right-radius: var(--list-border-right);
              border-bottom-left-radius: var(--list-border-left);
              border-bottom-right-radius: var(--list-border-right);
              margin-block: 5px;
              height: 60px;
              padding: 0px max(15px, var(--list-border-right)) 0px max(15px, var(--list-border-left));
              font-size: 1.2rem;

              h2 {
                padding-bottom: 0.15em;
              }
            }

            ha-check-list-item {
              --check-border-right: 5px;
              --check-border-left: 0px;
              --flex-left: 1;

              background-color: var(--active-color);
              color: var(--active-text-color);
              text-transform: uppercase;
              display: flex;
              flex-direction: row;
              justify-content: space-between;
              border-top-left-radius: var(--list-border-left);
              border-top-right-radius: var(--list-border-right);
              border-bottom-left-radius: var(--list-border-left);
              border-bottom-right-radius: var(--list-border-right);
              margin: 5px;
              padding-top: 0px var(--list-border-right) 0px var(--list-border-left);
              height: 60px;
            }
            ha-check-list-item.completed {
              background-color: var(--completed-color);
              color: var(--completed-text-color);
            }
            ha-check-list-item.completed ha-svg-icon {
              background-color: var(--completed-text-color);
            }
            ha-check-list-item .mdc-checkbox {
              opacity: 1;
              position: absolute;
            }
            .mdc-checkbox .mdc-checkbox__native-control:enabled:checked ~
            .mdc-checkbox__background, .mdc-checkbox
            .mdc-checkbox__native-control:enabled:indeterminate ~
            .mdc-checkbox__background, .mdc-checkbox
            .mdc-checkbox__native-control[data-indeterminate="true"]:enabled ~
            .mdc-checkbox__background {
              border-color: var(--lcars-background-color);
              background-color: var(--lcars-background-color);
            }
            ha-check-list-item .summary {
              font-size: 1.2rem;
              position: absolute;
              right: max(8px, var(--list-border-right));
              bottom: 8px;
            }
          }
        }
      }
      :host(.list-lozenge-left),
      :host(.list-lozenge-right),
      :host(.list-bullet-right),
      :host(.list-capped-left),
      ha-card:is(.list-lozenge-left),
      ha-card:is(.list-lozenge-right),
      ha-card:is(.list-bullet-right),
      ha-card:is(.list-capped-left) {
        --list-border-left: 30px;
        --left-border: 1;
      }
      :host(.list-lozenge-left),
      :host(.list-lozenge-right),
      :host(.list-bullet-left),
      :host(.list-capped-right),
      ha-card:is(.list-lozenge-left),
      ha-card:is(.list-lozenge-right),
      ha-card:is(.list-bullet-left),
      ha-card:is(.list-capped-right) {
        --list-border-right: 30px;
        --right-border: 1;
      }
      :host(.list-lozenge-right),
      :host(.list-bullet-right),
      :host(.list-capped-right),
      :host(.list-barrel-right),
      ha-card:is(.list-lozenge-right),
      ha-card:is(.list-bullet-right),
      ha-card:is(.list-capped-right),
      ha-card:is(.list-barrel-right) {
        & > ha-card, &:is(ha-card) {
          > ha-sortable > ha-list > ha-check-list-item {
            flex-direction: row-reverse;
            --check-border-left: 5px;
            --check-border-right: 0px;
            --flex-left: 0;
            --flex-right: 1;

            .summary {
              right: unset;
              left: max(8px, var(--list-border-left));
            }
          }
        }
      }

    # Gauge cards on various themes and styles need a background color
    "ha-card ha-gauge$": |
      .gauge {
        --primary-background-color: var(--lcars-dark-gray);
      }

    # To-Do List Card
    "ha-card:has(ha-sortable)$": |
      @container style(--lcars-type: "todo-list") {
        h1.card-header {
          background-color: var(--lcars-card-top-color);
          color: var(--lcars-card-top-text);
          border-top-left-radius: var(--list-border-left);
          border-top-right-radius: var(--list-border-right);
          border-bottom-left-radius: var(--list-border-left);
          border-bottom-right-radius: var(--list-border-right);
          box-sizing: border-box;
          margin-block: 5px;
          padding-top: 0.15em;
          padding-right: max(15px, var(--list-border-right));
          padding-bottom: 0px;
          padding-left: max(15px, var(--list-border-left));
          height: 60px;
        }
      }
    "ha-card ha-sortable ha-list":
      "ha-check-list-item$": |
        @container style(--lcars-type: "todo-list") {
          span {
            height: 100%;
            --mdc-list-item-graphic-margin: 0px;

            ha-checkbox {
              border-right: var(--check-border-right) solid var(--lcars-background-color);
              border-left: var(--check-border-left) solid var(--lcars-background-color);
              height: 100%;
              display: flex;
              align-items: center;

              --mdc-checkbox-checked-color: var(--completed-color);

              --right-shift: calc( var(--flex-left) * var(--left-border) );
              --left-shift: calc( var(--flex-right) * var(--right-border) );
              margin-right: calc( 0px - 5px * var(--right-shift) );
              padding-left: calc( 5px * var(--right-shift) );
              margin-left: calc( 0px - 5px * var(--left-shift) );
              padding-right: calc( 5px * var(--left-shift) );
            }
          }
        }
    # Markdown h1 fix
    "ha-markdown$": |
      h1 {
        font-weight: normal;
      }

  # ===================================================== #
  #             Entities Cards Modifications              #
  # ===================================================== #
  card-mod-row-yaml: &card-mod-row |
    .: |
      :host {
        --lcars-height: 60px;
        /* Uses \`lcars-readout-width\` if the user specifies it in card_mod. Otherwise a global value is set, otherwise, vertical border, or a default value). */
        --lcars-global-readout-width: {{ states('sensor.lcars_readout_width') if has_value('sensor.lcars_readout_width') else 'unset' }};
        --lcars-inner-readout-width: var(--lcars-readout-width, var(--lcars-global-readout-width, var(--lcars-vertical-border, 150px)));
      }
      /* Can't theme inside hui-generic-entity-row's dom from here */
      /* So set variables to describe the behavior which are inherited into the dom */
      :host(.no-cap) {
        --lcars-capped: false;
      }
      :host(.entity-lozenge-left) {
        --lcars-entity-class: "entity-lozenge-left";
      }
      :host(.entity-bullet-left) {
        --lcars-entity-class: "entity-bullet-left";
      }
      :host(.entity-capped-left) {
        --lcars-entity-class: "entity-capped-left";
      }
      :host(.entity-barrel-left) {
        --lcars-entity-class: "entity-barrel-left";
      }
      :host(.entity-lozenge-right) {
        --lcars-entity-class: "entity-lozenge-right";
      }
      :host(.entity-bullet-right) {
        --lcars-entity-class: "entity-bullet-right";
      }
      :host(.entity-capped-right) {
        --lcars-entity-class: "entity-capped-right";
      }
      :host(.entity-barrel-right) {
        --lcars-entity-class: "entity-barrel-right";
      }
      /* Handle row types that have a div outside the shadow dom */
      /* .when and .what handle the event-type row */
      /* .text-content handles the timer-type row */
      /* .flex handles the number and input_number slider rows */
      @container style(--lcars-entity-class) {
        div:not(.what):not(.when):not(.text-content) {
          order: 1;
          box-sizing: border-box;
          padding: 0px 6px;
          min-width: var(--lcars-inner-readout-width);
          @container style(--lcars-capped: false) {
            min-width: calc(var(--lcars-inner-readout-width) + 40px);
          }
        }
        div.flex {
          flex-grow: 0;
        }
      }
    "hui-generic-entity-row $": |
      @container style(--lcars-entity-class) {
        state-badge{
          order: 0;
          background-color: var(--lcars-card-button-color);
          --state-icon-color: var(--lcars-card-button-text);
          color: var(--lcars-card-button-text);
          border-top-right-radius: 0px;
          border-bottom-right-radius: 0px;
          border-top-left-radius: 0px;
          border-bottom-left-radius: 0px;
          height: var(--lcars-height);
        }
        div.info.text-content {
          order: 2;
          background-color: var(--lcars-card-button-color);
          --primary-text-color: var(--lcars-card-button-text);
          color: var(--lcars-card-button-text);
          border-top-right-radius: 0px;
          border-bottom-right-radius: 0px;
          border-top-left-radius: 0px;
          border-bottom-left-radius: 0px;
          padding: 0px 12px 6px 3px;
          white-space: unset;
          font-size: 14px;
          box-sizing: border-box;
          height: var(--lcars-height);
          display: flex;
          align-items: flex-end;
          justify-content: end;
        }
        div.value.text-content, slot {
          order: 1;
          background-color: transparent;
          --primary-text-color: var(--lcars-background-text);
          color: var(--lcars-background-text);
          border-top-right-radius: 0px;
          border-bottom-right-radius: 0px;
          border-top-left-radius: 0px;
          border-bottom-left-radius: 0px;
          line-height: 1;
          font-size: calc(var(--lcars-height) * 0.8);
          box-sizing: border-box;
          padding: 0 12px 0.2em 6px;
          min-width: var(--lcars-inner-readout-width);
          white-space: nowrap;
        }
      }
      @container style(--lcars-entity-class: "entity-lozenge-right") 
              or style(--lcars-entity-class: "entity-barrel-right") 
              or style(--lcars-entity-class: "entity-bullet-right")  
              or style(--lcars-entity-class: "entity-capped-right") {
        state-badge {
          order: 2;
        }
        div.info.text-content {
          order: 0;
          padding: 0px 3px 6px 12px;
          justify-content: start;
        }
        div.value.text-content {
          .state {
            text-align: left;
          }
        }
      }
      :host {
        overflow: hidden;
      }
      @container style(--lcars-entity-class: "entity-lozenge-left") 
              or style(--lcars-entity-class: "entity-lozenge-right") 
              or style(--lcars-entity-class: "entity-bullet-left")  
              or style(--lcars-entity-class: "entity-capped-right") {
        :host {
          border-top-left-radius: 9999px;
          border-bottom-left-radius: 9999px;
        }
      }
      @container style(--lcars-entity-class: "entity-lozenge-left") 
              or style(--lcars-entity-class: "entity-lozenge-right") 
              or style(--lcars-entity-class: "entity-bullet-right")  
              or style(--lcars-entity-class: "entity-capped-left") {
        :host {
          border-top-right-radius: 9999px;
          border-bottom-right-radius: 9999px;
        }
      }
      @container style(--lcars-capped: false) {
        state-badge {
          display: none;
        }
        div.value.text-content {
          min-width: calc(var(--lcars-inner-readout-width) + 40px);
        }
        @container style(--lcars-entity-class: "entity-lozenge-left") 
                or style(--lcars-entity-class: "entity-bullet-left") 
                or style(--lcars-entity-class: "entity-barrel-left")  
                or style(--lcars-entity-class: "entity-capped-left") {
          :host {
            border-top-left-radius: 0;
            border-bottom-left-radius: 0;
          }
        }
        @container style(--lcars-entity-class: "entity-lozenge-right") 
                or style(--lcars-entity-class: "entity-barrel-right") 
                or style(--lcars-entity-class: "entity-bullet-right")  
                or style(--lcars-entity-class: "entity-capped-right") {
          :host {
            border-top-right-radius: 9999px;
            border-bottom-right-radius: 9999px;
          }
        }

      }
  # ===================================================== #
  #          TOOLBAR AND DASHBOARD MODIFICATIONS          #
  # ===================================================== #
  card-mod-root-yaml: &card-mod-root |
    ha-tab-group$: |
      :host {
        margin-left: 30px;
        border-left: solid var(--lcars-background-color) 4px;
        --header-height: 40px;
        --ha-tab-indicator-color: transparent !important;
        font-family: var(--font-family) !important;
        text-transform: uppercase;
      }
      .tab-group-top {
        --safe-track-width: 0px;
      }
      .tabs {
        overflow-y: hidden;
      }
    ha-tab-group-tab$: |
      :host {
        --track-width: 0px;
        --tab-bar-height: 48px;
        --ha-tab-padding-start: 5px;
        --ha-tab-padding-end: 5px ;
        flex: 1;

        > div.tab {
          border-right: 4px solid var(--lcars-background-color);
          text-align: center;
          display: block;
          min-height: 40px;
        }
      }
      :host([aria-selected="true"]),
      :host([active]) {
        background-color: var(--lcars-ui-tertiary);
      }
    div.header: |
      .toolbar {
        /* hack fix for rounding errors the cause slight gap between header and sidebar */
        box-shadow: -1px 0px var(--lcars-sidebar-background);
        color: var(--lcars-sidebar-text);
        background-color: var(--lcars-sidebar-background);
        --app-header-border-bottom: 0px;
        border-right: 30px solid var(--lcars-card-top-color);
        border-radius: 0px 0px 0px 0px;
        margin-right: 1px;
        padding: 0px 12px !important;

        /* -------- Sidebar Toggle -------- */
        ha-menu-button {
          display: none;
          color: transparent;
        }
        @media screen and (max-width: 870px) {
          ha-button-menu > ha-icon-button {
            margin-right: -48px;
            padding-right: unset !important;
            margin-left: unset !important;
          }
          ha-icon-button {
            padding-right: unset !important;
            margin-left: unset !important;
          }
          ha-menu-button {
            display: initial !important;
            color: var(--lcars-ui-primary-text) !important;
            padding-right: 0px !important;
            margin-right: -22px;
            margin-left: -16px;
          }
          .main-title
          {
            margin-left: 22px !important;
          }
        }
        
        /* -------- Inner elbow -------- */
        &::before {
          content: "";
          position: fixed;
          height: 40px;
          width: 100px;
          background-color: transparent;
          border-top-left-radius: 40px;
          box-shadow: -40px 0 0 0 var(--lcars-ui-primary);
          margin-top: 80px;
          margin-left: -12px;
          z-index: 9997;
          pointer-events: none;
        }

        /* -------- Clock -------- */
        &::after {
          content: "{{ states('sensor.lcars_header') if has_value('sensor.lcars_header') else states('sensor.time') if has_value('sensor.time') else 'LCARS' }}";
          color: var(--lcars-ui-app-header-clock);
          visibility: visible;
          font-size: var(--header-font-size);
          font-family: var(--font-family);
          margin: 0px -12px 0px 0px;
          padding: 0px 0px 0px 0px;
          background-color: var(--lcars-background-color);
          vertical-align: middle;
          height: var(--header-height);
          border-right: 5px solid var(--lcars-background-color);
          border-left: 5px solid var(--lcars-background-color);
          text-transform: uppercase;
          white-space: nowrap;
          line-height: 0.95;
        }
        @media screen and (max-width: 870px) {
          &::after {
            content: "";
            border-left: 0px solid var(--lcars-background-color);
          }
        }
      }


    div.edit-mode: |
      /* =============================================== */
      /*            EDIT MODE SETTINGS                   */
      /* =============================================== */
      .tab-bar {
        background: var(--lcars-background-color);
        padding-left: 40px;
      }
      ha-tab-group {
        margin-left: 0px;
        border-left: none;
        height: 40px !important;
        color: var(--lcars-text-light);
        --icon-primary-color: var(--lcars-text-light);
      }
      #add-view {
        background-color: var(--lcars-card-top-color);
        height: 40px;
        border-radius: 0px 0px 0px 0px;
        border-left: solid var(--lcars-background-color) 4px;
      }
      div.main-title {
        color: var(--lcars-ui-primary-text);

        .edit-icon {
          color: var(--lcars-ui-primary-text) !important;
        }
      }
      .exit-edit-mode {
        --wa-color-fill-normal: var(--lcars-ui-tertiary);
        --wa-color-on-normal: var(--lcars-text-light);
        --button-color-fill-normal-hover:  color-mix(in srgb, var(--lcars-ui-tertiary), black 30%);;
      }
      .toolbar .action-items {
        --text-primary-color: var(--lcars-ui-primary-text);
      }


    .: |
      /* =============================================== */
      /*            VIEW AND PANEL SETTINGS              */
      /* =============================================== */

      hui-view {
        container-type: inline-size;
        container-name: view-container;
      }

      hui-panel-view {
        overflow: hidden;
      }      

      @container view-container (min-width: 0px) {
        hui-panel-view {
          margin: 5px 0px 0px 5px !important;
          max-height: calc(100vh - 45px);
        }
      }

      @container view-container style(--kiosk-header-height: 0px) {
        hui-panel-view {
          max-height: 100vh;
          margin: 0px 0px 0px 0px !important;
          padding: 0px 0px 0px 0px !important;
        }
      }
      #view {
        --primary-background-color: var(--primary-background-color);
        --lovelace-background: var(--primary-background-color);
        --lcars-horizontal-border: {{ states('input_number.lcars_horizontal') if has_value('input_number.lcars_horizontal') else 10 }}px !important;
        --lcars-vertical-border: {{ states('input_number.lcars_vertical') if has_value('input_number.lcars_vertical') else 35 }}px !important;
        --lcars-middle-vertical-border: {{ states('input_number.lcars_vertical') if has_value('input_number.lcars_vertical') else 35 }}px !important;
        --menu-font-size: {{ states('input_number.lcars_menu_font') if has_value('input_number.lcars_menu_font') else 24 }}px !important;
        --lcars-sound: {{ true if is_state('input_boolean.lcars_sound', 'on') else false }};
        --lcars-texture: {{ true if is_state('input_boolean.lcars_texture', 'on') else false }};
      }
      hui-view::-webkit-scrollbar {
        display: none;
      }
      hui-view {
        scrollbar-width: none !important;
      }
      hui-masonry-view {
        padding-right: 23px;
      }

      {% if not is_state('input_boolean.lcars_sound', 'on') %}
      .header {
        --lcars-sound: false;
      }
      {% else %}
      .header {
        --lcars-sound: true;
      }
      {% endif %}

  # ===================================================== #
  #                 CONFIG MODIFICATIONS                  #
  # ===================================================== #
  card-mod-config-yaml: &card-mod-config |
    .: |
      :host {
        /* Force these to be recomputed to prevent eager variable resolution    */
        /* There are too many places in the settings pages that use light and   */
        /* dark font on various background colors. We can't track them all.     */
        /* The solution is to use a medium luminance background and default     */
        /* to light text. Some places will use black, but that's still legible. */
        --lcars-primary-text: var(--lcars-text-light);
        --lcars-secondary-text: var(--lcars-text-light);
        --primary-text-color: var(--lcars-primary-text);
        --secondary-text-color: var(--lcars-secondary-text);
        --card-background-color: var(--lcars-settings-card-color);
        --ha-card-background: var(--lcars-settings-card-color);
        --ha-card-background-color: var(--lcars-settings-card-color);
        --md-sys-color-surface: var(--lcars-settings-card-color);
        --ha-card-header-color: var(--lcars-primary-text);
        --ha-color-text-primary: var(--lcars-primary-text);
        --primary-text-color: var(--lcars-primary-text);
        --secondary-text-color: var(--lcars-primary-text);
        --text-primary-color: var(--lcars-primary-text);
        --mdc-select-label-ink-color: var(--lcars-secondary-text);
        --mdc-select-ink-color: var(--lcars-primary-text);
        --mdc-text-field-label-ink-color: var(--lcars-primary-text);
        --mdc-text-field-fill-color: transparent;
        --mdc-text-field-ink-color: var(--lcars-primary-text);
        --wa-form-control-value-color: var(--lcars-primary-text);
      }
      ha-panel-config{
        &::before {
          @media screen and (min-width: 601px) {
            content: "";
            position: fixed;
            height: 40px;
            width: 100px;
            background-color: transparent;
            border-top-left-radius: 40px;
            box-shadow: -40px 0 0 0 var(--lcars-ui-primary);
            margin-top: 40px;
            margin-left: 0px;
            z-index: 5;
            pointer-events: none;
          }
        }
      }

    # ------------------- Dev Tools Submenu ---------------------------------- #
    "ha-panel-developer-tools $": |
      .header ha-tab-group {
        background-color: var(--lcars-background-color);
        border-top-left-radius: var(--lcars-inner-radius);
        --track-width: unset;

        ha-tab-group-tab {
          border-radius: 99px;
          background-color: var(--lcars-card-button-color);
          color: var(--lcars-card-button-text);
          margin: 10px 10px 0px 10px;
          padding-left: 40px;
        }

        ha-tab-group-tab[active] {
          background-color: var(--lcars-ui-tertiary);
          border-bottom: 0px;
          margin-bottom: 0px;
        }
        
      }
      developer-tools-router {
        padding-top: 112px !important;
      }

    # ------------------- Bottom Nav Menu Fixes ------------------------------ #
    # Disappointingly, "* $ hass-tabs-subpage $" doesn't seem to work?
    # So I have to enumerate anywhere the bottom bar nav appears
    # ------------------- Automation/Script Editor Drag States --------------- #
    "ha-config-automation $ ha-automation-editor $": |
      .sortable-ghost,
      .sortable-drag {
        background-color: var(--lcars-ui-secondary) !important;
      }
    "ha-config-script $ ha-script-editor $": |
      .sortable-ghost,
      .sortable-drag {
        background-color: var(--lcars-ui-secondary) !important;
      }
    "ha-config-automation $ hass-tabs-subpage $": |
      div.bottom-bar {
        --header-height: 50px;
      }
    "ha-config-blueprint $ hass-tabs-subpage $": |
      div.bottom-bar {
        --header-height: 50px;
      }
    "ha-config-script $ hass-tabs-subpage $": |
      div.bottom-bar {
        --header-height: 50px;
      }
    "ha-config-scene $ hass-tabs-subpage $": |
      div.bottom-bar {
        --header-height: 50px;
      }
    "ha-config-integrations $ hass-tabs-subpage $": |
      div.bottom-bar {
        --header-height: 50px;
      }
    "ha-config-devices $ hass-tabs-subpage $": |
      div.bottom-bar {
        --header-height: 50px;
      }
    "ha-config-entities $ hass-tabs-subpage $": |
      div.bottom-bar {
        --header-height: 50px;
      }
    "ha-config-helpers $ hass-tabs-subpage $": |
      div.bottom-bar {
        --header-height: 50px;
      }
    "ha-config-areas $ hass-tabs-subpage $": |
      div.bottom-bar {
        --header-height: 50px;
      }
    "ha-config-labels $ hass-tabs-subpage $": |
      div.bottom-bar {
        --header-height: 50px;
      }
    "ha-config-zone $ hass-tabs-subpage $": |
      div.bottom-bar {
        --header-height: 50px;
      }
    "ha-config-person $ hass-tabs-subpage $": |
      div.bottom-bar {
        --header-height: 50px;
      }
    "ha-config-users $ hass-tabs-subpage $": |
      div.bottom-bar {
        --header-height: 50px;
      }
    "ha-config-voice-assistants ha-config-voice-assistants-assistants $":
      "hass-tabs-subpage $": |
        div.bottom-bar {
          --header-height: 50px;
        }
    "ha-config-voice-assistants ha-config-voice-assistants-expose $ hass-tabs-subpage $": |
      div.bottom-bar {
        --header-height: 50px;
      }
    "ha-config-system-navigation $ hass-subpage ha-config-section ha-card":
      "$": |
        :host {
          background-color: transparent !important;
          border-radius: 0 !important;
          margin-top: 32px !important;
        }
      "ha-config-navigation-list $": |
        ha-list-nav {
        
          ha-list-item-button {
            background-color: var(--lcars-card-mid-color);
            --primary-text-color: var(--lcars-card-mid-text);
            --secondary-text-color: color-mix(in oklch, var(--primary-text-color) 80%, transparent);
            border-radius: 999px;
            margin-block: 5px;
          }
          ha-list-item-button:first-child {
            background-color: var(--lcars-card-top-color);
            --primary-text-color: var(--lcars-card-top-text);
            --secondary-text-color: color-mix(in oklch, var(--primary-text-color) 80%, transparent);
          }
          ha-list-item-button:last-child {
            background-color: var(--lcars-card-bottom-color);
            --primary-text-color: var(--lcars-card-bottom-text);
            --secondary-text-color: color-mix(in oklch, var(--primary-text-color) 80%, transparent);
          }
        }
    "ha-config-dashboard $ ha-top-app-bar-fixed ha-config-section":
      .: |
        ha-card:has(ha-config-repairs) {
          --lcars-alert-color: var(--lcars-alert-red);
        }
        ha-card:has(ha-config-updates) {
          --lcars-alert-color: var(--lcars-alert-yellow);
        }
      "ha-card":
        .: |
          div.dashboard-alert-title {
            text-transform: uppercase;
            font-size: 30px !important;
            line-height: 1;
            border-inline: 30px solid var(--lcars-alert-color);
            border-top-left-radius: 25px;
            padding-top: 8px !important;
            padding-bottom: 12px !important;
            background-color:  color-mix(in srgb, var(--lcars-alert-color), transparent 66%);
            border-top-right-radius: 25px;
            border-bottom-left-radius: 25px;
            border-bottom-right-radius: 25px;
          }
        "ha-config-navigation $ ha-config-navigation-list$": | 
          /* -------- Settings Page Lists -------- */
          ha-list-nav {
            ha-list-item-button {
              background-color: var(--lcars-card-mid-color);
              --primary-text-color: var(--lcars-card-mid-text);
              --secondary-text-color: color-mix(in oklch, var(--primary-text-color) 80%, transparent);
              border-radius: 999px;
              margin-block: 5px;
            }
            ha-list-item-button:first-child {
              background-color: var(--lcars-card-top-color);
              --primary-text-color: var(--lcars-card-top-text);
              --secondary-text-color: color-mix(in oklch, var(--primary-text-color) 80%, transparent);
            }
            ha-list-item-button:last-child {
              background-color: var(--lcars-card-bottom-color);
              --primary-text-color: var(--lcars-card-bottom-text);
              --secondary-text-color: color-mix(in oklch, var(--primary-text-color) 80%, transparent);
            }
          }
        "ha-config-repairs$": |
          /* -------- Settings Page Repairs List -------- */
          ha-list-base {
            padding-block: 5px;

            ha-list-item-button {
              background-color: color-mix(in srgb, var(--lcars-alert-red), transparent 66%);
              margin: 5px 30px;
            }
          }
        "ha-config-updates$": |
          /* -------- Settings Page Updates List -------- */
          ha-list-base {
            padding-block: 5px;

            ha-list-item-button {
              background-color: color-mix(in srgb, var(--lcars-alert-yellow), transparent 66%);
              margin: 5px 30px;
            }
          }
        "$": |
          :host {
            background-color: transparent !important;
            --primary-text-color: var(--lcars-background-text);
            --secondary-text-color: var(--lcars-background-text);
            border-radius: 0 !important;
            margin-top: 32px !important;
          }
    "ha-config-section-updates $ hass-subpage div.content":
      "ha-card":
        "$": |
          /* -------- Updates Page List -------- */
          :host {
            background-color: transparent !important;
            --primary-text-color: var(--lcars-background-text);
            --secondary-text-color: var(--lcars-background-text);
            border-radius: 0 !important;
            margin-top: 32px !important;
          }
        .: |
          .title{
            text-transform: uppercase;
            font-size: 30px !important;
            line-height: 1;
            border-inline: 30px solid var(--lcars-alert-yellow);
            border-top-left-radius: 25px;
            padding-top: 8px !important;
            padding-bottom: 12px !important;
            background-color:  color-mix(in srgb, var(--lcars-alert-yellow), transparent 66%);
            border-top-right-radius: 25px;
            border-bottom-left-radius: 25px;
            border-bottom-right-radius: 25px;
          }
        "div.card-content ha-config-updates$": |
            
            ha-list-base {
              --md-sys-color-surface: transparent !important;
              padding-block: 5px;

              ha-list-item-button {
                background-color: color-mix(in srgb, var(--lcars-alert-yellow), transparent 66%);
                margin: 5px 30px;
              }
            }
    "ha-config-repairs-dashboard $ hass-subpage div.content":
      "ha-card":
        "$": |
          /* -------- Repairs Page List -------- */
          :host {
            background-color: transparent !important;
            --primary-text-color: var(--lcars-background-text);
            --secondary-text-color: var(--lcars-background-text);
            border-radius: 0 !important;
            margin-top: 32px !important;
          }
        .: |
          .title{
            text-transform: uppercase;
            font-size: 30px !important;
            line-height: 1;
            border-inline: 30px solid var(--lcars-alert-red);
            border-top-left-radius: 25px;
            padding-top: 8px !important;
            padding-bottom: 12px !important;
            background-color:  color-mix(in srgb, var(--lcars-alert-red), transparent 66%);
            border-top-right-radius: 25px;
            border-bottom-left-radius: 25px;
            border-bottom-right-radius: 25px;
          }
        "div.card-content ha-config-repairs$": |
          ha-list-base {
            --md-sys-color-surface: transparent !important;
            padding-block: 5px;

            ha-list-item-button {
              background-color: color-mix(in srgb, var(--lcars-alert-red), transparent 66%);
              margin: 5px 30px;
            }
          }
    "ha-config-logs $ hass-subpage div search-input.header $ ha-textfield$": |
      label.mdc-text-field--filled {
        height: var(--header-height);

        span#label {
          line-height: 1.25rem;
        }
        input.mdc-text-field__input {
          align-self: end;
        }
      }
    "ha-config-info $ hass-subpage div.content":
      "ha-card": |
        :is(.header) {
          border-top: var(--lcars-horizontal-border) solid var(--lcars-card-top-color);
          border-inline: var(--lcars-vertical-border) solid var(--lcars-card-top-color);
          border-top-left-radius: var(--lcars-outer-radius);
          border-top-right-radius: var(--lcars-outer-radius);
          border-bottom-left-radius: 0px;
          border-bottom-right-radius: 0px;
          background-color: transparent;
          --lcars-primary-text: var(--lcars-text-light);
          --lcars-secondary-text: color-mix(in oklch, var(--lcars-primary-text) 80%, var(--lcars-ui-mix-color))


          &::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            height: calc(2 * var(--lcars-inner-radius) + 2px);
            width: calc(2 * var(--lcars-inner-radius) + 2px);
            background-color: transparent;
            border-top-left-radius: var(--lcars-inner-radius);
            box-shadow: calc(var(--lcars-inner-radius) * -1) 0 0 0 var(--lcars-card-top-color);
            margin-top: 0px;
            margin-left: 0px;
            z-index: 5;
            pointer-events: none;
          }
          &::after {
            content: "";
            position: absolute;
            top: 0;
            right: 0;
            height: calc(2 * var(--lcars-inner-radius) + 2px);
            width: calc(2 * var(--lcars-inner-radius) + 2px);
            background-color: transparent;
            border-top-right-radius: var(--lcars-inner-radius);
            box-shadow: calc(var(--lcars-inner-radius)) 0 0 0 var(--lcars-card-top-color);
            margin-top: 0px;
            margin-right: 0px;
            z-index: 5;
            pointer-events: none;
          }
        }
        :is(.ohf) {
          border-bottom: var(--lcars-horizontal-border) solid var(--lcars-card-bottom-color);
          border-inline: var(--lcars-vertical-border) solid var(--lcars-card-bottom-color);
          border-bottom-left-radius: var(--lcars-outer-radius);
          border-bottom-right-radius: var(--lcars-outer-radius);
          border-top-left-radius: 0px;
          border-top-right-radius: 0px;
          background-color: transparent;
          --lcars-primary-text: var(--lcars-background-text);
          --lcars-secondary-text: color-mix(in oklch, var(--lcars-primary-text) 80%, var(--lcars-ui-mix-color));
          margin-bottom: 6px;

          &::before {
            content: "";
            position: absolute;
            bottom: 0;
            left: 0;
            height: calc(2 * var(--lcars-inner-radius) + 2px);
            width: calc(2 * var(--lcars-inner-radius) + 2px);
            background-color: transparent;
            border-bottom-left-radius: var(--lcars-inner-radius);
            box-shadow: calc(var(--lcars-inner-radius) * -1) 0 0 0 var(--lcars-card-bottom-color);
            margin-top: 0px;
            margin-left: 0px;
            z-index: 5;
            pointer-events: none;
          }
          &::after {
            content: "";
            position: absolute;
            bottom: 0;
            right: 0;
            height: calc(2 * var(--lcars-inner-radius) + 2px);
            width: calc(2 * var(--lcars-inner-radius) + 2px);
            background-color: transparent;
            border-bottom-right-radius: var(--lcars-inner-radius);
            box-shadow: calc(var(--lcars-inner-radius)) 0 0 0 var(--lcars-card-bottom-color);
            margin-top: 0px;
            margin-right: 0px;
            z-index: 5;
            pointer-events: none;
          }

        }
        :is(.pages) {
          background-color: transparent !important;
          --primary-text-color: var(--lcars-background-text);
          --secondary-text-color: var(--lcars-background-text);
          border-radius: 0 !important;
          margin-top: 6px !important;
          padding: 0px;

          ha-md-list {
            --md-sys-color-surface: transparent !important;
            padding-top: 0px;
          
            ha-md-list-item {
              background-color: var(--lcars-card-mid-color);
              --md-list-item-label-text-color: var(--lcars-card-mid-text);
              --md-list-item-supporting-text-color: var(--lcars-card-mid-text);
              border-radius: 999px;
              margin-block: 5px;
            }
            ha-md-list-item:first-child {
              background-color: var(--lcars-card-top-color);
              --md-list-item-label-text-color: var(--lcars-card-top-text);
              --md-list-item-supporting-text-color: var(--lcars-card-top-text);
            }
            ha-md-list-item:last-child {
              background-color: var(--lcars-card-bottom-color);
              --md-list-item-label-text-color: var(--lcars-card-bottom-text);
              --md-list-item-supporting-text-color: var(--lcars-card-bottom-text);
            }
          }
        }

  # ===================================================== #
  #             USER PROFILE MODIFICATIONS                #
  # ===================================================== #
  card-mod-profile-yaml: |
    .: |
      :host {
        /* Force these to be recomputed to prevent eager variable resolution    */
        /* There are too many places in the settings pages that use light and   */
        /* dark font on various background colors. We can't track them all.     */
        /* The solution is to use a medium luminance background and default     */
        /* to light text. Some places will use black, but that's still legible. */
        --lcars-primary-text: var(--lcars-text-light);
        --lcars-secondary-text: var(--lcars-text-light);
        --primary-text-color: var(--lcars-primary-text);
        --secondary-text-color: var(--lcars-secondary-text);
        --card-background-color: var(--lcars-settings-card-color);
        --ha-card-background: var(--lcars-settings-card-color);
        --ha-card-background-color: var(--lcars-settings-card-color);
        --md-sys-color-surface: var(--lcars-settings-card-color);
        --ha-card-header-color: var(--lcars-primary-text);
        --ha-color-text-primary: var(--lcars-primary-text);
        --primary-text-color: var(--lcars-primary-text);
        --secondary-text-color: var(--lcars-primary-text);
        --text-primary-color: var(--lcars-primary-text);
        --mdc-select-label-ink-color: var(--lcars-secondary-text);
        --mdc-select-ink-color: var(--lcars-primary-text);
        --mdc-text-field-label-ink-color: var(--lcars-primary-text);
        --mdc-text-field-fill-color: transparent;
        --mdc-text-field-ink-color: var(--lcars-primary-text);
        --wa-form-control-value-color: var(--lcars-primary-text);
      }
    $: |
      :host {
        font-family: var(--font-family);
      }
    "ha-profile-section-general $ hass-tabs-subpage $": |
      div.bottom-bar {
        --header-height: 50px;
      }
    "ha-profile-section-security $ hass-tabs-subpage $": |
      div.bottom-bar {
        --header-height: 50px;
      }

  # ===================================================== #
  #                 DIALOG MODIFICATIONS                  #
  # ===================================================== #
  card-mod-dialog-yaml: |
    .: |
      :host {
        /* Force these to be recomputed to prevent eager variable resolution    */
        /* There are too many places in the settings pages that use light and   */
        /* dark font on various background colors. We can't track them all.     */
        /* The solution is to use a medium luminance background and default     */
        /* to light text. Some places will use black, but that's still legible. */
        --lcars-primary-text: var(--lcars-text-light);
        --lcars-secondary-text: var(--lcars-text-light);
        --primary-text-color: var(--lcars-primary-text);
        --secondary-text-color: var(--lcars-secondary-text);
        --card-background-color: var(--lcars-settings-card-color);
        --ha-card-background: var(--lcars-settings-card-color);
        --ha-card-background-color: var(--lcars-settings-card-color);
        --md-sys-color-surface: var(--lcars-settings-card-color);
        --ha-card-header-color: var(--lcars-primary-text);
        --ha-color-text-primary: var(--lcars-primary-text);
        --primary-text-color: var(--lcars-primary-text);
        --secondary-text-color: var(--lcars-primary-text);
        --text-primary-color: var(--lcars-primary-text);
        --mdc-select-label-ink-color: var(--lcars-secondary-text);
        --mdc-select-ink-color: var(--lcars-primary-text);
        --mdc-text-field-label-ink-color: var(--lcars-primary-text);
        --mdc-text-field-fill-color: transparent;
        --mdc-text-field-ink-color: var(--lcars-primary-text);
        --wa-form-control-value-color: var(--lcars-primary-text);
      }
    $: |
      :host {
        font-family: var(--font-family);
      }
  # ===================================================== #
  #              MORE INFO MODIFICATIONS                  #
  # ===================================================== #
  card-mod-more-info-yaml: |
    .: |
      :host {
        /* Force these to be recomputed to prevent eager variable resolution    */
        /* There are too many places in the settings pages that use light and   */
        /* dark font on various background colors. We can't track them all.     */
        /* The solution is to use a medium luminance background and default     */
        /* to light text. Some places will use black, but that's still legible. */
        --lcars-primary-text: var(--lcars-text-light);
        --lcars-secondary-text: var(--lcars-text-light);
        --primary-text-color: var(--lcars-primary-text);
        --secondary-text-color: var(--lcars-secondary-text);
        --card-background-color: var(--lcars-settings-card-color);
        --ha-card-background: var(--lcars-settings-card-color);
        --ha-card-background-color: var(--lcars-settings-card-color);
        --md-sys-color-surface: var(--lcars-settings-card-color);
        --ha-card-header-color: var(--lcars-primary-text);
        --ha-color-text-primary: var(--lcars-primary-text);
        --primary-text-color: var(--lcars-primary-text);
        --secondary-text-color: var(--lcars-primary-text);
        --text-primary-color: var(--lcars-primary-text);
        --mdc-select-label-ink-color: var(--lcars-secondary-text);
        --mdc-select-ink-color: var(--lcars-primary-text);
        --mdc-text-field-label-ink-color: var(--lcars-primary-text);
        --mdc-text-field-fill-color: transparent;
        --mdc-text-field-ink-color: var(--lcars-primary-text);
        --wa-form-control-value-color: var(--lcars-primary-text);
      }
      button.breadcrumb {
        font-family: var(--font-family);
      }
    $: |
      :host {
        font-family: var(--font-family);
      }

  # ===================================================== #
  #                 SIDEBAR MODIFICATIONS                 #
  # ===================================================== #
  card-mod-sidebar-yaml: &card-mod-sidebar |
    ha-list-item-button$: |
      #item {
        column-gap: 0;
        padding: 0;
        align-items: stretch;
      }

    .: |
      :host {
        content: "";
        border-right: 0px !important;
        border-top-left-radius: 80px;
        box-shadow: var(--lcars-background-color) 0px -130px 0px 0px;
        --menu-font-size: {{ states('input_number.lcars_menu_font') if has_value('input_number.lcars_menu_font') else 24 }}px;
      }
      .title {
        display: none !important;
      }
      .fade-top {
        display: none;
      }
      .fade-bottom {
        display: none;
      }
      .panels-list > .wrapper::before {
        content: "";
        position: absolute;
        bottom: 0;
        left: 56px;
        height: calc(100% - 75px);
        border-left: 5px solid var(--lcars-background-color);
      
      }
      ha-list-nav.before-spacer {
        margin-top: 70px;
        margin-bottom: 0px;
        height: 100%;
        border-bottom: 5px solid var(--lcars-background-color);
        border-top: 5px solid var(--lcars-background-color);
        font-family: var(--font-family);
      }
      ha-list-nav.after-spacer {
        padding: 0;
        margin: 0;
      }
      ha-list-item-button {
        border-bottom: 5px solid;
        background-color: var(--lcars-sidebar-item-color);
        width: 100% !important;
        margin: unset !important;
        border-radius: unset !important;
        border-color: var(--lcars-background-color);
        color: var(--lcars-sidebar-text) !important;

        span.item-text,
        span.badge {
          font-family: var(--font-family);
          text-align: right;
          text-transform: uppercase;
          line-height: 1;
          color: var(--lcars-sidebar-text);
        }
        span.item-text {
          font-size: var(--menu-font-size) !important;
          align-content: center;
          align-self: end;
          box-sizing: border-box;
          height: 100%;
          min-height: 40px;
          margin: 0px 0px 0px 0px;
          padding: 9px 8px 11px 5px;
          width: 100%;
        }
        span.badge {
          position: absolute;
          display: block;
          top: unset;
          left: 0px;
          bottom: 0px;
          background-color: var(--lcars-background-color);
          border-radius: 0px;
          height: 100%;
          font-size: 38px;
          line-height: 1;
          min-width: 46px;
          border-top: 0px solid var(--lcars-background-color);
          overflow: hidden;
          padding: 0 0 0 0;
          margin: 0px;
          text-align: center;
          transition: font-size 0.2s ease;
        }      
      
        &.configuration {
          background-color: var(--lcars-ui-config-button);

          > span.item-text {
            color: var(--lcars-ui-config-button);
            background-color: var(--lcars-background-color);
            border: 3px var(--lcars-ui-config-button) solid;
            padding-top: 6px;
            padding-bottom: 8px;
          }

          > span.badge {
            color: var(--lcars-ui-config-icon);
            border-left: 5px var(--lcars-ui-config-icon) solid;
            border-right: 5px var(--lcars-ui-config-icon) solid;
          }            
          > ha-icon,
          > ha-svg-icon {
            color: var(--lcars-sidebar-text);
            background-color: var(--lcars-ui-config-icon);
          }     
        }

        &.notifications {
          > span.badge {
            color: var(--lcars-sidebar-notification-color) !important;
            border-left: 5px var(--lcars-sidebar-notification-color) solid;
            border-right: 5px var(--lcars-sidebar-notification-color) solid;
          }
        }

        &.user {
          background-color: var(--lcars-sidebar-icon-background);

          &:not(.selected) span.item-text {
            color: var(--lcars-sidebar-icon-color);
          }

        }

        &.selected {
          background-color: var(--lcars-sidebar-selected-color);

          &::before {
            display: none;
          }
          > span.item-text {
            color: var(--lcars-sidebar-selected-color);
            background-color: var(--lcars-background-color);
            border: 3px var(--lcars-sidebar-selected-color) solid;
            padding-top: 6px;
            padding-bottom: 8px;
          }

          > ha-icon,
          > ha-user-badge,
          > ha-svg-icon {
            background-color: var(--lcars-sidebar-selected-color);
          }
          > span.badge {
            color: var(--lcars-sidebar-selected-color);
            fill: var(--lcars-sidebar-selected-color);
            border-left-color: var(--lcars-sidebar-selected-color);
            border-right-color: var(--lcars-sidebar-selected-color);
          }
          > ha-user-badge {
            margin-right: 0px;
          }
        }
      }

      div.menu {
        overflow: visible;

        ha-icon-button {
          margin-top: 150px;
          margin-right: 94px;
          margin-left: 0px;
          z-index: 99;
        }
      }
      @media screen and (max-width: 870px) {
        .ha-scrollbar::before {
          content: "";
          position: fixed;
          top: 40px;
          left: 56px;
          border-left: 5px var(--lcars-background-color) solid;
          border-top: 5px var(--lcars-background-color) solid;
          border-top-left-radius: calc(var(--lcars-inner-radius) + var(--lcars-outer-radius) / 2 );
          background: transparent;
          width: calc( var(--mdc-drawer-width,256px) - 61px );
          height: 70px;
        }
      }

      ha-icon,
      ha-svg-icon,
      ha-user-badge {
        left: 0px;
        align-content: center;
        box-sizing: border-box;
        min-width: 61px;
        padding-right: 16px;
        padding-left: 16px;
        min-height: 100%;
        background-color: var(--lcars-sidebar-item-color);
        border-right: 5px solid var(--lcars-background-color);
      }
      ha-user-badge {
        box-sizing: border-box;
        width: calc( var(--mdc-icon-size,24px) + 37px);
        padding-block: 8px;
      }

      :host([expanded]) {
        /* as of 2026.06, the 100% width isn't filling the slot */
        width: var(--ha-sidebar-width);

        ha-list-item-button:not(.selected) {
          ha-icon,
          ha-user-badge,
          ha-svg-icon {
            color: var(--lcars-sidebar-icon-color);
            background-color: var(--lcars-sidebar-icon-background);
          }
        }
        span.badge {
          font-size: max( 38px, var(--menu-font-size) + 10px );
        }
        ha-user-badge {
          padding-block: max( 8px, var(--menu-font-size)/2 - 2px );
        }
      }
      .divider {
        display: none;
      }
    "ha-tooltip $": |
      div.body {
        padding-top: 9px !important;
        padding-bottom: 11px !important;
        min-height: 40px;
        line-height: var(--menu-font-size);
        margin-top: -5px;
        margin-left: -3px;
        padding-right: 20px;
        border-radius: 0px 999px 999px 9px;
      }

# ======================================================= #
#                    THEME DEFINITIONS                    #
# ======================================================= #
#
# DO NOT edit this section by hand.
# Edit src/themes/<name>.yaml and run generate_themes.py.

LCARS 25C:
  card-mod-theme: LCARS 25C
  <<: *lcars-variables
  <<: *base
  <<: *card-mod-css
  # UI Colors
  lcars-ui-primary: var(--lcars-primary-gray)
  lcars-ui-primary-text: var(--lcars-text-dark)
  lcars-ui-secondary: var(--lcars-medium-gray)
  lcars-ui-secondary-text: var(--lcars-text-dark)
  lcars-ui-tertiary: var(--lcars-alt-orange)
  lcars-ui-tertiary-text: var(--lcars-text-dark)
  lcars-ui-quaternary: var(--lcars-primary-gray)
  lcars-ui-quaternary-text: var(--lcars-text-dark)
  lcars-ui-accent-color: var(--lcars-orange)
  lcars-ui-accent-text: var(--lcars-text-dark)
  lcars-background-color: var(--lcars-black)
  lcars-background-text: var(--lcars-text-light)
  lcars-ui-text-heading: var(--lcars-text-gray)
  # Header / Sidebar
  lcars-ui-app-header-background-color: var(--lcars-black)
  lcars-ui-app-header-text-color: var(--lcars-ui-primary-text)
  lcars-ui-app-header-clock: var(--lcars-pale-orange)
  lcars-ui-config-button: var(--lcars-cyan)
  lcars-ui-config-icon: var(--lcars-ui-config-button)
  # Sidebar
  lcars-sidebar-background: var(--lcars-ui-primary)
  lcars-sidebar-item-color: var(--lcars-ui-secondary)
  lcars-sidebar-text: var(--lcars-ui-secondary-text)
  lcars-sidebar-icon-color: var(--lcars-card-top-text)
  lcars-sidebar-icon-background: var(--lcars-card-top-color)
  lcars-sidebar-selected-color: var(--lcars-ui-tertiary)
  lcars-sidebar-notification-color: var(--lcars-ui-tertiary)
  # Card colors
  lcars-card-top-color: var(--lcars-alt-dark-gray)
  lcars-card-mid-color: var(--lcars-primary-gray)
  lcars-card-button-color: var(--lcars-medium-gray)
  lcars-card-bottom-color: var(--lcars-alt-dark-gray)
  lcars-settings-card-color: "#6E758D"
  # Card text
  lcars-card-top-text: var(--lcars-text-light)
  lcars-card-mid-text: var(--lcars-text-dark)
  lcars-card-button-text: var(--lcars-text-dark)
  lcars-card-bottom-text: var(--lcars-text-light)
  # Status colors
  success-color: var(--lcars-alt-green)
  warning-color: var(--lcars-light-orange)
  error-color: var(--lcars-alt-orange)
  # Ripple
  lcars-ripple-color: var(--lcars-ui-mix-color)
  lcars-ripple-pressed-opacity: 0.4
  lcars-ripple-hover-opacity: 0.12
  # HA Color Palette
  ha-color-primary-05: color-mix(in oklch, var(--lcars-ui-tertiary) 10%, black)
  ha-color-primary-10: color-mix(in oklch, var(--lcars-ui-tertiary) 22%, black)
  ha-color-primary-20: color-mix(in oklch, var(--lcars-ui-tertiary) 44%, black)
  ha-color-primary-30: color-mix(in oklch, var(--lcars-ui-tertiary) 67%, black)
  ha-color-primary-40: var(--lcars-ui-tertiary)
  ha-color-primary-50: color-mix(in oklch, var(--lcars-ui-tertiary) 88%, white)
  ha-color-primary-60: color-mix(in oklch, var(--lcars-ui-tertiary) 70%, white)
  ha-color-primary-70: color-mix(in oklch, var(--lcars-ui-tertiary) 50%, white)
  ha-color-primary-80: color-mix(in oklch, var(--lcars-ui-tertiary) 30%, white)
  ha-color-primary-90: color-mix(in oklch, var(--lcars-ui-tertiary) 15%, white)
  ha-color-primary-95: color-mix(in oklch, var(--lcars-ui-tertiary) 8%, white)
  # Derived RGB
  rgb-card-background-color: "109,116,140"
  rgb-primary-text-color: "255,255,255"
  rgb-secondary-text-color: "255,255,255"
  rgb-primary-color: "231,68,42"
  rgb-accent-color: "255,119,0"
  rgb-primary-background-color: "0,0,0"
  rgb-secondary-background-color: "109,116,140"
  # Theme-specific
  lcars-tooltip-background: var(--lcars-ui-quaternary)
  lcars-tooltip-text: var(--lcars-ui-quaternary-text)
  lcars-tab-selected-bg: url("data:image/svg+xml,%3C!-- sample rectangle --%3E%3Csvg width='256' height='256' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='transparent'%3E%3Canimate attributeName='fill' values='%23e7442a;%23e7442a;%236d748c' begin='0s' dur='5s' calcMode='discrete' repeatCount='indefinite' /%3E%3C/rect%3E%3C/svg%3E")
  modes:
    light:
      lcars-ui-mix-color: black
      lcars-backlight-center: "#ffffff30"
      lcars-backlight-middle: transparent
      lcars-backlight-middle-location: 60%
      lcars-backlight-outer: transparent
      lcars-settings-card-text: var(--lcars-text-light)
    dark:
      lcars-ui-mix-color: white
      lcars-backlight-center: "#ffffff10"
      lcars-backlight-middle: transparent
      lcars-backlight-middle-location: 70%
      lcars-backlight-outer: "#00000080"
      lcars-settings-card-text: var(--lcars-text-dark)
      lcars-card-top-text: var(--lcars-text-gray)
      lcars-card-bottom-text: var(--lcars-text-gray)

LCARS 25C (Blue Alert):
  card-mod-theme: LCARS 25C (Blue Alert)
  <<: *lcars-variables
  <<: *base
  <<: *card-mod-css
  # UI Colors
  lcars-ui-primary: var(--lcars-alert-color)
  lcars-ui-primary-text: var(--lcars-text-light)
  lcars-ui-secondary: var(--lcars-alert-white)
  lcars-ui-secondary-text: var(--lcars-text-dark)
  lcars-ui-tertiary: var(--lcars-steel-blue)
  lcars-ui-tertiary-text: var(--lcars-text-dark)
  lcars-ui-quaternary: var(--lcars-alert-color)
  lcars-ui-quaternary-text: var(--lcars-text-light)
  lcars-ui-accent-color: var(--lcars-orange)
  lcars-ui-accent-text: var(--lcars-text-dark)
  lcars-background-color: var(--lcars-black)
  lcars-background-text: var(--lcars-text-light)
  lcars-alert-color: var(--lcars-alert-blue)
  lcars-ui-text-heading: var(--lcars-text-gray)
  # Header / Sidebar
  lcars-ui-app-header-background-color: var(--lcars-black)
  lcars-ui-app-header-text-color: var(--lcars-alert-white)
  lcars-ui-app-header-clock: var(--lcars-alert-white)
  lcars-ui-config-button: var(--lcars-ui-secondary)
  lcars-ui-config-icon: var(--lcars-ui-config-button)
  # Sidebar
  lcars-sidebar-background: var(--lcars-ui-primary)
  lcars-sidebar-item-color: var(--lcars-ui-secondary)
  lcars-sidebar-text: var(--lcars-ui-secondary-text)
  lcars-sidebar-icon-color: var(--lcars-card-top-text)
  lcars-sidebar-icon-background: var(--lcars-card-top-color)
  lcars-sidebar-selected-color: var(--lcars-ui-tertiary)
  lcars-sidebar-notification-color: var(--lcars-ui-tertiary)
  # Card colors
  lcars-card-top-color: var(--lcars-alert-color)
  lcars-card-mid-color: var(--lcars-alert-color)
  lcars-card-button-color: var(--lcars-alert-color)
  lcars-card-bottom-color: var(--lcars-alert-color)
  lcars-settings-card-color: "#266AFF"
  # Card text
  lcars-card-top-text: var(--lcars-text-light)
  lcars-card-mid-text: var(--lcars-text-light)
  lcars-card-button-text: var(--lcars-text-light)
  lcars-card-bottom-text: var(--lcars-text-light)
  # Status colors
  success-color: var(--lcars-alt-green)
  warning-color: var(--lcars-sunflower)
  error-color: var(--lcars-dark-red)
  # Ripple
  lcars-ripple-color: var(--lcars-ui-mix-color)
  lcars-ripple-pressed-opacity: 0.4
  lcars-ripple-hover-opacity: 0.12
  # HA Color Palette
  ha-color-primary-05: color-mix(in oklch, var(--lcars-ui-tertiary) 10%, black)
  ha-color-primary-10: color-mix(in oklch, var(--lcars-ui-tertiary) 22%, black)
  ha-color-primary-20: color-mix(in oklch, var(--lcars-ui-tertiary) 44%, black)
  ha-color-primary-30: color-mix(in oklch, var(--lcars-ui-tertiary) 67%, black)
  ha-color-primary-40: var(--lcars-ui-tertiary)
  ha-color-primary-50: color-mix(in oklch, var(--lcars-ui-tertiary) 88%, white)
  ha-color-primary-60: color-mix(in oklch, var(--lcars-ui-tertiary) 70%, white)
  ha-color-primary-70: color-mix(in oklch, var(--lcars-ui-tertiary) 50%, white)
  ha-color-primary-80: color-mix(in oklch, var(--lcars-ui-tertiary) 30%, white)
  ha-color-primary-90: color-mix(in oklch, var(--lcars-ui-tertiary) 15%, white)
  ha-color-primary-95: color-mix(in oklch, var(--lcars-ui-tertiary) 8%, white)
  # Derived RGB
  rgb-card-background-color: "34,102,255"
  rgb-primary-text-color: "255,255,255"
  rgb-secondary-text-color: "255,255,255"
  rgb-primary-color: "85,136,238"
  rgb-accent-color: "255,119,0"
  rgb-primary-background-color: "0,0,0"
  rgb-secondary-background-color: "34,102,255"
  # Theme-specific
  lcars-tooltip-background: var(--lcars-ui-quaternary)
  lcars-tooltip-text: var(--lcars-ui-quaternary-text)
  modes:
    light:
      lcars-ui-mix-color: black
      lcars-backlight-center: "#ffffff30"
      lcars-backlight-middle: transparent
      lcars-backlight-middle-location: 60%
      lcars-backlight-outer: transparent
      lcars-settings-card-text: var(--lcars-text-light)
    dark:
      lcars-ui-mix-color: white
      lcars-backlight-center: "#ffffff10"
      lcars-backlight-middle: transparent
      lcars-backlight-middle-location: 70%
      lcars-backlight-outer: "#00000080"
      lcars-settings-card-text: var(--lcars-text-dark)
      lcars-ui-primary-text: var(--lcars-text-dark)
      lcars-ui-quaternary-text: var(--lcars-text-dark)
      lcars-card-top-text: var(--lcars-text-dark)
      lcars-card-mid-text: var(--lcars-text-dark)
      lcars-card-button-text: var(--lcars-text-dark)
      lcars-card-bottom-text: var(--lcars-text-dark)

LCARS 25C (Red Alert):
  card-mod-theme: LCARS 25C (Red Alert)
  <<: *lcars-variables
  <<: *base
  <<: *card-mod-css
  # UI Colors
  lcars-ui-primary: var(--lcars-alert-color)
  lcars-ui-primary-text: var(--lcars-text-light)
  lcars-ui-secondary: var(--lcars-alert-white)
  lcars-ui-secondary-text: var(--lcars-text-dark)
  lcars-ui-tertiary: var(--lcars-maroon)
  lcars-ui-tertiary-text: var(--lcars-text-light)
  lcars-ui-quaternary: var(--lcars-alert-color)
  lcars-ui-quaternary-text: var(--lcars-text-light)
  lcars-ui-accent-color: var(--lcars-orange)
  lcars-ui-accent-text: var(--lcars-text-dark)
  lcars-background-color: var(--lcars-black)
  lcars-background-text: var(--lcars-text-light)
  lcars-alert-color: var(--lcars-alert-red)
  lcars-ui-text-heading: var(--lcars-text-gray)
  # Header / Sidebar
  lcars-ui-app-header-background-color: var(--lcars-black)
  lcars-ui-app-header-text-color: var(--lcars-alert-white)
  lcars-ui-app-header-clock: var(--lcars-alert-white)
  lcars-ui-config-button: var(--lcars-ui-secondary)
  lcars-ui-config-icon: var(--lcars-ui-config-button)
  # Sidebar
  lcars-sidebar-background: var(--lcars-ui-primary)
  lcars-sidebar-item-color: var(--lcars-ui-secondary)
  lcars-sidebar-text: var(--lcars-ui-secondary-text)
  lcars-sidebar-icon-color: var(--lcars-card-top-text)
  lcars-sidebar-icon-background: var(--lcars-card-top-color)
  lcars-sidebar-selected-color: var(--lcars-ui-tertiary)
  lcars-sidebar-notification-color: var(--lcars-ui-tertiary)
  # Card colors
  lcars-card-top-color: var(--lcars-alert-color)
  lcars-card-mid-color: var(--lcars-alert-color)
  lcars-card-button-color: var(--lcars-alert-color)
  lcars-card-bottom-color: var(--lcars-alert-color)
  lcars-settings-card-color: "#E12B1F"
  # Card text
  lcars-card-top-text: var(--lcars-text-light)
  lcars-card-mid-text: var(--lcars-text-light)
  lcars-card-button-text: var(--lcars-text-light)
  lcars-card-bottom-text: var(--lcars-text-light)
  # Status colors
  success-color: var(--lcars-alt-green)
  warning-color: var(--lcars-sunflower)
  error-color: var(--lcars-dark-red)
  # Ripple
  lcars-ripple-color: var(--lcars-ui-mix-color)
  lcars-ripple-pressed-opacity: 0.4
  lcars-ripple-hover-opacity: 0.12
  # HA Color Palette
  ha-color-primary-05: color-mix(in oklch, var(--lcars-ui-tertiary) 10%, black)
  ha-color-primary-10: color-mix(in oklch, var(--lcars-ui-tertiary) 22%, black)
  ha-color-primary-20: color-mix(in oklch, var(--lcars-ui-tertiary) 44%, black)
  ha-color-primary-30: color-mix(in oklch, var(--lcars-ui-tertiary) 67%, black)
  ha-color-primary-40: var(--lcars-ui-tertiary)
  ha-color-primary-50: color-mix(in oklch, var(--lcars-ui-tertiary) 88%, white)
  ha-color-primary-60: color-mix(in oklch, var(--lcars-ui-tertiary) 70%, white)
  ha-color-primary-70: color-mix(in oklch, var(--lcars-ui-tertiary) 50%, white)
  ha-color-primary-80: color-mix(in oklch, var(--lcars-ui-tertiary) 30%, white)
  ha-color-primary-90: color-mix(in oklch, var(--lcars-ui-tertiary) 15%, white)
  ha-color-primary-95: color-mix(in oklch, var(--lcars-ui-tertiary) 8%, white)
  # Derived RGB
  rgb-card-background-color: "204,0,0"
  rgb-primary-text-color: "255,255,255"
  rgb-secondary-text-color: "255,255,255"
  rgb-primary-color: "139,0,0"
  rgb-accent-color: "255,119,0"
  rgb-primary-background-color: "0,0,0"
  rgb-secondary-background-color: "204,0,0"
  # Theme-specific
  lcars-tooltip-background: var(--lcars-ui-quaternary)
  lcars-tooltip-text: var(--lcars-ui-quaternary-text)
  modes:
    light:
      lcars-ui-mix-color: black
      lcars-backlight-center: "#ffffff30"
      lcars-backlight-middle: transparent
      lcars-backlight-middle-location: 60%
      lcars-backlight-outer: transparent
      lcars-settings-card-text: var(--lcars-text-light)
    dark:
      lcars-ui-mix-color: white
      lcars-backlight-center: "#ffffff10"
      lcars-backlight-middle: transparent
      lcars-backlight-middle-location: 70%
      lcars-backlight-outer: "#00000080"
      lcars-settings-card-text: var(--lcars-text-dark)
      lcars-ui-primary-text: var(--lcars-text-dark)
      lcars-ui-quaternary-text: var(--lcars-text-dark)
      lcars-card-top-text: var(--lcars-text-dark)
      lcars-card-mid-text: var(--lcars-text-dark)
      lcars-card-button-text: var(--lcars-text-dark)
      lcars-card-bottom-text: var(--lcars-text-dark)

LCARS 25C (Yellow Alert):
  card-mod-theme: LCARS 25C (Yellow Alert)
  <<: *lcars-variables
  <<: *base
  <<: *card-mod-css
  # UI Colors
  lcars-ui-primary: var(--lcars-alert-color)
  lcars-ui-primary-text: var(--lcars-text-dark)
  lcars-ui-secondary: var(--lcars-alert-white)
  lcars-ui-secondary-text: var(--lcars-text-dark)
  lcars-ui-tertiary: var(--lcars-sunflower)
  lcars-ui-tertiary-text: var(--lcars-text-dark)
  lcars-ui-quaternary: var(--lcars-alert-color)
  lcars-ui-quaternary-text: var(--lcars-text-dark)
  lcars-ui-accent-color: var(--lcars-orange)
  lcars-ui-accent-text: var(--lcars-text-dark)
  lcars-background-color: var(--lcars-black)
  lcars-background-text: var(--lcars-text-light)
  lcars-alert-color: var(--lcars-alert-yellow)
  lcars-ui-text-heading: var(--lcars-text-gray)
  # Header / Sidebar
  lcars-ui-app-header-background-color: var(--lcars-black)
  lcars-ui-app-header-text-color: var(--lcars-alert-white)
  lcars-ui-app-header-clock: var(--lcars-alert-white)
  lcars-ui-config-button: var(--lcars-ui-secondary)
  lcars-ui-config-icon: var(--lcars-ui-config-button)
  # Sidebar
  lcars-sidebar-background: var(--lcars-ui-primary)
  lcars-sidebar-item-color: var(--lcars-ui-secondary)
  lcars-sidebar-text: var(--lcars-ui-secondary-text)
  lcars-sidebar-icon-color: var(--lcars-card-top-text)
  lcars-sidebar-icon-background: var(--lcars-card-top-color)
  lcars-sidebar-selected-color: var(--lcars-ui-tertiary)
  lcars-sidebar-notification-color: var(--lcars-ui-tertiary)
  # Card colors
  lcars-card-top-color: var(--lcars-alert-color)
  lcars-card-mid-color: var(--lcars-alert-color)
  lcars-card-button-color: var(--lcars-alert-color)
  lcars-card-bottom-color: var(--lcars-alert-color)
  lcars-settings-card-color: "#B16100"
  # Card text
  lcars-card-top-text: var(--lcars-text-dark)
  lcars-card-mid-text: var(--lcars-text-dark)
  lcars-card-button-text: var(--lcars-text-dark)
  lcars-card-bottom-text: var(--lcars-text-dark)
  # Status colors
  success-color: var(--lcars-alt-green)
  warning-color: var(--lcars-sunflower)
  error-color: var(--lcars-dark-red)
  # Ripple
  lcars-ripple-color: var(--lcars-ui-mix-color)
  lcars-ripple-pressed-opacity: 0.4
  lcars-ripple-hover-opacity: 0.12
  # HA Color Palette
  ha-color-primary-05: color-mix(in oklch, var(--lcars-ui-tertiary) 10%, black)
  ha-color-primary-10: color-mix(in oklch, var(--lcars-ui-tertiary) 22%, black)
  ha-color-primary-20: color-mix(in oklch, var(--lcars-ui-tertiary) 44%, black)
  ha-color-primary-30: color-mix(in oklch, var(--lcars-ui-tertiary) 67%, black)
  ha-color-primary-40: var(--lcars-ui-tertiary)
  ha-color-primary-50: color-mix(in oklch, var(--lcars-ui-tertiary) 88%, white)
  ha-color-primary-60: color-mix(in oklch, var(--lcars-ui-tertiary) 70%, white)
  ha-color-primary-70: color-mix(in oklch, var(--lcars-ui-tertiary) 50%, white)
  ha-color-primary-80: color-mix(in oklch, var(--lcars-ui-tertiary) 30%, white)
  ha-color-primary-90: color-mix(in oklch, var(--lcars-ui-tertiary) 15%, white)
  ha-color-primary-95: color-mix(in oklch, var(--lcars-ui-tertiary) 8%, white)
  # Derived RGB
  rgb-card-background-color: "255,170,0"
  rgb-primary-text-color: "255,255,255"
  rgb-secondary-text-color: "255,255,255"
  rgb-primary-color: "255,204,102"
  rgb-accent-color: "255,119,0"
  rgb-primary-background-color: "0,0,0"
  rgb-secondary-background-color: "255,170,0"
  # Theme-specific
  lcars-tooltip-background: var(--lcars-ui-quaternary)
  lcars-tooltip-text: var(--lcars-ui-quaternary-text)
  modes:
    light:
      lcars-ui-mix-color: black
      lcars-backlight-center: "#ffffff30"
      lcars-backlight-middle: transparent
      lcars-backlight-middle-location: 60%
      lcars-backlight-outer: transparent
      lcars-settings-card-text: var(--lcars-text-light)
    dark:
      lcars-ui-mix-color: white
      lcars-backlight-center: "#ffffff10"
      lcars-backlight-middle: transparent
      lcars-backlight-middle-location: 70%
      lcars-backlight-outer: "#00000080"
      lcars-settings-card-text: var(--lcars-text-dark)

LCARS Breen:
  card-mod-theme: LCARS Breen
  <<: *lcars-variables
  <<: *base
  <<: *card-mod-css
  # UI Colors
  lcars-ui-primary: var(--lcars-green-primary)
  lcars-ui-primary-text: var(--lcars-text-dark)
  lcars-ui-secondary: var(--lcars-green-secondary)
  lcars-ui-secondary-text: var(--lcars-text-dark)
  lcars-ui-tertiary: var(--lcars-green-tertiary)
  lcars-ui-tertiary-text: var(--lcars-text-dark)
  lcars-ui-quaternary: var(--lcars-green-middle)
  lcars-ui-quaternary-text: var(--lcars-text-light)
  lcars-ui-accent-color: var(--lcars-orange)
  lcars-ui-accent-text: var(--lcars-text-dark)
  lcars-background-color: var(--lcars-black)
  lcars-background-text: var(--lcars-text-light)
  lcars-ui-text-heading: var(--lcars-text-gray)
  # Header / Sidebar
  lcars-ui-app-header-background-color: var(--lcars-ui-primary)
  lcars-ui-app-header-text-color: var(--lcars-ui-primary-text)
  lcars-ui-app-header-clock: var(--lcars-ui-tertiary)
  lcars-ui-config-button: var(--lcars-green-footer)
  lcars-ui-config-icon: var(--lcars-ui-config-button)
  # Sidebar
  lcars-sidebar-background: var(--lcars-ui-primary)
  lcars-sidebar-item-color: var(--lcars-ui-secondary)
  lcars-sidebar-text: var(--lcars-ui-secondary-text)
  lcars-sidebar-icon-color: var(--lcars-text-dark)
  lcars-sidebar-icon-background: var(--lcars-card-top-color)
  lcars-sidebar-selected-color: var(--lcars-ui-tertiary)
  lcars-sidebar-notification-color: var(--lcars-ui-tertiary)
  # Card colors
  lcars-card-top-color: var(--lcars-green-secondary)
  lcars-card-mid-color: var(--lcars-green-middle)
  lcars-card-button-color: var(--lcars-green-tertiary)
  lcars-card-bottom-color: var(--lcars-green-footer)
  lcars-settings-card-color: "#428343"
  # Card text
  lcars-card-top-text: var(--lcars-text-dark)
  lcars-card-mid-text: var(--lcars-text-light)
  lcars-card-button-text: var(--lcars-text-dark)
  lcars-card-bottom-text: var(--lcars-text-dark)
  # Status colors
  success-color: var(--lcars-green)
  warning-color: var(--lcars-sunflower)
  error-color: var(--lcars-dark-red)
  # Ripple
  lcars-ripple-color: var(--lcars-ui-mix-color)
  lcars-ripple-pressed-opacity: 0.4
  lcars-ripple-hover-opacity: 0.12
  # HA Color Palette
  ha-color-primary-05: color-mix(in oklch, var(--lcars-ui-tertiary) 10%, black)
  ha-color-primary-10: color-mix(in oklch, var(--lcars-ui-tertiary) 22%, black)
  ha-color-primary-20: color-mix(in oklch, var(--lcars-ui-tertiary) 44%, black)
  ha-color-primary-30: color-mix(in oklch, var(--lcars-ui-tertiary) 67%, black)
  ha-color-primary-40: var(--lcars-ui-tertiary)
  ha-color-primary-50: color-mix(in oklch, var(--lcars-ui-tertiary) 88%, white)
  ha-color-primary-60: color-mix(in oklch, var(--lcars-ui-tertiary) 70%, white)
  ha-color-primary-70: color-mix(in oklch, var(--lcars-ui-tertiary) 50%, white)
  ha-color-primary-80: color-mix(in oklch, var(--lcars-ui-tertiary) 30%, white)
  ha-color-primary-90: color-mix(in oklch, var(--lcars-ui-tertiary) 15%, white)
  ha-color-primary-95: color-mix(in oklch, var(--lcars-ui-tertiary) 8%, white)
  # Derived RGB
  rgb-card-background-color: "15,86,22"
  rgb-primary-text-color: "255,255,255"
  rgb-secondary-text-color: "255,255,255"
  rgb-primary-color: "136,222,144"
  rgb-accent-color: "255,119,0"
  rgb-primary-background-color: "0,0,0"
  rgb-secondary-background-color: "15,86,22"
  # Theme-specific
  lcars-tooltip-background: var(--lcars-ui-quaternary)
  lcars-tooltip-text: var(--lcars-ui-quaternary-text)
  modes:
    light:
      lcars-ui-mix-color: black
      lcars-backlight-center: "#ffffff30"
      lcars-backlight-middle: transparent
      lcars-backlight-middle-location: 60%
      lcars-backlight-outer: transparent
      lcars-settings-card-text: var(--lcars-text-light)
    dark:
      lcars-ui-mix-color: white
      lcars-backlight-center: "#ffffff10"
      lcars-backlight-middle: transparent
      lcars-backlight-middle-location: 70%
      lcars-backlight-outer: "#00000080"
      lcars-settings-card-text: var(--lcars-text-dark)

LCARS Cardassia:
  card-mod-theme: LCARS Cardassia
  <<: *lcars-variables
  <<: *base
  <<: *card-mod-css
  # UI Colors
  lcars-ui-primary: var(--lcars-green-primary)
  lcars-ui-primary-text: var(--lcars-text-dark)
  lcars-ui-secondary: var(--lcars-lavender-rose)
  lcars-ui-secondary-text: var(--lcars-text-dark)
  lcars-ui-tertiary: var(--lcars-aqua)
  lcars-ui-tertiary-text: var(--lcars-text-dark)
  lcars-ui-quaternary: var(--lcars-cardassia-maroon)
  lcars-ui-quaternary-text: var(--lcars-text-light)
  lcars-ui-accent-color: var(--lcars-orange)
  lcars-ui-accent-text: var(--lcars-text-dark)
  lcars-background-color: var(--lcars-black)
  lcars-background-text: var(--lcars-text-light)
  lcars-ui-text-heading: var(--lcars-text-gray)
  # Header / Sidebar
  lcars-ui-app-header-background-color: var(--lcars-ui-primary)
  lcars-ui-app-header-text-color: var(--lcars-ui-primary-text)
  lcars-ui-app-header-clock: var(--lcars-pearl)
  lcars-ui-config-button: var(--lcars-aqua)
  lcars-ui-config-icon: var(--lcars-ui-config-button)
  # Sidebar
  lcars-sidebar-background: var(--lcars-ui-primary)
  lcars-sidebar-item-color: var(--lcars-ui-secondary)
  lcars-sidebar-text: var(--lcars-ui-secondary-text)
  lcars-sidebar-icon-color: var(--lcars-card-top-text)
  lcars-sidebar-icon-background: var(--lcars-card-top-color)
  lcars-sidebar-selected-color: var(--lcars-ui-tertiary)
  lcars-sidebar-notification-color: var(--lcars-ui-tertiary)
  # Card colors
  lcars-card-top-color: var(--lcars-sky-blue)
  lcars-card-mid-color: var(--lcars-cardassia-maroon)
  lcars-card-button-color: var(--lcars-cardassia-maroon)
  lcars-card-bottom-color: var(--lcars-eggplant)
  lcars-settings-card-color: "#A2646B"
  # Card text
  lcars-card-top-text: var(--lcars-text-dark)
  lcars-card-mid-text: var(--lcars-text-light)
  lcars-card-button-text: var(--lcars-text-light)
  lcars-card-bottom-text: var(--lcars-text-light)
  # Status colors
  success-color: var(--lcars-green)
  warning-color: var(--lcars-sunflower)
  error-color: var(--lcars-dark-red)
  # Ripple
  lcars-ripple-color: var(--lcars-ui-mix-color)
  lcars-ripple-pressed-opacity: 0.4
  lcars-ripple-hover-opacity: 0.12
  # HA Color Palette
  ha-color-primary-05: color-mix(in oklch, var(--lcars-ui-tertiary) 10%, black)
  ha-color-primary-10: color-mix(in oklch, var(--lcars-ui-tertiary) 22%, black)
  ha-color-primary-20: color-mix(in oklch, var(--lcars-ui-tertiary) 44%, black)
  ha-color-primary-30: color-mix(in oklch, var(--lcars-ui-tertiary) 67%, black)
  ha-color-primary-40: var(--lcars-ui-tertiary)
  ha-color-primary-50: color-mix(in oklch, var(--lcars-ui-tertiary) 88%, white)
  ha-color-primary-60: color-mix(in oklch, var(--lcars-ui-tertiary) 70%, white)
  ha-color-primary-70: color-mix(in oklch, var(--lcars-ui-tertiary) 50%, white)
  ha-color-primary-80: color-mix(in oklch, var(--lcars-ui-tertiary) 30%, white)
  ha-color-primary-90: color-mix(in oklch, var(--lcars-ui-tertiary) 15%, white)
  ha-color-primary-95: color-mix(in oklch, var(--lcars-ui-tertiary) 8%, white)
  # Derived RGB
  rgb-card-background-color: "79,26,35"
  rgb-primary-text-color: "255,255,255"
  rgb-secondary-text-color: "255,255,255"
  rgb-primary-color: "136,255,255"
  rgb-accent-color: "255,119,0"
  rgb-primary-background-color: "0,0,0"
  rgb-secondary-background-color: "79,26,35"
  # Theme-specific
  lcars-tooltip-background: var(--lcars-ui-quaternary)
  lcars-tooltip-text: var(--lcars-ui-quaternary-text)
  modes:
    light:
      lcars-ui-mix-color: black
      lcars-backlight-center: "#ffffff30"
      lcars-backlight-middle: transparent
      lcars-backlight-middle-location: 60%
      lcars-backlight-outer: transparent
      lcars-settings-card-text: var(--lcars-text-light)
    dark:
      lcars-ui-mix-color: white
      lcars-backlight-center: "#ffffff10"
      lcars-backlight-middle: transparent
      lcars-backlight-middle-location: 70%
      lcars-backlight-outer: "#00000080"
      lcars-settings-card-text: var(--lcars-text-dark)
      lcars-ui-quaternary-text: var(--lcars-text-gray)
      lcars-card-mid-text: var(--lcars-text-gray)
      lcars-card-button-text: var(--lcars-text-gray)

LCARS Classic:
  card-mod-theme: LCARS Classic
  <<: *lcars-variables
  <<: *base
  <<: *card-mod-css
  # UI Colors
  lcars-ui-primary: var(--lcars-khaki)
  lcars-ui-primary-text: var(--lcars-text-dark)
  lcars-ui-secondary: var(--lcars-khaki)
  lcars-ui-secondary-text: var(--lcars-text-dark)
  lcars-ui-tertiary: var(--lcars-mars)
  lcars-ui-tertiary-text: var(--lcars-text-dark)
  lcars-ui-quaternary: var(--lcars-gray)
  lcars-ui-quaternary-text: var(--lcars-text-light)
  lcars-ui-accent-color: var(--lcars-orange)
  lcars-ui-accent-text: var(--lcars-text-dark)
  lcars-background-color: var(--lcars-black)
  lcars-background-text: var(--lcars-text-light)
  lcars-ui-text-heading: var(--lcars-text-gray)
  # Header / Sidebar
  lcars-ui-app-header-background-color: var(--lcars-ui-primary)
  lcars-ui-app-header-text-color: var(--lcars-ui-primary-text)
  lcars-ui-app-header-clock: var(--lcars-ui-tertiary)
  lcars-ui-config-button: var(--lcars-cool)
  lcars-ui-config-icon: var(--lcars-ui-config-button)
  # Sidebar
  lcars-sidebar-background: var(--lcars-ui-primary)
  lcars-sidebar-item-color: var(--lcars-ui-secondary)
  lcars-sidebar-text: var(--lcars-ui-secondary-text)
  lcars-sidebar-icon-color: var(--lcars-card-top-text)
  lcars-sidebar-icon-background: var(--lcars-card-top-color)
  lcars-sidebar-selected-color: var(--lcars-ui-tertiary)
  lcars-sidebar-notification-color: var(--lcars-ui-tertiary)
  # Card colors
  lcars-card-top-color: var(--lcars-cool)
  lcars-card-mid-color: var(--lcars-ice)
  lcars-card-button-color: var(--lcars-ice)
  lcars-card-bottom-color: var(--lcars-ice)
  lcars-settings-card-color: "#727295"
  # Card text
  lcars-card-top-text: var(--lcars-text-dark)
  lcars-card-mid-text: var(--lcars-text-dark)
  lcars-card-button-text: var(--lcars-text-dark)
  lcars-card-bottom-text: var(--lcars-text-dark)
  # Status colors
  success-color: var(--lcars-green)
  warning-color: var(--lcars-sunflower)
  error-color: var(--lcars-dark-red)
  # Ripple
  lcars-ripple-color: var(--lcars-ui-mix-color)
  lcars-ripple-pressed-opacity: 0.4
  lcars-ripple-hover-opacity: 0.12
  # HA Color Palette
  ha-color-primary-05: color-mix(in oklch, var(--lcars-ui-tertiary) 10%, black)
  ha-color-primary-10: color-mix(in oklch, var(--lcars-ui-tertiary) 22%, black)
  ha-color-primary-20: color-mix(in oklch, var(--lcars-ui-tertiary) 44%, black)
  ha-color-primary-30: color-mix(in oklch, var(--lcars-ui-tertiary) 67%, black)
  ha-color-primary-40: var(--lcars-ui-tertiary)
  ha-color-primary-50: color-mix(in oklch, var(--lcars-ui-tertiary) 88%, white)
  ha-color-primary-60: color-mix(in oklch, var(--lcars-ui-tertiary) 70%, white)
  ha-color-primary-70: color-mix(in oklch, var(--lcars-ui-tertiary) 50%, white)
  ha-color-primary-80: color-mix(in oklch, var(--lcars-ui-tertiary) 30%, white)
  ha-color-primary-90: color-mix(in oklch, var(--lcars-ui-tertiary) 15%, white)
  ha-color-primary-95: color-mix(in oklch, var(--lcars-ui-tertiary) 8%, white)
  # Derived RGB
  rgb-card-background-color: "102,102,136"
  rgb-primary-text-color: "255,255,255"
  rgb-secondary-text-color: "255,255,255"
  rgb-primary-color: "255,34,0"
  rgb-accent-color: "255,119,0"
  rgb-primary-background-color: "0,0,0"
  rgb-secondary-background-color: "102,102,136"
  # Theme-specific
  lcars-tooltip-background: var(--lcars-ui-quaternary)
  lcars-tooltip-text: var(--lcars-ui-quaternary-text)
  modes:
    light:
      lcars-ui-mix-color: black
      lcars-backlight-center: "#ffffff30"
      lcars-backlight-middle: transparent
      lcars-backlight-middle-location: 60%
      lcars-backlight-outer: transparent
      lcars-settings-card-text: var(--lcars-text-light)
    dark:
      lcars-ui-mix-color: white
      lcars-backlight-center: "#ffffff10"
      lcars-backlight-middle: transparent
      lcars-backlight-middle-location: 70%
      lcars-backlight-outer: "#00000080"
      lcars-settings-card-text: var(--lcars-text-dark)
      lcars-ui-quaternary-text: var(--lcars-text-dark)

LCARS Default:
  card-mod-theme: LCARS Default
  <<: *lcars-variables
  <<: *base
  <<: *card-mod-css
  # UI Colors
  lcars-ui-primary: var(--lcars-almond-creme)
  lcars-ui-primary-text: var(--lcars-text-dark)
  lcars-ui-secondary: var(--lcars-african-violet)
  lcars-ui-secondary-text: var(--lcars-text-dark)
  lcars-ui-tertiary: var(--lcars-red)
  lcars-ui-tertiary-text: var(--lcars-text-dark)
  lcars-ui-quaternary: var(--lcars-gray)
  lcars-ui-quaternary-text: var(--lcars-text-light)
  lcars-ui-accent-color: var(--lcars-orange)
  lcars-ui-accent-text: var(--lcars-text-dark)
  lcars-background-color: var(--lcars-black)
  lcars-background-text: var(--lcars-text-light)
  lcars-ui-text-heading: var(--lcars-text-gray)
  # Header / Sidebar
  lcars-ui-app-header-background-color: var(--lcars-ui-primary)
  lcars-ui-app-header-text-color: var(--lcars-ui-primary-text)
  lcars-ui-app-header-clock: var(--lcars-ui-tertiary)
  lcars-ui-config-button: var(--lcars-ui-secondary)
  lcars-ui-config-icon: var(--lcars-ui-config-button)
  # Sidebar
  lcars-sidebar-background: var(--lcars-ui-primary)
  lcars-sidebar-item-color: var(--lcars-ui-secondary)
  lcars-sidebar-text: var(--lcars-ui-secondary-text)
  lcars-sidebar-icon-color: var(--lcars-card-top-text)
  lcars-sidebar-icon-background: var(--lcars-card-top-color)
  lcars-sidebar-selected-color: var(--lcars-ui-tertiary)
  lcars-sidebar-notification-color: var(--lcars-ui-tertiary)
  # Card colors
  lcars-card-top-color: var(--lcars-bluey)
  lcars-card-mid-color: var(--lcars-red)
  lcars-card-button-color: var(--lcars-red)
  lcars-card-bottom-color: var(--lcars-gray)
  lcars-settings-card-color: "#727295"
  # Card text
  lcars-card-top-text: var(--lcars-text-dark)
  lcars-card-mid-text: var(--lcars-text-dark)
  lcars-card-button-text: var(--lcars-text-dark)
  lcars-card-bottom-text: var(--lcars-text-light)
  # Status colors
  success-color: var(--lcars-green)
  warning-color: var(--lcars-sunflower)
  error-color: var(--lcars-dark-red)
  # Ripple
  lcars-ripple-color: var(--lcars-ui-mix-color)
  lcars-ripple-pressed-opacity: 0.4
  lcars-ripple-hover-opacity: 0.12
  # HA Color Palette
  ha-color-primary-05: color-mix(in oklch, var(--lcars-ui-tertiary) 10%, black)
  ha-color-primary-10: color-mix(in oklch, var(--lcars-ui-tertiary) 22%, black)
  ha-color-primary-20: color-mix(in oklch, var(--lcars-ui-tertiary) 44%, black)
  ha-color-primary-30: color-mix(in oklch, var(--lcars-ui-tertiary) 67%, black)
  ha-color-primary-40: var(--lcars-ui-tertiary)
  ha-color-primary-50: color-mix(in oklch, var(--lcars-ui-tertiary) 88%, white)
  ha-color-primary-60: color-mix(in oklch, var(--lcars-ui-tertiary) 70%, white)
  ha-color-primary-70: color-mix(in oklch, var(--lcars-ui-tertiary) 50%, white)
  ha-color-primary-80: color-mix(in oklch, var(--lcars-ui-tertiary) 30%, white)
  ha-color-primary-90: color-mix(in oklch, var(--lcars-ui-tertiary) 15%, white)
  ha-color-primary-95: color-mix(in oklch, var(--lcars-ui-tertiary) 8%, white)
  # Derived RGB
  rgb-card-background-color: "102,102,136"
  rgb-primary-text-color: "255,255,255"
  rgb-secondary-text-color: "255,255,255"
  rgb-primary-color: "221,68,68"
  rgb-accent-color: "255,119,0"
  rgb-primary-background-color: "0,0,0"
  rgb-secondary-background-color: "102,102,136"
  # Theme-specific
  lcars-tooltip-background: var(--lcars-ui-quaternary)
  lcars-tooltip-text: var(--lcars-ui-quaternary-text)
  modes:
    light:
      lcars-ui-mix-color: black
      lcars-backlight-center: "#ffffff30"
      lcars-backlight-middle: transparent
      lcars-backlight-middle-location: 60%
      lcars-backlight-outer: transparent
      lcars-settings-card-text: var(--lcars-text-light)
    dark:
      lcars-ui-mix-color: white
      lcars-backlight-center: "#ffffff10"
      lcars-backlight-middle: transparent
      lcars-backlight-middle-location: 70%
      lcars-backlight-outer: "#00000080"
      lcars-settings-card-text: var(--lcars-text-dark)
      lcars-ui-quaternary-text: var(--lcars-text-dark)
      lcars-card-bottom-text: var(--lcars-text-dark)

LCARS Kronos:
  card-mod-theme: LCARS Kronos
  <<: *lcars-variables
  <<: *base
  <<: *card-mod-css
  # UI Colors
  lcars-ui-primary: var(--lcars-mars)
  lcars-ui-primary-text: var(--lcars-text-dark)
  lcars-ui-secondary: var(--lcars-gold)
  lcars-ui-secondary-text: var(--lcars-text-dark)
  lcars-ui-tertiary: var(--lcars-orange)
  lcars-ui-tertiary-text: var(--lcars-text-dark)
  lcars-ui-quaternary: var(--lcars-deep-maroon)
  lcars-ui-quaternary-text: var(--lcars-text-light)
  lcars-ui-accent-color: var(--lcars-orange)
  lcars-ui-accent-text: var(--lcars-text-dark)
  lcars-background-color: var(--lcars-black)
  lcars-background-text: var(--lcars-text-light)
  lcars-ui-text-heading: var(--lcars-text-gray)
  # Header / Sidebar
  lcars-ui-app-header-background-color: var(--lcars-ui-primary)
  lcars-ui-app-header-text-color: var(--lcars-ui-primary-text)
  lcars-ui-app-header-clock: var(--lcars-ui-tertiary)
  lcars-ui-config-button: var(--lcars-mars)
  lcars-ui-config-icon: var(--lcars-ui-config-button)
  # Sidebar
  lcars-sidebar-background: var(--lcars-ui-primary)
  lcars-sidebar-item-color: var(--lcars-ui-secondary)
  lcars-sidebar-text: var(--lcars-ui-secondary-text)
  lcars-sidebar-icon-color: var(--lcars-peach)
  lcars-sidebar-icon-background: var(--lcars-card-top-color)
  lcars-sidebar-selected-color: var(--lcars-ui-tertiary)
  lcars-sidebar-notification-color: var(--lcars-ui-tertiary)
  # Card colors
  lcars-card-top-color: var(--lcars-mars)
  lcars-card-mid-color: var(--lcars-october-sunset)
  lcars-card-button-color: var(--lcars-october-sunset)
  lcars-card-bottom-color: var(--lcars-peach)
  lcars-settings-card-color: "#CB4A39"
  # Card text
  lcars-card-top-text: var(--lcars-text-dark)
  lcars-card-mid-text: var(--lcars-text-dark)
  lcars-card-button-text: var(--lcars-text-dark)
  lcars-card-bottom-text: var(--lcars-text-dark)
  # Status colors
  success-color: var(--lcars-green)
  warning-color: var(--lcars-sunflower)
  error-color: var(--lcars-dark-red)
  # Ripple
  lcars-ripple-color: var(--lcars-ui-mix-color)
  lcars-ripple-pressed-opacity: 0.4
  lcars-ripple-hover-opacity: 0.12
  # HA Color Palette
  ha-color-primary-05: color-mix(in oklch, var(--lcars-ui-tertiary) 10%, black)
  ha-color-primary-10: color-mix(in oklch, var(--lcars-ui-tertiary) 22%, black)
  ha-color-primary-20: color-mix(in oklch, var(--lcars-ui-tertiary) 44%, black)
  ha-color-primary-30: color-mix(in oklch, var(--lcars-ui-tertiary) 67%, black)
  ha-color-primary-40: var(--lcars-ui-tertiary)
  ha-color-primary-50: color-mix(in oklch, var(--lcars-ui-tertiary) 88%, white)
  ha-color-primary-60: color-mix(in oklch, var(--lcars-ui-tertiary) 70%, white)
  ha-color-primary-70: color-mix(in oklch, var(--lcars-ui-tertiary) 50%, white)
  ha-color-primary-80: color-mix(in oklch, var(--lcars-ui-tertiary) 30%, white)
  ha-color-primary-90: color-mix(in oklch, var(--lcars-ui-tertiary) 15%, white)
  ha-color-primary-95: color-mix(in oklch, var(--lcars-ui-tertiary) 8%, white)
  # Derived RGB
  rgb-card-background-color: "147,10,0"
  rgb-primary-text-color: "255,255,255"
  rgb-secondary-text-color: "255,255,255"
  rgb-primary-color: "255,119,0"
  rgb-accent-color: "255,119,0"
  rgb-primary-background-color: "0,0,0"
  rgb-secondary-background-color: "147,10,0"
  # Theme-specific
  lcars-tooltip-background: var(--lcars-ui-quaternary)
  lcars-tooltip-text: var(--lcars-ui-quaternary-text)
  modes:
    light:
      lcars-ui-mix-color: black
      lcars-backlight-center: "#ffffff30"
      lcars-backlight-middle: transparent
      lcars-backlight-middle-location: 60%
      lcars-backlight-outer: transparent
      lcars-settings-card-text: var(--lcars-text-light)
    dark:
      lcars-ui-mix-color: white
      lcars-backlight-center: "#ffffff10"
      lcars-backlight-middle: transparent
      lcars-backlight-middle-location: 70%
      lcars-backlight-outer: "#00000080"
      lcars-settings-card-text: var(--lcars-text-dark)

LCARS Picard [LCARdS Blue Accent]:
  card-mod-theme: LCARS Picard [LCARdS Blue Accent]
  <<: *lcars-variables
  <<: *base
  <<: *card-mod-css
  # UI Colors
  lcars-ui-primary: var(--lcards-gray-medium-light)
  lcars-ui-primary-text: var(--lcars-text-dark)
  lcars-ui-secondary: var(--lcards-gray)
  lcars-ui-secondary-text: var(--lcars-text-dark)
  lcars-ui-tertiary: var(--lcards-blue)
  lcars-ui-tertiary-text: var(--lcars-text-dark)
  lcars-ui-quaternary: var(--lcards-gray)
  lcars-ui-quaternary-text: var(--lcars-text-light)
  lcars-ui-accent-color: var(--lcards-blue)
  lcars-ui-accent-text: var(--lcars-text-light)
  lcars-background-color: var(--lcars-black)
  lcars-background-text: var(--lcars-text-light)
  lcars-alert-color: var(--lcards-orange-medium-dark)
  lcars-ui-text-heading: var(--lcars-text-gray)
  # Header / Sidebar
  lcars-ui-app-header-background-color: var(--lcars-ui-primary)
  lcars-ui-app-header-text-color: var(--lcars-ui-primary-text)
  lcars-ui-app-header-clock: var(--lcars-ui-tertiary)
  lcars-ui-config-button: var(--lcards-orange-lightest)
  lcars-ui-config-icon: var(--lcards-orange-lightest)
  # Sidebar
  lcars-sidebar-background: var(--lcars-ui-primary)
  lcars-sidebar-item-color: var(--lcars-ui-secondary)
  lcars-sidebar-text: var(--lcars-ui-secondary-text)
  lcars-sidebar-icon-color: var(--lcards-gray-dark)
  lcars-sidebar-icon-background: var(--lcars-card-top-color)
  lcars-sidebar-selected-color: var(--lcars-ui-tertiary)
  lcars-sidebar-notification-color: var(--lcars-ui-tertiary)
  # Card colors
  lcars-card-top-color: var(--lcards-gray-medium-dark)
  lcars-card-mid-color: var(--lcards-blue)
  lcars-card-button-color: var(--lcards-blue)
  lcars-card-bottom-color: var(--lcards-gray-dark)
  lcars-settings-card-color: "#5077AF"
  # Card text
  lcars-card-top-text: var(--lcars-text-light)
  lcars-card-mid-text: var(--lcars-text-dark)
  lcars-card-button-text: var(--lcars-text-dark)
  lcars-card-bottom-text: var(--lcars-text-light)
  # Status colors
  success-color: var(--lcars-green)
  warning-color: var(--lcars-sunflower)
  error-color: var(--lcars-dark-red)
  # Ripple
  lcars-ripple-color: var(--lcars-ui-mix-color)
  lcars-ripple-pressed-opacity: 0.4
  lcars-ripple-hover-opacity: 0.12
  # HA Color Palette
  ha-color-primary-05: var(--lcards-blue-darkest)
  ha-color-primary-10: var(--lcards-blue-darkest)
  ha-color-primary-20: var(--lcards-blue-dark)
  ha-color-primary-30: var(--lcards-blue-medium-dark)
  ha-color-primary-40: var(--lcards-blue)
  ha-color-primary-50: var(--lcards-blue)
  ha-color-primary-60: var(--lcards-blue)
  ha-color-primary-70: var(--lcards-blue-medium-light)
  ha-color-primary-80: var(--lcards-blue-light)
  ha-color-primary-90: var(--lcards-blue-lightest)
  ha-color-primary-95: var(--lcards-blue-lightest)
  ha-color-neutral-05: var(--lcards-gray-darkest)
  ha-color-neutral-10: var(--lcards-gray-darkest)
  ha-color-neutral-20: var(--lcards-gray-dark)
  ha-color-neutral-30: var(--lcards-gray-medium-dark)
  ha-color-neutral-40: var(--lcards-gray-medium-dark)
  ha-color-neutral-50: var(--lcards-gray)
  ha-color-neutral-60: var(--lcards-gray-medium-light)
  ha-color-neutral-70: var(--lcards-gray-medium-light)
  ha-color-neutral-80: var(--lcards-gray-light)
  ha-color-neutral-90: var(--lcards-gray-lightest)
  ha-color-neutral-95: var(--lcards-gray-lightest)
  ha-color-orange-05: var(--lcards-yellow-darkest)
  ha-color-orange-10: var(--lcards-yellow-darkest)
  ha-color-orange-20: var(--lcards-yellow-dark)
  ha-color-orange-30: var(--lcards-yellow-medium-dark)
  ha-color-orange-40: var(--lcards-yellow-medium-dark)
  ha-color-orange-50: var(--lcards-yellow)
  ha-color-orange-60: var(--lcards-yellow-medium-light)
  ha-color-orange-70: var(--lcards-yellow-medium-light)
  ha-color-orange-80: var(--lcards-yellow-light)
  ha-color-orange-90: var(--lcards-yellow-lightest)
  ha-color-orange-95: var(--lcards-yellow-lightest)
  ha-color-red-05: var(--lcards-orange-darkest)
  ha-color-red-10: var(--lcards-orange-darkest)
  ha-color-red-20: var(--lcards-orange-dark)
  ha-color-red-30: var(--lcards-orange-medium-dark)
  ha-color-red-40: var(--lcards-orange-medium-dark)
  ha-color-red-50: var(--lcards-orange)
  ha-color-red-60: var(--lcards-orange-medium-light)
  ha-color-red-70: var(--lcards-orange-medium-light)
  ha-color-red-80: var(--lcards-orange-light)
  ha-color-red-90: var(--lcards-orange-lightest)
  ha-color-red-95: var(--lcards-orange-lightest)
  ha-color-green-05: var(--lcards-green-darkest)
  ha-color-green-10: var(--lcards-green-darkest)
  ha-color-green-20: var(--lcards-green-dark)
  ha-color-green-30: var(--lcards-green-medium-dark)
  ha-color-green-40: var(--lcards-green-medium-dark)
  ha-color-green-50: var(--lcards-green)
  ha-color-green-60: var(--lcards-green-medium-light)
  ha-color-green-70: var(--lcards-green-medium-light)
  ha-color-green-80: var(--lcards-green-light)
  ha-color-green-90: var(--lcards-green-lightest)
  ha-color-green-95: var(--lcards-green-lightest)
  # Derived RGB
  rgb-card-background-color: "109,116,140"
  rgb-primary-text-color: "255,255,255"
  rgb-secondary-text-color: "255,255,255"
  rgb-primary-color: "55,166,209"
  rgb-accent-color: "55,166,209"
  rgb-primary-background-color: "0,0,0"
  rgb-secondary-background-color: "109,116,140"
  # Theme-specific
  lcars-tooltip-background: var(--lcars-ui-quaternary)
  lcars-tooltip-text: var(--lcars-ui-quaternary-text)
  lcars-card-mid-left-color: var(--lcards-blue)
  lcars-card-button: var(--lcards-blue)
  lcars-card-button-off: var(--lcards-gray-medium-light)
  lcars-card-button-barrel: var(--lcards-gray-medium-dark)
  lcars-card-background: var(--lcards-gray-medium-light)
  modes:
    light:
      lcars-ui-mix-color: black
      lcars-backlight-center: "#ffffff30"
      lcars-backlight-middle: transparent
      lcars-backlight-middle-location: 60%
      lcars-backlight-outer: transparent
      lcars-settings-card-text: var(--lcars-text-light)
      ha-color-form-background: color-mix(in srgb, var(--lcards-moonlight) 40%, transparent)
      lcars-ui-primary: var(--lcards-gray-medium-light)
      lcars-ui-secondary: var(--lcards-gray-light)
      lcars-ui-tertiary: var(--lcards-blue)
      lcars-ui-quaternary: var(--lcards-gray-medium-dark)
      lcars-alert-color: var(--lcards-orange-medium-dark)
      success-color: var(--lcards-green)
      warning-color: var(--lcards-orange-medium-light)
      error-color: var(--lcards-orange)
    dark:
      lcars-ui-mix-color: white
      lcars-backlight-center: "#ffffff10"
      lcars-backlight-middle: transparent
      lcars-backlight-middle-location: 70%
      lcars-backlight-outer: "#00000080"
      lcars-settings-card-text: var(--lcars-text-dark)
      ha-color-form-background: color-mix(in srgb, var(--lcards-moonlight) 30%, transparent)
      lcars-ui-primary: var(--lcards-gray)
      lcars-ui-secondary: var(--lcards-gray-medium-light)
      lcars-ui-tertiary: var(--lcards-blue)
      lcars-ui-quaternary: var(--lcards-gray-dark)
      lcars-alert-color: var(--lcards-orange-medium-dark)
      success-color: var(--lcards-green)
      warning-color: var(--lcards-orange)
      error-color: var(--lcards-orange-dark)
      lcars-ui-quaternary-text: var(--lcars-text-gray)
      lcars-card-top-text: var(--lcars-text-dark)
      lcars-card-bottom-text: var(--lcars-text-gray)

LCARS Picard [LCARdS Red Accent]:
  card-mod-theme: LCARS Picard [LCARdS Red Accent]
  <<: *lcars-variables
  <<: *base
  <<: *card-mod-css
  # UI Colors
  lcars-ui-primary: var(--lcards-gray-medium-light)
  lcars-ui-primary-text: var(--lcars-text-dark)
  lcars-ui-secondary: var(--lcards-gray)
  lcars-ui-secondary-text: var(--lcars-text-dark)
  lcars-ui-tertiary: var(--lcards-orange)
  lcars-ui-tertiary-text: var(--lcars-text-dark)
  lcars-ui-quaternary: var(--lcards-gray)
  lcars-ui-quaternary-text: var(--lcars-text-light)
  lcars-ui-accent-color: var(--lcards-orange-medium-dark)
  lcars-ui-accent-text: var(--lcars-text-dark)
  lcars-background-color: var(--lcars-black)
  lcars-background-text: var(--lcars-text-light)
  lcars-alert-color: var(--lcards-orange-medium-dark)
  lcars-ui-text-heading: var(--lcars-text-gray)
  # Header / Sidebar
  lcars-ui-app-header-background-color: var(--lcars-ui-primary)
  lcars-ui-app-header-text-color: var(--lcars-ui-primary-text)
  lcars-ui-app-header-clock: var(--lcars-ui-tertiary)
  lcars-ui-config-button: var(--lcards-blue-lightest)
  lcars-ui-config-icon: var(--lcards-blue-lightest)
  # Sidebar
  lcars-sidebar-background: var(--lcars-ui-primary)
  lcars-sidebar-item-color: var(--lcars-ui-secondary)
  lcars-sidebar-text: var(--lcars-ui-secondary-text)
  lcars-sidebar-icon-color: var(--lcards-gray-dark)
  lcars-sidebar-icon-background: var(--lcars-card-top-color)
  lcars-sidebar-selected-color: var(--lcars-ui-tertiary)
  lcars-sidebar-notification-color: var(--lcars-ui-tertiary)
  # Card colors
  lcars-card-top-color: var(--lcards-gray-medium-dark)
  lcars-card-mid-color: var(--lcards-orange)
  lcars-card-button-color: var(--lcards-orange)
  lcars-card-bottom-color: var(--lcards-gray-dark)
  lcars-settings-card-color: "#6E758D"
  # Card text
  lcars-card-top-text: var(--lcars-text-light)
  lcars-card-mid-text: var(--lcars-text-dark)
  lcars-card-button-text: var(--lcars-text-dark)
  lcars-card-bottom-text: var(--lcars-text-light)
  # Status colors
  success-color: var(--lcars-green)
  warning-color: var(--lcars-sunflower)
  error-color: var(--lcars-dark-red)
  # Ripple
  lcars-ripple-color: var(--lcars-ui-mix-color)
  lcars-ripple-pressed-opacity: 0.4
  lcars-ripple-hover-opacity: 0.12
  # HA Color Palette
  ha-color-primary-05: var(--lcards-orange-darkest)
  ha-color-primary-10: var(--lcards-orange-darkest)
  ha-color-primary-20: var(--lcards-orange-dark)
  ha-color-primary-30: var(--lcards-orange-medium-dark)
  ha-color-primary-40: var(--lcards-orange)
  ha-color-primary-50: var(--lcards-orange)
  ha-color-primary-60: var(--lcards-orange)
  ha-color-primary-70: var(--lcards-orange-medium-light)
  ha-color-primary-80: var(--lcards-orange-light)
  ha-color-primary-90: var(--lcards-orange-lightest)
  ha-color-primary-95: var(--lcards-orange-lightest)
  ha-color-neutral-05: var(--lcards-gray-darkest)
  ha-color-neutral-10: var(--lcards-gray-darkest)
  ha-color-neutral-20: var(--lcards-gray-dark)
  ha-color-neutral-30: var(--lcards-gray-medium-dark)
  ha-color-neutral-40: var(--lcards-gray-medium-dark)
  ha-color-neutral-50: var(--lcards-gray)
  ha-color-neutral-60: var(--lcards-gray-medium-light)
  ha-color-neutral-70: var(--lcards-gray-medium-light)
  ha-color-neutral-80: var(--lcards-gray-light)
  ha-color-neutral-90: var(--lcards-gray-lightest)
  ha-color-neutral-95: var(--lcards-gray-lightest)
  ha-color-orange-05: var(--lcards-yellow-darkest)
  ha-color-orange-10: var(--lcards-yellow-darkest)
  ha-color-orange-20: var(--lcards-yellow-dark)
  ha-color-orange-30: var(--lcards-yellow-medium-dark)
  ha-color-orange-40: var(--lcards-yellow-medium-dark)
  ha-color-orange-50: var(--lcards-yellow)
  ha-color-orange-60: var(--lcards-yellow-medium-light)
  ha-color-orange-70: var(--lcards-yellow-medium-light)
  ha-color-orange-80: var(--lcards-yellow-light)
  ha-color-orange-90: var(--lcards-yellow-lightest)
  ha-color-orange-95: var(--lcards-yellow-lightest)
  ha-color-red-05: var(--lcards-orange-darkest)
  ha-color-red-10: var(--lcards-orange-darkest)
  ha-color-red-20: var(--lcards-orange-dark)
  ha-color-red-30: var(--lcards-orange-medium-dark)
  ha-color-red-40: var(--lcards-orange-medium-dark)
  ha-color-red-50: var(--lcards-orange)
  ha-color-red-60: var(--lcards-orange-medium-light)
  ha-color-red-70: var(--lcards-orange-medium-light)
  ha-color-red-80: var(--lcards-orange-light)
  ha-color-red-90: var(--lcards-orange-lightest)
  ha-color-red-95: var(--lcards-orange-lightest)
  ha-color-green-05: var(--lcards-green-darkest)
  ha-color-green-10: var(--lcards-green-darkest)
  ha-color-green-20: var(--lcards-green-dark)
  ha-color-green-30: var(--lcards-green-medium-dark)
  ha-color-green-40: var(--lcards-green-medium-dark)
  ha-color-green-50: var(--lcards-green)
  ha-color-green-60: var(--lcards-green-medium-light)
  ha-color-green-70: var(--lcards-green-medium-light)
  ha-color-green-80: var(--lcards-green-light)
  ha-color-green-90: var(--lcards-green-lightest)
  ha-color-green-95: var(--lcards-green-lightest)
  # Derived RGB
  rgb-card-background-color: "109,116,140"
  rgb-primary-text-color: "255,255,255"
  rgb-secondary-text-color: "255,255,255"
  rgb-primary-color: "255,103,83"
  rgb-accent-color: "231,68,42"
  rgb-primary-background-color: "0,0,0"
  rgb-secondary-background-color: "109,116,140"
  # Theme-specific
  lcars-tooltip-background: var(--lcars-ui-quaternary)
  lcars-tooltip-text: var(--lcars-ui-quaternary-text)
  lcars-card-mid-left-color: var(--lcards-orange)
  lcars-card-button: var(--lcards-orange)
  lcars-card-button-off: var(--lcards-gray-medium-light)
  lcars-card-button-barrel: var(--lcards-gray-medium-dark)
  lcars-card-background: var(--lcards-gray-medium-light)
  modes:
    light:
      lcars-ui-mix-color: black
      lcars-backlight-center: "#ffffff30"
      lcars-backlight-middle: transparent
      lcars-backlight-middle-location: 60%
      lcars-backlight-outer: transparent
      lcars-settings-card-text: var(--lcars-text-light)
      ha-color-form-background: color-mix(in srgb, var(--lcards-moonlight) 40%, transparent)
      lcars-ui-primary: var(--lcards-gray-medium-light)
      lcars-ui-secondary: var(--lcards-gray-light)
      lcars-ui-tertiary: var(--lcards-orange)
      lcars-ui-quaternary: var(--lcards-gray-medium-dark)
      lcars-alert-color: var(--lcards-orange-medium-dark)
      success-color: var(--lcards-green)
      warning-color: var(--lcards-orange-medium-light)
      error-color: var(--lcards-orange)
    dark:
      lcars-ui-mix-color: white
      lcars-backlight-center: "#ffffff10"
      lcars-backlight-middle: transparent
      lcars-backlight-middle-location: 70%
      lcars-backlight-outer: "#00000080"
      lcars-settings-card-text: var(--lcars-text-dark)
      ha-color-form-background: color-mix(in srgb, var(--lcards-moonlight) 30%, transparent)
      lcars-ui-primary: var(--lcards-gray)
      lcars-ui-secondary: var(--lcards-gray-medium-light)
      lcars-ui-tertiary: var(--lcards-orange-medium-dark)
      lcars-ui-quaternary: var(--lcards-gray-dark)
      lcars-alert-color: var(--lcards-orange-medium-dark)
      success-color: var(--lcards-green)
      warning-color: var(--lcards-orange)
      error-color: var(--lcards-orange-dark)
      lcars-ui-quaternary-text: var(--lcars-text-gray)
      lcars-card-top-text: var(--lcars-text-dark)
      lcars-card-bottom-text: var(--lcars-text-gray)

LCARS Lower Decks I:
  card-mod-theme: LCARS Lower Decks I
  <<: *lcars-variables
  <<: *base
  <<: *card-mod-css
  # UI Colors
  lcars-ui-primary: var(--lcars-gold)
  lcars-ui-primary-text: var(--lcars-text-dark)
  lcars-ui-secondary: var(--lcars-butter)
  lcars-ui-secondary-text: var(--lcars-text-dark)
  lcars-ui-tertiary: var(--lcars-orange)
  lcars-ui-tertiary-text: var(--lcars-text-dark)
  lcars-ui-quaternary: var(--lcars-darkpumpkin)
  lcars-ui-quaternary-text: var(--lcars-text-light)
  lcars-ui-accent-color: var(--lcars-orange)
  lcars-ui-accent-text: var(--lcars-text-dark)
  lcars-background-color: var(--lcars-black)
  lcars-background-text: var(--lcars-text-light)
  lcars-ui-text-heading: var(--lcars-text-gray)
  # Header / Sidebar
  lcars-ui-app-header-background-color: var(--lcars-ui-primary)
  lcars-ui-app-header-text-color: var(--lcars-ui-primary-text)
  lcars-ui-app-header-clock: var(--lcars-ui-tertiary)
  lcars-ui-config-button: var(--lcars-ui-quaternary)
  lcars-ui-config-icon: var(--lcars-ui-config-button)
  # Sidebar
  lcars-sidebar-background: var(--lcars-ui-primary)
  lcars-sidebar-item-color: var(--lcars-ui-secondary)
  lcars-sidebar-text: var(--lcars-ui-secondary-text)
  lcars-sidebar-icon-color: var(--lcars-card-top-text)
  lcars-sidebar-icon-background: var(--lcars-card-top-color)
  lcars-sidebar-selected-color: var(--lcars-ui-tertiary)
  lcars-sidebar-notification-color: var(--lcars-ui-tertiary)
  # Card colors
  lcars-card-top-color: var(--lcars-october-sunset)
  lcars-card-mid-color: var(--lcars-harvestgold)
  lcars-card-button-color: var(--lcars-harvestgold)
  lcars-card-bottom-color: var(--lcars-honey)
  lcars-settings-card-color: "#A56726"
  # Card text
  lcars-card-top-text: var(--lcars-text-dark)
  lcars-card-mid-text: var(--lcars-text-dark)
  lcars-card-button-text: var(--lcars-text-dark)
  lcars-card-bottom-text: var(--lcars-text-dark)
  # Status colors
  success-color: var(--lcars-green)
  warning-color: var(--lcars-sunflower)
  error-color: var(--lcars-dark-red)
  # Ripple
  lcars-ripple-color: var(--lcars-ui-mix-color)
  lcars-ripple-pressed-opacity: 0.4
  lcars-ripple-hover-opacity: 0.12
  # HA Color Palette
  ha-color-primary-05: color-mix(in oklch, var(--lcars-ui-tertiary) 10%, black)
  ha-color-primary-10: color-mix(in oklch, var(--lcars-ui-tertiary) 22%, black)
  ha-color-primary-20: color-mix(in oklch, var(--lcars-ui-tertiary) 44%, black)
  ha-color-primary-30: color-mix(in oklch, var(--lcars-ui-tertiary) 67%, black)
  ha-color-primary-40: var(--lcars-ui-tertiary)
  ha-color-primary-50: color-mix(in oklch, var(--lcars-ui-tertiary) 88%, white)
  ha-color-primary-60: color-mix(in oklch, var(--lcars-ui-tertiary) 70%, white)
  ha-color-primary-70: color-mix(in oklch, var(--lcars-ui-tertiary) 50%, white)
  ha-color-primary-80: color-mix(in oklch, var(--lcars-ui-tertiary) 30%, white)
  ha-color-primary-90: color-mix(in oklch, var(--lcars-ui-tertiary) 15%, white)
  ha-color-primary-95: color-mix(in oklch, var(--lcars-ui-tertiary) 8%, white)
  # Derived RGB
  rgb-card-background-color: "145,85,11"
  rgb-primary-text-color: "255,255,255"
  rgb-secondary-text-color: "255,255,255"
  rgb-primary-color: "255,119,0"
  rgb-accent-color: "255,119,0"
  rgb-primary-background-color: "0,0,0"
  rgb-secondary-background-color: "145,85,11"
  # Theme-specific
  lcars-tooltip-background: var(--lcars-ui-quaternary)
  lcars-tooltip-text: var(--lcars-ui-quaternary-text)
  modes:
    light:
      lcars-ui-mix-color: black
      lcars-backlight-center: "#ffffff30"
      lcars-backlight-middle: transparent
      lcars-backlight-middle-location: 60%
      lcars-backlight-outer: transparent
      lcars-settings-card-text: var(--lcars-text-light)
    dark:
      lcars-ui-mix-color: white
      lcars-backlight-center: "#ffffff10"
      lcars-backlight-middle: transparent
      lcars-backlight-middle-location: 70%
      lcars-backlight-outer: "#00000080"
      lcars-settings-card-text: var(--lcars-text-dark)
      lcars-ui-quaternary-text: var(--lcars-text-dark)

LCARS Lower Decks II:
  card-mod-theme: LCARS Lower Decks II
  <<: *lcars-variables
  <<: *base
  <<: *card-mod-css
  # UI Colors
  lcars-ui-primary: var(--lcars-gold)
  lcars-ui-primary-text: var(--lcars-text-dark)
  lcars-ui-secondary: var(--lcars-butter)
  lcars-ui-secondary-text: var(--lcars-text-dark)
  lcars-ui-tertiary: var(--lcars-orange)
  lcars-ui-tertiary-text: var(--lcars-text-dark)
  lcars-ui-quaternary: var(--lcars-darkpumpkin)
  lcars-ui-quaternary-text: var(--lcars-text-light)
  lcars-ui-accent-color: var(--lcars-orange)
  lcars-ui-accent-text: var(--lcars-text-dark)
  lcars-background-color: var(--lcars-black)
  lcars-background-text: var(--lcars-text-light)
  lcars-ui-text-heading: var(--lcars-text-gray)
  # Header / Sidebar
  lcars-ui-app-header-background-color: var(--lcars-ui-primary)
  lcars-ui-app-header-text-color: var(--lcars-ui-primary-text)
  lcars-ui-app-header-clock: var(--lcars-ui-tertiary)
  lcars-ui-config-button: var(--lcars-ui-quaternary)
  lcars-ui-config-icon: var(--lcars-ui-config-button)
  # Sidebar
  lcars-sidebar-background: var(--lcars-ui-primary)
  lcars-sidebar-item-color: var(--lcars-ui-secondary)
  lcars-sidebar-text: var(--lcars-ui-secondary-text)
  lcars-sidebar-icon-color: var(--lcars-card-top-text)
  lcars-sidebar-icon-background: var(--lcars-card-top-color)
  lcars-sidebar-selected-color: var(--lcars-ui-tertiary)
  lcars-sidebar-notification-color: var(--lcars-ui-tertiary)
  # Card colors
  lcars-card-top-color: var(--lcars-orange)
  lcars-card-mid-color: var(--lcars-taupe)
  lcars-card-button-color: var(--lcars-honey)
  lcars-card-bottom-color: var(--lcars-vanilla)
  lcars-settings-card-color: "#A56726"
  # Card text
  lcars-card-top-text: var(--lcars-text-dark)
  lcars-card-mid-text: var(--lcars-text-dark)
  lcars-card-button-text: var(--lcars-text-dark)
  lcars-card-bottom-text: var(--lcars-text-dark)
  # Status colors
  success-color: var(--lcars-green)
  warning-color: var(--lcars-sunflower)
  error-color: var(--lcars-dark-red)
  # Ripple
  lcars-ripple-color: var(--lcars-ui-mix-color)
  lcars-ripple-pressed-opacity: 0.4
  lcars-ripple-hover-opacity: 0.12
  # HA Color Palette
  ha-color-primary-05: color-mix(in oklch, var(--lcars-ui-tertiary) 10%, black)
  ha-color-primary-10: color-mix(in oklch, var(--lcars-ui-tertiary) 22%, black)
  ha-color-primary-20: color-mix(in oklch, var(--lcars-ui-tertiary) 44%, black)
  ha-color-primary-30: color-mix(in oklch, var(--lcars-ui-tertiary) 67%, black)
  ha-color-primary-40: var(--lcars-ui-tertiary)
  ha-color-primary-50: color-mix(in oklch, var(--lcars-ui-tertiary) 88%, white)
  ha-color-primary-60: color-mix(in oklch, var(--lcars-ui-tertiary) 70%, white)
  ha-color-primary-70: color-mix(in oklch, var(--lcars-ui-tertiary) 50%, white)
  ha-color-primary-80: color-mix(in oklch, var(--lcars-ui-tertiary) 30%, white)
  ha-color-primary-90: color-mix(in oklch, var(--lcars-ui-tertiary) 15%, white)
  ha-color-primary-95: color-mix(in oklch, var(--lcars-ui-tertiary) 8%, white)
  # Derived RGB
  rgb-card-background-color: "145,85,11"
  rgb-primary-text-color: "255,255,255"
  rgb-secondary-text-color: "255,255,255"
  rgb-primary-color: "255,119,0"
  rgb-accent-color: "255,119,0"
  rgb-primary-background-color: "0,0,0"
  rgb-secondary-background-color: "145,85,11"
  # Theme-specific
  lcars-tooltip-background: var(--lcars-ui-quaternary)
  lcars-tooltip-text: var(--lcars-ui-quaternary-text)
  modes:
    light:
      lcars-ui-mix-color: black
      lcars-backlight-center: "#ffffff30"
      lcars-backlight-middle: transparent
      lcars-backlight-middle-location: 60%
      lcars-backlight-outer: transparent
      lcars-settings-card-text: var(--lcars-text-light)
    dark:
      lcars-ui-mix-color: white
      lcars-backlight-center: "#ffffff10"
      lcars-backlight-middle: transparent
      lcars-backlight-middle-location: 70%
      lcars-backlight-outer: "#00000080"
      lcars-settings-card-text: var(--lcars-text-dark)
      lcars-ui-quaternary-text: var(--lcars-text-dark)

LCARS Modern:
  card-mod-theme: LCARS Modern
  <<: *lcars-variables
  <<: *base
  <<: *card-mod-css
  # UI Colors
  lcars-ui-primary: var(--lcars-violet-creme)
  lcars-ui-primary-text: var(--lcars-text-dark)
  lcars-ui-secondary: var(--lcars-sky)
  lcars-ui-secondary-text: var(--lcars-text-dark)
  lcars-ui-tertiary: var(--lcars-gold)
  lcars-ui-tertiary-text: var(--lcars-text-dark)
  lcars-ui-quaternary: var(--lcars-gray)
  lcars-ui-quaternary-text: var(--lcars-text-light)
  lcars-ui-accent-color: var(--lcars-orange)
  lcars-ui-accent-text: var(--lcars-text-dark)
  lcars-background-color: var(--lcars-black)
  lcars-background-text: var(--lcars-text-light)
  lcars-ui-text-heading: var(--lcars-text-gray)
  # Header / Sidebar
  lcars-ui-app-header-background-color: var(--lcars-ui-primary)
  lcars-ui-app-header-text-color: var(--lcars-ui-primary-text)
  lcars-ui-app-header-clock: var(--lcars-ui-tertiary)
  lcars-ui-config-button: var(--lcars-gray)
  lcars-ui-config-icon: var(--lcars-ui-config-button)
  # Sidebar
  lcars-sidebar-background: var(--lcars-ui-primary)
  lcars-sidebar-item-color: var(--lcars-ui-secondary)
  lcars-sidebar-text: var(--lcars-ui-secondary-text)
  lcars-sidebar-icon-color: var(--lcars-dark-gray)
  lcars-sidebar-icon-background: var(--lcars-card-top-color)
  lcars-sidebar-selected-color: var(--lcars-ui-tertiary)
  lcars-sidebar-notification-color: var(--lcars-ui-tertiary)
  # Card colors
  lcars-card-top-color: var(--lcars-gold)
  lcars-card-mid-color: var(--lcars-modern-light-gray)
  lcars-card-button-color: var(--lcars-gray)
  lcars-card-bottom-color: var(--lcars-sky)
  lcars-settings-card-color: "#727295"
  # Card text
  lcars-card-top-text: var(--lcars-text-dark)
  lcars-card-mid-text: var(--lcars-text-dark)
  lcars-card-button-text: var(--lcars-text-light)
  lcars-card-bottom-text: var(--lcars-text-dark)
  # Status colors
  success-color: var(--lcars-green)
  warning-color: var(--lcars-sunflower)
  error-color: var(--lcars-red)
  # Ripple
  lcars-ripple-color: var(--lcars-ui-mix-color)
  lcars-ripple-pressed-opacity: 0.4
  lcars-ripple-hover-opacity: 0.12
  # HA Color Palette
  ha-color-primary-05: color-mix(in oklch, var(--lcars-ui-tertiary) 10%, black)
  ha-color-primary-10: color-mix(in oklch, var(--lcars-ui-tertiary) 22%, black)
  ha-color-primary-20: color-mix(in oklch, var(--lcars-ui-tertiary) 44%, black)
  ha-color-primary-30: color-mix(in oklch, var(--lcars-ui-tertiary) 67%, black)
  ha-color-primary-40: var(--lcars-ui-tertiary)
  ha-color-primary-50: color-mix(in oklch, var(--lcars-ui-tertiary) 88%, white)
  ha-color-primary-60: color-mix(in oklch, var(--lcars-ui-tertiary) 70%, white)
  ha-color-primary-70: color-mix(in oklch, var(--lcars-ui-tertiary) 50%, white)
  ha-color-primary-80: color-mix(in oklch, var(--lcars-ui-tertiary) 30%, white)
  ha-color-primary-90: color-mix(in oklch, var(--lcars-ui-tertiary) 15%, white)
  ha-color-primary-95: color-mix(in oklch, var(--lcars-ui-tertiary) 8%, white)
  # Derived RGB
  rgb-card-background-color: "102,102,136"
  rgb-primary-text-color: "255,255,255"
  rgb-secondary-text-color: "255,255,255"
  rgb-primary-color: "255,170,0"
  rgb-accent-color: "255,119,0"
  rgb-primary-background-color: "0,0,0"
  rgb-secondary-background-color: "102,102,136"
  # Theme-specific
  lcars-tooltip-background: var(--lcars-ui-quaternary)
  lcars-tooltip-text: var(--lcars-ui-quaternary-text)
  modes:
    light:
      lcars-ui-mix-color: black
      lcars-backlight-center: "#ffffff30"
      lcars-backlight-middle: transparent
      lcars-backlight-middle-location: 60%
      lcars-backlight-outer: transparent
      lcars-settings-card-text: var(--lcars-text-light)
    dark:
      lcars-ui-mix-color: white
      lcars-backlight-center: "#ffffff10"
      lcars-backlight-middle: transparent
      lcars-backlight-middle-location: 70%
      lcars-backlight-outer: "#00000080"
      lcars-settings-card-text: var(--lcars-text-dark)
      lcars-ui-quaternary-text: var(--lcars-text-dark)
      lcars-card-button-text: var(--lcars-text-dark)

LCARS Navigation:
  card-mod-theme: LCARS Navigation
  <<: *lcars-variables
  <<: *base
  <<: *card-mod-css
  # UI Colors
  lcars-ui-primary: var(--lcars-olive)
  lcars-ui-primary-text: var(--lcars-text-dark)
  lcars-ui-secondary: var(--lcars-sand)
  lcars-ui-secondary-text: var(--lcars-text-dark)
  lcars-ui-tertiary: var(--lcars-lemon)
  lcars-ui-tertiary-text: var(--lcars-text-dark)
  lcars-ui-quaternary: var(--lcars-olive)
  lcars-ui-quaternary-text: var(--lcars-text-dark)
  lcars-ui-accent-color: var(--lcars-orange)
  lcars-ui-accent-text: var(--lcars-text-dark)
  lcars-background-color: var(--lcars-black)
  lcars-background-text: var(--lcars-text-light)
  lcars-ui-text-heading: var(--lcars-text-gray)
  # Header / Sidebar
  lcars-ui-app-header-background-color: var(--lcars-ui-primary)
  lcars-ui-app-header-text-color: var(--lcars-ui-primary-text)
  lcars-ui-app-header-clock: var(--lcars-ui-tertiary)
  lcars-ui-config-button: var(--lcars-ui-secondary)
  lcars-ui-config-icon: var(--lcars-ui-config-button)
  # Sidebar
  lcars-sidebar-background: var(--lcars-ui-primary)
  lcars-sidebar-item-color: var(--lcars-ui-secondary)
  lcars-sidebar-text: var(--lcars-ui-secondary-text)
  lcars-sidebar-icon-color: var(--lcars-card-top-text)
  lcars-sidebar-icon-background: var(--lcars-card-top-color)
  lcars-sidebar-selected-color: var(--lcars-ui-tertiary)
  lcars-sidebar-notification-color: var(--lcars-ui-tertiary)
  # Card colors
  lcars-card-top-color: var(--lcars-khaki-dark)
  lcars-card-mid-color: var(--lcars-cornflower)
  lcars-card-button-color: var(--lcars-olive)
  lcars-card-bottom-color: var(--lcars-olive)
  lcars-settings-card-color: "#7E764F"
  # Card text
  lcars-card-top-text: var(--lcars-text-dark)
  lcars-card-mid-text: var(--lcars-text-dark)
  lcars-card-button-text: var(--lcars-text-dark)
  lcars-card-bottom-text: var(--lcars-text-dark)
  # Status colors
  success-color: var(--lcars-green)
  warning-color: var(--lcars-dark-red)
  error-color: var(--lcars-gold)
  # Ripple
  lcars-ripple-color: var(--lcars-ui-mix-color)
  lcars-ripple-pressed-opacity: 0.4
  lcars-ripple-hover-opacity: 0.12
  # HA Color Palette
  ha-color-primary-05: color-mix(in oklch, var(--lcars-ui-tertiary) 10%, black)
  ha-color-primary-10: color-mix(in oklch, var(--lcars-ui-tertiary) 22%, black)
  ha-color-primary-20: color-mix(in oklch, var(--lcars-ui-tertiary) 44%, black)
  ha-color-primary-30: color-mix(in oklch, var(--lcars-ui-tertiary) 67%, black)
  ha-color-primary-40: var(--lcars-ui-tertiary)
  ha-color-primary-50: color-mix(in oklch, var(--lcars-ui-tertiary) 88%, white)
  ha-color-primary-60: color-mix(in oklch, var(--lcars-ui-tertiary) 70%, white)
  ha-color-primary-70: color-mix(in oklch, var(--lcars-ui-tertiary) 50%, white)
  ha-color-primary-80: color-mix(in oklch, var(--lcars-ui-tertiary) 30%, white)
  ha-color-primary-90: color-mix(in oklch, var(--lcars-ui-tertiary) 15%, white)
  ha-color-primary-95: color-mix(in oklch, var(--lcars-ui-tertiary) 8%, white)
  # Derived RGB
  rgb-card-background-color: "130,122,83"
  rgb-primary-text-color: "255,255,255"
  rgb-secondary-text-color: "255,255,255"
  rgb-primary-color: "247,238,81"
  rgb-accent-color: "255,119,0"
  rgb-primary-background-color: "0,0,0"
  rgb-secondary-background-color: "130,122,83"
  # Theme-specific
  lcars-tooltip-background: var(--lcars-ui-quaternary)
  lcars-tooltip-text: var(--lcars-ui-quaternary-text)
  modes:
    light:
      lcars-ui-mix-color: black
      lcars-backlight-center: "#ffffff30"
      lcars-backlight-middle: transparent
      lcars-backlight-middle-location: 60%
      lcars-backlight-outer: transparent
      lcars-settings-card-text: var(--lcars-text-light)
    dark:
      lcars-ui-mix-color: white
      lcars-backlight-center: "#ffffff10"
      lcars-backlight-middle: transparent
      lcars-backlight-middle-location: 70%
      lcars-backlight-outer: "#00000080"
      lcars-settings-card-text: var(--lcars-text-dark)

LCARS Nemesis Blue:
  card-mod-theme: LCARS Nemesis Blue
  <<: *lcars-variables
  <<: *base
  <<: *card-mod-css
  # UI Colors
  lcars-ui-primary: var(--lcars-evening)
  lcars-ui-primary-text: var(--lcars-text-light)
  lcars-ui-secondary: var(--lcars-wheat)
  lcars-ui-secondary-text: var(--lcars-text-dark)
  lcars-ui-tertiary: var(--lcars-pumpkinshade)
  lcars-ui-tertiary-text: var(--lcars-text-dark)
  lcars-ui-quaternary: var(--lcars-galaxy)
  lcars-ui-quaternary-text: var(--lcars-text-light)
  lcars-ui-accent-color: var(--lcars-orange)
  lcars-ui-accent-text: var(--lcars-text-dark)
  lcars-background-color: var(--lcars-black)
  lcars-background-text: var(--lcars-text-light)
  lcars-ui-text-heading: var(--lcars-text-gray)
  # Header / Sidebar
  lcars-ui-app-header-background-color: var(--lcars-ui-primary)
  lcars-ui-app-header-text-color: var(--lcars-ui-primary-text)
  lcars-ui-app-header-clock: var(--lcars-ui-tertiary)
  lcars-ui-config-button: var(--lcars-ice)
  lcars-ui-config-icon: var(--lcars-ui-config-button)
  # Sidebar
  lcars-sidebar-background: var(--lcars-ui-primary)
  lcars-sidebar-item-color: var(--lcars-ui-secondary)
  lcars-sidebar-text: var(--lcars-ui-secondary-text)
  lcars-sidebar-icon-color: var(--lcars-text-dark)
  lcars-sidebar-icon-background: var(--lcars-card-top-color)
  lcars-sidebar-selected-color: var(--lcars-ui-tertiary)
  lcars-sidebar-notification-color: var(--lcars-ui-tertiary)
  # Card colors
  lcars-card-top-color: var(--lcars-sky)
  lcars-card-mid-color: var(--lcars-ice)
  lcars-card-button-color: var(--lcars-honey)
  lcars-card-bottom-color: var(--lcars-cool)
  lcars-settings-card-color: "#6B72A3"
  # Card text
  lcars-card-top-text: var(--lcars-text-dark)
  lcars-card-mid-text: var(--lcars-text-dark)
  lcars-card-button-text: var(--lcars-text-dark)
  lcars-card-bottom-text: var(--lcars-text-dark)
  # Status colors
  success-color: var(--lcars-green)
  warning-color: var(--lcars-sunflower)
  error-color: var(--lcars-dark-red)
  # Ripple
  lcars-ripple-color: var(--lcars-ui-mix-color)
  lcars-ripple-pressed-opacity: 0.4
  lcars-ripple-hover-opacity: 0.12
  # HA Color Palette
  ha-color-primary-05: color-mix(in oklch, var(--lcars-ui-tertiary) 10%, black)
  ha-color-primary-10: color-mix(in oklch, var(--lcars-ui-tertiary) 22%, black)
  ha-color-primary-20: color-mix(in oklch, var(--lcars-ui-tertiary) 44%, black)
  ha-color-primary-30: color-mix(in oklch, var(--lcars-ui-tertiary) 67%, black)
  ha-color-primary-40: var(--lcars-ui-tertiary)
  ha-color-primary-50: color-mix(in oklch, var(--lcars-ui-tertiary) 88%, white)
  ha-color-primary-60: color-mix(in oklch, var(--lcars-ui-tertiary) 70%, white)
  ha-color-primary-70: color-mix(in oklch, var(--lcars-ui-tertiary) 50%, white)
  ha-color-primary-80: color-mix(in oklch, var(--lcars-ui-tertiary) 30%, white)
  ha-color-primary-90: color-mix(in oklch, var(--lcars-ui-tertiary) 15%, white)
  ha-color-primary-95: color-mix(in oklch, var(--lcars-ui-tertiary) 8%, white)
  # Derived RGB
  rgb-card-background-color: "68,74,119"
  rgb-primary-text-color: "255,255,255"
  rgb-secondary-text-color: "255,255,255"
  rgb-primary-color: "255,119,68"
  rgb-accent-color: "255,119,0"
  rgb-primary-background-color: "0,0,0"
  rgb-secondary-background-color: "68,74,119"
  # Theme-specific
  lcars-tooltip-background: var(--lcars-ui-quaternary)
  lcars-tooltip-text: var(--lcars-ui-quaternary-text)
  modes:
    light:
      lcars-ui-mix-color: black
      lcars-backlight-center: "#ffffff30"
      lcars-backlight-middle: transparent
      lcars-backlight-middle-location: 60%
      lcars-backlight-outer: transparent
      lcars-settings-card-text: var(--lcars-text-light)
    dark:
      lcars-ui-mix-color: white
      lcars-backlight-center: "#ffffff10"
      lcars-backlight-middle: transparent
      lcars-backlight-middle-location: 70%
      lcars-backlight-outer: "#00000080"
      lcars-settings-card-text: var(--lcars-text-dark)
      lcars-ui-primary-text: var(--lcars-text-dark)

LCARS Picard I:
  card-mod-theme: LCARS Picard I
  <<: *lcars-variables
  <<: *base
  <<: *card-mod-css
  # UI Colors
  lcars-ui-primary: var(--lcars-hellgrau)
  lcars-ui-primary-text: var(--lcars-text-dark)
  lcars-ui-secondary: var(--lcars-mittelgrau)
  lcars-ui-secondary-text: var(--lcars-text-light)
  lcars-ui-tertiary: var(--lcars-feuerrot)
  lcars-ui-tertiary-text: var(--lcars-text-dark)
  lcars-ui-quaternary: var(--lcars-mittelgrau)
  lcars-ui-quaternary-text: var(--lcars-text-light)
  lcars-ui-accent-color: var(--lcars-orange)
  lcars-ui-accent-text: var(--lcars-text-dark)
  lcars-background-color: var(--lcars-black)
  lcars-background-text: var(--lcars-text-light)
  lcars-ui-text-heading: var(--lcars-text-gray)
  # Header / Sidebar
  lcars-ui-app-header-background-color: var(--lcars-ui-primary)
  lcars-ui-app-header-text-color: var(--lcars-ui-primary-text)
  lcars-ui-app-header-clock: var(--lcars-ui-tertiary)
  lcars-ui-config-button: var(--lcars-cyan)
  lcars-ui-config-icon: var(--lcars-ui-config-button)
  # Sidebar
  lcars-sidebar-background: var(--lcars-ui-primary)
  lcars-sidebar-item-color: var(--lcars-ui-secondary)
  lcars-sidebar-text: var(--lcars-ui-secondary-text)
  lcars-sidebar-icon-color: var(--lcars-alt-dark-gray)
  lcars-sidebar-icon-background: var(--lcars-card-top-color)
  lcars-sidebar-selected-color: var(--lcars-ui-tertiary)
  lcars-sidebar-notification-color: var(--lcars-ui-tertiary)
  # Card colors
  lcars-card-top-color: var(--lcars-mittelgrau)
  lcars-card-mid-color: var(--lcars-mango)
  lcars-card-button-color: var(--lcars-feuerrot)
  lcars-card-bottom-color: var(--lcars-dunkelgrau)
  lcars-settings-card-color: "#6E758D"
  # Card text
  lcars-card-top-text: var(--lcars-text-light)
  lcars-card-mid-text: var(--lcars-text-dark)
  lcars-card-button-text: var(--lcars-text-dark)
  lcars-card-bottom-text: var(--lcars-text-light)
  # Status colors
  success-color: var(--lcars-green)
  warning-color: var(--lcars-sunflower)
  error-color: var(--lcars-dark-red)
  # Ripple
  lcars-ripple-color: var(--lcars-ui-mix-color)
  lcars-ripple-pressed-opacity: 0.4
  lcars-ripple-hover-opacity: 0.12
  # HA Color Palette
  ha-color-primary-05: color-mix(in oklch, var(--lcars-ui-tertiary) 10%, black)
  ha-color-primary-10: color-mix(in oklch, var(--lcars-ui-tertiary) 22%, black)
  ha-color-primary-20: color-mix(in oklch, var(--lcars-ui-tertiary) 44%, black)
  ha-color-primary-30: color-mix(in oklch, var(--lcars-ui-tertiary) 67%, black)
  ha-color-primary-40: var(--lcars-ui-tertiary)
  ha-color-primary-50: color-mix(in oklch, var(--lcars-ui-tertiary) 88%, white)
  ha-color-primary-60: color-mix(in oklch, var(--lcars-ui-tertiary) 70%, white)
  ha-color-primary-70: color-mix(in oklch, var(--lcars-ui-tertiary) 50%, white)
  ha-color-primary-80: color-mix(in oklch, var(--lcars-ui-tertiary) 30%, white)
  ha-color-primary-90: color-mix(in oklch, var(--lcars-ui-tertiary) 15%, white)
  ha-color-primary-95: color-mix(in oklch, var(--lcars-ui-tertiary) 8%, white)
  # Derived RGB
  rgb-card-background-color: "101,107,131"
  rgb-primary-text-color: "255,255,255"
  rgb-secondary-text-color: "255,255,255"
  rgb-primary-color: "231,67,42"
  rgb-accent-color: "255,119,0"
  rgb-primary-background-color: "0,0,0"
  rgb-secondary-background-color: "101,107,131"
  # Theme-specific
  lcars-tooltip-background: var(--lcars-ui-quaternary)
  lcars-tooltip-text: var(--lcars-ui-quaternary-text)
  modes:
    light:
      lcars-ui-mix-color: black
      lcars-backlight-center: "#ffffff30"
      lcars-backlight-middle: transparent
      lcars-backlight-middle-location: 60%
      lcars-backlight-outer: transparent
      lcars-settings-card-text: var(--lcars-text-light)
    dark:
      lcars-ui-mix-color: white
      lcars-backlight-center: "#ffffff10"
      lcars-backlight-middle: transparent
      lcars-backlight-middle-location: 70%
      lcars-backlight-outer: "#00000080"
      lcars-settings-card-text: var(--lcars-text-dark)
      lcars-ui-secondary-text: var(--lcars-text-dark)
      lcars-ui-quaternary-text: var(--lcars-text-dark)
      lcars-card-top-text: var(--lcars-text-dark)
      lcars-card-bottom-text: var(--lcars-text-gray)

LCARS Picard II:
  card-mod-theme: LCARS Picard II
  <<: *lcars-variables
  <<: *base
  <<: *card-mod-css
  # UI Colors
  lcars-ui-primary: var(--lcars-turquoise)
  lcars-ui-primary-text: var(--lcars-text-dark)
  lcars-ui-secondary: var(--lcars-cerulean)
  lcars-ui-secondary-text: var(--lcars-text-dark)
  lcars-ui-tertiary: var(--lcars-apricot)
  lcars-ui-tertiary-text: var(--lcars-text-dark)
  lcars-ui-quaternary: var(--lcars-midnight-blue)
  lcars-ui-quaternary-text: var(--lcars-text-light)
  lcars-ui-accent-color: var(--lcars-orange)
  lcars-ui-accent-text: var(--lcars-text-dark)
  lcars-background-color: var(--lcars-black)
  lcars-background-text: var(--lcars-text-light)
  lcars-ui-text-heading: var(--lcars-text-gray)
  # Header / Sidebar
  lcars-ui-app-header-background-color: var(--lcars-ui-primary)
  lcars-ui-app-header-text-color: var(--lcars-ui-primary-text)
  lcars-ui-app-header-clock: var(--lcars-ui-tertiary)
  lcars-ui-config-button: var(--lcars-apricot)
  lcars-ui-config-icon: var(--lcars-ui-config-button)
  # Sidebar
  lcars-sidebar-background: var(--lcars-ui-primary)
  lcars-sidebar-item-color: var(--lcars-ui-secondary)
  lcars-sidebar-text: var(--lcars-ui-secondary-text)
  lcars-sidebar-icon-color: var(--lcars-card-top-text)
  lcars-sidebar-icon-background: var(--lcars-card-top-color)
  lcars-sidebar-selected-color: var(--lcars-ui-tertiary)
  lcars-sidebar-notification-color: var(--lcars-ui-tertiary)
  # Card colors
  lcars-card-top-color: var(--lcars-beige)
  lcars-card-mid-color: var(--lcars-cerulean)
  lcars-card-button-color: var(--lcars-cerulean)
  lcars-card-bottom-color: var(--lcars-midnight-blue)
  lcars-settings-card-color: "#5077AF"
  # Card text
  lcars-card-top-text: var(--lcars-text-dark)
  lcars-card-mid-text: var(--lcars-text-dark)
  lcars-card-button-text: var(--lcars-text-dark)
  lcars-card-bottom-text: var(--lcars-text-light)
  # Status colors
  success-color: var(--lcars-green)
  warning-color: var(--lcars-sunflower)
  error-color: var(--lcars-red)
  # Ripple
  lcars-ripple-color: var(--lcars-ui-mix-color)
  lcars-ripple-pressed-opacity: 0.4
  lcars-ripple-hover-opacity: 0.12
  # HA Color Palette
  ha-color-primary-05: color-mix(in oklch, var(--lcars-ui-tertiary) 10%, black)
  ha-color-primary-10: color-mix(in oklch, var(--lcars-ui-tertiary) 22%, black)
  ha-color-primary-20: color-mix(in oklch, var(--lcars-ui-tertiary) 44%, black)
  ha-color-primary-30: color-mix(in oklch, var(--lcars-ui-tertiary) 67%, black)
  ha-color-primary-40: var(--lcars-ui-tertiary)
  ha-color-primary-50: color-mix(in oklch, var(--lcars-ui-tertiary) 88%, white)
  ha-color-primary-60: color-mix(in oklch, var(--lcars-ui-tertiary) 70%, white)
  ha-color-primary-70: color-mix(in oklch, var(--lcars-ui-tertiary) 50%, white)
  ha-color-primary-80: color-mix(in oklch, var(--lcars-ui-tertiary) 30%, white)
  ha-color-primary-90: color-mix(in oklch, var(--lcars-ui-tertiary) 15%, white)
  ha-color-primary-95: color-mix(in oklch, var(--lcars-ui-tertiary) 8%, white)
  # Derived RGB
  rgb-card-background-color: "1,37,86"
  rgb-primary-text-color: "255,255,255"
  rgb-secondary-text-color: "255,255,255"
  rgb-primary-color: "225,145,92"
  rgb-accent-color: "255,119,0"
  rgb-primary-background-color: "0,0,0"
  rgb-secondary-background-color: "1,37,86"
  # Theme-specific
  lcars-tooltip-background: var(--lcars-ui-quaternary)
  lcars-tooltip-text: var(--lcars-ui-quaternary-text)
  modes:
    light:
      lcars-ui-mix-color: black
      lcars-backlight-center: "#ffffff30"
      lcars-backlight-middle: transparent
      lcars-backlight-middle-location: 60%
      lcars-backlight-outer: transparent
      lcars-settings-card-text: var(--lcars-text-light)
    dark:
      lcars-ui-mix-color: white
      lcars-backlight-center: "#ffffff10"
      lcars-backlight-middle: transparent
      lcars-backlight-middle-location: 70%
      lcars-backlight-outer: "#00000080"
      lcars-settings-card-text: var(--lcars-text-dark)
      lcars-ui-quaternary-text: var(--lcars-text-gray)
      lcars-card-bottom-text: var(--lcars-text-gray)

LCARS Red Alert:
  card-mod-theme: LCARS Red Alert
  <<: *lcars-variables
  <<: *base
  <<: *card-mod-css
  # UI Colors
  lcars-ui-primary: var(--lcars-cardinal)
  lcars-ui-primary-text: var(--lcars-text-light)
  lcars-ui-secondary: var(--lcars-silver)
  lcars-ui-secondary-text: var(--lcars-text-dark)
  lcars-ui-tertiary: var(--lcars-scarlet)
  lcars-ui-tertiary-text: var(--lcars-text-dark)
  lcars-ui-quaternary: var(--lcars-dark-red)
  lcars-ui-quaternary-text: var(--lcars-text-light)
  lcars-ui-accent-color: var(--lcars-orange)
  lcars-ui-accent-text: var(--lcars-text-dark)
  lcars-background-color: var(--lcars-black)
  lcars-background-text: var(--lcars-text-light)
  lcars-ui-text-heading: var(--lcars-text-gray)
  # Header / Sidebar
  lcars-ui-app-header-background-color: var(--lcars-ui-primary)
  lcars-ui-app-header-text-color: var(--lcars-ui-primary-text)
  lcars-ui-app-header-clock: var(--lcars-ui-tertiary)
  lcars-ui-config-button: var(--lcars-ui-secondary)
  lcars-ui-config-icon: var(--lcars-ui-config-button)
  # Sidebar
  lcars-sidebar-background: var(--lcars-ui-primary)
  lcars-sidebar-item-color: var(--lcars-ui-secondary)
  lcars-sidebar-text: var(--lcars-ui-secondary-text)
  lcars-sidebar-icon-color: var(--lcars-card-top-text)
  lcars-sidebar-icon-background: var(--lcars-card-top-color)
  lcars-sidebar-selected-color: var(--lcars-ui-tertiary)
  lcars-sidebar-notification-color: var(--lcars-ui-tertiary)
  # Card colors
  lcars-card-top-color: var(--lcars-brick-red)
  lcars-card-mid-color: var(--lcars-mahogany)
  lcars-card-button-color: var(--lcars-muted-coral)
  lcars-card-bottom-color: var(--lcars-sienna)
  lcars-settings-card-color: "#A5645A"
  # Card text
  lcars-card-top-text: var(--lcars-text-light)
  lcars-card-mid-text: var(--lcars-text-light)
  lcars-card-button-text: var(--lcars-text-dark)
  lcars-card-bottom-text: var(--lcars-text-light)
  # Status colors
  success-color: var(--lcars-green)
  warning-color: var(--lcars-sunflower)
  error-color: var(--lcars-dark-red)
  # Ripple
  lcars-ripple-color: var(--lcars-ui-mix-color)
  lcars-ripple-pressed-opacity: 0.4
  lcars-ripple-hover-opacity: 0.12
  # HA Color Palette
  ha-color-primary-05: color-mix(in oklch, var(--lcars-ui-tertiary) 10%, black)
  ha-color-primary-10: color-mix(in oklch, var(--lcars-ui-tertiary) 22%, black)
  ha-color-primary-20: color-mix(in oklch, var(--lcars-ui-tertiary) 44%, black)
  ha-color-primary-30: color-mix(in oklch, var(--lcars-ui-tertiary) 67%, black)
  ha-color-primary-40: var(--lcars-ui-tertiary)
  ha-color-primary-50: color-mix(in oklch, var(--lcars-ui-tertiary) 88%, white)
  ha-color-primary-60: color-mix(in oklch, var(--lcars-ui-tertiary) 70%, white)
  ha-color-primary-70: color-mix(in oklch, var(--lcars-ui-tertiary) 50%, white)
  ha-color-primary-80: color-mix(in oklch, var(--lcars-ui-tertiary) 30%, white)
  ha-color-primary-90: color-mix(in oklch, var(--lcars-ui-tertiary) 15%, white)
  ha-color-primary-95: color-mix(in oklch, var(--lcars-ui-tertiary) 8%, white)
  # Derived RGB
  rgb-card-background-color: "54,0,0"
  rgb-primary-text-color: "255,255,255"
  rgb-secondary-text-color: "255,255,255"
  rgb-primary-color: "255,0,0"
  rgb-accent-color: "255,119,0"
  rgb-primary-background-color: "0,0,0"
  rgb-secondary-background-color: "54,0,0"
  # Theme-specific
  lcars-tooltip-background: var(--lcars-ui-quaternary)
  lcars-tooltip-text: var(--lcars-ui-quaternary-text)
  modes:
    light:
      lcars-ui-mix-color: black
      lcars-backlight-center: "#ffffff30"
      lcars-backlight-middle: transparent
      lcars-backlight-middle-location: 60%
      lcars-backlight-outer: transparent
      lcars-settings-card-text: var(--lcars-text-light)
    dark:
      lcars-ui-mix-color: white
      lcars-backlight-center: "#ffffff10"
      lcars-backlight-middle: transparent
      lcars-backlight-middle-location: 70%
      lcars-backlight-outer: "#00000080"
      lcars-settings-card-text: var(--lcars-text-dark)
      lcars-ui-primary-text: var(--lcars-text-dark)
      lcars-ui-quaternary-text: var(--lcars-text-mist)
      lcars-card-top-text: var(--lcars-text-dark)

LCARS Romulus:
  card-mod-theme: LCARS Romulus
  <<: *lcars-variables
  <<: *base
  <<: *card-mod-css
  # UI Colors
  lcars-ui-primary: var(--lcars-green)
  lcars-ui-primary-text: var(--lcars-text-dark)
  lcars-ui-secondary: var(--lcars-african-violet)
  lcars-ui-secondary-text: var(--lcars-text-dark)
  lcars-ui-tertiary: var(--lcars-orange)
  lcars-ui-tertiary-text: var(--lcars-text-dark)
  lcars-ui-quaternary: var(--lcars-green-middle)
  lcars-ui-quaternary-text: var(--lcars-text-light)
  lcars-ui-accent-color: var(--lcars-orange)
  lcars-ui-accent-text: var(--lcars-text-dark)
  lcars-background-color: var(--lcars-black)
  lcars-background-text: var(--lcars-text-light)
  lcars-ui-text-heading: var(--lcars-text-gray)
  # Header / Sidebar
  lcars-ui-app-header-background-color: var(--lcars-ui-primary)
  lcars-ui-app-header-text-color: var(--lcars-ui-primary-text)
  lcars-ui-app-header-clock: var(--lcars-ui-tertiary)
  lcars-ui-config-button: var(--lcars-aqua)
  lcars-ui-config-icon: var(--lcars-ui-config-button)
  # Sidebar
  lcars-sidebar-background: var(--lcars-ui-primary)
  lcars-sidebar-item-color: var(--lcars-ui-secondary)
  lcars-sidebar-text: var(--lcars-ui-secondary-text)
  lcars-sidebar-icon-color: var(--lcars-aqua)
  lcars-sidebar-icon-background: var(--lcars-card-top-color)
  lcars-sidebar-selected-color: var(--lcars-ui-tertiary)
  lcars-sidebar-notification-color: var(--lcars-ui-tertiary)
  # Card colors
  lcars-card-top-color: var(--lcars-cardinal)
  lcars-card-mid-color: var(--lcars-african-violet)
  lcars-card-button-color: var(--lcars-sky)
  lcars-card-bottom-color: var(--lcars-aqua)
  lcars-settings-card-color: "#428343"
  # Card text
  lcars-card-top-text: var(--lcars-text-light)
  lcars-card-mid-text: var(--lcars-text-dark)
  lcars-card-button-text: var(--lcars-text-dark)
  lcars-card-bottom-text: var(--lcars-text-dark)
  # Status colors
  success-color: var(--lcars-green)
  warning-color: var(--lcars-sunflower)
  error-color: var(--lcars-dark-red)
  # Ripple
  lcars-ripple-color: var(--lcars-ui-mix-color)
  lcars-ripple-pressed-opacity: 0.4
  lcars-ripple-hover-opacity: 0.12
  # HA Color Palette
  ha-color-primary-05: color-mix(in oklch, var(--lcars-ui-tertiary) 10%, black)
  ha-color-primary-10: color-mix(in oklch, var(--lcars-ui-tertiary) 22%, black)
  ha-color-primary-20: color-mix(in oklch, var(--lcars-ui-tertiary) 44%, black)
  ha-color-primary-30: color-mix(in oklch, var(--lcars-ui-tertiary) 67%, black)
  ha-color-primary-40: var(--lcars-ui-tertiary)
  ha-color-primary-50: color-mix(in oklch, var(--lcars-ui-tertiary) 88%, white)
  ha-color-primary-60: color-mix(in oklch, var(--lcars-ui-tertiary) 70%, white)
  ha-color-primary-70: color-mix(in oklch, var(--lcars-ui-tertiary) 50%, white)
  ha-color-primary-80: color-mix(in oklch, var(--lcars-ui-tertiary) 30%, white)
  ha-color-primary-90: color-mix(in oklch, var(--lcars-ui-tertiary) 15%, white)
  ha-color-primary-95: color-mix(in oklch, var(--lcars-ui-tertiary) 8%, white)
  # Derived RGB
  rgb-card-background-color: "15,86,22"
  rgb-primary-text-color: "255,255,255"
  rgb-secondary-text-color: "255,255,255"
  rgb-primary-color: "255,119,0"
  rgb-accent-color: "255,119,0"
  rgb-primary-background-color: "0,0,0"
  rgb-secondary-background-color: "15,86,22"
  # Theme-specific
  lcars-tooltip-background: var(--lcars-ui-quaternary)
  lcars-tooltip-text: var(--lcars-ui-quaternary-text)
  modes:
    light:
      lcars-ui-mix-color: black
      lcars-backlight-center: "#ffffff30"
      lcars-backlight-middle: transparent
      lcars-backlight-middle-location: 60%
      lcars-backlight-outer: transparent
      lcars-settings-card-text: var(--lcars-text-light)
    dark:
      lcars-ui-mix-color: white
      lcars-backlight-center: "#ffffff10"
      lcars-backlight-middle: transparent
      lcars-backlight-middle-location: 70%
      lcars-backlight-outer: "#00000080"
      lcars-settings-card-text: var(--lcars-text-dark)
      lcars-card-top-text: var(--lcars-text-dark)

LCARS TNG:
  card-mod-theme: LCARS TNG
  <<: *lcars-variables
  <<: *base
  <<: *card-mod-css
  # UI Colors
  lcars-ui-primary: var(--lcars-wheat-light)
  lcars-ui-primary-text: var(--lcars-text-dark)
  lcars-ui-secondary: var(--lcars-sunflower)
  lcars-ui-secondary-text: var(--lcars-text-dark)
  lcars-ui-tertiary: var(--lcars-lilac-light)
  lcars-ui-tertiary-text: var(--lcars-text-dark)
  lcars-ui-quaternary: var(--lcars-galaxy)
  lcars-ui-quaternary-text: var(--lcars-text-light)
  lcars-ui-accent-color: var(--lcars-orange)
  lcars-ui-accent-text: var(--lcars-text-dark)
  lcars-background-color: var(--lcars-black)
  lcars-background-text: var(--lcars-text-light)
  lcars-ui-text-heading: var(--lcars-text-gray)
  # Header / Sidebar
  lcars-ui-app-header-background-color: var(--lcars-tan)
  lcars-ui-app-header-text-color: var(--lcars-wheat-light)
  lcars-ui-app-header-clock: var(--lcars-ui-tertiary)
  lcars-ui-config-button: var(--lcars-antique-gold)
  lcars-ui-config-icon: var(--lcars-ui-config-button)
  # Sidebar
  lcars-sidebar-background: var(--lcars-ui-primary)
  lcars-sidebar-item-color: var(--lcars-ui-secondary)
  lcars-sidebar-text: var(--lcars-ui-secondary-text)
  lcars-sidebar-icon-color: var(--lcars-text-dark)
  lcars-sidebar-icon-background: var(--lcars-card-top-color)
  lcars-sidebar-selected-color: var(--lcars-ui-tertiary)
  lcars-sidebar-notification-color: var(--lcars-ui-tertiary)
  # Card colors
  lcars-card-top-color: var(--lcars-wheat-light)
  lcars-card-mid-color: var(--lcars-antique-gold)
  lcars-card-button-color: var(--lcars-amber)
  lcars-card-bottom-color: var(--lcars-wheat-light)
  lcars-settings-card-color: "#6B72A3"
  # Card text
  lcars-card-top-text: var(--lcars-text-dark)
  lcars-card-mid-text: var(--lcars-text-dark)
  lcars-card-button-text: var(--lcars-text-dark)
  lcars-card-bottom-text: var(--lcars-text-dark)
  # Status colors
  success-color: var(--lcars-khaki-light)
  warning-color: var(--lcars-vivid-crimson)
  error-color: var(--lcars-maroon)
  # Ripple
  lcars-ripple-color: var(--lcars-ui-mix-color)
  lcars-ripple-pressed-opacity: 0.4
  lcars-ripple-hover-opacity: 0.12
  # HA Color Palette
  ha-color-primary-05: color-mix(in oklch, var(--lcars-ui-tertiary) 10%, black)
  ha-color-primary-10: color-mix(in oklch, var(--lcars-ui-tertiary) 22%, black)
  ha-color-primary-20: color-mix(in oklch, var(--lcars-ui-tertiary) 44%, black)
  ha-color-primary-30: color-mix(in oklch, var(--lcars-ui-tertiary) 67%, black)
  ha-color-primary-40: var(--lcars-ui-tertiary)
  ha-color-primary-50: color-mix(in oklch, var(--lcars-ui-tertiary) 88%, white)
  ha-color-primary-60: color-mix(in oklch, var(--lcars-ui-tertiary) 70%, white)
  ha-color-primary-70: color-mix(in oklch, var(--lcars-ui-tertiary) 50%, white)
  ha-color-primary-80: color-mix(in oklch, var(--lcars-ui-tertiary) 30%, white)
  ha-color-primary-90: color-mix(in oklch, var(--lcars-ui-tertiary) 15%, white)
  ha-color-primary-95: color-mix(in oklch, var(--lcars-ui-tertiary) 8%, white)
  # Derived RGB
  rgb-card-background-color: "68,74,119"
  rgb-primary-text-color: "255,255,255"
  rgb-secondary-text-color: "255,255,255"
  rgb-primary-color: "204,153,204"
  rgb-accent-color: "255,119,0"
  rgb-primary-background-color: "0,0,0"
  rgb-secondary-background-color: "68,74,119"
  # Theme-specific
  lcars-tooltip-background: var(--lcars-ui-quaternary)
  lcars-tooltip-text: var(--lcars-ui-quaternary-text)
  modes:
    light:
      lcars-ui-mix-color: black
      lcars-backlight-center: "#ffffff30"
      lcars-backlight-middle: transparent
      lcars-backlight-middle-location: 60%
      lcars-backlight-outer: transparent
      lcars-settings-card-text: var(--lcars-text-light)
    dark:
      lcars-ui-mix-color: white
      lcars-backlight-center: "#ffffff10"
      lcars-backlight-middle: transparent
      lcars-backlight-middle-location: 70%
      lcars-backlight-outer: "#00000080"
      lcars-settings-card-text: var(--lcars-text-dark)

LCARS TNGbuttons:
  card-mod-theme: LCARS TNGbuttons
  <<: *lcars-variables
  <<: *base
  <<: *card-mod-css
  # UI Colors
  lcars-ui-primary: var(--lcars-peach-cream)
  lcars-ui-primary-text: var(--lcars-text-dark)
  lcars-ui-secondary: var(--lcars-sunflower)
  lcars-ui-secondary-text: var(--lcars-text-dark)
  lcars-ui-tertiary: var(--lcars-lilac-light)
  lcars-ui-tertiary-text: var(--lcars-text-dark)
  lcars-ui-quaternary: var(--lcars-galaxy)
  lcars-ui-quaternary-text: var(--lcars-text-light)
  lcars-ui-accent-color: var(--lcars-orange)
  lcars-ui-accent-text: var(--lcars-text-dark)
  lcars-background-color: var(--lcars-black)
  lcars-background-text: var(--lcars-text-light)
  lcars-ui-text-heading: var(--lcars-text-gray)
  # Header / Sidebar
  lcars-ui-app-header-background-color: var(--lcars-tan)
  lcars-ui-app-header-text-color: var(--lcars-wheat-light)
  lcars-ui-app-header-clock: var(--lcars-ui-tertiary)
  lcars-ui-config-button: var(--lcars-warm-gold)
  lcars-ui-config-icon: var(--lcars-ui-config-button)
  # Sidebar
  lcars-sidebar-background: var(--lcars-ui-primary)
  lcars-sidebar-item-color: var(--lcars-ui-secondary)
  lcars-sidebar-text: var(--lcars-ui-secondary-text)
  lcars-sidebar-icon-color: var(--lcars-text-dark)
  lcars-sidebar-icon-background: var(--lcars-card-top-color)
  lcars-sidebar-selected-color: var(--lcars-ui-tertiary)
  lcars-sidebar-notification-color: var(--lcars-ui-tertiary)
  # Card colors
  lcars-card-top-color: var(--lcars-peach-cream)
  lcars-card-mid-color: var(--lcars-honey)
  lcars-card-button-color: var(--lcars-sunflower)
  lcars-card-bottom-color: var(--lcars-warm-gold)
  lcars-settings-card-color: "#6B72A3"
  # Card text
  lcars-card-top-text: var(--lcars-text-dark)
  lcars-card-mid-text: var(--lcars-text-dark)
  lcars-card-button-text: var(--lcars-text-dark)
  lcars-card-bottom-text: var(--lcars-text-dark)
  # Status colors
  success-color: var(--lcars-sage)
  warning-color: var(--lcars-vivid-crimson)
  error-color: var(--lcars-maroon)
  # Ripple
  lcars-ripple-color: var(--lcars-ui-mix-color)
  lcars-ripple-pressed-opacity: 0.4
  lcars-ripple-hover-opacity: 0.12
  # HA Color Palette
  ha-color-primary-05: color-mix(in oklch, var(--lcars-ui-tertiary) 10%, black)
  ha-color-primary-10: color-mix(in oklch, var(--lcars-ui-tertiary) 22%, black)
  ha-color-primary-20: color-mix(in oklch, var(--lcars-ui-tertiary) 44%, black)
  ha-color-primary-30: color-mix(in oklch, var(--lcars-ui-tertiary) 67%, black)
  ha-color-primary-40: var(--lcars-ui-tertiary)
  ha-color-primary-50: color-mix(in oklch, var(--lcars-ui-tertiary) 88%, white)
  ha-color-primary-60: color-mix(in oklch, var(--lcars-ui-tertiary) 70%, white)
  ha-color-primary-70: color-mix(in oklch, var(--lcars-ui-tertiary) 50%, white)
  ha-color-primary-80: color-mix(in oklch, var(--lcars-ui-tertiary) 30%, white)
  ha-color-primary-90: color-mix(in oklch, var(--lcars-ui-tertiary) 15%, white)
  ha-color-primary-95: color-mix(in oklch, var(--lcars-ui-tertiary) 8%, white)
  # Derived RGB
  rgb-card-background-color: "68,74,119"
  rgb-primary-text-color: "255,255,255"
  rgb-secondary-text-color: "255,255,255"
  rgb-primary-color: "204,153,204"
  rgb-accent-color: "255,119,0"
  rgb-primary-background-color: "0,0,0"
  rgb-secondary-background-color: "68,74,119"
  # Theme-specific
  lcars-tooltip-background: var(--lcars-ui-quaternary)
  lcars-tooltip-text: var(--lcars-ui-quaternary-text)
  modes:
    light:
      lcars-ui-mix-color: black
      lcars-backlight-center: "#ffffff30"
      lcars-backlight-middle: transparent
      lcars-backlight-middle-location: 60%
      lcars-backlight-outer: transparent
      lcars-settings-card-text: var(--lcars-text-light)
    dark:
      lcars-ui-mix-color: white
      lcars-backlight-center: "#ffffff10"
      lcars-backlight-middle: transparent
      lcars-backlight-middle-location: 70%
      lcars-backlight-outer: "#00000080"
      lcars-settings-card-text: var(--lcars-text-dark)

LCARS Transporter:
  card-mod-theme: LCARS Transporter
  <<: *lcars-variables
  <<: *base
  <<: *card-mod-css
  # UI Colors
  lcars-ui-primary: var(--lcars-navy-gray)
  lcars-ui-primary-text: var(--lcars-text-light)
  lcars-ui-secondary: var(--lcars-slate-gray)
  lcars-ui-secondary-text: var(--lcars-text-dark)
  lcars-ui-tertiary: var(--lcars-coral)
  lcars-ui-tertiary-text: var(--lcars-text-dark)
  lcars-ui-quaternary: var(--lcars-navy-gray)
  lcars-ui-quaternary-text: var(--lcars-text-light)
  lcars-ui-accent-color: var(--lcars-orange)
  lcars-ui-accent-text: var(--lcars-text-dark)
  lcars-background-color: var(--lcars-black)
  lcars-background-text: var(--lcars-text-light)
  lcars-ui-text-heading: var(--lcars-text-gray)
  # Header / Sidebar
  lcars-ui-app-header-background-color: var(--lcars-ui-primary)
  lcars-ui-app-header-text-color: var(--lcars-ui-primary-text)
  lcars-ui-app-header-clock: var(--lcars-ui-tertiary)
  lcars-ui-config-button: var(--lcars-teal)
  lcars-ui-config-icon: var(--lcars-ui-config-button)
  # Sidebar
  lcars-sidebar-background: var(--lcars-ui-primary)
  lcars-sidebar-item-color: var(--lcars-ui-secondary)
  lcars-sidebar-text: var(--lcars-ui-secondary-text)
  lcars-sidebar-icon-color: var(--lcars-light-gray)
  lcars-sidebar-icon-background: var(--lcars-card-top-color)
  lcars-sidebar-selected-color: var(--lcars-ui-tertiary)
  lcars-sidebar-notification-color: var(--lcars-ui-tertiary)
  # Card colors
  lcars-card-top-color: var(--lcars-charcoal)
  lcars-card-mid-color: var(--lcars-charcoal)
  lcars-card-button-color: var(--lcars-teal)
  lcars-card-bottom-color: var(--lcars-navy-gray)
  lcars-settings-card-color: "#69768D"
  # Card text
  lcars-card-top-text: var(--lcars-text-light)
  lcars-card-mid-text: var(--lcars-text-light)
  lcars-card-button-text: var(--lcars-text-light)
  lcars-card-bottom-text: var(--lcars-text-light)
  # Status colors
  success-color: var(--lcars-green)
  warning-color: var(--lcars-dark-red)
  error-color: var(--lcars-gold)
  # Ripple
  lcars-ripple-color: var(--lcars-ui-mix-color)
  lcars-ripple-pressed-opacity: 0.4
  lcars-ripple-hover-opacity: 0.12
  # HA Color Palette
  ha-color-primary-05: color-mix(in oklch, var(--lcars-ui-tertiary) 10%, black)
  ha-color-primary-10: color-mix(in oklch, var(--lcars-ui-tertiary) 22%, black)
  ha-color-primary-20: color-mix(in oklch, var(--lcars-ui-tertiary) 44%, black)
  ha-color-primary-30: color-mix(in oklch, var(--lcars-ui-tertiary) 67%, black)
  ha-color-primary-40: var(--lcars-ui-tertiary)
  ha-color-primary-50: color-mix(in oklch, var(--lcars-ui-tertiary) 88%, white)
  ha-color-primary-60: color-mix(in oklch, var(--lcars-ui-tertiary) 70%, white)
  ha-color-primary-70: color-mix(in oklch, var(--lcars-ui-tertiary) 50%, white)
  ha-color-primary-80: color-mix(in oklch, var(--lcars-ui-tertiary) 30%, white)
  ha-color-primary-90: color-mix(in oklch, var(--lcars-ui-tertiary) 15%, white)
  ha-color-primary-95: color-mix(in oklch, var(--lcars-ui-tertiary) 8%, white)
  # Derived RGB
  rgb-card-background-color: "44,55,75"
  rgb-primary-text-color: "255,255,255"
  rgb-secondary-text-color: "255,255,255"
  rgb-primary-color: "250,104,81"
  rgb-accent-color: "255,119,0"
  rgb-primary-background-color: "0,0,0"
  rgb-secondary-background-color: "44,55,75"
  # Theme-specific
  lcars-tooltip-background: var(--lcars-ui-quaternary)
  lcars-tooltip-text: var(--lcars-ui-quaternary-text)
  modes:
    light:
      lcars-ui-mix-color: black
      lcars-backlight-center: "#ffffff30"
      lcars-backlight-middle: transparent
      lcars-backlight-middle-location: 60%
      lcars-backlight-outer: transparent
      lcars-settings-card-text: var(--lcars-text-light)
    dark:
      lcars-ui-mix-color: white
      lcars-backlight-center: "#ffffff10"
      lcars-backlight-middle: transparent
      lcars-backlight-middle-location: 70%
      lcars-backlight-outer: "#00000080"
      lcars-settings-card-text: var(--lcars-text-dark)
      lcars-ui-primary-text: var(--lcars-text-gray)
      lcars-ui-quaternary-text: var(--lcars-text-gray)
      lcars-card-button-text: var(--lcars-text-dark)
      lcars-card-bottom-text: var(--lcars-text-gray)

LCARS Zeldaar:
  card-mod-theme: LCARS Zeldaar
  <<: *lcars-variables
  <<: *base
  <<: *card-mod-css
  # UI Colors
  lcars-ui-primary: var(--lcars-violet-creme)
  lcars-ui-primary-text: var(--lcars-text-dark)
  lcars-ui-secondary: var(--lcars-honey)
  lcars-ui-secondary-text: var(--lcars-text-dark)
  lcars-ui-tertiary: var(--lcars-roseblush)
  lcars-ui-tertiary-text: var(--lcars-text-dark)
  lcars-ui-quaternary: var(--lcars-mauve)
  lcars-ui-quaternary-text: var(--lcars-text-light)
  lcars-ui-accent-color: var(--lcars-orange)
  lcars-ui-accent-text: var(--lcars-text-dark)
  lcars-background-color: var(--lcars-black)
  lcars-background-text: var(--lcars-text-light)
  lcars-ui-text-heading: var(--lcars-text-gray)
  # Header / Sidebar
  lcars-ui-app-header-background-color: var(--lcars-ui-primary)
  lcars-ui-app-header-text-color: var(--lcars-ui-primary-text)
  lcars-ui-app-header-clock: var(--lcars-ui-tertiary)
  lcars-ui-config-button: var(--lcars-african-violet)
  lcars-ui-config-icon: var(--lcars-ui-config-button)
  # Sidebar
  lcars-sidebar-background: var(--lcars-ui-primary)
  lcars-sidebar-item-color: var(--lcars-ui-secondary)
  lcars-sidebar-text: var(--lcars-ui-secondary-text)
  lcars-sidebar-icon-color: var(--lcars-card-top-text)
  lcars-sidebar-icon-background: var(--lcars-card-top-color)
  lcars-sidebar-selected-color: var(--lcars-ui-tertiary)
  lcars-sidebar-notification-color: var(--lcars-ui-tertiary)
  # Card colors
  lcars-card-top-color: var(--lcars-bluey)
  lcars-card-mid-color: var(--lcars-khaki)
  lcars-card-button-color: var(--lcars-african-violet)
  lcars-card-bottom-color: var(--lcars-roseblush)
  lcars-settings-card-color: "#986398"
  # Card text
  lcars-card-top-text: var(--lcars-text-dark)
  lcars-card-mid-text: var(--lcars-text-dark)
  lcars-card-button-text: var(--lcars-text-dark)
  lcars-card-bottom-text: var(--lcars-text-dark)
  # Status colors
  success-color: var(--lcars-green)
  warning-color: var(--lcars-sunflower)
  error-color: var(--lcars-dark-red)
  # Ripple
  lcars-ripple-color: var(--lcars-ui-mix-color)
  lcars-ripple-pressed-opacity: 0.4
  lcars-ripple-hover-opacity: 0.12
  # HA Color Palette
  ha-color-primary-05: color-mix(in oklch, var(--lcars-ui-tertiary) 10%, black)
  ha-color-primary-10: color-mix(in oklch, var(--lcars-ui-tertiary) 22%, black)
  ha-color-primary-20: color-mix(in oklch, var(--lcars-ui-tertiary) 44%, black)
  ha-color-primary-30: color-mix(in oklch, var(--lcars-ui-tertiary) 67%, black)
  ha-color-primary-40: var(--lcars-ui-tertiary)
  ha-color-primary-50: color-mix(in oklch, var(--lcars-ui-tertiary) 88%, white)
  ha-color-primary-60: color-mix(in oklch, var(--lcars-ui-tertiary) 70%, white)
  ha-color-primary-70: color-mix(in oklch, var(--lcars-ui-tertiary) 50%, white)
  ha-color-primary-80: color-mix(in oklch, var(--lcars-ui-tertiary) 30%, white)
  ha-color-primary-90: color-mix(in oklch, var(--lcars-ui-tertiary) 15%, white)
  ha-color-primary-95: color-mix(in oklch, var(--lcars-ui-tertiary) 8%, white)
  # Derived RGB
  rgb-card-background-color: "119,68,119"
  rgb-primary-text-color: "255,255,255"
  rgb-secondary-text-color: "255,255,255"
  rgb-primary-color: "204,102,102"
  rgb-accent-color: "255,119,0"
  rgb-primary-background-color: "0,0,0"
  rgb-secondary-background-color: "119,68,119"
  # Theme-specific
  lcars-tooltip-background: var(--lcars-ui-quaternary)
  lcars-tooltip-text: var(--lcars-ui-quaternary-text)
  modes:
    light:
      lcars-ui-mix-color: black
      lcars-backlight-center: "#ffffff30"
      lcars-backlight-middle: transparent
      lcars-backlight-middle-location: 60%
      lcars-backlight-outer: transparent
      lcars-settings-card-text: var(--lcars-text-light)
    dark:
      lcars-ui-mix-color: white
      lcars-backlight-center: "#ffffff10"
      lcars-backlight-middle: transparent
      lcars-backlight-middle-location: 70%
      lcars-backlight-outer: "#00000080"
      lcars-settings-card-text: var(--lcars-text-dark)

# ================ Paste your themes here =============== |
# (or add a file to src/themes/ and run generate_themes.py)
`,er=class er2 extends xr{static get properties(){return{title:{type:String},count:{type:Number},totalCount:{type:Number,attribute:"total-count"},expanded:{type:Boolean},countLabel:{type:String,attribute:"count-label"}}}constructor(){super(),this.title="",this.count=0,this.totalCount=null,this.expanded=false,this.countLabel="items"}static get styles(){return yr`
      :host {
        display: block;
      }

      .section-wrapper {
        margin-bottom: var(--ha-space-3);
        border: var(--ha-border-width-sm) solid var(--divider-color);
        border-radius: var(--ha-border-radius-md);
        overflow: hidden;
        background: var(--card-background-color);
        transition: border var(--ha-animation-duration-normal, 0.2s) ease;
      }

      /* Dashed border when collapsed */
      :host(:not([expanded])) .section-wrapper {
        border: var(--ha-border-width-md) dashed var(--divider-color);
      }

      .section-header {
        position: sticky;
        top: 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--ha-space-3) var(--ha-space-4);
        background: var(--secondary-background-color);
        border: var(--ha-border-width-sm) solid var(--divider-color);
        border-radius: var(--ha-border-radius-md);
        z-index: 1;
        cursor: pointer;
        user-select: none;
        transition: all var(--ha-animation-duration-normal, 0.2s) ease;
      }

      .section-header:hover {
        background: var(--divider-color);
        border-color: var(--primary-color);
        box-shadow: var(--ha-box-shadow-s);
      }

      .section-header:focus-visible {
        outline: 2px solid var(--primary-color);
        outline-offset: 2px;
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: var(--ha-space-2);
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: var(--ha-space-2);
      }

      .actions-slot {
        display: flex;
        align-items: center;
        gap: var(--ha-space-1);
      }

      .section-chevron {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        font-size: 18px;
        color: var(--primary-color);
        transition: transform var(--ha-animation-duration-normal, 0.2s) ease;
        flex-shrink: 0;
      }

      :host([expanded]) .section-chevron {
        transform: rotate(90deg);
      }

      .section-title {
        font-size: var(--ha-font-size-m);
        font-weight: 600;
        color: var(--primary-text-color);
      }

      .section-content {
        max-height: 0;
        overflow: hidden;
        opacity: 0;
        transition: max-height var(--ha-animation-duration-slow, 0.3s) ease, opacity var(--ha-animation-duration-normal, 0.2s) ease;
        border-top: var(--ha-border-width-sm) solid transparent;
      }

      :host([expanded]) .section-content {
        max-height: 100000px; /* Large enough for any content */
        opacity: 1;
        border-top-color: var(--divider-color);
      }
    `}render(){return l`
      <div class="section-wrapper">
        <div
          class="section-header"
          @click=${this._toggleExpanded}
          @keydown=${this._handleKeyDown}
          tabindex="0"
          role="button"
          aria-expanded=${this.expanded}
          aria-controls="section-content">
          <div class="header-left">
            <span class="section-chevron" aria-hidden="true">▶</span>
            <span class="section-title">${this.title}</span>
          </div>
          <div class="header-right">
            <div class="actions-slot" @click=${r=>r.stopPropagation()}>
              <slot name="actions"></slot>
            </div>
            <ha-assist-chip
              .label=${this.totalCount!==null?`${this.count} / ${this.totalCount}`:`${this.count} ${this.countLabel}`}
              .filled=${true}
              style="
                --ha-assist-chip-filled-container-color: ${this.totalCount!==null?this.count===this.totalCount?"var(--success-color)":"var(--warning-color)":"var(--primary-color)"};
                --md-assist-chip-label-text-color: white;
                --md-sys-color-on-surface: white;
              "
            >
            </ha-assist-chip>
          </div>
        </div>
        <div class="section-content" id="section-content" role="region">
          <slot></slot>
        </div>
      </div>
    `}_toggleExpanded(){this.expanded=!this.expanded,this.dispatchEvent(new CustomEvent("toggle",{detail:{expanded:this.expanded},bubbles:true,composed:true}))}_handleKeyDown(r){(r.key==="Enter"||r.key===" ")&&(r.preventDefault(),this._toggleExpanded())}};k(er,"LCARdSCollapsibleSection");let rr=er;customElements.get("lcards-collapsible-section")||customElements.define("lcards-collapsible-section",rr);const G=["orange","gray","blue","green","yellow"],Or=["05","20","30","40","70","80","90"],Ir=["10","50","60","95"],Br=(()=>{const b={};for(const r of G)for(const a of y)b[J(r,a).slice(2)]=I[Q(r,Number(a))];return b["lcards-moonlight"]=I.moonlight,b})(),_=(()=>{try{const b=fr(Fr),r=Object.keys(b).filter(t=>!t.startsWith("(DO NOT")),a={...b["(DO NOT USE/MODIFY)=== LCARS variables"]||{},...b["(DO NOT USE/MODIFY)=== Base customizations"]||{}},e={light:{},dark:{}};for(const t of["light","dark"]){const n=Object.values(b).filter(o=>{var c;return(c=o==null?void 0:o.modes)==null?void 0:c[t]});if(n.length)for(const[o,c]of Object.entries(n[0].modes[t]))n.every(i=>i.modes[t][o]===c)&&(e[t][o]=c)}return{themes:b,names:r.sort(),boilerplate:a,modeScopedBoilerplate:e}}catch(b){return Z.error("[ThemeGeneratorView] Failed to parse bundled HA-LCARS theme library",b),{themes:{},names:[],boilerplate:{},modeScopedBoilerplate:{light:{},dark:{}}}}})(),mr={...P,..._.boilerplate},V={orange:"Orange",gray:"Gray",blue:"Blue",green:"Green",yellow:"Yellow"},K={primary:"Primary",neutral:"Neutral",orange:"Orange (Warning)",red:"Red (Danger)",green:"Green (Success)"},br={primary:"primary",neutral:"neutral",orange:"warning",red:"danger",green:"success"},qr={primary:"mdi:star-four-points",neutral:"mdi:circle-outline",orange:"mdi:alert",red:"mdi:alert-octagon",green:"mdi:check-circle"},Mr={light:"mdi:lightbulb",switch:"mdi:toggle-switch",fan:"mdi:fan",cover:"mdi:window-shutter",lock:"mdi:lock",climate:"mdi:thermostat",binary_sensor:"mdi:radiobox-marked",alarm_control_panel:"mdi:shield-home",media_player:"mdi:cast",person:"mdi:account",device_tracker:"mdi:crosshairs-gps",humidifier:"mdi:air-humidifier",vacuum:"mdi:robot-vacuum",siren:"mdi:bullhorn",water_heater:"mdi:water-boiler",valve:"mdi:valve",input_boolean:"mdi:toggle-switch-outline",automation:"mdi:robot",sun:"mdi:white-balance-sunny"};function Nr(b,r){if(r==="off")return false;switch(b){case"alarm_control_panel":return r!=="disarmed";case"cover":case"valve":return r!=="closed";case"device_tracker":case"person":return r!=="not_home";case"lock":return r!=="locked";case"media_player":return r!=="standby";case"vacuum":return!["idle","docked","paused"].includes(r);default:return true}}k(Nr,"isDomainStatePreviewActive");const N=[{domain:"light",onState:"on",offState:"off"},{domain:"switch",onState:"on",offState:"off"},{domain:"fan",onState:"on",offState:"off"},{domain:"cover",onState:"open",offState:"closed"},{domain:"lock",onState:"locked",offState:"unlocked"},{domain:"climate",onState:"heat",offState:"off"},{domain:"binary_sensor",onState:"on",offState:"off"},{domain:"alarm_control_panel",onState:"armed_home",offState:"disarmed"},{domain:"media_player",onState:"playing",offState:"off"},{domain:"humidifier",onState:"on",offState:"off"},{domain:"vacuum",onState:"cleaning",offState:"docked"},{domain:"siren",onState:"on",offState:"off"},{domain:"water_heater",onState:"on",offState:"off"},{domain:"valve",onState:"open",offState:"closed"},{domain:"input_boolean",onState:"on",offState:"off"},{domain:"automation",onState:"on",offState:"off"},{domain:"sun",onState:"above_horizon",offState:"below_horizon"}],Pr={"05":"Darkest",10:"10",20:"Dark",30:"Medium Dark",40:"Base",50:"50",60:"60",70:"Medium Light",80:"Light",90:"Lightest",95:"95"},Gr=/^ha-color-(primary|neutral|orange|red|green)-(\d{2})$/,Ur=new Set(A.map(b=>b.key)),vr=new Set(["primary-color","accent-color","card-background-color","secondary-background-color","primary-background-color","primary-text-color","secondary-text-color","error-color","success-color","warning-color","info-color"]),X=new Set(["state-active-color","state-inactive-color","state-unavailable-color","state-unknown-color","state-color"]),U=["LCARS UI","Core","Text","Cards","Sidebar","Status Colours","Alert Colours","Tooltip & Misc"],Wr=U.filter(b=>A.some(r=>r.group===b)),jr=/^state-([a-z0-9_]+)-([a-z0-9_]+)-color$/,O={lcars:"HA-LCARS Default",ha:"HA Default",global:"Global Default",unknown:null},Yr=[{role:"primary",variant:"brand",label:"Primary"},{role:"neutral",variant:"neutral",label:"Neutral"},{role:"danger",variant:"danger",label:"Danger"},{role:"warning",variant:"warning",label:"Warning"},{role:"success",variant:"success",label:"Success"}],Vr=[{appearance:"accent",label:"Accent"},{appearance:"filled",label:"Filled"},{appearance:"outlined",label:"Outlined"},{appearance:"plain",label:"Plain"}],Kr=[{key:"lcars-ui-primary",textKey:"lcars-ui-primary-text",label:"Primary"},{key:"lcars-ui-secondary",textKey:"lcars-ui-secondary-text",label:"Secondary"},{key:"lcars-ui-tertiary",textKey:"lcars-ui-tertiary-text",label:"Tertiary"},{key:"lcars-ui-quaternary",textKey:"lcars-ui-quaternary-text",label:"Quaternary"},{key:"lcars-ui-accent-color",textKey:"lcars-ui-accent-text",label:"Accent"}],kr=[{group:"Header / Middle / Footer",demos:[{slot:"header",label:"header-left",config:{type:"markdown",content:"# HEADER-LEFT",card_mod:{class:"header-left"}}},{slot:"middle",label:"middle-left",config:{type:"markdown",content:"# MIDDLE-LEFT",card_mod:{class:"middle-left"}}},{slot:"footer",label:"footer-left",config:{type:"markdown",content:"# FOOTER-LEFT",card_mod:{class:"footer-left"}}}]},{group:"Buttons",demos:[{slot:"btn-small",label:"button-small",config:{type:"button",show_name:true,show_icon:true,name:"Desk Lamp",icon:"mdi:desk-lamp",card_mod:{class:"button-small"}}},{slot:"btn-large",label:"button-large",config:{type:"button",show_name:true,show_icon:true,name:"Reload",icon:"mdi:refresh",card_mod:{class:"button-large"}}},{slot:"btn-lozenge-l",label:"button-lozenge-left",narrow:true,config:{type:"button",show_name:true,show_icon:true,name:"Speakers",icon:"mdi:speaker-multiple",card_mod:{class:"button-lozenge-left"}}},{slot:"btn-lozenge-r",label:"button-lozenge-right",narrow:true,config:{type:"button",show_name:true,show_icon:true,name:"Lightsaber",icon:"mdi:lightsaber",card_mod:{class:"button-lozenge-right"}}},{slot:"btn-bullet-l",label:"button-bullet-left",narrow:true,config:{type:"button",show_name:true,show_icon:true,name:"Tree",icon:"mdi:pine-tree",card_mod:{class:"button-bullet-left"}}},{slot:"btn-bullet-r",label:"button-bullet-right",narrow:true,config:{type:"button",show_name:true,show_icon:true,name:"Counter",icon:"mdi:lightbulb-group",card_mod:{class:"button-bullet-right"}}}]},{group:"Standalone Bars",demos:[{slot:"bar-l",label:"bar-left",config:{type:"markdown",content:"bar-left",card_mod:{class:"bar-left"}}},{slot:"bar-r",label:"bar-right",config:{type:"markdown",content:"bar-right",card_mod:{class:"bar-right"}}}]}],Xr=kr.flatMap(b=>b.demos),tr=class tr2 extends xr{static get properties(){return{hass:{type:Object},_model:{state:true},_pasteYamlText:{state:true},_importError:{state:true},_importFeedback:{state:true},_previewMode:{state:true},_copyFeedback:{state:true},_rawFilterText:{state:true},_selectedLibraryTheme:{state:true},_startMode:{state:true},_legacySearchText:{state:true},_legacyActiveCategory:{state:true},_expandedLegacyGroups:{state:true},_domainDemoActive:{state:true},_labViewMode:{state:true}}}constructor(){super(),this.hass=void 0,this._model=this._createDefaultModel(),this._pasteYamlText="",this._importError=null,this._importFeedback=null,this._previewMode="dark",this._copyFeedback=false,this._rawFilterText="",this._legacySearchText="",this._legacyActiveCategory="all",this._expandedLegacyGroups=new Set(["LCARS UI"]),this._domainDemoActive=true,this._labViewMode="config",this._importedThemeContext=null,this._staticColorContextSource=void 0,this._staticColorContextCache=null,this._liveContextSource=null,this._liveContextCache=null,this._startMode="library",this._selectedLibraryTheme="LCARS Default",this._importThemeObject("LCARS Default",_.themes["LCARS Default"]),this._lcarsCardModWrappers={},this._domainDemoWrappers={},this._demoHassSourceHass=null,this._demoHassSourceActive=null,this._demoHassCache=null}_createDefaultModel(){return{name:"My HA-LCARS Theme",roles:{primary:{source:"none"},neutral:{source:"none"},orange:{source:"none"},red:{source:"none"},green:{source:"none"}},customAnchors:{},customAnchorsTouched:{},customAnchorsDark:{},customAnchorsDarkTouched:{},importedRamps:{},importedRampsRaw:{},legacy:{},domainOverrides:{},raw:[]}}static get styles(){return[Tr,Lr,Dr,yr`
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
        .gen-field-label-row { display: flex; align-items: center; gap: 4px; }
        .gen-field-info { position: relative; display: inline-flex; }
        .gen-field-info-btn { --ha-icon-button-size: 20px; --mdc-icon-size: 16px; color: var(--secondary-text-color); }
        .gen-field-info-popup {
          position: absolute; left: 0; top: 100%; z-index: 10; margin-top: 4px;
          width: max-content; max-width: 260px; padding: var(--ha-space-2) var(--ha-space-3);
          background: var(--card-background-color); color: var(--primary-text-color);
          border: var(--ha-border-width-sm) solid var(--divider-color); border-radius: var(--ha-border-radius-md);
          box-shadow: var(--ha-box-shadow-m, 0 2px 8px rgba(0, 0, 0, 0.3));
          font-size: var(--ha-font-size-s); line-height: 1.4; font-weight: normal;
          opacity: 0; pointer-events: none; transition: opacity 0.15s ease;
        }
        .gen-field-info:hover .gen-field-info-popup, .gen-field-info:focus-within .gen-field-info-popup {
          opacity: 1; pointer-events: auto;
        }
        .gen-field-varname { font-family: 'Fira Code','Consolas','Menlo',monospace; font-size: 11px; color: var(--secondary-text-color); opacity: 0.8; font-weight: normal; }
        .gen-revert-spacer { width: 40px; }
        .gen-row-header {
          display: grid; grid-template-columns: minmax(160px, 260px) 1fr auto 1fr auto; gap: var(--ha-space-3);
          font-size: var(--ha-font-size-s); color: var(--secondary-text-color); font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.04em; padding: 0 0 var(--ha-space-2) 0;
        }
        .gen-search-container { display: flex; gap: var(--ha-space-3); align-items: center; margin-bottom: var(--ha-space-3); }
        .gen-search-wrapper { flex: 1; position: relative; min-width: 200px; max-width: 400px; }
        .gen-legacy-search { width: 100%; }
        .gen-search-clear { position: absolute; right: var(--ha-space-1); top: 50%; transform: translateY(-50%); --ha-icon-button-size: 32px; }
        .gen-category-filters { margin-bottom: var(--ha-space-3); }
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
        /* Same sticky-toolbar rationale as .gen-preview-mode-toolbar above — this is now the
           top-level nav for the whole view, so it should stay reachable while scrolling either
           panel. .gen-lab-tab-panel[hidden] is defensive documentation only: Lit's ?hidden
           directive already sets the native hidden DOM attribute, which the browser's UA
           stylesheet display:none's on its own — the rule below never needs to fire in practice,
           but keeps intent explicit if that UA default is ever overridden upstream. */
        .gen-lab-tab-toggle { position: sticky; top: 0; z-index: 2; padding-block: var(--ha-space-2); margin-bottom: var(--ha-space-2);
          background: color-mix(in srgb, var(--secondary-background-color) 30%, color-mix(in srgb, var(--primary-background-color) 95%, transparent)); }
        .gen-lab-tab-panel[hidden] { display: none; }
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
        /* Which ha-button appearance(s) — Accent/Filled background, Filled & Plain text — a tone
           stop feeds, see _buttonTierTagBadge. Shared visual style for both the swatch-overlay tag
           (positioned via the modifier below) and the plain inline legend/label chip
           (gen-tier-legend, and the Custom-mode tone labels) — same badge, two different placements. */
        .gen-tier-badge {
          display: inline-block; font-size: 11px; line-height: 1.5; font-weight: 700;
          font-family: 'Fira Code','Consolas','Menlo',monospace; padding: 0 4px; border-radius: 3px;
          background: var(--primary-color); color: var(--text-primary-color, #fff);
        }
        .gen-scale-swatch-role-tag { position: absolute; left: 2px; top: 2px; pointer-events: none; user-select: none; }
        .gen-tier-legend { display: flex; flex-wrap: wrap; gap: var(--ha-space-4); align-items: center;
          font-size: var(--ha-font-size-s); color: var(--secondary-text-color); margin: 0 0 var(--ha-space-3) 0; }
        .gen-tier-legend-chip { display: inline-flex; align-items: center; gap: var(--ha-space-1); }
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
        /* Grid (not per-row flex) so all 5 variant rows share the same 4 button-column tracks —
           a cell that grows wider from its "HA default" fallback badge no longer pushes just its
           own row out of alignment with the others. */
        .gen-btn-grid { display: grid; grid-template-columns: 90px repeat(4, 1fr); gap: var(--ha-space-3); align-items: start; margin: var(--ha-space-3) 0; }
        .gen-btn-variant-label { font-size: var(--ha-font-size-s); font-weight: 500; display: flex; align-items: center; }
        /* No fill — a solid-colour cell background here tends to land on/near the same neutral
           tones real card/button colours use, making the cell edges hard to tell from the content
           inside it. An outline groups the cell without competing with whatever colour is being
           previewed. */
        .gen-btn-cell { background: transparent; border: var(--ha-border-width-sm) solid var(--divider-color, #e0e0e0); border-radius: var(--ha-border-radius-md); padding: var(--ha-space-3); text-align: center; }
        .gen-btn-cell-fallback { border: var(--ha-border-width-sm) dashed var(--secondary-text-color); }
        .gen-mock-caption { font-size: var(--ha-font-size-s); opacity: 0.7; margin-top: var(--ha-space-1); }
        .gen-imported-note { font-size: var(--ha-font-size-m); color: var(--secondary-text-color); margin-bottom: var(--ha-space-3); }
        .gen-tier-correction-note {
          display: flex; align-items: flex-start; gap: var(--ha-space-2); font-size: var(--ha-font-size-s);
          color: var(--secondary-text-color); margin: var(--ha-space-1) 0 var(--ha-space-2) 0;
        }
        .gen-tier-correction-note ha-icon { --mdc-icon-size: 16px; flex-shrink: 0; margin-top: 1px; color: var(--primary-color); }
        /* align-items:start overrides CSS Grid's default stretch — otherwise every cell in a row
           stretches to match its row's tallest cell, so a deliberately-tall neighbour (e.g. a
           lozenge/bullet button, see .gen-mockup-cell-narrow below) drags ordinary button-small/
           button-large cells up into the same tall, square-looking box even though they never
           asked for that height. Each cell now sizes to its own content instead. */
        .gen-mockup-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--ha-space-4); margin: var(--ha-space-3) 0; align-items: start; }
        .gen-mockup-cell { background: transparent; border: var(--ha-border-width-sm) solid var(--divider-color, #e0e0e0); border-radius: var(--ha-border-radius-md); padding: var(--ha-space-3); }
        /* lozenge/bullet button demos (see LCARS_CARDMOD_DEMOS's narrow:true doc comment) need a
           narrower cell than the general auto-fit grid gives them (sized for wide header/middle/
           footer bars) — HA-LCARS's own CSS already handles height itself (min-height: 60px on the
           real <ha-card>, same as any other HA button — no override needed here once the grid stops
           stretching rows, see .gen-mockup-grid's align-items above). Width can't be a fixed pixel
           value, though: the icon strip's own width IS --lcars-vertical-border (HA-LCARS's own CSS
           sets ha-state-icon's width to var(--lcars-vertical-border)), and that var is
           user-configurable per-install via an input_number helper (HA-LCARS's own "adjust border
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
        .gen-lcars-sidebar-heading { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 0 var(--ha-space-2); opacity: 0.85; }
        .gen-lcars-sidebar-item { display: flex; align-items: center; gap: var(--ha-space-2); font-size: 12px; padding: var(--ha-space-1) var(--ha-space-2); }
        .gen-lcars-sidebar-dot { position: relative; width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .gen-lcars-sidebar-dot-glyph { position: absolute; inset: 2px; border-radius: 50%; }
        .gen-lcars-sidebar-badge { margin-left: auto; font-size: 9px; border-radius: 999px; padding: 1px 6px; color: #000; }
        .gen-lcars-header { display: flex; justify-content: space-between; padding: var(--ha-space-2) var(--ha-space-3); border-radius: var(--ha-border-radius-sm); font-size: 12px; font-weight: 600; margin-bottom: var(--ha-space-3); }
        .gen-lcars-tooltip { display: inline-block; padding: var(--ha-space-1) var(--ha-space-2); border-radius: var(--ha-border-radius-sm); font-size: 11px; }
        .gen-lcars-ripple-demo {
          display: inline-flex; align-items: center; gap: var(--ha-space-1); margin-top: var(--ha-space-2);
          border: none; border-radius: var(--ha-border-radius-pill); padding: var(--ha-space-1) var(--ha-space-3);
          background: transparent; font: inherit; cursor: pointer; transition: background-color 0.15s ease;
        }
        .gen-lcars-ripple-demo:hover, .gen-lcars-ripple-demo:focus-visible { background-color: color-mix(in srgb, var(--gen-ripple-color) 20%, transparent); }
        .gen-lcars-ripple-demo:active { background-color: color-mix(in srgb, var(--gen-ripple-color) 40%, transparent); }
        .gen-lcars-settings-card { display: flex; align-items: center; gap: var(--ha-space-2); padding: var(--ha-space-2) var(--ha-space-3); border-radius: var(--ha-border-radius-sm); font-size: 12px; font-weight: 600; }
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
      `]}get _themeLibraryEntries(){var t,n;const r=((n=(t=this.hass)==null?void 0:t.themes)==null?void 0:n.themes)||{},a=new Set(Object.keys(r)),e=[];for(const o of a)e.push({name:o,source:"installed",obj:r[o]});for(const o of _.names)a.has(o)||e.push({name:o,source:"bundled",obj:_.themes[o]});return e.sort((o,c)=>o.name.localeCompare(c.name)),e}_legacyFilteredFields(){const r=this._legacySearchText.trim().toLowerCase();return A.filter(a=>!(X.has(a.key)||this._legacyActiveCategory!=="all"&&a.group!==this._legacyActiveCategory||r&&!a.label.toLowerCase().includes(r)&&!a.key.toLowerCase().includes(r)))}_legacyGroupedFields(){const r=this._legacyFilteredFields();return U.map(a=>({group:a,fields:r.filter(e=>e.group===a)})).filter(({fields:a})=>a.length>0)}_legacyCategoryCounts(){const r=this._legacySearchText.trim().toLowerCase(),a=k(n=>!r||n.label.toLowerCase().includes(r)||n.key.toLowerCase().includes(r),"matchesSearch"),e=A.filter(n=>!X.has(n.key)&&a(n)),t={all:e.length};for(const n of U)t[n]=e.filter(o=>o.group===n).length;return t}_toggleLegacyGroup(r){const a=new Set(this._expandedLegacyGroups);a.has(r)?a.delete(r):a.add(r),this._expandedLegacyGroups=a}_setLegacyActiveCategory(r){if(this._legacyActiveCategory=r,r!=="all"&&!this._expandedLegacyGroups.has(r)){const a=new Set(this._expandedLegacyGroups);a.add(r),this._expandedLegacyGroups=a}}_handleLegacySearchInput(r){this._legacySearchText=r.target.value}_clearLegacySearch(){this._legacySearchText=""}_renderInfoGuide(r,a,e,t){return l`
      ${zr({header:`${e}`,icon:a,body:l`${t}`})}
    `}_anchorsForFamily(r){const a={};for(const e of Or)a[e]=I[Q(r,Number(e))];return a}_scaleForRole(r,a="light"){const e=this._model.roles[r];if(e.source==="none"){const n={};for(const o of y)n[o]="#888888";return n}if(e.source==="imported")return this._model.importedRamps[r]||W(this._anchorsForFamily("gray")).scale;if(e.source==="custom"){const n=a==="dark"&&this._model.customAnchorsDark[r]?this._model.customAnchorsDark[r]:this._model.customAnchors[r];if(!n)return W(this._anchorsForFamily(e.family||"gray")).scale;const o={};for(const c of y)o[c]=this._previewHex(n[c]);return o}const t=a==="dark"&&e.darkFamily?e.darkFamily:e.family;return W(this._anchorsForFamily(t)).scale}_resolveTone(r,a,e="light"){var c;if(a==="WHITE")return{var:"var(--white-color)",hex:"#ffffff"};if(a==="BLACK")return{var:"var(--black-color)",hex:"#000000"};const t=this._model.roles[r],o=this._scaleForRole(r,e)[String(a).padStart(2,"0")]||"#888888";if(t.source==="family"){const i=e==="dark"&&t.darkFamily?t.darkFamily:t.family;return{var:`var(${J(i,a)}, ${o})`,hex:o}}if(t.source==="imported"){const i=(c=this._model.importedRampsRaw[r])==null?void 0:c[String(a).padStart(2,"0")];if(i!==void 0)return{var:i,hex:o}}return{var:o,hex:o}}_roleDarkDiffers(r){const a=this._model.roles[r];return a.source==="family"?a.darkFamily!==void 0:a.source==="custom"?!!this._model.customAnchorsDark[r]:false}_resolveSemanticRoleTone(r,a,e="light"){return this._resolveTone(H[r]||r,a,e)}_resolveSemanticRoleToneAsAtom(r,a,e="light"){const t=H[r]||r,n=this._resolveTone(t,a,e);if(a==="WHITE"||a==="BLACK")return n;const o=String(a).padStart(2,"0");return this._isRoleTonePreviewFallback(t,o)?n:{var:`var(--ha-color-${t}-${o})`,hex:n.hex}}_staticSemanticRoleTone(r,a,e="light"){if(a==="WHITE")return{var:"var(--white-color)",hex:"#ffffff"};if(a==="BLACK")return{var:"var(--black-color)",hex:"#000000"};const t=H[r]||r;return this._staticHaDefault(`ha-color-${t}-${String(a).padStart(2,"0")}`)}_isRoleTonePreviewFallback(r,a){const e=this._model.roles[r];return(e==null?void 0:e.source)==="none"?true:(e==null?void 0:e.source)==="imported"?!(a in(this._model.importedRamps[r]||{})):false}_buttonTierTagBadge(r,a,e="light"){var u,p,S,B;const t=br[r];if(!t)return{abbr:"",title:""};const n=Number(a),o=[],c=k(f=>{var $;return(($=gr[t][e])==null?void 0:$[f])??gr[t].light[f]},"fillTier");((u=c("loud"))==null?void 0:u.resting)===n&&o.push("Accent bg"),((p=c("normal"))==null?void 0:p.resting)===n&&o.push("Filled bg");const i=((S=this._model.roles[r])==null?void 0:S.source)!=="none",s=this._resolveSemanticRoleTone.bind(this);for(const[f,$]of[["normal","Filled & Plain text"],["quiet","Outlined text"]])if(i){const R=j(s,(D,d)=>E(s,D,e,d,"resting"),t,e,f,this._ambientBgHex(e));R.usedTone!==null&&Number(R.usedTone)===n&&o.push($)}else{const R=((B=C[t][e])==null?void 0:B[f])!==void 0?C[t][e]:C[t].light;(R[f]!==void 0?R[f]:C[t].light[f])===n&&o.push($)}if(!o.length)return{abbr:"",title:""};const h={"Accent bg":"A","Filled bg":"F","Filled & Plain text":"T","Outlined text":"O"};return{abbr:o.map(f=>h[f]).join(","),title:o.join(", ")}}_roleTierCorrectionNotes(r,a){var i;const e=br[r];if(!e||((i=this._model.roles[r])==null?void 0:i.source)==="none")return[];const t=this._resolveSemanticRoleTone.bind(this),n=k((s,h)=>E(t,s,a,h,"resting"),"resolveFillResting"),o=this._ambientBgHex(a),c=[];for(const[s,h]of[["loud","Accent button text"],["normal","Filled (and Plain) button text"],["quiet","Outlined button text"]]){const u=j(t,n,e,a,s,o);if(u.corrected)if(u.usedTone!==null)c.push(`${h} uses a different stop from the same palette here (tone ${u.usedTone}) because its usual tone doesn't clear 4.5:1 contrast against this theme's background.`);else{const p=u.hex==="#ffffff"?"white":"black";c.push(`${h} switches to ${p} here because no tone in this role's own palette clears 4.5:1 contrast against both backgrounds.`)}else u.finalRatio<4.5&&c.push(`${h} keeps its usual tone here even at ${u.finalRatio.toFixed(2)}:1 contrast (needs 4.5:1) because every alternative would read worse.`)}return c}_renderTierCorrectionNotes(r,a){const e=this._roleTierCorrectionNotes(r,a);return e.length?l`
      <p class="gen-tier-correction-note">
        <ha-icon icon="mdi:contrast-circle"></ha-icon>
        <span><strong>${a==="dark"?"Dark mode":"Light mode"}:</strong> ${e.join(" ")}</span>
      </p>
    `:g}_scaleForRolePreview(r,a="light"){const e=this._scaleForRole(r,a),t={};for(const n of y)t[n]=this._isRoleTonePreviewFallback(r,n)?this._staticHaDefault(`ha-color-${r}-${n}`).hex:e[n];return t}_resolveToHex(r){const a="#888888";if(!r)return a;if(/^#[0-9a-fA-F]{6}$/.test(r))return r;const e=Sr.toHex(r);return e||(Z.warn("[ThemeGeneratorView] Unresolvable color, using neutral gray fallback",r),a)}_resolveThemeValue(r,a,e=0,t=false){if(typeof r!="string"||e>=12)return t?this._resolveLiteralNoDom(r):this._resolveToHex(r);if(r.includes("var(--")){let o=false;const c=r.replace(/var\(--([a-zA-Z0-9-]+)\)/g,(i,s)=>Object.prototype.hasOwnProperty.call(a,s)?(o=true,String(a[s])):i);if(o)return this._resolveThemeValue(c,a,e+1,t)}const n=r.trim().match(/^color-mix\(in oklch,\s*(.+?)\s+([\d.]+)%\s*,\s*(.+?)\)$/i);if(n){const[,o,c,i]=n,s=this._resolveThemeValue(o.trim(),a,e+1,t),h=i.trim().toLowerCase(),u=h==="black"?"#000000":h==="white"?"#ffffff":this._resolveThemeValue(i.trim(),a,e+1,t);return Ar(u,s,Number(c)/100)}return t?this._resolveLiteralNoDom(r):this._resolveToHex(r)}_resolveLiteralNoDom(r){return/^#[0-9a-fA-F]{6}$/.test(r)?r:{black:"#000000",white:"#ffffff",transparent:"transparent"}[String(r).trim().toLowerCase()]??"#888888"}_previewHex(r){return this._importedThemeContext?this._resolveThemeValue(r,this._liveImportedThemeContext()):this._resolveToHex(r)}_semanticRoleUnset(r){var e;const a=H[r]||r;return((e=this._model.roles[a])==null?void 0:e.source)==="none"}_roleDerivesLegacyFields(r){var t;const a=H[r]||r,e=(t=this._model.roles[a])==null?void 0:t.source;return e==="family"||e==="custom"}_staticHaDefault(r){if(Object.prototype.hasOwnProperty.call(_.boilerplate,r)){const a=_.boilerplate[r];return{var:a,hex:this._resolveThemeValue(a,_.boilerplate,0,true),tier:"lcars"}}return Object.prototype.hasOwnProperty.call(P,r)?{var:P[r],hex:P[r],tier:"ha"}:{var:"#888888",hex:"#888888",tier:"unknown"}}_liveImportedThemeContext(){var t;const r=this._model.legacy,a=this._model.raw,e=this._liveContextSource;if(!e||e.imported!==this._importedThemeContext||e.legacy!==r||e.raw!==a){const n={};for(const o of Object.keys(r)){const c=(t=r[o])==null?void 0:t.value;c!==void 0&&(n[o]=c)}for(const o of a)o.key&&o.value!==void 0&&(n[o.key]=o.value);this._liveContextCache={...this._importedThemeContext||{},...n},this._liveContextSource={imported:this._importedThemeContext,legacy:r,raw:a}}return this._liveContextCache}_staticColorContext(){const r=this._liveImportedThemeContext();return this._staticColorContextSource!==r&&(this._staticColorContextCache=this._importedThemeContext?{...mr,...r}:mr,this._staticColorContextSource=r),this._staticColorContextCache}_legacyFieldDefault(r){return this._staticHaDefault(r.key)}_roleDefaultBadge(r){return O[this._staticHaDefault(`ha-color-${r}-40`).tier]}_liveDomainStateDefault(r,a){var i;const e=this._staticHaDefault(`state-${r}-${a}-color`);if(e.tier!=="unknown")return e;const t=Nr(r,a)?"active":"inactive",n=this._staticHaDefault(`state-${r}-${t}-color`);if(n.tier!=="unknown")return n;const o=`state-${t}-color`,c=(i=this._model.legacy[o])==null?void 0:i.value;return c!==void 0?{var:c,hex:this._previewHex(c),tier:"global"}:this._staticHaDefault(o)}render(){return l`
      <div class="tab-content-container">
        ${this._renderInfoGuide("overview","mdi:palette-swatch-outline","What is the HA-LCARS Theme Lab?",l`
          <p>Build a full HA-LCARS theme: set and test your colour options here, then copy the generated YAML into your <code>lcars.yaml</code> theme file - nothing here is written to your live HA install.</p>
          <p>There are four main sections:</p>
          <ul>
            <li><strong>Palette Seed</strong>: HA's 5 role colour scales (Primary/Neutral/Red/Orange/Green). HA uses these palettes to calculate other colours throughout the UI.</li>
            <li><strong>HA-LCARS &amp; Legacy HA Semantic Colours</strong>: individual fields for HA-LCARS theme configuration.  Also includes legacy HA semantic colours that are not from the Palette Seed.</li>
            <li><strong>Domain &amp; State Colours</strong>: configure common/per domain state-specific colour overrides.</li>
            <li><strong>Advanced / Raw Overrides</strong>: for any var name without dedicated UI.</li>
          </ul>
          <p class="info-guide-tip">A Palette Seed role left as <strong>None</strong> is left out of the export, so HA's own default palette applies instead. Dashed badge
            <span class="gen-fallback-badge">HA-LCARS Default</span> appears for values that are the HA-LCARS theme defaults; and <span class="gen-fallback-badge">HA Default</span>
            for values from HA defaults.</p>
          <p>Most fields support separate light/dark values. Switch to <strong>Preview &amp; Export</strong> mode at any time to see the current state and generated YAML.</p>
        `)}
        ${this._renderLabTabToggle()}
        <div class="gen-lab-tab-panel" ?hidden=${this._labViewMode!=="config"}>
          ${this._renderStartSection()}
          ${this._renderPaletteSeedSection()}
          ${this._renderLegacySection()}
          ${this._renderDomainSection()}
          ${this._renderRawSection()}
        </div>
        <div class="gen-lab-tab-panel" ?hidden=${this._labViewMode!=="preview"}>
          ${this._renderPreviewExportSection()}
        </div>
      </div>
    `}_renderLabTabToggle(){return l`
      <div class="gen-toggle-group gen-toggle-group-m gen-lab-tab-toggle">
        <wa-button-group childSelector="ha-button">
          <ha-button variant="brand" size="m" .appearance=${this._labViewMode==="config"?"accent":"filled"}
            @click=${()=>{this._labViewMode="config"}}>Configuration</ha-button>
          <ha-button variant="brand" size="m" .appearance=${this._labViewMode==="preview"?"accent":"filled"}
            @click=${()=>{this._labViewMode="preview"}}>Preview &amp; Export</ha-button>
        </wa-button-group>
      </div>
    `}_renderStartSection(){const r=this._startMode;return l`
      <lcards-form-section header="Start" icon="mdi:rocket-launch-outline" ?expanded=${true} ?outlined=${true}>
        <p class="gen-hint">Starts from HA-LCARS's own "LCARS Default" theme. Pick a different theme below, or
          switch to Paste to bring in your own YAML.</p>
        <div class="gen-toggle-group gen-toggle-group-m">
          <wa-button-group childSelector="ha-button">
            <ha-button variant="brand" size="m" .appearance=${r==="library"?"accent":"filled"}
              @click=${()=>this._selectStartMode("library")}>Load from HA-LCARS</ha-button>
            <ha-button variant="brand" size="m" .appearance=${r==="paste"?"accent":"filled"}
              @click=${()=>this._selectStartMode("paste")}>Paste theme YAML</ha-button>
          </wa-button-group>
        </div>

        <div class="gen-field-row" style="grid-template-columns: minmax(140px, 220px) 1fr;">
          <div class="gen-field-label">Theme Name</div>
          <ha-input .value=${this._model.name} label="Theme Name"
            @input=${a=>this._setName(a.target.value)}></ha-input>
        </div>

        ${r==="library"?l`
          <div class="gen-field-row" style="grid-template-columns: minmax(140px, 220px) 1fr auto;">
            <div class="gen-field-label">Theme</div>
            <ha-selector .hass=${this.hass}
              .selector=${{select:{mode:"dropdown",options:this._themeLibraryEntries.map(a=>({value:a.name,label:`${a.name}${a.source==="installed"?"  •  installed on this HA":"  •  bundled reference"}`}))}}}
              .value=${this._selectedLibraryTheme}
              .label=${"Theme"}
              @value-changed=${a=>{this._selectedLibraryTheme=a.detail.value}}>
            </ha-selector>
            <ha-button @click=${()=>this._handleLoadLibraryTheme()} .disabled=${!this._selectedLibraryTheme}>Load</ha-button>
          </div>
          ${this._renderInfoGuide("library","mdi:information-outline","How loading an HA-LCARS theme works",l`
            <p>Loads a theme's HA-LCARS UI variables and other colours as your starting point.</p>
            <ul>
              <li><strong>Installed on this HA</strong>: themes currently loaded on this Home Assistant instance.</li>
              <li><strong>Bundled reference</strong>: a snapshot shipped with LCARdS, shown only when that theme isn't installed here.</li>
            </ul>
            <p class="info-guide-tip">A Palette Seed role switches to "Imported" when the loaded theme defines its own <code>ha-color-&lt;role&gt;-*</code> ramp. Otherwise it's set to "None".</p>
          `)}
        `:g}

        ${r==="paste"?l`
          <div class="gen-field-row" style="grid-template-columns: minmax(140px, 220px) 1fr; align-items: start;">
            <div class="gen-field-label">Theme YAML</div>
            <div>
              <lcards-yaml-editor .hass=${this.hass} .value=${this._pasteYamlText}
                @value-changed=${a=>{this._pasteYamlText=a.detail.value}}>
              </lcards-yaml-editor>
              <div class="gen-toolbar-row">
                <ha-button @click=${()=>this._handleImportYaml()}>Import</ha-button>
              </div>
            </div>
          </div>
          ${this._renderInfoGuide("paste","mdi:information-outline","What gets recognized when pasting",l`
            <p>Recognizes:</p>
            <ul>
              <li>Legacy / LCARS-UI colour fields</li>
              <li><code>state-&lt;domain&gt;-&lt;state&gt;-color</code> entries</li>
              <li>Complete <code>ha-color-&lt;role&gt;-*</code> ramps: promoted to Palette Seed as "Imported"</li>
            </ul>
            <p>Everything else lands in Advanced / Raw Overrides.</p>
            <p class="info-guide-note">YAML anchor merge keys (<code>&lt;&lt;: *anchor</code>) can't be
              resolved from a standalone paste and are skipped.</p>
          `)}
        `:g}

        ${this._importError?l`<div class="error-message">${this._importError}</div>`:g}
        ${this._importFeedback?l`<div class="info-message">${this._importFeedback}</div>`:g}
      </lcards-form-section>
    `}_renderPaletteSeedSection(){return l`
      <lcards-form-section header="Palette Seed" icon="mdi:palette-outline" ?expanded=${true} ?outlined=${true}
        description="Adopt the imported theme's palette, pick an LCARdS family, or hand-build custom tones for each of HA's 5 role colours.">
        <p class="gen-hint">Feeds HA's native <code>ha-color-&lt;role&gt;-*</code> palettes: used on native HA
          components that HA-LCARS's own styling doesn't reach. A role left as <strong>None</strong> uses HA's own
          default palette.</p>
        ${this._renderTierLegend()}
        ${L.map(r=>this._renderRoleSeed(r))}
      </lcards-form-section>
    `}_renderTierLegend(){return l`
      ${this._renderInfoGuide("tier-legend","mdi:information-outline","The A/F/T/O badges",l`
        <p>Home Assistant's <code>ha-button</code> (now built with WebAwesome) doesn't read a Palette Seed tone itself, but rather each tone below feeds one of HA's own fixed semantic tokens.  HA then aliases to the semantic tokens with generic names <code>ha-button</code> actually consumes. Each badge marks which tone makes that whole hop, for a given <code>appearance</code></p>
        <p class="info-guide-note">Shown for Primary/"brand" as an example: each role follows the same 3-hop chain via its own family name (neutral/danger/warning/success)</p>
        <pre class="info-guide-example">--ha-color-primary-40                    Palette Seed tone (the swatch itself)
      │
      ▼
--ha-color-fill-primary-loud-resting     HA's semantic tier  ← the "A" badge marks this
      │
      ▼
--wa-color-brand-fill-loud               WebAwesome alias var ha-button reads
      │
      ▼
&lt;ha-button appearance="accent" variant="brand"&gt;   the rendered background</pre>
        <ul>
          <li><span class="gen-tier-badge">A</span>: background tone for <code>appearance="accent"</code></li>
          <li><span class="gen-tier-badge">F</span>: background tone for <code>appearance="filled"</code></li>
          <li><span class="gen-tier-badge">T</span>: text tone shared by <code>appearance="filled"</code> and <code>appearance="plain"</code></li>
          <li><span class="gen-tier-badge">O</span>: text tone for <code>appearance="outlined"</code></li>
        </ul>
        <p class="info-guide-tip">A swatch with no badges isn't unused: it's just not the fixed landing tone for any button appearance.</p>
        <p class="info-guide-note">A "T" or "O" badge can be genuinely, correctly missing even where you'd expect one: LCARdS applies a WCAG contrast correction on export that can shift that button's actual text colour off this role's scale entirely (to black/white, or a different stop). See the contrast note under each role below when that happens.</p>
        <div class="info-guide-links">
          <a href="https://design.home-assistant.io/#components/ha-button" target="_blank" rel="noopener">ha-button component reference →</a>
        </div>
      `)}
      <div class="gen-tier-legend">
        <span class="gen-tier-legend-chip"><span class="gen-tier-badge">A</span> "Accent" button background</span>
        <span class="gen-tier-legend-chip"><span class="gen-tier-badge">F</span> "Filled" button background</span>
        <span class="gen-tier-legend-chip"><span class="gen-tier-badge">T</span> "Filled" &amp; "Plain" button text</span>
        <span class="gen-tier-legend-chip"><span class="gen-tier-badge">O</span> "Outlined" button text</span>
      </div>
    `}_renderRoleSeed(r){const a=this._model.roles[r],e=!!this._model.importedRamps[r],t=Object.keys(this._model.importedRamps[r]||{}).length,n=a.source==="family"||a.source==="custom",o=n&&this._roleDarkDiffers(r),c=a.source==="none",i=this._scaleForRolePreview(r,"light"),s=this._scaleForRolePreview(r,"dark");return l`
      <lcards-form-section header="${K[r]}" icon="${qr[r]}"
        .secondary=${this._roleSourceSummary(r)} ?expanded=${r==="primary"} nested>
        <div class="gen-role-header">
          <div class="gen-toggle-group">
            <wa-button-group childSelector="ha-button">
              <ha-button variant="brand" size="s" .appearance=${a.source==="none"?"accent":"filled"}
                @click=${()=>this._updateRoleSource(r,"none")}>None</ha-button>
              <ha-button variant="brand" size="s" .appearance=${a.source==="family"?"accent":"filled"}
                @click=${()=>this._updateRoleSource(r,"family")}>LCARdS Palettes</ha-button>
              <ha-button variant="brand" size="s" .appearance=${a.source==="custom"?"accent":"filled"}
                @click=${()=>this._updateRoleSource(r,"custom")}>Custom</ha-button>
              ${e?l`
                <ha-button variant="brand" size="s" .appearance=${a.source==="imported"?"accent":"filled"}
                  @click=${()=>this._updateRoleSource(r,"imported")}>Imported</ha-button>
              `:g}
            </wa-button-group>
          </div>
        </div>

        ${c?l`
          <p class="gen-hint">Not set: this theme won't define <code>ha-color-${r}-*</code>, so HA uses its own
            default palette. The swatches below preview that default. Pick <strong>LCARdS Palettes</strong> for a
            ready-made family, <strong>Custom</strong> to hand-build one, or <strong>Imported</strong> if this theme
            has its own ramp.</p>
        `:g}

        ${a.source==="imported"?l`
          <p class="gen-imported-note">Using this theme's own <code>ha-color-${r}-*</code> ramp:
            ${t<11?l`${t} of 11 stops (missing stops, dashed below, preview HA's fallback)`:l`all 11 stops`}. Not editable here. Switch to <strong>Custom</strong> to hand-tune it, or
            <strong>LCARdS Palettes</strong> for a ready-made family.</p>
        `:g}

        ${a.source==="custom"?this._renderInfoGuide(`custom-${r}`,"mdi:information-outline","Two ways to fill in a custom family",l`
          <p>You can fully customize the palette tones by: </p>
          <ul>
            <li>Set all 11 tones by hand, or</li>
            <li><strong>Generate other 10 tones from Base (tone 40)</strong>: fills the rest from Base using the same
              lightness ramp HA-LCARS's own fallback uses. <strong>Clear all</strong> resets everything to gray.</li>
          </ul>
        `):g}
        ${n?l`
          <label class="gen-dark-toggle" style="margin-bottom: var(--ha-space-3);">
            <ha-switch .checked=${o}
              @change=${h=>this._toggleRoleDarkDiffers(r,h.target.checked)}></ha-switch>
            <span class="gen-dark-toggle-label">Differs in dark mode: e.g. a different family or hand-picked hue, not just a different tone</span>
          </label>
          <div class="gen-role-content ${o?"gen-mode-columns":""}">
            <div class="gen-mode-column">
              ${o?l`<div class="gen-mode-column-label">Light</div>`:g}
              ${this._renderRoleSourceContent(r,"light")}
            </div>
            ${o?l`
              <div class="gen-mode-column">
                <div class="gen-mode-column-label">Dark</div>
                ${this._renderRoleSourceContent(r,"dark")}
              </div>
            `:g}
          </div>
        `:g}

        <div class="gen-scale-row">
          <div class="gen-scale-label">Full scale (light)</div>
          <div class="gen-scale-swatches">
            ${y.map(h=>{const u=this._isRoleTonePreviewFallback(r,h),p=this._buttonTierTagBadge(r,h,"light"),S=[u?`${this._roleDefaultBadge(r)} (not set by this theme)`:"",p.title].filter(Boolean).join(" · ");return l`
                <div class="gen-scale-swatch ${u?"gen-scale-swatch-fallback":""}" title="${S}">
                  <div class="gen-swatch-fill" style="background-color:${i[h]}"></div>
                  ${p.abbr?l`<span class="gen-tier-badge gen-scale-swatch-role-tag">${p.abbr}</span>`:g}
                  <span class="gen-scale-swatch-tag">${h}</span>
                </div>
              `})}
          </div>
          ${c?l`<span class="gen-fallback-badge">${this._roleDefaultBadge(r)}</span>`:g}
        </div>
        <div class="gen-scale-row">
          <div class="gen-scale-label">Full scale (dark)</div>
          <div class="gen-scale-swatches">
            ${y.map(h=>{const u=this._isRoleTonePreviewFallback(r,h),p=this._buttonTierTagBadge(r,h,"dark"),S=[u?`${this._roleDefaultBadge(r)} (not set by this theme)`:"",p.title].filter(Boolean).join(" · ");return l`
                <div class="gen-scale-swatch ${u?"gen-scale-swatch-fallback":""}" title="${S}">
                  <div class="gen-swatch-fill" style="background-color:${s[h]}"></div>
                  ${p.abbr?l`<span class="gen-tier-badge gen-scale-swatch-role-tag">${p.abbr}</span>`:g}
                  <span class="gen-scale-swatch-tag">${h}</span>
                </div>
              `})}
          </div>
          ${c?l`<span class="gen-fallback-badge">${this._roleDefaultBadge(r)}</span>`:g}
        </div>
        ${this._renderTierCorrectionNotes(r,"light")}
        ${this._renderTierCorrectionNotes(r,"dark")}
      </lcards-form-section>
    `}_roleSourceSummary(r){const a=this._model.roles[r];if(a.source==="none")return`Not set: ${this._roleDefaultBadge(r)}`;if(a.source==="family"){const e=a.darkFamily&&a.darkFamily!==a.family?` (dark: ${V[a.darkFamily]})`:"";return`LCARdS Palettes: ${V[a.family]}${e}`}if(a.source==="custom")return this._roleDarkDiffers(r)?"Custom (light + dark)":"Custom";if(a.source==="imported"){const e=Object.keys(this._model.importedRamps[r]||{}).length;return e<11?`Imported (${e}/11 stops)`:"Imported (complete)"}return""}_renderRoleSourceContent(r,a){const e=this._model.roles[r];if(e.source==="family"){const o=a==="dark"&&e.darkFamily||e.family;return l`
        <ha-selector .hass=${this.hass}
          .selector=${{select:{mode:"dropdown",options:G.map(c=>({value:c,label:V[c]}))}}}
          .value=${o}
          .label=${a==="dark"?"Dark mode family":"LCARdS family"}
          @value-changed=${c=>this._updateRoleFamily(r,c.detail.value,a)}>
        </ha-selector>
      `}const t=a==="dark"?this._model.customAnchorsDark:this._model.customAnchors,n=this._scaleForRole(r,a);return l`
      <div class="gen-toolbar-row">
        <ha-button @click=${()=>this._clearCustomAnchors(r,a)}>
          <ha-icon icon="mdi:eraser" slot="start"></ha-icon>
          Clear all
        </ha-button>
        <ha-button @click=${()=>this._generateAnchorsFromBase(r,a)}>
          <ha-icon icon="mdi:auto-fix" slot="start"></ha-icon>
          Generate other 10 tones from Base
        </ha-button>
      </div>
      <div class="gen-anchor-grid">
        ${y.map(o=>{const c=this._buttonTierTagBadge(r,o,a);return l`
          <div class="gen-anchor-cell ${Ir.includes(o)?"gen-anchor-gap":""} ${o==="40"?"gen-anchor-base":""}">
            <label>${Pr[o]}${o==="40"?" (seed for Generate)":""} (tone ${o})
              ${c.abbr?l` <span class="gen-tier-badge" title="${c.title}">${c.abbr}</span>`:g}
            </label>
            <lcards-color-picker .hass=${this.hass}
              .value=${(t[r]||{})[o]??n[o]}
              .showBuilder=${false}
              .themeContext=${this._liveImportedThemeContext()}
              @value-changed=${i=>this._updateCustomTone(r,o,i.detail.value,a)}>
            </lcards-color-picker>
          </div>
        `})}
      </div>
    `}_renderLegacySection(){const r=this._legacyCategoryCounts();return l`
      <lcards-form-section header="HA-LCARS &amp; Legacy HA Semantic Colours" icon="mdi:format-color-fill" ?expanded=${false} ?outlined=${true}
        description="Set the colour for HA-LCARS and legacy HA vars. The var name is shown under each label. Unset fields default to HA-LCARS or HA defaults, if available.">
        <div class="gen-search-container">
          <div class="gen-search-wrapper">
            <ha-input class="gen-legacy-search" .value=${this._legacySearchText} @input=${a=>this._handleLegacySearchInput(a)}
              placeholder="Search fields..." .label=${"Search"}>
              <ha-icon slot="leadingIcon" icon="mdi:magnify"></ha-icon>
            </ha-input>
            ${this._legacySearchText?l`
              <ha-icon-button class="gen-search-clear" @click=${()=>this._clearLegacySearch()} .label=${"Clear search"}>
                <ha-icon icon="mdi:close"></ha-icon>
              </ha-icon-button>
            `:g}
          </div>
        </div>
        ${Hr({className:"gen-category-filters",options:[{value:"all",label:`All (${r.all})`},...U.filter(a=>r[a]>0||this._legacyActiveCategory===a).map(a=>({value:a,label:`${a} (${r[a]})`}))],selected:this._legacyActiveCategory,onSelect:k(a=>this._setLegacyActiveCategory(a),"onSelect")})}
        <div class="gen-row-header">
          <div></div><div>Light</div><div></div><div>Dark</div><div></div>
        </div>
        ${this._legacyGroupedFields().map(({group:a,fields:e})=>l`
          <lcards-collapsible-section .title=${a} .count=${e.length} countLabel="fields"
            ?expanded=${this._expandedLegacyGroups.has(a)} @toggle=${()=>this._toggleLegacyGroup(a)}>
            ${e.map(t=>this._renderLegacyField(t))}
          </lcards-collapsible-section>
        `)}
      </lcards-form-section>
    `}_renderLegacyField(r){const a=this._model.legacy[r.key]||{},e=a.value!==void 0,t=r.live||!r.fixed&&!e&&!this._roleDerivesLegacyFields(r.role),n=r.live?()=>this._staticHaDefault(r.key):t?()=>this._legacyFieldDefault(r):this._resolveTone.bind(this),o=r.fixed?{var:r.fixed,hex:r.fixed}:n(r.role,r.tone,"light"),c=r.fixed?{var:r.fixedDark??r.fixed,hex:r.fixedDark??r.fixed}:n(r.role,r.tone,"dark"),i=c.hex!==o.hex,s=a.value??o.var,h=a.dark!==void 0,u=e?null:r.fixed?"HA-LCARS Default":r.live?O[this._staticHaDefault(r.key).tier]:t?O[this._legacyFieldDefault(r).tier]:null;return l`
      <div class="gen-field-row">
        <div class="gen-field-label">
          <span class="gen-field-label-row">
            ${r.label}
            ${r.description?l`
              <span class="gen-field-info">
                <ha-icon-button class="gen-field-info-btn" .label=${"What this applies to"} hide-title>
                  <ha-icon icon="mdi:information-outline"></ha-icon>
                </ha-icon-button>
                <div class="gen-field-info-popup" role="tooltip">${r.description}</div>
              </span>
            `:g}
          </span>
          <code class="gen-field-varname">--${r.key}</code>
          ${u?l`<span class="gen-fallback-badge">${u}</span>`:g}
        </div>
        <lcards-color-picker .hass=${this.hass} .value=${s} .showBuilder=${false} .themeContext=${this._staticColorContext()}
          @value-changed=${p=>this._setLegacyValue(r.key,p.detail.value)}>
        </lcards-color-picker>
        <label class="gen-dark-toggle">
          <ha-switch .checked=${h}
            @change=${p=>this._toggleLegacyDark(r.key,p.target.checked,c.var)}></ha-switch>
          <span class="gen-dark-toggle-label">Dark</span>
        </label>
        ${h?l`
          <lcards-color-picker .hass=${this.hass} .value=${a.dark??c.var} .showBuilder=${false} .themeContext=${this._staticColorContext()}
            @value-changed=${p=>this._setLegacyValue(r.key,p.detail.value,true)}>
          </lcards-color-picker>
        `:u?l`<span class="gen-dark-empty">(${u}: not set by this theme)</span>`:!e&&i?l`<span class="gen-dark-empty">(using Palette Seed's dark default)</span>`:l`<span class="gen-dark-empty">(using light value)</span>`}
        ${e?l`
          <ha-icon-button .label=${"Revert to computed default"} @click=${()=>this._revertLegacyValue(r.key)}>
            <ha-icon icon="mdi:restore"></ha-icon>
          </ha-icon-button>
        `:l`<span class="gen-revert-spacer"></span>`}
      </div>
    `}_renderDomainSection(){return l`
      <lcards-form-section header="Domain &amp; State Colours" icon="mdi:state-machine" ?expanded=${false} ?outlined=${true}>
        ${this._renderInfoGuide("domain","mdi:information-outline","How domain & state colours work",l`
          <p>HA colours an entity's state icon by walking a fallback chain, top to bottom, until it finds a var that's defined:</p>
          <pre class="info-guide-example">--state-&lt;domain&gt;-&lt;device_class&gt;-&lt;state&gt;-color             only for entities with a device_class
      │
      ▼
--state-&lt;domain&gt;-&lt;state&gt;-color                            the rows below, e.g. --state-light-on-color
      │
      ▼
--state-&lt;domain&gt;-active-color / -inactive-color           HA's own per-domain split: not editable here
      │
      ▼
Global Fallback: --state-active-color / -inactive-color   the final floor (plus unavailable/unknown/default-icon)</pre>
          <p>An <code>unavailable</code> entity skips straight to Global Fallback's
            <code>--state-unavailable-color</code>.</p>
          <p class="info-guide-tip">Rows only hold a real value once set. <code>lock</code> and most of
            <code>climate</code> come pre-set from HA-LCARS's own shared defaults. Every other row starts unset and
            just previews a static default (badged HA-LCARS Default / HA Default / Global Default). Leaving
            everything unset and only setting Global Fallback is a perfectly complete theme.</p>
        `)}
        <lcards-form-section header="Global Fallback" ?expanded=${true} nested>
          ${A.filter(r=>X.has(r.key)).map(r=>this._renderLegacyField(r))}
        </lcards-form-section>
        <div class="gen-row-header">
          <div></div><div>Light</div><div></div><div>Dark</div><div></div>
        </div>
        ${Object.entries(nr).map(([r,a])=>l`
          <lcards-form-section header="${r.replace(/_/g," ").replace(/\b\w/g,e=>e.toUpperCase())}"
            icon="${Mr[r]||"mdi:shape-outline"}" ?expanded=${r==="light"} nested>
            ${a.map(e=>this._renderDomainStateRow(r,e))}
          </lcards-form-section>
        `)}
      </lcards-form-section>
    `}_renderDomainStateRow(r,a){const e=`${r}.${a}`,t=this._model.domainOverrides[e]||{},n=t.value!==void 0,o=`state-${r}-${a}-color`,{var:c,tier:i}=this._liveDomainStateDefault(r,a),s=O[i],h=t.value??c,u=t.dark!==void 0;return l`
      <div class="gen-field-row">
        <div class="gen-field-label"><span style="text-transform:capitalize">${a.replace(/_/g," ")}</span><code class="gen-field-varname">--${o}</code>
          ${n?g:l`<span class="gen-fallback-badge">${s}</span>`}
        </div>
        <lcards-color-picker .hass=${this.hass} .value=${h} .showBuilder=${false} .themeContext=${this._staticColorContext()}
          @value-changed=${p=>this._setDomainOverride(r,a,p.detail.value)}>
        </lcards-color-picker>
        <label class="gen-dark-toggle">
          <ha-switch .checked=${u}
            @change=${p=>this._toggleDomainDark(r,a,p.target.checked,c)}></ha-switch>
          <span class="gen-dark-toggle-label">Dark</span>
        </label>
        ${u?l`
          <lcards-color-picker .hass=${this.hass} .value=${t.dark??c} .showBuilder=${false} .themeContext=${this._staticColorContext()}
            @value-changed=${p=>this._setDomainOverride(r,a,p.detail.value,true)}>
          </lcards-color-picker>
        `:n?l`<span class="gen-dark-empty">(using light value)</span>`:l`<span class="gen-dark-empty">(${s}: not set by this theme)</span>`}
        ${n?l`
          <ha-icon-button .label=${"Revert to HA default"} @click=${()=>this._revertDomainOverride(r,a)}>
            <ha-icon icon="mdi:restore"></ha-icon>
          </ha-icon-button>
        `:l`<span class="gen-revert-spacer"></span>`}
      </div>
    `}_renderRawSection(){const r=Er().map(a=>({value:a.name,label:a.name}));return l`
      <lcards-form-section header="Advanced / Raw Overrides" icon="mdi:tune-variant" ?expanded=${false} ?outlined=${true}
        description="Anything other var name outside the sections above.  Pick one from the list or type your own.">
        ${this._model.raw.length?l`
          <div class="gen-row-header" style="grid-template-columns: minmax(200px, 280px) 1fr auto 1fr auto;">
            <div>Var Name</div><div>Light</div><div></div><div>Dark</div><div></div>
          </div>
        `:g}
        ${this._model.raw.map(a=>this._renderRawRow(a,r))}
        <div class="gen-toolbar-row">
          <ha-button @click=${()=>this._addRawOverride()}>
            <ha-icon icon="mdi:plus" slot="start"></ha-icon>
            Add Override
          </ha-button>
        </div>
      </lcards-form-section>
    `}_renderRawRow(r,a){const e=r.dark!==void 0;return l`
      <div class="gen-raw-row">
        <ha-selector .hass=${this.hass}
          .selector=${{select:{mode:"dropdown",custom_value:true,options:a}}}
          .value=${r.key} .label=${"Var Name"}
          @value-changed=${t=>this._updateRawKey(r.id,(t.detail.value??"").trim())}>
        </ha-selector>
        <lcards-color-picker .hass=${this.hass} .value=${r.value??""} .showBuilder=${false} .themeContext=${this._liveImportedThemeContext()}
          @value-changed=${t=>this._updateRawValue(r.id,t.detail.value)}>
        </lcards-color-picker>
        <label class="gen-dark-toggle">
          <ha-switch .checked=${e} @change=${t=>this._toggleRawDark(r.id,t.target.checked)}></ha-switch>
          <span class="gen-dark-toggle-label">Dark</span>
        </label>
        ${e?l`
          <lcards-color-picker .hass=${this.hass} .value=${r.dark??""} .showBuilder=${false} .themeContext=${this._liveImportedThemeContext()}
            @value-changed=${t=>this._updateRawValue(r.id,t.detail.value,true)}>
          </lcards-color-picker>
        `:l`<span class="gen-dark-empty">(using light value)</span>`}
        <ha-icon-button .label=${"Remove"} @click=${()=>this._removeRawOverride(r.id)}>
          <ha-icon icon="mdi:delete"></ha-icon>
        </ha-icon-button>
      </div>
    `}_renderPreviewExportSection(){const r=this._buildExportModel(),a=or(r);return l`
      <lcards-form-section header="Preview &amp; Export" icon="mdi:file-export-outline" ?expanded=${true} ?outlined=${true}>
        <div class="gen-toolbar-row gen-preview-mode-toolbar">
          <div class="gen-toggle-group gen-toggle-group-m">
            <wa-button-group childSelector="ha-button">
              <ha-button variant="brand" size="s" .appearance=${this._previewMode==="light"?"accent":"filled"}
                @click=${()=>{this._previewMode="light"}}>Light</ha-button>
              <ha-button variant="brand" size="s" .appearance=${this._previewMode==="dark"?"accent":"filled"}
                @click=${()=>{this._previewMode="dark"}}>Dark</ha-button>
            </wa-button-group>
          </div>
        </div>

        <lcards-form-section header="Palette Seed: Full Palettes" icon="mdi:palette-swatch" ?expanded=${true} nested
          description="The 5 raw palettes everything below is computed from. Edit them in Palette Seed above.">
          ${this._renderTierLegend()}
          <div class="gen-scale-preview">
            ${L.map(e=>{var o;const t=((o=this._model.roles[e])==null?void 0:o.source)==="none",n=this._scaleForRolePreview(e,this._previewMode);return l`
                <div class="gen-scale-row">
                  <div class="gen-scale-label">${K[e]}</div>
                  <div class="gen-scale-swatches">
                    ${y.map(c=>{const i=this._isRoleTonePreviewFallback(e,c),s=this._buttonTierTagBadge(e,c,this._previewMode),h=[i?`${this._roleDefaultBadge(e)} (not set by this theme)`:"",s.title].filter(Boolean).join(" · ");return l`
                        <div class="gen-scale-swatch ${i?"gen-scale-swatch-fallback":""}" title="${h}">
                          <div class="gen-swatch-fill" style="background-color:${n[c]}"></div>
                          ${s.abbr?l`<span class="gen-tier-badge gen-scale-swatch-role-tag">${s.abbr}</span>`:g}
                          <span class="gen-scale-swatch-tag">${c}</span>
                        </div>
                      `})}
                  </div>
                  ${t?l`<span class="gen-fallback-badge">${this._roleDefaultBadge(e)}</span>`:g}
                </div>
                ${this._renderTierCorrectionNotes(e,this._previewMode)}
              `})}
          </div>
        </lcards-form-section>

        <lcards-form-section header="Colour Reference" icon="mdi:format-color-fill" ?expanded=${false} nested
          description="Every field from HA-LCARS &amp; Legacy HA Semantic Colours, as one swatch sheet, for the selected Light/Dark mode above.">
          ${this._renderVarSwatchSection(r)}
        </lcards-form-section>

        <lcards-form-section header="Domain &amp; State Colours: Live" icon="mdi:state-machine" ?expanded=${false} nested
          @expanded-changed=${()=>this.requestUpdate()}
          description="Real HA tile cards previewing each domain below, since Domain &amp; State Colours otherwise has no live preview.">
          ${this._renderInfoGuide("domain-demo","mdi:information-outline","What these tiles are, and what they can't show",l`
            <p>Each tile is a real <code>hui-card</code> pointed at a fake entity, created only for this preview.
              Tapping a tile does nothing; the entity isn't real.</p>
            <p class="info-guide-tip"><strong>Person and device tracker are missing on purpose:</strong> HA's
              tile card doesn't colour those from a CSS var; their colour comes from a badge instead. Still
              editable as swatches in <strong>Domain &amp; State Colours</strong> above.</p>
            <p class="info-guide-note">A tile badged <strong>HA-LCARS Default</strong> or
              <strong>HA Default</strong> is showing this section's static default, not whatever theme is active on
              this browser tab. Real device-classed entities (e.g. an actual <code>binary_sensor.smoke</code>) may
              still show HA's own baked-in colour, since this generator only sets the generic per-state var, not
              device-class-specific ones.</p>
          `)}
          ${this._renderDomainDemoPreview(r)}
        </lcards-form-section>

        <!-- Deliberately NOT a collapsible lcards-form-section, unlike its siblings — see the long
             comment on updated()'s docblock. Card_mod/UIX demo cards below are imperatively mounted
             the moment their container first exists in the DOM; when this was briefly made
             collapsible, mounting was correctly deferred until first expand, but by then the cards
             were created and configured all at once, right as the user expanded the panel, rather
             than eagerly on page load like every other section's declarative content - and UIX's
             own per-card style injection came back consistently empty, strongly suggesting an
             async template-fetch race rather than enough time to resolve before being inspected.
             Kept eagerly mounted (this box's own div, not gated behind ha-expansion-panel's lazy
             <slot>) until that's root-caused for real, even though it makes this box unable to
             collapse like the rest of Preview & Export. -->
        <div class="gen-preview-box">
          <div class="gen-preview-heading">LCARS UI Chrome</div>
          <p class="gen-preview-subheading">The sidebar, app header, tooltip, and core <code>lcars-ui-*</code> colour
            tiers: chrome that can't be shown as a card_mod-classed card (see below).</p>
          ${this._renderInfoGuide("lcars-mockups","mdi:information-outline","What these mockups show",l`
            <p>Hand-built approximations, coloured from your current values for the selected Light/Dark mode above.
              Not pixel-exact, but close enough to check contrast and hue.</p>
          `)}
          ${this._renderLcarsMockups(this._previewMode)}

          <p class="gen-preview-subheading">Below: the same chrome, plus buttons and bars, rendered by real
            HA-LCARS card_mod classes when card_mod or UIX is available.</p>
          ${this._renderInfoGuide("lcars-cardmod","mdi:information-outline","What this needs to actually render",l`
            <p>Real examples from HA-LCARS's own README. Two things need to be true for them to render:</p>
            <ul>
              <li><a href="https://github.com/thomasloven/lovelace-card-mod" target="_blank" rel="noopener">card_mod</a>
                or its HACS successor <a href="https://uix.lf.technology/" target="_blank" rel="noopener">UIX</a> must
                be installed.</li>
              <li>Your currently active HA theme must be an HA-LCARS theme. The class definitions live in that
                theme's own <code>card-mod-card-yaml</code>, not in the theme you're editing here.</li>
            </ul>
            <p class="info-guide-tip">The <em>colours</em> those classes use (<code>--lcars-card-top-color</code>
              and friends) do come from the theme you're editing, live. Only the class definitions depend on what's
              active.</p>
          `)}
          ${this._renderLcarsCardModPreview(r)}
        </div>

        <lcards-form-section header="HA-* Native Controls" icon="mdi:home-assistant" ?expanded=${false} nested
          description="Real, stock HA elements, wrapped in this theme's computed colours for the selected Light/Dark mode.">
          ${this._renderInfoGuide("live-preview","mdi:information-outline","What's real here, and what still isn't",l`
            <p>Real <code>ha-card</code>/<code>ha-button</code>/<code>ha-switch</code>/<code>ha-checkbox</code>/
              <code>ha-alert</code> elements, wrapped in this theme's computed CSS. Nothing outside this box is
              affected, and nothing here is written to the export. Unlike the card_mod examples above, these always
              render.</p>
            <p class="info-guide-tip">The alert stack exercises the legacy
              <code>info/success/warning/error-color</code> vars: see <strong>Colour Reference</strong> above for
              every other field, as swatches.</p>
            <p class="info-guide-tip">Each variant shows all 4 of <code>ha-button</code>'s real
              <code>appearance</code> values (<code>frontend/src/components/ha-button.ts</code>'s own type: this
              isn't a curated subset), labelled by that real attribute name. Confirmed directly against the real
              <code>@home-assistant/webawesome</code> package and ha-button.ts's own overrides: <strong>Accent</strong>
              reads the "loud" fill/text tokens; <strong>Filled</strong> and <strong>Plain</strong> share the
              "normal" tokens (ha-button.ts explicitly redirects Plain's text to match Filled); <strong>Outlined</strong>
              is driven by the "quiet" tokens alone, entirely separate from Filled/Plain, so a same-looking swatch
              tone can legitimately land differently on Outlined than on Filled/Plain. The swatches in Palette Seed
              above are tagged with the same letters shown here: <strong>A</strong> = Accent background,
              <strong>F</strong> = Filled background, <strong>T</strong> = Filled &amp; Plain text,
              <strong>O</strong> = Outlined text. A role left "None" is tagged the same way, using HA's own real
              default scale instead. Its buttons come from HA's live fallback rather than anything exported here,
              but the tone that drives them is still real and still shown. Accent's text has no tag since it isn't
              tone-based: it's plain white by default, auto-corrected to black if that fails contrast; Filled/Plain
              and Outlined's text can each lose their own tag the same way, but only for a role Palette Seed
              actually manages (Family/Custom/Imported). That correction is this generator's own, applied on
              export, not something HA/"None" roles ever get. To change any of these, edit the tagged stop's colour
              in Palette Seed; the tone each tag points to isn't itself editable.</p>
            <p class="info-guide-tip">Toggle the switch/checkbox yourself to see both on and off colours.</p>
            <p class="info-guide-tip"><strong>Roles left "None" in Palette Seed</strong> render using whatever
              HA (or your active theme) falls back to right now.</p>
            <p class="info-guide-note">Not your actual dashboard: a real view adds its own layout and
              HA-LCARS chrome (see <strong>LCARS UI Chrome</strong> above). This box only proves the theme's colours
              resolve correctly.</p>
          `)}
          ${this._renderLiveComponentPreview(r)}
        </lcards-form-section>

        <div class="gen-preview-box gen-export-box">
          <div class="gen-preview-heading">Generated Theme YAML</div>
          <div class="info-card">
            <p>Paste this at the end of HA-LCARS's theme file (<code>lcars.yaml</code>), after its other themes. It
              references the shared <code>&amp;lcars-variables</code>/<code>&amp;base</code>/<code>&amp;card-mod-css</code>
              anchors for sidebar chrome, fonts, and card-mod styling this generator doesn't reproduce: everything
              listed below overrides them.</p>
          </div>
          <div class="yaml-actions">
            <span class="gen-hint" style="margin:0;">Generated YAML: read-only, copy it below.</span>
            <ha-button @click=${()=>this._handleCopyYaml()}>
              <ha-icon icon="${this._copyFeedback?"mdi:check":"mdi:content-copy"}" slot="start"></ha-icon>
              ${this._copyFeedback?"Copied!":"Copy YAML"}
            </ha-button>
          </div>
          <pre class="yaml-block"><code>${a}</code></pre>
        </div>
      </lcards-form-section>
    `}_legacyValueForMode(r,a){const e=A.find(n=>n.key===r);if(!e)return"#888888";const t=this._model.legacy[r];return a==="dark"&&(t==null?void 0:t.dark)!==void 0?this._previewHex(t.dark):(t==null?void 0:t.value)!==void 0?this._previewHex(t.value):e.fixed?a==="dark"&&e.fixedDark?e.fixedDark:e.fixed:e.live?this._staticHaDefault(e.key).hex:this._roleDerivesLegacyFields(e.role)?this._resolveTone(e.role,e.tone,a).hex:this._legacyFieldDefault(e).hex}_ambientBgHex(r){const a=this._legacyValueForMode("card-background-color",r);return a==="#888888"?"#000000":a}_renderLcarsMockups(r){const a=k(t=>this._legacyValueForMode(t,r),"v"),e=k((...t)=>t.map(n=>`--${n}: ${a(n)}`).join(`
`),"tip");return l`
      <div class="gen-mockup-grid">
        <div class="gen-mockup-cell">
          <div class="gen-mockup-caption">Sidebar</div>
          <div class="gen-lcars-sidebar" style="background:${a("lcars-sidebar-background")}" title=${e("lcars-sidebar-background")}>
            <div class="gen-lcars-sidebar-heading" style="color:${a("lcars-sidebar-text")}" title=${e("lcars-sidebar-text")}>Navigation</div>
            ${["Overview","Energy","Map"].map((t,n)=>l`
              <div class="gen-lcars-sidebar-item" style="color:${a(n===1?"lcars-sidebar-selected-color":"lcars-sidebar-item-color")}"
                title=${n===1?e("lcars-sidebar-selected-color"):e("lcars-sidebar-item-color","lcars-sidebar-icon-background","lcars-sidebar-icon-color")}>
                ${n===1?l`<span class="gen-lcars-sidebar-dot" style="background:${a("lcars-sidebar-selected-color")}"></span>`:l`<span class="gen-lcars-sidebar-dot" style="background:${a("lcars-sidebar-icon-background")}">
                      <span class="gen-lcars-sidebar-dot-glyph" style="background:${a("lcars-sidebar-icon-color")}"></span>
                    </span>`}
                ${t}
                ${n===2?l`<span class="gen-lcars-sidebar-badge" style="background:${a("lcars-sidebar-notification-color")}" title=${e("lcars-sidebar-notification-color")}>3</span>`:g}
              </div>
            `)}
          </div>
        </div>
        <div class="gen-mockup-cell">
          <div class="gen-mockup-caption">App Header &amp; Tooltip</div>
          <div class="gen-lcars-header" style="background:${a("lcars-ui-app-header-background-color")};color:${a("lcars-ui-app-header-text-color")}"
            title=${e("lcars-ui-app-header-background-color","lcars-ui-app-header-text-color")}>
            <span>LCARdS</span>
            <span style="color:${a("lcars-ui-app-header-clock")}" title=${e("lcars-ui-app-header-clock")}>14:22</span>
          </div>
          <div class="gen-lcars-tooltip" style="background:${a("lcars-tooltip-background")};color:${a("lcars-tooltip-text")}"
            title=${e("lcars-tooltip-background","lcars-tooltip-text")}>
            Living Room Light
          </div>
          <button class="gen-lcars-ripple-demo" style="--gen-ripple-color:${a("lcars-ripple-color")};color:${a("lcars-ui-app-header-text-color")}"
            title=${e("lcars-ripple-color")}>
            <ha-icon icon="mdi:gesture-tap"></ha-icon> Tap me
          </button>
        </div>
        <div class="gen-mockup-cell">
          <div class="gen-mockup-caption">UI Colour Tiers</div>
          <div class="gen-lcars-tier-heading" style="color:${a("lcars-ui-text-heading")}" title=${e("lcars-ui-text-heading")}>Status Display</div>
          <div class="gen-lcars-tier-stack">
            ${Kr.map(({key:t,textKey:n,label:o})=>l`
              <div class="gen-lcars-tier-bar" style="background:${a(t)};color:${a(n)}" title=${e(t,n)}>${o}</div>
            `)}
          </div>
          <div class="gen-lcars-tier-config">
            <span class="gen-lcars-config-chip" style="background:${a("lcars-ui-config-button")}" title=${e("lcars-ui-config-button","lcars-ui-config-icon")}>
              <ha-icon icon="mdi:cog" style="color:${a("lcars-ui-config-icon")}"></ha-icon>
            </span>
            <span class="gen-mockup-caption" style="margin:0">Config</span>
          </div>
        </div>
        <div class="gen-mockup-cell">
          <div class="gen-mockup-caption">Settings Card</div>
          <div class="gen-lcars-settings-card" style="background:${a("lcars-settings-card-color")};color:${a("lcars-settings-card-text")}"
            title=${e("lcars-settings-card-color","lcars-settings-card-text")}>
            <ha-icon icon="mdi:cog-outline"></ha-icon>
            <span>Display Settings</span>
          </div>
        </div>
      </div>
    `}_renderVarSwatchSection(r){const a=this._buildLiveVarStyle(r,this._previewMode);return l`
      <div class="gen-live-preview" style=${M(a)}>
        ${Wr.map(e=>l`
          <div class="gen-varswatch-group">
            <div class="gen-cardmod-group-title">${e}</div>
            <div class="gen-varswatch-row">
              ${A.filter(t=>t.group===e).map(t=>l`
                <div class="gen-varswatch-chip" title="--${t.key}&#10;${this._legacyValueForMode(t.key,this._previewMode)}">
                  <div class="gen-varswatch-swatch">
                    <div class="gen-swatch-fill" style="background-color:var(--${t.key})"></div>
                  </div>
                  <span class="gen-varswatch-label">${t.label}</span>
                </div>
              `)}
            </div>
          </div>
        `)}
      </div>
    `}_renderLiveComponentPreview(r){const a=this._buildLiveVarStyle(r,this._previewMode);return l`
      <div class="gen-live-preview" style=${M(a)}>
        <div class="gen-alert-stack">
          <ha-alert alert-type="info">Info</ha-alert>
          <ha-alert alert-type="success">Success</ha-alert>
          <ha-alert alert-type="warning">Warning</ha-alert>
          <ha-alert alert-type="error">Error</ha-alert>
        </div>
        <ha-card header="Warp Core Status">
          <div class="card-content">Standby: 94% output.</div>
          <div class="card-actions">
            <ha-button appearance="plain" variant="neutral">Cancel</ha-button>
            <ha-button appearance="accent" variant="brand">Engage</ha-button>
          </div>
        </ha-card>
        <div class="gen-btn-grid">
          ${Yr.flatMap(({role:e,variant:t,label:n})=>{const o=this._semanticRoleUnset(e);return[l`<div class="gen-btn-variant-label">${n}</div>`,...Vr.map(({appearance:c,label:i})=>l`
                <div class="gen-btn-cell ${o?"gen-btn-cell-fallback":""}">
                  <ha-button size="s" variant=${t} appearance=${c}>${i}</ha-button>
                  ${o?l`<div class="gen-mock-caption"><span class="gen-fallback-badge">HA default</span></div>`:g}
                </div>
              `)]})}
        </div>
        <div class="gen-live-switch-row">
          <ha-switch checked></ha-switch>
          <ha-checkbox checked></ha-checkbox>
        </div>
      </div>
    `}_renderLcarsCardModPreview(r){var n,o,c;if(!cr())return l`<p class="gen-hint">Neither card_mod nor UIX (UI eXtension) is installed. Install either via
        <a href="https://hacs.xyz/" target="_blank" rel="noopener">HACS</a> to see this preview.</p>`;const a=this._buildLiveVarStyle(r,this._previewMode),e=(c=(o=(n=this.hass)==null?void 0:n.themes)==null?void 0:o.themes)==null?void 0:c[this.hass.themes.theme],t=!!(e!=null&&e["card-mod-card-yaml"]);return l`
      <div class="gen-live-preview" style=${M(a)}>
        ${t?g:l`
          <p class="gen-hint">Your active HA theme doesn't define HA-LCARS's card-mod classes: these may render
            unstyled. Switch to an HA-LCARS theme to see this correctly.</p>
        `}
        ${kr.map(({group:i,demos:s})=>l`
          <div class="gen-cardmod-group-title">${i}</div>
          <div class="gen-mockup-grid">
            ${s.map(({slot:h,label:u,narrow:p})=>l`
              <div class="gen-mockup-cell ${p?"gen-mockup-cell-narrow":""}">
                <div class="gen-mockup-caption">${u}</div>
                <div class="gen-cardmod-slot" data-slot="${h}"></div>
              </div>
            `)}
          </div>
        `)}
      </div>
    `}_renderDomainDemoPreview(r){const a=this._buildLiveVarStyle(r,this._previewMode);return l`
      <div class="gen-live-preview" style=${M(a)}>
        <div class="gen-toggle-group gen-toggle-group-m">
          <wa-button-group childSelector="ha-button">
            <ha-button variant="brand" size="s" .appearance=${this._domainDemoActive?"accent":"filled"}
              @click=${()=>{this._domainDemoActive=true}}>Active</ha-button>
            <ha-button variant="brand" size="s" .appearance=${this._domainDemoActive?"filled":"accent"}
              @click=${()=>{this._domainDemoActive=false}}>Inactive</ha-button>
          </wa-button-group>
        </div>
        <div class="gen-mockup-grid">
          ${N.map(({domain:e,onState:t,offState:n})=>{var s;const o=this._domainDemoActive?t:n,i=((s=this._model.domainOverrides[`${e}.${o}`])==null?void 0:s.value)!==void 0?null:O[this._liveDomainStateDefault(e,o).tier];return l`
              <div class="gen-mockup-cell">
                <div class="gen-mockup-caption">${e.replace(/_/g," ")} · ${o.replace(/_/g," ")}
                  ${i?l`<span class="gen-fallback-badge">${i}</span>`:g}</div>
                <div class="gen-domain-demo-slot" data-domain="${e}"></div>
              </div>
            `})}
        </div>
      </div>
    `}updated(r){var e;if((e=super.updated)==null||e.call(this,r),cr())for(const{slot:t,config:n}of Xr){const o=this.renderRoot.querySelector(`.gen-cardmod-slot[data-slot="${t}"]`);if(!o)continue;let c=this._lcarsCardModWrappers[t];c||(c=lr(n,this.hass),this._lcarsCardModWrappers[t]=c),o.contains(c)||o.appendChild(c),r.has("hass")&&ir(c,this.hass,`cardmod-preview-${t}`)}const a=this._buildDemoHass();for(const{domain:t}of N){const n=this.renderRoot.querySelector(`.gen-domain-demo-slot[data-domain="${t}"]`);if(!n||!a)continue;let o=this._domainDemoWrappers[t];if(!o){const c=`${t}.lcards_theme_lab_demo`;o=lr({type:"tile",entity:c,tap_action:{action:"none"},icon_tap_action:{action:"none"}},a),this._domainDemoWrappers[t]=o}n.contains(o)||n.appendChild(o),(r.has("hass")||r.has("_domainDemoActive"))&&ir(o,a,`domain-demo-preview-${t}`)}}disconnectedCallback(){var r,a,e,t;for(const n of Object.keys(this._lcarsCardModWrappers))(a=(r=this._lcarsCardModWrappers[n])==null?void 0:r.remove)==null||a.call(r);this._lcarsCardModWrappers={};for(const n of Object.keys(this._domainDemoWrappers))(t=(e=this._domainDemoWrappers[n])==null?void 0:e.remove)==null||t.call(e);this._domainDemoWrappers={},super.disconnectedCallback()}_setName(r){this._model={...this._model,name:r}}_selectStartMode(r){this._startMode=r}_updateRoleSource(r,a){a==="custom"&&this._ensureCustomAnchors(r,"light");const t={...this._model.roles[r],source:a};a==="family"&&!t.family&&(t.family=G[0]),this._model={...this._model,roles:{...this._model.roles,[r]:t}}}_updateRoleFamily(r,a,e="light"){const t=e==="dark"?"darkFamily":"family";this._model={...this._model,roles:{...this._model.roles,[r]:{...this._model.roles[r],[t]:a}}}}_toggleRoleDarkDiffers(r,a){const e=this._model.roles[r];if(e.source==="family"){this._model={...this._model,roles:{...this._model.roles,[r]:{...e,darkFamily:a?e.darkFamily||e.family:void 0}}};return}if(e.source==="custom")if(a)this._ensureCustomAnchors(r,"dark");else{const t={...this._model.customAnchorsDark},n={...this._model.customAnchorsDarkTouched};delete t[r],delete n[r],this._model={...this._model,customAnchorsDark:t,customAnchorsDarkTouched:n}}}_ensureCustomAnchors(r,a="light"){var i;const e=a==="dark"?"customAnchorsDark":"customAnchors",t=a==="dark"?"customAnchorsDarkTouched":"customAnchorsTouched";if(this._model[e][r])return;const n=((i=this._model.roles[r])==null?void 0:i.source)==="imported"?this._model.importedRampsRaw[r]:null,o={},c=new Set;if(n)for(const s of y)n[s]!==void 0?(o[s]=n[s],c.add(s)):o[s]=this._staticHaDefault(`ha-color-${r}-${s}`).hex;else{const s=this._scaleForRole(r,a)[40]||"#888888";for(const h of y)o[h]=h==="40"?s:"#888888"}this._model={...this._model,[e]:{...this._model[e],[r]:o},[t]:{...this._model[t],[r]:c}}}_updateCustomTone(r,a,e,t="light"){const n=t==="dark"?"customAnchorsDark":"customAnchors",o=t==="dark"?"customAnchorsDarkTouched":"customAnchorsTouched",c={...this._model[n][r]||{},[a]:e},i=new Set(this._model[o][r]||[]);i.add(a),this._model={...this._model,[n]:{...this._model[n],[r]:c},[o]:{...this._model[o],[r]:i}}}_clearCustomAnchors(r,a="light"){const e=a==="dark"?"customAnchorsDark":"customAnchors",t=a==="dark"?"customAnchorsDarkTouched":"customAnchorsTouched",n={};for(const o of y)n[o]="#888888";this._model={...this._model,[e]:{...this._model[e],[r]:n},[t]:{...this._model[t],[r]:new Set}}}_generateAnchorsFromBase(r,a="light"){const e=a==="dark"?"customAnchorsDark":"customAnchors",t=a==="dark"?"customAnchorsDarkTouched":"customAnchorsTouched",o=(this._model[e][r]||{})[40]||"#888888",c=this._previewHex(o),i=Cr(c);i[40]=o,this._model={...this._model,[e]:{...this._model[e],[r]:i},[t]:{...this._model[t],[r]:new Set}}}_setLegacyValue(r,a,e=false){const t={...this._model.legacy[r]||{}};e?t.dark=a:t.value=a,this._model={...this._model,legacy:{...this._model.legacy,[r]:t}}}_toggleLegacyDark(r,a,e){const t={...this._model.legacy[r]||{}};a?t.dark=t.dark??t.value??e:delete t.dark,this._model={...this._model,legacy:{...this._model.legacy,[r]:t}}}_revertLegacyValue(r){const a={...this._model.legacy};delete a[r],this._model={...this._model,legacy:a}}_revertDomainOverride(r,a){const e=`${r}.${a}`,t={...this._model.domainOverrides};delete t[e],this._model={...this._model,domainOverrides:t}}_setDomainOverride(r,a,e,t=false){const n=`${r}.${a}`,o={...this._model.domainOverrides[n]||{}};t?o.dark=e:o.value=e,this._model={...this._model,domainOverrides:{...this._model.domainOverrides,[n]:o}}}_toggleDomainDark(r,a,e,t){const n=`${r}.${a}`,o={...this._model.domainOverrides[n]||{}};e?o.dark=o.dark??o.value??t:delete o.dark,this._model={...this._model,domainOverrides:{...this._model.domainOverrides,[n]:o}}}_addRawOverride(){const r=`raw-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;this._model={...this._model,raw:[...this._model.raw,{id:r,key:"",value:"#ffffff"}]}}_updateRawKey(r,a){this._model={...this._model,raw:this._model.raw.map(e=>e.id===r?{...e,key:a}:e)}}_updateRawValue(r,a,e=false){this._model={...this._model,raw:this._model.raw.map(t=>t.id===r?{...t,[e?"dark":"value"]:a}:t)}}_toggleRawDark(r,a){this._model={...this._model,raw:this._model.raw.map(e=>{if(e.id!==r)return e;if(a)return{...e,dark:e.dark??e.value};const{dark:t,...n}=e;return n})}}_removeRawOverride(r){this._model={...this._model,raw:this._model.raw.filter(a=>a.id!==r)}}_handleLoadLibraryTheme(){this._importError=null,this._importFeedback=null;const r=this._selectedLibraryTheme,a=this._themeLibraryEntries.find(e=>e.name===r);if(!a){this._importError=`"${r}" not found.`;return}this._importThemeObject(r,a.obj)}_handleImportYaml(){this._importError=null,this._importFeedback=null;const r=this._pasteYamlText;if(!r||!r.trim()){this._importError="Paste a theme YAML block first.";return}const a=r.replace(/^\s*<<:\s*\*\S+\s*$/gm,"");let e;try{e=fr(a)}catch(o){this._importError=`Could not parse YAML: ${o.message}`,Z.warn("[ThemeGeneratorView] YAML import failed",o);return}const t=Object.keys(e||{});if(!t.length){this._importError="No theme found in the pasted YAML.";return}const n=t[0];this._importThemeObject(n,e[n]||{})}_importThemeObject(r,a){var D;const e={},t={},n=[],o={};let c=0;const i=k((d,m,v)=>{if(d.startsWith("rgb-")&&vr.has(d.slice(4))){c++;return}if(Ur.has(d)){e[d]=e[d]||{},v?e[d].dark=m:e[d].value=m;return}const x=d.match(jr);if(x){const w=`${x[1]}.${x[2]}`;t[w]=t[w]||{},v?t[w].dark=m:t[w].value=m;return}const z=!v&&d.match(Gr);if(z){const[,w,wr]=z;o[w]=o[w]||{},o[w][wr]=m}let T=n.find(w=>w.key===d);T||(T={id:`raw-import-${d}`,key:d,value:void 0},n.push(T)),v?T.dark=m:T.value=m},"assignFlat"),s=_.boilerplate;for(const[d,m]of Object.entries(a))d!=="modes"&&(d.startsWith("card-mod-")||typeof m!="string"&&typeof m!="number"||d in s&&s[d]===m||i(d,String(m),false));for(const d of["light","dark"]){const m=(D=a.modes)==null?void 0:D[d];if(m)for(const[v,x]of Object.entries(m))typeof x!="string"&&typeof x!="number"||i(v,String(x),d==="dark")}const h={},u={};for(const[d,m]of Object.entries(o)){if(!L.includes(d))continue;const v={};for(const x of y)x in m&&(v[x]=this._resolveThemeValue(m[x],a));h[d]=v,u[d]={...m};for(const x of y){const z=n.findIndex(T=>T.key===`ha-color-${d}-${x}`);z!==-1&&n.splice(z,1)}}const p={};for(const d of L)p[d]=h[d]?{source:"imported"}:{source:"none"};this._model={...this._model,name:r,roles:p,legacy:e,domainOverrides:t,raw:n,importedRamps:h,importedRampsRaw:u},this._importedThemeContext=a;for(const d of n){const m=Br[d.key];m!==void 0&&d.value===m&&delete d.value}for(const d of["light","dark"]){const m=_.modeScopedBoilerplate[d]||{};for(const v of n){const x=m[v.key];x!==void 0&&(d==="dark"?v.dark===x&&delete v.dark:v.value===x&&delete v.value)}}for(const d of["light","dark"]){const m=this._buildSemanticTokensForMode(d);for(const v of n){const x=m[v.key];x!==void 0&&(d==="dark"?v.dark===x&&delete v.dark:v.value===x&&delete v.value)}}for(let d=n.length-1;d>=0;d--)n[d].value===void 0&&n[d].dark===void 0&&n.splice(d,1);const S=Object.keys(h).length,B=S?` ${S} palette ramp(s) imported and now active in Palette Seed.`:"",f=L.filter(d=>!h[d]),$=f.length?` ${f.map(d=>K[d]).join(", ")} had nothing to import, so they stay your own choice there.`:"",R=c?` ${c} rgb-* companion(s) recomputed automatically instead of imported.`:"";this._importFeedback=`Loaded "${r}": ${Object.keys(e).length} known field(s), ${Object.keys(t).length} domain colour(s), ${n.length} sent to Advanced / Raw Overrides.${B}${$}${R}`}_resolveOnValue(r,a,e){const t=this._resolveSemanticRoleToneAsAtom.bind(this);return j(t,k((o,c)=>E(t,o,a,c,"resting"),"resolveFillResting"),r,a,e,this._ambientBgHex(a)).var}_buildSemanticTokensForMode(r){const a={},e=this._resolveSemanticRoleToneAsAtom.bind(this);for(const t of Y)if(!this._semanticRoleUnset(t))for(const n of F)a[`ha-color-on-${t}-${n}`]=this._resolveOnValue(t,r,n);for(const t of Y)if(!this._semanticRoleUnset(t))for(const n of F){const o=t==="disabled"?["resting","hover"]:["resting","hover","active"];for(const c of o)a[`ha-color-fill-${t}-${n}-${c}`]=E(e,t,r,n,c).var}for(const t of sr)if(!this._semanticRoleUnset(t))for(const n of F)a[`ha-color-border-${t}-${n}`]=dr(e,t,r,n).var;if(!this._semanticRoleUnset("neutral")){for(const t of Object.keys(hr[r])){const n=t==="on-surface-default"?"ha-color-on-surface-default":`ha-color-surface-${t}`;a[n]=ur(e,r,t).var}a["ha-color-form-background-hover"]=q(e,r,"hover").var,a["ha-color-form-background-disabled"]=q(e,r,"disabled").var}return a}_buildExportModel(){const r={},a={},e={};this._resolveSemanticRoleToneAsAtom.bind(this);for(const t of G)for(const n of y)r[J(t,n).slice(2)]=I[Q(t,Number(n))];r["lcards-moonlight"]=I.moonlight;for(const t of L){const n=this._model.roles[t];if(n.source==="none")continue;const o=this._roleDarkDiffers(t);for(const c of y){if(n.source==="imported"&&!(c in(this._model.importedRamps[t]||{})))continue;const i=`ha-color-${t}-${c}`,s=this._resolveTone(t,c,"light");if(r[i]=s.var,o){const h=this._resolveTone(t,c,"dark");h.var!==s.var&&(e[i]=h.var)}}}for(const t of A){const n=this._model.legacy[t.key];if(t.live||t.fixed){if((n==null?void 0:n.value)===void 0)continue;r[t.key]=n.value,n.dark!==void 0&&(e[t.key]=n.dark);continue}if((n==null?void 0:n.value)===void 0&&!this._roleDerivesLegacyFields(t.role))continue;const o=this._resolveTone(t.role,t.tone,"light"),c=this._resolveTone(t.role,t.tone,"dark");if(r[t.key]=(n==null?void 0:n.value)??o.var,(n==null?void 0:n.dark)!==void 0?e[t.key]=n.dark:(n==null?void 0:n.value)===void 0&&c.var!==o.var&&(e[t.key]=c.var),vr.has(t.key)){const i=(n==null?void 0:n.value)!==void 0?this._previewHex(n.value):o.hex;if(r[`rgb-${t.key}`]=pr(i).join(", "),e[t.key]!==void 0){const s=(n==null?void 0:n.dark)!==void 0?this._previewHex(n.dark):c==null?void 0:c.hex;s&&(e[`rgb-${t.key}`]=pr(s).join(", "))}}}for(const t of["light","dark"])Object.assign(t==="light"?a:e,this._buildSemanticTokensForMode(t));for(const[t,n]of Object.entries(nr))for(const o of n){const c=`state-${t}-${o}-color`,i=`${t}.${o}`,s=this._model.domainOverrides[i];(s==null?void 0:s.value)!==void 0&&(r[c]=s.value,s.dark!==void 0&&(e[c]=s.dark))}for(const t of this._model.raw){if(!t.key)continue;const n=t.value??"";r[t.key]=n,t.key in a&&(a[t.key]=n),t.dark!==void 0?e[t.key]=t.dark:t.key in e&&(e[t.key]=n)}return{name:this._model.name||"My HA-LCARS Theme",mergeKeys:["lcars-variables","base","card-mod-css"],flat:r,modes:{light:a,dark:e}}}_buildLiveVarStyle(r,a){const e={};for(const[n,o]of Object.entries(_.boilerplate))typeof o=="string"&&(e[`--${n}`]=o);Object.assign(e,this._buildLegacyDefaultStyle(a)),Object.assign(e,this._buildDomainDefaultStyle()),Object.assign(e,this._buildSemanticDefaultStyle(a));const t={...r.flat,...r.modes[a]||{}};for(const[n,o]of Object.entries(t))o&&(e[`--${n}`]=o);return{...e,...$r}}_buildLegacyDefaultStyle(r){const a={};for(const e of A){const t=this._model.legacy[e.key];(t==null?void 0:t.value)===void 0&&(!e.fixed&&!e.live&&this._roleDerivesLegacyFields(e.role)||(a[`--${e.key}`]=e.fixed?r==="dark"&&e.fixedDark?e.fixedDark:e.fixed:this._legacyFieldDefault(e).var))}return a}_buildDomainDefaultStyle(){var a;const r={};for(const{domain:e,onState:t,offState:n}of N){const o=this._domainDemoActive?t:n,c=`${e}.${o}`;((a=this._model.domainOverrides[c])==null?void 0:a.value)===void 0&&(r[`--state-${e}-${o}-color`]=this._liveDomainStateDefault(e,o).var)}return r}_buildSemanticDefaultStyle(r){var t;const a={};for(const n of L)for(const o of y)this._isRoleTonePreviewFallback(n,o)&&(a[`--ha-color-${n}-${o}`]=this._staticHaDefault(`ha-color-${n}-${o}`).var);const e=this._staticSemanticRoleTone.bind(this);for(const n of Y)if(this._semanticRoleUnset(n))for(const o of F){const c=((t=C[n][r])==null?void 0:t[o])!==void 0?C[n][r]:C[n].light,i=c[o]!==void 0?c[o]:C[n].light[o];a[`--ha-color-on-${n}-${o}`]=e(n,i,r).var;const s=n==="disabled"?["resting","hover"]:["resting","hover","active"];for(const h of s)a[`--ha-color-fill-${n}-${o}-${h}`]=E(e,n,r,o,h).var}for(const n of sr)if(this._semanticRoleUnset(n))for(const o of F)a[`--ha-color-border-${n}-${o}`]=dr(e,n,r,o).var;if(!this._semanticRoleUnset("neutral")){for(const n of Object.keys(hr[r])){const o=n==="on-surface-default"?"ha-color-on-surface-default":`ha-color-surface-${n}`;a[`--${o}`]=ur(e,r,n).var}a["--ha-color-form-background-hover"]=q(e,r,"hover").var,a["--ha-color-form-background-disabled"]=q(e,r,"disabled").var}return a}_buildDemoHass(){if(!this.hass)return this.hass;if(this._demoHassSourceHass===this.hass&&this._demoHassSourceActive===this._domainDemoActive)return this._demoHassCache;const r={...this.hass.states};for(const{domain:a,onState:e,offState:t}of N){const n=`${a}.lcards_theme_lab_demo`;r[n]={entity_id:n,state:this._domainDemoActive?e:t,attributes:{friendly_name:`Demo ${a.replace(/_/g," ")}`},last_changed:"",last_updated:"",context:{id:"lcards-preview",parent_id:null,user_id:null}}}return this._demoHassSourceHass=this.hass,this._demoHassSourceActive=this._domainDemoActive,this._demoHassCache={...this.hass,states:r},this._demoHassCache}async _handleCopyYaml(){const r=or(this._buildExportModel()),a=await Rr(r);this._copyFeedback=a,a&&setTimeout(()=>{this._copyFeedback=false},2e3)}};k(tr,"LCARdSThemeGeneratorView");let ar=tr;customElements.get("lcards-theme-generator-view")||customElements.define("lcards-theme-generator-view",ar);export{ar as LCARdSThemeGeneratorView,Wr as LEGACY_GROUPS};
//# sourceMappingURL=lcards-theme-generator-view-C8BVjNmU.js.map
