# Quick Start

You've installed LCARdS. Now let's add your first card and get familiar with the editors.

## Add Your First Card

1. Open your Home Assistant dashboard in **Edit mode**
2. Click **Add card**
3. Scroll or search the card list for **lcards-button**
4. Select it, pick an entity, and click **Save**

You now have a working LCARS-style button on your dashboard.

## Minimal YAML

If you prefer working in YAML, the simplest button looks like this:

```yaml
type: custom:lcards-button
entity: light.living_room
```

Apply a preset for the classic LCARS look and add a label:

```yaml
type: custom:lcards-button
entity: light.living_room
preset: lozenge
text:
  label:
    content: LIVING ROOM
```

Other preset examples to try: `bullet`, `pill`, `capped`, `outline`, `text-label`.

## The Visual Editor

Each LCARdS card has a built-in visual editor. Click the pencil icon on a card to open it.

- The **Config** tab handles the most common settings with form fields
- The **YAML** tab gives you schema-backed YAML editing with auto-complete and inline validation
- Complex cards (MSD, Chart, Data Grid) have a ***Open Configuration Studio*** button for a purpose-built visual environment with live preview

## Main Engineering

Each card editor has a **Main Engineering** tab — a live window into the core systems powering that card. Use it to manage data sources, inspect which rules are affecting the card, browse theme tokens, and trace the origin of every config value.

See [Main Engineering](../cards/main-engineering.md) for full details.
