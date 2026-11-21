---
description: Runs the checker on pasted YAML and fixes LCARdS, HA-LCARS and card-mod problems
tags: [checker, ha-lcars, uix]
runs: 2
max_turns: 25
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

This card doesn't look right on my HA-LCARS dashboard. What's wrong with it? Give me the fixed YAML.

```yaml
type: custom:lcards-button
entity: light.desk
preset: lozange
text:
  name:
    colour: black
style:
  card:
    color:
      background:
        active: var(--lcars-ui-primery)
card_mod:
  style: |
    :host { opacity: 0.9; }
```
