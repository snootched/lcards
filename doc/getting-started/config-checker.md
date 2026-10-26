---
description: "Paste LCARdS YAML (a card, a view or a whole dashboard) and see every unknown option, misspelt name and invalid value, with its line and a link to the docs. Runs in your browser."
---

# Check Your Config

Paste your YAML below to diagnose any issues with LCARdS configs.

- **Works with:** one card, a view, or a whole dashboard.
- **Finds:** options that don't exist, misspelt keys, invalid animations and colour names, and values of the wrong kind.
- **Private:** this page runs in your browser - nothing is sent anywhere.

<ClientOnly>
  <ConfigChecker />
</ClientOnly>

## Where to get your YAML

- **One card:** open the card editor and switch to its **YAML** tab, then copy everything.
- **A whole dashboard:** **Edit dashboard > ⋮ > Raw configuration editor**, then copy everything.

## Reading the results

- **Errors** are things LCARdS will reject or ignore. Fix these.
- **Warnings** are names LCARdS doesn't know (a preset, animation, sound or theme colour), almost always a typo. The checker suggests the closest match. A warning about an older chart or data grid format means the config still works but can be updated.
- Each result shows the option's path and line, and links to the docs for that option.

## Pasting into Home Assistant's code editor

Home Assistant's own code editor (a card dialog's **Show code editor**, the raw configuration editor) reads a few unquoted words as `true` or `false`: `y`, `yes`, `on` become `true` and `n`, `no`, `off` become `false`, in any case. So `y: 20` arrives as `true: 20`, and `label: N` as `label: false`. Quote them there: `"y": 20`, `label: "N"`. The checker warns about each one (**Home Assistant's code editor reads...**). The LCARdS editor's own **YAML** tab reads them as written.

## Other ways to check

- **Ask Claude:** with the [LCARdS skill](ai-assistance#with-claude-easiest) loaded, paste your YAML and ask *"check this LCARdS config and fix it"*. Claude runs this same checker, explains each problem and gives you the corrected YAML.
- **Command line:** download [`lcards-validate.mjs`](/tools/lcards-validate.mjs) and run `node lcards-validate.mjs my-dashboard.yaml` (Node.js 20 or newer). Add `--json` for machine-readable output.
- **In Home Assistant:** each LCARdS card editor shows schema problems at the top of the editor as you edit.  It also offers advanced YAML edtitor tab with complete schema verification and lookups as you type.
