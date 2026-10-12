# Main Engineering

**Main Engineering** is a tab in every LCARdS card editor. It is a live window into the systems behind the card: its data sources, rules, theme tokens and templates, and where each of its values comes from.

---

## Opening Main Engineering

1. Click the **pencil (edit) icon** on any LCARdS card
2. Select the **Main Engineering** tab in the editor panel

---

## Panels

### Data Sources

Manage the [Data Sources](../core/datasources/) attached to this card.

- **This card**: the sources in this card's config. Add, edit or remove them; the editor previews the processors over the entity's recent history (see [Data Sources: in the card editor](../core/datasources/#in-the-card-editor)).
- **All on this page**: every source running on the dashboard, which cards use it and how it was created.
- **Browse sources**: a browser of every source on the page: its entity, processors and buffers, with live values.

Create a source here, then use it in the card as `{ds:source_name}`.

---

### Rules

The [Rules Engine](../core/rules/) from this card's point of view.

- **Rules targeting this card**, and **all rules on this page**, with each rule's status, source card, target, conditions and changes.
- **Add rule** opens the rule editor; its **Apply** section is a YAML editor that completes this page's targets and each card's own settings.
- **Edit as YAML** (`{}`) edits one of this card's rules as a whole; other cards' rules open read only.
- A rule you have just changed or removed says **refresh to apply** until the page reloads: the engine loads each card's rules once.

---

### Theme Browser

Explore the active [Theme](../core/themes/) token tree live.

- **Browse all tokens**: the full token namespace tree, in categories (colours, typography, spacing, components, etc.)
- **Current values**: tokens are shown with their resolved values from the active theme
- **Search**: filter by name or value
- **Copy**: click any token to copy its reference, ready to paste into card config

::: tip Finding the right token
Open Theme Browser while editing a card. When you find the colour or size you want, click to copy its path, then paste it directly into your YAML or Config field.
:::

---

### Provenance

Where each of this card's values comes from, live.

**Open inspector** lists every field the card knows about. Pick one to see its **value now** and **how it got there**, in order:

| Step | What it is |
|---|---|
| **Card defaults, theme defaults** | Defaults registered for the card type |
| **Preset** / **Component** | The active `preset:` or `component:` |
| **Your config** | The card's own YAML |
| **Applied by the card** | Values the card sets after reading the config: the **state branch** that applies now (`active`, `inactive`, a range key ...), a component preset's segments and text, a preset's default parameters, and **built-in** defaults (with the theme token they come from) |
| **Theme token** | For `theme:` values: each step to the colour on the card (an override and its scope, token references, the CSS variable, the final value) |
| **Template** | The template, its result and what it uses (entities, data sources, variables) |
| **Rule** | A rule changing the field right now, with its condition and the value it replaced |

Later steps win: a rule that applies overrides your config, which overrides the preset.

- **Show** narrows the list: changed from defaults, set by rules now, templates, theme tokens, set by the card.
- **Tokens** lists every theme token the card uses, how each resolves, and the fields using it.
- **Live** follows the card as it changes (a rule starting or stopping, the entity changing state). Switch it off to hold the view; **Refresh** catches up.

Provenance comes from the card editor's preview, the card rendered from the config you are editing. Layout cards and the alert overlay don't record it.

---

### Templates

Every template in this card's config, one row per field, with its live result (Jinja2 included) and any syntax mistake. **Open in sandbox** loads a field into the template sandbox, which completes entity attributes, data sources, theme tokens and variables, shows what the template used, and can save it back to the field. See [Templates](../core/templates/).

---

## Related

- [Data Sources](../core/datasources/): subscription config and processing pipeline reference
- [Rules Engine](../core/rules/): rule conditions, targets, and style patches
- [Themes](../core/themes/): token namespaces and colour palette
- [Templates](../core/templates/): template syntax
- [Presets](../core/presets.md): how presets compose with card config
