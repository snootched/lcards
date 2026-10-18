---
description: Design and write a complete LCARdS dashboard with you, step by step
argument-hint: "[what the dashboard is for]"
---

Use the `lcards` skill to build a whole LCARdS dashboard with the user. Their brief: $ARGUMENTS

Work through these, one short question at a time, skipping anything the brief or the connected tools already answer:

1. **What it shows.** Rooms, devices or systems, and the entities for each. If Home Assistant tools are connected (for example the ha-mcp server), look up areas, entities and states there and propose them; otherwise ask for the real entity ids. Never invent entity ids: use clearly named placeholders and list them at the end.
2. **Where it runs.** Wall tablet, phone or desktop (sets the layout and the number of columns).
3. **Look and theme.** Picard or classic TNG/DS9/Voyager? Does the user run HA-LCARS, and which theme (`references/ha-lcars/themes.md`)? The theme often answers the look. Read `references/docs/getting-started/lcars-design.md` and compose from its patterns; colour everything by role with `theme:` tokens so it follows the theme.
4. **Structure.** Usually `custom:lcards-layout-view` views with named areas. Read `references/docs/getting-started/building-dashboards.md` and one gallery dashboard (`references/gallery/`) that is close to the brief. (The `lcars-shell` strategy generates a ready-made shell instead; its options are in `references/schema/strategies/`.)
5. **Extras.** Alert mode, sounds, an MSD, charts: only if the user wants them.

Then write the dashboard YAML to a file, run the checker on it and fix everything it reports. Hand it over with where to paste it (**Edit dashboard > Raw configuration editor**), the placeholder entities to replace, and any helpers or HA-LCARS setup (UIX, fonts) it depends on.
