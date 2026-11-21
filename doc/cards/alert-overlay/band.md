---
description: "Alert overlay band (display: band): a row of dashes in the alert colour across the screen with the alert symbol in the middle, leaving the dashboard usable."
---

# Alert Band

`display: band` shows the alert the way the Titan.DS screens do: a row of short dashes in the condition colour across the whole screen, with the alert symbol in the middle.

## band

**`display: band` shows the alert as a band across the screen instead of a backdrop, so the dashboard stays readable and usable while the alert is on.** Pair it with an alert-aware theme so the rest of the screen changes colour too.

- Clicks reach the cards under the band. Clicking the symbol (or Enter or Space on it) dismisses the band, following `dismiss_mode`.
- The symbol is the same alert button as the overlay's, so [`alert_button`](./symbol#alert-button) changes and a [content card](./symbol#content-cards) apply here too.
- Backdrop [layers](./overlay#layers) are off in band mode unless you set them.

```yaml live
type: custom:lcards-alert-overlay
display: band
dismiss_mode: reset
band:
  position: 70% # band centre at 70% of the screen height
  height: 48px
  emblem_scale: 3 # the symbol three times the band height
```

::: details More about the band
- **On screen:** `top` and `bottom` keep the symbol 16px from the edge, and a percentage is held so the symbol (or the dashes at their tallest) stays on screen.
- **Without the symbol:** with `emblem: false` there is nothing to click, so only auto-dismiss or the alert mode changing hides the band.
- **A content card** sits in a box the shape of the alert symbol (about 1.36 wide for 1 high), `emblem_scale` times the band height.
- **Colour:** the dashes take the condition's alert colour from the theme (`colors.alert.red` and so on). A `color` you set may be a theme token or a CSS variable, so it follows alert mode palette changes.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `display` | string | `overlay` | `band` to show the band |
| `band.position` | string | `center` | `top`, `center`, `bottom`, or a percentage of the screen height for the band's centre (`75%`) |
| `band.height` | string | `clamp(24px, 4vh, 64px)` | Dash height (CSS length) |
| `band.emblem` | boolean | `true` | The alert symbol (or the content card) in the middle |
| `band.emblem_scale` | number | `4` | Symbol height as a multiple of the band height, 1 to 10 |
| `band.color` | colour | the condition colour | Dash colour |

## Dashes

**The dash keys set the width, spacing and corners of the dashes.** Dashes run outward from the symbol to both screen edges, so the spacing sets how many there are.

```yaml live
type: custom:lcards-alert-overlay
display: band
band:
  dash_width: 12
  dash_gap: 8
  dash_radius: pill # rounded ends
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `band.dash_width` | number | `8` | Dash width in px, at least 1 |
| `band.dash_gap` | number | `12` | Space between dashes in px |
| `band.dash_radius` | number or `pill` | `0` | Corner radius in px, at most half the dash width or height; `pill` rounds the ends fully |

## Animation

**The band's animation runs a flash along the dashes, or pulses them all together, and can swell them as it passes.** The device's reduced motion setting turns it off.

- `sweep` runs a flash outward from the symbol (or inward from the screen edges with `direction: inward`); `flash` pulses every dash together; `none` keeps the band still.
- `speed` also sets the symbol's bar sweep, so the two keep step, unless `alert_button.speed` sets the symbol's own speed.

```yaml live
type: custom:lcards-alert-overlay
display: band
band:
  animation: sweep
  direction: inward
  speed: 1.5 # 1.5 times as fast, the symbol's bars too
  grow: 1.6 # dashes swell as the sweep passes
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `band.animation` | string | `sweep` | `sweep`, `flash` or `none` |
| `band.direction` | string | `outward` | Sweep direction: `outward` from the symbol, or `inward` from the screen edges |
| `band.speed` | number | `1` | Speed multiplier, 0.25 to 4 (`2` is twice as fast, `0.5` half speed) |
| `band.grow` | number | `1` | Peak dash height as a multiple of the band height, 1 to 4: the dashes swell as the sweep passes, or all together with `flash`. `1` is no growth |

## band.phase

**`phase` locks the band's animation to the symbol's bar sweep, so the two read as one movement.** The symbol's bars light from the outside in, reaching the middle at 150 degrees; at `180` an outward sweep starts as the symbol's finishes, so it runs from the core out to the edges like a warp core.

- It needs the built-in symbol and the same speed for both: leave `alert_button.speed` unset. With `emblem: false` or a custom `content` card there is nothing to lock to, and the band runs on its own.

```yaml live
# A warp-core band across the lower third; red alert takes the whole screen instead
type: custom:lcards-alert-overlay
display: band
dismiss_mode: reset
band:
  position: 70%
  dash_radius: pill
  grow: 1.6
  phase: 180
  speed: 0.75
conditions:
  red_alert:
    display: overlay
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `band.phase` | number | - | Degrees after the symbol's bar sweep, 0 to 360. Unset: not locked. No effect with `animation: none` |

## Per-condition band

**`display` and `band` can be set per condition, so one alert takes the whole screen while the others show a band.** A condition's `band` is merged over the card's, key by key.

```yaml live
type: custom:lcards-alert-overlay
display: band
conditions:
  red_alert:
    display: overlay # red alert still takes over the screen
  yellow_alert:
    band:
      animation: flash
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `conditions.<key>.display` | string | the card's `display` | `overlay` or `band` for this condition |
| `conditions.<key>.band` | object | the card's `band` | Band keys for this condition, over the card's |
