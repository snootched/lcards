---
description: A phone screen gets a portrait layout built from the guide, not a landscape gallery screen squeezed
tags: [design]
runs: 2
max_turns: 40
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

I want an LCARdS dashboard view for my phone (held upright) in the Star Trek: Picard style. I use the HA-LCARS "LCARS Picard [LCARdS Blue Accent]" theme. It should let me switch input_boolean.porch_light and input_boolean.garage_door and show sensor.outside_temperature and sensor.battery_level. Save the dashboard YAML (with a views: list) as phone.yaml.
