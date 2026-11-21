---
description: A whole Picard-style screen follows the design guide - layout view, theme roles, Picard patterns, no hard-coded colours
tags: [design]
runs: 2
max_turns: 40
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

I use HA-LCARS with the "LCARS Picard [LCARdS Red Accent]" theme. Build me a full-screen LCARdS engineering dashboard view in the Star Trek: Picard style, like the USS Titan consoles. My entities: input_boolean.warp_core, input_boolean.main_lights, input_number.power_level and input_number.shield_strength. Save the dashboard YAML (with a views: list) as engineering.yaml.
