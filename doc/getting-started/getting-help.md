---
description: "Something not working in LCARdS? Check your config, run the health check in the LCARdS Config panel, look through common problems, then report an issue with your support info filled in."
---

# Getting Help

**Something not working? Work through these in order: most problems are a config typo or a setup issue, and both are quick to rule out.**

## 1. Check your config

**Paste your card YAML (or the whole dashboard) into [Check Your Config](config-checker), and fix what it reports first.** A config LCARdS doesn't understand is mostly ignored without a word, which often looks like a bug.

- It finds options that don't exist, misspelt preset, animation and colour names, and values of the wrong kind, each with its line and a suggestion.
- Using Claude with the [LCARdS skill](ai-assistance#with-claude-easiest)? Paste the YAML and ask it to check and fix it.

## 2. Run the health check

**Open the LCARdS Config panel in the sidebar, then Welcome > Support & system info.** Its checklist covers the most common causes of problems, each with a fix.

- The resource and `extra_module_url` checks need an **admin** user.

| Check | What it means |
|---|---|
| **Home Assistant version** | LCARdS requires Home Assistant **2026.11** or newer. |
| **Integration responding** | The cards loaded but the LCARdS integration did not answer. Add or repair it under **Settings > Devices & services**, then restart. |
| **Frontend = integration version** | If these differ, your browser is running a cached copy of an older LCARdS. Hard-refresh (Ctrl+Shift+R / Cmd+Shift+R), or clear the companion app's frontend cache. If you just updated, restart Home Assistant. |
| **Safe or recovery mode** | Home Assistant started in safe or recovery mode, so custom integrations may not load. Restart it normally. |
| **UI eXtension (UIX) / card-mod** | HA-LCARS styles Home Assistant through [UIX](https://github.com/Lint-Free-Technology/uix). **card-mod** no longer works with current Home Assistant and conflicts with UIX: uninstall it in HACS and remove its `extra_module_url` line from `configuration.yaml`. An HA-LCARS theme without UIX is flagged too. |
| **card-mod in `extra_module_url`** | A leftover `frontend: extra_module_url` entry still loads card-mod. Remove it and restart. |
| **custom:layout-card** | Shown when `custom:layout-card` is installed. LCARdS cards can shrink inside it; switch to the LCARdS [Layout Card](../cards/layout-card/). |
| **Lovelace resources** | LCARdS loads itself through the integration. An old manually added resource (e.g. `/hacsfiles/lcards/lcards.js`) or a duplicate loads it twice. Remove extras under **Settings > Dashboards > ⋮ > Resources**. |
| **HA-LCARS theme** | Shows whether an HA-LCARS theme is active. LCARdS works without it, but it is designed to pair with it. |

## 3. Common problems

**Most reports come down to one of these.**

- **Cards collapse or margins look wrong inside `custom:layout-card`:** use LCARdS's own [Layout Card](../cards/layout-card/) instead. Change the `type` to `custom:lcards-layout-card` and remove `layout_type`; the rest of the config stays the same. See [Sizing inside `custom:layout-card`](../cards/common#inside-custom-layout-card).
- **Cards look out of date after an update:** hard-refresh the page (Ctrl+Shift+R / Cmd+Shift+R) or clear the companion app's frontend cache.
- **Styling from card-mod stops working:** card-mod no longer works with current Home Assistant; HA-LCARS uses [UIX](https://github.com/Lint-Free-Technology/uix) instead. Remove card-mod.
- **Moving over from CB-LCARS?** See [Coming from CB-LCARS](cb-lcars-migration) for the equivalent of each card.

## 4. Report an issue

**Still stuck? Report an issue, in the same Support & system info section, opens a GitHub bug report with your versions and support info already filled in.** It also copies the full info to your clipboard. Review the form, describe the problem, add your card YAML, then submit: nothing is sent automatically.

- **Copy support info** copies the same information, to paste into an existing issue or a [Discussion](https://github.com/snootched/LCARdS/discussions).
- Tick **Include data-source names & entity IDs** only if the problem involves data sources.
- Expand **Preview what will be shared** to see exactly what is included: versions, browser, theme, UIX and card-mod status, integration options and the most recent LCARdS warnings. Those warnings can mention entity names, so review before sharing.

::: tip Please use the template
Issues need the bug report template so we have the versions and environment we need. Issues opened without it are labelled `needs-template`. Edit the issue to add the template sections, or use **Report an issue**.
:::

## Other ways to collect info

**Home Assistant's diagnostics file and the browser console give the same facts.**

- **Download diagnostics**, Home Assistant's standard diagnostics file: **Settings > Devices & services > LCARdS > ⋮ > Download diagnostics**. It contains the same backend facts plus Home Assistant's own system information.
- **Browser console** (F12, then Console): the calls below. Pass `{ includeConfig: true }` to the `support.*` calls to include data-source names and entity IDs.

```javascript
window.lcards.info()                    // quick summary
await window.lcards.support.copy()      // copy full support info to the clipboard
await window.lcards.support.openIssue() // copy + open a pre-filled bug report
await window.lcards.support.collect()   // raw support data (object)
```
