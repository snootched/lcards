---
description: "Paste LCARdS YAML (a card, a view or a whole dashboard) and see every unknown option, misspelt name and invalid value, with its line and a link to the docs. Runs in your browser."
---

# Check Your Config

Paste your YAML below to find the mistakes LCARdS would otherwise silently ignore.

- **Works with:** one card, a view, or a whole dashboard.
- **Finds:** options that don't exist, misspelt preset, animation and colour names, and values of the wrong kind.
- **Private:** it runs in your browser. Nothing is sent anywhere.

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

## Other ways to check

- **Ask Claude:** with the [LCARdS skill](ai-assistance#with-claude-easiest) loaded, paste your YAML and ask *"check this LCARdS config and fix it"*. Claude runs this same checker, explains each problem and gives you the corrected YAML.
- **Command line:** download [`lcards-validate.mjs`](/tools/lcards-validate.mjs) and run `node lcards-validate.mjs my-dashboard.yaml` (Node.js 20 or newer). Add `--json` for machine-readable output.
- **In Home Assistant:** each LCARdS card editor shows schema problems at the top of the editor as you edit.
