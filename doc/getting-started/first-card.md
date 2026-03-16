# Your First Card

This guide walks you from a fresh LCARdS installation to your first working LCARS-style button on a Home Assistant dashboard.

!!! tip "Prerequisites"
    - LCARdS installed via HACS (see [Installation](installation.md))
    - A Home Assistant dashboard in edit mode
    - Optionally: [HA-LCARS theme](https://github.com/th3jesta/ha-lcars) active for authentic colours

---

## Add a Manual Card

1. Open your dashboard and click **Edit** → **Add Card**
2. Scroll to the bottom of the card picker and choose **Manual**
3. Paste the YAML below and click **Save**

```yaml
type: custom:lcards-button
label: Engage
entity: light.living_room
```

You should see a basic LCARS-style button card. If the entity state is `on`, the button will reflect that.

---

## Customise with a Preset

LCARdS ships with built-in presets that apply LCARS visual styles in one line:

```yaml
type: custom:lcards-button
label: Warp Core
entity: switch.warp_core
preset: lcars-label-right
```

See [Common Card Properties](../user/cards/common.md) for the full list of shared options available on every card.

---

## Add an Elbow Decoration

Elbows are the corner accent pieces used throughout LCARS. Add one alongside your button:

```yaml
type: custom:lcards-elbow
corner: bottom-right
```

---

## Next Steps

- [Button Card](../user/cards/button/index.md) — full button reference
- [Core Concepts — Templates](../core/templates/index.md) — dynamic values in any field
- [Core Concepts — Rules](../core/rules/index.md) — state-reactive styling across cards
- [Core Concepts — Themes](../core/themes/index.md) — colour token system
