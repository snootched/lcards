---
type: llm
---

The user gave a vague request and no entity ids, so the skill should talk it through before building (SKILL.md, Workflow steps 1 and 2).

PASS if the answer does both:
- asks the user something it needs to build the screen (their entities or devices, where it runs, the look or theme, or how colours should work), and
- suggests what the screen could do with at least two concrete LCARdS features (for example alert modes, animations, sounds, screen effects, rules, background animations, an MSD, an astrometrics scene, charts, gauges), ideally as two or three concepts to choose from.

FAIL if it writes a finished dashboard with made-up entity ids without asking anything, or only asks questions with no suggestions of what is possible.
