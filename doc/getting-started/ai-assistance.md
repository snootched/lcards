---
description: "Get Claude, ChatGPT or another AI assistant to write LCARdS YAML that works: the LCARdS skill for Claude, what to give other assistants, and how to check the result."
---

# Getting AI Help

An AI assistant can write LCARdS cards and whole dashboards for you. It just needs to know LCARdS first.

- Out of the box, a chatbot has never seen LCARdS. It guesses, and guessed options are silently ignored.
- Give it the real list of LCARdS options and it stops guessing.
- Check what it wrote before you paste it into Home Assistant.

## With Claude (easiest)

The **LCARdS skill** teaches Claude everything for your LCARdS version: every option, every built-in preset and colour, the docs, the gallery dashboards and the config checker. It also knows [HA-LCARS](https://github.com/th3jesta/ha-lcars): its themes, its `--lcars-*` colour variables and its classes for stock cards. It also knows the [UIX](https://github.com/Lint-Free-Technology/uix) styling HA-LCARS runs on, so it can tell you which job belongs to an LCARdS option, the theme or UIX.

1. Add the skill to Claude:
   - **Claude Code:** install the LCARdS plugin. In a Claude Code session, run:

     ```
     /plugin marketplace add https://lcards.unimatrix01.ca/marketplace.json
     /plugin install lcards@lcards
     ```

   - **claude.ai or the Claude apps:** download [`lcards-skill.zip`](/tools/lcards-skill.zip) and upload it as a custom skill in **Settings** (needs code execution turned on).
2. Ask. For example:
   - "Make me an LCARdS button for `light.kitchen` that turns red when it's on."
   - "Build an engineering dashboard with my `sensor.power_*` entities."

Claude asks for your real entity ids instead of inventing them, and checks its own YAML before handing it over. Running HA-LCARS? Say which theme, and Claude colours the cards with the theme's own variables so they follow when you switch themes.

In Claude Code the plugin goes further:

- The config checker **runs by itself** every time Claude writes a YAML file with LCARdS cards in it, and Claude fixes whatever it reports before handing the file over.
- **`/lcards:check`** followed by a file or pasted YAML checks it and explains each problem.
- **`/lcards:dashboard`** builds a whole dashboard with you, one question at a time.

::: details Keeping the Claude Code plugin up to date
Each LCARdS release comes with a new version of the plugin. To get it, run `/plugin marketplace update lcards`, or open `/plugin`, go to **Marketplaces**, select **lcards** and turn on **Enable auto-update**. Run `/reload-plugins` (or start a new session) to load the new version.

- **Running a dev build of LCARdS?** Use the dev channel instead, which follows the [dev docs](https://lcards.unimatrix01.ca/dev/): `/plugin marketplace add https://lcards.unimatrix01.ca/dev/marketplace.json`, then `/plugin install lcards@lcards-dev`. Install one channel, not both.
- **Installed the skill by hand before?** Delete `~/.claude/skills/lcards/` first, so only the plugin copy loads.
- **Prefer a manual install?** Unzip [`lcards-skill.zip`](/tools/lcards-skill.zip) into `~/.claude/skills/`, so you have `~/.claude/skills/lcards/SKILL.md`. It won't update itself.
- The plugin needs Claude Code 2.1.224 or newer.
:::

::: info Other tools that support skills
The LCARdS skill follows the open [Agent Skills](https://agentskills.io) standard, so any tool that supports Agent Skills can load the same zip. We build and test it with Claude.
:::

::: tip Claude can check YAML too
Already have a config, from you or from another tool? Paste it into Claude with the skill loaded and ask *"check this LCARdS config and fix it"*. Claude runs the same checker as the [Check Your Config](config-checker) page and explains each problem.
:::

## Give Claude your home's context (ha-mcp)

On its own, Claude doesn't know your Home Assistant: you tell it your entity ids. The community [**ha-mcp**](https://github.com/homeassistant-ai/ha-mcp) server connects Claude to your Home Assistant, so together with the LCARdS skill Claude can look things up for itself:

- your **areas and floors**, to group a dashboard by room;
- your **entities** and their current **states**, so it uses your real entity ids;
- which devices are lights, sensors, switches and so on, to pick the right card for each.

Then ask, for example: *"Build an LCARdS engineering dashboard for the devices in my garage"* or *"Make a bridge view with a button for every light on the ground floor."*

::: warning ha-mcp is not part of LCARdS
ha-mcp is a separate community project; we don't make, support or take responsibility for it. It can also change your Home Assistant (automations, dashboards, settings and more). If you only want Claude to read your setup, turn on its **Read Only Mode**, or connect with its read-only URL (append `/readonly` to the server address). Install and set it up by following [its own instructions](https://github.com/homeassistant-ai/ha-mcp).
:::

## With other assistants

If your assistant supports Agent Skills, use the skill above. Otherwise:

1. **Download the option list for your card**, for example [`lcards-button.json`](/schema/cards/lcards-button.json). Every card is listed in [`schema/index.json`](/schema/index.json).
2. **Attach it** to your chat and paste this first:

   ```
   I'm writing YAML for LCARdS, a custom Home Assistant card system. The
   attached JSON Schema lists every option. Only use options from the schema.
   If something I ask for isn't there, tell me instead of inventing a key.
   Theme colours need the theme: prefix, e.g. theme:colors.ui.primary.
   ```

3. **Describe the card you want.**

## Check what it wrote

- Paste the YAML into [Check Your Config](config-checker). It runs in your browser and points at each problem.
- Or ask Claude with the skill to check it (see the tip above).
- Prefer the command line? Download [`lcards-validate.mjs`](/tools/lcards-validate.mjs) and run `node lcards-validate.mjs my-dashboard.yaml` (Node.js 20 or newer).

## If it still makes things up

- Paste the checker's output back into the chat and ask it to fix exactly those lines.
- Remind it to re-read the attached schema and not to guess. Most assistants correct themselves once told.

## Details for power users

::: details What else you can attach

**Schemas**

- **One card at a time (smallest):** the card's file from [`schema/index.json`](/schema/index.json), plus the shared files its entry lists under `uses` (rules, animations, background animations, state colours, filters). Card files are 2 to 75 KB; attach only the shared files your request touches.
- **Everything in one file:** [`lcards-schema.json`](/lcards-schema.json) holds every card, the [Layout View](../cards/layout-view/) and the LCARS shell strategy. It is about 460 KB, so it suits tools with large context windows.
- Each GitHub release carries both (`lcards-schema.json`, `lcards-schema.zip`), plus the skill and the checker, matching that release exactly.

**Docs pages**

- [Common Properties](../cards/common) explains what the schema can't: entity references, the `theme:` prefix, `{{ }}` templates and actions.
- The card's own page (for example [Button](../cards/button/) or [Chart](../cards/chart/)) has worked examples.
- Tools that read [`llms.txt`](/llms.txt) find everything from there. [`llms-full.txt`](/llms-full.txt) is all the user docs in one file.

**MSD**

The MSD schema (`custom:lcards-msd-card`) is large and deeply nested. Attach [`lcards-msd-card.json`](/schema/cards/lcards-msd-card.json) with the shared files it uses, plus the [MSD Quick Start](../cards/msd/quick-start) or [Routing Concepts](../cards/msd/routing-concepts) page, and expect a few more rounds than for a single button.

**Longer prompt template**

```
I'm writing YAML configuration for LCARdS, a custom Home Assistant Lovelace
card system. I've attached its JSON Schema (from https://lcards.unimatrix01.ca/schema/index.json)
and reference docs. Rules:
- Only use properties that appear in the schema for the card type I'm using
  (resolve "#/$defs/..." refs within the file, and "../shared/<name>.json" refs
  against the shared files I attached).
- Do not invent properties. If something I ask for isn't in the schema, tell
  me instead of guessing at a plausible-sounding key.
- Colour values must match the schema's colour pattern: hex, rgb()/rgba()/
  hsl()/hsla(), var(--name), or a theme:path token (e.g. theme:colors.ui.primary).
```

:::
