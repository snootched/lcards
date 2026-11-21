---
type: regex
target: { source: file, path: phone.yaml }
# An MSD's leader lines leave their labels from the side (left or right; a bracket's
# top or bottom corner is fine) and bend with a curve, never a square corner
# (lcars-patterns.md, Labelled schematic). Passes when the screen has no MSD.
pattern: 'anchor_side:\s*["'']?(top|bottom)["'']?\s*\n|corner_style:\s*["'']?miter'
match: not_contains
weight: 1
---
