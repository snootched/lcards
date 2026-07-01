# Sound Effects

LCARdS cards play audio feedback automatically for interactions — taps, holds, hover, slider drags, and toggle state changes. No config is needed to get the default behaviour; sounds follow the active scheme and global settings set up in [Sound Configuration](../configuration/sounds.md).

This page covers how sounds are triggered per card and how to customise or silence them at the card level.

---

## How Card Sounds Work

When you interact with a card, LCARdS fires a sound event. The `SoundManager` resolves what audio to play by walking down the priority chain:

```
Card config (sounds:) → Device override → User override → Global setting → Scheme default → Silence
```

If you haven't set anything on the card, the global scheme and settings apply. Card-level config raises or lowers priority only for this card — it never affects other cards.

---

## Per-Card Override — `sounds:`

Add a `sounds:` block to any card config to control its sound behaviour independently of global settings.

### Mute the entire card

```yaml
sounds:
  enabled: false
```

No sounds will play on this card, regardless of global or user settings.

### Override a specific event

Use an asset key string to replace the sound, or `null` to silence that event only:

```yaml
sounds:
  card_tap: "lcards_default:nav_forward"   # play a different sound on tap
  card_hold: null                           # silence hold, leave others alone
```

### Full schema

| Property | Type | Description |
|----------|------|-------------|
| `enabled` | boolean | `false` to completely silence this card. Omit to keep default (`true`). |
| `card_tap` | string \| null | Asset key for tap, or `null` to mute. Omit to use scheme/global. |
| `card_hold` | string \| null | Asset key for hold, or `null` to mute. Omit to use scheme/global. |
| `card_double_tap` | string \| null | Asset key for double-tap, or `null` to mute. Omit to use scheme/global. |
| `card_hover` | string \| null | Asset key for hover (desktop), or `null` to mute. Omit to use scheme/global. |
| `toggle_on` | string \| null | Asset key for toggle → on transition. |
| `toggle_off` | string \| null | Asset key for toggle → off transition. |
| `slider_drag_start` | string \| null | Asset key for slider grab. |
| `slider_change` | string \| null | Asset key for slider value change tick. |
| `slider_drag_end` | string \| null | Asset key for slider release. |

::: info Asset keys
Asset keys are strings in the form `scheme:event` (e.g. `lcards_default:card_tap`) or a bare key registered by a sound pack. The built-in scheme is `lcards_default`. See [Sound Configuration](../configuration/sounds.md) for available events and installed packs.
:::

---

## Which Cards Fire Which Events

| Event | Button | Elbow | Slider | All cards |
|-------|:------:|:-----:|:------:|:---------:|
| `card_tap` | ✅ | ✅ | ✅ | ✅ |
| `card_hold` | ✅ | ✅ | ✅ | ✅ |
| `card_double_tap` | ✅ | ✅ | ✅ | ✅ |
| `card_hover` | ✅ | ✅ | ✅ | ✅ |
| `toggle_on` / `toggle_off` | ✅ | ✅ | ✅ | ✅ |
| `slider_drag_start` | — | — | ✅ | — |
| `slider_change` | — | — | ✅ | — |
| `slider_drag_end` | — | — | ✅ | — |

All tap/hold/hover/toggle events are fired by the shared action handler and are available on every card type. Slider-specific events only fire on slider cards.

---

## Examples

### Silent card

```yaml
type: custom:lcards-button
entity: light.desk
sounds:
  enabled: false
```

### Custom tap sound, muted hold

```yaml
type: custom:lcards-button
entity: light.desk
sounds:
  card_tap: "lcards_default:nav_forward"
  card_hold: null
```

### Slider with custom drag sounds

```yaml
type: custom:lcards-slider
entity: light.desk
sounds:
  slider_drag_start: "lcards_default:slider_start"
  slider_drag_end: "lcards_default:slider_end"
  slider_change: null    # silence the per-tick sound
```

---

## See Also

- [Sound Configuration](../configuration/sounds.md) — system-wide setup, schemes, per-user and per-device overrides
- [HA Actions — `lcards.play_sound`](../configuration/ha-actions.md#lcards-play_sound) — trigger a sound from an automation
- [Actions](actions.md) — tap, hold, and double-tap action configuration
