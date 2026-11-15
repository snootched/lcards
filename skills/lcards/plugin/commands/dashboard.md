---
description: Design and write a complete LCARdS dashboard with you, step by step
argument-hint: "[what the dashboard is for]"
---

Use the `lcards` skill to design a whole LCARdS dashboard with the user and then build it. Their brief: $ARGUMENTS

Follow the skill's Workflow (talk it through, then build). In Claude Code, use these tools for it:

1. **Find out the goal** with the AskUserQuestion tool: up to four short questions per call (purpose, device, look and theme, colours by state or by hand), each with two to four options and your recommendation first. Skip what the brief already answers. If Home Assistant tools are connected (for example the ha-mcp server), look up the areas, entities and states first and offer them as options instead of asking for ids. Never invent entity ids: use clearly named placeholders and list them at the end.
2. **Propose** with AskUserQuestion too: one question, two or three concepts as options, each option's `preview` a layout sketch in a text box (areas and what goes in them, a few words each), and its description naming the features it uses, tied to the user's entities, from `references/features.md`. Put your recommendation first. The user can also type their own answer.
3. **Refine** in plain conversation: explain what they ask about, then settle the MSD leader style if there's a schematic.
4. **Show a picture** if you can: when Home Assistant tools can create a dashboard and a browser tool can take a screenshot, offer it, ask before you create anything, put the draft on a separate dashboard, show the screenshot, and delete that dashboard afterwards.
5. **Build**: write the dashboard YAML to a file; the plugin's hook runs the checker on it; fix everything it reports.

Hand it over with where to paste it (**Edit dashboard > Raw configuration editor**), the placeholder entities to replace, any helpers or HA-LCARS setup (UIX, fonts) it depends on, and two or three ideas for later from `references/features.md`.
