---
description: "Paste LCARdS YAML (a card, a view or a whole dashboard) and see every unknown option, misspelt name and invalid value, with its line and a link to the docs. Runs in your browser."
---

# Check Your Config

**Paste your YAML below to find what LCARdS won't understand: options that don't exist, misspelt names and values of the wrong kind.** A config LCARdS doesn't understand is mostly ignored without a word, so a typo often looks like a bug.

- **Works with** one card, a view, or a whole dashboard: it finds every LCARdS card in it, at any depth.
- **Private:** this page runs in your browser, and nothing is sent anywhere.

<ClientOnly>
  <ConfigChecker />
</ClientOnly>

## Where to get your YAML

**Copy it from a card's code editor or from the dashboard's raw configuration.**

- **One card:** open the card editor and switch to its **YAML** tab, then copy everything.
- **A whole dashboard:** **Edit dashboard > ⋮ > Raw configuration editor**, then copy everything.

## Reading the results

**Errors are things LCARdS rejects or ignores; warnings are names it doesn't know.** Each result shows the option's path and line, and links to the docs for that option.

- **Errors:** invalid values, keys LCARdS doesn't have, an MSD with nothing to draw on. Fix these.
- **Warnings:** a preset, animation, sound or theme token LCARdS doesn't have, or a misspelt `var(--lcars-*)` or `var(--lcards-*)` colour, almost always a typo; the checker suggests the closest match. A name from a content pack of your own also shows as a warning, and is fine.
- A warning about an older chart or data grid format means the config still works but can be updated.

## Pasting into Home Assistant's code editor

**Home Assistant's own code editor reads a few unquoted words as `true` or `false`, so quote them there.** That is the editor in a card dialog's **Show code editor** and the raw configuration editor.

- `y`, `yes` and `on` become `true`, and `n`, `no` and `off` become `false`, in any case. So `y: 20` arrives as `true: 20`, and `label: N` as `label: false`.
- Quote them: `"y": 20`, `label: "N"`. The checker warns about each one (**Home Assistant's code editor reads...**).
- The LCARdS editor's own **YAML** tab reads them as written.

## Other ways to check

**The same checker runs in Claude, on the command line and in the card editors.**

- **Ask Claude:** with the [LCARdS skill](ai-assistance#with-claude-easiest) loaded, paste your YAML and ask *"check this LCARdS config and fix it"*. Claude runs this same checker, explains each problem and gives you the corrected YAML.
- **Command line:** download [`lcards-validate.mjs`](/tools/lcards-validate.mjs) and run `node lcards-validate.mjs my-dashboard.yaml` (Node.js 20 or newer). `--json` gives machine-readable output, `--strict` makes warnings fail too, and `-` reads the YAML from standard input. It also reads Home Assistant's `.storage/lovelace*` files.
- **In Home Assistant:** each LCARdS card editor shows schema problems at the top as you edit, and its **YAML** tab checks against the full schema, with lookups, as you type.
