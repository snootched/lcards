# Main Engineering

**Main Engineering** is a tab available in every LCARdS card editor. It gives you a live window into the core systems powering that card — inspect runtime state, browse tokens, manage data sources, and trace config origins without leaving the editor.

---

## Opening Main Engineering

1. Click the **pencil (edit) icon** on any LCARdS card
2. Select the **Main Engineering** tab in the editor panel

---

## Panels

### Data Sources

Manage the [Data Sources](../core/datasources/) attached to this card.

- **Browse all registered sources** — see each source's current value, entity, update rate, and history buffer size
- **Create a new source** — define a new entity subscription with history preloading and a processing pipeline
- **Edit an existing source** — change entity, update interval, history settings, or add/modify processors
- **Remove a source** — detach a data source from this card
- **Live values** — values update in real time as entity state changes

This is the fastest way to set up a chart or gauge without hand-writing data source YAML. Create the source here, then reference it in your card config as `{ds:source_name}`.

---

### Rules Browser

Inspect the [Rules Engine](../core/rules/) from this card's perspective.

- **All active rules** — shows every rule currently in the system (from packs, config, and the rules helper)
- **Rules affecting this card** — highlights rules whose target tags, IDs, or types match this card
- **Current patches** — shows exactly which style patches are being applied right now, and by which rule
- **Rule state** — shows whether each rule's conditions are currently met

Use this to debug unexpected styling — if a card looks wrong, check here to see what rules are patching it.

---

### Theme Browser

Explore the active [Theme](../core/themes/) token tree live.

- **Browse all tokens** — the full token namespace tree, in categories (colours, typography, spacing, components, etc.)
- **Current values** — tokens are shown with their resolved values from the active theme
- **Search** — filter by name or value
- **Copy** — click any token to copy its `{theme:token.path}` reference ready to paste into card config

::: tip Finding the right token
Open Theme Browser while editing a card. When you find the colour or size you want, click to copy its path — then paste it directly into your YAML or Config field.
:::

---

### Provenance Tracker

See the **effective runtime configuration** for this card and trace exactly where each value came from.

Every config value a card uses could come from one of several sources — the card's own YAML, a preset, a rule patch, or a default from the core system. Provenance Tracker shows which source contributed each individual property.

| Source layer | Description |
|---|---|
| **Card config** | Direct values from the card's own YAML |
| **Preset** | Values provided by the active `preset:` |
| **Rule patch** | Values injected by a matching rule at runtime |
| **System default** | Fallback values from the LCARdS core |

When values conflict, higher-priority sources win (card config > rule > preset > default). Provenance shows you the winning value and which layer it came from.

Use this when a card isn't rendering as expected and you need to see what the effective config actually is.

---

## Related

- [Data Sources](../core/datasources/) — subscription config and processing pipeline reference
- [Rules Engine](../core/rules/) — rule conditions, targets, and style patches
- [Themes](../core/themes/) — token namespaces and colour palette
- [Presets](../core/presets.md) — how presets compose with card config
