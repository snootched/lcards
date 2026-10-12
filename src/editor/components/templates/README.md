# LCARdS Template Components

Main Engineering > Templates, and the template sandbox it opens. User docs: `doc/core/templates/`.

## Files

| File | What it is |
|---|---|
| `lcards-template-evaluation-tab.js` | The tab: the shared launcher, then one row per config field that holds a template (path, template, live result with Jinja2, syntax mistakes). "Open in sandbox" loads the whole field; the sandbox's `template-save` writes it back through the editor's `_updateConfig`. |
| `lcards-template-sandbox.js` | The sandbox, on the studio shell: template editor, Insert chips, example picker and Context (entity + test values) on the left; result, "What it used" and a syntax reference on the right. Re-evaluates as you type, when an entity it uses changes and when a data source it uses updates. Footer: Copy template, Close, or "Save to <path>" when opened from a field. |
| `lcards-template-editor.js` | CodeMirror editor for one template: highlights template parts, completes them (Ctrl+Space, and after `{` `.` `:` `'` `"` `[`). Keeps typed keys from HA's one-key shortcuts and keeps an Escape that closed the list from closing the dialog. `flush()` sends a pending change now; `insert(text, caret)` inserts and opens completion. |
| `template-completions.js` | Pure: completion options for the text before the cursor (tokens, `states.<id>`, `ds:`, `theme:` paths, `variables.`, `config.`, Jinja2 entity arguments, `entity.attributes.` / `variables.` / `states['` in JavaScript). |
| `template-context.js` | Pure: the evaluator context a card uses (`templateContext`), test values over live ones (`withTestValues`, `parseTestValues`), what a template refers to (`templateRefs`), the fields with templates (`templateFields`), syntax mistakes, unresolved parts, and `withValueAt` for saving a field. |
| `template-examples.js` | The example picker's entries; each brings its own test values where it needs them. |

## Evaluation

Both the tab and the sandbox evaluate with `UnifiedTemplateEvaluator.evaluateAsync()` and the context from `templateContext()`, which mirrors `LCARdSCard.processTemplate()` (`entity`, `config`, `hass`, `states`, `variables`, `theme`, `displayFormat`). Keep them in step if the card's context changes.

Test values (sandbox only) are YAML: `entity:` (state and attributes), `states:` (other entities by ID), `ds:` (data source values), `variables:`. They replace live values for tokens and JavaScript; Jinja2 runs in Home Assistant and doesn't see them.

## Tests

- `tests/editor/template-tools.test.js`: context, test values, references, fields, mistakes, completion, examples.
- `tests/core/templates.test.js`: the evaluator, including `{theme:path}` tokens.
- `tests/ha/ha.spec.js` ("Templates:", "Template sandbox:"): the tab, Open in sandbox and Save to field, completion in real HA, every example resolving.
