# Colours

LCARdS accepts several colour formats wherever a colour value is expected. You can use static values (hex, CSS variables, theme tokens), state-based maps that change automatically with entity state, or full template expressions for dynamic logic. This page covers all three.

---

## Colour Value Formats

:::tip Alert system interaction
CSS colour vars (`--lcars-*` and `--lcards-*`) are automatically shifted by the Alert system when an alert mode is active. Hard-coded hex values remain static — useful when you don't want a specific colour to respond to alerts. Use `base()` to reference a token or CSS variable but always receive its pre-alert baseline value — see [Computed Colour Tokens](#computed-colour-tokens) below.
:::

| Format | Example | Notes |
|--------|---------|-------|
| CSS variable | `var(--lcards-orange)` | Any `--lcards-*` or HA CSS variable |
| Theme token path | `theme:colors.ui.primary` | Resolved from active theme |
| Computed token | `darken(var(--lcards-orange), 0.2)` | Computed by ThemeTokenResolver |
| Hex 6-digit | `#FF9900` | Standard RGB hex |
| Hex 8-digit | `#FF990080` | Last two digits are alpha (00–FF) |
| RGB | `rgb(255, 153, 0)` | Standard CSS rgb() |
| RGBA | `rgba(255, 153, 0, 0.5)` | CSS rgba() with 0–1 alpha |

### CSS Variables

The `--lcards-*` variables are defined by the active theme pack. Common ones:

```yaml alternatives
var(--lcards-orange)
var(--lcards-orange-medium)
var(--lcards-blue)
var(--lcards-blue-light)
var(--lcards-moonlight)        # Near-white; default text and label colour
var(--lcards-gray)             # Standby / inactive state colour
var(--lcards-alert-red)
var(--lcards-alert-yellow)
```

See [LCARdS CSS Colour Palette](themes/#lcards-css-colour-palette) for the full palette reference.

### Theme Token Paths

Use `theme:path.to.token` to reference a value from the active theme's token tree:

```yaml alternatives
color: "theme:colors.text.onDark"
color: "theme:colors.ui.primary"
color: "theme:colors.ui.secondary"
color: "theme:colors.alert.red"
```

See [Themes](themes/) for available token paths.

### Computed Colour Tokens

The ThemeTokenResolver supports derived colours:

```yaml alternatives
color: "darken(var(--lcards-orange), 0.2)"    # Darken by 20%
color: "lighten(var(--lcards-blue), 0.15)"    # Lighten by 15%
color: "alpha(var(--lcards-orange), 0.6)"     # Set opacity to 60%
```

#### `base()` — Alert-Mode-Immune Colours

Use `base()` when you want a token or CSS variable to **always resolve to its green-alert (unmutated) baseline value**, regardless of the active alert mode.

```yaml alternatives
# Always shows the original blue, even during red_alert
color: "base(--lcards-blue-lightest)"
```

`base()` looks up the green-alert snapshot captured at theme load time for `--lcars-*` variables, and uses the `GREEN_ALERT_PALETTE` for `--lcards-*` variables. If the snapshot has not been captured yet it falls back to the live DOM value.

:::info
`base()` only protects values going through `ThemeTokenResolver` (style fields, token config values). Animation params that are bare `var()` strings (e.g. `lead_color` / `trail_color` in stagger-flash) read the live CSS variable directly — use a hard-coded hex for those if alert-mode immunity is required.
:::

---

## State-Based Colour Maps

Instead of a single colour string, you can supply an object whose keys are entity states. LCARdS resolves the matching colour from the entity bound to the card — including exact states, numeric ranges, and classified states like `active`/`inactive`.

```yaml
style:
  border:
    color:
      default: "var(--lcards-gray)"
      active: "var(--lcards-orange)"
      inactive: "var(--lcards-gray)"
      unavailable: "var(--lcards-alert-red)"
      heat: "var(--lcards-alert-red)"       # Custom state — exact match
      cool: "var(--lcards-blue)"            # Custom state — exact match
```

### State Keys

| Key | Description |
|-----|-------------|
| `default` | Fallback for any unmatched state, or cards without an entity |
| `active` | Entity is in an on/running/locked state — [see full list](#active-inactive-state-lists) |
| `inactive` | Entity is off/idle/unlocked — [see full list](#active-inactive-state-lists) |
| `unavailable` | `unavailable` · `unknown` |
| `zero` | Entity state parses to exactly `0` — checked before range conditions |
| `non_zero` | Entity state is any non-zero number — catch-all used only when no range condition matched |
| `above:N` | Numeric state > `N` — e.g. `above:50` |
| `below:N` | Numeric state < `N` — e.g. `below:20` |
| `between:N:M` | Numeric state `N ≤ value ≤ M` — e.g. `between:20:80` |
| Any custom string | Exact match against entity state — e.g. `heat`, `cooling`, `buffering` |

:::details Active / inactive state lists
**`active`** matches: `on` · `open` · `playing` · `home` · `heat` · `cool` · `auto` · `fan_only` · `dry` · `locked` · `armed_home` · `armed_away` · `armed_night` · `armed_vacation` · `armed_custom_bypass` · `cleaning` · `mowing` · `docked` · `returning` · `paused` · `active` · `above_horizon`

**`inactive`** matches: `off` · `closed` · `away` · `idle` · `stopped` · `standby` · `unlocked` · `disarmed` · `inactive` — and any state not in the `active` or `unavailable` lists
:::

### Resolution Order

For each colour field, the resolved value is determined in this order:

0. **`state_attribute` match** — if [`state_attribute`](#exact-match-keys-from-an-attribute--state_attribute) is set, `String(entity.attributes[state_attribute])` is looked up first; a matching key wins immediately
1. **Exact state match** — e.g. the entity state is `"heat"` and a `heat:` key exists
2. **`zero`** — numeric value is exactly `0` and a `zero:` key exists
3. **Range conditions** (`above:N`, `below:N`, `between:N:M`) — all matching ranges are evaluated and the most specific one wins:
   - `between` — narrowest range (smallest `M − N`) wins
   - `above` — highest threshold wins
   - `below` — lowest threshold wins
4. **`non_zero`** — numeric value is non-zero and no range matched
5. **Classified state** — `active`, `inactive`, or `unavailable` per the table above
6. **`default`** — final fallback

:::tip Attribute-driven lookups
Steps 2–4 compare against `parseFloat(entity.state)` by default — fine for numeric sensors. For non-numeric entities (lights, covers, climate), use `ranges_attribute` to compare range conditions against an attribute value, or `state_attribute` to drive exact-key matching from an attribute. See the sections below.
:::

---

## Where Colour Maps Are Valid

State-based colour objects are accepted wherever a `color:` value is expected, including:

- `style.card.color.background`
- `style.border.color`
- `style.text.default.color` and `style.text.<field>.color`
- `icon_style.color`
- `shape_texture.config.color` (and `color_a`, `color_b`)
- `elbow.segment.color`
- Background animation `config.color`
- Divider `color`

---

## Examples

### Climate card — multi-field state colours

A button that changes background, border, and text colour based on a climate entity's state:

```yaml
type: custom:lcards-button
entity: climate.living_room
preset: lozenge
text:
  label:
    content: Climate
    position: top-left
    color:
      default: "var(--lcards-moonlight)"
      active: "var(--lcards-orange)"
      unavailable: "var(--lcards-alert-red)"
  state:
    content: "{entity.state}"
    position: center
    color:
      heat: "var(--lcards-alert-red)"
      cool: "var(--lcards-blue)"
      auto: "var(--lcards-orange)"
      default: "var(--lcards-moonlight)"
style:
  card:
    color:
      background:
        default: "var(--ha-card-background)"
        active: "alpha(var(--lcards-orange), 0.08)"
  border:
    color:
      default: "var(--lcards-gray)"
      active: "var(--lcards-orange)"
      heat: "var(--lcards-alert-red)"
      cool: "var(--lcards-blue)"
      unavailable: "var(--lcards-alert-red)"
    width: 2
```

### Numeric sensor — range-based colour

A battery sensor card that uses ranges to colour-code charge level:

```yaml
type: custom:lcards-button
entity: sensor.phone_battery
style:
  card:
    color:
      background:
        zero: "var(--lcards-alert-red)"        # exactly 0 %
        below:20: "var(--lcards-alert-red)"    # critical — checked after zero
        below:50: "var(--lcards-alert-yellow)" # low
        non_zero: "var(--lcards-green)"        # any positive level, no range matched
        default: "var(--lcards-gray)"
```

---

## Range Conditions on Non-Numeric Entities — `ranges_attribute`

Range keys (`above:N`, `below:N`, `between:N:M`) compare against the **numeric form of the entity state**. For many entities this works out of the box — sensors report numeric strings like `"72.4"`. But some domains give non-numeric states:

- Lights: `state = "on"` / `"off"`
- Cover/valve: `state = "open"` / `"closed"`
- Media players: `state = "playing"` / `"idle"`

For these, `ranges_attribute` tells LCARdS to compare range conditions against a named entity attribute instead of the entity state string. This applies to **all** state maps on the card simultaneously — colours, borders, icons, and text. Exact-state and classified-state matching are unaffected; only steps 2–4 of the resolution order (zero, ranges, non\_zero) use the attribute value.

```yaml alternatives
ranges_attribute: brightness_pct   # special virtual attribute (see below)
ranges_attribute: color_temp       # any real attribute name works
ranges_attribute: current_position # e.g. cover position 0–100
ranges_attribute: humidity         # climate sensor attribute
```

### Special virtual attributes

| Value | What it provides |
|-------|-----------------|
| `brightness_pct` | `Math.round(attributes.brightness / 2.55)` — converts the raw 0–255 HA light brightness to a 0–100 percentage, so thresholds can be written in familiar percentage terms |

All other values are treated as literal attribute names read directly from `entity.attributes`.

### Example — light with brightness-based colour and icon

```yaml
type: custom:lcards-button
entity: light.tv
ranges_attribute: brightness_pct   # all range conditions compare against 0–100 brightness %
tap_action:
  action: toggle
show_icon: true
icon: mdi:lightbulb
icon_style:
  color:
    active: match-light
    inactive: "var(--lcards-orange)"
  icon:
    active: mdi:lightbulb
    inactive: mdi:lightbulb-off
    above:90: mdi:lightbulb-alert      # > 90 % brightness
    below:20: mdi:lightbulb-outline    # < 20 % brightness
style:
  card:
    color:
      background:
        active: "alpha(match-light, 0.5)"
        above:90: "var(--lcars-yellow)"
        default: "var(--ha-card-background)"
```

### Supported cards

`ranges_attribute` is a top-level config key on `lcards-button`, `lcards-elbow`, and `lcards-slider`.

---

## Exact-Match Keys from an Attribute — `state_attribute`

Range conditions work against numeric attribute values via `ranges_attribute`. For **exact-string keys** — states like `heating`, `cooling`, `fade`, `true` — the matching key normally comes from `entity.state`. `state_attribute` overrides that source so the lookup key comes from an attribute instead.

One use case is **climate entities**, where the top-level state is `heat` or `cool` (the mode) but `hvac_action` (`heating`, `cooling`, `idle`, `off`) is the more granular and useful signal for colouring:

```yaml
type: custom:lcards-button
entity: climate.living_room
state_attribute: hvac_action
icon_style:
  color:
    heating: "var(--lcards-alert-red)"
    cooling: "var(--lcards-blue)"
    idle: "var(--lcards-gray)"
    "off": "var(--lcards-gray)"
icon_area_background:
  heating: "alpha(var(--lcards-alert-red), 0.15)"
  cooling: "alpha(var(--lcards-blue), 0.15)"
  idle: transparent
```

Attribute values are serialized via `String()` before the lookup — so boolean attributes become `"true"` / `"false"`, and `null` becomes `"null"`. Write your YAML keys as those literal strings:

```yaml
state_attribute: charging   # boolean attribute
icon_style:
  color:
    "true": "var(--lcards-green)"
    "false": "var(--lcards-gray)"
```

### What it affects

`state_attribute` applies to **all exact-string lookups across the entire card** — `icon_style.color`, `icon_style.icon`, `icon_area_background`, `background`, border colour, text colours, and so on. Classified state (`active`/`inactive`/`unavailable`) is always derived from `entity.state` and is unaffected.

### `state_attribute` vs `ranges_attribute`

The two fields are independent and can be used together:

| Field | Controls |
|---|---|
| `state_attribute` | Which attribute value is matched against **exact string keys** (`heating`, `true`, …) |
| `ranges_attribute` | Which attribute's **numeric value** is used for range keys (`above:50`, `between:10:90`, …) |

```yaml
type: custom:lcards-button
entity: climate.living_room
state_attribute: hvac_action        # exact keys: heating / cooling / idle
ranges_attribute: current_humidity  # range keys: above:60 / below:30
```

### Supported cards

`state_attribute` is a top-level config key on `lcards-button`, `lcards-elbow`, and `lcards-slider`.

---

## Custom State Classification — `state_classification`

By default, LCARdS maps raw entity states to one of four style buckets:

| Bucket | States |
|---|---|
| `unavailable` | `unavailable`, `unknown` |
| `active` | `on`, `home`, `playing`, `heat`, `open`, and [20+ more built-in states](/development/colour-resolution.md) |
| `inactive` | everything else |
| `default` | card has no entity |

When a preset is applied (e.g. `preset: lozenge`), the preset's `inactive` colour silently fills in the bucket — meaning all unmapped states get the preset's inactive shade, even when you only defined a `default` colour.

`state_classification` lets you override this mapping — and define your own named buckets beyond the four built-in ones.

### Built-in bucket overrides

```yaml
type: custom:lcards-button
entity: person.stefan
state_classification:
  else: default         # unmapped zone names → "default" bucket, not "inactive"
style:
  card:
    color:
      background:
        home: var(--lcars-green)
        not_home: var(--lcars-mango)
        default: var(--lcars-blue)   # custom zones land here now
```

### Custom buckets

You can define your own bucket names as keys alongside `active` and `inactive`. Any key that isn't a reserved word becomes a custom bucket — assign it an array of raw entity states, then use that key name in your colour config exactly like `active` or `inactive`.

```yaml
type: custom:lcards-button
entity: person.stefan
state_classification:
  home_zone: [home]
  work_zone: [work, office, downtown]
  away: [not_home]
  else: away            # all other states → "away" bucket
style:
  card:
    color:
      background:
        home_zone: var(--lcars-green)
        work_zone: var(--lcars-blue)
        away: var(--lcars-mango)
        unavailable: var(--lcars-red)
```

Custom bucket names can be anything except the reserved words: `active`, `inactive`, `unavailable`, `default`, `else`, `unknown`.

### Keys

| Key | Type | Description |
|---|---|---|
| `active` | `string[]` | Additional states classified as **active** (augments built-in list) |
| `inactive` | `string[]` | States explicitly classified as **inactive** |
| `<custom>` | `string[]` | States mapped to your named bucket (use that name as a colour key) |
| `else` | string | Bucket for states not matched by any list. Accepts built-in names (`active`/`inactive`/`default`) or a custom bucket name. Defaults to `inactive`. |

`unavailable` and `unknown` always map to the `unavailable` bucket and cannot be overridden.

### Priority within the resolver

Explicit state keys in your colour config still win over `state_classification`. Classification is only consulted when no exact key matches:

```
attributeState exact key  (state_attribute config)
  → exact state key in color config  (e.g. home: green)
  → numeric zero / range / non_zero
  → classified bucket  ← state_classification applies here
  → default / fallback
```

### Examples

**All unmapped person zones use `default` colour:**
```yaml
state_classification:
  else: default
```

**Treat specific zones as active:**
```yaml
state_classification:
  active: [work, gym, school]   # augments built-in active list
  else: default
```

**Binary sensor — treat all states as active unless unavailable:**
```yaml
state_classification:
  else: active
```

**Named zones with distinct colours (custom buckets):**
```yaml
state_classification:
  home_zone: [home]
  work_zone: [work, office, downtown]
  away: [not_home]
  else: away
```

### Supported cards

`state_classification` is a top-level config key on `lcards-button`, `lcards-elbow`, and `lcards-slider`. The `else` field is also available in the card editor UI; all array fields are YAML-only.

---

## Template Strings as Colour Values

Any colour field also accepts a **Jinja2 / JS template string**. The template is evaluated by the LCARdS template pipeline and the result is used as the colour. This is most useful when the logic is too conditional for a flat state-key map.

```yaml no-validate
type: custom:lcards-button
entity: climate.living_room
icon_style:
  color: "{{ 'var(--lcards-alert-red)' if state_attr('climate.living_room', 'hvac_action') == 'heating' else 'var(--lcards-blue)' }}"
icon_area_background: "{{ 'alpha(var(--lcards-alert-red), 0.15)' if is_state('climate.living_room', 'heat') else 'transparent' }}"
```

The template must evaluate to a valid colour string — a hex value, CSS variable, `theme:` token, or computed token. Setting the **entire field** to a template is the primary use case; per-key values inside a state map were already resolved.

:::tip
For most cases a state map with `state_attribute` is simpler and more readable. Reach for a template when the logic can't be expressed as a flat key map.
:::
