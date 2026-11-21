---
aside: false
sidebar: false
pageClass: demo-wide
description: "See LCARdS YAML (a card, a view or a whole dashboard) as real cards in your browser before you paste it into Home Assistant, from pasted YAML or a preview link an AI assistant made."
---

# Preview Your YAML

**Paste LCARdS YAML below, or open a preview link, to see it as real cards before you put it on a dashboard.** The cards are the same LCARdS bundle your Home Assistant runs, on sample states.

- **Works with** one card, a view, or a whole dashboard: a dashboard with several views gets a tab for each.
- **Private:** the YAML stays in your browser. A preview link carries it after the `#`, a part of the address that browsers never send to a server.
- **Sample states:** entities you name get a believable state for their domain (a light on or off, a sensor with a number), so the values are examples. Taps on toggles and sliders change them, as in the [live demo](live-demo).

<ClientOnly>
  <PreviewBoard />
</ClientOnly>

## Preview links from an AI assistant

**When Claude with the [LCARdS skill](ai-assistance) designs a dashboard with you, it can give you a link to this page with the YAML inside.** Open it to see the draft before you paste anything.

- Claude makes the link when it can run code (Claude Code, or claude.ai and the Claude apps with code execution turned on). Without that, it gives you the YAML: paste it above.
- A link for a big dashboard is long. If the chat cuts it off, the page says the link couldn't be read; paste the YAML instead.
- **Copy link to this preview** makes a link for whatever is in the editor, to share or keep.

## What a preview can't show

**A preview is a close look, not your dashboard: your own states, theme and other cards aren't here.**

- **Other cards:** cards that aren't LCARdS (tiles, entities, custom cards from HACS) show as an empty space the size of the card.
- **Your theme:** cards show LCARdS' default colours, as on a dashboard without a theme. Your theme's own colours appear once the YAML is on your dashboard.
- **Strategies:** a dashboard strategy such as the LCARS shell builds its views inside Home Assistant, so it can't be previewed here.
- **Problems in the YAML:** the page runs the [config checker](config-checker) and says how many errors and warnings it found; fix those first, as the preview may differ from Home Assistant until they're gone.
