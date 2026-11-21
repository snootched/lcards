---
type: llm
---

PASS if the answer identifies all three LCARdS problems (the preset should be `lozenge`, the key should be `color` not `colour`, the variable should be `--lcars-ui-primary`) and tells the user that card-mod no longer works with current Home Assistant, so the `card_mod:` block should become `uix:` (with UIX installed).
FAIL if it misses any of the three, or leaves `card_mod:` as the recommendation.
