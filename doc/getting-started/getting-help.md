# Getting Help

Something not working? LCARdS can check your setup and gather everything needed to diagnose a problem.

## 1. Run the health check

Open the **LCARdS** sidebar panel → **Welcome** tab → **Support & system info**.

The checklist covers the most common causes of problems:

| Check | What it means |
|---|---|
| **Home Assistant version** | LCARdS requires Home Assistant **2026.10** or newer. |
| **Frontend = integration version** | If these differ, your browser is running a cached copy of an older LCARdS. Hard-refresh (Ctrl+Shift+R / Cmd+Shift+R), or clear the companion app's frontend cache. If you just updated, restart Home Assistant. |
| **UI eXtension (UIX) / card-mod** | HA-LCARS styles Home Assistant through [UIX](https://github.com/Lint-Free-Technology/uix). **card-mod** no longer works with current Home Assistant and conflicts with UIX. Uninstall it in HACS and remove its `extra_module_url` line from `configuration.yaml`. |
| **card-mod in `extra_module_url`** | A leftover `frontend: extra_module_url` entry still loads card-mod. Remove it and restart. |
| **Lovelace resources** | LCARdS loads itself through the integration. An old manually added resource (e.g. `/hacsfiles/lcards/lcards.js`) or a duplicate loads it twice. Remove extras under **Settings → Dashboards → ⋮ → Resources**. |
| **HA-LCARS theme** | Shows whether an HA-LCARS theme is active. LCARdS works without it, but it is designed to pair with it. |

Resource and `extra_module_url` checks need an **admin** user.

## 2. Report an issue

Still stuck? In the same section:

- **Report an issue** opens a GitHub bug report with your LCARdS version, Home Assistant version and support info already filled in. It also copies the full info to your clipboard. Review the form, describe the problem, add your card YAML, then submit. Nothing is sent automatically.
- **Copy support info** copies the same information, to paste into an existing issue or a [Discussion](https://github.com/snootched/LCARdS/discussions).
- Tick **Include data-source names & entity IDs** only if the problem involves data sources.

Expand **Preview what will be shared** to see exactly what is included. That means versions, browser, theme, UIX/card-mod status, integration options and the most recent LCARdS warnings. Those warnings can mention entity names, so review before sharing.

::: tip Please use the template
Issues need the bug report template so we have the versions and environment we need. Issues opened without it are labelled `needs-template`. Edit the issue to add the template sections, or use **Report an issue**.
:::

## Other ways to collect info

**Download diagnostics**, Home Assistant's standard diagnostics file:
**Settings → Devices & services → LCARdS → ⋮ → Download diagnostics**. It contains the same backend facts plus Home Assistant's own system information.

**Browser console** (F12 → Console):

```javascript
window.lcards.info()                    // quick summary
await window.lcards.support.copy()      // copy full support info to the clipboard
await window.lcards.support.openIssue() // copy + open a pre-filled bug report
await window.lcards.support.collect()   // raw support data (object)
```

Pass `{ includeConfig: true }` to the `support.*` calls to include data-source names and entity IDs.
