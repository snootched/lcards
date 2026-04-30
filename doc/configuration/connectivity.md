# Connection Overlay

> **Full-screen overlay shown whenever Home Assistant loses its WebSocket connection**

LCARdS can display a full-screen overlay when your browser loses its connection to Home Assistant. This is particularly useful for kiosk displays — instead of silently going stale the dashboard makes it immediately clear that it is offline, and snaps back to normal once the connection is restored.

The feature is configured from the **Connectivity** tab in the [LCARdS Config Panel](./index.md).

---

## How it works

LCARdS monitors the HA WebSocket connection inside the browser. When the connection drops it shows the overlay immediately — no polling delay. When the connection comes back the overlay is removed (optionally showing a brief confirmation banner first).

The overlay sits on top of the entire dashboard at the highest z-index so it is never obscured by HA's own UI.

::: tip Alert mode co-existence
The connection overlay is automatically **suppressed** while any alert mode other than the baseline (`green_alert`) is active. Alert mode already implies a deliberate full-screen takeover, so the two overlays never compete.
:::

---

## Setting up

Open **Config Panel → Connectivity**.

Changes made in the panel are **not live until you click Save**. Use the **Test Controls** section at the bottom to preview how the overlay looks with your current settings at any time — no save required.

---

## General

| Setting | Default | Description |
|---------|---------|-------------|
| **Enable connection overlay** | On | Master switch. When off, no overlay is shown on disconnect. |
| **Allow user to dismiss** | On | Let the user click the overlay backdrop to close it manually. Useful if you want a "confirm you know it's offline" interaction rather than a pure indicator. |

---

## Messages

The **Messages** section (collapsed by default) controls what is shown on screen when the connection is lost and when it is restored.

### Display style

Choose between two modes:

**Simple text** — LCARdS renders styled text directly on top of the effect layers. No card required. Use the typography controls below to set the message content, colour, font, size, weight, and casing.

**Custom card (YAML)** — Provide any valid HA card YAML. LCARdS renders the card centred in the overlay, letting you use your own button cards, custom components, or LCARdS cards as the disconnect screen. You control position, width, and height.

---

### Simple text mode

#### Connection Lost

| Field | Default | Description |
|-------|---------|-------------|
| **Message text** | `Connection Lost` | The string displayed while disconnected. |
| **Text colour** | `#93e1ff` | Any CSS colour value or LCARdS theme token. |
| **Font** | `Antonio` | Font family — choose from the font selector or type any web-safe font name. |
| **Size** | `26 px` | Font size in pixels. |
| **Weight** | `400` | CSS font-weight — e.g. `400`, `700`, `bold`. |
| **Transform** | `UPPERCASE` | `UPPERCASE`, `Title Case`, or `None`. |

#### Connection Restored

An optional confirmation banner shown briefly after the connection returns.

| Field | Default | Description |
|-------|---------|-------------|
| **Show reconnect message** | Off | Enable the banner. When off, the overlay simply disappears on reconnect. |
| **Message text** | `Connection Restored` | Confirmation string. |
| **Text colour** | `#4caf50` | Defaults to a calm green. |
| **Font / Size / Weight / Transform** | Same as disconnect message | Independent per-field controls. |
| **Auto-dismiss after** | `3 s` | How long the reconnect banner stays visible (1–30 s). |

---

### Custom card mode

#### Connection Lost Card

Paste any valid HA card YAML into the editor. The card is rendered on top of the effect layers.

| Field | Default | Description |
|-------|---------|-------------|
| **YAML editor** | *(empty)* | Card config in YAML — same format as Lovelace card config. |
| **Position** | `center` | Where to anchor the card within the overlay (`top-left`, `center`, `bottom-right`, etc.). |
| **Width** | `auto` | CSS width — e.g. `400px`, `40vw`, `auto`. |
| **Height** | `auto` | CSS height — e.g. `300px`, `30vh`, `auto`. |

**Example — minimal LCARdS button card:**
```yaml
type: custom:lcards-button
style:
  primary_color: "theme:colors.ui.primary"
text_fields:
  - text: "NO SIGNAL"
    zone: body
```

#### Connection Restored Card

Paste optional card YAML to show when the connection comes back. Leave empty to fall back to the simple text reconnect message (if enabled) or no banner at all.

| Field | Default | Description |
|-------|---------|-------------|
| **YAML editor** | *(empty)* | Card config shown on reconnect. |
| **Show reconnect message** | Off | Enable the card/banner. |
| **Auto-dismiss after** | `3 s` | How long the reconnect card stays visible. |

---

## Effect Layers

The **Effect Layers** section (collapsed by default) controls the full-screen visual effects composited behind the message.

LCARdS uses three independent layer slots that stack from back to front:

| Slot | What it does | Default |
|------|-------------|---------|
| **Canvas Effect** | Animated pixel art drawn on a `<canvas>` — static noise, glitch, scanlines, pixelate | `static` at 45 % opacity |
| **Colour Overlay** | Solid or gradient colour div over the canvas | `color-tint` at `rgba(0,0,0,0.55)` |
| **Backdrop Filter** | CSS `backdrop-filter` applied to everything below — blur, saturate, grayscale, etc. | None |

### Configuring a slot

For each slot, choose a **preset** from the dropdown. Available presets are pulled from the registered SEM catalog (built-in presets plus any registered by installed content packs).

Once you pick a preset, additional parameter fields appear for that preset's adjustable options:

| Preset | Slot | Key parameters |
|--------|------|----------------|
| `static` | Canvas | Opacity, Grain Scale |
| `pixelate` | Canvas | Pixel Size, Opacity, Light Variance, Base Lightness |
| `glitch` | Canvas | Intensity, Max Shift, Band Height, Opacity, FPS |
| `scanlines` | Canvas | Line Height, Opacity, Scroll Speed |
| `color-tint` | Colour | Tint Color (any CSS colour / rgba) |
| `vignette` | Colour | Opacity |
| `blur` | Backdrop | Blur Amount (e.g. `8px`) |
| `saturate` | Backdrop | Amount (e.g. `200%`) |
| `grayscale` | Backdrop | Amount (e.g. `100%`) |
| `contrast` | Backdrop | Amount (e.g. `150%`) |
| `hue-rotate` | Backdrop | Angle (e.g. `180deg`) |

Set a slot to **None (disabled)** to turn it off entirely. You can mix and match freely — for example, `grayscale` backdrop + `color-tint` colour overlay gives a desaturated-with-tint look without any canvas animation.

---

## Test Controls

Use **Simulate Disconnect** to trigger the overlay immediately with your current unsaved settings. The dashboard continues to run normally behind it — HA is not actually disconnected.

Click **Clear Test** to dismiss it. The test state is indicated by the button states — **Simulate Disconnect** disables while the test is active.

::: tip Workflow tip
Adjust a setting → click **Simulate Disconnect** → evaluate → adjust → repeat. When happy, click **Save**.
:::

---

## Scope and per-device overrides

The **Connectivity** tab uses the same three-level scope waterfall as the [Sounds](./sounds.md) tab:

```
Device  →  User  →  Global
```

Use the **scope selector** at the top of the tab to choose which level you are configuring:

| Scope | Who it applies to |
|-------|------------------|
| **Global** | Every user and device (the installation-wide default) |
| **User** | Your HA user account, on any device |
| **Device** | This specific browser, regardless of which HA user is logged in |

Each field shows a small badge indicating where its current value comes from. If a field has an override at the selected scope, a **×** button lets you clear that override and fall back to the level below.

The **Save** button writes all current settings to the selected scope. The **Clear** button removes all overrides stored at that scope for the connection overlay — the resolved value then falls through to the next level.

---

## Related

- [Configuration overview](./index.md) — all Config Panel tabs
- [Users & Devices](./users-devices.md) — manage stored per-device and per-user overrides
- [Screen Effect System](../architecture/subsystems/screen-effects.md) — developer reference for effect presets and the SEM layer
- [Connection Overlay Service](../architecture/subsystems/connection-overlay.md) — architecture reference
