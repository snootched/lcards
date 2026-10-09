---
aside: false
---

# Chart Playground

Edit the YAML and the chart redraws as you type. Pick a starting point from the list, or paste a chart from your own dashboard.

**You don't need to know the YAML to start:**

- **Quick settings** above the editor change the most common options for you.
- **Type in the editor** and it suggests the options that fit where your cursor is, with a short description. Press **Ctrl+Space** to see suggestions anywhere, and hover over a key to read what it does.
- **Options here** (under the editor) lists everything you can add at the cursor. **Insert** adds it at the right indent, and **Docs** opens its section in a new tab.

<ClientOnly>
  <ChartDemo editable :height="340" />
</ClientOnly>

## How the preview works

The preview uses the chart card's own code: the same option handling, grouping, time window, theme colours and validation as on your dashboard. The docs site has no Home Assistant, so:

- **Entities get generated sample data.** Names containing `temperature`, `humidity`, `power`, `energy` or `battery` get a realistic signal, and `light.*`/`switch.*`/`binary_sensor.*` entities switch on and off. Any other entity gets a generic wave.
- **Long-term statistics** are computed from the same sample signal.
- **Data source series** plot their entity's sample signal. Processors (smoothing, rates, ...) only run on a real dashboard.
- **`theme:` tokens** resolve on a real dashboard; the preview shows their fallback colours.

Messages under the chart show schema warnings, and explain how an [older format](./upgrading) would be converted.

When it looks right, **Copy YAML** and paste it into your card's YAML editor, then swap in your own entities.
