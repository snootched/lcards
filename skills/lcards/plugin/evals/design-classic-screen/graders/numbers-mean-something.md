---
type: regex
target: { source: file, path: living.yaml }
# Numbers mean something (lcars-design.md "Check a screen"): at most one decorative number
# cascade on a classic screen; the other numbers are the user's readings with labels.
pattern: 'data_mode:\s*decorative[\s\S]*data_mode:\s*decorative'
match: not_contains
---
