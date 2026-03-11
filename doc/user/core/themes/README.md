# Themes

To complement the HA-LCARS system theme - LCARdS adds a token-based theme system for its cards. Instead of hardcoding colours and other default settings, we can reference named tokens that the active theme resolves at runtime.  Currently the `lcards-default` theme is loaded at startup, but in the future  new theme packs can be added to easily change the look of all the cards.

---

## Built-in Themes

| Theme | Description |
|-------|-------------|
| `lcars-default` | Standard LCARS look |

Themes are provided by content packs. See the [Config Panel](../../config-panel.md) Pack Explorer to view all the tokens that theme provices.

---

## Using Theme Tokens

Reference a token in card configs, such as a colour or size field using  `{theme:token.path}`:

```yaml
style:
  border:
    color: "{theme:colors.ui.primary}"
  card:
    color:
      background: "{theme:color.ui.active}"
```

---

## Token Namespaces

Tokens are organized into namespaces. Browse all available tokens in the [Config Panel](../../config-panel.md) Theme Browser tab.

### Example: `color.ui.*`

Semantic colours that map to UI roles.  In the default theme, prefer HA-LCARS theme colours but provide LCARdS fallbacks:

| Token | `lcards-default` value |
|-------|---------|
| `color.ui.primary` | `var(--lcars-ui-primary, var(--lcards-gray-medium))` |
| `color.ui.secondary` | `var(--lcars-ui-secondary, var(--lcards-gray-medium-light))` |
| `color.ui.tertiary` | `var(--lcars-ui-tertiary, var(--lcards-orange-medium-dark))` |
| `color.ui.quaternary` | `var(--lcars-ui-quaternary, var(--lcards-gray-dark))` |

---

## LCARdS CSS Color Palette

LCARdS injects a complete set of `--lcards-<color>-<shade>` CSS variables at startup.
These colours can be used anywhere and do not need to be in your HA-LCARS theme file.

> **Note:** Colors shown are the **green_alert (normal) mode** baseline values.
> When an alert mode is active (e.g. `red_alert`, `blue_alert`), all variables are
> HSL-transformed automatically — you never need to change your references.

---

### 🟠 Orange

| Swatch | CSS Variable | Hex | Notes |
|---|---|---|---|
| ![](https://placehold.co/20x20/d91604/d91604.png) | `--lcards-orange-darkest` | `#d91604` | |
| ![](https://placehold.co/20x20/ef1d10/ef1d10.png) | `--lcards-orange-dark` | `#ef1d10` | |
| ![](https://placehold.co/20x20/e7442a/e7442a.png) | `--lcards-orange-medium-dark` | `#e7442a` | |
| ![](https://placehold.co/20x20/ff6753/ff6753.png) | `--lcards-orange` | `#ff6753` | Base orange |
| ![](https://placehold.co/20x20/ff6753/ff6753.png) | `--lcards-orange-medium` | `#ff6753` | Alias for `--lcards-orange` |
| ![](https://placehold.co/20x20/ff8470/ff8470.png) | `--lcards-orange-medium-light` | `#ff8470` | |
| ![](https://placehold.co/20x20/ff977b/ff977b.png) | `--lcards-orange-light` | `#ff977b` | |
| ![](https://placehold.co/20x20/ffb399/ffb399.png) | `--lcards-orange-lightest` | `#ffb399` | |

---

### ⚫ Gray

| Swatch | CSS Variable | Hex | Notes |
|---|---|---|---|
| ![](https://placehold.co/20x20/1e2229/1e2229.png) | `--lcards-gray-darkest` | `#1e2229` | |
| ![](https://placehold.co/20x20/2f3749/2f3749.png) | `--lcards-gray-dark` | `#2f3749` | |
| ![](https://placehold.co/20x20/52596e/52596e.png) | `--lcards-gray-medium-dark` | `#52596e` | |
| ![](https://placehold.co/20x20/6d748c/6d748c.png) | `--lcards-gray` | `#6d748c` | Base gray |
| ![](https://placehold.co/20x20/6d748c/6d748c.png) | `--lcards-gray-medium` | `#6d748c` | Alias for `--lcards-gray` |
| ![](https://placehold.co/20x20/9ea5ba/9ea5ba.png) | `--lcards-gray-medium-light` | `#9ea5ba` | |
| ![](https://placehold.co/20x20/d2d5df/d2d5df.png) | `--lcards-gray-light` | `#d2d5df` | |
| ![](https://placehold.co/20x20/f3f4f7/f3f4f7.png) | `--lcards-gray-lightest` | `#f3f4f7` | |
| ![](https://placehold.co/20x20/dfe1e8/dfe1e8.png) | `--lcards-moonlight` | `#dfe1e8` | Near-white; used for text/labels |

---

### 🔵 Blue

| Swatch | CSS Variable | Hex | Notes |
|---|---|---|---|
| ![](https://placehold.co/20x20/002241/002241.png) | `--lcards-blue-darkest` | `#002241` | |
| ![](https://placehold.co/20x20/1c3c55/1c3c55.png) | `--lcards-blue-dark` | `#1c3c55` | |
| ![](https://placehold.co/20x20/2a7193/2a7193.png) | `--lcards-blue-medium-dark` | `#2a7193` | |
| ![](https://placehold.co/20x20/37a6d1/37a6d1.png) | `--lcards-blue` | `#37a6d1` | Base blue |
| ![](https://placehold.co/20x20/37a6d1/37a6d1.png) | `--lcards-blue-medium` | `#37a6d1` | Alias for `--lcards-blue` |
| ![](https://placehold.co/20x20/67caf0/67caf0.png) | `--lcards-blue-medium-light` | `#67caf0` | |
| ![](https://placehold.co/20x20/93e1ff/93e1ff.png) | `--lcards-blue-light` | `#93e1ff` | |
| ![](https://placehold.co/20x20/00eeee/00eeee.png) | `--lcards-blue-lightest` | `#00eeee` | Cyan-teal |

---

### 🟢 Green

| Swatch | CSS Variable | Hex | Notes |
|---|---|---|---|
| ![](https://placehold.co/20x20/0c2a15/0c2a15.png) | `--lcards-green-darkest` | `#0c2a15` | |
| ![](https://placehold.co/20x20/083717/083717.png) | `--lcards-green-dark` | `#083717` | |
| ![](https://placehold.co/20x20/095320/095320.png) | `--lcards-green-medium-dark` | `#095320` | |
| ![](https://placehold.co/20x20/266239/266239.png) | `--lcards-green` | `#266239` | Base green |
| ![](https://placehold.co/20x20/266239/266239.png) | `--lcards-green-medium` | `#266239` | Alias for `--lcards-green` |
| ![](https://placehold.co/20x20/458359/458359.png) | `--lcards-green-medium-light` | `#458359` | |
| ![](https://placehold.co/20x20/80bb93/80bb93.png) | `--lcards-green-light` | `#80bb93` | |
| ![](https://placehold.co/20x20/b8e0c1/b8e0c1.png) | `--lcards-green-lightest` | `#b8e0c1` | |

---

### 🟡 Yellow

| Swatch | CSS Variable | Hex | Notes |
|---|---|---|---|
| ![](https://placehold.co/20x20/70602c/70602c.png) | `--lcards-yellow-darkest` | `#70602c` | |
| ![](https://placehold.co/20x20/ac943b/ac943b.png) | `--lcards-yellow-dark` | `#ac943b` | |
| ![](https://placehold.co/20x20/d2bf50/d2bf50.png) | `--lcards-yellow-medium-dark` | `#d2bf50` | |
| ![](https://placehold.co/20x20/f9ef97/f9ef97.png) | `--lcards-yellow` | `#f9ef97` | Base yellow |
| ![](https://placehold.co/20x20/f9ef97/f9ef97.png) | `--lcards-yellow-medium` | `#f9ef97` | Alias for `--lcards-yellow` |
| ![](https://placehold.co/20x20/fffac9/fffac9.png) | `--lcards-yellow-medium-light` | `#fffac9` | |
| ![](https://placehold.co/20x20/e7e6de/e7e6de.png) | `--lcards-yellow-light` | `#e7e6de` | |
| ![](https://placehold.co/20x20/f5f5dc/f5f5dc.png) | `--lcards-yellow-lightest` | `#f5f5dc` | Warm white / cream |

---

### Shade Scale

Each color family (except gray/moonlight) follows the same 8-step scale:

| Shade | Description |
|---|---|
| `-darkest` | Deepest / near-black tone |
| `-dark` | Dark variant |
| `-medium-dark` | Between dark and mid |
| *(base / `-medium`)* | Core reference color — both `--lcards-<color>` and `--lcards-<color>-medium` resolve to the same value |
| `-medium-light` | Between mid and light |
| `-light` | Light variant |
| `-lightest` | Palest / near-white tone |

> Gray also includes `--lcards-moonlight` — a near-white warm gray used for text, labels, and chart axes.

---

### Usage

```css
/* Direct reference */
color: var(--lcards-blue-light);

/* Prefer HA-LCARS theme variable, fall back to lcards palette */
color: var(--lcars-orange, var(--lcards-orange-medium));

/* With hex fallback */
color: var(--lcards-orange-medium, #ff6753);
```
---

## HA-LCARS Theme Integration

If you use the [HA-LCARS theme](https://github.com/th3jesta/ha-lcars), elbow card dimensions can be bound to the HA-LCARS `input_number` helpers:

```yaml
type: custom:lcards-elbow
elbow:
  type: header-left
  segment:
    bar_width: theme    # Reads input_number.lcars_vertical
    bar_height: theme   # Reads input_number.lcars_horizontal
```

This lets you resize all elbows on your dashboard by changing a single helper value.

---

## Related

- [Config Panel — Theme Browser](../../config-panel.md)
- [Templates](../templates/README.md)
