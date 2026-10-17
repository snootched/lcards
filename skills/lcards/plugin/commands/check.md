---
description: Check LCARdS YAML (a file, or YAML pasted after the command) and explain every problem
argument-hint: "[file.yaml, or paste YAML]"
---

Use the `lcards` skill to check this LCARdS configuration: $ARGUMENTS

1. If the argument is a path, check that file. If it is YAML, save it to a temporary `.yaml` file first. If there is no argument, ask for the file or the YAML.
2. Run `node "${CLAUDE_PLUGIN_ROOT}/skills/lcards/scripts/lcards-validate.mjs" <file>`.
3. Explain each error and warning in plain words at its path, and why it fails (look the key up in the card's schema under the skill's `references/schema/`). A `var(--lcars-...)` warning names an HA-LCARS variable: check it in `references/ha-lcars/variables.md`.
4. Give the corrected YAML, run the checker on it again, and repeat until it reports no errors and no warnings you can't explain. Edit the user's file only if they ask.
