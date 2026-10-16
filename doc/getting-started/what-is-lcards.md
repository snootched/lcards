---
description: "What LCARdS is: LCARS-style cards, a layout view and a shell dashboard for Home Assistant, with themes, rules, data sources, animations, sounds and alert modes, and how the pieces fit together."
---

# What is LCARdS?

![LCARdS Banner](/img/lcards-banner.gif)

**Build Star Trek LCARS-style dashboards in Home Assistant.**

LCARdS is a set of LCARS cards (buttons, elbows, sliders, charts, data grids, ship displays and more) that work together as one system. It is designed to pair with the [HA-LCARS theme](https://github.com/th3jesta/ha-lcars).

## How it works

Three layers, plus a small integration running inside Home Assistant.

<HowItWorks />

## What that gives you

- **Colours that follow state:** a button lights up when its light is on, a reading turns red past a threshold. No automations needed.
- **One look everywhere:** every card takes its colours, fonts and sizes from the same theme, so the whole screen matches.
- **Screen-wide reactions:** [rules](../core/rules/) restyle many cards at once, and [alert mode](../core/alert-mode) repaints the whole dashboard.
- **Live values anywhere:** put a sensor value, a smoothed reading or a [template](../core/templates/) in any label.
- **Motion and sound:** [animations](../core/animations) and LCARS [sounds](../core/sounds) on taps and state changes.
- **Control from automations:** [actions](../configuration/ha-actions) like `lcards.red_alert` work from scripts, automations and voice.

## Next steps

1. **[Install LCARdS](installation)**: through HACS, in a few minutes.
2. **[Build a dashboard](building-dashboards)**: pick cards and lay out a screen.
3. **[Browse the gallery](dashboard-gallery)**: copy a complete dashboard and make it yours.
4. **[Get AI help](ai-assistance)**: let an assistant write the YAML for you.

::: info A hobby project
LCARdS is a fan-made hobby project, not a fully commissioned Starfleet product: expect the occasional tribble. If something in these docs doesn't match what you see, please [open an issue](https://github.com/snootched/lcards/issues).
:::
