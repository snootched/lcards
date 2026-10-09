---
aside: false
---

# Data Grid Playground

Edit the YAML and the grid redraws as you type. Pick a starting point from the list, or paste a grid from your own dashboard.

**You don't need to know the YAML to start:**

- **Quick settings** above the editor change the most common options for you.
- **Type in the editor** and it suggests the options that fit where your cursor is, with a short description. Press **Ctrl+Space** to see suggestions anywhere, and hover over a key to read what it does.
- **Options here** (under the editor) lists everything you can add at the cursor. **Insert** adds it at the right indent, and **Docs** opens its section in a new tab.

<ClientOnly>
  <DataGridDemo editable />
</ClientOnly>

## How the preview works

The preview uses the data grid card's own code: the same rows and cells, style layers, grid layout, decorative values, cascade timing, animation presets and validation as on your dashboard. The docs site has no Home Assistant, so:

- **Entities get sample values.** Names containing `temperature`, `humidity`, `power`, `energy` or `battery` get a realistic value with a unit, and `light.*`/`switch.*`/`binary_sensor.*` entities are on or off. Any other entity gets a plain number.
- **Templates** show sample values for simple forms: `states('...')` with `float`, `int` or `round`, `state_attr(...)`, a one-line `'A' if ... > N else 'B'`, and `{datasource:...}`. Anything else shows an ellipsis. On a dashboard, Home Assistant renders them all.
- **Tap actions** say what they would do instead of doing it.
- **`theme:` tokens** use the default LCARdS theme.

Messages under the grid show schema warnings, and explain how an [older format](./upgrading) would be converted.

When it looks right, **Copy YAML** and paste it into your card's YAML editor, then swap in your own entities.
