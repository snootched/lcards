---
type: regex
target: { source: file, path: engineering.yaml }
# Small parts sit on fixed px tracks (lcars-design.md "Scale and density"): at least one
# grid track list with two px tracks in a row, such as "64px 64px" or "24px 24px".
pattern: 'grid-template-(columns|rows):[^\n]*\b\d+px\s+\d+px'
---
