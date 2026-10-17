---
name: lcards-card-option
description: Add, change, rename or remove an LCARdS card/view/strategy config option (a YAML key) end to end: schema, runtime, editor, docs example, published schema, registries and tests together. Use when the user asks to add a new option or key to a card, change what values an option accepts, rename or deprecate a key, support a new value (preset, type, position), or fix "the schema/editor/docs don't know key X".
---

# LCARdS card option change

A config key lives in up to eight places. They drift when one is changed alone: an undeclared key fails strict doc validation and the published schema (so LLMs never learn it), a schema stricter than the runtime rejects working configs at runtime validation (CoreValidationService) and in `npm run validate:config`, and an editor field without a schema node renders wrong. Change them together, in this order. Read `.github/instructions/editor.instructions.md` (FormField) and `cards.instructions.md` first if you touch the editor or the card.

Never commit, stage or push unless the user asks. Never claim it works in HA; give test steps.

## 1. Find every place the key lives

- `grep -rn "<key>" src/` for the runtime reads (the card, its base classes, `src/core/`), the editor (`src/editor/cards/lcards-<card>-editor.js`, studios in `src/editor/dialogs/`) and the schema.
- Which schema: the card's `src/cards/schemas/<card>-schema.js`; keys every card shares are in `common-schemas.js` (`cardLevelProperties`, `cardWidthSchema`, `animationSchema`, ...); MSD in `msd-schema.js`; layout card and view in `layout-card-schema.js`; the shell strategy in `shell-strategy-schema.js`. All are listed in `scripts/lib/card-schemas.js`.
- Option lists the runtime passes into a schema factory (positions, presets, components) come from `scripts/lib/card-schemas.js` `BUILTIN_OPTIONS` and `src/cards/schemas/schema-options.js` at build time; keep both sides on the same list.

## 2. Schema (the contract)

- Model exactly what the runtime accepts, no stricter and no looser: read the code that consumes the value (a number becomes px? a string goes straight into CSS? a default when missing?). If the runtime defaults it, don't make it `required`.
- Every property gets a `description` (`npm run validate:schema-descriptions` fails otherwise); say units, the default and what each value does. No em dashes.
- Editor widget: `x-ui-hints.selector` on the schema node (FormField derives the field from it). Enums: `enum` plus `enumDescriptions` where the names aren't obvious.
- Template strings (`{{ }}`, `[[[ ]]]`) bypass `pattern` (both in ajv and CoreValidationService); don't add a pattern that rejects them.
- Avoid a top-level `anyOf`/`oneOf` on an object schema: CoreValidationService then validates only the branches and skips `properties`. Express "one of these keys is required" in `validate-doc-examples` / `config-validator.js` instead (see MSD's base_svg or view_box).
- Rename or removal: keep the old key with `deprecated: true` and `'x-replacement': 'new.key'` (it still validates, warns, and drops out of the published schema); if old configs need rewriting, add a migration like `src/charts/chart-config-migration.js` and flag it in `config-validator.js` (legacy-format).

## 3. Runtime and editor

- Read the value the way the card's existing options are read; use the card's existing patterns (`_resolveColorValue`, `subscribeToEntity`, `_configPx`). Colours go through `resolveColor` (CLAUDE.md).
- Editor: add a `FormField.renderField(this, 'path.to.key')` where similar options are; commit with `_updateConfig` / `_setConfigValue`. Studios that edit the key need the same.

## 4. Names that must exist

If the value names something from a registry (a preset, animation or background preset, filter, sound asset, MSD background, theme token, component): it is checked by `registryIssues()` in `scripts/lib/config-validator.js` against `scripts/lib/registries.js`. A new kind of name gets a list in `buildRegistries()` and a check in `registryIssues()` (warnings: user packs can add names), plus a case in `tests/docs/config-validator.test.js`.

## 5. Docs

- The card's reference page (`doc/cards/<card>/...`): the option table row and a YAML example. Examples are validated strictly by `npm run build` (unknown keys, schema, registry names), so the example proves the schema accepts it. Use `yaml live` when the result is visible (button, elbow, slider, select menu, MSD render real cards); use sample entities from existing examples.
- Don't mark a block `no-validate` to get past the validator; fix the schema instead.
- A new user-visible option goes into the release notes later (the `lcards-release-notes` skill picks it up from the commit).

## 6. Tests

- Runtime behaviour: a node test in `tests/` (pure logic) or a browser fixture in `tests/browser/fixtures/<card>-<case>.yaml` with an assertion in `tests/browser/*.spec.js` (rendering; run `npm run build` first).
- Schema vs runtime: if the change fixed a mismatch, add the config that used to fail to `tests/docs/config-validator.test.js` ("schema fixes found by checking real configs") or `tests/core/validation-*.test.js` (CoreValidationService).
- New editor field: check it in HA; FormField tests aren't automated.

## 7. Check

1. `npm run build` (strict doc examples incl. registry names, schema descriptions, CSS vars, HA compat, the bundle).
2. `npm test`; `npm run typecheck` (zero errors); `npm run test:browser` if rendering changed.
3. `npm run validate:config -- <a yaml using the key>`: no errors.
4. `npm run docs:build` when docs changed (links, anchors); `npm run test:docs` for `yaml live` examples.
5. If you filled description gaps, tighten the baseline: `npm run validate:schema-descriptions:update`.

## 8. Report

What changed in each place (schema, runtime, editor, docs, registries, tests), anything that couldn't be verified outside HA with test steps for the user, and a commit message.
