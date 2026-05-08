::: warning ⚠️ Work in Progress
LCARdS is a **hobby** project, not a fully commissioned Starfleet product — expect the occasional tribble.

Documentation is under continuous revision - it may not be fully complete and/or accurate to the current build of the project.  Please open an issue if you find any issues.

:::

# What is LCARdS?

![LCARdS Banner](/img/lcards-banner.gif)

**Build Star Trek LCARS-style dashboards in Home Assistant**
LCARdS brings many LCARS-style controls that can you can use to create interesting and interactive dashboards.

LCARdS originates from, and supersedes, the [CB-LCARS](https://github.com/snootched/cb-lcars) project. It is designed to accompany the [HA-LCARS theme](https://github.com/th3jesta/ha-lcars).


## What Makes It Different

[LCARdS Cards](../cards/) share a common set of core features, allowing for consistent features and interactivity across the system.

**State-aware styling** — cards change colour and style in response to HA entity state, individually or in coordinated groups via the [Rules Engine](../core/rules/).

**Templates everywhere** — many configuration fields accept entity state, attributes, theme tokens, data source values, JavaScript expressions, or Jinja2. [Learn more →](../core/templates/)

**Alert Mode** — respond to alert conditions by shifting the entire dashboard colour palette, play sounds, and activate an overlay card. [Learn more →](../core/alert-mode.md)

**Animations** — Anime.js v4 is built in; animate any element in response to interactions or entity state changes. [Learn more →](../core/animations.md)

**Data Sources** — subscribe to entities, buffer history, run processing pipelines (moving averages, min/max), and use the results in any card field or chart. [Learn more →](../core/datasources/)

## Next Steps

→ **[Installation](installation.md)** — install via HACS in under a minute

→ **[Coming from CB-LCARS?](cb-lcars-migration.md)** — feature mapping table