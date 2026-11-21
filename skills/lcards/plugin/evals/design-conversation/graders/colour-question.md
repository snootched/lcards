---
type: llm
---

SKILL.md (Workflow step 1) asks every new design how colours should work before building, because changing it later means editing every card. Without the skill, Claude doesn't know to ask.

PASS if the answer asks the user how colours should work and offers the choice between colours that follow entity state (the theme's on, off and unavailable colours), colours picked by hand, or a mix of the two.

FAIL if it doesn't ask about colours, or only asks which theme, palette or era the user likes without the state versus by-hand choice.
