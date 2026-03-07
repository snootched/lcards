# Themes

LCARdS uses a token-based theme system. Instead of hardcoding colours, you reference named tokens that the active theme resolves. Switching themes updates the whole dashboard.

---

## Built-in Themes

| Theme | Description |
|-------|-------------|
| `lcars-default` | Classic LCARS orange and blue palette |
| `lcars-dark` | Darker variant with reduced saturation |
| `cb-lcars` | Retro LCARS closer to the original CB-LCARS look |

Themes are provided by content packs. See the [Config Panel](../../config-panel.md) Pack Explorer to view available themes.

---

## Using Theme Tokens

Reference a token anywhere a colour or size is expected using `{theme:token.path}`:

```yaml
style:
  border:
    color: "{theme:palette.moonlight}"
  card:
    color:
      background: "{theme:color.ui.active}"
```

Tokens can also be used in text content and JavaScript templates:

```yaml
text:
  label:
    content: "[[[return theme.palette.alert_red]]]"
```

---

## Token Namespaces

Tokens are organized into namespaces. Browse all available tokens in the [Config Panel](../../config-panel.md) Theme Browser tab.

### `palette.*`

Raw colour values that define the theme's colour set.

| Token (examples) | Purpose |
|-----------------|---------|
| `palette.moonlight` | Light neutral / highlight |
| `palette.alert-red` | Red alert color |
| `palette.blue` | Primary blue |
| `palette.orange` | Primary orange/gold |
| `palette.dark-blue` | Deep background blue |

### `color.ui.*`

Semantic colours that map to UI roles. Prefer these over raw palette tokens when possible.

| Token | Purpose |
|-------|---------|
| `color.ui.active` | Active / on state |
| `color.ui.inactive` | Inactive / off state |
| `color.ui.default` | Default / neutral state |
| `color.ui.unavailable` | Unavailable entity |
| `color.ui.accent` | Accent / highlight |

### `spacing.*` / `borders.*`

Size tokens for consistent spacing and border radii.

```yaml
style:
  border:
    radius: "{theme:borders.radius.md}"
```

---

## CSS Variables

LCARdS themes also expose standard HA CSS variables. You can use these in colour fields:

```yaml
style:
  card:
    color:
      background: "var(--lcars-orange)"
```

Common variables:

| Variable | Value |
|----------|-------|
| `--lcars-orange` | Primary orange |
| `--lcars-blue` | Primary blue |
| `--lcars-moonlight` | Light neutral |
| `--lcars-dark-blue` | Dark background |
| `--lcars-red` | Alert red |

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
