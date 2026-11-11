---
type: regex
target: { source: file, path: living.yaml }
# Block labels at about half the block height: font_size 11 to 16 somewhere on the screen
pattern: 'font_size:\s*\W?1[1-6](px)?\b'
---
