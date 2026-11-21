---
type: llm
---

PASS if the answer gives a markdown card with `uix:` and a `class:` of header-left, header-right, header-contained or header-open, and for the LCARdS screen suggests an LCARdS card (such as custom:lcards-elbow) rather than putting the HA-LCARS class on it.
FAIL if it uses `card_mod:` as the recommended key, invents a class name, or says the HA-LCARS class is how LCARdS cards get their header shape.
