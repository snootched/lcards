---
name: lcards-docs-writer
description: Write, rework or review LCARdS user-facing docs pages (doc/cards, doc/core, doc/getting-started, doc/configuration) in the house format - a short overview plus topic pages, every section a bold summary, explanatory bullets, a live example in block-style YAML, a details block and a Key/Type/Default/Description table checked against the code. Use when the user asks to write or update a docs page, document a card or option, split or tidy a long page, make docs more readable, or roll the D2 format out to more pages. Not for doc/architecture or doc/development (deliberately complete), release notes (lcards-release-notes) or generated pages.
---

# LCARdS docs writer

Users skim; they rarely read. They also copy examples verbatim, and these pages are the source for `llms.txt`, `llms-full.txt` and the user-facing LCARdS skill. So every page must be **easy to skim and exactly right**. The format below was agreed with the user over four review rounds of the D2 pilot (2026-11-07); `reports/d2-pilot-compare.md` has the history and the reasons.

**Reference pages:** read `doc/cards/astrometrics/objects/lines.md` before writing; it is the model for tone, section shape and tables. `doc/cards/slider-card/` is the model for an overview with topic pages.

Never commit unless the user asks. Follow CLAUDE.md's text rules (no em dashes, "Home Assistant" in full).

## Scope

- **In:** user-facing pages under `doc/cards/`, `doc/core/`, `doc/getting-started/`, `doc/configuration/`.
- **Out:** `doc/architecture/` and `doc/development/` (developer docs are deliberately full and are not cut down this way), `doc/releases/` (use `lcards-release-notes`), and generated pages: `doc/cards/astrometrics/starters.md` (`scripts/generate-astro-starters-doc.js`) and `doc/core/datasources/processor-reference.md`. For a generated page, change its generator.

## Page shape

- **Overview page** (about 100 to 150 lines; more only for redirect frontmatter or a required example): a bold first sentence saying what the card or feature is, two or three bullets, a "Try it" tip where there is an editor or playground, a table of the topic pages, a quick start with live examples, the presets gallery if any, and the card-level options table.
- **Topic pages:** one per group of related sections, as long as the sections need. Group by what a user is trying to do, not by schema nesting. Title Case for page titles (H1) and sidebar entries ("Pills and Gauges"; small words stay lower case). Section headings keep the key name where a section documents one key (`## style.track`, `## glow`).
- **Sidebar:** `doc/.vitepress/config.mts`; a card with topic pages is a collapsed group with Overview first.

## Every section

In this order:

1. **A bold first sentence** that says what it is and what you would use it for. One or two plain sentences after it may add context.
2. **Zero to four bullets, only when needed.** Each is a full sentence that explains something: how it behaves, what people trip on, how keys work together. A bullet never lists keys ("Also: `color` and `opacity`") and is never a fragment. A fact about one key belongs in that key's table row.
3. **A live example** (` ```yaml live `), which gives the reader the YAML and the rendered card. Every section that has keys has one. When an example shows several things, a YAML comment labels each part. An example that cannot run in the docs (a `/local` file, a real device) is a plain ` ```yaml ` block and the text says why.
4. **Optionally, `::: details More about <name>`** for what most readers can skip: edge cases, interactions with other features, reduced motion, performance. Each item starts with a bold label (`- **Entities:** ...`). Disclose, don't cut: long-standing detail moves here rather than being deleted.
5. **The key table, last:** `| Key | Type | Default | Description |`. Every key the section covers, one row each; a sub-key gets its own row (`pulse.color`, `margin.top`), never `{ a, b }` notation. Default is the real default from the code: a value in backticks, `-` for none, `required`, or a short phrase ("the track", "as many as fit", "`0.3` on a gauge, `1` on a ring"). Description is a short phrase or sentence, and anything specific to that key goes here. Keys shared by several sections live in one table that the others link to in a single row (`| [Line keys](#line-keys) | | | width, dash, ... |`).

A section that only lists values (built-in models, planet maps, presets) may use a table with other columns.

## Examples

- **Block-style YAML.** No `{ }` maps and no list of maps on one line. Short lists of plain values stay inline (`[0, 0, 0]`, `[var(--a), var(--b)]`). Keep `"y":` quoted as a key (Home Assistant's editor reads YAML 1.1).
- **Colours:** only `var(--lcars-*)` names in the HA-LCARS snapshot (`scripts/data/ha-lcars/snapshot.json`), `var(--lcards-*)` from `src/lcards-vars.js`, the Home Assistant variables the docs site defines (`HA_DEMO_VARS` in `card-demo-runtime.js`), or `theme:` tokens. No hex, no new palettes.
- **Use sample entities** the docs demos know (`card-demo-runtime.js` sample hass), so the card renders with sensible values.
- **Look at every new or changed example.** Run `npm run docs:serve`, then `node scripts/docs-demo-shots.mjs <outdir> <page path> <prefix> --url http://127.0.0.1:<port>` and Read each PNG. Fix examples that are empty, clipped, too dark, unreadable or that do not show what the section is about. If a card draws outside itself (the slider drag badge), the demo is padded in `card-demo-runtime.js` `mountRoom`, not the example.
- Slider text fields without `zone` go in the first border cap; use `zone: track` for text over the track.

## Accuracy

Prose and tables are not schema-checked, and that is where wrong keys and defaults hid (the pilot fixed about 65). Before a page ships:

- **Check every table row, default, limit and key named in the text** against the schema (`src/cards/schemas/`) and the code that reads it. Where the schema's `default` or description disagrees with the code, the code wins; note the schema mismatch for the user (don't fix code unasked).
- **For a large page, use an agent per page** with this skill, `lines.md` as the model, and the instruction to cite file:line for every fact it changes. Re-check any surprising claim yourself before reporting it.
- Keep every existing fact unless the code proves it wrong. Drop performance numbers (triangle counts, KB, ms per frame) except on pages about model complexity ("Your Own Models").
- Report card bugs found on the way (a key the code ignores, a wrong schema default) to the user as a list; they decide.

## Moving headings

- When a heading moves to another page, add it to the old page's frontmatter `moved_anchors` (`old-id: /absolute/path#new-id`); the theme redirects old links. Keep slugs the same where a section moves whole.
- Update our own links: `src/editor/utils/yaml-docs-links.js`, editor docs links (grep `src/editor` for the URL), `demo/order.yaml` `docs:` paths, other doc pages and release notes. `npm run docs:build` fails on any missing `#anchor`.

## Checks

1. Add the page to `FORMATTED` in `tests/docs/docs-format.test.js` (block YAML, table shape, example before each key table).
2. `npm run build` (schema-checks every example, em dashes, "Home Assistant").
3. `npm run docs:build` (anchors), then `npm test` (doc links, moved anchors, `llms-full.txt` budget in `tests/docs/llms-txt.test.js`; raise it with a dated comment when a rework grows it).
4. `npx playwright test -c playwright.docs.config.js --project=built live-cards moved-anchors galler` (every colour resolves, no text drawn outside its card, the drag badge stays in view, cards render at a usable size). Live pages are found automatically.
5. **Reader test** on each new overview page: the `doc-coauthoring` skill, Stage 3 only.

## Rolling out

Work in batches of a few related pages, show the user each batch on the dev server, and wait for review before the next. Write what was done and what is next in `reports/handoffs/` for the following session.
