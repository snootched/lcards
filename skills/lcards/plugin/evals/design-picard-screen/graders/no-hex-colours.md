---
type: regex
target: { source: file, path: engineering.yaml }
pattern: '#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b|rgba?\('
match: not_contains
weight: 2
---
