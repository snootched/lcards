# HA-LCARS variables

From [HA-LCARS](https://github.com/th3jesta/ha-lcars) at commit `0c4ce18` (2026-09-21), MIT (c) Jesse Wisener. Every `--lcars-*` CSS variable the theme sets. Use them in LCARdS colours as `var(--lcars-...)`; names outside this list only exist in a user's own theme.

## Role variables

What a theme changes when you switch it. Prefer these in LCARdS cards (`var(--lcars-card-button-color)`, `var(--lcars-ui-tertiary)`): the card then follows the theme. The `-text` partner of each colour is the readable text colour on it.

### UI Colors

| Variable | Default | Colours |
|---|---|---|
| `--lcars-ui-primary` | `var(--lcars-almond-creme)` (#ffbbaa) | sidebar background; app header background |
| `--lcars-ui-primary-text` | `var(--lcars-text-dark)` (#000000) | text on the sidebar and app header |
| `--lcars-ui-secondary` | `var(--lcars-african-violet)` (#cc88ff) | sidebar nav item bars and icons; config/gear button; entity state indicator ("on" color); drag ghost in automation/script editors |
| `--lcars-ui-secondary-text` | `var(--lcars-text-dark)` (#000000) | sidebar nav text |
| `--lcars-ui-tertiary` | `var(--lcars-red)` (#dd4444) | slider active track; header clock color; sidebar notification badges |
| `--lcars-ui-tertiary-text` | `var(--lcars-text-dark)` (#000000) | text on lcars-ui-tertiary surfaces (auto-computed by generate_themes.py) |
| `--lcars-ui-quaternary` | `var(--lcars-gray)` (#666688) | default card background; chip/filter pill backgrounds; alternating table row backgrounds; card-background-color fallback |
| `--lcars-ui-quaternary-text` | `var(--lcars-text-light)` (#FFFFFF) | text inside input fields and filter chips |
| `--lcars-ui-accent-color` | `var(--lcars-orange)` (#ff7700) | notification badge backgrounds; history graph fills; media seek bar; dashboard edit-mode icons |
| `--lcars-ui-accent-text` | `var(--lcars-text-dark)` (#000000) | text on accent-colored surfaces (badge counts, edit-mode icon labels) |
| `--lcars-background-color` | `var(--lcars-black)` (#000000) | page background; cutout borders and interior voids throughout LCARS card frames |
| `--lcars-background-text` | `var(--lcars-text-light)` (#FFFFFF) | text on lcars-background-color surfaces |

### Header/Big Elbow

| Variable | Default | Colours |
|---|---|---|
| `--lcars-ui-app-header-background-color` | `var(--lcars-ui-primary)` (#ffbbaa) | top app bar background |
| `--lcars-ui-app-header-text-color` | `var(--lcars-ui-primary-text)` (#000000) | top app bar text and icons |
| `--lcars-ui-app-header-clock` | `var(--lcars-ui-tertiary)` (#dd4444) | clock / header label displayed at the right of the app bar |
| `--lcars-ui-config-button` | `var(--lcars-ui-secondary)` (#cc88ff) | Settings button background |
| `--lcars-ui-config-icon` | `var(--lcars-ui-config-button)` (#cc88ff) | Settings icon color |

### Sidebar Menu

| Variable | Default | Colours |
|---|---|---|
| `--lcars-sidebar-background` | `var(--lcars-ui-primary)` (#ffbbaa) | color of elbow and empty space |
| `--lcars-sidebar-item-color` | `var(--lcars-ui-secondary)` (#cc88ff) | colored bar behind each nav item label |
| `--lcars-sidebar-text` | `var(--lcars-ui-secondary-text)` (#000000) | nav item label text |
| `--lcars-sidebar-icon-color` | `var(--lcars-card-top-text)` (#000000) | icon glyphs in the collapsed sidebar; icon column background when expanded |
| `--lcars-sidebar-icon-background` | `var(--lcars-card-top-color)` (#7788ff) | icon column background (expanded sidebar) and user-account item background |
| `--lcars-sidebar-selected-color` | `var(--lcars-ui-tertiary)` (#dd4444) | highlight color for the active/selected nav item (bar, border, badge, icon) |
| `--lcars-sidebar-notification-color` | `var(--lcars-ui-tertiary)` (#dd4444) | unread-notification badge on nav items |

### UI Text

| Variable | Default | Colours |
|---|---|---|
| `--lcars-ui-text-heading` | `var(--lcars-text-gray)` (#d3d3d3) | section/view heading titles on dashboards |
| `--lcars-tooltip-background` | `var(--lcars-ui-quaternary)` (#666688) | Tooltips popups |
| `--lcars-tooltip-text` | `var(--lcars-ui-quaternary-text)` (#FFFFFF) |  |

### Card colors

| Variable | Default | Colours |
|---|---|---|
| `--lcars-card-top-color` | `var(--lcars-bluey)` (#7788ff) | top bar background of LCARS card sections |
| `--lcars-card-mid-color` | `var(--lcars-red)` (#dd4444) | mid bar background of LCARS card sections |
| `--lcars-card-button-color` | `var(--lcars-red)` (#dd4444) | button background in LCARS card sections |
| `--lcars-card-bottom-color` | `var(--lcars-gray)` (#666688) | bottom bar background of LCARS card sections |
| `--lcars-settings-card-color` | `#727295` | cards in the settings menus. This must be medium contrast with both light and dark text. |

### Card text

| Variable | Default | Colours |
|---|---|---|
| `--lcars-card-top-text` | `var(--lcars-text-dark)` (#000000) | label color on card top bars |
| `--lcars-card-mid-text` | `var(--lcars-text-dark)` (#000000) | label color on card mid bars |
| `--lcars-card-button-text` | `var(--lcars-text-dark)` (#000000) | text color on card buttons |
| `--lcars-card-bottom-text` | `var(--lcars-text-dark)` (#000000) | label color on card bottom bars |

### Status colors

| Variable | Default | Colours |
|---|---|---|
| `--success-color` | `var(--lcars-green)` (#33cc99) |  |
| `--warning-color` | `var(--lcars-sunflower)` (#ffcc66) |  |
| `--error-color` | `var(--lcars-dark-red)` (#360000) |  |
| `--lcars-ripple-color` | `var(--lcars-ui-mix-color)` (white) | Button press ripple (issue #149). Themes can override the wash color and either opacity. Color defaults to the mode-aware contrast token (black in light mode, white in dark); pressed opacity is ~3x HA's 0.12 default so a tap is unmistakable on any button color. |
| `--lcars-ripple-pressed-opacity` | `0.4` |  |
| `--lcars-ripple-hover-opacity` | `0.12` |  |
| `--ha-color-primary-05` | `color-mix(in oklch, var(--lcars-ui-tertiary) 10%, black)` | HA tonal palette derived from lcars-ui-tertiary (approximates HA's OKLCH palette generation). Defined here rather than in &base so themes with hand-tuned palettes (the LCARdS variants) override cleanly instead of duplicating keys merged in via <<: *base (issue #232). |
| `--ha-color-primary-10` | `color-mix(in oklch, var(--lcars-ui-tertiary) 22%, black)` |  |
| `--ha-color-primary-20` | `color-mix(in oklch, var(--lcars-ui-tertiary) 44%, black)` |  |
| `--ha-color-primary-30` | `color-mix(in oklch, var(--lcars-ui-tertiary) 67%, black)` |  |
| `--ha-color-primary-40` | `var(--lcars-ui-tertiary)` (#dd4444) |  |
| `--ha-color-primary-50` | `color-mix(in oklch, var(--lcars-ui-tertiary) 88%, white)` |  |
| `--ha-color-primary-60` | `color-mix(in oklch, var(--lcars-ui-tertiary) 70%, white)` |  |
| `--ha-color-primary-70` | `color-mix(in oklch, var(--lcars-ui-tertiary) 50%, white)` |  |
| `--ha-color-primary-80` | `color-mix(in oklch, var(--lcars-ui-tertiary) 30%, white)` |  |
| `--ha-color-primary-90` | `color-mix(in oklch, var(--lcars-ui-tertiary) 15%, white)` |  |
| `--ha-color-primary-95` | `color-mix(in oklch, var(--lcars-ui-tertiary) 8%, white)` |  |

### Light and dark mode defaults

Set per mode (HA profile: theme mode light/dark/auto).

| Variable | Light | Dark |
|---|---|---|
| `--lcars-ui-mix-color` | `black` | `white` |
| `--lcars-backlight-center` | `#ffffff30` | `#ffffff10` |
| `--lcars-backlight-middle` | `transparent` | `transparent` |
| `--lcars-backlight-middle-location` | `60%` | `70%` |
| `--lcars-backlight-outer` | `transparent` | `#00000080` |
| `--lcars-settings-card-text` | `var(--lcars-text-light)` | `var(--lcars-text-dark)` |

## Palette

Fixed colours, the same in every theme. Use them for a colour that must not follow the theme.

### LCARS colours

- `--lcars-space-white`: `#f5f6fa`
- `--lcars-violet-creme`: `#ddbbff`
- `--lcars-green`: `#33cc99`
- `--lcars-magenta`: `#cc4499`
- `--lcars-blue`: `#4455ff`
- `--lcars-yellow`: `#ffcc33`
- `--lcars-violet`: `#9944ff`
- `--lcars-orange`: `#ff7700`
- `--lcars-african-violet`: `#cc88ff`
- `--lcars-text-purple`: `#cc77ff`
- `--lcars-red`: `#dd4444`
- `--lcars-almond`: `#ffaa90`
- `--lcars-almond-creme`: `#ffbbaa`
- `--lcars-sunflower`: `#ffcc66`
- `--lcars-bluey`: `#7788ff`
- `--lcars-gray`: `#666688`
- `--lcars-sky`: `#aaaaff`
- `--lcars-ice`: `#88ccff`
- `--lcars-gold`: `#ffaa00`
- `--lcars-mars`: `#ff2200`
- `--lcars-peach`: `#ff8866`
- `--lcars-butterscotch`: `#ff9966`
- `--lcars-tomato`: `#ff5555`
- `--lcars-lilac`: `#cc33ff`
- `--lcars-evening`: `#2255ff`
- `--lcars-midnight`: `#1111ee`
- `--lcars-ghost`: `#88bbff`
- `--lcars-wheat`: `#ccaa88`
- `--lcars-roseblush`: `#cc6666`
- `--lcars-honey`: `#ffcc99`
- `--lcars-cardinal`: `#cc2233`
- `--lcars-pumpkinshade`: `#ff7744`
- `--lcars-darkpumpkin`: `#91550b`
- `--lcars-tangerine`: `#ff8833`
- `--lcars-martian`: `#99dd66`
- `--lcars-text-blue`: `#2266ff`
- `--lcars-moonbeam`: `#ccdeff`
- `--lcars-cool`: `#5588ff`
- `--lcars-galaxy`: `#444a77`
- `--lcars-moonshine`: `#ddeeff`
- `--lcars-october-sunset`: `#ff4400`
- `--lcars-harvestgold`: `#ffaa44`
- `--lcars-butter`: `#ffeecc`
- `--lcars-steel-blue`: `#5588ee`
- `--lcars-aqua`: `#88ffff`
- `--lcars-deep-navy`: `#344470`
- `--lcars-slate`: `#455580`
- `--lcars-periwinkle`: `#7799dd`
- `--lcars-sky-blue`: `#66ccff`
- `--lcars-powder-blue`: `#99ccff`
- `--lcars-vermilion`: `#ff3500`
- `--lcars-plum`: `#552255`
- `--lcars-eggplant`: `#663366`
- `--lcars-mauve`: `#774477`
- `--lcars-orchid`: `#885588`
- `--lcars-lavender-rose`: `#996699`
- `--lcars-yam`: `#ff8800`
- `--lcars-taupe`: `#d0b0a0`
- `--lcars-periwinkle-light`: `#bbbbff`
- `--lcars-sage`: `#99aa66`
- `--lcars-emerald`: `#00bb00`
- `--lcars-lime`: `#33ff33`
- `--lcars-mint`: `#ddffdd`
- `--lcars-peach-light`: `#ffebde`
- `--lcars-lilac-light`: `#cc99cc`
- `--lcars-lavender-mist`: `#f6eef6`
- `--lcars-plum-medium`: `#aa66aa`
- `--lcars-orchid-light`: `#dd88dd`
- `--lcars-scarlet`: `#ff0000`
- `--lcars-crimson`: `#cc0000`
- `--lcars-ruby`: `#ee0000`
- `--lcars-silver`: `#dfdfdf`
- `--lcars-pearl`: `#f7f7f7`

### LCARS Modern Theme Colors

- `--lcars-modern-light-gray`: `#9996BA`

### LCARS Transporter Theme Colors

- `--lcars-navy-gray`: `#2C374B`
- `--lcars-slate-gray`: `#6E748C`
- `--lcars-teal`: `#2A7092`
- `--lcars-coral`: `#FA6851`
- `--lcars-charcoal`: `#51596C`

### LCARS Navigation Theme Colors

- `--lcars-olive`: `#827A53`
- `--lcars-sand`: `#CDB972`
- `--lcars-lemon`: `#F7EE51`
- `--lcars-cornflower`: `#6499FF`
- `--lcars-khaki-dark`: `#B8A666`

### LCARS Picard S1 Colors

- `--lcars-dunkelgrau`: `#30374AFF`
- `--lcars-mittelgrau`: `#656B83FF`
- `--lcars-hellgrau`: `#9FA5BDFF`
- `--lcars-feuerrot`: `#E7432AFF`
- `--lcars-mango`: `#E5960C`
- `--lcars-turquoise`: `#6efaf9`
- `--lcars-beige`: `#e2c599`
- `--lcars-cerulean`: `#21bece`
- `--lcars-midnight-blue`: `#012556`
- `--lcars-seafoam`: `#d6f6f1`
- `--lcars-apricot`: `#e1915c`

### Additional Colors

- `--lcars-lavender`: `#cc88ff`
- `--lcars-error`: `#ff2200`

### Grayscale text scale, perceptually spaced (CIE L*)

- `--lcars-text-dark`: `#000000` (L*=0: pure black, max contrast)
- `--lcars-text-coal`: `#292929` (L*=17: near-black, softens stark black on bright surfaces)
- `--lcars-text-smoke`: `#4E4E4E` (L*=33: dark gray)
- `--lcars-text-stone`: `#777777` (L*=50: mid gray)
- `--lcars-text-mist`: `#A2A2A2` (L*=67: light-mid gray)
- `--lcars-text-gray`: `#d3d3d3` (L*=84: light gray (off-white), softens stark white on dark surfaces)
- `--lcars-text-light`: `#FFFFFF` (L*=100: pure white, max contrast)
- `--lcars-medium-gray`: `#B6B6C1`
- `--lcars-dark-gray`: `#3e3e3e`
- `--lcars-khaki`: `#ffe399`
- `--lcars-cardassia-maroon`: `#4f1a23`
- `--lcars-dark-red`: `#360000`
- `--lcars-green-primary`: `#288855`
- `--lcars-green-secondary`: `#229a6c`
- `--lcars-green-tertiary`: `#88de90`
- `--lcars-green-middle`: `#0f5616`
- `--lcars-green-footer`: `#37bd76`

### LCARS 25C

- `--lcars-alt-dark-gray`: `#2f3749`
- `--lcars-medium-dark-gray`: `#52596e`
- `--lcars-primary-gray`: `#6d748c`
- `--lcars-light-gray`: `#9ea5ba`
- `--lcars-ghost-gray`: `#d2d5df`
- `--lcars-starlight`: `#f3f4f7`
- `--lcars-cyan`: `#0ee`
- `--lcars-alt-orange`: `#e7442a`
- `--lcars-light-orange`: `#ff6753`
- `--lcars-pale-orange`: `#ff977b`
- `--lcars-alt-blue`: `#37a6d1`
- `--lcars-medium-dark-blue`: `#2a7193`
- `--lcars-dark-blue`: `#1c3c55`
- `--lcars-alt-green`: `#2B9032`
- `--lcars-black-cherry`: `#8c6d7c`
- `--lcars-font-color`: `#828ba6`
- `--lcars-alert-red`: `var(--lcars-crimson)`
- `--lcars-alert-yellow`: `var(--lcars-gold)`
- `--lcars-alert-blue`: `var(--lcars-text-blue)`
- `--lcars-alert-white`: `var(--lcars-silver)`
- `--lcars-alert-uv`: `#000080`
- `--lcars-alert-uvc`: `#68fffa`

### General

- `--lcars-black`: `#000000`
- `--lcars-graphite`: `#555555`

### TNG Theme Colors

- `--lcars-wheat-light`: `#f5deb3`
- `--lcars-peach-cream`: `#f5cd9f`
- `--lcars-tan`: `#d2b48c`
- `--lcars-antique-gold`: `#c5b358`
- `--lcars-warm-gold`: `#efc861`
- `--lcars-amber`: `#ffbb33`
- `--lcars-khaki-light`: `#f0e68c`
- `--lcars-vivid-crimson`: `#dc143c`
- `--lcars-maroon`: `#8b0000`

### Lower Decks II Colors

- `--lcars-vanilla`: `#fff5c7`

### Kronos Colors

- `--lcars-deep-maroon`: `#930a00`

### Red Alert Colors

- `--lcars-brick-red`: `#bf1b1b`
- `--lcars-mahogany`: `#9d361e`
- `--lcars-muted-coral`: `#d66a60`
- `--lcars-sienna`: `#91311c`

### Orange family

- `--lcards-orange-darkest`: `#d91604`
- `--lcards-orange-dark`: `#ef1d10`
- `--lcards-orange-medium-dark`: `#e7442a`
- `--lcards-orange`: `#ff6753`
- `--lcards-orange-medium`: `#ff6753`
- `--lcards-orange-medium-light`: `#ff8470`
- `--lcards-orange-light`: `#ff977b`
- `--lcards-orange-lightest`: `#ffb399`

### Gray family

- `--lcards-gray-darkest`: `#1e2229`
- `--lcards-gray-dark`: `#2f3749`
- `--lcards-gray-medium-dark`: `#52596e`
- `--lcards-gray`: `#6d748c`
- `--lcards-gray-medium`: `#6d748c`
- `--lcards-gray-medium-light`: `#9ea5ba`
- `--lcards-gray-light`: `#d2d5df`
- `--lcards-gray-lightest`: `#f3f4f7`
- `--lcards-moonlight`: `#dfe1e8`

### Blue family

- `--lcards-blue-darkest`: `#002241`
- `--lcards-blue-dark`: `#1c3c55`
- `--lcards-blue-medium-dark`: `#2a7193`
- `--lcards-blue`: `#37a6d1`
- `--lcards-blue-medium`: `#37a6d1`
- `--lcards-blue-medium-light`: `#67caf0`
- `--lcards-blue-light`: `#93e1ff`
- `--lcards-blue-lightest`: `#00eeee`

### Green family

- `--lcards-green-darkest`: `#0c2a15`
- `--lcards-green-dark`: `#083717`
- `--lcards-green-medium-dark`: `#095320`
- `--lcards-green`: `#266239`
- `--lcards-green-medium`: `#266239`
- `--lcards-green-medium-light`: `#458359`
- `--lcards-green-light`: `#80bb93`
- `--lcards-green-lightest`: `#b8e0c1`

### Yellow family

- `--lcards-yellow-darkest`: `#70602c`
- `--lcards-yellow-dark`: `#ac943b`
- `--lcards-yellow-medium-dark`: `#d2bf50`
- `--lcards-yellow`: `#f9ef97`
- `--lcards-yellow-medium`: `#f9ef97`
- `--lcards-yellow-medium-light`: `#fffac9`
- `--lcards-yellow-light`: `#e7e6de`
- `--lcards-yellow-lightest`: `#f5f5dc`

### Shapes

- `--lcars-vertical-border`: `35px`
- `--lcars-horizontal-border`: `10px`
- `--lcars-outer-radius`: `34px`
- `--lcars-inner-radius`: `20px`

### Calculated

- `--lcars-middle-vertical-border`: `calc(var(--lcars-vertical-border) + 0px)`

### Font

- `--lcars-font`: `Tungsten`
- `--lcars-fallback-font`: `Antonio`

### MSD Colors

- `--msd-bright`: `#fff1ab`
- `--msd-medium`: `var(--lcars-yellow)` ("#ffcc33")
- `--msd-normal`: `var(--lcars-orange)` ("#ff7700")
- `--msd-dark`: `var(--lcars-october-sunset)` ("#ff4400")
- `--msd-ra-bright`: `#dca29e`
- `--msd-ra-medium`: `#e97369`
- `--msd-ra-normal`: `#ff1100`
- `--msd-ra-dark`: `#7f0800`

## Other names

Set by individual themes or by the HA-LCARS CSS itself (some from the helper entities, e.g. `--lcars-sound`, `--lcars-vertical-border`). Valid to read, rarely needed.

`--lcars-alert-color`, `--lcars-capped`, `--lcars-card-background`, `--lcars-card-button`, `--lcars-card-button-barrel`, `--lcars-card-button-off`, `--lcars-card-mid-left-color`, `--lcars-entity-class`, `--lcars-global-readout-width`, `--lcars-height`, `--lcars-inner-readout-width`, `--lcars-primary-text`, `--lcars-secondary-text`, `--lcars-sound`, `--lcars-tab-selected-bg`, `--lcars-texture`, `--lcars-type`
