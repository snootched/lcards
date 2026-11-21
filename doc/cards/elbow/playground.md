---
aside: false
---

# Elbow Playground

Edit the YAML and the card redraws as you type. Pick a starting point (a header or footer elbow, or the segmented style), then change the elbow type, bar sizes or colours.

**You don't need to know the YAML to start:**

- **Quick settings** above the editor change the most common options for you.
- **Type in the editor** and it suggests the options that fit where your cursor is, with a short description. Press **Ctrl+Space** to see suggestions anywhere, and hover over a key to read what it does.
- **Options here** (under the editor) lists everything you can add at the cursor. **Insert** adds it at the right indent, and **Docs** opens its section in a new tab.

<ClientOnly>
  <CardDemo editable type="lcards-elbow" />
</ClientOnly>

## How the preview works

The preview is the real elbow card, the same code your dashboard runs. The docs site has no Home Assistant, so:

- **Entities get sample values.** The entities listed under the preview are always there, and any other entity id in your YAML gets a plausible value for its domain (lights and switches are on, sensors get a number with a unit).
- **Taps that toggle** switch the sample entity, so state colours change as on a dashboard. **More info**, **navigate** and other actions say what they would do instead.
- **Jinja2 templates** (`{{ ... }}`) need Home Assistant and render empty here; `{entity.state}` tokens and `[[[ JavaScript ]]]` templates work.
- **Icons** aren't drawn (Home Assistant provides them), and sounds are off.

Messages under the card show schema warnings for your YAML.

When it looks right, **Copy YAML** and paste it into your card's YAML editor, then swap in your own entities.
