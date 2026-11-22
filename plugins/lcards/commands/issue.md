---
description: Draft an LCARdS bug report or feature request with you, ready to paste into the GitHub form (never files it)
argument-hint: "[what went wrong, or the feature you want]"
---

Use the `lcards` skill's "Reporting a problem or a feature request" section to help the user write a report the maintainer can verify, fix and test. Their description: $ARGUMENTS

1. **Bug or feature?** If it isn't clear, ask with the AskUserQuestion tool.
2. **For a bug, rule out the config first:** ask for the YAML (or the file), save it to a `.yaml` file and run `node "${CLAUDE_PLUGIN_ROOT}/skills/lcards/scripts/lcards-validate.mjs" <file>`; read the card's page under `references/docs/cards/`. Ask the user to run the health check (LCARdS panel, Welcome, Support & system info). If the cause turns up, fix it and stop: no report is needed.
3. **Existing issue:** ask whether they found one at https://github.com/snootched/LCARdS/issues; if one matches, draft a comment for it instead.
4. **Minimal repro:** cut the YAML down to the smallest that still shows the problem (the whole view when it's about layout), with helpers in place of real devices and no personal names, addresses, tokens or IPs. Run the checker on it.
5. **Ask for what only the user has:** versions, browser, the support info from **Report an issue** or **Copy support info** in the panel, console errors, the last version that worked, any workaround. Never fill these in yourself.
6. **Write the draft** in the form's sections and order: card type, LCARdS version, Home Assistant version, support info, browser, what happened (expected, then actual: facts only), steps to reproduce, card YAML, console output, additional context (last working version, workaround, and a suspected cause only as **"Guess, not confirmed:"**, never a code fix). A feature request: what they want to do and why, what they do today, what would help.
7. **Hand it over** as markdown and tell the user to open the form with **Report an issue** in the LCARdS panel (it prefills versions and support info) or at https://github.com/snootched/LCARdS/issues/new/choose, paste the sections, review and submit. Never create the issue yourself (no `gh issue create`, no GitHub tools).
