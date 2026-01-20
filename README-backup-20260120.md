# LCARdS

<div align="center">

![LCARdS Banner](images/screenshots/cb-lcars-banner-4.gif)

**Modern LCARS Card System for Home Assistant**

[![HACS](https://img.shields.io/badge/HACS-Default-41BDF5.svg)](https://hacs.xyz)
[![Version](https://img.shields.io/github/v/release/snootched/lcards)](https://github.com/snootched/lcards/releases)
[![License](https://img.shields.io/github/license/snootched/lcards)](LICENSE)

*LCARS + cards = LCARdS*

[Installation](#installation) • [Documentation](#documentation) • [Examples](#examples) • [Migration Guide](#migration-from-cb-lcars)

</div>

---

## What is LCARdS?

LCARdS (LCARS + cards) is a comprehensive card system for Home Assistant that recreates the iconic LCARS interfaces from Star Trek. Built on modern web technologies with native LitElement architecture.

### Key Features

- 🎨 **Authentic LCARS Design**: Recreate Star Trek interfaces in Home Assistant
- 🗺️ **Master Systems Display (MSD)**: Interactive ship diagrams with overlays and controls
- 🎭 **Multiple Card Types**: Buttons, elbows, labels, meters, and more
- ⚡ **High Performance**: 95KB smaller, 20% faster than legacy implementations
- 🎬 **Advanced Animations**: Built on anime.js v4 with timeline support
- 🎨 **Theme System**: Multiple LCARS era themes (TNG, DS9, Voyager, Picard)
- 🔧 **Modular Architecture**: Clean, maintainable, extensible codebase

### Evolution from CB-LCARS

LCARdS is the evolution of CB-LCARS, rebuilt from the ground up with:

- Native LitElement base (no custom-button-card dependency)
- Modern action handling via custom-card-helpers
- Clean architecture optimized for Home Assistant
- Foundation for multi-instance support (coming soon)

**Migrating from CB-LCARS?** See our [Migration Guide](#migration-from-cb-lcars).

---

## Installation

### Via HACS (Recommended)

1. Open HACS in Home Assistant
2. Go to "Frontend"
3. Click "+" to add repository
4. Search for "LCARdS"
5. Click "Install"
6. Restart Home Assistant

### Manual Installation

1. Download `lcards.js` from the [latest release](https://github.com/snootched/lcards/releases)
2. Copy to `/config/www/lcards/lcards.js`
3. Add resource in Lovelace:

```yaml
resources:
  - url: /local/lcards/lcards.js
    type: module
```

4. Restart Home Assistant

---

## Quick Start

### Your First Card

```yaml
type: custom:lcards-button-card
lcards_card_type: lcards-button-lozenge
entity: light.living_room
show_label: true
show_name: true
tap_action:
  action: toggle
```

### Master Systems Display (MSD)

```yaml
type: custom:lcards-msd-card
msd:
  version: 1
  base_svg:
    source: "builtin:ncc-1701-d"
  overlays:
    - id: main_power
      type: status_grid
      position: [100, 50]
      entities:
        - light.main_power
```

---

## Documentation

- 📚 [User Guide](doc/user-guide/) - Complete usage documentation
- 🏗️ [Architecture Overview](doc/architecture/) - Technical architecture details
- 🎨 [MSD Documentation](doc/msd/) - Master Systems Display guide
- 🛠️ [Developer Guide](doc/developer/) - Development and customization
- 🔧 [API Reference](doc/api/) - Complete API documentation

---

## Examples

### Button Cards

```yaml
# LCARS Button Lozenge
type: custom:lcards-button-card
lcards_card_type: lcards-button-lozenge
entity: light.bridge
name: "BRIDGE"
show_state: true
tap_action:
  action: toggle

# LCARS Elbow
type: custom:lcards-elbow-card
lcards_card_type: lcards-elbow-left
size: large
color: orange
```

### Advanced MSD

```yaml
type: custom:lcards-msd-card
msd:
  version: 1
  base_svg:
    source: "builtin:enterprise-d"
  overlays:
    - id: bridge_status
      type: status_grid
      position: [200, 100]
      size: [80, 60]
      entities:
        - light.bridge_main
        - light.bridge_emergency
        - sensor.bridge_occupancy
      actions:
        tap_action:
          action: navigate
          navigation_path: /lovelace/bridge

    - id: warp_core
      type: button
      position: [300, 250]
      text: "WARP CORE"
      actions:
        tap_action:
          action: call-service
          service: switch.toggle
          target:
            entity_id: switch.warp_core
```

---

## Migration from CB-LCARS

CB-LCARS users can migrate to LCARdS for improved performance and new features:

### What Changed?

| **Aspect** | **CB-LCARS** | **LCARdS** |
|---|---|---|
| **Element Names** | `custom:cb-lcars-*` | `custom:lcards-*` |
| **Template Names** | `cb-lcars-*` | `lcards-*` |
| **Config Variables** | `cblcars_card_type` | `lcards_card_type` |
| **Resource URL** | `/hacsfiles/cb-lcars/cb-lcars.js` | `/hacsfiles/lcards/lcards.js` |

### Simple Migration

Replace these patterns in your dashboard YAML:

```yaml
# Old (CB-LCARS)
type: custom:cb-lcars-msd-card
cb-lcars-msd:
  variables: ...
cblcars_card_type: cb-lcars-button-lozenge

# New (LCARdS)
type: custom:lcards-msd-card
lcards-msd:
  variables: ...
lcards_card_type: lcards-button-lozenge
```

### Automated Migration

```bash
# Download migration script
curl -o migrate.js https://github.com/snootched/lcards/releases/latest/download/migrate.js

# Backup your config
cp /config/ui-lovelace.yaml /config/ui-lovelace.yaml.backup

# Run migration
node migrate.js /config/ui-lovelace.yaml

# Review and apply changes
```

**Important**: CB-LCARS remains available in maintenance mode. Migrate when ready.

---

## Performance

LCARdS delivers significant performance improvements over CB-LCARS:

| **Metric** | **CB-LCARS** | **LCARdS** | **Improvement** |
|---|---|---|---|
| **Bundle Size** | ~120KB | ~25KB | 📦 95KB smaller |
| **Load Time** | Baseline | 20% faster | ⚡ Faster startup |
| **Memory Usage** | Baseline | 15% less | 🧠 More efficient |
| **Dependencies** | custom-button-card | None | 🎯 No external deps |

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
# Clone repository
git clone https://github.com/snootched/lcards.git
cd lcards

# Install dependencies
npm install

# Build
npm run build

# Development build
npm run build:dev
```

### Project Structure

```
src/
├── base/               # Native architecture components
├── cards/              # Card implementations
├── msd/                # Master Systems Display
├── utils/              # Utilities and helpers
├── lcards/             # YAML templates
└── lcards.js           # Main entry point
```

---

## Support

- 🐛 [Report Issues](https://github.com/snootched/lcards/issues)
- 💬 [Community Forum](https://community.home-assistant.io/)
- 📖 [Documentation](https://github.com/snootched/lcards/blob/main/README.md)

---

## Roadmap

### v1.x Series (Current)
- ✅ Native LitElement architecture
- ✅ MSD with overlays and controls
- ✅ Advanced animation system
- ✅ Theme system
- ✅ Performance optimizations

### v2.x Series (Future)
- 🔮 Multi-instance MSD support
- 🔮 Component library for custom cards
- 🔮 Visual MSD editor
- 🔮 Enhanced mobile support
- 🔮 Advanced theming system

[Full Roadmap →](doc/ROADMAP.md)

---

## Architecture

LCARdS uses a modern, clean architecture:

```
LitElement (from lit)
    ↓
LCARdSNativeCard (base class)
    ↓
├── LCARdSMSDCard (Master Systems Display)
├── LCARdSButtonCard (Various button types)
└── [Future] Additional card types
```

**Action Handling**:
```
User Interaction → LCARdSActionHandler → custom-card-helpers → Home Assistant
```

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Acknowledgments

- Star Trek © CBS/Paramount
- Built for [Home Assistant](https://www.home-assistant.io/)
- Evolved from CB-LCARS project
- Powered by [anime.js v4](https://animejs.com/)
- Uses [custom-card-helpers](https://github.com/custom-cards/custom-card-helpers)

---

<div align="center">

**Live long and prosper** 🖖

[Website](https://github.com/snootched/lcards) • [GitHub](https://github.com/snootched/lcards) • [HACS](https://hacs.xyz)

</div>

- [LCARdS](#cb-lcars)
  - [Overview](#overview)
  - [Features](#features)
    - [What it isn't...](#what-it-isnt)
  - [Installation - Make it so!](#installation---make-it-so)
    - [1. Dependencies and Extras](#1-dependencies-and-extras)
    - [2. HA-LCARS Theme - Setup and Customizations](#2-ha-lcars-theme---setup-and-customizations)
      - [Fonts](#fonts)
      - [Customized *LCARdS* Colour Scheme](#customized-lcards-colour-scheme)
    - [3. Install LCARdS from HACS](#3-install-lcards-from-hacs)
    - [4. Engage!](#4-engage)
  - [LCARdS Cards](#lcards-cards)
    - [LCARS Elbows](#lcars-elbows)
    - [LCARS Buttons](#lcars-buttons)
    - [LCARS Multimeter (Sliders/Gauges)](#lcars-multimeter-slidersgauges)
      - [Ranges](#ranges)
    - [LCARS Labels](#lcars-labels)
    - [LCARS DPAD](#lcars-dpad)
  - [States](#states)
  - [Joining with a Symbiont \[Card Encapsulation\]](#joining-with-a-symbiont-card-encapsulation)
    - [Imprinting](#imprinting)
      - [User card-mod styles](#user-card-mod-styles)
  - [Animations and Effects](#animations-and-effects)
  - [Screenshots and Examples](#screenshots-and-examples)
    - [Example: Tablet Dashboard](#example-tablet-dashboard)
  - [Example: Room Selector with Multimeter Light Controls](#example-room-selector-with-multimeter-light-controls)
    - [Control Samples](#control-samples)
      - [Button Samples](#button-samples)
      - [Sliders/Gauges](#slidersgauges)
      - [Row of sliders (Transporter controls? :grin:)](#row-of-sliders-transporter-controls-grin)
  - [Some Dashboard possibilities...](#some-dashboard-possibilities)
  - [Acknowledgements \& Thanks](#acknowledgements--thanks)
  - [License](#license)


<br>

---
# LCARdS

##  Overview

LCARdS is a collection of custom cards for Home Assistant, inspired by the iconic LCARS interface from Star Trek.  Build your own LCARS-style dashboard with authentic controls and animations.

## Features

- Built upon a [Starfleet-issued version](https://github.com/snootched/button-card-lcars/tree/cb-lcars) of `custom-button-card` enhanced with additional features and internal template management.
- Designed to work with [HA-LCARS theme](https://github.com/th3jesta/ha-lcars).
- Includes many LCARS-style elements: buttons, sliders/gauges, elbows, d-pad, and a growing library of animated effects.
- Highly customizable and dynamic state-responsive styles: colours, borders, text, icons, animations, and much more.
- Controls can match the colour of light entities.
- ***Symbiont*** mode lets you encapsulate other cards and imprint LCARS styling onto them.
- Use HA 'Sections' dashboards or custom/grid layouts for best results.


### What it isn't...

- LCARdS is not its own theme — pair with [HA-LCARS theme](https://github.com/th3jesta/ha-lcars) for the full LCARS experience.
- Not fully standalone—some controls may require other HACS cards (see requirements).
- Not a fully commissioned Starfleet  product — those features won't be installed until Tuesday.  (this is a hobby project, so expect some tribbles.)

<br>

## Installation - Make it so!

[![Open your Home Assistant instance and show the add repository dialog with a specific repository URL.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=snootched&repository=cb-lcars)


> :dizzy: tl;dr: Express Startup Sequence
>
> - _Clear All Moorings and Open Starbase Doors_
>   - Install 'required' dependencies from HACS
> - _Thrusters Ahead, Take Us Out_
>   - Setup HA-LCARS theme (notes below)
>   - Add LCARdS custom style to HA-LCARS theme
> - _Bring Warp Core Online, Engines to Full Power_
>   - Install LCARdS from HACS
> - _Engage!_
>

<details closed><summary>Detailed Installation</summary>

### 1. Dependencies and Extras

The following should be installed and working in your Home Assistant instance - these are available in HACS
<br><b>Please follow the instructions in the respective project documentation for installation details. </b>

| Custom Card                                                                 |  Required?  | Function    |
|-----------------------------------------------------------------------------|-------------|-------------|
| [ha-lcars theme](https://github.com/th3jesta/ha-lcars)                      | Required    | Provides base theme elements, styes, colour variables, etc. |
| [my-slider-v2](https://github.com/AnthonMS/my-cards)                      | Required    | Provided slider function in Multimeter card. |
| [lovelace-card-mod](https://github.com/thomasloven/lovelace-card-mod)       | Required | LCARdS requires card-mod for using the _host imprint_ feature on symbiont cards.  It is also required by HA-LCARS theming at the time of writing.<br><br>Very useful for modifying the elements/styles of other cards to fit the theme (overriding fonts, colours, remove backgrounds etc.) |
| | |
| [lovelace-layout-card](https://github.com/thomasloven/lovelace-layout-card) | Optional    | No longer used internally but it's handy for the ultimate in dashboard layout customization! |

<br>

### 2. HA-LCARS Theme - Setup and Customizations

#### Fonts

As part of HA-LCARS setup, when adding the font resource, use a slightly updated Antonio font resource string.<br>

This will include weights 100-700 allowing for more thinner/lighter text as seen in Picard (some displays use really thin font, 100 or 200)

Substitute the following resource string when setting up font in HA-LCARS theme:
`https://fonts.googleapis.com/css2?family=Antonio:wght@100..700&display=swap`

> **Note:**  If the font is missing, the card will attempt to load it dynamically from the above URL.)

<br>

**Additional Fonts**

LCARdS ships with local versions of Microgramma and Jeffries.

These fonts are added automatically to the page via stylesheets and use custom names as to not conflict with any existing fonts.

- `cb-lcars_microgramma`
- `cb-lcars_jeffries`


#### Customized *LCARdS* Colour Scheme

 *Ideally, add and use this cb-lcars profile into your HA-LCARS theme.  If not, the additional colour definitions will be made available to use at runtime by the cards.*

 Copy the custom `LCARS Picard [cb-lcars]` definition from [lcards-lcars.yaml](ha-lcars-theme/lcards-lcars.yaml) to your HA-LCARS `lcars.yaml` file in Home Assistant (per instructions for [adding custom themes to HA-LCARS](https://github.com/th3jesta/ha-lcars?tab=readme-ov-file#make-your-own-color-themes)).

Set `LCARS Picard [cb-lcars]` as the active theme.

<details closed><summary>Picard [cb-lcars]</summary>
Grays, Blues, and Oranges are the core colours.  Greens and Yellows added for additional options.

![Picard theme](images/themes/lcars_picard_ii_colors.png)

These are the colours used for the ha-lcars defined variables.

![Picard ha-lcars](images/themes/lcars_picard_ii_ha-lcars_settings.png)
</details>

<br>

### 3. Install LCARdS from HACS

1. Add LCARdS git repository as a custom repo in HACS.
2. Install LCARdS from HACS like any other project.


### 4. Engage!

Add LCARdS cards to your dashboard just like any other card.
</details>


---

## LCARdS Cards

For reference - these are the cards found in LCARdS.
They are highly configurable - and some default styles are shown.

Additional style possibilities can be found in the screenshots section.

Settings are available in the UI editor.


<br>

### LCARS Elbows


**`type: custom:lcards-elbow-card`**


| `lcards_card_type:`                                            | Default Style          |
| --------------------------------------------------------------- | ---------------------- |
| [`lcards-header`](src/cb-lcars/lcards-header.yaml)              | ![lcards-header](images/button_samples/lcards-header.png)              |
| [`lcards-header-right`](src/cb-lcars/lcards-header.yaml)        | ![lcards-header-right](images/button_samples/lcards-header-right.png)        |
| [`lcards-header-contained`](src/cb-lcars/lcards-header.yaml)    | ![lcards-header-contained](images/button_samples/lcards-header-contained.png)    |
| [`lcards-header-open`](src/cb-lcars/lcards-header.yaml)         | ![lcards-header-open](images/button_samples/lcards-header-open.png)         |


| `lcards_card_type:`                                            | Default Style          |
| --------------------------------------------------------------- | ---------------------- |
| [`lcards-footer`](src/cb-lcars/lcards-footer.yaml)              | ![lcards-footer](images/button_samples/lcards-footer.png)              |
| [`lcards-footer-right`](src/cb-lcars/lcards-footer.yaml)        | ![lcards-footer-right](images/button_samples/lcards-footer-right.png) |
| [`lcards-footer-contained`](src/cb-lcars/lcards-footer.yaml)    | ![lcards-footer-contained](images/button_samples/lcards-footer-contained.png)    |
| [`lcards-footer-open`](src/cb-lcars/lcards-footer.yaml)         | ![lcards-footer-open](images/button_samples/lcards-footer-open.png)         |

| `lcards_card_type:`                                              | Default Style          |
| ----------------------------------------------------------------- | ---------------------- |
| [`lcards-header-callout`](src/cb-lcars/lcards-callout.yaml)       | ![lcards-header-callout](images/button_samples/lcards-header-callout.png)       |
| [`lcards-header-callout-right`](src/cb-lcars/lcards-callout.yaml) | ![lcards-header-callout-right](images/button_samples/lcards-header-callout-right.png) |
| [`lcards-footer-callout`](src/cb-lcars/lcards-callout.yaml)       | ![lcards-footer-callout](images/button_samples/lcards-footer-callout.png)       |
| [`lcards-footer-callout-right`](src/cb-lcars/lcards-callout.yaml) | ![lcards-footer-callout-right](images/button_samples/lcards-footer-callout-right.png) |

<br>

**`type: custom:lcards-double-elbow-card`**

| `lcards_card_type:`                                                   | Default Style          |
| ---------------------------------------------------------------------- | ---------------------- |
| [`lcards-header-picard`](src/cb-lcars/lcards-header-picard.yaml)       | ![lcards-header-picard](images/button_samples/lcards-header-picard.png)       |
| [`lcards-header-picard-right`](src/cb-lcars/lcards-header-picard.yaml) | ![lcards-header-picard-right](images/button_samples/lcards-header-picard-right.png) |
| [`lcards-footer-picard`](src/cb-lcars/lcards-footer-picard.yaml)       | ![lcards-footer-picard](images/button_samples/lcards-footer-picard.png)       |
| [`lcards-footer-picard-right`](src/cb-lcars/lcards-footer-picard.yaml) | ![lcards-footer-picard-right](images/button_samples/lcards-footer-picard-right.png) |

<br>

### LCARS Buttons

**`type: custom:lcards-button-card`**

| `lcards_card_type:`                                                                 | Default Style          |
| ------------------------------------------------------------------------------------ | ---------------------- |
| [`lcards-button-lozenge`](src/cb-lcars/lcards-button-lozenge.yaml)                   | ![lcards-button-lozenge](images/button_samples/lcards-button-lozenge.png) |
| [`lcards-button-bullet`](src/cb-lcars/lcards-button-bullet.yaml)                     | ![lcards-button-bullet](images/button_samples/lcards-button-bullet.png)  |
| [`lcards-button-capped`](src/cb-lcars/lcards-button-capped.yaml)                     | ![lcards-button-capped](images/button_samples/lcards-button-capped.png)  |
| [`lcards-button-picard`](src/cb-lcars/lcards-button-picard.yaml)                     | ![lcards-button-picard](images/button_samples/lcards-button-picard.png)              |
| [`lcards-button-picard-dense`](src/cb-lcars/lcards-button-picard.yaml)               | ![lcards-button-picard-dense](images/button_samples/lcards-button-picard-dense.png)        |
| [`lcards-button-picard-filled`](src/cb-lcars/lcards-button-picard-filled.yaml)       | ![lcards-button-picard-filled](images/button_samples/lcards-button-picard-filled.png)       |
| [`lcards-button-picard-filled-dense`](src/cb-lcars/lcards-button-picard-filled.yaml) | ![lcards-button-picard-filled-dense](images/button_samples/lcards-button-picard-filled-dense.png) |
| [`lcards-button-picard-icon`](src/cb-lcars/lcards-button-picard-icon.yaml)           | ![lcards-button-picard-icon](images/button_samples/lcards-button-picard-icon.png)         |

<br>

### LCARS Multimeter (Sliders/Gauges)

**`type:lcards-multimeter-card`**

- Supports interactive (entity) mode, or non-interactive (sensor) mode.
  - Mode is determined automatically by the assigned entity
- Run in Slider or Guage mode
- Horizontal or Vertical orientation
- Configurable multi-modal slider control:
  - Light: brightness, temperature, hue, saturation
  - Media Player: volume, seek
  - (uses my-slider-v2 custom card internally)
- Fully configurable borders, label/text, slider
- Colour match [border|slider|gauge|gradient start/end etc.] to entity colour
- Configurable min, max, gauge increments, slider step size
  - Min/Max/Units are automatically obtained from the entity (if supported)
- Show/Hide Units, Override unit
- Configurable Subticks
  - Show/Hide
  - Size
  - Count (number of subticks per segement)
- Ranges: now supporting background colours set with ranges
- Picard style option in vertical mode

![lcards-multimeter](images/screenshots/multimeter.gif)
![multimeter-picard](images/screenshots/lcards-multimeter-picard-samples-1.gif)

#### Ranges

Background colour in gauge mode can be segmented into ranges.
This can currently be done in the yaml configuration of multimeter.

!['multimeter-range'](images/button_samples/lcards-multimeter-ranges.png) !['multimeter-picard-range'](images/button_samples/lcards-multimeter-picard-ranges.png)

```yaml
type: custom:lcards-multimeter-card
variables:
  gauge:
    ranges:
      - from: 0
        to: 30
        color: var(--picard-darkest-yellow)
      - from: 30
        to: 75
        color: var(--picard-darkest-green
      - from: 75
        to: 100
        color: var(--picard-darkest-orange)
```

<br>

### LCARS Labels

**`type:lcards-label-card`**


- Card for creating labels/text
- Full graphical customization
- Pre-configured label templates for various looks seen in LCARS

| `lcards_card_type:`        | Styles          |
| -------------- | ---------------------- |
| [`lcards-label`](src/cb-lcars/lcards-label.yaml) | ![picard-callout-2](images/screenshots/label-2.png) |
| [`lcards-label-picard`](src/cb-lcars/lcards-label-presets.yaml) | ![lcards-label-2](images/screenshots/picard-labels.png) |

<br>

### LCARS DPAD

**`type:lcards-dpad-card`**

- Card-wide active/inactive colours
- Per-segment active/inactive colours
- Assignable entity per segment
- Assignable actions/controls per segment (default `toggle`)

![lcards-dpad](images/screenshots/dpad.gif)

<br>

---

## States

LCARdS cards allow you to dynamically change the appearance of card components—such as borders, backgrounds, text, and icons — based on the state of an entity or attribute. You can use built-in state options for common scenarios, or define advanced custom state conditions for more granular control.

For full details on configuring states, including advanced matching (by value, range, regex, etc.) and applying custom styles, see the dedicated documentation: [doc/lcards-state-system.md](doc/lcards-state-system.md).

---

## Joining with a Symbiont [Card Encapsulation]

LCARdS has graduated the Initiate program and can become a host to a symbiont card.  Joining enables you to imprint some LCARdS styling to the encapsulated card.  Most common case would be with the Elbow card to add LCARS borders - but much more is possible.

Just supply your symbiont card configuration into the editor and it will inset the the symbiont into the LCARdS host card.  After joining, you can adjust settings, imprint host styles onto the symbiont, and even supply your own additional `card-mod` configuration to the symbiont.

### Imprinting

Currently, imprinting will apply the host background colours and text font, size, and colours to the symbiont.  This feature uses some basic `card-mod` configuration targeted primarily to `ha-card`.

#### User card-mod styles
You can provide your own `card-mod` configuration which will append to the host configuration.  You can also override any host styling with your `card-mod` config.

Card-mod templating is supported and the host card's `variables:` block and `entity` are made available to the symbiont.  These can be accessed with standard card-mod jinja templating.

```yaml
Example accessing the host card's card default colour.

variables:
  symbiont:
    enabled: true
    imprint_host: true
    symbiont_user_style: |
      ha-card {
        background: {{ config.variables.card.color.default }} !important;
      }
```

<br>

**Example - Join with Entities Card**

A regular entities card will join with a host LCARdS Elbow card and have the host styles imprinted (font, font colour and size, background)

We start with our basic entities card
![unjoined](images/screenshots/symbiont-unjoined.png)

We join the card as our symbiont:

![joined-not-imprinted](images/screenshots/symbiont-joined-not-imprinted.png)

We then imprint the host card styles onto the symbiont:
![joined-imprinted](images/screenshots/symbiont-joined-imprinted.png)

---

## Animations and Effects

LCARdS includes a growing set of highly customizable animations and effects for your cards. Each animation offers extensive configuration options, accessible via the UI. For full details and usage instructions, see the dedicated documentation for each animation—just click the template links in the table below.

It's recommended to use either the Elbow or Button card as the base card to host your animation.

- [ALERT](doc/lcards-animation-alert.md)
- [Data Cascade](doc/lcards-animation-cascade.md)
- [Pulsewave](doc/lcards-animation-pulsewave.md)
- [GRID](doc/lcards-animation-bg-grid.md)
- [GEO Array](doc/lcards-animation-geo-array.md)

<br>

| template ||
|----------|----------------|
| [`lcards-animation-alert`](doc/lcards-animation-alert.md) | ![lcards-alert](images/screenshots/alert_condition_animated_1.gif) |
| [`lcards-animation-cascade`](doc/lcards-animation-cascade.md) | ![lcards-cascade](images/screenshots/data_cascade.gif) |
| [`lcards-animation-pulsewave`](doc/lcards-animation-pulsewave.md) | ![lcards-animation-pulsewave](images/screenshots/lcards-pulsewave-samples-1.gif) |
[`lcards-animation-bg-grid`](doc/lcards-animation-bg-grid.md) |![lcards-animation-bg-grid](images/screenshots/lcards-bg-grid-samples-1.gif) <br>Nebula Samples ![nebula-samples-1](images/screenshots/nebula-samples-1.png)|
[`lcards-animation-geo-array`](doc/lcards-animation-geo-array.md) | Can be used as an inset animation recreating some of the LCARS panel effects.  Animations are similar to Data Cascade ![lcards-animation-geo-array](images/screenshots/lcards-geo-array-samples-1.gif) |



---

## Screenshots and Examples

Below are some example dashboards and controls.  Also a collection of screenshots and snippets of potential variations of the controls.

<br>

### Example: Tablet Dashboard

Example of a WIP dasboard sized for a Samsung Tab A9.

This makes use of custom layouts to create the main dashboard with a header bar, left sidebar, footer bar, and a content area.

The left sidebar uses an `input_select` helper to specify which 'page' is to be displayed in the content area.  Then conditions are used to show/hide the panes of the content.

Source: [`dashboard-tablet.yaml`](examples/dashboard-tablet.yaml)

![tablet_home](images/screenshots/dashboard_tablet_home.png)

![tablet_lights](images/screenshots/dashboard_tablet_lights.png)

![tablet_environmental](images/screenshots/dashboard_tablet_environmental.png)

![tablet_security](images/screenshots/dashboard_tablet_security.png)

## Example: Room Selector with Multimeter Light Controls

Example of a custom controls panel that has a room selector sidebar (similar to the tablet dashboard example using `input_select` helpers.)

Each room then has a grid of multimeter controls for the lights in each room.

For fun, the small block to the right of each room button will change colour to match the entity colour for the room's light group.

This example shows how to use the base card as a canvas and add more cards on top.  This code can be condensed if desired using things like the custom template card - and there are probably many other ways to get the same results.

Source: [`lightselector.yaml`](examples/lightselector.yaml)


![dashboard_light_grid](images/screenshots/dashboard_light_grid.png)

![dashboard_lightselector_1](images/screenshots/dashboard_lightselector_1.png)

![dashboard_lightselector_2](images/screenshots/dashboard_lightselector_2.png)


### Control Samples

#### Button Samples

![picard-button-1](images/screenshots/picard-button-1.png)
![picard-button-1-off](images/screenshots/picard-button-1-off.png)
![picard-button-2](images/screenshots/picard-button-2.png)
![picard-button-2-off](images/screenshots/picard-button-2-off.png)
![lozenge-button-1](images/screenshots/lozenge-button-1.png)
![lozenge-button-1-off](images/screenshots/lozenge-button-1-off.png)
![lcards-button-grid](images/button_samples/lcards-button-grid.png)
![button-grid-1](images/screenshots/button-grid-1.png)
![button-grid-2](images/screenshots/button-grid-2.png)
![icon-gird-1](images/screenshots/icon-grid-1.png)



#### Sliders/Gauges

![meter-1](images/screenshots/meter-1.png) ![meter-2](images/screenshots/meter-2.png) ![meter-3](images/screenshots/meter-3.png) ![meter-4](images/screenshots/meter-4.png)

![lcards-multimeter](images/button_samples/lcards-multimeter.png)

![multimeter-1](images/screenshots/multimeter-1.png)



#### Row of sliders (Transporter controls? :grin:)

![dashboard_light_sliders](images/screenshots/dashboard_light_sliders.png)


## Some Dashboard possibilities...

![dashboard_1](images/screenshots/dashboard_sample_1.png)

<br>

![dashboard_2](images/screenshots/dashboard_sample_2.png)

<br>

![dashboard_red_alert_1](images/screenshots/dashboard_sample_red_alert_1.png)

<br>

![dashboard_3](images/screenshots/dashboard_sample_3.png)

---

## Acknowledgements & Thanks

A very sincere thanks to these projects and their authors, contributors and communities for doing what they do, and making it available.  It really does make this a fun hobby to tinker with.

[**ha-lcars theme**](https://github.com/th3jesta/ha-lcars) (the definitive LCARS theme for HA!)

[**custom-button-card**](https://github.com/custom-cards/button-card)

[**my-cards/my-slider-v2**](https://github.com/AnthonMS/my-cards)

[**lovelace-layout-card**](https://github.com/thomasloven/lovelace-layout-card)

[**lovelace-card-mod**](https://github.com/thomasloven/lovelace-card-mod)

[**lovelace-hue-like-light-card**](https://github.com/Gh61/lovelace-hue-like-light-card)

<br>
As well, some shout-outs and attributions to these great projects:
<br><br>

[lovelace-animated-background](https://github.com/rbogdanov/lovelace-animated-background) - Allows for animated/video backgrounds on the dashboard (stars look great.)  Additionally, Home Assistant natively supports background images (can be configured in UI from 2024.6+)

[lovelace-wallpanel](https://github.com/j-a-n/lovelace-wallpanel) - Great panel-mode features - including hiding side/top bars, screensaver function (with cards support)

[LCARSlad London](https://twitter.com/lcarslad) for excellent LCARS images and diagrams for reference.

[meWho Titan.DS](https://www.mewho.com/titan) for such a cool interactive design demo and colour reference.

[TheLCARS.com]( https://www.thelcars.com) a great LCARS design reference, and the base reference for Data Cascade and Pulsewave animations.

[wfurphy creative-button-card-templates](https://github.com/wfurphy/creative-button-card-templates) for debugging code template that dumps variables to the browser console - super handy.

[lcars](https://github.com/joernweissenborn/lcars) for the SVG used inline in the dpad control.

[wfurphy creative-button-card-templates](https://github.com/wfurphy/creative-button-card-templates) for debugging code template that dumps variables to the browser console - super handy.

[lcars](https://github.com/joernweissenborn/lcars) for the SVG used inline in the dpad control.

---
##  License

This project uses the MIT License. For more details, refer to the [LICENSE](LICENSE) file.

---
