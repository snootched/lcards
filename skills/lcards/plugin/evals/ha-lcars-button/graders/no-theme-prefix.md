---
type: regex
target: { source: file, path: kitchen.yaml }
pattern: 'theme:\s*lcars|theme:colors\.lcars'
match: not_contains
---
