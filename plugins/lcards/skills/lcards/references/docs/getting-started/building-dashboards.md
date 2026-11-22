# Building a Dashboard

**There are five routes to an LCARS dashboard, from a screen LCARdS builds in a minute to one you lay out card by card.** Start with the quickest that fits: anything LCARdS generates can be taken over and edited later.

| Route | What you get | Where |
|---|---|---|
| [Generate a dashboard](#generate-a-dashboard) | A whole LCARS screen for your rooms that keeps itself up to date | [Dashboard Strategies](dashboard-strategies) |
| [Add LCARS sections](#add-lcars-sections) | Readings, gauges and controls for an area, on any sections dashboard | [Section Strategies](section-strategies) |
| [Design it with AI](#design-it-with-ai) | A screen planned with you for your own entities, YAML checked before you paste it | [Getting AI Help](ai-assistance) |
| [Borrow a layout](#borrow-a-layout) | A finished sample screen to copy from | [Dashboard Gallery](dashboard-gallery) |
| [Build it by hand](#build-it-by-hand) | Every card chosen and placed yourself | [Build by Hand](build-by-hand), then [Bring It to Life](bring-it-to-life) |

## Generate a dashboard

**A dashboard strategy draws a whole LCARS screen from a few settings: pick LCARS Dashboard in Home Assistant's Add dashboard dialog and it fills itself.** See [Dashboard Strategies](dashboard-strategies).

- It rebuilds itself as you add, rename or move areas, devices and entities, so it never goes stale.
- To change its cards, take control: Home Assistant keeps what the strategy made as an ordinary dashboard you can edit.

## Add LCARS sections

**Section strategies add LCARS building blocks to Home Assistant's sections dashboards: readings, gauges and controls for an area, in the classic or Picard look.** See [Section Strategies](section-strategies).

- They sit beside your own sections and Home Assistant's, so you can try LCARdS on a dashboard you already have.
- Each section rebuilds itself for its area; take control of one to edit its cards.

## Design it with AI

**Claude with the LCARdS skill plans a dashboard with you and writes the YAML: describe the screen you want, pick from the concepts it shows, and it checks the result before you paste it.** See [Getting AI Help](ai-assistance).

- In Claude Code, `/lcards:dashboard` runs the whole conversation: a few questions, two or three concepts with a layout sketch each, then the YAML.
- It uses your real entity ids: tell it them, or connect it to Home Assistant with [ha-mcp](ai-assistance#give-claude-your-home-s-context-ha-mcp).

## Borrow a layout

**The [Dashboard Gallery](dashboard-gallery) has sample screens, each a whole view with its YAML and a recording.** Copy a layout or a part of one, then point it at your own entities.

- The samples use test helpers and hand-picked colours: read the gallery's note on colours before you copy one.

## Build it by hand

**For a screen that is exactly yours, pick a card for each job and lay them out on a layout view.** [Build by Hand](build-by-hand) walks through it: which card does what, and how to lay out the grid.

- [Bring It to Life](bring-it-to-life) then shows a screen reacting: a colour that changes at a threshold, a smoothed live reading with its history, and a screen that follows alert mode.

## Help along the way

**The design guide, the AI skill and the config checker help on every route.**

- [Designing LCARS Screens](lcars-design) covers the look: colour roles, frames, screen shapes and ready-made patterns.
- Claude with the [LCARdS skill](ai-assistance) helps on any route too: a card for one job, a fix for YAML that misbehaves, a section of a screen.
- [Check Your Config](config-checker) shows invalid keys and values in any LCARdS YAML.
