# Adding a Card Option

A card option (a YAML key) lives in up to eight places: the schema, the runtime that reads it, the editor, the docs example and table, the published schema, the config checker's registries, and the tests. They drift when one changes alone. A key the schema doesn't declare fails the strict doc example check and never reaches the published schema; a schema stricter than the runtime rejects configs that work, both in the card (runtime validation in `CoreValidationService`) and in `npm run validate:config`; an editor field without a schema node renders wrong. Change them together, in the order below. The same steps apply to changing what values a key accepts, and to renaming or removing one.

::: tip Claude Code
The same procedure is the `lcards-card-option` project skill (`.claude/skills/lcards-card-option/SKILL.md`), which Claude Code loads for this kind of change.
:::

Read `.github/instructions/cards.instructions.md` before touching the card and `.github/instructions/editor.instructions.md` before touching the editor.

## 0. Find every place the key lives

- **Runtime reads**: `grep -rn "<key>" src/` (the card, its base classes, `src/core/`).
- **Schema**: the card's `src/cards/schemas/<card>-schema.js`. Keys every card shares are in `common-schemas.js` (`cardLevelProperties` for rules, sounds, variables and zones; `cardWidthSchema`, `animationSchema`, `actionSchema`, ...). MSD is `msd-schema.js`, the layout card and view `layout-card-schema.js`, the shell strategy `shell-strategy-schema.js`. `scripts/lib/card-schemas.js` lists them all.
- **Editor**: `src/editor/cards/lcards-<card>-editor.js`, and any Studio dialog that edits the key (`src/editor/dialogs/`).
- **Option lists**: values the runtime passes into a schema factory (text positions, built-in presets, components) come from `src/cards/schemas/schema-options.js` and `BUILTIN_OPTIONS` in `scripts/lib/card-schemas.js` at build time; keep both sides on the same list.

## 1. Check the name on every card

**A new key, or a new shape for an existing idea, uses the words the other cards already use for the same thing.** A binding once shipped as `{ entity, range, to }` beside the `{ entity, input, output }` that `map_range` uses everywhere else; `tests/docs/schema-vocabulary.test.js` now catches that one.

- Search every schema for the idea, not only this card's: `grep -rn "<word>" src/cards/schemas/` with likely synonyms (range / input, to / output, entity / entity_id, colour / color). For a broad idea (a binding, an action, a size, a colour list) read the published schema, `doc/public/lcards-schema.json` (`npm run generate:llm-schema`).
- Reuse the name, the shape, the nesting and the default where the meaning is the same. Additions are fine; a different word for the same thing is not.
- If two cards already disagree, or the right name differs from what exists, settle it with the maintainer before writing code.

The established words:

| Idea | Words |
|---|---|
| Map an entity's number onto a setting | `entity`, `attribute`, `input: [low, high]`, `output: [low, high]`, `clamp` (`map_range` in animations and background animations, the rules' `map_range_cond`, astrometrics settings) |
| One colour, or a list picked per item | `color`, `colors` (`colors` wins) |
| Templates | `[[[ JavaScript ]]]`, `{{ Jinja2 }}`, `{entity.state}` tokens |
| Actions | `tap_action`, `hold_action`, `double_tap_action`, each with `action:` |
| A seeded random layout | `seed` (an integer, never bound to an entity) |
| A named bundle of defaults the user's keys override | `preset`, never `style` |
| Style properties | `style: { ... }` (an object), never a string name |
| What is drawn (a structural variant) | `shape`, `type`, `render`, `mode` |
| A sub-part's settings | Nested under the part: `coma: { size, color }`, `edges: true \| false \| { width, color }`; not `<part>_<setting>`. The body's own settings stay flat (`radius`, `count`, `opacity`) |
| A part's colour | `color` / `colors` under the part, never `<part>_color` (params of released background presets keep their old names) |

When a new shared word is settled, add a check for it to `schema-vocabulary.test.js`.

## 2. Schema

**The schema is the contract: it models exactly what the runtime accepts, no stricter and no looser.**

```javascript
// src/cards/schemas/<card>-schema.js, inside properties
gap: {
    type: 'number',
    minimum: 0,
    default: 4,
    description: 'Space between the option buttons, in px. Default: 4.',
    'x-ui-hints': {
        label: 'Gap',
        helper: 'Space between the buttons, in pixels.',
        selector: { number: { min: 0, max: 40, mode: 'box', unit_of_measurement: 'px' } }
    }
},
```

- **Read the consumer first.** Is a number turned into px? Does a string go straight into CSS? What happens when the key is missing? If the runtime has a default, the key is not `required`.
- **Every property has a `description`**: units, the default and what each value does. `npm run validate:schema-descriptions` (inside `npm run build`) fails on a new property without one; the descriptions are published. No em dashes; "Home Assistant" in full.
- **Editor widget**: `x-ui-hints` carries `label`, `helper` and a `selector` (any Home Assistant selector: `entity`, `number`, `select`, `boolean`, `icon`, ...); `FormField` builds the field from it. For an `enum`, add `enumDescriptions` when the value names aren't obvious.
- **Templates bypass `pattern`.** Strings with `{{ }}` or `[[[ ]]]` skip `pattern` both in ajv and in `CoreValidationService`; don't add a pattern that would reject them.
- **No top-level `anyOf` / `oneOf` on an object.** `CoreValidationService` then validates only the branches and skips `properties`. Express "one of these keys is required" in `scripts/lib/config-validator.js` instead (MSD's `base_svg` or `view_box` is the example).
- **Shared keys** go in `common-schemas.js` and are spread into each card schema, so every card gets the same node.

## 3. Runtime and editor

- **Runtime.** Read the value the way the card reads its other options, with the card's helpers: `_configPx()` for sizes, `_resolveEntityStateColor()` / `_resolveColorValue()` for colours (never a local colour parser), `subscribeToEntity()` for an entity (it also makes the entity's changes reach the core), `theme:` tokens for defaults. See [Building a Custom Card](custom-card.md).
- **Editor.** Add the field next to similar options with `FormField.renderField(this, 'path.to.key')`; it reads the schema node, so label, helper and selector come from `x-ui-hints`. Pass overrides only when the field needs something the schema can't say (`selectorOverride`). Values commit through `_setConfigValue()` / `_updateConfig()`, never by assigning `this.config`. A Studio dialog that edits the same key needs the same field. See [Building a Studio Editor](building-an-editor.md).

## 4. Renames, removals and new values

**Whether the key has been released decides how a rename works.**

- **Not released yet** (only on `dev`, in no published release): rename it outright across schema, runtime, editor, docs, demo views and tests. No alias, no deprecation.
- **Released** (in a published release, see the tags and `doc/releases/`): keep the old key in the schema with `deprecated: true` and `'x-replacement': 'new.key'`. It still validates, the checker warns, and it drops out of the published schema. If old configs need rewriting, add a migration like `src/charts/chart-config-migration.js` and flag the old format in `scripts/lib/config-validator.js` (code `legacy-format`).
- **A new accepted value** (a preset, position, type): extend the enum or the option list the schema factory receives, and the registry if it is a name (next step).

## 5. Names that must exist

**A value that names something from a registry is checked by name, beyond the schema.** Presets, animation and background presets, filters, sound assets and events, MSD backgrounds, theme tokens, `--lcars-*` / `--lcards-*` variables, components and astrometrics names all are: `registryIssues()` in `scripts/lib/config-validator.js` checks them against `buildRegistries()` in `scripts/lib/registries.js`, which reads the same modules the runtime registers from. They are published as `schema/registries.json`.

- A new value of an existing kind is picked up automatically when it lives in the module the registry reads (a button preset in `style-presets/buttons/index.js`).
- A new kind of name gets a list in `buildRegistries()` and a check in `registryIssues()`. Unknown names are warnings, not errors, because packs can add names at runtime.
- Add a case to `tests/docs/config-validator.test.js` for the new check.

## 6. Docs

- **The option table** on the card's reference page (`doc/cards/<card>/...`): a Key / Type / Default / Description row whose type and default match the schema and the code exactly.
- **A YAML example** that uses the key, in block style. `npm run build` validates every example strictly (schema, unknown keys, registry names), so the example proves the schema accepts the key. Use ` ```yaml live ` when the result is visible (the button, elbow, slider, select menu and MSD examples render real cards) and the sample entities the other examples use. Never mark a block `no-validate` to get past the validator: fix the schema.
- User pages follow the house format (`.claude/skills/lcards-docs-writer/SKILL.md`); `tests/docs/docs-format.test.js` guards the pages already in it.
- A demo view in `demo/views/` when the option is worth showing.
- Release notes are written once per release, from the commits; there is nothing to add for them now.

## 7. Tests

- **Behaviour**: a node test under `tests/` for pure logic, or a browser fixture `tests/browser/fixtures/<card>-<case>.yaml` with an assertion in `tests/browser/*.spec.js` for rendering (run `npm run build` first).
- **Schema against runtime**: if the change fixed a mismatch, add the config that used to fail to `tests/docs/config-validator.test.js` (the "schema fixes found by checking real configs" test) or to `tests/core/validation-*.test.js` (`CoreValidationService`).
- **Editor fields** are checked by hand in Home Assistant; `FormField` rendering has no automated test.

See [Testing](testing.md) for the layers.

## 8. Check

1. `npm run build`: strict doc examples (with registry names), schema descriptions, CSS variables, the Home Assistant compatibility lint, typecheck and the bundle.
2. `npm test`, and `npm run test:browser` if rendering changed.
3. `npm run validate:config -- <a YAML file using the key>`: no errors.
4. `npm run docs:build` when docs changed (dead links and `#anchors`), and `npm run test:docs` for `yaml live` examples.
5. If you filled description gaps from the backlog, tighten it: `npm run validate:schema-descriptions:update`.

Run these one at a time: the test suites, the doc validator and the build are memory-heavy. The full list of commands is in `COOKBOOK.md` ("npm scripts" and "Tests") in the repository root.

## Related

- [Building a Custom Card](custom-card.md)
- [Config Manager](../architecture/subsystems/config-manager.md): how presets, theme and user config merge
- [Validation Service](../architecture/subsystems/validation-service.md): runtime schema validation
- [Type Checking](typescript.md)
