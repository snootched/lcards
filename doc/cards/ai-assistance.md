# Getting AI Help Writing LCARdS Config

You can use ChatGPT, Claude, or any other LLM to help write LCARdS YAML. Left to
itself, though, an LLM has never seen LCARdS's actual config schema — it will
happily invent plausible-looking properties that don't exist. Giving it the real
schema up front fixes that.

## What to attach

**1. The schema bundle (required)** — [`lcards-schema.json`](/lcards-schema.json).
This is the exact JSON Schema LCARdS itself validates config against for
`button`, `chart`, `elbow`, `slider`, `data-grid`, `select-menu`, `alert-overlay`,
and `layout-card` — generated straight from the source, so it can't drift out of
date. Attach the whole file as-is (some parts are shared across cards via
`$defs`/`$ref`, so it isn't meant to be split up).

**2. [Common Properties](common) (recommended)** — covers things the raw schema's
types don't fully explain in prose: entity reference patterns, the `theme:`
prefix required for theme tokens, `{{ }}` template syntax, and action config.

**3. The specific card's reference page (optional)** — e.g. [Button](button/),
[Chart](chart/) — for real worked YAML examples in context, not just a type list.

## Prompt template

Paste this ahead of your actual request, with the schema file and doc pages
attached:

```
I'm writing YAML configuration for LCARdS, a custom Home Assistant Lovelace
card system. I've attached its JSON Schema (https://lcards.unimatrix01.ca/lcards-schema.json) and reference
docs. Rules:
- Only use properties that appear in the schema for the card type I'm using
  (resolve any "$ref" against the top-level "$defs").
- Do not invent properties. If something I ask for isn't in the schema, tell
  me instead of guessing at a plausible-sounding key.
- Colour values must match the schema's colour pattern: hex, rgb()/rgba()/
  hsl()/hsla(), var(--name), or a theme:path token (e.g. theme:colors.ui.primary).
```

Then describe the card you want.

## MSD isn't included yet

`custom:lcards-msd` has its own, much deeper config surface —
routing, overlays, filters, animation triggers — and isn't in the schema bundle
yet. For MSD, attach the relevant page(s) from the [MSD docs](msd/) instead
(start with [Quick Start](msd/quick-start) or [Routing Concepts](msd/routing-concepts)
depending on what you're building), and expect to iterate more by hand.

## If it still invents a key

Paste the error (or the YAML that didn't work) back to the LLM along with a
reminder to re-check the attached schema before answering — most models will
correct themselves once told explicitly not to guess.
