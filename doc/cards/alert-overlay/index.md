---
description: "Alert overlay card: a full-screen alert symbol and backdrop, or a band across the screen, shown on every dashboard while an alert mode is raised."
moved_anchors:
  common-properties: /cards/alert-overlay/#card-options
  config-structure: /cards/alert-overlay/#card-options
  layers: /cards/alert-overlay/overlay#layers
  slot-option-reference: /cards/alert-overlay/overlay#layers-backdrop
  position: /cards/alert-overlay/overlay#position
  alert-band: /cards/alert-overlay/band
  warp-core-band: /cards/alert-overlay/band#band-phase
  alert-symbol: /cards/alert-overlay/symbol#alert-button
  common-alert-button-keys: /cards/alert-overlay/symbol#alert-button
  one-message-for-every-condition: /cards/alert-overlay/symbol#one-message-for-every-condition
  static-text-override: /cards/alert-overlay/symbol#one-message-for-every-condition
  entity-driven-message-via-input-text-lcards-alert-message: /cards/alert-overlay/symbol#a-message-from-a-helper
  content-cards: /cards/alert-overlay/symbol#content-cards
  conditions: /cards/alert-overlay/conditions
  per-condition-options: /cards/alert-overlay/conditions#condition-keys
  per-condition-content-and-backdrop: /cards/alert-overlay/conditions#putting-it-together
  dismiss: /cards/alert-overlay/raising#dismiss
  triggering-alert-modes: /cards/alert-overlay/raising#triggering-alert-modes
  transition-effects: /cards/alert-overlay/raising#transition-effects
  setup: /cards/alert-overlay/raising#transition-effects
  available-effects: /cards/alert-overlay/raising#transition-effects
  examples: /cards/alert-overlay/#quick-start
  minimal-built-in-defaults-for-everything: /cards/alert-overlay/#quick-start
  custom-backdrop-for-all-conditions: /cards/alert-overlay/overlay#layers
  corner-notification-non-blocking-position: /cards/alert-overlay/overlay#position
---

# Alert Overlay Card

`custom:lcards-alert-overlay`

**The alert overlay shows the alert symbol over the whole screen while an alert mode is raised, and hides it when the alert clears.** It follows the `input_select.lcards_alert_mode` helper, so one automation or button raises the alert on every dashboard that has the card.

<video class="doc-video" src="/gallery/alert.webm" poster="/img/cards/alert-overlay.webp" title="Alert overlay: red alert covers a dashboard with a blurred backdrop and the red alert symbol, then yellow alert with the yellow one" autoplay loop muted playsinline></video>

- Add one alert overlay to every dashboard that should show alerts. It takes no room on the dashboard; in edit mode it shows an info box so you can find it.
- The overlay draws in a layer over the whole page, not in its grid cell, so where you put the card doesn't change where the alert shows.
- Each condition (red, yellow, blue, black, gray) shows the symbol in its own colours by default.
- The overlay covers the whole screen, so the live examples on these pages show it as the [Alert Studio](#alert-studio) does: on a mock screen with a stand-in dashboard behind it, one condition at a time.

::: tip Try it
The card editor's **Open Alert Studio** button opens a studio with a mock screen that shows each condition as it will look, without raising an alert. See [Alert Studio](#alert-studio).
:::

| Page | Covers |
|------|--------|
| [Position and Screen Effects](./overlay) | Where the symbol sits, its size, and the blur, tint and canvas effects behind it |
| [Alert Band](./band) | `display: band`: a row of dashes across the screen that leaves the dashboard usable |
| [Symbol and Content](./symbol) | Changing the symbol's text and colours, a message from a helper, or your own card |
| [Per-Condition Settings](./conditions) | Different settings for red, yellow, blue, black and gray alert |
| [Raising and Dismissing](./raising) | The `lcards.*` actions, tap to dismiss or reset, timers, and transition effects |

---

## Prerequisites

**The card needs the `input_select.lcards_alert_mode` helper.** Create it from the LCARdS Config Panel, or by hand with the options `green_alert`, `red_alert`, `yellow_alert`, `blue_alert`, `black_alert` and `gray_alert` (see [Helpers](/configuration/persistent-helpers)).

- The optional `input_select.lcards_alert_transition_style` helper adds a screen transition whenever the alert mode changes; see [Transition effects](./raising#transition-effects). It can also be created from the Config Panel.

## Quick start

**The card works with no settings: each alert shows the LCARS alert symbol in that condition's colours, with its animation, over an 8px blur.** The symbol is sized to 60% of the screen's width and 50% of its height, so it fits wide, tall and phone screens alike.

```yaml live
# Add this to every dashboard that should react to alert modes
type: custom:lcards-alert-overlay
```

## Placement

**Put the card anywhere in the view; the end of the view keeps it out of the way.** When an alert is up, the card shows it in a layer attached to the page rather than in its card slot, so it always covers the full screen.

```yaml
views:
  - cards:
      - type: custom:lcards-button
        # ... your other cards ...
      - type: custom:lcards-alert-overlay # the last card in the view
        dismiss_mode: reset
```

## Alert Studio

**The Alert Studio is where the alert overlay is set up: the card editor's Open Alert Studio button opens it.** The card editor itself has only that button, the Docs link and the YAML tab.

- The settings are on the left (Config, Backdrop, Conditions, YAML); on the right a mock screen shows the condition picked in the toolbar above it, or on the Conditions tab.
- The mock screen is laid out at your screen's size and scaled down, so sizes in %, px, `vw` and `vh` look as they will on the dashboard. It shows the screen effect layers, the symbol (or your content card) at its position and size, or the alert band.
- Settings that don't apply are hidden: overlay position and size for a condition shown as a band, and the band settings when no condition uses one.

::: details More about the Alert Studio
- **Only a preview:** the alert mode doesn't change and nothing shows on your dashboards. Click the backdrop (overlay) or the symbol (band) to try a dismiss, and **Replay** to show it again.
- **The symbol:** on the Config tab, **Alert symbol** changes the symbol for every condition. On the Conditions tab each condition picks **Alert symbol** (as it is), **Customise the symbol** (the symbol's own button editor, saving only what you change) or **Your own card** (any card, edited in place with its own editor). See [Symbol and Content](./symbol).
- **Guides:** the info guides (How the overlay works, How the band works, How condition overrides work) explain the settings with a diagram each.
- **Saving:** Save keeps the changes; Cancel leaves the card as it was.
:::

## Limitations

**One alert overlay is active per dashboard, and the card is not a normal LCARdS card.**

- Only the first instance on the page becomes active. Any others have no visual presence, and in edit mode they show a "Duplicate · inactive" warning; remove them. The preview in the card editor is not a duplicate: it shows a plain info box.
- While the dashboard is in edit mode the overlay stays hidden. An alert raised meanwhile shows when you leave edit mode, and its auto-dismiss countdown starts then.
- The rules engine can't target the overlay: it has no card id or tags. An `lcards-*` content card inside it does support rules.
- `band.phase` locks to the built-in symbol's bar sweep. With `band.emblem: false` or a custom `content` card there is nothing to lock to, and the band runs on its own.

## Card options

**The keys set on the card apply to every condition; [`conditions`](./conditions) changes them for one.**

- The card has none of the [common card options](/cards/common): no `height` or `width` for its grid cell, `id`, `tags`, `grid_options`, actions, text fields or animations. It sits in the grid as an empty element, and its `width` and `height` size the symbol on the screen.

```yaml live
type: custom:lcards-alert-overlay
dismiss_mode: reset # a tap clears the alert everywhere
width: 50%
layers:
  backdrop:
    preset: blur
    amount: 12px
conditions:
  yellow_alert:
    display: band # a band across the screen; taps reach the dashboard
```

::: details More about the card options
- **From the card picker:** a card added from the picker starts with `dismiss_mode: dismiss`, `width: 50%`, `height: 33%`, `position: center` and an 8px blur, rather than the defaults below.
- **Older configs:** a card-level `backdrop` (`blur`, `opacity`, `color`) from older versions is still read when `layers` is not set; see [Layers](./overlay#layers).
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `type` | string | required | `custom:lcards-alert-overlay` |
| `dismiss_mode` | string | `dismiss` | What a dismiss does: `dismiss`, `reset`, `auto-dismiss` or `auto-reset`. See [Dismiss](./raising#dismiss) |
| `auto_dismiss_seconds` | number | - | Seconds before an `auto-dismiss` or `auto-reset` hides the alert, at least 1 |
| `display` | string | `overlay` | `overlay`: the symbol over a backdrop, the dashboard blocked until dismissed. `band`: see [Alert Band](./band) |
| `band` | object | - | Band settings for `display: band`; see [Alert Band](./band) |
| `position` | string | `center` | Where the symbol sits on the screen; see [Position](./overlay#position) |
| `width` | string | `60%` | Symbol width (CSS length; % is of the screen) |
| `height` | string | `50%` for the symbol, else `auto` | Symbol height (CSS length); see [Size](./overlay#size) |
| `alert_button` | object | - | Changes to the built-in symbol for every condition; see [alert_button](./symbol#alert-button) |
| `layers` | object | an 8px blur | Screen effects behind the symbol; see [Layers](./overlay#layers) |
| `conditions` | object | - | Settings for one condition; see [Per-Condition Settings](./conditions) |

> **Using LCARdS with browser_mod?** See [Using LCARdS with browser_mod](/configuration/browser-mod), including patterns for stacking browser_mod popups with LCARdS screen effects, combined targeting, and driving LCARdS effects from browser_mod JavaScript.
