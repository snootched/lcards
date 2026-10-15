# Getting AI Help Writing LCARdS Config

You can use ChatGPT, Claude, or any other LLM to help write LCARdS YAML. Left to
itself, though, an LLM has never seen LCARdS's actual config schema; it will
happily invent plausible-looking properties that don't exist. Giving it the real
schema up front fixes that.

## What to attach

**1. The schema for your card (required).** LCARdS publishes the exact JSON Schemas
it validates config against, generated straight from the source so they can't drift
out of date. Pick one of:

- **One card at a time (smallest):** the card's file from
  [`schema/index.json`](/schema/index.json), e.g.
  [`schema/cards/lcards-button.json`](/schema/cards/lcards-button.json) or
  [`schema/cards/lcards-msd-card.json`](/schema/cards/lcards-msd-card.json), plus the
  shared files its index entry lists under `uses` (rules, animations, background
  animations, state colours, filters). Card files are 2 to 75 KB; attach only the
  shared files your request touches.
- **Everything in one file:** [`lcards-schema.json`](/lcards-schema.json): every card
  (`cards`, including MSD), the [Layout View](layout-view/) (`views`) and the LCARS
  shell dashboard strategy (`strategies`). About 460 KB, so it suits tools with large
  context windows.

Each GitHub release also carries both as assets (`lcards-schema.json`,
`lcards-schema.zip`), matching that release's options exactly.

Tools that look for [`llms.txt`](/llms.txt) find all of this from there: links to every
page, the schemas and the checker. [`llms-full.txt`](/llms-full.txt) is the user docs in
one file.

**2. [Common Properties](common) (recommended)**: covers things the raw schema's
types don't fully explain in prose: entity reference patterns, the `theme:`
prefix required for theme tokens, `{{ }}` template syntax, and action config.

**3. The specific card's reference page (optional)**: e.g. [Button](button/),
[Chart](chart/), for real worked YAML examples in context, not just a type list.

## Prompt template

Paste this ahead of your actual request, with the schema file and doc pages
attached:

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

Then describe the card you want.

## MSD

The MSD schema (`custom:lcards-msd-card`) is large and deeply nested (routing,
overlays, filters, animation triggers). Attach
[`schema/cards/lcards-msd-card.json`](/schema/cards/lcards-msd-card.json) with the
shared files it uses, plus the relevant page(s) from the [MSD docs](msd/) (start
with [Quick Start](msd/quick-start) or [Routing Concepts](msd/routing-concepts)),
and expect to iterate more than with a single button.

## Check what it wrote

Run the result through the LCARdS config checker before pasting it into a
dashboard. It takes a single card, a view or a whole dashboard (raw configuration
YAML), finds every LCARdS card at any depth, and reports problems at their exact
path:

```bash
node lcards-validate.mjs my-dashboard.yaml
```

Download [`lcards-validate.mjs`](/tools/lcards-validate.mjs) (one file, needs only
[Node.js](https://nodejs.org/) 20 or newer; each GitHub release also carries the
copy that matches it). Errors are things LCARdS will reject or ignore: invalid
values and keys that don't exist. Warnings are names that aren't built in (a preset,
animation, sound or theme token), each with a "did you mean" suggestion when one is
close; a pack you installed may add names, so check those yourself. Paste the
output back to the LLM and ask it to fix exactly those lines.

## If it still invents a key

Paste the error (or the YAML that didn't work) back to the LLM along with a
reminder to re-check the attached schema before answering; most models will
correct themselves once told explicitly not to guess.
