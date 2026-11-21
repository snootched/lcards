---
description: "The LCARdS connection overlay: a full-screen screen shown when a browser loses its connection to Home Assistant, as styled text, any card or the Borg assimilation, over effect layers you choose, set for everyone, one user or one device."
moved_anchors:
  messages: /configuration/connectivity#screen-overlay
  reload-controls: /configuration/connectivity#broadcast-buttons
---

# Connection Overlay

**The connection overlay covers the screen when a browser loses its connection to Home Assistant, and takes itself away when the connection is back.** On a wall tablet or kiosk you see at once that the dashboard is offline, instead of a screen quietly going stale.

- It is set up in the **Connectivity** tab of **LCARdS Config**, and is off until you turn it on.
- It can show styled text, any card, or the [Borg assimilation](/core/borg), over animated effect layers.
- Settings can be the same everywhere, or differ for one user or one device.

::: tip Try it
**Simulate Disconnect** at the bottom of the tab shows the overlay with your current settings, saved or not, while the dashboard keeps running.
:::

---

## How it works

**LCARdS watches each browser's connection to Home Assistant and shows the overlay when it drops.**

- After a drop it waits for the [disconnect tolerance](#general) (2.5 seconds by default) before showing the overlay, so short blips during a restart or a network handover pass unseen.
- When the connection is back, and has held for a second, the overlay goes. A short **Connection Restored** message can show first.
- The overlay covers everything on the page, Home Assistant's own sidebar and header included. It does not wait for the alert mode: during an alert it shows over the alert overlay, and its effect layers take the place of the alert's.

---

## Setting up

**Open LCARdS Config > Connectivity, change the settings, and click Save.**

- Nothing is live until you save. A banner says when there are unsaved changes; **Discard changes** goes back to the stored values.
- Pick the [scope](#scope-and-per-device-overrides) first (Global, User or Device): **Save** writes to that one.

---

## General

**Turns the overlay on, lets people close it, and sets how long a drop must last before it shows.**

| Setting | Default | Description |
|---------|---------|-------------|
| **Enable connection overlay** | off | Show the overlay when the connection to Home Assistant is lost |
| **Allow user to dismiss** | on | A click on the overlay's backdrop closes it. It comes back at the next disconnect |
| **Disconnect tolerance (ms)** | `2500` | How long to wait after a drop before showing the overlay, `0` to `30000`. `0` shows it at once; 2000 to 5000 suits phones and shaky connections |

---

## Screen Overlay

**What the overlay shows when the connection is lost, and when it comes back.** The section is collapsed at first.

### Display style

**Display style picks one of three kinds of overlay.**

- **Simple text:** styled text over the effect layers. See [Simple text mode](#simple-text-mode).
- **Custom card (YAML):** any Home Assistant card, centred or placed where you like. See [Custom card mode](#custom-card-mode).
- **Resistance is Futile:** the Borg assimilation runs instead of an overlay. See [Borg mode](#borg-mode).

### Simple text mode

**Styled text, with its own font, size and colour, for the lost and the restored message.**

#### Connection Lost

| Setting | Default | Description |
|---------|---------|-------------|
| **Message text** | `Connection Lost` | The text shown while disconnected |
| **Text colour** | `var(--error-color)` | Any CSS colour, CSS variable or theme token |
| **Font** | `Antonio` | Pick from the font list, or type a font name |
| **Size** | `42` px | Font size, `1` to `200` px |
| **Weight** | `400` | CSS font weight: `400`, `700`, `bold`, `lighter` ... |
| **Transform** | UPPERCASE | **UPPERCASE**, **Title Case** or **None** |

#### Connection Restored

**A short message when the connection is back, which goes by itself.**

| Setting | Default | Description |
|---------|---------|-------------|
| **Show reconnect message** | on | Show the message on reconnect. Off: the overlay just goes |
| **Message text** | `Connection Established` | The text shown on reconnect |
| **Text colour** | `var(--primary-color)` | Any CSS colour, CSS variable or theme token |
| **Font**, **Size**, **Weight**, **Transform** | as for Connection Lost | Set separately from the lost message |
| **Auto-dismiss after (seconds)** | `3` | How long the message stays, `1` to `30` seconds |

The restored message shows only when the overlay itself was shown: a drop shorter than the tolerance shows neither.

### Custom card mode

**Any Home Assistant card as the disconnect screen: an LCARdS button, a picture, a markdown card, a whole stack.** Paste its YAML into the editor; it shows over the effect layers.

- Grids and stacks may need a width and height: CSS units such as `400px`, `30vw` or `auto`.

```yaml live
# A card to paste into Connection Lost Card
type: custom:lcards-button
preset: lozenge
text:
  name:
    content: NO SIGNAL
    show: true
style:
  card:
    color:
      background: var(--lcars-alert-red)
```

#### Connection Lost Card

| Setting | Default | Description |
|---------|---------|-------------|
| **YAML editor** | empty | The card's YAML, as in a dashboard |
| **Position** | centre | Where the card sits: one of nine places, from top left to bottom right |
| **Width** | `auto` | CSS width: `400px`, `40vw`, `auto` |
| **Height** | `auto` | CSS height: `300px`, `30vh`, `auto` |

#### Connection Restored Card

| Setting | Default | Description |
|---------|---------|-------------|
| **YAML editor** | empty | A card shown on reconnect. Empty: the text reconnect message shows instead |
| **Show reconnect message** | on | Show the card (or text) on reconnect |
| **Auto-dismiss after (seconds)** | `3` | How long it stays, `1` to `30` seconds |

### Borg mode

**Resistance is Futile: on disconnect the [Borg assimilation](/core/borg) runs instead of an overlay, and reverses when the connection is back.** The dashboard turns Borg green, its font changes, and the assimilation intro plays over it.

- The assimilation starts once the [disconnect tolerance](#general) has passed, as the overlay does, so a short blip shows nothing. A click ends the intro; the Borg colours and effects stay until the connection returns, when the normal deassimilation plays.
- Messages, cards and the Effect Layers section are not used. Instead the mode has its own **Canvas Effect** (always the Borg intro, with its settings), **Backdrop Filter**, **Colour Tint**, **Palette Hue** and **Font Swap**.
- **Simulate Disconnect** runs the assimilation with these settings; **Simulate Reconnect** or **Clear Test** reverses it.

| Setting | Default | Description |
|---------|---------|-------------|
| **Canvas Effect** | the Borg intro: 8 sites, 5 tendrils each, 600 px, 2 particles | The intro's settings: renderer, injection sites, tendrils, particles, colours, cube, signal corruption and overrun. See [intro.canvas](/core/borg#intro-canvas) |
| **Backdrop Filter** | `saturate` `200%` | A filter on the dashboard during the intro, or **None (disabled)** |
| **Colour Tint** | `color-tint`, a dark green | A colour over the dashboard during the intro, or **None (disabled)** |
| **Palette hue (degrees)** | `110` | The hue the dashboard colours turn toward, `0` to `359`: `0` red, `60` yellow, `110` Borg green, `180` cyan, `240` blue, `300` magenta |
| **Enable Borg font replacement** | on | Off: the dashboard keeps its font; everything else still runs |

---

## Effect Layers

**Three full-screen effect layers behind the message, each set on its own: an animated canvas, a colour overlay and a backdrop filter.** The section is collapsed at first, and is hidden in Borg mode.

| Layer | What it does | Default |
|-------|--------------|---------|
| **Canvas Effect** | An animation drawn over the page: static, pixelate, glitch, scanlines | `static` at 0.55 opacity |
| **Colour Overlay** | A colour over the page | `color-tint` with `rgba(0,0,0,0.55)` |
| **Backdrop Filter** | A CSS filter on everything behind it: blur, saturate, grayscale and more | **None (disabled)** |

### Configuring a slot

**Pick an Effect Preset for a layer; its settings appear under it.** The list holds the built-in [screen effects](/core/effects/screen-effects) and any a content pack adds. **None (disabled)** turns the layer off.

| Preset | Layer | Settings |
|--------|-------|----------|
| `static` | Canvas | Opacity, Grain Scale, Tint Color, Tint Strength |
| `pixelate` | Canvas | Pixel Size, Opacity, Light Variance, Base Lightness, Tint Color, Tint Strength |
| `glitch` | Canvas | Intensity, Max Shift, Band Height, Opacity, FPS |
| `scanlines` | Canvas | Line Height, Opacity, Scroll Speed |
| `color-tint` | Colour | Tint Color (any CSS colour; use `rgba()` for transparency) |
| `vignette` | Colour | Opacity |
| `blur` | Backdrop | Blur Amount (`8px`) |
| `saturate` | Backdrop | Amount (`200%`) |
| `grayscale` | Backdrop | Amount (`100%`) |
| `contrast` | Backdrop | Amount (`200%`) |
| `hue-rotate` | Backdrop | Angle (`180deg`) |

Mix them freely: a `grayscale` backdrop with a `color-tint` overlay and no canvas gives a washed-out, tinted page with no animation.

---

## Test Controls

**Preview the overlay with your current settings, saved or not.** The dashboard keeps running behind it; nothing is actually disconnected.

- **Simulate Disconnect** shows the overlay (and is greyed out while it shows).
- **Simulate Reconnect** plays what happens when the connection comes back, the restored message included.
- **Clear Test** removes it.

::: tip Workflow
Change a setting, click **Simulate Disconnect**, look, adjust, repeat. When it looks right, click **Save**.
:::

---

## Scope and per-device overrides

**Settings can be the same for everyone, or differ for one user or one browser.** A browser uses its device's setting first, then its user's, then the global one, then the built-in default.

```
Device  →  User  →  Global
```

| Scope | Who it applies to |
|-------|-------------------|
| **Global** | Every user and device |
| **User** | Your Home Assistant user, on any device |
| **Device** | This browser, whoever is logged in |

- Pick the scope with the switch at the top of the tab. Each setting shows a badge for where its value comes from; the clear button next to it removes the override at this scope.
- **Save (scope)** writes only the settings you changed, so the others keep coming from the scopes below.
- **Reset (scope)** removes every override stored at that scope, after a confirmation.

### Admin: editing another device or user

**Administrators can pick another user or device in the scope switch and save settings for it.** The browser it belongs to picks them up within seconds, with no reload.

- If you have the tab open on a device whose settings another administrator changes, and you have no unsaved edits, the tab refreshes itself.
- With unsaved edits, a banner says **Settings were updated from another device** with **Discard edits & refresh**; your edits stay until you choose.

### Broadcast buttons

**Two administrator buttons at the bottom act on every connected browser.**

| Button | Effect |
|--------|--------|
| **Push Live Config** | Every connected browser reads its overlay settings again, with no page reload. Use it for a device that was offline when you saved |
| **Reload All Clients** | Every connected browser reloads its page. A last resort |

---

## Upgrading: existing stored settings

**Settings saved before field-by-field saving existed may hold every field at one scope.** That is harmless: the values are right and the scopes still apply in order.

To keep only the overrides you meant at device scope:

1. Open **Connectivity**, pick the **Device** scope for that device and note which settings should differ from the user or global ones.
2. Click **Reset device** to remove all its device overrides.
3. Change and save only the settings you want to pin to the device.

Afterwards only those settings show a **device** badge.

---

## Related

- [Configuration overview](./index.md): all Config Panel tabs
- [Users & Devices](./users-devices): manage stored per-device and per-user settings
- [Screen Effects](/core/effects/screen-effects): the effect presets and their settings
- [Borg Assimilation](/core/borg): what the Borg mode plays
- [Connection Overlay Service](../architecture/subsystems/connection-overlay): developer reference
