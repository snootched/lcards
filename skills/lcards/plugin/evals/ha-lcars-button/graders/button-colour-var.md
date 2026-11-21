---
type: regex
target: { source: file, path: kitchen.yaml }
pattern: 'var\(--lcars-card-button-color[,)]|theme:colors\.card\.button(On)?\b'
weight: 2
---
