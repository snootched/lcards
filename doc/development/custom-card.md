# Building a Custom Card

!!! note "Placeholder"
    This page is a placeholder. Full content coming soon.

## Overview

All LCARdS cards extend a shared base class hierarchy:

```
LitElement
  └── LCARdSNativeCard   (low-level lifecycle, HASS bindings)
        └── LCARdSCard   (actions, templates, rules, presets)
              └── YourCard
```

## Getting Started

Prefer extending `LCARdSCard` for standard cards that need actions, templates, and rules integration.

Key files to consult:
- `src/base/LCARdSNativeCard.js`
- `src/base/LCARdSCard.js`
- `src/cards/button/` — reference implementation

## Related

- [Helpers API](helpers-api.md)
- [Core Architecture](../architecture/systems-arch.md)
