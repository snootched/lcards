---
description: "Get Claude to design and write LCARdS dashboards with you using the LCARdS skill: setup for Claude Code and claude.ai, what to ask, previews and checks, connecting Home Assistant with ha-mcp, and what to give other assistants."
moved_anchors:
  if-it-still-makes-things-up: /getting-started/ai-assistance#check-what-it-wrote
---

# Getting AI Help

**Claude with the LCARdS skill can plan a dashboard with you, write the YAML and check it before you paste anything.**

- Out of the box, a chatbot has never seen LCARdS. It guesses option names, and LCARdS silently ignores the guesses.
- The skill gives Claude the real options, presets, colours, docs, gallery dashboards and config checker for your LCARdS version, and the astrometrics starters with their settings, so it can link a starter to your entities (a wormhole that opens with a light).
- The skill is made for Claude. Other assistants can still help if you give them the option list (see [With other assistants](#with-other-assistants)).

## With Claude (easiest)

**Install the LCARdS skill once, then ask in plain words.**

- The skill also knows [HA-LCARS](https://github.com/th3jesta/ha-lcars) (its themes and `--lcars-*` colours) and the [UIX](https://github.com/Lint-Free-Technology/uix) styling it runs on, so Claude can tell you whether a job belongs to an LCARdS option, the theme or UIX.
- Claude uses your real entity ids: tell it them, or connect it to Home Assistant with [ha-mcp](#give-claude-your-home-s-context-ha-mcp).

| Where you use Claude | How to add the skill |
|---|---|
| **Claude Code** | Run `/plugin marketplace add https://lcards.unimatrix01.ca/marketplace.json`, then `/plugin install lcards@lcards` |
| **claude.ai or the Claude apps** | Download [`lcards-skill.zip`](/tools/lcards-skill.zip) and upload it as a custom skill under **Settings**. Turn on code execution |

::: details More about setup
- **Pictures in claude.ai:** to see pictures of gallery screens while you plan, allow network access to `lcards.unimatrix01.ca` in the code execution settings (add it to the allowed domains, or allow all domains). Without it, Claude gives you the links instead.
- **Updating the Claude Code plugin:** each LCARdS release comes with a new version. Run `/plugin marketplace update lcards`, or open `/plugin`, go to **Marketplaces**, select **lcards** and turn on **Enable auto-update**. Then run `/reload-plugins` or start a new session. The plugin needs Claude Code 2.1.224 or newer.
- **Installed the skill by hand before?** Delete `~/.claude/skills/lcards/` first, so only the plugin copy loads.
- **Manual install in Claude Code:** unzip [`lcards-skill.zip`](/tools/lcards-skill.zip) into `~/.claude/skills/`, so you have `~/.claude/skills/lcards/SKILL.md`. It won't update itself.
- **Running a dev build of LCARdS?** Use the dev channel, which follows the [dev docs](https://lcards.unimatrix01.ca/dev/): `/plugin marketplace add https://lcards.unimatrix01.ca/dev/marketplace.json`, then `/plugin install lcards@lcards-dev`. Install one channel, not both.
- **Other tools:** the skill follows the open [Agent Skills](https://agentskills.io) standard, so other tools may load the zip. We build and test it with Claude only.
:::

## What to ask

**Ask for what you want; Claude works out the rest with you.**

| You ask | Claude |
|---|---|
| *"I want a Star Trek engineering screen for my house. What could I do?"* | Asks what the screen is for, where it runs, the look, how colours should work and which entities to use. Then offers two or three concepts, each with a layout sketch and pictures of similar gallery screens |
| *"Build an engineering dashboard with my `sensor.power_*` entities."* | Proposes a design for those entities, builds it once you agree, and checks it |
| *"Make me an LCARdS button for `light.kitchen` that turns red when it's on."* | Writes the card straight away |
| *"Just the YAML."* | Skips the questions and picks sensible defaults |
| *"Can I see it first?"* | Gives you a file that opens the draft on [Preview Your YAML](preview), as real cards |
| *"Check this LCARdS config and fix it."* | Runs the same checker as [Check Your Config](config-checker) and explains each problem |
| *"Restyle this to the LCARS design rules."* | Keeps your entities, controls and labels, rebuilds the dashboard with [Designing LCARS Screens](lcars-design), then lists what changed |

::: details More about designing with Claude
- **Features you didn't know about:** each concept names the features that suit your devices, such as a yellow alert and a chirp when the door opens, a starfield that speeds up with the fan, or a schematic of your house with a light switch in every room.
- **After the build:** Claude checks its YAML with the config checker before handing it over, and adds a few ideas for later.
- **Restyling:** Claude asks about anything the YAML doesn't settle (the look, how colours work, the schematic's leader style), then grades the result against the guide's [Check a screen](lcars-design#check-a-screen) list.
- **Screenshots:** when Claude can reach your Home Assistant and a browser (for example Claude Code with ha-mcp and a browser tool), it can offer to put the draft on a separate dashboard and show you a screenshot.
:::

## In Claude Code

**The plugin adds an automatic check and three commands.**

| Feature | What it does |
|---|---|
| Automatic check | Runs the config checker whenever Claude writes a YAML file with LCARdS cards in it; Claude fixes what it reports before handing the file over |
| `/lcards:check` | Checks a file or pasted YAML and explains each problem |
| `/lcards:dashboard` | Designs a whole dashboard with you: a few questions to pick from, then two or three concepts side by side with a layout sketch each, then the YAML |
| `/lcards:issue` | Helps you write a bug report or feature request: checks your config first, cuts your YAML down to a small example, then gives you a draft to paste into the GitHub form (you submit it) |

## Give Claude your home's context (ha-mcp)

**The community [ha-mcp](https://github.com/homeassistant-ai/ha-mcp) server connects Claude to your Home Assistant, so it can look up your setup instead of asking.**

- Claude sees your areas and floors (to group a dashboard by room), your entities and their states (so it uses your real ids), and what each device is (to pick the right card).
- Then ask, for example, *"Build an LCARdS engineering dashboard for the devices in my garage."*

::: warning ha-mcp is not part of LCARdS
It is a separate community project that can also change your Home Assistant. To let Claude only read your setup, turn on its **Read Only Mode**, or append `/readonly` to the server address. Set it up with [its own instructions](https://github.com/homeassistant-ai/ha-mcp).
:::

## With other assistants

**Other assistants don't get the skill's conversation, previews or checker: attach the option list for your card, and expect more rounds than with Claude.**

1. **Download the option list for your card**, for example [`lcards-button.json`](/schema/cards/lcards-button.json). Every card is listed in [`schema/index.json`](/schema/index.json).
2. **Attach it** to your chat and paste this first:

   ```
   I'm writing YAML for LCARdS, a custom Home Assistant card system. The
   attached JSON Schema lists every option. Only use options from the schema.
   If something I ask for isn't there, tell me instead of inventing a key.
   ```

3. **Describe the card you want**, then [check what it wrote](#check-what-it-wrote).

## Check what it wrote

**Check any YAML an assistant wrote before it goes on a dashboard.**

- Paste it into [Check Your Config](config-checker). It runs in your browser and points at each problem. [Preview Your YAML](preview) shows it as real cards.
- Prefer the command line? Download [`lcards-validate.mjs`](/tools/lcards-validate.mjs) and run `node lcards-validate.mjs my-dashboard.yaml` (Node.js 20 or newer).
- If the assistant still makes things up, paste the checker's results back into the chat, ask it to fix exactly those lines, and remind it to re-read the attached schema instead of guessing.

## Additional Context

**More you can attach for a tool without the skill: the schemas, docs pages and a longer prompt.** Claude with the skill already has all of it.

::: details What else you can attach

**Schemas**

- **One card at a time (smallest):** the card's file from [`schema/index.json`](/schema/index.json), plus the shared files its entry lists under `uses` (rules, animations, background animations, state colours, filters). Card files are under 100 KB; attach only the shared files your request touches.
- **Everything in one file:** [`lcards-schema.json`](/lcards-schema.json) holds every card, the [Layout View](../cards/layout-view/) and the LCARS shell strategy. It is about 800 KB, so it suits tools with large context windows.
- Each GitHub release carries both (`lcards-schema.json`, `lcards-schema.zip`), plus the skill and the checker, matching that release exactly.

**Docs pages**

- [Common Properties](../cards/common) explains what the schema can't: entity references, the `theme:` prefix, `{{ }}` templates and actions.
- The card's own page (for example [Button](../cards/button/) or [Chart](../cards/chart/)) has worked examples.
- Tools that read [`llms.txt`](/llms.txt) find everything from there. [`llms-full.txt`](/llms-full.txt) is all the user docs in one file.

**MSD**

The MSD schema (`custom:lcards-msd-card`) is large and deeply nested. Attach [`lcards-msd-card.json`](/schema/cards/lcards-msd-card.json) with the shared files it uses, plus the [MSD Getting Started](../cards/msd/quick-start) or [Line Routing](../cards/msd/routing) page, and expect a few more rounds than for a single button.

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
