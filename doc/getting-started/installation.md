# Installation

## Requirements

There are no external dependencies or prerequisites for LCARdS. For the best visual experience, use [**HA-LCARS themes**](https://github.com/th3jesta/ha-lcars).

---

## Install via HACS

[![Open in HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=snootched&repository=LCARdS&category=frontend)

1. Open **HACS** in your Home Assistant instance
2. Search for **LCARdS**
3. Install the repository
4. Hard-refresh your browser (`Ctrl+Shift+R`) to clear the cache

!!! tip "Quick Start Sequence"
    - Open HACS — *Clear All Moorings and Open Starbase Doors*
    - Search for **LCARdS** — *Thrusters Ahead, Take Us Out*
    - Install and hard-refresh — *Bring Warp Core Online, Engines to Full Power*
    - Build your first dashboard — *Engage!*

---

## Enable the LCARdS Config Panel

The **LCARdS Config Panel** is a standalone sidebar entry in Home Assistant — a central hub for managing LCARdS settings - setup helpers, customize Alert Modes, configure Sounds, and more.

Add the following to `configuration.yaml` and restart Home Assistant:

```yaml
panel_custom:
  - name: lcards-config-panel
    sidebar_title: LCARdS Config
    sidebar_icon: mdi:space-invaders
    url_path: lcards-config-panel
    module_url: /hacsfiles/lcards/lcards.js
```

See [LCARdS Config Panel](../configuration/config-panel.md) for full details.

---

## Next Steps

- [What is LCARdS?](what-is-lcards.md) — understand the architecture
- [The Cards](../cards/index.md) — start with the Button card
- [Coming from CB-LCARS](cb-lcars-migration.md) — quick feature mapping if migrating
